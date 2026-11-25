(function(){
 'use strict';
 const $=id=>document.getElementById(id),escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const seconds=ms=>(ms/1000).toLocaleString('ca')+' s';
 let plan=null,entry=null,returnFocus;
 function spoken(fragment){return fragment.words.map(word=>escape(word.text)+fragment.cues.filter(c=>c.afterWord===word.index).map(c=>' <span class="prosody-cue">'+escape(c.text)+'</span>').join('')).join(' ');}
 function fragmentCard(f){return `<li class="prosody-fragment" data-start="${f.start}" data-end="${f.end}"><p class="prosody-fragment-meta"><span>F${f.number} · mots ${f.start}–${f.end}</span><span>${f.wordCount} mots</span></p><p class="prosody-fragment-text">${spoken(f)}</p><p class="prosody-fragment-end">${escape(f.inflection)} · tall ${seconds(f.pauseMs)}</p>${f.exception?`<p class="prosody-exception"><strong>Ajust de sentit:</strong> ${escape(f.reason)}</p>`:''}</li>`;}
 function render(){
  $('prosody-text-title').textContent=entry.code+' · '+entry.title;
  $('prosody-summary').textContent=`${plan.wordCount} mots · ${plan.paragraphCount} paràgrafs · 4 variants · ${plan.cues.length} locucions per variant`;
  $('prosody-tabs').innerHTML=plan.variants.map((v,i)=>`<button type="button" data-prosody-variant="${v.id}" aria-pressed="${i===0}" aria-controls="prosody-content">${escape(v.label)}</button>`).join('');
  $('prosody-content').dataset.variant=plan.variants[0].id;
  $('prosody-content').innerHTML=entry.paragraphs.map((_,p)=>`<section class="prosody-paragraph"><h3>Paràgraf ${p+1} · mots ${p?plan.paragraphEnds[p-1]+1:1}–${plan.paragraphEnds[p]}</h3><div class="prosody-grid">${plan.variants.map(v=>`<section class="prosody-column" data-variant="${v.id}"><h4>${escape(v.label)}</h4><p>${v.fragments.length} fragments en tot el dictat · ${v.exceptionCount} ajustos de sentit</p><ol class="prosody-fragments">${v.fragments.filter(f=>f.paragraph===p+1).map(fragmentCard).join('')}</ol></section>`).join('')}</div></section>`).join('');
  $('prosody-guidance').innerHTML=`<p>${escape(plan.direction)}</p><p>${escape(plan.punctuationDirection)}</p><ul>${plan.variants.map(v=>`<li><b>${escape(v.label)}:</b> ${escape(v.direction)}</li>`).join('')}</ul><p>Pauses proposades: ${seconds(plan.pauses.fragmentMs)} al tall; ${seconds(plan.pauses.paragraphMs)} al canvi de paràgraf o final. Abans de cada locució: ${seconds(plan.pauses.beforeCueMs)}; després: ${seconds(plan.pauses.afterCueMs)}.</p><p>Les pauses són de gravació. El temps per escriure continua sent lliure fins a prémer «Següent». Les ${plan.wordCount} paraules del dictat i les locucions sumen ${plan.spokenWordsPerVariant} mots locutats per variant per estimar el lot.</p>`;
  $('prosody-status').textContent='';$('prosody-dialog').querySelector('.prosody-scroll').scrollTop=0;
 }
 $('prosody-tabs').addEventListener('click',event=>{
  const button=event.target.closest('[data-prosody-variant]');if(!button)return;
  $('prosody-content').dataset.variant=button.dataset.prosodyVariant;
  for(const control of $('prosody-tabs').querySelectorAll('button'))control.setAttribute('aria-pressed',String(control===button));
  $('prosody-dialog').querySelector('.prosody-scroll').scrollTop=0;
  window.PlecMotion.animate($('prosody-content'),[{opacity:.4},{opacity:1}]);
 });
 $('prosody-pdf').addEventListener('click',async()=>{
  if(!plan)return;const button=$('prosody-pdf');button.disabled=true;
  try{
   const result=await window.PlecProsodyPdf.build(entry,plan),url=URL.createObjectURL(new Blob([result.bytes],{type:'application/pdf'})),a=document.createElement('a');
   a.href=url;a.download='plec-'+entry.code.toLowerCase()+'-escaleta-prosodia.pdf';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  }catch(error){$('prosody-status').textContent='No s’ha pogut preparar el PDF. '+error.message;}
  finally{button.disabled=false;}
 });
 $('prosody-dialog').addEventListener('close',()=>returnFocus?.focus());
 window.PlecProsodyView={open(value){entry=value;returnFocus=document.activeElement;try{plan=window.PlecProsody.build(entry);render();window.PlecMotion.open($('prosody-dialog'));}catch(error){$('text-status').textContent=error.message;}}};
})();
