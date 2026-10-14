/**
 * games/fronton/game.js - Frontón Arcade 80
 * Duelo retro de paletas y pelota cuántica con perspectiva 3D, física de aceleración y 2P móvil.
 */
(() => {
  'use strict';

  // ==========================================
  // CONFIGURACIÓN Y CONSTANTES DE BALANCE
  // ==========================================
  const CONFIG = {
    WINNING_SCORE: 7,
    VIRTUAL_W: 480,
    VIRTUAL_H: 640,
    PADDLE_W: 86,
    PADDLE_H: 14,
    PADDLE_DEPTH: 10,
    P1_Y: 575,
    P2_Y: 65,
    BALL_RADIUS: 8,
    BASE_SPEED: 320,
    ACCEL_PER_HIT: 24,
    MAX_SPEED: 720,
    MAX_BOUNCE_ANGLE: Math.PI * 0.38, // 68 grados aprox
    POINT_DELAY: 1.1, // segundos de pausa tras punto
    DIFFICULTIES: {
      EASY: { label: 'NOVATO', speed: 250, errorRate: 26, reactionLag: 0.16 },
      MED:  { label: 'PRO',    speed: 380, errorRate: 12, reactionLag: 0.08 },
      HARD: { label: 'CYBER',  speed: 530, errorRate: 2,  reactionLag: 0.02 }
    },
    PARTICLE_POOL_SIZE: 60,
    STORAGE_KEY: 'fronton:v1'
  };

  // ==========================================
  // MATEMÁTICA Y FÍSICA PURA (Testeable en Node)
  // ==========================================
  const FrontonPhysics = {
    /**
     * Calcula nuevo vector de velocidad tras rebotar en la paleta
     * @param {number} ballX
     * @param {number} paddleX
     * @param {number} paddleW
     * @param {number} currentSpeed
     * @param {boolean} isTopPaddle (true = P2 va hacia abajo, false = P1 va hacia arriba)
     * @returns {{vx: number, vy: number, newSpeed: number}}
     */
    calculatePaddleRebound(ballX, paddleX, paddleW, currentSpeed, isTopPaddle) {
      const halfW = paddleW / 2;
      const offset = (ballX - paddleX) / halfW;
      const clampedOffset = Math.max(-1, Math.min(1, offset));

      const angle = clampedOffset * CONFIG.MAX_BOUNCE_ANGLE;
      const newSpeed = Math.min(CONFIG.MAX_SPEED, currentSpeed + CONFIG.ACCEL_PER_HIT);

      const vx = newSpeed * Math.sin(angle);
      const vy = (isTopPaddle ? 1 : -1) * newSpeed * Math.cos(angle);

      return { vx, vy, newSpeed };
    },

    /**
     * Decide si un punto Y pertenece a la zona de Jugador 1 o Jugador 2
     * @param {number} y - Coordenada vertical relativa al tablero (0 a H)
     * @param {number} h - Altura total del tablero
     * @returns {'P1'|'P2'}
     */
    classifyTouchZone(y, h) {
      return y < h * 0.5 ? 'P2' : 'P1';
    },

    /**
     * Limita la posición X de una paleta a los límites del campo
     */
    clampPaddleX(x, paddleW, courtW) {
      const half = paddleW / 2;
      return Math.max(half + 12, Math.min(courtW - half - 12, x));
    }
  };

  // Exportar para pruebas Node
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, FrontonPhysics };
    return;
  }

  // ==========================================
  // POOL DE PARTÍCULAS (Cero alloc en loop)
  // ==========================================
  class ParticlePool {
    constructor(size) {
      this.size = size;
      this.items = new Array(size);
      for (let i = 0; i < size; i++) {
        this.items[i] = {
          active: false,
          x: 0, y: 0,
          vx: 0, vy: 0,
          life: 0, maxLife: 1,
          size: 2,
          color: '#00f0ff'
        };
      }
    }

    spawn(x, y, vx, vy, life, size, color) {
      for (let i = 0; i < this.size; i++) {
        const p = this.items[i];
        if (!p.active) {
          p.active = true;
          p.x = x; p.y = y;
          p.vx = vx; p.vy = vy;
          p.life = life; p.maxLife = life;
          p.size = size;
          p.color = color;
          return;
        }
      }
    }

    burst(x, y, count, color) {
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 60 + Math.random() * 160;
        this.spawn(
          x, y,
          Math.cos(ang) * spd,
          Math.sin(ang) * spd,
          0.3 + Math.random() * 0.35,
          2 + Math.random() * 3,
          color
        );
      }
    }

    update(dt) {
      for (let i = 0; i < this.size; i++) {
        const p = this.items[i];
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

    render(ctx) {
      for (let i = 0; i < this.size; i++) {
        const p = this.items[i];
        if (p.active) {
          const alpha = Math.max(0, p.life / p.maxLife);
          ctx.save();
          ctx.globalAlpha = alpha;
          // Halo exterior rápido sin shadowBlur
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * alpha * 1.5, 0, Math.PI * 2);
          ctx.fill();
          // Núcleo brillante
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * alpha * 0.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }
  }

  // ==========================================
  // ESTADO DEL JUEGO
  // ==========================================
  const State = {
    mode: '1P', // '1P' vs IA, o '2P' local en el mismo teléfono
    difficulty: 'MED',
    p1Score: 0,
    p2Score: 0,
    rally: 0,
    bestRally: 0,
    paused: false,
    started: false,
    gameOver: false,
    serving: true,
    serveTimer: 0,
    server: 'P1', // quién saca ('P1' o 'P2')

    // Posiciones
    p1: { x: CONFIG.VIRTUAL_W / 2, targetX: CONFIG.VIRTUAL_W / 2 },
    p2: { x: CONFIG.VIRTUAL_W / 2, targetX: CONFIG.VIRTUAL_W / 2 },

    // Pelota
    ball: {
      x: CONFIG.VIRTUAL_W / 2,
      y: CONFIG.VIRTUAL_H / 2,
      vx: 0,
      vy: 0,
      speed: CONFIG.BASE_SPEED,
      spin: 0
    },

    // IA
    aiLagTimer: 0,
    aiTargetX: CONFIG.VIRTUAL_W / 2,

    // Controles táctiles mapeados por touchId
    touches: new Map(),

    // Escalado de pantalla
    scale: 1,
    offsetX: 0,
    offsetY: 0
  };

  const particles = new ParticlePool(CONFIG.PARTICLE_POOL_SIZE);

  // ==========================================
  // REFERENCIAS DOM
  // ==========================================
  const dom = {
    canvas: document.getElementById('fronton-canvas'),
    ctx: null,
    p1Score: document.getElementById('p1-score'),
    p2Score: document.getElementById('p2-score'),
    p2Tag: document.getElementById('p2-tag'),
    matchRally: document.getElementById('match-rally'),
    startCard: document.getElementById('start-card'),
    btnStart: document.getElementById('btn-start-match'),
    difficultyGroup: document.getElementById('difficulty-group'),
    diffDesc: document.getElementById('diff-desc'),
    controlLegend: document.getElementById('control-legend'),
    pointBanner: document.getElementById('point-banner'),
    pointText: document.getElementById('point-text'),
    pointSub: document.getElementById('point-sub'),
    overlayPause: document.getElementById('overlay-pause'),
    btnPauseHeader: document.getElementById('btn-pause-header'),
    btnResume: document.getElementById('btn-resume'),
    btnRestartHeader: document.getElementById('btn-restart-header'),
    btnPauseRestart: document.getElementById('btn-pause-restart'),
    overlayGameOver: document.getElementById('overlay-gameover'),
    winnerTitle: document.getElementById('winner-title'),
    winnerSub: document.getElementById('winner-sub'),
    finalP1Score: document.getElementById('final-p1-score'),
    finalP2Score: document.getElementById('final-p2-score'),
    bestRallyDisplay: document.getElementById('best-rally'),
    btnMatchRestart: document.getElementById('btn-match-restart'),
    btnSoundToggle: document.getElementById('btn-sound-toggle'),
    iconSoundOn: document.getElementById('icon-sound-on'),
    iconSoundOff: document.getElementById('icon-sound-off'),
    modeButtons: document.querySelectorAll('.btn-toggle'),
    diffButtons: document.querySelectorAll('.btn-diff')
  };

  dom.ctx = dom.canvas.getContext('2d');

  // ==========================================
  // AUDIO HELPER CON WEBAUDIO SINTETIZADO
  // ==========================================
  function playBeep(type) {
    if (!window.ArcadeAudio) return;
    switch (type) {
      case 'paddle-p1':
        window.ArcadeAudio.playTone(520 + Math.min(State.rally * 15, 300), 'square', 0.06, 0.12);
        break;
      case 'paddle-p2':
        window.ArcadeAudio.playTone(390 + Math.min(State.rally * 15, 300), 'square', 0.06, 0.12);
        break;
      case 'wall':
        window.ArcadeAudio.playTone(240, 'triangle', 0.04, 0.08);
        break;
      case 'point':
        window.ArcadeAudio.playTone(660, 'sine', 0.14, 0.16);
        setTimeout(() => window.ArcadeAudio?.playTone(880, 'sine', 0.18, 0.16), 100);
        break;
      case 'lose-point':
        window.ArcadeAudio.playTone(180, 'sawtooth', 0.18, 0.14);
        break;
      case 'win-match':
        [523, 659, 784, 1046].forEach((f, i) => {
          setTimeout(() => window.ArcadeAudio?.playTone(f, 'square', 0.12, 0.18), i * 110);
        });
        break;
      default:
        break;
    }
  }

  // ==========================================
  // RESIZE Y AJUSTE DE RESOLUCIÓN (RETINA / MOBILE)
  // ==========================================
  function handleResize() {
    const parent = dom.canvas.parentElement;
    if (!parent) return;

    const fit = window.ArcadeCanvas.fit(
      dom.canvas,
      parent,
      CONFIG.VIRTUAL_W,
      CONFIG.VIRTUAL_H,
      8
    );

    State.scale = fit.width / CONFIG.VIRTUAL_W;
  }

  window.addEventListener('resize', handleResize);

  // ==========================================
  // CONTROLADOR DE SAQUE Y PUNTOS
  // ==========================================
  function resetBall(servingPlayer = 'P1') {
    State.serving = true;
    State.serveTimer = CONFIG.POINT_DELAY;
    State.server = servingPlayer;
    State.rally = 0;
    updateHUD();

    State.ball.x = CONFIG.VIRTUAL_W / 2;
    State.ball.y = servingPlayer === 'P1' ? CONFIG.P1_Y - 30 : CONFIG.P2_Y + 30;
    State.ball.vx = 0;
    State.ball.vy = 0;
    State.ball.speed = CONFIG.BASE_SPEED;

    // Colocar paletas centradas suavemente
    State.p1.targetX = CONFIG.VIRTUAL_W / 2;
    State.p2.targetX = CONFIG.VIRTUAL_W / 2;
  }

  function launchServe() {
    State.serving = false;
    const isP1 = State.server === 'P1';
    const angle = (Math.random() * 0.5 - 0.25) * CONFIG.MAX_BOUNCE_ANGLE;
    State.ball.speed = CONFIG.BASE_SPEED;
    State.ball.vx = State.ball.speed * Math.sin(angle);
    State.ball.vy = (isP1 ? -1 : 1) * State.ball.speed * Math.cos(angle);
    playBeep(isP1 ? 'paddle-p1' : 'paddle-p2');
    window.ArcadeCanvas.haptic(16);
  }

  function awardPoint(winner) {
    if (winner === 'P1') {
      State.p1Score++;
      playBeep('point');
      window.ArcadeCanvas.haptic(28);
      showPointBanner('¡PUNTO P1!', State.mode === '1P' ? 'Anotaste contra la IA' : 'Jugador 1 suma');
    } else {
      State.p2Score++;
      playBeep(State.mode === '1P' ? 'lose-point' : 'point');
      window.ArcadeCanvas.haptic(35);
      showPointBanner('¡PUNTO P2!', State.mode === '1P' ? 'Punto para la IA' : 'Jugador 2 suma');
    }

    if (State.rally > State.bestRally) {
      State.bestRally = State.rally;
      try {
        window.ArcadeStorage?.setHighScore(CONFIG.STORAGE_KEY, State.bestRally);
      } catch (e) {}
    }

    updateHUD();

    // Comprobar victoria a 7 puntos
    if (State.p1Score >= CONFIG.WINNING_SCORE || State.p2Score >= CONFIG.WINNING_SCORE) {
      endMatch(winner);
    } else {
      // El que anota realiza el siguiente saque
      resetBall(winner);
    }
  }

  function showPointBanner(title, sub) {
    dom.pointText.textContent = title;
    dom.pointSub.textContent = sub;
    dom.pointBanner.classList.remove('hidden');
    setTimeout(() => {
      dom.pointBanner.classList.add('hidden');
    }, 950);
  }

  function endMatch(winner) {
    State.gameOver = true;
    State.started = false;

    playBeep('win-match');
    window.ArcadeCanvas.haptic([40, 60, 80]);

    if (winner === 'P1') {
      dom.winnerTitle.textContent = State.mode === '1P' ? '¡VICTORIA!' : '¡JUGADOR 1 GANA!';
      dom.winnerTitle.style.color = '#00f0ff';
      dom.winnerSub.textContent = State.mode === '1P' ? `Derrotaste a la IA (${CONFIG.DIFFICULTIES[State.difficulty].label})` : 'Duelo dominado con maestría';
    } else {
      dom.winnerTitle.textContent = State.mode === '1P' ? 'DERROTA' : '¡JUGADOR 2 GANA!';
      dom.winnerTitle.style.color = '#ff007f';
      dom.winnerSub.textContent = State.mode === '1P' ? 'La IA se llevó el duelo a 7 puntos' : 'Jugador 2 se corona en el Frontón';
    }

    dom.finalP1Score.textContent = State.p1Score;
    dom.finalP2Score.textContent = State.p2Score;
    dom.bestRallyDisplay.textContent = State.bestRally;

    dom.overlayGameOver.classList.remove('hidden');
  }

  function updateHUD() {
    dom.p1Score.textContent = State.p1Score;
    dom.p2Score.textContent = State.p2Score;
    dom.matchRally.textContent = `RALLY: ${State.rally}`;
    dom.p2Tag.textContent = State.mode === '1P' ? `IA (${CONFIG.DIFFICULTIES[State.difficulty].label})` : 'JUGADOR 2';
  }

  // ==========================================
  // ACTUALIZACIÓN DE FÍSICA Y IA
  // ==========================================
  function update(dt) {
    if (!State.started || State.paused || State.gameOver) return;

    // Partículas
    particles.update(dt);

    // Paletas se mueven de forma ultra-reactiva hacia su targetX (cero sensación de lag)
    State.p1.x += (State.p1.targetX - State.p1.x) * Math.min(1, 48 * dt);
    State.p1.x = FrontonPhysics.clampPaddleX(State.p1.x, CONFIG.PADDLE_W, CONFIG.VIRTUAL_W);

    if (State.mode === '1P') {
      // Control de IA para P2
      updateAI(dt);
    } else {
      // 2P: P2 se mueve a su targetX táctil de forma ultra-reactiva
      State.p2.x += (State.p2.targetX - State.p2.x) * Math.min(1, 48 * dt);
      State.p2.x = FrontonPhysics.clampPaddleX(State.p2.x, CONFIG.PADDLE_W, CONFIG.VIRTUAL_W);
    }

    // Saque con retardo
    if (State.serving) {
      State.serveTimer -= dt;
      // La pelota vibra o pulsa suavemente
      State.ball.x = State.server === 'P1' ? State.p1.x : State.p2.x;
      if (State.serveTimer <= 0) {
        launchServe();
      }
      return;
    }

    // Movimiento de la pelota
    const nextX = State.ball.x + State.ball.vx * dt;
    const nextY = State.ball.y + State.ball.vy * dt;

    // Rebote en paredes laterales (izq/der)
    const courtLeft = 20 + CONFIG.BALL_RADIUS;
    const courtRight = CONFIG.VIRTUAL_W - 20 - CONFIG.BALL_RADIUS;

    if (nextX <= courtLeft) {
      State.ball.x = courtLeft;
      State.ball.vx = Math.abs(State.ball.vx);
      playBeep('wall');
      particles.burst(State.ball.x, State.ball.y, 6, '#00f0ff');
      window.ArcadeCanvas.haptic(8);
    } else if (nextX >= courtRight) {
      State.ball.x = courtRight;
      State.ball.vx = -Math.abs(State.ball.vx);
      playBeep('wall');
      particles.burst(State.ball.x, State.ball.y, 6, '#00f0ff');
      window.ArcadeCanvas.haptic(8);
    } else {
      State.ball.x = nextX;
    }

    // Detección de colisión con Paleta P1 (inferior)
    const p1Top = CONFIG.P1_Y - CONFIG.PADDLE_H / 2;
    const p1Bottom = CONFIG.P1_Y + CONFIG.PADDLE_H / 2;
    if (
      State.ball.vy > 0 &&
      State.ball.y <= p1Top &&
      nextY >= p1Top - CONFIG.BALL_RADIUS &&
      Math.abs(State.ball.x - State.p1.x) <= CONFIG.PADDLE_W / 2 + CONFIG.BALL_RADIUS
    ) {
      const reb = FrontonPhysics.calculatePaddleRebound(
        State.ball.x,
        State.p1.x,
        CONFIG.PADDLE_W,
        State.ball.speed,
        false
      );
      State.ball.vx = reb.vx;
      State.ball.vy = reb.vy;
      State.ball.speed = reb.newSpeed;
      State.ball.y = p1Top - CONFIG.BALL_RADIUS;
      State.rally++;
      updateHUD();
      playBeep('paddle-p1');
      particles.burst(State.ball.x, p1Top, 12, '#00f0ff');
      window.ArcadeCanvas.haptic(14);
    }

    // Detección de colisión con Paleta P2 (superior)
    const p2Bottom = CONFIG.P2_Y + CONFIG.PADDLE_H / 2;
    if (
      State.ball.vy < 0 &&
      State.ball.y >= p2Bottom &&
      nextY <= p2Bottom + CONFIG.BALL_RADIUS &&
      Math.abs(State.ball.x - State.p2.x) <= CONFIG.PADDLE_W / 2 + CONFIG.BALL_RADIUS
    ) {
      const reb = FrontonPhysics.calculatePaddleRebound(
        State.ball.x,
        State.p2.x,
        CONFIG.PADDLE_W,
        State.ball.speed,
        true
      );
      State.ball.vx = reb.vx;
      State.ball.vy = reb.vy;
      State.ball.speed = reb.newSpeed;
      State.ball.y = p2Bottom + CONFIG.BALL_RADIUS;
      State.rally++;
      updateHUD();
      playBeep('paddle-p2');
      particles.burst(State.ball.x, p2Bottom, 12, '#ff007f');
      window.ArcadeCanvas.haptic(14);
    }

    // Fuera de límites (Punto)
    if (nextY > CONFIG.VIRTUAL_H + 20) {
      // Pelota pasó a P1 -> Punto para P2
      awardPoint('P2');
      return;
    } else if (nextY < -20) {
      // Pelota pasó a P2 -> Punto para P1
      awardPoint('P1');
      return;
    }

    State.ball.y = nextY;

    // Rastro cuántico de la pelota
    if (Math.random() < 0.6) {
      particles.spawn(
        State.ball.x,
        State.ball.y,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        0.25,
        3,
        State.ball.vy > 0 ? '#ff007f' : '#00f0ff'
      );
    }
  }

  // ==========================================
  // IA DEL OPONENTE (3 DIFICULTADES)
  // ==========================================
  function updateAI(dt) {
    const diff = CONFIG.DIFFICULTIES[State.difficulty];
    State.aiLagTimer += dt;

    if (State.aiLagTimer >= diff.reactionLag) {
      State.aiLagTimer = 0;

      if (State.ball.vy < 0) {
        // La pelota va hacia la IA: estimar trayectoria
        const timeToReach = Math.max(0.01, (CONFIG.P2_Y - State.ball.y) / State.ball.vy);
        let predictedX = State.ball.x + State.ball.vx * timeToReach;

        // Rebotes en paredes para la predicción
        const leftBound = 28;
        const rightBound = CONFIG.VIRTUAL_W - 28;
        const courtW = rightBound - leftBound;

        // Plegar rebotes matemáticamente
        let normX = (predictedX - leftBound) % (2 * courtW);
        if (normX < 0) normX += 2 * courtW;
        if (normX > courtW) normX = 2 * courtW - normX;
        predictedX = leftBound + normX;

        // Añadir margen de error de la dificultad
        const error = (Math.sin(Date.now() * 0.005) * diff.errorRate);
        State.aiTargetX = predictedX + error;
      } else {
        // La pelota se aleja: volver suavemente al centro
        State.aiTargetX = CONFIG.VIRTUAL_W / 2 + Math.sin(Date.now() * 0.002) * 30;
      }
    }

    // Mover hacia el target con límite de velocidad
    const step = diff.speed * dt;
    const diffX = State.aiTargetX - State.p2.x;
    if (Math.abs(diffX) < step) {
      State.p2.x = State.aiTargetX;
    } else {
      State.p2.x += Math.sign(diffX) * step;
    }

    State.p2.x = FrontonPhysics.clampPaddleX(State.p2.x, CONFIG.PADDLE_W, CONFIG.VIRTUAL_W);
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

    // Limpiar fondo
    ctx.fillStyle = '#060814';
    ctx.fillRect(0, 0, W, H);

    // 1. Pista en perspectiva 3D (Rejilla synthwave en profundidad)
    renderCourt3D(ctx, W, H);

    // 2. Línea divisoria central con efecto neón
    ctx.save();
    ctx.strokeStyle = State.mode === '2P' ? 'rgba(255, 208, 0, 0.4)' : 'rgba(0, 240, 255, 0.15)';
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, H / 2);
    ctx.lineTo(W - 18, H / 2);
    ctx.stroke();

    if (State.mode === '2P') {
      ctx.fillStyle = 'rgba(255, 208, 0, 0.5)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LÍNEA DIVISORIA 2P (TOCA TU MITAD)', W / 2, H / 2 - 6);
    }
    ctx.restore();

    // 3. Sombra proyectada de la pelota en el suelo
    const shadowY = State.ball.y + 12;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(State.ball.x, shadowY, CONFIG.BALL_RADIUS * 1.2, CONFIG.BALL_RADIUS * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Sombras proyectadas de las paletas en el suelo
    renderPaddleShadow(ctx, State.p1.x, CONFIG.P1_Y + 12, CONFIG.PADDLE_W, CONFIG.PADDLE_H);
    renderPaddleShadow(ctx, State.p2.x, CONFIG.P2_Y + 8, CONFIG.PADDLE_W, CONFIG.PADDLE_H);

    // 5. Partículas activas
    particles.render(ctx);

    // 6. Paletas 3D Extruidas
    render3DPaddle(ctx, State.p1.x, CONFIG.P1_Y, CONFIG.PADDLE_W, CONFIG.PADDLE_H, CONFIG.PADDLE_DEPTH, '#00f0ff', '#0077aa', '#cceeff');
    render3DPaddle(ctx, State.p2.x, CONFIG.P2_Y, CONFIG.PADDLE_W, CONFIG.PADDLE_H, CONFIG.PADDLE_DEPTH, '#ff007f', '#99004d', '#ffcce6');

    // 7. Pelota cuántica 3D esférica
    render3DBall(ctx, State.ball.x, State.ball.y, CONFIG.BALL_RADIUS);

    ctx.restore();
  }

  /**
   * Pista con perspectiva de profundidad y líneas de fuga
   */
  function renderCourt3D(ctx, W, H) {
    ctx.save();

    // Rejilla de perspectiva
    const gridYSteps = 14;
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridYSteps; i++) {
      const t = i / gridYSteps;
      const y = t * H;
      const alpha = 0.06 + Math.pow(Math.abs(t - 0.5) * 2, 1.5) * 0.12;
      ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(18, y);
      ctx.lineTo(W - 18, y);
      ctx.stroke();
    }

    // Paredes laterales 3D biseladas
    const wallW = 16;
    // Pared Izquierda
    const gradLeft = ctx.createLinearGradient(0, 0, wallW, 0);
    gradLeft.addColorStop(0, '#00f0ff');
    gradLeft.addColorStop(0.3, '#082535');
    gradLeft.addColorStop(1, 'rgba(6, 8, 20, 0)');
    ctx.fillStyle = gradLeft;
    ctx.fillRect(0, 0, wallW, H);

    // Pared Derecha
    const gradRight = ctx.createLinearGradient(W - wallW, 0, W, 0);
    gradRight.addColorStop(0, 'rgba(6, 8, 20, 0)');
    gradRight.addColorStop(0.7, '#082535');
    gradRight.addColorStop(1, '#ff007f');
    ctx.fillStyle = gradRight;
    ctx.fillRect(W - wallW, 0, wallW, H);

    // Borde brillante de las paredes
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(16, H);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 0, 127, 0.4)';
    ctx.beginPath();
    ctx.moveTo(W - 16, 0);
    ctx.lineTo(W - 16, H);
    ctx.stroke();

    ctx.restore();
  }

  function renderPaddleShadow(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y, w, h * 0.6, 4);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Paleta 3D con cara superior iluminada, bisel frontal y profundidad
   */
  function render3DPaddle(ctx, x, y, w, h, depth, primaryColor, darkColor, lightColor) {
    const left = x - w / 2;
    const top = y - h / 2;

    ctx.save();

    // 0. Resplandor neón exterior de alto rendimiento (sin shadowBlur)
    ctx.fillStyle = primaryColor === '#00f0ff' ? 'rgba(0, 240, 255, 0.22)' : 'rgba(255, 0, 127, 0.22)';
    ctx.beginPath();
    ctx.roundRect(left - 4, top - 3, w + 8, h + depth + 6, 8);
    ctx.fill();

    // 1. Cara inferior / profundidad frontal
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.roundRect(left, top + 4, w, h + depth - 4, 6);
    ctx.fill();

    // 2. Cara frontal principal
    const grad = ctx.createLinearGradient(left, top, left, top + h);
    grad.addColorStop(0, lightColor);
    grad.addColorStop(0.35, primaryColor);
    grad.addColorStop(1, darkColor);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(left, top, w, h, 6);
    ctx.fill();

    // 3. Bisel superior con brillo especular
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.roundRect(left + 6, top + 2, w - 12, 3, 2);
    ctx.fill();

    // 4. Núcleo de energía interno
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.roundRect(left + w / 2 - 8, top + h / 2 - 2, 16, 4, 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Pelota cuántica 3D esférica con brillo radial y corona exterior rápida
   */
  function render3DBall(ctx, x, y, r) {
    ctx.save();

    // Resplandor exterior rápido (halo en 2 capas sin shadowBlur)
    ctx.fillStyle = 'rgba(255, 208, 0, 0.22)';
    ctx.beginPath();
    ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 240, 100, 0.4)';
    ctx.beginPath();
    ctx.arc(x, y, r * 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Gradiente esférico 3D (luz en offset sup-izq)
    const sphereGrad = ctx.createRadialGradient(
      x - r * 0.35,
      y - r * 0.35,
      r * 0.1,
      x,
      y,
      r
    );
    sphereGrad.addColorStop(0, '#ffffff');
    sphereGrad.addColorStop(0.3, '#fff490');
    sphereGrad.addColorStop(0.75, '#ffaa00');
    sphereGrad.addColorStop(1, '#cc5500');

    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Reflejo especular blanco
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.28, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ==========================================
  // BUCLE PRINCIPAL CON DELTA TIME
  // ==========================================
  let lastTime = 0;
  function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap 50ms para evitar saltos enormes
    lastTime = timestamp;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
  }

  // ==========================================
  // CONTROLES Y ENTRADAS (TÁCTIL Y RATÓN / TECLADO)
  // ==========================================
  function setupInputs() {
    const canvas = dom.canvas;

    function getCanvasCoords(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CONFIG.VIRTUAL_W / rect.width;
      const scaleY = CONFIG.VIRTUAL_H / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    }

    // Eventos táctiles (Multi-touch para 2P en el mismo dispositivo)
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (!State.started) return;
      window.ArcadeAudio?.initCtx();

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const pt = getCanvasCoords(touch.clientX, touch.clientY);
        const zone = FrontonPhysics.classifyTouchZone(pt.y, CONFIG.VIRTUAL_H);
        State.touches.set(touch.identifier, { zone, x: pt.x, y: pt.y });

        if (zone === 'P1') {
          State.p1.targetX = pt.x;
        } else if (zone === 'P2' && State.mode === '2P') {
          State.p2.targetX = pt.x;
        }
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!State.started) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const pt = getCanvasCoords(touch.clientX, touch.clientY);
        const record = State.touches.get(touch.identifier);

        if (record) {
          record.x = pt.x;
          record.y = pt.y;
          if (record.zone === 'P1') {
            State.p1.targetX = pt.x;
          } else if (record.zone === 'P2' && State.mode === '2P') {
            State.p2.targetX = pt.x;
          }
        } else {
          // Si no estaba registrado, clasificarlo
          const zone = FrontonPhysics.classifyTouchZone(pt.y, CONFIG.VIRTUAL_H);
          State.touches.set(touch.identifier, { zone, x: pt.x, y: pt.y });
          if (zone === 'P1') State.p1.targetX = pt.x;
          else if (zone === 'P2' && State.mode === '2P') State.p2.targetX = pt.x;
        }
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        State.touches.delete(e.changedTouches[i].identifier);
      }
    }, { passive: false });

    canvas.addEventListener('touchcancel', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        State.touches.delete(e.changedTouches[i].identifier);
      }
    });

    // Ratón para testing en PC o laptop
    let isMouseDown = false;
    canvas.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      window.ArcadeAudio?.initCtx();
      const pt = getCanvasCoords(e.clientX, e.clientY);
      const zone = FrontonPhysics.classifyTouchZone(pt.y, CONFIG.VIRTUAL_H);
      if (zone === 'P1') State.p1.targetX = pt.x;
      else if (zone === 'P2' && State.mode === '2P') State.p2.targetX = pt.x;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isMouseDown) return;
      const pt = getCanvasCoords(e.clientX, e.clientY);
      const zone = FrontonPhysics.classifyTouchZone(pt.y, CONFIG.VIRTUAL_H);
      if (zone === 'P1') State.p1.targetX = pt.x;
      else if (zone === 'P2' && State.mode === '2P') State.p2.targetX = pt.x;
    });

    window.addEventListener('mouseup', () => {
      isMouseDown = false;
    });

    // Teclado (Flechas para P1, A/D para P2 en modo 2P)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P') {
        togglePause();
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        restartMatch();
        return;
      }

      if (e.key === 'ArrowLeft') State.p1.targetX -= 40;
      if (e.key === 'ArrowRight') State.p1.targetX += 40;

      if (State.mode === '2P') {
        if (e.key === 'a' || e.key === 'A') State.p2.targetX -= 40;
        if (e.key === 'd' || e.key === 'D') State.p2.targetX += 40;
      }
    });
  }

  // ==========================================
  // CONFIGURACIÓN DE MODOS Y BOTONES UI
  // ==========================================
  function setupUI() {
    // Modo 1P vs 2P
    dom.modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        dom.modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        State.mode = btn.getAttribute('data-mode');

        if (State.mode === '1P') {
          dom.difficultyGroup.style.display = 'block';
          dom.controlLegend.textContent = 'Arrastra el dedo en tu mitad para mover la paleta';
        } else {
          dom.difficultyGroup.style.display = 'none';
          dom.controlLegend.textContent = 'Mitad inferior: Jugador 1 | Mitad superior: Jugador 2';
        }
        updateHUD();
      });
    });

    // Dificultades
    dom.diffButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        dom.diffButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        State.difficulty = btn.getAttribute('data-diff');
        const desc = {
          EASY: 'IA con movimientos tranquilos y pequeños despistes',
          MED: 'IA con reflejos ágiles y velocidad equilibrada',
          HARD: 'IA cibernética con máxima predicción angular'
        };
        dom.diffDesc.textContent = desc[State.difficulty] || '';
        updateHUD();
      });
    });

    // Iniciar saque / partida
    dom.btnStart.addEventListener('click', () => {
      window.ArcadeAudio?.initCtx();
      dom.startCard.classList.add('hidden');
      State.started = true;
      State.p1Score = 0;
      State.p2Score = 0;
      State.rally = 0;
      State.gameOver = false;
      State.paused = false;
      updateHUD();
      resetBall('P1');
    });

    // Pausa y Reanudar
    function togglePause() {
      if (!State.started || State.gameOver) return;
      State.paused = !State.paused;
      if (State.paused) {
        dom.overlayPause.classList.remove('hidden');
      } else {
        dom.overlayPause.classList.add('hidden');
      }
    }

    dom.btnPauseHeader.addEventListener('click', togglePause);
    dom.btnResume.addEventListener('click', togglePause);

    // Reiniciar
    function restartMatch() {
      State.started = false;
      State.paused = false;
      State.gameOver = false;
      dom.overlayPause.classList.add('hidden');
      dom.overlayGameOver.classList.add('hidden');
      dom.startCard.classList.remove('hidden');
    }

    dom.btnRestartHeader.addEventListener('click', restartMatch);
    dom.btnPauseRestart.addEventListener('click', restartMatch);
    dom.btnMatchRestart.addEventListener('click', restartMatch);

    // Sonido
    dom.btnSoundToggle.addEventListener('click', () => {
      if (window.ArcadeAudio) {
        const muted = window.ArcadeAudio.toggleMute();
        dom.iconSoundOn.classList.toggle('hidden', muted);
        dom.iconSoundOff.classList.toggle('hidden', !muted);
      }
    });

    // Sincronizar estado inicial de sonido
    if (window.ArcadeAudio && window.ArcadeAudio.isMuted) {
      dom.iconSoundOn.classList.add('hidden');
      dom.iconSoundOff.classList.remove('hidden');
    }
  }

  // ==========================================
  // INICIALIZACIÓN
  // ==========================================
  function init() {
    handleResize();
    setupInputs();
    setupUI();
    updateHUD();

    // Cargar récord histórico
    try {
      State.bestRally = window.ArcadeStorage?.getHighScore(CONFIG.STORAGE_KEY) || 0;
      dom.bestRallyDisplay.textContent = State.bestRally;
    } catch (e) {}

    requestAnimationFrame(gameLoop);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
