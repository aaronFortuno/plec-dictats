// Reconstrueix el petit conjunt local d'icones a partir dels SVG oficials.
const fs = require('node:fs');
const path = require('node:path');
const folder = path.join(__dirname, '../assets/lucide');
const icons = Object.fromEntries(fs.readdirSync(folder).filter(name => name.endsWith('.svg')).map(name => {
  const source = fs.readFileSync(path.join(folder, name), 'utf8');
  const body = source.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/)[1].trim();
  return [name.slice(0, -4), body];
}));
fs.writeFileSync(path.join(__dirname, '../icons.js'), `/* Lucide · ISC / MIT. Llicències: assets/lucide/LICENSE. Generat amb tools/build-icons.cjs. */\n(function () {\n  const icons = ${JSON.stringify(icons, null, 2)};\n  window.PlecIcons = name => '<svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (icons[name] || '') + '</svg>';\n  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = window.PlecIcons(el.dataset.icon); });\n})();\n`);
