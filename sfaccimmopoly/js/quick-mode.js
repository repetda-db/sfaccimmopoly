/* ============================================
   SFACCIMMOPOLY — QUICK MODE
   Special card effects unique to Quick Mode
   ============================================
   Cards:
   1. GAME OVER      → instant elimination
   2. MAGNANIMUS     → give money to poorest
   3. CONFUSION      → swap positions 2 players
   4. TERREMOTO      → destroy all houses on a color group
   5. SCHIAVO        → target player pays you each turn
   PORTOGHESE          until they roll doubles
   ============================================ */

'use strict';

const QuickMode = (() => {

  /* ══════════════════════════════════════════
     1. GAME OVER
     The player who draws this is eliminated
     immediately — no bankruptcy process.
  ══════════════════════════════════════════ */

  function cardGameOver(player) {
    addLog(t('log_qm_game_over', { name: player.name }));
    UI.showAlert(t('alert_qm_game_over', { name: player.name }), () => {
      eliminatePlayer(player);      // game-core.js
      Sync.pushGameState();
      endTurn();
    });
  }

  /* ══════════════════════════════════════════
     2. MAGNANIMUS
     Drawing player gives 200 to the player
     with the least money.
  ══════════════════════════════════════════ */

  function cardMagnanimus(player) {
    const others  = getActivePlayers().filter(p => p.id !== player.id);
    if (!others.length) { endTurn(); return; }

    const poorest = others.reduce((a, b) => a.money < b.money ? a : b);
    const amount  = 200;

    player.money  -= amount;
    poorest.money += amount;

    addLog(t('log_qm_magnanimus', {
      from:   player.name,
      to:     poorest.name,
      amount,
    }));

    UI.updatePlayerPanel(player);
    UI.updatePlayerPanel(poorest);
    UI.showAlert(t('alert_qm_magnanimus', { from: player.name, to: poorest.name, amount }));

    // Check if giver went bankrupt
    if (player.money < 0) {
      GameActions.declareBankruptcy(player, poorest);
    } else {
      Sync.pushGameState();
      endTurn();
    }
  }

  /* ══════════════════════════════════════════
     3. CONFUSION
     Swap board positions of two players
     chosen at random (excluding drawer).
  ══════════════════════════════════════════ */

  function cardConfusion(player) {
    const others = getActivePlayers().filter(p => p.id !== player.id);
    if (others.length < 2) {
      // Only one other player → swap with drawer
      const target = others[0];
      if (!target) { endTurn(); return; }
      swapPositions(player, target);
      return;
    }

    // Pick 2 random distinct players from ALL active (may include drawer)
    const pool    = getActivePlayers();
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const [a, b]  = shuffled;

    swapPositions(a, b);
  }

  function swapPositions(a, b) {
    [a.pos, b.pos] = [b.pos, a.pos];

    addLog(t('log_qm_confusion', { p1: a.name, p2: b.name }));
    UI.movePawn(a);
    UI.movePawn(b);
    UI.showAlert(t('alert_qm_confusion', { p1: a.name, p2: b.name }), () => {
      // Both players trigger landing effects
      handleLanding(a);   // game-core.js — will chain endTurn internally
      handleLanding(b);
      Sync.pushGameState();
    });
  }

  /* ══════════════════════════════════════════
     4. TERREMOTO  (Earthquake)
     All houses & hotels on a randomly chosen
     color group are destroyed — no refund.
  ══════════════════════════════════════════ */

  function cardTerremoto(player) {
    const COLOR_GROUPS = [
      'brown','light-blue','pink','orange',
      'red','yellow','green','dark-blue',
    ];

    const group = COLOR_GROUPS[Math.floor(Math.random() * COLOR_GROUPS.length)];
    const affected = getBoardSquares()               // board-data.js
      .filter(sq => sq.colorGroup === group && sq.houses > 0);

    let totalDestroyed = 0;
    affected.forEach(sq => {
      totalDestroyed += sq.houses;
      sq.houses = 0;
      UI.updateSquareHouses(sq);
    });

    addLog(t('log_qm_terremoto', { player: player.name, group, count: totalDestroyed }));
    UI.showAlert(t('alert_qm_terremoto', { group, count: totalDestroyed }), () => {
      Sync.pushGameState();
      endTurn();
    });
  }

  /* ══════════════════════════════════════════
     5. SCHIAVO PORTOGHESE  (Portuguese Slave)
     Target player (chosen by drawer) must pay
     the drawer 50 each time it's their turn,
     until the target rolls doubles.
  ══════════════════════════════════════════ */

  function cardSchiavoPortoghese(player) {
    // Drawer picks target via UI
    const others = getActivePlayers().filter(p => p.id !== player.id);
    if (!others.length) { endTurn(); return; }

    UI.showPlayerPicker(
      t('pick_schiavo_target'),
      others,
      (target) => applySchiavoEffect(player, target)
    );
  }

  function applySchiavoEffect(master, slave) {
    // Store effect in GameState
    GameState.schiavoEffect = {
      masterId: master.id,
      slaveId:  slave.id,
    };

    addLog(t('log_qm_schiavo', { master: master.name, slave: slave.name }));
    UI.showAlert(t('alert_qm_schiavo', { master: master.name, slave: slave.name }), () => {
      Sync.pushGameState();
      endTurn();
    });
  }

  /* Called from game-core.js at start of each turn */
  function checkSchiavoEffect(player, diceResult) {
    const effect = GameState.schiavoEffect;
    if (!effect || effect.slaveId !== player.id) return;

    const slave  = player;
    const master = getPlayerById(effect.masterId);
    if (!master || master.out) {
      // Master eliminated → effect ends
      GameState.schiavoEffect = null;
      return;
    }

    // Pay master 50
    const amount = 50;
    slave.money  -= amount;
    master.money += amount;
    addLog(t('log_schiavo_pay', { slave: slave.name, master: master.name, amount }));
    UI.updatePlayerPanel(slave);
    UI.updatePlayerPanel(master);

    // Check if slave rolled doubles → free
    if (diceResult.isDouble) {
      GameState.schiavoEffect = null;
      addLog(t('log_schiavo_free', { slave: slave.name }));
      UI.showAlert(t('alert_schiavo_free', { slave: slave.name }));
    }

    // Check bankruptcy
    if (slave.money < 0) {
      GameActions.declareBankruptcy(slave, master);
    }
  }

  /* ══════════════════════════════════════════
     QUICK MODE CARD DECK
  ══════════════════════════════════════════ */

  const QUICK_CARDS = [
    {
      id:      'qm_game_over',
      textKey: 'card_qm_game_over',
      action:  cardGameOver,
    },
    {
      id:      'qm_magnanimus',
      textKey: 'card_qm_magnanimus',
      action:  cardMagnanimus,
    },
    {
      id:      'qm_confusion',
      textKey: 'card_qm_confusion',
      action:  cardConfusion,
    },
    {
      id:      'qm_terremoto',
      textKey: 'card_qm_terremoto',
      action:  cardTerremoto,
    },
    {
      id:      'qm_schiavo',
      textKey: 'card_qm_schiavo',
      action:  cardSchiavoPortoghese,
    },
  ];

  let quickDeck = [];

  function initDeck() {
    quickDeck = [...QUICK_CARDS].sort(() => Math.random() - 0.5);
  }

  function drawQuickCard(player) {
    if (quickDeck.length === 0) initDeck();
    const card = quickDeck.pop();
    UI.showCardModal(card, 'quick', () => card.action(player));
    addLog(t('log_drew_quick', { name: player.name, card: t(card.textKey) }));
  }

  /* ── Public API ───────────────────────────── */
  return {
    initDeck,
    drawQuickCard,
    checkSchiavoEffect,   // called by game-core.js each turn
    QUICK_CARDS,
  };

})();
