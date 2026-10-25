/* Teacher-selected pronunciation; independent of the immutable word-selection seed. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlecAudioVarieties=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const varieties=Object.freeze([{id:'central',label:'Català central'},{id:'valencia',label:'Valencià'}].map(Object.freeze));
 function definition(id,language='ca'){const item=language==='ca'&&varieties.find(v=>v.id===id);if(!item)throw Error('La varietat de pronunciació no està disponible.');return item;}
 function select(manifest,language,{variety=null,voice=null}={}){
  if(!Array.isArray(manifest?.packs))throw Error('Manifest d’àudio invàlid.');
  const explicit=variety!==null,wanted=explicit?definition(variety,language):null;
  if(voice){const pack=manifest.packs.find(p=>p.id===voice&&p.language===language);if(!pack)throw Error('La veu sol·licitada no està disponible.');const selected=definition(pack.dialect,language);if(wanted&&selected.id!==wanted.id)throw Error('La veu no correspon a la varietat indicada a l’enllaç.');return {pack,variety:selected};}
  const selected=wanted||definition('central',language),defaultId=manifest.defaultPacks?.[language];
  const matches=p=>p.language===language&&p.dialect===selected.id;
  const pack=manifest.packs.find(p=>p.id===defaultId&&matches(p))||manifest.packs.find(matches);
  if(!pack)throw Error('Encara no hi ha àudios per a aquesta varietat.');return {pack,variety:selected};
 }
 return {varieties,definition,select};
});
