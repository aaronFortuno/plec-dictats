/* T007: connexió de la pantalla de dictat. Eines pures + DOM, sense framework. */
(function (root, factory) {
  var api = factory(typeof module === "object" && module.exports ? require('./audio-manifest.js') : root.PlecAudioManifest, typeof module === "object" && module.exports ? require('./audio-varieties.js') : root.PlecAudioVarieties);
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.PlecDictationTools = api;
  }
  if (typeof document !== "undefined" && document.currentScript) {
    api.initDom(root);
  }
}(typeof self !== "undefined" ? self : globalThis, function (manifestTools, varieties) {
  "use strict";

  /* ---------- Eines pures ---------- */

  function instructionText(count) {
    if ([8, 12, 16, 20, 24].indexOf(count) === -1) throw new Error("Nombre de paraules no admès per a les instruccions.");
    return "Aquest dictat consisteix en " + count + " paraules. Pots sentir cada paraula tres vegades. " +
      "Prem el botó per escoltar-la i escriu-la al full. Després de la tercera escolta podràs passar a la següent. " +
      "En acabat, desplega el full per corregir-les.";
  }

  function resolveSelection(S, editions, code, language, catalogue) {
    var result = S.resolve(editions, code);
    if (result.language !== language) {
      throw new Error("La llengua del codi no coincideix amb la de la pàgina.");
    }
    if (catalogue && catalogue !== result.catalogue) {
      throw new Error("El catàleg sol·licitat no coincideix amb el del codi.");
    }
    return result;
  }

  var coverage = manifestTools.coverage;

  /* ---------- DOM ---------- */

  function initDom(root) {
    var doc = root.document;
    var appBase = new URL("./", doc.currentScript.src);
    var qs = new URLSearchParams(root.location.search);
    var $ = function (id) { return doc.getElementById(id); };
    var lang = (root.PlecLanguage && root.PlecLanguage.id) || "ca";
    var scenes = ["setup-panel", "ready-panel", "player-panel", "pause-panel", "finished-panel"];
    var state = {
      selection: null, cov: null, session: null, audio: null, epoch: 0,
      strictFocus: true, generation: 0, manifestPromise: null,
      introUrl: null, introAudio: null, introEpoch: 0,
      variety: null, activeSince: null, activeElapsed: 0
    };
    function track(name, data) { root.PlecAnalytics?.track(name, data); }
    function now() { return root.performance?.now() ?? Date.now(); }
    function startClock() { if (state.activeSince === null) state.activeSince = now(); }
    function pauseClock() { if (state.activeSince !== null) { state.activeElapsed += Math.max(0, now() - state.activeSince); state.activeSince = null; } }
    function metrics() { return { mode: state.selection.recipe.mode, count: state.selection.entries.length, variety: state.variety }; }

    function isLoopback(h) { return h === "127.0.0.1" || h === "localhost" || h === "[::1]"; }

    function manifestUrl() {
      if (qs.get("preview") === "local") {
        if (!isLoopback(root.location.hostname)) {
          throw new Error("La vista prèvia local només és disponible en aquest ordinador.");
        }
        return new URL("output/audio/player-preview-manifest.json", appBase);
      }
      return new URL("audio/manifest.json", appBase);
    }

    function fetchManifest() {
      if (!state.manifestPromise) {
        state.manifestPromise = root.fetch(manifestUrl()).then(function (r) {
          if (!r.ok) throw new Error("No s'ha pogut carregar el manifest d'àudio.");
          return r.json();
        });
      }
      return state.manifestPromise;
    }

    function stopAudio() {
      state.epoch++;
      var a = state.audio;
      if (a) {
        a.onended = a.onerror = null;
        try { a.pause(); } catch (e) {}
        a.removeAttribute("src");
        state.audio = null;
      }
    }

    function stopIntro() {
      state.introEpoch++;
      if (state.introAudio) {
        state.introAudio.onended = state.introAudio.onerror = null;
        try { state.introAudio.pause(); state.introAudio.removeAttribute("src"); } catch (e) {}
        state.introAudio = null;
      }
      $("instruction-label").textContent = "Escolta les instruccions";
      $("instruction-status").textContent = "";
    }

    function loadIntro(gen, count) {
      var local = qs.get("preview") === "local" && isLoopback(root.location.hostname);
      var url = new URL(local ? "output/audio/instructions-preview-manifest.json" : "audio/instructions/manifest.json", appBase);
      root.fetch(url).then(function (r) {
        if (!r.ok) throw new Error("pending");
        return r.json();
      }).then(function (m) {
        if (gen !== state.generation) return;
        var cov = coverage(m, [{ id: "instruction-paper-" + count }], lang, appBase);
        if (!cov.ready || cov.pack.textVersion !== 1) throw new Error("pending");
        state.introUrl = cov.urls[0];
        $("read-instructions").disabled = false;
        $("instruction-status").textContent = "";
      }).catch(function () {
        if (gen !== state.generation) return;
        $("instruction-status").textContent = "La locució de les instruccions s’està preparant. Pots llegir-les i començar.";
      });
    }

    function show(id) {
      doc.querySelectorAll('[data-theme-control]').forEach(function (control) { control.hidden = id === 'player-panel' || id === 'pause-panel'; });
      scenes.forEach(function (s) {
        var el = $(s);
        if (el) el.hidden = s !== id;
      });
      var exit = $("exit-focus");
      if (exit) exit.hidden = id === "setup-panel";
      var el = $(id);
      if (el && el.animate) {
        el.animate([{ opacity: 0, transform: "translateY(8px)" },
                    { opacity: 1, transform: "translateY(0)" }], { duration: 220 });
      }
      var target = el && (el.querySelector("h1") || el.querySelector("button:not([hidden])"));
      if (target) {
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus();
      }
    }

    function setError(msg) { $("setup-error").textContent = msg || ""; $("setup-error").hidden = !msg; }

    function resetToSetup() {
      state.generation++;
      stopAudio(); stopIntro();
      state.introUrl = null;
      $("read-instructions").disabled = true;
      state.session = null; state.selection = null; state.cov = null;
      state.activeSince = null; state.activeElapsed = 0; state.variety = null;
      $("start-dictation").disabled = true;
      for (var id of ["windowed-start", "fullscreen-note", "resume-windowed", "resume-note"]) $(id).hidden = true;
      setError("");
      show("setup-panel");
    }

    function load(code, catalogue) {
      resetToSetup();
      var gen = state.generation;
      var sel;
      try {
        sel = resolveSelection(root.PlecSeeds, root.PlecSeedRegistry.editions, code, lang, catalogue || null);
      } catch (e) {
        setError(e.message || "Codi no vàlid.");
        return;
      }
      state.selection = sel;
      Promise.resolve().then(fetchManifest).then(function (m) {
        if (gen !== state.generation) return;
        var cov;
        try {
          var pronunciation = varieties.select(m, lang, {variety:qs.get("variety"),voice:qs.get("voice")});
          cov = coverage(m, sel.entries, lang, appBase, pronunciation.pack.id);
          $("dictation-variety").textContent = pronunciation.variety.label;
          state.variety = pronunciation.variety.id;
        } catch (e) {
          state.selection = null; setError(e.message); show("setup-panel"); return;
        }
        state.cov = cov;
        $("session-summary").textContent =
          "Codi " + sel.code + " · " + sel.entries.length + " paraules";
        $("instructions").textContent = instructionText(sel.entries.length);
        loadIntro(gen, sel.entries.length);
        var note = $("local-preview-note");
        if (note) note.hidden = qs.get("preview") !== "local";
        var start = $("start-dictation");
        var status = $("audio-status");
        if (cov.ready) {
          status.textContent = "Àudios preparats.";
          start.disabled = false;
        } else if (cov.pack.status !== "ready") {
          status.textContent = "Els àudios encara s'estan preparant. Torna-ho a provar més tard.";
          start.disabled = true;
        } else {
          status.textContent = "Falten " + cov.missing + " àudios. No es pot començar encara.";
          start.disabled = true;
        }
        var url = new URL(root.location.href);
        url.searchParams.set("seed", root.PlecSeeds.normalize ? root.PlecSeeds.normalize(sel.code) : sel.code);
        if (sel.catalogue) url.searchParams.set("catalogue", sel.catalogue);
        url.searchParams.set("variety", pronunciation.variety.id);
        qs.set("variety", pronunciation.variety.id);
        root.history.replaceState(null, "", url);
        show("ready-panel");
      }).catch(function (e) {
        if (gen !== state.generation) return;
        state.manifestPromise = null;
        track('technical-error', {kind: 'audio'});
        state.selection = null;
        setError("No s'han pogut carregar els àudios. Torna-ho a provar.");
        show("setup-panel");
      });
    }

    $("instructions").textContent = "";

    $("read-instructions").addEventListener("click", function () {
      if (!state.introUrl || state.session) return;
      if (state.introAudio) { stopIntro(); return; }
      stopIntro();
      var epoch = state.introEpoch, a = null;
      var st = $("instruction-status");
      function finish(ok) {
        if (epoch !== state.introEpoch || state.introAudio !== a) return;
        stopIntro();
        if (!ok) st.textContent = "No s’han pogut reproduir les instruccions. Pots tornar-ho a provar.";
      }
      try {
        a = new root.Audio(state.introUrl); state.introAudio = a;
        a.onended = function () { finish(true); };
        a.onerror = function () { finish(false); };
        $("instruction-label").textContent = "Atura les instruccions";
        st.textContent = "S’estan llegint les instruccions…";
        var p = a.play();
        if (p && p.catch) p.catch(function () { finish(false); });
      } catch (e) { finish(false); }
    });

    function enterFullscreen() {
      var el = $("focus-root");
      try { if (el && el.requestFullscreen && doc.fullscreenEnabled !== false) {
        return Promise.resolve(el.requestFullscreen()).then(function () { return true; }, function () { return false; });
      } } catch (e) { return Promise.resolve(false); }
      return Promise.resolve(false);
    }

    function leaveFullscreen() {
      try { if (doc.fullscreenElement && doc.exitFullscreen) Promise.resolve(doc.exitFullscreen()).catch(function () {}); } catch (e) {}
    }

    function beginSession() {
      if (!state.selection || !state.cov || !state.cov.ready || state.session) return;
      stopIntro(); stopAudio();
      state.session = root.PlecDictationSession.createSession(state.selection.entries.length);
      state.session.start();
      startClock();
      track('dictation-started', metrics());
      renderPlayer();
      show("player-panel");
      if (doc.visibilityState === "hidden") pauseIfActive();
    }

    $("start-dictation").addEventListener("click", function () {
      if (!state.cov || !state.cov.ready) return;
      var generation = state.generation, selection = state.selection;
      $("start-dictation").disabled = true;
      state.strictFocus = true;
      enterFullscreen().then(function (ok) {
        if (generation !== state.generation || selection !== state.selection || !state.cov || !state.cov.ready || state.session) return;
        $("start-dictation").disabled = false;
        if (ok) {
          beginSession();
        } else {
          $("fullscreen-note").textContent = "Aquest navegador no ha pogut obrir la pantalla completa. Pots continuar en mode concentració.";
          $("fullscreen-note").hidden = false;
          $("windowed-start").hidden = false;
        }
      });
    });

    $("windowed-start").addEventListener("click", function () {
      if (!state.selection || !state.cov || !state.cov.ready) return;
      state.strictFocus = false;
      beginSession();
    });

    function renderPlayer() {
      var s = state.session.snapshot();
      $("word-progress").textContent = "Paraula " + (s.index + 1) + " de " + s.total;
      doc.querySelectorAll('[data-word-number]').forEach(function (el) { el.textContent = s.index + 1; });
      doc.querySelectorAll('[data-word-total]').forEach(function (el) { el.textContent = 'de ' + s.total; });
      $("listen-count").textContent = s.plays + " de 3 escoltes";
      var btn = $("listen-word"), label = $("listen-label"), next = $("next-word");
      $("playback-error").hidden = true;
      if (s.plays >= 3) {
        btn.hidden = true; next.hidden = false;
        $("next-label").textContent = s.index === s.total - 1 ? "Acaba el dictat" : "Paraula següent";
      } else {
        btn.hidden = false; next.hidden = true;
        btn.disabled = s.playing;
        label.textContent = s.playing ? "Escoltant…" : (s.plays === 0 ? "Escolta" : "Torna a escoltar");
      }
    }

    $("listen-word").addEventListener("click", function () {
      var session = state.session;
      if (!session) return;
      var token = session.beginPlay();
      if (token === null) return;
      var epoch = state.epoch;
      var idx = session.snapshot().index;
      var url = state.cov.urls[idx];
      var a = null, settled = false, hadFocus = doc.activeElement === $("listen-word");
      function finish(success) {
        if (settled) return;
        settled = true;
        if (state.session !== session || state.epoch !== epoch) return;
        if (a) {
          a.onended = a.onerror = null;
          try { a.pause(); a.removeAttribute("src"); } catch (e) {}
        }
        state.audio = null;
        session.finishPlay(token, success);
        renderPlayer();
        if (!success) {
          track('technical-error', {kind: 'audio'});
          $("playback-error").textContent = "No s'ha pogut reproduir la paraula. Torna-ho a provar; aquesta escolta no compta.";
          $("playback-error").hidden = false;
        }
        if (hadFocus && session.snapshot().canNext) $("next-word").focus();
      }
      try {
        a = new root.Audio(url); state.audio = a;
        a.playbackRate = $("audio-rate").value === "0.85" ? 0.85 : 1;
        a.preservesPitch = true;
        a.onended = function () { finish(true); };
        a.onerror = function () { finish(false); };
        renderPlayer();
        var p = a.play();
        if (p && p.catch) p.catch(function () { finish(false); });
      } catch (e) { finish(false); }
    });

    $("next-word").addEventListener("click", function () {
      if (!state.session || !state.session.snapshot().canNext) return;
      stopAudio();
      var s = state.session.next();
      if (s.finished) {
        pauseClock();
        var minutes = state.activeElapsed / 60000;
        track('dictation-completed', { ...metrics(), duration_bucket: minutes < 5 ? 'lt5' : minutes < 10 ? '5to10' : minutes < 20 ? '10to20' : 'gt20' });
        leaveFullscreen();
        show("finished-panel");
      } else {
        renderPlayer();
        show("player-panel");
      }
    });

    function pauseIfActive() {
      var session = state.session;
      if (!session) return;
      var s = session.snapshot();
      if (!s.started || s.finished || s.paused) return;
      stopAudio();
      session.pause();
      pauseClock();
      $("resume-note").hidden = true;
      $("resume-windowed").hidden = true;
      show("pause-panel");
    }

    doc.addEventListener("fullscreenchange", function () {
      if (state.strictFocus && doc.fullscreenElement !== $("focus-root")) pauseIfActive();
    });
    doc.addEventListener("visibilitychange", function () {
      if (doc.visibilityState === "hidden") { pauseIfActive(); stopIntro(); }
    });
    root.addEventListener("pagehide", function () { pauseIfActive(); stopAudio(); stopIntro(); });

    $("resume-dictation").addEventListener("click", function () {
      var session = state.session;
      if (!session || !session.snapshot().paused || doc.visibilityState === "hidden") return;
      var generation = state.generation;
      if (!state.strictFocus) { session.resume(); startClock(); renderPlayer(); show("player-panel"); return; }
      enterFullscreen().then(function (ok) {
        if (state.session !== session || generation !== state.generation || !session.snapshot().paused || doc.visibilityState === "hidden") return;
        if (ok) { session.resume(); startClock(); renderPlayer(); show("player-panel"); }
        else { $("resume-note").textContent = "La pantalla completa no està disponible. Pots continuar en mode concentració."; $("resume-note").hidden = false; $("resume-windowed").hidden = false; }
      });
    });

    $("resume-windowed").addEventListener("click", function () {
      if (!state.session || !state.session.snapshot().paused || doc.visibilityState === "hidden") return;
      state.strictFocus = false;
      state.session.resume();
      startClock();
      renderPlayer();
      show("player-panel");
    });

    $("exit-focus").addEventListener("click", function () {
      resetToSetup();
      leaveFullscreen();
    });

    $("restart-code").addEventListener("click", function () {
      if (!state.selection) { resetToSetup(); return; }
      var code = state.selection.code, cat = state.selection.catalogue;
      stopAudio(); stopIntro();
      state.session = null;
      load(code, cat);
    });

    $("load-form").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var code = $("student-code").value.trim();
      if (code) load(code, null);
    });

    /* Arrencada */
    var seed = qs.get("seed");
    if (seed) {
      $("student-code").value = seed;
      load(seed, qs.get("catalogue") || null);
    } else {
      show("setup-panel");
    }
  }

  return {
    instructionText: instructionText,
    resolveSelection: resolveSelection,
    coverage: coverage,
    initDom: initDom
  };
}));
