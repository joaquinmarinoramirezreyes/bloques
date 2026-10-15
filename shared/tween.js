/**
 * shared/tween.js - Motor de Animación e Interpolación con Object Pooling
 * Proporciona easing estándar, delays, encadenamiento, y cero recolección de basura (GC).
 * Compatible con navegador (window.ArcadeTween) y Node.js (module.exports).
 */
(() => {
  'use strict';

  // Colección de funciones de easing matemáticas puras
  const Easing = {
    linear: t => t,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: t => t * t * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeInSine: t => 1 - Math.cos((t * Math.PI) / 2),
    easeOutSine: t => Math.sin((t * Math.PI) / 2),
    easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
    easeOutBack: (t, s = 1.70158) => {
      const p = t - 1;
      return p * p * ((s + 1) * p + s) + 1;
    },
    easeInBack: (t, s = 1.70158) => t * t * ((s + 1) * t - s),
    easeOutElastic: (t) => {
      if (t === 0 || t === 1) return t;
      const p = 0.3;
      return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
    },
    easeOutBounce: (t) => {
      const n1 = 7.5625;
      const d1 = 2.75;
      if (t < 1 / d1) {
        return n1 * t * t;
      } else if (t < 2 / d1) {
        return n1 * (t -= 1.5 / d1) * t + 0.75;
      } else if (t < 2.5 / d1) {
        return n1 * (t -= 2.25 / d1) * t + 0.9375;
      } else {
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
      }
    }
  };

  // Pool de instancias pre-asignadas para evitar instanciación por frame
  const MAX_TWEENS = 300;
  const tweenPool = [];

  for (let i = 0; i < MAX_TWEENS; i++) {
    tweenPool.push({
      active: false,
      target: null,
      duration: 0,
      elapsed: 0,
      delay: 0,
      delayElapsed: 0,
      easingFn: Easing.linear,
      keys: [],
      startValues: [],
      endValues: [],
      onUpdate: null,
      onComplete: null
    });
  }

  const ArcadeTween = {
    Easing,
    activeCount: 0,

    /**
     * Interpola propiedades numéricas de un objeto hacia los valores finales
     * @param {Object} target - Objeto cuyas propiedades se modificarán
     * @param {number} duration - Duración en segundos
     * @param {Object} toProps - Diccionario { prop: targetValue }
     * @param {Object} options - { easing, delay, onUpdate, onComplete }
     * @returns {Object|null} El slot de tween asignado o null si el pool está agotado
     */
    to(target, duration, toProps, options = {}) {
      if (!target || duration <= 0) {
        if (target && toProps) {
          for (const k of Object.keys(toProps)) {
            target[k] = toProps[k];
          }
        }
        if (options.onComplete) options.onComplete(target);
        return null;
      }

      // Buscar slot inactivo en el pool
      let slot = null;
      for (let i = 0; i < MAX_TWEENS; i++) {
        if (!tweenPool[i].active) {
          slot = tweenPool[i];
          break;
        }
      }

      if (!slot) {
        // Fallback si el pool se satura: aplicar inmediatamente
        for (const k of Object.keys(toProps)) target[k] = toProps[k];
        if (options.onComplete) options.onComplete(target);
        return null;
      }

      slot.active = true;
      slot.target = target;
      slot.duration = Math.max(0.001, duration);
      slot.elapsed = 0;
      slot.delay = Math.max(0, options.delay || 0);
      slot.delayElapsed = 0;

      const easingName = typeof options.easing === 'string' ? options.easing : 'easeOutQuad';
      slot.easingFn = Easing[easingName] || Easing.easeOutQuad;

      slot.keys = [];
      slot.startValues = [];
      slot.endValues = [];

      for (const k of Object.keys(toProps)) {
        if (typeof target[k] === 'number') {
          slot.keys.push(k);
          slot.startValues.push(target[k]);
          slot.endValues.push(toProps[k]);
        }
      }

      slot.onUpdate = options.onUpdate || null;
      slot.onComplete = options.onComplete || null;

      this.activeCount++;
      return slot;
    },

    /**
     * Actualiza todos los tweens activos según el delta time transcurrido
     * @param {number} dt - Delta time en segundos
     */
    update(dt) {
      let activeCounter = 0;

      for (let i = 0; i < MAX_TWEENS; i++) {
        const tw = tweenPool[i];
        if (!tw.active) continue;

        let stepDt = dt;

        // Gestión de retardo previo (delay)
        if (tw.delayElapsed < tw.delay) {
          tw.delayElapsed += dt;
          if (tw.delayElapsed < tw.delay) {
            activeCounter++;
            continue;
          }
          // Consumir el excedente del delay en el primer tick de animación
          stepDt = tw.delayElapsed - tw.delay;
        }

        tw.elapsed += stepDt;
        const progress = Math.min(1, tw.elapsed / tw.duration);
        const eased = tw.easingFn(progress);

        const target = tw.target;
        const numKeys = tw.keys.length;

        for (let k = 0; k < numKeys; k++) {
          const prop = tw.keys[k];
          const start = tw.startValues[k];
          const end = tw.endValues[k];
          target[prop] = start + (end - start) * eased;
        }

        if (tw.onUpdate) {
          tw.onUpdate(progress, target);
        }

        if (progress >= 1) {
          tw.active = false;
          // Garantizar valor final exacto
          for (let k = 0; k < numKeys; k++) {
            target[tw.keys[k]] = tw.endValues[k];
          }
          const cb = tw.onComplete;
          tw.target = null;
          tw.onUpdate = null;
          tw.onComplete = null;
          if (cb) cb(target);
        } else {
          activeCounter++;
        }
      }

      this.activeCount = activeCounter;
    },

    /**
     * Cancela e invalida todos los tweens asociados a un objeto específico
     * @param {Object} target
     */
    killTweensOf(target) {
      if (!target) return;
      for (let i = 0; i < MAX_TWEENS; i++) {
        const tw = tweenPool[i];
        if (tw.active && tw.target === target) {
          tw.active = false;
          tw.target = null;
          tw.onUpdate = null;
          tw.onComplete = null;
        }
      }
    },

    /**
     * Limpia y reinicia todos los tweens
     */
    clear() {
      for (let i = 0; i < MAX_TWEENS; i++) {
        tweenPool[i].active = false;
        tweenPool[i].target = null;
        tweenPool[i].onUpdate = null;
        tweenPool[i].onComplete = null;
      }
      this.activeCount = 0;
    }
  };

  if (typeof window !== 'undefined') {
    window.ArcadeTween = ArcadeTween;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ArcadeTween, Easing };
  }
})();
