/* JSON is the source. Runtime bundles and review files are reproducible outputs. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { assertStableCatalogue } = require('./catalog-policy.cjs');
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
for (const item of manifest.languages) {
  const profile = json(item.config), source = json(profile.catalogue);
  const validationPath = path.posix.dirname(profile.catalogue) + '/validation.json';
  assertStableCatalogue(source, read(profile.catalogue), fs.existsSync(path.join(root,validationPath)) ? json(validationPath) : null);
}
// Review TXT files can be edited by a teacher. Never overwrite an edited review.
// The previous runtime bundle is the baseline, independent of incoming JSON changes.
if (!check) for (const item of manifest.languages) {
  const profile = json(item.config), base = path.posix.dirname(profile.catalogue);
  const previous = path.join(root, base, 'catalog.js');
  if (!fs.existsSync(previous)) continue;
  const old = require(previous), collator = new Intl.Collator(profile.locale, { sensitivity: 'variant' });
  for (const [mode, name] of [['words','paraules'],['pseudo','pseudoparaules']]) {
    const file = base + '/' + name + '.txt';
    if (!fs.existsSync(path.join(root,file))) continue;
    const baseline = old.entries.filter(e=>e.mode===mode).map(e=>e.text).sort(collator.compare).join('\n')+'\n';
    if (read(file).replace(/\r\n/g,'\n').replace(/^\uFEFF/,'') !== baseline) {
      throw new Error('El fitxer '+file+' conté una revisió manual. Conserva-la i incorpora els canvis abans de regenerar; no se sobreescriurà.');
    }
  }
}
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
  const registryPath = base + '/editions/manifest.json';
  if (fs.existsSync(path.join(root,registryPath))) {
    const registry=json(registryPath),slots=new Set();
    const editions=registry.editions.map(item=>{
      const file=base+'/editions/'+item.file,bytes=fs.readFileSync(path.join(root,file));
      const digest=crypto.createHash('sha256').update(bytes).digest('hex');
      if(digest!==item.sha256)throw new Error('Immutable seed snapshot changed: '+file);
      const edition=JSON.parse(bytes.toString('utf8'));
      if(slots.has(edition.slot)||edition.slot!==item.slot||edition.language!==profile.id||edition.catalog.revision!==item.revision)throw new Error('Invalid seed registry');
      slots.add(edition.slot);return edition;
    });
    if(!slots.has(registry.current))throw new Error('Current seed edition missing');
    emit(base+'/editions/index.js',bundle('PlecSeedRegistry',{current:registry.current,editions}));
  }
  emit(path.posix.dirname(item.config) + '/config.js', bundle('PlecLanguage', profile));
  for (const [mode, name] of [['words', 'paraules'], ['pseudo', 'pseudoparaules']]) {
    const entries = source.entries.filter(e => e.mode === mode).sort((a, b) => collator.compare(a.text, b.text));
    emit(base + '/' + name + '.txt', entries.map(e => e.text).join('\n') + '\n');
  }
  emit(base + '/revisio.tsv', ['paraula\ttipus\tvocabulari\tortografia\tfocus\tid', ...[...source.entries].sort((a,b)=>collator.compare(a.text,b.text)).map(e => [e.text,e.mode,e.vocabulary||'',e.orthography||'',e.tags.join(','),e.id].join('\t'))].join('\n')+'\n');
  // Every locale gets a real directory entry point; project subpaths and file:// work.
  const prefix = '../'.repeat(item.path.split('/').filter(Boolean).length);
  let html = read(profile.template);
  const assetVersion = /src="catalog\.js(\?[^\"]*)"/.exec(html)?.[1] || '';
  html = html.replace(/((?:src|href)=")(?!https?:|lightning:|#|\.\/)([^\"]+)/g, (_, start, target) => start + prefix + target);
  html = html.replace('catalog.js' + assetVersion, base + '/catalog.js' + assetVersion);
  html = html.replace('<script defer src="' + prefix + base, '<script defer src="' + prefix + 'locales/manifest.js' + assetVersion + '"></script>\n  <script defer src="' + prefix + path.posix.dirname(item.config) + '/config.js' + assetVersion + '"></script>\n  <script defer src="' + prefix + 'language.js' + assetVersion + '"></script>\n  <script defer src="' + prefix + base);
  emit(item.path + 'index.html', html);
  console.log(item.id + ': ' + source.entries.filter(e=>e.mode==='words').length + ' paraules · ' + revision);
}
emit('index.html', '<!doctype html>\n<html lang="ca"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Plec</title><link rel="icon" href="assets/favicon.svg"><script>location.replace(new URL(' + JSON.stringify(manifest.defaultLanguage + '/') + '+location.search+location.hash,location.href));</script><p><a href="' + manifest.defaultLanguage + '/">Obre Plec · Català</a></p></html>\n');
emit('catalog.js', '/* Compatibilitat amb les eines anteriors. El navegador carrega el paquet de cada llengua. */\nmodule.exports = require("./catalogs/ca/catalog.js");\n');
if (stale) process.exitCode = 1;
module.exports = { hash };
