(function(){
 'use strict';
 const $=id=>document.getElementById(id),R=window.PlecPronunciationReview,B=window.PlecCatalogBrowser;
 const base=new URL('.',document.currentScript.src),varieties=[['central','Central · Alba','ca-central-didactic-v1'],['valencia','Valencià · Enric','ca-valencian-didactic-v1']];
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const icon=name=>window.PlecIcons(name);
 let storage;try{storage=window.localStorage;}catch{storage={getItem(){throw Error();},setItem(){throw Error();}};}
 const store=R.create(storage);let rows=[],byId=new Map(),manifest={packs:[]},published={packs:[]},loading=null,loaded=false,failed=false;
 let config=null,initial=null,limit=50,deepWord='',requestedPack='',player=null,playing=null,epoch=0,report=null,openGeneration=0;
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
 function refreshPlay(){for(const button of $('catalog-list').querySelectorAll('[data-action=play]')){const active=playing?.id===button.dataset.word&&playing?.variety===button.dataset.variety;button.setAttribute('aria-pressed',String(active));if(button.classList.contains('review-icon'))button.innerHTML=icon(active?'square':'volume-2');}
  for(const row of $('catalog-list').querySelectorAll('.pronunciation-row'))row.classList.toggle('is-playing',row.dataset.word===playing?.id);
 }
 function play(row,variety){if(playing?.id===row.id&&playing.variety===variety){stop();return;}stop();const url=urlFor(row,variety);if(!url)return;
  const token=epoch;try{player=new Audio(url);playing={id:row.id,variety};refreshPlay();player.onended=()=>{if(token===epoch)stop();};player.onerror=()=>{if(token===epoch){stop();status('No s’ha pogut reproduir el mot. Torna-ho a provar.');}};player.play()?.catch(()=>{if(token===epoch){stop();status('No s’ha pogut reproduir el mot. Torna-ho a provar.');}});}catch{stop();status('No s’ha pogut reproduir el mot.');}
 }
 function reportContext(row,variety){const c=context(row,variety,'audio');return c?{word:c.word,variety,audioVersion:c.pack+':'+c.fingerprint}:null;}
 function reportInfo(row,variety){
  const c=reportContext(row,variety),analytics=window.PlecAnalytics,state=analytics?.getState()||{status:'unavailable'},phase=c?analytics?.reportState(c)||'idle':'idle';
  let message='Notifica un problema d’aquest àudio. S’enviarà el mot, la varietat i la versió perquè els puguem revisar.';
  if(phase==='sent')message='Avís enviat. Ja has notificat aquest enregistrament en aquesta pestanya.';
  else if(phase==='sending')message='Enviant l’avís a Umami…';
  else if(!c)message='Encara no hi ha cap enregistrament disponible per notificar.';
  else if(state.status==='disabled')message=['gpc','dnt'].includes(state.reason)?'El navegador envia '+(state.reason==='gpc'?'Global Privacy Control (GPC)':'Do Not Track')+'. Obre «Privacitat»: hi trobaràs els passos per al teu navegador.':'Els avisos estan desactivats. Obre «Privacitat» i prem «Permet temporalment» si vols enviar-ne un.';
  else if(state.status==='unavailable')message='No podem connectar amb Umami per rebre avisos. Si el bloqueges, permet-lo temporalment en aquest web i reintenta-ho des de «Privacitat».';
  else if(state.status==='loading')message='Umami s’està preparant. Els avisos s’activaran quan puguem confirmar la connexió.';
  else if(state.status==='development')message='En local no carreguem Umami. Els avisos estan disponibles a plec.ortogra.fi quan el tracking està permès.';
  return {context:c,phase,message,disabled:!c||state.status!=='ready'||phase!=='idle'};
 }
 function reportButton(row,variety,args,name){const info=reportInfo(row,variety);
  return `<span class="report-control" tabindex="${info.disabled?'0':'-1'}" data-report-tooltip="${esc(info.message)}" aria-label="${esc(info.message)}" data-report-state="${info.phase}"><button type="button" class="review-icon report-flag" data-action="report" ${args} aria-label="Notifica un problema de l’àudio de ${esc(row.text)} en ${name}" aria-pressed="${info.phase==='sent'}" ${info.disabled?'disabled':''}>${icon(info.phase==='sent'?'check':'flag')}</button></span>`;
 }
 function renderInitials(view,active){const nav=$('catalog-initials');
  if(!nav.children.length)nav.innerHTML=B.LETTERS.map(letter=>`<a href="#catalog-${letter}" data-initial="${letter}">${letter}</a>`).join('');
  for(const link of nav.querySelectorAll('a')){const letter=link.dataset.initial,count=view.counts[letter];link.setAttribute('aria-disabled',String(!count));link.tabIndex=count?0:-1;link.setAttribute('aria-label',`${letter}: ${count} mots`);if(letter===active)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');}
 }
 function cell(row,variety,label){const ipa=row[variety]?.ipa,url=urlFor(row,variety),args=`data-word="${esc(row.id)}" data-variety="${variety}"`,name=label.split(' · ')[0],shownIpa=ipa||(failed?'—':loaded?'IPA pendent':'Carregant…');
  return `<section class="pronunciation-cell" aria-label="${name} de ${esc(row.text)}"><span class="cell-variety">${esc(label)}</span><button type="button" class="ipa-play" data-action="play" ${args} title="Proposta IPA pendent de contrast. Prem per escoltar l’enregistrament disponible." aria-label="Escolta ${esc(row.text)}: ${esc(shownIpa)} (${name})" aria-pressed="false" ${url?'':'disabled'}><span class="ipa-text${ipa?'':' ipa-pending'}">${esc(shownIpa)}</span></button><button type="button" class="review-icon" data-action="play" ${args} aria-label="Escolta ${esc(row.text)} en ${name}" aria-pressed="false" ${url?'':'disabled'}>${icon('volume-2')}</button>${reportButton(row,variety,args,name)}</section>`;
 }
 function render({resetScroll=false,target=''}={}){
  if(!config)return;stop();const list=$('catalog-list'),previousScroll=list.scrollTop,tag=$('catalog-tag').value,query=$('catalog-search').value.trim(),stage=$('catalog-stage').value;
  const view=B.buildView(config.entries,{query,locale:config.locale,predicate:e=>e.mode===config.mode&&(!tag||e.tags.includes(tag))&&config.matchesStage(e,stage)&&(config.mode!=='words'||!$('catalog-basic').checked||e.basicVocabulary)});
  const active=initial&&view.counts[initial]?initial:query?null:view.activeInitial;
  const entries=active?view.groups[active]:view.entries;
  if(target){const index=entries.findIndex(e=>e.text===target);if(index>=0)limit=Math.max(50,Math.ceil((index+1)/50)*50);}
  renderInitials(view,active);
  $('catalog-clear').hidden=!query;
  $('export-pronunciations').disabled=!loaded;
  const visible=entries.slice(0,limit),shown=visible.length;
  $('catalog-count').textContent=view.total?view.total+' '+(view.total===1?'mot':'mots')+(active?' · '+active+': '+entries.length:'')+(shown<entries.length?' · '+shown+' visibles':''):'Cap mot amb aquests filtres.';
  list.innerHTML=visible.map(entry=>{const row={...entry,...byId.get(entry.id)},labels=entry.tags.map(t=>config.categories.find(c=>c.id===t)?.label||t).join(' · ');return '<article class="pronunciation-row'+(row.text===deepWord?' is-target':'')+'" data-word="'+esc(row.id)+'" tabindex="-1"><div class="catalog-word"><h3 class="pronunciation-word">'+esc(row.text)+'</h3><p class="catalog-focuses">'+esc(labels)+'</p></div>'+(config.mode==='words'?varieties.map(v=>cell(row,v[0],v[1])).join(''):'')+'</article>';}).join('')||'<div class="catalog-empty"><p>No hi ha coincidències.</p><button type="button" class="small-link" data-action="reset">Neteja els filtres</button></div>';
  if(shown<entries.length)list.insertAdjacentHTML('beforeend','<button type="button" class="small-link catalog-next" data-action="more">Mostra 50 mots més '+icon('chevron-down')+'</button>');
  else if(active&&B.nextInitial(view.counts,active))list.insertAdjacentHTML('beforeend','<button type="button" class="small-link catalog-next" data-initial="'+B.nextInitial(view.counts,active)+'">Continua amb '+B.nextInitial(view.counts,active)+' '+icon('arrow-right')+'</button>');
  $('catalog-columns').hidden=config.mode!=='words';list.classList.toggle('is-pseudo',config.mode==='pseudo');
  list.scrollTop=resetScroll?0:previousScroll;
  if(target){const id=config.entries.find(e=>e.text===target)?.id,selected=[...list.querySelectorAll('.pronunciation-row')].find(e=>e.dataset.word===id);selected?.scrollIntoView({block:'center'});}
 }
 function refreshFlags(){for(const b of $('catalog-list').querySelectorAll('[data-action=report]')){const row=byId.get(b.dataset.word);if(!row)continue;const info=reportInfo(row,b.dataset.variety),wrapper=b.closest('.report-control');b.disabled=info.disabled;b.setAttribute('aria-pressed',String(info.phase==='sent'));b.setAttribute('aria-busy',String(info.phase==='sending'));b.innerHTML=icon(info.phase==='sent'?'check':'flag');if(wrapper){wrapper.tabIndex=info.disabled?0:-1;wrapper.dataset.reportTooltip=info.message;wrapper.dataset.reportState=info.phase;wrapper.setAttribute('aria-label',info.message);}}}
 window.PlecAnalytics?.subscribe(refreshFlags);
 function reportTarget(){return report&&context(report.row,report.variety,$('pronunciation-report-kind').value);}
 function targetChanged(){const c=reportTarget(),saved=c&&store.get(c);$('pronunciation-report-note').value=saved?.note||'';$('pronunciation-report-clear').hidden=saved?.status!=='review';}
 async function openReport(row,variety){const info=reportInfo(row,variety);if(info.disabled)return;stop();status('Enviant l’avís…');
  try{const accepted=await window.PlecAnalytics.reportAudio(info.context);status(accepted?`Avís enviat. Gràcies: revisarem «${row.text}» (${variety==='central'?'català central':'valencià'}).`:'L’avís no s’ha pogut enviar. Comprova la connexió amb Umami des de «Privacitat».');}catch{status('L’avís no s’ha pogut enviar. Torna-ho a provar des de «Privacitat».');}refreshFlags();
 }
 $('catalog-list').addEventListener('click',event=>{const b=event.target.closest('[data-action]');if(!b||b.disabled)return;if(b.dataset.action==='more'){const oldCount=$('catalog-list').querySelectorAll('.pronunciation-row').length;openGeneration++;limit+=50;render();$('catalog-list').querySelectorAll('.pronunciation-row')[oldCount]?.focus({preventScroll:true});return;}if(b.dataset.action==='reset'){resetFilters();return;}if(b.dataset.action==='retry'){loading=null;loaded=false;ensureData();return;}const row=byId.get(b.dataset.word);if(!row)return;if(b.dataset.action==='play')play(row,b.dataset.variety);else if(b.dataset.action==='report')openReport(row,b.dataset.variety);});
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
 function resetFilters(){openGeneration++;initial=null;limit=50;deepWord='';requestedPack='';$('catalog-search').value='';$('catalog-tag').value='';$('catalog-stage').value='all';$('catalog-basic').checked=false;render({resetScroll:true});}
 function filtersChanged(){openGeneration++;initial=null;limit=50;deepWord='';requestedPack='';render({resetScroll:true});}
 for(const id of ['catalog-search','catalog-tag','catalog-stage','catalog-basic'])$(id).addEventListener(id==='catalog-search'?'input':'change',filtersChanged);
 $('catalog-clear').addEventListener('click',()=>{$('catalog-search').value='';filtersChanged();$('catalog-search').focus();});
 function selectInitial(event){const link=event.target.closest('[data-initial]');if(!link)return;event.preventDefault();if(link.getAttribute('aria-disabled')==='true')return;openGeneration++;initial=link.dataset.initial;limit=50;deepWord='';requestedPack='';render({resetScroll:true});}
 $('catalog-initials').addEventListener('click',selectInitial);$('catalog-list').addEventListener('click',selectInitial);
 async function ensureData(){try{failed=false;if(!loading)loading=load();await loading;$('review-notice').hidden=!!manifest.packs.length;if(!manifest.packs.length)$('review-notice').innerHTML='Els àudios no estan disponibles. <button type="button" class="small-link" data-retry>Reintenta</button>';if($('catalog-dialog').open)render();}catch{loading=null;loaded=false;$('review-notice').hidden=false;$('review-notice').innerHTML='No s’han pogut carregar les pronunciacions. <button type="button" class="small-link" data-retry>Reintenta</button>';if($('catalog-dialog').open)render();}}
 $('review-notice').addEventListener('click',e=>{if(e.target.closest('[data-retry]')){loading=null;ensureData();}});
 function open(next,{word='',pack=''}={}){
  const changed=!config||next.mode!==config.mode||next.revision!==config.revision,scopeChanged=!!config?.basic!==!!next.basic;config=next;
  if(changed){$('catalog-tag').innerHTML='<option value="">Tots els focus</option>'+config.categories.filter(c=>c.mode===config.mode).map(c=>'<option value="'+esc(c.id)+'">'+esc(c.label)+'</option>').join('');resetFilters();}
  $('catalog-title').textContent=config.mode==='words'?'El catàleg':'Les pseudoparaules';$('catalog-stage-field').hidden=config.mode==='pseudo';$('export-words-text').hidden=config.mode!=='words';$('export-pseudo-text').hidden=config.mode!=='pseudo';$('export-pronunciations').hidden=config.mode==='pseudo';document.querySelector('.catalog-hint').hidden=config.mode==='pseudo';
  $('catalog-basic-field').hidden=config.mode!=='words';$('export-basic-text').hidden=config.mode!=='words';
  if(changed||scopeChanged)$('catalog-basic').checked=!!config.basic;
  if(word&&!config.entries.some(e=>e.text===word&&e.basicVocabulary))$('catalog-basic').checked=false;
  deepWord=word;requestedPack=pack;
  if(word){const entry=config.entries.find(e=>e.text===word&&e.mode===config.mode);if(entry){initial=B.initialFor(word,config.locale);if(!config.matchesStage(entry,$('catalog-stage').value))$('catalog-stage').value='all';if($('catalog-tag').value&&!entry.tags.includes($('catalog-tag').value))$('catalog-tag').value='';}}
  const generation=++openGeneration;PlecMotion.open($('catalog-dialog'));render({target:word});if(!open.tracked){window.PlecAnalytics?.track('catalog-opened');open.tracked=true;}
  try{const url=new URL(location.href);url.searchParams.set('panel','cataleg');if(word)url.searchParams.set('mot',word);else url.searchParams.delete('mot');if(pack)url.searchParams.set('audio',pack);else url.searchParams.delete('audio');history.replaceState(null,'',url);}catch{}
  ensureData().then(()=>{if(word&&generation===openGeneration&&$('catalog-dialog').open)render({target:word});});
 }
 for(const type of ['close','cancel'])$('catalog-dialog').addEventListener(type,()=>{stop();if(type==='close')try{const url=new URL(location.href);for(const key of ['panel','mot','audio'])url.searchParams.delete(key);history.replaceState(null,'',url);}catch{}});
 window.PlecCatalogView={open,stop};
})();
