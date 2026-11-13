'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const A = require('./audio-plan.cjs');
const G = require('./generate-audio.cjs');
const {loadAzureEnvironment} = require('./azure-credentials.cjs');
const seed = require('../catalogs/es/editions/seed-1-basic.json');
const registry = require('../catalogs/es/editions/manifest.json');

const directory = path.join(A.ROOT, 'output/audio');
const pack = {
  id: 'es-es-elvira-basic-v1', provider: 'azure', language: 'es', locale: 'es-ES',
  dialect: 'es-es', voice: 'es-ES-ElviraNeural', label: 'Español de España · Elvira',
  mode: 'words', rate: '-10%', format: A.OUTPUT_FORMAT, files: {},
  basePath: 'assets/audio/es/es-es-elvira-basic-v1/',
  contentFingerprint: seed.catalog.fingerprint
};
const options = {seed, manifest: {schemaVersion: 1, packs: [pack]}, pack: pack.id, mode: 'words'};
const digest = data => crypto.createHash('sha256').update(data).digest('hex');
function plan() {
  const snapshot = fs.readFileSync(path.join(A.ROOT, 'catalogs/es/editions/seed-1-basic.json'));
  if (digest(snapshot) !== registry.editions.find(edition => edition.file === 'seed-1-basic.json')?.sha256) {
    throw Error('L’edició castellana no coincideix amb el seu manifest.');
  }
  const {jobs} = A.buildJobs(seed, options.manifest, options);
  if (jobs.length !== 350) throw Error('El lot ha de tenir exactament 350 mots.');
  return jobs;
}

function reuseSample(jobs) {
  const id = 'es-elvira-voice-pilot-v1';
  const storage = path.join(directory, id);
  const sampleFile = path.join(A.ROOT, 'output/results', id + '-words.json');
  if (!fs.existsSync(sampleFile)) return;
  const settings = A.readJson(path.join(storage, 'settings.json'));
  if (settings.ipaFingerprint || ['language','locale','voice','rate','format'].some(key => pack[key] !== settings[key])) {
    throw Error('Els ajustos de la mostra no coincideixen amb els del lot.');
  }
  const sample = A.readJson(sampleFile);
  if (sample.pack !== id || sample.mode !== 'words' || Object.keys(sample.files).length !== 14) {
    throw Error('El manifest de la mostra no identifica els 14 mots originals.');
  }
  const takes = jobs.filter(job => sample.files[job.id] === job.relativePath);
  if (takes.length !== 14) throw Error('La mostra no coincideix amb el banc congelat.');
  const assets = takes.map(job => {
    const data = fs.readFileSync(path.join(storage, job.relativePath));
    if (!G.isValidMp3(data)) throw Error('MP3 de mostra invàlid: ' + job.text);
    return {file: G.resolveJobPath(path.join(A.ROOT, 'output'), pack.id, job.relativePath), data};
  });
  const settingsPath = path.join(directory,pack.id,'settings.json');
  if (fs.existsSync(settingsPath)) {
    const prior = A.readJson(settingsPath);
    if (['language','locale','voice','rate','format','contentFingerprint'].some(key => pack[key] !== prior[key]) || prior.ipaFingerprint) {
      throw Error('Identitat incompatible del lot existent.');
    }
  }
  for (const {file, data} of assets) {
    if (fs.existsSync(file)) continue;
    fs.mkdirSync(path.dirname(file), {recursive:true});
    fs.writeFileSync(file, data, {flag:'wx'});
  }
  console.log('Mostra reutilitzada: 14 preses d’Elvira a partir de la grafia.');
}

async function main(args) {
  if (args.some(arg => !['--execute','--confirm-f0'].includes(arg))) throw Error('Arguments no admesos.');
  const jobs = plan();
  console.log(JSON.stringify(A.summarize(jobs)));
  if (!args.includes('--execute')) return;
  if (!args.includes('--confirm-f0')) throw Error('Cal confirmar F0.');
  const shouldStop = () => fs.existsSync(path.join(directory,'STOP'));
  if (shouldStop()) throw Error('El fitxer STOP és actiu.');
  const release = G.acquireLock(path.join(directory,'spanish-audio-runner.lock'));
  try {
    const env = loadAzureEnvironment({});
    reuseSample(jobs);
    const result = await G.runGeneration({...options, execute:true, confirmF0:true, retryTransient:true}, {
      env, fetch:globalThis.fetch, shouldStop
    });
    if (!result.ok) throw Error('Lot aturat: ' + result.reason);
  } finally {
    release();
  }
}
if (require.main === module) main(process.argv.slice(2)).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
module.exports = {pack, plan};
