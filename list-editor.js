/* Layout controls for filtered and grouped lists; no changes to catalogue filters. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id), t = window.PlecLanguageTools.text;
  const dialog = $('list-editor'), form = $('list-layout-form'), preview = $('list-page');
  const controls = ['list-title', 'list-font-size', 'list-columns', 'list-orientation'].map($);
  let source, filename, result, pageIndex = 0, generation = 0, timer, returnFocus;
  const defaults = { fontSize: 16, columns: 3, orientation: 'portrait' };
  function fitPage() {
    if (!result) return;
    const area = preview.parentElement, style = getComputedStyle(area);
    const width = area.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const height = area.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    preview.style.width = Math.max(1, Math.min(660, width, height * result.width / result.height)) + 'px';
  }
  new ResizeObserver(fitPage).observe(preview.parentElement);

  function invalidate() {
    clearTimeout(timer); generation++; result = null;
    $('list-download').disabled = true;
    $('list-prev').disabled = $('list-next').disabled = true;
    preview.setAttribute('aria-busy', 'true');
    $('list-preview-status').textContent = t('Actualitzant la vista prèvia…');
    $('list-fit-note').hidden = true;
  }
  function showPage() {
    if (!result) return;
    pageIndex = Math.min(pageIndex, result.pages.length - 1);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${result.width} ${result.height}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', t('Pàgina {page} de {total}', { page: pageIndex + 1, total: result.pages.length }));
    svg.style.aspectRatio = `${result.width} / ${result.height}`;
    for (const shape of result.pages[pageIndex]) {
      const node = document.createElementNS(svg.namespaceURI, shape.type === 'text' ? 'text' : 'line');
      if (shape.type === 'text') {
        node.textContent = shape.value;
        for (const [key, value] of Object.entries({ x: shape.x, y: shape.y, 'font-size': shape.size, 'font-weight': shape.weight ? '700' : '400', fill: shape.color })) node.setAttribute(key, value);
      } else {
        for (const [key, value] of Object.entries({ x1: shape.x, x2: shape.x2, y1: shape.y, y2: shape.y, stroke: shape.color, 'stroke-width': .6 })) node.setAttribute(key, value);
      }
      svg.append(node);
    }
    preview.replaceChildren(svg);
    fitPage();
    $('list-page-number').textContent = t('Pàgina {page} de {total}', { page: pageIndex + 1, total: result.pages.length });
    $('list-prev').disabled = pageIndex === 0;
    $('list-next').disabled = pageIndex === result.pages.length - 1;
  }
  async function update() {
    const ticket = generation;
    if (!form.checkValidity()) {
      preview.removeAttribute('aria-busy');
      $('list-preview-status').textContent = t('Tria una mida de lletra entre 10 i 30 punts.');
      return;
    }
    const settings = { title: $('list-title').value, fontSize: Number($('list-font-size').value), columns: Number($('list-columns').value), orientation: $('list-orientation').value };
    try {
      const prepared = await window.PlecPdf.prepareWordList({ ...source, ...settings });
      if (ticket !== generation || !dialog.open) return;
      result = prepared;
      showPage();
      $('list-download').disabled = false;
      $('list-preview-status').textContent = '';
      $('list-fit-note').hidden = !prepared.fittedCount;
    } catch {
      if (ticket !== generation || !dialog.open) return;
      preview.replaceChildren();
      $('list-preview-status').textContent = t('No s’ha pogut generar la vista prèvia. Canvia una opció per tornar-ho a provar.');
    } finally {
      if (ticket === generation) preview.removeAttribute('aria-busy');
    }
  }
  function changed() { invalidate(); timer = setTimeout(update, 220); }
  controls.forEach(control => control.addEventListener('input', changed));
  $('list-prev').addEventListener('click', () => { if (result && pageIndex > 0) { pageIndex--; showPage(); } });
  $('list-next').addEventListener('click', () => { if (result && pageIndex < result.pages.length - 1) { pageIndex++; showPage(); } });
  $('list-reset').addEventListener('click', () => { reset(); changed(); });
  function reset() {
    $('list-title').value = source.title;
    $('list-font-size').value = defaults.fontSize;
    $('list-columns').value = defaults.columns;
    $('list-orientation').value = defaults.orientation;
    pageIndex = 0;
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!result || $('list-download').disabled) return;
    const url = URL.createObjectURL(new Blob([result.bytes], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  });
  dialog.addEventListener('close', () => { invalidate(); source = null; preview.replaceChildren(); returnFocus?.focus(); });
  window.PlecListEditor = {
    open(options, name) {
      returnFocus = document.activeElement;
      source = options; filename = name; result = null; reset();
      $('list-editor-kind').textContent = t(options.categories ? 'Per focus de pràctica' : 'Llista alfabètica');
      $('list-page-number').textContent = '';
      preview.replaceChildren();
      window.PlecMotion.open(dialog);
      invalidate(); update();
    }
  };
})();
