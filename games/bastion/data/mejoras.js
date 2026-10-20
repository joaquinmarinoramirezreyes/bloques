/**
 * games/bastion/data/mejoras.js - Árbol de Metaprogreso Permanente de Bastión (Fase 3)
 * Mejoras pasivas compradas con Esquirlas del Vacío (shards) que persisten entre partidas.
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'bastion:meta:v1';

  const MEJORAS_METAPROGRESO = {
    reserva_inicial: {
      id: 'reserva_inicial',
      name: 'Reserva Cuántica',
      icon: 'coin',
      desc: '+25 de oro inicial por cada rango.',
      maxLevel: 5,
      costs: [5, 10, 20, 35, 55],
      effectPerLevel: 25,
      unit: ' Oro'
    },
    baluarte_nucleo: {
      id: 'baluarte_nucleo',
      name: 'Baluarte del Núcleo',
      icon: 'heart',
      desc: '+2 vidas máximas para el santuario por cada rango.',
      maxLevel: 5,
      costs: [4, 8, 16, 28, 45],
      effectPerLevel: 2,
      unit: ' Vidas'
    },
    ingenieria_arcana: {
      id: 'ingenieria_arcana',
      name: 'Ingeniería Eficiente',
      icon: 'gear',
      desc: '-4% en el coste de construcción de torres por rango.',
      maxLevel: 5,
      costs: [6, 12, 24, 40, 65],
      effectPerLevel: 0.04,
      unit: '% Descuento'
    },
    amplificador_plasma: {
      id: 'amplificador_plasma',
      name: 'Potencia de Plasma',
      icon: 'fire',
      desc: '+5% de daño global para todas las torres por rango.',
      maxLevel: 5,
      costs: [8, 16, 30, 50, 80],
      effectPerLevel: 0.05,
      unit: '% Daño'
    },
    sobremarcha_cinetica: {
      id: 'sobremarcha_cinetica',
      name: 'Cadencia Sobrecargada',
      icon: 'speed',
      desc: '+4% en velocidad de disparo para todas las torres por rango.',
      maxLevel: 5,
      costs: [7, 14, 28, 45, 70],
      effectPerLevel: 0.04,
      unit: '% Cadencia'
    },
    recuperacion_tactica: {
      id: 'recuperacion_tactica',
      name: 'Desguace Táctico',
      icon: 'recycle',
      desc: '+4% de reembolso al vender torres por rango (base 70%).',
      maxLevel: 5,
      costs: [4, 8, 15, 25, 40],
      effectPerLevel: 0.04,
      unit: '% Reembolso'
    }
  };

  class MetaManager {
    constructor() {
      this.shards = 0;
      this.upgrades = {
        reserva_inicial: 0,
        baluarte_nucleo: 0,
        ingenieria_arcana: 0,
        amplificador_plasma: 0,
        sobremarcha_cinetica: 0,
        recuperacion_tactica: 0
      };
      this.stats = {
        gamesPlayed: 0,
        gamesWon: 0,
        totalKills: 0,
        totalDamageDealt: 0,
        totalShardsEarned: 0
      };
      this.load();
    }

    load() {
      try {
        if (typeof window !== 'undefined' && window.ArcadeStorage && typeof window.ArcadeStorage.getJSON === 'function') {
          const data = window.ArcadeStorage.getJSON(STORAGE_KEY, null);
          if (data) {
            this.shards = data.shards || 0;
            if (data.upgrades) Object.assign(this.upgrades, data.upgrades);
            if (data.stats) Object.assign(this.stats, data.stats);
            return;
          }
        } else if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const data = JSON.parse(raw);
            this.shards = data.shards || 0;
            if (data.upgrades) Object.assign(this.upgrades, data.upgrades);
            if (data.stats) Object.assign(this.stats, data.stats);
            return;
          }
        }
      } catch (e) {
        console.warn('Bastion MetaManager load fallback:', e);
      }
    }

    save() {
      try {
        const payload = {
          shards: this.shards,
          upgrades: this.upgrades,
          stats: this.stats,
          savedAt: Date.now()
        };
        if (typeof window !== 'undefined' && window.ArcadeStorage && typeof window.ArcadeStorage.setJSON === 'function') {
          window.ArcadeStorage.setJSON(STORAGE_KEY, payload);
        } else if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        }
      } catch (e) {
        console.warn('Bastion MetaManager save fallback:', e);
      }
    }

    getUpgradeLevel(key) {
      return this.upgrades[key] || 0;
    }

    canUpgrade(key) {
      const def = MEJORAS_METAPROGRESO[key];
      if (!def) return false;
      const curLvl = this.getUpgradeLevel(key);
      if (curLvl >= def.maxLevel) return false;
      const cost = def.costs[curLvl];
      return this.shards >= cost;
    }

    buyUpgrade(key) {
      if (!this.canUpgrade(key)) return false;
      const def = MEJORAS_METAPROGRESO[key];
      const curLvl = this.getUpgradeLevel(key);
      const cost = def.costs[curLvl];
      this.shards -= cost;
      this.upgrades[key] = curLvl + 1;
      this.save();
      return true;
    }

    addShards(amount) {
      if (amount <= 0) return;
      this.shards += amount;
      this.stats.totalShardsEarned = (this.stats.totalShardsEarned || 0) + amount;
      this.save();
    }

    getInitialBonusGold() {
      return (this.upgrades.reserva_inicial || 0) * 25;
    }

    getInitialBonusLives() {
      return (this.upgrades.baluarte_nucleo || 0) * 2;
    }

    getTowerCostDiscount() {
      return (this.upgrades.ingenieria_arcana || 0) * 0.04;
    }

    getGlobalDamageMultiplier() {
      return 1.0 + (this.upgrades.amplificador_plasma || 0) * 0.05;
    }

    getGlobalFireRateMultiplier() {
      return 1.0 + (this.upgrades.sobremarcha_cinetica || 0) * 0.04;
    }

    getSellRefundRate() {
      return 0.70 + (this.upgrades.recuperacion_tactica || 0) * 0.04;
    }

    reset() {
      this.shards = 0;
      this.upgrades = {
        reserva_inicial: 0,
        baluarte_nucleo: 0,
        ingenieria_arcana: 0,
        amplificador_plasma: 0,
        sobremarcha_cinetica: 0,
        recuperacion_tactica: 0
      };
      this.stats = {
        gamesPlayed: 0,
        gamesWon: 0,
        totalKills: 0,
        totalDamageDealt: 0,
        totalShardsEarned: 0
      };
      this.save();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MEJORAS_METAPROGRESO, MetaManager };
  } else {
    window.BASTION_MEJORAS = MEJORAS_METAPROGRESO;
    window.BastionMeta = new MetaManager();
  }
})();
