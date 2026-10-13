/**
 * SERPIENTE (SNAKE) - Juego arcade clásico en Vanilla JS (ES6+)
 * 100% offline, sin dependencias. Soporta swipe táctil, D-pad y teclado.
 */
(() => {
  'use strict';

  const GRID_SIZE = 20; // 20x20 celdas
  const GAME_ID = 'snake';

  const GameState = {
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAMEOVER: 'GAMEOVER'
  };

  class SnakeGame {
    constructor() {
      // Elementos del DOM
      this.canvas = document.getElementById('snake-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.wrapper = this.canvas.parentElement;

      this.scoreDisplay = document.getElementById('score-display');
      this.highScoreDisplay = document.getElementById('highscore-display');
      this.lengthDisplay = document.getElementById('length-display');
      this.speedDisplay = document.getElementById('speed-display');

      this.pauseOverlay = document.getElementById('overlay-pause');
      this.gameoverOverlay = document.getElementById('overlay-gameover');
      this.finalScore = document.getElementById('final-score');
      this.finalLength = document.getElementById('final-length');
      this.finalHighScore = document.getElementById('final-highscore');
      this.newRecordTag = document.getElementById('new-record-tag');

      // Estado del juego
      this.state = GameState.PLAYING;
      this.score = 0;
      this.highScore = window.ArcadeStorage ? window.ArcadeStorage.getHighScore(GAME_ID) : 0;
      this.speedLevel = 1;

      // Serpiente: array de coordenadas {x, y}
      this.snake = [];
      this.direction = { x: 1, y: 0 }; // Inicialmente a la derecha
      this.nextDirection = { x: 1, y: 0 };

      // Comida {x, y}
      this.food = { x: 15, y: 10 };

      // Variables de tiempo para requestAnimationFrame
      this.lastTime = 0;
      this.stepTimer = 0;
      this.stepInterval = 170; // milisegundos por paso

      // Animación de pulso para la comida
      this.pulsePhase = 0;

      // Dimensiones de renderizado
      this.cellSize = 20;
      this.dpr = window.devicePixelRatio || 1;

      // Detección de dispositivo táctil vs ratón de escritorio
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
      this.initSwipeGestures();
      this.resizeCanvas();
      this.startNewGame();

      requestAnimationFrame(this.gameLoop.bind(this));
    }

    startNewGame() {
      // Iniciar en el centro con 3 segmentos
      const mid = Math.floor(GRID_SIZE / 2);
      this.snake = [
        { x: mid, y: mid },
        { x: mid - 1, y: mid },
        { x: mid - 2, y: mid }
      ];

      this.direction = { x: 1, y: 0 };
      this.nextDirection = { x: 1, y: 0 };
      this.score = 0;
      this.speedLevel = 1;
      this.updateSpeedInterval();

      this.spawnFood();

      this.state = GameState.PLAYING;
      this.updateUI();

      this.pauseOverlay.classList.add('hidden');
      this.gameoverOverlay.classList.add('hidden');
      this.newRecordTag.classList.add('hidden');
    }

    updateSpeedInterval() {
      // Empieza en 170ms y acelera hasta un mínimo de 65ms
      this.stepInterval = Math.max(65, 170 - (this.speedLevel - 1) * 11);
    }

    spawnFood() {
      const emptyCells = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          const isOccupied = this.snake.some(seg => seg.x === x && seg.y === y);
          if (!isOccupied) {
            emptyCells.push({ x, y });
          }
        }
      }

      if (emptyCells.length > 0) {
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        this.food = emptyCells[randomIndex];
      }
    }

    setDirection(dx, dy) {
      if (this.state !== GameState.PLAYING) return;
      // Impedir reversa instantánea sobre sí misma
      if (dx !== 0 && this.direction.x !== 0) return;
      if (dy !== 0 && this.direction.y !== 0) return;

      this.nextDirection = { x: dx, y: dy };
      if (window.ArcadeAudio) window.ArcadeAudio.playMove();
      if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(8);
    }

    update() {
      this.direction = { ...this.nextDirection };

      const head = this.snake[0];
      const newHead = {
        x: head.x + this.direction.x,
        y: head.y + this.direction.y
      };

      // Colisión contra paredes
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        this.triggerGameOver();
        return;
      }

      // Colisión contra el propio cuerpo
      for (let i = 0; i < this.snake.length; i++) {
        if (this.snake[i].x === newHead.x && this.snake[i].y === newHead.y) {
          this.triggerGameOver();
          return;
        }
      }

      // Añadir nueva cabeza
      this.snake.unshift(newHead);

      // Comprobar si come alimento
      if (newHead.x === this.food.x && newHead.y === this.food.y) {
        this.score += 10 * this.speedLevel;
        if (window.ArcadeAudio) window.ArcadeAudio.playClear();
        if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(20);

        // Aumentar velocidad cada 4 orbes devorados
        const newSpeed = Math.floor(this.snake.length / 4) + 1;
        if (newSpeed !== this.speedLevel) {
          this.speedLevel = newSpeed;
          this.updateSpeedInterval();
        }

        // Actualizar récord si se bate
        if (this.score > this.highScore) {
          this.highScore = this.score;
          if (window.ArcadeStorage) {
            window.ArcadeStorage.setHighScore(GAME_ID, this.highScore);
          }
        }

        this.spawnFood();
      } else {
        // Quitar la cola si no comió
        this.snake.pop();
      }

      this.updateUI();
    }

    triggerGameOver() {
      this.state = GameState.GAMEOVER;
      if (window.ArcadeAudio) window.ArcadeAudio.playGameOver();
      if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(60);

      const isNewRecord = this.score > 0 && this.score >= this.highScore;
      if (isNewRecord) {
        this.highScore = this.score;
        if (window.ArcadeStorage) {
          window.ArcadeStorage.setHighScore(GAME_ID, this.highScore);
        }
        this.newRecordTag.classList.remove('hidden');
      } else {
        this.newRecordTag.classList.add('hidden');
      }

      this.finalScore.textContent = this.score;
      this.finalLength.textContent = this.snake.length;
      this.finalHighScore.textContent = this.highScore;

      this.gameoverOverlay.classList.remove('hidden');
    }

    togglePause() {
      if (this.state === GameState.GAMEOVER) return;

      if (this.state === GameState.PLAYING) {
        this.state = GameState.PAUSED;
        this.pauseOverlay.classList.remove('hidden');
      } else if (this.state === GameState.PAUSED) {
        this.state = GameState.PLAYING;
        this.pauseOverlay.classList.add('hidden');
      }
    }

    updateUI() {
      this.scoreDisplay.textContent = this.score;
      this.highScoreDisplay.textContent = this.highScore;
      this.lengthDisplay.textContent = this.snake.length;
      this.speedDisplay.textContent = this.speedLevel;
    }

    resizeCanvas() {
      if (window.ArcadeCanvas) {
        // Cuadrícula 1:1 centrada
        const result = window.ArcadeCanvas.fit(this.canvas, this.wrapper, 1, 1, 6);
        this.cellSize = result.width / GRID_SIZE;
        this.dpr = result.dpr;
      }
    }

    gameLoop(time = 0) {
      const delta = Math.min(time - this.lastTime, 100);
      this.lastTime = time;

      if (this.state === GameState.PLAYING) {
        this.stepTimer += delta;
        this.pulsePhase = (this.pulsePhase + delta * 0.005) % (Math.PI * 2);

        if (this.stepTimer >= this.stepInterval) {
          this.stepTimer = 0;
          this.update();
        }
      }

      this.render();
      requestAnimationFrame(this.gameLoop.bind(this));
    }

    render() {
      const rect = this.canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const ctx = this.ctx;

      ctx.clearRect(0, 0, w, h);

      // 1. Cuadrícula arcade sutil de fondo
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      for (let i = 1; i < GRID_SIZE; i++) {
        const pos = Math.round(i * this.cellSize);
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, h);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(w, pos);
        ctx.stroke();
      }

      // 2. Comida brillante con efecto pulsante
      if (this.food) {
        const fx = this.food.x * this.cellSize + this.cellSize / 2;
        const fy = this.food.y * this.cellSize + this.cellSize / 2;
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.15;
        const radius = (this.cellSize * 0.38) * pulse;

        ctx.save();
        ctx.shadowColor = '#ffd000';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffd000';

        ctx.beginPath();
        ctx.arc(fx, fy, radius, 0, Math.PI * 2);
        ctx.fill();

        // Destello interior
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(fx - radius * 0.3, fy - radius * 0.3, radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3. Serpiente con cuerpo esmeralda y cabeza neón
      for (let i = this.snake.length - 1; i >= 0; i--) {
        const seg = this.snake[i];
        const isHead = i === 0;
        const sx = seg.x * this.cellSize;
        const sy = seg.y * this.cellSize;
        const pad = isHead ? 1 : 2;
        const size = this.cellSize - pad * 2;
        const cornerRadius = isHead ? size * 0.45 : size * 0.3;

        ctx.save();
        if (isHead) {
          ctx.fillStyle = '#00f0ff'; // Cabeza cyan neón
          ctx.shadowColor = 'rgba(0, 240, 255, 0.6)';
          ctx.shadowBlur = 10;
        } else {
          // Gradiente sutil hacia la cola
          const fade = 1 - (i / this.snake.length) * 0.35;
          ctx.fillStyle = `rgba(0, 230, 118, ${fade})`;
        }

        ctx.beginPath();
        ctx.roundRect(sx + pad, sy + pad, size, size, cornerRadius);
        ctx.fill();

        // Ojos de la cabeza orientados según dirección
        if (isHead) {
          ctx.fillStyle = '#05070e';
          const eyeSize = Math.max(2, this.cellSize * 0.14);
          let e1x = sx + size * 0.3, e1y = sy + size * 0.3;
          let e2x = sx + size * 0.7, e2y = sy + size * 0.3;

          if (this.direction.x === 1) { // Derecha
            e1x = sx + size * 0.65; e1y = sy + size * 0.28;
            e2x = sx + size * 0.65; e2y = sy + size * 0.72;
          } else if (this.direction.x === -1) { // Izquierda
            e1x = sx + size * 0.35; e1y = sy + size * 0.28;
            e2x = sx + size * 0.35; e2y = sy + size * 0.72;
          } else if (this.direction.y === 1) { // Abajo
            e1x = sx + size * 0.28; e1y = sy + size * 0.65;
            e2x = sx + size * 0.72; e2y = sy + size * 0.65;
          } else if (this.direction.y === -1) { // Arriba
            e1x = sx + size * 0.28; e1y = sy + size * 0.35;
            e2x = sx + size * 0.72; e2y = sy + size * 0.35;
          }

          ctx.beginPath();
          ctx.arc(e1x, e1y, eyeSize, 0, Math.PI * 2);
          ctx.arc(e2x, e2y, eyeSize, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    initEvents() {
      // Redimensionamiento
      const onResize = () => this.resizeCanvas();
      window.addEventListener('resize', onResize);
      window.addEventListener('orientationchange', () => setTimeout(onResize, 100));

      if (window.ResizeObserver) {
        const ro = new ResizeObserver(onResize);
        ro.observe(this.wrapper);
      }

      // Teclado
      window.addEventListener('keydown', (e) => {
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

        switch (e.key) {
          case 'ArrowUp':
          case 'w':
          case 'W':
            this.setDirection(0, -1);
            break;
          case 'ArrowDown':
          case 's':
          case 'S':
            this.setDirection(0, 1);
            break;
          case 'ArrowLeft':
          case 'a':
          case 'A':
            this.setDirection(-1, 0);
            break;
          case 'ArrowRight':
          case 'd':
          case 'D':
            this.setDirection(1, 0);
            break;
        }
      });

      // Botón de sonido
      const soundBtn = document.getElementById('btn-sound-toggle');
      if (soundBtn && window.ArcadeAudio) {
        const iconOn = document.getElementById('icon-sound-on');
        const iconOff = document.getElementById('icon-sound-off');
        const updateSoundIcon = () => {
          if (window.ArcadeAudio.isMuted) {
            iconOn.classList.add('hidden');
            iconOff.classList.remove('hidden');
          } else {
            iconOn.classList.remove('hidden');
            iconOff.classList.add('hidden');
          }
        };
        updateSoundIcon();
        soundBtn.addEventListener('click', () => {
          window.ArcadeAudio.toggleMute();
          updateSoundIcon();
        });
      }

      // Botones superiores y modales
      document.getElementById('btn-pause-header').addEventListener('click', () => this.togglePause());
      document.getElementById('btn-restart-header').addEventListener('click', () => this.startNewGame());
      document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());
      document.getElementById('btn-pause-restart').addEventListener('click', () => this.startNewGame());
      document.getElementById('btn-gameover-restart').addEventListener('click', () => this.startNewGame());
    }

    initTouchControls() {
      const bindBtn = (id, dx, dy) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          btn.classList.add('is-pressed');
          this.setDirection(dx, dy);
          setTimeout(() => btn.classList.remove('is-pressed'), 120);
        });
        btn.addEventListener('contextmenu', (e) => e.preventDefault());
      };

      bindBtn('ctrl-up', 0, -1);
      bindBtn('ctrl-down', 0, 1);
      bindBtn('ctrl-left', -1, 0);
      bindBtn('ctrl-right', 1, 0);
    }

    initSwipeGestures() {
      let touchStartX = 0;
      let touchStartY = 0;
      const minDistance = 24; // píxeles mínimos para considerar deslizamiento

      this.canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      this.canvas.addEventListener('touchend', (e) => {
        if (e.changedTouches.length === 0) return;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        if (Math.abs(diffX) > Math.abs(diffY)) {
          if (Math.abs(diffX) > minDistance) {
            if (diffX > 0) this.setDirection(1, 0); // Derecha
            else this.setDirection(-1, 0);          // Izquierda
          }
        } else {
          if (Math.abs(diffY) > minDistance) {
            if (diffY > 0) this.setDirection(0, 1);  // Abajo
            else this.setDirection(0, -1);          // Arriba
          }
        }
      }, { passive: true });
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
  });
})();
