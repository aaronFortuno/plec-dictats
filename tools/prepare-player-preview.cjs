'use strict';
// Offline developer preview only. Never changes the public audio manifest.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const A = require('./audio-plan.cjs');
const { isValidMp3, resolveJobPath, atomicWriteJson } = require('./generate-audio.cjs');

(async () => {
  if (process.argv.length > 2) throw new Error('Aquest preparador no admet opcions ni execució de xarxa.');
  const plan = A.buildJobs(A.readJson(A.DEFAULT_CATALOG), A.readJson(A.DEFAULT_MANIFEST), { mode: 'words' });
  const outputRoot = path.join(A.ROOT, 'output');
  const pack = plan.pack;
  const identity = { language: pack.language, locale: pack.locale, voice: pack.voice, rate: pack.rate, format: pack.format };
  const fingerprint = crypto.createHash('sha256').update(JSON.stringify(identity)).digest('hex');
  const settings = A.readJson(path.join(outputRoot, 'audio', pack.id, 'settings.json'));
  if (settings.fingerprint !== fingerprint) throw new Error('Els MP3 locals no corresponen als ajustos del paquet.');
  const files = {};
  for (const job of plan.jobs) {
    const file = resolveJobPath(outputRoot, pack.id, job.relativePath);
    try { if (isValidMp3(fs.readFileSync(file))) files[job.id] = job.relativePath; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const preview = {
    schemaVersion: 1, defaultPacks: { [pack.language]: pack.id },
    packs: [{ ...pack, status: 'ready', basePath: `output/audio/${pack.id}/`, files }]
  };
  await atomicWriteJson(path.join(outputRoot, 'audio/player-preview-manifest.json'), preview);
  console.log(`Prova local preparada: ${Object.keys(files).length} MP3 amb format vàlid, pendents de revisió. Sense peticions Azure ni canvis al manifest públic.`);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
