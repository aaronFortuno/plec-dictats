'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_CATALOG = path.join(ROOT, 'catalogs', 'ca', 'editions', 'seed-1.json');
const DEFAULT_MANIFEST = path.join(ROOT, 'audio', 'manifest.json');
const VOICES = new Set([
  'ca-ES-AlbaNeural',
  'ca-ES-JoanaNeural',
  'ca-ES-EnricNeural'
]);
const OUTPUT_FORMAT = 'audio-24khz-48kbitrate-mono-mp3';

function fail(message) {
  throw new Error(message);
}

function countCharacters(text) {
  return [...text].length;
}

function escapeXml(text) {
  return text.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
  })[character]);
}

function validateRate(rate) {
  const match = /^([+-]?)(\d{1,3})%$/.exec(rate || '');
  if (!match) fail('El rate del pack ha de ser un percentatge enter.');
  const value = Number(`${match[1]}${match[2]}`);
  if (value < -50 || value > 100) fail('El rate del pack ha d’estar entre -50% i +100%.');
  return rate;
}

function validateRelativePath(value, label) {
  if (typeof value !== 'string' || !value || value.includes('\\') || value.startsWith('/') || /^[a-zA-Z]:/.test(value) || /[\0-\x1f\x7f]/.test(value)) {
    fail(`${label} ha de ser una ruta relativa amb separadors «/».`);
  }
  const parts = value.split('/');
  if (parts.some(part => !part || part === '.' || part === '..')) {
    fail(`${label} conté segments de ruta no vàlids.`);
  }
  return value;
}

function validatePack(manifest, packId) {
  if (!manifest || manifest.schemaVersion !== 1 || !Array.isArray(manifest.packs)) {
    fail('El manifest d’àudio no té l’esquema esperat.');
  }
  const id = packId || manifest.defaultPacks?.ca;
  if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    fail('Cal un identificador de pack vàlid.');
  }
  const pack = manifest.packs.find(candidate => candidate?.id === id);
  if (!pack) fail(`No existeix el pack «${id}».`);
  if (pack.provider !== 'azure' || pack.language !== 'ca' || pack.locale !== 'ca-ES' || !VOICES.has(pack.voice)) {
    fail(`El pack «${id}» no té un proveïdor o una veu admesa.`);
  }
  if (pack.format !== OUTPUT_FORMAT) fail(`El format del pack «${id}» no és l’MP3 admès.`);
  if (typeof pack.locale !== 'string' || !/^[a-z]{2,3}-[A-Z]{2}$/.test(pack.locale)) {
    fail(`La locale del pack «${id}» no és vàlida.`);
  }
  validateRate(pack.rate);
  if (typeof pack.basePath !== 'string' || !pack.basePath.endsWith('/')) {
    fail(`El basePath del pack «${id}» ha d’acabar en «/».`);
  }
  validateRelativePath(pack.basePath.slice(0, -1), `basePath de ${id}`);
  if (!pack.files || typeof pack.files !== 'object' || Array.isArray(pack.files)) {
    fail(`El mapa files del pack «${id}» no és vàlid.`);
  }
  for (const relativePath of Object.values(pack.files)) {
    validateRelativePath(relativePath, `Ruta del pack ${id}`);
  }
  return pack;
}

