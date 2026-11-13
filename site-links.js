/* Public share links have one canonical origin, independent of the current host. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlecSiteLinks=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const ORIGIN='https://plec.ortogra.fi/';
 function normalizeSeed(seed,language){
  const code=String(seed).toUpperCase().replace(/[\s-]/g,'');
  const prefix=language==='ca'?'':language.toUpperCase();
  const valid=prefix?code.startsWith(prefix)&&/^[ABCDEFGHJKMNPQRSTVWXYZ2-9]{9}$/.test(code.slice(prefix.length)):/^(?:[ABCDEFGHJKMNPQRSTVWXYZ2-9]{6}|[ABCDEFGHJKMNPQRSTVWXYZ2-9]{9})$/.test(code);
  if(!valid)throw Error('Codi no vàlid.');
  return code;
 }
 function assertVariety(variety,language){
  if(variety===undefined)return;
  const allowed=language==='ca'?['central','valencia']:language==='es'?['es-es']:[];
  if(!allowed.includes(variety))throw Error('La varietat de pronunciació no està disponible.');
 }
 function publicURL(page,{language='ca',seed,catalogue,voice,variety}={}){
  if(!/^[a-z]{2}(?:-[A-Za-z]{2})?$/.test(language))throw Error('Llengua de l’enllaç invàlida.');
  const url=new URL(language+'/'+(page==='dictat'?'dictat/':''),ORIGIN);
  if(seed!==undefined)url.searchParams.set('seed',normalizeSeed(seed,language));
  if(catalogue!==undefined){if(typeof catalogue!=='string'||!catalogue.startsWith(language+'-'))throw Error('El catàleg no correspon a la llengua.');url.searchParams.set('catalogue',catalogue);}
  assertVariety(variety,language);
  if(variety!==undefined)url.searchParams.set('variety',variety);
  if(voice!==undefined){if(typeof voice!=='string'||! /^[a-z0-9-]+$/.test(voice))throw Error('Veu de l’enllaç invàlida.');url.searchParams.set('voice',voice);}
  return url.href;
 }
 return {ORIGIN,normalizeSeed,assertVariety,composerURL:options=>publicURL('composer',options),dictationURL:options=>publicURL('dictat',options)};
});
