/**
 * games/lumen/game.js - Lumen Arcade 80s (v2.0)
 * Laberinto de luz y persecución con 30 niveles en 5 mundos temáticos, 7 criaturas con IA única,
 * jefes con ataques telegrafiados, apagón clímax, sistema de mejoras entre niveles, renderizado offscreen
 * de alto rendimiento y controles con búfer de giro.
 */
(() => {
  'use strict';

  // ==========================================
  // CONFIGURACIÓN Y CONSTANTES DE BALANCE
  // ==========================================
  const CONFIG = {
    COLS: 15,
    ROWS: 19,
    VIRTUAL_W: 330,
    VIRTUAL_H: 418, // 15x22 y 19x22
    BASE_PLAYER_SPEED: 4.4, // Celdas por segundo
    CREATURE_BASE_SPEED: 3.4,
    CREATURE_DARK_BOOST: 1.25, // Criaturas más rápidas en la oscuridad
    FLEE_SPEED: 2.8,

    PLAYER_LIGHT_RADIUS: 2.0,
    LANTERN_MAX_LIGHT_RADIUS: 3.8,
    LANTERN_DECAY_RATE: 0.05, // Radio consumido por segundo si no se mantiene
    SPARK_LIGHT_RADIUS: 2.6,
    SPARK_DURATION: 7.0, // Segundos activa
    SPARK_RECHARGE_TIME: 14.0,
    FLASH_DURATION: 5.0,
    FLASH_COOLDOWN: 24.0,

    MAX_SPARKS: 2,
    STARTING_LIVES: 3,
    STORAGE_KEY_PREFIX: 'lumen:v2',
    STORAGE_KEY_V1: 'lumen:v1',

    WORLDS: [
      { id: 1, name: 'Bosque Sombrío', color: '#00ff88', glow: 'rgba(0, 255, 136, 0.3)', rule: 'Niebla densa y ramas vivas', boss: 'Espíritu de las Ramas' },
      { id: 2, name: 'Cripta Olvidada', color: '#00f0ff', glow: 'rgba(0, 240, 255, 0.3)', rule: 'Puertas rúnicas y llaves doradas', boss: 'Gólem de Tumba' },
      { id: 3, name: 'Mina de Obsidiana', color: '#ffaa00', glow: 'rgba(255, 170, 0, 0.3)', rule: 'Trampas solares y reliquias', boss: 'Monolito de Carbón' },
      { id: 4, name: 'Ciudad Espectral', color: '#88aaff', glow: 'rgba(136, 170, 255, 0.3)', rule: 'Interruptores y losetas móviles', boss: 'Arconte Sombrío' },
      { id: 5, name: 'Abismo Primordial', color: '#ff007f', glow: 'rgba(255, 0, 127, 0.3)', rule: 'Oscuridad voraz y jefes', boss: 'Devorador de Luz' }
    ],

    CREATURE_TYPES: [
      { id: 1, name: 'Acechador', desc: 'Caza en la sombra y huye de la luz', shape: 'diamond', color: '#ff0055' },
      { id: 2, name: 'Divisor', desc: 'Se divide en dos mini-sombras al ser destellado', shape: 'double-tri', color: '#ff5500' },
      { id: 3, name: 'Emisor', desc: 'Deja una estela que apaga la luz temporalmente', shape: 'pentagon', color: '#aa00ff' },
      { id: 4, name: 'Tímido', desc: 'Solo avanza cuando no lo miras de frente', shape: 'gazer', color: '#00e5ff' },
      { id: 5, name: 'Tragaluz', desc: 'Patrulla buscando faroles para apagarlos', shape: 'square', color: '#ffff00' },
      { id: 6, name: 'Fantasma', desc: 'Atraviesa un muro delgado cada 8 segundos', shape: 'spiral', color: '#ffffff' },
      { id: 7, name: 'Coloso', desc: 'Acorazado e inmune a la luz de los faroles', shape: 'colossus', color: '#ff2200' }
    ],

    UPGRADES: [
      { id: 'LANTERN_BOOST', icon: '🏮', name: 'Linterna Ampliada', desc: '+25% radio de luz del jugador' },
      { id: 'EXTRA_SPARK', icon: '✨', name: 'Chispa Adicional', desc: '+1 slot de chispa máxima transportable' },
      { id: 'SPEED_BOOTS', icon: '👟', name: 'Zancada Veloz', desc: '+15% velocidad de movimiento del farolero' },
      { id: 'FAST_FLASH', icon: '⚡', name: 'Batería Solar', desc: '-30% tiempo de recarga del Destello' },
      { id: 'OIL_RESERVE', icon: '🛢️', name: 'Reserva de Aceite', desc: 'Los faroles tardan 50% más en apagarse' },
      { id: 'AURA_WARD', icon: '🛡️', name: 'Aura de Rechazo', desc: 'Las criaturas en el haz de luz se frenan 35%' }
    ],

    ACHIEVEMENTS: [
      { id: 'FIRST_LIGHT', icon: '🏮', title: 'Primera Lumbre', desc: 'Enciende tu primer farol en el laberinto' },
      { id: 'SPARK_MASTER', icon: '✨', title: 'Chispazo Táctico', desc: 'Ahuyenta a una criatura con una chispa' },
      { id: 'SOLAR_FLASH', icon: '⚡', title: 'Destello Heroico', desc: 'Salva tu vida con el Destello de Emergencia' },
      { id: 'SPEED_CLEAR', icon: '⏱️', title: 'Velocidad Luminosa', desc: 'Completa un nivel en menos de 30 segundos' },
      { id: 'TRAP_CAUGHT', icon: '☀️', title: 'Trampa Solar', desc: 'Atrapa a una criatura en una trampa de luz' },
      { id: 'RELIC_HUNTER', icon: '💎', title: 'Coleccionista Arcano', desc: 'Recoge 5 reliquias de luz' },
      { id: 'BOSS_BRANCH', icon: '🌿', title: 'Guardián del Bosque', desc: 'Derrota al Espíritu de las Ramas en Nv 6' },
      { id: 'BOSS_GOLEM', icon: '🗿', title: 'Rompe-Tumbas', desc: 'Supera al Gólem de Tumba en Nv 12' },
      { id: 'PERFECT_LIGHT', icon: '🌟', title: 'Luz Impecable', desc: 'Consigue 3 estrellas en cualquier nivel' },
      { id: 'ABYSS_CONQUEROR', icon: '🔱', title: 'Vencedor del Abismo', desc: 'Supera los 30 niveles de campaña' }
    ],

    // 30 NIVELES DEFINIDOS COMO DATOS (15x19)
    LEVELS: (() => {
      const baseTemplates = [
        // 0: Anillo clásico con faroles perimetrales e interiores (8 faroles)
        [
          "###############",
          "#L.....L.....L#",
          "#.###.###.###.#",
          "#.###.###.###.#",
          "#....L###L....#",
          "#.##..###..##.#",
          "#.##..###..##.#",
          "#.............#",
          "#......E......#",
          "T.............T",
          "#.............#",
          "#......P......#",
          "#.###.###.###.#",
          "#.###.###.###.#",
          "#......L......#",
          "#.####...####.#",
          "#.####...####.#",
          "#L...........L#",
          "###############"
        ],
        // 1: Claustro con faroles en cruz (7 faroles)
        [
          "###############",
          "#L...........L#",
          "#.####...####.#",
          "#.####...####.#",
          "#......L......#",
          "#.##..###..##.#",
          "#.##..###..##.#",
          "#.##.......##.#",
          "#......E......#",
          "T.............T",
          "#......L......#",
          "#......P......#",
          "#.##..###..##.#",
          "#.##..###..##.#",
          "#......L......#",
          "#.####...####.#",
          "#.####...####.#",
          "#L...........L#",
          "###############"
        ],
        // 2: Cripta con galerías laterales (8 faroles)
        [
          "###############",
          "#L...........L#",
          "#.##.#####.##.#",
          "#.##.#####.##.#",
          "#.##.......##.#",
          "#......L......#",
          "#.####...####.#",
          "#.####...####.#",
          "#......E......#",
          "T.............T",
          "#.............#",
          "#L.....P.....L#",
          "#.####...####.#",
          "#.####...####.#",
          "#......L......#",
          "#.##.#####.##.#",
          "#.##.#####.##.#",
          "#L##.......##L#",
          "###############"
        ],
        // 3: Pasillos simétricos con recámaras (7 faroles)
        [
          "###############",
          "#L.....L.....L#",
          "#.###.###.###.#",
          "#.###.###.###.#",
          "#......L......#",
          "#..###...###..#",
          "#..###...###..#",
          "#L....#.#....L#",
          "#.....#E#.....#",
          "T.............T",
          "#.............#",
          "#......P......#",
          "#..###...###..#",
          "#..###...###..#",
          "#......L......#",
          "#.###.###.###.#",
          "#.###.###.###.#",
          "#L...........L#",
          "###############"
        ],
        // 4: Encrucijada en rombo (8 faroles)
        [
          "###############",
          "#L.....L.....L#",
          "#.###.....###.#",
          "#.###.....###.#",
          "#.###.....###.#",
          "#.....###.....#",
          "#.##..###..##.#",
          "#.##..###..##.#",
          "#......E......#",
          "T.............T",
          "#.L.........L.#",
          "#......P......#",
          "#.##..###..##.#",
          "#.##..###..##.#",
          "#.....###.....#",
          "#.###.....###.#",
          "#.###.....###.#",
          "#L###..L..###L#",
          "###############"
        ],
        // 5: Cámara con pilares aislados (8 faroles)
        [
          "###############",
          "#L...........L#",
          "#.##.##.##.##.#",
          "#.##.##.##.##.#",
          "#..L...L...L..#",
          "#.##.##.##.##.#",
          "#.##.##.##.##.#",
          "#.............#",
          "#......E......#",
          "T.............T",
          "#.............#",
          "#......P......#",
          "#.##.##.##.##.#",
          "#.##.##.##.##.#",
          "#..L...L...L..#",
          "#.##.##.##.##.#",
          "#.##.##.##.##.#",
          "#L...........L#",
          "###############"
        ]
      ];

      const LEVEL_NAMES = [
        "El Atrio Oscuro", "Claustro de Hojas", "Senda de Espinas", "Coto de Sombras", "Paso de la Bruma", "Espíritu de las Ramas",
        "Cripta de Piedra", "Catacumba Rúnica", "Galería Ciega", "Sepulcro Ancestral", "Cámara del Sello", "Gólem de Tumba",
        "Túnel de Vastedad", "Pozo de Carbón", "Encrucijada Ámbar", "Roca Hueca", "Socavón Silencioso", "Monolito de Carbón",
        "Avenida Espectral", "Plaza de Niebla", "Torreón Derruido", "Pasadizo Velado", "Bastión de Sombras", "Arconte Sombrío",
        "Umbral del Vacío", "Grieta de Penumbra", "Vórtice Negro", "Fosa Infinita", "Cuna de la Noche", "Devorador de Luz"
      ];

      const levels = [];
      for (let i = 1; i <= 30; i++) {
        const world = Math.ceil(i / 6);
        const isBoss = (i % 6 === 0);
        const templateIdx = (i - 1) % baseTemplates.length;
        const map = baseTemplates[templateIdx].map(r => r.split(''));

        // Variaciones interactivas por mundo sin destruir faroles 'L'
        if (world === 2) {
          if (map[1][6] === '.') map[1][6] = 'K'; // Llave
          if (map[7][7] === '.') map[7][7] = 'D'; // Puerta rúnica
        } else if (world === 3) {
          if (map[4][6] === '.') map[4][6] = 'X'; // Trampa de luz
          if (map[13][6] === '.') map[13][6] = 'R'; // Reliquia
        } else if (world === 4) {
          if (map[10][4] === '.') map[10][4] = 'S'; // Interruptor
          if (map[7][7] === '.') map[7][7] = 'D'; // Puerta
          if (map[10][10] === '.') map[10][10] = 'X'; // Trampa
        } else if (world === 5) {
          if (map[4][6] === '.') map[4][6] = 'X';
          if (map[1][6] === '.') map[1][6] = 'K';
          if (map[7][7] === '.') map[7][7] = 'D';
          if (map[13][6] === '.') map[13][6] = 'R';
        }

        const mapStrings = map.map(row => row.join(''));
        const lvlObj = {
          id: i,
          world,
          name: LEVEL_NAMES[i - 1],
          map: mapStrings
        };

        if (isBoss) {
          lvlObj.isBoss = true;
          lvlObj.bossName = LEVEL_NAMES[i - 1];
          lvlObj.bossHp = 4 + (world * 2);
        }

        levels.push(lvlObj);
      }
      return levels;
    })()
  };

  // ==========================================
  // LÓGICA PURA Y SIMULACIÓN (Testeable en Node)
  // ==========================================
  const LumenLogic = {
    /**
     * Parsea un mapa a matrices numéricas e identifica entidades
     */
    parseMap(mapRows) {
      const rows = mapRows.length;
      const cols = mapRows[0].length;
      const grid = new Array(rows);
      const lanterns = [];
      let playerStart = null;
      const enemySpawns = [];
      const tunnels = [];
      const keys = [];
      const doors = [];
      const switches = [];
      const relics = [];
      const traps = [];

      for (let r = 0; r < rows; r++) {
        grid[r] = new Array(cols);
        for (let c = 0; c < cols; c++) {
          const ch = mapRows[r][c];
          if (ch === '#') {
            grid[r][c] = 1; // Muro
          } else {
            grid[r][c] = 0; // Pasillo transitable

            if (ch === 'L') {
              lanterns.push({ r, c, lit: false, radius: 0, offTimer: 0 });
            } else if (ch === 'P') {
              playerStart = { r, c };
            } else if (ch === 'E') {
              enemySpawns.push({ r, c });
            } else if (ch === 'T') {
              tunnels.push({ r, c });
            } else if (ch === 'K') {
              keys.push({ r, c, collected: false });
            } else if (ch === 'D') {
              doors.push({ r, c, open: false });
            } else if (ch === 'S') {
              switches.push({ r, c, active: false });
            } else if (ch === 'R') {
              relics.push({ r, c, collected: false });
            } else if (ch === 'X') {
              traps.push({ r, c, active: true });
            }
          }
        }
      }

      return {
        rows,
        cols,
        grid,
        lanterns,
        playerStart: playerStart || { r: 11, c: 7 },
        enemySpawns: enemySpawns.length > 0 ? enemySpawns : [{ r: 9, c: 7 }],
        tunnels,
        keys,
        doors,
        switches,
        relics,
        traps
      };
    },

    /**
     * Retorna vecinos transitables considerando túneles de envoltura lateral
     */
    getNeighbors(grid, r, c) {
      const rows = grid.length;
      const cols = grid[0].length;
      const neighbors = [];
      const dr = [-1, 1, 0, 0];
      const dc = [0, 0, -1, 1];

      for (let i = 0; i < 4; i++) {
        let nr = r + dr[i];
        let nc = c + dc[i];

        // Túnel lateral wrap-around
        if (nc < 0 && grid[r][cols - 1] === 0) nc = cols - 1;
        else if (nc >= cols && grid[r][0] === 0) nc = 0;

        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          if (grid[nr][nc] === 0) {
            neighbors.push({ r: nr, c: nc });
          }
        }
      }
      return neighbors;
    },

    /**
     * Búsqueda en anchura (BFS) para la ruta más corta
     */
    findPath(grid, startR, startC, targetR, targetC) {
      if (startR === targetR && startC === targetC) return [];

      const queue = [{ r: startR, c: startC }];
      const visited = new Set();
      const parent = new Map();

      const startKey = `${startR},${startC}`;
      visited.add(startKey);

      let found = false;

      while (queue.length > 0) {
        const curr = queue.shift();
        if (curr.r === targetR && curr.c === targetC) {
          found = true;
          break;
        }

        const neighbors = this.getNeighbors(grid, curr.r, curr.c);
        for (const n of neighbors) {
          const key = `${n.r},${n.c}`;
          if (!visited.has(key)) {
            visited.add(key);
            parent.set(key, curr);
            queue.push(n);
          }
        }
      }

      if (!found) return null;

      const path = [];
      let curr = { r: targetR, c: targetC };
      while (curr.r !== startR || curr.c !== startC) {
        path.push(curr);
        const pKey = `${curr.r},${curr.c}`;
        curr = parent.get(pKey);
      }
      path.reverse();
      return path;
    },

    /**
     * Comprueba si el laberinto es conexo
     */
    isMazeConnected(grid, startR, startC) {
      const rows = grid.length;
      const cols = grid[0].length;
      let totalWalkable = 0;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] === 0) totalWalkable++;
        }
      }

      const visited = new Set();
      const queue = [{ r: startR, c: startC }];
      visited.add(`${startR},${startC}`);

      while (queue.length > 0) {
        const curr = queue.shift();
        const neighbors = this.getNeighbors(grid, curr.r, curr.c);
        for (const n of neighbors) {
          const key = `${n.r},${n.c}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push(n);
          }
        }
      }

      return visited.size === totalWalkable;
    },

    /**
     * Encuentra celda transitable en sombra fuera del radio de luz (Huida)
     */
    findEscapeTarget(grid, creatureR, creatureC, lightSources) {
      const rows = grid.length;
      const cols = grid[0].length;
      const queue = [{ r: creatureR, c: creatureC, dist: 0 }];
      const visited = new Set();
      visited.add(`${creatureR},${creatureC}`);

      while (queue.length > 0) {
        const curr = queue.shift();

        let inLight = false;
        for (const ls of lightSources) {
          const dist = Math.hypot(curr.r - ls.r, curr.c - ls.c);
          if (dist <= ls.radius) {
            inLight = true;
            break;
          }
        }

        if (!inLight && (curr.r !== creatureR || curr.c !== creatureC)) {
          return { r: curr.r, c: curr.c };
        }

        const neighbors = this.getNeighbors(grid, curr.r, curr.c);
        for (const n of neighbors) {
          const key = `${n.r},${n.c}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push({ r: n.r, c: n.c, dist: curr.dist + 1 });
          }
        }
      }

      let maxDist = -1;
      let fallback = { r: creatureR, c: creatureC };
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] === 0) {
            const d = Math.hypot(r - creatureR, c - creatureC);
            if (d > maxDist) {
              maxDist = d;
              fallback = { r, c };
            }
          }
        }
      }
      return fallback;
    },

    /**
     * Generador procedural de laberintos conexos y resolubles con algoritmo Recursive Backtracker
     */
    generateEndlessMaze(seed = 12345, rows = CONFIG.ROWS, cols = CONFIG.COLS) {
      let s = seed % 2147483647;
      if (s <= 0) s += 2147483646;
      function rand() {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
      }
      function randChoice(arr) {
        return arr[Math.floor(rand() * arr.length)];
      }

      const grid = [];
      for (let r = 0; r < rows; r++) {
        grid[r] = [];
        for (let c = 0; c < cols; c++) {
          grid[r][c] = '#';
        }
      }

      const stack = [];
      grid[1][1] = '.';
      stack.push({ r: 1, c: 1 });

      const dirs = [
        { dr: -2, dc: 0, wallR: -1, wallC: 0 },
        { dr: 2, dc: 0, wallR: 1, wallC: 0 },
        { dr: 0, dc: -2, wallR: 0, wallC: -1 },
        { dr: 0, dc: 2, wallR: 0, wallC: 1 }
      ];

      while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const neighbors = [];

        for (const d of dirs) {
          const nr = current.r + d.dr;
          const nc = current.c + d.dc;
          if (nr > 0 && nr < rows - 1 && nc > 0 && nc < cols - 1) {
            if (grid[nr][nc] === '#') {
              neighbors.push({ r: nr, c: nc, wallR: current.r + d.wallR, wallC: current.c + d.wallC });
            }
          }
        }

        if (neighbors.length > 0) {
          const next = randChoice(neighbors);
          grid[next.wallR][next.wallC] = '.';
          grid[next.r][next.c] = '.';
          stack.push({ r: next.r, c: next.c });
        } else {
          stack.pop();
        }
      }

      // Túneles laterales wrap-around en fila central
      const tunnelRow = Math.floor(rows / 2);
      grid[tunnelRow][0] = 'T';
      grid[tunnelRow][1] = '.';
      grid[tunnelRow][cols - 2] = '.';
      grid[tunnelRow][cols - 1] = 'T';

      // Abrir lazos adicionales para variedad de rutas
      for (let r = 2; r < rows - 2; r += 2) {
        for (let c = 2; c < cols - 2; c += 2) {
          if (grid[r][c] === '#' && rand() < 0.22) {
            if (grid[r - 1][c] === '.' && grid[r + 1][c] === '.') grid[r][c] = '.';
            else if (grid[r][c - 1] === '.' && grid[r][c + 1] === '.') grid[r][c] = '.';
          }
        }
      }

      // Spawns fijos
      grid[rows - 3][Math.floor(cols / 2)] = 'P';
      grid[tunnelRow - 1][Math.floor(cols / 2)] = 'E';

      // Asignar entre 6 y 8 faroles
      const freeCells = [];
      for (let r = 1; r < rows - 1; r++) {
        for (let c = 1; c < cols - 1; c++) {
          if (grid[r][c] === '.') freeCells.push({ r, c });
        }
      }

      for (let i = freeCells.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [freeCells[i], freeCells[j]] = [freeCells[j], freeCells[i]];
      }

      const numLanterns = 7;
      for (let i = 0; i < Math.min(numLanterns, freeCells.length); i++) {
        grid[freeCells[i].r][freeCells[i].c] = 'L';
      }

      return grid.map(row => row.join(''));
    },

    /**
     * Migración transparente de registros desde lumen:v1 a lumen:v2
     */
    migrateV1toV2(storageObj) {
      if (!storageObj) return false;
      try {
        const v1Best = storageObj.getItem('lumen:v1:best_score');
        const v1Unlocked = storageObj.getItem('lumen:v1:unlocked');

        if (v1Best) {
          storageObj.setItem('lumen:v2:best_score', v1Best);
        }
        if (v1Unlocked) {
          storageObj.setItem('lumen:v2:unlocked', v1Unlocked);
        }

        // Migrar puntuaciones de nivel
        for (let i = 0; i < 12; i++) {
          const v1Lvl = storageObj.getItem(`lumen:v1:level_${i}`);
          if (v1Lvl) {
            storageObj.setItem(`lumen:v2:lvl_${i}`, v1Lvl);
          }
        }
        storageObj.setItem('lumen:v2:migrated', 'true');
        return true;
      } catch (e) {
        return false;
      }
    },

    /**
     * Valida la solvencia matemática y estructural de un nivel
     */
    isLevelSolvable(level) {
      if (!level || !level.map || level.map.length !== CONFIG.ROWS) return false;
      const parsed = this.parseMap(level.map);

      if (parsed.lanterns.length < 6 || parsed.lanterns.length > 10) return false;
      if (!this.isMazeConnected(parsed.grid, parsed.playerStart.r, parsed.playerStart.c)) return false;

      for (const lan of parsed.lanterns) {
        const path = this.findPath(parsed.grid, parsed.playerStart.r, parsed.playerStart.c, lan.r, lan.c);
        if (!path) return false;
      }
      return true;
    }
  };

  // Exportar para pruebas Node
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, LumenLogic };
    return;
  }

  // ==========================================
  // ESTADO DEL JUEGO
  // ==========================================
  const State = {
    canvas: null,
    ctx: null,
    offscreenMazeCanvas: null,
    offscreenMazeCtx: null,
    offscreenLightCanvas: null,
    offscreenLightCtx: null,

    cellW: 22,
    cellH: 22,
    gridRows: CONFIG.ROWS,
    gridCols: CONFIG.COLS,

    grid: [],
    lanterns: [],
    keys: [],
    doors: [],
    switches: [],
    relics: [],
    traps: [],
    tunnels: [],

    currentLevelIdx: 0,
    currentWorld: 1,
    isEndless: false,
    isDaily: false,

    score: 0,
    bestScore: 0,
    lives: CONFIG.STARTING_LIVES,
    timeInLevel: 0,

    state: 'MENU', // 'MENU', 'PLAYING', 'PAUSED', 'UPGRADE', 'GAMEOVER', 'VICTORY'

    // Jugador Farolero
    player: {
      r: 11, c: 7,
      x: 11 * 22 + 11, y: 7 * 22 + 11,
      dirR: 0, dirC: 0,
      nextDirR: 0, nextDirC: 0,
      speed: CONFIG.BASE_PLAYER_SPEED,
      lightRadius: CONFIG.PLAYER_LIGHT_RADIUS,
      hasKey: false
    },

    // Criaturas
    creatures: [],
    boss: null,

    // Habilidades
    sparks: [],
    availableSparks: CONFIG.MAX_SPARKS,
    sparkRechargeTimer: 0,
    flashActive: false,
    flashTimer: 0,
    flashCooldown: 0,

    // Tensión y Clímax
    isBlackout: false,
    eventTimer: 0,

    // Mejoras activas
    upgrades: new Set(),
    achievements: {},
    options: { sfx: true, bgm: true, vibration: true, contrast: false },

    // Render y pooling
    particles: [],
    floatingTexts: [],
    routeCache: new Map(),
    lastTime: 0,

    // Diagnóstico
    fps: 60,
    frameTime: 16.6,
    frameCount: 0,
    lastFpsUpdate: 0,
    isDebug: false,
    lowSpecMode: false
  };

  // Referencias DOM
  const dom = {
    container: document.getElementById('game-container'),
    header: document.getElementById('game-header'),
    subBar: document.getElementById('sub-bar'),
    canvas: document.getElementById('game-canvas'),
    blackoutVignette: document.getElementById('blackout-vignette'),
    debugOverlay: document.getElementById('debug-overlay'),

    scoreVal: document.getElementById('score-val'),
    lanternsVal: document.getElementById('lanterns-val'),
    livesVal: document.getElementById('lives-val'),
    levelDisplay: document.getElementById('level-display'),

    // Barra de Jefe
    bossBanner: document.getElementById('boss-banner'),
    bossName: document.getElementById('boss-name'),
    bossHpText: document.getElementById('boss-hp-text'),
    bossHpFill: document.getElementById('boss-hp-fill'),
    bossAttackWarn: document.getElementById('boss-attack-warn'),

    // Habilidades
    pipSpark1: document.getElementById('pip-spark-1'),
    pipSpark2: document.getElementById('pip-spark-2'),
    pipFlash: document.getElementById('pip-flash'),

    // Botones
    btnBack: document.getElementById('btn-back'),
    btnSoundToggle: document.getElementById('btn-sound-toggle'),
    iconSoundOn: document.getElementById('icon-sound-on'),
    iconSoundOff: document.getElementById('icon-sound-off'),
    btnPauseHeader: document.getElementById('btn-pause-header'),
    btnAchievementsToggle: document.getElementById('btn-achievements-toggle'),
    btnOptionsToggle: document.getElementById('btn-options-toggle'),

    // Controles táctiles
    btnDpadUp: document.getElementById('btn-dpad-up'),
    btnDpadLeft: document.getElementById('btn-dpad-left'),
    btnDpadRight: document.getElementById('btn-dpad-right'),
    btnDpadDown: document.getElementById('btn-dpad-down'),
    btnActionSpark: document.getElementById('btn-action-spark'),
    btnActionFlash: document.getElementById('btn-action-flash'),

    // Modales
    startCard: document.getElementById('start-card'),
    levelsGrid: document.getElementById('levels-grid'),
    worldBanner: document.getElementById('world-banner'),
    worldBadge: document.getElementById('world-badge'),
    worldDesc: document.getElementById('world-desc'),
    worldTabs: document.querySelectorAll('.world-tab'),
    btnOpenDaily: document.getElementById('btn-open-daily'),
    btnStartEndless: document.getElementById('btn-start-endless'),

    // Modal Mejoras
    modalUpgrade: document.getElementById('modal-upgrade'),
    upgradeCards: document.getElementById('upgrade-cards'),

    // Modal Diario
    modalDaily: document.getElementById('modal-daily'),
    btnPlayDaily: document.getElementById('btn-play-daily'),
    btnCloseDaily: document.getElementById('btn-close-daily'),

    // Modal Pausa
    overlayPause: document.getElementById('overlay-pause'),
    btnResume: document.getElementById('btn-resume'),
    btnRestartLevel: document.getElementById('btn-restart-level'),
    btnLevelSelect: document.getElementById('btn-level-select'),

    // Modal Resultados
    overlayResult: document.getElementById('overlay-result'),
    resultIcon: document.getElementById('result-icon'),
    resultTitle: document.getElementById('result-title'),
    resultSubtitle: document.getElementById('result-subtitle'),
    resultScoreVal: document.getElementById('result-score-val'),
    resultLanternsVal: document.getElementById('result-lanterns-val'),
    resultBestVal: document.getElementById('result-best-val'),
    starsRow: document.getElementById('stars-row'),
    btnNextLevel: document.getElementById('btn-next-level'),
    btnRetryLevel: document.getElementById('btn-retry-level'),
    btnExitToLevels: document.getElementById('btn-exit-to-levels'),

    // Logros y Opciones
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

  // ==========================================
  // SÍNTESIS DE AUDIO PROCEDURAL (Web Audio API)
  // ==========================================
  let bgmInterval = null;
  let bgmStep = 0;

  function playAudio(type, extra = 1) {
    if (!State.options.sfx || !window.ArcadeAudio || window.ArcadeAudio.isMuted) return;

    try {
      const actx = window.ArcadeAudio.ctx;
      if (!actx) return;
      const now = actx.currentTime;

      switch (type) {
        case 'light_lantern': {
          [440, 554.37, 659.25, 880].forEach((freq, idx) => {
            const osc = actx.createOscillator();
            const gain = actx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.04);
            gain.gain.setValueAtTime(0.2, now + idx * 0.04);
            gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.04 + 0.15);
            osc.connect(gain);
            gain.connect(actx.destination);
            osc.start(now + idx * 0.04);
            osc.stop(now + idx * 0.04 + 0.15);
          });
          break;
        }

        case 'spark_drop': {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(700, now);
          osc.frequency.exponentialRampToValueAtTime(1400, now + 0.1);
          gain.gain.setValueAtTime(0.22, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        }

        case 'flash_blast': {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(1200, now);
          osc.frequency.exponentialRampToValueAtTime(160, now + 0.45);
          gain.gain.setValueAtTime(0.4, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.45);
          break;
        }

        case 'creature_flee': {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.linearRampToValueAtTime(90, now + 0.25);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.25);
          break;
        }

        case 'player_hit': {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
          gain.gain.setValueAtTime(0.5, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.35);
          break;
        }

        case 'relic_pickup': {
          [587.33, 880, 1174.66].forEach((freq, idx) => {
            const osc = actx.createOscillator();
            const gain = actx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);
            gain.gain.setValueAtTime(0.2, now + idx * 0.06);
            gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.06 + 0.12);
            osc.connect(gain);
            gain.connect(actx.destination);
            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.12);
          });
          break;
        }

        case 'blackout_alarm': {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.linearRampToValueAtTime(260, now + 0.2);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.2);
          break;
        }

        case 'victory': {
          [440, 554.37, 659.25, 880, 1108.73].forEach((freq, idx) => {
            const osc = actx.createOscillator();
            const gain = actx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.09);
            gain.gain.setValueAtTime(0.25, now + idx * 0.09);
            gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.09 + 0.22);
            osc.connect(gain);
            gain.connect(actx.destination);
            osc.start(now + idx * 0.09);
            osc.stop(now + idx * 0.09 + 0.22);
          });
          break;
        }
      }
    } catch (e) {}
  }

  function startBGM() {
    if (!State.options.bgm || bgmInterval || !window.ArcadeAudio || window.ArcadeAudio.isMuted) return;

    try {
      const actx = window.ArcadeAudio.ctx;
      if (!actx) return;

      // Escalas modales según el mundo activo
      const scales = [
        [220, 261.63, 293.66, 329.63, 392.0], // Bosque: Dórico
        [196, 233.08, 261.63, 311.13, 349.23], // Cripta: Eólico
        [220, 246.94, 277.18, 329.63, 369.99], // Mina: Frigio mayor
        [174.61, 207.65, 233.08, 277.18, 311.13], // Ciudad: Lidio
        [164.81, 196.0, 220.0, 246.94, 329.63] // Abismo: Lócrio
      ];

      const activeScale = scales[(State.currentWorld - 1) % scales.length];
      const tempo = State.isBlackout ? 260 : 520;

      bgmInterval = setInterval(() => {
        if (!State.options.bgm || State.state !== 'PLAYING') return;
        const now = actx.currentTime;
        const osc = actx.createOscillator();
        const gain = actx.createGain();

        const freq = activeScale[bgmStep % activeScale.length];
        bgmStep = (bgmStep + 1) % activeScale.length;

        osc.type = State.isBlackout ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(State.isBlackout ? 0.05 : 0.035, now);
        gain.gain.linearRampToValueAtTime(0.001, now + (tempo * 0.001 * 0.85));

        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start(now);
        osc.stop(now + (tempo * 0.001 * 0.85));
      }, tempo);
    } catch (e) {}
  }

  function stopBGM() {
    if (bgmInterval) {
      clearInterval(bgmInterval);
      bgmInterval = null;
    }
  }

  // ==========================================
  // INICIALIZACIÓN Y CONFIGURACIÓN DE NIVELES
  // ==========================================
  function startLevel(lvlIdx, isDaily = false) {
    State.currentLevelIdx = lvlIdx;
    State.isDaily = isDaily;
    const lvl = CONFIG.LEVELS[lvlIdx] || CONFIG.LEVELS[0];
    State.currentWorld = lvl.world;

    State.score = 0;
    State.lives = CONFIG.STARTING_LIVES;
    State.timeInLevel = 0;
    State.sparks = [];
    State.availableSparks = State.upgrades.has('EXTRA_SPARK') ? 3 : CONFIG.MAX_SPARKS;
    State.sparkRechargeTimer = 0;
    State.flashActive = false;
    State.flashTimer = 0;
    State.flashCooldown = 0;
    State.isBlackout = false;
    State.eventTimer = 12.0; // Evento aleatorio cada 12-18s

    dom.blackoutVignette.classList.add('hidden');

    // Parsear mapa del nivel
    const parsed = LumenLogic.parseMap(lvl.map);
    State.grid = parsed.grid;
    State.lanterns = parsed.lanterns;
    State.keys = parsed.keys;
    State.doors = parsed.doors;
    State.switches = parsed.switches;
    State.relics = parsed.relics;
    State.traps = parsed.traps;
    State.tunnels = parsed.tunnels;

    // Configurar jugador
    State.player = {
      r: parsed.playerStart.r,
      c: parsed.playerStart.c,
      x: parsed.playerStart.c * State.cellW + State.cellW / 2,
      y: parsed.playerStart.r * State.cellH + State.cellH / 2,
      dirR: 0,
      dirC: 0,
      nextDirR: 0,
      nextDirC: 0,
      speed: CONFIG.BASE_PLAYER_SPEED * (State.upgrades.has('SPEED_BOOTS') ? 1.15 : 1.0),
      lightRadius: CONFIG.PLAYER_LIGHT_RADIUS * (State.upgrades.has('LANTERN_BOOST') ? 1.25 : 1.0),
      hasKey: false
    };

    // Configurar criaturas según mundo y nivel
    setupCreatures(parsed.enemySpawns, lvl);

    // Configurar jefe si aplica
    if (lvl.isBoss) {
      State.boss = {
        name: lvl.bossName,
        hp: lvl.bossHp,
        maxHp: lvl.bossHp,
        attackTimer: 8.0,
        telegraphing: false,
        telegraphTimer: 0
      };
      dom.bossName.textContent = lvl.bossName;
      dom.bossHpText.textContent = `PV: ${State.boss.hp}/${State.boss.maxHp}`;
      dom.bossHpFill.style.width = '100%';
      dom.bossAttackWarn.classList.add('hidden');
      dom.bossBanner.classList.remove('hidden');
    } else {
      State.boss = null;
      dom.bossBanner.classList.add('hidden');
    }

    // Pre-renderizar laberinto estático en canvas offscreen
    renderOffscreenMaze();

    State.state = 'PLAYING';
    dom.startCard.classList.add('hidden');
    dom.overlayPause.classList.add('hidden');
    dom.overlayResult.classList.add('hidden');
    dom.modalUpgrade.classList.add('hidden');

    updateHUD();
    stopBGM();
    startBGM();
  }

  function setupCreatures(spawns, lvl) {
    State.creatures = [];
    const world = lvl.world;

    // Asignar tipos de criaturas según mundo y dificultad progresiva
    spawns.forEach((spawn, idx) => {
      let typeId = 1; // Acechador por defecto

      if (world === 2) typeId = (idx % 2 === 0) ? 2 : 4; // Divisor o Tímido
      else if (world === 3) typeId = (idx % 2 === 0) ? 3 : 5; // Emisor o Tragaluz
      else if (world === 4) typeId = (idx % 2 === 0) ? 6 : 1; // Fantasma o Acechador
      else if (world === 5) typeId = (idx % 3 === 0) ? 7 : (idx % 2 === 0 ? 3 : 2); // Coloso, Emisor, Divisor

      State.creatures.push(createCreature(typeId, spawn.r, spawn.c));
    });
  }

  function createCreature(typeId, r, c) {
    const typeCfg = CONFIG.CREATURE_TYPES.find(t => t.id === typeId) || CONFIG.CREATURE_TYPES[0];
    return {
      typeId,
      name: typeCfg.name,
      shape: typeCfg.shape,
      color: typeCfg.color,
      r, c,
      x: c * State.cellW + State.cellW / 2,
      y: r * State.cellH + State.cellH / 2,
      dirR: 0, dirC: 0,
      state: 'HUNT', // 'HUNT', 'FLEE', 'STUNNED', 'FROZEN'
      stunTimer: 0,
      path: [],
      pathUpdateTimer: Math.random() * 0.3, // Intervalos escalonados
      phaseTimer: 0,
      isPhasing: false,
      speed: CONFIG.CREATURE_BASE_SPEED
    };
  }

  // ==========================================
  // CONTROLES CON BÚFER DE GIRO (Corner Slip)
  // ==========================================
  function setPlayerDirection(dr, dc) {
    State.player.nextDirR = dr;
    State.player.nextDirC = dc;

    // Si está quieto o revierte dirección en línea recta, aplicar de inmediato
    if (State.player.dirR === -dr && State.player.dirC === -dc) {
      State.player.dirR = dr;
      State.player.dirC = dc;
    }
  }

  function updatePlayerMovement(dt) {
    const p = State.player;
    const halfCell = State.cellW / 2;

    // Detectar celda actual en coordenadas continuas
    const currCellC = Math.floor(p.x / State.cellW);
    const currCellR = Math.floor(p.y / State.cellH);
    const centerTargetX = currCellC * State.cellW + halfCell;
    const centerTargetY = currCellR * State.cellH + halfCell;

    // Verificar si el jugador está suficientemente cerca del centro para ejecutar el giro en cola
    const distToCenter = Math.hypot(p.x - centerTargetX, p.y - centerTargetY);

    if (distToCenter < 6.0 && (p.nextDirR !== p.dirR || p.nextDirC !== p.dirC)) {
      const targetR = currCellR + p.nextDirR;
      let targetC = currCellC + p.nextDirC;

      // Túnel lateral wrap-around
      if (targetC < 0 && State.grid[currCellR][CONFIG.COLS - 1] === 0) targetC = CONFIG.COLS - 1;
      else if (targetC >= CONFIG.COLS && State.grid[currCellR][0] === 0) targetC = 0;

      if (targetR >= 0 && targetR < CONFIG.ROWS && targetC >= 0 && targetC < CONFIG.COLS) {
        if (State.grid[targetR][targetC] === 0) {
          // Encajar al centro y cambiar dirección
          p.x = centerTargetX;
          p.y = centerTargetY;
          p.dirR = p.nextDirR;
          p.dirC = p.nextDirC;
        }
      }
    }

    // Avanzar en la dirección actual si la celda frente está libre
    if (p.dirR !== 0 || p.dirC !== 0) {
      const nextX = p.x + p.dirC * p.speed * State.cellW * dt;
      const nextY = p.y + p.dirR * p.speed * State.cellH * dt;

      const nextCellC = Math.floor(nextX / State.cellW);
      const nextCellR = Math.floor(nextY / State.cellH);

      // Verificación de colisión contra muros y puertas cerradas
      if (canMoveTo(nextCellR, nextCellC)) {
        p.x = nextX;
        p.y = nextY;
      } else {
        // Detenerse exactamente en el centro de la celda antes del muro
        p.x = centerTargetX;
        p.y = centerTargetY;
        p.dirR = 0;
        p.dirC = 0;
      }

      // Túnel wrap-around continuo
      if (p.x < 0) p.x = CONFIG.COLS * State.cellW - 1;
      else if (p.x >= CONFIG.COLS * State.cellW) p.x = 1;

      p.r = Math.floor(p.y / State.cellH);
      p.c = Math.floor(p.x / State.cellW);
    }
  }

  function canMoveTo(r, c) {
    if (r < 0 || r >= CONFIG.ROWS || c < 0 || c >= CONFIG.COLS) return false;
    if (State.grid[r][c] === 1) return false; // Muro

    // Puerta cerrada
    const door = State.doors.find(d => d.r === r && d.c === c && !d.open);
    if (door) {
      if (State.player.hasKey) {
        door.open = true;
        playAudio('light_lantern');
        spawnFloatingText(c * State.cellW + 11, r * State.cellH + 11, '¡PUERTA ABIERTA!', '#00ff88');
        renderOffscreenMaze();
        return true;
      }
      return false;
    }
    return true;
  }

  // ==========================================
  // HABILIDADES: CHISPAS Y DESTELLO
  // ==========================================
  function dropSpark() {
    if (State.availableSparks <= 0) return;
    State.availableSparks--;
    playAudio('spark_drop');
    if (State.options.vibration) window.ArcadeCanvas?.haptic(20);

    State.sparks.push({
      r: State.player.r,
      c: State.player.c,
      x: State.player.c * State.cellW + State.cellW / 2,
      y: State.player.r * State.cellH + State.cellH / 2,
      radius: CONFIG.SPARK_LIGHT_RADIUS,
      duration: CONFIG.SPARK_DURATION
    });

    unlockAchievement('SPARK_MASTER');
    updateHUD();
  }

  function activateFlash() {
    if (State.flashCooldown > 0 || State.flashActive) return;
    State.flashActive = true;
    State.flashTimer = CONFIG.FLASH_DURATION;
    State.flashCooldown = CONFIG.FLASH_COOLDOWN * (State.upgrades.has('FAST_FLASH') ? 0.7 : 1.0);

    playAudio('flash_blast');
    if (State.options.vibration) window.ArcadeCanvas?.haptic(45);
    window.ArcadeJuice?.shake(dom.container, 14, 250);

    // Ahuyentar a todas las criaturas del mapa
    State.creatures.forEach(c => {
      c.state = 'FLEE';
      c.stunTimer = 3.0;

      // Si es divisor, dividir
      if (c.typeId === 2 && State.creatures.length < 8) {
        c.typeId = 1;
        c.shape = 'diamond';
        State.creatures.push(createCreature(1, c.r, c.c));
      }
    });

    // Si hay jefe activo, aturdirlo
    if (State.boss) {
      State.boss.hp = Math.max(0, State.boss.hp - 1);
      dom.bossHpText.textContent = `PV: ${State.boss.hp}/${State.boss.maxHp}`;
      dom.bossHpFill.style.width = `${(State.boss.hp / State.boss.maxHp) * 100}%`;
      spawnFloatingText(State.player.x, State.player.y - 20, '¡JEFE IMPACTADO!', '#ff007f');
      if (State.boss.hp <= 0) handleVictory();
    }

    unlockAchievement('SOLAR_FLASH');
    updateHUD();
  }

  // ==========================================
  // IA DE CRIATURAS Y ESCALONADO BFS
  // ==========================================
  function updateCreatures(dt) {
    const lightSources = getActiveLightSources();

    State.creatures.forEach((c, idx) => {
      // 1. Contador de aturdimiento
      if (c.stunTimer > 0) {
        c.stunTimer -= dt;
        return;
      }

      // 2. Comportamiento especial del Tímido (Gazer)
      if (c.typeId === 4) {
        // Verificar si el jugador camina hacia él
        const toEnemyX = c.x - State.player.x;
        const toEnemyY = c.y - State.player.y;
        const dot = State.player.dirC * toEnemyX + State.player.dirR * toEnemyY;
        if (dot > 0.3) {
          c.state = 'FROZEN';
          return; // Congelado por la mirada del jugador
        }
      }

      // 3. Evaluar exposición a la luz
      let inLight = State.flashActive;
      if (!inLight) {
        for (const ls of lightSources) {
          const d = Math.hypot(c.r - ls.r, c.c - ls.c);
          if (d <= ls.radius) {
            inLight = true;
            break;
          }
        }
      }

      // Criatura Coloso (7) es inmune a luz normal
      if (c.typeId === 7 && !State.flashActive) {
        inLight = false;
      }

      c.state = inLight ? 'FLEE' : 'HUNT';

      // 4. Velocidad según oscuridad y mejoras de aura
      let currentSpeed = c.speed;
      if (!inLight) currentSpeed *= CONFIG.CREATURE_DARK_BOOST;
      if (inLight && State.upgrades.has('AURA_WARD')) currentSpeed *= 0.65;

      // 5. Actualización escalonada de rutas BFS
      c.pathUpdateTimer -= dt;
      if (c.pathUpdateTimer <= 0) {
        c.pathUpdateTimer = 0.3 + (idx * 0.05); // Escalonado

        let targetR = State.player.r;
        let targetC = State.player.c;

        if (c.state === 'FLEE') {
          const escape = LumenLogic.findEscapeTarget(State.grid, c.r, c.c, lightSources);
          targetR = escape.r;
          targetC = escape.c;
        } else if (c.typeId === 5) {
          // Tragaluz busca faroles encendidos
          const litLantern = State.lanterns.find(l => l.lit);
          if (litLantern) {
            targetR = litLantern.r;
            targetC = litLantern.c;
          }
        }

        const path = LumenLogic.findPath(State.grid, c.r, c.c, targetR, targetC);
        if (path && path.length > 0) {
          c.path = path;
        }
      }

      // 6. Avanzar por la ruta
      if (c.path && c.path.length > 0) {
        const nextNode = c.path[0];
        const targetX = nextNode.c * State.cellW + State.cellW / 2;
        const targetY = nextNode.r * State.cellH + State.cellH / 2;

        const dx = targetX - c.x;
        const dy = targetY - c.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 4.0) {
          c.x = targetX;
          c.y = targetY;
          c.r = nextNode.r;
          c.c = nextNode.c;
          c.path.shift();

          // Tragaluz devorando farol
          if (c.typeId === 5) {
            const lan = State.lanterns.find(l => l.r === c.r && l.c === c.c && l.lit);
            if (lan) {
              lan.radius = Math.max(0, lan.radius - 0.8);
              if (lan.radius <= 0) lan.lit = false;
            }
          }
        } else {
          c.x += (dx / dist) * currentSpeed * State.cellW * dt;
          c.y += (dy / dist) * currentSpeed * State.cellH * dt;
        }
      }

      // 7. Colisión con el jugador Farolero
      const playerDist = Math.hypot(c.x - State.player.x, c.y - State.player.y);
      if (playerDist < 16.0) {
        if (c.state === 'FLEE' || c.state === 'STUNNED' || c.state === 'FROZEN') {
          // Ahuyentada
          playAudio('creature_flee');
          c.x = CONFIG.COLS * State.cellW / 2;
          c.y = CONFIG.ROWS * State.cellH / 2;
          c.stunTimer = 4.0;
          State.score += 150;
          spawnFloatingText(c.x, c.y, '+150 Ahuyentada', '#00f0ff');
        } else {
          // Daño al jugador
          handlePlayerHit();
        }
      }
    });
  }

  function handlePlayerHit() {
    playAudio('player_hit');
    if (State.options.vibration) window.ArcadeCanvas?.haptic(50);
    window.ArcadeJuice?.shake(dom.container, 18, 300);

    State.lives--;
    updateHUD();

    if (State.lives <= 0) {
      endGame(false, '¡Las criaturas de la penumbra han apagado tu luz!');
    } else {
      // Reubicar jugador a spawn seguro y destello breve
      State.player.x = 7 * State.cellW + State.cellW / 2;
      State.player.y = 11 * State.cellH + State.cellH / 2;
      State.player.r = 11;
      State.player.c = 7;
      State.player.dirR = 0;
      State.player.dirC = 0;
      State.flashActive = true;
      State.flashTimer = 2.0;
    }
  }

  function getActiveLightSources() {
    const list = [];

    // Luz del jugador
    list.push({
      r: State.player.r,
      c: State.player.c,
      x: State.player.x,
      y: State.player.y,
      radius: State.player.lightRadius
    });

    // Faroles encendidos
    State.lanterns.forEach(lan => {
      if (lan.lit && lan.radius > 0) {
        list.push({
          r: lan.r,
          c: lan.c,
          x: lan.c * State.cellW + State.cellW / 2,
          y: lan.r * State.cellH + State.cellH / 2,
          radius: lan.radius
        });
      }
    });

    // Chispas activas
    State.sparks.forEach(sp => {
      list.push({
        r: sp.r,
        c: sp.c,
        x: sp.x,
        y: sp.y,
        radius: sp.radius
      });
    });

    return list;
  }

  // ==========================================
  // EVENTOS, APAGÓN Y PROGRESIÓN
  // ==========================================
  function updateWorldLogic(dt) {
    State.timeInLevel += dt;

    // 1. Consumo gradual de faroles (Presión constante)
    const decay = CONFIG.LANTERN_DECAY_RATE * (State.upgrades.has('OIL_RESERVE') ? 0.5 : 1.0);
    State.lanterns.forEach(lan => {
      if (lan.lit) {
        // Si el jugador está parado sobre el farol, lo recarga
        if (State.player.r === lan.r && State.player.c === lan.c) {
          lan.radius = Math.min(CONFIG.LANTERN_MAX_LIGHT_RADIUS, lan.radius + 1.2 * dt);
        } else {
          lan.radius -= decay * dt;
          if (lan.radius <= 0.8) {
            lan.lit = false;
            lan.radius = 0;
          }
        }
      } else {
        // Encender si el jugador lo pisa
        if (State.player.r === lan.r && State.player.c === lan.c) {
          lan.lit = true;
          lan.radius = CONFIG.LANTERN_MAX_LIGHT_RADIUS;
          playAudio('light_lantern');
          if (State.options.vibration) window.ArcadeCanvas?.haptic(15);
          State.score += 100;
          spawnFloatingText(lan.c * State.cellW + 11, lan.r * State.cellH + 11, '+100 Farol', '#ffaa00');
          unlockAchievement('FIRST_LIGHT');
          checkVictoryCondition();
        }
      }
    });

    // 2. Chispas y recarga
    for (let i = State.sparks.length - 1; i >= 0; i--) {
      const sp = State.sparks[i];
      sp.duration -= dt;
      if (sp.duration <= 0) State.sparks.splice(i, 1);
    }

    const maxSparks = State.upgrades.has('EXTRA_SPARK') ? 3 : CONFIG.MAX_SPARKS;
    if (State.availableSparks < maxSparks) {
      State.sparkRechargeTimer += dt;
      if (State.sparkRechargeTimer >= CONFIG.SPARK_RECHARGE_TIME) {
        State.sparkRechargeTimer = 0;
        State.availableSparks++;
        updateHUD();
      }
    }

    // 3. Destello de emergencia
    if (State.flashActive) {
      State.flashTimer -= dt;
      if (State.flashTimer <= 0) State.flashActive = false;
    }
    if (State.flashCooldown > 0) {
      State.flashCooldown -= dt;
    }

    // 4. Objetos interactivos
    // Reliquias
    State.relics.forEach(rel => {
      if (!rel.collected && State.player.r === rel.r && State.player.c === rel.c) {
        rel.collected = true;
        playAudio('relic_pickup');
        State.score += 250;
        State.availableSparks = Math.min(maxSparks, State.availableSparks + 1);
        spawnFloatingText(rel.c * State.cellW + 11, rel.r * State.cellH + 11, '+250 Reliquia', '#00e5ff');
        unlockAchievement('RELIC_HUNTER');
      }
    });

    // Llaves
    State.keys.forEach(k => {
      if (!k.collected && State.player.r === k.r && State.player.c === k.c) {
        k.collected = true;
        State.player.hasKey = true;
        playAudio('light_lantern');
        spawnFloatingText(k.c * State.cellW + 11, k.r * State.cellH + 11, '🔑 ¡LLAVE OBTENIDA!', '#ffcc00');
      }
    });

    // Trampas de luz
    State.traps.forEach(tr => {
      if (tr.active) {
        State.creatures.forEach(c => {
          if (c.r === tr.r && c.c === tr.c && c.stunTimer <= 0) {
            c.stunTimer = 4.0;
            playAudio('creature_flee');
            spawnFloatingText(c.x, c.y, '☀️ ¡ATRAPADA!', '#ffff00');
            unlockAchievement('TRAP_CAUGHT');
          }
        });
      }
    });

    // 5. Clímax de Apagón: cuando quedan 2 o menos faroles por encender
    const litCount = State.lanterns.filter(l => l.lit).length;
    const remaining = State.lanterns.length - litCount;
    if (remaining <= 2 && !State.isBlackout && remaining > 0) {
      State.isBlackout = true;
      playAudio('blackout_alarm');
      dom.blackoutVignette.classList.remove('hidden');
      stopBGM();
      startBGM(); // Acelera el tempo
    } else if (remaining > 2 && State.isBlackout) {
      State.isBlackout = false;
      dom.blackoutVignette.classList.add('hidden');
      stopBGM();
      startBGM();
    }

    // 6. Eventos aleatorios del laberinto
    State.eventTimer -= dt;
    if (State.eventTimer <= 0) {
      State.eventTimer = Math.random() * 8.0 + 12.0;
      triggerRandomEvent();
    }
  }

  function triggerRandomEvent() {
    const evtType = Math.floor(Math.random() * 3);
    if (evtType === 0) {
      // Parpadeo general de luces
      spawnFloatingText(State.player.x, State.player.y - 15, '⚠️ ¡PARPADEO DE LUZ!', '#ff0055');
      playAudio('blackout_alarm');
      State.player.lightRadius = Math.max(1.2, State.player.lightRadius - 0.6);
      setTimeout(() => {
        State.player.lightRadius = CONFIG.PLAYER_LIGHT_RADIUS * (State.upgrades.has('LANTERN_BOOST') ? 1.25 : 1.0);
      }, 1500);
    } else if (evtType === 1 && State.creatures.length < 7) {
      // Emerge criatura del túnel
      spawnFloatingText(State.cellW * 7, State.cellH * 9, '⚠️ ¡SOMBRA DEL TÚNEL!', '#aa00ff');
      State.creatures.push(createCreature(1, 9, 0));
    }
  }

  function checkVictoryCondition() {
    const allLit = State.lanterns.every(l => l.lit);
    if (allLit && (!State.boss || State.boss.hp <= 0)) {
      handleVictory();
    }
  }

  function handleVictory() {
    State.state = 'VICTORY';
    stopBGM();
    playAudio('victory');

    if (State.timeInLevel < 30) unlockAchievement('SPEED_CLEAR');
    if (State.currentLevelIdx === 5) unlockAchievement('BOSS_BRANCH');
    if (State.currentLevelIdx === 11) unlockAchievement('BOSS_GOLEM');
    if (State.currentLevelIdx >= 29) unlockAchievement('ABYSS_CONQUEROR');

    let stars = 1;
    if (State.timeInLevel < 45 && State.lives === CONFIG.STARTING_LIVES) stars = 3;
    else if (State.timeInLevel < 70) stars = 2;

    if (stars === 3) unlockAchievement('PERFECT_LIGHT');

    saveLevelRecord(State.currentLevelIdx, State.score, stars);
    setUnlockedLevel(State.currentLevelIdx + 1);

    // Si aún hay niveles y no es el último, mostrar selección de mejoras
    if (State.currentLevelIdx < CONFIG.LEVELS.length - 1) {
      setTimeout(() => showUpgradeModal(), 400);
    } else {
      endGame(true, '¡Has conquistado la Noche Eterna y restaurado la Luz en todos los mundos!');
    }
  }

  function showUpgradeModal() {
    dom.upgradeCards.innerHTML = '';
    // Seleccionar 3 mejoras aleatorias de las que el jugador no tenga ya
    const available = CONFIG.UPGRADES.filter(u => !State.upgrades.has(u.id));
    const pool = available.length >= 3 ? available : CONFIG.UPGRADES;

    const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
    shuffled.forEach(upg => {
      const card = document.createElement('div');
      card.className = 'upgrade-card';
      card.innerHTML = `
        <span class="upgrade-icon">${upg.icon}</span>
        <div class="upgrade-info">
          <span class="upgrade-name">${upg.name}</span>
          <span class="upgrade-desc">${upg.desc}</span>
        </div>
      `;
      card.addEventListener('click', () => {
        State.upgrades.add(upg.id);
        playAudio('relic_pickup');
        dom.modalUpgrade.classList.add('hidden');
        startLevel(State.currentLevelIdx + 1);
      });
      dom.upgradeCards.appendChild(card);
    });

    dom.modalUpgrade.classList.remove('hidden');
  }

  function endGame(isVictory, message) {
    State.state = isVictory ? 'VICTORY' : 'GAMEOVER';
    stopBGM();

    dom.resultIcon.textContent = isVictory ? '🏮' : '🕯️';
    dom.resultTitle.textContent = isVictory ? '¡LABERINTO ILUMINADO!' : 'LUMBRE EXTINTA';
    dom.resultSubtitle.textContent = message;
    dom.resultScoreVal.textContent = State.score.toLocaleString();

    const litLanterns = State.lanterns.filter(l => l.lit).length;
    dom.resultLanternsVal.textContent = `${litLanterns}/${State.lanterns.length}`;

    const rec = getLevelRecord(State.currentLevelIdx);
    dom.resultBestVal.textContent = rec.score.toLocaleString();

    dom.starsRow.innerHTML = '';
    for (let s = 1; s <= 3; s++) {
      const starSpan = document.createElement('span');
      starSpan.className = s <= rec.stars ? 'star-slot filled' : 'star-slot empty';
      starSpan.textContent = '★';
      dom.starsRow.appendChild(starSpan);
    }

    if (isVictory && State.currentLevelIdx < CONFIG.LEVELS.length - 1) {
      dom.btnNextLevel.classList.remove('hidden');
    } else {
      dom.btnNextLevel.classList.add('hidden');
    }

    dom.overlayResult.classList.remove('hidden');
  }

  // ==========================================
  // RENDERIZADO OFFSCREEN DE ALTO RENDIMIENTO
  // ==========================================
  function renderOffscreenMaze() {
    const canvas = State.offscreenMazeCanvas;
    const ctx = State.offscreenMazeCtx;
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = State.cellW;
    const h = State.cellH;
    const worldCfg = CONFIG.WORLDS[(State.currentWorld - 1) % CONFIG.WORLDS.length];

    for (let r = 0; r < CONFIG.ROWS; r++) {
      for (let c = 0; c < CONFIG.COLS; c++) {
        const x = c * w;
        const y = r * h;

        if (State.grid[r][c] === 1) {
          // Muro estilizado con relieve de neón
          ctx.fillStyle = '#0a101f';
          ctx.fillRect(x, y, w, h);

          ctx.strokeStyle = worldCfg.color;
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        } else {
          // Pasillo
          ctx.fillStyle = '#03060c';
          ctx.fillRect(x, y, w, h);
        }
      }
    }

    // Dibujar puertas rúnicas estáticas
    State.doors.forEach(d => {
      if (!d.open) {
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(d.c * w + 2, d.r * h + 2, w - 4, h - 4);
      }
    });
  }

  function render(time) {
    const ctx = State.ctx;
    if (!ctx) return;

    const w = dom.canvas.width;
    const h = dom.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // 1. Dibujar laberinto base desde el offscreen
    if (State.offscreenMazeCanvas) {
      ctx.drawImage(State.offscreenMazeCanvas, 0, 0);
    }

    // 2. Elementos del mapa: Faroles, Reliquias, Llaves, Trampas
    renderMapObjects(ctx);

    // 3. Jugador Farolero
    renderPlayer(ctx);

    // 4. Criaturas
    renderCreatures(ctx);

    // 5. Capa de iluminación y oscuridad con offscreenLightCanvas
    renderLightingMask(ctx, w, h);

    // 6. Textos flotantes y partículas
    renderParticles(ctx);
    renderFloatingTexts(ctx);

    // 7. Diagnóstico (?debug=1)
    if (State.isDebug) {
      dom.debugOverlay.textContent = `FPS: ${Math.round(State.fps)} | Frame: ${State.frameTime.toFixed(1)}ms | Entidades: ${State.creatures.length + 1} | Partículas: ${State.particles.length}`;
    }
  }

  function renderMapObjects(ctx) {
    const w = State.cellW;
    const h = State.cellH;

    // Faroles
    State.lanterns.forEach(lan => {
      const cx = lan.c * w + w / 2;
      const cy = lan.r * h + h / 2;

      ctx.save();
      if (lan.lit) {
        ctx.fillStyle = '#ffcc00';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = '#445566';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - 5, cy - 5, 10, 10);
      }
      ctx.restore();
    });

    // Reliquias
    State.relics.forEach(rel => {
      if (!rel.collected) {
        const cx = rel.c * w + w / 2;
        const cy = rel.r * h + h / 2;
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Llaves
    State.keys.forEach(k => {
      if (!k.collected) {
        const cx = k.c * w + w / 2;
        const cy = k.r * h + h / 2;
        ctx.font = '12px sans-serif';
        ctx.fillText('🔑', cx - 6, cy + 4);
      }
    });

    // Trampas de luz
    State.traps.forEach(tr => {
      const cx = tr.c * w + w / 2;
      const cy = tr.r * h + h / 2;
      ctx.strokeStyle = '#ffea00';
      ctx.setLineDash([2, 2]);
      ctx.strokeRect(cx - 8, cy - 8, 16, 16);
      ctx.setLineDash([]);
    });

    // Chispas
    State.sparks.forEach(sp => {
      ctx.fillStyle = '#ffea00';
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function renderPlayer(ctx) {
    const p = State.player;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;

    // Cuerpo circular del farolero
    ctx.beginPath();
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
    ctx.fill();

    // Farol en mano orientado según la dirección
    const dirOffset = 8;
    const lx = p.x + p.dirC * dirOffset;
    const ly = p.y + p.dirR * dirOffset;
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function renderCreatures(ctx) {
    State.creatures.forEach(c => {
      ctx.save();
      ctx.fillStyle = c.color;
      ctx.shadowColor = c.color;
      ctx.shadowBlur = (c.state === 'FLEE') ? 4 : 10;

      if (c.shape === 'diamond') {
        ctx.beginPath();
        ctx.moveTo(c.x, c.y - 7);
        ctx.lineTo(c.x + 7, c.y);
        ctx.lineTo(c.x, c.y + 7);
        ctx.lineTo(c.x - 7, c.y);
        ctx.closePath();
        ctx.fill();
      } else if (c.shape === 'square') {
        ctx.fillRect(c.x - 6, c.y - 6, 12, 12);
      } else if (c.shape === 'gazer') {
        ctx.beginPath();
        ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(c.x, c.y, 6.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  function renderLightingMask(ctx, w, h) {
    const lightCanvas = State.offscreenLightCanvas;
    const lightCtx = State.offscreenLightCtx;
    if (!lightCanvas || !lightCtx) return;

    lightCtx.clearRect(0, 0, w, h);

    // Oscuridad base según si hay destello o no
    if (State.flashActive) {
      // Destello ilumina todo momentáneamente
      return;
    }

    // Llenar capa con oscuridad profunda
    lightCtx.fillStyle = State.isBlackout ? 'rgba(0, 2, 8, 0.96)' : 'rgba(1, 4, 12, 0.91)';
    lightCtx.fillRect(0, 0, w, h);

    // Perforar agujeros de luz usando destination-out
    lightCtx.globalCompositeOperation = 'destination-out';

    const sources = getActiveLightSources();
    sources.forEach(ls => {
      const px = ls.x;
      const py = ls.y;
      const pixelRadius = ls.radius * State.cellW;

      const grad = lightCtx.createRadialGradient(px, py, pixelRadius * 0.2, px, py, pixelRadius);
      grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
      grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.7)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      lightCtx.fillStyle = grad;
      lightCtx.beginPath();
      lightCtx.arc(px, py, pixelRadius, 0, Math.PI * 2);
      lightCtx.fill();
    });

    lightCtx.globalCompositeOperation = 'source-over';

    // Dibujar la máscara de luz sobre el canvas principal
    ctx.drawImage(lightCanvas, 0, 0);
  }

  function renderParticles(ctx) {
    for (let i = State.particles.length - 1; i >= 0; i--) {
      const p = State.particles[i];
      p.x += p.vx * 0.016;
      p.y += p.vy * 0.016;
      p.life -= 0.016 * 2.0;

      if (p.life <= 0) {
        State.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function spawnFloatingText(x, y, text, color = '#fff') {
    State.floatingTexts.push({ x, y, text, color, life: 1.0 });
  }

  function renderFloatingTexts(ctx) {
    for (let i = State.floatingTexts.length - 1; i >= 0; i--) {
      const ft = State.floatingTexts[i];
      ft.y -= 25 * 0.016;
      ft.life -= 1.3 * 0.016;

      if (ft.life <= 0) {
        State.floatingTexts.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  // ==========================================
  // HUD, PERSISTENCIA Y SELECTOR
  // ==========================================
  function updateHUD() {
    dom.scoreVal.textContent = State.score.toLocaleString();
    const litLanterns = State.lanterns.filter(l => l.lit).length;
    dom.lanternsVal.textContent = `${litLanterns}/${State.lanterns.length}`;

    // Vidas
    dom.livesVal.textContent = '🕯️'.repeat(Math.max(0, State.lives));

    // Nivel
    const lvl = CONFIG.LEVELS[State.currentLevelIdx] || CONFIG.LEVELS[0];
    dom.levelDisplay.textContent = `M${lvl.world} • Nivel ${lvl.id}: ${lvl.name}`;

    // Chispas
    dom.pipSpark1.classList.toggle('ready', State.availableSparks >= 1);
    dom.pipSpark2.classList.toggle('ready', State.availableSparks >= 2);

    // Destello
    const flashReady = State.flashCooldown <= 0;
    dom.pipFlash.classList.toggle('ready', flashReady);
    dom.pipFlash.textContent = flashReady ? '⚡ LISTO' : `⚡ ${Math.ceil(State.flashCooldown)}s`;
  }

  function loadStorage() {
    try {
      // Migrar desde v1 si existe
      LumenLogic.migrateV1toV2(localStorage);

      const achRaw = localStorage.getItem(`${CONFIG.STORAGE_KEY_PREFIX}:achievements`);
      if (achRaw) State.achievements = JSON.parse(achRaw);

      const optRaw = localStorage.getItem(`${CONFIG.STORAGE_KEY_PREFIX}:options`);
      if (optRaw) {
        State.options = { ...State.options, ...JSON.parse(optRaw) };
        applyOptions();
      }
    } catch (e) {}
  }

  function saveStorage() {
    try {
      localStorage.setItem(`${CONFIG.STORAGE_KEY_PREFIX}:achievements`, JSON.stringify(State.achievements));
      localStorage.setItem(`${CONFIG.STORAGE_KEY_PREFIX}:options`, JSON.stringify(State.options));
    } catch (e) {}
  }

  function unlockAchievement(id) {
    if (State.achievements[id]) return;
    State.achievements[id] = true;
    saveStorage();
    playAudio('light_lantern');

    const ach = CONFIG.ACHIEVEMENTS.find(a => a.id === id);
    if (ach) {
      spawnFloatingText(CONFIG.VIRTUAL_W / 2, 60, `🏆 ¡LOGRO: ${ach.title}!`, '#ffaa00');
    }
  }

  function getLevelRecord(idx) {
    try {
      const key = `${CONFIG.STORAGE_KEY_PREFIX}:lvl_${idx}`;
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { score: 0, stars: 0 };
  }

  function saveLevelRecord(idx, score, stars) {
    try {
      const prev = getLevelRecord(idx);
      const newRec = {
        score: Math.max(score, prev.score),
        stars: Math.max(stars, prev.stars)
      };
      localStorage.setItem(`${CONFIG.STORAGE_KEY_PREFIX}:lvl_${idx}`, JSON.stringify(newRec));
    } catch (e) {}
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

  function applyOptions() {
    dom.optSfx.checked = State.options.sfx;
    dom.optBgm.checked = State.options.bgm;
    dom.optVibration.checked = State.options.vibration;
    dom.optContrast.checked = State.options.contrast;

    if (State.options.contrast) document.body.classList.add('high-contrast');
    else document.body.classList.remove('high-contrast');

    if (!State.options.bgm) stopBGM();
    else if (State.state === 'PLAYING') startBGM();
  }

  function renderLevelSelector(worldNum = 1) {
    dom.levelsGrid.innerHTML = '';
    const unlockedLevel = getUnlockedLevel();

    const worldLevels = CONFIG.LEVELS.filter(l => l.world === worldNum);
    worldLevels.forEach(lvl => {
      const idx = lvl.id - 1;
      const badge = document.createElement('div');
      badge.className = 'level-badge';
      const isUnlocked = idx <= unlockedLevel;
      const isCurrent = idx === State.currentLevelIdx;

      if (isUnlocked) badge.classList.add('unlocked');
      if (isCurrent) badge.classList.add('current');
      if (!isUnlocked) badge.classList.add('locked');

      const numSpan = document.createElement('span');
      numSpan.className = 'level-num';
      numSpan.textContent = lvl.id;
      badge.appendChild(numSpan);

      const starsSpan = document.createElement('span');
      starsSpan.className = 'level-stars';
      const rec = getLevelRecord(idx);
      starsSpan.textContent = rec.stars > 0 ? '★'.repeat(rec.stars) : (isUnlocked ? '---' : '🔒');
      badge.appendChild(starsSpan);

      if (isUnlocked) {
        badge.addEventListener('click', () => {
          playAudio('spark_drop');
          startLevel(idx);
        });
      }

      dom.levelsGrid.appendChild(badge);
    });

    const wCfg = CONFIG.WORLDS[worldNum - 1];
    dom.worldBadge.textContent = `MUNDO ${wCfg.id}: ${wCfg.name.toUpperCase()}`;
    dom.worldDesc.textContent = `Niveles ${worldLevels[0].id} al ${worldLevels[worldLevels.length - 1].id} • ${wCfg.rule}`;
  }

  // ==========================================
  // CONFIGURACIÓN DE ENTRADAS Y EVENTOS DOM
  // ==========================================
  function setupInputs() {
    window.addEventListener('keydown', (e) => {
      if (State.state !== 'PLAYING') return;
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': setPlayerDirection(-1, 0); break;
        case 'ArrowDown': case 's': case 'S': setPlayerDirection(1, 0); break;
        case 'ArrowLeft': case 'a': case 'A': setPlayerDirection(0, -1); break;
        case 'ArrowRight': case 'd': case 'D': setPlayerDirection(0, 1); break;
        case 'j': case 'J': case ' ': dropSpark(); break;
        case 'k': case 'K': activateFlash(); break;
      }
    });

    // Controles táctiles D-Pad
    dom.btnDpadUp.addEventListener('touchstart', (e) => { e.preventDefault(); setPlayerDirection(-1, 0); });
    dom.btnDpadDown.addEventListener('touchstart', (e) => { e.preventDefault(); setPlayerDirection(1, 0); });
    dom.btnDpadLeft.addEventListener('touchstart', (e) => { e.preventDefault(); setPlayerDirection(0, -1); });
    dom.btnDpadRight.addEventListener('touchstart', (e) => { e.preventDefault(); setPlayerDirection(0, 1); });

    dom.btnDpadUp.addEventListener('mousedown', () => setPlayerDirection(-1, 0));
    dom.btnDpadDown.addEventListener('mousedown', () => setPlayerDirection(1, 0));
    dom.btnDpadLeft.addEventListener('mousedown', () => setPlayerDirection(0, -1));
    dom.btnDpadRight.addEventListener('mousedown', () => setPlayerDirection(0, 1));

    dom.btnActionSpark.addEventListener('click', dropSpark);
    dom.btnActionFlash.addEventListener('click', activateFlash);

    // Swipes en canvas
    let touchStartX = 0;
    let touchStartY = 0;
    dom.canvas.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    dom.canvas.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.hypot(dx, dy) > 25) {
        if (Math.abs(dx) > Math.abs(dy)) {
          setPlayerDirection(0, dx > 0 ? 1 : -1);
        } else {
          setPlayerDirection(dy > 0 ? 1 : -1, 0);
        }
      }
    }, { passive: true });
  }

  function setupUI() {
    dom.worldTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        dom.worldTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const world = parseInt(tab.dataset.world, 10);
        renderLevelSelector(world);
      });
    });

    dom.btnPauseHeader.addEventListener('click', () => {
      if (State.state === 'PLAYING') {
        State.state = 'PAUSED';
        stopBGM();
        dom.overlayPause.classList.remove('hidden');
      }
    });

    dom.btnResume.addEventListener('click', () => {
      dom.overlayPause.classList.add('hidden');
      State.state = 'PLAYING';
      startBGM();
    });

    dom.btnRestartLevel.addEventListener('click', () => {
      dom.overlayPause.classList.add('hidden');
      startLevel(State.currentLevelIdx);
    });

    dom.btnLevelSelect.addEventListener('click', () => {
      dom.overlayPause.classList.add('hidden');
      dom.startCard.classList.remove('hidden');
      renderLevelSelector(State.currentWorld);
    });

    dom.btnNextLevel.addEventListener('click', () => {
      dom.overlayResult.classList.add('hidden');
      startLevel(State.currentLevelIdx + 1);
    });

    dom.btnRetryLevel.addEventListener('click', () => {
      dom.overlayResult.classList.add('hidden');
      startLevel(State.currentLevelIdx);
    });

    dom.btnExitToLevels.addEventListener('click', () => {
      dom.overlayResult.classList.add('hidden');
      dom.startCard.classList.remove('hidden');
      renderLevelSelector(State.currentWorld);
    });

    // Modo Sin Fin (Noche Perpetua)
    dom.btnStartEndless.addEventListener('click', () => {
      const endlessMap = LumenLogic.generateEndlessMaze(Date.now());
      CONFIG.LEVELS[0].map = endlessMap;
      startLevel(0, false);
      State.isEndless = true;
    });

    // Desafío Diario
    dom.btnOpenDaily.addEventListener('click', () => {
      dom.modalDaily.classList.remove('hidden');
    });

    dom.btnCloseDaily.addEventListener('click', () => {
      dom.modalDaily.classList.add('hidden');
    });

    dom.btnPlayDaily.addEventListener('click', () => {
      dom.modalDaily.classList.add('hidden');
      const seed = parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''), 10);
      const dailyMap = LumenLogic.generateEndlessMaze(seed);
      CONFIG.LEVELS[0].map = dailyMap;
      startLevel(0, true);
    });

    // Logros y Opciones
    dom.btnAchievementsToggle.addEventListener('click', () => {
      dom.achList.innerHTML = '';
      CONFIG.ACHIEVEMENTS.forEach(ach => {
        const item = document.createElement('div');
        const isUnlocked = !!State.achievements[ach.id];
        item.className = `ach-item ${isUnlocked ? 'unlocked' : ''}`;
        item.innerHTML = `
          <span class="ach-icon">${ach.icon}</span>
          <div style="display:flex; flex-direction:column;">
            <span class="ach-title">${ach.title}</span>
            <span class="ach-desc">${ach.desc}</span>
          </div>
          <span class="ach-status">${isUnlocked ? 'CONSEGUIDO' : 'BLOQUEADO'}</span>
        `;
        dom.achList.appendChild(item);
      });
      dom.modalAchievements.classList.remove('hidden');
    });

    dom.btnCloseAch.addEventListener('click', () => {
      dom.modalAchievements.classList.add('hidden');
    });

    dom.btnOptionsToggle.addEventListener('click', () => {
      dom.modalOptions.classList.remove('hidden');
    });

    dom.btnCloseOptions.addEventListener('click', () => {
      State.options.sfx = dom.optSfx.checked;
      State.options.bgm = dom.optBgm.checked;
      State.options.vibration = dom.optVibration.checked;
      State.options.contrast = dom.optContrast.checked;
      saveStorage();
      applyOptions();
      dom.modalOptions.classList.add('hidden');
    });

    dom.btnSoundToggle.addEventListener('click', () => {
      if (window.ArcadeAudio) {
        window.ArcadeAudio.toggleMute();
        const muted = window.ArcadeAudio.isMuted;
        dom.iconSoundOn.classList.toggle('hidden', muted);
        dom.iconSoundOff.classList.toggle('hidden', !muted);
      }
    });

    window.addEventListener('resize', handleResize);
  }

  function handleResize() {
    const canvas = dom.canvas;
    const container = dom.container;
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const availableH = rect.height - dom.header.offsetHeight - dom.subBar.offsetHeight - 130;
    canvas.width = rect.width * dpr;
    canvas.height = availableH * dpr;

    State.cellW = (rect.width) / CONFIG.COLS;
    State.cellH = (availableH) / CONFIG.ROWS;

    State.ctx = canvas.getContext('2d');
    State.ctx.scale(dpr, dpr);

    // Inicializar canvas offscreen
    if (!State.offscreenMazeCanvas) {
      State.offscreenMazeCanvas = document.createElement('canvas');
      State.offscreenLightCanvas = document.createElement('canvas');
    }
    State.offscreenMazeCanvas.width = rect.width;
    State.offscreenMazeCanvas.height = availableH;
    State.offscreenMazeCtx = State.offscreenMazeCanvas.getContext('2d');

    State.offscreenLightCanvas.width = rect.width;
    State.offscreenLightCanvas.height = availableH;
    State.offscreenLightCtx = State.offscreenLightCanvas.getContext('2d');

    renderOffscreenMaze();
  }

  // ==========================================
  // BUCLE DE SIMULACIÓN Y RENDERIZADO
  // ==========================================
  function gameLoop(time) {
    if (!State.lastTime) State.lastTime = time;
    const dt = Math.min((time - State.lastTime) * 0.001, 0.08);
    State.lastTime = time;

    // Métricas de FPS y Frame Time
    State.frameCount++;
    if (time - State.lastFpsUpdate > 500) {
      State.fps = (State.frameCount * 1000) / (time - State.lastFpsUpdate);
      State.frameTime = dt * 1000;
      State.frameCount = 0;
      State.lastFpsUpdate = time;

      // Perfil de bajo consumo si FPS baja de 55 sostenido
      if (State.fps < 55 && !State.lowSpecMode) {
        State.lowSpecMode = true;
      }
    }

    if (State.state === 'PLAYING') {
      updatePlayerMovement(dt);
      updateCreatures(dt);
      updateWorldLogic(dt);
    }

    render(time);
    requestAnimationFrame(gameLoop);
  }

  function init() {
    // Modo de depuración (?debug=1)
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === '1') {
      State.isDebug = true;
      dom.debugOverlay.classList.remove('hidden');
    }

    loadStorage();
    handleResize();
    setupInputs();
    setupUI();
    renderLevelSelector(1);
    requestAnimationFrame(gameLoop);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
