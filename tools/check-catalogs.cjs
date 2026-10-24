const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const vm = require('node:vm');
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
process.chdir(root);
const built=spawnSync(process.execPath,['tools/build-catalogs.cjs','--check'],{encoding:'utf8'});
assert.equal(built.status,0,built.stdout+built.stderr);
const C=require('../catalog.js'), L=require('../language.js');
const source=JSON.parse(fs.readFileSync('catalogs/ca/catalog.json','utf8'));
const profile=require('../locales/ca/config.json');
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(C.fingerprint,digest({source,profile}));
const changed=structuredClone(source);changed.entries[0].tags.push('other');
assert.notEqual(C.fingerprint,digest({source:changed,profile}));
const rules=structuredClone(profile);rules.stageRules.cm.vocabulary.push('expanded');
assert.notEqual(C.fingerprint,digest({source,profile:rules}));
assert.equal(C.status,'draft');assert.equal(C.reviewedByTeacher,false);
assert.equal(C.entries.filter(e=>e.mode==='words').length,3299);
for(const e of C.entries){
 let h=2166136261;for(const c of e.mode+':'+e.text)h=Math.imul(h^c.codePointAt(0),16777619);
 assert.equal(e.id,(e.mode==='words'?'p-':'s-')+(h>>>0).toString(36),'Stable identity '+e.text);
}
for(const [mode,name] of [['words','paraules'],['pseudo','pseudoparaules']]){
 const text=fs.readFileSync('catalogs/ca/'+name+'.txt','utf8');
 const lines=text.trimEnd().split('\n');
 assert.equal(lines.length,C.entries.filter(e=>e.mode===mode).length);
 assert.equal(new Set(lines).size,lines.length);
 assert.deepEqual(lines,C.entries.filter(e=>e.mode===mode).map(e=>e.text).sort(new Intl.Collator('ca',{sensitivity:'variant'}).compare));
}
for(const base of ['https://pleg.at/','https://aaronfortuno.github.io/plec-dictats/','file:///C:/Plec/index.html']){
 const url=new URL(L.dictationURL(base,{language:'ca',catalogue:C.revision,seed:'x5d-8ty'}));
 assert(url.pathname.endsWith('/ca/dictat/'));
 if(base.includes('plec-dictats'))assert.equal(url.pathname,'/plec-dictats/ca/dictat/');
 assert.equal(url.searchParams.get('seed'),'X5D8TY');
 assert.equal(url.searchParams.get('catalogue'),C.revision);
 assert.equal(url.searchParams.has('mode'),false);
}
assert.throws(()=>L.dictationURL('https://pleg.at/',{language:'es',catalogue:'es-v1',seed:'X5D8TY'}));
assert.throws(()=>L.dictationURL('https://pleg.at/',{language:'ca',catalogue:'es-v1',seed:'X5D8TY'}));
assert.throws(()=>L.dictationURL('https://pleg.at/',{language:'ca',catalogue:C.revision,seed:'O0I1LU'}));
assert.equal(new URL(L.dictationURL('https://aaronfortuno.github.io/plec-dictats/',{language:'ca',catalogue:C.revision,seed:'m6qm-aavn4'})).searchParams.get('seed'),'M6QMAAVN4');
L.assertImportLanguage({version:3},'ca');L.assertImportLanguage({version:4,language:'ca'},'ca');
assert.throws(()=>L.assertImportLanguage({version:3,language:'es'},'ca'));
assert.throws(()=>L.assertImportLanguage({version:4},'ca'));
const storage=new Map([['plec-dictats-v1',JSON.stringify({marker:'legacy'})]]);
const adapter={getItem:key=>storage.get(key)??null};
assert.equal(L.savedState(adapter,'plec-dictats-v1:ca','ca').marker,'legacy');
assert.equal(L.savedState(adapter,'plec-dictats-v1:es','es'),null);
storage.set('plec-dictats-v1:ca',JSON.stringify({marker:'new'}));
assert.equal(L.savedState(adapter,'plec-dictats-v1:ca','ca').marker,'new');
const html=fs.readFileSync('ca/index.html','utf8');
for(const match of html.matchAll(/(?:src|href)="([^\"]+)"/g)){
 const ref=match[1];if(/^(https?:|lightning:|#)/.test(ref))continue;
 assert(fs.existsSync(path.resolve(root,'ca',ref.split('?')[0])),'Local resource '+ref);
}
const page={PlecLanguage:profile};
vm.runInNewContext(fs.readFileSync('core.js','utf8'),{window:page});
assert(page.PlecCore.validateCustom('atapeït'));
assert(!page.PlecCore.validateCustom('il..legal'));
assert(!page.PlecCore.validateCustom('·llibre'));
assert(page.PlecCore.matchesStage(C.entries.find(e=>e.text==='llit'),'cm'));
console.log('Paquets, empremtes, fitxers de revisió, identitats, rutes i migració: correctes.');
