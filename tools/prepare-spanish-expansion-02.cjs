'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {publishOutputs} = require('./generated-output.cjs');
const {analyzeIpa} = require('./ipa-inventory.cjs');
const {transcribe} = require('./spanish-ipa.cjs');

const root = path.resolve(__dirname,'..'), base = 'catalogs/es/';
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const json = value => JSON.stringify(value,null,2)+'\n';
const manifestFile = base+'editions/manifest.json';
const manifest = JSON.parse(read(manifestFile));
const prior = manifest.editions.find(item=>item.slot===1);
const bytes = read(base+'editions/'+prior.file);
assert.equal(sha(bytes),prior.sha256);
assert([1,2].includes(manifest.current),'This tool only writes the second Spanish expansion.');
const {catalog:previous,profile} = JSON.parse(bytes);
const review = read(base+'review/ampliacion-02.tsv');
const proof = JSON.parse(fs.readFileSync(0,'utf8'));
assert.deepEqual([proof.basic,proof.additions,proof.wordCount],[1056,2000,3056]);
assert.equal(proof.reviewSHA256,sha(review));
const rows = review.trimEnd().split(/\r?\n/u).slice(1).map(line=>line.split('\t'));
assert.equal(rows.length,proof.additions);
const newPronunciations = new Map();
const additions = rows.map(([text,,ipa,vocabulary,orthography,focus])=>{
  assert(new RegExp(profile.wordPattern,'u').test(text),text);
  assert.equal(ipa,transcribe(text),text);
  analyzeIpa(ipa.replaceAll('ʝ','j͡j'),{locale:'es-ES'});
  let hash = 2166136261;
  for (const char of 'words:'+text) hash = Math.imul(hash ^ char.codePointAt(0),16777619);
  const id = 'p-'+(hash>>>0).toString(36);
  const tags = focus.split(',');
  assert(tags.length&&tags.every(tag=>profile.seedFocuses.includes(tag)),text);
  newPronunciations.set(id,{id,text,ipa,status:'proposed'});
  return {id,text,mode:'words',vocabulary,orthography,tags};
});
const entries = [...previous.entries,...additions].sort((a,b)=>a.text.localeCompare(b.text,'es'));
assert.equal(new Set(entries.map(e=>e.id)).size,entries.length);
assert.equal(new Set(entries.map(e=>e.text)).size,entries.length);
const source = {
  schemaVersion:1,language:'es',edition:'es-2026-03-ampliacion',status:'draft',reviewedByTeacher:false,
  version:3,categories:previous.categories,entries
};
const fingerprint = sha(JSON.stringify({source,profile}));
const revision = source.edition+'.'+fingerprint.slice(0,16);
const file = 'seed-3-expanded.json';
const snapshot = json({protocol:2,slot:2,language:'es',salt:2718281828,catalog:{...source,fingerprint,revision},profile});
const expected = manifest.editions.find(item=>item.slot===2);
if(expected)assert.equal(sha(snapshot),expected.sha256,'Preserve frozen editions.');
const indexFile = 'audio/pronunciation/runtime/es-es.json';
const previousIndex = JSON.parse(read(indexFile));
assert([previous.revision,revision].includes(previousIndex.revision));
const oldIpa = new Map(previousIndex.entries.map(row=>[row.id,row]));
const pronunciation = entries.map(({id,text})=>{
  const entry = newPronunciations.get(id)||oldIpa.get(id);
  assert.equal(entry?.text,text,'Missing IPA for '+text);
  return entry;
});
const sourceBytes=json(source);
publishOutputs(root,new Map([
  [base+'catalog.json',sourceBytes],
  [base+'editions/'+file,snapshot],
  [manifestFile,json({...manifest,current:2,editions:[...manifest.editions.filter(item=>item.slot!==2),{slot:2,file,sha256:sha(snapshot),revision}]})],
  [base+'validation.json',json({schemaVersion:1,source:'RLA-ES (es_ES) via Spylls 0.1.7',
    strictLookup:{...proof,catalogueSHA256:sha(sourceBytes),exactMatches:proof.wordCount,pending:[]}})],
  [indexFile,json({...previousIndex,revision,entries:pronunciation})]
]));
console.log(revision+' · '+entries.length+' mots, '+additions.length+' incorporacions.');
