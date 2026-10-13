/**
 * SHARED CANVAS - Escalado de alta resolución (devicePixelRatio) y ajuste de proporción
 */
(() => {
  'use strict';

  const ArcadeCanvas = {
    /**
     * Ajusta el tamaño de un canvas para llenar su contenedor manteniendo una proporción fija
     * @param {HTMLCanvasElement} canvas - Elemento canvas a redimensionar
     * @param {HTMLElement} container - Contenedor padre
     * @param {number} aspectWidth - Proporción horizontal (ej: 10 para 10x20, o 1 para cuadrado)
     * @param {number} aspectHeight - Proporción vertical (ej: 20 para 10x20, o 1 para cuadrado)
     * @param {number} padding - Margen de seguridad interno en píxeles
     * @returns {{width: number, height: number, dpr: number, cellSize: number}}
     */
    fit(canvas, container, aspectWidth = 1, aspectHeight = 2, padding = 4) {
      if (!canvas || !container) return { width: 300, height: 600, dpr: 1, cellSize: 30 };

      const rect = container.getBoundingClientRect();
      const availW = Math.max(50, rect.width - padding);
      const availH = Math.max(100, rect.height - padding);
      const ratio = aspectWidth / aspectHeight;

      let targetW = availW;
      let targetH = targetW / ratio;

      if (targetH > availH) {
        targetH = availH;
        targetW = targetH * ratio;
      }

      targetW = Math.floor(targetW);
      targetH = Math.floor(targetH);

      const dpr = window.devicePixelRatio || 1;

      // Tamaño CSS
      canvas.style.width = `${targetW}px`;
      canvas.style.height = `${targetH}px`;

      // Resolución interna nítida para pantallas Retina/OLED
      canvas.width = Math.round(targetW * dpr);
      canvas.height = Math.round(targetH * dpr);

      const ctx = canvas.getContext('2d');
      ctx.resetTransform();
      ctx.scale(dpr, dpr);

      return {
        width: targetW,
        height: targetH,
        dpr: dpr,
        cellSize: targetW / aspectWidth
      };
    },

    /**
     * Activa vibración táctil si el navegador lo soporta
     * @param {number} ms - Milisegundos de vibración
     */
    haptic(ms = 12) {
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(ms);
        } catch (e) {
          // Ignorado si el navegador bloquea la llamada
        }
      }
    }
  };

  window.ArcadeCanvas = ArcadeCanvas;
})();
