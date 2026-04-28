/* ============================================
   SFACCIMMOPOLY — INTERNATIONALIZATION (i18n)
   Translations: Italian (it) + English (en)
   ============================================ */

const TRANSLATIONS = {

  /* -------- LOGIN PAGE -------- */
  login: {
    title: {
      it: '🎲 Sfaccimmopoly',
      en: '🎲 Sfaccimmopoly'
    },
    subtitle: {
      it: 'Il Monopoly dei Sfaccimm\'',
      en: 'The Sfaccimm\' Monopoly'
    },
    placeholder: {
      it: 'Inserisci la password...',
      en: 'Enter password...'
    },
    button: {
      it: 'Entra',
      en: 'Enter'
    },
    error: {
      it: '❌ Password errata! Sfaccimm\'...',
      en: '❌ Wrong password! Sfaccimm\'...'
    },
    footer: {
      it: 'Solo per amici fidati 🤌',
      en: 'For trusted friends only 🤌'
    }
  },

  /* -------- LOBBY PAGE -------- */
  lobby: {
    title: {
      it: '🎲 Sfaccimmopoly',
      en: '🎲 Sfaccimmopoly'
    },
    welcome: {
      it: 'Benvenuto, {name}! 👋',
      en: 'Welcome, {name}! 👋'
    },
    chooseRoom: {
      it: 'Scegli o crea una partita',
      en: 'Choose or create a game'
    },
    createRoom: {
      it: '➕ Crea nuova partita',
      en: '➕ Create new game'
    },
    roomNamePlaceholder: {
      it: 'Nome partita (es. Serata pizza)',
      en: 'Game name (e.g. Pizza night)'
    },
    yourName: {
      it: 'Il tuo nome',
      en: 'Your name'
    },
    yourNamePlaceholder: {
      it: 'Come ti chiamano...',
      en: 'What they call you...'
    },
    chooseToken: {
      it: 'Scegli la tua pedina',
      en: 'Choose your token'
    },
    joinRoom: {
      it: 'Entra nella partita',
      en: 'Join game'
    },
    startGame: {
      it: '🎮 Inizia partita',
      en: '🎮 Start game'
    },
    waitingForPlayers: {
      it: 'In attesa di giocatori... ({count}/{max})',
      en: 'Waiting for players... ({count}/{max})'
    },
    players: {
      it: 'Giocatori',
      en: 'Players'
    },
    activeRooms: {
      it: 'Partite attive',
      en: 'Active games'
    },
    noRooms: {
      it: 'Nessuna partita attiva. Creane una!',
      en: 'No active games. Create one!'
    },
    tokenTaken: {
      it: '⚠️ Pedina già presa!',
      en: '⚠️ Token already taken!'
    },
    nameMissing: {
      it: '⚠️ Inserisci il tuo nome!',
      en: '⚠️ Enter your name!'
    },
    roomFull: {
      it: '⚠️ Partita piena!',
      en: '⚠️ Game is full!'
    },
    logout: {
      it: 'Esci',
      en: 'Logout'
    }
  },

  /* -------- GAME PAGE -------- */
  game: {
    /* -- Bank & money -- */
    bank: {
      it: 'Banca',
      en: 'Bank'
    },
    balance: {
      it: 'Saldo',
      en: 'Balance'
    },
    pay: {
      it: 'Paga',
      en: 'Pay'
    },
    collect: {
      it: 'Incassa',
      en: 'Collect'
    },
    transfer: {
      it: 'Trasferisci',
      en: 'Transfer'
    },
    amount: {
      it: 'Importo (€)',
      en: 'Amount (€)'
    },
    to: {
      it: 'A',
      en: 'To'
    },
    from: {
      it: 'Da',
      en: 'From'
    },
    confirm: {
      it: '✅ Conferma',
      en: '✅ Confirm'
    },
    cancel: {
      it: '❌ Annulla',
      en: '❌ Cancel'
    },

    /* -- Dice -- */
    rollDice: {
      it: '🎲 Lancia i dadi',
      en: '🎲 Roll dice'
    },
    rolled: {
      it: '{name} ha lanciato {total} ({d1}+{d2})',
      en: '{name} rolled {total} ({d1}+{d2})'
    },
    doubles: {
      it: '🎉 Doppio! Lancia ancora!',
      en: '🎉 Doubles! Roll again!'
    },

    /* -- Properties -- */
    properties: {
      it: 'Proprietà',
      en: 'Properties'
    },
    buyProperty: {
      it: 'Acquista per €{price}',
      en: 'Buy for €{price}'
    },
    mortgage: {
      it: 'Ipoteca',
      en: 'Mortgage'
    },
    unmortgage: {
      it: 'Riscatta',
      en: 'Unmortgage'
    },
    buildHouse: {
      it: '🏠 Costruisci casa (€{price})',
      en: '🏠 Build house (€{price})'
    },
    buildHotel: {
      it: '🏨 Costruisci hotel (€{price})',
      en: '🏨 Build hotel (€{price})'
    },
    sellHouse: {
      it: 'Vendi casa',
      en: 'Sell house'
    },
    sellHotel: {
      it: 'Vendi hotel',
      en: 'Sell hotel'
    },
    rent: {
      it: 'Affitto',
      en: 'Rent'
    },
    owner: {
      it: 'Proprietario',
      en: 'Owner'
    },
    mortgaged: {
      it: '🔴 Ipotecata',
      en: '🔴 Mortgaged'
    },
    noProperties: {
      it: 'Nessuna proprietà',
      en: 'No properties'
    },

    /* -- Special squares -- */
    goSquare: {
      it: '⬆️ Via! Incassa €{amount}',
      en: '⬆️ GO! Collect €{amount}'
    },
    jailVisit: {
      it: '👁️ Solo in visita',
      en: '👁️ Just visiting'
    },
    goToJail: {
      it: '🚔 Vai in prigione!',
      en: '🚔 Go to jail!'
    },
    inJail: {
      it: '🔒 In prigione ({turns} turni)',
      en: '🔒 In jail ({turns} turns)'
    },
    freeParking: {
      it: '🅿️ Parcheggio gratuito',
      en: '🅿️ Free parking'
    },
    tax: {
      it: '💸 Tassa: paga €{amount}',
      en: '💸 Tax: pay €{amount}'
    },
    chanceCard: {
      it: '❓ Probabilità',
      en: '❓ Chance'
    },
    communityChest: {
      it: '📦 Fondi comuni',
      en: '📦 Community chest'
    },

    /* -- Cards -- */
    drawCard: {
      it: 'Pesca una carta',
      en: 'Draw a card'
    },
    getOutOfJailFree: {
      it: '🎫 Uscita gratuita dalla prigione',
      en: '🎫 Get out of jail free'
    },

    /* -- Players -- */
    players: {
      it: 'Giocatori',
      en: 'Players'
    },
    yourTurn: {
      it: '🟢 Tocca a te!',
      en: '🟢 Your turn!'
    },
    waitTurn: {
      it: '⏳ Turno di {name}',
      en: '⏳ {name}\'s turn'
    },
    nextTurn: {
      it: '➡️ Prossimo turno',
      en: '➡️ Next turn'
    },
    bankrupt: {
      it: '💀 {name} è fallito!',
      en: '💀 {name} is bankrupt!'
    },
    declareBankruptcy: {
      it: '💀 Dichiara fallimento',
      en: '💀 Declare bankruptcy'
    },
    winner: {
      it: '🏆 {name} ha vinto!',
      en: '🏆 {name} wins!'
    },

    /* -- Log -- */
    log: {
      it: 'Registro partita',
      en: 'Game log'
    },
    logEmpty: {
      it: 'Nessuna azione ancora.',
      en: 'No actions yet.'
    },

    /* -- Menu / controls -- */
    menu: {
      it: 'Menu',
      en: 'Menu'
    },
    leaveGame: {
      it: 'Abbandona partita',
      en: 'Leave game'
    },
    leaveConfirm: {
      it: 'Sei sicuro di voler abbandonare?',
      en: 'Are you sure you want to leave?'
    },
    endGame: {
      it: 'Termina partita',
      en: 'End game'
    },
    endGameConfirm: {
      it: 'Terminare la partita per tutti?',
      en: 'End the game for everyone?'
    },

    /* -- Errors -- */
    notEnoughMoney: {
      it: '⚠️ Fondi insufficienti!',
      en: '⚠️ Not enough money!'
    },
    invalidAmount: {
      it: '⚠️ Importo non valido!',
      en: '⚠️ Invalid amount!'
    },
    notYourTurn: {
      it: '⚠️ Non è il tuo turno!',
      en: '⚠️ Not your turn!'
    }
  },

  /* -------- COMMON -------- */
  common: {
    loading: {
      it: 'Caricamento...',
      en: 'Loading...'
    },
    error: {
      it: 'Errore',
      en: 'Error'
    },
    close: {
      it: 'Chiudi',
      en: 'Close'
    },
    yes: {
      it: 'Sì',
      en: 'Yes'
    },
    no: {
      it: 'No',
      en: 'No'
    },
    ok: {
      it: 'OK',
      en: 'OK'
    },
    currency: {
      it: '€',
      en: '€'
    }
  }
};

