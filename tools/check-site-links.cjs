'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),links=require('../site-links.js'),L=require('../language.js'),QR=require('../worksheet-qr.js'),S=require('../seeds-v2.js'),R=require('../catalogs/ca/editions/index.js');
const result=S.resolve(R.editions,'ADZ52356A'),options={language:'ca',seed:'adz5-2356a',catalogue:result.catalogue,variety:'central'};
for(const build of [links.composerURL,links.dictationURL,L.publicComposerURL,L.publicDictationURL]){const url=new URL(build(options));assert.equal(url.origin,'https://plec.ortogra.fi');assert.equal(url.searchParams.get('seed'),'ADZ52356A');assert.equal(url.searchParams.get('catalogue'),result.catalogue);assert.equal(url.searchParams.get('variety'),'central');assert.deepEqual(S.resolve(R.editions,url.searchParams.get('seed')).entries,result.entries);assert(!url.href.includes('127.0.0.1'));}
assert.equal(new URL(links.composerURL(options)).pathname,'/ca/');assert.equal(new URL(links.dictationURL(options)).pathname,'/ca/dictat/');
assert.equal(QR.urlFor(options.seed),links.dictationURL({language:'ca',seed:options.seed,variety:'central'}));assert.equal(QR.urlFor(options.seed,'ca','valencia'),links.dictationURL({language:'ca',seed:options.seed,variety:'valencia'}));assert.throws(()=>QR.urlFor());
assert.equal(new URL(links.dictationURL({...options,voice:'ca-valencian-enric-ipa-v1'})).searchParams.get('voice'),'ca-valencian-enric-ipa-v1');
for(const patch of [{language:'../'},{seed:'O0I1LU'},{seed:''},{catalogue:'es-other'},{voice:'https://other.test/'}])assert.throws(()=>links.dictationURL({...options,...patch}));assert.throws(()=>L.publicDictationURL({...options,language:'es',catalogue:'es-future'}));
const ES=require('../catalogs/es/editions/index.js');
const recipe={mode:'words',count:12,stage:'all',tags:['bv','lly']};
const prepared=S.prepare(ES.editions[0],recipe);
const spanishCode=S.forLanguage('es').encode({epoch:0,recipe:prepared.index,nonce:42});
const spanish=S.resolve(ES.editions,spanishCode.toLowerCase().replaceAll('-',' '));
assert.equal(spanish.language,'es');
assert.deepEqual(spanish.entries,S.draw(prepared,42));
assert(spanish.entries.every(entry=>entry.tags.some(tag=>recipe.tags.includes(tag))));
assert.throws(()=>S.resolve(R.editions,spanishCode));
assert.throws(()=>S.resolve(ES.editions,result.code));
const spanishOptions={language:'es',seed:spanishCode,catalogue:spanish.catalogue};
for(const build of [links.composerURL,links.dictationURL,L.publicComposerURL,L.publicDictationURL]){
 const url=new URL(build(spanishOptions));
 assert.equal(url.searchParams.get('seed'),S.normalize(spanishCode));
 assert(!url.searchParams.has('variety'));
 assert(url.pathname.startsWith('/es/'));
}
assert.equal(QR.urlFor(spanishCode,'es'),links.dictationURL({language:'es',seed:spanishCode}));
// Internal navigation stays on the serving origin; only shared URLs use the canonical origin.
for(const base of ['http://127.0.0.1:4176/','https://plec.ortogra.fi/','https://aaronfortuno.github.io/plec-dictats/'])assert.equal(new URL(L.dictationURL(base,options)).origin,new URL(base).origin);
const app=fs.readFileSync('app.js','utf8');assert(app.includes('LT.publicComposerURL(shareOptions())'));assert(app.includes('LT.publicDictationURL(shareOptions())'));
console.log('Public links: canonical origin, composer/student routes, language, recoverable seed/catalogue, optional voice, QR identity and local/legacy internal navigation passed.');
