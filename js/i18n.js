/* i18n.js — SOSTITUISCI INTERAMENTE con questo */
'use strict';

/**
 * Thin wrapper around Translations.
 * Reads/writes language from localStorage.
 * Applies data-i18n attributes to the DOM.
 */
const i18n = {

  get lang() {
    return Translations.getLanguage();
  },

  /**
   * Translate a key with optional vars.
   * Delegates to Translations.t()
   * Keys use snake_case: 'btn_roll_dice', 'msg_rolled', etc.
   */
  t(key, vars) {
    return Translations.t(key, vars);
  },

  /** Change language, persist to localStorage, update DOM */
  setLang(lang) {
    Translations.setLanguage(lang);
    localStorage.setItem('sfaccimmopoly_lang', lang);
    this.applyDOM();
    this._updateLangButtons(lang);
  },

  /** Apply data-i18n attributes to all elements in the DOM */
  applyDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const translated = Translations.t(key);
      if (translated && translated !== key) {
        el.textContent = translated;
      }
    });
  },

  /** Highlight active lang button */
  _updateLangButtons(lang) {
    document.querySelectorAll('[data-lang]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    document.documentElement.lang = lang;
  },

  /** Init: restore saved language + apply DOM */
  init() {
    const saved = localStorage.getItem('sfaccimmopoly_lang')
                  || GAME_CONFIG.defaultLanguage
                  || 'it';
    Translations.setLanguage(saved);
    this._updateLangButtons(saved);

    // Wire lang buttons automatically
    document.querySelectorAll('[data-lang]').forEach(btn => {
      btn.addEventListener('click', () => this.setLang(btn.dataset.lang));
    });

    // Apply translations on languageChanged event
    document.addEventListener('languageChanged', () => this.applyDOM());

    this.applyDOM();
  }
};

/* Single global shorthand — ONE definition only */
const t = (key, vars) => Translations.t(key, vars);

window.i18n = i18n;
window.t    = t;
