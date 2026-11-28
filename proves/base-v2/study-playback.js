import { speechRates } from './audio-rate.js?v=0.14.0';

const assets = {
  recording: './sample-recording.wav',
  short: './sample-fragment.wav',
  high: './sample-high.wav',
  low: './sample-low.wav',
};

export const sampleAudio = assets;

export function sentitStudySettings(query) {
  const encoded = query.get('p');
  const session = /^(\d{1,3})-([1-3])-(\d{1,3})-([0-3])$/.exec(encoded ?? '');
  const [, reading, listens, interval, mask] = session?.map(Number) ?? [0, 0, 1, 0, 0];
  const rate = Number(query.get('ritme'));
  return {
    enabled: Boolean(session), reading: Math.min(reading, 300), listens, interval: Math.min(interval, 300),
    prepare: Boolean(mask & 1), repeat: Boolean(mask & 2),
    rate: speechRates.includes(rate) ? rate : 1, jingle: query.get('jingle') !== '0',
    jingleId: query.get('sintonia') === 'low' ? 'low' : 'high',
  };
}

export function plecStudySteps(settings, count, fragment = 1) {
  const steps = [];
  for (let index = 1; index <= count; index++) {
    steps.push({ src: assets.short, rate: settings.rate, label: `Fragment ${fragment} · escolta ${index} de ${count}` });
    if (index < count) steps.push({ seconds: settings.seconds, label: 'Pausa per escriure' });
  }
  return steps;
}

export function mountStudyPlayback(button, status, getSteps, { idle = button.textContent } = {}) {
  const audio = new Audio();
  audio.preservesPitch = true;
  let steps = [];
  let index = -1;
  let running = false;
  let remaining = 0;
  let deadline = 0;
  let timer;
  let attempt = 0;
  const current = () => steps[index];

  function stop(message = '') {
    attempt++;
    running = false;
    clearInterval(timer);
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    index = -1;
    button.textContent = typeof idle === 'function' ? idle() : idle;
    status.textContent = message;
  }

  function fail() { stop('No s’ha pogut reproduir l’àudio de prova.'); }

  function play() {
    const token = ++attempt;
    audio.play().catch(() => { if (running && token === attempt) fail(); });
  }

  function wait() {
    deadline = performance.now() + remaining;
    function tick() {
      const seconds = Math.ceil((deadline - performance.now()) / 1000);
      if (seconds <= 0) advance();
      else status.textContent = `${current().label} · ${seconds} s`;
    }
    timer = setInterval(tick, 100);
    tick();
  }

  function advance() {
    clearInterval(timer);
    index++;
    const part = current();
    if (!part) { stop('Escolta de prova acabada.'); return; }
    status.textContent = part.label;
    if (part.seconds) {
      remaining = part.seconds * 1000;
      wait();
    } else {
      audio.src = part.src;
      audio.defaultPlaybackRate = part.rate ?? 1;
      audio.playbackRate = audio.defaultPlaybackRate;
      play();
    }
  }

  button.addEventListener('click', () => {
    if (running) {
      attempt++;
      running = false;
      if (current()?.seconds) remaining = Math.max(0, deadline - performance.now());
      clearInterval(timer);
      audio.pause();
      button.textContent = 'Continua la prova';
      return;
    }
    running = true;
    button.textContent = 'Pausa la prova';
    if (index < 0) {
      steps = getSteps();
      advance();
    } else if (current()?.seconds) wait();
    else play();
  });
  audio.addEventListener('ended', () => { if (running) advance(); });
  audio.addEventListener('error', () => { if (current()?.src) fail(); });
  window.addEventListener('pagehide', () => stop());
  return { stop };
}

export function sentitStudySteps(settings, { skipWait = false } = {}) {
  const steps = [];
  if (settings.jingle) steps.push({ src: assets[settings.jingleId], label: 'Sintonia de prova' });
  if (settings.enabled && settings.reading) {
    if (settings.prepare) steps.push({ src: assets.high, label: 'Senyal de preparació' });
    if (!skipWait) steps.push({ seconds: settings.reading, label: 'Lectura prèvia' });
  }
  const listens = settings.enabled ? settings.listens : 1;
  for (let index = 1; index <= listens; index++) {
    if (index > 1) {
      if (settings.interval && !skipWait) steps.push({ seconds: settings.interval, label: 'Pausa entre escoltes' });
      if (settings.repeat) steps.push({ src: assets.low, label: 'Senyal de repetició' });
    }
    steps.push({ src: assets.recording, rate: settings.rate, label: `Escolta ${index} de ${listens}` });
  }
  return steps;
}
