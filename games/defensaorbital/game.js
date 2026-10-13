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
    PLAYER_FIRE_INTERVAL: 0.16,   // Segundos entre disparos (~6.25 disparos/seg)
    INVULNERABILITY_TIME: 1.8,    // Segundos de protección tras recibir daño

    // Proyectiles y combate
    BULLET_SPEED: 640,            // Velocidad del proyectil (px/seg)
    BULLET_DAMAGE: 1,
    MAX_BULLETS: 60,              // Capacidad del pool de proyectiles

    // Enemigos Fase 1 (Tipo 1: Dron Explorador)
    ENEMY_SPAWN_INTERVAL: 1.4,    // Intervalo de aparición inicial (segundos)
    ENEMY_SPEED: 120,             // Velocidad de descenso
    ENEMY_HP: 2,                  // Golpes necesarios para destruirlo
    MAX_ENEMIES: 40,              // Capacidad del pool de enemigos

    // Efectos y rendimiento
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

      // Fondo de estrellas parallax (3 capas)
      this.stars = this.createStarfield();

      // Object Pooling: Proyectiles
      this.bullets = Array.from({ length: CONFIG.MAX_BULLETS }, () => ({
        x: 0,
        y: 0,
        vy: -CONFIG.BULLET_SPEED,
        radius: 3.5,
        active: false
      }));

      // Object Pooling: Enemigos
      this.enemies = Array.from({ length: CONFIG.MAX_ENEMIES }, () => ({
        x: 0,
        y: 0,
        vx: 0,
        vy: CONFIG.ENEMY_SPEED,
        radius: 15,
        hp: CONFIG.ENEMY_HP,
        maxHp: CONFIG.ENEMY_HP,
        type: 'DRONE',
        oscillationPhase: 0,
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

      // Temporizador de spawn para Fase 1
      this.enemySpawnTimer = 0;

      // Variables de control y tiempo
      this.lastTime = 0;
      this.shakeTimer = 0;
      this.scale = 1;
      this.keys = { left: false, right: false, up: false, down: false };

      this.initEvents();
      this.resizeCanvas();
      this.startNewGame();

      requestAnimationFrame(this.gameLoop.bind(this));
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

    startNewGame() {
      this.score = 0;
      this.lives = 3;
      this.wave = 1;
      this.streak = 1;
      this.killsWithoutDamage = 0;

      this.player.x = CONFIG.WORLD_WIDTH / 2;
      this.player.y = CONFIG.WORLD_HEIGHT - 90;
      this.player.targetX = this.player.x;
      this.player.targetY = this.player.y;
      this.player.invulnerableTimer = 0;
      this.player.fireTimer = 0;

      // Limpiar pools
      this.bullets.forEach(b => b.active = false);
      this.enemies.forEach(e => e.active = false);
      this.particles.forEach(p => p.active = false);

      this.enemySpawnTimer = 0.5; // Primer enemigo aparece a los 0.5s

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
    }

    spawnPlayerBullet() {
      // Disparo automático frontal
      const bullet = this.bullets.find(b => !b.active);
      if (bullet) {
        bullet.x = this.player.x;
        bullet.y = this.player.y - 18;
        bullet.vy = -CONFIG.BULLET_SPEED;
        bullet.active = true;

        if (window.ArcadeAudio && window.ArcadeAudio.playShoot) {
          window.ArcadeAudio.playShoot();
        } else if (window.ArcadeAudio) {
          window.ArcadeAudio.playTone(840, 'sawtooth', 0.04, 0.07);
        }
      }
    }

    spawnEnemyDrone() {
      const enemy = this.enemies.find(e => !e.active);
      if (enemy) {
        // Posición horizontal con margen para no chocar inmediatamente con la pared
        const margin = 36;
        enemy.x = margin + Math.random() * (CONFIG.WORLD_WIDTH - margin * 2);
        enemy.y = -24;
        enemy.vx = (Math.random() * 2 - 1) * 35; // Leve movimiento horizontal
        enemy.vy = CONFIG.ENEMY_SPEED + Math.random() * 20;
        enemy.hp = CONFIG.ENEMY_HP;
        enemy.maxHp = CONFIG.ENEMY_HP;
        enemy.type = 'DRONE';
        enemy.oscillationPhase = Math.random() * Math.PI * 2;
        enemy.active = true;
      }
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

      this.lives--;
      this.player.invulnerableTimer = CONFIG.INVULNERABILITY_TIME;
      this.shakeTimer = CONFIG.SHAKE_DURATION;

      // Romper racha de bajas sin daño
      this.streak = 1;
      this.killsWithoutDamage = 0;

      if (window.ArcadeAudio && window.ArcadeAudio.playLoseLife) {
        window.ArcadeAudio.playLoseLife();
      } else if (window.ArcadeAudio) {
        window.ArcadeAudio.playTone(180, 'sawtooth', 0.2, 0.15);
      }
      if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(50);

      this.spawnExplosionParticles(this.player.x, this.player.y, '#ff3366', 20);
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

      let hearts = '';
      for (let i = 0; i < 3; i++) {
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
      // 1. Desplazamiento del fondo de estrellas (Parallax)
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

      // 4. Invulnerabilidad temporal de la nave
      if (this.player.invulnerableTimer > 0) {
        this.player.invulnerableTimer -= dt;
      }

      // 5. Cadencia de disparo automático
      this.player.fireTimer += dt;
      if (this.player.fireTimer >= CONFIG.PLAYER_FIRE_INTERVAL) {
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

      // 7. Generación y movimiento de enemigos (Fase 1: Oleada continua básica)
      this.enemySpawnTimer -= dt;
      if (this.enemySpawnTimer <= 0) {
        this.spawnEnemyDrone();
        this.enemySpawnTimer = CONFIG.ENEMY_SPAWN_INTERVAL;
      }

      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (e.active) {
          e.oscillationPhase += dt * 3;
          e.x += Math.sin(e.oscillationPhase) * 45 * dt + e.vx * dt;
          e.y += e.vy * dt;

          // Mantener dentro de bordes horizontales
          if (e.x < e.radius) { e.x = e.radius; e.vx = Math.abs(e.vx); }
          if (e.x > CONFIG.WORLD_WIDTH - e.radius) { e.x = CONFIG.WORLD_WIDTH - e.radius; e.vx = -Math.abs(e.vx); }

          // Desactivar si sale por abajo
          if (e.y > CONFIG.WORLD_HEIGHT + 30) {
            e.active = false;
          }
        }
      }

      // 8. Detección de colisiones (Proyectiles vs Enemigos)
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

            // Chispas de impacto
            this.spawnExplosionParticles(b.x, b.y, '#38bdf8', 4);

            if (e.hp <= 0) {
              e.active = false;
              this.score += 20 * this.streak;
              this.killsWithoutDamage++;

              // Multiplicador por racha cada 5 bajas limpias
              if (this.killsWithoutDamage % 5 === 0 && this.streak < 5) {
                this.streak++;
              }

              this.spawnExplosionParticles(e.x, e.y, '#ff9100', 14);

              if (window.ArcadeAudio && window.ArcadeAudio.playExplosion) {
                window.ArcadeAudio.playExplosion();
              } else if (window.ArcadeAudio) {
                window.ArcadeAudio.playDrop();
              }
            }

            this.updateUI();
            break;
          }
        }
      }

      // 9. Detección de colisiones (Nave vs Enemigos)
      for (let ei = 0; ei < this.enemies.length; ei++) {
        const e = this.enemies[ei];
        if (!e.active) continue;

        const dx = this.player.x - e.x;
        const dy = this.player.y - e.y;
        const colDist = this.player.radius + e.radius;

        if (dx * dx + dy * dy <= colDist * colDist) {
          e.active = false;
          this.damagePlayer();
          break;
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

      // 3. Enemigos Tipo 1: Dron de reconocimiento (Silueta angular neón ámbar/rojo)
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (e.active) {
          ctx.save();
          ctx.translate(e.x, e.y);
          ctx.shadowColor = '#ff9100';
          ctx.shadowBlur = 10;

          // Cuerpo de la nave enemiga
          ctx.fillStyle = '#1e1b4b';
          ctx.strokeStyle = '#ff9100';
          ctx.lineWidth = 1.8;

          ctx.beginPath();
          ctx.moveTo(0, 14);          // Punta inferior
          ctx.lineTo(-14, -8);        // Ala izquierda
          ctx.lineTo(-6, -14);        // Tobera izquierda
          ctx.lineTo(6, -14);         // Tobera derecha
          ctx.lineTo(14, -8);         // Ala derecha
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Núcleo energético parpadeante
          ctx.fillStyle = '#ff3366';
          ctx.beginPath();
          ctx.arc(0, -2, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }

      // 4. Nave del jugador (Arte vectorial con cabina y propulsor animado)
      const isInvulnerable = this.player.invulnerableTimer > 0;
      // Parpadeo cada ~100ms si es invulnerable
      const showShip = !isInvulnerable || Math.floor(Date.now() / 90) % 2 === 0;

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

      // 5. Partículas de impacto y explosión
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

      targetArea.addEventListener('click', () => {
        if (this.state === GameState.WAITING_START) {
          this.startGame();
        }
      });

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
