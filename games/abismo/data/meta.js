/**
 * DATOS DE META-PROGRESIÓN, LOGROS Y ALMACENAMIENTO VERSIONADO - ABISMO
 * Gestiona:
 * - Mejoras permanentes del Altar del Abismo compradas con Esencia
 * - Desbloqueo de personajes
 * - Registro de logros y récord de piso más profundo
 * - Almacenamiento versionado con migración automática y resiliencia ante corrupción
 * - Guardado y recuperación de partida en curso (Autosave)
 */
(() => {
  'use strict';

  const STORAGE_KEY_V1 = 'abismo:v1';
  const ACTIVE_RUN_KEY = 'abismo:active_run';
  const CURRENT_STORAGE_VERSION = 1;

  // Catálogo de mejoras permanentes (Datos Puros)
  const META_UPGRADES = [
    {
      id: 'vida_inicial',
      name: 'Vitalidad Primordial',
      icon: 'heart',
      desc: '+15 de vida máxima base por rango.',
      maxRank: 5,
      baseCost: 20,
      costMult: 1.5,
      stat: 'maxHp',
      bonusPerRank: 15
    },
    {
      id: 'fuerza_ancestral',
      name: 'Poder del Vacío',
      icon: 'swords',
      desc: '+8% de daño general infligido por rango.',
      maxRank: 5,
      baseCost: 25,
      costMult: 1.6,
      stat: 'damageMult',
      bonusPerRank: 0.08
    },
    {
      id: 'pies_del_viento',
      name: 'Paso Espectral',
      icon: 'shoe',
      desc: '+10 px/s de velocidad de movimiento por rango.',
      maxRank: 4,
      baseCost: 25,
      costMult: 1.7,
      stat: 'speed',
      bonusPerRank: 10
    },
    {
      id: 'iman_arcano',
      name: 'Atracción Magnética',
      icon: 'magnet',
      desc: '+25 px de radio de imán para orbes de XP y oro.',
      maxRank: 3,
      baseCost: 20,
      costMult: 1.5,
      stat: 'pickupRadius',
      bonusPerRank: 25
    },
    {
      id: 'fortuna_inicial',
      name: 'Tributo de Oro',
      icon: 'coin',
      desc: 'Inicia cada descenso con +20 de oro por rango.',
      maxRank: 4,
      baseCost: 20,
      costMult: 1.6,
      stat: 'startingGold',
      bonusPerRank: 20
    },
    {
      id: 'recarga_abismal',
      name: 'Foco de Voluntad',
      icon: 'zap',
      desc: '-8% de tiempo de recarga en habilidad especial.',
      maxRank: 3,
      baseCost: 35,
      costMult: 1.8,
      stat: 'specialCooldownMult',
      bonusPerRank: 0.08
    },
    {
      id: 'cosecha_espectral',
      name: 'Resonancia de Esencia',
      icon: 'spark',
      desc: '+15% de esencia ganada al finalizar el descenso.',
      maxRank: 4,
      baseCost: 40,
      costMult: 1.8,
      stat: 'essenceMult',
      bonusPerRank: 0.15
    }
  ];

  // Catálogo de Logros (Datos Puros)
  const LOGROS = [
    {
      id: 'primer_descenso',
      name: 'Primer Descenso',
      icon: 'flag',
      desc: 'Supera el Piso 1 y desciende al siguiente nivel.',
      condition: (stats) => (stats.maxFloorReached || 1) >= 2
    },
    {
      id: 'cazador_sombras',
      name: 'Cazador de Sombras',
      icon: 'skull',
      desc: 'Derrota a un total acumulado de 50 enemigos.',
      condition: (stats) => (stats.totalKills || 0) >= 50
    },
    {
      id: 'terror_cripta',
      name: 'Terror de la Cripta',
      icon: 'crown',
      desc: 'Derrota al Señor del Abismo en el Piso 5.',
      condition: (stats) => (stats.bossesKilled || 0) >= 1
    },
    {
      id: 'acumulador_esencia',
      name: 'Acumulador de Esencia',
      icon: 'shard',
      desc: 'Reúne al menos 100 puntos de esencia en total.',
      condition: (stats, meta) => ((meta && meta.totalEssenceEarned) || (stats && stats.totalEssenceEarned) || 0) >= 100
    },
    {
      id: 'trinidad_abisal',
      name: 'Trinidad Abisal',
      icon: 'gem',
      desc: 'Desbloquea a todos los personajes (Hechicera y Centinela).',
      condition: (stats, meta) => meta.unlockedCharacters && meta.unlockedCharacters.includes('hechicera') && meta.unlockedCharacters.includes('centinela')
    },
    {
      id: 'peregrino_legendario',
      name: 'Peregrino Legendario',
      icon: 'star',
      desc: 'Alcanza el Piso 10 en las profundidades astrales.',
      condition: (stats) => (stats.maxFloorReached || 1) >= 10
    },
    {
      id: 'cofres_llenos',
      name: 'Cofres Llenos',
      icon: 'coin',
      desc: 'Acumula 150 de oro en una sola partida.',
      condition: (stats) => (stats.maxGoldRun || 0) >= 150
    }
  ];

  /**
   * Estado por defecto de meta-progresión
   */
  function getDefaultMetaState() {
    return {
      version: CURRENT_STORAGE_VERSION,
      essence: 0,
      totalEssenceEarned: 0,
      unlockedCharacters: ['peregrino'],
      upgrades: {
        vida_inicial: 0,
        fuerza_ancestral: 0,
        pies_del_viento: 0,
        iman_arcano: 0,
        fortuna_inicial: 0,
        recarga_abismal: 0,
        cosecha_espectral: 0
      },
      stats: {
        maxFloorReached: 1,
        totalRuns: 0,
        totalKills: 0,
        bossesKilled: 0,
        maxGoldRun: 0
      },
      achievements: []
    };
  }

  /**
   * Valida un objeto de meta-estado. Retorna true si es válido o reparable.
   */
  function validateMetaState(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
    if (typeof obj.essence !== 'number' || isNaN(obj.essence)) return false;
    if (!Array.isArray(obj.unlockedCharacters)) return false;
    if (!obj.upgrades || typeof obj.upgrades !== 'object') return false;
    if (!obj.stats || typeof obj.stats !== 'object') return false;
    return true;
  }

  /**
   * Migración de versiones previas
   */
  function migrateMetaState(raw) {
    if (!raw || typeof raw !== 'object') return getDefaultMetaState();

    const target = getDefaultMetaState();

    // Versión 0 (datos antiguos sin version o version < 1)
    if (!raw.version || raw.version < 1) {
      if (typeof raw.essence === 'number') target.essence = Math.max(0, raw.essence);
      if (typeof raw.totalEssenceEarned === 'number') target.totalEssenceEarned = Math.max(0, raw.totalEssenceEarned);
      if (Array.isArray(raw.unlockedCharacters)) {
        raw.unlockedCharacters.forEach((c) => {
          if (!target.unlockedCharacters.includes(c)) target.unlockedCharacters.push(c);
        });
      }
      if (raw.upgrades && typeof raw.upgrades === 'object') {
        Object.keys(target.upgrades).forEach((key) => {
          if (typeof raw.upgrades[key] === 'number') target.upgrades[key] = raw.upgrades[key];
        });
      }
      if (raw.stats && typeof raw.stats === 'object') {
        Object.keys(target.stats).forEach((key) => {
          if (typeof raw.stats[key] === 'number') target.stats[key] = raw.stats[key];
        });
      }
      if (Array.isArray(raw.achievements)) {
        target.achievements = raw.achievements.slice();
      }
      target.version = CURRENT_STORAGE_VERSION;
      return target;
    }

    // Version actual: asegurar que todas las claves requeridas existan sin romper campos existentes
    target.essence = Math.max(0, raw.essence || 0);
    target.totalEssenceEarned = Math.max(0, raw.totalEssenceEarned || target.essence);
    if (Array.isArray(raw.unlockedCharacters)) {
      raw.unlockedCharacters.forEach((c) => {
        if (!target.unlockedCharacters.includes(c)) target.unlockedCharacters.push(c);
      });
    }
    if (raw.upgrades && typeof raw.upgrades === 'object') {
      Object.keys(target.upgrades).forEach((key) => {
        if (typeof raw.upgrades[key] === 'number') target.upgrades[key] = raw.upgrades[key];
      });
    }
    if (raw.stats && typeof raw.stats === 'object') {
      Object.keys(target.stats).forEach((key) => {
        if (typeof raw.stats[key] === 'number') target.stats[key] = raw.stats[key];
      });
    }
    if (Array.isArray(raw.achievements)) {
      target.achievements = raw.achievements.slice();
    }
    target.version = CURRENT_STORAGE_VERSION;
    return target;
  }

  /**
   * Administrador de Almacenamiento y Meta-Progresión
   */
  const AbismoStorage = {
    STORAGE_KEY: STORAGE_KEY_V1,
    ACTIVE_RUN_KEY: ACTIVE_RUN_KEY,
    VERSION: CURRENT_STORAGE_VERSION,

    /**
     * Carga el estado de meta-progresión validando y migrando si es necesario
     */
    loadMeta() {
      try {
        if (typeof localStorage === 'undefined') return getDefaultMetaState();
        const json = localStorage.getItem(STORAGE_KEY_V1);
        if (!json) {
          // Intentar revisar si había datos en clave no versionada legacy
          const legacyJson = localStorage.getItem('abismo_save');
          if (legacyJson) {
            const parsed = JSON.parse(legacyJson);
            const migrated = migrateMetaState(parsed);
            this.saveMeta(migrated);
            localStorage.removeItem('abismo_save');
            return migrated;
          }
          return getDefaultMetaState();
        }

        const parsed = JSON.parse(json);
        if (!validateMetaState(parsed)) {
          console.warn('[Abismo] Datos de guardado corruptos o inválidos. Restaurando por defecto.');
          const def = getDefaultMetaState();
          this.saveMeta(def);
          return def;
        }

        if (parsed.version !== CURRENT_STORAGE_VERSION) {
          const migrated = migrateMetaState(parsed);
          this.saveMeta(migrated);
          return migrated;
        }

        return parsed;
      } catch (err) {
        console.warn('[Abismo] Error al leer guardado. Ignorando corrupción:', err);
        return getDefaultMetaState();
      }
    },

    /**
     * Guarda el estado de meta-progresión en localStorage y actualiza ArcadeStorage
     */
    saveMeta(metaState) {
      if (!metaState || typeof metaState !== 'object') return false;
      try {
        metaState.version = CURRENT_STORAGE_VERSION;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_V1, JSON.stringify(metaState));
        }

        // Actualizar récord global en /shared/storage.js si existe
        if (typeof window !== 'undefined' && window.ArcadeStorage && metaState.stats) {
          window.ArcadeStorage.setHighScore('abismo', metaState.stats.maxFloorReached || 1);
        }
        return true;
      } catch (err) {
        console.warn('[Abismo] No se pudo guardar el progreso en localStorage:', err);
        return false;
      }
    },

    /**
     * Borra el progreso permanente con opción de confirmación
     */
    resetProgress(force = false) {
      try {
        if (!force && typeof window !== 'undefined' && window.confirm) {
          const ok = window.confirm('¿Seguro que deseas reiniciar todo el progreso permanente, esencia y desbloqueos del Abismo? Esta acción no se puede deshacer.');
          if (!ok) return false;
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(STORAGE_KEY_V1);
          localStorage.removeItem(ACTIVE_RUN_KEY);
        }
        return true;
      } catch (err) {
        console.warn('[Abismo] Error al reiniciar progreso:', err);
        return false;
      }
    },

    /**
     * Calcula el costo de la siguiente subida de rango para una mejora permanente
     */
    getUpgradeCost(upgradeDef, currentRank) {
      if (!upgradeDef) return 0;
      if (currentRank >= upgradeDef.maxRank) return Infinity;
      return Math.round(upgradeDef.baseCost * Math.pow(upgradeDef.costMult, currentRank));
    },

    /**
     * Intenta comprar un rango de una mejora permanente
     */
    buyUpgrade(metaState, upgradeId) {
      const def = META_UPGRADES.find((u) => u.id === upgradeId);
      if (!def) return { success: false, reason: 'Mejora no encontrada' };

      const currentRank = metaState.upgrades[upgradeId] || 0;
      if (currentRank >= def.maxRank) {
        return { success: false, reason: 'Mejora ya está al nivel máximo' };
      }

      const cost = this.getUpgradeCost(def, currentRank);
      if (metaState.essence < cost) {
        return { success: false, reason: 'Esencia insuficiente' };
      }

      metaState.essence -= cost;
      metaState.upgrades[upgradeId] = currentRank + 1;
      this.saveMeta(metaState);
      return { success: true, newRank: currentRank + 1, remainingEssence: metaState.essence };
    },

    /**
     * Intenta desbloquear un personaje con esencia
     */
    unlockCharacter(metaState, charId, cost) {
      if (!metaState.unlockedCharacters) metaState.unlockedCharacters = ['peregrino'];
      if (metaState.unlockedCharacters.includes(charId)) {
        return { success: false, reason: 'Personaje ya desbloqueado' };
      }
      if (metaState.essence < cost) {
        return { success: false, reason: 'Esencia insuficiente' };
      }

      metaState.essence -= cost;
      metaState.unlockedCharacters.push(charId);
      this.checkAchievements(metaState);
      this.saveMeta(metaState);
      return { success: true, remainingEssence: metaState.essence };
    },

    /**
     * Aplica las mejoras permanentes a un explorador
     */
    applyMetaBonusesToPlayer(player, metaState) {
      if (!player || !metaState || !metaState.upgrades) return;

      const up = metaState.upgrades;

      // 1. Vitalidad base
      const hpBonus = (up.vida_inicial || 0) * 15;
      player.maxHp = (player.baseMaxHp || player.maxHp) + hpBonus;
      player.hp = Math.min(player.maxHp, player.hp + hpBonus);

      // 2. Daño general
      const dmgBonus = (up.fuerza_ancestral || 0) * 0.08;
      player.damageMult = (player.baseDamageMult || 1.0) * (1.0 + dmgBonus);

      // 3. Velocidad
      const spdBonus = (up.pies_del_viento || 0) * 10;
      player.speed = (player.baseSpeed || player.speed) + spdBonus;

      // 4. Imán de botín
      const magBonus = (up.iman_arcano || 0) * 25;
      player.pickupRadius = (player.basePickupRadius || 90) + magBonus;

      // 5. Oro inicial
      const goldBonus = (up.fortuna_inicial || 0) * 20;
      player.gold = (player.gold || 0) + goldBonus;

      // 6. Recarga especial
      const cdReduction = (up.recarga_abismal || 0) * 0.08;
      player.specialCooldown = Math.max(2.5, (player.baseSpecialCooldown || 7.0) * (1.0 - cdReduction));
    },

    /**
     * Evalúa y desbloquea logros que cumplan sus condiciones
     */
    checkAchievements(metaState) {
      if (!metaState || !metaState.stats) return [];
      if (!Array.isArray(metaState.achievements)) metaState.achievements = [];

      const newlyUnlocked = [];
      LOGROS.forEach((logro) => {
        if (!metaState.achievements.includes(logro.id)) {
          if (logro.condition(metaState.stats, metaState)) {
            metaState.achievements.push(logro.id);
            newlyUnlocked.push(logro);
          }
        }
      });

      if (newlyUnlocked.length > 0) {
        this.saveMeta(metaState);
      }
      return newlyUnlocked;
    },

    /**
     * Calcula la ganancia de esencia al finalizar una partida
     */
    calculateRunEssence(floorReached, killsCount, metaState) {
      const essenceMultiplier = 1.0 + ((metaState && metaState.upgrades && metaState.upgrades.cosecha_espectral) || 0) * 0.15;
      const floorBonus = Math.max(0, floorReached - 1) * 20;
      const killBonus = Math.floor(killsCount * 1.5);
      const total = Math.max(5, Math.round((floorBonus + killBonus) * essenceMultiplier));
      return total;
    },

    /**
     * Registra el final de una partida en las estadísticas del meta
     */
    recordRunEnd(metaState, floorReached, killsCount, goldEarned, bossesCount = 0) {
      if (!metaState.stats) {
        metaState.stats = { maxFloorReached: 1, totalRuns: 0, totalKills: 0, bossesKilled: 0, maxGoldRun: 0 };
      }

      metaState.stats.totalRuns = (metaState.stats.totalRuns || 0) + 1;
      metaState.stats.totalKills = (metaState.stats.totalKills || 0) + killsCount;
      metaState.stats.bossesKilled = (metaState.stats.bossesKilled || 0) + bossesCount;
      metaState.stats.maxFloorReached = Math.max(metaState.stats.maxFloorReached || 1, floorReached);
      metaState.stats.maxGoldRun = Math.max(metaState.stats.maxGoldRun || 0, goldEarned);

      const essenceEarned = this.calculateRunEssence(floorReached, killsCount, metaState);
      metaState.essence += essenceEarned;
      metaState.totalEssenceEarned = (metaState.totalEssenceEarned || 0) + essenceEarned;
      metaState.stats.totalEssenceEarned = metaState.totalEssenceEarned;

      const newAchievements = this.checkAchievements(metaState);
      this.saveMeta(metaState);

      // Si la partida terminó (muerte o victoria), eliminar partida guardada en curso
      this.clearActiveRun();

      return { essenceEarned, newAchievements };
    },

    /**
     * Guarda la partida en curso (Autosave en segundo plano)
     */
    saveActiveRun(gameState) {
      if (!gameState || gameState.state !== 'PLAYING') return false;
      try {
        const runData = {
          version: CURRENT_STORAGE_VERSION,
          timestamp: Date.now(),
          floor: gameState.floor,
          selectedCharacter: gameState.selectedCharacter,
          killCount: gameState.killCount,
          score: gameState.score,
          gameTime: gameState.gameTime,
          player: {
            hp: gameState.player.hp,
            maxHp: gameState.player.maxHp,
            currentXp: gameState.player.currentXp,
            level: gameState.player.level,
            xpToNextLevel: gameState.player.xpToNextLevel,
            gold: gameState.player.gold,
            damageMult: gameState.player.damageMult,
            attackRateMult: gameState.player.attackRateMult,
            bulletSpeedMult: gameState.player.bulletSpeedMult,
            projectileCount: gameState.player.projectileCount,
            pierce: gameState.player.pierce,
            bounce: gameState.player.bounce,
            areaMult: gameState.player.areaMult,
            speed: gameState.player.speed,
            pickupRadius: gameState.player.pickupRadius,
            specialCooldown: gameState.player.specialCooldown,
            critChance: gameState.player.critChance,
            critMult: gameState.player.critMult,
            vampirismChance: gameState.player.vampirismChance,
            vampirismAmount: gameState.player.vampirismAmount,
            shieldCooldown: gameState.player.shieldCooldown,
            appliedUpgrades: gameState.player.appliedUpgrades || {},
            activeSynergies: Array.from(gameState.player.activeSynergies || [])
          },
          currentRoomCoords: gameState.currentRoom ? { gx: gameState.currentRoom.gx, gy: gameState.currentRoom.gy } : null
        };

        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(ACTIVE_RUN_KEY, JSON.stringify(runData));
        }
        return true;
      } catch (err) {
        console.warn('[Abismo] Error al guardar partida en curso:', err);
        return false;
      }
    },

    /**
     * Carga y valida la partida en curso guardada
     */
    loadActiveRun() {
      try {
        if (typeof localStorage === 'undefined') return null;
        const json = localStorage.getItem(ACTIVE_RUN_KEY);
        if (!json) return null;

        const data = JSON.parse(json);
        if (!data || typeof data !== 'object' || !data.player || typeof data.floor !== 'number') {
          this.clearActiveRun();
          return null;
        }

        // Si la partida tiene más de 7 días, descartar por obsolescencia
        if (Date.now() - (data.timestamp || 0) > 7 * 24 * 3600 * 1000) {
          this.clearActiveRun();
          return null;
        }

        return data;
      } catch (err) {
        console.warn('[Abismo] Error al leer partida en curso guardada:', err);
        this.clearActiveRun();
        return null;
      }
    },

    /**
     * Elimina la partida en curso
     */
    clearActiveRun() {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(ACTIVE_RUN_KEY);
        }
      } catch (e) {}
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      META_UPGRADES,
      LOGROS,
      getDefaultMetaState,
      validateMetaState,
      migrateMetaState,
      AbismoStorage
    };
  }

  if (typeof window !== 'undefined') {
    window.ABISMO_META = {
      META_UPGRADES,
      LOGROS,
      getDefaultMetaState,
      validateMetaState,
      migrateMetaState,
      AbismoStorage
    };
  }
})();