/* ============================================
   i18n ENGINE
   ============================================ */

const i18n = {

  /* Current language — read from localStorage or config default */
  lang: localStorage.getItem('sfaccimmopoly_lang') || GAME_CONFIG.defaultLanguage,

  /**
   * Get a translated string by dot-path key.
   * Supports {placeholder} substitution.
   *
   * Examples:
   *   t('login.button')              → "Entra"
   *   t('game.rolled', {name:'Luca', total:7, d1:4, d2:3})
   *                                  → "Luca ha lanciato 7 (4+3)"
   */
  t(key, vars = {}) {
    // Navigate the TRANSLATIONS object via dot-path
    const parts  = key.split('.');
    let   node   = TRANSLATIONS;

    for (const part of parts) {
      if (node[part] === undefined) {
        console.warn(`[i18n] Missing key: "${key}"`);
        return key; // Fallback: return the key itself
      }
      node = node[part];
    }

    // node should now be { it: '...', en: '...' }
    let text = node[this.lang] ?? node['it'] ?? key;

    // Replace {placeholder} tokens
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, v);
    }

    return text;
  },

  /**
   * Switch language and persist to localStorage.
   * Re-renders all elements that have a [data-i18n] attribute.
   */
  setLang(lang) {
    if (!['it', 'en'].includes(lang)) return;
    this.lang = lang;
    localStorage.setItem('sfaccimmopoly_lang', lang);
    this.applyToDOM();
  },

  /**
   * Auto-translate elements with [data-i18n="key"] attribute.
   * Also handles [data-i18n-placeholder] and [data-i18n-title].
   */
  applyToDOM() {
    // Text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      el.textContent = this.t(key);
    });

    // Placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      el.placeholder = this.t(key);
    });

    // Title attribute (tooltips)
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.dataset.i18nTitle;
      el.title = this.t(key);
    });

    // Update lang buttons active state
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === this.lang);
    });

    // Update <html lang="...">
    document.documentElement.lang = this.lang;
  }
};

/* Shorthand — use t('key') anywhere instead of i18n.t('key') */
const t = (key, vars) => i18n.t(key, vars);

/* Expose globally */
window.i18n = i18n;
window.t    = t;
