(function(){
 'use strict';
 const $=id=>document.getElementById(id),B=window.PlecCatalogBrowser,R=window.PlecPronunciationReview;
 const base=new URL('.',document.currentScript.src),profiles={central:'ca-central-didactic-v1',valencia:'ca-valencian-didactic-v1'};
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const icon=name=>window.PlecIcons(name);
 let storage;try{storage=window.localStorage;}catch{storage={getItem(){throw Error();},setItem(){throw Error();}};}
 const store=R.create(storage),contexts=new Map();
 let rows=[],rowIndex=new Map(),manifest={packs:[]},initial='A',limit=50,player=null,playKey=null,epoch=0;
 let deepWord='',requestedAudio='',loading=null,openVersion=0;
 function saveStatus(text='Desat en aquest navegador.'){$('review-save-status').textContent=text;const warning=store.error();$('review-storage-warning').hidden=!warning;$('review-storage-warning').textContent=warning||'';progress();}
 function currentReviews(){return store.all().filter(r=>{const variety=Object.keys(profiles).find(v=>profiles[v]===r.profile);if(!variety)return false;
  if(r.target==='ipa')return rowIndex.get(r.id)?.[variety]?.ipa===r.ipa;
  const p=packFor(variety);return p?.id===r.pack&&p.fingerprint===r.fingerprint;
 });}
 function progress(){const all=currentReviews();$('review-progress').textContent=`${all.filter(r=>r.target==='audio'&&r.status==='good').length} àudios correctes · ${all.filter(r=>r.status==='review').length} incidències · ${all.filter(r=>r.note).length} notes`;$('review-progress').title='Revisió dels enregistraments seleccionats i de la IPA actual. L’exportació conserva també les altres versions.';}
 function packFor(variety){return manifest.packs.find(p=>p.id===$(variety+'-recording').value)||null;}
 function audioContext(row,variety){const pack=packFor(variety);if(!pack?.files?.[row.id])return null;
  return {target:'audio',profile:profiles[variety],id:row.id,word:row.text,pack:pack.id,fingerprint:pack.fingerprint,ipa:pack.ipas?.[row.id]||''};
 }
 function ipaContext(row,variety){const ipa=row[variety]?.ipa;if(!ipa)return null;return {target:'ipa',profile:profiles[variety],id:row.id,word:row.text,pack:'',fingerprint:'',ipa};}
 function addContext(context){if(!context)return '';const key=R.key(context);contexts.set(key,context);return key;}
 function urlFor(row,pack){if(!pack)return null;try{const result=PlecAudioManifest.coverage(manifest,[row],'ca',base,pack.id);return result.ready?result.urls[0]:null;}catch{return null;}}
 function stop(){epoch++;if(player){player.onended=player.onerror=null;player.pause();player.removeAttribute('src');player=null;}playKey=null;refreshPlay();}
 function refreshPlay(){for(const b of document.querySelectorAll('[data-play-key]')){const playing=b.dataset.playKey===playKey;b.setAttribute('aria-pressed',String(playing));b.innerHTML=icon(playing?'square':'volume-2');}}
 function play(row,variety){const pack=packFor(variety),key=R.key(audioContext(row,variety)),url=urlFor(row,pack);if(playKey===key){stop();return;}stop();if(!url)return;
  const token=epoch;try{player=new Audio(url);playKey=key;refreshPlay();player.onended=()=>{if(token===epoch)stop();};player.onerror=()=>{if(token===epoch){stop();saveStatus('No s’ha pogut reproduir el mot. Pots deixar una nota.');}};const result=player.play();result?.catch(()=>{if(token===epoch){stop();saveStatus('No s’ha pogut reproduir el mot. Torna-ho a provar.');}});}catch{stop();saveStatus('No s’ha pogut reproduir el mot.');}
 }
 function noteHTML(context,type){const key=addContext(context),saved=context&&store.get(context),note=saved?.note||'';return context?`<label class="review-note" data-note-box="${esc(key)}" ${note?'':'hidden'}>${type==='ipa'?'Anotació sobre la IPA':'Anotació sobre l’àudio'}<textarea maxlength="1000" data-note-key="${esc(key)}" aria-label="${type==='ipa'?'Nota de la IPA':'Nota de l’àudio'} de ${esc(context.word)}">${esc(note)}</textarea></label>`:'';}
 function cell(row,variety){
  const data=row[variety],pack=packFor(variety),ac=audioContext(row,variety),ic=ipaContext(row,variety),ak=addContext(ac),ik=addContext(ic),ar=ac&&store.get(ac),ir=ic&&store.get(ic),url=urlFor(row,pack);
  const playable=!!url,disabled=ac?'':'disabled';
  const matching=pack?.kind==='ipa'&&pack.ipas?.[row.id]===data?.ipa;
  const label=!playable?'Àudio encara no disponible':pack.kind==='original'?'Original sense IPA':matching?'Prova generada amb aquesta IPA':'Prova d’una altra versió de la IPA';
  return `<section class="pronunciation-cell" data-variety="${variety}" aria-label="${variety==='central'?'Català central':'Valencià'} de ${esc(row.text)}"><span class="cell-variety">${variety==='central'?'Català central · Alba':'Valencià · Enric'}</span><div class="ipa-line">${data?.ipa?`<span class="ipa-text">${esc(data.ipa)}</span>`:'<span class="ipa-pending">IPA pendent</span>'}</div>${ic?`<button class="small-link ipa-report" type="button" data-review-key="${esc(ik)}" data-action="ipa" aria-pressed="${ir?.status==='review'}" aria-label="Notifica un error d’IPA de ${esc(row.text)} en ${variety==='central'?'català central':'valencià'}">${icon('flag')} Error d’IPA</button>`:''}${noteHTML(ic,'ipa')}<div class="audio-review-controls"><button type="button" class="review-icon" data-action="play" data-word="${esc(row.id)}" data-variety="${variety}" data-play-key="${esc(ak)}" aria-label="Escolta ${esc(row.text)} en ${variety==='central'?'català central':'valencià'}" aria-pressed="false" ${playable?'':'disabled'}>${icon('volume-2')}</button><button type="button" class="review-icon" data-action="status" data-status="good" data-review-key="${esc(ak)}" aria-pressed="${ar?.status==='good'}" title="Àudio comprovat i correcte" aria-label="Àudio correcte: ${esc(row.text)} en ${variety==='central'?'català central':'valencià'}" ${disabled}>${icon('thumbs-up')}</button><button type="button" class="review-icon" data-action="status" data-status="review" data-review-key="${esc(ak)}" aria-pressed="${ar?.status==='review'}" title="Àudio per revisar" aria-label="Revisa l’àudio de ${esc(row.text)} en ${variety==='central'?'català central':'valencià'}" ${disabled}>${icon('thumbs-down')}</button><button type="button" class="review-icon" data-action="note" data-review-key="${esc(ak)}" title="Afegeix una anotació" aria-label="Anota l’àudio de ${esc(row.text)} en ${variety==='central'?'català central':'valencià'}" ${disabled}>${icon('message-square-text')}</button></div><span class="recording-label">${esc(label)}</span>${noteHTML(ac,'audio')}</section>`;
 }
 function matchesReview(row){const filter=$('review-filter').value;if(filter==='all')return true;if(filter==='ipa')return !!(row.central?.ipa||row.valencia?.ipa);
  const audio=['central','valencia'].map(v=>audioContext(row,v)).filter(Boolean),all=[...audio,...['central','valencia'].map(v=>ipaContext(row,v)).filter(Boolean)].map(c=>store.get(c));
  if(filter.endsWith('-pending')){const context=audioContext(row,filter.split('-')[0]);return !!context&&(!store.get(context)||store.get(context).status==='pending');}
  if(filter==='good')return all.some(r=>r?.target==='audio'&&r.status==='good');
  return all.some(r=>r?.status==='review');
 }
 function render(){stop();contexts.clear();
  const view=B.buildView(rows,{query:$('pronunciation-search').value,requestedInitial:initial,predicate:matchesReview});initial=view.activeInitial;
  $('pronunciation-initials').innerHTML=B.LETTERS.map(letter=>`<button type="button" data-initial="${letter}" ${view.counts[letter]?'':'disabled'} ${initial===letter?'aria-current="true"':''}>${letter}</button>`).join('<span aria-hidden="true">|</span>');
  const visible=view.visibleEntries.slice(0,limit);
  $('pronunciation-count').textContent=`${view.total} mots · ${visible.length} de ${view.initialCount} amb la inicial ${initial||'—'}`;
  $('pronunciation-list').innerHTML=visible.map(row=>`<article class="pronunciation-row${row.text===deepWord?' is-target':''}" id="mot-${esc(row.id)}"><h2 class="pronunciation-word">${esc(row.text)}</h2>${cell(row,'central')}${cell(row,'valencia')}</article>`).join('')||'<p class="review-notice">Cap mot amb aquests criteris.</p>';
  $('more-pronunciations').hidden=visible.length>=view.initialCount;progress();
 }
 function updateReview(key,patch){const context=contexts.get(key);if(!context)return;store.set(context,patch);
  const saved=store.get(context);for(const b of document.querySelectorAll('[data-review-key]'))if(b.dataset.reviewKey===key){if(b.dataset.action==='status')b.setAttribute('aria-pressed',String(saved?.status===b.dataset.status));if(b.dataset.action==='ipa')b.setAttribute('aria-pressed',String(saved?.status==='review'));}saveStatus();
 }
 function showNote(key,focus=true){const box=[...document.querySelectorAll('[data-note-box]')].find(b=>b.dataset.noteBox===key);if(!box)return;box.hidden=false;if(focus)box.querySelector('textarea').focus();}
 $('pronunciation-list').addEventListener('click',event=>{
  const b=event.target.closest('[data-action]');if(!b||b.disabled)return;const key=b.dataset.reviewKey,context=contexts.get(key);
  if(b.dataset.action==='play'){const row=rows.find(r=>r.id===b.dataset.word);if(row)play(row,b.dataset.variety);return;}
  if(!context)return;
  if(b.dataset.action==='note')showNote(key);
  else if(b.dataset.action==='ipa'){const state=store.get(context)?.status==='review'?'pending':'review';updateReview(key,{status:state});if(state==='review')showNote(key);}
  else{const state=store.get(context)?.status===b.dataset.status?'pending':b.dataset.status;updateReview(key,{status:state});if(state==='review')showNote(key);}
 });
 $('pronunciation-list').addEventListener('input',event=>{const key=event.target.dataset.noteKey;if(key)updateReview(key,{note:event.target.value});});
 for(const id of ['pronunciation-search','review-filter','central-recording','valencia-recording'])$(id).addEventListener(id==='pronunciation-search'?'input':'change',()=>{limit=50;render();});
 $('pronunciation-initials').addEventListener('click',event=>{const b=event.target.closest('[data-initial]');if(!b||b.disabled)return;initial=b.dataset.initial;limit=50;render();});
 $('more-pronunciations').addEventListener('click',()=>{limit+=50;render();});
 function download(text,name,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
 $('export-reviews').addEventListener('click',()=>{download(JSON.stringify(store.exportData(),null,2)+'\n','plec-revisio-pronunciacions.json','application/json');saveStatus('Revisió exportada. La pots compartir o importar en un altre dispositiu.');});
 $('export-pronunciations').addEventListener('click',()=>download(R.combinedCsv(rows),'plec-pronunciacions-central-valencia.csv','text/csv;charset=utf-8'));
 $('import-reviews-open').addEventListener('click',()=>$('import-reviews').click());
 $('import-reviews').addEventListener('change',async event=>{try{const file=event.target.files[0];if(!file)return;if(file.size>20*1024*1024)throw Error();const count=store.importData(JSON.parse(await file.text()));render();saveStatus(`${count} anotacions importades; es conserva la més recent de cada versió.`);}catch{saveStatus('No s’ha pogut importar el fitxer. Les notes actuals es conserven.');}finally{event.target.value='';}});
 $('report-errors').addEventListener('click',()=>{const entries=currentReviews();if(!entries.some(r=>r.status==='review'))return saveStatus('Marca almenys una incidència abans de preparar-ne l’informe.');stop();window.open(R.issueURL(entries),'_blank','noopener,noreferrer');});
 $('review-help-open').addEventListener('click',()=>{stop();PlecMotion.open($('review-help'));});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);
 async function json(relative){const r=await fetch(new URL(relative,base));if(!r.ok)throw Error();return r.json();}
 async function load(){
  try{
   const data=await Promise.all(['central','valencian'].map(v=>json('audio/pronunciation/ca/'+v+'-didactic.json')));
   const byId=new Map();for(let i=0;i<data.length;i++){const variety=i?'valencia':'central';if(data[i].profile!==profiles[variety]||!Array.isArray(data[i].entries))throw Error();for(const e of data[i].entries){let row=byId.get(e.id);if(!row){row={id:e.id,text:e.text};byId.set(e.id,row);}if(row.text!==e.text)throw Error();row[variety]=e;}}
   rows=[...byId.values()];rowIndex=byId;
   const local=['127.0.0.1','localhost','[::1]'].includes(location.hostname);
   try{manifest=await json(local?'output/audio/review-manifest.json':'audio/review-manifest.json');if(manifest.schemaVersion!==1||!Array.isArray(manifest.packs))throw Error();manifest.packs=manifest.packs.filter(p=>Object.values(profiles).includes(p.profile)&&typeof p.fingerprint==='string'&&typeof p.id==='string');}catch{manifest={schemaVersion:1,defaultPacks:{},packs:[]};}
   for(const variety of ['central','valencia']){const packs=manifest.packs.filter(p=>p.profile===profiles[variety]);$(variety+'-recording').innerHTML=packs.length?packs.map(p=>`<option value="${esc(p.id)}">${esc(p.label)}</option>`).join(''):'<option value="">Sense àudios publicats</option>';}
   $('review-notice').textContent='Les transcripcions són propostes en revisió. Les anotacions no modifiquen els originals.';
   saveStatus('');
  }catch{loading=null;$('review-notice').dataset.error='true';$('review-notice').textContent='No s’han pogut carregar les taules. Torna a obrir aquesta vista; les notes desades es conserven.';}
 }
 async function open({word='',pack=''}={}){
  const version=++openVersion;deepWord=word;requestedAudio=pack;if(!loading)loading=load();await loading;if(version!==openVersion)return;
  if(requestedAudio){const p=manifest.packs.find(p=>p.id===requestedAudio),v=p&&Object.keys(profiles).find(v=>profiles[v]===p.profile);if(v)$(v+'-recording').value=p.id;}
  if(word){$('pronunciation-search').value=word;initial=B.initialFor(word);limit=50;}
  if(!$('catalog-pronunciations-view').hidden){render();$('pronunciation-search').focus();}
 }
 window.PlecPronunciations={open,stop};
})();
