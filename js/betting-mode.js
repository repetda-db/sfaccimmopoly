/* ============================================
   SFACCIMMOPOLY — BETTING MODE
   Eliminated players can bet on dice rolls
   and re-enter the game if they reach 1000.
   ============================================
   Flow:
   1. Player eliminated → joins BettingMode
   2. Before each dice roll, eliminated players
      place bets (high/low, exact number, etc.)
   3. Dice rolled → bets resolved
   4. If eliminated player reaches 1000 →
      they pick a property + get a hotel → re-enter
   ============================================ */

'use strict';

const BettingMode = (() => {

  /* ══════════════════════════════════════════
     CONSTANTS
  ══════════════════════════════════════════ */

  const REENTRY_THRESHOLD = 1000;   // money needed to re-enter
  const STARTING_CHIPS    = 100;    // chips given on elimination

  const BET_TYPES = {
    HIGH:   'high',    // sum > 7  → 1.5× payout
    LOW:    'low',     // sum < 7  → 1.5× payout
    SEVEN:  'seven',   // sum = 7  → 4×  payout
    DOUBLE: 'double',  // doubles  → 3×  payout
    EXACT:  'exact',   // exact sum (2-12) → 6× payout
  };

  const PAYOUTS = {
    [BET_TYPES.HIGH]:   1.5,
    [BET_TYPES.LOW]:    1.5,
    [BET_TYPES.SEVEN]:  4,
    [BET_TYPES.DOUBLE]: 3,
    [BET_TYPES.EXACT]:  6,
  };

  /* ══════════════════════════════════════════
     STATE
  ══════════════════════════════════════════ */

  // Array of eliminated players participating in betting
  // { id, name, color, chips, currentBet: { type, amount, exactValue? } }
  let bettors = [];

  /* ══════════════════════════════════════════
     ENROL  — called when a player is eliminated
  ══════════════════════════════════════════ */

  function enrolPlayer(player) {
    // Avoid duplicates
    if (bettors.find(b => b.id === player.id)) return;

    const bettor = {
      id:          player.id,
      name:        player.name,
      color:       player.color,
      chips:       STARTING_CHIPS,
      currentBet:  null,
    };

    bettors.push(bettor);

    addLog(t('log_bet_enrol', { name: player.name, chips: STARTING_CHIPS }));
    UI.addBettorPanel(bettor);
    Sync.pushGameState();
  }

  /* ══════════════════════════════════════════
     PLACE BET  — called by UI before dice roll
  ══════════════════════════════════════════ */

  function placeBet(bettorId, betType, amount, exactValue = null) {
    const bettor = bettors.find(b => b.id === bettorId);
    if (!bettor) return { ok: false, reason: 'not_found' };

    if (amount <= 0)            return { ok: false, reason: 'invalid_amount' };
    if (amount > bettor.chips)  return { ok: false, reason: 'insufficient_chips' };
    if (!PAYOUTS[betType])      return { ok: false, reason: 'invalid_type' };
    if (betType === BET_TYPES.EXACT && (exactValue < 2 || exactValue > 12))
                                return { ok: false, reason: 'invalid_exact' };

    bettor.currentBet = { type: betType, amount, exactValue };
    bettor.chips -= amount;   // deduct immediately; refund+payout on win

    addLog(t('log_bet_placed', {
      name:   bettor.name,
      type:   betType,
      amount,
      exact:  exactValue ?? '-',
    }));

    UI.updateBettorPanel(bettor);
    Sync.pushGameState();
    return { ok: true };
  }

  /* ══════════════════════════════════════════
     RESOLVE BETS  — called after dice are rolled
     diceResult: { d1, d2, sum, isDouble }
  ══════════════════════════════════════════ */

  function resolveBets(diceResult) {
    const { d1, d2, sum, isDouble } = diceResult;
    if (!bettors.length) return;

    bettors.forEach(bettor => {
      if (!bettor.currentBet) return;

      const { type, amount, exactValue } = bettor.currentBet;
      const won = evaluateBet(type, exactValue, sum, isDouble);

      if (won) {
        const payout = Math.floor(amount * PAYOUTS[type]);
        bettor.chips += amount + payout;   // return stake + profit
        addLog(t('log_bet_win', { name: bettor.name, payout }));
        UI.showBetResult(bettor, true, payout);
      } else {
        addLog(t('log_bet_lose', { name: bettor.name, amount }));
        UI.showBetResult(bettor, false, 0);
      }

      bettor.currentBet = null;
      UI.updateBettorPanel(bettor);

      // Check re-entry condition
      if (bettor.chips >= REENTRY_THRESHOLD) {
        triggerReentry(bettor);
      }
    });

    Sync.pushGameState();
  }

  function evaluateBet(type, exactValue, sum, isDouble) {
    switch (type) {
      case BET_TYPES.HIGH:   return sum > 7;
      case BET_TYPES.LOW:    return sum < 7;
      case BET_TYPES.SEVEN:  return sum === 7;
      case BET_TYPES.DOUBLE: return isDouble;
      case BET_TYPES.EXACT:  return sum === exactValue;
      default:               return false;
    }
  }

  /* ══════════════════════════════════════════
     RE-ENTRY
     Player picks any unowned property +
     receives 1 hotel on it → re-enters at GO
  ══════════════════════════════════════════ */

  function triggerReentry(bettor) {
    addLog(t('log_bet_reentry_eligible', { name: bettor.name }));

    // Get all unowned purchasable properties
    const unowned = getBoardSquares()
      .filter(sq => sq.type === 'property' && !sq.owner);

    if (!unowned.length) {
      // No unowned properties → re-enter with cash only
      addLog(t('log_bet_no_unowned', { name: bettor.name }));
      finaliseReentry(bettor, null);
      return;
    }

    // Show property picker to bettor
    UI.showPropertyPicker(
      t('pick_reentry_property', { name: bettor.name }),
      unowned,
      (chosenSquare) => {
        finaliseReentry(bettor, chosenSquare);
      }
    );
  }

  function finaliseReentry(bettor, chosenSquare) {
    // Restore as active player
    const player = getPlayerById(bettor.id);
    if (!player) return;

    player.money    = bettor.chips;
    player.pos      = 0;     // start at GO
    player.out      = false;
    player.inJail   = false;

    if (chosenSquare) {
      chosenSquare.owner  = player.id;
      chosenSquare.houses = 5;   // 5 = hotel in classic Monopoly convention
      UI.updateSquareHouses(chosenSquare);
      addLog(t('log_bet_reentry', {
        name:     player.name,
        property: t(chosenSquare.nameKey),
        money:    player.money,
      }));
    } else {
      addLog(t('log_bet_reentry_cash', { name: player.name, money: player.money }));
    }

    // Remove from bettors list
    bettors = bettors.filter(b => b.id !== bettor.id);
    UI.removeBettorPanel(bettor.id);
    UI.movePawn(player);
    UI.updatePlayerPanel(player);

    UI.showAlert(t('alert_reentry', { name: player.name }));
    Sync.pushGameState();
  }

  /* ══════════════════════════════════════════
     HELPERS
  ══════════════════════════════════════════ */

  function getBettors()          { return bettors; }
  function hasBettors()          { return bettors.length > 0; }
  function getBettor(id)         { return bettors.find(b => b.id === id); }

  // Serialise for Firebase
  function serialise() {
    return bettors.map(b => ({ ...b }));
  }

  // Restore from Firebase snapshot
  function hydrate(data) {
    if (!Array.isArray(data)) return;
    bettors = data;
    bettors.forEach(b => UI.addBettorPanel(b));
  }

  /* ── Public API ───────────────────────────── */
  return {
    enrolPlayer,
    placeBet,
    resolveBets,
    getBettors,
    hasBettors,
    getBettor,
    serialise,
    hydrate,
    BET_TYPES,
    PAYOUTS,
    REENTRY_THRESHOLD,
  };

})();
