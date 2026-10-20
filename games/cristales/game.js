/**
 * games/cristales/game.js - Cristales Arcade 00s (Edición Maestra de Calidad)
 * Match-3 de gemas prismáticas vectoriales con facetas 3D y brillos animados,
 * 4 mundos con 40 niveles de campaña, obstáculos temáticos (hielo, cadenas, runas, transformantes),
 * potenciadores (martillo, mezcla, swap libre), combinaciones dobles y Juice total.
 */
(() => {
  'use strict';

  // Obtener referencia al motor de tweens compartido (Browser o Node)
  let ArcadeTween = (typeof window !== 'undefined' && window.ArcadeTween) ? window.ArcadeTween : null;
  if (!ArcadeTween && typeof require !== 'undefined') {
    try {
      ArcadeTween = require('../../shared/tween.js').ArcadeTween;
    } catch (_) {
      try {
        ArcadeTween = require('../shared/tween.js').ArcadeTween;
      } catch (_) {}
    }
  }

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

    ANIM: {
      SWAP_DURATION: 0.12,          // 100-140ms
      REJECT_SWAP_DURATION: 0.16,   // reject bounce back
      POP_DURATION: 0.20,           // 150-250ms
      POP_STAGGER: 0.03,            // 20-40ms stagger wave
      FALL_ACCELERATION: 1800,      // gravity acceleration
      FALL_MAX_DURATION: 0.28,      // cap on falling duration
      FALL_COL_STAGGER: 0.02,       // column stagger
      SPECIAL_CREATE_DURATION: 0.22,
      SPECIAL_ACTIVATE_DURATION: 0.30,
      SHINE_PERIOD: 2.8
    },

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
     * Comprueba si el tablero contiene alguna celda vacía no bloqueada
     */
    hasEmptyCells(grid) {
      const rows = grid.length;
      const cols = grid[0].length;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c].type === 0 && grid[r][c].obstacle !== CONFIG.OBSTACLES.LOCKED) {
            return true;
          }
        }
      }
      return false;
    },

    /**
     * Ejecuta un paso atómico de cascada en la matriz lógica y emite eventos
     * estructurados con orden, retardos, piezas supervivientes y especiales creados.
     */
    stepCascade(grid, iceGrid = null) {
      const rows = grid.length;
      const cols = grid[0].length;
      const matches = this.findMatches(grid);
      const emptyNeeded = this.hasEmptyCells(grid);

      if (matches.length === 0 && !emptyNeeded) {
        return {
          hasMatches: false,
          eliminatedCells: [],
          createdSpecials: [],
          activatedSpecials: [],
          gravityMoves: [],
          spawnedGems: [],
          clearedIce: [],
          scoreEarned: 0
        };
      }

      const eliminatedMap = new Map(); // "r,c" -> { r, c, type, special, delay }
      const createdSpecialsMap = new Map(); // "r,c" -> { r, c, special, type }
      const activatedSpecials = [];
      const clearedIce = [];

      if (matches.length > 0) {
        // Detectar intersecciones para creación de bombas
        const cellMatchCount = new Map();
        for (const m of matches) {
          for (const cell of m.cells) {
            const k = `${cell.r},${cell.c}`;
            cellMatchCount.set(k, (cellMatchCount.get(k) || 0) + 1);
          }
        }

        for (const m of matches) {
          const len = m.cells.length;
          let specialToCreate = CONFIG.SPECIALS.NONE;
          if (len === 4) {
            specialToCreate = m.orientation === 'H' ? CONFIG.SPECIALS.LINE_H : CONFIG.SPECIALS.LINE_V;
          } else if (len >= 5) {
            specialToCreate = CONFIG.SPECIALS.COLOR_BOMB;
          }

          let specialCell = m.cells[0];
          for (const cell of m.cells) {
            const k = `${cell.r},${cell.c}`;
            if (cellMatchCount.get(k) > 1) {
              specialCell = cell;
              specialToCreate = CONFIG.SPECIALS.BOMB;
              break;
            }
          }

          const centerR = m.cells[Math.floor(len / 2)].r;
          const centerC = m.cells[Math.floor(len / 2)].c;

          for (let i = 0; i < len; i++) {
            const cell = m.cells[i];
            const dist = Math.abs(cell.r - centerR) + Math.abs(cell.c - centerC);
            const delay = dist * CONFIG.ANIM.POP_STAGGER;

            if (iceGrid && iceGrid[cell.r][cell.c] > 0) {
              iceGrid[cell.r][cell.c] = 0;
              clearedIce.push({ r: cell.r, c: cell.c });
            }

            const currGem = grid[cell.r][cell.c];
            eliminatedMap.set(`${cell.r},${cell.c}`, {
              r: cell.r,
              c: cell.c,
              type: currGem.type,
              special: currGem.special,
              delay
            });

            // Detonación en cadena de especiales previos
            if (currGem.special === CONFIG.SPECIALS.LINE_H) {
              activatedSpecials.push({ r: cell.r, c: cell.c, special: CONFIG.SPECIALS.LINE_H });
              for (let c = 0; c < cols; c++) {
                const g = grid[cell.r][c];
                if (g.obstacle !== CONFIG.OBSTACLES.LOCKED) {
                  eliminatedMap.set(`${cell.r},${c}`, {
                    r: cell.r, c, type: g.type, special: g.special, delay: Math.abs(c - cell.c) * 0.02
                  });
                  if (iceGrid) iceGrid[cell.r][c] = 0;
                }
              }
            } else if (currGem.special === CONFIG.SPECIALS.LINE_V) {
              activatedSpecials.push({ r: cell.r, c: cell.c, special: CONFIG.SPECIALS.LINE_V });
              for (let r = 0; r < rows; r++) {
                const g = grid[r][cell.c];
                if (g.obstacle !== CONFIG.OBSTACLES.LOCKED) {
                  eliminatedMap.set(`${r},${cell.c}`, {
                    r, c: cell.c, type: g.type, special: g.special, delay: Math.abs(r - cell.r) * 0.02
                  });
                  if (iceGrid) iceGrid[r][cell.c] = 0;
                }
              }
            } else if (currGem.special === CONFIG.SPECIALS.BOMB) {
              activatedSpecials.push({ r: cell.r, c: cell.c, special: CONFIG.SPECIALS.BOMB });
              for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                  const nr = cell.r + dr, nc = cell.c + dc;
                  if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    const g = grid[nr][nc];
                    if (g.obstacle !== CONFIG.OBSTACLES.LOCKED) {
                      eliminatedMap.set(`${nr},${nc}`, {
                        r: nr, c: nc, type: g.type, special: g.special, delay: Math.max(Math.abs(dr), Math.abs(dc)) * 0.03
                      });
                      if (iceGrid) iceGrid[nr][nc] = 0;
                    }
                  }
                }
              }
            }
          }

          if (specialToCreate !== CONFIG.SPECIALS.NONE) {
            createdSpecialsMap.set(`${specialCell.r},${specialCell.c}`, {
              r: specialCell.r,
              c: specialCell.c,
              special: specialToCreate,
              type: m.type
            });
          }
        }
      }

      // Aplicar eliminaciones y creación de especiales atómicamente a la matriz lógica
      for (const [k, cellInfo] of eliminatedMap.entries()) {
        const { r, c } = cellInfo;
        if (grid[r][c].obstacle === CONFIG.OBSTACLES.LOCKED) continue;

        if (createdSpecialsMap.has(k)) {
          const spec = createdSpecialsMap.get(k);
          grid[r][c] = { type: spec.type, special: spec.special, obstacle: CONFIG.OBSTACLES.NONE };
        } else {
          grid[r][c] = { type: 0, special: CONFIG.SPECIALS.NONE, obstacle: CONFIG.OBSTACLES.NONE };
        }
      }

      // Calcular desplazamientos por gravedad preservando orden estricto
      const gravityMoves = [];
      for (let c = 0; c < cols; c++) {
        let writeRow = rows - 1;
        for (let r = rows - 1; r >= 0; r--) {
          if (grid[r][c].obstacle === CONFIG.OBSTACLES.LOCKED) {
            writeRow = r - 1;
            continue;
          }
          if (grid[r][c].type !== 0) {
            if (writeRow !== r) {
              gravityMoves.push({
                fromR: r,
                toR: writeRow,
                c,
                type: grid[r][c].type,
                special: grid[r][c].special,
                obstacle: grid[r][c].obstacle
              });
              grid[writeRow][c] = grid[r][c];
              grid[r][c] = { type: 0, special: CONFIG.SPECIALS.NONE, obstacle: CONFIG.OBSTACLES.NONE };
            }
            writeRow--;
          }
        }
      }

      // Rellenar celdas vacías y registrar entradas desde la parte superior
      const spawnedGems = [];
      const cellSize = CONFIG.VIRTUAL_W / cols;
      for (let c = 0; c < cols; c++) {
        let emptyCountInCol = 0;
        for (let r = 0; r < rows; r++) {
          if (grid[r][c].type === 0 && grid[r][c].obstacle !== CONFIG.OBSTACLES.LOCKED) {
            emptyCountInCol++;
          }
        }

        let spawnOrder = 0;
        for (let r = rows - 1; r >= 0; r--) {
          if (grid[r][c].type === 0 && grid[r][c].obstacle !== CONFIG.OBSTACLES.LOCKED) {
            const chosenType = Math.floor(Math.random() * CONFIG.NUM_GEM_TYPES) + 1;
            grid[r][c] = {
              type: chosenType,
              special: CONFIG.SPECIALS.NONE,
              obstacle: CONFIG.OBSTACLES.NONE
            };
            spawnOrder++;
            const startY = -(emptyCountInCol - spawnOrder + 1) * cellSize;
            spawnedGems.push({
              toR: r,
              c,
              type: chosenType,
              special: CONFIG.SPECIALS.NONE,
              obstacle: CONFIG.OBSTACLES.NONE,
              startY
            });
          }
        }
      }

      const scoreEarned = eliminatedMap.size * 50;

      return {
        hasMatches: true,
        eliminatedCells: Array.from(eliminatedMap.values()),
        createdSpecials: Array.from(createdSpecialsMap.values()),
        activatedSpecials,
        gravityMoves,
        spawnedGems,
        clearedIce,
        scoreEarned
      };
    },

    /**
     * Valida si un nivel es matemáticamente resoluble verificando su ratio de movimientos/objetivo
     */
    isLevelSolvable(level) {
      if (!level || !level.moves || level.moves <= 0) return false;
      const maxPossibleScore = level.moves * 3500;
      if (level.targetScore > maxPossibleScore) return false;

      if (level.iceGoal && level.iceGoal > level.moves * 2.5) return false;
      if (level.chainsGoal && level.chainsGoal > level.moves * 2) return false;
      if (level.lockedGoal && level.lockedGoal > level.moves * 1.8) return false;
      if (level.shifterGoal && level.shifterGoal > level.moves * 2) return false;

      return true;
    }
  };

  // ==========================================
  // ARQUITECTURA VISUAL: SPRITES Y ANIMADOR
  // ==========================================
  class GemVisualSprite {
    constructor(id) {
      this.id = id;
      this.active = false;
      this.type = 0;
      this.special = 0;
      this.obstacle = 0;
      this.r = 0;
      this.c = 0;
      this.x = 0;
      this.y = 0;
      this.scale = 1.0;
      this.scaleX = 1.0;
      this.scaleY = 1.0;
      this.rotation = 0;
      this.alpha = 1.0;
      this.brightness = 1.0;
      this.shinePhase = Math.random() * Math.PI * 2;
      this.isEliminating = false;
    }

    reset() {
      this.active = false;
      this.type = 0;
      this.special = 0;
      this.obstacle = 0;
      this.r = 0;
      this.c = 0;
      this.x = 0;
      this.y = 0;
      this.scale = 1.0;
      this.scaleX = 1.0;
      this.scaleY = 1.0;
      this.rotation = 0;
      this.alpha = 1.0;
      this.brightness = 1.0;
      this.shinePhase = 0;
      this.isEliminating = false;
    }
  }

  class CristalesVisualManager {
    constructor(cols = 8, rows = 8, cellSize = 60) {
      this.cols = cols;
      this.rows = rows;
      this.cellSize = cellSize;
      this.visualGrid = Array.from({ length: rows }, () => new Array(cols).fill(null));
      this.transientSprites = [];
      this.spritePool = [];
      for (let i = 0; i < 160; i++) {
        this.spritePool.push(new GemVisualSprite(i));
      }
    }

    acquireSprite() {
      for (let i = 0; i < this.spritePool.length; i++) {
        if (!this.spritePool[i].active) {
          const s = this.spritePool[i];
          s.active = true;
          s.alpha = 1.0;
          s.scale = 1.0;
          s.scaleX = 1.0;
          s.scaleY = 1.0;
          s.rotation = 0;
          s.brightness = 1.0;
          s.shinePhase = Math.random() * Math.PI * 2;
          s.isEliminating = false;
          return s;
        }
      }
      const newSprite = new GemVisualSprite(this.spritePool.length);
      newSprite.active = true;
      this.spritePool.push(newSprite);
      return newSprite;
    }

    releaseSprite(sprite) {
      if (!sprite) return;
      const tweenEngine = typeof ArcadeTween !== 'undefined' ? ArcadeTween : (typeof window !== 'undefined' ? window.ArcadeTween : null);
      if (tweenEngine) tweenEngine.killTweensOf(sprite);
      sprite.reset();
    }

    syncFromLogical(grid) {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (this.visualGrid[r][c]) {
            this.releaseSprite(this.visualGrid[r][c]);
            this.visualGrid[r][c] = null;
          }
        }
      }
      for (const s of this.transientSprites) {
        this.releaseSprite(s);
      }
      this.transientSprites.length = 0;

      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const cell = grid[r][c];
          if (cell && cell.type !== 0) {
            const s = this.acquireSprite();
            s.type = cell.type;
            s.special = cell.special;
            s.obstacle = cell.obstacle;
            s.r = r;
            s.c = c;
            s.x = c * this.cellSize + this.cellSize / 2;
            s.y = r * this.cellSize + this.cellSize / 2;
            this.visualGrid[r][c] = s;
          }
        }
      }
    }

    animateSwap(r1, c1, r2, c2, isValid, speedMul = 1.0, onComplete = null) {
      const s1 = this.visualGrid[r1][c1];
      const s2 = this.visualGrid[r2][c2];
      const tweenEngine = typeof ArcadeTween !== 'undefined' ? ArcadeTween : (typeof window !== 'undefined' ? window.ArcadeTween : null);

      if (!s1 || !s2 || !tweenEngine) {
        if (isValid) {
          this.visualGrid[r1][c1] = s2;
          this.visualGrid[r2][c2] = s1;
          if (s1) { s1.r = r2; s1.c = c2; s1.x = c2 * this.cellSize + this.cellSize/2; s1.y = r2 * this.cellSize + this.cellSize/2; }
          if (s2) { s2.r = r1; s2.c = c1; s2.x = c1 * this.cellSize + this.cellSize/2; s2.y = r1 * this.cellSize + this.cellSize/2; }
        }
        if (onComplete) onComplete();
        return;
      }

      const x1 = c1 * this.cellSize + this.cellSize / 2;
      const y1 = r1 * this.cellSize + this.cellSize / 2;
      const x2 = c2 * this.cellSize + this.cellSize / 2;
      const y2 = r2 * this.cellSize + this.cellSize / 2;

      const swapDur = Math.max(0.04, CONFIG.ANIM.SWAP_DURATION / speedMul);

      if (isValid) {
        this.visualGrid[r1][c1] = s2;
        this.visualGrid[r2][c2] = s1;
        s1.r = r2; s1.c = c2;
        s2.r = r1; s2.c = c1;

        let finished = 0;
        const checkDone = () => {
          finished++;
          if (finished === 2 && onComplete) onComplete();
        };

        tweenEngine.to(s1, swapDur, { x: x2, y: y2 }, { easing: 'easeInOutQuad', onComplete: checkDone });
        tweenEngine.to(s2, swapDur, { x: x1, y: y1 }, { easing: 'easeInOutQuad', onComplete: checkDone });
      } else {
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const rejectDur = Math.max(0.06, CONFIG.ANIM.REJECT_SWAP_DURATION / speedMul);

        tweenEngine.to(s1, rejectDur * 0.45, { x: midX, y: midY }, {
          easing: 'easeOutQuad',
          onComplete: () => {
            tweenEngine.to(s1, rejectDur * 0.55, { x: x1, y: y1 }, {
              easing: 'easeOutBack',
              onComplete: () => { if (onComplete) onComplete(); }
            });
          }
        });

        tweenEngine.to(s2, rejectDur * 0.45, { x: midX, y: midY }, {
          easing: 'easeOutQuad',
          onComplete: () => {
            tweenEngine.to(s2, rejectDur * 0.55, { x: x2, y: y2 }, { easing: 'easeOutBack' });
          }
        });
      }
    }

    animateCascadeStep(stepEvent, speedMul = 1.0, onStepComplete = null) {
      const tweenEngine = typeof ArcadeTween !== 'undefined' ? ArcadeTween : (typeof window !== 'undefined' ? window.ArcadeTween : null);
      if (!tweenEngine) {
        if (onStepComplete) onStepComplete();
        return;
      }

      let pendingTweens = 0;
      const trackTween = () => {
        pendingTweens++;
        return () => {
          pendingTweens--;
          if (pendingTweens === 0 && onStepComplete) {
            onStepComplete();
          }
        };
      };

      // 1. Eliminaciones con onda visual escalonada
      for (const cell of stepEvent.eliminatedCells) {
        const sprite = this.visualGrid[cell.r][cell.c];
        if (sprite && !sprite.isEliminating) {
          sprite.isEliminating = true;
          this.visualGrid[cell.r][cell.c] = null;
          this.transientSprites.push(sprite);

          const doneCb = trackTween();
          const delay = Math.max(0, cell.delay / speedMul);
          const popDur = Math.max(0.08, CONFIG.ANIM.POP_DURATION / speedMul);

          tweenEngine.to(sprite, popDur * 0.25, {
            brightness: 2.2,
            scale: 1.22
          }, {
            delay,
            easing: 'easeOutQuad',
            onComplete: () => {
              const rot = (cell.c % 2 === 0 ? 0.45 : -0.45);
              tweenEngine.to(sprite, popDur * 0.75, {
                scale: 0.0,
                scaleX: 0.0,
                scaleY: 0.0,
                rotation: rot,
                alpha: 0.0
              }, {
                easing: 'easeInQuad',
                onComplete: () => {
                  const idx = this.transientSprites.indexOf(sprite);
                  if (idx !== -1) this.transientSprites.splice(idx, 1);
                  this.releaseSprite(sprite);
                  doneCb();
                }
              });
            }
          });
        }
      }

      // 2. Creación condensada de piezas especiales
      for (const spec of stepEvent.createdSpecials) {
        const s = this.acquireSprite();
        s.type = spec.type;
        s.special = spec.special;
        s.obstacle = CONFIG.OBSTACLES.NONE;
        s.r = spec.r;
        s.c = spec.c;
        s.x = spec.c * this.cellSize + this.cellSize / 2;
        s.y = spec.r * this.cellSize + this.cellSize / 2;
        s.scale = 0.0;
        s.scaleX = 0.0;
        s.scaleY = 0.0;
        s.brightness = 2.8;

        this.visualGrid[spec.r][spec.c] = s;
        const doneCb = trackTween();
        const specDelay = Math.max(0.03, (CONFIG.ANIM.POP_DURATION * 0.45) / speedMul);
        const specDur = Math.max(0.08, CONFIG.ANIM.SPECIAL_CREATE_DURATION / speedMul);

        tweenEngine.to(s, specDur, {
          scale: 1.0,
          scaleX: 1.0,
          scaleY: 1.0,
          brightness: 1.0
        }, {
          delay: specDelay,
          easing: 'easeOutBack',
          onComplete: doneCb
        });
      }

      // 3. Caídas por gravedad con aceleración, escalonamiento y rebote de aterrizaje
      const fallDelay = Math.max(0.02, (CONFIG.ANIM.POP_DURATION * 0.4) / speedMul);

      for (const fall of stepEvent.gravityMoves) {
        const sprite = this.visualGrid[fall.fromR][fall.c];
        if (sprite) {
          this.visualGrid[fall.fromR][fall.c] = null;
          this.visualGrid[fall.toR][fall.c] = sprite;
          sprite.r = fall.toR;
          sprite.c = fall.c;

          const targetY = fall.toR * this.cellSize + this.cellSize / 2;
          const dist = (fall.toR - fall.fromR) * this.cellSize;
          const dur = Math.min(
            CONFIG.ANIM.FALL_MAX_DURATION / speedMul,
            Math.sqrt(2 * dist / CONFIG.ANIM.FALL_ACCELERATION) / speedMul
          );
          const colStagger = (fall.c * CONFIG.ANIM.FALL_COL_STAGGER) / speedMul;

          const doneCb = trackTween();
          tweenEngine.to(sprite, dur, { y: targetY }, {
            delay: fallDelay + colStagger,
            easing: 'easeInQuad',
            onComplete: () => {
              tweenEngine.to(sprite, 0.04, { scaleY: 0.84, scaleX: 1.16 }, {
                easing: 'easeOutQuad',
                onComplete: () => {
                  tweenEngine.to(sprite, 0.08, { scaleY: 1.0, scaleX: 1.0 }, {
                    easing: 'easeOutBounce',
                    onComplete: doneCb
                  });
                }
              });
            }
          });
        }
      }

      // 4. Gemas nuevas entrando desde arriba del tablero
      for (const sp of stepEvent.spawnedGems) {
        const s = this.acquireSprite();
        s.type = sp.type;
        s.special = sp.special;
        s.obstacle = sp.obstacle;
        s.r = sp.toR;
        s.c = sp.c;
        s.x = sp.c * this.cellSize + this.cellSize / 2;
        s.y = sp.startY;
        s.scale = 1.0;
        s.scaleX = 1.0;
        s.scaleY = 1.0;

        this.visualGrid[sp.toR][sp.c] = s;

        const targetY = sp.toR * this.cellSize + this.cellSize / 2;
        const dist = targetY - sp.startY;
        const dur = Math.min(
          CONFIG.ANIM.FALL_MAX_DURATION / speedMul,
          Math.sqrt(2 * dist / CONFIG.ANIM.FALL_ACCELERATION) / speedMul
        );
        const colStagger = (sp.c * CONFIG.ANIM.FALL_COL_STAGGER) / speedMul;

        const doneCb = trackTween();
        tweenEngine.to(s, dur, { y: targetY }, {
          delay: fallDelay + colStagger,
          easing: 'easeInQuad',
          onComplete: () => {
            tweenEngine.to(s, 0.04, { scaleY: 0.84, scaleX: 1.16 }, {
              easing: 'easeOutQuad',
              onComplete: () => {
                tweenEngine.to(s, 0.08, { scaleY: 1.0, scaleX: 1.0 }, {
                  easing: 'easeOutBounce',
                  onComplete: doneCb
                });
              }
            });
          }
        });
      }

      if (pendingTweens === 0 && onStepComplete) {
        onStepComplete();
      }
    }

    animateBoardFill(grid, speedMul = 1.0, onComplete = null) {
      const tweenEngine = typeof ArcadeTween !== 'undefined' ? ArcadeTween : (typeof window !== 'undefined' ? window.ArcadeTween : null);
      this.syncFromLogical(grid);

      if (!tweenEngine) {
        if (onComplete) onComplete();
        return;
      }

      let pending = 0;
      const checkDone = () => {
        pending--;
        if (pending === 0 && onComplete) onComplete();
      };

      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const s = this.visualGrid[r][c];
          if (s) {
            const finalY = s.y;
            s.y = -80 - (this.rows - r) * 35;
            s.scale = 0.5;
            pending++;

            const waveDelay = ((r + c) * 0.03) / speedMul;
            tweenEngine.to(s, 0.28 / speedMul, { y: finalY, scale: 1.0 }, {
              delay: waveDelay,
              easing: 'easeOutBounce',
              onComplete: checkDone
            });
          }
        }
      }

      if (pending === 0 && onComplete) onComplete();
    }

    verifyMatches(logicalGrid) {
      const errors = [];
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const logCell = logicalGrid[r][c];
          const visSprite = this.visualGrid[r][c];

          if (logCell && logCell.type !== 0) {
            if (!visSprite) {
              errors.push(`Celda lógica ocupada en (${r},${c}) no tiene sprite visual.`);
              continue;
            }
            if (visSprite.type !== logCell.type) {
              errors.push(`Discrepancia de tipo en (${r},${c}): visual=${visSprite.type}, log=${logCell.type}`);
            }
            if (visSprite.special !== logCell.special) {
              errors.push(`Discrepancia de especial en (${r},${c}): visual=${visSprite.special}, log=${logCell.special}`);
            }
            if (visSprite.obstacle !== logCell.obstacle) {
              errors.push(`Discrepancia de obstáculo en (${r},${c}): visual=${visSprite.obstacle}, log=${logCell.obstacle}`);
            }
            const expX = c * this.cellSize + this.cellSize / 2;
            const expY = r * this.cellSize + this.cellSize / 2;
            if (Math.abs(visSprite.x - expX) > 1.5 || Math.abs(visSprite.y - expY) > 1.5) {
              errors.push(`Posición visual no asentada en (${r},${c}): visual=(${visSprite.x.toFixed(1)},${visSprite.y.toFixed(1)}), esperada=(${expX},${expY})`);
            }
          } else {
            if (visSprite && visSprite.type !== 0 && !visSprite.isEliminating) {
              errors.push(`Celda lógica vacía en (${r},${c}) tiene sprite visual activo type=${visSprite.type}`);
            }
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    }
  }

  const CristalesVisual = new CristalesVisualManager(CONFIG.COLS, CONFIG.ROWS, CONFIG.VIRTUAL_W / CONFIG.COLS);

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
    displayedScore: 0,
    levelTargetScore: 1000,
    currentObstacleGoal: 0,
    currentObstacleCleared: 0,
    endlessTimeRemaining: 60,

    // Entrada en cola
    queuedCell: null,
    queuedMove: null,

    // Opciones
    options: {
      fastAnim: false
    },

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
  // POOLS DE EFECTOS Y RENDIMIENTO
  // ==========================================
  const MAX_PARTICLES = 150;
  const particlePool = [];
  for (let i = 0; i < MAX_PARTICLES; i++) {
    particlePool.push({
      active: false,
      x: 0, y: 0, vx: 0, vy: 0,
      size: 0, color: '#fff', life: 0, maxLife: 0
    });
  }

  function spawnParticles(x, y, color, count = 8) {
    if (PerfTuner.lowQualityMode) count = Math.min(count, 4);
    let spawned = 0;
    for (let i = 0; i < MAX_PARTICLES && spawned < count; i++) {
      const p = particlePool[i];
      if (!p.active) {
        p.active = true;
        p.x = x;
        p.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 110;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.size = 2.5 + Math.random() * 3.5;
        p.color = color;
        p.life = 0.22 + Math.random() * 0.22;
        p.maxLife = p.life;
        spawned++;
      }
    }
  }

  const beamsPool = [];
  for (let i = 0; i < 8; i++) {
    beamsPool.push({ active: false, r: 0, c: 0, orientation: 'H', life: 0, maxLife: 0.28 });
  }

  function spawnBeam(r, c, orientation) {
    for (let i = 0; i < beamsPool.length; i++) {
      if (!beamsPool[i].active) {
        const b = beamsPool[i];
        b.active = true;
        b.r = r;
        b.c = c;
        b.orientation = orientation;
        b.life = 0.28;
        b.maxLife = 0.28;
        return;
      }
    }
  }

  const shockwavesPool = [];
  for (let i = 0; i < 8; i++) {
    shockwavesPool.push({ active: false, x: 0, y: 0, radius: 0, maxRadius: 90, life: 0, maxLife: 0.3 });
  }

  function spawnShockwave(x, y) {
    for (let i = 0; i < shockwavesPool.length; i++) {
      if (!shockwavesPool[i].active) {
        const sw = shockwavesPool[i];
        sw.active = true;
        sw.x = x;
        sw.y = y;
        sw.radius = 8;
        sw.life = 0.3;
        sw.maxLife = 0.3;
        return;
      }
    }
  }

  const PerfTuner = {
    fps: 60,
    frameCount: 0,
    lastFpsCheck: 0,
    lowQualityMode: false,
    update(timestamp) {
      if (!this.lastFpsCheck) this.lastFpsCheck = timestamp;
      this.frameCount++;
      if (timestamp - this.lastFpsCheck >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (timestamp - this.lastFpsCheck));
        this.frameCount = 0;
        this.lastFpsCheck = timestamp;
        if (this.fps < 55) {
          this.lowQualityMode = true;
        }
      }
    }
  };

  let gemAtlas = null;
  let cachedBgCanvas = null;

  // ==========================================
  // REFERENCIAS DOM
  // ==========================================
  const dom = (typeof document !== 'undefined') ? {
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
    optFastAnim: document.getElementById('opt-fast-anim'),
    btnCloseOptions: document.getElementById('btn-close-options')
  } : {};

  if (dom.canvas) {
    dom.ctx = dom.canvas.getContext('2d');
  }

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

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => setTimeout(handleResize, 100));
  }

  // ==========================================
  // INICIO DE NIVEL Y CONFIGURACIÓN
  // ==========================================
  function startLevel(lvlIndex) {
    if (State.saveData.lives <= 0 && !State.isEndlessMode) {
      if (dom.modalNoLives) dom.modalNoLives.classList.remove('hidden');
      return;
    }

    State.currentLevelIdx = lvlIndex;
    State.isEndlessMode = false;
    const lvl = CONFIG.LEVELS[lvlIndex];

    State.score = 0;
    State.displayedScore = 0;
    State.movesRemaining = lvl.moves;
    State.levelTargetScore = lvl.targetScore;
    State.comboCount = 1;
    State.selectedCell = null;
    State.queuedMove = null;
    State.queuedCell = null;
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

    // Pre-cachear fondo del mundo
    const currentWorld = CONFIG.WORLDS[Math.floor(lvlIndex / 10)] || CONFIG.WORLDS[0];
    cacheStaticBackground(CONFIG.VIRTUAL_W, CONFIG.VIRTUAL_H, currentWorld);

    // Animación de entrada en ola
    const speedMul = State.options.fastAnim ? 1.8 : 1.0;
    CristalesVisual.animateBoardFill(State.grid, speedMul);

    // Actualizar objetivos en HUD
    if (dom.goalText) dom.goalText.textContent = `Meta: ${lvl.targetScore.toLocaleString()} pts`;
    if (dom.objectiveLabel) dom.objectiveLabel.textContent = 'MOVIMIENTOS';
    if (dom.objectiveVal) dom.objectiveVal.textContent = State.movesRemaining;
    if (dom.scoreVal) dom.scoreVal.textContent = '0';

    if (dom.startCard) dom.startCard.classList.add('hidden');
    if (dom.overlayPause) dom.overlayPause.classList.add('hidden');
    if (dom.overlayResult) dom.overlayResult.classList.add('hidden');

    startBGM();
    window.ArcadeJuice?.trackPlay('cristales', 0);
  }

  function startEndless() {
    State.isEndlessMode = true;
    State.score = 0;
    State.displayedScore = 0;
    State.endlessTimeRemaining = 60;
    State.comboCount = 1;
    State.selectedCell = null;
    State.queuedMove = null;
    State.queuedCell = null;
    State.activePowerupTool = null;

    for (let r = 0; r < 8; r++) State.iceGrid[r].fill(0);
    State.grid = CristalesLogic.generateBoard(CONFIG.COLS, CONFIG.ROWS, CONFIG.NUM_GEM_TYPES);

    const currentWorld = CONFIG.WORLDS[0];
    cacheStaticBackground(CONFIG.VIRTUAL_W, CONFIG.VIRTUAL_H, currentWorld);

    const speedMul = State.options.fastAnim ? 1.8 : 1.0;
    CristalesVisual.animateBoardFill(State.grid, speedMul);

    if (dom.goalText) dom.goalText.textContent = 'Modo Infinito';
    if (dom.objectiveLabel) dom.objectiveLabel.textContent = 'CRONÓMETRO';
    if (dom.objectiveVal) dom.objectiveVal.textContent = `${State.endlessTimeRemaining}s`;
    if (dom.scoreVal) dom.scoreVal.textContent = '0';

    if (dom.startCard) dom.startCard.classList.add('hidden');
    if (dom.overlayPause) dom.overlayPause.classList.add('hidden');
    if (dom.overlayResult) dom.overlayResult.classList.add('hidden');

    startBGM();
  }

  // ==========================================
  // MANIPULACIÓN Y INTERCAMBIO DE GEMAS
  // ==========================================
  function onCellClicked(r, c) {
    window.ArcadeAudio?.initCtx();

    // Si hay un potenciador activo (Martillo)
    if (State.activePowerupTool === 'hammer') {
      if (State.isSwapping || State.isCascading) return;
      applyHammer(r, c);
      return;
    }

    // ENTRADA EN COLA: Permitir encolar el siguiente movimiento válido mientras se anima
    if (State.isSwapping || State.isCascading) {
      if (!State.queuedCell) {
        State.queuedCell = { r, c };
      } else {
        const dist = Math.abs(State.queuedCell.r - r) + Math.abs(State.queuedCell.c - c);
        if (dist === 1) {
          State.queuedMove = { r1: State.queuedCell.r, c1: State.queuedCell.c, r2: r, c2: c };
        }
        State.queuedCell = null;
      }
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

    // Si no es adyacente y no es Swap libre, cambiar la selección
    const dist = Math.abs(r1 - r2) + Math.abs(c1 - c2);
    if (dist > 1 && State.activePowerupTool !== 'swap') {
      State.selectedCell = { r, c };
      playAudio('select');
      return;
    }

    // Si hay Swap Libre activo
    if (State.activePowerupTool === 'swap') {
      applyFreeSwap(r1, c1, r2, c2);
      return;
    }

    // Intercambio regular
    if (CristalesLogic.isValidSwap(State.grid, r1, c1, r2, c2)) {
      executeSwapAnimated(r1, c1, r2, c2);
    } else {
      executeRejectSwapAnimated(r1, c1, r2, c2);
    }
  }

  function executeRejectSwapAnimated(r1, c1, r2, c2) {
    State.isSwapping = true;
    State.selectedCell = null;
    playAudio('select');
    window.ArcadeJuice?.shake(2, 0.12);
    window.ArcadeJuice?.vibrate(10);

    const speedMul = State.options.fastAnim ? 1.8 : 1.0;
    CristalesVisual.animateSwap(r1, c1, r2, c2, false, speedMul, () => {
      State.isSwapping = false;
    });
  }

  function executeSwapAnimated(r1, c1, r2, c2) {
    State.isSwapping = true;
    State.selectedCell = null;
    playAudio('swap');
    window.ArcadeJuice?.vibrate(12);

    const g1 = State.grid[r1][c1];
    const g2 = State.grid[r2][c2];
    const speedMul = State.options.fastAnim ? 1.8 : 1.0;

    CristalesVisual.animateSwap(r1, c1, r2, c2, true, speedMul, () => {
      // Aplicar intercambio en la matriz lógica
      const temp = State.grid[r1][c1];
      State.grid[r1][c1] = State.grid[r2][c2];
      State.grid[r2][c2] = temp;

      if (!State.isEndlessMode) {
        State.movesRemaining--;
        if (dom.objectiveVal) dom.objectiveVal.textContent = State.movesRemaining;
      }

      // Fusión de dos piezas especiales
      if (g1.special !== CONFIG.SPECIALS.NONE && g2.special !== CONFIG.SPECIALS.NONE) {
        executeDoubleSpecial(r1, c1, r2, c2);
        return;
      }

      // Prisma de color
      if (g1.special === CONFIG.SPECIALS.COLOR_BOMB || g2.special === CONFIG.SPECIALS.COLOR_BOMB) {
        const prismCell = g1.special === CONFIG.SPECIALS.COLOR_BOMB ? { r: r2, c: c2 } : { r: r1, c: c1 };
        const otherCell = g1.special === CONFIG.SPECIALS.COLOR_BOMB ? { r: r1, c: c1 } : { r: r2, c: c2 };
        executeColorPrism(prismCell.r, prismCell.c, State.grid[otherCell.r][otherCell.c].type);
        return;
      }

      // Resolver cascada animada
      resolveCascadeAnimated();
    });
  }

  function executeDoubleSpecial(r1, c1, r2, c2) {
    const s1 = State.grid[r1][c1].special;
    const s2 = State.grid[r2][c2].special;
    const type1 = State.grid[r1][c1].type;
    const type2 = State.grid[r2][c2].type;
    const targetColor = type1 || type2 || 1;

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
      clearAllOfType(targetColor);
    }

    CristalesVisual.syncFromLogical(State.grid);
    resolveCascadeAnimated();
  }

  function executeColorPrism(pr, pc, targetColor) {
    State.grid[pr][pc] = { type: 0, special: CONFIG.SPECIALS.NONE, obstacle: CONFIG.OBSTACLES.NONE };
    playAudio('special_prism');
    window.ArcadeJuice?.shake(8, 0.3);
    window.ArcadeJuice?.spawnFloat('¡PRISMA TOTAL!', CONFIG.VIRTUAL_W / 2, 240, '#ffd700', 14);

    clearAllOfType(targetColor);
    CristalesVisual.syncFromLogical(State.grid);
    resolveCascadeAnimated();
  }

  function clearRow(r) {
    const cs = CONFIG.VIRTUAL_W / CONFIG.COLS;
    spawnBeam(r, 0, 'H');
    for (let c = 0; c < 8; c++) {
      State.grid[r][c] = { type: 0, special: CONFIG.SPECIALS.NONE, obstacle: CONFIG.OBSTACLES.NONE };
      State.iceGrid[r][c] = 0;
      spawnParticles(c * cs + cs / 2, r * cs + cs / 2, '#00d2ff', 4);
    }
  }

  function clearCol(c) {
    const cs = CONFIG.VIRTUAL_W / CONFIG.COLS;
    spawnBeam(0, c, 'V');
    for (let r = 0; r < 8; r++) {
      State.grid[r][c] = { type: 0, special: CONFIG.SPECIALS.NONE, obstacle: CONFIG.OBSTACLES.NONE };
      State.iceGrid[r][c] = 0;
      spawnParticles(c * cs + cs / 2, r * cs + cs / 2, '#00d2ff', 4);
    }
  }

  function detonateArea(cr, cc, rad = 1) {
    const cs = CONFIG.VIRTUAL_W / CONFIG.COLS;
    spawnShockwave(cc * cs + cs / 2, cr * cs + cs / 2);
    for (let r = cr - rad; r <= cr + rad; r++) {
      for (let c = cc - rad; c <= cc + rad; c++) {
        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
          State.grid[r][c] = { type: 0, special: CONFIG.SPECIALS.NONE, obstacle: CONFIG.OBSTACLES.NONE };
          State.iceGrid[r][c] = 0;
          spawnParticles(c * cs + cs / 2, r * cs + cs / 2, '#ff8800', 4);
        }
      }
    }
  }

  function clearAllOfType(colorType) {
    const cs = CONFIG.VIRTUAL_W / CONFIG.COLS;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (State.grid[r][c].type === colorType) {
          State.grid[r][c] = { type: 0, special: CONFIG.SPECIALS.NONE, obstacle: CONFIG.OBSTACLES.NONE };
          State.iceGrid[r][c] = 0;
          spawnParticles(c * cs + cs / 2, r * cs + cs / 2, '#ffcc00', 4);
        }
      }
    }
  }

  function refillEmptyCells(grid) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (grid[r][c].type === 0 && grid[r][c].obstacle !== CONFIG.OBSTACLES.LOCKED) {
          grid[r][c] = {
            type: Math.floor(Math.random() * CONFIG.NUM_GEM_TYPES) + 1,
            special: CONFIG.SPECIALS.NONE,
            obstacle: CONFIG.OBSTACLES.NONE
          };
        }
      }
    }
  }

  function verifyBoardSync() {
    let hasDiscrepancy = false;
    const discrepancyDetails = [];

    for (let r = 0; r < CONFIG.ROWS; r++) {
      for (let c = 0; c < CONFIG.COLS; c++) {
        const cell = State.grid[r][c];
        if (!cell) {
          hasDiscrepancy = true;
          discrepancyDetails.push(`Celda nula en (${r},${c})`);
          continue;
        }

        if (cell.obstacle !== CONFIG.OBSTACLES.LOCKED) {
          if (cell.type < 1 || cell.type > CONFIG.NUM_GEM_TYPES) {
            hasDiscrepancy = true;
            discrepancyDetails.push(`Celda vacía o tipo inválido en (${r},${c}): type=${cell.type}`);
          }
        }
      }
    }

    const visCheck = CristalesVisual.verifyMatches(State.grid);
    if (!visCheck.valid) {
      hasDiscrepancy = true;
      discrepancyDetails.push(...visCheck.errors);
    }

    const isDebug = typeof window !== 'undefined' && window.location && window.location.search.includes('debug=1');
    if (hasDiscrepancy) {
      console.error('[Cristales Desincronización] Discrepancia detectada en tablero:', discrepancyDetails);
      if (isDebug) {
        window.ArcadeJuice?.spawnFloat('Ajuste de sincronización', CONFIG.VIRTUAL_W / 2, 120, '#eab308', 16);
      }
    } else if (isDebug) {
      console.log('[Cristales Debug] Sincronización tablero verificada: OK (0 celdas desincronizadas).');
    }

    return !hasDiscrepancy;
  }

  function resolveCascadeAnimated() {
    State.isCascading = true;

    let speedMul = 1.0 + Math.min(1.2, (State.comboCount - 1) * 0.18);
    if (State.options.fastAnim) speedMul *= 1.8;

    const step = CristalesLogic.stepCascade(State.grid, State.iceGrid);

    if (!step.hasMatches) {
      if (CristalesLogic.hasEmptyCells(State.grid)) {
        CristalesLogic.applyGravity(State.grid);
        refillEmptyCells(State.grid);
        CristalesVisual.syncFromLogical(State.grid);
        setTimeout(resolveCascadeAnimated, 120);
        return;
      }

      State.isSwapping = false;
      State.isCascading = false;
      State.comboCount = 1;
      if (dom.comboPill) dom.comboPill.classList.add('hidden');

      transformShifters();
      verifyBoardSync();
      checkLevelState();

      // Procesar movimiento en cola si el jugador ingresó uno mientras animaba
      if (State.queuedMove) {
        const m = State.queuedMove;
        State.queuedMove = null;
        if (CristalesLogic.isValidSwap(State.grid, m.r1, m.c1, m.r2, m.c2)) {
          executeSwapAnimated(m.r1, m.c1, m.r2, m.c2);
        }
      }
      return;
    }

    // Puntuación
    const earned = step.scoreEarned * State.comboCount;
    State.score += earned;

    if (State.comboCount > 1) {
      if (dom.comboPill) {
        dom.comboPill.classList.remove('hidden');
        dom.comboMultiplier.textContent = State.comboCount;
      }
      window.ArcadeJuice?.spawnFloat(`COMBO x${State.comboCount}! +${earned}`, CONFIG.VIRTUAL_W / 2, 220, '#ffcc00', 14);
      playAudio('cascade');
      window.ArcadeJuice?.shake(3, 0.15);
      if (State.comboCount >= 3) {
        State.cameraZoom = 1.04;
      }
    } else {
      playAudio('match');
    }

    // Partículas por cada celda eliminada
    const cs = CONFIG.VIRTUAL_W / CONFIG.COLS;
    for (const cell of step.eliminatedCells) {
      const gData = CONFIG.GEMS[cell.type - 1] || CONFIG.GEMS[0];
      spawnParticles(cell.c * cs + cs / 2, cell.r * cs + cs / 2, gData.base, 8);
    }

    // Efectos de piezas especiales activadas
    for (const act of step.activatedSpecials) {
      if (act.special === CONFIG.SPECIALS.LINE_H) {
        spawnBeam(act.r, act.c, 'H');
        playAudio('special_laser');
      } else if (act.special === CONFIG.SPECIALS.LINE_V) {
        spawnBeam(act.r, act.c, 'V');
        playAudio('special_laser');
      } else if (act.special === CONFIG.SPECIALS.BOMB) {
        spawnShockwave(act.c * cs + cs / 2, act.r * cs + cs / 2);
        playAudio('special_bomb');
      }
    }

    State.comboCount++;
    window.ArcadeJuice?.vibrate(10);

    // Reproducir paso animado con tweens
    CristalesVisual.animateCascadeStep(step, speedMul, () => {
      resolveCascadeAnimated();
    });
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

    dom.resultIcon.innerHTML = window.ArcadeIcons ? window.ArcadeIcons.get('star', { size: 36 }) : '';
    dom.resultTitle.textContent = 'Nivel superado';
    dom.resultSubtitle.textContent = 'Objetivo completado con éxito.';
    dom.resultScoreVal.textContent = State.score.toLocaleString();
    dom.resultBestVal.textContent = lvl.targetScore.toLocaleString();

    const starSvg = window.ArcadeIcons ? window.ArcadeIcons.get('star', { size: 20 }) : '';
    dom.starsRow.innerHTML = `
      <span class="star-slot ${stars >= 1 ? 'filled' : 'empty'}">${starSvg}</span>
      <span class="star-slot ${stars >= 2 ? 'filled' : 'empty'}">${starSvg}</span>
      <span class="star-slot ${stars >= 3 ? 'filled' : 'empty'}">${starSvg}</span>
    `;

    dom.overlayResult.classList.remove('hidden');
  }

  function triggerLevelDefeat() {
    stopBGM();
    State.saveData.lives = Math.max(0, State.saveData.lives - 1);
    State.saveData.lastLifeTimestamp = Date.now();
    saveGameData();
    updateLivesSystem();

    dom.resultIcon.innerHTML = window.ArcadeIcons ? window.ArcadeIcons.get('heartBroken', { size: 36 }) : '';
    dom.resultTitle.textContent = 'Fin de movimientos';
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
    if (dom.btnPowerupHammer) dom.btnPowerupHammer.classList.remove('active');

    // Romper gema o casilla
    State.grid[r][c] = { type: 0, special: CONFIG.SPECIALS.NONE, obstacle: CONFIG.OBSTACLES.NONE };
    State.iceGrid[r][c] = 0;
    playAudio('special_bomb');
    window.ArcadeJuice?.shake(6, 0.2);
    window.ArcadeJuice?.spawnFloat('¡MARTILLO!', CONFIG.VIRTUAL_W / 2, 200, '#00d2ff', 13);
    const cs = CONFIG.VIRTUAL_W / CONFIG.COLS;
    spawnParticles(c * cs + cs / 2, r * cs + cs / 2, '#ffffff', 12);
    CristalesVisual.syncFromLogical(State.grid);

    resolveCascadeAnimated();
  }

  function applyFreeSwap(r1, c1, r2, c2) {
    if (State.saveData.powerups.swap <= 0) return;
    State.saveData.powerups.swap--;
    updatePowerupCounts();
    saveGameData();

    State.activePowerupTool = null;
    if (dom.btnPowerupSwap) dom.btnPowerupSwap.classList.remove('active');
    State.selectedCell = null;

    const speedMul = State.options.fastAnim ? 1.8 : 1.0;
    CristalesVisual.animateSwap(r1, c1, r2, c2, true, speedMul, () => {
      const temp = State.grid[r1][c1];
      State.grid[r1][c1] = State.grid[r2][c2];
      State.grid[r2][c2] = temp;

      playAudio('swap');
      window.ArcadeJuice?.vibrate(14);
      window.ArcadeJuice?.spawnFloat('¡INTERCAMBIO LIBRE!', CONFIG.VIRTUAL_W / 2, 200, '#ffbb00', 13);

      resolveCascadeAnimated();
    });
  }

  function applyShufflePowerup() {
    if (State.isSwapping || State.isCascading) return;
    if (State.saveData.powerups.shuffle <= 0) return;
    State.saveData.powerups.shuffle--;
    updatePowerupCounts();
    saveGameData();

    CristalesLogic.shuffleUntilValid(State.grid, CONFIG.NUM_GEM_TYPES);
    playAudio('special_prism');
    window.ArcadeJuice?.shake(5, 0.2);
    window.ArcadeJuice?.spawnFloat('¡MEZCLA CÓSMICA!', CONFIG.VIRTUAL_W / 2, 200, '#00e5ff', 13);
    const speedMul = State.options.fastAnim ? 1.8 : 1.0;
    CristalesVisual.animateBoardFill(State.grid, speedMul, () => {
      verifyBoardSync();
    });
  }

  // ==========================================
  // PRE-RENDERIZADO DE ATLAS Y FONDO CACHEADO
  // ==========================================
  function renderGemOffscreen(ctx, cx, cy, r, gData) {
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = gData.base;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = gData.facet;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.5);
    ctx.lineTo(r * 0.5, -r * 0.5);
    ctx.lineTo(0, -r * 0.85);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = gData.dark;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, r * 0.5);
    ctx.lineTo(r * 0.5, r * 0.5);
    ctx.lineTo(0, r * 0.85);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function renderRuneOffscreen(ctx, cx, cy, r) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(-r, -r, r * 2, r * 2, 6);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.font = `${Math.round(r * 0.9)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ᚱ', 0, 0);
    ctx.restore();
  }

  function renderPrismOffscreen(ctx, cx, cy, r) {
    ctx.save();
    ctx.translate(cx, cy);
    const rainGrad = ctx.createLinearGradient(-r, -r, r, r);
    rainGrad.addColorStop(0, '#ff0055');
    rainGrad.addColorStop(0.3, '#ffaa00');
    rainGrad.addColorStop(0.6, '#00e5ff');
    rainGrad.addColorStop(1, '#b388ff');
    ctx.fillStyle = rainGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function initAtlas(cellSize) {
    if (typeof document === 'undefined') return null;
    const atlas = {};
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = Math.round(cellSize * dpr);

    CONFIG.GEMS.forEach(g => {
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const ctx = c.getContext('2d');
      ctx.scale(dpr, dpr);
      renderGemOffscreen(ctx, cellSize / 2, cellSize / 2, cellSize * 0.42, g);
      atlas[`gem_${g.id}`] = c;
    });

    const cRune = document.createElement('canvas');
    cRune.width = size;
    cRune.height = size;
    const ctxRune = cRune.getContext('2d');
    ctxRune.scale(dpr, dpr);
    renderRuneOffscreen(ctxRune, cellSize / 2, cellSize / 2, cellSize * 0.42);
    atlas['obstacle_locked'] = cRune;

    const cPrism = document.createElement('canvas');
    cPrism.width = size;
    cPrism.height = size;
    const ctxPrism = cPrism.getContext('2d');
    ctxPrism.scale(dpr, dpr);
    renderPrismOffscreen(ctxPrism, cellSize / 2, cellSize / 2, cellSize * 0.42);
    atlas['special_prism'] = cPrism;

    gemAtlas = atlas;
    return atlas;
  }

  function cacheStaticBackground(W, H, world) {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');

    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, world.bgTop);
    bgGrad.addColorStop(1, world.bgBottom);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    const cs = W / 8;
    for (let r = 0; r < 8; r++) {
      for (let col = 0; col < 8; col++) {
        const x = col * cs;
        const y = r * cs;
        ctx.fillStyle = (r + col) % 2 === 0 ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
      }
    }

    cachedBgCanvas = c;
    return c;
  }

  function drawSprite(ctx, s, cellSize) {
    if (!s || s.alpha <= 0.001 || s.scale <= 0.001) return;
    const r = cellSize * 0.42;

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rotation);
    ctx.scale(s.scale * s.scaleX, s.scale * s.scaleY);
    ctx.globalAlpha = Math.max(0, Math.min(1, s.alpha));

    if (s.brightness > 1.05) {
      ctx.filter = `brightness(${s.brightness.toFixed(2)})`;
    }

    // Dibujar base desde atlas offscreen
    if (s.obstacle === CONFIG.OBSTACLES.LOCKED) {
      if (gemAtlas && gemAtlas['obstacle_locked']) {
        ctx.drawImage(gemAtlas['obstacle_locked'], -cellSize/2, -cellSize/2, cellSize, cellSize);
      } else {
        renderRuneOffscreen(ctx, 0, 0, r);
      }
    } else if (s.special === CONFIG.SPECIALS.COLOR_BOMB) {
      if (gemAtlas && gemAtlas['special_prism']) {
        ctx.drawImage(gemAtlas['special_prism'], -cellSize/2, -cellSize/2, cellSize, cellSize);
      } else {
        renderPrismOffscreen(ctx, 0, 0, r);
      }
    } else if (gemAtlas && gemAtlas[`gem_${s.type}`]) {
      ctx.drawImage(gemAtlas[`gem_${s.type}`], -cellSize/2, -cellSize/2, cellSize, cellSize);
    } else {
      renderGemOffscreen(ctx, 0, 0, r, CONFIG.GEMS[s.type - 1] || CONFIG.GEMS[0]);
    }

    // Reflejo periódico de faceta
    const sweep = ((Date.now() * 0.0018 + s.shinePhase) % 3.0) - 1.5;
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-r * 2 + sweep * r * 2, -r);
    ctx.lineTo(r + sweep * r * 2, r * 2);
    ctx.stroke();
    ctx.restore();

    // Iconos de piezas especiales
    if (s.special === CONFIG.SPECIALS.LINE_H) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-r * 0.8, -2, r * 1.6, 4);
      ctx.fillStyle = '#00d2ff';
      ctx.fillRect(-r * 0.8, -1, r * 1.6, 2);
    } else if (s.special === CONFIG.SPECIALS.LINE_V) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -r * 0.8, 4, r * 1.6);
      ctx.fillStyle = '#00d2ff';
      ctx.fillRect(-1, -r * 0.8, 2, r * 1.6);
    } else if (s.special === CONFIG.SPECIALS.BOMB) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff3366';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cadenas
    if (s.obstacle === CONFIG.OBSTACLES.CHAINS) {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, -r * 0.7);
      ctx.lineTo(r * 0.7, r * 0.7);
      ctx.moveTo(-r * 0.7, r * 0.7);
      ctx.lineTo(r * 0.7, -r * 0.7);
      ctx.stroke();
    }

    // Shifter
    if (s.obstacle === CONFIG.OBSTACLES.SHIFTER) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-r * 0.5, -r * 0.5, r, r);
    }

    ctx.restore();
  }

  // ==========================================
  // RENDERIZADO VECTORIAL DE CRISTALES Y MUNDOS
  // ==========================================
  function render() {
    if (!dom.ctx) return;
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

    if (State.cameraZoom > 1.0) {
      const zoom = State.cameraZoom;
      ctx.translate(W / 2, H / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-W / 2, -H / 2);
      State.cameraZoom += (1.0 - State.cameraZoom) * 0.08;
    }

    // Fondo cacheado
    if (cachedBgCanvas) {
      ctx.drawImage(cachedBgCanvas, 0, 0);
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, currentWorld.bgTop);
      bgGrad.addColorStop(1, currentWorld.bgBottom);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);
    }

    // Partículas ambientales del mundo
    if (!PerfTuner.lowQualityMode) {
      ctx.save();
      for (const p of State.bgParticles) {
        ctx.fillStyle = currentWorld.accent;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Capa de hielo en celdas
    const cs = W / 8;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (State.iceGrid[r][c] > 0) {
          const x = c * cs;
          const y = r * cs;
          ctx.fillStyle = 'rgba(0, 229, 255, 0.28)';
          ctx.fillRect(x + 2, y + 2, cs - 4, cs - 4);
          ctx.strokeStyle = '#00e5ff';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 2, y + 2, cs - 4, cs - 4);
        }
      }
    }

    // Resaltado de celda seleccionada y vecinos
    if (State.selectedCell) {
      const sr = State.selectedCell.r;
      const sc = State.selectedCell.c;
      const sx = sc * cs + cs / 2;
      const sy = sr * cs + cs / 2;

      ctx.save();
      ctx.strokeStyle = '#ffe066';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx, sy, cs * 0.46, 0, Math.PI * 2);
      ctx.stroke();

      const neighbors = [[sr - 1, sc], [sr + 1, sc], [sr, sc - 1], [sr, sc + 1]];
      ctx.strokeStyle = 'rgba(255, 224, 102, 0.35)';
      ctx.lineWidth = 2;
      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          ctx.strokeRect(nc * cs + 3, nr * cs + 3, cs - 6, cs - 6);
        }
      }
      ctx.restore();
    }

    // Dibujar sprites del tablero (visualGrid)
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const s = CristalesVisual.visualGrid[r][c];
        if (s) {
          drawSprite(ctx, s, cs);
        }
      }
    }

    // Dibujar sprites transitorios
    for (const s of CristalesVisual.transientSprites) {
      drawSprite(ctx, s, cs);
    }

    // Dibujar efectos de rayos (Line clears)
    for (let i = 0; i < beamsPool.length; i++) {
      const b = beamsPool[i];
      if (b.active) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, b.life / b.maxLife);
        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 12;
        if (b.orientation === 'H') {
          ctx.fillRect(0, b.r * cs + cs / 2 - 4, W, 8);
        } else {
          ctx.fillRect(b.c * cs + cs / 2 - 4, 0, 8, H);
        }
        ctx.restore();
      }
    }

    // Dibujar ondas de choque (Bomb clears)
    for (let i = 0; i < shockwavesPool.length; i++) {
      const sw = shockwavesPool[i];
      if (sw.active) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, sw.life / sw.maxLife);
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Dibujar partículas
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = particlePool[i];
      if (p.active) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Textos flotantes
    window.ArcadeJuice?.drawFloats(ctx);

    // Overlay de rendimiento (?debug=1)
    const isDebug = typeof window !== 'undefined' && window.location && window.location.search.includes('debug=1');
    if (isDebug) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(8, 8, 200, 82);
      ctx.fillStyle = PerfTuner.fps >= 55 ? '#00ff88' : '#ff3366';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`FPS: ${PerfTuner.fps} (${PerfTuner.lowQualityMode ? 'LOW' : 'HIGH'})`, 14, 24);
      ctx.fillStyle = '#ffffff';
      const tweenEngine = typeof ArcadeTween !== 'undefined' ? ArcadeTween : window.ArcadeTween;
      const tweenCount = tweenEngine ? tweenEngine.activeCount : 0;
      ctx.fillText(`Tweens activos: ${tweenCount}`, 14, 40);
      let activeSprites = 0;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (CristalesVisual.visualGrid[r][c]) activeSprites++;
        }
      }
      ctx.fillText(`Sprites: ${activeSprites + CristalesVisual.transientSprites.length}`, 14, 56);
      const syncRes = CristalesVisual.verifyMatches(State.grid);
      ctx.fillStyle = syncRes.valid ? '#00ff88' : '#ff0055';
      ctx.fillText(`Sync lógica/visual: ${syncRes.valid ? 'OK 100%' : 'DESYNC!'}`, 14, 72);
      ctx.restore();
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

    PerfTuner.update(timestamp);

    const tweenEngine = typeof ArcadeTween !== 'undefined' ? ArcadeTween : window.ArcadeTween;
    if (tweenEngine) tweenEngine.update(dt);

    window.ArcadeJuice?.update(dt);
    updateLivesSystem();

    // Actualización de rayos y ondas
    for (let i = 0; i < beamsPool.length; i++) {
      if (beamsPool[i].active) {
        beamsPool[i].life -= dt;
        if (beamsPool[i].life <= 0) beamsPool[i].active = false;
      }
    }
    for (let i = 0; i < shockwavesPool.length; i++) {
      if (shockwavesPool[i].active) {
        shockwavesPool[i].radius += 240 * dt;
        shockwavesPool[i].life -= dt;
        if (shockwavesPool[i].life <= 0) shockwavesPool[i].active = false;
      }
    }

    // Actualización de partículas
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = particlePool[i];
      if (p.active) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) p.active = false;
      }
    }

    // Interpolación suave del puntaje en pantalla
    if (dom.scoreVal) {
      if (Math.abs(State.displayedScore - State.score) > 0.5) {
        State.displayedScore += (State.score - State.displayedScore) * Math.min(1, dt * 10);
        dom.scoreVal.textContent = Math.round(State.displayedScore).toLocaleString();
      } else {
        State.displayedScore = State.score;
        dom.scoreVal.textContent = State.score.toLocaleString();
      }
    }

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
      if (State.isSwapping || State.isCascading) return;
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
      if (State.isSwapping || State.isCascading) return;
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
      const starIconSmall = window.ArcadeIcons ? window.ArcadeIcons.get('star', { size: 10 }) : '';
      const starsHtml = isUnlocked && stars > 0 ? Array(stars).fill(starIconSmall).join('') : '';
      badge.innerHTML = `
        <span class="level-num">${lvlNum}</span>
        <span class="level-stars">${starsHtml}</span>
      `;

      if (isUnlocked) {
        badge.addEventListener('click', () => startLevel(lvlIndex));
      }

      dom.levelsGrid.appendChild(badge);
    }
  }

  function renderAchievementsModal() {
    const list = [
      { id: 'ach_first_level', title: 'Primer Prisma', desc: 'Supera el nivel 1 de campaña', iconName: 'gem' },
      { id: 'ach_world_clear', title: 'Maestro del Mundo', desc: 'Completa los 10 niveles de un mundo', iconName: 'map' },
      { id: 'ach_combo5', title: 'Combo Quíntuple', desc: 'Desata una reacción de Cascada x5', iconName: 'zap' },
      { id: 'ach_color_bomb', title: 'Bomba de Color', desc: 'Activa un Prisma de Color de 5 gemas', iconName: 'spark' },
      { id: 'ach_fusion', title: 'Fusión Especial', desc: 'Combina dos cristales especiales adyacentes', iconName: 'energy' },
      { id: 'ach_endless_10k', title: 'Brillo Perpetuo', desc: 'Alcanza 10,000 pts en Modo Infinito', iconName: 'clock' },
      { id: 'ach_stars_30', title: 'Coleccionista de Estrellas', desc: 'Acumula 30 estrellas en la campaña', iconName: 'star' },
      { id: 'ach_hammer', title: 'Artífice de Cuarzo', desc: 'Usa un Martillo de Cuarzo con éxito', iconName: 'hammer' }
    ];

    dom.achList.innerHTML = '';
    list.forEach(ach => {
      const unlocked = window.ArcadeJuice?.hasAchievement('cristales', ach.id);
      const row = document.createElement('div');
      row.className = `ach-item ${unlocked ? 'unlocked' : ''}`;
      const iconHtml = unlocked
        ? (window.ArcadeIcons ? window.ArcadeIcons.get(ach.iconName, { size: 18 }) : '')
        : (window.ArcadeIcons ? window.ArcadeIcons.get('lock', { size: 18 }) : '');
      row.innerHTML = `
        <span class="ach-icon">${iconHtml}</span>
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
      if (dom.optFastAnim) dom.optFastAnim.checked = State.options.fastAnim;
      dom.modalOptions.classList.remove('hidden');
    });
    dom.btnCloseOptions.addEventListener('click', () => {
      window.ArcadeJuice?.setOption('sfx', dom.optSfx.checked);
      window.ArcadeJuice?.setOption('bgm', dom.optBgm.checked);
      window.ArcadeJuice?.setOption('vibration', dom.optVibration.checked);
      window.ArcadeJuice?.setOption('contrast', dom.optContrast.checked);
      if (dom.optFastAnim) State.options.fastAnim = dom.optFastAnim.checked;

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
    initAtlas(CONFIG.VIRTUAL_W / CONFIG.COLS);
    loadGameData();
    setupInputs();
    setupUI();
    renderWorldMap(1);

    if (typeof window !== 'undefined') {
      window.verifyBoardSync = verifyBoardSync;
      window.CristalesState = State;
      window.CristalesLogic = CristalesLogic;
      window.CristalesVisual = CristalesVisual;
      window.GemVisualSprite = GemVisualSprite;
      window.CristalesVisualManager = CristalesVisualManager;
    }

    requestAnimationFrame(gameLoop);
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', init);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      CONFIG,
      CristalesLogic,
      CristalesVisualManager,
      CristalesVisual,
      GemVisualSprite,
      State
    };
  }
})();
