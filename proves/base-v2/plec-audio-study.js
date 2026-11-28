import { mountAudioRate } from './audio-rate.js?v=0.13.0';
import { mountAudioStudy } from './audio-study.js?v=0.13.0';

const study = mountAudioStudy();
const { form, play, progress } = study;
const { PlecSeeds: seeds, PlecSeedRegistry: registry, PlecTexts: texts, PlecAudioVarieties: varieties,
  PlecAudioManifest: audioManifest, PlecTextRepeat: repeat, PlecRhythmCode: rhythm } = window;
const byId = id => document.getElementById(id);
const fields = form.elements;
const result = byId('word-list');
const focus = byId('focus');
const count = byId('word-count');
const phrase = byId('phrase');
const audio = new Audio();
audio.preload = 'auto';
audio.preservesPitch = true;

let mode = 'words';
let words;
let playback;
const edition = registry.editions.find(item => item.slot === registry.current);
const categories = edition.catalog.categories.filter(item => item.mode === 'words' && seeds.WORD_FOCUSES.includes(item.id));
const samples = texts.catalogue.filter(entry => entry.language === 'ca' && texts.fragments(entry, 6)[0]?.path);
const rates = form.querySelector('[data-audio-rate]');
const wordRateRoot = document.createElement('div');
const phraseRateRoot = document.createElement('div');
rates.append(wordRateRoot, phraseRateRoot);
const { select: wordRate } = mountAudioRate(wordRateRoot, { rates: [.85, 1], name: 'wordRate' });
const { select: phraseRate } = mountAudioRate(phraseRateRoot, { rates: [.8, .9, 1], name: 'phraseRate' });

focus.replaceChildren(...categories.map(item => new Option(item.label, item.id)));
count.replaceChildren(...seeds.COUNTS.map(value => new Option(value, value)));
count.value = '12';
phrase.replaceChildren(...samples.map(entry => new Option(`${entry.code} · ${entry.title}`, entry.id)));
fields.variety.replaceChildren(...varieties.forLanguage('ca').map(item => new Option(item.label, item.id)));
const bankSize = edition.catalog.entries.filter(entry => entry.mode === 'words').length;
byId('bank-size').textContent = `${new Intl.NumberFormat('ca').format(bankSize)} paraules disponibles al banc.`;

function draw() {
  const recipe = { mode: 'words', stage: 'all', tags: [focus.value], count: Number(count.value) };
  try {
    const previous = words?.nonce;
    const nonce = crypto.getRandomValues(new Uint32Array(1))[0] % seeds.VARIANTS;
    const code = seeds.encode({ epoch: edition.slot, recipe, nonce: nonce === previous ? (nonce + 1) % seeds.VARIANTS : nonce });
    words = seeds.resolve(registry.editions, code);
    result.replaceChildren(...words.entries.map(word => {
      const item = document.createElement('li');
      item.textContent = word.text;
      return item;
    }));
    byId('word-code').textContent = `Codi del dictat · ${words.code}`;
    byId('word-sheet').hidden = false;
  } catch (error) {
    words = null;
    result.replaceChildren();
    byId('word-code').textContent = error.message;
    byId('word-sheet').hidden = true;
  }
  update();
}

function textConfig() {
  const entry = samples.find(item => item.id === phrase.value);
  return { entry, pace: Number(fields.pace.value), rate: Number(phraseRate.value), wait: Number(fields.wait.value) };
}

