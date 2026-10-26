/* Zoom relatiu al full ajustat. Les coordenades de desplaçament són píxels de pantalla. */
(function (root) {
  'use strict';
  const MIN = .5, MAX = 4;
  function limit(view) {
    const zoom = Math.max(MIN, Math.min(MAX, view.zoom));
    const dx = Math.max(0, (view.paperWidth * zoom - view.width) / 2);
    const dy = Math.max(0, (view.paperHeight * zoom - view.height) / 2);
    return { ...view, zoom, x: Math.max(-dx, Math.min(dx, view.x)), y: Math.max(-dy, Math.min(dy, view.y)) };
  }
  function zoomAt(view, next, anchor = { x: 0, y: 0 }) {
    const zoom = Math.max(MIN, Math.min(MAX, next));
    const ratio = zoom / view.zoom;
    return limit({ ...view, zoom, x: anchor.x - (anchor.x - view.x) * ratio, y: anchor.y - (anchor.y - view.y) * ratio });
  }
  if (typeof module !== 'undefined') module.exports = { limit, zoomAt, MIN, MAX };
  if (!root.document) return;
  const host = document.getElementById('paper-viewport'), paper = document.getElementById('sheet-preview');
  const out = document.getElementById('zoom-out'), plus = document.getElementById('zoom-in');
  const hint = document.getElementById('zoom-scroll-hint');
  let hintTimer, hideHintTimer, hintVisible=false;
  function hideHint() {
    clearTimeout(hintTimer);hintVisible=false;hint?.classList.remove('is-visible');
    clearTimeout(hideHintTimer);hideHintTimer=setTimeout(()=>{if(hint)hint.hidden=true;},root.PlecMotion?.duration ?? 220);
  }
  function showHint() {
    if(!hint)return;
    clearTimeout(hintTimer);clearTimeout(hideHintTimer);
    hintVisible=true;hint.hidden=false;requestAnimationFrame(()=>{if(hintVisible)hint.classList.add('is-visible');});
    hintTimer=setTimeout(hideHint,1800);
  }
  let view = { zoom: 1, x: 0, y: 0, width: 0, height: 0, paperWidth: 0, paperHeight: 0 }, frame, gesture;
  const pointers = new Map();
  function pointerPosition() {
    const points = [...pointers.values()].slice(0, 2), rect = host.getBoundingClientRect();
    return {
      x: points.reduce((sum, p) => sum + p.x, 0) / points.length - rect.left - rect.width / 2,
      y: points.reduce((sum, p) => sum + p.y, 0) / points.length - rect.top - rect.height / 2,
      distance: points.length === 2 ? Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y) : 0
    };
  }
  function rebaseGesture() {
    gesture = pointers.size ? { ...pointerPosition(), view: { ...view } } : null;
    host.classList.toggle('is-panning', !!gesture);
  }
  function render() {
    paper.style.setProperty('--preview-width', view.paperWidth + 'px');
    paper.style.setProperty('--preview-height', view.paperHeight + 'px');
    paper.style.setProperty('--zoom', view.zoom);
    paper.style.setProperty('--pan-x', view.x + 'px');
    paper.style.setProperty('--pan-y', view.y + 'px');
    document.getElementById('zoom-value').value = Math.round(view.zoom * 100) + ' %';
    out.disabled = view.zoom <= MIN; plus.disabled = view.zoom >= MAX;
    host.classList.toggle('can-pan', view.paperWidth * view.zoom > view.width || view.paperHeight * view.zoom > view.height);
  }
  function fit() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (!host.clientWidth || !host.clientHeight) return;
      const scale = Math.min(host.clientWidth / 210, host.clientHeight / 297);
      view = limit({ ...view, width: host.clientWidth, height: host.clientHeight, paperWidth: scale * 210, paperHeight: scale * 297 });
      render();
    });
  }
  function zoom(next, clientX, clientY) {
    const rect = host.getBoundingClientRect();
    const anchor = clientX === undefined ? { x: 0, y: 0 } : { x: clientX - rect.left - rect.width / 2, y: clientY - rect.top - rect.height / 2 };
    view = zoomAt(view, next, anchor); render();
  }
  function reset() { view = { ...view, zoom: 1, x: 0, y: 0 }; render(); }
  out.addEventListener('click', () => zoom(view.zoom / 1.2));
  plus.addEventListener('click', () => zoom(view.zoom * 1.2));
  document.getElementById('zoom-fit').addEventListener('click', reset);
  host.addEventListener('wheel', event => {
    if(!event.ctrlKey){showHint();return;}
    event.preventDefault();
    hideHint();
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? host.clientHeight : 1);
    zoom(view.zoom * Math.exp(-Math.max(-160, Math.min(160, delta)) * .002), event.clientX, event.clientY);
  }, { passive: false });
  host.addEventListener('dblclick', event => { if (!event.target.closest('.zoom-tools')) reset(); });
  host.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.target.closest('.zoom-tools')) return;
    host.focus({ preventScroll: true });
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    rebaseGesture();
    host.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  host.addEventListener('pointermove', event => {
    if (!gesture || !pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const current = pointerPosition(), original = gesture.view;
    const nextZoom = gesture.distance > 0 ? Math.max(MIN, Math.min(MAX, original.zoom * current.distance / gesture.distance)) : original.zoom;
    const ratio = nextZoom / original.zoom;
    view = limit({ ...original, zoom: nextZoom, x: current.x - (gesture.x - original.x) * ratio, y: current.y - (gesture.y - original.y) * ratio });
    render();
  });
  function finishDrag(event) {
    if (!pointers.delete(event.pointerId)) return;
    rebaseGesture();
  }
  host.addEventListener('pointerup', finishDrag);
  host.addEventListener('pointercancel', finishDrag);
  host.addEventListener('lostpointercapture', finishDrag);
  host.addEventListener('keydown', event => {
    if (event.target !== host) return;
    if (['+', '=', '-', '0', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
    if (['+', '='].includes(event.key)) zoom(view.zoom * 1.2);
    else if (event.key === '-') zoom(view.zoom / 1.2);
    else if (event.key === '0') reset();
    else if (event.key.startsWith('Arrow')) {
      const dx = event.key === 'ArrowLeft' ? 45 : event.key === 'ArrowRight' ? -45 : 0;
      const dy = event.key === 'ArrowUp' ? 45 : event.key === 'ArrowDown' ? -45 : 0;
      view = limit({ ...view, x: view.x + dx, y: view.y + dy }); render();
    }
  });
  if (root.ResizeObserver) new ResizeObserver(fit).observe(host);
  root.addEventListener('resize', fit);
  root.PlecPreview = { fit };
  fit();
})(typeof window === 'undefined' ? globalThis : window);
