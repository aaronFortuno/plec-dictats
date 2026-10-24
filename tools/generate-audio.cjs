'use strict';

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const {
  DEFAULT_CATALOG,
  DEFAULT_MANIFEST,
  ROOT,
  buildJobs,
  parsePlanArguments,
  readJson,
  summarize
} = require('./audio-plan.cjs');

const MONTHLY_LIMIT = 400000;
const REQUEST_INTERVAL_MS = 4000;
const REQUEST_TIMEOUT_MS = 30000;

class StopBatch extends Error {
  constructor(reason) {
    super(reason);
    this.reason = reason;
  }
}

function utcMonth(date) {
  return date.toISOString().slice(0, 7);
}

function emptyLedger() {
  return { schemaVersion: 1, months: {}, lastRequestStartedAt: null };
}

function validateNonNegativeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} ha de ser un enter no negatiu.`);
  return value;
}

function validateLedger(ledger) {
  if (!ledger || ledger.schemaVersion !== 1 || !ledger.months || typeof ledger.months !== 'object' || Array.isArray(ledger.months)) {
    throw new Error('El ledger local no és vàlid.');
  }
  for (const [month, usage] of Object.entries(ledger.months)) {
    if (!/^\d{4}-\d{2}$/.test(month) || !usage || typeof usage !== 'object') throw new Error('El ledger local no és vàlid.');
    validateNonNegativeInteger(usage.reservedCharacters, 'Caràcters reservats');
    validateNonNegativeInteger(usage.usedElsewhere, 'Consum extern');
  }
  if (ledger.lastRequestStartedAt !== null && !Number.isFinite(Date.parse(ledger.lastRequestStartedAt))) {
    throw new Error('El darrer timestamp del ledger no és vàlid.');
  }
  return ledger;
}

async function atomicWriteJson(filePath, value) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.part`;
  await fsp.writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await fsp.rename(temporaryPath, filePath);
}

async function loadLedger(filePath) {
  try {
    return validateLedger(JSON.parse(await fsp.readFile(filePath, 'utf8')));
  } catch (error) {
    if (error.code === 'ENOENT') return emptyLedger();
    throw new Error('No es pot llegir un ledger local vàlid.');
  }
}

function monthUsage(ledger, month) {
  if (!ledger.months[month]) ledger.months[month] = { reservedCharacters: 0, usedElsewhere: 0 };
  return ledger.months[month];
}

function evaluateBudget(ledger, month, plannedCharacters, usedElsewhere = 0, limit = MONTHLY_LIMIT) {
  validateNonNegativeInteger(plannedCharacters, 'Previsió de caràcters');
  validateNonNegativeInteger(usedElsewhere, 'Consum extern');
  validateNonNegativeInteger(limit, 'Límit mensual');
  const usage = ledger.months[month] || { reservedCharacters: 0, usedElsewhere: 0 };
  const external = Math.max(usage.usedElsewhere, usedElsewhere);
  const previous = usage.reservedCharacters + external;
  return {
    previous,
    plannedCharacters,
    total: previous + plannedCharacters,
    remaining: Math.max(0, limit - previous),
    withinBudget: previous + plannedCharacters <= limit
  };
}

function isValidMp3(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 3) return false;
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) return true;
  return buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
}

function hasCompatibleAudioContentType(response) {
  const contentType = response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  return contentType === 'audio/mpeg' || contentType === 'audio/mp3' || contentType === 'audio/x-mpeg';
}

function resolveJobPath(outputRoot, packId, relativePath) {
  const packRoot = path.resolve(outputRoot, 'audio', packId);
  const destination = path.resolve(packRoot, ...relativePath.split('/'));
  if (destination !== packRoot && !destination.startsWith(`${packRoot}${path.sep}`)) {
    throw new Error('La ruta de sortida surt del directori del pack.');
  }
  return destination;
}

function acquireLock(lockPath) {
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  const descriptor = fs.openSync(lockPath, 'wx');
  fs.writeFileSync(descriptor, `${JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() })}\n`);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    fs.closeSync(descriptor);
    fs.unlinkSync(lockPath);
  };
}

