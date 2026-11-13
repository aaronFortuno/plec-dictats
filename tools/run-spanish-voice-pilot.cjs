'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const A = require('./audio-plan.cjs');
const G = require('./generate-audio.cjs');
const { loadAzureEnvironment } = require('./azure-credentials.cjs');
const { replaceFileSync } = require('./local-files.cjs');
const registry = require('../catalogs/es/editions/manifest.json');
const edition = require('../catalogs/es/editions/seed-1-basic.json');

const words = [
  ['águila', 'Tilde, gu davant i', 'ˈa.gi.la'],
  ['acompañadas', 'Tònica a «ña» i final en -das', 'a.kom.pa.ˈɲa.das'],
  ['aquí', 'Qu i accent final', 'a.ˈki'],
  ['bicicleta', 'C davant i, grup cl', 'bi.θi.ˈkle.ta'],
  ['callejón', 'Ll, j i accent final', 'ka.ʝe.ˈxon'],
  ['creció', 'Grup cr i final tònic', 'kɾe.ˈθjo'],
  ['disfrazados', 'Z i s final', 'dis.fɾa.ˈθa.dos'],
  ['examen', 'X i n final', 'ek.ˈsa.men'],
  ['habíamos', 'H inicial, hiat i accent', 'a.ˈbi.a.mos'],
  ['hierba', 'H inicial i diftong', 'ˈjeɾ.ba'],
  ['leíste', 'Hiat amb i tònica', 'le.ˈis.te'],
  ['llegué', 'Ll, gu i accent final', 'ʝe.ˈge'],
  ['niño', 'Ñ i atac inicial', 'ˈni.ɲo'],
  ['reloj', 'Tònica a «loj» i j final', 're.ˈlox']
];
const voices = [['Elvira', 'Elvira'], ['Álvaro', 'Alvaro']];
const rate = '-10%';
const directory = path.join(A.ROOT, 'output/audio');
const shouldStop = () => fs.existsSync(path.join(directory, 'STOP'));

function prepare(useIpa = false) {
  const seedPath = path.join(A.ROOT, 'catalogs/es/editions/seed-1-basic.json');
  const sha = value => crypto.createHash('sha256').update(value).digest('hex');
  if (sha(fs.readFileSync(seedPath)) !== registry.editions.find(item => item.file === 'seed-1-basic.json')?.sha256) {
    throw new Error('L’edició castellana congelada no coincideix amb el seu manifest.');
  }
  const plans = voices.map(([name, voice]) => {
    const id = 'es-' + voice.toLowerCase() + '-voice-pilot-' + (useIpa ? 'ipa-v1' : 'v1');
    const pack = {
      id, provider: 'azure', language: 'es', locale: 'es-ES', voice: 'es-ES-' + voice + 'Neural',
      rate, format: A.OUTPUT_FORMAT, basePath: 'assets/audio/es/' + id + '/', files: {}, status: 'pending-review',
      contentFingerprint: sha(JSON.stringify({ revision: edition.catalog.revision, words: words.map(([word]) => word) }))
    };
    let seed = edition;
    if (useIpa) {
      // Keep the reference transcription readable and encode the palatal as Azure documents it.
      const ipaByWord = new Map(words.map(([word, , ipa]) => [word, ipa.replaceAll('ʝ', 'j͡j')]));
      const entries = edition.catalog.entries.filter(entry => ipaByWord.has(entry.text))
        .map(entry => ({ ...entry, ipa: ipaByWord.get(entry.text) }));
      seed = { catalog: { language: 'es', entries } };
      pack.generationPolicy = { requireIpa: true };
    }
    const config = { seed, manifest: { schemaVersion: 1, packs: [pack] }, pack: id, mode: 'words', words: words.map(([word]) => word) };
    const { jobs } = A.buildJobs(config.seed, config.manifest, config);
    return { name, pack, config, jobs, ...A.summarize(jobs) };
  });
  return { plans, requests: plans.reduce((sum, plan) => sum + plan.requests, 0), characters: plans.reduce((sum, plan) => sum + plan.characters, 0) };
}

function recording(plan, job) {
  const file = plan.pack.id + '/' + job.relativePath;
  const disk = path.join(directory, file);
  if (!fs.existsSync(disk) || !G.isValidMp3(fs.readFileSync(disk))) return null;
  return file.split('/').map(encodeURIComponent).join('/');
}

