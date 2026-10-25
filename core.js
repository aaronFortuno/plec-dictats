(function (root) {
  'use strict';
  const profile = root.PlecLanguage || (typeof module !== 'undefined' ? require('./locales/ca/config.json') : null);
  const QR = root.PlecWorksheetQR || (typeof module !== 'undefined' ? require('./worksheet-qr.js') : null);
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase(profile.locale);
  function migrateFocusTags(tags, available, retired = []) {
    const active = [...new Set(tags.filter(tag => available.includes(tag)))];
    // A retired-only preference falls back to the ordinary focuses; an intentional
    // empty selection and any still-valid preferences remain unchanged.
    return !active.length && tags.some(tag => retired.includes(tag)) ? [...available] : active;
  }
  function shuffled(items, rng = Math.random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function matchesStage(entry, stage = 'all') {
    if (entry.mode === 'pseudo' || stage === 'all') return true;
    const rule = profile.stageRules[stage];
    const matches = r => (!r.vocabulary || r.vocabulary.includes(entry.vocabulary)) && (!r.orthography || r.orthography.includes(entry.orthography));
    return !!rule && (rule.any ? rule.any.some(matches) : matches(rule));
  }
  function candidates(entries, mode, tags, stage = 'all') {
    return entries.filter(e => e.mode === mode && e.tags.some(t => tags.includes(t)) && matchesStage(e, stage));
  }
  function generate({ pool, count, locked = [], seen = [], tags = [], rng = Math.random }) {
    const fixed = locked.slice(0, count);
    const fixedIds = new Set(fixed.map(e => e.id));
    const available = pool.filter(e => !fixedIds.has(e.id));
    if (available.length + fixed.length < count) throw new Error('No hi ha prou paraules per completar aquest dictat. Amplia els focus o el nivell, o redueix la llargada.');
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
    return typeof text === 'string' && text.length <= 26 && new RegExp(profile.wordPattern, 'iu').test(text.normalize('NFC'));
  }
  // Una proposta parcial mai incorpora mots aliens als filtres per omplir el full.
  function propose(options) {
    const locked = (options.locked || []).slice(0, options.count);
    const ids = new Set([...options.pool, ...locked].map(e => e.id));
    const count = Math.min(options.count, ids.size);
    const result = count ? generate({ ...options, locked, count }) : { entries: [], reused: 0 };
    return { ...result, missing: options.count - result.entries.length };
  }
  function foldLayout(foldStyle = 'thirds', modelSide = 'left') {
    const quarter = foldStyle === 'quarter';
    // El solucionari exterior de 51 mm cap dins de la solapa de 53 mm.
    // El segon plec ocupa 53 mm i deixa 1 mm abans de l'escriptura.
    const layout = quarter
      ? { model: [0, 51], blank: [51, 158], writing: [158, 210], folds: [51, 104], name: 'Quart de full',
          printSteps: ['1. Plega el model cap endins.', '2. Torna a plegar cap endins.'],
          steps: ['Amb el full escrit cap amunt, plega el solucionari exterior cap endins per la guia més pròxima al model (51 mm de la vora). Queda amb les paraules contra el paper en blanc.', 'Fes el segon plec, també cap endins, per l’altra guia (104 mm de la mateixa vora). El paquet cobreix el tercer tram i deixa lliure el quart d’escriptura.', 'Per corregir, aixeca una mica el paquet i obre el plec exterior en sentit contrari, com un petit acordió. Orienta el model cap amunt, al costat de l’escriptura; no cal estendre tot el paper.'] }
      : { model: [0, 70], writing: [70, 140], blank: [140, 210], folds: [70, 140], name: 'Terços',
          printSteps: ['1. Plega el tram buit cap al darrere.', '2. Plega el model cap al darrere.'],
          steps: ['Treballa a la columna central. Plega primer la banda buida cap al darrere de l’escriptura.', 'Plega després la banda del solucionari també cap al darrere. El tram buit queda interposat entre l’escriptura i el model.', 'Per corregir, obre només la banda del solucionari i deixa-la a la vista al costat de l’escriptura. Mantén la banda buida plegada al darrere.'] };
    if (modelSide === 'right') {
      for (const key of ['model', 'writing', 'blank']) layout[key] = [210 - layout[key][1], 210 - layout[key][0]];
      layout.folds = layout.folds.map(x => 210 - x).sort((a, b) => a - b);
    }
    for (const key of ['model', 'writing']) {
      const [start, end] = layout[key];
      const x = Math.max(12, start + 4), right = Math.min(198, end - 4);
      layout[key + 'Area'] = { x, width: right - x };
    }
    layout.foldStyle = quarter ? 'quarter' : 'thirds';
    layout.side = modelSide === 'right' ? 'right' : 'left';
    layout.foldOrder = quarter ? (layout.side === 'left' ? [51, 104] : [159, 106]) : (layout.side === 'left' ? [140, 70] : [70, 140]);
    const stops = [...new Set([0, 210, ...layout.folds, ...layout.writing])].sort((a, b) => a - b);
    layout.panels = stops.slice(0, -1).map((start, i) => {
      const end = stops[i + 1], middle = (start + end) / 2;
      return { width: end - start, kind: middle > layout.model[0] && middle < layout.model[1] ? 'model' : middle > layout.writing[0] && middle < layout.writing[1] ? 'writing' : 'blank' };
    });
    layout.hint = quarter
      ? (layout.side === 'left' ? 'Model 51 · buit 53 + 54 · escric 52 mm' : 'Escric 52 · buit 54 + 53 · model 51 mm')
      : (layout.side === 'left' ? 'Model · escric al centre · banda buida' : 'Banda buida · escric al centre · model');
    return layout;
  }
  // Coordenades comunes per a l'SVG i el PDF, en mil·límetres, origen superior esquerre.
  function worksheet({ entries, title, mode = 'words', modelSide = 'left', foldStyle = 'thirds', seedCode, seedLanguage = 'ca', focusLabels = [] }) {
    const shapes = [];
    const text = (x, y, value, size = 10, weight = false, color = '#222222', extra = {}) => shapes.push({ type: 'text', x, y, value, size, weight, color, ...extra });
    const line = (x, y, x2, y2, color = '#aaaaaa', width = .2, dash = false) => shapes.push({ type: 'line', x, y, x2, y2, color, width, dash });
    const rect = (x, y, w, h, color) => shapes.push({ type: 'rect', x, y, w, h, color });
    const layout = foldLayout(foldStyle, modelSide);
    const { x: modelX, width: modelWidth } = layout.modelArea;
    const { x: writeX, width: writeWidth } = layout.writingArea;
    text(modelX, 15, 'plec / model amagat', 8, true, '#555555');
    text(modelX, 23, layout.name, 7, false, '#555555', { maxWidth: modelWidth });
    text(writeX, 15, seedCode ? `${seedLanguage.toUpperCase()} / ${seedCode}` : 'plec / dictat', seedCode ? 9.5 : 8, true, '#234d43', { maxWidth: writeWidth });
    text(writeX, 25, title || (mode === 'words' ? 'Dictat de paraules' : 'Dictat de pseudoparaules'), 12, true, '#222222', { maxWidth: writeWidth });
    text(writeX, 34, 'Nom:', 8); line(writeX + 8, 35, writeX + writeWidth, 35);
    text(writeX, 42, 'Data:', 8); line(writeX + 8, 43, writeX + writeWidth, 43);
    rect(modelX, 47, modelWidth, 8, '#f2f2f2');
    rect(writeX, 47, writeWidth, 8, '#f2f2f2');
    text(modelX + 2, 52.5, 'MODEL', 9, true);
    text(writeX + 2, 52.5, 'ESCRIC I REVISO', 9, true, '#222222', { maxWidth: writeWidth - 4 });
    const top = 56, bottom = 268, rowH = Math.min(12, (bottom - top) / entries.length);
    entries.forEach((entry, i) => {
      const baseline = top + (i + 1) * rowH - 2.1;
      [modelX, writeX].forEach(x => text(x + 1, baseline, `${i + 1}.`, 7, false, '#777777'));
      text(modelX + 9, baseline, entry.text, 12, false, '#222222', { maxWidth: modelWidth - 9 });
      [layout.modelArea, layout.writingArea].forEach(area => line(area.x, top + (i + 1) * rowH, area.x + area.width, top + (i + 1) * rowH, '#aaaaaa', .18));
    });
    [layout.modelArea, layout.writingArea].forEach(area => line(area.x, top, area.x + area.width, top, '#aaaaaa', .18));
    layout.folds.forEach(x => line(x, 10, x, 287, '#777777', .25, true));
    layout.printSteps.forEach((step, i) => text(modelX, 277 + i * 5, step, 6.5, false, '#555555', { maxWidth: modelWidth }));
    text(writeX, 277, 'Revisa en aquesta mateixa columna.', 6.5, false, '#555555', { maxWidth: writeWidth });
    text(writeX, 282, `${entries.length} ${mode === 'words' ? 'paraules' : 'pseudoparaules'} · A4 · 100 %`, 6, false, '#666666', { maxWidth: writeWidth });
    if (mode === 'pseudo') {
      text(modelX, 289, 'Model proposat: altres grafies poden', 6, false, '#555555', { maxWidth: modelWidth });
      text(modelX, 293, 'representar el mateix so.', 6, false, '#555555');
    }
    const labels = Array.isArray(focusLabels)
      ? [...new Set(focusLabels.map(l => String(l ?? '').trim()).filter(Boolean))].slice(0, 16)
      : [];
    if (labels.length || seedCode) {
      // Banda buida protegida: tria el panell buit més ample entre plecs i escriptura.
      const [b0, b1] = layout.blank;
      const cuts = [b0, ...layout.folds.filter(x => x > b0 && x < b1), b1];
      let px = b0, pw = 0;
      for (let i = 0; i < cuts.length - 1; i++) {
        if (cuts[i + 1] - cuts[i] > pw) { pw = cuts[i + 1] - cuts[i]; px = cuts[i]; }
      }
      const fx = Math.max(12,px+4), fw = Math.min(198,px+pw-4)-fx;
      if(seedCode){const url=QR.urlFor(seedCode,seedLanguage);shapes.push(...QR.shapes(url,fx+(fw-28)/2,13,28));text(fx+fw/2,43,'ortogra.fi · dictat',7,false,'#555555',{align:'center',role:'worksheet-link'});}
      if(labels.length){
        rect(fx,47,fw,14,'#f2f2f2');shapes[shapes.length-1].role='practice-focus';
        text(fx+2,52.5,'Aquest dictat treballa',9,true,'#222222',{maxWidth:fw-4,role:'practice-focus'});
        text(fx+2,57.5,'els següents focus:',9,true,'#222222',{maxWidth:fw-4,role:'practice-focus'});
        labels.forEach((label,i)=>text(fx+2,69+i*6,label,9,false,'#333333',{maxWidth:fw-4,role:'practice-focus'}));
      }
    }
    return shapes;
  }
  function teacherSheet({ entries, title, mode, seedCode, seedLanguage = 'ca' }, categories) {
    const shapes = [];
    const text = (x, y, value, size = 10, weight = false, color = '#222222', extra = {}) => shapes.push({ type: 'text', x, y, value, size, weight, color, ...extra });
    text(12, 15, 'plec / guia de lectura docent' + (seedCode ? ` · ${seedLanguage.toUpperCase()} / ${seedCode}` : ''), 9, true, '#222222', { maxWidth: 186 });
    text(12, 28, title || 'Guia del dictat', 17, true, '#222222', { maxWidth: 186 });
    text(12, 38, `${entries.length} ${mode === 'words' ? 'paraules' : 'pseudoparaules'}`, 10);
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
    text(12, 282, mode === 'pseudo' ? 'Banc de pràctica creat per a l’aula; no és una prova estandarditzada.' : 'Desplega el model al final i revisa i corregeix a la mateixa columna on has escrit.', 8);
    return shapes;
  }
  root.PlecCore = { normalize, migrateFocusTags, shuffled, matchesStage, candidates, generate, propose, validateCustom, foldLayout, worksheet, teacherSheet };
  if (typeof module !== 'undefined') module.exports = root.PlecCore;
})(typeof window === 'undefined' ? globalThis : window);
