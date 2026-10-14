/**
 * DATOS DE MEJORAS Y SINERGIAS - ABISMO (FASE 3)
 * Catálogo exhaustivo de mejoras estructuradas como datos puros,
 * rarezas, efectos porcentuales, requisitos de sinergia y gestor de selección.
 */
(() => {
  'use strict';

  const RAREZAS = {
    comun: { id: 'comun', name: 'Común', color: '#94a3b8', weight: 60, border: 'rgba(148, 163, 184, 0.4)' },
    rara: { id: 'rara', name: 'Rara', color: '#38bdf8', weight: 25, border: 'rgba(56, 189, 248, 0.6)' },
    epica: { id: 'epica', name: 'Épica', color: '#a855f7', weight: 12, border: 'rgba(168, 85, 247, 0.75)' },
    legendaria: { id: 'legendaria', name: 'Legendaria', color: '#f59e0b', weight: 3, border: 'rgba(245, 158, 11, 0.9)' },
    sinergia: { id: 'sinergia', name: 'Sinergia', color: '#ec4899', weight: 8, border: 'rgba(236, 72, 153, 0.95)' }
  };

  const MEJORAS = [
    {
      id: 'fuerza_arcana',
      name: 'Fuerza Arcana',
      description: '+20% de daño a todos los proyectiles y habilidades.',
      rarity: 'comun',
      icon: '⚔️',
      category: 'ataque',
      maxLevel: 5,
      synergyTag: 'damage',
      effects: { damageMult: 0.20 }
    },
    {
      id: 'pulso_frenetico',
      name: 'Pulso Frenético',
      description: '+18% de cadencia de fuego (dispara más rápido).',
      rarity: 'comun',
      icon: '⚡',
      category: 'ataque',
      maxLevel: 5,
      synergyTag: 'attackRate',
      effects: { attackRateMult: 0.18 }
    },
    {
      id: 'dardo_penetrante',
      name: 'Dardo Penetrante',
      description: 'Los proyectiles atraviesan +1 enemigo adicional.',
      rarity: 'rara',
      icon: '🏹',
      category: 'ataque',
      maxLevel: 3,
      synergyTag: 'pierce',
      effects: { pierce: 1 }
    },
    {
      id: 'rebote_espectral',
      name: 'Rebote Espectral',
      description: 'Los proyectiles rebotan hacia +1 enemigo cercano al impactar.',
      rarity: 'rara',
      icon: '🔄',
      category: 'ataque',
      maxLevel: 3,
      synergyTag: 'bounce',
      effects: { bounce: 1 }
    },
    {
      id: 'salva_doble',
      name: 'Salva Múltiple',
      description: '+1 proyectil adicional disparado en abanico.',
      rarity: 'epica',
      icon: '✨',
      category: 'ataque',
      maxLevel: 3,
      synergyTag: 'projectiles',
      effects: { extraProjectiles: 1 }
    },
    {
      id: 'sed_del_vacio',
      name: 'Sed del Vacío',
      description: '6% de probabilidad de recuperar 4 HP al derrotar a un enemigo.',
      rarity: 'epica',
      icon: '🩸',
      category: 'defensa',
      maxLevel: 4,
      synergyTag: 'vampirism',
      effects: { vampirismChance: 0.06, vampirismHeal: 4 }
    },
    {
      id: 'zancada_espectral',
      name: 'Zancada Espectral',
      description: '+14% de velocidad de movimiento del explorador.',
      rarity: 'comun',
      icon: '👟',
      category: 'utilidad',
      maxLevel: 4,
      synergyTag: 'speed',
      effects: { speedMult: 0.14 }
    },
    {
      id: 'atraccion_runica',
      name: 'Atracción Rúnica',
      description: '+40% de radio de atracción magnética de experiencia y oro.',
      rarity: 'comun',
      icon: '🧲',
      category: 'utilidad',
      maxLevel: 4,
      synergyTag: 'pickup',
      effects: { pickupRadiusMult: 0.40 }
    },
    {
      id: 'armadura_umbra',
      name: 'Armadura Umbra',
      description: '+25 HP máximo y restaura 20 HP de inmediato.',
      rarity: 'comun',
      icon: '🛡️',
      category: 'defensa',
      maxLevel: 4,
      synergyTag: 'health',
      effects: { maxHp: 25, healInstant: 20 }
    },
    {
      id: 'expansion_espectral',
      name: 'Expansión Espectral',
      description: '+25% de tamaño de proyectiles y radio de estallido.',
      rarity: 'rara',
      icon: '🔮',
      category: 'ataque',
      maxLevel: 3,
      synergyTag: 'area',
      effects: { areaMult: 0.25 }
    },
    {
      id: 'critico_ancestral',
      name: 'Crítico Ancestral',
      description: '+14% de probabilidad de asestar impactos críticos (200% de daño).',
      rarity: 'rara',
      icon: '💥',
      category: 'ataque',
      maxLevel: 4,
      synergyTag: 'crit',
      effects: { critChance: 0.14 }
    },
    {
      id: 'eco_etereo',
      name: 'Eco Etéreo',
      description: '-16% de tiempo de recarga de la habilidad especial (Estallido).',
      rarity: 'rara',
      icon: '⏳',
      category: 'utilidad',
      maxLevel: 3,
      synergyTag: 'cooldown',
      effects: { specialCooldownMult: -0.16 }
    },
    {
      id: 'codicia_abisal',
      name: 'Codicia Abisal',
      description: '+35% de oro obtenido de las criaturas de la cripta.',
      rarity: 'comun',
      icon: '🪙',
      category: 'utilidad',
      maxLevel: 3,
      synergyTag: 'gold',
      effects: { goldMult: 0.35 }
    },
    {
      id: 'escudo_espectral',
      name: 'Velo Espectral',
      description: 'Genera un velo protector que anula 1 impacto cada 16 segundos.',
      rarity: 'epica',
      icon: '💠',
      category: 'defensa',
      maxLevel: 2,
      synergyTag: 'barrier',
      effects: { barrierInterval: 16 }
    }
  ];

  // Sinergias especiales (Fase 3)
  // Se desbloquean al poseer combinaciones de mejoras requeridas
  const SINERGIAS = [
    {
      id: 'sinergia_rebote_perforacion',
      name: 'Fragmentación Resonante',
      description: 'Los proyectiles que perforan a un enemigo liberan 2 esquirlas rebotantes.',
      rarity: 'sinergia',
      icon: '🌀',
      requiredUpgrades: ['dardo_penetrante', 'rebote_espectral'],
      maxLevel: 1,
      effects: {
        synergyShardOnPierce: true,
        damageMult: 0.15
      }
    },
    {
      id: 'sinergia_salva_expansion',
      name: 'Bombardeo Abisal',
      description: 'La salva se dispara en cono destructor y crea micro-explosiones al chocar.',
      rarity: 'sinergia',
      icon: '☄️',
      requiredUpgrades: ['salva_doble', 'expansion_espectral'],
      maxLevel: 1,
      effects: {
        synergyExplosiveImpact: true,
        damageMult: 0.20
      }
    },
    {
      id: 'sinergia_cadencia_critico',
      name: 'Tempestad Fulgurante',
      description: 'Cada impacto crítico descarga un rayo encadenado a un enemigo cercano.',
      rarity: 'sinergia',
      icon: '🌩️',
      requiredUpgrades: ['pulso_frenetico', 'critico_ancestral'],
      maxLevel: 1,
      effects: {
        synergyChainLightning: true,
        critChance: 0.08
      }
    },
    {
      id: 'sinergia_vampirismo_fuerza',
      name: 'Cosecha de Almas',
      description: 'Derrotar enemigos otorga +25% de daño temporal y regenera 1 HP garantizado.',
      rarity: 'sinergia',
      icon: '☠️',
      requiredUpgrades: ['sed_del_vacio', 'fuerza_arcana'],
      maxLevel: 1,
      effects: {
        synergySoulHarvest: true,
        vampirismHeal: 2
      }
    }
  ];

  // Gestor y Lógica de Selección de Mejoras
  class UpgradeManager {
    /**
     * Obtiene la lista de mejoras disponibles para el jugador (respetando niveles máximos y sinergias)
     */
    static getAvailablePool(player) {
      const active = (player && player.activeUpgrades) ? player.activeUpgrades : {};
      const pool = [];

      // 1. Mejoras regulares
      for (let i = 0; i < MEJORAS.length; i++) {
        const up = MEJORAS[i];
        const currentLvl = active[up.id] || 0;
        if (currentLvl < up.maxLevel) {
          pool.push(Object.assign({}, up, {
            currentLevel: currentLvl,
            nextLevel: currentLvl + 1,
            isSynergy: false
          }));
        }
      }

      // 2. Sinergias (solo si cumple los requisitos y aún no está adquirida)
      for (let i = 0; i < SINERGIAS.length; i++) {
        const syn = SINERGIAS[i];
        const currentLvl = active[syn.id] || 0;
        if (currentLvl < syn.maxLevel) {
          const reqsMet = syn.requiredUpgrades.every(reqId => (active[reqId] || 0) >= 1);
          if (reqsMet) {
            pool.push(Object.assign({}, syn, {
              currentLevel: currentLvl,
              nextLevel: 1,
              isSynergy: true
            }));
          }
        }
      }

      return pool;
    }

    /**
     * Devuelve una selección de 'count' mejoras aleatorias únicas ponderadas por rareza
     */
    static getRandomSelection(player, count = 3) {
      const pool = this.getAvailablePool(player);
      if (pool.length === 0) return [];

      const selected = [];
      const tempPool = [...pool];

      // Dar prioridad ligera a sinergias recién desbloqueadas
      const targetCount = Math.min(count, tempPool.length);

      while (selected.length < targetCount && tempPool.length > 0) {
        // Calcular peso total
        let totalWeight = 0;
        for (let i = 0; i < tempPool.length; i++) {
          const r = RAREZAS[tempPool[i].rarity] || RAREZAS.comun;
          totalWeight += r.weight;
        }

        // Selección ponderada
        let rand = Math.random() * totalWeight;
        let chosenIndex = 0;

        for (let i = 0; i < tempPool.length; i++) {
          const r = RAREZAS[tempPool[i].rarity] || RAREZAS.comun;
          if (rand < r.weight) {
            chosenIndex = i;
            break;
          }
          rand -= r.weight;
        }

        // Extraer mejora para no repetir
        const chosen = tempPool.splice(chosenIndex, 1)[0];
        selected.push(chosen);
      }

      return selected;
    }

    /**
     * Aplica los efectos de una mejora seleccionada al jugador
     */
    static applyUpgrade(player, upgradeId) {
      if (!player) return null;
      if (!player.activeUpgrades) player.activeUpgrades = {};

      // Buscar definición en mejoras o sinergias
      let def = MEJORAS.find(m => m.id === upgradeId);
      let isSynergy = false;
      if (!def) {
        def = SINERGIAS.find(s => s.id === upgradeId);
        isSynergy = true;
      }
      if (!def) return null;

      // Incrementar nivel
      const prevLvl = player.activeUpgrades[upgradeId] || 0;
      player.activeUpgrades[upgradeId] = prevLvl + 1;

      // Aplicar estadísticas al jugador
      const eff = def.effects || {};

      if (eff.damageMult) {
        player.damageMult = (player.damageMult || 1.0) + eff.damageMult;
      }
      if (eff.attackRateMult) {
        player.attackCooldown = Math.max(0.12, (player.attackCooldown || 0.38) * (1 - eff.attackRateMult * 0.7));
      }
      if (eff.pierce) {
        player.pierceCount = (player.pierceCount || 0) + eff.pierce;
      }
      if (eff.bounce) {
        player.bounceCount = (player.bounceCount || 0) + eff.bounce;
      }
      if (eff.extraProjectiles) {
        player.extraProjectiles = (player.extraProjectiles || 0) + eff.extraProjectiles;
      }
      if (eff.vampirismChance) {
        player.vampirismChance = (player.vampirismChance || 0) + eff.vampirismChance;
        player.vampirismHeal = Math.max(player.vampirismHeal || 0, eff.vampirismHeal || 4);
      }
      if (eff.speedMult) {
        player.speed = Math.round((player.speed || 185) * (1 + eff.speedMult));
      }
      if (eff.pickupRadiusMult) {
        player.pickupRadius = Math.round((player.pickupRadius || 90) * (1 + eff.pickupRadiusMult));
      }
      if (eff.maxHp) {
        player.maxHp = (player.maxHp || 100) + eff.maxHp;
      }
      if (eff.healInstant) {
        player.hp = Math.min(player.maxHp, (player.hp || 100) + eff.healInstant);
      }
      if (eff.areaMult) {
        player.areaMult = (player.areaMult || 1.0) + eff.areaMult;
      }
      if (eff.critChance) {
        player.critChance = (player.critChance || 0.05) + eff.critChance;
      }
      if (eff.specialCooldownMult) {
        player.specialCooldown = Math.max(2.5, (player.specialCooldown || 7.0) * (1 + eff.specialCooldownMult));
      }
      if (eff.goldMult) {
        player.goldMult = (player.goldMult || 1.0) + eff.goldMult;
      }
      if (eff.barrierInterval) {
        player.hasBarrier = true;
        player.barrierInterval = eff.barrierInterval;
        player.barrierTimer = eff.barrierInterval;
      }

      // Activar flags de sinergias especiales
      if (eff.synergyShardOnPierce) player.synergyShardOnPierce = true;
      if (eff.synergyExplosiveImpact) player.synergyExplosiveImpact = true;
      if (eff.synergyChainLightning) player.synergyChainLightning = true;
      if (eff.synergySoulHarvest) player.synergySoulHarvest = true;

      return {
        id: upgradeId,
        def,
        newLevel: player.activeUpgrades[upgradeId],
        isSynergy
      };
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RAREZAS, MEJORAS, SINERGIAS, UpgradeManager };
  }
  if (typeof window !== 'undefined') {
    window.ABISMO_RAREZAS = RAREZAS;
    window.ABISMO_MEJORAS = MEJORAS;
    window.ABISMO_SINERGIAS = SINERGIAS;
    window.ABISMO_UPGRADE_MGR = UpgradeManager;
  }
})();
