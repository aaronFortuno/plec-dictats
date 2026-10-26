(function () {
  'use strict';
  const analytics = window.PlecAnalytics, dialog = document.getElementById('analytics-dialog');
  if (!analytics || !dialog) return;
  const stateText = document.getElementById('analytics-state'), temporary = document.getElementById('analytics-temporary'), disable = document.getElementById('analytics-disable');
  const messages = {
    ready: 'Umami està disponible. Pots enviar avisos dels àudios.',
    loading: 'Connectant amb Umami…',
    unavailable: 'Umami no està disponible. Si tens un bloquejador, permet Umami en aquest web i prem «Permet temporalment» per reintentar-ho.',
    development: 'En aquesta còpia local no carreguem Umami ni enviem dades. Els avisos s’activen al web públic.',
    disabled: 'L’analítica està desactivada i els avisos no es poden enviar. Pots permetre-la temporalment per a aquesta pestanya.'
  };
  function update(state) {
    const browser = ['gpc', 'dnt'].includes(state.reason);
    stateText.textContent = browser ? 'El navegador ha demanat no fer tracking i respectem aquesta preferència. Per enviar un avís cal permetre el tracking d’Umami al navegador per a aquest web.' : messages[state.status];
    temporary.disabled = browser || ['loading', 'development', 'ready'].includes(state.status);
    disable.disabled = ['disabled', 'development'].includes(state.status);
  }
  analytics.subscribe(update);
  document.querySelectorAll('[data-analytics-settings]').forEach(button => button.addEventListener('click', () => {
    if (window.PlecMotion) window.PlecMotion.open(dialog); else dialog.showModal();
    analytics.refresh(); update(analytics.getState());
  }));
  function close() { if (window.PlecMotion) window.PlecMotion.close(dialog); else dialog.close(); }
  dialog.querySelector('[data-analytics-close]').addEventListener('click', close);
  if (!window.PlecMotion) dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('click', event => { if (event.target !== dialog) return; const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close(); });
  temporary.addEventListener('click', () => { temporary.disabled = true; analytics.allowTemporarily().then(() => update(analytics.getState())); });
  disable.addEventListener('click', () => analytics.disable());
  window.addEventListener('storage', () => analytics.refresh()); window.addEventListener('focus', () => analytics.refresh());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) analytics.refresh(); });

  // The wrapper remains focusable when its actual report button is disabled.
  let tip, anchor;
  function hideTip() { if (tip) { tip.classList.remove('is-visible'); tip.setAttribute('aria-hidden', 'true'); } anchor = null; }
  function showTip(target) {
    const wrap = target.closest?.('[data-report-tooltip]'); if (!wrap) return;
    if (!tip) { tip = document.createElement('div'); tip.id = 'audio-report-tooltip'; tip.className = 'audio-report-tooltip'; tip.setAttribute('role', 'tooltip'); }
    const parent = wrap.closest('dialog') || document.body; if (tip.parentNode !== parent) parent.appendChild(tip);
    anchor = wrap; wrap.setAttribute('aria-describedby', tip.id); tip.textContent = wrap.dataset.reportTooltip; tip.setAttribute('aria-hidden', 'false');
    tip.style.left = '12px'; tip.style.top = '12px'; tip.classList.add('is-visible');
    const r = wrap.getBoundingClientRect(), t = tip.getBoundingClientRect();
    tip.style.left = Math.max(12, Math.min(window.innerWidth - t.width - 12, r.left + r.width / 2 - t.width / 2)) + 'px';
    tip.style.top = Math.max(12, r.top - t.height - 10 < 12 ? Math.min(window.innerHeight - t.height - 12, r.bottom + 10) : r.top - t.height - 10) + 'px';
  }
  document.addEventListener('pointerover', event => showTip(event.target));
  document.addEventListener('focusin', event => showTip(event.target));
  document.addEventListener('pointerout', event => { if (anchor && anchor.contains(event.target) && !anchor.contains(event.relatedTarget)) hideTip(); });
  document.addEventListener('focusout', event => { if (anchor && !anchor.contains(event.relatedTarget)) hideTip(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hideTip(); });
  document.addEventListener('pointerdown', hideTip);
  document.addEventListener('scroll', hideTip, true);
})();
