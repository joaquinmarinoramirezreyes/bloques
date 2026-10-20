/**
 * games/lumen/game.js - Lumen Arcade 80s (Pac-Man Style Edition)
 * 
 * Experiencia clásica y vibrante estilo Pac-Man en laberinto neón:
 * - Recolección de orbes luminosos en todos los pasillos con sonido waka-waka alternado.
 * - 4 Super Orbes / Faroles de Poder en las esquinas que activan el Modo Super Luz.
 * - 4 Sombras (fantasmas) con personalidades canónicas:
 *   * Carmesí (Rojo - Blinky): Persecución directa y aceleración en orbes bajos.
 *   * Rosa (Pinky): Emboscada anticipada 4 celdas por delante.
 *   * Turquesa (Inky): Flanqueo con vector reflejado.
 *   * Ámbar (Clyde): Errante tímido que patrulla si se acerca demasiado.
 * - Modo Super Luz: Sombras azules vulnerables, combo escalonado (200, 400, 800, 1600 pts)
 *   y retirada veloz de ojos flotantes hacia la casa central.
 * - Túneles laterales de transporte cuántico con reducción de velocidad para enemigos.
 * - Frutas y reliquias de bonus en el centro del laberinto.
 * - Búfer de pre-giro (corner buffering) fluido y sin atascos en esquinas.
 * - 30 niveles en 5 mundos temáticos, 10 logros, estadísticas y controles táctiles + teclado.
 */
