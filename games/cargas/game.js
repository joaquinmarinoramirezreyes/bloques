/**
 * games/cargas/game.js - Cargas Arcade 90s Industrial
 * Laberinto táctico con cargas de resonancia en rombo, empuje de núcleos,
 * cadenas de detonación, 4 guardianes mecánicos y jefes con ataques telegrafiados.
 */
(() => {
  'use strict';

  // ==========================================
  // CONFIGURACIÓN Y CONSTANTES DE BALANCE
  // ==========================================
  const CONFIG = {
    COLS: 11,
    ROWS: 13,
    TILE_SIZE: 30,
    VIRTUAL_W: 330, // 11 * 30
    VIRTUAL_H: 390, // 13 * 30

    PLAYER_SPEED: 4.2, // celdas por segundo
    CHARGE_FUSE_TIME: 2.8, // segundos antes de detonación automática
    CHARGE_SLIDE_SPEED: 9.0, // celdas por segundo al ser empujada
    DEFAULT_BLAST_RADIUS: 2, // radio Manhattan
    MAX_BLAST_RADIUS: 5,
    DEFAULT_MAX_CHARGES: 1,
    MAX_CHARGES_LIMIT: 4,
    BLAST_DURATION: 0.45, // segundos que dura la onda
    INVULNERABILITY_TIME: 2.2, // segundos de invulnerabilidad tras ser golpeado

    STARTING_LIVES: 3,
    STORAGE_KEY: 'cargas:v1:best_score',

    // 12 Niveles de Diseño como Datos
    // '#' = Pilar Indestructible, '.' = Piso, 'B' = Bloque Blando,
    // '1' = P1, '2' = P2, 'p' = Patrullero, 'h' = Cazador, 'a' = Blindado, 'c' = Constructor,
    // 'X' = Portal de Salida, 'G' = Jefe Titán, 'K' = Jefe Arconte
    LEVELS: [
      {
        id: 1,
        name: "Complejo Alfa",
        desc: "Iniciación de resonancia en el complejo exterior",
        time: 120,
        map: [
          "###########",
          "#1..B.B..2#",
          "#.#.#.#.#.#",
          "#B.Bp.B.B.B#",
          "#.#B#B#B#.#",
          "#..B.B.B..#",
          "#.#.#.#.#.#",
          "#B.Bp.B.B.B#",
          "#.#B#B#B#.#",
          "#..B.p.B.X#",
          "#.#.#.#.#.#",
          "#B.B...B.B#",
          "###########"
        ]
      },
      {
        id: 2,
        name: "Depósito Ferroso",
        desc: "Aparición de cazadores mecánicos que detectan la resonancia",
        time: 120,
        map: [
          "###########",
          "#1..B.B..2#",
          "#.#B#.#B#.#",
          "#B..p..B.B#",
          "#.#B#B#B#.#",
          "#..B.h.B..#",
          "#.#.#.#.#.#",
          "#B.B.p.B.B#",
          "#.#B#B#B#.#",
          "#B.B...B.X#",
          "#.#.#.#.#.#",
          "#..B.B.B..#",
          "###########"
        ]
      },
      {
        id: 3,
        name: "Conductos Subterráneos",
        desc: "Unidades blindadas pesadas resisten el primer impacto",
        time: 120,
        map: [
          "###########",
          "#1..B.B..2#",
          "#.#.#.#.#.#",
          "#B.B.a.B.B#",
          "#.#B#B#B#.#",
          "#..B.h.B..#",
          "#.#.#.#.#.#",
          "#B.B.p.B.B#",
          "#.#B#B#B#.#",
          "#X.B.p.B..#",
          "#.#.#.#.#.#",
          "#..B.B.B..#",
          "###########"
        ]
      },
      {
        id: 4,
        name: "Fundición Nuclear",
        desc: "Nanoconstructores despliegan barreras orgánicas",
        time: 110,
        map: [
          "###########",
          "#1..B.B..2#",
          "#.#B#.#B#.#",
          "#B.B.c.B.B#",
          "#.#B#B#B#.#",
          "#..B.a.B..#",
          "#.#.#.#.#.#",
          "#B.B.h.B.B#",
          "#.#B#B#B#.#",
          "#..B.p.B.X#",
          "#.#B#.#B#.#",
          "#..B.B.B..#",
          "###########"
        ]
      },
      {
        id: 5,
        name: "Cámara del Titán",
        desc: "¡ALERTA DE JEFE! Titán Giróscopo en la arena central",
        time: 150,
        isBoss: true,
        bossType: 'titan',
        map: [
          "###########",
          "#1...B...2#",
          "#.B#...#B.#",
          "#B.......B#",
          "#.B.....B.#",
          "#....G....#",
          "#..B...B..#",
          "#.B.....B.#",
          "#B.......B#",
          "#.B#...#B.#",
          "#..B.X.B..#",
          "#...B.B...#",
          "###########"
        ]
      },
      {
        id: 6,
        name: "Refinería de Silicio",
        desc: "Constructores duales remodelan activamente los corredores",
        time: 110,
        map: [
          "###########",
          "#1..B.B..2#",
          "#.#B#.#B#.#",
          "#B.B.c.B.B#",
          "#.#B#B#B#.#",
          "#..B.h.B..#",
          "#.#.#.#.#.#",
          "#B.B.c.B.B#",
          "#.#B#B#B#.#",
          "#..B.h.B.X#",
          "#.#B#.#B#.#",
          "#..B.B.B..#",
          "###########"
        ]
      },
      {
        id: 7,
        name: "Núcleo Magnético",
        desc: "Blindados patrullan en formación con soporte de cazadores",
        time: 110,
        map: [
          "###########",
          "#1..B.B..2#",
          "#.#B#B#B#.#",
          "#B.B.a.B.B#",
          "#.#.#.#.#.#",
          "#..B.h.B..#",
          "#.#B#B#B#.#",
          "#B.B.a.B.B#",
          "#.#.#.#.#.#",
          "#X.B.h.B..#",
          "#.#B#B#B#.#",
          "#..B.p.B..#",
          "###########"
        ]
      },
      {
        id: 8,
        name: "Galería de Ensamblaje",
        desc: "Múltiples cazadores coordinados y blindados pesados",
        time: 100,
        map: [
          "###########",
          "#1..B.B..2#",
          "#.#.#.#.#.#",
          "#B.B.h.B.B#",
          "#.#B#B#B#.#",
          "#..B.c.B..#",
          "#.#.#.#.#.#",
          "#B.B.h.B.B#",
          "#.#B#B#B#.#",
          "#..B.a.B.X#",
          "#.#.#.#.#.#",
          "#..B.h.B..#",
          "###########"
        ]
      },
      {
        id: 9,
        name: "Subestación de Resonancia",
        desc: "Blindados triples protegen la salida del reactor",
        time: 100,
        map: [
          "###########",
          "#1..B.B..2#",
          "#.#B#B#B#.#",
          "#B.B.a.B.B#",
          "#.#B#.#B#.#",
          "#..B.h.B..#",
          "#.#.#.#.#.#",
          "#B.B.a.B.B#",
          "#.#B#.#B#.#",
          "#X.B.a.B..#",
          "#.#B#.#B#.#",
          "#..B.h.B..#",
          "###########"
        ]
      },
      {
        id: 10,
        name: "Trono del Arconte",
        desc: "¡ALERTA DE JEFE! Núcleo Arconte emite pulsos resonantes",
        time: 160,
        isBoss: true,
        bossType: 'archon',
        map: [
          "###########",
          "#1...B...2#",
          "#.B#...#B.#",
          "#B.......B#",
          "#..B...B..#",
          "#....K....#",
          "#..B...B..#",
          "#B.......B#",
          "#.B#...#B.#",
          "#....X....#",
          "#.B#...#B.#",
          "#...B.B...#",
          "###########"
        ]
      },
      {
        id: 11,
        name: "Brecha Cuántica",
        desc: "Infiltración extrema contra cazadores de élite y blindados",
        time: 90,
        map: [
          "###########",
          "#1..B.B..2#",
          "#.#B#B#B#.#",
          "#B.B.h.B.B#",
          "#.#.#.#.#.#",
          "#..B.a.B..#",
          "#.#B#B#B#.#",
          "#B.B.h.B.B#",
          "#.#.#.#.#.#",
          "#..B.c.B.X#",
          "#.#B#B#B#.#",
          "#..B.h.B..#",
          "###########"
        ]
      },
      {
        id: 12,
        name: "Colapso del Reactor",
        desc: "¡EVACUACIÓN! Desactiva las últimas defensas antes de la detonación",
        time: 90,
        map: [
          "###########",
          "#1..B.B..2#",
          "#.#.#.#.#.#",
          "#B.B.h.B.B#",
          "#.#B#B#B#.#",
          "#..B.a.B..#",
          "#.#.#.#.#.#",
          "#B.B.c.B.B#",
          "#.#B#B#B#.#",
          "#X.B.h.B..#",
          "#.#.#.#.#.#",
          "#..B.a.B..#",
          "###########"
        ]
      }
    ]
  };

  // ==========================================
  // LÓGICA PURA Y ALGORITMOS VERIFICABLES
  // ==========================================
  const CargasLogic = {
    /**
     * Parsea un mapa de cadenas a matriz 2D y extrae entidades
     */
    parseMap(mapStrings) {
      const rows = mapStrings.length;
      const cols = mapStrings[0].length;
      const grid = [];
      let p1Start = { r: 1, c: 1 };
      let p2Start = { r: 1, c: cols - 2 };
      let portal = { r: rows - 2, c: cols - 2 };
      const guardians = [];
      let boss = null;

      for (let r = 0; r < rows; r++) {
        grid[r] = [];
        for (let c = 0; c < cols; c++) {
          const char = mapStrings[r][c];
          if (char === '#') {
            grid[r][c] = 1; // Pilar indestructible
          } else if (char === 'B') {
            grid[r][c] = 2; // Bloque blando destructible
          } else {
            grid[r][c] = 0; // Piso transitable
            if (char === '1') p1Start = { r, c };
            else if (char === '2') p2Start = { r, c };
            else if (char === 'X') portal = { r, c };
            else if (char === 'p') guardians.push({ type: 'patrol', r, c, hp: 1 });
            else if (char === 'h') guardians.push({ type: 'hunter', r, c, hp: 1 });
            else if (char === 'a') guardians.push({ type: 'armored', r, c, hp: 2 });
            else if (char === 'c') guardians.push({ type: 'builder', r, c, hp: 1 });
            else if (char === 'G') boss = { type: 'titan', r, c, hp: 5, maxHp: 5 };
            else if (char === 'K') boss = { type: 'archon', r, c, hp: 8, maxHp: 8 };
          }
        }
      }
      return { rows, cols, grid, p1Start, p2Start, portal, guardians, boss };
    },

    /**
     * Onda expansiva en forma de rombo/diamante (Distancia Manhattan <= radius)
     * Se detiene ante pilares indestructibles pero destruye y es absorbida por bloques blandos.
     */
    calculateDiamondBlast(grid, r0, c0, radius) {
      const rows = grid.length;
      const cols = grid[0].length;
      const visited = new Set();
      const blastCells = [];
      const destroyedBlocks = [];

      const queue = [{ r: r0, c: c0, dist: 0 }];
      visited.add(`${r0},${c0}`);

      while (queue.length > 0) {
        const cur = queue.shift();
        blastCells.push({ r: cur.r, c: cur.c, dist: cur.dist });

        if (cur.dist < radius) {
          const dirs = [
            { r: -1, c: 0 },
            { r: 1, c: 0 },
            { r: 0, c: -1 },
            { r: 0, c: 1 }
          ];

          for (const d of dirs) {
            const nr = cur.r + d.r;
            const nc = cur.c + d.c;
            const key = `${nr},${nc}`;

            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            if (visited.has(key)) continue;
            visited.add(key);

            const tile = grid[nr][nc];
            if (tile === 1) {
              // Indestructible pillar blocks blast wave completely
              continue;
            } else if (tile === 2) {
              // Soft destructible block is hit and destroyed, but stops further propagation
              blastCells.push({ r: nr, c: nc, dist: cur.dist + 1 });
              destroyedBlocks.push({ r: nr, c: nc });
            } else {
              // Open floor or entity: wave continues expanding
              queue.push({ r: nr, c: nc, dist: cur.dist + 1 });
            }
          }
        }
      }

      return { blastCells, destroyedBlocks };
    },

    /**
     * Simula el empuje y deslizamiento continuo de una carga
     */
    simulateSlide(grid, chargeR, chargeC, dirR, dirC, guardians = []) {
      const rows = grid.length;
      const cols = grid[0].length;
      let curR = chargeR;
      let curC = chargeC;
      const crushedGuardians = [];

      while (true) {
        const nextR = curR + dirR;
        const nextC = curC + dirC;

        if (nextR < 0 || nextR >= rows || nextC < 0 || nextC >= cols) break;
        if (grid[nextR][nextC] === 1 || grid[nextR][nextC] === 2) {
          // Bloque o pared: se detiene justo antes
          break;
        }

        curR = nextR;
        curC = nextC;

        // Si colisiona con un guardián, lo aplasta
        for (const g of guardians) {
          if (!g.destroyed && g.r === curR && g.c === curC) {
            g.destroyed = true;
            crushedGuardians.push(g);
          }
        }
      }

      return { finalR: curR, finalC: curC, crushedGuardians };
    },

    /**
     * Resonancia en cadena: detona cualquier carga dentro del alcance de otra
     * Garantiza terminación sin bucles infinitos con Set de detonadas.
     */
    resolveChainDetonations(charges, grid) {
      const detonatedSet = new Set();
      const blastCells = [];
      const destroyedBlocks = [];
      const chainList = [];

      const queue = [];
      for (const ch of charges) {
        if ((ch.timer <= 0 || ch.triggered) && !ch.detonated) {
          queue.push(ch);
          detonatedSet.add(ch.id);
          ch.detonated = true;
        }
      }

      let comboCount = 0;

      while (queue.length > 0) {
        const current = queue.shift();
        comboCount++;
        chainList.push(current);

        const blast = this.calculateDiamondBlast(grid, current.r, current.c, current.radius);
        blastCells.push(...blast.blastCells);
        destroyedBlocks.push(...blast.destroyedBlocks);

        for (const cell of blast.blastCells) {
          for (const other of charges) {
            if (!detonatedSet.has(other.id) && !other.detonated) {
              if (other.r === cell.r && other.c === cell.c) {
                detonatedSet.add(other.id);
                other.detonated = true;
                other.triggered = true;
                queue.push(other);
              }
            }
          }
        }
      }

      return {
        chainList,
        comboCount,
        blastCells,
        destroyedBlocks
      };
    },

    /**
     * Evasión de los guardianes: evalúa peligro de cargas a punto de detonar (timer <= 1.0s)
     */
    getGuardianEvadeMove(grid, guardianR, guardianC, charges) {
      const rows = grid.length;
      const cols = grid[0].length;

      const dangerMap = new Map();
      let minChargeDist = Infinity;
      let closestCharge = null;

      for (const ch of charges) {
        if (!ch.detonated && ch.timer <= 1.0) {
          const d = Math.abs(ch.r - guardianR) + Math.abs(ch.c - guardianC);
          if (d < minChargeDist) {
            minChargeDist = d;
            closestCharge = ch;
          }
          const blast = this.calculateDiamondBlast(grid, ch.r, ch.c, ch.radius);
          for (const cell of blast.blastCells) {
            dangerMap.set(`${cell.r},${cell.c}`, true);
          }
        }
      }

      const currentIsDangerous = dangerMap.has(`${guardianR},${guardianC}`);
      if (!currentIsDangerous || !closestCharge) {
        return { shouldEvade: false, dir: { r: 0, c: 0 } };
      }

      const dirs = [
        { r: -1, c: 0 },
        { r: 1, c: 0 },
        { r: 0, c: -1 },
        { r: 0, c: 1 }
      ];

      let bestDir = null;
      let bestScore = -Infinity;

      for (const d of dirs) {
        const nr = guardianR + d.r;
        const nc = guardianC + d.c;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (grid[nr][nc] !== 0) continue; // obstáculo

        const isSafe = !dangerMap.has(`${nr},${nc}`);
        const distToCharge = Math.abs(nr - closestCharge.r) + Math.abs(nc - closestCharge.c);

        let score = distToCharge;
        if (isSafe) score += 1000;

        if (score > bestScore) {
          bestScore = score;
          bestDir = d;
        }
      }

      return {
        shouldEvade: true,
        dir: bestDir || { r: 0, c: 0 }
      };
    }
  };

  // Exportar para pruebas Node
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, CargasLogic };
    return;
  }

  // ==========================================
  // SISTEMA DE AUDIO PROCEDURAL (SINTETIZADO)
  // ==========================================
  const SynthSound = {
    ctx: null,
    muted: false,

    init() {
      if (this.ctx) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    },

    resume() {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    },

    playTone(freq, type = 'sine', duration = 0.15, vol = 0.2, freqSlide = null) {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      this.resume();

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (freqSlide) {
          osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqSlide), now + duration);
        }

        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
      } catch (e) {}
    },

    playNoise(duration = 0.25, vol = 0.25) {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      this.resume();

      try {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(this.ctx.currentTime);
      } catch (e) {}
    },

    sfxDrop() {
      this.playTone(480, 'sine', 0.12, 0.22, 180);
    },

    sfxSlide() {
      this.playTone(320, 'sawtooth', 0.18, 0.15, 520);
    },

    sfxExplode() {
      this.playTone(140, 'triangle', 0.35, 0.35, 30);
      this.playNoise(0.38, 0.3);
    },

    sfxCombo() {
      this.playTone(520, 'square', 0.15, 0.2, 880);
    },

    sfxPowerup() {
      this.playTone(440, 'sine', 0.1, 0.25, 660);
      setTimeout(() => this.playTone(660, 'sine', 0.15, 0.25, 990), 80);
    },

    sfxHurt() {
      this.playTone(160, 'sawtooth', 0.25, 0.3, 70);
    },

    sfxBossTelegraph() {
      this.playTone(740, 'square', 0.18, 0.22, 370);
    },

    sfxVictory() {
      this.playTone(330, 'triangle', 0.15, 0.25);
      setTimeout(() => this.playTone(440, 'triangle', 0.15, 0.25), 120);
      setTimeout(() => this.playTone(550, 'triangle', 0.25, 0.25), 240);
    }
  };

  // ==========================================
  // ESTADO Y POOLS DE ENTIDADES
  // ==========================================
  const State = {
    canvas: null,
    ctx: null,
    boardW: CONFIG.VIRTUAL_W,
    boardH: CONFIG.VIRTUAL_H,
    tileSize: CONFIG.TILE_SIZE,

    state: 'MENU', // 'MENU', 'PLAYING', 'PAUSED', 'GAMEOVER', 'LEVELCLEAR'
    is2P: false,

    currentLevelIdx: 0,
    score: 0,
    timeRemaining: 120,
    levelEnemiesKilled: 0,
    levelBlocksDestroyed: 0,
    portalUnlocked: false,

    // Cuadrícula activa
    grid: [],
    portalPos: { r: 11, c: 8 },

    // Jugadores
    p1: null,
    p2: null,

    // Entidades
    charges: [],
    activeBlasts: [], // { cells: [{r, c, dist}], timer, maxTimer }
    guardians: [],
    boss: null,
    powerups: [], // { r, c, type: 'R'|'C'|'S'|'D'|'K' }
    particles: [], // Pool de partículas
    floats: [], // Textos flotantes

    // Control de tiempo
    lastTime: 0,
    shakeTime: 0,
    toastMsg: '',
    toastTimer: 0
  };

  // ==========================================
  // CLASES Y POOLING
  // ==========================================
  class Player {
    constructor(id, r, c, color, name) {
      this.id = id;
      this.r = r;
      this.c = c;
      this.x = c * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
      this.y = r * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
      this.color = color;
      this.name = name;

      this.lives = CONFIG.STARTING_LIVES;
      this.radius = CONFIG.DEFAULT_BLAST_RADIUS;
      this.maxCharges = CONFIG.DEFAULT_MAX_CHARGES;
      this.speedMult = 1.0;
      this.hasRemote = false;

      this.invulnTimer = 0;
      this.dir = { r: 0, c: 0 };
      this.bufferedDir = { r: 0, c: 0 };
      this.isAlive = true;
    }

    resetPos(r, c) {
      this.r = r;
      this.c = c;
      this.x = c * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
      this.y = r * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
      this.dir = { r: 0, c: 0 };
      this.bufferedDir = { r: 0, c: 0 };
      this.invulnTimer = 1.5;
      this.isAlive = true;
    }
  }

  // Pre-allocación de pool de partículas
  const MAX_PARTICLES = 160;
  for (let i = 0; i < MAX_PARTICLES; i++) {
    State.particles.push({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 3,
      color: '#fff',
      life: 0,
      maxLife: 0.5
    });
  }

  function spawnParticle(x, y, vx, vy, color, size, life) {
    for (const p of State.particles) {
      if (!p.active) {
        p.active = true;
        p.x = x;
        p.y = y;
        p.vx = vx;
        p.vy = vy;
        p.color = color;
        p.size = size;
        p.life = life;
        p.maxLife = life;
        return;
      }
    }
  }

  function spawnDebris(x, y, color = '#f59e0b', count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      spawnParticle(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        2 + Math.random() * 3,
        0.3 + Math.random() * 0.3
      );
    }
  }

  function showToast(msg, duration = 2.0) {
    State.toastMsg = msg;
    State.toastTimer = duration;
    const dom = document.getElementById('toast-banner');
    if (dom) {
      dom.textContent = msg;
      dom.classList.remove('hidden');
    }
  }

  // ==========================================
  // INICIALIZACIÓN DE NIVEL
  // ==========================================
  function loadLevel(idx) {
    if (idx < 0) idx = 0;
    if (idx >= CONFIG.LEVELS.length) idx = CONFIG.LEVELS.length - 1;

    State.currentLevelIdx = idx;
    const lvlData = CONFIG.LEVELS[idx];
    const parsed = CargasLogic.parseMap(lvlData.map);

    State.grid = parsed.grid;
    State.timeRemaining = lvlData.time;
    State.levelEnemiesKilled = 0;
    State.levelBlocksDestroyed = 0;
    State.portalUnlocked = false;
    State.portalPos = parsed.portal;

    // Configurar jugadores
    if (!State.p1) {
      State.p1 = new Player(1, parsed.p1Start.r, parsed.p1Start.c, '#06b6d4', 'Ingeniero Azul');
    } else {
      State.p1.resetPos(parsed.p1Start.r, parsed.p1Start.c);
    }

    if (State.is2P) {
      if (!State.p2) {
        State.p2 = new Player(2, parsed.p2Start.r, parsed.p2Start.c, '#f59e0b', 'Ingeniero Ámbar');
      } else {
        State.p2.resetPos(parsed.p2Start.r, parsed.p2Start.c);
      }
    } else {
      State.p2 = null;
    }

    // Cargas y ondas vacías
    State.charges = [];
    State.activeBlasts = [];
    State.powerups = [];

    // Inicializar guardianes
    State.guardians = parsed.guardians.map(g => ({
      type: g.type,
      r: g.r,
      c: g.c,
      x: g.c * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
      y: g.r * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
      hp: g.hp,
      maxHp: g.hp,
      dir: { r: 1, c: 0 },
      stepProgress: 0,
      builderTimer: 4.5,
      destroyed: false
    }));

    // Jefe (si aplica)
    if (parsed.boss) {
      State.boss = {
        type: parsed.boss.type,
        r: parsed.boss.r,
        c: parsed.boss.c,
        x: parsed.boss.c * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
        y: parsed.boss.r * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
        hp: parsed.boss.hp,
        maxHp: parsed.boss.maxHp,
        attackTimer: 3.5,
        telegraphing: false,
        telegraphZones: [],
        laserTimer: 0,
        destroyed: false
      };
      showToast(`¡ALERTA! SECTOR DE JEFE: ${lvlData.name.toUpperCase()}`, 3.0);
    } else {
      State.boss = null;
    }

    // Actualizar UI
    updateHUD();
    updateLevelDisplay();
  }

  // ==========================================
  // MECÁNICAS DE JUEGO: CARGAS Y EMPUJE
  // ==========================================
  let chargeIdCounter = 1;

  function placeCharge(player) {
    if (!player || !player.isAlive) return;

    // Verificar límite de cargas activas del jugador
    const playerCharges = State.charges.filter(c => c.ownerId === player.id && !c.detonated);
    if (playerCharges.length >= player.maxCharges) return;

    // Verificar si ya hay una carga en esa casilla
    const existing = State.charges.find(c => c.r === player.r && c.c === player.c && !c.detonated);
    if (existing) return;

    const newCharge = {
      id: chargeIdCounter++,
      ownerId: player.id,
      r: player.r,
      c: player.c,
      x: player.c * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
      y: player.r * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
      radius: player.radius,
      timer: player.hasRemote ? Infinity : CONFIG.CHARGE_FUSE_TIME,
      maxTimer: CONFIG.CHARGE_FUSE_TIME,
      remote: player.hasRemote,
      sliding: false,
      slideDir: { r: 0, c: 0 },
      detonated: false,
      triggered: false
    };

    State.charges.push(newCharge);
    SynthSound.sfxDrop();
    updateHUD();
  }

  function triggerRemote(player) {
    if (!player || !player.hasRemote) return;
    let anyTriggered = false;
    for (const ch of State.charges) {
      if (ch.ownerId === player.id && !ch.detonated) {
        ch.triggered = true;
        anyTriggered = true;
      }
    }
    if (anyTriggered) {
      detonateTriggeredCharges();
    }
  }

  function detonateTriggeredCharges() {
    const res = CargasLogic.resolveChainDetonations(State.charges, State.grid);

    if (res.chainList.length > 0) {
      SynthSound.sfxExplode();
      State.shakeTime = 0.25;

      // Registrar onda expansiva activa para renderizado y daño
      State.activeBlasts.push({
        cells: res.blastCells,
        timer: CONFIG.BLAST_DURATION,
        maxTimer: CONFIG.BLAST_DURATION
      });

      // Procesar bloques blandos destruidos
      for (const b of res.destroyedBlocks) {
        if (State.grid[b.r][b.c] === 2) {
          State.grid[b.r][b.c] = 0; // Despejar bloque
          State.levelBlocksDestroyed++;
          State.score += 20 * res.comboCount;
          spawnDebris(
            b.c * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
            b.r * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
            '#f59e0b',
            10
          );

          // Probabilidad de soltar Powerup (35%)
          maybeSpawnPowerup(b.r, b.c);
        }
      }

      // Procesar daño a entidades alcanzadas por la onda
      damageEntitiesInBlast(res.blastCells, res.comboCount);

      if (res.comboCount > 1) {
        SynthSound.sfxCombo();
        showToast(`¡COMBO RESONANTE x${res.comboCount}!`, 1.5);
      }

      // Eliminar cargas detonadas
      State.charges = State.charges.filter(c => !c.detonated);
      updateHUD();
    }
  }

  function maybeSpawnPowerup(r, c) {
    const roll = Math.random();
    if (roll < 0.35) {
      const types = ['R', 'C', 'S', 'D'];
      const picked = types[Math.floor(Math.random() * types.length)];
      State.powerups.push({ r, c, type: picked });
    }
  }

  function damageEntitiesInBlast(blastCells, comboMult) {
    const blastSet = new Map();
    for (const cell of blastCells) {
      blastSet.set(`${cell.r},${cell.c}`, true);
    }

    // Daño a Guardianes
    for (const g of State.guardians) {
      if (!g.destroyed && blastSet.has(`${g.r},${g.c}`)) {
        g.hp--;
        if (g.hp <= 0) {
          g.destroyed = true;
          State.levelEnemiesKilled++;
          const pts = (g.type === 'armored' ? 400 : 200) * comboMult;
          State.score += pts;
          SynthSound.playTone(380, 'square', 0.2, 0.3, 110);
          spawnDebris(g.x, g.y, '#ef4444', 14);
        } else {
          // Blindado golpeado: pierde coraza, se vuelve más rápido
          spawnDebris(g.x, g.y, '#f59e0b', 8);
          SynthSound.playTone(600, 'sawtooth', 0.15, 0.25, 300);
        }
      }
    }

    // Daño a Jefe
    if (State.boss && !State.boss.destroyed && blastSet.has(`${State.boss.r},${State.boss.c}`)) {
      State.boss.hp--;
      spawnDebris(State.boss.x, State.boss.y, '#ef4444', 16);
      SynthSound.playTone(220, 'sawtooth', 0.25, 0.35, 90);
      if (State.boss.hp <= 0) {
        State.boss.destroyed = true;
        State.score += 2500 * comboMult;
        showToast('¡JEFE DESTRUIDO!', 3.0);
        SynthSound.sfxVictory();
      }
    }

    // Daño a Jugadores (si están dentro de la onda)
    const checkPlayerHurt = (p) => {
      if (p && p.isAlive && p.invulnTimer <= 0 && blastSet.has(`${p.r},${p.c}`)) {
        hurtPlayer(p);
      }
    };
    checkPlayerHurt(State.p1);
    checkPlayerHurt(State.p2);
  }

  function hurtPlayer(p) {
    p.lives--;
    p.invulnTimer = CONFIG.INVULNERABILITY_TIME;
    SynthSound.sfxHurt();
    State.shakeTime = 0.4;
    spawnDebris(p.x, p.y, p.color, 15);
    updateHUD();

    if (p.lives <= 0) {
      p.isAlive = false;
      // Comprobar fin de partida
      const anyAlive = (State.p1 && State.p1.isAlive) || (State.p2 && State.p2.isAlive);
      if (!anyAlive) {
        triggerGameOver();
      }
    }
  }

  // ==========================================
  // ACTUALIZACIÓN DE ESTADO (DELTA TIME)
  // ==========================================
  function update(dt) {
    if (State.state !== 'PLAYING') return;

    // Reducir temporizador de nivel
    State.timeRemaining -= dt;
    if (State.timeRemaining <= 0) {
      State.timeRemaining = 0;
      triggerGameOver('¡TIEMPO AGOTADO! El reactor colapsó.');
      return;
    }

    // Screen Shake
    if (State.shakeTime > 0) {
      State.shakeTime -= dt;
    }

    // Toast Timer
    if (State.toastTimer > 0) {
      State.toastTimer -= dt;
      if (State.toastTimer <= 0) {
        const dom = document.getElementById('toast-banner');
        if (dom) dom.classList.add('hidden');
      }
    }

    // Actualizar Jugadores
    updatePlayer(State.p1, dt);
    if (State.is2P) {
      updatePlayer(State.p2, dt);
    }

    // Actualizar Cargas (fuse, empuje, deslizamiento)
    updateCharges(dt);

    // Actualizar Ondas Expansivas
    updateBlasts(dt);

    // Actualizar Guardianes y Jefe
    updateGuardians(dt);
    if (State.boss) {
      updateBoss(dt);
    }

    // Comprobar recolección de Powerups
    checkPowerups();

    // Comprobar condición de victoria / Portal de salida
    checkPortalCondition();

    // Actualizar Partículas
    for (const p of State.particles) {
      if (p.active) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) p.active = false;
      }
    }
  }

  function updatePlayer(p, dt) {
    if (!p || !p.isAlive) return;

    if (p.invulnTimer > 0) {
      p.invulnTimer -= dt;
    }

    // Movimiento en cuadrícula con amortiguación
    const dir = p.bufferedDir.r !== 0 || p.bufferedDir.c !== 0 ? p.bufferedDir : p.dir;
    if (dir.r !== 0 || dir.c !== 0) {
      const speed = CONFIG.PLAYER_SPEED * p.speedMult * CONFIG.TILE_SIZE * dt;
      const targetR = p.r + dir.r;
      const targetC = p.c + dir.c;

      // Verificar si hay una carga en la casilla objetivo para EMPUJARLA
      const chargeInFront = State.charges.find(c => c.r === targetR && c.c === targetC && !c.detonated && !c.sliding);
      if (chargeInFront) {
        // Empujar la carga si la casilla siguiente está vacía
        const nextBehindR = targetR + dir.r;
        const nextBehindC = targetC + dir.c;
        if (
          nextBehindR >= 0 && nextBehindR < CONFIG.ROWS &&
          nextBehindC >= 0 && nextBehindC < CONFIG.COLS &&
          State.grid[nextBehindR][nextBehindC] === 0
        ) {
          chargeInFront.sliding = true;
          chargeInFront.slideDir = { r: dir.r, c: dir.c };
          SynthSound.sfxSlide();
        }
      }

      // Validar si el jugador puede entrar a targetR, targetC
      if (
        targetR >= 0 && targetR < CONFIG.ROWS &&
        targetC >= 0 && targetC < CONFIG.COLS &&
        State.grid[targetR][targetC] === 0 &&
        !State.charges.some(c => c.r === targetR && c.c === targetC && !c.detonated)
      ) {
        const destX = targetC * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        const destY = targetR * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;

        const dx = destX - p.x;
        const dy = destY - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= speed) {
          p.x = destX;
          p.y = destY;
          p.r = targetR;
          p.c = targetC;
        } else {
          p.x += (dx / dist) * speed;
          p.y += (dy / dist) * speed;
          p.r = Math.floor(p.y / CONFIG.TILE_SIZE);
          p.c = Math.floor(p.x / CONFIG.TILE_SIZE);
        }
      }
    }
  }

  function updateCharges(dt) {
    let anyAutoDetonated = false;

    for (const ch of State.charges) {
      if (ch.detonated) continue;

      // Deslizamiento por empuje
      if (ch.sliding) {
        const slideStep = CONFIG.CHARGE_SLIDE_SPEED * CONFIG.TILE_SIZE * dt;
        const nextR = ch.r + ch.slideDir.r;
        const nextC = ch.c + ch.slideDir.c;

        if (
          nextR < 0 || nextR >= CONFIG.ROWS ||
          nextC < 0 || nextC >= CONFIG.COLS ||
          State.grid[nextR][nextC] !== 0 ||
          State.charges.some(other => other.id !== ch.id && other.r === nextR && other.c === nextC && !other.detonated)
        ) {
          // Chocó contra pared o bloque: detener deslizamiento
          ch.sliding = false;
          ch.x = ch.c * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
          ch.y = ch.r * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        } else {
          // Desplazar continuamente
          const targetX = nextC * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
          const targetY = nextR * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
          const dx = targetX - ch.x;
          const dy = targetY - ch.y;
          const d = Math.hypot(dx, dy);

          if (d <= slideStep) {
            ch.x = targetX;
            ch.y = targetY;
            ch.r = nextR;
            ch.c = nextC;

            // Aplastar guardianes al pasar por su celda
            for (const g of State.guardians) {
              if (!g.destroyed && g.r === ch.r && g.c === ch.c) {
                g.destroyed = true;
                State.levelEnemiesKilled++;
                State.score += 300;
                spawnDebris(g.x, g.y, '#ef4444', 16);
                SynthSound.playTone(300, 'square', 0.25, 0.35, 80);
              }
            }
          } else {
            ch.x += (dx / d) * slideStep;
            ch.y += (dy / d) * slideStep;
            ch.r = Math.floor(ch.y / CONFIG.TILE_SIZE);
            ch.c = Math.floor(ch.x / CONFIG.TILE_SIZE);
          }
        }
      }

      // Cuenta regresiva del fusible (si no es remota)
      if (!ch.remote) {
        ch.timer -= dt;
        if (ch.timer <= 0) {
          ch.triggered = true;
          anyAutoDetonated = true;
        }
      }
    }

    if (anyAutoDetonated) {
      detonateTriggeredCharges();
    }
  }

  function updateBlasts(dt) {
    for (let i = State.activeBlasts.length - 1; i >= 0; i--) {
      const b = State.activeBlasts[i];
      b.timer -= dt;
      if (b.timer <= 0) {
        State.activeBlasts.splice(i, 1);
      }
    }
  }

  function updateGuardians(dt) {
    for (const g of State.guardians) {
      if (g.destroyed) continue;

      // 1. Evasión de ondas de choque (Cazador y Blindado evaden)
      if (g.type === 'hunter' || g.type === 'armored') {
        const evade = CargasLogic.getGuardianEvadeMove(State.grid, g.r, g.c, State.charges);
        if (evade.shouldEvade && (evade.dir.r !== 0 || evade.dir.c !== 0)) {
          g.dir = evade.dir;
        }
      }

      // 2. Comportamiento Constructor: colocar bloques blandos periódicamente
      if (g.type === 'builder') {
        g.builderTimer -= dt;
        if (g.builderTimer <= 0) {
          g.builderTimer = 5.0;
          // Si la celda actual es transitable, crear un bloque blando
          if (State.grid[g.r][g.c] === 0) {
            State.grid[g.r][g.c] = 2;
            spawnDebris(g.x, g.y, '#9333ea', 8);
          }
        }
      }

      // 3. Movimiento del Guardián
      const speed = (g.type === 'hunter' ? 2.8 : g.type === 'armored' && g.hp === 1 ? 3.0 : 2.2) * CONFIG.TILE_SIZE * dt;
      const targetR = g.r + g.dir.r;
      const targetC = g.c + g.dir.c;

      // Validar si puede avanzar
      if (
        targetR >= 0 && targetR < CONFIG.ROWS &&
        targetC >= 0 && targetC < CONFIG.COLS &&
        State.grid[targetR][targetC] === 0 &&
        !State.charges.some(c => c.r === targetR && c.c === targetC && !c.detonated)
      ) {
        const destX = targetC * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        const destY = targetR * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        const dx = destX - g.x;
        const dy = destY - g.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= speed) {
          g.x = destX;
          g.y = destY;
          g.r = targetR;
          g.c = targetC;
        } else {
          g.x += (dx / dist) * speed;
          g.y += (dy / dist) * speed;
          g.r = Math.floor(g.y / CONFIG.TILE_SIZE);
          g.c = Math.floor(g.x / CONFIG.TILE_SIZE);
        }
      } else {
        // Chocó: cambiar dirección aleatoria o patrullar
        const dirs = [
          { r: -1, c: 0 },
          { r: 1, c: 0 },
          { r: 0, c: -1 },
          { r: 0, c: 1 }
        ];
        const validDirs = dirs.filter(d => {
          const nr = g.r + d.r;
          const nc = g.c + d.c;
          return nr >= 0 && nr < CONFIG.ROWS && nc >= 0 && nc < CONFIG.COLS && State.grid[nr][nc] === 0;
        });

        if (validDirs.length > 0) {
          g.dir = validDirs[Math.floor(Math.random() * validDirs.length)];
        } else {
          g.dir = { r: -g.dir.r, c: -g.dir.c };
        }
      }

      // Daño al tocar al jugador
      const checkTouch = (p) => {
        if (p && p.isAlive && p.invulnTimer <= 0) {
          const dist = Math.hypot(p.x - g.x, p.y - g.y);
          if (dist < CONFIG.TILE_SIZE * 0.75) {
            hurtPlayer(p);
          }
        }
      };
      checkTouch(State.p1);
      checkTouch(State.p2);
    }
  }

  function updateBoss(dt) {
    const boss = State.boss;
    if (!boss || boss.destroyed) return;

    boss.attackTimer -= dt;

    if (!boss.telegraphing) {
      if (boss.attackTimer <= 1.2) {
        // Entrar en modo telegrafiado
        boss.telegraphing = true;
        SynthSound.sfxBossTelegraph();

        if (boss.type === 'titan') {
          // Telégrafo en cruz y diagonal por la fila y columna del jefe
          boss.telegraphZones = [];
          for (let c = 1; c < CONFIG.COLS - 1; c++) boss.telegraphZones.push({ r: boss.r, c });
          for (let r = 1; r < CONFIG.ROWS - 1; r++) boss.telegraphZones.push({ r, c: boss.c });
        } else if (boss.type === 'archon') {
          // Telégrafo de mega-rombo
          const diamond = CargasLogic.calculateDiamondBlast(State.grid, boss.r, boss.c, 4);
          boss.telegraphZones = diamond.blastCells;
        }
      }
    } else {
      // En telegrafiado: advertencia visual
      if (boss.attackTimer <= 0) {
        // ¡Disparo de ataque!
        boss.telegraphing = false;
        boss.attackTimer = 4.5;
        SynthSound.sfxExplode();
        State.shakeTime = 0.35;

        // Registrar onda de daño del jefe
        State.activeBlasts.push({
          cells: boss.telegraphZones,
          timer: 0.5,
          maxTimer: 0.5
        });

        // Dañar jugadores dentro de la zona telegrafiada
        for (const zone of boss.telegraphZones) {
          const hitP = (p) => {
            if (p && p.isAlive && p.invulnTimer <= 0 && p.r === zone.r && p.c === zone.c) {
              hurtPlayer(p);
            }
          };
          hitP(State.p1);
          hitP(State.p2);
        }
      }
    }
  }

  function checkPowerups() {
    for (let i = State.powerups.length - 1; i >= 0; i--) {
      const pow = State.powerups[i];
      const checkCollect = (p) => {
        if (p && p.isAlive && p.r === pow.r && p.c === pow.c) {
          SynthSound.sfxPowerup();
          State.score += 150;
          if (pow.type === 'R') {
            p.radius = Math.min(CONFIG.MAX_BLAST_RADIUS, p.radius + 1);
            showToast('¡RADIO DE ONDA AUMENTADO!', 1.2);
          } else if (pow.type === 'C') {
            p.maxCharges = Math.min(CONFIG.MAX_CHARGES_LIMIT, p.maxCharges + 1);
            showToast('¡CARGA ADICIONAL!', 1.2);
          } else if (pow.type === 'S') {
            p.speedMult = Math.min(1.6, p.speedMult + 0.2);
            showToast('¡VELOCIDAD MEJORADA!', 1.2);
          } else if (pow.type === 'D') {
            p.hasRemote = true;
            showToast('¡DETONADOR REMOTO EQUIPADO!', 1.5);
          }
          State.powerups.splice(i, 1);
          updateHUD();
          return true;
        }
        return false;
      };

      if (!checkCollect(State.p1) && State.is2P) {
        checkCollect(State.p2);
      }
    }
  }

  function checkPortalCondition() {
    // Si todos los enemigos del nivel o el jefe fueron eliminados, se activa el portal
    const guardiansRemaining = State.guardians.filter(g => !g.destroyed).length;
    const bossAlive = State.boss && !State.boss.destroyed;

    if (guardiansRemaining === 0 && !bossAlive && !State.portalUnlocked) {
      State.portalUnlocked = true;
      SynthSound.sfxVictory();
      showToast('¡PORTAL DE EXTRACCIÓN ACTIVADO! Dirígete a la salida.', 3.0);
    }

    if (State.portalUnlocked) {
      const checkEscape = (p) => {
        if (p && p.isAlive && p.r === State.portalPos.r && p.c === State.portalPos.c) {
          triggerLevelClear();
          return true;
        }
        return false;
      };

      checkEscape(State.p1) || (State.is2P && checkEscape(State.p2));
    }
  }

  // ==========================================
  // RENDERIZADO 2D / SEUDO-3D 90s
  // ==========================================
  function render() {
    const ctx = State.ctx;
    if (!ctx) return;

    ctx.save();

    // Screen Shake
    if (State.shakeTime > 0) {
      const sx = (Math.random() - 0.5) * 8;
      const sy = (Math.random() - 0.5) * 8;
      ctx.translate(sx, sy);
    }

    // Fondo industrial oscuro
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, State.boardW, State.boardH);

    // 1. Dibujar piso y cuadrícula metálica
    drawFloor(ctx);

    // 2. Dibujar zonas telegrafiadas del jefe
    drawTelegraphZones(ctx);

    // 3. Dibujar portal de salida
    drawPortal(ctx);

    // 4. Dibujar Powerups
    drawPowerups(ctx);

    // 5. Dibujar Pilares y Bloques Blandos
    drawGridBlocks(ctx);

    // 6. Dibujar Cargas
    drawCharges(ctx);

    // 7. Dibujar Ondas Expansivas en Rombo
    drawActiveBlasts(ctx);

    // 8. Dibujar Guardianes y Jefe
    drawGuardians(ctx);
    if (State.boss) {
      drawBoss(ctx);
    }

    // 9. Dibujar Jugadores
    drawPlayer(ctx, State.p1);
    if (State.is2P) {
      drawPlayer(ctx, State.p2);
    }

    // 10. Dibujar Partículas
    drawParticles(ctx);

    ctx.restore();
  }

  function drawFloor(ctx) {
    const T = CONFIG.TILE_SIZE;
    ctx.strokeStyle = '#161e2e';
    ctx.lineWidth = 1;

    for (let r = 0; r < CONFIG.ROWS; r++) {
      for (let c = 0; c < CONFIG.COLS; c++) {
        ctx.strokeRect(c * T, r * T, T, T);
      }
    }
  }

  function drawTelegraphZones(ctx) {
    if (!State.boss || !State.boss.telegraphing) return;
    const T = CONFIG.TILE_SIZE;
    const pulse = 0.4 + 0.3 * Math.sin(Date.now() * 0.015);

    ctx.fillStyle = `rgba(239, 68, 68, ${pulse})`;
    for (const zone of State.boss.telegraphZones) {
      ctx.fillRect(zone.c * T + 2, zone.r * T + 2, T - 4, T - 4);
    }
  }

  function drawPortal(ctx) {
    const T = CONFIG.TILE_SIZE;
    const px = State.portalPos.c * T;
    const py = State.portalPos.r * T;

    if (State.portalUnlocked) {
      // Vórtice activo cyan brillante
      const time = Date.now() * 0.005;
      ctx.fillStyle = '#083344';
      ctx.fillRect(px + 2, py + 2, T - 4, T - 4);

      ctx.save();
      ctx.translate(px + T / 2, py + T / 2);
      ctx.rotate(time);

      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-T * 0.3, -T * 0.3, T * 0.6, T * 0.6);

      ctx.strokeStyle = '#38bdf8';
      ctx.rotate(time * 0.5);
      ctx.strokeRect(-T * 0.2, -T * 0.2, T * 0.4, T * 0.4);

      ctx.restore();
    } else {
      // Portal inactivo gris
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px + 4, py + 4, T - 8, T - 8);
      ctx.strokeStyle = '#475569';
      ctx.strokeRect(px + 4, py + 4, T - 8, T - 8);
    }
  }

  function drawPowerups(ctx) {
    const T = CONFIG.TILE_SIZE;
    for (const pow of State.powerups) {
      const cx = pow.c * T + T / 2;
      const cy = pow.r * T + T / 2;

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = pow.type === 'R' ? '#06b6d4' : pow.type === 'C' ? '#f59e0b' : pow.type === 'S' ? '#10b981' : '#a855f7';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pow.type, cx, cy + 1);
    }
  }

  function drawGridBlocks(ctx) {
    const T = CONFIG.TILE_SIZE;

    for (let r = 0; r < CONFIG.ROWS; r++) {
      for (let c = 0; c < CONFIG.COLS; c++) {
        const tile = State.grid[r][c];
        const x = c * T;
        const y = r * T;

        if (tile === 1) {
          // Pilar indestructible con bisel metálico 90s
          ctx.fillStyle = '#334155';
          ctx.fillRect(x, y, T, T);

          // Bisel claro superior/izquierdo
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + T, y);
          ctx.lineTo(x + T - 4, y + 4);
          ctx.lineTo(x + 4, y + 4);
          ctx.lineTo(x + 4, y + T - 4);
          ctx.lineTo(x, y + T);
          ctx.fill();

          // Bisel oscuro inferior/derecho
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.moveTo(x + T, y);
          ctx.lineTo(x + T, y + T);
          ctx.lineTo(x, y + T);
          ctx.lineTo(x + 4, y + T - 4);
          ctx.lineTo(x + T - 4, y + T - 4);
          ctx.lineTo(x + T - 4, y + 4);
          ctx.fill();

          // Placa central
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x + 5, y + 5, T - 10, T - 10);
        } else if (tile === 2) {
          // Bloque blando destructible (materia inestable anaranjada con textura)
          ctx.fillStyle = '#78350f';
          ctx.fillRect(x + 1, y + 1, T - 2, T - 2);

          ctx.fillStyle = '#b45309';
          ctx.fillRect(x + 3, y + 3, T - 6, T - 6);

          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 3, y + 3, T - 6, T - 6);

          // Remache central
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(x + T / 2 - 2, y + T / 2 - 2, 4, 4);
        }
      }
    }
  }

  function drawCharges(ctx) {
    const pulse = Math.sin(Date.now() * 0.01) * 2;
    for (const ch of State.charges) {
      if (ch.detonated) continue;

      ctx.save();
      ctx.translate(ch.x, ch.y);

      // Sombra
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(0, 8, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Esfera de energía resonante
      const radius = 10 + pulse;
      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, radius);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.5, '#f59e0b');
      grad.addColorStop(1, '#b45309');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();

      // Anillo exterior de diamante
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -radius - 3);
      ctx.lineTo(radius + 3, 0);
      ctx.lineTo(0, radius + 3);
      ctx.lineTo(-radius - 3, 0);
      ctx.closePath();
      ctx.stroke();

      // Indicador digital de cuenta regresiva
      if (!ch.remote) {
        ctx.fillStyle = '#000';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.ceil(ch.timer), 0, 1);
      }

      ctx.restore();
    }
  }

  function drawActiveBlasts(ctx) {
    const T = CONFIG.TILE_SIZE;
    for (const b of State.activeBlasts) {
      const alpha = Math.max(0, b.timer / b.maxTimer);

      for (const cell of b.cells) {
        const cx = cell.c * T + T / 2;
        const cy = cell.r * T + T / 2;

        ctx.save();
        ctx.translate(cx, cy);

        // Dibujar rombo/diamante Manhattan
        ctx.fillStyle = `rgba(245, 158, 11, ${alpha * 0.75})`;
        ctx.beginPath();
        ctx.moveTo(0, -T * 0.45);
        ctx.lineTo(T * 0.45, 0);
        ctx.lineTo(0, T * 0.45);
        ctx.lineTo(-T * 0.45, 0);
        ctx.closePath();
        ctx.fill();

        // Borde incandescente
        ctx.strokeStyle = `rgba(254, 240, 138, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
      }
    }
  }

  function drawGuardians(ctx) {
    for (const g of State.guardians) {
      if (g.destroyed) continue;

      ctx.save();
      ctx.translate(g.x, g.y);

      // Base del chasis robótico
      ctx.fillStyle = g.type === 'patrol' ? '#10b981' : g.type === 'hunter' ? '#ef4444' : g.type === 'armored' ? (g.hp === 2 ? '#64748b' : '#f97316') : '#9333ea';

      ctx.fillRect(-8, -8, 16, 16);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-8, -8, 16, 16);

      // Ojo visor / Núcleo
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-3, -3, 6, 6);

      ctx.restore();
    }
  }

  function drawBoss(ctx) {
    const boss = State.boss;
    if (!boss || boss.destroyed) return;

    ctx.save();
    ctx.translate(boss.x, boss.y);

    // Titán Giróscopo o Arconte
    const time = Date.now() * 0.004;

    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();

    // Aspas mecánicas giratorias
    ctx.strokeStyle = boss.type === 'titan' ? '#ef4444' : '#8b5cf6';
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      const angle = time + (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * 18, Math.sin(angle) * 18);
      ctx.stroke();
    }

    // Barra de salud del jefe sobre su cabeza
    const hpRatio = boss.hp / boss.maxHp;
    ctx.fillStyle = '#000';
    ctx.fillRect(-14, -24, 28, 5);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-13, -23, 26 * hpRatio, 3);

    ctx.restore();
  }

  function drawPlayer(ctx, p) {
    if (!p || !p.isAlive) return;

    // Parpadeo de invulnerabilidad
    if (p.invulnTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(p.x, p.y);

    // Traje de ingeniero cibernético 90s
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Visor
    ctx.fillStyle = '#fde047';
    ctx.fillRect(-4, -4, 8, 4);

    // Mochila de resonancia
    ctx.fillStyle = '#334155';
    ctx.fillRect(-6, 4, 12, 4);

    ctx.restore();
  }

  function drawParticles(ctx) {
    for (const p of State.particles) {
      if (p.active) {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
  }

  // ==========================================
  // BUCLE DE JUEGO (GAME LOOP)
  // ==========================================
  function gameLoop(timestamp) {
    if (!State.lastTime) State.lastTime = timestamp;
    let dt = (timestamp - State.lastTime) / 1000;
    State.lastTime = timestamp;

    if (dt > 0.08) dt = 0.08; // Clamp de seguridad según REGLAS-JUEGOS

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
  }

  // ==========================================
  // EVENTOS, UI Y FLUJO DE ESTADO
  // ==========================================
  function triggerGameOver(reason = 'Misión fallida. El núcleo ha colapsado.') {
    State.state = 'GAMEOVER';
    SynthSound.playTone(160, 'sawtooth', 0.5, 0.4, 40);

    const bestScore = saveHighScore();

    document.getElementById('result-title').textContent = '¡MISIÓN FALLIDA!';
    document.getElementById('result-desc').textContent = reason;
    document.getElementById('res-score').textContent = State.score;
    document.getElementById('res-enemies').textContent = State.levelEnemiesKilled;
    document.getElementById('res-blocks').textContent = State.levelBlocksDestroyed;
    document.getElementById('res-highscore').textContent = bestScore;

    document.getElementById('btn-result-next').classList.add('hidden');
    document.getElementById('btn-result-retry').classList.remove('hidden');
    document.getElementById('modal-result').classList.remove('hidden');
  }

  function triggerLevelClear() {
    State.state = 'LEVELCLEAR';
    SynthSound.sfxVictory();

    // Bonificación de tiempo restante
    const timeBonus = Math.floor(State.timeRemaining) * 10;
    State.score += timeBonus;

    const bestScore = saveHighScore();

    document.getElementById('result-title').textContent = '¡SECTOR COMPLETADO!';
    document.getElementById('result-desc').textContent = `Excelente operación. Bono de tiempo: +${timeBonus} pts.`;
    document.getElementById('res-score').textContent = State.score;
    document.getElementById('res-enemies').textContent = State.levelEnemiesKilled;
    document.getElementById('res-blocks').textContent = State.levelBlocksDestroyed;
    document.getElementById('res-highscore').textContent = bestScore;

    if (State.currentLevelIdx < CONFIG.LEVELS.length - 1) {
      document.getElementById('btn-result-next').classList.remove('hidden');
    } else {
      document.getElementById('btn-result-next').classList.add('hidden');
      document.getElementById('result-desc').textContent = '¡HAS ESCAPADO DE TODOS LOS SECTORES!';
    }

    document.getElementById('modal-result').classList.remove('hidden');
  }

  function saveHighScore() {
    let best = 0;
    if (window.ArcadeStorage) {
      best = window.ArcadeStorage.getHighScore(CONFIG.STORAGE_KEY) || 0;
      if (State.score > best) {
        best = State.score;
        window.ArcadeStorage.setHighScore(CONFIG.STORAGE_KEY, best);
      }
    }
    return best;
  }

  function updateHUD() {
    document.getElementById('score-val').textContent = State.score;
    document.getElementById('time-val').textContent = Math.ceil(State.timeRemaining);

    if (State.p1) {
      document.getElementById('hud-radius').textContent = `R: ${State.p1.radius}`;
      const activeP1 = State.charges.filter(c => c.ownerId === 1 && !c.detonated).length;
      document.getElementById('hud-charges').textContent = `${activeP1}/${State.p1.maxCharges}`;
      document.getElementById('hud-speed').textContent = `${p1SpeedFormat(State.p1.speedMult)}`;
      document.getElementById('hud-remote-txt').textContent = State.p1.hasRemote ? 'LISTO' : 'AUTO';

      // Vidas
      let icons = '';
      for (let i = 0; i < State.p1.lives; i++) icons += '⚙️';
      document.getElementById('lives-val').textContent = icons || '💀';
    }
  }

  function p1SpeedFormat(mult) {
    return mult === 1 ? '1x' : `${mult.toFixed(1)}x`;
  }

  function updateLevelDisplay() {
    const lvl = CONFIG.LEVELS[State.currentLevelIdx];
    document.getElementById('level-display').textContent = `NIVEL ${lvl.id}: ${lvl.name.toUpperCase()}`;
  }

  // ==========================================
  // CONFIGURACIÓN DE INPUTS Y CONTROLES TÁCTILES
  // ==========================================
  function setupInputs() {
    // Teclado
    window.addEventListener('keydown', (e) => {
      SynthSound.resume();

      if (State.state !== 'PLAYING') return;

      // P1: WASD / Flechas
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          State.p1.bufferedDir = { r: -1, c: 0 };
          e.preventDefault();
          break;
        case 's':
        case 'arrowdown':
          State.p1.bufferedDir = { r: 1, c: 0 };
          e.preventDefault();
          break;
        case 'a':
        case 'arrowleft':
          State.p1.bufferedDir = { r: 0, c: -1 };
          e.preventDefault();
          break;
        case 'd':
        case 'arrowright':
          State.p1.bufferedDir = { r: 0, c: 1 };
          e.preventDefault();
          break;
        case ' ':
        case 'j':
          placeCharge(State.p1);
          e.preventDefault();
          break;
        case 'k':
          triggerRemote(State.p1);
          e.preventDefault();
          break;
      }

      // P2 (si está habilitado 2P co-op): Teclas IJKL / NumPad
      if (State.is2P && State.p2) {
        switch (e.key.toLowerCase()) {
          case 'i':
            State.p2.bufferedDir = { r: -1, c: 0 };
            break;
          case 'k':
            State.p2.bufferedDir = { r: 1, c: 0 };
            break;
          case 'j':
            State.p2.bufferedDir = { r: 0, c: -1 };
            break;
          case 'l':
            State.p2.bufferedDir = { r: 0, c: 1 };
            break;
          case 'enter':
            placeCharge(State.p2);
            break;
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (State.p1) {
        const k = e.key.toLowerCase();
        if ((k === 'w' || k === 'arrowup') && State.p1.bufferedDir.r === -1) State.p1.bufferedDir = { r: 0, c: 0 };
        if ((k === 's' || k === 'arrowdown') && State.p1.bufferedDir.r === 1) State.p1.bufferedDir = { r: 0, c: 0 };
        if ((k === 'a' || k === 'arrowleft') && State.p1.bufferedDir.c === -1) State.p1.bufferedDir = { r: 0, c: 0 };
        if ((k === 'd' || k === 'arrowright') && State.p1.bufferedDir.c === 1) State.p1.bufferedDir = { r: 0, c: 0 };
      }
    });

    // D-Pad Táctil
    const bindDpad = (id, r, c) => {
      const el = document.getElementById(id);
      if (!el) return;

      const setDir = (ev) => {
        ev.preventDefault();
        SynthSound.resume();
        if (State.p1) State.p1.bufferedDir = { r, c };
      };

      const clearDir = (ev) => {
        ev.preventDefault();
        if (State.p1 && State.p1.bufferedDir.r === r && State.p1.bufferedDir.c === c) {
          State.p1.bufferedDir = { r: 0, c: 0 };
        }
      };

      el.addEventListener('touchstart', setDir, { passive: false });
      el.addEventListener('touchend', clearDir, { passive: false });
      el.addEventListener('mousedown', setDir);
      el.addEventListener('mouseup', clearDir);
    };

    bindDpad('btn-dpad-up', -1, 0);
    bindDpad('btn-dpad-down', 1, 0);
    bindDpad('btn-dpad-left', 0, -1);
    bindDpad('btn-dpad-right', 0, 1);

    // Botones de Acción Táctiles
    const btnCharge = document.getElementById('btn-action-charge');
    if (btnCharge) {
      btnCharge.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        SynthSound.resume();
        if (State.state === 'PLAYING') placeCharge(State.p1);
      });
    }

    const btnDetonate = document.getElementById('btn-action-detonate');
    if (btnDetonate) {
      btnDetonate.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        SynthSound.resume();
        if (State.state === 'PLAYING') triggerRemote(State.p1);
      });
    }

    // Touch Swipe directo sobre canvas
    let touchStartX = 0;
    let touchStartY = 0;
    const canvas = State.canvas;
    if (canvas) {
      canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && State.p1) {
          const dx = e.touches[0].clientX - touchStartX;
          const dy = e.touches[0].clientY - touchStartY;
          const absX = Math.abs(dx);
          const absY = Math.abs(dy);

          if (absX > 18 || absY > 18) {
            if (absX > absY) {
              State.p1.bufferedDir = { r: 0, c: dx > 0 ? 1 : -1 };
            } else {
              State.p1.bufferedDir = { r: dy > 0 ? 1 : -1, c: 0 };
            }
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
          }
        }
      }, { passive: true });
    }
  }

  function setupUI() {
    // Selector de modo 1P / 2P
    const btn1p = document.getElementById('btn-mode-1p');
    const btn2p = document.getElementById('btn-mode-2p');
    btn1p.addEventListener('click', () => {
      State.is2P = false;
      btn1p.classList.add('active');
      btn2p.classList.remove('active');
    });
    btn2p.addEventListener('click', () => {
      State.is2P = true;
      btn2p.classList.add('active');
      btn1p.classList.remove('active');
    });

    // Cuadrícula de 12 niveles
    const gridEl = document.getElementById('levels-grid');
    gridEl.innerHTML = '';
    CONFIG.LEVELS.forEach((lvl, idx) => {
      const chip = document.createElement('button');
      chip.className = `lvl-chip ${lvl.isBoss ? 'boss-chip' : ''} ${idx === 0 ? 'active' : ''}`;
      chip.innerHTML = `<span>${lvl.id}</span>${lvl.isBoss ? '<small style="font-size:8px">JEFE</small>' : ''}`;
      chip.addEventListener('click', () => {
        document.querySelectorAll('.lvl-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        State.currentLevelIdx = idx;
      });
      gridEl.appendChild(chip);
    });

    // Botón Iniciar
    document.getElementById('btn-start-game').addEventListener('click', () => {
      SynthSound.resume();
      document.getElementById('modal-start').classList.add('hidden');
      loadLevel(State.currentLevelIdx);
      State.state = 'PLAYING';
    });

    // Pausa
    const modalPause = document.getElementById('modal-pause');
    document.getElementById('btn-pause-header').addEventListener('click', () => {
      if (State.state === 'PLAYING') {
        State.state = 'PAUSED';
        modalPause.classList.remove('hidden');
      }
    });

    document.getElementById('btn-resume').addEventListener('click', () => {
      modalPause.classList.add('hidden');
      State.state = 'PLAYING';
    });

    document.getElementById('btn-restart-level').addEventListener('click', () => {
      modalPause.classList.add('hidden');
      loadLevel(State.currentLevelIdx);
      State.state = 'PLAYING';
    });

    document.getElementById('btn-exit-menu').addEventListener('click', () => {
      modalPause.classList.add('hidden');
      document.getElementById('modal-start').classList.remove('hidden');
      State.state = 'MENU';
    });

    // Modal Resultados
    document.getElementById('btn-result-next').addEventListener('click', () => {
      document.getElementById('modal-result').classList.add('hidden');
      loadLevel(State.currentLevelIdx + 1);
      State.state = 'PLAYING';
    });

    document.getElementById('btn-result-retry').addEventListener('click', () => {
      document.getElementById('modal-result').classList.add('hidden');
      loadLevel(State.currentLevelIdx);
      State.state = 'PLAYING';
    });

    document.getElementById('btn-result-menu').addEventListener('click', () => {
      document.getElementById('modal-result').classList.add('hidden');
      document.getElementById('modal-start').classList.remove('hidden');
      State.state = 'MENU';
    });

    // Toggle Sonido
    const btnSound = document.getElementById('btn-sound-toggle');
    btnSound.addEventListener('click', () => {
      SynthSound.muted = !SynthSound.muted;
      document.getElementById('icon-sound-on').classList.toggle('hidden', SynthSound.muted);
      document.getElementById('icon-sound-off').classList.toggle('hidden', !SynthSound.muted);
    });
  }

  function handleResize() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;

    State.canvas = canvas;
    State.ctx = canvas.getContext('2d');

    const container = document.getElementById('canvas-container');
    const availW = container.clientWidth || 330;
    const availH = container.clientHeight || 390;

    const scale = Math.min(availW / State.boardW, availH / State.boardH, 1.4);
    const dpr = window.devicePixelRatio || 1;

    canvas.width = State.boardW * dpr;
    canvas.height = State.boardH * dpr;
    canvas.style.width = `${State.boardW * scale}px`;
    canvas.style.height = `${State.boardH * scale}px`;

    State.ctx.scale(dpr, dpr);
  }

  function init() {
    handleResize();
    window.addEventListener('resize', handleResize);
    setupInputs();
    setupUI();
    requestAnimationFrame(gameLoop);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
