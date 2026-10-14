/**
 * games/lanzaburbujas/game.js - Lanzaburbujas Arcade 00s
 * Bubble shooter en rejilla hexagonal con rebote en paredes, detección de burbujas flotantes,
 * techo descendente, munición dinámica, cambio de burbuja y burbujas especiales.
 */
(() => {
  'use strict';

  // ==========================================
  // CONFIGURACIÓN Y CONSTANTES DE BALANCE
  // ==========================================
  const CONFIG = {
    COLS_EVEN: 8,
    COLS_ODD: 7,
    MAX_ROWS: 13,
    DEADLINE_ROW: 10,
    VIRTUAL_W: 400,
    VIRTUAL_H: 580,
    STORAGE_KEY_PREFIX: 'lanzaburbujas:v1',

    // Colores de burbujas translúcidas con paleta Aqua 00s
    COLORS: [
      { id: 1, name: 'RED',     main: '#ff2e63', dark: '#990026', light: '#ff99b3', glow: 'rgba(255, 46, 99, 0.6)' },
      { id: 2, name: 'BLUE',    main: '#00d2fc', dark: '#005980', light: '#99f2ff', glow: 'rgba(0, 210, 252, 0.6)' },
      { id: 3, name: 'GREEN',   main: '#00e676', dark: '#006633', light: '#99ffcc', glow: 'rgba(0, 230, 118, 0.6)' },
      { id: 4, name: 'YELLOW',  main: '#ffea00', dark: '#807500', light: '#fff899', glow: 'rgba(255, 234, 0, 0.6)' },
      { id: 5, name: 'PURPLE',  main: '#d500f9', dark: '#610073', light: '#f499ff', glow: 'rgba(213, 0, 249, 0.6)' },
      { id: 6, name: 'ORANGE',  main: '#ff6d00', dark: '#803600', light: '#ffc599', glow: 'rgba(255, 109, 0, 0.6)' }
    ],

    SPECIALS: {
      NONE: 0,
      BOMB: 90,     // Explota radio adyacente
      RAINBOW: 91,  // Adopta el color que impacta
      ROCK: 92      // Burbuja indestructible salvo por caída
    },

    PROJECTILE_SPEED: 950, // Píxeles por segundo
    BASE_MISSES_TO_DROP: 5,

    // 15 Niveles definidos como datos
    LEVELS: [
      { id: 1, name: 'Despeje Inicial', rows: [
        [1,1,2,2,3,3,1,1],
        [1,2,2,3,3,1,1],
        [2,2,3,3,1,1,2,2]
      ]},
      { id: 2, name: 'Rayas Cruzadas', rows: [
        [1,2,1,2,1,2,1,2],
        [2,1,2,1,2,1,2],
        [3,4,3,4,3,4,3,4],
        [4,3,4,3,4,3,4]
      ]},
      { id: 3, name: 'Anillos Gemelos', rows: [
        [1,1,1,2,2,3,3,3],
        [1,4,1,2,3,4,3],
        [1,1,1,2,2,3,3,3],
        [5,5,5,5,5,5,5]
      ]},
      { id: 4, name: 'El Refugio de Bombas', rows: [
        [1,1,2,2,3,3,4,4],
        [1,90,2,3,90,4,4], // Bombas
        [2,2,1,1,4,4,3,3],
        [3,3,4,4,1,1,2]
      ]},
      { id: 5, name: 'Corona de Cristal', rows: [
        [2,2,2,2,2,2,2,2],
        [1,0,1,0,1,0,1],
        [1,1,1,1,1,1,1,1],
        [3,3,91,3,91,3,3], // Arcoíris
        [4,4,4,4,4,4,4,4]
      ]},
      { id: 6, name: 'Muro Pétreo', rows: [
        [92,1,1,92,92,2,2,92], // Rocas
        [1,1,3,3,2,2,4],
        [3,3,90,3,90,4,4,4],
        [5,5,5,5,5,5,5]
      ]},
      { id: 7, name: 'Mosaico Hexagonal', rows: [
        [1,1,2,2,3,3,4,4],
        [5,5,6,6,1,1,2],
        [3,3,4,4,5,5,6,6],
        [1,1,2,2,3,3,4],
        [5,5,91,6,91,5,5,5]
      ]},
      { id: 8, name: 'Vórtice Espiral', rows: [
        [1,2,3,4,5,6,1,2],
        [2,3,4,5,6,1,2],
        [3,4,90,90,5,6,1,2],
        [4,5,6,1,2,3,4],
        [5,6,1,2,3,4,5,6]
      ]},
      { id: 9, name: 'Laberinto Flotante', rows: [
        [92,92,1,1,2,2,92,92],
        [92,1,1,2,2,92,92],
        [3,3,91,4,4,91,3,3],
        [5,5,5,6,6,6,5],
        [6,6,6,5,5,5,6,6]
      ]},
      { id: 10, name: 'Fortaleza Gemela', rows: [
        [1,1,92,2,2,92,3,3],
        [1,90,2,2,90,3,3],
        [4,4,4,5,5,5,6,6],
        [6,6,91,6,91,6,6],
        [1,1,2,2,3,3,4,4]
      ]},
      { id: 11, name: 'Pirámide Invertida', rows: [
        [1,2,3,4,4,3,2,1],
        [2,3,4,5,4,3,2],
        [3,4,5,90,5,4,3,2],
        [4,5,91,91,5,4,3],
        [5,6,6,6,6,6,5,5],
        [6,1,1,1,1,1,6]
      ]},
      { id: 12, name: 'Columnas Titánicas', rows: [
        [92,1,92,2,92,3,92,4],
        [1,92,2,92,3,92,4],
        [92,5,92,6,92,1,92,2],
        [5,90,6,90,1,90,2],
        [3,3,4,4,5,5,6,6]
      ]},
      { id: 13, name: 'Campo de Minas', rows: [
        [1,1,2,2,3,3,4,4],
        [90,90,90,90,90,90,90],
        [5,5,6,6,1,1,2,2],
        [90,3,90,4,90,5,90],
        [6,6,1,1,2,2,3,3]
      ]},
      { id: 14, name: 'Ojo del Huracán', rows: [
        [1,1,1,1,1,1,1,1],
        [2,2,92,92,92,2,2],
        [3,92,90,91,90,92,3,3],
        [4,92,92,92,92,92,4],
        [5,5,5,5,5,5,5,5],
        [6,6,6,6,6,6,6]
      ]},
      { id: 15, name: 'Desafío Maestro 00s', rows: [
        [92,1,2,3,4,5,6,92],
        [90,1,2,3,4,5,90],
        [92,6,5,91,91,2,1,92],
        [3,4,5,6,1,2,3],
        [4,5,6,1,2,3,4,5],
        [90,92,90,92,90,92,90],
        [1,2,3,4,5,6,1,2]
      ]}
    ]
  };

  // ==========================================
  // LÓGICA PURA Y SIMULACIÓN (Testeable en Node)
  // ==========================================
  const LanzaburbujasLogic = {
    /**
     * Retorna la lista de vecinos adyacentes en una cuadrícula hexagonal con filas desfasadas.
     * Filas pares tienen COLS_EVEN columnas (ej. 8).
     * Filas impares tienen COLS_ODD columnas (ej. 7).
     */
    getHexNeighbors(r, c, maxRows = CONFIG.MAX_ROWS, colsEven = CONFIG.COLS_EVEN, colsOdd = CONFIG.COLS_ODD) {
      const neighbors = [];
      const isEven = (r % 2 === 0);

      // Desplazamientos relativos [dr, dc]
      const offsets = isEven
        ? [
            [0, -1], [0, 1],   // Izquierda, Derecha
            [-1, -1], [-1, 0], // Arriba-Izquierda, Arriba-Derecha
            [1, -1], [1, 0]    // Abajo-Izquierda, Abajo-Derecha
          ]
        : [
            [0, -1], [0, 1],   // Izquierda, Derecha
            [-1, 0], [-1, 1],  // Arriba-Izquierda, Arriba-Derecha
            [1, 0], [1, 1]     // Abajo-Izquierda, Abajo-Derecha
          ];

      for (const [dr, dc] of offsets) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < maxRows) {
          const maxColsInRow = (nr % 2 === 0) ? colsEven : colsOdd;
          if (nc >= 0 && nc < maxColsInRow) {
            neighbors.push({ r: nr, c: nc });
          }
        }
      }

      return neighbors;
    },

    /**
     * Calcula la posición (x, y) del centro de una burbuja en la rejilla
     */
    getCellCenter(r, c, bubbleRadius) {
      const isEven = (r % 2 === 0);
      const rowHeight = bubbleRadius * Math.sqrt(3);
      const x = isEven
        ? (c * 2 + 1) * bubbleRadius
        : (c * 2 + 2) * bubbleRadius;
      const y = r * rowHeight + bubbleRadius;
      return { x, y };
    },

    /**
     * Encuentra el grupo conectado del mismo color (BFS) a partir de una celda recién impactada.
     */
    findConnectedCluster(grid, startR, startC) {
      const startCell = grid[startR]?.[startC];
      if (!startCell || startCell.color === 0) return [];

      const targetColor = startCell.color;
      const visited = new Set();
      const cluster = [];
      const queue = [{ r: startR, c: startC }];
      visited.add(`${startR},${startC}`);

      while (queue.length > 0) {
        const curr = queue.shift();
        cluster.push(curr);

        const neighbors = this.getHexNeighbors(curr.r, curr.c);
        for (const n of neighbors) {
          const key = `${n.r},${n.c}`;
          if (!visited.has(key)) {
            const neighborCell = grid[n.r]?.[n.c];
            if (neighborCell && neighborCell.color !== 0) {
              // Si el color coincide o es comodín arcoíris
              if (neighborCell.color === targetColor || neighborCell.special === CONFIG.SPECIALS.RAINBOW) {
                visited.add(key);
                queue.push(n);
              }
            }
          }
        }
      }

      return cluster;
    },

    /**
     * Detección de burbujas flotantes (huérfanas):
     * Realiza una búsqueda BFS desde todas las burbujas sujetas al techo (fila 0).
     * Toda burbuja que no pueda ser alcanzada desde el techo se considera flotante y debe caer.
     * @returns {Array<{r: number, c: number}>} Celdas flotantes que caerán
     */
    findFloatingBubbles(grid, maxRows = CONFIG.MAX_ROWS) {
      const attached = new Set();
      const queue = [];

      // Semillas: todas las burbujas no vacías de la fila 0
      const colsInRow0 = (0 % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
      for (let c = 0; c < colsInRow0; c++) {
        if (grid[0]?.[c] && grid[0][c].color !== 0) {
          attached.add(`0,${c}`);
          queue.push({ r: 0, c });
        }
      }

      // Propagar conexión por contacto
      while (queue.length > 0) {
        const curr = queue.shift();
        const neighbors = this.getHexNeighbors(curr.r, curr.c, maxRows);
        for (const n of neighbors) {
          const key = `${n.r},${n.c}`;
          if (!attached.has(key)) {
            if (grid[n.r]?.[n.c] && grid[n.r][n.c].color !== 0) {
              attached.add(key);
              queue.push(n);
            }
          }
        }
      }

      // Identificar todas las burbujas existentes que no estén en `attached`
      const floating = [];
      for (let r = 0; r < maxRows; r++) {
        const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
        for (let c = 0; c < maxCols; c++) {
          if (grid[r]?.[c] && grid[r][c].color !== 0) {
            if (!attached.has(`${r},${c}`)) {
              floating.push({ r, c });
            }
          }
        }
      }

      return floating;
    },

    /**
     * Obtiene los colores activos que actualmente existen en el tablero.
     * Si un color ya no existe, la munición dinámica no debe ofrecerlo.
     */
    getActiveColors(grid, maxRows = CONFIG.MAX_ROWS) {
      const colors = new Set();
      for (let r = 0; r < maxRows; r++) {
        const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
        for (let c = 0; c < maxCols; c++) {
          const cell = grid[r]?.[c];
          if (cell && cell.color > 0 && cell.color <= CONFIG.COLORS.length) {
            colors.add(cell.color);
          }
        }
      }
      return Array.from(colors);
    },

    /**
     * Simula la trayectoria del disparo con rebotes en las paredes y retorna los puntos de la línea guía
     * y la celda vacía donde se encajaría la burbuja al colisionar.
     */
    raycastTrajectory(startX, startY, angle, bubbleRadius, boardWidth, grid, maxRows = CONFIG.MAX_ROWS) {
      const path = [{ x: startX, y: startY }];
      let cx = startX;
      let cy = startY;
      let dx = Math.cos(angle);
      let dy = Math.sin(angle);
      const step = 4;
      let targetCell = null;

      for (let iter = 0; iter < 1200; iter++) {
        cx += dx * step;
        cy += dy * step;

        // Rebote en pared izquierda
        if (cx <= bubbleRadius) {
          cx = bubbleRadius;
          dx = -dx;
          path.push({ x: cx, y: cy });
        }
        // Rebote en pared derecha
        else if (cx >= boardWidth - bubbleRadius) {
          cx = boardWidth - bubbleRadius;
          dx = -dx;
          path.push({ x: cx, y: cy });
        }

        // Colisión con techo
        if (cy <= bubbleRadius) {
          cy = bubbleRadius;
          path.push({ x: cx, y: cy });
          targetCell = this.findNearestEmptyCell(cx, cy, bubbleRadius, grid, maxRows);
          break;
        }

        // Colisión con burbujas existentes
        let collided = false;
        for (let r = 0; r < maxRows; r++) {
          const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
          for (let c = 0; c < maxCols; c++) {
            if (grid[r]?.[c] && grid[r][c].color !== 0) {
              const bCenter = this.getCellCenter(r, c, bubbleRadius);
              const distSq = (cx - bCenter.x) ** 2 + (cy - bCenter.y) ** 2;
              // Si la distancia es menor a 2 veces el radio de colisión
              if (distSq <= (bubbleRadius * 1.85) ** 2) {
                collided = true;
                break;
              }
            }
          }
          if (collided) break;
        }

        if (collided) {
          path.push({ x: cx, y: cy });
          targetCell = this.findNearestEmptyCell(cx, cy, bubbleRadius, grid, maxRows);
          break;
        }
      }

      return { path, targetCell };
    },

    /**
     * Encuentra la celda vacía más cercana al punto de impacto (x, y)
     */
    findNearestEmptyCell(px, py, bubbleRadius, grid, maxRows = CONFIG.MAX_ROWS) {
      let bestDist = Infinity;
      let bestCell = null;

      for (let r = 0; r < maxRows; r++) {
        const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
        for (let c = 0; c < maxCols; c++) {
          if (!grid[r]?.[c] || grid[r][c].color === 0) {
            const center = this.getCellCenter(r, c, bubbleRadius);
            const dist = (px - center.x) ** 2 + (py - center.y) ** 2;
            if (dist < bestDist) {
              bestDist = dist;
              bestCell = { r, c };
            }
          }
        }
      }

      return bestCell;
    }
  };

  // Exportar para pruebas Node
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, LanzaburbujasLogic };
    return;
  }

  // ==========================================
  // ESTADO DEL JUEGO
  // ==========================================
  const State = {
    canvas: null,
    ctx: null,
    bubbleRadius: 25, // Calculado según ancho de canvas

    grid: [],
    currentLevelIdx: 0,
    isEndless: false,

    score: 0,
    bestScore: 0,
    missedShots: 0,
    ceilingDropInterval: CONFIG.BASE_MISSES_TO_DROP,

    state: 'MENU', // 'MENU', 'AIMING', 'SHOOTING', 'POPPING', 'PAUSED', 'GAMEOVER', 'VICTORY'

    // Cañón y disparo
    aimAngle: -Math.PI / 2, // Apuntando hacia arriba
    isDragging: false,
    cannonX: 200,
    cannonY: 530,

    currentAmmo: { color: 1, special: 0 },
    nextAmmo: { color: 2, special: 0 },
    projectile: null, // { x, y, vx, vy, color, special }

    // Burbujas que caen (flotantes)
    fallingBubbles: [], // { x, y, vx, vy, color, special }

    // Partículas y efectos
    particles: [],

    lastTime: 0
  };

  // Referencias DOM
  const dom = {
    container: document.getElementById('game-container'),
    header: document.getElementById('game-header'),
    subBar: document.getElementById('sub-bar'),
    canvas: document.getElementById('game-canvas'),
    nextCanvas: document.getElementById('next-bubble-canvas'),

    scoreVal: document.getElementById('score-val'),
    ceilingShotsVal: document.getElementById('ceiling-shots-val'),
    levelTitleDisplay: document.getElementById('level-title-display'),

    btnSwapAmmo: document.getElementById('btn-swap-ammo'),
    btnSoundToggle: document.getElementById('btn-sound-toggle'),
    iconSoundOn: document.getElementById('icon-sound-on'),
    iconSoundOff: document.getElementById('icon-sound-off'),
    btnPauseHeader: document.getElementById('btn-pause-header'),

    startCard: document.getElementById('start-card'),
    levelsGrid: document.getElementById('levels-grid'),
    btnEndlessMode: document.getElementById('btn-endless-mode'),

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
    btnExitToLevels: document.getElementById('btn-exit-to-levels')
  };

  // ==========================================
  // AUDIO SINTETIZADO (Web Audio)
  // ==========================================
  function playAudio(type, extra = 1) {
    if (!window.ArcadeAudio || window.ArcadeAudio.isMuted) return;

    try {
      const actx = window.ArcadeAudio.ctx;
      if (!actx) return;
      const now = actx.currentTime;

      switch (type) {
        case 'shoot': {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.12);
          break;
        }

        case 'bounce': {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.linearRampToValueAtTime(450, now + 0.05);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.05);
          break;
        }

        case 'pop': {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'sine';
          const baseFreq = 520 + (extra * 80);
          osc.frequency.setValueAtTime(baseFreq, now);
          osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, now + 0.08);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.08);
          break;
        }

        case 'drop': {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.linearRampToValueAtTime(150, now + 0.25);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.25);
          break;
        }

        case 'ceiling_down': {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(120, now);
          osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);
          gain.gain.setValueAtTime(0.4, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.35);
          break;
        }

        case 'bomb_blast': {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(240, now);
          osc.frequency.linearRampToValueAtTime(40, now + 0.45);
          gain.gain.setValueAtTime(0.5, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.45);
          break;
        }

        case 'swap': {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.linearRampToValueAtTime(660, now + 0.08);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.08);
          break;
        }

        case 'victory': {
          const melody = [523.25, 659.25, 783.99, 1046.50];
          melody.forEach((freq, idx) => {
            const osc = actx.createOscillator();
            const gain = actx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.12);
            gain.gain.setValueAtTime(0.25, now + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);
            osc.connect(gain);
            gain.connect(actx.destination);
            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 0.35);
          });
          break;
        }

        case 'game_over': {
          const notes = [330, 311.13, 293.66, 261.63];
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
  // PARTÍCULAS DE SALPICADURA
  // ==========================================
  const ParticlePool = {
    pool: [],
    spawn(x, y, color, count = 10, speed = 140) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = (Math.random() * 0.8 + 0.2) * speed;
        const p = this.pool.pop() || {};
        p.x = x;
        p.y = y;
        p.vx = Math.cos(angle) * velocity;
        p.vy = Math.sin(angle) * velocity;
        p.color = color;
        p.size = Math.random() * 5 + 3;
        p.life = 0;
        p.maxLife = Math.random() * 0.35 + 0.25;
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
        p.size = Math.max(0.1, p.size * (1 - dt * 2.5));
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

        // Núcleo brillante
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  };

  // ==========================================
  // INICIALIZACIÓN DE PARTIDA Y NIVELES
  // ==========================================
  function createEmptyGrid() {
    const grid = [];
    for (let r = 0; r < CONFIG.MAX_ROWS; r++) {
      const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
      grid[r] = [];
      for (let c = 0; c < maxCols; c++) {
        grid[r][c] = { color: 0, special: CONFIG.SPECIALS.NONE };
      }
    }
    return grid;
  }

  function startLevel(levelIdx) {
    State.isEndless = false;
    State.currentLevelIdx = levelIdx;
    const lvl = CONFIG.LEVELS[levelIdx];

    State.score = 0;
    State.missedShots = 0;
    State.ceilingDropInterval = CONFIG.BASE_MISSES_TO_DROP;
    State.grid = createEmptyGrid();

    // Rellenar según configuración de nivel
    if (lvl.rows) {
      lvl.rows.forEach((row, r) => {
        row.forEach((colVal, c) => {
          if (colVal !== 0 && r < CONFIG.MAX_ROWS) {
            const isSpecial = colVal >= 90;
            State.grid[r][c] = {
              color: isSpecial ? colVal : colVal,
              special: isSpecial ? colVal : CONFIG.SPECIALS.NONE
            };
          }
        });
      });
    }

    State.projectile = null;
    State.fallingBubbles = [];
    State.particles = [];

    // Generar munición dinámica inicial
    generateNextAmmo(true);
    generateNextAmmo(false);

    State.state = 'AIMING';

    dom.startCard.classList.add('hidden');
    dom.overlayPause.classList.add('hidden');
    dom.overlayResult.classList.add('hidden');

    updateHUD();
    renderNextAmmoPreview();
  }

  function startEndless() {
    State.isEndless = true;
    State.score = 0;
    State.missedShots = 0;
    State.ceilingDropInterval = 4;
    State.grid = createEmptyGrid();

    // Rellenar 5 filas aleatorias
    for (let r = 0; r < 5; r++) {
      const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
      for (let c = 0; c < maxCols; c++) {
        const col = Math.floor(Math.random() * 5) + 1;
        State.grid[r][c] = { color: col, special: CONFIG.SPECIALS.NONE };
      }
    }

    State.projectile = null;
    State.fallingBubbles = [];
    State.particles = [];

    generateNextAmmo(true);
    generateNextAmmo(false);

    State.state = 'AIMING';

    dom.startCard.classList.add('hidden');
    dom.overlayPause.classList.add('hidden');
    dom.overlayResult.classList.add('hidden');

    updateHUD();
    renderNextAmmoPreview();
  }

  /**
   * Genera una nueva burbuja para el cañón utilizando solo colores que existan en el tablero
   */
  function generateNextAmmo(isCurrent = false) {
    const activeColors = LanzaburbujasLogic.getActiveColors(State.grid);
    let chosenColor = 1;

    if (activeColors.length > 0) {
      chosenColor = activeColors[Math.floor(Math.random() * activeColors.length)];
    } else {
      chosenColor = Math.floor(Math.random() * 4) + 1;
    }

    // Pequeña probabilidad (5%) de obtener burbuja especial Bomba o Arcoíris
    let special = CONFIG.SPECIALS.NONE;
    if (Math.random() < 0.05) {
      special = Math.random() < 0.5 ? CONFIG.SPECIALS.BOMB : CONFIG.SPECIALS.RAINBOW;
      chosenColor = special;
    }

    if (isCurrent) {
      State.currentAmmo = { color: chosenColor, special };
    } else {
      State.nextAmmo = { color: chosenColor, special };
      renderNextAmmoPreview();
    }
  }

  function swapAmmo() {
    if (State.state !== 'AIMING') return;

    playAudio('swap');
    window.ArcadeCanvas?.haptic(10);

    const temp = { ...State.currentAmmo };
    State.currentAmmo = { ...State.nextAmmo };
    State.nextAmmo = temp;

    renderNextAmmoPreview();
  }

  function updateHUD() {
    dom.scoreVal.textContent = State.score.toLocaleString();
    const remaining = State.ceilingDropInterval - State.missedShots;
    dom.ceilingShotsVal.textContent = Math.max(1, remaining);

    if (State.isEndless) {
      dom.levelTitleDisplay.textContent = 'Modo Supervivencia';
    } else {
      const lvl = CONFIG.LEVELS[State.currentLevelIdx];
      dom.levelTitleDisplay.textContent = `Nivel ${State.currentLevelIdx + 1}: ${lvl.name}`;
    }
  }

  function renderNextAmmoPreview() {
    const nctx = dom.nextCanvas.getContext('2d');
    nctx.clearRect(0, 0, 32, 32);
    renderBubble3D(nctx, 16, 16, 12, State.nextAmmo.color, State.nextAmmo.special);
  }

  // ==========================================
  // DISPARO Y COLISIÓN
  // ==========================================
  function fireProjectile() {
    if (State.state !== 'AIMING' || State.projectile) return;

    const angle = State.aimAngle;
    // Solo permitir disparar hacia arriba
    if (angle > -0.15 || angle < -Math.PI + 0.15) return;

    playAudio('shoot');
    window.ArcadeCanvas?.haptic(15);

    const speed = CONFIG.PROJECTILE_SPEED;
    State.projectile = {
      x: State.cannonX,
      y: State.cannonY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: State.currentAmmo.color,
      special: State.currentAmmo.special
    };

    State.state = 'SHOOTING';

    // Cargar la siguiente burbuja en el cañón y preparar una nueva
    State.currentAmmo = { ...State.nextAmmo };
    generateNextAmmo(false);
  }

  function updateProjectile(dt) {
    const p = State.projectile;
    if (!p) return;

    const w = State.boardW || dom.canvas.width;
    const r = State.bubbleRadius;

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Rebote izquierdo
    if (p.x <= r) {
      p.x = r;
      p.vx = -p.vx;
      playAudio('bounce');
    }
    // Rebote derecho
    else if (p.x >= w - r) {
      p.x = w - r;
      p.vx = -p.vx;
      playAudio('bounce');
    }

    // Colisión con techo
    if (p.y <= r) {
      p.y = r;
      settleProjectile(p);
      return;
    }

    // Colisión con burbujas existentes
    for (let row = 0; row < CONFIG.MAX_ROWS; row++) {
      const maxCols = (row % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
      for (let col = 0; col < maxCols; col++) {
        if (State.grid[row]?.[col] && State.grid[row][col].color !== 0) {
          const center = LanzaburbujasLogic.getCellCenter(row, col, r);
          const distSq = (p.x - center.x) ** 2 + (p.y - center.y) ** 2;
          if (distSq <= (r * 1.85) ** 2) {
            settleProjectile(p);
            return;
          }
        }
      }
    }
  }

  function settleProjectile(p) {
    const r = State.bubbleRadius;
    const target = LanzaburbujasLogic.findNearestEmptyCell(p.x, p.y, r, State.grid);

    if (!target) {
      State.projectile = null;
      State.state = 'AIMING';
      return;
    }

    // Fijar burbuja en la rejilla
    State.grid[target.r][target.c] = { color: p.color, special: p.special };
    State.projectile = null;

    handleImpactActions(target.r, target.c, p);
  }

  function handleImpactActions(r, c, p) {
    State.state = 'POPPING';

    // 1. Caso especial: Bomba
    if (p.special === CONFIG.SPECIALS.BOMB) {
      playAudio('bomb_blast');
      window.ArcadeCanvas?.haptic(35);

      const toPop = [{ r, c }];
      const neighbors = LanzaburbujasLogic.getHexNeighbors(r, c);
      neighbors.forEach(n => toPop.push(n));

      popBubbles(toPop);
      return;
    }

    // 2. Coincidencia normal o arcoíris
    const cluster = LanzaburbujasLogic.findConnectedCluster(State.grid, r, c);

    if (cluster.length >= 3) {
      // Éxito: reventar grupo
      playAudio('pop', cluster.length);
      window.ArcadeCanvas?.haptic(15);
      popBubbles(cluster);
    } else {
      // Fallo de combinación: acumular disparos hacia descenso del techo
      State.missedShots++;
      updateHUD();

      if (State.missedShots >= State.ceilingDropInterval) {
        lowerCeiling();
      } else {
        finishTurn();
      }
    }
  }

  function popBubbles(cells) {
    let poppedCount = 0;
    const rad = State.bubbleRadius;

    cells.forEach(cell => {
      const bubble = State.grid[cell.r]?.[cell.c];
      if (bubble && bubble.color !== 0) {
        poppedCount++;
        const center = LanzaburbujasLogic.getCellCenter(cell.r, cell.c, rad);
        const colCfg = CONFIG.COLORS.find(c => c.id === bubble.color) || { main: '#ffffff' };
        ParticlePool.spawn(center.x, center.y, colCfg.main, 12, 160);
        State.grid[cell.r][cell.c] = { color: 0, special: CONFIG.SPECIALS.NONE };
      }
    });

    State.score += poppedCount * 40;

    // Detectar y soltar burbujas flotantes desconectadas
    setTimeout(() => {
      dropFloatingBubbles();
    }, 120);
  }

  function dropFloatingBubbles() {
    const floating = LanzaburbujasLogic.findFloatingBubbles(State.grid);

    if (floating.length > 0) {
      playAudio('drop');
      const rad = State.bubbleRadius;

      floating.forEach(cell => {
        const bubble = State.grid[cell.r][cell.c];
        const center = LanzaburbujasLogic.getCellCenter(cell.r, cell.c, rad);

        // Crear objeto de burbuja que cae con física hacia abajo
        State.fallingBubbles.push({
          x: center.x,
          y: center.y,
          vx: (Math.random() - 0.5) * 120,
          vy: Math.random() * -80 - 40,
          color: bubble.color,
          special: bubble.special
        });

        State.grid[cell.r][cell.c] = { color: 0, special: CONFIG.SPECIALS.NONE };
      });

      // Puntos extra por burbujas caídas (valen el doble)
      State.score += floating.length * 80;
      updateHUD();
    }

    finishTurn();
  }

  function lowerCeiling() {
    State.missedShots = 0;
    playAudio('ceiling_down');
    window.ArcadeCanvas?.haptic(40);

    // Desplazar todas las filas hacia abajo
    for (let r = CONFIG.MAX_ROWS - 1; r > 0; r--) {
      const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
      const prevCols = ((r - 1) % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
      for (let c = 0; c < maxCols; c++) {
        if (c < prevCols) {
          State.grid[r][c] = { ...State.grid[r - 1][c] };
        } else {
          State.grid[r][c] = { color: 0, special: CONFIG.SPECIALS.NONE };
        }
      }
    }

    // Nueva fila aleatoria en el techo
    for (let c = 0; c < CONFIG.COLS_EVEN; c++) {
      const activeColors = LanzaburbujasLogic.getActiveColors(State.grid);
      const col = activeColors.length > 0
        ? activeColors[Math.floor(Math.random() * activeColors.length)]
        : Math.floor(Math.random() * 4) + 1;
      State.grid[0][c] = { color: col, special: CONFIG.SPECIALS.NONE };
    }

    updateHUD();
    finishTurn();
  }

  function finishTurn() {
    // 1. Comprobar si el tablero quedó completamente vacío (Victoria)
    const activeColors = LanzaburbujasLogic.getActiveColors(State.grid);
    if (activeColors.length === 0) {
      endGame(true, '¡Has limpiado todas las burbujas!');
      return;
    }

    // 2. Comprobar si alguna burbuja rebasó la línea de peligro (Derrota)
    for (let r = CONFIG.DEADLINE_ROW; r < CONFIG.MAX_ROWS; r++) {
      const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
      for (let c = 0; c < maxCols; c++) {
        if (State.grid[r]?.[c] && State.grid[r][c].color !== 0) {
          endGame(false, '¡Las burbujas tocaron la línea límite!');
          return;
        }
      }
    }

    State.state = 'AIMING';
    updateHUD();
  }

  function endGame(isVictory, message) {
    State.state = isVictory ? 'VICTORY' : 'GAMEOVER';

    if (isVictory) {
      playAudio('victory');
      saveLevelRecord(State.currentLevelIdx, State.score);
      setUnlockedLevel(State.currentLevelIdx + 1);
    } else {
      playAudio('game_over');
    }

    dom.resultIcon.textContent = isVictory ? '🫧' : '💥';
    dom.resultTitle.textContent = isVictory ? '¡NIVEL SUPERADO!' : 'FIN DE PARTIDA';
    dom.resultSubtitle.textContent = message;
    dom.resultScoreVal.textContent = State.score.toLocaleString();

    const best = getLevelRecord(State.currentLevelIdx);
    dom.resultBestVal.textContent = best.toLocaleString();

    dom.starsRow.innerHTML = '';
    const stars = isVictory ? 3 : 0;
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

    dom.overlayResult.classList.remove('hidden');
  }

  // ==========================================
  // GESTIÓN DE RÉCORDS Y SELECTOR
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
      const current = getLevelRecord(levelIdx);
      if (score > current) {
        window.ArcadeStorage?.saveHighScore(key, score);
      }
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
      starsSpan.textContent = best > 0 ? '★★★' : (isUnlocked ? '---' : '🔒');
      badge.appendChild(starsSpan);

      if (isUnlocked) {
        badge.addEventListener('click', () => {
          playAudio('swap');
          startLevel(idx);
        });
      }

      dom.levelsGrid.appendChild(badge);
    });
  }

  // ==========================================
  // RENDERIZADO VECTORIAL 3D Y ESTÉTICA 00s
  // ==========================================
  function render() {
    const ctx = State.ctx;
    if (!ctx) return;

    const w = State.boardW || dom.canvas.width;
    const h = State.boardH || dom.canvas.height;

    ctx.clearRect(0, 0, w, h);

    const rad = State.bubbleRadius;

    // 1. Línea límite de peligro (DEADLINE)
    const deadY = CONFIG.DEADLINE_ROW * (rad * Math.sqrt(3)) + rad * 2;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 60, 90, 0.4)';
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, deadY);
    ctx.lineTo(w, deadY);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 60, 90, 0.6)';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.fillText('LÍNEA DE PELIGRO', 8, deadY - 4);
    ctx.restore();

    // 2. Línea guía de trayectoria y rebote (si está apuntando)
    if (State.state === 'AIMING' && State.isDragging) {
      renderAimGuide(ctx, w, rad);
    }

    // 3. Renderizar burbujas en la cuadrícula
    for (let r = 0; r < CONFIG.MAX_ROWS; r++) {
      const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
      for (let c = 0; c < maxCols; c++) {
        const bubble = State.grid[r]?.[c];
        if (bubble && bubble.color !== 0) {
          const center = LanzaburbujasLogic.getCellCenter(r, c, rad);
          renderBubble3D(ctx, center.x, center.y, rad * 0.95, bubble.color, bubble.special);
        }
      }
    }

    // 4. Renderizar proyectil en vuelo
    if (State.projectile) {
      const p = State.projectile;
      renderBubble3D(ctx, p.x, p.y, rad * 0.95, p.color, p.special);
    }

    // 5. Renderizar burbujas que caen (flotantes)
    for (const fb of State.fallingBubbles) {
      renderBubble3D(ctx, fb.x, fb.y, rad * 0.95, fb.color, fb.special);
    }

    // 6. Cañón / Base de lanzamiento abajo
    renderCannon(ctx);

    // 7. Partículas
    ParticlePool.render(ctx);
  }

  function renderAimGuide(ctx, boardWidth, rad) {
    const trajectory = LanzaburbujasLogic.raycastTrajectory(
      State.cannonX,
      State.cannonY,
      State.aimAngle,
      rad,
      boardWidth,
      State.grid
    );

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.65)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(trajectory.path[0].x, trajectory.path[0].y);
    for (let i = 1; i < trajectory.path.length; i++) {
      ctx.lineTo(trajectory.path[i].x, trajectory.path[i].y);
    }
    ctx.stroke();

    // Marcador de punto de impacto / casilla prevista
    if (trajectory.targetCell) {
      const center = LanzaburbujasLogic.getCellCenter(trajectory.targetCell.r, trajectory.targetCell.c, rad);
      ctx.strokeStyle = 'rgba(255, 234, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(center.x, center.y, rad * 0.85, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function renderCannon(ctx) {
    const cx = State.cannonX;
    const cy = State.cannonY;
    const rad = State.bubbleRadius;

    ctx.save();

    // Base metálica circular del cañón con bisel 00s
    const baseGrad = ctx.createRadialGradient(cx - 5, cy - 5, 2, cx, cy, rad * 1.5);
    baseGrad.addColorStop(0, '#ffffff');
    baseGrad.addColorStop(0.3, '#7ab0d6');
    baseGrad.addColorStop(0.8, '#264d73');
    baseGrad.addColorStop(1, '#0e2338');

    ctx.beginPath();
    ctx.arc(cx, cy, rad * 1.3, 0, Math.PI * 2);
    ctx.fillStyle = baseGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cañón orientable
    ctx.translate(cx, cy);
    ctx.rotate(State.aimAngle + Math.PI / 2);

    ctx.fillStyle = 'rgba(0, 180, 255, 0.35)';
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-rad * 0.65, -rad * 1.6, rad * 1.3, rad * 1.2, 8);
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // Burbuja cargada actualmente en el centro del cañón
    if (State.state === 'AIMING' || State.state === 'POPPING') {
      renderBubble3D(ctx, cx, cy, rad * 0.9, State.currentAmmo.color, State.currentAmmo.special);
    }
  }

  /**
   * Renderizado pseudo-3D vectorial de burbuja translúcida con brillos especulares
   */
  function renderBubble3D(ctx, cx, cy, r, colorId, special = CONFIG.SPECIALS.NONE) {
    ctx.save();

    // Sombra proyectada suave
    ctx.beginPath();
    ctx.arc(cx + r * 0.1, cy + r * 0.12, r * 0.9, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();

    // 1. Burbuja Especial: ROCA
    if (special === CONFIG.SPECIALS.ROCK) {
      renderRockBubble(ctx, cx, cy, r);
      ctx.restore();
      return;
    }

    // 2. Burbuja Especial: BOMBA
    if (special === CONFIG.SPECIALS.BOMB) {
      renderBombBubble(ctx, cx, cy, r);
      ctx.restore();
      return;
    }

    // 3. Burbuja Especial: ARCOÍRIS
    if (special === CONFIG.SPECIALS.RAINBOW) {
      renderRainbowBubble(ctx, cx, cy, r);
      ctx.restore();
      return;
    }

    // Burbuja Normal de color translúcido
    const colCfg = CONFIG.COLORS.find(c => c.id === colorId) || CONFIG.COLORS[0];

    // Gradiente esférico principal
    const sphereGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.05, cx, cy, r);
    sphereGrad.addColorStop(0, '#ffffff');
    sphereGrad.addColorStop(0.2, colCfg.light);
    sphereGrad.addColorStop(0.65, colCfg.main);
    sphereGrad.addColorStop(0.95, colCfg.dark);
    sphereGrad.addColorStop(1, 'rgba(0,0,0,0.4)');

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = sphereGrad;
    ctx.fill();

    // Anillo exterior brillante
    ctx.strokeStyle = colCfg.light;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Reflejo especular blanco superior curvado
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.28, cy - r * 0.32, r * 0.32, r * 0.18, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Reflejo secundario inferior suave
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.25, cy + r * 0.3, r * 0.2, r * 0.1, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function renderRockBubble(ctx, cx, cy, r) {
    // Esfera pétrea texturizada
    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    grad.addColorStop(0, '#d9d9d9');
    grad.addColorStop(0.5, '#737373');
    grad.addColorStop(1, '#262626');

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Grietas pétreas
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.5, cy - r * 0.2);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + r * 0.4, cy - r * 0.4);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - r * 0.1, cy + r * 0.6);
    ctx.stroke();
  }

  function renderBombBubble(ctx, cx, cy, r) {
    // Esfera negra brillante con núcleo explosivo
    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    grad.addColorStop(0, '#ff4d4d');
    grad.addColorStop(0.3, '#330000');
    grad.addColorStop(1, '#0d0d0d');

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = '#ff3333';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ícono de dinamita o mecha encendida
    ctx.fillStyle = '#ffea00';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }

  function renderRainbowBubble(ctx, cx, cy, r) {
    // Esfera perlada arcoíris
    const grad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.1, cx, cy, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.2, '#00ffff');
    grad.addColorStop(0.4, '#ff00ff');
    grad.addColorStop(0.6, '#ffff00');
    grad.addColorStop(0.8, '#00ff66');
    grad.addColorStop(1, '#002244');

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Destello blanco
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.25, cy - r * 0.25, r * 0.28, r * 0.14, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // ==========================================
  // INPUTS TÁCTILES Y APUNTADO
  // ==========================================
  function setupInputs() {
    const canvas = dom.canvas;

    function getCoords(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const bw = State.boardW || rect.width;
      const bh = State.boardH || rect.height;
      const scaleX = bw / rect.width;
      const scaleY = bh / rect.height;

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    }

    function handleAim(px, py) {
      const dx = px - State.cannonX;
      const dy = py - State.cannonY;
      let angle = Math.atan2(dy, dx);

      // Limitar ángulo para no disparar horizontal ni hacia abajo
      // Solo rango entre -170° y -10°
      const minAngle = -Math.PI + 0.15;
      const maxAngle = -0.15;
      angle = Math.max(minAngle, Math.min(maxAngle, angle));

      State.aimAngle = angle;
    }

    function handlePointerDown(e) {
      if (State.state !== 'AIMING') return;

      if (window.ArcadeAudio?.ctx?.state === 'suspended') {
        window.ArcadeAudio.ctx.resume();
      }

      const { x, y } = getCoords(e);

      // Si se toca directamente la base del cañón, intercambiar burbuja
      const distToCannon = Math.hypot(x - State.cannonX, y - State.cannonY);
      if (distToCannon <= State.bubbleRadius * 2) {
        swapAmmo();
        return;
      }

      State.isDragging = true;
      handleAim(x, y);
    }

    function handlePointerMove(e) {
      if (!State.isDragging || State.state !== 'AIMING') return;
      const { x, y } = getCoords(e);
      handleAim(x, y);
    }

    function handlePointerUp() {
      if (!State.isDragging) return;
      State.isDragging = false;
      if (State.state === 'AIMING') {
        fireProjectile();
      }
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
  // BUCLE DE JUEGO PRINCIPAL
  // ==========================================
  function gameLoop(timestamp) {
    if (!State.lastTime) State.lastTime = timestamp;
    const dt = Math.min((timestamp - State.lastTime) / 1000, 0.1);
    State.lastTime = timestamp;

    // Actualizar proyectil
    if (State.projectile) {
      updateProjectile(dt);
    }

    // Actualizar burbujas que caen
    for (let i = State.fallingBubbles.length - 1; i >= 0; i--) {
      const fb = State.fallingBubbles[i];
      fb.vy += 850 * dt; // Gravedad
      fb.x += fb.vx * dt;
      fb.y += fb.vy * dt;

      if (fb.y > dom.canvas.height + 50) {
        State.fallingBubbles.splice(i, 1);
      }
    }

    // Actualizar partículas
    ParticlePool.update(dt);

    // Dibujar frame
    render();

    requestAnimationFrame(gameLoop);
  }

  // ==========================================
  // CONFIGURACIÓN DE UI Y REDIMENSIÓN
  // ==========================================
  function handleResize() {
    const container = dom.canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const pad = 6;
    const availW = Math.max(100, rect.width - pad);
    const availH = Math.max(100, rect.height - pad);

    const ratio = CONFIG.VIRTUAL_W / CONFIG.VIRTUAL_H;
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

    const dpr = window.devicePixelRatio || 1;
    dom.canvas.style.width = `${targetW}px`;
    dom.canvas.style.height = `${targetH}px`;
    dom.canvas.width = Math.round(targetW * dpr);
    dom.canvas.height = Math.round(targetH * dpr);

    State.ctx = dom.canvas.getContext('2d');
    State.ctx.resetTransform();
    State.ctx.scale(dpr, dpr);

    // Calcular radio de burbujas para encajar 8 burbujas exactamente en el ancho en píxeles CSS
    State.bubbleRadius = targetW / (CONFIG.COLS_EVEN * 2);
    State.cannonX = targetW / 2;
    State.cannonY = targetH - State.bubbleRadius * 1.8;
  }

  function setupUI() {
    window.addEventListener('resize', handleResize);

    dom.btnSwapAmmo.addEventListener('click', swapAmmo);

    dom.btnEndlessMode.addEventListener('click', () => {
      playAudio('swap');
      startEndless();
    });

    // Pausa
    dom.btnPauseHeader.addEventListener('click', () => {
      if (State.state !== 'AIMING') return;
      State.state = 'PAUSED';
      dom.overlayPause.classList.remove('hidden');
      playAudio('swap');
    });

    dom.btnResume.addEventListener('click', () => {
      State.state = 'AIMING';
      dom.overlayPause.classList.add('hidden');
      playAudio('swap');
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

    // Modal Resultados
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

    // Silencio / Sonido
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
