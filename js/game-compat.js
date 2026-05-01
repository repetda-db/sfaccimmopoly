'use strict';

/* ══════════════════════════════════════════
   ADAPTER / COMPATIBILITY LAYER
   Bridges mismatched names between modules
   ══════════════════════════════════════════ */

/* ── BoardData wrapper ──────────────────────
   Se board-data.js espone solo BOARD_DATA array
────────────────────────────────────────── */
if (typeof BoardData === 'undefined' && typeof BOARD_DATA !== 'undefined') {
  window.BoardData = {
    cells: BOARD_DATA,
    getPropertyById: function(id) {
      return this.cells.find(c => c.id === id || c.index === id);
    },
    getSquare: function(index) {
      return this.cells.find(c => c.index === index);
    }
  };
}

/* ── UI alias wrappers ────────────────────── */
if (typeof UI !== 'undefined') {
  UI.updatePlayerPanel = function(p) { return UI.updatePlayerCard(p); };
  UI.movePawn          = function(p) { return UI.moveToken(p); };
  UI.showAlert         = function(m, cb) { return UI.alert(m, cb); };
  UI.updateSquareHouses = function(idxOrSq, h, hotel) {
    if (typeof idxOrSq === 'object') {
      return UI.markHouses(idxOrSq.index, idxOrSq.houses, idxOrSq.hotel);
    }
    return UI.markHouses(idxOrSq, h, hotel);
  };
  UI.enableRollButton  = function() { UI.setButtonState({ roll: true }); };
  UI.disableRollButton = function() { UI.setButtonState({ roll: false }); };
  UI.addBettorPanel    = function() { /* stub per betting-mode */ };
  UI.removeBettorPanel = function() { /* stub per betting-mode */ };
}

/* ── Globals usati da game-core / quick-mode ─ */
if (typeof GameState === 'undefined') window.GameState = {};

if (typeof addLog === 'undefined') {
  window.addLog = function(msg) {
    if (typeof UI !== 'undefined' && UI.addLog) {
      UI.addLog({ msg: msg, type: 'info', ts: Date.now() });
    } else {
      console.log('[LOG]', msg);
    }
  };
}

if (typeof getBoardSquares === 'undefined' && typeof BoardData !== 'undefined') {
  window.getBoardSquares = function() { return BoardData.cells; };
}

if (typeof handleLanding === 'undefined') window.handleLanding = function(player) {
  console.warn('handleLanding stub', player);
};

/* ── Translations shortcut ─────────────────── */
if (typeof t === 'undefined' && typeof Translations !== 'undefined') {
  window.t = function(key, params) { return Translations.translate(key, params); };
}

/* ── Bootstrap phase toggles ───────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const btnStart = document.getElementById('btn-start-game');
  const phaseWait = document.getElementById('phase-waiting');
  const phaseGame = document.getElementById('phase-game');

  if (btnStart && phaseWait && phaseGame) {
    // Mostra bottone start se sei host (logica base)
    // In produzione dovresti controllare Sync.isHost()
    btnStart.classList.remove('hidden');

    btnStart.addEventListener('click', () => {
      phaseWait.classList.add('hidden');
      phaseGame.classList.remove('hidden');
      if (typeof Sync !== 'undefined' && Sync.setStatus) {
        Sync.setStatus('playing');
      }
    });
  }

  // Se la stanza è già in status 'playing', mostra subito il game
  // (puoi fare un check su Firebase qui)
});
