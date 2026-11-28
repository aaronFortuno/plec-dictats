'use strict';
// Offline only. Split the authorized take at quiet gaps; never synthesize or retime speech.
const fs=require('node:fs/promises'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),B=require('./prosody-batch.cjs'),T=require('../text-dictations.js'),P=require('../prosody.js');
const sha=v=>createHash('sha256').update(v).digest('hex');
function timingWords(words,language='ca'){
 // Local ASR spelling alternatives, never edits to the transcript or recording.
 const result=[],merged=language==='es'?{'a parte':'aparte'}:{'com a':'coma','de mar':'demà','i lusió':'il·lusió','com panys':'companys'};
 for(let i=0;i<words.length;i++){
  const word=words[i],pair=word.word+' '+words[i+1]?.word;
  if(merged[pair]){result.push({...word,word:merged[pair],end:words[++i].end});continue;}
  if(language==='ca'&&word.word==='apart')result.push({...word,word:'a'},{...word,word:'part'});else result.push(word);
 }
 return result;
}
async function main(){
 const selected=process.argv.find(arg=>arg.startsWith('--batch='))?.slice(8),b=B.compile(selected),approval=require('../audio/texts/batches/'+b.batchId+'.json');
 if(!approval.publishPilot||approval.requestHash!==b.requestHash||approval.planHash!==b.planHash)throw Error('El lot exacte no està autoritzat per publicar com a pilot.');
 const folder=path.join(root,'output/audio',b.batchId,b.requestHash.slice(0,12));
 const raw=await fs.readFile(path.join(folder,'raw.wav')),recognition=JSON.parse(await fs.readFile(path.join(folder,'alignment.json'))),attempt=JSON.parse(await fs.readFile(path.join(folder,'attempt.json')));
 if(sha(raw)!==recognition.sha256||sha(raw)!==attempt.rawSha256||attempt.requestHash!==b.requestHash)throw Error('La presa o l’alineació no correspon al lot.');
 if(recognition.language&&recognition.language!==b.entry.language)throw Error('La llengua del reconeixedor no correspon al text.');
 const overridePath=path.join(root,'audio/texts/batches',b.batchId+'-timing-review.json');
 const overrides=await fs.readFile(overridePath,'utf8').then(JSON.parse).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
 if(overrides&&(overrides.rawSha256!==sha(raw)||overrides.requestHash!==b.requestHash))throw Error('La proposta de frontera correspon a una altra presa.');
 const expected=[],ends=[];
 for(const item of b.items){expected.push(...item.text.split(/\s+/u));const next=b.items[item.requestIndex+1];if(!next||next.variant!==item.variant||next.fragment!==item.fragment)ends.push({variant:item.variant,fragment:item.fragment,afterToken:expected.length});}
 const heard=timingWords(recognition.words,b.entry.language),map=require('./prepare-text-pilot.cjs').align(expected,heard);
 for(const token of overrides?.tokens||[]){
  const index=token.token-1,found=heard.findIndex(w=>w.word===token.heardWord&&w.start===token.start&&w.end===token.end);
  if(map[index]!==null||found<0||token.expected!==expected[index]||token.status!=='pending-listening')throw Error('Proposta temporal de token incompatible.');
  const before=map.slice(0,index).findLast(n=>n!==null),after=map.slice(index+1).find(n=>n!==null);
  if(found<=before||found>=after)throw Error('La proposta temporal altera l’ordre de lectura.');map[index]=found;
 }
 const coverage=map.filter(n=>n!==null).length/expected.length;
 if(coverage<.88)throw Error('Cobertura de reconeixement insuficient: '+coverage);
 if(raw.toString('ascii',36,40)!=='data'||raw.readUInt32LE(24)!==24000||raw.readUInt16LE(22)!==1||raw.readUInt16LE(34)!==16)throw Error('Cal WAV PCM mono de 24 kHz.');
 const duration=(raw.length-44)/48000,bounds=[0],cuts=[];
 for(const end of ends.slice(0,-1)){
  let last=map[end.afterToken-1],next=map[end.afterToken];const contextualEnd=last===null;
  if(contextualEnd){const anchor=map.slice(Math.max(0,end.afterToken-4),end.afterToken-1).findLast(n=>n!==null);if(next===null||anchor===undefined||next-anchor>8||next<=anchor)throw Error('Final sense context suficient: '+JSON.stringify(end));last=next-1;}
  if(next===null){const anchor=map.slice(end.afterToken,end.afterToken+3).find(n=>n!==null);if(anchor===undefined||anchor<=last)throw Error('Inici sense context: '+JSON.stringify(end));next=last+1;}
  const left=heard[last].end,right=heard[next].start;
  // Sometimes the take connects two approved fragments without the requested pause.
  // Preserve every sample: locate a quiet 10 ms boundary close to the ASR word join,
  // flag it for listening, and let the player supply the writing pause.
  const connected=right-left<.14;
  if(connected&&map[end.afterToken]===null)throw Error('Unió sense pausa ni inici alineat: '+JSON.stringify({...end,left,right}));
  const center=(left+right)/2,window=connected?240:480,searchStart=connected?center-.04:left+.05,searchEnd=connected?center+.04:right-.05;
  let best=null;
  const step=/^ca00[3-6]-/.test(b.batchId)?24:120;
  for(let at=Math.ceil(searchStart*24000);at+window<=searchEnd*24000;at+=step){
   let sum=0;for(let n=0;n<window;n++){const v=raw.readInt16LE(44+2*(at+n))/32768;sum+=v*v;}
   const rms=Math.sqrt(sum/window),time=(at+window/2)/24000,distance=Math.abs(time-center);
   if(rms<.012&&(!best||distance<best.distance))best={time,rms,distance};
  }
  if(!best){
   const proposed=overrides?.boundaries.find(v=>v.variant===end.variant&&v.fragment===end.fragment&&v.afterToken===end.afterToken);
   if(!proposed||proposed.status!=='pending-listening'||Math.abs(proposed.time-center)>.04)throw Error('No hi ha tall silenciós segur: '+JSON.stringify(end));
   // No audio is spliced here. Keep the entire MP3 and mark the estimated player
   // stop point explicitly; a zero crossing avoids a discontinuity at that point.
   let sample=Math.round(proposed.time*24000),distance=Infinity;
   for(let at=sample-72;at<=sample+72;at++)if(raw.readInt16LE(44+2*at)*raw.readInt16LE(44+2*(at+1))<=0&&Math.abs(at-sample)<distance){best={time:at/24000,rms:null,distance:Math.abs(at-sample)};distance=best.distance;}
   if(!best)throw Error('No hi ha pas per zero a la frontera proposada.');
   Object.assign(end,{estimatedConnectedBoundary:true,requiresListening:true,boundaryNote:proposed.note});
  }
  bounds.push(best.time);cuts.push({...end,left,right,time:best.time,rms:best.rms,...(contextualEnd?{asrBoundaryUncertain:true}: {}),...(connected?{requestedPauseMissing:true,...(!end.estimatedConnectedBoundary?{quietWindowMs:10}:{}),requiresListening:true}:{})});
 }
 bounds.push(duration);
 const entry=b.entry,plan=b.plan,variants={},binary=await require('../../sentit/tools/audio-files.cjs').ffmpegBinary(),{ffmpeg}=require('../../sentit/tools/audio-files.cjs');
 const publicFolder='assets/audio/texts/'+entry.language+'/'+entry.code.toLowerCase()+'-four-v1',destination=path.join(root,publicFolder);await fs.mkdir(destination,{recursive:true});
 let offset=0;
 for(const variant of plan.variants){
  const begin=bounds[offset],finish=bounds[offset+variant.fragments.length],seconds=finish-begin,output=path.join(destination,variant.id+'.mp3');
  ffmpeg(binary,['-v','error','-y','-i',path.join(folder,'raw.wav'),'-ss',String(begin),'-t',String(seconds),'-ac','1','-ar','24000','-c:a','libmp3lame','-b:a','64k',output]);
  ffmpeg(binary,['-v','error','-i',output,'-f','null','-']);
  const bytes=await fs.readFile(output),fragments=variant.fragments.map((f,i)=>({number:f.number,text:f.text,paragraph:f.paragraph,startWord:f.start,endWord:f.end,start:Number((bounds[offset+i]-begin).toFixed(5)),end:Number((bounds[offset+i+1]-begin).toFixed(5)),cues:f.cues.map(c=>({afterWord:c.afterWord,text:c.text}))}));
  variants[variant.id]={label:variant.label,path:publicFolder+'/'+variant.id+'.mp3',seconds:Number(seconds.toFixed(5)),sha256:sha(bytes),bytes:bytes.length,fragments};offset+=fragments.length;
 }
 const record={voice:'Aoede',model:b.body.model,language:entry.language,variety:entry.language==='es'?'es-es':'central',status:'pending-listening',pronunciationValidated:false,sourceTextSha256:sha(T.text(entry)),planHash:b.planHash,requestHash:b.requestHash,rawSha256:sha(raw),seconds:duration,coverage,timing:'editorial-word-ranges+local-vosk+quiet-window',variants};
 const registry=JSON.parse(await fs.readFile(path.join(root,'audio/texts/index.json')));registry[entry.id]=record;
 await fs.writeFile(path.join(root,'audio/texts/index.json'),JSON.stringify(registry,null,2)+'\n');
 const recovery=attempt.recovery?JSON.parse(await fs.readFile(path.join(folder,'recovery.json'))):null;
 const receipt={id:b.batchId,requestHash:b.requestHash,planHash:b.planHash,voice:'Aoede',newSynthesisRequests:1,actualSeconds:duration,estimate:b.estimate,coverage,expectedSpokenWords:expected.length,recognizedSpokenWords:recognition.words.length,unmatchedWords:expected.flatMap((word,i)=>map[i]===null?[{token:i+1,word}]:[]),asrNote:'Local timing assistance with explicit merged ASR spellings (com a, apart, de mar, i lusió, com panys). Unmatched words require listening; this is not a pronunciation certificate.',rawSha256:sha(raw),usage:attempt.usage,recovery:recovery?{seconds:recovery.seconds,allPcmSamplesPreserved:recovery.allPcmSamplesPreserved,voiceRetimed:recovery.voiceRetimed,metadataBytesRemoved:recovery.metadataBytes+recovery.interleavedMetadata.removedBytes}:{format:'provider-pcm-wav',seconds:duration,allPcmSamplesPreserved:true,voiceRetimed:false,metadataBytesRemoved:0},cuts,pronunciationValidated:false};
 if(overrides)receipt.timingProposals=overrides;
 if(recognition.language)receipt.recognizer={language:recognition.language,model:recognition.model,modelSha256:recognition.modelSha256};
 await fs.writeFile(path.join(root,'audio/texts/batches',b.batchId+'-receipt.json'),JSON.stringify(receipt,null,2)+'\n');
 console.log(JSON.stringify({seconds:duration,coverage,variants:Object.values(variants).map(v=>({label:v.label,seconds:v.seconds,fragments:v.fragments.length})),newSynthesisRequests:0}));
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
