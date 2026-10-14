/**
 * games/gotas/game.js - Gotas Arcade 90
 * Puzzle de gotas de gel 3D que caen en parejas de colores, cascadas de gravedad y gota arcoíris.
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
      { id: 1, name: 'RED',    core: '#ff2255', dark: '#99002a', light: '#ff88aa' },
      { id: 2, name: 'GREEN',  core: '#00e676', dark: '#008844', light: '#88ffcc' },
      { id: 3, name: 'BLUE',   core: '#0088ff', dark: '#0044aa', light: '#88ccff' },
      { id: 4, name: 'YELLOW', core: '#ffcc00', dark: '#aa8800', light: '#ffea88' },
      { id: 5, name: 'PURPLE', core: '#b388ff', dark: '#6633aa', light: '#e2ccff' }
    ],
    RAINBOW_ID: 99,
    STORAGE_KEY: 'gotas:v1:best_score'
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
     * Aplica gravedad a todas las columnas del tablero de forma iterativa
     * @returns {number} Cantidad de gotas que cayeron
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
     * Detecta todos los grupos conectados ortogonalmente de 4 o más gotas del mismo color
     * @returns {Array<{color: number, cells: Array<{r: number, c: number}>}>}
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
          if (color === 0 || color === CONFIG.RAINBOW_ID || visited[r][c]) continue;

          // Búsqueda en anchura (BFS)
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
     * Resuelve la acción de una gota arcoíris al aterrizar:
     * Si debajo (o adyacente) hay un color válido, elimina TODAS las gotas de ese color en el tablero.
     * @returns {number} Color eliminado, o 0 si no se activó
     */
    resolveRainbowDrop(grid, r, c) {
      const rows = grid.length;
      const cols = grid[0].length;
      let targetColor = 0;

      // Mirar celda debajo
      if (r + 1 < rows && grid[r + 1][c] !== 0 && grid[r + 1][c] !== CONFIG.RAINBOW_ID) {
        targetColor = grid[r + 1][c];
      } else {
        // Mirar adyacentes
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

      grid[r][c] = 0; // La gota arcoíris se consume

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
     * Simula cascadas sucesivas completas hasta que el tablero se estabilice al 100%
     * @returns {{chains: number, totalCleared: number}}
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
    score: 0,
    level: 1,
    bestScore: 0,
    maxCombo: 1,

    // Pareja activa que desciende
    activePair: null,
    nextPair: null,
    dropTimer: 0,
    isFastDrop: false,
    isCascading: false,
    cascadeStep: 0,
    cascadeTimer: 0,

    // Dimensiones y escalado de canvas
    cellSize: 44,
    originX: 48,
    originY: 56,
    scale: 1,

    // Partículas
    particles: []
  };

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
    comboBanner: document.getElementById('combo-banner'),
    comboText: document.getElementById('combo-text'),
    startCard: document.getElementById('start-card'),
    btnStart: document.getElementById('btn-start'),
    bestScoreVal: document.getElementById('best-score-val'),
    overlayPause: document.getElementById('overlay-pause'),
    btnPauseHeader: document.getElementById('btn-pause-header'),
    btnResume: document.getElementById('btn-resume'),
    btnRestartPause: document.getElementById('btn-restart-pause'),
    overlayGameOver: document.getElementById('overlay-gameover'),
    finalScore: document.getElementById('final-score'),
    finalMaxCombo: document.getElementById('final-max-combo'),
    bestFinalScore: document.getElementById('best-final-score'),
    btnRetry: document.getElementById('btn-retry'),
    btnSoundToggle: document.getElementById('btn-sound-toggle'),
    iconSoundOn: document.getElementById('icon-sound-on'),
    iconSoundOff: document.getElementById('icon-sound-off'),

    // Botones táctiles
    btnLeft: document.getElementById('btn-left'),
    btnRight: document.getElementById('btn-right'),
    btnRotate: document.getElementById('btn-rotate'),
    btnDrop: document.getElementById('btn-drop')
  };

  dom.ctx = dom.canvas.getContext('2d');
  dom.pCtx = dom.previewCanvas.getContext('2d');

  // ==========================================
  // AUDIO SINTETIZADO (Web Audio puro)
  // ==========================================
  function playAudio(type) {
    if (!window.ArcadeAudio) return;
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
      case 'gameover':
        window.ArcadeAudio.playExplosion ? window.ArcadeAudio.playExplosion() : window.ArcadeAudio.playTone(120, 'sawtooth', 0.3, 0.2);
        break;
      default:
        break;
    }
  }

  // ==========================================
  // RESIZE Y RESPONSIVIDAD (Full Screen Fit)
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
    // Probabilidad de gota arcoíris (4%)
    if (Math.random() < 0.04) {
      return CONFIG.RAINBOW_ID;
    }

    // 4 colores iniciales, 5 a partir de nivel 4
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

    // Comprobar game over si la entrada está bloqueada
    if (State.grid[1][2] !== 0 || State.grid[0][2] !== 0) {
      triggerGameOver();
    }
  }

  // ==========================================
  // MOVIMIENTO Y ROTACIÓN DE LA PAREJA
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
      window.ArcadeCanvas.haptic(6);
    }
  }

  function rotatePair() {
    if (!State.started || State.paused || State.gameOver || State.isCascading || !State.activePair) return;
    const p = State.activePair;
    const nextRot = (p.rot + 1) % 4;

    // Desplazamientos relativos para c2, r2 respecto a c1, r1
    // 0: arriba (0, -1), 1: der (+1, 0), 2: abajo (0, +1), 3: izq (-1, 0)
    const offsets = [
      { dc: 0, dr: -1 },
      { dc: 1, dr: 0 },
      { dc: 0, dr: 1 },
      { dc: -1, dr: 0 }
    ];

    let targetC2 = p.c1 + offsets[nextRot].dc;
    let targetR2 = p.r1 + offsets[nextRot].dr;

    // Wall kicks: patear hacia adentro si choca con pared
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
      return; // Bloqueado por el suelo u otra gota
    }

    p.rot = nextRot;
    p.c2 = targetC2;
    p.r2 = targetR2;
    playAudio('rotate');
    window.ArcadeCanvas.haptic(8);
  }

  // ==========================================
  // FIJACIÓN Y CASCADAS DE GOTAS
  // ==========================================
  function lockActivePair() {
    const p = State.activePair;
    if (p.r1 >= 0) State.grid[p.r1][p.c1] = p.color1;
    if (p.r2 >= 0) State.grid[p.r2][p.c2] = p.color2;

    playAudio('land');
    window.ArcadeCanvas.haptic(10);
    State.activePair = null;

    // Iniciar secuencia de cascadas
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
            window.ArcadeCanvas.haptic(25);
            showComboBanner('¡GOTA ARCOÍRIS!');
            State.score += 400 * State.level;
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
      }

      const multiplier = Math.pow(2, State.cascadeStep - 1);
      let dropsInStep = 0;

      for (const g of groups) {
        for (const cell of g.cells) {
          State.grid[cell.r][cell.c] = 0;
          dropsInStep++;
          spawnSplash(cell.c, cell.r, g.color);
        }
      }

      const pointsEarned = dropsInStep * 20 * multiplier * State.level;
      State.score += pointsEarned;

      playAudio(State.cascadeStep > 1 ? 'cascade' : 'pop');
      window.ArcadeCanvas.haptic(State.cascadeStep > 1 ? [20, 40] : 12);

      if (State.cascadeStep > 1) {
        showComboBanner(`¡CASCADA x${State.cascadeStep}! +${pointsEarned}`);
      }

      updateHUD();
      State.cascadeTimer = 0.24;
      return;
    }

    // Cascada finalizada
    State.isCascading = false;
    State.cascadeStep = 0;

    // Subir de nivel cada 1,500 puntos
    State.level = Math.min(10, 1 + Math.floor(State.score / 1500));
    updateHUD();

    spawnNextPair();
  }

  function showComboBanner(text) {
    dom.comboText.textContent = text;
    dom.comboBanner.classList.remove('hidden');
    setTimeout(() => {
      dom.comboBanner.classList.add('hidden');
    }, 1100);
  }

  function triggerGameOver() {
    State.gameOver = true;
    State.started = false;

    playAudio('gameover');
    window.ArcadeCanvas.haptic([60, 80, 120]);

    if (State.score > State.bestScore) {
      State.bestScore = State.score;
      try {
        window.ArcadeStorage?.setHighScore(CONFIG.STORAGE_KEY, State.bestScore);
      } catch (e) {}
    }

    dom.finalScore.textContent = State.score.toLocaleString();
    dom.finalMaxCombo.textContent = `x${State.maxCombo}`;
    dom.bestFinalScore.textContent = State.bestScore.toLocaleString();

    setTimeout(() => {
      dom.overlayGameOver.classList.remove('hidden');
    }, 500);
  }

  function updateHUD() {
    dom.hudScore.textContent = State.score.toLocaleString();
    dom.hudLevel.textContent = State.level;
  }

  // ==========================================
  // ACTUALIZACIÓN DE FÍSICA
  // ==========================================
  function update(dt) {
    if (!State.started || State.paused || State.gameOver) return;

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

  function spawnSplash(c, r, colorId) {
    const cs = State.cellSize;
    const x = State.originX + c * cs + cs / 2;
    const y = State.originY + r * cs + cs / 2;
    const cObj = CONFIG.COLORS.find(col => col.id === colorId) || CONFIG.COLORS[0];

    for (let i = 0; i < 12; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 120;
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
  }

  // ==========================================
  // RENDERIZADO VECTORIAL 3D PSEUDO-ESPACIAL
  // ==========================================
  function render() {
    const ctx = dom.ctx;
    const W = CONFIG.VIRTUAL_W;
    const H = CONFIG.VIRTUAL_H;

    ctx.save();
    ctx.resetTransform();
    const dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr * State.scale, dpr * State.scale);

    // Fondo arcade
    ctx.fillStyle = '#0a0d18';
    ctx.fillRect(0, 0, W, H);

    // Marco del tablero 3D con perspectiva
    renderBoardFrame(ctx);

    // Gotas asentadas en el tablero
    for (let r = 0; r < CONFIG.ROWS; r++) {
      for (let c = 0; c < CONFIG.COLS; c++) {
        const color = State.grid[r][c];
        if (color !== 0) {
          const x = State.originX + c * State.cellSize + State.cellSize / 2;
          const y = State.originY + r * State.cellSize + State.cellSize / 2;
          render3DGelDrop(ctx, x, y, State.cellSize * 0.42, color);
        }
      }
    }

    // Pareja activa
    if (State.activePair) {
      const p = State.activePair;
      const cs = State.cellSize;

      // Gotas activas
      const x1 = State.originX + p.c1 * cs + cs / 2;
      const y1 = State.originY + p.r1 * cs + cs / 2;
      const x2 = State.originX + p.c2 * cs + cs / 2;
      const y2 = State.originY + p.r2 * cs + cs / 2;

      // Unión elástica de gel entre ambas
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      render3DGelDrop(ctx, x1, y1, cs * 0.42, p.color1);
      render3DGelDrop(ctx, x2, y2, cs * 0.42, p.color2);
    }

    // Partículas
    renderParticles(ctx);

    ctx.restore();
  }

  function renderBoardFrame(ctx) {
    const ox = State.originX;
    const oy = State.originY;
    const bw = CONFIG.COLS * State.cellSize;
    const bh = CONFIG.ROWS * State.cellSize;

    // Fondo del pozo
    ctx.fillStyle = '#060810';
    ctx.fillRect(ox, oy, bw, bh);

    // Rejilla sutil de fondo
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

    // Marco exterior con bisel 3D
    ctx.strokeStyle = '#283454';
    ctx.lineWidth = 4;
    ctx.strokeRect(ox - 2, oy - 2, bw + 4, bh + 4);

    // Indicador de peligro en columna de entrada (columna 2)
    ctx.fillStyle = 'rgba(255, 34, 85, 0.18)';
    ctx.fillRect(ox + 2 * State.cellSize, oy, State.cellSize, State.cellSize);
  }

  /**
   * Dibuja una gota de gel 3D con iluminación especular y ojitos reactivos
   */
  function render3DGelDrop(ctx, cx, cy, r, colorId) {
    ctx.save();

    if (colorId === CONFIG.RAINBOW_ID) {
      // Gota arcoíris especial
      const rainGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      rainGrad.addColorStop(0, '#ff0055');
      rainGrad.addColorStop(0.25, '#ffaa00');
      rainGrad.addColorStop(0.5, '#00e676');
      rainGrad.addColorStop(0.75, '#0088ff');
      rainGrad.addColorStop(1, '#b388ff');

      ctx.fillStyle = rainGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Destello blanco
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - r * 0.35, cy - r * 0.35, r * 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      return;
    }

    const cObj = CONFIG.COLORS.find(col => col.id === colorId) || CONFIG.COLORS[0];

    // Sombra suave proyectada
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.7, r * 0.8, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cuerpo esférico 3D
    const grad = ctx.createRadialGradient(
      cx - r * 0.35,
      cy - r * 0.35,
      r * 0.1,
      cx,
      cy,
      r
    );
    grad.addColorStop(0, cObj.light);
    grad.addColorStop(0.4, cObj.core);
    grad.addColorStop(1, cObj.dark);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Brillo blanco especular
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.35, cy - r * 0.35, r * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // Ojitos simpáticos de gel (estética 90s)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 4, cy, 3, 0, Math.PI * 2);
    ctx.arc(cx + 4, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0a0e1c';
    ctx.beginPath();
    ctx.arc(cx - 3.5, cy, 1.5, 0, Math.PI * 2);
    ctx.arc(cx + 4.5, cy, 1.5, 0, Math.PI * 2);
    ctx.fill();

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
  // BUCLE PRINCIPAL
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
  // CONTROLES (SWIPE, TECLADO, BOTONES)
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
        // Si fue un toque rápido sin arrastre -> rotar
        if (dx < 12 && dy < 12) {
          rotatePair();
        }
      }
    }, { passive: false });

    // Botones táctiles opcionales en barra inferior
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

    dom.startCard.classList.add('hidden');
    dom.overlayPause.classList.add('hidden');
    dom.overlayGameOver.classList.add('hidden');

    updateHUD();
    spawnNextPair();
  }

  function setupUI() {
    dom.btnStart.addEventListener('click', startGame);
    dom.btnRetry.addEventListener('click', startGame);
    dom.btnRestartPause.addEventListener('click', startGame);
    dom.btnPauseHeader.addEventListener('click', togglePause);
    dom.btnResume.addEventListener('click', togglePause);

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

  function init() {
    handleResize();
    setupInputs();
    setupUI();

    try {
      State.bestScore = window.ArcadeStorage?.getHighScore(CONFIG.STORAGE_KEY) || 0;
      dom.bestScoreVal.textContent = State.bestScore.toLocaleString();
    } catch (e) {}

    requestAnimationFrame(gameLoop);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
