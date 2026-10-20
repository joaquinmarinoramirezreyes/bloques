/**
 * SERPIENTE (SNAKE) - Juego arcade clásico en Vanilla JS (ES6+)
 * 100% offline, sin dependencias.
 * Renderizado fluido con interpolación visual entre casillas (60/120 FPS),
 * cuerpo suave con esquinas redondeadas, cola de giros (input buffer),
 * partículas sin garbage collection y control táctil inmediato.
 */
(() => {
  'use strict';

  // ==========================================================================
  // CONFIGURACIÓN Y CONSTANTES AJUSTABLES
  // ==========================================================================
  const GRID_SIZE = 20;            // Rejilla de 20x20 casillas
  const GAME_ID = 'snake';

  // Velocidad de movimiento por casillas (en milisegundos)
  const BASE_STEP_MS = 120;        // Velocidad inicial al comenzar (~120 ms por paso)
  const MIN_STEP_MS = 70;          // Velocidad máxima alcanzable (~70 ms por paso)
  const SPEED_DECAY_SCORE = 280;   // Puntuación aproximada para aproximarse al paso mínimo

  // Efectos visuales y de control
  const EAT_ANIM_DURATION = 220;   // Duración (ms) de la hinchazón al comer
  const SHAKE_DURATION = 280;      // Duración (ms) de la vibración de pantalla al morir
  const SWIPE_THRESHOLD_PX = 20;   // Umbral de desplazamiento táctil para giro inmediato
  const MAX_PENDING_INPUTS = 2;    // Máximo de giros almacenados en el buffer
  const PARTICLE_COUNT = 24;       // Pool preasignado de partículas (cero GC)

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

      // Movimiento y cuadrícula
      this.snake = [];
      this.prevSnake = [];
      this.tailPrev = { x: 0, y: 0 };
      this.didEatLastStep = false;
      this.direction = { x: 1, y: 0 };
      this.inputQueue = [];

      // Comida {x, y}
      this.food = { x: 15, y: 10 };

      // Temporizadores de lógica e interpolación
      this.lastTime = 0;
      this.stepTimer = 0;
      this.stepInterval = BASE_STEP_MS;

      // Efectos visuales
      this.pulsePhase = 0;
      this.eatAnimTimer = 0;
      this.shakeTimer = 0;

      // Pool preasignado de partículas para evitar pausas de Garbage Collection
      this.particlePool = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        size: 2,
        color: '#ffd000',
        active: false
      }));

      // Buffer preasignado de puntos de renderizado para el trazo continuo
      this.renderPoints = Array.from({ length: GRID_SIZE * GRID_SIZE + 4 }, () => ({ x: 0, y: 0 }));
      this.renderPointCount = 0;

      // Dimensiones de lienzo
      this.cellSize = 20;
      this.dpr = window.devicePixelRatio || 1;

      // Detección de dispositivo táctil vs escritorio
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

      // Iniciar el bucle de renderizado continuo
      requestAnimationFrame(this.gameLoop.bind(this));
    }

    startNewGame() {
      const mid = Math.floor(GRID_SIZE / 2);
      this.snake = [
        { x: mid, y: mid },
        { x: mid - 1, y: mid },
        { x: mid - 2, y: mid }
      ];

      // Inicializar copia de estado previo para interpolación exacta
      this.prevSnake = this.snake.map(seg => ({ x: seg.x, y: seg.y }));
      this.tailPrev = { x: mid - 2, y: mid };
      this.didEatLastStep = false;

      this.direction = { x: 1, y: 0 };
      this.inputQueue = [];

      this.score = 0;
      this.speedLevel = 1;
      this.stepTimer = 0;
      this.updateSpeedInterval();

      this.eatAnimTimer = 0;
      this.shakeTimer = 0;
      for (let i = 0; i < this.particlePool.length; i++) {
        this.particlePool[i].active = false;
      }

      this.spawnFood();

      this.state = GameState.PLAYING;
      this.updateUI();

      this.pauseOverlay.classList.add('hidden');
      this.gameoverOverlay.classList.add('hidden');
      this.newRecordTag.classList.add('hidden');
    }

    updateSpeedInterval() {
      // Disminución continua asintótica desde BASE_STEP_MS hasta MIN_STEP_MS
      const progress = 1 - Math.exp(-this.score / SPEED_DECAY_SCORE);
      this.stepInterval = Math.round(BASE_STEP_MS - progress * (BASE_STEP_MS - MIN_STEP_MS));
      this.speedLevel = Math.min(10, Math.floor((BASE_STEP_MS - this.stepInterval) / 5) + 1);
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

    /**
     * Cola de entrada: guarda hasta MAX_PENDING_INPUTS (2) giros pendientes.
     * Ignora giros de 180° y pulsaciones duplicadas de la misma dirección.
     */
    queueDirection(dx, dy) {
      if (this.state !== GameState.PLAYING) return;

      // La dirección de referencia es el último giro encolado o la dirección actual
      const ref = this.inputQueue.length > 0 
        ? this.inputQueue[this.inputQueue.length - 1] 
        : this.direction;

      // Ignorar giro de 180° (reversa inmediata sobre sí misma)
      if (dx === -ref.x && dy === -ref.y) return;
      // Ignorar duplicados consecutivos
      if (dx === ref.x && dy === ref.y) return;

      // Añadir al buffer si hay espacio
      if (this.inputQueue.length < MAX_PENDING_INPUTS) {
        this.inputQueue.push({ x: dx, y: dy });
        if (window.ArcadeAudio) window.ArcadeAudio.playMove();
        if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(6);
      }
    }

    /**
     * Paso de simulación lógica por casillas fijas
     */
    update() {
      // Procesar siguiente giro pendiente de la cola
      if (this.inputQueue.length > 0) {
        this.direction = this.inputQueue.shift();
      }

      // Guardar posiciones previas de cada segmento para interpolar el renderizado
      this.prevSnake = this.snake.map(seg => ({ x: seg.x, y: seg.y }));
      this.tailPrev = { ...this.snake[this.snake.length - 1] };

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
      // (la última celda de la cola se liberará en este paso si no come)
      const bodyCheckLimit = this.snake.length - 1;
      for (let i = 0; i < bodyCheckLimit; i++) {
        if (this.snake[i].x === newHead.x && this.snake[i].y === newHead.y) {
          this.triggerGameOver();
          return;
        }
      }

      // Añadir la nueva cabeza a la serpiente
      this.snake.unshift(newHead);

      // Comprobar si devoró la comida
      if (newHead.x === this.food.x && newHead.y === this.food.y) {
        this.didEatLastStep = true;
        this.eatAnimTimer = EAT_ANIM_DURATION;
        this.score += 10;

        // Disparar partículas pequeñas en la posición del orbe
        const fx = (this.food.x + 0.5) * this.cellSize;
        const fy = (this.food.y + 0.5) * this.cellSize;
        this.spawnFoodParticles(fx, fy);

        if (window.ArcadeAudio) window.ArcadeAudio.playClear();
        if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(22);

        this.updateSpeedInterval();

        // Actualizar récord
        if (this.score > this.highScore) {
          this.highScore = this.score;
          if (window.ArcadeStorage) {
            window.ArcadeStorage.setHighScore(GAME_ID, this.highScore);
          }
        }

        this.spawnFood();
      } else {
        this.didEatLastStep = false;
        this.snake.pop(); // Quitar la cola
      }

      this.updateUI();
    }

    spawnFoodParticles(px, py) {
      let spawned = 0;
      const colors = ['#ffd866', '#ffb000', '#cca028', '#ffffff'];
      for (let i = 0; i < this.particlePool.length && spawned < 10; i++) {
        const p = this.particlePool[i];
        if (!p.active) {
          const angle = Math.random() * Math.PI * 2;
          const speed = (this.cellSize * 1.6 + Math.random() * this.cellSize * 2.2);
          p.x = px;
          p.y = py;
          p.vx = Math.cos(angle) * speed;
          p.vy = Math.sin(angle) * speed;
          p.life = 0.35 + Math.random() * 0.2;
          p.maxLife = p.life;
          p.size = Math.max(1.5, this.cellSize * 0.11 + Math.random() * this.cellSize * 0.08);
          p.color = colors[Math.floor(Math.random() * colors.length)];
          p.active = true;
          spawned++;
        }
      }
    }

    updateParticles(delta) {
      const dt = delta / 1000;
      for (let i = 0; i < this.particlePool.length; i++) {
        const p = this.particlePool[i];
        if (p.active) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;
          if (p.life <= 0) {
            p.active = false;
          }
        }
      }
    }

    triggerGameOver() {
      this.state = GameState.GAMEOVER;
      this.shakeTimer = SHAKE_DURATION;

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
        const result = window.ArcadeCanvas.fit(this.canvas, this.wrapper, 1, 1, 6);
        this.cellSize = result.width / GRID_SIZE;
        this.dpr = result.dpr;
      }
    }

    /**
     * Bucle de animación continuo a 60/120 FPS
     */
    gameLoop(time = 0) {
      const delta = Math.min(time - this.lastTime, 100);
      this.lastTime = time;

      if (this.state === GameState.PLAYING) {
        this.stepTimer += delta;
        this.pulsePhase = (this.pulsePhase + delta * 0.006) % (Math.PI * 2);

        if (this.eatAnimTimer > 0) {
          this.eatAnimTimer = Math.max(0, this.eatAnimTimer - delta);
        }

        // Ejecutar pasos de lógica cuando el acumulador supere el intervalo
        while (this.stepTimer >= this.stepInterval) {
          this.stepTimer -= this.stepInterval;
          this.update();
          if (this.state !== GameState.PLAYING) break;
        }
      }

      if (this.shakeTimer > 0) {
        this.shakeTimer = Math.max(0, this.shakeTimer - delta);
      }

      this.updateParticles(delta);

      // Factor de interpolación alpha = stepTimer / stepInterval [0, 1]
      const alpha = this.state === GameState.PLAYING
        ? Math.min(1, Math.max(0, this.stepTimer / this.stepInterval))
        : 1;

      this.render(alpha);
      requestAnimationFrame(this.gameLoop.bind(this));
    }

    /**
     * Renderizado con interpolación visual entre casillas
     */
    render(alpha = 1) {
      const rect = this.canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const ctx = this.ctx;

      ctx.save();
      ctx.clearRect(0, 0, w, h);

      // Efecto de vibración de pantalla al morir (Screen Shake)
      if (this.shakeTimer > 0) {
        const shakeProgress = this.shakeTimer / SHAKE_DURATION;
        const intensity = shakeProgress * 6;
        const offsetX = (Math.random() * 2 - 1) * intensity;
        const offsetY = (Math.random() * 2 - 1) * intensity;
        ctx.translate(offsetX, offsetY);
      }

      // 1. Cuadrícula retro arcade sutil
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

      // 2. Partículas al devorar orbes
      ctx.save();
      for (let i = 0; i < this.particlePool.length; i++) {
        const p = this.particlePool[i];
        if (p.active) {
          ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // 3. Comida pulsante de alta energía
      if (this.food) {
        const fx = (this.food.x + 0.5) * this.cellSize;
        const fy = (this.food.y + 0.5) * this.cellSize;
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.16;
        const radius = (this.cellSize * 0.36) * pulse;

        ctx.save();
        ctx.shadowColor = '#ffd000';
        ctx.shadowBlur = Math.round(14 * pulse);
        ctx.fillStyle = '#ffd000';

        ctx.beginPath();
        ctx.arc(fx, fy, radius, 0, Math.PI * 2);
        ctx.fill();

        // Anillo de energía exterior
        ctx.strokeStyle = 'rgba(255, 208, 0, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(fx, fy, radius * 1.45, 0, Math.PI * 2);
        ctx.stroke();

        // Brillo interior blanco
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(fx - radius * 0.32, fy - radius * 0.32, radius * 0.32, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4. Calcular puntos de interpolación para el cuerpo continuo
      const snakeLen = this.snake.length;
      if (snakeLen >= 2 && this.prevSnake.length >= 2) {
        // Cabeza: interpolar entre posición previa y posición actual
        const hPrev = this.prevSnake[0];
        const hCurr = this.snake[0];
        const hx = hPrev.x + (hCurr.x - hPrev.x) * alpha;
        const hy = hPrev.y + (hCurr.y - hPrev.y) * alpha;
        this.renderPoints[0].x = (hx + 0.5) * this.cellSize;
        this.renderPoints[0].y = (hy + 0.5) * this.cellSize;

        // Puntos intermedios fijos del camino recorrido
        for (let j = 1; j < snakeLen - 1; j++) {
          this.renderPoints[j].x = (this.snake[j].x + 0.5) * this.cellSize;
          this.renderPoints[j].y = (this.snake[j].y + 0.5) * this.cellSize;
        }

        // Cola:
        // Si comió en el último paso, la cola no se retrae mientras crece la cabeza
        // Si no comió, la cola se desplaza suavemente de tailPrev hacia snake[last]
        const lastIdx = snakeLen - 1;
        let tx, ty;
        if (this.didEatLastStep) {
          tx = this.tailPrev.x;
          ty = this.tailPrev.y;
        } else {
          const tCurr = this.snake[lastIdx];
          tx = this.tailPrev.x + (tCurr.x - this.tailPrev.x) * alpha;
          ty = this.tailPrev.y + (tCurr.y - this.tailPrev.y) * alpha;
        }
        this.renderPoints[lastIdx].x = (tx + 0.5) * this.cellSize;
        this.renderPoints[lastIdx].y = (ty + 0.5) * this.cellSize;
        this.renderPointCount = snakeLen;

        // Grosor del cuerpo con animación de hinchazón al comer
        const baseThickness = this.cellSize * 0.74;
        const eatScale = this.eatAnimTimer > 0 
          ? 1 + 0.18 * Math.sin((this.eatAnimTimer / EAT_ANIM_DURATION) * Math.PI) 
          : 1;
        const thickness = baseThickness * eatScale;

        // Trazado continuo del cuerpo de la serpiente
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Resplandor neón exterior
        ctx.shadowColor = 'rgba(0, 230, 118, 0.45)';
        ctx.shadowBlur = Math.round(this.cellSize * 0.35);

        // Capa base: Verde esmeralda neón
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.moveTo(this.renderPoints[0].x, this.renderPoints[0].y);
        for (let i = 1; i < this.renderPointCount; i++) {
          ctx.lineTo(this.renderPoints[i].x, this.renderPoints[i].y);
        }
        ctx.stroke();

        // Resalte de fibra óptica interior
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#a7f3d0';
        ctx.lineWidth = thickness * 0.32;
        ctx.stroke();
        ctx.restore();

        // 5. Cabeza neón brillante y ojos direccionales
        const headPt = this.renderPoints[0];
        const headRadius = (thickness * 0.54);

        ctx.save();
        ctx.fillStyle = '#ffd866';
        ctx.beginPath();
        ctx.arc(headPt.x, headPt.y, headRadius, 0, Math.PI * 2);
        ctx.fill();

        // Dirección visual de la cabeza
        let dirX = this.direction.x;
        let dirY = this.direction.y;
        if (this.renderPointCount >= 2) {
          const dX = this.renderPoints[0].x - this.renderPoints[1].x;
          const dY = this.renderPoints[0].y - this.renderPoints[1].y;
          const len = Math.hypot(dX, dY);
          if (len > 0.001) {
            dirX = dX / len;
            dirY = dY / len;
          }
        }

        // Vector perpendicular para separación de los ojos
        const perpX = -dirY;
        const perpY = dirX;
        const eyeDist = headRadius * 0.52;
        const eyeForward = headRadius * 0.32;
        const eyeRadius = Math.max(2, this.cellSize * 0.13);
        const pupilRadius = Math.max(1, eyeRadius * 0.55);

        const eye1X = headPt.x + perpX * eyeDist + dirX * eyeForward;
        const eye1Y = headPt.y + perpY * eyeDist + dirY * eyeForward;
        const eye2X = headPt.x - perpX * eyeDist + dirX * eyeForward;
        const eye2Y = headPt.y - perpY * eyeDist + dirY * eyeForward;

        // Esclerótica blanca
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eye1X, eye1Y, eyeRadius, 0, Math.PI * 2);
        ctx.arc(eye2X, eye2Y, eyeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Pupila oscura que mira hacia adelante
        ctx.fillStyle = '#05070e';
        const pupilOffset = eyeRadius * 0.35;
        ctx.beginPath();
        ctx.arc(eye1X + dirX * pupilOffset, eye1Y + dirY * pupilOffset, pupilRadius, 0, Math.PI * 2);
        ctx.arc(eye2X + dirX * pupilOffset, eye2Y + dirY * pupilOffset, pupilRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      ctx.restore();
    }

    initEvents() {
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
            this.queueDirection(0, -1);
            break;
          case 'ArrowDown':
          case 's':
          case 'S':
            this.queueDirection(0, 1);
            break;
          case 'ArrowLeft':
          case 'a':
          case 'A':
            this.queueDirection(-1, 0);
            break;
          case 'ArrowRight':
          case 'd':
          case 'D':
            this.queueDirection(1, 0);
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

      // Modales y botones de cabecera
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
          this.queueDirection(dx, dy);
          setTimeout(() => btn.classList.remove('is-pressed'), 120);
        });
        btn.addEventListener('contextmenu', (e) => e.preventDefault());
      };

      bindBtn('ctrl-up', 0, -1);
      bindBtn('ctrl-down', 0, 1);
      bindBtn('ctrl-left', -1, 0);
      bindBtn('ctrl-right', 1, 0);
    }

    /**
     * Detección táctil por deslizamiento inmediata:
     * Se activa en cuanto se superan los ~20 px de umbral en touchmove,
     * sin esperar a touchend y previniendo el scroll de la página.
     */
    initSwipeGestures() {
      let touchStartX = 0;
      let touchStartY = 0;
      let isSwiping = false;

      const target = this.wrapper || this.canvas;

      const onTouchStart = (e) => {
        if (e.touches.length > 0) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
          isSwiping = true;
        }
      };

      const onTouchMove = (e) => {
        if (!isSwiping || e.touches.length === 0) return;

        // Prevenir scroll de página
        if (e.cancelable) {
          e.preventDefault();
        }

        const curX = e.touches[0].clientX;
        const curY = e.touches[0].clientY;
        const diffX = curX - touchStartX;
        const diffY = curY - touchStartY;
        const absX = Math.abs(diffX);
        const absY = Math.abs(diffY);

        if (absX >= SWIPE_THRESHOLD_PX || absY >= SWIPE_THRESHOLD_PX) {
          if (absX > absY) {
            // Movimiento horizontal
            if (diffX > 0) this.queueDirection(1, 0);
            else this.queueDirection(-1, 0);
          } else {
            // Movimiento vertical
            if (diffY > 0) this.queueDirection(0, 1);
            else this.queueDirection(0, -1);
          }

          // Reiniciar origen para permitir encadenar giros sucesivos fluidamente
          touchStartX = curX;
          touchStartY = curY;
        }
      };

      const onTouchEnd = () => {
        isSwiping = false;
      };

      target.addEventListener('touchstart', onTouchStart, { passive: false });
      target.addEventListener('touchmove', onTouchMove, { passive: false });
      target.addEventListener('touchend', onTouchEnd, { passive: true });
      target.addEventListener('touchcancel', onTouchEnd, { passive: true });
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
  });
})();
