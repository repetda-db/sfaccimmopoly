/* ============================================
   SFACCIMMOPOLY — GAME ACTIONS
   Buy · Rent · Build · Mortgage · Bankruptcy
   ============================================ */

'use strict';

const GameActions = (() => {

  /* ── Constants ────────────────────────────── */
  const HOUSE_LIMIT = 4;
  const HOTEL_LIMIT = 1;

  /* ══════════════════════════════════════════
     LANDING ON PROPERTY / STATION / UTILITY
  ══════════════════════════════════════════ */

  function handlePropertyLanding(player, square) {

    // Unowned → offer to buy
    if (!square.owner) {
      if (player.money >= square.price) {
        UI.showBuyModal(player, square, {
          onBuy:  () => buyProperty(player, square),
          onSkip: () => endTurn(),          // game-core.js
        });
      } else {
        addLog(t('log_cant_afford', { name: player.name, square: square.name }));
        endTurn();
      }
      return;
    }

    // Owned by self → nothing
    if (square.owner === player.id) {
      addLog(t('log_own_property', { name: player.name }));
      endTurn();
      return;
    }

    // Mortgaged → no rent
    if (square.mortgaged) {
      addLog(t('log_mortgaged', { square: square.name }));
      endTurn();
      return;
    }

    // Owned by another active player → pay rent
    const owner = getPlayerById(square.owner);
    if (owner && !owner.out) {
      const rent = calculateRent(square, owner);
      payRent(player, owner, rent, square);
    } else {
      endTurn();
    }
  }

  /* ══════════════════════════════════════════
     BUY PROPERTY
  ══════════════════════════════════════════ */

  function buyProperty(player, square) {
    if (player.money < square.price) return;

    player.money      -= square.price;
    square.owner       = player.id;
    square.houses      = 0;
    square.mortgaged   = false;

    player.properties.push(square.index);

    addLog(t('log_bought', { name: player.name, square: square.name, price: square.price }));
    UI.updatePlayerPanel(player);
    UI.updateSquareOwner(square);
    Sync.pushGameState();

    endTurn();
  }

  /* ══════════════════════════════════════════
     RENT CALCULATION
  ══════════════════════════════════════════ */

  function calculateRent(square, owner) {

    // ── Station ──
    if (square.type === 'station') {
      const ownedStations = getStations().filter(s => s.owner === owner.id).length;
      return square.rent[ownedStations - 1] ?? 25;
    }

    // ── Utility ──
    if (square.type === 'utility') {
      const ownedUtils = getUtilities().filter(u => u.owner === owner.id).length;
      const [d1, d2]   = GameState.dice;
      const multiplier = ownedUtils === 2 ? 10 : 4;
      return (d1 + d2) * multiplier;
    }

    // ── Property ──
    const group        = getColorGroup(square.color);
    const ownsFullSet  = group.every(s => s.owner === owner.id);

    // Hotels
    if (square.houses === 5) return square.rent[5];

    // Houses
    if (square.houses > 0) return square.rent[square.houses];

    // Bare land — double if full set
    return ownsFullSet ? square.rent[0] * 2 : square.rent[0];
  }

  /* ══════════════════════════════════════════
     PAY RENT
  ══════════════════════════════════════════ */

  function payRent(payer, owner, amount, square) {
    const actual = Math.min(amount, payer.money); // can't pay more than you have

    payer.money -= actual;
    owner.money += actual;

    addLog(t('log_rent_paid', {
      payer: payer.name,
      owner: owner.name,
      amount: actual,
      square: square.name,
    }));

    UI.updatePlayerPanel(payer);
    UI.updatePlayerPanel(owner);
    UI.showToast(t('toast_rent', { amount: actual }), 'warning');
    Sync.pushGameState();

    // Check bankruptcy
    if (payer.money <= 0) {
      declareBankruptcy(payer, owner);
    } else {
      endTurn();
    }
  }

  /* ══════════════════════════════════════════
     TAX
  ══════════════════════════════════════════ */

  function payTax(player, amount) {
    const actual = Math.min(amount, player.money);
    player.money -= actual;

    addLog(t('log_tax_paid', { name: player.name, amount: actual }));
    UI.updatePlayerPanel(player);
    UI.showToast(t('toast_tax', { amount: actual }), 'warning');
    Sync.pushGameState();

    if (player.money <= 0) {
      declareBankruptcy(player, null);
    } else {
      endTurn();
    }
  }

  /* ══════════════════════════════════════════
     BUILD HOUSES / HOTELS
  ══════════════════════════════════════════ */

  function canBuild(player, square) {
    if (square.type !== 'property') return false;
    if (square.owner !== player.id) return false;
    if (square.mortgaged)           return false;
    if (square.houses >= 5)         return false;   // 5 = hotel

    // Must own full color group
    const group = getColorGroup(square.color);
    if (!group.every(s => s.owner === player.id)) return false;

    // Even build rule: can't build if another in group has fewer houses
    const minHouses = Math.min(...group.map(s => s.houses));
    if (square.houses > minHouses) return false;

    return player.money >= square.houseCost;
  }

  function buildHouse(player, square) {
    if (!canBuild(player, square)) {
      UI.showToast(t('toast_cant_build'), 'danger');
      return false;
    }

    player.money  -= square.houseCost;
    square.houses += 1;

    const built = square.houses === 5 ? t('hotel') : t('house');
    addLog(t('log_built', { name: player.name, built, square: square.name }));

    UI.updatePlayerPanel(player);
    UI.updateSquareHouses(square);
    Sync.pushGameState();
    return true;
  }

  function sellHouse(player, square) {
    if (square.owner !== player.id || square.houses === 0) return false;

    const refund     = Math.floor(square.houseCost / 2);
    player.money    += refund;
    square.houses   -= 1;

    addLog(t('log_sold_house', { name: player.name, square: square.name, refund }));
    UI.updatePlayerPanel(player);
    UI.updateSquareHouses(square);
    Sync.pushGameState();
    return true;
  }

  /* ══════════════════════════════════════════
     MORTGAGE
  ══════════════════════════════════════════ */

  function mortgageProperty(player, square) {
    if (square.owner !== player.id)  return false;
    if (square.mortgaged)            return false;
    if (square.houses > 0)           return false;   // sell houses first

    square.mortgaged = true;
    player.money    += square.mortgage;

    addLog(t('log_mortgaged_prop', { name: player.name, square: square.name, amount: square.mortgage }));
    UI.updatePlayerPanel(player);
    UI.updateSquareOwner(square);
    Sync.pushGameState();
    return true;
  }

  function unmortgageProperty(player, square) {
    if (square.owner !== player.id) return false;
    if (!square.mortgaged)          return false;

    const cost = Math.floor(square.mortgage * 1.1); // 10% interest
    if (player.money < cost)        return false;

    player.money    -= cost;
    square.mortgaged = false;

    addLog(t('log_unmortgaged', { name: player.name, square: square.name, cost }));
    UI.updatePlayerPanel(player);
    UI.updateSquareOwner(square);
    Sync.pushGameState();
    return true;
  }

  /* ══════════════════════════════════════════
     TRADE
  ══════════════════════════════════════════ */

  /**
   * trade({ from, to, properties: [], cash: 0 })
   * Both sides optionally offer properties + cash.
   */
  function executeTrade(offer) {
    const { fromPlayer, toPlayer, fromProps, toProps, fromCash, toCash } = offer;

    // Validate funds
    if (fromPlayer.money < fromCash) return false;
    if (toPlayer.money   < toCash)   return false;

    // Transfer cash
    fromPlayer.money -= fromCash;
    toPlayer.money   += fromCash;
    toPlayer.money   -= toCash;
    fromPlayer.money += toCash;

    // Transfer properties A→B
    fromProps.forEach(idx => {
      const sq       = getSquare(idx);
      sq.owner       = toPlayer.id;
      sq.houses      = 0;           // houses reset on trade
      sq.mortgaged   = false;
      fromPlayer.properties = fromPlayer.properties.filter(i => i !== idx);
      toPlayer.properties.push(idx);
      UI.updateSquareOwner(sq);
    });

    // Transfer properties B→A
    toProps.forEach(idx => {
      const sq       = getSquare(idx);
      sq.owner       = fromPlayer.id;
      sq.houses      = 0;
      sq.mortgaged   = false;
      toPlayer.properties = toPlayer.properties.filter(i => i !== idx);
      fromPlayer.properties.push(idx);
      UI.updateSquareOwner(sq);
    });

    addLog(t('log_trade', { from: fromPlayer.name, to: toPlayer.name }));
    UI.updatePlayerPanel(fromPlayer);
    UI.updatePlayerPanel(toPlayer);
    Sync.pushGameState();
    return true;
  }

  /* ══════════════════════════════════════════
     BANKRUPTCY
  ══════════════════════════════════════════ */

  /**
   * creditor = null means owed to bank (tax / card)
   */
  function declareBankruptcy(player, creditor) {
    addLog(t('log_bankrupt', { name: player.name }));
    UI.showToast(t('toast_bankrupt', { name: player.name }), 'danger');

    if (creditor) {
      // Give all assets to creditor
      player.properties.forEach(idx => {
        const sq       = getSquare(idx);
        sq.owner       = creditor.id;
        sq.houses      = 0;
        sq.mortgaged   = false;
        creditor.properties.push(idx);
        UI.updateSquareOwner(sq);
      });
      creditor.money += player.money;
      UI.updatePlayerPanel(creditor);
    } else {
      // Return all to bank
      player.properties.forEach(idx => {
        const sq       = getSquare(idx);
        sq.owner       = null;
        sq.houses      = 0;
        sq.mortgaged   = false;
        UI.updateSquareOwner(sq);
      });
    }

    eliminatePlayer(player);   // game-core.js
    Sync.pushGameState();
  }

  /* ── Public API ───────────────────────────── */
  return {
    handlePropertyLanding,
    buyProperty,
    calculateRent,
    payRent,
    payTax,
    canBuild,
    buildHouse,
    sellHouse,
    mortgageProperty,
    unmortgageProperty,
    executeTrade,
    declareBankruptcy,
  };

})();
