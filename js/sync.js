'use strict';

/* ============================================
   SFACCIMMOPOLY — SYNC
   Firebase Realtime Database wrapper
   Handles all multiplayer state sync
   ============================================ */

const Sync = (() => {

  /* ── Firebase refs ─────────────────────── */
  let db        = null;
  let gameRef   = null;
  let gameCode  = null;
  let myId      = null;
  let listeners = [];

  /* ══════════════════════════════════════════
     INIT
  ══════════════════════════════════════════ */
  function init() {
    if (typeof firebase === 'undefined') {
      console.error('[Sync] Firebase SDK not loaded.');
      return false;
    }
    db = firebase.database();
    return true;
  }

  /* ══════════════════════════════════════════
     HELPERS
  ══════════════════════════════════════════ */
  function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function gamesPath(code) { return `games/${code}`; }

  function _off() {
    listeners.forEach(({ ref, event, fn }) => ref.off(event, fn));
    listeners = [];
  }

  function _on(ref, event, fn) {
    ref.on(event, fn);
    listeners.push({ ref, event, fn });
  }

  /* ══════════════════════════════════════════
     CREATE GAME
  ══════════════════════════════════════════ */
  async function createGame(hostName, mode, options = {}) {
    if (!db) throw new Error('Sync not initialized');

    let code;
    let attempts = 0;

    /* find unused code */
    while (attempts < 10) {
      code = generateCode();
      const snap = await db.ref(gamesPath(code)).once('value');
      if (!snap.exists()) break;
      attempts++;
    }

    myId = generateId();

    const now = Date.now();

    const hostPlayer = {
      id:       myId,
      name:     hostName,
      position: 0,
      money:    GameConfig.STARTING_MONEY,
      color:    GameConfig.PLAYER_COLORS[0],
      token:    GameConfig.PLAYER_TOKENS[0],
      isHost:   true,
      inJail:   false,
      jailTurns: 0,
      isBankrupt: false,
      isBetting:  false,
      chips:    0,
      properties: [],
      getOutCards: 0,
      joinedAt: now,
    };

    const initialState = {
      code,
      mode,
      options: {
        startingMoney:   options.startingMoney   || GameConfig.STARTING_MONEY,
        goSalary:        options.goSalary        || GameConfig.GO_SALARY,
        jailFine:        options.jailFine        || GameConfig.JAIL_FINE,
        auctionEnabled:  options.auctionEnabled  !== false,
        timeLimit:       options.timeLimit       || 0,
        bettingChips:    options.bettingChips    || GameConfig.BETTING_REENTRY_CHIPS,
        reentryChips:    options.reentryChips    || GameConfig.BETTING_REENTRY_CHIPS,
      },
      status:        'lobby',      // lobby | rolling | playing | ended
      players:       { [myId]: hostPlayer },
      currentPlayer: null,
      turnOrder:     [],
      turnIndex:     0,
      properties:    {},           // propertyId → { owner, houses, mortgaged }
      bank: {
        houses: GameConfig.MAX_HOUSES_BANK,
        hotels: GameConfig.MAX_HOTELS_BANK,
      },
      chanceDeck:    [],
      communityDeck: [],
      log:           [],
      createdAt:     now,
      updatedAt:     now,
    };

    gameRef = db.ref(gamesPath(code));
    await gameRef.set(initialState);

    gameCode = code;

    /* store local identity */
    _saveLocal(code, myId);

    return { code, myId };
  }

  /* ══════════════════════════════════════════
     JOIN GAME
  ══════════════════════════════════════════ */
  async function joinGame(code, playerName) {
    if (!db) throw new Error('Sync not initialized');

    code = code.toUpperCase().trim();
    const ref = db.ref(gamesPath(code));
    const snap = await ref.once('value');

    if (!snap.exists())            throw new Error(t('err_invalid_code'));

    const state = snap.val();
    if (state.status !== 'lobby') throw new Error(t('err_game_started'));

    const playerCount = Object.keys(state.players || {}).length;
    if (playerCount >= GameConfig.MAX_PLAYERS) throw new Error(t('err_game_full'));

    myId = generateId();
    const now = Date.now();

    const colorIndex = playerCount % GameConfig.PLAYER_COLORS.length;
    const tokenIndex = playerCount % GameConfig.PLAYER_TOKENS.length;

    const newPlayer = {
      id:          myId,
      name:        playerName,
      position:    0,
      money:       state.options.startingMoney,
      color:       GameConfig.PLAYER_COLORS[colorIndex],
      token:       GameConfig.PLAYER_TOKENS[tokenIndex],
      isHost:      false,
      inJail:      false,
      jailTurns:   0,
      isBankrupt:  false,
      isBetting:   false,
      chips:       0,
      properties:  [],
      getOutCards: 0,
      joinedAt:    now,
    };

    await ref.child(`players/${myId}`).set(newPlayer);
    await ref.child('updatedAt').set(now);

    gameRef  = ref;
    gameCode = code;

    _saveLocal(code, myId);

    return { code, myId, state };
  }

  /* ══════════════════════════════════════════
     REJOIN (after refresh)
  ══════════════════════════════════════════ */
  async function rejoin() {
    if (!db) return null;
    const local = _loadLocal();
    if (!local) return null;

    const { code, id } = local;
    const ref  = db.ref(gamesPath(code));
    const snap = await ref.once('value');

    if (!snap.exists()) { _clearLocal(); return null; }

    const state = snap.val();
    if (!state.players || !state.players[id]) { _clearLocal(); return null; }
    if (state.status === 'ended') { _clearLocal(); return null; }

    gameRef  = ref;
    gameCode = code;
    myId     = id;

    return { code, myId, state };
  }

  /* ══════════════════════════════════════════
     LISTENERS
  ══════════════════════════════════════════ */
  function onGameState(callback) {
    if (!gameRef) return;
    _on(gameRef, 'value', snap => {
      if (snap.exists()) callback(snap.val());
    });
  }

  function onPlayerChanged(callback) {
    if (!gameRef) return;
    const ref = gameRef.child('players');
    _on(ref, 'child_changed', snap => callback(snap.key, snap.val()));
  }

  function onPlayerAdded(callback) {
    if (!gameRef) return;
    const ref = gameRef.child('players');
    _on(ref, 'child_added', snap => callback(snap.key, snap.val()));
  }

  function onPlayerRemoved(callback) {
    if (!gameRef) return;
    const ref = gameRef.child('players');
    _on(ref, 'child_removed', snap => callback(snap.key));
  }

  function onLog(callback) {
    if (!gameRef) return;
    const ref = gameRef.child('log');
    _on(ref, 'child_added', snap => callback(snap.val()));
  }

  function offAll() { _off(); }

  /* ══════════════════════════════════════════
     WRITE HELPERS
  ══════════════════════════════════════════ */

  /* generic update on game root */
  async function update(data) {
    if (!gameRef) return;
    data.updatedAt = Date.now();
    return gameRef.update(data);
  }

  /* update a single player */
  async function updatePlayer(id, data) {
    if (!gameRef) return;
    return gameRef.child(`players/${id}`).update(data);
  }

  /* update a property */
  async function updateProperty(propId, data) {
    if (!gameRef) return;
    return gameRef.child(`properties/${propId}`).update(data);
  }

  /* push a log entry */
  async function pushLog(entry) {
    if (!gameRef) return;
    return gameRef.child('log').push({
      ...entry,
      ts: Date.now(),
    });
  }

  /* atomic transaction (e.g. money transfer) */
  async function transaction(path, fn) {
    if (!gameRef) return;
    return gameRef.child(path).transaction(fn);
  }

  /* ── Game status ────────────────────────── */
  async function setStatus(status) {
    return update({ status });
  }

  /* ── Turn order ─────────────────────────── */
  async function setTurnOrder(order) {
    return update({ turnOrder: order, currentPlayer: order[0], turnIndex: 0 });
  }

  /* ── Advance turn ───────────────────────── */
  async function nextTurn(turnIndex, nextPlayerId) {
    return update({ turnIndex, currentPlayer: nextPlayerId });
  }

  /* ── Bank ───────────────────────────────── */
  async function updateBank(data) {
    if (!gameRef) return;
    return gameRef.child('bank').update(data);
  }

  /* ── Decks ──────────────────────────────── */
  async function setDecks(chanceDeck, communityDeck) {
    return update({ chanceDeck, communityDeck });
  }

  async function updateDeck(type, deck) {
    const key = type === 'chance' ? 'chanceDeck' : 'communityDeck';
    return gameRef.child(key).set(deck);
  }

  /* ── Trade ──────────────────────────────── */
  async function proposeTrade(tradeData) {
    if (!gameRef) return;
    return gameRef.child('pendingTrade').set({
      ...tradeData,
      status: 'pending',
      ts: Date.now(),
    });
  }

  async function respondTrade(accepted) {
    if (!gameRef) return;
    return gameRef.child('pendingTrade/status').set(accepted ? 'accepted' : 'rejected');
  }

  async function clearTrade() {
    if (!gameRef) return;
    return gameRef.child('pendingTrade').remove();
  }

  function onTrade(callback) {
    if (!gameRef) return;
    _on(gameRef.child('pendingTrade'), 'value', snap => {
      callback(snap.exists() ? snap.val() : null);
    });
  }

  /* ── Auction ────────────────────────────── */
  async function startAuction(auctionData) {
    if (!gameRef) return;
    return gameRef.child('auction').set({
      ...auctionData,
      status: 'open',
      ts: Date.now(),
    });
  }

  async function placeBid(playerId, amount) {
    if (!gameRef) return;
    return gameRef.child('auction').update({ highBidder: playerId, highBid: amount });
  }

  async function endAuction() {
    if (!gameRef) return;
    return gameRef.child('auction').remove();
  }

  function onAuction(callback) {
    if (!gameRef) return;
    _on(gameRef.child('auction'), 'value', snap => {
      callback(snap.exists() ? snap.val() : null);
    });
  }

  /* ── Betting ────────────────────────────── */
  async function placeBet(playerId, betData) {
    if (!gameRef) return;
    return gameRef.child(`bets/${playerId}`).set({ ...betData, ts: Date.now() });
  }

  async function clearBets() {
    if (!gameRef) return;
    return gameRef.child('bets').remove();
  }

  /* ══════════════════════════════════════════
     PRESENCE  (disconnect cleanup)
  ══════════════════════════════════════════ */
  function setupPresence() {
    if (!gameRef || !myId) return;
    const connRef = db.ref('.info/connected');
    connRef.on('value', snap => {
      if (snap.val()) {
        gameRef.child(`players/${myId}/online`)
          .onDisconnect().set(false);
        gameRef.child(`players/${myId}/online`).set(true);
      }
    });
  }

  /* ══════════════════════════════════════════
     LOCAL STORAGE helpers
  ══════════════════════════════════════════ */
  const LS_KEY = 'sfaccimmopoly_session';

  function _saveLocal(code, id) {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ code, id })); } catch (_) {}
  }
  function _loadLocal() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)); } catch (_) { return null; }
  }
  function _clearLocal() {
    try { localStorage.removeItem(LS_KEY); } catch (_) {}
  }

  /* ══════════════════════════════════════════
     CLEANUP
  ══════════════════════════════════════════ */
  async function leaveGame() {
    if (!gameRef || !myId) return;
    await gameRef.child(`players/${myId}/online`).set(false);
    _off();
    _clearLocal();
    gameRef  = null;
    gameCode = null;
    myId     = null;
  }

  async function endGame() {
    if (!gameRef) return;
    await update({ status: 'ended' });
    _off();
    _clearLocal();
  }

  /* ══════════════════════════════════════════
     GETTERS
  ══════════════════════════════════════════ */
  function getMyId()    { return myId; }
  function getCode()    { return gameCode; }
  function getRef()     { return gameRef; }
  function isReady()    { return !!db; }

  /* ══════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════ */
  return {
    init,

    /* lobby */
    createGame,
    joinGame,
    rejoin,

    /* listeners */
    onGameState,
    onPlayerChanged,
    onPlayerAdded,
    onPlayerRemoved,
    onLog,
    onTrade,
    onAuction,
    offAll,

    /* writes */
    update,
    updatePlayer,
    updateProperty,
    pushLog,
    transaction,
    setStatus,
    setTurnOrder,
    nextTurn,
    updateBank,
    setDecks,
    updateDeck,

    /* trade */
    proposeTrade,
    respondTrade,
    clearTrade,

    /* auction */
    startAuction,
    placeBid,
    endAuction,

    /* betting */
    placeBet,
    clearBets,

    /* presence / cleanup */
    setupPresence,
    leaveGame,
    endGame,

    /* getters */
    getMyId,
    getCode,
    getRef,
    isReady,
  };

})();
