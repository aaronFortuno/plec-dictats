(function () {
  'use strict';
  const analytics = window.PlecAnalytics, dialog = document.getElementById('analytics-dialog');
  if (!analytics || !dialog) return;
  const stateText = document.getElementById('analytics-state'), temporary = document.getElementById('analytics-temporary'), disable = document.getElementById('analytics-disable');
  const help=window.PlecPrivacyHelp,browserSelect=document.getElementById('analytics-browser');let browserChosen=false;
  if(help&&browserSelect){browserSelect.value=help.browserFor(navigator);browserSelect.addEventListener('change',()=>{browserChosen=true;update(analytics.getState());});
    if(navigator.brave?.isBrave)navigator.brave.isBrave().then(isBrave=>{if(isBrave&&!browserChosen){browserSelect.value='brave';update(analytics.getState());}}).catch(()=>{});
  }
  const messages = {
    ready: 'Umami està disponible. Pots enviar avisos dels àudios.',
    loading: 'Connectant amb Umami…',
    unavailable: 'Umami no està disponible. Si tens un bloquejador, permet Umami en aquest web i prem «Permet temporalment» per reintentar-ho.',
    development: 'En aquesta còpia local no carreguem Umami ni enviem dades. Els avisos s’activen al web públic.',
    disabled: 'L’analítica està desactivada i els avisos no es poden enviar. Pots permetre-la temporalment per a aquesta pestanya.'
  };
  function update(state) {
    const browser = ['gpc', 'dnt'].includes(state.reason);
    stateText.textContent = browser ? 'Els avisos estan bloquejats pel senyal de privacitat del navegador. A sota tens els passos per habilitar-los si ho vols.' : messages[state.status];
    temporary.disabled = browser || ['loading', 'development', 'ready'].includes(state.status);
    disable.disabled = ['disabled', 'development'].includes(state.status);
    const panel=document.getElementById('analytics-browser-help');
    if(help&&panel){panel.hidden=!(browser||state.status==='unavailable');const guide=help.guide(browserSelect.value,state,navigator);
      document.getElementById('analytics-help-intro').textContent=guide.intro;
      document.getElementById('analytics-help-steps').replaceChildren(...guide.steps.map(step=>{const li=document.createElement('li');li.textContent=step;return li;}));
      const scope=document.getElementById('analytics-help-scope');scope.textContent=guide.scope;scope.hidden=!guide.scope;
      const source=document.getElementById('analytics-help-source');source.hidden=!guide.source;if(guide.source)source.href=guide.source;
    }
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
  function hideTip() { if (tip) { tip.classList.remove('is-visible'); tip.setAttribute('aria-hidden', 'true'); } anchor?.removeAttribute('aria-describedby'); anchor = null; }
  function showTip(target) {
    const wrap = target.closest?.('[data-report-tooltip]'); if (!wrap) return;
    if (!tip) { tip = document.createElement('div'); tip.id = 'audio-report-tooltip'; tip.className = 'audio-report-tooltip'; tip.setAttribute('role', 'tooltip'); }
    const parent = wrap.closest('dialog') || document.body; if (tip.parentNode !== parent) parent.appendChild(tip);
    if(anchor!==wrap)anchor?.removeAttribute('aria-describedby');
    anchor = wrap; wrap.setAttribute('aria-describedby', tip.id); tip.textContent = wrap.dataset.reportTooltip; tip.setAttribute('aria-hidden', 'false');
    tip.style.left = '0px'; tip.style.top = '0px'; tip.classList.add('is-visible');
    const bounds=parent===document.body?{left:0,top:0,right:innerWidth,bottom:innerHeight}:parent.getBoundingClientRect();
    tip.style.maxWidth=Math.min(290,bounds.right-bounds.left-24)+'px';
    const r = wrap.getBoundingClientRect(), t = tip.getBoundingClientRect();
    const left=Math.max(bounds.left+12,Math.min(bounds.right-t.width-12,r.left+r.width/2-t.width/2));
    const top=r.top-t.height-16>=bounds.top+12?r.top-t.height-16:r.bottom+16;
    const origin=parent===document.body?{x:-scrollX,y:-scrollY}:{x:bounds.left+parent.clientLeft-parent.scrollLeft,y:bounds.top+parent.clientTop-parent.scrollTop};
    tip.style.left=(left-origin.x)+'px';tip.style.top=(Math.max(bounds.top+12,Math.min(bounds.bottom-t.height-12,top))-origin.y)+'px';
  }
  document.addEventListener('pointerover', event => showTip(event.target));
  document.addEventListener('focusin', event => showTip(event.target));
  document.addEventListener('pointerout', event => { if (event.pointerType!=='touch' && anchor && anchor.contains(event.target) && !anchor.contains(event.relatedTarget)) hideTip(); });
  document.addEventListener('focusout', event => { if (anchor && !anchor.contains(event.relatedTarget)) hideTip(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hideTip(); });
  document.addEventListener('pointerdown', event=>{if(event.target.closest?.('[data-report-tooltip]'))showTip(event.target);else hideTip();});
  document.addEventListener('scroll', hideTip, true);
})();
