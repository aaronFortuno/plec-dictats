(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./assets/vendor/qrcode.js'):root.qrcode);if(typeof module==='object'&&module.exports)module.exports=api;else root.PlecWorksheetQR=api;})(typeof globalThis!=='undefined'?globalThis:this,function(qrcode){
 'use strict';
 const cache=new Map();
 function urlFor(code,language='ca'){
  const seed=String(code||'').toUpperCase().replace(/[\s-]/g,'');
  if(!/^(?:[ABCDEFGHJKMNPQRSTVWXYZ2-9]{6}|[ABCDEFGHJKMNPQRSTVWXYZ2-9]{9})$/.test(seed)||! /^[a-z]{2}(?:-[A-Za-z]{2})?$/.test(language))throw Error('Identitat del QR invàlida.');
  return `https://plec.ortogra.fi/${language}/dictat/?seed=${seed}`;
 }
 function matrix(url){if(cache.has(url))return cache.get(url);const qr=qrcode(0,'M');qr.addData(url);qr.make();const count=qr.getModuleCount(),cells=Array.from({length:count},(_,r)=>Array.from({length:count},(_,c)=>qr.isDark(r,c)));if(cache.size>20)cache.clear();cache.set(url,cells);return cells;}
 function shapes(url,x,y,size=28){const cells=matrix(url),quiet=4,unit=size/(cells.length+quiet*2),result=[{type:'rect',x,y,w:size,h:size,color:'#ffffff',role:'worksheet-qr',url}];
  for(let r=0;r<cells.length;r++)for(let c=0;c<cells.length;){if(!cells[r][c]){c++;continue;}const start=c;while(c<cells.length&&cells[r][c])c++;result.push({type:'rect',x:x+(quiet+start)*unit,y:y+(quiet+r)*unit,w:(c-start)*unit,h:unit,color:'#000000',role:'worksheet-qr'});}
  return result;
 }
 return {urlFor,matrix,shapes};
});
