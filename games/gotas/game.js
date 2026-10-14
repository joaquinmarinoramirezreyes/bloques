/**
 * games/gotas/game.js - Gotas Arcade 90 (Edición Maestra de Calidad)
 * Puzzle de gotas líquidas con expresiones faciales reactivas, deformación elástica,
 * fondo animado de caverna alquímica, maratón de 5 jefes, duelo vs IA, contrarreloj y Juice total.
 */
(() => {
  'use strict';

  // ==========================================
  // CONFIGURACIÓN Y CONSTANTES DE BALANCE
  // ==========================================
  const CONFIG = {
    COLS: 6,
    ROWS: 12,
    VIRTUAL_W: 360,
    VIRTUAL_H: 640,
    BASE_DROP_INTERVAL: 0.85,
    FAST_DROP_INTERVAL: 0.05,
    COLORS: [
      { id: 1, name: 'RED',    core: '#ff2255', dark: '#99002a', light: '#ff88aa', bubble: '#ffa0bb' },
      { id: 2, name: 'GREEN',  core: '#00e676', dark: '#008844', light: '#88ffcc', bubble: '#b0ffdd' },
      { id: 3, name: 'BLUE',   core: '#0088ff', dark: '#0044aa', light: '#88ccff', bubble: '#b8e2ff' },
      { id: 4, name: 'YELLOW', core: '#ffcc00', dark: '#aa8800', light: '#ffea88', bubble: '#fff5b8' },
      { id: 5, name: 'PURPLE', core: '#b388ff', dark: '#6633aa', light: '#e2ccff', bubble: '#eeddff' }
    ],
    RAINBOW_ID: 99,
    TRASH_ID: 88, // Gota inerte de basura de jefe / rival
    STORAGE_KEY_V1: 'gotas:v1:best_score',
    STORAGE_KEY_V2: 'gotas:v2',

    // 5 JEFES DE MARATÓN
    BOSSES: [
      { id: 1, name: 'JEFE 1: SORBETE', icon: '🟢', maxHp: 1200, trashInterval: 18.0, trashAmount: 2 },
      { id: 2, name: 'JEFE 2: VISCOSA', icon: '🧪', maxHp: 2600, trashInterval: 15.0, trashAmount: 3 },
      { id: 3, name: 'JEFE 3: MAELSTROM', icon: '🌊', maxHp: 4800, trashInterval: 13.0, trashAmount: 4 },
      { id: 4, name: 'JEFE 4: PLASMA-CORE', icon: '⚡', maxHp: 7500, trashInterval: 11.0, trashAmount: 5 },
      { id: 5, name: 'JEFE 5: TITANIUM BLOB', icon: '👑', maxHp: 11000, trashInterval: 9.0, trashAmount: 6 }
    ],

    // 5 RIVALES DE DUELO IA
    AI_RIVALS: [
      { id: 1, name: 'Novato Gel', icon: '🐣', reactionSpeed: 1.2, comboSkill: 0.2 },
      { id: 2, name: 'Aprendiz Aqua', icon: '💧', reactionSpeed: 0.9, comboSkill: 0.4 },
      { id: 3, name: 'Mago de Reacción', icon: '🧙‍♂️', reactionSpeed: 0.7, comboSkill: 0.65 },
      { id: 4, name: 'Maestra Alquimia', icon: '⚗️', reactionSpeed: 0.55, comboSkill: 0.8 },
      { id: 5, name: 'Oráculo Cuántico', icon: '🔮', reactionSpeed: 0.4, comboSkill: 0.95 }
    ]
  };

  // ==========================================
  // LÓGICA PURA Y SIMULACIÓN (Testeable en Node)
  // ==========================================
  const GotasLogic = {
    createGrid(cols = CONFIG.COLS, rows = CONFIG.ROWS) {
      const grid = new Array(rows);
      for (let r = 0; r < rows; r++) {
        grid[r] = new Array(cols).fill(0);
      }
      return grid;
    },

    /**
     * Aplica gravedad a todas las columnas de forma iterativa
     */
    applyGravity(grid) {
      const rows = grid.length;
      const cols = grid[0].length;
      let totalFallen = 0;

      for (let c = 0; c < cols; c++) {
        let writeRow = rows - 1;
        for (let r = rows - 1; r >= 0; r--) {
          if (grid[r][c] !== 0) {
            if (writeRow !== r) {
              grid[writeRow][c] = grid[r][c];
              grid[r][c] = 0;
              totalFallen++;
            }
            writeRow--;
          }
        }
      }

      return totalFallen;
    },

    /**
     * Detecta grupos conectados ortogonalmente de 4 o más gotas del mismo color
     */
    findConnectedGroups(grid) {
      const rows = grid.length;
      const cols = grid[0].length;
      const visited = new Array(rows);
      for (let r = 0; r < rows; r++) visited[r] = new Uint8Array(cols);

      const groups = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const color = grid[r][c];
          if (color === 0 || color === CONFIG.RAINBOW_ID || color === CONFIG.TRASH_ID || visited[r][c]) continue;

          const cluster = [];
          const queue = [{ r, c }];
          visited[r][c] = 1;

          while (queue.length > 0) {
            const curr = queue.shift();
            cluster.push(curr);

            const dr = [-1, 1, 0, 0];
            const dc = [0, 0, -1, 1];
            for (let i = 0; i < 4; i++) {
              const nr = curr.r + dr[i];
              const nc = curr.c + dc[i];
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                if (!visited[nr][nc] && grid[nr][nc] === color) {
                  visited[nr][nc] = 1;
                  queue.push({ r: nr, c: nc });
                }
              }
            }
          }

          if (cluster.length >= 4) {
            groups.push({ color, cells: cluster });
          }
        }
      }

      return groups;
    },

    /**
     * Resuelve la acción de la gota arcoíris
     */
    resolveRainbowDrop(grid, r, c) {
      const rows = grid.length;
      const cols = grid[0].length;
      let targetColor = 0;

      if (r + 1 < rows && grid[r + 1][c] !== 0 && grid[r + 1][c] !== CONFIG.RAINBOW_ID) {
        targetColor = grid[r + 1][c];
      } else {
        const dr = [0, 0, -1];
        const dc = [-1, 1, 0];
        for (let i = 0; i < 3; i++) {
          const nr = r + dr[i];
          const nc = c + dc[i];
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            if (grid[nr][nc] !== 0 && grid[nr][nc] !== CONFIG.RAINBOW_ID) {
              targetColor = grid[nr][nc];
              break;
            }
          }
        }
      }

      grid[r][c] = 0;

      if (targetColor !== 0) {
        for (let rr = 0; rr < rows; rr++) {
          for (let cc = 0; cc < cols; cc++) {
            if (grid[rr][cc] === targetColor) {
              grid[rr][cc] = 0;
            }
          }
        }
      }

      return targetColor;
    },

    /**
     * Limpia la basura adyacente a un grupo de gotas que estalló
     */
    clearAdjacentTrash(grid, groupCells) {
      const rows = grid.length;
      const cols = grid[0].length;
      let trashCleared = 0;

      for (const cell of groupCells) {
        const dr = [-1, 1, 0, 0];
        const dc = [0, 0, -1, 1];
        for (let i = 0; i < 4; i++) {
          const nr = cell.r + dr[i];
          const nc = cell.c + dc[i];
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            if (grid[nr][nc] === CONFIG.TRASH_ID) {
              grid[nr][nc] = 0;
              trashCleared++;
            }
          }
        }
      }

      return trashCleared;
    },

    /**
     * Añade gotas de basura en las columnas especificadas en la parte superior
     */
    dropTrash(grid, count) {
      const cols = grid[0].length;
      const availableCols = [];
      for (let c = 0; c < cols; c++) availableCols.push(c);
      availableCols.sort(() => Math.random() - 0.5);

      const placed = Math.min(count, cols);
      for (let i = 0; i < placed; i++) {
        const c = availableCols[i];
        if (grid[0][c] === 0) {
          grid[0][c] = CONFIG.TRASH_ID;
        }
      }
      this.applyGravity(grid);
    },

    /**
     * Simula cascadas sucesivas completas hasta estabilización
     */
    simulateCascades(grid) {
      let chains = 0;
      let totalCleared = 0;

      while (true) {
        this.applyGravity(grid);
        const groups = this.findConnectedGroups(grid);
        if (groups.length === 0) break;

        chains++;
        for (const g of groups) {
          this.clearAdjacentTrash(grid, g.cells);
          for (const cell of g.cells) {
            grid[cell.r][cell.c] = 0;
            totalCleared++;
          }
        }
      }

      return { chains, totalCleared };
    }
  };

  // Exportar para pruebas Node
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, GotasLogic };
    return;
  }

  // ==========================================
  // ESTADO DEL JUEGO
  // ==========================================
  const State = {
    grid: GotasLogic.createGrid(),
    started: false,
    paused: false,
    gameOver: false,
    gameMode: 'normal', // 'normal', 'marathon', 'time', 'duel'
    score: 0,
    level: 1,
    timeRemaining: 120, // Modo contrarreloj
    maxCombo: 1,

    // Jefe / Duelo
    currentBossIdx: 0,
    bossHp: 1200,
    bossMaxHp: 1200,
    bossTrashTimer: 18.0,
    aiHp: 100,
    aiTimer: 0,

    // Pareja activa
    activePair: null,
    nextPair: null,
    dropTimer: 0,
    isFastDrop: false,
    isCascading: false,
    cascadeStep: 0,
    cascadeTimer: 0,

    // Deformaciones visuales de gotas (squash & stretch de aterrizaje)
    dropSquash: {}, // clave 'r,c' -> { sx: 1, sy: 1 }

    // Ondas líquidas expansivas (shockwaves)
    shockwaves: [],

    // Fondo animado: Caverna de burbujas bioluminiscentes
    cavernBubbles: [],

    // Cámara con zoom dinámico en combos
    cameraZoom: 1.0,

    // Dimensiones
    cellSize: 44,
    originX: 48,
    originY: 56,
    scale: 1,

    // Partículas
    particles: [],

    // Persistencia versionada (gotas:v2)
    saveData: {
      bestScore: 0,
      bestChain: 1,
      bossesDefeated: 0,
      duelWins: 0,
      timeAttackBest: 0
    }
  };

  // Pre-generar burbujas de fondo de la caverna
  for (let i = 0; i < 24; i++) {
    State.cavernBubbles.push({
      x: Math.random() * CONFIG.VIRTUAL_W,
      y: Math.random() * CONFIG.VIRTUAL_H,
      vy: 18 + Math.random() * 32,
      r: 2 + Math.random() * 5,
      alpha: 0.15 + Math.random() * 0.25,
      wobble: Math.random() * Math.PI * 2
    });
  }

  // ==========================================
  // REFERENCIAS DOM
  // ==========================================
  const dom = {
    canvas: document.getElementById('gotas-canvas'),
    ctx: null,
    previewCanvas: document.getElementById('preview-canvas'),
    pCtx: null,
    hudScore: document.getElementById('hud-score'),
    hudLevel: document.getElementById('hud-level'),
    labelStatLeft: document.getElementById('label-stat-left'),
    labelStatRight: document.getElementById('label-stat-right'),
    hudBossBar: document.getElementById('hud-boss-bar'),
    bossIcon: document.getElementById('boss-icon'),
    bossName: document.getElementById('boss-name'),
    bossHpFill: document.getElementById('boss-hp-fill'),
    bossHpText: document.getElementById('boss-hp-text'),
    trashWarningBanner: document.getElementById('trash-warning-banner'),
    comboBanner: document.getElementById('combo-banner'),
    comboText: document.getElementById('combo-text'),
    startCard: document.getElementById('start-card'),
    btnStart: document.getElementById('btn-start'),
    bestScoreVal: document.getElementById('best-score-val'),
    bestChainVal: document.getElementById('best-chain-val'),
    modeDescTitle: document.getElementById('mode-desc-title'),
    modeDescP: document.getElementById('mode-desc-p'),
    overlayPause: document.getElementById('overlay-pause'),
    btnPauseHeader: document.getElementById('btn-pause-header'),
    btnResume: document.getElementById('btn-resume'),
    btnRestartPause: document.getElementById('btn-restart-pause'),
    btnPauseOptions: document.getElementById('btn-pause-options'),
    overlayGameOver: document.getElementById('overlay-gameover'),
    goTitle: document.getElementById('go-title'),
    goSub: document.getElementById('go-sub'),
    finalScore: document.getElementById('final-score'),
    finalMaxCombo: document.getElementById('final-max-combo'),
    bestFinalScore: document.getElementById('best-final-score'),
    btnRetry: document.getElementById('btn-retry'),
    btnSoundToggle: document.getElementById('btn-sound-toggle'),
    iconSoundOn: document.getElementById('icon-sound-on'),
    iconSoundOff: document.getElementById('icon-sound-off'),
    btnTutorialHeader: document.getElementById('btn-tutorial-header'),
    btnAchievementsHeader: document.getElementById('btn-achievements-header'),
    btnOptionsHeader: document.getElementById('btn-options-header'),

    // Modales
    modalTutorial: document.getElementById('modal-tutorial'),
    tutStep1: document.getElementById('tut-step-1'),
    tutStep2: document.getElementById('tut-step-2'),
    tutStep3: document.getElementById('tut-step-3'),
    btnTutPrev: document.getElementById('btn-tut-prev'),
    btnTutNext: document.getElementById('btn-tut-next'),
    tutPageIndicator: document.getElementById('tut-page-indicator'),
    btnCloseTut: document.getElementById('btn-close-tut'),

    modalAchievements: document.getElementById('modal-achievements'),
    achList: document.getElementById('ach-list'),
    btnCloseAch: document.getElementById('btn-close-ach'),

    modalOptions: document.getElementById('modal-options'),
    optSfx: document.getElementById('opt-sfx'),
    optBgm: document.getElementById('opt-bgm'),
    optVibration: document.getElementById('opt-vibration'),
    optContrast: document.getElementById('opt-contrast'),
    btnCloseOptions: document.getElementById('btn-close-options'),

    // Botones táctiles
    btnLeft: document.getElementById('btn-left'),
    btnRight: document.getElementById('btn-right'),
    btnRotate: document.getElementById('btn-rotate'),
    btnDrop: document.getElementById('btn-drop')
  };

  dom.ctx = dom.canvas.getContext('2d');
  dom.pCtx = dom.previewCanvas.getContext('2d');

  // ==========================================
  // PERSISTENCIA Y MIGRACIÓN
  // ==========================================
  function loadGameData() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEY_V2);
      if (raw) {
        State.saveData = Object.assign(State.saveData, JSON.parse(raw));
      } else {
        const oldScore = window.ArcadeStorage?.getHighScore(CONFIG.STORAGE_KEY_V1) || 0;
        if (oldScore > 0) {
          State.saveData.bestScore = oldScore;
          saveGameData();
        }
      }
    } catch (_) {}

    dom.bestScoreVal.textContent = State.saveData.bestScore.toLocaleString();
    dom.bestChainVal.textContent = `x${State.saveData.bestChain}`;
  }

  function saveGameData() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY_V2, JSON.stringify(State.saveData));
      window.ArcadeStorage?.setHighScore(CONFIG.STORAGE_KEY_V1, State.saveData.bestScore);
    } catch (_) {}
  }

  // ==========================================
  // AUDIO SINTETIZADO Y BGM
  // ==========================================
  let bgmInterval = null;
  let bgmStep = 0;
  const bgmNotes = [330, 392, 440, 523.25, 440, 392, 330, 293.66];

  function startBGM() {
    if (bgmInterval || !window.ArcadeJuice?.getOption('bgm', true)) return;
    scheduleNextBgm();
  }

  function stopBGM() {
    if (bgmInterval) {
      clearTimeout(bgmInterval);
      bgmInterval = null;
    }
  }

  function scheduleNextBgm() {
    if (!State.started || State.paused || State.gameOver || !window.ArcadeJuice?.getOption('bgm', true)) {
      bgmInterval = null;
      return;
    }
    const freq = bgmNotes[bgmStep % bgmNotes.length];
    bgmStep++;
    if (window.ArcadeAudio) {
      window.ArcadeAudio.playTone(freq, 'sine', 0.1, 0.04);
    }
    const delay = Math.max(160, 260 - (State.level - 1) * 12);
    bgmInterval = setTimeout(scheduleNextBgm, delay);
  }

  function playAudio(type) {
    if (!window.ArcadeAudio || !window.ArcadeJuice?.getOption('sfx', true)) return;
    switch (type) {
      case 'move':
        window.ArcadeAudio.playTone(480, 'sine', 0.04, 0.08);
        break;
      case 'rotate':
        window.ArcadeAudio.playTone(620, 'triangle', 0.05, 0.1);
        break;
      case 'land':
        window.ArcadeAudio.playTone(220, 'square', 0.05, 0.08);
        break;
      case 'pop':
        window.ArcadeAudio.playTone(880, 'sine', 0.08, 0.14);
        break;
      case 'cascade':
        [523, 659, 784, 1046].forEach((f, i) => {
          setTimeout(() => window.ArcadeAudio?.playTone(f, 'sine', 0.1, 0.15), i * 70);
        });
        break;
      case 'rainbow':
        [440, 554, 659, 880, 1108].forEach((f, i) => {
          setTimeout(() => window.ArcadeAudio?.playTone(f, 'triangle', 0.1, 0.18), i * 60);
        });
        break;
      case 'trash':
        window.ArcadeAudio.playTone(140, 'sawtooth', 0.15, 0.18);
        break;
      case 'boss-hit':
        window.ArcadeAudio.playTone(280, 'square', 0.1, 0.2);
        break;
      case 'gameover':
        window.ArcadeAudio.playExplosion ? window.ArcadeAudio.playExplosion() : window.ArcadeAudio.playTone(120, 'sawtooth', 0.3, 0.2);
        break;
    }
  }

  // ==========================================
  // RESIZE Y RESPONSIVIDAD
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
  // GENERACIÓN DE PAREJAS DE GOTAS
  // ==========================================
  function getRandomDropColor() {
    if (Math.random() < 0.045) {
      return CONFIG.RAINBOW_ID;
    }
    const available = State.level >= 4 ? 5 : 4;
    const colorObj = CONFIG.COLORS[Math.floor(Math.random() * available)];
    return colorObj.id;
  }

  function createPair() {
    return {
      c1: 2, r1: 1, color1: getRandomDropColor(),
      c2: 2, r2: 0, color2: getRandomDropColor(),
      rot: 0 // 0: arriba, 1: derecha, 2: abajo, 3: izquierda
    };
  }

  function spawnNextPair() {
    if (!State.nextPair) {
      State.nextPair = createPair();
    }

    State.activePair = State.nextPair;
    State.activePair.c1 = 2;
    State.activePair.r1 = 1;
    State.activePair.c2 = 2;
    State.activePair.r2 = 0;
    State.activePair.rot = 0;

    State.nextPair = createPair();
    renderPreview();

    // Comprobar game over si la entrada está colapsada
    if (State.grid[1][2] !== 0 || State.grid[0][2] !== 0) {
      triggerGameOver();
    }
  }

  // ==========================================
  // MOVIMIENTO Y ROTACIÓN
  // ==========================================
  function canMove(pair, dc, dr) {
    const c1 = pair.c1 + dc;
    const r1 = pair.r1 + dr;
    const c2 = pair.c2 + dc;
    const r2 = pair.r2 + dr;

    if (c1 < 0 || c1 >= CONFIG.COLS || r1 >= CONFIG.ROWS) return false;
    if (c2 < 0 || c2 >= CONFIG.COLS || r2 >= CONFIG.ROWS) return false;

    if (r1 >= 0 && State.grid[r1][c1] !== 0) return false;
    if (r2 >= 0 && State.grid[r2][c2] !== 0) return false;

    return true;
  }

  function movePair(dc) {
    if (!State.started || State.paused || State.gameOver || State.isCascading || !State.activePair) return;
    if (canMove(State.activePair, dc, 0)) {
      State.activePair.c1 += dc;
      State.activePair.c2 += dc;
      playAudio('move');
      window.ArcadeJuice?.vibrate(6);
    }
  }

  function rotatePair() {
    if (!State.started || State.paused || State.gameOver || State.isCascading || !State.activePair) return;
    const p = State.activePair;
    const nextRot = (p.rot + 1) % 4;

    const offsets = [
      { dc: 0, dr: -1 },
      { dc: 1, dr: 0 },
      { dc: 0, dr: 1 },
      { dc: -1, dr: 0 }
    ];

    let targetC2 = p.c1 + offsets[nextRot].dc;
    let targetR2 = p.r1 + offsets[nextRot].dr;

    if (targetC2 < 0) {
      if (canMove(p, 1, 0)) {
        p.c1 += 1;
        targetC2 += 1;
      } else return;
    } else if (targetC2 >= CONFIG.COLS) {
      if (canMove(p, -1, 0)) {
        p.c1 -= 1;
        targetC2 -= 1;
      } else return;
    }

    if (targetR2 >= CONFIG.ROWS || (targetR2 >= 0 && State.grid[targetR2][targetC2] !== 0)) {
      return;
    }

    p.rot = nextRot;
    p.c2 = targetC2;
    p.r2 = targetR2;
    playAudio('rotate');
    window.ArcadeJuice?.vibrate(8);
  }

  // ==========================================
  // FIJACIÓN Y CASCADAS DE GOTAS
  // ==========================================
  function lockActivePair() {
    const p = State.activePair;
    if (p.r1 >= 0) {
      State.grid[p.r1][p.c1] = p.color1;
      State.dropSquash[`${p.r1},${p.c1}`] = { sx: 1.25, sy: 0.75 };
    }
    if (p.r2 >= 0) {
      State.grid[p.r2][p.c2] = p.color2;
      State.dropSquash[`${p.r2},${p.c2}`] = { sx: 1.25, sy: 0.75 };
    }

    playAudio('land');
    window.ArcadeJuice?.vibrate(10);
    State.activePair = null;

    State.isCascading = true;
    State.cascadeStep = 0;
    State.cascadeTimer = 0.15;
  }

  function handleCascades(dt) {
    State.cascadeTimer -= dt;
    if (State.cascadeTimer > 0) return;

    // 1. Aplicar gravedad
    const fallen = GotasLogic.applyGravity(State.grid);
    if (fallen > 0) {
      State.cascadeTimer = 0.16;
      return;
    }

    // 2. Comprobar gotas arcoíris
    let triggeredRainbow = false;
    for (let r = 0; r < CONFIG.ROWS; r++) {
      for (let c = 0; c < CONFIG.COLS; c++) {
        if (State.grid[r][c] === CONFIG.RAINBOW_ID) {
          const clearedColor = GotasLogic.resolveRainbowDrop(State.grid, r, c);
          if (clearedColor !== 0) {
            triggeredRainbow = true;
            playAudio('rainbow');
            window.ArcadeJuice?.vibrate(25);
            window.ArcadeJuice?.shake(5, 0.25);
            showComboBanner('¡GOTA ARCOÍRIS!');
            State.score += 450 * State.level;
            window.ArcadeJuice?.unlockAchievement('gotas', 'ach_rainbow', 'Prisma Gelatinoso', 'Activa una Gota Arcoíris');
            updateHUD();
          }
        }
      }
    }

    if (triggeredRainbow) {
      State.cascadeTimer = 0.25;
      return;
    }

    // 3. Detectar grupos conectados >= 4
    const groups = GotasLogic.findConnectedGroups(State.grid);
    if (groups.length > 0) {
      State.cascadeStep++;
      if (State.cascadeStep > State.maxCombo) {
        State.maxCombo = State.cascadeStep;
        if (State.maxCombo > State.saveData.bestChain) {
          State.saveData.bestChain = State.maxCombo;
          saveGameData();
        }
      }

      // Logros por cascadas
      window.ArcadeJuice?.unlockAchievement('gotas', 'ach_first_clear', 'Primera Mezcla', 'Elimina tu primer grupo de gotas');
      if (State.cascadeStep >= 3) {
        window.ArcadeJuice?.unlockAchievement('gotas', 'ach_chain3', 'Reacción en Cadena', 'Consigue una Cascada x3');
      }
      if (State.cascadeStep >= 5) {
        window.ArcadeJuice?.unlockAchievement('gotas', 'ach_chain5', 'Maestro de Cascadas', 'Consigue una Cascada x5');
      }

      // Zoom de cámara en combos grandes
      State.cameraZoom = 1.0 + Math.min(0.12, State.cascadeStep * 0.03);

      const multiplier = Math.pow(2, State.cascadeStep - 1);
      let dropsInStep = 0;

      for (const g of groups) {
        GotasLogic.clearAdjacentTrash(State.grid, g.cells);
        for (const cell of g.cells) {
          State.grid[cell.r][cell.c] = 0;
          dropsInStep++;
          spawnSplash(cell.c, cell.r, g.color);
          spawnShockwave(cell.c, cell.r);
        }
      }

      const pointsEarned = dropsInStep * 20 * multiplier * State.level;
      State.score += pointsEarned;

      // Daño al jefe o rival
      if (State.gameMode === 'marathon') {
        const damage = Math.floor(dropsInStep * 40 * multiplier * (1 + (State.level - 1) * 0.2));
        State.bossHp = Math.max(0, State.bossHp - damage);
        playAudio('boss-hit');
        window.ArcadeJuice?.spawnFloat(`-${damage} PV`, CONFIG.VIRTUAL_W / 2, 70, '#ff2255', 13);
        updateBossBarDisplay();

        if (State.bossHp <= 0) {
          defeatBoss();
        }
      } else if (State.gameMode === 'duel') {
        // Enviar basura a la IA y dañarla
        const aiDamage = dropsInStep * 5 * multiplier;
        State.aiHp = Math.max(0, State.aiHp - aiDamage);
        updateBossBarDisplay();
        if (State.aiHp <= 0) {
          defeatAIDuel();
        }
      }

      playAudio(State.cascadeStep > 1 ? 'cascade' : 'pop');
      window.ArcadeJuice?.vibrate(State.cascadeStep > 1 ? [20, 40] : 12);
      window.ArcadeJuice?.shake(Math.min(10, State.cascadeStep * 2), 0.2);

      if (State.cascadeStep > 1) {
        showComboBanner(`¡CASCADA x${State.cascadeStep}! +${pointsEarned}`);
        window.ArcadeJuice?.spawnFloat(`x${State.cascadeStep}!`, CONFIG.VIRTUAL_W / 2, 280, '#ffcc00', 16);
      }

      updateHUD();
      State.cascadeTimer = 0.24;
      return;
    }

    // Cascada finalizada
    State.isCascading = false;
    State.cascadeStep = 0;

    // Subir de nivel
    State.level = Math.min(10, 1 + Math.floor(State.score / 1500));
    updateHUD();

    spawnNextPair();
  }

  function defeatBoss() {
    State.saveData.bossesDefeated++;
    saveGameData();
    window.ArcadeJuice?.unlockAchievement('gotas', 'ach_boss1', 'Cazador de Jefes', 'Vence al primer jefe en Modo Maratón');

    if (State.currentBossIdx >= 4) {
      window.ArcadeJuice?.unlockAchievement('gotas', 'ach_boss_titan', 'Emperador Líquido', 'Vence al Jefe 5: Titanium Blob');
      showComboBanner('¡MARATÓN SUPERADO!');
      setTimeout(() => {
        triggerGameOver('¡Has derrotado a todos los jefes!');
      }, 1500);
      return;
    }

    State.currentBossIdx++;
    const nextB = CONFIG.BOSSES[State.currentBossIdx];
    State.bossHp = nextB.maxHp;
    State.bossMaxHp = nextB.maxHp;
    State.bossTrashTimer = nextB.trashInterval;
    showComboBanner(`¡${nextB.name}!`);
    updateBossBarDisplay();
  }

  function defeatAIDuel() {
    State.saveData.duelWins++;
    saveGameData();
    window.ArcadeJuice?.unlockAchievement('gotas', 'ach_duel_master', 'Duelo Supremo', 'Vence a la IA en Duelo');
    showComboBanner('¡VICTORIA EN DUELO!');
    setTimeout(() => {
      triggerGameOver('¡Victoria sobre tu rival!');
    }, 1500);
  }

  function showComboBanner(text) {
    dom.comboText.textContent = text;
    dom.comboBanner.classList.remove('hidden');
    setTimeout(() => {
      dom.comboBanner.classList.add('hidden');
    }, 1200);
  }

  function triggerGameOver(customReason = null) {
    State.gameOver = true;
    State.started = false;
    stopBGM();

    playAudio('gameover');
    window.ArcadeJuice?.shake(12, 0.4);
    window.ArcadeJuice?.vibrate([60, 80, 120]);

    if (State.score > State.saveData.bestScore) {
      State.saveData.bestScore = State.score;
      saveGameData();
    }

    if (State.gameMode === 'time' && State.score >= 10000) {
      window.ArcadeJuice?.unlockAchievement('gotas', 'ach_time10k', 'Velocidad Líquida', 'Consigue 10,000 pts en Contrarreloj');
    }

    dom.finalScore.textContent = State.score.toLocaleString();
    dom.finalMaxCombo.textContent = `x${State.maxCombo}`;
    dom.bestFinalScore.textContent = State.saveData.bestScore.toLocaleString();

    if (customReason) {
      dom.goTitle.textContent = '¡FIN DE JUEGO!';
      dom.goTitle.style.color = '#ffcc00';
      dom.goSub.textContent = customReason;
    } else {
      dom.goTitle.textContent = '¡FIN DE PARTIDA!';
      dom.goTitle.style.color = '#ff2255';
      dom.goSub.textContent = 'Columna de entrada colapsada';
    }

    setTimeout(() => {
      dom.overlayGameOver.classList.remove('hidden');
    }, 500);
  }

  function updateHUD() {
    dom.hudScore.textContent = State.score.toLocaleString();
    if (State.gameMode === 'time') {
      dom.labelStatRight.textContent = 'TIEMPO';
      dom.hudLevel.textContent = `${Math.ceil(State.timeRemaining)}s`;
    } else {
      dom.labelStatRight.textContent = 'NIVEL';
      dom.hudLevel.textContent = State.level;
    }
  }

  function updateBossBarDisplay() {
    if (State.gameMode === 'marathon') {
      const b = CONFIG.BOSSES[State.currentBossIdx];
      dom.hudBossBar.classList.remove('hidden');
      dom.bossIcon.textContent = b.icon;
      dom.bossName.textContent = b.name;
      const pct = Math.max(0, Math.min(100, (State.bossHp / State.bossMaxHp) * 100));
      dom.bossHpFill.style.width = `${pct}%`;
      dom.bossHpText.textContent = `${State.bossHp} / ${State.bossMaxHp} PV`;
    } else if (State.gameMode === 'duel') {
      const rival = CONFIG.AI_RIVALS[0];
      dom.hudBossBar.classList.remove('hidden');
      dom.bossIcon.textContent = rival.icon;
      dom.bossName.textContent = `RIVAL: ${rival.name}`;
      dom.bossHpFill.style.width = `${State.aiHp}%`;
      dom.bossHpText.textContent = `${Math.ceil(State.aiHp)}% PV`;
    } else {
      dom.hudBossBar.classList.add('hidden');
    }
  }

  // ==========================================
  // ONDAS Y PARTÍCULAS LÍQUIDAS
  // ==========================================
  function spawnSplash(c, r, colorId) {
    const cs = State.cellSize;
    const x = State.originX + c * cs + cs / 2;
    const y = State.originY + r * cs + cs / 2;
    const cObj = CONFIG.COLORS.find(col => col.id === colorId) || CONFIG.COLORS[0];

    for (let i = 0; i < 12; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 130;
      State.particles.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: cObj.core,
        life: 0.35,
        maxLife: 0.35,
        size: 2.5 + Math.random() * 2
      });
    }
  }

  function spawnShockwave(c, r) {
    const cs = State.cellSize;
    const x = State.originX + c * cs + cs / 2;
    const y = State.originY + r * cs + cs / 2;
    State.shockwaves.push({
      x, y,
      r: 6,
      maxR: cs * 1.5,
      alpha: 0.8
    });
  }

  function updateParticles(dt) {
    for (let i = State.particles.length - 1; i >= 0; i--) {
      const p = State.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        State.particles.splice(i, 1);
      }
    }

    for (let i = State.shockwaves.length - 1; i >= 0; i--) {
      const sw = State.shockwaves[i];
      sw.r += (sw.maxR - sw.r) * dt * 8;
      sw.alpha -= dt * 2.8;
      if (sw.alpha <= 0) {
        State.shockwaves.splice(i, 1);
      }
    }

    // Amortiguar squash & stretch de las gotas
    for (const key in State.dropSquash) {
      const sq = State.dropSquash[key];
      sq.sx += (1 - sq.sx) * dt * 7;
      sq.sy += (1 - sq.sy) * dt * 7;
      if (Math.abs(sq.sx - 1) < 0.02 && Math.abs(sq.sy - 1) < 0.02) {
        delete State.dropSquash[key];
      }
    }

    // Burbujas ascendentes de la caverna
    for (let i = 0; i < State.cavernBubbles.length; i++) {
      const b = State.cavernBubbles[i];
      b.y -= b.vy * dt;
      b.wobble += dt * 3;
      b.x += Math.sin(b.wobble) * 0.4;
      if (b.y < -10) {
        b.y = CONFIG.VIRTUAL_H + 10;
        b.x = Math.random() * CONFIG.VIRTUAL_W;
      }
    }

    // Zoom suave de regreso a 1.0
    State.cameraZoom += (1.0 - State.cameraZoom) * dt * 3;
  }

  // ==========================================
  // ACTUALIZACIÓN DE FÍSICA Y MODOS
  // ==========================================
  function update(dt) {
    if (!State.started || State.paused || State.gameOver) return;

    // Verificar si ArcadeJuice está en hitstop
    const frozen = window.ArcadeJuice?.update(dt);
    if (frozen) return;

    // Modo Contrarreloj
    if (State.gameMode === 'time') {
      State.timeRemaining -= dt;
      if (State.timeRemaining <= 0) {
        State.timeRemaining = 0;
        updateHUD();
        triggerGameOver(`¡Tiempo agotado! Puntos: ${State.score}`);
        return;
      }
      updateHUD();
    }

    // Modo Maratón (Basura del Jefe)
    if (State.gameMode === 'marathon') {
      State.bossTrashTimer -= dt;
      if (State.bossTrashTimer <= 2.0 && State.bossTrashTimer + dt > 2.0) {
        dom.trashWarningBanner.classList.remove('hidden');
        playAudio('trash');
      }
      if (State.bossTrashTimer <= 0) {
        dom.trashWarningBanner.classList.add('hidden');
        const b = CONFIG.BOSSES[State.currentBossIdx];
        GotasLogic.dropTrash(State.grid, b.trashAmount);
        State.bossTrashTimer = b.trashInterval;
        playAudio('trash');
        window.ArcadeJuice?.shake(6, 0.25);
        window.ArcadeJuice?.vibrate(15);
      }
    }

    // Modo Duelo IA
    if (State.gameMode === 'duel') {
      State.aiTimer += dt;
      const rival = CONFIG.AI_RIVALS[0];
      if (State.aiTimer >= rival.reactionSpeed * 10) {
        State.aiTimer = 0;
        if (Math.random() < rival.comboSkill) {
          // La IA lanza 1 gota de basura
          GotasLogic.dropTrash(State.grid, 2);
          playAudio('trash');
          window.ArcadeJuice?.spawnFloat('¡ATAQUE RIVAL!', CONFIG.VIRTUAL_W / 2, 100, '#ff2255', 12);
        }
      }
    }

    // Si está en proceso de cascadas
    if (State.isCascading) {
      handleCascades(dt);
      updateParticles(dt);
      return;
    }

    // Descenso de la pareja activa
    if (State.activePair) {
      const currentInterval = State.isFastDrop ? CONFIG.FAST_DROP_INTERVAL :
                              Math.max(0.18, CONFIG.BASE_DROP_INTERVAL - (State.level - 1) * 0.07);

      State.dropTimer += dt;
      if (State.dropTimer >= currentInterval) {
        State.dropTimer = 0;

        if (canMove(State.activePair, 0, 1)) {
          State.activePair.r1 += 1;
          State.activePair.r2 += 1;
        } else {
          lockActivePair();
        }
      }
    }

    updateParticles(dt);
  }

  // ==========================================
  // RENDERIZADO VECTORIAL 3D Y FLUIDOS
  // ==========================================
  function render() {
    const ctx = dom.ctx;
    const W = CONFIG.VIRTUAL_W;
    const H = CONFIG.VIRTUAL_H;

    ctx.save();
    ctx.resetTransform();
    const dpr = window.devicePixelRatio || 1;

    // Aplicar Screen Shake y Zoom dinámico
    const shakeX = window.ArcadeJuice?.shakeX || 0;
    const shakeY = window.ArcadeJuice?.shakeY || 0;
    const finalScale = State.scale * State.cameraZoom;

    ctx.scale(dpr * finalScale, dpr * finalScale);
    ctx.translate(shakeX, shakeY);

    // 1. Fondo de caverna bioluminiscente
    renderCavernBackground(ctx, W, H);

    // 2. Marco del pozo con bisel y tubos
    renderBoardFrame(ctx);

    // 3. Gotas asentadas en el tablero con caras y deformaciones
    for (let r = 0; r < CONFIG.ROWS; r++) {
      for (let c = 0; c < CONFIG.COLS; c++) {
        const color = State.grid[r][c];
        if (color !== 0) {
          const x = State.originX + c * State.cellSize + State.cellSize / 2;
          const y = State.originY + r * State.cellSize + State.cellSize / 2;
          const sq = State.dropSquash[`${r},${c}`] || { sx: 1, sy: 1 };
          const isDangerZone = r <= 2;
          render3DGelDrop(ctx, x, y, State.cellSize * 0.42, color, sq.sx, sq.sy, isDangerZone);
        }
      }
    }

    // 4. Pareja activa que cae
    if (State.activePair) {
      const p = State.activePair;
      const cs = State.cellSize;

      const x1 = State.originX + p.c1 * cs + cs / 2;
      const y1 = State.originY + p.r1 * cs + cs / 2;
      const x2 = State.originX + p.c2 * cs + cs / 2;
      const y2 = State.originY + p.r2 * cs + cs / 2;

      // Cordón elástico de gel que conecta la pareja
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Deformación al caer (estirada)
      const fallingSy = State.isFastDrop ? 1.25 : 1.1;
      const fallingSx = State.isFastDrop ? 0.8 : 0.9;
      render3DGelDrop(ctx, x1, y1, cs * 0.42, p.color1, fallingSx, fallingSy, false);
      render3DGelDrop(ctx, x2, y2, cs * 0.42, p.color2, fallingSx, fallingSy, false);
    }

    // 5. Ondas líquidas (shockwaves)
    renderShockwaves(ctx);

    // 6. Partículas
    renderParticles(ctx);

    // 7. Textos flotantes de ArcadeJuice
    window.ArcadeJuice?.drawFloats(ctx);

    // 8. Overlay de diagnóstico
    window.ArcadeJuice?.drawDebugOverlay(ctx, State.particles.length);

    ctx.restore();
  }

  function renderCavernBackground(ctx, W, H) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0d18');
    grad.addColorStop(0.5, '#101528');
    grad.addColorStop(1, '#080a12');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Burbujas bioluminiscentes
    ctx.save();
    for (const b of State.cavernBubbles) {
      ctx.fillStyle = `rgba(0, 230, 118, ${b.alpha})`;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function renderBoardFrame(ctx) {
    const ox = State.originX;
    const oy = State.originY;
    const bw = CONFIG.COLS * State.cellSize;
    const bh = CONFIG.ROWS * State.cellSize;

    // Fondo oscuro del matraz
    ctx.fillStyle = '#060810';
    ctx.fillRect(ox, oy, bw, bh);

    // Rejilla translúcida
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let c = 1; c < CONFIG.COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(ox + c * State.cellSize, oy);
      ctx.lineTo(ox + c * State.cellSize, oy + bh);
      ctx.stroke();
    }
    for (let r = 1; r < CONFIG.ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(ox, oy + r * State.cellSize);
      ctx.lineTo(ox + bw, oy + r * State.cellSize);
      ctx.stroke();
    }

    // Marco exterior con bisel metálico
    ctx.strokeStyle = '#283454';
    ctx.lineWidth = 4;
    ctx.strokeRect(ox - 2, oy - 2, bw + 4, bh + 4);

    // Zona de peligro en entrada (columna 2)
    ctx.fillStyle = 'rgba(255, 34, 85, 0.16)';
    ctx.fillRect(ox + 2 * State.cellSize, oy, State.cellSize, State.cellSize);
  }

  /**
   * Dibuja una gota líquida con expresiones reactivas y brillo interior
   */
  function render3DGelDrop(ctx, cx, cy, r, colorId, sx = 1, sy = 1, isDanger = false) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(sx, sy);

    if (colorId === CONFIG.TRASH_ID) {
      // Gota de basura grisácea
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(-r * 0.35, -r * 0.35, r * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Cara somnolienta / inerte
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-6, -2, 4, 2);
      ctx.fillRect(2, -2, 4, 2);

      ctx.restore();
      return;
    }

    if (colorId === CONFIG.RAINBOW_ID) {
      // Gota Arcoíris
      const rainGrad = ctx.createLinearGradient(-r, -r, r, r);
      rainGrad.addColorStop(0, '#ff0055');
      rainGrad.addColorStop(0.25, '#ffaa00');
      rainGrad.addColorStop(0.5, '#00e676');
      rainGrad.addColorStop(0.75, '#0088ff');
      rainGrad.addColorStop(1, '#b388ff');

      ctx.fillStyle = rainGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Destello
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-r * 0.35, -r * 0.35, r * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Cara sonriente mágica
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-4, -1, 3, 0, Math.PI * 2);
      ctx.arc(4, -1, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(-4, -1, 1.5, 0, Math.PI * 2);
      ctx.arc(4, -1, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      return;
    }

    const cObj = CONFIG.COLORS.find(col => col.id === colorId) || CONFIG.COLORS[0];

    // Sombra suave proyectada
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.75, r * 0.8, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cuerpo esférico 3D líquido
    const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
    grad.addColorStop(0, cObj.light);
    grad.addColorStop(0.4, cObj.core);
    grad.addColorStop(1, cObj.dark);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Brillo interior traslúcido
    ctx.fillStyle = cObj.bubble;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(r * 0.2, r * 0.2, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Destello blanco especular principal
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.35, r * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // Expresión facial reactiva
    const isCombo = State.isCascading && State.cascadeStep > 0;

    if (isDanger) {
      // Expresión asustada: ojos abiertos con sudor
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-5, -2, 4, 0, Math.PI * 2);
      ctx.arc(5, -2, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0a0e1c';
      ctx.beginPath();
      ctx.arc(-5, -2, 2, 0, Math.PI * 2);
      ctx.arc(5, -2, 2, 0, Math.PI * 2);
      ctx.fill();

      // Boca 'O' de susto
      ctx.strokeStyle = '#0a0e1c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 5, 2.5, 0, Math.PI * 2);
      ctx.stroke();

      // Gota de sudor
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(8, -6, 2, 0, Math.PI * 2);
      ctx.fill();

    } else if (isCombo) {
      // Expresión alegre en combo: ojos arqueados sonrientes
      ctx.strokeStyle = '#0a0e1c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-4, -1, 3, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(4, -1, 3, Math.PI, 0);
      ctx.stroke();

      // Sonrisa
      ctx.beginPath();
      ctx.arc(0, 3, 3, 0, Math.PI);
      ctx.stroke();

    } else {
      // Expresión normal / simpática
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-4, 0, 3, 0, Math.PI * 2);
      ctx.arc(4, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0a0e1c';
      ctx.beginPath();
      ctx.arc(-3.5, 0, 1.5, 0, Math.PI * 2);
      ctx.arc(4.5, 0, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#0a0e1c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 4, 2, 0, Math.PI);
      ctx.stroke();
    }

    ctx.restore();
  }

  function renderShockwaves(ctx) {
    ctx.save();
    for (const sw of State.shockwaves) {
      ctx.strokeStyle = `rgba(0, 240, 255, ${sw.alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function renderParticles(ctx) {
    ctx.save();
    for (const p of State.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function renderPreview() {
    const ctx = dom.pCtx;
    ctx.clearRect(0, 0, 60, 60);
    if (!State.nextPair) return;
    render3DGelDrop(ctx, 30, 42, 13, State.nextPair.color1);
    render3DGelDrop(ctx, 30, 18, 13, State.nextPair.color2);
  }

  // ==========================================
  // BUCLE DE JUEGO (RAF)
  // ==========================================
  let lastTime = 0;
  function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
  }

  // ==========================================
  // CONTROLES
  // ==========================================
  function setupInputs() {
    const canvas = dom.canvas;
    let startX = 0;
    let startY = 0;

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (!State.started) return;
      window.ArcadeAudio?.initCtx();
      if (e.touches.length > 0) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!State.started || e.touches.length === 0) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;

      if (Math.abs(dx) > 32) {
        movePair(dx > 0 ? 1 : -1);
        startX = e.touches[0].clientX;
      }
      if (dy > 38) {
        State.isFastDrop = true;
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      State.isFastDrop = false;
      if (e.changedTouches.length > 0) {
        const dx = Math.abs(e.changedTouches[0].clientX - startX);
        const dy = Math.abs(e.changedTouches[0].clientY - startY);
        if (dx < 12 && dy < 12) {
          rotatePair();
        }
      }
    }, { passive: false });

    // Botones táctiles barra inferior
    dom.btnLeft.addEventListener('click', () => movePair(-1));
    dom.btnRight.addEventListener('click', () => movePair(1));
    dom.btnRotate.addEventListener('click', rotatePair);
    dom.btnDrop.addEventListener('pointerdown', () => { State.isFastDrop = true; });
    window.addEventListener('pointerup', () => { State.isFastDrop = false; });

    // Teclado
    window.addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P') {
        togglePause();
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') movePair(-1);
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') movePair(1);
      if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w' || e.key === 'W') rotatePair();
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') State.isFastDrop = true;
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') State.isFastDrop = false;
    });
  }

  function togglePause() {
    if (!State.started || State.gameOver) return;
    State.paused = !State.paused;
    dom.overlayPause.classList.toggle('hidden', !State.paused);
    if (State.paused) stopBGM();
    else startBGM();
  }

  function startGame() {
    window.ArcadeAudio?.initCtx();
    State.grid = GotasLogic.createGrid();
    State.started = true;
    State.paused = false;
    State.gameOver = false;
    State.score = 0;
    State.level = 1;
    State.maxCombo = 1;
    State.isCascading = false;
    State.activePair = null;
    State.nextPair = null;
    State.timeRemaining = 120;
    State.currentBossIdx = 0;
    State.bossHp = CONFIG.BOSSES[0].maxHp;
    State.bossMaxHp = CONFIG.BOSSES[0].maxHp;
    State.bossTrashTimer = CONFIG.BOSSES[0].trashInterval;
    State.aiHp = 100;

    dom.startCard.classList.add('hidden');
    dom.overlayPause.classList.add('hidden');
    dom.overlayGameOver.classList.add('hidden');
    dom.trashWarningBanner.classList.add('hidden');

    updateBossBarDisplay();
    updateHUD();
    spawnNextPair();
    startBGM();

    window.ArcadeJuice?.trackPlay('gotas', 0);
  }

  // ==========================================
  // MODALES Y SETUP DE UI
  // ==========================================
  function renderAchievementsModal() {
    const list = [
      { id: 'ach_first_clear', title: 'Primera Mezcla', desc: 'Disuelve tu primer grupo de gotas de gel', icon: '💧' },
      { id: 'ach_chain3', title: 'Reacción en Cadena', desc: 'Consigue una Cascada x3 automática', icon: '⚡' },
      { id: 'ach_chain5', title: 'Maestro de Cascadas', desc: 'Consigue una Cascada x5 épica', icon: '🌊' },
      { id: 'ach_rainbow', title: 'Prisma Gelatinoso', desc: 'Activa y disuelve con una Gota Arcoíris', icon: '🌈' },
      { id: 'ach_boss1', title: 'Cazador de Jefes', desc: 'Derrota al primer jefe en Modo Maratón', icon: '👾' },
      { id: 'ach_boss_titan', title: 'Emperador Líquido', desc: 'Derrota al temido Jefe 5: Titanium Blob', icon: '👑' },
      { id: 'ach_time10k', title: 'Velocidad Líquida', desc: 'Consigue 10,000 pts en Contrarreloj', icon: '⏱️' },
      { id: 'ach_duel_master', title: 'Duelo Supremo', desc: 'Gana un duelo contra la IA de Gotas', icon: '⚔️' }
    ];

    dom.achList.innerHTML = '';
    list.forEach(ach => {
      const unlocked = window.ArcadeJuice?.hasAchievement('gotas', ach.id);
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
    dom.btnStart.addEventListener('click', startGame);
    dom.btnRetry.addEventListener('click', startGame);
    dom.btnRestartPause.addEventListener('click', startGame);
    dom.btnPauseHeader.addEventListener('click', togglePause);
    dom.btnResume.addEventListener('click', togglePause);

    // Selector de Modos
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        State.gameMode = btn.dataset.mode;

        if (State.gameMode === 'normal') {
          dom.modeDescTitle.textContent = 'MODO NORMAL';
          dom.modeDescP.textContent = 'Combina 4 o más gotas del mismo color. La velocidad y los colores aumentan progresivamente.';
        } else if (State.gameMode === 'marathon') {
          dom.modeDescTitle.textContent = 'MARATÓN DE JEFES (5 JEFES)';
          dom.modeDescP.textContent = 'Enfréntate a 5 jefes con barra de vida que lanzan gotas de basura inerte a tu tablero. ¡Daña con combos!';
        } else if (State.gameMode === 'time') {
          dom.modeDescTitle.textContent = 'MODO CONTRARRELOJ (120s)';
          dom.modeDescP.textContent = 'Tienes 2 minutos para desatar tantas cascadas y puntos como puedas antes de que se agote el cronómetro.';
        } else if (State.gameMode === 'duel') {
          dom.modeDescTitle.textContent = 'DUELO CONTRA IA';
          dom.modeDescP.textContent = 'Combate frente a un rival digital. Cada cascada que logres le inflige daño directo hasta vencerlo.';
        }
      });
    });

    // Tutorial Interactivo
    let tutPage = 1;
    function updateTutView() {
      dom.tutStep1.classList.toggle('hidden', tutPage !== 1);
      dom.tutStep2.classList.toggle('hidden', tutPage !== 2);
      dom.tutStep3.classList.toggle('hidden', tutPage !== 3);
      dom.tutPageIndicator.textContent = `${tutPage} / 3`;
    }
    dom.btnTutorialHeader.addEventListener('click', () => {
      tutPage = 1;
      updateTutView();
      dom.modalTutorial.classList.remove('hidden');
    });
    dom.btnTutNext.addEventListener('click', () => {
      tutPage = Math.min(3, tutPage + 1);
      updateTutView();
    });
    dom.btnTutPrev.addEventListener('click', () => {
      tutPage = Math.max(1, tutPage - 1);
      updateTutView();
    });
    dom.btnCloseTut.addEventListener('click', () => {
      dom.modalTutorial.classList.add('hidden');
    });

    // Logros
    dom.btnAchievementsHeader.addEventListener('click', () => {
      renderAchievementsModal();
      dom.modalAchievements.classList.remove('hidden');
    });
    dom.btnCloseAch.addEventListener('click', () => {
      dom.modalAchievements.classList.add('hidden');
    });

    // Opciones y Accesibilidad
    function openOptions() {
      dom.optSfx.checked = window.ArcadeJuice?.getOption('sfx', true);
      dom.optBgm.checked = window.ArcadeJuice?.getOption('bgm', true);
      dom.optVibration.checked = window.ArcadeJuice?.getOption('vibration', true);
      dom.optContrast.checked = window.ArcadeJuice?.getOption('contrast', false);
      dom.modalOptions.classList.remove('hidden');
    }
    dom.btnOptionsHeader.addEventListener('click', openOptions);
    dom.btnPauseOptions.addEventListener('click', openOptions);
    dom.btnCloseOptions.addEventListener('click', () => {
      window.ArcadeJuice?.setOption('sfx', dom.optSfx.checked);
      window.ArcadeJuice?.setOption('bgm', dom.optBgm.checked);
      window.ArcadeJuice?.setOption('vibration', dom.optVibration.checked);
      window.ArcadeJuice?.setOption('contrast', dom.optContrast.checked);

      document.body.classList.toggle('high-contrast', dom.optContrast.checked);

      if (!dom.optBgm.checked) stopBGM();
      else if (State.started && !State.paused && !State.gameOver) startBGM();

      dom.modalOptions.classList.add('hidden');
    });

    // Toggle sonido
    dom.btnSoundToggle.addEventListener('click', () => {
      if (window.ArcadeAudio) {
        const muted = window.ArcadeAudio.toggleMute();
        dom.iconSoundOn.classList.toggle('hidden', muted);
        dom.iconSoundOff.classList.toggle('hidden', !muted);
        if (muted) stopBGM();
        else if (State.started && !State.paused) startBGM();
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

    requestAnimationFrame(gameLoop);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
