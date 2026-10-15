/**
 * games/cargas/game.js - Cargas Arcade 90s Industrial
 * Laberinto táctico con cargas de resonancia en rombo (distancia Manhattan),
 * empuje y deslizamiento de núcleos, cadenas de resonancia, 3 mundos con mecánicas
 * propias (hielo, cintas transportadoras, teletransportes, compuertas e interruptores,
 * bloques regenerativos), IA con pathfinding BFS y evasión inteligente,
 * 3 jefes de mundo, tienda de mejoras, 11 logros, almacenamiento versionado cargas:v2,
 * corner-slipping táctil para pulgar, audio sintetizado generativo y modo debug ?debug=1.
 */
(() => {
  'use strict';

  // ==========================================
  // 1. CONFIGURACIÓN Y BALANCE GENERAL
  // ==========================================
  const CONFIG = {
    COLS: 11,
    ROWS: 13,
    TILE_SIZE: 30,
    VIRTUAL_W: 330, // 11 * 30
    VIRTUAL_H: 390, // 13 * 30

    BASE_PLAYER_SPEED: 4.2, // celdas por segundo
    CHARGE_FUSE_TIME: 2.7, // segundos antes de detonación automática
    BASE_CHARGE_SLIDE_SPEED: 9.5, // celdas por segundo al ser empujada
    DEFAULT_BLAST_RADIUS: 2, // radio Manhattan
    MAX_BLAST_RADIUS: 5,
    DEFAULT_MAX_CHARGES: 1,
    MAX_CHARGES_LIMIT: 4,
    BLAST_DURATION: 0.42, // duración visible de la onda en segundos
    INVULNERABILITY_TIME: 2.2,
    REGEN_BLOCK_TIME: 8.0, // segundos para reaparición de bloques nanotecnológicos

    STARTING_LIVES: 3,
    STORAGE_KEY: 'cargas:v2',
    LEGACY_STORAGE_KEY: 'cargas:v1:best_score',

    // Mundos temáticos
    WORLDS: [
      { id: 1, name: "Sector Industrial Alfa", theme: "industrial", color: "#f59e0b", levels: [1, 10] },
      { id: 2, name: "Criocámaras y Cintas", theme: "cryo", color: "#06b6d4", levels: [11, 20] },
      { id: 3, name: "Núcleo Cuántico", theme: "quantum", color: "#a855f7", levels: [21, 30] }
    ],

    // ==========================================
    // 30 NIVELES DE DISEÑO COMO DATOS (11x13)
    // Símbolos:
    // '#' = Pilar Indestructible
    // '.' = Piso Normal
    // 'B' = Bloque Blando Destructible
    // 'R' = Bloque Regenerativo Nanotecnológico
    // 'I' = Hielo (resbaladizo, baja fricción)
    // '^', 'v', '<', '>' = Cintas Transportadoras direccionales
    // 'S' = Interruptor de Presión
    // 'D' = Compuerta de Seguridad (cerrada por defecto)
    // 'T' = Teletransportador Cuántico
    // '1' = Spawn Jugador 1
    // '2' = Spawn Jugador 2
    // 'X' = Portal de Extracción / Salida
    // 'p' = Patrullero
    // 'h' = Cazador (busca al jugador)
    // 'a' = Blindado (2 puntos de vida)
    // 'c' = Constructor
    // 'G' = Jefe Mundo 1: Titán Giróscopo MK-II
    // 'C' = Jefe Mundo 2: Coloso Criogénico
    // 'K' = Jefe Mundo 3: Núcleo Arconte Supremo
    // ==========================================
    LEVELS: [
      // --- MUNDO 1: SECTOR INDUSTRIAL ALFA (1-10) ---
      {
        id: 1, world: 1, name: "Entrada Alfa", targetTime: 50,
        map: [
          "###########",
          "#1..B.B..2#",
          "#.#.#.#.#.#",
          "#B.Bp.B.B.B#",
          "#.#B#B#B#.#",
          "#..B.B.B..#",
          "#.#.#.#.#.#",
          "#B.Bp.B.B.B#",
          "#.#B#B#B#.#",
          "#..B.p.B.X#",
          "#.#.#.#.#.#",
          "#B.B...B.B#",
          "###########"
        ]
      },
      {
        id: 2, world: 1, name: "Depósito Ferroso", targetTime: 55,
        map: [
          "###########",
          "#1..B.B..2#",
          "#.#B#.#B#.#",
          "#B..p..B.B#",
          "#.#B#B#B#.#",
          "#..B.h.B..#",
          "#.#.#.#.#.#",
          "#B.B.p.B.B#",
          "#.#B#B#B#.#",
          "#B.B...B.X#",
          "#.#.#.#.#.#",
          "#..B.B.B..#",
          "###########"
        ]
      },
      {
        id: 3, world: 1, name: "Subterráneo Pesado", targetTime: 60,
        map: [
          "###########",
          "#1..B.B..2#",
          "#.#.#.#.#.#",
          "#B.B.a.B.B#",
          "#.#B#B#B#.#",
          "#..B.h.B..#",
          "#.#.#.#.#.#",
          "#B.B.p.B.B#",
          "#.#B#B#B#.#",
          "#X.B.p.B..#",
          "#.#.#.#.#.#",
          "#..B.B.B..#",
          "###########"
        ]
      },
      {
        id: 4, world: 1, name: "Fundición Nuclear", targetTime: 60,
        map: [
          "###########",
          "#1..B.B..2#",
          "#.#B#.#B#.#",
          "#B.B.c.B.B#",
          "#.#B#B#B#.#",
          "#..B.a.B..#",
          "#.#.#.#.#.#",
          "#B.B.h.B.B#",
          "#.#B#B#B#.#",
          "#..B.p.B.X#",
          "#.#B#.#B#.#",
          "#..B.B.B..#",
          "###########"
        ]
      },
      {
        id: 5, world: 1, name: "Bloques Nanomórficos", targetTime: 60,
        map: [
          "###########",
          "#1..R.R..2#",
          "#.#.#.#.#.#",
          "#R.R.h.R.R#",
          "#.#R#R#R#.#",
          "#..R.a.R..#",
          "#.#.#.#.#.#",
          "#R.R.p.R.R#",
          "#.#R#R#R#.#",
          "#X.R.c.R..#",
          "#.#.#.#.#.#",
          "#..R.R.R..#",
          "###########"
        ]
      },
      {
        id: 6, world: 1, name: "Corredores Blindados", targetTime: 65,
        map: [
          "###########",
          "#1..B.B..2#",
          "#.#B#.#B#.#",
          "#B.B.a.B.B#",
          "#.#B#B#B#.#",
          "#..B.a.B..#",
          "#.#.#.#.#.#",
          "#B.B.h.B.B#",
          "#.#B#B#B#.#",
          "#..B.c.B.X#",
          "#.#B#.#B#.#",
          "#..B.B.B..#",
          "###########"
        ]
      },
      {
        id: 7, world: 1, name: "Malla de Resonancia", targetTime: 65,
        map: [
          "###########",
          "#1..R.B..2#",
          "#.#.#.#.#.#",
          "#B.R.h.R.B#",
          "#.#B#R#B#.#",
          "#..B.a.B..#",
          "#.#.#.#.#.#",
          "#R.B.h.B.R#",
          "#.#R#B#R#.#",
          "#X.B.p.B..#",
          "#.#.#.#.#.#",
          "#..R.B.R..#",
          "###########"
        ]
      },
      {
        id: 8, world: 1, name: "Arsenal Central", targetTime: 70,
        map: [
          "###########",
          "#1..B.B..2#",
          "#.#B#B#B#.#",
          "#B.B.a.B.B#",
          "#.#.#.#.#.#",
          "#..B.h.B..#",
          "#.#B#B#B#.#",
          "#B.B.h.B.B#",
          "#.#.#.#.#.#",
          "#..B.c.B.X#",
          "#.#B#B#B#.#",
          "#..B.a.B..#",
          "###########"
        ]
      },
      {
        id: 9, world: 1, name: "Subestación de Carga", targetTime: 70,
        map: [
          "###########",
          "#1..R.R..2#",
          "#.#B#B#B#.#",
          "#R.B.a.B.R#",
          "#.#B#.#B#.#",
          "#..R.h.R..#",
          "#.#.#.#.#.#",
          "#R.B.a.B.R#",
          "#.#B#.#B#.#",
          "#X.R.h.R..#",
          "#.#B#.#B#.#",
          "#..B.R.B..#",
          "###########"
        ]
      },
      {
        id: 10, world: 1, name: "Cámara del Titán", targetTime: 90, isBoss: true, bossType: 'titan',
        map: [
          "###########",
          "#1...B...2#",
          "#.B#...#B.#",
          "#B.......B#",
          "#.B..R..B.#",
          "#....G....#",
          "#.B..R..B.#",
          "#B.......B#",
          "#.B.....B.#",
          "#.B#...#B.#",
          "#..B.X.B..#",
          "#...B.B...#",
          "###########"
        ]
      },

      // --- MUNDO 2: CRIOCÁMARAS Y CINTAS MAGNÉTICAS (11-20) ---
      {
        id: 11, world: 2, name: "Criogenia Inicial", targetTime: 60,
        map: [
          "###########",
          "#1..I.I..2#",
          "#.#.#.#.#.#",
          "#I.Ip.I.I.I#",
          "#.#I#I#I#.#",
          "#..I.h.I..#",
          "#.#.#.#.#.#",
          "#I.Ip.I.I.I#",
          "#.#I#I#I#.#",
          "#..I.p.I.X#",
          "#.#.#.#.#.#",
          "#I.I...I.I#",
          "###########"
        ]
      },
      {
        id: 12, world: 2, name: "Pistas Resbaladizas", targetTime: 65,
        map: [
          "###########",
          "#1..B.B..2#",
          "#.#I#I#I#.#",
          "#B.I.h.I.B#",
          "#.#I#.#I#.#",
          "#..I.a.I..#",
          "#.#.#.#.#.#",
          "#B.I.p.I.B#",
          "#.#I#.#I#.#",
          "#X.I.h.I..#",
          "#.#I#I#I#.#",
          "#..B.B.B..#",
          "###########"
        ]
      },
      {
        id: 13, world: 2, name: "Cintas Transportadoras", targetTime: 65,
        map: [
          "###########",
          "#1..B.B..2#",
          "#.#.#.#.#.#",
          "#B>>>>>>B.B#",
          "#.#B#.#B#.#",
          "#..B.h.B..#",
          "#.#.#.#.#.#",
          "#B.B<<<<<<B#",
          "#.#B#.#B#.#",
          "#..B.p.B.X#",
          "#.#.#.#.#.#",
          "#..B.B.B..#",
          "###########"
        ]
      },
      {
        id: 14, world: 2, name: "Cintas Cruzadas", targetTime: 70,
        map: [
          "###########",
          "#1..B.B..2#",
          "#.#v#.#^#.#",
          "#B.v.a.^.B#",
          "#.#v#B#^#.#",
          "#..v.h.^..#",
          "#.#.#.#.#.#",
          "#B>>>>>>B.B#",
          "#.#B#B#B#.#",
          "#X.B.p.B..#",
          "#.#B#.#B#.#",
          "#..B.B.B..#",
          "###########"
        ]
      },
      {
        id: 15, world: 2, name: "Glaciar Mecánico", targetTime: 70,
        map: [
          "###########",
          "#1..I.I..2#",
          "#.#I#I#I#.#",
          "#I.I.a.I.I#",
          "#.#B#I#B#.#",
          "#..I.h.I..#",
          "#.#I#I#I#.#",
          "#I.I.c.I.I#",
          "#.#B#I#B#.#",
          "#..I.h.I.X#",
          "#.#I#I#I#.#",
          "#..I.I.I..#",
          "###########"
        ]
      },
      {
        id: 16, world: 2, name: "Circuito de Cintas", targetTime: 70,
        map: [
          "###########",
          "#1..B.B..2#",
          "#.#v#.#^#.#",
          "#B.v.h.^.B#",
          "#.#v#.#^#.#",
          "#B<<<<<<B.B#",
          "#.#.#.#.#.#",
          "#B>>>>>>B.B#",
          "#.#v#.#^#.#",
          "#X.v.a.^..#",
          "#.#v#.#^#.#",
          "#..B.B.B..#",
          "###########"
        ]
      },
      {
        id: 17, world: 2, name: "Pistas Heladas Duales", targetTime: 75,
        map: [
          "###########",
          "#1..I.B..2#",
          "#.#I#B#I#.#",
          "#I.I.a.B.B#",
          "#.#I#B#I#.#",
          "#..I.h.I..#",
          "#.#.#.#.#.#",
          "#B.B.h.I.I#",
          "#.#I#B#I#.#",
          "#..B.c.I.X#",
          "#.#I#B#I#.#",
          "#..I.B.I..#",
          "###########"
        ]
      },
      {
        id: 18, world: 2, name: "Transporte de Resonancia", targetTime: 75,
        map: [
          "###########",
          "#1..R.R..2#",
          "#.#^#.#v#.#",
          "#R.^.h.v.R#",
          "#.#^#R#v#.#",
          "#..^.a.v..#",
          "#.#.#.#.#.#",
          "#R>>>>>>R.R#",
          "#.#R#R#R#.#",
          "#X.R.c.R..#",
          "#.#.#.#.#.#",
          "#..R.R.R..#",
          "###########"
        ]
      },
      {
        id: 20 - 1, world: 2, name: "Cámara Crio-Magnética", targetTime: 80,
        map: [
          "###########",
          "#1..I.I..2#",
          "#.#v#I#^#.#",
          "#I.v.a.^.I#",
          "#.#v#I#^#.#",
          "#..v.h.^..#",
          "#.#.#.#.#.#",
          "#I.I.a.I.I#",
          "#.#I#I#I#.#",
          "#..I.h.I.X#",
          "#.#I#I#I#.#",
          "#..I.I.I..#",
          "###########"
        ]
      },
      {
        id: 20, world: 2, name: "Cámara del Coloso Criogénico", targetTime: 100, isBoss: true, bossType: 'cryo',
        map: [
          "###########",
          "#1...I...2#",
          "#.I#...#I.#",
          "#I.......I#",
          "#.I.>>>.I.#",
          "#....C....#",
          "#.I.<<<.I.#",
          "#I.......I#",
          "#.I.....I.#",
          "#.I#...#I.#",
          "#..I.X.I..#",
          "#...I.I...#",
          "###########"
        ]
      },

      // --- MUNDO 3: NÚCLEO CUÁNTICO Y COMPUERTAS (21-30) ---
      {
        id: 21, world: 3, name: "Compuertas de Seguridad", targetTime: 65,
        map: [
          "###########",
          "#1..S.B..2#",
          "#.#.#D#.#.#",
          "#B.B...B.B#",
          "#.#B#B#B#.#",
          "#..B.h.B..#",
          "#.#.#.#.#.#",
          "#B.B.a.B.B#",
          "#.#B#D#B#.#",
          "#..B...B.X#",
          "#.#.#.#.#.#",
          "#..B.S.B..#",
          "###########"
        ]
      },
      {
        id: 22, world: 3, name: "Enlace Teletransportador", targetTime: 70,
        map: [
          "###########",
          "#1..T.B..2#",
          "#.#.#.#.#.#",
          "#B.B.h.B.B#",
          "#.#B#B#B#.#",
          "#..B...B..#",
          "#.#.#T#.#.#",
          "#B.B.a.B.B#",
          "#.#B#B#B#.#",
          "#..B.p.B.X#",
          "#.#.#.#.#.#",
          "#..B.B.B..#",
          "###########"
        ]
      },
      {
        id: 23, world: 3, name: "Matriz Cuántica", targetTime: 70,
        map: [
          "###########",
          "#1..B.B..2#",
          "#.#D#.#D#.#",
          "#B.S.h.S.B#",
          "#.#.#.#.#.#",
          "#..B.a.B..#",
          "#.#T#.#T#.#",
          "#B.B.h.B.B#",
          "#.#D#.#D#.#",
          "#X.B...B..#",
          "#.#.#.#.#.#",
          "#..B.B.B..#",
          "###########"
        ]
      },
      {
        id: 24, world: 3, name: "Celdas de Contención", targetTime: 75,
        map: [
          "###########",
          "#1..S.R..2#",
          "#.#D#.#D#.#",
          "#R.R.h.R.R#",
          "#.#R#D#R#.#",
          "#..R.a.R..#",
          "#.#T#.#T#.#",
          "#R.R.h.R.R#",
          "#.#R#D#R#.#",
          "#..R.S.R.X#",
          "#.#D#.#D#.#",
          "#..R.R.R..#",
          "###########"
        ]
      },
      {
        id: 25, world: 3, name: "Laberinto de Teleportes", targetTime: 75,
        map: [
          "###########",
          "#1..T.B..2#",
          "#.#B#.#B#.#",
          "#B.B.a.B.B#",
          "#.#.#T#.#.#",
          "#..B.h.B..#",
          "#.#T#.#T#.#",
          "#B.B.c.B.B#",
          "#.#.#T#.#.#",
          "#X.B.h.B..#",
          "#.#B#.#B#.#",
          "#..B.B.B..#",
          "###########"
        ]
      },
      {
        id: 26, world: 3, name: "Compuertas en Serie", targetTime: 80,
        map: [
          "###########",
          "#1..B.S..2#",
          "#.#D#B#D#.#",
          "#B.B.h.B.B#",
          "#.#B#D#B#.#",
          "#..S.a.S..#",
          "#.#.#.#.#.#",
          "#B.B.h.B.B#",
          "#.#D#B#D#.#",
          "#..B.c.B.X#",
          "#.#.#.#.#.#",
          "#..B.S.B..#",
          "###########"
        ]
      },
      {
        id: 27, world: 3, name: "Red Mixta Magnética", targetTime: 80,
        map: [
          "###########",
          "#1..I.T..2#",
          "#.#v#.#^#.#",
          "#I.v.h.^.I#",
          "#.#D#S#D#.#",
          "#..I.a.I..#",
          "#.#T#.#T#.#",
          "#I>>>>>>I.I#",
          "#.#D#S#D#.#",
          "#X.I.h.I..#",
          "#.#.#.#.#.#",
          "#..I.T.I..#",
          "###########"
        ]
      },
      {
        id: 28, world: 3, name: "Brecha Cuántica", targetTime: 85,
        map: [
          "###########",
          "#1..R.B..2#",
          "#.#B#D#B#.#",
          "#R.S.h.S.R#",
          "#.#T#.#T#.#",
          "#..B.a.B..#",
          "#.#D#.#D#.#",
          "#R.B.h.B.R#",
          "#.#T#.#T#.#",
          "#..R.c.R.X#",
          "#.#B#D#B#.#",
          "#..R.B.R..#",
          "###########"
        ]
      },
      {
        id: 29, world: 3, name: "Antecámara del Arconte", targetTime: 85,
        map: [
          "###########",
          "#1..B.B..2#",
          "#.#D#D#D#.#",
          "#B.S.a.S.B#",
          "#.#T#.#T#.#",
          "#..B.h.B..#",
          "#.#.#.#.#.#",
          "#B.S.a.S.B#",
          "#.#T#.#T#.#",
          "#X.B.h.B..#",
          "#.#D#D#D#.#",
          "#..B.B.B..#",
          "###########"
        ]
      },
      {
        id: 30, world: 3, name: "Trono del Arconte Supremo", targetTime: 120, isBoss: true, bossType: 'archon',
        map: [
          "###########",
          "#1...R...2#",
          "#.R#...#R.#",
          "#R...T...R#",
          "#.R.>>>.R.#",
          "#....K....#",
          "#.R.<<<.R.#",
          "#R...T...R#",
          "#.R.....R.#",
          "#.R#...#R.#",
          "#..R.X.R..#",
          "#...R.R...#",
          "###########"
        ]
      }
    ]
  };

  // ==========================================
  // 2. ALGORITMOS PUROS Y LÓGICA DE JUEGO (CargasLogic)
  // ==========================================
  const CargasLogic = {
    /**
     * Parsea un mapa 11x13 y extrae entidades y mecánicas
     */
    parseMap(mapStrings) {
      const rows = mapStrings.length;
      const cols = mapStrings[0].length;
      const grid = [];
      let p1Start = { r: 1, c: 1 };
      let p2Start = { r: 1, c: cols - 2 };
      let portal = { r: rows - 2, c: cols - 2 };
      const guardians = [];
      let boss = null;
      const teleporters = [];
      const switches = [];
      const doors = [];
      const conveyors = [];
      const regenBlocks = [];

      for (let r = 0; r < rows; r++) {
        grid[r] = [];
        for (let c = 0; c < cols; c++) {
          const ch = mapStrings[r][c];

          if (ch === '#') {
            grid[r][c] = 1; // Pilar indestructible
          } else if (ch === 'B') {
            grid[r][c] = 2; // Bloque blando destructible
          } else if (ch === 'R') {
            grid[r][c] = 2; // Bloque blando (regenerativo)
            regenBlocks.push({ r, c, active: true, timer: 0 });
          } else if (ch === 'I') {
            grid[r][c] = 3; // Suelo de Hielo
          } else if (ch === '^') {
            grid[r][c] = 4; // Cinta transportadora Arriba
            conveyors.push({ r, c, dir: { r: -1, c: 0 } });
          } else if (ch === 'v') {
            grid[r][c] = 5; // Cinta transportadora Abajo
            conveyors.push({ r, c, dir: { r: 1, c: 0 } });
          } else if (ch === '<') {
            grid[r][c] = 6; // Cinta transportadora Izquierda
            conveyors.push({ r, c, dir: { r: 0, c: -1 } });
          } else if (ch === '>') {
            grid[r][c] = 7; // Cinta transportadora Derecha
            conveyors.push({ r, c, dir: { r: 0, c: 1 } });
          } else if (ch === 'D') {
            grid[r][c] = 8; // Compuerta de seguridad (cerrada inicialmente = obstáculo)
            doors.push({ r, c, open: false });
          } else if (ch === 'S') {
            grid[r][c] = 9; // Interruptor de presión
            switches.push({ r, c, pressed: false });
          } else if (ch === 'T') {
            grid[r][c] = 10; // Teletransportador cuántico
            teleporters.push({ r, c });
          } else {
            grid[r][c] = 0; // Suelo normal
            if (ch === '1') p1Start = { r, c };
            else if (ch === '2') p2Start = { r, c };
            else if (ch === 'X') portal = { r, c };
            else if (ch === 'p') guardians.push({ type: 'patrol', r, c, hp: 1 });
            else if (ch === 'h') guardians.push({ type: 'hunter', r, c, hp: 1 });
            else if (ch === 'a') guardians.push({ type: 'armored', r, c, hp: 2 });
            else if (ch === 'c') guardians.push({ type: 'builder', r, c, hp: 1 });
            else if (ch === 'G') boss = { type: 'titan', r, c, hp: 5, maxHp: 5 };
            else if (ch === 'C') boss = { type: 'cryo', r, c, hp: 6, maxHp: 6 };
            else if (ch === 'K') boss = { type: 'archon', r, c, hp: 8, maxHp: 8 };
          }
        }
      }

      // Emparejar teletransportadores de dos en dos
      const teleporterPairs = new Map();
      if (teleporters.length >= 2) {
        for (let i = 0; i < teleporters.length; i += 2) {
          if (teleporters[i + 1]) {
            const kA = `${teleporters[i].r},${teleporters[i].c}`;
            const kB = `${teleporters[i + 1].r},${teleporters[i + 1].c}`;
            teleporterPairs.set(kA, teleporters[i + 1]);
            teleporterPairs.set(kB, teleporters[i]);
          }
        }
      }

      return {
        rows,
        cols,
        grid,
        p1Start,
        p2Start,
        portal,
        guardians,
        boss,
        teleporters,
        teleporterPairs,
        switches,
        doors,
        conveyors,
        regenBlocks
      };
    },

    /**
     * Comprueba si una celda es transitable para entidades normales
     */
    isPassable(grid, r, c, doors = []) {
      if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) return false;
      const tile = grid[r][c];
      if (tile === 1 || tile === 2) return false; // Pilar o Bloque blando
      if (tile === 8) { // Compuerta
        const door = doors.find(d => d.r === r && d.c === c);
        if (door && !door.open) return false;
      }
      return true;
    },

    /**
     * Onda expansiva en forma de rombo/diamante (Distancia Manhattan <= radius).
     * Se detiene ante pilares indestructibles y compuertas cerradas.
     * Destruye bloques blandos (2) y es absorbida por ellos (no propaga más allá).
     */
    calculateDiamondBlast(grid, r0, c0, radius, doors = []) {
      const rows = grid.length;
      const cols = grid[0].length;
      const visited = new Set();
      const blastCells = [];
      const destroyedBlocks = [];
      const hitSwitches = [];

      const queue = [{ r: r0, c: c0, dist: 0 }];
      visited.add(`${r0},${c0}`);

      while (queue.length > 0) {
        const cur = queue.shift();
        blastCells.push({ r: cur.r, c: cur.c, dist: cur.dist });

        if (cur.dist < radius) {
          const dirs = [
            { r: -1, c: 0 },
            { r: 1, c: 0 },
            { r: 0, c: -1 },
            { r: 0, c: 1 }
          ];

          for (const d of dirs) {
            const nr = cur.r + d.r;
            const nc = cur.c + d.c;
            const key = `${nr},${nc}`;

            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            if (visited.has(key)) continue;
            visited.add(key);

            const tile = grid[nr][nc];

            // 1. Pilar indestructible detiene la onda completamente
            if (tile === 1) {
              continue;
            }

            // 2. Compuerta cerrada detiene la onda
            if (tile === 8) {
              const door = doors.find(dr => dr.r === nr && dr.c === nc);
              if (door && !door.open) continue;
            }

            // 3. Interruptor de presión activado por onda
            if (tile === 9) {
              hitSwitches.push({ r: nr, c: nc });
            }

            // 4. Bloque blando es destruido y absorbe la onda
            if (tile === 2) {
              blastCells.push({ r: nr, c: nc, dist: cur.dist + 1 });
              destroyedBlocks.push({ r: nr, c: nc });
            } else {
              // Celda transitable: la onda continúa expandiéndose
              queue.push({ r: nr, c: nc, dist: cur.dist + 1 });
            }
          }
        }
      }

      return { blastCells, destroyedBlocks, hitSwitches };
    },

    /**
     * Simula el empuje y deslizamiento continuo de una carga.
     * Se detiene ante pilares, bloques blandos, compuertas cerradas y OTRAS CARGAS.
     * Maneja teletransportes y cintas transportadoras.
     */
    simulateSlide(grid, chargeR, chargeC, dirR, dirC, guardians = [], otherCharges = [], teleporterPairs = new Map(), doors = []) {
      const rows = grid.length;
      const cols = grid[0].length;
      let curR = chargeR;
      let curC = chargeC;
      let curDirR = dirR;
      let curDirC = dirC;
      const crushedGuardians = [];
      let maxSteps = 40; // Evitar bucles infinitos con teleportes

      while (maxSteps-- > 0) {
        let nextR = curR + curDirR;
        let nextC = curC + curDirC;

        if (nextR < 0 || nextR >= rows || nextC < 0 || nextC >= cols) break;

        // Comprobar obstáculos de terreno
        const tile = grid[nextR][nextC];
        if (tile === 1 || tile === 2) break; // Pilar o Bloque blando
        if (tile === 8) {
          const door = doors.find(d => d.r === nextR && d.c === nextC);
          if (door && !door.open) break;
        }

        // Comprobar colisión con OTRA CARGA existente (para evitar atravesarse)
        const hitCharge = otherCharges.some(ch => !ch.detonated && ch.r === nextR && ch.c === nextC);
        if (hitCharge) break;

        curR = nextR;
        curC = nextC;

        // Aplastar guardianes en la trayectoria
        for (const g of guardians) {
          if (!g.destroyed && g.r === curR && g.c === curC) {
            g.destroyed = true;
            crushedGuardians.push(g);
          }
        }

        // Interacción con Teletransportador cuántico
        const tKey = `${curR},${curC}`;
        if (teleporterPairs && teleporterPairs.has(tKey)) {
          const partner = teleporterPairs.get(tKey);
          // Verificar que el punto de salida esté despejado
          const partnerTile = grid[partner.r][partner.c];
          if (partnerTile !== 1 && partnerTile !== 2) {
            curR = partner.r;
            curC = partner.c;
          }
        }

        // Interacción con Cinta transportadora
        const currentTile = grid[curR][curC];
        if (currentTile === 4) { curDirR = -1; curDirC = 0; }
        else if (currentTile === 5) { curDirR = 1; curDirC = 0; }
        else if (currentTile === 6) { curDirR = 0; curDirC = -1; }
        else if (currentTile === 7) { curDirR = 0; curDirC = 1; }
      }

      return { finalR: curR, finalC: curC, crushedGuardians };
    },

    /**
     * Resonancia en cadena: detona cualquier carga dentro del alcance de otra.
     * Actualiza la cuadrícula de simulación dinámicamente para que las ondas
     * posteriores se propaguen por los bloques blandos destruidos en el mismo instante.
     */
    resolveChainDetonations(charges, baseGrid, doors = []) {
      // Clonar cuadrícula para la resolución dinámica de la cadena
      const simGrid = baseGrid.map(row => [...row]);
      const detonatedSet = new Set();
      const blastCells = [];
      const destroyedBlocks = [];
      const chainList = [];

      const queue = [];
      for (const ch of charges) {
        if ((ch.timer <= 0 || ch.triggered) && !ch.detonated) {
          queue.push(ch);
          detonatedSet.add(ch.id);
          ch.detonated = true;
        }
      }

      let comboCount = 0;

      while (queue.length > 0) {
        const current = queue.shift();
        comboCount++;
        chainList.push(current);

        const blast = this.calculateDiamondBlast(simGrid, current.r, current.c, current.radius, doors);
        blastCells.push(...blast.blastCells);

        // Destruir bloques en la cuadrícula de simulación de inmediato
        for (const blk of blast.destroyedBlocks) {
          if (simGrid[blk.r][blk.c] === 2) {
            simGrid[blk.r][blk.c] = 0; // Despejado para ondas siguientes en la misma cadena
            destroyedBlocks.push(blk);
          }
        }

        // Comprobar si la onda alcanzó a otras cargas no detonadas
        for (const cell of blast.blastCells) {
          for (const other of charges) {
            if (!detonatedSet.has(other.id) && !other.detonated) {
              if (other.r === cell.r && other.c === cell.c) {
                detonatedSet.add(other.id);
                other.detonated = true;
                other.triggered = true;
                queue.push(other);
              }
            }
          }
        }
      }

      return {
        chainList,
        comboCount,
        blastCells,
        destroyedBlocks
      };
    },

    /**
     * Evasión inteligente con BFS: encuentra la celda segura más cercana
     * que esté completamente fuera de cualquier radio de peligro inmediato.
     * Resuelve el fallo donde los guardianes caminaban hacia la bomba en callejones.
     */
    getGuardianEvadeMove(grid, guardianR, guardianC, charges, doors = []) {
      const rows = grid.length;
      const cols = grid[0].length;
      const dangerMap = new Map();

      // Identificar todas las celdas en peligro de bombas activas
      for (const ch of charges) {
        if (!ch.detonated && ch.timer <= 1.2) {
          const blast = this.calculateDiamondBlast(grid, ch.r, ch.c, ch.radius, doors);
          for (const cell of blast.blastCells) {
            dangerMap.set(`${cell.r},${cell.c}`, true);
          }
        }
      }

      // Si el guardián no está en una celda de peligro, no necesita evadir
      if (!dangerMap.has(`${guardianR},${guardianC}`)) {
        return { shouldEvade: false, dir: { r: 0, c: 0 } };
      }

      // BFS para encontrar la celda segura (safe cell) alcanzable más cercana
      const queue = [{ r: guardianR, c: guardianC, firstStep: null }];
      const visited = new Set([`${guardianR},${guardianC}`]);
      let chosenDir = null;

      const dirs = [
        { r: -1, c: 0 },
        { r: 1, c: 0 },
        { r: 0, c: -1 },
        { r: 0, c: 1 }
      ];

      while (queue.length > 0) {
        const cur = queue.shift();

        // Si encontramos una celda transitable que NO está en peligro
        if (!dangerMap.has(`${cur.r},${cur.c}`) && cur.firstStep) {
          chosenDir = cur.firstStep;
          break;
        }

        for (const d of dirs) {
          const nr = cur.r + d.r;
          const nc = cur.c + d.c;
          const key = `${nr},${nc}`;

          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          if (visited.has(key)) continue;
          if (!this.isPassable(grid, nr, nc, doors)) continue;

          visited.add(key);
          const firstStep = cur.firstStep || d;
          queue.push({ r: nr, c: nc, firstStep });
        }
      }

      return {
        shouldEvade: true,
        dir: chosenDir || { r: 0, c: 0 }
      };
    },

    /**
     * Búsqueda de caminos BFS para el Cazador mecánico hacia el jugador.
     * Evita movimientos aleatorios erráticos.
     */
    getHunterMove(grid, hunterR, hunterC, targetR, targetC, charges = [], doors = []) {
      const rows = grid.length;
      const cols = grid[0].length;

      // Obstáculos dinámicos: cargas armadas no se pueden atravesar
      const chargeSet = new Set(charges.filter(c => !c.detonated).map(c => `${c.r},${c.c}`));

      const queue = [{ r: hunterR, c: hunterC, firstStep: null }];
      const visited = new Set([`${hunterR},${hunterC}`]);

      const dirs = [
        { r: -1, c: 0 },
        { r: 1, c: 0 },
        { r: 0, c: -1 },
        { r: 0, c: 1 }
      ];

      while (queue.length > 0) {
        const cur = queue.shift();

        if (cur.r === targetR && cur.c === targetC && cur.firstStep) {
          return cur.firstStep;
        }

        for (const d of dirs) {
          const nr = cur.r + d.r;
          const nc = cur.c + d.c;
          const key = `${nr},${nc}`;

          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          if (visited.has(key)) continue;
          if (!this.isPassable(grid, nr, nc, doors)) continue;
          if (chargeSet.has(key)) continue;

          visited.add(key);
          const firstStep = cur.firstStep || d;
          queue.push({ r: nr, c: nc, firstStep });
        }
      }

      return null; // No hay ruta abierta directa
    },

    /**
     * Solver de alcanzabilidad para verificar en Node que el nivel tiene solución
     */
    solveLevelReachability(mapStrings) {
      const parsed = this.parseMap(mapStrings);
      const rows = parsed.rows;
      const cols = parsed.cols;
      const grid = parsed.grid;

      // El jugador puede destruir bloques blandos (2) con sus cargas.
      // Por tanto, los bloques transitables en el largo plazo son los suelos (0, 3..7, 9, 10) y bloques blandos (2).
      // Los únicos obstáculos infranqueables son pilares (1).
      const visited = new Set();
      const queue = [{ r: parsed.p1Start.r, c: parsed.p1Start.c }];
      visited.add(`${parsed.p1Start.r},${parsed.p1Start.c}`);

      let canReachExit = false;

      while (queue.length > 0) {
        const cur = queue.shift();
        if (cur.r === parsed.portal.r && cur.c === parsed.portal.c) {
          canReachExit = true;
          break;
        }

        const dirs = [
          { r: -1, c: 0 },
          { r: 1, c: 0 },
          { r: 0, c: -1 },
          { r: 0, c: 1 }
        ];

        for (const d of dirs) {
          const nr = cur.r + d.r;
          const nc = cur.c + d.c;
          const key = `${nr},${nc}`;

          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          if (visited.has(key)) continue;
          if (grid[nr][nc] === 1) continue; // Solo los pilares indestructibles frenan la transitabilidad teórica

          visited.add(key);
          queue.push({ r: nr, c: nc });
        }
      }

      return {
        canReachExit,
        hasSpawn: parsed.p1Start.r > 0 && parsed.p1Start.c > 0,
        hasExit: parsed.portal.r > 0 && parsed.portal.c > 0
      };
    }
  };

  // Exportar para pruebas Node y solver
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, CargasLogic };
    return;
  }

  // ==========================================
  // 3. ALMACENAMIENTO VERSIONADO cargas:v2 Y MIGRACIÓN
  // ==========================================
  const CargasStorage = {
    load() {
      const defaultState = {
        version: 2,
        highScore: 0,
        unlockedWorld: 1,
        unlockedLevel: 1,
        levelStars: {}, // { levelId: stars (1..3) }
        credits: 0,
        upgrades: {
          radius: 0, // max 3
          charges: 0, // max 3
          speed: 0, // max 3
          slide: 0, // max 2
          shield: 0 // max 2
        },
        achievements: {}
      };

      try {
        let raw = null;
        try {
          raw = localStorage.getItem(CONFIG.STORAGE_KEY);
        } catch (e) {}

        if (raw) {
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (parsed && parsed.version === 2) {
            return Object.assign(defaultState, parsed);
          }
        }

        // Migración desde cargas:v1:best_score
        let legacyScore = 0;
        if (window.ArcadeStorage) {
          legacyScore = window.ArcadeStorage.getHighScore(CONFIG.LEGACY_STORAGE_KEY) || 0;
        } else {
          legacyScore = parseInt(localStorage.getItem(CONFIG.LEGACY_STORAGE_KEY), 10) || 0;
        }

        if (legacyScore > 0) {
          defaultState.highScore = legacyScore;
          defaultState.credits = Math.min(2500, Math.floor(legacyScore / 10));
          this.save(defaultState);
        }

        return defaultState;
      } catch (e) {
        console.warn('Error loading Cargas storage, using defaults:', e);
        return defaultState;
      }
    },

    save(data) {
      if (!data) return;
      try {
        if (window.ArcadeStorage && typeof window.ArcadeStorage.setHighScore === 'function') {
          window.ArcadeStorage.setHighScore(CONFIG.STORAGE_KEY, data.highScore || 0);
        }
      } catch (e) {}

      try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.warn('Error guardando en localStorage:', e);
      }
    }
  };

  // ==========================================
  // 4. SISTEMA DE AUDIO PROCEDURAL Y MÚSICA SINTETIZADA
  // ==========================================
  const SynthSound = {
    ctx: null,
    muted: false,
    bgmMuted: false,
    bgmTimer: null,
    bgmStep: 0,

    init() {
      if (this.ctx) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    },

    resume() {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    },

    playTone(freq, type = 'sine', duration = 0.15, vol = 0.2, freqSlide = null) {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      this.resume();

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (freqSlide) {
          osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqSlide), now + duration);
        }

        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
      } catch (e) {}
    },

    playNoise(duration = 0.25, vol = 0.25) {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      this.resume();

      try {
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(this.ctx.currentTime);
      } catch (e) {}
    },

    sfxDrop() {
      this.playTone(460, 'sine', 0.1, 0.2, 170);
    },

    sfxSlide() {
      this.playTone(280, 'sawtooth', 0.16, 0.18, 540);
    },

    sfxExplode(combo = 1) {
      const pitchOffset = Math.min(6, combo - 1) * 35;
      this.playTone(130 + pitchOffset, 'triangle', 0.35, 0.35, 30);
      this.playNoise(0.35, 0.28);
    },

    sfxCombo(combo) {
      const baseFreq = 440 + (combo * 70);
      this.playTone(baseFreq, 'square', 0.16, 0.25, baseFreq * 1.5);
    },

    sfxPowerup() {
      this.playTone(480, 'sine', 0.09, 0.22, 680);
      setTimeout(() => this.playTone(680, 'sine', 0.14, 0.22, 1020), 70);
    },

    sfxHurt() {
      this.playTone(150, 'sawtooth', 0.28, 0.35, 50);
    },

    sfxBossTelegraph() {
      this.playTone(780, 'square', 0.18, 0.25, 390);
    },

    sfxVictory() {
      this.playTone(330, 'triangle', 0.15, 0.25);
      setTimeout(() => this.playTone(440, 'triangle', 0.15, 0.25), 110);
      setTimeout(() => this.playTone(550, 'triangle', 0.22, 0.25), 220);
      setTimeout(() => this.playTone(660, 'triangle', 0.35, 0.25), 330);
    },

    sfxSwitch() {
      this.playTone(850, 'sine', 0.08, 0.18, 420);
    },

    sfxTeleport() {
      this.playTone(240, 'sine', 0.2, 0.25, 960);
    },

    // Música industrial generativa
    startBGM() {
      if (this.bgmTimer) return;
      const bassNotes = [55, 55, 65, 55, 73, 55, 65, 49]; // Línea de bajo cyberpunk
      this.bgmStep = 0;

      this.bgmTimer = setInterval(() => {
        if (this.bgmMuted || this.muted) return;
        this.init();
        if (!this.ctx || this.ctx.state === 'suspended') return;

        const note = bassNotes[this.bgmStep % bassNotes.length];
        this.playTone(note, 'triangle', 0.16, 0.08);

        // Hi-hat metálico sintetizado cada 2 pasos
        if (this.bgmStep % 2 === 1) {
          this.playNoise(0.04, 0.03);
        }

        this.bgmStep++;
      }, 240); // ~125 BPM
    },

    stopBGM() {
      if (this.bgmTimer) {
        clearInterval(this.bgmTimer);
        this.bgmTimer = null;
      }
    }
  };

  // ==========================================
  // 5. ESTADO GLOBAL DEL JUEGO
  // ==========================================
  const State = {
    canvas: null,
    ctx: null,
    boardW: CONFIG.VIRTUAL_W,
    boardH: CONFIG.VIRTUAL_H,
    tileSize: CONFIG.TILE_SIZE,

    state: 'MENU', // 'MENU', 'PLAYING', 'PAUSED', 'GAMEOVER', 'LEVELCLEAR', 'SHOP'
    is2P: false,

    currentLevelIdx: 0,
    score: 0,
    timeRemaining: 120,
    levelEnemiesKilled: 0,
    levelBlocksDestroyed: 0,
    portalUnlocked: false,
    portalPos: { r: 11, c: 8 },

    // Datos persistentes
    storage: null,

    // Cuadrícula y mecánicas de mapa
    grid: [],
    teleporters: [],
    teleporterPairs: new Map(),
    switches: [],
    doors: [],
    conveyors: [],
    regenBlocks: [],

    // Jugadores
    p1: null,
    p2: null,

    // Entidades
    charges: [],
    activeBlasts: [],
    guardians: [],
    boss: null,
    powerups: [],
    particles: [],
    floatingTexts: [],

    // Juicing & Feedback
    shakeTime: 0,
    hitStopTime: 0,
    zoomPulse: 1.0,
    toastMsg: '',
    toastTimer: 0,

    // Rendimiento y Debug (?debug=1)
    debugMode: false,
    fps: 60,
    lastFpsUpdate: 0,
    frameCount: 0,
    autoDowngrade: false,

    lastTime: 0
  };

  // ==========================================
  // 6. CLASE JUGADOR Y CORNER-SLIPPING
  // ==========================================
  class Player {
    constructor(id, r, c, color, name) {
      this.id = id;
      this.r = r;
      this.c = c;
      this.x = c * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
      this.y = r * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
      this.color = color;
      this.name = name;

      this.lives = CONFIG.STARTING_LIVES;
      this.radius = CONFIG.DEFAULT_BLAST_RADIUS;
      this.maxCharges = CONFIG.DEFAULT_MAX_CHARGES;
      this.speedMult = 1.0;
      this.slideSpeedMult = 1.0;
      this.hasRemote = false;
      this.canKick = false;

      this.invulnTimer = 0;
      this.dir = { r: 0, c: 0 };
      this.bufferedDir = { r: 0, c: 0 };
      this.isAlive = true;

      // Mecánica de empuje táctil y animación 3D
      this.pushTargetCharge = null;
      this.facingAngle = 0;
      this.isMoving = false;
      this.walkTimer = 0;
      this.pushAnimTimer = 0;
    }

    applyUpgrades(upgrades) {
      this.radius = CONFIG.DEFAULT_BLAST_RADIUS + (upgrades.radius || 0);
      this.maxCharges = CONFIG.DEFAULT_MAX_CHARGES + (upgrades.charges || 0);
      this.speedMult = 1.0 + ((upgrades.speed || 0) * 0.15);
      this.slideSpeedMult = 1.0 + ((upgrades.slide || 0) * 0.4);
      this.lives = CONFIG.STARTING_LIVES + (upgrades.shield || 0);
    }

    resetPos(r, c) {
      this.r = r;
      this.c = c;
      this.x = c * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
      this.y = r * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
      this.dir = { r: 0, c: 0 };
      this.bufferedDir = { r: 0, c: 0 };
      this.invulnTimer = 1.6;
      this.isAlive = true;
      this.pushTargetCharge = null;
      this.facingAngle = 0;
      this.isMoving = false;
      this.walkTimer = 0;
      this.pushAnimTimer = 0;
      this.canKick = false;
    }
  }

  // Pre-allocación de Pool de Partículas
  const MAX_PARTICLES = 160;
  for (let i = 0; i < MAX_PARTICLES; i++) {
    State.particles.push({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 3,
      color: '#fff',
      life: 0,
      maxLife: 0.5
    });
  }

  function spawnParticle(x, y, vx, vy, color, size, life) {
    for (const p of State.particles) {
      if (!p.active) {
        p.active = true;
        p.x = x;
        p.y = y;
        p.vx = vx;
        p.vy = vy;
        p.color = color;
        p.size = size;
        p.life = life;
        p.maxLife = life;
        return;
      }
    }
  }

  function spawnDebris(x, y, color = '#f59e0b', count = 10) {
    const finalCount = State.autoDowngrade ? Math.floor(count / 2) : count;
    for (let i = 0; i < finalCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 85;
      spawnParticle(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        2 + Math.random() * 3,
        0.3 + Math.random() * 0.3
      );
    }
  }

  function addFloatingText(text, x, y, color = '#fbbf24') {
    State.floatingTexts.push({
      text,
      x,
      y,
      color,
      life: 0.85,
      maxLife: 0.85
    });
  }

  function showToast(msg, duration = 2.0) {
    State.toastMsg = msg;
    State.toastTimer = duration;
    const dom = document.getElementById('toast-banner');
    if (dom) {
      dom.textContent = msg;
      dom.classList.remove('hidden');
    }
  }

  // ==========================================
  // 7. CARGA DE NIVEL Y MUNDOS
  // ==========================================
  function loadLevel(idx) {
    if (idx < 0) idx = 0;
    if (idx >= CONFIG.LEVELS.length) idx = CONFIG.LEVELS.length - 1;

    State.currentLevelIdx = idx;
    const lvlData = CONFIG.LEVELS[idx];
    const parsed = CargasLogic.parseMap(lvlData.map);

    State.grid = parsed.grid;
    State.teleporters = parsed.teleporters;
    State.teleporterPairs = parsed.teleporterPairs;
    State.switches = parsed.switches;
    State.doors = parsed.doors;
    State.conveyors = parsed.conveyors;
    State.regenBlocks = parsed.regenBlocks;

    State.timeRemaining = lvlData.targetTime + 45; // Tiempo total con margen
    State.levelEnemiesKilled = 0;
    State.levelBlocksDestroyed = 0;
    State.portalUnlocked = false;
    State.portalPos = parsed.portal;

    // Configuración de jugadores
    if (!State.p1) {
      State.p1 = new Player(1, parsed.p1Start.r, parsed.p1Start.c, '#06b6d4', 'Ingeniero Azul');
    } else {
      State.p1.resetPos(parsed.p1Start.r, parsed.p1Start.c);
    }
    State.p1.applyUpgrades(State.storage.upgrades);

    if (State.is2P) {
      if (!State.p2) {
        State.p2 = new Player(2, parsed.p2Start.r, parsed.p2Start.c, '#f59e0b', 'Ingeniero Ámbar');
      } else {
        State.p2.resetPos(parsed.p2Start.r, parsed.p2Start.c);
      }
      State.p2.applyUpgrades(State.storage.upgrades);
    } else {
      State.p2 = null;
    }

    // Limpiar entidades dinámicas
    State.charges = [];
    State.activeBlasts = [];
    State.powerups = [];
    State.floatingTexts = [];

    // Inicializar guardianes con balance
    State.guardians = parsed.guardians.map(g => ({
      type: g.type,
      r: g.r,
      c: g.c,
      x: g.c * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
      y: g.r * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
      hp: g.hp,
      maxHp: g.hp,
      dir: { r: 1, c: 0 },
      stepProgress: 0,
      builderTimer: 4.5,
      destroyed: false
    }));

    // Inicializar jefe de mundo
    if (parsed.boss) {
      State.boss = {
        type: parsed.boss.type,
        r: parsed.boss.r,
        c: parsed.boss.c,
        x: parsed.boss.c * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
        y: parsed.boss.r * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
        hp: parsed.boss.hp,
        maxHp: parsed.boss.maxHp,
        attackTimer: 3.2,
        telegraphing: false,
        telegraphZones: [],
        phase: 1,
        destroyed: false
      };
      showToast(`¡ALERTA DE JEFE DE MUNDO: ${lvlData.name.toUpperCase()}!`, 3.0);
    } else {
      State.boss = null;
    }

    updateHUD();
    updateLevelDisplay();
  }

  // ==========================================
  // 8. MECÁNICAS: CARGAS, EMPUJE Y RESIDUALES
  // ==========================================
  let chargeIdCounter = 1;

  function placeCharge(player) {
    if (!player || !player.isAlive || State.state !== 'PLAYING') return;

    // Verificar límite de cargas
    const activeCount = State.charges.filter(c => c.ownerId === player.id && !c.detonated).length;
    if (activeCount >= player.maxCharges) return;

    // Verificar si ya existe carga en esa casilla
    const existing = State.charges.find(c => c.r === player.r && c.c === player.c && !c.detonated);
    if (existing) return;

    const newCharge = {
      id: chargeIdCounter++,
      ownerId: player.id,
      unsolidFor: player.id,
      r: player.r,
      c: player.c,
      x: player.c * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
      y: player.r * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
      radius: player.radius,
      timer: player.hasRemote ? Infinity : CONFIG.CHARGE_FUSE_TIME,
      maxTimer: CONFIG.CHARGE_FUSE_TIME,
      remote: player.hasRemote,
      sliding: false,
      slideDir: { r: 0, c: 0 },
      detonated: false,
      triggered: false
    };

    State.charges.push(newCharge);
    SynthSound.sfxDrop();
    unlockAchievement('FIRST_BLAST');
    updateHUD();
  }

  function triggerRemote(player) {
    if (!player || !player.hasRemote || State.state !== 'PLAYING') return;
    let anyTriggered = false;
    for (const ch of State.charges) {
      if (ch.ownerId === player.id && !ch.detonated) {
        ch.triggered = true;
        anyTriggered = true;
      }
    }
    if (anyTriggered) {
      detonateTriggeredCharges();
    }
  }

  function detonateTriggeredCharges() {
    // Si alguna carga está a medio deslizarse, congelar su celda discreta de forma consistente
    for (const ch of State.charges) {
      if (ch.sliding) {
        ch.r = Math.round(ch.y / CONFIG.TILE_SIZE);
        ch.c = Math.round(ch.x / CONFIG.TILE_SIZE);
        ch.sliding = false;
      }
    }

    const res = CargasLogic.resolveChainDetonations(State.charges, State.grid, State.doors);

    if (res.chainList.length > 0) {
      SynthSound.sfxExplode(res.comboCount);

      // Hit-stop y Shake según combo
      if (res.comboCount >= 3) {
        State.hitStopTime = 0.06; // 60ms cámara lenta
        State.zoomPulse = 1.06;
        State.shakeTime = 0.35;
        SynthSound.sfxCombo(res.comboCount);
        addFloatingText(`¡COMBO x${res.comboCount}!`, res.chainList[0].x, res.chainList[0].y, '#f59e0b');
        unlockAchievement('CHAIN_REACTION');
        if (res.comboCount >= 5) unlockAchievement('MEGA_RESONANCE');
      } else {
        State.shakeTime = 0.22;
      }

      // Registrar onda activa para renderizado
      State.activeBlasts.push({
        cells: res.blastCells,
        timer: CONFIG.BLAST_DURATION,
        maxTimer: CONFIG.BLAST_DURATION
      });

      // Procesar bloques destruidos
      for (const b of res.destroyedBlocks) {
        if (State.grid[b.r][b.c] === 2) {
          State.grid[b.r][b.c] = 0; // Despejar bloque
          State.levelBlocksDestroyed++;
          const pts = 25 * res.comboCount;
          State.score += pts;
          State.storage.credits += Math.ceil(pts / 5);

          spawnDebris(
            b.c * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
            b.r * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
            '#f59e0b',
            12
          );

          // Verificar si era un bloque regenerativo
          const regen = State.regenBlocks.find(rb => rb.r === b.r && rb.c === b.c);
          if (regen) {
            regen.active = false;
            regen.timer = CONFIG.REGEN_BLOCK_TIME;
          }

          // Probabilidad de soltar Powerup (30%)
          maybeSpawnPowerup(b.r, b.c);
        }
      }

      // Procesar daño a entidades
      damageEntitiesInBlast(res.blastCells, res.comboCount);

      // Eliminar cargas detonadas
      State.charges = State.charges.filter(c => !c.detonated);
      updateHUD();
    }
  }

  function maybeSpawnPowerup(r, c) {
    if (Math.random() < 0.3) {
      const types = ['R', 'C', 'S', 'D', 'K'];
      const picked = types[Math.floor(Math.random() * types.length)];
      State.powerups.push({ r, c, type: picked });
    }
  }

  function damageEntitiesInBlast(blastCells, comboMult) {
    const blastSet = new Map();
    for (const cell of blastCells) {
      blastSet.set(`${cell.r},${cell.c}`, true);
    }

    // Daño a Guardianes
    for (const g of State.guardians) {
      if (!g.destroyed && blastSet.has(`${g.r},${g.c}`)) {
        g.hp--;
        if (g.hp <= 0) {
          g.destroyed = true;
          State.levelEnemiesKilled++;
          const pts = (g.type === 'armored' ? 450 : 250) * comboMult;
          State.score += pts;
          State.storage.credits += Math.ceil(pts / 5);
          SynthSound.playTone(360, 'square', 0.22, 0.3, 100);
          spawnDebris(g.x, g.y, '#ef4444', 16);
          addFloatingText(`+${pts}`, g.x, g.y, '#22c55e');
        } else {
          // Blindado pierde coraza
          spawnDebris(g.x, g.y, '#f59e0b', 8);
          SynthSound.playTone(580, 'sawtooth', 0.16, 0.25, 290);
        }
      }
    }

    // Daño a Jefe de Mundo
    if (State.boss && !State.boss.destroyed && blastSet.has(`${State.boss.r},${State.boss.c}`)) {
      State.boss.hp--;
      spawnDebris(State.boss.x, State.boss.y, '#ef4444', 20);
      SynthSound.playTone(220, 'sawtooth', 0.25, 0.35, 80);
      addFloatingText('¡IMPACTO CRÍTICO!', State.boss.x, State.boss.y - 10, '#ef4444');

      if (State.boss.hp <= 0) {
        State.boss.destroyed = true;
        const pts = 3000 * comboMult;
        State.score += pts;
        State.storage.credits += 500;
        showToast('¡JEFE DE MUNDO DESTRUIDO!', 3.0);
        SynthSound.sfxVictory();

        if (State.boss.type === 'titan') unlockAchievement('TITAN_SLAYER');
        else if (State.boss.type === 'cryo') unlockAchievement('CRYO_MASTER');
        else if (State.boss.type === 'archon') unlockAchievement('ARCHON_FALL');
      }
    }

    // Daño a Jugadores si están en la onda
    const checkHurt = (p) => {
      if (p && p.isAlive && p.invulnTimer <= 0 && blastSet.has(`${p.r},${p.c}`)) {
        hurtPlayer(p);
      }
    };
    checkHurt(State.p1);
    checkHurt(State.p2);
  }

  function hurtPlayer(p) {
    p.lives--;
    p.invulnTimer = CONFIG.INVULNERABILITY_TIME;
    SynthSound.sfxHurt();
    State.shakeTime = 0.35;
    spawnDebris(p.x, p.y, p.color, 16);
    updateHUD();

    if (p.lives <= 0) {
      p.isAlive = false;
      const anyAlive = (State.p1 && State.p1.isAlive) || (State.p2 && State.p2.isAlive);
      if (!anyAlive) {
        triggerGameOver();
      }
    }
  }

  // ==========================================
  // 9. ACTUALIZACIÓN POR FRAME (DELTA TIME)
  // ==========================================
  function update(dt) {
    if (State.state !== 'PLAYING') return;

    // Hit-stop
    if (State.hitStopTime > 0) {
      State.hitStopTime -= dt;
      return;
    }

    // Zoom pulse decay
    if (State.zoomPulse > 1.0) {
      State.zoomPulse = Math.max(1.0, State.zoomPulse - dt * 0.4);
    }

    // Temporizador de nivel
    State.timeRemaining -= dt;
    if (State.timeRemaining <= 0) {
      State.timeRemaining = 0;
      triggerGameOver('¡TIEMPO AGOTADO! El reactor resonante ha colapsado.');
      return;
    }

    // Screen shake
    if (State.shakeTime > 0) State.shakeTime -= dt;

    // Toast banner timer
    if (State.toastTimer > 0) {
      State.toastTimer -= dt;
      if (State.toastTimer <= 0) {
        const dom = document.getElementById('toast-banner');
        if (dom) dom.classList.add('hidden');
      }
    }

    // Actualizar Jugadores con Corner-Slipping
    updatePlayer(State.p1, dt);
    if (State.is2P) updatePlayer(State.p2, dt);

    // Actualizar Cargas y Deslizamiento continuo
    updateCharges(dt);

    // Actualizar Ondas Expansivas
    updateBlasts(dt);

    // Actualizar Guardianes y Jefe
    updateGuardians(dt);
    if (State.boss) updateBoss(dt);

    // Actualizar Bloques Regenerativos
    updateRegenBlocks(dt);

    // Comprobar Interruptores y Compuertas
    updateSwitchesAndDoors();

    // Comprobar Powerups y Salida
    checkPowerups();
    checkPortalCondition();

    // Actualizar Partículas
    for (const p of State.particles) {
      if (p.active) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) p.active = false;
      }
    }

    // Actualizar Textos Flotantes
    for (let i = State.floatingTexts.length - 1; i >= 0; i--) {
      const f = State.floatingTexts[i];
      f.life -= dt;
      f.y -= 18 * dt;
      if (f.life <= 0) State.floatingTexts.splice(i, 1);
    }
  }

  /**
   * Movimiento de jugador con Corner-Slipping (deslizamiento de esquinas)
   */
  /**
   * Movimiento de jugador preciso y sin ambigüedad estilo arcade:
   * - Alineación estricta de carril (cero desvío diagonal).
   * - Búfer de giro en esquinas con ventana de tolerancia de medio bloque.
   * - Empuje cinético de cargas con animación de fuerza y sonido mecánico.
   * - Orientación y rotación visual suave del personaje.
   */
  function updatePlayer(p, dt) {
    if (!p || !p.isAlive) return;

    if (p.invulnTimer > 0) p.invulnTimer -= dt;
    if (p.pushAnimTimer > 0) p.pushAnimTimer -= dt;

    const T = CONFIG.TILE_SIZE;
    const cellCenterX = p.c * T + T / 2;
    const cellCenterY = p.r * T + T / 2;

    const rawSpeed = CONFIG.BASE_PLAYER_SPEED * p.speedMult * T * dt;
    const curTile = State.grid[p.r] ? State.grid[p.r][p.c] : 0;
    const speed = curTile === 3 ? rawSpeed * 1.35 : rawSpeed; // Suelo de hielo

    const req = p.bufferedDir;
    const hasInput = req.r !== 0 || req.c !== 0;

    // Actualizar fila y columna según coordenadas continuas
    p.c = Math.max(0, Math.min(CONFIG.COLS - 1, Math.floor(p.x / T)));
    p.r = Math.max(0, Math.min(CONFIG.ROWS - 1, Math.floor(p.y / T)));

    p.pushTargetCharge = null;

    if (hasInput) {
      p.isMoving = true;
      p.walkTimer = (p.walkTimer || 0) + dt;

      const dr = req.r;
      const dc = req.c;

      p.facingDir = { r: dr, c: dc };
      p.facingAngle = dc > 0 ? 0 : dc < 0 ? Math.PI : dr > 0 ? Math.PI / 2 : -Math.PI / 2;

      if (dc !== 0) {
        // --- DESPLAZAMIENTO HORIZONTAL ---
        // Asistencia de carril: centrar Y suavemente hacia el centro de la fila
        const diffY = cellCenterY - p.y;
        if (Math.abs(diffY) > 0.5) {
          p.y += Math.sign(diffY) * Math.min(speed, Math.abs(diffY));
        }

        const nextX = p.x + dc * speed;
        const targetC = Math.floor((nextX + dc * (T * 0.38)) / T);
        const canPass = CargasLogic.isPassable(State.grid, p.r, targetC, State.doors);
        const chargeAhead = State.charges.find(c => !c.detonated && c.r === p.r && c.c === targetC && c.unsolidFor !== p.id && (targetC !== p.c || c.sliding));

        if (chargeAhead) {
          p.pushTargetCharge = chargeAhead;
          const behindC = targetC + dc;
          const canSlide = p.canKick &&
                           CargasLogic.isPassable(State.grid, p.r, behindC, State.doors) &&
                           !State.charges.some(c => !c.detonated && c.r === p.r && c.c === behindC);
          if (canSlide && !chargeAhead.sliding) {
            chargeAhead.sliding = true;
            chargeAhead.slideDir = { r: 0, c: dc };
            SynthSound.sfxSlide();
            p.pushAnimTimer = 0.25;
            spawnDebris(p.x + dc * 12, p.y, '#f59e0b', 8);
          }
          if ((dc > 0 && p.x < cellCenterX) || (dc < 0 && p.x > cellCenterX)) {
            p.x += dc * speed;
          } else {
            p.x = cellCenterX;
            // Si no tiene powerup de patada, la bomba bloquea y permite deslizarse alrededor si hay pasillo
            if (!p.canKick || !canSlide) {
              const canUp = CargasLogic.isPassable(State.grid, p.r - 1, targetC, State.doors) &&
                            !State.charges.some(c => !c.detonated && c.r === p.r - 1 && c.c === targetC);
              const canDown = CargasLogic.isPassable(State.grid, p.r + 1, targetC, State.doors) &&
                              !State.charges.some(c => !c.detonated && c.r === p.r + 1 && c.c === targetC);
              if (canUp && !canDown && p.y <= cellCenterY + 12) {
                p.y -= speed * 0.9;
              } else if (canDown && !canUp && p.y >= cellCenterY - 12) {
                p.y += speed * 0.9;
              }
            }
          }
        } else if (!canPass) {
          // Bloqueado horizontalmente: Corner-Slide hacia arriba o abajo si hay hueco
          const atCenter = (dc > 0 && p.x >= cellCenterX) || (dc < 0 && p.x <= cellCenterX);
          if (atCenter) {
            p.x = cellCenterX;
            const canUp = CargasLogic.isPassable(State.grid, p.r - 1, targetC, State.doors);
            const canDown = CargasLogic.isPassable(State.grid, p.r + 1, targetC, State.doors);
            if (canUp && !canDown && p.y <= cellCenterY + 12) {
              p.y -= speed * 0.9;
            } else if (canDown && !canUp && p.y >= cellCenterY - 12) {
              p.y += speed * 0.9;
            }
          } else {
            p.x += dc * speed;
          }
        } else {
          p.x = nextX;
        }
      } else if (dr !== 0) {
        // --- DESPLAZAMIENTO VERTICAL ---
        // Asistencia de carril: centrar X suavemente hacia el centro de la columna
        const diffX = cellCenterX - p.x;
        if (Math.abs(diffX) > 0.5) {
          p.x += Math.sign(diffX) * Math.min(speed, Math.abs(diffX));
        }

        const nextY = p.y + dr * speed;
        const targetR = Math.floor((nextY + dr * (T * 0.38)) / T);
        const canPass = CargasLogic.isPassable(State.grid, targetR, p.c, State.doors);
        const chargeAhead = State.charges.find(c => !c.detonated && c.r === targetR && c.c === p.c && c.unsolidFor !== p.id && (targetR !== p.r || c.sliding));

        if (chargeAhead) {
          p.pushTargetCharge = chargeAhead;
          const behindR = targetR + dr;
          const canSlide = p.canKick &&
                           CargasLogic.isPassable(State.grid, behindR, p.c, State.doors) &&
                           !State.charges.some(c => !c.detonated && c.r === behindR && c.c === p.c);
          if (canSlide && !chargeAhead.sliding) {
            chargeAhead.sliding = true;
            chargeAhead.slideDir = { r: dr, c: 0 };
            SynthSound.sfxSlide();
            p.pushAnimTimer = 0.25;
            spawnDebris(p.x, p.y + dr * 12, '#f59e0b', 8);
          }
          if ((dr > 0 && p.y < cellCenterY) || (dr < 0 && p.y > cellCenterY)) {
            p.y += dr * speed;
          } else {
            p.y = cellCenterY;
            // Si no tiene powerup de patada, la bomba bloquea y permite deslizarse alrededor si hay pasillo
            if (!p.canKick || !canSlide) {
              const canLeft = CargasLogic.isPassable(State.grid, targetR, p.c - 1, State.doors) &&
                              !State.charges.some(c => !c.detonated && c.r === targetR && c.c === p.c - 1);
              const canRight = CargasLogic.isPassable(State.grid, targetR, p.c + 1, State.doors) &&
                               !State.charges.some(c => !c.detonated && c.r === targetR && c.c === p.c + 1);
              if (canLeft && !canRight && p.x <= cellCenterX + 12) {
                p.x -= speed * 0.9;
              } else if (canRight && !canLeft && p.x >= cellCenterX - 12) {
                p.x += speed * 0.9;
              }
            }
          }
        } else if (!canPass) {
          // Bloqueado verticalmente: Corner-Slide hacia la izquierda o derecha si hay hueco
          const atCenter = (dr > 0 && p.y >= cellCenterY) || (dr < 0 && p.y <= cellCenterY);
          if (atCenter) {
            p.y = cellCenterY;
            const canLeft = CargasLogic.isPassable(State.grid, targetR, p.c - 1, State.doors);
            const canRight = CargasLogic.isPassable(State.grid, targetR, p.c + 1, State.doors);
            if (canLeft && !canRight && p.x <= cellCenterX + 12) {
              p.x -= speed * 0.9;
            } else if (canRight && !canLeft && p.x >= cellCenterX - 12) {
              p.x += speed * 0.9;
            }
          } else {
            p.y += dr * speed;
          }
        } else {
          p.y = nextY;
        }
      }
      p.dir = { r: dr, c: dc };
    } else {
      p.isMoving = false;
      p.dir = { r: 0, c: 0 };
      // Sin input: recentrar suavemente al carril
      const diffX = cellCenterX - p.x;
      const diffY = cellCenterY - p.y;
      if (Math.abs(diffX) < speed) p.x = cellCenterX;
      if (Math.abs(diffY) < speed) p.y = cellCenterY;
    }

    // 3. INTERACCIÓN CON TELETRANSPORTADORES
    const tKey = `${p.r},${p.c}`;
    if (State.teleporterPairs.has(tKey)) {
      const partner = State.teleporterPairs.get(tKey);
      p.r = partner.r;
      p.c = partner.c;
      p.x = partner.c * T + T / 2;
      p.y = partner.r * T + T / 2;
      SynthSound.sfxTeleport();
      spawnDebris(p.x, p.y, '#a855f7', 16);
    }

    // 4. INTERACCIÓN CON CINTAS TRANSPORTADORAS
    const onTile = State.grid[p.r] ? State.grid[p.r][p.c] : 0;
    if (onTile >= 4 && onTile <= 7) {
      const convDir = onTile === 4 ? { r: -1, c: 0 } : onTile === 5 ? { r: 1, c: 0 } : onTile === 6 ? { r: 0, c: -1 } : { r: 0, c: 1 };
      const convNextR = p.r + convDir.r;
      const convNextC = p.c + convDir.c;
      if (CargasLogic.isPassable(State.grid, convNextR, convNextC, State.doors)) {
        p.x += convDir.c * speed * 0.7;
        p.y += convDir.r * speed * 0.7;
        p.r = Math.floor(p.y / T);
        p.c = Math.floor(p.x / T);
      }
    }
  }

  /**
   * Actualiza el movimiento de cargas y resuelve colisiones limpias
   */
  function updateCharges(dt) {
    let anyAutoDetonated = false;
    const T = CONFIG.TILE_SIZE;

    for (const ch of State.charges) {
      if (ch.detonated) continue;

      if (ch.unsolidFor) {
        const p = ch.unsolidFor === 1 ? State.p1 : State.p2;
        if (!p || !p.isAlive) {
          ch.unsolidFor = null;
        } else {
          const dist = Math.hypot(p.x - ch.x, p.y - ch.y);
          if (dist >= T * 0.75) {
            ch.unsolidFor = null;
          }
        }
      }

      if (ch.sliding) {
        const slideSpeed = CONFIG.BASE_CHARGE_SLIDE_SPEED * T * dt;
        const nextR = ch.r + ch.slideDir.r;
        const nextC = ch.c + ch.slideDir.c;

        const isBlocked = !CargasLogic.isPassable(State.grid, nextR, nextC, State.doors) ||
                          State.charges.some(other => other.id !== ch.id && !other.detonated && other.r === nextR && other.c === nextC);

        if (isBlocked) {
          // Detener deslizamiento limpiamente
          ch.sliding = false;
          ch.x = ch.c * T + T / 2;
          ch.y = ch.r * T + T / 2;
        } else {
          const targetX = nextC * T + T / 2;
          const targetY = nextR * T + T / 2;
          const dx = targetX - ch.x;
          const dy = targetY - ch.y;
          const dist = Math.hypot(dx, dy);

          if (dist <= slideSpeed) {
            ch.x = targetX;
            ch.y = targetY;
            ch.r = nextR;
            ch.c = nextC;

            // Aplastar guardianes al pasar por su celda
            let crushedCount = 0;
            for (const g of State.guardians) {
              if (!g.destroyed && g.r === ch.r && g.c === ch.c) {
                g.destroyed = true;
                crushedCount++;
                State.levelEnemiesKilled++;
                State.score += 350;
                State.storage.credits += 70;
                spawnDebris(g.x, g.y, '#ef4444', 18);
                SynthSound.playTone(280, 'square', 0.25, 0.35, 75);
                addFloatingText('¡APLASTADO!', g.x, g.y, '#ef4444');
              }
            }
            if (crushedCount >= 1) unlockAchievement('PINBALL_CRUSH');
            if (crushedCount >= 2) unlockAchievement('DOUBLE_CRUSH');

            // Teletransporte de carga
            const tKey = `${ch.r},${ch.c}`;
            if (State.teleporterPairs.has(tKey)) {
              const partner = State.teleporterPairs.get(tKey);
              ch.r = partner.r;
              ch.c = partner.c;
              ch.x = partner.c * T + T / 2;
              ch.y = partner.r * T + T / 2;
              SynthSound.sfxTeleport();
            }

            // Redirección por cinta transportadora
            const tile = State.grid[ch.r][ch.c];
            if (tile === 4) ch.slideDir = { r: -1, c: 0 };
            else if (tile === 5) ch.slideDir = { r: 1, c: 0 };
            else if (tile === 6) ch.slideDir = { r: 0, c: -1 };
            else if (tile === 7) ch.slideDir = { r: 0, c: 1 };
          } else {
            ch.x += (dx / dist) * slideSpeed;
            ch.y += (dy / dist) * slideSpeed;
            ch.r = Math.floor(ch.y / T);
            ch.c = Math.floor(ch.x / T);
          }
        }
      }

      // Temporizador de mecha
      if (!ch.remote) {
        ch.timer -= dt;
        if (ch.timer <= 0) {
          ch.triggered = true;
          anyAutoDetonated = true;
        }
      }
    }

    if (anyAutoDetonated) {
      detonateTriggeredCharges();
    }
  }

  function updateBlasts(dt) {
    for (let i = State.activeBlasts.length - 1; i >= 0; i--) {
      const b = State.activeBlasts[i];
      b.timer -= dt;
      if (b.timer <= 0) {
        State.activeBlasts.splice(i, 1);
      }
    }
  }

  /**
   * Actualización de Guardianes con BFS y prevención de suicidio del constructor
   */
  function updateGuardians(dt) {
    const T = CONFIG.TILE_SIZE;

    for (const g of State.guardians) {
      if (g.destroyed) continue;

      // 1. Evasión inteligente de ondas
      const evade = CargasLogic.getGuardianEvadeMove(State.grid, g.r, g.c, State.charges, State.doors);
      if (evade.shouldEvade && (evade.dir.r !== 0 || evade.dir.c !== 0)) {
        g.dir = evade.dir;
      } else if (g.type === 'hunter' && State.p1 && State.p1.isAlive) {
        // Cazador persigue al jugador con pathfinding BFS
        const huntDir = CargasLogic.getHunterMove(State.grid, g.r, g.c, State.p1.r, State.p1.c, State.charges, State.doors);
        if (huntDir) g.dir = huntDir;
      }

      // 2. Constructor: coloca bloque detrás de él sin encerrarse
      if (g.type === 'builder') {
        g.builderTimer -= dt;
        if (g.builderTimer <= 0) {
          g.builderTimer = 5.5;
          // Colocar bloque en casilla detrás de su dirección si está vacía
          const behindR = g.r - g.dir.r;
          const behindC = g.c - g.dir.c;
          if (behindR >= 0 && behindR < CONFIG.ROWS && behindC >= 0 && behindC < CONFIG.COLS &&
              State.grid[behindR][behindC] === 0 &&
              !(behindR === State.portalPos.r && behindC === State.portalPos.c)) {
            State.grid[behindR][behindC] = 2;
            spawnDebris(behindC * T + T / 2, behindR * T + T / 2, '#9333ea', 8);
          }
        }
      }

      // 3. Movimiento del Guardián
      const speed = (g.type === 'hunter' ? 2.6 : g.type === 'armored' && g.hp === 1 ? 3.1 : 2.1) * T * dt;
      const targetR = g.r + g.dir.r;
      const targetC = g.c + g.dir.c;

      const canMove = CargasLogic.isPassable(State.grid, targetR, targetC, State.doors) &&
                      !State.charges.some(c => !c.detonated && c.r === targetR && c.c === targetC);

      if (canMove) {
        const destX = targetC * T + T / 2;
        const destY = targetR * T + T / 2;
        const dx = destX - g.x;
        const dy = destY - g.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= speed) {
          g.x = destX;
          g.y = destY;
          g.r = targetR;
          g.c = targetC;
        } else {
          g.x += (dx / dist) * speed;
          g.y += (dy / dist) * speed;
          g.r = Math.floor(g.y / T);
          g.c = Math.floor(g.x / T);
        }
      } else {
        // Chocó: cambiar a otra dirección válida
        const dirs = [
          { r: -1, c: 0 },
          { r: 1, c: 0 },
          { r: 0, c: -1 },
          { r: 0, c: 1 }
        ];
        const validDirs = dirs.filter(d => {
          const nr = g.r + d.r;
          const nc = g.c + d.c;
          return CargasLogic.isPassable(State.grid, nr, nc, State.doors) &&
                 !State.charges.some(c => !c.detonated && c.r === nr && c.c === nc);
        });

        if (validDirs.length > 0) {
          g.dir = validDirs[Math.floor(Math.random() * validDirs.length)];
        } else {
          g.dir = { r: -g.dir.r, c: -g.dir.c };
        }
      }

      // Daño por contacto al jugador
      const checkTouch = (p) => {
        if (p && p.isAlive && p.invulnTimer <= 0) {
          const dist = Math.hypot(p.x - g.x, p.y - g.y);
          if (dist < T * 0.7) {
            hurtPlayer(p);
          }
        }
      };
      checkTouch(State.p1);
      checkTouch(State.p2);
    }
  }

  /**
   * Actualiza el comportamiento de los 3 jefes de mundo
   */
  function updateBoss(dt) {
    const boss = State.boss;
    if (!boss || boss.destroyed) return;

    boss.attackTimer -= dt;

    if (!boss.telegraphing) {
      if (boss.attackTimer <= 1.3) {
        boss.telegraphing = true;
        SynthSound.sfxBossTelegraph();

        if (boss.type === 'titan') {
          // Telégrafo en cruz y diagonal
          boss.telegraphZones = [];
          for (let c = 1; c < CONFIG.COLS - 1; c++) boss.telegraphZones.push({ r: boss.r, c });
          for (let r = 1; r < CONFIG.ROWS - 1; r++) boss.telegraphZones.push({ r, c: boss.c });
        } else if (boss.type === 'cryo') {
          // Telégrafo de mega-onda de escarcha en anillo
          boss.telegraphZones = [];
          for (let dr = -3; dr <= 3; dr++) {
            for (let dc = -3; dc <= 3; dc++) {
              if (Math.abs(dr) + Math.abs(dc) === 3) {
                const tr = boss.r + dr;
                const tc = boss.c + dc;
                if (tr >= 1 && tr < CONFIG.ROWS - 1 && tc >= 1 && tc < CONFIG.COLS - 1) {
                  boss.telegraphZones.push({ r: tr, c: tc });
                }
              }
            }
          }
        } else if (boss.type === 'archon') {
          // Mega-rombo de resonancia cuántica
          const diamond = CargasLogic.calculateDiamondBlast(State.grid, boss.r, boss.c, 4, State.doors);
          boss.telegraphZones = diamond.blastCells;
        }
      }
    } else {
      if (boss.attackTimer <= 0) {
        boss.telegraphing = false;
        boss.attackTimer = 4.2;
        SynthSound.sfxExplode();
        State.shakeTime = 0.35;

        State.activeBlasts.push({
          cells: boss.telegraphZones,
          timer: 0.5,
          maxTimer: 0.5
        });

        // Dañar jugadores dentro de la zona telegrafiada
        for (const zone of boss.telegraphZones) {
          const hitP = (p) => {
            if (p && p.isAlive && p.invulnTimer <= 0 && p.r === zone.r && p.c === zone.c) {
              hurtPlayer(p);
            }
          };
          hitP(State.p1);
          hitP(State.p2);
        }
      }
    }
  }

  function updateRegenBlocks(dt) {
    for (const rb of State.regenBlocks) {
      if (!rb.active) {
        rb.timer -= dt;
        if (rb.timer <= 0) {
          // Reaparecer bloque si la celda está despejada
          const hasPlayer = (State.p1 && State.p1.r === rb.r && State.p1.c === rb.c) ||
                            (State.p2 && State.p2.r === rb.r && State.p2.c === rb.c);
          const hasCharge = State.charges.some(c => !c.detonated && c.r === rb.r && c.c === rb.c);

          if (!hasPlayer && !hasCharge) {
            rb.active = true;
            State.grid[rb.r][rb.c] = 2;
            spawnDebris(rb.c * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2, rb.r * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2, '#38bdf8', 10);
            SynthSound.playTone(520, 'sine', 0.12, 0.2, 260);
          } else {
            rb.timer = 1.0; // Reintentar en un segundo
          }
        }
      }
    }
  }

  function updateSwitchesAndDoors() {
    let anyPressed = false;

    for (const sw of State.switches) {
      // Un interruptor se presiona si hay un jugador o una carga encima
      const p1On = State.p1 && State.p1.isAlive && State.p1.r === sw.r && State.p1.c === sw.c;
      const p2On = State.p2 && State.p2.isAlive && State.p2.r === sw.r && State.p2.c === sw.c;
      const chargeOn = State.charges.some(c => !c.detonated && c.r === sw.r && c.c === sw.c);

      const isNowPressed = p1On || p2On || chargeOn;
      if (isNowPressed && !sw.pressed) {
        SynthSound.sfxSwitch();
        spawnDebris(sw.c * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2, sw.r * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2, '#22c55e', 6);
      }
      sw.pressed = isNowPressed;
      if (isNowPressed) anyPressed = true;
    }

    // Abrir o cerrar compuertas
    for (const d of State.doors) {
      d.open = anyPressed;
    }
  }

  function checkPowerups() {
    for (let i = State.powerups.length - 1; i >= 0; i--) {
      const pow = State.powerups[i];
      const checkCollect = (p) => {
        if (p && p.isAlive && p.r === pow.r && p.c === pow.c) {
          SynthSound.sfxPowerup();
          State.score += 150;
          State.storage.credits += 30;

          if (pow.type === 'R') {
            p.radius = Math.min(CONFIG.MAX_BLAST_RADIUS, p.radius + 1);
            showToast('¡RADIO DE ONDA AUMENTADO!', 1.2);
          } else if (pow.type === 'C') {
            p.maxCharges = Math.min(CONFIG.MAX_CHARGES_LIMIT, p.maxCharges + 1);
            showToast('¡CARGA ADICIONAL!', 1.2);
          } else if (pow.type === 'S') {
            p.speedMult = Math.min(1.6, p.speedMult + 0.18);
            showToast('¡VELOCIDAD MEJORADA!', 1.2);
          } else if (pow.type === 'D') {
            p.hasRemote = true;
            showToast('¡DETONADOR REMOTO ACTIVO!', 1.5);
          } else if (pow.type === 'K') {
            p.canKick = true;
            showToast('¡PATADA DE BOMBAS OBTENIDA! Camina hacia una bomba para patearla.', 2.0);
          }
          State.powerups.splice(i, 1);
          updateHUD();
          return true;
        }
        return false;
      };

      if (!checkCollect(State.p1) && State.is2P) {
        checkCollect(State.p2);
      }
    }
  }

  function checkPortalCondition() {
    const guardiansRemaining = State.guardians.filter(g => !g.destroyed).length;
    const bossAlive = State.boss && !State.boss.destroyed;

    if (guardiansRemaining === 0 && !bossAlive && !State.portalUnlocked) {
      State.portalUnlocked = true;
      SynthSound.sfxVictory();
      showToast('¡PORTAL DE EXTRACCIÓN ACTIVADO! Dirígete a la salida.', 3.0);
    }

    if (State.portalUnlocked) {
      const checkEscape = (p) => {
        if (p && p.isAlive && p.r === State.portalPos.r && p.c === State.portalPos.c) {
          triggerLevelClear();
          return true;
        }
        return false;
      };

      checkEscape(State.p1) || (State.is2P && checkEscape(State.p2));
    }
  }

  // ==========================================
  // 10. RENDERIZADO 2D / ESTÉTICA INDUSTRIAL 90s
  // ==========================================
  function render() {
    const ctx = State.ctx;
    if (!ctx) return;
    if (!State.grid || State.grid.length === 0) return;

    ctx.save();

    // Screen Shake & Zoom Pulse
    if (State.shakeTime > 0) {
      const sx = (Math.random() - 0.5) * 8;
      const sy = (Math.random() - 0.5) * 8;
      ctx.translate(sx, sy);
    }

    if (State.zoomPulse > 1.0) {
      const cx = State.boardW / 2;
      const cy = State.boardH / 2;
      ctx.translate(cx, cy);
      ctx.scale(State.zoomPulse, State.zoomPulse);
      ctx.translate(-cx, -cy);
    }

    // Fondo industrial
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, State.boardW, State.boardH);

    // 1. Suelo y cuadrícula metálica
    drawFloor(ctx);

    // 2. Cintas Transportadoras e Interruptores
    drawWorldGimmicks(ctx);

    // 3. Zonas telegrafiadas de jefe
    drawTelegraphZones(ctx);

    // 4. Portal de salida
    drawPortal(ctx);

    // 5. Powerups
    drawPowerups(ctx);

    // 6. Pilares, Bloques Blandos y Regenerativos
    drawGridBlocks(ctx);

    // 7. Cargas y previsualización de empuje
    drawCharges(ctx);

    // 8. Ondas Expansivas en Rombo Manhattan
    drawActiveBlasts(ctx);

    // 9. Guardianes y Jefe
    drawGuardians(ctx);
    if (State.boss) drawBoss(ctx);

    // 10. Jugadores
    drawPlayer(ctx, State.p1);
    if (State.is2P) drawPlayer(ctx, State.p2);

    // 11. Partículas y Textos Flotantes
    drawParticles(ctx);
    drawFloatingTexts(ctx);

    // 12. Overlay Debug (?debug=1)
    if (State.debugMode) {
      drawDebugOverlay(ctx);
    }

    ctx.restore();
  }

  function drawFloor(ctx) {
    if (!State.grid || State.grid.length === 0) return;
    const T = CONFIG.TILE_SIZE;
    const lvl = CONFIG.LEVELS[State.currentLevelIdx] || CONFIG.LEVELS[0];
    const isCryo = lvl && lvl.world === 2;
    const isQuantum = lvl && lvl.world === 3;

    for (let r = 0; r < CONFIG.ROWS; r++) {
      if (!State.grid[r]) continue;
      for (let c = 0; c < CONFIG.COLS; c++) {
        const tile = State.grid[r][c];
        const x = c * T;
        const y = r * T;
        const isAlt = (r + c) % 2 === 0;

        if (tile === 3) {
          // Suelo de Hielo
          ctx.fillStyle = isAlt ? '#082f49' : '#0c4a6e';
          ctx.fillRect(x, y, T, T);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.fillRect(x + 4, y + 4, 3, 3);
          ctx.fillRect(x + T - 8, y + T - 8, 4, 2);
        } else {
          // Arena arcade Bomberman con baldosas de alto contraste
          if (isCryo) {
            ctx.fillStyle = isAlt ? '#081726' : '#0c2238';
          } else if (isQuantum) {
            ctx.fillStyle = isAlt ? '#160d26' : '#1f1335';
          } else {
            ctx.fillStyle = isAlt ? '#0f172a' : '#162032';
          }
          ctx.fillRect(x, y, T, T);

          // Línea de bisel suave entre baldosas
          ctx.strokeStyle = isCryo ? '#0a2e4a' : isQuantum ? '#2e1948' : '#1e293b';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, T - 1, T - 1);
        }
      }
    }
  }

  function drawWorldGimmicks(ctx) {
    const T = CONFIG.TILE_SIZE;

    // Cintas transportadoras
    for (const conv of State.conveyors) {
      const cx = conv.c * T + T / 2;
      const cy = conv.r * T + T / 2;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(conv.c * T + 2, conv.r * T + 2, T - 4, T - 4);
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const arrow = conv.dir.r === -1 ? '▲' : conv.dir.r === 1 ? '▼' : conv.dir.c === -1 ? '◀' : '▶';
      ctx.fillText(arrow, cx, cy + 1);
    }

    // Teletransportadores cuánticos
    for (const tp of State.teleporters) {
      const cx = tp.c * T + T / 2;
      const cy = tp.r * T + T / 2;
      const spin = Date.now() * 0.003;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(spin);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.strokeRect(-8, -8, 16, 16);
      ctx.fillStyle = '#6b21a8';
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    }

    // Interruptores de presión
    for (const sw of State.switches) {
      const x = sw.c * T + 4;
      const y = sw.r * T + 4;
      ctx.fillStyle = sw.pressed ? '#15803d' : '#854d0e';
      ctx.fillRect(x, y, T - 8, T - 8);
      ctx.strokeStyle = sw.pressed ? '#4ade80' : '#fbbf24';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, T - 8, T - 8);
    }

    // Compuertas de seguridad
    for (const d of State.doors) {
      const x = d.c * T;
      const y = d.r * T;
      if (d.open) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 4, y + 4, T - 8, T - 8);
      } else {
        // Compuerta cerrada sólida
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(x + 2, y + 2, T - 4, T - 4);
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, T - 4, T - 4);
      }
    }
  }

  function drawTelegraphZones(ctx) {
    if (!State.boss || !State.boss.telegraphing) return;
    const T = CONFIG.TILE_SIZE;
    const pulse = 0.4 + 0.3 * Math.sin(Date.now() * 0.015);

    ctx.fillStyle = `rgba(239, 68, 68, ${pulse})`;
    for (const zone of State.boss.telegraphZones) {
      ctx.fillRect(zone.c * T + 2, zone.r * T + 2, T - 4, T - 4);
    }
  }

  function drawPortal(ctx) {
    const T = CONFIG.TILE_SIZE;
    const px = State.portalPos.c * T;
    const py = State.portalPos.r * T;

    if (State.portalUnlocked) {
      const time = Date.now() * 0.005;
      ctx.fillStyle = '#083344';
      ctx.fillRect(px + 2, py + 2, T - 4, T - 4);

      ctx.save();
      ctx.translate(px + T / 2, py + T / 2);
      ctx.rotate(time);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-T * 0.3, -T * 0.3, T * 0.6, T * 0.6);
      ctx.restore();
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px + 4, py + 4, T - 8, T - 8);
      ctx.strokeStyle = '#475569';
      ctx.strokeRect(px + 4, py + 4, T - 8, T - 8);
    }
  }

  function drawPowerups(ctx) {
    const T = CONFIG.TILE_SIZE;
    for (const pow of State.powerups) {
      const cx = pow.c * T + T / 2;
      const cy = pow.r * T + T / 2;

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = pow.type === 'R' ? '#06b6d4' :
                        pow.type === 'C' ? '#f59e0b' :
                        pow.type === 'S' ? '#10b981' :
                        pow.type === 'K' ? '#ec4899' : '#a855f7';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pow.type, cx, cy + 1);
    }
  }

  function drawGridBlocks(ctx) {
    if (!State.grid || State.grid.length === 0) return;
    const T = CONFIG.TILE_SIZE;
    const time = Date.now() * 0.004;

    for (let r = 0; r < CONFIG.ROWS; r++) {
      if (!State.grid[r]) continue;
      for (let c = 0; c < CONFIG.COLS; c++) {
        const tile = State.grid[r][c];
        const x = c * T;
        const y = r * T;

        if (tile === 1) {
          // --- PILAR INDESTRUCTIBLE 3D BOMBERMAN ---
          // 1. Sombra arrojada al suelo inferior
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.fillRect(x + 1, y + T - 3, T - 2, 4);

          // 2. Cara frontal vertical 3D (profundidad en Z de 6px)
          const frontGrad = ctx.createLinearGradient(x, y + T - 7, x, y + T);
          frontGrad.addColorStop(0, '#334155');
          frontGrad.addColorStop(1, '#0f172a');
          ctx.fillStyle = frontGrad;
          ctx.fillRect(x + 1, y + T - 7, T - 2, 6);

          // 3. Cara superior elevada con bisel metálico
          const topGrad = ctx.createLinearGradient(x, y, x + T, y + T - 7);
          topGrad.addColorStop(0, '#94a3b8');
          topGrad.addColorStop(0.3, '#64748b');
          topGrad.addColorStop(1, '#334155');
          ctx.fillStyle = topGrad;
          ctx.fillRect(x + 1, y + 1, T - 2, T - 8);

          // Borde biselado brillante en la cara superior
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 2, y + 2, T - 4, T - 10);

          // Cuatro remaches metálicos en las esquinas
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(x + 4, y + 4, 2, 2);
          ctx.fillRect(x + T - 6, y + 4, 2, 2);
          ctx.fillRect(x + 4, y + T - 12, 2, 2);
          ctx.fillRect(x + T - 6, y + T - 12, 2, 2);

        } else if (tile === 2) {
          // --- BLOQUE BLANDO DESTRUCTIBLE 3D (Ladrillo / Caja) ---
          const isRegen = State.regenBlocks.some(rb => rb.r === r && rb.c === c);

          // 1. Sombra arrojada al suelo
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.fillRect(x + 2, y + T - 2, T - 4, 3);

          if (isRegen) {
            // Bloque nanotecnológico regenerativo
            const pulse = (Math.sin(time * 6 + (r + c)) + 1) * 0.15 + 0.7;
            ctx.fillStyle = '#0369a1';
            ctx.fillRect(x + 1, y + 1, T - 2, T - 2);
            ctx.strokeStyle = `rgba(56, 189, 248, ${pulse})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 2, y + 2, T - 4, T - 4);
          } else {
            // Cara frontal con relieve (profundidad 5px)
            const frontGrad = ctx.createLinearGradient(x, y + T - 6, x, y + T);
            frontGrad.addColorStop(0, '#78350f');
            frontGrad.addColorStop(1, '#451a03');
            ctx.fillStyle = frontGrad;
            ctx.fillRect(x + 2, y + T - 6, T - 4, 5);

            // Cara superior del bloque de madera/ladrillo
            const topGrad = ctx.createLinearGradient(x, y, x, y + T - 6);
            topGrad.addColorStop(0, '#f59e0b');
            topGrad.addColorStop(0.5, '#d97706');
            topGrad.addColorStop(1, '#92400e');
            ctx.fillStyle = topGrad;
            ctx.fillRect(x + 2, y + 2, T - 4, T - 8);

            // Tablones / Ranuras de ladrillo
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + 3, y + (T - 8) / 2);
            ctx.lineTo(x + T - 3, y + (T - 8) / 2);
            ctx.moveTo(x + T / 2, y + 2);
            ctx.lineTo(x + T / 2, y + (T - 8) / 2);
            ctx.stroke();

            // Refuerzo en las esquinas
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(x + 3, y + 3, 2, 2);
            ctx.fillRect(x + T - 5, y + 3, 2, 2);
            ctx.fillRect(x + 3, y + T - 9, 2, 2);
            ctx.fillRect(x + T - 5, y + T - 9, 2, 2);
          }
        }
      }
    }
  }

  function drawCharges(ctx) {
    const time = Date.now() * 0.005;

    for (const ch of State.charges) {
      if (ch.detonated) continue;

      ctx.save();
      ctx.translate(ch.x, ch.y);

      // Sombra volumétrica proyectada
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(0, 9, 10, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      const isUrgent = ch.timer < 0.8;
      // Rhythmic breathing / throbbing (palpitar acelerado en peligro)
      const pulse = isUrgent ? Math.sin(time * 26) * 2.2 : Math.sin(time * 7) * 1.0;
      const R = 9.5 + pulse;

      // 1. Esfera volumétrica negra metálica 3D
      const bombGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, R);
      if (isUrgent) {
        bombGrad.addColorStop(0, '#ffffff');
        bombGrad.addColorStop(0.25, '#ef4444');
        bombGrad.addColorStop(0.7, '#991b1b');
        bombGrad.addColorStop(1, '#18040a');
      } else {
        bombGrad.addColorStop(0, '#ffffff');
        bombGrad.addColorStop(0.18, '#cbd5e1');
        bombGrad.addColorStop(0.55, '#1e293b');
        bombGrad.addColorStop(1, '#020617');
      }

      ctx.fillStyle = bombGrad;
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isUrgent ? '#ffffff' : '#64748b';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 2. Casquillo superior de la mecha
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-2.5, -R - 2.5, 5, 3.5);

      // 3. Mecha encendida con chispas de fuego animadas
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, -R - 2);
      ctx.quadraticCurveTo(2, -R - 5, 3, -R - 7);
      ctx.stroke();

      // Chispa de fuego parpadeante
      const sparkFlame = (Math.sin(time * 30) + 1) * 1.5 + 2.5;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(3, -R - 7, sparkFlame * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(3, -R - 7, sparkFlame, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 4. Temporizador digital / indicador
      if (!ch.remote) {
        ctx.fillStyle = isUrgent ? '#ffffff' : '#38bdf8';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.ceil(ch.timer), 0, 0.5);
      } else {
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  function drawActiveBlasts(ctx) {
    const T = CONFIG.TILE_SIZE;
    const time = Date.now() * 0.008;

    for (const b of State.activeBlasts) {
      const alpha = Math.max(0, b.timer / b.maxTimer);

      for (const cell of b.cells) {
        const cx = cell.c * T + T / 2;
        const cy = cell.r * T + T / 2;

        ctx.save();
        ctx.translate(cx, cy);

        // Llamas volumétricas de 3 capas estilo Bomberman
        // Capa 1: Resplandor ígneo exterior
        const flamePulse = (Math.sin(time * 14 + (cell.r + cell.c)) + 1) * 1.5;
        const rOuter = (T * 0.44 + flamePulse) * alpha;

        const outerGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, rOuter);
        outerGrad.addColorStop(0, `rgba(254, 240, 138, ${alpha})`);
        outerGrad.addColorStop(0.35, `rgba(245, 158, 11, ${alpha * 0.9})`);
        outerGrad.addColorStop(0.8, `rgba(239, 68, 68, ${alpha * 0.75})`);
        outerGrad.addColorStop(1, 'rgba(185, 28, 28, 0)');

        ctx.fillStyle = outerGrad;
        ctx.beginPath();
        ctx.arc(0, 0, rOuter, 0, Math.PI * 2);
        ctx.fill();

        // Capa 2: Lenguas de fuego en cruz a lo largo del pasillo
        ctx.fillStyle = `rgba(245, 158, 11, ${alpha * 0.85})`;
        ctx.fillRect(-T * 0.42, -5, T * 0.84, 10);
        ctx.fillRect(-5, -T * 0.42, 10, T * 0.84);

        // Capa 3: Núcleo de plasma blanco incandescente
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
        ctx.beginPath();
        ctx.arc(0, 0, (T * 0.22) * alpha, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }
  }

  function drawGuardians(ctx) {
    const time = Date.now() * 0.005;

    for (const g of State.guardians) {
      if (g.destroyed) continue;

      ctx.save();
      ctx.translate(g.x, g.y);

      // Sombra proyectada en el suelo
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, 10, 10, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flotación / Oscilación vertical
      const floatY = Math.sin(time * 3 + (g.r + g.c)) * 2.2;
      ctx.translate(0, -floatY);

      if (g.type === 'patrol') {
        // --- 1. PATRULLERO (Burbuja Saltarina estilo Balom Bomberman - Naranja/Coral) ---
        const bounce = Math.abs(Math.sin(time * 5 + g.r + g.c));
        const squashX = 1.0 + (1.0 - bounce) * 0.22;
        const squashY = 1.0 - (1.0 - bounce) * 0.18;
        ctx.scale(squashX, squashY);

        // Chasis esférico volumétrico 3D
        const balomGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, 9);
        balomGrad.addColorStop(0, '#ffffff');
        balomGrad.addColorStop(0.3, '#fb923c');
        balomGrad.addColorStop(0.7, '#ea580c');
        balomGrad.addColorStop(1, '#7c2d12');
        ctx.fillStyle = balomGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fdba74';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Cuernitos / antenitas superiores
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(-4, -8, 2, 0, Math.PI * 2);
        ctx.arc(4, -8, 2, 0, Math.PI * 2);
        ctx.fill();

        // Ojos grandes expresivos tipo cartoon
        const eyeLookX = (g.vx || 0) * 1.5;
        const eyeLookY = (g.vy || 0) * 1.5;

        // Ojo izquierdo
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-3 + eyeLookX * 0.3, -1 + eyeLookY * 0.3, 2.5, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(-2.8 + eyeLookX, -0.8 + eyeLookY, 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-3.2 + eyeLookX, -1.2 + eyeLookY, 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Ojo derecho
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(3 + eyeLookX * 0.3, -1 + eyeLookY * 0.3, 2.5, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(3.2 + eyeLookX, -0.8 + eyeLookY, 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(2.8 + eyeLookX, -1.2 + eyeLookY, 0.6, 0, Math.PI * 2);
        ctx.fill();

      } else if (g.type === 'hunter') {
        // --- 2. CAZADOR (Mech Rápido estilo Onil Bomberman - Azul Cian) ---
        // Patitas robóticas que corretean
        const pitter = Math.sin(time * 18) * 3;
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(-4, 7 + pitter, 2.5, 0, Math.PI * 2);
        ctx.arc(4, 7 - pitter, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Cuerpo en gota/cebolla con sombreado 3D
        const onilGrad = ctx.createRadialGradient(-2, -4, 1, 0, 0, 9);
        onilGrad.addColorStop(0, '#ffffff');
        onilGrad.addColorStop(0.3, '#38bdf8');
        onilGrad.addColorStop(0.7, '#0284c7');
        onilGrad.addColorStop(1, '#082f49');
        ctx.fillStyle = onilGrad;
        ctx.beginPath();
        ctx.moveTo(0, -9.5);
        ctx.quadraticCurveTo(8.5, -4, 8, 4);
        ctx.quadraticCurveTo(5, 8, 0, 8);
        ctx.quadraticCurveTo(-5, 8, -8, 4);
        ctx.quadraticCurveTo(-8.5, -4, 0, -9.5);
        ctx.fill();
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Visor de rastreo rojo amenazante
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 6;
        ctx.fillRect(-4.5, -1, 9, 3);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(-2, -0.5, 4, 2);

      } else if (g.type === 'armored') {
        // --- 3. BLINDADO (Juggernaut Acorazado 3D - Titanio) ---
        const armorGrad = ctx.createLinearGradient(-9, -9, 9, 9);
        armorGrad.addColorStop(0, g.hp === 2 ? '#cbd5e1' : '#f97316');
        armorGrad.addColorStop(0.5, g.hp === 2 ? '#64748b' : '#c2410c');
        armorGrad.addColorStop(1, '#0f172a');

        ctx.fillStyle = armorGrad;
        ctx.beginPath();
        ctx.roundRect(-9, -9, 18, 18, 4);
        ctx.fill();
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Plancha de blindaje remachada
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-6, -6, 12, 12);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-8, -8, 2, 2);
        ctx.fillRect(6, -8, 2, 2);
        ctx.fillRect(-8, 6, 2, 2);
        ctx.fillRect(6, 6, 2, 2);

        // Visor de combate
        ctx.fillStyle = g.hp === 2 ? '#f59e0b' : '#ef4444';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 6;
        ctx.fillRect(-4, -2, 8, 3);
        ctx.shadowBlur = 0;

      } else {
        // --- 4. CONSTRUCTOR (Dron Nanotecnológico - Púrpura) ---
        ctx.fillStyle = '#a855f7';
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Anillos orbitales giratorios
        ctx.strokeStyle = '#e9d5ff';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
          const a = time * 2 + (i * Math.PI * 2) / 3;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * 8.5, Math.sin(a) * 8.5, 2, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.restore();
    }
  }

  function drawBoss(ctx) {
    const boss = State.boss;
    if (!boss || boss.destroyed) return;

    ctx.save();
    ctx.translate(boss.x, boss.y);
    const time = Date.now() * 0.003;

    // Sombra del jefe
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Corona exterior dentada giratoria (Sentido Horario)
    ctx.save();
    ctx.rotate(time * 0.8);
    const outerRadius = 18;
    const teeth = 8;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const r = i % 2 === 0 ? outerRadius + 3 : outerRadius - 2;
      const a = (i * Math.PI) / teeth;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = boss.type === 'titan' ? '#ef4444' : boss.type === 'cryo' ? '#00f0ff' : '#c084fc';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // 2. Anillo de blindaje intermedio (Sentido Anti-horario)
    ctx.save();
    ctx.rotate(-time * 1.2);
    const ringGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 14);
    ringGrad.addColorStop(0, '#475569');
    ringGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // 3. Núcleo palpitante de plasma
    const pulse = Math.sin(time * 6) * 2;
    const coreGrad = ctx.createRadialGradient(-2, -2, 1, 0, 0, 9 + pulse);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.4, boss.type === 'titan' ? '#f59e0b' : boss.type === 'cryo' ? '#38bdf8' : '#e879f9');
    coreGrad.addColorStop(1, boss.type === 'titan' ? '#b91c1c' : boss.type === 'cryo' ? '#0369a1' : '#6b21a8');

    ctx.fillStyle = coreGrad;
    ctx.shadowColor = boss.type === 'titan' ? '#f59e0b' : '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, 8 + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 4. Cañones de plasma en cruz
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 12, Math.sin(a) * 12);
      ctx.lineTo(Math.cos(a) * 20, Math.sin(a) * 20);
      ctx.stroke();
    }

    // 5. Barra de vida futurista sobre el jefe
    const hpRatio = Math.max(0, boss.hp / boss.maxHp);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-18, -26, 36, 6);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(-18, -26, 36, 6);

    ctx.fillStyle = hpRatio > 0.4 ? '#ef4444' : '#f59e0b';
    ctx.fillRect(-17, -25, 34 * hpRatio, 4);

    ctx.restore();
  }

  function drawPlayer(ctx, p) {
    if (!p || !p.isAlive) return;

    // Titileo de invulnerabilidad
    if (p.invulnTimer > 0 && Math.floor(Date.now() / 90) % 2 === 0) return;

    ctx.save();
    ctx.translate(p.x, p.y);

    const time = Date.now() * 0.005;
    const isMoving = p.isMoving && (p.dir.r !== 0 || p.dir.c !== 0);
    const walkTimer = p.walkTimer || 0;

    // 1. Sombra volumétrica en el suelo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 10, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Elevación Z de marcha (bobbing 3D)
    const zBob = isMoving ? Math.abs(Math.sin(walkTimer * 16)) * 2.2 : Math.sin(time * 3) * 0.6;
    ctx.translate(0, -zBob);

    // Dirección cardinal canónica
    let facing = 'DOWN';
    if (p.facingDir) {
      if (p.facingDir.r === -1) facing = 'UP';
      else if (p.facingDir.r === 1) facing = 'DOWN';
      else if (p.facingDir.c === -1) facing = 'LEFT';
      else if (p.facingDir.c === 1) facing = 'RIGHT';
    } else if (p.dir.r === -1) facing = 'UP';
    else if (p.dir.r === 1) facing = 'DOWN';
    else if (p.dir.c === -1) facing = 'LEFT';
    else if (p.dir.c === 1) facing = 'RIGHT';

    // Paleta de personaje (P1 = Blanco/Cian clásico, P2 = Negro/Carmesí)
    const isP1 = p.id === 1;
    const suitColor = isP1 ? '#0284c7' : '#1e1b4b';
    const helmetColor = isP1 ? '#f8fafc' : '#0f172a';
    const pompomColor = isP1 ? '#f43f5e' : '#fbbf24';
    const gloveColor = isP1 ? '#fb7185' : '#f59e0b';
    const bootColor = isP1 ? '#f43f5e' : '#d97706';

    // 3. Botas esféricas 3D con zancada animada
    const stride = isMoving ? Math.sin(walkTimer * 16) * 3.5 : 0;
    const drawBoot = (bx, by) => {
      const bootGrad = ctx.createRadialGradient(bx - 1, by - 1, 0.5, bx, by, 4.5);
      bootGrad.addColorStop(0, '#ffffff');
      bootGrad.addColorStop(0.3, bootColor);
      bootGrad.addColorStop(1, '#881337');
      ctx.fillStyle = bootGrad;
      ctx.beginPath();
      ctx.arc(bx, by, 4, 0, Math.PI * 2);
      ctx.fill();
    };

    if (facing === 'DOWN' || facing === 'UP') {
      drawBoot(-5, 9 + (facing === 'DOWN' ? stride : -stride));
      drawBoot(5, 9 - (facing === 'DOWN' ? stride : -stride));
    } else if (facing === 'LEFT') {
      drawBoot(-2 - stride, 9);
      drawBoot(4 + stride, 9);
    } else {
      drawBoot(-4 - stride, 9);
      drawBoot(2 + stride, 9);
    }

    // 4. Mochila generadora de fusión (vista desde atrás o perfil)
    if (facing === 'UP') {
      const packGrad = ctx.createLinearGradient(-6, -2, 6, 6);
      packGrad.addColorStop(0, '#64748b');
      packGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = packGrad;
      ctx.beginPath();
      ctx.roundRect(-6, 0, 12, 8, 2);
      ctx.fill();

      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(0, 4, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (facing === 'LEFT') {
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(3, 1, 4, 7, 2);
      ctx.fill();
    } else if (facing === 'RIGHT') {
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(-7, 1, 4, 7, 2);
      ctx.fill();
    }

    // 5. Torso cilíndrico / Traje de salto
    const torsoGrad = ctx.createLinearGradient(-6, 0, 6, 8);
    torsoGrad.addColorStop(0, '#38bdf8');
    torsoGrad.addColorStop(0.4, suitColor);
    torsoGrad.addColorStop(1, '#082f49');
    ctx.fillStyle = torsoGrad;
    ctx.beginPath();
    ctx.roundRect(-6, 0, 12, 9, 3);
    ctx.fill();

    // Cinturón con hebilla dorada
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-6, 5, 12, 2.5);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-1.5, 5, 3, 2.5);

    // 6. Guantes / Manos
    const drawHand = (hx, hy) => {
      const handGrad = ctx.createRadialGradient(hx - 1, hy - 1, 0.5, hx, hy, 3);
      handGrad.addColorStop(0, '#ffffff');
      handGrad.addColorStop(0.35, gloveColor);
      handGrad.addColorStop(1, '#881337');
      ctx.fillStyle = handGrad;
      ctx.beginPath();
      ctx.arc(hx, hy, 3, 0, Math.PI * 2);
      ctx.fill();
    };

    if (p.pushAnimTimer > 0 || p.pushTargetCharge) {
      if (facing === 'DOWN') { drawHand(-4, 6); drawHand(4, 6); }
      else if (facing === 'UP') { drawHand(-4, -6); drawHand(4, -6); }
      else if (facing === 'LEFT') { drawHand(-8, 3); drawHand(-5, 4); }
      else { drawHand(8, 3); drawHand(5, 4); }
    } else {
      const armSwing = isMoving ? Math.sin(walkTimer * 16) * 2.5 : 0;
      if (facing === 'DOWN' || facing === 'UP') {
        drawHand(-7.5, 4 - armSwing);
        drawHand(7.5, 4 + armSwing);
      } else if (facing === 'LEFT') {
        drawHand(-4 + armSwing, 4);
      } else {
        drawHand(4 - armSwing, 4);
      }
    }

    // 7. Cabeza / Casco esférico volumétrico 3D (Cúpula blanca brillante)
    const headY = -6;
    const headRadius = 9.5;
    const helmetGrad = ctx.createRadialGradient(-3, headY - 3, 1, 0, headY, headRadius);
    helmetGrad.addColorStop(0, '#ffffff');
    helmetGrad.addColorStop(0.3, isP1 ? '#f8fafc' : '#334155');
    helmetGrad.addColorStop(0.8, isP1 ? '#cbd5e1' : '#0f172a');
    helmetGrad.addColorStop(1, isP1 ? '#64748b' : '#020617');

    ctx.fillStyle = helmetGrad;
    ctx.beginPath();
    ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isP1 ? 'rgba(255, 255, 255, 0.6)' : 'rgba(100, 116, 139, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 8. Antena y pompón saltarín en la cima
    const antennaTilt = isMoving ? Math.sin(walkTimer * 16) * 1.5 : 0;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, headY - headRadius);
    ctx.lineTo(antennaTilt, headY - headRadius - 4);
    ctx.stroke();

    const pomX = antennaTilt;
    const pomY = headY - headRadius - 5.5;
    const pomGrad = ctx.createRadialGradient(pomX - 1, pomY - 1, 0.5, pomX, pomY, 3.5);
    pomGrad.addColorStop(0, '#ffffff');
    pomGrad.addColorStop(0.4, pompomColor);
    pomGrad.addColorStop(1, '#881337');
    ctx.fillStyle = pomGrad;
    ctx.beginPath();
    ctx.arc(pomX, pomY, 3, 0, Math.PI * 2);
    ctx.fill();

    // 9. Visor y Expresión facial según orientación
    if (facing === 'DOWN') {
      // Visor frontal ovalado azul marino
      const visorGrad = ctx.createLinearGradient(0, headY - 4, 0, headY + 3);
      visorGrad.addColorStop(0, '#0284c7');
      visorGrad.addColorStop(0.5, '#0369a1');
      visorGrad.addColorStop(1, '#082f49');
      ctx.fillStyle = visorGrad;
      ctx.beginPath();
      ctx.ellipse(0, headY, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Dos ojos verticales tipo Bomberman clásico con destello
      const drawEye = (ex) => {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(ex, headY, 1.4, 2.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ex - 0.5, headY - 1, 0.7, 0, Math.PI * 2);
        ctx.fill();
      };
      drawEye(-2.5);
      drawEye(2.5);

    } else if (facing === 'LEFT') {
      ctx.fillStyle = '#0369a1';
      ctx.beginPath();
      ctx.ellipse(-3.5, headY, 4.5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(-4, headY, 1.3, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-4.5, headY - 0.8, 0.6, 0, Math.PI * 2);
      ctx.fill();

    } else if (facing === 'RIGHT') {
      ctx.fillStyle = '#0369a1';
      ctx.beginPath();
      ctx.ellipse(3.5, headY, 4.5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(4, headY, 1.3, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(3.5, headY - 0.8, 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // 10. Aura de escudo en invulnerabilidad
    if (p.invulnTimer > 0) {
      const shieldPulse = (Math.sin(time * 18) + 1) * 0.2 + 0.3;
      ctx.strokeStyle = `rgba(56, 189, 248, ${shieldPulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -2, 15, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawParticles(ctx) {
    for (const p of State.particles) {
      if (p.active) {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
  }

  function drawFloatingTexts(ctx) {
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    for (const f of State.floatingTexts) {
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
  }

  function drawDebugOverlay(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(5, 5, 130, 65);
    ctx.fillStyle = '#22c55e';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`FPS: ${State.fps}`, 10, 20);
    ctx.fillText(`Auto-Downgrade: ${State.autoDowngrade ? 'ON' : 'OFF'}`, 10, 35);
    ctx.fillText(`Cargas: ${State.charges.length}`, 10, 50);
    ctx.fillText(`Guardianes: ${State.guardians.filter(g => !g.destroyed).length}`, 10, 65);
  }

  // ==========================================
  // 11. BUCLE DE JUEGO Y MEDICIÓN DE RENDIMIENTO
  // ==========================================
  function gameLoop(timestamp) {
    if (!State.lastTime) State.lastTime = timestamp;
    let dt = (timestamp - State.lastTime) / 1000;
    State.lastTime = timestamp;

    if (dt > 0.08) dt = 0.08; // Clamp de seguridad según REGLAS-JUEGOS

    // Medición de FPS
    State.frameCount++;
    if (timestamp - State.lastFpsUpdate >= 1000) {
      State.fps = State.frameCount;
      State.frameCount = 0;
      State.lastFpsUpdate = timestamp;

      // Auto-degradación de efectos si el framerate cae por debajo de 55 FPS
      if (State.fps < 55) {
        State.autoDowngrade = true;
      } else if (State.fps >= 58) {
        State.autoDowngrade = false;
      }
    }

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
  }

  // ==========================================
  // 12. LOGROS, TIENDA Y GESTIÓN DE EVENTOS
  // ==========================================
  const ACHIEVEMENTS = [
    { id: 'FIRST_BLAST', title: 'Primera Carga', desc: 'Detona tu primera carga resonante' },
    { id: 'CHAIN_REACTION', title: 'Reacción en Cadena', desc: 'Consigue un combo x3 o superior' },
    { id: 'MEGA_RESONANCE', title: 'Mega Resonancia', desc: 'Alcanza un combo x5 en un solo estallido' },
    { id: 'PINBALL_CRUSH', title: 'Efecto Billar', desc: 'Aplasta a un enemigo empujando una carga' },
    { id: 'DOUBLE_CRUSH', title: 'Doble Impacto', desc: 'Aplasta 2 enemigos con una sola carga' },
    { id: 'TITAN_SLAYER', title: 'Caída del Titán', desc: 'Derrota al Titán Giróscopo MK-II (Mundo 1)' },
    { id: 'CRYO_MASTER', title: 'Dominio Glacial', desc: 'Vence al Coloso Criogénico (Mundo 2)' },
    { id: 'ARCHON_FALL', title: 'Fin del Arconte', desc: 'Destruye al Núcleo Arconte Supremo (Mundo 3)' },
    { id: 'SPEED_DEMON', title: 'Velocidad Pura', desc: 'Completa un sector en menos de 25 segundos' },
    { id: 'PERFECTIONIST', title: 'Perfección Táctica', desc: 'Obtén 3 estrellas en al menos 5 sectores' },
    { id: 'SHOP_MASTER', title: 'Ingeniero Equipado', desc: 'Mejora una habilidad al nivel máximo en la tienda' }
  ];

  function unlockAchievement(id) {
    if (!State.storage.achievements[id]) {
      State.storage.achievements[id] = true;
      CargasStorage.save(State.storage);
      const ach = ACHIEVEMENTS.find(a => a.id === id);
      if (ach) {
        showToast(`🏆 ¡LOGRO DESBLOQUEADO: ${ach.title.toUpperCase()}!`, 3.5);
      }
    }
  }

  function triggerGameOver(reason = 'Misión fallida. El núcleo ha colapsado.') {
    State.state = 'GAMEOVER';
    SynthSound.playTone(160, 'sawtooth', 0.5, 0.4, 40);

    const bestScore = saveHighScore();

    document.getElementById('result-title').textContent = '¡MISIÓN FALLIDA!';
    document.getElementById('result-desc').textContent = reason;
    document.getElementById('res-score').textContent = State.score;
    document.getElementById('res-enemies').textContent = State.levelEnemiesKilled;
    document.getElementById('res-blocks').textContent = State.levelBlocksDestroyed;
    document.getElementById('res-highscore').textContent = bestScore;

    document.getElementById('btn-result-next').classList.add('hidden');
    document.getElementById('btn-result-retry').classList.remove('hidden');
    document.getElementById('modal-result').classList.remove('hidden');
  }

  function triggerLevelClear() {
    State.state = 'LEVELCLEAR';
    SynthSound.sfxVictory();

    const lvlData = CONFIG.LEVELS[State.currentLevelIdx];
    const timeTaken = Math.max(1, (lvlData.targetTime + 45) - State.timeRemaining);

    // Calcular estrellas (1 a 3)
    let stars = 1;
    if (State.levelEnemiesKilled >= State.guardians.length) stars++;
    if (timeTaken <= lvlData.targetTime) stars++;

    if (timeTaken < 25) unlockAchievement('SPEED_DEMON');

    // Bonificación de tiempo
    const timeBonus = Math.floor(State.timeRemaining) * 15;
    State.score += timeBonus;
    State.storage.credits += Math.floor(timeBonus / 10) + (stars * 50);

    // Actualizar estrellas guardadas
    const prevStars = State.storage.levelStars[lvlData.id] || 0;
    if (stars > prevStars) {
      State.storage.levelStars[lvlData.id] = stars;
    }

    // Comprobar logro de perfeccionista
    const threeStarsCount = Object.values(State.storage.levelStars).filter(s => s === 3).length;
    if (threeStarsCount >= 5) unlockAchievement('PERFECTIONIST');

    // Desbloquear siguiente nivel y mundo
    if (State.currentLevelIdx + 1 < CONFIG.LEVELS.length) {
      const nextLvl = CONFIG.LEVELS[State.currentLevelIdx + 1];
      if (nextLvl.id > State.storage.unlockedLevel) {
        State.storage.unlockedLevel = nextLvl.id;
      }
      if (nextLvl.world > State.storage.unlockedWorld) {
        State.storage.unlockedWorld = nextLvl.world;
      }
    }

    const bestScore = saveHighScore();
    CargasStorage.save(State.storage);

    document.getElementById('result-title').textContent = '¡SECTOR COMPLETADO!';
    document.getElementById('result-desc').textContent = `Estrellas: ${'⭐'.repeat(stars)} &bull; Bono de Tiempo: +${timeBonus} pts.`;
    document.getElementById('res-score').textContent = State.score;
    document.getElementById('res-enemies').textContent = State.levelEnemiesKilled;
    document.getElementById('res-blocks').textContent = State.levelBlocksDestroyed;
    document.getElementById('res-highscore').textContent = bestScore;

    if (State.currentLevelIdx < CONFIG.LEVELS.length - 1) {
      document.getElementById('btn-result-next').classList.remove('hidden');
    } else {
      document.getElementById('btn-result-next').classList.add('hidden');
      document.getElementById('result-desc').textContent = '¡HAS EVACUADO TODOS LOS SECTORES CUÁNTICOS!';
    }

    document.getElementById('modal-result').classList.remove('hidden');
  }

  function saveHighScore() {
    if (State.score > State.storage.highScore) {
      State.storage.highScore = State.score;
      CargasStorage.save(State.storage);
    }
    return State.storage.highScore;
  }

  function updateHUD() {
    document.getElementById('score-val').textContent = State.score;
    document.getElementById('time-val').textContent = Math.ceil(State.timeRemaining);

    if (State.p1) {
      document.getElementById('hud-radius').textContent = `R: ${State.p1.radius}`;
      const activeP1 = State.charges.filter(c => c.ownerId === 1 && !c.detonated).length;
      document.getElementById('hud-charges').textContent = `${activeP1}/${State.p1.maxCharges}`;
      document.getElementById('hud-speed').textContent = `${State.p1.speedMult.toFixed(1)}x`;
      document.getElementById('hud-remote-txt').textContent = State.p1.hasRemote ? 'LISTO' : 'AUTO';

      let icons = '';
      for (let i = 0; i < State.p1.lives; i++) icons += '⚙️';
      document.getElementById('lives-val').textContent = icons || '💀';

      const btnDetonate = document.getElementById('btn-action-detonate');
      if (btnDetonate) {
        btnDetonate.classList.toggle('hidden', !State.p1.hasRemote);
      }
    }
  }

  function updateLevelDisplay() {
    const lvl = CONFIG.LEVELS[State.currentLevelIdx];
    document.getElementById('level-display').textContent = `M${lvl.world} N${lvl.id}: ${lvl.name.toUpperCase()}`;
  }

  // ==========================================
  // 13. ENTRADAS Y CONTROLES TÁCTILES MEJORADOS
  // ==========================================
  function setupInputs() {
    // Teclado
    window.addEventListener('keydown', (e) => {
      SynthSound.resume();

      if (e.key.toLowerCase() === 'p' || e.key === 'Escape') {
        const modalPause = document.getElementById('modal-pause');
        if (State.state === 'PLAYING') {
          State.state = 'PAUSED';
          if (modalPause) modalPause.classList.remove('hidden');
        } else if (State.state === 'PAUSED') {
          State.state = 'PLAYING';
          if (modalPause) modalPause.classList.add('hidden');
        }
        e.preventDefault();
        return;
      }

      if (State.state !== 'PLAYING') return;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          State.p1.bufferedDir = { r: -1, c: 0 };
          e.preventDefault();
          break;
        case 's':
        case 'arrowdown':
          State.p1.bufferedDir = { r: 1, c: 0 };
          e.preventDefault();
          break;
        case 'a':
        case 'arrowleft':
          State.p1.bufferedDir = { r: 0, c: -1 };
          e.preventDefault();
          break;
        case 'd':
        case 'arrowright':
          State.p1.bufferedDir = { r: 0, c: 1 };
          e.preventDefault();
          break;
        case ' ':
        case 'j':
          placeCharge(State.p1);
          e.preventDefault();
          break;
        case 'k':
          triggerRemote(State.p1);
          e.preventDefault();
          break;
      }

      // P2 co-op
      if (State.is2P && State.p2) {
        switch (e.key.toLowerCase()) {
          case 'i': State.p2.bufferedDir = { r: -1, c: 0 }; break;
          case 'k': State.p2.bufferedDir = { r: 1, c: 0 }; break;
          case 'j': State.p2.bufferedDir = { r: 0, c: -1 }; break;
          case 'l': State.p2.bufferedDir = { r: 0, c: 1 }; break;
          case 'enter': placeCharge(State.p2); break;
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (State.p1) {
        const k = e.key.toLowerCase();
        if ((k === 'w' || k === 'arrowup') && State.p1.bufferedDir.r === -1) State.p1.bufferedDir = { r: 0, c: 0 };
        if ((k === 's' || k === 'arrowdown') && State.p1.bufferedDir.r === 1) State.p1.bufferedDir = { r: 0, c: 0 };
        if ((k === 'a' || k === 'arrowleft') && State.p1.bufferedDir.c === -1) State.p1.bufferedDir = { r: 0, c: 0 };
        if ((k === 'd' || k === 'arrowright') && State.p1.bufferedDir.c === 1) State.p1.bufferedDir = { r: 0, c: 0 };
      }
    });

    // D-Pad Táctil
    const bindDpad = (id, r, c) => {
      const el = document.getElementById(id);
      if (!el) return;

      const setDir = (ev) => {
        ev.preventDefault();
        SynthSound.resume();
        if (State.p1) State.p1.bufferedDir = { r, c };
      };

      const clearDir = (ev) => {
        ev.preventDefault();
        if (State.p1 && State.p1.bufferedDir.r === r && State.p1.bufferedDir.c === c) {
          State.p1.bufferedDir = { r: 0, c: 0 };
        }
      };

      el.addEventListener('pointerdown', setDir);
      el.addEventListener('pointerup', clearDir);
      el.addEventListener('pointerleave', clearDir);
    };

    bindDpad('btn-dpad-up', -1, 0);
    bindDpad('btn-dpad-down', 1, 0);
    bindDpad('btn-dpad-left', 0, -1);
    bindDpad('btn-dpad-right', 0, 1);

    // Botones de Acción
    const btnCharge = document.getElementById('btn-action-charge');
    if (btnCharge) {
      btnCharge.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        SynthSound.resume();
        if (State.state === 'PLAYING') placeCharge(State.p1);
      });
    }

    const btnDetonate = document.getElementById('btn-action-detonate');
    if (btnDetonate) {
      btnDetonate.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        SynthSound.resume();
        if (State.state === 'PLAYING') triggerRemote(State.p1);
      });
    }

    // Touch Swipe en canvas
    let touchStartX = 0;
    let touchStartY = 0;
    const canvas = State.canvas;
    if (canvas) {
      canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && State.p1) {
          const dx = e.touches[0].clientX - touchStartX;
          const dy = e.touches[0].clientY - touchStartY;
          const absX = Math.abs(dx);
          const absY = Math.abs(dy);

          if (absX > 16 || absY > 16) {
            if (absX > absY) {
              State.p1.bufferedDir = { r: 0, c: dx > 0 ? 1 : -1 };
            } else {
              State.p1.bufferedDir = { r: dy > 0 ? 1 : -1, c: 0 };
            }
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
          }
        }
      }, { passive: true });
    }
  }

  // ==========================================
  // 14. UI, SELECTOR DE 3 MUNDOS Y TIENDA
  // ==========================================
  function setupUI() {
    // Modo 1P / 2P
    const btn1p = document.getElementById('btn-mode-1p');
    const btn2p = document.getElementById('btn-mode-2p');
    btn1p.addEventListener('click', () => {
      State.is2P = false;
      btn1p.classList.add('active');
      btn2p.classList.remove('active');
    });
    btn2p.addEventListener('click', () => {
      State.is2P = true;
      btn2p.classList.add('active');
      btn1p.classList.remove('active');
    });

    // Pestañas de 3 Mundos en el Selector de Niveles
    let activeWorldTab = 1;
    const renderLevelGrid = (worldId) => {
      const gridEl = document.getElementById('levels-grid');
      gridEl.innerHTML = '';
      const filtered = CONFIG.LEVELS.filter(lvl => lvl.world === worldId);

      filtered.forEach((lvl) => {
        const isUnlocked = lvl.id <= State.storage.unlockedLevel;
        const stars = State.storage.levelStars[lvl.id] || 0;
        const chip = document.createElement('button');
        chip.className = `lvl-chip ${lvl.isBoss ? 'boss-chip' : ''} ${lvl.id === State.currentLevelIdx + 1 ? 'active' : ''}`;
        if (!isUnlocked) chip.classList.add('locked');

        chip.innerHTML = `<span>${lvl.id}</span>
          <div class="chip-stars">${stars > 0 ? '⭐'.repeat(stars) : ''}</div>
          ${lvl.isBoss ? '<small class="chip-boss-tag">JEFE</small>' : ''}`;

        chip.addEventListener('click', () => {
          if (!isUnlocked) {
            showToast('¡Sector bloqueado! Supera los anteriores.', 1.5);
            return;
          }
          document.querySelectorAll('.lvl-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          State.currentLevelIdx = lvl.id - 1;
        });

        gridEl.appendChild(chip);
      });
    };

    const tabW1 = document.getElementById('tab-world-1');
    const tabW2 = document.getElementById('tab-world-2');
    const tabW3 = document.getElementById('tab-world-3');

    if (tabW1 && tabW2 && tabW3) {
      tabW1.addEventListener('click', () => {
        activeWorldTab = 1;
        tabW1.classList.add('active');
        tabW2.classList.remove('active');
        tabW3.classList.remove('active');
        renderLevelGrid(1);
      });
      tabW2.addEventListener('click', () => {
        activeWorldTab = 2;
        tabW2.classList.add('active');
        tabW1.classList.remove('active');
        tabW3.classList.remove('active');
        renderLevelGrid(2);
      });
      tabW3.addEventListener('click', () => {
        activeWorldTab = 3;
        tabW3.classList.add('active');
        tabW1.classList.remove('active');
        tabW2.classList.remove('active');
        renderLevelGrid(3);
      });
    }

    renderLevelGrid(1);

    // Botón Iniciar Operación
    document.getElementById('btn-start-game').addEventListener('click', () => {
      SynthSound.resume();
      SynthSound.startBGM();
      document.getElementById('modal-start').classList.add('hidden');
      loadLevel(State.currentLevelIdx);
      State.state = 'PLAYING';
    });

    // Pausa y Menús
    const modalPause = document.getElementById('modal-pause');
    document.getElementById('btn-pause-header').addEventListener('click', () => {
      if (State.state === 'PLAYING') {
        State.state = 'PAUSED';
        modalPause.classList.remove('hidden');
      } else if (State.state === 'PAUSED') {
        State.state = 'PLAYING';
        modalPause.classList.add('hidden');
      }
    });

    document.getElementById('btn-resume').addEventListener('click', () => {
      modalPause.classList.add('hidden');
      State.state = 'PLAYING';
    });

    document.getElementById('btn-restart-level').addEventListener('click', () => {
      modalPause.classList.add('hidden');
      loadLevel(State.currentLevelIdx);
      State.state = 'PLAYING';
    });

    document.getElementById('btn-exit-menu').addEventListener('click', () => {
      modalPause.classList.add('hidden');
      document.getElementById('modal-start').classList.remove('hidden');
      State.state = 'MENU';
      renderLevelGrid(activeWorldTab);
    });

    // Modal Resultados
    document.getElementById('btn-result-next').addEventListener('click', () => {
      document.getElementById('modal-result').classList.add('hidden');
      loadLevel(State.currentLevelIdx + 1);
      State.state = 'PLAYING';
    });

    document.getElementById('btn-result-retry').addEventListener('click', () => {
      document.getElementById('modal-result').classList.add('hidden');
      loadLevel(State.currentLevelIdx);
      State.state = 'PLAYING';
    });

    document.getElementById('btn-result-menu').addEventListener('click', () => {
      document.getElementById('modal-result').classList.add('hidden');
      document.getElementById('modal-start').classList.remove('hidden');
      State.state = 'MENU';
      renderLevelGrid(activeWorldTab);
    });

    // Botón Tienda de Mejoras
    const modalShop = document.getElementById('modal-shop');
    const btnOpenShop = document.getElementById('btn-open-shop');
    if (btnOpenShop) {
      btnOpenShop.addEventListener('click', () => {
        openShopUI();
      });
    }

    const btnCloseShop = document.getElementById('btn-close-shop');
    if (btnCloseShop) {
      btnCloseShop.addEventListener('click', () => {
        modalShop.classList.add('hidden');
      });
    }

    // Toggle Sonido y BGM
    const btnSound = document.getElementById('btn-sound-toggle');
    btnSound.addEventListener('click', () => {
      SynthSound.muted = !SynthSound.muted;
      document.getElementById('icon-sound-on').classList.toggle('hidden', SynthSound.muted);
      document.getElementById('icon-sound-off').classList.toggle('hidden', !SynthSound.muted);
    });
  }

  function openShopUI() {
    const modalShop = document.getElementById('modal-shop');
    const creditsEl = document.getElementById('shop-credits-val');
    creditsEl.textContent = State.storage.credits;

    const upgradesList = [
      { key: 'radius', name: 'Radio de Resonancia', max: 3, baseCost: 150, icon: '💎', desc: 'Aumenta el alcance Manhattan de la onda' },
      { key: 'charges', name: 'Capacitador de Cargas', max: 3, baseCost: 200, icon: '💣', desc: 'Permite desplegar más cargas simultáneas' },
      { key: 'speed', name: 'Servomotores de Botas', max: 3, baseCost: 150, icon: '⚡', desc: '+15% velocidad base de movimiento' },
      { key: 'slide', name: 'Guantelete Magnético', max: 2, baseCost: 250, icon: '🧤', desc: 'Las cargas empujadas se deslizan +40% más rápido' },
      { key: 'shield', name: 'Blindaje de Ingeniero', max: 2, baseCost: 350, icon: '🛡️', desc: '+1 vida adicional al iniciar cada sector' }
    ];

    const container = document.getElementById('shop-items-container');
    container.innerHTML = '';

    upgradesList.forEach(upg => {
      const curLvl = State.storage.upgrades[upg.key] || 0;
      const isMax = curLvl >= upg.max;
      const cost = upg.baseCost * (curLvl + 1);

      const itemCard = document.createElement('div');
      itemCard.className = 'shop-item-card';
      itemCard.innerHTML = `
        <div class="shop-item-icon">${upg.icon}</div>
        <div class="shop-item-info">
          <div class="shop-item-name">${upg.name} (Nivel ${curLvl}/${upg.max})</div>
          <div class="shop-item-desc">${upg.desc}</div>
        </div>
        <button class="ind-btn btn-primary shop-buy-btn ${isMax ? 'disabled' : ''}">
          ${isMax ? 'MÁXIMO' : `${cost} ⚙️`}
        </button>
      `;

      const buyBtn = itemCard.querySelector('.shop-buy-btn');
      if (!isMax) {
        buyBtn.addEventListener('click', () => {
          if (State.storage.credits >= cost) {
            State.storage.credits -= cost;
            State.storage.upgrades[upg.key] = curLvl + 1;
            CargasStorage.save(State.storage);
            SynthSound.sfxPowerup();
            showToast(`¡MEJORA ADQUIRIDA: ${upg.name.toUpperCase()}!`, 1.5);
            if (curLvl + 1 >= upg.max) unlockAchievement('SHOP_MASTER');
            openShopUI();
          } else {
            showToast('¡Créditos insuficientes! Destruye más bloques.', 1.5);
          }
        });
      }

      container.appendChild(itemCard);
    });

    modalShop.classList.remove('hidden');
  }

  function handleResize() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;

    State.canvas = canvas;
    State.ctx = canvas.getContext('2d');

    const container = document.getElementById('canvas-container');
    const availW = container.clientWidth || 330;
    const availH = container.clientHeight || 390;

    const scale = Math.min(availW / State.boardW, availH / State.boardH, 1.4);
    const dpr = window.devicePixelRatio || 1;

    canvas.width = State.boardW * dpr;
    canvas.height = State.boardH * dpr;
    canvas.style.width = `${State.boardW * scale}px`;
    canvas.style.height = `${State.boardH * scale}px`;

    State.ctx.scale(dpr, dpr);
  }

  function showFatalError(title, err) {
    console.error('Fatal Cargas Error:', err);
    let box = document.getElementById('arcade-error-overlay');
    if (!box) {
      box = document.createElement('div');
      box.id = 'arcade-error-overlay';
      box.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(10,14,23,0.96);color:#f8fafc;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;font-family:monospace,system-ui,sans-serif;';
      box.innerHTML = `
        <div style="max-width:420px;background:#1e293b;border:2px solid #ef4444;border-radius:8px;padding:20px;box-shadow:0 10px 30px rgba(0,0,0,0.8);">
          <div style="font-size:2.2rem;margin-bottom:8px;">⚠️</div>
          <h2 style="color:#ef4444;font-size:1.1rem;margin-bottom:8px;text-transform:uppercase;">Error al iniciar el juego</h2>
          <p id="arcade-error-msg" style="font-size:0.82rem;color:#cbd5e1;margin-bottom:16px;word-break:break-word;background:#0f172a;padding:8px;border-radius:4px;"></p>
          <div style="display:flex;gap:8px;justify-content:center;">
            <button onclick="location.reload()" style="background:#f59e0b;color:#000;border:none;font-weight:bold;padding:10px 16px;border-radius:4px;cursor:pointer;min-height:44px;">REINTENTAR</button>
            <a href="../../index.html" style="background:#334155;color:#fff;text-decoration:none;font-weight:bold;padding:10px 16px;border-radius:4px;display:inline-flex;align-items:center;min-height:44px;">VOLVER AL MENÚ</a>
          </div>
        </div>
      `;
      document.body.appendChild(box);
    }
    const msgEl = document.getElementById('arcade-error-msg');
    if (msgEl) msgEl.textContent = err && err.message ? err.message : String(err);
  }

  function init() {
    try {
      // Comprobar parámetro ?debug=1 en la URL
      const urlParams = new URLSearchParams(window.location.search);
      State.debugMode = urlParams.get('debug') === '1';

      State.storage = CargasStorage.load();
      loadLevel(0); // Carga inicial del nivel 0 antes de redimensionar o dibujar
      handleResize();
      window.addEventListener('resize', handleResize);
      setupInputs();
      setupUI();
      requestAnimationFrame(gameLoop);
    } catch (err) {
      showFatalError('Error al iniciar Cargas', err);
    }
  }

  window.addEventListener('error', (e) => {
    showFatalError('Error en ejecución', e.error || e.message);
  });

  window.addEventListener('DOMContentLoaded', init);
})();
