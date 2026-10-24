'use strict';
// Offline comparison plan only; no credentials, synthesis or changes to the current batch.
const fs = require('node:fs');
const path = require('node:path');
const A = require('./audio-plan.cjs');
const {buildPhonemeSsml} = require('./prepare-ipa.cjs');
const SOURCE = path.join(A.ROOT, 'audio/pronunciation/ca-central-gemination-finals.json');

function buildSample(metadata, catalog, manifest) {
  if (metadata.schemaVersion !== 1 || metadata.language !== catalog.language || metadata.catalogFingerprint !== catalog.fingerprint) throw new Error('Edició incompatible amb la mostra.');
  const baseline = A.validatePack(manifest, metadata.baselinePack);
  const pack = A.validatePack({schemaVersion:1, packs:[metadata.candidatePack]}, metadata.candidatePack.id);
  if (pack.id === baseline.id || pack.voice !== baseline.voice || pack.rate !== baseline.rate || pack.format !== baseline.format) throw new Error('Cal una comparació separada amb els mateixos ajustos.');
  const seen = new Set();
  if (!Array.isArray(metadata.entries) || !metadata.entries.length) throw new Error('Mostra buida.');
  const jobs = metadata.entries.map(row => {
    const entry = catalog.entries.find(entry => entry.id === row.id && entry.mode === 'words');
    if (!entry || entry.text !== row.mot || seen.has(row.id)) throw new Error('ID, mot o duplicat incorrectes.');
    seen.add(row.id);
    if (!['prepared','needs-review'].includes(row.status) || !row.note || !row.sources?.length || row.sources.some(url => !/^https:\/\/[^\s]+$/.test(url))) throw new Error('Falta la revisió o la base de la proposta.');
    const file = `words/${A.wordFileName(row.mot)}`;
    return {
      id:row.id, text:row.mot, ipa:row.ipa, reviewStatus:row.status, auditoryReview:'pending',
      reportedByTeacher:row.reportedByTeacher, focus:row.focus, basis:row.basis, sources:row.sources, note:row.note,
      baselinePath:`output/audio/${baseline.id}/${file}`, relativePath:file,
      ...buildPhonemeSsml(pack, row)
    };
  });
  return {
    schemaVersion:1, kind:'offline-pronunciation-comparison', executable:false,
    reason:'Cal revisar les propostes i fer una mostra separada abans de substituir cap àudio.',
    catalogFingerprint:catalog.fingerprint, pack,
    summary:{words:jobs.length, needsReview:jobs.filter(job=>job.reviewStatus==='needs-review').length,
      estimatedCharacters:jobs.reduce((sum,job)=>sum+job.billableCharacters,0)}, jobs
  };
}

function loadSample() {
  const metadata = A.readJson(SOURCE);
  const tablePath=path.join(A.ROOT,'audio/pronunciation/ca/central-didactic.tsv');
  if(fs.existsSync(tablePath)){
    // Current editions select IDs; the editable per-variety table supplies pronunciations.
    // An already running batch has its own in-memory snapshot and is unaffected by edits.
    const table=require('./pronunciation-table.cjs').load('ca-central-didactic-v1');
    const byId=new Map(table.rows.map(row=>[row.id,row]));
    metadata.entries=metadata.entries.map(entry=>{
      const row=byId.get(entry.id);if(!row?.ipa)throw new Error('Falta IPA a la taula per a '+entry.mot+'.');
      return {...entry,ipa:row.ipa,status:['proposta','validada'].includes(row.estat_ipa)?'prepared':'needs-review',basis:row.base,sources:row.fonts?row.fonts.split(' | '):[],note:row.notes};
    });
  }
  return buildSample(metadata, A.readJson(path.join(A.ROOT, metadata.catalogPath)).catalog, A.readJson(A.DEFAULT_MANIFEST));
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    if (args.length > 1 || args.some(arg=>arg !== '--write')) throw new Error('Ús: node tools/prepare-pronunciation-sample.cjs [--write]. Sense execució Azure.');
    const plan = loadSample();
    if (args.includes('--write')) {
      const file = path.join(A.ROOT,'output/audio/pronunciation-sample/plan.json');
      fs.mkdirSync(path.dirname(file),{recursive:true}); fs.writeFileSync(file,JSON.stringify(plan,null,2)+'\n');
    }
    console.log(`${plan.summary.words} mots de comparació · ${plan.summary.needsReview} dubte lingüístic · ${plan.summary.estimatedCharacters} caràcters estimats. Cap petició Azure ni canvi als MP3.`);
  } catch (error) { console.error(error.message); process.exitCode=1; }
}
module.exports = {SOURCE, buildSample, loadSample};
