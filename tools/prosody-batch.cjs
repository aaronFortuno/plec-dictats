'use strict';
// One authorized four-rendition request. Default is read-only planning.
const fs=require('node:fs/promises'),path=require('node:path'),{createHash}=require('node:crypto'),{parseEnv}=require('node:util');
const root=path.resolve(__dirname,'..'),shared=path.resolve(root,'../output/sentit-primera-tanda');
const batchId='ll01-four-rhythms-v1',T=require('../text-dictations.js'),P=require('../prosody.js');
const sha=value=>createHash('sha256').update(value).digest('hex');
async function read(file,fallback){try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return fallback;throw e;}}
function compile(){
 const entry=T.catalogue[0],plan=P.build(entry),content=[],items=[];
 const common='Read all four complete renditions of this Catalan dictation, in order, using the SAME Aoede adult female voice and central Catalan pronunciation. The repeated text is intentional: do not omit or summarize any repetition. Speak only the supplied transcript, including punctuation announcements, never variant numbers or directions. Clear natural teacher diction at about 130-145 words per minute within phrases, NOT slow-motion spelling. Preserve lexical stress, complete consonants and audible natural alveolar l·l (never palatal ll). Keep timbre and base speaking speed consistent across renditions. No title, introduction, music, sound effects or added words. Pauses in metadata are silent recording margins, not spoken content.';
 for(const [variantIndex,variant]of plan.variants.entries())for(const fragment of variant.fragments){
  let run=[],start=fragment.start;
  function add(text,kind,first,last,cue){
   const firstInVariant=fragment.number===1&&first===1&&kind==='dictation';
   let style=firstInVariant?(variantIndex===0?common+' ':'')+variant.direction+' ':'';
   if(firstInVariant)style+=(variantIndex?'New complete rendition; restart the transcript from the beginning. ':'Start with a clean consonant onset. ');
   if(kind==='punctuation')style+='Neutral announcement; silence 0.25 s before, 0.35 s after. ';
   else style+=/[.!?]$/u.test(text)?'Natural sentence-final fall. ':'Connected speech; continuing inflection. ';
   const isFragmentEnd=last===fragment.end&&(!plan.cues.some(c=>c.afterWord===last)||kind==='punctuation');
   if(isFragmentEnd){const after=(kind==='punctuation'?plan.pauses.afterCueMs:0)+fragment.pauseMs+(fragment.end===plan.wordCount&&variantIndex<plan.variants.length-1?3000:0);style+='Then leave '+(after/1000)+' seconds of silence, preserving the final phoneme. ';}
   content.push({type:'text',text,annotations:[{type:'speech_metadata',style:style.trim()}]});
   items.push({requestIndex:content.length-1,variant:variant.id,fragment:fragment.number,kind,start:first,end:last,...(cue?{cue}:{}),text});
  }
  for(const word of fragment.words){
   if(!run.length)start=word.index;run.push(word.text);
   const cue=fragment.cues.find(c=>c.afterWord===word.index);
   if(cue){add(run.join(' '),'dictation',start,word.index);run=[];add(cue.text+'.','punctuation',word.index,word.index,cue.text);}
  }
  if(run.length)add(run.join(' '),'dictation',start,fragment.end);
 }
 const body={model:'gemini-3.8-flash-tts',background:true,input:[{type:'user_input',content}],response_format:{type:'audio',mime_type:'audio/wav',sample_rate:24000},generation_config:{speech_config:[{voice:'Aoede'}]}};
 const spokenWords=plan.variants.reduce((n,v)=>n+v.spokenWords,0),cueCount=plan.cues.length*plan.variants.length;
 const plannedPauseSeconds=plan.variants.flatMap(v=>v.fragments).reduce((n,f)=>n+f.pauseMs/1000,0)+cueCount*(plan.pauses.beforeCueMs+plan.pauses.afterCueMs)/1000+3*(plan.variants.length-1)+2;
 const nominalSeconds=Math.ceil(spokenWords*60/130+plannedPauseSeconds),conservativeSeconds=Math.ceil((spokenWords*60/95+plannedPauseSeconds)*1.2);
 const requestHash=sha(JSON.stringify(body)),planHash=sha(JSON.stringify(require('../content/prosody/ca-ll-001-v1.json')));
 const estimate={spokenWords,cueCount,plannedPauseSeconds:Number(plannedPauseSeconds.toFixed(2)),nominalSeconds,conservativeSeconds,maximumSeconds:390,nominalWpm:130,conservativeWpm:95,safetyFactor:1.2,estimatedInputTokens:Math.ceil(Buffer.byteLength(JSON.stringify(body),'utf8')/3)};
 return {batchId,entryId:entry.id,body,items,estimate,requestHash,planHash};
}
function assertEstimate(built){if(built.estimate.conservativeSeconds>built.estimate.maximumSeconds)throw Error('El lot supera el topall preventiu de 6 min 30 s. Cap petició enviada.');if(built.estimate.estimatedInputTokens>7900)throw Error('Cal compactar les instruccions d’entrada abans d’enviar.');}
async function main(){
 const built=compile();assertEstimate(built);const folder=path.join(root,'output/audio',batchId,built.requestHash.slice(0,12));
 console.log(JSON.stringify({batch:batchId,voice:'Aoede',requestHash:built.requestHash,planHash:built.planHash,estimate:built.estimate,folder}));
 if(!process.argv.includes('--generate'))return;
 if(!process.argv.includes('--max-requests=1'))throw Error('Cal limitar el lot a una única petició.');
 const approval=await read(path.join(root,'audio/texts/batches',batchId+'.json'),null);
 if(approval?.status!=='approved-for-pilot'||approval.requestHash!==built.requestHash||approval.planHash!==built.planHash||approval.voice!=='Aoede'||approval.approvedBy!=='docent'||!approval.confirmation)throw Error('Falta una aprovació vigent del lot exacte. Cap petició enviada.');
 const attemptFile=path.join(folder,'attempt.json'),old=await read(attemptFile,null),resume=process.argv.includes('--resume');
 if(old?.status==='received'){console.log('Presa ja conservada; zero peticions noves.');return;}
 if(old&&!resume)throw Error('Hi ha un intent previ: recuperar només la seva interacció, sense reenviar.');
 const interaction=await read(path.join(folder,'interaction.json'),null);
 if(resume&&(!interaction?.id||interaction.requestHash!==built.requestHash))throw Error('No hi ha una interacció compatible per recuperar.');
 await fs.mkdir(folder,{recursive:true});
 const lockPath=path.join(shared,'production.lock'),lock=await fs.open(lockPath,'wx');
 try{
  await lock.writeFile(JSON.stringify({pid:process.pid,code:batchId,startedAt:new Date().toISOString()}));
  require('../../sentit/tools/audio-quota.cjs').assertQuota(await read(path.join(shared,'last-api-error.json'),null));
  const log=await read(path.join(shared,'request-log.json'),[]),day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles'}),today=day.format(new Date());
  if(!resume&&log.filter(i=>day.format(new Date(i.at))===today).length>=10)throw Error('Quota local diària completa. Cap petició enviada.');
  if(!resume&&log.length&&Date.now()-Date.parse(log.at(-1).at)<65000)throw Error('Una altra petició és recent. Espera 65 segons abans de l’únic enviament.');
  const key=(process.env.GEMINI_API_KEY||parseEnv(await fs.readFile(path.resolve(root,'../.private/comprensio-oral/gemini.env'),'utf8')).GEMINI_API_KEY)?.trim();if(!key)throw Error('Falta configuració privada.');
  await fs.writeFile(path.join(folder,'request.json'),JSON.stringify(built.body,null,2));await fs.writeFile(path.join(folder,'items.json'),JSON.stringify(built.items,null,2));await fs.writeFile(path.join(folder,'estimate.json'),JSON.stringify(built.estimate,null,2));
  if(!resume){const record={at:new Date().toISOString(),code:batchId,purpose:'plec-approved-four-rhythms',hash:built.requestHash,model:built.body.model,estimate:built.estimate};await fs.writeFile(attemptFile,JSON.stringify({...record,status:'reserved'},null,2));await fs.writeFile(path.join(shared,'request-log.json'),JSON.stringify([...log,record],null,2)+'\n');}
  const endpoint='https://generativelanguage.googleapis.com/v1beta/interactions';
  async function request(id){
   let response;try{response=await fetch(id?endpoint+'/'+encodeURIComponent(id):endpoint,{method:id?'GET':'POST',headers:{'x-goog-api-key':key,'Content-Type':'application/json'},...(!id?{body:JSON.stringify(built.body)}:{}),signal:AbortSignal.timeout(90000),redirect:'error'});}catch{throw Error('Connexió interrompuda. Conservar l’intent i no tornar a enviar.');}
   if(!response.ok){const diagnostic={observedAt:new Date().toISOString(),http:response.status,retryAfter:response.headers.get('retry-after')};if(response.status===429&&Number(diagnostic.retryAfter)>0)diagnostic.retryNotBefore=new Date(Date.now()+Number(diagnostic.retryAfter)*1000).toISOString();await fs.writeFile(path.join(folder,'api-error.json'),JSON.stringify(diagnostic));if(response.status===429)await fs.writeFile(path.join(shared,'last-api-error.json'),JSON.stringify(diagnostic,null,2));throw Error('Gemini HTTP '+response.status+'; cap reintent automàtic.');}
   return response.json();
  }
  const result=await require('../../sentit/tools/gemini-background.cjs').backgroundInteraction(built.body,{recordFile:path.join(folder,'interaction.json'),create:()=>request(),retrieve:request,pollMs:20000,maxWaitMs:1200000,onProgress:console.log});
  await fs.writeFile(path.join(folder,'response.json'),JSON.stringify(result));
  let audio,recovery;try{audio=require('../../sentit/tools/gemini-result.cjs').collectAudio(result).audio;}catch(error){const clips=(result.steps??[]).flatMap(s=>s.content??[]).filter(c=>c.type==='audio');if(clips.length!==1)throw error;const bytes=Buffer.from(clips[0].data,'base64');await fs.writeFile(path.join(folder,'provider-wave.wav'),bytes);const recovered=require('./streamed-text-wave.cjs').recoverStreamedWave(bytes);audio=recovered.audio;recovery=recovered.report;await fs.writeFile(path.join(folder,'recovery.json'),JSON.stringify(recovery,null,2));}
  await fs.writeFile(path.join(folder,'raw.wav'),audio);await fs.writeFile(attemptFile,JSON.stringify({status:'received',requestHash:built.requestHash,planHash:built.planHash,providerId:result.id,rawSha256:sha(audio),usage:result.usage??null,recovery:!!recovery,receivedAt:new Date().toISOString()},null,2));
  console.log('Quatre variants rebudes. Pendent de comprovació local i integració en revisió.');
 }finally{await lock.close();await fs.unlink(lockPath);}
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={compile,assertEstimate,batchId};
