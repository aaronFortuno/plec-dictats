/* Writing time depends on dictation words, never punctuation announcements. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlecTextRepeat=api;})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const delay=(words,factor=1)=>Math.max(4,Math.min(15,Math.ceil(Math.min(12,4+.8*(Math.max(1,Number.isFinite(words)?words:1)-2))*([.8,1,1.25].includes(factor)?factor:1))));
 function create({now=Date.now,setTimer=setTimeout,clearTimer=clearTimeout,onTick,onEnd}){
  let timer=null,deadline=null,revision=0;
  function cancel(){revision++;if(timer!==null)clearTimer(timer);timer=null;deadline=null;}
  function start(words,factor=1){cancel();const ticket=revision;deadline=now()+delay(words,factor)*1000;
   function tick(){if(ticket!==revision)return;const seconds=Math.max(0,Math.ceil((deadline-now())/1000));if(seconds===0){timer=null;deadline=null;onEnd();return;}onTick(seconds);timer=setTimer(tick,250);}
   tick();
  }
  return {start,cancel};
 }
 return {delay,create};
});
