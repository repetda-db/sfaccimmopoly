/* ============================================
   SFACCIMMOPOLY — AUTH
   Handles password gate + session persistence
   ============================================ */

const Auth = {

  /* ----------------------------------------
     Check if user is already authenticated
     (called on every page load)
  ---------------------------------------- */
  isAuthenticated() {
    return sessionStorage.getItem(GAME_CONFIG.sessionKey) === 'true';
  },

  /* ----------------------------------------
     Hash a plain-text password with SHA-256
     Returns a Promise<string> (hex)
  ---------------------------------------- */
  async hashPassword(plain) {
    const encoded = new TextEncoder().encode(plain);
    const buffer  = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  },

  /* ----------------------------------------
     Attempt login — compare hash
     Returns Promise<true> or throws Error
  ---------------------------------------- */
  async login(plainPassword) {
    const hash = await this.hashPassword(plainPassword);

    if (hash !== PASSWORD_HASH) {
      throw new Error('wrong_password');
    }

    // Persist auth for this browser session
    sessionStorage.setItem(GAME_CONFIG.sessionKey, 'true');
    return true;
  },

  /* ----------------------------------------
     Logout — clear session and redirect
  ---------------------------------------- */
  logout() {
    sessionStorage.removeItem(GAME_CONFIG.sessionKey);
    window.location.href = 'index.html';
  },

  /* ----------------------------------------
     Guard — call at top of protected pages.
     Redirects to login if not authenticated.
  ---------------------------------------- */
  guard() {
    if (!this.isAuthenticated()) {
      window.location.href = 'index.html';
    }
  },

  /* ----------------------------------------
     Save player profile to localStorage
  ---------------------------------------- */
  savePlayer(name, token) {
    const player = { name: name.trim(), token };
    localStorage.setItem(GAME_CONFIG.playerKey, JSON.stringify(player));
    return player;
  },

  /* ----------------------------------------
     Load saved player profile (or null)
  ---------------------------------------- */
  loadPlayer() {
    try {
      const raw = localStorage.getItem(GAME_CONFIG.playerKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /* ----------------------------------------
     Clear saved player profile
  ---------------------------------------- */
  clearPlayer() {
    localStorage.removeItem(GAME_CONFIG.playerKey);
  }
};

/* Expose globally */
window.Auth = Auth;
