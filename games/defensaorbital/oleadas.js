/**
 * OLEADAS Y TRAYECTORIAS BÉZIER - DEFENSA ORBITAL
 * 100% Datos puros y funciones de evaluación paramétrica.
 * Compatible con navegador y entornos de pruebas Node.js.
 */
(() => {
  'use strict';

  // Ancho y alto de referencia del mundo virtual
  const W = 480;
  const H = 640;

  // ==========================================================================
  // 1. EVALUACIÓN MATEMÁTICA DE SPLINES BÉZIER CÚBICAS
  // ==========================================================================
  /**
   * Evalúa un punto en una curva Bézier cúbica para t en [0, 1].
   * B(t) = (1-t)^3 * P0 + 3(1-t)^2 * t * P1 + 3(1-t) * t^2 * P2 + t^3 * P3
   */
  function evaluateCubicBezier(p0, p1, p2, p3, t) {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    const x = mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x;
    const y = mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y;

    // Derivada B'(t) para calcular el ángulo de orientación tangencial (heading)
    const dx = 3 * mt2 * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t2 * (p3.x - p2.x);
    const dy = 3 * mt2 * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t2 * (p3.y - p2.y);
    const angle = Math.atan2(dy, dx) + Math.PI / 2; // Apuntar hacia adelante

    return { x, y, dx, dy, angle };
  }

  // ==========================================================================
  // 2. CATÁLOGO DE TRAYECTORIAS COREOGRAFIADAS (5+ TRAYECTORIAS PROPIAS)
  // Cada trayectoria define puntos de control iniciales relativos o absolutos.
  // P3 se enlaza en tiempo real a la casilla asignada en la formación.
  // ==========================================================================
  const TRAYECTORIAS = {
    // 1. Arco convergente superior izquierdo
    ARCO_SUPERIOR_IZQ: {
      id: 'ARCO_SUPERIOR_IZQ',
      name: 'Arco Convergente Superior Izquierdo',
      p0: { x: -40, y: 70 },
      p1: { x: 260, y: 40 },
      p2: { x: 380, y: 220 },
      duration: 2.1
    },

    // 2. Arco convergente superior derecho (espejo)
    ARCO_SUPERIOR_DER: {
      id: 'ARCO_SUPERIOR_DER',
      name: 'Arco Convergente Superior Derecho',
      p0: { x: W + 40, y: 70 },
      p1: { x: W - 260, y: 40 },
      p2: { x: W - 380, y: 220 },
      duration: 2.1
    },

    // 3. Espiral orbital (gira en bucle circular antes de integrarse)
    ESPIRAL_ORBITAL_IZQ: {
      id: 'ESPIRAL_ORBITAL_IZQ',
      name: 'Espiral Orbital Izquierda',
      p0: { x: 60, y: -45 },
      p1: { x: 420, y: 160 },
      p2: { x: -60, y: 310 },
      duration: 2.4
    },

    ESPIRAL_ORBITAL_DER: {
      id: 'ESPIRAL_ORBITAL_DER',
      name: 'Espiral Orbital Derecha',
      p0: { x: W - 60, y: -45 },
      p1: { x: W - 420, y: 160 },
      p2: { x: W + 60, y: 310 },
      duration: 2.4
    },

    // 4. Cruce diagonal amplio (incursión lateral con inflexión baja)
    CRUCE_DIAGONAL_IZQ: {
      id: 'CRUCE_DIAGONAL_IZQ',
      name: 'Cruce Diagonal Izquierdo',
      p0: { x: -50, y: 190 },
      p1: { x: 390, y: 110 },
      p2: { x: 440, y: 340 },
      duration: 2.3
    },

    CRUCE_DIAGONAL_DER: {
      id: 'CRUCE_DIAGONAL_DER',
      name: 'Cruce Diagonal Derecho',
      p0: { x: W + 50, y: 190 },
      p1: { x: W - 390, y: 110 },
      p2: { x: W - 440, y: 340 },
      duration: 2.3
    },

    // 5. Lazo ascendente (entra por lateral inferior, remonta y cae a la rejilla)
    LAZO_ASCENDENTE_IZQ: {
      id: 'LAZO_ASCENDENTE_IZQ',
      name: 'Lazo Ascendente Izquierdo',
      p0: { x: -35, y: 380 },
      p1: { x: 340, y: 390 },
      p2: { x: 250, y: 50 },
      duration: 2.5
    },

    LAZO_ASCENDENTE_DER: {
      id: 'LAZO_ASCENDENTE_DER',
      name: 'Lazo Ascendente Derecho',
      p0: { x: W + 35, y: 380 },
      p1: { x: W - 340, y: 390 },
      p2: { x: W - 250, y: 50 },
      duration: 2.5
    },

    // 6. Barrido sinuoso en 'S' central
    BARRIDO_SINUOSO_CENTRAL: {
      id: 'BARRIDO_SINUOSO_CENTRAL',
      name: 'Barrido Sinuoso en S',
      p0: { x: W / 2, y: -45 },
      p1: { x: W - 40, y: 160 },
      p2: { x: 40, y: 280 },
      duration: 2.2
    }
  };

  // ==========================================================================
  // 3. TIPOS DE ENEMIGOS ORIGINALES (DATOS VECTORIALES Y ESTADÍSTICAS)
  // ==========================================================================
  const TIPOS_ENEMIGOS = {
    PRISMA: {
      type: 'PRISMA',
      name: 'Dardo Prisma',
      hp: 1,
      scoreFormation: 40,
      scoreDiving: 90,
      radius: 12,
      primaryColor: '#f59e0b',    // Ámbar estelar
      secondaryColor: '#ef4444',  // Carmesí
      glowColor: 'rgba(245, 158, 11, 0.7)',
      speedRatio: 1.0,
      wingSpan: 16
    },
    CENTINELA: {
      type: 'CENTINELA',
      name: 'Centinela Romboide',
      hp: 2,
      scoreFormation: 80,
      scoreDiving: 160,
      radius: 14,
      primaryColor: '#10b981',    // Esmeralda cuántica
      secondaryColor: '#06b6d4',  // Cian cianuro
      glowColor: 'rgba(16, 185, 129, 0.7)',
      speedRatio: 0.92,
      wingSpan: 19
    },
    VERTICE: {
      type: 'VERTICE',
      name: 'Vértice Alfa',
      hp: 3,
      scoreFormation: 150,
      scoreDiving: 320,
      radius: 17,
      primaryColor: '#a855f7',    // Violeta estelar
      secondaryColor: '#ec4899',  // Magenta
      glowColor: 'rgba(168, 85, 247, 0.8)',
      speedRatio: 0.85,
      wingSpan: 22
    }
  };

  // ==========================================================================
  // 4. CONFIGURACIÓN DE LA FORMACIÓN EN REJILLA
  // ==========================================================================
  const FORMACION_CONFIG = {
    ROWS: 4,
    COLS: 8,
    SLOT_SPACING_X: 42,
    SLOT_SPACING_Y: 34,
    CENTER_X: W / 2,
    TOP_Y: 105,
    SWAY_SPEED: 1.25,     // Velocidad angular del vaivén
    SWAY_AMP: 36,         // Amplitud en px de oscilación horizontal
    BREATH_SPEED: 1.8,    // Velocidad de expansión/contracción
    BREATH_AMP: 0.075     // Factor de escala (7.5% de respiración)
  };

  // ==========================================================================
  // 5. DEFINICIÓN DE OLEADAS COREOGRAFIADAS (PLANTILLAS Y GENERADOR)
  // Cada oleada está compuesta por grupos escalonados con una trayectoria
  // ==========================================================================
  const PLANTILLAS_OLEADAS = [
    // Oleada 1: Despliegue de exploración básica (20 enemigos, 4 escuadras)
    {
      waveNumber: 1,
      title: 'OLEADA 1: INCURSIÓN DE AVANZADA',
      groups: [
        // Grupo 1: 4 Vértices centrales por arco superior
        {
          trajectoryId: 'ARCO_SUPERIOR_IZQ',
          enemyType: 'VERTICE',
          startDelay: 0.2,
          staggerDelay: 0.16,
          slots: [
            { row: 0, col: 2 },
            { row: 0, col: 3 },
            { row: 0, col: 4 },
            { row: 0, col: 5 }
          ]
        },
        // Grupo 2: 6 Centinelas por arco derecho
        {
          trajectoryId: 'ARCO_SUPERIOR_DER',
          enemyType: 'CENTINELA',
          startDelay: 1.4,
          staggerDelay: 0.15,
          slots: [
            { row: 1, col: 1 },
            { row: 1, col: 2 },
            { row: 1, col: 3 },
            { row: 1, col: 4 },
            { row: 1, col: 5 },
            { row: 1, col: 6 }
          ]
        },
        // Grupo 3: 5 Dardos Prisma por diagonal izquierda
        {
          trajectoryId: 'CRUCE_DIAGONAL_IZQ',
          enemyType: 'PRISMA',
          startDelay: 2.8,
          staggerDelay: 0.14,
          slots: [
            { row: 2, col: 1 },
            { row: 2, col: 2 },
            { row: 2, col: 3 },
            { row: 2, col: 4 },
            { row: 2, col: 5 }
          ]
        },
        // Grupo 4: 5 Dardos Prisma por diagonal derecha
        {
          trajectoryId: 'CRUCE_DIAGONAL_DER',
          enemyType: 'PRISMA',
          startDelay: 4.1,
          staggerDelay: 0.14,
          slots: [
            { row: 3, col: 1 },
            { row: 3, col: 2 },
            { row: 3, col: 3 },
            { row: 3, col: 4 },
            { row: 3, col: 5 }
          ]
        }
      ]
    },

    // Oleada 2: Formación compacta cruzada (24 enemigos)
    {
      waveNumber: 2,
      title: 'OLEADA 2: ENLACE EN ESPIRAL',
      groups: [
        // Grupo 1: Espiral izquierda con Vértices y Centinelas
        {
          trajectoryId: 'ESPIRAL_ORBITAL_IZQ',
          enemyType: 'VERTICE',
          startDelay: 0.2,
          staggerDelay: 0.18,
          slots: [
            { row: 0, col: 1 },
            { row: 0, col: 2 },
            { row: 0, col: 5 },
            { row: 0, col: 6 }
          ]
        },
        // Grupo 2: Espiral derecha con Centinelas
        {
          trajectoryId: 'ESPIRAL_ORBITAL_DER',
          enemyType: 'CENTINELA',
          startDelay: 1.5,
          staggerDelay: 0.15,
          slots: [
            { row: 1, col: 0 },
            { row: 1, col: 1 },
            { row: 1, col: 2 },
            { row: 1, col: 5 },
            { row: 1, col: 6 },
            { row: 1, col: 7 }
          ]
        },
        // Grupo 3: Lazo ascendente izquierdo con Prismas
        {
          trajectoryId: 'LAZO_ASCENDENTE_IZQ',
          enemyType: 'PRISMA',
          startDelay: 2.9,
          staggerDelay: 0.14,
          slots: [
            { row: 2, col: 0 },
            { row: 2, col: 1 },
            { row: 2, col: 2 },
            { row: 2, col: 3 },
            { row: 2, col: 4 },
            { row: 2, col: 5 },
            { row: 2, col: 6 }
          ]
        },
        // Grupo 4: Lazo ascendente derecho con Prismas
        {
          trajectoryId: 'LAZO_ASCENDENTE_DER',
          enemyType: 'PRISMA',
          startDelay: 4.4,
          staggerDelay: 0.14,
          slots: [
            { row: 3, col: 0 },
            { row: 3, col: 1 },
            { row: 3, col: 2 },
            { row: 3, col: 3 },
            { row: 3, col: 4 },
            { row: 3, col: 5 },
            { row: 3, col: 6 }
          ]
        }
      ]
    },

    // Oleada 3: Formación Completa (28 enemigos, 5 grupos dinámicos)
    {
      waveNumber: 3,
      title: 'OLEADA 3: DESPLIEGUE COMPLETO',
      groups: [
        {
          trajectoryId: 'BARRIDO_SINUOSO_CENTRAL',
          enemyType: 'VERTICE',
          startDelay: 0.2,
          staggerDelay: 0.16,
          slots: [
            { row: 0, col: 1 },
            { row: 0, col: 2 },
            { row: 0, col: 3 },
            { row: 0, col: 4 },
            { row: 0, col: 5 },
            { row: 0, col: 6 }
          ]
        },
        {
          trajectoryId: 'ARCO_SUPERIOR_IZQ',
          enemyType: 'CENTINELA',
          startDelay: 1.6,
          staggerDelay: 0.14,
          slots: [
            { row: 1, col: 0 },
            { row: 1, col: 1 },
            { row: 1, col: 2 },
            { row: 1, col: 3 }
          ]
        },
        {
          trajectoryId: 'ARCO_SUPERIOR_DER',
          enemyType: 'CENTINELA',
          startDelay: 2.5,
          staggerDelay: 0.14,
          slots: [
            { row: 1, col: 4 },
            { row: 1, col: 5 },
            { row: 1, col: 6 },
            { row: 1, col: 7 }
          ]
        },
        {
          trajectoryId: 'CRUCE_DIAGONAL_IZQ',
          enemyType: 'PRISMA',
          startDelay: 3.6,
          staggerDelay: 0.13,
          slots: [
            { row: 2, col: 0 },
            { row: 2, col: 1 },
            { row: 2, col: 2 },
            { row: 2, col: 3 },
            { row: 2, col: 4 },
            { row: 2, col: 5 },
            { row: 2, col: 6 }
          ]
        },
        {
          trajectoryId: 'CRUCE_DIAGONAL_DER',
          enemyType: 'PRISMA',
          startDelay: 4.8,
          staggerDelay: 0.13,
          slots: [
            { row: 3, col: 0 },
            { row: 3, col: 1 },
            { row: 3, col: 2 },
            { row: 3, col: 3 },
            { row: 3, col: 4 },
            { row: 3, col: 5 },
            { row: 3, col: 6 }
          ]
        }
      ]
    }
  ];

  /**
   * Obtiene la configuración de una oleada específica.
   * Si excede las plantillas fijas, genera variaciones ricas escalando velocidad y tipos.
   */
  function getWaveConfig(waveNum) {
    // Si es enfrentamiento con Jefe de Sector (cada 5 oleadas: 5, 10, 15...)
    const isBossWave = (waveNum % 5 === 0);
    if (isBossWave) {
      const bossTier = Math.floor(waveNum / 5);
      const bossHp = 36 + (bossTier - 1) * 24;
      const wingHp = 10 + (bossTier - 1) * 6;
      return {
        waveNumber: waveNum,
        isBoss: true,
        isBonus: false,
        title: bossTier === 1 ? 'SECTOR 5: COLOSO CUÁNTICO AEGIS' : `SECTOR ${waveNum}: COLOSO AEGIS MK-${bossTier}`,
        boss: {
          name: bossTier === 1 ? 'COLOSO AEGIS' : `COLOSO AEGIS MK-${bossTier}`,
          hp: bossHp,
          maxHp: bossHp,
          leftWingHp: wingHp,
          maxLeftWingHp: wingHp,
          rightWingHp: wingHp,
          maxRightWingHp: wingHp,
          primaryColor: '#ec4899',
          glowColor: 'rgba(236, 72, 153, 0.85)',
          scoreKill: 2500 * bossTier
        },
        groups: []
      };
    }

    // Si es etapa de bonificación (cada 4 oleadas no múltiplos de 5: 4, 8, 12, 16...)
    const isBonusWave = (waveNum % 4 === 0);
    if (isBonusWave) {
      return {
        waveNumber: waveNum,
        isBoss: false,
        isBonus: true,
        title: `ETAPA ESPECIAL DE BONIFICACIÓN ${Math.floor(waveNum / 4)}`,
        groups: [
          {
            trajectoryId: 'ESPIRAL_ORBITAL_IZQ',
            enemyType: 'PRISMA',
            startDelay: 0.3,
            staggerDelay: 0.14,
            slots: [
              { row: 1, col: 1 },
              { row: 1, col: 2 },
              { row: 1, col: 3 },
              { row: 1, col: 4 },
              { row: 1, col: 5 }
            ]
          },
          {
            trajectoryId: 'ESPIRAL_ORBITAL_DER',
            enemyType: 'PRISMA',
            startDelay: 1.8,
            staggerDelay: 0.14,
            slots: [
              { row: 2, col: 2 },
              { row: 2, col: 3 },
              { row: 2, col: 4 },
              { row: 2, col: 5 }
            ]
          },
          {
            trajectoryId: 'BARRIDO_SINUOSO_CENTRAL',
            enemyType: 'CENTINELA',
            startDelay: 3.3,
            staggerDelay: 0.15,
            slots: [
              { row: 0, col: 2 },
              { row: 0, col: 3 },
              { row: 0, col: 4 },
              { row: 0, col: 5 }
            ]
          },
          {
            trajectoryId: 'LAZO_ASCENDENTE_IZQ',
            enemyType: 'VERTICE',
            startDelay: 4.8,
            staggerDelay: 0.16,
            slots: [
              { row: 0, col: 1 },
              { row: 0, col: 6 }
            ]
          }
        ]
      };
    }

    const templateIdx = (waveNum - 1) % PLANTILLAS_OLEADAS.length;
    const base = PLANTILLAS_OLEADAS[templateIdx];

    // Clonar para no mutar plantilla
    return {
      waveNumber: waveNum,
      isBoss: false,
      isBonus: false,
      title: `OLEADA ${waveNum}`,
      groups: base.groups.map(g => ({
        trajectoryId: g.trajectoryId,
        enemyType: g.enemyType,
        startDelay: g.startDelay,
        staggerDelay: Math.max(0.09, g.staggerDelay - Math.min(0.04, Math.floor(waveNum / 3) * 0.01)),
        slots: g.slots.map(s => ({ row: s.row, col: s.col }))
      }))
    };
  }

  // ==========================================================================
  // 6. PERFILES DE PICADAS (DIVES) CON LAZOS Y VECTORES DE TIRO
  // ==========================================================================
  const DIVE_PROFILES = [
    {
      id: 'PICA_LAZO_IZQ',
      name: 'Picada con Lazo Izquierdo',
      duration: 3.2,
      shootRatio: 0.42,
      calcPoints: (p0, pPlayer) => ({
        p0: { x: p0.x, y: p0.y },
        p1: { x: p0.x - 90, y: p0.y - 30 },
        p2: { x: pPlayer.x - 70, y: 360 },
        p3: { x: pPlayer.x + 90, y: H + 60 }
      })
    },
    {
      id: 'PICA_LAZO_DER',
      name: 'Picada con Lazo Derecho',
      duration: 3.2,
      shootRatio: 0.42,
      calcPoints: (p0, pPlayer) => ({
        p0: { x: p0.x, y: p0.y },
        p1: { x: p0.x + 90, y: p0.y - 30 },
        p2: { x: pPlayer.x + 70, y: 360 },
        p3: { x: pPlayer.x - 90, y: H + 60 }
      })
    },
    {
      id: 'PICA_ESPIRAL_CENTRAL',
      name: 'Picada Espiral Central',
      duration: 3.4,
      shootRatio: 0.38,
      calcPoints: (p0, pPlayer) => ({
        p0: { x: p0.x, y: p0.y },
        p1: { x: p0.x, y: p0.y - 45 },
        p2: { x: W / 2 + (p0.x > W / 2 ? -130 : 130), y: 310 },
        p3: { x: pPlayer.x, y: H + 60 }
      })
    },
    {
      id: 'PICA_CRUCE_DIAGONAL',
      name: 'Picada de Cruce Diagonal',
      duration: 2.8,
      shootRatio: 0.45,
      calcPoints: (p0, pPlayer) => ({
        p0: { x: p0.x, y: p0.y },
        p1: { x: p0.x + (p0.x > W / 2 ? -75 : 75), y: p0.y + 50 },
        p2: { x: pPlayer.x, y: 410 },
        p3: { x: p0.x > W / 2 ? -50 : W + 50, y: H + 50 }
      })
    }
  ];

  /**
   * Calcula el punto final P3 de salida para una trayectoria en etapa de bonificación,
   * permitiendo que los enemigos crucen la pantalla fluidamente de lado a lado o hacia abajo sin detenerse.
   */
  function getBonusExitPos(trajectoryId, slot) {
    const col = (slot && typeof slot.col === 'number') ? slot.col : 3;
    if (trajectoryId && trajectoryId.includes('IZQ')) {
      return { x: W + 65, y: 320 + col * 40 };
    } else if (trajectoryId && trajectoryId.includes('DER')) {
      return { x: -65, y: 320 + col * 40 };
    } else {
      return { x: ((col % 6) + 1) * (W / 7), y: H + 70 };
    }
  }

  // ==========================================================================
  // EXPORTACIÓN MODULAR (NAVEGADOR Y NODE.JS)
  // ==========================================================================
  const OleadasModule = {
    W,
    H,
    evaluateCubicBezier,
    TRAYECTORIAS,
    TIPOS_ENEMIGOS,
    FORMACION_CONFIG,
    PLANTILLAS_OLEADAS,
    DIVE_PROFILES,
    getWaveConfig,
    getBonusExitPos
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OleadasModule;
  }
  if (typeof window !== 'undefined') {
    window.OleadasModule = OleadasModule;
  }
})();