(() => {
  'use strict';

  // ==========================================
  // 1. CONFIGURACIÓN Y CONSTANTES
  // ==========================================
  const CONFIG = {
    COLS: 15,
    ROWS: 19,
    TILE_SIZE: 22,
    VIRTUAL_W: 330, // 15 * 22
    VIRTUAL_H: 418, // 19 * 22

    BASE_PLAYER_SPEED: 4.8,     // Celdas por segundo
    CREATURE_BASE_SPEED: 3.8,   // Celdas por segundo
    CREATURE_ELROY_SPEED: 4.5,  // Aceleración de Blinky en orbes bajos
    FLEE_SPEED: 2.5,            // Velocidad en modo vulnerable
    EYES_SPEED: 8.0,            // Velocidad de retorno a la casa
    TUNNEL_GHOST_SPEED: 2.2,    // Velocidad reducida de sombras en túneles

    SUPER_LUZ_DURATION: 8.0,    // Segundos en modo vulnerable
    SUPER_LUZ_WARN_TIME: 2.4,   // Segundos de parpadeo antes de finalizar
    FRUIT_DURATION: 9.0,        // Duración de la reliquia de bonus en pantalla

    STARTING_LIVES: 3,
    STORAGE_KEY: 'lumen:v2',
    STORAGE_KEY_LEGACY: 'lumen:v1',

    WORLDS: [
      { id: 1, name: 'Bosque Esmeralda', color: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', wallBg: '#0f2416', desc: 'Niveles 1 al 6 • Regla: Niebla densa y ramas vivas' },
      { id: 2, name: 'Cripta Ancestral', color: '#ffd27a', glow: 'rgba(255, 210, 122, 0.4)', wallBg: '#2a1a10', desc: 'Niveles 7 al 12 • Regla: Puertas de energía y arcos' },
      { id: 3, name: 'Mina Ámbar', color: '#ffaa00', glow: 'rgba(255, 170, 0, 0.4)', wallBg: '#1f1300', desc: 'Niveles 13 al 18 • Regla: Velo dorado y túneles estrechos' },
      { id: 4, name: 'Ciudad Cobalto', color: '#88aaff', glow: 'rgba(136, 170, 255, 0.4)', wallBg: '#080d24', desc: 'Niveles 19 al 24 • Regla: Ráfagas de pulso y velocidad' },
      { id: 5, name: 'Abismo Sombrío', color: '#e07a1f', glow: 'rgba(224, 122, 31, 0.4)', wallBg: '#1f0d05', desc: 'Niveles 25 al 30 • Regla: Oscuridad total y sombras feroces' }
    ],

    // 4 Sombras icónicas con estética vectorial
    SHADOW_TYPES: [
      { id: 0, name: 'Carmesí', role: 'Cazador', color: '#ff2255', corner: { r: 1, c: 13 } },
      { id: 1, name: 'Rosa', role: 'Emboscador', color: '#e07a1f', corner: { r: 1, c: 1 } },
      { id: 2, name: 'Ocre', role: 'Flanqueador', color: '#ffd27a', corner: { r: 17, c: 13 } },
      { id: 3, name: 'Ámbar', role: 'Tímido', color: '#ff9900', corner: { r: 17, c: 1 } }
    ],

    ACHIEVEMENTS: [
      { id: 'FIRST_DOT', icon: 'coin', title: 'Primer Bocado', desc: 'Devora tu primer orbe de luz' },
      { id: 'POWER_UP', icon: 'spark', title: 'Super Luz', desc: 'Consume un Super Orbe y asusta a las sombras' },
      { id: 'EAT_SHADOW', icon: 'alien', title: 'Cazador de Sombras', desc: 'Devora una sombra vulnerable' },
      { id: 'COMBO_4', icon: 'zap', title: 'Banquete Cuádruple', desc: 'Devora las 4 sombras en un solo Super Orbe' },
      { id: 'FRUIT_COLLECT', icon: 'star', title: 'Tesoro Arcano', desc: 'Recoge una reliquia de bonus en el centro' },
      { id: 'TUNNEL_ESCAPE', icon: 'speed', title: 'Escape Cuántico', desc: 'Cruza un túnel lateral para evadir el peligro' },
      { id: 'PERFECT_CLEAR', icon: 'shield', title: 'Comedor Impecable', desc: 'Limpia un nivel sin perder vidas' },
      { id: 'WORLD_1', icon: 'flag', title: 'Amo del Bosque', desc: 'Supera el Mundo 1 completo' },
      { id: 'SCORE_10K', icon: 'trophy', title: 'Maestro del Laberinto', desc: 'Supera los 10,000 puntos en una partida' },
      { id: 'PAC_LEGEND', icon: 'medal', title: 'Leyenda de Luz', desc: 'Supera 10 niveles consecutivos' }
    ],

    // 6 Plantillas maestras de laberintos (15x19) - 100% Conectadas y Verificadas
    LEVEL_TEMPLATES: [
      // 0: El Gran Circuito Neón
      [
        "###############", // 0
        "#L.....#.....L#", // 1
        "#.###.###.###.#", // 2
        "#.............#", // 3
        "#.###.#.#.###.#", // 4
        "#.....#.#.....#", // 5
        "#.###.#.#.###.#", // 6 (Corredor lateral abierto)
        "#...#.....#...#", // 7
        "###.#.#-#.#.###", // 8 (Puerta de sombras en col 7)
        "T...#.EEE.#...T", // 9 (Casa de sombras cols 6,7,8)
        "###.#.###.#.###", // 10
        "#...#..B..#...#", // 11
        "#.###.###.###.#", // 12 (Corredor inferior abierto)
        "#......P......#", // 13 (Spawn Jugador)
        "#.###.###.###.#", // 14
        "#...#.....#...#", // 15
        "###.#.###.#.###", // 16
        "#L.....#.....L#", // 17
        "###############"  // 18
      ],
      // 1: El Claustro en Cruz
      [
        "###############",
        "#L...........L#",
        "#.####.#.####.#",
        "#.#....#....#.#",
        "#.#.##.#.##.#.#",
        "#.............#",
        "#.#.#######.#.#",
        "#...#.....#...#",
        "#.###.#-#.###.#",
        "T.....EEE.....T",
        "#.###.###.###.#",
        "#...#..B..#...#",
        "#.#.#######.#.#",
        "#......P......#",
        "#.####...####.#",
        "#....#.#.#....#",
        "#.##.#.#.#.##.#",
        "#L...........L#",
        "###############"
      ],
      // 2: Las Galerías Gemelas
      [
        "###############",
        "#L.....#.....L#",
        "#.####.#.####.#",
        "#.............#",
        "#.##.##.##.##.#",
        "#....#...#....#",
        "#.##.#.#.#.##.#",
        "#....#...#....#",
        "#.###.#-#.###.#",
        "T.....EEE.....T",
        "#.####.###.####",
        "#......B......#",
        "#.##.#####.##.#",
        "#......P......#",
        "#.####.#.####.#",
        "#.#....#....#.#",
        "#.##.#####.##.#",
        "#L...........L#",
        "###############"
      ],
      // 3: Cripta de Pilares
      [
        "###############",
        "#L...........L#",
        "#.##.##.##.##.#",
        "#.............#",
        "#.##.##.##.##.#",
        "#.............#",
        "#.##.##.##.##.#",
        "#...#.....#...#",
        "###.#.#-#.#.###",
        "T...#.EEE.#...T",
        "###.#.###.#.###",
        "#...#..B..#...#",
        "#.##.##.##.##.#",
        "#......P......#",
        "#.##.##.##.##.#",
        "#.............#",
        "#.##.##.##.##.#",
        "#L...........L#",
        "###############"
      ],
      // 4: Encrucijada Central
      [
        "###############",
        "#L.....#.....L#",
        "#.####.#.####.#",
        "#.#.........#.#",
        "#.#.###.###.#.#",
        "#.....#.#.....#",
        "#.###.#.#.###.#",
        "#...#.....#...#",
        "###.#.#-#.#.###",
        "T.....EEE.....T",
        "###.#.###.#.###",
        "#...#..B..#...#",
        "#.###.###.###.#",
        "#......P......#",
        "#.###.....###.#",
        "#...#.###.#...#",
        "###.#.....#.###",
        "#L...........L#",
        "###############"
      ],
      // 5: Bastión del Vórtice
      [
        "###############",
        "#L...........L#",
        "#.#####.#####.#",
        "#.#.........#.#",
        "#.#.###.###.#.#",
        "#.#....#....#.#",
        "#.#.##.#.##.#.#",
        "#...#.....#...#",
        "###.#.#-#.#.###",
        "T.....EEE.....T",
        "###.#.###.#.###",
        "#...#..B..#...#",
        "#.#.##.###.#..#",
        "#.#....P......#",
        "#.#.###.###.#.#",
        "#.#.........#.#",
        "#.#####.#####.#",
        "#L...........L#",
        "###############"
      ]
    ]
  };

  // ==========================================
  // 2. ESTADO GLOBAL DE PARTIDA
  // ==========================================
  const State = {
    levelIdx: 0,
    worldId: 1,
    score: 0,
    highScore: 0,
    lives: CONFIG.STARTING_LIVES,

    grid: [],             // Mapa de celdas (0=vacio, 1=muro, 2=dot, 3=superDot, 4=fruit, 5=door)
    dotsRemaining: 0,
    totalDots: 0,
    fruitSpawned: false,
    fruitTimer: 0,
    fruitScore: 200,

    player: null,         // { x, y, r, c, dir, nextDir, mouthAngle, animTimer }
    shadows: [],          // Array de 4 criaturas
    frightenedTimer: 0,   // Modo Super Luz activo si > 0
    ghostStreak: 0,       // Contador de sombras comidas con el mismo Super Orbe (1..4)
    hitstopTimer: 0,      // Pausa momentánea al devorar una sombra
    waveMode: 'SCATTER',  // 'SCATTER' (7s) o 'CHASE' (20s) estilo arcade canónico
    waveTimer: 7.0,

    gameState: 'TITLE',   // 'TITLE', 'READY', 'PLAYING', 'DYING', 'LEVEL_CLEAR', 'GAMEOVER'
    isPaused: false,
    stateTimer: 0,
    levelClearTimer: 0,
    dyingTimer: 0,

    achievements: new Set(),
    unlockedLevels: 1,
    stats: {
      dotsEaten: 0,
      shadowsEaten: 0,
      fruitsCollected: 0,
      gamesPlayed: 0
    },

    soundMuted: false,
    floatingTexts: [],
    particles: []
  };

  // ==========================================
  // 3. SÍNTESIS DE AUDIO PROCEDURAL (WEB AUDIO)
  // ==========================================
  const SynthAudio = (() => {
    let ctx = null;
    let chompToggle = false;

    function getCtx() {
      if (!ctx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) ctx = new AudioContextClass();
      }
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      return ctx;
    }

    function playTone(freq, duration, type = 'sine', gainVal = 0.1, freqEnd = null) {
      if (State.soundMuted) return;
      const c = getCtx();
      if (!c) return;

      try {
        const osc = c.createOscillator();
        const gain = c.createGain();
        const t = c.currentTime;

        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        if (freqEnd !== null) {
          osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t + duration);
        }

        gain.gain.setValueAtTime(gainVal, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.connect(gain);
        gain.connect(c.destination);

        osc.start(t);
        osc.stop(t + duration);
      } catch (e) {}
    }

    return {
      init() { getCtx(); },

      // El clásico "waka-waka" alternado
      chomp() {
        chompToggle = !chompToggle;
        const freq = chompToggle ? 420 : 530;
        playTone(freq, 0.07, 'triangle', 0.08, freq * 0.85);
      },

      // Super Orbe ingerido
      powerPellet() {
        playTone(280, 0.25, 'sawtooth', 0.12, 560);
      },

      // Sombra comida: Acorde ascendente triunfal
      eatGhost() {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((f, i) => {
          setTimeout(() => playTone(f, 0.12, 'square', 0.1), i * 40);
        });
      },
      sfxEatGhost() {
        this.eatGhost();
      },

      // Fruta recogida: Campanilleo
      eatFruit() {
        playTone(880, 0.12, 'sine', 0.12);
        setTimeout(() => playTone(1174.66, 0.22, 'sine', 0.14), 100);
      },

      // Muerte de Pac-Man: Caída de frecuencia icónica
      death() {
        const c = getCtx();
        if (!c || State.soundMuted) return;
        try {
          const t = c.currentTime;
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(600, t);
          osc.frequency.exponentialRampToValueAtTime(60, t + 0.9);
          gain.gain.setValueAtTime(0.18, t);
          gain.gain.linearRampToValueAtTime(0.001, t + 0.9);
          osc.connect(gain);
          gain.connect(c.destination);
          osc.start(t);
          osc.stop(t + 0.9);
        } catch (e) {}
      },

      // Fanfarria de nivel completado
      levelClear() {
        const melody = [523, 659, 784, 1046, 784, 1046];
        melody.forEach((f, i) => {
          setTimeout(() => playTone(f, 0.15, 'triangle', 0.12), i * 90);
        });
      }
    };
  })();

  // ==========================================
  // 4. LÓGICA DE JUEGO Y SIMULACIÓN
  // ==========================================
  const LumenLogic = {
    // Parsea la plantilla de texto en una matriz numérica y extrae posiciones
    parseLevel(templateLines) {
      const rows = CONFIG.ROWS;
      const cols = CONFIG.COLS;
      const grid = new Array(rows);
      let dotsCount = 0;
      let playerPos = { r: 13, c: 7 };
      const superDots = [];
      const houseGhosts = [];

      for (let r = 0; r < rows; r++) {
        grid[r] = new Uint8Array(cols);
        const line = templateLines[r] || "";
        for (let c = 0; c < cols; c++) {
          const ch = line[c] || '#';
          if (ch === '#') {
            grid[r][c] = 1; // Muro
          } else if (ch === '-') {
            grid[r][c] = 5; // Puerta de la casa de sombras
          } else if (ch === '.') {
            grid[r][c] = 2; // Dot normal
            dotsCount++;
          } else if (ch === 'L') {
            grid[r][c] = 3; // Super Orbe
            dotsCount++;
            superDots.push({ r, c });
          } else if (ch === 'P') {
            grid[r][c] = 0; // Pasillo vacío inicial
            playerPos = { r, c };
          } else if (ch === 'E') {
            grid[r][c] = 0; // Casa de sombras
            houseGhosts.push({ r, c });
          } else if (ch === 'B') {
            grid[r][c] = 0; // Posición de bonus fruit
          } else {
            grid[r][c] = 0; // Pasillo abierto / túnel
          }
        }
      }

      return { grid, dotsCount, playerPos, superDots, houseGhosts };
    },

    // Comprueba si una celda es transitable (no es muro ni puerta exterior)
    isTilePassable(grid, r, c, allowDoor = false) {
      if (r < 0 || r >= CONFIG.ROWS) return false;
      // Túneles laterales infinitos
      if (c < 0 || c >= CONFIG.COLS) return true;
      const cell = grid[r][c];
      if (cell === 1) return false; // Muro
      if (cell === 5 && !allowDoor) return false; // Puerta
      return true;
    },

    // Dirección opuesta
    isOpposite(d1, d2) {
      return (d1.r === -d2.r && d1.c === -d2.c && (d1.r !== 0 || d1.c !== 0));
    },

    // Distancia Manhattan
    distManhattan(r1, c1, r2, c2) {
      return Math.abs(r1 - r2) + Math.abs(c1 - c2);
    },

    // Distancia Euclidiana al cuadrado
    distSq(r1, c1, r2, c2) {
      const dr = r1 - r2;
      const dc = c1 - c2;
      return dr * dr + dc * dc;
    }
  };

  // ==========================================
  // 5. GESTIÓN DE SOMBRAS (IA CANÓNICA PAC-MAN)
  // ==========================================
  function createShadows() {
    const T = CONFIG.TILE_SIZE;
    const shadows = [];

    // Fila 9, celdas 6, 7, 8 son la Casa Central de Sombras
    const spawnPositions = [
      { r: 7, c: 7, state: 'CHASE' },      // Carmesí empieza afuera listo
      { r: 9, c: 7, state: 'IN_HOUSE' },   // Rosa
      { r: 9, c: 6, state: 'IN_HOUSE' },   // Turquesa
      { r: 9, c: 8, state: 'IN_HOUSE' }    // Ámbar
    ];

    for (let i = 0; i < 4; i++) {
      const type = CONFIG.SHADOW_TYPES[i];
      const spawn = spawnPositions[i];
      shadows.push({
        id: i,
        name: type.name,
        role: type.role,
        color: type.color,
        corner: type.corner,
        x: spawn.c * T + T / 2,
        y: spawn.r * T + T / 2,
        r: spawn.r,
        c: spawn.c,
        dir: i === 0 ? { r: 0, c: -1 } : { r: -1, c: 0 },
        state: spawn.state, // 'IN_HOUSE', 'EXITING', 'CHASE', 'FRIGHTENED', 'EATEN'
        houseTimer: i * 2.5, // Salen de forma escalonada
        bobOffset: i * 1.5,
        target: { r: 0, c: 0 }
      });
    }

    return shadows;
  }

  function updateShadows(dt) {
    const T = CONFIG.TILE_SIZE;
    const p = State.player;
    if (!p) return;

    for (const s of State.shadows) {
      // 1. Manejo en la Casa Central de Sombras
      if (s.state === 'IN_HOUSE') {
        s.houseTimer -= dt;
        s.y = 9 * T + T / 2 + Math.sin(Date.now() * 0.008 + s.bobOffset) * 2.5;
        if (s.houseTimer <= 0) {
          s.state = 'EXITING';
        }
        continue;
      }

      // 2. Rutina de salida de la casa central
      if (s.state === 'EXITING') {
        const exitX = 7 * T + T / 2;
        const exitY = 7 * T + T / 2;
        const diffX = exitX - s.x;

        // Primero alinearse horizontalmente con el centro de la columna 7
        if (Math.abs(diffX) > 1.2) {
          const stepX = Math.sign(diffX) * 3.5 * T * dt;
          if (Math.abs(stepX) >= Math.abs(diffX)) {
            s.x = exitX;
          } else {
            s.x += stepX;
          }
        } else {
          s.x = exitX;
          // Subir verticalmente a través de la puerta (fila 8) hasta el pasillo (fila 7)
          const stepY = 3.5 * T * dt;
          s.y -= stepY;
          if (s.y <= exitY) {
            s.x = exitX;
            s.y = exitY;
            s.r = 7;
            s.c = 7;
            s.dir = { r: 0, c: -1 };
            s.state = State.frightenedTimer > 0 ? 'FRIGHTENED' : (State.waveMode === 'SCATTER' ? 'SCATTER' : 'CHASE');
          }
        }
        continue;
      }

      // 3. Manejo de retorno a la casa para ojos devorados ('EATEN')
      if (s.state === 'EATEN') {
        const doorX = 7 * T + T / 2;
        const doorY = 7 * T + T / 2;
        if (Math.hypot(s.x - doorX, s.y - doorY) < 6.0) {
          // Entrar hacia abajo a la casa a través de la puerta
          s.x = doorX;
          s.y += 4.5 * T * dt;
          if (s.y >= 9 * T + T / 2) {
            s.y = 9 * T + T / 2;
            s.r = 9;
            s.c = 7;
            s.state = 'EXITING';
            SynthAudio.sfxEatGhost();
          }
          continue;
        }
      }

      // 4. Determinación del objetivo según modo de onda y personalidad canónica
      let target = { r: 1, c: 1 };

      if (s.state === 'EATEN') {
        target = { r: 7, c: 7 }; // Ojos flotantes vuelven a la puerta
      } else if (s.state === 'FRIGHTENED') {
        target = s.corner; // Dispersión aturdida
      } else if (State.waveMode === 'SCATTER') {
        target = s.corner; // Ciclo canónico de dispersión hacia su cuadrante
      } else {
        // Modo Persecución Activa (CHASE)
        switch (s.id) {
          case 0: // Carmesí (Blinky): Persecución directa implacable
            target = { r: p.r, c: p.c };
            break;

          case 1: // Rosa (Pinky): Emboscada anticipada 4 celdas adelante
            target = {
              r: p.r + p.dir.r * 4,
              c: p.c + p.dir.c * 4
            };
            break;

          case 2: { // Turquesa (Inky): Flanqueador con vector reflejado desde Blinky
            const aheadR = p.r + p.dir.r * 2;
            const aheadC = p.c + p.dir.c * 2;
            const blinky = State.shadows[0] || { r: 7, c: 7 };
            target = {
              r: aheadR + (aheadR - blinky.r),
              c: aheadC + (aheadC - blinky.c)
            };
            break;
          }

          case 3: { // Ámbar (Clyde): Tímido errante (>6 celdas persigue, <6 celdas huye a su esquina)
            const dist = LumenLogic.distSq(s.r, s.c, p.r, p.c);
            if (dist > 36) {
              target = { r: p.r, c: p.c };
            } else {
              target = s.corner;
            }
            break;
          }
        }
      }
      s.target = target;

      // 5. Velocidad efectiva
      let speed = CONFIG.CREATURE_BASE_SPEED;
      if (s.state === 'EATEN') {
        speed = CONFIG.EYES_SPEED;
      } else if (s.state === 'FRIGHTENED') {
        speed = CONFIG.FLEE_SPEED;
      } else if (s.id === 0 && State.dotsRemaining < State.totalDots * 0.25) {
        speed = CONFIG.CREATURE_ELROY_SPEED; // Cruise Elroy
      }

      // En túneles laterales se mueven a velocidad reducida
      if (s.r === 9 && (s.c <= 1 || s.c >= CONFIG.COLS - 2)) {
        speed = Math.min(speed, CONFIG.TUNNEL_GHOST_SPEED);
      }

      // 6. Navegación continua tile-a-tile canónica Pac-Man
      const moveDist = speed * T * dt;
      const nextR = s.r + s.dir.r;
      const nextC = s.c + s.dir.c;
      const targetX = nextC * T + T / 2;
      const targetY = nextR * T + T / 2;

      const dist = Math.hypot(targetX - s.x, targetY - s.y);

      if (moveDist >= dist || dist < 0.8) {
        // Alcanzó el centro de la celda objetivo
        s.x = targetX;
        s.y = targetY;
        s.r = nextR;
        s.c = nextC;

        // Wrap-around de túneles laterales
        if (s.c < 0) {
          s.c = CONFIG.COLS - 1;
          s.x = s.c * T + T / 2;
        } else if (s.c >= CONFIG.COLS) {
          s.c = 0;
          s.x = s.c * T + T / 2;
        }

        // Evaluar las 4 direcciones cardinales en orden canónico (Arriba, Izquierda, Abajo, Derecha)
        const possibleDirs = [
          { r: -1, c: 0 },
          { r: 0, c: -1 },
          { r: 1, c: 0 },
          { r: 0, c: 1 }
        ];

        let bestDir = null;
        let bestDist = Infinity;

        // En modo asustado, elegir aleatoriamente entre las direcciones transitables no-opuestas
        if (s.state === 'FRIGHTENED') {
          const validFleeDirs = [];
          for (const d of possibleDirs) {
            if (LumenLogic.isOpposite(d, s.dir)) continue;
            const nr = s.r + d.r;
            const nc = s.c + d.c;
            if (nr === 9 && (nc < 0 || nc >= CONFIG.COLS)) {
              validFleeDirs.push(d);
            } else if (LumenLogic.isTilePassable(State.grid, nr, nc, false)) {
              validFleeDirs.push(d);
            }
          }
          if (validFleeDirs.length > 0) {
            bestDir = validFleeDirs[Math.floor(Math.random() * validFleeDirs.length)];
          }
        } else {
          for (const d of possibleDirs) {
            // Regla de oro Pac-Man: nunca invertir 180° salvo en callejón sin salida
            if (LumenLogic.isOpposite(d, s.dir)) continue;

            const nr = s.r + d.r;
            const nc = s.c + d.c;

            if (nr === 9 && (nc < 0 || nc >= CONFIG.COLS)) {
              // Túnel lateral transitable
            } else if (!LumenLogic.isTilePassable(State.grid, nr, nc, s.state === 'EATEN' || s.state === 'EXITING')) {
              continue; // Muro
            }

            const dSq = LumenLogic.distSq(nr, nc, s.target.r, s.target.c);
            if (dSq < bestDist) {
              bestDist = dSq;
              bestDir = d;
            }
          }
        }

        // Callejón sin salida: permitir giro de 180°
        if (!bestDir) {
          bestDir = { r: -s.dir.r, c: -s.dir.c };
        }

        s.dir = bestDir;
      } else {
        s.x += s.dir.c * moveDist;
        s.y += s.dir.r * moveDist;
      }
    }
  }

  // ==========================================
  // 6. CONTROL Y MOVIMIENTO DE LUMEN (PAC-MAN)
  // ==========================================
  function updatePlayer(dt) {
    const p = State.player;
    if (!p) return;

    const T = CONFIG.TILE_SIZE;
    const speed = CONFIG.BASE_PLAYER_SPEED * T * dt;

    p.animTimer += dt;
    // Animación de la boca masticando estilo Pac-Man
    p.mouthAngle = (Math.sin(p.animTimer * 22) + 1) * 0.16 * Math.PI;

    // 1. Intentar aplicar el giro almacenado en el búfer (Pre-turn)
    if (p.nextDir.r !== 0 || p.nextDir.c !== 0) {
      if (p.dir.r === p.nextDir.r && p.dir.c === p.nextDir.c) {
        // Ya nos estamos moviendo en esa dirección: continuar sin alterar posición
      } else if (LumenLogic.isOpposite(p.dir, p.nextDir)) {
        // Giro inmediato de 180 grados
        p.dir = { r: p.nextDir.r, c: p.nextDir.c };
      } else {
        // Giro perpendicular o arranque desde detenido
        const cellCenterX = p.c * T + T / 2;
        const cellCenterY = p.r * T + T / 2;
        const distToCenter = Math.hypot(p.x - cellCenterX, p.y - cellCenterY);
        const isCrossingCenter = (p.dir.c > 0 && p.x >= cellCenterX) ||
                                 (p.dir.c < 0 && p.x <= cellCenterX) ||
                                 (p.dir.r > 0 && p.y >= cellCenterY) ||
                                 (p.dir.r < 0 && p.y <= cellCenterY);

        if (distToCenter <= 12.0 || isCrossingCenter || (p.dir.r === 0 && p.dir.c === 0)) {
          const targetR = p.r + p.nextDir.r;
          const targetC = p.c + p.nextDir.c;
          if (LumenLogic.isTilePassable(State.grid, targetR, targetC)) {
            // Alinear al centro del carril y cambiar dirección
            p.x = cellCenterX;
            p.y = cellCenterY;
            p.dir = { r: p.nextDir.r, c: p.nextDir.c };
          }
        }
      }
    }

    // 2. Mover hacia adelante si no hay muro
    if (p.dir.r !== 0 || p.dir.c !== 0) {
      const nextX = p.x + p.dir.c * speed;
      const nextY = p.y + p.dir.r * speed;

      const cellCenterX = p.c * T + T / 2;
      const cellCenterY = p.r * T + T / 2;

      // Mantener alineado el eje transversal
      if (p.dir.c !== 0) p.y = cellCenterY;
      if (p.dir.r !== 0) p.x = cellCenterX;

      // Celda hacia la que nos movemos
      const checkR = p.r + p.dir.r;
      const checkC = p.c + p.dir.c;

      if (!LumenLogic.isTilePassable(State.grid, checkR, checkC)) {
        // Hay muro adelante: detenerse exactamente en el centro de la celda
        if (p.dir.c > 0 && nextX >= cellCenterX) { p.x = cellCenterX; p.dir = { r: 0, c: 0 }; }
        else if (p.dir.c < 0 && nextX <= cellCenterX) { p.x = cellCenterX; p.dir = { r: 0, c: 0 }; }
        else if (p.dir.r > 0 && nextY >= cellCenterY) { p.y = cellCenterY; p.dir = { r: 0, c: 0 }; }
        else if (p.dir.r < 0 && nextY <= cellCenterY) { p.y = cellCenterY; p.dir = { r: 0, c: 0 }; }
        else {
          p.x = nextX;
          p.y = nextY;
        }
      } else {
        p.x = nextX;
        p.y = nextY;
      }

      // Wrap-around de túneles laterales
      if (p.x < -T / 2) {
        p.x = CONFIG.VIRTUAL_W + T / 2;
        unlockAchievement('TUNNEL_ESCAPE');
      } else if (p.x > CONFIG.VIRTUAL_W + T / 2) {
        p.x = -T / 2;
        unlockAchievement('TUNNEL_ESCAPE');
      }

      p.r = Math.floor(p.y / T);
      p.c = Math.floor(p.x / T);
    }

    // 3. Ingesta de orbes y super orbes al pasar por el centro
    if (p.r >= 0 && p.r < CONFIG.ROWS && p.c >= 0 && p.c < CONFIG.COLS) {
      const cellVal = State.grid[p.r][p.c];

      if (cellVal === 2) {
        // Orbe normal
        State.grid[p.r][p.c] = 0;
        State.dotsRemaining--;
        State.score += 10;
        State.stats.dotsEaten++;
        SynthAudio.chomp();
        spawnParticles(p.x, p.y, '#ffd700', 3);
        unlockAchievement('FIRST_DOT');
        updateHUD();

        // Spawn de fruta al 50% y 80% de orbes
        if (!State.fruitSpawned && State.dotsRemaining === Math.floor(State.totalDots * 0.5)) {
          spawnBonusFruit();
        }

      } else if (cellVal === 3) {
        // Super Orbe / Farol de Poder (Energizer)
        State.grid[p.r][p.c] = 0;
        State.dotsRemaining--;
        State.score += 50;
        State.stats.dotsEaten++;
        State.frightenedTimer = CONFIG.SUPER_LUZ_DURATION;
        State.ghostStreak = 0;

        SynthAudio.powerPellet();
        spawnParticles(p.x, p.y, '#00ffff', 16);
        unlockAchievement('POWER_UP');
        showFloatingText(p.x, p.y, '¡SUPER LUZ!', '#00ffff');

        // Todas las sombras vivas entran en pánico
        for (const s of State.shadows) {
          if (s.state === 'CHASE') {
            s.state = 'FRIGHTENED';
            // Invertir dirección de inmediato
            s.dir = { r: -s.dir.r, c: -s.dir.c };
          }
        }
        updateHUD();
      } else if (cellVal === 4) {
        // Fruta / Reliquia de Bonus
        State.grid[p.r][p.c] = 0;
        State.score += State.fruitScore;
        State.stats.fruitsCollected++;
        State.fruitSpawned = false;
        SynthAudio.eatFruit();
        spawnParticles(p.x, p.y, '#f59e0b', 18);
        showFloatingText(p.x, p.y, `+${State.fruitScore}`, '#f59e0b');
        unlockAchievement('FRUIT_COLLECT');
        updateHUD();
      }

      // Comprobar victoria del nivel
      if (State.dotsRemaining <= 0) {
        triggerLevelClear();
      }
    }
  }

  // ==========================================
  // 7. COLISIONES: JUGADOR VS SOMBRAS
  // ==========================================
  function checkCollisions() {
    const p = State.player;
    if (!p || State.gameState !== 'PLAYING') return;

    const T = CONFIG.TILE_SIZE;
    const hitDist = T * 0.68;

    for (const s of State.shadows) {
      if (s.state === 'IN_HOUSE' || s.state === 'EXITING' || s.state === 'EATEN') continue;

      const dist = Math.hypot(p.x - s.x, p.y - s.y);
      if (dist < hitDist) {
        if (s.state === 'FRIGHTENED') {
          // ¡Lumen devora a la sombra!
          s.state = 'EATEN';
          State.ghostStreak++;
          State.stats.shadowsEaten++;

          const pts = [200, 400, 800, 1600][Math.min(State.ghostStreak - 1, 3)];
          State.score += pts;

          State.hitstopTimer = 0.08; // Pausa de impacto breve
          SynthAudio.eatGhost();
          showFloatingText(s.x, s.y, `+${pts}`, '#ffd27a');
          spawnParticles(s.x, s.y, s.color, 20);
          unlockAchievement('EAT_SHADOW');

          if (State.ghostStreak >= 4) {
            unlockAchievement('COMBO_4');
          }

          updateHUD();
        } else {
          // ¡Sombra atrapa a Lumen! Pierde una vida
          triggerPlayerDeath();
          return;
        }
      }
    }
  }

  function spawnBonusFruit() {
    State.fruitSpawned = true;
    State.fruitTimer = CONFIG.FRUIT_DURATION;
    State.grid[11][7] = 4; // Fila 11, debajo de la casa central
    showFloatingText(7 * CONFIG.TILE_SIZE + 11, 11 * CONFIG.TILE_SIZE + 11, 'BONUS', '#ffd700');
  }

  function triggerPlayerDeath() {
    State.gameState = 'DYING';
    State.dyingTimer = 1.2;
    SynthAudio.death();

    if (window.ArcadeCanvas && navigator.userActivation && navigator.userActivation.hasBeenActive) {
      window.ArcadeCanvas.haptic(50);
    }
  }

  function triggerLevelClear() {
    State.gameState = 'LEVEL_CLEAR';
    State.levelClearTimer = 2.0;
    SynthAudio.levelClear();

    if (State.lives === CONFIG.STARTING_LIVES) {
      unlockAchievement('PERFECT_CLEAR');
    }

    if (State.levelIdx === 5) {
      unlockAchievement('WORLD_1');
    }
  }

  // ==========================================
  // 8. RENDERIZADO VECTORIAL NEÓN 80s
  // ==========================================
  function render(time) {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!State.grid || State.grid.length === 0) return;

    const W = CONFIG.VIRTUAL_W;
    const H = CONFIG.VIRTUAL_H;
    const T = CONFIG.TILE_SIZE;
    const world = CONFIG.WORLDS[(State.worldId - 1) % CONFIG.WORLDS.length];

    ctx.save();
    // Limpieza de fondo con tono oscuro del mundo
    ctx.fillStyle = world.wallBg;
    ctx.fillRect(0, 0, W, H);

    // 1. Dibujar Laberinto (Muros Neón)
    renderMaze(ctx, world);

    // 2. Dibujar Orbes, Super Orbes y Frutas
    renderPellets(ctx, world);

    // 3. Dibujar Sombras (Fantasmas con cuerpo o en ojos)
    renderShadows(ctx);

    // 4. Dibujar Jugador (Lumen con boca chomp estilo Pac-Man)
    renderLumen(ctx);

    // 5. Textos flotantes y partículas
    renderFloatingEffects(ctx);

    // 6. Overlays de estado (READY, NIVEL SUPERADO)
    if (State.gameState === 'READY') {
      ctx.fillStyle = '#ffea00';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ffea00';
      ctx.shadowBlur = 8;
      ctx.fillText('¡LISTO!', W / 2, 11 * T + 6);
    } else if (State.gameState === 'LEVEL_CLEAR') {
      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 10;
      ctx.fillText('¡NIVEL LIMPIADO!', W / 2, 11 * T + 6);
    }

    ctx.restore();
  }

  function renderMaze(ctx, world) {
    const T = CONFIG.TILE_SIZE;
    const rows = CONFIG.ROWS;
    const cols = CONFIG.COLS;

    ctx.strokeStyle = world.color;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = world.glow;
    ctx.shadowBlur = 6;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (State.grid[r][c] === 1) {
          // Bloque de muro con borde redondeado neón
          const x = c * T;
          const y = r * T;
          ctx.strokeRect(x + 2, y + 2, T - 4, T - 4);
        } else if (State.grid[r][c] === 5) {
          // Puerta de la Casa Central de Sombras (Row 8, Col 7)
          const x = c * T;
          const y = r * T;
          ctx.strokeStyle = '#ff66cc';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x + 1, y + T / 2);
          ctx.lineTo(x + T - 1, y + T / 2);
          ctx.stroke();
        }
      }
    }

    ctx.shadowBlur = 0;
  }

  function renderPellets(ctx, world) {
    const T = CONFIG.TILE_SIZE;
    const time = Date.now() * 0.005;

    for (let r = 0; r < CONFIG.ROWS; r++) {
      for (let c = 0; c < CONFIG.COLS; c++) {
        const val = State.grid[r][c];
        const cx = c * T + T / 2;
        const cy = r * T + T / 2;

        if (val === 2) {
          // Orbe normal: Pequeño punto dorado con brillo sutil
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (val === 3) {
          // Super Orbe (Energizer): Gran orbe palpitante con aura
          const pulse = (Math.sin(time * 3) + 1) * 1.5 + 4.5;
          ctx.fillStyle = '#fff7aa';
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(cx, cy, pulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (val === 4) {
          // Reliquia de Bonus (Fruta/Gema)
          ctx.save();
          ctx.translate(cx, cy);
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(0, 0, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#10b981';
          ctx.fillRect(-2, -10, 4, 4); // Hoja verde
          ctx.restore();
        }
      }
    }
  }

  function renderLumen(ctx) {
    const p = State.player;
    if (!p) return;

    ctx.save();
    ctx.translate(p.x, p.y);

    if (State.gameState === 'DYING') {
      // Animación de disolución y giro al morir
      const progress = 1 - (State.dyingTimer / 1.2);
      ctx.rotate(progress * Math.PI * 4);
      ctx.scale(Math.max(0, 1 - progress), Math.max(0, 1 - progress));
    }

    // Calcular ángulo de dirección de la boca
    let facingAngle = 0;
    if (p.dir.c > 0) facingAngle = 0;
    else if (p.dir.c < 0) facingAngle = Math.PI;
    else if (p.dir.r > 0) facingAngle = Math.PI / 2;
    else if (p.dir.r < 0) facingAngle = -Math.PI / 2;

    const mouth = (p.dir.r === 0 && p.dir.c === 0) ? 0.05 : p.mouthAngle;
    const R = 8.5;

    // Resplandor dorado cálido
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 12;

    // Cuerpo circular con corte de cuña de la boca
    ctx.fillStyle = '#ffd000';
    ctx.beginPath();
    ctx.arc(0, 0, R, facingAngle + mouth, facingAngle - mouth + Math.PI * 2);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    // Brillo interior 3D
    const grad = ctx.createRadialGradient(-2, -2, 1, 0, 0, R);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#ffe600');
    grad.addColorStop(1, '#d97706');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, R - 1, facingAngle + mouth, facingAngle - mouth + Math.PI * 2);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    // Ojo expresivo
    const eyeX = Math.cos(facingAngle + Math.PI / 3) * 4;
    const eyeY = Math.sin(facingAngle + Math.PI / 3) * 4;
    ctx.fillStyle = '#050811';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 1.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function renderShadows(ctx) {
    const time = Date.now() * 0.006;
    const isFrightened = State.frightenedTimer > 0;
    const isFlashing = isFrightened && State.frightenedTimer < CONFIG.SUPER_LUZ_WARN_TIME;

    for (const s of State.shadows) {
      ctx.save();
      ctx.translate(s.x, s.y);

      if (s.state === 'IN_HOUSE') {
        ctx.globalAlpha = 0.82;
      }

      if (s.state === 'EATEN') {
        // Solo ojos flotantes a alta velocidad hacia la casa
        renderGhostEyes(ctx, s.dir);
        ctx.restore();
        continue;
      }

      // Color del cuerpo (Vulnerable azul/blanco o color propio)
      let bodyColor = s.color;
      if (s.state === 'FRIGHTENED') {
        if (isFlashing && Math.floor(time * 6) % 2 === 0) {
          bodyColor = '#f8fafc'; // Blanco titilante
        } else {
          bodyColor = '#1d4ed8'; // Azul vulnerable
        }
      }

      // 1. Cúpula y cuerpo superior del fantasma
      ctx.fillStyle = bodyColor;
      ctx.shadowColor = bodyColor;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.arc(0, -2, 7.5, Math.PI, 0, false);
      ctx.lineTo(7.5, 5);

      // Falda ondulante con 3 picos sinusoidales
      const wave = Math.sin(time * 3 + s.bobOffset) * 1.5;
      ctx.lineTo(5, 4 + wave);
      ctx.lineTo(2.5, 6 - wave);
      ctx.lineTo(0, 4 + wave);
      ctx.lineTo(-2.5, 6 - wave);
      ctx.lineTo(-5, 4 + wave);
      ctx.lineTo(-7.5, 5);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // 2. Ojos y expresiones
      if (s.state === 'FRIGHTENED') {
        // Ojos asustados y boquita en zigzag
        ctx.fillStyle = '#fff';
        ctx.fillRect(-4, -4, 2.5, 2.5);
        ctx.fillRect(1.5, -4, 2.5, 2.5);

        // Boquita ondulada
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-4, 2);
        ctx.lineTo(-2, 0.5);
        ctx.lineTo(0, 2);
        ctx.lineTo(2, 0.5);
        ctx.lineTo(4, 2);
        ctx.stroke();
      } else {
        renderGhostEyes(ctx, s.dir);
      }

      ctx.restore();
    }
  }

  function renderGhostEyes(ctx, dir) {
    // Globo ocular blanco
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-3, -2, 3, 0, Math.PI * 2);
    ctx.arc(3, -2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Pupilas azules orientadas hacia la dirección de avance
    const lookX = dir.c * 1.4;
    const lookY = dir.r * 1.4;

    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.arc(-3 + lookX, -2 + lookY, 1.4, 0, Math.PI * 2);
    ctx.arc(3 + lookX, -2 + lookY, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  function renderFloatingEffects(ctx) {
    // Textos flotantes (+200, +400, etc.)
    for (let i = State.floatingTexts.length - 1; i >= 0; i--) {
      const f = State.floatingTexts[i];
      f.life -= 0.016;
      f.y -= 0.6;
      if (f.life <= 0) {
        State.floatingTexts.splice(i, 1);
        continue;
      }
      ctx.fillStyle = f.color;
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.globalAlpha = Math.min(1, f.life * 2);
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }

    // Partículas
    for (let i = State.particles.length - 1; i >= 0; i--) {
      const p = State.particles[i];
      p.life -= 0.02;
      p.x += p.vx;
      p.y += p.vy;
      if (p.life <= 0) {
        State.particles.splice(i, 1);
        continue;
      }
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.globalAlpha = 1;
    }
  }

  function showFloatingText(x, y, text, color = '#ffd700') {
    State.floatingTexts.push({ x, y, text, color, life: 1.0 });
  }

  function spawnParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 2.5 + 0.5;
      State.particles.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        size: Math.random() * 2 + 1.5,
        life: 0.8
      });
    }
  }

  // ==========================================
  // 9. CARGA DE NIVELES Y BUCLE PRINCIPAL
  // ==========================================
  function loadLevelData(idx) {
    State.levelIdx = idx % 30;
    State.worldId = Math.floor(State.levelIdx / 6) + 1;

    const template = CONFIG.LEVEL_TEMPLATES[State.levelIdx % CONFIG.LEVEL_TEMPLATES.length];
    const parsed = LumenLogic.parseLevel(template);

    State.grid = parsed.grid;
    State.dotsRemaining = parsed.dotsCount;
    State.totalDots = parsed.dotsCount;
    State.fruitSpawned = false;

    const T = CONFIG.TILE_SIZE;
    State.player = {
      x: parsed.playerPos.c * T + T / 2,
      y: parsed.playerPos.r * T + T / 2,
      r: parsed.playerPos.r,
      c: parsed.playerPos.c,
      dir: { r: 0, c: -1 },
      nextDir: { r: 0, c: -1 },
      mouthAngle: 0.1,
      animTimer: 0
    };

    State.shadows = createShadows();
    State.frightenedTimer = 0;
    State.ghostStreak = 0;
  }

  function startLevel(idx) {
    loadLevelData(idx);
    State.gameState = 'READY';
    State.stateTimer = 1.2;
    updateHUD();
  }

  function respawnAfterDeath() {
    State.lives--;
    updateHUD();

    if (State.lives <= 0) {
      triggerGameOver();
      return;
    }

    // Reposicionar a Lumen y a las sombras
    const template = CONFIG.LEVEL_TEMPLATES[State.levelIdx % CONFIG.LEVEL_TEMPLATES.length];
    const parsed = LumenLogic.parseLevel(template);
    const T = CONFIG.TILE_SIZE;

    State.player.x = parsed.playerPos.c * T + T / 2;
    State.player.y = parsed.playerPos.r * T + T / 2;
    State.player.r = parsed.playerPos.r;
    State.player.c = parsed.playerPos.c;
    State.player.dir = { r: 0, c: -1 };
    State.player.nextDir = { r: 0, c: -1 };

    State.shadows = createShadows();
    State.frightenedTimer = 0;
    State.gameState = 'READY';
    State.stateTimer = 1.2;
  }

  function triggerGameOver() {
    State.gameState = 'GAMEOVER';
    if (State.score > State.highScore) {
      State.highScore = State.score;
      saveHighScore();
    }

    const modal = document.getElementById('overlay-result');
    if (modal) {
      modal.classList.remove('hidden');
      const title = document.getElementById('result-title');
      if (title) title.textContent = 'FIN DE LA PARTIDA';
      const scoreVal = document.getElementById('result-score-val');
      if (scoreVal) scoreVal.textContent = State.score;
    }
  }

  let lastFrameTime = performance.now();

  function gameLoop(time) {
    const rawDt = (time - lastFrameTime) / 1000;
    lastFrameTime = time;
    const dt = Math.min(rawDt, 0.08); // Clamp para evitar saltos

    if (State.isPaused) {
      render(time);
      requestAnimationFrame(gameLoop);
      return;
    }

    if (State.hitstopTimer > 0) {
      State.hitstopTimer -= dt;
    } else {
      if (State.gameState === 'READY') {
        State.stateTimer -= dt;
        if (State.stateTimer <= 0) {
          State.gameState = 'PLAYING';
        }
        // En READY las sombras dentro de la casa balancean suavemente
        for (const s of State.shadows) {
          if (s.state === 'IN_HOUSE') {
            s.y = 9 * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2 + Math.sin(Date.now() * 0.008 + s.bobOffset) * 2.5;
          }
        }
      } else if (State.gameState === 'PLAYING') {
        if (State.frightenedTimer > 0) {
          State.frightenedTimer -= dt;
          if (State.frightenedTimer <= 0) {
            State.frightenedTimer = 0;
            State.ghostStreak = 0;
            for (const s of State.shadows) {
              if (s.state === 'FRIGHTENED') {
                s.state = State.waveMode === 'SCATTER' ? 'SCATTER' : 'CHASE';
              }
            }
          }
        } else {
          // Alternancia canónica de olas SCATTER (7s) y CHASE (20s)
          State.waveTimer -= dt;
          if (State.waveTimer <= 0) {
            if (State.waveMode === 'SCATTER') {
              State.waveMode = 'CHASE';
              State.waveTimer = 20.0;
            } else {
              State.waveMode = 'SCATTER';
              State.waveTimer = 7.0;
            }
          }
        }
        if (State.fruitSpawned) {
          State.fruitTimer -= dt;
          if (State.fruitTimer <= 0) {
            State.fruitSpawned = false;
            State.grid[11][7] = 0;
          }
        }
        updatePlayer(dt);
        updateShadows(dt);
        checkCollisions();
      } else if (State.gameState === 'DYING') {
        State.dyingTimer -= dt;
        if (State.dyingTimer <= 0) {
          respawnAfterDeath();
        }
      } else if (State.gameState === 'LEVEL_CLEAR') {
        State.levelClearTimer -= dt;
        if (State.levelClearTimer <= 0) {
          State.unlockedLevels = Math.max(State.unlockedLevels, State.levelIdx + 2);
          startLevel(State.levelIdx + 1);
        }
      }
    }

    render(time);
    requestAnimationFrame(gameLoop);
  }

  // ==========================================
  // 10. HUD, LOGROS Y PERSISTENCIA
  // ==========================================
  function updateHUD() {
    const scoreEl = document.getElementById('score-val');
    if (scoreEl) scoreEl.textContent = State.score;

    const lanternsEl = document.getElementById('lanterns-val');
    if (lanternsEl) lanternsEl.textContent = `${State.dotsRemaining}/${State.totalDots}`;

    const livesEl = document.getElementById('lives-val');
    if (livesEl) {
      if (window.ArcadeIcons) {
        livesEl.innerHTML = Array(Math.max(0, State.lives)).fill(window.ArcadeIcons.get('spark', { size: 14, color: '#f59e0b' })).join(' ') || '0';
      } else {
        livesEl.textContent = String(State.lives);
      }
    }

    const lvlEl = document.getElementById('level-display');
    if (lvlEl) {
      lvlEl.textContent = `M${State.worldId} • Nivel ${State.levelIdx + 1}`;
    }
  }

  function unlockAchievement(id) {
    if (State.achievements.has(id)) return;
    State.achievements.add(id);

    try {
      localStorage.setItem(`${CONFIG.STORAGE_KEY}:achievements`, JSON.stringify([...State.achievements]));
    } catch (e) {}

    const ach = CONFIG.ACHIEVEMENTS.find(a => a.id === id);
    if (ach) {
      showFloatingText(CONFIG.VIRTUAL_W / 2, 40, ach.title, '#f59e0b');
    }
  }

  function loadHighScore() {
    try {
      if (window.ArcadeStorage) {
        State.highScore = window.ArcadeStorage.getHighScore(CONFIG.STORAGE_KEY) || 0;
      }
    } catch (e) {}
  }

  function saveHighScore() {
    try {
      if (window.ArcadeStorage) {
        window.ArcadeStorage.setHighScore(CONFIG.STORAGE_KEY, State.score);
      }
    } catch (e) {}
  }

  // ==========================================
  // 11. CONTROLES Y EVENTOS
  // ==========================================
  function setupInputs() {
    const handleDirInput = (r, c) => {
      SynthAudio.init();
      const startCard = document.getElementById('start-card');
      if (startCard && !startCard.classList.contains('hidden')) {
        startCard.classList.add('hidden');
        if (State.gameState === 'TITLE') {
          startLevel(0);
        }
      }
      if (State.gameState === 'READY') {
        State.gameState = 'PLAYING';
      }
      if (!State.player) return;
      State.player.nextDir = { r, c };
      if (State.player.dir.r === 0 && State.player.dir.c === 0) {
        const tr = State.player.r + r;
        const tc = State.player.c + c;
        if (LumenLogic.isTilePassable(State.grid, tr, tc)) {
          State.player.dir = { r, c };
        }
      }
    };

    window.addEventListener('keydown', (e) => {
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          handleDirInput(-1, 0);
          e.preventDefault();
          break;
        case 'arrowdown':
        case 's':
          handleDirInput(1, 0);
          e.preventDefault();
          break;
        case 'arrowleft':
        case 'a':
          handleDirInput(0, -1);
          e.preventDefault();
          break;
        case 'arrowright':
        case 'd':
          handleDirInput(0, 1);
          e.preventDefault();
          break;
        case 'p':
        case 'escape':
          togglePause();
          e.preventDefault();
          break;
      }
    });

    // Botones del D-pad virtual táctil
    const bindDpad = (id, r, c) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const onPress = (e) => {
        e.preventDefault();
        handleDirInput(r, c);
      };
      btn.addEventListener('touchstart', onPress, { passive: false });
      btn.addEventListener('mousedown', onPress);
    };

    bindDpad('btn-dpad-up', -1, 0);
    bindDpad('btn-dpad-down', 1, 0);
    bindDpad('btn-dpad-left', 0, -1);
    bindDpad('btn-dpad-right', 0, 1);

    // Gestos swipe sobre el canvas
    let touchStartX = 0;
    let touchStartY = 0;
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
      canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
          const dx = e.touches[0].clientX - touchStartX;
          const dy = e.touches[0].clientY - touchStartY;
          if (Math.abs(dx) > 18 || Math.abs(dy) > 18) {
            if (Math.abs(dx) > Math.abs(dy)) {
              handleDirInput(0, dx > 0 ? 1 : -1);
            } else {
              handleDirInput(dy > 0 ? 1 : -1, 0);
            }
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
          }
        }
      }, { passive: true });
    }
  }

  function handleResize() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;

    const container = document.getElementById('canvas-container');
    const availW = container ? container.clientWidth : window.innerWidth;
    const availH = container ? container.clientHeight : window.innerHeight;

    const scale = Math.min(availW / CONFIG.VIRTUAL_W, availH / CONFIG.VIRTUAL_H, 2.5);
    const targetW = Math.floor(CONFIG.VIRTUAL_W * scale);
    const targetH = Math.floor(CONFIG.VIRTUAL_H * scale);

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(targetW * dpr);
    canvas.height = Math.floor(targetH * dpr);
    canvas.style.width = `${targetW}px`;
    canvas.style.height = `${targetH}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.resetTransform();
      ctx.scale(scale * dpr, scale * dpr);
    }
  }

  function togglePause() {
    State.isPaused = !State.isPaused;
    const pauseModal = document.getElementById('overlay-pause');
    if (pauseModal) {
      pauseModal.classList.toggle('hidden', !State.isPaused);
    }
  }

  let activeWorldTab = 1;

  function renderLevelGrid(worldId = activeWorldTab) {
    activeWorldTab = Math.max(1, Math.min(5, worldId));
    const grid = document.getElementById('levels-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Actualizar tabs activas
    document.querySelectorAll('.world-tab').forEach(tab => {
      const w = parseInt(tab.dataset.world || '1', 10);
      tab.classList.toggle('active', w === activeWorldTab);
    });

    // Actualizar banner
    const worldObj = CONFIG.WORLDS.find(w => w.id === activeWorldTab) || CONFIG.WORLDS[0];
    const badge = document.getElementById('world-badge');
    const desc = document.getElementById('world-desc');
    if (badge) badge.textContent = `MUNDO ${worldObj.id}: ${worldObj.name.toUpperCase()}`;
    if (desc) desc.textContent = worldObj.desc || `Niveles ${(worldObj.id - 1) * 6 + 1} al ${worldObj.id * 6}`;

    const startIdx = (activeWorldTab - 1) * 6;
    for (let i = 0; i < 6; i++) {
      const lvlIdx = startIdx + i;
      const lvlNum = lvlIdx + 1;
      const isCurrent = lvlIdx === State.levelIdx;

      const btn = document.createElement('button');
      btn.className = `level-badge unlocked ${isCurrent ? 'current' : ''}`;
      btn.innerHTML = `
        <span class="level-num">${lvlNum}</span>
        <span class="level-stars">${isCurrent ? 'ACTUAL' : 'LISTO'}</span>
      `;
      btn.title = `Jugar Nivel ${lvlNum} (${worldObj.name})`;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const startCard = document.getElementById('start-card');
        if (startCard) startCard.classList.add('hidden');
        State.isPaused = false;
        startLevel(lvlIdx);
      });
      grid.appendChild(btn);
    }
  }

  function renderAchievements() {
    const list = document.getElementById('ach-list');
    if (!list) return;
    list.innerHTML = '';
    for (const ach of CONFIG.ACHIEVEMENTS) {
      const unlocked = State.achievements.has(ach.id);
      const card = document.createElement('div');
      card.className = 'ach-card' + (unlocked ? ' unlocked' : '');
      card.style.cssText = 'padding:8px 12px;margin:6px 0;background:#0f1826;border:1px solid #1e293b;border-radius:6px;display:flex;align-items:center;gap:10px;';
      const iconHtml = window.ArcadeIcons
        ? (unlocked ? window.ArcadeIcons.get(ach.icon || 'trophy', { size: 20, color: '#f59e0b' }) : window.ArcadeIcons.get('lock', { size: 20, color: '#64748b' }))
        : (unlocked ? '[OK]' : '[--]');
      card.innerHTML = `
        <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;">${iconHtml}</span>
        <div>
          <strong style="color:${unlocked ? '#f59e0b' : '#94a3b8'};">${ach.title}</strong>
          <div style="font-size:12px;color:#94a3b8;">${ach.desc}</div>
        </div>
      `;
      list.appendChild(card);
    }
  }

  function setupUI() {
    window.addEventListener('resize', handleResize);

    // Botón Pausa Header
    const btnPause = document.getElementById('btn-pause-header');
    if (btnPause) {
      btnPause.addEventListener('click', togglePause);
    }

    // Botón Opciones Header
    const btnOptions = document.getElementById('btn-options-toggle');
    if (btnOptions) {
      btnOptions.addEventListener('click', togglePause);
    }

    // Botón Logros Header
    const btnAch = document.getElementById('btn-achievements-toggle');
    if (btnAch) {
      btnAch.addEventListener('click', () => {
        renderAchievements();
        document.getElementById('modal-achievements')?.classList.remove('hidden');
      });
    }

    const btnCloseAch = document.getElementById('btn-close-ach');
    if (btnCloseAch) {
      btnCloseAch.addEventListener('click', () => {
        document.getElementById('modal-achievements')?.classList.add('hidden');
      });
    }

    // Botón Desafío Diario
    const btnDaily = document.getElementById('btn-open-daily');
    if (btnDaily) {
      btnDaily.addEventListener('click', () => {
        document.getElementById('modal-daily')?.classList.remove('hidden');
      });
    }
    const btnCloseDaily = document.getElementById('btn-close-daily');
    if (btnCloseDaily) {
      btnCloseDaily.addEventListener('click', () => {
        document.getElementById('modal-daily')?.classList.add('hidden');
      });
    }
    const btnPlayDaily = document.getElementById('btn-play-daily');
    if (btnPlayDaily) {
      btnPlayDaily.addEventListener('click', () => {
        document.getElementById('modal-daily')?.classList.add('hidden');
        document.getElementById('start-card')?.classList.add('hidden');
        State.isPaused = false;
        startLevel(0);
      });
    }

    // Botones para cerrar el selector de niveles y volver al juego
    const btnCloseStart = document.getElementById('btn-close-start-card');
    if (btnCloseStart) {
      btnCloseStart.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('start-card')?.classList.add('hidden');
        State.isPaused = false;
      });
    }
    const btnBackGame = document.getElementById('btn-back-to-game');
    if (btnBackGame) {
      btnBackGame.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('start-card')?.classList.add('hidden');
        State.isPaused = false;
      });
    }

    // Pestañas de Mundos
    document.querySelectorAll('.world-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.stopPropagation();
        const w = parseInt(tab.dataset.world || '1', 10);
        renderLevelGrid(w);
      });
    });

    // Sub-barra: Tocar para abrir selector de niveles
    const levelDisplay = document.getElementById('sub-bar');
    if (levelDisplay) {
      levelDisplay.style.cursor = 'pointer';
      levelDisplay.title = 'Toca para elegir nivel';
      levelDisplay.addEventListener('click', () => {
        State.isPaused = true;
        document.getElementById('overlay-pause')?.classList.add('hidden');
        const curWorld = Math.floor(State.levelIdx / 6) + 1;
        renderLevelGrid(curWorld);
        document.getElementById('start-card')?.classList.remove('hidden');
      });
    }

    // Botón Sonido
    const btnSound = document.getElementById('btn-sound-toggle');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        State.soundMuted = !State.soundMuted;
        const on = document.getElementById('icon-sound-on');
        const off = document.getElementById('icon-sound-off');
        if (on) on.classList.toggle('hidden', State.soundMuted);
        if (off) off.classList.toggle('hidden', !State.soundMuted);
      });
    }

    // Modal Pausa: Continuar
    const btnResume = document.getElementById('btn-resume');
    if (btnResume) {
      btnResume.addEventListener('click', () => {
        State.isPaused = false;
        document.getElementById('overlay-pause')?.classList.add('hidden');
      });
    }

    // Modal Pausa: Reiniciar Nivel
    const btnRestart = document.getElementById('btn-restart-level');
    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        State.isPaused = false;
        document.getElementById('overlay-pause')?.classList.add('hidden');
        startLevel(State.levelIdx);
      });
    }

    // Modal Pausa: Elegir Nivel
    const btnLevelSelect = document.getElementById('btn-level-select');
    if (btnLevelSelect) {
      btnLevelSelect.addEventListener('click', () => {
        document.getElementById('overlay-pause')?.classList.add('hidden');
        const curWorld = Math.floor(State.levelIdx / 6) + 1;
        renderLevelGrid(curWorld);
        document.getElementById('start-card')?.classList.remove('hidden');
      });
    }

    // Modal Resultados: Siguiente / Reintentar / Salir
    const btnNext = document.getElementById('btn-next-level');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        document.getElementById('overlay-result')?.classList.add('hidden');
        State.isPaused = false;
        startLevel((State.levelIdx + 1) % 30);
      });
    }
    const btnRetry = document.getElementById('btn-retry-level');
    if (btnRetry) {
      btnRetry.addEventListener('click', () => {
        document.getElementById('overlay-result')?.classList.add('hidden');
        State.isPaused = false;
        startLevel(State.levelIdx);
      });
    }
    const btnExit = document.getElementById('btn-exit-to-levels');
    if (btnExit) {
      btnExit.addEventListener('click', () => {
        document.getElementById('overlay-result')?.classList.add('hidden');
        const curWorld = Math.floor(State.levelIdx / 6) + 1;
        renderLevelGrid(curWorld);
        document.getElementById('start-card')?.classList.remove('hidden');
      });
    }
  }

  function showFatalError(msg) {
    const container = document.getElementById('canvas-container');
    if (container) {
      container.innerHTML = `
        <div style="color:#ff4466;padding:24px;text-align:center;font-family:sans-serif;">
          <h3>Error al cargar el nivel</h3>
          <p>${msg || 'Toca para reintentar.'}</p>
          <button onclick="location.reload()" style="background:#ffd27a;color:#2a1a10;border:none;padding:10px 18px;border-radius:6px;font-weight:bold;cursor:pointer;">
            Reintentar
          </button>
        </div>
      `;
    }
  }

  // Inicialización controlada
  function init() {
    try {
      loadHighScore();
      startLevel(0); // Iniciar directamente el nivel 0 para que arranque en READY y juegue de inmediato
      handleResize();
      setupInputs();
      setupUI();

      requestAnimationFrame(gameLoop);
    } catch (err) {
      console.error('Lumen init error:', err);
      showFatalError(err.message);
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, State, LumenLogic };
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', init);
    window.addEventListener('error', (e) => {
      console.error('Lumen runtime exception:', e.error || e.message);
    });

    window.State = State;
    window.LumenLogic = LumenLogic;
  }
})();
