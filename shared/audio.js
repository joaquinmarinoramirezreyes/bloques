/**
 * SHARED AUDIO - Generador de sonidos arcade retro sintetizados en tiempo real (Web Audio API)
 * 100% offline, sin archivos de audio externos ni librerías.
 */
(() => {
  'use strict';

  const MUTE_KEY = 'arcade_audio_muted';

  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
      try {
        this.isMuted = localStorage.getItem(MUTE_KEY) === 'true';
      } catch (e) {}
    }

    initCtx() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      try {
        localStorage.setItem(MUTE_KEY, String(this.isMuted));
      } catch (e) {}
      return this.isMuted;
    }

    playTone(freq, type = 'square', duration = 0.08, gainVal = 0.1) {
      if (this.isMuted) return;
      this.initCtx();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {}
    }

    playMove() {
      this.playTone(320, 'square', 0.04, 0.06);
    }

    playRotate() {
      if (this.isMuted) return;
      this.initCtx();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(360, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(680, this.ctx.currentTime + 0.06);

        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.06);
      } catch (e) {}
    }

    playDrop() {
      this.playTone(150, 'sine', 0.07, 0.12);
    }

    playClear() {
      if (this.isMuted) return;
      this.initCtx();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(f, now + idx * 0.05);
          gain.gain.setValueAtTime(0.08, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.1);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.1);
        });
      } catch (e) {}
    }

    playGameOver() {
      if (this.isMuted) return;
      this.initCtx();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        [440, 415.3, 392, 349.2].forEach((f, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, now + idx * 0.08);
          gain.gain.setValueAtTime(0.08, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.14);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.14);
        });
      } catch (e) {}
    }
  }

  window.ArcadeAudio = new SoundEngine();
})();
