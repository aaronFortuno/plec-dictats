import { mountStudyTheme } from './audio-study.js?v=0.14.0';
import { getStudyMaterial, studyLink } from './study-materials.js?v=0.14.0';
import { drawStudyWords, phraseStudyParts, plecStudyLink, plecStudySettings, studyWritingPause } from './plec-study-data.js?v=0.14.0';
import { mountStudyPlayback, plecStudySteps, sampleAudio, sentitStudySettings, sentitStudySteps } from './study-playback.js?v=0.14.0';

mountStudyTheme();
const query = new URLSearchParams(location.search);
const find = id => document.getElementById(id);
const heading = find('listening-title');
const back = find('listening-back');
const play = find('play-example');
const status = find('play-status');

if (document.body.dataset.project === 'sentit') {
  const material = getStudyMaterial('sentit', query.get('material'));
  const settings = sentitStudySettings(query);
  heading.textContent = material.title;
  query.set('material', material.code);
  back.href = './audio.html?' + query;
  find('listening-paper').href = studyLink('maquetador', material.code);
  find('listening-paper').hidden = false;
  mountStudyPlayback(play, status, () => sentitStudySteps(settings));
} else {
  const settings = plecStudySettings(query);
  const words = settings.mode === 'words';
  const parts = words ? drawStudyWords(settings) : phraseStudyParts(settings);
  const position = find('listening-position');
  const next = find('listening-next');
  let index = 0;
  heading.textContent = words ? 'Dictat de paraules de prova' : settings.entry.title;
  back.href = plecStudyLink('audio', settings);
  next.hidden = false;
  const player = mountStudyPlayback(play, status, () => {
    if (words) {
      return [{ src: sampleAudio[settings.variety === 'valencia' ? 'high' : 'low'], label: `Paraula ${index + 1}`, rate: settings.rate }];
    }
    return plecStudySteps({ ...settings, seconds: studyWritingPause(parts[index].length, settings.wait) }, 2, index + 1);
  });
  function update() {
    position.textContent = `${words ? 'Paraula' : 'Fragment'} ${index + 1} de ${parts.length}`;
    next.textContent = index === parts.length - 1 ? 'Torna a la primera mostra' : words ? 'Paraula següent' : 'Fragment següent';
  }
  next.addEventListener('click', () => {
    player.stop();
    index = (index + 1) % parts.length;
    update();
  });
  update();
}
