'use strict';
// Explicit offline publication: validate every copied MP3; never synthesize or read keys.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const A=require('./audio-plan.cjs'),G=require('./generate-audio.cjs');
function publish(){
 const root=A.ROOT,read=p=>A.readJson(path.join(root,p));
 const preview=read('output/audio/catalog-preview-manifest.json'),review=read('output/audio/review-manifest.json');
 const source=preview.packs[0],original=review.packs.find(p=>p.id==='ca-central-alba-v1');
 if(!original||source.language!=='ca'||source.voice!=='ca-ES-AlbaNeural')throw Error('Falta el paquet central esperat.');
 let count=0,bytes=0;const hashes={};
 function copy(from,relative){A.validateRelativePath(relative,'Publicació');const data=fs.readFileSync(path.join(root,from));if(!G.isValidMp3(data))throw Error('MP3 invàlid: '+relative);const destination=path.join(root,'assets/audio/ca',relative);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,data);count++;bytes+=data.length;hashes[relative]=crypto.createHash('sha256').update(data).digest('hex');}
 const packs=review.packs.filter(p=>p.profile==='ca-central-didactic-v1').map(p=>{for(const relative of Object.values(p.files))copy(p.basePath+relative,p.id+'/'+relative);return {...p,basePath:'assets/audio/ca/'+p.id+'/'};});
 const publicPack={...source,id:original.id,label:'Català central · Alba',status:'ready',basePath:'assets/audio/ca/',files:source.files};
 // Retain the original pack's identity for generation tools and exact recording reviews.
 const manifest=read('audio/manifest.json');manifest.defaultPacks.ca=publicPack.id;
 manifest.packs=manifest.packs.filter(p=>p.id!==publicPack.id);manifest.packs.push(publicPack);
 const instructions=read('output/audio/instructions-preview-manifest.json');for(const p of instructions.packs){for(const rel of Object.values(p.files))copy(p.basePath+rel,p.id+'/'+rel);p.basePath='assets/audio/ca/'+p.id+'/';}
 const write=(p,v)=>fs.writeFileSync(path.join(root,p),JSON.stringify(v,null,2)+'\n');
 write('audio/manifest.json',manifest);write('audio/review-manifest.json',{schemaVersion:1,defaultPacks:{},packs});write('audio/instructions/manifest.json',instructions);
 write('audio/central-publication.json',{schemaVersion:1,date:'2026-10-25',language:'ca',dialect:'central',coverage:Object.keys(publicPack.files).length,catalogueWords:3299,recordings:count,bytes,review:'Publicació autoritzada per l’autor; revisió auditiva mot a mot en curs.',sha256:hashes});
 console.log(JSON.stringify({recordings:count,coverage:Object.keys(publicPack.files).length,bytes}));
}
if(require.main===module)publish();module.exports={publish};
