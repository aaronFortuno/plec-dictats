/* T005: estat d'una sessió de dictat oral, sense DOM ni àudio. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.PlecDictationSession = factory();
  }
}(typeof self !== "undefined" ? self : globalThis, function () {
  "use strict";

  var MAX_PLAYS = 3;

  function createSession(total) {
    if (!Number.isInteger(total) || total < 1 || total > 100) {
      throw new RangeError("total ha de ser un enter entre 1 i 100");
    }

    var state = {
      total: total,
      index: 0,
      plays: 0,
      playing: false,
      paused: false,
      started: false,
      finished: false,
      activeToken: 0,
      tokenCounter: 0
    };

    function canPlay() {
      return state.started && !state.finished && !state.paused &&
        !state.playing && state.plays < MAX_PLAYS;
    }

    function canNext() {
      return state.started && !state.finished && !state.paused &&
        !state.playing && state.plays === MAX_PLAYS;
    }

    function snapshot() {
      return {
        total: state.total,
        index: state.index,
        plays: state.plays,
        playing: state.playing,
        paused: state.paused,
        started: state.started,
        finished: state.finished,
        canPlay: canPlay(),
        canNext: canNext()
      };
    }

    function start() {
      if (!state.started) {
        state.started = true;
      }
      return snapshot();
    }

    function beginPlay() {
      if (!canPlay()) {
        return null;
      }
      state.tokenCounter += 1;
      state.activeToken = state.tokenCounter;
      state.playing = true;
      return state.activeToken;
    }

    function finishPlay(token, success) {
      if (state.playing && token === state.activeToken) {
        state.playing = false;
        state.activeToken = 0;
        if (success === true && state.plays < MAX_PLAYS) {
          state.plays += 1;
        }
      }
      return snapshot();
    }

    function next() {
      if (canNext()) {
        if (state.index < state.total - 1) {
          state.index += 1;
          state.plays = 0;
        } else {
          state.finished = true;
        }
      }
      return snapshot();
    }

    function pause() {
      if (state.started && !state.finished) {
        state.paused = true;
        state.playing = false;
        state.activeToken = 0;
      }
      return snapshot();
    }

    function resume() {
      if (state.started && !state.finished) {
        state.paused = false;
      }
      return snapshot();
    }

    function reset() {
      state.index = 0;
      state.plays = 0;
      state.playing = false;
      state.paused = false;
      state.started = false;
      state.finished = false;
      state.activeToken = 0;
      return snapshot();
    }

    return {
      snapshot: snapshot,
      start: start,
      beginPlay: beginPlay,
      finishPlay: finishPlay,
      next: next,
      pause: pause,
      resume: resume,
      reset: reset
    };
  }

  return { createSession: createSession };
}));
