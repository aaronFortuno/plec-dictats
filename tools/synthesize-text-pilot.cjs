'use strict';
// A single explicitly requested Plec prototype. Separate from Sentit's production plans.
// Shared account lock/log prevent competing with Sentit; uncertain requests are never retried.
const fs=require('node:fs/promises'),path=require('node:path'),{createHash}=require('node:crypto'),{parseEnv}=require('node:util');
const root=path.resolve(__dirname,'..'),shared=path.resolve(root,'../output/sentit-primera-tanda'),folder=path.join(root,'output/audio/text-ll01');
const T=require('../text-dictations.js'),entry=T.catalogue[0],hash=value=>createHash('sha256').update(value).digest('hex');
const style='Read verbatim in Catalan, central Catalan pronunciation, as a calm adult teacher dictating to eleven-year-old pupils. Warm, clear, unhurried articulation, approximately 105 words per minute. A lightly curious opening, then an engaged explanatory tone; gently pleased at the teacher’s congratulations and an inviting final sentence. Natural falling intonation at full stops. Preserve correct lexical stress, complete initial and final consonants, no extra syllables. In l·l use a clearly sustained alveolar lateral [lː], never the palatal ll [ʎ]; audible but natural gemination. A short natural pause after each phrase item and a longer pause at sentence ends. No title, spelling out, spoken punctuation, added introduction, repetition, instructions, music or effects. Finish every final phoneme fully.';
const body={model:'gemini-3.8-flash-tts',background:true,input:[{type:'user_input',content:entry.phrases.map(text=>({type:'text',text,annotations:[{type:'speech_metadata',style}]}))}],response_format:{type:'audio',mime_type:'audio/wav',sample_rate:24000},generation_config:{speech_config:[{voice:'Aoede'}]}};
async function read(file,fallback){try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return fallback;throw e;}}
async function main(){
 const digest=hash(JSON.stringify(body));
 console.log(JSON.stringify({id:entry.id,words:T.wordCount(T.text(entry)),phrases:entry.phrases.length,voice:'Aoede',requestHash:digest,maxNewRequests:1}));
 if(!process.argv.includes('--generate'))return;
 const approval=await read(path.join(root,'audio/texts/production-plans.json'),{});
 const plan=approval[entry.id];
 if(plan?.status!=='approved'||plan.requestHash!==digest||plan.approvedBy!=='docent'||!plan.confirmation?.trim())throw Error('Síntesi no autoritzada: cal confirmació explícita del docent del text, la veu i el lot exacte. Cap petició enviada.');
 const old=await read(path.join(folder,'attempt.json'),null),resume=process.argv.includes('--resume');
 if(old&&(old.requestHash??old.hash)!==digest)throw Error('L’intent conservat correspon a una altra petició.');
 if(old?.status==='received'){console.log('Presa ja rebuda: cap petició nova.');return;}
 if(old&&!resume)throw Error('Hi ha un intent previ. Recupera només la interacció identificada; no repeteixis la petició.');
 const interaction=await read(path.join(folder,'interaction.json'),null);
 if(resume&&(!interaction?.id||interaction.requestHash!==digest))throw Error('No hi ha una interacció compatible per recuperar.');
 await fs.mkdir(folder,{recursive:true});await fs.writeFile(path.join(folder,'request.json'),JSON.stringify(body,null,2)+'\n');
 const lockPath=path.join(shared,'production.lock'),lock=await fs.open(lockPath,'wx');
 try{
  await lock.writeFile(JSON.stringify({pid:process.pid,code:entry.id,purpose:'plec-text-pilot',startedAt:new Date().toISOString()}));
  const log=await read(path.join(shared,'request-log.json'),[]),quota=await read(path.join(shared,'last-api-error.json'),null);
  require('../../sentit/tools/audio-quota.cjs').assertQuota(quota);
  if(!resume){
   const day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles'}),today=day.format(new Date());
   if(log.filter(i=>day.format(new Date(i.at))===today).length>=10)throw Error('Quota local diària completa. Cap petició nova.');
   if(log.length&&Date.now()-Date.parse(log.at(-1).at)<65000)throw Error('Hi ha una petició recent; espera almenys 65 segons. Cap petició nova.');
  }
  const env=parseEnv(await fs.readFile(path.resolve(root,'../.private/comprensio-oral/gemini.env'),'utf8')),key=env.GEMINI_API_KEY?.trim();
  if(!key)throw Error('Falta la configuració privada de Gemini.');
  if(!resume){
   const record={at:new Date().toISOString(),code:entry.id,purpose:'plec-single-text-pilot',hash:digest,model:body.model,authorization:plan.confirmation};
   await fs.writeFile(path.join(folder,'attempt.json'),JSON.stringify({...record,status:'reserved'},null,2));
   await fs.writeFile(path.join(shared,'request-log.json'),JSON.stringify([...log,record],null,2)+'\n');
  }
  const endpoint='https://generativelanguage.googleapis.com/v1beta/interactions';
  async function request(id){
   let response;try{response=await fetch(id?endpoint+'/'+encodeURIComponent(id):endpoint,{method:id?'GET':'POST',headers:{'x-goog-api-key':key,'Content-Type':'application/json'},...(!id?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(90000)});}catch{throw Error('Connexió interrompuda; revisar l’intent abans de reprendre.');}
   if(!response.ok){await fs.writeFile(path.join(folder,'api-error.json'),JSON.stringify({at:new Date().toISOString(),http:response.status,retryAfter:response.headers.get('retry-after')}));throw Error('Gemini HTTP '+response.status+'; cap reintent automàtic.');}
   return response.json();
  }
  const result=await require('../../sentit/tools/gemini-background.cjs').backgroundInteraction(body,{recordFile:path.join(folder,'interaction.json'),create:()=>request(),retrieve:request,maxWaitMs:1200000,pollMs:15000,onProgress:console.log});
  await fs.writeFile(path.join(folder,'response.json'),JSON.stringify(result));
  const {audio,blocks}=require('../../sentit/tools/gemini-result.cjs').collectAudio(result);
  await fs.writeFile(path.join(folder,'raw.wav'),audio);
  await fs.writeFile(path.join(folder,'attempt.json'),JSON.stringify({status:'received',requestHash:digest,rawSha256:hash(audio),blocks,voice:'Aoede',model:body.model,usage:result.usage??null,receivedAt:new Date().toISOString()},null,2));
  console.log('Presa rebuda i conservada. Pendent de segmentació i audició.');
 }finally{await lock.close();await fs.unlink(lockPath);}
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={body,style};
