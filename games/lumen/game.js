/**
 * games/lumen/game.js - Lumen Arcade 80s
 * Laberinto de luz y persecución. Enciende faroles, huye de las criaturas de la oscuridad,
 * suelta chispas y destellos de emergencia.
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
    PLAYER_SPEED: 4.2, // Celdas por segundo
    CREATURE_SPEED: 3.6,
    TRAGALUZ_SPEED: 2.2,
    FLEE_SPEED: 2.8,

    PLAYER_LIGHT_RADIUS: 1.8,
    LANTERN_MAX_LIGHT_RADIUS: 3.8,
    SPARK_LIGHT_RADIUS: 2.6,
    SPARK_DURATION: 6.5, // Segundos activa
    SPARK_RECHARGE_TIME: 16.0,
    FLASH_DURATION: 5.5,

    MAX_SPARKS: 2,
    STARTING_LIVES: 3,
    STORAGE_KEY: 'lumen:v1:best_score',

    // 12 Niveles de Laberinto definidos como datos puros
    // '#' = Pared, '.' = Pasillo, 'L' = Farol, 'P' = Jugador, 'E' = Spawn Criatura, 'T' = Túnel lateral
    LEVELS: [
    {
        "id": 1,
        "name": "El Atrio Oscuro",
        "map": [
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
        ]
    },
    {
        "id": 2,
        "name": "Claustro de Sombras",
        "map": [
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
            "#.##...L...##.#",
            "#.####...####.#",
            "#.####...####.#",
            "#L...........L#",
            "###############"
        ]
    },
    {
        "id": 3,
        "name": "Cripta Olvidada",
        "map": [
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
        ]
    },
    {
        "id": 4,
        "name": "La Galería Ciega",
        "map": [
            "###############",
            "#L...........L#",
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
        ]
    },
    {
        "id": 5,
        "name": "Encrucijada Ámbar",
        "map": [
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
        ]
    },
    {
        "id": 6,
        "name": "Laberinto del Resplandor",
        "map": [
            "###############",
            "#L.....L.....L#",
            "#.##.##.##.##.#",
            "#.##.##.##.##.#",
            "#.............#",
            "#.####...####.#",
            "#.####...####.#",
            "#......L......#",
            "#......E......#",
            "T.............T",
            "#.............#",
            "#......P......#",
            "#.####...####.#",
            "#.####...####.#",
            "#......L......#",
            "#.##.##.##.##.#",
            "#.##.##.##.##.#",
            "#L.....L.....L#",
            "###############"
        ]
    },
    {
        "id": 7,
        "name": "El Refugio Pétreo",
        "map": [
            "###############",
            "#L...........L#",
            "#..##.###.##..#",
            "#..##.###.##..#",
            "#..##.....##..#",
            "#..##..L..##..#",
            "#.....###.....#",
            "#.#...###...#.#",
            "#.#....E....#.#",
            "T.............T",
            "#......L......#",
            "#.#....P....#.#",
            "#.#...###...#.#",
            "#.....###.....#",
            "#L.##.###.##.L#",
            "#..##.###.##..#",
            "#..##.....##..#",
            "#L.....L......#",
            "###############"
        ]
    },
    {
        "id": 8,
        "name": "Pasajes de Niebla",
        "map": [
            "###############",
            "#L...........L#",
            "#.#..#####..#.#",
            "#.#..#####..#.#",
            "#.#....L....#.#",
            "#..###...###..#",
            "#..###...###..#",
            "#.....###.....#",
            "#.....#E#.....#",
            "T.............T",
            "#......L......#",
            "#......P......#",
            "#..###...###..#",
            "#..###...###..#",
            "#......L......#",
            "#.#..#####..#.#",
            "#.#..#####..#.#",
            "#L#.........#L#",
            "###############"
        ]
    },
    {
        "id": 9,
        "name": "Cámara de Ecos",
        "map": [
            "###############",
            "#L.....L.....L#",
            "#.####...####.#",
            "#.####.#.####.#",
            "#......#......#",
            "#.###..#..###.#",
            "#.###.....###.#",
            "#.###.....###.#",
            "#......E......#",
            "T.............T",
            "#L...........L#",
            "#......P......#",
            "#.###.....###.#",
            "#.###.....###.#",
            "#.###..#..###.#",
            "#.####.#.####.#",
            "#.####.#.####.#",
            "#L.....L.....L#",
            "###############"
        ]
    },
    {
        "id": 10,
        "name": "La Espiral Sombría",
        "map": [
            "###############",
            "#L...........L#",
            "#.##.#####.##.#",
            "#.##.......##.#",
            "#.##...L...##.#",
            "#....#####....#",
            "#.##.#####.##.#",
            "#.##.......##.#",
            "#.##...E...##.#",
            "T.............T",
            "#......L......#",
            "#.##...P...##.#",
            "#.##.......##.#",
            "#.##.#####.##.#",
            "#....#####....#",
            "#.##...L...##.#",
            "#L##.......##L#",
            "#.##.#####.##.#",
            "###############"
        ]
    },
    {
        "id": 11,
        "name": "Bastión del Fuego Fatuo",
        "map": [
            "###############",
            "#L...........L#",
            "#..###.#.###..#",
            "#..###.#.###..#",
            "#......#......#",
            "#.##...L...##.#",
            "#.##.##.##.##.#",
            "#....##.##....#",
            "#L.....E.....L#",
            "T......L......T",
            "#.............#",
            "#......P......#",
            "#....##.##....#",
            "#.##.##.##.##.#",
            "#.##...L...##.#",
            "#..###.#.###..#",
            "#..###.#.###..#",
            "#L.....#.....L#",
            "###############"
        ]
    },
    {
        "id": 12,
        "name": "Santuario del Alba",
        "map": [
            "###############",
            "#L...L...L...L#",
            "#.##..###..##.#",
            "#.##..###..##.#",
            "#.............#",
            "#.###.....###.#",
            "#.###.....###.#",
            "#.###.....###.#",
            "#......E......#",
            "T.............T",
            "#......L......#",
            "#......P......#",
            "#.###.....###.#",
            "#.###.....###.#",
            "#.###.....###.#",
            "#.##..###..##.#",
            "#.##..###..##.#",
            "#L...L...L...L#",
            "###############"
        ]
    }
]
  };

  // ==========================================
  // LÓGICA PURA Y SIMULACIÓN (Testeable en Node)
  // ==========================================
  const LumenLogic = {
    /**
     * Parsea un mapa en formato string a matriz de celdas y extrae entidades
     */
    parseMap(mapRows) {
      const rows = mapRows.length;
      const cols = mapRows[0].length;
      const grid = new Array(rows);
      const lanterns = [];
      let playerStart = null;
      const enemySpawns = [];
      const tunnels = [];

      for (let r = 0; r < rows; r++) {
        grid[r] = new Array(cols);
        for (let c = 0; c < cols; c++) {
          const ch = mapRows[r][c];
          if (ch === '#') {
            grid[r][c] = 1; // Muro
          } else {
            grid[r][c] = 0; // Pasillo
            if (ch === 'L') {
              lanterns.push({ r, c, lit: false, radius: 0, offTimer: 0 });
            } else if (ch === 'P') {
              playerStart = { r, c };
            } else if (ch === 'E') {
              enemySpawns.push({ r, c });
            } else if (ch === 'T') {
              tunnels.push({ r, c });
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
        tunnels
      };
    },

    /**
     * Retorna vecinos transitables [r, c] de una celda, considerando túneles de envoltura
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
     * Algoritmo de Búsqueda en Anchura (BFS) para encontrar la ruta más corta hacia una meta
     */
    findPath(grid, startR, startC, targetR, targetC) {
      if (startR === targetR && startC === targetC) return [];

      const rows = grid.length;
      const cols = grid[0].length;
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

      // Reconstruir camino hacia atrás
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
     * Comprueba si el laberinto es conexo: todas las celdas de pasillo deben ser alcanzables
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
     * Encuentra la celda transitable más cercana fuera de las zonas iluminadas (Estado Huida)
     */
    findEscapeTarget(grid, creatureR, creatureC, lightSources) {
      const rows = grid.length;
      const cols = grid[0].length;
      const queue = [{ r: creatureR, c: creatureC, dist: 0 }];
      const visited = new Set();
      visited.add(`${creatureR},${creatureC}`);

      while (queue.length > 0) {
        const curr = queue.shift();

        // Verificar si la celda está en oscuridad
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

      // Si todo está iluminado, huir a la celda más alejada
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
    boardW: 330,
    boardH: 418,
    cellSize: 22,

    grid: null,
    levelIdx: 0,
    score: 0,
    bestScore: 0,
    lives: CONFIG.STARTING_LIVES,

    state: 'MENU', // 'MENU', 'PLAYING', 'PAUSED', 'DEATH', 'GAMEOVER', 'VICTORY'

    // Jugador (Farolero)
    player: {
      r: 11,
      c: 7,
      x: 7.5,
      y: 11.5,
      dirR: 0,
      dirC: 0,
      nextDirR: 0,
      nextDirC: 0,
      lightRadius: CONFIG.PLAYER_LIGHT_RADIUS
    },

    // Faroles
    lanterns: [],
    litLanternsCount: 0,

    // Criaturas de la oscuridad
    creatures: [],

    // Chispas activas en el suelo
    sparks: [],
    sparkCharges: CONFIG.MAX_SPARKS,
    sparkRechargeTimer: 0,

    // Destello de emergencia
    flashUsedThisLevel: false,
    flashActiveTimer: 0,

    // Partículas vectoriales
    particles: [],

    // Caché de renderizado estático del laberinto
    staticCanvas: null,

    lastTime: 0
  };

  // Elementos DOM
  const dom = {
    container: document.getElementById('game-container'),
    canvas: document.getElementById('game-canvas'),

    scoreVal: document.getElementById('score-val'),
    lanternsVal: document.getElementById('lanterns-val'),
    livesVal: document.getElementById('lives-val'),
    levelDisplay: document.getElementById('level-display'),

    pipSpark1: document.getElementById('pip-spark-1'),
    pipSpark2: document.getElementById('pip-spark-2'),
    pipFlash: document.getElementById('pip-flash'),

    btnDpadUp: document.getElementById('btn-dpad-up'),
    btnDpadLeft: document.getElementById('btn-dpad-left'),
    btnDpadRight: document.getElementById('btn-dpad-right'),
    btnDpadDown: document.getElementById('btn-dpad-down'),

    btnActionSpark: document.getElementById('btn-action-spark'),
    btnActionFlash: document.getElementById('btn-action-flash'),

    btnSoundToggle: document.getElementById('btn-sound-toggle'),
    iconSoundOn: document.getElementById('icon-sound-on'),
    iconSoundOff: document.getElementById('icon-sound-off'),
    btnPauseHeader: document.getElementById('btn-pause-header'),

    startCard: document.getElementById('start-card'),
    levelsGrid: document.getElementById('levels-grid'),
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
    resultLanternsVal: document.getElementById('result-lanterns-val'),
    resultBestVal: document.getElementById('result-best-val'),
    btnNextLevel: document.getElementById('btn-next-level'),
    btnRetryLevel: document.getElementById('btn-retry-level'),
    btnExitToLevels: document.getElementById('btn-exit-to-levels')
  };

  // ==========================================
  // AUDIO SINTETIZADO CON WEB AUDIO
  // ==========================================
  function playAudio(type) {
    if (!window.ArcadeAudio || window.ArcadeAudio.isMuted) return;

    try {
      const actx = window.ArcadeAudio.ctx;
      if (!actx) return;
      const now = actx.currentTime;

      switch (type) {
        case 'light_lantern': {
          // Tintineo armónico cristalino ascendente
          const freqs = [523.25, 659.25, 783.99, 1046.50];
          freqs.forEach((f, idx) => {
            const osc = actx.createOscillator();
            const gain = actx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now + idx * 0.05);
            gain.gain.setValueAtTime(0.25, now + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.3);
            osc.connect(gain);
            gain.connect(actx.destination);
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.3);
          });
          break;
        }

        case 'spark': {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        }

        case 'flash': {
          // Destello masivo con onda expansiva
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(1800, now + 0.4);
          gain.gain.setValueAtTime(0.4, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.4);
          break;
        }

        case 'creature_flee': {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.exponentialRampToValueAtTime(120, now + 0.2);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.2);
          break;
        }

        case 'lantern_snuffed': {
          // Sonido sordo de luz apagada por la sombra
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(60, now + 0.3);
          gain.gain.setValueAtTime(0.35, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.3);
          break;
        }

        case 'player_hit': {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.linearRampToValueAtTime(40, now + 0.35);
          gain.gain.setValueAtTime(0.4, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.35);
          break;
        }

        case 'victory': {
          const melody = [523.25, 659.25, 783.99, 1046.50, 1318.51];
          melody.forEach((freq, idx) => {
            const osc = actx.createOscillator();
            const gain = actx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.1);
            gain.gain.setValueAtTime(0.25, now + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);
            osc.connect(gain);
            gain.connect(actx.destination);
            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 0.35);
          });
          break;
        }
      }
    } catch (e) {}
  }

  // ==========================================
  // PARTÍCULAS VECTORIALES
  // ==========================================
  const ParticlePool = {
    pool: [],
    spawn(x, y, color, count = 8, speed = 80) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = (Math.random() * 0.7 + 0.3) * speed;
        const p = this.pool.pop() || {};
        p.x = x;
        p.y = y;
        p.vx = Math.cos(angle) * velocity;
        p.vy = Math.sin(angle) * velocity;
        p.color = color;
        p.size = Math.random() * 3 + 2;
        p.life = 0;
        p.maxLife = Math.random() * 0.4 + 0.3;
        State.particles.push(p);
      }
    },
    update(dt) {
      for (let i = State.particles.length - 1; i >= 0; i--) {
        const p = State.particles[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          State.particles.splice(i, 1);
          if (this.pool.length < 150) this.pool.push(p);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.size = Math.max(0.1, p.size * (1 - dt * 2));
      }
    },
    render(ctx) {
      for (let i = 0; i < State.particles.length; i++) {
        const p = State.particles[i];
        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  };

  // ==========================================
  // INICIALIZACIÓN DE NIVEL Y CACHÉ ESTÁTICO
  // ==========================================
  function startLevel(lvlIdx) {
    State.levelIdx = lvlIdx;
    const lvl = CONFIG.LEVELS[lvlIdx];
    const parsed = LumenLogic.parseMap(lvl.map);

    State.grid = parsed.grid;
    State.lanterns = parsed.lanterns;
    State.litLanternsCount = 0;
    State.flashUsedThisLevel = false;
    State.flashActiveTimer = 0;
    State.sparks = [];
    State.sparkCharges = CONFIG.MAX_SPARKS;
    State.sparkRechargeTimer = 0;
    State.particles = [];

    // Colocar jugador
    State.player.r = parsed.playerStart.r;
    State.player.c = parsed.playerStart.c;
    State.player.x = parsed.playerStart.c + 0.5;
    State.player.y = parsed.playerStart.r + 0.5;
    State.player.dirR = 0;
    State.player.dirC = 0;
    State.player.nextDirR = 0;
    State.player.nextDirC = 0;

    // Crear las 4 criaturas geométricas originales
    State.creatures = [];
    const creatureTypes = [
      { id: 'VORAZ',      speed: CONFIG.CREATURE_SPEED, color: '#ff0055', shape: 'OCTAGRAM' },
      { id: 'ACECHADOR',  speed: CONFIG.CREATURE_SPEED * 1.05, color: '#cc00ff', shape: 'CHEVRON' },
      { id: 'CENTINELA',  speed: CONFIG.CREATURE_SPEED * 0.95, color: '#00ffff', shape: 'HEXRING' },
      { id: 'TRAGALUZ',   speed: CONFIG.TRAGALUZ_SPEED, color: '#ffaa00', shape: 'OBELISK' }
    ];

    const spawns = parsed.enemySpawns;
    creatureTypes.forEach((type, idx) => {
      const spawn = spawns[idx % spawns.length];
      State.creatures.push({
        type: type.id,
        shape: type.shape,
        baseSpeed: type.speed,
        color: type.color,
        r: spawn.r,
        c: spawn.c,
        x: spawn.c + 0.5,
        y: spawn.r + 0.5,
        dirR: 0,
        dirC: 0,
        state: 'HUNT', // 'HUNT' o 'FLEE'
        fleeTimer: 0,
        targetR: 0,
        targetC: 0,
        path: [],
        staggerTimer: (idx * 0.12) // Desfasar cálculo BFS para rendimiento óptimo
      });
    });

    // Pre-renderizar laberinto estático en canvas offscreen
    buildStaticMazeCache();

    State.state = 'PLAYING';

    dom.startCard.classList.add('hidden');
    dom.overlayPause.classList.add('hidden');
    dom.overlayResult.classList.add('hidden');

    updateHUD();
  }

  function buildStaticMazeCache() {
    const cs = State.cellSize;
    const w = CONFIG.COLS * cs;
    const h = CONFIG.ROWS * cs;

    State.staticCanvas = document.createElement('canvas');
    State.staticCanvas.width = w;
    State.staticCanvas.height = h;
    const sctx = State.staticCanvas.getContext('2d');

    // Fondo del laberinto
    sctx.fillStyle = '#060a14';
    sctx.fillRect(0, 0, w, h);

    // Dibujar muros neón
    for (let r = 0; r < CONFIG.ROWS; r++) {
      for (let c = 0; c < CONFIG.COLS; c++) {
        if (State.grid[r][c] === 1) {
          const x = c * cs;
          const y = r * cs;

          // Muro estilizado con bisel retro neón
          sctx.fillStyle = '#0d1829';
          sctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);

          sctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
          sctx.lineWidth = 1.5;
          sctx.strokeRect(x + 2, y + 2, cs - 4, cs - 4);

          // Núcleo central fosfórico
          sctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
          sctx.fillRect(x + 5, y + 5, cs - 10, cs - 10);
        } else {
          // Suelo de piedra oscuro
          const x = c * cs;
          const y = r * cs;
          sctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
          sctx.fillRect(x + cs / 2 - 1, y + cs / 2 - 1, 2, 2);
        }
      }
    }
  }

  function updateHUD() {
    dom.scoreVal.textContent = State.score.toLocaleString();
    dom.lanternsVal.textContent = `${State.litLanternsCount}/${State.lanterns.length}`;

    let livesStr = '';
    for (let i = 0; i < State.lives; i++) livesStr += '🕯️';
    dom.livesVal.textContent = livesStr || '💀';

    const lvl = CONFIG.LEVELS[State.levelIdx];
    dom.levelDisplay.textContent = `Nivel ${State.levelIdx + 1}: ${lvl.name}`;

    // Chispas
    dom.pipSpark1.classList.toggle('ready', State.sparkCharges >= 1);
    dom.pipSpark2.classList.toggle('ready', State.sparkCharges >= 2);

    // Destello
    dom.pipFlash.classList.toggle('ready', !State.flashUsedThisLevel);
    dom.pipFlash.textContent = State.flashUsedThisLevel ? '⚡ USADO' : '⚡ LISTO';
  }

  // ==========================================
  // HABILIDADES: CHISPA Y DESTELLO
  // ==========================================
  function dropSpark() {
    if (State.state !== 'PLAYING') return;
    if (State.sparkCharges <= 0) return;

    State.sparkCharges--;
    playAudio('spark');
    window.ArcadeCanvas?.haptic(10);

    State.sparks.push({
      x: State.player.x,
      y: State.player.y,
      r: Math.floor(State.player.y),
      c: Math.floor(State.player.x),
      timer: CONFIG.SPARK_DURATION,
      maxTimer: CONFIG.SPARK_DURATION,
      radius: CONFIG.SPARK_LIGHT_RADIUS
    });

    const cs = State.cellSize;
    ParticlePool.spawn(State.player.x * cs, State.player.y * cs, '#ffaa00', 16, 120);
    updateHUD();
  }

  function triggerEmergencyFlash() {
    if (State.state !== 'PLAYING') return;
    if (State.flashUsedThisLevel) return;

    State.flashUsedThisLevel = true;
    State.flashActiveTimer = CONFIG.FLASH_DURATION;
    playAudio('flash');
    window.ArcadeCanvas?.haptic(35);

    // Ahuyentar a todas las criaturas inmediatamente
    State.creatures.forEach(cr => {
      cr.state = 'FLEE';
      cr.fleeTimer = CONFIG.FLASH_DURATION;
    });

    updateHUD();
  }

  // ==========================================
  // MOVIMIENTO DEL JUGADOR CON GIROS ENCOLADOS
  // ==========================================
  function setPlayerNextDirection(dr, dc) {
    State.player.nextDirR = dr;
    State.player.nextDirC = dc;

    // Si el jugador está detenido o intentando dar la vuelta exactamente 180°
    if (State.player.dirR === -dr && State.player.dirC === -dc) {
      State.player.dirR = dr;
      State.player.dirC = dc;
    }
  }

  function updatePlayer(dt) {
    const p = State.player;
    const speed = CONFIG.PLAYER_SPEED * dt;

    // Verificar si se puede aplicar el giro encolado
    if (p.nextDirR !== 0 || p.nextDirC !== 0) {
      const centerDistX = Math.abs((p.x - Math.floor(p.x)) - 0.5);
      const centerDistY = Math.abs((p.y - Math.floor(p.y)) - 0.5);

      // Si está suficientemente cerca del centro de la celda
      if (centerDistX < 0.22 && centerDistY < 0.22) {
        const curR = Math.floor(p.y);
        const curC = Math.floor(p.x);
        const testR = curR + p.nextDirR;
        let testC = curC + p.nextDirC;

        // Wrap túneles
        if (testC < 0 && State.grid[curR][CONFIG.COLS - 1] === 0) testC = CONFIG.COLS - 1;
        else if (testC >= CONFIG.COLS && State.grid[curR][0] === 0) testC = 0;

        if (testR >= 0 && testR < CONFIG.ROWS && testC >= 0 && testC < CONFIG.COLS) {
          if (State.grid[testR][testC] === 0) {
            // Alinear al centro exacto y cambiar dirección
            p.x = curC + 0.5;
            p.y = curR + 0.5;
            p.dirR = p.nextDirR;
            p.dirC = p.nextDirC;
            p.nextDirR = 0;
            p.nextDirC = 0;
          }
        }
      }
    }

    // Avanzar en la dirección actual
    if (p.dirR !== 0 || p.dirC !== 0) {
      let nextX = p.x + p.dirC * speed;
      let nextY = p.y + p.dirR * speed;

      const targetCellR = Math.floor(p.y + p.dirR * 0.49);
      let targetCellC = Math.floor(p.x + p.dirC * 0.49);

      // Wrap lateral
      if (nextX < 0) nextX = CONFIG.COLS - 0.1;
      else if (nextX >= CONFIG.COLS) nextX = 0.1;

      // Colisión con muro
      const checkR = Math.floor(nextY + p.dirR * 0.45);
      const checkC = Math.floor(nextX + p.dirC * 0.45);

      if (checkR >= 0 && checkR < CONFIG.ROWS && checkC >= 0 && checkC < CONFIG.COLS) {
        if (State.grid[checkR][checkC] === 1) {
          // Chocó con muro: encajar en centro de celda actual y detenerse
          p.x = Math.floor(p.x) + 0.5;
          p.y = Math.floor(p.y) + 0.5;
          p.dirR = 0;
          p.dirC = 0;
          return;
        }
      }

      p.x = nextX;
      p.y = nextY;
      p.r = Math.floor(p.y);
      p.c = Math.floor(p.x);
    }

    // Comprobar si pisa un farol
    for (const lan of State.lanterns) {
      if (!lan.lit && lan.offTimer <= 0) {
        const dist = Math.hypot(p.x - (lan.c + 0.5), p.y - (lan.r + 0.5));
        if (dist < 0.6) {
          lan.lit = true;
          lan.radius = 1.0; // Inicia creciendo
          State.litLanternsCount++;
          State.score += 250;
          playAudio('light_lantern');
          window.ArcadeCanvas?.haptic(15);

          const cs = State.cellSize;
          ParticlePool.spawn((lan.c + 0.5) * cs, (lan.r + 0.5) * cs, '#00f0ff', 20, 140);
          updateHUD();

          // Comprobar victoria
          if (State.litLanternsCount === State.lanterns.length) {
            triggerVictory();
          }
        }
      }
    }
  }

  // ==========================================
  // IA DE CRIATURAS DE LA OSCURIDAD
  // ==========================================
  function updateCreatures(dt) {
    const lightSources = getActiveLightSources();

    State.creatures.forEach(cr => {
      // 1. Determinar si la criatura está inmersa en luz
      let inLight = false;
      if (State.flashActiveTimer > 0) {
        inLight = true;
      } else {
        for (const ls of lightSources) {
          const dist = Math.hypot(cr.x - ls.x, cr.y - ls.y);
          if (dist <= ls.radius) {
            inLight = true;
            break;
          }
        }
      }

      if (inLight) {
        if (cr.state !== 'FLEE') {
          cr.state = 'FLEE';
          cr.fleeTimer = 3.5;
          playAudio('creature_flee');
        }
      } else if (cr.fleeTimer > 0) {
        cr.fleeTimer -= dt;
        if (cr.fleeTimer <= 0) {
          cr.state = 'HUNT';
        }
      }

      // 2. Recálculo escalonado de rutas BFS
      cr.staggerTimer -= dt;
      if (cr.staggerTimer <= 0) {
        cr.staggerTimer = 0.28; // Actualizar cada ~280ms desfasado
        calculateCreatureTarget(cr, lightSources);
      }

      // 3. Movimiento hacia el siguiente nodo de su ruta
      moveCreatureAlongPath(cr, dt);

      // 4. Interacción con el jugador (Muerte / Pérdida de vida)
      const distToPlayer = Math.hypot(cr.x - State.player.x, cr.y - State.player.y);
      if (distToPlayer < 0.65) {
        if (cr.state === 'HUNT') {
          handlePlayerCaught();
        }
      }

      // 5. Interacción del Tragaluz con faroles (Apagar farol encendido)
      if (cr.type === 'TRAGALUZ' && cr.state === 'HUNT') {
        for (const lan of State.lanterns) {
          if (lan.lit) {
            const distLan = Math.hypot(cr.x - (lan.c + 0.5), cr.y - (lan.r + 0.5));
            if (distLan < 0.7) {
              lan.lit = false;
              lan.radius = 0;
              lan.offTimer = 9.0; // Desactivado por 9 segundos
              State.litLanternsCount--;
              playAudio('lantern_snuffed');
              window.ArcadeCanvas?.haptic(20);

              const cs = State.cellSize;
              ParticlePool.spawn((lan.c + 0.5) * cs, (lan.r + 0.5) * cs, '#ff3366', 15, 100);
              updateHUD();
              break;
            }
          }
        }
      }
    });
  }

  function calculateCreatureTarget(cr, lightSources) {
    const curR = Math.floor(cr.y);
    const curC = Math.floor(cr.x);

    let targetR = State.player.r;
    let targetC = State.player.c;

    if (cr.state === 'FLEE') {
      // Buscar celda segura de escape
      const escape = LumenLogic.findEscapeTarget(State.grid, curR, curC, lightSources);
      targetR = escape.r;
      targetC = escape.c;
    } else {
      // Estado Caza según tipo de criatura
      switch (cr.type) {
        case 'VORAZ': // Perseguidor directo
          targetR = State.player.r;
          targetC = State.player.c;
          break;

        case 'ACECHADOR': { // Emboscador: apunta 3 celdas adelante del jugador
          const pr = State.player.r + State.player.dirR * 3;
          let pc = State.player.c + State.player.dirC * 3;
          if (pc < 0) pc = 0;
          if (pc >= CONFIG.COLS) pc = CONFIG.COLS - 1;
          if (pr >= 0 && pr < CONFIG.ROWS && State.grid[pr][pc] === 0) {
            targetR = pr;
            targetC = pc;
          } else {
            targetR = State.player.r;
            targetC = State.player.c;
          }
          break;
        }

        case 'CENTINELA': { // Merodeador: patrulla esquinas salvo si ve al jugador cerca
          const dist = Math.hypot(curR - State.player.r, curC - State.player.c);
          if (dist <= 5.5) {
            targetR = State.player.r;
            targetC = State.player.c;
          } else {
            // Patrullar esquinas del mapa
            const waypoints = [
              { r: 1, c: 1 }, { r: 1, c: CONFIG.COLS - 2 },
              { r: CONFIG.ROWS - 2, c: 1 }, { r: CONFIG.ROWS - 2, c: CONFIG.COLS - 2 }
            ];
            const wp = waypoints[Math.floor(Date.now() / 6000) % waypoints.length];
            targetR = wp.r;
            targetC = wp.c;
          }
          break;
        }

        case 'TRAGALUZ': { // Extinguidor: busca prioritariamente el farol encendido más cercano
          let nearestLan = null;
          let minDist = Infinity;
          for (const lan of State.lanterns) {
            if (lan.lit) {
              const d = Math.hypot(curR - lan.r, curC - lan.c);
              if (d < minDist) {
                minDist = d;
                nearestLan = lan;
              }
            }
          }
          if (nearestLan) {
            targetR = nearestLan.r;
            targetC = nearestLan.c;
          } else {
            targetR = State.player.r;
            targetC = State.player.c;
          }
          break;
        }
      }
    }

    cr.path = LumenLogic.findPath(State.grid, curR, curC, targetR, targetC) || [];
  }

  function moveCreatureAlongPath(cr, dt) {
    if (!cr.path || cr.path.length === 0) return;

    const speed = (cr.state === 'FLEE' ? CONFIG.FLEE_SPEED : cr.baseSpeed) * dt;
    const nextNode = cr.path[0];
    const targetX = nextNode.c + 0.5;
    const targetY = nextNode.r + 0.5;

    const dx = targetX - cr.x;
    const dy = targetY - cr.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= speed) {
      cr.x = targetX;
      cr.y = targetY;
      cr.r = nextNode.r;
      cr.c = nextNode.c;
      cr.path.shift();
    } else {
      cr.x += (dx / dist) * speed;
      cr.y += (dy / dist) * speed;
    }

    // Wrap túneles laterales
    if (cr.x < 0) cr.x = CONFIG.COLS - 0.1;
    else if (cr.x >= CONFIG.COLS) cr.x = 0.1;
  }

  function getActiveLightSources() {
    const sources = [];

    // Luz del jugador
    sources.push({ x: State.player.x, y: State.player.y, r: State.player.r, c: State.player.c, radius: State.player.lightRadius });

    // Faroles encendidos
    State.lanterns.forEach(lan => {
      if (lan.lit && lan.radius > 0) {
        sources.push({ x: lan.c + 0.5, y: lan.r + 0.5, r: lan.r, c: lan.c, radius: lan.radius });
      }
    });

    // Chispas activas
    State.sparks.forEach(sp => {
      sources.push({ x: sp.x, y: sp.y, r: sp.r, c: sp.c, radius: sp.radius });
    });

    return sources;
  }

  // ==========================================
  // EVENTOS DE JUEGO: VICTORIA Y MUERTE
  // ==========================================
  function handlePlayerCaught() {
    State.lives--;
    playAudio('player_hit');
    window.ArcadeCanvas?.haptic(45);

    const cs = State.cellSize;
    ParticlePool.spawn(State.player.x * cs, State.player.y * cs, '#ff0055', 25, 160);
    updateHUD();

    if (State.lives <= 0) {
      endGame(false, 'Has sucumbido ante la oscuridad.');
    } else {
      // Respawn seguro en el punto de inicio
      State.state = 'DEATH';
      setTimeout(() => {
        const lvl = CONFIG.LEVELS[State.levelIdx];
        const parsed = LumenLogic.parseMap(lvl.map);
        State.player.r = parsed.playerStart.r;
        State.player.c = parsed.playerStart.c;
        State.player.x = parsed.playerStart.c + 0.5;
        State.player.y = parsed.playerStart.r + 0.5;
        State.player.dirR = 0;
        State.player.dirC = 0;
        State.state = 'PLAYING';
      }, 700);
    }
  }

  function triggerVictory() {
    State.state = 'VICTORY';
    playAudio('victory');
    saveHighScore(State.score);
    setUnlockedLevel(State.levelIdx + 1);

    dom.resultIcon.textContent = '🏮';
    dom.resultTitle.textContent = '¡LABERINTO ILUMINADO!';
    dom.resultSubtitle.textContent = 'Has disipado las sombras de esta cámara.';
    dom.resultScoreVal.textContent = State.score.toLocaleString();
    dom.resultLanternsVal.textContent = `${State.litLanternsCount}/${State.lanterns.length}`;
    dom.resultBestVal.textContent = getHighScore().toLocaleString();

    if (State.levelIdx < CONFIG.LEVELS.length - 1) {
      dom.btnNextLevel.classList.remove('hidden');
    } else {
      dom.btnNextLevel.classList.add('hidden');
    }

    dom.overlayResult.classList.remove('hidden');
  }

  function endGame(isVictory, message) {
    State.state = isVictory ? 'VICTORY' : 'GAMEOVER';
    saveHighScore(State.score);

    dom.resultIcon.textContent = isVictory ? '🏮' : '💀';
    dom.resultTitle.textContent = isVictory ? '¡VICTORIA!' : 'FIN DE PARTIDA';
    dom.resultSubtitle.textContent = message;
    dom.resultScoreVal.textContent = State.score.toLocaleString();
    dom.resultLanternsVal.textContent = `${State.litLanternsCount}/${State.lanterns.length}`;
    dom.resultBestVal.textContent = getHighScore().toLocaleString();
    dom.btnNextLevel.classList.add('hidden');

    dom.overlayResult.classList.remove('hidden');
  }

  // ==========================================
  // RÉCORDS Y DESBLOQUEO
  // ==========================================
  function getHighScore() {
    try {
      return window.ArcadeStorage?.getHighScore(CONFIG.STORAGE_KEY) || 0;
    } catch (e) {
      return 0;
    }
  }

  function saveHighScore(score) {
    try {
      const current = getHighScore();
      if (score > current) {
        window.ArcadeStorage?.saveHighScore(CONFIG.STORAGE_KEY, score);
      }
    } catch (e) {}
  }

  function getUnlockedLevel() {
    try {
      const raw = localStorage.getItem(`${CONFIG.STORAGE_KEY}:unlocked`);
      return raw ? parseInt(raw, 10) : 0;
    } catch (e) {
      return 0;
    }
  }

  function setUnlockedLevel(lvlIdx) {
    try {
      const current = getUnlockedLevel();
      if (lvlIdx > current) {
        localStorage.setItem(`${CONFIG.STORAGE_KEY}:unlocked`, lvlIdx.toString());
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
      const isCurrent = idx === State.levelIdx;

      if (isUnlocked) badge.classList.add('unlocked');
      if (isCurrent) badge.classList.add('current');
      if (!isUnlocked) badge.classList.add('locked');

      const numSpan = document.createElement('span');
      numSpan.className = 'level-num';
      numSpan.textContent = idx + 1;
      badge.appendChild(numSpan);

      const starsSpan = document.createElement('span');
      starsSpan.className = 'level-stars';
      starsSpan.textContent = isUnlocked ? '★' : '🔒';
      badge.appendChild(starsSpan);

      if (isUnlocked) {
        badge.addEventListener('click', () => {
          playAudio('light_lantern');
          startLevel(idx);
        });
      }

      dom.levelsGrid.appendChild(badge);
    });
  }

  // ==========================================
  // RENDERIZADO VECTORIAL 3D Y MÁSCARA DE LUZ
  // ==========================================
  function render() {
    const ctx = State.ctx;
    if (!ctx) return;

    const cs = State.cellSize;
    const w = State.boardW;
    const h = State.boardH;

    ctx.clearRect(0, 0, w, h);

    // 1. Dibujar laberinto estático cacheado
    if (State.staticCanvas) {
      ctx.drawImage(State.staticCanvas, 0, 0);
    }

    // 2. Dibujar Faroles
    State.lanterns.forEach(lan => {
      render3DLantern(ctx, lan.c * cs + cs / 2, lan.r * cs + cs / 2, cs * 0.42, lan.lit, lan.offTimer);
    });

    // 3. Dibujar Chispas activas en el suelo
    State.sparks.forEach(sp => {
      renderSparkEntity(ctx, sp.x * cs, sp.y * cs, cs * 0.35);
    });

    // 4. Dibujar Jugador (Farolero)
    renderFarolero(ctx, State.player.x * cs, State.player.y * cs, cs * 0.45);

    // 5. Dibujar Criaturas Geométricas de la Oscuridad
    State.creatures.forEach(cr => {
      renderCreature3D(ctx, cr.x * cs, cr.y * cs, cs * 0.46, cr);
    });

    // 6. Dibujar Partículas
    ParticlePool.render(ctx);

    // 7. Capa de Oscuridad Dinámica con Máscara de Luz
    renderDarknessLightMask(ctx, w, h, cs);
  }

  function renderDarknessLightMask(ctx, w, h, cs) {
    if (State.flashActiveTimer > 0) {
      // Destello blanco cegador
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.85, State.flashActiveTimer)})`;
      ctx.fillRect(0, 0, w, h);
      return;
    }

    // Crear canvas offscreen para la máscara de sombras
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = w;
    maskCanvas.height = h;
    const mctx = maskCanvas.getContext('2d');

    // Oscuridad casi total 80s
    mctx.fillStyle = 'rgba(2, 4, 10, 0.94)';
    mctx.fillRect(0, 0, w, h);

    // Cortar agujeros de luz usando 'destination-out'
    mctx.globalCompositeOperation = 'destination-out';

    const lightSources = getActiveLightSources();
    lightSources.forEach(ls => {
      const px = ls.x * cs;
      const py = ls.y * cs;
      const radPx = ls.radius * cs;

      // Parpadeo sutil orgánico de luz
      const flicker = 1 + (Math.sin(Date.now() * 0.008 + px) * 0.04);
      const effRad = radPx * flicker;

      const grad = mctx.createRadialGradient(px, py, effRad * 0.15, px, py, effRad);
      grad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
      grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.75)');
      grad.addColorStop(0.85, 'rgba(0, 0, 0, 0.3)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      mctx.fillStyle = grad;
      mctx.beginPath();
      mctx.arc(px, py, effRad, 0, Math.PI * 2);
      mctx.fill();
    });

    // Componer la máscara sobre la escena del juego
    ctx.drawImage(maskCanvas, 0, 0);
  }

  function render3DLantern(ctx, cx, cy, rad, lit, offTimer) {
    ctx.save();

    // Base metálica del farol
    ctx.fillStyle = '#1c2838';
    ctx.fillRect(cx - rad * 0.5, cy + rad * 0.4, rad, rad * 0.35);

    // Poste
    ctx.fillStyle = '#0f1722';
    ctx.fillRect(cx - rad * 0.15, cy - rad * 0.3, rad * 0.3, rad * 0.7);

    // Campana de cristal
    if (lit) {
      // Cristal iluminado en ámbar y cian
      ctx.fillStyle = '#ffea66';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(cx, cy - rad * 0.3, rad * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Destello central
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy - rad * 0.35, rad * 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Apagado
      ctx.fillStyle = offTimer > 0 ? '#331111' : '#141e2a';
      ctx.beginPath();
      ctx.arc(cx, cy - rad * 0.3, rad * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function renderFarolero(ctx, cx, cy, rad) {
    ctx.save();
    ctx.translate(cx, cy);

    // Sombra proyectada
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, rad * 0.7, rad * 0.7, rad * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Capa de viajero
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, -rad * 0.9);
    ctx.lineTo(rad * 0.65, rad * 0.65);
    ctx.lineTo(-rad * 0.65, rad * 0.65);
    ctx.closePath();
    ctx.fill();

    // Farol de mano sostenido
    ctx.fillStyle = '#ffdd44';
    ctx.shadowColor = '#ffea00';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(rad * 0.45, -rad * 0.1, rad * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function renderCreature3D(ctx, cx, cy, rad, cr) {
    ctx.save();
    ctx.translate(cx, cy);

    const isFleeing = (cr.state === 'FLEE');
    const eyeColor = isFleeing ? '#00e5ff' : cr.color;

    switch (cr.shape) {
      case 'OCTAGRAM': { // VORAZ: Estrella puntiaguda rotante
        const rot = Date.now() * 0.003;
        ctx.rotate(rot);
        ctx.fillStyle = isFleeing ? '#0a2233' : '#1c0510';
        ctx.strokeStyle = eyeColor;
        ctx.lineWidth = 1.8;
        ctx.shadowColor = eyeColor;
        ctx.shadowBlur = 8;

        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          const r1 = rad * 0.95;
          const r2 = rad * 0.4;
          ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
          ctx.lineTo(Math.cos(a + Math.PI / 8) * r2, Math.sin(a + Math.PI / 8) * r2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Ojo central amenazante
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.arc(0, 0, rad * 0.25, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'CHEVRON': { // ACECHADOR: Doble rombo afilado
        ctx.fillStyle = isFleeing ? '#0a2233' : '#170624';
        ctx.strokeStyle = eyeColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = eyeColor;
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.moveTo(0, -rad);
        ctx.lineTo(rad * 0.8, rad * 0.3);
        ctx.lineTo(0, rad * 0.8);
        ctx.lineTo(-rad * 0.8, rad * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Núcleo
        ctx.fillStyle = eyeColor;
        ctx.fillRect(-rad * 0.2, -rad * 0.2, rad * 0.4, rad * 0.4);
        break;
      }

      case 'HEXRING': { // CENTINELA: Anillo hexagonal segmentado
        const rot = Math.sin(Date.now() * 0.004) * 0.4;
        ctx.rotate(rot);
        ctx.strokeStyle = eyeColor;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = eyeColor;
        ctx.shadowBlur = 8;

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI * 2) / 6;
          const x = Math.cos(a) * rad * 0.75;
          const y = Math.sin(a) * rad * 0.75;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.arc(0, 0, rad * 0.22, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'OBELISK': { // TRAGALUZ: Prisma piramidal lento
        ctx.fillStyle = '#0a0d14';
        ctx.strokeStyle = eyeColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = eyeColor;
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(0, -rad * 1.1);
        ctx.lineTo(rad * 0.7, rad * 0.8);
        ctx.lineTo(-rad * 0.7, rad * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Ojo de obsidiana
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, rad * 0.2, rad * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    ctx.restore();
  }

  function renderSparkEntity(ctx, cx, cy, rad) {
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = '#ffcc00';
    ctx.shadowColor = '#ffea00';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, 0, rad * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Chispas radiales
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Date.now() * 0.006;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * rad * 0.4, Math.sin(a) * rad * 0.4);
      ctx.lineTo(Math.cos(a) * rad * 1.1, Math.sin(a) * rad * 1.1);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==========================================
  // INPUTS TÁCTILES Y TECLADO
  // ==========================================
  function setupInputs() {
    // 1. D-Pad Virtual Táctil
    const bindDpad = (btn, dr, dc) => {
      const handlePress = (e) => {
        e.preventDefault();
        if (window.ArcadeAudio?.ctx?.state === 'suspended') window.ArcadeAudio.ctx.resume();
        btn.classList.add('active');
        setPlayerNextDirection(dr, dc);
        window.ArcadeCanvas?.haptic(5);
      };
      const handleRelease = (e) => {
        e.preventDefault();
        btn.classList.remove('active');
      };
      btn.addEventListener('touchstart', handlePress, { passive: false });
      btn.addEventListener('touchend', handleRelease, { passive: false });
      btn.addEventListener('mousedown', handlePress);
      btn.addEventListener('mouseup', handleRelease);
    };

    bindDpad(dom.btnDpadUp, -1, 0);
    bindDpad(dom.btnDpadDown, 1, 0);
    bindDpad(dom.btnDpadLeft, 0, -1);
    bindDpad(dom.btnDpadRight, 0, 1);

    // 2. Botones de acción táctiles
    dom.btnActionSpark.addEventListener('touchstart', (e) => {
      e.preventDefault();
      dropSpark();
    }, { passive: false });
    dom.btnActionSpark.addEventListener('click', dropSpark);

    dom.btnActionFlash.addEventListener('touchstart', (e) => {
      e.preventDefault();
      triggerEmergencyFlash();
    }, { passive: false });
    dom.btnActionFlash.addEventListener('click', triggerEmergencyFlash);

    // 3. Teclado de escritorio
    window.addEventListener('keydown', (e) => {
      if (window.ArcadeAudio?.ctx?.state === 'suspended') window.ArcadeAudio.ctx.resume();

      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          setPlayerNextDirection(-1, 0);
          break;
        case 'ArrowDown':
        case 'KeyS':
          setPlayerNextDirection(1, 0);
          break;
        case 'ArrowLeft':
        case 'KeyA':
          setPlayerNextDirection(0, -1);
          break;
        case 'ArrowRight':
        case 'KeyD':
          setPlayerNextDirection(0, 1);
          break;
        case 'KeyJ':
        case 'Space':
          dropSpark();
          break;
        case 'KeyK':
        case 'KeyF':
          triggerEmergencyFlash();
          break;
      }
    });
  }

  // ==========================================
  // BUCLE DE JUEGO PRINCIPAL
  // ==========================================
  function gameLoop(timestamp) {
    if (!State.lastTime) State.lastTime = timestamp;
    const dt = Math.min((timestamp - State.lastTime) / 1000, 0.08);
    State.lastTime = timestamp;

    if (State.state === 'PLAYING') {
      // 1. Actualizar jugador
      updatePlayer(dt);

      // 2. Actualizar criaturas de la sombra
      updateCreatures(dt);

      // 3. Actualizar radio de luz creciente de faroles
      State.lanterns.forEach(lan => {
        if (lan.lit) {
          if (lan.radius < CONFIG.LANTERN_MAX_LIGHT_RADIUS) {
            lan.radius = Math.min(CONFIG.LANTERN_MAX_LIGHT_RADIUS, lan.radius + dt * 2.2);
          }
        }
        if (lan.offTimer > 0) {
          lan.offTimer -= dt;
        }
      });

      // 4. Actualizar chispas temporales en el suelo
      for (let i = State.sparks.length - 1; i >= 0; i--) {
        const sp = State.sparks[i];
        sp.timer -= dt;
        if (sp.timer <= 0) {
          State.sparks.splice(i, 1);
        }
      }

      // 5. Recarga automática de chispas
      if (State.sparkCharges < CONFIG.MAX_SPARKS) {
        State.sparkRechargeTimer += dt;
        if (State.sparkRechargeTimer >= CONFIG.SPARK_RECHARGE_TIME) {
          State.sparkRechargeTimer = 0;
          State.sparkCharges++;
          updateHUD();
        }
      }

      // 6. Temporizador de destello de emergencia activo
      if (State.flashActiveTimer > 0) {
        State.flashActiveTimer -= dt;
      }

      // 7. Puntos pasivos por mantener faroles iluminados
      State.score += Math.floor(State.litLanternsCount * dt * 8);
      dom.scoreVal.textContent = State.score.toLocaleString();
    }

    // Actualizar partículas
    ParticlePool.update(dt);

    // Dibujar escena
    render();

    requestAnimationFrame(gameLoop);
  }

  // ==========================================
  // REDIMENSIÓN RESPONSIVA
  // ==========================================
  function handleResize() {
    const container = dom.canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const pad = 6;
    const availW = Math.max(100, rect.width - pad);
    const availH = Math.max(100, rect.height - pad);

    // Relación de aspecto 15 columnas x 19 filas
    const ratio = CONFIG.COLS / CONFIG.ROWS;
    let targetW = availW;
    let targetH = targetW / ratio;
    if (targetH > availH) {
      targetH = availH;
      targetW = targetH * ratio;
    }

    targetW = Math.floor(targetW);
    targetH = Math.floor(targetH);

    State.boardW = targetW;
    State.boardH = targetH;
    State.cellSize = targetW / CONFIG.COLS;

    const dpr = window.devicePixelRatio || 1;
    dom.canvas.style.width = `${targetW}px`;
    dom.canvas.style.height = `${targetH}px`;
    dom.canvas.width = Math.round(targetW * dpr);
    dom.canvas.height = Math.round(targetH * dpr);

    State.ctx = dom.canvas.getContext('2d');
    State.ctx.resetTransform();
    State.ctx.scale(dpr, dpr);

    if (State.grid) {
      buildStaticMazeCache();
    }
  }

  function setupUI() {
    window.addEventListener('resize', handleResize);

    dom.btnStartEndless.addEventListener('click', () => {
      playAudio('light_lantern');
      startLevel(0);
    });

    // Pausa
    dom.btnPauseHeader.addEventListener('click', () => {
      if (State.state !== 'PLAYING') return;
      State.state = 'PAUSED';
      dom.overlayPause.classList.remove('hidden');
      playAudio('spark');
    });

    dom.btnResume.addEventListener('click', () => {
      State.state = 'PLAYING';
      dom.overlayPause.classList.add('hidden');
      playAudio('spark');
    });

    dom.btnRestartLevel.addEventListener('click', () => {
      startLevel(State.levelIdx);
    });

    dom.btnLevelSelect.addEventListener('click', () => {
      dom.overlayPause.classList.add('hidden');
      renderLevelSelector();
      dom.startCard.classList.remove('hidden');
      State.state = 'MENU';
    });

    // Modal Resultados
    dom.btnNextLevel.addEventListener('click', () => {
      if (State.levelIdx < CONFIG.LEVELS.length - 1) {
        startLevel(State.levelIdx + 1);
      }
    });

    dom.btnRetryLevel.addEventListener('click', () => {
      startLevel(State.levelIdx);
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
