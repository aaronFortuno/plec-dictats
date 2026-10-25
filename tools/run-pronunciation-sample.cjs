'use strict';
// Small audition only. Never replaces baseline recordings or activates public audio.
const fs = require('node:fs');
const path = require('node:path');
const A = require('./audio-plan.cjs');
const G = require('./generate-audio.cjs');
const {replaceFileSync} = require('./local-files.cjs');
const {loadSample} = require('./prepare-pronunciation-sample.cjs');
const {loadAzureEnvironment} = require('./azure-credentials.cjs');

function generationConfig(sample) {
  const pack = {...sample.pack, generationPolicy:{requireIpa:true}};
  const seed = {catalog:{language:pack.language,entries:sample.jobs.map(job=>({id:job.id,text:job.text,ipa:job.ipa,mode:'words'}))}};
  return {seed,manifest:{schemaVersion:1,defaultPacks:{[pack.language]:pack.id},packs:[pack]},mode:'words'};
}

function prerequisiteGate(words, instructions, locked, wordsAlive, instructionsAlive) {
  if (['failed','stopped'].includes(words?.phase) || ['failed','stopped'].includes(instructions?.phase)) return 'blocked';
  if (words?.phase !== 'completed') return ['running','preparing','retrying'].includes(words?.phase) && wordsAlive ? 'wait' : 'blocked';
  if (instructions?.phase !== 'completed') return ['waiting','running','retrying'].includes(instructions?.phase) && instructionsAlive ? 'wait' : 'blocked';
  return locked ? 'blocked' : 'ready';
}

function prerequisites(outputRoot) {
  const directory = path.join(outputRoot,'audio');
  function read(name) {try {return A.readJson(path.join(directory,name));}catch {return null;}}
  function alive(name) {try {const pid=read(name)?.pid;if(!Number.isSafeInteger(pid)||pid<1)return false;process.kill(pid,0);return true;}catch{return false;}}
  return prerequisiteGate(read('batch-status.json'),read('instruction-status.json'),fs.existsSync(path.join(directory,'usage.lock')),
    alive('batch-runner.lock'),alive('instructions-runner.lock'));
}

function reviewHtml(sample) {
  const relative = value => value.split('/').map(encodeURIComponent).join('/');
  const rows = sample.jobs.map(job=>`<section><h2>${A.escapeXml(job.text)}</h2><p>${A.escapeXml(job.note)}</p><p>Proposta IPA: <code>${A.escapeXml(job.ipa)}</code> · Pendent d’escolta${job.reviewStatus==='needs-review'?' i de contrast lingüístic':''}</p><label>Original<audio controls preload="none" src="${relative(job.baselinePath.replace('output/audio/',''))}"></audio></label><label>Prova IPA · dicció didàctica<audio controls preload="none" data-candidate="${relative(sample.pack.id+'/'+job.relativePath)}" hidden></audio><span data-pending style="display:block;margin-top:8px">Encara no disponible.</span></label></section>`).join('\n');
  return `<!doctype html><html lang="ca"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Plec · Comparació de pronunciacions</title><style>:root{color-scheme:light dark;font:17px/1.6 system-ui}body{max-width:760px;margin:40px auto;padding:0 24px}section{border-top:1px solid #8886;margin-top:28px;padding-top:12px}audio{display:block;width:100%;margin:8px 0 16px}[hidden]{display:none!important}label{display:block}code{font-family:system-ui}#status{padding:12px;border:1px solid #8886;border-radius:8px}</style><h1>Comparació de pronunciacions</h1><p>Model didàctic: accent correcte, ela geminada llarga i finals nt/nc explícits. Les proves no estan aprovades ni substitueixen els originals. No s’afegeixen vocals ni pauses dins del mot.</p><p id="status" role="status">Esperant el lot de mots i les instruccions…</p>${rows}<script>async function refresh(){try{const r=await fetch('pronunciation-sample-status.json',{cache:'no-store'});if(!r.ok)throw Error();const s=await r.json();const done=s.phase==='completed';document.getElementById('status').textContent=done?'Mostra preparada. Comprova sons, accent i naturalitat abans d’aprovar-la.':s.phase==='stopped'?'La mostra s’ha aturat. Els originals es conserven.':s.phase==='running'?'Generant la mostra: '+s.completed+' de '+s.total+' mots.':'Esperant el lot de mots i les instruccions…';if(done){document.querySelectorAll('[data-candidate]').forEach(a=>{if(!a.src)a.src=a.dataset.candidate;a.hidden=false;});document.querySelectorAll('[data-pending]').forEach(e=>e.hidden=true);}if(!done&&s.phase!=='stopped')setTimeout(refresh,5000);}catch{document.getElementById('status').textContent='Seguiment temporalment no disponible.';setTimeout(refresh,5000);}}refresh();</script></html>`;
}

