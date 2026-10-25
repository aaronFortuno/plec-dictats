(function(){
 'use strict';
 const $=id=>document.getElementById(id),R=window.PlecPronunciationReview;
 const base=new URL('.',document.currentScript.src),varieties=[['central','Central · Alba','ca-central-didactic-v1'],['valencia','Valencià · Enric','ca-valencian-didactic-v1']];
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const icon=name=>window.PlecIcons(name);
 let storage;try{storage=window.localStorage;}catch{storage={getItem(){throw Error();},setItem(){throw Error();}};}
 const store=R.create(storage);let rows=[],byId=new Map(),manifest={packs:[]},published={packs:[]},loading=null,loaded=false;
 let entries=[],nextInitial=null,limit=50,deepWord='',requestedPack='',showVersion=0,player=null,playing=null,epoch=0,report=null;
 function status(text=''){$('review-save-status').textContent=text;const warning=store.error();$('review-storage-warning').hidden=!warning;$('review-storage-warning').textContent=warning||'';}
 function packFor(row,variety){
  const profile=varieties.find(v=>v[0]===variety)[2],valid=p=>p.profile===profile&&!!p.files?.[row.id];
  if(deepWord===row.text&&requestedPack){const exact=manifest.packs.find(p=>p.id===requestedPack&&valid(p));if(exact)return exact;}
  const publicPack=published.packs.find(p=>p.dialect===(variety==='central'?'central':'valencia')&&p.files?.[row.id]);
  if(publicPack){const relative=publicPack.files[row.id],id=relative.startsWith('words/')?publicPack.id:relative.split('/')[0],exact=manifest.packs.find(p=>p.id===id&&valid(p));if(exact)return exact;}
  return manifest.packs.find(p=>valid(p)&&p.id===(variety==='central'?'ca-central-alba-v1':'ca-valencian-enric-ipa-v1'))||manifest.packs.find(valid)||null;
 }
 function context(row,variety,target){const profile=varieties.find(v=>v[0]===variety)[2];
  if(target==='ipa'){const ipa=row[variety]?.ipa;return ipa?{target,profile,id:row.id,word:row.text,pack:'',fingerprint:'',ipa}:null;}
  const pack=packFor(row,variety);return pack?{target,profile,id:row.id,word:row.text,pack:pack.id,fingerprint:pack.fingerprint,ipa:pack.ipas?.[row.id]||''}:null;
 }
 function urlFor(row,variety){const pack=packFor(row,variety);if(!pack)return null;try{const result=PlecAudioManifest.coverage(manifest,[row],'ca',base,pack.id);return result.ready?result.urls[0]:null;}catch{return null;}}
 function stop(){epoch++;if(player){player.onended=player.onerror=null;player.pause();player.removeAttribute('src');player=null;}playing=null;refreshPlay();}
 function refreshPlay(){for(const button of $('pronunciation-list').querySelectorAll('[data-action=play]')){const active=playing?.id===button.dataset.word&&playing?.variety===button.dataset.variety;button.setAttribute('aria-pressed',String(active));if(button.classList.contains('review-icon'))button.innerHTML=icon(active?'square':'volume-2');}
  for(const row of $('pronunciation-list').querySelectorAll('.pronunciation-row'))row.classList.toggle('is-playing',row.dataset.word===playing?.id);
 }
 function play(row,variety){if(playing?.id===row.id&&playing.variety===variety){stop();return;}stop();const url=urlFor(row,variety);if(!url)return;
  const token=epoch;try{player=new Audio(url);playing={id:row.id,variety};refreshPlay();player.onended=()=>{if(token===epoch)stop();};player.onerror=()=>{if(token===epoch){stop();status('No s’ha pogut reproduir el mot. Torna-ho a provar.');}};player.play()?.catch(()=>{if(token===epoch){stop();status('No s’ha pogut reproduir el mot. Torna-ho a provar.');}});}catch{stop();status('No s’ha pogut reproduir el mot.');}
 }
 function flagged(row,variety){return ['audio','ipa'].some(t=>{const c=context(row,variety,t);return c&&store.get(c)?.status==='review';});}
 function cell(row,variety,label){const ipa=row[variety]?.ipa,url=urlFor(row,variety),args=`data-word="${esc(row.id)}" data-variety="${variety}"`,name=label.split(' · ')[0];
  return `<section class="pronunciation-cell" aria-label="${name} de ${esc(row.text)}"><span class="cell-variety">${esc(label)}</span><button type="button" class="ipa-play" data-action="play" ${args} title="Proposta IPA pendent de contrast. Prem per escoltar l’enregistrament disponible." aria-label="Escolta ${esc(row.text)}: ${esc(ipa||'IPA pendent')} (${name})" aria-pressed="false" ${url?'':'disabled'}><span class="ipa-text${ipa?'':' ipa-pending'}">${esc(ipa||'IPA pendent')}</span></button><button type="button" class="review-icon" data-action="play" ${args} aria-label="Escolta ${esc(row.text)} en ${name}" aria-pressed="false" ${url?'':'disabled'}>${icon('volume-2')}</button><button type="button" class="review-icon report-flag" data-action="report" ${args} aria-label="Notifica un error de ${esc(row.text)} en ${name}" aria-pressed="${flagged(row,variety)}" ${ipa||url?'':'disabled'}>${icon('flag')}</button></section>`;
 }
 function render(){stop();const visible=entries.slice(0,limit);$('pronunciation-list').innerHTML=visible.map(entry=>{const row=byId.get(entry.id)||entry;return `<article class="pronunciation-row${row.text===deepWord?' is-target':''}" data-word="${esc(row.id)}"><h2 class="pronunciation-word">${esc(row.text)}</h2>${varieties.map(v=>cell(row,v[0],v[1])).join('')}</article>`;}).join('')||'<p class="review-notice">Cap mot amb aquests criteris.</p>';
  if(entries.length>limit)$('pronunciation-list').insertAdjacentHTML('beforeend','<button type="button" class="small-link pronunciation-more" data-action="more">Mostra 50 mots més</button>');
  else if(nextInitial)$('pronunciation-list').insertAdjacentHTML('beforeend',`<button type="button" class="small-link catalog-next" data-initial="${nextInitial}">Continua amb ${nextInitial} ${icon('arrow-up-right')}</button>`);
 }
 function refreshFlags(){for(const b of $('pronunciation-list').querySelectorAll('[data-action=report]')){const row=byId.get(b.dataset.word);if(row)b.setAttribute('aria-pressed',String(flagged(row,b.dataset.variety)));}}
 function reportTarget(){return report&&context(report.row,report.variety,$('pronunciation-report-kind').value);}
 function targetChanged(){const c=reportTarget(),saved=c&&store.get(c);$('pronunciation-report-note').value=saved?.note||'';$('pronunciation-report-clear').hidden=saved?.status!=='review';}
 function openReport(row,variety){stop();report={row,variety};const label=varieties.find(v=>v[0]===variety)[1];$('pronunciation-report-word').textContent=`${row.text} · ${label}`;
  const select=$('pronunciation-report-kind');for(const o of select.options)o.disabled=!context(row,variety,o.value);
  const prior=['audio','ipa'].find(t=>{const c=context(row,variety,t);return c&&store.get(c)?.status==='review';});select.value=prior||(context(row,variety,'audio')?'audio':'ipa');targetChanged();PlecMotion.open($('pronunciation-report'));setTimeout(()=>$('pronunciation-report-note').focus(),0);
 }
 $('pronunciation-list').addEventListener('click',event=>{const b=event.target.closest('[data-action]');if(!b||b.disabled)return;if(b.dataset.action==='more'){limit+=50;render();return;}const row=byId.get(b.dataset.word);if(!row)return;if(b.dataset.action==='play')play(row,b.dataset.variety);else if(b.dataset.action==='report')openReport(row,b.dataset.variety);});
 $('pronunciation-report-kind').addEventListener('change',targetChanged);
 $('pronunciation-report-form').addEventListener('submit',event=>{event.preventDefault();const c=reportTarget(),note=$('pronunciation-report-note').value.trim();if(!c||!note){$('pronunciation-report-note').focus();return;}const record=store.set(c,{status:'review',note});refreshFlags();status('Incidència desada en aquest navegador.');PlecMotion.close($('pronunciation-report'));if(event.submitter?.value==='github')window.open(R.issueURL([record]),'_blank','noopener,noreferrer');});
 $('pronunciation-report-clear').addEventListener('click',()=>{const c=reportTarget();if(!c)return;store.set(c,{status:'pending',note:''});refreshFlags();status('Incidència retirada.');PlecMotion.close($('pronunciation-report'));});
 function download(text,name,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
 $('export-reviews').addEventListener('click',()=>{download(JSON.stringify(store.exportData(),null,2)+'\n','plec-revisio-pronunciacions.json','application/json');status('Incidències exportades.');});
 $('export-pronunciations').addEventListener('click',()=>download(R.combinedCsv(rows),'plec-pronunciacions-central-valencia.csv','text/csv;charset=utf-8'));
 $('import-reviews-open').addEventListener('click',()=>$('import-reviews').click());
 $('import-reviews').addEventListener('change',async event=>{try{const file=event.target.files[0];if(!file)return;if(file.size>20*1024*1024)throw Error();const count=store.importData(JSON.parse(await file.text()));refreshFlags();status(`${count} anotacions importades.`);}catch{status('No s’ha pogut importar el fitxer. Les anotacions actuals es conserven.');}finally{event.target.value='';}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);
 async function json(relative){const r=await fetch(new URL(relative,base));if(!r.ok)throw Error();return r.json();}
 async function load(){
  const data=await Promise.all(['central','valencian'].map(v=>json('audio/pronunciation/ca/'+v+'-didactic.json')));const index=new Map();
  for(let i=0;i<data.length;i++){const [v,,profile]=varieties[i];if(data[i].profile!==profile||!Array.isArray(data[i].entries))throw Error();for(const e of data[i].entries){let row=index.get(e.id);if(!row){row={id:e.id,text:e.text};index.set(e.id,row);}if(row.text!==e.text)throw Error();row[v]=e;}}
  rows=[...index.values()];byId=index;
  const local=['127.0.0.1','localhost','[::1]'].includes(location.hostname);
  try{manifest=await json(local?'output/audio/review-manifest.json':'audio/review-manifest.json');if(manifest.schemaVersion!==1||!Array.isArray(manifest.packs))throw Error();manifest.packs=manifest.packs.filter(p=>varieties.some(v=>v[2]===p.profile)&&typeof p.fingerprint==='string'&&typeof p.id==='string');}catch{manifest={packs:[]};}
  try{published=await json('audio/manifest.json');if(!Array.isArray(published.packs))throw Error();}catch{published={packs:[]};}
  loaded=true;status();
 }
 async function show(visibleEntries,options={}){stop();const version=++showVersion;entries=visibleEntries;nextInitial=options.nextInitial||null;deepWord=options.word||'';requestedPack=options.pack||'';limit=50;$('pronunciation-list').innerHTML='<p class="review-notice">Carregant les pronunciacions…</p>';
  try{if(!loading)loading=load();await loading;if(version!==showVersion||$('catalog-pronunciations-view').hidden)return;$('review-notice').hidden=true;render();$('pronunciation-list').parentElement.scrollTop=0;}catch{loading=null;loaded=false;if(version===showVersion){$('pronunciation-list').innerHTML='';$('review-notice').hidden=false;$('review-notice').textContent='No s’han pogut carregar les taules. Torna a obrir aquesta vista.';}}
 }
 window.PlecPronunciations={show,stop,isLoaded:()=>loaded};
})();
