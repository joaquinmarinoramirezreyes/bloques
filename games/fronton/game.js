/**
 * games/fronton/game.js - Frontón Arcade 80 (Arena Futurista)
 * Duelo retro de paletas y pelota cuántica con perspectiva 3D, líneas de luz,
 * estela cambiante por velocidad, inclinación de paleta, power-ups, torneo de 5 rivales,
 * modo supervivencia, repetición en cámara lenta, 8 logros y misiones diarias.
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
    TOURNAMENT_RIVALS: [
      { id: 'vector1', name: 'Vector-1', avatar: 'target', desc: 'IA de prototipo con disparos suaves y predecibles', speed: 270, errorRate: 24, reactionLag: 0.15 },
      { id: 'aerobot', name: 'Aero-Bot', avatar: 'zap', desc: 'Ágil y rápido, busca tiros cruzados a las esquinas', speed: 360, errorRate: 14, reactionLag: 0.09 },
      { id: 'vortex',  name: 'Vortex',   avatar: 'swap', desc: 'Efectos giroscópicos y rebotes agresivos en pared', speed: 430, errorRate: 8,  reactionLag: 0.06 },
      { id: 'ironguard', name: 'Iron-Guard', avatar: 'shield', desc: 'Muralla defensiva impenetrable con gran precisión', speed: 490, errorRate: 3, reactionLag: 0.03 },
      { id: 'quantumx', name: 'Quantum-X', avatar: 'star', desc: 'Maestro supremo: aceleración cuántica y spin letal', speed: 560, errorRate: 0, reactionLag: 0.01 }
    ],
    ACHIEVEMENTS: [
      { id: 'first_point', title: 'Primer Saque', desc: 'Anota tu primer punto en la arena', icon: 'target' },
      { id: 'rally_15', title: 'Maestro del Rally', desc: 'Alcanza un rally de 15 o más golpes', icon: 'zap' },
      { id: 'speed_650', title: 'Velocidad Supersónica', desc: 'Golpea la pelota a más de 650 px/s', icon: 'speed' },
      { id: 'tournament_champ', title: 'Campeón del Torneo', desc: 'Vence a los 5 rivales cibernéticos', icon: 'trophy' },
      { id: 'survival_25', title: 'Superviviente Cuántico', desc: 'Resiste 25 rebotes en modo Supervivencia', icon: 'shield' },
      { id: 'powerup_5', title: 'Sobrecarga Cuántica', desc: 'Recoge 5 power-ups en un solo partido', icon: 'star' },
      { id: 'goal_net_save', title: 'Salvada Épica', desc: 'Salva un punto con la red de portería', icon: 'shield' },
      { id: 'clean_sheet', title: 'Blanqueada Perfecta', desc: 'Gana un partido 7-0 sin conceder puntos', icon: 'crown' }
    ],
    PARTICLE_POOL_SIZE: 120,
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
          color: '#f2c94c'
        };
      }
    }

    emit(x, y, count, color, speedBase = 90, spread = Math.PI * 2) {
      let emitted = 0;
      for (let i = 0; i < this.size && emitted < count; i++) {
        const p = this.items[i];
        if (!p.active) {
          p.active = true;
          p.x = x;
          p.y = y;
          const angle = Math.random() * spread;
          const speed = speedBase * (0.4 + Math.random() * 0.9);
          p.vx = Math.cos(angle) * speed;
          p.vy = Math.sin(angle) * speed;
          p.maxLife = 0.25 + Math.random() * 0.35;
          p.life = p.maxLife;
          p.size = 2 + Math.random() * 3;
          p.color = color;
          emitted++;
        }
      }
    }

    update(dt) {
      let activeCount = 0;
      for (let i = 0; i < this.size; i++) {
        const p = this.items[i];
        if (p.active) {
          activeCount++;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.94;
          p.vy *= 0.94;
          p.life -= dt;
          if (p.life <= 0) {
            p.active = false;
          }
        }
      }
      return activeCount;
    }

    draw(ctx) {
      for (let i = 0; i < this.size; i++) {
        const p = this.items[i];
        if (p.active) {
          const alpha = Math.max(0, p.life / p.maxLife);
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 6;
          ctx.shadowColor = p.color;
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
          ctx.restore();
        }
      }
    }
  }

  // ==========================================
  // ESTADO DEL JUEGO
  // ==========================================
  const State = {
    gameMode: 'QUICK', // 'QUICK', 'TOURNAMENT', 'SURVIVAL'
    mode: '1P', // '1P' vs IA, o '2P' local
    difficulty: 'MED',
    currentRivalIdx: 0,
    tournamentBeaten: [], // Array de rival IDs vencidos

    p1Score: 0,
    p2Score: 0,
    rally: 0,
    bestRally: 0,
    survivalRebounds: 0,
    bestSurvivalRebounds: 0,
    powerupsCollectedMatch: 0,

    paused: false,
    started: false,
    gameOver: false,
    serving: true,
    serveTimer: 0,
    server: 'P1',

    // Jugadores
    p1: {
      x: CONFIG.VIRTUAL_W / 2,
      targetX: CONFIG.VIRTUAL_W / 2,
      tilt: 0,
      width: CONFIG.PADDLE_W,
      bigPaddleTimer: 0,
      hasGoalNet: false
    },
    p2: {
      x: CONFIG.VIRTUAL_W / 2,
      targetX: CONFIG.VIRTUAL_W / 2,
      tilt: 0,
      width: CONFIG.PADDLE_W,
      bigPaddleTimer: 0
    },

    // Pelotas (soporta Multipelota)
    balls: [
      {
        x: CONFIG.VIRTUAL_W / 2,
        y: CONFIG.VIRTUAL_H / 2,
        vx: 0,
        vy: 0,
        speed: CONFIG.BASE_SPEED,
        spin: 0,
        trail: [] // buffer circular de estela
      }
    ],

    // Power-up activo en pista
    courtPowerup: null, // { type, x, y, radius: 14, timer: 12 }
    powerupSpawnTimer: 10,

    // Búfer de repetición en cámara lenta (últimos 90 frames)
    replayFrames: [],
    isReplaying: false,
    replayFrameIdx: 0,

    // IA
    aiLagTimer: 0,
    aiTargetX: CONFIG.VIRTUAL_W / 2,

    // Controles táctiles
    touches: new Map(),

    // Escalado
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
    targetModeLabel: document.getElementById('target-mode-label'),
    startCard: document.getElementById('start-card'),
    btnStart: document.getElementById('btn-start-match'),
    difficultyGroup: document.getElementById('difficulty-group'),
    diffDesc: document.getElementById('diff-desc'),
    controlLegend: document.getElementById('control-legend'),
    pointBanner: document.getElementById('point-banner'),
    pointText: document.getElementById('point-text'),
    pointSub: document.getElementById('point-sub'),
    replayBanner: document.getElementById('replay-banner'),
    powerupToast: document.getElementById('powerup-toast'),
    powerupIcon: document.getElementById('powerup-icon'),
    powerupName: document.getElementById('powerup-name'),

    // Modales
    panelQuick: document.getElementById('panel-quick'),
    panelTournament: document.getElementById('panel-tournament'),
    panelSurvival: document.getElementById('panel-survival'),
    tournamentRoster: document.getElementById('tournament-roster'),
    survBestRebounds: document.getElementById('surv-best-rebounds'),

    modalOptions: document.getElementById('modal-options'),
    btnOptionsHeader: document.getElementById('btn-options-header'),
    btnCloseOptions: document.getElementById('btn-close-options'),
    sliderSfx: document.getElementById('slider-sfx'),
    sliderBgm: document.getElementById('slider-bgm'),
    valSfx: document.getElementById('val-sfx'),
    valBgm: document.getElementById('val-bgm'),
    toggleVibration: document.getElementById('toggle-vibration'),
    toggleContrast: document.getElementById('toggle-contrast'),

    modalAchievements: document.getElementById('modal-achievements'),
    btnAchievementsHeader: document.getElementById('btn-achievements-header'),
    btnAchievementsView: document.getElementById('btn-achievements-view'),
    btnCloseAchievements: document.getElementById('btn-close-achievements'),
    achievementsList: document.getElementById('achievements-list'),

    modalMissions: document.getElementById('modal-missions'),
    btnDailyMissions: document.getElementById('btn-daily-missions'),
    btnCloseMissions: document.getElementById('btn-close-missions'),
    missionsList: document.getElementById('missions-list'),

    overlayPause: document.getElementById('overlay-pause'),
    btnPauseHeader: document.getElementById('btn-pause-header'),
    btnResume: document.getElementById('btn-resume'),
    btnPauseRestart: document.getElementById('btn-pause-restart'),
    btnPauseOptions: document.getElementById('btn-pause-options'),

    overlayGameOver: document.getElementById('overlay-gameover'),
    winnerTitle: document.getElementById('winner-title'),
    winnerSub: document.getElementById('winner-sub'),
    finalP1Score: document.getElementById('final-p1-score'),
    finalP2Score: document.getElementById('final-p2-score'),
    bestRallyDisplay: document.getElementById('best-rally'),
    newRecordTag: document.getElementById('new-record-tag'),
    btnMatchRestart: document.getElementById('btn-match-restart'),
    btnBackToSetup: document.getElementById('btn-back-to-setup'),

    btnSoundToggle: document.getElementById('btn-sound-toggle'),
    iconSoundOn: document.getElementById('icon-sound-on'),
    iconSoundOff: document.getElementById('icon-sound-off')
  };

  // ==========================================
  // COLOR DE PELOTA SEGÚN VELOCIDAD
  // ==========================================
  function getBallSpeedColor(speed) {
    if (speed < 400) return '#f4f1e8'; // Crema arena
    if (speed < 550) return '#f2c94c'; // Oro frontón
    if (speed < 680) return '#e07a1f'; // Ámbar cálido
    return '#ffffff'; // Blanco puro
  }

  // ==========================================
  // AUDIO PROCEDURAL MEJORADO CON SÍNTESIS BGM
  // ==========================================
  const SynthArenaAudio = {
    bgmOsc: null,
    bgmGain: null,
    bgmTimer: null,
    bgmStep: 0,

    init() {
      if (window.ArcadeAudio && window.ArcadeAudio.initCtx) {
        window.ArcadeAudio.initCtx();
      }
    },

    playPitchJitter(baseFreq, type = 'square', dur = 0.08, gain = 0.1) {
      if (window.ArcadeAudio && !window.ArcadeAudio.isMuted) {
        const jitter = (Math.random() - 0.5) * 0.12 * baseFreq;
        window.ArcadeAudio.playTone(baseFreq + jitter, type, dur, gain);
      }
    },

    sfxPaddleHit(speed) {
      this.init();
      const freq = 360 + Math.min(450, (speed - CONFIG.BASE_SPEED) * 1.1);
      this.playPitchJitter(freq, 'triangle', 0.08, 0.22);
      if (speed >= 650) {
        this.playPitchJitter(780, 'sine', 0.15, 0.25);
      }
    },

    sfxWallBounce() {
      this.init();
      this.playPitchJitter(240, 'sine', 0.05, 0.15);
    },

    sfxPowerupSpawn() {
      this.init();
      if (window.ArcadeAudio && !window.ArcadeAudio.isMuted) {
        window.ArcadeAudio.playTone(520, 'sine', 0.1, 0.15);
        setTimeout(() => window.ArcadeAudio.playTone(660, 'sine', 0.15, 0.15), 80);
      }
    },

    sfxPowerupCollect() {
      this.init();
      if (window.ArcadeAudio && !window.ArcadeAudio.isMuted) {
        window.ArcadeAudio.playTone(440, 'triangle', 0.08, 0.2);
        setTimeout(() => window.ArcadeAudio.playTone(660, 'triangle', 0.1, 0.2), 70);
        setTimeout(() => window.ArcadeAudio.playTone(880, 'triangle', 0.18, 0.25), 140);
      }
    },

    sfxPointScored(isPlayerWin) {
      this.init();
      if (window.ArcadeAudio && !window.ArcadeAudio.isMuted) {
        if (isPlayerWin) {
          window.ArcadeAudio.playTone(440, 'triangle', 0.1, 0.25);
          setTimeout(() => window.ArcadeAudio.playTone(660, 'triangle', 0.2, 0.25), 100);
        } else {
          window.ArcadeAudio.playTone(220, 'sawtooth', 0.18, 0.2);
          setTimeout(() => window.ArcadeAudio.playTone(160, 'sawtooth', 0.25, 0.2), 120);
        }
      }
    },

    // Música ambiental generativa simple en bucle
    startBgm() {
      if (this.bgmTimer) return;
      const notes = [130.81, 146.83, 164.81, 196.00, 220.00, 164.81]; // C3 escala pentatónica
      this.bgmTimer = setInterval(() => {
        if (!State.started || State.paused || (window.ArcadeAudio && window.ArcadeAudio.isMuted)) return;
        const bgmVol = (window.ArcadeJuice ? window.ArcadeJuice.getOption('bgm_vol', 70) : 70) / 100;
        if (bgmVol <= 0.02) return;

        const note = notes[this.bgmStep % notes.length];
        this.bgmStep++;
        if (window.ArcadeAudio && window.ArcadeAudio.ctx) {
          try {
            const osc = window.ArcadeAudio.ctx.createOscillator();
            const gain = window.ArcadeAudio.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(note, window.ArcadeAudio.ctx.currentTime);
            gain.gain.setValueAtTime(0.04 * bgmVol, window.ArcadeAudio.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, window.ArcadeAudio.ctx.currentTime + 0.35);
            osc.connect(gain);
            gain.connect(window.ArcadeAudio.ctx.destination);
            osc.start();
            osc.stop(window.ArcadeAudio.ctx.currentTime + 0.35);
          } catch (_) {}
        }
      }, 420);
    },

    stopBgm() {
      if (this.bgmTimer) {
        clearInterval(this.bgmTimer);
        this.bgmTimer = null;
      }
    }
  };

  // ==========================================
  // GESTIÓN DE POWER-UPS
  // ==========================================
  const POWERUP_TYPES = [
    { type: 'BIG_PADDLE', name: 'PALETA GRANDE', icon: 'swap', color: '#10b981' },
    { type: 'SLOW_BALL',  name: 'PELOTA LENTA',  icon: 'speed', color: '#f2c94c' },
    { type: 'MULTI_BALL', name: 'MULTIPELOTA',   icon: 'star', color: '#f59e0b' },
    { type: 'GOAL_NET',   name: 'RED DEFENSIVA', icon: 'shield', color: '#ec4899' }
  ];

  function spawnCourtPowerup() {
    if (State.courtPowerup) return;
    const picked = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    State.courtPowerup = {
      type: picked.type,
      name: picked.name,
      icon: picked.icon,
      color: picked.color,
      x: 60 + Math.random() * (CONFIG.VIRTUAL_W - 120),
      y: 200 + Math.random() * (CONFIG.VIRTUAL_H - 400),
      radius: 14,
      timer: 14.0
    };
    SynthArenaAudio.sfxPowerupSpawn();
    showPowerupToast(picked.icon, `${picked.name} EN PISTA`);
  }

  function collectPowerup(pow) {
    SynthArenaAudio.sfxPowerupCollect();
    State.courtPowerup = null;
    State.powerupsCollectedMatch++;
    showPowerupToast(pow.icon, `${pow.name} ACTIVADO`);
    if (window.ArcadeJuice) {
      window.ArcadeJuice.spawnFloat(`+${pow.name}`, pow.x, pow.y, pow.color, 14);
      if (State.powerupsCollectedMatch >= 5) {
        window.ArcadeJuice.unlockAchievement('fronton', 'powerup_5', 'Sobrecarga Cuántica', 'Recogiste 5 power-ups en un solo partido', 'star');
      }
    }

    if (pow.type === 'BIG_PADDLE') {
      State.p1.width = CONFIG.PADDLE_W * 1.4;
      State.p1.bigPaddleTimer = 10.0;
    } else if (pow.type === 'SLOW_BALL') {
      State.balls.forEach(b => {
        b.speed = CONFIG.BASE_SPEED;
        const mag = Math.hypot(b.vx, b.vy);
        if (mag > 0) {
          b.vx = (b.vx / mag) * CONFIG.BASE_SPEED;
          b.vy = (b.vy / mag) * CONFIG.BASE_SPEED;
        }
      });
    } else if (pow.type === 'MULTI_BALL') {
      // Duplicar pelota principal
      const mainB = State.balls[0];
      if (mainB && State.balls.length < 3) {
        State.balls.push({
          x: mainB.x,
          y: mainB.y,
          vx: -mainB.vx * 0.9,
          vy: mainB.vy,
          speed: mainB.speed,
          spin: -mainB.spin,
          trail: []
        });
      }
    } else if (pow.type === 'GOAL_NET') {
      State.p1.hasGoalNet = true;
    }
  }

  function showPowerupToast(icon, text) {
    if (!dom.powerupToast) return;
    dom.powerupIcon.innerHTML = window.ArcadeIcons ? ArcadeIcons.getSvg(icon, 18) : '';
    dom.powerupName.textContent = text;
    dom.powerupToast.classList.remove('hidden');
    clearTimeout(dom.powerupToast._timeout);
    dom.powerupToast._timeout = setTimeout(() => {
      dom.powerupToast.classList.add('hidden');
    }, 2200);
  }

  // ==========================================
  // INICIALIZACIÓN Y CONFIGURACIÓN DE PARTIDA
  // ==========================================
  function resetBall(servingToP1 = true) {
    State.balls = [
      {
        x: CONFIG.VIRTUAL_W / 2,
        y: CONFIG.VIRTUAL_H / 2,
        vx: 0,
        vy: 0,
        speed: CONFIG.BASE_SPEED,
        spin: 0,
        trail: []
      }
    ];

    State.serving = true;
    State.serveTimer = CONFIG.POINT_DELAY;
    State.server = servingToP1 ? 'P2' : 'P1';

    if (dom.pointBanner) {
      dom.pointBanner.classList.remove('hidden');
      dom.pointText.textContent = '¡SAQUE!';
      dom.pointSub.textContent = State.server === 'P1' ? 'JUGADOR 1 AL SERVICIO' : 'RIVAL AL SERVICIO';
    }
  }

  function launchBall() {
    State.serving = false;
    if (dom.pointBanner) {
      dom.pointBanner.classList.add('hidden');
    }

    const b = State.balls[0];
    if (!b) return;

    // Ángulo aleatorio centrado hacia quien recibe
    const dirY = State.server === 'P1' ? -1 : 1;
    const angle = (Math.random() - 0.5) * (Math.PI * 0.28);
    b.speed = CONFIG.BASE_SPEED;
    b.vx = b.speed * Math.sin(angle);
    b.vy = b.speed * Math.cos(angle) * dirY;

    SynthArenaAudio.sfxPaddleHit(b.speed);
  }

  function startMatch() {
    State.p1Score = 0;
    State.p2Score = 0;
    State.rally = 0;
    State.survivalRebounds = 0;
    State.powerupsCollectedMatch = 0;
    State.courtPowerup = null;
    State.powerupSpawnTimer = 10;
    State.started = true;
    State.gameOver = false;
    State.paused = false;
    State.isReplaying = false;
    State.replayFrames = [];

    // Ajustes de Jugador
    State.p1.width = CONFIG.PADDLE_W;
    State.p1.bigPaddleTimer = 0;
    State.p1.hasGoalNet = false;
    State.p2.width = CONFIG.PADDLE_W;
    State.p2.bigPaddleTimer = 0;

    // Etiquetas según modo
    if (State.gameMode === 'SURVIVAL') {
      dom.p2Tag.textContent = 'SUPERVIVENCIA';
      dom.targetModeLabel.textContent = 'REBOTES: 0';
    } else if (State.gameMode === 'TOURNAMENT') {
      const rival = CONFIG.TOURNAMENT_RIVALS[State.currentRivalIdx];
      dom.p2Tag.textContent = `${rival.avatar} ${rival.name.toUpperCase()}`;
      dom.targetModeLabel.textContent = `A 7 (RONDA ${State.currentRivalIdx + 1}/5)`;
    } else {
      dom.p2Tag.textContent = State.mode === '2P' ? 'JUGADOR 2' : 'RIVAL (IA)';
      dom.targetModeLabel.textContent = 'A 7 PUNTOS';
    }

    dom.startCard.classList.add('hidden');
    dom.overlayGameOver.classList.add('hidden');
    dom.overlayPause.classList.add('hidden');

    resetBall(true);
    updateScoreboard();
    SynthArenaAudio.startBgm();

    if (window.ArcadeJuice) {
      window.ArcadeJuice.trackPlay('fronton', 0);
    }
  }

  // ==========================================
  // FÍSICA Y ACTUALIZACIÓN POR FRAME
  // ==========================================
  function update(dt) {
    if (!State.started || State.paused) return;

    // Juice update (si está en hitstop, congela el avance)
    if (window.ArcadeJuice && window.ArcadeJuice.update(dt)) {
      return;
    }

    // Modo Repetición en Cámara Lenta del punto final
    if (State.isReplaying) {
      updateSlowMoReplay(dt);
      return;
    }

    // Temporizador de Power-up en pista
    if (State.gameMode !== 'SURVIVAL') {
      if (State.courtPowerup) {
        State.courtPowerup.timer -= dt;
        if (State.courtPowerup.timer <= 0) {
          State.courtPowerup = null;
        }
      } else {
        State.powerupSpawnTimer -= dt;
        if (State.powerupSpawnTimer <= 0) {
          spawnCourtPowerup();
          State.powerupSpawnTimer = 16.0;
        }
      }
    }

    // Timers de beneficios de paleta
    if (State.p1.bigPaddleTimer > 0) {
      State.p1.bigPaddleTimer -= dt;
      if (State.p1.bigPaddleTimer <= 0) {
        State.p1.width = CONFIG.PADDLE_W;
      }
    }

    // Guardar frame en el búfer de repetición circular (últimos 90 frames)
    if (State.balls.length > 0) {
      State.replayFrames.push({
        bX: State.balls[0].x,
        bY: State.balls[0].y,
        p1X: State.p1.x,
        p2X: State.p2.x,
        speed: State.balls[0].speed
      });
      if (State.replayFrames.length > 90) {
        State.replayFrames.shift();
      }
    }

    // Suavizado e inclinación de paleta P1
    const p1Diff = State.p1.targetX - State.p1.x;
    State.p1.x += p1Diff * Math.min(1, dt * 18);
    State.p1.tilt = Math.max(-0.25, Math.min(0.25, p1Diff * 0.008));

    // Paleta P2 (IA o segundo jugador)
    if (State.gameMode === 'SURVIVAL') {
      // En supervivencia, la pared superior actúa como frontón perfecto
      State.p2.x = State.balls[0] ? State.balls[0].x : CONFIG.VIRTUAL_W / 2;
    } else if (State.mode === '2P') {
      const p2Diff = State.p2.targetX - State.p2.x;
      State.p2.x += p2Diff * Math.min(1, dt * 18);
      State.p2.tilt = Math.max(-0.25, Math.min(0.25, p2Diff * 0.008));
    } else {
      updateAI(dt);
    }

    // Saque en curso
    if (State.serving) {
      State.serveTimer -= dt;
      if (State.serveTimer <= 0) {
        launchBall();
      }
      return;
    }

    // Actualizar cada pelota activa
    for (let i = State.balls.length - 1; i >= 0; i--) {
      updateBall(State.balls[i], dt, i);
    }

    particles.update(dt);
  }

  function updateBall(b, dt, ballIndex) {
    // Registro de estela
    b.trail.push({ x: b.x, y: b.y, speed: b.speed });
    if (b.trail.length > 18) {
      b.trail.shift();
    }

    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // Rebote en paredes laterales (Izquierda y Derecha)
    const courtLeft = 12 + CONFIG.BALL_RADIUS;
    const courtRight = CONFIG.VIRTUAL_W - 12 - CONFIG.BALL_RADIUS;

    if (b.x <= courtLeft) {
      b.x = courtLeft;
      b.vx = Math.abs(b.vx);
      SynthArenaAudio.sfxWallBounce();
      particles.emit(b.x, b.y, 6, getBallSpeedColor(b.speed));
    } else if (b.x >= courtRight) {
      b.x = courtRight;
      b.vx = -Math.abs(b.vx);
      SynthArenaAudio.sfxWallBounce();
      particles.emit(b.x, b.y, 6, getBallSpeedColor(b.speed));
    }

    // Colisión con Power-up en pista
    if (State.courtPowerup) {
      const pDist = Math.hypot(b.x - State.courtPowerup.x, b.y - State.courtPowerup.y);
      if (pDist <= CONFIG.BALL_RADIUS + State.courtPowerup.radius) {
        collectPowerup(State.courtPowerup);
      }
    }

    // Colisión con Paleta P1 (Inferior)
    const p1Top = CONFIG.P1_Y - CONFIG.PADDLE_H / 2;
    const p1Bottom = CONFIG.P1_Y + CONFIG.PADDLE_H / 2;
    const p1Left = State.p1.x - State.p1.width / 2;
    const p1Right = State.p1.x + State.p1.width / 2;

    if (b.vy > 0 && b.y + CONFIG.BALL_RADIUS >= p1Top && b.y - CONFIG.BALL_RADIUS <= p1Bottom) {
      if (b.x >= p1Left - 8 && b.x <= p1Right + 8) {
        // Impacto válido en paleta P1
        const rebound = FrontonPhysics.calculatePaddleRebound(b.x, State.p1.x, State.p1.width, b.speed, false);
        b.vx = rebound.vx;
        b.vy = rebound.vy;
        b.speed = rebound.newSpeed;
        b.y = p1Top - CONFIG.BALL_RADIUS - 1;

        State.rally++;
        if (State.rally > State.bestRally) {
          State.bestRally = State.rally;
        }

        if (State.gameMode === 'SURVIVAL') {
          State.survivalRebounds++;
          if (State.survivalRebounds > State.bestSurvivalRebounds) {
            State.bestSurvivalRebounds = State.survivalRebounds;
          }
          dom.targetModeLabel.textContent = `REBOTES: ${State.survivalRebounds}`;
        }

        dom.matchRally.textContent = `RALLY: ${State.rally}`;

        SynthArenaAudio.sfxPaddleHit(b.speed);
        particles.emit(b.x, b.y, b.speed > 550 ? 14 : 8, getBallSpeedColor(b.speed));

        // Juice: screen shake y hitstop si el golpe es fuerte
        if (b.speed > 550 && window.ArcadeJuice) {
          window.ArcadeJuice.shake(Math.min(10, Math.floor((b.speed - 480) * 0.03)), 0.2);
          if (b.speed >= 650) {
            window.ArcadeJuice.hitstop(50);
            window.ArcadeJuice.unlockAchievement('fronton', 'speed_650', 'Velocidad Supersónica', 'Golpeaste a más de 650 px/s', 'speed');
          }
        }

        // Logro de Rally
        if (State.rally >= 15 && window.ArcadeJuice) {
          window.ArcadeJuice.unlockAchievement('fronton', 'rally_15', 'Maestro del Rally', 'Rally de 15 o más golpes', 'zap');
        }
      }
    }

    // Red de portería protectora de P1
    if (b.vy > 0 && b.y >= CONFIG.VIRTUAL_H - 18 && State.p1.hasGoalNet) {
      State.p1.hasGoalNet = false;
      b.vy = -Math.abs(b.vy);
      b.y = CONFIG.VIRTUAL_H - 20;
      SynthArenaAudio.sfxPaddleHit(b.speed);
      particles.emit(b.x, b.y, 20, '#ec4899');
      if (window.ArcadeJuice) {
        window.ArcadeJuice.spawnFloat('RED DEFENSIVA', b.x, b.y - 30, '#ec4899');
        window.ArcadeJuice.unlockAchievement('fronton', 'goal_net_save', 'Salvada Épica', 'Salvaste un punto con la red', 'shield');
      }
      return;
    }

    // Colisión con Paleta P2 (Superior) o Frontón de Supervivencia
    if (State.gameMode === 'SURVIVAL') {
      if (b.vy < 0 && b.y - CONFIG.BALL_RADIUS <= 24) {
        b.vy = Math.abs(b.vy);
        b.y = 25 + CONFIG.BALL_RADIUS;
        b.speed += 12; // Acelera sin límite
        SynthArenaAudio.sfxWallBounce();
        particles.emit(b.x, b.y, 10, '#f2c94c');
      }
    } else {
      const p2Top = CONFIG.P2_Y - CONFIG.PADDLE_H / 2;
      const p2Bottom = CONFIG.P2_Y + CONFIG.PADDLE_H / 2;
      const p2Left = State.p2.x - State.p2.width / 2;
      const p2Right = State.p2.x + State.p2.width / 2;

      if (b.vy < 0 && b.y - CONFIG.BALL_RADIUS <= p2Bottom && b.y + CONFIG.BALL_RADIUS >= p2Top) {
        if (b.x >= p2Left - 8 && b.x <= p2Right + 8) {
          const rebound = FrontonPhysics.calculatePaddleRebound(b.x, State.p2.x, State.p2.width, b.speed, true);
          b.vx = rebound.vx;
          b.vy = rebound.vy;
          b.speed = rebound.newSpeed;
          b.y = p2Bottom + CONFIG.BALL_RADIUS + 1;

          State.rally++;
          if (State.rally > State.bestRally) {
            State.bestRally = State.rally;
          }
          dom.matchRally.textContent = `RALLY: ${State.rally}`;

          SynthArenaAudio.sfxPaddleHit(b.speed);
          particles.emit(b.x, b.y, b.speed > 550 ? 12 : 7, '#e07a1f');
        }
      }
    }

    // Anotación de Puntos (Pelota traspasa los fondos)
    if (b.y > CONFIG.VIRTUAL_H + 20) {
      // Punto para P2 / Rival (P1 no la alcanzó)
      if (State.balls.length > 1) {
        State.balls.splice(ballIndex, 1);
        return;
      }
      handlePointScored('P2');
    } else if (b.y < -20) {
      // Punto para P1 (P2 no la alcanzó)
      if (State.balls.length > 1) {
        State.balls.splice(ballIndex, 1);
        return;
      }
      handlePointScored('P1');
    }
  }

  function handlePointScored(winner) {
    if (State.gameMode === 'SURVIVAL') {
      // En supervivencia, fallar la pelota es Game Over
      triggerGameOver('SUPERVIVENCIA', false);
      return;
    }

    if (winner === 'P1') {
      State.p1Score++;
      SynthArenaAudio.sfxPointScored(true);
      if (window.ArcadeJuice) {
        window.ArcadeJuice.spawnFloat('PUNTO P1', CONFIG.VIRTUAL_W / 2, CONFIG.VIRTUAL_H / 2, '#f2c94c', 18);
        window.ArcadeJuice.unlockAchievement('fronton', 'first_point', 'Primer Saque', 'Anotaste tu primer punto', 'target');
      }
    } else {
      State.p2Score++;
      SynthArenaAudio.sfxPointScored(false);
      if (window.ArcadeJuice) {
        window.ArcadeJuice.spawnFloat('PUNTO RIVAL', CONFIG.VIRTUAL_W / 2, CONFIG.VIRTUAL_H / 2, '#e07a1f', 18);
      }
    }

    updateScoreboard();

    // Comprobar si se ha alcanzado la puntuación ganadora (7 puntos)
    if (State.p1Score >= CONFIG.WINNING_SCORE || State.p2Score >= CONFIG.WINNING_SCORE) {
      // Activar repetición en cámara lenta del punto definitivo
      startSlowMoReplay(winner === 'P1');
    } else {
      resetBall(winner === 'P1');
    }
  }

  function startSlowMoReplay(playerWon) {
    State.isReplaying = true;
    State.replayFrameIdx = 0;
    if (dom.replayBanner) {
      dom.replayBanner.classList.remove('hidden');
    }
  }

  function updateSlowMoReplay(dt) {
    if (!State.replayFrames || State.replayFrames.length === 0) {
      finishMatch();
      return;
    }

    // Reproducción al 35% de velocidad
    State.replayFrameIdx += dt * 30 * 0.35;
    const idx = Math.floor(State.replayFrameIdx);

    if (idx >= State.replayFrames.length) {
      State.isReplaying = false;
      if (dom.replayBanner) {
        dom.replayBanner.classList.add('hidden');
      }
      finishMatch();
      return;
    }

    const frame = State.replayFrames[idx];
    if (State.balls[0]) {
      State.balls[0].x = frame.bX;
      State.balls[0].y = frame.bY;
      State.balls[0].speed = frame.speed;
    }
    State.p1.x = frame.p1X;
    State.p2.x = frame.p2X;
  }

  function finishMatch() {
    SynthArenaAudio.stopBgm();
    State.gameOver = true;
    State.started = false;

    const p1Won = State.p1Score >= CONFIG.WINNING_SCORE;

    if (State.gameMode === 'TOURNAMENT') {
      if (p1Won) {
        const rival = CONFIG.TOURNAMENT_RIVALS[State.currentRivalIdx];
        if (!State.tournamentBeaten.includes(rival.id)) {
          State.tournamentBeaten.push(rival.id);
          saveTournamentProgress();
        }

        if (State.currentRivalIdx < CONFIG.TOURNAMENT_RIVALS.length - 1) {
          State.currentRivalIdx++;
          saveTournamentProgress();
          triggerGameOver(`Ronda superada. Siguiente rival: ${CONFIG.TOURNAMENT_RIVALS[State.currentRivalIdx].name}`, true);
        } else {
          triggerGameOver('CAMPEÓN DEL TORNEO', true);
          if (window.ArcadeJuice) {
            window.ArcadeJuice.unlockAchievement('fronton', 'tournament_champ', 'Campeón del Torneo', 'Venciste a los 5 rivales', 'trophy');
          }
        }
      } else {
        triggerGameOver('Derrota en el torneo. Vuelve a intentarlo.', false);
      }
    } else {
      triggerGameOver(p1Won ? 'VICTORIA' : 'FIN DEL PARTIDO', p1Won);
    }

    // Comprobar logro de blanqueada
    if (p1Won && State.p2Score === 0 && (State.difficulty === 'HARD' || State.gameMode === 'TOURNAMENT') && window.ArcadeJuice) {
      window.ArcadeJuice.unlockAchievement('fronton', 'clean_sheet', 'Blanqueada Perfecta', 'Ganaste 7-0 en máxima exigencia', 'crown');
    }
  }

  function triggerGameOver(title, playerWon) {
    dom.overlayGameOver.classList.remove('hidden');
    dom.winnerTitle.textContent = title;
    dom.winnerSub.textContent = playerWon ? 'Jugador 1 se lleva el partido' : 'El rival ha dominado la pista';
    dom.finalP1Score.textContent = State.p1Score;
    dom.finalP2Score.textContent = State.p2Score;
    dom.bestRallyDisplay.textContent = State.bestRally;

    // Guardar récord
    if (window.ArcadeStorage) {
      const oldBest = window.ArcadeStorage.getHighScore(CONFIG.STORAGE_KEY) || 0;
      if (State.bestRally > oldBest) {
        window.ArcadeStorage.setHighScore(CONFIG.STORAGE_KEY, State.bestRally);
        dom.newRecordTag.classList.remove('hidden');
      } else {
        dom.newRecordTag.classList.add('hidden');
      }
    }
  }

  function saveTournamentProgress() {
    if (window.ArcadeStorage) {
      try {
        localStorage.setItem('fronton_tourney_idx', String(State.currentRivalIdx));
        localStorage.setItem('fronton_tourney_beaten', JSON.stringify(State.tournamentBeaten));
      } catch (_) {}
    }
  }

  function loadTournamentProgress() {
    try {
      State.currentRivalIdx = parseInt(localStorage.getItem('fronton_tourney_idx') || '0', 10);
      State.tournamentBeaten = JSON.parse(localStorage.getItem('fronton_tourney_beaten') || '[]');
    } catch (_) {
      State.currentRivalIdx = 0;
      State.tournamentBeaten = [];
    }
  }

  // ==========================================
  // IA DE LOS RIVALES
  // ==========================================
  function updateAI(dt) {
    let aiConfig = CONFIG.DIFFICULTIES[State.difficulty];
    if (State.gameMode === 'TOURNAMENT') {
      aiConfig = CONFIG.TOURNAMENT_RIVALS[State.currentRivalIdx];
    }

    State.aiLagTimer -= dt;
    if (State.aiLagTimer <= 0) {
      State.aiLagTimer = aiConfig.reactionLag;
      const targetBall = State.balls[0];
      if (targetBall && targetBall.vy < 0) {
        // La bola se acerca a P2: predecir llegada con error controlado
        const errorOffset = (Math.random() - 0.5) * aiConfig.errorRate * 2;
        State.aiTargetX = targetBall.x + errorOffset;
      } else {
        // La bola se aleja: volver al centro
        State.aiTargetX = CONFIG.VIRTUAL_W / 2;
      }
    }

    const maxMove = aiConfig.speed * dt;
    const diff = State.aiTargetX - State.p2.x;
    if (Math.abs(diff) <= maxMove) {
      State.p2.x = State.aiTargetX;
    } else {
      State.p2.x += Math.sign(diff) * maxMove;
    }
    State.p2.x = FrontonPhysics.clampPaddleX(State.p2.x, State.p2.width, CONFIG.VIRTUAL_W);
    State.p2.tilt = Math.max(-0.25, Math.min(0.25, diff * 0.006));
  }

  function updateScoreboard() {
    dom.p1Score.textContent = State.p1Score;
    dom.p2Score.textContent = State.p2Score;
  }

  // ==========================================
  // RENDERIZADO VISUAL EN CANVAS
  // ==========================================
  function render() {
    const ctx = dom.ctx;
    if (!ctx) return;

    ctx.save();

    // Screen Shake de Juice
    if (window.ArcadeJuice && (window.ArcadeJuice.shakeX !== 0 || window.ArcadeJuice.shakeY !== 0)) {
      ctx.translate(window.ArcadeJuice.shakeX, window.ArcadeJuice.shakeY);
    }

    // Fondo futurista profundo con rejilla suave
    ctx.fillStyle = '#060814';
    ctx.fillRect(0, 0, CONFIG.VIRTUAL_W, CONFIG.VIRTUAL_H);

    drawCourtGrid(ctx);
    drawCourtPowerup(ctx);
    drawPaddles(ctx);
    drawBalls(ctx);
    particles.draw(ctx);

    // Textos flotantes del Juice
    if (window.ArcadeJuice) {
      window.ArcadeJuice.drawFloats(ctx);
      window.ArcadeJuice.drawDebugOverlay(ctx, particles.items.filter(p => p.active).length);
    }

    ctx.restore();
  }

  function drawCourtGrid(ctx) {
    const time = Date.now() * 0.002;
    const pulseAlpha = 0.25 + 0.15 * Math.sin(time);

    // Líneas laterales de luz de la arena
    ctx.strokeStyle = `rgba(0, 240, 255, ${pulseAlpha})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, CONFIG.VIRTUAL_W - 20, CONFIG.VIRTUAL_H - 20);

    // Red de medio campo holográfica
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(10, CONFIG.VIRTUAL_H / 2);
    ctx.lineTo(CONFIG.VIRTUAL_W - 10, CONFIG.VIRTUAL_H / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Círculo central cuántico
    ctx.strokeStyle = `rgba(0, 240, 255, ${pulseAlpha * 0.8})`;
    ctx.beginPath();
    ctx.arc(CONFIG.VIRTUAL_W / 2, CONFIG.VIRTUAL_H / 2, 45, 0, Math.PI * 2);
    ctx.stroke();

    // Red de portería protectora activa de P1
    if (State.p1.hasGoalNet) {
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.8)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(12, CONFIG.VIRTUAL_H - 12);
      ctx.lineTo(CONFIG.VIRTUAL_W - 12, CONFIG.VIRTUAL_H - 12);
      ctx.stroke();
    }
  }

  function drawCourtPowerup(ctx) {
    const pow = State.courtPowerup;
    if (!pow) return;

    ctx.save();
    ctx.translate(pow.x, pow.y);

    // Resplandor pulsante
    const pulse = 1 + 0.15 * Math.sin(Date.now() * 0.008);
    ctx.fillStyle = pow.color;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(0, 0, pow.radius * 1.5 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.strokeStyle = pow.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, pow.radius, 0, Math.PI * 2);
    ctx.stroke();

    if (window.ArcadeIcons && ArcadeIcons.drawToCanvas) {
      ArcadeIcons.drawToCanvas(ctx, pow.icon, -9, -9, 18, pow.color);
    } else {
      ctx.fillStyle = pow.color;
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pow.type[0], 0, 1);
    }
    ctx.restore();
  }

  function drawPaddles(ctx) {
    // Paleta 1 (Inferior - Oro)
    ctx.save();
    ctx.translate(State.p1.x, CONFIG.P1_Y);
    ctx.rotate(State.p1.tilt);

    ctx.fillStyle = '#f2c94c';
    ctx.fillRect(-State.p1.width / 2, -CONFIG.PADDLE_H / 2, State.p1.width, CONFIG.PADDLE_H);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-State.p1.width / 4, -CONFIG.PADDLE_H / 4, State.p1.width / 2, CONFIG.PADDLE_H / 2);
    ctx.restore();

    // Paleta 2 (Superior - Ámbar)
    if (State.gameMode !== 'SURVIVAL') {
      ctx.save();
      ctx.translate(State.p2.x, CONFIG.P2_Y);
      ctx.rotate(State.p2.tilt);

      ctx.fillStyle = '#e07a1f';
      ctx.fillRect(-State.p2.width / 2, -CONFIG.PADDLE_H / 2, State.p2.width, CONFIG.PADDLE_H);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-State.p2.width / 4, -CONFIG.PADDLE_H / 4, State.p2.width / 2, CONFIG.PADDLE_H / 2);
      ctx.restore();
    }
  }

  function drawBalls(ctx) {
    for (const b of State.balls) {
      const ballColor = getBallSpeedColor(b.speed);

      // Estela larga con degradado
      if (b.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(b.trail[0].x, b.trail[0].y);
        for (let i = 1; i < b.trail.length; i++) {
          ctx.lineTo(b.trail[i].x, b.trail[i].y);
        }
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = ballColor;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.35;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      // Núcleo de la pelota
      ctx.save();
      ctx.fillStyle = ballColor;
      ctx.shadowBlur = 15;
      ctx.shadowColor = ballColor;
      ctx.beginPath();
      ctx.arc(b.x, b.y, CONFIG.BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Centro brillante
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, CONFIG.BALL_RADIUS * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ==========================================
  // GAME LOOP
  // ==========================================
  let lastTime = 0;
  function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    let dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    if (dt > 0.08) dt = 0.08;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
  }

  // ==========================================
  // ENLACE DE ENTRADA (TOUCH & MOUSE & KEYBOARD)
  // ==========================================
  function setupInputs() {
    const canvas = dom.canvas;

    const getCanvasPos = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CONFIG.VIRTUAL_W / rect.width;
      const scaleY = CONFIG.VIRTUAL_H / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      SynthArenaAudio.init();
      const pos = getCanvasPos(e.clientX, e.clientY);
      State.touches.set(e.pointerId, pos);

      const zone = FrontonPhysics.classifyTouchZone(pos.y, CONFIG.VIRTUAL_H);
      if (zone === 'P1') {
        State.p1.targetX = FrontonPhysics.clampPaddleX(pos.x, State.p1.width, CONFIG.VIRTUAL_W);
      } else if (State.mode === '2P' && State.gameMode === 'QUICK') {
        State.p2.targetX = FrontonPhysics.clampPaddleX(pos.x, State.p2.width, CONFIG.VIRTUAL_W);
      }
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!State.touches.has(e.pointerId)) return;
      const pos = getCanvasPos(e.clientX, e.clientY);
      State.touches.set(e.pointerId, pos);

      const zone = FrontonPhysics.classifyTouchZone(pos.y, CONFIG.VIRTUAL_H);
      if (zone === 'P1') {
        State.p1.targetX = FrontonPhysics.clampPaddleX(pos.x, State.p1.width, CONFIG.VIRTUAL_W);
      } else if (State.mode === '2P' && State.gameMode === 'QUICK') {
        State.p2.targetX = FrontonPhysics.clampPaddleX(pos.x, State.p2.width, CONFIG.VIRTUAL_W);
      }
    });

    const removeTouch = (e) => {
      State.touches.delete(e.pointerId);
    };
    canvas.addEventListener('pointerup', removeTouch);
    canvas.addEventListener('pointercancel', removeTouch);

    // Teclado
    window.addEventListener('keydown', (e) => {
      SynthArenaAudio.init();
      if (e.key === 'ArrowLeft') {
        State.p1.targetX = FrontonPhysics.clampPaddleX(State.p1.targetX - 32, State.p1.width, CONFIG.VIRTUAL_W);
      } else if (e.key === 'ArrowRight') {
        State.p1.targetX = FrontonPhysics.clampPaddleX(State.p1.targetX + 32, State.p1.width, CONFIG.VIRTUAL_W);
      } else if (e.key === 'a' || e.key === 'A') {
        if (State.mode === '2P') State.p2.targetX = FrontonPhysics.clampPaddleX(State.p2.targetX - 32, State.p2.width, CONFIG.VIRTUAL_W);
      } else if (e.key === 'd' || e.key === 'D') {
        if (State.mode === '2P') State.p2.targetX = FrontonPhysics.clampPaddleX(State.p2.targetX + 32, State.p2.width, CONFIG.VIRTUAL_W);
      } else if (e.key === 'p' || e.key === 'P') {
        togglePause();
      }
    });
  }

  function togglePause() {
    if (!State.started || State.gameOver) return;
    State.paused = !State.paused;
    dom.overlayPause.classList.toggle('hidden', !State.paused);
  }

  // ==========================================
  // CONFIGURACIÓN DE UI Y MODALES
  // ==========================================
  function setupUI() {
    loadTournamentProgress();

    // Tabs de Modo
    document.querySelectorAll('.btn-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.btn-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        State.gameMode = tab.dataset.gameMode;

        dom.panelQuick.classList.toggle('hidden', State.gameMode !== 'QUICK');
        dom.panelTournament.classList.toggle('hidden', State.gameMode !== 'TOURNAMENT');
        dom.panelSurvival.classList.toggle('hidden', State.gameMode !== 'SURVIVAL');

        if (State.gameMode === 'TOURNAMENT') renderTournamentRoster();
      });
    });

    // Modo 1P / 2P
    document.querySelectorAll('.btn-toggle[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-toggle[data-mode]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        State.mode = btn.dataset.mode;
        dom.difficultyGroup.style.display = State.mode === '1P' ? 'block' : 'none';
      });
    });

    // Dificultad IA
    document.querySelectorAll('.btn-diff').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-diff').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        State.difficulty = btn.dataset.diff;
        dom.diffDesc.textContent =
          State.difficulty === 'EASY' ? 'IA con reflejos relajados y margen de error' :
          State.difficulty === 'MED' ? 'IA con reflejos ágiles y velocidad equilibrada' :
          'IA cibernética de alta velocidad con lectura instantánea';
      });
    });

    dom.btnStart.addEventListener('click', startMatch);
    dom.btnMatchRestart.addEventListener('click', startMatch);
    dom.btnBackToSetup.addEventListener('click', () => {
      dom.overlayGameOver.classList.add('hidden');
      dom.startCard.classList.remove('hidden');
    });

    // Pausa
    dom.btnPauseHeader.addEventListener('click', togglePause);
    dom.btnResume.addEventListener('click', togglePause);
    dom.btnPauseRestart.addEventListener('click', () => {
      dom.overlayPause.classList.add('hidden');
      startMatch();
    });

    // Opciones
    const openOptions = () => dom.modalOptions.classList.remove('hidden');
    dom.btnOptionsHeader.addEventListener('click', openOptions);
    if (dom.btnPauseOptions) dom.btnPauseOptions.addEventListener('click', openOptions);
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

    // Logros
    const openAchievements = () => {
      renderAchievements();
      dom.modalAchievements.classList.remove('hidden');
    };
    dom.btnAchievementsHeader.addEventListener('click', openAchievements);
    dom.btnAchievementsView.addEventListener('click', openAchievements);
    dom.btnCloseAchievements.addEventListener('click', () => dom.modalAchievements.classList.add('hidden'));

    // Misiones
    dom.btnDailyMissions.addEventListener('click', () => {
      renderMissions();
      dom.modalMissions.classList.remove('hidden');
    });
    dom.btnCloseMissions.addEventListener('click', () => dom.modalMissions.classList.add('hidden'));

    // Sonido toggle
    dom.btnSoundToggle.addEventListener('click', () => {
      if (window.ArcadeAudio) {
        const muted = window.ArcadeAudio.toggleMute();
        dom.iconSoundOn.classList.toggle('hidden', muted);
        dom.iconSoundOff.classList.toggle('hidden', !muted);
      }
    });
  }

  function renderTournamentRoster() {
    dom.tournamentRoster.innerHTML = '';
    CONFIG.TOURNAMENT_RIVALS.forEach((rival, idx) => {
      const isBeaten = State.tournamentBeaten.includes(rival.id);
      const isCurrent = idx === State.currentRivalIdx;
      const chip = document.createElement('div');
      chip.className = `rival-chip ${isCurrent ? 'current' : ''} ${isBeaten ? 'beaten' : ''}`;
      chip.innerHTML = `
        <div class="rival-meta">
          <span class="rival-avatar">${window.ArcadeIcons ? ArcadeIcons.getSvg(rival.avatar, 20) : ''}</span>
          <div>
            <div class="rival-name">${rival.name}</div>
            <div class="rival-desc">${rival.desc}</div>
          </div>
        </div>
        <div class="rival-status">${isBeaten ? 'VENCIDO' : isCurrent ? 'ACTUAL' : 'BLOQUEADO'}</div>
      `;
      dom.tournamentRoster.appendChild(chip);
    });
  }

  function renderAchievements() {
    dom.achievementsList.innerHTML = '';
    CONFIG.ACHIEVEMENTS.forEach(ach => {
      const unlocked = window.ArcadeJuice ? window.ArcadeJuice.hasAchievement('fronton', ach.id) : false;
      const el = document.createElement('div');
      el.className = `ach-item ${unlocked ? 'unlocked' : ''}`;
      el.innerHTML = `
        <span class="ach-icon">${window.ArcadeIcons ? ArcadeIcons.getSvg(ach.icon, 20) : ''}</span>
        <div class="ach-info">
          <div class="ach-title">${ach.title} ${unlocked ? '(Completado)' : '(Bloqueado)'}</div>
          <div class="ach-desc">${ach.desc}</div>
        </div>
      `;
      dom.achievementsList.appendChild(el);
    });
  }

  function renderMissions() {
    dom.missionsList.innerHTML = '';
    const stats = window.ArcadeJuice ? window.ArcadeJuice.getStats('fronton') : { plays: 0, best: 0 };
    const missions = [
      { title: 'Veterano de Pista', desc: 'Juega 2 partidos en cualquier modo', current: Math.min(2, stats.plays), target: 2 },
      { title: 'Duelo Intenso', desc: 'Consigue un rally de al menos 10 golpes', current: Math.min(10, stats.best), target: 10 },
      { title: 'Cazador Cuántico', desc: 'Recoge 3 power-ups en tus partidas', current: Math.min(3, State.powerupsCollectedMatch), target: 3 }
    ];

    missions.forEach(m => {
      const pct = Math.min(100, Math.round((m.current / m.target) * 100));
      const el = document.createElement('div');
      el.className = 'mission-item';
      el.innerHTML = `
        <div class="mission-info">
          <div class="mission-title">${m.title} (${m.current}/${m.target})</div>
          <div class="mission-desc">${m.desc}</div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
      dom.missionsList.appendChild(el);
    });
  }

  function handleResize() {
    const canvas = dom.canvas;
    if (!canvas) return;
    dom.ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CONFIG.VIRTUAL_W * dpr;
    canvas.height = CONFIG.VIRTUAL_H * dpr;
    dom.ctx.scale(dpr, dpr);
  }

  function init() {
    handleResize();
    window.addEventListener('resize', handleResize);
    setupInputs();
    setupUI();
    requestAnimationFrame(gameLoop);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
