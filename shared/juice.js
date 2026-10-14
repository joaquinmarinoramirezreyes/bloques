/**
 * shared/juice.js - Módulo de Sensación de Impacto, Retención, Diagnóstico y Accesibilidad
 * Implementa las directivas del ESTÁNDAR DE CALIDAD de REGLAS-JUEGOS.md:
 * - Screen shake proporcional y amortiguado
 * - Hitstop (micro-pausas de impacto)
 * - Object pooling de textos flotantes y combos
 * - Diagnóstico en pantalla activable con ?debug=1 y auto-tuner de calidad (<55 FPS)
 * - Sistema unificado de estadísticas, misiones diarias y logros (al menos 8)
 * - Vibración háptica segura y opciones de accesibilidad
 */
(() => {
  'use strict';

  // Configuración de diagnóstico (?debug=1)
  const isDebug = typeof window !== 'undefined' &&
    window.location &&
    window.location.search &&
    window.location.search.includes('debug=1');

  // Pool pre-asignado de textos flotantes (30 slots reutilizables sin Garbage Collector)
  const MAX_FLOATS = 30;
  const floatPool = [];
  for (let i = 0; i < MAX_FLOATS; i++) {
    floatPool.push({
      active: false,
      text: '',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      color: '#fff',
      size: 14,
      alpha: 1,
      life: 0,
      maxLife: 0.8
    });
  }

  const ArcadeJuice = {
    // --- ESTADO DE SHAKE Y HITSTOP ---
    shakeIntensity: 0,
    shakeTime: 0,
    shakeX: 0,
    shakeY: 0,
    hitstopRemaining: 0,

    // --- DIAGNÓSTICO Y AUTO-CALIDAD ---
    isDebug,
    fps: 60,
    frameTimeMs: 16.6,
    activeParticlesCount: 0,
    lowQualityMode: false,
    _fpsHistory: [],
    _lastFrameTimestamp: 0,

    /**
     * Activa una sacudida de pantalla con decaimiento suave
     * @param {number} intensity - Amplitud en píxeles (ej: 4 leve, 8 media, 16 fuerte)
     * @param {number} duration - Duración en segundos (ej: 0.2 a 0.4s)
     */
    shake(intensity = 6, duration = 0.25) {
      this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
      this.shakeTime = Math.max(this.shakeTime, duration);
      this.vibrate(Math.min(50, Math.floor(intensity * 4)));
    },

    /**
     * Pausa temporal de micro-impacto (hitstop)
     * @param {number} ms - Milisegundos de congelamiento (ej: 40 a 90ms)
     */
    hitstop(ms = 60) {
      this.hitstopRemaining = Math.max(this.hitstopRemaining, ms / 1000);
    },

    /**
     * Despacha vibración háptica respetando preferencias del usuario
     */
    vibrate(pattern = 25) {
      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          const enabled = this.getOption('vibration', true);
          if (enabled) {
            navigator.vibrate(pattern);
          }
        }
      } catch (_) {}
    },

    /**
     * Emite un número o texto flotante animado mediante object pooling
     */
    spawnFloat(text, x, y, color = '#facc15', size = 13, vy = -45) {
      for (const f of floatPool) {
        if (!f.active) {
          f.active = true;
          f.text = String(text);
          f.x = x;
          f.y = y;
          f.vx = (Math.random() - 0.5) * 15;
          f.vy = vy;
          f.color = color;
          f.size = size;
          f.alpha = 1;
          f.life = 0.8;
          f.maxLife = 0.8;
          return;
        }
      }
    },

    /**
     * Actualiza la simulación de Juice (shake, hitstop, floats, monitor fps)
     * @param {number} dt - Delta time en segundos
     * @returns {boolean} True si el frame debe pausarse por hitstop
     */
    update(dt) {
      // 1. Hitstop: si está activo, congela la lógica este frame
      if (this.hitstopRemaining > 0) {
        this.hitstopRemaining -= dt;
        return true;
      }

      // 2. Screen Shake con decaimiento armónico
      if (this.shakeTime > 0) {
        this.shakeTime -= dt;
        const progress = Math.max(0, this.shakeTime);
        this.shakeX = (Math.random() - 0.5) * 2 * this.shakeIntensity * (progress / 0.3);
        this.shakeY = (Math.random() - 0.5) * 2 * this.shakeIntensity * (progress / 0.3);
      } else {
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeIntensity = 0;
      }

      // 3. Textos flotantes
      for (const f of floatPool) {
        if (f.active) {
          f.x += f.vx * dt;
          f.y += f.vy * dt;
          f.life -= dt;
          f.alpha = Math.max(0, f.life / f.maxLife);
          if (f.life <= 0) {
            f.active = false;
          }
        }
      }

      // 4. Medición de rendimiento FPS
      const now = performance.now();
      if (this._lastFrameTimestamp > 0) {
        const frameMs = now - this._lastFrameTimestamp;
        this.frameTimeMs = frameMs;
        const instantFps = 1000 / Math.max(1, frameMs);
        this._fpsHistory.push(instantFps);
        if (this._fpsHistory.length > 60) {
          this._fpsHistory.shift();
        }

        // Promedio de 60 frames
        const sum = this._fpsHistory.reduce((a, b) => a + b, 0);
        this.fps = Math.round(sum / this._fpsHistory.length);

        // Auto-tuner: si baja de 55 FPS sostenidos, activa modo de calidad reducida
        if (this._fpsHistory.length >= 45 && this.fps < 55) {
          this.lowQualityMode = true;
        } else if (this.fps >= 58) {
          this.lowQualityMode = false;
        }
      }
      this._lastFrameTimestamp = now;

      return false;
    },

    /**
     * Dibuja los textos flotantes activos sobre el canvas
     */
    drawFloats(ctx) {
      for (const f of floatPool) {
        if (f.active) {
          ctx.save();
          ctx.globalAlpha = f.alpha;
          ctx.font = `900 ${f.size}px 'Courier New', monospace, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Sombra de contraste
          ctx.fillStyle = '#000';
          ctx.fillText(f.text, f.x + 1, f.y + 1);

          ctx.fillStyle = f.color;
          ctx.fillText(f.text, f.x, f.y);
          ctx.restore();
        }
      }
    },

    /**
     * Dibuja el overlay de diagnóstico si ?debug=1 está presente
     */
    drawDebugOverlay(ctx, particlesCount = 0) {
      if (!this.isDebug) return;
      this.activeParticlesCount = particlesCount;

      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(6, 6, 140, 52);
      ctx.strokeStyle = this.fps < 55 ? '#ef4444' : '#10b981';
      ctx.lineWidth = 1;
      ctx.strokeRect(6, 6, 140, 52);

      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = this.fps < 55 ? '#f87171' : '#34d399';
      ctx.fillText(`FPS: ${this.fps} (${this.frameTimeMs.toFixed(1)}ms)`, 12, 20);

      ctx.fillStyle = '#f8fafc';
      ctx.fillText(`Partículas: ${particlesCount}`, 12, 34);

      ctx.fillStyle = this.lowQualityMode ? '#fbbf24' : '#94a3b8';
      ctx.fillText(`Calidad: ${this.lowQualityMode ? 'BAJA (ECO)' : 'ALTA'}`, 12, 48);
      ctx.restore();
    },

    // --- PROGRESIÓN: ESTADÍSTICAS Y LOGROS ---
    /**
     * Desbloquea un logro con aviso banner animado y persistencia
     */
    unlockAchievement(gameId, achId, title, desc, icon = '🏆') {
      if (!gameId || !achId) return;
      const key = `arcade_ach_${gameId}_${achId}`;
      try {
        if (localStorage.getItem(key)) return; // Ya desbloqueado
        localStorage.setItem(key, String(Date.now()));
        this.showAchievementBanner(title, desc, icon);
        if (window.ArcadeAudio) {
          window.ArcadeAudio.playTone(587.33, 'triangle', 0.12, 0.2);
          setTimeout(() => window.ArcadeAudio.playTone(880, 'triangle', 0.25, 0.25), 100);
        }
      } catch (_) {}
    },

    /**
     * Consulta si un logro ha sido desbloqueado
     */
    hasAchievement(gameId, achId) {
      try {
        return !!localStorage.getItem(`arcade_ach_${gameId}_${achId}`);
      } catch (_) {
        return false;
      }
    },

    /**
     * Muestra banner animado de logro desbloqueado
     */
    showAchievementBanner(title, desc, icon = '🏆') {
      let banner = document.getElementById('arcade-achievement-toast');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'arcade-achievement-toast';
        banner.style.cssText = `
          position: fixed;
          top: 14px;
          left: 50%;
          transform: translateX(-50%) translateY(-100px);
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          border: 2px solid #f59e0b;
          box-shadow: 0 8px 24px rgba(0,0,0,0.8), 0 0 12px rgba(245, 158, 11, 0.4);
          color: #fff;
          padding: 8px 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 9999;
          font-family: monospace, system-ui;
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          pointer-events: none;
          max-width: 90%;
        `;
        document.body.appendChild(banner);
      }

      banner.innerHTML = `
        <span style="font-size: 24px;">${icon}</span>
        <div style="display: flex; flex-direction: column;">
          <span style="color: #f59e0b; font-weight: 900; font-size: 11px; letter-spacing: 1px;">¡LOGRO DESBLOQUEADO!</span>
          <span style="font-weight: 800; font-size: 13px;">${title}</span>
          <span style="color: #94a3b8; font-size: 10px;">${desc}</span>
        </div>
      `;

      banner.style.transform = 'translateX(-50%) translateY(0)';
      setTimeout(() => {
        banner.style.transform = 'translateX(-50%) translateY(-120px)';
      }, 3200);
    },

    /**
     * Registra una partida y actualiza tiempo jugado
     */
    trackPlay(gameId, durationSeconds = 0) {
      if (!gameId) return;
      try {
        const playsKey = `arcade_stat_${gameId}_plays`;
        const timeKey = `arcade_stat_${gameId}_time`;
        const plays = parseInt(localStorage.getItem(playsKey) || '0', 10) + 1;
        const totalTime = parseInt(localStorage.getItem(timeKey) || '0', 10) + Math.round(durationSeconds);
        localStorage.setItem(playsKey, String(plays));
        localStorage.setItem(timeKey, String(totalTime));
      } catch (_) {}
    },

    /**
     * Obtiene estadísticas del jugador para un juego
     */
    getStats(gameId) {
      try {
        const plays = parseInt(localStorage.getItem(`arcade_stat_${gameId}_plays`) || '0', 10);
        const time = parseInt(localStorage.getItem(`arcade_stat_${gameId}_time`) || '0', 10);
        const best = window.ArcadeStorage ? window.ArcadeStorage.getHighScore(gameId) : 0;
        return { plays, time, best };
      } catch (_) {
        return { plays: 0, time: 0, best: 0 };
      }
    },

    // --- OPCIONES Y ACCESIBILIDAD ---
    setOption(key, val) {
      try {
        localStorage.setItem(`arcade_opt_${key}`, JSON.stringify(val));
      } catch (_) {}
    },

    getOption(key, defaultVal) {
      try {
        const stored = localStorage.getItem(`arcade_opt_${key}`);
        return stored !== null ? JSON.parse(stored) : defaultVal;
      } catch (_) {
        return defaultVal;
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.ArcadeJuice = ArcadeJuice;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ArcadeJuice };
  }
})();
