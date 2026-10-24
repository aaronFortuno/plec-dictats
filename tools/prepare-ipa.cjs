'use strict';

// Offline only: this module never loads credentials or calls a synthesis service.
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, buildSsml, wordFileName, validatePack } = require('./audio-plan.cjs');
const {analyzeIpa} = require('./ipa-inventory.cjs');

const SOURCE = path.join(ROOT, 'audio/pronunciation/ca-central-diaeresis.tsv');
const METADATA = path.join(ROOT, 'audio/pronunciation/ca-central-diaeresis.json');
const HEADER = ['mot', 'ipa', 'estat', 'base', 'lema', 'fonts', 'notes', 'id'];

function parseTsv(text) {
  const lines = text.replace(/^\uFEFF/u, '').trimEnd().split(/\r?\n/u);
  if (lines.shift() !== HEADER.join('\t')) throw new Error('Capçalera TSV inesperada.');
  return lines.map((line, index) => {
    const values = line.split('\t');
    if (values.length !== HEADER.length) throw new Error(`Nombre de columnes incorrecte a la fila ${index + 2}.`);
    return Object.fromEntries(HEADER.map((key, column) => [key, values[column]]));
  });
}

function validateRows(rows, catalog, metadata) {
  if (metadata.schemaVersion !== 1 || metadata.language !== catalog.language || metadata.catalogFingerprint !== catalog.fingerprint) throw new Error('Edició del catàleg incompatible amb les pronunciacions.');
  const targets = catalog.entries.filter(entry => entry.mode === 'words' && /[ïü]/iu.test(entry.text.normalize('NFC')));
  const byId = new Map(targets.map(entry => [entry.id, entry]));
  const seen = new Set();
  const byWord = new Map();
  if (rows.length !== targets.length || rows.length !== metadata.expectedWords) throw new Error('La taula no cobreix tots els mots amb dièresi.');
  for (const row of rows) {
    const entry = byId.get(row.id);
    if (!entry || entry.text !== row.mot || seen.has(row.id) || byWord.has(row.mot)) throw new Error(`ID, grafia o duplicat incorrecte: ${row.mot}.`);
    seen.add(row.id);
    byWord.set(row.mot, row);
    if (!['prepared', 'needs-review'].includes(row.estat)) throw new Error(`Estat desconegut: ${row.mot}.`);
    if (!['dictionary-word', 'dictionary-lemma', 'normative-rule', 'editorial-proposal'].includes(row.base) || !row.lema) throw new Error(`Falta la base lingüística: ${row.mot}.`);
    const urls = row.fonts.split(' | ');
    if (!urls.length || urls.some(url => !/^https:\/\/[^\s|]+$/u.test(url))) throw new Error(`Fonts invàlides: ${row.mot}.`);
    if (row.estat === 'needs-review' && !row.notes) throw new Error(`Cal explicar el dubte: ${row.mot}.`);
    try { analyzeIpa(row.ipa); } catch (error) { throw new Error(`${row.mot}: ${error.message}`); }
  }
  // A diacritic-free URL can point to a DIFFERENT word: these sources were rejected.
  for (const [word, wrongUrl] of Object.entries({
    'reïna': 'https://www.diccionari.cat/catala-angles/reina',
    'roïna': 'https://www.diccionari.cat/catala-angles/roina',
    'esglaï': 'https://www.diccionari.cat/catala-angles/esglai'
  })) if (byWord.get(word)?.fonts.split(' | ').includes(wrongUrl)) throw new Error(`La font correspon a un altre mot: ${word}.`);
  for (const word of metadata.auditionWords) {
    if (!byWord.has(word) || byWord.get(word).estat !== 'prepared') throw new Error(`Mot de mostra no preparat: ${word}.`);
  }
  return rows;
}

function buildPhonemeSsml(pack, row) {
  if (typeof row.ipa !== 'string') throw new Error('Falta la transcripció IPA.');
  return buildSsml(pack, row.mot, row.ipa);
}

function buildPlan(rows, catalog, metadata) {
  validateRows(rows, catalog, metadata);
  const pack = validatePack({ schemaVersion: 1, packs: [metadata.candidatePack] }, metadata.candidatePack.id);
  const jobs = rows.map(row => ({
    id: row.id, text: row.mot, ipa: row.ipa, ...analyzeIpa(row.ipa),
    reviewStatus: row.estat, auditoryReview: 'pending',
    relativePath: `words/${wordFileName(row.mot)}`,
    ...buildPhonemeSsml(pack, row)
  }));
  return {
    schemaVersion: 1, kind: 'offline-ipa-candidates',
    executable: false, reason: 'Cal escoltar la mostra IPA i resoldre els dubtes abans de connectar aquest pla al generador.',
    catalogFingerprint: metadata.catalogFingerprint, pack,
    summary: { words: jobs.length, needsReview: rows.filter(row => row.estat === 'needs-review').length,
      estimatedCharacters: jobs.reduce((total, job) => total + job.billableCharacters, 0) },
    auditionWords: metadata.auditionWords, jobs
  };
}

function loadPlan() {
  const metadata = JSON.parse(fs.readFileSync(METADATA, 'utf8'));
  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, metadata.catalogPath), 'utf8')).catalog;
  return buildPlan(parseTsv(fs.readFileSync(SOURCE, 'utf8')), catalog, metadata);
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    if (args.some(arg => arg !== '--write') || args.length > 1) throw new Error('Ús: node tools/prepare-ipa.cjs [--write]. No hi ha opció d’execució Azure.');
    const plan = loadPlan();
    if (args.includes('--write')) {
      const destination = path.join(ROOT, 'output/audio/ipa/plan.json');
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, JSON.stringify(plan, null, 2) + '\n');
      console.log('Pla SSML local: output/audio/ipa/plan.json');
    }
    console.log(`${plan.summary.words} propostes IPA · ${plan.summary.needsReview} dubtes · ${plan.summary.estimatedCharacters} caràcters estimats. Sense peticions Azure.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = { SOURCE, METADATA, analyzeIpa, parseTsv, validateRows, buildPhonemeSsml, buildPlan, loadPlan };
