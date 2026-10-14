/**
 * games/corredor/game.js - Corredor Arcade 00 (Edición Compleja & Cyber Parallax)
 * Runner acrobático con física variable, parallax continuo en espacio-mundo,
 * combos dinámicos, plataformas elevadas, hiper-turbo y matriz temporal.
 */
(() => {
  'use strict';

  // ==========================================
  // CONFIGURACIÓN Y CONSTANTES DE BALANCE
  // ==========================================
  const CONFIG = {
    VIRTUAL_W: 480,
    VIRTUAL_H: 640,
    GROUND_Y: 520,
    BASE_SPEED: 320,
    MAX_SPEED: 700,
    SPEED_ACCEL: 0.08, // px/s de incremento por metro recorrido
    GRAVITY: 1450,
    JUMP_FORCE: -510,
    MAX_HOLD_TIME: 0.22,
    HOLD_ACCEL: -560,
    DOUBLE_JUMP_FORCE: -470,
    SLIDE_DURATION: 0.52,
    PLAYER_W: 28,
    PLAYER_H_STAND: 44,
    PLAYER_H_SLIDE: 20,
    STORAGE_KEY: 'corredor:v1:best_distance',
    PARTICLE_POOL_SIZE: 75,
    SECTORS: [
      { start: 0, name: 'SECTOR 1', desc: 'DISTRITO NEÓN', color: '#00f0ff', skyTop: '#040714', skyBottom: '#0e1832' },
      { start: 400, name: 'SECTOR 2', desc: 'NÚCLEO SINTÉTICO', color: '#00e676', skyTop: '#030f0a', skyBottom: '#0c2618' },
      { start: 900, name: 'SECTOR 3', desc: 'ABISMO CUÁNTICO', color: '#ff007f', skyTop: '#0d0412', skyBottom: '#290c33' }
    ]
  };

  // ==========================================
  // FÍSICA Y GENERADOR SOLVABLE (Puro y Testeable en Node)
  // ==========================================
  const RunnerPhysics = {
    /**
     * Calcula la distancia mínima de separación segura entre dos obstáculos
     */
    getMinSeparation(speed) {
      return speed * 0.62 + 55;
    },

    /**
     * Calcula la distancia horizontal máxima que puede cruzar un salto a una velocidad dada
     */
    getMaxJumpDistance(speed) {
      const maxAirTime = (Math.abs(CONFIG.JUMP_FORCE) / CONFIG.GRAVITY) * 2 + CONFIG.MAX_HOLD_TIME;
      return speed * maxAirTime * 0.95;
    },

    /**
     * Verifica colisión AABB entre dos cajas delimitadoras
     */
    checkAABB(b1, b2) {
      return (
        b1.x < b2.x + b2.w &&
        b1.x + b1.w > b2.x &&
        b1.y < b2.y + b2.h &&
        b1.y + b1.h > b2.y
      );
    }
  };

  class RunnerGenerator {
    constructor() {
      this.lastSpawnX = 600;
      this.lastType = null;
    }

    reset(initialX = 600) {
      this.lastSpawnX = initialX;
      this.lastType = null;
    }

    /**
     * Genera el siguiente obstáculo asegurando matemáticamente su solvencia
     */
    nextObstacle(currentSpeed) {
      const minSep = RunnerPhysics.getMinSeparation(currentSpeed);
      const distance = minSep * (1.0 + Math.random() * 0.5);
      const spawnX = this.lastSpawnX + distance;

      const types = ['LOW_BARRIER', 'FLYING_DRONE', 'LOW_BARRIER', 'HIGH_BARRIER', 'PLATFORM', 'GAP'];
      let chosenType = types[Math.floor(Math.random() * types.length)];

      // Si el anterior fue GAP, garantizar suelo firme y salto estándar
      if (this.lastType === 'GAP') {
        if (chosenType === 'GAP' || chosenType === 'FLYING_DRONE') {
          chosenType = 'LOW_BARRIER';
        }
      }

      let obs = {
        type: chosenType,
        x: spawnX,
        y: 0,
        w: 30,
        h: 30,
        passed: false
      };

      if (chosenType === 'LOW_BARRIER') {
        obs.w = 32;
        obs.h = 36;
        obs.y = CONFIG.GROUND_Y - obs.h;
      } else if (chosenType === 'HIGH_BARRIER') {
        obs.w = 46;
        obs.h = 30;
        obs.y = CONFIG.GROUND_Y - 78;
      } else if (chosenType === 'FLYING_DRONE') {
        obs.w = 42;
        obs.h = 32;
        obs.y = CONFIG.GROUND_Y - 56;
      } else if (chosenType === 'PLATFORM') {
        obs.w = 130;
        obs.h = 16;
        obs.y = CONFIG.GROUND_Y - 70; // Plataforma suspendida accesible con un salto
      } else if (chosenType === 'GAP') {
        const maxGap = RunnerPhysics.getMaxJumpDistance(currentSpeed) * 0.50;
        obs.w = Math.max(75, Math.min(180, maxGap));
        obs.h = 120;
        obs.y = CONFIG.GROUND_Y;
      }

      this.lastSpawnX = spawnX + obs.w;
      this.lastType = chosenType;
      return obs;
    }
  }

  // Exportar para pruebas Node
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, RunnerPhysics, RunnerGenerator };
    return;
  }

  // ==========================================
  // POOL DE PARTÍCULAS DE ALTO RENDIMIENTO (Sin shadowBlur)
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
          size: 3,
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
        const spd = 60 + Math.random() * 180;
        this.spawn(
          x, y,
          Math.cos(ang) * spd,
          Math.sin(ang) * spd,
          0.3 + Math.random() * 0.35,
          2.5 + Math.random() * 3,
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
          if (p.life <= 0) p.active = false;
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
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
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
    started: false,
    paused: false,
    gameOver: false,
    distance: 0,
    coins: 0,
    speed: CONFIG.BASE_SPEED,
    bestDistance: 0,
    currentSectorIndex: 0,

    // Sistema de Combo
    combo: 1,
    comboTimer: 0,

    // Corredor
    player: {
      x: 70,
      y: CONFIG.GROUND_Y - CONFIG.PLAYER_H_STAND,
      vy: 0,
      w: CONFIG.PLAYER_W,
      h: CONFIG.PLAYER_H_STAND,
      onGround: true,
      jumping: false,
      holdTimer: 0,
      canDoubleJump: true,
      sliding: false,
      slideTimer: 0,
      invulnerableTimer: 0,
      hasShield: false,
      turboTimer: 0,
      slowmoTimer: 0,
      magnetTimer: 0,
      runAnim: 0,
      flipRotation: 0,
      isFlipping: false
    },

    // Obstáculos y Entidades
    obstacles: [],
    coinsList: [],
    powerupsList: [],

    // Posición continua en el mundo para parallax (Cero saltos ni retrocesos)
    worldScroll: 0,

    // Maglev Train de fondo
    maglevTrain: {
      x: -600,
      speed: 850,
      active: false,
      timer: 4.0
    },

    scale: 1
  };

  const generator = new RunnerGenerator();
  const particles = new ParticlePool(CONFIG.PARTICLE_POOL_SIZE);

  // ==========================================
  // REFERENCIAS DOM
  // ==========================================
  const dom = {
    canvas: document.getElementById('runner-canvas'),
    ctx: null,
    btnSoundToggle: document.getElementById('btn-sound-toggle'),
    iconSoundOn: document.getElementById('icon-sound-on'),
    iconSoundOff: document.getElementById('icon-sound-off'),
    btnPauseHeader: document.getElementById('btn-pause-header'),
    hudDistance: document.getElementById('hud-distance'),
    hudCoins: document.getElementById('hud-coins'),
    badgeCombo: document.getElementById('badge-combo'),
    comboVal: document.getElementById('combo-val'),
    badgeShield: document.getElementById('badge-shield'),
    badgeTurbo: document.getElementById('badge-turbo'),
    turboMeter: document.getElementById('turbo-meter'),
    badgeSlowmo: document.getElementById('badge-slowmo'),
    slowmoMeter: document.getElementById('slowmo-meter'),
    badgeMagnet: document.getElementById('badge-magnet'),
    magnetMeter: document.getElementById('magnet-meter'),
    sectorBanner: document.getElementById('sector-banner'),
    sectorTitle: document.getElementById('sector-title'),
    sectorDesc: document.getElementById('sector-desc'),
    startCard: document.getElementById('start-card'),
    btnStartRun: document.getElementById('btn-start-run'),
    startRecordVal: document.getElementById('start-record-val'),
    overlayPause: document.getElementById('overlay-pause'),
    btnResume: document.getElementById('btn-resume'),
    btnRestartRun: document.getElementById('btn-restart-run'),
    overlayGameOver: document.getElementById('overlay-gameover'),
    goTitle: document.getElementById('go-title'),
    goSub: document.getElementById('go-sub'),
    finalDistVal: document.getElementById('final-dist-val'),
    finalCoinsVal: document.getElementById('final-coins-val'),
    bestDistVal: document.getElementById('best-dist-val'),
    btnRetry: document.getElementById('btn-retry')
  };

  dom.ctx = dom.canvas.getContext('2d');

  // ==========================================
  // AUDIO SINTETIZADO CON WEBAUDIO
  // ==========================================
  function playAudio(type) {
    if (!window.ArcadeAudio) return;
    switch (type) {
      case 'jump':
        window.ArcadeAudio.playTone(430, 'square', 0.07, 0.12);
        break;
      case 'double-jump':
        window.ArcadeAudio.playTone(680, 'square', 0.08, 0.14);
        setTimeout(() => window.ArcadeAudio?.playTone(900, 'sine', 0.06, 0.1), 50);
        break;
      case 'slide':
        window.ArcadeAudio.playTone(190, 'triangle', 0.1, 0.08);
        break;
      case 'coin': {
        const pitch = 880 + Math.min(State.combo * 80, 500);
        window.ArcadeAudio.playTone(pitch, 'sine', 0.05, 0.12);
        setTimeout(() => window.ArcadeAudio?.playTone(pitch * 1.5, 'sine', 0.07, 0.1), 40);
        break;
      }
      case 'turbo':
        [300, 500, 800, 1200].forEach((f, i) => {
          setTimeout(() => window.ArcadeAudio?.playTone(f, 'sawtooth', 0.08, 0.18), i * 60);
        });
        break;
      case 'slowmo':
        window.ArcadeAudio.playTone(600, 'sine', 0.15, 0.15);
        setTimeout(() => window.ArcadeAudio?.playTone(320, 'sine', 0.25, 0.15), 100);
        break;
      case 'powerup':
        [523, 659, 784].forEach((f, i) => {
          setTimeout(() => window.ArcadeAudio?.playTone(f, 'sine', 0.1, 0.14), i * 70);
        });
        break;
      case 'combo':
        window.ArcadeAudio.playTone(1050, 'triangle', 0.08, 0.15);
        break;
      case 'shield-break':
        window.ArcadeAudio.playTone(180, 'sawtooth', 0.18, 0.2);
        break;
      case 'smash':
        window.ArcadeAudio.playTone(220, 'square', 0.12, 0.2);
        break;
      case 'crash':
        window.ArcadeAudio.playExplosion ? window.ArcadeAudio.playExplosion() : window.ArcadeAudio.playTone(90, 'sawtooth', 0.35, 0.25);
        break;
      default:
        break;
    }
  }

  // ==========================================
  // AJUSTE DE RESOLUCIÓN Y TAMAÑO
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
  // CONTROLADOR DE PARTIDA
  // ==========================================
  function startRun() {
    window.ArcadeAudio?.initCtx();
    State.started = true;
    State.paused = false;
    State.gameOver = false;
    State.distance = 0;
    State.coins = 0;
    State.speed = CONFIG.BASE_SPEED;
    State.combo = 1;
    State.comboTimer = 0;
    State.currentSectorIndex = 0;
    State.worldScroll = 0;

    const p = State.player;
    p.y = CONFIG.GROUND_Y - CONFIG.PLAYER_H_STAND;
    p.vy = 0;
    p.h = CONFIG.PLAYER_H_STAND;
    p.onGround = true;
    p.jumping = false;
    p.canDoubleJump = true;
    p.sliding = false;
    p.hasShield = false;
    p.turboTimer = 0;
    p.slowmoTimer = 0;
    p.magnetTimer = 0;
    p.invulnerableTimer = 0;
    p.isFlipping = false;
    p.flipRotation = 0;

    State.obstacles = [];
    State.coinsList = [];
    State.powerupsList = [];
    generator.reset(550);

    for (let i = 0; i < 4; i++) {
      spawnNextObstacle();
    }

    dom.startCard.classList.add('hidden');
    dom.overlayPause.classList.add('hidden');
    dom.overlayGameOver.classList.add('hidden');
    updateHUD();
    triggerSectorBanner(0);
  }

  function spawnNextObstacle() {
    const obs = generator.nextObstacle(State.speed);
    State.obstacles.push(obs);

    // Si es una plataforma elevada, colocar monedas sobre ella
    if (obs.type === 'PLATFORM') {
      for (let k = 0; k < 4; k++) {
        State.coinsList.push({
          x: obs.x + 18 + k * 28,
          y: obs.y - 18,
          collected: false
        });
      }
      // Ocasionalmente colocar un powerup valioso arriba
      if (Math.random() < 0.4) {
        const pTypes = ['TURBO', 'SLOWMO', 'SHIELD', 'MAGNET'];
        State.powerupsList.push({
          type: pTypes[Math.floor(Math.random() * pTypes.length)],
          x: obs.x + obs.w / 2,
          y: obs.y - 28,
          collected: false
        });
      }
    } else if (obs.type !== 'GAP') {
      // Arcos de monedas sobre barreras bajas
      if (obs.type === 'LOW_BARRIER' && Math.random() < 0.7) {
        for (let k = -2; k <= 2; k++) {
          const arcY = (CONFIG.GROUND_Y - 78) + Math.abs(k) * 12;
          State.coinsList.push({
            x: obs.x + 16 + k * 22,
            y: arcY,
            collected: false
          });
        }
      } else if (Math.random() < 0.5) {
        for (let k = 0; k < 3; k++) {
          State.coinsList.push({
            x: obs.x - 70 - k * 28,
            y: CONFIG.GROUND_Y - 24,
            collected: false
          });
        }
      }
    }

    // Power-up ocasional en suelo
    if (obs.type !== 'PLATFORM' && Math.random() < 0.16) {
      const pTypes = ['TURBO', 'SLOWMO', 'SHIELD', 'MAGNET'];
      State.powerupsList.push({
        type: pTypes[Math.floor(Math.random() * pTypes.length)],
        x: obs.x - 130,
        y: CONFIG.GROUND_Y - 45,
        collected: false
      });
    }
  }

  function triggerSectorBanner(sectorIdx) {
    const s = CONFIG.SECTORS[sectorIdx];
    if (!s) return;
    dom.sectorTitle.textContent = s.name;
    dom.sectorTitle.style.color = s.color;
    dom.sectorDesc.textContent = s.desc;
    dom.sectorBanner.classList.remove('hidden');
    setTimeout(() => {
      dom.sectorBanner.classList.add('hidden');
    }, 1800);
  }

  function triggerGameOver(reason = 'Colisión') {
    State.gameOver = true;
    State.started = false;

    playAudio('crash');
    window.ArcadeCanvas.haptic([80, 100, 150]);
    particles.burst(State.player.x + 14, State.player.y + 20, 36, '#00f0ff');

    const finalMeters = Math.floor(State.distance);
    let isNewRecord = false;
    if (finalMeters > State.bestDistance) {
      State.bestDistance = finalMeters;
      isNewRecord = true;
      try {
        window.ArcadeStorage?.setHighScore(CONFIG.STORAGE_KEY, State.bestDistance);
      } catch (e) {}
    }

    dom.finalDistVal.textContent = `${finalMeters} m`;
    dom.finalCoinsVal.textContent = `🪙 ${State.coins}`;
    dom.bestDistVal.textContent = `${State.bestDistance} m`;

    if (isNewRecord) {
      dom.goTitle.textContent = '¡NUEVO RÉCORD!';
      dom.goTitle.style.color = '#ffcc00';
      dom.goSub.textContent = `¡Superaste tu marca con ${finalMeters} metros!`;
    } else {
      dom.goTitle.textContent = '¡FIN DE CARRERA!';
      dom.goTitle.style.color = '#00f0ff';
      dom.goSub.textContent = reason;
    }

    setTimeout(() => {
      dom.overlayGameOver.classList.remove('hidden');
    }, 450);
  }

  function addCombo() {
    State.combo = Math.min(5, State.combo + 1);
    State.comboTimer = 3.5;
    playAudio('combo');
    window.ArcadeCanvas.haptic(10);
    particles.burst(State.player.x + 14, State.player.y, 8, '#ffcc00');
  }

  function updateHUD() {
    dom.hudDistance.innerHTML = `${Math.floor(State.distance)} <small>m</small>`;
    dom.hudCoins.textContent = `🪙 ${State.coins}`;

    // Combo
    if (State.combo > 1) {
      dom.badgeCombo.classList.remove('hidden');
      dom.comboVal.textContent = `x${State.combo}`;
    } else {
      dom.badgeCombo.classList.add('hidden');
    }

    // Powerups
    const p = State.player;
    dom.badgeShield.classList.toggle('hidden', !p.hasShield);

    if (p.turboTimer > 0) {
      dom.badgeTurbo.classList.remove('hidden');
      dom.turboMeter.style.width = `${Math.max(4, (p.turboTimer / 5.0) * 100)}%`;
    } else {
      dom.badgeTurbo.classList.add('hidden');
    }

    if (p.slowmoTimer > 0) {
      dom.badgeSlowmo.classList.remove('hidden');
      dom.slowmoMeter.style.width = `${Math.max(4, (p.slowmoTimer / 4.5) * 100)}%`;
    } else {
      dom.badgeSlowmo.classList.add('hidden');
    }

    if (p.magnetTimer > 0) {
      dom.badgeMagnet.classList.remove('hidden');
      dom.magnetMeter.style.width = `${Math.max(4, (p.magnetTimer / 8.0) * 100)}%`;
    } else {
      dom.badgeMagnet.classList.add('hidden');
    }
  }

  // ==========================================
  // ENTRADAS DEL JUGADOR (SALTAR / ACROBACIA / SLIDE)
  // ==========================================
  function playerJumpStart() {
    if (!State.started || State.paused || State.gameOver) return;
    const p = State.player;

    if (p.sliding) {
      p.sliding = false;
      p.h = CONFIG.PLAYER_H_STAND;
    }

    if (p.onGround) {
      p.vy = CONFIG.JUMP_FORCE;
      p.onGround = false;
      p.jumping = true;
      p.holdTimer = 0;
      p.canDoubleJump = true;
      p.isFlipping = false;
      playAudio('jump');
      window.ArcadeCanvas.haptic(10);
      particles.burst(p.x + 14, p.y + p.h, 8, '#00f0ff');
    } else if (p.canDoubleJump) {
      p.vy = CONFIG.DOUBLE_JUMP_FORCE;
      p.canDoubleJump = false;
      p.jumping = true;
      p.holdTimer = 0;
      // Iniciar voltereta acrobática 360°
      p.isFlipping = true;
      p.flipRotation = 0;
      playAudio('double-jump');
      window.ArcadeCanvas.haptic(16);
      particles.burst(p.x + 14, p.y + p.h, 14, '#b388ff');
    }
  }

  function playerJumpEnd() {
    State.player.jumping = false;
  }

  function playerSlide() {
    if (!State.started || State.paused || State.gameOver) return;
    const p = State.player;

    if (!p.sliding) {
      p.sliding = true;
      p.slideTimer = CONFIG.SLIDE_DURATION;
      p.h = CONFIG.PLAYER_H_SLIDE;

      if (!p.onGround) {
        p.vy = Math.max(p.vy, 480);
      }

      playAudio('slide');
      window.ArcadeCanvas.haptic(12);
      particles.burst(p.x + 14, CONFIG.GROUND_Y, 8, '#ffd000');
    }
  }

  // ==========================================
  // BUCLE DE ACTUALIZACIÓN (LÓGICA CON DILATACIÓN TEMPORAL)
  // ==========================================
  function update(rawDt) {
    if (!State.started || State.paused || State.gameOver) return;

    const p = State.player;

    // Dilatación temporal si Slow-Mo está activo
    const timeScale = p.slowmoTimer > 0 ? 0.45 : 1.0;
    const dt = rawDt * timeScale;

    // Velocidad base acelerada + turbo si está activo
    const targetSpeed = CONFIG.BASE_SPEED + State.distance * CONFIG.SPEED_ACCEL;
    const effectiveSpeed = p.turboTimer > 0 ? targetSpeed + 240 : targetSpeed;
    State.speed = Math.min(CONFIG.MAX_SPEED + (p.turboTimer > 0 ? 200 : 0), effectiveSpeed);

    const stepMove = State.speed * dt;
    State.distance += (stepMove / 30);
    State.worldScroll += stepMove; // Coordenada continua en el mundo (sin saltos)

    // Comprobar cambio de sector
    const currentM = Math.floor(State.distance);
    for (let s = CONFIG.SECTORS.length - 1; s >= 0; s--) {
      if (currentM >= CONFIG.SECTORS[s].start) {
        if (State.currentSectorIndex !== s) {
          State.currentSectorIndex = s;
          triggerSectorBanner(s);
        }
        break;
      }
    }

    // Temporizador de combo
    if (State.comboTimer > 0) {
      State.comboTimer -= dt;
      if (State.comboTimer <= 0) {
        State.combo = 1;
      }
    }

    // Power-up: Turbo
    if (p.turboTimer > 0) {
      p.turboTimer -= rawDt; // corre en tiempo real
      // Rastro de fuego y chispas de propulsor
      particles.spawn(p.x - 6, p.y + p.h / 2, -280, (Math.random() - 0.5) * 80, 0.22, 4, '#ff007f');
      particles.spawn(p.x - 6, p.y + p.h / 2, -220, (Math.random() - 0.5) * 60, 0.22, 3, '#00f0ff');
    }

    // Power-up: Slow-Mo
    if (p.slowmoTimer > 0) {
      p.slowmoTimer -= rawDt;
    }

    // Power-up: Imán
    if (p.magnetTimer > 0) {
      p.magnetTimer -= dt;
    }

    // Invulnerabilidad
    if (p.invulnerableTimer > 0) {
      p.invulnerableTimer -= dt;
    }

    // Actualizar rotación acrobática si está en acrobacia
    if (p.isFlipping) {
      p.flipRotation += Math.PI * 4 * dt;
      if (p.flipRotation >= Math.PI * 2) {
        p.flipRotation = 0;
        p.isFlipping = false;
      }
    }

    // Animación de carrera
    p.runAnim += dt * (State.speed / 48);

    // Salto sostenido
    if (p.jumping && p.holdTimer < CONFIG.MAX_HOLD_TIME) {
      p.vy += CONFIG.HOLD_ACCEL * dt;
      p.holdTimer += dt;
    }

    // Gravedad
    p.vy += CONFIG.GRAVITY * dt;
    p.y += p.vy * dt;

    // Deslizamiento
    if (p.sliding) {
      p.slideTimer -= dt;
      if (p.slideTimer <= 0) {
        p.sliding = false;
        p.h = CONFIG.PLAYER_H_STAND;
      }
    }

    // Soporte para plataformas elevadas y fosas (GAP)
    let supportedGroundY = CONFIG.GROUND_Y;
    let isOverHole = false;

    for (let i = 0; i < State.obstacles.length; i++) {
      const obs = State.obstacles[i];
      if (obs.type === 'GAP') {
        if (p.x + p.w * 0.5 >= obs.x && p.x + p.w * 0.5 <= obs.x + obs.w) {
          isOverHole = true;
        }
      } else if (obs.type === 'PLATFORM') {
        // Si el jugador cae sobre la plataforma
        if (
          p.x + p.w >= obs.x &&
          p.x <= obs.x + obs.w &&
          p.y + p.h >= obs.y - 4 &&
          p.y + p.h <= obs.y + 14 &&
          p.vy >= 0
        ) {
          supportedGroundY = obs.y;
          isOverHole = false;
        }
      }
    }

    const currentLandingY = isOverHole ? CONFIG.VIRTUAL_H + 100 : supportedGroundY - p.h;

    if (p.y >= currentLandingY) {
      if (!isOverHole) {
        p.y = currentLandingY;
        p.vy = 0;
        p.onGround = true;
        p.canDoubleJump = true;
        p.isFlipping = false;
        p.flipRotation = 0;
      } else {
        if (p.y > CONFIG.VIRTUAL_H + 40) {
          triggerGameOver('Caída en el vacío');
          return;
        }
      }
    } else {
      p.onGround = false;
    }

    // Actualizar obstáculos
    for (let i = State.obstacles.length - 1; i >= 0; i--) {
      const obs = State.obstacles[i];
      obs.x -= stepMove;

      // Esquiva ajustada para Combo (Near Miss)
      if (!obs.passed && obs.x + obs.w < p.x && obs.type !== 'PLATFORM') {
        obs.passed = true;
        addCombo();
      }

      // Colisión (excepto GAP y PLATFORM)
      if (obs.type !== 'GAP' && obs.type !== 'PLATFORM' && p.invulnerableTimer <= 0) {
        const playerBox = {
          x: p.x + 3,
          y: p.y + 3,
          w: p.w - 6,
          h: p.h - 6
        };
        const obsBox = {
          x: obs.x,
          y: obs.y,
          w: obs.w,
          h: obs.h
        };

        if (RunnerPhysics.checkAABB(playerBox, obsBox)) {
          if (p.turboTimer > 0) {
            // Hiper Turbo destruye el obstáculo
            playAudio('smash');
            window.ArcadeCanvas.haptic(20);
            particles.burst(obs.x + obs.w / 2, obs.y + obs.h / 2, 22, '#ff007f');
            obs.x = -150;
          } else if (p.hasShield) {
            // Escudo absorbe
            p.hasShield = false;
            p.invulnerableTimer = 1.4;
            playAudio('shield-break');
            window.ArcadeCanvas.haptic([40, 60]);
            particles.burst(p.x + 14, p.y + p.h / 2, 20, '#00f0ff');
            obs.x = -150;
          } else {
            triggerGameOver('Impacto de obstáculo');
            return;
          }
        }
      }

      if (obs.x + obs.w < -80) {
        State.obstacles.splice(i, 1);
        spawnNextObstacle();
      }
    }

    // Actualizar monedas
    const magnetActive = p.magnetTimer > 0 || p.turboTimer > 0;
    const magnetRadius = p.turboTimer > 0 ? 340 : 280;

    for (let i = State.coinsList.length - 1; i >= 0; i--) {
      const coin = State.coinsList[i];
      coin.x -= stepMove;

      if (magnetActive) {
        const dx = (p.x + 14) - coin.x;
        const dy = (p.y + p.h / 2) - coin.y;
        const dist = Math.hypot(dx, dy);
        if (dist < magnetRadius) {
          coin.x += (dx / dist) * 520 * dt;
          coin.y += (dy / dist) * 520 * dt;
        }
      }

      if (!coin.collected && Math.hypot((p.x + 14) - coin.x, (p.y + p.h / 2) - coin.y) < 28) {
        coin.collected = true;
        State.coins += State.combo; // Multiplicador de combo suma monedas
        playAudio('coin');
        window.ArcadeCanvas.haptic(6);
        particles.burst(coin.x, coin.y, 6, '#ffd000');
        State.coinsList.splice(i, 1);
        continue;
      }

      if (coin.x < -40) {
        State.coinsList.splice(i, 1);
      }
    }

    // Actualizar power-ups
    for (let i = State.powerupsList.length - 1; i >= 0; i--) {
      const pw = State.powerupsList[i];
      pw.x -= stepMove;

      if (!pw.collected && Math.hypot((p.x + 14) - pw.x, (p.y + p.h / 2) - pw.y) < 32) {
        pw.collected = true;
        window.ArcadeCanvas.haptic(25);

        if (pw.type === 'TURBO') {
          p.turboTimer = 5.0;
          playAudio('turbo');
          particles.burst(pw.x, pw.y, 24, '#ff007f');
        } else if (pw.type === 'SLOWMO') {
          p.slowmoTimer = 4.5;
          playAudio('slowmo');
          particles.burst(pw.x, pw.y, 20, '#00e676');
        } else if (pw.type === 'SHIELD') {
          p.hasShield = true;
          playAudio('powerup');
          particles.burst(pw.x, pw.y, 18, '#00f0ff');
        } else if (pw.type === 'MAGNET') {
          p.magnetTimer = 8.0;
          playAudio('powerup');
          particles.burst(pw.x, pw.y, 18, '#ffaa00');
        }

        State.powerupsList.splice(i, 1);
        continue;
      }

      if (pw.x < -50) {
        State.powerupsList.splice(i, 1);
      }
    }

    // Tren Maglev de fondo que cruza ocasionalmente
    const train = State.maglevTrain;
    train.timer -= dt;
    if (train.timer <= 0 && !train.active) {
      train.active = true;
      train.x = CONFIG.VIRTUAL_W + 100;
    }
    if (train.active) {
      train.x -= train.speed * dt;
      if (train.x < -700) {
        train.active = false;
        train.timer = 12 + Math.random() * 15;
      }
    }

    particles.update(dt);
    updateHUD();
  }

  // ==========================================
  // RENDERIZADO VECTORIAL 3D (Cero Stutter, Cero ShadowBlur)
  // ==========================================
  function render() {
    const ctx = dom.ctx;
    const W = CONFIG.VIRTUAL_W;
    const H = CONFIG.VIRTUAL_H;
    const sector = CONFIG.SECTORS[State.currentSectorIndex];

    ctx.save();
    ctx.resetTransform();
    const dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr * State.scale, dpr * State.scale);

    // 1. Cielo y Luna Digital
    renderCyberSky(ctx, W, H, sector);

    // 2. Capa Parallax 1: Megatorres distantes continuas en espacio-mundo
    renderDistantTowers(ctx, W, H, State.worldScroll * 0.12);

    // 3. Capa Parallax 2: Rascacielos medios, ventanas y tren maglev
    renderMidgroundSkyline(ctx, W, H, State.worldScroll * 0.28, sector);

    // 4. Capa Parallax 3: Plataforma de suelo continuo con circuitos y chevron arrows
    renderForegroundTrack(ctx, W, H, State.worldScroll);

    // 5. Sombras proyectadas
    const p = State.player;
    if (p.y <= CONFIG.GROUND_Y - p.h) {
      const heightAbove = (CONFIG.GROUND_Y - p.h) - p.y;
      const shadowScale = Math.max(0.25, 1 - heightAbove / 220);
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${0.45 * shadowScale})`;
      ctx.beginPath();
      ctx.ellipse(p.x + 14, CONFIG.GROUND_Y + 4, 18 * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 6. Monedas 3D
    renderCoins(ctx);

    // 7. Power-ups flotantes
    renderPowerups(ctx);

    // 8. Obstáculos y Plataformas
    renderObstacles(ctx);

    // 9. Corredor Androide 3D
    renderPlayer3D(ctx, p);

    // 10. Partículas
    particles.render(ctx);

    // 11. Líneas de velocidad en Hiper Turbo
    if (p.turboTimer > 0) {
      renderSpeedLines(ctx, W, H);
    }

    ctx.restore();
  }

  /**
   * Cielo con gradiente de sector y luna digital holográfica
   */
  function renderCyberSky(ctx, W, H, sector) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CONFIG.GROUND_Y);
    skyGrad.addColorStop(0, sector.skyTop);
    skyGrad.addColorStop(1, sector.skyBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Luna / Sol Cibernético holográfico
    ctx.save();
    const sunX = W * 0.75;
    const sunY = 160;
    const sunR = 48;

    // Resplandor exterior
    ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Gradiente de sol
    const sunGrad = ctx.createLinearGradient(sunX, sunY - sunR, sunX, sunY + sunR);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.5, sector.color);
    sunGrad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();

    // Líneas de corte horizontales (estética Y2K / Synth)
    ctx.fillStyle = sector.skyTop;
    for (let y = sunY - 10; y < sunY + sunR; y += 8) {
      ctx.fillRect(sunX - sunR - 4, y, sunR * 2 + 8, 2);
    }
    ctx.restore();
  }

  /**
   * Torres lejanas continuas calculadas en coordenadas de mundo
   */
  function renderDistantTowers(ctx, W, H, offset) {
    ctx.save();
    const bW = 54;
    const startIdx = Math.floor(offset / bW);
    const count = Math.ceil(W / bW) + 2;

    ctx.fillStyle = '#0a1020';
    for (let i = 0; i < count; i++) {
      const worldIdx = startIdx + i;
      const x = worldIdx * bW - offset;

      // Altura determinista vinculada al índice de mundo (cero saltos ni reseteos)
      const hFactor = Math.abs(Math.sin(worldIdx * 12.9898));
      const h = 120 + hFactor * 90;
      const y = CONFIG.GROUND_Y - h - 40;

      ctx.fillRect(x, y, bW - 6, h + 40);

      // Luz parpadeante en antena
      if (worldIdx % 2 === 0) {
        ctx.fillStyle = '#ff0055';
        ctx.fillRect(x + bW / 2 - 4, y - 6, 2, 6);
        ctx.fillStyle = '#0a1020';
      }
    }
    ctx.restore();
  }

  /**
   * Rascacielos medios continuos y tren Maglev
   */
  function renderMidgroundSkyline(ctx, W, H, offset, sector) {
    ctx.save();
    const bW = 68;
    const startIdx = Math.floor(offset / bW);
    const count = Math.ceil(W / bW) + 2;

    for (let i = 0; i < count; i++) {
      const worldIdx = startIdx + i;
      const x = worldIdx * bW - offset;
      const hFactor = Math.abs(Math.sin(worldIdx * 25.1337));
      const h = 160 + hFactor * 110;
      const y = CONFIG.GROUND_Y - h;

      // Cuerpo del edificio
      ctx.fillStyle = '#11182c';
      ctx.fillRect(x, y, bW - 4, h);

      // Borde neón superior
      ctx.fillStyle = sector.color;
      ctx.globalAlpha = 0.4;
      ctx.fillRect(x, y, bW - 4, 2);
      ctx.globalAlpha = 1.0;

      // Matriz de ventanas
      ctx.fillStyle = 'rgba(0, 240, 255, 0.22)';
      for (let wy = y + 14; wy < CONFIG.GROUND_Y - 20; wy += 20) {
        ctx.fillRect(x + 10, wy, 8, 10);
        ctx.fillRect(x + 28, wy, 8, 10);
        ctx.fillRect(x + 46, wy, 8, 10);
      }
    }

    // Riel del tren Maglev
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, CONFIG.GROUND_Y - 120);
    ctx.lineTo(W, CONFIG.GROUND_Y - 120);
    ctx.stroke();

    // Tren Maglev si está activo
    const train = State.maglevTrain;
    if (train.active) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(train.x, CONFIG.GROUND_Y - 128, 220, 16, 6);
      ctx.fill();

      // Ventanas y luces del tren
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(train.x + 8, CONFIG.GROUND_Y - 125, 200, 6);

      // Estela de luz
      ctx.fillStyle = 'rgba(0, 240, 255, 0.35)';
      ctx.fillRect(train.x + 220, CONFIG.GROUND_Y - 126, 120, 10);
    }

    ctx.restore();
  }

  /**
   * Pista frontal continua con flechas cheurón animadas y bisel 3D
   */
  function renderForegroundTrack(ctx, W, H, worldScroll) {
    const groundY = CONFIG.GROUND_Y;

    ctx.fillStyle = '#050711';
    ctx.fillRect(0, groundY, W, H - groundY);

    // Identificar huecos (GAPs) activos
    const gaps = State.obstacles.filter(o => o.type === 'GAP');
    let solidSegments = [{ start: 0, end: W }];

    for (let g = 0; g < gaps.length; g++) {
      const gap = gaps[g];
      const newSegments = [];
      for (let s = 0; s < solidSegments.length; s++) {
        const seg = solidSegments[s];
        if (gap.x + gap.w < seg.start || gap.x > seg.end) {
          newSegments.push(seg);
        } else {
          if (gap.x > seg.start) newSegments.push({ start: seg.start, end: gap.x });
          if (gap.x + gap.w < seg.end) newSegments.push({ start: gap.x + gap.w, end: seg.end });
        }
      }
      solidSegments = newSegments;
    }

    for (let s = 0; s < solidSegments.length; s++) {
      const seg = solidSegments[s];
      const w = seg.end - seg.start;
      if (w <= 0) continue;

      ctx.save();
      // Capa de ciber-vidrio reflectante
      const grad = ctx.createLinearGradient(0, groundY, 0, groundY + 40);
      grad.addColorStop(0, '#1c2848');
      grad.addColorStop(0.25, '#121a30');
      grad.addColorStop(1, '#070a14');

      ctx.fillStyle = grad;
      ctx.fillRect(seg.start, groundY, w, H - groundY);

      // Borde brillante superior
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(seg.start, groundY, w, 2);

      // Línea de brillo biselada
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(seg.start, groundY + 2, w, 2);

      // Flechas cheurón continuas (> > >) desplazándose en el suelo
      const arrowSpacing = 80;
      const arrowOffset = worldScroll % arrowSpacing;
      ctx.fillStyle = 'rgba(0, 240, 255, 0.18)';
      ctx.font = '900 13px sans-serif';

      for (let ax = seg.start - arrowOffset; ax < seg.end; ax += arrowSpacing) {
        if (ax >= seg.start && ax + 20 <= seg.end) {
          ctx.fillText('>>>', ax, groundY + 18);
        }
      }

      ctx.restore();
    }
  }

  /**
   * Monedas 3D rotatorias
   */
  function renderCoins(ctx) {
    ctx.save();
    for (let i = 0; i < State.coinsList.length; i++) {
      const coin = State.coinsList[i];
      const scaleX = Math.cos(Date.now() * 0.006 + coin.x * 0.03);

      ctx.save();
      ctx.translate(coin.x, coin.y);

      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.ellipse(0, 0, 10 * Math.abs(scaleX), 10, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffea00';
      ctx.beginPath();
      ctx.ellipse(0, 0, 7 * Math.abs(scaleX), 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-2 * Math.abs(scaleX), -2, 2 * Math.abs(scaleX), 2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();
  }

  /**
   * Power-ups flotantes con halos
   */
  function renderPowerups(ctx) {
    ctx.save();
    for (let i = 0; i < State.powerupsList.length; i++) {
      const pw = State.powerupsList[i];
      const bob = Math.sin(Date.now() * 0.006 + pw.x) * 4;

      ctx.save();
      ctx.translate(pw.x, pw.y + bob);

      // Halo según tipo
      const haloColor = pw.type === 'TURBO' ? 'rgba(255, 0, 127, 0.28)' :
                        pw.type === 'SLOWMO' ? 'rgba(0, 230, 118, 0.28)' :
                        pw.type === 'SHIELD' ? 'rgba(0, 240, 255, 0.28)' :
                        'rgba(255, 204, 0, 0.28)';

      ctx.fillStyle = haloColor;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const icons = { TURBO: '🚀', SLOWMO: '⏳', SHIELD: '🛡️', MAGNET: '🧲' };
      ctx.fillText(icons[pw.type] || '⚡', 0, 0);

      ctx.restore();
    }
    ctx.restore();
  }

  /**
   * Obstáculos 3D y plataformas elevadas
   */
  function renderObstacles(ctx) {
    ctx.save();
    for (let i = 0; i < State.obstacles.length; i++) {
      const obs = State.obstacles[i];

      if (obs.type === 'LOW_BARRIER') {
        // Pylon piramidal 3D
        const bx = obs.x;
        const by = obs.y;
        const bw = obs.w;
        const bh = obs.h;

        ctx.fillStyle = '#261118';
        ctx.beginPath();
        ctx.moveTo(bx, by + bh);
        ctx.lineTo(bx + bw / 2, by);
        ctx.lineTo(bx + bw, by + bh);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ff2255';
        ctx.beginPath();
        ctx.moveTo(bx + bw / 2, by);
        ctx.lineTo(bx + bw, by + bh);
        ctx.lineTo(bx + bw / 2, by + bh);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bx + bw / 2, by + 4, 4, 0, Math.PI * 2);
        ctx.fill();

      } else if (obs.type === 'HIGH_BARRIER') {
        // Barra de plasma suspendida
        ctx.fillStyle = '#3a2066';
        ctx.beginPath();
        ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 6);
        ctx.fill();

        ctx.fillStyle = '#b388ff';
        ctx.fillRect(obs.x + 4, obs.y + obs.h / 2 - 2, obs.w - 8, 4);

      } else if (obs.type === 'FLYING_DRONE') {
        // Dron con cono de escáner hacia abajo
        const cx = obs.x + obs.w / 2;
        const cy = obs.y + obs.h / 2;
        const bob = Math.sin(Date.now() * 0.008 + obs.x) * 3;

        ctx.save();
        ctx.translate(cx, cy + bob);

        // Haz de escaneo hacia abajo (advierte deslizarse)
        ctx.fillStyle = 'rgba(255, 0, 85, 0.12)';
        ctx.beginPath();
        ctx.moveTo(-6, 8);
        ctx.lineTo(-24, 50);
        ctx.lineTo(24, 50);
        ctx.lineTo(6, 8);
        ctx.closePath();
        ctx.fill();

        // Anillo de rotación
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 7, Date.now() * 0.005, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#18243c';
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

      } else if (obs.type === 'PLATFORM') {
        // Plataforma elevada con luz de superficie
        ctx.fillStyle = '#162238';
        ctx.beginPath();
        ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 6);
        ctx.fill();

        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(obs.x + 2, obs.y, obs.w - 4, 2);

        // Flechas en la plataforma
        ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.font = '9px sans-serif';
        ctx.fillText('>>> PLATAFORMA >>>', obs.x + 10, obs.y + 11);
      }
    }
    ctx.restore();
  }

  /**
   * Corredor 3D: Animaciones de voltereta 360°, turbo-cometa y deslizamiento
   */
  function renderPlayer3D(ctx, p) {
    ctx.save();

    if (p.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.restore();
      return;
    }

    const px = p.x;
    const py = p.y;
    const pw = p.w;
    const ph = p.h;

    // Escudo Cuántico
    if (p.hasShield) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(px + pw / 2, py + ph / 2, pw * 0.9, ph * 0.7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Hiper Turbo: Cohete cometa
    if (p.turboTimer > 0) {
      ctx.save();
      ctx.translate(px + pw / 2, py + ph / 2);

      // Cuerpo de cohete
      const rocketGrad = ctx.createLinearGradient(-15, -12, 20, 12);
      rocketGrad.addColorStop(0, '#ff007f');
      rocketGrad.addColorStop(0.5, '#00f0ff');
      rocketGrad.addColorStop(1, '#ffffff');

      ctx.fillStyle = rocketGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flama trasera
      ctx.fillStyle = '#ffd000';
      ctx.beginPath();
      ctx.moveTo(-20, -6);
      ctx.lineTo(-34 - Math.random() * 8, 0);
      ctx.lineTo(-20, 6);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
      ctx.restore();
      return;
    }

    // Si está realizando la voltereta acrobática
    if (p.isFlipping) {
      ctx.save();
      ctx.translate(px + pw / 2, py + ph / 2);
      ctx.rotate(p.flipRotation);

      // Torso rotando
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.roundRect(-pw / 2, -ph / 2, pw, ph, 8);
      ctx.fill();

      ctx.restore();
      ctx.restore();
      return;
    }

    if (p.sliding) {
      // Deslizamiento en cuclillas
      const grad = ctx.createLinearGradient(px, py, px, py + ph);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#00f0ff');
      grad.addColorStop(1, '#0055bb');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(px, py, pw + 12, ph, 8);
      ctx.fill();

      ctx.fillStyle = '#111827';
      ctx.fillRect(px + pw - 2, py + 4, 8, ph - 8);

      if (Math.random() < 0.6) {
        particles.spawn(px, CONFIG.GROUND_Y, -90 - Math.random() * 90, -20 - Math.random() * 40, 0.2, 2, '#ffd000');
      }

    } else {
      // Posición erguida / corriendo
      const legOffset = Math.sin(p.runAnim) * 8;

      ctx.fillStyle = '#0a1020';
      ctx.fillRect(px + 4 + (p.onGround ? legOffset : 0), py + ph - 14, 6, 14);
      ctx.fillRect(px + 16 - (p.onGround ? legOffset : 0), py + ph - 14, 6, 14);

      const bodyGrad = ctx.createLinearGradient(px, py + 12, px + pw, py + ph - 12);
      bodyGrad.addColorStop(0, '#ffffff');
      bodyGrad.addColorStop(0.3, '#00f0ff');
      bodyGrad.addColorStop(1, '#0044aa');

      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.roundRect(px + 2, py + 12, pw - 4, ph - 24, 6);
      ctx.fill();

      // Cabeza
      ctx.fillStyle = '#e2ecfc';
      ctx.beginPath();
      ctx.arc(px + pw / 2, py + 9, 8, 0, Math.PI * 2);
      ctx.fill();

      // Visor
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(px + pw / 2 + 1, py + 6, 6, 4);

      if (!p.onGround) {
        particles.spawn(
          px + pw / 2 + (Math.random() - 0.5) * 6,
          py + ph - 4,
          -60,
          80 + Math.random() * 40,
          0.18,
          2.5,
          '#00f0ff'
        );
      }
    }

    ctx.restore();
  }

  function renderSpeedLines(ctx, W, H) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      const ly = Math.random() * (H - 100);
      const lx = Math.random() * W;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx - 120, ly);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ==========================================
  // BUCLE DE JUEGO (RAF CON SUB-STEPS)
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
  // ENTRADAS (TOUCH, SWIPE, TECLADO, RATÓN)
  // ==========================================
  function setupInputs() {
    const canvas = dom.canvas;
    let touchStartY = 0;
    let hasSwipedDown = false;

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (!State.started) return;
      window.ArcadeAudio?.initCtx();

      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
        hasSwipedDown = false;
        playerJumpStart();
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!State.started || hasSwipedDown) return;

      if (e.touches.length > 0) {
        const dy = e.touches[0].clientY - touchStartY;
        if (dy > 30) {
          hasSwipedDown = true;
          playerSlide();
        }
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      playerJumpEnd();
    }, { passive: false });

    canvas.addEventListener('touchcancel', () => {
      playerJumpEnd();
    });

    // Ratón
    canvas.addEventListener('mousedown', (e) => {
      window.ArcadeAudio?.initCtx();
      if (e.button === 0) {
        touchStartY = e.clientY;
        hasSwipedDown = false;
        playerJumpStart();
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      if (e.buttons === 1 && !hasSwipedDown) {
        if (e.clientY - touchStartY > 30) {
          hasSwipedDown = true;
          playerSlide();
        }
      }
    });

    window.addEventListener('mouseup', () => {
      playerJumpEnd();
    });

    // Teclado
    window.addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P') {
        togglePause();
        return;
      }

      if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w' || e.key === 'W') {
        playerJumpStart();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        playerSlide();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w' || e.key === 'W') {
        playerJumpEnd();
      }
    });
  }

  // ==========================================
  // SETUP DE UI Y BOTONES
  // ==========================================
  function setupUI() {
    dom.btnStartRun.addEventListener('click', startRun);

    function togglePause() {
      if (!State.started || State.gameOver) return;
      State.paused = !State.paused;
      dom.overlayPause.classList.toggle('hidden', !State.paused);
    }

    dom.btnPauseHeader.addEventListener('click', togglePause);
    dom.btnResume.addEventListener('click', togglePause);

    dom.btnRestartRun.addEventListener('click', startRun);
    dom.btnRetry.addEventListener('click', startRun);

    // Sonido
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
  // INICIALIZACIÓN
  // ==========================================
  function init() {
    handleResize();
    setupInputs();
    setupUI();

    try {
      State.bestDistance = window.ArcadeStorage?.getHighScore(CONFIG.STORAGE_KEY) || 0;
      dom.startRecordVal.textContent = State.bestDistance;
    } catch (e) {}

    requestAnimationFrame(gameLoop);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
