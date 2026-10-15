/**
 * games/lanzaburbujas/game.js - Lanzaburbujas Arcade 00s (v2.0)
 * Hexagonal bubble shooter con física balística, rebotes en paredes, burbujas de jabón iridiscentes,
 * lanzador hidromecánico "Hydro-Nautilo" con retroceso elástico, 60 niveles en 4 mundos submarinos,
 * jefes temáticos con telegrafiado, potenciadores utilizables, audio generativo y soporte de accesibilidad.
 */
(() => {
  'use strict';

  // ==========================================
  // CONFIGURACIÓN Y CONSTANTES DE BALANCE
  // ==========================================
  const CONFIG = {
    COLS_EVEN: 8,
    COLS_ODD: 7,
    MAX_ROWS: 13,
    DEADLINE_ROW: 10,
    VIRTUAL_W: 400,
    VIRTUAL_H: 580,
    STORAGE_KEY_PREFIX: 'lanzaburbujas:v2',
    STORAGE_KEY_V1: 'lanzaburbujas:v1',

    // Colores de burbujas Aqua 00s translúcidas con paleta iridiscente
    COLORS: [
      { id: 1, name: 'RED',     main: '#ff2e63', dark: '#990026', light: '#ff99b3', glow: 'rgba(255, 46, 99, 0.6)' },
      { id: 2, name: 'BLUE',    main: '#00d2fc', dark: '#005980', light: '#99f2ff', glow: 'rgba(0, 210, 252, 0.6)' },
      { id: 3, name: 'GREEN',   main: '#00e676', dark: '#006633', light: '#99ffcc', glow: 'rgba(0, 230, 118, 0.6)' },
      { id: 4, name: 'YELLOW',  main: '#ffea00', dark: '#807500', light: '#fff899', glow: 'rgba(255, 234, 0, 0.6)' },
      { id: 5, name: 'PURPLE',  main: '#d500f9', dark: '#610073', light: '#f499ff', glow: 'rgba(213, 0, 249, 0.6)' },
      { id: 6, name: 'ORANGE',  main: '#ff6d00', dark: '#803600', light: '#ffc599', glow: 'rgba(255, 109, 0, 0.6)' }
    ],

    SPECIALS: {
      NONE: 0,
      BOMB: 90,      // Explota radio adyacente (2 hexágonos)
      RAINBOW: 91,   // Comodín multicolor
      ROCK: 92,      // Obstáculo indestructible (solo cae)
      LIGHTNING: 93, // Detona toda la fila horizontal
      SHIFTER: 94    // Muta de color periódicamente
    },

    PROJECTILE_SPEED: 980, // Píxeles por segundo
    BASE_MISSES_TO_DROP: 5,

    // Duraciones y retardos de animación (constantes centralizadas)
    ANIM: {
      SHOT_BOUNCE: 0.22,
      RIPPLE_DURATION: 0.24,
      POP_STAGGER_MS: 30,
      POP_DURATION: 0.22,
      RECOIL_DURATION: 0.18,
      RELOAD_DURATION: 0.22,
      SWAP_DURATION: 0.20,
      CEILING_DROP_DURATION: 0.35,
      LEVEL_INTRO_STAGGER_MS: 30,
      SCORE_COUNTUP_SPEED: 1200
    },

    WORLDS: [
      { id: 1, name: 'Laguna Esmeralda', desc: 'Niveles 1 al 15 • Obstáculo: Bombas y Techo descendente', boss: 'Kraken Esmeralda' },
      { id: 2, name: 'Arrecife de Neón', desc: 'Niveles 16 al 30 • Obstáculo: Rocas y Burbujas Cambiantes', boss: 'Leviatán de Coral' },
      { id: 3, name: 'Fosa Abisal', desc: 'Niveles 31 al 45 • Obstáculo: Rayos Horizontales y Oscuridad', boss: 'Gorgona Abisal' },
      { id: 4, name: 'Caldera Submarina', desc: 'Niveles 46 al 60 • Obstáculo: Magma y Techo Rápido', boss: 'Titán del Núcleo' }
    ],

    ACHIEVEMENTS: [
      { id: 'FIRST_POP', icon: '🫧', title: 'Primer Estallido', desc: 'Revienta tu primer racimo de burbujas' },
      { id: 'BANK_SHOT', icon: '📐', title: 'Tiro con Rebote', desc: 'Revienta un grupo rebotando en la pared' },
      { id: 'BUBBLE_RAIN', icon: '🌧️', title: 'Lluvia Marina', desc: 'Desprende 5 o más burbujas huérfanas de un tiro' },
      { id: 'SNIPER', icon: '⭐', title: 'Francotirador Acuático', desc: 'Consigue 3 estrellas en cualquier nivel' },
      { id: 'KRAKEN_SLAYER', icon: '🦑', title: 'Maestro de la Laguna', desc: 'Derrota al Kraken en el Nivel 15' },
      { id: 'ABYSS_CONQUEROR', icon: '🔱', title: 'Conquistador Abisal', desc: 'Supera los 60 niveles de campaña' },
      { id: 'BOOSTER_MASTER', icon: '💣', title: 'Artillero Experto', desc: 'Utiliza los 3 tipos de potenciadores' },
      { id: 'COMBO_STREAK', icon: '🔥', title: 'Racha Imparable', desc: 'Consigue un combo de 5 o más aciertos consecutivos' }
    ],

    // 60 NIVELES DEFINIDOS COMO DATOS
    LEVELS: (() => {
      const LEVEL_NAMES = [
        // Mundo 1: Laguna Esmeralda (1-15)
        "Despeje Inicial", "Rayas Cruzadas", "Anillos Gemelos", "El Refugio de Bombas", "Corona de Cristal",
        "Ondas Turquesa", "Mosaico Hexagonal", "Laguna Serena", "Vórtice Espiral", "Laberinto de Cañas",
        "Manantial Claro", "Columnas de Jade", "Arco Esmeralda", "Burbujas en Cascada", "Kraken Esmeralda",
        // Mundo 2: Arrecife de Neón (16-30)
        "Coral Fosforescente", "Bancos de Neón", "Estepa de Polípos", "Muro Pétreo", "Estrella de Mar",
        "Caverna Violeta", "Prisma de Calipso", "Formación de Roca", "Atolón Luminoso", "Pared de Púrpura",
        "Corrientes Eléctricas", "Laberinto Radiante", "Faro Bioluminiscente", "Fortaleza Gemela", "Leviatán de Coral",
        // Mundo 3: Fosa Abisal (31-45)
        "Descenso Oscuro", "Umbral de Medianoche", "Danza de Medusas", "Rayo Submarino", "Aguas Pesadas",
        "Cañón de Cobalto", "Manto Abisal", "Reflejos Fantasmales", "Columnas Titánicas", "Fisura Profunda",
        "Pirámide Invertida", "Relámpagos Azules", "Ojo del Huracán", "Campo de Minas", "Gorgona Abisal",
        // Mundo 4: Caldera Submarina (46-60)
        "Venteo Hidrotermal", "Magma Submarino", "Chimenea de Humo", "Geiser Volcánico", "Rocas Incandescentes",
        "Grieta Ígnea", "Burbujas de Basalto", "Furia Geotérmica", "Corazón de Lava", "Asedio de Fuego",
        "Caldera Hirviente", "Anillo de Magma", "Infierno Acuático", "Desafío Maestro", "Titán del Núcleo"
      ];

      const levels = [];
      for (let i = 1; i <= 60; i++) {
        const world = Math.ceil(i / 15);
        const name = LEVEL_NAMES[i - 1];
        const isBoss = (i % 15 === 0);
        const parShots = Math.min(24, 10 + Math.floor(i / 3));

        const numRows = Math.min(7, 3 + Math.floor((i - 1) / 12));
        const rows = [];
        const maxColors = world === 1 ? 3 + Math.floor((i - 1) / 5) : (world === 2 ? 4 + (i > 22 ? 1 : 0) : (world === 3 ? 5 + (i > 37 ? 1 : 0) : 6));
        const colorPalette = [1, 2, 3, 4, 5, 6].slice(0, Math.min(6, Math.max(3, maxColors)));

        for (let r = 0; r < numRows; r++) {
          const isEven = (r % 2 === 0);
          const cols = isEven ? 8 : 7;
          const rowArr = [];

          for (let c = 0; c < cols; c++) {
            let val = 0;
            if (isBoss && r === 0) {
              val = colorPalette[(c + r) % colorPalette.length];
            } else if (world === 1) {
              if (i === 4 && (c === 2 || c === 5) && r === 1) val = 90;
              else if (i === 5 && r === 2 && (c === 2 || c === 4)) val = 91;
              else {
                const clusterIdx = Math.floor(c / 2) + (r % 2);
                val = colorPalette[clusterIdx % colorPalette.length];
              }
            } else if (world === 2) {
              if ((i % 3 === 0) && (c === 0 || c === cols - 1) && r === 1) val = 92;
              else if ((i % 4 === 0) && r === 2 && c === Math.floor(cols / 2)) val = 94;
              else if ((i % 5 === 0) && r === 1 && c === 3) val = 90;
              else val = colorPalette[(c + r * 2) % colorPalette.length];
            } else if (world === 3) {
              if ((i % 3 === 0) && r === 1 && c === 3) val = 93;
              else if ((i % 4 === 0) && r === 2 && (c === 1 || c === cols - 2)) val = 92;
              else if ((i % 2 === 0) && r === 1 && c === 2) val = 90;
              else val = colorPalette[(Math.floor(c / 2) + r) % colorPalette.length];
            } else {
              if ((c === 2 || c === 5) && r === 1) val = 90;
              else if (r === 2 && c === 3) val = 93;
              else if ((c === 0 || c === cols - 1) && r === 2) val = 92;
              else if (r === 3 && (c === 2 || c === 4)) val = 94;
              else val = colorPalette[(c * 2 + r) % colorPalette.length];
            }
            rowArr.push(val);
          }
          rows.push(rowArr);
        }

        const lvlObj = { id: i, world, name, parShots, rows };
        if (isBoss) {
          lvlObj.isBoss = true;
          lvlObj.bossName = name;
          lvlObj.bossHp = 4 + (world * 2);
        }
        levels.push(lvlObj);
      }
      return levels;
    })()
  };

  // ==========================================
  // LÓGICA PURA Y SIMULACIÓN (Testeable en Node)
  // ==========================================
  const LanzaburbujasLogic = {
    /**
     * Retorna los vecinos hexagonales adyacentes teniendo en cuenta el desfase de filas.
     */
    getHexNeighbors(r, c, maxRows = CONFIG.MAX_ROWS, colsEven = CONFIG.COLS_EVEN, colsOdd = CONFIG.COLS_ODD) {
      const neighbors = [];
      const isEven = (r % 2 === 0);
      const cols = isEven ? colsEven : colsOdd;

      // Izquierda y Derecha
      if (c > 0) neighbors.push({ r, c: c - 1 });
      if (c < cols - 1) neighbors.push({ r, c: c + 1 });

      // Arriba
      if (r > 0) {
        if (isEven) {
          if (c > 0) neighbors.push({ r: r - 1, c: c - 1 });
          if (c < colsOdd) neighbors.push({ r: r - 1, c });
        } else {
          neighbors.push({ r: r - 1, c });
          if (c + 1 < colsEven) neighbors.push({ r: r - 1, c: c + 1 });
        }
      }

      // Abajo
      if (r < maxRows - 1) {
        if (isEven) {
          if (c > 0) neighbors.push({ r: r + 1, c: c - 1 });
          if (c < colsOdd) neighbors.push({ r: r + 1, c });
        } else {
          neighbors.push({ r: r + 1, c });
          if (c + 1 < colsEven) neighbors.push({ r: r + 1, c: c + 1 });
        }
      }

      return neighbors;
    },

    /**
     * Calcula las coordenadas espaciales (x, y) del centro de una celda hexagonal.
     */
    getCellCenter(r, c, bubbleRadius) {
      const isEven = (r % 2 === 0);
      const rowHeight = bubbleRadius * Math.sqrt(3);
      const y = r * rowHeight + bubbleRadius;
      const xOffset = isEven ? bubbleRadius : bubbleRadius * 2;
      const x = c * (bubbleRadius * 2) + xOffset;
      return { x, y };
    },

    /**
     * Calcula la distancia métrica hexagonal en coordenadas axiales (even-r).
     */
    hexDistance(r1, c1, r2, c2) {
      const q1 = c1 - Math.floor(r1 / 2);
      const r_1 = r1;
      const s1 = -q1 - r_1;

      const q2 = c2 - Math.floor(r2 / 2);
      const r_2 = r2;
      const s2 = -q2 - r_2;

      return Math.max(Math.abs(q1 - q2), Math.abs(r_1 - r_2), Math.abs(s1 - s2));
    },

    /**
     * Encuentra el grupo conectado del mismo color (o comodines) usando BFS.
     */
    findConnectedCluster(grid, startR, startC) {
      const startCell = grid[startR]?.[startC];
      if (!startCell || startCell.color === 0) return [];

      const targetColor = startCell.color;
      const visited = new Set();
      const cluster = [];
      const queue = [{ r: startR, c: startC }];
      visited.add(`${startR},${startC}`);

      while (queue.length > 0) {
        const curr = queue.shift();
        cluster.push(curr);

        const neighbors = this.getHexNeighbors(curr.r, curr.c);
        for (const n of neighbors) {
          const key = `${n.r},${n.c}`;
          if (!visited.has(key)) {
            const neighborCell = grid[n.r]?.[n.c];
            if (neighborCell && neighborCell.color !== 0) {
              if (neighborCell.color === targetColor ||
                  neighborCell.special === CONFIG.SPECIALS.RAINBOW ||
                  targetColor === CONFIG.SPECIALS.RAINBOW) {
                visited.add(key);
                queue.push(n);
              }
            }
          }
        }
      }
      return cluster;
    },

    /**
     * Detecta burbujas huérfanas/flotantes que han quedado desconectadas del techo (fila 0).
     */
    findFloatingBubbles(grid, maxRows = CONFIG.MAX_ROWS) {
      const attached = new Set();
      const queue = [];

      const colsInRow0 = (0 % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
      for (let c = 0; c < colsInRow0; c++) {
        if (grid[0]?.[c] && grid[0][c].color !== 0) {
          attached.add(`0,${c}`);
          queue.push({ r: 0, c });
        }
      }

      while (queue.length > 0) {
        const curr = queue.shift();
        const neighbors = this.getHexNeighbors(curr.r, curr.c, maxRows);
        for (const n of neighbors) {
          const key = `${n.r},${n.c}`;
          if (!attached.has(key)) {
            if (grid[n.r]?.[n.c] && grid[n.r][n.c].color !== 0) {
              attached.add(key);
              queue.push(n);
            }
          }
        }
      }

      const floating = [];
      for (let r = 0; r < maxRows; r++) {
        const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
        for (let c = 0; c < maxCols; c++) {
          if (grid[r]?.[c] && grid[r][c].color !== 0) {
            if (!attached.has(`${r},${c}`)) {
              floating.push({ r, c });
            }
          }
        }
      }
      return floating;
    },

    /**
     * Retorna los colores regulares activos en el tablero.
     */
    getActiveColors(grid, maxRows = CONFIG.MAX_ROWS) {
      const colors = new Set();
      for (let r = 0; r < maxRows; r++) {
        const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
        for (let c = 0; c < maxCols; c++) {
          const cell = grid[r]?.[c];
          if (cell && cell.color > 0 && cell.color <= CONFIG.COLORS.length) {
            colors.add(cell.color);
          }
        }
      }
      return Array.from(colors);
    },

    /**
     * Simula la trayectoria balística con rebotes exactos en las paredes y retorno de impacto.
     */
    raycastTrajectory(startX, startY, angle, bubbleRadius, boardWidth, grid, maxRows = CONFIG.MAX_ROWS) {
      const path = [{ x: startX, y: startY }];
      let cx = startX;
      let cy = startY;
      let dx = Math.cos(angle);
      let dy = Math.sin(angle);
      const step = 4;
      let targetCell = null;

      for (let iter = 0; iter < 1200; iter++) {
        cx += dx * step;
        cy += dy * step;

        // Rebote en pared izquierda
        if (cx <= bubbleRadius) {
          cx = bubbleRadius;
          dx = -dx;
          path.push({ x: cx, y: cy });
        }
        // Rebote en pared derecha
        else if (cx >= boardWidth - bubbleRadius) {
          cx = boardWidth - bubbleRadius;
          dx = -dx;
          path.push({ x: cx, y: cy });
        }

        // Colisión con techo
        if (cy <= bubbleRadius) {
          cy = bubbleRadius;
          path.push({ x: cx, y: cy });
          targetCell = this.findNearestEmptyCell(cx, cy, bubbleRadius, grid, maxRows);
          break;
        }

        // Colisión con burbujas existentes
        let collided = false;
        for (let r = 0; r < maxRows; r++) {
          const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
          for (let c = 0; c < maxCols; c++) {
            if (grid[r]?.[c] && grid[r][c].color !== 0) {
              const bCenter = this.getCellCenter(r, c, bubbleRadius);
              const distSq = (cx - bCenter.x) ** 2 + (cy - bCenter.y) ** 2;
              if (distSq <= (bubbleRadius * 1.85) ** 2) {
                collided = true;
                break;
              }
            }
          }
          if (collided) break;
        }

        if (collided) {
          path.push({ x: cx, y: cy });
          targetCell = this.findNearestEmptyCell(cx, cy, bubbleRadius, grid, maxRows);
          break;
        }
      }

      return { path, targetCell };
    },

    /**
     * Simula paso a paso la física exacta de un disparo real para contrastar contra la guía.
     */
    simulatePhysicalShot(startX, startY, angle, speed, dt, bubbleRadius, boardWidth, grid, maxRows = CONFIG.MAX_ROWS) {
      let x = startX;
      let y = startY;
      let vx = Math.cos(angle) * speed;
      let vy = Math.sin(angle) * speed;
      let targetCell = null;

      for (let tick = 0; tick < 2000; tick++) {
        // Sub-paso para garantizar resolución idéntica a raycast
        const substeps = 4;
        const subDt = dt / substeps;

        for (let s = 0; s < substeps; s++) {
          x += vx * subDt;
          y += vy * subDt;

          if (x <= bubbleRadius) {
            x = bubbleRadius;
            vx = -vx;
          } else if (x >= boardWidth - bubbleRadius) {
            x = boardWidth - bubbleRadius;
            vx = -vx;
          }

          if (y <= bubbleRadius) {
            y = bubbleRadius;
            targetCell = this.findNearestEmptyCell(x, y, bubbleRadius, grid, maxRows);
            return { x, y, targetCell };
          }

          let collided = false;
          for (let r = 0; r < maxRows; r++) {
            const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
            for (let c = 0; c < maxCols; c++) {
              if (grid[r]?.[c] && grid[r][c].color !== 0) {
                const bCenter = this.getCellCenter(r, c, bubbleRadius);
                const distSq = (x - bCenter.x) ** 2 + (y - bCenter.y) ** 2;
                if (distSq <= (bubbleRadius * 1.85) ** 2) {
                  collided = true;
                  break;
                }
              }
            }
            if (collided) break;
          }

          if (collided) {
            targetCell = this.findNearestEmptyCell(x, y, bubbleRadius, grid, maxRows);
            return { x, y, targetCell };
          }
        }
      }
      return { x, y, targetCell };
    },

    /**
     * Encuentra la celda vacía más cercana al punto de impacto (px, py).
     */
    findNearestEmptyCell(px, py, bubbleRadius, grid, maxRows = CONFIG.MAX_ROWS) {
      let bestDist = Infinity;
      let bestCell = null;

      for (let r = 0; r < maxRows; r++) {
        const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
        for (let c = 0; c < maxCols; c++) {
          if (!grid[r]?.[c] || grid[r][c].color === 0) {
            const center = this.getCellCenter(r, c, bubbleRadius);
            const dist = (px - center.x) ** 2 + (py - center.y) ** 2;
            if (dist < bestDist) {
              bestDist = dist;
              bestCell = { r, c };
            }
          }
        }
      }
      return bestCell;
    },

    /**
     * Valida si un nivel es matemáticamente resoluble y coherente estructuralmente.
     */
    isLevelSolvable(level) {
      if (!level || !level.rows || level.rows.length < 3 || level.rows.length > 7) return false;
      if (!level.parShots || level.parShots < 6) return false;

      let totalBubbles = 0;
      let regularBubbles = 0;
      let rockBubbles = 0;

      for (let r = 0; r < level.rows.length; r++) {
        const isEven = (r % 2 === 0);
        const expectedCols = isEven ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
        if (level.rows[r].length !== expectedCols) return false;

        for (let c = 0; c < expectedCols; c++) {
          const val = level.rows[r][c];
          if (val !== 0) {
            totalBubbles++;
            if (val >= 1 && val <= 6) regularBubbles++;
            if (val === CONFIG.SPECIALS.ROCK) rockBubbles++;
          }
        }
      }

      if (totalBubbles === 0) return false;
      if (regularBubbles < 3 && totalBubbles > 5) return false;
      if (rockBubbles > totalBubbles * 0.45) return false;
      if (level.parShots < Math.ceil(totalBubbles / 4)) return false;

      return true;
    },

    /**
     * Crea e inicializa una rejilla de sprites visuales correspondiente a la lógica.
     */
    createVisualGrid(grid, bubbleRadius, maxRows = CONFIG.MAX_ROWS) {
      const vGrid = [];
      for (let r = 0; r < maxRows; r++) {
        const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
        vGrid[r] = [];
        for (let c = 0; c < maxCols; c++) {
          const cell = grid[r]?.[c];
          const color = cell ? cell.color : 0;
          const special = cell ? cell.special : 0;
          const center = this.getCellCenter(r, c, bubbleRadius);
          vGrid[r][c] = {
            color,
            special,
            x: center.x,
            y: center.y,
            targetX: center.x,
            targetY: center.y,
            scale: color > 0 ? 1 : 0,
            alpha: color > 0 ? 1 : 0,
            rotation: 0,
            offsetX: 0,
            offsetY: 0
          };
        }
      }
      return vGrid;
    },

    /**
     * Sincroniza el estado de la rejilla visual con el de la rejilla lógica.
     */
    syncVisualGrid(logicGrid, visualGrid, bubbleRadius, maxRows = CONFIG.MAX_ROWS) {
      for (let r = 0; r < maxRows; r++) {
        const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
        if (!visualGrid[r]) visualGrid[r] = [];
        for (let c = 0; c < maxCols; c++) {
          const lCell = logicGrid[r]?.[c] || { color: 0, special: 0 };
          const center = this.getCellCenter(r, c, bubbleRadius);
          if (!visualGrid[r][c]) {
            visualGrid[r][c] = {
              color: lCell.color,
              special: lCell.special,
              x: center.x,
              y: center.y,
              targetX: center.x,
              targetY: center.y,
              scale: lCell.color > 0 ? 1 : 0,
              alpha: lCell.color > 0 ? 1 : 0,
              rotation: 0,
              offsetX: 0,
              offsetY: 0
            };
          } else {
            visualGrid[r][c].color = lCell.color;
            visualGrid[r][c].special = lCell.special;
            visualGrid[r][c].targetX = center.x;
            visualGrid[r][c].targetY = center.y;
            if (lCell.color > 0 && visualGrid[r][c].scale <= 0) {
              visualGrid[r][c].scale = 1;
              visualGrid[r][c].alpha = 1;
            } else if (lCell.color === 0) {
              visualGrid[r][c].scale = 0;
              visualGrid[r][c].alpha = 0;
            }
          }
        }
      }
    },

    /**
     * Verifica la consistencia matemática entre el estado lógico y el estado visual.
     * Retorna { valid: boolean, errors: string[] }
     */
    verifyVisualLogicConsistency(logicGrid, visualGrid, maxRows = CONFIG.MAX_ROWS) {
      const errors = [];
      let logicCount = 0;
      let visualCount = 0;

      for (let r = 0; r < maxRows; r++) {
        const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
        for (let c = 0; c < maxCols; c++) {
          const lCell = logicGrid[r]?.[c];
          const vCell = visualGrid[r]?.[c];

          const lHasBubble = lCell && lCell.color > 0;
          const vHasBubble = vCell && vCell.color > 0 && vCell.scale > 0 && vCell.alpha > 0;

          if (lHasBubble) logicCount++;
          if (vHasBubble) visualCount++;

          if (lHasBubble && !vHasBubble) {
            errors.push(`Burbuja perdida en (${r},${c}): lógica color=${lCell.color}, visual escala=${vCell ? vCell.scale : 'null'}`);
          } else if (!lHasBubble && vHasBubble) {
            errors.push(`Burbuja fantasma en (${r},${c}): lógica vacía, pero visual activa color=${vCell.color}`);
          } else if (lHasBubble && vHasBubble) {
            if (lCell.color !== vCell.color) {
              errors.push(`Discrepancia de color en (${r},${c}): lógica=${lCell.color}, visual=${vCell.color}`);
            }
          }
        }
      }

      if (logicCount !== visualCount) {
        errors.push(`Desincronización en conteo total: lógica=${logicCount}, visual=${visualCount}`);
      }

      return {
        valid: errors.length === 0,
        errors,
        logicCount,
        visualCount
      };
    }
  };

  // Exportar para pruebas unitarias en Node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, LanzaburbujasLogic };
    return;
  }

  // ==========================================
  // ESTADO DEL JUEGO Y VARIABLES DE SESIÓN
  // ==========================================
  const State = {
    canvas: null,
    ctx: null,
    boardW: 400,
    boardH: 580,
    bubbleRadius: 25,

    grid: [],
    visualGrid: [], // Rejilla visual de sprites { color, special, x, y, targetX, targetY, scale, alpha, rotation, offsetX, offsetY }
    currentLevelIdx: 0,
    currentWorld: 1,
    isEndless: false,
    isDaily: false,

    score: 0,
    displayedScore: 0,
    bestScore: 0,
    missedShots: 0,
    ceilingDropInterval: CONFIG.BASE_MISSES_TO_DROP,
    ceilingAnimOffset: 0,
    shotsFiredInLevel: 0,
    comboStreak: 0,

    // Jefes
    bossHp: 0,
    bossMaxHp: 0,
    bossAttackPending: false,

    // Potenciadores utilizables
    boosters: { bomb: 3, rainbow: 3, aim: 3 },
    activeBooster: null,

    state: 'MENU', // 'MENU', 'AIMING', 'SHOOTING', 'POPPING', 'PAUSED', 'GAMEOVER', 'VICTORY'

    // Cañón y mecanismo lanzador
    aimAngle: -Math.PI / 2,
    isDragging: false,
    cannonX: 200,
    cannonY: 530,
    recoilOffset: 0,
    recoilVel: 0,
    reloadT: 1,

    currentAmmo: { color: 1, special: 0 },
    nextAmmo: { color: 2, special: 0 },
    nextAmmoScale: 1,
    reloadingAmmo: null,
    swapAnim: null,
    isSwappingAmmo: false,
    projectile: null,

    // Burbujas que caen con física suave
    fallingBubbles: [],

    // Partículas y textos flotantes
    floatingTexts: [],
    ambientBubbles: [],
    animTime: 0,

    // Rendimiento y diagnóstico (?debug=1)
    fps: 60,
    frameTimeMs: 16.6,
    lowQualityMode: false,
    isDebug: typeof window !== 'undefined' && window.location && window.location.search && window.location.search.includes('debug=1'),

    lastTime: 0,
    achievements: {},
    options: { sfx: true, bgm: true, vibration: true, contrast: false }
  };

  // Referencias DOM
  const dom = {
    container: document.getElementById('game-container'),
    header: document.getElementById('game-header'),
    subBar: document.getElementById('sub-bar'),
    canvas: document.getElementById('game-canvas'),
    nextCanvas: document.getElementById('next-bubble-canvas'),

    scoreVal: document.getElementById('score-val'),
    ceilingShotsVal: document.getElementById('ceiling-shots-val'),
    shotsFiredVal: document.getElementById('shots-fired-val'),
    levelTitleDisplay: document.getElementById('level-title-display'),

    // Barra de Jefe
    bossBanner: document.getElementById('boss-banner'),
    bossName: document.getElementById('boss-name'),
    bossHpText: document.getElementById('boss-hp-text'),
    bossHpFill: document.getElementById('boss-hp-fill'),
    bossAttackWarn: document.getElementById('boss-attack-warn'),

    // Launcher dock & Boosters
    launcherDock: document.getElementById('launcher-dock'),
    dockCenterClearance: document.getElementById('dock-center-clearance'),
    btnSwapAmmo: document.getElementById('btn-swap-ammo'),
    btnBoosterBomb: document.getElementById('btn-booster-bomb'),
    btnBoosterRainbow: document.getElementById('btn-booster-rainbow'),
    btnBoosterAim: document.getElementById('btn-booster-aim'),
    countBoosterBomb: document.getElementById('count-booster-bomb'),
    countBoosterRainbow: document.getElementById('count-booster-rainbow'),
    countBoosterAim: document.getElementById('count-booster-aim'),

    // Botones de acción
    btnPauseHeader: document.getElementById('btn-pause-header'),
    btnSoundToggle: document.getElementById('btn-sound-toggle'),
    iconSoundOn: document.getElementById('icon-sound-on'),
    iconSoundOff: document.getElementById('icon-sound-off'),
    btnAchievementsToggle: document.getElementById('btn-achievements-toggle'),
    btnOptionsToggle: document.getElementById('btn-options-toggle'),

    // Modales
    startCard: document.getElementById('start-card'),
    levelsGrid: document.getElementById('levels-grid'),
    worldBanner: document.getElementById('world-banner'),
    worldBadge: document.getElementById('world-badge'),
    worldDesc: document.getElementById('world-desc'),
    worldTabs: document.querySelectorAll('.world-tab'),
    btnOpenDaily: document.getElementById('btn-open-daily'),
    btnEndlessMode: document.getElementById('btn-endless-mode'),

    // Modal Diario
    modalDaily: document.getElementById('modal-daily'),
    btnStartDaily: document.getElementById('btn-start-daily'),
    btnCloseDaily: document.getElementById('btn-close-daily'),

    // Modal Pausa
    overlayPause: document.getElementById('overlay-pause'),
    btnResume: document.getElementById('btn-resume'),
    btnRestartLevel: document.getElementById('btn-restart-level'),
    btnLevelSelect: document.getElementById('btn-level-select'),

    // Modal Resultado
    overlayResult: document.getElementById('overlay-result'),
    resultIcon: document.getElementById('result-icon'),
    resultTitle: document.getElementById('result-title'),
    resultSubtitle: document.getElementById('result-subtitle'),
    resultScoreVal: document.getElementById('result-score-val'),
    resultBestVal: document.getElementById('result-best-val'),
    starsRow: document.getElementById('stars-row'),
    btnNextLevel: document.getElementById('btn-next-level'),
    btnRetryLevel: document.getElementById('btn-retry-level'),
    btnExitToLevels: document.getElementById('btn-exit-to-levels'),

    // Modal Logros & Opciones
    modalAchievements: document.getElementById('modal-achievements'),
    achList: document.getElementById('ach-list'),
    btnCloseAch: document.getElementById('btn-close-ach'),
    modalOptions: document.getElementById('modal-options'),
    optSfx: document.getElementById('opt-sfx'),
    optBgm: document.getElementById('opt-bgm'),
    optVibration: document.getElementById('opt-vibration'),
    optContrast: document.getElementById('opt-contrast'),
    btnCloseOptions: document.getElementById('btn-close-options')
  };

  // ==========================================
  // AUDIO SINTETIZADO CON WEB AUDIO
  // ==========================================
  let bgmOsc = null;
  let bgmGain = null;
  let bgmStep = 0;
  let bgmInterval = null;

  function playAudio(type, extra = 1) {
    if (!State.options.sfx || !window.ArcadeAudio || window.ArcadeAudio.isMuted) return;

    try {
      const actx = window.ArcadeAudio.ctx;
      if (!actx) return;
      const now = actx.currentTime;

      switch (type) {
        case 'shoot': {
          // Golpe hidráulico y liberación de burbuja
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(780, now + 0.1);
          gain.gain.setValueAtTime(0.22, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        }

        case 'bounce': {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(620, now);
          osc.frequency.linearRampToValueAtTime(480, now + 0.05);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.05);
          break;
        }

        case 'pop': {
          // Sonido pop satisfactorio modulado con tono creciente por combo
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'sine';
          const baseFreq = 540 + Math.min(600, extra * 70);
          osc.frequency.setValueAtTime(baseFreq, now);
          osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.1, now + 0.07);
          gain.gain.setValueAtTime(0.28, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.07);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.07);
          break;
        }

        case 'drop': {
          // Chapoteo en agua al caer racimo
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.linearRampToValueAtTime(140, now + 0.22);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.22);
          break;
        }

        case 'bomb_blast': {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(35, now + 0.4);
          gain.gain.setValueAtTime(0.45, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.4);
          break;
        }

        case 'laser': {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(900, now);
          osc.frequency.exponentialRampToValueAtTime(180, now + 0.2);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.2);
          break;
        }

        case 'booster': {
          // Destello celestial
          [523.25, 659.25, 783.99].forEach((freq, i) => {
            const osc = actx.createOscillator();
            const gain = actx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.05);
            gain.gain.setValueAtTime(0.15, now + i * 0.05);
            gain.gain.linearRampToValueAtTime(0.01, now + i * 0.05 + 0.15);
            osc.connect(gain);
            gain.connect(actx.destination);
            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.15);
          });
          break;
        }

        case 'swap': {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(450, now);
          osc.frequency.exponentialRampToValueAtTime(650, now + 0.08);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now);
          osc.stop(now + 0.08);
          break;
        }

        case 'victory': {
          [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
            const osc = actx.createOscillator();
            const gain = actx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.1);
            gain.gain.setValueAtTime(0.25, now + idx * 0.1);
            gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.1 + 0.25);
            osc.connect(gain);
            gain.connect(actx.destination);
            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 0.25);
          });
          break;
        }

        case 'game_over': {
          [350, 310, 270, 220].forEach((freq, idx) => {
            const osc = actx.createOscillator();
            const gain = actx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.12);
            gain.gain.setValueAtTime(0.25, now + idx * 0.12);
            gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.12 + 0.2);
            osc.connect(gain);
            gain.connect(actx.destination);
            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 0.2);
          });
          break;
        }
      }
    } catch (e) {}
  }

  function startBGM() {
    if (!State.options.bgm || bgmInterval || !window.ArcadeAudio || window.ArcadeAudio.isMuted) return;

    try {
      const actx = window.ArcadeAudio.ctx;
      if (!actx) return;

      const pentatonicAqua = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
      bgmInterval = setInterval(() => {
        if (!State.options.bgm || State.state === 'PAUSED' || State.state === 'GAMEOVER') return;
        const now = actx.currentTime;
        const osc = actx.createOscillator();
        const gain = actx.createGain();

        const freq = pentatonicAqua[bgmStep % pentatonicAqua.length];
        bgmStep = (bgmStep + 1) % pentatonicAqua.length;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      }, 550);
    } catch (e) {}
  }

  function stopBGM() {
    if (bgmInterval) {
      clearInterval(bgmInterval);
      bgmInterval = null;
    }
  }

  // ==========================================
  // INICIALIZACIÓN Y CONFIGURACIÓN DE NIVELES
  // ==========================================
  function startLevel(lvlIdx, isDaily = false) {
    State.currentLevelIdx = lvlIdx;
    State.isDaily = isDaily;
    const lvl = CONFIG.LEVELS[lvlIdx] || CONFIG.LEVELS[0];
    State.currentWorld = lvl.world;
    updateBackgroundCache(State.boardW, State.boardH, State.currentWorld);

    State.score = 0;
    State.displayedScore = 0;
    State.missedShots = 0;
    State.shotsFiredInLevel = 0;
    State.comboStreak = 0;
    State.ceilingDropInterval = lvl.world === 4 ? 3 : (lvl.world === 3 ? 4 : CONFIG.BASE_MISSES_TO_DROP);
    State.ceilingAnimOffset = 0;
    State.activeBooster = null;
    State.swapAnim = null;
    State.reloadingAmmo = null;
    State.isSwappingAmmo = false;
    State.nextAmmoScale = 1;
    updateBoosterButtons();

    window.ArcadeTween?.clear();

    const rad = State.bubbleRadius || (State.boardW / (CONFIG.COLS_EVEN * 2));

    // Copiar tablero hexagonal del nivel y construir visualGrid con entrada en ola
    State.grid = [];
    State.visualGrid = [];

    for (let r = 0; r < CONFIG.MAX_ROWS; r++) {
      const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
      State.grid[r] = [];
      State.visualGrid[r] = [];

      for (let c = 0; c < maxCols; c++) {
        const val = lvl.rows[r]?.[c] || 0;
        const color = val >= 90 ? (val === 92 ? 0 : 1) : val;
        const special = val >= 90 ? val : CONFIG.SPECIALS.NONE;
        State.grid[r][c] = { color, special };

        const center = LanzaburbujasLogic.getCellCenter(r, c, rad);
        const vb = {
          color,
          special,
          x: center.x,
          y: center.y - 130, // Desplazamiento inicial superior para ola
          targetX: center.x,
          targetY: center.y,
          scale: color > 0 ? 0 : 1,
          alpha: color > 0 ? 1 : 0,
          rotation: 0,
          offsetX: 0,
          offsetY: 0
        };
        State.visualGrid[r][c] = vb;

        if (color > 0) {
          const delaySec = (r * CONFIG.ANIM.LEVEL_INTRO_STAGGER_MS + c * 15) * 0.001;
          window.ArcadeTween?.to(vb, 0.35, {
            y: center.y,
            scale: 1.0,
            alpha: 1.0
          }, {
            delay: delaySec,
            easing: 'easeOutBack'
          });
        }
      }
    }

    // Configurar Jefe si corresponde
    if (lvl.isBoss) {
      State.bossHp = lvl.bossHp;
      State.bossMaxHp = lvl.bossHp;
      State.bossAttackPending = false;
      dom.bossName.textContent = lvl.bossName;
      dom.bossHpText.textContent = `PV: ${State.bossHp}/${State.bossMaxHp}`;
      dom.bossHpFill.style.width = '100%';
      dom.bossAttackWarn.classList.add('hidden');
      dom.bossBanner.classList.remove('hidden');
    } else {
      State.bossHp = 0;
      dom.bossBanner.classList.add('hidden');
    }

    handleResize();

    // Inicializar munición dinámica
    refreshAmmo();

    // Estado activo
    State.state = 'AIMING';
    State.projectile = null;
    State.fallingBubbles = [];
    State.aimAngle = -Math.PI / 2;

    dom.startCard.classList.add('hidden');
    dom.overlayPause.classList.add('hidden');
    dom.overlayResult.classList.add('hidden');

    updateHUD();
    startBGM();
    window.ArcadeJuice?.trackPlay('lanzaburbujas', 0);
  }

  function refreshAmmo() {
    const active = LanzaburbujasLogic.getActiveColors(State.grid);
    const pool = active.length > 0 ? active : [1, 2, 3];

    State.currentAmmo = {
      color: pool[Math.floor(Math.random() * pool.length)],
      special: CONFIG.SPECIALS.NONE
    };
    State.nextAmmo = {
      color: pool[Math.floor(Math.random() * pool.length)],
      special: CONFIG.SPECIALS.NONE
    };
    State.nextAmmoScale = 1;

    renderNextAmmoPreview();
  }

  function swapAmmo() {
    if (State.state !== 'AIMING' || State.isSwappingAmmo) return;
    State.isSwappingAmmo = true;
    playAudio('swap');
    if (State.options.vibration) window.ArcadeCanvas?.haptic(15);

    const cx = State.cannonX;
    const cy = State.cannonY;
    const rad = State.bubbleRadius;
    const nx = cx - rad * 2.1;
    const ny = cy;

    State.swapAnim = {
      t: 0,
      cColor: State.currentAmmo.color,
      cSpecial: State.currentAmmo.special,
      nColor: State.nextAmmo.color,
      nSpecial: State.nextAmmo.special
    };

    window.ArcadeTween?.to(State.swapAnim, CONFIG.ANIM.SWAP_DURATION, { t: 1 }, {
      easing: 'easeInOutQuad',
      onComplete: () => {
        const temp = { ...State.currentAmmo };
        State.currentAmmo = { ...State.nextAmmo };
        State.nextAmmo = temp;
        State.swapAnim = null;
        State.isSwappingAmmo = false;
        renderNextAmmoPreview();
      }
    });
  }

  function renderNextAmmoPreview() {
    if (!dom.nextCanvas) return;
    const ctx = dom.nextCanvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 32, 32);
    renderBubble3D(ctx, 16, 16, 13, State.nextAmmo.color, State.nextAmmo.special);
  }

  // ==========================================
  // DISPARO Y GESTIÓN DE PROYECTILES
  // ==========================================
  function shootProjectile() {
    if (State.state !== 'AIMING' || State.projectile) return;

    let col = State.currentAmmo.color;
    let spec = State.currentAmmo.special;

    if (State.activeBooster === 'bomb') {
      spec = CONFIG.SPECIALS.BOMB;
      State.boosters.bomb = Math.max(0, State.boosters.bomb - 1);
      unlockAchievement('BOOSTER_MASTER');
    } else if (State.activeBooster === 'rainbow') {
      spec = CONFIG.SPECIALS.RAINBOW;
      col = CONFIG.SPECIALS.RAINBOW;
      State.boosters.rainbow = Math.max(0, State.boosters.rainbow - 1);
      unlockAchievement('BOOSTER_MASTER');
    } else if (State.activeBooster === 'aim') {
      State.boosters.aim = Math.max(0, State.boosters.aim - 1);
      unlockAchievement('BOOSTER_MASTER');
    }

    State.activeBooster = null;
    updateBoosterButtons();

    State.projectile = {
      x: State.cannonX,
      y: State.cannonY,
      vx: Math.cos(State.aimAngle) * CONFIG.PROJECTILE_SPEED,
      vy: Math.sin(State.aimAngle) * CONFIG.PROJECTILE_SPEED,
      color: col,
      special: spec,
      bounced: false
    };

    State.shotsFiredInLevel++;

    // Retroceso amortiguado del cañón
    State.recoilOffset = 16;
    window.ArcadeTween?.killTweensOf(State);
    window.ArcadeTween?.to(State, CONFIG.ANIM.RECOIL_DURATION, { recoilOffset: 0 }, {
      easing: 'easeOutElastic'
    });

    playAudio('shoot');
    if (State.options.vibration) window.ArcadeCanvas?.haptic(20);

    // Animación de recarga: la siguiente burbuja sube y se coloca en el cañón
    const rad = State.bubbleRadius;
    const nx = State.cannonX - rad * 2.1;
    const ny = State.cannonY;

    State.reloadingAmmo = {
      x: nx,
      y: ny,
      scale: 0.85,
      color: State.nextAmmo.color,
      special: State.nextAmmo.special
    };

    window.ArcadeTween?.to(State.reloadingAmmo, CONFIG.ANIM.RELOAD_DURATION, {
      x: State.cannonX,
      y: State.cannonY,
      scale: 1.0
    }, {
      easing: 'easeOutBack',
      onComplete: () => {
        State.currentAmmo = {
          color: State.reloadingAmmo.color,
          special: State.reloadingAmmo.special
        };
        State.reloadingAmmo = null;
      }
    });

    // Generar nueva munición siguiente y hacerla emerger en el pedestal con escala
    const active = LanzaburbujasLogic.getActiveColors(State.grid);
    const pool = active.length > 0 ? active : [1, 2, 3];
    State.nextAmmo = {
      color: pool[Math.floor(Math.random() * pool.length)],
      special: CONFIG.SPECIALS.NONE
    };
    State.nextAmmoScale = 0;
    window.ArcadeTween?.to(State, CONFIG.ANIM.RELOAD_DURATION, { nextAmmoScale: 1.0 }, {
      delay: 0.08,
      easing: 'easeOutBack'
    });

    renderNextAmmoPreview();
    State.state = 'SHOOTING';
  }

  function updateProjectile(dt) {
    const p = State.projectile;
    if (!p) return;

    const w = State.boardW;
    const r = State.bubbleRadius;

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Emisión de estela iridiscente
    spawnProjectileTrail(p.x, p.y, p.color);

    // Rebote pared izquierda
    if (p.x <= r) {
      p.x = r;
      p.vx = -p.vx;
      p.bounced = true;
      spawnWaterSplash(p.x, p.y, p.color, 4);
      playAudio('bounce');
    }
    // Rebote pared derecha
    else if (p.x >= w - r) {
      p.x = w - r;
      p.vx = -p.vx;
      p.bounced = true;
      spawnWaterSplash(p.x, p.y, p.color, 4);
      playAudio('bounce');
    }

    // Colisión con techo
    if (p.y <= r) {
      p.y = r;
      settleProjectile(p);
      return;
    }

    // Colisión con burbujas de la cuadrícula
    for (let row = 0; row < CONFIG.MAX_ROWS; row++) {
      const maxCols = (row % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
      for (let col = 0; col < maxCols; col++) {
        if (State.grid[row]?.[col] && State.grid[row][col].color !== 0) {
          const center = LanzaburbujasLogic.getCellCenter(row, col, r);
          const distSq = (p.x - center.x) ** 2 + (p.y - center.y) ** 2;
          if (distSq <= (r * 1.85) ** 2) {
            settleProjectile(p);
            return;
          }
        }
      }
    }
  }

  function settleProjectile(p) {
    const r = State.bubbleRadius;
    const target = LanzaburbujasLogic.findNearestEmptyCell(p.x, p.y, r, State.grid);

    if (!target) {
      State.projectile = null;
      State.state = 'AIMING';
      return;
    }

    // Actualización lógica
    State.grid[target.r][target.c] = { color: p.color, special: p.special };
    const shotBounced = p.bounced;
    State.projectile = null;

    // Actualización y animación visual
    const center = LanzaburbujasLogic.getCellCenter(target.r, target.c, r);
    const vb = State.visualGrid[target.r]?.[target.c];
    if (vb) {
      vb.color = p.color;
      vb.special = p.special;
      vb.x = center.x;
      vb.y = center.y;
      vb.targetX = center.x;
      vb.targetY = center.y;
      vb.scale = 0.65;
      vb.alpha = 1;
      vb.rotation = 0;
      vb.offsetX = 0;
      vb.offsetY = 0;

      // Rebote elástico al anclarse
      window.ArcadeTween?.to(vb, CONFIG.ANIM.SHOT_BOUNCE, { scale: 1.0 }, {
        easing: 'easeOutBack'
      });
    }

    // Onda que afecta ligeramente a las vecinas
    const neighbors = LanzaburbujasLogic.getHexNeighbors(target.r, target.c);
    neighbors.forEach(n => {
      const nv = State.visualGrid[n.r]?.[n.c];
      if (nv && nv.color > 0) {
        const nCenter = LanzaburbujasLogic.getCellCenter(n.r, n.c, r);
        const angle = Math.atan2(nCenter.y - center.y, nCenter.x - center.x);
        nv.offsetX = Math.cos(angle) * 5;
        nv.offsetY = Math.sin(angle) * 5;
        window.ArcadeTween?.to(nv, CONFIG.ANIM.RIPPLE_DURATION, { offsetX: 0, offsetY: 0 }, {
          easing: 'easeOutQuad'
        });
      }
    });

    handleImpactActions(target.r, target.c, p, shotBounced);
  }

  function handleImpactActions(r, c, p, shotBounced) {
    State.state = 'POPPING';

    // 1. Caso especial: BOMBA
    if (p.special === CONFIG.SPECIALS.BOMB) {
      playAudio('bomb_blast');
      if (State.options.vibration) window.ArcadeCanvas?.haptic(40);
      window.ArcadeJuice?.shake(18, 0.25);

      const toPop = [{ r, c }];
      const neighbors = LanzaburbujasLogic.getHexNeighbors(r, c);
      neighbors.forEach(n => {
        toPop.push(n);
        const secondTier = LanzaburbujasLogic.getHexNeighbors(n.r, n.c);
        secondTier.forEach(st => toPop.push(st));
      });

      popBubbles(toPop, true, r, c);
      return;
    }

    // 2. Coincidencia normal o arcoíris
    const cluster = LanzaburbujasLogic.findConnectedCluster(State.grid, r, c);

    if (cluster.length >= 3) {
      State.comboStreak++;
      if (State.comboStreak >= 5) unlockAchievement('COMBO_STREAK');
      if (shotBounced) unlockAchievement('BANK_SHOT');
      unlockAchievement('FIRST_POP');

      playAudio('pop', State.comboStreak);
      if (State.options.vibration) window.ArcadeCanvas?.haptic(18);
      window.ArcadeJuice?.shake(6, 0.15);

      // Si hay jefe activo, cada burbuja reventada le inflige daño
      if (State.bossHp > 0) {
        damageBoss(Math.ceil(cluster.length / 2));
      }

      popBubbles(cluster, false, r, c);
    } else {
      State.comboStreak = 0;
      State.missedShots++;
      updateHUD();

      // Aviso de ataque del jefe
      if (State.bossHp > 0 && State.missedShots >= State.ceilingDropInterval - 1) {
        dom.bossAttackWarn.classList.remove('hidden');
      }

      if (State.missedShots >= State.ceilingDropInterval) {
        lowerCeiling();
      } else {
        finishTurn();
      }
    }
  }

  function damageBoss(dmg) {
    State.bossHp = Math.max(0, State.bossHp - dmg);
    dom.bossHpText.textContent = `PV: ${State.bossHp}/${State.bossMaxHp}`;
    dom.bossHpFill.style.width = `${(State.bossHp / State.bossMaxHp) * 100}%`;

    window.ArcadeJuice?.spawnFloat(`¡-${dmg} PV!`, State.boardW / 2, 70, '#ff2e63', 14);

    if (State.bossHp <= 0) {
      if (State.currentLevelIdx === 14) unlockAchievement('KRAKEN_SLAYER');
      playAudio('victory');
      setTimeout(() => endGame(true, '¡Has derrotado al Jefe del Mundo!'), 400);
    }
  }

  function popBubbles(cells, isExplosion = false, impactR = -1, impactC = -1) {
    let poppedCount = 0;
    const rad = State.bubbleRadius;

    const refR = impactR >= 0 ? impactR : cells[0].r;
    const refC = impactC >= 0 ? impactC : cells[0].c;

    let maxDelaySec = 0;

    cells.forEach(cell => {
      const bubble = State.grid[cell.r]?.[cell.c];
      const vb = State.visualGrid[cell.r]?.[cell.c];
      if (bubble && bubble.color !== 0) {
        poppedCount++;
        const dist = LanzaburbujasLogic.hexDistance(refR, refC, cell.r, cell.c);
        const delaySec = (dist * CONFIG.ANIM.POP_STAGGER_MS) * 0.001;
        if (delaySec > maxDelaySec) maxDelaySec = delaySec;

        const center = LanzaburbujasLogic.getCellCenter(cell.r, cell.c, rad);
        const bubbleColor = bubble.color;
        const bubbleSpecial = bubble.special;

        // Limpieza lógica inmediata
        State.grid[cell.r][cell.c] = { color: 0, special: CONFIG.SPECIALS.NONE };

        // Animación visual diferida en ola (destello, encogimiento con giro y salpicadura)
        if (vb) {
          window.ArcadeTween?.to(vb, CONFIG.ANIM.POP_DURATION, {
            scale: 0,
            alpha: 0,
            rotation: (Math.random() > 0.5 ? 1 : -1) * 2.2
          }, {
            delay: delaySec,
            easing: 'easeInBack',
            onComplete: () => {
              spawnWaterSplash(center.x, center.y, bubbleColor);
              vb.color = 0;
              vb.scale = 1;
              vb.alpha = 1;
              vb.rotation = 0;

              if (bubbleSpecial === CONFIG.SPECIALS.LIGHTNING) {
                playAudio('laser');
                triggerLightningRow(cell.r);
              }
            }
          });
        }
      }
    });

    const pts = poppedCount * 50 * (State.isDaily ? 1.5 : 1);
    State.score += Math.round(pts);
    updateHUD();

    if (State.comboStreak > 1) {
      window.ArcadeJuice?.spawnFloat(`COMBO x${State.comboStreak}!`, State.boardW / 2, State.boardH / 2 - 20, '#ffcc00', 16, -50);
    }
    window.ArcadeJuice?.spawnFloat(`+${pts}`, State.boardW / 2, State.boardH / 2 + 10, '#00e5ff', 14, -35);

    const waitTotalMs = Math.round((maxDelaySec + CONFIG.ANIM.POP_DURATION) * 1000) + 40;
    setTimeout(() => {
      dropFloatingBubbles();
    }, waitTotalMs);
  }

  function triggerLightningRow(row) {
    const maxCols = (row % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
    for (let c = 0; c < maxCols; c++) {
      if (State.grid[row]?.[c] && State.grid[row][c].color !== 0) {
        const center = LanzaburbujasLogic.getCellCenter(row, c, State.bubbleRadius);
        spawnWaterSplash(center.x, center.y, State.grid[row][c].color);
        State.grid[row][c] = { color: 0, special: CONFIG.SPECIALS.NONE };
        if (State.visualGrid[row]?.[c]) {
          State.visualGrid[row][c].color = 0;
        }
      }
    }
  }

  function dropFloatingBubbles() {
    const floating = LanzaburbujasLogic.findFloatingBubbles(State.grid);

    if (floating.length > 0) {
      if (floating.length >= 5) unlockAchievement('BUBBLE_RAIN');
      playAudio('drop');
      const rad = State.bubbleRadius;

      floating.forEach(cell => {
        const bubble = State.grid[cell.r][cell.c];
        const vb = State.visualGrid[cell.r]?.[cell.c];
        const color = bubble.color || (vb ? vb.color : 1);
        const special = bubble.special;
        const center = LanzaburbujasLogic.getCellCenter(cell.r, cell.c, rad);

        State.fallingBubbles.push({
          x: center.x,
          y: center.y,
          vx: (center.x - State.boardW / 2) * 0.4 + (Math.random() - 0.5) * 80,
          vy: Math.random() * -60 - 30,
          color,
          special,
          scale: 1,
          alpha: 1,
          rotation: 0,
          rotSpeed: (Math.random() - 0.5) * 4,
          bounceCount: 1
        });

        // Limpieza lógica y visual de la celda
        State.grid[cell.r][cell.c] = { color: 0, special: CONFIG.SPECIALS.NONE };
        if (vb) {
          vb.color = 0;
        }
      });

      const dropBonus = floating.length * 100 * (State.isDaily ? 1.5 : 1);
      State.score += Math.round(dropBonus);
      window.ArcadeJuice?.spawnFloat(`¡Lluvia +${dropBonus}!`, State.boardW / 2, State.boardH / 2 + 30, '#ffea00', 14, -45);
      updateHUD();
    }

    finishTurn();
  }

  function lowerCeiling() {
    State.missedShots = 0;
    dom.bossAttackWarn.classList.add('hidden');
    playAudio('game_over');
    if (State.options.vibration) window.ArcadeCanvas?.haptic(35);
    window.ArcadeJuice?.shake(8, 0.22);

    const rowHeight = State.bubbleRadius * Math.sqrt(3);

    // Animación de descenso suave del techo
    State.ceilingAnimOffset = -rowHeight;
    window.ArcadeTween?.to(State, CONFIG.ANIM.CEILING_DROP_DURATION, { ceilingAnimOffset: 0 }, {
      easing: 'easeInOutQuad'
    });

    // Desplazar filas hacia abajo lógicamente
    for (let r = CONFIG.MAX_ROWS - 1; r > 0; r--) {
      const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
      const prevCols = ((r - 1) % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
      for (let c = 0; c < maxCols; c++) {
        if (c < prevCols) {
          State.grid[r][c] = { ...State.grid[r - 1][c] };
        } else {
          State.grid[r][c] = { color: 0, special: CONFIG.SPECIALS.NONE };
        }
      }
    }

    // Desplazar filas visualmente
    for (let r = CONFIG.MAX_ROWS - 1; r > 0; r--) {
      const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
      const prevCols = ((r - 1) % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
      for (let c = 0; c < maxCols; c++) {
        if (c < prevCols) {
          State.visualGrid[r][c].color = State.visualGrid[r - 1][c].color;
          State.visualGrid[r][c].special = State.visualGrid[r - 1][c].special;
          State.visualGrid[r][c].scale = State.visualGrid[r - 1][c].scale;
          State.visualGrid[r][c].alpha = State.visualGrid[r - 1][c].alpha;
        } else {
          State.visualGrid[r][c].color = 0;
          State.visualGrid[r][c].special = 0;
        }
      }
    }

    // Nueva fila en techo
    const active = LanzaburbujasLogic.getActiveColors(State.grid);
    const pool = active.length > 0 ? active : [1, 2, 3, 4];
    for (let c = 0; c < CONFIG.COLS_EVEN; c++) {
      const colr = pool[Math.floor(Math.random() * pool.length)];
      State.grid[0][c] = {
        color: colr,
        special: CONFIG.SPECIALS.NONE
      };
      State.visualGrid[0][c].color = colr;
      State.visualGrid[0][c].special = CONFIG.SPECIALS.NONE;
      State.visualGrid[0][c].scale = 1;
      State.visualGrid[0][c].alpha = 1;
    }

    // Si hay burbujas shifter (94), mutan su color
    for (let r = 0; r < CONFIG.MAX_ROWS; r++) {
      const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
      for (let c = 0; c < maxCols; c++) {
        if (State.grid[r]?.[c] && State.grid[r][c].special === CONFIG.SPECIALS.SHIFTER) {
          State.grid[r][c].color = (State.grid[r][c].color % 6) + 1;
          if (State.visualGrid[r]?.[c]) {
            State.visualGrid[r][c].color = State.grid[r][c].color;
          }
        }
      }
    }

    updateHUD();
    finishTurn();
  }

  function finishTurn() {
    // 1. Verificar victoria (tablero limpio)
    const activeColors = LanzaburbujasLogic.getActiveColors(State.grid);
    if (activeColors.length === 0 && State.bossHp <= 0) {
      endGame(true, '¡Has limpiado todas las burbujas marinas!');
      return;
    }

    // 2. Verificar derrota (burbujas sobrepasaron la línea de peligro)
    for (let r = CONFIG.DEADLINE_ROW; r < CONFIG.MAX_ROWS; r++) {
      const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
      for (let c = 0; c < maxCols; c++) {
        if (State.grid[r]?.[c] && State.grid[r][c].color !== 0) {
          endGame(false, '¡Las burbujas sobrepasaron la línea de peligro!');
          return;
        }
      }
    }

    State.state = 'AIMING';
    updateHUD();
  }

  function endGame(isVictory, message) {
    State.state = isVictory ? 'VICTORY' : 'GAMEOVER';
    stopBGM();

    let starsEarned = 0;
    if (isVictory) {
      playAudio('victory');
      const lvl = CONFIG.LEVELS[State.currentLevelIdx];
      const par = lvl.parShots || 15;

      if (State.shotsFiredInLevel <= par) starsEarned = 3;
      else if (State.shotsFiredInLevel <= Math.round(par * 1.35)) starsEarned = 2;
      else starsEarned = 1;

      if (starsEarned === 3) unlockAchievement('SNIPER');
      if (State.currentLevelIdx >= 59) unlockAchievement('ABYSS_CONQUEROR');

      saveLevelRecord(State.currentLevelIdx, State.score, starsEarned);
      setUnlockedLevel(State.currentLevelIdx + 1);
    } else {
      playAudio('game_over');
    }

    dom.resultIcon.textContent = isVictory ? '🫧' : '💥';
    dom.resultTitle.textContent = isVictory ? '¡NIVEL SUPERADO!' : 'FIN DE PARTIDA';
    dom.resultSubtitle.textContent = message;
    dom.resultScoreVal.textContent = State.score.toLocaleString();

    const best = getLevelRecord(State.currentLevelIdx);
    dom.resultBestVal.textContent = best.score.toLocaleString();

    dom.starsRow.innerHTML = '';
    for (let s = 1; s <= 3; s++) {
      const starSpan = document.createElement('span');
      starSpan.className = s <= starsEarned ? 'star-slot filled' : 'star-slot empty';
      starSpan.textContent = '★';
      dom.starsRow.appendChild(starSpan);
    }

    if (isVictory && State.currentLevelIdx < CONFIG.LEVELS.length - 1) {
      dom.btnNextLevel.classList.remove('hidden');
    } else {
      dom.btnNextLevel.classList.add('hidden');
    }

    dom.overlayResult.classList.remove('hidden');
  }

  // ==========================================
  // PERSISTENCIA Y LOGROS
  // ==========================================
  function loadStorage() {
    try {
      const achRaw = localStorage.getItem(`${CONFIG.STORAGE_KEY_PREFIX}:achievements`);
      if (achRaw) State.achievements = JSON.parse(achRaw);

      const optRaw = localStorage.getItem(`${CONFIG.STORAGE_KEY_PREFIX}:options`);
      if (optRaw) {
        State.options = { ...State.options, ...JSON.parse(optRaw) };
        applyOptions();
      }

      const boostRaw = localStorage.getItem(`${CONFIG.STORAGE_KEY_PREFIX}:boosters`);
      if (boostRaw) State.boosters = JSON.parse(boostRaw);
      updateBoosterButtons();
    } catch (e) {}
  }

  function saveStorage() {
    try {
      localStorage.setItem(`${CONFIG.STORAGE_KEY_PREFIX}:achievements`, JSON.stringify(State.achievements));
      localStorage.setItem(`${CONFIG.STORAGE_KEY_PREFIX}:options`, JSON.stringify(State.options));
      localStorage.setItem(`${CONFIG.STORAGE_KEY_PREFIX}:boosters`, JSON.stringify(State.boosters));
    } catch (e) {}
  }

  function unlockAchievement(id) {
    if (State.achievements[id]) return;
    State.achievements[id] = true;
    saveStorage();
    playAudio('booster');

    const ach = CONFIG.ACHIEVEMENTS.find(a => a.id === id);
    if (ach) {
      spawnFloatingText(State.boardW / 2, 80, `🏆 ¡LOGRO: ${ach.title}!`, '#ffcc00');
    }
  }

  function getLevelRecord(idx) {
    try {
      const key = `${CONFIG.STORAGE_KEY_PREFIX}:lvl_${idx}`;
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { score: 0, stars: 0 };
  }

  function saveLevelRecord(idx, score, stars) {
    try {
      const prev = getLevelRecord(idx);
      const newRec = {
        score: Math.max(score, prev.score),
        stars: Math.max(stars, prev.stars)
      };
      localStorage.setItem(`${CONFIG.STORAGE_KEY_PREFIX}:lvl_${idx}`, JSON.stringify(newRec));
    } catch (e) {}
  }

  function getUnlockedLevel() {
    try {
      const raw = localStorage.getItem(`${CONFIG.STORAGE_KEY_PREFIX}:unlocked`);
      return raw ? parseInt(raw, 10) : 0;
    } catch (e) {
      return 0;
    }
  }

  function setUnlockedLevel(lvlIdx) {
    try {
      const current = getUnlockedLevel();
      if (lvlIdx > current) {
        localStorage.setItem(`${CONFIG.STORAGE_KEY_PREFIX}:unlocked`, lvlIdx.toString());
      }
    } catch (e) {}
  }

  function applyOptions() {
    dom.optSfx.checked = State.options.sfx;
    dom.optBgm.checked = State.options.bgm;
    dom.optVibration.checked = State.options.vibration;
    dom.optContrast.checked = State.options.contrast;

    if (State.options.contrast) document.body.classList.add('high-contrast');
    else document.body.classList.remove('high-contrast');

    if (!State.options.bgm) stopBGM();
    else if (State.state === 'AIMING') startBGM();
  }

  // ==========================================
  // SPRITES PRE-RENDERIZADOS Y FONDOS EN OFFSCREEN CANVAS
  // ==========================================
  const bubbleSprites = {};
  let bgCacheCanvas = null;
  let bgCacheCtx = null;

  function buildBubbleSprites(rad) {
    if (typeof document === 'undefined') return;
    const diameter = Math.ceil(rad * 2 + 10);
    const center = diameter / 2;

    // Colores regulares 1..6
    for (const col of CONFIG.COLORS) {
      const cvs = document.createElement('canvas');
      cvs.width = diameter;
      cvs.height = diameter;
      const cctx = cvs.getContext('2d');
      renderBubble3DVector(cctx, center, center, rad, col.id, CONFIG.SPECIALS.NONE);
      bubbleSprites[`col_${col.id}`] = cvs;
    }

    // Piezas especiales
    const specials = [
      CONFIG.SPECIALS.BOMB,
      CONFIG.SPECIALS.RAINBOW,
      CONFIG.SPECIALS.ROCK,
      CONFIG.SPECIALS.LIGHTNING,
      CONFIG.SPECIALS.SHIFTER
    ];
    for (const spec of specials) {
      const cvs = document.createElement('canvas');
      cvs.width = diameter;
      cvs.height = diameter;
      const cctx = cvs.getContext('2d');
      renderBubble3DVector(cctx, center, center, rad, 1, spec);
      bubbleSprites[`spec_${spec}`] = cvs;
    }
  }

  function drawBubbleSprite(ctx, cx, cy, r, colorId, special = CONFIG.SPECIALS.NONE, scale = 1, alpha = 1, rotation = 0) {
    if (alpha <= 0.01 || scale <= 0.01) return;
    const key = (special && special !== CONFIG.SPECIALS.NONE) ? `spec_${special}` : `col_${colorId || 1}`;
    const sprite = bubbleSprites[key];

    if (!sprite) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, Math.max(0, alpha));
      renderBubble3DVector(ctx, cx, cy, r * scale, colorId, special);
      ctx.restore();
      return;
    }

    const drawSize = sprite.width * scale;
    ctx.save();
    ctx.globalAlpha = Math.min(1, Math.max(0, alpha));
    ctx.translate(cx, cy);
    if (rotation !== 0) ctx.rotate(rotation);
    ctx.drawImage(sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
    ctx.restore();
  }

  function updateBackgroundCache(w, h, world) {
    if (typeof document === 'undefined') return;
    if (!bgCacheCanvas) {
      bgCacheCanvas = document.createElement('canvas');
    }
    bgCacheCanvas.width = Math.max(1, Math.round(w));
    bgCacheCanvas.height = Math.max(1, Math.round(h));
    bgCacheCtx = bgCacheCanvas.getContext('2d');

    const grad = bgCacheCtx.createLinearGradient(0, 0, 0, h);
    if (world === 1) {
      grad.addColorStop(0, '#021828');
      grad.addColorStop(0.5, '#042838');
      grad.addColorStop(1, '#02121e');
    } else if (world === 2) {
      grad.addColorStop(0, '#150528');
      grad.addColorStop(0.5, '#1e0a3d');
      grad.addColorStop(1, '#080114');
    } else if (world === 3) {
      grad.addColorStop(0, '#010915');
      grad.addColorStop(0.5, '#021226');
      grad.addColorStop(1, '#00040a');
    } else {
      grad.addColorStop(0, '#1a0505');
      grad.addColorStop(0.5, '#260a0a');
      grad.addColorStop(1, '#0d0202');
    }
    bgCacheCtx.fillStyle = grad;
    bgCacheCtx.fillRect(0, 0, w, h);
  }

  // ==========================================
  // RENDERIZADO VECTORIAL BASE (Para el Offscreen Canvas)
  // ==========================================
  function renderBubble3DVector(ctx, cx, cy, r, colorId, special = CONFIG.SPECIALS.NONE) {
    ctx.save();

    // Sombra suave
    ctx.beginPath();
    ctx.arc(cx + r * 0.1, cy + r * 0.12, r * 0.9, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fill();

    // Especiales
    if (special === CONFIG.SPECIALS.ROCK) {
      renderRockBubble(ctx, cx, cy, r);
      ctx.restore();
      return;
    }
    if (special === CONFIG.SPECIALS.BOMB) {
      renderBombBubble(ctx, cx, cy, r);
      ctx.restore();
      return;
    }
    if (special === CONFIG.SPECIALS.LIGHTNING) {
      renderLightningBubble(ctx, cx, cy, r);
      ctx.restore();
      return;
    }

    const isRainbow = (special === CONFIG.SPECIALS.RAINBOW || colorId === CONFIG.SPECIALS.RAINBOW);
    const colCfg = isRainbow
      ? { main: '#ffffff', dark: '#00e5ff', light: '#ffea00', glow: 'rgba(255, 234, 0, 0.8)' }
      : (CONFIG.COLORS.find(c => c.id === colorId) || CONFIG.COLORS[0]);

    // Película de jabón translúcida con relieve 3D iridiscente
    const sphereGrad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.05, cx, cy, r);
    sphereGrad.addColorStop(0, '#ffffff');
    sphereGrad.addColorStop(0.25, colCfg.light);
    sphereGrad.addColorStop(0.7, colCfg.main);
    sphereGrad.addColorStop(0.95, colCfg.dark);
    sphereGrad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = sphereGrad;
    ctx.fill();

    // Anillo exterior de jabón
    ctx.strokeStyle = colCfg.light;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Reflejo especular blanco curvado superior
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.28, cy - r * 0.32, r * 0.32, r * 0.18, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Reflejo secundario inferior
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.25, cy + r * 0.3, r * 0.2, r * 0.1, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function renderRockBubble(ctx, cx, cy, r) {
    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    grad.addColorStop(0, '#e0e0e0');
    grad.addColorStop(0.5, '#757575');
    grad.addColorStop(1, '#212121');

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#424242';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.4, cy - r * 0.2);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + r * 0.3, cy - r * 0.3);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - r * 0.1, cy + r * 0.5);
    ctx.stroke();
  }

  function renderBombBubble(ctx, cx, cy, r) {
    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    grad.addColorStop(0, '#ff334b');
    grad.addColorStop(0.4, '#380208');
    grad.addColorStop(1, '#0d0103');

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#ff334b';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffea00';
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.6, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function renderLightningBubble(ctx, cx, cy, r) {
    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#00e5ff');
    grad.addColorStop(1, '#004488');

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.3, cy - r * 0.4);
    ctx.lineTo(cx + r * 0.1, cy);
    ctx.lineTo(cx - r * 0.1, cy + r * 0.1);
    ctx.lineTo(cx + r * 0.3, cy + r * 0.5);
    ctx.stroke();
  }

  // ==========================================
  // POOLING DE PARTÍCULAS (LÍMITE ESTRICTO DE 150)
  // ==========================================
  const MAX_PARTICLES = 150;
  const particlePool = [];
  for (let i = 0; i < MAX_PARTICLES; i++) {
    particlePool.push({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      r: 2,
      color: '#00e5ff',
      life: 0,
      decay: 2.0,
      type: 'splash'
    });
  }

  function spawnWaterSplash(x, y, colorId, count = 12) {
    const colCfg = CONFIG.COLORS.find(c => c.id === colorId) || { main: '#00e5ff' };
    const actualCount = State.lowQualityMode ? Math.floor(count * 0.5) : count;

    for (let i = 0; i < actualCount; i++) {
      let p = null;
      for (let k = 0; k < MAX_PARTICLES; k++) {
        if (!particlePool[k].active) {
          p = particlePool[k];
          break;
        }
      }
      if (!p) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 140 + 40;
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 35;
      p.r = Math.random() * 2.8 + 1.2;
      p.color = colCfg.main;
      p.life = 1.0;
      p.decay = Math.random() * 2.2 + 2.0;
      p.type = 'splash';
    }
  }

  function spawnProjectileTrail(x, y, colorId) {
    if (State.lowQualityMode && Math.random() > 0.4) return;
    const colCfg = CONFIG.COLORS.find(c => c.id === colorId) || { main: '#00e5ff' };

    for (let k = 0; k < MAX_PARTICLES; k++) {
      if (!particlePool[k].active) {
        const p = particlePool[k];
        p.active = true;
        p.x = x + (Math.random() - 0.5) * 6;
        p.y = y + (Math.random() - 0.5) * 6;
        p.vx = (Math.random() - 0.5) * 20;
        p.vy = (Math.random() - 0.5) * 20;
        p.r = Math.random() * 2.6 + 1.2;
        p.color = colCfg.light || '#fff';
        p.life = 0.45;
        p.decay = 2.4;
        p.type = 'trail';
        break;
      }
    }
  }

  function updateParticles(dt) {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = particlePool[i];
      if (!p.active) continue;

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.type === 'splash') {
        p.vy += 260 * dt;
      }
      p.life -= p.decay * dt;
      if (p.life <= 0) {
        p.active = false;
      }
    }
  }

  function renderParticles(ctx) {
    ctx.save();
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = particlePool[i];
      if (!p.active) continue;

      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ==========================================
  // TEXTOS FLOTANTES Y BURBUJAS QUE CAEN
  // ==========================================
  function spawnFloatingText(x, y, text, color = '#fff') {
    State.floatingTexts.push({ x, y, text, color, life: 1.0 });
  }

  function renderFloatingTexts(ctx) {
    for (let i = State.floatingTexts.length - 1; i >= 0; i--) {
      const ft = State.floatingTexts[i];
      ft.y -= 35 * 0.016;
      ft.life -= 1.4 * 0.016;

      if (ft.life <= 0) {
        State.floatingTexts.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 15px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  function updateFallingBubbles(dt) {
    const floorY = State.boardH - State.bubbleRadius * 1.5;

    for (let i = State.fallingBubbles.length - 1; i >= 0; i--) {
      const fb = State.fallingBubbles[i];
      fb.vy += 850 * dt;
      fb.x += fb.vx * dt;
      fb.y += fb.vy * dt;
      fb.rotation += (fb.rotSpeed || 1) * dt;

      if (fb.y >= floorY && fb.bounceCount > 0) {
        fb.y = floorY;
        fb.vy = -Math.abs(fb.vy) * 0.45;
        fb.vx *= 0.8;
        fb.bounceCount--;
        spawnWaterSplash(fb.x, fb.y, fb.color, 4);
        playAudio('bounce');
      }

      if (fb.y > State.boardH + 30) {
        window.ArcadeJuice?.spawnFloat('+100', fb.x, floorY - 10, '#ffea00', 13, -30);
        spawnWaterSplash(fb.x, floorY, fb.color, 6);
        State.fallingBubbles.splice(i, 1);
      }
    }
  }

  // ==========================================
  // RENDERIZADO PRINCIPAL
  // ==========================================
  function render(time) {
    const ctx = State.ctx;
    if (!ctx) return;

    const w = State.boardW;
    const h = State.boardH;
    ctx.clearRect(0, 0, w, h);

    State.animTime = time * 0.001;

    // 1. Fondo cacheado según mundo
    renderAtmosphereBackground(ctx, w, h);

    const rad = State.bubbleRadius;

    // 2. Línea límite de peligro
    const deadY = CONFIG.DEADLINE_ROW * (rad * Math.sqrt(3)) + rad * 2;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 60, 90, 0.45)';
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, deadY);
    ctx.lineTo(w, deadY);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 60, 90, 0.7)';
    ctx.font = 'bold 10px -apple-system, sans-serif';
    ctx.fillText('LÍNEA DE PELIGRO', 8, deadY - 5);
    ctx.restore();

    // 3. Guía de puntería con rebote matemático
    if (State.state === 'AIMING' && State.isDragging) {
      renderAimGuide(ctx, w, rad);
    }

    // 4. Rejilla hexagonal usando visualGrid desacoplada
    for (let r = 0; r < CONFIG.MAX_ROWS; r++) {
      const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
      for (let c = 0; c < maxCols; c++) {
        const vb = State.visualGrid[r]?.[c];
        if (vb && vb.color > 0 && vb.scale > 0.01 && vb.alpha > 0.01) {
          const drawX = vb.x + (vb.offsetX || 0);
          const drawY = vb.y + (vb.offsetY || 0) + State.ceilingAnimOffset;
          drawBubbleSprite(ctx, drawX, drawY, rad * 0.95, vb.color, vb.special, vb.scale, vb.alpha, vb.rotation);
        }
      }
    }

    // 5. Proyectil en vuelo
    if (State.projectile) {
      const p = State.projectile;
      drawBubbleSprite(ctx, p.x, p.y, rad * 0.95, p.color, p.special, 1.0, 1.0);
    }

    // 6. Burbujas flotantes que caen con física y rebote
    for (const fb of State.fallingBubbles) {
      drawBubbleSprite(ctx, fb.x, fb.y, rad * 0.95, fb.color, fb.special, fb.scale || 1, fb.alpha || 1, fb.rotation || 0);
    }

    // 7. Lanzador Hydro-Nautilo, pedestal de siguiente burbuja e intercambios
    renderHydroLauncher(ctx, w, rad);

    // 8. Partículas y textos flotantes
    renderParticles(ctx);
    renderFloatingTexts(ctx);

    // 9. Overlay de diagnóstico si está en modo ?debug=1
    renderDebugOverlay(ctx);
  }

  function renderAtmosphereBackground(ctx, w, h) {
    ctx.save();
    if (bgCacheCanvas) {
      ctx.drawImage(bgCacheCanvas, 0, 0);
    }

    const t = State.animTime;

    // Rayos de luz submarinos sutiles
    if (State.currentWorld === 1) {
      ctx.fillStyle = 'rgba(0, 229, 255, 0.04)';
      ctx.beginPath();
      ctx.moveTo(w * 0.3 + Math.sin(t * 0.8) * 40, 0);
      ctx.lineTo(w * 0.5 + Math.sin(t * 0.8) * 60, h);
      ctx.lineTo(w * 0.2 + Math.sin(t * 0.8) * 30, h);
      ctx.closePath();
      ctx.fill();
    }

    // Burbujas ambientales que ascienden
    if (State.ambientBubbles.length < 20) {
      State.ambientBubbles.push({
        x: Math.random() * w,
        y: h + 10,
        r: Math.random() * 2.8 + 1.2,
        speed: Math.random() * 25 + 20,
        drift: Math.random() * 2
      });
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = State.ambientBubbles.length - 1; i >= 0; i--) {
      const b = State.ambientBubbles[i];
      b.y -= b.speed * 0.016;
      b.x += Math.sin(t * 2 + b.drift) * 0.3;

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();

      if (b.y < -10) State.ambientBubbles.splice(i, 1);
    }

    ctx.restore();
  }

  function renderAimGuide(ctx, boardWidth, rad) {
    const trajectory = LanzaburbujasLogic.raycastTrajectory(
      State.cannonX,
      State.cannonY,
      State.aimAngle,
      rad,
      boardWidth,
      State.grid
    );

    ctx.save();
    ctx.strokeStyle = State.activeBooster === 'aim' ? '#ffcc00' : 'rgba(0, 229, 255, 0.7)';
    ctx.lineWidth = State.activeBooster === 'aim' ? 3.5 : 2;
    ctx.setLineDash([6, 6]);

    ctx.beginPath();
    ctx.moveTo(trajectory.path[0].x, trajectory.path[0].y);
    for (let i = 1; i < trajectory.path.length; i++) {
      ctx.lineTo(trajectory.path[i].x, trajectory.path[i].y);
    }
    ctx.stroke();

    if (trajectory.targetCell) {
      const center = LanzaburbujasLogic.getCellCenter(trajectory.targetCell.r, trajectory.targetCell.c, rad);
      ctx.strokeStyle = State.activeBooster === 'aim' ? '#ffea00' : 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(center.x, center.y, rad * 0.9, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function renderHydroLauncher(ctx, w, rad) {
    const cx = State.cannonX;
    const cy = State.cannonY;
    const nextX = State.cannonX - rad * 1.7;
    const nextY = State.cannonY;

    // 1. Pedestal de latón Nautilus para la siguiente burbuja
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(nextX, nextY + rad * 0.75, rad * 0.85, rad * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();

    const pedGrad = ctx.createRadialGradient(nextX - 3, nextY - 3, 2, nextX, nextY, rad * 1.05);
    pedGrad.addColorStop(0, '#ffffff');
    pedGrad.addColorStop(0.3, '#29b6f6');
    pedGrad.addColorStop(0.8, '#0d47a1');
    pedGrad.addColorStop(1, '#051937');
    ctx.beginPath();
    ctx.arc(nextX, nextY, rad * 1.02, 0, Math.PI * 2);
    ctx.fillStyle = pedGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 8px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SIG', nextX, nextY + rad * 1.45);
    ctx.restore();

    // 2. Siguiente burbuja descansando sobre el pedestal
    if (!State.swapAnim && State.nextAmmo && State.nextAmmo.color > 0) {
      const scale = (State.nextAmmoScale !== undefined ? State.nextAmmoScale : 1) * 0.85;
      drawBubbleSprite(ctx, nextX, nextY, rad, State.nextAmmo.color, State.nextAmmo.special, scale, 1);
    }

    // 3. Burbuja de recarga animada que sube desde el pedestal al cañón
    if (State.reloadingAmmo) {
      drawBubbleSprite(ctx, State.reloadingAmmo.x, State.reloadingAmmo.y, rad, State.reloadingAmmo.color, State.reloadingAmmo.special, State.reloadingAmmo.scale, 1);
    }

    // 4. Intercambio animado en arco parabólico entre cañón y pedestal
    if (State.swapAnim) {
      const t = State.swapAnim.t;
      const arcH = Math.sin(t * Math.PI) * 22;

      // De cañón a pedestal (arco arriba)
      const b1x = cx + (nextX - cx) * t;
      const b1y = cy + (nextY - cy) * t - arcH;
      const b1scale = 1.0 - 0.15 * t;
      drawBubbleSprite(ctx, b1x, b1y, rad, State.swapAnim.cColor, State.swapAnim.cSpecial, b1scale, 1);

      // De pedestal a cañón (arco abajo)
      const b2x = nextX + (cx - nextX) * t;
      const b2y = nextY + (cy - nextY) * t + arcH * 0.6;
      const b2scale = 0.85 + 0.15 * t;
      drawBubbleSprite(ctx, b2x, b2y, rad, State.swapAnim.nColor, State.swapAnim.nSpecial, b2scale, 1);
    }

    // 5. Cañón con retroceso elástico
    ctx.save();
    const baseGrad = ctx.createRadialGradient(cx - 4, cy - 4, 3, cx, cy, rad * 1.5);
    baseGrad.addColorStop(0, '#ffffff');
    baseGrad.addColorStop(0.2, '#64b5f6');
    baseGrad.addColorStop(0.7, '#1565c0');
    baseGrad.addColorStop(1, '#0d274d');

    ctx.beginPath();
    ctx.arc(cx, cy, rad * 1.35, 0, Math.PI * 2);
    ctx.fillStyle = baseGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.translate(cx, cy);
    ctx.rotate(State.aimAngle + Math.PI / 2);
    ctx.translate(0, State.recoilOffset);

    ctx.fillStyle = 'rgba(0, 210, 255, 0.35)';
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-rad * 0.6, -rad * 1.6, rad * 1.2, rad * 1.25, 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 6. Burbuja actualmente cargada en la recámara
    if (!State.reloadingAmmo && !State.swapAnim && (State.state === 'AIMING' || State.state === 'POPPING')) {
      drawBubbleSprite(ctx, cx, cy + State.recoilOffset * 0.4, rad * 0.92, State.currentAmmo.color, State.currentAmmo.special, 1.0, 1.0);
    }
  }

  // ==========================================
  // DIAGNÓSTICO Y TUNER DE RENDIMIENTO (?debug=1)
  // ==========================================
  let frameCount = 0;
  let lastFpsUpdate = 0;
  const fpsHistory = [];

  function updatePerfTuner(dt, time) {
    frameCount++;
    if (time - lastFpsUpdate >= 300) {
      const currentFps = Math.round((frameCount * 1000) / (time - lastFpsUpdate));
      State.fps = currentFps;
      State.frameTimeMs = parseFloat((dt * 1000).toFixed(1));
      frameCount = 0;
      lastFpsUpdate = time;

      fpsHistory.push(currentFps);
      if (fpsHistory.length > 6) fpsHistory.shift();

      if (fpsHistory.length >= 4) {
        const avgFps = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;
        if (avgFps < 55 && !State.lowQualityMode) {
          State.lowQualityMode = true;
          if (State.isDebug) console.warn('[Lanzaburbujas] Auto-Tuner: Activando lowQualityMode (< 55 FPS)');
        } else if (avgFps >= 58 && State.lowQualityMode) {
          State.lowQualityMode = false;
          if (State.isDebug) console.info('[Lanzaburbujas] Auto-Tuner: Restaurando calidad alta (>= 58 FPS)');
        }
      }
    }
  }

  function renderDebugOverlay(ctx) {
    if (!State.isDebug) return;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(8, 8, 175, 100);
    ctx.strokeStyle = State.fps >= 55 ? '#00e676' : '#ff3d00';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, 175, 100);

    const activeTweens = window.ArcadeTween ? window.ArcadeTween.activeCount : 0;
    const activeParts = particlePool.filter(p => p.active).length;

    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText(`FPS: ${State.fps} (${State.frameTimeMs}ms)`, 14, 24);
    ctx.fillText(`Tweens activos: ${activeTweens}`, 14, 38);
    ctx.fillText(`Partículas: ${activeParts}/${MAX_PARTICLES}`, 14, 52);
    ctx.fillText(`Calidad: ${State.lowQualityMode ? 'BAJA (auto)' : 'ALTA (60fps)'}`, 14, 66);
    ctx.fillText(`Estado: ${State.state}`, 14, 80);
    ctx.fillText(`Score anim: ${State.displayedScore}/${State.score}`, 14, 94);
    ctx.restore();
  }

  // ==========================================
  // HUD, BOOSTERS Y CONTROLES
  // ==========================================
  function updateHUD() {
    dom.scoreVal.textContent = State.score.toLocaleString();
    const remainingShots = Math.max(0, State.ceilingDropInterval - State.missedShots);
    dom.ceilingShotsVal.textContent = remainingShots.toString();

    const lvl = CONFIG.LEVELS[State.currentLevelIdx] || CONFIG.LEVELS[0];
    dom.levelTitleDisplay.textContent = `M${lvl.world} • Nivel ${lvl.id}: ${lvl.name}`;
  }

  function updateBoosterButtons() {
    dom.countBoosterBomb.textContent = State.boosters.bomb.toString();
    dom.countBoosterRainbow.textContent = State.boosters.rainbow.toString();
    dom.countBoosterAim.textContent = State.boosters.aim.toString();

    dom.btnBoosterBomb.classList.toggle('active', State.activeBooster === 'bomb');
    dom.btnBoosterRainbow.classList.toggle('active', State.activeBooster === 'rainbow');
    dom.btnBoosterAim.classList.toggle('active', State.activeBooster === 'aim');
  }

  function setupInputs() {
    const canvas = dom.canvas;

    function getCanvasCoords(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }

    function handlePointerDown(e) {
      if (State.state !== 'AIMING') return;
      const coords = e.touches ? getCanvasCoords(e.touches[0].clientX, e.touches[0].clientY) : getCanvasCoords(e.clientX, e.clientY);
      State.isDragging = true;
      updateAim(coords.x, coords.y);
    }

    function handlePointerMove(e) {
      if (!State.isDragging || State.state !== 'AIMING') return;
      const coords = e.touches ? getCanvasCoords(e.touches[0].clientX, e.touches[0].clientY) : getCanvasCoords(e.clientX, e.clientY);
      updateAim(coords.x, coords.y);
    }

    function handlePointerUp() {
      if (State.isDragging && State.state === 'AIMING') {
        State.isDragging = false;
        shootProjectile();
      }
      State.isDragging = false;
    }

    function updateAim(px, py) {
      const dx = px - State.cannonX;
      const dy = py - State.cannonY;
      let angle = Math.atan2(dy, dx);

      // Limitar ángulo hacia arriba (no disparar hacia abajo)
      if (angle > -0.2) angle = -0.2;
      if (angle < -Math.PI + 0.2) angle = -Math.PI + 0.2;

      State.aimAngle = angle;
    }

    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handlePointerDown(e);
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      handlePointerMove(e);
    }, { passive: false });

    window.addEventListener('touchend', handlePointerUp);
  }

  function renderLevelSelector(worldNum = 1) {
    dom.levelsGrid.innerHTML = '';
    const unlockedLevel = getUnlockedLevel();

    const worldLevels = CONFIG.LEVELS.filter(l => l.world === worldNum);
    worldLevels.forEach(lvl => {
      const idx = lvl.id - 1;
      const badge = document.createElement('div');
      badge.className = 'level-badge';
      const isUnlocked = idx <= unlockedLevel;
      const isCurrent = idx === State.currentLevelIdx;

      if (isUnlocked) badge.classList.add('unlocked');
      if (isCurrent) badge.classList.add('current');
      if (!isUnlocked) badge.classList.add('locked');

      const numSpan = document.createElement('span');
      numSpan.className = 'level-num';
      numSpan.textContent = lvl.id;
      badge.appendChild(numSpan);

      const starsSpan = document.createElement('span');
      starsSpan.className = 'level-stars';
      const rec = getLevelRecord(idx);
      starsSpan.textContent = rec.stars > 0 ? '★'.repeat(rec.stars) : (isUnlocked ? '---' : '🔒');
      badge.appendChild(starsSpan);

      if (isUnlocked) {
        badge.addEventListener('click', () => {
          playAudio('swap');
          startLevel(idx);
        });
      }

      dom.levelsGrid.appendChild(badge);
    });

    const wCfg = CONFIG.WORLDS[worldNum - 1];
    dom.worldBadge.textContent = `MUNDO ${wCfg.id}: ${wCfg.name.toUpperCase()}`;
    dom.worldDesc.textContent = wCfg.desc;
  }

  function setupUI() {
    dom.btnSwapAmmo.addEventListener('click', swapAmmo);

    // Boosters toggle
    dom.btnBoosterBomb.addEventListener('click', () => {
      if (State.boosters.bomb <= 0) return;
      playAudio('booster');
      State.activeBooster = (State.activeBooster === 'bomb') ? null : 'bomb';
      updateBoosterButtons();
    });

    dom.btnBoosterRainbow.addEventListener('click', () => {
      if (State.boosters.rainbow <= 0) return;
      playAudio('booster');
      State.activeBooster = (State.activeBooster === 'rainbow') ? null : 'rainbow';
      updateBoosterButtons();
    });

    dom.btnBoosterAim.addEventListener('click', () => {
      if (State.boosters.aim <= 0) return;
      playAudio('booster');
      State.activeBooster = (State.activeBooster === 'aim') ? null : 'aim';
      updateBoosterButtons();
    });

    // Pestañas de mundos
    dom.worldTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        dom.worldTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const world = parseInt(tab.dataset.world, 10);
        renderLevelSelector(world);
      });
    });

    // Pausa y Reanudar
    dom.btnPauseHeader.addEventListener('click', () => {
      if (State.state === 'AIMING' || State.state === 'SHOOTING') {
        State.state = 'PAUSED';
        stopBGM();
        dom.overlayPause.classList.remove('hidden');
      }
    });

    dom.btnResume.addEventListener('click', () => {
      dom.overlayPause.classList.add('hidden');
      State.state = 'AIMING';
      startBGM();
    });

    dom.btnRestartLevel.addEventListener('click', () => {
      dom.overlayPause.classList.add('hidden');
      startLevel(State.currentLevelIdx);
    });

    dom.btnLevelSelect.addEventListener('click', () => {
      dom.overlayPause.classList.add('hidden');
      dom.startCard.classList.remove('hidden');
      renderLevelSelector(State.currentWorld);
    });

    dom.btnNextLevel.addEventListener('click', () => {
      dom.overlayResult.classList.add('hidden');
      startLevel(State.currentLevelIdx + 1);
    });

    dom.btnRetryLevel.addEventListener('click', () => {
      dom.overlayResult.classList.add('hidden');
      startLevel(State.currentLevelIdx);
    });

    dom.btnExitToLevels.addEventListener('click', () => {
      dom.overlayResult.classList.add('hidden');
      dom.startCard.classList.remove('hidden');
      renderLevelSelector(State.currentWorld);
    });

    // Modo Sin Fin / Supervivencia
    dom.btnEndlessMode.addEventListener('click', () => {
      startLevel(0, false);
      State.isEndless = true;
    });

    // Desafío Diario
    dom.btnOpenDaily.addEventListener('click', () => {
      dom.modalDaily.classList.remove('hidden');
    });

    dom.btnCloseDaily.addEventListener('click', () => {
      dom.modalDaily.classList.add('hidden');
    });

    dom.btnStartDaily.addEventListener('click', () => {
      dom.modalDaily.classList.add('hidden');
      // Otorgar bonificación de boosters
      State.boosters.bomb++;
      State.boosters.rainbow++;
      State.boosters.aim++;
      saveStorage();
      updateBoosterButtons();

      const todayLvl = (new Date().getDate() * 2) % 60;
      startLevel(todayLvl, true);
    });

    // Modales de Logros y Opciones
    dom.btnAchievementsToggle.addEventListener('click', () => {
      dom.achList.innerHTML = '';
      CONFIG.ACHIEVEMENTS.forEach(ach => {
        const item = document.createElement('div');
        const isUnlocked = !!State.achievements[ach.id];
        item.className = `ach-item ${isUnlocked ? 'unlocked' : ''}`;
        item.innerHTML = `
          <span class="ach-icon">${ach.icon}</span>
          <div style="display:flex; flex-direction:column;">
            <span class="ach-title">${ach.title}</span>
            <span class="ach-desc">${ach.desc}</span>
          </div>
          <span class="ach-status">${isUnlocked ? 'COMPLETADO' : 'BLOQUEADO'}</span>
        `;
        dom.achList.appendChild(item);
      });
      dom.modalAchievements.classList.remove('hidden');
    });

    dom.btnCloseAch.addEventListener('click', () => {
      dom.modalAchievements.classList.add('hidden');
    });

    dom.btnOptionsToggle.addEventListener('click', () => {
      dom.modalOptions.classList.remove('hidden');
    });

    dom.btnCloseOptions.addEventListener('click', () => {
      State.options.sfx = dom.optSfx.checked;
      State.options.bgm = dom.optBgm.checked;
      State.options.vibration = dom.optVibration.checked;
      State.options.contrast = dom.optContrast.checked;
      saveStorage();
      applyOptions();
      dom.modalOptions.classList.add('hidden');
    });

    // Sonido mute rápido
    dom.btnSoundToggle.addEventListener('click', () => {
      if (window.ArcadeAudio) {
        window.ArcadeAudio.toggleMute();
        const muted = window.ArcadeAudio.isMuted;
        dom.iconSoundOn.classList.toggle('hidden', muted);
        dom.iconSoundOff.classList.toggle('hidden', !muted);
      }
    });

    window.addEventListener('resize', handleResize);
  }

  function handleResize() {
    const canvas = dom.canvas;
    const canvasContainer = canvas.parentElement;
    if (!canvasContainer) return;

    const cRect = canvasContainer.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const w = cRect.width;
    const h = cRect.height;

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    State.boardW = w;
    State.boardH = h;
    State.bubbleRadius = w / (CONFIG.COLS_EVEN * 2);
    State.cannonX = w / 2;
    State.cannonY = h - State.bubbleRadius * 1.42 - 6;

    State.ctx = canvas.getContext('2d');
    State.ctx.scale(dpr, dpr);

    buildBubbleSprites(State.bubbleRadius);
    updateBackgroundCache(State.boardW, State.boardH, State.currentWorld);
  }

  // Bucle principal de simulación fija y render con requestAnimationFrame
  function gameLoop(time) {
    if (!State.lastTime) State.lastTime = time;
    const dt = Math.min((time - State.lastTime) * 0.001, 0.08);
    State.lastTime = time;

    updatePerfTuner(dt, time);

    if (State.state !== 'PAUSED') {
      window.ArcadeTween?.update(dt);

      if (State.projectile) {
        updateProjectile(dt);
      }

      updateFallingBubbles(dt);
      updateParticles(dt);

      // Score count-up progresivo
      if (State.displayedScore < State.score) {
        const diff = State.score - State.displayedScore;
        const step = Math.max(1, Math.ceil(diff * Math.min(1, dt * 10)));
        State.displayedScore = Math.min(State.score, State.displayedScore + step);
        dom.scoreVal.textContent = State.displayedScore.toLocaleString();
      }
    }

    render(time);
    requestAnimationFrame(gameLoop);
  }

  function getCannonAndBubbleRects() {
    const canvas = dom.canvas;
    const canvasRect = canvas.getBoundingClientRect();
    const rad = State.bubbleRadius;

    // Cañón
    const cannonCenterX = canvasRect.left + State.cannonX;
    const cannonCenterY = canvasRect.top + State.cannonY;
    const cannonR = rad * 1.35;
    const cannonRect = {
      left: cannonCenterX - cannonR,
      right: cannonCenterX + cannonR,
      top: cannonCenterY - cannonR,
      bottom: cannonCenterY + cannonR,
      width: cannonR * 2,
      height: cannonR * 2
    };

    // Burbuja actual
    const currentBubbleRect = {
      left: cannonCenterX - rad,
      right: cannonCenterX + rad,
      top: cannonCenterY - rad,
      bottom: cannonCenterY + rad,
      width: rad * 2,
      height: rad * 2
    };

    // Siguiente burbuja (pedestal)
    const nextX = State.cannonX - rad * 1.7;
    const nextY = State.cannonY;
    const nextR = rad * 0.85;
    const nextCenterX = canvasRect.left + nextX;
    const nextCenterY = canvasRect.top + nextY;
    const nextBubbleRect = {
      left: nextCenterX - nextR,
      right: nextCenterX + nextR,
      top: nextCenterY - nextR,
      bottom: nextCenterY + nextR,
      width: nextR * 2,
      height: nextR * 2
    };

    return {
      cannon: cannonRect,
      currentBubble: currentBubbleRect,
      nextBubble: nextBubbleRect
    };
  }

  function init() {
    loadStorage();
    handleResize();
    setupInputs();
    setupUI();
    renderLevelSelector(1);
    renderNextAmmoPreview();
    requestAnimationFrame(gameLoop);
  }

  if (typeof window !== 'undefined') {
    window.getCannonAndBubbleRects = getCannonAndBubbleRects;
    window.LanzaburbujasState = State;
    window.LanzaburbujasLogic = LanzaburbujasLogic;
  }

  window.addEventListener('DOMContentLoaded', init);
})();
