'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {
  buildJobs,
  buildSsml,
  countCharacters,
  validateRelativePath,
  wordFileName
} = require('./audio-plan.cjs');
const {
  MONTHLY_LIMIT,
  evaluateBudget,
  isValidMp3,
  resolveJobPath,
  runGeneration,
  waitForRequestSlot
} = require('./generate-audio.cjs');

const manifest = {
  schemaVersion: 1,
  defaultPacks: { ca: 'ca-central-alba-v1' },
  packs: [{
    id: 'ca-central-alba-v1',
    language: 'ca',
    dialect: 'central',
    label: 'Català central · Alba',
    locale: 'ca-ES',
    provider: 'azure',
    voice: 'ca-ES-AlbaNeural',
    rate: '-10%',
    format: 'audio-24khz-48kbitrate-mono-mp3',
    basePath: 'assets/audio/ca/central-alba-v1/',
    status: 'pending',
    files: {}
  }]
};

function seedWith(...texts) {
  return {
    catalog: {
      entries: texts.map((text, index) => ({ id: `id-${index}`, text, mode: 'words' }))
    }
  };
}

function mp3Response() {
  return {
    ok: true,
    status: 200,
    headers: { get: name => name.toLowerCase() === 'content-type' ? 'audio/mpeg' : null },
    arrayBuffer: async () => Buffer.from([0x49, 0x44, 0x33, 0x01])
  };
}

