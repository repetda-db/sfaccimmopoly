'use strict';

/* ============================================
   SFACCIMMOPOLY — IMAGES.JS
   Centralised image path resolver +
   lazy loader + graceful fallback
   ============================================ */

const Images = (() => {

  /* ══════════════════════════════════════════
     CONFIG
  ══════════════════════════════════════════ */
  const BASE = 'images/';

  /* Inline SVG fallback (grey square) */
  const FALLBACK_SVG =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' " +
    "width='100' height='100'%3E%3Crect width='100' height='100' " +
    "fill='%23cccccc'/%3E%3Ctext x='50' y='54' text-anchor='middle' " +
    "font-size='12' fill='%23666'%3E?%3C/text%3E%3C/svg%3E";

  /* ══════════════════════════════════════════
     PATH BUILDERS
  ══════════════════════════════════════════ */
  const paths = {
    logo       : ()         => `${BASE}logo.png`,
    token      : (name)     => `${BASE}tokens/${name}.png`,
    property   : (id)       => `${BASE}properties/${id}.jpg`,
    station    : (idx)      => `${BASE}stations/station-${idx}.png`,
    utility    : (idx)      => `${BASE}utilities/utility-${idx}.png`,
    tax        : (name)     => `${BASE}misc/${name}.png`,
    corner     : (type)     => `${BASE}corners/${type}.png`,
    house      : ()         => `${BASE}misc/house.png`,
    hotel      : ()         => `${BASE}misc/hotel.png`,
    cardBg     : (deck)     => `${BASE}cards/${deck}-back.png`,
    avatar     : (name)     => `${BASE}avatars/${name}.png`,
    icon       : (name)     => `${BASE}icons/${name}.png`,
  };

  /* ══════════════════════════════════════════
     CACHE
  ══════════════════════════════════════════ */
  const _cache = new Map();

  /* ══════════════════════════════════════════
     PRELOAD ARRAY OF PATHS
  ══════════════════════════════════════════ */
  function preload(pathArray) {
    return Promise.allSettled(
      pathArray.map(p => _loadOne(p))
    );
  }

  /* Preload all token images for a player list */
  function preloadTokens(tokenNames) {
    return preload(tokenNames.map(n => paths.token(n)));
  }

  /* Preload all property images from BoardData */
  function preloadProperties() {
    if (typeof BoardData === 'undefined') return Promise.resolve();
    const ids = BoardData.cells
      .filter(c => c.type === 'property' || c.type === 'station' || c.type === 'utility')
      .map(c => c.id);
    return preload(ids.map(id => paths.property(id)));
  }

  /* ══════════════════════════════════════════
     LOAD ONE (returns Promise<HTMLImageElement>)
  ══════════════════════════════════════════ */
  function _loadOne(src) {
    if (_cache.has(src)) return Promise.resolve(_cache.get(src));

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        _cache.set(src, img);
        resolve(img);
      };
      img.onerror = () => {
        /* store fallback so we don't retry */
        const fb = new Image();
        fb.src = FALLBACK_SVG;
        _cache.set(src, fb);
        resolve(fb);
      };
      img.src = src;
    });
  }

  /* ══════════════════════════════════════════
     GET (sync, from cache, or start loading)
  ══════════════════════════════════════════ */
  function get(src) {
    if (_cache.has(src)) return _cache.get(src).src;
    /* kick off background load */
    _loadOne(src);
    return FALLBACK_SVG;
  }

  /* ══════════════════════════════════════════
     APPLY TO <img> ELEMENT (with fallback)
  ══════════════════════════════════════════ */
  function applyTo(imgEl, src) {
    if (!imgEl) return;
    imgEl.src = FALLBACK_SVG; /* placeholder immediately */
    _loadOne(src).then(loaded => { imgEl.src = loaded.src; });
  }

  /* ══════════════════════════════════════════
     SET CSS BACKGROUND
  ══════════════════════════════════════════ */
  function setBg(el, src) {
    if (!el) return;
    _loadOne(src).then(img => {
      el.style.backgroundImage = `url('${img.src}')`;
    });
  }

  /* ══════════════════════════════════════════
     TOKEN LIST (all available tokens)
  ══════════════════════════════════════════ */
  const TOKENS = [
    { id: 'car',        label: '🚗', file: 'car'        },
    { id: 'hat',        label: '🎩', file: 'hat'        },
    { id: 'iron',       label: '👔', file: 'iron'       },
    { id: 'dog',        label: '🐕', file: 'dog'        },
    { id: 'ship',       label: '⛵', file: 'ship'       },
    { id: 'thimble',    label: '🧵', file: 'thimble'    },
    { id: 'boot',       label: '👟', file: 'boot'       },
    { id: 'wheelbarrow',label: '🛒', file: 'wheelbarrow'},
  ];

  function getTokens() { return [...TOKENS]; }

  function tokenEmoji(id) {
    return TOKENS.find(t => t.id === id)?.label ?? '🎲';
  }

  /* ══════════════════════════════════════════
     CLEAR CACHE (for memory management)
  ══════════════════════════════════════════ */
  function clearCache() {
    _cache.clear();
  }

  /* ══════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════ */
  return {
    paths,
    preload,
    preloadTokens,
    preloadProperties,
    get,
    applyTo,
    setBg,
    getTokens,
    tokenEmoji,
    clearCache,
    FALLBACK_SVG,
  };

})();
