'use strict';
const fs=require('node:fs'),path=require('node:path');
const A=require('./audio-plan.cjs'),G=require('./generate-audio.cjs'),R=require('./run-pronunciation-sample.cjs');
const {prepare}=require('./prepare-mallorcan-pilot.cjs'),{loadAzureEnvironment}=require('./azure-credentials.cjs'),{replaceFileSync}=require('./local-files.cjs');
const T=require('./pronunciation-table.cjs');
function reviewHtml(pilot){
 const esc=A.escapeXml,encode=p=>p.split('/').map(encodeURIComponent).join('/');
 const rows=pilot.snapshot.entries.map(e=>`<tr><th scope="row">${esc(e.text)}<small>${esc(e.ipa)}</small></th>${pilot.plans.map(p=>`<td><audio controls preload="none" aria-label="${esc(e.text+' amb '+p.name)}" data-pack="${p.pack.id}" data-src="${encode(p.pack.id+'/words/'+A.wordFileName(e.text))}"></audio></td>`).join('')}</tr>`).join('');
 return `<!doctype html><html lang="ca"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Plec · Prova mallorquina</title><style>:root{color-scheme:light dark;font:16px/1.6 system-ui}body{max-width:1120px;margin:30px auto;padding:0 20px}table{border-collapse:collapse;width:100%;min-width:760px}td,th{text-align:left;border-bottom:1px solid #8886;padding:12px}small{display:block;font-weight:400}audio{width:100%;max-width:260px}#status{padding:12px;border:1px solid #8886;border-radius:8px}.table-scroll{overflow:auto}</style><h1>Mallorquí · prova de veus</h1><p>Referència editorial: Palma, amb dicció formal/didàctica. Són propostes IPA pendents de contrast amb parlants i fonts mallorquines; escoltar la mostra no equival a validar tota la varietat. Cap àudio substitueix els enregistraments publicats. Les tres columnes utilitzen exactament la mateixa IPA i velocitat −10 %.</p><p><a href="../../ca/pronunciacio/">Criteris, decisions i fonts</a></p><p id="status" role="status">Comprovant la mostra…</p><div class="table-scroll"><table><thead><tr><th>Mot · IPA</th>${pilot.plans.map(p=>'<th>'+p.name+'</th>').join('')}</tr></thead><tbody>${rows}</tbody></table></div><script>async function refresh(){try{const r=await fetch('mallorcan-pilot-status.json',{cache:'no-store'});if(!r.ok)throw Error();const s=await r.json();document.getElementById('status').textContent=s.review==='rejected'?'Proposta d’àudio en pausa: mostra no apta per publicar (neutra tònica i geminació).':s.phase==='completed'?'54 àudios preparats; pendents de la teva escolta.':s.phase==='stopped'?'Mostra aturada: '+s.reason:s.completed+' de '+s.total+' àudios · '+(s.currentVoice||'preparant');document.querySelectorAll('audio[data-src]').forEach(a=>{if((s.readyPacks||[]).includes(a.dataset.pack)&&!a.getAttribute('src'))a.src=a.dataset.src;});if(!['completed','stopped'].includes(s.phase))setTimeout(refresh,4000);}catch{document.getElementById('status').textContent='Seguiment no disponible';setTimeout(refresh,5000);}}refresh();document.addEventListener('play',e=>{if(e.target.tagName==='AUDIO')document.querySelectorAll('audio').forEach(a=>{if(a!==e.target)a.pause()})},true);</script></html>`;
}
async function run({execute=false,confirmF0=false}={},dependencies={}){
 const profile=(dependencies.profile||T.profile)('ca-mallorcan-didactic-v1');
 if(execute&&profile.audioStatus==='on-hold'){
  console.log('Àudio mallorquí en pausa després de la mostra: no es fan peticions de síntesi.');
  return {ok:false,reason:'mallorcan-audio-on-hold'};
 }
 const pilot=prepare({write:execute});
 console.log(JSON.stringify({simulated:!execute,words:pilot.snapshot.entries.length,voices:pilot.plans.map(p=>p.name),requests:pilot.requests,characters:pilot.characters}));
 if(!execute)return {ok:true,simulated:true};
 if(!confirmF0)throw Error('Cal --confirm-f0.');
 const dir=path.join(A.ROOT,'output/audio');
 if(R.prerequisites(path.join(A.ROOT,'output'))!=='ready')throw Error('previous-batch-not-completed-or-locked');
 if(fs.existsSync(path.join(dir,'STOP')))throw Error('stop-file');
 const ledger=G.validateLedger(A.readJson(path.join(dir,'usage.json'))),month=G.utcMonth(new Date());
 if(!G.evaluateBudget(ledger,month,pilot.characters).withinBudget)throw Error('monthly-budget');
 const release=G.acquireLock(path.join(dir,'mallorcan-pilot-runner.lock'));
 const state={phase:'running',total:pilot.requests,completed:0,readyPacks:[],currentVoice:null,startedAt:new Date().toISOString(),fingerprint:pilot.fingerprint,review:'pending'};
 const save=()=>{const file=path.join(dir,'mallorcan-pilot-status.json');fs.writeFileSync(file+'.part',JSON.stringify({...state,updatedAt:new Date().toISOString()},null,2)+'\n');replaceFileSync(file+'.part',file);};
 try{
  fs.writeFileSync(path.join(dir,'comparacio-mallorqui.html'),reviewHtml(pilot));save();
  const env=(dependencies.loadEnvironment||loadAzureEnvironment)({});
  for(let i=0;i<pilot.plans.length;i++){
   const plan=pilot.plans[i];state.currentVoice=plan.name;save();
   const result=await G.runGeneration({...plan.config,execute:true,confirmF0:true,retryTransient:false},{env,fetch:dependencies.fetch||globalThis.fetch,shouldStop:()=>fs.existsSync(path.join(dir,'STOP')),onProgress:progress=>{if(Number.isInteger(progress.completed))state.completed=i*18+progress.completed;save();}});
   if(!result.ok){state.phase='stopped';state.reason=result.reason;save();return result;}
   state.readyPacks.push(plan.pack.id);state.completed=(i+1)*18;save();
  }
  state.phase='completed';save();return {ok:true};
 }catch{state.phase='stopped';state.reason='local-error';save();return {ok:false,reason:state.reason};}
 finally{release();}
}
if(require.main===module){const args=process.argv.slice(2);if(args.some(a=>!['--execute','--confirm-f0'].includes(a))){console.error('Ús: node tools/run-mallorcan-pilot.cjs [--execute --confirm-f0]');process.exitCode=1;}else run({execute:args.includes('--execute'),confirmF0:args.includes('--confirm-f0')}).then(r=>{if(!r.ok)process.exitCode=1;}).catch(e=>{console.error(/^[a-z-]+$/.test(e.message)?e.message:'No es pot preparar la mostra mallorquina.');process.exitCode=1;});}
module.exports={run,reviewHtml};
