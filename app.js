/* Plec funciona també obrint index.html directament, sense servidor. */
(function () {
  'use strict';
  const C = window.PlecCatalog, K = window.PlecCore, L = window.PlecLanguage, LT = window.PlecLanguageTools;
  const $ = id => document.getElementById(id);
  const STORAGE = 'plec-dictats-v1:' + L.id;
  const allowedCounts = [8, 12, 16, 20, 24];
  const allowedStages = Object.keys(C.stages);
  const allowedFoldStyles = ['thirds', 'quarter'];
  const metadata = entry => entry.mode === 'words' ? `${C.vocabularyBands[entry.vocabulary] || 'Sense classificar'} · Ortografia: ${C.orthographyBands[entry.orthography] || 'Sense classificar'}` : '';
  const customMetadata = entry => ({ vocabulary: Object.hasOwn(C.vocabularyBands, entry?.vocabulary) ? entry.vocabulary : 'unrated', orthography: Object.hasOwn(C.orthographyBands, entry?.orthography) ? entry.orthography : 'unrated' });
  const pinIcon = window.PlecIcons('pin');
  const changeIcon = window.PlecIcons('refresh-cw');
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const modeTags = mode => [...C.categories.filter(c => c.mode === mode), ...(state.custom.some(e => e.mode === mode) ? [{ id: 'custom', label: 'Les meves paraules', mode }] : [])];
  const emptySession = mode => ({ count: mode === 'words' ? 24 : 20, stage: mode === 'words' ? 'cs' : 'all', tags: C.categories.filter(c => c.mode === mode).map(c => c.id), ids: [], locks: [], seen: [] });
  let state = { mode: 'words', modelSide: 'left', foldStyle: 'thirds', custom: [], sessions: { words: emptySession('words'), pseudo: emptySession('pseudo') } };
  let storageAvailable = true, toastTimer;
  const session = () => state.sessions[state.mode];
  const allEntries = () => [...C.entries, ...state.custom];
  const lookup = id => allEntries().find(e => e.id === id);
  const chosen = () => session().ids.map(lookup).filter(Boolean);
  const pool = () => K.candidates(allEntries(), state.mode, session().tags, session().stage);
  function say(message) {
    $('status').textContent = message;
    $('status').classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('status').classList.remove('visible'), 6500);
  }
  function persist() {
    try { localStorage.setItem(STORAGE, JSON.stringify({ ...state, language: L.id, catalogue: C.revision, catalogVersion: C.version })); }
    catch { if (storageAvailable) say('No es pot desar en aquest navegador. Guarda el dictat en un fitxer per conservar-lo.'); storageAvailable = false; }
  }
  function restore() {
    try {
      const data = LT.savedState(localStorage, STORAGE, L.id);
      if (!data || typeof data !== 'object') return;
      if (data.language && data.language !== L.id) return;
      state.custom = Array.isArray(data.custom) ? data.custom.filter(e => e && /^u-[\w-]+$/.test(e.id) && ['words', 'pseudo'].includes(e.mode) && K.validateCustom(e.text)).slice(0, 3000).map(e => ({ ...e, ...customMetadata(e), text: e.text.normalize('NFC'), tags: ['custom'] })) : [];
      state.custom = state.custom.filter((e, i, a) => a.findIndex(v => v.id === e.id || (v.mode === e.mode && v.text.toLocaleLowerCase(L.locale) === e.text.toLocaleLowerCase(L.locale))) === i);
      state.mode = ['words', 'pseudo'].includes(data.mode) ? data.mode : 'words';
      state.modelSide = data.modelSide === 'right' ? 'right' : 'left';
      state.foldStyle = allowedFoldStyles.includes(data.foldStyle) ? data.foldStyle : 'thirds';
      for (const mode of ['words', 'pseudo']) {
        const saved = data.sessions?.[mode];
        if (!saved || typeof saved !== 'object') continue;
        const s = state.sessions[mode];
        if (allowedCounts.includes(saved.count)) s.count = saved.count;
        if (allowedStages.includes(saved.stage)) s.stage = saved.stage;
        if (Array.isArray(saved.tags)) s.tags = K.migrateFocusTags(saved.tags, modeTags(mode).map(c => c.id), mode === 'words' ? ['flexio'] : []);
        if (mode === 'words' && (!data.catalogVersion || data.catalogVersion < 3) && s.tags.includes('signes')) {
          // L'antic focus incloïa dièresi i ela geminada.
          s.tags.push('dieresi');
          if (C.categories.filter(c => c.mode === mode && !['verbs', 'dieresi'].includes(c.id)).every(c => s.tags.includes(c.id))) s.tags.push('verbs');
        }
        if (Array.isArray(saved.ids)) s.ids = [...new Set(saved.ids)].filter(id => lookup(id)?.mode === mode).slice(0, s.count);
        if (Array.isArray(saved.locks)) s.locks = saved.locks.filter(id => s.ids.includes(id));
        if (Array.isArray(saved.seen)) s.seen = [...new Set(saved.seen)].filter(id => lookup(id)?.mode === mode);
      }
    } catch { /* Un estat antic invàlid no ha d'impedir obrir l'eina. */ }
  }
  function foldSketch(layout) {
    const mirror = layout.side === 'right', mx = x => mirror ? 360 - x : x;
    const line = (x1,y1,x2,y2,color='#65736a') => `<line x1="${mx(x1)}" y1="${y1}" x2="${mx(x2)}" y2="${y2}" stroke="${color}" stroke-width="1.5"/>`;
    const label = (x,y,text,color='#234d43') => `<text x="${mx(x)}" y="${y}" text-anchor="${mirror?'end':'start'}" fill="${color}">${text}</text>`;
    const headings = '<text x="12" y="17" class="fold-phase">Durant el dictat</text><text x="12" y="118" class="fold-phase">Per corregir</text>';
    const drawing = layout.foldStyle === 'quarter'
      ? line(20,60,340,60)+line(20,60,177,49)+line(26,58,177,49)+label(30,39,'model amagat')+label(193,81,'escriptura')+line(20,167,340,167)+line(20,167,174,139)+line(22,139,174,139)+label(29,132,'model visible')+label(193,188,'escriptura')
      : line(90,51,270,51)+line(90,57,268,57)+line(92,63,270,63)+label(100,41,'escriptura')+label(95,83,'buit i model al darrere')+line(20,161,340,161)+line(180,168,340,168)+label(28,150,'model visible')+label(195,150,'escriptura');
    return `<svg viewBox="0 0 360 202" role="img" aria-label="Vista lateral orientativa del full durant el dictat i durant la correcció">${headings}${drawing}</svg>`;
  }
  function updateControls() {
    const s = session();
    document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
    $('count-control').value = s.count;
    document.querySelectorAll('[data-side]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.side === state.modelSide)));
    $('fold-style-control').value = state.foldStyle;
    $('stage-field').hidden = state.mode !== 'words';
    $('stage-control').value = s.stage;
    $('stage-control').title = { cm: 'Bàsic i habitual, amb dificultat ortogràfica baixa o mitjana.', cs: 'Bàsic, habitual i d’ampliació. Sense vocabulari especialitzat.', eso: 'Ampliació i especialitzat, més mots coneguts amb ortografia exigent.', all: 'Sense límit de nivell; inclou els mots propis sense classificar.' }[s.stage];
    const layout = K.foldLayout(state.foldStyle, state.modelSide);
    $('fold-guide-title').textContent = `${layout.name} · model a ${state.modelSide === 'left' ? 'l’esquerra' : 'la dreta'}`;
    $('fold-map').innerHTML = layout.panels.map(p => `<span class="fold-panel ${p.kind}" style="flex:${p.width}"><b>${{model:'Model',writing:'Escric',blank:'Buit'}[p.kind]}</b><small>${p.width} mm</small></span>`).join('');
    $('fold-map').setAttribute('aria-label', 'Full obert: ' + layout.hint);
    $('fold-sketch').innerHTML = foldSketch(layout);
    $('fold-step-list').innerHTML = layout.steps.map(step => `<li>${escape(step)}</li>`).join('');
    $('tag-options').innerHTML = modeTags(state.mode).map(c => `<label class="tag"><input type="checkbox" value="${c.id}" ${s.tags.includes(c.id) ? 'checked' : ''}><span>${window.PlecIcons('check')}${escape(c.label)}</span></label>`).join('');
    $('pseudo-note').hidden = state.mode !== 'pseudo';
    $('custom-classification').hidden = state.mode !== 'words';
    $('word-total').textContent = allEntries().filter(e => e.mode === 'words').length;
    $('pseudo-total').textContent = allEntries().filter(e => e.mode === 'pseudo').length;
    updateAvailability();
  }
  function updateAvailability() {
    const s = session(), p = pool(), lockedOutside = s.locks.filter(id => !p.some(e => e.id === id)).length;
    $('pool-count').textContent = p.length;
    $('pool-status').textContent = !s.tags.length ? 'Tria almenys un focus.' : p.length + lockedOutside < s.count ? 'No hi ha prou mots: amplia els filtres o redueix la llargada.' : '';
  }
  function generate(quiet = false) {
    const s = session();
    try {
      const result = K.propose({ pool: pool(), count: s.count, locked: chosen().filter(e => s.locks.includes(e.id)), seen: s.seen, tags: s.tags });
      s.ids = result.entries.map(e => e.id);
      s.locks = s.locks.filter(id => s.ids.includes(id));
      s.seen = result.reused ? [...s.ids] : [...new Set([...s.seen, ...s.ids])];
      persist(); renderSelection();
      if (!quiet) say(result.missing ? `Falten ${result.missing} elements. Amplia els filtres o redueix la llargada.` : result.reused ? 'Dictat preparat. S’han esgotat els mots nous amb aquests focus; es recuperen alguns mots anteriors.' : `Nou dictat de ${s.count} elements preparat.`);
    } catch (error) { say(error.message); }
  }
  const measureCanvas = document.createElement('canvas');
  const measureContext = measureCanvas.getContext('2d');
  const MM = 25.4 / 72;
  function fitSize(shape) {
    if (!shape.maxWidth || !measureContext) return shape.size;
    measureContext.font = `${shape.weight ? 'bold ' : ''}${shape.size * MM}px Arial`;
    return Math.min(shape.size, shape.size * shape.maxWidth / Math.max(1, measureContext.measureText(shape.value).width));
  }
  // Les fonts estàndard del PDF admeten tots els caràcters catalans.
  const printable = window.PlecPdf.printable;
  function svgFor(shapes, layout = K.foldLayout(state.foldStyle, state.modelSide)) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 297" role="img" aria-label="Full A4: ${layout.name}, model a ${layout.side === 'left' ? 'l’esquerra' : 'la dreta'}" data-fold-style="${layout.foldStyle}" data-model-side="${layout.side}"><rect width="210" height="297" fill="white"/>${shapes.map(s => {
      if (s.type === 'line') return `<line x1="${s.x}" y1="${s.y}" x2="${s.x2}" y2="${s.y2}" stroke="${s.color}" stroke-width="${s.width}" ${s.dash ? 'stroke-dasharray="1.5 1.4"' : ''}/>`;
      if (s.type === 'rect') return `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" fill="${s.color}"/>`;
      const safeShape = { ...s, value: printable(s.value) };
      return `<text x="${s.x}" y="${s.y}" font-family="Arial,Helvetica,sans-serif" font-size="${fitSize(safeShape) * MM}" font-weight="${s.weight ? 700 : 400}" fill="${s.color}" text-anchor="${s.align === 'right' ? 'end' : s.align === 'center' ? 'middle' : 'start'}">${escape(safeShape.value)}</text>`;
    }).join('')}</svg>`;
  }
  function sheetOptions() { return { entries: chosen(), title: state.mode === 'words' ? 'Dictat de paraules' : 'Dictat de pseudoparaules', mode: state.mode, stage: session().stage, modelSide: state.modelSide, foldStyle: state.foldStyle }; }
  const fitPaper = () => window.PlecPreview.fit();
  function renderPreview() {
    const entries = chosen(), s = session(), complete = entries.length === s.count;
    const options = sheetOptions(), layout = K.foldLayout(options.foldStyle, options.modelSide);
    $('sheet-preview').innerHTML = entries.length ? svgFor(K.worksheet(options), layout) : '<div class="empty-selection">Tria focus o elements del catàleg per veure el full.</div>';
    $('selection-summary').textContent = `${entries.length} / ${s.count} elements`;
    $('preview-layout').textContent = `${layout.name} · model a ${layout.side === 'left' ? 'l’esquerra' : 'la dreta'}`;
    $('download-pdf').disabled = !complete;
    $('teacher-pdf').disabled = !complete;
    $('save-selection').disabled = !complete;
    const outside = entries.filter(e => !K.matchesStage(e, s.stage) || !e.tags.some(t => s.tags.includes(t))).length;
    $('selected-info').textContent = (complete ? `${entries.length} elements · ${s.locks.length} fixats` : `Falten ${s.count - entries.length} elements per completar el full.`) + (outside ? ` · ${outside} fora dels filtres actuals` : '');
    $('sheet-preview').setAttribute('aria-label', `Vista prèvia: ${entries.length} elements. Model visible.`);
    fitPaper();
  }
  function renderSelection() {
    const s = session();
    $('selected-words').innerHTML = chosen().map((e, i) => `<div class="word-item ${s.locks.includes(e.id) ? 'is-locked' : ''}"><span class="number">${String(i + 1).padStart(2, '0')}</span><span class="word">${escape(e.text)}</span><button class="icon-button" data-lock="${e.id}" aria-pressed="${s.locks.includes(e.id)}" aria-label="${s.locks.includes(e.id) ? 'Desfixa' : 'Fixa'} ${escape(e.text)}" title="${s.locks.includes(e.id) ? 'Desfixa' : 'Fixa'}">${pinIcon}</button><button class="icon-button" data-swap="${e.id}" aria-label="Canvia ${escape(e.text)}" title="Canvia aquesta paraula" ${s.locks.includes(e.id) ? 'disabled' : ''}>${changeIcon}</button></div>`).join('') || '<p class="empty-selection">Tria focus de pràctica o elements al catàleg.</p>';
    renderPreview(); updateAvailability();
  }
  function swap(id) {
    const s = session(), possible = pool().filter(e => !s.ids.includes(e.id));
    const fresh = possible.filter(e => !s.seen.includes(e.id));
    if (!possible.length) return say('No hi ha cap alternativa lliure. Amplia els focus per canviar aquest mot.');
    const [entry] = K.shuffled(fresh.length ? fresh : possible);
    const index = s.ids.indexOf(id);
    s.ids[index] = entry.id;
    s.seen = [...new Set([...s.seen, entry.id])]; persist(); renderSelection();
    $('selected-words').querySelector(`[data-swap="${entry.id}"]`)?.focus();
    say(`${lookup(id).text} s’ha canviat per ${entry.text}.`);
  }
  function renderCatalog(reset = false) {
    if (reset) {
      $('catalog-search').value = '';
      $('catalog-tag').innerHTML = '<option value="">Tots els focus</option>' + modeTags(state.mode).map(c => `<option value="${c.id}">${escape(c.label)}</option>`).join('');
      $('catalog-stage').value = session().stage;
      $('catalog-stage-field').hidden = state.mode !== 'words';
    }
    const s = session(), query = K.normalize($('catalog-search').value.trim()), tag = $('catalog-tag').value;
    const entries = allEntries().filter(e => e.mode === state.mode && (!tag || e.tags.includes(tag)) && K.matchesStage(e, $('catalog-stage').value) && K.normalize(e.text).includes(query)).sort((a, b) => a.text.localeCompare(b.text, 'ca'));
    $('catalog-description').textContent = state.mode === 'words' ? 'Consulta les paraules del banc o fes una tria manual. Desmarca un mot per deixar lloc a un altre.' : 'Formes proposades per practicar la correspondència so-grafia. El model admet altres escriptures compatibles amb el so dictat.';
    $('catalog-count').textContent = `${entries.length} ${entries.length === 1 ? 'resultat' : 'resultats'} · ${state.mode === 'words' ? 'paraules' : 'pseudoparaules'}`;
    $('catalog-selection-count').textContent = `${s.ids.length} de ${s.count} seleccionats`;
    $('catalog-list').innerHTML = entries.map(e => `<label class="catalog-entry" title="${escape(e.tags.map(t => modeTags(state.mode).find(c => c.id === t)?.label || t).join(' · ') + (metadata(e) ? ' · ' + metadata(e) : ''))}"><input type="checkbox" data-entry="${e.id}" ${s.ids.includes(e.id) ? 'checked' : ''} ${!s.ids.includes(e.id) && s.ids.length >= s.count ? 'disabled' : ''}><span class="entry-copy"><span>${escape(e.text)}</span>${metadata(e) ? `<small>${escape(metadata(e))}</small>` : ''}</span>${e.id.startsWith('u-') ? '<span title="Paraula pròpia">*</span>' : ''}</label>`).join('') || '<p class="empty">No hi ha resultats amb aquesta cerca.</p>';
  }
  function openCatalog() { renderCatalog(true); window.PlecMotion.open($('catalog-dialog')); $('catalog-search').focus(); }
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  async function buildPdf(teacher = false) { return window.PlecPdf.build(sheetOptions(), teacher, C.categories); }
  async function exportPdf(teacher) {
    const button = $(teacher ? 'teacher-pdf' : 'download-pdf'), original = button.innerHTML;
    button.disabled = true; button.textContent = 'Preparant…';
    try {
      const bytes = await buildPdf(teacher);
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), `plec-${state.mode === 'words' ? 'paraules' : 'pseudoparaules'}-${session().count}-${state.foldStyle === 'quarter' ? 'quart' : 'tercos'}-${state.modelSide === 'right' ? 'dreta' : 'esquerra'}${teacher ? '-guia' : ''}.pdf`);
      say(teacher ? 'Guia docent descarregada, en el mateix ordre que el full.' : 'PDF descarregat. Imprimeix-lo en A4 a escala 100 %.');
    } catch (error) { say('No s’ha pogut generar el PDF. ' + error.message); }
    finally { button.innerHTML = original; renderPreview(); }
  }
  function exportSelection() {
    const data = { format: 'plec-dictat', version: 4, language: L.id, catalogue: C.revision, mode: state.mode, count: session().count, stage: session().stage, modelSide: state.modelSide, foldStyle: state.foldStyle, title: sheetOptions().title, entries: chosen(), locks: session().locks };
    downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `plec-dictat-${state.mode === 'words' ? 'paraules' : 'pseudoparaules'}-${session().count}.json`);
    say('Dictat guardat. Recupera aquest fitxer per repetir la mateixa tria.');
  }
  function importSelection(data) {
    if (data?.format !== 'plec-dictat' || ![1, 2, 3, 4].includes(data.version) || !['words', 'pseudo'].includes(data.mode) || !allowedCounts.includes(data.count) || !Array.isArray(data.entries) || data.entries.length !== data.count) throw new Error('Aquest fitxer no és un dictat de Plec vàlid.');
    LT.assertImportLanguage(data, L.id);
    const names = new Set(), imported = [], additions = [];
    for (const e of data.entries) {
      if (!e || !K.validateCustom(e.text) || e.mode !== data.mode || names.has(e.text.normalize('NFC').toLocaleLowerCase(L.locale))) throw new Error('El fitxer conté mots invàlids o duplicats.');
      names.add(e.text.normalize('NFC').toLocaleLowerCase(L.locale));
      let entry = allEntries().find(v => v.mode === data.mode && v.text === e.text.normalize('NFC'));
      if (!entry) { entry = { id: 'u-' + Date.now().toString(36) + '-' + additions.length, text: e.text.normalize('NFC'), mode: data.mode, tags: ['custom'], ...customMetadata(e) }; additions.push(entry); }
      imported.push({ entry, originalId: e.id });
    }
    if (state.custom.length + additions.length > 3000) throw new Error('El banc propi ha arribat al màxim de 3.000 elements.');
    state.custom.push(...additions); state.mode = data.mode;
    const s = session(); s.count = data.count; s.ids = imported.map(v => v.entry.id);
    s.stage = allowedStages.includes(data.stage) ? data.stage : 'all';
    state.modelSide = data.modelSide === 'right' ? 'right' : 'left';
    state.foldStyle = allowedFoldStyles.includes(data.foldStyle) ? data.foldStyle : 'thirds';
    s.locks = Array.isArray(data.locks) ? imported.filter(v => data.locks.includes(v.originalId)).map(v => v.entry.id) : [];
    s.tags = modeTags(state.mode).map(c => c.id);
    s.seen = [...new Set([...s.seen, ...s.ids])];
    persist(); updateControls(); renderSelection(); say('Dictat recuperat amb el mateix ordre de paraules.');
  }
  restore();
  $('mode-control').addEventListener('click', event => {
    const b = event.target.closest('[data-mode]'); if (!b || b.dataset.mode === state.mode) return;
    state.mode = b.dataset.mode; updateControls();
    generate(true);
  });
  $('count-control').addEventListener('change', event => { const count = +event.target.value; if (!allowedCounts.includes(count) || count === session().count) return; session().count = count; updateControls(); generate(true); });
  $('tag-options').addEventListener('change', () => { session().tags = [...$('tag-options').querySelectorAll('input:checked')].map(e => e.value); generate(true); });
  $('all-tags').addEventListener('click', () => { session().tags = modeTags(state.mode).map(c => c.id); updateControls(); generate(true); });
  $('stage-control').addEventListener('change', event => { session().stage = event.target.value; updateControls(); generate(true); });
  $('model-side-control').addEventListener('click', event => { const b = event.target.closest('[data-side]'); if (!b || b.dataset.side === state.modelSide) return; state.modelSide = b.dataset.side; renderPreview(); updateControls(); persist(); });
  $('fold-style-control').addEventListener('change', event => { const nextStyle = event.currentTarget.value; if (!allowedFoldStyles.includes(nextStyle)) return; state.foldStyle = nextStyle; renderPreview(); updateControls(); persist(); });
  $('reshuffle-selection').addEventListener('click', () => generate());
  $('selected-words').addEventListener('click', event => {
    const pin = event.target.closest('[data-lock]'), swapButton = event.target.closest('[data-swap]');
    if (pin) { const id = pin.dataset.lock, s = session(); s.locks = s.locks.includes(id) ? s.locks.filter(v => v !== id) : [...s.locks, id]; persist(); renderSelection(); $('selected-words').querySelector(`[data-lock="${id}"]`)?.focus(); }
    if (swapButton) swap(swapButton.dataset.swap);
  });
  $('catalog-open').addEventListener('click', openCatalog); $('edit-catalog').addEventListener('click', openCatalog);
  $('help-open').addEventListener('click', () => window.PlecMotion.open($('help-dialog')));
  function openInfo(dialogId, titleId) {
    const dialog = $(dialogId);
    window.PlecMotion.open(dialog);
    dialog.querySelector('.dialog-scroll').scrollTop = 0;
    $(titleId).focus({ preventScroll: true });
  }
  $('about-open').addEventListener('click', () => openInfo('about-dialog', 'about-title'));
  $('changelog-open').addEventListener('click', () => openInfo('changelog-dialog', 'changelog-title'));
  let copyTimer;
  $('copy-lightning').addEventListener('click', async () => {
    const address = $('lightning-address'), button = $('copy-lightning'), status = $('lightning-copy-status');
    clearTimeout(copyTimer);
    try {
      await navigator.clipboard.writeText(address.textContent.trim());
      status.textContent = 'Adreça Lightning copiada.';
      button.innerHTML = window.PlecIcons('check'); button.classList.add('copied');
      copyTimer = setTimeout(() => { button.innerHTML = window.PlecIcons('copy'); button.classList.remove('copied'); status.textContent = ''; }, 3500);
    } catch {
      // En fitxers locals o navegadors sense accés al porta-retalls, facilita la còpia manual.
      const range = document.createRange(); range.selectNodeContents(address);
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      button.innerHTML = window.PlecIcons('copy'); button.classList.remove('copied');
      status.textContent = 'Selecciona i copia l’adreça amb el menú del navegador o amb Ctrl+C (⌘C al Mac).';
    }
  });
  const releases = [
    ['1.9', '2026-10-23', ['Retirat el filtre Femenins i plurals. Totes les formes continuen al banc i es trien amb els mateixos focus ortogràfics. Les tries i preferències antigues es conserven en retirar el filtre.'] ],
    ['1.8', '2026-10-23', ['Femenins i plurals: 137 formes noves, focus propi i etiquetes ortogràfiques compartides. Retirats ahir-vespre, ahir-nit, blat-de-moro i viuda; es conserva vídua. Incorporat arbitrar en lloc d’arbitre. Contrast exacte de les noves grafies amb el lèxic flexionat de Softcatalà.'] ],
    ['1.7', '2026-10-23', ['Entrada per llengua a /ca/, catàleg separat en JSON i 3.166 paraules per revisar. Descàrregues alfabètiques en text pla i taula de revisió. Identitat verificable del catàleg i dictats guardats amb llengua i versió.'] ],
    ['1.6', '2026-10-23', ['Vista prèvia amb zoom, arrossegament i ajust del full. Menús inicials sintetitzats per donar espai als focus. Retirats els codis aleatoris i la personalització de capçalera. Guia docent a l’ajuda, peu més llegible i animacions de 220 ms.']],
    ['1.5', '2026-10-23', ['Presentació del projecte i V4V com a Pentagrama: foto de l’autor, portfoli, QR i adreça Lightning amb còpia. Historial més compacte, amb capçalera fixa i enllaç al changelog complet.']],
    ['1.4', '2026-10-23', ['Tria automàtica amb els filtres i renovació des del lateral dret.', 'Configuració agrupada, més espai de treball i barres de desplaçament discretes.', 'Formes verbals i focus separats de dièresi i ela geminada.', 'Fulls sense camp Grup, icones Lucide i finestres d’historial i projecte.']],
    ['1.3', '2026-10-23', ['Tres columnes: configuració, full i paraules triades.', 'Capçalera compacta i vista prèvia que aprofita l’alçada disponible.']],
    ['1.2', '2026-10-23', ['Dos formats de plec: terços i quart de full.', 'Esquemes i instruccions adaptats al format i a la posició del model.']],
    ['1.1', '2026-10-23', ['Nivells orientatius amb solapament i ampliació del vocabulari.', 'Model configurable a l’esquerra o a la dreta.']],
    ['1.0', '2026-10-23', ['Primera versió: catàleg, tries, mots propis i exportació de PDF.']]
  ];
  const releaseDate = new Intl.DateTimeFormat(L.locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  $('changelog-list').innerHTML = releases.map(([version, date, notes]) => {
    const id = 'release-' + version.replaceAll('.', '-');
    return `<section class="release" aria-labelledby="${id}"><div><h3 id="${id}">${version}</h3><time datetime="${date}">${escape(releaseDate.format(new Date(date + 'T00:00:00Z')))}</time></div><p>${escape(notes.join(' '))}</p></section>`;
  }).join('');
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => window.PlecMotion.close(b.closest('dialog'))));
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) window.PlecMotion.close(dialog); } }));
  $('catalog-search').addEventListener('input', () => renderCatalog()); $('catalog-tag').addEventListener('change', () => renderCatalog());
  $('catalog-stage').addEventListener('change', () => renderCatalog());
  $('catalog-list').addEventListener('change', event => {
    const input = event.target.closest('[data-entry]'); if (!input) return;
    const s = session(), id = input.dataset.entry;
    if (input.checked && s.ids.length < s.count) { s.ids.push(id); s.seen = [...new Set([...s.seen, id])]; }
    else { s.ids = s.ids.filter(v => v !== id); s.locks = s.locks.filter(v => v !== id); }
    persist(); renderSelection();
    const scroll = $('catalog-list').scrollTop; renderCatalog(); $('catalog-list').scrollTop = scroll; $('catalog-list').querySelector(`[data-entry="${id}"]`)?.focus({ preventScroll: true });
  });
  $('clear-selection').addEventListener('click', () => { session().ids = []; session().locks = []; persist(); renderSelection(); renderCatalog(); say('Tria buida. Selecciona els mots que vulguis incloure.'); });
  $('add-custom').addEventListener('click', () => {
    const terms = [...new Set($('custom-text').value.split(/[,;\n\r]+/).map(t => t.trim().toLocaleLowerCase(L.locale).normalize('NFC')).filter(Boolean))];
    if (!terms.length) return say('Escriu almenys una paraula.');
    const invalid = terms.filter(t => !K.validateCustom(t));
    if (invalid.length) return say('Revisa aquestes formes (màxim 26 lletres, sense espais): ' + invalid.slice(0, 3).join(', '));
    const additions = terms.filter(text => !allEntries().some(e => e.mode === state.mode && e.text === text));
    if (state.custom.length + additions.length > 3000) return say('Es poden guardar fins a 3.000 elements propis.');
    const stamp = Date.now().toString(36);
    const classification = { vocabulary: $('custom-vocabulary').value, orthography: $('custom-orthography').value };
    additions.forEach((text, i) => state.custom.push({ id: `u-${stamp}-${i}`, text, mode: state.mode, tags: ['custom'], ...classification }));
    if (additions.length && !session().tags.includes('custom')) session().tags.push('custom');
    $('custom-text').value = ''; persist(); updateControls(); renderPreview(); renderCatalog(true); $('catalog-tag').value = 'custom'; $('catalog-stage').value = 'all'; renderCatalog();
    say(additions.length ? `${additions.length} elements afegits al banc propi.` : 'Aquests elements ja són al banc.');
  });
  $('export-catalog').addEventListener('click', () => downloadBlob(new Blob([JSON.stringify({ format: 'plec-cataleg', version: 3, language: L.id, catalogue: C.revision, categories: C.categories, vocabularyBands: C.vocabularyBands, orthographyBands: C.orthographyBands, entries: allEntries() }, null, 2)], { type: 'application/json' }), 'plec-cataleg.json'));
    $('export-words-text').addEventListener('click', () => {
      // Official catalogue only: independent of the current filters and personal additions.
      const words = C.entries.filter(e => e.mode === 'words').map(e => e.text).sort(new Intl.Collator(L.locale, { sensitivity: 'variant' }).compare);
      downloadBlob(new Blob([words.join('\n') + '\n'], { type: 'text/plain;charset=utf-8' }), `plec-${L.id}-paraules.txt`);
    });
    $('export-pseudo-text').addEventListener('click', () => {
      const words = C.entries.filter(e => e.mode === 'pseudo').map(e => e.text).sort(new Intl.Collator(L.locale, { sensitivity: 'variant' }).compare);
      downloadBlob(new Blob([words.join('\n') + '\n'], { type: 'text/plain;charset=utf-8' }), `plec-${L.id}-pseudoparaules.txt`);
    });
  $('download-pdf').addEventListener('click', () => exportPdf(false)); $('teacher-pdf').addEventListener('click', () => exportPdf(true));
  $('save-selection').addEventListener('click', exportSelection); $('load-selection').addEventListener('click', () => $('selection-file').click());
  $('selection-file').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try { if (file.size > 1024 * 1024) throw new Error('El fitxer és massa gran.'); importSelection(JSON.parse(await file.text())); }
    catch (error) { say(error instanceof SyntaxError ? 'Aquest fitxer no conté un JSON vàlid.' : error.message); }
    finally { event.target.value = ''; }
  });
  updateControls(); renderSelection(); if (!session().ids.length) generate(true);
  // Punt d’entrada per a comprovacions locals del PDF, sense modificar la tria.
  window.PlecApp = { buildPdf, svgFor, importSelection };
})();
