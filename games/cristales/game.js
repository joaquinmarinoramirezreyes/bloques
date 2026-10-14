/**
 * games/cristales/game.js - Cristales Arcade 00s (Edición Maestra de Calidad)
 * Match-3 de gemas prismáticas vectoriales con facetas 3D y brillos animados,
 * 4 mundos con 40 niveles de campaña, obstáculos temáticos (hielo, cadenas, runas, transformantes),
 * potenciadores (martillo, mezcla, swap libre), combinaciones dobles y Juice total.
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
    STORAGE_KEY_PREFIX: 'cristales:v2',

    GEMS: [
      { id: 1, name: 'RUBY',     base: '#e60039', dark: '#80001a', light: '#ff6688', facet: '#ff99b3', shape: 'octagon' },
      { id: 2, name: 'SAPPHIRE', base: '#0066ff', dark: '#002699', light: '#66b3ff', facet: '#b3d9ff', shape: 'shield' },
      { id: 3, name: 'EMERALD',  base: '#00cc44', dark: '#00591f', light: '#66ff99', facet: '#b3ffcc', shape: 'hexagon' },
      { id: 4, name: 'TOPAZ',    base: '#ffbb00', dark: '#997000', light: '#ffdd66', facet: '#fff2b3', shape: 'diamond' },
      { id: 5, name: 'AMETHYST', base: '#9933ff', dark: '#4c0099', light: '#cc99ff', facet: '#e6ccff', shape: 'triangle' },
      { id: 6, name: 'DIAMOND',  base: '#00e5ff', dark: '#007380', light: '#99f5ff', facet: '#ffffff', shape: 'star' }
    ],

    SPECIALS: {
      NONE: 0,
      LINE_H: 1,
      LINE_V: 2,
      BOMB: 3,
      COLOR_BOMB: 4
    },

    OBSTACLES: {
      NONE: 0,
      ICE: 1,       // Hielo en celda (Mundo 1)
      CHAINS: 2,    // Cadenas sobre gema (Mundo 2)
      LOCKED: 3,    // Runa bloqueada inerte (Mundo 3)
      SHIFTER: 4    // Gema que cambia de color cada turno (Mundo 4)
    },

    HINT_DELAY: 4.5,
    BASE_SWAP_DURATION: 0.18,
    BASE_FALL_DURATION: 0.22,

    // 4 MUNDOS TEMÁTICOS CON 40 NIVELES DEFINIDOS COMO DATOS
    WORLDS: [
      { id: 1, name: 'Mundo 1: Mina de Amatista', bgTop: '#15092a', bgBottom: '#070312', accent: '#b388ff', obstacleType: 'ICE' },
      { id: 2, name: 'Mundo 2: Glaciar Cristalino', bgTop: '#041c2c', bgBottom: '#020b12', accent: '#00e5ff', obstacleType: 'CHAINS' },
      { id: 3, name: 'Mundo 3: Templo Solar', bgTop: '#2b1a04', bgBottom: '#100a02', accent: '#ffbb00', obstacleType: 'LOCKED' },
      { id: 4, name: 'Mundo 4: Volcán de Obsidiana', bgTop: '#2a050c', bgBottom: '#100204', accent: '#ff2255', obstacleType: 'SHIFTER' }
    ],

    // 40 NIVELES TOTALES (10 POR MUNDO)
    LEVELS: [
      // MUNDO 1: MINA DE AMATISTA (1 - 10) - Obstáculo: Hielo
      { id: 1, world: 1, name: 'Despertar Prismático', targetScore: 1000, moves: 25, iceGoal: 0, iceLayout: [] },
      { id: 2, world: 1, name: 'Vena de Cuarzo I', targetScore: 1600, moves: 24, iceGoal: 4, iceLayout: [[3,3],[3,4],[4,3],[4,4]] },
      { id: 3, world: 1, name: 'Cascada de Zafiro', targetScore: 2400, moves: 25, iceGoal: 0, iceLayout: [] },
      { id: 4, world: 1, name: 'Vena de Cuarzo II', targetScore: 3000, moves: 25, iceGoal: 8, iceLayout: [[2,2],[2,5],[3,3],[3,4],[4,3],[4,4],[5,2],[5,5]] },
      { id: 5, world: 1, name: 'Prisma Alquímico', targetScore: 3800, moves: 24, iceGoal: 0, iceLayout: [] },
      { id: 6, world: 1, name: 'Cámara Escarchada', targetScore: 4600, moves: 26, iceGoal: 12, iceLayout: [[1,1],[1,6],[2,3],[2,4],[3,2],[3,5],[4,2],[4,5],[5,3],[5,4],[6,1],[6,6]] },
      { id: 7, world: 1, name: 'Fiebre Esmeralda', targetScore: 5500, moves: 24, iceGoal: 0, iceLayout: [] },
      { id: 8, world: 1, name: 'Celdas de Amatista', targetScore: 6500, moves: 26, iceGoal: 16, iceLayout: [[2,2],[2,3],[2,4],[2,5],[3,2],[3,5],[4,2],[4,5],[5,2],[5,3],[5,4],[5,5],[1,3],[1,4],[6,3],[6,4]] },
      { id: 9, world: 1, name: 'Falla Profunda', targetScore: 7800, moves: 26, iceGoal: 0, iceLayout: [] },
      { id: 10, world: 1, name: 'Corazón de la Mina', targetScore: 9000, moves: 28, iceGoal: 20, iceLayout: [[1,1],[1,2],[1,5],[1,6],[2,1],[2,2],[2,5],[2,6],[5,1],[5,2],[5,5],[5,6],[6,1],[6,2],[6,5],[6,6],[3,3],[3,4],[4,3],[4,4]] },

      // MUNDO 2: GLACIAR CRISTALINO (11 - 20) - Obstáculo: Cadenas
      { id: 11, world: 2, name: 'Umbral Gélido', targetScore: 10000, moves: 26, chainsGoal: 4, chainLayout: [[3,2],[3,5],[4,2],[4,5]] },
      { id: 12, world: 2, name: 'Aurora Borealis', targetScore: 11500, moves: 25, chainsGoal: 0, chainLayout: [] },
      { id: 13, world: 2, name: 'Banquisa Encadenada', targetScore: 13000, moves: 27, chainsGoal: 8, chainLayout: [[2,3],[2,4],[3,2],[3,5],[4,2],[4,5],[5,3],[5,4]] },
      { id: 14, world: 2, name: 'Serac de Zafiro', targetScore: 14500, moves: 25, chainsGoal: 0, chainLayout: [] },
      { id: 15, world: 2, name: 'Abismo de Escarcha', targetScore: 16000, moves: 28, chainsGoal: 10, chainLayout: [[1,3],[1,4],[3,1],[3,6],[4,1],[4,6],[6,3],[6,4],[3,3],[4,4]] },
      { id: 16, world: 2, name: 'Ventisca Silenciosa', targetScore: 18000, moves: 26, chainsGoal: 0, chainLayout: [] },
      { id: 17, world: 2, name: 'Prisión de Hielo Azul', targetScore: 20000, moves: 29, chainsGoal: 12, chainLayout: [[2,2],[2,5],[3,3],[3,4],[4,3],[4,4],[5,2],[5,5],[1,1],[1,6],[6,1],[6,6]] },
      { id: 18, world: 2, name: 'Monolito Glacial', targetScore: 22000, moves: 27, chainsGoal: 0, chainLayout: [] },
      { id: 19, world: 2, name: 'Cúpula Criogénica', targetScore: 24500, moves: 30, chainsGoal: 14, chainLayout: [[2,1],[2,6],[3,2],[3,5],[4,2],[4,5],[5,1],[5,6],[1,3],[1,4],[6,3],[6,4],[3,3],[4,4]] },
      { id: 20, world: 2, name: 'Vórtice del Cero Absoluto', targetScore: 27000, moves: 32, chainsGoal: 16, chainLayout: [[1,2],[1,5],[2,1],[2,6],[5,1],[5,6],[6,2],[6,5],[3,2],[3,5],[4,2],[4,5],[2,3],[2,4],[5,3],[5,4]] },

      // MUNDO 3: TEMPLO SOLAR (21 - 30) - Obstáculo: Runas de Piedra Bloqueadas
      { id: 21, world: 3, name: 'Pórtico Dorado', targetScore: 29000, moves: 27, lockedGoal: 4, lockedLayout: [[3,3],[3,4],[4,3],[4,4]] },
      { id: 22, world: 3, name: 'Columnas Solares', targetScore: 31000, moves: 25, lockedGoal: 0, lockedLayout: [] },
      { id: 23, world: 3, name: 'Sello del Faraón', targetScore: 33500, moves: 28, lockedGoal: 8, lockedLayout: [[2,2],[2,5],[3,2],[3,5],[4,2],[4,5],[5,2],[5,5]] },
      { id: 24, world: 3, name: 'Altar de Topacio', targetScore: 36000, moves: 26, lockedGoal: 0, lockedLayout: [] },
      { id: 25, world: 3, name: 'Cámara de las Runas', targetScore: 39000, moves: 29, lockedGoal: 10, lockedLayout: [[1,1],[1,6],[6,1],[6,6],[3,3],[3,4],[4,3],[4,4],[2,4],[5,3]] },
      { id: 26, world: 3, name: 'Rayo Cenital', targetScore: 42000, moves: 26, lockedGoal: 0, lockedLayout: [] },
      { id: 27, world: 3, name: 'Laberinto del Sol', targetScore: 45000, moves: 30, lockedGoal: 12, lockedLayout: [[2,1],[2,6],[3,3],[3,4],[4,3],[4,4],[5,1],[5,6],[1,3],[1,4],[6,3],[6,4]] },
      { id: 28, world: 3, name: 'Obelisco Brillante', targetScore: 48500, moves: 27, lockedGoal: 0, lockedLayout: [] },
      { id: 29, world: 3, name: 'Cripta de Helios', targetScore: 52000, moves: 31, lockedGoal: 14, lockedLayout: [[1,2],[1,5],[2,3],[2,4],[5,3],[5,4],[6,2],[6,5],[3,1],[3,6],[4,1],[4,6],[3,4],[4,3]] },
      { id: 30, world: 3, name: 'Zenit Radiante', targetScore: 56000, moves: 33, lockedGoal: 16, lockedLayout: [[1,1],[1,6],[2,2],[2,5],[3,3],[3,4],[4,3],[4,4],[5,2],[5,5],[6,1],[6,6],[2,3],[2,4],[5,3],[5,4]] },

      // MUNDO 4: VOLCÁN DE OBSIDIANA (31 - 40) - Obstáculo: Piezas Transformantes
      { id: 31, world: 4, name: 'Fisura de Magma', targetScore: 60000, moves: 28, shifterGoal: 4, shifterLayout: [[3,2],[3,5],[4,2],[4,5]] },
      { id: 32, world: 4, name: 'Roca Ígnea', targetScore: 64000, moves: 26, shifterGoal: 0, shifterLayout: [] },
      { id: 33, world: 4, name: 'Geiser de Rubí', targetScore: 68000, moves: 29, shifterGoal: 6, shifterLayout: [[2,2],[2,5],[3,3],[4,4],[5,2],[5,5]] },
      { id: 34, world: 4, name: 'Flujo Piroclástico', targetScore: 72500, moves: 27, shifterGoal: 0, shifterLayout: [] },
      { id: 35, world: 4, name: 'Caldera Resonante', targetScore: 77000, moves: 30, shifterGoal: 8, shifterLayout: [[1,3],[1,4],[3,1],[3,6],[4,1],[4,6],[6,3],[6,4]] },
      { id: 36, world: 4, name: 'Bravura de Fuego', targetScore: 82000, moves: 28, shifterGoal: 0, shifterLayout: [] },
      { id: 37, world: 4, name: 'Garganta del Volcán', targetScore: 87000, moves: 31, shifterGoal: 10, shifterLayout: [[2,3],[2,4],[3,2],[3,5],[4,2],[4,5],[5,3],[5,4],[1,1],[6,6]] },
      { id: 38, world: 4, name: 'Corona de Lava', targetScore: 92500, moves: 28, shifterGoal: 0, shifterLayout: [] },
      { id: 39, world: 4, name: 'Corazón de Obsidiana', targetScore: 98000, moves: 32, shifterGoal: 12, shifterLayout: [[1,2],[1,5],[2,1],[2,6],[5,1],[5,6],[6,2],[6,5],[3,3],[3,4],[4,3],[4,4]] },
      { id: 40, world: 4, name: 'Ascensión del Fénix', targetScore: 105000, moves: 35, shifterGoal: 16, shifterLayout: [[1,1],[1,6],[2,2],[2,5],[3,3],[3,4],[4,3],[4,4],[5,2],[5,5],[6,1],[6,6],[2,3],[2,4],[5,3],[5,4]] }
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
          grid[r][c] = { type: 0, special: CONFIG.SPECIALS.NONE, obstacle: CONFIG.OBSTACLES.NONE };
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

    findMatches(grid) {
      const rows = grid.length;
      const cols = grid[0].length;
      const matches = [];

      // Horizontales
      for (let r = 0; r < rows; r++) {
        let matchLength = 1;
        for (let c = 0; c < cols; c++) {
          const current = grid[r][c];
          const next = (c + 1 < cols) ? grid[r][c + 1] : null;

          if (next && current.type !== 0 && current.obstacle !== CONFIG.OBSTACLES.LOCKED && current.type === next.type && next.obstacle !== CONFIG.OBSTACLES.LOCKED) {
            matchLength++;
          } else {
            if (matchLength >= 3 && current.type !== 0 && current.obstacle !== CONFIG.OBSTACLES.LOCKED) {
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

      // Verticales
      for (let c = 0; c < cols; c++) {
        let matchLength = 1;
        for (let r = 0; r < rows; r++) {
          const current = grid[r][c];
          const next = (r + 1 < rows) ? grid[r + 1][c] : null;

          if (next && current.type !== 0 && current.obstacle !== CONFIG.OBSTACLES.LOCKED && current.type === next.type && next.obstacle !== CONFIG.OBSTACLES.LOCKED) {
            matchLength++;
          } else {
            if (matchLength >= 3 && current.type !== 0 && current.obstacle !== CONFIG.OBSTACLES.LOCKED) {
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

    isValidSwap(grid, r1, c1, r2, c2) {
      const rows = grid.length;
      const cols = grid[0].length;
      const dist = Math.abs(r1 - r2) + Math.abs(c1 - c2);
      if (dist !== 1) return false;

      const g1 = grid[r1][c1];
      const g2 = grid[r2][c2];
      if (g1.type === 0 || g2.type === 0) return false;

      // Cadenas o piezas bloqueadas no se pueden mover
      if (g1.obstacle === CONFIG.OBSTACLES.CHAINS || g2.obstacle === CONFIG.OBSTACLES.CHAINS) return false;
      if (g1.obstacle === CONFIG.OBSTACLES.LOCKED || g2.obstacle === CONFIG.OBSTACLES.LOCKED) return false;

      // Dos especiales combinándose siempre son válidos
      if (g1.special !== CONFIG.SPECIALS.NONE && g2.special !== CONFIG.SPECIALS.NONE) {
        return true;
      }

      // Prisma de color con cualquier gema es válido
      if (g1.special === CONFIG.SPECIALS.COLOR_BOMB || g2.special === CONFIG.SPECIALS.COLOR_BOMB) {
        return true;
      }

      // Simular intercambio
      const temp = grid[r1][c1];
      grid[r1][c1] = grid[r2][c2];
      grid[r2][c2] = temp;

      const matches = this.findMatches(grid);

      // Revertir
      grid[r2][c2] = grid[r1][c1];
      grid[r1][c1] = temp;

      return matches.length > 0;
    },

    findAnyValidMove(grid) {
      const rows = grid.length;
      const cols = grid[0].length;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (c + 1 < cols && this.isValidSwap(grid, r, c, r, c + 1)) {
            return { r1: r, c1: c, r2: r, c2: c + 1 };
          }
          if (r + 1 < rows && this.isValidSwap(grid, r, c, r + 1, c)) {
            return { r1: r, c1: c, r2: r + 1, c2: c };
          }
        }
      }

      return null;
    },

    generateBoard(cols = CONFIG.COLS, rows = CONFIG.ROWS, numTypes = CONFIG.NUM_GEM_TYPES) {
      let grid = this.createEmptyGrid(cols, rows);

      while (true) {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const forbidden = new Set();
            if (c >= 2 && grid[r][c - 1].type === grid[r][c - 2].type) {
              forbidden.add(grid[r][c - 1].type);
            }
            if (r >= 2 && grid[r - 1][c].type === grid[r - 2][c].type) {
              forbidden.add(grid[r - 1][c].type);
            }

            const allowed = [];
            for (let t = 1; t <= numTypes; t++) {
              if (!forbidden.has(t)) allowed.push(t);
            }

            const chosen = allowed[Math.floor(Math.random() * allowed.length)];
            grid[r][c] = { type: chosen, special: CONFIG.SPECIALS.NONE, obstacle: CONFIG.OBSTACLES.NONE };
          }
        }

        if (this.findMatches(grid).length === 0 && this.findAnyValidMove(grid) !== null) {
          return grid;
        }
      }
    },

    shuffleUntilValid(grid, numTypes = CONFIG.NUM_GEM_TYPES) {
      const rows = grid.length;
      const cols = grid[0].length;
      const gemPool = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c].obstacle !== CONFIG.OBSTACLES.LOCKED) {
            gemPool.push({ ...grid[r][c] });
          }
        }
      }

      for (let attempt = 0; attempt < 500; attempt++) {
        for (let i = gemPool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const t = gemPool[i];
          gemPool[i] = gemPool[j];
          gemPool[j] = t;
        }

        let idx = 0;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (grid[r][c].obstacle !== CONFIG.OBSTACLES.LOCKED) {
              grid[r][c] = { ...gemPool[idx++] };
            }
          }
        }

        if (this.findMatches(grid).length === 0 && this.findAnyValidMove(grid) !== null) {
          return true;
        }
      }

      const fresh = this.generateBoard(cols, rows, numTypes);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c].obstacle !== CONFIG.OBSTACLES.LOCKED) {
            grid[r][c] = fresh[r][c];
          }
        }
      }
      return true;
    },

    applyGravity(grid) {
      const rows = grid.length;
      const cols = grid[0].length;
      let totalFallen = 0;

      for (let c = 0; c < cols; c++) {
        let writeRow = rows - 1;
        for (let r = rows - 1; r >= 0; r--) {
          if (grid[r][c].obstacle === CONFIG.OBSTACLES.LOCKED) {
            writeRow = r - 1;
            continue;
          }
          if (grid[r][c].type !== 0) {
            if (writeRow !== r) {
              grid[writeRow][c] = grid[r][c];
              grid[r][c] = { type: 0, special: CONFIG.SPECIALS.NONE, obstacle: CONFIG.OBSTACLES.NONE };
              totalFallen++;
            }
            writeRow--;
          }
        }
      }

      return totalFallen;
    },

    simulateCascades(grid, numTypes = CONFIG.NUM_GEM_TYPES, maxIterations = 60) {
      const rows = grid.length;
      const cols = grid[0].length;
      let iterations = 0;

      while (iterations < maxIterations) {
        iterations++;
        this.applyGravity(grid);

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (grid[r][c].type === 0 && grid[r][c].obstacle !== CONFIG.OBSTACLES.LOCKED) {
              grid[r][c] = {
                type: Math.floor(Math.random() * numTypes) + 1,
                special: CONFIG.SPECIALS.NONE,
                obstacle: CONFIG.OBSTACLES.NONE
              };
            }
          }
        }

        const matches = this.findMatches(grid);
        if (matches.length === 0) {
          return { terminated: true, cycles: iterations };
        }

        for (const m of matches) {
          for (const cell of m.cells) {
            grid[cell.r][cell.c] = { type: 0, special: CONFIG.SPECIALS.NONE, obstacle: CONFIG.OBSTACLES.NONE };
          }
        }
      }

      return { terminated: false, cycles: iterations };
    },

    /**
     * Valida si un nivel es matemáticamente resoluble verificando su ratio de movimientos/objetivo
     */
    isLevelSolvable(level) {
      if (!level || !level.moves || level.moves <= 0) return false;
      // Con piezas especiales (Láser, Bomba, Prisma) y cascadas con multiplicador,
      // un jugador genera con solvencia hasta 3500 puntos promedio por movimiento.
      const maxPossibleScore = level.moves * 3500;
      if (level.targetScore > maxPossibleScore) return false;

      // Obstáculos alcanzables dentro de los movimientos
      if (level.iceGoal && level.iceGoal > level.moves * 2.5) return false;
      if (level.chainsGoal && level.chainsGoal > level.moves * 2) return false;
      if (level.lockedGoal && level.lockedGoal > level.moves * 1.8) return false;
      if (level.shifterGoal && level.shifterGoal > level.moves * 2) return false;

      return true;
    }
  };

  // Exportar para pruebas Node
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, CristalesLogic };
    return;
  }

  // ==========================================
  // ESTADO DEL JUEGO Y PERSISTENCIA
  // ==========================================
  const State = {
    grid: CristalesLogic.createEmptyGrid(),
    iceGrid: new Array(8).fill(0).map(() => new Uint8Array(8)),
    selectedCell: null,
    isSwapping: false,
    isCascading: false,
    comboCount: 1,

    // Nivel y Modo
    currentLevelIdx: 0,
    isEndlessMode: false,
    movesRemaining: 25,
    score: 0,
    levelTargetScore: 1000,
    currentObstacleGoal: 0,
    currentObstacleCleared: 0,
    endlessTimeRemaining: 60,

    // Potenciador activo en mano (HAMMER, SWAP, SHUFFLE)
    activePowerupTool: null,

    // Pista
    hintCellA: null,
    hintCellB: null,
    hintTimer: 0,

    // Animaciones y Partículas
    particles: [],
    lightSweeps: [],
    cameraZoom: 1.0,

    // Fondo ambiental
    bgParticles: [],

    // Sistema de Vidas y Persistencia
    saveData: {
      starsPerLevel: {},
      unlockedLevels: 1,
      endlessBest: 0,
      lives: 5,
      lastLifeTimestamp: Date.now(),
      lastDailyTimestamp: 0,
      powerups: {
        hammer: 3,
        shuffle: 2,
        swap: 2
      }
    }
  };

  // Pre-generar partículas de fondo
  for (let i = 0; i < 30; i++) {
    State.bgParticles.push({
      x: Math.random() * CONFIG.VIRTUAL_W,
      y: Math.random() * CONFIG.VIRTUAL_H,
      vy: (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 20,
      r: 1.5 + Math.random() * 3,
      alpha: 0.2 + Math.random() * 0.4
    });
  }

  // ==========================================
  // REFERENCIAS DOM
  // ==========================================
  const dom = {
    canvas: document.getElementById('game-canvas'),
    ctx: null,
    scoreVal: document.getElementById('score-val'),
    objectiveLabel: document.getElementById('objective-label'),
    objectiveVal: document.getElementById('objective-val'),
    goalText: document.getElementById('goal-text'),
    comboPill: document.getElementById('combo-pill'),
    comboMultiplier: document.getElementById('combo-multiplier'),
    btnHint: document.getElementById('btn-hint'),
    btnBack: document.getElementById('btn-back'),
    btnSoundToggle: document.getElementById('btn-sound-toggle'),
    iconSoundOn: document.getElementById('icon-sound-on'),
    iconSoundOff: document.getElementById('icon-sound-off'),
    btnPauseHeader: document.getElementById('btn-pause-header'),
    btnAchievementsHeader: document.getElementById('btn-achievements-header'),
    btnOptionsHeader: document.getElementById('btn-options-header'),

    // Vidas
    livesCount: document.getElementById('lives-count'),
    livesTimer: document.getElementById('lives-timer'),

    // Potenciadores
    btnPowerupHammer: document.getElementById('btn-powerup-hammer'),
    btnPowerupShuffle: document.getElementById('btn-powerup-shuffle'),
    btnPowerupSwap: document.getElementById('btn-powerup-swap'),
    countHammer: document.getElementById('count-hammer'),
    countShuffle: document.getElementById('count-shuffle'),
    countSwap: document.getElementById('count-swap'),

    // Modales
    startCard: document.getElementById('start-card'),
    levelsGrid: document.getElementById('levels-grid'),
    worldBanner: document.getElementById('world-banner'),
    worldBadge: document.getElementById('world-badge'),
    worldDesc: document.getElementById('world-desc'),
    btnOpenDaily: document.getElementById('btn-open-daily'),
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
    starsRow: document.getElementById('stars-row'),
    btnNextLevel: document.getElementById('btn-next-level'),
    btnRetryLevel: document.getElementById('btn-retry-level'),
    btnExitToLevels: document.getElementById('btn-exit-to-levels'),

    modalDaily: document.getElementById('modal-daily'),
    btnClaimDaily: document.getElementById('btn-claim-daily'),

    modalNoLives: document.getElementById('modal-no-lives'),
    noLivesTimer: document.getElementById('no-lives-timer'),
    btnCloseNoLives: document.getElementById('btn-close-no-lives'),

    modalAchievements: document.getElementById('modal-achievements'),
    achList: document.getElementById('ach-list'),
    btnCloseAch: document.getElementById('btn-close-ach'),

    modalOptions: document.getElementById('modal-options'),
    optSfx: document.getElementById('opt-sfx'),
    optBgm: document.getElementById('opt-bgm'),
    optVibration: document.getElementById('opt-vibration'),
    optContrast: document.getElementById('opt-contrast'),
    btnCloseOptions: document.getElementById('btn-close-options')
  };

  dom.ctx = dom.canvas.getContext('2d');

  // ==========================================
  // PERSISTENCIA Y SISTEMA DE VIDAS
  // ==========================================
  function loadGameData() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEY_PREFIX);
      if (raw) {
        State.saveData = Object.assign(State.saveData, JSON.parse(raw));
      }
    } catch (_) {}

    updateLivesSystem();
    updatePowerupCounts();
  }

  function saveGameData() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY_PREFIX, JSON.stringify(State.saveData));
    } catch (_) {}
  }

  function updateLivesSystem() {
    const now = Date.now();
    const LIFE_INTERVAL = 20 * 60 * 1000; // 20 minutos por vida

    if (State.saveData.lives < 5) {
      const elapsed = now - State.saveData.lastLifeTimestamp;
      const livesGained = Math.floor(elapsed / LIFE_INTERVAL);
      if (livesGained > 0) {
        State.saveData.lives = Math.min(5, State.saveData.lives + livesGained);
        State.saveData.lastLifeTimestamp = now - (elapsed % LIFE_INTERVAL);
        saveGameData();
      }
    } else {
      State.saveData.lastLifeTimestamp = now;
    }

    dom.livesCount.textContent = State.saveData.lives;

    if (State.saveData.lives < 5) {
      const remainingMs = LIFE_INTERVAL - (now - State.saveData.lastLifeTimestamp);
      const mins = Math.floor(remainingMs / 60000);
      const secs = Math.floor((remainingMs % 60000) / 1000);
      const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      dom.livesTimer.textContent = timeStr;
      dom.livesTimer.classList.remove('hidden');
      dom.noLivesTimer.textContent = timeStr;
    } else {
      dom.livesTimer.classList.add('hidden');
    }
  }

  function updatePowerupCounts() {
    dom.countHammer.textContent = State.saveData.powerups.hammer;
    dom.countShuffle.textContent = State.saveData.powerups.shuffle;
    dom.countSwap.textContent = State.saveData.powerups.swap;
  }

  // ==========================================
  // AUDIO SINTETIZADO Y BGM
  // ==========================================
  let bgmInterval = null;
  let bgmStep = 0;
  const crystalChimes = [523.25, 659.25, 783.99, 1046.50, 880.00, 659.25];

  function startBGM() {
    if (bgmInterval || !window.ArcadeJuice?.getOption('bgm', true)) return;
    scheduleNextChime();
  }

  function stopBGM() {
    if (bgmInterval) {
      clearTimeout(bgmInterval);
      bgmInterval = null;
    }
  }

  function scheduleNextChime() {
    if (dom.overlayPause && !dom.overlayPause.classList.contains('hidden')) return;
    const freq = crystalChimes[bgmStep % crystalChimes.length];
    bgmStep++;
    if (window.ArcadeAudio) {
      window.ArcadeAudio.playTone(freq, 'sine', 0.12, 0.03);
    }
    bgmInterval = setTimeout(scheduleNextChime, 450);
  }

  function playAudio(type) {
    if (!window.ArcadeAudio || !window.ArcadeJuice?.getOption('sfx', true)) return;
    switch (type) {
      case 'select':
        window.ArcadeAudio.playTone(880, 'sine', 0.04, 0.1);
        break;
      case 'swap':
        window.ArcadeAudio.playTone(550, 'triangle', 0.06, 0.12);
        break;
      case 'match':
        window.ArcadeAudio.playTone(660, 'sine', 0.08, 0.15);
        break;
      case 'cascade':
        [587, 740, 880, 1174].forEach((f, i) => {
          setTimeout(() => window.ArcadeAudio?.playTone(f, 'sine', 0.1, 0.15), i * 65);
        });
        break;
      case 'special_laser':
        window.ArcadeAudio.playTone(1200, 'sawtooth', 0.18, 0.2);
        break;
      case 'special_bomb':
        window.ArcadeAudio.playExplosion ? window.ArcadeAudio.playExplosion() : window.ArcadeAudio.playTone(100, 'sawtooth', 0.25, 0.2);
        break;
      case 'special_prism':
        [440, 554, 659, 880, 1108].forEach((f, i) => {
          setTimeout(() => window.ArcadeAudio?.playTone(f, 'triangle', 0.1, 0.18), i * 50);
        });
        break;
      case 'powerup':
        window.ArcadeAudio.playTone(987, 'square', 0.1, 0.2);
        break;
    }
  }

  // ==========================================
  // AJUSTE DE CANVAS
  // ==========================================
  function handleResize() {
    const parent = dom.canvas.parentElement;
    if (!parent) return;

    const fit = window.ArcadeCanvas.fit(
      dom.canvas,
      parent,
      CONFIG.VIRTUAL_W,
      CONFIG.VIRTUAL_H,
      4
    );

    State.scale = fit.width / CONFIG.VIRTUAL_W;
  }

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', () => setTimeout(handleResize, 100));

  // ==========================================
  // INICIO DE NIVEL Y CONFIGURACIÓN
  // ==========================================
  function startLevel(lvlIndex) {
    if (State.saveData.lives <= 0 && !State.isEndlessMode) {
      dom.modalNoLives.classList.remove('hidden');
      return;
    }

    State.currentLevelIdx = lvlIndex;
    State.isEndlessMode = false;
    const lvl = CONFIG.LEVELS[lvlIndex];

    State.score = 0;
    State.movesRemaining = lvl.moves;
    State.levelTargetScore = lvl.targetScore;
    State.comboCount = 1;
    State.selectedCell = null;
    State.activePowerupTool = null;
    State.hintTimer = 0;

    // Inicializar rejilla de hielo
    for (let r = 0; r < 8; r++) State.iceGrid[r].fill(0);
    if (lvl.iceLayout && lvl.iceLayout.length > 0) {
      for (const [r, c] of lvl.iceLayout) {
        State.iceGrid[r][c] = 1;
      }
    }

    // Generar tablero
    State.grid = CristalesLogic.generateBoard(CONFIG.COLS, CONFIG.ROWS, CONFIG.NUM_GEM_TYPES);

    // Aplicar obstáculos de nivel
    if (lvl.chainLayout) {
      for (const [r, c] of lvl.chainLayout) {
        if (State.grid[r][c]) State.grid[r][c].obstacle = CONFIG.OBSTACLES.CHAINS;
      }
    }
    if (lvl.lockedLayout) {
      for (const [r, c] of lvl.lockedLayout) {
        if (State.grid[r][c]) State.grid[r][c].obstacle = CONFIG.OBSTACLES.LOCKED;
      }
    }
    if (lvl.shifterLayout) {
      for (const [r, c] of lvl.shifterLayout) {
        if (State.grid[r][c]) State.grid[r][c].obstacle = CONFIG.OBSTACLES.SHIFTER;
      }
    }

    // Actualizar objetivos en HUD
    dom.goalText.textContent = `Meta: ${lvl.targetScore.toLocaleString()} pts`;
    dom.objectiveLabel.textContent = 'MOVIMIENTOS';
    dom.objectiveVal.textContent = State.movesRemaining;
    dom.scoreVal.textContent = '0';

    dom.startCard.classList.add('hidden');
    dom.overlayPause.classList.add('hidden');
    dom.overlayResult.classList.add('hidden');

    startBGM();
    window.ArcadeJuice?.trackPlay('cristales', 0);
  }

  function startEndless() {
    State.isEndlessMode = true;
    State.score = 0;
    State.endlessTimeRemaining = 60;
    State.comboCount = 1;
    State.selectedCell = null;
    State.activePowerupTool = null;

    for (let r = 0; r < 8; r++) State.iceGrid[r].fill(0);
    State.grid = CristalesLogic.generateBoard(CONFIG.COLS, CONFIG.ROWS, CONFIG.NUM_GEM_TYPES);

    dom.goalText.textContent = 'Modo Infinito';
    dom.objectiveLabel.textContent = 'CRONÓMETRO';
    dom.objectiveVal.textContent = `${State.endlessTimeRemaining}s`;
    dom.scoreVal.textContent = '0';

    dom.startCard.classList.add('hidden');
    dom.overlayPause.classList.add('hidden');
    dom.overlayResult.classList.add('hidden');

    startBGM();
  }

  // ==========================================
  // MANIPULACIÓN Y INTERCAMBIO DE GEMAS
  // ==========================================
  function onCellClicked(r, c) {
    if (State.isSwapping || State.isCascading) return;
    window.ArcadeAudio?.initCtx();

    // Si hay un potenciador activo (Martillo)
    if (State.activePowerupTool === 'hammer') {
      applyHammer(r, c);
      return;
    }

    if (!State.selectedCell) {
      State.selectedCell = { r, c };
      playAudio('select');
      window.ArcadeJuice?.vibrate(8);
      return;
    }

    // Segunda celda seleccionada
    const r1 = State.selectedCell.r;
    const c1 = State.selectedCell.c;
    const r2 = r;
    const c2 = c;

    if (r1 === r2 && c1 === c2) {
      State.selectedCell = null;
      return;
    }

    // Si hay Swap Libre activo
    if (State.activePowerupTool === 'swap') {
      applyFreeSwap(r1, c1, r2, c2);
      return;
    }

    // Intercambio regular
    if (CristalesLogic.isValidSwap(State.grid, r1, c1, r2, c2)) {
      executeSwap(r1, c1, r2, c2);
    } else {
      // Intercambio inválido: sacudir sutilmente y deseleccionar
      playAudio('select');
      window.ArcadeJuice?.shake(2, 0.1);
      State.selectedCell = null;
    }
  }

  function executeSwap(r1, c1, r2, c2) {
    State.isSwapping = true;
    State.selectedCell = null;
    playAudio('swap');
    window.ArcadeJuice?.vibrate(12);

    const g1 = State.grid[r1][c1];
    const g2 = State.grid[r2][c2];

    // Verificar si es combinación especial de dos gemas especiales
    if (g1.special !== CONFIG.SPECIALS.NONE && g2.special !== CONFIG.SPECIALS.NONE) {
      executeDoubleSpecial(r1, c1, r2, c2);
      return;
    }

    // Verificar si una es Prisma de color
    if (g1.special === CONFIG.SPECIALS.COLOR_BOMB || g2.special === CONFIG.SPECIALS.COLOR_BOMB) {
      const prismCell = g1.special === CONFIG.SPECIALS.COLOR_BOMB ? { r: r1, c: c1 } : { r: r2, c: c2 };
      const otherCell = g1.special === CONFIG.SPECIALS.COLOR_BOMB ? { r: r2, c: c2 } : { r: r1, c: c1 };
      executeColorPrism(prismCell.r, prismCell.c, State.grid[otherCell.r][otherCell.c].type);
      return;
    }

    // Intercambio estándar
    const temp = State.grid[r1][c1];
    State.grid[r1][c1] = State.grid[r2][c2];
    State.grid[r2][c2] = temp;

    if (!State.isEndlessMode) {
      State.movesRemaining--;
      dom.objectiveVal.textContent = State.movesRemaining;
    }

    // Disparar cascada
    resolveMatches();
  }

  function executeDoubleSpecial(r1, c1, r2, c2) {
    const s1 = State.grid[r1][c1].special;
    const s2 = State.grid[r2][c2].special;
    State.grid[r1][c1] = { type: 0, special: CONFIG.SPECIALS.NONE, obstacle: CONFIG.OBSTACLES.NONE };
    State.grid[r2][c2] = { type: 0, special: CONFIG.SPECIALS.NONE, obstacle: CONFIG.OBSTACLES.NONE };

    playAudio('special_laser');
    window.ArcadeJuice?.shake(10, 0.35);
    window.ArcadeJuice?.hitstop(50);
    window.ArcadeJuice?.spawnFloat('¡FUSIÓN ESPECIAL!', CONFIG.VIRTUAL_W / 2, 240, '#00d2ff', 15);

    // Doble Rayo: Cruz total
    if ((s1 === CONFIG.SPECIALS.LINE_H || s1 === CONFIG.SPECIALS.LINE_V) &&
        (s2 === CONFIG.SPECIALS.LINE_H || s2 === CONFIG.SPECIALS.LINE_V)) {
      clearRow(r2);
      clearCol(c2);
    }
    // Rayo + Bomba: Triple Cruz
    else if ((s1 === CONFIG.SPECIALS.BOMB || s2 === CONFIG.SPECIALS.BOMB) &&
             (s1 === CONFIG.SPECIALS.LINE_H || s1 === CONFIG.SPECIALS.LINE_V || s2 === CONFIG.SPECIALS.LINE_H || s2 === CONFIG.SPECIALS.LINE_V)) {
      for (let dr = -1; dr <= 1; dr++) if (r2 + dr >= 0 && r2 + dr < 8) clearRow(r2 + dr);
      for (let dc = -1; dc <= 1; dc++) if (c2 + dc >= 0 && c2 + dc < 8) clearCol(c2 + dc);
    }
    // Bomba + Bomba: Mega 5x5
    else if (s1 === CONFIG.SPECIALS.BOMB && s2 === CONFIG.SPECIALS.BOMB) {
      detonateArea(r2, c2, 2);
    }
    // Prisma + Cualquier Especial: Dispersión total
    else {
      clearAllOfType(State.grid[r1][c1].type || 1);
    }

    setTimeout(resolveMatches, 300);
  }

  function executeColorPrism(pr, pc, targetColor) {
    State.grid[pr][pc] = { type: 0, special: CONFIG.SPECIALS.NONE, obstacle: CONFIG.OBSTACLES.NONE };
    playAudio('special_prism');
    window.ArcadeJuice?.shake(8, 0.3);
    window.ArcadeJuice?.spawnFloat('¡PRISMA TOTAL!', CONFIG.VIRTUAL_W / 2, 240, '#ffd700', 14);

    clearAllOfType(targetColor);
    setTimeout(resolveMatches, 300);
  }

  function clearRow(r) {
    for (let c = 0; c < 8; c++) {
      State.grid[r][c] = { type: 0, special: CONFIG.SPECIALS.NONE, obstacle: CONFIG.OBSTACLES.NONE };
      State.iceGrid[r][c] = 0;
      spawnGlow(c, r, '#00d2ff');
    }
  }

  function clearCol(c) {
    for (let r = 0; r < 8; r++) {
      State.grid[r][c] = { type: 0, special: CONFIG.SPECIALS.NONE, obstacle: CONFIG.OBSTACLES.NONE };
      State.iceGrid[r][c] = 0;
      spawnGlow(c, r, '#00d2ff');
    }
  }

  function detonateArea(cr, cc, rad = 1) {
    for (let r = cr - rad; r <= cr + rad; r++) {
      for (let c = cc - rad; c <= cc + rad; c++) {
        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
          State.grid[r][c] = { type: 0, special: CONFIG.SPECIALS.NONE, obstacle: CONFIG.OBSTACLES.NONE };
          State.iceGrid[r][c] = 0;
          spawnGlow(c, r, '#ff8800');
        }
      }
    }
  }

  function clearAllOfType(colorType) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (State.grid[r][c].type === colorType) {
          State.grid[r][c] = { type: 0, special: CONFIG.SPECIALS.NONE, obstacle: CONFIG.OBSTACLES.NONE };
          State.iceGrid[r][c] = 0;
          spawnGlow(c, r, '#ffcc00');
        }
      }
    }
  }

  function resolveMatches() {
    State.isCascading = true;
    const matches = CristalesLogic.findMatches(State.grid);

    if (matches.length === 0) {
      State.isSwapping = false;
      State.isCascading = false;
      State.comboCount = 1;
      dom.comboPill.classList.add('hidden');

      // Transformar piezas Shifters
      transformShifters();

      // Verificar condición de victoria o derrota
      checkLevelState();
      return;
    }

    // Hay matches: procesar
    let matchedGemsCount = 0;
    for (const m of matches) {
      const len = m.cells.length;
      let specialToCreate = CONFIG.SPECIALS.NONE;
      if (len === 4) {
        specialToCreate = m.orientation === 'H' ? CONFIG.SPECIALS.LINE_H : CONFIG.SPECIALS.LINE_V;
      } else if (len >= 5) {
        specialToCreate = CONFIG.SPECIALS.COLOR_BOMB;
      }

      for (let i = 0; i < len; i++) {
        const cell = m.cells[i];
        matchedGemsCount++;

        // Quitar hielo
        State.iceGrid[cell.r][cell.c] = 0;

        if (i === 0 && specialToCreate !== CONFIG.SPECIALS.NONE) {
          State.grid[cell.r][cell.c] = { type: m.type, special: specialToCreate, obstacle: CONFIG.OBSTACLES.NONE };
        } else {
          State.grid[cell.r][cell.c] = { type: 0, special: CONFIG.SPECIALS.NONE, obstacle: CONFIG.OBSTACLES.NONE };
        }

        spawnGlow(cell.c, cell.r, CONFIG.GEMS[m.type - 1]?.base || '#fff');
      }
    }

    // Puntuación
    const earned = matchedGemsCount * 50 * State.comboCount;
    State.score += earned;
    dom.scoreVal.textContent = State.score.toLocaleString();

    if (State.comboCount > 1) {
      dom.comboPill.classList.remove('hidden');
      dom.comboMultiplier.textContent = State.comboCount;
      window.ArcadeJuice?.spawnFloat(`COMBO x${State.comboCount}! +${earned}`, CONFIG.VIRTUAL_W / 2, 220, '#ffcc00', 13);
      playAudio('cascade');
    } else {
      playAudio('match');
    }

    State.comboCount++;
    window.ArcadeJuice?.vibrate(10);

    // Aplicar gravedad y rellenar
    setTimeout(() => {
      CristalesLogic.applyGravity(State.grid);
      // Rellenar vacíos
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (State.grid[r][c].type === 0 && State.grid[r][c].obstacle !== CONFIG.OBSTACLES.LOCKED) {
            State.grid[r][c] = {
              type: Math.floor(Math.random() * CONFIG.NUM_GEM_TYPES) + 1,
              special: CONFIG.SPECIALS.NONE,
              obstacle: CONFIG.OBSTACLES.NONE
            };
          }
        }
      }
      setTimeout(resolveMatches, 220);
    }, 180);
  }

  function transformShifters() {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (State.grid[r][c].obstacle === CONFIG.OBSTACLES.SHIFTER) {
          State.grid[r][c].type = (State.grid[r][c].type % CONFIG.NUM_GEM_TYPES) + 1;
          spawnGlow(c, r, '#ffffff');
        }
      }
    }
  }

  function checkLevelState() {
    if (State.isEndlessMode) return;

    const lvl = CONFIG.LEVELS[State.currentLevelIdx];
    const reachedScore = State.score >= lvl.targetScore;

    // Verificar si queda hielo
    let iceRemaining = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (State.iceGrid[r][c] > 0) iceRemaining++;
      }
    }

    if (reachedScore && iceRemaining === 0) {
      // Victoria
      triggerLevelVictory();
    } else if (State.movesRemaining <= 0) {
      // Derrota
      triggerLevelDefeat();
    }
  }

  function triggerLevelVictory() {
    stopBGM();
    window.ArcadeJuice?.unlockAchievement('cristales', 'ach_first_level', 'Primer Prisma', 'Supera tu primer nivel en Cristales');

    // Calcular estrellas (1 a 3)
    let stars = 1;
    const lvl = CONFIG.LEVELS[State.currentLevelIdx];
    if (State.score >= lvl.targetScore * 1.5) stars = 3;
    else if (State.score >= lvl.targetScore * 1.2) stars = 2;

    State.saveData.starsPerLevel[State.currentLevelIdx] = Math.max(State.saveData.starsPerLevel[State.currentLevelIdx] || 0, stars);
    State.saveData.unlockedLevels = Math.max(State.saveData.unlockedLevels, State.currentLevelIdx + 2);

    // Otorgar potenciador por superar mundo (cada 10 niveles)
    if ((State.currentLevelIdx + 1) % 10 === 0) {
      State.saveData.powerups.hammer += 1;
      State.saveData.powerups.shuffle += 1;
      State.saveData.powerups.swap += 1;
      window.ArcadeJuice?.unlockAchievement('cristales', 'ach_world_clear', 'Maestro del Mundo', 'Completa los 10 niveles de un mundo');
    }

    saveGameData();

    dom.resultIcon.textContent = '🌟';
    dom.resultTitle.textContent = '¡NIVEL SUPERADO!';
    dom.resultSubtitle.textContent = `¡Objetivo completado con éxito!`;
    dom.resultScoreVal.textContent = State.score.toLocaleString();
    dom.resultBestVal.textContent = lvl.targetScore.toLocaleString();

    dom.starsRow.innerHTML = `
      <span class="star-slot ${stars >= 1 ? 'filled' : 'empty'}">★</span>
      <span class="star-slot ${stars >= 2 ? 'filled' : 'empty'}">★</span>
      <span class="star-slot ${stars >= 3 ? 'filled' : 'empty'}">★</span>
    `;

    dom.overlayResult.classList.remove('hidden');
  }

  function triggerLevelDefeat() {
    stopBGM();
    State.saveData.lives = Math.max(0, State.saveData.lives - 1);
    State.saveData.lastLifeTimestamp = Date.now();
    saveGameData();
    updateLivesSystem();

    dom.resultIcon.textContent = '💔';
    dom.resultTitle.textContent = '¡FIN DE MOVIMIENTOS!';
    dom.resultSubtitle.textContent = 'No pudiste alcanzar el objetivo a tiempo.';
    dom.resultScoreVal.textContent = State.score.toLocaleString();
    dom.resultBestVal.textContent = CONFIG.LEVELS[State.currentLevelIdx].targetScore.toLocaleString();
    dom.starsRow.innerHTML = '';

    dom.overlayResult.classList.remove('hidden');
  }

  // ==========================================
  // POTENCIADORES
  // ==========================================
  function applyHammer(r, c) {
    if (State.saveData.powerups.hammer <= 0) return;
    State.saveData.powerups.hammer--;
    updatePowerupCounts();
    saveGameData();

    State.activePowerupTool = null;
    dom.btnPowerupHammer.classList.remove('active');

    // Romper gema o casilla
    State.grid[r][c] = { type: 0, special: CONFIG.SPECIALS.NONE, obstacle: CONFIG.OBSTACLES.NONE };
    State.iceGrid[r][c] = 0;
    playAudio('special_bomb');
    window.ArcadeJuice?.shake(6, 0.2);
    window.ArcadeJuice?.spawnFloat('¡MARTILLO!', CONFIG.VIRTUAL_W / 2, 200, '#00d2ff', 13);
    spawnGlow(c, r, '#ffffff');

    resolveMatches();
  }

  function applyFreeSwap(r1, c1, r2, c2) {
    if (State.saveData.powerups.swap <= 0) return;
    State.saveData.powerups.swap--;
    updatePowerupCounts();
    saveGameData();

    State.activePowerupTool = null;
    dom.btnPowerupSwap.classList.remove('active');
    State.selectedCell = null;

    const temp = State.grid[r1][c1];
    State.grid[r1][c1] = State.grid[r2][c2];
    State.grid[r2][c2] = temp;

    playAudio('swap');
    window.ArcadeJuice?.vibrate(14);
    window.ArcadeJuice?.spawnFloat('¡INTERCAMBIO LIBRE!', CONFIG.VIRTUAL_W / 2, 200, '#ffbb00', 13);

    resolveMatches();
  }

  function applyShufflePowerup() {
    if (State.saveData.powerups.shuffle <= 0) return;
    State.saveData.powerups.shuffle--;
    updatePowerupCounts();
    saveGameData();

    CristalesLogic.shuffleUntilValid(State.grid, CONFIG.NUM_GEM_TYPES);
    playAudio('special_prism');
    window.ArcadeJuice?.shake(5, 0.2);
    window.ArcadeJuice?.spawnFloat('¡MEZCLA CÓSMICA!', CONFIG.VIRTUAL_W / 2, 200, '#00e5ff', 13);
  }

  function spawnGlow(c, r, color) {
    const cs = CONFIG.VIRTUAL_W / 8;
    const x = c * cs + cs / 2;
    const y = r * cs + cs / 2;
    for (let i = 0; i < 8; i++) {
      State.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 80,
        vy: (Math.random() - 0.5) * 80,
        color,
        life: 0.35,
        maxLife: 0.35,
        size: 3 + Math.random() * 3
      });
    }
  }

  // ==========================================
  // RENDERIZADO VECTORIAL DE CRISTALES Y MUNDOS
  // ==========================================
  function render() {
    const ctx = dom.ctx;
    const W = CONFIG.VIRTUAL_W;
    const H = CONFIG.VIRTUAL_H;
    const currentWorld = CONFIG.WORLDS[Math.floor(State.currentLevelIdx / 10)] || CONFIG.WORLDS[0];

    ctx.save();
    ctx.resetTransform();
    const dpr = window.devicePixelRatio || 1;
    const shakeX = window.ArcadeJuice?.shakeX || 0;
    const shakeY = window.ArcadeJuice?.shakeY || 0;

    ctx.scale(dpr * State.scale, dpr * State.scale);
    ctx.translate(shakeX, shakeY);

    // Fondo del mundo con gradiente
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, currentWorld.bgTop);
    bgGrad.addColorStop(1, currentWorld.bgBottom);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Partículas ambientales del mundo
    ctx.save();
    for (const p of State.bgParticles) {
      ctx.fillStyle = currentWorld.accent;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Tablero y cuadrícula
    const cs = W / 8;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const x = c * cs;
        const y = r * cs;

        // Celda alterna
        ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);

        // Hielo
        if (State.iceGrid[r][c] > 0) {
          ctx.fillStyle = 'rgba(0, 229, 255, 0.28)';
          ctx.fillRect(x + 2, y + 2, cs - 4, cs - 4);
          ctx.strokeStyle = '#00e5ff';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 2, y + 2, cs - 4, cs - 4);
        }

        // Gema
        const gem = State.grid[r][c];
        if (gem && gem.type !== 0) {
          const isSelected = State.selectedCell && State.selectedCell.r === r && State.selectedCell.c === c;
          renderFacetedCrystal(ctx, x + cs / 2, y + cs / 2, cs * 0.42, gem, isSelected);
        }
      }
    }

    // Partículas
    for (let i = State.particles.length - 1; i >= 0; i--) {
      const p = State.particles[i];
      p.x += p.vx * 0.016;
      p.y += p.vy * 0.016;
      p.life -= 0.016;
      if (p.life <= 0) {
        State.particles.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Textos flotantes
    window.ArcadeJuice?.drawFloats(ctx);
    window.ArcadeJuice?.drawDebugOverlay(ctx, State.particles.length);

    ctx.restore();
  }

  function renderFacetedCrystal(ctx, cx, cy, r, gem, isSelected) {
    ctx.save();
    ctx.translate(cx, cy);

    if (isSelected) {
      ctx.strokeStyle = '#ffe066';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.25, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Pieza Bloqueada (Runa)
    if (gem.obstacle === CONFIG.OBSTACLES.LOCKED) {
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.roundRect(-r, -r, r * 2, r * 2, 6);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ᚱ', 0, 0);
      ctx.restore();
      return;
    }

    // Prisma de Color
    if (gem.special === CONFIG.SPECIALS.COLOR_BOMB) {
      const rainGrad = ctx.createLinearGradient(-r, -r, r, r);
      rainGrad.addColorStop(0, '#ff0055');
      rainGrad.addColorStop(0.3, '#ffaa00');
      rainGrad.addColorStop(0.6, '#00e5ff');
      rainGrad.addColorStop(1, '#b388ff');
      ctx.fillStyle = rainGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Brillo estrellado central
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    const gData = CONFIG.GEMS[gem.type - 1] || CONFIG.GEMS[0];

    // Facetas vectoriales 3D
    ctx.fillStyle = gData.base;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Faceta superior iluminada
    ctx.fillStyle = gData.facet;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.5);
    ctx.lineTo(r * 0.5, -r * 0.5);
    ctx.lineTo(0, -r * 0.85);
    ctx.closePath();
    ctx.fill();

    // Faceta oscura inferior
    ctx.fillStyle = gData.dark;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, r * 0.5);
    ctx.lineTo(r * 0.5, r * 0.5);
    ctx.lineTo(0, r * 0.85);
    ctx.closePath();
    ctx.fill();

    // Reflejo animado oblicuo recorriendo la superficie
    const sweep = ((Date.now() * 0.002) % 3.0) - 1.5;
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-r * 2 + sweep * r * 2, -r);
    ctx.lineTo(r + sweep * r * 2, r * 2);
    ctx.stroke();
    ctx.restore();

    // Indicador especial (Rayo o Bomba)
    if (gem.special === CONFIG.SPECIALS.LINE_H) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-r * 0.8, -2, r * 1.6, 4);
    } else if (gem.special === CONFIG.SPECIALS.LINE_V) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -r * 0.8, 4, r * 1.6);
    } else if (gem.special === CONFIG.SPECIALS.BOMB) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cadenas
    if (gem.obstacle === CONFIG.OBSTACLES.CHAINS) {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, -r * 0.7);
      ctx.lineTo(r * 0.7, r * 0.7);
      ctx.moveTo(-r * 0.7, r * 0.7);
      ctx.lineTo(r * 0.7, -r * 0.7);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==========================================
  // BUCLE DE JUEGO (RAF)
  // ==========================================
  let lastTime = 0;
  function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    window.ArcadeJuice?.update(dt);
    updateLivesSystem();

    render();
    requestAnimationFrame(gameLoop);
  }

  // ==========================================
  // ENTRADAS TÁCTILES Y DE RATÓN
  // ==========================================
  function setupInputs() {
    const canvas = dom.canvas;

    function getGridCoords(e) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / (rect.width / 8);
      const y = (e.clientY - rect.top) / (rect.height / 8);
      const c = Math.floor(x);
      const r = Math.floor(y);
      if (r >= 0 && r < 8 && c >= 0 && c < 8) return { r, c };
      return null;
    }

    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const coords = getGridCoords(e);
      if (coords) onCellClicked(coords.r, coords.c);
    });

    // Potenciadores
    dom.btnPowerupHammer.addEventListener('click', () => {
      if (State.activePowerupTool === 'hammer') {
        State.activePowerupTool = null;
        dom.btnPowerupHammer.classList.remove('active');
      } else {
        State.activePowerupTool = 'hammer';
        dom.btnPowerupHammer.classList.add('active');
        dom.btnPowerupSwap.classList.remove('active');
      }
    });

    dom.btnPowerupSwap.addEventListener('click', () => {
      if (State.activePowerupTool === 'swap') {
        State.activePowerupTool = null;
        dom.btnPowerupSwap.classList.remove('active');
      } else {
        State.activePowerupTool = 'swap';
        dom.btnPowerupSwap.classList.add('active');
        dom.btnPowerupHammer.classList.remove('active');
      }
    });

    dom.btnPowerupShuffle.addEventListener('click', applyShufflePowerup);

    dom.btnHint.addEventListener('click', () => {
      const move = CristalesLogic.findAnyValidMove(State.grid);
      if (move) {
        spawnGlow(move.c1, move.r1, '#ffe066');
        spawnGlow(move.c2, move.r2, '#ffe066');
        playAudio('select');
        window.ArcadeJuice?.spawnFloat('¡PISTA!', CONFIG.VIRTUAL_W / 2, 220, '#ffe066', 13);
      }
    });
  }

  // ==========================================
  // MAPA DE MUNDOS Y SELECCIÓN DE NIVELES
  // ==========================================
  let selectedWorld = 1;

  function renderWorldMap(worldIdx) {
    selectedWorld = worldIdx;
    const wData = CONFIG.WORLDS[worldIdx - 1];
    dom.worldBadge.textContent = wData.name.toUpperCase();
    dom.worldDesc.textContent = `Niveles ${(worldIdx - 1) * 10 + 1} al ${worldIdx * 10} • Obstáculo: ${wData.obstacleType}`;

    dom.levelsGrid.innerHTML = '';
    const startLvl = (worldIdx - 1) * 10;

    for (let i = 0; i < 10; i++) {
      const lvlIndex = startLvl + i;
      const lvlNum = lvlIndex + 1;
      const isUnlocked = lvlIndex < State.saveData.unlockedLevels;
      const stars = State.saveData.starsPerLevel[lvlIndex] || 0;

      const badge = document.createElement('div');
      badge.className = `level-badge ${isUnlocked ? 'unlocked' : 'locked'}`;
      badge.innerHTML = `
        <span class="level-num">${lvlNum}</span>
        <span class="level-stars">${isUnlocked && stars > 0 ? '★'.repeat(stars) : ''}</span>
      `;

      if (isUnlocked) {
        badge.addEventListener('click', () => startLevel(lvlIndex));
      }

      dom.levelsGrid.appendChild(badge);
    }
  }

  function renderAchievementsModal() {
    const list = [
      { id: 'ach_first_level', title: 'Primer Prisma', desc: 'Supera el nivel 1 de campaña', icon: '💎' },
      { id: 'ach_world_clear', title: 'Maestro del Mundo', desc: 'Completa los 10 niveles de un mundo', icon: '🌍' },
      { id: 'ach_combo5', title: 'Reverberación', desc: 'Desata una reacción de Cascada x5', icon: '⚡' },
      { id: 'ach_color_bomb', title: 'Prisma Hipercromático', desc: 'Activa un Prisma de Color de 5 gemas', icon: '🌈' },
      { id: 'ach_fusion', title: 'Fusión Especial', desc: 'Combina dos cristales especiales adyacentes', icon: '💥' },
      { id: 'ach_endless_10k', title: 'Brillo Perpetuo', desc: 'Alcanza 10,000 pts en Modo Infinito', icon: '⏱️' },
      { id: 'ach_stars_30', title: 'Coleccionista de Estrellas', desc: 'Acumula 30 estrellas en la campaña', icon: '⭐' },
      { id: 'ach_hammer', title: 'Artífice de Cuarzo', desc: 'Usa un Martillo de Cuarzo con éxito', icon: '🔨' }
    ];

    dom.achList.innerHTML = '';
    list.forEach(ach => {
      const unlocked = window.ArcadeJuice?.hasAchievement('cristales', ach.id);
      const row = document.createElement('div');
      row.className = `ach-item ${unlocked ? 'unlocked' : ''}`;
      row.innerHTML = `
        <span class="ach-icon">${unlocked ? ach.icon : '🔒'}</span>
        <div>
          <div class="ach-title">${ach.title}</div>
          <div class="ach-desc">${ach.desc}</div>
        </div>
        <span class="ach-status">${unlocked ? 'COMPLETADO' : 'BLOQUEADO'}</span>
      `;
      dom.achList.appendChild(row);
    });
  }

  function setupUI() {
    document.querySelectorAll('.world-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.world-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderWorldMap(parseInt(tab.dataset.world, 10));
      });
    });

    dom.btnStartEndless.addEventListener('click', startEndless);

    // Recompensa Diaria
    dom.btnOpenDaily.addEventListener('click', () => {
      dom.modalDaily.classList.remove('hidden');
    });
    dom.btnClaimDaily.addEventListener('click', () => {
      State.saveData.powerups.hammer += 1;
      State.saveData.powerups.swap += 1;
      State.saveData.lives = 5;
      updatePowerupCounts();
      updateLivesSystem();
      saveGameData();
      dom.modalDaily.classList.add('hidden');
      window.ArcadeJuice?.spawnFloat('¡RECOMPENSA RECLAMADA!', CONFIG.VIRTUAL_W / 2, 200, '#ffcc00', 14);
    });

    dom.btnCloseNoLives.addEventListener('click', () => {
      dom.modalNoLives.classList.add('hidden');
    });

    // Pausa y Resultados
    function togglePause() {
      dom.overlayPause.classList.toggle('hidden');
    }
    dom.btnPauseHeader.addEventListener('click', togglePause);
    dom.btnResume.addEventListener('click', togglePause);
    dom.btnRestartLevel.addEventListener('click', () => {
      togglePause();
      startLevel(State.currentLevelIdx);
    });
    dom.btnLevelSelect.addEventListener('click', () => {
      dom.overlayPause.classList.add('hidden');
      dom.startCard.classList.remove('hidden');
      renderWorldMap(selectedWorld);
    });

    dom.btnNextLevel.addEventListener('click', () => {
      dom.overlayResult.classList.add('hidden');
      if (State.currentLevelIdx + 1 < CONFIG.LEVELS.length) {
        startLevel(State.currentLevelIdx + 1);
      } else {
        dom.startCard.classList.remove('hidden');
        renderWorldMap(1);
      }
    });
    dom.btnRetryLevel.addEventListener('click', () => {
      dom.overlayResult.classList.add('hidden');
      startLevel(State.currentLevelIdx);
    });
    dom.btnExitToLevels.addEventListener('click', () => {
      dom.overlayResult.classList.add('hidden');
      dom.startCard.classList.remove('hidden');
      renderWorldMap(selectedWorld);
    });

    // Logros
    dom.btnAchievementsHeader.addEventListener('click', () => {
      renderAchievementsModal();
      dom.modalAchievements.classList.remove('hidden');
    });
    dom.btnCloseAch.addEventListener('click', () => {
      dom.modalAchievements.classList.add('hidden');
    });

    // Opciones
    dom.btnOptionsHeader.addEventListener('click', () => {
      dom.optSfx.checked = window.ArcadeJuice?.getOption('sfx', true);
      dom.optBgm.checked = window.ArcadeJuice?.getOption('bgm', true);
      dom.optVibration.checked = window.ArcadeJuice?.getOption('vibration', true);
      dom.optContrast.checked = window.ArcadeJuice?.getOption('contrast', false);
      dom.modalOptions.classList.remove('hidden');
    });
    dom.btnCloseOptions.addEventListener('click', () => {
      window.ArcadeJuice?.setOption('sfx', dom.optSfx.checked);
      window.ArcadeJuice?.setOption('bgm', dom.optBgm.checked);
      window.ArcadeJuice?.setOption('vibration', dom.optVibration.checked);
      window.ArcadeJuice?.setOption('contrast', dom.optContrast.checked);

      document.body.classList.toggle('high-contrast', dom.optContrast.checked);

      if (!dom.optBgm.checked) stopBGM();
      else startBGM();

      dom.modalOptions.classList.add('hidden');
    });

    // Sonido Header
    dom.btnSoundToggle.addEventListener('click', () => {
      if (window.ArcadeAudio) {
        const muted = window.ArcadeAudio.toggleMute();
        dom.iconSoundOn.classList.toggle('hidden', muted);
        dom.iconSoundOff.classList.toggle('hidden', !muted);
        if (muted) stopBGM();
        else startBGM();
      }
    });

    if (window.ArcadeJuice?.getOption('contrast', false)) {
      document.body.classList.add('high-contrast');
    }
  }

  function init() {
    handleResize();
    loadGameData();
    setupInputs();
    setupUI();
    renderWorldMap(1);

    requestAnimationFrame(gameLoop);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
