/* Una mateixa durada per als diàlegs, desplegables i canvis de la interfície. */
(function () {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function duration() {
    // CSS is the live source of timing. Reading this MQL's .matches here can
    // consume Chrome's pending change before it dispatches the change event,
    // leaving an already-running animation without its completion callback.
    const value = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--motion-duration'));
    return Number.isFinite(value) && value >= 0 ? value : 220;
  }
  const easing = getComputedStyle(document.documentElement).getPropertyValue('--motion-ease').trim() || 'ease';
  const closing = new Map(), animations = new Set();
  function animate(element, frames, options = {}) {
    if (!element.animate || duration() === 0) return null;
    const animation = element.animate(frames, {...options, duration: duration(), easing});
    animations.add(animation);
    const forget = () => animations.delete(animation);
    animation.addEventListener('finish', forget, {once: true});
    animation.addEventListener('cancel', forget, {once: true});
    return animation;
  }
  function open(dialog) {
    if (closing.has(dialog)) { clearTimeout(closing.get(dialog).timer); closing.delete(dialog); }
    dialog.classList.remove('is-closing');
    if (!dialog.open) dialog.showModal();
  }
  function close(dialog) {
    if (!dialog.open || closing.has(dialog)) return;
    const finish = () => { dialog.close(); dialog.classList.remove('is-closing'); closing.delete(dialog); };
    const delay = duration();
    if (delay === 0) { finish(); return; }
    dialog.classList.add('is-closing');
    closing.set(dialog, {timer: setTimeout(finish, delay), finish});
  }
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('cancel', event => { event.preventDefault(); close(dialog); }));
  document.querySelectorAll('details').forEach(details => {
    const summary = details.querySelector(':scope > summary');
    if (!summary) return;
    const content = document.createElement('div'); content.className = 'details-body';
    [...details.childNodes].filter(node => node !== summary).forEach(node => content.appendChild(node));
    details.appendChild(content); content.hidden = !details.open;
    let expanded = details.open, animation;
    summary.addEventListener('click', event => {
      event.preventDefault();
      const start = details.open && !content.hidden ? content.getBoundingClientRect().height : 0;
      animation?.cancel(); expanded = !expanded;
      details.open = true; content.hidden = false;
      const finish = expanded ? content.scrollHeight : 0;
      content.style.overflow = 'hidden';
      const settle = () => { content.style.overflow = ''; content.hidden = !expanded; details.open = expanded; };
      animation = animate(content, [{ height: start + 'px', opacity: expanded ? 0 : 1 }, { height: finish + 'px', opacity: expanded ? 1 : 0 }]);
      if (animation) animation.onfinish = settle;
      else settle();
    });
  });
  reduced.addEventListener('change', event => {
    if (!event.matches) return;
    for (const pending of [...closing.values()]) { clearTimeout(pending.timer); pending.finish(); }
    // Include running WAAPI animations started by other shared components too.
    for (const animation of new Set([...animations, ...document.getAnimations()])) {
      try { animation.finish(); } catch { animation.cancel(); }
    }
  });
  window.PlecMotion = { open, close, animate, get duration() { return duration(); } };
})();