function update() {
  const isWords = mode === 'words';
  for (const panel of document.querySelectorAll('[data-mode-panel]')) panel.hidden = panel.dataset.modePanel !== mode;
  for (const tab of document.querySelectorAll('[data-mode]')) tab.setAttribute('aria-pressed', String(tab.dataset.mode === mode));
  wordRateRoot.hidden = !isWords;
  phraseRateRoot.hidden = isWords;
  play.disabled = isWords ? !words : !phrase.value;
  play.textContent = isWords ? 'Escolta la primera paraula' : 'Prova el primer fragment';
  if (isWords && words) {
    const settings = { seed: seeds.normalize(words.code), catalogue: words.catalogue, variety: fields.variety.value };
    const query = new URLSearchParams(settings);
    study.listening(new URL('ca/dictat/?' + query, document.baseURI));
    byId('word-sheet').href = new URL('ca/?' + query, document.baseURI);
  } else if (!isWords && phrase.value) {
    const { entry, pace, rate, wait } = textConfig();
    const settings = { pace, rate };
    const parts = texts.fragments(entry, pace);
    byId('phrase-info').textContent = [entry.stage, entry.focusLabels.join(', '), `${parts.length} fragments`].filter(Boolean).join(' · ');
    byId('phrase-text').replaceChildren(...entry.paragraphs.map(text => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      return paragraph;
    }));
    byId('rhythm-code').value = rhythm.encode(settings, wait);
    byId('phrase-sheet').href = texts.url(entry, settings, false, document.baseURI);
    study.listening(texts.url(entry, settings, true, document.baseURI));
  } else {
    study.listening(null);
  }
}

function stop(message = '') {
  const current = playback;
  playback = null;
  current?.wait?.cancel();
  audio.pause();
  if (current) {
    audio.removeAttribute('src');
    audio.load();
  }
  play.textContent = mode === 'words' ? 'Escolta la primera paraula' : 'Prova el primer fragment';
  progress.textContent = message;
}

async function sound(current, part, rate) {
  current.end = part.end;
  audio.src = part.path;
  audio.defaultPlaybackRate = rate;
  audio.playbackRate = rate;
  if (Number.isFinite(part.start)) audio.currentTime = part.start;
  try {
    await audio.play();
  } catch {
    if (playback === current) stop('No s’ha pogut reproduir l’àudio. Torna-ho a provar.');
  }
}

async function wordClip(current) {
  const response = await fetch('audio/manifest.json');
  if (!response.ok) throw new Error('Manifest d’àudio');
  const manifest = await response.json();
  if (playback !== current) return;
  const entries = words.entries.slice(0, 1);
  const { pack } = varieties.select(manifest, 'ca', { variety: fields.variety.value, entries });
  const { urls } = audioManifest.coverage(manifest, entries, 'ca', document.baseURI, pack.id);
  if (!urls[0]) throw new Error('Mostra no disponible');
  progress.textContent = 'Paraula 1';
  await sound(current, { path: urls[0] }, Number(wordRate.value));
}

function phraseClip(current) {
  const { entry, pace, rate, wait } = textConfig();
  const part = texts.fragments(entry, pace)[0];
  current.wait = repeat.create({
    onTick: seconds => { progress.textContent = `Pausa per escriure · ${seconds} s`; },
    onEnd: () => {
      if (playback !== current) return;
      progress.textContent = 'Fragment 1 · escolta 2 de 2';
      void sound(current, part, rate);
    },
  });
  current.onFinished = () => current.wait.start(part.words, wait);
  progress.textContent = 'Fragment 1 · escolta 1 de 2';
  void sound(current, part, rate);
}

function finished() {
  if (!playback) return;
  if (playback.onFinished) {
    const next = playback.onFinished;
    playback.onFinished = null;
    playback.end = undefined;
    audio.pause();
    next();
  } else {
    stop('Preescolta acabada.');
  }
}

audio.addEventListener('ended', finished);
audio.addEventListener('timeupdate', () => {
  if (playback && Number.isFinite(playback.end) && audio.currentTime >= playback.end) finished();
});
play.addEventListener('click', async () => {
  if (playback) { stop(); return; }
  const current = {};
  playback = current;
  play.textContent = 'Atura la prova';
  try {
    if (mode === 'words') await wordClip(current);
    else phraseClip(current);
  } catch {
    if (playback === current) stop('No s’ha pogut carregar l’àudio. Torna-ho a provar.');
  }
});
for (const tab of document.querySelectorAll('[data-mode]')) tab.addEventListener('click', () => {
  stop();
  mode = tab.dataset.mode;
  update();
});
for (const control of [focus, count]) control.addEventListener('change', () => { stop(); draw(); });
byId('generate').addEventListener('click', () => { stop(); draw(); });
phrase.addEventListener('change', () => { stop(); update(); });
form.addEventListener('change', () => { stop(); update(); });
window.addEventListener('pagehide', () => stop());
draw();
