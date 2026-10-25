(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlecPronunciationReview=api;})(typeof self!=='undefined'?self:globalThis,function(){
 'use strict';
 const STORAGE='plec-pronunciation-reviews-v1';
 function validate(r){
  if(!r||!['audio','ipa'].includes(r.target)||!['good','review','pending'].includes(r.status))throw Error('Revisió invàlida.');
  for(const k of ['profile','id','word','pack','fingerprint','ipa','note','updatedAt'])if(typeof r[k]!=='string'||r[k].length>(k==='note'?1000:500))throw Error('Camp de revisió invàlid.');
  if(!/^p-[a-z0-9]+$/.test(r.id)||!/^ca-[a-z0-9-]+$/.test(r.profile)||!Number.isFinite(Date.parse(r.updatedAt)))throw Error('Identitat o data invàlida.');
  if(r.target==='audio'&&(!r.pack||!r.fingerprint))throw Error('Falta identificar la versió de l’àudio.');
  return Object.fromEntries(['target','profile','id','word','pack','fingerprint','ipa','status','note','updatedAt'].map(k=>[k,r[k]]));
 }
 function key(r){return JSON.stringify([r.target,r.profile,r.id,r.target==='audio'?r.pack:r.ipa,r.target==='audio'?r.fingerprint:'']);}
 function parse(data){
  if(data?.kind!=='plec-pronunciation-review'||data.schemaVersion!==1||data.language!=='ca'||!Array.isArray(data.entries)||data.entries.length>50000)throw Error('El fitxer no és una revisió de pronunciacions de Plec.');
  return data.entries.map(validate);
 }
 function create(storage,now=()=>new Date().toISOString()){
  const records=new Map();let writable=true,error=null;
  try{const saved=storage.getItem(STORAGE);if(saved)for(const r of parse(JSON.parse(saved)))records.set(key(r),r);}catch{writable=false;error='No es pot llegir la revisió desada. Exporta les notes d’aquesta sessió; no se sobreescriurà el contingut anterior.';}
  function persist(){if(!writable)return false;try{storage.setItem(STORAGE,JSON.stringify(exportData()));return true;}catch{error='No es poden desar les notes al navegador. Exporta la revisió abans de sortir.';return false;}}
  function exportData(){return {kind:'plec-pronunciation-review',schemaVersion:1,language:'ca',exportedAt:now(),entries:[...records.values()].sort((a,b)=>key(a).localeCompare(key(b)))};}
  function get(context){return records.get(key(context))||null;}
  function set(context,patch){const before=get(context);const r=validate({...context,status:before?.status||'pending',note:before?.note||'',...patch,updatedAt:now()});
   records.set(key(r),r);persist();return r;}
  function importData(data){const entries=parse(data);for(const r of entries){const old=records.get(key(r));if(!old||Date.parse(r.updatedAt)>Date.parse(old.updatedAt))records.set(key(r),r);}persist();return entries.length;}
  return {get,set,exportData,importData,all:()=>[...records.values()],error:()=>error};
 }
 function issueURL(records){
  const errors=records.filter(r=>r.status==='review');
  if(errors.length===1){
   const r=errors[0],url=new URL('https://github.com/aaronFortuno/plec-dictats/issues/new');
   url.searchParams.set('title','Pronunciació: '+r.word);
   url.searchParams.set('body',`${r.word} · ${r.target==='ipa'?'transcripció IPA':'àudio'} · ${r.profile}\n\n${r.note}\n\nIPA: ${r.ipa||'(enregistrament original sense IPA)'}\nID: ${r.id}${r.target==='audio'?`\nPaquet: ${r.pack}\nAjustos: ${r.fingerprint}`:''}\n`);
   return url.href;
  }
  let body='Revisió de pronunciacions de Plec\n\n';let included=0;
  for(const r of errors){
   const line=`- ${r.word} · ${r.target==='ipa'?'IPA':'àudio'} · ${r.profile} · ${r.pack||'taula'}\n  ${r.note.slice(0,140)||'Per revisar.'}\n`;
   if(encodeURIComponent(body+line).length>4800)break;body+=line;included++;
  }
  body+=`\n${errors.length} incidències; ${included} resumides aquí. Adjunta el fitxer JSON exportat des de Plec per conservar versions i anotacions completes.\n`;
  const url=new URL('https://github.com/aaronFortuno/plec-dictats/issues/new');url.searchParams.set('title','Revisió de pronunciacions');url.searchParams.set('body',body);return url.href;
 }
 function combinedCsv(rows){const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';return '\uFEFF'+[['mot','IPA central','estat central','IPA valencià','estat valencià'],...rows.map(r=>[r.text,r.central?.ipa,r.central?.status,r.valencia?.ipa,r.valencia?.status])].map(row=>row.map(quote).join(',')).join('\r\n')+'\r\n';}
 return {STORAGE,validate,key,parse,create,issueURL,combinedCsv};
});
