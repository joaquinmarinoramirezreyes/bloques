/**
 * games/campominado/game.js - Campo Minado Arcade 90
 * Despeje táctico de casillas con relieve 3D, primer toque seguro y flood-fill iterativo sin recursión.
 */
(() => {
  'use strict';

  // ==========================================
  // CONFIGURACIÓN Y CONSTANTES DE BALANCE
  // ==========================================
  const CONFIG = {
    SIZES: {
      EASY:   { cols: 9,  rows: 9,  mines: 10, key: 'campominado:v1:9x9' },
      MEDIUM: { cols: 12, rows: 16, mines: 30, key: 'campominado:v1:12x16' },
      HARD:   { cols: 16, rows: 24, mines: 70, key: 'campominado:v1:16x24' }
    },
    LONG_PRESS_MS: 280, // tiempo de pulsación para colocar bandera
    COLORS: {
      1: '#00e5ff', // Cyan
      2: '#00e676', // Verde brillante
      3: '#ff3344', // Coral / Rojo
      4: '#b388ff', // Púrpura neón
      5: '#ff9100', // Naranja eléctrico
      6: '#ff007f', // Rosa neón
      7: '#ffea00', // Amarillo sol
      8: '#ffffff'  // Blanco puro
    }
  };

  // ==========================================
  // LÓGICA PURA Y ALGORITMOS (Testeable en Node)
  // ==========================================
  const MineSweeperLogic = {
    /**
     * Crea un tablero vacío con casillas no reveladas
     */
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
            exploded: false
          };
        }
      }
      return grid;
    },

    /**
     * Coloca minas aleatoriamente garantizando que la casilla de primer toque (safeCol, safeRow)
     * y su vecindad inmediata queden completamente libres de minas siempre que sea posible.
     */
    populateMines(grid, cols, rows, totalMines, safeCol, safeRow) {
      const totalCells = cols * rows;
      const safePositions = new Set();

      // Proteger la casilla inicial y sus 8 vecinos
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = safeRow + dr;
          const nc = safeCol + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            safePositions.add(nr * cols + nc);
          }
        }
      }

      // Si las minas superan las casillas restantes, relajar la protección solo a la celda exacta
      if (totalCells - safePositions.size < totalMines) {
        safePositions.clear();
        safePositions.add(safeRow * cols + safeCol);
      }

      // Candidatos disponibles
      const candidates = [];
      for (let i = 0; i < totalCells; i++) {
        if (!safePositions.has(i)) {
          candidates.push(i);
        }
      }

      // Barajar aleatoriamente usando Fisher-Yates
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = candidates[i];
        candidates[i] = candidates[j];
        candidates[j] = temp;
      }

      // Colocar las minas requeridas
      const placedCount = Math.min(totalMines, candidates.length);
      for (let i = 0; i < placedCount; i++) {
        const pos = candidates[i];
        const r = Math.floor(pos / cols);
        const c = pos % cols;
        grid[r][c].isMine = true;
      }

      // Calcular conteos de vecinos
      this.calculateNeighborCounts(grid, cols, rows);
    },

    /**
     * Calcula el conteo de minas adyacentes para cada celda
     */
    calculateNeighborCounts(grid, cols, rows) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c].isMine) {
            grid[r][c].neighborMines = 0;
            continue;
          }

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

    /**
     * Despeje en cadena ITERATIVO (Queue-based Flood Fill) - CERO RECURSIÓN
     * Revela celdas vacías y sus bordes numéricos adyacentes de forma segura.
     * @returns {Array<{r: number, c: number}>} Lista de celdas recién reveladas
     */
    iterativeFloodFill(grid, cols, rows, startCol, startRow) {
      const revealedCells = [];
      const queue = [startRow * cols + startCol];
      const visited = new Uint8Array(rows * cols);

      visited[startRow * cols + startCol] = 1;

      let head = 0;
      while (head < queue.length) {
        const pos = queue[head++];
        const r = Math.floor(pos / cols);
        const c = pos % cols;
        const cell = grid[r][c];

        if (cell.flagged) continue;

        if (!cell.revealed) {
          cell.revealed = true;
          revealedCells.push({ r, c });
        }

        // Si la casilla tiene 0 minas vecinas, propagar a los 8 vecinos
        if (cell.neighborMines === 0 && !cell.isMine) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr;
              const nc = c + dc;

              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                const nPos = nr * cols + nc;
                if (!visited[nPos]) {
                  visited[nPos] = 1;
                  const neighbor = grid[nr][nc];
                  if (!neighbor.revealed && !neighbor.flagged && !neighbor.isMine) {
                    queue.push(nPos);
                  }
                }
              }
            }
          }
        }
      }

      return revealedCells;
    },

    /**
     * Verifica si se han revelado todas las casillas que no son minas
     */
    checkWinCondition(grid, cols, rows, totalMines) {
      let unrevealedSafeCells = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = grid[r][c];
          if (!cell.isMine && !cell.revealed) {
            unrevealedSafeCells++;
          }
        }
      }
      return unrevealedSafeCells === 0;
    }
  };

  // Exportar para pruebas en Node
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, MineSweeperLogic };
    return;
  }

  // ==========================================
  // ESTADO DEL JUEGO
  // ==========================================
  const State = {
    sizeKey: 'EASY',
    cols: 9,
    rows: 9,
    totalMines: 10,
    grid: [],
    started: false,
    firstClickDone: false,
    gameOver: false,
    victory: false,
    timer: 0,
    timerInterval: null,
    flagMode: false, // modo móvil: true = poner bandera, false = revelar
    flagsPlaced: 0,
    bestTime: null,

    // Dimensiones en Canvas
    cellSize: 36,
    boardW: 324,
    boardH: 324,
    originX: 0,
    originY: 0,

    // Partículas de explosión
    explosionParticles: []
  };

  // ==========================================
  // REFERENCIAS DOM
  // ==========================================
  const dom = {
    canvas: document.getElementById('mine-canvas'),
    ctx: null,
    boardContainer: document.getElementById('board-container'),
    btnSoundToggle: document.getElementById('btn-sound-toggle'),
    iconSoundOn: document.getElementById('icon-sound-on'),
    iconSoundOff: document.getElementById('icon-sound-off'),
    btnRestartHeader: document.getElementById('btn-restart-header'),
    btnFace: document.getElementById('btn-face'),
    faceIcon: document.getElementById('face-icon'),
    mineCounter: document.getElementById('mine-counter'),
    timeCounter: document.getElementById('time-counter'),
    sizeButtons: document.querySelectorAll('.btn-size'),
    btnModeToggle: document.getElementById('btn-mode-toggle'),
    modeText: document.getElementById('mode-text'),
    bestTimeVal: document.getElementById('best-time-val'),
    overlayResult: document.getElementById('overlay-result'),
    resultTitle: document.getElementById('result-title'),
    resultSub: document.getElementById('result-sub'),
    statFinalTime: document.getElementById('stat-final-time'),
    statBestTime: document.getElementById('stat-best-time'),
    btnPlayAgain: document.getElementById('btn-play-again')
  };

  dom.ctx = dom.canvas.getContext('2d');

  // ==========================================
  // AUDIO SINTETIZADO CON WEBAUDIO
  // ==========================================
  function playAudio(type) {
    if (!window.ArcadeAudio) return;
    switch (type) {
      case 'click':
        window.ArcadeAudio.playTone(600, 'sine', 0.03, 0.08);
        break;
      case 'reveal':
        window.ArcadeAudio.playTone(420, 'triangle', 0.05, 0.1);
        break;
      case 'flag':
        window.ArcadeAudio.playTone(850, 'square', 0.06, 0.12);
        break;
      case 'unflag':
        window.ArcadeAudio.playTone(320, 'square', 0.05, 0.09);
        break;
      case 'explode':
        window.ArcadeAudio.playExplosion ? window.ArcadeAudio.playExplosion() : window.ArcadeAudio.playTone(80, 'sawtooth', 0.35, 0.25);
        break;
      case 'win':
        [440, 554, 659, 880].forEach((f, i) => {
          setTimeout(() => window.ArcadeAudio?.playTone(f, 'square', 0.12, 0.16), i * 120);
        });
        break;
      default:
        break;
    }
  }

  // ==========================================
  // INICIALIZACIÓN DE PARTIDA Y TABLERO
  // ==========================================
  function initGame(sizeKey = State.sizeKey) {
    State.sizeKey = sizeKey;
    const cfg = CONFIG.SIZES[sizeKey];
    State.cols = cfg.cols;
    State.rows = cfg.rows;
    State.totalMines = cfg.mines;

    State.grid = MineSweeperLogic.createEmptyGrid(State.cols, State.rows);
    State.firstClickDone = false;
    State.gameOver = false;
    State.victory = false;
    State.flagsPlaced = 0;
    State.explosionParticles = [];

    // Detener cronómetro
    if (State.timerInterval) {
      clearInterval(State.timerInterval);
      State.timerInterval = null;
    }
    State.timer = 0;

    dom.faceIcon.textContent = '😎';
    dom.overlayResult.classList.add('hidden');
    updateCounters();
    loadBestRecord();
    resizeCanvas();
    render();
  }

  function startTimer() {
    if (State.timerInterval) return;
    State.timerInterval = setInterval(() => {
      State.timer++;
      if (State.timer > 999) State.timer = 999;
      updateCounters();
    }, 1000);
  }

  function updateCounters() {
    const remainingMines = Math.max(0, State.totalMines - State.flagsPlaced);
    dom.mineCounter.textContent = String(remainingMines).padStart(3, '0');
    dom.timeCounter.textContent = String(State.timer).padStart(3, '0');
  }

  function loadBestRecord() {
    const cfg = CONFIG.SIZES[State.sizeKey];
    let rec = 0;
    try {
      rec = window.ArcadeStorage?.getHighScore(cfg.key) || 0;
    } catch (e) {}

    State.bestTime = rec > 0 ? rec : null;
    dom.bestTimeVal.textContent = State.bestTime ? `${State.bestTime}` : '--';
  }

  // ==========================================
  // INTERACCIÓN DE USUARIO (CLICK / TOUCH)
  // ==========================================
  function handleCellAction(c, r, isFlagAction) {
    if (State.gameOver || State.victory) return;
    if (c < 0 || c >= State.cols || r < 0 || r >= State.rows) return;

    window.ArcadeAudio?.initCtx();
    const cell = State.grid[r][c];

    // Acción de colocar/quitar bandera
    if (isFlagAction) {
      if (cell.revealed) return;
      cell.flagged = !cell.flagged;
      State.flagsPlaced += cell.flagged ? 1 : -1;
      playAudio(cell.flagged ? 'flag' : 'unflag');
      window.ArcadeCanvas.haptic(14);
      updateCounters();
      render();
      return;
    }

    // Acción de revelar
    if (cell.flagged || cell.revealed) return;

    // Primer toque: Garantizar generación segura
    if (!State.firstClickDone) {
      State.firstClickDone = true;
      MineSweeperLogic.populateMines(
        State.grid,
        State.cols,
        State.rows,
        State.totalMines,
        c,
        r
      );
      startTimer();
    }

    // Si toca una mina -> GAME OVER
    if (cell.isMine) {
      triggerDefeat(c, r);
      return;
    }

    // Si toca casilla con número o vacía -> Despeje iterativo
    playAudio('reveal');
    window.ArcadeCanvas.haptic(8);
    MineSweeperLogic.iterativeFloodFill(State.grid, State.cols, State.rows, c, r);

    // Verificar condición de victoria
    if (MineSweeperLogic.checkWinCondition(State.grid, State.cols, State.rows, State.totalMines)) {
      triggerVictory();
    }

    render();
  }

  function triggerDefeat(hitC, hitR) {
    State.gameOver = true;
    if (State.timerInterval) clearInterval(State.timerInterval);

    dom.faceIcon.textContent = '😵';
    playAudio('explode');
    window.ArcadeCanvas.haptic([80, 100, 150]);

    // Marcar la mina detonada
    State.grid[hitR][hitC].exploded = true;

    // Revelar todas las minas
    for (let r = 0; r < State.rows; r++) {
      for (let c = 0; c < State.cols; c++) {
        const item = State.grid[r][c];
        if (item.isMine) {
          item.revealed = true;
        }
      }
    }

    // Partículas de explosión en la mina
    createExplosion(hitC, hitR);

    render();

    setTimeout(() => {
      dom.resultTitle.textContent = '¡EXPLOSIÓN!';
      dom.resultTitle.style.color = '#ff3344';
      dom.resultSub.textContent = 'Has tocado una carga minada activa';
      dom.statFinalTime.textContent = `${State.timer}s`;
      dom.statBestTime.textContent = State.bestTime ? `${State.bestTime}s` : '--';
      dom.overlayResult.classList.remove('hidden');
    }, 700);
  }

  function triggerVictory() {
    State.victory = true;
    if (State.timerInterval) clearInterval(State.timerInterval);

    dom.faceIcon.textContent = '🥳';
    playAudio('win');
    window.ArcadeCanvas.haptic([30, 40, 60, 80]);

    // Colocar banderas en todas las minas automáticamente
    for (let r = 0; r < State.rows; r++) {
      for (let c = 0; c < State.cols; c++) {
        if (State.grid[r][c].isMine) {
          State.grid[r][c].flagged = true;
        }
      }
    }
    State.flagsPlaced = State.totalMines;
    updateCounters();

    // Guardar récord si es menor o primer récord
    const cfg = CONFIG.SIZES[State.sizeKey];
    let isNewRecord = false;
    if (!State.bestTime || State.timer < State.bestTime) {
      State.bestTime = State.timer;
      isNewRecord = true;
      try {
        window.ArcadeStorage?.setHighScore(cfg.key, State.timer);
      } catch (e) {}
    }

    dom.bestTimeVal.textContent = `${State.bestTime}s`;

    render();

    setTimeout(() => {
      dom.resultTitle.textContent = isNewRecord ? '¡NUEVO RÉCORD!' : '¡SECTOR LIMPIO!';
      dom.resultTitle.style.color = '#ffcc00';
      dom.resultSub.textContent = `Despejaste el campo ${cfg.cols}x${cfg.rows} con éxito`;
      dom.statFinalTime.textContent = `${State.timer}s`;
      dom.statBestTime.textContent = `${State.bestTime}s`;
      dom.overlayResult.classList.remove('hidden');
    }, 600);
  }

  function createExplosion(c, r) {
    const x = State.originX + c * State.cellSize + State.cellSize / 2;
    const y = State.originY + r * State.cellSize + State.cellSize / 2;
    for (let i = 0; i < 40; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 180;
      State.explosionParticles.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.8,
        color: ['#ff3344', '#ffaa00', '#ffff00', '#ffffff'][Math.floor(Math.random() * 4)]
      });
    }
  }

  // ==========================================
  // RENDERIZADO VECTORIAL 3D CON RELIEVE ISOMÉTRICO
  // ==========================================
  function render() {
    const ctx = dom.ctx;
    const canvas = dom.canvas;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo de la placa del circuito
    ctx.fillStyle = '#101322';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cs = State.cellSize;
    const ox = State.originX;
    const oy = State.originY;

    // Marco 3D del tablero
    renderBoardFrame(ctx, ox - 4, oy - 4, State.cols * cs + 8, State.rows * cs + 8);

    // Dibujar casillas
    for (let r = 0; r < State.rows; r++) {
      for (let c = 0; c < State.cols; c++) {
        const x = ox + c * cs;
        const y = oy + r * cs;
        const cell = State.grid[r][c];

        if (!cell.revealed) {
          // Casilla 3D en Relieve (Elevada)
          renderRaisedTile(ctx, x, y, cs - 1);

          if (cell.flagged) {
            // Baliza / Bandera 3D
            render3DFlag(ctx, x + cs / 2, y + cs / 2, cs * 0.38);
          }
        } else {
          // Casilla Deprimida (Revelada)
          renderDepressedTile(ctx, x, y, cs - 1);

          if (cell.isMine) {
            // Mina 3D cuántica con pinchos
            render3DMine(ctx, x + cs / 2, y + cs / 2, cs * 0.36, cell.exploded);
          } else if (cell.neighborMines > 0) {
            // Número 3D estilizado
            render3DNumber(ctx, x + cs / 2, y + cs / 2, cell.neighborMines, cs);
          }
        }
      }
    }

    // Partículas de explosión activas
    if (State.explosionParticles.length > 0) {
      renderExplosionParticles(ctx);
    }
  }

  /**
   * Marco 3D biselado alrededor del tablero
   */
  function renderBoardFrame(ctx, x, y, w, h) {
    ctx.save();
    // Borde bisel oscuro
    ctx.strokeStyle = '#0a0c16';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);

    // Resplandor tenue
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
    ctx.restore();
  }

  /**
   * Casilla 3D con relieve biselado y luz especular superior
   */
  function renderRaisedTile(ctx, x, y, s) {
    ctx.save();

    // Relleno principal
    ctx.fillStyle = '#2c3352';
    ctx.fillRect(x, y, s, s);

    // Bisel de luz superior e izquierdo
    ctx.fillStyle = '#4c5784';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + s, y);
    ctx.lineTo(x + s - 3, y + 3);
    ctx.lineTo(x + 3, y + 3);
    ctx.lineTo(x + 3, y + s - 3);
    ctx.lineTo(x, y + s);
    ctx.closePath();
    ctx.fill();

    // Bisel de sombra inferior y derecho
    ctx.fillStyle = '#141829';
    ctx.beginPath();
    ctx.moveTo(x + s, y);
    ctx.lineTo(x + s, y + s);
    ctx.lineTo(x, y + s);
    ctx.lineTo(x + 3, y + s - 3);
    ctx.lineTo(x + s - 3, y + s - 3);
    ctx.lineTo(x + s - 3, y + 3);
    ctx.closePath();
    ctx.fill();

    // Línea de brillo sutil en el borde superior
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(x + 3, y + 3, s - 6, 1);

    ctx.restore();
  }

  /**
   * Casilla deprimida (suelo cavado)
   */
  function renderDepressedTile(ctx, x, y, s) {
    ctx.save();

    // Fondo plano oscuro
    ctx.fillStyle = '#171a2c';
    ctx.fillRect(x, y, s, s);

    // Ranura de sombra interior superior e izquierda
    ctx.fillStyle = '#0d0f1b';
    ctx.fillRect(x, y, s, 2);
    ctx.fillRect(x, y, 2, s);

    // Toque tenue en borde derecho e inferior
    ctx.fillStyle = '#262c46';
    ctx.fillRect(x + s - 1, y, 1, s);
    ctx.fillRect(x, y + s - 1, s, 1);

    ctx.restore();
  }

  /**
   * Mina 3D: esfera metálica oscura con púas y núcleo brillante
   */
  function render3DMine(ctx, cx, cy, r, exploded) {
    ctx.save();

    if (exploded) {
      // Destello rojo intenso
      ctx.fillStyle = 'rgba(255, 51, 68, 0.4)';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Púas diagonales y ortogonales
    ctx.strokeStyle = exploded ? '#ff3344' : '#444d6e';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(ang) * (r + 3), cy - Math.sin(ang) * (r + 3));
      ctx.lineTo(cx + Math.cos(ang) * (r + 3), cy + Math.sin(ang) * (r + 3));
      ctx.stroke();
    }

    // Cuerpo esférico 3D con luz en la parte superior izquierda
    const grad = ctx.createRadialGradient(
      cx - r * 0.35,
      cy - r * 0.35,
      r * 0.1,
      cx,
      cy,
      r
    );

    if (exploded) {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#ffcc00');
      grad.addColorStop(0.7, '#ff0033');
      grad.addColorStop(1, '#880011');
    } else {
      grad.addColorStop(0, '#7584b4');
      grad.addColorStop(0.35, '#353b54');
      grad.addColorStop(0.85, '#161926');
      grad.addColorStop(1, '#080a12');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Núcleo luminoso central
    ctx.fillStyle = exploded ? '#ffffff' : '#ff0055';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // Brillo blanco especular
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.35, cy - r * 0.35, r * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Baliza / Bandera 3D con pedestal y prisma neón
   */
  function render3DFlag(ctx, cx, cy, size) {
    ctx.save();

    // Pedestal metálico
    ctx.fillStyle = '#1c2236';
    ctx.beginPath();
    ctx.ellipse(cx, cy + size * 0.7, size * 0.8, size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mástil
    ctx.strokeStyle = '#e0e8f8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy + size * 0.6);
    ctx.lineTo(cx - 2, cy - size * 0.7);
    ctx.stroke();

    // Banderín holográfico triangular con gradiente neón
    const flagGrad = ctx.createLinearGradient(cx - 2, cy - size * 0.7, cx + size * 0.9, cy - size * 0.2);
    flagGrad.addColorStop(0, '#ff0055');
    flagGrad.addColorStop(0.6, '#ff3366');
    flagGrad.addColorStop(1, '#ffcc00');

    ctx.fillStyle = flagGrad;
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(cx - 1, cy - size * 0.7);
    ctx.lineTo(cx + size * 0.9, cy - size * 0.25);
    ctx.lineTo(cx - 1, cy + size * 0.15);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /**
   * Números 3D estilizados con sombras y colores saturados de los 90
   */
  function render3DNumber(ctx, cx, cy, num, cs) {
    const color = CONFIG.COLORS[num] || '#ffffff';
    const fontSize = Math.floor(cs * 0.65);

    ctx.save();
    ctx.font = `900 ${fontSize}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Sombra proyectada
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillText(String(num), cx + 1.5, cy + 1.5);

    // Texto con color brillante
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;
    ctx.fillText(String(num), cx, cy);

    ctx.restore();
  }

  function renderExplosionParticles(ctx) {
    ctx.save();
    for (let i = State.explosionParticles.length - 1; i >= 0; i--) {
      const p = State.explosionParticles[i];
      p.x += p.vx * 0.016;
      p.y += p.vy * 0.016;
      p.life -= 0.016;

      if (p.life <= 0) {
        State.explosionParticles.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    if (State.explosionParticles.length > 0) {
      requestAnimationFrame(render);
    }
  }

  // ==========================================
  // RESIZE Y RESPONSIVIDAD
  // ==========================================
  function resizeCanvas() {
    const container = dom.boardContainer;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const pad = 12;
    const availW = Math.max(100, rect.width - pad);
    const availH = Math.max(100, rect.height - pad);

    // Calcular tamaño óptimo de celda para que quepa exactamente
    const maxCellW = Math.floor(availW / State.cols);
    const maxCellH = Math.floor(availH / State.rows);
    State.cellSize = Math.max(18, Math.min(maxCellW, maxCellH, 44));

    State.boardW = State.cols * State.cellSize;
    State.boardH = State.rows * State.cellSize;

    const dpr = window.devicePixelRatio || 1;
    dom.canvas.style.width = `${State.boardW}px`;
    dom.canvas.style.height = `${State.boardH}px`;
    dom.canvas.width = Math.round(State.boardW * dpr);
    dom.canvas.height = Math.round(State.boardH * dpr);

    dom.ctx.resetTransform();
    dom.ctx.scale(dpr, dpr);

    State.originX = 0;
    State.originY = 0;
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
    render();
  });

  // ==========================================
  // EVENTOS DE ENTRADA (TOUCH, CLICK, LONG PRESS)
  // ==========================================
  function setupInputs() {
    const canvas = dom.canvas;
    let touchTimer = null;
    let longPressed = false;
    let touchStartX = 0;
    let touchStartY = 0;

    function getGridCoords(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left - State.originX;
      const y = clientY - rect.top - State.originY;
      const c = Math.floor(x / State.cellSize);
      const r = Math.floor(y / State.cellSize);
      return { c, r };
    }

    // Touch events
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) return;
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      longPressed = false;

      dom.faceIcon.textContent = '😮';

      touchTimer = setTimeout(() => {
        longPressed = true;
        const coords = getGridCoords(t.clientX, t.clientY);
        handleCellAction(coords.c, coords.r, true); // colocar bandera por pulsación larga
      }, CONFIG.LONG_PRESS_MS);
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      const dist = Math.hypot(t.clientX - touchStartX, t.clientY - touchStartY);
      if (dist > 10) {
        clearTimeout(touchTimer);
      }
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
      clearTimeout(touchTimer);
      if (!State.gameOver && !State.victory) dom.faceIcon.textContent = '😎';

      if (!longPressed && e.changedTouches.length > 0) {
        const t = e.changedTouches[0];
        const dist = Math.hypot(t.clientX - touchStartX, t.clientY - touchStartY);
        if (dist <= 10) {
          const coords = getGridCoords(t.clientX, t.clientY);
          // Si el modo bandera está activo en la barra inferior, se comporta como bandera
          handleCellAction(coords.c, coords.r, State.flagMode);
        }
      }
    }, { passive: true });

    canvas.addEventListener('touchcancel', () => {
      clearTimeout(touchTimer);
      if (!State.gameOver && !State.victory) dom.faceIcon.textContent = '😎';
    });

    // Ratón para PC / laptop
    canvas.addEventListener('mousedown', (e) => {
      if (!State.gameOver && !State.victory) dom.faceIcon.textContent = '😮';
      const coords = getGridCoords(e.clientX, e.clientY);

      // Clic derecho coloca bandera
      if (e.button === 2) {
        handleCellAction(coords.c, coords.r, true);
      } else if (e.button === 0) {
        handleCellAction(coords.c, coords.r, State.flagMode);
      }
    });

    canvas.addEventListener('mouseup', () => {
      if (!State.gameOver && !State.victory) dom.faceIcon.textContent = '😎';
    });

    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // Tecla R para reiniciar
    window.addEventListener('keydown', (e) => {
      if (e.key === 'r' || e.key === 'R') {
        initGame();
      }
    });
  }

  // ==========================================
  // SETUP DE UI Y BOTONES
  // ==========================================
  function setupUI() {
    // Selección de tamaños
    dom.sizeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        dom.sizeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const sz = btn.getAttribute('data-size');
        initGame(sz);
      });
    });

    // Alternar modo de toque (Revelar vs Bandera)
    dom.btnModeToggle.addEventListener('click', () => {
      State.flagMode = !State.flagMode;
      dom.btnModeToggle.classList.toggle('flag-active', State.flagMode);
      if (State.flagMode) {
        dom.modeText.textContent = 'MODO: BANDERA';
        dom.btnModeToggle.querySelector('.toggle-icon').textContent = '🚩';
      } else {
        dom.modeText.textContent = 'MODO: REVELAR';
        dom.btnModeToggle.querySelector('.toggle-icon').textContent = '⛏️';
      }
      playAudio('click');
      window.ArcadeCanvas.haptic(10);
    });

    // Carita de reset
    dom.btnFace.addEventListener('click', () => {
      playAudio('click');
      initGame();
    });

    // Botones de reinicio
    dom.btnRestartHeader.addEventListener('click', () => {
      playAudio('click');
      initGame();
    });

    dom.btnPlayAgain.addEventListener('click', () => {
      playAudio('click');
      initGame();
    });

    // Silencio / Sonido
    dom.btnSoundToggle.addEventListener('click', () => {
      if (window.ArcadeAudio) {
        const muted = window.ArcadeAudio.toggleMute();
        dom.iconSoundOn.classList.toggle('hidden', muted);
        dom.iconSoundOff.classList.toggle('hidden', !muted);
      }
    });

    if (window.ArcadeAudio && window.ArcadeAudio.isMuted) {
      dom.iconSoundOn.classList.add('hidden');
      dom.iconSoundOff.classList.remove('hidden');
    }
  }

  // ==========================================
  // INICIALIZACIÓN GENERAL
  // ==========================================
  function init() {
    setupInputs();
    setupUI();
    initGame('EASY');
  }

  window.addEventListener('DOMContentLoaded', init);
})();
