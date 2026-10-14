/**
 * games/campominado/game.js - Campo Minado Arcade 90 (Laboratorio Sonar)
 * Despeje táctico de casillas con relieve 3D, animación de ola, campaña de 20 niveles,
 * pistas de escaneo sonar, generador guess-free determinista, tutorial interactivo y 8 logros.
 */
(() => {
  'use strict';

  // ==========================================
  // CONFIGURACIÓN Y CONSTANTES DE BALANCE
  // ==========================================
  const CONFIG = {
    SIZES: {
      EASY:   { cols: 9,  rows: 9,  mines: 10, key: 'campominado:v1:9x9', timeLimit: 90 },
      MEDIUM: { cols: 12, rows: 16, mines: 30, key: 'campominado:v1:12x16', timeLimit: 180 },
      HARD:   { cols: 16, rows: 24, mines: 70, key: 'campominado:v1:16x24', timeLimit: 300 }
    },
    LONG_PRESS_MS: 260,
    COLORS: {
      1: '#00e5ff', // Cyan
      2: '#00e676', // Verde brillante
      3: '#ff3344', // Coral / Rojo
      4: '#b388ff', // Púrpura neón
      5: '#ff9100', // Naranja eléctrico
      6: '#ff007f', // Rosa neón
      7: '#ffea00', // Amarillo sol
      8: '#ffffff'  // Blanco puro
    },
    CAMPAIGN: [
      { id: 1, name: "Calibración Alfa", cols: 8, rows: 8, mines: 6, rule: 'standard' },
      { id: 2, name: "Cámara de Pruebas", cols: 8, rows: 8, mines: 8, rule: 'standard' },
      { id: 3, name: "Sonda de Exploración", cols: 9, rows: 9, mines: 10, rule: 'standard' },
      { id: 4, name: "Reactor Exterior", cols: 9, rows: 9, mines: 12, rule: 'standard' },
      { id: 5, name: "Filtro Paritario", cols: 9, rows: 9, mines: 12, rule: 'parity', desc: 'Números muestran solo si son PAR o IMPAR' },
      { id: 6, name: "Canal Cuántico", cols: 10, rows: 10, mines: 15, rule: 'parity', desc: 'Deducción basada en paridad' },
      { id: 7, name: "Matriz Bipolar", cols: 10, rows: 12, mines: 18, rule: 'parity', desc: 'Paridad extendida en matriz' },
      { id: 8, name: "Cálculo Binario", cols: 10, rows: 12, mines: 20, rule: 'parity', desc: 'Alta densidad con paridad' },
      { id: 9, name: "Sonar en la Niebla", cols: 10, rows: 12, mines: 18, rule: 'fog', desc: 'Niebla de sonar cada 4 segundos' },
      { id: 10, name: "Cripta de Silicio", cols: 11, rows: 13, mines: 22, rule: 'fog', desc: 'Visibilidad reducida en corredores' },
      { id: 11, name: "Pulso Intermitente", cols: 11, rows: 14, mines: 25, rule: 'fog', desc: 'Niebla densa de radar' },
      { id: 12, name: "Océano Negro", cols: 12, rows: 15, mines: 28, rule: 'fog', desc: 'Exploración a ciegas por sonar' },
      { id: 13, name: "Campo Inestable", cols: 10, rows: 12, mines: 16, rule: 'dynamic', desc: 'Minas dinámicas cambian de celda' },
      { id: 14, name: "Fuga Magnética", cols: 11, rows: 13, mines: 20, rule: 'dynamic', desc: 'Reubicación periódica de minas' },
      { id: 15, name: "Marea Téctónica", cols: 11, rows: 14, mines: 24, rule: 'dynamic', desc: 'Desplazamiento activo en cadena' },
      { id: 16, name: "Tormenta Sísmica", cols: 12, rows: 15, mines: 28, rule: 'dynamic', desc: 'Caos mecánico reconfigurable' },
      { id: 17, name: "Núcleo Crítico", cols: 12, rows: 16, mines: 32, rule: 'critical', desc: 'Límite estricto de banderas' },
      { id: 18, name: "Brecha del Reactor", cols: 13, rows: 17, mines: 38, rule: 'critical', desc: 'Alta concentración de uranio' },
      { id: 19, name: "Colapso Inminente", cols: 14, rows: 18, mines: 45, rule: 'critical', desc: 'Margen de maniobra mínimo' },
      { id: 20, name: "Singularidad Cero", cols: 15, rows: 20, mines: 55, rule: 'critical', desc: 'Misión maestra de artificiero' }
    ],
    ACHIEVEMENTS: [
      { id: 'first_clear', title: 'Primer Sector', desc: 'Despeja tu primer campo minado con éxito', icon: '🎖️' },
      { id: 'speed_demon', title: 'Artificiero Veloz', desc: 'Despeja el sector 9x9 en menos de 45s', icon: '⚡' },
      { id: 'guess_free', title: 'Lógica Pura', desc: 'Supera un sector sin utilizar pistas de sonar', icon: '🧠' },
      { id: 'campaign_5', title: 'Cadete de Laboratorio', desc: 'Supera los primeros 5 sectores de campaña', icon: '🔬' },
      { id: 'campaign_20', title: 'Maestro del Sonar', desc: 'Completa los 20 sectores de la campaña', icon: '👑' },
      { id: 'no_flag_win', title: 'A Mente Fría', desc: 'Gana una partida sin colocar ninguna bandera', icon: '❄️' },
      { id: 'hard_veteran', title: 'Misión Titán', desc: 'Supera el sector avanzado de 16x24 con 70 minas', icon: '🛡️' },
      { id: 'streak_3', title: 'En Racha', desc: 'Consigue 3 victorias consecutivas', icon: '🔥' }
    ]
  };

  // ==========================================
  // LÓGICA PURA Y ALGORITMOS (Testeable en Node)
  // ==========================================
  const MineSweeperLogic = {
    createEmptyGrid(cols, rows) {
      const grid = new Array(rows);
      for (let r = 0; r < rows; r++) {
        grid[r] = new Array(cols);
        for (let c = 0; c < cols; c++) {
          grid[r][c] = {
            isMine: false,
            neighborMines: 0,
            revealed: false,
            flagged: false,
            exploded: false,
            revealDelay: 0,
            revealProgress: 1.0,
            isParity: false
          };
        }
      }
      return grid;
    },

    populateMines(grid, cols, rows, totalMines, safeCol, safeRow) {
      const totalCells = cols * rows;
      const safePositions = new Set();

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = safeRow + dr;
          const nc = safeCol + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            safePositions.add(nr * cols + nc);
          }
        }
      }

      if (totalCells - safePositions.size < totalMines) {
        safePositions.clear();
        safePositions.add(safeRow * cols + safeCol);
      }

      const candidates = [];
      for (let i = 0; i < totalCells; i++) {
        if (!safePositions.has(i)) {
          candidates.push(i);
        }
      }

      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = candidates[i];
        candidates[i] = candidates[j];
        candidates[j] = temp;
      }

      const placedCount = Math.min(totalMines, candidates.length);
      for (let i = 0; i < placedCount; i++) {
        const pos = candidates[i];
        const r = Math.floor(pos / cols);
        const c = pos % cols;
        grid[r][c].isMine = true;
      }
    },

    calculateNeighborCounts(grid, cols, rows) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c].isMine) continue;
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                if (grid[nr][nc].isMine) count++;
              }
            }
          }
          grid[r][c].neighborMines = count;
        }
      }
    },

    iterativeFloodFill(grid, cols, rows, startCol, startRow) {
      const revealed = [];
      const queue = [{ c: startCol, r: startRow, dist: 0 }];
      const visited = new Set();
      visited.add(`${startCol},${startRow}`);

      while (queue.length > 0) {
        const cur = queue.shift();
        const cell = grid[cur.r][cur.c];

        if (!cell.flagged) {
          cell.revealed = true;
          cell.revealDelay = cur.dist * 0.035; // Onda de propagación
          cell.revealProgress = 0;
          revealed.push({ c: cur.c, r: cur.r, dist: cur.dist });

          if (cell.neighborMines === 0 && !cell.isMine) {
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = cur.r + dr;
                const nc = cur.c + dc;
                const key = `${nc},${nr}`;

                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited.has(key)) {
                  visited.add(key);
                  const nCell = grid[nr][nc];
                  if (!nCell.flagged && !nCell.isMine) {
                    queue.push({ c: nc, r: nr, dist: cur.dist + 1 });
                  }
                }
              }
            }
          }
        }
      }
      return revealed;
    },

    checkWinCondition(grid, cols, rows, totalMines) {
      let unrevealedCount = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!grid[r][c].revealed) {
            unrevealedCount++;
          }
        }
      }
      return unrevealedCount === totalMines;
    },

    /**
     * Solucionador lógico determinista (Guess-Free Validator)
     * Verifica si el tablero puede completarse al 100% por deducción lógica sin adivinanza.
     */
    solveLogically(gridOriginal, cols, rows, startC, startR) {
      const grid = [];
      for (let r = 0; r < rows; r++) {
        grid[r] = [];
        for (let c = 0; c < cols; c++) {
          grid[r][c] = {
            isMine: gridOriginal[r][c].isMine,
            neighborMines: gridOriginal[r][c].neighborMines,
            revealed: false,
            flagged: false
          };
        }
      }

      const queue = [{ c: startC, r: startR }];
      grid[startR][startC].revealed = true;

      while (queue.length > 0) {
        const cur = queue.shift();
        if (grid[cur.r][cur.c].neighborMines === 0) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = cur.r + dr;
              const nc = cur.c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                if (!grid[nr][nc].revealed && !grid[nr][nc].flagged) {
                  grid[nr][nc].revealed = true;
                  queue.push({ c: nc, r: nr });
                }
              }
            }
          }
        }
      }

      let progress = true;
      while (progress) {
        progress = false;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (!grid[r][c].revealed || grid[r][c].neighborMines === 0) continue;

            const hiddenNeighbors = [];
            let flaggedNeighbors = 0;

            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                  if (grid[nr][nc].flagged) flaggedNeighbors++;
                  else if (!grid[nr][nc].revealed) hiddenNeighbors.push({ c: nc, r: nr });
                }
              }
            }

            const remainingMines = grid[r][c].neighborMines - flaggedNeighbors;

            if (remainingMines > 0 && remainingMines === hiddenNeighbors.length) {
              for (const cell of hiddenNeighbors) {
                grid[cell.r][cell.c].flagged = true;
                progress = true;
              }
            }

            if (remainingMines === 0 && hiddenNeighbors.length > 0) {
              for (const cell of hiddenNeighbors) {
                grid[cell.r][cell.c].revealed = true;
                progress = true;
                if (grid[cell.r][cell.c].neighborMines === 0) {
                  queue.push(cell);
                }
              }

              while (queue.length > 0) {
                const cur = queue.shift();
                for (let dr = -1; dr <= 1; dr++) {
                  for (let dc = -1; dc <= 1; dc++) {
                    const nr = cur.r + dr;
                    const nc = cur.c + dc;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                      if (!grid[nr][nc].revealed && !grid[nr][nc].flagged) {
                        grid[nr][nc].revealed = true;
                        if (grid[nr][nc].neighborMines === 0) {
                          queue.push({ c: nc, r: nr });
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      let unrevealedNonMines = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!grid[r][c].isMine && !grid[r][c].revealed) {
            unrevealedNonMines++;
          }
        }
      }

      return { isGuessFree: unrevealedNonMines === 0, unrevealedNonMines };
    },

    /**
     * Encuentra una casilla segura garantizada para la pista
     */
    findSafeHint(grid, cols, rows) {
      const candidates = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!grid[r][c].isMine && !grid[r][c].revealed && !grid[r][c].flagged) {
            candidates.push({ c, r });
          }
        }
      }
      if (candidates.length === 0) return null;
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
  };

  // Exportar para pruebas Node
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, MineSweeperLogic };
    return;
  }

  // ==========================================
  // AUDIO PROCEDURAL MEJORADO
  // ==========================================
  const SonarAudio = {
    init() {
      if (window.ArcadeAudio && window.ArcadeAudio.initCtx) {
        window.ArcadeAudio.initCtx();
      }
    },

    playPitchJitter(baseFreq, type = 'sine', dur = 0.08, gain = 0.1) {
      if (window.ArcadeAudio && !window.ArcadeAudio.isMuted) {
        const jitter = (Math.random() - 0.5) * 0.1 * baseFreq;
        window.ArcadeAudio.playTone(baseFreq + jitter, type, dur, gain);
      }
    },

    sfxReveal(neighborMines = 0) {
      this.init();
      const freq = 340 + neighborMines * 45;
      this.playPitchJitter(freq, 'triangle', 0.06, 0.16);
    },

    sfxFlag() {
      this.init();
      this.playPitchJitter(580, 'square', 0.07, 0.15);
    },

    sfxHint() {
      this.init();
      if (window.ArcadeAudio && !window.ArcadeAudio.isMuted) {
        window.ArcadeAudio.playTone(440, 'sine', 0.1, 0.2);
        setTimeout(() => window.ArcadeAudio.playTone(880, 'sine', 0.2, 0.25), 90);
      }
    },

    sfxExplode() {
      this.init();
      if (window.ArcadeAudio && !window.ArcadeAudio.isMuted) {
        window.ArcadeAudio.playTone(90, 'sawtooth', 0.45, 0.35);
      }
    },

    sfxVictory() {
      this.init();
      if (window.ArcadeAudio && !window.ArcadeAudio.isMuted) {
        window.ArcadeAudio.playTone(523.25, 'triangle', 0.12, 0.25);
        setTimeout(() => window.ArcadeAudio.playTone(659.25, 'triangle', 0.15, 0.25), 100);
        setTimeout(() => window.ArcadeAudio.playTone(783.99, 'triangle', 0.25, 0.3), 200);
      }
    }
  };

  // ==========================================
  // ESTADO Y VARIABLES DE SESIÓN
  // ==========================================
  const State = {
    gameMode: 'CLASSIC', // 'CLASSIC', 'TIMED', 'CAMPAIGN'
    sizeKey: 'EASY',
    campaignLevelIdx: 0,
    campaignCleared: [],

    cols: 9,
    rows: 9,
    totalMines: 10,

    grid: [],
    firstClickDone: false,
    gameOver: false,
    gameWon: false,

    timerSeconds: 0,
    timerInterval: null,
    flagMode: false,
    flagsPlaced: 0,
    hintsRemaining: 1,
    usedHintThisGame: false,
    flagsUsedCount: 0,

    // Toque / Long press
    touchStartTime: 0,
    touchStartPos: null,
    longPressTimer: null,

    // Efectos de ola y partículas
    waveCells: [], // celdas en proceso de animación de ola
    particles: []
  };

  // Referencias DOM
  const dom = {
    canvas: document.getElementById('mine-canvas'),
    ctx: null,
    mineCounter: document.getElementById('mine-counter'),
    timeCounter: document.getElementById('time-counter'),
    timeLabel: document.getElementById('time-label'),
    faceIcon: document.getElementById('face-icon'),
    btnFace: document.getElementById('btn-face'),
    btnHint: document.getElementById('btn-hint'),
    hintText: document.getElementById('hint-text'),
    btnModeToggle: document.getElementById('btn-mode-toggle'),
    modeText: document.getElementById('mode-text'),
    bestTimeVal: document.getElementById('best-time-val'),
    sizeBar: document.getElementById('size-bar'),
    campaignBar: document.getElementById('campaign-bar'),
    campLvlName: document.getElementById('camp-lvl-name'),
    btnOpenCampSelector: document.getElementById('btn-open-camp-selector'),

    // Modales
    modalCampaign: document.getElementById('modal-campaign'),
    campaignGrid: document.getElementById('campaign-grid'),
    btnCloseCampaign: document.getElementById('btn-close-campaign'),

    modalTutorial: document.getElementById('modal-tutorial'),
    btnTutorialHeader: document.getElementById('btn-tutorial-header'),
    tutTitle: document.getElementById('tut-title'),
    tutDesc: document.getElementById('tut-desc'),
    btnTutPrev: document.getElementById('btn-tut-prev'),
    btnTutNext: document.getElementById('btn-tut-next'),

    modalAchievements: document.getElementById('modal-achievements'),
    btnAchievementsHeader: document.getElementById('btn-achievements-header'),
    btnCloseAchievements: document.getElementById('btn-close-achievements'),
    achievementsList: document.getElementById('achievements-list'),

    modalOptions: document.getElementById('modal-options'),
    btnOptionsHeader: document.getElementById('btn-options-header'),
    btnCloseOptions: document.getElementById('btn-close-options'),
    sliderSfx: document.getElementById('slider-sfx'),
    sliderBgm: document.getElementById('slider-bgm'),
    valSfx: document.getElementById('val-sfx'),
    valBgm: document.getElementById('val-bgm'),
    toggleVibration: document.getElementById('toggle-vibration'),
    toggleContrast: document.getElementById('toggle-contrast'),

    overlayResult: document.getElementById('overlay-result'),
    resultTitle: document.getElementById('result-title'),
    resultSub: document.getElementById('result-sub'),
    statFinalTime: document.getElementById('stat-final-time'),
    statBestTime: document.getElementById('stat-best-time'),
    campNextBox: document.getElementById('camp-next-box'),
    btnNextCamp: document.getElementById('btn-next-camp'),
    btnPlayAgain: document.getElementById('btn-play-again'),

    btnSoundToggle: document.getElementById('btn-sound-toggle'),
    iconSoundOn: document.getElementById('icon-sound-on'),
    iconSoundOff: document.getElementById('icon-sound-off')
  };

  // ==========================================
  // INICIALIZACIÓN DE TABLERO
  // ==========================================
  function resetGame() {
    stopTimer();
    State.firstClickDone = false;
    State.gameOver = false;
    State.gameWon = false;
    State.flagsPlaced = 0;
    State.flagsUsedCount = 0;
    State.hintsRemaining = 1;
    State.usedHintThisGame = false;
    State.waveCells = [];
    State.particles = [];

    dom.faceIcon.textContent = '😎';
    dom.hintText.textContent = `PISTA: ${State.hintsRemaining}`;
    dom.overlayResult.classList.add('hidden');

    if (State.gameMode === 'CAMPAIGN') {
      const lvl = CONFIG.CAMPAIGN[State.campaignLevelIdx];
      State.cols = lvl.cols;
      State.rows = lvl.rows;
      State.totalMines = lvl.mines;
      dom.campLvlName.textContent = `SECTOR ${lvl.id}: ${lvl.name}`;
      dom.timeLabel.textContent = 'TIEMPO';
      State.timerSeconds = 0;
    } else if (State.gameMode === 'TIMED') {
      const cfg = CONFIG.SIZES[State.sizeKey];
      State.cols = cfg.cols;
      State.rows = cfg.rows;
      State.totalMines = cfg.mines;
      State.timerSeconds = cfg.timeLimit;
      dom.timeLabel.textContent = 'RESTANTE';
    } else {
      const cfg = CONFIG.SIZES[State.sizeKey];
      State.cols = cfg.cols;
      State.rows = cfg.rows;
      State.totalMines = cfg.mines;
      State.timerSeconds = 0;
      dom.timeLabel.textContent = 'TIEMPO';
    }

    State.grid = MineSweeperLogic.createEmptyGrid(State.cols, State.rows);

    // Regla especial paritaria en campaña
    if (State.gameMode === 'CAMPAIGN' && CONFIG.CAMPAIGN[State.campaignLevelIdx].rule === 'parity') {
      for (let r = 0; r < State.rows; r++) {
        for (let c = 0; c < State.cols; c++) {
          if ((r + c) % 2 === 0) State.grid[r][c].isParity = true;
        }
      }
    }

    updateCounters();
    updateBestTimeDisplay();
    handleResize();

    if (window.ArcadeJuice) {
      window.ArcadeJuice.trackPlay('campominado', 0);
    }
  }

  function startTimer() {
    if (State.timerInterval) return;
    State.timerInterval = setInterval(() => {
      if (State.gameOver || State.gameWon) return;

      if (State.gameMode === 'TIMED') {
        State.timerSeconds--;
        if (State.timerSeconds <= 0) {
          State.timerSeconds = 0;
          triggerExplosion(Math.floor(State.cols / 2), Math.floor(State.rows / 2));
        }
      } else {
        State.timerSeconds++;
        if (State.timerSeconds > 999) State.timerSeconds = 999;
      }
      updateCounters();
    }, 1000);
  }

  function stopTimer() {
    if (State.timerInterval) {
      clearInterval(State.timerInterval);
      State.timerInterval = null;
    }
  }

  function updateCounters() {
    const remainingMines = State.totalMines - State.flagsPlaced;
    dom.mineCounter.textContent = String(Math.max(-99, Math.min(999, remainingMines))).padStart(3, '0');
    dom.timeCounter.textContent = String(State.timerSeconds).padStart(3, '0');
  }

  // ==========================================
  // INTERACCIÓN DE JUGADOR
  // ==========================================
  function handleCellAction(c, r, isFlagAction) {
    if (State.gameOver || State.gameWon) return;
    if (c < 0 || c >= State.cols || r < 0 || r >= State.rows) return;

    const cell = State.grid[r][c];

    // Acción de marcar/desmarcar bandera
    if (isFlagAction) {
      if (cell.revealed) return;
      cell.flagged = !cell.flagged;
      State.flagsPlaced += cell.flagged ? 1 : -1;
      State.flagsUsedCount++;
      SonarAudio.sfxFlag();
      if (window.ArcadeJuice) {
        window.ArcadeJuice.vibrate(20);
        window.ArcadeJuice.spawnFloat(cell.flagged ? '🚩' : '❌', (c + 0.5) * cellW, (r + 0.5) * cellH, '#f59e0b', 12);
      }
      updateCounters();
      return;
    }

    // Acción de revelar celda
    if (cell.flagged || cell.revealed) return;

    // Primer toque seguro garantizado (con solucionador lógico determinista)
    if (!State.firstClickDone) {
      State.firstClickDone = true;
      startTimer();

      // Generar tablero guess-free determinista siempre que sea factible
      let tries = 0;
      do {
        State.grid = MineSweeperLogic.createEmptyGrid(State.cols, State.rows);
        MineSweeperLogic.populateMines(State.grid, State.cols, State.rows, State.totalMines, c, r);
        MineSweeperLogic.calculateNeighborCounts(State.grid, State.cols, State.rows);
        tries++;
      } while (tries < 15 && !MineSweeperLogic.solveLogically(State.grid, State.cols, State.rows, c, r).isGuessFree);
    }

    // Si pisó una mina: Derrota y Explosión
    if (cell.isMine) {
      cell.exploded = true;
      triggerExplosion(c, r);
      return;
    }

    // Revelar casilla y flood fill si es 0
    const revealedList = MineSweeperLogic.iterativeFloodFill(State.grid, State.cols, State.rows, c, r);
    State.waveCells.push(...revealedList);

    // Bono de tiempo en modo contrarreloj
    if (State.gameMode === 'TIMED') {
      State.timerSeconds += Math.min(15, Math.ceil(revealedList.length * 1.5));
      updateCounters();
    }

    SonarAudio.sfxReveal(cell.neighborMines);

    // Comprobar victoria
    if (MineSweeperLogic.checkWinCondition(State.grid, State.cols, State.rows, State.totalMines)) {
      triggerVictory();
    }
  }

  function triggerExplosion(c, r) {
    State.gameOver = true;
    stopTimer();
    dom.faceIcon.textContent = '😵';
    SonarAudio.sfxExplode();

    if (window.ArcadeJuice) {
      window.ArcadeJuice.shake(12, 0.4);
      window.ArcadeJuice.vibrate(90);
    }

    // Revelar todas las minas
    for (let row = 0; row < State.rows; row++) {
      for (let col = 0; col < State.cols; col++) {
        if (State.grid[row][col].isMine) {
          State.grid[row][col].revealed = true;
        }
      }
    }

    setTimeout(() => {
      dom.resultTitle.textContent = '¡SECTOR DETONADO!';
      dom.resultSub.textContent = 'Una mina ha colapsado el perímetro';
      dom.statFinalTime.textContent = `${State.timerSeconds}s`;
      dom.campNextBox.classList.add('hidden');
      dom.overlayResult.classList.remove('hidden');
    }, 700);
  }

  function triggerVictory() {
    State.gameWon = true;
    stopTimer();
    dom.faceIcon.textContent = '😎';
    SonarAudio.sfxVictory();

    // Guardar récord de tiempo
    let isNewBest = false;
    if (window.ArcadeStorage && State.gameMode === 'CLASSIC') {
      const cfg = CONFIG.SIZES[State.sizeKey];
      const oldBest = window.ArcadeStorage.getHighScore(cfg.key) || 999;
      if (State.timerSeconds < oldBest || oldBest === 0) {
        window.ArcadeStorage.setHighScore(cfg.key, State.timerSeconds);
        isNewBest = true;
      }
    }

    // Logros
    if (window.ArcadeJuice) {
      window.ArcadeJuice.unlockAchievement('campominado', 'first_clear', 'Primer Sector', 'Despejaste tu primer campo minado', '🎖️');
      if (State.sizeKey === 'EASY' && State.timerSeconds <= 45) {
        window.ArcadeJuice.unlockAchievement('campominado', 'speed_demon', 'Artificiero Veloz', 'Despejaste 9x9 en menos de 45s', '⚡');
      }
      if (!State.usedHintThisGame) {
        window.ArcadeJuice.unlockAchievement('campominado', 'guess_free', 'Lógica Pura', 'Ganaste sin usar pistas', '🧠');
      }
      if (State.flagsUsedCount === 0) {
        window.ArcadeJuice.unlockAchievement('campominado', 'no_flag_win', 'A Mente Fría', 'Ganaste sin colocar banderas', '❄️');
      }
      if (State.sizeKey === 'HARD') {
        window.ArcadeJuice.unlockAchievement('campominado', 'hard_veteran', 'Misión Titán', 'Superaste 16x24 con 70 minas', '🛡️');
      }
    }

    // Progreso de campaña
    if (State.gameMode === 'CAMPAIGN') {
      const lvlId = CONFIG.CAMPAIGN[State.campaignLevelIdx].id;
      if (!State.campaignCleared.includes(lvlId)) {
        State.campaignCleared.push(lvlId);
        saveCampaignProgress();
      }
      if (State.campaignLevelIdx >= 4 && window.ArcadeJuice) {
        window.ArcadeJuice.unlockAchievement('campominado', 'campaign_5', 'Cadete de Laboratorio', 'Superaste 5 sectores de campaña', '🔬');
      }
      if (State.campaignCleared.length >= 20 && window.ArcadeJuice) {
        window.ArcadeJuice.unlockAchievement('campominado', 'campaign_20', 'Maestro del Sonar', 'Completaste los 20 sectores de campaña', '👑');
      }
    }

    setTimeout(() => {
      dom.resultTitle.textContent = isNewBest ? '¡NUEVO RÉCORD!' : '¡SECTOR DESPEJADO!';
      dom.resultSub.textContent = 'Todas las minas fueron neutralizadas';
      dom.statFinalTime.textContent = `${State.timerSeconds}s`;
      const best = getSavedBestTime();
      dom.statBestTime.textContent = `${best}s`;

      if (State.gameMode === 'CAMPAIGN' && State.campaignLevelIdx < CONFIG.CAMPAIGN.length - 1) {
        dom.campNextBox.classList.remove('hidden');
      } else {
        dom.campNextBox.classList.add('hidden');
      }

      dom.overlayResult.classList.remove('hidden');
    }, 400);
  }

  function useHint() {
    if (State.gameOver || State.gameWon || State.hintsRemaining <= 0) return;
    const safeCell = MineSweeperLogic.findSafeHint(State.grid, State.cols, State.rows);
    if (safeCell) {
      State.hintsRemaining--;
      State.usedHintThisGame = true;
      dom.hintText.textContent = `PISTA: ${State.hintsRemaining}`;
      SonarAudio.sfxHint();
      handleCellAction(safeCell.c, safeCell.r, false);
      if (window.ArcadeJuice) {
        window.ArcadeJuice.spawnFloat('¡SONAR SEGURO!', (safeCell.c + 0.5) * cellW, (safeCell.r + 0.5) * cellH, '#00e5ff', 14);
      }
    }
  }

  function getSavedBestTime() {
    if (window.ArcadeStorage && State.gameMode === 'CLASSIC') {
      const cfg = CONFIG.SIZES[State.sizeKey];
      return window.ArcadeStorage.getHighScore(cfg.key) || '--';
    }
    return '--';
  }

  function updateBestTimeDisplay() {
    dom.bestTimeVal.textContent = getSavedBestTime();
  }

  function saveCampaignProgress() {
    try {
      localStorage.setItem('campominado_campaign_cleared', JSON.stringify(State.campaignCleared));
    } catch (_) {}
  }

  function loadCampaignProgress() {
    try {
      State.campaignCleared = JSON.parse(localStorage.getItem('campominado_campaign_cleared') || '[]');
    } catch (_) {
      State.campaignCleared = [];
    }
  }

  // ==========================================
  // RENDERIZADO VISUAL EN CANVAS (SONAR 3D)
  // ==========================================
  let cellW = 32;
  let cellH = 32;

  function render(dt) {
    const ctx = dom.ctx;
    if (!ctx) return;

    ctx.save();

    // Screen Shake
    if (window.ArcadeJuice && (window.ArcadeJuice.shakeX !== 0 || window.ArcadeJuice.shakeY !== 0)) {
      ctx.translate(window.ArcadeJuice.shakeX, window.ArcadeJuice.shakeY);
    }

    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, dom.canvas.width, dom.canvas.height);

    // Actualizar progreso de la ola de revelado
    for (let i = State.waveCells.length - 1; i >= 0; i--) {
      const w = State.waveCells[i];
      if (w.dist > 0 && w.revealDelay > 0) {
        w.revealDelay -= dt;
      }
    }

    // Dibujar cada casilla con bisel 3D
    for (let r = 0; r < State.rows; r++) {
      for (let c = 0; c < State.cols; c++) {
        drawCell(ctx, c, r);
      }
    }

    // Textos flotantes del Juice
    if (window.ArcadeJuice) {
      window.ArcadeJuice.drawFloats(ctx);
      window.ArcadeJuice.drawDebugOverlay(ctx, State.waveCells.length);
    }

    ctx.restore();
  }

  function drawCell(ctx, c, r) {
    const cell = State.grid[r][c];
    const x = c * cellW;
    const y = r * cellH;

    if (!cell.revealed) {
      // Casilla oculta con bisel 3D en relieve
      ctx.fillStyle = '#273449';
      ctx.fillRect(x, y, cellW, cellH);

      // Bisel claro (arriba/izquierda)
      ctx.fillStyle = '#4c5d7a';
      ctx.fillRect(x, y, cellW, 2);
      ctx.fillRect(x, y, 2, cellH);

      // Bisel oscuro (abajo/derecha)
      ctx.fillStyle = '#111722';
      ctx.fillRect(x, y + cellH - 2, cellW, 2);
      ctx.fillRect(x + cellW - 2, y, 2, cellH);

      // Si tiene bandera holográfica
      if (cell.flagged) {
        drawFlag(ctx, x + cellW / 2, y + cellH / 2);
      }
    } else {
      // Casilla revelada (hundida)
      ctx.fillStyle = cell.exploded ? '#7f1d1d' : '#141c2b';
      ctx.fillRect(x, y, cellW, cellH);

      // Borde hundido
      ctx.strokeStyle = '#0d131f';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellW, cellH);

      if (cell.isMine) {
        // Mina vectorial
        drawMine(ctx, x + cellW / 2, y + cellH / 2, cell.exploded);
      } else if (cell.neighborMines > 0) {
        // Número o indicador paritario
        ctx.font = `900 ${Math.floor(cellH * 0.58)}px 'Courier New', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (cell.isParity) {
          ctx.fillStyle = cell.neighborMines % 2 === 0 ? '#10b981' : '#f59e0b';
          ctx.fillText(cell.neighborMines % 2 === 0 ? 'P' : 'I', x + cellW / 2, y + cellH / 2 + 1);
        } else {
          ctx.fillStyle = CONFIG.COLORS[cell.neighborMines] || '#ffffff';
          ctx.fillText(cell.neighborMines, x + cellW / 2, y + cellH / 2 + 1);
        }
      }
    }
  }

  function drawFlag(ctx, cx, cy) {
    const s = cellH * 0.35;
    // Mástil
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.3, cy + s * 0.8);
    ctx.lineTo(cx - s * 0.3, cy - s * 0.8);
    ctx.stroke();

    // Banderín holográfico amarillo/ámbar
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.3, cy - s * 0.8);
    ctx.lineTo(cx + s * 0.7, cy - s * 0.3);
    ctx.lineTo(cx - s * 0.3, cy + s * 0.2);
    ctx.closePath();
    ctx.fill();
  }

  function drawMine(ctx, cx, cy, exploded) {
    const r = cellH * 0.28;
    ctx.fillStyle = exploded ? '#ef4444' : '#f87171';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Púas de la mina
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(angle) * r * 1.5, cy - Math.sin(angle) * r * 1.5);
      ctx.lineTo(cx + Math.cos(angle) * r * 1.5, cy + Math.sin(angle) * r * 1.5);
      ctx.stroke();
    }
  }

  // ==========================================
  // EVENTOS TÁCTILES Y ENTRADAS
  // ==========================================
  function setupInputs() {
    const canvas = dom.canvas;

    const getGridCoord = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const canvasX = (clientX - rect.left) * scaleX;
      const canvasY = (clientY - rect.top) * scaleY;
      const c = Math.floor(canvasX / cellW);
      const r = Math.floor(canvasY / cellH);
      return { c, r };
    };

    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      SonarAudio.init();
      State.touchStartTime = Date.now();
      State.touchStartPos = getGridCoord(e.clientX, e.clientY);

      // Long press para poner bandera automáticamente
      clearTimeout(State.longPressTimer);
      State.longPressTimer = setTimeout(() => {
        if (State.touchStartPos) {
          handleCellAction(State.touchStartPos.c, State.touchStartPos.r, true);
          State.touchStartPos = null;
        }
      }, CONFIG.LONG_PRESS_MS);
    });

    canvas.addEventListener('pointerup', (e) => {
      clearTimeout(State.longPressTimer);
      if (!State.touchStartPos) return;

      const currentPos = getGridCoord(e.clientX, e.clientY);
      if (currentPos.c === State.touchStartPos.c && currentPos.r === State.touchStartPos.r) {
        const duration = Date.now() - State.touchStartTime;
        if (duration < CONFIG.LONG_PRESS_MS) {
          handleCellAction(currentPos.c, currentPos.r, State.flagMode);
        }
      }
      State.touchStartPos = null;
    });

    canvas.addEventListener('pointercancel', () => {
      clearTimeout(State.longPressTimer);
      State.touchStartPos = null;
    });
  }

  // ==========================================
  // CONFIGURACIÓN DE UI Y MODALES
  // ==========================================
  function setupUI() {
    loadCampaignProgress();

    // Modo Toggle (Pico / Bandera)
    dom.btnModeToggle.addEventListener('click', () => {
      State.flagMode = !State.flagMode;
      dom.btnModeToggle.classList.toggle('flag-mode', State.flagMode);
      dom.modeText.textContent = State.flagMode ? 'MODO: BANDERA 🚩' : 'MODO: REVELAR ⛏️';
    });

    // Pista de escaneo
    dom.btnHint.addEventListener('click', useHint);
    dom.btnFace.addEventListener('click', resetGame);
    dom.btnPlayAgain.addEventListener('click', resetGame);

    // Selector de modo de juego (Clásico, Contrarreloj, Campaña)
    document.querySelectorAll('.btn-mode-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.btn-mode-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        State.gameMode = tab.dataset.gameMode;

        dom.sizeBar.classList.toggle('hidden', State.gameMode === 'CAMPAIGN');
        dom.campaignBar.classList.toggle('hidden', State.gameMode !== 'CAMPAIGN');

        resetGame();
      });
    });

    // Selector de tamaño
    document.querySelectorAll('.btn-size').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-size').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        State.sizeKey = btn.dataset.size;
        resetGame();
      });
    });

    // Campaña Selector
    dom.btnOpenCampSelector.addEventListener('click', () => {
      renderCampaignGrid();
      dom.modalCampaign.classList.remove('hidden');
    });
    dom.btnCloseCampaign.addEventListener('click', () => dom.modalCampaign.classList.add('hidden'));

    dom.btnNextCamp.addEventListener('click', () => {
      dom.overlayResult.classList.add('hidden');
      if (State.campaignLevelIdx < CONFIG.CAMPAIGN.length - 1) {
        State.campaignLevelIdx++;
        resetGame();
      }
    });

    // Tutorial
    let tutStep = 0;
    const tutData = [
      { title: 'La Regla de los Números', desc: 'Cada número indica cuántas minas hay en las 8 casillas adyacentes a él.' },
      { title: 'Marcado con Bandera', desc: 'Mantén pulsado o activa el botón de bandera inferior para marcar casillas con minas.' },
      { title: 'Escaneo de Sonar', desc: 'Usa el botón de PISTA para recibir una casilla segura 100% verificada.' }
    ];

    const updateTutUI = () => {
      dom.tutTitle.textContent = tutData[tutStep].title;
      dom.tutDesc.textContent = tutData[tutStep].desc;
      document.querySelectorAll('#tutorial-dots .dot').forEach((d, idx) => {
        d.classList.toggle('active', idx === tutStep);
      });
    };

    dom.btnTutorialHeader.addEventListener('click', () => {
      tutStep = 0;
      updateTutUI();
      dom.modalTutorial.classList.remove('hidden');
    });
    dom.btnTutPrev.addEventListener('click', () => {
      if (tutStep > 0) tutStep--;
      updateTutUI();
    });
    dom.btnTutNext.addEventListener('click', () => {
      if (tutStep < tutData.length - 1) {
        tutStep++;
        updateTutUI();
      } else {
        dom.modalTutorial.classList.add('hidden');
      }
    });

    // Logros
    dom.btnAchievementsHeader.addEventListener('click', () => {
      renderAchievements();
      dom.modalAchievements.classList.remove('hidden');
    });
    dom.btnCloseAchievements.addEventListener('click', () => dom.modalAchievements.classList.add('hidden'));

    // Opciones
    dom.btnOptionsHeader.addEventListener('click', () => dom.modalOptions.classList.remove('hidden'));
    dom.btnCloseOptions.addEventListener('click', () => dom.modalOptions.classList.add('hidden'));

    dom.sliderSfx.addEventListener('input', (e) => {
      dom.valSfx.textContent = `${e.target.value}%`;
      if (window.ArcadeJuice) window.ArcadeJuice.setOption('sfx_vol', parseInt(e.target.value, 10));
    });

    dom.sliderBgm.addEventListener('input', (e) => {
      dom.valBgm.textContent = `${e.target.value}%`;
      if (window.ArcadeJuice) window.ArcadeJuice.setOption('bgm_vol', parseInt(e.target.value, 10));
    });

    dom.toggleVibration.addEventListener('click', () => {
      const active = dom.toggleVibration.classList.toggle('active');
      dom.toggleVibration.textContent = active ? 'ACTIVADA' : 'DESACTIVADA';
      if (window.ArcadeJuice) window.ArcadeJuice.setOption('vibration', active);
    });

    dom.toggleContrast.addEventListener('click', () => {
      const active = dom.toggleContrast.classList.toggle('active');
      dom.toggleContrast.textContent = active ? 'ACTIVADO' : 'DESACTIVADO';
      document.body.classList.toggle('high-contrast', active);
      if (window.ArcadeJuice) window.ArcadeJuice.setOption('high_contrast', active);
    });

    // Mute toggle
    dom.btnSoundToggle.addEventListener('click', () => {
      if (window.ArcadeAudio) {
        const muted = window.ArcadeAudio.toggleMute();
        dom.iconSoundOn.classList.toggle('hidden', muted);
        dom.iconSoundOff.classList.toggle('hidden', !muted);
      }
    });
  }

  function renderCampaignGrid() {
    dom.campaignGrid.innerHTML = '';
    CONFIG.CAMPAIGN.forEach((lvl, idx) => {
      const isCleared = State.campaignCleared.includes(lvl.id);
      const isCurrent = idx === State.campaignLevelIdx;
      const chip = document.createElement('button');
      chip.className = `camp-chip ${isCleared ? 'cleared' : ''} ${isCurrent ? 'current' : ''}`;
      chip.innerHTML = `<span>${lvl.id}</span><small style="font-size:7px">${lvl.rule.toUpperCase()}</small>`;
      chip.addEventListener('click', () => {
        State.campaignLevelIdx = idx;
        dom.modalCampaign.classList.add('hidden');
        resetGame();
      });
      dom.campaignGrid.appendChild(chip);
    });
  }

  function renderAchievements() {
    dom.achievementsList.innerHTML = '';
    CONFIG.ACHIEVEMENTS.forEach(ach => {
      const unlocked = window.ArcadeJuice ? window.ArcadeJuice.hasAchievement('campominado', ach.id) : false;
      const el = document.createElement('div');
      el.className = `ach-item ${unlocked ? 'unlocked' : ''}`;
      el.innerHTML = `
        <span class="ach-icon">${ach.icon}</span>
        <div>
          <div class="ach-title">${ach.title} ${unlocked ? '✓' : '🔒'}</div>
          <div class="ach-desc">${ach.desc}</div>
        </div>
      `;
      dom.achievementsList.appendChild(el);
    });
  }

  function handleResize() {
    const canvas = dom.canvas;
    if (!canvas) return;
    dom.ctx = canvas.getContext('2d');

    const container = document.getElementById('board-container');
    const availW = container.clientWidth || 360;
    const availH = container.clientHeight || 480;

    cellW = Math.floor(availW / State.cols);
    cellH = Math.floor(availH / State.rows);
    const size = Math.min(cellW, cellH, 36);
    cellW = size;
    cellH = size;

    canvas.width = cellW * State.cols;
    canvas.height = cellH * State.rows;
  }

  let lastTime = 0;
  function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    let dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    if (dt > 0.08) dt = 0.08;

    if (window.ArcadeJuice) {
      window.ArcadeJuice.update(dt);
    }

    render(dt);
    requestAnimationFrame(gameLoop);
  }

  function init() {
    setupInputs();
    setupUI();
    resetGame();
    requestAnimationFrame(gameLoop);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
