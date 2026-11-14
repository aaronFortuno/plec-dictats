'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {ROOT,OUTPUT_FORMAT,buildJobs,summarize} = require('./audio-plan.cjs');
const {transcribe} = require('./spanish-ipa.cjs');
const {PSEUDO_FOCUSES} = require('../seeds.js');
const profile = require('../locales/es/config.json');
const wordIpa = require('../audio/pronunciation/runtime/es-es.json');
const table = fs.readFileSync(path.join(ROOT,'catalogs/es/pseudo/ampliacion-01.tsv'),'utf8');
const lines = table.trimEnd().split(/\r?\n/u);
assert.equal(lines.shift(),'palabra\tafi_es_ES\tids_focus');
assert.equal(lines.length,100);
const soundKey = ipa=>ipa.replaceAll('.','').replace(/ˈ([^aeiou]*)/u,'$1ˈ');
const sounds = new Set(wordIpa.entries.map(({ipa})=>soundKey(ipa)));
const words = new Set(wordIpa.entries.map(({text})=>text));
const pattern = new RegExp(profile.wordPattern,'u');
const entries = lines.map(line=>{
  const [text,ipa,focus] = line.split('\t');
  assert(pattern.test(text)&&!words.has(text),text);
  assert.equal(transcribe(text),ipa,text);
  assert(!sounds.has(soundKey(ipa)),text);
  sounds.add(soundKey(ipa));
  words.add(text);
  const tags = focus.split(',');
  assert(tags.length&&tags.every(tag=>PSEUDO_FOCUSES.includes(tag)),text);
  let hash = 2166136261;
  for (const char of 'pseudo:'+text) hash = Math.imul(hash ^ char.codePointAt(0),16777619);
  return {id:'s-'+(hash>>>0).toString(36),text,mode:'pseudo',ipa,tags};
});
assert.equal(new Set(entries.map(({id})=>id)).size,entries.length);
const id = 'es-es-elvira-pseudo-ipa-v1';
const pack = {
  id,mode:'pseudo',provider:'azure',language:'es',locale:'es-ES',dialect:'es-es',
  voice:'es-ES-ElviraNeural',rate:'-10%',format:OUTPUT_FORMAT,files:{},
  basePath:'assets/audio/es/'+id+'/',generationPolicy:{requireIpa:true}
};
const options = {
  seed:{language:'es',entries:entries.map(entry=>({...entry,ipa:entry.ipa.replaceAll('ʝ','j͡j')}))},
  manifest:{schemaVersion:1,packs:[pack]},pack:id,mode:'pseudo'
};
const {jobs} = buildJobs(options.seed,options.manifest,options);
if (require.main===module) console.log(JSON.stringify(summarize(jobs)));
module.exports = {entries,pack,jobs,options};
