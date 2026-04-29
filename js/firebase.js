/* ============================================
   SFACCIMMOPOLY — FIREBASE
   Init + Realtime Database helpers
   ============================================ */

/* ---------- Initialize Firebase ---------- */
firebase.initializeApp(firebaseConfig);  
const db = firebase.database();

/* ============================================
   DB — Low-level helpers
   All paths go through here — easy to refactor
   ============================================ */
const DB = {

  /* ---- ROOMS ---- */

  /** Get a one-time snapshot of all rooms */
  async getRooms() {
    const snap = await db.ref('rooms').once('value');
    return snap.val() || {};
  },

  /** Listen to rooms list in real time */
  onRooms(callback) {
    const ref = db.ref('rooms');
    ref.on('value', snap => callback(snap.val() || {}));
    return () => ref.off('value'); // returns unsubscribe fn
  },

  /** Create a new room */
  async createRoom(roomId, roomData) {
    await db.ref(`rooms/${roomId}`).set(roomData);
  },

  /** Get a one-time snapshot of a single room */
  async getRoom(roomId) {
    const snap = await db.ref(`rooms/${roomId}`).once('value');
    return snap.val();
  },

  /** Listen to a single room in real time */
  onRoom(roomId, callback) {
    const ref = db.ref(`rooms/${roomId}`);
    ref.on('value', snap => callback(snap.val()));
    return () => ref.off('value');
  },

  /** Update specific fields inside a room */
  async updateRoom(roomId, updates) {
    await db.ref(`rooms/${roomId}`).update(updates);
  },

  /** Delete a room entirely */
  async deleteRoom(roomId) {
    await db.ref(`rooms/${roomId}`).remove();
  },

  /* ---- PLAYERS inside a room ---- */

  /** Add or overwrite a player in a room */
  async setPlayer(roomId, playerId, playerData) {
    await db.ref(`rooms/${roomId}/players/${playerId}`).set(playerData);
  },

  /** Update specific fields of a player */
  async updatePlayer(roomId, playerId, updates) {
    await db.ref(`rooms/${roomId}/players/${playerId}`).update(updates);
  },

  /** Remove a player from a room */
  async removePlayer(roomId, playerId) {
    await db.ref(`rooms/${roomId}/players/${playerId}`).remove();
  },

  /** Listen to all players in a room */
  onPlayers(roomId, callback) {
    const ref = db.ref(`rooms/${roomId}/players`);
    ref.on('value', snap => callback(snap.val() || {}));
    return () => ref.off('value');
  },

  /* ---- GAME STATE ---- */

  /** Listen to game state */
  onGameState(roomId, callback) {
    const ref = db.ref(`rooms/${roomId}/gameState`);
    ref.on('value', snap => callback(snap.val() || {}));
    return () => ref.off('value');
  },

  /** Update game state fields */
  async updateGameState(roomId, updates) {
    await db.ref(`rooms/${roomId}/gameState`).update(updates);
  },

  /* ---- TRANSACTIONS (atomic updates) ---- */

  /**
   * Atomically update a player's balance.
   * Prevents race conditions when multiple clients
   * update money at the same time.
   */
  async transactBalance(roomId, playerId, delta) {
    const ref = db.ref(`rooms/${roomId}/players/${playerId}/balance`);
    await ref.transaction(current => {
      return (current || 0) + delta;
    });
  },

  /* ---- LOG / EVENTS ---- */

  /** Push a new event to the room log */
  async pushLog(roomId, entry) {
    await db.ref(`rooms/${roomId}/log`).push({
      ...entry,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
  },

  /** Listen to the last N log entries */
  onLog(roomId, callback, limit = 20) {
    const ref = db.ref(`rooms/${roomId}/log`).limitToLast(limit);
    ref.on('value', snap => {
      const raw = snap.val() || {};
      const entries = Object.values(raw).sort((a, b) => a.timestamp - b.timestamp);
      callback(entries);
    });
    return () => ref.off('value');
  },

  /* ---- PRESENCE ---- */

  /**
   * Mark a player as online/offline automatically.
   * Firebase's onDisconnect fires even if the tab crashes.
   */
  async setPresence(roomId, playerId) {
    const presenceRef = db.ref(`rooms/${roomId}/players/${playerId}/online`);
    const connRef     = db.ref('.info/connected');

    connRef.on('value', snap => {
      if (snap.val() === true) {
        presenceRef.onDisconnect().set(false);
        presenceRef.set(true);
      }
    });
  },

  /* ---- UTILS ---- */

  /** Generate a unique room ID (6 chars, uppercase) */
  generateRoomId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
    return Array.from({ length: 6 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  },

  /** Generate a player ID from name + timestamp */
  generatePlayerId(name) {
    const slug = name.trim().toLowerCase().replace(/\s+/g, '_');
    return `${slug}_${Date.now()}`;
  }
};

/* Expose globally */
window.db  = db;
window.DB  = DB;