async function run(options, dependencies={}) {
  const sample = dependencies.sample || loadSample();
  const config = generationConfig(sample), plan = A.buildJobs(config.seed,config.manifest,config);
  const log = dependencies.log || console.log;
  log(JSON.stringify({simulated:!options.execute,pack:plan.pack.id,...A.summarize(plan.jobs)}));
  if (!options.execute) return {ok:true,simulated:true};
  if (!options.afterCurrentBatches) throw new Error('Cal --after-current-batches.');
  const outputRoot=dependencies.outputRoot||path.join(A.ROOT,'output'), directory=path.join(outputRoot,'audio');
  fs.mkdirSync(directory,{recursive:true});
  const release=G.acquireLock(path.join(directory,'pronunciation-sample-runner.lock'));
  const state={phase:'waiting',pack:plan.pack.id,total:plan.jobs.length,completed:0,startedAt:new Date().toISOString(),review:'pending'};
  function save(){const file=path.join(directory,'pronunciation-sample-status.json');fs.writeFileSync(file+'.part',JSON.stringify({...state,updatedAt:new Date().toISOString()},null,2)+'\n');replaceFileSync(file+'.part',file);}
  const gate=dependencies.gate||(()=>prerequisites(outputRoot));
  const sleep=dependencies.sleep||(ms=>new Promise(resolve=>setTimeout(resolve,ms)));
  const shouldStop=()=>fs.existsSync(path.join(directory,'STOP'));
  try {
    save();fs.writeFileSync(path.join(directory,'comparacio-pronunciacio.html'),reviewHtml(sample),'utf8');
    for(;;){
      if(shouldStop())throw new Error('stop-file');
      const decision=gate();if(decision==='ready')break;if(decision!=='wait')throw new Error('previous-batch-not-completed');
      await sleep(15000);
    }
    state.phase='running';save();
    const result=await G.runGeneration({...config,execute:true,confirmF0:true,retryTransient:true},{
      outputRoot,env:dependencies.env||loadAzureEnvironment({}),fetch:dependencies.fetch||globalThis.fetch,
      sleep:dependencies.requestSleep,now:dependencies.now,shouldStop,log,
      onProgress:progress=>{Object.assign(state,progress);save();}
    });
    if(!result.ok)throw new Error(result.reason);
    state.phase='completed';save();return result;
  } catch(error) {
    state.phase='stopped';state.reason=/^[a-z-]+$/.test(error.message)?error.message:'local-error';save();
    log('Mostra aturada: '+state.reason+'. Sense reintents automàtics.');return {ok:false,reason:state.reason};
  } finally {release();}
}

if(require.main===module){
  const args=process.argv.slice(2);
  if(args.some(arg=>!['--execute','--after-current-batches'].includes(arg))){console.error('Ús: node tools/run-pronunciation-sample.cjs [--execute --after-current-batches]');process.exitCode=1;}
  else run({execute:args.includes('--execute'),afterCurrentBatches:args.includes('--after-current-batches')})
    .then(result=>{if(!result.ok)process.exitCode=1;}).catch(()=>{console.error('No es pot preparar la mostra.');process.exitCode=1;});
}
module.exports={generationConfig,prerequisiteGate,prerequisites,reviewHtml,run};
