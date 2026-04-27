/* ============================================
   SFACCIMMOPOLY — CARDS DATA
   Chance · Community Chest definitions
   ============================================ */

'use strict';

/* ══════════════════════════════════════════
   CHANCE CARDS  (16 cards)
══════════════════════════════════════════ */

const CHANCE_CARDS = [
  {
    id: 'ch_01',
    textKey: 'card_ch_advance_go',
    action: (player) => {
      teleportPlayer(player, 0);          // game-core.js
      player.money += GO_SALARY;
      addLog(t('log_advance_go', { name: player.name }));
      endTurn();
    },
  },
  {
    id: 'ch_02',
    textKey: 'card_ch_advance_boardwalk',
    action: (player) => {
      teleportPlayer(player, 39);
      addLog(t('log_teleport', { name: player.name, pos: 39 }));
      handleLanding(player);              // game-core.js
    },
  },
  {
    id: 'ch_03',
    textKey: 'card_ch_advance_illinois',
    action: (player) => {
      teleportPlayer(player, 24);
      handleLanding(player);
    },
  },
  {
    id: 'ch_04',
    textKey: 'card_ch_advance_stcharles',
    action: (player) => {
      teleportPlayer(player, 11);
      handleLanding(player);
    },
  },
  {
    id: 'ch_05',
    textKey: 'card_ch_nearest_utility',
    action: (player) => {
      const target = nearestOf(player.pos, [12, 28]);
      teleportPlayer(player, target);
      const sq = getSquare(target);
      if (sq.owner && sq.owner !== player.id) {
        // Pay 10× dice roll
        const [d1, d2] = GameState.dice;
        GameActions.payRent(player, getPlayerById(sq.owner), (d1 + d2) * 10, sq);
      } else {
        handleLanding(player);
      }
    },
  },
  {
    id: 'ch_06',
    textKey: 'card_ch_nearest_railroad',
    action: (player) => {
      const target = nearestOf(player.pos, [5, 15, 25, 35]);
      teleportPlayer(player, target);
      handleLanding(player);
    },
  },
  {
    id: 'ch_07',
    textKey: 'card_ch_bank_dividend',
    action: (player) => {
      player.money += 50;
      addLog(t('log_receive', { name: player.name, amount: 50 }));
      UI.updatePlayerPanel(player);
      Sync.pushGameState();
      endTurn();
    },
  },
  {
    id: 'ch_08',
    textKey: 'card_ch_jail_free',
    action: (player) => {
      player.jailCard = true;
      addLog(t('log_jail_card', { name: player.name }));
      UI.updatePlayerPanel(player);
      endTurn();
    },
  },
  {
    id: 'ch_09',
    textKey: 'card_ch_go_back_3',
    action: (player) => {
      const newPos = (player.pos - 3 + 40) % 40;
      teleportPlayer(player, newPos);
      handleLanding(player);
    },
  },
  {
    id: 'ch_10',
    textKey: 'card_ch_go_to_jail',
    action: (player) => {
      sendToJail(player);                 // game-core.js
    },
  },
  {
    id: 'ch_11',
    textKey: 'card_ch_repairs',
    action: (player) => {
      let total = 0;
      player.properties.forEach(idx => {
        const sq = getSquare(idx);
        if (!sq) return;
        if (sq.houses === 5) total += 115;   // hotel
        else                 total += sq.houses * 25;
      });
      total = Math.max(total, 0);
      addLog(t('log_repairs', { name: player.name, amount: total }));
      GameActions.payTax(player, total);
    },
  },
  {
    id: 'ch_12',
    textKey: 'card_ch_speeding',
    action: (player) => {
      addLog(t('log_speeding', { name: player.name }));
      GameActions.payTax(player, 15);
    },
  },
  {
    id: 'ch_13',
    textKey: 'card_ch_advance_reading',
    action: (player) => {
      teleportPlayer(player, 5);
      handleLanding(player);
    },
  },
  {
    id: 'ch_14',
    textKey: 'card_ch_elected_chairman',
    action: (player) => {
      let total = 0;
      GameState.players.forEach(other => {
        if (other.id === player.id || other.out) return;
        const amount = Math.min(50, other.money);
        other.money -= amount;
        player.money += amount;
        total += amount;
        UI.updatePlayerPanel(other);
      });
      addLog(t('log_chairman', { name: player.name, total }));
      UI.updatePlayerPanel(player);
      Sync.pushGameState();
      endTurn();
    },
  },
  {
    id: 'ch_15',
    textKey: 'card_ch_loan_matures',
    action: (player) => {
      player.money += 150;
      addLog(t('log_receive', { name: player.name, amount: 150 }));
      UI.updatePlayerPanel(player);
      Sync.pushGameState();
      endTurn();
    },
  },
  {
    id: 'ch_16',
    textKey: 'card_ch_advance_railroad2',
    action: (player) => {
      const target = nearestOf(player.pos, [5, 15, 25, 35]);
      teleportPlayer(player, target);
      handleLanding(player);
    },
  },
];

/* ══════════════════════════════════════════
   COMMUNITY CHEST CARDS  (16 cards)
══════════════════════════════════════════ */

