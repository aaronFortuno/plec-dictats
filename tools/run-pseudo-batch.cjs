'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const A=require('./audio-plan.cjs'),G=require('./generate-audio.cjs'),R=require('./run-pronunciation-sample.cjs');
const {prepare}=require('./prepare-pseudo-audio.cjs'),{loadAzureEnvironment}=require('./azure-credentials.cjs'),{replaceFileSync}=require('./local-files.cjs');
function reviewHtml(batch){const esc=A.escapeXml,encode=p=>p.split('/').map(encodeURIComponent).join('/');
 const base=batch.plans[0].snapshot.entries;
 return `<!doctype html><html lang="ca"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Plec · Pseudoparaules</title><style>:root{color-scheme:light dark;font:16px/1.6 system-ui}body{max-width:1000px;margin:30px auto;padding:0 18px}table{width:100%;border-collapse:collapse}th,td{text-align:left;vertical-align:top;padding:12px;border-bottom:1px solid #8886}audio{width:100%;min-width:180px}small{display:block}#status{padding:12px;border:1px solid #8886;border-radius:8px}.scroll{overflow:auto}</style><h1>96 pseudoparaules · prova d’àudio</h1><p>Propostes editorials de sons i accent, pendents d’escolta. Una pseudoparaula no té una única ortografia correcta. Compara neutralitzacions, accent i grups consonàntics; la integritat tècnica no valida la pronunciació.</p><p id="status" role="status">Preparant…</p><div class="scroll"><table><thead><tr><th>Pseudoparaula</th><th>Central · Alba</th><th>Valencià · Enric</th></tr></thead><tbody>${base.map(entry=>'<tr><th scope="row">'+esc(entry.text)+'</th>'+batch.plans.map(p=>{const e=p.snapshot.entries.find(e=>e.id===entry.id);return '<td><small>'+esc(e.ipa)+'</small><audio controls preload="none" aria-label="'+esc(entry.text+' · '+p.plan.pack.dialect)+'" data-pack="'+p.plan.pack.id+'" data-src="'+encode(p.plan.pack.id+'/pseudo/'+A.wordFileName(entry.text))+'"></audio></td>';}).join('')+'</tr>').join('')}</tbody></table></div><script>async function refresh(){try{const r=await fetch('pseudo-batch-status.json',{cache:'no-store'});if(!r.ok)throw Error();const s=await r.json();document.getElementById('status').textContent=s.phase==='completed'?'192 àudios disponibles. Revisió auditiva oberta.':s.phase==='stopped'?'Lot aturat: '+s.reason:s.completed+' de '+s.total+' · '+(s.currentVariety||'');document.querySelectorAll('audio[data-src]').forEach(a=>{if((s.readyPacks||[]).includes(a.dataset.pack)&&!a.getAttribute('src'))a.src=a.dataset.src;});if(!['completed','stopped'].includes(s.phase))setTimeout(refresh,5000);}catch{document.getElementById('status').textContent='Seguiment temporalment no disponible.';setTimeout(refresh,5000);}}refresh();document.addEventListener('play',e=>{if(e.target.tagName==='AUDIO')document.querySelectorAll('audio').forEach(a=>{if(a!==e.target)a.pause();})},true);</script></html>`;
}
async function run({execute=false,confirmF0=false}={}){
 const batch=prepare({write:execute});console.log(JSON.stringify({simulated:!execute,requests:batch.requests,characters:batch.characters,monthlyLimit:G.MONTHLY_LIMIT}));
 if(!execute)return {ok:true,simulated:true};if(!confirmF0)throw Error('Cal --confirm-f0.');
 const dir=path.join(A.ROOT,'output/audio');if(R.prerequisites(path.join(A.ROOT,'output'))!=='ready')throw Error('previous-batch-not-completed-or-locked');
 if(fs.existsSync(path.join(dir,'STOP')))throw Error('stop-file');
 const ledger=G.validateLedger(A.readJson(path.join(dir,'usage.json')));
 // Only pending files are chargeable on resume; each generator validates identity again.
 const pending=batch.plans.flatMap(p=>p.plan.jobs.map(j=>({packId:p.plan.pack.id,...j}))).filter(j=>{try{return !G.isValidMp3(fs.readFileSync(path.join(dir,j.packId,j.relativePath)));}catch{return true;}}).reduce((n,j)=>n+j.billableCharacters,0);
 if(!G.evaluateBudget(ledger,G.utcMonth(new Date()),pending).withinBudget)throw Error('monthly-budget');
 const release=G.acquireLock(path.join(dir,'pseudo-batch-runner.lock'));let power;
 const state={phase:'running',total:192,completed:0,readyPacks:[],currentVariety:null,startedAt:new Date().toISOString(),review:'pending',monthlyLimit:G.MONTHLY_LIMIT};
 const save=()=>{const file=path.join(dir,'pseudo-batch-status.json');fs.writeFileSync(file+'.part',JSON.stringify({...state,updatedAt:new Date().toISOString()},null,2)+'\n');replaceFileSync(file+'.part',file);};
 try{
  if(process.platform==='win32'){const exe=path.join(process.env.SystemRoot||'C:/Windows','System32/WindowsPowerShell/v1.0/powershell.exe');power=spawn(exe,['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',path.join(__dirname,'keep-audio-awake.ps1'),'-BatchPid',String(process.pid)],{windowsHide:true,stdio:'ignore'});power.on('error',()=>{});}
  fs.writeFileSync(path.join(dir,'pseudoparaules.html'),reviewHtml(batch));save();const env=loadAzureEnvironment({});
  for(let i=0;i<batch.plans.length;i++){
   const p=batch.plans[i];state.currentVariety=p.plan.pack.dialect;save();
   const result=await G.runGeneration({...p.config,execute:true,confirmF0:true,retryTransient:true},{env,fetch:globalThis.fetch,shouldStop:()=>fs.existsSync(path.join(dir,'STOP')),onProgress:progress=>{if(Number.isInteger(progress.completed))state.completed=i*96+progress.completed;if(progress.phase)state.phase=progress.phase;state.pendingWord=progress.pendingWord||null;state.retryAt=progress.retryAt||null;save();}});
   if(!result.ok){state.phase='stopped';state.reason=result.reason;save();return result;}
   state.readyPacks.push(p.plan.pack.id);state.completed=(i+1)*96;save();
  }
  state.phase='completed';save();return {ok:true};
 }catch{state.phase='stopped';state.reason='local-error';save();return {ok:false,reason:state.reason};}
 finally{if(power)power.kill();release();}
}
if(require.main===module){const args=process.argv.slice(2);if(args.some(a=>!['--execute','--confirm-f0'].includes(a))){console.error('Ús: node tools/run-pseudo-batch.cjs [--execute --confirm-f0]');process.exitCode=1;}else run({execute:args.includes('--execute'),confirmF0:args.includes('--confirm-f0')}).then(r=>{if(!r.ok)process.exitCode=1;}).catch(e=>{console.error(/^[a-z-]+$/.test(e.message)?e.message:'No es pot preparar el lot.');process.exitCode=1;});}
module.exports={run,reviewHtml};
