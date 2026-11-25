/* Teacher-side prototype controller. It never changes word seeds or their storage. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),T=window.PlecTexts,button=document.querySelector('[data-mode="text"]');
 const entry=T.catalogue.find(e=>e.language===window.PlecLanguage.id);
 let active=false,settings=T.options(),prepared=null,generation=0;
 if(!entry){button.disabled=true;button.title=window.PlecLanguageTools.text('Pilot disponible en català');}
 function notify(message){$('text-status').textContent=message;}
 async function render(){
  const ticket=++generation;prepared=null;$('text-download').disabled=true;$('text-open-student').disabled=false;
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode==='text')));
  $('text-fragment-summary').textContent=T.fragments(entry,settings.pace).length+' fragments · '+T.wordCount(T.text(entry))+' paraules';
  $('selection-summary').textContent='Dictat normal · '+entry.focusLabels.join(' · ');
  $('preview-layout').textContent='Plec '+settings.fold+' · model a la '+(settings.side==='start'?'primera':'segona')+' meitat';
  $('text-open-label').textContent=entry.audio?'Comença el dictat':'Previsualitza el dictat';
  document.querySelector('.dictation-nav').href=T.url(entry,settings,true,location.origin+'/');
  $('text-audio-note').textContent=entry.audio?'Aoede · català central · prova pendent d’audició':'Àudio de prova en preparació.';
  const url=T.url(entry,settings);history.replaceState(null,'',new URL(new URL(url).pathname+new URL(url).search,location.origin));
  try{
   const next=await window.PlecTextWorksheet.prepare(entry,settings);
   if(!active||ticket!==generation)return;
   prepared=next;$('sheet-preview').innerHTML=window.PlecTextWorksheet.svg(next.shapes);
   $('sheet-preview').setAttribute('aria-label','Dictat normal: dues meitats, model i espai per escriure');
   $('text-download').disabled=false;window.PlecPreview.fit();notify('');
  }catch(e){if(active&&ticket===generation)notify('No s’ha pogut preparar el full. '+e.message);}
 }
 for(const key of ['fold','side','pace','rate'])$('text-'+key).addEventListener('change',()=>{settings=T.options(Object.fromEntries(['fold','side','pace','rate'].map(k=>[k,$('text-'+k).value])));render();});
 $('text-download').addEventListener('click',()=>{
  if(!prepared)return;const url=URL.createObjectURL(new Blob([prepared.bytes],{type:'application/pdf'})),a=document.createElement('a');
  a.href=url;a.download='plec-'+entry.code.toLowerCase()+'-'+settings.fold+'.pdf';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 });
 async function copy(student){try{await navigator.clipboard.writeText(T.url(entry,settings,student));notify('Enllaç copiat.');}catch{notify('No s’ha pogut copiar l’enllaç.');}}
 $('text-share').addEventListener('click',()=>copy(false));$('text-share-student').addEventListener('click',()=>copy(true));
 $('text-open-student').addEventListener('click',()=>{location.href=T.url(entry,settings,true,location.origin+'/');});
 window.PlecTextMode={
  get active(){return active;},
  activate(input){
   if(!entry)return false;
   const id=input?.get?.('text');
   if(id&&!T.find(id,entry.language)){$('status').textContent='Aquest dictat de text no està disponible.';$('status').classList.add('visible');return false;}
   if(input)settings=T.options(Object.fromEntries(input));
   active=true;document.body.dataset.activity='text';
   for(const key of ['fold','side','pace','rate'])$('text-'+key).value=settings[key];
   $('text-title').textContent=entry.title;$('text-preview-body').textContent=T.text(entry);render();return true;
  },
  deactivate(){active=false;generation++;prepared=null;delete document.body.dataset.activity;}
 };
})();