const COMMUNITY_CHEST_CARDS = [
  {
    id: 'cc_01',
    textKey: 'card_cc_advance_go',
    action: (player) => {
      teleportPlayer(player, 0);
      player.money += GO_SALARY;
      addLog(t('log_advance_go', { name: player.name }));
      UI.updatePlayerPanel(player);
      Sync.pushGameState();
      endTurn();
    },
  },
  {
    id: 'cc_02',
    textKey: 'card_cc_bank_error',
    action: (player) => {
      player.money += 200;
      addLog(t('log_receive', { name: player.name, amount: 200 }));
      UI.updatePlayerPanel(player);
      Sync.pushGameState();
      endTurn();
    },
  },
  {
    id: 'cc_03',
    textKey: 'card_cc_doctor_fee',
    action: (player) => {
      GameActions.payTax(player, 50);
    },
  },
  {
    id: 'cc_04',
    textKey: 'card_cc_stock_sale',
    action: (player) => {
      player.money += 50;
      addLog(t('log_receive', { name: player.name, amount: 50 }));
      UI.updatePlayerPanel(player);
      Sync.pushGameState();
      endTurn();
    },
  },
  {
    id: 'cc_05',
    textKey: 'card_cc_jail_free',
    action: (player) => {
      player.jailCard = true;
      addLog(t('log_jail_card', { name: player.name }));
      UI.updatePlayerPanel(player);
      endTurn();
    },
  },
  {
    id: 'cc_06',
    textKey: 'card_cc_go_to_jail',
    action: (player) => {
      sendToJail(player);
    },
  },
  {
    id: 'cc_07',
    textKey: 'card_cc_grand_opera',
    action: (player) => {
      let total = 0;
      GameState.players.forEach(other => {
        if (other.id === player.id || other.out) return;
        const amount = Math.min(50, other.money);
        other.money -= amount;
        player.money += amount;
        total += amount;
        UI.updatePlayerPanel(other);
      });
      addLog(t('log_opera', { name: player.name, total }));
      UI.updatePlayerPanel(player);
      Sync.pushGameState();
      endTurn();
    },
  },
  {
    id: 'cc_08',
    textKey: 'card_cc_holiday_fund',
    action: (player) => {
      player.money += 100;
      addLog(t('log_receive', { name: player.name, amount: 100 }));
      UI.updatePlayerPanel(player);
      Sync.pushGameState();
      endTurn();
    },
  },
  {
    id: 'cc_09',
    textKey: 'card_cc_income_tax',
    action: (player) => {
      GameActions.payTax(player, 100);
    },
  },
  {
    id: 'cc_10',
    textKey: 'card_cc_life_insurance',
    action: (player) => {
      player.money += 100;
      addLog(t('log_receive', { name: player.name, amount: 100 }));
      UI.updatePlayerPanel(player);
      Sync.pushGameState();
      endTurn();
    },
  },
  {
    id: 'cc_11',
    textKey: 'card_cc_hospital_fee',
    action: (player) => {
      GameActions.payTax(player, 100);
    },
  },
  {
    id: 'cc_12',
    textKey: 'card_cc_school_fee',
    action: (player) => {
      GameActions.payTax(player, 150);
    },
  },
  {
    id: 'cc_13',
    textKey: 'card_cc_consultancy',
    action: (player) => {
      player.money += 25;
      addLog(t('log_receive', { name: player.name, amount: 25 }));
      UI.updatePlayerPanel(player);
      Sync.pushGameState();
      endTurn();
    },
  },
  {
    id: 'cc_14',
    textKey: 'card_cc_street_repairs',
    action: (player) => {
      let total = 0;
      player.properties.forEach(idx => {
        const sq = getSquare(idx);
        if (!sq) return;
        if (sq.houses === 5) total += 115;
        else                 total += sq.houses * 40;
      });
      addLog(t('log_repairs', { name: player.name, amount: total }));
      GameActions.payTax(player, total);
    },
  },
  {
    id: 'cc_15',
    textKey: 'card_cc_beauty_contest',
    action: (player) => {
      player.money += 10;
      addLog(t('log_receive', { name: player.name, amount: 10 }));
      UI.updatePlayerPanel(player);
      Sync.pushGameState();
      endTurn();
    },
  },
  {
    id: 'cc_16',
    textKey: 'card_cc_inheritance',
    action: (player) => {
      player.money += 100;
      addLog(t('log_receive', { name: player.name, amount: 100 }));
      UI.updatePlayerPanel(player);
      Sync.pushGameState();
      endTurn();
    },
  },
];

/* ══════════════════════════════════════════
   DECK MANAGEMENT
══════════════════════════════════════════ */

const Decks = (() => {
  let chanceDeck    = [];
  let chestDeck     = [];

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function init() {
    chanceDeck = shuffle(CHANCE_CARDS);
    chestDeck  = shuffle(COMMUNITY_CHEST_CARDS);
  }

  function drawChance(player) {
    if (chanceDeck.length === 0) chanceDeck = shuffle(CHANCE_CARDS);
    const card = chanceDeck.pop();
    UI.showCardModal(card, 'chance', () => card.action(player));
    addLog(t('log_drew_chance', { name: player.name, card: t(card.textKey) }));
  }

  function drawChest(player) {
    if (chestDeck.length === 0) chestDeck = shuffle(COMMUNITY_CHEST_CARDS);
    const card = chestDeck.pop();
    UI.showCardModal(card, 'chest', () => card.action(player));
    addLog(t('log_drew_chest', { name: player.name, card: t(card.textKey) }));
  }

  return { init, drawChance, drawChest };
})();

/* ── Helper: nearest square index ──────────── */
function nearestOf(pos, targets) {
  let best = targets[0];
  let bestDist = 40;
  targets.forEach(t => {
    const dist = (t - pos + 40) % 40;
    if (dist < bestDist) { bestDist = dist; best = t; }
  });
  return best;
}