function validateAzureEnvironment(env) {
  const key = env.SPEECH_KEY;
  const region = env.SPEECH_REGION;
  if (typeof key !== 'string' || !key || typeof region !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(region)) {
    throw new Error('Cal SPEECH_KEY i una SPEECH_REGION vàlida per generar àudio.');
  }
  return { key, region };
}

async function reserveRequest(ledger, ledgerPath, month, characters, startedAt) {
  const usage = monthUsage(ledger, month);
  usage.reservedCharacters += characters;
  ledger.lastRequestStartedAt = startedAt.toISOString();
  await atomicWriteJson(ledgerPath, ledger);
}

async function waitForRequestSlot(ledger, now, sleep) {
  if (!ledger.lastRequestStartedAt) return;
  const elapsed = now().getTime() - Date.parse(ledger.lastRequestStartedAt);
  const delay = Math.max(0, REQUEST_INTERVAL_MS - elapsed);
  if (delay > 0) await sleep(delay);
}

async function requestMp3(job, pack, azure, fetchImpl) {
  const endpoint = `https://${azure.region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  let response;
  try {
    response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': azure.key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': pack.format,
        'User-Agent': 'plec-dictats-static-audio/1'
      },
      body: job.ssml,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  } catch {
    throw new StopBatch('network-or-timeout');
  }
  if (!response.ok) throw new StopBatch(`http-${response.status}`);
  if (!hasCompatibleAudioContentType(response)) throw new StopBatch('content-type');
  let audio;
  try {
    audio = Buffer.from(await response.arrayBuffer());
  } catch {
    throw new StopBatch('response-body');
  }
  if (!audio.length || !isValidMp3(audio)) throw new StopBatch('invalid-mp3');
  return audio;
}

async function writeCompleteFile(destination, audio) {
  await fsp.mkdir(path.dirname(destination), { recursive: true });
  const temporaryPath = `${destination}.part`;
  await fsp.writeFile(temporaryPath, audio);
  await fsp.rename(temporaryPath, destination);
}

async function writeResults(outputRoot, plan, completed, now) {
  const files = {};
  for (const job of completed) files[job.id] = job.relativePath;
  const result = {
    schemaVersion: 1,
    pack: plan.pack.id,
    mode: plan.jobs[0]?.mode || null,
    status: 'pending-review',
    generatedAt: now().toISOString(),
    note: 'Resultat local pendent de revisió humana; no actualitza el manifest públic ni copia àudios a assets/.',
    files
  };
  const resultPath = path.join(outputRoot, 'results', `${plan.pack.id}-${plan.jobs[0]?.mode || 'empty'}.json`);
  await atomicWriteJson(resultPath, result);
  return resultPath;
}

function defaultSleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function runGeneration(options, dependencies = {}) {
  const log = dependencies.log || (message => console.log(message));
  const now = dependencies.now || (() => new Date());
  const sleep = dependencies.sleep || defaultSleep;
  const fetchImpl = dependencies.fetch;
  const outputRoot = dependencies.outputRoot || path.join(ROOT, 'output');
  const env = dependencies.env || process.env;
  const plan = buildJobs(options.seed, options.manifest, options);
  const estimate = summarize(plan.jobs);
  const external = options.usedElsewhere || 0;
  validateNonNegativeInteger(external, '--used-elsewhere');

  log(`Estimació: ${estimate.words} mots, ${estimate.characters} caràcters i ${estimate.requests} peticions (abans d’ometre MP3 vàlids).`);
  log('El límit local és conservador i no consulta el consum real d’Azure; comprova F0 i el consum al portal.');
  if (!options.execute || !options.confirmF0) {
    const missing = [!options.execute && '--execute', !options.confirmF0 && '--confirm-f0'].filter(Boolean).join(' i ');
    log(`Simulació sense xarxa ni fitxers d’àudio. Per a la generació real falta ${missing}.`);
    log('--confirm-f0 és una declaració de l’usuari, no una comprovació de l’SKU via API.');
    return { ok: true, simulated: true, estimate };
  }
  if (typeof fetchImpl !== 'function') throw new Error('Cal una implementació de fetch per a la generació real.');

  let azure;
  try {
    azure = validateAzureEnvironment(env);
  } catch {
    log('Generació aturada: calen SPEECH_KEY i SPEECH_REGION vàlides a l’entorn.');
    return { ok: false, reason: 'environment' };
  }

  const audioRoot = path.join(outputRoot, 'audio');
  const ledgerPath = path.join(audioRoot, 'usage.json');
  const lockPath = path.join(audioRoot, 'usage.lock');
  let releaseLock;
  try {
    releaseLock = acquireLock(lockPath);
  } catch {
    log('Generació aturada: una altra execució manté el lock del pressupost.');
    return { ok: false, reason: 'lock' };
  }

  const completed = [];
  let processingStarted = false;
  try {
    const ledger = await loadLedger(ledgerPath);
    const month = utcMonth(now());
    const usage = monthUsage(ledger, month);
    usage.usedElsewhere = Math.max(usage.usedElsewhere, external);

    // Un paquet identifica una veu i uns ajustos fixos: no reutilitzis MP3 d'una altra síntesi.
    const identity = {language:plan.pack.language,locale:plan.pack.locale,voice:plan.pack.voice,rate:plan.pack.rate,format:plan.pack.format};
    const fingerprint = crypto.createHash('sha256').update(JSON.stringify(identity)).digest('hex');
    const identityPath = path.join(audioRoot,plan.pack.id,'settings.json');
    let savedIdentity;
    try { savedIdentity = JSON.parse(await fsp.readFile(identityPath,'utf8')); }
    catch(error) { if(error.code!=='ENOENT') throw error; }
    if(savedIdentity && savedIdentity.fingerprint!==fingerprint) {
      log('Paquet aturat: han canviat la veu o els ajustos. Crea un paquet amb un ID nou per conservar els àudios anteriors.');
      return {ok:false,reason:'pack-settings'};
    }

    const pending = [];
    for (const job of plan.jobs) {
      const destination = resolveJobPath(outputRoot, plan.pack.id, job.relativePath);
      let existing = null;
      try {
        existing = await fsp.readFile(destination);
      } catch (error) {
        if (error.code !== 'ENOENT') throw new Error('No es pot comprovar un fitxer existent.');
      }
      if (existing && isValidMp3(existing)) {
        completed.push(job);
        log(`Omès (MP3 vàlid existent): ${job.relativePath}`);
      } else {
        if (existing) log(`L’existent no és un MP3 vàlid i es tornarà a generar: ${job.relativePath}`);
        pending.push({ job, destination });
      }
    }

    const plannedCharacters = pending.reduce((total, item) => total + item.job.billableCharacters, 0);
    const budget = evaluateBudget(ledger, month, plannedCharacters, external);
    await atomicWriteJson(ledgerPath, ledger);
    log(`Pressupost del mes ${month}: ${budget.previous} previs + ${budget.plannedCharacters} del lot = ${budget.total}/${MONTHLY_LIMIT}.`);
    if (!budget.withinBudget) {
      log('Lot aturat abans de qualsevol petició: el pressupost local és insuficient.');
      return { ok: false, reason: 'budget', budget };
    }
    await atomicWriteJson(identityPath,{fingerprint,...identity});
    log(`Pendents de descàrrega: ${pending.length}. Inicis separats com a mínim ${REQUEST_INTERVAL_MS / 1000} s; sense retries automàtics.`);
    processingStarted = true;

    for (let index = 0; index < pending.length; index += 1) {
      const { job, destination } = pending[index];
      await waitForRequestSlot(ledger, now, sleep);
      const startedAt = now();
      if(utcMonth(startedAt)!==month) throw new StopBatch('month-changed');
      await reserveRequest(ledger, ledgerPath, month, job.billableCharacters, startedAt);
      log(`[${index + 1}/${pending.length}] ${job.relativePath} · ${job.billableCharacters} caràcters reservats.`);
      const audio = await requestMp3(job, plan.pack, azure, fetchImpl);
      await writeCompleteFile(destination, audio);
      completed.push(job);
    }

    const resultPath = await writeResults(outputRoot, plan, completed, now);
    log(`Lot acabat. Manifest de resultats pendent de revisió: ${path.relative(ROOT, resultPath)}`);
    return { ok: true, simulated: false, downloaded: pending.length, skipped: completed.length - pending.length, resultPath };
  } catch (error) {
    if (processingStarted) {
      try {
        await writeResults(outputRoot, plan, completed, now);
      } catch {
        log('No s’ha pogut escriure el manifest local de resultats.');
      }
    }
    if (error instanceof StopBatch) {
      log(`Lot aturat per una resposta o connexió no vàlida (${error.reason}). Es conserven els MP3 ja completats; no es reintenta automàticament.`);
      return { ok: false, reason: error.reason };
    }
    log('Lot aturat per un error local. Revisa els fitxers de sortida i el ledger; no s’ha enviat cap error remot ni secret.');
    return { ok: false, reason: 'local-error' };
  } finally {
    if (releaseLock) releaseLock();
  }
}

function parseArguments(argv) {
  const options = {
    execute: false,
    confirmF0: false,
    usedElsewhere: 0
  };
  const passthrough = [];
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--execute') options.execute = true;
    else if (argument === '--confirm-f0') options.confirmF0 = true;
    else if (argument === '--used-elsewhere') {
      const value = argv[index + 1];
      if (!/^\d+$/.test(value || '') || !Number.isSafeInteger(Number(value))) throw new Error('--used-elsewhere ha de ser un enter no negatiu.');
      options.usedElsewhere = Number(value);
      index += 1;
    } else {
      passthrough.push(argument);
      if (['--mode','--pack','--limit','--words'].includes(argument) && argv[index + 1] !== undefined) {
        passthrough.push(argv[index + 1]);
        index += 1;
      }
    }
  }
  const planOptions = parsePlanArguments(passthrough);
  Object.assign(options, planOptions);
  return options;
}

function printHelp() {
  console.log('Ús: node tools/generate-audio.cjs [--mode words|pseudo] [--pack ID] [--limit N] [--words "mot,mot,..."] [--used-elsewhere N] [--execute --confirm-f0]');
  console.log('Per defecte només simula, sense xarxa. La generació real exigeix --execute I --confirm-f0.');
  console.log('--confirm-f0 declara que l’usuari usa F0; NO comprova l’SKU via API. Verifica’l al portal d’Azure.');
  console.log('SPEECH_KEY i SPEECH_REGION es llegeixen només de l’entorn. Límit local: 400.000 caràcters per mes UTC.');
  console.log('--used-elsewhere N declara consum extern del mateix recurs; es conserva el major valor declarat.');
}

if (require.main === module) {
  (async () => {
    try {
      const options = parseArguments(process.argv.slice(2));
      if (options.help) {
        printHelp();
        return;
      }
      const result = await runGeneration({
        ...options,
        seed: readJson(DEFAULT_CATALOG),
        manifest: readJson(DEFAULT_MANIFEST)
      }, { fetch: globalThis.fetch });
      if (!result.ok) process.exitCode = 1;
    } catch {
      console.error('No s’ha pogut preparar la generació. Revisa els arguments i les dades locals; no s’ha fet cap reintents.');
      process.exitCode = 1;
    }
  })();
}

module.exports = {
  MONTHLY_LIMIT,
  REQUEST_INTERVAL_MS,
  REQUEST_TIMEOUT_MS,
  acquireLock,
  atomicWriteJson,
  emptyLedger,
  evaluateBudget,
  hasCompatibleAudioContentType,
  isValidMp3,
  loadLedger,
  monthUsage,
  parseArguments,
  requestMp3,
  reserveRequest,
  resolveJobPath,
  runGeneration,
  utcMonth,
  validateAzureEnvironment,
  validateLedger,
  waitForRequestSlot,
  writeCompleteFile,
  writeResults
};