function wordFileName(text) {
  if (typeof text !== 'string' || !text || text !== text.trim()) {
    fail('El text del catàleg ha de ser una cadena no buida i sense espais laterals.');
  }
  if (/[/\\\0-\x1f\x7f<>:"|?*]/.test(text) || text === '.' || text === '..' || /[. ]$/.test(text)) {
    fail(`El text «${text}» no és un nom de fitxer segur.`);
  }
  return `${text.normalize('NFC').toLowerCase()}.mp3`;
}

function buildSsml(pack, text) {
  const escapedText = escapeXml(text);
  const billableBody = `<prosody rate="${pack.rate}">${escapedText}</prosody>`;
  return {
    ssml: `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${pack.locale}"><voice name="${pack.voice}">${billableBody}</voice></speak>`,
    billableBody,
    billableCharacters: countCharacters(billableBody)
  };
}

function buildJobs(seed, manifest, options = {}) {
  const mode = options.mode || 'words';
  if (mode !== 'words' && mode !== 'pseudo') fail('El mode ha de ser words o pseudo.');
  const catalog = seed?.catalog || seed;
  if (!catalog || !Array.isArray(catalog.entries)) fail('El catàleg no conté entries.');
  const pack = validatePack(manifest, options.pack);
  if (catalog.language && catalog.language !== pack.language) fail('La llengua del catàleg i del paquet no coincideix.');
  const seenIds = new Set();
  const seenPaths = new Map();
  const jobs = [];

  for (const entry of catalog.entries) {
    if (!entry || typeof entry.id !== 'string' || !entry.id || typeof entry.text !== 'string') {
      fail('Hi ha una entrada del catàleg sense id o text vàlids.');
    }
    if (seenIds.has(entry.id)) fail(`ID duplicat al catàleg: ${entry.id}.`);
    seenIds.add(entry.id);
    if (entry.mode !== mode) continue;

    const fileName = wordFileName(entry.text);
    const relativePath = `${mode}/${fileName}`;
    validateRelativePath(relativePath, 'Ruta de job');
    const collisionKey = relativePath.normalize('NFC').toLowerCase();
    if (seenPaths.has(collisionKey)) {
      fail(`Col·lisió de ruta entre ${seenPaths.get(collisionKey)} i ${entry.id}: ${relativePath}.`);
    }
    seenPaths.set(collisionKey, entry.id);
    jobs.push({
      id: entry.id,
      text: entry.text,
      mode,
      relativePath,
      ...buildSsml(pack, entry.text)
    });
  }

  let selection = jobs;
  if (options.words) {
    const requested = [...new Set(options.words.map(word => word.trim().normalize('NFC').toLocaleLowerCase('ca')))];
    const byWord = new Map(jobs.map(job => [job.text.normalize('NFC').toLocaleLowerCase('ca'), job]));
    if (!requested.length || requested.some(word => !byWord.has(word))) fail('Algun mot de la mostra no existeix al banc i mode seleccionats.');
    selection = requested.map(word => byWord.get(word));
  }
  if (options.limit !== undefined) {
    if (!Number.isSafeInteger(options.limit) || options.limit < 0) fail('El límit ha de ser un enter no negatiu.');
    return { pack, jobs: selection.slice(0, options.limit), totalAvailable: selection.length };
  }
  return { pack, jobs: selection, totalAvailable: selection.length };
}

function summarize(jobs) {
  return {
    words: jobs.length,
    characters: jobs.reduce((total, job) => total + job.billableCharacters, 0),
    requests: jobs.length
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parsePlanArguments(argv) {
  const options = { mode: 'words', limit: 12 };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--mode' || argument === '--pack' || argument === '--limit' || argument === '--words') {
      const value = argv[index + 1];
      if (value === undefined) fail(`Falta el valor de ${argument}.`);
      index += 1;
      if (argument === '--mode') options.mode = value;
      if (argument === '--pack') options.pack = value;
      if (argument === '--words') options.words = value.split(',');
      if (argument === '--limit') {
        if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) fail('--limit ha de ser un enter no negatiu.');
        options.limit = Number(value);
      }
    } else if (argument === '--help' || argument === '-h') {
      options.help = true;
    } else {
      fail(`Argument desconegut: ${argument}.`);
    }
  }
  return options;
}

function printPlan(plan) {
  const summary = summarize(plan.jobs);
  console.log(`Pack: ${plan.pack.id} · veu: ${plan.pack.voice}`);
  console.log(`Mots: ${summary.words} · caràcters estimats: ${summary.characters} · peticions: ${summary.requests}`);
  for (const job of plan.jobs) console.log(`${job.id}\t${job.relativePath}\t${job.billableCharacters}`);
}

function runCli(argv = process.argv.slice(2)) {
  const options = parsePlanArguments(argv);
  if (options.help) {
    console.log('Ús: node tools/audio-plan.cjs [--mode words|pseudo] [--pack ID] [--limit N] [--words "mot,mot,..."]');
    console.log('Sense xarxa. Per defecte mostra com a màxim 12 jobs de words; --limit N fixa el nombre explícit.');
    return;
  }
  const plan = buildJobs(readJson(DEFAULT_CATALOG), readJson(DEFAULT_MANIFEST), options);
  printPlan(plan);
  if (options.limit !== undefined && plan.totalAvailable > plan.jobs.length) {
    console.log(`Mostrats ${plan.jobs.length} de ${plan.totalAvailable} jobs disponibles.`);
  }
}

if (require.main === module) {
  try {
    runCli();
  } catch {
    console.error('No s’ha pogut construir el pla d’àudio. Revisa els arguments, el catàleg i el manifest.');
    process.exitCode = 1;
  }
}

module.exports = {
  DEFAULT_CATALOG,
  DEFAULT_MANIFEST,
  OUTPUT_FORMAT,
  ROOT,
  VOICES,
  buildJobs,
  buildSsml,
  countCharacters,
  escapeXml,
  parsePlanArguments,
  printPlan,
  readJson,
  summarize,
  validatePack,
  validateRate,
  validateRelativePath,
  wordFileName
};
