"use strict";
const assert = require("node:assert/strict");
const { createSession } = require("../dictation-session.js");

// Validació de totals
for (const bad of [0, -1, 101, 1.5, NaN, "3", null, undefined]) {
  assert.throws(() => createSession(bad), RangeError, "total invalid: " + bad);
}
assert.doesNotThrow(() => createSession(1));
assert.doesNotThrow(() => createSession(100));

// Estat inicial
{
  const s = createSession(3);
  const snap = s.snapshot();
  assert.equal(snap.total, 3);
  assert.equal(snap.index, 0);
  assert.equal(snap.plays, 0);
  assert.equal(snap.playing, false);
  assert.equal(snap.started, false);
  assert.equal(snap.finished, false);
  assert.equal(snap.canPlay, false);
  assert.equal(snap.canNext, false);
}

// Bloqueig de play/next abans d'iniciar
{
  const s = createSession(2);
  assert.equal(s.beginPlay(), null);
  assert.equal(s.next().index, 0);
}

// Start idempotent
{
  const s = createSession(2);
  s.start();
  s.beginPlay();
  const again = s.start();
  assert.equal(again.started, true);
  assert.equal(again.playing, true);
  assert.equal(again.index, 0);
}

// Tres escoltes i prohibició de la quarta
{
  const s = createSession(2);
  s.start();
  for (let i = 0; i < 3; i += 1) {
    const t = s.beginPlay();
    assert.equal(typeof t, "number");
    assert.equal(s.snapshot().playing, true);
    const snap = s.finishPlay(t, true);
    assert.equal(snap.playing, false);
    assert.equal(snap.plays, i + 1);
  }
  const snap = s.snapshot();
  assert.equal(snap.canPlay, false);
  assert.equal(snap.canNext, true);
  assert.equal(s.beginPlay(), null);
}

// Error no gasta escolta ni avança
{
  const s = createSession(2);
  s.start();
  const t = s.beginPlay();
  const snap = s.finishPlay(t, false);
  assert.equal(snap.plays, 0);
  assert.equal(snap.playing, false);
  assert.equal(snap.canPlay, true);
}

// Reproducció doble bloquejada
{
  const s = createSession(2);
  s.start();
  const t1 = s.beginPlay();
  assert.notEqual(t1, null);
  assert.equal(s.beginPlay(), null);
  s.finishPlay(t1, true);
}

// Token antic ignorat
{
  const s = createSession(2);
  s.start();
  const t1 = s.beginPlay();
  s.finishPlay(t1, true);
  const snap = s.finishPlay(t1, true);
  assert.equal(snap.plays, 1);
}

// Progressió fins finished
{
  const s = createSession(2);
  s.start();
  assert.equal(s.next().index, 0); // sense escoltes no avança
  for (let i = 0; i < 3; i += 1) s.finishPlay(s.beginPlay(), true);
  assert.equal(s.next().index, 1);
  assert.equal(s.snapshot().plays, 0);
  for (let i = 0; i < 3; i += 1) s.finishPlay(s.beginPlay(), true);
  const end = s.next();
  assert.equal(end.finished, true);
  assert.equal(end.index, 1);
  assert.equal(end.canPlay, false);
  assert.equal(end.canNext, false);
  assert.equal(s.beginPlay(), null);
}

// Pause/resume i finish antic ignorat
{
  const s = createSession(2);
  s.start();
  const t = s.beginPlay();
  const paused = s.pause();
  assert.equal(paused.paused, true);
  assert.equal(paused.playing, false);
  const after = s.finishPlay(t, true);
  assert.equal(after.plays, 0); // token invalidat
  assert.equal(s.beginPlay(), null); // en pausa no es pot reproduir
  const resumed = s.resume();
  assert.equal(resumed.paused, false);
  assert.equal(resumed.canPlay, true);
}

// Reset i token antic ignorat
{
  const s = createSession(2);
  s.start();
  const t = s.beginPlay();
  s.reset();
  const snap = s.snapshot();
  assert.equal(snap.started, false);
  assert.equal(snap.index, 0);
  assert.equal(snap.plays, 0);
  s.finishPlay(t, true);
  assert.equal(s.snapshot().plays, 0);
  s.start();
  const t2 = s.beginPlay();
  assert.notEqual(t2, null);
  assert.ok(t2 > t, "el comptador de tokens no es reutilitza");
}

// Snapshot no permet mutar l'interior
{
  const s = createSession(2);
  s.start();
  const snap = s.snapshot();
  snap.plays = 99;
  snap.finished = true;
  const fresh = s.snapshot();
  assert.equal(fresh.plays, 0);
  assert.equal(fresh.finished, false);
}

console.log("check-dictation-session: tots els tests han passat");
