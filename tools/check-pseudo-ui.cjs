'use strict';
// Current pseudo catalogue/player, with local manifests and simulated audio only.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLEC_NODE_MODULES?path.join(process.env.PLEC_NODE_MODULES,'playwright'):'playwright');
const T=require('./pronunciation-table.cjs'),C=require('../catalog.js'),S=require('../seeds-v2.js'),R=require('../catalogs/ca/editions/index.js'),V=require('../audio-varieties.js'),M=require('../audio-manifest.js'),Resources=require('../catalog-resources.js');
const BASE='http://127.0.0.1:4176',published=require('../audio/manifest.json'),words={...published,packs:published.packs.filter(p=>p.mode!=='pseudo')},pseudo=C.entries.filter(e=>e.mode==='pseudo');
const packs=['central','valencia'].map(variety=>({id:variety==='central'?'ca-central-alba-pseudo-ipa-v1':'ca-valencian-enric-pseudo-ipa-v1',language:'ca',dialect:variety,mode:'pseudo',profile:variety==='central'?'ca-central-pseudo-didactic-v1':'ca-valencian-pseudo-didactic-v1',status:'ready',fingerprint:'a'.repeat(64),basePath:'assets/audio/ca/pseudo-test-'+variety+'/',files:Object.fromEntries(pseudo.map(e=>[e.id,'pseudo/'+e.text+'.mp3']))}));
const manifest={...words,packs:[...words.packs,...packs]};
const indexes=Object.fromEntries([['central','ca-central-pseudo-didactic-v1'],['valencian','ca-valencian-pseudo-didactic-v1'],['mallorcan','ca-mallorcan-pseudo-didactic-v1']].map(([file,id])=>{const data=T.load(id);return [file,{schemaVersion:1,language:'ca',profile:id,mode:'pseudo',entries:data.rows.map(r=>({id:r.id,text:r.mot,ipa:r.ipa,status:r.estat_ipa}))}];}));
const recipe={mode:'pseudo',stage:'all',count:20,tags:C.categories.filter(c=>c.mode==='pseudo').map(c=>c.id)},code=S.encode({epoch:R.current,recipe,nonce:1}),selection=S.resolve(R.editions,code);
assert.equal(pseudo.length,96);assert(selection.entries.every(e=>e.mode==='pseudo'));
assert.equal(M.coverage(manifest,selection.entries,'ca',BASE+'/').pack.id,packs[0].id);
for(const variety of ['central','valencia']){const chosen=V.select(manifest,'ca',{variety,mode:'pseudo',entries:selection.entries});assert.equal(chosen.pack.mode,'pseudo');assert.equal(chosen.variety.id,variety);assert(M.coverage(manifest,selection.entries,'ca',BASE+'/',chosen.pack.id).ready);}
assert.equal(V.select(manifest,'ca').pack.id,words.defaultPacks.ca);
assert.throws(()=>V.select(words,'ca',{variety:'central',mode:'pseudo',entries:selection.entries}));
assert.throws(()=>V.select(manifest,'ca',{voice:packs[0].id,variety:'valencia',mode:'pseudo',entries:selection.entries}));
assert.throws(()=>M.coverage(manifest,selection.entries,'ca',BASE+'/',words.defaultPacks.ca));
const missing={...manifest,packs:manifest.packs.filter(p=>p.id!==packs[1].id)};
assert.throws(()=>V.select(missing,'ca',{variety:'valencia',mode:'pseudo',entries:selection.entries}),'Never substitute central or a words pack');
for(const [file,data] of Object.entries(indexes)){Resources.validateIndex(data,data.profile,'pseudo');assert.throws(()=>Resources.validateIndex(data,data.profile,'words'));}
const bad=structuredClone(indexes.central);bad.entries[0].id='p-not-pseudo';assert.throws(()=>Resources.validateIndex(bad,bad.profile,'pseudo'));
(async()=>{const b=await chromium.launch({channel:'chrome'});try{
 const p=await b.newPage({viewport:{width:1440,height:900}}),errors=[],requests=[];p.setDefaultTimeout(10000);p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>requests.push(new URL(r.url()).pathname));
 await p.addInitScript(()=>{window.testAudio=[];window.Audio=class{constructor(url){this.url=url;this.paused=false;window.testAudio.push(this);}play(){return Promise.resolve();}pause(){this.paused=true;}removeAttribute(){}};});
 await p.route('**/audio/manifest.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(manifest)}));
 await p.route('**/output/audio/review-manifest.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({schemaVersion:1,packs})}));
 for(const [file,data] of Object.entries(indexes))await p.route('**/runtime/'+file+'-pseudo.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(data)}));
 await p.goto(BASE+'/ca/');await p.waitForSelector('#sheet-preview svg');assert(!requests.some(url=>url.includes('/runtime/')),'No catalogue IPA is fetched before opening');
 await p.click('[data-mode=pseudo]');await p.click('#catalog-open');await p.waitForSelector('.pronunciation-row');
 await p.waitForFunction(()=>[...document.querySelectorAll('.pronunciation-row:first-child .ipa-text')].every(e=>e.textContent!=='Carregant…'));
 assert.equal(await p.locator('#catalog-title').textContent(),'Les pseudoparaules');assert((await p.locator('#catalog-count').textContent()).startsWith('96 mots'));
 assert.equal(await p.locator('.pronunciation-row').first().locator('.pronunciation-cell').count(),3);assert(await p.locator('#export-pronunciations').isVisible());
 assert(requests.some(url=>url.endsWith('/runtime/central-pseudo.json')));assert(!requests.some(url=>/\/runtime\/(central|valencian|mallorcan)\.json$/.test(url)),'Pseudo consultation does not fetch word IPA tables');
 const play=variety=>p.locator('[data-action=play][data-variety='+variety+'].review-icon').first();await p.waitForFunction(()=>!document.querySelector('[data-action=play][data-variety=central].review-icon').disabled);
 await play('central').click();assert((await p.evaluate(()=>window.testAudio.at(-1).url)).includes('/pseudo-test-central/pseudo/'));
 await play('valencia').click();assert((await p.evaluate(()=>window.testAudio.at(-1).url)).includes('/pseudo-test-valencia/pseudo/'));assert.equal(await p.evaluate(()=>window.testAudio[0].paused),true);
 const pending=p.locator('[data-variety=mallorqui].ipa-play').first();assert.equal(await pending.getAttribute('aria-disabled'),'true');assert((await pending.getAttribute('data-report-tooltip')).includes('Àudio en pausa'));
 const event=p.waitForEvent('download');await p.click('#export-pronunciations');const download=await event;fs.mkdirSync('output',{recursive:true});await download.saveAs('output/pseudo-ipa-ui.csv');const lines=fs.readFileSync('output/pseudo-ipa-ui.csv','utf8').trim().split(/\r?\n/u);assert.equal(lines.length,97);assert(lines[0].includes('Mallorquí'));assert(!lines.slice(1).some(line=>line.startsWith('"abans",')));
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(240);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),390);await p.screenshot({path:'output/pseudo-catalog-mobile.png'});
 await p.locator('#catalog-dialog [data-close]').click();await p.waitForFunction(()=>!document.querySelector('#catalog-dialog').open);await p.setViewportSize({width:1440,height:900});await p.click('[data-mode=words]');await p.click('#catalog-open');await p.waitForFunction(()=>document.querySelector('#catalog-count').textContent.startsWith('3299 mots'));await p.waitForFunction(()=>document.querySelector('.pronunciation-row [data-variety=central] .ipa-text')?.textContent!=='Carregant…');assert(requests.some(url=>url.endsWith('/runtime/central.json')));assert.equal(await p.locator('.pronunciation-row').first().locator('.pronunciation-cell').count(),3);
 for(const variety of ['central','valencia']){await p.goto(BASE+'/ca/dictat/?seed='+code+'&variety='+variety);await p.waitForSelector('#ready-panel:not([hidden])');assert(await p.locator('#start-dictation').isEnabled());assert.equal(await p.locator('#dictation-variety').textContent(),variety==='central'?'Català central':'Valencià');}
 assert.deepEqual(errors,[]);console.log('Pseudo UI passed: lazy 96×3 IPA, exact-mode/dialect audio, word-code compatibility, CSV, pending Mallorcan state, mobile and oral entry. No synthesis.');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
