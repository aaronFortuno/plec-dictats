/* Una mateixa durada per als diàlegs, desplegables i canvis de la interfície. */
(function () {
  'use strict';
  const duration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--motion-duration')) || 220;
  const easing = getComputedStyle(document.documentElement).getPropertyValue('--motion-ease').trim() || 'ease';
  const closing = new WeakMap();
  function open(dialog) {
    if (closing.has(dialog)) { clearTimeout(closing.get(dialog)); closing.delete(dialog); }
    dialog.classList.remove('is-closing');
    if (!dialog.open) dialog.showModal();
  }
  function close(dialog) {
    if (!dialog.open || closing.has(dialog)) return;
    dialog.classList.add('is-closing');
    closing.set(dialog, setTimeout(() => { dialog.close(); dialog.classList.remove('is-closing'); closing.delete(dialog); }, duration));
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
      animation = content.animate([{ height: start + 'px', opacity: expanded ? 0 : 1 }, { height: finish + 'px', opacity: expanded ? 1 : 0 }], { duration, easing });
      animation.onfinish = () => { content.style.overflow = ''; content.hidden = !expanded; details.open = expanded; };
    });
  });
  window.PlecMotion = { open, close, duration };
})();
