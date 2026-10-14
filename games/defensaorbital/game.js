/**
 * DEFENSA ORBITAL - Shooter vertical arcade de defensa espacial (ES6+)
 * 100% offline, sin dependencias ni assets externos.
 * 
 * FASE 1:
 * - Nave con control táctil (con offset para no taparla con el dedo), mouse y teclado
 * - Disparo automático constante con pool de proyectiles
 * - Fondo de estrellas con parallax de 3 capas
 * - Enemigo Tipo 1 con colisiones circulares, vida y partículas
 * - Object pooling total para 60 FPS estables sin pausas de Garbage Collection
 */
(() => {
  'use strict';

  // ==========================================================================
  // 1. CONFIGURACIÓN Y CONSTANTES AJUSTABLES (BALANCE DE JUEGO)
  // ==========================================================================
  const CONFIG = {
    GAME_ID: 'defensaorbital',
    WORLD_WIDTH: 480,
    WORLD_HEIGHT: 640,

    // Nave del jugador
    PLAYER_SPEED: 460,            // Velocidad con teclado (px/segundo)
    PLAYER_LERP: 22,              // Factor de suavizado del arrastre
    TOUCH_OFFSET_Y: 52,           // Píxeles por encima del dedo para visibilidad total
    PLAYER_FIRE_INTERVAL: 0.20,   // Cadencia moderada (~5 disparos/seg)
    INVULNERABILITY_TIME: 1.8,    // Segundos de protección tras recibir daño

    // Proyectiles y combate (la puntería importa)
    BULLET_SPEED: 640,            // Velocidad del proyectil (px/seg)
    BULLET_DAMAGE: 1,
    MAX_BULLETS: 60,              // Capacidad del pool de proyectiles
    MAX_ACTIVE_PLAYER_BULLETS: 2, // Máximo de proyectiles activos en pantalla (nave estándar)

    // Proyectiles enemigos y picadas
    MAX_ENEMY_BULLETS: 20,        // Pool de proyectiles hostiles
    ENEMY_BULLET_SPEED: 260,      // Velocidad del plasma enemigo
    DIVE_COOLDOWN_BASE: 3.2,      // Frecuencia inicial de picadas (segundos)

    // Formación y oleadas
    MAX_ENEMIES: 40,              // Capacidad del pool de enemigos
    FORMATION_SWAY_AMP: 36,       // Amplitud de vaivén horizontal en px
    FORMATION_SWAY_SPEED: 1.25,   // Velocidad angular del vaivén
    FORMATION_BREATH_AMP: 0.075,  // Expansión/contracción (±7.5%)
    FORMATION_BREATH_SPEED: 1.8,  // Velocidad angular de la respiración

    // Puntuación y bonificaciones
    // Puntuación y bonificaciones
    BONUS_HIT_POINTS: 150,        // Puntos por blanco en etapa de bonificación
    BONUS_PERFECT_POINTS: 5000,   // Gran bonificación por destruir el 100% de la etapa

    // Dificultades calibradas
    DIFFICULTIES: {
      CADETE: {
        id: 'CADETE',
        label: 'CADETE',
        badgeClass: 'badge-emerald',
        lives: 4,
        bulletSpeedMult: 0.78,
        diveCooldownMult: 1.35,
        scoreMult: 1.0,
        desc: '4 Vidas • Proyectiles moderados • Ideal para comenzar'
      },
      PILOTO: {
        id: 'PILOTO',
        label: 'PILOTO',
        badgeClass: 'badge-cyan',
        lives: 3,
        bulletSpeedMult: 1.0,
        diveCooldownMult: 1.0,
        scoreMult: 1.0,
        desc: '3 Vidas • Velocidad estándar • Experiencia arcade'
      },
      AS: {
        id: 'AS',
        label: 'AS ORBITAL',
        badgeClass: 'badge-amber',
        lives: 2,
        bulletSpeedMult: 1.25,
        diveCooldownMult: 0.75,
        scoreMult: 1.5,
        desc: '2 Vidas • Picadas agresivas • Puntuación x1.5 para récords'
      }
    },

    // Efectos y pools adicionales
    MAX_SHOCKWAVES: 8,
    MAX_FLOATING_TEXTS: 16,
    MAX_POWERUPS: 6,
    MAX_PARTICLES: 180,           // Límite estricto de partículas simultáneas
    SHAKE_DURATION: 0.3           // Duración del temblor de pantalla al recibir daño
  };

  const GameState = {
    WAITING_START: 'WAITING_START',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAMEOVER: 'GAMEOVER'
  };

  class DefensaOrbitalGame {
    constructor() {
      // Elementos del DOM
      this.canvas = document.getElementById('space-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.wrapper = this.canvas.parentElement;

      this.scoreDisplay = document.getElementById('score-display');
      this.highScoreDisplay = document.getElementById('highscore-display');
      this.livesDisplay = document.getElementById('lives-display');
      this.waveDisplay = document.getElementById('wave-display');
      this.streakDisplay = document.getElementById('streak-display');

      this.diffBadge = document.getElementById('diff-badge');
      this.diffDesc = document.getElementById('diff-desc');
      this.difficulty = 'PILOTO';

      this.startHint = document.getElementById('start-hint');
      this.powerupBadge = document.getElementById('powerup-badge');
      this.streakBanner = document.getElementById('streak-banner');

      this.pauseOverlay = document.getElementById('overlay-pause');
      this.gameoverOverlay = document.getElementById('overlay-gameover');
      this.finalScore = document.getElementById('final-score');
      this.finalWave = document.getElementById('final-wave');
      this.finalHighScore = document.getElementById('final-highscore');
      this.newRecordTag = document.getElementById('new-record-tag');

      // Estado del juego
      this.state = GameState.WAITING_START;
      this.score = 0;
      this.highScore = window.ArcadeStorage ? window.ArcadeStorage.getHighScore(CONFIG.GAME_ID) : 0;
      this.lives = 3;
      this.wave = 1;
      this.streak = 1;
      this.killsWithoutDamage = 0;

      // Nave del jugador
      this.player = {
        x: CONFIG.WORLD_WIDTH / 2,
        y: CONFIG.WORLD_HEIGHT - 90,
        targetX: CONFIG.WORLD_WIDTH / 2,
        targetY: CONFIG.WORLD_HEIGHT - 90,
        radius: 16,
        width: 34,
        height: 38,
        fireTimer: 0,
        invulnerableTimer: 0,
        isFlashing: false
      };

      // Fondo cósmico: Nebulosas procedurales y estrellas parallax
      this.nebulae = this.createNebulae();
      this.stars = this.createStarfield();

      // Object Pooling: Proyectiles del jugador
      this.bullets = Array.from({ length: CONFIG.MAX_BULLETS }, () => ({
        x: 0,
        y: 0,
        vy: -CONFIG.BULLET_SPEED,
        radius: 3.5,
        active: false
      }));

      // Object Pooling: Proyectiles hostiles (Picadas enemigas)
      this.enemyBullets = Array.from({ length: CONFIG.MAX_ENEMY_BULLETS }, () => ({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: 4,
        active: false
      }));

      // Mecánica Propia: Dron Satélite de Escolta (Se acopla y duplica disparo)
      this.drone = {
        docked: false,
        side: 1, // 1 = derecha, -1 = izquierda
        x: 0,
        y: 0,
        radius: 11,
        hp: 1,
        flashTimer: 0,
        rotorAngle: 0
      };

      // Cápsula de Núcleo Satélite soltada por el enemigo portador
      this.capsule = {
        active: false,
        x: 0,
        y: 0,
        vy: 85,
        radius: 12,
        pulsePhase: 0
      };

      // Object Pooling: Ondas de choque (Shockwaves neón)
      this.shockwaves = Array.from({ length: CONFIG.MAX_SHOCKWAVES }, () => ({
        x: 0,
        y: 0,
        radius: 0,
        maxRadius: 60,
        color: '#38bdf8',
        life: 0,
        maxLife: 0.35,
        active: false
      }));

      // Object Pooling: Textos flotantes de combate
      this.floatingTexts = Array.from({ length: CONFIG.MAX_FLOATING_TEXTS }, () => ({
        x: 0,
        y: 0,
        text: '',
        color: '#38bdf8',
        life: 0,
        maxLife: 0.75,
        vy: -38,
        active: false
      }));

      // Object Pooling: Orbes de energía / Power-ups
      this.powerups = Array.from({ length: CONFIG.MAX_POWERUPS }, () => ({
        x: 0,
        y: 0,
        vy: 75,
        type: 'PEM',
        radius: 11,
        pulse: 0,
        active: false
      }));

      // Mejoras temporales
      this.hyperTimer = 0;
      this.shieldActive = false;

      // Entidad Jefe de Sector: Coloso Cuántico Aegis
      this.boss = {
        active: false,
        name: 'COLOSO AEGIS',
        x: CONFIG.WORLD_WIDTH / 2,
        y: -120,
        targetY: 135,
        vx: 55,
        width: 120,
        height: 60,
        hp: 36,
        maxHp: 36,
        leftWingHp: 10,
        maxLeftWingHp: 10,
        rightWingHp: 10,
        maxRightWingHp: 10,
        scoreKill: 2500,
        shootTimer: 1.6,
        patternTimer: 0,
        flutterPhase: 0
      };

      // Temporizador de estela de propulsor
      this.engineTrailTimer = 0;

      // Object Pooling: Enemigos de formación y picadas
      this.enemies = Array.from({ length: CONFIG.MAX_ENEMIES }, () => ({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: 14,
        hp: 1,
        maxHp: 1,
        type: 'PRISMA',
        typeData: null,
        state: 'INACTIVE', // 'INACTIVE', 'ENTERING', 'FORMATION', 'DIVING', 'RETURNING'
        assignedRow: 0,
        assignedCol: 0,
        trajectory: null,
        t: 0,
        curveDuration: 2.0,
        heading: Math.PI,
        flutterPhase: 0,
        isCarrier: false, // Si es el enemigo marcado que suelta el dron
        hasShot: false,
        shootRatio: 0.45,
        diveCurve: null,
        active: false
      }));

      // Object Pooling: Partículas
      this.particles = Array.from({ length: CONFIG.MAX_PARTICLES }, () => ({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 2,
        color: '#38bdf8',
        life: 0,
        maxLife: 1,
        active: false
      }));

      // Gestión de Formación, Picadas y Oleadas
      this.formationSwayTimer = 0;
      this.formationBreathTimer = 0;
      this.currentWaveConfig = null;
      this.pendingGroups = [];
      this.diveCooldown = CONFIG.DIVE_COOLDOWN_BASE;
      this.bonusHits = 0;
      this.bonusTotal = 0;
      this.stageReport = null;
      this.stageReportTimer = 0;
      this.waveClearTimer = 0;
      this.waveIntroTimer = 0;
      this.waveIntroTitle = '';
      this.stats = { shotsFired: 0, shotsHit: 0 };

      // Variables de control y tiempo
      this.lastTime = 0;
      this.shakeTimer = 0;
      this.scale = 1;
      this.keys = { left: false, right: false, up: false, down: false };

      this.initEvents();
      this.resizeCanvas();
      this.startNewGame();
      this.setDifficulty('PILOTO');

      requestAnimationFrame(this.gameLoop.bind(this));
    }

    createNebulae() {
      return [
        { x: 120, y: 140, r: 190, color: '126, 34, 206', alpha: 0.12, vy: 8 },  // Violeta estelar profundo
        { x: 380, y: 460, r: 220, color: '14, 116, 144', alpha: 0.10, vy: 14 }, // Cian abisal
        { x: 230, y: -60, r: 170, color: '30, 58, 138', alpha: 0.14, vy: 10 }   // Añil galáctico
      ];
    }

    createStarfield() {
      const stars = [];
      // Capa 1: Lejana (45 estrellas, lentas, pequeñas)
      for (let i = 0; i < 45; i++) {
        stars.push({
          x: Math.random() * CONFIG.WORLD_WIDTH,
          y: Math.random() * CONFIG.WORLD_HEIGHT,
          speed: 28,
          size: 1,
          alpha: 0.35 + Math.random() * 0.3
        });
      }
      // Capa 2: Media (25 estrellas, velocidad moderada)
      for (let i = 0; i < 25; i++) {
        stars.push({
          x: Math.random() * CONFIG.WORLD_WIDTH,
          y: Math.random() * CONFIG.WORLD_HEIGHT,
          speed: 65,
          size: 1.6,
          alpha: 0.65 + Math.random() * 0.25
        });
      }
      // Capa 3: Cercana (12 estrellas, rápidas, brillantes)
      for (let i = 0; i < 12; i++) {
        stars.push({
          x: Math.random() * CONFIG.WORLD_WIDTH,
          y: Math.random() * CONFIG.WORLD_HEIGHT,
          speed: 130,
          size: 2.2,
          alpha: 0.95
        });
      }
      return stars;
    }

    setDifficulty(diffKey) {
      if (!CONFIG.DIFFICULTIES[diffKey]) return;
      this.difficulty = diffKey;
      const d = CONFIG.DIFFICULTIES[diffKey];

      if (this.diffBadge) {
        this.diffBadge.textContent = d.label;
        this.diffBadge.className = `brand-badge ${d.badgeClass}`;
      }
      if (this.diffDesc) {
        this.diffDesc.textContent = d.desc;
      }

      const buttons = document.querySelectorAll ? document.querySelectorAll('.btn-diff') : [];
      buttons.forEach(btn => {
        if (btn.getAttribute && btn.getAttribute('data-diff') === diffKey) {
          btn.classList.add('active');
        } else if (btn.classList) {
          btn.classList.remove('active');
        }
      });

      if (this.state === GameState.WAITING_START) {
        this.lives = d.lives;
        this.updateUI();
      }
    }

    spawnShockwave(x, y, color = '#38bdf8', maxRadius = 55) {
      const s = this.shockwaves.find(sw => !sw.active);
      if (!s) return;
      s.x = x;
      s.y = y;
      s.color = color;
      s.radius = 4;
      s.maxRadius = maxRadius;
      s.life = 0.35;
      s.maxLife = 0.35;
      s.active = true;
    }

    spawnFloatingText(x, y, text, color = '#38bdf8') {
      const ft = this.floatingTexts.find(t => !t.active);
      if (!ft) return;
      ft.x = x;
      ft.y = y;
      ft.text = text;
      ft.color = color;
      ft.life = 0.75;
      ft.maxLife = 0.75;
      ft.vy = -38;
      ft.active = true;
    }

    spawnPowerup(x, y) {
      if (this.powerups.some(p => p.active)) return;
      const p = this.powerups.find(pu => !pu.active);
      if (!p) return;
      const types = ['PEM', 'HYPER', 'SHIELD'];
      p.type = types[Math.floor(Math.random() * types.length)];
      p.x = x;
      p.y = y;
      p.vy = 75;
      p.pulse = 0;
      p.active = true;
    }

    spawnEngineSpark(x, y, color = '#38bdf8') {
      const p = this.particles.find(pt => !pt.active);
      if (!p) return;
      p.x = x + (Math.random() * 4 - 2);
      p.y = y;
      p.vx = (Math.random() * 2 - 1) * 16;
      p.vy = 45 + Math.random() * 40;
      p.size = 1.2 + Math.random() * 1.4;
      p.color = color;
      p.life = 0.14 + Math.random() * 0.1;
      p.maxLife = p.life;
      p.active = true;
    }

    startNewGame() {
      const d = CONFIG.DIFFICULTIES[this.difficulty] || CONFIG.DIFFICULTIES.PILOTO;
      this.score = 0;
      this.lives = d.lives;
      this.wave = 1;
      this.streak = 1;
      this.killsWithoutDamage = 0;
      this.stats = { shotsFired: 0, shotsHit: 0 };

      this.player.x = CONFIG.WORLD_WIDTH / 2;
      this.player.y = CONFIG.WORLD_HEIGHT - 90;
      this.player.targetX = this.player.x;
      this.player.targetY = this.player.y;
      this.player.invulnerableTimer = 0;
      this.player.fireTimer = 0;

      this.formationSwayTimer = 0;
      this.formationBreathTimer = 0;
      this.diveCooldown = CONFIG.DIVE_COOLDOWN_BASE * d.diveCooldownMult;
      this.stageReport = null;
      this.stageReportTimer = 0;

      // Resetear dron de escolta, cápsula y mejoras
      this.drone.docked = false;
      this.drone.hp = 1;
      this.capsule.active = false;
      this.hyperTimer = 0;
      this.shieldActive = false;
      this.boss.active = false;

      // Limpiar pools
      this.bullets.forEach(b => b.active = false);
      this.enemyBullets.forEach(b => b.active = false);
      this.shockwaves.forEach(sw => sw.active = false);
      this.floatingTexts.forEach(ft => ft.active = false);
      this.powerups.forEach(pu => pu.active = false);
      this.enemies.forEach(e => {
        e.active = false;
        e.state = 'INACTIVE';
      });
      this.particles.forEach(p => p.active = false);

      this.startWave(1);
      this.updateUI();

      this.pauseOverlay.classList.add('hidden');
      this.gameoverOverlay.classList.add('hidden');
      this.newRecordTag.classList.add('hidden');
      this.startHint.classList.remove('hidden');
      this.state = GameState.WAITING_START;
    }

    startGame() {
      if (this.state !== GameState.WAITING_START) return;
      this.state = GameState.PLAYING;
      this.startHint.classList.add('hidden');
      if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(15);
      this.playWaveStartSound();
    }

    getSlotWorldPos(row, col) {
      const cfg = (window.OleadasModule && window.OleadasModule.FORMACION_CONFIG) ? window.OleadasModule.FORMACION_CONFIG : {
        ROWS: 4, COLS: 8, SLOT_SPACING_X: 42, SLOT_SPACING_Y: 34,
        CENTER_X: CONFIG.WORLD_WIDTH / 2, TOP_Y: 105,
        SWAY_AMP: 36, BREATH_AMP: 0.075
      };

      const sway = Math.sin(this.formationSwayTimer) * CONFIG.FORMATION_SWAY_AMP;
      const breath = 1.0 + Math.sin(this.formationBreathTimer) * CONFIG.FORMATION_BREATH_AMP;

      const x = cfg.CENTER_X + (col - (cfg.COLS - 1) / 2) * cfg.SLOT_SPACING_X * breath + sway;
      const y = cfg.TOP_Y + row * cfg.SLOT_SPACING_Y * breath;

      return { x, y };
    }

    startWave(waveNum) {
      this.wave = waveNum;
      this.waveClearTimer = 0;
      const d = CONFIG.DIFFICULTIES[this.difficulty] || CONFIG.DIFFICULTIES.PILOTO;
      this.diveCooldown = Math.max(1.2, (CONFIG.DIVE_COOLDOWN_BASE - (waveNum - 1) * 0.15) * d.diveCooldownMult);

      if (!window.OleadasModule) return;
      this.currentWaveConfig = window.OleadasModule.getWaveConfig(waveNum);
      this.waveIntroTitle = this.currentWaveConfig.title || `OLEADA ${waveNum}`;
      this.waveIntroTimer = 2.4;

      // Enfrentamiento con Jefe de Sector (Oleadas 5, 10, 15...)
      if (this.currentWaveConfig.isBoss) {
        const bcfg = this.currentWaveConfig.boss;
        this.boss.active = true;
        this.boss.name = bcfg.name;
        this.boss.hp = bcfg.hp;
        this.boss.maxHp = bcfg.maxHp;
        this.boss.leftWingHp = bcfg.leftWingHp;
        this.boss.maxLeftWingHp = bcfg.maxLeftWingHp;
        this.boss.rightWingHp = bcfg.rightWingHp;
        this.boss.maxRightWingHp = bcfg.maxRightWingHp;
        this.boss.scoreKill = bcfg.scoreKill || 2500;
        this.boss.x = CONFIG.WORLD_WIDTH / 2;
        this.boss.y = -110;
        this.boss.targetY = 135;
        this.boss.vx = 55;
        this.boss.shootTimer = 1.6;
        this.boss.patternTimer = 0;
        this.boss.flutterPhase = 0;
        this.spawnShockwave(CONFIG.WORLD_WIDTH / 2, 135, '#ec4899', 80);
      } else {
        this.boss.active = false;
      }

      // Seguimiento de Etapas de Bonificación
      if (this.currentWaveConfig.isBonus) {
        this.bonusHits = 0;
        this.bonusTotal = this.currentWaveConfig.groups.reduce((acc, g) => acc + g.slots.length, 0);
      } else {
        this.bonusHits = 0;
        this.bonusTotal = 0;
      }

      // Designar portador de cápsula satélite en oleadas normales si el jugador no tiene dron
      let carrierAssigned = false;

      // Inicializar escuadras coreografiadas
      this.pendingGroups = (this.currentWaveConfig.groups || []).map(g => {
        const slotsWithCarrier = g.slots.map(s => {
          let isCarrier = false;
          if (!this.currentWaveConfig.isBonus && !this.drone.docked && !carrierAssigned && g.enemyType === 'VERTICE') {
            isCarrier = true;
            carrierAssigned = true;
          }
          return { row: s.row, col: s.col, isCarrier };
        });

        return {
          trajectoryId: g.trajectoryId,
          trajectory: window.OleadasModule.TRAYECTORIAS[g.trajectoryId],
          enemyType: g.enemyType,
          typeData: window.OleadasModule.TIPOS_ENEMIGOS[g.enemyType] || window.OleadasModule.TIPOS_ENEMIGOS.PRISMA,
          slots: slotsWithCarrier,
          spawnIndex: 0,
          startDelay: g.startDelay,
          staggerDelay: g.staggerDelay,
          nextSpawnTimer: g.startDelay,
          isComplete: false
        };
      });

      this.updateUI();
    }

    spawnPlayerBullet() {
      // Máximo de proyectiles activos en pantalla: 2 para nave simple, 4 con dron satélite acoplado
      const maxBullets = this.drone.docked ? 4 : CONFIG.MAX_ACTIVE_PLAYER_BULLETS;
      let activeCount = 0;
      for (let i = 0; i < this.bullets.length; i++) {
        if (this.bullets[i].active) activeCount++;
      }
      if (activeCount >= maxBullets) return;

      // 1. Disparo de la nave principal
      const bullet = this.bullets.find(b => !b.active);
      if (bullet) {
        bullet.x = this.player.x;
        bullet.y = this.player.y - 18;
        bullet.vy = -CONFIG.BULLET_SPEED;
        bullet.active = true;

        this.stats.shotsFired++;
        this.playShootSound();
      }

      // 2. Disparo en paralelo del Dron Satélite de Escolta
      if (this.drone.docked && activeCount + 1 < maxBullets) {
        const droneBullet = this.bullets.find(b => !b.active);
        if (droneBullet) {
          droneBullet.x = this.drone.x;
          droneBullet.y = this.drone.y - 12;
          droneBullet.vy = -CONFIG.BULLET_SPEED;
          droneBullet.active = true;
          this.stats.shotsFired++;
        }
      }
    }

    spawnEnemyBullet(x, y) {
      const eb = this.enemyBullets.find(b => !b.active);
      if (!eb) return;

      eb.x = x;
      eb.y = y;

      // Calcular vector hacia la posición actual de la nave del jugador
      const dx = this.player.x - x;
      const dy = this.player.y - y;
      const dist = Math.hypot(dx, dy) || 1;
      const speed = CONFIG.ENEMY_BULLET_SPEED || 260;

      eb.vx = (dx / dist) * speed;
      eb.vy = (dy / dist) * speed;
      eb.radius = 4;
      eb.active = true;

      this.playEnemyShootSound();
    }

    spawnEnemyInGroup(group, slot) {
      const enemy = this.enemies.find(e => !e.active);
      if (!enemy || !group.trajectory) return;

      const traj = group.trajectory;
      enemy.active = true;
      enemy.state = 'ENTERING';
      enemy.type = group.enemyType;
      enemy.typeData = group.typeData;
      enemy.hp = group.typeData.hp;
      enemy.maxHp = group.typeData.hp;
      enemy.radius = group.typeData.radius;
      enemy.assignedRow = slot.row;
      enemy.assignedCol = slot.col;
      enemy.trajectory = traj;
      enemy.t = 0;
      enemy.curveDuration = traj.duration;
      enemy.heading = 0;
      enemy.flutterPhase = Math.random() * Math.PI * 2;
      enemy.isCarrier = !!slot.isCarrier;
      enemy.hasShot = false;
      enemy.shootRatio = 0.42;
      enemy.diveCurve = null;
      enemy.x = traj.p0.x;
      enemy.y = traj.p0.y;
    }

    playShootSound() {
      // Audio sintetizado original: Láser de doble pulso iónico
      if (window.ArcadeAudio && window.ArcadeAudio.initCtx) {
        window.ArcadeAudio.initCtx();
        const ctx = window.ArcadeAudio.ctx;
        if (ctx && !window.ArcadeAudio.isMuted) {
          try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = ctx.currentTime;
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(940, t);
            osc.frequency.exponentialRampToValueAtTime(520, t + 0.045);
            gain.gain.setValueAtTime(0.065, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.045);
            return;
          } catch (e) {}
        }
      }
      if (window.ArcadeAudio && window.ArcadeAudio.playTone) {
        window.ArcadeAudio.playTone(860, 'sawtooth', 0.04, 0.06);
      }
    }

    playEnemyShootSound() {
      if (window.ArcadeAudio && window.ArcadeAudio.initCtx) {
        window.ArcadeAudio.initCtx();
        const ctx = window.ArcadeAudio.ctx;
        if (ctx && !window.ArcadeAudio.isMuted) {
          try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = ctx.currentTime;
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(360, t);
            osc.frequency.exponentialRampToValueAtTime(130, t + 0.07);
            gain.gain.setValueAtTime(0.055, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.07);
            return;
          } catch (e) {}
        }
      }
      if (window.ArcadeAudio && window.ArcadeAudio.playTone) {
        window.ArcadeAudio.playTone(260, 'sawtooth', 0.05, 0.05);
      }
    }

    playHitSound() {
      if (window.ArcadeAudio && window.ArcadeAudio.playTone) {
        window.ArcadeAudio.playTone(520, 'square', 0.03, 0.05);
      }
    }

    playExplosionSound() {
      if (window.ArcadeAudio && window.ArcadeAudio.initCtx) {
        window.ArcadeAudio.initCtx();
        const ctx = window.ArcadeAudio.ctx;
        if (ctx && !window.ArcadeAudio.isMuted) {
          try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = ctx.currentTime;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(240, t);
            osc.frequency.exponentialRampToValueAtTime(42, t + 0.17);
            gain.gain.setValueAtTime(0.13, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.17);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.17);
            return;
          } catch (e) {}
        }
      }
      if (window.ArcadeAudio && window.ArcadeAudio.playDrop) {
        window.ArcadeAudio.playDrop();
      }
    }

    playDroneDockSound() {
      if (window.ArcadeAudio && window.ArcadeAudio.initCtx) {
        window.ArcadeAudio.initCtx();
        const ctx = window.ArcadeAudio.ctx;
        if (ctx && !window.ArcadeAudio.isMuted) {
          try {
            [440, 660, 880, 1174].forEach((freq, idx) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              const t = ctx.currentTime + idx * 0.045;
              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, t);
              gain.gain.setValueAtTime(0.08, t);
              gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(t);
              osc.stop(t + 0.11);
            });
            return;
          } catch (e) {}
        }
      }
      if (window.ArcadeAudio && window.ArcadeAudio.playClear) window.ArcadeAudio.playClear();
    }

    playDroneLostSound() {
      if (window.ArcadeAudio && window.ArcadeAudio.initCtx) {
        window.ArcadeAudio.initCtx();
        const ctx = window.ArcadeAudio.ctx;
        if (ctx && !window.ArcadeAudio.isMuted) {
          try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = ctx.currentTime;
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(310, t);
            osc.frequency.exponentialRampToValueAtTime(75, t + 0.22);
            gain.gain.setValueAtTime(0.12, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.22);
            return;
          } catch (e) {}
        }
      }
      if (window.ArcadeAudio && window.ArcadeAudio.playLoseLife) window.ArcadeAudio.playLoseLife();
    }

    playWaveStartSound() {
      // Fanfarria orbital sintética ascendente en armonía cuántica
      if (window.ArcadeAudio && window.ArcadeAudio.initCtx) {
        window.ArcadeAudio.initCtx();
        const ctx = window.ArcadeAudio.ctx;
        if (ctx && !window.ArcadeAudio.isMuted) {
          try {
            [350, 466, 622, 932].forEach((freq, idx) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              const t = ctx.currentTime + idx * 0.055;
              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, t);
              gain.gain.setValueAtTime(0.075, t);
              gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(t);
              osc.stop(t + 0.13);
            });
            return;
          } catch (e) {}
        }
      }
      if (window.ArcadeAudio && window.ArcadeAudio.playClear) {
        window.ArcadeAudio.playClear();
      }
    }

    playBonusFanfare(isPerfect = false) {
      if (window.ArcadeAudio && window.ArcadeAudio.initCtx) {
        window.ArcadeAudio.initCtx();
        const ctx = window.ArcadeAudio.ctx;
        if (ctx && !window.ArcadeAudio.isMuted) {
          try {
            const freqs = isPerfect ? [523, 659, 784, 1046, 1318] : [440, 554, 659];
            freqs.forEach((freq, idx) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              const t = ctx.currentTime + idx * 0.08;
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(freq, t);
              gain.gain.setValueAtTime(0.09, t);
              gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(t);
              osc.stop(t + 0.22);
            });
            return;
          } catch (e) {}
        }
      }
      if (window.ArcadeAudio && window.ArcadeAudio.playClear) window.ArcadeAudio.playClear();
    }

    spawnExplosionParticles(x, y, color = '#38bdf8', count = 12) {
      let spawned = 0;
      for (let i = 0; i < this.particles.length && spawned < count; i++) {
        const p = this.particles[i];
        if (!p.active) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 40 + Math.random() * 160;
          p.x = x;
          p.y = y;
          p.vx = Math.cos(angle) * speed;
          p.vy = Math.sin(angle) * speed;
          p.size = 1.8 + Math.random() * 2.5;
          p.color = color;
          p.life = 0.25 + Math.random() * 0.3;
          p.maxLife = p.life;
          p.active = true;
          spawned++;
        }
      }
    }

    damagePlayer() {
      if (this.player.invulnerableTimer > 0) return;

      // 1. Escudo Deflector Cuántico absorbe el impacto completamente
      if (this.shieldActive) {
        this.shieldActive = false;
        this.player.invulnerableTimer = 0.9;
        this.shakeTimer = 0.15;
        this.spawnShockwave(this.player.x, this.player.y, '#00f0ff', 60);
        this.spawnFloatingText(this.player.x, this.player.y - 18, '¡ESCUDO DEFLECTOR ROTO!', '#00f0ff');
        this.playDroneLostSound();
        if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(35);
        return;
      }

      this.lives--;
      this.player.invulnerableTimer = CONFIG.INVULNERABILITY_TIME;
      this.shakeTimer = CONFIG.SHAKE_DURATION;

      // Romper racha de bajas sin daño
      this.streak = 1;
      this.killsWithoutDamage = 0;

      if (window.ArcadeAudio && window.ArcadeAudio.playLoseLife) {
        window.ArcadeAudio.playLoseLife();
      } else if (window.ArcadeAudio && window.ArcadeAudio.playTone) {
        window.ArcadeAudio.playTone(180, 'sawtooth', 0.2, 0.15);
      }
      if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(50);

      this.spawnShockwave(this.player.x, this.player.y, '#ff3366', 65);
      this.spawnExplosionParticles(this.player.x, this.player.y, '#ff3366', 22);
      this.updateUI();

      if (this.lives <= 0) {
        this.triggerGameOver();
      }
    }

    triggerGameOver() {
      this.state = GameState.GAMEOVER;
      if (window.ArcadeAudio && window.ArcadeAudio.playGameOver) {
        window.ArcadeAudio.playGameOver();
      }

      const isNewRecord = this.score > 0 && this.score >= this.highScore;
      if (isNewRecord) {
        this.highScore = this.score;
        if (window.ArcadeStorage) {
          window.ArcadeStorage.setHighScore(CONFIG.GAME_ID, this.highScore);
        }
        this.newRecordTag.classList.remove('hidden');
      } else {
        this.newRecordTag.classList.add('hidden');
      }

      this.finalScore.textContent = this.score;
      this.finalWave.textContent = this.wave;
      this.finalHighScore.textContent = this.highScore;

      this.gameoverOverlay.classList.remove('hidden');
    }

    togglePause() {
      if (this.state === GameState.GAMEOVER) return;

      if (this.state === GameState.PLAYING || this.state === GameState.WAITING_START) {
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
      this.waveDisplay.textContent = this.wave;
      this.streakDisplay.textContent = `x${this.streak}`;

      const d = CONFIG.DIFFICULTIES[this.difficulty] || CONFIG.DIFFICULTIES.PILOTO;
      const totalHearts = Math.max(d.lives, this.lives);
      let hearts = '';
      for (let i = 0; i < totalHearts; i++) {
        hearts += i < this.lives ? '♥' : '♡';
      }
      this.livesDisplay.textContent = hearts;
    }

    resizeCanvas() {
      if (window.ArcadeCanvas) {
        const result = window.ArcadeCanvas.fit(this.canvas, this.wrapper, 3, 4, 8);
        this.scale = result.width / CONFIG.WORLD_WIDTH;
      }
    }

    // ==========================================================================
    // 2. FÍSICA Y SIMULACIÓN CON PASOS FIJOS
    // ==========================================================================
    update(dt) {
      // 1. Desplazamiento de nebulosas cósmicas y estrellas (Parallax profundo)
      for (let i = 0; i < this.nebulae.length; i++) {
        const n = this.nebulae[i];
        n.y += n.vy * dt;
        if (n.y - n.r > CONFIG.WORLD_HEIGHT) {
          n.y = -n.r;
          n.x = Math.random() * CONFIG.WORLD_WIDTH;
        }
      }

      for (let i = 0; i < this.stars.length; i++) {
        const star = this.stars[i];
        star.y += star.speed * dt;
        if (star.y > CONFIG.WORLD_HEIGHT) {
          star.y = 0;
          star.x = Math.random() * CONFIG.WORLD_WIDTH;
        }
      }

      if (this.state === GameState.WAITING_START) return;
      if (this.state !== GameState.PLAYING) return;

      // 2. Movimiento por teclado en PC
      if (this.keys.left) {
        this.player.targetX -= CONFIG.PLAYER_SPEED * dt;
      }
      if (this.keys.right) {
        this.player.targetX += CONFIG.PLAYER_SPEED * dt;
      }
      if (this.keys.up) {
        this.player.targetY -= CONFIG.PLAYER_SPEED * dt;
      }
      if (this.keys.down) {
        this.player.targetY += CONFIG.PLAYER_SPEED * dt;
      }

      // 3. Suavizado (Lerp) de la nave y límites del mundo
      const marginX = this.player.width / 2;
      const marginY = this.player.height / 2;
      this.player.targetX = Math.max(marginX, Math.min(CONFIG.WORLD_WIDTH - marginX, this.player.targetX));
      this.player.targetY = Math.max(120, Math.min(CONFIG.WORLD_HEIGHT - marginY - 12, this.player.targetY));

      const lerpFactor = 1 - Math.exp(-dt * CONFIG.PLAYER_LERP);
      this.player.x += (this.player.targetX - this.player.x) * lerpFactor;
      this.player.y += (this.player.targetY - this.player.y) * lerpFactor;

      // 4. Invulnerabilidad temporal y duración de Hiper Láser
      if (this.player.invulnerableTimer > 0) {
        this.player.invulnerableTimer -= dt;
      }
      if (this.hyperTimer > 0) {
        this.hyperTimer -= dt;
      }

      // 4b. Estela de propulsión continua (Engine trails)
      this.engineTrailTimer += dt;
      if (this.engineTrailTimer >= 0.045) {
        this.engineTrailTimer = 0;
        this.spawnEngineSpark(this.player.x - 6, this.player.y + 14, '#38bdf8');
        this.spawnEngineSpark(this.player.x + 6, this.player.y + 14, '#38bdf8');
        if (this.drone.docked) {
          this.spawnEngineSpark(this.drone.x, this.drone.y + 8, '#00f0ff');
        }
      }

      // 4c. Actualización de Ondas de Choque y Textos Flotantes
      for (let i = 0; i < this.shockwaves.length; i++) {
        const sw = this.shockwaves[i];
        if (sw.active) {
          sw.life -= dt;
          sw.radius = (1 - (sw.life / sw.maxLife)) * sw.maxRadius;
          if (sw.life <= 0) sw.active = false;
        }
      }

      for (let i = 0; i < this.floatingTexts.length; i++) {
        const ft = this.floatingTexts[i];
        if (ft.active) {
          ft.y += ft.vy * dt;
          ft.life -= dt;
          if (ft.life <= 0) ft.active = false;
        }
      }

      // 5. Cadencia de disparo automático (Acelerada con Hiper Láser)
      this.player.fireTimer += dt;
      const fireInterval = this.hyperTimer > 0 ? CONFIG.PLAYER_FIRE_INTERVAL * 0.75 : CONFIG.PLAYER_FIRE_INTERVAL;
      if (this.player.fireTimer >= fireInterval) {
        this.player.fireTimer = 0;
        this.spawnPlayerBullet();
      }

      // 6. Actualizar proyectiles del jugador
      for (let i = 0; i < this.bullets.length; i++) {
        const b = this.bullets[i];
        if (b.active) {
          b.y += b.vy * dt;
          if (b.y < -20) {
            b.active = false;
          }
        }
      }

      // 7. Dinámica de la Formación Viva (Vaivén y Respiración)
      this.formationSwayTimer += dt * CONFIG.FORMATION_SWAY_SPEED;
      this.formationBreathTimer += dt * CONFIG.FORMATION_BREATH_SPEED;
      if (this.waveIntroTimer > 0) {
        this.waveIntroTimer -= dt;
      }

      // 8. Despliegue de Escuadras Coreografiadas (Entrada por Curvas Bézier)
      for (let gi = 0; gi < this.pendingGroups.length; gi++) {
        const group = this.pendingGroups[gi];
        if (group.isComplete) continue;

        group.nextSpawnTimer -= dt;
        while (group.nextSpawnTimer <= 0 && group.spawnIndex < group.slots.length) {
          const targetSlot = group.slots[group.spawnIndex];
          this.spawnEnemyInGroup(group, targetSlot);
          group.spawnIndex++;
          group.nextSpawnTimer += group.staggerDelay;
        }

        if (group.spawnIndex >= group.slots.length) {
          group.isComplete = true;
        }
      }

      // 9. Actualización de Estados de Enemigos (Entrada Bézier, Formación, Picadas y Retornos)
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (!e.active) continue;

        if (e.state === 'ENTERING') {
          e.t += dt / e.curveDuration;
          const isBonus = this.currentWaveConfig && this.currentWaveConfig.isBonus;
          const targetPos = isBonus
            ? (window.OleadasModule && window.OleadasModule.getBonusExitPos
                ? window.OleadasModule.getBonusExitPos(e.trajectory ? e.trajectory.id : '', { row: e.assignedRow, col: e.assignedCol })
                : { x: CONFIG.WORLD_WIDTH / 2, y: CONFIG.WORLD_HEIGHT + 70 })
            : this.getSlotWorldPos(e.assignedRow, e.assignedCol);

          if (window.OleadasModule && e.trajectory) {
            const pt = window.OleadasModule.evaluateCubicBezier(
              e.trajectory.p0,
              e.trajectory.p1,
              e.trajectory.p2,
              targetPos,
              Math.min(1, e.t)
            );
            e.x = pt.x;
            e.y = pt.y;
            e.heading = pt.angle;
          }

          e.flutterPhase += dt * 9;

          if (isBonus) {
            if (e.t >= 1 || e.y > CONFIG.WORLD_HEIGHT + 45 || e.x < -70 || e.x > CONFIG.WORLD_WIDTH + 70) {
              e.active = false;
              e.state = 'INACTIVE';
            }
          } else {
            if (e.t >= 1) {
              e.t = 1;
              e.state = 'FORMATION';
              e.heading = Math.PI;
            }
          }
        } else if (e.state === 'FORMATION') {
          const slotPos = this.getSlotWorldPos(e.assignedRow, e.assignedCol);
          e.x = slotPos.x;
          e.y = slotPos.y;
          e.heading = Math.PI;
          e.flutterPhase += dt * 6;
        } else if (e.state === 'DIVING') {
          e.t += dt / e.curveDuration;
          if (window.OleadasModule && e.divePoints) {
            const pt = window.OleadasModule.evaluateCubicBezier(
              e.divePoints.p0,
              e.divePoints.p1,
              e.divePoints.p2,
              e.divePoints.p3,
              Math.min(1, e.t)
            );
            e.x = pt.x;
            e.y = pt.y;
            e.heading = pt.angle;
          }
          e.flutterPhase += dt * 10;

          if (Math.random() < 0.3) {
            this.spawnEngineSpark(e.x, e.y - 8, '#f59e0b');
          }

          if (!e.hasShot && e.t >= e.shootRatio && (!this.currentWaveConfig || !this.currentWaveConfig.isBonus)) {
            e.hasShot = true;
            this.spawnEnemyBullet(e.x, e.y);
          }

          if (e.t >= 1 || e.y > CONFIG.WORLD_HEIGHT + 40) {
            e.state = 'RETURNING';
            e.t = 0;
            e.curveDuration = 1.6;
            e.returnStart = {
              x: Math.max(30, Math.min(CONFIG.WORLD_WIDTH - 30, e.x)),
              y: -35
            };
            e.x = e.returnStart.x;
            e.y = e.returnStart.y;
            e.heading = Math.PI;
          }
        } else if (e.state === 'RETURNING') {
          e.t += dt / e.curveDuration;
          const slotPos = this.getSlotWorldPos(e.assignedRow, e.assignedCol);
          if (window.OleadasModule && e.returnStart) {
            const p0 = e.returnStart;
            const p1 = { x: e.returnStart.x, y: 55 };
            const p2 = { x: slotPos.x, y: slotPos.y - 45 };
            const p3 = slotPos;
            const pt = window.OleadasModule.evaluateCubicBezier(p0, p1, p2, p3, Math.min(1, e.t));
            e.x = pt.x;
            e.y = pt.y;
            e.heading = pt.angle;
          }
          e.flutterPhase += dt * 7;

          if (e.t >= 1) {
            e.t = 1;
            e.state = 'FORMATION';
            e.heading = Math.PI;
            e.x = slotPos.x;
            e.y = slotPos.y;
          }
        }
      }

      // 10. Programador de Picadas de la Formación Viva
      const isBonusStage = this.currentWaveConfig && this.currentWaveConfig.isBonus;
      if (!isBonusStage && !this.boss.active) {
        this.diveCooldown -= dt;
        if (this.diveCooldown <= 0) {
          const candidates = this.enemies.filter(e => e.active && e.state === 'FORMATION');
          if (candidates.length > 0 && window.OleadasModule && window.OleadasModule.DIVE_PROFILES) {
            const d = CONFIG.DIFFICULTIES[this.difficulty] || CONFIG.DIFFICULTIES.PILOTO;
            const diveCount = (this.wave >= 3 && Math.random() < (0.45 * d.bulletSpeedMult) && candidates.length >= 2) ? 2 : 1;
            const profiles = window.OleadasModule.DIVE_PROFILES;

            for (let di = 0; di < diveCount && candidates.length > 0; di++) {
              const pickIdx = Math.floor(Math.random() * candidates.length);
              const candidate = candidates.splice(pickIdx, 1)[0];
              const profile = profiles[Math.floor(Math.random() * profiles.length)];

              candidate.state = 'DIVING';
              candidate.t = 0;
              candidate.curveDuration = Math.max(1.8, profile.duration - Math.min(0.7, (this.wave - 1) * 0.08));
              candidate.shootRatio = profile.shootRatio;
              candidate.hasShot = false;
              candidate.divePoints = profile.calcPoints(
                { x: candidate.x, y: candidate.y },
                { x: this.player.x, y: this.player.y }
              );
            }
          }
          const diffCfg = CONFIG.DIFFICULTIES[this.difficulty] || CONFIG.DIFFICULTIES.PILOTO;
          this.diveCooldown = Math.max(1.1, (CONFIG.DIVE_COOLDOWN_BASE - (this.wave - 1) * 0.16) * diffCfg.diveCooldownMult + (Math.random() * 0.6 - 0.3));
        }
      }

      // 10b. Dinámica y Ataques del Jefe de Sector: Coloso Cuántico Aegis
      if (this.boss.active) {
        this.boss.y += (this.boss.targetY - this.boss.y) * (1 - Math.exp(-dt * 2.2));
        this.boss.x += this.boss.vx * dt;
        if (this.boss.x < 80) {
          this.boss.x = 80;
          this.boss.vx = Math.abs(this.boss.vx);
        } else if (this.boss.x > CONFIG.WORLD_WIDTH - 80) {
          this.boss.x = CONFIG.WORLD_WIDTH - 80;
          this.boss.vx = -Math.abs(this.boss.vx);
        }
        this.boss.flutterPhase += dt * 4;

        this.boss.shootTimer -= dt;
        if (this.boss.shootTimer <= 0) {
          const d = CONFIG.DIFFICULTIES[this.difficulty] || CONFIG.DIFFICULTIES.PILOTO;
          if (this.boss.leftWingHp > 0) {
            this.spawnEnemyBullet(this.boss.x - 44, this.boss.y + 12);
          }
          if (this.boss.rightWingHp > 0) {
            this.spawnEnemyBullet(this.boss.x + 44, this.boss.y + 12);
          }

          const spreadAngles = [-0.28, 0, 0.28];
          const targetAngle = Math.atan2(this.player.y - this.boss.y, this.player.x - this.boss.x);
          spreadAngles.forEach(offset => {
            const angle = targetAngle + offset;
            const eb = this.enemyBullets.find(b => !b.active);
            if (eb) {
              eb.x = this.boss.x;
              eb.y = this.boss.y + 16;
              const spd = (CONFIG.ENEMY_BULLET_SPEED || 260) * d.bulletSpeedMult * 0.95;
              eb.vx = Math.cos(angle) * spd;
              eb.vy = Math.sin(angle) * spd;
              eb.radius = 4.5;
              eb.active = true;
            }
          });

          this.playEnemyShootSound();
          this.boss.shootTimer = Math.max(1.1, 2.3 - Math.min(0.8, (this.wave / 5) * 0.2));
        }

        // Colisiones de proyectiles contra el Jefe (Alas y Núcleo)
        for (let bi = 0; bi < this.bullets.length; bi++) {
          const b = this.bullets[bi];
          if (!b.active) continue;

          if (this.boss.leftWingHp > 0) {
            const wdx = b.x - (this.boss.x - 42);
            const wdy = b.y - (this.boss.y + 4);
            if (wdx * wdx + wdy * wdy <= 24 * 24) {
              b.active = false;
              this.boss.leftWingHp -= CONFIG.BULLET_DAMAGE;
              this.stats.shotsHit++;
              this.spawnExplosionParticles(b.x, b.y, '#f59e0b', 5);
              this.playHitSound();
              if (this.boss.leftWingHp <= 0) {
                this.spawnShockwave(this.boss.x - 42, this.boss.y + 4, '#f59e0b', 50);
                this.spawnFloatingText(this.boss.x - 42, this.boss.y - 12, '+300 ¡ALA IZQ!', '#f59e0b');
                this.score += 300 * this.streak;
                this.playExplosionSound();
              }
              continue;
            }
          }

          if (this.boss.rightWingHp > 0) {
            const wdx = b.x - (this.boss.x + 42);
            const wdy = b.y - (this.boss.y + 4);
            if (wdx * wdx + wdy * wdy <= 24 * 24) {
              b.active = false;
              this.boss.rightWingHp -= CONFIG.BULLET_DAMAGE;
              this.stats.shotsHit++;
              this.spawnExplosionParticles(b.x, b.y, '#f59e0b', 5);
              this.playHitSound();
              if (this.boss.rightWingHp <= 0) {
                this.spawnShockwave(this.boss.x + 42, this.boss.y + 4, '#f59e0b', 50);
                this.spawnFloatingText(this.boss.x + 42, this.boss.y - 12, '+300 ¡ALA DER!', '#f59e0b');
                this.score += 300 * this.streak;
                this.playExplosionSound();
              }
              continue;
            }
          }

          const cdx = b.x - this.boss.x;
          const cdy = b.y - this.boss.y;
          if (cdx * cdx + cdy * cdy <= 32 * 32) {
            b.active = false;
            this.boss.hp -= CONFIG.BULLET_DAMAGE;
            this.stats.shotsHit++;
            this.spawnExplosionParticles(b.x, b.y, '#ec4899', 5);
            this.playHitSound();

            if (this.boss.hp <= 0) {
              this.boss.active = false;
              for (let k = 0; k < 4; k++) {
                this.spawnShockwave(this.boss.x + (k - 1.5) * 24, this.boss.y, '#ec4899', 75);
              }
              this.spawnExplosionParticles(this.boss.x, this.boss.y, '#ec4899', 36);
              this.spawnExplosionParticles(this.boss.x, this.boss.y, '#f59e0b', 24);
              const d = CONFIG.DIFFICULTIES[this.difficulty] || CONFIG.DIFFICULTIES.PILOTO;
              const killPts = Math.round(this.boss.scoreKill * d.scoreMult * this.streak);
              this.score += killPts;
              this.spawnFloatingText(this.boss.x, this.boss.y - 20, `+${killPts} ¡JEFE DESTRUIDO!`, '#ec4899');
              this.playExplosionSound();
              this.playBonusFanfare(true);
            }
          }
        }
      }

      // 11. Mecánica Propia: Cápsula, Dron Satélite y Orbes de Poder
      if (this.capsule.active) {
        this.capsule.y += this.capsule.vy * dt;
        this.capsule.pulsePhase += dt * 4.5;
        this.capsule.x += Math.sin(this.capsule.pulsePhase * 0.9) * 25 * dt;

        if (this.capsule.y > CONFIG.WORLD_HEIGHT + 30) {
          this.capsule.active = false;
        } else {
          const dx = this.player.x - this.capsule.x;
          const dy = this.player.y - this.capsule.y;
          const pickupDist = this.player.radius + this.capsule.radius + 6;
          if (dx * dx + dy * dy <= pickupDist * pickupDist) {
            this.capsule.active = false;
            this.drone.docked = true;
            this.drone.hp = 1;
            this.drone.side = (this.capsule.x < this.player.x) ? -1 : 1;
            this.drone.x = this.player.x + (this.drone.side * 28);
            this.drone.y = this.player.y + 2;
            this.drone.rotorAngle = 0;
            this.spawnShockwave(this.drone.x, this.drone.y, '#38bdf8', 45);
            this.spawnFloatingText(this.drone.x, this.drone.y - 18, '¡DRON DE ESCOLTA!', '#38bdf8');
            this.playDroneDockSound();
            if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(35);
            this.spawnExplosionParticles(this.drone.x, this.drone.y, '#38bdf8', 16);
          }
        }
      }

      // Orbes de Energía (Power-ups)
      for (let i = 0; i < this.powerups.length; i++) {
        const pu = this.powerups[i];
        if (!pu.active) continue;

        pu.y += pu.vy * dt;
        pu.pulse += dt * 4;

        if (pu.y > CONFIG.WORLD_HEIGHT + 20) {
          pu.active = false;
          continue;
        }

        const dx = this.player.x - pu.x;
        const dy = this.player.y - pu.y;
        const grabDist = this.player.radius + pu.radius + 6;

        if (dx * dx + dy * dy <= grabDist * grabDist) {
          pu.active = false;
          this.spawnShockwave(pu.x, pu.y, '#00f0ff', 45);

          if (pu.type === 'PEM') {
            for (let eb of this.enemyBullets) {
              if (eb.active) {
                eb.active = false;
                this.spawnExplosionParticles(eb.x, eb.y, '#38bdf8', 6);
              }
            }
            this.spawnShockwave(this.player.x, this.player.y, '#38bdf8', 120);
            this.spawnFloatingText(this.player.x, this.player.y - 20, '¡PULSO PEM DETONADO!', '#38bdf8');
            this.playExplosionSound();
          } else if (pu.type === 'HYPER') {
            this.hyperTimer = 7.0;
            this.spawnFloatingText(this.player.x, this.player.y - 20, '¡HIPER LÁSER!', '#facc15');
            this.playDroneDockSound();
          } else if (pu.type === 'SHIELD') {
            this.shieldActive = true;
            this.spawnFloatingText(this.player.x, this.player.y - 20, '¡ESCUDO DEFLECTOR!', '#00f0ff');
            this.playDroneDockSound();
          }
          if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(30);
        }
      }

      if (this.drone.docked) {
        this.drone.x = this.player.x + (this.drone.side * 28);
        this.drone.y = this.player.y + 2;
        this.drone.rotorAngle += dt * 8;
      }

      // 12. Actualización de Proyectiles Hostiles (Plasma Enemigo)
      for (let i = 0; i < this.enemyBullets.length; i++) {
        const eb = this.enemyBullets[i];
        if (!eb.active) continue;

        eb.x += eb.vx * dt;
        eb.y += eb.vy * dt;

        if (eb.y > CONFIG.WORLD_HEIGHT + 20 || eb.y < -20 || eb.x < -20 || eb.x > CONFIG.WORLD_WIDTH + 20) {
          eb.active = false;
          continue;
        }

        // Colisión con Dron Satélite de Escolta
        if (this.drone.docked) {
          const ddx = eb.x - this.drone.x;
          const ddy = eb.y - this.drone.y;
          const dDist = eb.radius + this.drone.radius;
          if (ddx * ddx + ddy * ddy <= dDist * dDist) {
            eb.active = false;
            this.drone.docked = false;
            this.drone.hp = 0;
            this.spawnShockwave(this.drone.x, this.drone.y, '#38bdf8', 45);
            this.spawnFloatingText(this.drone.x, this.drone.y - 15, '¡DRON PERDIDO!', '#38bdf8');
            this.spawnExplosionParticles(this.drone.x, this.drone.y, '#38bdf8', 18);
            this.playDroneLostSound();
            if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(40);
            continue;
          }
        }

        // Colisión con la Nave del Jugador (o Escudo Deflector)
        if (this.player.invulnerableTimer <= 0) {
          const pdx = eb.x - this.player.x;
          const pdy = eb.y - this.player.y;
          const pDist = eb.radius + this.player.radius;
          if (pdx * pdx + pdy * pdy <= pDist * pDist) {
            eb.active = false;
            this.damagePlayer();
          }
        }
      }

      // 13. Detección de colisiones (Proyectiles del jugador vs Enemigos)
      for (let bi = 0; bi < this.bullets.length; bi++) {
        const b = this.bullets[bi];
        if (!b.active) continue;

        for (let ei = 0; ei < this.enemies.length; ei++) {
          const e = this.enemies[ei];
          if (!e.active) continue;

          const dx = b.x - e.x;
          const dy = b.y - e.y;
          const hitDist = b.radius + e.radius;

          if (dx * dx + dy * dy <= hitDist * hitDist) {
            b.active = false;
            e.hp -= CONFIG.BULLET_DAMAGE;
            this.stats.shotsHit++;

            const sparkColor = e.typeData ? e.typeData.primaryColor : '#38bdf8';
            this.spawnExplosionParticles(b.x, b.y, sparkColor, 5);
            this.playHitSound();

            if (e.hp <= 0) {
              const wasDiving = (e.state === 'DIVING');
              e.active = false;
              e.state = 'INACTIVE';

              const d = CONFIG.DIFFICULTIES[this.difficulty] || CONFIG.DIFFICULTIES.PILOTO;
              const baseScore = wasDiving
                ? (e.typeData ? e.typeData.scoreDiving : 100)
                : (e.typeData ? e.typeData.scoreFormation : 40);

              const earned = Math.round(baseScore * this.streak * d.scoreMult);
              this.score += earned;
              this.killsWithoutDamage++;

              if (wasDiving) {
                this.spawnShockwave(e.x, e.y, sparkColor, 45);
                this.spawnFloatingText(e.x, e.y - 12, `+${earned} ¡PICADA!`, '#fbbf24');
              } else {
                this.spawnFloatingText(e.x, e.y - 10, `+${earned}`, sparkColor);
              }

              if (this.currentWaveConfig && this.currentWaveConfig.isBonus) {
                this.bonusHits++;
              }

              if (e.isCarrier && !this.drone.docked) {
                this.capsule.active = true;
                this.capsule.x = e.x;
                this.capsule.y = e.y;
                this.capsule.vy = 85;
                this.capsule.pulsePhase = 0;
                this.spawnShockwave(e.x, e.y, '#f59e0b', 60);
                this.spawnFloatingText(e.x, e.y - 18, '¡NÚCLEO DRON!', '#facc15');
              } else if (!e.isCarrier && (!this.currentWaveConfig || !this.currentWaveConfig.isBonus) && Math.random() < 0.12) {
                this.spawnPowerup(e.x, e.y);
              }

              if (this.killsWithoutDamage % 5 === 0 && this.streak < 5) {
                this.streak++;
                this.spawnFloatingText(this.player.x, this.player.y - 30, `¡RACHA x${this.streak}!`, '#c084fc');
              }

              this.spawnExplosionParticles(e.x, e.y, sparkColor, 16);
              this.playExplosionSound();
            }

            this.updateUI();
            break;
          }
        }
      }

      // 14. Detección de colisiones (Nave / Dron vs Enemigos)
      for (let ei = 0; ei < this.enemies.length; ei++) {
        const e = this.enemies[ei];
        if (!e.active) continue;

        if (this.drone.docked) {
          const ddx = this.drone.x - e.x;
          const ddy = this.drone.y - e.y;
          const dDist = this.drone.radius + e.radius;
          if (ddx * ddx + ddy * ddy <= dDist * dDist) {
            this.drone.docked = false;
            this.drone.hp = 0;
            e.active = false;
            e.state = 'INACTIVE';
            this.spawnShockwave(this.drone.x, this.drone.y, '#38bdf8', 50);
            this.spawnFloatingText(this.drone.x, this.drone.y - 15, '¡DRON PERDIDO!', '#38bdf8');
            this.spawnExplosionParticles(this.drone.x, this.drone.y, '#38bdf8', 20);
            this.spawnExplosionParticles(e.x, e.y, e.typeData ? e.typeData.primaryColor : '#f59e0b', 16);
            this.playDroneLostSound();
            this.playExplosionSound();
            if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(45);
            continue;
          }
        }

        const dx = this.player.x - e.x;
        const dy = this.player.y - e.y;
        const colDist = this.player.radius + e.radius;

        if (dx * dx + dy * dy <= colDist * colDist) {
          e.active = false;
          e.state = 'INACTIVE';
          this.damagePlayer();
          break;
        }
      }

      // 15. Verificación de Oleada Completada
      const allGroupsSpawned = this.pendingGroups.every(g => g.isComplete);
      let activeEnemiesCount = 0;
      for (let ei = 0; ei < this.enemies.length; ei++) {
        if (this.enemies[ei].active) activeEnemiesCount++;
      }

      if (allGroupsSpawned && activeEnemiesCount === 0 && !this.boss.active) {
        if (!this.stageReport) {
          if (this.currentWaveConfig && this.currentWaveConfig.isBonus) {
            const isPerfect = (this.bonusHits >= this.bonusTotal && this.bonusTotal > 0);
            const bonusPts = isPerfect ? CONFIG.BONUS_PERFECT_POINTS : this.bonusHits * CONFIG.BONUS_HIT_POINTS;
            this.score += bonusPts;
            this.playBonusFanfare(isPerfect);
            this.stageReport = {
              isBonus: true,
              hits: this.bonusHits,
              total: this.bonusTotal,
              isPerfect,
              bonusPts
            };
          } else {
            const accuracy = this.stats.shotsFired > 0
              ? Math.round((this.stats.shotsHit / this.stats.shotsFired) * 100)
              : 0;
            const waveBonus = 200 * this.wave;
            this.score += waveBonus;
            this.playBonusFanfare(false);
            this.stageReport = {
              isBonus: false,
              wave: this.wave,
              accuracy,
              shotsFired: this.stats.shotsFired,
              shotsHit: this.stats.shotsHit,
              bonusPts: waveBonus
            };
          }
          this.stageReportTimer = 2.8;
          this.updateUI();
        }

        if (this.stageReportTimer > 0) {
          this.stageReportTimer -= dt;
          if (this.stageReportTimer <= 0) {
            this.stageReport = null;
            this.startWave(this.wave + 1);
          }
        }
      }
    }

    // ==========================================================================
    // 3. RENDERIZADO VECTORIAL EN CANVAS
    // ==========================================================================
    gameLoop(time = 0) {
      const delta = Math.min((time - this.lastTime) / 1000, 0.08);
      this.lastTime = time;

      this.update(delta);

      // Actualizar partículas
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
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

      // Temblor de pantalla
      if (this.shakeTimer > 0) {
        const shakeMag = (this.shakeTimer / CONFIG.SHAKE_DURATION) * 7;
        const sx = (Math.random() * 2 - 1) * shakeMag;
        const sy = (Math.random() * 2 - 1) * shakeMag;
        ctx.translate(sx, sy);
      }

      // Escalar al espacio virtual del mundo
      ctx.scale(this.scale, this.scale);

      // 0. Nebulosas interestelares (Glow profundo con parallax suave)
      if (ctx.createRadialGradient) {
        for (let i = 0; i < this.nebulae.length; i++) {
          const n = this.nebulae[i];
          const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
          grad.addColorStop(0, `rgba(${n.color}, ${n.alpha})`);
          grad.addColorStop(0.65, `rgba(${n.color}, ${n.alpha * 0.4})`);
          grad.addColorStop(1, `rgba(${n.color}, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 1. Estrellas parallax con glow tenue
      for (let i = 0; i < this.stars.length; i++) {
        const s = this.stars[i];
        ctx.fillStyle = `rgba(224, 242, 254, ${s.alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Proyectiles del jugador (Láseres neón con estela brillante)
      ctx.save();
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < this.bullets.length; i++) {
        const b = this.bullets[i];
        if (b.active) {
          ctx.beginPath();
          ctx.ellipse(b.x, b.y, 2.5, 9, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // 3. Proyectiles hostiles (Plasma carmesí/ámbar con estela de calor)
      ctx.save();
      for (let i = 0; i < this.enemyBullets.length; i++) {
        const eb = this.enemyBullets[i];
        if (eb.active) {
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#f87171';
          ctx.beginPath();
          ctx.arc(eb.x, eb.y, eb.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(eb.x, eb.y, eb.radius * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // 4. Cápsula flotante del Núcleo Satélite de Escolta
      if (this.capsule.active) {
        ctx.save();
        ctx.translate(this.capsule.x, this.capsule.y);
        const pulse = 1.0 + Math.sin(this.capsule.pulsePhase) * 0.16;
        ctx.scale(pulse, pulse);

        // Halo esférico de contención anti-grav
        ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.6;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(0, 0, this.capsule.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Núcleo cuántico rotatorio
        ctx.save();
        ctx.rotate(this.capsule.pulsePhase * 1.5);
        ctx.fillStyle = '#fef08a';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(7, 0);
        ctx.lineTo(0, 7);
        ctx.lineTo(-7, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Rótulo orbital
        ctx.textAlign = 'center';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#38bdf8';
        ctx.shadowBlur = 6;
        ctx.fillText('DRON', 0, 19);

        ctx.restore();
      }

      // 5. Enemigos de Formación y Picadas (Diseños Geométricos Originales)
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (e.active) {
          ctx.save();
          ctx.translate(e.x, e.y);
          // Rotar según la dirección del vector de avance
          ctx.rotate(e.heading - Math.PI / 2);

          if (e.type === 'PRISMA') {
            this.drawEnemyPrisma(ctx, e);
          } else if (e.type === 'CENTINELA') {
            this.drawEnemyCentinela(ctx, e);
          } else if (e.type === 'VERTICE') {
            this.drawEnemyVertice(ctx, e);
          } else {
            this.drawEnemyPrisma(ctx, e);
          }

          ctx.restore();

          // Indicador de enemigo portador del dron (mira orbital animada)
          if (e.isCarrier && !this.drone.docked) {
            ctx.save();
            ctx.translate(e.x, e.y);
            const ringPhase = Date.now() / 240;
            const ringScale = 1.0 + Math.sin(ringPhase) * 0.14;
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.8;
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(0, 0, (e.radius + 6) * ringScale, 0, Math.PI * 2);
            ctx.stroke();

            // Muescas cardinales de fijación de blanco
            for (let k = 0; k < 4; k++) {
              const ka = ringPhase + k * (Math.PI / 2);
              const r1 = (e.radius + 4) * ringScale;
              const r2 = (e.radius + 10) * ringScale;
              ctx.beginPath();
              ctx.moveTo(Math.cos(ka) * r1, Math.sin(ka) * r1);
              ctx.lineTo(Math.cos(ka) * r2, Math.sin(ka) * r2);
              ctx.stroke();
            }
            ctx.restore();
          }
        }
      }

      // 5b. Jefe de Sector: Coloso Cuántico Aegis
      if (this.boss.active) {
        this.drawBoss(ctx);
      }

      // 5c. Power-ups (Orbes y Contenedores de Energía)
      for (let i = 0; i < this.powerups.length; i++) {
        const pu = this.powerups[i];
        if (pu.active) {
          this.drawPowerup(ctx, pu);
        }
      }

      // 5d. Ondas de Choque Neón
      for (let i = 0; i < this.shockwaves.length; i++) {
        const sw = this.shockwaves[i];
        if (sw.active) {
          ctx.save();
          const progress = sw.life / sw.maxLife;
          ctx.globalAlpha = Math.max(0, progress);
          ctx.strokeStyle = sw.color;
          ctx.shadowColor = sw.color;
          ctx.shadowBlur = 14;
          ctx.lineWidth = 2.4 * progress;
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 6. Nave del jugador y Dron Satélite de Escolta
      const isInvulnerable = this.player.invulnerableTimer > 0;
      const showShip = !isInvulnerable || Math.floor(Date.now() / 90) % 2 === 0;

      // 6a. Dron de Escolta Acoplado (si está activo)
      if (this.drone.docked) {
        ctx.save();
        ctx.translate(this.drone.x, this.drone.y);

        // Estela/plasma del micro-propulsor
        const dflame = 7 + Math.random() * 5;
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(-3, 8);
        ctx.lineTo(0, 8 + dflame);
        ctx.lineTo(3, 8);
        ctx.closePath();
        ctx.fill();

        // Chasis del Dron de Escolta
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, -11);          // Morro de cañón
        ctx.lineTo(8, -2);           // Flanco exterior
        ctx.lineTo(10, 8);           // Ala exterior
        ctx.lineTo(4, 9);            // Tobera exterior
        ctx.lineTo(0, 6);            // Centro posterior
        ctx.lineTo(-4, 9);           // Tobera interior
        ctx.lineTo(-10, 8);          // Ala interior
        ctx.lineTo(-8, -2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Rotor/núcleo rotatorio
        ctx.save();
        ctx.rotate(this.drone.rotorAngle);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-4, 0); ctx.lineTo(4, 0);
        ctx.moveTo(0, -4); ctx.lineTo(0, 4);
        ctx.stroke();
        ctx.restore();

        // Cañón láser auxiliar
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -11, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 6b. Nave del Jugador
      if (showShip) {
        ctx.save();
        ctx.translate(this.player.x, this.player.y);

        // Llama del propulsor
        const flameLength = 12 + Math.random() * 8;
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(-6, 14);
        ctx.lineTo(0, 14 + flameLength);
        ctx.lineTo(6, 14);
        ctx.closePath();
        ctx.fill();

        // Chasis de la nave
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(0, -18);        // Morro
        ctx.lineTo(10, 0);         // Quilla derecha
        ctx.lineTo(17, 12);        // Ala derecha
        ctx.lineTo(8, 14);         // Tobera derecha
        ctx.lineTo(0, 10);         // Centro trasero
        ctx.lineTo(-8, 14);        // Tobera izquierda
        ctx.lineTo(-17, 12);       // Ala izquierda
        ctx.lineTo(-10, 0);        // Quilla izquierda
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cabina bioluminiscente
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.ellipse(0, -3, 3.5, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 6c. Escudo Deflector Cuántico (si está activo)
      if (this.shieldActive && showShip) {
        ctx.save();
        const pulse = 1.0 + Math.sin(Date.now() / 120) * 0.08;
        ctx.strokeStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 16;
        ctx.lineWidth = 2.0;
        ctx.fillStyle = 'rgba(0, 240, 255, 0.16)';
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, (this.player.radius + 10) * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        for (let k = 0; k < 6; k++) {
          const ang = (Date.now() / 500) + k * (Math.PI / 3);
          const hx = this.player.x + Math.cos(ang) * (this.player.radius + 10) * pulse;
          const hy = this.player.y + Math.sin(ang) * (this.player.radius + 10) * pulse;
          ctx.fillStyle = '#00f0ff';
          ctx.beginPath();
          ctx.arc(hx, hy, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 7. Partículas de impacto y explosión
      ctx.save();
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
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

      // 8. Marcador de Etapa de Bonificación en Pantalla
      if (this.currentWaveConfig && this.currentWaveConfig.isBonus) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillStyle = '#facc15';
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 8;
        ctx.fillText(`ETAPA BONIFICACIÓN: ${this.bonusHits} / ${this.bonusTotal} IMPACTOS`, CONFIG.WORLD_WIDTH / 2, 42);
        ctx.restore();
      }

      // 9. Banner de Anuncio de Oleada Coreografiada
      if (this.waveIntroTimer > 0) {
        ctx.save();
        const alpha = Math.min(1, this.waveIntroTimer * 1.6);
        ctx.globalAlpha = alpha;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 12;
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(this.waveIntroTitle, CONFIG.WORLD_WIDTH / 2, CONFIG.WORLD_HEIGHT / 2 - 24);

        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.shadowBlur = 0;
        ctx.fillText(
          this.currentWaveConfig && this.currentWaveConfig.isBonus
            ? '¡DESTRUYE TODAS LAS NAVES SIN DISPAROS HOSTILES!'
            : 'ENLACE DE FORMACIÓN ORBITAL DETECTADO',
          CONFIG.WORLD_WIDTH / 2,
          CONFIG.WORLD_HEIGHT / 2 - 4
        );
        ctx.restore();
      }

      // 10. Banner de Reporte de Precisión / Resultados de Etapa
      if (this.stageReport && this.stageReportTimer > 0) {
        ctx.save();
        const alpha = Math.min(1, this.stageReportTimer * 1.5);
        ctx.globalAlpha = alpha;
        ctx.textAlign = 'center';

        const bx = CONFIG.WORLD_WIDTH / 2;
        const by = CONFIG.WORLD_HEIGHT / 2 - 20;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
        ctx.strokeStyle = this.stageReport.isBonus ? '#facc15' : '#38bdf8';
        ctx.lineWidth = 2;
        ctx.shadowColor = this.stageReport.isBonus ? '#eab308' : '#00f0ff';
        ctx.shadowBlur = 18;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(bx - 175, by - 52, 350, 104, 12);
        } else {
          ctx.rect(bx - 175, by - 52, 350, 104);
        }
        ctx.fill();
        ctx.stroke();

        if (this.stageReport.isBonus) {
          ctx.font = 'bold 15px sans-serif';
          ctx.fillStyle = this.stageReport.isPerfect ? '#4ade80' : '#facc15';
          ctx.shadowBlur = 10;
          ctx.fillText(
            this.stageReport.isPerfect ? '¡BONIFICACIÓN PERFECTA!' : 'ETAPA DE BONIFICACIÓN CONCLUIDA',
            bx, by - 22
          );

          ctx.font = '13px sans-serif';
          ctx.fillStyle = '#e2e8f0';
          ctx.shadowBlur = 0;
          ctx.fillText(`IMPACTOS: ${this.stageReport.hits} DE ${this.stageReport.total} NAVES`, bx, by + 4);

          ctx.font = 'bold 14px sans-serif';
          ctx.fillStyle = '#38bdf8';
          ctx.shadowBlur = 6;
          ctx.fillText(`BONIFICACIÓN: +${this.stageReport.bonusPts} PUNTOS`, bx, by + 28);
        } else {
          ctx.font = 'bold 15px sans-serif';
          ctx.fillStyle = '#38bdf8';
          ctx.shadowBlur = 10;
          ctx.fillText(`¡OLEADA ${this.stageReport.wave} COMPLETADA!`, bx, by - 22);

          ctx.font = '13px sans-serif';
          ctx.fillStyle = '#e2e8f0';
          ctx.shadowBlur = 0;
          ctx.fillText(
            `PRECISIÓN: ${this.stageReport.accuracy}% (${this.stageReport.shotsHit}/${this.stageReport.shotsFired} DISPAROS)`,
            bx, by + 4
          );

          ctx.font = 'bold 14px sans-serif';
          ctx.fillStyle = '#4ade80';
          ctx.shadowBlur = 6;
          ctx.fillText(`BONO ORBITAL: +${this.stageReport.bonusPts} PUNTOS`, bx, by + 28);
        }

        ctx.restore();
      }

      // 11. Barra de Vida del Jefe de Sector
      if (this.boss.active) {
        this.drawBossHealthBar(ctx);
      }

      // 12. Textos Flotantes de Puntuación y Combate
      ctx.save();
      ctx.textAlign = 'center';
      for (let i = 0; i < this.floatingTexts.length; i++) {
        const ft = this.floatingTexts[i];
        if (ft.active) {
          ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
          ctx.font = 'bold 12px sans-serif';
          ctx.fillStyle = ft.color;
          ctx.shadowColor = ft.color;
          ctx.shadowBlur = 8;
          ctx.fillText(ft.text, ft.x, ft.y);
        }
      }
      ctx.restore();

      // 13. Alerta Crítica: 1 sola vida (Vignette perimetral roja pulsante)
      if (this.lives === 1 && this.state === GameState.PLAYING) {
        ctx.save();
        const pulse = 0.22 + Math.sin(Date.now() / 180) * 0.14;
        ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
        ctx.lineWidth = 14;
        ctx.strokeRect(7, 7, CONFIG.WORLD_WIDTH - 14, CONFIG.WORLD_HEIGHT - 14);
        ctx.restore();
      }

      ctx.restore();
    }

    drawEnemyPrisma(ctx, e) {
      // Dardo Prisma: silueta afilada con alerones dinámicos oscilantes
      const flap = Math.sin(e.flutterPhase) * 2.6;
      ctx.shadowColor = e.typeData ? e.typeData.glowColor : 'rgba(245, 158, 11, 0.7)';
      ctx.shadowBlur = 8;

      // Alas exteriores en delta
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.7;

      ctx.beginPath();
      ctx.moveTo(0, 14);                // Morro delantero
      ctx.lineTo(-14, -8 + flap);       // Extremo de ala izquierda
      ctx.lineTo(-5, -12);              // Tobera izquierda
      ctx.lineTo(5, -12);               // Tobera derecha
      ctx.lineTo(14, -8 - flap);        // Extremo de ala derecha
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Quilla central trapezoide
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(-6, -4);
      ctx.lineTo(6, -4);
      ctx.closePath();
      ctx.fill();

      // Núcleo cuántico ámbar/amarillo
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, -2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    drawEnemyCentinela(ctx, e) {
      // Centinela Romboide: casco esmeralda con estabilizadores flotantes en contra-fase
      const flap = Math.sin(e.flutterPhase * 1.25) * 3.4;
      ctx.shadowColor = e.typeData ? e.typeData.glowColor : 'rgba(16, 185, 129, 0.7)';
      ctx.shadowBlur = 9;

      // Estabilizadores flotantes externos
      ctx.fillStyle = '#064e3b';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.6;

      ctx.beginPath();
      ctx.moveTo(-16 - flap, 0);
      ctx.lineTo(-12 - flap, -8);
      ctx.lineTo(-9 - flap, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(16 + flap, 0);
      ctx.lineTo(12 + flap, -8);
      ctx.lineTo(9 + flap, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Casco romboidal facetado
      ctx.fillStyle = '#022c22';
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(0, 15);      // Vértice inferior
      ctx.lineTo(11, 0);      // Vértice derecho
      ctx.lineTo(0, -14);     // Vértice superior
      ctx.lineTo(-11, 0);     // Vértice izquierdo
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Sensor óptico cian
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.ellipse(0, 0, 3.2, 5.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    drawEnemyVertice(ctx, e) {
      // Vértice Alfa: comandante hexagonal violeta/magenta con reactor coronal
      const pulse = Math.sin(e.flutterPhase * 1.5) * 1.6;
      ctx.shadowColor = e.typeData ? e.typeData.glowColor : 'rgba(168, 85, 247, 0.8)';
      ctx.shadowBlur = 12;

      // Corona exterior hexagonal
      ctx.fillStyle = '#2e1065';
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2.2;

      ctx.beginPath();
      ctx.moveTo(0, 17);
      ctx.lineTo(14, 8);
      ctx.lineTo(14, -8);
      ctx.lineTo(0, -16);
      ctx.lineTo(-14, -8);
      ctx.lineTo(-14, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Placas angulares magenta
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.moveTo(0, 11);
      ctx.lineTo(8, 2);
      ctx.lineTo(-8, 2);
      ctx.closePath();
      ctx.fill();

      // Reactor nuclear orbital pulsante
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, -3, 4 + pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    drawPowerup(ctx, pu) {
      ctx.save();
      ctx.translate(pu.x, pu.y);
      const pulseScale = 1.0 + Math.sin(pu.pulse) * 0.14;
      ctx.scale(pulseScale, pulseScale);

      let color = '#38bdf8';
      let label = 'PEM';
      if (pu.type === 'HYPER') {
        color = '#facc15';
        label = 'HIPER';
      } else if (pu.type === 'SHIELD') {
        color = '#00f0ff';
        label = 'ESCUDO';
      }

      ctx.shadowColor = color;
      ctx.shadowBlur = 12;

      // Halo perimetral
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.arc(0, 0, pu.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Icono interior según tipo
      if (pu.type === 'PEM') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(-3, 0);
        ctx.lineTo(2, 0);
        ctx.lineTo(-1, 6);
        ctx.stroke();
      } else if (pu.type === 'HYPER') {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(-4, -5); ctx.lineTo(0, -1); ctx.lineTo(-4, 3);
        ctx.moveTo(0, -5); ctx.lineTo(4, -1); ctx.lineTo(0, 3);
        ctx.stroke();
      } else if (pu.type === 'SHIELD') {
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const ang = (i * Math.PI) / 3;
          const sx = Math.cos(ang) * 6;
          const sy = Math.sin(ang) * 6;
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Rótulo inferior
      ctx.textAlign = 'center';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillStyle = color;
      ctx.shadowBlur = 4;
      ctx.fillText(label, 0, pu.radius + 9);

      ctx.restore();
    }

    drawBoss(ctx) {
      const b = this.boss;
      if (!b.active) return;

      ctx.save();
      ctx.translate(b.x, b.y);

      const flutter = Math.sin(b.flutterPhase) * 3;

      // 1. Ala Izquierda (b.x - 42, b.y + 4)
      ctx.save();
      ctx.translate(-42, 4 + flutter);
      if (b.leftWingHp > 0) {
        ctx.shadowColor = 'rgba(236, 72, 153, 0.7)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#1e1b4b';
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(-32, -4);
        ctx.lineTo(-24, 18);
        ctx.lineTo(-4, 22);
        ctx.lineTo(8, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cañón de plasma del ala
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(-2, 8, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Ala destruida (muñón humeante y metal retorcido)
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(-12, -2);
        ctx.lineTo(-8, 10);
        ctx.lineTo(6, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();

      // 2. Ala Derecha (b.x + 42, b.y + 4)
      ctx.save();
      ctx.translate(42, 4 - flutter);
      if (b.rightWingHp > 0) {
        ctx.shadowColor = 'rgba(236, 72, 153, 0.7)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#1e1b4b';
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(32, -4);
        ctx.lineTo(24, 18);
        ctx.lineTo(4, 22);
        ctx.lineTo(-8, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cañón de plasma del ala
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(2, 8, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Ala destruida
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(12, -2);
        ctx.lineTo(8, 10);
        ctx.lineTo(-6, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();

      // 3. Chasis Central Acorazado (Fortaleza Octagonal)
      ctx.save();
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2.4;

      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.lineTo(26, -18);
      ctx.lineTo(36, 6);
      ctx.lineTo(24, 26);
      ctx.lineTo(0, 32);
      ctx.lineTo(-24, 26);
      ctx.lineTo(-36, 6);
      ctx.lineTo(-26, -18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Placas blindadas secundarias
      ctx.fillStyle = '#3b0764';
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(18, -10);
      ctx.lineTo(22, 10);
      ctx.lineTo(0, 20);
      ctx.lineTo(-22, 10);
      ctx.lineTo(-18, -10);
      ctx.closePath();
      ctx.fill();

      // Reactor de Fusión Cuántica Central
      const corePulse = 1.0 + Math.sin(b.flutterPhase * 2.2) * 0.18;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 2, 9 * corePulse, 0, Math.PI * 2);
      ctx.fill();

      // Anillo de contención magnética
      ctx.save();
      ctx.rotate(b.flutterPhase * 1.5);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 2, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.restore();
      ctx.restore();
    }

    drawBossHealthBar(ctx) {
      const b = this.boss;
      if (!b.active) return;

      const barW = 240;
      const barH = 10;
      const bx = (CONFIG.WORLD_WIDTH - barW) / 2;
      const by = 26;

      ctx.save();

      // Rótulo del Jefe
      ctx.textAlign = 'center';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#ec4899';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 8;
      ctx.fillText('COLOSO CUÁNTICO AEGIS', CONFIG.WORLD_WIDTH / 2, by - 6);

      // Marco del contenedor de salud
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 1.5;
      ctx.fillRect(bx, by, barW, barH);
      ctx.strokeRect(bx, by, barW, barH);

      // Barra de vida del núcleo
      const ratio = Math.max(0, Math.min(1, b.hp / b.maxHp));
      const fillW = (barW - 2) * ratio;
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 6;
      ctx.fillRect(bx + 1, by + 1, fillW, barH - 2);

      // Indicadores de estado de las alas (Pips laterales)
      // Ala Izquierda
      ctx.fillStyle = b.leftWingHp > 0 ? '#fbbf24' : '#475569';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.fillRect(bx - 16, by, 10, barH);
      ctx.strokeRect(bx - 16, by, 10, barH);

      // Ala Derecha
      ctx.fillStyle = b.rightWingHp > 0 ? '#fbbf24' : '#475569';
      ctx.fillRect(bx + barW + 6, by, 10, barH);
      ctx.strokeRect(bx + barW + 6, by, 10, barH);

      ctx.restore();
    }

    // ==========================================================================
    // 4. ENTRADA Y CONTROLES (TOUCH OFFSET + MOUSE + KEYBOARD)
    // ==========================================================================
    initEvents() {
      const onResize = () => this.resizeCanvas();
      window.addEventListener('resize', onResize);
      window.addEventListener('orientationchange', () => setTimeout(onResize, 100));

      if (window.ResizeObserver) {
        const ro = new ResizeObserver(onResize);
        ro.observe(this.wrapper);
      }

      const targetArea = this.wrapper || this.canvas;

      // Control táctil móvil con OFFSET VERTICAL para no tapar la nave
      const handleTouch = (touch) => {
        const rect = this.canvas.getBoundingClientRect();
        const touchX = touch.clientX;
        const touchY = touch.clientY;

        const relX = ((touchX - rect.left) / rect.width) * CONFIG.WORLD_WIDTH;
        // Aplicar CONFIG.TOUCH_OFFSET_Y para posicionar la nave arriba del dedo
        const relY = ((touchY - rect.top) / rect.height) * CONFIG.WORLD_HEIGHT - CONFIG.TOUCH_OFFSET_Y;

        this.player.targetX = relX;
        this.player.targetY = relY;
      };

      targetArea.addEventListener('touchstart', (e) => {
        if (e.target && e.target.closest && e.target.closest('#start-hint')) {
          return;
        }
        if (e.touches.length > 0) {
          handleTouch(e.touches[0]);
          if (this.state === GameState.WAITING_START) {
            this.startGame();
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
        const relX = ((e.clientX - rect.left) / rect.width) * CONFIG.WORLD_WIDTH;
        const relY = ((e.clientY - rect.top) / rect.height) * CONFIG.WORLD_HEIGHT;
        this.player.targetX = relX;
        this.player.targetY = relY;
      });

      targetArea.addEventListener('click', (e) => {
        if (e.target && e.target.closest && e.target.closest('#start-hint')) {
          return;
        }
        if (this.state === GameState.WAITING_START) {
          this.startGame();
        }
      });

      // Selector de Dificultad (Cadete, Piloto, As Orbital)
      const diffButtons = document.querySelectorAll ? document.querySelectorAll('.btn-diff') : [];
      diffButtons.forEach(btn => {
        const handleDiffSelect = (e) => {
          e.stopPropagation();
          e.preventDefault();
          const diffKey = btn.getAttribute ? btn.getAttribute('data-diff') : null;
          if (diffKey) {
            this.setDifficulty(diffKey);
            if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(20);
            this.playHitSound();
          }
        };
        btn.addEventListener('click', handleDiffSelect);
        btn.addEventListener('touchend', handleDiffSelect);
      });

      // Botón explícito de Despegue / Iniciar Misión
      const launchBtn = document.getElementById('btn-start-game');
      if (launchBtn) {
        const handleLaunch = (e) => {
          e.stopPropagation();
          e.preventDefault();
          if (this.state === GameState.WAITING_START) {
            this.startGame();
          }
        };
        launchBtn.addEventListener('click', handleLaunch);
        launchBtn.addEventListener('touchend', handleLaunch);
      }

      // Teclado
      window.addEventListener('keydown', (e) => {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
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

        if (e.key === ' ' || e.key === 'Enter') {
          if (this.state === GameState.WAITING_START) {
            this.startGame();
          }
        }

        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.up = true;
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.down = true;
      });

      window.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.up = false;
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.down = false;
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
    new DefensaOrbitalGame();
  });
})();
