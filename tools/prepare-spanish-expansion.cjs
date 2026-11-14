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
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value,null,2)+'\n';
const manifestFile = base+'editions/manifest.json';
const manifest = JSON.parse(read(manifestFile));
const original = manifest.editions.find(item=>item.slot===0);
const originalBytes = read(base+'editions/'+original.file);
assert.equal(sha(originalBytes),original.sha256);
const {catalog:basic,profile} = JSON.parse(originalBytes);
const review = read(base+'review/ampliacion-01.tsv');
const basicIpa = read(base+'review/vocabulario-basico-afi.tsv');
const proof = JSON.parse(fs.readFileSync(0,'utf8'));
assert.equal(proof.reviewSHA256,sha(review));
assert.equal(proof.basicIpaSHA256,sha(basicIpa));
assert.deepEqual([proof.basic,proof.additions,proof.wordCount],[350,706,1056]);
const rows = review.trimEnd().split(/\r?\n/u).slice(1).map(line=>line.split('\t'));
assert.equal(rows.length,706);
const ids = new Set(basic.entries.map(entry=>entry.id));
const texts = new Set(basic.entries.map(entry=>entry.text));
const labels = require('../locales/es/messages.json');
const categories = basic.categories.map(category=>({...category,label:labels[category.label]||category.label}));
function verifyIpa(text,ipa) {
  assert.equal(ipa,transcribe(text),text);
  analyzeIpa(ipa.replaceAll('ʝ','j͡j'),{locale:'es-ES'});
}
const newEntries = rows.map(([text,,ipa,vocabulary,orthography,focus])=>{
  assert(new RegExp(profile.wordPattern,'u').test(text)&&!texts.has(text),text);
  verifyIpa(text,ipa);
  let hash = 2166136261;
  for (const char of 'words:'+text) hash = Math.imul(hash ^ char.codePointAt(0),16777619);
  const id = 'p-'+(hash>>>0).toString(36);
  assert(!ids.has(id),text);
  ids.add(id);
  texts.add(text);
  const tags = focus.split(',');
  assert(tags.length&&tags.every(tag=>profile.seedFocuses.includes(tag)),text);
  return {id,text,mode:'words',vocabulary,orthography,tags};
});
const collator = new Intl.Collator('es',{sensitivity:'variant'});
const entries = [...basic.entries,...newEntries].sort((a,b)=>collator.compare(a.text,b.text));
const source = {
  schemaVersion:1,language:'es',edition:'es-2026-02-ampliacion',status:'stable',
  reviewedByTeacher:true,version:2,categories,entries
};
const fingerprint = sha(JSON.stringify({source,profile}));
const revision = source.edition+'.'+fingerprint.slice(0,16);
const file = 'seed-2-expanded.json';
const snapshot = json({protocol:2,slot:1,language:'es',salt:3141592653,catalog:{...source,fingerprint,revision},profile});
const existing = manifest.editions.find(item=>item.slot===1);
if (existing) assert.equal(sha(snapshot),existing.sha256,'Create a new edition to change a frozen snapshot.');
const sourceBytes = json(source);
const byText = new Map(entries.map(entry=>[entry.text,entry.id]));
const pronunciation = [...basicIpa.trimEnd().split(/\r?\n/u).slice(1).map(line=>line.split('\t')),
  ...rows.map(([text,,ipa])=>[text,ipa])].map(([text,ipa])=>{
  verifyIpa(text,ipa);
  return {id:byText.get(text),text,ipa,status:'proposed'};
}).sort((a,b)=>collator.compare(a.text,b.text));
assert.deepEqual(pronunciation.map(row=>row.id),entries.map(entry=>entry.id));
publishOutputs(root,new Map([
  [base+'catalog.json',sourceBytes],
  [base+'editions/'+file,snapshot],
  [manifestFile,json({...manifest,current:1,editions:[original,{slot:1,file,sha256:sha(snapshot),revision}]})],
  [base+'validation.json',json({schemaVersion:1,source:'RLA-ES (es_ES) via Spylls 0.1.7',
    strictLookup:{...proof,catalogueSHA256:sha(sourceBytes),exactMatches:proof.wordCount,pending:[]}})],
  ['audio/pronunciation/runtime/es-es.json',json({schemaVersion:1,language:'es',mode:'words',
    profile:'es-es-yeismo-v1',revision,entries:pronunciation})]
]));
console.log(revision+' · '+entries.length+' mots, '+newEntries.length+' incorporacions.');
