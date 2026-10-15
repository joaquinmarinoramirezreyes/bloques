/**
 * games/bastion/data/enemigos.js - Definición de enemigos y jefes para Bastión (Fase 2)
 */
(() => {
  'use strict';

  const ENEMIGOS = {
    // 1. Vanguardia básica
    reptante: {
      id: 'reptante',
      name: 'Reptante de Ceniza',
      desc: 'Criatura cuadrúpeda veloz con caparazón quitinoso. Vanguardia común de los asedios.',
      hp: 90,
      speed: 1.45,
      reward: 14,
      damage: 1,
      size: 11,
      armor: 0,
      flying: false,
      color: '#f43f5e',
      glow: 'rgba(244, 63, 94, 0.4)',
      type: 'ground'
    },

    // 2. Rápido
    veloz: {
      id: 'veloz',
      name: 'Acechador Centella',
      desc: 'Enjambre ultraligero de alta aceleración. Desborda líneas defensivas con baja cadencia.',
      hp: 60,
      speed: 2.35,
      reward: 16,
      damage: 1,
      size: 9,
      armor: 0,
      flying: false,
      color: '#fbbf24',
      glow: 'rgba(251, 191, 36, 0.5)',
      type: 'ground'
    },

    // 3. Blindado (Resistente a daño físico)
    blindado: {
      id: 'blindado',
      name: 'Gólem Acorazado',
      desc: 'Blindaje de placas tectónicas. Mitiga 50% de proyectiles cinéticos pero es vulnerable a rayos y energía.',
      hp: 280,
      speed: 0.85,
      reward: 32,
      damage: 2,
      size: 15,
      armor: 0.5, // 50% reducción de daño físico/cinético
      flying: false,
      color: '#64748b',
      glow: 'rgba(148, 163, 184, 0.4)',
      type: 'ground'
    },

    // 4. Volador (Ignora el camino y vuela directo al núcleo)
    etero: {
      id: 'etero',
      name: 'Espectro Etéreo',
      desc: 'Criatura voladora ingrávida. Atraviesa peñascos y vuela directamente hacia el Núcleo Arcano.',
      hp: 110,
      speed: 1.25,
      reward: 22,
      damage: 1,
      size: 10,
      armor: 0,
      flying: true,
      color: '#a855f7',
      glow: 'rgba(168, 85, 247, 0.55)',
      type: 'flying'
    },

    // 5. Regenerador
    regenerador: {
      id: 'regenerador',
      name: 'Parásito Simbionte',
      desc: 'Organismo biológico que regenera 8 puntos de vida por segundo si no recibe fuego continuo.',
      hp: 190,
      speed: 1.15,
      reward: 26,
      damage: 1,
      size: 12,
      armor: 0.1,
      regen: 8, // HP regenerados por segundo
      flying: false,
      color: '#10b981',
      glow: 'rgba(16, 185, 129, 0.45)',
      type: 'ground'
    },

    // 6. Divisor (Se fragmenta en 2 crías al morir)
    divisor: {
      id: 'divisor',
      name: 'Matriz Mitótica',
      desc: 'Núcleo celular inestable. Al sucumbir se fragmenta en 2 crías menores que continúan el asedio.',
      hp: 160,
      speed: 1.1,
      reward: 20,
      damage: 1,
      size: 13,
      armor: 0,
      splitCount: 2,
      splitTypeId: 'divisor_cria',
      flying: false,
      color: '#ec4899',
      glow: 'rgba(236, 72, 153, 0.5)',
      type: 'ground'
    },

    // Cría de la matriz mitótica
    divisor_cria: {
      id: 'divisor_cria',
      name: 'Cría Mitótica',
      desc: 'Fragmento menor desprendido de la matriz.',
      hp: 55,
      speed: 1.7,
      reward: 8,
      damage: 1,
      size: 7,
      armor: 0,
      flying: false,
      color: '#f472b6',
      glow: 'rgba(244, 114, 182, 0.4)',
      type: 'ground'
    },

    // 7. Jefe Colosal (Aparece en oleadas 10 y 20)
    jefe_coloso: {
      id: 'jefe_coloso',
      name: 'Titán Devorador de Éter',
      desc: 'Jefe supremo de asedio. Emite pulsos curativos a sus aliados y desata ondas sísmicas que aturden torres.',
      hp: 1800,
      speed: 0.65,
      reward: 250,
      damage: 5,
      size: 20,
      armor: 0.35,
      isBoss: true,
      flying: false,
      healAuraRadius: 2.8,  // Celdas
      healAuraAmount: 40,   // HP curados por pulso
      healCooldown: 4.0,    // Segundos entre pulsos de cura
      stunRadius: 2.5,      // Celdas de aturdimiento de torres
      stunDuration: 2.2,    // Segundos de desactivación de torres
      stunCooldown: 7.0,    // Segundos entre ondas de aturdimiento
      color: '#e11d48',
      glow: 'rgba(225, 29, 72, 0.7)',
      type: 'ground'
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ENEMIGOS };
  } else {
    window.BASTION_ENEMIGOS = ENEMIGOS;
  }
})();
