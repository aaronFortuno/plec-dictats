'use strict';
// Offline integration and explicitly authorized incremental Git publication.
// This tool never calls a speech service or validates the remote deployment.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),queue=require('../audio/texts/batches/ca007-es012-production-v1.json');
const git=process.env.PLEC_GIT||'C:/Program Files/Git/cmd/git.exe';
function run(binary,args){const r=spawnSync(binary,args,{cwd:root,windowsHide:true,encoding:'utf8',maxBuffer:8*1024*1024});if(r.error||r.status!==0)throw Error([r.error?.message,r.stdout,r.stderr].filter(Boolean).join('\n').trim()||'Subprocés aturat.');return r.stdout;}
function g(...args){return run(git,['-c','safe.directory='+root.split(path.sep).join('/'),'-c','http.sslBackend=openssl',...args]);}
function allowedPaths(item){const language=item.batchId.slice(0,2),code=item.batchId.split('-')[0];return ['audio/texts/index.json','audio/texts/batches/'+item.batchId+'-receipt.json',...['r23','r45','r68','r912'].map(id=>'assets/audio/texts/'+language+'/'+code+'-four-v1/'+id+'.mp3'),'text-audio.js','templates/composer.html','templates/dictation.html','ca/index.html','ca/dictat/index.html','es/index.html','es/dictat/index.html'];}
function cacheVersion(registry){return '1.53.'+createHash('sha256').update(JSON.stringify(registry)).digest('hex').slice(0,12);}
function snapshot(names){return Object.fromEntries(names.map(name=>[name,fs.existsSync(path.join(root,name))?createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex'):null]));}
function guardTree(item,clean=false){
 if(g('branch','--show-current').trim()!=='main')throw Error('La publicació només està autoritzada a main.');
 if(g('diff','--cached','--name-only').trim())throw Error('Hi ha canvis preparats al Git que no pertanyen a aquest publicador.');
 const allowed=new Set(allowedPaths(item)),changed=g('diff','HEAD','--name-only').trim().split('\n').filter(Boolean);
 if(clean&&changed.length)throw Error('Cal un arbre de treball net abans d’iniciar una publicació automàtica.');
 if(changed.some(name=>!allowed.has(name.trim())))throw Error('Hi ha canvis de treball aliens al lot. Revisar abans de publicar.');
}
function main(){
 if(!process.argv.includes('--publish')||process.argv.slice(2).some(arg=>arg!=='--publish'&&!arg.startsWith('--batch=')))throw Error('Cal --publish i --batch=ID per publicar un lot rebut.');
 const id=process.argv.find(arg=>arg.startsWith('--batch='))?.slice(8),item=queue.batches.find(v=>v.batchId===id);
 if(!item||queue.status!=='authorized')throw Error('Cal un lot de la cua autoritzada.');
 const folder=path.join(root,'output/audio',item.batchId,item.requestHash.slice(0,12)),attempt=JSON.parse(fs.readFileSync(path.join(folder,'attempt.json'),'utf8'));
 if(attempt.status!=='received'||attempt.requestHash!==item.requestHash||attempt.planHash!==item.planHash)throw Error('Cal una presa rebuda del lot exacte.');
 guardTree(item,true);const initialHead=g('rev-parse','HEAD').trim(),templates=['templates/composer.html','templates/dictation.html'],initialTemplates=snapshot(templates);
 const registry=JSON.parse(fs.readFileSync(path.join(root,'audio/texts/index.json'),'utf8')),record=registry[item.entryId];
 if(record&&(record.requestHash!==item.requestHash||record.rawSha256!==attempt.rawSha256))throw Error('El registre conté una altra presa.');
 if(record&&!g('diff','HEAD','--name-only').trim()&&!g('rev-list','--count','@{upstream}..HEAD').trim().match(/^[1-9]/)){
  const known=g('ls-files','--',...allowedPaths(item)).trim().split('\n');
  if(allowedPaths(item).every(name=>known.includes(name))){console.log(JSON.stringify({batch:id,alreadyPublished:true,newSynthesisRequests:0}));return;}
 }
 if(!record){
  if(allowedPaths(item).filter(name=>name.endsWith('.mp3')).some(name=>fs.existsSync(path.join(root,name))))throw Error('Hi ha MP3 parcials sense registre; revisar abans de sobreescriure.');
  console.log(run(process.execPath,['tools/local-prosody-align.cjs',path.join(folder,'raw.wav'),path.join(folder,'alignment.json'),item.language]).trim());
  guardTree(item,true);
  console.log(run(process.execPath,['tools/prepare-prosody-pilot.cjs','--batch='+id]).trim());
 }
 if(JSON.stringify(snapshot(templates))!==JSON.stringify(initialTemplates))throw Error('Les plantilles han canviat durant la preparació; no s’han sobreescrit.');
 const current=JSON.parse(fs.readFileSync(path.join(root,'audio/texts/index.json'),'utf8')),version=cacheVersion(current);
 for(const name of ['templates/composer.html','templates/dictation.html']){const file=path.join(root,name),s=fs.readFileSync(file,'utf8'),next=s.replace(/text-audio\.js\?v=[^"\s]+/g,'text-audio.js?v='+version);if(!s.includes('text-audio.js?v='))throw Error('No s’ha trobat la versió de la memòria cau.');if(s!==next)fs.writeFileSync(file,next);}
 console.log(run(process.execPath,['tools/build-catalogs.cjs']).trim());
 const generated=snapshot(allowedPaths(item));
 for(const name of ['check-phrase-production.cjs','check-prosody.cjs','check-text-catalogue.cjs'])console.log(run(process.execPath,['tools/'+name]).trim());
 console.log(run(process.execPath,['tools/run-phrase-browser-check.cjs']).trim());
 guardTree(item);
 if(g('rev-parse','HEAD').trim()!==initialHead||JSON.stringify(snapshot(allowedPaths(item)))!==JSON.stringify(generated))throw Error('Hi ha canvis concurrents després de les comprovacions; no es preparen al Git.');
 const allowed=allowedPaths(item).filter(name=>fs.existsSync(path.join(root,name)));
 g('add','--',...allowed);
 if(g('diff','--cached','--name-only').trim())g('commit','-m','Publish '+id.split('-')[0].toUpperCase()+' four-rhythm Aoede pilot');
 // Retrying a failed push sends Git commits only, never another synthesis request.
 g('push','origin','main');
 console.log(JSON.stringify({batch:id,published:true,commit:g('rev-parse','HEAD').trim(),newSynthesisRequests:0,remoteDeploymentChecked:false}));
}
if(require.main===module)try{main();}catch(error){console.error(error.message);process.exitCode=1;}
module.exports={allowedPaths,cacheVersion};
