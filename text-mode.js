/* Teacher-side prototype controller. It never changes word seeds or their storage. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),T=window.PlecTexts,button=document.querySelector('[data-mode="text"]');
 let entry=T.catalogue.find(e=>e.language===window.PlecLanguage.id);
 let active=false,settings=T.options(),prepared=null,generation=0;
 const focuses=new Set(),entries=T.catalogue.filter(e=>e.language===window.PlecLanguage.id),t=window.PlecLanguageTools.text;
 function node(tag,className,text){const e=document.createElement(tag);e.className=className||'';if(text)e.textContent=text;return e;}
 function browse(candidate){window.PlecTextPicker.open(entry,next=>{entry=next;render();},{previewId:candidate.id,focuses:candidate.focusLabels.some(f=>focuses.has(f))?[...focuses]:[]});}
 function navigation(){
  const labels=[...new Set(entries.flatMap(e=>e.focusLabels))];
  $('text-sidebar-focuses').replaceChildren(...labels.map(label=>{const b=node('button','',label);b.type='button';b.setAttribute('aria-pressed',String(focuses.has(label)));b.addEventListener('click',()=>{focuses.has(label)?focuses.delete(label):focuses.add(label);navigation();});return b;}));
  $('text-focus-all').setAttribute('aria-pressed',String(!focuses.size));
  const matches=entries.filter(e=>!focuses.size||e.focusLabels.some(f=>focuses.has(f)));
  $('text-sidebar-count').textContent=matches.length+' '+t(matches.length===1?'dictat disponible':'dictats disponibles');
  $('text-sidebar-results').replaceChildren(...matches.map(candidate=>{
   const row=node('div','text-sidebar-row'),read=node('button','text-sidebar-read'),meta=node('span','text-sidebar-meta',candidate.code+' · '+T.wordCount(T.text(candidate))+' '+t('mots'));
   row.dataset.textId=candidate.id;row.classList.toggle('is-current',candidate.id===entry?.id);read.type='button';read.append(meta,node('span','text-sidebar-title',candidate.title));read.setAttribute('aria-label',t('Llegeix el text complet')+': '+candidate.title);read.setAttribute('aria-haspopup','dialog');read.addEventListener('click',()=>browse(candidate));row.append(read);
   const use=node('button','small-link',t(candidate.id===entry?.id?'Al full':'Fes servir'));use.type='button';use.disabled=candidate.id===entry?.id;use.setAttribute('aria-label',t('Fes servir aquest dictat')+': '+candidate.title);use.addEventListener('click',()=>{entry=candidate;render();});row.append(use);return row;
  }));
 }
 $('text-focus-all').addEventListener('click',()=>{focuses.clear();navigation();});
 const layoutControls={fold:'text-fold',side:'text-side',pace:'text-pace',rate:'text-rate',fontSize:'text-font-size',lineSpacing:'text-line-spacing'};
 $('text-picker-open').addEventListener('click',()=>{if(active)window.PlecTextPicker.open(entry,next=>{entry=next;render();});});
 if(!entry){button.disabled=true;button.title=window.PlecLanguageTools.text('Pilot disponible en català');}
 function notify(message){$('text-status').textContent=t(message);}
 async function render(){
  navigation();
  $('text-title').textContent=entry.title;$('text-code').textContent=entry.code;$('text-picker-open').dataset.textId=entry.id;
  $('text-selected-meta').textContent=entry.code+' · '+T.wordCount(T.text(entry))+' '+window.PlecLanguageTools.text('mots')+' · '+window.PlecLanguageTools.text(entry.stage);
  $('text-selected-focuses').replaceChildren(...entry.focusLabels.map(label=>{const tag=document.createElement('span');tag.textContent=label;return tag;}));
  $('prosody-open').hidden=!window.PlecProsody.has(entry);
  const ticket=++generation;prepared=null;$('text-download').disabled=true;$('text-open-student').disabled=!entry.audio||entry.status==='draft';
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode==='text')));
  $('text-fragment-summary').textContent=entry.audio?t('{fragments} fragments · {words} paraules',{fragments:T.fragments(entry,settings.pace).length,words:T.wordCount(T.text(entry))}):t('{words} mots · {paragraphs} paràgrafs',{words:T.wordCount(T.text(entry)),paragraphs:entry.paragraphs.length});
  $('selection-summary').textContent='Frases · '+entry.focusLabels.join(' · ');
  $('preview-layout').textContent=t('Plec')+' '+t(settings.fold==='vertical'?'Vertical':'Horitzontal')+' · '+t(settings.fold==='vertical'?(settings.side==='start'?'Model a l’esquerra':'Model a la dreta'):(settings.side==='start'?'Model a dalt':'Model a baix'));
  $('text-layout-hint').textContent=t(settings.fold==='vertical'?'Pauta per paràgrafs, amb una línia extra a cada bloc i el model alineat al costat.':'Pauta contínua per escriure tot el text. Model compacte a l’altra part del full.');
  for(const option of $('text-side').options)option.textContent=t(settings.fold==='vertical'?(option.value==='start'?'A l’esquerra':'A la dreta'):(option.value==='start'?'A dalt':'A baix'));
  $('text-layout-error').hidden=true;
  $('text-open-label').textContent=t(entry.status==='draft'?'Pendent de validar':entry.audio?'Comença el dictat':'Àudio pendent');
  document.querySelector('.dictation-nav').href=T.url(entry,settings,true,location.origin+'/');
  $('text-audio-note').textContent=t(entry.status==='draft'?'Text per validar. Encara no se n’ha encarregat l’àudio.':entry.audio?(entry.language==='es'?'Aoede · castellà d’Espanya · prova pendent d’audició':'Aoede · català central · prova pendent d’audició'):entry.prosodyReview?.status==='approved'?'Text i escaleta validats · Àudio en preparació.':'Text validat. Escaleta per validar; àudio no encarregat.');
  const url=T.url(entry,settings);history.replaceState(null,'',new URL(new URL(url).pathname+new URL(url).search,location.origin));
  try{
   const next=await window.PlecTextWorksheet.prepare(entry,settings);
   if(!active||ticket!==generation)return;
   prepared=next;$('sheet-preview').innerHTML=window.PlecTextWorksheet.svg(next.shapes);
   $('sheet-preview').setAttribute('aria-label',t('Dictat de frases: model i espai per escriure'));
   $('text-download').disabled=false;window.PlecPreview.fit();notify('');
  }catch(e){if(active&&ticket===generation){$('text-layout-error').textContent=e.message;$('text-layout-error').hidden=false;$('sheet-preview').replaceChildren();notify(e.message);}}
 }
 function updateSettings(){
  if(['text-font-size','text-line-spacing'].some(id=>!$(id).validity.valid)){
   generation++;prepared=null;$('text-download').disabled=true;$('sheet-preview').replaceChildren();
   const message='Mida del model: de 12 a 16 pt. Interlineat: de 8 a 12 mm.';
   $('text-layout-error').textContent=message;$('text-layout-error').hidden=false;notify(message);return;
  }
  settings=T.options(Object.fromEntries(Object.entries(layoutControls).map(([key,control])=>[key,$(control).value])));render();
 }
 for(const id of Object.values(layoutControls))$(id).addEventListener($(id).type==='number'?'input':'change',updateSettings);
 $('text-download').addEventListener('click',()=>{
  if(!prepared)return;const url=URL.createObjectURL(new Blob([prepared.bytes],{type:'application/pdf'})),a=document.createElement('a');
  a.href=url;a.download='plec-'+entry.code.toLowerCase()+'-'+settings.fold+'.pdf';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 });
 async function copy(student){try{await navigator.clipboard.writeText(T.url(entry,settings,student));notify('Enllaç copiat.');}catch{notify('No s’ha pogut copiar l’enllaç.');}}
 $('text-share').addEventListener('click',()=>copy(false));$('text-share-student').addEventListener('click',()=>copy(true));
 $('text-open-student').addEventListener('click',()=>{location.href=T.url(entry,settings,true,location.origin+'/');});
 $('prosody-open').addEventListener('click',()=>{if(active)window.PlecProsodyView.open(entry);});
 window.PlecTextMode={
  get active(){return active;},
  activate(input){
   if(!entry)return false;
   const id=input?.get?.('text');
   if(id&&!T.find(id,entry.language)){$('status').textContent='Aquest dictat de text no està disponible.';$('status').classList.add('visible');return false;}
   if(id)entry=T.find(id,entry.language);
   if(input)settings=T.options(Object.fromEntries(input));
   active=true;document.body.dataset.activity='text';
   for(const [key,control]of Object.entries(layoutControls))$(control).value=settings[key];
   $('text-title').textContent=entry.title;render();return true;
  },
  deactivate(){active=false;generation++;prepared=null;delete document.body.dataset.activity;$('prosody-open').hidden=true;}
 };
})();
