/* Text segments are timed ranges of one preserved take. No live speech synthesis. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),T=window.PlecTexts,params=new URL(location.href).searchParams,t=window.PlecLanguageTools.text;
 const code=params.get('text'),entry=T.find(code,window.PlecLanguage.id);
 if(!params.has('text')){
  // The same student entrance also accepts the printed text code CA001.
  $('load-form').addEventListener('submit',event=>{
   const found=T.find($('student-code').value.trim(),window.PlecLanguage.id);if(!found)return;
   event.preventDefault();event.stopImmediatePropagation();location.href=T.url(found,{},true,new URL('../../',location.href).href);
  },true);
  window.PlecTextPlayer={active:false};return;
 }
 window.PlecTextPlayer={active:true};document.body.dataset.activity='text-player';
 const root=$('focus-root');$('exit-focus').hidden=false;
 $('exit-focus').setAttribute('aria-label',t('Tanca el dictat i torna al preparador'));$('exit-focus').title=t('Tanca el dictat i torna al preparador');
 let settings=T.options(Object.fromEntries(params)),groups=entry?T.fragments(entry,settings.pace):[],index=0,plays=0,completedThrough=0,scene='ready',audio=null,loading=null,loadedPath=null,epoch=0,frame,playing=false,automatic=true,waitFactor=1;
 const controls={pace:{label:'Mots',less:'Menys mots per fragment',more:'Més mots per fragment',values:[2,4,6,10],format:value=>({2:'2–3',4:'4–5',6:'6–8',10:'9–12'})[value]},rate:{label:'Velocitat',less:'Llegeix més a poc',more:'Llegeix més ràpid',values:[.8,.9,1],format:value=>Math.round(value*100)+' %'},wait:{label:'Pausa',less:'Menys temps per escriure',more:'Més temps per escriure',values:[.8,1,1.25],format:value=>({'0.8':'4–10 s','1':'4–12 s','1.25':'4–15 s'})[value]}};
 for(const [mount,prefix]of [['tx-ready-controls','tx-'],['tx-adjust','tx-adjust-']])$(mount).innerHTML=Object.entries(controls).map(([key,c])=>`<div class="tx-step"><span id="${prefix+key}-label">${t(c.label)}</span><div role="group" aria-labelledby="${prefix+key}-label"><button type="button" data-adjust="${key}" data-step="-1" aria-label="${t(c.less)}" title="${t(c.less)}">−</button><output id="${prefix+key}" aria-live="polite"></output><button type="button" data-adjust="${key}" data-step="1" aria-label="${t(c.more)}" title="${t(c.more)}">+</button></div></div>`).join('');
 function syncControls(){for(const mount of ['tx-ready-controls','tx-adjust'])for(const [key,c]of Object.entries(controls)){const row=$(mount).querySelector(`[data-adjust="${key}"]`).closest('.tx-step'),value=key==='wait'?waitFactor:settings[key],at=c.values.indexOf(value);row.querySelector('output').textContent=c.format(value);for(const button of row.querySelectorAll('button'))button.disabled=!entry||(Number(button.dataset.step)<0?at===0:at===c.values.length-1);}}
 const repeat=window.PlecTextRepeat.create({onTick:seconds=>{$('tx-countdown').hidden=false;$('tx-countdown').textContent='Tornaràs a sentir el fragment d’aquí a '+seconds+' s';},onEnd:()=>{cancelRepeat();if(automatic&&scene==='player'&&!document.hidden&&plays<3)play();}});
 function cancelRepeat(){repeat.cancel();$('tx-countdown').hidden=true;}
 function stop(){epoch++;cancelAnimationFrame(frame);cancelRepeat();audio?.pause();playing=false;}
 function wait(){if(automatic&&scene==='player'&&plays<3&&!document.hidden)repeat.start(groups[index].words,waitFactor);}
 function show(name){scene=name;for(const key of ['ready','player','paused','finished'])$('tx-'+key).hidden=key!==name;}
 function links(){if(!entry)return;const base=new URL('../../',location.href).href;for(const id of ['composer-link','tx-back'])$(id).href=T.url(entry,settings,false,base);}
 function codePicture(id,code){const p=window.PlecRhythmCode.picture(code),image=$(id);image.hidden=!p;if(p){image.src=new URL('../../'+p.image,location.href).href;image.alt=p.picture;}}
 function rhythmResult(){const code=window.PlecRhythmCode.encode(settings,waitFactor);$('tx-rhythm-result').textContent=code;codePicture('tx-rhythm-picture',code);codePicture('tx-rhythm-preview',code);$('tx-rhythm-input').value=code;$('tx-rhythm-status').textContent='';$('tx-rhythm-input').setAttribute('aria-invalid','false');$('tx-rhythm-summary').textContent=controls.pace.format(settings.pace)+' mots · '+controls.rate.format(settings.rate)+' · pausa '+controls.wait.format(waitFactor);$('tx-rhythm-copy-status').textContent='';}
 function saveUrl(){const url=new URL(location.href);url.searchParams.set('pace',settings.pace);url.searchParams.set('rate',settings.rate);history.replaceState(null,'',url);}
 function setup(){
  syncControls();
  if(!entry){$('tx-setup-error').hidden=false;$('tx-setup-error').textContent='Aquest dictat de text no està disponible en aquesta llengua.';$('tx-start').disabled=true;return;}
  $('tx-summary').textContent=entry.code+' · '+t('{words} paraules · {fragments} fragments',{words:T.wordCount(T.text(entry)),fragments:groups.length});
  $('tx-start').disabled=!entry.audio||entry.status==='draft';
  if(!entry.audio||entry.status==='draft'){$('tx-setup-error').hidden=false;$('tx-setup-error').textContent=t(entry.status==='draft'?'Text pendent de validació docent. Encara no se n’ha encarregat l’àudio.':entry.status==='approved-text'?'Text validat. L’escaleta de prosòdia està pendent de validació; encara no hi ha àudio.':'L’àudio d’aquest prototip encara està en preparació.');document.querySelector('#tx-ready .tx-pilot').textContent=t('Àudio no disponible.');}
  links();
 }
 function draw(){
  $('tx-number').textContent=index+1;$('tx-total').textContent='de '+groups.length;
  $('tx-listen-count').textContent=`${plays} de 3 escoltes`;
  $('tx-listen').disabled=playing||plays>=3;
  $('tx-listen-label').textContent=playing?'Escoltant…':plays>=3?'Tres escoltes completades':plays?'Torna a escoltar':'Escolta';
  $('tx-next').hidden=plays===0;$('tx-next').disabled=playing;
  $('tx-next-label').textContent=index===groups.length-1?'Acaba el dictat':'Fragment següent';
  $('tx-auto').setAttribute('aria-pressed',String(automatic));$('tx-auto').textContent=automatic?'Atura l’escolta automàtica':'Activa l’escolta automàtica';$('tx-auto-ready').checked=automatic;
 }
 async function loadAudio(){
  const group=groups[index],path=group.path||entry.audio.path;
  if(loadedPath!==path){audio?.pause();loading=null;}
  if(loading)return loading;
  const player=new Audio(new URL('../../'+path,location.href));player.preload='auto';player.preservesPitch=true;audio=player;loadedPath=path;
  loading=new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>finish(Error('timeout')),20000);
   function finish(error){clearTimeout(timer);player.removeEventListener('loadedmetadata',ready);player.removeEventListener('error',failed);if(error)reject(error);else resolve(player);}
   function ready(){finish(Number.isFinite(player.duration)&&player.duration>=(group.duration||entry.audio.bounds?.at(-1)||group.end)-.15?null:Error('duration'));}
   function failed(){finish(Error('audio'));}
   player.addEventListener('loadedmetadata',ready);player.addEventListener('error',failed);player.load();
  }).catch(error=>{if(audio===player){loading=null;audio=null;loadedPath=null;}throw error;});
  return loading;
 }
 async function play(){
  if(playing||plays>=3||scene!=='player')return;
  cancelRepeat();const ticket=++epoch;playing=true;$('tx-error').hidden=true;draw();
  function failed(){if(ticket!==epoch)return;stop();automatic=false;$('tx-error').hidden=false;$('tx-error').textContent='No s’ha pogut reproduir el fragment. Comprova la connexió i torna-ho a provar.';draw();}
  try{
   const player=await loadAudio();if(ticket!==epoch||scene!=='player')return;
   player.onerror=failed;
   const group=groups[index];player.playbackRate=settings.rate;player.currentTime=group.start;
   await player.play();if(ticket!==epoch){player.pause();return;}
   function complete(){if(ticket!==epoch)return;stop();plays++;draw();if(plays>=3)$('tx-next').focus();else wait();}
   player.onended=complete;
   function tick(){if(ticket!==epoch||!playing)return;if(player.currentTime>=group.end){complete();return;}frame=requestAnimationFrame(tick);}
   frame=requestAnimationFrame(tick);
  }catch{failed();}
 }
 async function fullscreen(){try{if(!document.fullscreenElement&&root.requestFullscreen)await root.requestFullscreen();}catch{/* Focus mode remains usable when fullscreen is unavailable. */}}
 $('tx-start').addEventListener('click',async()=>{if(!entry?.audio)return;automatic=$('tx-auto-ready').checked;await fullscreen();index=0;plays=0;completedThrough=0;show('player');draw();$('tx-listen').focus();if(automatic&&!document.hidden)play();});
 $('tx-listen').addEventListener('click',play);
 $('tx-next').addEventListener('click',()=>{
  if(playing||!plays)return;stop();
  if(index===groups.length-1){rhythmResult();show('finished');document.exitFullscreen?.().catch(()=>{});$('tx-finished-title').focus();return;}
  completedThrough=Math.max(completedThrough,groups[index].endWord||0);index++;plays=0;draw();$('tx-listen').focus();if(automatic&&!document.hidden)play();
 });
 function pause(){if(scene!=='player')return;stop();show('paused');$('tx-paused-title').focus();}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
 document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)pause();});
 $('tx-resume').addEventListener('click',async()=>{await fullscreen();show('player');draw();$('tx-listen').focus();wait();});
 $('tx-auto').addEventListener('click',()=>{automatic=!automatic;if(!automatic)stop();draw();if(automatic&&!playing&&plays<3){if(plays===0)play();else wait();}});
 $('exit-focus').addEventListener('click',()=>{stop();document.exitFullscreen?.().catch(()=>{});location.assign($('composer-link').href);});
 $('tx-restart').addEventListener('click',()=>{stop();show('ready');$('tx-title').focus();});
 function change(key,step){
  if(!entry)return;const c=controls[key],old=key==='wait'?waitFactor:settings[key],value=c.values[c.values.indexOf(old)+step];if(value===undefined)return;
  if(scene==='ready'){$('tx-rhythm-preview').hidden=true;$('tx-rhythm-input').value='';$('tx-rhythm-status').textContent='';$('tx-rhythm-input').setAttribute('aria-invalid','false');}
  if(key==='wait'){waitFactor=value;cancelRepeat();}
  else{settings=T.options({...settings,[key]:value});if(key==='pace'){stop();groups=T.fragments(entry,settings.pace);index=T.fragmentIndex(groups,completedThrough);plays=0;loading=null;loadedPath=null;audio=null;}else if(audio)audio.playbackRate=value;}
  setup();if(scene==='player'){draw();if(!playing)wait();}
  saveUrl();
 }
 $('tx-rhythm-input').addEventListener('input',()=>{$('tx-rhythm-preview').hidden=true;$('tx-rhythm-status').textContent='';$('tx-rhythm-input').setAttribute('aria-invalid','false');});
 $('tx-rhythm-form').addEventListener('submit',event=>{
  event.preventDefault();if(!entry||scene!=='ready')return;const profile=window.PlecRhythmCode.decode($('tx-rhythm-input').value);
  $('tx-rhythm-input').setAttribute('aria-invalid',String(!profile));
  if(!profile){$('tx-rhythm-status').textContent='No reconec aquest codi. Revisa’l o continua sense codi.';return;}
  settings=T.options({...settings,pace:profile.pace,rate:profile.rate});waitFactor=profile.waitFactor;groups=T.fragments(entry,settings.pace);index=0;plays=0;completedThrough=0;
  $('tx-rhythm-input').value=profile.code;codePicture('tx-rhythm-preview',profile.code);$('tx-rhythm-status').textContent='Codi '+profile.code+' aplicat.';setup();saveUrl();
 });
 $('tx-rhythm-copy').addEventListener('click',async()=>{const code=$('tx-rhythm-result').textContent;try{await navigator.clipboard.writeText(code);$('tx-rhythm-copy-status').textContent='Codi copiat.';}catch{const selection=getSelection(),range=document.createRange();range.selectNodeContents($('tx-rhythm-result'));selection.removeAllRanges();selection.addRange(range);$('tx-rhythm-copy-status').textContent='Copia el codi seleccionat o apunta’l per al pròxim dictat.';}});
 $('text-player-root').addEventListener('click',event=>{const button=event.target.closest('[data-adjust]');if(button)change(button.dataset.adjust,Number(button.dataset.step));});
 window.addEventListener('pagehide',stop);setup();show('ready');
})();
