'use strict';
// Offline only: align phrase ends, retain every speech sample, encode one master.
const fs=require('node:fs/promises'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),folder=path.join(root,'output/audio/text-ll01'),T=require('../text-dictations.js');
const norm=s=>s.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replaceAll('’',"'").replace(/[^a-z0-9']/g,'');
function align(expected,heard){
 const a=expected.map(norm),b=heard.map(w=>norm(w.word)),matrix=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)matrix[i][j]=a[i]===b[j]?1+matrix[i+1][j+1]:Math.max(matrix[i+1][j],matrix[i][j+1]);
 const map=Array(a.length).fill(null);let i=0,j=0;
 while(i<a.length&&j<b.length){if(a[i]===b[j]){map[i]=j;i++;j++;}else if(matrix[i+1][j]>=matrix[i][j+1])i++;else j++;}
 return map;
}
async function main(){
 const approval=JSON.parse(await fs.readFile(path.join(root,'audio/texts/production-plans.json')));
 if(approval[T.catalogue[0].id]?.publishAudio!==true)throw Error('Publicació d’àudio no autoritzada. La presa local es conserva; cap arxiu públic modificat.');
 const entry=T.catalogue[0],raw=await fs.readFile(path.join(folder,'raw.wav')),recognition=JSON.parse(await fs.readFile(path.join(folder,'alignment.json'))),sha=b=>createHash('sha256').update(b).digest('hex');
 if(sha(raw)!==recognition.sha256)throw Error('Alignment belongs to another take.');
 const expected=T.text(entry).split(/\s+/u),map=align(expected,recognition.words),coverage=map.filter(v=>v!==null).length/expected.length;
 if(coverage<.85)throw Error('Insufficient ASR coverage; review without synthesizing again.');
 const bounds=[0],cuts=[];let offset=0;
 for(const phrase of entry.phrases.slice(0,-1)){
  offset+=T.wordCount(phrase);const heard=map[offset-1];if(heard===null)throw Error('Unconfirmed phrase end: '+phrase);
  const left=recognition.words[heard].end,right=recognition.words[heard+1]?.start;
  if(!right||right-left<.16)throw Error('No safe pause after: '+phrase);
  const start=Math.ceil((left+.06)*24000),end=Math.floor((right-.06)*24000);
  let best=null;
  // Quiet 20 ms windows near the gap midpoint, never inside the recognized words.
  for(let at=start;at+480<=end;at+=120){let sum=0;for(let n=0;n<480;n++){const v=raw.readInt16LE(44+(at+n)*2)/32768;sum+=v*v;}const rms=Math.sqrt(sum/480),distance=Math.abs((at+240)/24000-(left+right)/2);if(rms<.012&&(!best||distance<best.distance))best={time:(at+240)/24000,rms,distance};}
  if(!best)throw Error('No quiet verified cut after: '+phrase);
  bounds.push(Number(best.time.toFixed(5)));cuts.push({after:phrase,left,right,...best});
 }
 bounds.push(recognition.duration);
 const destination=path.join(root,'assets/audio/texts/ca/ll01-v1');await fs.mkdir(destination,{recursive:true});
 const {ffmpeg,ffmpegBinary}=require('../../sentit/tools/audio-files.cjs');
 ffmpeg(await ffmpegBinary(),['-v','error','-y','-i',path.join(folder,'raw.wav'),'-ac','1','-ar','24000','-c:a','libmp3lame','-b:a','64k',path.join(destination,'master.mp3')]);
 const bytes=await fs.readFile(path.join(destination,'master.mp3'));
 const record={path:'assets/audio/texts/ca/ll01-v1/master.mp3',bounds,seconds:recognition.duration,sha256:sha(bytes),rawSha256:sha(raw),bytes:bytes.length,voice:'Aoede',model:'gemini-3.8-flash-tts',language:'ca',variety:'central',status:'pending-listening',sourceTextSha256:sha(T.text(entry)),timing:'editorial-phrases+local-vosk+quiet-window',coverage,pronunciationValidated:false,generatedAt:'2026-11-25'};
 await fs.mkdir(path.join(root,'audio/texts'),{recursive:true});await fs.writeFile(path.join(root,'audio/texts/index.json'),JSON.stringify({[entry.id]:record},null,2)+'\n');
 const attempt=JSON.parse(await fs.readFile(path.join(folder,'attempt.json'))),recovery=JSON.parse(await fs.readFile(path.join(folder,'recovery.json')));
 await fs.writeFile(path.join(root,'audio/texts/ll01-production.json'),JSON.stringify({id:entry.id,requestHash:attempt.requestHash??attempt.hash,sourceTextSha256:record.sourceTextSha256,model:record.model,voice:record.voice,source:'Gemini API',terms:'https://ai.google.dev/gemini-api/terms',direction:require('./synthesize-text-pilot.cjs').style,newSynthesisRequests:1,localRecovery:recovery,coverage,recognized:recognition.text,cuts,pronunciationValidated:false},null,2)+'\n');
 console.log(JSON.stringify({coverage,phrases:entry.phrases.length,bounds:bounds.length,seconds:record.seconds,bytes:bytes.length,newRequests:0}));
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={align,norm};
