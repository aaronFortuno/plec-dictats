/* Text segments are timed ranges of one preserved take. No live speech synthesis. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),T=window.PlecTexts,params=new URL(location.href).searchParams;
 const code=params.get('text'),entry=T.find(code,window.PlecLanguage.id);
 if(!params.has('text')){
  // The same student entrance also accepts the printed text code LL01.
  $('load-form').addEventListener('submit',event=>{
   const found=T.find($('student-code').value.trim(),window.PlecLanguage.id);if(!found)return;
   event.preventDefault();event.stopImmediatePropagation();location.href=T.url(found,{},true,new URL('../../',location.href).href);
  },true);
  window.PlecTextPlayer={active:false};return;
 }
 window.PlecTextPlayer={active:true};document.body.dataset.activity='text-player';
 const root=$('focus-root');$('exit-focus').hidden=false;
 let settings=T.options(Object.fromEntries(params)),groups=entry?T.fragments(entry,settings.pace):[],index=0,plays=0,scene='ready',audio=null,loading=null,epoch=0,frame,playing=false;
 function stop(){epoch++;cancelAnimationFrame(frame);audio?.pause();playing=false;}
 function show(name){scene=name;for(const key of ['ready','player','paused','finished'])$('tx-'+key).hidden=key!==name;}
 function links(){if(!entry)return;const base=new URL('../../',location.href).href;for(const id of ['composer-link','tx-back'])$(id).href=T.url(entry,settings,false,base);}
 function setup(){
  if(!entry){$('tx-setup-error').hidden=false;$('tx-setup-error').textContent='Aquest dictat de text no està disponible en aquesta llengua.';$('tx-start').disabled=true;return;}
  $('tx-pace').value=settings.pace;$('tx-rate').value=settings.rate;
  $('tx-summary').textContent=`${entry.code} · ${T.wordCount(T.text(entry))} paraules · ${groups.length} fragments`;
  $('tx-start').disabled=!entry.audio;
  if(!entry.audio){$('tx-setup-error').hidden=false;$('tx-setup-error').textContent='L’àudio d’aquest prototip encara està en preparació.';}
  links();
 }
 function draw(){
  $('tx-number').textContent=index+1;$('tx-total').textContent='de '+groups.length;
  $('tx-listen-count').textContent=`${plays} de 3 escoltes`;
  $('tx-listen').disabled=playing||plays>=3;
  $('tx-listen-label').textContent=playing?'Escoltant…':plays>=3?'Tres escoltes completades':plays?'Torna a escoltar':'Escolta';
  $('tx-next').hidden=plays===0;$('tx-next').disabled=playing;
  $('tx-next-label').textContent=index===groups.length-1?'Acaba el dictat':'Fragment següent';
 }
 async function loadAudio(){
  if(loading)return loading;
  const player=new Audio(new URL('../../'+entry.audio.path,location.href));player.preload='auto';player.preservesPitch=true;audio=player;
  loading=new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>finish(Error('timeout')),20000);
   function finish(error){clearTimeout(timer);player.removeEventListener('loadedmetadata',ready);player.removeEventListener('error',failed);if(error)reject(error);else resolve(player);}
   function ready(){finish(Number.isFinite(player.duration)&&player.duration>=entry.audio.bounds.at(-1)-.15?null:Error('duration'));}
   function failed(){finish(Error('audio'));}
   player.addEventListener('loadedmetadata',ready);player.addEventListener('error',failed);player.load();
  }).catch(error=>{loading=null;audio=null;throw error;});
  return loading;
 }
 async function play(){
  if(playing||plays>=3||scene!=='player')return;
  const ticket=++epoch;playing=true;$('tx-error').hidden=true;draw();
  try{
   const player=await loadAudio();if(ticket!==epoch||scene!=='player')return;
   const group=groups[index];player.playbackRate=settings.rate;player.currentTime=group.start;
   await player.play();if(ticket!==epoch){player.pause();return;}
   function complete(){if(ticket!==epoch)return;stop();plays++;draw();if(plays>=3)$('tx-next').focus();}
   player.onended=complete;
   function tick(){if(ticket!==epoch||!playing)return;if(player.currentTime>=group.end){complete();return;}frame=requestAnimationFrame(tick);}
   frame=requestAnimationFrame(tick);
  }catch{
   if(ticket!==epoch)return;stop();$('tx-error').hidden=false;$('tx-error').textContent='No s’ha pogut reproduir el fragment. Comprova la connexió i torna-ho a provar.';draw();
  }
 }
 async function fullscreen(){try{if(!document.fullscreenElement&&root.requestFullscreen)await root.requestFullscreen();}catch{/* Focus mode remains usable when fullscreen is unavailable. */}}
 $('tx-start').addEventListener('click',async()=>{if(!entry?.audio)return;await fullscreen();index=0;plays=0;show('player');draw();$('tx-listen').focus();});
 $('tx-listen').addEventListener('click',play);
 $('tx-next').addEventListener('click',()=>{
  if(playing||!plays)return;stop();
  if(index===groups.length-1){show('finished');document.exitFullscreen?.().catch(()=>{});$('tx-finished-title').focus();return;}
  index++;plays=0;draw();$('tx-listen').focus();
 });
 function pause(){if(scene!=='player')return;stop();show('paused');$('tx-paused-title').focus();}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
 document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)pause();});
 $('tx-resume').addEventListener('click',async()=>{await fullscreen();show('player');draw();$('tx-listen').focus();});
 $('exit-focus').addEventListener('click',()=>{stop();show('ready');document.exitFullscreen?.().catch(()=>{});$('tx-title').focus();});
 $('tx-restart').addEventListener('click',()=>{stop();show('ready');$('tx-title').focus();});
 for(const key of ['pace','rate'])$('tx-'+key).addEventListener('change',()=>{
  settings=T.options({pace:$('tx-pace').value,rate:$('tx-rate').value});groups=T.fragments(entry,settings.pace);setup();
  const url=new URL(location.href);url.searchParams.set('pace',settings.pace);url.searchParams.set('rate',settings.rate);history.replaceState(null,'',url);
 });
 window.addEventListener('pagehide',stop);setup();show('ready');
})();
