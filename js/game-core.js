/* ============================================
   SFACCIMMOPOLY — GAME CORE
   Turn engine · Dice · Movement · Jail logic
   ============================================ */

'use strict';

/* ── Shared GameState ───────────────────────── */
const GameState = {
  roomId:        null,
  localPlayerId: null,
  players:       [],   // [{id, name, color, pos, money, jail, jailTurns, out, properties}]
  currentTurn:   0,    // index into players[]
  dice:          [0,0],
  doublesCount:  0,
  phase:         'waiting', // waiting | rolling | landed | buying | done
  turnOrder:     [],   // player ids in turn order
  settings:      {},   // quickMode, bettingMode, maxPlayers, etc.
  log:           [],   // [{text, ts}]
};

/* ── Constants ──────────────────────────────── */
const JAIL_POSITION    = 10;
const GO_POSITION      = 0;
const GO_SALARY        = 200;
const MAX_DOUBLES      = 3;
const JAIL_MAX_TURNS   = 3;
const JAIL_FINE        = 50;

/* ── Dice ───────────────────────────────────── */

function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

function rollDice() {
  const d1 = rollDie();
  const d2 = rollDie();
  GameState.dice = [d1, d2];
  return { d1, d2, isDouble: d1 === d2, total: d1 + d2 };
}

/* ── Logging ────────────────────────────────── */

function addLog(text) {
  const entry = { text, ts: Date.now() };
  GameState.log.push(entry);
  if (GameState.log.length > 100) GameState.log.shift();
  UI.appendLog(entry);          // ui.js
  Sync.pushLog(entry);          // sync.js
}

/* ── Player helpers ─────────────────────────── */

function currentPlayer() {
  return GameState.players[GameState.currentTurn] ?? null;
}

function getPlayerById(id) {
  return GameState.players.find(p => p.id === id) ?? null;
}

function isLocalTurn() {
  const p = currentPlayer();
  return p && p.id === GameState.localPlayerId;
}

/* ── Movement ───────────────────────────────── */

/**
 * Move player forward by `steps` squares.
 * Awards GO salary if passing index 0.
 */
function movePlayer(player, steps) {
  const oldPos = player.pos;
  const newPos = (oldPos + steps) % 40;

  // Passed GO?
  if (newPos < oldPos && steps > 0) {
    player.money += GO_SALARY;
    addLog(t('log_pass_go', { name: player.name, amount: GO_SALARY }));
    UI.showToast(t('toast_pass_go', { amount: GO_SALARY }));
  }

  player.pos = newPos;
  UI.moveToken(player.id, newPos);
  return newPos;
}

/**
 * Teleport player to exact position (cards, go-to-jail, etc.)
 * `collectGo` — whether passing GO counts.
 */
function teleportPlayer(player, targetPos, collectGo = false) {
  if (collectGo && targetPos < player.pos) {
    player.money += GO_SALARY;
    addLog(t('log_pass_go', { name: player.name, amount: GO_SALARY }));
  }
  player.pos = targetPos;
  UI.moveToken(player.id, targetPos);
}

/* ── Jail ───────────────────────────────────── */

function sendToJail(player) {
  player.jail       = true;
  player.jailTurns  = 0;
  player.pos        = JAIL_POSITION;
  UI.moveToken(player.id, JAIL_POSITION);
  addLog(t('log_go_to_jail', { name: player.name }));
  UI.showToast(t('toast_jail', { name: player.name }), 'danger');
}

/**
 * Attempt to leave jail.
 * Returns { freed, method }
 */
function tryLeaveJail(player, roll) {
  const { d1, d2, isDouble } = roll;

  if (isDouble) {
    player.jail      = false;
    player.jailTurns = 0;
    addLog(t('log_jail_double', { name: player.name }));
    return { freed: true, method: 'double' };
  }

  player.jailTurns++;

  if (player.jailTurns >= JAIL_MAX_TURNS) {
    // Forced to pay fine
    player.money    -= JAIL_FINE;
    player.jail      = false;
    player.jailTurns = 0;
    addLog(t('log_jail_fine', { name: player.name, amount: JAIL_FINE }));
    return { freed: true, method: 'fine' };
  }

  addLog(t('log_jail_stuck', { name: player.name, turns: player.jailTurns }));
  return { freed: false, method: null };
}

