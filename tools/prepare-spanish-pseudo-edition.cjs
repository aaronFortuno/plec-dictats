'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT } = require('./audio-plan.cjs');
const { publishOutputs } = require('./generated-output.cjs');
const { entries:pseudowords } = require('./plan-spanish-pseudo-audio.cjs');

const base = 'catalogs/es/';
const manifestFile = base+'editions/manifest.json';
const wordIpaFile = 'audio/pronunciation/runtime/es-es.json';
const read = file => fs.readFileSync(path.join(ROOT,file),'utf8');
const json = value => JSON.stringify(value,null,2)+'\n';
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const manifest = JSON.parse(read(manifestFile));
const previous = manifest.editions.find(entry=>entry.slot===2);
const snapshot = read(base+'editions/'+previous.file);
assert.equal(hash(snapshot),previous.sha256);
assert([2,3].includes(manifest.current));
const {catalog,profile} = JSON.parse(snapshot);
const pseudoCategories = [
  ['simples','Sílabas simples','Dos sílabas abiertas con una consonante y una vocal'],
  ['grups','Grupos consonánticos','Grupos consonánticos al inicio de sílaba'],
  ['pseudodigrafs','Dígrafos','Grafías como ch, ll, rr, qu y gu'],
  ['llargues','Más de dos sílabas','Pseudopalabras de tres o más sílabas']
].map(([id,label,title])=>({id,label,title,mode:'pseudo'}));
const source = {
  schemaVersion:1,language:'es',edition:'es-2026-04-pseudo',status:catalog.status,
  reviewedByTeacher:catalog.reviewedByTeacher,version:4,categories:[...catalog.categories,...pseudoCategories],
  entries:[...catalog.entries,...pseudowords.map(({id,text,mode,tags})=>({id,text,mode,tags}))]
};
const fingerprint = hash(JSON.stringify({source,profile}));
const revision = source.edition+'.'+fingerprint.slice(0,16);
const file = 'seed-4-pseudo.json';
const updated = json({protocol:2,slot:3,language:'es',salt:2718281828,
  catalog:{...source,fingerprint,revision},profile});
const frozen = manifest.editions.find(entry=>entry.slot===3);
if (frozen) assert.equal(frozen.sha256,hash(updated));
const wordIpa = JSON.parse(read(wordIpaFile));
assert([previous.revision,revision].includes(wordIpa.revision));
assert.deepEqual(wordIpa.entries.map(({id,text})=>({id,text})),catalog.entries.map(({id,text})=>({id,text})));
const sourceBytes = json(source);
const validationFile = base+'validation.json';
const validation = JSON.parse(read(validationFile));
assert.equal(validation.strictLookup.exactMatches,catalog.entries.length);
const priorSource = Object.fromEntries(Object.entries(catalog).filter(([key])=>!['fingerprint','revision'].includes(key)));
assert([hash(json(priorSource)),hash(sourceBytes)].includes(validation.strictLookup.catalogueSHA256));
validation.strictLookup.catalogueSHA256 = hash(sourceBytes);
publishOutputs(ROOT,new Map([
  [base+'catalog.json',sourceBytes],
  [base+'editions/'+file,updated],
  [manifestFile,json({...manifest,current:3,editions:[...manifest.editions.filter(entry=>entry.slot!==3),
    {slot:3,file,sha256:hash(updated),revision}]})],
  [validationFile,json(validation)],
  [wordIpaFile,json({...wordIpa,revision})],
  ['audio/pronunciation/runtime/es-es-pseudo.json',json({
    schemaVersion:1,language:'es',mode:'pseudo',profile:'es-es-pseudo-v1',revision,
    entries:pseudowords.map(({id,text,ipa})=>({id,text,ipa,status:'proposed'}))
  })]
]));
console.log(revision+' · '+catalog.entries.length+' paraules i '+pseudowords.length+' pseudoparaules.');
