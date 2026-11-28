import { mountAudioRate } from './audio-rate.js?v=0.14.0';
import { mountAudioStudy } from './audio-study.js?v=0.14.0';
import { drawStudyWords, phraseSamples, phraseStudyParts, plecStudyLink, plecStudySettings, studyWritingPause, varieties,
  wordCounts, wordGroups, wordRates, phraseRates } from './plec-study-data.js?v=0.14.0';
import { mountStudyPlayback, plecStudySteps, sampleAudio } from './study-playback.js?v=0.14.0';

const study = mountAudioStudy();
const { form, play, progress } = study;
const byId = id => document.getElementById(id);
const fields = form.elements;
const focus = byId('focus');
const count = byId('word-count');
const phrase = byId('phrase');
const list = byId('word-list');
const query = new URLSearchParams(location.search);
const initial = plecStudySettings(query);
let mode = initial.mode;
let seed = query.has('seed') ? initial.seed : crypto.getRandomValues(new Uint32Array(1))[0];
const rates = form.querySelector('[data-audio-rate]');
const wordRateRoot = document.createElement('div');
const phraseRateRoot = document.createElement('div');
rates.append(wordRateRoot, phraseRateRoot);
const { select: wordRate } = mountAudioRate(wordRateRoot, { rates: wordRates, name: 'wordRate' });
const { select: phraseRate } = mountAudioRate(phraseRateRoot, { rates: phraseRates, name: 'phraseRate' });

focus.replaceChildren(...Object.entries(wordGroups).map(([key, group]) => new Option(group.label, key)));
count.replaceChildren(...wordCounts.map(value => new Option(value, value)));
phrase.replaceChildren(...phraseSamples.map(entry => new Option(entry.title, entry.id)));
fields.variety.replaceChildren(...Object.entries(varieties).map(([key, name]) => new Option(name, key)));
focus.value = initial.focus;
count.value = initial.count;
phrase.value = initial.entry.id;
fields.variety.value = initial.variety;
fields.pace.value = initial.pace;
fields.wait.value = initial.wait;
(initial.mode === 'words' ? wordRate : phraseRate).value = initial.rate.toFixed(2);
const bankSize = Object.values(wordGroups).reduce((total, group) => total + group.words.length, 0);
byId('bank-size').textContent = `${bankSize} paraules al banc de prova.`;

const isWords = () => mode === 'words';
const playbackLabel = () => isWords() ? 'Escolta la primera paraula' : 'Prova el primer fragment';

function config() {
  return {
    mode, seed, focus: focus.value, count: Number(count.value), variety: fields.variety.value,
    entry: phraseSamples.find(sample => sample.id === phrase.value), pace: Number(fields.pace.value), wait: Number(fields.wait.value),
    rate: Number((isWords() ? wordRate : phraseRate).value),
  };
}

function update() {
  const settings = config();
  for (const panel of document.querySelectorAll('[data-mode-panel]')) panel.hidden = panel.dataset.modePanel !== mode;
  for (const tab of document.querySelectorAll('[data-mode]')) tab.setAttribute('aria-pressed', String(tab.dataset.mode === mode));
  wordRateRoot.hidden = !isWords();
  phraseRateRoot.hidden = isWords();
  play.textContent = playbackLabel();
  if (isWords()) {
    list.replaceChildren(...drawStudyWords(settings).map(word => {
      const item = document.createElement('li');
      item.textContent = word;
      return item;
    }));
    byId('word-code').textContent = `Codi de prova · ${seed.toString(36).toUpperCase()}`;
  } else {
    const parts = phraseStudyParts(settings);
    byId('phrase-info').textContent = [settings.entry.stage, settings.entry.focus, `${parts.length} fragments`].join(' · ');
    byId('phrase-text').textContent = settings.entry.text;
    byId('rhythm-code').value = `${settings.pace} mots · ×${phraseRate.selectedOptions[0].textContent.slice(1)} · ${studyWritingPause(parts[0].length, settings.wait)} s`;
  }
  study.listening(plecStudyLink('escolta', settings));
  history.replaceState(null, '', plecStudyLink('audio', settings));
}

const preview = mountStudyPlayback(play, progress, () => {
  const settings = config();
  if (isWords()) return [{ src: sampleAudio[settings.variety === 'valencia' ? 'high' : 'low'], label: 'Paraula 1', rate: settings.rate }];
  const seconds = studyWritingPause(phraseStudyParts(settings)[0].length, settings.wait);
  return plecStudySteps({ ...settings, seconds }, 2);
}, { idle: playbackLabel });

for (const tab of document.querySelectorAll('[data-mode]')) tab.addEventListener('click', () => {
  mode = tab.dataset.mode;
  preview.stop();
  update();
});
for (const control of [focus, count, phrase]) control.addEventListener('change', () => { preview.stop(); update(); });
byId('generate').addEventListener('click', () => {
  preview.stop();
  const next = crypto.getRandomValues(new Uint32Array(1))[0];
  seed = next === seed ? (seed + 1) >>> 0 : next;
  update();
});
byId('print-word-study').addEventListener('click', () => window.print());
byId('print-phrase-study').addEventListener('click', () => window.print());
form.addEventListener('change', () => { preview.stop(); update(); });
update();
