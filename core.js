(function (root) {
  'use strict';
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('ca');
  function shuffled(items, rng = Math.random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function candidates(entries, mode, tags) {
    return entries.filter(e => e.mode === mode && e.tags.some(t => tags.includes(t)));
  }
  function generate({ pool, count, locked = [], seen = [], tags = [], rng = Math.random }) {
    const fixed = locked.slice(0, count);
    const fixedIds = new Set(fixed.map(e => e.id));
    const available = pool.filter(e => !fixedIds.has(e.id));
    if (available.length + fixed.length < count) throw new Error('No hi ha prou paraules per completar aquest dictat. Amplia els focus o redueix la llargada.');
    const seenIds = new Set(seen);
    const fresh = shuffled(available.filter(e => !seenIds.has(e.id)), rng);
    const repeated = shuffled(available.filter(e => seenIds.has(e.id)), rng);
    const counts = Object.fromEntries(tags.map(t => [t, 0]));
    fixed.forEach(e => e.tags.forEach(t => { if (t in counts) counts[t]++; }));
    const picked = [...fixed];
    let reused = 0;
    while (picked.length < count) {
      const source = fresh.length ? fresh : repeated;
      if (source === repeated) reused++;
      // Reparteix els focus, prioritzant sempre els mots encara no utilitzats.
      const rankedTags = shuffled(tags, rng).sort((a, b) => counts[a] - counts[b]);
      const tag = rankedTags.find(t => source.some(e => e.tags.includes(t)));
      const index = tag ? source.findIndex(e => e.tags.includes(tag)) : 0;
      const [entry] = source.splice(index, 1);
      picked.push(entry);
      entry.tags.forEach(t => { if (t in counts) counts[t]++; });
    }
    return { entries: shuffled(picked, rng), reused };
  }
  function validateCustom(text) {
    return typeof text === 'string' && text.length <= 26 && /^[a-zàèéíïòóúüç·]+(?:[-’'][a-zàèéíïòóúüç·]+)*$/iu.test(text);
  }
  // Coordenades comunes per a l'SVG i el PDF, en mil·límetres, origen superior esquerre.
  function worksheet({ entries, title = 'Dictat de paraules', group = '', code = '', hidden = false, mode = 'words' }) {
    const shapes = [];
    const text = (x, y, value, size = 10, weight = false, color = '#222222', extra = {}) => shapes.push({ type: 'text', x, y, value, size, weight, color, ...extra });
    const line = (x, y, x2, y2, color = '#aaaaaa', width = .2, dash = false) => shapes.push({ type: 'line', x, y, x2, y2, color, width, dash });
    const rect = (x, y, w, h, color) => shapes.push({ type: 'rect', x, y, w, h, color });
    text(12, 15, 'plec / dictats per desplegar', 8, true, '#555555');
    text(198, 15, code, 8, false, '#555555', { align: 'right' });
    text(12, 27, title || (mode === 'words' ? 'Dictat de paraules' : 'Dictat de pseudoparaules'), 17, true, '#222222', { maxWidth: 186 });
    text(12, 37, 'Nom:', 9); line(22, 38, 112, 38);
    text(120, 37, 'Data:', 9); line(130, 38, 158, 38);
    text(164, 37, group ? `Grup: ${group}` : 'Grup: ______', 9, false, '#222222', { maxWidth: 34 });
    // Els plecs divideixen TOT el paper en terços de 70 mm, inclosos els marges.
    const cols = [12, 70, 140, 198];
    rect(12, 45, 186, 10, '#f2f2f2');
    ['MODEL', 'ESCRIC', 'REVISO'].forEach((label, i) => text(cols[i] + 4, 51.5, label, 9, true));
    const top = 56, bottom = 268, rowH = Math.min(12, (bottom - top) / entries.length);
    entries.forEach((entry, i) => {
      const baseline = top + (i + 1) * rowH - 2.1;
      [0, 1, 2].forEach(c => text(cols[c] + 2, baseline, `${i + 1}.`, 7, false, '#777777'));
      if (!hidden) text(22, baseline, entry.text, 12, false, '#222222', { maxWidth: 44 });
      line(12, top + (i + 1) * rowH, 198, top + (i + 1) * rowH, '#aaaaaa', .18);
    });
    line(12, top, 198, top, '#aaaaaa', .18);
    [70, 140].forEach(x => { line(x, 42, x, 274, '#777777', .25, true); text(x, 279, 'PLEC', 6, false, '#666666', { align: 'center' }); });
    text(12, 287, 'Plega les dues franges laterals cap enrere. Deixa ESCRIC al davant.', 7, false, '#555555');
    text(198, 292, `${entries.length} ${mode === 'words' ? 'paraules' : 'pseudoparaules'} · A4 · 100 %`, 6, false, '#666666', { align: 'right' });
    if (mode === 'pseudo') text(12, 292, 'Model proposat: altres grafies poden representar el mateix so.', 6, false, '#555555');
    return shapes;
  }
  function teacherSheet({ entries, title, group = '', code = '', mode }, categories) {
    const shapes = [];
    const text = (x, y, value, size = 10, weight = false, color = '#222222', extra = {}) => shapes.push({ type: 'text', x, y, value, size, weight, color, ...extra });
    text(12, 15, 'plec / guia de lectura docent', 9, true);
    text(198, 15, code, 8, false, '#555555', { align: 'right' });
    text(12, 28, title || 'Guia del dictat', 17, true, '#222222', { maxWidth: 186 });
    text(12, 38, `${entries.length} ${mode === 'words' ? 'paraules' : 'pseudoparaules'}${group ? ' · Grup: ' + group : ''}`, 10);
    text(12, 49, 'Llegeix cada element amb naturalitat i repeteix-lo abans de passar al següent.', 9);
    if (mode === 'words') {
      text(12, 56, 'Dona un context oral breu si cal aclarir el significat, sense mostrar la grafia.', 9);
    } else {
      text(12, 56, 'Acorda la pronunciació i la síl·laba tònica abans de la sessió.', 9);
      text(12, 63, 'Valora la correspondència so-grafia: el model escrit no és l’única resposta possible.', 9);
    }
    entries.forEach((entry, i) => {
      const y = 78 + i * 7.7;
      text(12, y, `${i + 1}.`, 10, false, '#666666');
      text(24, y, entry.text, 12, true, '#222222', { maxWidth: 72 });
      text(102, y, entry.tags.map(t => categories.find(c => c.id === t)?.label || 'Personalitzada').join(' · '), 8, false, '#555555', { maxWidth: 96 });
    });
    text(12, 282, mode === 'pseudo' ? 'Banc de pràctica creat per a l’aula; no és una prova estandarditzada.' : 'Desplega el model al final i reserva la tercera franja per revisar l’escriptura.', 8);
    return shapes;
  }
  root.PlecCore = { normalize, shuffled, candidates, generate, validateCustom, worksheet, teacherSheet };
  if (typeof module !== 'undefined') module.exports = root.PlecCore;
})(typeof window === 'undefined' ? globalThis : window);
