/**
 * games/bastion/game.js - Motor principal de Bastión (Fase 3)
 * Tower Defense en Canvas 2D con acabado Pseudo-3D avanzado,
 * 6 mapas con rutas ramificadas, 6 tipos de enemigos + Jefes con auras,
 * 6 torres con 3 niveles y 2 ramas de especialización final,
 * árbol de metaprogreso permanente entre partidas (Templo del Nexo con Esquirlas),
 * sistema roguelike de reliquias arcanas, selector de dificultad y mutadores,
 * sacudida de pantalla, destellos, números de daño flotantes por tipo,
 * proyectiles de mortero con parábola balística 3D y sombras de caída,
 * núcleo cuántico con doble anillo giroscópico orbital 3D,
 * y síntesis de sonido procedural arcade.
 */
(() => {
  'use strict';

  // Dependencias seguras para entorno navegador y Node.js
  const isNode = typeof module !== 'undefined' && module.exports;
  const MAPAS = isNode ? require('./data/mapas').MAPAS : (window.BASTION_MAPAS || []);
  const ENEMIGOS = isNode ? require('./data/enemigos').ENEMIGOS : (window.BASTION_ENEMIGOS || {});
  const TORRES = isNode ? require('./data/torres').TORRES : (window.BASTION_TORRES || {});
  const RELIQUIAS = isNode ? require('./data/reliquias').RELIQUIAS : (window.BASTION_RELIQUIAS || {});
  const { MEJORAS_METAPROGRESO, MetaManager } = isNode
    ? require('./data/mejoras')
    : { MEJORAS_METAPROGRESO: window.BASTION_MEJORAS || {}, MetaManager: null };

  const CONFIG = Object.freeze({
    MAX_SHAKE_AMPLITUDE: 4.5,
    MAX_SHAKE_DURATION: 0.25,
    SHAKE_EVENTS: Object.freeze({
      core_damage: { intensity: 4.0, duration: 0.22 },
      boss_death: { intensity: 4.5, duration: 0.25 },
      orbital_strike: { intensity: 4.5, duration: 0.25 }
    })
  });

  class BastionGame {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas ? canvas.getContext('2d') : null;
      this.options = options;

      // Gestor de metaprogreso
      this.meta = options.meta !== undefined
        ? options.meta
        : ((typeof window !== 'undefined' && window.BastionMeta) ? window.BastionMeta : (MetaManager ? new MetaManager() : null));

      // Dificultad y mutadores
      this.difficulty = options.difficulty || 'normal'; // 'normal', 'heroico', 'pesadilla'
      this.diffHpMult = this.difficulty === 'pesadilla' ? 1.65 : (this.difficulty === 'heroico' ? 1.30 : 1.0);
      this.diffSpeedMult = this.difficulty === 'pesadilla' ? 1.22 : (this.difficulty === 'heroico' ? 1.10 : 1.0);
      this.diffShardMult = this.difficulty === 'pesadilla' ? 2.0 : (this.difficulty === 'heroico' ? 1.5 : 1.0);
      this.mutators = options.mutators || [];

      // Reliquias activas
      this.activeRelics = [...(options.relics || [])];

      // Configuración de mapa
      this.mapIndex = options.mapIndex || 0;
      this.loadMap(this.mapIndex);

      // Estado económico y de partida (con bonos de metaprogreso)
      const metaBonusGold = this.meta ? this.meta.getInitialBonusGold() : 0;
      const metaBonusLives = this.meta ? this.meta.getInitialBonusLives() : 0;
      this.initialGold = (options.initialGold !== undefined ? options.initialGold : 300) + metaBonusGold;
      this.initialLives = (options.initialLives !== undefined ? options.initialLives : 20) + metaBonusLives;

      this.gold = this.initialGold;
      this.lives = this.initialLives;
      this.maxLives = this.initialLives;
      this.score = 0;
      this.currentWave = 0;
      this.isEndless = options.isEndless !== undefined ? !!options.isEndless : false;
      this.maxWaves = this.isEndless ? Infinity : 20;
      this.cameraZoom = 1.0;
      this.cameraPanX = 0;
      this.cameraPanY = 0;
      this.endlessRecord = this.loadEndlessRecord();
      this.waveActive = false;
      this.waveSpawnQueue = [];
      this.waveSpawnTimer = 0;
      this.gameOver = false;
      this.victory = false;
      this.isPaused = false;
      this.gameSpeed = 1; // 1x o 2x

      // Escudo del núcleo por reliquia
      this.coreShield = this.hasRelic('escudo_singularidad') ? 3 : 0;
      this.teslaTimer = 9.0;

      // Entidades
      this.gridTowers = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
      this.towers = [];
      this.enemies = [];
      this.projectiles = [];
      this.hazards = []; // Charcos de fuego, napalm
      this.beams = [];   // Haces de rayos continuos
      this.chainZaps = []; // Arcos voltaicos
      this.particles = [];
      this.damageNumbers = [];

      // Estadísticas completas de la partida
      this.stats = {
        totalDamage: 0,
        kills: 0,
        killsByType: {},
        goldEarned: this.gold,
        goldSpent: 0,
        wavesCompleted: 0,
        towerDamage: {}, // towerId -> damage
        shardsEarned: 0
      };

      // Efectos visuales de pantalla (Juice)
      this.shakeTimer = 0;
      this.shakeIntensity = 0;
      this.shakeDurationTotal = 0;
      this.flashTimer = 0;
      this.flashColor = '#f43f5e';

      // Interacción y UI
      this.selectedBuildType = null;
      this.selectedPlacedTower = null;
      this.hoverCell = { c: -1, r: -1 };
      this.pendingBuildCell = null;

      // Identificadores únicos y tiempos
      this._nextId = 1;
      this.gameTime = 0;

      // Audio procedural
      this.audioCtx = null;
      this.isMuted = false;

      // Habilidades del Comandante (Fase 4)
      this.skillsCooldowns = {
        orbital_strike: 0,
        time_freeze: 0,
        gold_surge: 0
      };
      this.skillsMaxCooldowns = {
        orbital_strike: 40,
        time_freeze: 55,
        gold_surge: 45
      };
      this.overchargeTimer = 0;
      this.activeTargetSkill = null;
      this.campaign = typeof window !== 'undefined' && window.BastionCampaign ? window.BastionCampaign : null;
      if (!this.campaign && isNode) {
        try {
          const { CampaignManager } = require('./data/campana');
          this.campaign = new CampaignManager();
        } catch (e) {}
      }

      // Render offscreen para fondo estático
      this.offscreenBg = null;
      this.offscreenCtx = null;
      if (!isNode && typeof document !== 'undefined') {
        this.initOffscreenBg();
      }
    }

    // Comprueba si una reliquia está equipada
    hasRelic(id) {
      return this.activeRelics.includes(id);
    }

    // Carga de récord en modo sin fin (clave versionada bastion:endless:v1)
    loadEndlessRecord() {
      try {
        if (typeof window !== 'undefined' && window.ArcadeStorage && typeof window.ArcadeStorage.getJSON === 'function') {
          return window.ArcadeStorage.getJSON('bastion:endless:v1', { bestWave: 0, bestScore: 0 });
        } else if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem('bastion:endless:v1');
          if (raw) return JSON.parse(raw);
        }
      } catch (e) {}
      return { bestWave: 0, bestScore: 0 };
    }

    // Guarda récord del modo sin fin
    saveEndlessRecord(wave, score) {
      try {
        const cur = this.loadEndlessRecord();
        const updated = {
          bestWave: Math.max(cur?.bestWave || 0, wave || 0),
          bestScore: Math.max(cur?.bestScore || 0, score || 0),
          updatedAt: Date.now()
        };
        if (typeof window !== 'undefined' && window.ArcadeStorage && typeof window.ArcadeStorage.setJSON === 'function') {
          window.ArcadeStorage.setJSON('bastion:endless:v1', updated);
        } else if (typeof localStorage !== 'undefined') {
          localStorage.setItem('bastion:endless:v1', JSON.stringify(updated));
        }
        this.endlessRecord = updated;
        return updated;
      } catch (e) {}
      return null;
    }

    // Límites de la cámara para que nunca se pierda del mapa
    clampCamera() {
      this.cameraZoom = Math.max(1.0, Math.min(2.5, this.cameraZoom));
      if (this.cameraZoom <= 1.0) {
        this.cameraPanX = 0;
        this.cameraPanY = 0;
        return;
      }
      const maxPanX = (this.width / 2) * (1 - 1 / this.cameraZoom);
      const maxPanY = (this.height / 2) * (1 - 1 / this.cameraZoom);
      this.cameraPanX = Math.max(-maxPanX, Math.min(maxPanX, this.cameraPanX));
      this.cameraPanY = Math.max(-maxPanY, Math.min(maxPanY, this.cameraPanY));
    }

    // Herramientas de depuración (?debug=1)
    addDebugGold(amount = 1000) {
      this.gold += amount;
      this.stats.goldEarned += amount;
      this.playSound('gold_surge');
      const cp = this.getCorePos();
      this.addDamageNumber(cp.x, cp.y - 30, `+${amount} Oro [DEBUG]`, '#38bdf8', true);
    }

    addDebugLives(amount = 50) {
      this.lives += amount;
      this.maxLives += amount;
      const cp = this.getCorePos();
      this.addDamageNumber(cp.x, cp.y - 20, `+${amount} Vidas [DEBUG]`, '#10b981', true);
    }

    nukeAllEnemies() {
      let count = 0;
      for (const e of this.enemies) {
        if (e.alive) {
          this.applyDamageToEnemy(e, 999999, false, 'energy', 1.0, null, true);
          count++;
        }
      }
      this.screenShake(6.0, 0.3);
      this.screenFlash('rgba(239, 68, 68, 0.4)', 0.3);
      const cp = this.getCorePos();
      this.addDamageNumber(cp.x, cp.y - 35, `NUKE (${count}) [DEBUG]`, '#ef4444', true);
    }

    skipWaveDebug() {
      this.waveSpawnQueue = [];
      this.nukeAllEnemies();
    }

    // Equipa una reliquia en tiempo real
    equipRelic(id) {
      if (!RELIQUIAS[id] || this.hasRelic(id)) return false;
      this.activeRelics.push(id);
      const def = RELIQUIAS[id];
      if (def?.effects?.coreShieldCharges) {
        this.coreShield = (this.coreShield || 0) + def.effects.coreShieldCharges;
      }
      this.updateSupportBuffs();
      return true;
    }

    // Añade esquirlas ganadas
    addShards(amount) {
      const amt = Math.max(0, Math.round(amount));
      if (amt <= 0) return;
      this.stats.shardsEarned += amt;
      if (this.meta) {
        this.meta.addShards(amt);
      }
    }

    // Comprueba si las sacudidas de pantalla están permitidas por accesibilidad o ajustes
    shakeEnabled() {
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return false;
      }
      try {
        if (typeof window !== 'undefined' && window.ArcadeStorage && typeof window.ArcadeStorage.getItem === 'function') {
          const setting = window.ArcadeStorage.getItem('bastion:screen_shake');
          if (setting === '0' || setting === 'false') return false;
        } else if (typeof localStorage !== 'undefined') {
          const setting = localStorage.getItem('bastion:screen_shake');
          if (setting === '0' || setting === 'false') return false;
        }
      } catch (e) {}
      return true;
    }

    // Efecto centralizado de sacudida de pantalla restringido a CONFIG.SHAKE_EVENTS
    shake(eventKey) {
      if (!this.shakeEnabled()) {
        this.resetShake();
        return;
      }
      const eventDef = CONFIG.SHAKE_EVENTS[eventKey];
      if (!eventDef) return;
      this.shakeIntensity = Math.min(CONFIG.MAX_SHAKE_AMPLITUDE, eventDef.intensity);
      this.shakeTimer = Math.min(CONFIG.MAX_SHAKE_DURATION, eventDef.duration);
      this.shakeDurationTotal = this.shakeTimer;
    }

    // Efecto de sacudida de pantalla con clamping riguroso y decaimiento
    screenShake(intensityOrKey = 4.5, duration = 0.25) {
      if (!this.shakeEnabled()) {
        this.resetShake();
        return;
      }
      if (typeof intensityOrKey === 'string' && CONFIG.SHAKE_EVENTS[intensityOrKey]) {
        return this.shake(intensityOrKey);
      }
      let clampedIntensity = typeof intensityOrKey === 'number' ? intensityOrKey : 4.5;
      let clampedDuration = typeof duration === 'number' ? duration : 0.25;
      if (clampedIntensity > 6.0) clampedIntensity = CONFIG.MAX_SHAKE_AMPLITUDE;
      if (clampedDuration > 0.4) clampedDuration = CONFIG.MAX_SHAKE_DURATION;
      this.shakeIntensity = clampedIntensity;
      this.shakeTimer = clampedDuration;
      this.shakeDurationTotal = clampedDuration;
    }

    // Resetea inmediatamente el temblor de pantalla a 0
    resetShake() {
      this.shakeTimer = 0;
      this.shakeIntensity = 0;
      this.shakeDurationTotal = 0;
    }

    // Continuación de partida a Modo Sin Fin tras superar la oleada 20
    continueToEndless() {
      this.victory = false;
      this.isEndless = true;
      this.maxWaves = Infinity;
      this.waveActive = false;
      this.resetShake();
      const score = (this.stats.kills || 0) * 10 + (this.gold || 0) * 2 + (this.lives || 0) * 50;
      this.saveEndlessRecord(this.currentWave, score);
      return true;
    }

    // Efecto de destello en pantalla
    screenFlash(color = 'rgba(239, 68, 68, 0.35)', duration = 0.2) {
      this.flashColor = color;
      this.flashTimer = duration;
    }

    // Reproductor de audio procedural sintetizado
    playSound(soundName) {
      if (isNode) return;
      try {
        if (!this.audioCtx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) this.audioCtx = new AudioContext();
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
        if (!this.audioCtx || this.isMuted) return;

        const ctx = this.audioCtx;
        const now = ctx.currentTime;

        switch (soundName) {
          case 'shoot_balistico': {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.06);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.06);
            break;
          }
          case 'shoot_mortero': {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(170, now);
            osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
            gain.gain.setValueAtTime(0.16, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.18);
            break;
          }
          case 'explosion': {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(95, now);
            osc.frequency.exponentialRampToValueAtTime(25, now + 0.26);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.26);
            break;
          }
          case 'shoot_rayo': {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(780, now);
            osc.frequency.linearRampToValueAtTime(1150, now + 0.07);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.07);
            break;
          }
          case 'shoot_crio': {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(850, now);
            osc.frequency.exponentialRampToValueAtTime(320, now + 0.11);
            gain.gain.setValueAtTime(0.07, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.11);
            break;
          }
          case 'shoot_francotirador': {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(1300, now);
            osc.frequency.exponentialRampToValueAtTime(190, now + 0.14);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.14);
            break;
          }
          case 'obelisco_pulse': {
            [440, 660].forEach((f, i) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(f, now + i * 0.035);
              gain.gain.setValueAtTime(0.06, now + i * 0.035);
              gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.035 + 0.18);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(now + i * 0.035);
              osc.stop(now + i * 0.035 + 0.18);
            });
            break;
          }
          case 'core_damaged': {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(190, now);
            osc.frequency.linearRampToValueAtTime(80, now + 0.28);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.28);
            break;
          }
          case 'build': {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(560, now + 0.07);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.07);
            break;
          }
          case 'upgrade': {
            [420, 530, 660, 840].forEach((f, i) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(f, now + i * 0.035);
              gain.gain.setValueAtTime(0.08, now + i * 0.035);
              gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.035 + 0.12);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(now + i * 0.035);
              osc.stop(now + i * 0.035 + 0.12);
            });
            break;
          }
          case 'boss_alert': {
            [220, 196, 164].forEach((f, i) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sawtooth';
              osc.frequency.setValueAtTime(f, now + i * 0.12);
              gain.gain.setValueAtTime(0.16, now + i * 0.12);
              gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.25);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(now + i * 0.12);
              osc.stop(now + i * 0.12 + 0.25);
            });
            break;
          }
          case 'orbital_strike': {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(420, now);
            osc.frequency.exponentialRampToValueAtTime(1450, now + 0.16);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.16);

            const subOsc = ctx.createOscillator();
            const subGain = ctx.createGain();
            subOsc.type = 'sawtooth';
            subOsc.frequency.setValueAtTime(120, now + 0.14);
            subOsc.frequency.exponentialRampToValueAtTime(28, now + 0.5);
            subGain.gain.setValueAtTime(0.26, now + 0.14);
            subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            subOsc.connect(subGain);
            subGain.connect(ctx.destination);
            subOsc.start(now + 0.14);
            subOsc.stop(now + 0.5);
            break;
          }
          case 'time_freeze': {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1600, now);
            osc.frequency.exponentialRampToValueAtTime(2600, now + 0.1);
            osc.frequency.exponentialRampToValueAtTime(650, now + 0.32);
            gain.gain.setValueAtTime(0.16, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.32);
            break;
          }
          case 'gold_surge': {
            [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(f, now + i * 0.05);
              gain.gain.setValueAtTime(0.12, now + i * 0.05);
              gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.22);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(now + i * 0.05);
              osc.stop(now + i * 0.05 + 0.22);
            });
            break;
          }
          case 'debris_clear': {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(45, now + 0.14);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.14);
            break;
          }
          case 'wave_early': {
            [440, 554.37, 659.25, 880].forEach((f, i) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(f, now + i * 0.06);
              gain.gain.setValueAtTime(0.14, now + i * 0.06);
              gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.2);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(now + i * 0.06);
              osc.stop(now + i * 0.06 + 0.2);
            });
            break;
          }
        }
      } catch (e) {}
    }

    // Carga un mapa por índice
    loadMap(index) {
      this.mapIndex = Math.max(0, Math.min(MAPAS.length - 1, index));
      this.mapData = MAPAS[this.mapIndex] || MAPAS[0];
      this.cols = this.mapData.cols || 16;
      this.rows = this.mapData.rows || 11;
      this.cellSize = this.mapData.tileSize || 36;
      this.width = this.cols * this.cellSize;
      this.height = this.rows * this.cellSize;

      // Localizar posición central del Núcleo (casilla 4)
      this.coreCell = { c: 7, r: 5 };
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (this.mapData.grid[r][c] === 4) {
            this.coreCell = { c, r };
            break;
          }
        }
      }

      this.gridTowers = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
      this.towers = [];
      this.enemies = [];
      this.projectiles = [];
      this.hazards = [];
      this.beams = [];
      this.chainZaps = [];
      this.particles = [];
      this.damageNumbers = [];

      if (!isNode && typeof document !== 'undefined') {
        this.initOffscreenBg();
      }
    }

    getCorePos() {
      return {
        x: (this.coreCell.c + 0.5) * this.cellSize,
        y: (this.coreCell.r + 0.5) * this.cellSize
      };
    }

    // Inicializa canvas offscreen para cachear terreno estático
    initOffscreenBg() {
      if (isNode) return;
      this.offscreenBg = document.createElement('canvas');
      this.offscreenBg.width = this.width;
      this.offscreenBg.height = this.height;
      this.offscreenCtx = this.offscreenBg.getContext('2d');
      this.renderStaticTerrain(this.offscreenCtx);
    }

    // Dibuja el mapa con estética Pseudo-3D avanzada y relieves
    renderStaticTerrain(ctx) {
      if (!ctx) return;
      const theme = this.mapData.theme || {};
      const cs = this.cellSize;

      // Fondo base
      ctx.fillStyle = theme.bg || '#0c131f';
      ctx.fillRect(0, 0, this.width, this.height);

      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const type = this.mapData.grid[r][c];
          const px = c * cs;
          const py = r * cs;

          if (type === 1) {
            // Camino hundido con biseles de profundidad
            ctx.fillStyle = theme.path || '#78350f';
            ctx.fillRect(px, py, cs, cs);

            // Borde superior e izquierdo de sombra interna (hundido)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.fillRect(px, py, cs, 2.5);
            ctx.fillRect(px, py, 2.5, cs);

            // Resalte inferior y derecho de relieve de losas
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.fillRect(px, py + cs - 1.5, cs, 1.5);
            ctx.fillRect(px + cs - 1.5, py, 1.5, cs);

            // Adoquines en relieve
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.fillRect(px + 4, py + 4, cs - 8, cs - 8);

            ctx.strokeStyle = theme.pathBorder || '#92400e';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 0.5, py + 0.5, cs - 1, cs - 1);
          } else if (type === 2) {
            // Obstáculo natural: Espira de roca en 3D con 3 caras iluminadas
            // Sombra en el suelo a 45 grados
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.ellipse(px + cs * 0.6, py + cs * 0.7, cs * 0.45, cs * 0.24, 0.4, 0, Math.PI * 2);
            ctx.fill();

            // Base de peñasco
            ctx.fillStyle = theme.obstacle || '#0f172a';
            ctx.fillRect(px + 2, py + 2, cs - 4, cs - 4);

            // Cara superior iluminada (Meseta cenital)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.beginPath();
            ctx.moveTo(px + 4, py + 4);
            ctx.lineTo(px + cs - 4, py + 4);
            ctx.lineTo(px + cs - 8, py + 12);
            ctx.lineTo(px + 8, py + 12);
            ctx.closePath();
            ctx.fill();

            // Cara lateral en penumbra
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.moveTo(px + cs - 4, py + 4);
            ctx.lineTo(px + cs - 4, py + cs - 4);
            ctx.lineTo(px + cs - 8, py + cs - 6);
            ctx.lineTo(px + cs - 8, py + 12);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 2.5, py + 2.5, cs - 5, cs - 5);
          } else if (type === 3) {
            // Portal de invasión (Spawn)
            ctx.fillStyle = '#4c0519';
            ctx.fillRect(px, py, cs, cs);
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 1, py + 1, cs - 2, cs - 2);

            // Sello rúnico estático
            ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
            ctx.beginPath();
            ctx.arc(px + cs / 2, py + cs / 2, cs * 0.35, 0, Math.PI * 2);
            ctx.fill();
          } else if (type === 4) {
            // Plataforma del Núcleo Arcano
            ctx.fillStyle = '#064e3b';
            ctx.fillRect(px, py, cs, cs);
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 1, py + 1, cs - 2, cs - 2);
          } else if (type === 5) {
            // Plataforma Elevada (Highground): Dais sobreelevado 3D con pilares y reborde cian (+25% rango)
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(px, py, cs, cs);

            // Base sobreelevada
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(px + 2, py + 2, cs - 4, cs - 4);

            // Bisel superior iluminado cian
            ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.fillRect(px + 2, py + 2, cs - 4, 3);
            ctx.fillRect(px + 2, py + 2, 3, cs - 4);

            // Bisel inferior de sombra
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(px + 2, py + cs - 5, cs - 4, 3);
            ctx.fillRect(px + cs - 5, py + 2, 3, cs - 4);

            // Glifo de viento y altura en el centro
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.moveTo(px + cs / 2, py + 8);
            ctx.lineTo(px + cs / 2 + 7, py + cs - 10);
            ctx.lineTo(px + cs / 2 - 7, py + cs - 10);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 2.5, py + 2.5, cs - 5, cs - 5);
          } else if (type === 6) {
            // Geoda Elemental: Pedestal rocoso oscuro con racimo de cristales violetas (+20% daño)
            ctx.fillStyle = '#130d24';
            ctx.fillRect(px, py, cs, cs);

            // Bisel exterior amatista
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(px + 1.5, py + 1.5, cs - 3, cs - 3);

            // Cristales facetados centrales
            ctx.fillStyle = '#c084fc';
            ctx.beginPath();
            ctx.moveTo(px + cs * 0.5, py + cs * 0.2);
            ctx.lineTo(px + cs * 0.72, py + cs * 0.5);
            ctx.lineTo(px + cs * 0.5, py + cs * 0.82);
            ctx.lineTo(px + cs * 0.28, py + cs * 0.5);
            ctx.closePath();
            ctx.fill();

            // Faceta de brillo
            ctx.fillStyle = '#f3e8ff';
            ctx.beginPath();
            ctx.moveTo(px + cs * 0.5, py + cs * 0.2);
            ctx.lineTo(px + cs * 0.72, py + cs * 0.5);
            ctx.lineTo(px + cs * 0.5, py + cs * 0.5);
            ctx.closePath();
            ctx.fill();
          } else if (type === 7) {
            // Veta de Cristal Aúrico: Roca con vetas doradas en zigzag (+15 oro/oleada)
            ctx.fillStyle = '#1c1917';
            ctx.fillRect(px, py, cs, cs);

            // Borde ámbar
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 2, py + 2, cs - 4, cs - 4);

            // Veta de oro brillante
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(px + 5, py + cs - 8);
            ctx.lineTo(px + cs * 0.4, py + cs * 0.5);
            ctx.lineTo(px + cs * 0.6, py + cs * 0.7);
            ctx.lineTo(px + cs - 6, py + 8);
            ctx.stroke();

            // Pepitas doradas
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(px + cs * 0.35, py + cs * 0.35, 2.5, 0, Math.PI * 2);
            ctx.arc(px + cs * 0.65, py + cs * 0.65, 3, 0, Math.PI * 2);
            ctx.fill();
          } else if (type === 8) {
            // Escombros Cuánticos: Rocas fracturadas (despejables por 40 oro)
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(px, py, cs, cs);

            // Fragmentos de roca apilados
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.arc(px + cs * 0.4, py + cs * 0.5, cs * 0.3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.arc(px + cs * 0.65, py + cs * 0.45, cs * 0.25, 0, Math.PI * 2);
            ctx.fill();

            // Grieta en cruz
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(px + 6, py + cs - 6);
            ctx.lineTo(px + cs - 6, py + 6);
            ctx.stroke();

            // Sello discreto "40"
            ctx.fillStyle = '#f59e0b';
            ctx.font = 'bold 8px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('40', px + cs / 2, py + cs - 5);
          } else {
            // Terreno construible (0): Pedestal metálico defensivo con relieve 3D
            ctx.fillStyle = theme.buildable || '#1e293b';
            ctx.fillRect(px, py, cs, cs);

            // Borde biselado superior (luz)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(px + 1, py + 1, cs - 2, 2);
            ctx.fillRect(px + 1, py + 1, 2, cs - 2);

            // Borde biselado inferior (sombra de profundidad)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.fillRect(px + 1, py + cs - 3, cs - 2, 2);
            ctx.fillRect(px + cs - 3, py + 1, 2, cs - 2);

            // Remaches metálicos en esquinas
            ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
            ctx.fillRect(px + 3, py + 3, 2, 2);
            ctx.fillRect(px + cs - 5, py + 3, 2, 2);
            ctx.fillRect(px + 3, py + cs - 5, 2, 2);
            ctx.fillRect(px + cs - 5, py + cs - 5, 2, 2);
          }
        }
      }
    }

    // Valida si una celda es apta para construir (0: base, 5: alto, 6: geoda, 7: veta)
    canBuildAt(c, r) {
      if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return false;
      const tileType = this.mapData.grid[r][c];
      const isBuildable = (tileType === 0 || tileType === 5 || tileType === 6 || tileType === 7);
      if (!isBuildable) return false;
      if (this.gridTowers[r][c] !== null) return false;
      return true;
    }

    // Despeja escombros (tipo 8) pagando 40 de oro
    clearDebris(c, r) {
      if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return { success: false, reason: 'fuera_rango' };
      if (this.mapData.grid[r][c] !== 8) return { success: false, reason: 'no_escombros' };
      const cost = 40;
      if (this.gold < cost) return { success: false, reason: 'oro_insuficiente' };

      this.gold -= cost;
      this.mapData.grid[r][c] = 0;
      if (!isNode && typeof document !== 'undefined') {
        this.initOffscreenBg();
      }
      const pos = { x: (c + 0.5) * this.cellSize, y: (r + 0.5) * this.cellSize };
      this.spawnSparks(pos.x, pos.y, 20, '#94a3b8');
      this.addDamageNumber(pos.x, pos.y - 12, '-40 Despejado', '#f59e0b', true);
      this.playSound('debris_clear');
      return { success: true };
    }

    // Coloca una torre en la celda indicada si hay fondos suficientes
    placeTower(typeId, c, r) {
      const def = TORRES[typeId];
      if (!def) return { success: false, reason: 'tipo_invalido' };
      if (!this.canBuildAt(c, r)) return { success: false, reason: 'casilla_invalida' };

      // Descuento de metaprogreso
      const discount = this.meta ? this.meta.getTowerCostDiscount() : 0;
      const effectiveCost = Math.round(def.cost * (1.0 - discount));

      if (this.gold < effectiveCost) return { success: false, reason: 'oro_insuficiente' };

      this.gold -= effectiveCost;
      this.stats.goldSpent = (this.stats.goldSpent || 0) + effectiveCost;

      const tileType = this.mapData.grid[r]?.[c] ?? 0;

      const tower = {
        id: this._nextId++,
        typeId: typeId,
        name: def.name,
        role: def.role,
        c: c,
        r: r,
        x: (c + 0.5) * this.cellSize,
        y: (r + 0.5) * this.cellSize,
        range: def.range * this.cellSize,
        rangeCells: def.range,
        fireRate: def.fireRate,
        damage: def.damage || 0,
        damageType: def.damageType || 'physical',
        projectileSpeed: (def.projectileSpeed || 8.0) * this.cellSize,
        projectileColor: def.projectileColor || '#38bdf8',
        projectileRadius: def.projectileRadius || 3.5,
        color: def.color,
        turretColor: def.turretColor,
        cost: effectiveCost,
        investedGold: effectiveCost,
        level: 1,
        branch: null,
        targetPriority: 'first',
        cooldown: 0,
        angle: 0,
        target: null,
        stunnedTimer: 0,
        recoilAnim: 0,
        splashRadius: def.splashRadius ? def.splashRadius * this.cellSize : 0,
        piercing: !!def.piercing,
        ignoresArmor: !!def.ignoresArmor,
        slowFactor: def.slowFactor || 0,
        damageBuff: def.damageBuff || 0,
        rangeBuff: def.rangeBuff || 0,
        fireRateBuff: def.fireRateBuff || 0,
        effDmgMult: 1.0,
        effRangeMult: 1.0,
        effRateMult: 1.0,
        effGoldMult: 1.0,
        // Bonificaciones de Terrenos Tácticos (Fase 4)
        isHighground: tileType === 5,
        isGeode: tileType === 6,
        isGoldmine: tileType === 7
      };

      if (tower.isHighground) {
        tower.effRangeMult += 0.25;
      }
      if (tower.isGeode) {
        tower.effDmgMult += 0.20;
      }

      this.gridTowers[r][c] = tower;
      this.towers.push(tower);
      this.updateSupportBuffs();

      this.playSound('build');
      this.spawnSparks(tower.x, tower.y, 12, tower.turretColor);
      return { success: true, tower };
    }

    // Mejora una torre al siguiente nivel (1 -> 2 -> 3)
    upgradeTower(c, r) {
      const tower = this.gridTowers[r]?.[c];
      if (!tower) return { success: false, reason: 'no_hay_torre' };
      if (tower.level >= 3) return { success: false, reason: 'requiere_rama_especializacion' };

      const def = TORRES[tower.typeId];
      const nextLevelData = def?.levels?.[tower.level];
      if (!nextLevelData) return { success: false, reason: 'sin_siguiente_nivel' };

      const discount = this.meta ? this.meta.getTowerCostDiscount() : 0;
      const cost = Math.round(nextLevelData.upgradeCost * (1.0 - discount));

      if (this.gold < cost) return { success: false, reason: 'oro_insuficiente' };

      this.gold -= cost;
      this.stats.goldSpent = (this.stats.goldSpent || 0) + cost;
      tower.investedGold += cost;
      tower.level += 1;

      if (nextLevelData.damage) tower.damage = nextLevelData.damage;
      if (nextLevelData.fireRate) tower.fireRate = nextLevelData.fireRate;
      if (nextLevelData.range) {
        tower.rangeCells = nextLevelData.range;
        tower.range = nextLevelData.range * this.cellSize;
      }
      if (nextLevelData.splashRadius) tower.splashRadius = nextLevelData.splashRadius * this.cellSize;
      if (nextLevelData.slowFactor) tower.slowFactor = nextLevelData.slowFactor;
      if (nextLevelData.damageBuff) tower.damageBuff = nextLevelData.damageBuff;
      if (nextLevelData.rangeBuff) tower.rangeBuff = nextLevelData.rangeBuff;
      if (nextLevelData.fireRateBuff) tower.fireRateBuff = nextLevelData.fireRateBuff;

      this.updateSupportBuffs();
      this.playSound('upgrade');
      this.spawnSparks(tower.x, tower.y, 16, '#fde047');
      return { success: true, tower };
    }

    // Especializa la torre en Nivel 4 eligiendo la rama 'a' o 'b'
    specializeTower(c, r, branchKey) {
      const tower = this.gridTowers[r]?.[c];
      if (!tower) return { success: false, reason: 'no_hay_torre' };
      if (tower.level !== 3) return { success: false, reason: 'debe_ser_nivel_3' };

      const def = TORRES[tower.typeId];
      const branch = def?.branches?.[branchKey];
      if (!branch) return { success: false, reason: 'rama_invalida' };

      const discount = this.meta ? this.meta.getTowerCostDiscount() : 0;
      const cost = Math.round(branch.branchCost * (1.0 - discount));

      if (this.gold < cost) return { success: false, reason: 'oro_insuficiente' };

      this.gold -= cost;
      this.stats.goldSpent = (this.stats.goldSpent || 0) + cost;
      tower.investedGold += cost;
      tower.level = 4;
      tower.branch = branchKey;
      tower.name = branch.name;
      if (branch.damage) tower.damage = branch.damage;
      if (branch.fireRate) tower.fireRate = branch.fireRate;
      if (branch.range) {
        tower.rangeCells = branch.range;
        tower.range = branch.range * this.cellSize;
      }
      if (branch.splashRadius) tower.splashRadius = branch.splashRadius * this.cellSize;
      if (branch.slowFactor) tower.slowFactor = branch.slowFactor;
      if (branch.damageBuff) tower.damageBuff = branch.damageBuff;
      if (branch.rangeBuff) tower.rangeBuff = branch.rangeBuff;
      if (branch.fireRateBuff) tower.fireRateBuff = branch.fireRateBuff;
      if (branch.bonusGoldPercent) tower.bonusGoldPercent = branch.bonusGoldPercent;
      if (branch.clusterCount) {
        tower.clusterCount = branch.clusterCount;
        tower.clusterDamage = branch.clusterDamage;
      }
      if (branch.groundFire) {
        tower.groundFireDuration = branch.groundFire.duration;
        tower.groundFireDps = branch.groundFire.dps;
      }
      if (branch.chainTargets) tower.chainTargets = branch.chainTargets;
      if (branch.freezeChance) {
        tower.freezeChance = branch.freezeChance;
        tower.freezeDuration = branch.freezeDuration;
      }
      if (branch.vulnerabilityFactor) tower.vulnerabilityFactor = branch.vulnerabilityFactor;
      if (branch.ignoresArmor) tower.ignoresArmor = true;
      if (branch.critThreshold) {
        tower.critThreshold = branch.critThreshold;
        tower.critMultiplier = branch.critMultiplier;
      }
      if (branch.projectileSpeed) tower.projectileSpeed = branch.projectileSpeed * this.cellSize;
      if (branch.projectileColor) tower.projectileColor = branch.projectileColor;
      if (branch.turretColor) tower.turretColor = branch.turretColor;

      this.updateSupportBuffs();
      this.playSound('upgrade');
      this.spawnSparks(tower.x, tower.y, 24, '#f59e0b');
      return { success: true, tower };
    }

    // Vende una torre con tasa de reembolso (con bonificación de metaprogreso)
    sellTower(c, r) {
      const tower = this.gridTowers[r]?.[c];
      if (!tower) return { success: false, reason: 'no_hay_torre' };

      const refundRate = this.meta ? this.meta.getSellRefundRate() : 0.70;
      const refund = Math.floor(tower.investedGold * refundRate);
      this.gold += refund;

      this.gridTowers[r][c] = null;
      const idx = this.towers.indexOf(tower);
      if (idx !== -1) this.towers.splice(idx, 1);

      this.updateSupportBuffs();
      this.playSound('build');
      this.spawnSparks(tower.x, tower.y, 8, '#94a3b8');
      return { success: true, refund };
    }

    // Configura la prioridad de apuntado de una torre
    setTargetPriority(c, r, priority) {
      const tower = this.gridTowers[r]?.[c];
      if (!tower) return false;
      tower.targetPriority = priority;
      return true;
    }

    // Actualiza auras de apoyo de los Obeliscos y bonos globales
    updateSupportBuffs() {
      const globalDmgMult = this.meta ? this.meta.getGlobalDamageMultiplier() : 1.0;
      const globalRateMult = this.meta ? this.meta.getGlobalFireRateMultiplier() : 1.0;
      const relicRangeMult = this.hasRelic('lente_cuantica') ? 1.15 : 1.0;

      for (const t of this.towers) {
        t.effDmgMult = globalDmgMult;
        t.effRangeMult = relicRangeMult;
        t.effRateMult = globalRateMult;
        t.effGoldMult = 1.0;

        // Bonificaciones de terrenos tácticos (Fase 4)
        if (t.isHighground) t.effRangeMult += 0.25;
        if (t.isGeode) t.effDmgMult += 0.20;

        // Bonificaciones específicas de reliquias por tipo de torre
        if (this.hasRelic('fision_acelerada') && (t.typeId === 'balistico' || t.typeId === 'francotirador')) {
          t.effRateMult *= 1.20;
        }
      }

      const obelisks = this.towers.filter(t => t.typeId === 'obelisco');
      for (const ob of obelisks) {
        let obRange = (ob.rangeCells || 1.8) * this.cellSize;
        if (this.hasRelic('sobrecarga_obelisco')) obRange *= 1.5;

        for (const target of this.towers) {
          if (target === ob) continue;
          const dist = Math.hypot(target.x - ob.x, target.y - ob.y);
          if (dist <= obRange) {
            if (ob.damageBuff) target.effDmgMult += ob.damageBuff;
            if (ob.rangeBuff) target.effRangeMult += ob.rangeBuff;
            if (ob.fireRateBuff) target.effRateMult += ob.fireRateBuff;
            if (ob.bonusGoldPercent) target.effGoldMult += ob.bonusGoldPercent;
          }
        }
      }
    }

    // Configuración y lanzamiento de oleadas
    startNextWave() {
      return this.startWave();
    }

    // Rutas y portales de spawn activos según la ronda
    getActivePaths(waveNum = this.currentWave) {
      if (!this.mapData.paths || this.mapData.paths.length <= 1) {
        return [this.mapData.waypoints];
      }
      const totalPaths = this.mapData.paths.length;
      // Progresión de puntos de reaparición:
      // Rondas 1 a 3: 1 solo portal principal (familiarización táctica)
      // Rondas 4+: 2 portales simultáneos (apertura de flanco secundario)
      // Rondas 8+: 3 portales simultáneos (asalto multidireccional)
      let allowedCount = 1;
      if (waveNum >= 4) allowedCount = Math.min(2, totalPaths);
      if (waveNum >= 8 && totalPaths >= 3) allowedCount = 3;

      return this.mapData.paths.slice(0, allowedCount);
    }

    // Construye la cola de enemigos para una oleada dada con escalado progresivo
    buildWaveQueue(w) {
      const queue = [];
      const waveHpScale = 1.0 + Math.max(0, w - 1) * 0.045; // Escalado progresivo de salud

      const addGroup = (typeId, count, interval = 0.8, hpScale = 1.0) => {
        const effectiveHp = hpScale * waveHpScale;
        for (let i = 0; i < count; i++) {
          queue.push({
            typeId,
            delay: i * interval,
            hpScale: effectiveHp
          });
        }
      };

      if (w === 1) {
        addGroup('reptante', 8, 1.1);
      } else if (w === 2) {
        addGroup('reptante', 6, 0.9);
        addGroup('veloz', 4, 0.7);
      } else if (w === 3) {
        addGroup('veloz', 8, 0.6);
        addGroup('blindado', 3, 1.5);
      } else if (w === 4) {
        addGroup('reptante', 10, 0.7);
        addGroup('etero', 4, 1.1);
      } else if (w === 5) {
        addGroup('blindado', 5, 1.2);
        addGroup('regenerador', 4, 1.3);
      } else if (w === 6) {
        addGroup('divisor', 5, 1.4);
        addGroup('veloz', 8, 0.5);
      } else if (w === 7) {
        addGroup('etero', 8, 0.8);
        addGroup('blindado', 6, 1.2);
      } else if (w === 8) {
        addGroup('regenerador', 6, 1.0);
        addGroup('divisor', 6, 1.2);
      } else if (w === 9) {
        addGroup('blindado', 6, 1.8);
        addGroup('divisor', 6, 1.4);
        addGroup('veloz', 8, 0.6);
      } else if (w === 10) {
        // JEFE COLOSO EN OLEADA 10
        addGroup('reptante', 8, 0.8);
        addGroup('jefe_coloso', 1, 3.0, 1.0);
        addGroup('regenerador', 4, 1.4);
      } else if (w < 20) {
        addGroup('reptante', 10 + (w - 10) * 2, 0.7);
        addGroup('veloz', 8 + (w - 10), 0.5);
        addGroup('blindado', 4 + Math.floor((w - 10) / 2), 1.5);
        addGroup('etero', 6 + (w - 10), 0.9);
        addGroup('regenerador', 5, 1.2);
        addGroup('divisor', 6, 1.2);
      } else if (w === 20) {
        // OLEADA 20: CLÍMAX FINAL DE CAMPAÑA
        addGroup('veloz', 12, 0.4);
        addGroup('jefe_coloso', 2, 4.0, 1.35);
        addGroup('blindado', 8, 1.2);
        addGroup('etero', 10, 0.7);
        addGroup('divisor', 8, 1.0);
      } else {
        // OLEADA > 20: MODO SIN FIN CON ESCALADO Y JEFES CADA 5 OLEADAS
        const extra = w - 20;
        const hpScale = 1.0 + extra * 0.12;
        const isBossWave = (w % 5 === 0);

        if (isBossWave) {
          const bossCount = Math.min(6, 1 + Math.floor(extra / 5));
          addGroup('veloz', 12 + extra, 0.35, hpScale);
          addGroup('jefe_coloso', bossCount, 3.5, hpScale * 1.3);
          addGroup('blindado', 8 + extra, 0.9, hpScale);
          addGroup('regenerador', 6 + Math.floor(extra / 2), 1.0, hpScale);
        } else {
          addGroup('reptante', 14 + extra * 2, 0.5, hpScale);
          addGroup('veloz', 10 + extra, 0.4, hpScale);
          addGroup('blindado', 6 + extra, 1.0, hpScale);
          addGroup('etero', 8 + extra, 0.65, hpScale);
          addGroup('regenerador', 5 + Math.floor(extra / 3), 0.9, hpScale);
          addGroup('divisor', 6 + Math.floor(extra / 2), 0.85, hpScale);
        }
      }

      return queue;
    }

    startWave(waveNum) {
      if (this.waveActive) return false;
      const prevWave = this.currentWave;
      this.currentWave = waveNum !== undefined ? waveNum : this.currentWave + 1;
      this.waveActive = true;
      this.waveSpawnQueue = this.buildWaveQueue(this.currentWave);
      this.waveSpawnTimer = 0;

      // Alerta táctica si se activa un nuevo portal de respawn
      if (this.currentWave > 1) {
        const prevPortals = this.getActivePaths(prevWave).length;
        const curPortals = this.getActivePaths(this.currentWave).length;
        if (curPortals > prevPortals) {
          this.screenShake(6.0, 0.4);
          this.screenFlash('rgba(244, 63, 94, 0.45)', 0.45);
          this.playSound('boss_alert');
          const cp = this.getCorePos();
          this.addDamageNumber(cp.x, cp.y - 45, `Nuevo portal activo (${curPortals} portales)`, '#f43f5e', true);
        }
      }

      return true;
    }

    // Adelanto de asalto con bono de oro económico
    callNextWaveEarly() {
      if (!this.waveActive || (!this.isEndless && this.currentWave >= this.maxWaves)) return false;
      const bonus = 20 + Math.floor(this.currentWave * 4);
      this.gold += bonus;
      const corePos = this.getCorePos();
      this.addDamageNumber(corePos.x, corePos.y - 35, `+${bonus} Oro (adelanto)`, '#fbbf24', true);
      this.playSound('wave_early');
      this.screenShake(3.0, 0.2);

      this.currentWave++;
      const nextBatch = this.buildWaveQueue(this.currentWave);
      for (const item of nextBatch) {
        this.waveSpawnQueue.push(item);
      }
      return { success: true, bonus };
    }

    // Radar Táctico: resumen compositivo de la siguiente oleada
    getNextWaveIntel(waveNum = (this.currentWave + 1)) {
      if (!this.isEndless && waveNum > this.maxWaves) return null;
      const queue = this.buildWaveQueue(waveNum);
      const counts = {};
      let hasBoss = false;
      for (const item of queue) {
        counts[item.typeId] = (counts[item.typeId] || 0) + 1;
        if (item.typeId === 'jefe_coloso') hasBoss = true;
      }
      return {
        waveNum,
        total: queue.length,
        counts,
        hasBoss
      };
    }

    // Comprueba disponibilidad de Habilidad del Comandante
    canUseSkill(skillId) {
      if (this.gameOver || this.victory || this.isPaused) return false;
      return (this.skillsCooldowns[skillId] || 0) <= 0;
    }

    // Cancela habilidad con apuntado activo
    cancelTargetSkill() {
      this.activeTargetSkill = null;
    }

    // Ejecuta una Habilidad del Comandante
    useSkill(skillId, targetX, targetY) {
      if (!this.canUseSkill(skillId)) return { success: false, reason: 'cooldown' };

      if (skillId === 'orbital_strike') {
        if (targetX === undefined || targetY === undefined) {
          this.activeTargetSkill = 'orbital_strike';
          return { success: true, targeting: true };
        }
        this.activeTargetSkill = null;
        this.skillsCooldowns.orbital_strike = this.skillsMaxCooldowns.orbital_strike;

        // Haz descendente de luz cuántica
        this.beams.push({
          x1: targetX,
          y1: 0,
          x2: targetX,
          y2: targetY,
          color: '#f97316',
          life: 0.35,
          maxLife: 0.35
        });

        // Daño de fuego en área (radio 2.2 celdas)
        const radius = this.cellSize * 2.2;
        for (const e of this.enemies) {
          if (!e.alive) continue;
          const d = Math.hypot(e.x - targetX, e.y - targetY);
          if (d <= radius) {
            this.applyDamageToEnemy(e, 450, true, 'fire', 1.0, null, true);
          }
        }

        // Charco de napalm residual
        this.hazards.push({
          x: targetX,
          y: targetY,
          radius: this.cellSize * 1.8,
          dps: 55,
          life: 4.0,
          maxLife: 4.0,
          effGoldMult: 1.0
        });

        this.spawnSparks(targetX, targetY, 35, '#fb923c');
        this.shake('orbital_strike');
        this.screenFlash('rgba(249, 115, 22, 0.45)', 0.35);
        this.addDamageNumber(targetX, targetY - 20, 'Bombardeo orbital', '#f97316', true);
        this.playSound('orbital_strike');
        return { success: true };
      }

      if (skillId === 'time_freeze') {
        this.skillsCooldowns.time_freeze = this.skillsMaxCooldowns.time_freeze;
        for (const e of this.enemies) {
          if (e.alive) {
            e.freezeTimer = 4.5;
            this.spawnSparks(e.x, e.y, 8, '#38bdf8');
          }
        }
        const corePos = this.getCorePos();
        this.screenFlash('rgba(56, 189, 248, 0.45)', 0.35);
        this.addDamageNumber(corePos.x, corePos.y - 25, 'Estasis temporal', '#38bdf8', true);
        this.playSound('time_freeze');
        return { success: true };
      }

      if (skillId === 'gold_surge') {
        this.skillsCooldowns.gold_surge = this.skillsMaxCooldowns.gold_surge;
        this.gold += 120;
        this.overchargeTimer = 8.0;
        const corePos = this.getCorePos();
        this.screenFlash('rgba(245, 158, 11, 0.35)', 0.3);
        this.addDamageNumber(corePos.x, corePos.y - 25, '+120 Oro (sobrecarga)', '#fbbf24', true);
        this.playSound('gold_surge');
        return { success: true };
      }

      return { success: false, reason: 'habilidad_desconocida' };
    }

    // Spawnea una criatura enemiga
    spawnEnemy(typeId, hpScale = 1.0, customPos = null, customWpIndex = 1) {
      const def = ENEMIGOS[typeId];
      if (!def) return null;

      let path = this.mapData.waypoints;
      const activePaths = this.getActivePaths ? this.getActivePaths() : (this.mapData.paths || []);
      if (activePaths && activePaths.length > 0) {
        const pathIdx = (this.enemies.length + this.waveSpawnQueue.length) % activePaths.length;
        path = activePaths[pathIdx];
      }

      const startCell = path[0] || { c: 0, r: 1 };
      const startX = customPos ? customPos.x : (startCell.c + 0.5) * this.cellSize;
      const startY = customPos ? customPos.y : (startCell.r + 0.5) * this.cellSize;

      let effectiveHpScale = hpScale * this.diffHpMult;
      const maxHp = Math.round(def.hp * effectiveHpScale);

      const waveSpeedScale = Math.min(1.28, 1.0 + Math.max(0, this.currentWave - 1) * 0.012);
      let enemySpeed = def.speed * this.cellSize * this.diffSpeedMult * waveSpeedScale;
      if (this.mutators.includes('speedy')) enemySpeed *= 1.25;

      let enemyArmor = def.armor || 0;
      if (this.mutators.includes('armored')) enemyArmor = Math.min(0.85, enemyArmor + 0.20);

      const enemy = {
        id: this._nextId++,
        typeId: typeId,
        name: def.name,
        x: startX,
        y: startY,
        hp: maxHp,
        maxHp: maxHp,
        speed: enemySpeed,
        baseSpeed: enemySpeed,
        reward: def.reward,
        damage: def.damage,
        size: def.size || 11,
        armor: enemyArmor,
        flying: !!def.flying,
        isBoss: !!def.isBoss,
        regen: def.regen || 0,
        splitCount: def.splitCount || 0,
        splitTypeId: def.splitTypeId || null,
        healAuraRadius: def.healAuraRadius ? def.healAuraRadius * this.cellSize : 0,
        healAuraAmount: def.healAuraAmount || 0,
        healCooldown: def.healCooldown || 4.0,
        healTimer: def.healCooldown || 4.0,
        stunRadius: def.stunRadius ? def.stunRadius * this.cellSize : 0,
        stunDuration: def.stunDuration || 2.2,
        stunCooldown: def.stunCooldown || 7.0,
        stunTimer: def.stunCooldown || 7.0,
        slowTimer: 0,
        currentSlowFactor: 0,
        freezeTimer: 0,
        vulnerableTimer: 0,
        vulnerableFactor: 0,
        path: path,
        waypointIndex: customWpIndex,
        distanceTraveled: 0,
        color: def.color || '#cbd5e1',
        alive: true
      };

      this.enemies.push(enemy);
      return enemy;
    }

    // Activa la onda curativa del Jefe
    triggerBossHealAura(boss) {
      if (!boss || !boss.alive) return;
      this.spawnSparks(boss.x, boss.y, 25, '#10b981');
      for (const other of this.enemies) {
        if (!other.alive || other === boss) continue;
        const d = Math.hypot(other.x - boss.x, other.y - boss.y);
        if (d <= boss.healAuraRadius) {
          other.hp = Math.min(other.maxHp, other.hp + boss.healAuraAmount);
          this.addDamageNumber(other.x, other.y - 14, `+${boss.healAuraAmount}`, '#4ade80');
        }
      }
    }

    // Activa la onda sísmica de aturdimiento del Jefe
    triggerBossStunAura(boss) {
      if (!boss || !boss.alive) return;
      this.screenShake(6.0, 0.3);
      this.spawnSparks(boss.x, boss.y, 35, '#f43f5e');
      for (const t of this.towers) {
        const d = Math.hypot(t.x - boss.x, t.y - boss.y);
        if (d <= boss.stunRadius) {
          t.stunnedTimer = boss.stunDuration;
          this.spawnSparks(t.x, t.y, 10, '#f43f5e');
        }
      }
    }

    // Descarga de la reliquia Bobina de Tesla
    triggerTeslaStrike() {
      const corePos = this.getCorePos();
      let closest = null;
      let minDist = Infinity;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const d = Math.hypot(e.x - corePos.x, e.y - corePos.y);
        if (d < minDist) {
          minDist = d;
          closest = e;
        }
      }
      if (closest) {
        this.chainZaps.push({
          x1: corePos.x,
          y1: corePos.y,
          x2: closest.x,
          y2: closest.y,
          color: '#a855f7',
          life: 0.25,
          maxLife: 0.25
        });
        this.applyDamageToEnemy(closest, 180, true, 'energy', 1.0);
        this.playSound('shoot_rayo');
      }
    }

    // Selecciona el objetivo según la prioridad configurada
    acquireTarget(tower) {
      return this.findTargetForTower(tower);
    }

    findTargetForTower(tower) {
      const effectiveRange = tower.range * tower.effRangeMult;
      const inRange = [];

      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        const dist = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
        if (dist <= effectiveRange) {
          inRange.push({ enemy, dist });
        }
      }

      if (inRange.length === 0) return null;

      const priority = tower.targetPriority || 'first';
      if (priority === 'first') {
        inRange.sort((a, b) => b.enemy.distanceTraveled - a.enemy.distanceTraveled);
      } else if (priority === 'last') {
        inRange.sort((a, b) => a.enemy.distanceTraveled - b.enemy.distanceTraveled);
      } else if (priority === 'strongest') {
        inRange.sort((a, b) => b.enemy.hp - a.enemy.hp);
      } else if (priority === 'weakest') {
        inRange.sort((a, b) => a.enemy.hp - b.enemy.hp);
      } else if (priority === 'closest') {
        inRange.sort((a, b) => a.dist - b.dist);
      }

      return inRange[0].enemy;
    }

    // Dispara el arma de la torre (proyectil balístico, rayo o mortero parabólico)
    fireTowerWeapon(tower, target) {
      const effDamage = tower.damage * tower.effDmgMult;

      if (tower.typeId === 'rayo') {
        if (tower.branch === 'b' && tower.chainTargets) {
          this.executeChainLightning(tower, target, effDamage, tower.chainTargets);
        } else {
          this.executePiercingBeam(tower, target, effDamage);
        }
        this.playSound('shoot_rayo');
        return;
      }

      let splashRadius = tower.splashRadius;
      if (this.hasRelic('polvora_inestable') && tower.typeId === 'mortero') {
        splashRadius *= 1.30;
      }

      const proj = {
        id: this._nextId++,
        towerId: tower.id,
        towerTypeId: tower.typeId,
        branch: tower.branch,
        x: tower.x + Math.cos(tower.angle) * 14,
        y: tower.y + Math.sin(tower.angle) * 14,
        startX: tower.x,
        startY: tower.y,
        targetId: target.id,
        targetX: target.x,
        targetY: target.y,
        speed: tower.projectileSpeed,
        damage: effDamage,
        damageType: tower.damageType,
        color: tower.projectileColor,
        radius: tower.projectileRadius,
        splashRadius: splashRadius,
        slowFactor: tower.slowFactor,
        freezeChance: tower.freezeChance || 0,
        freezeDuration: tower.freezeDuration || 0,
        vulnerabilityFactor: tower.vulnerabilityFactor || 0,
        ignoresArmor: !!tower.ignoresArmor,
        critThreshold: tower.critThreshold || 0,
        critMultiplier: tower.critMultiplier || 1.0,
        clusterCount: tower.clusterCount || 0,
        clusterDamage: tower.clusterDamage || 0,
        groundFireDuration: tower.groundFireDuration || 0,
        groundFireDps: tower.groundFireDps || 0,
        effGoldMult: tower.effGoldMult || 1.0,
        trail: [],
        alive: true,
        // Balística parabólica 3D para mortero
        isMortar: tower.typeId === 'mortero',
        flightDuration: 0.75,
        elapsed: 0,
        maxHeight: 38,
        groundX: tower.x,
        groundY: tower.y,
        heightZ: 0
      };

      this.projectiles.push(proj);

      if (tower.typeId === 'mortero') {
        this.playSound('shoot_mortero');
      } else if (tower.typeId === 'francotirador') {
        this.playSound('shoot_francotirador');
      } else if (tower.typeId === 'crio') {
        this.playSound('shoot_crio');
      } else {
        this.playSound('shoot_balistico');
      }
    }

    // Rayo continuo perforante
    executePiercingBeam(tower, target, damage) {
      const angle = Math.atan2(target.y - tower.y, target.x - tower.x);
      const beamLength = tower.range * tower.effRangeMult;
      const endX = tower.x + Math.cos(angle) * beamLength;
      const endY = tower.y + Math.sin(angle) * beamLength;

      this.beams.push({
        x1: tower.x,
        y1: tower.y,
        x2: endX,
        y2: endY,
        color: tower.projectileColor,
        life: 0.14,
        maxLife: 0.14
      });

      for (const e of this.enemies) {
        if (!e.alive) continue;
        const distToLine = this.distToSegment({ x: e.x, y: e.y }, { x: tower.x, y: tower.y }, { x: endX, y: endY });
        if (distToLine <= e.size + 6) {
          this.applyDamageToEnemy(e, damage, true, 'energy', tower.effGoldMult, tower.id);
        }
      }
    }

    // Arco voltaico encadenado (Tesla)
    executeChainLightning(tower, initialTarget, damage, maxBounces) {
      let current = initialTarget;
      let lastPos = { x: tower.x, y: tower.y };
      const hitIds = new Set();
      let currentDmg = damage;

      for (let bounce = 0; bounce < maxBounces; bounce++) {
        if (!current || !current.alive) break;
        hitIds.add(current.id);

        this.chainZaps.push({
          x1: lastPos.x,
          y1: lastPos.y,
          x2: current.x,
          y2: current.y,
          color: '#38bdf8',
          life: 0.18,
          maxLife: 0.18
        });

        this.applyDamageToEnemy(current, currentDmg, true, 'energy', tower.effGoldMult, tower.id);
        lastPos = { x: current.x, y: current.y };
        currentDmg *= 0.8;

        let next = null;
        let minDist = 3.5 * this.cellSize;
        for (const candidate of this.enemies) {
          if (!candidate.alive || hitIds.has(candidate.id)) continue;
          const d = Math.hypot(candidate.x - current.x, candidate.y - current.y);
          if (d < minDist) {
            minDist = d;
            next = candidate;
          }
        }
        current = next;
      }
    }

    distToSegment(p, v, w) {
      const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
      if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
      let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
    }

    // Actualiza proyectiles: persecución, parábola 3D e impacto
    updateProjectiles(dt) {
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        if (!p.alive) {
          this.projectiles.splice(i, 1);
          continue;
        }

        const target = this.enemies.find(e => e.id === p.targetId && e.alive);
        if (target) {
          p.targetX = target.x;
          p.targetY = target.y;
        }

        if (p.isMortar) {
          p.elapsed += dt;
          const t = Math.min(1.0, p.elapsed / p.flightDuration);
          p.groundX = p.startX + (p.targetX - p.startX) * t;
          p.groundY = p.startY + (p.targetY - p.startY) * t;
          p.heightZ = 4 * p.maxHeight * t * (1 - t);
          p.x = p.groundX;
          p.y = p.groundY - p.heightZ;

          p.trail.unshift({ x: p.x, y: p.y });
          if (p.trail.length > 6) p.trail.pop();

          if (t >= 1.0) {
            this.playSound('explosion');
            this.onProjectileHit(p, target);
            p.alive = false;
            this.projectiles.splice(i, 1);
          }
          continue;
        }

        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.hypot(dx, dy);
        const step = p.speed * dt;

        p.trail.unshift({ x: p.x, y: p.y });
        if (p.trail.length > 5) p.trail.pop();

        if (dist <= step || (target && dist <= target.size + p.radius)) {
          p.x = p.targetX;
          p.y = p.targetY;
          this.onProjectileHit(p, target);
          p.alive = false;
          this.projectiles.splice(i, 1);
        } else {
          p.x += (dx / dist) * step;
          p.y += (dy / dist) * step;
        }
      }
    }

    // Procesa el impacto del proyectil
    onProjectileHit(proj, primaryTarget) {
      this.spawnSparks(proj.x, proj.y, 10, proj.color);

      // Daño en área (Mortero / Batería pesada)
      if (proj.splashRadius > 0) {
        for (const e of this.enemies) {
          if (!e.alive) continue;
          const dist = Math.hypot(e.x - proj.x, e.y - proj.y);
          if (dist <= proj.splashRadius) {
            const falloff = 1 - (dist / proj.splashRadius) * 0.4;
            this.applyDamageToEnemy(e, proj.damage * falloff, proj.ignoresArmor, proj.damageType, proj.effGoldMult, proj.towerId);
          }
        }

        // Submuniciones de racimo
        if (proj.clusterCount > 0) {
          for (let k = 0; k < proj.clusterCount; k++) {
            const angle = (k / proj.clusterCount) * Math.PI * 2 + Math.random();
            const cx = proj.x + Math.cos(angle) * 22;
            const cy = proj.y + Math.sin(angle) * 22;
            this.spawnSparks(cx, cy, 12, '#f97316');
            for (const ce of this.enemies) {
              if (ce.alive && Math.hypot(ce.x - cx, ce.y - cy) <= this.cellSize * 0.9) {
                this.applyDamageToEnemy(ce, proj.clusterDamage, false, 'physical', proj.effGoldMult, proj.towerId);
              }
            }
          }
        }

        // Charco de fuego residual (Napalm)
        if (proj.groundFireDuration > 0) {
          this.hazards.push({
            x: proj.x,
            y: proj.y,
            radius: this.cellSize * 1.1,
            dps: proj.groundFireDps,
            life: proj.groundFireDuration,
            maxLife: proj.groundFireDuration,
            effGoldMult: proj.effGoldMult,
            towerId: proj.towerId
          });
        }
      } else if (primaryTarget && primaryTarget.alive) {
        let dmg = proj.damage;

        // Golpe crítico de Francotirador
        let isCrit = false;
        if (proj.critThreshold > 0 && (primaryTarget.hp / primaryTarget.maxHp) >= proj.critThreshold) {
          dmg *= proj.critMultiplier;
          isCrit = true;
        }

        this.applyDamageToEnemy(primaryTarget, dmg, proj.ignoresArmor, proj.damageType, proj.effGoldMult, proj.towerId, isCrit);

        // Efectos de control (Ralentización / Congelación)
        if (proj.slowFactor > 0) {
          let slowPower = proj.slowFactor;
          if (this.hasRelic('cero_absoluto')) slowPower = Math.min(0.85, slowPower + 0.15);
          primaryTarget.slowTimer = 2.4;
          primaryTarget.currentSlowFactor = Math.max(primaryTarget.currentSlowFactor, slowPower);
        }
        if (proj.freezeChance > 0 && Math.random() < proj.freezeChance) {
          primaryTarget.freezeTimer = proj.freezeDuration;
          this.spawnSparks(primaryTarget.x, primaryTarget.y, 14, '#e0f2fe');
        }
        if (proj.vulnerabilityFactor > 0) {
          primaryTarget.vulnerableTimer = 2.5;
          primaryTarget.vulnerableFactor = proj.vulnerabilityFactor;
        }
      }
    }

    // Aplica el daño mitigado por armadura y efectúa la baja
    applyDamageToEnemy(enemy, rawDamage, ignoresArmor = false, damageType = 'physical', goldMult = 1.0, towerId = null, isCrit = false) {
      if (!enemy || !enemy.alive) return;

      let effectiveDmg = rawDamage;

      // Vulnerabilidad activa por escarcha
      if (enemy.vulnerableFactor > 0) {
        effectiveDmg *= (1 + enemy.vulnerableFactor);
      }

      // Reliquia aleación antimateria contra blindados
      if (this.hasRelic('aleacion_antimateria') && enemy.armor > 0) {
        effectiveDmg *= 1.30;
      }

      // Mitigación por armadura (solo daño físico sin perforación)
      if (!ignoresArmor && damageType === 'physical' && enemy.armor > 0) {
        effectiveDmg *= (1 - enemy.armor);
      }

      enemy.hp -= effectiveDmg;

      // Actualizar estadísticas de la partida
      this.stats.totalDamage += effectiveDmg;
      if (towerId) {
        this.stats.towerDamage[towerId] = (this.stats.towerDamage[towerId] || 0) + effectiveDmg;
      }

      // Despliegue de indicador numérico de daño temático
      let dmgColor = '#fef08a';
      if (isCrit) dmgColor = '#fbbf24';
      else if (damageType === 'energy') dmgColor = '#c084fc';
      else if (enemy.slowTimer > 0) dmgColor = '#38bdf8';

      this.addDamageNumber(enemy.x, enemy.y - 12, effectiveDmg, dmgColor, isCrit);

      if (enemy.hp <= 0) {
        enemy.alive = false;
        let totalReward = Math.round(enemy.reward * goldMult);

        if (this.hasRelic('transmutador_aurico')) totalReward += 2;
        if (this.mutators.includes('frugal')) totalReward = Math.round(totalReward * 0.8);

        this.gold += totalReward;
        this.score += totalReward * 10;
        this.stats.kills++;
        this.stats.killsByType[enemy.typeId] = (this.stats.killsByType[enemy.typeId] || 0) + 1;
        this.stats.goldEarned += totalReward;

        this.spawnSparks(enemy.x, enemy.y, enemy.isBoss ? 45 : 18, enemy.color);

        if (enemy.isBoss) {
          const bossShards = Math.round(5 * this.diffShardMult);
          this.addShards(bossShards);
          this.shake('boss_death');
          this.addDamageNumber(enemy.x, enemy.y - 24, `+${bossShards} esquirlas`, '#d8b4fe', true);
        }

        // Si es criatura divisora, fragmentar en crías
        if (enemy.splitCount > 0 && enemy.splitTypeId) {
          for (let s = 0; s < enemy.splitCount; s++) {
            const offset = (s === 0 ? -1 : 1) * 8;
            this.spawnEnemy(enemy.splitTypeId, 1.0, { x: enemy.x + offset, y: enemy.y + offset }, enemy.waypointIndex);
          }
        }
      }
    }

    // Spawnea chispas de partículas para impactos y explosiones
    spawnSparks(x, y, count, color) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 30 + Math.random() * 120;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.35 + Math.random() * 0.3,
          maxLife: 0.65,
          size: 2 + Math.random() * 3,
          color
        });
      }
    }

    // Añade número flotante de daño
    addDamageNumber(x, y, amount, color = '#fef08a', isCrit = false) {
      this.damageNumbers.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y,
        amount: typeof amount === 'number' ? Math.round(amount) : amount,
        color,
        isCrit,
        life: 0.70,
        maxLife: 0.70,
        vy: isCrit ? -45 : -32
      });
    }

    // Actualiza peligros ambientales (fuego), haces y partículas
    updateFx(dt) {
      // Charcos de fuego (Hazards)
      for (let i = this.hazards.length - 1; i >= 0; i--) {
        const h = this.hazards[i];
        h.life -= dt;
        if (h.life <= 0) {
          this.hazards.splice(i, 1);
          continue;
        }

        for (const e of this.enemies) {
          if (!e.alive || e.flying) continue;
          if (Math.hypot(e.x - h.x, e.y - h.y) <= h.radius) {
            this.applyDamageToEnemy(e, h.dps * dt, true, 'energy', h.effGoldMult, h.towerId);
          }
        }
      }

      // Haces de luz
      for (let i = this.beams.length - 1; i >= 0; i--) {
        this.beams[i].life -= dt;
        if (this.beams[i].life <= 0) this.beams.splice(i, 1);
      }

      // Rayos tesla
      for (let i = this.chainZaps.length - 1; i >= 0; i--) {
        this.chainZaps[i].life -= dt;
        if (this.chainZaps[i].life <= 0) this.chainZaps.splice(i, 1);
      }

      // Partículas
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) this.particles.splice(i, 1);
      }

      // Números de daño flotantes
      for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
        const d = this.damageNumbers[i];
        d.y += d.vy * dt;
        d.life -= dt;
        if (d.life <= 0) this.damageNumbers.splice(i, 1);
      }
    }

    // Actualiza el apuntado y disparo de las torres
    updateTowers(dt) {
      for (const t of this.towers) {
        if (t.stunnedTimer > 0) {
          t.stunnedTimer -= dt;
          continue;
        }

        if (t.recoilAnim > 0) {
          t.recoilAnim = Math.max(0, t.recoilAnim - dt * 6);
        }

        if (t.typeId === 'obelisco') {
          // Pulso de resonancia periódico
          t.cooldown -= dt;
          if (t.cooldown <= 0) {
            t.cooldown = 1.6;
            this.playSound('obelisco_pulse');
            this.spawnSparks(t.x, t.y, 8, '#38bdf8');
          }
          continue;
        }

        if (t.cooldown > 0) {
          t.cooldown -= dt;
        }

        const target = this.findTargetForTower(t);
        t.target = target;

        if (target) {
          t.angle = Math.atan2(target.y - t.y, target.x - t.x);

          if (t.cooldown <= 0) {
            const overcharge = this.overchargeTimer > 0 ? 1.35 : 1.0;
            const effectiveFireRate = t.fireRate * t.effRateMult * overcharge;
            t.cooldown = 1 / effectiveFireRate;
            t.recoilAnim = 1.0;
            this.fireTowerWeapon(t, target);
          }
        }
      }
    }

    // Actualiza movimiento y habilidades de enemigos
    updateEnemies(dt) {
      const corePos = this.getCorePos();

      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        if (!e.alive) {
          this.enemies.splice(i, 1);
          continue;
        }

        // Estados alterados
        if (e.freezeTimer > 0) {
          e.freezeTimer -= dt;
          continue; // Congelado completamente
        }

        // Furia en rondas avanzadas: acelera al tener menos de 30% de vida
        if (this.currentWave >= 8 && !e.frenzy && e.hp > 0 && e.hp <= e.maxHp * 0.30) {
          e.frenzy = true;
          e.baseSpeed *= 1.25;
          this.spawnSparks(e.x, e.y, 8, '#ef4444');
        }

        let speed = e.baseSpeed;
        if (e.slowTimer > 0) {
          e.slowTimer -= dt;
          speed *= (1 - e.currentSlowFactor);
        }

        // Regeneración pasiva
        if (e.regen > 0 && e.hp < e.maxHp) {
          e.hp = Math.min(e.maxHp, e.hp + e.regen * dt);
        }

        // Habilidades activas de Jefes
        if (e.isBoss) {
          e.healTimer -= dt;
          if (e.healTimer <= 0) {
            e.healTimer = e.healCooldown;
            this.triggerBossHealAura(e);
          }

          e.stunTimer -= dt;
          if (e.stunTimer <= 0) {
            e.stunTimer = e.stunCooldown;
            this.triggerBossStunAura(e);
          }
        }

        if (e.flying) {
          // Unidad voladora: vuela en línea recta al núcleo
          const dx = corePos.x - e.x;
          const dy = corePos.y - e.y;
          const dist = Math.hypot(dx, dy);
          const step = speed * dt;

          if (dist <= step || dist <= this.cellSize * 0.4) {
            this.damageCore(e);
            e.alive = false;
            this.enemies.splice(i, 1);
            continue;
          }

          e.x += (dx / dist) * step;
          e.y += (dy / dist) * step;
          e.distanceTraveled += step;
        } else {
          // Criatura terrestre: sigue waypoints del sendero
          const path = e.path;
          if (e.waypointIndex >= path.length) {
            this.damageCore(e);
            e.alive = false;
            this.enemies.splice(i, 1);
            continue;
          }

          const targetWp = path[e.waypointIndex];
          const tx = (targetWp.c + 0.5) * this.cellSize;
          const ty = (targetWp.r + 0.5) * this.cellSize;

          const dx = tx - e.x;
          const dy = ty - e.y;
          const dist = Math.hypot(dx, dy);
          const step = speed * dt;

          if (dist <= step) {
            e.x = tx;
            e.y = ty;
            e.distanceTraveled += dist;
            e.waypointIndex++;
          } else {
            e.x += (dx / dist) * step;
            e.y += (dy / dist) * step;
            e.distanceTraveled += step;
          }
        }
      }
    }

    onEnemyReachedCore(enemy) {
      this.damageCore(enemy);
    }

    // Daña el núcleo defensivo
    damageCore(enemy) {
      const corePos = this.getCorePos();

      if (enemy) {
        enemy.alive = false;
      }

      if (this.coreShield > 0) {
        this.coreShield--;
        this.screenFlash('rgba(56, 189, 248, 0.4)', 0.22);
        this.screenShake(3.5, 0.2);
        this.addDamageNumber(corePos.x, corePos.y - 18, '¡ESCUDO!', '#38bdf8', true);
        return;
      }

      this.lives -= enemy ? enemy.damage : 1;
      this.screenFlash('rgba(239, 68, 68, 0.45)', 0.3);
      this.shake('core_damage');
      this.playSound('core_damaged');
      this.addDamageNumber(corePos.x, corePos.y - 18, `-${enemy ? enemy.damage : 1}`, '#ef4444', true);

      if (this.lives <= 0) {
        this.lives = 0;
        this.gameOver = true;
        this.resetShake();
        if (this.isEndless) {
          const score = (this.stats.kills || 0) * 10 + (this.gold || 0) * 2 + (this.currentWave || 0) * 100;
          this.saveEndlessRecord(this.currentWave, score);
        }
      }
    }

    // Bucle de simulación por frame
    update(dt) {
      if (this.gameOver || this.victory || this.isPaused) {
        this.resetShake();
        return;
      }

      const effectiveDt = dt * this.gameSpeed;
      this.gameTime += effectiveDt;

      // Actualizar sacudida y destello de pantalla con decaimiento garantizado a 0
      if (this.shakeTimer > 0) {
        this.shakeTimer -= dt;
        if (this.shakeTimer <= 0.03 || this.shakeIntensity < 0.05) {
          this.resetShake();
        }
      }
      if (this.flashTimer > 0) {
        this.flashTimer -= dt;
      }

      // Cooldowns de Habilidades del Comandante (Fase 4)
      if (this.skillsCooldowns.orbital_strike > 0) {
        this.skillsCooldowns.orbital_strike = Math.max(0, this.skillsCooldowns.orbital_strike - dt);
      }
      if (this.skillsCooldowns.time_freeze > 0) {
        this.skillsCooldowns.time_freeze = Math.max(0, this.skillsCooldowns.time_freeze - dt);
      }
      if (this.skillsCooldowns.gold_surge > 0) {
        this.skillsCooldowns.gold_surge = Math.max(0, this.skillsCooldowns.gold_surge - dt);
      }
      if (this.overchargeTimer > 0) {
        this.overchargeTimer = Math.max(0, this.overchargeTimer - dt);
      }

      // Reliquia Bobina de Tesla
      if (this.hasRelic('bobina_tesla_nucleo')) {
        this.teslaTimer -= effectiveDt;
        if (this.teslaTimer <= 0) {
          this.teslaTimer = 9.0;
          this.triggerTeslaStrike();
        }
      }

      // Generación de oleada
      if (this.waveActive) {
        if (this.waveSpawnQueue.length > 0) {
          this.waveSpawnTimer += effectiveDt;
          for (let i = this.waveSpawnQueue.length - 1; i >= 0; i--) {
            const item = this.waveSpawnQueue[i];
            if (this.waveSpawnTimer >= item.delay) {
              this.spawnEnemy(item.typeId, item.hpScale);
              this.waveSpawnQueue.splice(i, 1);
            }
          }
        }

        // Fin de oleada
        if (this.waveSpawnQueue.length === 0 && this.enemies.length === 0) {
          this.waveActive = false;
          this.stats.wavesCompleted = this.currentWave;

          // Esquirlas por superar la oleada
          const waveShards = Math.round(1 * this.diffShardMult);
          this.addShards(waveShards);

          // Vetas aúricas activas (Fase 4)
          let goldmineIncome = 0;
          for (const t of this.towers) {
            if (t.isGoldmine) goldmineIncome += 15;
          }
          if (goldmineIncome > 0) {
            this.gold += goldmineIncome;
            const corePos = this.getCorePos();
            this.addDamageNumber(corePos.x, corePos.y - 45, `+${goldmineIncome} Oro (veta)`, '#fbbf24');
          }

          // Interés de banco por reliquia
          if (this.hasRelic('banco_interes')) {
            const interest = Math.min(60, Math.floor(this.gold * 0.10));
            if (interest > 0) {
              this.gold += interest;
              const corePos = this.getCorePos();
              this.addDamageNumber(corePos.x, corePos.y - 30, `+${interest} Oro (interés)`, '#f59e0b');
            }
          }

          this.gold += 50 + this.currentWave * 10;

          // Hito de reliquia en oleadas 5 y 15 (o cada 10 oleadas en modo sin fin)
          const isMilestone = this.isEndless
            ? (this.currentWave === 5 || this.currentWave % 10 === 0)
            : (this.currentWave === 5 || this.currentWave === 15);
          if (isMilestone && typeof window !== 'undefined' && window.showRelicMilestoneModal) {
            window.showRelicMilestoneModal();
          }

          if (this.isEndless) {
            const score = (this.stats.kills || 0) * 10 + (this.gold || 0) * 2 + (this.lives || 0) * 50;
            this.saveEndlessRecord(this.currentWave, score);
          } else if (this.currentWave >= this.maxWaves) {
            this.victory = true;
            const vicShards = Math.round(15 * this.diffShardMult);
            this.addShards(vicShards);
            if (this.campaign) {
              const score = (this.stats.kills || 0) * 10 + (this.gold || 0) * 2 + (this.lives || 0) * 50;
              this.campaign.recordVictory(this.mapIndex, this.lives, this.initialLives, score, this.difficulty);
            }
          }
        }
      }

      this.updateEnemies(effectiveDt);
      this.updateTowers(effectiveDt);
      this.updateProjectiles(effectiveDt);
      this.updateFx(effectiveDt);
    }

    // Renderizado en Canvas 2D con acabado Pseudo-3D avanzado
    render() {
      if (!this.ctx || isNode) return;
      const ctx = this.ctx;
      const cs = this.cellSize;

      ctx.save();

      // Aplicar sacudida de pantalla con decaimiento cuadrático estricto y reset a 0
      if (this.shakeTimer > 0 && this.shakeIntensity > 0 && !this.isPaused && !this.gameOver && !this.victory) {
        const total = this.shakeDurationTotal || 0.25;
        const prog = Math.max(0, Math.min(1, this.shakeTimer / total));
        const currentIntensity = this.shakeIntensity * (prog * prog);
        if (currentIntensity >= 0.05) {
          const sx = (Math.random() - 0.5) * 2 * currentIntensity;
          const sy = (Math.random() - 0.5) * 2 * currentIntensity;
          ctx.translate(sx, sy);
        } else {
          this.resetShake();
        }
      } else if (this.isPaused || this.gameOver || this.victory) {
        this.resetShake();
      }

      // Aplicar transformación de Cámara centrada (Zoom y Paneo móvil)
      const cx = this.width / 2;
      const cy = this.height / 2;
      ctx.translate(cx, cy);
      ctx.scale(this.cameraZoom, this.cameraZoom);
      ctx.translate(-cx + this.cameraPanX, -cy + this.cameraPanY);

      // 1. Dibujar terreno cacheado fuera de pantalla
      if (this.offscreenBg) {
        ctx.drawImage(this.offscreenBg, 0, 0);
      } else {
        this.renderStaticTerrain(ctx);
      }

      // 2. Pulso dinámico de energía en senderos (Runic Chevrons 3D)
      const pathPulseT = (this.gameTime * 1.8) % 1.0;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      for (const wp of this.mapData.waypoints) {
        const cx = (wp.c + 0.5) * cs;
        const cy = (wp.r + 0.5) * cs;
        ctx.beginPath();
        ctx.arc(cx, cy, 3 * pathPulseT + 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Portales de Spawn con Vórtice 3D animado
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (this.mapData.grid[r][c] === 3) {
            const px = (c + 0.5) * cs;
            const py = (r + 0.5) * cs;
            const vAngle = this.gameTime * 2.4;

            ctx.save();
            ctx.translate(px, py);

            ctx.rotate(vAngle);
            ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(0, 0, cs * 0.42, cs * 0.24, 0, 0, Math.PI * 2);
            ctx.stroke();

            ctx.rotate(-vAngle * 2.2);
            ctx.strokeStyle = 'rgba(251, 113, 133, 0.85)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(0, 0, cs * 0.28, cs * 0.16, 0, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(0, 0, cs * 0.12, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }
        }
      }

      // 4. Charcos de fuego residual (Napalm)
      for (const h of this.hazards) {
        const alpha = Math.max(0, h.life / h.maxLife);
        ctx.fillStyle = `rgba(234, 88, 12, ${alpha * 0.45})`;
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(251, 146, 60, ${alpha * 0.8})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // 5. Previsualización de radio al colocar o seleccionar torre (ratón o toque táctil en 2 pasos)
      const targetPreviewCell = (this.pendingBuildCell && this.pendingBuildCell.c >= 0)
        ? this.pendingBuildCell
        : (this.hoverCell && this.hoverCell.c >= 0 && this.hoverCell.r >= 0 ? this.hoverCell : null);

      if (this.selectedBuildType && targetPreviewCell) {
        const hc = targetPreviewCell;
        const discount = this.meta ? this.meta.getTowerCostDiscount() : 0;
        const cost = Math.round((TORRES[this.selectedBuildType]?.cost || 0) * (1.0 - discount));
        const valid = this.canBuildAt(hc.c, hc.r) && this.gold >= cost;
        const px = hc.c * cs;
        const py = hc.r * cs;

        const pulse = this.pendingBuildCell ? (0.7 + 0.3 * Math.sin(this.gameTime * 7)) : 1;
        ctx.fillStyle = valid ? `rgba(56, 189, 248, ${0.25 * pulse})` : 'rgba(239, 68, 68, 0.25)';
        ctx.fillRect(px, py, cs, cs);
        ctx.strokeStyle = valid ? '#38bdf8' : '#ef4444';
        ctx.lineWidth = this.pendingBuildCell ? 2.5 : 2;
        ctx.strokeRect(px + 1, py + 1, cs - 2, cs - 2);

        const towerDef = TORRES[this.selectedBuildType];
        if (towerDef) {
          ctx.beginPath();
          ctx.arc((hc.c + 0.5) * cs, (hc.r + 0.5) * cs, towerDef.range * cs, 0, Math.PI * 2);
          ctx.fillStyle = valid ? 'rgba(56, 189, 248, 0.08)' : 'rgba(239, 68, 68, 0.08)';
          ctx.fill();
          ctx.strokeStyle = valid ? 'rgba(56, 189, 248, 0.6)' : 'rgba(239, 68, 68, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Radio de torre colocada seleccionada
      if (this.selectedPlacedTower) {
        const st = this.selectedPlacedTower;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.range * st.effRangeMult, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Retícula de apuntado para Habilidad del Comandante (Bombardeo Orbital)
      if (this.activeTargetSkill === 'orbital_strike' && this.hoverCell.c >= 0 && this.hoverCell.r >= 0) {
        const targetX = (this.hoverCell.c + 0.5) * cs;
        const targetY = (this.hoverCell.r + 0.5) * cs;
        const radius = cs * 2.2;
        const pulse = Math.sin(this.gameTime * 6) * 3;

        ctx.fillStyle = 'rgba(249, 115, 22, 0.22)';
        ctx.beginPath();
        ctx.arc(targetX, targetY, radius + pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(targetX - radius * 0.7, targetY);
        ctx.lineTo(targetX + radius * 0.7, targetY);
        ctx.moveTo(targetX, targetY - radius * 0.7);
        ctx.lineTo(targetX, targetY + radius * 0.7);
        ctx.stroke();

        ctx.fillStyle = '#ffedd5';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ZONA DE IMPACTO', targetX, targetY - radius - 6);
      }

      // 6. Núcleo Arcano con oscilación y Doble Anillo Giroscópico Orbital 3D
      const corePos = this.getCorePos();
      const bobZ = Math.sin(this.gameTime * 2.5) * 4;

      // Sombra suave proyectada en el suelo
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.ellipse(corePos.x, corePos.y + 12, cs * 0.42 - bobZ * 0.2, cs * 0.22 - bobZ * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();

      // Doble Anillo Cuántico Giroscópico
      const ringAngle1 = this.gameTime * 1.8;
      const ringAngle2 = -this.gameTime * 1.4;

      // Anillo 1 (inclinación +32 grados)
      ctx.save();
      ctx.translate(corePos.x, corePos.y - bobZ);
      ctx.rotate(0.55);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, cs * 0.54, cs * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();
      const nx1 = Math.cos(ringAngle1) * (cs * 0.54);
      const ny1 = Math.sin(ringAngle1) * (cs * 0.22);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(nx1, ny1, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Anillo 2 (inclinación -32 grados)
      ctx.save();
      ctx.translate(corePos.x, corePos.y - bobZ);
      ctx.rotate(-0.55);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, cs * 0.48, cs * 0.20, 0, 0, Math.PI * 2);
      ctx.stroke();
      const nx2 = Math.cos(ringAngle2) * (cs * 0.48);
      const ny2 = Math.sin(ringAngle2) * (cs * 0.20);
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(nx2, ny2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Cristal central levitante
      ctx.save();
      ctx.translate(corePos.x, corePos.y - bobZ);

      // Aura palpitante
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, cs * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Octaedro de cristal facetado (Pseudo-3D)
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(12, 0);
      ctx.lineTo(0, 14);
      ctx.lineTo(-12, 0);
      ctx.closePath();
      ctx.fill();

      // Faceta superior iluminada
      ctx.fillStyle = '#6ee7b7';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(12, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // 7. Torres con relieve Pseudo-3D y sombras a 45 grados
      for (const t of this.towers) {
        // Anillo de terreno táctico especial
        if (t.isHighground) {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(t.x, t.y, cs * 0.46, 0, Math.PI * 2);
          ctx.stroke();
        } else if (t.isGeode) {
          ctx.strokeStyle = 'rgba(192, 132, 252, 0.7)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(t.x, t.y, cs * 0.46, 0, Math.PI * 2);
          ctx.stroke();
        } else if (t.isGoldmine) {
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(t.x, t.y, cs * 0.46, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Sombra proyectada alargada en dirección a la luz (dx=6, dy=10)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(t.x + 6, t.y + 10, cs * 0.42, cs * 0.22, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Pedestal cilíndrico metálico con biseles
        const baseGrad = ctx.createLinearGradient(t.x - cs * 0.38, t.y, t.x + cs * 0.38, t.y);
        baseGrad.addColorStop(0, '#0f172a');
        baseGrad.addColorStop(0.3, t.color);
        baseGrad.addColorStop(0.7, t.color);
        baseGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = baseGrad;
        ctx.beginPath();
        ctx.arc(t.x, t.y, cs * 0.38, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Anillo de núcleo interior
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.arc(t.x, t.y, cs * 0.24, 0, Math.PI * 2);
        ctx.fill();

        // Cañón o estructura giratoria con retroceso (recoil)
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(t.angle);

        const recoilX = -t.recoilAnim * 3.5;

        if (t.typeId === 'obelisco') {
          ctx.fillStyle = t.turretColor;
          ctx.beginPath();
          ctx.moveTo(-6, -12);
          ctx.lineTo(6, -12);
          ctx.lineTo(10, 12);
          ctx.lineTo(-10, 12);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = t.turretColor;
          ctx.fillRect(recoilX, -3.5, cs * 0.44, 7);
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1;
          ctx.strokeRect(recoilX, -3.5, cs * 0.44, 7);

          // Cúpula superior esférica
          const domeGrad = ctx.createRadialGradient(-2, -2, 1, 0, 0, cs * 0.18);
          domeGrad.addColorStop(0, '#ffffff');
          domeGrad.addColorStop(0.5, t.turretColor);
          domeGrad.addColorStop(1, '#0369a1');
          ctx.fillStyle = domeGrad;
          ctx.beginPath();
          ctx.arc(0, 0, cs * 0.18, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // Rango de nivel (Pips / Estrellas sobre la base)
        for (let l = 0; l < t.level; l++) {
          const pipAngle = (l / 4) * Math.PI * 2 - Math.PI / 2;
          const px = t.x + Math.cos(pipAngle) * (cs * 0.32);
          const py = t.y + Math.sin(pipAngle) * (cs * 0.32);
          ctx.fillStyle = t.level === 4 ? '#f59e0b' : '#38bdf8';
          ctx.beginPath();
          ctx.arc(px, py, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }

        if (t.stunnedTimer > 0) {
          if (typeof ArcadeIcons !== 'undefined' && ArcadeIcons.drawToCanvas) {
            ArcadeIcons.drawToCanvas(ctx, 'zap', t.x, t.y - cs * 0.45, 14, '#f43f5e', true);
          } else {
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath();
            ctx.arc(t.x, t.y - cs * 0.45, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 8. Enemigos con sombras esféricas Pseudo-3D
      for (const e of this.enemies) {
        if (!e.alive) continue;

        const zFloat = e.flying ? Math.sin(this.gameTime * 4 + e.id) * 3 + 8 : 0;

        // Sombra de contacto
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        const shadowScale = e.flying ? 0.7 : 1.0;
        ctx.ellipse(e.x, e.y + e.size * 0.65, e.size * shadowScale, e.size * 0.45 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cuerpo esférico del enemigo con iluminación cenital
        const renderY = e.y - zFloat;
        const bodyGrad = ctx.createRadialGradient(e.x - e.size * 0.3, renderY - e.size * 0.3, 1, e.x, renderY, e.size);
        bodyGrad.addColorStop(0, '#ffffff');
        bodyGrad.addColorStop(0.3, e.color);
        bodyGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(e.x, renderY, e.size, 0, Math.PI * 2);
        ctx.fill();

        // Borde según estado
        if (e.freezeTimer > 0) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        } else if (e.armor > 0) {
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Barra de salud
        const bw = e.size * 2.2;
        const bh = 3.5;
        const bx = e.x - bw / 2;
        const by = renderY - e.size - 7;
        const hpPct = Math.max(0, e.hp / e.maxHp);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(bx - 0.5, by - 0.5, bw + 1, bh + 1);
        ctx.fillStyle = hpPct > 0.5 ? '#10b981' : (hpPct > 0.25 ? '#f59e0b' : '#ef4444');
        ctx.fillRect(bx, by, bw * hpPct, bh);
      }

      // 9. Haces de luz continuos y Rayos Tesla
      for (const b of this.beams) {
        const alpha = Math.max(0, b.life / b.maxLife);
        ctx.strokeStyle = b.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1);
        ctx.lineTo(b.x2, b.y2);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      for (const z of this.chainZaps) {
        const alpha = Math.max(0, z.life / z.maxLife);
        ctx.strokeStyle = z.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(z.x1, z.y1);
        ctx.lineTo(z.x2, z.y2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;

      // 10. Proyectiles (Balística parabólica 3D para morteros y estelas)
      for (const p of this.projectiles) {
        if (!p.alive) continue;

        if (p.isMortar) {
          // Sombra en el suelo
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.beginPath();
          const sScale = Math.max(0.4, 1.0 - (p.heightZ / p.maxHeight) * 0.5);
          ctx.ellipse(p.groundX, p.groundY, p.radius * sScale, p.radius * 0.5 * sScale, 0, 0, Math.PI * 2);
          ctx.fill();

          // Estela de humo/fuego
          for (let s = 0; s < p.trail.length; s++) {
            const seg = p.trail[s];
            ctx.fillStyle = `rgba(249, 115, 22, ${0.4 * (1 - s / p.trail.length)})`;
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, p.radius * 0.7, 0, Math.PI * 2);
            ctx.fill();
          }

          // Proyectil en el aire
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          for (let s = 0; s < p.trail.length; s++) {
            const seg = p.trail[s];
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 0.35 * (1 - s / p.trail.length);
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, p.radius * 0.65, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1.0;

          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 11. Partículas
      for (const pt of this.particles) {
        const alpha = Math.max(0, pt.life / pt.maxLife);
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // 12. Números flotantes de daño con sombra y tipografía de alto contraste
      for (const d of this.damageNumbers) {
        const alpha = Math.max(0, d.life / d.maxLife);
        ctx.font = d.isCrit ? '900 13px system-ui, monospace' : '800 11px system-ui, monospace';
        ctx.textAlign = 'center';
        ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.85})`;
        ctx.lineWidth = 2.5;
        const textStr = d.isCrit ? `CRIT -${d.amount}` : (typeof d.amount === 'number' ? `-${d.amount}` : `${d.amount}`);
        ctx.strokeText(textStr, d.x, d.y);
        ctx.fillStyle = d.color.startsWith('#')
          ? `${d.color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`
          : d.color;
        ctx.fillText(textStr, d.x, d.y);
      }

      // Destello de daño en pantalla
      if (this.flashTimer > 0) {
        ctx.fillStyle = this.flashColor;
        ctx.fillRect(0, 0, this.width, this.height);
      }

      ctx.restore();
    }
  }

  BastionGame.CONFIG = CONFIG;

  // ============================================================================
  // CONTROLADOR EN NAVEGADOR
  // ============================================================================
  if (!isNode) {
    let activeGame = null;
    let lastTime = 0;
    let isGameOverModalShown = false;
    let isVictoryModalShown = false;

    // Elementos DOM
    let canvas, boardWrapper;
    let hudLives, hudGold, hudShards, hudWave, btnSpeed, speedLabel, hudRelics;
    let btnBuildBalistico, btnBuildMortero, btnBuildRayo, btnBuildCrio, btnBuildObelisco, btnBuildSniper;
    let btnCancelBuild, btnStartWave;
    let towerInspector, inspectorName, inspectorStats, priorityLabel, btnTogglePriority, btnSellTower, btnCloseInspector;
    let btnUpgradeTower, btnBranchA, btnBranchB, upgradeActionsContainer;
    let startModal, pauseModal, gameoverModal, victoryModal, mapsModal, modalMeta, modalRelics;
    let resWave, resScore, resKills, resShards;
    let btnStartGame, btnPause, btnSound, btnResume, btnRestart, btnGameoverRestart, btnOpenMaps, btnOpenMeta, btnCloseMeta;

    const PRIORITY_LABELS = {
      first: 'Primero',
      last: 'Último',
      strongest: 'Más Fuerte',
      weakest: 'Más Débil',
      closest: 'Más Cercano'
    };
    const PRIORITIES = ['first', 'last', 'strongest', 'weakest', 'closest'];

    function handleResize() {
      if (!canvas || !boardWrapper) return;
      const gameW = activeGame ? activeGame.width : 720;
      const gameH = activeGame ? activeGame.height : 468;
      const cols = activeGame ? activeGame.cols : 20;
      const rows = activeGame ? activeGame.rows : 13;
      const fitResult = window.ArcadeCanvas ? window.ArcadeCanvas.fit(canvas, boardWrapper, cols, rows, 8) : { width: gameW, height: gameH };
      const dpr = window.devicePixelRatio || 1;
      const targetW = fitResult.width || gameW;
      const targetH = fitResult.height || gameH;

      canvas.width = Math.round(gameW * dpr);
      canvas.height = Math.round(gameH * dpr);
      canvas.style.width = `${targetW}px`;
      canvas.style.height = `${targetH}px`;

      const ctx = canvas.getContext('2d');
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    }

    function getGameCoords(e) {
      if (!canvas) return { x: 0, y: 0, c: 0, r: 0 };
      const gameW = activeGame ? activeGame.width : 720;
      const gameH = activeGame ? activeGame.height : 468;
      const cellSize = activeGame ? activeGame.cellSize : 36;
      const rect = canvas.getBoundingClientRect();
      const scaleX = gameW / (rect.width || gameW);
      const scaleY = gameH / (rect.height || gameH);

      const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;

      let x = (clientX - rect.left) * scaleX;
      let y = (clientY - rect.top) * scaleY;

      // Invertir transformación de cámara móvil (zoom y paneo)
      if (activeGame && activeGame.cameraZoom && activeGame.cameraZoom !== 1.0) {
        const cx = gameW / 2;
        const cy = gameH / 2;
        x = cx - activeGame.cameraPanX + (x - cx) / activeGame.cameraZoom;
        y = cy - activeGame.cameraPanY + (y - cy) / activeGame.cameraZoom;
      } else if (activeGame && (activeGame.cameraPanX || activeGame.cameraPanY)) {
        x -= activeGame.cameraPanX;
        y -= activeGame.cameraPanY;
      }

      const c = Math.floor(x / cellSize);
      const r = Math.floor(y / cellSize);
      return { x, y, c, r };
    }

    function updateInspector() {
      if (!towerInspector) return;
      const st = activeGame?.selectedPlacedTower;
      if (!st) {
        towerInspector.classList.add('hidden');
        return;
      }

      towerInspector.classList.remove('hidden');
      if (inspectorName) inspectorName.textContent = st.name;
      if (inspectorStats) {
        const dmgText = st.damage > 0 ? `Daño: ${Math.round(st.damage * st.effDmgMult)}` : 'Apoyo';
        const rateText = st.fireRate > 0 ? `Cadencia: ${(1 / (st.fireRate * st.effRateMult)).toFixed(1)}s` : 'Aura';
        inspectorStats.textContent = `${dmgText} | ${rateText} | Alcance: ${st.rangeCells}c`;
      }
      if (priorityLabel) priorityLabel.textContent = PRIORITY_LABELS[st.targetPriority] || 'Primero';

      // Acciones de mejora y ramas
      if (btnUpgradeTower) {
        const def = TORRES[st.typeId];
        if (st.level < 3) {
          const nextLevelData = def?.levels?.[st.level];
          const discount = activeGame.meta ? activeGame.meta.getTowerCostDiscount() : 0;
          const cost = Math.round((nextLevelData?.upgradeCost || 100) * (1.0 - discount));
          btnUpgradeTower.classList.remove('hidden');
          btnUpgradeTower.textContent = `Mejorar nivel ${st.level + 1} (${cost} oro)`;
          btnUpgradeTower.disabled = activeGame.gold < cost;
          if (btnBranchA) btnBranchA.classList.add('hidden');
          if (btnBranchB) btnBranchB.classList.add('hidden');
        } else if (st.level === 3) {
          btnUpgradeTower.classList.add('hidden');
          const branchA = def?.branches?.a;
          const branchB = def?.branches?.b;
          const discount = activeGame.meta ? activeGame.meta.getTowerCostDiscount() : 0;
          if (btnBranchA && branchA) {
            btnBranchA.classList.remove('hidden');
            const costA = Math.round((branchA.branchCost || 200) * (1.0 - discount));
            btnBranchA.textContent = `${branchA.name} (${costA} oro)`;
            btnBranchA.disabled = activeGame.gold < costA;
          }
          if (btnBranchB && branchB) {
            btnBranchB.classList.remove('hidden');
            const costB = Math.round((branchB.branchCost || 200) * (1.0 - discount));
            btnBranchB.textContent = `${branchB.name} (${costB} oro)`;
            btnBranchB.disabled = activeGame.gold < costB;
          }
        } else {
          // Ya en nivel 4
          btnUpgradeTower.classList.remove('hidden');
          btnUpgradeTower.textContent = 'Nivel máximo alcanzado';
          btnUpgradeTower.disabled = true;
          if (btnBranchA) btnBranchA.classList.add('hidden');
          if (btnBranchB) btnBranchB.classList.add('hidden');
        }
      }

      if (btnSellTower) {
        const refundRate = activeGame.meta ? activeGame.meta.getSellRefundRate() : 0.70;
        const refund = Math.floor(st.investedGold * refundRate);
        btnSellTower.textContent = `Vender (${refund} oro)`;
      }
    }

    function updateHUD() {
      if (!activeGame) return;
      if (hudLives) hudLives.textContent = Math.max(0, activeGame.lives);
      if (hudGold) hudGold.textContent = activeGame.gold;
      if (hudShards) hudShards.textContent = (activeGame.meta ? activeGame.meta.shards : 0);
      if (hudWave) hudWave.textContent = activeGame.isEndless ? `OLEADA ${activeGame.currentWave} (SIN FIN)` : `OLEADA ${activeGame.currentWave}/${activeGame.maxWaves}`;

      // Botón de Inicio / Adelanto de Oleada (Fase 4 & 5)
      if (btnStartWave) {
        if (!activeGame.waveActive) {
          btnStartWave.disabled = activeGame.gameOver || activeGame.victory;
          btnStartWave.textContent = 'INICIAR ASALTO';
          btnStartWave.classList.remove('early-call');
        } else {
          const canEarly = (activeGame.isEndless || activeGame.currentWave < activeGame.maxWaves) && !activeGame.gameOver && !activeGame.victory;
          btnStartWave.disabled = !canEarly;
          if (canEarly) {
            const bonus = 20 + Math.floor(activeGame.currentWave * 4);
            btnStartWave.textContent = `ADELANTAR (+${bonus} oro)`;
            btnStartWave.classList.add('early-call');
          } else {
            btnStartWave.textContent = 'ASALTO FINAL';
            btnStartWave.classList.remove('early-call');
          }
        }
      }

      // Radar Táctico: resumen compositivo de próxima oleada (Fase 4)
      const hudWaveIntel = document.getElementById('hud-wave-intel');
      const intelSummary = document.getElementById('intel-summary');
      if (hudWaveIntel) {
        const nextW = activeGame.waveActive ? activeGame.currentWave + 1 : (activeGame.currentWave === 0 ? 1 : activeGame.currentWave);
        const intel = activeGame.getNextWaveIntel(nextW);
        if (intel) {
          const typeNames = {
            reptante: 'Reptante',
            veloz: 'Veloz',
            blindado: 'Blindado',
            etero: 'Etéreo',
            regenerador: 'Regenerador',
            divisor: 'Divisor',
            jefe_coloso: 'Jefe'
          };
          const countsStr = Object.entries(intel.counts)
            .map(([t, cnt]) => `${typeNames[t] || t}: ${cnt}`)
            .join(', ');
          const label = intel.hasBoss ? `Jefe W${intel.waveNum}` : `W${intel.waveNum}`;
          if (intelSummary) {
            intelSummary.textContent = label;
          } else {
            const iconSvg = typeof ArcadeIcons !== 'undefined' ? ArcadeIcons.get('radar') : '';
            hudWaveIntel.innerHTML = `<span class="stat-icon">${iconSvg}</span><span class="stat-val" id="intel-summary">${label}</span>`;
          }
          hudWaveIntel.title = `Radar táctico - Oleada ${intel.waveNum}: ${countsStr} (Toca para ver detalles)`;
        } else {
          if (intelSummary) {
            intelSummary.textContent = 'Fin';
          } else {
            const iconSvg = typeof ArcadeIcons !== 'undefined' ? ArcadeIcons.get('radar') : '';
            hudWaveIntel.innerHTML = `<span class="stat-icon">${iconSvg}</span><span class="stat-val" id="intel-summary">Fin</span>`;
          }
          hudWaveIntel.title = 'Todas las oleadas completadas';
        }
      }

      // Enfriamientos de Habilidades del Comandante (Fase 4)
      const cdOrbital = document.getElementById('cd-orbital');
      const btnOrbital = document.getElementById('btn-skill-orbital');
      if (btnOrbital && cdOrbital) {
        const cd = activeGame.skillsCooldowns?.orbital_strike || 0;
        const maxCd = activeGame.skillsMaxCooldowns?.orbital_strike || 40;
        const pct = Math.min(1, Math.max(0, cd / maxCd));
        cdOrbital.style.height = `${pct * 100}%`;
        btnOrbital.disabled = cd > 0 || activeGame.gameOver || activeGame.victory;
        btnOrbital.classList.toggle('ready', cd <= 0);
        btnOrbital.classList.toggle('active-targeting', activeGame.activeTargetSkill === 'orbital_strike');
      }

      const cdFreeze = document.getElementById('cd-freeze');
      const btnFreeze = document.getElementById('btn-skill-freeze');
      if (btnFreeze && cdFreeze) {
        const cd = activeGame.skillsCooldowns?.time_freeze || 0;
        const maxCd = activeGame.skillsMaxCooldowns?.time_freeze || 55;
        const pct = Math.min(1, Math.max(0, cd / maxCd));
        cdFreeze.style.height = `${pct * 100}%`;
        btnFreeze.disabled = cd > 0 || activeGame.gameOver || activeGame.victory;
        btnFreeze.classList.toggle('ready', cd <= 0);
      }

      const cdSurge = document.getElementById('cd-surge');
      const btnSurge = document.getElementById('btn-skill-surge');
      if (btnSurge && cdSurge) {
        const cd = activeGame.skillsCooldowns?.gold_surge || 0;
        const maxCd = activeGame.skillsMaxCooldowns?.gold_surge || 45;
        const pct = Math.min(1, Math.max(0, cd / maxCd));
        cdSurge.style.height = `${pct * 100}%`;
        btnSurge.disabled = cd > 0 || activeGame.gameOver || activeGame.victory;
        btnSurge.classList.toggle('ready', cd <= 0);
      }

      const targetingBanner = document.getElementById('targeting-banner');
      if (targetingBanner) {
        targetingBanner.classList.toggle('hidden', !activeGame.activeTargetSkill);
      }

      // Render de reliquias activas
      if (hudRelics) {
        hudRelics.innerHTML = '';
        for (const rId of activeGame.activeRelics) {
          const rDef = RELIQUIAS[rId];
          if (!rDef) continue;
          const chip = document.createElement('div');
          chip.className = 'relic-chip';
          chip.textContent = rDef.icon;
          chip.title = `${rDef.name} (${rDef.rarity}): ${rDef.desc}`;
          hudRelics.appendChild(chip);
        }
      }
    }

    // Modal de Templo del Nexo (Metaprogreso)
    function renderMetaModal() {
      const meta = activeGame?.meta || window.BastionMeta;
      if (!meta) return;

      const shardsEl = document.getElementById('meta-shards-count');
      if (shardsEl) shardsEl.textContent = meta.shards;

      const container = document.getElementById('meta-upgrades-container');
      if (!container) return;
      container.innerHTML = '';

      for (const [key, def] of Object.entries(MEJORAS_METAPROGRESO)) {
        const curLvl = meta.getUpgradeLevel(key);
        const isMax = curLvl >= def.maxLevel;
        const nextCost = isMax ? 0 : def.costs[curLvl];
        const canBuy = meta.canUpgrade(key);

        const card = document.createElement('div');
        card.className = 'meta-card';

        let pipsHtml = '';
        for (let p = 0; p < def.maxLevel; p++) {
          pipsHtml += `<div class="meta-pip ${p < curLvl ? 'filled' : ''}"></div>`;
        }

        const iconSvg = typeof ArcadeIcons !== 'undefined' ? ArcadeIcons.get(def.icon) : '';
        card.innerHTML = `
          <div class="meta-card-header">
            <span class="meta-card-title">${iconSvg} ${def.name}</span>
            <span class="meta-card-rank">Rango ${curLvl}/${def.maxLevel}</span>
          </div>
          <div class="meta-card-desc">${def.desc}</div>
          <div class="meta-pips-row">${pipsHtml}</div>
          <button class="meta-buy-btn" data-key="${key}" ${(!canBuy || isMax) ? 'disabled' : ''}>
            ${isMax ? 'RANGO MÁXIMO' : `Mejorar (${nextCost} esquirlas)`}
          </button>
        `;

        const buyBtn = card.querySelector('.meta-buy-btn');
        if (buyBtn && !isMax) {
          buyBtn.addEventListener('click', () => {
            if (meta.buyUpgrade(key)) {
              activeGame?.playSound('upgrade');
              renderMetaModal();
              updateHUD();
            }
          });
        }
        container.appendChild(card);
      }
    }

    // Modal de Elección de Reliquia Roguelike (Hitos oleadas 5 y 15)
    window.showRelicMilestoneModal = function() {
      if (!activeGame) return;
      const modal = document.getElementById('modal-relics');
      const container = document.getElementById('relics-pick-container');
      if (!modal || !container) return;

      // Filtrar reliquias aún no equipadas
      const unowned = Object.keys(RELIQUIAS).filter(id => !activeGame.hasRelic(id));
      if (unowned.length === 0) return;

      // Escoger 3 aleatorias
      const shuffled = unowned.sort(() => 0.5 - Math.random()).slice(0, 3);
      container.innerHTML = '';

      for (const rId of shuffled) {
        const def = RELIQUIAS[rId];
        const card = document.createElement('div');
        card.className = 'relic-pick-card';
        const relicIconSvg = typeof ArcadeIcons !== 'undefined' ? ArcadeIcons.get(def.icon) : '';
        card.innerHTML = `
          <div class="relic-pick-icon">${relicIconSvg}</div>
          <strong class="relic-pick-title">${def.name}</strong>
          <span class="relic-pick-rarity">${def.rarity}</span>
          <p class="relic-pick-desc">${def.desc}</p>
        `;
        card.addEventListener('click', () => {
          activeGame.equipRelic(rId);
          activeGame.playSound('upgrade');
          modal.classList.add('hidden');
          updateHUD();
        });
        container.appendChild(card);
      }

      modal.classList.remove('hidden');
    };

    function showVictory() {
      if (victoryModal) {
        victoryModal.classList.remove('hidden');
        updateMapsModalUI();

        // Cálculo de estrellas
        const starsEl = document.getElementById('vic-stars');
        if (starsEl) {
          const l = activeGame.lives;
          const count = l >= activeGame.initialLives ? 3 : (l >= Math.ceil(activeGame.initialLives * 0.5) ? 2 : 1);
          let starHtml = '';
          if (typeof ArcadeIcons !== 'undefined' && ArcadeIcons.get) {
            for (let i = 0; i < 3; i++) {
              starHtml += i < count ? ArcadeIcons.get('star') : ArcadeIcons.get('starOutline');
            }
          } else {
            starHtml = `${count} de 3 estrellas`;
          }
          starsEl.innerHTML = starHtml;
        }

        // Estadísticas detalladas
        const dmgEl = document.getElementById('vic-stat-damage');
        if (dmgEl) dmgEl.textContent = Math.round(activeGame.stats.totalDamage).toLocaleString();

        const killsEl = document.getElementById('vic-stat-kills');
        if (killsEl) killsEl.textContent = activeGame.stats.kills;

        const goldEl = document.getElementById('vic-stat-gold');
        if (goldEl) goldEl.textContent = activeGame.stats.goldEarned;

        const shardsEl = document.getElementById('vic-stat-shards');
        if (shardsEl) shardsEl.textContent = `+${activeGame.stats.shardsEarned} esquirlas`;

        // MVP Tower
        const mvpEl = document.getElementById('vic-stat-mvp');
        if (mvpEl) {
          let bestTowerId = null;
          let bestDmg = 0;
          for (const [tId, dmg] of Object.entries(activeGame.stats.towerDamage)) {
            if (dmg > bestDmg) {
              bestDmg = dmg;
              bestTowerId = tId;
            }
          }
          const mvpTower = activeGame.towers.find(t => t.id === Number(bestTowerId));
          mvpEl.textContent = mvpTower ? `${mvpTower.name} (${Math.round(bestDmg)} daño)` : 'Defensa Global';
        }
      }
    }

    function showGameOver() {
      if (gameoverModal) {
        gameoverModal.classList.remove('hidden');
        if (resWave) resWave.textContent = activeGame?.isEndless
          ? `OLEADA ${activeGame.currentWave} (RÉCORD: ${activeGame.endlessRecord?.bestWave || activeGame.currentWave})`
          : `OLEADA ${activeGame.currentWave}/${activeGame.maxWaves}`;
        if (resScore) resScore.textContent = `${activeGame.score} PTS`;
        const killsEl = document.getElementById('res-kills');
        if (killsEl) killsEl.textContent = activeGame.stats.kills;
        const shardsEl = document.getElementById('res-shards');
        if (shardsEl) shardsEl.textContent = `+${activeGame.stats.shardsEarned} esquirlas`;
      }
    }

    function updateMapsModalUI() {
      const cards = document.querySelectorAll('.map-card-select');
      const campaign = activeGame?.campaign || window.BastionCampaign;
      const curMode = window.selectedGameMode || 'campaign';

      // Actualizar pestañas de modo (Campaña vs Modo Sin Fin)
      const btnModeCamp = document.getElementById('btn-mode-campaign');
      const btnModeEndless = document.getElementById('btn-mode-endless');
      if (btnModeCamp) btnModeCamp.classList.toggle('active', curMode === 'campaign');
      if (btnModeEndless) btnModeEndless.classList.toggle('active', curMode === 'endless');

      // Banner de récord en Modo Sin Fin
      const endlessBanner = document.getElementById('endless-record-banner');
      const endlessBestWave = document.getElementById('endless-best-wave');
      const endlessBestScore = document.getElementById('endless-best-score');
      if (endlessBanner) {
        if (curMode === 'endless') {
          endlessBanner.classList.remove('hidden');
          const rec = (activeGame ? activeGame.loadEndlessRecord() : null) || { bestWave: 0, bestScore: 0 };
          if (endlessBestWave) endlessBestWave.textContent = rec.bestWave || 0;
          if (endlessBestScore) endlessBestScore.textContent = rec.bestScore || 0;
        } else {
          endlessBanner.classList.add('hidden');
        }
      }

      if (!cards.length || !campaign) return;

      cards.forEach((card, idx) => {
        const isUnlocked = curMode === 'endless' ? true : campaign.isMapUnlocked(idx);
        card.classList.toggle('locked', !isUnlocked);

        let starsEl = card.querySelector('.map-card-stars');
        if (!starsEl) {
          starsEl = document.createElement('div');
          starsEl.className = 'map-card-stars';
          card.appendChild(starsEl);
        }

        if (!isUnlocked) {
          const lockSvg = typeof ArcadeIcons !== 'undefined' ? ArcadeIcons.get('lock') : '';
          starsEl.innerHTML = `<span class="map-lock-badge">${lockSvg} Bloqueado</span>`;
        } else {
          if (curMode === 'endless') {
            const infSvg = typeof ArcadeIcons !== 'undefined' ? ArcadeIcons.get('infinity') : '';
            starsEl.innerHTML = `<span style="color:#38bdf8; font-weight:bold; display:inline-flex; align-items:center; gap:4px;">${infSvg} Modo Sin Fin</span>`;
          } else {
            const stars = campaign.getStars(idx);
            let starHtml = '';
            if (typeof ArcadeIcons !== 'undefined' && ArcadeIcons.get) {
              for (let i = 0; i < 3; i++) {
                starHtml += i < stars ? ArcadeIcons.get('star') : ArcadeIcons.get('starOutline');
              }
            } else {
              starHtml = `${stars} de 3 estrellas`;
            }
            const bestScore = campaign.getBestScore(idx);
            starsEl.innerHTML = `<span style="color:#f59e0b; display:inline-flex; align-items:center; gap:2px;">${starHtml}</span> ${bestScore > 0 ? `<small style="color:#94a3b8; font-size:10px; margin-left:6px;">Récord: ${bestScore}</small>` : ''}`;
          }
        }
      });
    }

    window.selectMap = function(mapIdx) {
      if (!activeGame) return;
      const campaign = activeGame.campaign || window.BastionCampaign;
      const isEndless = (window.selectedGameMode === 'endless');
      if (!isEndless && campaign && !campaign.isMapUnlocked(mapIdx)) {
        activeGame.playSound('boss_alert');
        return;
      }
      activeGame.isEndless = isEndless;
      activeGame.maxWaves = isEndless ? Infinity : 20;
      activeGame.difficulty = window.selectedDifficulty || 'normal';
      activeGame.mutators = window.selectedMutators ? [...window.selectedMutators] : [];
      activeGame.loadMap(mapIdx);
      activeGame.gold = activeGame.initialGold;
      activeGame.lives = activeGame.initialLives;
      activeGame.score = 0;
      activeGame.currentWave = 0;
      activeGame.waveActive = false;
      activeGame.gameOver = false;
      activeGame.victory = false;
      activeGame.cameraZoom = 1.0;
      activeGame.cameraPanX = 0;
      activeGame.cameraPanY = 0;
      handleResize();
      if (mapsModal) mapsModal.classList.add('hidden');
      updateHUD();
      updateInspector();
      updateMapsModalUI();
    };

    function showPlacementPill(towerType) {
      const pill = document.getElementById('placement-confirm-pill');
      const nameEl = document.getElementById('placement-tower-name');
      const def = TORRES[towerType];
      if (pill && def) {
        if (nameEl) nameEl.textContent = `${def.name} (${def.cost} oro)`;
        pill.classList.remove('hidden');
      }
    }

    function hidePlacementPill() {
      const pill = document.getElementById('placement-confirm-pill');
      if (pill) pill.classList.add('hidden');
    }

    let zoomHideTimer = null;
    function resetZoomAutoHide() {
      const zoomCtrl = document.getElementById('touch-zoom-controls');
      if (!zoomCtrl) return;
      zoomCtrl.style.opacity = '1';
      zoomCtrl.style.pointerEvents = 'auto';
      if (zoomHideTimer) clearTimeout(zoomHideTimer);
      zoomHideTimer = setTimeout(() => {
        if (activeGame && activeGame.cameraZoom <= 1.0) {
          zoomCtrl.style.opacity = '0.35';
        }
      }, 3500);
    }

    function renderIntelModal() {
      const titleEl = document.getElementById('intel-modal-title');
      const subtitleEl = document.getElementById('intel-modal-subtitle');
      const listEl = document.getElementById('intel-enemies-list');
      if (!listEl || !activeGame) return;

      const nextW = activeGame.waveActive ? activeGame.currentWave + 1 : (activeGame.currentWave === 0 ? 1 : activeGame.currentWave);
      const intel = activeGame.getNextWaveIntel(nextW);

      if (titleEl) titleEl.textContent = `RADAR TÁCTICO: OLEADA ${nextW}`;

      if (!intel) {
        if (subtitleEl) subtitleEl.textContent = 'No hay más oleadas registradas en el sector.';
        listEl.innerHTML = '<p style="color:#94a3b8; text-align:center; padding:12px;">Todas las oleadas del sector han concluido.</p>';
        return;
      }

      if (subtitleEl) {
        subtitleEl.textContent = intel.hasBoss
          ? 'Alerta: aproximación de unidad comandante'
          : `Composición prevista para el asalto ${nextW}:`;
      }

      const enemyDefs = typeof ENEMIGOS !== 'undefined' ? ENEMIGOS : {};
      const typeIcons = {
        reptante: 'radar',
        veloz: 'speed',
        blindado: 'shield',
        etero: 'spark',
        regenerador: 'heart',
        divisor: 'recycle',
        jefe_coloso: 'skull'
      };

      listEl.innerHTML = Object.entries(intel.counts).map(([typeId, count]) => {
        const def = enemyDefs[typeId] || {};
        const iconKey = typeIcons[typeId] || 'target';
        const iconSvg = typeof ArcadeIcons !== 'undefined' ? ArcadeIcons.get(iconKey) : '';
        const name = def.name || typeId;
        const desc = def.desc || (def.isBoss ? 'Jefe colosal con resistencia pesada' : 'Invasor del cataclismo');
        return `
          <div class="intel-enemy-row ${def.isBoss ? 'is-boss' : ''}">
            <div class="intel-enemy-icon">${iconSvg}</div>
            <div class="intel-enemy-meta">
              <strong class="intel-enemy-name">${name} <span class="intel-enemy-qty">x${count}</span></strong>
              <small class="intel-enemy-desc">${desc}</small>
            </div>
          </div>
        `;
      }).join('');
    }

    function selectBuildType(typeId) {
      if (activeGame) {
        activeGame.selectedBuildType = typeId;
        activeGame.pendingBuildCell = null;
        activeGame.selectedPlacedTower = null;
      }
      hidePlacementPill();
      updateInspector();
      document.querySelectorAll('.tower-build-btn').forEach(b => {
        b.classList.toggle('active', (b.dataset.tower || b.dataset.type) === typeId);
      });
      if (btnCancelBuild) btnCancelBuild.classList.remove('hidden');
    }

    function cancelBuild() {
      if (activeGame) {
        activeGame.selectedBuildType = null;
        activeGame.pendingBuildCell = null;
      }
      hidePlacementPill();
      document.querySelectorAll('.tower-build-btn').forEach(b => b.classList.remove('active'));
      if (btnCancelBuild) btnCancelBuild.classList.add('hidden');
    }

    function togglePause() {
      if (!activeGame) return;
      activeGame.isPaused = !activeGame.isPaused;
      if (activeGame.isPaused) {
        activeGame.resetShake();
      }
      if (pauseModal) {
        pauseModal.classList.toggle('hidden', !activeGame.isPaused);
      }
    }

    function setupEvents() {
      window.addEventListener('resize', handleResize);

      // Pestañas de Dificultad en Modal de Mapas
      document.querySelectorAll('.diff-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
          document.querySelectorAll('.diff-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          window.selectedDifficulty = tab.dataset.diff || 'normal';
        });
      });

      // Mutadores
      const mutArmored = document.getElementById('mut-armored');
      const mutSpeedy = document.getElementById('mut-speedy');
      const mutFrugal = document.getElementById('mut-frugal');
      const mutSwarm = document.getElementById('mut-swarm');

      function updateMutators() {
        const muts = [];
        if (mutArmored?.checked) muts.push('armored');
        if (mutSpeedy?.checked) muts.push('speedy');
        if (mutFrugal?.checked) muts.push('frugal');
        if (mutSwarm?.checked) muts.push('swarm');
        window.selectedMutators = muts;
      }
      mutArmored?.addEventListener('change', updateMutators);
      mutSpeedy?.addEventListener('change', updateMutators);
      mutFrugal?.addEventListener('change', updateMutators);
      mutSwarm?.addEventListener('change', updateMutators);

      // Botón Templo del Nexo (Metaprogreso)
      btnOpenMeta = document.getElementById('btn-open-meta');
      modalMeta = document.getElementById('modal-meta');
      btnCloseMeta = document.getElementById('btn-close-meta');
      modalRelics = document.getElementById('modal-relics');
      victoryModal = document.getElementById('victory-modal');

      if (btnOpenMeta && modalMeta) {
        btnOpenMeta.addEventListener('click', () => {
          renderMetaModal();
          modalMeta.classList.remove('hidden');
        });
      }
      if (btnCloseMeta && modalMeta) {
        btnCloseMeta.addEventListener('click', () => {
          modalMeta.classList.add('hidden');
        });
      }
      const btnPauseMeta = document.getElementById('btn-pause-open-meta');
      if (btnPauseMeta && modalMeta) {
        btnPauseMeta.addEventListener('click', () => {
          pauseModal?.classList.add('hidden');
          renderMetaModal();
          modalMeta.classList.remove('hidden');
        });
      }
      const btnVicMeta = document.getElementById('btn-victory-meta');
      if (btnVicMeta && modalMeta) {
        btnVicMeta.addEventListener('click', () => {
          victoryModal?.classList.add('hidden');
          renderMetaModal();
          modalMeta.classList.remove('hidden');
        });
      }
      const btnGOMeta = document.getElementById('btn-gameover-meta');
      if (btnGOMeta && modalMeta) {
        btnGOMeta.addEventListener('click', () => {
          gameoverModal?.classList.add('hidden');
          renderMetaModal();
          modalMeta.classList.remove('hidden');
        });
      }

      // Botones de construcción de las 6 torres
      const mapBtnType = [
        { btn: btnBuildBalistico, type: 'balistico' },
        { btn: btnBuildMortero, type: 'mortero' },
        { btn: btnBuildRayo, type: 'rayo' },
        { btn: btnBuildCrio, type: 'crio' },
        { btn: btnBuildObelisco, type: 'obelisco' },
        { btn: btnBuildSniper, type: 'francotirador' }
      ];
      mapBtnType.forEach(({ btn, type }) => {
        if (btn) btn.addEventListener('click', () => selectBuildType(type));
      });

      if (btnCancelBuild) btnCancelBuild.addEventListener('click', cancelBuild);

      if (btnStartWave) {
        btnStartWave.addEventListener('click', () => {
          if (!activeGame) return;
          if (activeGame.victory) {
            activeGame.continueToEndless();
            activeGame.startWave();
          } else if (!activeGame.waveActive) {
            activeGame.startWave();
          } else {
            activeGame.callNextWaveEarly();
          }
          updateHUD();
        });
      }

      if (btnSpeed) {
        btnSpeed.addEventListener('click', () => {
          if (!activeGame) return;
          if (activeGame.gameSpeed === 1) activeGame.gameSpeed = 2;
          else if (activeGame.gameSpeed === 2) activeGame.gameSpeed = 3;
          else activeGame.gameSpeed = 1;
          if (speedLabel) speedLabel.textContent = `${activeGame.gameSpeed}x`;
        });
      }

      // Habilidades del Comandante (Fase 4)
      const btnOrbital = document.getElementById('btn-skill-orbital');
      if (btnOrbital) {
        btnOrbital.addEventListener('click', () => {
          if (!activeGame || !activeGame.canUseSkill('orbital_strike')) return;
          if (activeGame.activeTargetSkill === 'orbital_strike') {
            activeGame.cancelTargetSkill();
          } else {
            activeGame.useSkill('orbital_strike');
          }
          updateHUD();
        });
      }

      const btnFreeze = document.getElementById('btn-skill-freeze');
      if (btnFreeze) {
        btnFreeze.addEventListener('click', () => {
          if (!activeGame || !activeGame.canUseSkill('time_freeze')) return;
          activeGame.useSkill('time_freeze');
          updateHUD();
        });
      }

      const btnSurge = document.getElementById('btn-skill-surge');
      if (btnSurge) {
        btnSurge.addEventListener('click', () => {
          if (!activeGame || !activeGame.canUseSkill('gold_surge')) return;
          activeGame.useSkill('gold_surge');
          updateHUD();
        });
      }

      const btnCancelTarget = document.getElementById('btn-cancel-target');
      if (btnCancelTarget) {
        btnCancelTarget.addEventListener('click', () => {
          if (activeGame) activeGame.cancelTargetSkill();
          updateHUD();
        });
      }

      // Controles de Cámara y Zoom Táctil Móvil (Fase 5) con auto-hide
      const btnZoomIn = document.getElementById('btn-zoom-in');
      const btnZoomReset = document.getElementById('btn-zoom-reset');
      const btnZoomOut = document.getElementById('btn-zoom-out');

      if (btnZoomIn) {
        btnZoomIn.addEventListener('click', () => {
          if (!activeGame) return;
          activeGame.cameraZoom = Math.min(2.5, activeGame.cameraZoom + 0.25);
          activeGame.clampCamera();
          resetZoomAutoHide();
        });
      }
      if (btnZoomReset) {
        btnZoomReset.addEventListener('click', () => {
          if (!activeGame) return;
          activeGame.cameraZoom = 1.0;
          activeGame.cameraPanX = 0;
          activeGame.cameraPanY = 0;
          resetZoomAutoHide();
        });
      }
      if (btnZoomOut) {
        btnZoomOut.addEventListener('click', () => {
          if (!activeGame) return;
          activeGame.cameraZoom = Math.max(1.0, activeGame.cameraZoom - 0.25);
          activeGame.clampCamera();
          resetZoomAutoHide();
        });
      }

      // Zoom con rueda de ratón en escritorio
      canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (!activeGame) return;
        const delta = e.deltaY < 0 ? 0.2 : -0.2;
        activeGame.cameraZoom = Math.max(1.0, Math.min(2.5, activeGame.cameraZoom + delta));
        if (activeGame.cameraZoom <= 1.0) {
          activeGame.cameraPanX = 0;
          activeGame.cameraPanY = 0;
        }
        activeGame.clampCamera();
        resetZoomAutoHide();
      }, { passive: false });

      // Gestos táctiles nativos en móvil: Arrastre con 1 dedo, Pellizco con 2 dedos y Doble Toque para resetear
      let isTouchDragging = false;
      let touchStartX = 0;
      let touchStartY = 0;
      let initialPinchDistance = 0;
      let initialZoom = 1.0;
      let hasMovedSignificant = false;
      let lastTapTime = 0;
      let lastTapX = 0;
      let lastTapY = 0;

      canvas.addEventListener('touchstart', (e) => {
        resetZoomAutoHide();
        if (e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          initialPinchDistance = Math.hypot(dx, dy);
          initialZoom = activeGame ? activeGame.cameraZoom : 1.0;
          isTouchDragging = false;
          hasMovedSignificant = true;
        } else if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
          isTouchDragging = true;
          hasMovedSignificant = false;
        }
      }, { passive: true });

      canvas.addEventListener('touchmove', (e) => {
        if (!activeGame) return;
        resetZoomAutoHide();
        if (e.touches.length === 2 && initialPinchDistance > 0) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const currentDist = Math.hypot(dx, dy);
          const scaleFactor = currentDist / initialPinchDistance;
          activeGame.cameraZoom = Math.max(1.0, Math.min(2.5, initialZoom * scaleFactor));
          activeGame.clampCamera();
          hasMovedSignificant = true;
        } else if (e.touches.length === 1 && isTouchDragging && activeGame.cameraZoom > 1.0) {
          const curX = e.touches[0].clientX;
          const curY = e.touches[0].clientY;
          const deltaX = curX - touchStartX;
          const deltaY = curY - touchStartY;
          if (Math.hypot(deltaX, deltaY) > 6) {
            hasMovedSignificant = true;
            activeGame.cameraPanX -= deltaX / activeGame.cameraZoom;
            activeGame.cameraPanY -= deltaY / activeGame.cameraZoom;
            activeGame.clampCamera();
            touchStartX = curX;
            touchStartY = curY;
          }
        }
      }, { passive: true });

      canvas.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) {
          initialPinchDistance = 0;
        }
        if (e.touches.length === 0) {
          isTouchDragging = false;
          // Doble toque rápido para restablecer la vista completa del mapa
          const now = Date.now();
          const dtTap = now - lastTapTime;
          const touch = e.changedTouches && e.changedTouches[0];
          if (touch) {
            const dist = Math.hypot(touch.clientX - lastTapX, touch.clientY - lastTapY);
            if (dtTap > 40 && dtTap < 320 && dist < 25) {
              if (activeGame && (activeGame.cameraZoom > 1.0 || activeGame.cameraPanX !== 0 || activeGame.cameraPanY !== 0)) {
                activeGame.cameraZoom = 1.0;
                activeGame.cameraPanX = 0;
                activeGame.cameraPanY = 0;
                resetZoomAutoHide();
              }
              lastTapTime = 0;
              return;
            }
            lastTapTime = now;
            lastTapX = touch.clientX;
            lastTapY = touch.clientY;
          }
        }
      }, { passive: true });

      // Interacción táctil y ratón sobre el canvas (discriminando toques de arrastres de cámara)
      let pointerDownX = 0;
      let pointerDownY = 0;

      canvas.addEventListener('pointerdown', (e) => {
        pointerDownX = e.clientX;
        pointerDownY = e.clientY;
      });

      canvas.addEventListener('pointerup', (e) => {
        if (!activeGame) return;
        const dist = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
        if (dist > 8 || hasMovedSignificant) {
          hasMovedSignificant = false;
          return;
        }

        const { x, y, c, r } = getGameCoords(e);

        // 1. Si hay habilidad activa de apuntado (Bombardeo Orbital)
        if (activeGame.activeTargetSkill) {
          activeGame.useSkill(activeGame.activeTargetSkill, x, y);
          updateHUD();
          return;
        }

        // 2. Colocar torre seleccionada (soporta modo 2 pasos táctil y toque único)
        if (activeGame.selectedBuildType) {
          const isOneTap = (typeof window !== 'undefined' && window.oneTapBuild) ||
            (typeof window !== 'undefined' && window.ArcadeStorage && window.ArcadeStorage.getItem('bastion:onetap') === 'true');

          if (isOneTap) {
            const res = activeGame.placeTower(activeGame.selectedBuildType, c, r);
            if (res.success) {
              cancelBuild();
              activeGame.selectedPlacedTower = res.tower;
            }
            updateHUD();
            updateInspector();
            return;
          }

          // Modo 2 pasos ergonómico (Mobile-First)
          if (activeGame.pendingBuildCell && activeGame.pendingBuildCell.c === c && activeGame.pendingBuildCell.r === r) {
            const res = activeGame.placeTower(activeGame.selectedBuildType, c, r);
            if (res.success) {
              cancelBuild();
              activeGame.selectedPlacedTower = res.tower;
            }
            activeGame.pendingBuildCell = null;
            hidePlacementPill();
          } else {
            if (activeGame.canBuildAt(c, r)) {
              activeGame.pendingBuildCell = { c, r };
              showPlacementPill(activeGame.selectedBuildType);
            } else {
              activeGame.pendingBuildCell = null;
              hidePlacementPill();
            }
          }
          updateHUD();
          updateInspector();
          return;
        }

        // 3. Despejar escombros cuánticos (tipo 8)
        if (activeGame.mapData?.grid?.[r]?.[c] === 8) {
          if (activeGame.gold >= 40) {
            activeGame.clearDebris(c, r);
            updateHUD();
          } else {
            activeGame.addDamageNumber(x, y - 10, 'Requiere 40 de oro', '#ef4444');
            activeGame.playSound('boss_alert');
          }
          return;
        }

        // 4. Seleccionar torre colocada
        const clickedTower = activeGame.gridTowers[r]?.[c];
        activeGame.selectedPlacedTower = clickedTower || null;
        activeGame.pendingBuildCell = null;
        hidePlacementPill();
        updateInspector();

        if (clickedTower && activeGame) {
          // Si la torre está en la parte inferior, ajustar paneo para no ser tapada por el inspector
          const screenY = (clickedTower.y + activeGame.cameraPanY) * activeGame.cameraZoom;
          const halfH = activeGame.height / 2;
          if (screenY > halfH * 0.4) {
            activeGame.cameraPanY = Math.max(-halfH * 0.5, activeGame.cameraPanY - 35);
            activeGame.clampCamera();
          }
        }
      });

      canvas.addEventListener('pointermove', (e) => {
        if (!activeGame) return;
        const { c, r } = getGameCoords(e);
        activeGame.hoverCell = { c, r };
      });

      canvas.addEventListener('pointerleave', () => {
        if (activeGame) activeGame.hoverCell = { c: -1, r: -1 };
      });

      // Botones de confirmación y cancelación de colocación táctil en 2 pasos
      const btnConfirmCellBuild = document.getElementById('btn-confirm-cell-build');
      const btnCancelCellBuild = document.getElementById('btn-cancel-cell-build');
      if (btnConfirmCellBuild) {
        btnConfirmCellBuild.addEventListener('click', () => {
          if (!activeGame || !activeGame.selectedBuildType || !activeGame.pendingBuildCell) return;
          const { c, r } = activeGame.pendingBuildCell;
          const res = activeGame.placeTower(activeGame.selectedBuildType, c, r);
          if (res.success) {
            cancelBuild();
            activeGame.selectedPlacedTower = res.tower;
          }
          activeGame.pendingBuildCell = null;
          hidePlacementPill();
          updateHUD();
          updateInspector();
        });
      }
      if (btnCancelCellBuild) {
        btnCancelCellBuild.addEventListener('click', () => {
          if (activeGame) activeGame.pendingBuildCell = null;
          hidePlacementPill();
        });
      }

      // Radar Táctico / Intel de Siguiente Oleada
      const btnWaveIntel = document.getElementById('hud-wave-intel');
      const intelModal = document.getElementById('intel-modal');
      const btnCloseIntel = document.getElementById('btn-close-intel');
      if (btnWaveIntel) {
        btnWaveIntel.addEventListener('click', () => {
          if (!activeGame) return;
          renderIntelModal();
          if (intelModal) intelModal.classList.remove('hidden');
        });
      }
      if (btnCloseIntel && intelModal) {
        btnCloseIntel.addEventListener('click', () => {
          intelModal.classList.add('hidden');
        });
      }

      // Acciones del inspector
      if (btnTogglePriority) {
        btnTogglePriority.addEventListener('click', () => {
          const st = activeGame?.selectedPlacedTower;
          if (!st) return;
          const curIdx = PRIORITIES.indexOf(st.targetPriority || 'first');
          const nextPriority = PRIORITIES[(curIdx + 1) % PRIORITIES.length];
          activeGame.setTargetPriority(st.c, st.r, nextPriority);
          updateInspector();
        });
      }

      if (btnUpgradeTower) {
        btnUpgradeTower.addEventListener('click', () => {
          const st = activeGame?.selectedPlacedTower;
          if (!st) return;
          activeGame.upgradeTower(st.c, st.r);
          updateHUD();
          updateInspector();
        });
      }

      if (btnBranchA) {
        btnBranchA.addEventListener('click', () => {
          const st = activeGame?.selectedPlacedTower;
          if (!st) return;
          activeGame.specializeTower(st.c, st.r, 'a');
          updateHUD();
          updateInspector();
        });
      }

      if (btnBranchB) {
        btnBranchB.addEventListener('click', () => {
          const st = activeGame?.selectedPlacedTower;
          if (!st) return;
          activeGame.specializeTower(st.c, st.r, 'b');
          updateHUD();
          updateInspector();
        });
      }

      if (btnSellTower) {
        btnSellTower.addEventListener('click', () => {
          const st = activeGame?.selectedPlacedTower;
          if (!st) return;
          activeGame.sellTower(st.c, st.r);
          activeGame.selectedPlacedTower = null;
          updateHUD();
          updateInspector();
        });
      }

      if (btnCloseInspector) {
        btnCloseInspector.addEventListener('click', () => {
          if (activeGame) activeGame.selectedPlacedTower = null;
          updateInspector();
        });
      }

      // Modales y botones de cabecera
      if (btnStartGame) {
        btnStartGame.addEventListener('click', () => {
          if (startModal) startModal.classList.add('hidden');
        });
      }
      if (btnOpenMaps) {
        btnOpenMaps.addEventListener('click', () => {
          updateMapsModalUI();
          if (mapsModal) mapsModal.classList.remove('hidden');
        });
      }
      if (btnPause) btnPause.addEventListener('click', togglePause);
      if (btnResume) btnResume.addEventListener('click', togglePause);
      if (btnRestart) {
        btnRestart.addEventListener('click', () => {
          if (pauseModal) pauseModal.classList.add('hidden');
          activeGame.loadMap(activeGame.mapIndex);
          activeGame.gold = activeGame.initialGold;
          activeGame.lives = activeGame.initialLives;
          activeGame.score = 0;
          activeGame.currentWave = 0;
          activeGame.waveActive = false;
          activeGame.gameOver = false;
          activeGame.victory = false;
          updateHUD();
          updateInspector();
        });
      }

      if (btnGameoverRestart) {
        btnGameoverRestart.addEventListener('click', () => {
          if (gameoverModal) gameoverModal.classList.add('hidden');
          isGameOverModalShown = false;
          activeGame.loadMap(activeGame.mapIndex);
          activeGame.gold = activeGame.initialGold;
          activeGame.lives = activeGame.initialLives;
          activeGame.score = 0;
          activeGame.currentWave = 0;
          activeGame.waveActive = false;
          activeGame.gameOver = false;
          activeGame.victory = false;
          updateHUD();
          updateInspector();
        });
      }

      // Botones de Victoria: Modo Sin Fin (Oleada 21+), Siguiente Mapa, Menú de Mapas
      const btnVicEndless = document.getElementById('btn-victory-endless');
      if (btnVicEndless) {
        btnVicEndless.addEventListener('click', () => {
          if (!activeGame) return;
          if (victoryModal) victoryModal.classList.add('hidden');
          isVictoryModalShown = false;
          activeGame.continueToEndless();
          updateHUD();
          updateInspector();
        });
      }

      const btnVicNext = document.getElementById('btn-victory-next');
      if (btnVicNext) {
        btnVicNext.addEventListener('click', () => {
          if (!activeGame) return;
          if (victoryModal) victoryModal.classList.add('hidden');
          isVictoryModalShown = false;
          const nextMap = (activeGame.mapIndex + 1) % MAPAS.length;
          activeGame.loadMap(nextMap);
          activeGame.gold = activeGame.initialGold;
          activeGame.lives = activeGame.initialLives;
          activeGame.score = 0;
          activeGame.currentWave = 0;
          activeGame.waveActive = false;
          activeGame.gameOver = false;
          activeGame.victory = false;
          updateHUD();
          updateInspector();
        });
      }

      const btnVicMaps = document.getElementById('btn-victory-maps');
      if (btnVicMaps) {
        btnVicMaps.addEventListener('click', () => {
          if (victoryModal) victoryModal.classList.add('hidden');
          isVictoryModalShown = false;
          updateMapsModalUI();
          if (mapsModal) mapsModal.classList.remove('hidden');
        });
      }

      const btnVicRestart = document.getElementById('btn-victory-restart');
      if (btnVicRestart) {
        btnVicRestart.addEventListener('click', () => {
          if (victoryModal) victoryModal.classList.add('hidden');
          isVictoryModalShown = false;
          const nextMap = (activeGame.mapIndex + 1) % MAPAS.length;
          activeGame.loadMap(nextMap);
          activeGame.gold = activeGame.initialGold;
          activeGame.lives = activeGame.initialLives;
          activeGame.score = 0;
          activeGame.currentWave = 0;
          activeGame.waveActive = false;
          activeGame.gameOver = false;
          activeGame.victory = false;
          updateHUD();
          updateInspector();
        });
      }

      // Ajustes en Pausa: Temblor de pantalla y Modo de colocación rápida
      const chkShake = document.getElementById('setting-screen-shake');
      if (chkShake) {
        chkShake.checked = activeGame ? activeGame.shakeEnabled() : true;
        chkShake.addEventListener('change', () => {
          const val = chkShake.checked ? '1' : '0';
          if (typeof window !== 'undefined' && window.ArcadeStorage && typeof window.ArcadeStorage.setItem === 'function') {
            window.ArcadeStorage.setItem('bastion:screen_shake', val);
          } else if (typeof localStorage !== 'undefined') {
            localStorage.setItem('bastion:screen_shake', val);
          }
          if (!chkShake.checked && activeGame) {
            activeGame.resetShake();
          }
        });
      }

      const chkOneTap = document.getElementById('setting-onetap-build');
      if (chkOneTap) {
        const stored = (typeof window !== 'undefined' && window.ArcadeStorage && typeof window.ArcadeStorage.getItem === 'function')
          ? (window.ArcadeStorage.getItem('bastion:onetap') === 'true')
          : (typeof localStorage !== 'undefined' && localStorage.getItem('bastion:onetap') === 'true');
        chkOneTap.checked = stored;
        window.oneTapBuild = stored;
        chkOneTap.addEventListener('change', () => {
          window.oneTapBuild = chkOneTap.checked;
          if (typeof window !== 'undefined' && window.ArcadeStorage && typeof window.ArcadeStorage.setItem === 'function') {
            window.ArcadeStorage.setItem('bastion:onetap', chkOneTap.checked ? 'true' : 'false');
          } else if (typeof localStorage !== 'undefined') {
            localStorage.setItem('bastion:onetap', chkOneTap.checked ? 'true' : 'false');
          }
        });
      }

      // Reseteo de sacudida seguro ante pérdida de foco o cambio de pestaña
      window.addEventListener('blur', () => {
        if (activeGame) activeGame.resetShake();
      });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && activeGame) activeGame.resetShake();
      });

      if (btnSound) {
        btnSound.addEventListener('click', () => {
          if (!activeGame) return;
          activeGame.isMuted = !activeGame.isMuted;
          const slot = document.getElementById('sound-icon-slot') || btnSound.querySelector('.icon');
          if (slot && typeof ArcadeIcons !== 'undefined') {
            slot.innerHTML = ArcadeIcons.get(activeGame.isMuted ? 'soundOff' : 'soundOn');
          }
        });
      }

      // Selector de Modo de Juego en Modal de Mapas (Campaña vs Modo Sin Fin)
      const btnModeCamp = document.getElementById('btn-mode-campaign');
      const btnModeEndless = document.getElementById('btn-mode-endless');
      if (btnModeCamp) {
        btnModeCamp.addEventListener('click', () => {
          window.selectedGameMode = 'campaign';
          updateMapsModalUI();
        });
      }
      if (btnModeEndless) {
        btnModeEndless.addEventListener('click', () => {
          window.selectedGameMode = 'endless';
          updateMapsModalUI();
        });
      }

      // Botones de Reinicio de Progreso Permanente con Confirmación (Fase 5)
      const btnResetCamp = document.getElementById('btn-reset-campaign-data');
      if (btnResetCamp) {
        btnResetCamp.addEventListener('click', () => {
          if (confirm('¿Estás seguro de que deseas reiniciar TODO el progreso guardado de la campaña y récords de Bastión?')) {
            if (window.BastionCampaign) window.BastionCampaign.resetProgress();
            if (activeGame?.campaign) activeGame.campaign.resetProgress();
            if (window.ArcadeStorage) {
              window.ArcadeStorage.setJSON('bastion:endless:v1', { bestWave: 0, bestScore: 0 });
            } else if (typeof localStorage !== 'undefined') {
              localStorage.removeItem('bastion:endless:v1');
            }
            if (activeGame) activeGame.endlessRecord = { bestWave: 0, bestScore: 0 };
            updateMapsModalUI();
            alert('El progreso de campaña y récords han sido reiniciados.');
          }
        });
      }

      const btnResetMeta = document.getElementById('btn-reset-meta-data');
      if (btnResetMeta) {
        btnResetMeta.addEventListener('click', () => {
          if (confirm('¿Estás seguro de que deseas reiniciar TODAS las mejoras y esquirlas del Templo del Nexo?')) {
            if (window.BastionMeta) window.BastionMeta.reset();
            if (activeGame?.meta) activeGame.meta.reset();
            renderMetaModal();
            updateHUD();
            alert('Las mejoras del Templo del Nexo han sido reiniciadas.');
          }
        });
      }

      // Panel y Controles de Depuración (?debug=1)
      const urlParams = (typeof window !== 'undefined' && window.location) ? new URLSearchParams(window.location.search) : null;
      const isDebug = urlParams?.get('debug') === '1';
      const debugPanel = document.getElementById('debug-panel');
      if (debugPanel && isDebug) {
        debugPanel.classList.remove('hidden');
      }

      const btnDbgGold = document.getElementById('dbg-gold');
      if (btnDbgGold) btnDbgGold.addEventListener('click', () => { activeGame?.addDebugGold(1000); updateHUD(); });

      const btnDbgLives = document.getElementById('dbg-lives');
      if (btnDbgLives) btnDbgLives.addEventListener('click', () => { activeGame?.addDebugLives(50); updateHUD(); });

      const btnDbgWave = document.getElementById('dbg-wave');
      if (btnDbgWave) btnDbgWave.addEventListener('click', () => { activeGame?.skipWaveDebug(); updateHUD(); });

      const btnDbgNuke = document.getElementById('dbg-nuke');
      if (btnDbgNuke) btnDbgNuke.addEventListener('click', () => { activeGame?.nukeAllEnemies(); updateHUD(); });

      const btnDbgSpeed5 = document.getElementById('dbg-speed5');
      if (btnDbgSpeed5) {
        btnDbgSpeed5.addEventListener('click', () => {
          if (!activeGame) return;
          activeGame.gameSpeed = activeGame.gameSpeed === 5 ? 1 : 5;
          if (speedLabel) speedLabel.textContent = `${activeGame.gameSpeed}x`;
        });
      }

      window.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          if (activeGame) {
            if (!activeGame.waveActive) {
              activeGame.startWave();
            } else {
              activeGame.callNextWaveEarly();
            }
            updateHUD();
          }
        } else if (e.key === 'q' || e.key === 'Q') {
          if (activeGame && activeGame.canUseSkill('orbital_strike')) {
            if (activeGame.activeTargetSkill === 'orbital_strike') {
              activeGame.cancelTargetSkill();
            } else {
              activeGame.useSkill('orbital_strike');
            }
            updateHUD();
          }
        } else if (e.key === 'w' || e.key === 'W') {
          if (activeGame && activeGame.canUseSkill('time_freeze')) {
            activeGame.useSkill('time_freeze');
            updateHUD();
          }
        } else if (e.key === 'e' || e.key === 'E') {
          if (activeGame && activeGame.canUseSkill('gold_surge')) {
            activeGame.useSkill('gold_surge');
            updateHUD();
          }
        } else if (e.key >= '1' && e.key <= '6') {
          const types = ['balistico', 'mortero', 'rayo', 'crio', 'obelisco', 'francotirador'];
          const idx = parseInt(e.key, 10) - 1;
          if (types[idx]) selectBuildType(types[idx]);
        } else if (e.key === 'Escape') {
          if (activeGame?.activeTargetSkill) {
            activeGame.cancelTargetSkill();
            updateHUD();
          } else if (activeGame?.selectedBuildType) {
            cancelBuild();
          } else if (activeGame?.selectedPlacedTower) {
            activeGame.selectedPlacedTower = null;
            updateInspector();
          } else {
            togglePause();
          }
        } else if (e.key === 'p' || e.key === 'P') {
          togglePause();
        } else if (isDebug && activeGame) {
          if (e.key === 'g' || e.key === 'G') {
            activeGame.addDebugGold(1000);
            updateHUD();
          } else if (e.key === 'l' || e.key === 'L') {
            activeGame.addDebugLives(50);
            updateHUD();
          } else if (e.key === 'k' || e.key === 'K') {
            activeGame.nukeAllEnemies();
            updateHUD();
          } else if (e.key === 'n' || e.key === 'N') {
            activeGame.skipWaveDebug();
            updateHUD();
          } else if (e.key === '5') {
            activeGame.gameSpeed = activeGame.gameSpeed === 5 ? 1 : 5;
            if (speedLabel) speedLabel.textContent = `${activeGame.gameSpeed}x`;
          }
        }
      });
    }

    function gameLoop(timestamp) {
      if (!lastTime) lastTime = timestamp;
      let dt = (timestamp - lastTime) / 1000;
      lastTime = timestamp;
      if (dt > 0.08) dt = 0.08;

      if (activeGame) {
        activeGame.update(dt);
        activeGame.render();
        updateHUD();

        // Telemetría en tiempo real de depuración (?debug=1)
        const urlParams = (typeof window !== 'undefined' && window.location) ? new URLSearchParams(window.location.search) : null;
        if (urlParams?.get('debug') === '1') {
          const dbgFps = document.getElementById('debug-fps');
          const dbgStats = document.getElementById('debug-stats');
          if (dbgFps) dbgFps.textContent = `${Math.round(1 / (dt || 0.016))} FPS`;
          if (dbgStats) {
            dbgStats.textContent = `E:${activeGame.enemies.length} T:${activeGame.towers.length} P:${activeGame.projectiles.length} FX:${activeGame.particles.length}`;
          }
        }

        if (activeGame.gameOver && !isGameOverModalShown) {
          isGameOverModalShown = true;
          showGameOver();
        }

        if (activeGame.victory && !isVictoryModalShown) {
          isVictoryModalShown = true;
          showVictory();
        }
      }

      requestAnimationFrame(gameLoop);
    }

    function init() {
      canvas = document.getElementById('game-canvas');
      boardWrapper = document.getElementById('board-wrapper');
      hudLives = document.getElementById('hud-lives');
      hudGold = document.getElementById('hud-gold');
      hudShards = document.getElementById('hud-shards');
      hudWave = document.getElementById('hud-wave');
      hudRelics = document.getElementById('hud-relics');
      btnSpeed = document.getElementById('btn-speed');
      speedLabel = document.getElementById('speed-label');

      btnBuildBalistico = document.getElementById('btn-build-balistico');
      btnBuildMortero = document.getElementById('btn-build-mortero');
      btnBuildRayo = document.getElementById('btn-build-rayo');
      btnBuildCrio = document.getElementById('btn-build-crio');
      btnBuildObelisco = document.getElementById('btn-build-obelisco');
      btnBuildSniper = document.getElementById('btn-build-sniper');

      btnCancelBuild = document.getElementById('btn-cancel-build');
      btnStartWave = document.getElementById('btn-start-wave');
      towerInspector = document.getElementById('tower-inspector');
      inspectorName = document.getElementById('inspector-name');
      inspectorStats = document.getElementById('inspector-stats');
      priorityLabel = document.getElementById('priority-label');
      btnTogglePriority = document.getElementById('btn-toggle-priority');
      btnSellTower = document.getElementById('btn-sell-tower');
      btnCloseInspector = document.getElementById('btn-close-inspector');

      btnUpgradeTower = document.getElementById('btn-upgrade-tower');
      btnBranchA = document.getElementById('btn-branch-a');
      btnBranchB = document.getElementById('btn-branch-b');

      startModal = document.getElementById('start-modal');
      pauseModal = document.getElementById('pause-modal');
      gameoverModal = document.getElementById('gameover-modal');
      mapsModal = document.getElementById('maps-modal');
      resWave = document.getElementById('res-wave');
      resScore = document.getElementById('res-score');
      btnStartGame = document.getElementById('btn-start-game');
      btnPause = document.getElementById('btn-pause');
      btnSound = document.getElementById('btn-sound');
      btnResume = document.getElementById('btn-resume');
      btnRestart = document.getElementById('btn-restart');
      btnGameoverRestart = document.getElementById('btn-gameover-restart');
      btnOpenMaps = document.getElementById('btn-open-maps');

      if (!canvas) return;

      activeGame = new BastionGame(canvas);
      window.activeGame = activeGame;
      handleResize();
      setupEvents();
      updateHUD();
      updateInspector();
      updateMapsModalUI();

      requestAnimationFrame(gameLoop);
    }

    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  // Exportación para Node o Navegador
  if (isNode) {
    module.exports = { BastionGame };
  } else {
    window.BastionGame = BastionGame;
  }
})();
