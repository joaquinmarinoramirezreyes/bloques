/**
 * games/cristales/game.js - Cristales Arcade 00s
 * Match-3 de gemas prismáticas vectoriales 3D, niveles con objetivos de hielo/puntuación,
 * modo infinito, piezas especiales de línea y bomba de color, y cascadas con multiplicador.
 */
(() => {
  'use strict';

  // ==========================================
  // CONFIGURACIÓN Y CONSTANTES DE BALANCE
  // ==========================================
  const CONFIG = {
    COLS: 8,
    ROWS: 8,
    NUM_GEM_TYPES: 6,
    VIRTUAL_W: 480,
    VIRTUAL_H: 480,
    STORAGE_KEY_PREFIX: 'cristales:v1',

    // Tipos de gemas y paletas de facetas 3D
    GEMS: [
      { id: 1, name: 'RUBY',     base: '#e60039', dark: '#80001a', light: '#ff6688', facet: '#ff99b3' },
      { id: 2, name: 'SAPPHIRE', base: '#0066ff', dark: '#002699', light: '#66b3ff', facet: '#b3d9ff' },
      { id: 3, name: 'EMERALD',  base: '#00cc44', dark: '#00591f', light: '#66ff99', facet: '#b3ffcc' },
      { id: 4, name: 'TOPAZ',    base: '#ffbb00', dark: '#997000', light: '#ffdd66', facet: '#fff2b3' },
      { id: 5, name: 'AMETHYST', base: '#9933ff', dark: '#4c0099', light: '#cc99ff', facet: '#e6ccff' },
      { id: 6, name: 'DIAMOND',  base: '#00e5ff', dark: '#007380', light: '#99f5ff', facet: '#ffffff' }
    ],

    SPECIALS: {
      NONE: 0,
      LINE_H: 1,
      LINE_V: 2,
      COLOR_BOMB: 3
    },

    HINT_DELAY: 4.5, // Segundos de inactividad antes de mostrar pista
    BASE_SWAP_DURATION: 0.18,
    BASE_FALL_DURATION: 0.22,

    // Definición de los 15 niveles de la campaña
    LEVELS: [
      { id: 1, name: 'Despertar Prismático', targetScore: 1200, moves: 25, iceGoal: 0, iceLayout: [] },
      { id: 2, name: 'Cueva de Escarcha I', targetScore: 1800, moves: 24, iceGoal: 6,
        iceLayout: [[3,2],[3,3],[3,4],[3,5],[4,3],[4,4]] },
      { id: 3, name: 'Cascada de Zafiro', targetScore: 2800, moves: 25, iceGoal: 0, iceLayout: [] },
      { id: 4, name: 'Cueva de Escarcha II', targetScore: 3200, moves: 26, iceGoal: 10,
        iceLayout: [[2,2],[2,5],[3,2],[3,3],[3,4],[3,5],[4,2],[4,3],[4,4],[4,5]] },
      { id: 5, name: 'Prisma de Fuego', targetScore: 4500, moves: 25, iceGoal: 0, iceLayout: [] },
      { id: 6, name: 'Laberinto Helado', targetScore: 5000, moves: 26, iceGoal: 14,
        iceLayout: [[1,1],[1,6],[2,2],[2,5],[3,3],[3,4],[4,3],[4,4],[5,2],[5,5],[6,1],[6,6],[3,2],[3,5]] },
      { id: 7, name: 'Fiebre Esmeralda', targetScore: 6500, moves: 24, iceGoal: 0, iceLayout: [] },
      { id: 8, name: 'Celdas de Cristal', targetScore: 7000, moves: 28, iceGoal: 16,
        iceLayout: [[2,2],[2,3],[2,4],[2,5],[3,2],[3,5],[4,2],[4,5],[5,2],[5,3],[5,4],[5,5],[1,3],[1,4],[6,3],[6,4]] },
      { id: 9, name: 'Vórtice Amatista', targetScore: 8500, moves: 26, iceGoal: 0, iceLayout: [] },
      { id: 10, name: 'Permafrost Profundo', targetScore: 9500, moves: 30, iceGoal: 20,
        iceLayout: [[1,1],[1,2],[1,5],[1,6],[2,1],[2,2],[2,5],[2,6],[5,1],[5,2],[5,5],[5,6],[6,1],[6,2],[6,5],[6,6],[3,3],[3,4],[4,3],[4,4]] },
      { id: 11, name: 'Brillo Diamante', targetScore: 12000, moves: 26, iceGoal: 0, iceLayout: [] },
      { id: 12, name: 'Mosaico Glacial', targetScore: 13500, moves: 30, iceGoal: 24,
        iceLayout: [[1,3],[1,4],[2,2],[2,3],[2,4],[2,5],[3,1],[3,2],[3,5],[3,6],[4,1],[4,2],[4,5],[4,6],[5,2],[5,3],[5,4],[5,5],[6,3],[6,4],[3,3],[3,4],[4,3],[4,4]] },
      { id: 13, name: 'Sobrecarga Prismática', targetScore: 16000, moves: 28, iceGoal: 0, iceLayout: [] },
      { id: 14, name: 'Templo del Hielo', targetScore: 18000, moves: 32, iceGoal: 28,
        iceLayout: [[0,0],[0,7],[7,0],[7,7],[1,1],[1,6],[6,1],[6,6],[2,2],[2,3],[2,4],[2,5],[5,2],[5,3],[5,4],[5,5],[3,2],[3,5],[4,2],[4,5],[3,3],[3,4],[4,3],[4,4],[2,1],[2,6],[5,1],[5,6]] },
      { id: 15, name: 'Maestría Cristalina', targetScore: 22000, moves: 35, iceGoal: 32,
        iceLayout: [[1,1],[1,2],[1,3],[1,4],[1,5],[1,6],[6,1],[6,2],[6,3],[6,4],[6,5],[6,6],[2,1],[2,6],[3,1],[3,6],[4,1],[4,6],[5,1],[5,6],[2,2],[2,5],[5,2],[5,5],[3,3],[3,4],[4,3],[4,4],[2,3],[2,4],[5,3],[5,4]] }
    ]
  };

  // ==========================================
  // LÓGICA PURA Y SIMULACIÓN (Testeable en Node)
  // ==========================================
  const CristalesLogic = {
    createEmptyGrid(cols = CONFIG.COLS, rows = CONFIG.ROWS) {
      const grid = new Array(rows);
      for (let r = 0; r < rows; r++) {
        grid[r] = new Array(cols);
        for (let c = 0; c < cols; c++) {
          grid[r][c] = { type: 0, special: CONFIG.SPECIALS.NONE };
        }
      }
      return grid;
    },

    cloneGrid(grid) {
      const rows = grid.length;
      const cols = grid[0].length;
      const copy = new Array(rows);
      for (let r = 0; r < rows; r++) {
        copy[r] = new Array(cols);
        for (let c = 0; c < cols; c++) {
          copy[r][c] = { ...grid[r][c] };
        }
      }
      return copy;
    },

    /**
     * Busca todas las combinaciones horizontales y verticales de 3 o más gemas del mismo tipo.
     * Ignora gemas vacías (type === 0).
     * @returns {Array<{type: number, cells: Array<{r: number, c: number}>, orientation: 'H'|'V'}>}
     */
    findMatches(grid) {
      const rows = grid.length;
      const cols = grid[0].length;
      const matches = [];

      // 1. Horizontales
      for (let r = 0; r < rows; r++) {
        let matchLength = 1;
        for (let c = 0; c < cols; c++) {
          const current = grid[r][c];
          const next = (c + 1 < cols) ? grid[r][c + 1] : null;

          if (next && current.type !== 0 && current.type === next.type) {
            matchLength++;
          } else {
            if (matchLength >= 3 && current.type !== 0) {
              const cells = [];
              for (let i = 0; i < matchLength; i++) {
                cells.push({ r, c: c - matchLength + 1 + i });
              }
              matches.push({ type: current.type, cells, orientation: 'H' });
            }
            matchLength = 1;
          }
        }
      }

      // 2. Verticales
      for (let c = 0; c < cols; c++) {
        let matchLength = 1;
        for (let r = 0; r < rows; r++) {
          const current = grid[r][c];
          const next = (r + 1 < rows) ? grid[r + 1][c] : null;

          if (next && current.type !== 0 && current.type === next.type) {
            matchLength++;
          } else {
            if (matchLength >= 3 && current.type !== 0) {
              const cells = [];
              for (let i = 0; i < matchLength; i++) {
                cells.push({ r: r - matchLength + 1 + i, c });
              }
              matches.push({ type: current.type, cells, orientation: 'V' });
            }
            matchLength = 1;
          }
        }
      }

      return matches;
    },

    /**
     * Verifica si un intercambio entre dos celdas adyacentes produce alguna combinación válida
     * o activa un cristal especial (ej. Bomba de Color).
     */
    isValidSwap(grid, r1, c1, r2, c2) {
      const rows = grid.length;
      const cols = grid[0].length;

      // Deben ser adyacentes ortogonalmente
      const dist = Math.abs(r1 - r2) + Math.abs(c1 - c2);
      if (dist !== 1) return false;

      const g1 = grid[r1][c1];
      const g2 = grid[r2][c2];
      if (g1.type === 0 || g2.type === 0) return false;

      // Bomba de color con cualquier gema es válido
      if (g1.special === CONFIG.SPECIALS.COLOR_BOMB || g2.special === CONFIG.SPECIALS.COLOR_BOMB) {
        return true;
      }

      // Simular intercambio
      const temp = grid[r1][c1];
      grid[r1][c1] = grid[r2][c2];
      grid[r2][c2] = temp;

      const matches = this.findMatches(grid);

      // Revertir intercambio
      grid[r2][c2] = grid[r1][c1];
      grid[r1][c1] = temp;

      return matches.length > 0;
    },

    /**
     * Detecta si existe al menos un movimiento válido en el tablero actual.
     * Retorna el primer movimiento encontrado para pistas automáticas.
     */
    findAnyValidMove(grid) {
      const rows = grid.length;
      const cols = grid[0].length;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Probar derecha
          if (c + 1 < cols && this.isValidSwap(grid, r, c, r, c + 1)) {
            return { r1: r, c1: c, r2: r, c2: c + 1 };
          }
          // Probar abajo
          if (r + 1 < rows && this.isValidSwap(grid, r, c, r + 1, c)) {
            return { r1: r, c1: c, r2: r + 1, c2: c };
          }
        }
      }

      return null;
    },

    /**
     * Genera un tablero 8x8 que:
     * 1. NUNCA tenga combinaciones de 3 ya formadas al inicio.
     * 2. SIEMPRE tenga al menos un movimiento válido disponible.
     */
    generateBoard(cols = CONFIG.COLS, rows = CONFIG.ROWS, numTypes = CONFIG.NUM_GEM_TYPES) {
      let grid = this.createEmptyGrid(cols, rows);

      while (true) {
        // Llenar celda a celda evitando crear 3 en línea
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const forbidden = new Set();

            // Evitar horizontal
            if (c >= 2 && grid[r][c - 1].type === grid[r][c - 2].type) {
              forbidden.add(grid[r][c - 1].type);
            }
            // Evitar vertical
            if (r >= 2 && grid[r - 1][c].type === grid[r - 2][c].type) {
              forbidden.add(grid[r - 1][c].type);
            }

            const allowed = [];
            for (let t = 1; t <= numTypes; t++) {
              if (!forbidden.has(t)) allowed.push(t);
            }

            const chosen = allowed[Math.floor(Math.random() * allowed.length)];
            grid[r][c] = { type: chosen, special: CONFIG.SPECIALS.NONE };
          }
        }

        // Verificar que no haya combinaciones residuales y que tenga movimiento
        if (this.findMatches(grid).length === 0 && this.findAnyValidMove(grid) !== null) {
          return grid;
        }
      }
    },

    /**
     * Mezcla todas las piezas existentes en el tablero hasta que no haya combinaciones
     * y se garantice al menos un movimiento válido.
     */
    shuffleUntilValid(grid, numTypes = CONFIG.NUM_GEM_TYPES) {
      const rows = grid.length;
      const cols = grid[0].length;
      const gemPool = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          gemPool.push({ ...grid[r][c] });
        }
      }

      for (let attempt = 0; attempt < 500; attempt++) {
        // Barajar array (Fisher-Yates)
        for (let i = gemPool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const t = gemPool[i];
          gemPool[i] = gemPool[j];
          gemPool[j] = t;
        }

        let idx = 0;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            grid[r][c] = { ...gemPool[idx++] };
          }
        }

        if (this.findMatches(grid).length === 0 && this.findAnyValidMove(grid) !== null) {
          return true;
        }
      }

      // Si el pool actual no permite solución, regenerar tablero fresco
      const fresh = this.generateBoard(cols, rows, numTypes);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          grid[r][c] = fresh[r][c];
        }
      }
      return true;
    },

    /**
     * Aplica gravedad: hace descender las gemas para llenar los huecos vacíos (type === 0).
     * @returns {Array<{fromR: number, toR: number, c: number}>} Registro de caídas
     */
    applyGravity(grid) {
      const rows = grid.length;
      const cols = grid[0].length;
      const movements = [];

      for (let c = 0; c < cols; c++) {
        let writeRow = rows - 1;
        for (let r = rows - 1; r >= 0; r--) {
          if (grid[r][c].type !== 0) {
            if (writeRow !== r) {
              grid[writeRow][c] = grid[r][c];
              grid[r][c] = { type: 0, special: CONFIG.SPECIALS.NONE };
              movements.push({ fromR: r, toR: writeRow, c });
            }
            writeRow--;
          }
        }
      }

      return movements;
    },

    /**
     * Rellena las celdas vacías superiores con nuevas gemas aleatorias.
     */
    refillTop(grid, numTypes = CONFIG.NUM_GEM_TYPES) {
      const rows = grid.length;
      const cols = grid[0].length;
      const newGems = [];

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          if (grid[r][c].type === 0) {
            const chosen = Math.floor(Math.random() * numTypes) + 1;
            grid[r][c] = { type: chosen, special: CONFIG.SPECIALS.NONE };
            newGems.push({ r, c, type: chosen });
          }
        }
      }

      return newGems;
    },

    /**
     * Simulación determinista completa de cascadas hasta estabilización.
     * Útil para pruebas unitarias en Node.
     */
    simulateCascades(grid, numTypes = CONFIG.NUM_GEM_TYPES, maxIterations = 50) {
      let iterations = 0;
      let totalGemsCleared = 0;
      let cascadeChains = 0;

      while (iterations < maxIterations) {
        iterations++;
        const matches = this.findMatches(grid);
        if (matches.length === 0) break;

        cascadeChains++;
        const toClear = new Set();
        for (const m of matches) {
          for (const cell of m.cells) {
            toClear.add(`${cell.r},${cell.c}`);
          }
        }

        totalGemsCleared += toClear.size;
        for (const coord of toClear) {
          const [r, c] = coord.split(',').map(Number);
          grid[r][c] = { type: 0, special: CONFIG.SPECIALS.NONE };
        }

        this.applyGravity(grid);
        this.refillTop(grid, numTypes);
      }

      return {
        terminated: iterations < maxIterations,
        iterations,
        cascadeChains,
        totalGemsCleared
      };
    }
  };

  // Exportar para pruebas Node
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, CristalesLogic };
    return;
  }

  // ==========================================
  // ESTADO DEL JUEGO Y PARTICULAS
  // ==========================================
  const State = {
    canvas: null,
    ctx: null,
    scale: 1,
    offsetY: 0,

    grid: null,
    iceGrid: null, // Matriz 8x8 con 1 si tiene hielo, 0 si no
    currentLevelIdx: 0,
    isEndless: false,

    score: 0,
    bestScore: 0,
    movesLeft: 0,
    timeRemaining: 60,
    iceRemaining: 0,
    levelTargetScore: 0,

    state: 'MENU', // 'MENU', 'PLAYING', 'ANIMATING', 'PAUSED', 'GAMEOVER', 'VICTORY'
    combo: 1,

    // Interacción táctil
    selectedCell: null, // { r, c }
    touchStartCell: null,
    touchStartX: 0,
    touchStartY: 0,

    // Pistas
    hintMove: null,
    hintTimer: 0,
    hintPulse: 0,

    // Animaciones activas
    animations: [], // { type: 'SWAP'|'FALL'|'LINE_BEAM'|'POP', progress, duration, ... }
    particles: [],

    lastTime: 0
  };

  // Elementos DOM
  const dom = {
    container: document.getElementById('game-container'),
    header: document.getElementById('game-header'),
    subBar: document.getElementById('sub-bar'),
    canvas: document.getElementById('game-canvas'),

    scoreVal: document.getElementById('score-val'),
    objectiveLabel: document.getElementById('objective-label'),
    objectiveVal: document.getElementById('objective-val'),
    goalText: document.getElementById('goal-text'),
    comboPill: document.getElementById('combo-pill'),
    comboMultiplier: document.getElementById('combo-multiplier'),

    btnHint: document.getElementById('btn-hint'),
    btnSoundToggle: document.getElementById('btn-sound-toggle'),
    iconSoundOn: document.getElementById('icon-sound-on'),
    iconSoundOff: document.getElementById('icon-sound-off'),
    btnPauseHeader: document.getElementById('btn-pause-header'),

    startCard: document.getElementById('start-card'),
    levelsView: document.getElementById('levels-view'),
    levelsGrid: document.getElementById('levels-grid'),
    endlessView: document.getElementById('endless-view'),
    tabLevels: document.getElementById('tab-levels'),
    tabEndless: document.getElementById('tab-endless'),
    endlessBestVal: document.getElementById('endless-best-val'),
    btnStartEndless: document.getElementById('btn-start-endless'),

    overlayPause: document.getElementById('overlay-pause'),
    btnResume: document.getElementById('btn-resume'),
    btnRestartLevel: document.getElementById('btn-restart-level'),
    btnLevelSelect: document.getElementById('btn-level-select'),

    overlayResult: document.getElementById('overlay-result'),
    resultIcon: document.getElementById('result-icon'),
    resultTitle: document.getElementById('result-title'),
    resultSubtitle: document.getElementById('result-subtitle'),
    resultScoreVal: document.getElementById('result-score-val'),
    resultBestVal: document.getElementById('result-best-val'),
    resultBestRow: document.getElementById('result-best-row'),
    starsRow: document.getElementById('stars-row'),
    btnNextLevel: document.getElementById('btn-next-level'),
    btnRetryLevel: document.getElementById('btn-retry-level'),
    btnExitToLevels: document.getElementById('btn-exit-to-levels')
  };

  // ==========================================
  // AUDIO SINTETIZADO CON WEB AUDIO
  // ==========================================
  function playAudio(type, extra = 1) {
    if (!window.ArcadeAudio || window.ArcadeAudio.isMuted) return;

    try {
      const actx = window.ArcadeAudio.ctx;
      if (!actx) return;

      const now = actx.currentTime;

      switch (type) {
        case 'select': {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(520, now);
          osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.08);
          break;
        }

        case 'swap': {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(350, now);
          osc.frequency.exponentialRampToValueAtTime(450, now + 0.12);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.12);
          break;
        }

        case 'match': {
          // Tono cristalino brillante que escala según el combo
          const pitchMultiplier = Math.min(2.5, 1 + (extra - 1) * 0.25);
          const freqs = [587.33, 739.99, 880, 1174.66]; // Re mayor cristalino
          freqs.forEach((f, idx) => {
            const osc = actx.createOscillator();
            const gain = actx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f * pitchMultiplier, now + idx * 0.03);
            gain.gain.setValueAtTime(0.18, now + idx * 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.35);
            osc.connect(gain);
            gain.connect(actx.destination);
            osc.start(now + idx * 0.03);
            osc.stop(now + idx * 0.03 + 0.35);
          });
          break;
        }

        case 'ice_break': {
          // Sonido de crujido y rotura de hielo
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(1400, now);
          osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        }

        case 'special_created': {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(1320, now + 0.25);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.25);
          break;
        }

        case 'line_blast': {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(1800, now);
          osc.frequency.exponentialRampToValueAtTime(220, now + 0.35);
          gain.gain.setValueAtTime(0.35, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.35);
          break;
        }

        case 'color_bomb': {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.linearRampToValueAtTime(1200, now + 0.4);
          gain.gain.setValueAtTime(0.4, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.4);
          break;
        }

        case 'victory': {
          const melody = [523.25, 659.25, 783.99, 1046.50];
          melody.forEach((freq, idx) => {
            const osc = actx.createOscillator();
            const gain = actx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.12);
            gain.gain.setValueAtTime(0.3, now + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);
            osc.connect(gain);
            gain.connect(actx.destination);
            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 0.4);
          });
          break;
        }

        case 'game_over': {
          const notes = [440, 415.3, 392, 349.23];
          notes.forEach((freq, idx) => {
            const osc = actx.createOscillator();
            const gain = actx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.15);
            gain.gain.setValueAtTime(0.25, now + idx * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.35);
            osc.connect(gain);
            gain.connect(actx.destination);
            osc.start(now + idx * 0.15);
            osc.stop(now + idx * 0.15 + 0.35);
          });
          break;
        }
      }
    } catch (e) {}
  }

  // ==========================================
  // PARTÍCULAS VECTORIALES CON POOLING
  // ==========================================
  const ParticlePool = {
    pool: [],
    spawn(x, y, color, count = 12, speed = 150) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = (Math.random() * 0.8 + 0.2) * speed;
        const p = this.pool.pop() || {};
        p.x = x;
        p.y = y;
        p.vx = Math.cos(angle) * velocity;
        p.vy = Math.sin(angle) * velocity;
        p.color = color;
        p.size = Math.random() * 4 + 3;
        p.life = 0;
        p.maxLife = Math.random() * 0.4 + 0.35;
        p.rotation = Math.random() * Math.PI;
        p.vRot = (Math.random() - 0.5) * 8;
        State.particles.push(p);
      }
    },
    update(dt) {
      for (let i = State.particles.length - 1; i >= 0; i--) {
        const p = State.particles[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          State.particles.splice(i, 1);
          if (this.pool.length < 200) this.pool.push(p);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += p.vRot * dt;
        p.size = Math.max(0.1, p.size * (1 - dt * 2));
      }
    },
    render(ctx) {
      for (let i = 0; i < State.particles.length; i++) {
        const p = State.particles[i];
        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // Destello en forma de cristal de diamante
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.6, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.6, 0);
        ctx.closePath();
        ctx.fill();

        // Núcleo blanco brillante
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-p.size * 0.2, -p.size * 0.2, p.size * 0.4, p.size * 0.4);
        ctx.restore();
      }
    }
  };

  // ==========================================
  // GESTIÓN DE NIVELES Y PROGRESO
  // ==========================================
  function getLevelRecord(levelIdx) {
    try {
      const key = `${CONFIG.STORAGE_KEY_PREFIX}:level_${levelIdx}`;
      return window.ArcadeStorage?.getHighScore(key) || 0;
    } catch (e) {
      return 0;
    }
  }

  function saveLevelRecord(levelIdx, score) {
    try {
      const key = `${CONFIG.STORAGE_KEY_PREFIX}:level_${levelIdx}`;
      const current = window.ArcadeStorage?.getHighScore(key) || 0;
      if (score > current) {
        window.ArcadeStorage?.saveHighScore(key, score);
      }
    } catch (e) {}
  }

  function getEndlessRecord() {
    try {
      return window.ArcadeStorage?.getHighScore(`${CONFIG.STORAGE_KEY_PREFIX}:endless`) || 0;
    } catch (e) {
      return 0;
    }
  }

  function saveEndlessRecord(score) {
    try {
      const current = getEndlessRecord();
      if (score > current) {
        window.ArcadeStorage?.saveHighScore(`${CONFIG.STORAGE_KEY_PREFIX}:endless`, score);
      }
    } catch (e) {}
  }

  function renderLevelSelector() {
    dom.levelsGrid.innerHTML = '';
    const unlockedLevel = getUnlockedLevel();

    CONFIG.LEVELS.forEach((lvl, idx) => {
      const badge = document.createElement('div');
      badge.className = 'level-badge';
      const isUnlocked = idx <= unlockedLevel;
      const isCurrent = idx === State.currentLevelIdx;

      if (isUnlocked) badge.classList.add('unlocked');
      if (isCurrent) badge.classList.add('current');
      if (!isUnlocked) badge.classList.add('locked');

      const numSpan = document.createElement('span');
      numSpan.className = 'level-num';
      numSpan.textContent = idx + 1;
      badge.appendChild(numSpan);

      const starsSpan = document.createElement('span');
      starsSpan.className = 'level-stars';
      const best = getLevelRecord(idx);
      if (best > 0) {
        const stars = best >= lvl.targetScore * 1.5 ? '★★★' : (best >= lvl.targetScore * 1.2 ? '★★☆' : '★☆☆');
        starsSpan.textContent = stars;
      } else {
        starsSpan.textContent = isUnlocked ? '---' : '🔒';
      }
      badge.appendChild(starsSpan);

      if (isUnlocked) {
        badge.addEventListener('click', () => {
          playAudio('select');
          startLevel(idx);
        });
      }

      dom.levelsGrid.appendChild(badge);
    });

    dom.endlessBestVal.textContent = getEndlessRecord().toLocaleString();
  }

  function getUnlockedLevel() {
    try {
      const raw = localStorage.getItem(`${CONFIG.STORAGE_KEY_PREFIX}:unlocked`);
      return raw ? parseInt(raw, 10) : 0;
    } catch (e) {
      return 0;
    }
  }

  function setUnlockedLevel(lvlIdx) {
    try {
      const current = getUnlockedLevel();
      if (lvlIdx > current) {
        localStorage.setItem(`${CONFIG.STORAGE_KEY_PREFIX}:unlocked`, lvlIdx.toString());
      }
    } catch (e) {}
  }

  // ==========================================
  // INICIALIZACIÓN DE PARTIDA
  // ==========================================
  function startLevel(levelIdx) {
    State.isEndless = false;
    State.currentLevelIdx = levelIdx;
    const lvl = CONFIG.LEVELS[levelIdx];

    State.score = 0;
    State.combo = 1;
    State.movesLeft = lvl.moves;
    State.levelTargetScore = lvl.targetScore;

    // Inicializar rejilla de hielo
    State.iceGrid = new Array(CONFIG.ROWS);
    State.iceRemaining = 0;
    for (let r = 0; r < CONFIG.ROWS; r++) {
      State.iceGrid[r] = new Uint8Array(CONFIG.COLS);
    }
    if (lvl.iceLayout) {
      for (const [r, c] of lvl.iceLayout) {
        if (r < CONFIG.ROWS && c < CONFIG.COLS) {
          State.iceGrid[r][c] = 1;
          State.iceRemaining++;
        }
      }
    }

    State.grid = CristalesLogic.generateBoard(CONFIG.COLS, CONFIG.ROWS, CONFIG.NUM_GEM_TYPES);
    State.selectedCell = null;
    State.hintMove = null;
    State.hintTimer = 0;
    State.animations = [];
    State.particles = [];

    State.state = 'PLAYING';

    dom.startCard.classList.add('hidden');
    dom.overlayPause.classList.add('hidden');
    dom.overlayResult.classList.add('hidden');

    updateHUD();
  }

  function startEndless() {
    State.isEndless = true;
    State.score = 0;
    State.combo = 1;
    State.timeRemaining = 60; // 60 segundos iniciales
    State.levelTargetScore = 0;

    State.iceGrid = new Array(CONFIG.ROWS);
    State.iceRemaining = 0;
    for (let r = 0; r < CONFIG.ROWS; r++) {
      State.iceGrid[r] = new Uint8Array(CONFIG.COLS);
    }

    State.grid = CristalesLogic.generateBoard(CONFIG.COLS, CONFIG.ROWS, CONFIG.NUM_GEM_TYPES);
    State.selectedCell = null;
    State.hintMove = null;
    State.hintTimer = 0;
    State.animations = [];
    State.particles = [];

    State.state = 'PLAYING';

    dom.startCard.classList.add('hidden');
    dom.overlayPause.classList.add('hidden');
    dom.overlayResult.classList.add('hidden');

    updateHUD();
  }

  function updateHUD() {
    dom.scoreVal.textContent = State.score.toLocaleString();

    if (State.isEndless) {
      dom.objectiveLabel.textContent = 'TIEMPO';
      dom.objectiveVal.textContent = `${Math.ceil(State.timeRemaining)}s`;
      dom.goalText.textContent = `Modo Infinito - ¡Suma combos!`;
    } else {
      dom.objectiveLabel.textContent = 'MOVIMIENTOS';
      dom.objectiveVal.textContent = State.movesLeft;

      const lvl = CONFIG.LEVELS[State.currentLevelIdx];
      if (lvl.iceGoal > 0) {
        dom.goalText.textContent = `Hielo: ${State.iceRemaining} / Meta: ${lvl.targetScore.toLocaleString()} pts`;
      } else {
        dom.goalText.textContent = `Meta: ${lvl.targetScore.toLocaleString()} pts`;
      }
    }

    if (State.combo > 1) {
      dom.comboPill.classList.remove('hidden');
      dom.comboMultiplier.textContent = State.combo;
    } else {
      dom.comboPill.classList.add('hidden');
    }
  }

  // ==========================================
  // SISTEMA DE INTERCAMBIO Y COINCIDENCIAS
  // ==========================================
  function handleCellSwap(r1, c1, r2, c2) {
    if (State.state !== 'PLAYING') return;

    State.hintMove = null;
    State.hintTimer = 0;

    const g1 = State.grid[r1][c1];
    const g2 = State.grid[r2][c2];

    // Verificar si es bomba de color activándose
    const isBomb1 = g1.special === CONFIG.SPECIALS.COLOR_BOMB;
    const isBomb2 = g2.special === CONFIG.SPECIALS.COLOR_BOMB;

    if (isBomb1 || isBomb2) {
      executeColorBombSwap(r1, c1, r2, c2);
      return;
    }

    const isValid = CristalesLogic.isValidSwap(State.grid, r1, c1, r2, c2);

    State.state = 'ANIMATING';
    playAudio('swap');

    // Animación de intercambio
    State.animations.push({
      type: 'SWAP',
      r1, c1, r2, c2,
      progress: 0,
      duration: CONFIG.BASE_SWAP_DURATION,
      reverting: !isValid,
      onComplete: () => {
        if (isValid) {
          // Aplicar intercambio en la matriz lógica
          const temp = State.grid[r1][c1];
          State.grid[r1][c1] = State.grid[r2][c2];
          State.grid[r2][c2] = temp;

          if (!State.isEndless) {
            State.movesLeft--;
          }
          State.combo = 1;

          // Iniciar proceso de eliminación y cascada
          processMatchesAndCascades({ r: r2, c: c2 });
        } else {
          // Revertir y volver a jugar
          playAudio('swap');
          window.ArcadeCanvas?.haptic(15);
          State.state = 'PLAYING';
        }
        updateHUD();
      }
    });
  }

  function executeColorBombSwap(r1, c1, r2, c2) {
    State.state = 'ANIMATING';
    playAudio('color_bomb');
    window.ArcadeCanvas?.haptic(30);

    const g1 = State.grid[r1][c1];
    const g2 = State.grid[r2][c2];

    if (!State.isEndless) State.movesLeft--;

    // Intercambio visual
    State.animations.push({
      type: 'SWAP',
      r1, c1, r2, c2,
      progress: 0,
      duration: CONFIG.BASE_SWAP_DURATION,
      reverting: false,
      onComplete: () => {
        const targetColor = (g1.special === CONFIG.SPECIALS.COLOR_BOMB) ? g2.type : g1.type;
        const clearedCells = [];

        // Si ambas son bombas de color, ¡limpiar TODO el tablero!
        const dualBomb = (g1.special === CONFIG.SPECIALS.COLOR_BOMB && g2.special === CONFIG.SPECIALS.COLOR_BOMB);

        for (let r = 0; r < CONFIG.ROWS; r++) {
          for (let c = 0; c < CONFIG.COLS; c++) {
            if (dualBomb || State.grid[r][c].type === targetColor || (r === r1 && c === c1) || (r === r2 && c === c2)) {
              if (State.grid[r][c].type !== 0) {
                clearedCells.push({ r, c });
              }
            }
          }
        }

        // Eliminar gemas y desatar partículas
        const cellPixels = getBoardCellPixels();
        clearedCells.forEach(cell => {
          const gem = State.grid[cell.r][cell.c];
          State.grid[cell.r][cell.c] = { type: 0, special: CONFIG.SPECIALS.NONE };

          // Romper hielo
          if (State.iceGrid[cell.r][cell.c] === 1) {
            State.iceGrid[cell.r][cell.c] = 0;
            State.iceRemaining--;
            playAudio('ice_break');
          }

          const pos = cellPixels(cell.r, cell.c);
          const gemColor = CONFIG.GEMS[gem.type - 1]?.base || '#00e5ff';
          ParticlePool.spawn(pos.x, pos.y, gemColor, 14, 180);
        });

        const pointsGained = clearedCells.length * 150 * State.combo;
        State.score += pointsGained;

        if (State.isEndless) {
          State.timeRemaining = Math.min(120, State.timeRemaining + clearedCells.length * 0.8);
        }

        // Caída por gravedad tras la bomba
        handleGravityAndRefill();
      }
    });
  }

  function processMatchesAndCascades(lastSwappedPos = null) {
    const matches = CristalesLogic.findMatches(State.grid);

    if (matches.length === 0) {
      // Cascada terminada
      State.combo = 1;
      State.state = 'PLAYING';
      updateHUD();
      checkWinOrLossConditions();

      // Verificar si quedan movimientos válidos en el tablero
      if (!CristalesLogic.findAnyValidMove(State.grid)) {
        triggerAutoShuffle();
      }
      return;
    }

    // Hay coincidencias: animar eliminación y generar especiales
    State.state = 'ANIMATING';
    playAudio('match', State.combo);
    window.ArcadeCanvas?.haptic(10);

    const cellsToRemove = new Map(); // key 'r,c' -> cell info
    let specialToCreate = null;

    for (const match of matches) {
      const matchLen = match.cells.length;

      // Generar especial si es de 4 o 5
      if (matchLen >= 5) {
        // Bomba de color
        const targetCell = lastSwappedPos && match.cells.some(c => c.r === lastSwappedPos.r && c.c === lastSwappedPos.c)
          ? lastSwappedPos
          : match.cells[Math.floor(matchLen / 2)];
        specialToCreate = { r: targetCell.r, c: targetCell.c, special: CONFIG.SPECIALS.COLOR_BOMB, type: 6 };
      } else if (matchLen === 4 && !specialToCreate) {
        // Gema de línea horizontal o vertical
        const targetCell = lastSwappedPos && match.cells.some(c => c.r === lastSwappedPos.r && c.c === lastSwappedPos.c)
          ? lastSwappedPos
          : match.cells[Math.floor(matchLen / 2)];
        const lineSpecial = (match.orientation === 'H') ? CONFIG.SPECIALS.LINE_H : CONFIG.SPECIALS.LINE_V;
        specialToCreate = { r: targetCell.r, c: targetCell.c, special: lineSpecial, type: match.type };
      }

      for (const cell of match.cells) {
        cellsToRemove.set(`${cell.r},${cell.c}`, cell);
      }
    }

    // Activar gemas especiales que estén dentro de las celdas eliminadas
    const bonusCleared = [];
    cellsToRemove.forEach(cell => {
      const existing = State.grid[cell.r][cell.c];
      if (existing.special === CONFIG.SPECIALS.LINE_H) {
        // Rayo horizontal
        playAudio('line_blast');
        for (let c = 0; c < CONFIG.COLS; c++) {
          bonusCleared.push({ r: cell.r, c });
        }
      } else if (existing.special === CONFIG.SPECIALS.LINE_V) {
        // Rayo vertical
        playAudio('line_blast');
        for (let r = 0; r < CONFIG.ROWS; r++) {
          bonusCleared.push({ r, c: cell.c });
        }
      }
    });

    bonusCleared.forEach(cell => cellsToRemove.set(`${cell.r},${cell.c}`, cell));

    // Limpiar celdas y romper hielo
    const cellPixels = getBoardCellPixels();
    let iceBrokenCount = 0;

    cellsToRemove.forEach(cell => {
      const gem = State.grid[cell.r][cell.c];
      if (gem.type !== 0) {
        const pos = cellPixels(cell.r, cell.c);
        const gemColor = CONFIG.GEMS[gem.type - 1]?.base || '#00e5ff';
        ParticlePool.spawn(pos.x, pos.y, gemColor, 10, 140);
      }

      // Romper hielo si había
      if (State.iceGrid[cell.r][cell.c] === 1) {
        State.iceGrid[cell.r][cell.c] = 0;
        State.iceRemaining--;
        iceBrokenCount++;
      }

      State.grid[cell.r][cell.c] = { type: 0, special: CONFIG.SPECIALS.NONE };
    });

    if (iceBrokenCount > 0) playAudio('ice_break');

    // Colocar especial creado si corresponde
    if (specialToCreate) {
      State.grid[specialToCreate.r][specialToCreate.c] = {
        type: specialToCreate.type,
        special: specialToCreate.special
      };
      playAudio('special_created');
      const pos = cellPixels(specialToCreate.r, specialToCreate.c);
      ParticlePool.spawn(pos.x, pos.y, '#ffffff', 20, 220);
    }

    // Puntos y bono de combo
    const matchPoints = cellsToRemove.size * 50 * State.combo;
    State.score += matchPoints;

    if (State.isEndless) {
      State.timeRemaining = Math.min(120, State.timeRemaining + cellsToRemove.size * 0.4 + State.combo);
    }

    State.combo++;
    updateHUD();

    // Siguiente paso de cascada: gravedad y rellenado
    setTimeout(() => {
      handleGravityAndRefill();
    }, 180);
  }

  function handleGravityAndRefill() {
    // 1. Aplicar gravedad
    const drops = CristalesLogic.applyGravity(State.grid);

    // 2. Rellenar huecos superiores con nuevas gemas
    const newGems = CristalesLogic.refillTop(State.grid, CONFIG.NUM_GEM_TYPES);

    // Animación visual de caída
    State.animations.push({
      type: 'FALL',
      progress: 0,
      duration: CONFIG.BASE_FALL_DURATION,
      onComplete: () => {
        // Continuar evaluando cascadas
        processMatchesAndCascades();
      }
    });
  }

  function triggerAutoShuffle() {
    State.state = 'ANIMATING';
    playAudio('color_bomb');

    CristalesLogic.shuffleUntilValid(State.grid, CONFIG.NUM_GEM_TYPES);

    const cellPixels = getBoardCellPixels();
    for (let r = 0; r < CONFIG.ROWS; r++) {
      for (let c = 0; c < CONFIG.COLS; c++) {
        const pos = cellPixels(r, c);
        ParticlePool.spawn(pos.x, pos.y, '#00d2ff', 3, 100);
      }
    }

    setTimeout(() => {
      State.state = 'PLAYING';
      updateHUD();
    }, 400);
  }

  function checkWinOrLossConditions() {
    if (State.isEndless) {
      if (State.timeRemaining <= 0) {
        endGame(false, '¡Tiempo agotado!');
      }
      return;
    }

    const lvl = CONFIG.LEVELS[State.currentLevelIdx];
    const scoreReached = State.score >= lvl.targetScore;
    const iceCleared = State.iceRemaining === 0;

    // Victoria
    if (scoreReached && iceCleared) {
      endGame(true, '¡Nivel Superado con Éxito!');
      return;
    }

    // Derrota por falta de movimientos
    if (State.movesLeft <= 0) {
      let reason = 'Te quedaste sin movimientos.';
      if (!scoreReached) reason += ' Faltaron puntos.';
      if (!iceCleared) reason += ' Quedó hielo sin romper.';
      endGame(false, reason);
    }
  }

  function endGame(isVictory, message) {
    State.state = isVictory ? 'VICTORY' : 'GAMEOVER';

    if (isVictory) {
      playAudio('victory');
      saveLevelRecord(State.currentLevelIdx, State.score);
      setUnlockedLevel(State.currentLevelIdx + 1);
    } else {
      playAudio('game_over');
      if (State.isEndless) {
        saveEndlessRecord(State.score);
      }
    }

    // Mostrar modal de resultado
    dom.resultIcon.textContent = isVictory ? '💎' : '⌛';
    dom.resultTitle.textContent = isVictory ? '¡NIVEL SUPERADO!' : 'FIN DE LA PARTIDA';
    dom.resultSubtitle.textContent = message;
    dom.resultScoreVal.textContent = State.score.toLocaleString();

    const best = State.isEndless ? getEndlessRecord() : getLevelRecord(State.currentLevelIdx);
    dom.resultBestVal.textContent = best.toLocaleString();

    if (State.isEndless) {
      dom.starsRow.classList.add('hidden');
      dom.btnNextLevel.classList.add('hidden');
    } else {
      dom.starsRow.classList.remove('hidden');
      const lvl = CONFIG.LEVELS[State.currentLevelIdx];
      const stars = State.score >= lvl.targetScore * 1.5 ? 3 : (State.score >= lvl.targetScore * 1.2 ? 2 : 1);
      dom.starsRow.innerHTML = '';
      for (let s = 1; s <= 3; s++) {
        const starSpan = document.createElement('span');
        starSpan.className = s <= stars ? 'star-slot filled' : 'star-slot empty';
        starSpan.textContent = '★';
        dom.starsRow.appendChild(starSpan);
      }

      if (isVictory && State.currentLevelIdx < CONFIG.LEVELS.length - 1) {
        dom.btnNextLevel.classList.remove('hidden');
      } else {
        dom.btnNextLevel.classList.add('hidden');
      }
    }

    dom.overlayResult.classList.remove('hidden');
  }

  // ==========================================
  // RENDERIZADO VECTORIAL 3D Y FACETAS
  // ==========================================
  function getBoardDimensions() {
    const size = State.boardSize || 360;
    const tileSize = size / CONFIG.COLS;
    const startX = 0;
    const startY = 0;

    return { startX, startY, size, tileSize };
  }

  function getBoardCellPixels() {
    const { startX, startY, tileSize } = getBoardDimensions();
    return (r, c) => ({
      x: startX + c * tileSize + tileSize / 2,
      y: startY + r * tileSize + tileSize / 2,
      size: tileSize
    });
  }

  function render() {
    const ctx = State.ctx;
    if (!ctx) return;

    const size = State.boardSize || 360;
    ctx.clearRect(0, 0, size, size);

    // Fondo del tablero con bisel redondeado y textura de cristal oscuro
    const { startX, startY, tileSize } = getBoardDimensions();

    ctx.save();
    ctx.fillStyle = 'rgba(10, 24, 48, 0.7)';
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(startX - 4, startY - 4, size + 8, size + 8, 16);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Dibujar casillas de fondo y capas de hielo
    for (let r = 0; r < CONFIG.ROWS; r++) {
      for (let c = 0; c < CONFIG.COLS; c++) {
        const x = startX + c * tileSize;
        const y = startY + r * tileSize;

        // Cuadrícula sutil
        ctx.fillStyle = ((r + c) % 2 === 0) ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);

        // Capa de Hielo / Escarcha
        if (State.iceGrid && State.iceGrid[r][c] === 1) {
          renderIceTile(ctx, x, y, tileSize);
        }
      }
    }

    // Resaltar celda seleccionada por el jugador
    if (State.selectedCell) {
      const { r, c } = State.selectedCell;
      const x = startX + c * tileSize;
      const y = startY + r * tileSize;
      ctx.save();
      ctx.strokeStyle = '#ffe066';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ffe066';
      ctx.shadowBlur = 12;
      ctx.strokeRect(x + 3, y + 3, tileSize - 6, tileSize - 6);
      ctx.restore();
    }

    // Resaltar sugerencia / pista si está activa
    if (State.hintMove) {
      const { r1, c1, r2, c2 } = State.hintMove;
      const p = (Math.sin(State.hintPulse * 5) + 1) * 0.5;
      ctx.save();
      ctx.strokeStyle = `rgba(0, 255, 200, ${0.4 + p * 0.6})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00ffcc';
      ctx.shadowBlur = 8 + p * 8;

      const x1 = startX + c1 * tileSize;
      const y1 = startY + r1 * tileSize;
      const x2 = startX + c2 * tileSize;
      const y2 = startY + r2 * tileSize;

      ctx.strokeRect(x1 + 3, y1 + 3, tileSize - 6, tileSize - 6);
      ctx.strokeRect(x2 + 3, y2 + 3, tileSize - 6, tileSize - 6);
      ctx.restore();
    }

    // Renderizar gemas de la matriz
    if (State.grid) {
      for (let r = 0; r < CONFIG.ROWS; r++) {
        for (let c = 0; c < CONFIG.COLS; c++) {
          const gem = State.grid[r][c];
          if (gem.type === 0) continue;

          // Si la celda está involucrada en animación de swap activa, omitir (se dibuja en capa de animación)
          const isSwapping = State.animations.some(
            a => a.type === 'SWAP' && ((a.r1 === r && a.c1 === c) || (a.r2 === r && a.c2 === c))
          );
          if (isSwapping) continue;

          const cx = startX + c * tileSize + tileSize / 2;
          const cy = startY + r * tileSize + tileSize / 2;
          const rad = tileSize * 0.42;

          renderGem3D(ctx, cx, cy, rad, gem.type, gem.special);
        }
      }
    }

    // Renderizar gemas en animación de intercambio
    for (const anim of State.animations) {
      if (anim.type === 'SWAP') {
        const t = anim.reverting
          ? Math.sin(anim.progress * Math.PI) // Va y regresa
          : anim.progress; // Va derecho

        const p1 = {
          x: startX + anim.c1 * tileSize + tileSize / 2,
          y: startY + anim.r1 * tileSize + tileSize / 2
        };
        const p2 = {
          x: startX + anim.c2 * tileSize + tileSize / 2,
          y: startY + anim.r2 * tileSize + tileSize / 2
        };

        const g1 = State.grid[anim.r1][anim.c1];
        const g2 = State.grid[anim.r2][anim.c2];
        const rad = tileSize * 0.42;

        const curX1 = p1.x + (p2.x - p1.x) * t;
        const curY1 = p1.y + (p2.y - p1.y) * t;
        const curX2 = p2.x + (p1.x - p2.x) * t;
        const curY2 = p2.y + (p1.y - p2.y) * t;

        renderGem3D(ctx, curX1, curY1, rad, g1.type, g1.special);
        renderGem3D(ctx, curX2, curY2, rad, g2.type, g2.special);
      }
    }

    // Renderizar partículas
    ParticlePool.render(ctx);
  }

  /**
   * Renderiza una casilla con capa de hielo y fisuras de escarcha
   */
  function renderIceTile(ctx, x, y, size) {
    ctx.save();
    ctx.fillStyle = 'rgba(180, 230, 255, 0.35)';
    ctx.fillRect(x + 2, y + 2, size - 4, size - 4);

    // Borde brillante de hielo
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);

    // Fisuras de escarcha
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 6);
    ctx.lineTo(x + size * 0.4, y + size * 0.4);
    ctx.lineTo(x + size * 0.7, y + size * 0.3);
    ctx.moveTo(x + size * 0.4, y + size * 0.4);
    ctx.lineTo(x + size * 0.3, y + size * 0.8);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Renderizado pseudo-3D vectorial de gemas con cortes prismáticos y facetas reflectivas
   */
  function renderGem3D(ctx, cx, cy, rad, type, special = CONFIG.SPECIALS.NONE) {
    ctx.save();

    // Sombra proyectada suave
    ctx.beginPath();
    ctx.arc(cx + rad * 0.1, cy + rad * 0.15, rad * 0.9, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();

    // Si es Bomba de Color: esfera hiper-dimensional arcoíris
    if (special === CONFIG.SPECIALS.COLOR_BOMB) {
      renderColorBomb3D(ctx, cx, cy, rad);
      ctx.restore();
      return;
    }

    const cfg = CONFIG.GEMS[type - 1] || CONFIG.GEMS[0];

    switch (type) {
      case 1: // RUBY: Hexágono con facetas triangulares hacia el vértice
        renderFacetedHexagon(ctx, cx, cy, rad, cfg);
        break;
      case 2: // SAPPHIRE: Corte octogonal con facetas escalonadas
        renderFacetedOctagon(ctx, cx, cy, rad, cfg);
        break;
      case 3: // EMERALD: Cuadrado rotado 45° con biseles
        renderFacetedEmerald(ctx, cx, cy, rad, cfg);
        break;
      case 4: // TOPAZ: Triángulo brillante con facetas internas
        renderFacetedTriangle(ctx, cx, cy, rad, cfg);
        break;
      case 5: // AMETHYST: Rombo / Marquise alargado
        renderFacetedMarquise(ctx, cx, cy, rad, cfg);
        break;
      case 6: // DIAMOND: Corte brillante clásico con halo cian
        renderFacetedDiamond(ctx, cx, cy, rad, cfg);
        break;
      default:
        renderFacetedHexagon(ctx, cx, cy, rad, cfg);
    }

    // Efecto de gema especial de línea (Haz de energía)
    if (special === CONFIG.SPECIALS.LINE_H || special === CONFIG.SPECIALS.LINE_V) {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      if (special === CONFIG.SPECIALS.LINE_H) {
        ctx.moveTo(cx - rad * 0.9, cy);
        ctx.lineTo(cx + rad * 0.9, cy);
      } else {
        ctx.moveTo(cx, cy - rad * 0.9);
        ctx.lineTo(cx, cy + rad * 0.9);
      }
      ctx.stroke();

      // Flechas en los extremos
      ctx.fillStyle = '#ffffff';
      if (special === CONFIG.SPECIALS.LINE_H) {
        ctx.fillRect(cx - rad * 0.9, cy - 2, 4, 4);
        ctx.fillRect(cx + rad * 0.9 - 4, cy - 2, 4, 4);
      } else {
        ctx.fillRect(cx - 2, cy - rad * 0.9, 4, 4);
        ctx.fillRect(cx - 2, cy + rad * 0.9 - 4, 4, 4);
      }
      ctx.restore();
    }

    ctx.restore();
  }

  function renderFacetedHexagon(ctx, cx, cy, r, cfg) {
    const sides = 6;
    const outer = [];
    const inner = [];
    const innerR = r * 0.45;

    for (let i = 0; i < sides; i++) {
      const angle = (i * Math.PI * 2) / sides - Math.PI / 2;
      outer.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
      inner.push({ x: cx + Math.cos(angle) * innerR, y: cy + Math.sin(angle) * innerR });
    }

    // Facetas exteriores trapezoidales
    for (let i = 0; i < sides; i++) {
      const next = (i + 1) % sides;
      ctx.beginPath();
      ctx.moveTo(outer[i].x, outer[i].y);
      ctx.lineTo(outer[next].x, outer[next].y);
      ctx.lineTo(inner[next].x, inner[next].y);
      ctx.lineTo(inner[i].x, inner[i].y);
      ctx.closePath();

      // Graduación de luz según ángulo
      ctx.fillStyle = (i === 0 || i === 5) ? cfg.light : (i === 1 || i === 4 ? cfg.base : cfg.dark);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Tabla central plana brillante
    ctx.beginPath();
    ctx.moveTo(inner[0].x, inner[0].y);
    for (let i = 1; i < sides; i++) ctx.lineTo(inner[i].x, inner[i].y);
    ctx.closePath();
    ctx.fillStyle = cfg.facet;
    ctx.fill();
    ctx.stroke();

    // Reflejo especular blanco
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.25, cy - r * 0.25, r * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  function renderFacetedOctagon(ctx, cx, cy, r, cfg) {
    const sides = 8;
    const outer = [];
    const inner = [];
    const innerR = r * 0.55;

    for (let i = 0; i < sides; i++) {
      const angle = (i * Math.PI * 2) / sides - Math.PI / 8;
      outer.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
      inner.push({ x: cx + Math.cos(angle) * innerR, y: cy + Math.sin(angle) * innerR });
    }

    for (let i = 0; i < sides; i++) {
      const next = (i + 1) % sides;
      ctx.beginPath();
      ctx.moveTo(outer[i].x, outer[i].y);
      ctx.lineTo(outer[next].x, outer[next].y);
      ctx.lineTo(inner[next].x, inner[next].y);
      ctx.lineTo(inner[i].x, inner[i].y);
      ctx.closePath();
      ctx.fillStyle = (i >= 6 || i <= 1) ? cfg.light : (i === 2 || i === 5 ? cfg.base : cfg.dark);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(inner[0].x, inner[0].y);
    for (let i = 1; i < sides; i++) ctx.lineTo(inner[i].x, inner[i].y);
    ctx.closePath();
    ctx.fillStyle = cfg.facet;
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(cx - r * 0.35, cy - r * 0.35, r * 0.25, r * 0.1);
  }

  function renderFacetedEmerald(ctx, cx, cy, r, cfg) {
    // Rombo cuadrado rotado 45 grados
    const s = r * 1.1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - s);
    ctx.lineTo(cx + s, cy);
    ctx.lineTo(cx, cy + s);
    ctx.lineTo(cx - s, cy);
    ctx.closePath();

    // Biseles exteriores
    const inS = s * 0.5;
    // Triángulo superior
    ctx.fillStyle = cfg.light;
    ctx.beginPath();
    ctx.moveTo(cx, cy - s);
    ctx.lineTo(cx + inS, cy - inS);
    ctx.lineTo(cx - inS, cy - inS);
    ctx.closePath();
    ctx.fill();

    // Triángulo inferior
    ctx.fillStyle = cfg.dark;
    ctx.beginPath();
    ctx.moveTo(cx, cy + s);
    ctx.lineTo(cx + inS, cy + inS);
    ctx.lineTo(cx - inS, cy + inS);
    ctx.closePath();
    ctx.fill();

    // Triángulos laterales
    ctx.fillStyle = cfg.base;
    ctx.beginPath();
    ctx.moveTo(cx - s, cy);
    ctx.lineTo(cx - inS, cy - inS);
    ctx.lineTo(cx - inS, cy + inS);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + s, cy);
    ctx.lineTo(cx + inS, cy - inS);
    ctx.lineTo(cx + inS, cy + inS);
    ctx.closePath();
    ctx.fill();

    // Centro
    ctx.fillStyle = cfg.facet;
    ctx.fillRect(cx - inS, cy - inS, inS * 2, inS * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.strokeRect(cx - inS, cy - inS, inS * 2, inS * 2);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(cx - inS * 0.4, cy - inS * 0.4, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
  }

  function renderFacetedTriangle(ctx, cx, cy, r, cfg) {
    const h = r * 1.15;
    const p1 = { x: cx, y: cy - h * 0.9 };
    const p2 = { x: cx + r * 1.05, y: cy + h * 0.8 };
    const p3 = { x: cx - r * 1.05, y: cy + h * 0.8 };
    const center = { x: cx, y: cy + h * 0.1 };

    // 3 facetas triangulares hacia el centro
    ctx.fillStyle = cfg.light;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(center.x, center.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.stroke();

    ctx.fillStyle = cfg.dark;
    ctx.beginPath();
    ctx.moveTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(center.x, center.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = cfg.base;
    ctx.beginPath();
    ctx.moveTo(p3.x, p3.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(center.x, center.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.2, cy - r * 0.1, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
  }

  function renderFacetedMarquise(ctx, cx, cy, r, cfg) {
    const rx = r * 0.75;
    const ry = r * 1.15;

    ctx.beginPath();
    ctx.moveTo(cx, cy - ry);
    ctx.quadraticCurveTo(cx + rx * 1.4, cy, cx, cy + ry);
    ctx.quadraticCurveTo(cx - rx * 1.4, cy, cx, cy - ry);
    ctx.closePath();
    ctx.fillStyle = cfg.base;
    ctx.fill();

    // Facetas centrales
    ctx.fillStyle = cfg.light;
    ctx.beginPath();
    ctx.moveTo(cx, cy - ry);
    ctx.lineTo(cx, cy + ry);
    ctx.quadraticCurveTo(cx - rx, cy, cx, cy - ry);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = cfg.facet;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.4, ry * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(cx - rx * 0.2, cy - ry * 0.3, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  function renderFacetedDiamond(ctx, cx, cy, r, cfg) {
    // Diamante blanco-celeste de alta pureza con reflejos prismáticos
    const sides = 8;
    const outer = [];
    const innerR = r * 0.6;

    for (let i = 0; i < sides; i++) {
      const angle = (i * Math.PI * 2) / sides;
      outer.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
    }

    ctx.beginPath();
    ctx.moveTo(outer[0].x, outer[0].y);
    for (let i = 1; i < sides; i++) ctx.lineTo(outer[i].x, outer[i].y);
    ctx.closePath();
    ctx.fillStyle = cfg.base;
    ctx.fill();

    // Tabla central y destellos
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fillStyle = cfg.facet;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.stroke();

    // Estrella de 4 puntas de brillo especular
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.7);
    ctx.lineTo(cx + r * 0.15, cy);
    ctx.lineTo(cx, cy + r * 0.7);
    ctx.lineTo(cx - r * 0.15, cy);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx - r * 0.7, cy);
    ctx.lineTo(cx, cy + r * 0.15);
    ctx.lineTo(cx + r * 0.7, cy);
    ctx.lineTo(cx, cy - r * 0.15);
    ctx.closePath();
    ctx.fill();
  }

  function renderColorBomb3D(ctx, cx, cy, r) {
    // Esfera prismática con gradiente radial cromático y halo
    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.2, '#00ffff');
    grad.addColorStop(0.4, '#ff00ff');
    grad.addColorStop(0.6, '#ffff00');
    grad.addColorStop(0.8, '#00ff66');
    grad.addColorStop(1, '#112244');

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Anillo giratorio de energía
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 1.15, r * 0.4, Math.sin(Date.now() * 0.003), 0, Math.PI * 2);
    ctx.stroke();
  }

  // ==========================================
  // GESTIÓN DE INPUTS TÁCTILES Y SWIPES
  // ==========================================
  function setupInputs() {
    const canvas = dom.canvas;

    function getCoords(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const boardSize = State.boardSize || rect.width;
      const scaleX = boardSize / rect.width;
      const scaleY = boardSize / rect.height;

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    }

    function pointToGridCell(px, py) {
      const { startX, startY, size, tileSize } = getBoardDimensions();
      if (px < startX || px >= startX + size || py < startY || py >= startY + size) {
        return null;
      }
      const c = Math.floor((px - startX) / tileSize);
      const r = Math.floor((py - startY) / tileSize);
      if (r >= 0 && r < CONFIG.ROWS && c >= 0 && c < CONFIG.COLS) {
        return { r, c };
      }
      return null;
    }

    // Touch / Pointer Down
    function handlePointerDown(e) {
      if (State.state !== 'PLAYING') return;

      if (window.ArcadeAudio?.ctx?.state === 'suspended') {
        window.ArcadeAudio.ctx.resume();
      }

      const { x, y } = getCoords(e);
      const cell = pointToGridCell(x, y);
      if (!cell) return;

      State.touchStartCell = cell;
      State.touchStartX = x;
      State.touchStartY = y;

      // Si ya había una celda seleccionada por toque previo
      if (State.selectedCell) {
        const dist = Math.abs(State.selectedCell.r - cell.r) + Math.abs(State.selectedCell.c - cell.c);
        if (dist === 1) {
          // Intercambio por segundo toque adyacente
          const r1 = State.selectedCell.r;
          const c1 = State.selectedCell.c;
          State.selectedCell = null;
          handleCellSwap(r1, c1, cell.r, cell.c);
          return;
        }
      }

      State.selectedCell = cell;
      playAudio('select');
      window.ArcadeCanvas?.haptic(5);
    }

    // Pointer Move (Swipe)
    function handlePointerMove(e) {
      if (!State.touchStartCell || State.state !== 'PLAYING') return;

      const { x, y } = getCoords(e);
      const dx = x - State.touchStartX;
      const dy = y - State.touchStartY;
      const threshold = getBoardDimensions().tileSize * 0.35;

      if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
        let targetR = State.touchStartCell.r;
        let targetC = State.touchStartCell.c;

        if (Math.abs(dx) > Math.abs(dy)) {
          targetC += dx > 0 ? 1 : -1;
        } else {
          targetR += dy > 0 ? 1 : -1;
        }

        if (targetR >= 0 && targetR < CONFIG.ROWS && targetC >= 0 && targetC < CONFIG.COLS) {
          const r1 = State.touchStartCell.r;
          const c1 = State.touchStartCell.c;
          State.touchStartCell = null;
          State.selectedCell = null;
          handleCellSwap(r1, c1, targetR, targetC);
        }
      }
    }

    function handlePointerUp() {
      State.touchStartCell = null;
    }

    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      handlePointerMove(e);
    }, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
  }

  // ==========================================
  // BUCLE PRINCIPAL DE JUEGO
  // ==========================================
  function gameLoop(timestamp) {
    if (!State.lastTime) State.lastTime = timestamp;
    const dt = Math.min((timestamp - State.lastTime) / 1000, 0.1);
    State.lastTime = timestamp;

    if (State.state === 'PLAYING') {
      // Cronómetro en modo infinito
      if (State.isEndless) {
        State.timeRemaining -= dt;
        if (State.timeRemaining <= 0) {
          State.timeRemaining = 0;
          updateHUD();
          checkWinOrLossConditions();
        } else {
          updateHUD();
        }
      }

      // Temporizador de pistas automáticas
      State.hintTimer += dt;
      if (State.hintTimer >= CONFIG.HINT_DELAY && !State.hintMove) {
        State.hintMove = CristalesLogic.findAnyValidMove(State.grid);
      }
      if (State.hintMove) {
        State.hintPulse += dt;
      }
    }

    // Actualizar animaciones
    for (let i = State.animations.length - 1; i >= 0; i--) {
      const a = State.animations[i];
      a.progress += dt / a.duration;
      if (a.progress >= 1) {
        a.progress = 1;
        State.animations.splice(i, 1);
        if (a.onComplete) a.onComplete();
      }
    }

    // Actualizar partículas
    ParticlePool.update(dt);

    // Dibujar frame
    render();

    requestAnimationFrame(gameLoop);
  }

  // ==========================================
  // CONFIGURACIÓN DE UI Y EVENTOS
  // ==========================================
  function handleResize() {
    const container = dom.canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const size = Math.floor(Math.min(rect.width, rect.height) * 0.98);

    State.boardSize = size;
    State.tileSize = size / CONFIG.COLS;

    const dpr = window.devicePixelRatio || 1;
    dom.canvas.style.width = `${size}px`;
    dom.canvas.style.height = `${size}px`;
    dom.canvas.width = Math.round(size * dpr);
    dom.canvas.height = Math.round(size * dpr);

    State.ctx = dom.canvas.getContext('2d');
    State.ctx.resetTransform();
    State.ctx.scale(dpr, dpr);
  }

  function setupUI() {
    window.addEventListener('resize', handleResize);

    // Pestañas modal inicial
    dom.tabLevels.addEventListener('click', () => {
      dom.tabLevels.classList.add('active');
      dom.tabEndless.classList.remove('active');
      dom.levelsView.classList.remove('hidden');
      dom.endlessView.classList.add('hidden');
    });

    dom.tabEndless.addEventListener('click', () => {
      dom.tabEndless.classList.add('active');
      dom.tabLevels.classList.remove('active');
      dom.endlessView.classList.remove('hidden');
      dom.levelsView.classList.add('hidden');
    });

    dom.btnStartEndless.addEventListener('click', () => {
      playAudio('select');
      startEndless();
    });

    // Botón de pista manual
    dom.btnHint.addEventListener('click', () => {
      if (State.state !== 'PLAYING') return;
      State.hintMove = CristalesLogic.findAnyValidMove(State.grid);
      State.hintPulse = 0;
      playAudio('select');
      window.ArcadeCanvas?.haptic(10);
    });

    // Pausa
    dom.btnPauseHeader.addEventListener('click', () => {
      if (State.state !== 'PLAYING') return;
      State.state = 'PAUSED';
      dom.overlayPause.classList.remove('hidden');
      playAudio('select');
    });

    dom.btnResume.addEventListener('click', () => {
      State.state = 'PLAYING';
      dom.overlayPause.classList.add('hidden');
      playAudio('select');
    });

    dom.btnRestartLevel.addEventListener('click', () => {
      if (State.isEndless) startEndless();
      else startLevel(State.currentLevelIdx);
    });

    dom.btnLevelSelect.addEventListener('click', () => {
      dom.overlayPause.classList.add('hidden');
      renderLevelSelector();
      dom.startCard.classList.remove('hidden');
      State.state = 'MENU';
    });

    // Botones de modal resultado
    dom.btnNextLevel.addEventListener('click', () => {
      if (State.currentLevelIdx < CONFIG.LEVELS.length - 1) {
        startLevel(State.currentLevelIdx + 1);
      }
    });

    dom.btnRetryLevel.addEventListener('click', () => {
      if (State.isEndless) startEndless();
      else startLevel(State.currentLevelIdx);
    });

    dom.btnExitToLevels.addEventListener('click', () => {
      dom.overlayResult.classList.add('hidden');
      renderLevelSelector();
      dom.startCard.classList.remove('hidden');
      State.state = 'MENU';
    });

    // Mute / Unmute
    dom.btnSoundToggle.addEventListener('click', () => {
      if (window.ArcadeAudio) {
        const muted = window.ArcadeAudio.toggleMute();
        dom.iconSoundOn.classList.toggle('hidden', muted);
        dom.iconSoundOff.classList.toggle('hidden', !muted);
      }
    });

    if (window.ArcadeAudio?.isMuted) {
      dom.iconSoundOn.classList.add('hidden');
      dom.iconSoundOff.classList.remove('hidden');
    }
  }

  function init() {
    handleResize();
    setupInputs();
    setupUI();
    renderLevelSelector();

    requestAnimationFrame(gameLoop);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
