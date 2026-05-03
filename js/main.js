'use strict';

/* ══════════════════════════════════════════
   SAFETY POLYFILLS  (aggiungi subito dopo 'use strict';)
  ══════════════════════════════════════════ */

/* 1. GameConfig fallback */
const GameConfig = window.GameConfig || {
  GO_SALARY: 200,
  JAIL_FINE: 50,
  MAX_DOUBLES: 3,
};

/* 2. GameLogic metodi che main.js si aspetta ma game-core.js potrebbe non esporre */
if (!window.GameLogic) window.GameLogic = {};
const GL = window.GameLogic;

GL.calcMove = GL.calcMove || function(pos, steps) {
  const newPos = (pos + steps) % 40;
  return { newPos, passedGo: newPos < pos && steps > 0 };
};

GL.calcRent = GL.calcRent || function(prop, ps) {
  const houses = ps.houses || 0;
  if (houses > 0 && Array.isArray(prop.houseRent)) {
    return prop.houseRent[Math.min(houses, prop.houseRent.length) - 1] || prop.baseRent;
  }
  if (prop.type === 'station') {
    if (!ps.owner) return 0;
    const count = Object.values((window.GameState?.properties) || {})
      .filter(p => p.type === 'station' && p.owner === ps.owner).length;
    return (prop.baseRent || 25) * count;
  }
  return prop.baseRent || 0;
};

GL.calcUtilityRent = GL.calcUtilityRent || function(prop, ps, roll) {
  if (!ps.owner) return 0;
  const utilCount = Object.values((window.GameState?.properties) || {})
    .filter(p => p.type === 'utility' && p.owner === ps.owner).length;
  return roll * (utilCount === 2 ? 10 : 4);
};

