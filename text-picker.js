/* Teacher text browser: filters describe the text bank, never word seed settings. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),T=window.PlecTexts,dialog=$('text-picker-dialog'),t=window.PlecLanguageTools.text;
 let entries=[],selected=null,choose=null,focuses=new Set();
 const normalize=value=>String(value).normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase().trim();
 function node(tag,className,text){const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;}
 function render(){
  const query=normalize($('text-picker-search').value),results=entries.filter(e=>(!focuses.size||e.focusLabels.some(f=>focuses.has(f)))&&normalize(e.title+' '+e.code).includes(query));
  $('text-picker-clear').hidden=!query;$('text-picker-count').textContent=results.length+' '+t(results.length===1?'dictat disponible':'dictats disponibles');
  $('text-picker-results').replaceChildren(...results.map(entry=>{
   const card=node('button','text-picker-card');card.type='button';card.dataset.textId=entry.id;card.setAttribute('aria-pressed',String(entry.id===selected));
   const meta=node('span','text-picker-card-meta'),code=node('span','text-picker-code',entry.code);meta.append(code,node('span','',T.wordCount(T.text(entry))+' '+t('mots')));card.append(meta,node('span','text-picker-card-title',entry.title),node('span','text-picker-stage',t(entry.stage)));
   const footer=node('span','text-picker-card-footer'),tags=node('span','text-picker-tags');for(const focus of entry.focusLabels)tags.append(node('span','',focus));footer.append(tags);
   if(entry.id===selected)footer.append(node('span','text-picker-selected',t('Seleccionat')));card.append(footer);
   card.addEventListener('click',()=>{choose(entry);window.PlecMotion.close(dialog);});return card;
  }));
  $('text-picker-empty').hidden=results.length>0;
  for(const button of $('text-picker-focuses').children)button.setAttribute('aria-pressed',String(button.dataset.focus?focuses.has(button.dataset.focus):!focuses.size));
  dialog.querySelector('.text-picker-scroll').scrollTop=0;
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
 window.PlecTextPicker={open(entry,onChoose){entries=T.catalogue.filter(e=>e.language===window.PlecLanguage.id);selected=entry.id;choose=onChoose;focusButtons();reset();window.PlecMotion.open(dialog);dialog.querySelector('.text-picker-scroll').scrollTop=0;$('text-picker-search').focus({preventScroll:true});}};
})();
