/**
 * SPATIAL HASH GRID - Partición espacial de alto rendimiento
 * Optimizado para 150+ enemigos y 300+ proyectiles sin asignaciones de memoria (GC) por frame.
 */
(() => {
  'use strict';

  class SpatialHash {
    constructor(cellSize = 75) {
      this.cellSize = cellSize;
      this.invCellSize = 1 / cellSize;
      this.buckets = new Map(); // key -> array de entidades
      this.activeKeys = [];     // Registro de celdas utilizadas para limpieza O(K)
      this.queryId = 0;         // Contador para filtrado de duplicados sin crear Sets
    }

    /**
     * Limpia la cuadrícula reutilizando los arrays internos para evitar recolección de basura
     */
    clear() {
      for (let i = 0; i < this.activeKeys.length; i++) {
        const bucket = this.buckets.get(this.activeKeys[i]);
        if (bucket) {
          bucket.length = 0;
        }
      }
      this.activeKeys.length = 0;
      this.queryId++;
      if (this.queryId > 2000000000) {
        this.queryId = 1;
      }
    }

    /**
     * Inserta una entidad circular en todas las celdas que cubre su caja envolvente
     * @param {Object} entity - Objeto con { x, y, radius }
     */
    insert(entity) {
      if (!entity || !entity.active) return;

      const r = entity.radius || 10;
      const minX = Math.floor((entity.x - r) * this.invCellSize);
      const maxX = Math.floor((entity.x + r) * this.invCellSize);
      const minY = Math.floor((entity.y - r) * this.invCellSize);
      const maxY = Math.floor((entity.y + r) * this.invCellSize);

      for (let cx = minX; cx <= maxX; cx++) {
        for (let cy = minY; cy <= maxY; cy++) {
          const key = (cx << 16) ^ cy; // Clave entera rápida de 32-bit sin concatenar strings
          let bucket = this.buckets.get(key);
          if (!bucket) {
            bucket = [];
            this.buckets.set(key, bucket);
          }
          if (bucket.length === 0) {
            this.activeKeys.push(key);
          }
          bucket.push(entity);
        }
      }
    }

    /**
     * Consulta todas las entidades en el radio especificado
     * @param {number} x - Posición central X
     * @param {number} y - Posición central Y
     * @param {number} radius - Radio de búsqueda
     * @param {Array} outResults - Array opcional para recolectar resultados sin allocs
     * @returns {Array} Entidades encontradas dentro del rango
     */
    queryRange(x, y, radius, outResults = []) {
      outResults.length = 0;
      const curQueryId = ++this.queryId;

      const minX = Math.floor((x - radius) * this.invCellSize);
      const maxX = Math.floor((x + radius) * this.invCellSize);
      const minY = Math.floor((y - radius) * this.invCellSize);
      const maxY = Math.floor((y + radius) * this.invCellSize);

      const radSq = radius * radius;

      for (let cx = minX; cx <= maxX; cx++) {
        for (let cy = minY; cy <= maxY; cy++) {
          const key = (cx << 16) ^ cy;
          const bucket = this.buckets.get(key);
          if (!bucket || bucket.length === 0) continue;

          for (let i = 0; i < bucket.length; i++) {
            const ent = bucket[i];
            if (ent._shQueryId === curQueryId || !ent.active) continue;
            ent._shQueryId = curQueryId;

            const dx = ent.x - x;
            const dy = ent.y - y;
            const entR = ent.radius || 0;
            const maxAllowedDist = radius + entR;

            if (dx * dx + dy * dy <= maxAllowedDist * maxAllowedDist) {
              outResults.push(ent);
            }
          }
        }
      }

      return outResults;
    }

    /**
     * Encuentra la entidad más cercana en el radio dado que cumpla el predicado
     * Ideal para el Auto-Ataque del jugador sin recorrer todos los enemigos del mapa.
     * @param {number} x - Posición X del atacante
     * @param {number} y - Posición Y del atacante
     * @param {number} maxRadius - Rango máximo de ataque
     * @param {Function} filterFn - Filtro opcional (entidad viva, tipo, etc.)
     * @returns {Object|null} { entity, dist, distSq }
     */
    getNearest(x, y, maxRadius, filterFn = null) {
      const curQueryId = ++this.queryId;
      const minX = Math.floor((x - maxRadius) * this.invCellSize);
      const maxX = Math.floor((x + maxRadius) * this.invCellSize);
      const minY = Math.floor((y - maxRadius) * this.invCellSize);
      const maxY = Math.floor((y + maxRadius) * this.invCellSize);

      let closestEntity = null;
      let minDistSq = maxRadius * maxRadius;

      for (let cx = minX; cx <= maxX; cx++) {
        for (let cy = minY; cy <= maxY; cy++) {
          const key = (cx << 16) ^ cy;
          const bucket = this.buckets.get(key);
          if (!bucket || bucket.length === 0) continue;

          for (let i = 0; i < bucket.length; i++) {
            const ent = bucket[i];
            if (ent._shQueryId === curQueryId || !ent.active) continue;
            ent._shQueryId = curQueryId;

            if (filterFn && !filterFn(ent)) continue;

            const dx = ent.x - x;
            const dy = ent.y - y;
            const dSq = dx * dx + dy * dy;

            if (dSq < minDistSq) {
              minDistSq = dSq;
              closestEntity = ent;
            }
          }
        }
      }

      if (!closestEntity) return null;

      return {
        entity: closestEntity,
        distSq: minDistSq,
        dist: Math.sqrt(minDistSq)
      };
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpatialHash;
  }
  if (typeof window !== 'undefined') {
    window.SpatialHash = SpatialHash;
  }
})();
