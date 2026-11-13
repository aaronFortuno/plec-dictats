/* Routing and identity shared by the composer and the future dictation player. */
(function (root) {
  'use strict';
  const manifest = root.PlecLanguages || (typeof module !== 'undefined' ? require('./locales/manifest.json') : null);
  const site = root.PlecSiteLinks || (typeof module !== 'undefined' ? require('./site-links.js') : null);
  function language(id) {
    const found = manifest.languages.find(item => item.id === id);
    if (!found) throw new Error('Aquesta llengua encara no està disponible.');
    return found;
  }
  function normalizeCode(value) {
    return String(value).toUpperCase().replace(/[\s-]/g, '');
  }
  function dictationURL(base, { language: id, catalogue, seed, variety }) {
    const pack = language(id), code = site.normalizeSeed(seed,id);
    if (!catalogue || !catalogue.startsWith(id + '-')) throw new Error('El catàleg no correspon a la llengua.');
    const url = new URL(pack.path + 'dictat/', new URL('./', base));
    url.search = new URLSearchParams({ seed: code, catalogue }).toString();
    site.assertVariety(variety,id);
    if(variety!==undefined)url.searchParams.set('variety',variety);
    return url.href;
  }
  function assertImportLanguage(data, id) {
    // Versions 1–3 were exclusively Catalan. An explicit field always takes precedence.
    const imported = data.language || (data.version <= 3 ? 'ca' : null);
    if (imported !== id) throw new Error('Aquest dictat correspon a una altra llengua.');
  }
  function savedState(storage, key, id) {
    const current = storage.getItem(key);
    // Migration is read-only: keep the original backup until a successful save.
    return JSON.parse(current === null && id === 'ca' ? storage.getItem('plec-dictats-v1') : current);
  }
  function publicDictationURL(options){language(options.language);return site.dictationURL(options);}
  function publicComposerURL(options){language(options.language);return site.composerURL(options);}
  function text(message,values={}){
    const translated=root.PlecMessages?.[message]??message;
    return translated.replace(/\{(\w+)\}/g,(placeholder,key)=>Object.hasOwn(values,key)?String(values[key]):placeholder);
  }
  root.PlecLanguageTools = { language, normalizeCode, dictationURL, publicDictationURL, publicComposerURL, assertImportLanguage, savedState, text };
  if (typeof module !== 'undefined') module.exports = root.PlecLanguageTools;
})(typeof window === 'undefined' ? globalThis : window);
