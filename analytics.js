/* Aggregate analytics and explicit reports. No identity, query strings or offline queue. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.PlecAnalytics = factory().create(root); root.PlecAnalytics.start(); }
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const HOST = 'plec.ortogra.fi', WEBSITE = '3e7e3221-7e36-4b78-8a48-4893401163b1';
  const SCRIPT = 'https://cloud.umami.is/script.js', COLLECTOR = 'https://gateway.umami.is/api/send';
  const TEMP = 'plec-analytics-temporary-v1', REPORTS = 'plec-audio-reports-v1';
  const values = {
    mode: ['words', 'pseudo'], count: [8, 12, 16, 20, 24], fold: ['thirds', 'quarter'],
    stage: ['cm', 'cs', 'eso', 'all', 'none'], variety: ['central', 'valencia'],
    duration_bucket: ['lt5', '5to10', '10to20', 'gt20'], result: ['ok', 'invalid'],
    target: ['worksheet', 'student', 'code'], kind: ['pdf', 'audio', 'catalog', 'code-load']
  };
  const events = {
    'worksheet-exported': ['mode', 'count', 'fold', 'stage'], 'guide-exported': ['mode', 'count'],
    'dictation-started': ['mode', 'count', 'variety'],
    'dictation-completed': ['mode', 'count', 'variety', 'duration_bucket'],
    'code-recovered': ['result'], 'share-copied': ['target'], 'catalog-opened': [], 'technical-error': ['kind']
  };
  function validReport(c) {
    return c && typeof c.word === 'string' && c.word.length <= 100 &&
      /^[\p{L}\p{M}][\p{L}\p{M} ·'’\-]*$/u.test(c.word.trim()) &&
      values.variety.includes(c.variety) && typeof c.audioVersion === 'string' &&
      /^[a-zA-Z0-9._:@/\-]{1,200}$/.test(c.audioVersion);
  }
  const reportKey = c => JSON.stringify([c.word.trim().normalize('NFC'), c.variety, c.audioVersion]);
  function create(env) {
    const timer = (env.setTimeout || setTimeout).bind(env), clear = (env.clearTimeout || clearTimeout).bind(env);
    const storage = (kind, operation, key, value) => {
      try { return env[kind]?.[operation](key, value); } catch { return null; }
    };
    let temporary = storage('sessionStorage', 'getItem', TEMP) === '1';
    let memoryDisabled = false, state = { status: 'loading', reason: 'initial' }, generation = 0;
    let starting = null, loaded = null, cache, pageSent = false;
    const listeners = new Set(), sent = new Set(), sending = new Set(), controllers = new Set(), errors = new Set();
    try {
      const raw = storage('sessionStorage', 'getItem', REPORTS);
      const saved = raw && raw.length < 350000 ? JSON.parse(raw) : [];
      if (Array.isArray(saved)) for (const key of saved.slice(-1000)) {
        if (typeof key !== 'string') continue;
        try { const a = JSON.parse(key), c = { word: a[0], variety: a[1], audioVersion: a[2] };
          if (Array.isArray(a) && a.length === 3 && validReport(c)) sent.add(reportKey(c)); } catch {}
      }
    } catch {}
    function production() { return env.location?.hostname === HOST && env.location?.protocol === 'https:'; }
    function privacyReason() {
      if (env.navigator?.globalPrivacyControl === true) return 'gpc';
      if ([env.doNotTrack, env.navigator?.doNotTrack, env.navigator?.msDoNotTrack].some(v => ['1', 'yes', 1].includes(v))) return 'dnt';
      return !temporary && (memoryDisabled || storage('localStorage', 'getItem', 'umami.disabled')) ? 'local' : '';
    }
    function notify() { for (const fn of listeners) { try { fn({ ...state }); } catch {} } }
    function setState(status, reason = '') {
      if (state.status === status && state.reason === reason) return;
      state = { status, reason }; notify();
    }
    function getState() {
      if (!production()) setState('development', 'host');
      else { const reason = privacyReason(); if (reason) setState('disabled', reason); }
      return { ...state };
    }
    function permitted() { return production() && !privacyReason(); }
    function cleanReferrer() {
      try { const ref = new URL(env.document?.referrer || ''); return ref.hostname === HOST ? '' : ref.origin; } catch { return ''; }
    }
    function payload(name, data) {
      const result = { website: WEBSITE, hostname: HOST, url: env.location.pathname || '/',
        referrer: cleanReferrer(), title: 'Plec', language: env.navigator?.language || 'ca',
        screen: `${Number(env.screen?.width) || 0}x${Number(env.screen?.height) || 0}` };
      // pathname is normally clean, but also protect injected/atypical locations.
      result.url = result.url.split(/[?#]/)[0];
      if (name) { result.name = name; result.data = data; }
      return result;
    }
    async function send(name, data, token) {
      if (!permitted() || token !== generation) return false;
      let timeout, controller;
      try {
        if (env.AbortController) { controller = new env.AbortController(); controllers.add(controller); }
        const headers = { 'Content-Type': 'application/json', 'x-umami-website-id': WEBSITE, 'x-umami-hostname': HOST };
        if (cache) headers['x-umami-cache'] = cache;
        const request = (async () => {
          const response = await env.fetch(COLLECTOR, { method: 'POST', headers,
            body: JSON.stringify({ type: 'event', payload: payload(name, data) }), credentials: 'omit',
            referrerPolicy: 'no-referrer', keepalive: true, ...(controller ? { signal: controller.signal } : {}) });
          if (!response.ok) return null;
          return response.json();
        })();
        const result = await Promise.race([request, new Promise(resolve => {
          timeout = timer(() => { controller?.abort(); resolve(null); }, 6000);
        })]);
        if (!permitted() || token !== generation) { getState(); return false; }
        if (!result || result.disabled || result.error || typeof result.cache !== 'string' || !result.cache) {
          setState('unavailable', 'receiver'); return false;
        }
        cache = result.cache; return true;
      } catch { if (token === generation && permitted()) setState('unavailable', 'network'); return false; }
      finally { clear(timeout); if (controller) controllers.delete(controller); }
    }
    function loadScript() {
      if (typeof env.umami?.track === 'function') return Promise.resolve();
      if (loaded) return loaded;
      loaded = new Promise((resolve, reject) => {
        let done = false, script;
        const timeout = timer(() => finish(false), 8000);
        function finish(ok) {
          if (done) return; done = true; clear(timeout);
          if (script) { script.onload = script.onerror = null; if (!ok) script.remove(); }
          if (ok && typeof env.umami?.track === 'function') resolve(); else reject(new Error('Tracker unavailable'));
        }
        if (env.loadUmamiScript) { Promise.resolve().then(() => env.loadUmamiScript()).then(() => finish(true), () => finish(false)); return; }
        try {
          script = env.document.createElement('script'); script.src = SCRIPT; script.defer = true; script.referrerPolicy = 'no-referrer';
          for (const [key, value] of Object.entries({ 'website-id': WEBSITE, 'auto-track': 'false',
            'exclude-search': 'true', 'exclude-hash': 'true', 'do-not-track': 'true', domains: HOST })) script.setAttribute('data-' + key, value);
          script.onload = () => finish(true); script.onerror = () => finish(false);
          env.document.head.appendChild(script);
        } catch { finish(false); }
      }).catch(error => { loaded = null; throw error; });
      return loaded;
    }
    async function start() {
      if (!production()) { setState('development', 'host'); return false; }
      const reason = privacyReason(); if (reason) { setState('disabled', reason); return false; }
      if (starting) return starting;
      if (state.status === 'ready') return true;
      const token = generation;
      setState('loading', 'initial');
      const work = (async () => {
        try {
          await loadScript();
          if (token !== generation || !permitted()) { getState(); return false; }
          if (!pageSent) { if (!await send(null, null, token)) return false; pageSent = true; }
          if (token !== generation || !permitted()) { getState(); return false; }
          setState('ready'); return true;
        } catch { if (token === generation && permitted()) setState('unavailable', 'script'); return false; }
      })();
      starting = work;
      try { return await work; } finally { if (starting === work) starting = null; }
    }
    function subscribe(fn) { listeners.add(fn); try { fn(getState()); } catch {} return () => listeners.delete(fn); }
    function refresh() { const s = getState(); if (s.status === 'disabled' && !privacyReason()) return start(); return Promise.resolve(s.status === 'ready'); }
    async function allowTemporarily() {
      if (['gpc', 'dnt'].includes(privacyReason())) { getState(); return false; }
      generation++; starting = null; temporary = true;
      storage('sessionStorage', 'setItem', TEMP, '1');
      if (state.status === 'ready') return true;
      return start();
    }
    function disable() {
      generation++; starting = null; temporary = false; memoryDisabled = true;
      storage('sessionStorage', 'removeItem', TEMP); storage('localStorage', 'setItem', 'umami.disabled', '1');
      for (const controller of controllers) controller.abort();
      setState('disabled', 'local');
    }
    async function track(name, data = {}) {
      if (getState().status !== 'ready' || !Object.hasOwn(events, name) || !data || typeof data !== 'object' || Array.isArray(data)) return false;
      const clean = {};
      for (const key of Object.keys(data)) {
        if (!events[name].includes(key) || !values[key]?.includes(data[key])) return false;
        clean[key] = data[key];
      }
      if (name === 'technical-error' && errors.has(clean.kind)) return false;
      if (name === 'technical-error') errors.add(clean.kind);
      return send(name, clean, generation);
    }
    function reportState(context) {
      if (!validReport(context)) return 'idle';
      const key = reportKey(context); return sent.has(key) ? 'sent' : sending.has(key) ? 'sending' : 'idle';
    }
    async function reportAudio(context) {
      if (!validReport(context) || getState().status !== 'ready' || reportState(context) !== 'idle') return false;
      const key = reportKey(context), token = generation;
      sending.add(key); notify();
      try {
        const ok = await send('audio-reported', { word: context.word.trim().normalize('NFC'), variety: context.variety, audio_version: context.audioVersion }, token);
        if (!ok || token !== generation || !permitted()) return false;
        sent.add(key); storage('sessionStorage', 'setItem', REPORTS, JSON.stringify([...sent].slice(-1000))); return true;
      } finally { sending.delete(key); notify(); }
    }
    return { start, getState, subscribe, refresh, allowTemporarily, disable, track, reportAudio, reportState };
  }
  return { create };
});
