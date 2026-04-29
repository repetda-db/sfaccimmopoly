'use strict';

/* ============================================
   SFACCIMMOPOLY — i18n bridge
   Wraps Translations.js for DOM binding
   ============================================ */

const I18n = {

  get lang() {
    return Translations.getLanguage();
  },

  /** Translate a key (with optional vars) */
  translate(key, vars) {
    return Translations.t(key, vars);
  },

  /** Change language and refresh DOM */
  setLang(lang) {
    Translations.setLanguage(lang);
    localStorage.setItem('sfaccimmopoly_lang', lang);
    this.applyDOM();
    this._updateLangButtons(lang);
  },

  /** Apply translations to all [data-i18n] elements */
  applyDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const translated = Translations.t(key);
      if (translated && translated !== key) {
        el.textContent = translated;
      }
    });

    // Placeholders: <input data-i18n-placeholder="...">
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      const translated = Translations.t(key);
      if (translated && translated !== key) {
        el.placeholder = translated;
      }
    });
  },

  _updateLangButtons(lang) {
    document.querySelectorAll('[data-lang]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    document.documentElement.lang = lang;
  },

  /** Initialize: load saved lang, bind buttons, apply DOM */
  init() {
    const saved = localStorage.getItem('sfaccimmopoly_lang')
               || GAME_CONFIG.defaultLanguage
               || 'it';

    Translations.setLanguage(saved);

    document.querySelectorAll('[data-lang]').forEach(btn => {
      btn.addEventListener('click', () => this.setLang(btn.dataset.lang));
    });

    this.applyDOM();
    this._updateLangButtons(saved);
  }
};

// Expose globally — both names for compatibility
window.I18n = I18n;
window.i18n = I18n;
