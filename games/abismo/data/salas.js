/**
 * DATOS DE SALAS - ABISMO
 * Definición de tipos de salas, paletas de biomas y parámetros procedurales
 */
(() => {
  'use strict';

  const TIPOS_SALA = {
    combate: {
      id: 'combate',
      name: 'Cámara de Batalla',
      icon: '⚔️',
      color: '#e11d48',
      hasEnemies: true,
      hasChest: false,
      hasShop: false
    },
    tesoro: {
      id: 'tesoro',
      name: 'Bóveda de Reliquias',
      icon: '💎',
      color: '#fbbf24',
      hasEnemies: false,
      hasChest: true,
      hasShop: false
    },
    tienda: {
      id: 'tienda',
      name: 'Mercader Umbrío',
      icon: '🪙',
      color: '#38bdf8',
      hasEnemies: false,
      hasChest: false,
      hasShop: true
    },
    descanso: {
      id: 'descanso',
      name: 'Santuario de Almas',
      icon: '💚',
      color: '#4ade80',
      hasEnemies: false,
      healPercent: 0.4,
      hasChest: false
    },
    elite: {
      id: 'elite',
      name: 'Cámara de la Bestia',
      icon: '💀',
      color: '#f43f5e',
      hasEnemies: true,
      isElite: true,
      hasChest: true
    },
    jefe: {
      id: 'jefe',
      name: 'Trono del Señor del Abismo',
      icon: '👑',
      color: '#a855f7',
      isBoss: true,
      hasEnemies: true
    }
  };

  // Biomas cada 5 pisos (Fase 4)
  const BIOMAS = [
    {
      id: 'cripta_inferior',
      name: 'Cripta Olvidada',
      floors: [1, 2, 3, 4, 5],
      floorColor1: '#12121a',
      floorColor2: '#0b0b10',
      wallColor: '#1c1a29',
      wallBorder: '#35314a',
      torchColor: 'rgba(56, 189, 248, 0.7)',
      ambientColor: 'rgba(56, 189, 248, 0.05)',
      palette: {
        BG: '#07070a',
        FLOOR_DARK: '#0b0b10',
        FLOOR_LIGHT: '#12121a',
        WALL: '#1c1a29',
        WALL_BORDER: '#35314a'
      }
    },
    {
      id: 'catacumbas_fuego',
      name: 'Catacumbas Ígneas',
      floors: [6, 7, 8, 9, 10],
      floorColor1: '#1c0f0b',
      floorColor2: '#120805',
      wallColor: '#2b140e',
      wallBorder: '#4a251b',
      torchColor: 'rgba(249, 115, 22, 0.85)',
      ambientColor: 'rgba(249, 115, 22, 0.08)',
      palette: {
        BG: '#0e0503',
        FLOOR_DARK: '#120805',
        FLOOR_LIGHT: '#1c0f0b',
        WALL: '#2b140e',
        WALL_BORDER: '#4a251b'
      }
    },
    {
      id: 'abismo_astral',
      name: 'Abismo Astral',
      floors: [11, 12, 13, 14, 15],
      floorColor1: '#0d0918',
      floorColor2: '#07050d',
      wallColor: '#1d1230',
      wallBorder: '#3c2460',
      torchColor: 'rgba(168, 85, 247, 0.85)',
      ambientColor: 'rgba(168, 85, 247, 0.08)',
      palette: {
        BG: '#05030a',
        FLOOR_DARK: '#07050d',
        FLOOR_LIGHT: '#0d0918',
        WALL: '#1d1230',
        WALL_BORDER: '#3c2460'
      }
    }
  ];

  // Generador Procedural de Mazmorra Conexa (Fases 2 y 4: Soporte de Mapa Grande, Pisos y Jefes)
  class DungeonGenerator {
    static getBiomeForFloor(floor = 1) {
      const biomeIdx = Math.floor((floor - 1) / 5) % BIOMAS.length;
      return BIOMAS[biomeIdx] || BIOMAS[0];
    }

    static generate(gridSize = 5, roomCount = 10, floor = 1) {
      const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));

      const biomeIdx = Math.floor((floor - 1) / 5) % BIOMAS.length;
      const currentBiome = BIOMAS[biomeIdx] || BIOMAS[0];
      const isBossFloor = (floor % 5 === 0);

      const startX = Math.floor(gridSize / 2);
      const startY = Math.floor(gridSize / 2);

      const rooms = [];
      const startRoom = {
        id: `room_${startX}_${startY}`,
        gx: startX,
        gy: startY,
        type: 'inicio',
        typeData: { id: 'inicio', name: 'Entrada a la Cripta', icon: '🏛️', color: '#38bdf8' },
        doors: { N: false, S: false, E: false, W: false },
        cleared: false,
        visited: true,
        mapped: true,
        waves: [
          { count: 4, enemies: ['perseguidor', 'perseguidor', 'corredor', 'tirador'] },
          { count: 5, enemies: ['perseguidor', 'corredor', 'tirador', 'explosivo', 'escudado'] }
        ],
        chestOpened: false,
        shrineUsed: false,
        hasPortal: false,
        biome: currentBiome,
        floor: floor
      };
      grid[startX][startY] = startRoom;
      rooms.push(startRoom);

      const directions = [
        { dx: 0, dy: -1, door: 'N', opp: 'S' },
        { dx: 0, dy: 1, door: 'S', opp: 'N' },
        { dx: 1, dy: 0, door: 'E', opp: 'W' },
        { dx: -1, dy: 0, door: 'W', opp: 'E' }
      ];

      // Expansión conexa por frontera
      while (rooms.length < roomCount) {
        const source = rooms[Math.floor(Math.random() * rooms.length)];
        const validDirs = directions.filter(d => {
          const nx = source.gx + d.dx;
          const ny = source.gy + d.dy;
          return nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize && !grid[nx][ny];
        });

        if (validDirs.length === 0) continue;

        const chosenDir = validDirs[Math.floor(Math.random() * validDirs.length)];
        const nx = source.gx + chosenDir.dx;
        const ny = source.gy + chosenDir.dy;

        const newRoom = {
          id: `room_${nx}_${ny}`,
          gx: nx,
          gy: ny,
          type: 'combate',
          doors: { N: false, S: false, E: false, W: false },
          cleared: false,
          visited: false,
          mapped: false,
          waves: [],
          chestOpened: false,
          shrineUsed: false,
          hasPortal: false,
          biome: currentBiome,
          floor: floor
        };

        grid[nx][ny] = newRoom;
        rooms.push(newRoom);
      }

      // Conectar puertas bidireccionales
      for (const r of rooms) {
        for (const d of directions) {
          const nx = r.gx + d.dx;
          const ny = r.gy + d.dy;
          if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize && grid[nx][ny]) {
            r.doors[d.door] = true;
          }
        }
      }

      // Calcular distancias BFS desde el inicio
      const queue = [{ room: startRoom, dist: 0 }];
      const distMap = new Map();
      distMap.set(startRoom.id, 0);

      while (queue.length > 0) {
        const { room, dist } = queue.shift();
        for (const d of directions) {
          if (room.doors[d.door]) {
            const neighbor = grid[room.gx + d.dx][room.gy + d.dy];
            if (neighbor && !distMap.has(neighbor.id)) {
              distMap.set(neighbor.id, dist + 1);
              queue.push({ room: neighbor, dist: dist + 1 });
            }
          }
        }
      }

      const sortedByDist = [...rooms.filter(r => r !== startRoom)].sort(
        (a, b) => distMap.get(b.id) - distMap.get(a.id)
      );

      // Si es piso de Jefe (ej: Piso 5, 10), la sala más lejana es la Sala del Jefe
      let bossRoom = null;
      let exitRoom = null;

      if (isBossFloor && sortedByDist.length > 0) {
        bossRoom = sortedByDist.shift();
        bossRoom.type = 'jefe';
        bossRoom.typeData = TIPOS_SALA.jefe;
        bossRoom.isBoss = true;
        bossRoom.hasPortal = true; // Al vencer al jefe se activa el portal de descenso
        const bossType = floor >= 10 ? 'jefe_magma' : 'jefe_cripta';
        bossRoom.waves = [
          { count: 1, enemies: [bossType], hasBoss: true }
        ];
        exitRoom = bossRoom;
      } else if (sortedByDist.length > 0) {
        // En pisos regulares, la sala más lejana contiene la trampilla de descenso al siguiente piso
        exitRoom = sortedByDist[0];
        exitRoom.hasPortal = true;
        bossRoom = exitRoom;
      }

      // Asignar salas especiales
      if (sortedByDist.length > 0) {
        const eliteRoom = sortedByDist.shift();
        eliteRoom.type = 'elite';
        eliteRoom.typeData = TIPOS_SALA.elite;
      }

      if (sortedByDist.length > 0) {
        const treasureRoom = sortedByDist.shift();
        treasureRoom.type = 'tesoro';
        treasureRoom.typeData = TIPOS_SALA.tesoro;
        treasureRoom.cleared = true;
      }

      if (sortedByDist.length > 0) {
        const restRoom = sortedByDist.shift();
        restRoom.type = 'descanso';
        restRoom.typeData = TIPOS_SALA.descanso;
        restRoom.cleared = true;
      }

      if (sortedByDist.length > 0) {
        const shopRoom = sortedByDist.shift();
        shopRoom.type = 'tienda';
        shopRoom.typeData = TIPOS_SALA.tienda;
        shopRoom.cleared = true;
        shopRoom.shopItems = null; // Se inicializan al entrar a la sala
      }

      // Asignar combate al resto
      for (const r of rooms) {
        if (!r.typeData) {
          r.type = 'combate';
          r.typeData = TIPOS_SALA.combate;
        }
      }

      // Oleadas estructuradas con escalado sutil de piso
      const floorDiffBonus = Math.min(3, Math.floor((floor - 1) / 2));
      for (const r of rooms) {
        if (r.type === 'combate') {
          r.waves = [
            { count: 4 + floorDiffBonus, enemies: ['perseguidor', 'perseguidor', 'corredor', 'tirador'] },
            { count: 5 + floorDiffBonus, enemies: ['perseguidor', 'corredor', 'tirador', 'explosivo', 'escudado'] }
          ];
        } else if (r.type === 'elite') {
          r.waves = [
            { count: 5 + floorDiffBonus, enemies: ['perseguidor', 'tirador', 'invocador', 'escudado'], hasElite: true }
          ];
        }
      }

      // Marcar adyacentes a la sala inicial como mapeadas en el mini-mapa
      for (const d of directions) {
        if (startRoom.doors[d.door]) {
          const adj = grid[startRoom.gx + d.dx][startRoom.gy + d.dy];
          if (adj) adj.mapped = true;
        }
      }

      return {
        grid,
        rooms,
        startRoom,
        exitRoom,
        bossRoom,
        gridSize,
        floor,
        currentBiome,
        biome: currentBiome,
        isBossFloor
      };
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TIPOS_SALA, BIOMAS, DungeonGenerator };
  }
  if (typeof window !== 'undefined') {
    window.ABISMO_TIPOS_SALA = TIPOS_SALA;
    window.ABISMO_BIOMAS = BIOMAS;
    window.ABISMO_DUNGEON_GEN = DungeonGenerator;
  }
})();
