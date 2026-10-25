'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const I = require('./run-instructions-batch.cjs');
const A = require('./audio-plan.cjs');
const G = require('./generate-audio.cjs');
const {instructionText} = require('../dictation.js');

(async () => {
  const config = I.instructionPlan(), plan = A.buildJobs(config.seed, config.manifest, config);
  assert.equal(plan.jobs.length, 5);
  for (const count of I.COUNTS) {
    const job = plan.jobs.find(job => job.id === `instruction-paper-${count}`);
    assert.equal(job.text, instructionText(count));
    assert.equal(job.relativePath, `instructions/paper-${count}.mp3`);
    assert(job.ssml.includes(`en ${count} paraules`));
  }
  assert.throws(() => instructionText(0));
  for (const name of ['../escape.mp3', '/a.mp3', 'a/b.mp3', 'a.MP3', 'paragraph.txt']) {
    const seed = structuredClone(config.seed); seed.catalog.entries[0].fileName = name;
    assert.throws(() => A.buildJobs(seed, config.manifest, config));
  }
  assert.equal(I.wordBatchGate({phase:'running'}, true, true), 'wait');
  assert.equal(I.wordBatchGate({phase:'running'}, true, false), 'blocked');
  assert.equal(I.wordBatchGate({phase:'failed'}, false, false), 'blocked');
  assert.equal(I.wordBatchGate({phase:'completed'}, true, false), 'blocked');
  assert.equal(I.wordBatchGate({phase:'completed'}, false, false), 'ready');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'plec-instructions-'));
  let requests = 0;
  const dependencies = {
    outputRoot: temp, log: () => {}, env: {SPEECH_KEY:'test-not-a-key', SPEECH_REGION:'westeurope'},
    requestSleep: async () => {},
    fetch: async () => {requests++; return new Response(Buffer.from([0x49,0x44,0x33,1]), {headers:{'content-type':'audio/mpeg'}});}
  };
  const publicBefore=fs.readFileSync(path.join(A.ROOT,'audio/instructions/manifest.json'),'utf8');
  try {
    let result = await I.run({execute:true, afterWords:true}, {...dependencies, gate:()=> 'blocked'});
    assert.equal(result.ok, false); assert.equal(requests, 0);
    let gates = 0;
    result = await I.run({execute:true, afterWords:true}, {...dependencies,
      gate: () => ++gates === 1 ? 'wait' : 'ready', sleep: async () => {assert.equal(requests,0);}
    });
    assert(result.ok); assert.equal(requests,5);
    const preview = A.readJson(path.join(temp,'audio/instructions-preview-manifest.json'));
    assert.equal(preview.packs[0].status, 'ready');
    assert.equal(Object.keys(preview.packs[0].files).length,5);
    const before = fs.readFileSync(path.join(temp,'audio/usage.json'),'utf8');
    result = await I.run({execute:true, afterWords:true}, {...dependencies, gate:()=> 'ready'});
    assert(result.ok); assert.equal(requests,5); assert.equal(result.skipped,5);
    assert.equal(fs.readFileSync(path.join(temp,'audio/usage.json'),'utf8'),before);
    // Text changes cannot reuse the saved MP3 pack, even if its voice is unchanged.
    const changed = structuredClone(config); changed.manifest.packs[0].contentFingerprint = 'a'.repeat(64);
    result = await G.runGeneration({...changed, execute:true, confirmF0:true}, dependencies);
    assert.equal(result.reason,'pack-settings'); assert.equal(requests,5);
    assert.equal(fs.readFileSync(path.join(A.ROOT,'audio/instructions/manifest.json'),'utf8'),publicBefore,'Generating a local sample must not change public audio');
    assert(!fs.existsSync(path.join(temp,'audio/usage.lock')));
    console.log('Instruccions: text compartit, cinc llargades, rutes, espera del lot, pressupost compartit, represa i canvi de contingut correctes. Cap petició real.');
  } finally {
    if (temp.startsWith(path.join(os.tmpdir(),'plec-instructions-'))) fs.rmSync(temp,{recursive:true,force:true});
  }
})().catch(error => {console.error(error); process.exitCode=1;});
