/**
 * ROMPE MUROS - Clásico rompe-ladrillos retro-arcade en Vanilla JS (ES6+)
 * 100% offline, sin dependencias.
 * Física por subpasos anti-tunneling, ángulos dinámicos de rebote,
 * power-ups (paleta ancha, pelota lenta, multibola), niveles por datos,
 * partículas con pool fijo y control táctil suave con una sola mano.
 */
(() => {
  'use strict';

  // ==========================================================================
  // 1. CONFIGURACIÓN Y CONSTANTES DEL JUEGO
  // ==========================================================================
  const GAME_ID = 'rompemuros';

  // Coordenadas lógicas virtuales del mundo (proporción 3:4)
  const WORLD_WIDTH = 480;
  const WORLD_HEIGHT = 640;

  // Parámetros de la paleta
  const PADDLE_BASE_WIDTH = 88;
  const PADDLE_WIDE_WIDTH = 132;
  const PADDLE_HEIGHT = 14;
  const PADDLE_Y = WORLD_HEIGHT - 48;

  // Parámetros de la pelota y física
  const BALL_RADIUS = 6.5;
  const BASE_BALL_SPEED = 320;      // Velocidad inicial (píxeles/segundo)
  const MAX_BALL_SPEED = 540;       // Límite superior de velocidad
  const MIN_BALL_SPEED = 280;       // Límite inferior de velocidad
  const MAX_BALLS = 4;              // Capacidad máxima de pelotas activas
  const TRAIL_LENGTH = 7;           // Longitud de la estela de la pelota

  // Power-ups
  const POWERUP_DURATION = 11.0;    // Segundos de duración de efectos temporales
  const POWERUP_DROP_CHANCE = 0.26; // Probabilidad de soltar power-up al romper ladrillo
  const POWERUP_FALL_SPEED = 125;   // Velocidad de caída de la cápsula
  const MAX_POWERUPS = 8;           // Pool máximo de power-ups en pantalla

  // Partículas
  const PARTICLE_COUNT = 48;        // Pool preasignado de partículas (0 allocations)

  const GameState = {
    WAITING_LAUNCH: 'WAITING_LAUNCH',
    PLAYING: 'PLAYING',
    LEVEL_CLEAR: 'LEVEL_CLEAR',
    PAUSED: 'PAUSED',
    GAMEOVER: 'GAMEOVER'
  };

  // ==========================================================================
  // 2. PATRONES DECLARATIVOS DE NIVELES (DATOS, NO CÓDIGO)
  // Matriz de filas x columnas:
  // 0: Vacío | 1: Ladrillo 1 golpe (Cyan) | 2: Ladrillo 2 golpes (Ámbar) | 3: Ladrillo 3 golpes (Coral)
  // ==========================================================================
  const LEVELS = [
    // Nivel 1: Franjas Clásicas de Neón
    [
      [3, 3, 3, 3, 3, 3, 3, 3],
      [2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1]
    ],
    // Nivel 2: Pirámide Invertida con Pilares Reforzados
    [
      [3, 2, 1, 1, 1, 1, 2, 3],
      [3, 2, 2, 1, 1, 2, 2, 3],
      [0, 3, 2, 2, 2, 2, 3, 0],
      [0, 0, 3, 2, 2, 3, 0, 0],
      [0, 0, 0, 3, 3, 0, 0, 0],
      [2, 1, 0, 0, 0, 0, 1, 2]
    ],
    // Nivel 3: La Fortaleza Diamante (Núcleo blindado)
    [
      [0, 0, 2, 3, 3, 2, 0, 0],
      [0, 2, 1, 3, 3, 1, 2, 0],
      [2, 1, 1, 3, 3, 1, 1, 2],
      [3, 2, 2, 2, 2, 2, 2, 3],
      [2, 1, 1, 2, 2, 1, 1, 2],
      [0, 2, 1, 1, 1, 1, 2, 0],
      [0, 0, 2, 1, 1, 2, 0, 0]
    ]
  ];

  // Paleta sobria de los ladrillos según su resistencia
  const BRICK_CONFIG = {
    1: { color: '#e07a1f', glow: 'rgba(224, 122, 31, 0.3)', points: 10 },
    2: { color: '#d97706', glow: 'rgba(217, 119, 6, 0.3)', points: 25 },
    3: { color: '#9a3412', glow: 'rgba(154, 52, 18, 0.3)', points: 50 }
  };

  class RompeMurosGame {
    constructor() {
      // Elementos del DOM
      this.canvas = document.getElementById('breakout-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.wrapper = this.canvas.parentElement;

      this.scoreDisplay = document.getElementById('score-display');
      this.highScoreDisplay = document.getElementById('highscore-display');
      this.livesDisplay = document.getElementById('lives-display');
      this.levelDisplay = document.getElementById('level-display');

      this.launchHint = document.getElementById('launch-hint');
      this.powerupBadge = document.getElementById('powerup-badge');
      this.powerupText = document.getElementById('powerup-text');
      this.powerupTimer = document.getElementById('powerup-timer');

      this.pauseOverlay = document.getElementById('overlay-pause');
      this.gameoverOverlay = document.getElementById('overlay-gameover');
      this.levelWinOverlay = document.getElementById('overlay-level-win');
      this.finalScore = document.getElementById('final-score');
      this.finalLevel = document.getElementById('final-level');
      this.finalHighScore = document.getElementById('final-highscore');
      this.newRecordTag = document.getElementById('new-record-tag');

      // Estado general
      this.state = GameState.WAITING_LAUNCH;
      this.score = 0;
      this.highScore = window.ArcadeStorage ? window.ArcadeStorage.getHighScore(GAME_ID) : 0;
      this.lives = 3;
      this.currentLevelIndex = 0;

      // Paleta
      this.paddle = {
        x: (WORLD_WIDTH - PADDLE_BASE_WIDTH) / 2,
        y: PADDLE_Y,
        width: PADDLE_BASE_WIDTH,
        targetWidth: PADDLE_BASE_WIDTH,
        height: PADDLE_HEIGHT,
        targetX: (WORLD_WIDTH - PADDLE_BASE_WIDTH) / 2
      };

      // Pool de pelotas (permite multibola con 0 allocations)
      this.balls = Array.from({ length: MAX_BALLS }, () => ({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: BALL_RADIUS,
        active: false,
        stuck: false,
        trail: Array.from({ length: TRAIL_LENGTH }, () => ({ x: 0, y: 0 }))
      }));

      // Ladrillos del nivel actual
      this.bricks = [];

      // Power-up activo y temporizador
      this.activePowerUp = null; // 'WIDE' | 'SLOW'
      this.powerUpTimeLeft = 0;

      // Pool preasignado de power-ups cayendo
      this.powerupPool = Array.from({ length: MAX_POWERUPS }, () => ({
        x: 0,
        y: 0,
        type: 'WIDE', // 'WIDE' | 'SLOW' | 'MULTIBALL'
        width: 32,
        height: 16,
        active: false
      }));

      // Pool preasignado de partículas
      this.particlePool = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 3,
        color: '#ff3366',
        life: 0,
        maxLife: 1,
        active: false
      }));

      // Controles y tiempo
      this.lastTime = 0;
      this.shakeTimer = 0;
      this.dpr = window.devicePixelRatio || 1;
      this.scale = 1; // Factor de escala CSS píxeles a coordenadas de mundo

      // Teclas activas en PC
      this.keys = { left: false, right: false };

      this.initEvents();
      this.resizeCanvas();
      this.startNewGame();

      requestAnimationFrame(this.gameLoop.bind(this));
    }

    startNewGame() {
      this.score = 0;
      this.lives = 3;
      this.currentLevelIndex = 0;
      this.clearPowerUps();
      this.loadLevel(this.currentLevelIndex);
      this.resetBallOnPaddle();
      this.updateUI();

      this.pauseOverlay.classList.add('hidden');
      this.gameoverOverlay.classList.add('hidden');
      this.levelWinOverlay.classList.add('hidden');
      this.newRecordTag.classList.add('hidden');
      this.launchHint.classList.remove('hidden');
      this.state = GameState.WAITING_LAUNCH;
    }

    clearPowerUps() {
      this.activePowerUp = null;
      this.powerUpTimeLeft = 0;
      this.paddle.targetWidth = PADDLE_BASE_WIDTH;
      this.powerupBadge.classList.add('hidden');
      for (let i = 0; i < this.powerupPool.length; i++) {
        this.powerupPool[i].active = false;
      }
    }

    loadLevel(index) {
      this.bricks = [];
      const pattern = LEVELS[index % LEVELS.length];
      const rows = pattern.length;
      const cols = pattern[0].length;

      const paddingX = 14;
      const paddingTop = 64;
      const gapX = 6;
      const gapY = 6;

      const totalGapX = gapX * (cols - 1);
      const brickW = (WORLD_WIDTH - paddingX * 2 - totalGapX) / cols;
      const brickH = 18;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const type = pattern[r][c];
          if (type > 0) {
            this.bricks.push({
              x: paddingX + c * (brickW + gapX),
              y: paddingTop + r * (brickH + gapY),
              w: brickW,
              h: brickH,
              hp: type,
              maxHp: type,
              type: type,
              active: true
            });
          }
        }
      }
    }

    resetBallOnPaddle() {
      // Desactivar todas las pelotas menos la primera
      for (let i = 1; i < this.balls.length; i++) {
        this.balls[i].active = false;
      }

      const primaryBall = this.balls[0];
      primaryBall.active = true;
      primaryBall.stuck = true;
      primaryBall.x = this.paddle.x + this.paddle.width / 2;
      primaryBall.y = this.paddle.y - primaryBall.radius;
      primaryBall.vx = 0;
      primaryBall.vy = 0;

      // Inicializar estela
      for (let t = 0; t < primaryBall.trail.length; t++) {
        primaryBall.trail[t].x = primaryBall.x;
        primaryBall.trail[t].y = primaryBall.y;
      }

      this.launchHint.classList.remove('hidden');
      this.state = GameState.WAITING_LAUNCH;
    }

    launchBall() {
      if (this.state !== GameState.WAITING_LAUNCH) return;
      const primaryBall = this.balls[0];
      if (!primaryBall.active || !primaryBall.stuck) return;

      // Ángulo de saque ligeramente aleatorio hacia arriba
      const launchAngle = (Math.random() * 0.4 - 0.2); // Entre -11° y +11°
      const speed = this.getCurrentSpeed();

      primaryBall.vx = speed * Math.sin(launchAngle);
      primaryBall.vy = -speed * Math.cos(launchAngle);
      primaryBall.stuck = false;

      this.launchHint.classList.add('hidden');
      this.state = GameState.PLAYING;

      if (window.ArcadeAudio) window.ArcadeAudio.playHitPaddle();
      if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(10);
    }

    getCurrentSpeed() {
      // Velocidad que incrementa sutilmente con cada nivel
      let spd = BASE_BALL_SPEED + this.currentLevelIndex * 24;
      if (this.activePowerUp === 'SLOW') {
        spd *= 0.72; // Reducción del 28% con power-up Slow
      }
      return Math.min(MAX_BALL_SPEED, Math.max(MIN_BALL_SPEED, spd));
    }

    /**
     * Activa un Power-Up recogido
     */
    applyPowerUp(type) {
      if (window.ArcadeAudio) window.ArcadeAudio.playPowerUp();
      if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(25);

      if (type === 'MULTIBALL') {
        // Encontrar una pelota activa para clonar
        const srcBall = this.balls.find(b => b.active && !b.stuck) || this.balls[0];
        if (srcBall) {
          const angles = [-0.42, 0.42]; // Desviación angular de ~24 grados
          let spawnCount = 0;
          for (let i = 0; i < this.balls.length && spawnCount < 2; i++) {
            const b = this.balls[i];
            if (!b.active) {
              b.active = true;
              b.stuck = false;
              b.x = srcBall.x;
              b.y = srcBall.y;
              const curSpd = Math.hypot(srcBall.vx, srcBall.vy) || this.getCurrentSpeed();
              const baseAngle = Math.atan2(srcBall.vy, srcBall.vx);
              const newAngle = baseAngle + angles[spawnCount];
              b.vx = curSpd * Math.cos(newAngle);
              b.vy = curSpd * Math.sin(newAngle);
              for (let t = 0; t < b.trail.length; t++) {
                b.trail[t].x = b.x;
                b.trail[t].y = b.y;
              }
              spawnCount++;
            }
          }
        }
        return;
      }

      this.activePowerUp = type;
      this.powerUpTimeLeft = POWERUP_DURATION;

      if (type === 'WIDE') {
        this.paddle.targetWidth = PADDLE_WIDE_WIDTH;
        this.powerupText.textContent = 'PALETA ANCHA';
        const pIcon = document.getElementById('powerup-icon');
        if (pIcon) pIcon.innerHTML = window.ArcadeIcons ? ArcadeIcons.getSvg('swap', 14) : '';
      } else if (type === 'SLOW') {
        this.paddle.targetWidth = PADDLE_BASE_WIDTH;
        this.powerupText.textContent = 'PELOTA LENTA';
        const pIcon = document.getElementById('powerup-icon');
        if (pIcon) pIcon.innerHTML = window.ArcadeIcons ? ArcadeIcons.getSvg('speed', 14) : '';
        // Ajustar velocidad de pelotas activas
        const targetSpd = this.getCurrentSpeed();
        this.balls.forEach(b => {
          if (b.active && !b.stuck) {
            const angle = Math.atan2(b.vy, b.vx);
            b.vx = targetSpd * Math.cos(angle);
            b.vy = targetSpd * Math.sin(angle);
          }
        });
      }

      this.powerupBadge.classList.remove('hidden');
    }

    spawnPowerUp(x, y) {
      if (Math.random() > POWERUP_DROP_CHANCE) return;

      const types = ['WIDE', 'SLOW', 'MULTIBALL'];
      const chosen = types[Math.floor(Math.random() * types.length)];

      const item = this.powerupPool.find(p => !p.active);
      if (item) {
        item.x = x - item.width / 2;
        item.y = y;
        item.type = chosen;
        item.active = true;
      }
    }

    spawnBrickParticles(bx, by, bw, bh, color) {
      let spawned = 0;
      for (let i = 0; i < this.particlePool.length && spawned < 10; i++) {
        const p = this.particlePool[i];
        if (!p.active) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 70 + Math.random() * 150;
          p.x = bx + Math.random() * bw;
          p.y = by + Math.random() * bh;
          p.vx = Math.cos(angle) * speed;
          p.vy = Math.sin(angle) * speed;
          p.size = 2 + Math.random() * 3;
          p.color = color;
          p.life = 0.35 + Math.random() * 0.25;
          p.maxLife = p.life;
          p.active = true;
          spawned++;
        }
      }
    }

    triggerLoseLife() {
      this.lives--;
      this.shakeTimer = 0.35; // Temblor de pantalla de 350ms
      if (window.ArcadeAudio) window.ArcadeAudio.playLoseLife();
      if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(50);

      // Limpiar power-up activo al perder una vida
      this.clearPowerUps();
      this.updateUI();

      if (this.lives <= 0) {
        this.triggerGameOver();
      } else {
        this.resetBallOnPaddle();
      }
    }

    triggerLevelWin() {
      this.state = GameState.LEVEL_CLEAR;
      this.score += 500; // Bonus por muro destruido
      this.updateUI();

      if (window.ArcadeAudio) window.ArcadeAudio.playLevelWin();
      if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(40);

      this.levelWinOverlay.classList.remove('hidden');

      setTimeout(() => {
        this.levelWinOverlay.classList.add('hidden');
        this.currentLevelIndex++;
        this.clearPowerUps();
        this.loadLevel(this.currentLevelIndex);
        this.resetBallOnPaddle();
        this.updateUI();
      }, 1600);
    }

    triggerGameOver() {
      this.state = GameState.GAMEOVER;
      if (window.ArcadeAudio) window.ArcadeAudio.playGameOver();
      if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(70);

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
      this.finalLevel.textContent = this.currentLevelIndex + 1;
      this.finalHighScore.textContent = this.highScore;

      this.gameoverOverlay.classList.remove('hidden');
    }

    togglePause() {
      if (this.state === GameState.GAMEOVER || this.state === GameState.LEVEL_CLEAR) return;

      if (this.state === GameState.PLAYING || this.state === GameState.WAITING_LAUNCH) {
        this.previousState = this.state;
        this.state = GameState.PAUSED;
        this.pauseOverlay.classList.remove('hidden');
      } else if (this.state === GameState.PAUSED) {
        this.state = this.previousState || GameState.PLAYING;
        this.pauseOverlay.classList.add('hidden');
      }
    }

    updateUI() {
      this.scoreDisplay.textContent = this.score;
      this.highScoreDisplay.textContent = this.highScore;
      this.levelDisplay.textContent = this.currentLevelIndex + 1;

      // Iconos de vidas
      let heartsHtml = '';
      for (let i = 0; i < 3; i++) {
        const isFilled = i < this.lives;
        heartsHtml += window.ArcadeIcons
          ? ArcadeIcons.getSvg(isFilled ? 'heart' : 'heartOutline', 14)
          : (isFilled ? '3' : '0');
      }
      this.livesDisplay.innerHTML = heartsHtml;
    }

    resizeCanvas() {
      if (window.ArcadeCanvas) {
        const result = window.ArcadeCanvas.fit(this.canvas, this.wrapper, 3, 4, 8);
        this.scale = result.width / WORLD_WIDTH;
        this.dpr = result.dpr;
      }
    }

    // ==========================================================================
    // 3. FÍSICA Y SIMULACIÓN CON SUBPASOS
    // ==========================================================================
    update(dt) {
      // 1. Manejo del teclado en PC
      const keyboardSpeed = 480; // px/segundo
      if (this.keys.left) {
        this.paddle.targetX = Math.max(0, this.paddle.targetX - keyboardSpeed * dt);
      }
      if (this.keys.right) {
        this.paddle.targetX = Math.min(WORLD_WIDTH - this.paddle.width, this.paddle.targetX + keyboardSpeed * dt);
      }

      // 2. Suavizado (Lerp) de la paleta y ajuste de ancho
      const lerpSpeed = 1 - Math.exp(-dt * 26);
      this.paddle.x += (this.paddle.targetX - this.paddle.x) * lerpSpeed;
      this.paddle.width += (this.paddle.targetWidth - this.paddle.width) * (1 - Math.exp(-dt * 12));
      this.paddle.x = Math.max(0, Math.min(WORLD_WIDTH - this.paddle.width, this.paddle.x));

      // 3. Temporizador de Power-Up
      if (this.activePowerUp && this.powerUpTimeLeft > 0) {
        this.powerUpTimeLeft -= dt;
        this.powerupTimer.textContent = `${Math.ceil(this.powerUpTimeLeft)}s`;
        if (this.powerUpTimeLeft <= 0) {
          this.clearPowerUps();
        }
      }

      // 4. Si la pelota está esperando saque, acompañar a la paleta
      if (this.state === GameState.WAITING_LAUNCH) {
        const primary = this.balls[0];
        primary.x = this.paddle.x + this.paddle.width / 2;
        primary.y = this.paddle.y - primary.radius;
        return;
      }

      if (this.state !== GameState.PLAYING) return;

      // 5. Caída y colisión de Power-Ups
      for (let i = 0; i < this.powerupPool.length; i++) {
        const p = this.powerupPool[i];
        if (p.active) {
          p.y += POWERUP_FALL_SPEED * dt;

          // Colisión con la paleta
          if (
            p.y + p.height >= this.paddle.y &&
            p.y <= this.paddle.y + this.paddle.height &&
            p.x + p.width >= this.paddle.x &&
            p.x <= this.paddle.x + this.paddle.width
          ) {
            p.active = false;
            this.applyPowerUp(p.type);
          } else if (p.y > WORLD_HEIGHT) {
            p.active = false;
          }
        }
      }

      // 6. Subpasos para cada pelota para evitar tunneling a alta velocidad
      let activeBallsCount = 0;

      for (let bIdx = 0; bIdx < this.balls.length; bIdx++) {
        const ball = this.balls[bIdx];
        if (!ball.active || ball.stuck) continue;

        activeBallsCount++;

        // Actualizar estela
        for (let t = ball.trail.length - 1; t > 0; t--) {
          ball.trail[t].x = ball.trail[t - 1].x;
          ball.trail[t].y = ball.trail[t - 1].y;
        }
        ball.trail[0].x = ball.x;
        ball.trail[0].y = ball.y;

        const ballSpeed = Math.hypot(ball.vx, ball.vy);
        const distance = ballSpeed * dt;
        // Dividir el movimiento en subpasos proporcionales al radio
        const substeps = Math.max(1, Math.min(8, Math.ceil(distance / (ball.radius * 0.75))));
        const subDt = dt / substeps;

        for (let step = 0; step < substeps; step++) {
          ball.x += ball.vx * subDt;
          ball.y += ball.vy * subDt;

          // Colisión contra paredes laterales
          if (ball.x - ball.radius <= 0) {
            ball.x = ball.radius;
            ball.vx = Math.abs(ball.vx);
            if (window.ArcadeAudio) window.ArcadeAudio.playHitPaddle();
          } else if (ball.x + ball.radius >= WORLD_WIDTH) {
            ball.x = WORLD_WIDTH - ball.radius;
            ball.vx = -Math.abs(ball.vx);
            if (window.ArcadeAudio) window.ArcadeAudio.playHitPaddle();
          }

          // Colisión contra techo
          if (ball.y - ball.radius <= 0) {
            ball.y = ball.radius;
            ball.vy = Math.abs(ball.vy);
            if (window.ArcadeAudio) window.ArcadeAudio.playHitPaddle();
          }

          // Colisión con la paleta (solo cuando va cayendo hacia abajo)
          if (ball.vy > 0) {
            const paddleTop = this.paddle.y;
            const paddleBottom = this.paddle.y + this.paddle.height;
            const paddleLeft = this.paddle.x;
            const paddleRight = this.paddle.x + this.paddle.width;

            if (
              ball.y + ball.radius >= paddleTop &&
              ball.y - ball.radius <= paddleBottom &&
              ball.x + ball.radius >= paddleLeft &&
              ball.x - ball.radius <= paddleRight
            ) {
              // Ángulo de rebote según el punto de impacto relativo (-1 a +1)
              const hitOffset = (ball.x - (paddleLeft + this.paddle.width / 2)) / (this.paddle.width / 2);
              const clampedOffset = Math.max(-1, Math.min(1, hitOffset));

              // Máximo ángulo de desviación: 68° desde la vertical
              const maxAngle = Math.PI * 0.38;
              const bounceAngle = clampedOffset * maxAngle;

              let currentSpeed = Math.hypot(ball.vx, ball.vy) * 1.008; // Suave aceleración
              currentSpeed = Math.max(MIN_BALL_SPEED, Math.min(MAX_BALL_SPEED, currentSpeed));

              ball.vx = currentSpeed * Math.sin(bounceAngle);
              ball.vy = -currentSpeed * Math.cos(bounceAngle);

              // Garantizar que la velocidad vertical no sea casi horizontal
              if (Math.abs(ball.vy) < currentSpeed * 0.28) {
                ball.vy = -currentSpeed * 0.28;
                ball.vx = Math.sign(ball.vx) * Math.sqrt(currentSpeed * currentSpeed - ball.vy * ball.vy);
              }

              ball.y = paddleTop - ball.radius; // Reposicionar arriba de la paleta

              if (window.ArcadeAudio) window.ArcadeAudio.playHitPaddle();
              if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(12);
            }
          }

          // Colisión con ladrillos
          let brickHit = false;
          for (let i = 0; i < this.bricks.length; i++) {
            const b = this.bricks[i];
            if (!b.active) continue;

            // Punto más cercano del rectángulo del ladrillo a la pelota
            const closestX = Math.max(b.x, Math.min(ball.x, b.x + b.w));
            const closestY = Math.max(b.y, Math.min(ball.y, b.y + b.h));
            const distX = ball.x - closestX;
            const distY = ball.y - closestY;

            if (distX * distX + distY * distY <= ball.radius * ball.radius) {
              brickHit = true;

              // Determinar orientación del rebote
              const overlapX = ball.radius - Math.abs(distX);
              const overlapY = ball.radius - Math.abs(distY);

              if (overlapX < overlapY) {
                ball.vx = distX > 0 ? Math.abs(ball.vx) : -Math.abs(ball.vx);
              } else {
                ball.vy = distY > 0 ? Math.abs(ball.vy) : -Math.abs(ball.vy);
              }

              // Aplicar daño al ladrillo
              b.hp--;
              if (b.hp <= 0) {
                b.active = false;
                const conf = BRICK_CONFIG[b.type] || BRICK_CONFIG[1];
                this.score += conf.points * (this.currentLevelIndex + 1);

                this.spawnBrickParticles(b.x, b.y, b.w, b.h, conf.color);
                this.spawnPowerUp(b.x + b.w / 2, b.y + b.h / 2);

                if (window.ArcadeAudio) window.ArcadeAudio.playBrickBreak();
                if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(16);
              } else {
                // Impacto en ladrillo reforzado
                this.spawnBrickParticles(b.x, b.y, b.w, b.h, '#ffffff');
                if (window.ArcadeAudio) window.ArcadeAudio.playHitBrick();
                if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(10);
              }

              this.updateUI();

              // Comprobar si se eliminaron todos los ladrillos
              if (this.bricks.every(brick => !brick.active)) {
                this.triggerLevelWin();
                return;
              }

              break; // Resolver solo 1 impacto por subpaso
            }
          }

          // Salida de la pelota por el fondo
          if (ball.y - ball.radius > WORLD_HEIGHT) {
            ball.active = false;
            break;
          }
        }
      }

      // Si no quedan pelotas activas en juego, se pierde 1 vida
      const anyBallActive = this.balls.some(b => b.active);
      if (!anyBallActive) {
        this.triggerLoseLife();
      }
    }

    // ==========================================================================
    // 4. BUCLE PRINCIPAL Y RENDERIZADO
    // ==========================================================================
    gameLoop(time = 0) {
      const delta = Math.min((time - this.lastTime) / 1000, 0.08);
      this.lastTime = time;

      if (this.state === GameState.PLAYING || this.state === GameState.WAITING_LAUNCH) {
        this.update(delta);
      }

      // Actualizar partículas
      for (let i = 0; i < this.particlePool.length; i++) {
        const p = this.particlePool[i];
        if (p.active) {
          p.x += p.vx * delta;
          p.y += p.vy * delta;
          p.life -= delta;
          if (p.life <= 0) p.active = false;
        }
      }

      if (this.shakeTimer > 0) {
        this.shakeTimer = Math.max(0, this.shakeTimer - delta);
      }

      this.render();
      requestAnimationFrame(this.gameLoop.bind(this));
    }

    render() {
      const rect = this.canvas.getBoundingClientRect();
      const ctx = this.ctx;

      ctx.save();
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Vibración de pantalla al perder una vida
      if (this.shakeTimer > 0) {
        const shakeMag = (this.shakeTimer / 0.35) * 6;
        const sx = (Math.random() * 2 - 1) * shakeMag;
        const sy = (Math.random() * 2 - 1) * shakeMag;
        ctx.translate(sx, sy);
      }

      // Escalar coordenadas del mundo virtual al tamaño real del canvas
      ctx.scale(this.scale, this.scale);

      // 1. Fondo sutil de cuadrícula arcade
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      const step = 32;
      for (let x = step; x < WORLD_WIDTH; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, WORLD_HEIGHT);
        ctx.stroke();
      }
      for (let y = step; y < WORLD_HEIGHT; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WORLD_WIDTH, y);
        ctx.stroke();
      }

      // 2. Ladrillos con degradados neón y grietas visuales
      for (let i = 0; i < this.bricks.length; i++) {
        const b = this.bricks[i];
        if (!b.active) continue;

        const conf = BRICK_CONFIG[b.type] || BRICK_CONFIG[1];
        ctx.save();
        ctx.shadowColor = conf.glow;
        ctx.shadowBlur = 8;

        // Degradado del ladrillo
        const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
        grad.addColorStop(0, conf.color);
        grad.addColorStop(1, '#070913');

        ctx.fillStyle = grad;
        ctx.strokeStyle = conf.color;
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 4);
        ctx.fill();
        ctx.stroke();

        // Resalte de luz superior
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(b.x + 3, b.y + 2, b.w - 6, 2);

        // Grietas si está dañado
        if (b.hp < b.maxHp) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(b.x + b.w * 0.3, b.y + 2);
          ctx.lineTo(b.x + b.w * 0.45, b.y + b.h * 0.6);
          ctx.lineTo(b.x + b.w * 0.7, b.y + b.h - 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      // 3. Cápsulas de Power-Ups que caen
      for (let i = 0; i < this.powerupPool.length; i++) {
        const p = this.powerupPool[i];
        if (p.active) {
          ctx.save();
          let pColor = '#f59e0b';
          let pLabel = 'W';
          if (p.type === 'SLOW') { pColor = '#38bdf8'; pLabel = 'S'; }
          if (p.type === 'MULTIBALL') { pColor = '#10b981'; pLabel = '3x'; }

          ctx.fillStyle = pColor;
          ctx.beginPath();
          ctx.roundRect(p.x, p.y, p.width, p.height, 6);
          ctx.fill();

          ctx.fillStyle = '#1c1311';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(pLabel, p.x + p.width / 2, p.y + p.height / 2);
          ctx.restore();
        }
      }

      // 4. Paleta arcade con resplandor neón
      ctx.save();
      const pColor = this.activePowerUp === 'WIDE' ? '#ffd000' : '#ff3366';
      ctx.shadowColor = pColor;
      ctx.shadowBlur = 12;

      const paddleGrad = ctx.createLinearGradient(this.paddle.x, this.paddle.y, this.paddle.x, this.paddle.y + this.paddle.height);
      paddleGrad.addColorStop(0, '#ffffff');
      paddleGrad.addColorStop(0.3, pColor);
      paddleGrad.addColorStop(1, '#070913');

      ctx.fillStyle = paddleGrad;
      ctx.strokeStyle = pColor;
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 6);
      ctx.fill();
      ctx.stroke();

      // Franja de energía central en la paleta
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this.paddle.x + this.paddle.width * 0.35, this.paddle.y + 3, this.paddle.width * 0.3, 3);
      ctx.restore();

      // 5. Pelotas con estela luminosa
      for (let bIdx = 0; bIdx < this.balls.length; bIdx++) {
        const ball = this.balls[bIdx];
        if (!ball.active) continue;

        // Estela
        if (!ball.stuck) {
          ctx.save();
          for (let t = ball.trail.length - 1; t >= 0; t--) {
            const alpha = (1 - t / ball.trail.length) * 0.35;
            const r = ball.radius * (1 - t / (ball.trail.length * 1.5));
            ctx.fillStyle = `rgba(224, 122, 31, ${alpha})`;
            ctx.beginPath();
            ctx.arc(ball.trail[t].x, ball.trail[t].y, r, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // Pelota principal
        ctx.save();
        ctx.fillStyle = '#4a2412';

        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();

        // Núcleo terracota
        ctx.fillStyle = '#e07a1f';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 6. Partículas brillantes
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

      ctx.restore();
    }

    // ==========================================================================
    // 5. EVENTOS Y CONTROLES (MÓVIL PRIMERO + PC)
    // ==========================================================================
    initEvents() {
      const onResize = () => this.resizeCanvas();
      window.addEventListener('resize', onResize);
      window.addEventListener('orientationchange', () => setTimeout(onResize, 100));

      if (window.ResizeObserver) {
        const ro = new ResizeObserver(onResize);
        ro.observe(this.wrapper);
      }

      // Control táctil por arrastre suave en cualquier parte de la pantalla
      const targetArea = this.wrapper || this.canvas;

      const handleTouch = (touch) => {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = touch.clientX;
        const relativeX = ((clientX - rect.left) / rect.width) * WORLD_WIDTH;
        this.paddle.targetX = Math.max(0, Math.min(WORLD_WIDTH - this.paddle.width, relativeX - this.paddle.width / 2));
      };

      targetArea.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
          handleTouch(e.touches[0]);
          if (this.state === GameState.WAITING_LAUNCH) {
            this.launchBall();
          }
        }
      }, { passive: false });

      targetArea.addEventListener('touchmove', (e) => {
        if (e.cancelable) e.preventDefault();
        if (e.touches.length > 0) {
          handleTouch(e.touches[0]);
        }
      }, { passive: false });

      // Control por ratón en PC
      targetArea.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const relativeX = ((e.clientX - rect.left) / rect.width) * WORLD_WIDTH;
        this.paddle.targetX = Math.max(0, Math.min(WORLD_WIDTH - this.paddle.width, relativeX - this.paddle.width / 2));
      });

      targetArea.addEventListener('click', () => {
        if (this.state === GameState.WAITING_LAUNCH) {
          this.launchBall();
        }
      });

      // Teclado
      window.addEventListener('keydown', (e) => {
        if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
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

        if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          if (this.state === GameState.WAITING_LAUNCH) {
            this.launchBall();
          }
        }

        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          this.keys.left = true;
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          this.keys.right = true;
        }
      });

      window.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          this.keys.left = false;
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          this.keys.right = false;
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

      // Modales y botones superiores
      document.getElementById('btn-pause-header').addEventListener('click', () => this.togglePause());
      document.getElementById('btn-restart-header').addEventListener('click', () => this.startNewGame());
      document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());
      document.getElementById('btn-pause-restart').addEventListener('click', () => this.startNewGame());
      document.getElementById('btn-gameover-restart').addEventListener('click', () => this.startNewGame());
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    new RompeMurosGame();
  });
})();