GL.shuffleTurnOrder = GL.shuffleTurnOrder || function(arr) {
  const a = Array.from(arr);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* 3. Alias toast */
if (typeof UI !== 'undefined' && !UI.toast && UI.showToast) {
  UI.toast = UI.showToast;
}

/* ============================================
   SFACCIMMOPOLY — MAIN
   Game orchestrator: ties together
   Sync, UI, GameLogic, Cards, Translations
   ============================================ */

const Main = (() => {

  /* ══════════════════════════════════════════
     STATE (local mirror of Firebase)
  ══════════════════════════════════════════ */
  let state      = null;   // full game snapshot
  let myId       = null;
  let isMyTurn   = false;
  let hasRolled  = false;
  let inAction   = false;  // prevent double-clicks

  /* ══════════════════════════════════════════
     BOOT
  ══════════════════════════════════════════ */
  async function boot() {
    /* 1. Init Firebase Sync */
    if (!Sync.init()) {
      UI.toast('Firebase non disponibile', 'error');
      return;
    }

    /* 2. Language */
    const savedLang = localStorage.getItem('sfaccimmo_lang') || 'it';
    Translations.setLanguage(savedLang);
    UI.applyTranslations();
    UI.populateLangSelect(Translations.getLanguages(), savedLang);

    document.getElementById('lang-select')?.addEventListener('change', e => {
      Translations.setLanguage(e.target.value);
      localStorage.setItem('sfaccimmo_lang', e.target.value);
      UI.applyTranslations();
    });

    /* 3. Render board */
    UI.renderBoard(BoardData.cells);

    /* 4. Attach board cell click */
    document.getElementById('board')?.addEventListener('click', e => {
      const cell = e.target.closest('.cell');
      if (!cell) return;
      const idx  = parseInt(cell.dataset.index, 10);
      const prop = BoardData.getProperty(idx);
      if (prop) UI.showPropertyInfo(prop, state || {});
    });

    /* 5. Attach action buttons */
    _bindButtons();

    /* 6. Try rejoin from localStorage */
    const rejoined = await Sync.rejoin(
      snap => _onStateUpdate(snap),
      () => _onPlayerChange()
    );

    if (rejoined) {
      myId = Sync.getMyId();
      UI.showScreen('game');
    } else {
      UI.showScreen('lobby');
      _initLobby();
    }
  }

  /* ══════════════════════════════════════════
     LOBBY
  ══════════════════════════════════════════ */
  function _initLobby() {
    /* handled mostly by lobby.html inline scripts +
       the lobby.js (file #12). Main just exposes
       createGame / joinGame for those buttons.    */
  }

  /* Called from lobby.html */
  async function createGame(hostName, mode, options) {
    try {
      await Sync.createGame(hostName, mode, options);
      myId = Sync.getMyId();
      _subscribeGame();
      UI.showScreen('game');
      UI.toast(t('msg_game_created', { code: Sync.getCode() }), 'success');
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  }

  async function joinGame(playerName, code) {
    try {
      await Sync.joinGame(playerName, code.toUpperCase().trim());
      myId = Sync.getMyId();
      _subscribeGame();
      UI.showScreen('game');
      UI.toast(t('msg_joined'), 'success');
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  }

  /* ══════════════════════════════════════════
     SUBSCRIBE to Firebase
  ══════════════════════════════════════════ */
  function _subscribeGame() {
    Sync.onGameState(snap => _onStateUpdate(snap));
    Sync.onLog(entry => UI.addLog(entry));
    Sync.onTrade(trade => _handleIncomingTrade(trade));
    Sync.onAuction(auction => _handleAuctionUpdate(auction));
  }

  /* ══════════════════════════════════════════
     STATE UPDATE (main driver)
  ══════════════════════════════════════════ */
    function _onStateUpdate(snap) {
    if (!snap.exists()) return;
    state = snap.val();
    if (!state) { console.warn('Snapshot vuoto'); return; }

    /* mirror players on board */
    _syncTokens();

    /* update sidebar */
    UI.renderPlayerList(state.players, state.currentPlayer, myId);

    /* update property markers */
    _syncPropertyMarkers();

    /* code display */
    const codeEl = document.getElementById('code-display');
    if (codeEl) codeEl.textContent = state.code || '';

    /* mode display */
    const modeEl = document.getElementById('mode-display');
    if (modeEl) modeEl.textContent = t(`mode_${state.mode || 'classic'}`);

    /* ── LOCAL FLAGS (fondamentale!) ── */
    isMyTurn  = (state.currentPlayer === myId);
    hasRolled = !!(state.turnState?.rolled);

    /* phase router */
    const phase = state.status || state.phase || 'waiting';
    if (phase === 'waiting')       _handleWaiting();
    else if (phase === 'playing')  _handlePlaying();
    else if (phase === 'ended')    _handleGameEnd();

    _refreshButtons();
  }

  function _onPlayerChange() {
    if (!state) return;
    UI.renderPlayerList(state.players, state.currentPlayer, myId);
  }

  /* ══════════════════════════════════════════
     TOKENS SYNC
  ══════════════════════════════════════════ */
  const _lastPositions = {};

  function _syncTokens() {
    if (!state?.players) return;
    Object.values(state.players).forEach(p => {
      if (p.isBankrupt) { UI.removeToken(p.id); return; }
      const last = _lastPositions[p.id];
      if (last === undefined) {
        UI.placeToken(p.id, p.position, p.color, p.token);
      } else if (last !== p.position) {
        const passing = p.position < last && !p.inJail;
        UI.moveToken(p.id, last, p.position, passing);
      }
      _lastPositions[p.id] = p.position;
    });
  }

  /* ══════════════════════════════════════════
     PROPERTY MARKERS
  ══════════════════════════════════════════ */
  function _syncPropertyMarkers() {
    if (!state?.properties) return;
    Object.entries(state.properties).forEach(([propId, ps]) => {
      const prop = BoardData.getPropertyById(propId);
      if (!prop) return;
      const owner = ps.owner ? state.players?.[ps.owner] : null;
      UI.markPropertyOwner(prop.cellIndex, owner?.color || null);
      UI.markHouses(prop.cellIndex, ps.houses || 0, ps.hotel || false);
      UI.markMortgage(prop.cellIndex, ps.mortgaged || false);
    });
  }

  /* ══════════════════════════════════════════
     WAITING (lobby phase)
  ══════════════════════════════════════════ */
  function _handleWaiting() {
    const me = state.players?.[myId];
    if (!me?.isHost) return;

    const count = Object.keys(state.players || {}).length;
    const startBtn = document.getElementById('btn-start-game');
    if (startBtn) startBtn.disabled = count < 2;
  }

  /* ══════════════════════════════════════════
     PLAYING
  ══════════════════════════════════════════ */
  function _handlePlaying() {
    UI.highlightCurrentPlayer(state.currentPlayer);

    if (!isMyTurn) return;

    /* prompt pending actions */
    const ts = state.turnState || {};

    if (ts.pendingBuy) {
      const prop = BoardData.getPropertyById(ts.pendingBuy);
      const me   = state.players[myId];
      UI.showBuyPrompt(prop, me.money,
        () => _doBuy(prop),
        () => _doPass(prop)
      );
    }

    if (ts.pendingCard) {
      const card = ts.pendingCard;
      UI.showCard(card, () => _resolveCard(card));
    }

    if (ts.inJailChoice) {
      _showJailChoice();
    }
  }

  /* ══════════════════════════════════════════
     GAME END
  ══════════════════════════════════════════ */
  function _handleGameEnd() {
    const winner = _findWinner();
    UI.showModal({
      title: t('msg_game_over'),
      body:  `<p>${t('msg_winner', { name: winner?.name || '?' })}</p>`,
      closable: false,
      buttons: [
        { label: t('btn_ok'), cls: 'btn-primary', cb: () => location.href = 'index.html' },
      ],
    });
  }

  function _findWinner() {
    if (!state?.players) return null;
    return Object.values(state.players)
      .filter(p => !p.isBankrupt)
      .sort((a, b) => _netWorth(b) - _netWorth(a))[0] || null;
  }

  function _netWorth(player) {
    let w = player.money;
    (player.properties || []).forEach(pid => {
      const prop = BoardData.getPropertyById(pid);
      const ps   = state.properties?.[pid] || {};
      if (prop) {
        w += ps.mortgaged ? prop.mortgageValue : prop.price;
        w += (ps.houses || 0) * (prop.houseCost || 0);
        if (ps.hotel) w += (prop.houseCost || 0) * 5;
      }
    });
    return w;
  }

  /* ══════════════════════════════════════════
     BUTTON BINDINGS
  ══════════════════════════════════════════ */
  function _bindButtons() {
    document.getElementById('btn-roll')     ?.addEventListener('click', _onRoll);
    document.getElementById('btn-end-turn') ?.addEventListener('click', _onEndTurn);
    document.getElementById('btn-buy')      ?.addEventListener('click', () => {
      const ts = state?.turnState || {};
      const prop = BoardData.getPropertyById(ts.pendingBuy);
      if (prop) _doBuy(prop);
    });
    document.getElementById('btn-pass')     ?.addEventListener('click', () => {
      const ts = state?.turnState || {};
      const prop = BoardData.getPropertyById(ts.pendingBuy);
      if (prop) _doPass(prop);
    });
    document.getElementById('btn-mortgage') ?.addEventListener('click', _onMortgage);
    document.getElementById('btn-build')    ?.addEventListener('click', _onBuild);
    document.getElementById('btn-trade')    ?.addEventListener('click', _onOpenTrade);
    document.getElementById('btn-bankrupt') ?.addEventListener('click', _onDeclareBankruptcy);
    document.getElementById('btn-start-game')?.addEventListener('click', _onStartGame);
  }

  function _refreshButtons() {
    const ts = state?.turnState || {};
    UI.setButtonState({
      roll:     isMyTurn && !hasRolled && !ts.pendingBuy && !ts.pendingCard,
      endTurn:  isMyTurn && hasRolled  && !ts.pendingBuy && !ts.pendingCard,
      buy:      isMyTurn && !!ts.pendingBuy,
      pass:     isMyTurn && !!ts.pendingBuy,
      mortgage: isMyTurn,
      build:    isMyTurn,
      trade:    isMyTurn && hasRolled,
      bankrupt: isMyTurn,
    });
  }

  /* ══════════════════════════════════════════
     START GAME  (host only)
  ══════════════════════════════════════════ */
  async function _onStartGame() {
    if (inAction) return; inAction = true;
    if (!state || !state.players) { UI.toast('Stanza non pronta', 'error'); inAction = false; return; }
    try {
      const order = GameLogic.shuffleTurnOrder(Object.keys(state.players));
      await Sync.setTurnOrder(order);
      await Sync.setStatus('playing');

      /* init decks */
      const decks = Cards.initDecks();
      await Sync.setDecks(decks);

      UI.toast(t('msg_game_started'), 'success');
    } catch (e) {
      UI.toast(e.message, 'error');
    } finally { inAction = false; }
  }

  /* ══════════════════════════════════════════
     ROLL DICE
  ══════════════════════════════════════════ */
    async function _onRoll() {
    if (!isMyTurn || hasRolled || inAction) return;
    if (!state || !state.players || !state.players[myId]) {
      UI.toast('Dati giocatore non pronti', 'error');
      return;
    }
    inAction = true;

    try {
      const me = state.players[myId];

      /* jail handling */
      if (me.inJail) { _showJailChoice(); inAction = false; return; }

      const { d1, d2 } = GameLogic.rollDice();
      const total = d1 + d2;
      const isDouble = d1 === d2;

      await UI.animateDice(d1, d2);

      /* log */
      await Sync.pushLog({
        msg:  t('msg_rolled', { name: me.name, d1, d2, total }),
        type: 'roll',
      });

      /* move */
      const { newPos, passedGo } = GameLogic.calcMove(me.position, total);

      /* collect GO salary */
      if (passedGo) {
        await Sync.updatePlayer(myId, { money: me.money + GameConfig.GO_SALARY });
        await Sync.pushLog({ msg: t('msg_passed_go', { name: me.name, amount: GameConfig.GO_SALARY }), type: 'go' });
      }

      await Sync.updatePlayer(myId, { position: newPos });

      /* aggiorna turnState locale in anticipo per il calcolo doppi */
      const newDoubles = isDouble ? (state.turnState?.doubles || 0) + 1 : 0;

      await Sync.update({
        'turnState/rolled':   true,
        'turnState/doubles':  newDoubles,
        'turnState/lastRoll': [d1, d2],
      });

      /* land on cell */
      await _landOnCell(newPos, me);

      /* three doubles → jail */
      if (newDoubles >= 3) {
        await _sendToJail();
        return;
      }

      /* double → re-roll */
      if (isDouble) {
        await Sync.update({ 'turnState/rolled': false });
        UI.toast(t('msg_double'), 'info');
      }
    } catch (e) {
      UI.toast(e.message, 'error');
    } finally {
      inAction = false;
    }
  }

  /* ══════════════════════════════════════════
     LAND ON CELL
  ══════════════════════════════════════════ */
  async function _landOnCell(pos, player) {
    if (!state || !state.players) return;
    const cell = BoardData.cells[pos];
    if (!cell) return;

    /* re-fetch player (money may have changed) */
    const me = state.players[myId];

    switch (cell.type) {

      case 'property':
      case 'station':
      case 'utility': {
        const ps    = state.properties?.[cell.propertyId] || {};
        const owner = ps.owner;

        if (!owner) {
          /* unowned — prompt buy */
          await Sync.update({ 'turnState/pendingBuy': cell.propertyId });
        } else if (owner !== myId && !ps.mortgaged) {
          /* pay rent */
          await _payRent(cell, ps, me);
        }
        break;
      }

      case 'tax': {
        const amount = cell.amount;
        await _payBank(amount, t('msg_tax', { name: me.name, amount }));
        break;
      }

      case 'go_to_jail': {
        await _sendToJail();
        break;
      }

      case 'chance': {
        await _drawCard('chance');
        break;
      }

      case 'community': {
        await _drawCard('community');
        break;
      }

      case 'free_parking': {
        if (state.mode === 'full' && state.bank?.parking > 0) {
          await _collectParking(me);
        }
        break;
      }

      /* go, jail (visiting), go_to_jail handled above */
      default: break;
    }
  }

  /* ══════════════════════════════════════════
     RENT
  ══════════════════════════════════════════ */
  async function _payRent(cell, propState, payer) {
    if (!state || !state.players) return;
    const prop  = BoardData.getPropertyById(cell.propertyId);
    const owner = state.players[propState.owner];
    if (!prop || !owner) return;

    let rent = GameLogic.calcRent(prop, propState, state.properties, state.players);

    /* utility: rent based on dice */
    if (cell.type === 'utility') {
      const roll = (state.turnState?.lastRoll || [1,1]).reduce((a,b) => a+b, 0);
      rent = GameLogic.calcUtilityRent(prop, propState, roll, state.properties, state.players);
    }

    if (payer.money < rent) {
      /* can't afford — bankruptcy flow */
      await _triggerBankruptcy(payer, owner, rent);
      return;
    }

    await Sync.updatePlayer(myId,          { money: payer.money - rent });
    await Sync.updatePlayer(propState.owner, { money: owner.money  + rent });
    await Sync.pushLog({ msg: t('msg_paid_rent', { payer: payer.name, owner: owner.name, amount: rent }), type: 'rent' });
  }

  /* ══════════════════════════════════════════
     TAX / BANK PAYMENT
  ══════════════════════════════════════════ */
  async function _payBank(amount, logMsg) {
    const me = state.players[myId];
    if (me.money < amount) {
      await _triggerBankruptcy(me, null, amount);
      return;
    }
    const updates = { money: me.money - amount };

    /* free parking pot */
    if (state.mode === 'full') {
      await Sync.updateBank({ parking: (state.bank?.parking || 0) + amount });
    }

    await Sync.updatePlayer(myId, updates);
    await Sync.pushLog({ msg: logMsg, type: 'tax' });
  }

  async function _collectParking(me) {
    const pot = state.bank?.parking || 0;
    if (pot === 0) return;
    await Sync.updatePlayer(myId, { money: me.money + pot });
    await Sync.updateBank({ parking: 0 });
    await Sync.pushLog({ msg: t('msg_free_parking', { name: me.name, amount: pot }), type: 'bonus' });
  }

  /* ══════════════════════════════════════════
     BUY PROPERTY
  ══════════════════════════════════════════ */
  async function _doBuy(prop) {
    if (!state || !state.players || !state.players[myId]) return;
    if (inAction) return; inAction = true;
    try {
      const me = state.players[myId];
      if (me.money < prop.price) { UI.toast(t('err_not_enough_money'), 'error'); return; }

      await Sync.updatePlayer(myId, {
        money:      me.money - prop.price,
        properties: [...(me.properties || []), prop.id],
      });
      await Sync.updateProperty(prop.id, { owner: myId, houses: 0, hotel: false, mortgaged: false });
      await Sync.update({ 'turnState/pendingBuy': null });
      await Sync.pushLog({ msg: t('msg_bought', { name: me.name, prop: prop.name, price: prop.price }), type: 'buy' });

      UI.hideModal();
    } catch (e) { UI.toast(e.message, 'error'); }
    finally { inAction = false; }
  }

  /* pass → go to auction (if enabled) or just pass */
  async function _doPass(prop) {
    if (!state || !state.players || !state.players[myId]) return;
    if (inAction) return; inAction = true;
    try {
      await Sync.update({ 'turnState/pendingBuy': null });
      UI.hideModal();

      if (state.options?.auction) {
        await _startAuction(prop);
      }
    } catch (e) { UI.toast(e.message, 'error'); }
    finally { inAction = false; }
  }

  /* ══════════════════════════════════════════
     CARDS
  ══════════════════════════════════════════ */
  async function _drawCard(deckType) {
    if (!state || !state.players || !state.players[myId]) return;
    const decks    = state.decks || {};
    const result   = Cards.drawCard(deckType, decks);
    await Sync.updateDeck(deckType, result.newDeck);

    const card = result.card;
    await Sync.update({ 'turnState/pendingCard': card });
    await Sync.pushLog({ msg: t('msg_drew_card', { name: state.players[myId].name, type: deckType }), type: 'card' });
  }

  async function _resolveCard(card) {
    if (inAction) return; inAction = true;
    try {
      const me = state.players[myId];
      await Cards.applyCard(card, myId, state, {
        updatePlayer:   Sync.updatePlayer,
        updateBank:     Sync.updateBank,
        pushLog:        Sync.pushLog,
        sendToJail:     _sendToJail,
        payEachPlayer:  _payEachPlayer,
        collectFromAll: _collectFromAll,
      });
      await Sync.update({ 'turnState/pendingCard': null });
      UI.hideModal();
    } catch (e) { UI.toast(e.message, 'error'); }
    finally { inAction = false; }
  }

  /* ══════════════════════════════════════════
     JAIL
  ══════════════════════════════════════════ */
  async function _sendToJail() {
    const me = state.players[myId];
    await Sync.updatePlayer(myId, { position: 10, inJail: true, jailTurns: 0 });
    await Sync.update({ 'turnState/rolled': true }); // end turn
    await Sync.pushLog({ msg: t('msg_go_to_jail', { name: me.name }), type: 'jail' });
  }

  function _showJailChoice() {
    const me = state.players[myId];
    const hasCard = (me.getOutCards || 0) > 0;
    const canPay  = me.money >= GameConfig.JAIL_FINE;

    UI.showModal({
      title:    t('jail_title'),
      closable: false,
      body:     `<p>${t('jail_msg', { name: me.name, turns: me.jailTurns })}</p>`,
      buttons: [
        { label: t('jail_roll'),  cls: 'btn-primary',   cb: _jailRoll },
        canPay  ? { label: t('jail_pay', { amount: GameConfig.JAIL_FINE }), cls: 'btn-secondary', cb: _jailPay }    : null,
        hasCard ? { label: t('jail_card'),  cls: 'btn-secondary', cb: _jailUseCard } : null,
      ].filter(Boolean),
    });
  }

  async function _jailRoll() {
    if (!state || !state.players || !state.players[myId]) return;
    const { d1, d2 } = GameLogic.rollDice();
    await UI.animateDice(d1, d2);
    const me = state.players[myId];

    if (d1 === d2) {
      /* doubles — get out free */
      await Sync.updatePlayer(myId, { inJail: false, jailTurns: 0 });
      await Sync.update({ 'turnState/rolled': false });
      await Sync.pushLog({ msg: t('msg_jail_escape_double', { name: me.name }), type: 'jail' });
    } else {
      const turns = (me.jailTurns || 0) + 1;
      if (turns >= 3) {
        /* 3 turns — must pay */
        await Sync.updatePlayer(myId, { money: me.money - GameConfig.JAIL_FINE, inJail: false, jailTurns: 0 });
        await Sync.update({ 'turnState/rolled': true });
        await Sync.pushLog({ msg: t('msg_jail_forced_pay', { name: me.name, amount: GameConfig.JAIL_FINE }), type: 'jail' });
      } else {
        await Sync.updatePlayer(myId, { jailTurns: turns });
        await Sync.update({ 'turnState/rolled': true });
        await Sync.pushLog({ msg: t('msg_jail_stay', { name: me.name, turns }), type: 'jail' });
      }
    }
  }

  async function _jailPay() {
    if (!state || !state.players || !state.players[myId]) return;
    const me = state.players[myId];
    await Sync.updatePlayer(myId, { money: me.money - GameConfig.JAIL_FINE, inJail: false, jailTurns: 0 });
    await Sync.update({ 'turnState/rolled': false });
    await Sync.pushLog({ msg: t('msg_jail_paid', { name: me.name, amount: GameConfig.JAIL_FINE }), type: 'jail' });
    UI.hideModal();
  }

  async function _jailUseCard() {
    if (!state || !state.players || !state.players[myId]) return;
    const me = state.players[myId];
    await Sync.updatePlayer(myId, { getOutCards: me.getOutCards - 1, inJail: false, jailTurns: 0 });
    await Sync.update({ 'turnState/rolled': false });
    await Sync.pushLog({ msg: t('msg_jail_card_used', { name: me.name }), type: 'jail' });
    UI.hideModal();
  }

  /* ══════════════════════════════════════════
     MORTGAGE
  ══════════════════════════════════════════ */
  async function _onMortgage() {
    if (!state || !state.players || !state.players[myId]) { UI.toast('Non sei in partita', 'error'); return; }
    const me = state.players[myId];
    const myProps = (me.properties || []).map(pid => {
      const prop = BoardData.getPropertyById(pid);
      const ps   = state.properties?.[pid] || {};
      return prop ? { ...prop, mortgaged: ps.mortgaged } : null;
    }).filter(Boolean);

    if (!myProps.length) { UI.toast(t('err_no_properties'), 'info'); return; }

    const items = myProps.map(p =>
      `<label class="prop-check">
         <input type="radio" name="mort-prop" value="${p.id}">
         ${UI.escHtml(p.name)} — ${p.mortgaged ? t('btn_unmortgage') + ` (€${p.mortgageValue})` : t('btn_mortgage') + ` (€${p.mortgageValue})`}
       </label>`
    ).join('');

    UI.showModal({
      title: t('btn_mortgage'),
      body:  `<div class="prop-list">${items}</div>`,
      buttons: [
        { label: t('btn_ok'), cls: 'btn-primary', cb: async () => {
          const sel = document.querySelector('input[name="mort-prop"]:checked');
          if (!sel) return;
          await _toggleMortgage(sel.value);
        }},
        { label: t('btn_cancel'), cls: 'btn-secondary' },
      ],
    });
  }

  async function _toggleMortgage(propId) {
    if (inAction) return; inAction = true;
    try {
      const me   = state.players[myId];
      const ps   = state.properties?.[propId] || {};
      const prop = BoardData.getPropertyById(propId);
      if (!prop) return;

      if (ps.mortgaged) {
        /* unmortgage — pay 110% */
        const cost = Math.floor(prop.mortgageValue * 1.1);
        if (me.money < cost) { UI.toast(t('err_not_enough_money'), 'error'); return; }
        await Sync.updatePlayer(myId, { money: me.money - cost });
        await Sync.updateProperty(propId, { mortgaged: false });
        await Sync.pushLog({ msg: t('msg_unmortgaged', { name: me.name, prop: prop.name, cost }), type: 'mortgage' });
      } else {
        /* mortgage */
        if ((ps.houses || 0) > 0 || ps.hotel) { UI.toast(t('err_has_buildings'), 'error'); return; }
        await Sync.updatePlayer(myId, { money: me.money + prop.mortgageValue });
        await Sync.updateProperty(propId, { mortgaged: true });
        await Sync.pushLog({ msg: t('msg_mortgaged', { name: me.name, prop: prop.name, value: prop.mortgageValue }), type: 'mortgage' });
      }
    } catch (e) { UI.toast(e.message, 'error'); }
    finally { inAction = false; }
  }

  /* ══════════════════════════════════════════
     BUILD HOUSES / HOTEL
  ══════════════════════════════════════════ */
  async function _onBuild() {
    if (!state || !state.players || !state.players[myId]) { UI.toast('Non sei in partita', 'error'); return; }
    const me = state.players[myId];
    const buildable = GameLogic.getBuildableProperties(me, state);

    if (!buildable.length) { UI.toast(t('err_no_buildable'), 'info'); return; }

    const items = buildable.map(({ prop, ps }) =>
      `<label class="prop-check">
         <input type="radio" name="build-prop" value="${prop.id}">
         ${UI.escHtml(prop.name)} — ${ps.hotel ? '🏨' : '🏠'.repeat(ps.houses || 0)} (€${prop.houseCost} ${t('label_each')})
       </label>`
    ).join('');

    UI.showModal({
      title: t('btn_build'),
      body:  `<div class="prop-list">${items}</div>`,
      buttons: [
        { label: t('btn_build'), cls: 'btn-primary', cb: async () => {
          const sel = document.querySelector('input[name="build-prop"]:checked');
          if (!sel) return;
          await _buildHouse(sel.value);
        }},
        { label: t('btn_cancel'), cls: 'btn-secondary' },
      ],
    });
  }

  async function _buildHouse(propId) {
    if (!state || !state.players || !state.players[myId]) return;
    if (inAction) return; inAction = true;
    try {
      const me   = state.players[myId];
      const ps   = state.properties?.[propId] || {};
      const prop = BoardData.getPropertyById(propId);
      if (!prop) return;

      if (me.money < prop.houseCost) { UI.toast(t('err_not_enough_money'), 'error'); return; }

      const newHouses = (ps.houses || 0) + 1;
      const isHotel   = newHouses > 4;

      await Sync.updatePlayer(myId, { money: me.money - prop.houseCost });
      await Sync.updateProperty(propId, isHotel
        ? { houses: 0, hotel: true }
        : { houses: newHouses }
      );
      await Sync.pushLog({
        msg:  isHotel
          ? t('msg_built_hotel', { name: me.name, prop: prop.name })
          : t('msg_built_house', { name: me.name, prop: prop.name, count: newHouses }),
        type: 'build',
      });
    } catch (e) { UI.toast(e.message, 'error'); }
    finally { inAction = false; }
  }

  /* ══════════════════════════════════════════
     TRADE
  ══════════════════════════════════════════ */
  async function _onOpenTrade() {
    if (!state || !state.players || !state.players[myId]) { UI.toast('Non sei in partita', 'error'); return; }
    const me      = state.players[myId];
    const others  = Object.values(state.players).filter(p => p.id !== myId && !p.isBankrupt);
    if (!others.length) { UI.toast(t('err_no_players_trade'), 'info'); return; }

    /* pick partner */
    const opts = others.map(p => `<option value="${p.id}">${UI.escHtml(p.name)}</option>`).join('');
    UI.showModal({
      title: t('btn_trade'),
      body:  `<label>${t('label_trade_partner')}<select id="trade-partner">${opts}</select></label>`,
      buttons: [
        { label: t('btn_ok'), cls: 'btn-primary', cb: () => {
          const pid = document.getElementById('trade-partner').value;
          _openTradeWithPlayer(pid);
        }},
        { label: t('btn_cancel'), cls: 'btn-secondary' },
      ],
    });
  }

  function _openTradeWithPlayer(partnerId) {
    if (!state || !state.players) return;
    const me      = state.players[myId];
    const partner = state.players[partnerId];
    const myProps = (me.properties || []).map(pid => BoardData.getPropertyById(pid)).filter(Boolean);
    const theirProps = (partner.properties || []).map(pid => BoardData.getPropertyById(pid)).filter(Boolean);

    UI.showTradePanel(myProps, theirProps, partner.name, async (offer) => {
      await Sync.proposeTrade({
        from:       myId,
        to:         partnerId,
        myProps:    offer.myProps,
        theirProps: offer.theirProps,
        myMoney:    offer.myMoney,
        theirMoney: offer.theirMoney,
      });
      UI.hideTradePanel();
      UI.toast(t('msg_trade_sent'), 'info');
    });
  }

  async function _handleIncomingTrade(trade) {
    if (!state || !state.players) return;
    if (!trade || trade.status !== 'pending') return;
    if (trade.to !== myId) return;

    const from = state.players[trade.from];
    UI.showModal({
      title:    t('trade_incoming', { name: from?.name }),
      closable: false,
      body:     _renderTradeOffer(trade),
      buttons: [
        { label: t('btn_ok'),     cls: 'btn-primary',   cb: () => _respondTrade(true)  },
        { label: t('btn_cancel'), cls: 'btn-secondary', cb: () => _respondTrade(false) },
      ],
    });
  }

  function _renderTradeOffer(trade) {
    const theirProps = (trade.myProps    || []).map(pid => BoardData.getPropertyById(pid)?.name || pid).join(', ');
    const myProps    = (trade.theirProps || []).map(pid => BoardData.getPropertyById(pid)?.name || pid).join(', ');
    return `
      <p>${t('trade_they_offer')}: ${theirProps || '—'} + €${trade.myMoney || 0}</p>
      <p>${t('trade_they_want')}:  ${myProps    || '—'} + €${trade.theirMoney || 0}</p>`;
  }

  async function _respondTrade(accept) {
    if (inAction) return; inAction = true;
    try {
      if (accept) {
        await _executeTrade(state.trade);
      }
      await Sync.respondTrade(accept ? 'accepted' : 'rejected');
      await Sync.clearTrade();
      UI.toast(accept ? t('msg_trade_accepted') : t('msg_trade_rejected'), 'info');
    } catch (e) { UI.toast(e.message, 'error'); }
    finally { inAction = false; }
  }

  async function _executeTrade(trade) {
    const p1 = state.players[trade.from];
    const p2 = state.players[trade.to];

    const p1Props = (p1.properties || [])
      .filter(id => !trade.myProps.includes(id))
      .concat(trade.theirProps);

    const p2Props = (p2.properties || [])
      .filter(id => !trade.theirProps.includes(id))
      .concat(trade.myProps);

    await Sync.updatePlayer(trade.from, {
      money:      p1.money - (trade.myMoney || 0) + (trade.theirMoney || 0),
      properties: p1Props,
    });
    await Sync.updatePlayer(trade.to, {
      money:      p2.money - (trade.theirMoney || 0) + (trade.myMoney || 0),
      properties: p2Props,
    });

    /* update property ownership */
    for (const pid of trade.myProps)    await Sync.updateProperty(pid, { owner: trade.to });
    for (const pid of trade.theirProps) await Sync.updateProperty(pid, { owner: trade.from });

    await Sync.pushLog({ msg: t('msg_trade_done', { p1: p1.name, p2: p2.name }), type: 'trade' });
  }

  /* ══════════════════════════════════════════
     AUCTION
  ══════════════════════════════════════════ */
  async function _startAuction(prop) {
    await Sync.startAuction({ propertyId: prop.id, highBid: 0, highBidder: null, endAt: Date.now() + 30000 });
    await Sync.pushLog({ msg: t('msg_auction_start', { prop: prop.name }), type: 'auction' });
  }

  function _handleAuctionUpdate(auction) {
    if (!auction || auction.status === 'ended') { UI.hideAuction(); return; }

    const prop  = BoardData.getPropertyById(auction.propertyId);
    const me    = state?.players?.[myId];
    if (!prop || !me) return;

    const secondsLeft = Math.max(0, Math.ceil((auction.endAt - Date.now()) / 1000));
    UI.showAuction(prop, auction, me.money, amount => Sync.placeBid(myId, amount));
    UI.updateAuctionTimer(secondsLeft);
  }

  /* ══════════════════════════════════════════
     BANKRUPTCY
  ══════════════════════════════════════════ */
  async function _triggerBankruptcy(debtor, creditor, debt) {
    UI.showModal({
      title:    t('bankruptcy_title'),
      closable: false,
      body:     `<p>${t('bankruptcy_msg', { name: debtor.name, debt })}</p>`,
      buttons: [
        { label: t('bankruptcy_declare'), cls: 'btn-danger', cb: () => _declareBankruptcy(debtor, creditor) },
      ],
    });
  }

  async function _onDeclareBankruptcy() {
    const me = state.players[myId];
    UI.confirm(t('bankruptcy_confirm'), () => _declareBankruptcy(me, null));
  }

  async function _declareBankruptcy(debtor, creditor) {
    if (!state || !state.players) return;
    if (inAction) return; inAction = true;
    try {
      /* transfer assets to creditor or bank */
      const props = debtor.properties || [];
      for (const pid of props) {
        await Sync.updateProperty(pid, { owner: creditor?.id || null });
      }
      if (creditor) {
        await Sync.updatePlayer(creditor.id, {
          money:      creditor.money + debtor.money,
          properties: [...(creditor.properties || []), ...props],
        });
      }

      await Sync.updatePlayer(debtor.id, {
        isBankrupt:  true,
        money:       0,
        properties:  [],
      });

      await Sync.pushLog({ msg: t('msg_bankrupt', { name: debtor.name }), type: 'bankrupt' });
      UI.removeToken(debtor.id);

      /* check win condition */
      const active = Object.values(state.players).filter(p => !p.isBankrupt && p.id !== debtor.id);
      if (active.length === 1) {
        await Sync.setStatus('ended');
      }
    } catch (e) { UI.toast(e.message, 'error'); }
    finally { inAction = false; }
  }

  /* ══════════════════════════════════════════
     CARD HELPERS
  ══════════════════════════════════════════ */
  async function _payEachPlayer(amount) {
    if (!state || !state.players || !state.players[myId]) return;
    const me = state.players[myId];
    const others = Object.values(state.players).filter(p => !p.isBankrupt && p.id !== myId);
    const total  = amount * others.length;

    if (me.money < total) { await _triggerBankruptcy(me, null, total); return; }

    await Sync.updatePlayer(myId, { money: me.money - total });
    for (const p of others) {
      await Sync.updatePlayer(p.id, { money: p.money + amount });
    }
    await Sync.pushLog({ msg: t('msg_pay_each', { name: me.name, amount }), type: 'card' });
  }

  async function _collectFromAll(amount) {
    if (!state || !state.players || !state.players[myId]) return;
    const me     = state.players[myId];
    const others = Object.values(state.players).filter(p => !p.isBankrupt && p.id !== myId);
    let total = 0;

    for (const p of others) {
      const pay = Math.min(amount, p.money);
      total += pay;
      await Sync.updatePlayer(p.id, { money: p.money - pay });
    }

    await Sync.updatePlayer(myId, { money: me.money + total });
    await Sync.pushLog({ msg: t('msg_collect_all', { name: me.name, amount }), type: 'card' });
  }

  /* ══════════════════════════════════════════
     END TURN
  ══════════════════════════════════════════ */
  async function _onEndTurn() {
    if (!isMyTurn || !hasRolled || inAction) return;
    if (!state || !state.players) return;
    inAction = true;
    try {
      await Sync.nextTurn();
      hasRolled = false;
      UI.resetButtons();
    } catch (e) { UI.toast(e.message, 'error'); }
    finally { inAction = false; }
  }

  /* ══════════════════════════════════════════
     PUBLIC
  ══════════════════════════════════════════ */
  return {
    boot,
    createGame,
    joinGame,
  };

})();

/* ── Auto-boot ────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => Main.boot());

