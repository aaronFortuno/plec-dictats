/* Browsing a text is a draft choice; only the confirmation changes the worksheet. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),T=window.PlecTexts,dialog=$('text-picker-dialog'),t=window.PlecLanguageTools.text;
 let entries=[],applied=null,browsed=null,choose=null,focuses=new Set();
 const normalize=value=>String(value).normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase().trim(),wordKey=value=>value.normalize('NFC').toLocaleLowerCase();
 function node(tag,className,text){const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;}
 function targets(entry){return [...new Set(entry.focusLabels.filter(f=>!focuses.size||focuses.has(f)).flatMap(f=>entry.focusWords?.[f]||[]))];}
 function highlight(paragraph,words){
  const p=node('p'),wanted=new Set(words.map(wordKey));let end=0;
  for(const match of paragraph.matchAll(/[\p{L}\p{M}]+(?:[·-][\p{L}\p{M}]+)*/gu)){
   p.append(document.createTextNode(paragraph.slice(end,match.index)));
   p.append(wanted.has(wordKey(match[0]))?node('mark','',match[0]):document.createTextNode(match[0]));end=match.index+match[0].length;
  }
  p.append(document.createTextNode(paragraph.slice(end)));return p;
 }
 function detail(){
  const entry=entries.find(e=>e.id===browsed),content=$('text-picker-detail-content');content.replaceChildren();$('text-picker-confirm').disabled=!entry;
  if(!entry){content.append(node('h3','',t('Cap text per mostrar')));content.firstChild.id='text-picker-detail-title';return;}
  content.append(node('p','text-picker-detail-meta',entry.code+' · '+T.wordCount(T.text(entry))+' '+t('mots')+' · '+t(entry.stage)));
  const title=node('h3','',entry.title);title.id='text-picker-detail-title';title.tabIndex=-1;title.setAttribute('aria-live','polite');content.append(title);
  const tags=node('div','text-picker-tags');for(const label of entry.focusLabels)tags.append(node('span','',label));content.append(tags);if(entry.status==='draft')content.append(node('p','text-picker-review-note',t('Text per validar · Àudio no encarregat.')));
  const words=targets(entry),prose=node('div','text-picker-prose');for(const paragraph of entry.paragraphs)prose.append(highlight(paragraph,words));
  const marked=prose.querySelectorAll('mark').length;if(marked)content.append(node('p','text-picker-highlight-note',t('Mots ressaltats: {count}',{count:marked})));
  content.append(prose);$('text-picker-reading').scrollTop=0;
 }
 function preview(entry){
  browsed=entry.id;for(const button of $('text-picker-results').children)button.setAttribute('aria-pressed',String(button.dataset.textId===browsed));detail();dialog.dataset.view='detail';
  if(matchMedia('(max-width:700px), (max-width:1000px) and (max-height:520px)').matches)$('text-picker-detail-title').focus({preventScroll:true});
 }
 function render(){
  const query=normalize($('text-picker-search').value),results=entries.filter(e=>(!focuses.size||e.focusLabels.some(f=>focuses.has(f)))&&normalize(e.title+' '+e.code).includes(query));
  if(!results.some(e=>e.id===browsed))browsed=results[0]?.id||null;
  $('text-picker-clear').hidden=!query;$('text-picker-count').textContent=results.length+' '+t(results.length===1?'dictat disponible':'dictats disponibles');
  $('text-picker-results').replaceChildren(...results.map(entry=>{
   const card=node('button','text-picker-card');card.type='button';card.dataset.textId=entry.id;card.setAttribute('aria-pressed',String(entry.id===browsed));card.setAttribute('aria-controls','text-picker-reading');
   const meta=node('span','text-picker-card-meta');meta.append(node('span','text-picker-code',entry.code),node('span','',T.wordCount(T.text(entry))+' '+t('mots')));card.append(meta,node('span','text-picker-card-title',entry.title),node('span','text-picker-stage',t(entry.stage)));
   const words=targets(entry).slice(0,3);card.append(node('span','text-picker-sample',entry.focusLabels.join(' · ')+(words.length?' · '+words.join(', '):'')));
   if(entry.status==='draft')card.append(node('span','text-picker-draft',t('Text per validar')));if(entry.id===applied)card.append(node('span','text-picker-selected',t('Al full')));
   card.addEventListener('click',()=>preview(entry));return card;
  }));
  $('text-picker-empty').hidden=results.length>0;
  for(const button of $('text-picker-focuses').children)button.setAttribute('aria-pressed',String(button.dataset.focus?focuses.has(button.dataset.focus):!focuses.size));
  dialog.querySelector('.text-picker-scroll').scrollTop=0;detail();
 }
 function focusButtons(){
  const all=node('button','',t('Tots'));all.type='button';all.addEventListener('click',()=>{focuses.clear();render();});
  const buttons=[...new Set(entries.flatMap(e=>e.focusLabels))].sort((a,b)=>a.localeCompare(b,window.PlecLanguage.locale)).map(focus=>{const button=node('button','',focus);button.type='button';button.dataset.focus=focus;button.addEventListener('click',()=>{focuses.has(focus)?focuses.delete(focus):focuses.add(focus);render();});return button;});
  $('text-picker-focuses').replaceChildren(all,...buttons);
 }
 function reset(){focuses.clear();$('text-picker-search').value='';render();}
 $('text-picker-search').addEventListener('input',render);
 $('text-picker-clear').addEventListener('click',()=>{$('text-picker-search').value='';render();$('text-picker-search').focus();});
 $('text-picker-reset').addEventListener('click',()=>{reset();$('text-picker-search').focus();});
 $('text-picker-back').addEventListener('click',()=>{dialog.dataset.view='list';$('text-picker-results').querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});});
 $('text-picker-confirm').addEventListener('click',()=>{const entry=entries.find(e=>e.id===browsed);if(entry){choose(entry);window.PlecMotion.close(dialog);}});
 window.PlecTextPicker={open(entry,onChoose){entries=T.catalogue.filter(e=>e.language===window.PlecLanguage.id);applied=entry.id;browsed=entry.id;choose=onChoose;dialog.dataset.view='list';focusButtons();reset();window.PlecMotion.open(dialog);dialog.querySelector('.text-picker-scroll').scrollTop=0;$('text-picker-search').focus({preventScroll:true});}};
})();
