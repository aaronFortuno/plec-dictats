/* JSON is the source. Runtime bundles and review files are reproducible outputs. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const json = name => JSON.parse(read(name));
const hash = data => crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
const check = process.argv.includes('--check');
let stale = false;
function emit(name, text) {
  const file = path.join(root, name);
  if (check) { if (!fs.existsSync(file) || read(name) !== text) { console.error('Cal regenerar: ' + name); stale = true; } }
  else { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); }
}
const bundle = (global, data) => '/* Generat amb tools/build-catalogs.cjs. Edita el JSON font. */\n(function(root){root.' + global + '=' + JSON.stringify(data) + ';if(typeof module!=="undefined")module.exports=root.' + global + ';})(typeof window==="undefined"?globalThis:window);\n';
const manifest = json('locales/manifest.json');
emit('locales/manifest.js', bundle('PlecLanguages', manifest));
for (const item of manifest.languages) {
  const profile = json(item.config), source = json(profile.catalogue);
  if (profile.id !== item.id || source.language !== item.id) throw new Error('Language mismatch');
  const fingerprint = hash({ source, profile });
  const revision = source.edition + '.' + fingerprint.slice(0, 16);
  const catalog = { ...source, fingerprint, revision };
  const base = path.posix.dirname(profile.catalogue);
  const collator = new Intl.Collator(profile.locale, { sensitivity: 'variant' });
  emit(base + '/catalog.js', bundle('PlecCatalog', catalog));
  emit(path.posix.dirname(item.config) + '/config.js', bundle('PlecLanguage', profile));
  for (const [mode, name] of [['words', 'paraules'], ['pseudo', 'pseudoparaules']]) {
    const entries = source.entries.filter(e => e.mode === mode).sort((a, b) => collator.compare(a.text, b.text));
    emit(base + '/' + name + '.txt', entries.map(e => e.text).join('\n') + '\n');
  }
  emit(base + '/revisio.tsv', ['paraula\ttipus\tvocabulari\tortografia\tfocus\tid', ...[...source.entries].sort((a,b)=>collator.compare(a.text,b.text)).map(e => [e.text,e.mode,e.vocabulary||'',e.orthography||'',e.tags.join(','),e.id].join('\t'))].join('\n')+'\n');
  // Every locale gets a real directory entry point; project subpaths and file:// work.
  const prefix = '../'.repeat(item.path.split('/').filter(Boolean).length);
  let html = read(profile.template);
  html = html.replace(/((?:src|href)=")(?!https?:|lightning:|#|\.\/)([^\"]+)/g, (_, start, target) => start + prefix + target);
  html = html.replace('catalog.js?v=1.7.0', base + '/catalog.js?v=1.7.0');
  html = html.replace('<script defer src="' + prefix + base, '<script defer src="' + prefix + 'locales/manifest.js?v=1.7.0"></script>\n  <script defer src="' + prefix + path.posix.dirname(item.config) + '/config.js?v=1.7.0"></script>\n  <script defer src="' + prefix + 'language.js?v=1.7.0"></script>\n  <script defer src="' + prefix + base);
  emit(item.path + 'index.html', html);
  console.log(item.id + ': ' + source.entries.filter(e=>e.mode==='words').length + ' paraules · ' + revision);
}
emit('index.html', '<!doctype html>\n<html lang="ca"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Plec</title><link rel="icon" href="assets/favicon.svg"><script>location.replace(new URL(' + JSON.stringify(manifest.defaultLanguage + '/') + '+location.search+location.hash,location.href));</script><p><a href="' + manifest.defaultLanguage + '/">Obre Plec · Català</a></p></html>\n');
emit('catalog.js', '/* Compatibilitat amb les eines anteriors. El navegador carrega el paquet de cada llengua. */\nmodule.exports = require("./catalogs/ca/catalog.js");\n');
if (stale) process.exitCode = 1;
module.exports = { hash };
