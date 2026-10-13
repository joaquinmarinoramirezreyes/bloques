/**
 * BLOQUES - Juego de puzzle clásico de bloques que caen
 * Arquitectura modular en Vanilla JavaScript (ES6+)
 * Sin librerías ni dependencias externas. 100% offline.
 */

(() => {
  'use strict';

  // ==========================================================================
  // 1. CONFIGURACIÓN Y CONSTANTES DEL JUEGO
  // ==========================================================================
  const COLS = 10;
  const ROWS = 20;

  // Clave segura para persistencia local del récord
  const STORAGE_KEY = 'bloques_arcade_highscore';

  // Paleta propia retro-arcade (sin marcas comerciales ni logos)
  const PIECES = {
    I: {
      name: 'I',
      color: '#00f0ff', // Cyan neón
      glow: 'rgba(0, 240, 255, 0.4)',
      matrix: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ]
    },
    O: {
      name: 'O',
      color: '#ffd000', // Ámbar solar
      glow: 'rgba(255, 208, 0, 0.4)',
      matrix: [
        [1, 1],
        [1, 1]
      ]
    },
    T: {
      name: 'T',
      color: '#b026ff', // Púrpura eléctrico
      glow: 'rgba(176, 38, 255, 0.4)',
      matrix: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
      ]
    },
    S: {
      name: 'S',
      color: '#00e676', // Verde esmeralda
      glow: 'rgba(0, 230, 118, 0.4)',
      matrix: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
      ]
    },
    Z: {
      name: 'Z',
      color: '#ff3366', // Coral carmesí
      glow: 'rgba(255, 51, 102, 0.4)',
      matrix: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
      ]
    },
    J: {
      name: 'J',
      color: '#2979ff', // Azul zafiro
      glow: 'rgba(41, 121, 255, 0.4)',
      matrix: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
      ]
    },
    L: {
      name: 'L',
      color: '#ff9100', // Naranja fuego
      glow: 'rgba(255, 145, 0, 0.4)',
      matrix: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
      ]
    }
  };

  const PIECE_KEYS = Object.keys(PIECES);

  // Tabla de puntuación clásica escalada por nivel
  const POINTS_TABLE = [0, 100, 300, 500, 800]; // 0, 1, 2, 3, 4 líneas
  const BANNER_TEXTS = ['', '¡LÍNEA!', '¡DOBLE!', '¡TRIPLE!', '¡TETRA!'];

  // Estados del juego
  const GameState = {
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    CLEARING: 'CLEARING',
    GAMEOVER: 'GAMEOVER'
  };

  // ==========================================================================
  // 2. UTILIDADES DE PERSISTENCIA Y VIBRACIÓN HÁPTICA
  // ==========================================================================
  const Storage = {
    getHighScore() {
      try {
        const val = localStorage.getItem(STORAGE_KEY);
        return val ? parseInt(val, 10) || 0 : 0;
      } catch (err) {
        console.warn('Almacenamiento local no disponible:', err);
        return 0;
      }
    },
    setHighScore(score) {
      try {
        localStorage.setItem(STORAGE_KEY, String(score));
      } catch (err) {
        console.warn('No se pudo guardar el récord en localStorage:', err);
      }
    }
  };

  function triggerHaptic(duration = 12) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch (e) {
        // Silencioso si no está permitido
      }
    }
  }

  // ==========================================================================
  // 3. GENERADOR DE BOLSA ALEATORIA DE 7 PIEZAS (7-BAG RANDOMIZER)
  // ==========================================================================
  class PieceBag {
    constructor() {
      this.bag = [];
    }

    refill() {
      // Barajado Fisher-Yates sobre las 7 piezas
      const items = [...PIECE_KEYS];
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }
      this.bag = items;
    }

    getNextKey() {
      if (this.bag.length === 0) {
        this.refill();
      }
      return this.bag.pop();
    }

    peekNextKey() {
      if (this.bag.length === 0) {
        this.refill();
      }
      return this.bag[this.bag.length - 1];
    }
  }

  // ==========================================================================
  // 4. LÓGICA DE MATRICES, ROTACIONES Y WALL KICKS
  // ==========================================================================
  function rotateMatrixClockwise(matrix) {
    const size = matrix.length;
    const result = Array.from({ length: size }, () => new Array(size).fill(0));
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        result[c][size - 1 - r] = matrix[r][c];
      }
    }
    return result;
  }

  function rotateMatrixCounterClockwise(matrix) {
    const size = matrix.length;
    const result = Array.from({ length: size }, () => new Array(size).fill(0));
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        result[size - 1 - c][r] = matrix[r][c];
      }
    }
    return result;
  }

  // Desplazamientos candidatos al rotar (Wall Kicks)
  // Permite girar la pieza sin atascarse cuando está pegada a la pared izquierda, derecha o fondo
  const ROTATION_KICKS = [
    [0, 0],   // Posición normal
    [-1, 0],  // Empujar 1 a la izquierda
    [1, 0],   // Empujar 1 a la derecha
    [0, -1],  // Empujar 1 hacia arriba (cerca del piso)
    [-2, 0],  // Empujar 2 a la izquierda (barra 'I' contra pared derecha)
    [2, 0],   // Empujar 2 a la derecha (barra 'I' contra pared izquierda)
    [0, -2],  // Empujar 2 hacia arriba (barra 'I' contra el fondo)
    [-1, -1], // Diagonal arriba-izquierda
    [1, -1],  // Diagonal arriba-derecha
    [-1, -2], // Diagonal arriba 2 - izquierda
    [1, -2]   // Diagonal arriba 2 - derecha
  ];

  // ==========================================================================
  // 5. CLASE DE PIEZA ACTIVA
  // ==========================================================================
  class Piece {
    constructor(key) {
      const def = PIECES[key];
      this.key = key;
      this.color = def.color;
      this.glow = def.glow;
      // Clonar matriz
      this.matrix = def.matrix.map(row => [...row]);
      
      // Centrar pieza horizontalmente en el tablero
      this.x = Math.floor((COLS - this.matrix[0].length) / 2);
      // Iniciar en la parte superior (puede empezar ligeramente oculta)
      this.y = key === 'I' ? -1 : 0;
    }
  }

  // ==========================================================================
  // 6. TABLERO DE JUEGO (LÓGICA, COLISIONES Y LÍNEAS)
  // ==========================================================================
  class Board {
    constructor() {
      this.grid = this.createEmptyGrid();
    }

    createEmptyGrid() {
      return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
    }

    reset() {
      this.grid = this.createEmptyGrid();
    }

    // Verifica si una matriz en posición (x, y) es válida sin colisiones
    isValid(matrix, posX, posY) {
      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c] !== 0) {
            const boardX = posX + c;
            const boardY = posY + r;

            // Fuera de los límites laterales
            if (boardX < 0 || boardX >= COLS) {
              return false;
            }
            // Por debajo del piso
            if (boardY >= ROWS) {
              return false;
            }
            // Bloque ya ocupado en el tablero
            if (boardY >= 0 && this.grid[boardY][boardX] !== 0) {
              return false;
            }
          }
        }
      }
      return true;
    }

    // Fija la pieza al tablero
    lockPiece(piece) {
      for (let r = 0; r < piece.matrix.length; r++) {
        for (let c = 0; c < piece.matrix[r].length; c++) {
          if (piece.matrix[r][c] !== 0) {
            const boardY = piece.y + r;
            const boardX = piece.x + c;
            if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
              this.grid[boardY][boardX] = piece.color;
            }
          }
        }
      }
    }

    // Identifica qué filas están totalmente llenas
    getFullLines() {
      const fullRows = [];
      for (let r = 0; r < ROWS; r++) {
        if (this.grid[r].every(cell => cell !== 0)) {
          fullRows.push(r);
        }
      }
      return fullRows;
    }

    // Elimina las filas completas y desplaza las superiores hacia abajo de forma segura
    removeLines(rowsToRemove) {
      const remainingRows = this.grid.filter((_, idx) => !rowsToRemove.includes(idx));
      const newEmptyRows = Array.from(
        { length: rowsToRemove.length },
        () => new Array(COLS).fill(0)
      );
      this.grid = [...newEmptyRows, ...remainingRows];
    }
  }

  // ==========================================================================
  // 7. RENDERIZADOR (CANVAS CON SOPORTE HIGH-DPI / RETINA)
  // ==========================================================================
  class Renderer {
    constructor(boardCanvas, nextCanvas) {
      this.boardCanvas = boardCanvas;
      this.boardCtx = boardCanvas.getContext('2d');
      this.nextCanvas = nextCanvas;
      this.nextCtx = nextCanvas.getContext('2d');

      this.cellSize = 0;
      this.nextCellSize = 0;
      this.dpr = window.devicePixelRatio || 1;

      this.resize();
    }

    // Escala los lienzos según el devicePixelRatio real y ajusta dimensiones exactas
    resize() {
      this.dpr = window.devicePixelRatio || 1;

      // 1. Tablero principal: dimensionado dinámico respecto al contenedor padre
      const wrapper = this.boardCanvas.parentElement;
      const wRect = wrapper ? wrapper.getBoundingClientRect() : { width: 300, height: 600 };
      const availWidth = Math.max(60, wRect.width - 4);
      const availHeight = Math.max(120, wRect.height - 4);

      // Proporción fija 10:20 (1:2) que cabe estrictamente dentro del contenedor disponible
      let bWidth = availWidth;
      let bHeight = bWidth * 2;

      if (bHeight > availHeight) {
        bHeight = availHeight;
        bWidth = bHeight * 0.5;
      }

      bWidth = Math.floor(bWidth);
      bHeight = Math.floor(bHeight);

      this.boardCanvas.style.width = `${bWidth}px`;
      this.boardCanvas.style.height = `${bHeight}px`;

      this.boardCanvas.width = Math.round(bWidth * this.dpr);
      this.boardCanvas.height = Math.round(bHeight * this.dpr);
      this.boardCtx.resetTransform();
      this.boardCtx.scale(this.dpr, this.dpr);
      this.cellSize = bWidth / COLS;

      // 2. Vista previa de la siguiente pieza
      const nRect = this.nextCanvas.getBoundingClientRect();
      const nWidth = nRect.width || 46;
      const nHeight = nRect.height || 46;

      this.nextCanvas.width = Math.round(nWidth * this.dpr);
      this.nextCanvas.height = Math.round(nHeight * this.dpr);
      this.nextCtx.resetTransform();
      this.nextCtx.scale(this.dpr, this.dpr);
      this.nextCellSize = Math.min(nWidth, nHeight) / 4.2;
    }

    // Dibuja un bloque con estética arcade biselada y relieve de alta definición
    drawBlock(ctx, x, y, size, color, isGhost = false) {
      const padding = 1;
      const bx = x + padding;
      const by = y + padding;
      const bs = size - padding * 2;
      const radius = Math.max(2, size * 0.12);

      if (isGhost) {
        // Pieza fantasma (proyección translúcida)
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 2]);

        ctx.beginPath();
        ctx.roundRect(bx, by, bs, bs, radius);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        return;
      }

      ctx.save();

      // Relleno principal del bloque
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(bx, by, bs, bs, radius);
      ctx.fill();

      // Bisel de luz superior / izquierdo (brillo)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.moveTo(bx, by + bs);
      ctx.lineTo(bx, by);
      ctx.lineTo(bx + bs, by);
      ctx.lineTo(bx + bs - 3, by + 3);
      ctx.lineTo(bx + 3, by + 3);
      ctx.lineTo(bx + 3, by + bs - 3);
      ctx.closePath();
      ctx.fill();

      // Bisel de sombra inferior / derecho (profundidad arcade)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.moveTo(bx + bs, by);
      ctx.lineTo(bx + bs, by + bs);
      ctx.lineTo(bx, by + bs);
      ctx.lineTo(bx + 3, by + bs - 3);
      ctx.lineTo(bx + bs - 3, by + bs - 3);
      ctx.lineTo(bx + bs - 3, by + 3);
      ctx.closePath();
      ctx.fill();

      // Destello especular en la esquina superior izquierda
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(bx + 4, by + 4, Math.max(2, size * 0.18), Math.max(2, size * 0.18));

      ctx.restore();
    }

    // Dibuja el marco y la cuadrícula sutil de fondo
    drawGrid(width, height) {
      const ctx = this.boardCtx;
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;

      // Líneas verticales
      for (let c = 1; c < COLS; c++) {
        const x = Math.round(c * this.cellSize);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Líneas horizontales
      for (let r = 1; r < ROWS; r++) {
        const y = Math.round(r * this.cellSize);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // Renderizado completo del tablero
    renderBoard(board, currentPiece, ghostY, clearingRows = [], clearProgress = 0) {
      const width = this.boardCanvas.getBoundingClientRect().width;
      const height = this.boardCanvas.getBoundingClientRect().height;

      this.drawGrid(width, height);

      // 1. Bloques estáticos fijados en la cuadrícula
      for (let r = 0; r < ROWS; r++) {
        // Efecto visual de destello blanco cuando se eliminan líneas
        const isClearing = clearingRows.includes(r);

        for (let c = 0; c < COLS; c++) {
          const color = board.grid[r][c];
          if (color !== 0) {
            const x = c * this.cellSize;
            const y = r * this.cellSize;

            if (isClearing) {
              // Destello de línea eliminada
              this.boardCtx.save();
              this.boardCtx.fillStyle = clearProgress < 0.5 ? '#ffffff' : 'rgba(255, 255, 255, 0.2)';
              this.boardCtx.fillRect(x, y, this.cellSize, this.cellSize);
              this.boardCtx.restore();
            } else {
              this.drawBlock(this.boardCtx, x, y, this.cellSize, color);
            }
          }
        }
      }

      // Si se están limpiando líneas, pausamos temporalmente el dibujado de la pieza activa
      if (clearingRows.length > 0) return;

      // 2. Pieza fantasma (Ghost Piece)
      if (currentPiece && ghostY !== null && ghostY !== currentPiece.y) {
        for (let r = 0; r < currentPiece.matrix.length; r++) {
          for (let c = 0; c < currentPiece.matrix[r].length; c++) {
            if (currentPiece.matrix[r][c] !== 0) {
              const gy = ghostY + r;
              const gx = currentPiece.x + c;
              if (gy >= 0) {
                this.drawBlock(
                  this.boardCtx,
                  gx * this.cellSize,
                  gy * this.cellSize,
                  this.cellSize,
                  currentPiece.color,
                  true
                );
              }
            }
          }
        }
      }

      // 3. Pieza activa cayendo
      if (currentPiece) {
        for (let r = 0; r < currentPiece.matrix.length; r++) {
          for (let c = 0; c < currentPiece.matrix[r].length; c++) {
            if (currentPiece.matrix[r][c] !== 0) {
              const py = currentPiece.y + r;
              const px = currentPiece.x + c;
              if (py >= 0) {
                this.drawBlock(
                  this.boardCtx,
                  px * this.cellSize,
                  py * this.cellSize,
                  this.cellSize,
                  currentPiece.color
                );
              }
            }
          }
        }
      }
    }

    // Renderizado de la siguiente pieza en el panel secundario
    renderNextPiece(pieceDef) {
      const width = this.nextCanvas.getBoundingClientRect().width;
      const height = this.nextCanvas.getBoundingClientRect().height;
      const ctx = this.nextCtx;

      ctx.clearRect(0, 0, width, height);

      if (!pieceDef) return;

      const matrix = pieceDef.matrix;
      const mRows = matrix.length;
      const mCols = matrix[0].length;

      // Determinar los límites reales del bloque para centrarlo estéticamente
      let minR = mRows, maxR = -1, minC = mCols, maxC = -1;
      for (let r = 0; r < mRows; r++) {
        for (let c = 0; c < mCols; c++) {
          if (matrix[r][c] !== 0) {
            if (r < minR) minR = r;
            if (r > maxR) maxR = r;
            if (c < minC) minC = c;
            if (c > maxC) maxC = c;
          }
        }
      }

      const activeWidth = (maxC - minC + 1) * this.nextCellSize;
      const activeHeight = (maxR - minR + 1) * this.nextCellSize;
      const offsetX = (width - activeWidth) / 2 - minC * this.nextCellSize;
      const offsetY = (height - activeHeight) / 2 - minR * this.nextCellSize;

      for (let r = 0; r < mRows; r++) {
        for (let c = 0; c < mCols; c++) {
          if (matrix[r][c] !== 0) {
            const bx = offsetX + c * this.nextCellSize;
            const by = offsetY + r * this.nextCellSize;
            this.drawBlock(ctx, bx, by, this.nextCellSize, pieceDef.color);
          }
        }
      }
    }
  }

  // ==========================================================================
  // 8. MOTOR PRINCIPAL DEL JUEGO (GAME CONTROLLER)
  // ==========================================================================
  class Game {
    constructor() {
      // Elementos del DOM
      this.boardCanvas = document.getElementById('board-canvas');
      this.nextCanvas = document.getElementById('next-canvas');
      this.scoreDisplay = document.getElementById('score-display');
      this.levelDisplay = document.getElementById('level-display');
      this.linesDisplay = document.getElementById('lines-display');
      this.highScoreDisplay = document.getElementById('highscore-display');
      this.floatBanner = document.getElementById('float-banner');

      // Modales y overlays
      this.pauseOverlay = document.getElementById('overlay-pause');
      this.gameoverOverlay = document.getElementById('overlay-gameover');
      this.finalScore = document.getElementById('final-score');
      this.finalLines = document.getElementById('final-lines');
      this.finalLevel = document.getElementById('final-level');
      this.finalHighScore = document.getElementById('final-highscore');
      this.newRecordTag = document.getElementById('new-record-tag');

      // Instancias del juego
      this.board = new Board();
      this.bag = new PieceBag();
      this.renderer = new Renderer(this.boardCanvas, this.nextCanvas);

      // Estado dinámico
      this.state = GameState.PLAYING;
      this.score = 0;
      this.lines = 0;
      this.level = 1;
      this.highScore = Storage.getHighScore();

      this.currentPiece = null;
      this.nextPieceKey = null;

      // Variables de tiempo y bucle
      this.dropCounter = 0;
      this.dropInterval = 850; // milisegundos iniciales
      this.lastTime = 0;

      // Retardo de fijación (Lock delay) para maniobrar antes de fijar
      this.lockDelay = 450;
      this.lockTimer = 0;
      this.isLocking = false;
      this.lockResets = 0;
      this.maxLockResets = 15;

      // Animación de líneas eliminadas
      this.clearingRows = [];
      this.clearingTime = 0;
      this.clearingDuration = 140; // milisegundos de destello

      // Detección de dispositivo táctil (móviles y tablets) vs ratón de escritorio
      const isTouch = ('ontouchstart' in window) ||
                      (navigator.maxTouchPoints > 0) ||
                      window.matchMedia('(pointer: coarse)').matches;
      if (isTouch) {
        document.body.classList.add('touch-device');
      } else {
        document.body.classList.add('desktop-device');
      }

      this.initEvents();
      this.initTouchControls();
      this.startNewGame();

      // Iniciar el bucle de renderizado con requestAnimationFrame
      requestAnimationFrame(this.gameLoop.bind(this));
    }

    // Iniciar o reiniciar la partida
    startNewGame() {
      this.board.reset();
      this.bag = new PieceBag();
      this.score = 0;
      this.lines = 0;
      this.level = 1;
      this.updateDropInterval();
      this.clearingRows = [];

      this.nextPieceKey = this.bag.getNextKey();
      this.spawnNextPiece();

      this.state = GameState.PLAYING;
      this.updateUI();

      this.pauseOverlay.classList.add('hidden');
      this.gameoverOverlay.classList.add('hidden');
      this.newRecordTag.classList.add('hidden');
    }

    // Genera y posiciona la siguiente pieza en juego
    spawnNextPiece() {
      this.currentPiece = new Piece(this.nextPieceKey);
      this.nextPieceKey = this.bag.getNextKey();
      this.renderer.renderNextPiece(PIECES[this.nextPieceKey]);

      this.isLocking = false;
      this.lockTimer = 0;
      this.lockResets = 0;

      // Verificación de fin de juego: la pieza colisiona inmediatamente al nacer
      if (!this.board.isValid(this.currentPiece.matrix, this.currentPiece.x, this.currentPiece.y)) {
        this.triggerGameOver();
      }
    }

    // Cálculo dinámico de velocidad según el nivel alcanzado
    updateDropInterval() {
      // Comienza en 850ms y se acelera progresivamente hasta un límite de 75ms
      this.dropInterval = Math.max(75, 850 - (this.level - 1) * 75);
    }

    // Calcula la posición Y donde aterrizará la pieza actual (Ghost Piece)
    calculateGhostY() {
      if (!this.currentPiece) return null;
      let gy = this.currentPiece.y;
      while (this.board.isValid(this.currentPiece.matrix, this.currentPiece.x, gy + 1)) {
        gy++;
      }
      return gy;
    }

    // Desplazamiento horizontal
    move(dir) {
      if (this.state !== GameState.PLAYING || !this.currentPiece) return false;
      const newX = this.currentPiece.x + dir;
      if (this.board.isValid(this.currentPiece.matrix, newX, this.currentPiece.y)) {
        this.currentPiece.x = newX;
        this.resetLockIfMoved();
        return true;
      }
      return false;
    }

    // Caída suave (Soft Drop)
    softDrop() {
      if (this.state !== GameState.PLAYING || !this.currentPiece) return false;
      if (this.board.isValid(this.currentPiece.matrix, this.currentPiece.x, this.currentPiece.y + 1)) {
        this.currentPiece.y++;
        this.score += 1; // 1 punto extra por celda en caída suave
        this.dropCounter = 0;
        this.updateUI();
        return true;
      } else {
        this.isLocking = true;
        return false;
      }
    }

    // Caída instantánea (Hard Drop)
    hardDrop() {
      if (this.state !== GameState.PLAYING || !this.currentPiece) return;
      let droppedCells = 0;
      while (this.board.isValid(this.currentPiece.matrix, this.currentPiece.x, this.currentPiece.y + 1)) {
        this.currentPiece.y++;
        droppedCells++;
      }
      this.score += droppedCells * 2; // 2 puntos por celda en caída rápida
      triggerHaptic(25);
      this.lockCurrentPiece();
    }

    // Rotación de la pieza con sistema de Wall Kicks (desplazamientos de pared)
    rotate(clockwise = true) {
      if (this.state !== GameState.PLAYING || !this.currentPiece) return;

      const oldMatrix = this.currentPiece.matrix;
      const newMatrix = clockwise
        ? rotateMatrixClockwise(oldMatrix)
        : rotateMatrixCounterClockwise(oldMatrix);

      // Probar los desplazamientos de tolerancia para evitar colisión con paredes y piso
      for (const [kickX, kickY] of ROTATION_KICKS) {
        const testX = this.currentPiece.x + kickX;
        const testY = this.currentPiece.y + kickY;

        if (this.board.isValid(newMatrix, testX, testY)) {
          this.currentPiece.matrix = newMatrix;
          this.currentPiece.x = testX;
          this.currentPiece.y = testY;
          this.resetLockIfMoved();
          triggerHaptic(10);
          return;
        }
      }
    }

    // Restablece el retardo de bloqueo al maniobrar sobre una superficie
    resetLockIfMoved() {
      if (this.isLocking && this.lockResets < this.maxLockResets) {
        this.lockTimer = 0;
        this.lockResets++;
      }
    }

    // Bloquea la pieza en la cuadrícula y procesa líneas eliminadas
    lockCurrentPiece() {
      this.board.lockPiece(this.currentPiece);
      this.currentPiece = null;
      this.isLocking = false;
      this.lockTimer = 0;

      // Comprobar si hay filas completadas
      const fullRows = this.board.getFullLines();
      if (fullRows.length > 0) {
        this.state = GameState.CLEARING;
        this.clearingRows = fullRows;
        this.clearingTime = 0;
        triggerHaptic(40);
        this.showBanner(BANNER_TEXTS[fullRows.length]);
      } else {
        this.spawnNextPiece();
      }

      this.updateUI();
    }

    // Aplica las líneas eliminadas y suma puntuación
    finalizeLineClearing() {
      const lineCount = this.clearingRows.length;
      this.board.removeLines(this.clearingRows);
      this.clearingRows = [];

      // Puntos: tabla base multiplicada por el nivel actual
      this.score += POINTS_TABLE[lineCount] * this.level;
      this.lines += lineCount;

      // Nivel sube cada 10 líneas
      const newLevel = Math.floor(this.lines / 10) + 1;
      if (newLevel !== this.level) {
        this.level = newLevel;
        this.updateDropInterval();
        this.showBanner(`¡NIVEL ${this.level}!`);
      }

      // Actualizar récord si es superado
      if (this.score > this.highScore) {
        this.highScore = this.score;
        Storage.setHighScore(this.highScore);
      }

      this.state = GameState.PLAYING;
      this.spawnNextPiece();
      this.updateUI();
    }

    // Muestra cartel flotante arcade ("¡DOBLE!", "¡TETRA!")
    showBanner(text) {
      if (!text) return;
      this.floatBanner.textContent = text;
      this.floatBanner.classList.add('show');
      clearTimeout(this.bannerTimer);
      this.bannerTimer = setTimeout(() => {
        this.floatBanner.classList.remove('show');
      }, 700);
    }

    // Pausar y reanudar
    togglePause() {
      if (this.state === GameState.GAMEOVER) return;

      if (this.state === GameState.PLAYING || this.state === GameState.CLEARING) {
        this.state = GameState.PAUSED;
        this.pauseOverlay.classList.remove('hidden');
      } else if (this.state === GameState.PAUSED) {
        this.state = GameState.PLAYING;
        this.pauseOverlay.classList.add('hidden');
      }
    }

    // Disparador de Fin de Partida
    triggerGameOver() {
      this.state = GameState.GAMEOVER;
      triggerHaptic(70);

      const isNewRecord = this.score > 0 && this.score >= this.highScore;
      if (isNewRecord) {
        this.highScore = this.score;
        Storage.setHighScore(this.highScore);
        this.newRecordTag.classList.remove('hidden');
      } else {
        this.newRecordTag.classList.add('hidden');
      }

      this.finalScore.textContent = this.score;
      this.finalLines.textContent = this.lines;
      this.finalLevel.textContent = this.level;
      this.finalHighScore.textContent = this.highScore;

      this.gameoverOverlay.classList.remove('hidden');
      this.updateUI();
    }

    // Actualiza marcadores visuales del DOM
    updateUI() {
      this.scoreDisplay.textContent = this.score;
      this.levelDisplay.textContent = this.level;
      this.linesDisplay.textContent = this.lines;
      this.highScoreDisplay.textContent = this.highScore;
    }

    // ========================================================================
    // 9. BUCLE PRINCIPAL (requestAnimationFrame CON DELTA-TIME)
    // ========================================================================
    gameLoop(time = 0) {
      const deltaTime = time - this.lastTime;
      this.lastTime = time;

      // Limitar saltos de delta en caso de que el navegador cambie de pestaña
      const cappedDelta = Math.min(deltaTime, 100);

      if (this.state === GameState.PLAYING) {
        this.updateGameLogic(cappedDelta);
      } else if (this.state === GameState.CLEARING) {
        this.clearingTime += cappedDelta;
        if (this.clearingTime >= this.clearingDuration) {
          this.finalizeLineClearing();
        }
      }

      // Renderizado continuo
      const ghostY = this.calculateGhostY();
      const clearProgress = this.clearingDuration > 0
        ? this.clearingTime / this.clearingDuration
        : 0;

      this.renderer.renderBoard(
        this.board,
        this.currentPiece,
        ghostY,
        this.clearingRows,
        clearProgress
      );

      requestAnimationFrame(this.gameLoop.bind(this));
    }

    // Lógica interna de gravedad por delta-time
    updateGameLogic(delta) {
      if (!this.currentPiece) return;

      this.dropCounter += delta;

      // Verificamos si la pieza está en reposo sobre el piso o un bloque
      const canFall = this.board.isValid(
        this.currentPiece.matrix,
        this.currentPiece.x,
        this.currentPiece.y + 1
      );

      if (!canFall) {
        this.isLocking = true;
        this.lockTimer += delta;
        if (this.lockTimer >= this.lockDelay) {
          this.lockCurrentPiece();
          return;
        }
      } else {
        this.isLocking = false;
        this.lockTimer = 0;
      }

      // Caída libre periódica por gravedad
      if (this.dropCounter >= this.dropInterval) {
        this.dropCounter = 0;
        if (canFall) {
          this.currentPiece.y++;
        }
      }
    }

    // ========================================================================
    // 10. ENTRADA DE TECLADO Y BOTONES DE INTERFAZ
    // ========================================================================
    initEvents() {
      // Evento de redimensionado de pantalla y orientación
      const handleResize = () => {
        this.renderer.resize();
        this.renderer.renderNextPiece(PIECES[this.nextPieceKey]);
      };
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', () => setTimeout(handleResize, 100));

      if (window.ResizeObserver) {
        const ro = new ResizeObserver(handleResize);
        const stage = document.querySelector('.game-stage');
        if (stage) ro.observe(stage);
      }

      // Manejo de teclado con soporte para mayúsculas y minúsculas
      window.addEventListener('keydown', (e) => {
        // Evitar scroll de flechas y espacio
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
          e.preventDefault();
        }

        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          this.togglePause();
          return;
        }

        if (e.key === 'r' || e.key === 'R') {
          this.startNewGame();
          return;
        }

        if (this.state !== GameState.PLAYING) return;

        switch (e.key) {
          case 'ArrowLeft':
          case 'a':
          case 'A':
            this.move(-1);
            triggerHaptic(8);
            break;
          case 'ArrowRight':
          case 'd':
          case 'D':
            this.move(1);
            triggerHaptic(8);
            break;
          case 'ArrowUp':
          case 'w':
          case 'W':
            this.rotate(true);
            break;
          case 'z':
          case 'Z':
          case 'q':
          case 'Q':
            this.rotate(false);
            break;
          case 'ArrowDown':
          case 's':
          case 'S':
            this.softDrop();
            break;
          case ' ':
            this.hardDrop();
            break;
        }
      });

      // Botones superiores de la interfaz
      document.getElementById('btn-pause-header').addEventListener('click', () => this.togglePause());
      document.getElementById('btn-restart-header').addEventListener('click', () => this.startNewGame());

      // Botones de modales
      document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());
      document.getElementById('btn-pause-restart').addEventListener('click', () => this.startNewGame());
      document.getElementById('btn-gameover-restart').addEventListener('click', () => this.startNewGame());
    }

    // ========================================================================
    // 11. CONTROLES TÁCTILES MÓVILES (DAS / AUTO-REPETICIÓN Y TOQUE DIRECTO)
    // ========================================================================
    initTouchControls() {
      const bindHoldAction = (buttonId, actionFn) => {
        const btn = document.getElementById(buttonId);
        if (!btn) return;

        let holdTimer = null;
        let repeatInterval = null;

        const startAction = (e) => {
          e.preventDefault();
          btn.classList.add('is-pressed');
          actionFn();
          triggerHaptic(10);

          // Retardo inicial de auto-repetición (DAS: Delayed Auto Shift: 160ms)
          holdTimer = setTimeout(() => {
            // Frecuencia de repetición continua (ARR: Auto Repeat Rate: 45ms)
            repeatInterval = setInterval(() => {
              actionFn();
              triggerHaptic(6);
            }, 45);
          }, 160);
        };

        const stopAction = (e) => {
          if (e) e.preventDefault();
          btn.classList.remove('is-pressed');
          clearTimeout(holdTimer);
          clearInterval(repeatInterval);
        };

        btn.addEventListener('pointerdown', startAction);
        btn.addEventListener('pointerup', stopAction);
        btn.addEventListener('pointercancel', stopAction);
        btn.addEventListener('pointerleave', stopAction);
        btn.addEventListener('contextmenu', (e) => e.preventDefault());
      };

      const bindTapAction = (buttonId, actionFn) => {
        const btn = document.getElementById(buttonId);
        if (!btn) return;

        const handleTap = (e) => {
          e.preventDefault();
          btn.classList.add('is-pressed');
          actionFn();
          setTimeout(() => btn.classList.remove('is-pressed'), 100);
        };

        btn.addEventListener('pointerdown', handleTap);
        btn.addEventListener('contextmenu', (e) => e.preventDefault());
      };

      // Movimiento continuo mientras se mantiene presionado
      bindHoldAction('ctrl-left', () => this.move(-1));
      bindHoldAction('ctrl-right', () => this.move(1));
      bindHoldAction('ctrl-down', () => this.softDrop());

      // Acciones individuales por toque
      bindTapAction('ctrl-rotate-cw', () => this.rotate(true));
      bindTapAction('ctrl-rotate-ccw', () => this.rotate(false));
      bindTapAction('ctrl-hard-drop', () => this.hardDrop());
    }
  }

  // ==========================================================================
  // INICIALIZACIÓN AL CARGAR LA PÁGINA
  // ==========================================================================
  window.addEventListener('DOMContentLoaded', () => {
    new Game();
  });
})();
