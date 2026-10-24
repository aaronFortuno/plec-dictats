'use strict';
// Separate, tiny pack. Shares the word batch budget, lock and no-retry policy.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const A = require('./audio-plan.cjs');
const G = require('./generate-audio.cjs');
const {instructionText} = require('../dictation.js');
const {loadAzureEnvironment} = require('./azure-credentials.cjs');
const COUNTS = [8, 12, 16, 20, 24];

function instructionPlan(manifest = A.readJson(path.join(A.ROOT, 'audio/instructions/manifest.json'))) {
  const entries = COUNTS.map(count => ({
    id: `instruction-paper-${count}`, mode: 'instructions',
    text: instructionText(count), fileName: `paper-${count}.mp3`
  }));
  const seed = {catalog: {language: 'ca', entries}};
  // A changed paragraph cannot silently reuse old recordings under the same pack ID.
  const contentFingerprint = crypto.createHash('sha256').update(JSON.stringify(entries)).digest('hex');
  manifest = JSON.parse(JSON.stringify(manifest));
  const pack = A.validatePack(manifest);
  pack.contentFingerprint = contentFingerprint;
  return {seed, manifest, mode: 'instructions'};
}

function wordBatchGate(status, budgetLocked, runnerAlive) {
  if (status?.phase === 'completed' && !budgetLocked) return 'ready';
  if (['preparing', 'running'].includes(status?.phase) && runnerAlive) return 'wait';
  return 'blocked';
}

function readWordBatchState(outputRoot) {
  const directory = path.join(outputRoot, 'audio');
  let status, runnerAlive = false;
  try { status = A.readJson(path.join(directory, 'batch-status.json')); } catch {}
  try {
    const runner = A.readJson(path.join(directory, 'batch-runner.lock'));
    if (Number.isSafeInteger(runner.pid) && runner.pid > 0) {
      process.kill(runner.pid, 0); runnerAlive = true;
    }
  } catch {}
  return wordBatchGate(status, fs.existsSync(path.join(directory, 'usage.lock')), runnerAlive);
}

async function writePreview(outputRoot, plan, resultPath) {
  const result = A.readJson(resultPath), files = {};
  for (const job of plan.jobs) {
    if (result.files[job.id] !== job.relativePath || !G.isValidMp3(fs.readFileSync(G.resolveJobPath(outputRoot, plan.pack.id, job.relativePath)))) {
      throw new Error('Falten instruccions completes.');
    }
    files[job.id] = job.relativePath;
  }
  await G.atomicWriteJson(path.join(outputRoot, 'audio/instructions-preview-manifest.json'), {
    schemaVersion: 1, defaultPacks: {ca: plan.pack.id},
    packs: [{...plan.pack, status: 'ready', basePath: `output/audio/${plan.pack.id}/`, files}]
  });
  const rows = plan.jobs.map(job => `<section><h2>${job.id.replace('instruction-paper-', '')} paraules</h2><p>${A.escapeXml(job.text)}</p><audio controls preload="none" src="${plan.pack.id}/${job.relativePath}"></audio></section>`).join('\n');
  fs.writeFileSync(path.join(outputRoot, 'audio/instruccions.html'), `<!doctype html><html lang="ca"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Plec · Revisió de les instruccions</title><style>:root{color-scheme:light dark;font:17px/1.6 system-ui}body{max-width:700px;margin:40px auto;padding:0 24px}section{border-top:1px solid #8886;margin-top:28px;padding-top:12px}audio{width:100%}</style><h1>Locucions d’instruccions</h1><p>Prova local pendent de revisió. Comprova dicció, entonació i pauses abans de publicar.</p>${rows}</html>`, 'utf8');
}

async function run(options, dependencies = {}) {
  const config = instructionPlan(), plan = A.buildJobs(config.seed, config.manifest, config);
  const estimate = A.summarize(plan.jobs);
  const log = dependencies.log || console.log;
  log(JSON.stringify({simulated: !options.execute, ...estimate, pack: plan.pack.id}));
  if (!options.execute) return {ok: true, simulated: true, estimate};
  if (!options.afterWords) throw new Error('La generació exigeix --after-words.');
  const outputRoot = dependencies.outputRoot || path.join(A.ROOT, 'output');
  const directory = path.join(outputRoot, 'audio');
  fs.mkdirSync(directory, {recursive: true});
  const release = G.acquireLock(path.join(directory, 'instructions-runner.lock'));
  const state = {pack: plan.pack.id, phase: 'waiting', total: plan.jobs.length, completed: 0, startedAt: new Date().toISOString()};
  const save = () => G.atomicWriteJson(path.join(directory, 'instruction-status.json'), {...state, updatedAt: new Date().toISOString()});
  const shouldStop = () => fs.existsSync(path.join(directory, 'STOP'));
  const gate = dependencies.gate || (() => readWordBatchState(outputRoot));
  const sleep = dependencies.sleep || (ms => new Promise(resolve => setTimeout(resolve, ms)));
  try {
    await save();
    for (;;) {
      if (shouldStop()) throw new Error('stop-file');
      const decision = gate();
      if (decision === 'ready') break;
      if (decision !== 'wait') throw new Error('word-batch-not-completed');
      await sleep(15000);
    }
    state.phase = 'running'; await save();
    const result = await G.runGeneration({...config, execute: true, confirmF0: true}, {
      outputRoot, env: dependencies.env || loadAzureEnvironment({}),
      fetch: dependencies.fetch || globalThis.fetch, sleep: dependencies.requestSleep,
      shouldStop, log
    });
    if (!result.ok) throw new Error(result.reason);
    await writePreview(outputRoot, plan, result.resultPath);
    Object.assign(state, {phase: 'completed', completed: plan.jobs.length, downloaded: result.downloaded, skipped: result.skipped, review: 'pending'});
    await save();
    return result;
  } catch (error) {
    // Only internal short reason codes; no raw errors/credentials in logs or web output.
    state.phase = 'stopped';
    state.reason = /^[a-z-]+$/.test(error.message) ? error.message : 'local-error';
    await save();
    log(`Instruccions aturades: ${state.reason}. Sense reintents automàtics.`);
    return {ok: false, reason: state.reason};
  } finally { release(); }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.some(arg => !['--execute', '--after-words'].includes(arg))) {
    console.error('Ús: node tools/run-instructions-batch.cjs [--execute --after-words]'); process.exitCode = 1;
  } else run({execute: args.includes('--execute'), afterWords: args.includes('--after-words')})
    .then(result => {if (!result.ok) process.exitCode = 1;})
    .catch(() => {console.error('No es pot preparar el lot d’instruccions.'); process.exitCode = 1;});
}

module.exports = {COUNTS, instructionPlan, wordBatchGate, readWordBatchState, writePreview, run};
