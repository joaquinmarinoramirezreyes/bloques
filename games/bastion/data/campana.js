/**
 * games/bastion/data/campana.js - Gestión de Campaña, Desbloqueo de Mapas y Estrellas (Fase 4)
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'bastion:campaign:v1';

  class CampaignManager {
    constructor() {
      this.storageKey = STORAGE_KEY;
      this.data = this.load();
    }

    load() {
      try {
        if (typeof window !== 'undefined' && window.ArcadeStorage && typeof window.ArcadeStorage.get === 'function') {
          const raw = window.ArcadeStorage.get(this.storageKey, null);
          if (raw) {
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (parsed && parsed.unlockedMaps) {
              return parsed;
            }
          }
        } else if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem(this.storageKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.unlockedMaps) {
              return parsed;
            }
          }
        }
      } catch (e) {
        console.warn('Error loading Bastion campaign storage:', e);
      }
      return {
        unlockedMaps: [0], // Sector 1 desbloqueado por defecto
        stars: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        bestScores: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        difficulties: { 0: 'normal', 1: 'normal', 2: 'normal', 3: 'normal', 4: 'normal', 5: 'normal' }
      };
    }

    save() {
      try {
        if (typeof window !== 'undefined' && window.ArcadeStorage && typeof window.ArcadeStorage.set === 'function') {
          window.ArcadeStorage.set(this.storageKey, this.data);
        } else if (typeof localStorage !== 'undefined') {
          localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        }
      } catch (e) {
        console.warn('Error saving Bastion campaign storage:', e);
      }
    }

    isMapUnlocked(mapIdx) {
      if (mapIdx === 0) return true;
      if (this.data.unlockedMaps.includes(mapIdx)) return true;
      // Desbloqueado si el mapa previo tiene al menos 1 estrella
      const prevStars = this.data.stars[mapIdx - 1] || 0;
      return prevStars > 0;
    }

    getStars(mapIdx) {
      return this.data.stars[mapIdx] || 0;
    }

    getBestScore(mapIdx) {
      return this.data.bestScores[mapIdx] || 0;
    }

    getDifficulty(mapIdx) {
      return this.data.difficulties[mapIdx] || 'normal';
    }

    recordVictory(mapIdx, livesRemaining, initialLives, score, difficulty = 'normal') {
      let stars = 1;
      if (livesRemaining >= initialLives) {
        stars = 3; // Flawless (sin daño al núcleo)
      } else if (livesRemaining >= Math.ceil(initialLives * 0.5)) {
        stars = 2; // Victoria sólida (50%+ vidas)
      }

      // Guardar mejores estrellas
      const prevStars = this.data.stars[mapIdx] || 0;
      if (stars > prevStars) {
        this.data.stars[mapIdx] = stars;
      }

      // Guardar mejor puntuación
      const prevScore = this.data.bestScores[mapIdx] || 0;
      if (score > prevScore) {
        this.data.bestScores[mapIdx] = score;
      }

      this.data.difficulties[mapIdx] = difficulty;

      // Desbloquear el siguiente mapa si existe
      const nextMap = mapIdx + 1;
      if (nextMap < 6 && !this.data.unlockedMaps.includes(nextMap)) {
        this.data.unlockedMaps.push(nextMap);
      }

      this.save();
      return {
        stars,
        unlockedNext: nextMap < 6,
        nextMapIndex: nextMap < 6 ? nextMap : null
      };
    }

    resetProgress() {
      this.data = {
        unlockedMaps: [0],
        stars: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        bestScores: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        difficulties: { 0: 'normal', 1: 'normal', 2: 'normal', 3: 'normal', 4: 'normal', 5: 'normal' }
      };
      this.save();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CampaignManager, STORAGE_KEY };
  } else {
    window.BastionCampaign = new CampaignManager();
    window.CampaignManager = CampaignManager;
  }
})();
