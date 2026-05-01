/* ============================================
   SFACCIMMOPOLY — BOARD DATA (40 squares)
   ============================================
   Positions 0-39, clockwise from GO (bottom-right)
   ============================================ */

const BoardData = {
  cells: [

  // ── Bottom row (right → left) : indices 0-10 ──
  {
    index: 0,
    type: 'corner',
    name: 'VIA!',
    icon: '🚦',
  },
  {
    index: 1,
    type: 'property',
    name: 'Via Napoli',
    color: 'brown',
    price: 60,
    rent: [2, 10, 30, 90, 160, 250],
    houseCost: 50,
    mortgage: 30,
  },
  {
    index: 2,
    type: 'chest',
    name: 'Imprevisti',
    icon: '📦',
  },
  {
    index: 3,
    type: 'property',
    name: 'Via Palermo',
    color: 'brown',
    price: 60,
    rent: [4, 20, 60, 180, 320, 450],
    houseCost: 50,
    mortgage: 30,
  },
  {
    index: 4,
    type: 'tax',
    name: 'Tassa sul Reddito',
    icon: '💸',
    amount: 200,
  },
  {
    index: 5,
    type: 'station',
    name: 'Stazione Nord',
    icon: '🚉',
    price: 200,
    rent: [25, 50, 100, 200],
    mortgage: 100,
  },
  {
    index: 6,
    type: 'property',
    name: 'Via Bari',
    color: 'lblue',
    price: 100,
    rent: [6, 30, 90, 270, 400, 550],
    houseCost: 50,
    mortgage: 50,
  },
  {
    index: 7,
    type: 'chance',
    name: 'Probabilità',
    icon: '🎴',
  },
  {
    index: 8,
    type: 'property',
    name: 'Via Catania',
    color: 'lblue',
    price: 100,
    rent: [6, 30, 90, 270, 400, 550],
    houseCost: 50,
    mortgage: 50,
  },
  {
    index: 9,
    type: 'property',
    name: 'Corso Venezia',
    color: 'lblue',
    price: 120,
    rent: [8, 40, 100, 300, 450, 600],
    houseCost: 50,
    mortgage: 60,
  },
  {
    index: 10,
    type: 'corner',
    name: 'Prigione / Visita',
    icon: '🔒',
  },

  // ── Left column (bottom → top) : indices 11-20 ──
  {
    index: 11,
    type: 'property',
    name: 'Via Firenze',
    color: 'pink',
    price: 140,
    rent: [10, 50, 150, 450, 625, 750],
    houseCost: 100,
    mortgage: 70,
  },
  {
    index: 12,
    type: 'utility',
    name: 'Società Elettrica',
    icon: '⚡',
    price: 150,
    mortgage: 75,
  },
  {
    index: 13,
    type: 'property',
    name: 'Via Siena',
    color: 'pink',
    price: 140,
    rent: [10, 50, 150, 450, 625, 750],
    houseCost: 100,
    mortgage: 70,
  },
  {
    index: 14,
    type: 'property',
    name: 'Via Bologna',
    color: 'pink',
    price: 160,
    rent: [12, 60, 180, 500, 700, 900],
    houseCost: 100,
    mortgage: 80,
  },
  {
    index: 15,
    type: 'station',
    name: 'Stazione Est',
    icon: '🚉',
    price: 200,
    rent: [25, 50, 100, 200],
    mortgage: 100,
  },
  {
    index: 16,
    type: 'property',
    name: 'Via Torino',
    color: 'orange',
    price: 180,
    rent: [14, 70, 200, 550, 750, 950],
    houseCost: 100,
    mortgage: 90,
  },
  {
    index: 17,
    type: 'chest',
    name: 'Imprevisti',
    icon: '📦',
  },
  {
    index: 18,
    type: 'property',
    name: 'Via Genova',
    color: 'orange',
    price: 180,
    rent: [14, 70, 200, 550, 750, 950],
    houseCost: 100,
    mortgage: 90,
  },
  {
    index: 19,
    type: 'property',
    name: 'Via Milano',
    color: 'orange',
    price: 200,
    rent: [16, 80, 220, 600, 800, 1000],
    houseCost: 100,
    mortgage: 100,
  },
  {
    index: 20,
    type: 'corner',
    name: 'Parcheggio Libero',
    icon: '🅿️',
  },

  // ── Top row (left → right) : indices 21-30 ──
  {
    index: 21,
    type: 'property',
    name: 'Via Roma',
    color: 'red',
    price: 220,
    rent: [18, 90, 250, 700, 875, 1050],
    houseCost: 150,
    mortgage: 110,
  },
  {
    index: 22,
    type: 'chance',
    name: 'Probabilità',
    icon: '🎴',
  },
  {
    index: 23,
    type: 'property',
    name: 'Via Venezia',
    color: 'red',
    price: 220,
    rent: [18, 90, 250, 700, 875, 1050],
    houseCost: 150,
    mortgage: 110,
  },
  {
    index: 24,
    type: 'property',
    name: 'Corso Umberto',
    color: 'red',
    price: 240,
    rent: [20, 100, 300, 750, 925, 1100],
    houseCost: 150,
    mortgage: 120,
  },
  {
    index: 25,
    type: 'station',
    name: 'Stazione Ovest',
    icon: '🚉',
    price: 200,
    rent: [25, 50, 100, 200],
    mortgage: 100,
  },
  {
    index: 26,
    type: 'property',
    name: 'Viale Mazzini',
    color: 'yellow',
    price: 260,
    rent: [22, 110, 330, 800, 975, 1150],
    houseCost: 150,
    mortgage: 130,
  },
  {
    index: 27,
    type: 'property',
    name: 'Viale Garibaldi',
    color: 'yellow',
    price: 260,
    rent: [22, 110, 330, 800, 975, 1150],
    houseCost: 150,
    mortgage: 130,
  },
  {
    index: 28,
    type: 'utility',
    name: 'Acquedotto',
    icon: '💧',
    price: 150,
    mortgage: 75,
  },
  {
    index: 29,
    type: 'property',
    name: 'Viale Cavour',
    color: 'yellow',
    price: 280,
    rent: [24, 120, 360, 850, 1025, 1200],
    houseCost: 150,
    mortgage: 140,
  },
  {
    index: 30,
    type: 'corner',
    name: 'Vai in Prigione!',
    icon: '👮',
  },

  // ── Right column (top → bottom) : indices 31-39 ──
  {
    index: 31,
    type: 'property',
    name: 'Via Dante',
    color: 'green',
    price: 300,
    rent: [26, 130, 390, 900, 1100, 1275],
    houseCost: 200,
    mortgage: 150,
  },
  {
    index: 32,
    type: 'property',
    name: 'Via Petrarca',
    color: 'green',
    price: 300,
    rent: [26, 130, 390, 900, 1100, 1275],
    houseCost: 200,
    mortgage: 150,
  },
  {
    index: 33,
    type: 'chest',
    name: 'Imprevisti',
    icon: '📦',
  },
  {
    index: 34,
    type: 'property',
    name: 'Via Boccaccio',
    color: 'green',
    price: 320,
    rent: [28, 150, 450, 1000, 1200, 1400],
    houseCost: 200,
    mortgage: 160,
  },
  {
    index: 35,
    type: 'station',
    name: 'Stazione Sud',
    icon: '🚉',
    price: 200,
    rent: [25, 50, 100, 200],
    mortgage: 100,
  },
  {
    index: 36,
    type: 'chance',
    name: 'Probabilità',
    icon: '🎴',
  },
  {
    index: 37,
    type: 'property',
    name: 'Largo Argentina',
    color: 'dblue',
    price: 350,
    rent: [35, 175, 500, 1100, 1300, 1500],
    houseCost: 200,
    mortgage: 175,
  },
  {
    index: 38,
    type: 'tax',
    name: 'Tassa di Lusso',
    icon: '💎',
    amount: 100,
  },
  {
    index: 39,
    type: 'property',
    name: 'Piazza Venezia',
    color: 'dblue',
    price: 400,
    rent: [50, 200, 600, 1400, 1700, 2000],
    houseCost: 200,
    mortgage: 200,
  },

  ], // ← chiusura dell'array cells

  /* ── Helper lookups ───────────────────────── */
  getSquare(index) {
    return this.cells[index] ?? null;
  },

  /** Alias usato da main.js */
  getProperty(index) {
    return this.cells[index] ?? null;
  },

  /** Usato da main.js quando legge input radio mortgage */
  getPropertyById(id) {
    const idx = parseInt(id, 10);
    return this.cells[idx] ?? null;
  },

  getColorGroup(color) {
    return this.cells.filter(s => s.color === color);
  },

  getStations() {
    return this.cells.filter(s => s.type === 'station');
  },

  getUtilities() {
    return this.cells.filter(s => s.type === 'utility');
  }
};

/* Espone globalmente */
window.BoardData = BoardData;
