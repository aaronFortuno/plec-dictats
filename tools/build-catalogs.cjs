/* JSON is the source. Runtime bundles and review files are reproducible outputs. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { assertStableCatalogue } = require('./catalog-policy.cjs');
const { publishOutputs } = require('./generated-output.cjs');
const { localizeHTML } = require('./localize-html.cjs');
const Brand = require('../brand.js');
const { PSEUDO_FOCUSES } = require('../seeds.js');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const json = name => JSON.parse(read(name));
const hash = data => crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
const check = process.argv.includes('--check');
let stale = false;
// Nothing reaches the filesystem until every source and rendered output exists.
const outputs = new Map();
const summaries = [];
function emit(name, text) {
  if (outputs.has(name)) throw new Error('Duplicate generated output: ' + name);
  outputs.set(name, text);
}
const bundle = (global, data) => '/* Generat amb tools/build-catalogs.cjs. Edita el JSON font. */\n(function(root){root.' + global + '=' + JSON.stringify(data) + ';if(typeof module!=="undefined")module.exports=root.' + global + ';})(typeof window==="undefined"?globalThis:window);\n';
emit('text-audio.js',bundle('PlecTextAudio',json('audio/texts/index.json')));
emit('text-review-notes.js',bundle('PlecTextAudioReview',json('audio/texts/review-notes.json')));
emit('rhythm-profiles.js',bundle('PlecRhythmProfiles',json('content/rhythm-profiles-v1.json')));
emit('rhythm-labels.js',bundle('PlecRhythmLabels',json('content/rhythm-labels.json')));
emit('text-catalogue.js',bundle('PlecTextCatalogue',json('content/texts/index.json').map(id=>json('content/texts/'+id+'.json'))));
const textIds=json('content/texts/index.json'),prosodyIds=json('content/prosody/index.json');
if(!Array.isArray(prosodyIds)||new Set(prosodyIds).size!==prosodyIds.length||prosodyIds.some(id=>!textIds.includes(id)))throw Error('Invalid prosody registry.');
emit('prosody-draft.js',bundle('PlecProsodyDraft',Object.fromEntries(prosodyIds.map(id=>[id,json('content/prosody/'+id+'.json')]))));
const manifest = json('locales/manifest.json');
if (!Array.isArray(manifest.languages) || !manifest.languages.length || !manifest.languages.some(item=>item.id===manifest.defaultLanguage)) throw new Error('Invalid language manifest');
if (new Set(manifest.languages.map(item=>item.id)).size!==manifest.languages.length || new Set(manifest.languages.map(item=>item.path)).size!==manifest.languages.length) throw new Error('Duplicate language manifest entry');
function prepareLanguage(item) {
  const profile = json(item.config), source = json(profile.catalogue);
  const validationPath = path.posix.dirname(profile.catalogue) + '/validation.json';
  assertStableCatalogue(source, read(profile.catalogue), fs.existsSync(path.join(root,validationPath)) ? json(validationPath) : null);
  if (profile.id !== item.id || source.language !== item.id) throw new Error('Language mismatch');
  if (profile.seedFocuses) {
    const focuses = {words:profile.seedFocuses,pseudo:PSEUDO_FOCUSES};
    const valid = (mode,id) => Object.hasOwn(focuses,mode) && focuses[mode].includes(id);
    if (profile.seedFocuses.length !== 12 || new Set(profile.seedFocuses).size !== 12 ||
        source.categories.some(category => !valid(category.mode,category.id)) ||
        source.entries.some(entry => !entry.tags.length || entry.tags.some(tag => !valid(entry.mode,tag)))) {
      throw new Error('Invalid locale seed focuses: ' + item.id);
    }
  }
  const fingerprint = hash({ source, profile });
  const revision = source.edition + '.' + fingerprint.slice(0, 16);
  const catalog = { ...source, fingerprint, revision };
  const base = path.posix.dirname(profile.catalogue);
  const collator = new Intl.Collator(profile.locale, { sensitivity: 'variant' });
  const registryPath = base + '/editions/manifest.json';
  let seedRegistry;
  if (fs.existsSync(path.join(root,registryPath))) {
    const registry=json(registryPath),slots=new Set();
    if (!Array.isArray(registry.editions) || !registry.editions.length) throw new Error('Invalid seed registry');
    const editions=registry.editions.map(item=>{
      const file=base+'/editions/'+item.file,bytes=fs.readFileSync(path.join(root,file));
      const digest=crypto.createHash('sha256').update(bytes).digest('hex');
      if(digest!==item.sha256)throw new Error('Immutable seed snapshot changed: '+file);
      const edition=JSON.parse(bytes.toString('utf8'));
      if(slots.has(edition.slot)||edition.slot!==item.slot||edition.language!==profile.id||edition.catalog.revision!==item.revision)throw new Error('Invalid seed registry');
      slots.add(edition.slot);return edition;
    });
    if(!slots.has(registry.current))throw new Error('Current seed edition missing');
    if(editions.find(e=>e.slot===registry.current).catalog.fingerprint!==fingerprint)throw new Error('El catàleg font ha canviat. Cal una edició nova per conservar els codis ja publicats.');
    if(registry.basic!==undefined){
      const basic=editions.find(e=>e.slot===registry.basic),full=editions.find(e=>e.slot===registry.current);
      if(!basic||basic.selection?.vocabulary!=='basic'||basic.catalog.entries.filter(e=>e.mode==='words').length!==registry.basicWordCount)throw new Error('Invalid basic vocabulary edition');
      const expected=full.catalog.entries.filter(e=>e.mode==='words'&&e.basicVocabulary).map(e=>e.id);
      if(JSON.stringify(expected)!==JSON.stringify(basic.catalog.entries.filter(e=>e.mode==='words').map(e=>e.id)))throw new Error('Basic vocabulary edition differs from its list');
    }
    seedRegistry={current:registry.current,...(registry.basic!==undefined?{basic:registry.basic,basicWordCount:registry.basicWordCount}:{}),editions};
  }
  let basicWords;
  if(source.basicVocabulary){
    const basic=json(base+'/'+source.basicVocabulary.source);
    basicWords=source.entries.filter(e=>e.mode==='words'&&e.basicVocabulary).map(e=>e.text).sort(collator.compare);
    if(JSON.stringify(basicWords)!==JSON.stringify(basic.words)||basicWords.length!==source.basicVocabulary.count)throw new Error('Basic vocabulary annotations and editorial list differ');
  }
  return {item,profile,source,fingerprint,revision,catalog,base,collator,seedRegistry,basicWords};
}
// Complete validation of every locale before rendering or publishing any locale.
const languages = manifest.languages.map(prepareLanguage);
// Review TXT files can be edited by a teacher. Never overwrite an edited review.
// The previous runtime bundle is the baseline, independent of incoming JSON changes.
if (!check) for (const {profile,base} of languages) {
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
if(!check)for(const {profile,base} of languages){
  const previous=path.join(root,base,'catalog.js'),file=base+'/vocabulari-basic.txt';
  if(!fs.existsSync(previous)||!fs.existsSync(path.join(root,file)))continue;
  const old=require(previous);if(!old.basicVocabulary)continue;
  const baseline=old.entries.filter(e=>e.mode==='words'&&e.basicVocabulary).map(e=>e.text).sort(new Intl.Collator(profile.locale,{sensitivity:'variant'}).compare).join('\n')+'\n';
  if(read(file).replace(/\r\n/g,'\n').replace(/^\uFEFF/,'')!==baseline)throw new Error('El fitxer '+file+' conté una revisió manual. Conserva-la i incorpora els canvis abans de regenerar.');
}
emit('locales/manifest.js', bundle('PlecLanguages', manifest));
for (const {item,profile,source,revision,catalog,base,collator,seedRegistry,basicWords} of languages) {
  emit(base + '/catalog.js', bundle('PlecCatalog', catalog));
  if(seedRegistry)emit(base+'/editions/index.js',bundle('PlecSeedRegistry',seedRegistry));
  emit(path.posix.dirname(item.config) + '/config.js', bundle('PlecLanguage', profile));
  for (const [mode, name] of [['words', 'paraules'], ['pseudo', 'pseudoparaules']]) {
    const entries = source.entries.filter(e => e.mode === mode).sort((a, b) => collator.compare(a.text, b.text));
    emit(base + '/' + name + '.txt', entries.map(e => e.text).join('\n') + '\n');
  }
  emit(base + '/revisio.tsv', ['paraula\ttipus\tvocabulari\tortografia\tfocus\tid', ...[...source.entries].sort((a,b)=>collator.compare(a.text,b.text)).map(e => [e.text,e.mode,e.vocabulary||'',e.orthography||'',e.tags.join(','),e.id].join('\t'))].join('\n')+'\n');
  if(basicWords)emit(base+'/vocabulari-basic.txt',basicWords.join('\n')+'\n');
  // Every locale gets a real directory entry point; project subpaths and file:// work.
  const prefix = '../'.repeat(item.path.split('/').filter(Boolean).length);
  const localeDir=path.posix.dirname(item.config);
  const messagesPath=localeDir+'/html.json',runtimePath=localeDir+'/messages.json';
  const messages=fs.existsSync(path.join(root,messagesPath))?json(messagesPath):null;
  const runtime=fs.existsSync(path.join(root,runtimePath))?json(runtimePath):null;
  if(runtime)emit(localeDir+'/messages.js',bundle('PlecMessages',runtime));
  const languageLinks=manifest.languages.map(locale=>
    '<a href="'+locale.path+'" lang="'+locale.id+'" hreflang="'+locale.id+'"'+(locale.id===item.id?' aria-current="page"':'')+'>'+locale.name+'</a>'
  ).join('');
  const selector='<div class="language-switch"><button type="button" class="icon-button header-icon" id="language-toggle" aria-label="Idioma" title="Idioma" aria-expanded="false" aria-controls="language-options"><span data-icon="languages"></span></button><nav id="language-options" class="language-options" aria-label="Idioma" hidden>'+languageLinks+'</nav></div>';
  function localize(markup){
    if(!messages)return markup;
    return localizeHTML(markup,messages)
      .replace('<html lang="ca">','<html lang="'+profile.uiLanguage+'">')
      .replaceAll('https://oiec.iec.cat/','https://www.rae.es/ortograf%C3%ADa/')
      .replaceAll('https://dlc.iec.cat/','https://dle.rae.es/')
      .replaceAll('https://github.com/aaronFortuno/plec-dictats/tree/main/audio/pronunciation/ca','https://github.com/aaronFortuno/plec-dictats/tree/main/'+base);
  }
  let html = localize(read(profile.template).replace('__MANAGEMENT_PANEL__',read('templates/dictation-management.html')).replace('__TEXT_CONFIG__',read('templates/text-config.html')).replace('__TEXT_PICKER_PANEL__',read('templates/text-picker-panel.html')).replace('__PROSODY_PANEL__',read('templates/prosody-panel.html')).replace('__RHYTHM_TABLE_PANEL__',read('templates/rhythm-table-panel.html')).replace('__PRONUNCIATION_PANEL__',read('templates/pronunciation-panel.html')).replace('__ANALYTICS_PANEL__',read('templates/analytics-panel.html')));
  html=html.replace('__LANGUAGE_SELECTOR__',selector).replaceAll('__PLEC_MARK__',Brand.svg('mark')).replaceAll('__PLEC_TAGLINE__',messages?messages['Escolta. Escriu. Desplega.']:Brand.svg('tagline'));
  const assetVersion = /src="catalog\.js(\?[^\"]*)"/.exec(html)?.[1] || '';
  html = html.replace(/((?:src|href)=")(?!https?:|lightning:|#|\.\/)([^\"]+)/g, (_, start, target) => start + prefix + target);
  html = html.replace('catalog.js' + assetVersion, base + '/catalog.js' + assetVersion);
  html = html.replace('catalogs/ca/editions/index.js',base+'/editions/index.js');
  html = html.replace('<script defer src="' + prefix + base, '<script defer src="' + prefix + 'locales/manifest.js' + assetVersion + '"></script>\n  <script defer src="' + prefix + localeDir + '/config.js' + assetVersion + '"></script>\n  '+(runtime?'<script defer src="'+prefix+localeDir+'/messages.js'+assetVersion+'"></script>\n  ':'')+'<script defer src="' + prefix + 'language.js' + assetVersion + '"></script>\n  <script defer src="' + prefix + base);
  emit(item.path + 'index.html', html);
  // Student entry point shares the immutable registry, without the composer or PDF.
  let student = localize(read('templates/dictation.html').replace('__TEXT_PLAYER__',read('templates/text-player.html'))
    .replace('__CONFIG__', localeDir + '/config.js?v=1.31.0')
    .replace('__REGISTRY__', base + '/editions/index.js'+assetVersion)
    .replaceAll('__COMPOSER__', item.path)
    .replace('__LOCALE_MESSAGES__',runtime?'<script defer src="'+localeDir+'/messages.js'+assetVersion+'"></script>':''))
    .replaceAll('__PLEC_MARK__',Brand.svg('mark'));
  student = student.replace(/((?:src|href)=")(?!https?:|lightning:|#|\.\/)([^\"]+)/g, (_, start, target) => start + prefix + '../' + target);
  emit(item.path + 'dictat/index.html', student);
  if(item.id==='ca'){
    let guide=read('templates/pronunciation-guide.html').replaceAll('__COMPOSER__',item.path).replaceAll('__PLEC_MARK__',Brand.svg('mark'));
    guide=guide.replace(/((?:src|href)=")(?!https?:|lightning:|#|\.\/)([^\"]+)/g,(_,start,target)=>start+prefix+'../'+target);
    emit(item.path+'pronunciacio/index.html',guide);
    let pronunciation=read('templates/pronunciations.html').replaceAll('__COMPOSER__',item.path);
    pronunciation=pronunciation.replace(/((?:src|href)=")(?!https?:|lightning:|#|\.\/)([^\"]+)/g,(_,start,target)=>start+prefix+'../'+target);
    emit(item.path+'pronunciacions/index.html',pronunciation);
  }
  summaries.push(item.id + ': ' + source.entries.filter(e=>e.mode==='words').length + ' paraules · ' + revision);
}
emit('index.html', '<!doctype html>\n<html lang="ca"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Plec</title><link rel="icon" href="assets/favicon.svg"><script>location.replace(new URL(' + JSON.stringify(manifest.defaultLanguage + '/') + '+location.search+location.hash,location.href));</script><p><a href="' + manifest.defaultLanguage + '/">Obre Plec · Català</a></p></html>\n');
emit('catalog.js', '/* Compatibilitat amb les eines anteriors. El navegador carrega el paquet de cada llengua. */\nmodule.exports = require("./catalogs/ca/catalog.js");\n');
if(check){
  for(const [name,text] of outputs){
    if(!fs.existsSync(path.join(root,name))||read(name)!==text){console.error('Cal regenerar: '+name);stale=true;}
  }
}else publishOutputs(root,outputs);
for(const message of summaries)console.log(message);
if (stale) process.exitCode = 1;
module.exports = { hash };
