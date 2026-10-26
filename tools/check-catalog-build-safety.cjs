'use strict';
// Runs the actual builder against a virtual filesystem: never publishes to the repo.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),{createRequire}=require('node:module');
const {publishOutputs}=require('./generated-output.cjs');
const root=path.resolve(__dirname,'..'),builder=path.join(__dirname,'build-catalogs.cjs'),code=fs.readFileSync(builder,'utf8'),realRequire=createRequire(builder);
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const relative=file=>path.relative(root,file).split(path.sep).join('/');
function run({overrides=new Map(),check=false,failWrite=false,failRename=false}={}){
  const files=new Map([...overrides].map(([name,text])=>[path.resolve(root,name),text===null?null:Buffer.from(text)])),operations=[],published=[],descriptors=new Map();let nextFd=100;
  const read=(file,encoding)=>{
    const absolute=path.resolve(file),bytes=files.has(absolute)?files.get(absolute):fs.readFileSync(absolute);
    if(bytes===null){const e=Error('Virtual file absent');e.code='ENOENT';throw e;}
    return encoding?bytes.toString(typeof encoding==='string'?encoding:encoding.encoding):Buffer.from(bytes);
  };
  const io={
    readFileSync:read,
    existsSync:file=>files.has(path.resolve(file))?files.get(path.resolve(file))!==null:fs.existsSync(file),
    mkdirSync:file=>operations.push(['mkdir',relative(file)]),
    openSync(file,flag){assert.equal(flag,'wx');if(this.existsSync(file)){const error=Error('exists');error.code='EEXIST';throw error;}operations.push(['open',relative(file)]);files.set(path.resolve(file),Buffer.alloc(0));const fd=nextFd++;descriptors.set(fd,path.resolve(file));return fd;},
    writeFileSync(file,text){const target=typeof file==='number'?descriptors.get(file):path.resolve(file);operations.push(['write',relative(target)]);if(failWrite)throw Error('Simulated write failure');files.set(target,Buffer.from(text));},
    closeSync(fd){descriptors.delete(fd);},
    unlinkSync(file){operations.push(['unlink',relative(file)]);files.set(path.resolve(file),null);}
  };
  const replace=(from,to)=>{
    operations.push(['rename',relative(from),relative(to)]);if(failRename)throw Error('Simulated rename failure');
    files.set(path.resolve(to),files.get(path.resolve(from)));files.set(path.resolve(from),null);published.push(relative(to));
  };
  const processStub={argv:['node',builder,...(check?['--check']:[])],pid:process.pid,exitCode:0};
  const messages=[];
  const context={__dirname:path.dirname(builder),module:{exports:{}},process:processStub,console:{log:text=>messages.push(text),error:text=>messages.push(text)},require:name=>name==='node:fs'?io:name==='./generated-output.cjs'?{publishOutputs:(directory,outputs)=>publishOutputs(directory,outputs,{io,replace})}:realRequire(name)};
  let error;try{vm.runInNewContext(code,context,{filename:builder});}catch(e){error=e;}
  return {error,operations,published,files,read,exitCode:processStub.exitCode,messages,descriptors};
}
const baseline=run();assert.ifError(baseline.error);assert(baseline.published.length>10);
assert(baseline.operations.some(op=>op[0]==='rename'));
assert(baseline.operations.filter(op=>op[0]==='write').every(op=>op[1].endsWith('.tmp')),'Only temporary files are written directly');
assert.equal(baseline.descriptors.size,0);assert(![...baseline.files].some(([file,bytes])=>file.endsWith('.tmp')&&bytes!==null));
const outputHashes=new Map(baseline.published.map(name=>[name,digest(fs.readFileSync(path.join(root,name)))]));
const seedManifest=JSON.parse(fs.readFileSync(path.join(root,'catalogs/ca/editions/manifest.json'),'utf8'));
const firstSnapshot='catalogs/ca/editions/'+seedManifest.editions[0].file;
const alteredSnapshot=new Map([[firstSnapshot,fs.readFileSync(path.join(root,firstSnapshot),'utf8')+' ']]);
const basic=JSON.parse(fs.readFileSync(path.join(root,'catalogs/ca/vocabulari-basic.json'),'utf8'));basic.words=basic.words.slice(1);
const invalidRegistry=structuredClone(seedManifest);invalidRegistry.current=999;
const malformedRegistry=structuredClone(seedManifest);malformedRegistry.editions={};
for(const [label,overrides,pattern] of [
  ['snapshot checksum',alteredSnapshot,/Immutable seed snapshot changed/],
  ['basic vocabulary list',new Map([['catalogs/ca/vocabulari-basic.json',JSON.stringify(basic)]]),/Basic vocabulary annotations/],
  ['registry current slot',new Map([['catalogs/ca/editions/manifest.json',JSON.stringify(invalidRegistry)]]),/Current seed edition missing/],
  ['malformed registry',new Map([['catalogs/ca/editions/manifest.json',JSON.stringify(malformedRegistry)]]),/Invalid seed registry/],
  ['missing render template',new Map([['templates/dictation.html',null]]),/Virtual file absent/]
]){
  // Null marks a missing template; it must fail after validation but before publication.
  const result=run({overrides});
  assert.match(result.error?.message||'',pattern,label);assert.equal(result.operations.length,0,label+' cannot change outputs');
}
// A second locale must be validated before the first locale can be published.
const languages=JSON.parse(fs.readFileSync(path.join(root,'locales/manifest.json'),'utf8'));
languages.languages.push({id:'invalid-second',name:'Invalid second locale',path:'invalid-second/',config:'locales/ca/config.json'});
const second=run({overrides:new Map([['locales/manifest.json',JSON.stringify(languages)]])});
assert.match(second.error?.message||'',/Language mismatch/);assert.equal(second.operations.length,0);
// Review files are still protected in generating mode, independently of source changes.
for(const file of ['paraules.txt','pseudoparaules.txt','vocabulari-basic.txt']){
  const edited=run({overrides:new Map([['catalogs/ca/'+file,'manual edit\n']])});
  assert.match(edited.error?.message||'',/revisió manual/,file);assert.equal(edited.operations.length,0);
}
const checked=run({check:true});assert.ifError(checked.error);assert.equal(checked.operations.length,0,'--check never writes even when stale');
const failingWrite=run({failWrite:true});assert.match(failingWrite.error?.message||'',/Simulated write failure/);assert.equal(failingWrite.published.length,0);assert.equal(failingWrite.descriptors.size,0);
assert(![...failingWrite.files].some(([file,bytes])=>file.endsWith('.tmp')&&bytes!==null),'Partial temporary removed');
const failingRename=run({failRename:true});assert.match(failingRename.error?.message||'',/Simulated rename failure/);assert.equal(failingRename.published.length,0);
assert(![...failingRename.files].some(([file,bytes])=>file.endsWith('.tmp')&&bytes!==null),'Unpublished temporary removed');
// No real generated file, snapshot or review file was changed by these executions.
for(const [name,hash] of outputHashes)assert.equal(digest(fs.readFileSync(path.join(root,name))),hash,name);
for(const [name,expected] of baseline.files)if(expected!==null&&!name.endsWith('.tmp')&&baseline.published.includes(relative(name))){
  const file=relative(name);
  if(!file.endsWith('.html'))assert.equal(expected.toString(),fs.readFileSync(name,'utf8'),'Non-HTML output bytes preserved: '+file);
}
assert.throws(()=>publishOutputs(root,new Map([['../outside.txt','x']]),{io:{},replace(){}}),/outside workspace/);
console.log('Catalogue builder: all-language/source validation before writes, immutable/selection/registry failures, manual TXT protection, read-only check and per-file atomic publication passed in a virtual filesystem.');
