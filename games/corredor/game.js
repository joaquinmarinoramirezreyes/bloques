/**
 * games/corredor/game.js - Corredor Arcade 00 (Edición Maestra de Calidad)
 * Cyber-runner hipercinético con biomas evolutivos, tienda de mejoras,
 * misiones dinámicas, eventos aleatorios, física solvable verificable y Juice total.
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
    STORAGE_KEY_V1: 'corredor:v1:best_distance',
    STORAGE_KEY_V2: 'corredor:v2',
    PARTICLE_POOL_SIZE: 90,

    // 4 BIOMAS EVOLUTIVOS (Cada ~750m)
    BIOMES: [
      {
        id: 'sunset',
        start: 0,
        name: 'SECTOR 1',
        desc: 'DISTRITO SOLAR',
        themeColor: '#e4572e',
        skyTop: '#3a1f0f',
        skyBottom: '#6e3518',
        trackColor: '#4a2814',
        accent: '#e4572e',
        obstacleHue: '#e4572e',
        sunColor: '#f4c27a'
      },
      {
        id: 'canyon',
        start: 750,
        name: 'SECTOR 2',
        desc: 'CAÑÓN DE SILICIO',
        themeColor: '#ffaa00',
        skyTop: '#1a0b02',
        skyBottom: '#3d1c08',
        trackColor: '#45200c',
        accent: '#ffaa00',
        obstacleHue: '#ff4400',
        sunColor: '#ffaa00'
      },
      {
        id: 'crypt',
        start: 1500,
        name: 'SECTOR 3',
        desc: 'CRIPTA CUÁNTICA',
        themeColor: '#b388ff',
        skyTop: '#0d0417',
        skyBottom: '#2a0e44',
        trackColor: '#2b1248',
        accent: '#d500f9',
        obstacleHue: '#e040fb',
        sunColor: '#b388ff'
      },
      {
        id: 'orbit',
        start: 2250,
        name: 'SECTOR 4',
        desc: 'ÓRBITA ESTELAR',
        themeColor: '#00e676',
        skyTop: '#020d08',
        skyBottom: '#062618',
        trackColor: '#0e3a24',
        accent: '#00e676',
        obstacleHue: '#ffd700',
        sunColor: '#00e676'
      }
    ],

    // CATÁLOGO DE TIENDA Y PERSONALIZACIÓN
    SKINS: {
      neo: { id: 'neo', name: 'Sol (Naranja)', price: 0, avatar: 'runner', color: '#e4572e', secondary: '#f4c27a', desc: 'Corredor solar veloz' },
      volt: { id: 'volt', name: 'Volt (Amarillo)', price: 150, avatar: 'zap', color: '#ffd000', secondary: '#ff8800', desc: 'Androide de alta tensión' },
      specter: { id: 'specter', name: 'Specter (Carmesí)', price: 300, avatar: 'fire', color: '#ff0055', secondary: '#880022', desc: 'Agente sigiloso de plasma rojo' },
      valkyrie: { id: 'valkyrie', name: 'Valkyrie (Esmeralda)', price: 500, avatar: 'shield', color: '#00e676', secondary: '#00b0ff', desc: 'Prototipo de élite' }
    },

    AURAS: {
      classic: { id: 'classic', name: 'Estela Solar', price: 0, color: '#e4572e', desc: 'Pulsos de energía solar' },
      plasma: { id: 'plasma', name: 'Estela de Fuego', price: 100, color: '#c43a12', desc: 'Escape de combustible' },
      quantum: { id: 'quantum', name: 'Escudo Protector', price: 250, color: '#b388ff', desc: 'Anillo defensivo' },
      propulsion: { id: 'propulsion', name: 'Impulso Doble', price: 400, color: '#ffcc00', desc: 'Chorros de partículas doradas' }
    },

    UPGRADES: {
      magnet: { id: 'magnet', name: 'Imán Potenciado', icon: 'magnet', basePrice: 80, maxLevel: 3, desc: '+30% de radio y duración' },
      shield: { id: 'shield', name: 'Escudo Robusto', icon: 'shield', basePrice: 120, maxLevel: 3, desc: 'Recarga lenta cada 45s sin impacto' },
      coinMultiplier: { id: 'coinMultiplier', name: 'Multiplicador Monedas', icon: 'coin', basePrice: 150, maxLevel: 3, desc: '+1 moneda por cada recogida' }
    }
  };

  // ==========================================
  // FÍSICA Y GENERADOR SOLVABLE (Compatible con Node y Tests)
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
        obs.y = CONFIG.GROUND_Y - 70; // Plataforma suspendida accesible
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
  // POOL DE PARTÍCULAS DE ALTO RENDIMIENTO
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
          color: '#e4572e'
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
        const spd = 60 + Math.random() * 190;
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

    getActiveCount() {
      let count = 0;
      for (let i = 0; i < this.size; i++) {
        if (this.items[i].active) count++;
      }
      return count;
    }
  }

  // ==========================================
  // ESTADO Y PERSISTENCIA
  // ==========================================
  const State = {
    started: false,
    paused: false,
    gameOver: false,
    distance: 0,
    coins: 0,
    sessionCoinsEarned: 0,
    maxComboThisRun: 1,
    speed: CONFIG.BASE_SPEED,
    currentSectorIndex: 0,

    // Sistema de Combo
    combo: 1,
    comboTimer: 0,

    // Corredor y Animaciones
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
      shieldRechargeTimer: 0,
      turboTimer: 0,
      slowmoTimer: 0,
      magnetTimer: 0,
      runAnim: 0,
      flipRotation: 0,
      isFlipping: false,
      squashX: 1.0,
      squashY: 1.0,
      dustTimer: 0,
      tumbleAngle: 0,
      tumbleVx: 0,
      tumbleVy: 0
    },

    // Obstáculos y Entidades
    obstacles: [],
    coinsList: [],
    powerupsList: [],
    sparkStormList: [],

    // Posición continua en el mundo (cero saltos)
    worldScroll: 0,

    // Tren Maglev / Satélite de fondo
    maglevTrain: {
      x: -600,
      speed: 850,
      active: false,
      timer: 4.0
    },

    // Eventos Dinámicos
    eventTimer: 25.0,
    activeEvent: null, // 'LOW_GRAVITY', 'SPARK_STORM', 'HYPER_SPEED'
    eventRemaining: 0,

    // Misión Dinámica en carrera
    currentMission: null,

    // Cámara adaptativa según velocidad
    cameraZoom: 1.0,
    scale: 1,

    // Datos persistentes (corredor:v2)
    saveData: {
      bestDistance: 0,
      wallet: 0,
      equippedSkin: 'neo',
      equippedAura: 'classic',
      unlockedSkins: ['neo'],
      unlockedAuras: ['classic'],
      upgrades: {
        magnet: 0,
        shield: 0,
        coinMultiplier: 0
      },
      stats: {
        totalDistance: 0,
        totalFlips: 0,
        totalNearMisses: 0,
        totalSlides: 0
      }
    }
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
    btnShopHeader: document.getElementById('btn-shop-header'),
    btnAchievementsHeader: document.getElementById('btn-achievements-header'),
    btnOptionsHeader: document.getElementById('btn-options-header'),
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
    hudMissionBar: document.getElementById('hud-mission-bar'),
    hudMissionText: document.getElementById('hud-mission-text'),
    sectorBanner: document.getElementById('sector-banner'),
    sectorTitle: document.getElementById('sector-title'),
    sectorDesc: document.getElementById('sector-desc'),
    eventBanner: document.getElementById('event-banner'),
    eventIcon: document.getElementById('event-icon'),
    eventTitle: document.getElementById('event-title'),
    eventDesc: document.getElementById('event-desc'),
    startCard: document.getElementById('start-card'),
    btnStartRun: document.getElementById('btn-start-run'),
    startRecordVal: document.getElementById('start-record-val'),
    startCoinsVal: document.getElementById('start-coins-val'),
    startSkinAvatar: document.getElementById('start-skin-avatar'),
    startSkinName: document.getElementById('start-skin-name'),
    startAuraName: document.getElementById('start-aura-name'),
    btnQuickShop: document.getElementById('btn-quick-shop'),
    btnOpenShop: document.getElementById('btn-open-shop'),
    btnOpenMissions: document.getElementById('btn-open-missions'),
    overlayPause: document.getElementById('overlay-pause'),
    btnResume: document.getElementById('btn-resume'),
    btnRestartRun: document.getElementById('btn-restart-run'),
    btnPauseOptions: document.getElementById('btn-pause-options'),
    overlayGameOver: document.getElementById('overlay-gameover'),
    goTitle: document.getElementById('go-title'),
    goSub: document.getElementById('go-sub'),
    finalDistVal: document.getElementById('final-dist-val'),
    finalCoinsVal: document.getElementById('final-coins-val'),
    finalComboVal: document.getElementById('final-combo-val'),
    bestDistVal: document.getElementById('best-dist-val'),
    finalBankVal: document.getElementById('final-bank-val'),
    btnRetry: document.getElementById('btn-retry'),
    btnGoShop: document.getElementById('btn-go-shop'),

    // Modales
    modalShop: document.getElementById('modal-shop'),
    shopWalletVal: document.getElementById('shop-wallet-val'),
    gridSkins: document.getElementById('grid-skins'),
    gridAuras: document.getElementById('grid-auras'),
    gridUpgrades: document.getElementById('grid-upgrades'),
    btnCloseShop: document.getElementById('btn-close-shop'),

    modalAchievements: document.getElementById('modal-achievements'),
    achList: document.getElementById('ach-list'),
    btnCloseAch: document.getElementById('btn-close-ach'),

    modalMissions: document.getElementById('modal-missions'),
    missionsList: document.getElementById('missions-list'),
    btnCloseMissions: document.getElementById('btn-close-missions'),

    modalOptions: document.getElementById('modal-options'),
    optSfx: document.getElementById('opt-sfx'),
    optBgm: document.getElementById('opt-bgm'),
    optVibration: document.getElementById('opt-vibration'),
    optContrast: document.getElementById('opt-contrast'),
    btnCloseOptions: document.getElementById('btn-close-options')
  };

  dom.ctx = dom.canvas.getContext('2d');

  // ==========================================
  // PERSISTENCIA Y MIGRACIÓN VERSIONADA
  // ==========================================
  function loadGameData() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEY_V2);
      if (raw) {
        const parsed = JSON.parse(raw);
        State.saveData = Object.assign(State.saveData, parsed);
      } else {
        // Migración de v1 si existía
        const oldBest = window.ArcadeStorage?.getHighScore(CONFIG.STORAGE_KEY_V1) || 0;
        if (oldBest > 0) {
          State.saveData.bestDistance = oldBest;
          State.saveData.wallet = Math.floor(oldBest * 0.4);
          saveGameData();
        }
      }
    } catch (_) {}
    updateShopWalletDisplay();
  }

  function saveGameData() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY_V2, JSON.stringify(State.saveData));
      // Sincronizar clave principal para ArcadeStorage
      window.ArcadeStorage?.setHighScore(CONFIG.STORAGE_KEY_V1, State.saveData.bestDistance);
    } catch (_) {}
  }

  // ==========================================
  // AUDIO SINTETIZADO Y MÚSICA ADAPTATIVA
  // ==========================================
  let bgmInterval = null;
  let bgmStep = 0;
  const bgmNotes = [220, 261.63, 293.66, 329.63, 392, 329.63, 293.66, 261.63];

  function startBGM() {
    if (bgmInterval || !window.ArcadeJuice?.getOption('bgm', true)) return;
    scheduleNextBgmNote();
  }

  function stopBGM() {
    if (bgmInterval) {
      clearTimeout(bgmInterval);
      bgmInterval = null;
    }
  }

  function scheduleNextBgmNote() {
    if (!State.started || State.paused || State.gameOver || !window.ArcadeJuice?.getOption('bgm', true)) {
      bgmInterval = null;
      return;
    }

    const freq = bgmNotes[bgmStep % bgmNotes.length];
    bgmStep++;

    if (window.ArcadeAudio) {
      window.ArcadeAudio.playTone(freq, 'triangle', 0.08, 0.05);
    }

    // El tempo acelera suavemente conforme State.speed aumenta
    const speedRatio = (State.speed - CONFIG.BASE_SPEED) / (CONFIG.MAX_SPEED - CONFIG.BASE_SPEED);
    const delay = Math.max(140, 240 - speedRatio * 90);
    bgmInterval = setTimeout(scheduleNextBgmNote, delay);
  }

  function playAudio(type) {
    if (!window.ArcadeAudio || !window.ArcadeJuice?.getOption('sfx', true)) return;
    switch (type) {
      case 'jump':
        window.ArcadeAudio.playTone(430, 'square', 0.07, 0.12);
        break;
      case 'double-jump':
        window.ArcadeAudio.playTone(680, 'square', 0.08, 0.14);
        setTimeout(() => window.ArcadeAudio?.playTone(920, 'sine', 0.06, 0.1), 50);
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
        [300, 520, 820, 1250].forEach((f, i) => {
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
      case 'mission':
        [587, 880, 1174].forEach((f, i) => {
          setTimeout(() => window.ArcadeAudio?.playTone(f, 'square', 0.1, 0.15), i * 80);
        });
        break;
      case 'event':
        [440, 554, 659, 880].forEach((f, i) => {
          setTimeout(() => window.ArcadeAudio?.playTone(f, 'sine', 0.12, 0.18), i * 60);
        });
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
    }
  }

  // ==========================================
  // SISTEMA DE MISIONES DINÁMICAS EN CARRERA
  // ==========================================
  const MISSION_TYPES = [
    { type: 'NEAR_MISS', desc: 'Esquiva 4 obstáculos por los pelos', target: 4, current: 0 },
    { type: 'COINS', desc: 'Recoge 25 monedas en esta tanda', target: 25, current: 0 },
    { type: 'SLIDES', desc: 'Realiza 3 deslizamientos bajo drones', target: 3, current: 0 },
    { type: 'FLIPS', desc: 'Ejecuta 5 volteretas 360° en el aire', target: 5, current: 0 }
  ];

  function pickNewInRunMission() {
    const template = MISSION_TYPES[Math.floor(Math.random() * MISSION_TYPES.length)];
    State.currentMission = {
      type: template.type,
      desc: template.desc,
      target: template.target,
      current: 0
    };
    updateMissionBarDisplay();
  }

  function advanceMission(type, amount = 1) {
    if (!State.currentMission || State.currentMission.type !== type) return;
    State.currentMission.current += amount;
    updateMissionBarDisplay();

    if (State.currentMission.current >= State.currentMission.target) {
      // Misión completada
      playAudio('mission');
      const bonusCoins = 50;
      State.coins += bonusCoins;
      State.saveData.wallet += bonusCoins;
      addCombo();
      window.ArcadeJuice?.spawnFloat(`MISIÓN CUMPLIDA +${bonusCoins}`, State.player.x + 14, State.player.y - 20, '#ffcc00', 14);
      window.ArcadeJuice?.vibrate([30, 40, 50]);
      setTimeout(pickNewInRunMission, 1600);
    }
  }

  function updateMissionBarDisplay() {
    if (!State.currentMission) {
      dom.hudMissionBar.classList.add('hidden');
      return;
    }
    dom.hudMissionBar.classList.remove('hidden');
    dom.hudMissionText.textContent = `${State.currentMission.desc} [${Math.min(State.currentMission.target, State.currentMission.current)}/${State.currentMission.target}]`;
  }

  // ==========================================
  // EVENTOS DINÁMICOS ALEATORIOS
  // ==========================================
  function triggerRandomEvent() {
    const events = ['LOW_GRAVITY', 'SPARK_STORM', 'HYPER_SPEED'];
    const chosen = events[Math.floor(Math.random() * events.length)];
    State.activeEvent = chosen;
    State.eventRemaining = chosen === 'HYPER_SPEED' ? 6.0 : 8.0;

    playAudio('event');
    window.ArcadeJuice?.shake(4, 0.3);

    if (chosen === 'LOW_GRAVITY') {
      if (dom.eventIcon) dom.eventIcon.innerHTML = window.ArcadeIcons ? window.ArcadeIcons.get('planet', { size: 18 }) : '';
      dom.eventTitle.textContent = 'ZONA DE BAJA GRAVEDAD';
      dom.eventDesc.textContent = 'Física orbital: saltos elevados y flotantes';
    } else if (chosen === 'SPARK_STORM') {
      if (dom.eventIcon) dom.eventIcon.innerHTML = window.ArcadeIcons ? window.ArcadeIcons.get('zap', { size: 18 }) : '';
      dom.eventTitle.textContent = 'TORMENTA DE CHISPAS';
      dom.eventDesc.textContent = 'Lluvia de energía estelar que bonifica créditos';
      // Generar lluvia de chispas en pantalla
      for (let k = 0; k < 25; k++) {
        State.sparkStormList.push({
          x: Math.random() * CONFIG.VIRTUAL_W + 100,
          y: -Math.random() * 300,
          vy: 140 + Math.random() * 120,
          collected: false
        });
      }
    } else if (chosen === 'HYPER_SPEED') {
      if (dom.eventIcon) dom.eventIcon.innerHTML = window.ArcadeIcons ? window.ArcadeIcons.get('rocket', { size: 18 }) : '';
      dom.eventTitle.textContent = 'TRAMO HIPERVELOCIDAD';
      dom.eventDesc.textContent = 'Velocidad extrema y puntos multiplicados';
      State.player.turboTimer = 6.0;
    }

    dom.eventBanner.classList.remove('hidden');
    setTimeout(() => {
      dom.eventBanner.classList.add('hidden');
    }, 2200);
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
    loadGameData();

    State.started = true;
    State.paused = false;
    State.gameOver = false;
    State.distance = 0;
    State.coins = 0;
    State.sessionCoinsEarned = 0;
    State.maxComboThisRun = 1;
    State.speed = CONFIG.BASE_SPEED;
    State.combo = 1;
    State.comboTimer = 0;
    State.currentSectorIndex = 0;
    State.worldScroll = 0;
    State.activeEvent = null;
    State.eventRemaining = 0;
    State.eventTimer = 22.0 + Math.random() * 10;
    State.cameraZoom = 1.0;
    State.sparkStormList = [];

    const p = State.player;
    p.y = CONFIG.GROUND_Y - CONFIG.PLAYER_H_STAND;
    p.vy = 0;
    p.h = CONFIG.PLAYER_H_STAND;
    p.onGround = true;
    p.jumping = false;
    p.canDoubleJump = true;
    p.sliding = false;
    p.hasShield = State.saveData.upgrades.shield > 0;
    p.shieldRechargeTimer = 0;
    p.turboTimer = 0;
    p.slowmoTimer = 0;
    p.magnetTimer = 0;
    p.invulnerableTimer = 0;
    p.isFlipping = false;
    p.flipRotation = 0;
    p.squashX = 1.0;
    p.squashY = 1.0;
    p.tumbleAngle = 0;

    State.obstacles = [];
    State.coinsList = [];
    State.powerupsList = [];
    generator.reset(550);

    for (let i = 0; i < 4; i++) {
      spawnNextObstacle();
    }

    pickNewInRunMission();

    dom.startCard.classList.add('hidden');
    dom.overlayPause.classList.add('hidden');
    dom.overlayGameOver.classList.add('hidden');
    dom.modalShop.classList.add('hidden');
    dom.modalAchievements.classList.add('hidden');
    dom.modalMissions.classList.add('hidden');
    dom.modalOptions.classList.add('hidden');

    updateHUD();
    triggerSectorBanner(0);
    startBGM();

    window.ArcadeJuice?.trackPlay('corredor', 0);
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
      if (Math.random() < 0.45) {
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
    const s = CONFIG.BIOMES[sectorIdx];
    if (!s) return;
    dom.sectorTitle.textContent = s.name;
    dom.sectorTitle.style.color = s.themeColor;
    dom.sectorDesc.textContent = s.desc;
    dom.sectorBanner.classList.remove('hidden');
    setTimeout(() => {
      dom.sectorBanner.classList.add('hidden');
    }, 1800);

    if (sectorIdx === 1) {
      window.ArcadeJuice?.unlockAchievement('corredor', 'ach_canyon', 'Explorador del Cañón', 'Alcanza el Cañón de Silicio a 750m');
    }
  }

  function triggerGameOver(reason = 'Colisión') {
    State.gameOver = true;
    State.started = false;
    stopBGM();

    playAudio('crash');
    window.ArcadeJuice?.shake(12, 0.4);
    window.ArcadeJuice?.hitstop(60);
    window.ArcadeJuice?.vibrate([70, 90, 140]);
    particles.burst(State.player.x + 14, State.player.y + 20, 40, '#e4572e');

    const finalMeters = Math.floor(State.distance);
    let isNewRecord = false;
    if (finalMeters > State.saveData.bestDistance) {
      State.saveData.bestDistance = finalMeters;
      isNewRecord = true;
    }

    State.saveData.stats.totalDistance += finalMeters;
    saveGameData();

    // Comprobar logros
    if (finalMeters >= 250) {
      window.ArcadeJuice?.unlockAchievement('corredor', 'ach_takeoff', 'Primer Despegue', 'Corre tus primeros 250 m');
    }
    if (State.speed >= 650) {
      window.ArcadeJuice?.unlockAchievement('corredor', 'ach_terminal', 'Velocidad Terminal', 'Alcanza 650 px/s de velocidad');
    }
    if (State.sessionCoinsEarned >= 100) {
      window.ArcadeJuice?.unlockAchievement('corredor', 'ach_rich', 'Coleccionista de Créditos', 'Acumula 100 monedas en una carrera');
    }

    dom.finalDistVal.textContent = `${finalMeters} m`;
    dom.finalCoinsVal.textContent = `${State.coins}`;
    dom.finalComboVal.textContent = `x${State.maxComboThisRun}`;
    dom.bestDistVal.textContent = `${State.saveData.bestDistance} m`;
    dom.finalBankVal.textContent = `${State.saveData.wallet}`;

    if (isNewRecord) {
      dom.goTitle.textContent = 'NUEVO RÉCORD';
      dom.goTitle.style.color = '#ffcc00';
      dom.goSub.textContent = `Superaste tu marca personal con ${finalMeters} metros.`;
    } else {
      dom.goTitle.textContent = 'FIN DE CARRERA';
      dom.goTitle.style.color = '#e4572e';
      dom.goSub.textContent = reason;
    }

    setTimeout(() => {
      dom.overlayGameOver.classList.remove('hidden');
    }, 450);
  }

  function addCombo() {
    State.combo = Math.min(5, State.combo + 1);
    State.comboTimer = 3.5;
    if (State.combo > State.maxComboThisRun) {
      State.maxComboThisRun = State.combo;
    }

    playAudio('combo');
    window.ArcadeJuice?.vibrate(10);
    particles.burst(State.player.x + 14, State.player.y, 8, '#ffcc00');
    window.ArcadeJuice?.spawnFloat(`COMBO x${State.combo}`, State.player.x + 14, State.player.y - 14, '#ffcc00', 12);

    if (State.combo >= 5) {
      window.ArcadeJuice?.unlockAchievement('corredor', 'ach_combo5', 'Racha Épica', 'Alcanza el Combo x5 máximo');
    }
  }

  function updateHUD() {
    dom.hudDistance.innerHTML = `${Math.floor(State.distance)} <small>m</small>`;
    dom.hudCoins.textContent = `${State.coins}`;

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
  // ENTRADAS DEL JUGADOR CON SQUASH & STRETCH
  // ==========================================
  function playerJumpStart() {
    if (!State.started || State.paused || State.gameOver) return;
    const p = State.player;

    if (p.sliding) {
      p.sliding = false;
      p.h = CONFIG.PLAYER_H_STAND;
    }

    if (p.onGround) {
      // Squash antes de despegar
      p.squashX = 0.8;
      p.squashY = 1.25;

      const currentGravity = State.activeEvent === 'LOW_GRAVITY' ? CONFIG.GRAVITY * 0.55 : CONFIG.GRAVITY;
      p.vy = CONFIG.JUMP_FORCE;
      p.onGround = false;
      p.jumping = true;
      p.holdTimer = 0;
      p.canDoubleJump = true;
      p.isFlipping = false;

      playAudio('jump');
      window.ArcadeJuice?.vibrate(10);
      particles.burst(p.x + 14, p.y + p.h, 8, CONFIG.BIOMES[State.currentSectorIndex].accent);

    } else if (p.canDoubleJump) {
      p.vy = CONFIG.DOUBLE_JUMP_FORCE;
      p.canDoubleJump = false;
      p.jumping = true;
      p.holdTimer = 0;
      // Iniciar voltereta acrobática 360°
      p.isFlipping = true;
      p.flipRotation = 0;

      State.saveData.stats.totalFlips++;
      advanceMission('FLIPS', 1);

      if (State.saveData.stats.totalFlips >= 10) {
        window.ArcadeJuice?.unlockAchievement('corredor', 'ach_acrobat', 'Acróbata Urbano', 'Ejecuta 10 dobles saltos con voltereta');
      }

      playAudio('double-jump');
      window.ArcadeJuice?.vibrate(16);
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
      p.squashX = 1.35;
      p.squashY = 0.65;

      if (!p.onGround) {
        p.vy = Math.max(p.vy, 480);
      }

      State.saveData.stats.totalSlides++;
      advanceMission('SLIDES', 1);

      playAudio('slide');
      window.ArcadeJuice?.vibrate(12);
      particles.burst(p.x + 14, CONFIG.GROUND_Y, 8, '#ffd000');
    }
  }

  // ==========================================
  // BUCLE DE ACTUALIZACIÓN
  // ==========================================
  function update(rawDt) {
    if (!State.started || State.paused || State.gameOver) return;

    // Verificar si ArcadeJuice está en hitstop
    const hitstopFrozen = window.ArcadeJuice?.update(rawDt);
    if (hitstopFrozen) return;

    const p = State.player;

    // Dilatación temporal si Slow-Mo está activo
    const timeScale = p.slowmoTimer > 0 ? 0.45 : 1.0;
    const dt = rawDt * timeScale;

    // Velocidad base + incremento + turbo
    const targetSpeed = CONFIG.BASE_SPEED + State.distance * CONFIG.SPEED_ACCEL;
    const isTurboActive = p.turboTimer > 0 || State.activeEvent === 'HYPER_SPEED';
    const effectiveSpeed = isTurboActive ? targetSpeed + 240 : targetSpeed;
    State.speed = Math.min(CONFIG.MAX_SPEED + (isTurboActive ? 200 : 0), effectiveSpeed);

    // Zoom de cámara adaptativo según velocidad
    const targetZoom = 1.0 - Math.min(0.08, ((State.speed - CONFIG.BASE_SPEED) / (CONFIG.MAX_SPEED - CONFIG.BASE_SPEED)) * 0.08);
    State.cameraZoom += (targetZoom - State.cameraZoom) * dt * 2.0;

    const stepMove = State.speed * dt;
    State.distance += (stepMove / 30);
    State.worldScroll += stepMove;

    // Sutil rumble de velocidad a > 550 px/s
    if (State.speed > 550 && Math.random() < 0.05) {
      window.ArcadeJuice?.vibrate(6);
    }

    // Comprobar cambio de bioma
    const currentM = Math.floor(State.distance);
    for (let s = CONFIG.BIOMES.length - 1; s >= 0; s--) {
      if (currentM >= CONFIG.BIOMES[s].start) {
        if (State.currentSectorIndex !== s) {
          State.currentSectorIndex = s;
          triggerSectorBanner(s);
        }
        break;
      }
    }

    // Temporizador de Eventos Dinámicos
    State.eventTimer -= dt;
    if (State.eventTimer <= 0 && !State.activeEvent) {
      triggerRandomEvent();
      State.eventTimer = 26.0 + Math.random() * 12;
    }
    if (State.activeEvent) {
      State.eventRemaining -= dt;
      if (State.eventRemaining <= 0) {
        State.activeEvent = null;
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
      p.turboTimer -= rawDt;
      particles.spawn(p.x - 6, p.y + p.h / 2, -280, (Math.random() - 0.5) * 80, 0.22, 4, '#e4572e');
      particles.spawn(p.x - 6, p.y + p.h / 2, -220, (Math.random() - 0.5) * 60, 0.22, 3, '#f4c27a');
    }

    // Power-up: Slow-Mo
    if (p.slowmoTimer > 0) {
      p.slowmoTimer -= rawDt;
    }

    // Power-up: Imán (con mejora de nivel)
    if (p.magnetTimer > 0) {
      p.magnetTimer -= dt;
    }

    // Recarga pasiva de escudo si tiene la mejora de Escudo Robusto
    const shieldUpgradeLevel = State.saveData.upgrades.shield || 0;
    if (!p.hasShield && shieldUpgradeLevel > 0) {
      p.shieldRechargeTimer += dt;
      const requiredTime = Math.max(30, 50 - shieldUpgradeLevel * 8);
      if (p.shieldRechargeTimer >= requiredTime) {
        p.hasShield = true;
        p.shieldRechargeTimer = 0;
        playAudio('powerup');
        window.ArcadeJuice?.spawnFloat('¡ESCUDO RECARGADO!', p.x + 14, p.y - 10, '#f4c27a', 12);
      }
    }

    // Invulnerabilidad
    if (p.invulnerableTimer > 0) {
      p.invulnerableTimer -= dt;
    }

    // Acrobacia 360°
    if (p.isFlipping) {
      p.flipRotation += Math.PI * 4 * dt;
      if (p.flipRotation >= Math.PI * 2) {
        p.flipRotation = 0;
        p.isFlipping = false;
      }
    }

    // Recuperación de Squash & Stretch
    p.squashX += (1.0 - p.squashX) * dt * 8;
    p.squashY += (1.0 - p.squashY) * dt * 8;

    // Animación de carrera y estela de pies
    p.runAnim += dt * (State.speed / 48);
    if (p.onGround) {
      p.dustTimer += dt;
      if (p.dustTimer > 0.08) {
        p.dustTimer = 0;
        const auraColor = CONFIG.AURAS[State.saveData.equippedAura]?.color || '#e4572e';
        particles.spawn(p.x + 4, CONFIG.GROUND_Y - 2, -120 - Math.random() * 50, (Math.random() - 0.5) * 20, 0.2, 2.5, auraColor);
      }
    }

    // Salto sostenido
    if (p.jumping && p.holdTimer < CONFIG.MAX_HOLD_TIME) {
      p.vy += CONFIG.HOLD_ACCEL * dt;
      p.holdTimer += dt;
    }

    // Gravedad (adaptativa si hay evento de baja gravedad)
    const effectiveGravity = State.activeEvent === 'LOW_GRAVITY' ? CONFIG.GRAVITY * 0.55 : CONFIG.GRAVITY;
    p.vy += effectiveGravity * dt;
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
        if (!p.onGround) {
          // Aterrizaje con squash and stretch
          p.squashX = 1.25;
          p.squashY = 0.75;
          particles.burst(p.x + 14, currentLandingY + p.h, 6, '#7b93b8');
        }
        p.y = currentLandingY;
        p.vy = 0;
        p.onGround = true;
        p.canDoubleJump = true;
        p.isFlipping = false;
        p.flipRotation = 0;
      } else {
        if (p.y > CONFIG.VIRTUAL_H + 40) {
          triggerGameOver('Caída en el vacío cuántico');
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

      // Esquiva ajustada (Near Miss)
      if (!obs.passed && obs.x + obs.w < p.x && obs.type !== 'PLATFORM') {
        obs.passed = true;
        addCombo();
        State.saveData.stats.totalNearMisses++;
        advanceMission('NEAR_MISS', 1);

        if (obs.type === 'FLYING_DRONE' && p.sliding) {
          window.ArcadeJuice?.unlockAchievement('corredor', 'ach_drone', 'Bajo el Radar', 'Esquiva un dron deslizándote');
        }
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
          if (p.turboTimer > 0 || State.activeEvent === 'HYPER_SPEED') {
            playAudio('smash');
            window.ArcadeJuice?.vibrate(20);
            window.ArcadeJuice?.shake(6, 0.2);
            particles.burst(obs.x + obs.w / 2, obs.y + obs.h / 2, 22, '#e4572e');
            obs.x = -150;
          } else if (p.hasShield) {
            p.hasShield = false;
            p.invulnerableTimer = 1.4;
            playAudio('shield-break');
            window.ArcadeJuice?.vibrate([40, 60]);
            window.ArcadeJuice?.shake(7, 0.25);
            particles.burst(p.x + 14, p.y + p.h / 2, 20, '#f4c27a');
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
    const magnetUpgrade = State.saveData.upgrades.magnet || 0;
    const magnetBonusMultiplier = 1 + magnetUpgrade * 0.35;
    const magnetActive = p.magnetTimer > 0 || p.turboTimer > 0;
    const magnetRadius = (p.turboTimer > 0 ? 340 : 280) * magnetBonusMultiplier;

    const coinMultiplierBonus = (State.saveData.upgrades.coinMultiplier || 0);

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
        const earned = State.combo + coinMultiplierBonus;
        State.coins += earned;
        State.sessionCoinsEarned += earned;
        State.saveData.wallet += earned;

        advanceMission('COINS', earned);

        playAudio('coin');
        window.ArcadeJuice?.vibrate(6);
        particles.burst(coin.x, coin.y, 6, '#ffd000');
        State.coinsList.splice(i, 1);
        continue;
      }

      if (coin.x < -40) {
        State.coinsList.splice(i, 1);
      }
    }

    // Actualizar Tormenta de Chispas (Evento)
    for (let i = State.sparkStormList.length - 1; i >= 0; i--) {
      const spk = State.sparkStormList[i];
      spk.x -= stepMove * 0.5;
      spk.y += spk.vy * dt;

      if (!spk.collected && Math.hypot((p.x + 14) - spk.x, (p.y + p.h / 2) - spk.y) < 32) {
        spk.collected = true;
        State.coins += 2;
        State.saveData.wallet += 2;
        playAudio('coin');
        particles.burst(spk.x, spk.y, 8, '#ffd700');
        window.ArcadeJuice?.spawnFloat('+2', spk.x, spk.y, '#ffd700', 11);
        State.sparkStormList.splice(i, 1);
        continue;
      }

      if (spk.y > CONFIG.GROUND_Y + 20 || spk.x < -40) {
        State.sparkStormList.splice(i, 1);
      }
    }

    // Actualizar power-ups
    for (let i = State.powerupsList.length - 1; i >= 0; i--) {
      const pw = State.powerupsList[i];
      pw.x -= stepMove;

      if (!pw.collected && Math.hypot((p.x + 14) - pw.x, (p.y + p.h / 2) - pw.y) < 32) {
        pw.collected = true;
        window.ArcadeJuice?.vibrate(25);

        if (pw.type === 'TURBO') {
          p.turboTimer = 5.0;
          playAudio('turbo');
          particles.burst(pw.x, pw.y, 24, '#e4572e');
          window.ArcadeJuice?.spawnFloat('¡HIPER TURBO!', pw.x, pw.y - 12, '#e4572e', 13);
        } else if (pw.type === 'SLOWMO') {
          p.slowmoTimer = 4.5;
          playAudio('slowmo');
          particles.burst(pw.x, pw.y, 20, '#00e676');
          window.ArcadeJuice?.spawnFloat('¡MATRIZ LENTA!', pw.x, pw.y - 12, '#00e676', 13);
        } else if (pw.type === 'SHIELD') {
          p.hasShield = true;
          playAudio('powerup');
          particles.burst(pw.x, pw.y, 18, '#f4c27a');
          window.ArcadeJuice?.spawnFloat('¡ESCUDO!', pw.x, pw.y - 12, '#f4c27a', 13);
        } else if (pw.type === 'MAGNET') {
          p.magnetTimer = 8.0 * magnetBonusMultiplier;
          playAudio('powerup');
          particles.burst(pw.x, pw.y, 18, '#ffaa00');
          window.ArcadeJuice?.spawnFloat('¡IMÁN ACTIVO!', pw.x, pw.y - 12, '#ffaa00', 13);
        }

        State.powerupsList.splice(i, 1);
        continue;
      }

      if (pw.x < -50) {
        State.powerupsList.splice(i, 1);
      }
    }

    // Tren Maglev / Satélite
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
  // RENDERIZADO VECTORIAL Y PARALLAX DE 4 CAPAS
  // ==========================================
  function render() {
    const ctx = dom.ctx;
    const W = CONFIG.VIRTUAL_W;
    const H = CONFIG.VIRTUAL_H;
    const biome = CONFIG.BIOMES[State.currentSectorIndex];

    ctx.save();
    ctx.resetTransform();
    const dpr = window.devicePixelRatio || 1;

    // Aplicar Screen Shake de ArcadeJuice
    const shakeX = window.ArcadeJuice?.shakeX || 0;
    const shakeY = window.ArcadeJuice?.shakeY || 0;

    // Aplicar escala con zoom adaptativo
    const finalScale = State.scale * State.cameraZoom;
    ctx.scale(dpr * finalScale, dpr * finalScale);
    ctx.translate(shakeX, shakeY);

    // 1. Cielo y Astro Holográfico
    renderCyberSky(ctx, W, H, biome);

    // 2. Capa Parallax 1: Megatorres / Montañas Distantes (0.12x)
    renderDistantLayer(ctx, W, H, State.worldScroll * 0.12, biome);

    // 3. Capa Parallax 2: Edificios / Conductos y Tren Maglev (0.28x)
    renderMidgroundLayer(ctx, W, H, State.worldScroll * 0.28, biome);

    // 4. Capa Parallax 3: Pista de Vidrio / Cañón / Circuito de Suelo (1.0x)
    renderForegroundTrack(ctx, W, H, State.worldScroll, biome);

    // 5. Chispas de la Tormenta Estelar (si evento activo)
    renderSparkStorm(ctx);

    // 6. Sombras proyectadas con squash
    const p = State.player;
    if (p.y <= CONFIG.GROUND_Y - p.h) {
      const heightAbove = (CONFIG.GROUND_Y - p.h) - p.y;
      const shadowScale = Math.max(0.25, 1 - heightAbove / 220);
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${0.45 * shadowScale})`;
      ctx.beginPath();
      ctx.ellipse(p.x + 14, CONFIG.GROUND_Y + 4, 18 * shadowScale * p.squashX, 6 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 7. Monedas 3D rotatorias
    renderCoins(ctx);

    // 8. Power-ups flotantes
    renderPowerups(ctx);

    // 9. Obstáculos y Plataformas Temáticas
    renderObstacles(ctx, biome);

    // 10. Corredor 3D con personalidad y personalización
    renderPlayer3D(ctx, p, biome);

    // 11. Partículas del pool
    particles.render(ctx);

    // 12. Textos flotantes de ArcadeJuice
    window.ArcadeJuice?.drawFloats(ctx);

    // 13. Líneas de velocidad dinámicas
    renderSpeedLines(ctx, W, H);

    // 14. Overlay de diagnóstico (?debug=1)
    window.ArcadeJuice?.drawDebugOverlay(ctx, particles.getActiveCount());

    ctx.restore();
  }

  /**
   * Cielo y Sol/Luna según bioma actual
   */
  function renderCyberSky(ctx, W, H, biome) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CONFIG.GROUND_Y);
    skyGrad.addColorStop(0, biome.skyTop);
    skyGrad.addColorStop(1, biome.skyBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Sol / Luna holográfica
    ctx.save();
    const sunX = W * 0.75;
    const sunY = 160;
    const sunR = 48;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR * 1.6, 0, Math.PI * 2);
    ctx.fill();

    const sunGrad = ctx.createLinearGradient(sunX, sunY - sunR, sunX, sunY + sunR);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.5, biome.sunColor);
    sunGrad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();

    // Líneas de corte retro
    ctx.fillStyle = biome.skyTop;
    for (let y = sunY - 10; y < sunY + sunR; y += 8) {
      ctx.fillRect(sunX - sunR - 4, y, sunR * 2 + 8, 2);
    }
    ctx.restore();
  }

  /**
   * Capa Distante: Torres lejanas o montañas de silicio continuas
   */
  function renderDistantLayer(ctx, W, H, offset, biome) {
    ctx.save();
    const bW = 54;
    const startIdx = Math.floor(offset / bW);
    const count = Math.ceil(W / bW) + 2;

    ctx.fillStyle = biome.id === 'canyon' ? '#251206' : biome.id === 'crypt' ? '#140822' : '#0a1020';

    for (let i = 0; i < count; i++) {
      const worldIdx = startIdx + i;
      const x = worldIdx * bW - offset;
      const hFactor = Math.abs(Math.sin(worldIdx * 12.9898));
      const h = 120 + hFactor * 90;
      const y = CONFIG.GROUND_Y - h - 40;

      ctx.fillRect(x, y, bW - 6, h + 40);

      if (worldIdx % 2 === 0) {
        ctx.fillStyle = biome.accent;
        ctx.fillRect(x + bW / 2 - 4, y - 6, 2, 6);
        ctx.fillStyle = biome.id === 'canyon' ? '#251206' : biome.id === 'crypt' ? '#140822' : '#0a1020';
      }
    }
    ctx.restore();
  }

  /**
   * Capa Media: Rascacielos / Pilares y Tren Maglev
   */
  function renderMidgroundLayer(ctx, W, H, offset, biome) {
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

      ctx.fillStyle = biome.id === 'canyon' ? '#33180c' : biome.id === 'crypt' ? '#1d0b30' : '#11182c';
      ctx.fillRect(x, y, bW - 4, h);

      ctx.fillStyle = biome.accent;
      ctx.globalAlpha = 0.4;
      ctx.fillRect(x, y, bW - 4, 2);
      ctx.globalAlpha = 1.0;

      // Matriz de ventanas
      ctx.fillStyle = biome.themeColor;
      ctx.globalAlpha = 0.22;
      for (let wy = y + 14; wy < CONFIG.GROUND_Y - 20; wy += 20) {
        ctx.fillRect(x + 10, wy, 8, 10);
        ctx.fillRect(x + 28, wy, 8, 10);
        ctx.fillRect(x + 46, wy, 8, 10);
      }
      ctx.globalAlpha = 1.0;
    }

    // Riel del Maglev
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, CONFIG.GROUND_Y - 120);
    ctx.lineTo(W, CONFIG.GROUND_Y - 120);
    ctx.stroke();

    // Tren Maglev
    const train = State.maglevTrain;
    if (train.active) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(train.x, CONFIG.GROUND_Y - 128, 220, 16, 6);
      ctx.fill();

      ctx.fillStyle = biome.accent;
      ctx.fillRect(train.x + 8, CONFIG.GROUND_Y - 125, 200, 6);

      ctx.fillStyle = 'rgba(0, 240, 255, 0.35)';
      ctx.fillRect(train.x + 220, CONFIG.GROUND_Y - 126, 120, 10);
    }

    ctx.restore();
  }

  /**
   * Pista frontal continua adaptada al bioma
   */
  function renderForegroundTrack(ctx, W, H, worldScroll, biome) {
    const groundY = CONFIG.GROUND_Y;

    ctx.fillStyle = '#050711';
    ctx.fillRect(0, groundY, W, H - groundY);

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
      const grad = ctx.createLinearGradient(0, groundY, 0, groundY + 40);
      grad.addColorStop(0, biome.trackColor);
      grad.addColorStop(1, '#070a14');

      ctx.fillStyle = grad;
      ctx.fillRect(seg.start, groundY, w, H - groundY);

      // Borde brillante superior
      ctx.fillStyle = biome.accent;
      ctx.fillRect(seg.start, groundY, w, 2);

      // Brillo biselado
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(seg.start, groundY + 2, w, 2);

      // Flechas cheurón
      const arrowSpacing = 80;
      const arrowOffset = worldScroll % arrowSpacing;
      ctx.fillStyle = biome.accent;
      ctx.globalAlpha = 0.25;
      ctx.font = '900 13px sans-serif';

      for (let ax = seg.start - arrowOffset; ax < seg.end; ax += arrowSpacing) {
        if (ax >= seg.start && ax + 20 <= seg.end) {
          ctx.fillText('>>>', ax, groundY + 18);
        }
      }
      ctx.restore();
    }
  }

  function renderSparkStorm(ctx) {
    if (State.sparkStormList.length === 0) return;
    ctx.save();
    for (let i = 0; i < State.sparkStormList.length; i++) {
      const spk = State.sparkStormList[i];
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(spk.x, spk.y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(spk.x, spk.y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

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

  function renderPowerups(ctx) {
    ctx.save();
    for (let i = 0; i < State.powerupsList.length; i++) {
      const pw = State.powerupsList[i];
      const bob = Math.sin(Date.now() * 0.006 + pw.x) * 4;

      ctx.save();
      ctx.translate(pw.x, pw.y + bob);

      const haloColor = pw.type === 'TURBO' ? 'rgba(255, 0, 127, 0.28)' :
                        pw.type === 'SLOWMO' ? 'rgba(0, 230, 118, 0.28)' :
                        pw.type === 'SHIELD' ? 'rgba(0, 240, 255, 0.28)' :
                        'rgba(255, 204, 0, 0.28)';

      ctx.fillStyle = haloColor;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      if (window.ArcadeIcons && window.ArcadeIcons.drawToCanvas) {
        const iconKeyMap = { TURBO: 'rocket', SLOWMO: 'hourglass', SHIELD: 'shield', MAGNET: 'magnet' };
        window.ArcadeIcons.drawToCanvas(ctx, iconKeyMap[pw.type] || 'zap', 0, 0, 18, '#ffffff', true);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
    ctx.restore();
  }

  function renderObstacles(ctx, biome) {
    ctx.save();
    for (let i = 0; i < State.obstacles.length; i++) {
      const obs = State.obstacles[i];

      if (obs.type === 'LOW_BARRIER') {
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

        ctx.fillStyle = biome.obstacleHue;
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
        ctx.fillStyle = '#3a2066';
        ctx.beginPath();
        ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 6);
        ctx.fill();

        ctx.fillStyle = biome.obstacleHue;
        ctx.fillRect(obs.x + 4, obs.y + obs.h / 2 - 2, obs.w - 8, 4);

      } else if (obs.type === 'FLYING_DRONE') {
        const cx = obs.x + obs.w / 2;
        const cy = obs.y + obs.h / 2;
        const bob = Math.sin(Date.now() * 0.008 + obs.x) * 3;

        ctx.save();
        ctx.translate(cx, cy + bob);

        // Haz de escaneo
        ctx.fillStyle = 'rgba(255, 0, 85, 0.12)';
        ctx.beginPath();
        ctx.moveTo(-6, 8);
        ctx.lineTo(-24, 50);
        ctx.lineTo(24, 50);
        ctx.lineTo(6, 8);
        ctx.closePath();
        ctx.fill();

        // Anillo giratorio
        ctx.strokeStyle = biome.accent;
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
        ctx.fillStyle = '#162238';
        ctx.beginPath();
        ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 6);
        ctx.fill();

        ctx.fillStyle = biome.accent;
        ctx.fillRect(obs.x + 2, obs.y, obs.w - 4, 2);

        ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.font = '9px sans-serif';
        ctx.fillText('>>> PLATAFORMA >>>', obs.x + 10, obs.y + 11);
      }
    }
    ctx.restore();
  }

  /**
   * Renderizado del Corredor con Personalización (Skin + Aura + Squash & Stretch)
   */
  function renderPlayer3D(ctx, p, biome) {
    ctx.save();

    if (p.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.restore();
      return;
    }

    const px = p.x;
    const py = p.y;
    const pw = p.w;
    const ph = p.h;

    const skin = CONFIG.SKINS[State.saveData.equippedSkin] || CONFIG.SKINS.neo;
    const aura = CONFIG.AURAS[State.saveData.equippedAura] || CONFIG.AURAS.classic;

    // Escudo Cuántico
    if (p.hasShield) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(px + pw / 2, py + ph / 2, pw * 0.95, ph * 0.75, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Aura equipada alrededor del personaje
    if (aura.id !== 'classic') {
      ctx.save();
      ctx.strokeStyle = aura.color;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(px + pw / 2, py + ph / 2, pw * 0.85, ph * 0.65, Date.now() * 0.003, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Hiper Turbo: Transformación en bólido
    if (p.turboTimer > 0 || State.activeEvent === 'HYPER_SPEED') {
      ctx.save();
      ctx.translate(px + pw / 2, py + ph / 2);

      const rocketGrad = ctx.createLinearGradient(-15, -12, 20, 12);
      rocketGrad.addColorStop(0, '#e4572e');
      rocketGrad.addColorStop(0.5, skin.color);
      rocketGrad.addColorStop(1, '#ffffff');

      ctx.fillStyle = rocketGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flama
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

    // Voltereta acrobática 360°
    if (p.isFlipping) {
      ctx.save();
      ctx.translate(px + pw / 2, py + ph / 2);
      ctx.rotate(p.flipRotation);

      ctx.fillStyle = skin.color;
      ctx.beginPath();
      ctx.roundRect(-pw / 2, -ph / 2, pw, ph, 8);
      ctx.fill();

      ctx.restore();
      ctx.restore();
      return;
    }

    // Squash & Stretch aplicado al pivote
    ctx.save();
    ctx.translate(px + pw / 2, py + ph);
    ctx.scale(p.squashX, p.squashY);
    ctx.translate(-(px + pw / 2), -(py + ph));

    if (p.sliding) {
      // Deslizamiento aerodinámico
      const grad = ctx.createLinearGradient(px, py, px, py + ph);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, skin.color);
      grad.addColorStop(1, '#0044aa');

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
      bodyGrad.addColorStop(0, skin.secondary);
      bodyGrad.addColorStop(0.4, skin.color);
      bodyGrad.addColorStop(1, '#002266');

      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.roundRect(px + 2, py + 12, pw - 4, ph - 24, 6);
      ctx.fill();

      // Cabeza
      ctx.fillStyle = '#e2ecfc';
      ctx.beginPath();
      ctx.arc(px + pw / 2, py + 9, 8, 0, Math.PI * 2);
      ctx.fill();

      // Visor con color del skin
      ctx.fillStyle = skin.color;
      ctx.fillRect(px + pw / 2 + 1, py + 6, 6, 4);

      if (!p.onGround) {
        particles.spawn(
          px + pw / 2 + (Math.random() - 0.5) * 6,
          py + ph - 4,
          -60,
          80 + Math.random() * 40,
          0.18,
          2.5,
          skin.color
        );
      }
    }

    ctx.restore();
    ctx.restore();
  }

  function renderSpeedLines(ctx, W, H) {
    if (State.speed < 420 && !State.activeEvent) return;
    ctx.save();
    const count = State.speed > 580 ? 12 : 6;
    ctx.strokeStyle = State.activeEvent === 'HYPER_SPEED' ? 'rgba(255, 204, 0, 0.45)' : 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < count; i++) {
      const ly = Math.random() * (H - 100);
      const lx = Math.random() * W;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx - 130, ly);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ==========================================
  // BUCLE DE JUEGO (RAF)
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
  // ENTRADAS (TOUCH, SWIPE, RATÓN, TECLADO)
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

  function togglePause() {
    if (!State.started || State.gameOver) return;
    State.paused = !State.paused;
    dom.overlayPause.classList.toggle('hidden', !State.paused);
    if (State.paused) {
      stopBGM();
    } else {
      startBGM();
    }
  }

  // ==========================================
  // TIENDA, LOGROS Y GESTORES DE UI
  // ==========================================
  function updateShopWalletDisplay() {
    dom.shopWalletVal.textContent = State.saveData.wallet;
    dom.startCoinsVal.textContent = State.saveData.wallet;
    dom.startRecordVal.textContent = State.saveData.bestDistance;

    const equippedSkin = CONFIG.SKINS[State.saveData.equippedSkin] || CONFIG.SKINS.neo;
    const equippedAura = CONFIG.AURAS[State.saveData.equippedAura] || CONFIG.AURAS.classic;
    if (dom.startSkinAvatar) {
      dom.startSkinAvatar.innerHTML = window.ArcadeIcons ? window.ArcadeIcons.get(equippedSkin.avatar, { size: 22 }) : '';
    }
    dom.startSkinName.textContent = equippedSkin.name;
    dom.startAuraName.textContent = equippedAura.name;
  }

  function renderShop() {
    updateShopWalletDisplay();

    // 1. Skins
    dom.gridSkins.innerHTML = '';
    Object.values(CONFIG.SKINS).forEach(skin => {
      const isUnlocked = State.saveData.unlockedSkins.includes(skin.id);
      const isEquipped = State.saveData.equippedSkin === skin.id;
      const skinIconSvg = window.ArcadeIcons ? window.ArcadeIcons.get(skin.avatar, { size: 24 }) : '';

      const card = document.createElement('div');
      card.className = 'shop-card';
      card.innerHTML = `
        <div class="shop-card-left">
          <span class="shop-card-icon">${skinIconSvg}</span>
          <div>
            <div class="shop-card-title">${skin.name}</div>
            <div class="shop-card-desc">${skin.desc}</div>
          </div>
        </div>
        <button class="shop-btn ${isEquipped ? 'btn-equipped' : isUnlocked ? 'btn-equip' : 'btn-buy'}">
          ${isEquipped ? 'EQUIPADO' : isUnlocked ? 'EQUIPAR' : `${skin.price} CR`}
        </button>
      `;

      const btn = card.querySelector('.shop-btn');
      btn.addEventListener('click', () => {
        if (isEquipped) return;
        if (isUnlocked) {
          State.saveData.equippedSkin = skin.id;
          saveGameData();
          renderShop();
        } else if (State.saveData.wallet >= skin.price) {
          State.saveData.wallet -= skin.price;
          State.saveData.unlockedSkins.push(skin.id);
          State.saveData.equippedSkin = skin.id;
          saveGameData();
          window.ArcadeJuice?.unlockAchievement('corredor', 'ach_vip', 'Cliente VIP', 'Desbloquea tu primera mejora en la tienda');
          playAudio('powerup');
          renderShop();
        }
      });

      dom.gridSkins.appendChild(card);
    });

    // 2. Auras
    dom.gridAuras.innerHTML = '';
    Object.values(CONFIG.AURAS).forEach(aura => {
      const isUnlocked = State.saveData.unlockedAuras.includes(aura.id);
      const isEquipped = State.saveData.equippedAura === aura.id;
      const sparkSvg = window.ArcadeIcons ? window.ArcadeIcons.get('spark', { size: 24 }) : '';

      const card = document.createElement('div');
      card.className = 'shop-card';
      card.innerHTML = `
        <div class="shop-card-left">
          <span class="shop-card-icon">${sparkSvg}</span>
          <div>
            <div class="shop-card-title" style="color: ${aura.color};">${aura.name}</div>
            <div class="shop-card-desc">${aura.desc}</div>
          </div>
        </div>
        <button class="shop-btn ${isEquipped ? 'btn-equipped' : isUnlocked ? 'btn-equip' : 'btn-buy'}">
          ${isEquipped ? 'EQUIPADO' : isUnlocked ? 'EQUIPAR' : `${aura.price} CR`}
        </button>
      `;

      const btn = card.querySelector('.shop-btn');
      btn.addEventListener('click', () => {
        if (isEquipped) return;
        if (isUnlocked) {
          State.saveData.equippedAura = aura.id;
          saveGameData();
          renderShop();
        } else if (State.saveData.wallet >= aura.price) {
          State.saveData.wallet -= aura.price;
          State.saveData.unlockedAuras.push(aura.id);
          State.saveData.equippedAura = aura.id;
          saveGameData();
          window.ArcadeJuice?.unlockAchievement('corredor', 'ach_vip', 'Cliente VIP', 'Desbloquea tu primera mejora en la tienda');
          playAudio('powerup');
          renderShop();
        }
      });

      dom.gridAuras.appendChild(card);
    });

    // 3. Upgrades Funcionales
    dom.gridUpgrades.innerHTML = '';
    Object.values(CONFIG.UPGRADES).forEach(upg => {
      const currentLevel = State.saveData.upgrades[upg.id] || 0;
      const isMax = currentLevel >= upg.maxLevel;
      const cost = Math.floor(upg.basePrice * (1 + currentLevel * 0.75));
      const upgIconSvg = window.ArcadeIcons ? window.ArcadeIcons.get(upg.icon, { size: 24 }) : '';

      const card = document.createElement('div');
      card.className = 'shop-card';
      card.innerHTML = `
        <div class="shop-card-left">
          <span class="shop-card-icon">${upgIconSvg}</span>
          <div>
            <div class="shop-card-title">${upg.name} (Niv. ${currentLevel}/${upg.maxLevel})</div>
            <div class="shop-card-desc">${upg.desc}</div>
          </div>
        </div>
        <button class="shop-btn ${isMax ? 'btn-equipped' : 'btn-buy'}">
          ${isMax ? 'MÁXIMO' : `${cost} CR`}
        </button>
      `;

      const btn = card.querySelector('.shop-btn');
      btn.addEventListener('click', () => {
        if (isMax) return;
        if (State.saveData.wallet >= cost) {
          State.saveData.wallet -= cost;
          State.saveData.upgrades[upg.id] = currentLevel + 1;
          saveGameData();
          window.ArcadeJuice?.unlockAchievement('corredor', 'ach_vip', 'Cliente VIP', 'Desbloquea tu primera mejora en la tienda');
          playAudio('powerup');
          renderShop();
        }
      });

      dom.gridUpgrades.appendChild(card);
    });
  }

  function renderAchievementsModal() {
    const achievements = [
      { id: 'ach_takeoff', title: 'Primer Despegue', desc: 'Corre tus primeros 250 m en la pista', icon: 'runner' },
      { id: 'ach_acrobat', title: 'Acróbata Urbano', desc: 'Ejecuta 10 dobles saltos con voltereta', icon: 'speed' },
      { id: 'ach_drone', title: 'Bajo el Radar', desc: 'Esquiva un dron deslizándote en el suelo', icon: 'radar' },
      { id: 'ach_rich', title: 'Coleccionista de Créditos', desc: 'Acumula 100 monedas en una sola carrera', icon: 'coin' },
      { id: 'ach_combo5', title: 'Racha de Pista', desc: 'Alcanza el Combo x5 esquivando sin fallar', icon: 'fire' },
      { id: 'ach_canyon', title: 'Explorador del Cañón', desc: 'Llega al Cañón de Silicio a 750 metros', icon: 'map' },
      { id: 'ach_terminal', title: 'Velocidad Terminal', desc: 'Alcanza 650 px/s de velocidad supersónica', icon: 'zap' },
      { id: 'ach_vip', title: 'Cliente VIP', desc: 'Desbloquea tu primera mejora en la tienda', icon: 'cart' }
    ];

    dom.achList.innerHTML = '';
    achievements.forEach(ach => {
      const unlocked = window.ArcadeJuice?.hasAchievement('corredor', ach.id);
      const achIconSvg = unlocked
        ? (window.ArcadeIcons ? window.ArcadeIcons.get(ach.icon, { size: 20 }) : '')
        : (window.ArcadeIcons ? window.ArcadeIcons.get('lock', { size: 20 }) : '');

      const row = document.createElement('div');
      row.className = `ach-item ${unlocked ? 'unlocked' : ''}`;
      row.innerHTML = `
        <span class="ach-icon">${achIconSvg}</span>
        <div>
          <div class="ach-title">${ach.title}</div>
          <div class="ach-desc">${ach.desc}</div>
        </div>
        <span class="ach-status">${unlocked ? 'COMPLETADO' : 'BLOQUEADO'}</span>
      `;
      dom.achList.appendChild(row);
    });
  }

  function renderDailyMissionsModal() {
    const targetSvg = window.ArcadeIcons ? window.ArcadeIcons.get('target', { size: 20 }) : '';
    const speedSvg = window.ArcadeIcons ? window.ArcadeIcons.get('speed', { size: 20 }) : '';
    const zapSvg = window.ArcadeIcons ? window.ArcadeIcons.get('zap', { size: 20 }) : '';

    dom.missionsList.innerHTML = `
      <div class="mission-item">
        <span class="ach-icon">${targetSvg}</span>
        <div>
          <div class="ach-title">Paseo de Calentamiento</div>
          <div class="ach-desc">Recorre un total acumulado de 1,500 metros</div>
        </div>
        <span class="ach-status">${State.saveData.stats.totalDistance >= 1500 ? 'COMPLETADO (+100)' : `${State.saveData.stats.totalDistance}/1500 m`}</span>
      </div>
      <div class="mission-item">
        <span class="ach-icon">${speedSvg}</span>
        <div>
          <div class="ach-title">Giro Acrobático</div>
          <div class="ach-desc">Realiza 15 volteretas en el aire</div>
        </div>
        <span class="ach-status">${State.saveData.stats.totalFlips >= 15 ? 'COMPLETADO (+75)' : `${State.saveData.stats.totalFlips}/15`}</span>
      </div>
      <div class="mission-item">
        <span class="ach-icon">${zapSvg}</span>
        <div>
          <div class="ach-title">Reflejos Rápidos</div>
          <div class="ach-desc">Realiza 20 esquivas ajustadas (near-miss)</div>
        </div>
        <span class="ach-status">${State.saveData.stats.totalNearMisses >= 20 ? 'COMPLETADO (+120)' : `${State.saveData.stats.totalNearMisses}/20`}</span>
      </div>
    `;
  }

  function setupUI() {
    dom.btnStartRun.addEventListener('click', startRun);

    dom.btnPauseHeader.addEventListener('click', togglePause);
    dom.btnResume.addEventListener('click', togglePause);
    dom.btnRestartRun.addEventListener('click', startRun);
    dom.btnRetry.addEventListener('click', startRun);

    // Tienda
    function openShop() {
      renderShop();
      dom.modalShop.classList.remove('hidden');
    }
    dom.btnShopHeader.addEventListener('click', openShop);
    dom.btnOpenShop.addEventListener('click', openShop);
    dom.btnQuickShop.addEventListener('click', openShop);
    dom.btnGoShop.addEventListener('click', () => {
      dom.overlayGameOver.classList.add('hidden');
      openShop();
    });
    dom.btnCloseShop.addEventListener('click', () => {
      dom.modalShop.classList.add('hidden');
      updateShopWalletDisplay();
    });

    // Pestañas de la tienda
    document.querySelectorAll('.shop-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const target = tab.dataset.tab;
        document.getElementById('tab-skins').classList.toggle('hidden', target !== 'skins');
        document.getElementById('tab-auras').classList.toggle('hidden', target !== 'auras');
        document.getElementById('tab-upgrades').classList.toggle('hidden', target !== 'upgrades');
      });
    });

    // Logros
    dom.btnAchievementsHeader.addEventListener('click', () => {
      renderAchievementsModal();
      dom.modalAchievements.classList.remove('hidden');
    });
    dom.btnCloseAch.addEventListener('click', () => {
      dom.modalAchievements.classList.add('hidden');
    });

    // Misiones
    dom.btnOpenMissions.addEventListener('click', () => {
      renderDailyMissionsModal();
      dom.modalMissions.classList.remove('hidden');
    });
    dom.btnCloseMissions.addEventListener('click', () => {
      dom.modalMissions.classList.add('hidden');
    });

    // Opciones y Accesibilidad
    function openOptions() {
      dom.optSfx.checked = window.ArcadeJuice?.getOption('sfx', true);
      dom.optBgm.checked = window.ArcadeJuice?.getOption('bgm', true);
      dom.optVibration.checked = window.ArcadeJuice?.getOption('vibration', true);
      dom.optContrast.checked = window.ArcadeJuice?.getOption('contrast', false);
      dom.modalOptions.classList.remove('hidden');
    }

    dom.btnOptionsHeader.addEventListener('click', openOptions);
    dom.btnPauseOptions.addEventListener('click', openOptions);
    dom.btnCloseOptions.addEventListener('click', () => {
      window.ArcadeJuice?.setOption('sfx', dom.optSfx.checked);
      window.ArcadeJuice?.setOption('bgm', dom.optBgm.checked);
      window.ArcadeJuice?.setOption('vibration', dom.optVibration.checked);
      window.ArcadeJuice?.setOption('contrast', dom.optContrast.checked);

      document.body.classList.toggle('high-contrast', dom.optContrast.checked);

      if (!dom.optBgm.checked) {
        stopBGM();
      } else if (State.started && !State.paused && !State.gameOver) {
        startBGM();
      }

      dom.modalOptions.classList.add('hidden');
    });

    // Toggle rápido de sonido en el header
    dom.btnSoundToggle.addEventListener('click', () => {
      if (window.ArcadeAudio) {
        const muted = window.ArcadeAudio.toggleMute();
        dom.iconSoundOn.classList.toggle('hidden', muted);
        dom.iconSoundOff.classList.toggle('hidden', !muted);
        if (muted) stopBGM();
        else if (State.started && !State.paused) startBGM();
      }
    });

    // Inicializar alto contraste si estaba guardado
    if (window.ArcadeJuice?.getOption('contrast', false)) {
      document.body.classList.add('high-contrast');
    }
  }

  // ==========================================
  // INICIALIZACIÓN
  // ==========================================
  function init() {
    handleResize();
    loadGameData();
    setupInputs();
    setupUI();
    updateShopWalletDisplay();

    requestAnimationFrame(gameLoop);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
