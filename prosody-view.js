(function(){
 'use strict';
 const $=id=>document.getElementById(id),escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const seconds=ms=>(ms/1000).toLocaleString('ca')+' s';
 let plan=null,entry=null,returnFocus,review=null;
 function spoken(fragment){return fragment.words.map(word=>escape(word.text)+fragment.cues.filter(c=>c.afterWord===word.index).map(c=>' <span class="prosody-cue">'+escape(c.text)+'</span>').join('')).join(' ');}
 function fragmentCard(f,variant){const key=window.PlecProsodyReview.id(variant.id,f.number),note=review.get(key),marked=note!==undefined;return `<li class="prosody-fragment${marked?' has-error':''}" data-start="${f.start}" data-end="${f.end}" data-review-key="${key}"><button type="button" class="prosody-mark" aria-pressed="${marked}" aria-label="Marca un error: ${escape(variant.label)}, F${f.number}"><span class="prosody-fragment-meta"><span>F${f.number} · mots ${f.start}–${f.end}</span><span>${f.wordCount} mots ${window.PlecIcons('flag')}</span></span><span class="prosody-fragment-text">${spoken(f)}</span><span class="prosody-fragment-end">${escape(f.inflection)} · tall ${seconds(f.pauseMs)}</span>${f.exception?`<span class="prosody-exception"><strong>Ajust de sentit:</strong> ${escape(f.reason)}</span>`:''}</button><label class="prosody-review-note"${marked?'':' hidden'}>Què hi sents? (opcional)<textarea maxlength="1200" rows="2" aria-label="Nota de ${escape(variant.label)}, F${f.number}">${escape(note||'')}</textarea></label></li>`;}
 function reviewStatus(){
  $('prosody-review-count').textContent=review.count()+(review.count()===1?' fragment amb errors':' fragments amb errors');$('prosody-review-copy').disabled=review.count()===0;
  $('prosody-review-storage').textContent=review.error()||'Marques desades en aquest navegador. Copia-les per compartir-les.';
 }
 const players=()=>[...$('prosody-audio-grid').querySelectorAll('audio')];
 function stopAudios(){for(const player of players())player.pause();}
 function alignPlayers(){const scroll=$('prosody-dialog').querySelector('.prosody-scroll');$('prosody-audio-grid').style.paddingRight=(scroll.offsetWidth-scroll.clientWidth+parseFloat(getComputedStyle(scroll).paddingRight))+'px';}
 if(window.ResizeObserver)new ResizeObserver(alignPlayers).observe($('prosody-dialog').querySelector('.prosody-scroll'));
 else window.addEventListener('resize',alignPlayers);
 function selectVersion(id){
  $('prosody-content').dataset.variant=id;$('prosody-listening').dataset.variant=id;
  if(matchMedia('(max-width:900px)').matches)for(const player of players())if(player.dataset.audioVariant!==id)player.pause();
  for(const button of $('prosody-tabs').querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.prosodyVariant===id));
 }
 function render(){
  let storage;try{storage=localStorage;}catch{/* Session-only annotations remain available. */}
  review=window.PlecProsodyReview.create(entry,plan,storage);
  $('prosody-text-title').textContent=entry.code+' · '+entry.title;
  $('prosody-summary').textContent=`${plan.wordCount} mots · ${plan.paragraphCount} paràgrafs · 4 variants · ${plan.cues.length} locucions per variant`;
  $('prosody-tabs').innerHTML=plan.variants.map((v,i)=>`<button type="button" data-prosody-variant="${v.id}" aria-pressed="${i===0}" aria-controls="prosody-content">${escape(v.label)}</button>`).join('');
  $('prosody-content').dataset.variant=plan.variants[0].id;
  $('prosody-content').innerHTML=entry.paragraphs.map((_,p)=>`<section class="prosody-paragraph"><h3>Paràgraf ${p+1} · mots ${p?plan.paragraphEnds[p-1]+1:1}–${plan.paragraphEnds[p]}</h3><div class="prosody-grid">${plan.variants.map(v=>`<section class="prosody-column" data-variant="${v.id}"><h4>${escape(v.label)}</h4><p>${v.fragments.length} fragments en tot el dictat · ${v.exceptionCount} ajustos de sentit</p><ol class="prosody-fragments">${v.fragments.filter(f=>f.paragraph===p+1).map(f=>fragmentCard(f,v)).join('')}</ol></section>`).join('')}</div></section>`).join('');
  reviewStatus();$('prosody-review-fallback').hidden=true;
  stopAudios();
  const available=plan.variants.filter(v=>entry.audio?.variants?.[v.id]);
  $('prosody-listening').hidden=available.length===0;
  $('prosody-audio-grid').innerHTML=available.map(v=>`<section class="prosody-audio-card" data-variant="${v.id}" aria-labelledby="audio-title-${v.id}"><h4 id="audio-title-${v.id}">${escape(v.label)}<small>${v.fragments.length} fragments</small></h4><audio id="prosody-audio-${v.id}" data-audio-variant="${v.id}" controls preload="metadata" src="${escape(new URL('../'+entry.audio.variants[v.id].path,location.href).href)}" aria-label="Escolta seguida: ${escape(v.label)}"></audio><p id="prosody-audio-error-${v.id}" class="prosody-audio-error" role="alert" hidden>No s’ha pogut carregar l’àudio. <button type="button" class="small-link" data-audio-retry="${v.id}">Torna-ho a provar</button></p></section>`).join('');
  selectVersion(plan.variants[0].id);
  $('prosody-guidance').innerHTML=`<p>${escape(plan.direction)}</p><p>${escape(plan.punctuationDirection)}</p><ul>${plan.variants.map(v=>`<li><b>${escape(v.label)}:</b> ${escape(v.direction)}</li>`).join('')}</ul><p>Pauses proposades: ${seconds(plan.pauses.fragmentMs)} al tall; ${seconds(plan.pauses.paragraphMs)} al canvi de paràgraf o final. Abans de cada locució: ${seconds(plan.pauses.beforeCueMs)}; després: ${seconds(plan.pauses.afterCueMs)}.</p><p>Les pauses són de gravació. El temps per escriure continua sent lliure fins a prémer «Següent». Les ${plan.wordCount} paraules del dictat i les locucions sumen ${plan.spokenWordsPerVariant} mots locutats per variant per estimar el lot.</p>`;
  $('prosody-status').textContent='';$('prosody-dialog').querySelector('.prosody-scroll').scrollTop=0;
 }
 $('prosody-tabs').addEventListener('click',event=>{
  const button=event.target.closest('[data-prosody-variant]');if(!button)return;
  selectVersion(button.dataset.prosodyVariant);
  $('prosody-dialog').querySelector('.prosody-scroll').scrollTop=0;
  window.PlecMotion.animate($('prosody-content'),[{opacity:.4},{opacity:1}]);
 });
 $('prosody-content').addEventListener('click',event=>{
  const button=event.target.closest('.prosody-mark');if(!button)return;
  const card=button.closest('[data-review-key]');review.toggle(card.dataset.reviewKey);
  const marked=review.get(card.dataset.reviewKey)!==undefined;card.classList.toggle('has-error',marked);button.setAttribute('aria-pressed',String(marked));
  const label=card.querySelector('.prosody-review-note');label.hidden=!marked;if(!marked)label.querySelector('textarea').value='';
  window.PlecMotion.animate(card,[{opacity:.6},{opacity:1}]);reviewStatus();$('prosody-review-fallback').hidden=true;$('prosody-status').textContent='';
 });
 $('prosody-content').addEventListener('input',event=>{if(event.target.matches('textarea')){review.note(event.target.closest('[data-review-key]').dataset.reviewKey,event.target.value);reviewStatus();$('prosody-review-fallback').hidden=true;$('prosody-status').textContent='';}});
 $('prosody-review-copy').addEventListener('click',async()=>{
  if(!review?.count())return;const text=review.text();
  try{await navigator.clipboard.writeText(text);$('prosody-status').textContent='Errors copiats. Ja els pots enganxar a la conversa.';}
  catch{const field=$('prosody-review-fallback');field.value=text;field.hidden=false;field.focus();field.select();$('prosody-status').textContent='No s’ha pogut copiar automàticament. Copia el text seleccionat amb Ctrl+C o el menú del dispositiu.';}
 });
 $('prosody-audio-grid').addEventListener('play',event=>{const player=event.target;if(!player.matches('audio'))return;for(const other of players())if(other!==player)other.pause();selectVersion(player.dataset.audioVariant);},true);
 $('prosody-audio-grid').addEventListener('error',event=>{if(event.target.matches('audio'))$('prosody-audio-error-'+event.target.dataset.audioVariant).hidden=false;},true);
 $('prosody-audio-grid').addEventListener('click',event=>{const button=event.target.closest('[data-audio-retry]');if(button){$('prosody-audio-error-'+button.dataset.audioRetry).hidden=true;$('prosody-audio-'+button.dataset.audioRetry).load();}});
 $('prosody-pdf').addEventListener('click',async()=>{
  if(!plan)return;const button=$('prosody-pdf');button.disabled=true;
  try{
   const result=await window.PlecProsodyPdf.build(entry,plan),url=URL.createObjectURL(new Blob([result.bytes],{type:'application/pdf'})),a=document.createElement('a');
   a.href=url;a.download='plec-'+entry.code.toLowerCase()+'-escaleta-prosodia.pdf';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  }catch(error){$('prosody-status').textContent='No s’ha pogut preparar el PDF. '+error.message;}
  finally{button.disabled=false;}
 });
 $('prosody-dialog').addEventListener('close',()=>{stopAudios();returnFocus?.focus();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAudios();});
 window.addEventListener('pagehide',stopAudios);
 window.PlecProsodyView={open(value){entry=value;returnFocus=document.activeElement;try{plan=window.PlecProsody.build(entry);render();window.PlecMotion.open($('prosody-dialog'));}catch(error){$('text-status').textContent=error.message;}}};
})();
