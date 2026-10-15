/**
 * games/bastion/data/mapas.js - Definición de los 6 mapas expandidos para Bastión (Fase 4: 20x13)
 * 
 * Tipos de Casillas:
 * 0 = Terreno construible estándar (pedestal metálico con relieve 3D)
 * 1 = Camino de enemigos (sendero transitable)
 * 2 = Obstáculo natural intransitable (peñasco, abismo, columnas)
 * 3 = Portal de invasión (Spawn)
 * 4 = Núcleo Arcano (Base a defender)
 * 5 = Plataforma Elevada (+25% alcance a la torre construida encima)
 * 6 = Geoda Elemental (+20% daño a la torre construida encima)
 * 7 = Veta de Cristal Aúrico (+15 oro extra al finalizar cada oleada si hay torre encima)
 * 8 = Escombros Cuánticos (bloquea construcción; se puede despejar pagando 40 oro)
 */
(() => {
  'use strict';

  const MAPAS = [
    // MAPA 1: Valle Prístino (20x13)
    {
      id: 'valle_pristino',
      name: 'Valle Prístino',
      desc: 'Sendero en zig-zag bordeado por peñascos y miradores elevados. Gran superficie para erigir defensas.',
      difficulty: 'Normal',
      cols: 20,
      rows: 13,
      tileSize: 36,
      theme: {
        bg: '#0c131f',
        buildable: '#1e293b',
        buildableBorder: '#38bdf8',
        path: '#78350f',
        pathBorder: '#92400e',
        obstacle: '#0f172a',
        accent: '#38bdf8'
      },
      grid: [
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        [3, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 2],
        [2, 0, 0, 1, 0, 5, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 6, 2],
        [2, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 2],
        [2, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 1, 0, 2],
        [3, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 2],
        [2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 2],
        [2, 0, 1, 0, 5, 1, 1, 1, 1, 0, 0, 8, 0, 1, 1, 1, 1, 1, 0, 2],
        [2, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 6, 7, 0, 0, 2],
        [2, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 2],
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
      ],
      paths: [
        // Flanco Norte (Ruta Principal en Zigzag)
        [
          { c: 0, r: 1 },
          { c: 3, r: 1 },
          { c: 3, r: 3 },
          { c: 7, r: 3 },
          { c: 7, r: 1 },
          { c: 10, r: 1 },
          { c: 10, r: 3 },
          { c: 13, r: 3 },
          { c: 13, r: 1 },
          { c: 16, r: 1 },
          { c: 16, r: 3 },
          { c: 17, r: 3 },
          { c: 17, r: 5 },
          { c: 2, r: 5 },
          { c: 2, r: 8 },
          { c: 5, r: 8 },
          { c: 5, r: 7 },
          { c: 8, r: 7 },
          { c: 8, r: 9 },
          { c: 13, r: 9 },
          { c: 13, r: 10 },
          { c: 17, r: 10 },
          { c: 17, r: 11 }
        ],
        // Flanco Sur (Portal Emboscada que se activa en rondas avanzadas)
        [
          { c: 0, r: 5 },
          { c: 2, r: 5 },
          { c: 2, r: 8 },
          { c: 5, r: 8 },
          { c: 5, r: 7 },
          { c: 8, r: 7 },
          { c: 8, r: 9 },
          { c: 13, r: 9 },
          { c: 13, r: 10 },
          { c: 17, r: 10 },
          { c: 17, r: 11 }
        ]
      ],
      waypoints: [
        { c: 0, r: 1 },
        { c: 3, r: 1 },
        { c: 3, r: 3 },
        { c: 7, r: 3 },
        { c: 7, r: 1 },
        { c: 10, r: 1 },
        { c: 10, r: 3 },
        { c: 13, r: 3 },
        { c: 13, r: 1 },
        { c: 16, r: 1 },
        { c: 16, r: 3 },
        { c: 17, r: 3 },
        { c: 17, r: 5 },
        { c: 2, r: 5 },
        { c: 2, r: 8 },
        { c: 5, r: 8 },
        { c: 5, r: 7 },
        { c: 8, r: 7 },
        { c: 8, r: 9 },
        { c: 13, r: 9 },
        { c: 13, r: 10 },
        { c: 17, r: 10 },
        { c: 17, r: 11 }
      ]
    },

    // MAPA 2: Desfiladero de Obsidiana (20x13 - Dos entradas independientes)
    {
      id: 'desfiladero_obsidiana',
      name: 'Desfiladero de Obsidiana',
      desc: 'Dos rutas de asedio independientes que convergen en una garganta estrecha frente al núcleo.',
      difficulty: 'Avanzado',
      cols: 20,
      rows: 13,
      tileSize: 36,
      theme: {
        bg: '#0a0814',
        buildable: '#1e1b2e',
        buildableBorder: '#818cf8',
        path: '#312e81',
        pathBorder: '#4338ca',
        obstacle: '#030712',
        accent: '#818cf8'
      },
      grid: [
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 2],
        [3, 1, 1, 1, 1, 0, 5, 0, 2, 2, 2, 2, 0, 5, 0, 1, 1, 1, 1, 3],
        [2, 0, 0, 0, 1, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 1, 0, 0, 0, 2],
        [2, 7, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 7, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 2, 0, 5, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 5, 0, 2, 2],
        [2, 0, 0, 1, 1, 1, 1, 1, 1, 6, 6, 1, 1, 1, 1, 1, 1, 0, 0, 2],
        [2, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 2],
        [2, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 8, 0, 1, 1, 0, 8, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
      ],
      paths: [
        // Ruta Noroeste
        [
          { c: 0, r: 2 },
          { c: 4, r: 2 },
          { c: 4, r: 4 },
          { c: 9, r: 4 },
          { c: 9, r: 7 },
          { c: 3, r: 7 },
          { c: 3, r: 9 },
          { c: 9, r: 9 },
          { c: 9, r: 11 }
        ],
        // Ruta Noreste
        [
          { c: 19, r: 2 },
          { c: 15, r: 2 },
          { c: 15, r: 4 },
          { c: 10, r: 4 },
          { c: 10, r: 7 },
          { c: 16, r: 7 },
          { c: 16, r: 9 },
          { c: 10, r: 9 },
          { c: 9, r: 11 }
        ]
      ],
      waypoints: [
        { c: 0, r: 2 },
        { c: 4, r: 2 },
        { c: 4, r: 4 },
        { c: 9, r: 4 },
        { c: 9, r: 7 },
        { c: 3, r: 7 },
        { c: 3, r: 9 },
        { c: 9, r: 9 },
        { c: 9, r: 11 }
      ]
    },

    // MAPA 3: Ruinas del Nexo (20x13 - Gran Espiral Central con Escombros Despejables)
    {
      id: 'ruinas_nexo',
      name: 'Ruinas del Nexo',
      desc: 'El camino serpentea en torno a un atolón central de plataformas elevadas. Excelente para cañones de área.',
      difficulty: 'Desafiante',
      cols: 20,
      rows: 13,
      tileSize: 36,
      theme: {
        bg: '#041315',
        buildable: '#06282b',
        buildableBorder: '#14b8a6',
        path: '#064e3b',
        pathBorder: '#059669',
        obstacle: '#021e20',
        accent: '#2dd4bf'
      },
      grid: [
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        [3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2],
        [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 2],
        [2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 2],
        [2, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 5, 0, 1, 2],
        [2, 1, 0, 0, 1, 5, 8, 6, 8, 4, 6, 1, 0, 0, 0, 1, 0, 0, 1, 2],
        [2, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 2],
        [2, 1, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 7, 1, 2],
        [2, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 2],
        [2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2],
        [3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
      ],
      paths: [
        // Flanco Superior (Espiral Perimetral)
        [
          { c: 0, r: 1 },
          { c: 18, r: 1 },
          { c: 18, r: 11 },
          { c: 1, r: 11 },
          { c: 1, r: 3 },
          { c: 15, r: 3 },
          { c: 15, r: 9 },
          { c: 4, r: 9 },
          { c: 4, r: 5 },
          { c: 11, r: 5 },
          { c: 11, r: 7 },
          { c: 9, r: 7 },
          { c: 9, r: 6 }
        ],
        // Flanco Inferior (Canal de Asedio Rápido en Rondas Avanzadas)
        [
          { c: 0, r: 11 },
          { c: 1, r: 11 },
          { c: 1, r: 3 },
          { c: 15, r: 3 },
          { c: 15, r: 9 },
          { c: 4, r: 9 },
          { c: 4, r: 5 },
          { c: 11, r: 5 },
          { c: 11, r: 7 },
          { c: 9, r: 7 },
          { c: 9, r: 6 }
        ]
      ],
      waypoints: [
        { c: 0, r: 1 },
        { c: 18, r: 1 },
        { c: 18, r: 11 },
        { c: 1, r: 11 },
        { c: 1, r: 3 },
        { c: 15, r: 3 },
        { c: 15, r: 9 },
        { c: 4, r: 9 },
        { c: 4, r: 5 },
        { c: 11, r: 5 },
        { c: 11, r: 7 },
        { c: 9, r: 7 },
        { c: 9, r: 6 }
      ]
    },

    // MAPA 4: Cripta de Cristal (20x13 - Doble ruta simétrica de gran envergadura)
    {
      id: 'cripta_cristal',
      name: 'Cripta de Cristal',
      desc: 'El sendero se bifurca en dos alas simétricas custodiadas por prismas. Las criaturas se dividen equitativamente.',
      difficulty: 'Experto',
      cols: 20,
      rows: 13,
      tileSize: 36,
      theme: {
        bg: '#110b1d',
        buildable: '#24143d',
        buildableBorder: '#c084fc',
        path: '#4c1d95',
        pathBorder: '#7c3aed',
        obstacle: '#090514',
        accent: '#c084fc'
      },
      grid: [
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        [2, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 2],
        [2, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 2],
        [2, 0, 1, 1, 0, 0, 5, 2, 2, 6, 2, 2, 5, 0, 0, 1, 1, 0, 0, 2],
        [3, 1, 1, 0, 0, 0, 0, 2, 2, 0, 2, 2, 0, 0, 0, 0, 1, 1, 0, 2],
        [2, 0, 0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 1, 4, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 4, 2],
        [2, 0, 0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 1, 4, 2],
        [3, 1, 1, 0, 0, 0, 0, 2, 2, 0, 2, 2, 0, 0, 0, 0, 1, 1, 0, 2],
        [2, 0, 1, 1, 0, 0, 5, 2, 2, 6, 2, 2, 5, 0, 0, 1, 1, 0, 0, 2],
        [2, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 2],
        [2, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 2],
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
      ],
      paths: [
        // Ala Norte
        [
          { c: 0, r: 4 },
          { c: 2, r: 4 },
          { c: 2, r: 3 },
          { c: 3, r: 2 },
          { c: 4, r: 1 },
          { c: 14, r: 1 },
          { c: 15, r: 2 },
          { c: 16, r: 3 },
          { c: 17, r: 4 },
          { c: 18, r: 5 }
        ],
        // Ala Sur
        [
          { c: 0, r: 8 },
          { c: 2, r: 8 },
          { c: 2, r: 9 },
          { c: 3, r: 10 },
          { c: 4, r: 11 },
          { c: 14, r: 11 },
          { c: 15, r: 10 },
          { c: 16, r: 9 },
          { c: 17, r: 8 },
          { c: 18, r: 7 }
        ]
      ],
      waypoints: [
        { c: 0, r: 4 },
        { c: 2, r: 4 },
        { c: 2, r: 3 },
        { c: 3, r: 2 },
        { c: 4, r: 1 },
        { c: 14, r: 1 },
        { c: 15, r: 2 },
        { c: 16, r: 3 },
        { c: 17, r: 4 },
        { c: 18, r: 5 }
      ]
    },

    // MAPA 5: Bastión Hundido (20x13 - Fortaleza de Ciénaga con 3 cuellos de botella)
    {
      id: 'bastion_hundido',
      name: 'Bastión Hundido',
      desc: 'Antigua fortificación sumergida con estrechos cuellos de botella y líneas de tiro cruzado.',
      difficulty: 'Maestro',
      cols: 20,
      rows: 13,
      tileSize: 36,
      theme: {
        bg: '#05161c',
        buildable: '#0f2933',
        buildableBorder: '#38bdf8',
        path: '#164e63',
        pathBorder: '#0e7490',
        obstacle: '#030c10',
        accent: '#06b6d4'
      },
      grid: [
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        [3, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 2],
        [2, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 2],
        [2, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2],
        [3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 2],
        [2, 1, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 1, 0, 0, 1, 2],
        [2, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 2],
        [2, 1, 0, 1, 0, 0, 0, 8, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2],
        [2, 1, 1, 1, 0, 7, 0, 0, 0, 1, 0, 7, 0, 1, 1, 1, 1, 1, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 4, 0, 2],
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
      ],
      paths: [
        // Flanco Superior (Ruta Serpentina Norte)
        [
          { c: 0, r: 1 },
          { c: 2, r: 1 },
          { c: 2, r: 3 },
          { c: 5, r: 3 },
          { c: 5, r: 1 },
          { c: 7, r: 1 },
          { c: 7, r: 3 },
          { c: 10, r: 3 },
          { c: 10, r: 1 },
          { c: 12, r: 1 },
          { c: 12, r: 3 },
          { c: 15, r: 3 },
          { c: 15, r: 1 },
          { c: 17, r: 1 },
          { c: 17, r: 3 },
          { c: 19, r: 3 },
          { c: 19, r: 5 },
          { c: 1, r: 5 },
          { c: 1, r: 9 },
          { c: 3, r: 9 },
          { c: 3, r: 7 },
          { c: 11, r: 7 },
          { c: 11, r: 9 },
          { c: 9, r: 9 },
          { c: 9, r: 11 },
          { c: 17, r: 11 }
        ],
        // Flanco Medio (Canal Central en Rondas Avanzadas)
        [
          { c: 0, r: 5 },
          { c: 1, r: 5 },
          { c: 1, r: 9 },
          { c: 3, r: 9 },
          { c: 3, r: 7 },
          { c: 11, r: 7 },
          { c: 11, r: 9 },
          { c: 9, r: 9 },
          { c: 9, r: 11 },
          { c: 17, r: 11 }
        ]
      ],
      waypoints: [
        { c: 0, r: 1 },
        { c: 2, r: 1 },
        { c: 2, r: 3 },
        { c: 5, r: 3 },
        { c: 5, r: 1 },
        { c: 7, r: 1 },
        { c: 7, r: 3 },
        { c: 10, r: 3 },
        { c: 10, r: 1 },
        { c: 12, r: 1 },
        { c: 12, r: 3 },
        { c: 15, r: 3 },
        { c: 15, r: 1 },
        { c: 17, r: 1 },
        { c: 17, r: 3 },
        { c: 19, r: 3 },
        { c: 19, r: 5 },
        { c: 1, r: 5 },
        { c: 1, r: 9 },
        { c: 3, r: 9 },
        { c: 3, r: 7 },
        { c: 11, r: 7 },
        { c: 11, r: 9 },
        { c: 9, r: 9 },
        { c: 9, r: 11 },
        { c: 17, r: 11 }
      ]
    },

    // MAPA 6: Núcleo del Cataclismo (20x13 - Triple Portal Monumental Convergente)
    {
      id: 'nucleo_cataclismo',
      name: 'Núcleo del Cataclismo',
      desc: 'El desafío definitivo: tres portales dimensionales convergen implacablemente sobre el Núcleo central.',
      difficulty: 'Pesadilla',
      cols: 20,
      rows: 13,
      tileSize: 36,
      theme: {
        bg: '#1a050d',
        buildable: '#330a18',
        buildableBorder: '#f43f5e',
        path: '#881337',
        pathBorder: '#be123c',
        obstacle: '#0d0206',
        accent: '#fb7185'
      },
      grid: [
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [3, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 3],
        [2, 0, 0, 0, 1, 0, 0, 5, 0, 1, 0, 5, 0, 0, 1, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 2],
        [2, 0, 6, 0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0, 6, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 1, 1, 4, 1, 1, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 6, 0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0, 6, 0, 0, 2],
        [2, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 2],
        [2, 0, 7, 0, 1, 0, 0, 5, 0, 1, 0, 5, 0, 0, 1, 0, 7, 0, 0, 2],
        [2, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2],
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
      ],
      paths: [
        // Entrada Oeste
        [
          { c: 0, r: 3 },
          { c: 4, r: 3 },
          { c: 4, r: 5 },
          { c: 6, r: 5 },
          { c: 7, r: 7 },
          { c: 9, r: 7 }
        ],
        // Entrada Este
        [
          { c: 19, r: 3 },
          { c: 14, r: 3 },
          { c: 14, r: 5 },
          { c: 12, r: 5 },
          { c: 11, r: 7 },
          { c: 9, r: 7 }
        ],
        // Entrada Norte
        [
          { c: 9, r: 0 },
          { c: 9, r: 7 }
        ]
      ],
      waypoints: [
        { c: 0, r: 3 },
        { c: 4, r: 3 },
        { c: 4, r: 5 },
        { c: 6, r: 5 },
        { c: 7, r: 7 },
        { c: 9, r: 7 }
      ]
    }
  ];

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MAPAS };
  } else {
    window.BASTION_MAPAS = MAPAS;
  }
})();
