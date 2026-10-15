/**
 * games/bastion/data/torres.js - Definición de las 6 torres para Bastión (Fase 2)
 * Cada torre cuenta con 3 niveles de mejora y 2 ramas de especialización final en Nivel 4.
 */
(() => {
  'use strict';

  const TORRES = {
    // 1. DISPARO RÁPIDO
    balistico: {
      id: 'balistico',
      name: 'Centinela Balístico',
      desc: 'Torreta de percusión continua que dispara ráfagas de proyectiles cinéticos.',
      role: 'Disparo Rápido',
      cost: 100,
      damageType: 'physical',
      range: 3.2,
      fireRate: 1.2,
      damage: 25,
      projectileSpeed: 8.0,
      projectileColor: '#38bdf8',
      projectileRadius: 3.5,
      color: '#0284c7',
      turretColor: '#38bdf8',
      levels: [
        { level: 1, cost: 100, damage: 25, fireRate: 1.2, range: 3.2, name: 'Centinela Balístico I' },
        { level: 2, upgradeCost: 85, damage: 45, fireRate: 1.5, range: 3.5, name: 'Centinela Balístico II' },
        { level: 3, upgradeCost: 140, damage: 75, fireRate: 1.8, range: 3.8, name: 'Centinela Balístico III' }
      ],
      branches: {
        a: {
          id: 'gatling',
          name: 'Ametralladora Gatling',
          desc: 'Hiper-cadencia de fuego rotativo monoblanco capaz de derretir objetivos rápidos.',
          branchCost: 220,
          damage: 55,
          fireRate: 4.2,
          range: 4.0,
          projectileColor: '#7dd3fc',
          turretColor: '#0ea5e9'
        },
        b: {
          id: 'bateria_pesada',
          name: 'Batería de Percusión',
          desc: 'Munición de percusión pesada que provoca micro-explosiones en área de 0.9 celdas.',
          branchCost: 220,
          damage: 160,
          fireRate: 1.0,
          range: 3.8,
          splashRadius: 0.9,
          projectileColor: '#f59e0b',
          turretColor: '#d97706'
        }
      }
    },

    // 2. CAÑÓN DE ÁREA
    mortero: {
      id: 'mortero',
      name: 'Mortero de Fragmentación',
      desc: 'Lanza proyectiles explosivos pesados con impacto en área de efecto.',
      role: 'Daño en Área',
      cost: 140,
      damageType: 'physical',
      range: 4.2,
      fireRate: 0.55,
      damage: 65,
      splashRadius: 1.2,
      projectileSpeed: 5.5,
      projectileColor: '#f97316',
      projectileRadius: 5.5,
      color: '#c2410c',
      turretColor: '#fb923c',
      levels: [
        { level: 1, cost: 140, damage: 65, fireRate: 0.55, range: 4.2, splashRadius: 1.2, name: 'Mortero I' },
        { level: 2, upgradeCost: 110, damage: 115, fireRate: 0.65, range: 4.5, splashRadius: 1.4, name: 'Mortero II' },
        { level: 3, upgradeCost: 170, damage: 190, fireRate: 0.75, range: 4.8, splashRadius: 1.6, name: 'Mortero III' }
      ],
      branches: {
        a: {
          id: 'racimo',
          name: 'Mina de Racimo',
          desc: 'Al detonar, libera 3 submuniciones adicionales que cubren un cuadrante más amplio.',
          branchCost: 260,
          damage: 230,
          fireRate: 0.8,
          range: 5.0,
          splashRadius: 1.8,
          clusterCount: 3,
          clusterDamage: 45,
          projectileColor: '#ef4444',
          turretColor: '#dc2626'
        },
        b: {
          id: 'napalm',
          name: 'Lodo Incendiario',
          desc: 'Prende fuego al terreno durante 3 segundos causando 35 de daño por segundo.',
          branchCost: 260,
          damage: 180,
          fireRate: 0.7,
          range: 4.8,
          splashRadius: 1.5,
          groundFireDuration: 3.0,
          groundFireDps: 35,
          projectileColor: '#ea580c',
          turretColor: '#b45309'
        }
      }
    },

    // 3. RAYO QUE ATRAVIESA
    rayo: {
      id: 'rayo',
      name: 'Emisor Prismático',
      desc: 'Haz de partículas concentradas que atraviesa a todos los enemigos en línea recta e ignora armadura.',
      role: 'Perforación de Línea',
      cost: 160,
      damageType: 'energy',
      range: 3.8,
      fireRate: 0.9,
      damage: 42,
      piercing: true,
      ignoresArmor: true,
      projectileSpeed: 14.0,
      projectileColor: '#a855f7',
      projectileRadius: 3.0,
      color: '#7e22ce',
      turretColor: '#c084fc',
      levels: [
        { level: 1, cost: 160, damage: 42, fireRate: 0.9, range: 3.8, name: 'Emisor Prismático I' },
        { level: 2, upgradeCost: 125, damage: 78, fireRate: 1.1, range: 4.1, name: 'Emisor Prismático II' },
        { level: 3, upgradeCost: 190, damage: 135, fireRate: 1.3, range: 4.4, name: 'Emisor Prismático III' }
      ],
      branches: {
        a: {
          id: 'desintegrador',
          name: 'Rayo Desintegrador',
          desc: 'Emisión continua focalizada que derrite las defensas enemigas en un haz ininterrumpido.',
          branchCost: 280,
          damage: 220,
          fireRate: 2.2,
          range: 4.6,
          piercing: true,
          ignoresArmor: true,
          projectileColor: '#e879f9',
          turretColor: '#d946ef'
        },
        b: {
          id: 'bobina_tesla',
          name: 'Bobina de Sobrecarga',
          desc: 'El rayo impacta y genera arcos voltaicos en cadena que saltan a 3 objetivos cercanos.',
          branchCost: 280,
          damage: 160,
          fireRate: 1.2,
          range: 4.4,
          chainTargets: 3,
          projectileColor: '#38bdf8',
          turretColor: '#0284c7'
        }
      }
    },

    // 4. RALENTIZADORA
    crio: {
      id: 'crio',
      name: 'Torre Criogénica',
      desc: 'Dispersa pulsos de frío glacial que ralentizan el avance de las criaturas en su radio.',
      role: 'Control y Ralentización',
      cost: 120,
      damageType: 'frost',
      range: 3.2,
      fireRate: 1.1,
      damage: 18,
      slowFactor: 0.35, // 35% de ralentización
      slowDuration: 2.2,
      projectileSpeed: 7.0,
      projectileColor: '#06b6d4',
      projectileRadius: 4.0,
      color: '#0891b2',
      turretColor: '#67e8f9',
      levels: [
        { level: 1, cost: 120, damage: 18, fireRate: 1.1, range: 3.2, slowFactor: 0.35, name: 'Torre Criogénica I' },
        { level: 2, upgradeCost: 95, damage: 32, fireRate: 1.3, range: 3.5, slowFactor: 0.45, name: 'Torre Criogénica II' },
        { level: 3, upgradeCost: 150, damage: 52, fireRate: 1.5, range: 3.8, slowFactor: 0.55, name: 'Torre Criogénica III' }
      ],
      branches: {
        a: {
          id: 'cero_absoluto',
          name: 'Ventisca Polar',
          desc: 'Ralentiza en 65% y posee un 30% de probabilidad de congelar inmóvil al blanco durante 1.2s.',
          branchCost: 240,
          damage: 75,
          fireRate: 1.6,
          range: 4.2,
          slowFactor: 0.65,
          freezeChance: 0.3,
          freezeDuration: 1.2,
          projectileColor: '#e0f2fe',
          turretColor: '#bae6fd'
        },
        b: {
          id: 'escarcha_vulnerable',
          name: 'Escarcha Quebradiza',
          desc: 'Los enemigos bajo efecto de escarcha reciben un +35% de daño extra de todas las demás fuentes.',
          branchCost: 240,
          damage: 60,
          fireRate: 1.4,
          range: 4.0,
          slowFactor: 0.45,
          vulnerabilityFactor: 0.35,
          projectileColor: '#22d3ee',
          turretColor: '#0891b2'
        }
      }
    },

    // 5. APOYO Y BUFF A VECINAS
    obelisco: {
      id: 'obelisco',
      name: 'Obelisco de Resonancia',
      desc: 'Estructura pasiva que emite ondas armónicas que incrementan el daño y alcance de las torres vecinas.',
      role: 'Apoyo Táctico',
      cost: 150,
      damageType: 'support',
      range: 2.4, // Radio de aura a vecinas
      damageBuff: 0.20, // +20% daño a torres dentro del radio
      rangeBuff: 0.10,  // +10% alcance
      fireRateBuff: 0.0,
      color: '#15803d',
      turretColor: '#4ade80',
      levels: [
        { level: 1, cost: 150, range: 2.4, damageBuff: 0.20, rangeBuff: 0.10, name: 'Obelisco I' },
        { level: 2, upgradeCost: 120, range: 2.7, damageBuff: 0.30, rangeBuff: 0.15, name: 'Obelisco II' },
        { level: 3, upgradeCost: 180, range: 3.0, damageBuff: 0.40, rangeBuff: 0.20, fireRateBuff: 0.15, name: 'Obelisco III' }
      ],
      branches: {
        a: {
          id: 'sobrecarga_arcana',
          name: 'Sobrecarga Arcana',
          desc: 'Potencia al extremo a las torres contiguas (+55% daño y +25% alcance).',
          branchCost: 270,
          range: 3.2,
          damageBuff: 0.55,
          rangeBuff: 0.25,
          fireRateBuff: 0.20,
          turretColor: '#86efac'
        },
        b: {
          id: 'amplificador_oro',
          name: 'Catalizador de Recursos',
          desc: 'Incrementa la cadencia de fuego en +30% y otorga +25% de oro por cada baja en su radio.',
          branchCost: 270,
          range: 3.2,
          damageBuff: 0.30,
          fireRateBuff: 0.35,
          bonusGoldPercent: 0.25,
          turretColor: '#facc15'
        }
      }
    },

    // 6. FRANCOTIRADORA
    francotirador: {
      id: 'francotirador',
      name: 'Cañón de Precisión',
      desc: 'Disparo cinético de ultra-largo alcance que inflige enorme daño singular con proyectil hipersónico.',
      role: 'Largo Alcance',
      cost: 180,
      damageType: 'physical',
      range: 6.2,
      fireRate: 0.42,
      damage: 130,
      projectileSpeed: 16.0,
      projectileColor: '#fb7185',
      projectileRadius: 3.0,
      color: '#be123c',
      turretColor: '#f43f5e',
      levels: [
        { level: 1, cost: 180, damage: 130, fireRate: 0.42, range: 6.2, name: 'Cañón de Precisión I' },
        { level: 2, upgradeCost: 140, damage: 240, fireRate: 0.48, range: 6.8, name: 'Cañón de Precisión II' },
        { level: 3, upgradeCost: 210, damage: 410, fireRate: 0.55, range: 7.4, name: 'Cañón de Precisión III' }
      ],
      branches: {
        a: {
          id: 'perforador_blindaje',
          name: 'Proyectil Perforante',
          desc: 'Ignora por completo el blindaje y asesta un 100% de daño crítico a objetivos con más del 65% de vida.',
          branchCost: 320,
          damage: 620,
          fireRate: 0.6,
          range: 7.8,
          ignoresArmor: true,
          critThreshold: 0.65,
          critMultiplier: 2.0,
          projectileColor: '#e11d48',
          turretColor: '#fda4af'
        },
        b: {
          id: 'ojo_halcon',
          name: 'Ojo de Halcón',
          desc: 'Alcance global a todo el mapa sin importar distancia. Apunta siempre a la criatura de mayor salud.',
          branchCost: 320,
          damage: 520,
          fireRate: 0.5,
          range: 99.0, // Global
          isGlobalRange: true,
          forcedPriority: 'strongest',
          projectileColor: '#38bdf8',
          turretColor: '#e0e7ff'
        }
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TORRES };
  } else {
    window.BASTION_TORRES = TORRES;
  }
})();
