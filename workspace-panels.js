/* T008 · Responsive drawers only — calaixos laterals <=1199px */
(function () {
  'use strict';

  var MQ = window.matchMedia('(max-width: 1199px)');
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  var els = {};
  var state = { open: null, opener: null, built: false };

  function icon(name, fallback) {
    if (typeof window.PlecIcons === 'function') {
      try {
        var out = window.PlecIcons(name);
        if (out) return out;
      } catch (e) { /* ignora */ }
    }
    return fallback;
  }

  function ensureId(el, id) {
    if (!el.id) el.id = id;
    return el.id;
  }

  function makeButton(cls, label, iconName, iconFallback) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.setAttribute('aria-expanded', 'false');
    var ic = icon(iconName, iconFallback);
    if (ic && ic.charAt(0) === '<') {
      b.innerHTML = ic + '<span></span>';
      b.querySelector('span').textContent = label;
    } else {
      b.textContent = (ic ? ic + ' ' : '') + label;
    }
    return b;
  }

  function build() {
    if (state.built) return;
    var main = document.querySelector('main.app-main');
    var ws = document.querySelector('section.workspace.seed-workspace');
    if (!main || !ws) return;

    var config = ws.querySelector('aside.config.card');
    var manage = ws.querySelector('aside.management.card');
    var preview = ws.querySelector('.preview-column');
    if (!config || !manage || !preview) return;

    state.built = true;
    els = { main: main, ws: ws, config: config, manage: manage, preview: preview };

    var cfgId = ensureId(config, 'workspace-drawer-config');
    var mngId = ensureId(manage, 'workspace-drawer-management');

    // Barra d'eines pròpia (fila de 38px via CSS)
    var bar = document.createElement('div');
    bar.className = 'workspace-toolbar';

    var tCfg = makeButton('workspace-drawer-toggle toggle-config', 'Filtres', 'book-open', '\u25C0');
    tCfg.setAttribute('aria-controls', cfgId);
    tCfg.id = 'workspace-toggle-config';

    var tMng = makeButton('workspace-drawer-toggle toggle-management', 'El teu dictat', 'download', '\u25B6');
    tMng.setAttribute('aria-controls', mngId);
    tMng.id = 'workspace-toggle-management';

    bar.appendChild(tCfg);
    bar.appendChild(tMng);
    main.insertBefore(bar, main.firstChild);

    // Botons de tancament dins de cada calaix
    ['config', 'manage'].forEach(function (which) {
      var panel = els[which];
      var close = makeButton('workspace-drawer-close', 'Tanca', 'x', '\u00D7');
      close.setAttribute('aria-label', 'Tanca el panell');
      close.dataset.drawer = which;
      panel.insertBefore(close, panel.firstChild);
      panel.addEventListener('click', function (ev) {
        if (ev.target.closest('.workspace-drawer-close')) closeDrawer(which);
      });
    });

    // Teló de fons (només cobreix l'àrea central del workspace)
    var bd = document.createElement('div');
    bd.className = 'workspace-backdrop';
    bd.setAttribute('aria-hidden', 'true');
    ws.appendChild(bd);
    bd.addEventListener('click', function () { closeDrawer(state.open); });

    els.toolbar = bar;
    els.toggles = { config: tCfg, manage: tMng };
    els.backdrop = bd;

    tCfg.addEventListener('click', function () { toggleDrawer('config'); });
    tMng.addEventListener('click', function () { toggleDrawer('manage'); });

    document.addEventListener('keydown', onKeydown);
    els.ws.addEventListener('keydown', confineFocus);

    syncMode();
  }

  function setInert(el, on) {
    if (!el) return;
    if ('inert' in el) el.inert = on;
    if (on) el.setAttribute('aria-hidden', 'true');
    else el.removeAttribute('aria-hidden');
  }

  function openDrawer(which) {
    if (state.open === which) return;
    if (state.open) closeDrawer(state.open, true);

    var panel = els[which];
    var other = which === 'config' ? 'manage' : 'config';
    var toggle = els.toggles[which];

    panel.classList.add('drawer-open');
    setInert(panel, false);
    toggle.setAttribute('aria-expanded', 'true');

    setInert(els[other], true);
    setInert(els.preview, true);
    els.backdrop.classList.add('backdrop-visible');
    els.backdrop.setAttribute('aria-hidden', 'false');

    state.open = which;
    state.opener = toggle;

    var first = panel.querySelector(FOCUSABLE);
    if (first) first.focus();
  }

  function closeDrawer(which, silent) {
    if (!which || state.open !== which) return;
    var panel = els[which];
    var toggle = els.toggles[which];

    panel.classList.remove('drawer-open');
    setInert(panel, true);
    toggle.setAttribute('aria-expanded', 'false');

    setInert(els.preview, false);
    els.backdrop.classList.remove('backdrop-visible');
    els.backdrop.setAttribute('aria-hidden', 'true');

    state.open = null;
    if (!silent && state.opener) state.opener.focus();
    state.opener = null;
  }

  function toggleDrawer(which) {
    if (state.open === which) closeDrawer(which);
    else openDrawer(which);
  }

  function onKeydown(ev) {
    if (ev.key === 'Escape' && state.open && !document.querySelector('dialog[open]')) {
      ev.preventDefault();
      closeDrawer(state.open);
    }
  }

  // Confinament de focus dins del calaix obert (Tab/Shift+Tab)
  function confineFocus(ev) {
    if (!state.open || ev.key !== 'Tab' || document.querySelector('dialog[open]')) return;
    var panel = els[state.open];
    if (!panel.contains(document.activeElement)) return;
    var items = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(function(el){return el.getClientRects().length && !el.closest('[hidden]');});
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (ev.shiftKey && document.activeElement === first) {
      ev.preventDefault();
      last.focus();
    } else if (!ev.shiftKey && document.activeElement === last) {
      ev.preventDefault();
      first.focus();
    }
  }

  function syncMode() {
    if (!state.built) return;
    if (MQ.matches) {
      // Mode estret: calaixos ocults i no tabulables per defecte
      if (state.open) closeDrawer(state.open, true);
      setInert(els.config, state.open !== 'config');
      setInert(els.manage, state.open !== 'manage');
    } else {
      // Mode ample: panells restaurats, res inert
      if (state.open) closeDrawer(state.open, true);
      setInert(els.config, false);
      setInert(els.manage, false);
      setInert(els.preview, false);
    }
  }

  function init() {
    build();
    if (MQ.addEventListener) MQ.addEventListener('change', syncMode);
    else if (MQ.addListener) MQ.addListener(syncMode);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
