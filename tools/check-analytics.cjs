'use strict';
const assert = require('node:assert/strict');
const { create } = require('../analytics.js');
const storage = () => { const map = new Map(); return { getItem: k => map.get(k) || null, setItem: (k, v) => map.set(k, v), removeItem: k => map.delete(k) }; };
const good = () => ({ ok: true, json: async () => ({ cache: 'accepted-cache' }) });
function fixture(options = {}) {
  const calls = []; let loads = 0;
  const env = {
    location: { protocol: 'https:', hostname: 'plec.ortogra.fi', pathname: '/ca/', search: '?seed=SECRET', hash: '#PRIVATE' },
    navigator: { language: 'ca' }, screen: { width: 1280, height: 800 },
    document: { referrer: 'https://classroom.google.com/c/PRIVATE?token=SECRET' },
    localStorage: storage(), sessionStorage: storage(), AbortController,
    setTimeout, clearTimeout,
    fetch: async (url, init) => { calls.push({ url, init, body: JSON.parse(init.body) }); return options.receive ? options.receive(calls.length, init) : good(); },
    ...options.env
  };
  env.loadUmamiScript = async () => { loads++; if (options.load) await options.load(env); env.umami = { track() { throw Error('A resolved tracker call is not an acknowledgement'); } }; };
  return { env, calls, loads: () => loads, api: create(env) };
}
const report = { word: 'atapeït', variety: 'central', audioVersion: 'central-v1:abcdef' };
(async () => {
  const f = fixture(); assert.deepEqual(await Promise.all([f.api.start(), f.api.start()]), [true, true]);
  assert.equal(f.loads(), 1); assert.equal(f.calls.length, 1); await f.api.start(); assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].body.payload.url, '/ca/'); assert.equal(f.calls[0].body.payload.referrer, 'https://classroom.google.com');
  assert(!JSON.stringify(f.calls).match(/SECRET|PRIVATE|identify|distinct/));
  assert.equal(f.calls[0].init.credentials, 'omit'); assert.equal(f.calls[0].init.referrerPolicy, 'no-referrer');
  const reports = await Promise.all([f.api.reportAudio(report), f.api.reportAudio(report)]);
  assert.deepEqual(reports, [true, false]); assert.equal(f.api.reportState(report), 'sent');
  assert.equal(f.calls[1].body.payload.name, 'audio-reported'); assert.equal(f.calls[1].body.payload.data.word, 'atapeït');
  assert(!('seed' in f.calls[1].body.payload.data));
  assert(await f.api.reportAudio({ ...report, variety: 'valencia' }));
  assert(await f.api.reportAudio({ ...report, audioVersion: 'central-v2:ghijk' }));
  const reloaded = fixture({ env: { sessionStorage: f.env.sessionStorage } });
  assert.equal(reloaded.api.reportState(report), 'sent'); await reloaded.api.start();
  assert.equal(await reloaded.api.reportAudio(report), false); assert.equal(reloaded.calls.length, 1);
  for (const c of [{ ...report, word: '<script>' }, { ...report, audioVersion: 'x?seed=SECRET' }, { ...report, variety: 'unknown' }]) assert.equal(await f.api.reportAudio(c), false);
  const before = f.calls.length;
  for (const [name, data] of [['unknown', {}], ['worksheet-exported', { seed: 'SECRET' }], ['code-recovered', { result: 'raw message' }], ['share-copied', { target: 'student', email: 'private' }]]) assert.equal(await f.api.track(name, data), false);
  assert.equal(f.calls.length, before);
  assert(await f.api.track('worksheet-exported', { mode: 'words', count: 24, fold: 'quarter', stage: 'cs' }));
  assert(await f.api.track('technical-error', { kind: 'audio' })); assert.equal(await f.api.track('technical-error', { kind: 'audio' }), false);
  for (const env of [{ location: { protocol: 'http:', hostname: 'localhost' } }, { location: { protocol: 'file:', hostname: '' } }]) {
    const dev = fixture({ env }); assert.equal(await dev.api.start(), false); assert.equal(await dev.api.allowTemporarily(), false); assert.equal(dev.loads(), 0); assert.equal(dev.calls.length, 0);
  }
  for (const navigator of [{ globalPrivacyControl: true }, { doNotTrack: '1' }, { msDoNotTrack: 'yes' }]) {
    const blocked = fixture({ env: { navigator } }); assert.equal(await blocked.api.start(), false); assert.equal(await blocked.api.allowTemporarily(), false); assert.equal(blocked.loads(), 0);
  }
  const optout = storage(); optout.setItem('umami.disabled', '1');
  const privateVisit = fixture({ env: { localStorage: optout } });
  assert.equal(await privateVisit.api.start(), false); assert.equal(privateVisit.loads(), 0);
  assert(await privateVisit.api.allowTemporarily()); assert.equal(optout.getItem('umami.disabled'), '1');
  assert.equal(privateVisit.env.sessionStorage.getItem('plec-analytics-temporary-v1'), '1');
  privateVisit.api.disable(); assert.equal(privateVisit.api.getState().status, 'disabled');
  assert.equal(privateVisit.env.sessionStorage.getItem('plec-analytics-temporary-v1'), null);
  const count = privateVisit.calls.length; assert.equal(await privateVisit.api.reportAudio(report), false); assert.equal(privateVisit.calls.length, count);
  const blockedScript = fixture({ load: async () => { throw Error('Blocked'); } });
  assert.equal(await blockedScript.api.start(), false); assert.equal(blockedScript.calls.length, 0); assert.equal(blockedScript.api.getState().reason, 'script');
  const dom = fixture(), attributes = {}; let inserted;
  delete dom.env.loadUmamiScript;
  dom.env.document.createElement = () => ({ setAttribute: (k,v) => { attributes[k]=v; }, remove() {} });
  dom.env.document.head = { appendChild(script) { inserted=script; dom.env.umami={track(){}}; queueMicrotask(()=>script.onload()); } };
  assert(await dom.api.start());
  assert.equal(inserted.src,'https://cloud.umami.is/script.js'); assert.equal(inserted.referrerPolicy,'no-referrer');
  assert.equal(attributes['data-auto-track'],'false'); assert.equal(attributes['data-exclude-search'],'true');
  assert.equal(attributes['data-exclude-hash'],'true'); assert.equal(attributes['data-do-not-track'],'true');
  assert.equal(attributes['data-domains'],'plec.ortogra.fi'); assert.equal(dom.calls.length,1);
  for (const receive of [() => ({ ok: false }), () => ({ ok: true, json: async () => { throw Error('Invalid JSON'); } }),
    () => ({ ok: true, json: async () => ({ disabled: true, cache: 'x' }) }), () => ({ ok: true, json: async () => ({ error: 'no', cache: 'x' }) }),
    () => ({ ok: true, json: async () => ({}) }), () => { throw Error('Offline'); }]) {
    const bad = fixture({ receive: n => n === 1 ? good() : receive() }); await bad.api.start();
    assert.equal(await bad.api.reportAudio(report), false); assert.equal(bad.api.reportState(report), 'idle'); assert.equal(bad.api.getState().status, 'unavailable');
  }
  let release; const delayed = fixture({ receive: n => n === 1 ? good() : new Promise(resolve => { release = resolve; }) });
  await delayed.api.start(); const pending = delayed.api.reportAudio(report); assert.equal(delayed.api.reportState(report), 'sending');
  delayed.api.disable(); release(good()); assert.equal(await pending, false); assert.equal(delayed.api.getState().status, 'disabled'); assert.equal(delayed.api.reportState(report), 'idle');
  let loadDone; const loading = fixture({ load: () => new Promise(resolve => { loadDone = resolve; }) });
  const starting = loading.api.start(); await Promise.resolve(); loading.api.disable(); loadDone();
  assert.equal(await starting, false); assert.equal(loading.calls.length, 0); assert.equal(loading.api.getState().status, 'disabled');
  const timeout = fixture({ receive: n => n === 1 ? good() : new Promise(() => {}), env: { setTimeout: (fn, ms) => setTimeout(fn, ms === 6000 ? 5 : ms) } });
  await timeout.api.start(); assert.equal(await timeout.api.reportAudio(report), false); assert.equal(timeout.api.reportState(report), 'idle');
  const inaccessible = { getItem() { throw Error('Storage blocked'); }, setItem() { throw Error('Storage blocked'); }, removeItem() { throw Error('Storage blocked'); } };
  const limited = fixture({ env: { localStorage: inaccessible, sessionStorage: inaccessible } }); assert(await limited.api.start()); assert(await limited.api.reportAudio(report)); limited.api.disable(); assert.equal(limited.api.getState().status, 'disabled');
  f.env.navigator.globalPrivacyControl = true; assert.equal(f.api.getState().status, 'disabled');
  console.log('Analítica: privacitat, domini, URL netes, recepció real, errors/timeout, deduplicació per versió i cap xarxa en proves: correcte.');
})().catch(error => { console.error(error); process.exitCode = 1; });
