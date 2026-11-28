import { createThemePreference } from './interface-preferences.js';

export function mountAudioStudy() {
  const { project } = document.body.dataset;
  const theme = createThemePreference(`ortografi:preview:${project}:theme`, { initialKey: project === 'sentit' ? 'sentit-theme' : 'plec-appearance-v1' });
  const themeButton = document.getElementById('audio-theme');
  function showTheme() {
    document.documentElement.dataset.theme = theme.value;
    themeButton.setAttribute('aria-pressed', String(theme.value === 'dark'));
  }
  themeButton.addEventListener('click', () => {
    theme.set(theme.value === 'dark' ? 'light' : 'dark');
    showTheme();
  });
  showTheme();

  const panel = document.querySelector('.audio-study-panel');
  if (matchMedia('(max-width: 760px)').matches) panel.open = false;
  const form = document.getElementById('audio-settings');
  const link = document.getElementById('listening-link');
  const status = document.getElementById('copy-status');
  const copy = document.getElementById('copy-listening');
  copy.disabled = true;
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(link.href);
      status.textContent = 'Enllaç copiat.';
    } catch {
      status.textContent = 'Pots copiar l’adreça des de l’enllaç «Obre la vista d’escolta».';
    }
  });
  form.addEventListener('submit', event => event.preventDefault());
  return {
    form,
    play: document.getElementById('play-example'),
    progress: document.getElementById('play-status'),
    listening(url) {
      if (url) link.href = url;
      else link.removeAttribute('href');
      copy.disabled = !url;
      status.textContent = '';
    },
  };
}