function writeComparison(plans, originals = []) {
  const esc = A.escapeXml;
  let available = 0;
  const paired = originals.length > 0;
  const rows = words.map(([word, focus, ipa], index) => {
    function take(plan, label) {
      const src = recording(plan, plan.jobs[index]);
      if (!src) return '<div>' + esc(label) + ' · Pendent</div>';
      available++;
      return '<div class="take"><small>' + esc(label) + '</small><audio controls preload="none" src="' + src + '" aria-label="' + esc(word + ' · ' + plan.name + ' · ' + label) + '"></audio></div>';
    }
    const takes = plans.map((plan, voice) => '<td>' +
      (paired ? take(originals[voice], 'Grafia') : '') + take(plan, paired ? 'AFI' : 'Grafia') + '</td>').join('');
    return '<tr><th scope="row"><strong lang="es">' + esc(word) + '</strong>' +
      (paired ? '<small>/' + esc(ipa) + '/</small>' : '') + '<small>' + esc(focus) + '</small></th>' + takes + '</tr>';
  }).join('\n');
  const headings = plans.map(plan => '<th scope="col">' + esc(plan.name) + '</th>').join('');
  const html = `<!doctype html><html lang="ca"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Plec · Elvira i Álvaro</title>
<style>:root{color-scheme:light dark;font:16px/1.5 system-ui}body{max-width:58rem;margin:2rem auto;padding:0 1rem}h1{line-height:1.15}table{width:100%;border-collapse:collapse;min-width:610px}th,td{padding:.6rem .65rem;text-align:left;border-bottom:1px solid #8886}td{width:34%}small{display:block;font-weight:400}.take+.take{margin-top:.4rem}audio{width:100%;max-width:275px;vertical-align:middle}.table-scroll{overflow:auto}</style>
<h1>Castellà · Elvira i Álvaro${paired ? ' · Grafia i AFI' : ''}</h1><p>${available} de ${(plans.length + originals.length) * words.length} àudios. Mateixos mots, pronunciació es-ES i velocitat −10 % a les dues veus.</p>
${paired ? '<p>Escolta «Grafia» i «AFI» dins la mateixa columna. El signe ˈ precedeix la síl·laba tònica. La transcripció és fonològica, amb distinció entre /s/ i /θ/ i amb ieisme.</p>' : ''}
<div class="table-scroll" role="region" aria-label="Comparació de les dues veus" tabindex="0"><table><thead><tr><th scope="col">Mot i focus d’escolta</th>${headings}</tr></thead><tbody>${rows}</tbody></table></div>
<script>document.addEventListener('play',event=>{if(event.target.tagName==='AUDIO')for(const player of document.querySelectorAll('audio'))if(player!==event.target)player.pause();},true);</script></html>`;
  const file = path.join(directory, paired ? 'comparacio-castella-afi.html' : 'comparacio-castella.html');
  fs.writeFileSync(file + '.part', html);
  replaceFileSync(file + '.part', file);
  return available;
}

async function main(args) {
  if (args.some(arg => !['--execute', '--confirm-f0', '--ipa'].includes(arg))) {
    throw new Error('Ús: node tools/run-spanish-voice-pilot.cjs [--ipa] [--execute --confirm-f0]');
  }
  const useIpa = args.includes('--ipa');
  const pilot = prepare(useIpa);
  const originals = useIpa ? prepare().plans : [];
  const execute = args.includes('--execute');
  console.log(JSON.stringify({ simulated: !execute, words: words.length, requests: pilot.requests, characters: pilot.characters }));
  if (!execute) return;
  if (!args.includes('--confirm-f0')) throw new Error('Cal confirmar l’ús del recurs F0.');
  if (shouldStop()) throw new Error('El fitxer STOP és actiu.');
  const ledger = await G.loadLedger(path.join(directory, 'usage.json'));
  const month = G.utcMonth(new Date());
  if (!G.evaluateBudget(ledger, month, pilot.characters).withinBudget) throw new Error('Pressupost local insuficient per a la mostra.');
  const release = G.acquireLock(path.join(directory, 'spanish-voice-pilot.lock'));
  try {
    // Use the existing private F0 configuration, independent of shell overrides.
    const env = loadAzureEnvironment({});
    writeComparison(pilot.plans, originals);
    for (const plan of pilot.plans) {
      if (G.utcMonth(new Date()) !== month) throw new Error('El mes del registre local ha canviat.');
      console.log('Veu: ' + plan.name);
      const result = await G.runGeneration({ ...plan.config, execute: true, confirmF0: true, retryTransient: false }, {
        env, fetch: globalThis.fetch, shouldStop
      });
      writeComparison(pilot.plans, originals);
      if (!result.ok) throw new Error('Mostra aturada (' + result.reason + ').');
    }
    const available = writeComparison(pilot.plans, originals);
    if (available !== pilot.requests + originals.length * words.length) throw new Error('La mostra no té tots els MP3 previstos.');
    console.log(available + ' MP3 disponibles al comparador local.');
  } finally {
    release();
  }
}

if (require.main === module) main(process.argv.slice(2)).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