function payJailFine(player) {
  if (!player.jail) return;
  player.money    -= JAIL_FINE;
  player.jail      = false;
  player.jailTurns = 0;
  addLog(t('log_jail_paid', { name: player.name, amount: JAIL_FINE }));
}

function useJailCard(player) {
  if (!player.jailCard) return false;
  player.jailCard  = false;
  player.jail      = false;
  player.jailTurns = 0;
  addLog(t('log_jail_card', { name: player.name }));
  return true;
}

/* ── Landing handler ────────────────────────── */

/**
 * Called after token reaches its final square.
 * Delegates to GameActions for money logic.
 */
function handleLanding(player, squareIndex) {
  const square = getSquare(squareIndex);
  if (!square) return;

  addLog(t('log_landed', { name: player.name, square: square.name }));

  switch (square.type) {

    case 'property':
    case 'station':
    case 'utility':
      GameActions.handlePropertyLanding(player, square);
      break;

    case 'tax':
      GameActions.payTax(player, square.amount);
      break;

    case 'chance':
      Cards.drawChance(player);
      break;

    case 'chest':
      Cards.drawChest(player);
      break;

    case 'corner':
      if (squareIndex === 30) {       // "Go To Jail" corner
        sendToJail(player);
      }
      // Free Parking & Jail/Visit → no action
      break;

    default:
      break;
  }
}

/* ── Main turn flow ─────────────────────────── */

/**
 * Entry point: called when local player clicks ROLL.
 */
function takeTurn() {
  const player = currentPlayer();
  if (!player || !isLocalTurn()) return;
  if (GameState.phase !== 'rolling') return;

  const roll = rollDice();
  const { d1, d2, isDouble, total } = roll;

  addLog(t('log_rolled', { name: player.name, d1, d2 }));
  UI.showDice(d1, d2);
  Sync.pushDiceRoll(d1, d2);

  // ── Jail branch ──
  if (player.jail) {
    const result = tryLeaveJail(player, roll);
    if (!result.freed) {
      endTurn();
      return;
    }
    // freed → fall through to move
  }

  // ── Doubles → 3rd double = jail ──
  if (isDouble) {
    GameState.doublesCount++;
    if (GameState.doublesCount >= MAX_DOUBLES) {
      sendToJail(player);
      endTurn();
      return;
    }
  } else {
    GameState.doublesCount = 0;
  }

  // ── Move ──
  GameState.phase = 'landed';
  const newPos = movePlayer(player, total);
  handleLanding(player, newPos);

  // ── Doubles get another roll (unless in jail) ──
  if (isDouble && !player.jail) {
    addLog(t('log_double_again', { name: player.name }));
    GameState.phase = 'rolling';
    UI.enableRollButton();
    return;
  }

  // Phase now managed by GameActions (buy modal, etc.)
  // endTurn() is called from there when player is done.
}

/* ── End turn ───────────────────────────────── */

function endTurn() {
  GameState.doublesCount = 0;
  GameState.phase        = 'rolling';

  // Advance to next active player
  const total = GameState.players.length;
  let next    = (GameState.currentTurn + 1) % total;
  let loops   = 0;

  while (GameState.players[next].out && loops < total) {
    next = (next + 1) % total;
    loops++;
  }

  GameState.currentTurn = next;

  Sync.pushTurnChange(next);
  UI.updateTurnIndicator();
  UI.disableRollButton();

  if (isLocalTurn()) {
    UI.enableRollButton();
  }

  addLog(t('log_turn_start', { name: currentPlayer().name }));

  // Betting mode: let eliminated players bet
  if (GameState.settings.bettingMode) {
    BettingMode.openBettingWindow();
  }
}

