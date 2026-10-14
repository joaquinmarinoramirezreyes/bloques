/**
 * ABISMO - Core Game Engine (Fase 2)
 * Roguelike de acción cenital:
 * - Renderizado Volumétrico Pseudo-3D del Explorador
 * - Mazmorra Procedural Conexa con Puertas y Mini-Mapa
 * - 6 Arquetipos de Enemigos con IA Única y Modificadores de Élites
 * - Sistema de Oleadas por Sala con Bloqueo/Desbloqueo de Puertas
 * - Spatial Hash Grid y Object Pooling (Zero-Allocations)
 */
(() => {
  'use strict';

  // Dependencias modulares (soporte navegador o Node.js)
  const CFG = typeof ABISMO_CONFIG !== 'undefined'
    ? ABISMO_CONFIG
    : (typeof require !== 'undefined' ? require('./config.js') : {});

  const SpatialHashClass = typeof SpatialHash !== 'undefined'
    ? SpatialHash
    : (typeof require !== 'undefined' ? require('./spatial_hash.js') : null);

  const ENEMIGOS_DATA = (typeof window !== 'undefined' && window.ABISMO_ENEMIGOS)
    ? window.ABISMO_ENEMIGOS
    : (typeof ABISMO_ENEMIGOS !== 'undefined' ? ABISMO_ENEMIGOS : (typeof require !== 'undefined' ? require('./data/enemigos.js').ENEMIGOS : {}));

  const MODIFICADORES_ELITE = (typeof window !== 'undefined' && window.ABISMO_MODIFICADORES_ELITE)
    ? window.ABISMO_MODIFICADORES_ELITE
    : (typeof ABISMO_MODIFICADORES_ELITE !== 'undefined' ? ABISMO_MODIFICADORES_ELITE : (typeof require !== 'undefined' ? require('./data/enemigos.js').MODIFICADORES_ELITE : []));

  const TIPOS_SALA = (typeof window !== 'undefined' && window.ABISMO_TIPOS_SALA)
    ? window.ABISMO_TIPOS_SALA
    : (typeof ABISMO_TIPOS_SALA !== 'undefined' ? ABISMO_TIPOS_SALA : (typeof require !== 'undefined' ? require('./data/salas.js').TIPOS_SALA : {}));

  const DungeonGenerator = (typeof window !== 'undefined' && window.ABISMO_DUNGEON_GEN)
    ? window.ABISMO_DUNGEON_GEN
    : (typeof ABISMO_DUNGEON_GEN !== 'undefined' ? ABISMO_DUNGEON_GEN : (typeof require !== 'undefined' ? require('./data/salas.js').DungeonGenerator : null));

  const UpgradeManager = (typeof window !== 'undefined' && window.ABISMO_UPGRADE_MGR)
    ? window.ABISMO_UPGRADE_MGR
    : (typeof ABISMO_UPGRADE_MGR !== 'undefined' ? ABISMO_UPGRADE_MGR : (typeof require !== 'undefined' ? require('./data/mejoras.js').UpgradeManager : null));

  const PERSONAJES = (typeof window !== 'undefined' && window.ABISMO_PERSONAJES)
    ? window.ABISMO_PERSONAJES
    : (typeof ABISMO_PERSONAJES !== 'undefined' ? ABISMO_PERSONAJES : (typeof require !== 'undefined' ? require('./data/personajes.js') : []));

  const BIOMAS = (typeof window !== 'undefined' && window.ABISMO_BIOMAS)
    ? window.ABISMO_BIOMAS
    : (typeof ABISMO_BIOMAS !== 'undefined' ? ABISMO_BIOMAS : (typeof require !== 'undefined' ? require('./data/salas.js').BIOMAS : []));

  const ABISMO_META_MODULE = (typeof window !== 'undefined' && window.ABISMO_META)
    ? window.ABISMO_META
    : (typeof require !== 'undefined' ? require('./data/meta.js') : {});

  const AbismoStorage = ABISMO_META_MODULE.AbismoStorage || null;
  const META_UPGRADES = ABISMO_META_MODULE.META_UPGRADES || [];
  const LOGROS = ABISMO_META_MODULE.LOGROS || [];
  const getDefaultMetaState = ABISMO_META_MODULE.getDefaultMetaState || (() => ({}));


  // ============================================================================
  // 1. OBJECT POOLING: PARTÍCULAS Y TEXTOS FLOTANTES
  // ============================================================================
  class Particle {
    constructor() {
      this.x = 0;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
      this.life = 0;
      this.maxLife = 0.3;
      this.size = 3;
      this.color = '#fff';
      this.active = false;
    }
  }

  class ParticlePool {
    constructor(size = 400) {
      this.pool = new Array(size).fill(null).map(() => new Particle());
      this.nextIdx = 0;
    }

    spawn(x, y, vx, vy, maxLife = 0.3, size = 3, color = '#fff') {
      const p = this.pool[this.nextIdx];
      p.x = x;
      p.y = y;
      p.vx = vx;
      p.vy = vy;
      p.life = maxLife;
      p.maxLife = maxLife;
      p.size = size;
      p.color = color;
      p.active = true;

      this.nextIdx = (this.nextIdx + 1) % this.pool.length;
      return p;
    }

    update(dt) {
      for (let i = 0; i < this.pool.length; i++) {
        const p = this.pool[i];
        if (!p.active) continue;
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

    render(ctx) {
      for (let i = 0; i < this.pool.length; i++) {
        const p = this.pool[i];
        if (!p.active) continue;
        const progress = p.life / p.maxLife;
        ctx.globalAlpha = Math.max(0, Math.min(1, progress));
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * progress, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
    }
  }

  class FloatingText {
    constructor() {
      this.x = 0;
      this.y = 0;
      this.text = '';
      this.color = '#fff';
      this.life = 0;
      this.maxLife = 0.55;
      this.isCritical = false;
      this.active = false;
    }
  }

  class FloatingTextPool {
    constructor(size = 100) {
      this.pool = new Array(size).fill(null).map(() => new FloatingText());
      this.nextIdx = 0;
    }

    spawn(x, y, text, color = '#fff', isCritical = false) {
      const ft = this.pool[this.nextIdx];
      ft.x = x + (Math.random() - 0.5) * 14;
      ft.y = y - 10;
      ft.text = String(text);
      ft.color = color;
      ft.life = 0.55;
      ft.maxLife = 0.55;
      ft.isCritical = isCritical;
      ft.active = true;

      this.nextIdx = (this.nextIdx + 1) % this.pool.length;
      return ft;
    }

    update(dt) {
      for (let i = 0; i < this.pool.length; i++) {
        const ft = this.pool[i];
        if (!ft.active) continue;
        ft.y -= 45 * dt;
        ft.life -= dt;
        if (ft.life <= 0) {
          ft.active = false;
        }
      }
    }

    render(ctx) {
      ctx.textAlign = 'center';
      for (let i = 0; i < this.pool.length; i++) {
        const ft = this.pool[i];
        if (!ft.active) continue;
        const alpha = Math.max(0, ft.life / ft.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = ft.color;
        ctx.font = ft.isCritical ? '900 15px sans-serif' : 'bold 12px sans-serif';
        ctx.fillText(ft.text, ft.x, ft.y);
      }
      ctx.globalAlpha = 1.0;
    }
  }

  // ============================================================================
  // 2. PROYECTILES DEL JUGADOR
  // ============================================================================
  class Projectile {
    constructor() {
      this.x = 0;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
      this.radius = CFG.BULLET_RADIUS || 5;
      this.damage = CFG.BULLET_DAMAGE || 22;
      this.life = 0;
      this.maxLife = CFG.BULLET_LIFETIME || 0.85;
      this.pierce = 0;
      this.bounce = 0;
      this.isCrit = false;
      this.areaMult = 1.0;
      this.synergyShardOnPierce = false;
      this.synergyExplosiveImpact = false;
      this.hitEnemies = new Set();
      this.color = CFG.PALETTE ? CFG.PALETTE.BULLET : '#a855f7';
      this.glowColor = CFG.PALETTE ? CFG.PALETTE.BULLET_GLOW : 'rgba(168, 85, 247, 0.65)';
      this.active = false;
    }
  }

  class ProjectilePool {
    constructor(size = 350) {
      this.pool = new Array(size).fill(null).map(() => new Projectile());
      this.nextIdx = 0;
      this.activeCount = 0;
    }

    spawn(x, y, angle, speed, damage = 22, maxLife = 0.85, pierce = 0, bounce = 0, isCrit = false, areaMult = 1.0, synergyShard = false, synergyExplosion = false) {
      const p = this.pool[this.nextIdx];
      if (!p.active) this.activeCount++;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.damage = damage;
      p.life = maxLife;
      p.maxLife = maxLife;
      p.pierce = pierce;
      p.bounce = bounce;
      p.isCrit = isCrit;
      p.areaMult = areaMult;
      p.radius = (CFG.BULLET_RADIUS || 5) * areaMult;
      p.synergyShardOnPierce = synergyShard;
      p.synergyExplosiveImpact = synergyExplosion;
      p.hitEnemies.clear();
      p.color = isCrit ? '#f59e0b' : (CFG.PALETTE ? CFG.PALETTE.BULLET : '#a855f7');
      p.glowColor = isCrit ? 'rgba(245, 158, 11, 0.75)' : (CFG.PALETTE ? CFG.PALETTE.BULLET_GLOW : 'rgba(168, 85, 247, 0.65)');
      p.active = true;

      this.nextIdx = (this.nextIdx + 1) % this.pool.length;
      return p;
    }

    update(dt, room) {
      this.activeCount = 0;
      const minX = room.wallThickness;
      const maxX = room.width - room.wallThickness;
      const minY = room.wallThickness;
      const maxY = room.height - room.wallThickness;

      for (let i = 0; i < this.pool.length; i++) {
        const p = this.pool[i];
        if (!p.active) continue;

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;

        if (p.life <= 0 || p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) {
          p.active = false;
          continue;
        }

        this.activeCount++;
      }
    }

    render(ctx) {
      for (let i = 0; i < this.pool.length; i++) {
        const p = this.pool[i];
        if (!p.active) continue;

        ctx.save();
        ctx.shadowColor = p.glowColor;
        ctx.shadowBlur = 8;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // ============================================================================
  // 3. PROYECTILES ENEMIGOS (Tirador)
  // ============================================================================
  class EnemyProjectile {
    constructor() {
      this.x = 0;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
      this.radius = CFG.ENEMY_BULLET_RADIUS || 6;
      this.damage = 15;
      this.life = 0;
      this.maxLife = CFG.ENEMY_BULLET_LIFETIME || 2.2;
      this.color = CFG.PALETTE ? CFG.PALETTE.ENEMY_BULLET : '#ef4444';
      this.glowColor = CFG.PALETTE ? CFG.PALETTE.ENEMY_BULLET_GLOW : 'rgba(239, 68, 68, 0.65)';
      this.active = false;
    }
  }

  class EnemyProjectilePool {
    constructor(size = 150) {
      this.pool = new Array(size).fill(null).map(() => new EnemyProjectile());
      this.nextIdx = 0;
      this.activeCount = 0;
    }

    spawn(x, y, angle, speed = 190, damage = 15, maxLife = 2.2) {
      const p = this.pool[this.nextIdx];
      if (!p.active) this.activeCount++;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.damage = damage;
      p.life = maxLife;
      p.maxLife = maxLife;
      p.active = true;

      this.nextIdx = (this.nextIdx + 1) % this.pool.length;
      return p;
    }

    update(dt, room) {
      this.activeCount = 0;
      const minX = room.wallThickness;
      const maxX = room.width - room.wallThickness;
      const minY = room.wallThickness;
      const maxY = room.height - room.wallThickness;

      for (let i = 0; i < this.pool.length; i++) {
        const p = this.pool[i];
        if (!p.active) continue;

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;

        if (p.life <= 0 || p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) {
          p.active = false;
          continue;
        }

        this.activeCount++;
      }
    }

    render(ctx) {
      for (let i = 0; i < this.pool.length; i++) {
        const p = this.pool[i];
        if (!p.active) continue;

        ctx.save();
        ctx.shadowColor = p.glowColor;
        ctx.shadowBlur = 9;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Núcleo brillante
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // ============================================================================
  // 3.5 BOTÍN: ORBES DE EXPERIENCIA Y MONEDAS DE ORO (Fase 3)
  // ============================================================================
  class LootItem {
    constructor() {
      this.x = 0;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
      this.type = 'xp'; // 'xp' | 'gold' | 'heart'
      this.value = 10;
      this.radius = 6;
      this.life = 60.0;
      this.maxLife = 60.0;
      this.color = '#38bdf8';
      this.glowColor = 'rgba(56, 189, 248, 0.6)';
      this.active = false;
      this.bobTimer = Math.random() * Math.PI * 2;
    }

    spawn(x, y, type = 'xp', value = 10) {
      this.x = x;
      this.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = 25 + Math.random() * 55;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.type = type;
      this.value = value;
      this.life = 60.0;
      this.maxLife = 60.0;
      this.bobTimer = Math.random() * Math.PI * 2;
      this.active = true;

      if (type === 'xp') {
        this.radius = value >= 25 ? 7 : 5;
        this.color = CFG.PALETTE ? CFG.PALETTE.XP_ORB : '#38bdf8';
        this.glowColor = CFG.PALETTE ? CFG.PALETTE.XP_ORB_GLOW : 'rgba(56, 189, 248, 0.6)';
      } else if (type === 'gold') {
        this.radius = value >= 15 ? 7 : 5;
        this.color = CFG.PALETTE ? CFG.PALETTE.GOLD_COIN : '#fbbf24';
        this.glowColor = CFG.PALETTE ? CFG.PALETTE.GOLD_COIN_GLOW : 'rgba(251, 191, 36, 0.6)';
      } else {
        this.radius = 6;
        this.color = '#4ade80';
        this.glowColor = 'rgba(74, 222, 128, 0.6)';
      }
    }
  }

  class LootPool {
    constructor(size = CFG.LOOT_POOL_CAP || 250) {
      this.pool = new Array(size).fill(null).map(() => new LootItem());
      this.nextIdx = 0;
      this.activeCount = 0;
    }

    spawn(x, y, type = 'xp', value = 10) {
      const item = this.pool[this.nextIdx];
      if (!item.active) this.activeCount++;
      item.spawn(x, y, type, value);
      this.nextIdx = (this.nextIdx + 1) % this.pool.length;
      return item;
    }

    spawnEnemyDrop(x, y, expValue = 10, isElite = false, goldMult = 1.0) {
      // Orbes de experiencia
      const xpOrbs = isElite ? 4 : (expValue >= 22 ? 2 : 1);
      const valPerOrb = Math.max(5, Math.round(expValue / xpOrbs));
      for (let i = 0; i < xpOrbs; i++) {
        this.spawn(x + (Math.random() - 0.5) * 16, y + (Math.random() - 0.5) * 16, 'xp', valPerOrb);
      }

      // Monedas de oro
      const goldCount = isElite ? 3 : (Math.random() < 0.65 ? 1 : 2);
      const baseGold = isElite ? 16 : 6;
      for (let i = 0; i < goldCount; i++) {
        const val = Math.max(1, Math.round(baseGold * goldMult));
        this.spawn(x + (Math.random() - 0.5) * 16, y + (Math.random() - 0.5) * 16, 'gold', val);
      }
    }

    update(dt, player, onCollectLoot, room) {
      this.activeCount = 0;
      const minX = room.wallThickness + 4;
      const maxX = room.width - room.wallThickness - 4;
      const minY = room.wallThickness + 4;
      const maxY = room.height - room.wallThickness - 4;
      const magnetRadius = player.pickupRadius || 90;
      const magnetSpeed = CFG.LOOT_MAGNET_SPEED || 340;

      for (let i = 0; i < this.pool.length; i++) {
        const item = this.pool[i];
        if (!item.active) continue;

        item.bobTimer += dt * 4;

        item.vx *= 0.90;
        item.vy *= 0.90;
        item.x += item.vx * dt;
        item.y += item.vy * dt;

        if (item.x < minX) item.x = minX;
        if (item.x > maxX) item.x = maxX;
        if (item.y < minY) item.y = minY;
        if (item.y > maxY) item.y = maxY;

        const dx = player.x - item.x;
        const dy = player.y - item.y;
        const dist = Math.hypot(dx, dy) || 1;

        if (dist < magnetRadius) {
          const pull = (1 - dist / magnetRadius) * 0.6 + 0.4;
          const dirX = dx / dist;
          const dirY = dy / dist;
          item.x += dirX * magnetSpeed * pull * dt;
          item.y += dirY * magnetSpeed * pull * dt;
        }

        if (dist <= player.radius + item.radius + 6) {
          item.active = false;
          if (onCollectLoot) onCollectLoot(item);
          continue;
        }

        this.activeCount++;
      }
    }

    render(ctx) {
      for (let i = 0; i < this.pool.length; i++) {
        const item = this.pool[i];
        if (!item.active) continue;

        const bob = Math.sin(item.bobTimer) * 2.5;
        const y = item.y + bob;

        ctx.save();
        ctx.shadowColor = item.glowColor;
        ctx.shadowBlur = 9;

        if (item.type === 'xp') {
          // Orbe de experiencia arcana
          ctx.fillStyle = item.color;
          ctx.beginPath();
          ctx.arc(item.x, y, item.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(item.x - 1, y - 1, item.radius * 0.45, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === 'gold') {
          // Moneda dorada
          ctx.fillStyle = item.color;
          ctx.beginPath();
          ctx.arc(item.x, y, item.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(item.x - 1, y - 1, item.radius * 0.35, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = item.color;
          ctx.beginPath();
          ctx.arc(item.x, y, item.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }
  }

  // ============================================================================
  // 4. ENTIDAD ENEMIGO (6 ARQUETIPOS + ÉLITES)
  // ============================================================================
  class Enemy {
    constructor() {
      this.x = 0;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
      this.radius = 12;
      this.hp = 38;
      this.maxHp = 38;
      this.speed = 105;
      this.damage = 12;
      this.expValue = 10;
      this.typeId = 'perseguidor';
      this.color = '#f43f5e';
      this.accentColor = '#881337';
      this.glowColor = 'rgba(244, 63, 94, 0.45)';
      this.knockbackResistance = 1.0;
      this.facingAngle = 0;
      this.active = false;

      // Variables de Spatial Hash
      this._shQueryId = 0;

      // Feedback de impacto (hit flash)
      this.hitFlashTimer = 0;

      // Modificador de Élite
      this.isElite = false;
      this.eliteMod = null;

      // Estados de Arquetipos Específicos:
      // Corredor (rusher)
      this.rusherState = 'chase'; // 'chase', 'windup', 'dash', 'recovery'
      this.rusherTimer = 0;
      this.rushTargetX = 0;
      this.rushTargetY = 0;

      // Tirador (shooter)
      this.shootCooldown = 2.2;
      this.shootTimer = 1.0 + Math.random() * 1.5;

      // Invocador (summoner)
      this.summonCooldown = 4.5;
      this.summonTimer = 2.0 + Math.random() * 2.5;
      this.isSummoning = false;
      this.summonChannelTimer = 0;

      // Explosivo (explosive)
      this.isTicking = false;
      this.fuseTimer = 0;
      this.fuseTotalTime = 0.75;
      this.explosionRadius = 65;

      // Escudado (shielded)
      this.shieldHp = 40;
      this.shieldMaxHp = 40;
      this.shieldActive = true;

      // Jefe (Boss - Fase 4)
      this.isBoss = false;
      this.bossPhase = 1;
      this.slamTimer = 0;
      this.slamTelegraphTimer = 0;
      this.slamTargetX = 0;
      this.slamTargetY = 0;
      this.slamRadius = 120;
      this.slamDamage = 32;
      this.starburstTimer = 0;
      this.bobTimer = Math.random() * 6.28;
    }

    spawn(x, y, data = ENEMIGOS_DATA.perseguidor, isElite = false, floorLevel = 1) {
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.typeId = data.id || 'perseguidor';
      this.radius = data.radius || 12;

      // Escalado progresivo de dificultad por nivel / piso (cada nivel es más difícil)
      const f = Math.max(1, floorLevel || 1);
      const floorHpMult = 1.0 + (f - 1) * 0.28 + Math.pow(Math.max(0, f - 1), 1.2) * 0.04;
      const floorDmgMult = 1.0 + (f - 1) * 0.14;
      const floorSpeedMult = Math.min(1.4, 1.0 + (f - 1) * 0.03);
      const floorKbRes = Math.min(2.5, (data.knockbackResistance || 1.0) * (1.0 + (f - 1) * 0.08));

      this.maxHp = Math.round((data.hp || 38) * floorHpMult);
      this.speed = Math.round((data.speed || 105) * floorSpeedMult);
      this.damage = Math.round((data.damage || 12) * floorDmgMult);
      this.expValue = Math.round((data.expValue || 10) * (1.0 + (f - 1) * 0.18));
      this.knockbackResistance = floorKbRes;
      this.color = data.color || '#f43f5e';
      this.accentColor = data.accentColor || '#881337';
      this.glowColor = data.glowColor || 'rgba(244, 63, 94, 0.45)';
      this.knockbackResistance = data.knockbackResistance || 1.0;
      this.hitFlashTimer = 0;
      this.facingAngle = 0;

      this.isBoss = !!data.isBoss;
      this.bossPhase = 1;
      this.slamTimer = 2.2;
      this.slamTelegraphTimer = 0;
      this.slamTargetX = 0;
      this.slamTargetY = 0;
      this.slamRadius = data.slamRadius || (CFG.BOSS_SLAM_RADIUS || 120);
      this.slamDamage = data.slamDamage || (CFG.BOSS_SLAM_DAMAGE || 32);
      this.starburstTimer = 3.6;

      this.isElite = isElite;
      this.eliteMod = null;

      if (isElite && MODIFICADORES_ELITE.length > 0) {
        const mod = MODIFICADORES_ELITE[Math.floor(Math.random() * MODIFICADORES_ELITE.length)];
        this.eliteMod = mod;
        this.maxHp = Math.round(this.maxHp * (mod.hpMult || 1.6));
        this.speed = Math.round(this.speed * (mod.speedMult || 1.2));
        this.radius = Math.round(this.radius * (mod.sizeMult || 1.25));
        this.expValue = Math.round(this.expValue * 2.5);
      }

      this.hp = this.maxHp;

      // Reset estados de arquetipo
      this.rusherState = 'chase';
      this.rusherTimer = 0;
      this.shootCooldown = data.shootCooldown || 2.2;
      this.shootTimer = 1.0 + Math.random() * 1.5;
      this.summonCooldown = data.summonCooldown || 4.5;
      this.summonTimer = 2.0 + Math.random() * 2.0;
      this.isSummoning = false;
      this.summonChannelTimer = 0;
      this.isTicking = false;
      this.fuseTimer = 0;
      this.fuseTotalTime = data.fuseTime || 0.75;
      this.explosionRadius = data.explosionRadius || 65;
      this.shieldMaxHp = data.shieldHp || 40;
      this.shieldHp = this.shieldMaxHp;
      this.shieldActive = (this.typeId === 'escudado');

      this.active = true;
    }

    takeDamage(dmg, knockX = 0, knockY = 0, sourceX = null, sourceY = null) {
      if (!this.active || this.hp <= 0) return true;

      let finalDamage = dmg;
      let blockedByShield = false;

      // Mecánica del Escudado: si el daño viene de frente (+/- 68 grados), la barrera absorbe el 80%
      if (this.typeId === 'escudado' && sourceX !== null && sourceY !== null) {
        // Ángulo desde el enemigo hacia el origen del ataque
        const toSourceAngle = Math.atan2(sourceY - this.y, sourceX - this.x);
        let angleDiff = Math.abs(this.facingAngle - toSourceAngle);
        while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);

        if (angleDiff < 1.2) { // ~68 grados de arco frontal protegido
          finalDamage = Math.max(1, Math.round(dmg * 0.2)); // Absorbe el 80%
          blockedByShield = true;
        }
      }

      this.hp -= finalDamage;
      this.hitFlashTimer = 0.12;

      // Knockback mitigado por resistencia
      const kb = 1 / Math.max(0.2, this.knockbackResistance);
      this.vx += knockX * kb * (blockedByShield ? 0.35 : 1.0);
      this.vy += knockY * kb * (blockedByShield ? 0.35 : 1.0);

      // Si el explosivo recibe daño letal, puede detonar de inmediato
      if (this.hp <= 0 && this.typeId === 'explosivo') {
        this.isTicking = true;
        this.fuseTimer = 0.05; // Detona casi al instante
      }

      return this.hp <= 0;
    }
  }

  // ============================================================================
  // 5. POOL DE ENEMIGOS E INTELIGENCIA ARTIFICIAL
  // ============================================================================
  class EnemyPool {
    constructor(size = 200) {
      this.pool = new Array(size).fill(null).map(() => new Enemy());
      this.activeCount = 0;
    }

    spawn(x, y, typeData, isElite = false, floorLevel = 1) {
      for (let i = 0; i < this.pool.length; i++) {
        if (!this.pool[i].active) {
          this.pool[i].spawn(x, y, typeData, isElite, floorLevel);
          this.activeCount++;
          return this.pool[i];
        }
      }
      return null;
    }

    update(dt, player, spatialHash, room, onEnemyTouchPlayer, enemyProjectiles, onEnemyExplode, onSpawnMinion) {
      this.activeCount = 0;
      const minX = room.wallThickness + 14;
      const maxX = room.width - room.wallThickness - 14;
      const minY = room.wallThickness + 14;
      const maxY = room.height - room.wallThickness - 14;

      const nearbyBuffer = [];

      for (let i = 0; i < this.pool.length; i++) {
        const e = this.pool[i];
        if (!e.active || e.hp <= 0) {
          e.active = false;
          continue;
        }

        e.bobTimer += dt * 4.5;

        if (e.hitFlashTimer > 0) {
          e.hitFlashTimer -= dt;
        }

        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const distToPlayer = Math.hypot(dx, dy) || 1;
        const dirX = dx / distToPlayer;
        const dirY = dy / distToPlayer;

        e.facingAngle = Math.atan2(dy, dx);

        // Separación entre enemigos (Spatial Hash anti-stacking)
        let sepX = 0;
        let sepY = 0;
        spatialHash.queryRange(e.x, e.y, e.radius * 2.2, nearbyBuffer);
        for (let j = 0; j < nearbyBuffer.length; j++) {
          const other = nearbyBuffer[j];
          if (other === e || !other.active) continue;
          const ndx = e.x - other.x;
          const ndy = e.y - other.y;
          const nDistSq = ndx * ndx + ndy * ndy;
          const minDist = e.radius + other.radius;
          if (nDistSq > 0 && nDistSq < minDist * minDist) {
            const nDist = Math.sqrt(nDistSq);
            sepX += (ndx / nDist) * (minDist - nDist) * 1.8;
            sepY += (ndy / nDist) * (minDist - nDist) * 1.8;
          }
        }

        // ====================================================================
        // COMPORTAMIENTOS POR ARQUETIPO (IA)
        // ====================================================================
        let targetVx = 0;
        let targetVy = 0;

        switch (e.typeId) {
          case 'perseguidor': {
            // Persecución directa y ágil
            targetVx = dirX * e.speed + sepX * 45;
            targetVy = dirY * e.speed + sepY * 45;
            break;
          }

          case 'corredor': {
            // Carga veloz con aviso previo (windup) y carrera rectilínea
            if (e.rusherState === 'chase') {
              targetVx = dirX * (e.speed * 0.7) + sepX * 35;
              targetVy = dirY * (e.speed * 0.7) + sepY * 35;

              if (distToPlayer < 240) {
                e.rusherState = 'windup';
                e.rusherTimer = 0.45; // 0.45s de preparación
                e.rushTargetX = dirX;
                e.rushTargetY = dirY;
              }
            } else if (e.rusherState === 'windup') {
              // Quieto, temblando y telegrafiando dirección
              targetVx = 0;
              targetVy = 0;
              e.rusherTimer -= dt;
              if (e.rusherTimer <= 0) {
                e.rusherState = 'dash';
                e.rusherTimer = 0.35; // 0.35s de carrera supersónica
                targetVx = e.rushTargetX * (e.speed * 2.3);
                targetVy = e.rushTargetY * (e.speed * 2.3);
                e.vx = targetVx;
                e.vy = targetVy;
              }
            } else if (e.rusherState === 'dash') {
              // Carrera en línea recta a 2.3x de velocidad
              targetVx = e.rushTargetX * (e.speed * 2.3);
              targetVy = e.rushTargetY * (e.speed * 2.3);
              e.vx = targetVx;
              e.vy = targetVy;
              e.rusherTimer -= dt;
              if (e.rusherTimer <= 0) {
                e.rusherState = 'recovery';
                e.rusherTimer = 0.55; // 0.55s de descanso
              }
            } else if (e.rusherState === 'recovery') {
              // Fatiga tras la carrera
              targetVx = e.vx * 0.8;
              targetVy = e.vy * 0.8;
              e.rusherTimer -= dt;
              if (e.rusherTimer <= 0) {
                e.rusherState = 'chase';
              }
            }
            break;
          }

          case 'tirador': {
            // Mantiene distancia de tiro (kiteo) y dispara proyectiles arcanos
            const idealDist = 240;
            if (distToPlayer < 170) {
              // Huir si el jugador se acerca demasiado
              targetVx = -dirX * e.speed + sepX * 40;
              targetVy = -dirY * e.speed + sepY * 40;
            } else if (distToPlayer > idealDist + 50) {
              // Acercarse si está lejos
              targetVx = dirX * (e.speed * 0.9) + sepX * 35;
              targetVy = dirY * (e.speed * 0.9) + sepY * 35;
            } else {
              // Movimiento lateral / strafe
              targetVx = -dirY * (e.speed * 0.6) + sepX * 40;
              targetVy = dirX * (e.speed * 0.6) + sepY * 40;
            }

            // Disparar proyectil enemigo
            e.shootTimer -= dt;
            if (e.shootTimer <= 0 && enemyProjectiles) {
              const shootAngle = Math.atan2(player.y - e.y, player.x - e.x);
              enemyProjectiles.spawn(
                e.x + Math.cos(shootAngle) * (e.radius + 6),
                e.y + Math.sin(shootAngle) * (e.radius + 6),
                shootAngle,
                CFG.ENEMY_BULLET_SPEED || 190,
                14,
                2.2
              );
              e.shootTimer = e.shootCooldown + (Math.random() - 0.5) * 0.4;
            }
            break;
          }

          case 'invocador': {
            // Se aleja del jugador e invoca sombras menores periódicamente
            if (distToPlayer < 230) {
              targetVx = -dirX * (e.speed * 1.1) + sepX * 45;
              targetVy = -dirY * (e.speed * 1.1) + sepY * 45;
            } else {
              targetVx = sepX * 30;
              targetVy = sepY * 30;
            }

            // Canalización de invocación
            e.summonTimer -= dt;
            if (e.summonTimer <= 0) {
              e.isSummoning = true;
              e.summonChannelTimer = 1.0;
              e.summonTimer = e.summonCooldown + Math.random();
            }

            if (e.isSummoning) {
              targetVx *= 0.2;
              targetVy *= 0.2;
              e.summonChannelTimer -= dt;
              if (e.summonChannelTimer <= 0) {
                e.isSummoning = false;
                if (onSpawnMinion) {
                  onSpawnMinion(e.x + (Math.random() - 0.5) * 35, e.y + (Math.random() - 0.5) * 35);
                }
              }
            }
            break;
          }

          case 'explosivo': {
            // Corre directo al jugador; al llegar a < 48px enciende mecha de detonación
            targetVx = dirX * e.speed + sepX * 40;
            targetVy = dirY * e.speed + sepY * 40;

            if (distToPlayer < 48 && !e.isTicking) {
              e.isTicking = true;
              e.fuseTimer = e.fuseTotalTime;
            }

            if (e.isTicking) {
              e.fuseTimer -= dt;
              if (e.fuseTimer <= 0) {
                e.active = false;
                if (onEnemyExplode) {
                  onEnemyExplode(e);
                }
                continue;
              }
            }
            break;
          }

          case 'escudado': {
            // Guardián pesado que avanza metódicamente hacia el jugador
            targetVx = dirX * e.speed + sepX * 40;
            targetVy = dirY * e.speed + sepY * 40;
            break;
          }

          case 'jefe_cripta':
          case 'jefe_magma': {
            // Comprobación de fase 2: furia (< 50% HP)
            if (e.hp <= e.maxHp * 0.5 && e.bossPhase === 1) {
              e.bossPhase = 2;
              e.speed = Math.round(e.speed * 1.35);
              if (onSpawnMinion) {
                onSpawnMinion(e.x + 40, e.y + 40);
                onSpawnMinion(e.x - 40, e.y - 40);
              }
            }

            // Ataque 1: Slam telegrafiado con aviso visual previo
            if (e.slamTelegraphTimer > 0) {
              e.slamTelegraphTimer -= dt;
              targetVx = 0;
              targetVy = 0;

              if (e.slamTelegraphTimer <= 0) {
                // Impacto telúrico
                const distToSlam = Math.hypot(player.x - e.slamTargetX, player.y - e.slamTargetY);
                if (distToSlam <= e.slamRadius) {
                  onEnemyTouchPlayer({
                    damage: e.slamDamage,
                    x: e.slamTargetX,
                    y: e.slamTargetY,
                    radius: e.slamRadius
                  });
                }
              }
            } else {
              targetVx = dirX * e.speed + sepX * 25;
              targetVy = dirY * e.speed + sepY * 25;

              e.slamTimer -= dt;
              if (e.slamTimer <= 0) {
                e.slamTargetX = player.x;
                e.slamTargetY = player.y;
                e.slamTelegraphTimer = CFG.BOSS_TELEGRAPH_TIME || 0.8;
                e.slamTimer = e.bossPhase === 2 ? 2.6 : 3.8;
              }
            }

            // Ataque 2: Ráfaga de proyectiles en estrella de 360 grados
            e.starburstTimer -= dt;
            if (e.starburstTimer <= 0 && enemyProjectiles) {
              const ringCount = e.bossPhase === 2 ? 10 : 8;
              const bSpeed = e.typeId === 'jefe_magma' ? 210 : 175;
              for (let a = 0; a < Math.PI * 2; a += (Math.PI * 2) / ringCount) {
                enemyProjectiles.spawn(
                  e.x + Math.cos(a) * (e.radius + 6),
                  e.y + Math.sin(a) * (e.radius + 6),
                  a,
                  bSpeed,
                  e.typeId === 'jefe_magma' ? 20 : 16,
                  2.2
                );
              }
              e.starburstTimer = e.bossPhase === 2 ? 3.0 : 4.4;
            }
            break;
          }

          default: {
            targetVx = dirX * e.speed + sepX * 45;
            targetVy = dirY * e.speed + sepY * 45;
          }
        }

        // Fricción y avance de velocidad
        e.vx = e.vx * 0.88 + targetVx * 0.12;
        e.vy = e.vy * 0.88 + targetVy * 0.12;

        e.x += e.vx * dt;
        e.y += e.vy * dt;

        // Confinar dentro de los muros
        if (e.x < minX) { e.x = minX; e.vx = 0; }
        if (e.x > maxX) { e.x = maxX; e.vx = 0; }
        if (e.y < minY) { e.y = minY; e.vy = 0; }
        if (e.y > maxY) { e.y = maxY; e.vy = 0; }

        // Colisión por contacto con el jugador
        const touchDist = e.radius + player.radius;
        if (distToPlayer < touchDist) {
          onEnemyTouchPlayer(e);
        }

        this.activeCount++;
      }
    }

    render(ctx) {
      // 0. Telegrafiador visual en suelo para ataques de área de Jefes (Fase 4)
      for (let i = 0; i < this.pool.length; i++) {
        const e = this.pool[i];
        if (!e.active || !e.isBoss || e.slamTelegraphTimer <= 0) continue;

        ctx.save();
        const totalTeleTime = CFG.BOSS_TELEGRAPH_TIME || 0.8;
        const progress = Math.min(1, Math.max(0, 1 - (e.slamTelegraphTimer / totalTeleTime)));

        // Círculo exterior punteado de advertencia
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(e.slamTargetX, e.slamTargetY, e.slamRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Relleno expansivo de advertencia
        ctx.fillStyle = `rgba(239, 68, 68, ${0.12 + progress * 0.38})`;
        ctx.beginPath();
        ctx.arc(e.slamTargetX, e.slamTargetY, e.slamRadius * progress, 0, Math.PI * 2);
        ctx.fill();

        // Icono de advertencia en el epicentro
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#f87171';
        ctx.fillText('⚠️', e.slamTargetX, e.slamTargetY);

        ctx.restore();
      }

      for (let i = 0; i < this.pool.length; i++) {
        const e = this.pool[i];
        if (!e.active || e.hp <= 0) continue;

        ctx.save();
        ctx.translate(e.x, e.y);

        const isFlashing = e.hitFlashTimer > 0;

        // Elevación Z senoidal individual para flotación o paso de marcha (pseudo-3D)
        const z = Math.abs(Math.sin(e.bobTimer || 0)) * (e.isBoss ? 5.5 : 3.8);

        // 1. Sombra volumétrica en el suelo (reacciona en tiempo real a la elevación Z)
        const shadowScale = 1.0 - z * 0.045;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.beginPath();
        ctx.ellipse(0, e.radius * 0.8, e.radius * 1.15 * shadowScale, e.radius * 0.5 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Aura y corona de ÉLITE si corresponde
        if (e.isElite) {
          ctx.save();
          const auraPulse = Math.sin(performance.now() * 0.008) * 3;
          ctx.strokeStyle = e.eliteMod ? e.eliteMod.color : '#f59e0b';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, -z, e.radius + 6 + auraPulse, 0, Math.PI * 2);
          ctx.stroke();

          // Corona / Marca 3D sobre la cabeza
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('👑', 0, -z - e.radius - 12);
          ctx.restore();
        }

        // ====================================================================
        // CUERPO VOLUMÉTRICO PSEUDO-3D / 2.5D (Elevado en Z)
        // ====================================================================
        ctx.save();
        ctx.translate(0, -z);

        switch (e.typeId) {
          case 'perseguidor': {
            // Necro-Sombra: Cráneo demoníaco volumétrico esférico con cuernos 3D biselados y ojos profundos
            ctx.shadowColor = e.glowColor;
            ctx.shadowBlur = 12;

            // Capa posterior de cuernos oscuros
            ctx.fillStyle = isFlashing ? '#ffffff' : e.accentColor;
            ctx.beginPath();
            ctx.moveTo(-e.radius * 0.6, -e.radius * 0.2);
            ctx.lineTo(-e.radius * 1.1, -e.radius * 1.25);
            ctx.lineTo(-e.radius * 0.2, -e.radius * 0.5);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(e.radius * 0.6, -e.radius * 0.2);
            ctx.lineTo(e.radius * 1.1, -e.radius * 1.25);
            ctx.lineTo(e.radius * 0.2, -e.radius * 0.5);
            ctx.fill();

            // Esfera 3D con sombreado de luz cenital izquierda
            const bodyGrad = ctx.createRadialGradient(-e.radius * 0.35, -e.radius * 0.35, 1.5, 0, 0, e.radius * 1.05);
            bodyGrad.addColorStop(0, '#ffffff');
            bodyGrad.addColorStop(0.2, isFlashing ? '#ffffff' : e.color);
            bodyGrad.addColorStop(0.7, isFlashing ? '#ffffff' : e.accentColor);
            bodyGrad.addColorStop(1, '#18040a');
            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
            ctx.fill();

            // Hombreras/Espinas flotantes a los lados
            const pX = Math.cos(e.facingAngle + Math.PI / 2) * (e.radius * 0.95);
            const pY = Math.sin(e.facingAngle + Math.PI / 2) * (e.radius * 0.95);
            ctx.fillStyle = isFlashing ? '#ffffff' : e.accentColor;
            ctx.beginPath();
            ctx.arc(pX, pY, 3.5, 0, Math.PI * 2);
            ctx.arc(-pX, -pY, 3.5, 0, Math.PI * 2);
            ctx.fill();

            // Ojos demoníacos 3D con proyección direccional hacia el jugador
            if (!isFlashing) {
              const eyeOffX = Math.cos(e.facingAngle) * (e.radius * 0.35);
              const eyeOffY = Math.sin(e.facingAngle) * (e.radius * 0.35);
              ctx.shadowColor = '#fbbf24';
              ctx.shadowBlur = 8;
              ctx.fillStyle = '#fef08a';
              ctx.beginPath();
              ctx.ellipse(eyeOffX - 3.5, eyeOffY - 1, 2.5, 3.8, e.facingAngle, 0, Math.PI * 2);
              ctx.ellipse(eyeOffX + 3.5, eyeOffY - 1, 2.5, 3.8, e.facingAngle, 0, Math.PI * 2);
              ctx.fill();

              // Pupila carmesí interior
              ctx.fillStyle = '#991b1b';
              ctx.beginPath();
              ctx.arc(eyeOffX - 3.5, eyeOffY - 1, 1.2, 0, Math.PI * 2);
              ctx.arc(eyeOffX + 3.5, eyeOffY - 1, 1.2, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
          }

          case 'corredor': {
            // Bestia Ágil: Exoesqueleto acorazado con placas de quitina 3D y mandíbulas articuladas
            ctx.save();
            ctx.rotate(e.facingAngle);

            // Telegrafiado de carga láser durante el windup
            if (e.rusherState === 'windup') {
              ctx.save();
              ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
              ctx.shadowColor = '#ef4444';
              ctx.shadowBlur = 8;
              ctx.lineWidth = 2.2;
              ctx.setLineDash([6, 4]);
              ctx.beginPath();
              ctx.moveTo(e.radius, 0);
              ctx.lineTo(210, 0);
              ctx.stroke();
              ctx.restore();
            }

            ctx.shadowColor = e.glowColor;
            ctx.shadowBlur = 10;

            // Placas de quitina posteriores (cola/abdomen segmentado)
            ctx.fillStyle = isFlashing ? '#ffffff' : '#431407';
            ctx.beginPath();
            ctx.ellipse(-e.radius * 0.7, 0, e.radius * 0.55, e.radius * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();

            // Tórax aerodinámico 3D con gradiente metálico
            const thoraxGrad = ctx.createLinearGradient(e.radius, -e.radius, -e.radius, e.radius);
            thoraxGrad.addColorStop(0, '#fef08a');
            thoraxGrad.addColorStop(0.25, isFlashing ? '#ffffff' : e.color);
            thoraxGrad.addColorStop(0.7, isFlashing ? '#ffffff' : e.accentColor);
            thoraxGrad.addColorStop(1, '#270802');
            ctx.fillStyle = thoraxGrad;

            ctx.beginPath();
            ctx.moveTo(e.radius * 1.35, 0);
            ctx.lineTo(-e.radius * 0.6, -e.radius * 0.9);
            ctx.lineTo(-e.radius * 0.35, 0);
            ctx.lineTo(-e.radius * 0.6, e.radius * 0.9);
            ctx.closePath();
            ctx.fill();

            // Cuchillas / Pinzas frontales articuladas
            ctx.strokeStyle = isFlashing ? '#ffffff' : '#fed7aa';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(e.radius * 0.6, -e.radius * 0.4);
            ctx.lineTo(e.radius * 1.45, -e.radius * 0.2);
            ctx.moveTo(e.radius * 0.6, e.radius * 0.4);
            ctx.lineTo(e.radius * 1.45, e.radius * 0.2);
            ctx.stroke();

            // Visor de energía central en 3D
            if (!isFlashing) {
              ctx.fillStyle = '#ffffff';
              ctx.shadowColor = '#fed7aa';
              ctx.shadowBlur = 6;
              ctx.beginPath();
              ctx.ellipse(e.radius * 0.5, 0, 3.5, 1.8, 0, 0, Math.PI * 2);
              ctx.fill();
            }

            ctx.restore();
            break;
          }

          case 'tirador': {
            // Vástago del Ojo: Ojo arcano esférico 3D con anillo cardánico orbital rotando en perspectiva
            ctx.shadowColor = e.glowColor;
            ctx.shadowBlur = 14;

            // Anillo orbital arcano en 3D (elipse inclinada con rotación temporal)
            const ringAngle = performance.now() * 0.003;
            ctx.save();
            ctx.rotate(ringAngle);
            ctx.strokeStyle = isFlashing ? '#ffffff' : e.color;
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.ellipse(0, 0, e.radius * 1.45, e.radius * 0.55, 0.4, 0, Math.PI * 2);
            ctx.stroke();
            // Nódulo orbital brillante en el anillo
            const nodX = Math.cos(ringAngle * 2) * (e.radius * 1.45);
            const nodY = Math.sin(ringAngle * 2) * (e.radius * 0.55);
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(nodX, nodY, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Globo ocular esférico con gradiente 3D
            const eyeGrad = ctx.createRadialGradient(-e.radius * 0.35, -e.radius * 0.35, 1.5, 0, 0, e.radius * 0.95);
            eyeGrad.addColorStop(0, '#ffffff');
            eyeGrad.addColorStop(0.25, '#f3e8ff');
            eyeGrad.addColorStop(0.65, isFlashing ? '#ffffff' : e.accentColor);
            eyeGrad.addColorStop(1, '#1e0538');
            ctx.fillStyle = eyeGrad;
            ctx.beginPath();
            ctx.arc(0, 0, e.radius * 0.9, 0, Math.PI * 2);
            ctx.fill();

            // Iris y pupila dinámicos proyectados en la curvatura de la esfera 3D
            const gazeX = Math.cos(e.facingAngle) * (e.radius * 0.38);
            const gazeY = Math.sin(e.facingAngle) * (e.radius * 0.38);

            // Iris resplandeciente
            ctx.fillStyle = isFlashing ? '#ffffff' : '#c084fc';
            ctx.beginPath();
            ctx.arc(gazeX, gazeY, e.radius * 0.45, 0, Math.PI * 2);
            ctx.fill();

            // Pupila abisal dilatada
            ctx.fillStyle = '#0f021c';
            ctx.beginPath();
            ctx.arc(gazeX, gazeY, e.radius * 0.24, 0, Math.PI * 2);
            ctx.fill();

            // Punto de brillo especular corneal fijo
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(gazeX - 2, gazeY - 2, 1.8, 0, Math.PI * 2);
            ctx.fill();
            break;
          }

          case 'invocador': {
            // Clérigo del Vacío: Hechicero encapuchado volumétrico con pliegues en 3D y báculo mágico
            ctx.shadowColor = e.glowColor;
            ctx.shadowBlur = 12;

            // Círculo de invocación rúnico concéntrico en el suelo si está canalizando
            if (e.isSummoning) {
              ctx.save();
              const rot = performance.now() * 0.004;
              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 1.6;
              ctx.beginPath();
              ctx.arc(0, 0, e.radius * 2.3, 0, Math.PI * 2);
              ctx.stroke();

              // Líneas estelares interiores
              ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
              ctx.beginPath();
              for (let a = 0; a < 6; a++) {
                const ang = rot + (a * Math.PI / 3);
                const px = Math.cos(ang) * (e.radius * 2.3);
                const py = Math.sin(ang) * (e.radius * 2.3);
                ctx.moveTo(0, 0);
                ctx.lineTo(px, py);
              }
              ctx.stroke();
              ctx.restore();
            }

            // Manto / Túnica inferior con caída 3D
            const robeGrad = ctx.createLinearGradient(0, -e.radius, 0, e.radius * 1.1);
            robeGrad.addColorStop(0, isFlashing ? '#ffffff' : e.color);
            robeGrad.addColorStop(0.65, isFlashing ? '#ffffff' : e.accentColor);
            robeGrad.addColorStop(1, '#082f49');
            ctx.fillStyle = robeGrad;
            ctx.beginPath();
            ctx.ellipse(0, 3, e.radius * 0.88, e.radius * 0.75, 0, 0, Math.PI * 2);
            ctx.fill();

            // Capucha abovedada con profundidad
            const hoodGrad = ctx.createRadialGradient(-3, -e.radius * 0.5, 2, 0, -e.radius * 0.2, e.radius * 0.75);
            hoodGrad.addColorStop(0, isFlashing ? '#ffffff' : '#7dd3fc');
            hoodGrad.addColorStop(0.4, isFlashing ? '#ffffff' : e.color);
            hoodGrad.addColorStop(1, '#021e33');
            ctx.fillStyle = hoodGrad;
            ctx.beginPath();
            ctx.arc(0, -2, e.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();

            // Cavidad de sombra interior en la capucha
            ctx.fillStyle = '#030d1a';
            ctx.beginPath();
            ctx.ellipse(0, 0, e.radius * 0.55, e.radius * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Ojos etéreos de invocador que resplandecen en la oscuridad
            if (!isFlashing) {
              ctx.fillStyle = '#38bdf8';
              ctx.shadowColor = '#38bdf8';
              ctx.shadowBlur = 6;
              ctx.beginPath();
              ctx.arc(-3.5, 0, 1.8, 0, Math.PI * 2);
              ctx.arc(3.5, 0, 1.8, 0, Math.PI * 2);
              ctx.fill();
            }

            // Báculo ritual flotante 3D a un lado
            const staffAngle = Math.sin(performance.now() * 0.005) * 0.15;
            ctx.save();
            ctx.translate(e.radius * 0.95, -2);
            ctx.rotate(staffAngle);
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(0, -e.radius * 1.1);
            ctx.lineTo(0, e.radius * 1.1);
            ctx.stroke();

            // Orbe / Gema rúnica flotante en la punta del báculo
            ctx.fillStyle = '#38bdf8';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(0, -e.radius * 1.1, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            break;
          }

          case 'explosivo': {
            // Gargolita Inestable: Geoda volcánica 3D con grietas magmáticas y núcleo palpitante
            let pulseScale = 1.0;
            if (e.isTicking) {
              const freq = 22;
              pulseScale = 1.0 + Math.abs(Math.sin(e.fuseTimer * freq)) * 0.38;
            }

            ctx.shadowColor = e.isTicking ? 'rgba(239, 68, 68, 0.95)' : e.glowColor;
            ctx.shadowBlur = 16;

            // Púas de obsidiana 3D que sobresalen de la corteza
            const currentRad = e.radius * pulseScale;
            ctx.fillStyle = isFlashing ? '#ffffff' : '#451a03';
            for (let a = 0; a < 6; a++) {
              const ang = (a * Math.PI) / 3;
              const spX = Math.cos(ang) * (currentRad * 1.28);
              const spY = Math.sin(ang) * (currentRad * 1.28);
              const bX1 = Math.cos(ang - 0.25) * (currentRad * 0.85);
              const bY1 = Math.sin(ang - 0.25) * (currentRad * 0.85);
              const bX2 = Math.cos(ang + 0.25) * (currentRad * 0.85);
              const bY2 = Math.sin(ang + 0.25) * (currentRad * 0.85);
              ctx.beginPath();
              ctx.moveTo(bX1, bY1);
              ctx.lineTo(spX, spY);
              ctx.lineTo(bX2, bY2);
              ctx.closePath();
              ctx.fill();
            }

            // Cuerpo esférico ígneo con gradiente volcánico 3D
            const lavaGrad = ctx.createRadialGradient(-currentRad * 0.3, -currentRad * 0.3, 2, 0, 0, currentRad);
            lavaGrad.addColorStop(0, '#ffffff');
            lavaGrad.addColorStop(0.2, e.isTicking ? '#fef08a' : '#fde047');
            lavaGrad.addColorStop(0.55, e.isTicking ? '#ef4444' : e.color);
            lavaGrad.addColorStop(0.85, isFlashing ? '#ffffff' : e.accentColor);
            lavaGrad.addColorStop(1, '#2c0b02');
            ctx.fillStyle = lavaGrad;
            ctx.beginPath();
            ctx.arc(0, 0, currentRad, 0, Math.PI * 2);
            ctx.fill();

            // Grietas magmáticas ardientes
            ctx.strokeStyle = e.isTicking ? '#ffffff' : '#fef08a';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(-currentRad * 0.5, -currentRad * 0.3);
            ctx.lineTo(0, 0);
            ctx.lineTo(currentRad * 0.4, -currentRad * 0.4);
            ctx.moveTo(0, 0);
            ctx.lineTo(currentRad * 0.2, currentRad * 0.5);
            ctx.stroke();
            break;
          }

          case 'escudado': {
            // Guardián Criptal: Coloso blindado en 3D con torre-escudo frontal pesada y matriz de defensa
            ctx.shadowColor = e.glowColor;
            ctx.shadowBlur = 10;

            // Hombreras metálicas y coraza dorsal
            const guardGrad = ctx.createRadialGradient(-e.radius * 0.35, -e.radius * 0.35, 2, 0, 0, e.radius);
            guardGrad.addColorStop(0, '#a7f3d0');
            guardGrad.addColorStop(0.3, isFlashing ? '#ffffff' : e.color);
            guardGrad.addColorStop(0.75, isFlashing ? '#ffffff' : e.accentColor);
            guardGrad.addColorStop(1, '#022c22');
            ctx.fillStyle = guardGrad;
            ctx.beginPath();
            ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
            ctx.fill();

            // Hombreras acorazadas a ambos flancos
            const pXg = Math.cos(e.facingAngle + Math.PI / 2) * (e.radius * 0.85);
            const pYg = Math.sin(e.facingAngle + Math.PI / 2) * (e.radius * 0.85);
            ctx.fillStyle = isFlashing ? '#ffffff' : '#064e3b';
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(pXg, pYg, 4.5, 0, Math.PI * 2);
            ctx.arc(-pXg, -pYg, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Escudo frontal arqueado con perspectiva 3D
            ctx.save();
            ctx.rotate(e.facingAngle);

            // Resplandor de energía de la barrera
            ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
            ctx.lineWidth = 9;
            ctx.beginPath();
            ctx.arc(5, 0, e.radius * 1.32, -Math.PI / 3, Math.PI / 3);
            ctx.stroke();

            // Borde metálico exterior del escudo
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 4.5;
            ctx.beginPath();
            ctx.arc(5, 0, e.radius * 1.32, -Math.PI / 3, Math.PI / 3);
            ctx.stroke();

            // Placa interior del escudo con remaches
            ctx.strokeStyle = '#065f46';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(3.5, 0, e.radius * 1.25, -Math.PI / 3.4, Math.PI / 3.4);
            ctx.stroke();
            ctx.restore();
            break;
          }

          case 'jefe_cripta':
          case 'jefe_magma': {
            const isMagma = e.typeId === 'jefe_magma';
            ctx.shadowColor = isFlashing ? '#ffffff' : (isMagma ? '#f97316' : '#a855f7');
            ctx.shadowBlur = 24;

            // Aura colosal de furia en Fase 2 (pulsante y rotatoria)
            if (e.bossPhase === 2) {
              const ragePulse = Math.sin(performance.now() * 0.012) * 5;
              ctx.strokeStyle = isMagma ? '#ef4444' : '#ec4899';
              ctx.lineWidth = 3.5;
              ctx.beginPath();
              ctx.arc(0, 0, e.radius + 10 + ragePulse, 0, Math.PI * 2);
              ctx.stroke();
            }

            // Monolitos de basalto orbitales 3D girando alrededor del jefe
            const stoneCount = isMagma ? 5 : 4;
            const orbitRadius = e.radius * 1.55;
            const orbitSpeed = performance.now() * 0.0025;
            for (let s = 0; s < stoneCount; s++) {
              const stAng = orbitSpeed + (s * Math.PI * 2 / stoneCount);
              const stX = Math.cos(stAng) * orbitRadius;
              const stY = Math.sin(stAng) * (orbitRadius * 0.55); // Perspectiva 3D elíptica
              ctx.fillStyle = isMagma ? '#7c2d12' : '#3b0764';
              ctx.strokeStyle = isMagma ? '#fbbf24' : '#c084fc';
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.ellipse(stX, stY, 6.5, 4.2, stAng, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }

            // Placas de armadura dorsal masiva
            ctx.fillStyle = isMagma ? '#431407' : '#1e0538';
            ctx.beginPath();
            ctx.ellipse(0, 4, e.radius * 1.05, e.radius * 0.88, 0, 0, Math.PI * 2);
            ctx.fill();

            // Cuerpo titánico con gradiente volumétrico 3D
            const bossGrad = ctx.createRadialGradient(-e.radius * 0.35, -e.radius * 0.4, 3, 0, 0, e.radius * 1.1);
            bossGrad.addColorStop(0, '#ffffff');
            bossGrad.addColorStop(0.2, isFlashing ? '#ffffff' : (isMagma ? '#fed7aa' : '#e9d5ff'));
            bossGrad.addColorStop(0.5, isFlashing ? '#ffffff' : e.color);
            bossGrad.addColorStop(0.85, isFlashing ? '#ffffff' : e.accentColor);
            bossGrad.addColorStop(1, '#0b0214');
            ctx.fillStyle = bossGrad;
            ctx.beginPath();
            ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
            ctx.fill();

            // Núcleo rúnico central palpitante (Corazón del Abismo / Foco de Magma)
            const corePulse = Math.sin(performance.now() * 0.008) * 2;
            const coreGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, (e.radius * 0.38) + corePulse);
            coreGrad.addColorStop(0, '#ffffff');
            coreGrad.addColorStop(0.5, isMagma ? '#f97316' : '#c084fc');
            coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.arc(0, 0, (e.radius * 0.38) + corePulse, 0, Math.PI * 2);
            ctx.fill();

            // Corona demoníaca / Cornamenta titánica facetada
            ctx.fillStyle = isMagma ? '#fbbf24' : '#c084fc';
            ctx.beginPath();
            ctx.moveTo(-e.radius * 0.8, -e.radius * 0.3);
            ctx.lineTo(-e.radius * 1.25, -e.radius * 1.35);
            ctx.lineTo(-e.radius * 0.45, -e.radius * 0.8);
            ctx.lineTo(0, -e.radius * 1.5);
            ctx.lineTo(e.radius * 0.45, -e.radius * 0.8);
            ctx.lineTo(e.radius * 1.25, -e.radius * 1.35);
            ctx.lineTo(e.radius * 0.8, -e.radius * 0.3);
            ctx.closePath();
            ctx.fill();

            // Ojos ardientes con proyección direccional
            if (!isFlashing) {
              const eyeGazeX = Math.cos(e.facingAngle) * 5;
              const eyeGazeY = Math.sin(e.facingAngle) * 4;
              ctx.fillStyle = isMagma ? '#fef08a' : '#f43f5e';
              ctx.shadowColor = isMagma ? '#fbbf24' : '#f43f5e';
              ctx.shadowBlur = 10;
              ctx.beginPath();
              ctx.arc(eyeGazeX - 8, eyeGazeY - 1, 4, 0, Math.PI * 2);
              ctx.arc(eyeGazeX + 8, eyeGazeY - 1, 4, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(eyeGazeX - 8, eyeGazeY - 1, 1.8, 0, Math.PI * 2);
              ctx.arc(eyeGazeX + 8, eyeGazeY - 1, 1.8, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
          }
        }

        ctx.restore();

        // 4. Barra de vida si está dañado
        if (e.hp < e.maxHp) {
          const barW = e.radius * 2.2;
          const barH = 3;
          const hpRatio = Math.max(0, e.hp / e.maxHp);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
          ctx.fillRect(-barW / 2, -e.radius - 8, barW, barH);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-barW / 2, -e.radius - 8, barW * hpRatio, barH);
        }

        ctx.restore();
      }
    }
  }

  // ============================================================================
  // 6. JUGADOR (MODELO VOLUMÉTRICO PSEUDO-3D, AUTO-ATAQUE Y ESTALLIDO)
  // ============================================================================
  class Player {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.radius = CFG.PLAYER_RADIUS || 14;
      this.speed = CFG.PLAYER_SPEED || 185;
      this.maxHp = CFG.PLAYER_MAX_HP || 100;
      this.hp = this.maxHp;

      this.facingAngle = 0;
      this.isMoving = false;

      // Auto-ataque
      this.attackRange = CFG.AUTO_ATTACK_RANGE || 260;
      this.attackCooldown = CFG.AUTO_ATTACK_COOLDOWN || 0.38;
      this.attackTimer = 0;
      this.targetEnemy = null;

      // Habilidad Especial: "Estallido Espectral"
      this.specialCooldown = CFG.SPECIAL_COOLDOWN || 7.0;
      this.specialTimer = 0;
      this.specialRadius = CFG.SPECIAL_RADIUS || 185;
      this.specialDamage = CFG.SPECIAL_DAMAGE || 80;
      this.specialKnockback = CFG.SPECIAL_KNOCKBACK || 380;

      // Invulnerabilidad (i-frames)
      this.iFrameDuration = CFG.PLAYER_IFRAME_DURATION || 0.65;
      this.iFrameTimer = 0;

      // Animación volumétrica Z y balanceo al caminar
      this.walkBobTimer = 0;
      this.companionAngle = 0;

      // Experiencia, Nivel y Progresión (Fase 3)
      this.level = 1;
      this.currentXp = 0;
      this.xpToNextLevel = CFG.XP_BASE || 28;
      this.pickupRadius = CFG.BASE_PICKUP_RADIUS || 90;
      this.gold = 0;
      this.activeUpgrades = {};

      // Atributos modificables por mejoras
      this.damageMult = 1.0;
      this.pierceCount = 0;
      this.bounceCount = 0;
      this.extraProjectiles = 0;
      this.vampirismChance = 0;
      this.vampirismHeal = 0;
      this.critChance = 0.05;
      this.goldMult = 1.0;
      this.areaMult = 1.0;

      // Sinergias
      this.synergyShardOnPierce = false;
      this.synergyExplosiveImpact = false;
      this.synergyChainLightning = false;
      this.synergySoulHarvest = false;
      this.soulHarvestBuffTimer = 0;

      // Escudo / Barrera
      this.hasBarrier = false;
      this.barrierInterval = 0;
      this.barrierTimer = 0;
      this.barrierActive = false;

      // Fase 4: Personajes y Estilos de Arma
      this.characterId = 'peregrino';
      this.weaponStyle = 'proyectil'; // 'proyectil', 'orbe', 'onda'
      this.color = '#38bdf8';
      this.accentColor = '#0284c7';

      // Arma Estilo Orbe Giratorio
      this.orbitAngle = 0;
      this.orbitCount = 2;
      this.orbitRadius = CFG.WEAPON_ORBIT_RADIUS || 72;
      this.orbitSpeed = CFG.WEAPON_ORBIT_SPEED || 2.8;
      this.orbitDamage = CFG.WEAPON_ORBIT_DAMAGE || 16;
      this.orbitCooldownTimer = 0;

      // Arma Estilo Onda de Área
      this.pulseTimer = 0;
      this.pulseCooldown = CFG.WEAPON_PULSE_COOLDOWN || 1.4;
      this.pulseRadius = CFG.WEAPON_PULSE_RADIUS || 140;
      this.pulseDamage = CFG.WEAPON_PULSE_DAMAGE || 38;
      this.pulseVisualRadius = 0;
      this.pulseVisualAlpha = 0;
    }

    applyCharacter(charData) {
      if (!charData) return;
      this.characterId = charData.id || 'peregrino';
      this.weaponStyle = charData.weaponStyle || charData.startingWeapon || 'proyectil';
      this.baseMaxHp = charData.hp || 100;
      this.maxHp = this.baseMaxHp;
      this.hp = this.maxHp;
      this.baseSpeed = charData.speed || 185;
      this.speed = this.baseSpeed;
      this.baseAttackCooldown = charData.attackCooldown || 0.38;
      this.attackCooldown = this.baseAttackCooldown;
      this.color = charData.color || '#38bdf8';
      this.accentColor = charData.accentColor || '#0284c7';
      if (charData.critChance !== undefined) this.critChance = charData.critChance;
      if (charData.damageMult !== undefined) this.damageMult = charData.damageMult;
      if (charData.attackRateMult !== undefined) this.attackRateMult = charData.attackRateMult;
      if (charData.areaMult !== undefined) this.areaMult = charData.areaMult;
      if (charData.specialDamage) this.specialDamage = charData.specialDamage;
      if (charData.specialRadius) this.specialRadius = charData.specialRadius;
      if (charData.specialCooldown) {
        this.baseSpecialCooldown = charData.specialCooldown;
        this.specialCooldown = charData.specialCooldown;
      }
      if (charData.specialAbility) {
        if (charData.specialAbility.damage) this.specialDamage = charData.specialAbility.damage;
        if (charData.specialAbility.radius) this.specialRadius = charData.specialAbility.radius;
        if (charData.specialAbility.cooldown) {
          this.baseSpecialCooldown = charData.specialAbility.cooldown;
          this.specialCooldown = charData.specialAbility.cooldown;
        }
      }
    }


    gainXp(amount) {
      this.currentXp += amount;
      let levelsGained = 0;

      while (this.currentXp >= this.xpToNextLevel) {
        this.currentXp -= this.xpToNextLevel;
        this.level++;
        levelsGained++;
        this.xpToNextLevel = Math.round((CFG.XP_BASE || 28) * Math.pow(this.level, CFG.XP_EXPONENT || 1.35));
      }

      return levelsGained;
    }

    update(dt, inputX, inputY, room, spatialHash, projectilePool, particles, audio, enemyProjectiles, onEnemyKilled, floatingTexts) {
      const lenSq = inputX * inputX + inputY * inputY;
      this.isMoving = lenSq > 0.04;

      if (this.isMoving) {
        const len = Math.sqrt(lenSq);
        const normX = inputX / len;
        const normY = inputY / len;
        this.vx = normX * this.speed;
        this.vy = normY * this.speed;
        this.facingAngle = Math.atan2(normY, normX);
        this.walkBobTimer += dt * 14;
      } else {
        this.vx = 0;
        this.vy = 0;
        this.walkBobTimer = 0;
      }

      this.companionAngle += dt * 2.8;

      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Confinar dentro de la sala si no está pasando por una puerta
      const minX = room.wallThickness + this.radius;
      const maxX = room.width - room.wallThickness - this.radius;
      const minY = room.wallThickness + this.radius;
      const maxY = room.height - room.wallThickness - this.radius;

      if (this.x < minX) this.x = minX;
      if (this.x > maxX) this.x = maxX;
      if (this.y < minY) this.y = minY;
      if (this.y > maxY) this.y = maxY;

      if (this.iFrameTimer > 0) this.iFrameTimer -= dt;
      if (this.specialTimer > 0) this.specialTimer -= dt;
      if (this.soulHarvestBuffTimer > 0) this.soulHarvestBuffTimer -= dt;
      if (this.pulseVisualAlpha > 0) this.pulseVisualAlpha = Math.max(0, this.pulseVisualAlpha - dt * 2.5);

      if (this.hasBarrier && !this.barrierActive) {
        this.barrierTimer -= dt;
        if (this.barrierTimer <= 0) {
          this.barrierActive = true;
        }
      }

      // ====================================================================
      // ESTILOS DE ARMA (Fase 4: Proyectil, Orbe Giratorio, Onda de Área)
      // ====================================================================
      if (this.weaponStyle === 'orbe') {
        this.orbitAngle += (this.orbitSpeed * dt);
        this.orbitCooldownTimer -= dt;

        if (this.orbitCooldownTimer <= 0) {
          this.orbitCooldownTimer = 0.20;
          const orbsCount = this.orbitCount + (this.extraProjectiles || 0);
          for (let i = 0; i < orbsCount; i++) {
            const ang = this.orbitAngle + (i * Math.PI * 2 / orbsCount);
            const ox = this.x + Math.cos(ang) * (this.orbitRadius * this.areaMult);
            const oy = this.y + Math.sin(ang) * (this.orbitRadius * this.areaMult);
            const orbHits = [];
            spatialHash.queryRange(ox, oy, 18 * this.areaMult, orbHits);

            for (let j = 0; j < orbHits.length; j++) {
              const e = orbHits[j];
              if (!e.active || e.hp <= 0) continue;
              let dmg = Math.round((this.orbitDamage || 16) * this.damageMult);
              if (this.soulHarvestBuffTimer > 0) dmg = Math.round(dmg * 1.25);
              const isCrit = Math.random() < this.critChance;
              if (isCrit) dmg = Math.round(dmg * 2.0);

              const isDead = e.takeDamage(dmg, Math.cos(ang) * 90, Math.sin(ang) * 90, ox, oy);
              if (floatingTexts) floatingTexts.spawn(e.x, e.y, isCrit ? `${dmg}!` : dmg, isCrit ? '#fbbf24' : '#f43f5e', isCrit);
              if (particles) {
                particles.spawn(ox, oy, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, 0.2, 3, '#e11d48');
              }
              if (isDead && onEnemyKilled) {
                onEnemyKilled(e);
              }
            }
          }
        }
      } else if (this.weaponStyle === 'onda') {
        this.pulseTimer -= dt;
        if (this.pulseTimer <= 0) {
          this.pulseTimer = this.pulseCooldown * (this.attackCooldown / 0.38);
          this.pulseVisualRadius = this.pulseRadius * this.areaMult;
          this.pulseVisualAlpha = 1.0;

          const waveHits = [];
          spatialHash.queryRange(this.x, this.y, this.pulseVisualRadius, waveHits);

          for (let j = 0; j < waveHits.length; j++) {
            const e = waveHits[j];
            if (!e.active || e.hp <= 0) continue;
            const dx = e.x - this.x;
            const dy = e.y - this.y;
            const dist = Math.hypot(dx, dy) || 1;
            const nx = dx / dist;
            const ny = dy / dist;

            let dmg = Math.round((this.pulseDamage || 38) * this.damageMult);
            if (this.soulHarvestBuffTimer > 0) dmg = Math.round(dmg * 1.25);
            const isCrit = Math.random() < this.critChance;
            if (isCrit) dmg = Math.round(dmg * 2.0);

            const isDead = e.takeDamage(dmg, nx * 220, ny * 220, this.x, this.y);
            if (floatingTexts) floatingTexts.spawn(e.x, e.y, isCrit ? `${dmg}!` : dmg, isCrit ? '#fbbf24' : '#38bdf8', isCrit);
            if (particles) {
              for (let k = 0; k < 3; k++) {
                particles.spawn(e.x, e.y, nx * 60 + (Math.random() - 0.5) * 40, ny * 60 + (Math.random() - 0.5) * 40, 0.25, 3.5, '#38bdf8');
              }
            }
            if (isDead && onEnemyKilled) {
              onEnemyKilled(e);
            }
          }

          // Destruir proyectiles enemigos en el radio de la onda
          if (enemyProjectiles) {
            for (let i = 0; i < enemyProjectiles.pool.length; i++) {
              const ep = enemyProjectiles.pool[i];
              if (!ep.active) continue;
              const edist = Math.hypot(ep.x - this.x, ep.y - this.y);
              if (edist <= this.pulseVisualRadius) {
                ep.active = false;
                if (enemyProjectiles.activeCount > 0) enemyProjectiles.activeCount--;
                if (particles) {
                  particles.spawn(ep.x, ep.y, 0, 0, 0.2, 3, '#38bdf8');
                }
              }
            }
          }

          if (audio && audio.playExplosion) audio.playExplosion();
        }
      } else {
        // Estilo de arma por defecto: 'proyectil' (Auto-ataque a distancia)
        this.attackTimer -= dt;
        const nearest = spatialHash.getNearest(
          this.x,
          this.y,
          this.attackRange,
          (ent) => ent.active && ent.hp > 0
        );

        this.targetEnemy = nearest ? nearest.entity : null;

        if (this.attackTimer <= 0 && this.targetEnemy) {
          this.fireAutoAttack(projectilePool, particles, audio);
          this.attackTimer = this.attackCooldown;
        }
      }
    }

    fireAutoAttack(projectilePool, particles, audio) {
      if (!this.targetEnemy) return;

      const baseAngle = Math.atan2(this.targetEnemy.y - this.y, this.targetEnemy.x - this.x);
      this.facingAngle = baseAngle;

      let dmg = (CFG.BULLET_DAMAGE || 22) * this.damageMult;
      if (this.soulHarvestBuffTimer > 0) dmg *= 1.25;

      const isCrit = Math.random() < this.critChance;
      if (isCrit) dmg = Math.round(dmg * 2.0);

      const totalProjectiles = 1 + (this.extraProjectiles || 0);
      const spreadAngle = totalProjectiles > 1 ? 0.22 : 0;
      const startAngle = baseAngle - ((totalProjectiles - 1) * spreadAngle) / 2;

      for (let i = 0; i < totalProjectiles; i++) {
        const shotAngle = startAngle + i * spreadAngle;
        projectilePool.spawn(
          this.x + Math.cos(shotAngle) * (this.radius + 6),
          this.y + Math.sin(shotAngle) * (this.radius + 6),
          shotAngle,
          CFG.BULLET_SPEED || 420,
          dmg,
          CFG.BULLET_LIFETIME || 0.85,
          this.pierceCount || 0,
          this.bounceCount || 0,
          isCrit,
          this.areaMult || 1.0,
          this.synergyShardOnPierce,
          this.synergyExplosiveImpact
        );
      }

      if (particles) {
        particles.spawn(
          this.x + Math.cos(baseAngle) * 16,
          this.y + Math.sin(baseAngle) * 16,
          Math.cos(baseAngle) * 50 + (Math.random() - 0.5) * 30,
          Math.sin(baseAngle) * 50 + (Math.random() - 0.5) * 30,
          0.18,
          3 * (this.areaMult || 1.0),
          isCrit ? '#fbbf24' : (CFG.PALETTE ? CFG.PALETTE.BULLET : '#a855f7')
        );
      }

      if (audio && audio.playShoot) audio.playShoot();
    }

    useSpecialAbility(spatialHash, enemyPool, particles, floatingTexts, audio, onScreenShake, onEnemyKilled) {
      if (this.specialTimer > 0 || this.hp <= 0) return false;

      this.specialTimer = this.specialCooldown;

      const enemiesHit = [];
      spatialHash.queryRange(this.x, this.y, this.specialRadius, enemiesHit);

      for (let i = 0; i < enemiesHit.length; i++) {
        const e = enemiesHit[i];
        if (!e.active || e.hp <= 0) continue;

        const dx = e.x - this.x;
        const dy = e.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        const nx = dx / dist;
        const ny = dy / dist;

        // Inflige daño letal y empuje masivo
        const isDead = e.takeDamage(this.specialDamage, nx * this.specialKnockback, ny * this.specialKnockback, this.x, this.y);
        floatingTexts.spawn(e.x, e.y, `${this.specialDamage}!`, '#facc15', true);

        // Chispas del estallido
        for (let k = 0; k < 6; k++) {
          particles.spawn(
            e.x,
            e.y,
            nx * 90 + (Math.random() - 0.5) * 80,
            ny * 90 + (Math.random() - 0.5) * 80,
            0.35,
            3.5,
            '#e11d48'
          );
        }

        // SOLUCIÓN DEFINITIVA BUG: Eliminar inmediatamente la entidad muerta y sumar la baja
        if (isDead) {
          e.active = false;
          if (onEnemyKilled) {
            onEnemyKilled(e);
          }
        }
      }

      // Onda expansiva de fuego espectral
      for (let a = 0; a < Math.PI * 2; a += 0.22) {
        particles.spawn(
          this.x,
          this.y,
          Math.cos(a) * 230,
          Math.sin(a) * 230,
          0.38,
          4.5,
          '#f43f5e'
        );
      }

      if (audio && audio.playExplosion) audio.playExplosion();
      if (onScreenShake) onScreenShake(9, 0.28);

      return true;
    }

    takeDamage(dmg, knockX = 0, knockY = 0) {
      if (this.godMode) return false;
      if (this.iFrameTimer > 0 || this.hp <= 0) return false;

      // Si la barrera espectral está activa, anula por completo el daño
      if (this.hasBarrier && this.barrierActive) {
        this.barrierActive = false;
        this.barrierTimer = this.barrierInterval || 16;
        this.iFrameTimer = 0.4;
        return 'BLOCKED';
      }

      this.hp = Math.max(0, this.hp - dmg);
      this.iFrameTimer = this.iFrameDuration;

      this.x += knockX * 12;
      this.y += knockY * 12;

      return true;
    }

    render(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);

      // Si tiene barrera activa, dibujar hexágono etéreo protector
      if (this.hasBarrier && this.barrierActive) {
        ctx.save();
        const pulse = Math.sin(performance.now() * 0.006) * 3;
        ctx.strokeStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (let a = 0; a < 6; a++) {
          const ang = (a * Math.PI) / 3 + performance.now() * 0.001;
          const px = Math.cos(ang) * (this.radius + 10 + pulse);
          const py = Math.sin(ang) * (this.radius + 10 + pulse);
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // Efecto parpadeo de invulnerabilidad (i-frames)
      if (this.iFrameTimer > 0 && Math.floor(this.iFrameTimer * 20) % 2 === 0) {
        ctx.globalAlpha = 0.35;
      }

      // ======================================================================
      // RENDERIZADO VOLUMÉTRICO PSEUDO-3D / 2.5D
      // ======================================================================
      // Elevación Z por paso (bobbing)
      const z = Math.abs(Math.sin(this.walkBobTimer)) * 4.2;

      // 1. Sombra suave en el suelo (se encoge y difumina con la elevación Z)
      const shadowScale = 1.0 - z * 0.04;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      ctx.ellipse(0, 9, this.radius * 1.15 * shadowScale, this.radius * 0.5 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();

      // 1.5 Onda de Área en Expansión (Estilo de Arma 'onda')
      if (this.pulseVisualAlpha > 0) {
        ctx.save();
        ctx.strokeStyle = `rgba(56, 189, 248, ${this.pulseVisualAlpha})`;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, this.pulseVisualRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 255, 255, ${this.pulseVisualAlpha * 0.7})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, this.pulseVisualRadius * 0.85, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 1.6 Orbes Giratorios Celestiales (Estilo de Arma 'orbe')
      if (this.weaponStyle === 'orbe') {
        const orbsCount = this.orbitCount + (this.extraProjectiles || 0);
        const oRadius = this.orbitRadius * this.areaMult;
        ctx.save();
        for (let i = 0; i < orbsCount; i++) {
          const ang = this.orbitAngle + (i * Math.PI * 2 / orbsCount);
          const ox = Math.cos(ang) * oRadius;
          const oy = Math.sin(ang) * oRadius - z;

          ctx.shadowColor = this.color || '#ec4899';
          ctx.shadowBlur = 10;
          ctx.fillStyle = this.color || '#ec4899';
          ctx.beginPath();
          ctx.arc(ox, oy, 7 * this.areaMult, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ox - 1, oy - 1, 3 * this.areaMult, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 2. Halo de luz ambiental del explorador
      const lightGrad = ctx.createRadialGradient(0, -z, 6, 0, -z, this.attackRange * 0.45);
      lightGrad.addColorStop(0, `${this.color}29` || 'rgba(56, 189, 248, 0.16)');
      lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.arc(0, -z, this.attackRange * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // 3. Cristal Rúnico Orbital 3D (Capa posterior cuando pasa por detrás)
      const orbRadX = 22;
      const orbRadY = 10;
      const orbX = Math.cos(this.companionAngle) * orbRadX;
      const orbY = Math.sin(this.companionAngle) * orbRadY - z - 6;
      const isOrbBehind = Math.sin(this.companionAngle) < 0;

      const drawOrb = () => {
        ctx.save();
        ctx.translate(orbX, orbY);
        // Sombra propia del cristal en el suelo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 15 + z, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Facetas del cristal octaédrico
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(5, 0);
        ctx.lineTo(0, 7);
        ctx.lineTo(-5, 0);
        ctx.closePath();
        ctx.fill();

        // Reflejo especular
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(3, 0);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };

      if (isOrbBehind) drawOrb();

      // 4. Retícula hacia el enemigo enfocado
      if (this.targetEnemy && this.targetEnemy.active && this.weaponStyle === 'proyectil') {
        ctx.save();
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, -z);
        ctx.lineTo(this.targetEnemy.x - this.x, this.targetEnemy.y - this.y);
        ctx.stroke();
        ctx.restore();
      }

      // 5. CUERPO VOLUMÉTRICO: Capa y Manto inferior
      ctx.save();
      ctx.translate(0, -z);

      // Manto/Capa con curvatura y caída de tela
      ctx.fillStyle = this.accentColor;
      ctx.beginPath();
      ctx.ellipse(0, 4, this.radius * 0.95, this.radius * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Torso Cilíndrico con sombreado de profundidad
      const torsoGrad = ctx.createLinearGradient(-this.radius, -this.radius, this.radius, this.radius);
      torsoGrad.addColorStop(0, this.color);
      torsoGrad.addColorStop(0.5, this.accentColor);
      torsoGrad.addColorStop(1, '#080812');
      ctx.fillStyle = torsoGrad;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.9, 0, Math.PI * 2);
      ctx.fill();

      // Hombreras flotantes (pauldrons) con bisel 3D
      const pauldronAngle = this.facingAngle;
      const leftPaux = Math.cos(pauldronAngle - Math.PI / 2) * (this.radius + 1);
      const leftPauy = Math.sin(pauldronAngle - Math.PI / 2) * (this.radius + 1);
      const rightPaux = Math.cos(pauldronAngle + Math.PI / 2) * (this.radius + 1);
      const rightPauy = Math.sin(pauldronAngle + Math.PI / 2) * (this.radius + 1);

      ctx.fillStyle = this.accentColor;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(leftPaux, leftPauy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(rightPaux, rightPauy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cabeza / Casco esférico con punto de luz cenital (simula esfera 3D)
      const headGrad = ctx.createRadialGradient(-3, -5, 2, 0, -2, this.radius * 0.7);
      headGrad.addColorStop(0, '#ffffff');
      headGrad.addColorStop(0.3, this.color);
      headGrad.addColorStop(0.85, this.accentColor);
      headGrad.addColorStop(1, '#030712');
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.arc(0, -2, this.radius * 0.68, 0, Math.PI * 2);
      ctx.fill();

      // Visor con perspectiva cilíndrica (se desplaza sobre la esfera según la dirección)
      const visorOffsetX = Math.cos(this.facingAngle) * 5;
      const visorOffsetY = Math.sin(this.facingAngle) * 4;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(visorOffsetX, visorOffsetY - 2, 4.5, 2.2, this.facingAngle, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Cristal Rúnico Orbital (Capa frontal cuando pasa por delante)
      if (!isOrbBehind) drawOrb();

      ctx.restore();
    }
  }

  // ============================================================================
  // 7. SALA Y PUERTAS (CAPA ESTÁTICA OFFSCREEN Y DETECCIÓN DE PASO)
  // ============================================================================
  class Room {
    constructor(width = CFG.ROOM_WIDTH || 960, height = CFG.ROOM_HEIGHT || 640, wallThickness = CFG.WALL_THICKNESS || 32) {
      this.width = width;
      this.height = height;
      this.wallThickness = wallThickness;
      this.doorWidth = CFG.DOOR_WIDTH || 72;
      this.doorThickness = CFG.DOOR_THICKNESS || 16;
      this.offscreenCanvas = null;
      this.cachedRoomData = null;
    }

    buildOffscreen(roomData, currentBiome = null) {
      this.cachedRoomData = roomData;
      if (typeof document === 'undefined') return;

      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = this.width;
      this.offscreenCanvas.height = this.height;
      const ctx = this.offscreenCanvas.getContext('2d');

      const wt = this.wallThickness;
      const dw = this.doorWidth;
      const doors = roomData ? roomData.doors : { N: true, S: true, E: true, W: true };

      // Paleta según bioma
      const pal = (currentBiome && currentBiome.palette) ? currentBiome.palette : (CFG.PALETTE || {});
      const colBg = pal.BG || '#07070a';
      const colDark = pal.FLOOR_DARK || '#0f0f18';
      const colLight = pal.FLOOR_LIGHT || '#161622';
      const colWall = pal.WALL || '#1e1c2e';
      const colWallBorder = pal.WALL_BORDER || '#383452';

      // 1. Suelo de baldosas
      ctx.fillStyle = colBg;
      ctx.fillRect(0, 0, this.width, this.height);

      const tileSize = 48;
      for (let x = wt; x < this.width - wt; x += tileSize) {
        for (let y = wt; y < this.height - wt; y += tileSize) {
          const isAlt = ((x / tileSize) + (y / tileSize)) % 2 === 0;
          ctx.fillStyle = isAlt ? colDark : colLight;
          ctx.fillRect(x, y, tileSize, tileSize);
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, tileSize, tileSize);
        }
      }

      // 2. Decoración central según tipo de sala
      const cx = this.width / 2;
      const cy = this.height / 2;

      if (roomData && roomData.type === 'jefe') {
        // Gran círculo ritual de jefe
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, 140, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 90, 0, Math.PI * 2);
        ctx.stroke();

        // Runas del portal / estrella
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          ctx.moveTo(cx + Math.cos(a) * 80, cy + Math.sin(a) * 80);
          ctx.lineTo(cx + Math.cos(a) * 140, cy + Math.sin(a) * 140);
        }
        ctx.stroke();
      } else if (roomData && roomData.type === 'tesoro') {
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
        ctx.lineWidth = 3;
        ctx.strokeRect(cx - 50, cy - 50, 100, 100);
      } else if (roomData && roomData.type === 'descanso') {
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.35)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, 90, 0, Math.PI * 2);
        ctx.stroke();
      } else if (roomData && roomData.type === 'elite') {
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.35)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, 110, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.18)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 130, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 3. Muros perimetrales con aberturas en las puertas existentes
      ctx.fillStyle = colWall;

      // Muro Norte
      if (doors.N) {
        ctx.fillRect(0, 0, cx - dw / 2, wt);
        ctx.fillRect(cx + dw / 2, 0, cx - dw / 2, wt);
      } else {
        ctx.fillRect(0, 0, this.width, wt);
      }

      // Muro Sur
      if (doors.S) {
        ctx.fillRect(0, this.height - wt, cx - dw / 2, wt);
        ctx.fillRect(cx + dw / 2, this.height - wt, cx - dw / 2, wt);
      } else {
        ctx.fillRect(0, this.height - wt, this.width, wt);
      }

      // Muro Oeste
      if (doors.W) {
        ctx.fillRect(0, 0, wt, cy - dw / 2);
        ctx.fillRect(0, cy + dw / 2, wt, cy - dw / 2);
      } else {
        ctx.fillRect(0, 0, wt, this.height);
      }

      // Muro Este
      if (doors.E) {
        ctx.fillRect(this.width - wt, 0, wt, cy - dw / 2);
        ctx.fillRect(this.width - wt, cy + dw / 2, wt, cy - dw / 2);
      } else {
        ctx.fillRect(this.width - wt, 0, wt, this.height);
      }

      // Bordes de piedra
      ctx.strokeStyle = colWallBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(wt - 1, wt - 1, this.width - wt * 2 + 2, this.height - wt * 2 + 2);
    }

    render(ctx, doorsLocked = false) {
      if (this.offscreenCanvas) {
        ctx.drawImage(this.offscreenCanvas, 0, 0);
      }

      // Renderizar el estado de las puertas (Abiertas = Etereo Cyan / Bloqueadas = Barrera Carmesí)
      if (!this.cachedRoomData) return;
      const doors = this.cachedRoomData.doors;
      const cx = this.width / 2;
      const cy = this.height / 2;
      const wt = this.wallThickness;
      const dw = this.doorWidth;

      const drawDoorBarrier = (x, y, w, h, isVertical, dir) => {
        ctx.save();
        if (doorsLocked) {
          // Barrera de energía carmesí cerrada (bloqueo durante combate)
          ctx.fillStyle = 'rgba(244, 63, 94, 0.5)';
          ctx.strokeStyle = '#f43f5e';
          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 14;
          ctx.fillRect(x, y, w, h);
          ctx.strokeRect(x, y, w, h);

          // Rayos de contención cruzados
          ctx.strokeStyle = '#fecdd3';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          if (isVertical) {
            ctx.moveTo(x, y); ctx.lineTo(x + w, y + h);
            ctx.moveTo(x + w, y); ctx.lineTo(x, y + h);
          } else {
            ctx.moveTo(x, y); ctx.lineTo(x + w, y + h);
            ctx.moveTo(x + w, y); ctx.lineTo(x, y + h);
          }
          ctx.stroke();

          // Símbolo de candado
          ctx.fillStyle = '#f43f5e';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🔒', x + w / 2, y + h / 2);
        } else {
          // Portal abierto con resplandor cyan etéreo pulsante
          const pulse = Math.sin(performance.now() * 0.007) * 0.15 + 0.35;
          ctx.fillStyle = `rgba(56, 189, 248, ${pulse})`;
          ctx.strokeStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 12;
          ctx.fillRect(x, y, w, h);
          ctx.strokeRect(x, y, w, h);

          // Flecha direccional animada indicando paso libre
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          let arrow = '▲';
          if (dir === 'S') arrow = '▼';
          else if (dir === 'E') arrow = '►';
          else if (dir === 'W') arrow = '◄';
          ctx.fillText(arrow, x + w / 2, y + h / 2);
        }
        ctx.restore();
      };

      if (doors.N) drawDoorBarrier(cx - dw / 2, 0, dw, wt, false, 'N');
      if (doors.S) drawDoorBarrier(cx - dw / 2, this.height - wt, dw, wt, false, 'S');
      if (doors.W) drawDoorBarrier(0, cy - dw / 2, wt, dw, true, 'W');
      if (doors.E) drawDoorBarrier(this.width - wt, cy - dw / 2, wt, dw, true, 'E');

      // Renderizar objetos interactivos propios de la sala (Cofres / Tienda)
      if (this.cachedRoomData.type === 'tesoro') {
        const isOpened = this.cachedRoomData.chestOpened;
        ctx.save();
        ctx.translate(cx, cy);

        // Sombra del cofre
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.ellipse(0, 14, 26, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = isOpened ? 6 : 18;

        // Cuerpo del cofre
        ctx.fillStyle = isOpened ? '#78350f' : '#b45309';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.fillRect(-22, -12, 44, 26);
        ctx.strokeRect(-22, -12, 44, 26);

        // Tapa
        ctx.fillStyle = isOpened ? '#d97706' : '#f59e0b';
        if (isOpened) {
          ctx.fillRect(-24, -24, 48, 12);
          ctx.strokeRect(-24, -24, 48, 12);
        } else {
          ctx.fillRect(-24, -18, 48, 14);
          ctx.strokeRect(-24, -18, 48, 14);

          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(0, -4, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('COFRE DE RELIQUIAS', 0, -28);
        }
        ctx.restore();
      } else if (this.cachedRoomData.type === 'tienda') {
        const items = this.cachedRoomData.shopItems || [
          { id: 'potion', name: 'Poción de Vida', cost: 30, icon: '💚', bought: false },
          { id: 'upgrade_1', name: 'Bendición Ofensiva', cost: 45, icon: '⚔️', bought: false },
          { id: 'upgrade_2', name: 'Reliquia Arcana', cost: 65, icon: '💎', bought: false }
        ];

        const offsets = [-130, 0, 130];
        for (let i = 0; i < 3; i++) {
          const item = items[i];
          const px = cx + offsets[i];
          const py = cy;

          ctx.save();
          ctx.translate(px, py);

          // Círculo rúnico del pedestal
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.beginPath();
          ctx.ellipse(0, 16, 24, 10, 0, 0, Math.PI * 2);
          ctx.fill();

          // Columna de piedra
          ctx.fillStyle = item.bought ? '#1e1c2e' : '#2e2a44';
          ctx.strokeStyle = item.bought ? '#475569' : '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.fillRect(-18, -6, 36, 22);
          ctx.strokeRect(-18, -6, 36, 22);

          // Ícono del objeto flotando
          const bob = item.bought ? 0 : Math.sin(performance.now() * 0.005 + i) * 4;
          ctx.font = '22px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.bought ? '✓' : item.icon, 0, -18 + bob);

          // Etiqueta de precio o estado
          ctx.font = 'bold 10px sans-serif';
          if (item.bought) {
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('COMPRADO', 0, 28);
          } else {
            ctx.fillStyle = '#fbbf24';
            ctx.fillText(`🪙 ${item.cost}`, 0, 28);
          }
          ctx.restore();
        }
      }

      // Portal de Descenso al siguiente nivel/piso (Fase 4)
      if (this.cachedRoomData.hasPortal && this.cachedRoomData.cleared) {
        ctx.save();
        ctx.translate(cx, cy);
        const pRot = performance.now() * 0.002;
        const pPulse = Math.sin(performance.now() * 0.005) * 4;

        // Sombra suave en suelo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI * 2);
        ctx.fill();

        // Anillo rúnico giratorio
        ctx.save();
        ctx.rotate(pRot);
        ctx.strokeStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 16;
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.arc(0, 0, 32 + pPulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Vórtice del abismo
        const vortexGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 28);
        vortexGrad.addColorStop(0, '#ffffff');
        vortexGrad.addColorStop(0.35, '#38bdf8');
        vortexGrad.addColorStop(0.75, '#6366f1');
        vortexGrad.addColorStop(1, '#070a1e');
        ctx.fillStyle = vortexGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.fill();

        // Rótulo de portal
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 8;
        ctx.textAlign = 'center';
        ctx.fillText('PORTAL DE DESCENSO', 0, -42);
        ctx.restore();
      }
    }

    // Detección de paso al siguiente piso por el portal
    checkPortalCrossing(player) {
      if (!this.cachedRoomData || !this.cachedRoomData.hasPortal || !this.cachedRoomData.cleared) return false;
      const cx = this.width / 2;
      const cy = this.height / 2;
      const dist = Math.hypot(player.x - cx, player.y - cy);
      return dist <= (CFG.PORTAL_INTERACT_RADIUS || 46);
    }

    // Detección de colisión y transición por puerta abierta (reach adaptado al confinamiento de pared)
    checkDoorCrossing(player, doorsLocked) {
      if (doorsLocked || !this.cachedRoomData) return null;

      const doors = this.cachedRoomData.doors;
      const cx = this.width / 2;
      const cy = this.height / 2;
      const dwHalf = (this.doorWidth / 2) + 6;
      const wt = this.wallThickness;
      const reach = player.radius + 8; // Asegura activación inmediata cuando el jugador toca el umbral

      // Puerta Norte
      if (doors.N && player.y <= wt + reach && Math.abs(player.x - cx) < dwHalf) {
        return 'N';
      }
      // Puerta Sur
      if (doors.S && player.y >= this.height - wt - reach && Math.abs(player.x - cx) < dwHalf) {
        return 'S';
      }
      // Puerta Oeste
      if (doors.W && player.x <= wt + reach && Math.abs(player.y - cy) < dwHalf) {
        return 'W';
      }
      // Puerta Este
      if (doors.E && player.x >= this.width - wt - reach && Math.abs(player.y - cy) < dwHalf) {
        return 'E';
      }

      return null;
    }

    // Detección de contacto con puerta bloqueada durante el combate (para dar feedback)
    checkLockedDoorContact(player, doorsLocked) {
      if (!doorsLocked || !this.cachedRoomData) return null;

      const doors = this.cachedRoomData.doors;
      const cx = this.width / 2;
      const cy = this.height / 2;
      const dwHalf = (this.doorWidth / 2) + 6;
      const wt = this.wallThickness;
      const reach = player.radius + 8;

      if (doors.N && player.y <= wt + reach && Math.abs(player.x - cx) < dwHalf) return 'N';
      if (doors.S && player.y >= this.height - wt - reach && Math.abs(player.x - cx) < dwHalf) return 'S';
      if (doors.W && player.x <= wt + reach && Math.abs(player.y - cy) < dwHalf) return 'W';
      if (doors.E && player.x >= this.width - wt - reach && Math.abs(player.y - cy) < dwHalf) return 'E';

      return null;
    }
  }

  // ============================================================================
  // 8. MINI-MAPA DE LA MAZMORRA (Fase 2)
  // ============================================================================
  class MiniMap {
    constructor(canvasEl) {
      this.canvas = canvasEl;
      this.ctx = canvasEl ? canvasEl.getContext('2d') : null;
    }

    render(dungeon, currentRoom, targetCanvas = null) {
      const canvas = targetCanvas || this.canvas;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx || !dungeon) return;

      const w = canvas.width;
      const h = canvas.height;
      const isExpanded = w >= 200;

      ctx.clearRect(0, 0, w, h);

      // Fondo oscuro
      ctx.fillStyle = '#0a0a10';
      ctx.fillRect(0, 0, w, h);

      const gridSize = dungeon.gridSize || 4;
      const margin = isExpanded ? 24 : 10;
      const cellSize = Math.floor((Math.min(w, h) - margin * 2) / gridSize);
      const offsetX = Math.floor((w - cellSize * gridSize) / 2);
      const offsetY = Math.floor((h - cellSize * gridSize) / 2);

      // Dibujar enlaces de puertas entre salas mapeadas
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = isExpanded ? 3 : 1.5;

      for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
          const r = dungeon.grid[x][y];
          if (!r || (!r.visited && !r.mapped)) continue;

          const rx = offsetX + x * cellSize + cellSize / 2;
          const ry = offsetY + y * cellSize + cellSize / 2;

          if (r.doors.E && x + 1 < gridSize) {
            const neighbor = dungeon.grid[x + 1][y];
            if (neighbor && (neighbor.visited || neighbor.mapped)) {
              ctx.beginPath();
              ctx.moveTo(rx, ry);
              ctx.lineTo(rx + cellSize, ry);
              ctx.stroke();
            }
          }
          if (r.doors.S && y + 1 < gridSize) {
            const neighbor = dungeon.grid[x][y + 1];
            if (neighbor && (neighbor.visited || neighbor.mapped)) {
              ctx.beginPath();
              ctx.moveTo(rx, ry);
              ctx.lineTo(rx, ry + cellSize);
              ctx.stroke();
            }
          }
        }
      }

      // Dibujar salas
      for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
          const r = dungeon.grid[x][y];
          if (!r) continue;

          const padding = isExpanded ? 4 : 2;
          const rx = offsetX + x * cellSize + padding;
          const ry = offsetY + y * cellSize + padding;
          const rSize = cellSize - padding * 2;

          const isCurrent = (r === currentRoom);

          if (r.visited) {
            // Sala visitada
            let color = '#334155';
            let strokeColor = r.cleared ? 'rgba(255, 255, 255, 0.25)' : '#e11d48';
            let icon = '';

            if (r.type === 'inicio') {
              color = '#0284c7';
              icon = '🏛️';
            } else if (r.type === 'jefe') {
              color = '#7e22ce';
              strokeColor = '#c084fc';
              icon = '👑';
            } else if (r.type === 'tesoro') {
              color = '#d97706';
              strokeColor = '#fcd34d';
              icon = '💎';
            } else if (r.type === 'tienda') {
              color = '#0891b2';
              strokeColor = '#67e8f9';
              icon = '🪙';
            } else if (r.type === 'descanso') {
              color = '#15803d';
              strokeColor = '#86efac';
              icon = '💚';
            } else if (r.type === 'elite') {
              color = '#9f1239';
              strokeColor = '#fda4af';
              icon = '💀';
            } else if (r.type === 'combate') {
              color = r.cleared ? '#1e293b' : '#be123c';
              icon = r.cleared ? '' : '⚔️';
            }

            ctx.fillStyle = color;
            ctx.fillRect(rx, ry, rSize, rSize);

            // Borde de sala
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = isExpanded ? 2 : 1;
            ctx.strokeRect(rx, ry, rSize, rSize);

            // Icono en modal expandido o si hay espacio suficiente
            if (isExpanded && icon) {
              ctx.font = `${Math.floor(rSize * 0.48)}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(icon, rx + rSize / 2, ry + rSize / 2);
            }
          } else if (r.mapped) {
            // Sala adyacente descubierta (fog of war)
            ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
            ctx.fillRect(rx, ry, rSize, rSize);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = 1;
            ctx.strokeRect(rx, ry, rSize, rSize);

            if (isExpanded) {
              ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
              ctx.font = `${Math.floor(rSize * 0.35)}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('?', rx + rSize / 2, ry + rSize / 2);
            }
          }

          // Indicador del jugador actual
          if (isCurrent) {
            // Anillo pulsante / borde
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = isExpanded ? 2.5 : 1.5;
            ctx.strokeRect(rx - 1, ry - 1, rSize + 2, rSize + 2);

            // Marcador del jugador
            const pRadius = isExpanded ? 5 : 3;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(rx + rSize / 2, ry + rSize / 2, pRadius, 0, Math.PI * 2);
            ctx.fill();

            // Glow exterior
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(rx + rSize / 2, ry + rSize / 2, pRadius + 2, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
    }
  }

  // ============================================================================
  // 9. JOYSTICK VIRTUAL FLOTANTE
  // ============================================================================
  class VirtualJoystick {
    constructor(zoneEl, baseEl, knobEl) {
      this.zoneEl = zoneEl;
      this.baseEl = baseEl;
      this.knobEl = knobEl;
      this.active = false;
      this.startX = 0;
      this.startY = 0;
      this.inputX = 0;
      this.inputY = 0;
      this.maxRadius = 45;

      this.initEvents();
    }

    initEvents() {
      if (!this.zoneEl) return;

      const onTouchStart = (e) => {
        e.preventDefault();
        const touch = e.changedTouches ? e.changedTouches[0] : e;
        const rect = this.zoneEl.getBoundingClientRect();
        this.startX = touch.clientX - rect.left;
        this.startY = touch.clientY - rect.top;
        this.active = true;

        if (this.baseEl) {
          this.baseEl.style.left = `${this.startX}px`;
          this.baseEl.style.top = `${this.startY}px`;
          this.baseEl.style.display = 'block';
        }
        if (this.knobEl) {
          this.knobEl.style.transform = `translate(-50%, -50%) translate(0px, 0px)`;
        }
      };

      const onTouchMove = (e) => {
        if (!this.active) return;
        e.preventDefault();
        const touch = e.changedTouches ? e.changedTouches[0] : e;
        const rect = this.zoneEl.getBoundingClientRect();
        const curX = touch.clientX - rect.left;
        const curY = touch.clientY - rect.top;

        const dx = curX - this.startX;
        const dy = curY - this.startY;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
          const clampedDist = Math.min(dist, this.maxRadius);
          const nx = dx / dist;
          const ny = dy / dist;
          this.inputX = nx * (clampedDist / this.maxRadius);
          this.inputY = ny * (clampedDist / this.maxRadius);

          if (this.knobEl) {
            this.knobEl.style.transform = `translate(-50%, -50%) translate(${nx * clampedDist}px, ${ny * clampedDist}px)`;
          }
        }
      };

      const onTouchEnd = (e) => {
        e.preventDefault();
        this.active = false;
        this.inputX = 0;
        this.inputY = 0;
        if (this.baseEl) this.baseEl.style.display = 'none';
      };

      this.zoneEl.addEventListener('touchstart', onTouchStart, { passive: false });
      this.zoneEl.addEventListener('touchmove', onTouchMove, { passive: false });
      this.zoneEl.addEventListener('touchend', onTouchEnd, { passive: false });
      this.zoneEl.addEventListener('touchcancel', onTouchEnd, { passive: false });

      this.zoneEl.addEventListener('mousedown', onTouchStart);
      window.addEventListener('mousemove', onTouchMove);
      window.addEventListener('mouseup', onTouchEnd);
    }
  }

  // ============================================================================
  // 9.5 SISTEMA DE AUDIO ARCANO Y MÚSICA AMBIENTAL (FASE 5)
  // ============================================================================
  class AbismoAudioHelper {
    constructor(soundEngine) {
      this.soundEngine = soundEngine;
      this.ambientOsc1 = null;
      this.ambientOsc2 = null;
      this.ambientGain = null;
      this.isAmbientPlaying = false;
    }

    startAmbientMusic() {
      if (this.isAmbientPlaying || !this.soundEngine) return;
      if (this.soundEngine.isMuted) return;
      if (this.soundEngine.initCtx) this.soundEngine.initCtx();
      const ctx = this.soundEngine.ctx;
      if (!ctx) return;

      try {
        const now = ctx.currentTime;
        this.ambientGain = ctx.createGain();
        this.ambientGain.gain.setValueAtTime(0.001, now);
        this.ambientGain.gain.linearRampToValueAtTime(0.02, now + 2.0);
        this.ambientGain.connect(ctx.destination);

        // Drone grave atmosférico
        this.ambientOsc1 = ctx.createOscillator();
        this.ambientOsc1.type = 'triangle';
        this.ambientOsc1.frequency.setValueAtTime(55.0, now); // A1

        // Armónico místico
        this.ambientOsc2 = ctx.createOscillator();
        this.ambientOsc2.type = 'sine';
        this.ambientOsc2.frequency.setValueAtTime(110.0, now); // A2

        this.ambientOsc1.connect(this.ambientGain);
        this.ambientOsc2.connect(this.ambientGain);

        this.ambientOsc1.start(now);
        this.ambientOsc2.start(now);
        this.isAmbientPlaying = true;
      } catch (e) {}
    }

    stopAmbientMusic() {
      if (!this.isAmbientPlaying) return;
      try {
        if (this.ambientOsc1) { this.ambientOsc1.stop(); this.ambientOsc1.disconnect(); }
        if (this.ambientOsc2) { this.ambientOsc2.stop(); this.ambientOsc2.disconnect(); }
        if (this.ambientGain) { this.ambientGain.disconnect(); }
      } catch (e) {}
      this.ambientOsc1 = null;
      this.ambientOsc2 = null;
      this.ambientGain = null;
      this.isAmbientPlaying = false;
    }

    playChestChime() {
      if (!this.soundEngine || this.soundEngine.isMuted) return;
      if (this.soundEngine.initCtx) this.soundEngine.initCtx();
      const ctx = this.soundEngine.ctx;
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        [587.33, 739.99, 880.0, 1174.66].forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + idx * 0.05);
          gain.gain.setValueAtTime(0.09, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.16);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.16);
        });
      } catch (e) {}
    }

    playBossRoar() {
      if (!this.soundEngine || this.soundEngine.isMuted) return;
      if (this.soundEngine.initCtx) this.soundEngine.initCtx();
      const ctx = this.soundEngine.ctx;
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.45);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      } catch (e) {}
    }
  }

  // ============================================================================
  // 10. CLASE PRINCIPAL: ABISMO GAME ENGINE (FASE 5)
  // ============================================================================
  class AbismoGame {

    constructor() {
      this.canvas = document.getElementById('game-canvas');
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      this.container = document.getElementById('board-wrapper');

      // Audio sintetizado (singleton de /shared/audio.js y helper de Abismo)
      this.audio = (typeof window !== 'undefined' && window.ArcadeAudio)
        ? window.ArcadeAudio
        : (typeof ArcadeAudio !== 'undefined' ? (typeof ArcadeAudio === 'function' ? new ArcadeAudio() : ArcadeAudio) : null);
      this.audioHelper = new AbismoAudioHelper(this.audio);

      // Meta-progresión, estadísticas permanentes y guardado (Fase 5)
      this.metaState = AbismoStorage ? AbismoStorage.loadMeta() : getDefaultMetaState();
      this.bossesKilled = 0;
      this.fps = 60;
      this.fpsFrames = 0;
      this.fpsTimer = 0;

      // Elementos de la interfaz (HUD)
      this.hpFillEl = document.getElementById('hud-hp-fill');
      this.hpTextEl = document.getElementById('hud-hp-text');
      this.killsValEl = document.getElementById('hud-kills-val');
      this.enemiesValEl = document.getElementById('hud-enemies-val');
      this.specialCooldownEl = document.getElementById('special-cooldown-overlay');
      this.specialCooldownTextEl = document.getElementById('special-cooldown-text');
      this.specialBtn = document.getElementById('btn-action-special');
      this.roomBadgeNameEl = document.getElementById('hud-room-name');
      this.roomBadgeIconEl = document.getElementById('hud-room-icon');
      this.waveBannerEl = document.getElementById('wave-banner');
      this.waveBannerTextEl = document.getElementById('wave-banner-text');
      this.waveBannerIconEl = document.getElementById('wave-banner-icon');

      // Elementos de HUD de Experiencia y Oro (Fase 3)
      this.xpFillEl = document.getElementById('hud-xp-fill');
      this.xpTextEl = document.getElementById('hud-xp-text');
      this.levelBadgeEl = document.getElementById('hud-level-badge');
      this.goldValEl = document.getElementById('hud-gold-val');
      this.pendingLevelUps = 0;
      this._shopWarningTimer = 0;

      // Elementos de HUD de Piso y Jefes (Fase 4)
      this.floorValEl = document.getElementById('hud-floor-val');
      this.bossHudContainer = document.getElementById('boss-hud-container');
      this.bossNameEl = document.getElementById('boss-name');
      this.bossIconEl = document.getElementById('boss-icon');
      this.bossHpFillEl = document.getElementById('boss-hp-fill');
      this.bossHpPctEl = document.getElementById('boss-hp-pct');

      this.floor = 1;
      this.selectedCharacter = 'peregrino';
      this.activeBoss = null;

      // Modales y Vistas (Fase 5)
      this.startModal = document.getElementById('start-modal');
      this.pauseModal = document.getElementById('pause-modal');
      this.gameOverModal = document.getElementById('gameover-modal');
      this.levelUpModal = document.getElementById('levelup-modal');
      this.levelUpTitle = document.getElementById('levelup-title');
      this.levelUpSubtitle = document.getElementById('levelup-subtitle');
      this.upgradeCardsGrid = document.getElementById('upgrade-cards-grid');

      this.metaModal = document.getElementById('meta-modal');
      this.metaUpgradesGrid = document.getElementById('meta-upgrades-grid');
      this.metaEssenceValEl = document.getElementById('meta-essence-val');
      this.startEssenceValEl = document.getElementById('start-essence-val');
      this.achievementsModal = document.getElementById('achievements-modal');
      this.achievementsListGrid = document.getElementById('achievements-list-grid');
      this.btnContinueRun = document.getElementById('btn-continue-run');
      this.continueRunInfo = document.getElementById('continue-run-info');
      this.debugPanel = document.getElementById('debug-panel');

      // Mini-mapa y Modal de Mapa Expandido (Móvil y Escritorio)
      this.minimapContainer = document.getElementById('minimap-container');
      const minimapCanvas = document.getElementById('minimap-canvas');
      this.minimap = new MiniMap(minimapCanvas);

      this.mapModal = document.getElementById('map-modal');
      this.mapModalCanvas = document.getElementById('map-modal-canvas');
      this.mapModalFloorText = document.getElementById('map-modal-floor-text');
      this.btnCloseMap = document.getElementById('btn-close-map');
      this.btnMapResume = document.getElementById('btn-map-resume');

      // Estado del bucle y tiempo fijo
      this.state = 'READY'; // READY, PLAYING, PAUSED, GAMEOVER, LEVELUP, MAP_VIEW
      this.lastTimestamp = 0;
      this.accumulator = 0;
      this.hitStopTimer = 0;
      this.gameTime = 0;
      this.killCount = 0;
      this.score = 0;

      // Pantalla y Cámara
      this.camera = {
        x: (CFG.ROOM_WIDTH || 960) / 2,
        y: (CFG.ROOM_HEIGHT || 640) / 2,
        zoom: CFG.CAMERA_BASE_ZOOM || 1.0,
        viewportW: 960,
        viewportH: 640
      };
      this.shakeIntensity = 0;
      this.shakeDuration = 0;

      // Generación Procedural de Mazmorra (Fase 2 y 4)
      this.dungeon = null;
      this.currentRoom = null;
      this.doorsLocked = false;
      this.currentWaveIndex = 0;
      this.transitionCooldown = 0;
      this.lockedDoorTimer = 0;

      // Entidades y Pools
      this.room = new Room();
      this.spatialHash = new SpatialHashClass(CFG.SPATIAL_CELL_SIZE || 75);
      this.projectiles = new ProjectilePool(CFG.MAX_PROJECTILES_CAP || 350);
      this.enemyProjectiles = new EnemyProjectilePool(150);
      this.enemies = new EnemyPool(CFG.MAX_ENEMIES_CAP || 200);
      this.particles = new ParticlePool(CFG.MAX_PARTICLES_CAP || 400);
      this.floatingTexts = new FloatingTextPool(CFG.MAX_TEXTS_CAP || 100);
      this.loot = new LootPool(CFG.LOOT_POOL_CAP || 250);

      this.player = new Player(this.room.width / 2, this.room.height / 2);

      // Controles
      this.keys = {};
      const joyZone = document.getElementById('joystick-zone');
      const joyBase = document.getElementById('joystick-base');
      const joyKnob = document.getElementById('joystick-knob');
      this.joystick = new VirtualJoystick(joyZone, joyBase, joyKnob);

      this.initEvents();
      this.initDungeon();
      this.updateCharacterSelectorUI();
      this.checkActiveRun();
      this.initDebugPanel();
      this.updateEssenceDisplay();
      this.resizeCanvas();
      this.requestFrame();
    }


    initDungeon() {
      if (DungeonGenerator) {
        this.dungeon = DungeonGenerator.generate(
          CFG.DUNGEON_GRID_SIZE || 5,
          CFG.DUNGEON_ROOMS_COUNT || 10,
          this.floor
        );
        this.enterRoom(this.dungeon.startRoom, true);
      } else {
        // Fallback si no está el generador cargado
        this.room.buildOffscreen(null);
      }
    }

    enterRoom(roomData, isInitial = false) {
      this.currentRoom = roomData;
      this.currentRoom.visited = true;

      // Marcar adyacentes como mapeadas en el mini-mapa
      const dirs = [
        { d: 'N', dx: 0, dy: -1 },
        { d: 'S', dx: 0, dy: 1 },
        { d: 'E', dx: 1, dy: 0 },
        { d: 'W', dx: -1, dy: 0 }
      ];
      for (const dir of dirs) {
        if (roomData.doors[dir.d] && this.dungeon) {
          const adj = this.dungeon.grid[roomData.gx + dir.dx]?.[roomData.gy + dir.dy];
          if (adj) adj.mapped = true;
        }
      }

      // Reconstruir canvas estático con bioma actual y aberturas de puertas
      const currentBiome = this.dungeon ? this.dungeon.currentBiome : null;
      this.room.buildOffscreen(roomData, currentBiome);

      // Control del HUD de Jefes
      if (roomData.type === 'jefe') {
        if (this.bossHudContainer) this.bossHudContainer.classList.remove('hidden');
        if (this.bossNameEl) this.bossNameEl.textContent = this.floor % 10 === 0 ? 'GÓLEM DEL NÚCLEO' : 'SEÑOR DEL ABISMO';
        if (this.bossIconEl) this.bossIconEl.textContent = this.floor % 10 === 0 ? '🌋' : '👑';
      } else if (this.bossHudContainer && !this.activeBoss) {
        this.bossHudContainer.classList.add('hidden');
      }

      // Limpiar proyectiles y botín huérfano al cambiar de sala
      for (let i = 0; i < this.projectiles.pool.length; i++) this.projectiles.pool[i].active = false;
      for (let i = 0; i < this.enemyProjectiles.pool.length; i++) this.enemyProjectiles.pool[i].active = false;
      if (this.loot) {
        for (let i = 0; i < this.loot.pool.length; i++) this.loot.pool[i].active = false;
      }

      // Actualizar badge de sala en HUD
      if (this.roomBadgeNameEl && roomData.typeData) {
        this.roomBadgeNameEl.textContent = roomData.typeData.name;
      }
      if (this.roomBadgeIconEl && roomData.typeData) {
        this.roomBadgeIconEl.textContent = roomData.typeData.icon || '⚔️';
      }

      // Si la sala no está despejada y tiene oleadas, bloquear puertas y empezar oleada 1
      if (!roomData.cleared && roomData.waves && roomData.waves.length > 0) {
        this.doorsLocked = true;
        this.currentWaveIndex = 0;
        if (this.state === 'PLAYING') {
          this.spawnWave(this.currentWaveIndex);
          this.showWaveBanner(`¡OLEADA 1/${roomData.waves.length}!`, '⚔️', false);
        }
      } else {
        this.doorsLocked = false;
        if (roomData.type === 'tesoro') {
          this.showWaveBanner('BÓVEDA DE RELIQUIAS', '💎', true);
        } else if (roomData.type === 'tienda') {
          this.showWaveBanner('MERCADER UMBRÍO', '🪙', true);
          if (!roomData.shopItems) {
            roomData.shopItems = [
              { id: 'potion', name: 'Poción de Vida', cost: CFG.SHOP_POTION_COST || 30, icon: '💚', bought: false },
              { id: 'upgrade_1', name: 'Bendición Ofensiva', cost: CFG.SHOP_UPGRADE_COST || 45, icon: '⚔️', bought: false },
              { id: 'upgrade_2', name: 'Reliquia Arcana', cost: CFG.SHOP_ELITE_UPGRADE_COST || 65, icon: '💎', bought: false }
            ];
          }
        } else if (roomData.type === 'descanso') {
          this.showWaveBanner('SANTUARIO DE ALMAS', '💚', true);
          // Curar al jugador un 40% si no ha usado el santuario
          if (!roomData.shrineUsed) {
            roomData.shrineUsed = true;
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + Math.round(this.player.maxHp * 0.4));
            this.floatingTexts.spawn(this.player.x, this.player.y - 20, '+40% VIDA', '#4ade80', true);
          }
        }
      }

      this.minimap.render(this.dungeon, this.currentRoom);
      if (this.state === 'MAP_VIEW' && this.mapModalCanvas) {
        this.minimap.render(this.dungeon, this.currentRoom, this.mapModalCanvas);
      }
    }

    spawnWave(waveIndex) {
      if (!this.currentRoom.waves || waveIndex >= this.currentRoom.waves.length) return;
      const wave = this.currentRoom.waves[waveIndex];
      const enemiesToSpawn = wave.enemies || ['perseguidor', 'perseguidor', 'corredor', 'tirador'];

      for (let i = 0; i < enemiesToSpawn.length; i++) {
        const typeKey = enemiesToSpawn[i];
        const typeData = ENEMIGOS_DATA[typeKey] || ENEMIGOS_DATA.perseguidor;

        // Calcular posición aleatoria en bordes evitando el centro
        const wt = this.room.wallThickness + 40;
        let sx, sy;
        const corner = i % 4;
        if (corner === 0) { sx = wt + Math.random() * 80; sy = wt + Math.random() * 80; }
        else if (corner === 1) { sx = this.room.width - wt - Math.random() * 80; sy = wt + Math.random() * 80; }
        else if (corner === 2) { sx = wt + Math.random() * 80; sy = this.room.height - wt - Math.random() * 80; }
        else { sx = this.room.width - wt - Math.random() * 80; sy = this.room.height - wt - Math.random() * 80; }

        const isElite = (wave.hasElite && i === 0);
        this.enemies.spawn(sx, sy, typeData, isElite, this.floor);
      }
    }

    showWaveBanner(text, icon = '⚔️', isClear = false) {
      if (!this.waveBannerEl) return;
      if (this.waveBannerTextEl) this.waveBannerTextEl.textContent = text;
      if (this.waveBannerIconEl) this.waveBannerIconEl.textContent = icon;

      this.waveBannerEl.className = isClear ? 'wave-banner clear-banner' : 'wave-banner';
      this.waveBannerEl.classList.remove('hidden');

      clearTimeout(this._bannerTimeout);
      this._bannerTimeout = setTimeout(() => {
        if (this.waveBannerEl) this.waveBannerEl.classList.add('hidden');
      }, 2200);
    }

    initEvents() {
      window.addEventListener('resize', () => this.resizeCanvas());
      window.addEventListener('keydown', (e) => this.handleKeyDown(e));
      window.addEventListener('keyup', (e) => this.handleKeyUp(e));

      const btnStart = document.getElementById('btn-start-game');
      if (btnStart) {
        btnStart.addEventListener('click', (e) => {
          e.preventDefault();
          this.startGame();
        });
        btnStart.addEventListener('touchend', (e) => {
          e.preventDefault();
          this.startGame();
        });
      }

      // Botón Continuar Partida (Fase 5)
      if (this.btnContinueRun) {
        this.btnContinueRun.addEventListener('click', (e) => {
          e.preventDefault();
          this.continueActiveRun();
        });
        this.btnContinueRun.addEventListener('touchend', (e) => {
          e.preventDefault();
          this.continueActiveRun();
        });
      }

      // Botones Altar del Abismo y Logros (Fase 5)
      const btnOpenMeta = document.getElementById('btn-open-meta');
      if (btnOpenMeta) btnOpenMeta.addEventListener('click', () => this.openMetaModal());

      const btnCloseMeta = document.getElementById('btn-close-meta');
      if (btnCloseMeta) btnCloseMeta.addEventListener('click', () => this.closeMetaModal());

      const btnResetMeta = document.getElementById('btn-reset-meta');
      if (btnResetMeta) btnResetMeta.addEventListener('click', () => this.resetMetaProgress());

      const btnOpenAch = document.getElementById('btn-open-achievements');
      if (btnOpenAch) btnOpenAch.addEventListener('click', () => this.openAchievementsModal());

      const btnCloseAch = document.getElementById('btn-close-achievements');
      if (btnCloseAch) btnCloseAch.addEventListener('click', () => this.closeAchievementsModal());

      const btnGameOverAltar = document.getElementById('btn-gameover-altar');
      if (btnGameOverAltar) {
        btnGameOverAltar.addEventListener('click', () => {
          if (this.gameOverModal) this.gameOverModal.classList.add('hidden');
          this.openMetaModal();
        });
      }

      // Guardado automático en segundo plano ante cambio de pestaña o cierre (Fase 5)
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          if (document.hidden && this.state === 'PLAYING') {
            if (AbismoStorage) AbismoStorage.saveActiveRun(this);
          }
        });
      }
      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', () => {
          if (this.state === 'PLAYING') {
            if (AbismoStorage) AbismoStorage.saveActiveRun(this);
          }
        });
      }

      const btnPause = document.getElementById('btn-pause');
      if (btnPause) btnPause.addEventListener('click', () => this.togglePause());

      const btnResume = document.getElementById('btn-resume');
      if (btnResume) btnResume.addEventListener('click', () => this.togglePause());

      const btnRestart = document.getElementById('btn-restart');
      if (btnRestart) btnRestart.addEventListener('click', () => this.restartGame());

      const btnGameOverRestart = document.getElementById('btn-gameover-restart');
      if (btnGameOverRestart) btnGameOverRestart.addEventListener('click', () => this.restartGame());

      if (this.specialBtn) {
        const triggerSpecial = (e) => {
          e.preventDefault();
          this.activateSpecialAbility();
        };
        this.specialBtn.addEventListener('touchstart', triggerSpecial, { passive: false });
        this.specialBtn.addEventListener('mousedown', triggerSpecial);
      }

      const btnSound = document.getElementById('btn-sound');
      if (btnSound) {
        btnSound.addEventListener('click', () => {
          if (this.audio && this.audio.toggleMute) {
            const isMuted = this.audio.toggleMute();
            btnSound.querySelector('.icon').textContent = isMuted ? '🔇' : '🔊';
            if (isMuted) {
              if (this.audioHelper) this.audioHelper.stopAmbientMusic();
            } else if (this.state === 'PLAYING') {
              if (this.audioHelper) this.audioHelper.startAmbientMusic();
            }
          }
        });
      }

      // Selector de Personajes con bloqueo (Fase 4 y 5)
      const charCards = document.querySelectorAll('#character-selector-grid .char-card');
      const previewDesc = document.getElementById('character-preview-desc');
      charCards.forEach((card) => {
        const onSelectCard = (e) => {
          e.preventDefault();
          const charId = card.dataset.char;
          const char = Array.isArray(PERSONAJES) ? PERSONAJES.find((c) => c.id === charId) : null;
          const isUnlocked = !char || char.unlockedByDefault || (this.metaState && this.metaState.unlockedCharacters && this.metaState.unlockedCharacters.includes(charId));

          if (!isUnlocked) {
            if (previewDesc && char) {
              previewDesc.innerHTML = `<span style="color:#f43f5e">🔒 <strong>${char.name} (BLOQUEADO):</strong> Desbloquéalo en el Altar del Abismo con ${char.costEssence || 100} ✨ de esencia.</span>`;
            }
            if (this.audio && this.audio.playTone) this.audio.playTone(130, 'sawtooth', 0.1, 0.08);
            return;
          }

          charCards.forEach((c) => c.classList.remove('active'));
          card.classList.add('active');
          this.selectedCharacter = charId;
          if (previewDesc && char) {
            previewDesc.innerHTML = `<strong>${char.name}:</strong> ${char.description} (${char.hp} HP, ${char.initialWeaponName}).`;
          }
        };
        card.addEventListener('click', onSelectCard);
        card.addEventListener('touchend', onSelectCard);
      });

      // Abrir / Cerrar modal de mapa expandido (Móvil y Escritorio)
      if (this.minimapContainer) {
        const handleOpenMap = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.openMapModal();
        };
        this.minimapContainer.addEventListener('click', handleOpenMap);
        this.minimapContainer.addEventListener('touchend', handleOpenMap);
      }

      if (this.btnCloseMap) {
        const handleCloseMap = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.closeMapModal();
        };
        this.btnCloseMap.addEventListener('click', handleCloseMap);
        this.btnCloseMap.addEventListener('touchend', handleCloseMap);
      }

      if (this.btnMapResume) {
        const handleCloseMap = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.closeMapModal();
        };
        this.btnMapResume.addEventListener('click', handleCloseMap);
        this.btnMapResume.addEventListener('touchend', handleCloseMap);
      }
    }

    resizeCanvas() {
      if (!this.canvas || !this.container) return;
      const rect = this.container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      this.canvas.width = Math.round(rect.width * dpr);
      this.canvas.height = Math.round(rect.height * dpr);
      this.canvas.style.width = `${rect.width}px`;
      this.canvas.style.height = `${rect.height}px`;

      this.camera.viewportW = rect.width;
      this.camera.viewportH = rect.height;
    }

    startGame() {
      if (this.audio && this.audio.initCtx) this.audio.initCtx();
      if (this.audioHelper) this.audioHelper.startAmbientMusic();

      if (this.startModal) {
        this.startModal.classList.add('hidden');
        this.startModal.style.display = 'none';
      }
      if (this.pauseModal) this.pauseModal.classList.add('hidden');
      if (this.gameOverModal) this.gameOverModal.classList.add('hidden');
      if (this.levelUpModal) this.levelUpModal.classList.add('hidden');
      if (this.metaModal) this.metaModal.classList.add('hidden');
      if (this.achievementsModal) this.achievementsModal.classList.add('hidden');
      if (this.mapModal) this.mapModal.classList.add('hidden');

      this.floor = 1;
      this.bossesKilled = 0;
      const charData = Array.isArray(PERSONAJES)
        ? (PERSONAJES.find((c) => c.id === this.selectedCharacter) || PERSONAJES[0])
        : null;
      if (charData) {
        this.player.applyCharacter(charData);
      }

      // Aplicar bonificaciones de meta-progresión permanente (Fase 5)
      if (AbismoStorage) {
        AbismoStorage.applyMetaBonusesToPlayer(this.player, this.metaState);
      }

      if (this.floorValEl) this.floorValEl.textContent = `PISO ${this.floor}`;

      this.state = 'PLAYING';
      this.lastTimestamp = performance.now();

      if (this.btnContinueRun) this.btnContinueRun.classList.add('hidden');
      if (AbismoStorage) AbismoStorage.saveActiveRun(this);

      // Iniciar oleada de enemigos de inmediato en la primera sala
      if (this.currentRoom && !this.currentRoom.cleared && this.currentRoom.waves && this.currentRoom.waves.length > 0) {
        this.doorsLocked = true;
        this.currentWaveIndex = 0;
        this.spawnWave(0);
        this.showWaveBanner(`¡OLEADA 1/${this.currentRoom.waves.length}!`, '⚔️', false);
      } else if (this.currentRoom) {
        this.currentRoom.cleared = false;
        this.currentRoom.waves = [
          { count: 4, enemies: ['perseguidor', 'perseguidor', 'corredor', 'tirador'] },
          { count: 5, enemies: ['perseguidor', 'tirador', 'explosivo', 'escudado'] }
        ];
        this.doorsLocked = true;
        this.currentWaveIndex = 0;
        this.spawnWave(0);
        this.showWaveBanner('¡OLEADA 1/2: PURGA LA CRIPTA!', '⚔️', false);
      }
    }

    restartGame() {
      this.state = 'PLAYING';
      this.gameTime = 0;
      this.killCount = 0;
      this.score = 0;
      this.floor = 1;
      this.bossesKilled = 0;

      this.projectiles = new ProjectilePool(CFG.MAX_PROJECTILES_CAP || 350);
      this.enemyProjectiles = new EnemyProjectilePool(150);
      this.enemies = new EnemyPool(CFG.MAX_ENEMIES_CAP || 200);
      this.particles = new ParticlePool(CFG.MAX_PARTICLES_CAP || 400);
      this.floatingTexts = new FloatingTextPool(CFG.MAX_TEXTS_CAP || 100);
      this.loot = new LootPool(CFG.LOOT_POOL_CAP || 250);
      this.pendingLevelUps = 0;

      this.player = new Player(this.room.width / 2, this.room.height / 2);
      const charData = Array.isArray(PERSONAJES)
        ? (PERSONAJES.find((c) => c.id === this.selectedCharacter) || PERSONAJES[0])
        : null;
      if (charData) {
        this.player.applyCharacter(charData);
      }

      // Aplicar bonificaciones de meta-progresión permanente (Fase 5)
      if (AbismoStorage) {
        AbismoStorage.applyMetaBonusesToPlayer(this.player, this.metaState);
      }

      if (this.floorValEl) this.floorValEl.textContent = `PISO ${this.floor}`;

      this.camera.x = this.player.x;
      this.camera.y = this.player.y;

      if (this.startModal) {
        this.startModal.classList.add('hidden');
        this.startModal.style.display = 'none';
      }
      if (this.pauseModal) this.pauseModal.classList.add('hidden');
      if (this.gameOverModal) this.gameOverModal.classList.add('hidden');
      if (this.levelUpModal) this.levelUpModal.classList.add('hidden');
      if (this.metaModal) this.metaModal.classList.add('hidden');
      if (this.achievementsModal) this.achievementsModal.classList.add('hidden');
      if (this.mapModal) this.mapModal.classList.add('hidden');

      this.initDungeon();
      this.lastTimestamp = performance.now();
      this.updateHUD();

      if (this.audioHelper) this.audioHelper.startAmbientMusic();
      if (this.btnContinueRun) this.btnContinueRun.classList.add('hidden');
      if (AbismoStorage) AbismoStorage.saveActiveRun(this);

      // Iniciar oleada de inmediato tras reiniciar
      if (this.currentRoom && !this.currentRoom.cleared && this.currentRoom.waves && this.currentRoom.waves.length > 0) {
        this.doorsLocked = true;
        this.currentWaveIndex = 0;
        this.spawnWave(0);
        this.showWaveBanner(`¡OLEADA 1/${this.currentRoom.waves.length}!`, '⚔️', false);
      }
    }

    openMapModal() {
      if (this.state !== 'PLAYING') return;
      this.state = 'MAP_VIEW';
      if (this.audioHelper) this.audioHelper.stopAmbientMusic();
      if (this.mapModalFloorText) {
        const biomeName = this.dungeon && this.dungeon.currentBiome ? this.dungeon.currentBiome.name : 'Cripta';
        this.mapModalFloorText.textContent = `Piso ${this.floor || 1} — ${biomeName}`;
      }
      if (this.mapModal) {
        this.mapModal.classList.remove('hidden');
      }
      if (this.mapModalCanvas && this.minimap) {
        this.minimap.render(this.dungeon, this.currentRoom, this.mapModalCanvas);
      }
      if (this.audio && this.audio.playTone) this.audio.playTone(320, 'sine', 0.08, 0.06);
    }

    closeMapModal() {
      if (this.state !== 'MAP_VIEW') return;
      if (this.mapModal) {
        this.mapModal.classList.add('hidden');
      }
      this.state = 'PLAYING';
      this.lastTimestamp = performance.now();
      if (CFG.AMBIENT_MUSIC_ENABLED && this.audioHelper) {
        this.audioHelper.startAmbientMusic();
      }
    }

    togglePause() {
      if (this.state === 'READY' || this.state === 'GAMEOVER' || this.state === 'LEVELUP') return;
      if (this.state === 'MAP_VIEW') {
        this.closeMapModal();
        return;
      }
      if (this.state === 'PLAYING') {
        this.state = 'PAUSED';
        if (this.audioHelper) this.audioHelper.stopAmbientMusic();
        if (AbismoStorage) AbismoStorage.saveActiveRun(this);
        if (this.pauseModal) this.pauseModal.classList.remove('hidden');
      } else if (this.state === 'PAUSED') {
        this.state = 'PLAYING';
        if (this.pauseModal) this.pauseModal.classList.add('hidden');
        if (CFG.AMBIENT_MUSIC_ENABLED && this.audioHelper) this.audioHelper.startAmbientMusic();
        this.lastTimestamp = performance.now();
      }
    }


    handleKeyDown(e) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      this.keys[e.code] = true;

      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (this.state === 'MAP_VIEW') {
          this.closeMapModal();
          return;
        }
        this.togglePause();
      } else if (e.code === 'KeyM') {
        if (this.state === 'MAP_VIEW') {
          this.closeMapModal();
        } else if (this.state === 'PLAYING') {
          this.openMapModal();
        }
      } else if (e.code === 'Space') {
        this.activateSpecialAbility();
      }
    }

    handleKeyUp(e) {
      this.keys[e.code] = false;
    }

    activateSpecialAbility() {
      if (this.state !== 'PLAYING') return;
      const success = this.player.useSpecialAbility(
        this.spatialHash,
        this.enemies,
        this.particles,
        this.floatingTexts,
        this.audio,
        (intensity, dur) => this.triggerScreenShake(intensity, dur),
        (deadEnemy) => this.handleEnemyKilled(deadEnemy)
      );

      if (success) {

        this.hitStopTimer = CFG.HIT_STOP_DURATION || 0.05;
        if (typeof ArcadeCanvas !== 'undefined') {
          ArcadeCanvas.haptic(45);
        }
      }
    }


    triggerScreenShake(intensity = 6, duration = 0.25) {
      this.shakeIntensity = intensity;
      this.shakeDuration = duration;
    }

    requestFrame() {
      requestAnimationFrame((t) => this.loop(t));
    }

    loop(timestamp) {
      if (!this.lastTimestamp) this.lastTimestamp = timestamp;
      let frameTime = (timestamp - this.lastTimestamp) / 1000;
      this.lastTimestamp = timestamp;

      if (frameTime > (CFG.MAX_DELTA || 0.1)) frameTime = CFG.MAX_DELTA || 0.1;

      // Medir FPS para el panel de depuración (Fase 5)
      this.fpsFrames++;
      this.fpsTimer += frameTime;
      if (this.fpsTimer >= 0.4) {
        this.fps = Math.round(this.fpsFrames / this.fpsTimer);
        this.fpsFrames = 0;
        this.fpsTimer = 0;
        this.updateDebugOverlay();
      }

      if (this.state === 'PLAYING') {
        if (this.hitStopTimer > 0) {
          this.hitStopTimer -= frameTime;
        } else {
          this.accumulator += frameTime;
          const fixedDt = CFG.FIXED_DELTA || 1 / 60;
          while (this.accumulator >= fixedDt) {
            this.update(fixedDt);
            this.accumulator -= fixedDt;
          }
        }
      }

      this.render();
      this.requestFrame();
    }


    update(dt) {
      this.gameTime += dt;

      // 1. Entradas
      let inputX = 0;
      let inputY = 0;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputX -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) inputX += 1;
      if (this.keys['KeyW'] || this.keys['ArrowUp']) inputY -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) inputY += 1;

      if (this.joystick.active) {
        inputX = this.joystick.inputX;
        inputY = this.joystick.inputY;
      }

      // 2. Spatial Hash
      this.spatialHash.clear();
      for (let i = 0; i < this.enemies.pool.length; i++) {
        const e = this.enemies.pool[i];
        if (e.active && e.hp > 0) {
          this.spatialHash.insert(e);
        }
      }

      // 3. Jugador
      this.player.update(
        dt,
        inputX,
        inputY,
        this.room,
        this.spatialHash,
        this.projectiles,
        this.particles,
        this.audio,
        this.enemyProjectiles,
        (dead) => this.handleEnemyKilled(dead),
        this.floatingTexts
      );

      // 3.5 Comprobar descenso al siguiente nivel/piso por el portal
      if (this.currentRoom && this.currentRoom.hasPortal && this.currentRoom.cleared && this.room.checkPortalCrossing(this.player)) {
        this.descendToNextFloor();
        return;
      }

      // 4. Comprobar paso por puertas (Transición de sala o aviso de bloqueo)
      if (this.transitionCooldown > 0) {
        this.transitionCooldown -= dt;
      } else {
        const crossedDoorDir = this.room.checkDoorCrossing(this.player, this.doorsLocked);
        if (crossedDoorDir) {
          this.handleRoomTransition(crossedDoorDir);
          return;
        } else {
          // Si el jugador intenta entrar en una puerta bloqueada por combate
          const lockedContact = this.room.checkLockedDoorContact(this.player, this.doorsLocked);
          if (lockedContact) {
            this.handleLockedDoorBump();
          }
        }
      }

      if (this.lockedDoorTimer > 0) {
        this.lockedDoorTimer -= dt;
      }

      // 5. Proyectiles del Jugador
      this.projectiles.update(dt, this.room);
      this.resolveProjectileCollisions();

      // 6. Proyectiles Enemigos
      this.enemyProjectiles.update(dt, this.room);
      this.resolveEnemyProjectileCollisions();

      // 7. Actualización de Enemigos e IA
      this.enemies.update(
        dt,
        this.player,
        this.spatialHash,
        this.room,
        (touchingEnemy) => this.handleEnemyTouch(touchingEnemy),
        this.enemyProjectiles,
        (explosiveEnemy) => this.handleEnemyExplosion(explosiveEnemy),
        (mx, my) => this.handleSpawnMinion(mx, my)
      );

      // 7.5 Botín (Orbes de experiencia y Monedas de oro con atracción magnética)
      if (this.loot) {
        this.loot.update(dt, this.player, (item) => this.handleCollectLoot(item), this.room);
      }

      // 7.6 Objetos interactivos de sala (Cofres en Tesoro y Pedestales en Tienda)
      this.checkRoomInteractables(dt);

      // 8. Control de oleadas de la sala
      this.checkRoomWaveProgress();

      // 9. Partículas y Textos
      this.particles.update(dt);
      this.floatingTexts.update(dt);

      // 10. Cámara y HUD
      this.updateCamera(dt);
      this.updateHUD();
    }

    handleLockedDoorBump() {
      if (this.lockedDoorTimer > 0) return;
      this.lockedDoorTimer = 1.3;

      const remaining = this.enemies.activeCount;
      const msg = remaining > 0
        ? `¡PUERTA SELLADA! Elimina a los enemigos (${remaining})`
        : '¡PUERTA SELLADA! Supera la oleada';

      this.floatingTexts.spawn(this.player.x, this.player.y - 25, msg, '#f43f5e', true);

      // Chispas carmesí de rechazo en la barrera
      for (let k = 0; k < 6; k++) {
        this.particles.spawn(
          this.player.x + (Math.random() - 0.5) * 16,
          this.player.y + (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 70,
          (Math.random() - 0.5) * 70,
          0.25,
          2.5,
          '#f43f5e'
        );
      }

      if (this.audio && this.audio.playTone) {
        this.audio.playTone(130, 'sawtooth', 0.1, 0.08);
      }
      if (typeof ArcadeCanvas !== 'undefined') {
        ArcadeCanvas.haptic(25);
      }
    }

    handleRoomTransition(doorDir) {
      if (!this.dungeon || !this.currentRoom) return;

      const deltaMap = {
        N: { dx: 0, dy: -1, opp: 'S' },
        S: { dx: 0, dy: 1, opp: 'N' },
        E: { dx: 1, dy: 0, opp: 'W' },
        W: { dx: -1, dy: 0, opp: 'E' }
      };

      const d = deltaMap[doorDir];
      const targetGX = this.currentRoom.gx + d.dx;
      const targetGY = this.currentRoom.gy + d.dy;

      const targetRoom = this.dungeon.grid[targetGX]?.[targetGY];
      if (!targetRoom) return;

      // Tiempo de enfriamiento para evitar transiciones accidentales continuas
      this.transitionCooldown = 0.45;

      // Reposicionar al explorador a una distancia segura dentro de la nueva sala
      const wt = this.room.wallThickness;
      const safeDist = wt + this.player.radius + 38; // ~84px dentro de la sala, lejos del gatillo opuesto

      if (doorDir === 'N') {
        this.player.x = this.room.width / 2;
        this.player.y = this.room.height - safeDist;
      } else if (doorDir === 'S') {
        this.player.x = this.room.width / 2;
        this.player.y = safeDist;
      } else if (doorDir === 'W') {
        this.player.x = this.room.width - safeDist;
        this.player.y = this.room.height / 2;
      } else if (doorDir === 'E') {
        this.player.x = safeDist;
        this.player.y = this.room.height / 2;
      }

      this.camera.x = this.player.x;
      this.camera.y = this.player.y;

      if (this.audio && this.audio.playClear) this.audio.playClear();
      this.enterRoom(targetRoom);
    }

    checkRoomWaveProgress() {
      if (this.currentRoom.cleared) return;

      // Si no quedan enemigos activos en la sala
      if (this.enemies.activeCount === 0) {
        const waves = this.currentRoom.waves || [];
        if (this.currentWaveIndex + 1 < waves.length) {
          // Avanzar a la siguiente oleada
          this.currentWaveIndex++;
          this.spawnWave(this.currentWaveIndex);
          this.showWaveBanner(`¡OLEADA ${this.currentWaveIndex + 1}/${waves.length}!`, '⚔️', false);
        } else {
          // ¡Sala despejada! Abrir puertas
          this.currentRoom.cleared = true;
          this.doorsLocked = false;
          this.showWaveBanner('¡SALA DESPEJADA! PUERTAS ABIERTAS', '✨', true);
          if (this.audio && this.audio.playClear) this.audio.playClear();
          this.minimap.render(this.dungeon, this.currentRoom);
          if (this.state === 'MAP_VIEW' && this.mapModalCanvas) {
            this.minimap.render(this.dungeon, this.currentRoom, this.mapModalCanvas);
          }
        }
      }
    }

    handleEnemyTouch(touchingEnemy) {
      const damageApplied = this.player.takeDamage(
        touchingEnemy.damage,
        (this.player.x - touchingEnemy.x) * 0.1,
        (this.player.y - touchingEnemy.y) * 0.1
      );

      if (damageApplied === 'BLOCKED') {
        this.floatingTexts.spawn(this.player.x, this.player.y - 15, '¡BLOQUEO!', '#38bdf8', true);
        for (let k = 0; k < 12; k++) {
          this.particles.spawn(this.player.x, this.player.y, (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 120, 0.35, 4, '#38bdf8');
        }
        if (this.audio && this.audio.playClear) this.audio.playClear();
      } else if (damageApplied) {
        this.floatingTexts.spawn(this.player.x, this.player.y - 15, `-${touchingEnemy.damage}`, '#ef4444', true);
        this.triggerScreenShake(7, 0.22);
        if (this.audio && this.audio.playTone) this.audio.playTone(110, 'sawtooth', 0.15, 0.15);
        if (typeof ArcadeCanvas !== 'undefined') ArcadeCanvas.haptic(35);

        if (this.player.hp <= 0) {
          this.handlePlayerDeath();
        }
      }
    }

    handleEnemyExplosion(explosive) {
      // Daño en área al jugador si está cerca
      const dist = Math.hypot(this.player.x - explosive.x, this.player.y - explosive.y);
      if (dist < explosive.explosionRadius) {
        const damageApplied = this.player.takeDamage(explosive.damage, (this.player.x - explosive.x) * 0.2, (this.player.y - explosive.y) * 0.2);
        if (damageApplied === 'BLOCKED') {
          this.floatingTexts.spawn(this.player.x, this.player.y - 15, '¡BLOQUEO!', '#38bdf8', true);
        } else if (damageApplied) {
          this.floatingTexts.spawn(this.player.x, this.player.y - 15, `-${explosive.damage}!`, '#ef4444', true);
        }
      }

      // Detonación de partículas
      for (let k = 0; k < 20; k++) {
        this.particles.spawn(
          explosive.x,
          explosive.y,
          (Math.random() - 0.5) * 220,
          (Math.random() - 0.5) * 220,
          0.45,
          5,
          '#f59e0b'
        );
      }

      this.triggerScreenShake(10, 0.35);
      if (this.audio && this.audio.playExplosion) this.audio.playExplosion();
      this.killCount++;
    }

    handleSpawnMinion(x, y) {
      if (this.enemies.activeCount >= 30) return;
      const minionData = Object.assign({}, ENEMIGOS_DATA.perseguidor, { hp: 18, radius: 9, speed: 120 });
      this.enemies.spawn(x, y, minionData, false, this.floor);
      for (let k = 0; k < 6; k++) {
        this.particles.spawn(x, y, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, 0.3, 3, '#38bdf8');
      }
    }

    resolveProjectileCollisions() {
      const hitBuffer = [];

      for (let i = 0; i < this.projectiles.pool.length; i++) {
        const p = this.projectiles.pool[i];
        if (!p.active) continue;

        this.spatialHash.queryRange(p.x, p.y, p.radius + 6, hitBuffer);

        for (let j = 0; j < hitBuffer.length; j++) {
          const enemy = hitBuffer[j];
          if (!enemy.active || enemy.hp <= 0) continue;
          if (p.hitEnemies.has(enemy)) continue;
          p.hitEnemies.add(enemy);

          const isDead = enemy.takeDamage(p.damage, p.vx * 0.25, p.vy * 0.25, p.x, p.y);
          if (p.isCrit) {
            this.hitStopTimer = CFG.HIT_STOP_DURATION || 0.05;
          }
          this.floatingTexts.spawn(

            enemy.x,
            enemy.y,
            p.isCrit ? `${p.damage}!` : p.damage,
            p.isCrit ? '#fbbf24' : '#f8fafc',
            p.isCrit
          );

          // Partículas de impacto
          const pColor = p.isCrit ? '#fbbf24' : (CFG.PALETTE ? CFG.PALETTE.BULLET : '#a855f7');
          for (let k = 0; k < (p.isCrit ? 8 : 5); k++) {
            this.particles.spawn(
              p.x,
              p.y,
              -p.vx * 0.15 + (Math.random() - 0.5) * 60,
              -p.vy * 0.15 + (Math.random() - 0.5) * 60,
              0.25,
              3,
              pColor
            );
          }

          // Sinergia: Bombardeo Abisal (Micro-explosión en área)
          if (p.synergyExplosiveImpact) {
            const aoeRadius = 55 * (p.areaMult || 1.0);
            const aoeDmg = Math.round(p.damage * 0.45);
            const aoeHits = [];
            this.spatialHash.queryRange(p.x, p.y, aoeRadius, aoeHits);
            for (let a = 0; a < aoeHits.length; a++) {
              const aoeTarget = aoeHits[a];
              if (aoeTarget !== enemy && aoeTarget.active && aoeTarget.hp > 0) {
                const killed = aoeTarget.takeDamage(aoeDmg, 0, 0, p.x, p.y);
                this.floatingTexts.spawn(aoeTarget.x, aoeTarget.y, aoeDmg, '#f97316', false);
                if (killed) this.handleEnemyKilled(aoeTarget);
              }
            }
            for (let k = 0; k < 10; k++) {
              this.particles.spawn(p.x, p.y, (Math.random() - 0.5) * 110, (Math.random() - 0.5) * 110, 0.28, 3.5, '#f97316');
            }
          }

          // Sinergia: Tempestad Fulgurante (Rayo encadenado en impactos críticos)
          if (this.player.synergyChainLightning && p.isCrit) {
            const chainTarget = this.spatialHash.getNearest(p.x, p.y, 160, (e) => e !== enemy && e.active && e.hp > 0);
            if (chainTarget && chainTarget.entity) {
              const chainDmg = Math.round(p.damage * 0.65);
              const killed = chainTarget.entity.takeDamage(chainDmg, 0, 0, p.x, p.y);
              this.floatingTexts.spawn(chainTarget.entity.x, chainTarget.entity.y, `⚡${chainDmg}`, '#38bdf8', true);
              for (let k = 0; k < 8; k++) {
                this.particles.spawn(chainTarget.entity.x, chainTarget.entity.y, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, 0.22, 3, '#38bdf8');
              }
              if (killed) this.handleEnemyKilled(chainTarget.entity);
            }
          }

          // Sinergia: Fragmentación Resonante (Esquirlas al perforar)
          if (p.synergyShardOnPierce && p.pierce > 0) {
            const baseAngle = Math.atan2(p.vy, p.vx);
            const shardSpeed = Math.hypot(p.vx, p.vy) * 0.85;
            const shardDamage = Math.max(8, Math.round(p.damage * 0.4));
            this.projectiles.spawn(p.x, p.y, baseAngle + 0.45, shardSpeed, shardDamage, 0.45, 0, 1, false, 0.8, false, false);
            this.projectiles.spawn(p.x, p.y, baseAngle - 0.45, shardSpeed, shardDamage, 0.45, 0, 1, false, 0.8, false, false);
          }

          if (isDead) {
            this.handleEnemyKilled(enemy);
          }

          // Rebote hacia enemigo más cercano
          if (p.bounce > 0) {
            p.bounce--;
            const nextTarget = this.spatialHash.getNearest(p.x, p.y, 220, (e) => !p.hitEnemies.has(e) && e.active && e.hp > 0);
            if (nextTarget && nextTarget.entity) {
              const bAngle = Math.atan2(nextTarget.entity.y - p.y, nextTarget.entity.x - p.x);
              const speed = Math.hypot(p.vx, p.vy) || 400;
              p.vx = Math.cos(bAngle) * speed;
              p.vy = Math.sin(bAngle) * speed;
              p.life = Math.min(p.life + 0.35, p.maxLife);
              break;
            }
          }

          if (p.pierce <= 0) {
            p.active = false;
            break;
          } else {
            p.pierce--;
          }
        }
      }
    }

    resolveEnemyProjectileCollisions() {
      for (let i = 0; i < this.enemyProjectiles.pool.length; i++) {
        const p = this.enemyProjectiles.pool[i];
        if (!p.active) continue;

        const dist = Math.hypot(this.player.x - p.x, this.player.y - p.y);
        if (dist < p.radius + this.player.radius) {
          const damageApplied = this.player.takeDamage(p.damage, p.vx * 0.2, p.vy * 0.2);
          if (damageApplied === 'BLOCKED') {
            this.floatingTexts.spawn(this.player.x, this.player.y - 15, '¡BLOQUEO!', '#38bdf8', true);
            for (let k = 0; k < 10; k++) {
              this.particles.spawn(this.player.x, this.player.y, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, 0.3, 3.5, '#38bdf8');
            }
          } else if (damageApplied) {
            this.floatingTexts.spawn(this.player.x, this.player.y - 15, `-${p.damage}`, '#ef4444', true);
            this.triggerScreenShake(7, 0.2);
            if (this.player.hp <= 0) this.handlePlayerDeath();
          }
          p.active = false;
        }
      }
    }

    handleEnemyKilled(enemy) {
      enemy.active = false;
      this.killCount++;
      this.score += enemy.expValue || 10;

      // Generar botín (XP y Oro) en la posición de muerte
      if (this.loot) {
        this.loot.spawnEnemyDrop(
          enemy.x,
          enemy.y,
          enemy.expValue || 10,
          enemy.isElite || false,
          this.player.goldMult || 1.0
        );
      }

      // Vampirismo (Sed del Vacío)
      if (this.player.vampirismChance > 0 && Math.random() < this.player.vampirismChance) {
        const heal = this.player.vampirismHeal || 4;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
        this.floatingTexts.spawn(this.player.x, this.player.y - 18, `+${heal} HP`, '#4ade80', true);
        for (let k = 0; k < 6; k++) {
          this.particles.spawn(this.player.x, this.player.y, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, 0.3, 3, '#4ade80');
        }
      }

      // Sinergia: Cosecha de Almas
      if (this.player.synergySoulHarvest) {
        this.player.soulHarvestBuffTimer = 4.0;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
        this.floatingTexts.spawn(this.player.x, this.player.y - 24, '¡COSECHA DE ALMAS!', '#ec4899', true);
      }

      for (let k = 0; k < 12; k++) {
        this.particles.spawn(
          enemy.x,
          enemy.y,
          (Math.random() - 0.5) * 140,
          (Math.random() - 0.5) * 140,
          0.38,
          4,
          enemy.color
        );
      }

      // Recompensas colosales al derrotar a un Jefe (Fase 4 y 5)
      if (enemy.isBoss) {
        this.bossesKilled = (this.bossesKilled || 0) + 1;
        this.hitStopTimer = 0.08;
        if (this.bossHudContainer) this.bossHudContainer.classList.add('hidden');
        if (this.loot) {
          for (let i = 0; i < 10; i++) {
            this.loot.spawn(enemy.x + (Math.random() - 0.5) * 40, enemy.y + (Math.random() - 0.5) * 40, 'gold', 20);
            this.loot.spawn(enemy.x + (Math.random() - 0.5) * 40, enemy.y + (Math.random() - 0.5) * 40, 'xp', 30);
          }
        }
        this.triggerScreenShake(14, 0.45);
        this.showWaveBanner('¡JEFE DERROTADO! PORTAL ABIERTO', '👑', true);
        this.floatingTexts.spawn(enemy.x, enemy.y - 25, '¡VICTORIA COLOSAL!', '#fbbf24', true);
      }

      if (this.audio && this.audio.playClear) this.audio.playClear();
    }

    // Descenso hacia el siguiente piso del Abismo (Fase 4 y 5)
    descendToNextFloor() {
      this.floor++;
      if (this.floorValEl) this.floorValEl.textContent = `PISO ${this.floor}`;

      // Curar 35% de vida al descender por el portal
      const heal = Math.round(this.player.maxHp * 0.35);
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
      this.floatingTexts.spawn(this.player.x, this.player.y - 25, `+${heal} HP (PORTAL)`, '#4ade80', true);

      // Partículas y feedback de descenso
      for (let k = 0; k < 25; k++) {
        this.particles.spawn(this.player.x, this.player.y, (Math.random() - 0.5) * 180, (Math.random() - 0.5) * 180, 0.45, 4, '#38bdf8');
      }

      this.initDungeon();
      this.player.x = this.room.width / 2;
      this.player.y = this.room.height / 2;
      this.camera.x = this.player.x;
      this.camera.y = this.player.y;

      // Actualizar logros y autoguardado (Fase 5)
      if (AbismoStorage) {
        if (!this.metaState.stats) this.metaState.stats = {};
        this.metaState.stats.maxFloorReached = Math.max(this.metaState.stats.maxFloorReached || 1, this.floor);
        AbismoStorage.checkAchievements(this.metaState);
        AbismoStorage.saveActiveRun(this);
      }

      const bName = (this.dungeon && this.dungeon.currentBiome) ? this.dungeon.currentBiome.name.toUpperCase() : 'ABISMO';
      this.showWaveBanner(`¡PISO ${this.floor}: ${bName}!`, '🌀', true);
      this.triggerScreenShake(8, 0.3);
      if (this.audio && this.audio.playClear) this.audio.playClear();
    }


    handleCollectLoot(item) {
      if (item.type === 'xp') {
        const levels = this.player.gainXp(item.value);
        if (levels > 0) {
          this.pendingLevelUps += levels;
          if (this.state === 'PLAYING') {
            this.triggerNextLevelUp();
          }
        }
        if (this.audio && this.audio.playTone) {
          this.audio.playTone(520 + Math.random() * 80, 'sine', 0.05, 0.04);
        }
      } else if (item.type === 'gold') {
        this.player.gold += item.value;
        if (this.audio && this.audio.playTone) {
          this.audio.playTone(880 + Math.random() * 120, 'triangle', 0.06, 0.05);
        }
      } else if (item.type === 'heart') {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + item.value);
        this.floatingTexts.spawn(this.player.x, this.player.y - 15, `+${item.value} HP`, '#4ade80', true);
      }

      this.updateHUD();
    }

    checkRoomInteractables(dt) {
      if (!this.currentRoom) return;

      const cx = this.room.width / 2;
      const cy = this.room.height / 2;

      // 1. Sala de Tesoro: Cofre Ancestral
      if (this.currentRoom.type === 'tesoro' && !this.currentRoom.chestOpened) {
        const dist = Math.hypot(this.player.x - cx, this.player.y - cy);
        if (dist <= (CFG.CHEST_INTERACT_RADIUS || 46)) {
          this.currentRoom.chestOpened = true;

          // Soltar botín abundante de oro y experiencia
          if (this.loot) {
            for (let i = 0; i < 6; i++) {
              this.loot.spawn(cx + (Math.random() - 0.5) * 24, cy + (Math.random() - 0.5) * 24, 'gold', 15);
            }
            for (let i = 0; i < 4; i++) {
              this.loot.spawn(cx + (Math.random() - 0.5) * 24, cy + (Math.random() - 0.5) * 24, 'xp', 25);
            }
          }

          // Partículas doradas
          for (let k = 0; k < 25; k++) {
            this.particles.spawn(cx, cy, (Math.random() - 0.5) * 180, (Math.random() - 0.5) * 180, 0.5, 4.5, '#fbbf24');
          }

          this.triggerScreenShake(7, 0.25);
          if (this.audio && this.audio.playClear) this.audio.playClear();
          if (typeof ArcadeCanvas !== 'undefined') ArcadeCanvas.haptic(50);

          // Ofrecer de inmediato una reliquia bendita mediante el modal de mejoras
          this.triggerLevelUpBlessing('¡BÓVEDA ANCESTRAL ABIERTA!', 'Elige una reliquia bendita de la cripta');
        }
      }

      // 2. Sala de Tienda: Pedestales del Mercader Umbrío
      if (this.currentRoom.type === 'tienda' && this.currentRoom.shopItems) {
        const offsets = [-130, 0, 130];
        const interactRadius = CFG.SHOP_INTERACT_RADIUS || 48;

        if (this._shopWarningTimer > 0) this._shopWarningTimer -= dt;

        for (let i = 0; i < 3; i++) {
          const item = this.currentRoom.shopItems[i];
          if (!item || item.bought) continue;

          const px = cx + offsets[i];
          const py = cy;
          const dist = Math.hypot(this.player.x - px, this.player.y - py);

          if (dist <= interactRadius) {
            if (this.player.gold >= item.cost) {
              // Compra exitosa
              this.player.gold -= item.cost;
              item.bought = true;

              if (item.id === 'potion') {
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + 45);
                this.floatingTexts.spawn(this.player.x, this.player.y - 20, '+45 HP', '#4ade80', true);
              } else {
                // Ofrecer bendición o reliquia adquirida
                this.triggerLevelUpBlessing(`¡COMPRA: ${item.name.toUpperCase()}!`, 'Elige la bendición adquirida con el mercader');
              }

              for (let k = 0; k < 16; k++) {
                this.particles.spawn(px, py, (Math.random() - 0.5) * 130, (Math.random() - 0.5) * 130, 0.35, 3.5, '#38bdf8');
              }

              if (this.audio && this.audio.playClear) this.audio.playClear();
              if (typeof ArcadeCanvas !== 'undefined') ArcadeCanvas.haptic(35);
              this.updateHUD();
            } else if (this._shopWarningTimer <= 0) {
              this._shopWarningTimer = 1.3;
              this.floatingTexts.spawn(this.player.x, this.player.y - 20, `¡Oro insuficiente! (${item.cost} 🪙)`, '#ef4444', true);
              if (this.audio && this.audio.playTone) this.audio.playTone(140, 'sawtooth', 0.1, 0.08);
            }
          }
        }
      }
    }

    triggerNextLevelUp() {
      if (this.pendingLevelUps <= 0) return;
      this.pendingLevelUps--;
      this.triggerLevelUpBlessing('¡NIVEL ALCANZADO!', 'Elige una bendición arcana para potenciarte:');
    }

    triggerLevelUpBlessing(title = '¡NIVEL ALCANZADO!', subtitle = 'Elige una bendición arcana para potenciarte:') {
      this.state = 'LEVELUP';

      if (this.levelUpTitle) this.levelUpTitle.textContent = title;
      if (this.levelUpSubtitle) this.levelUpSubtitle.textContent = subtitle;

      // Obtener 3 opciones aleatorias ponderadas
      const options = UpgradeManager ? UpgradeManager.getRandomSelection(this.player, 3) : [];

      if (!this.upgradeCardsGrid) return;
      this.upgradeCardsGrid.innerHTML = '';

      if (options.length === 0) {
        // Si no quedan mejoras disponibles
        const emptyCard = document.createElement('div');
        emptyCard.className = 'upgrade-card rarity-comun';
        emptyCard.innerHTML = `
          <div class="card-icon">👑</div>
          <div class="card-name">Poder Absoluto</div>
          <div class="card-desc">Has dominado todas las bendiciones arcanas. Restaura 50 HP.</div>
        `;
        emptyCard.addEventListener('click', () => {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 50);
          this.closeLevelUpModal();
        });
        this.upgradeCardsGrid.appendChild(emptyCard);
      } else {
        options.forEach((opt) => {
          const card = document.createElement('div');
          card.className = `upgrade-card rarity-${opt.rarity || 'comun'}`;

          const rarityBadge = opt.isSynergy ? 'SINERGIA' : (opt.rarity ? opt.rarity.toUpperCase() : 'COMÚN');
          const lvlText = opt.isSynergy ? 'ÚNICA' : `Nivel ${opt.currentLevel || 0} ➔ ${opt.nextLevel || 1}`;

          card.innerHTML = `
            <div class="card-top-row">
              <span class="card-rarity-badge">${rarityBadge}</span>
              <span class="card-level-badge">${lvlText}</span>
            </div>
            <div class="card-icon">${opt.icon || '✨'}</div>
            <h3 class="card-name">${opt.name}</h3>
            <p class="card-desc">${opt.description}</p>
          `;

          const onSelect = () => {
            this.applyChosenUpgrade(opt.id, opt.name);
          };

          card.addEventListener('click', onSelect);
          this.upgradeCardsGrid.appendChild(card);
        });
      }

      if (this.levelUpModal) {
        this.levelUpModal.classList.remove('hidden');
      }

      if (this.audio && this.audio.playClear) this.audio.playClear();
      if (typeof ArcadeCanvas !== 'undefined') ArcadeCanvas.haptic(40);
    }

    applyChosenUpgrade(upgradeId, upgradeName) {
      if (UpgradeManager) {
        UpgradeManager.applyUpgrade(this.player, upgradeId);
      }

      this.floatingTexts.spawn(this.player.x, this.player.y - 25, `¡${upgradeName}!`, '#38bdf8', true);
      this.updateHUD();

      this.closeLevelUpModal();
    }

    closeLevelUpModal() {
      if (this.levelUpModal) {
        this.levelUpModal.classList.add('hidden');
      }

      // Si había más niveles acumulados en cola, abrir la siguiente bendición
      if (this.pendingLevelUps > 0) {
        this.triggerNextLevelUp();
      } else {
        this.state = 'PLAYING';
        this.lastTimestamp = performance.now();
      }
    }

    handlePlayerDeath() {
      this.state = 'GAMEOVER';
      if (this.mapModal) this.mapModal.classList.add('hidden');

      if (this.audioHelper) {
        this.audioHelper.stopAmbientMusic();
      }

      // Registrar final de descenso y cosechar esencia permanente (Fase 5)
      let essenceEarned = 0;
      let newAchievements = [];
      if (AbismoStorage) {
        const res = AbismoStorage.recordRunEnd(
          this.metaState,
          this.floor,
          this.killCount,
          this.player.gold,
          this.bossesKilled || 0
        );
        essenceEarned = res.essenceEarned;
        newAchievements = res.newAchievements;
      }

      const resFloor = document.getElementById('res-floor');
      if (resFloor) resFloor.textContent = `PISO ${this.floor}`;

      const resKills = document.getElementById('res-kills');
      if (resKills) resKills.textContent = this.killCount;

      const resScore = document.getElementById('res-score');
      if (resScore) resScore.textContent = this.score;

      const resEssenceEarned = document.getElementById('res-essence-earned');
      if (resEssenceEarned) resEssenceEarned.textContent = `+${essenceEarned} ✨`;

      const resEssenceTotal = document.getElementById('res-essence-total');
      if (resEssenceTotal) resEssenceTotal.textContent = `${this.metaState.essence} ✨`;

      if (this.btnContinueRun) this.btnContinueRun.classList.add('hidden');
      this.updateEssenceDisplay();

      if (this.gameOverModal) {
        this.gameOverModal.classList.remove('hidden');
      }

      if (newAchievements && newAchievements.length > 0) {
        this.floatingTexts.spawn(this.player.x, this.player.y - 30, `¡LOGRO: ${newAchievements[0].name}!`, '#fbbf24', true);
      }

      if (this.audio && this.audio.playGameOver) {
        this.audio.playGameOver();
      }
    }


    updateCamera(dt) {
      const lerp = CFG.CAMERA_LERP || 0.12;
      this.camera.x += (this.player.x - this.camera.x) * lerp;
      this.camera.y += (this.player.y - this.camera.y) * lerp;

      if (this.shakeDuration > 0) {
        this.shakeDuration -= dt;
      } else {
        this.shakeIntensity = 0;
      }
    }

    updateHUD() {
      const hpRatio = Math.max(0, this.player.hp / this.player.maxHp);
      if (this.hpFillEl) {
        this.hpFillEl.style.width = `${hpRatio * 100}%`;
      }
      if (this.hpTextEl) {
        this.hpTextEl.textContent = `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;
      }

      // XP y Nivel (Fase 3)
      if (this.levelBadgeEl) {
        this.levelBadgeEl.textContent = `NV. ${this.player.level}`;
      }
      if (this.xpTextEl) {
        this.xpTextEl.textContent = `${Math.floor(this.player.currentXp)} / ${this.player.xpToNextLevel} XP`;
      }
      if (this.xpFillEl) {
        const xpRatio = Math.min(1, Math.max(0, this.player.currentXp / this.player.xpToNextLevel));
        this.xpFillEl.style.width = `${xpRatio * 100}%`;
      }

      // Oro (Fase 3)
      if (this.goldValEl) {
        this.goldValEl.textContent = this.player.gold;
      }

      if (this.specialCooldownEl && this.specialCooldownTextEl) {
        if (this.player.specialTimer > 0) {
          const ratio = this.player.specialTimer / this.player.specialCooldown;
          this.specialCooldownEl.style.height = `${ratio * 100}%`;
          this.specialCooldownTextEl.textContent = this.player.specialTimer.toFixed(1);
          this.specialCooldownTextEl.classList.remove('hidden');
        } else {
          this.specialCooldownEl.style.height = '0%';
          this.specialCooldownTextEl.classList.add('hidden');
        }
      }

      if (this.killsValEl) this.killsValEl.textContent = this.killCount;
      if (this.enemiesValEl) this.enemiesValEl.textContent = this.enemies.activeCount;

      // Barra de Vida del Jefe (Fase 4)
      let bossFound = null;
      for (let i = 0; i < this.enemies.pool.length; i++) {
        const e = this.enemies.pool[i];
        if (e.active && e.isBoss && e.hp > 0) {
          bossFound = e;
          break;
        }
      }
      this.activeBoss = bossFound;

      if (this.activeBoss && this.bossHudContainer) {
        this.bossHudContainer.classList.remove('hidden');
        const pct = Math.max(0, Math.ceil((this.activeBoss.hp / this.activeBoss.maxHp) * 100));
        if (this.bossHpFillEl) this.bossHpFillEl.style.width = `${pct}%`;
        if (this.bossHpPctEl) this.bossHpPctEl.textContent = `${pct}%`;
      } else if (this.bossHudContainer && (!this.currentRoom || this.currentRoom.type !== 'jefe')) {
        this.bossHudContainer.classList.add('hidden');
      }
    }

    render() {
      if (!this.ctx) return;
      const ctx = this.ctx;
      const dpr = window.devicePixelRatio || 1;

      ctx.save();
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.scale(dpr, dpr);

      let shakeOffsetX = 0;
      let shakeOffsetY = 0;
      if (this.shakeDuration > 0 && this.shakeIntensity > 0) {
        shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
        shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      }

      ctx.translate(
        this.camera.viewportW / 2 + shakeOffsetX,
        this.camera.viewportH / 2 + shakeOffsetY
      );
      ctx.scale(this.camera.zoom, this.camera.zoom);
      ctx.translate(-this.camera.x, -this.camera.y);

      // 1. Sala y Puertas (abiertas o barrera carmesí)
      this.room.render(ctx, this.doorsLocked);

      // 1.5 Botín en el suelo (XP y Oro con pulso magnético)
      if (this.loot) {
        this.loot.render(ctx);
      }

      // 2. Proyectiles del jugador y enemigos
      this.projectiles.render(ctx);
      this.enemyProjectiles.render(ctx);

      // 3. Enemigos
      this.enemies.render(ctx);

      // 4. Jugador (Pseudo-3D)
      this.player.render(ctx);

      // 5. Partículas y Textos de Daño
      this.particles.render(ctx);
      this.floatingTexts.render(ctx);

      // 6. Iluminación suave en la cripta y antorchas (Fase 5)
      this.renderLighting(ctx);

      ctx.restore();
    }

    renderLighting(ctx) {
      if (CFG.LIGHTING_ENABLED === false) return;
      ctx.save();
      const px = this.player.x;
      const py = this.player.y;
      const vigRadius = Math.max(380, this.player.attackRange * 1.5);
      const grad = ctx.createRadialGradient(px, py, 60, px, py, vigRadius);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(0.65, 'rgba(4, 3, 10, 0.22)');
      grad.addColorStop(1, 'rgba(3, 2, 8, 0.75)');

      ctx.fillStyle = grad;
      ctx.fillRect(px - vigRadius, py - vigRadius, vigRadius * 2, vigRadius * 2);

      // Resplandor cálido de antorchas
      if (this.room && this.room.torches) {
        for (let i = 0; i < this.room.torches.length; i++) {
          const t = this.room.torches[i];
          const tGrad = ctx.createRadialGradient(t.x, t.y, 4, t.x, t.y, 52);
          tGrad.addColorStop(0, 'rgba(251, 191, 36, 0.22)');
          tGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
          ctx.fillStyle = tGrad;
          ctx.beginPath();
          ctx.arc(t.x, t.y, 52, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    updateEssenceDisplay() {
      const ess = (this.metaState && typeof this.metaState.essence === 'number') ? this.metaState.essence : 0;
      if (this.metaEssenceValEl) this.metaEssenceValEl.textContent = ess;
      if (this.startEssenceValEl) this.startEssenceValEl.textContent = ess;
    }

    updateCharacterSelectorUI() {
      const charCards = document.querySelectorAll('#character-selector-grid .char-card');
      charCards.forEach((card) => {
        const charId = card.dataset.char;
        const char = Array.isArray(PERSONAJES) ? PERSONAJES.find((c) => c.id === charId) : null;
        const isUnlocked = !char || char.unlockedByDefault || (this.metaState && this.metaState.unlockedCharacters && this.metaState.unlockedCharacters.includes(charId));

        let badge = card.querySelector('.char-card-lock-badge');
        if (!isUnlocked) {
          card.classList.add('locked');
          if (!badge) {
            badge = document.createElement('span');
            badge.className = 'char-card-lock-badge';
            badge.textContent = '🔒 Bloqueado';
            card.appendChild(badge);
          }
        } else {
          card.classList.remove('locked');
          if (badge) badge.remove();
        }
      });
    }

    checkActiveRun() {
      if (!AbismoStorage) return;
      const activeRun = AbismoStorage.loadActiveRun();
      if (activeRun && this.btnContinueRun && this.continueRunInfo) {
        this.continueRunInfo.textContent = `Piso ${activeRun.floor} - Nv. ${(activeRun.player ? activeRun.player.level : 1)}`;
        this.btnContinueRun.classList.remove('hidden');
      } else if (this.btnContinueRun) {
        this.btnContinueRun.classList.add('hidden');
      }
    }

    continueActiveRun() {
      if (!AbismoStorage) return;
      const activeRun = AbismoStorage.loadActiveRun();
      if (!activeRun) return;

      if (this.audio && this.audio.initCtx) this.audio.initCtx();
      if (this.audioHelper) this.audioHelper.startAmbientMusic();

      this.floor = activeRun.floor || 1;
      this.selectedCharacter = activeRun.selectedCharacter || 'peregrino';
      this.killCount = activeRun.killCount || 0;
      this.score = activeRun.score || 0;
      this.gameTime = activeRun.gameTime || 0;

      const charData = Array.isArray(PERSONAJES)
        ? (PERSONAJES.find((c) => c.id === this.selectedCharacter) || PERSONAJES[0])
        : null;
      if (charData) this.player.applyCharacter(charData);

      if (activeRun.player) {
        const p = activeRun.player;
        this.player.maxHp = p.maxHp || 100;
        this.player.hp = Math.min(this.player.maxHp, p.hp);
        this.player.currentXp = p.currentXp || 0;
        this.player.level = p.level || 1;
        this.player.xpToNextLevel = p.xpToNextLevel || (CFG.XP_BASE || 28);
        this.player.gold = p.gold || 0;
        this.player.damageMult = p.damageMult || 1.0;
        this.player.speed = p.speed || this.player.speed;
        this.player.pickupRadius = p.pickupRadius || this.player.pickupRadius;
        this.player.specialCooldown = p.specialCooldown || this.player.specialCooldown;
        this.player.pierceCount = p.pierce || 0;
        this.player.bounceCount = p.bounce || 0;
        this.player.extraProjectiles = p.projectileCount || 0;
        this.player.critChance = p.critChance || 0.05;
        this.player.areaMult = p.areaMult || 1.0;
      }

      this.initDungeon();
      if (activeRun.currentRoomCoords && this.dungeon && this.dungeon.grid) {
        const savedRoom = this.dungeon.grid[activeRun.currentRoomCoords.gx]?.[activeRun.currentRoomCoords.gy];
        if (savedRoom) this.enterRoom(savedRoom);
      }

      if (this.floorValEl) this.floorValEl.textContent = `PISO ${this.floor}`;

      if (this.startModal) {
        this.startModal.classList.add('hidden');
        this.startModal.style.display = 'none';
      }
      if (this.btnContinueRun) this.btnContinueRun.classList.add('hidden');

      this.state = 'PLAYING';
      this.lastTimestamp = performance.now();
      this.updateHUD();
      this.showWaveBanner(`DESCENSO REANUDADO - PISO ${this.floor}`, '⚡', true);
    }

    initDebugPanel() {
      const isDebug = typeof window !== 'undefined' &&
        window.location &&
        window.location.search &&
        (window.location.search.includes('debug=1') || window.location.search.includes('debug=true'));

      if (!isDebug || !this.debugPanel) return;
      this.debugPanel.classList.remove('hidden');

      const btnGold = document.getElementById('dbg-btn-gold');
      if (btnGold) {
        btnGold.addEventListener('click', () => {
          this.player.gold += 100;
          this.updateHUD();
          this.floatingTexts.spawn(this.player.x, this.player.y - 20, '+100 ORO', '#fbbf24', true);
        });
      }

      const btnEssence = document.getElementById('dbg-btn-essence');
      if (btnEssence) {
        btnEssence.addEventListener('click', () => {
          this.metaState.essence += 100;
          this.metaState.totalEssenceEarned = (this.metaState.totalEssenceEarned || 0) + 100;
          if (AbismoStorage) AbismoStorage.saveMeta(this.metaState);
          this.updateEssenceDisplay();
          this.floatingTexts.spawn(this.player.x, this.player.y - 20, '+100 ESENCIA', '#c084fc', true);
        });
      }

      const btnLevel = document.getElementById('dbg-btn-level');
      if (btnLevel) {
        btnLevel.addEventListener('click', () => {
          this.triggerLevelUpBlessing('DEBUG LEVEL UP', 'Selecciona una bendición');
        });
      }

      const btnGod = document.getElementById('dbg-btn-god');
      if (btnGod) {
        btnGod.addEventListener('click', () => {
          this.player.godMode = !this.player.godMode;
          this.floatingTexts.spawn(this.player.x, this.player.y - 20, this.player.godMode ? 'MODO DIOS: ON' : 'MODO DIOS: OFF', '#38bdf8', true);
        });
      }

      const btnClear = document.getElementById('dbg-btn-clear');
      if (btnClear) {
        btnClear.addEventListener('click', () => {
          for (let i = 0; i < this.enemies.pool.length; i++) {
            const e = this.enemies.pool[i];
            if (e.active && e.hp > 0) {
              e.hp = 0;
              e.active = false;
              this.handleEnemyKilled(e);
            }
          }
          this.doorsLocked = false;
          this.floatingTexts.spawn(this.player.x, this.player.y - 20, '¡SALA PURGADA!', '#4ade80', true);
        });
      }

      const btnFloor = document.getElementById('dbg-btn-floor');
      if (btnFloor) {
        btnFloor.addEventListener('click', () => {
          this.descendToNextFloor();
        });
      }
    }

    updateDebugOverlay() {
      if (!this.debugPanel || this.debugPanel.classList.contains('hidden')) return;

      const fpsEl = document.getElementById('debug-fps');
      if (fpsEl) fpsEl.textContent = `FPS: ${this.fps}`;

      const dbgEntities = document.getElementById('dbg-entities');
      const dbgEnemies = document.getElementById('dbg-enemies');
      const dbgBullets = document.getElementById('dbg-bullets');
      const dbgParticles = document.getElementById('dbg-particles');
      const dbgLoot = document.getElementById('dbg-loot');
      const dbgFloor = document.getElementById('dbg-floor');
      const dbgRoom = document.getElementById('dbg-room');

      const bulletsCount = this.projectiles.activeCount + this.enemyProjectiles.activeCount;
      const lootCount = this.loot ? this.loot.activeCount : 0;
      const partCount = this.particles.pool.filter((p) => p.active).length;

      if (dbgEntities) dbgEntities.textContent = this.enemies.activeCount + bulletsCount + lootCount + partCount;
      if (dbgEnemies) dbgEnemies.textContent = this.enemies.activeCount;
      if (dbgBullets) dbgBullets.textContent = bulletsCount;
      if (dbgParticles) dbgParticles.textContent = partCount;
      if (dbgLoot) dbgLoot.textContent = lootCount;
      if (dbgFloor) dbgFloor.textContent = this.floor;
      if (dbgRoom) dbgRoom.textContent = this.currentRoom ? `${this.currentRoom.gx},${this.currentRoom.gy}` : '-';
    }

    openMetaModal() {
      if (this.startModal) this.startModal.classList.add('hidden');
      if (this.metaModal) this.metaModal.classList.remove('hidden');
      this.renderMetaModal();
    }

    closeMetaModal() {
      if (this.metaModal) this.metaModal.classList.add('hidden');
      if (this.state === 'READY' && this.startModal) this.startModal.classList.remove('hidden');
      else if (this.state === 'GAMEOVER' && this.gameOverModal) this.gameOverModal.classList.remove('hidden');
      this.updateEssenceDisplay();
      this.updateCharacterSelectorUI();
    }

    renderMetaModal() {
      this.updateEssenceDisplay();
      if (!this.metaUpgradesGrid) return;
      this.metaUpgradesGrid.innerHTML = '';

      // Mejoras de atributos permanentes
      META_UPGRADES.forEach((u) => {
        const currentRank = (this.metaState.upgrades && this.metaState.upgrades[u.id]) || 0;
        const isMax = currentRank >= u.maxRank;
        const cost = isMax ? 0 : (AbismoStorage ? AbismoStorage.getUpgradeCost(u, currentRank) : 999);
        const canAfford = !isMax && (this.metaState.essence >= cost);

        const card = document.createElement('div');
        card.className = 'meta-card';
        card.innerHTML = `
          <div class="meta-card-header">
            <div class="meta-card-title-group">
              <span class="meta-card-icon">${u.icon}</span>
              <span class="meta-card-name">${u.name}</span>
            </div>
            <span class="meta-card-rank">${isMax ? 'MÁX' : 'Nv. ' + currentRank + ' / ' + u.maxRank}</span>
          </div>
          <p class="meta-card-desc">${u.desc}</p>
          <button class="meta-card-buy-btn" type="button" ${isMax || !canAfford ? 'disabled' : ''}>
            ${isMax ? 'NIVEL MÁXIMO' : `MEJORAR (${cost} ✨)`}
          </button>
        `;

        const buyBtn = card.querySelector('.meta-card-buy-btn');
        if (buyBtn && !isMax) {
          buyBtn.addEventListener('click', () => {
            if (AbismoStorage) {
              const res = AbismoStorage.buyUpgrade(this.metaState, u.id);
              if (res.success) {
                if (this.audio && this.audio.playClear) this.audio.playClear();
                this.renderMetaModal();
              }
            }
          });
        }
        this.metaUpgradesGrid.appendChild(card);
      });

      // Personajes desbloqueables permanentes
      PERSONAJES.forEach((c) => {
        if (c.unlockedByDefault) return;
        const isUnlocked = this.metaState.unlockedCharacters && this.metaState.unlockedCharacters.includes(c.id);
        const cost = c.costEssence || 120;
        const canAfford = !isUnlocked && (this.metaState.essence >= cost);

        const card = document.createElement('div');
        card.className = 'meta-card';
        card.innerHTML = `
          <div class="meta-card-header">
            <div class="meta-card-title-group">
              <span class="meta-card-icon">🎭</span>
              <span class="meta-card-name">${c.name}</span>
            </div>
            <span class="meta-card-rank">${isUnlocked ? 'DESBLOQUEADO' : 'PERSONAJE'}</span>
          </div>
          <p class="meta-card-desc">${c.description}</p>
          <button class="meta-card-buy-btn" type="button" ${isUnlocked || !canAfford ? 'disabled' : ''}>
            ${isUnlocked ? 'YA DESBLOQUEADO' : `DESBLOQUEAR (${cost} ✨)`}
          </button>
        `;

        const buyBtn = card.querySelector('.meta-card-buy-btn');
        if (buyBtn && !isUnlocked) {
          buyBtn.addEventListener('click', () => {
            if (AbismoStorage) {
              const res = AbismoStorage.unlockCharacter(this.metaState, c.id, cost);
              if (res.success) {
                if (this.audio && this.audio.playClear) this.audio.playClear();
                this.updateCharacterSelectorUI();
                this.renderMetaModal();
              }
            }
          });
        }
        this.metaUpgradesGrid.appendChild(card);
      });
    }

    resetMetaProgress() {
      if (AbismoStorage && AbismoStorage.resetProgress()) {
        this.metaState = getDefaultMetaState();
        this.updateEssenceDisplay();
        this.updateCharacterSelectorUI();
        this.renderMetaModal();
      }
    }

    openAchievementsModal() {
      if (this.startModal) this.startModal.classList.add('hidden');
      if (this.achievementsModal) this.achievementsModal.classList.remove('hidden');
      this.renderAchievementsModal();
    }

    closeAchievementsModal() {
      if (this.achievementsModal) this.achievementsModal.classList.add('hidden');
      if (this.startModal) this.startModal.classList.remove('hidden');
    }

    renderAchievementsModal() {
      if (!this.metaState || !this.metaState.stats) return;

      const st = this.metaState.stats;
      const elMaxFloor = document.getElementById('ach-stat-max-floor');
      if (elMaxFloor) elMaxFloor.textContent = `PISO ${st.maxFloorReached || 1}`;

      const elRuns = document.getElementById('ach-stat-runs');
      if (elRuns) elRuns.textContent = st.totalRuns || 0;

      const elKills = document.getElementById('ach-stat-kills');
      if (elKills) elKills.textContent = st.totalKills || 0;

      const elBosses = document.getElementById('ach-stat-bosses');
      if (elBosses) elBosses.textContent = st.bossesKilled || 0;

      const elEssence = document.getElementById('ach-stat-essence');
      if (elEssence) elEssence.textContent = `${this.metaState.totalEssenceEarned || 0} ✨`;

      if (!this.achievementsListGrid) return;
      this.achievementsListGrid.innerHTML = '';

      LOGROS.forEach((l) => {
        const isUnlocked = this.metaState.achievements && this.metaState.achievements.includes(l.id);
        const card = document.createElement('div');
        card.className = `ach-card ${isUnlocked ? 'unlocked' : 'locked'}`;
        card.innerHTML = `
          <span class="ach-card-icon">${l.icon}</span>
          <div class="ach-card-info">
            <div class="ach-card-name">${l.name}</div>
            <div class="ach-card-desc">${l.desc}</div>
          </div>
          <span class="ach-card-status">${isUnlocked ? 'DESBLOQUEADO 🏆' : 'BLOQUEADO 🔒'}</span>
        `;
        this.achievementsListGrid.appendChild(card);
      });
    }
  }

  // ============================================================================
  // 11. INICIALIZACIÓN Y EXPORTACIÓN
  // ============================================================================
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
      window.abismoInstance = new AbismoGame();
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      CFG,
      SpatialHashClass,
      ParticlePool,
      FloatingTextPool,
      ProjectilePool,
      EnemyProjectilePool,
      Enemy,
      EnemyPool,
      Player,
      Room,
      MiniMap,
      LootItem,
      LootPool,
      PERSONAJES,
      BIOMAS,
      DungeonGenerator,
      UpgradeManager,
      AbismoAudioHelper,
      AbismoStorage,
      META_UPGRADES,
      LOGROS,
      getDefaultMetaState,
      AbismoGame
    };
  }
})();

