/* Independent, retryable catalogue resources. A failed IPA never gates audio. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlecCatalogResources=api;})(typeof self!=='undefined'?self:globalThis,function(){
 'use strict';
 function create(specs,{fetcher=(...args)=>fetch(...args),timeout=15000,onChange=()=>{}}={}){
  const records=new Map(Object.entries(specs).map(([key,spec])=>[key,{key,spec,status:'idle',value:null,error:null,promise:null,generation:0}]));
  function get(key){const row=records.get(key);if(!row)throw Error('Recurs desconegut: '+key);return {key,status:row.status,value:row.value,error:row.error};}
  function notify(row){onChange(get(row.key));}
  function load(key,{retry=false}={}){
   const row=records.get(key);if(!row)throw Error('Recurs desconegut: '+key);
   if(row.promise)return row.promise;
   if(row.status==='ready'||row.status==='error'&&!retry)return Promise.resolve(get(key));
   const generation=++row.generation,controller=new AbortController();let timer;
   row.status='loading';row.error=null;notify(row);
   const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('timeout'));},timeout);});
   const request=Promise.resolve().then(()=>fetcher(row.spec.url,{signal:controller.signal})).then(response=>{if(!response.ok)throw Error('http');return response.json();}).then(value=>row.spec.validate?row.spec.validate(value):value);
   row.promise=Promise.race([request,deadline]).then(value=>{if(row.generation===generation){row.value=value;row.status='ready';row.error=null;}}).catch(error=>{if(row.generation===generation){row.value=null;row.status='error';row.error=error?.message==='timeout'?'timeout':'unavailable';}}).finally(()=>{clearTimeout(timer);if(row.generation===generation){row.promise=null;notify(row);}}).then(()=>get(key));
   return row.promise;
  }
  return {get,keys:()=>[...records.keys()],load,start:()=>Promise.all([...records.keys()].map(key=>load(key)))};
 }
 function validateIndex(data,profile){
  if(data?.schemaVersion!==1||data.profile!==profile||data.language!=='ca'||!Array.isArray(data.entries))throw Error('Índex IPA invàlid.');
  const seen=new Set();
  for(const e of data.entries){if(typeof e?.id!=='string'||!/^p-[a-z0-9]+$/.test(e.id)||seen.has(e.id)||typeof e.text!=='string'||typeof e.ipa!=='string'||typeof e.status!=='string')throw Error('Entrada IPA invàlida.');seen.add(e.id);}
  return data;
 }
 function validateManifest(data){if(data?.schemaVersion!==1||!Array.isArray(data.packs)||data.packs.some(p=>!p||typeof p.id!=='string'||p.language!=='ca'||typeof p.files!=='object'||!p.files||Array.isArray(p.files)))throw Error('Manifest invàlid.');return data;}
 return {create,validateIndex,validateManifest};
});
