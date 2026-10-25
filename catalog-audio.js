(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./audio-manifest.js'):root.PlecAudioManifest);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.PlecCatalogAudio=api;
})(typeof self!=='undefined'?self:globalThis,function(M){
  'use strict';
  function create({base,language,fetch:fetcher,Audio:AudioType,onChange=()=>{}}){
    let manifest=null,request=null,audio=null,epoch=0,playingId=null,errorId=null,phase='idle',packId=null;
    const local=['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname);
    function getState(){return {phase,playingId,errorId,local,packId,packs:(manifest?.packs||[]).filter(p=>p.language===language&&p.status==='ready').map(p=>({id:p.id,dialect:p.dialect,label:p.label}))};}
    function notify(){onChange(getState());}
    function urlFor(entry){
      if(!manifest)return null;
      try{const result=M.coverage(manifest,[entry],language,base,packId);return result.ready?result.urls[0]:null;}catch{return null;}
    }
    function load(){
      if(request)return request;
      phase='loading';notify();
      const url=new URL(local?'output/audio/catalog-preview-manifest.json':'audio/manifest.json',base);
      request=Promise.resolve().then(()=>fetcher(url)).then(r=>{if(!r.ok)throw Error();return r.json();}).then(m=>{
        const checked=M.coverage(m,[],language,base,packId);manifest=m;phase=checked.ready?'ready':'pending';notify();return m;
      }).catch(()=>{phase='unavailable';request=null;notify();return null;});
      return request;
    }
    function stop(){
      epoch++;if(audio){audio.onended=audio.onerror=null;try{audio.pause();audio.removeAttribute('src');}catch{}audio=null;}
      playingId=null;errorId=null;notify();
    }
    function selectPack(id){stop();packId=id||null;try{phase=manifest&&M.coverage(manifest,[],language,base,packId).ready?'ready':'pending';}catch{phase='pending';}notify();}
    function play(entry){
      if(playingId===entry.id){stop();return;}
      stop();const url=urlFor(entry);if(!url)return;
      const token=epoch;let a=null;
      function finish(ok){if(token!==epoch||audio!==a)return;stop();if(!ok){errorId=entry.id;notify();}}
      try{
        a=new AudioType(url);audio=a;playingId=entry.id;notify();
        a.onended=()=>finish(true);a.onerror=()=>finish(false);
        const p=a.play();if(p&&p.catch)p.catch(()=>finish(false));
      }catch{finish(false);}
    }
    return {load,urlFor,play,stop,selectPack,getState};
  }
  return {create};
});