/* ── Elimination ────────────────────────────── */

function eliminatePlayer(player) {
  player.out = true;

  // Return properties to bank
  player.properties.forEach(idx => {
    const sq = getSquare(idx);
    if (sq) {
      sq.owner    = null;
      sq.houses   = 0;
      sq.mortgaged = false;
    }
  });
  player.properties = [];
  player.money      = 0;

  addLog(t('log_eliminated', { name: player.name }));
  UI.markPlayerEliminated(player.id);

  checkWinCondition();

  if (GameState.settings.bettingMode) {
    BettingMode.registerEliminated(player);
  }
}

/* ── Win condition ──────────────────────────── */

function checkWinCondition() {
  const alive = GameState.players.filter(p => !p.out);
  if (alive.length === 1) {
    const winner = alive[0];
    addLog(t('log_winner', { name: winner.name }));
    UI.showWinScreen(winner);
    GameState.phase = 'done';
    Sync.pushGameOver(winner.id);
  }
}

/* ── Init ───────────────────────────────────── */

function initGame(roomData, localPlayerId) {
  GameState.roomId        = roomData.id;
  GameState.localPlayerId = localPlayerId;
  GameState.settings      = roomData.settings ?? {};
  GameState.phase         = 'rolling';
  GameState.currentTurn   = 0;
  GameState.doublesCount  = 0;
  GameState.log           = [];

  // Build player list from room data
  GameState.players = roomData.players.map(p => ({
    id:         p.id,
    name:       p.name,
    color:      p.color,
    pos:        0,
    money:      GameState.settings.startMoney ?? 1500,
    jail:       false,
    jailTurns:  0,
    jailCard:   false,
    out:        false,
    properties: [],
  }));

  GameState.turnOrder = GameState.players.map(p => p.id);

  UI.renderBoard();
  UI.renderPlayers(GameState.players);
  UI.updateTurnIndicator();

  if (isLocalTurn()) UI.enableRollButton();

  addLog(t('log_game_start'));
}

/* ============================================
   SFACCIMMOPOLY — GAME LOGIC FACADE
   Esponde un oggetto/classe GameLogic per i
   file che lo cercano (main.js, UI, ecc.)
   ============================================ */

class GameLogic {
  constructor(roomData, localPlayerId) {
    if (roomData) this.init(roomData, localPlayerId);
  }

  /* ── Stato di gioco (getter di comodo) ─────── */
  get state()        { return GameState; }
  get current()      { return currentPlayer(); }
  get players()      { return GameState.players; }
  get dice()         { return GameState.dice; }
  get phase()        { return GameState.phase; }
  get turnIndex()    { return GameState.currentTurn; }

  /* ── Inizializzazione / flusso turno ───────── */
  init(roomData, localId)      { return initGame(roomData, localId); }
  startTurn()                  { return takeTurn(); }
  end()                        { return endTurn(); }

  /* ── Dadi & movimento ──────────────────────── */
  roll()                       { return rollDice(); }
  move(player, steps)          { return movePlayer(player, steps); }
  teleport(player, pos, collect) { return teleportPlayer(player, pos, collect); }

  /* ── Prigione ──────────────────────────────── */
  jail(player)                 { return sendToJail(player); }
  tryJail(player, roll)        { return tryLeaveJail(player, roll); }
  payJail(player)              { return payJailFine(player); }
  useJailCard(player)          { return useJailCard(player); }

  /* ── Atterraggi & meta-gioco ───────────────── */
  land(player, squareIdx)      { return handleLanding(player, squareIdx); }
  eliminate(player)            { return eliminatePlayer(player); }
  checkWin()                   { return checkWinCondition(); }

  /* ── Utilità ───────────────────────────────── */
  playerById(id)               { return getPlayerById(id); }
  isLocal()                    { return isLocalTurn(); }
  log(text)                    { return addLog(text); }
}

/* Esponi nel scope globale per script non-modulari */
if (typeof window !== 'undefined') {
  window.GameLogic = GameLogic;
}
