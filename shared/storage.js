/**
 * SHARED STORAGE - Gestión de récords con localStorage namespaced y try/catch seguro
 */
(() => {
  'use strict';

  const PREFIX = 'arcade_record_';

  const ArcadeStorage = {
    /**
     * Obtiene el récord histórico de un juego dado su identificador
     * @param {string} gameId - Identificador único del juego (ej: 'bloques', 'snake')
     * @returns {number} Puntuación más alta
     */
    getHighScore(gameId) {
      if (!gameId) return 0;
      try {
        const key = PREFIX + gameId;
        const val = localStorage.getItem(key);
        if (val !== null) {
          return parseInt(val, 10) || 0;
        }

        // Compatibilidad retroactiva con claves previas de Bloques
        if (gameId === 'bloques') {
          const oldVal = localStorage.getItem('bloques_arcade_highscore') || localStorage.getItem('bloques_record');
          if (oldVal !== null) {
            const num = parseInt(oldVal, 10) || 0;
            this.setHighScore('bloques', num);
            return num;
          }
        }
        return 0;
      } catch (err) {
        console.warn('Almacenamiento local restringido o no disponible:', err);
        return 0;
      }
    },

    /**
     * Guarda un nuevo récord para un juego
     * @param {string} gameId - Identificador único del juego
     * @param {number} score - Puntuación alcanzada
     * @returns {boolean} Si se guardó exitosamente
     */
    setHighScore(gameId, score) {
      if (!gameId || typeof score !== 'number') return false;
      try {
        const current = this.getHighScore(gameId);
        if (score >= current) {
          localStorage.setItem(PREFIX + gameId, String(score));
          return true;
        }
        return false;
      } catch (err) {
        console.warn('No se pudo guardar el récord en localStorage:', err);
        return false;
      }
    }
  };

  window.ArcadeStorage = ArcadeStorage;
})();
