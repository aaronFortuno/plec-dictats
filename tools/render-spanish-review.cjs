'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {publishOutputs} = require('./generated-output.cjs');
const ROOT = path.resolve(__dirname, '..');
const folder = 'catalogs/es/review';
const escape = value => value.replace(/[&<>"]/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[char]));
const read = name => fs.readFileSync(path.join(ROOT, folder, name), 'utf8').trimEnd().split(/\r?\n/u).slice(1)
  .map(line => line.split('\t').map(cell => /^".*"$/u.test(cell) ? cell.slice(1,-1).replaceAll('""','"') : cell));
const words = read('ampliacion-01.tsv');
const basic = read('vocabulario-basico-afi.tsv');
const focusLabels = [...new Set(words.flatMap(([,focus])=>focus.split(' · ')))];
const vocabularyLabels = {common:'Habitual', expanded:'Ampliación'};
const levels = {low:'Baja', medium:'Media', high:'Alta'};
const rows = words.map(([word,focus,ipa,vocab,level,,note])=>{
  const details = [vocabularyLabels[vocab]+' · '+levels[level],note].filter(Boolean).join('. ');
  return `<tr role="row" data-word="${escape(word)}" data-focus="${escape(focus)}"><th scope="row"><strong>${escape(word)}</strong></th><td>${escape(focus)}</td><td class="pronunciation">/${escape(ipa)}/</td><td>${escape(details)}</td><td><select aria-label="Decisión para ${escape(word)}"><option value="">Pendiente</option><option value="Aceptar">Aceptar</option><option value="Revisar">Revisar</option><option value="Retirar">Retirar</option></select><input aria-label="Corrección para ${escape(word)}" placeholder="Corrección (opcional)"></td></tr>`;
}).join('\n');
const html = String.raw`<!doctype html>
<html lang="es">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Plec · Revisión del catálogo en español</title>
<style>
  :root{color-scheme:light dark;--paper:#f8f6ef;--ink:#233a33;--surface:#fffdf8;--line:#d9e1d8;--soft:#e7efe8;--green:#234d43;font:16px/1.5 system-ui,sans-serif}
  @media(prefers-color-scheme:dark){:root{--paper:#101a17;--ink:#e2e9e1;--surface:#192722;--line:#35483e;--soft:#24382f;--green:#bdd7c8}}
  *{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink)}main{max-width:1200px;margin:0 auto;padding:24px clamp(12px,4vw,42px)}
  h1{font:clamp(1.7rem,4vw,2.6rem)/1.12 Georgia,serif;color:var(--green);margin:.45em 0}h2{font:1.3rem Georgia,serif}
  p{margin:.6em 0}.brand{font:bold 1.15rem Georgia,serif;color:var(--green)}a{color:var(--green)}small{font-size:.85rem}
  .filters,.files{display:flex;align-items:end;flex-wrap:wrap;gap:10px 16px;margin:1rem 0}.filters label{display:grid;gap:.3rem;font-size:.88rem;font-weight:600}.filters label:first-child{flex:1 1 190px}
  button,select,input{font:inherit;color:inherit;background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:7px 8px;min-height:38px}
  button{cursor:pointer;background:var(--green);color:var(--paper);font-weight:600}button:disabled{cursor:default;opacity:.45}button:hover:not(:disabled){opacity:.85}
  :focus-visible{outline:2px solid #ab634e;outline-offset:2px}
  .table-scroll{overflow:auto;max-height:66vh;border:1px solid var(--line);border-radius:12px;background:var(--surface);scrollbar-width:thin;scrollbar-color:var(--line) transparent}
  table{border-collapse:separate;border-spacing:0;width:100%;min-width:755px;text-align:left;font-size:.86rem}
  th,td{padding:8px 10px;vertical-align:top;border-bottom:1px solid var(--line)}
  thead th{position:sticky;top:0;background:var(--soft);z-index:1}
  tbody tr:nth-child(even){background:color-mix(in srgb,var(--soft),transparent 62%)}
  tbody tr:last-child>*{border-bottom:0}tbody th{width:16%}tbody td:nth-child(2){width:23%}
  .pronunciation{font-family:"Segoe UI",system-ui,sans-serif;white-space:nowrap;font-size:.95rem}
  td input,td select{display:block;width:100%;min-width:135px;min-height:32px;padding:4px 6px}td input{margin-top:5px}
  .files{align-items:center;font-size:.88rem}.files a{white-space:nowrap}[hidden]{display:none!important}
  @media(max-width:650px){
    table,tbody{display:block;min-width:0}
    thead{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
    tbody tr{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 10px;padding:12px;border-bottom:1px solid var(--line)}
    tbody tr>*{border:0;padding:0}tbody th,tbody td:nth-child(2){width:auto}
    tbody th{grid-column:1;grid-row:1}tbody td:nth-child(3){grid-column:2;grid-row:1}
    tbody td:nth-child(2),tbody td:nth-child(4),tbody td:last-child{grid-column:1/-1}
    tbody td:last-child{display:flex;flex-wrap:wrap;gap:5px}
    td select{width:auto;min-width:0}td input{flex:1 1 130px;width:auto;min-width:0;margin:0}
  }
</style>
<main>
  <span class="brand">plec.</span>
  <h1>Primera ampliación en español</h1>
  <p>${words.length} propuestas para dictado, con los focos, el nivel orientativo y una transcripción AFI para la variedad de Elvira (es-ES). Las grafías se han contrastado con RLA-ES.</p>
  <div class="files">
    <a href="ampliacion-01.txt" download>Lista alfabética</a>
    <a href="ampliacion-01.tsv" download>Tabla editable (TSV)</a>
    <a href="vocabulario-basico-afi.tsv" download>AFI de los ${basic.length} básicos</a>
    <a href="exclusiones-01.tsv" download>Palabras apartadas</a>
  </div>
  <div class="filters">
    <label>Buscar palabra<input type="search" id="query" placeholder="p. ej., pingüino"></label>
    <label>Foco<select id="focus"><option value="">Todos</option>${focusLabels.map(label=>`<option>${escape(label)}</option>`).join('')}</select></label>
    <label>Mostrar<select id="review"><option value="">Todas</option><option value="marked">Con decisión o nota</option></select></label>
    <button type="button" id="export" disabled>Descargar mis anotaciones</button>
  </div>
  <p id="summary" aria-live="polite"><small>${words.length} palabras</small></p>
  <div class="table-scroll" role="region" aria-label="Palabras para revisar" tabindex="0">
    <table role="table">
      <thead role="rowgroup"><tr role="row"><th scope="col">Palabra</th><th scope="col">Focos</th><th scope="col">AFI</th><th scope="col">Vocabulario · Ortografía</th><th scope="col">Revisión</th></tr></thead>
      <tbody role="rowgroup">${rows}</tbody>
    </table>
  </div>
  <p id="storage-note"><small>Las anotaciones se guardan en este navegador si admite el almacenamiento local. Descárgalas para compartirlas.</small></p>
</main>
<script>
  const key = 'plec-es-revision-ampliacion-01';
  const notes = new Map();
  const rows = [...document.querySelectorAll('tbody tr')];
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    for (const row of rows) if (Object.hasOwn(saved,row.dataset.word)) {
      const note = saved[row.dataset.word];
      if (note && typeof note.decision === 'string' && typeof note.comment === 'string') notes.set(row.dataset.word,note);
    }
  } catch {}
  const query = document.getElementById('query'), focus = document.getElementById('focus');
  const review = document.getElementById('review'), button = document.getElementById('export');
  const fold = text => text.toLocaleLowerCase('es').replace(/[áéíóúü]/gu, letter=>letter.normalize('NFD')[0]);
  function render() {
    const term = fold(query.value.trim()), selected = focus.value;
    let visible = 0;
    for (const row of rows) {
      row.hidden = !fold(row.dataset.word).includes(term) ||
        (selected !== '' && !row.dataset.focus.split(' · ').includes(selected)) ||
        (review.value === 'marked' && !notes.has(row.dataset.word));
      if (!row.hidden) visible++;
    }
    document.querySelector('#summary small').textContent = visible+' de '+rows.length+' palabras · '+notes.size+' con revisión';
    button.disabled = notes.size === 0;
  }
  for (const row of rows) {
    const choice = row.querySelector('select'), comment = row.querySelector('input');
    const previous = notes.get(row.dataset.word);
    if (previous) { choice.value = previous.decision; comment.value = previous.comment; }
    function saveNote() {
      if (choice.value || comment.value.trim()) notes.set(row.dataset.word,{decision:choice.value,comment:comment.value});
      else notes.delete(row.dataset.word);
      try { localStorage.setItem(key, JSON.stringify(Object.fromEntries(notes))); }
      catch { document.querySelector('#storage-note small').textContent = 'Descarga las anotaciones antes de cerrar esta página.'; }
      render();
    }
    choice.addEventListener('change',saveNote);
    comment.addEventListener('input',saveNote);
  }
  query.addEventListener('input',render);
  focus.addEventListener('change',render);
  review.addEventListener('change',render);
  button.addEventListener('click', () => {
    const cell = value => value.replace(/[\t\r\n]/gu,' ').replace(/^[=+@-]/u,"'$&");
    const result = ['palabra\tdecisión\tcomentario'];
    for (const {dataset:{word}} of rows) if (notes.has(word)) {
      const {decision,comment} = notes.get(word);
      result.push([word,decision,comment].map(cell).join('\t'));
    }
    const link = document.createElement('a');
    const url = URL.createObjectURL(new Blob(['\ufeff'+result.join('\n')+'\n'],{type:'text/tab-separated-values;charset=utf-8'}));
    link.href = url;
    link.download = 'plec-revision-es-ampliacion-01.tsv';
    link.click();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  });
  render();
</script>
</html>
`;
publishOutputs(ROOT,new Map([[folder + '/revision-ampliacion-01.html',html]]));