async function main() {
  const temporaryRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'plec-audio-tools-'));
  let directoryNumber = 0;
  const nextOutput = async () => {
    directoryNumber += 1;
    const directory = path.join(temporaryRoot, `case-${directoryNumber}`);
    await fsp.mkdir(directory, { recursive: true });
    return directory;
  };
  const fixedNow = () => new Date('2026-10-24T12:00:00.000Z');
  const generationOptions = seed => ({
    seed,
    manifest,
    mode: 'words',
    limit: 12,
    execute: true,
    confirmF0: true,
    usedElsewhere: 0
  });

  try {
    const special = "aüma's & co";
    const specialPlan = buildJobs(seedWith(special), manifest, { mode: 'words' });
    const specialJob = specialPlan.jobs[0];
    assert.equal(specialJob.billableBody, '<prosody rate="-10%">aüma&apos;s &amp; co</prosody>');
    assert.ok(specialJob.ssml.includes('><voice name="ca-ES-AlbaNeural"><prosody'));
    assert.ok(specialJob.ssml.endsWith('</prosody></voice></speak>'));
    assert.ok(specialJob.ssml.includes('xmlns="http://www.w3.org/2001/10/synthesis"'));
    assert.ok(!specialJob.ssml.includes(`>${special}<`));
    assert.equal(specialJob.billableCharacters, countCharacters(specialJob.billableBody));
    assert.equal(wordFileName('AVIÓ'.normalize('NFC')), 'avió.mp3');
    assert.deepEqual(buildJobs(seedWith('avió','metge'),manifest,{words:['metge','avió','metge']}).jobs.map(job=>job.text),['metge','avió']);
    assert.throws(()=>buildJobs(seedWith('avió'),manifest,{words:['inexistent']}));

    assert.throws(() => wordFileName('../fora'), /nom de fitxer segur/);
    assert.throws(() => validateRelativePath('words/../fora.mp3', 'Prova'), /segments/);
    assert.throws(() => buildJobs(seedWith('Café', 'cafe\u0301'), manifest, { mode: 'words' }), /Col·lisió/);
    assert.throws(() => resolveJobPath(temporaryRoot, manifest.packs[0].id, '../fora.mp3'), /surt del directori/);
    assert.ok(isValidMp3(Buffer.from([0xff, 0xfb, 0x00])));
    assert.ok(!isValidMp3(Buffer.from('no és àudio')));

    const markup = buildSsml(manifest.packs[0], 'a&b');
    const budget = evaluateBudget({ months: {} }, '2026-10', markup.billableCharacters, 25);
    assert.equal(budget.plannedCharacters, countCharacters('<prosody rate="-10%">a&amp;b</prosody>'));
    assert.equal(budget.total, 25 + markup.billableCharacters);
    assert.ok(markup.billableCharacters > countCharacters('a&b'));
    assert.equal(evaluateBudget({ months: { '2026-10': { reservedCharacters: 10, usedElsewhere: 30 } } }, '2026-10', 5, 20).previous, 40);

    {
      const outputRoot = await nextOutput();
      await fsp.mkdir(path.join(outputRoot, 'audio'), { recursive: true });
      await fsp.writeFile(path.join(outputRoot, 'audio', 'usage.json'), JSON.stringify({
        schemaVersion: 1,
        months: { '2026-10': { reservedCharacters: MONTHLY_LIMIT, usedElsewhere: 0 } },
        lastRequestStartedAt: null
      }));
      let requests = 0;
      const result = await runGeneration(generationOptions(seedWith('avió')), {
        outputRoot,
        env: { SPEECH_KEY: 'prova-local', SPEECH_REGION: 'westeurope' },
        fetch: async () => { requests += 1; return mp3Response(); },
        now: fixedNow,
        sleep: async () => {},
        log: () => {}
      });
      assert.equal(result.reason, 'budget');
      assert.equal(requests, 0, 'El pressupost insuficient ha d’aturar abans de fetch.');
    }

    {
      const outputRoot = await nextOutput();
      const options = { ...generationOptions(seedWith('avió')), usedElsewhere: 100 };
      let requests = 0;
      const dependencies = {
        outputRoot,
        env: { SPEECH_KEY: 'prova-local', SPEECH_REGION: 'westeurope' },
        fetch: async () => { requests += 1; return mp3Response(); },
        now: fixedNow,
        sleep: async () => {},
        log: () => {}
      };
      const first = await runGeneration(options, dependencies);
      assert.equal(first.ok, true);
      assert.equal(first.downloaded, 1);
      assert.equal(requests, 1);
      const ledgerPath = path.join(outputRoot, 'audio', 'usage.json');
      const firstLedger = JSON.parse(await fsp.readFile(ledgerPath, 'utf8'));
      const second = await runGeneration(options, dependencies);
      const secondLedger = JSON.parse(await fsp.readFile(ledgerPath, 'utf8'));
      assert.equal(second.ok, true);
      assert.equal(second.downloaded, 0);
      assert.equal(second.skipped, 1);
      assert.equal(requests, 1, 'Reprendre no ha de tornar a demanar un MP3 vàlid.');
      assert.equal(secondLedger.months['2026-10'].reservedCharacters, firstLedger.months['2026-10'].reservedCharacters);
      assert.equal(secondLedger.months['2026-10'].usedElsewhere, 100);
      const results = JSON.parse(await fsp.readFile(first.resultPath, 'utf8'));
      assert.equal(results.status, 'pending-review');
      assert.equal(results.files['id-0'], 'words/avió.mp3');
      const changedManifest=structuredClone(manifest);
      changedManifest.packs[0].rate='0%';
      const changed=await runGeneration({...options,manifest:changedManifest},dependencies);
      assert.equal(changed.reason,'pack-settings');
      assert.equal(requests,1,'Un canvi de veu o velocitat no ha de reutilitzar ni sobreescriure el paquet.');
    }

    {
      const outputRoot=await nextOutput();
      let ticks=0,requests=0;
      const result=await runGeneration(generationOptions(seedWith('avió')),{
        outputRoot,env:{SPEECH_KEY:'prova-local',SPEECH_REGION:'westeurope'},
        fetch:async()=>{requests++;return mp3Response();},
        now:()=>new Date(ticks++===0?'2026-10-31T23:59:59Z':'2026-11-01T00:00:00Z'),
        sleep:async()=>{},log:()=>{}
      });
      assert.equal(result.reason,'month-changed');
      assert.equal(requests,0,'Un canvi de mes requereix tornar a validar el pressupost abans de peticions.');
    }

    {
      const outputRoot=await nextOutput();let requests=0;
      const result=await runGeneration(generationOptions(seedWith('avió','metge')),{
        outputRoot,env:{SPEECH_KEY:'prova-local',SPEECH_REGION:'westeurope'},
        fetch:async()=>{requests++;return {ok:false,status:429};},
        now:fixedNow,sleep:async()=>{},log:()=>{}
      });
      assert.equal(result.reason,'http-429');assert.equal(requests,1);
      const ledger=JSON.parse(await fsp.readFile(path.join(outputRoot,'audio','usage.json'),'utf8'));
      assert(ledger.months['2026-10'].reservedCharacters>0,'Es conserva la reserva conservadora tot i l’error.');
    }

    {
      const outputRoot = await nextOutput();
      let releaseFetch;
      let announceFetch;
      const fetchStarted = new Promise(resolve => { announceFetch = resolve; });
      const dependencies = {
        outputRoot,
        env: { SPEECH_KEY: 'prova-local', SPEECH_REGION: 'westeurope' },
        fetch: async () => {
          announceFetch();
          await new Promise(resolve => { releaseFetch = resolve; });
          return mp3Response();
        },
        now: fixedNow,
        sleep: async () => {},
        log: () => {}
      };
      const firstPromise = runGeneration(generationOptions(seedWith('avió')), dependencies);
      await fetchStarted;
      const second = await runGeneration(generationOptions(seedWith('avió')), {
        ...dependencies,
        fetch: async () => { throw new Error('No s’hauria de cridar amb el lock ocupat.'); }
      });
      assert.equal(second.reason, 'lock');
      releaseFetch();
      const first = await firstPromise;
      assert.equal(first.ok, true);
      assert.equal(fs.existsSync(path.join(outputRoot, 'audio', 'usage.lock')), false);
    }

    {
      const ledger = { lastRequestStartedAt: '2026-10-24T12:00:00.000Z' };
      let delay = null;
      await waitForRequestSlot(ledger, () => new Date('2026-10-24T12:00:01.000Z'), async milliseconds => { delay = milliseconds; });
      assert.equal(delay, 3000);
    }

    {
      let requests = 0;
      const result = await runGeneration({
        ...generationOptions(seedWith('avió')),
        execute: false,
        confirmF0: false
      }, {
        outputRoot: await nextOutput(),
        fetch: async () => { requests += 1; return mp3Response(); },
        log: () => {}
      });
      assert.equal(result.simulated, true);
      assert.equal(requests, 0);
    }

    console.log('Proves locals d’eines d’àudio superades: SSML, paths, pressupost, represa, lock i simulació sense xarxa.');
  } finally {
    assert.equal(path.dirname(path.resolve(temporaryRoot)),path.resolve(os.tmpdir()));
    assert(path.basename(temporaryRoot).startsWith('plec-audio-tools-'));
    await fsp.rm(temporaryRoot, { recursive: true, force: true });
  }
}

main().catch(() => {
  console.error('Ha fallat la prova local de les eines d’àudio.');
  process.exitCode = 1;
});
