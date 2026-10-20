/**
 * SOMBRAS - Juego Completo de Sigilo y Escape Procedural
 * Arcade Vanilla JS sin dependencias ni librerías externas.
 *
 * Características:
 * - Laberinto procedural garantizado 100% conexo con bucles alternativos.
 * - 4 Skins detalladas para el Agente ("Monitos Chidos") con selector en tiempo real.
 * - 3 Tipos de Guardianes: Patrullero, Cazador y Cámara Centinela con IA de estados y conos de luz reactivos.
 * - Corrección de cámaras: las cámaras no matan por contacto físico; el sigilo por sus puntos ciegos es 100% viable.
 * - Sistema de Sprint con barra de energía y propagación de ruido acústico.
 * - Objetos: Señuelo acústico lanzable y Escudo de energía con absorción y aturdimiento.
 * - Tensión sonora con latidos cardíacos sintetizados en tiempo real y escalado progresivo.
 */
(() => {
  'use strict';

  // ============================================================================
  // 1. CONFIGURACIÓN MODULAR DEL JUEGO
  // ============================================================================
  const CONFIG = {
    // Rejilla y dimensiones
    CELL_SIZE: 44,             // Tamaño de celda en píxeles del mundo
    BASE_COLS: 15,             // Columnas base
    BASE_ROWS: 17,             // Filas base
    LOOP_RATIO: 0.14,          // Probabilidad de aperturas interiores para crear rutas de escape

    // Jugador
    PLAYER_SPEED_WALK: 120,    // Velocidad al caminar (px/s)
    PLAYER_SPEED_SPRINT: 190,  // Velocidad al correr (px/s)
    PLAYER_RADIUS: 11,         // Radio de colisión (px)
    PLAYER_ROT_SPEED: 14.0,    // Velocidad angular de giro (rad/s)
    INVULNERABLE_TIME: 2.0,    // Tiempo de invulnerabilidad tras ser capturado

    // Resistencia (Stamina)
    STAMINA_MAX: 100,
    STAMINA_DRAIN: 34,         // Gasto por segundo corriendo
    STAMINA_RECOVER: 22,       // Recuperación por segundo caminando/quieto

    // Ruido y Acústica
    NOISE_RADIUS_WALK: 25,
    NOISE_RADIUS_SPRINT: 165,  // Radio de alerta auditiva al correr
    DECOY_NOISE_RADIUS: 240,   // Radio de atracción del señuelo
    DECOY_THROW_SPEED: 320,    // Velocidad del proyectil señuelo (px/s)
    DECOY_MAX_DIST: 145,       // Alcance máximo de lanzamiento (px)

    // Visión / Linterna
    FLASHLIGHT_RADIUS: 175,
    FLASHLIGHT_ANGLE: 75,
    AMBIENT_RADIUS: 46,
    FOG_EXPLORED_ALPHA: 0.88,
    FOG_UNEXPLORED_ALPHA: 1.0,

    // Guardianes: 1. Patrullero
    PATROLLER_SPEED_PATROL: 55,
    PATROLLER_SPEED_CHASE: 88,
    PATROLLER_RADIUS: 12,
    PATROLLER_VISION_RADIUS: 150,
    PATROLLER_VISION_ANGLE: 65,

    // Guardianes: 2. Cazador
    HUNTER_SPEED: 78,
    HUNTER_RADIUS: 12,
    HUNTER_VISION_RADIUS: 140,
    HUNTER_VISION_ANGLE: 60,
    HUNTER_HEARING_MULT: 1.3,

    // Guardianes: 3. Cámara Centinela
    SENTINEL_ROT_SPEED: 0.9,   // Giro constante del cono (rad/s)
    SENTINEL_VISION_RADIUS: 175,
    SENTINEL_VISION_ANGLE: 70,

    // IA y Tiempos
    AI_RECALC_INTERVAL: 0.28,
    AI_INVESTIGATE_TIME: 2.6,
    AI_LOSE_SIGHT_TIME: 1.2,

    // Controles y Cámara
    JOYSTICK_MAX_DIST: 44,
    JOYSTICK_DEADZONE: 5,
    CAMERA_LERP: 0.15
  };

  // SKINS DISPONIBLES PARA EL AGENTE ("Monitos Chidos")
  const SKINS = [
    {
      id: 'infiltrator',
      name: 'INFILTRADOR',
      accent: '#c084fc',
      glow: 'rgba(192, 132, 252, 0.5)',
      body: '#1e1633',
      armor: '#2a1f47',
      visor: '#f3e8ff',
      lightTint: 'rgba(235, 220, 255, 0.12)'
    },
    {
      id: 'cyberghost',
      name: 'CIBER-FANTASMA',
      accent: '#38bdf8',
      glow: 'rgba(56, 189, 248, 0.5)',
      body: '#0f172a',
      armor: '#1e293b',
      visor: '#bae6fd',
      lightTint: 'rgba(186, 230, 253, 0.12)'
    },
    {
      id: 'crimsonshadow',
      name: 'SOMBRA CARMESÍ',
      accent: '#f43f5e',
      glow: 'rgba(244, 63, 94, 0.5)',
      body: '#1c1018',
      armor: '#331826',
      visor: '#fecdd3',
      lightTint: 'rgba(254, 205, 211, 0.12)'
    },
    {
      id: 'goldspecter',
      name: 'ESPECTRO ORO',
      accent: '#fbbf24',
      glow: 'rgba(251, 191, 36, 0.5)',
      body: '#1f1a0e',
      armor: '#382e14',
      visor: '#fef08a',
      lightTint: 'rgba(254, 240, 138, 0.12)'
    }
  ];

  // ============================================================================
  // 2. GENERADOR PROCEDURAL Y ALGORITMOS DE PATHFINDING / LÍNEA DE VISIÓN
  // ============================================================================
  class MazeGenerator {
    static generate(cols, rows, loopRatio = CONFIG.LOOP_RATIO) {
      const W = cols % 2 === 0 ? cols + 1 : cols;
      const H = rows % 2 === 0 ? rows + 1 : rows;

      const grid = Array.from({ length: H }, () => new Uint8Array(W).fill(1));
      const stack = [];
      const startX = 1;
      const startY = 1;

      grid[startY][startX] = 0;
      stack.push({ x: startX, y: startY });

      const directions = [
        { dx: 0, dy: -2 },
        { dx: 0, dy: 2 },
        { dx: -2, dy: 0 },
        { dx: 2, dy: 0 }
      ];

      while (stack.length > 0) {
        const cur = stack[stack.length - 1];
        const neighbors = [];

        for (let i = directions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const temp = directions[i];
          directions[i] = directions[j];
          directions[j] = temp;
        }

        for (let i = 0; i < directions.length; i++) {
          const d = directions[i];
          const nx = cur.x + d.dx;
          const ny = cur.y + d.dy;
          if (nx > 0 && nx < W - 1 && ny > 0 && ny < H - 1 && grid[ny][nx] === 1) {
            neighbors.push({
              x: nx,
              y: ny,
              wallX: cur.x + d.dx / 2,
              wallY: cur.y + d.dy / 2
            });
          }
        }

        if (neighbors.length > 0) {
          const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
          grid[chosen.wallY][chosen.wallX] = 0;
          grid[chosen.y][chosen.x] = 0;
          stack.push({ x: chosen.x, y: chosen.y });
        } else {
          stack.pop();
        }
      }

      // Añadir aperturas para bucles
      for (let y = 2; y < H - 2; y++) {
        for (let x = 2; x < W - 2; x++) {
          if (grid[y][x] === 1) {
            const hConnect = grid[y][x - 1] === 0 && grid[y][x + 1] === 0 && grid[y - 1][x] === 1 && grid[y + 1][x] === 1;
            const vConnect = grid[y - 1][x] === 0 && grid[y + 1][x] === 0 && grid[y][x - 1] === 1 && grid[y][x + 1] === 1;
            if ((hConnect || vConnect) && Math.random() < loopRatio) {
              grid[y][x] = 0;
            }
          }
        }
      }

      return { grid, W, H, startX, startY };
    }

    static findNearestFloor(grid, W, H, startX, startY) {
      if (startX >= 0 && startX < W && startY >= 0 && startY < H && grid[startY][startX] === 0) {
        return { x: startX, y: startY };
      }
      for (let r = 1; r <= 3; r++) {
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            const nx = startX + dx;
            const ny = startY + dy;
            if (nx >= 0 && nx < W && ny >= 0 && ny < H && grid[ny][nx] === 0) {
              return { x: nx, y: ny };
            }
          }
        }
      }
      return null;
    }

    static findPathBFS(grid, W, H, startCell, goalCell) {
      if (!startCell || !goalCell) return null;

      let start = startCell;
      if (start.x < 0 || start.x >= W || start.y < 0 || start.y >= H || grid[start.y][start.x] === 1) {
        start = MazeGenerator.findNearestFloor(grid, W, H, startCell.x, startCell.y);
        if (!start) return null;
      }

      let goal = goalCell;
      if (goal.x < 0 || goal.x >= W || goal.y < 0 || goal.y >= H || grid[goal.y][goal.x] === 1) {
        goal = MazeGenerator.findNearestFloor(grid, W, H, goalCell.x, goalCell.y);
        if (!goal) return null;
      }

      if (start.x === goal.x && start.y === goal.y) return [];

      const visited = Array.from({ length: H }, () => new Int16Array(W).fill(-1));
      const parent = Array.from({ length: H }, () => new Array(W).fill(null));
      const queue = [{ x: start.x, y: start.y }];
      visited[start.y][start.x] = 0;

      const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
      let head = 0;
      let found = false;

      while (head < queue.length) {
        const cur = queue[head++];
        if (cur.x === goal.x && cur.y === goal.y) {
          found = true;
          break;
        }

        for (let i = 0; i < dirs.length; i++) {
          const d = dirs[i];
          const nx = cur.x + d.dx;
          const ny = cur.y + d.dy;
          if (nx >= 0 && nx < W && ny >= 0 && ny < H && grid[ny][nx] === 0 && visited[ny][nx] === -1) {
            visited[ny][nx] = visited[cur.y][cur.x] + 1;
            parent[ny][nx] = cur;
            queue.push({ x: nx, y: ny });
          }
        }
      }

      if (!found) return null;

      const path = [];
      let curr = goal;
      while (curr && !(curr.x === start.x && curr.y === start.y)) {
        path.unshift({ x: curr.x, y: curr.y });
        curr = parent[curr.y][curr.x];
      }
      return path;
    }

    static hasLineOfSight(grid, W, H, cellSize, x0, y0, x1, y1) {
      const dx = x1 - x0;
      const dy = y1 - y0;
      const dist = Math.hypot(dx, dy);
      if (dist === 0) return true;

      const steps = Math.ceil(dist / (cellSize * 0.35));
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const px = x0 + dx * t;
        const py = y0 + dy * t;
        const col = Math.floor(px / cellSize);
        const row = Math.floor(py / cellSize);
        if (col < 0 || col >= W || row < 0 || row >= H || grid[row][col] === 1) {
          return false;
        }
      }
      return true;
    }

    static countOpenNeighbors(grid, W, H, col, row) {
      let count = 0;
      if (col > 0 && grid[row][col - 1] === 0) count++;
      if (col < W - 1 && grid[row][col + 1] === 0) count++;
      if (row > 0 && grid[row - 1][col] === 0) count++;
      if (row < H - 1 && grid[row + 1][col] === 0) count++;
      return count;
    }

    static placeEntities(maze, level) {
      const { grid, W, H, startX, startY } = maze;
      const dists = Array.from({ length: H }, () => new Int16Array(W).fill(-1));
      const queue = [{ x: startX, y: startY, d: 0 }];
      dists[startY][startX] = 0;
      const allFloors = [];

      const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
      let head = 0;
      while (head < queue.length) {
        const cur = queue[head++];
        allFloors.push({ x: cur.x, y: cur.y, d: cur.d });
        for (let i = 0; i < dirs.length; i++) {
          const d = dirs[i];
          const nx = cur.x + d.dx;
          const ny = cur.y + d.dy;
          if (nx >= 0 && nx < W && ny >= 0 && ny < H && grid[ny][nx] === 0 && dists[ny][nx] === -1) {
            dists[ny][nx] = cur.d + 1;
            queue.push({ x: nx, y: ny, d: cur.d + 1 });
          }
        }
      }

      allFloors.sort((a, b) => b.d - a.d);
      const exitCell = allFloors[0];

      // 3 Llaves dispersas
      const keyCandidates = allFloors.filter(c => c.d >= 5 && !(c.x === exitCell.x && c.y === exitCell.y));
      const keys = [];
      for (let i = 0; i < 3; i++) {
        let best = null;
        let maxMinDist = -1;
        for (let j = 0; j < keyCandidates.length; j++) {
          const cand = keyCandidates[j];
          if (keys.some(k => k.x === cand.x && k.y === cand.y)) continue;
          let minDist = Math.hypot(cand.x - startX, cand.y - startY);
          for (let k = 0; k < keys.length; k++) {
            const d = Math.hypot(cand.x - keys[k].x, cand.y - keys[k].y);
            if (d < minDist) minDist = d;
          }
          if (minDist > maxMinDist) {
            maxMinDist = minDist;
            best = cand;
          }
        }
        if (best) keys.push(best);
      }

      // Escudo de energía (1 por nivel)
      const shieldCandidates = allFloors.filter(c => c.d >= 6 && c.d <= 14 && !keys.some(k => k.x === c.x && k.y === c.y));
      const shieldCell = shieldCandidates.length > 0 ? shieldCandidates[Math.floor(shieldCandidates.length / 2)] : null;

      // Waypoints de patrulla
      const patrolCandidates = allFloors.filter(c => c.d >= 7 && !(c.x === exitCell.x && c.y === exitCell.y));
      const waypoints = [];
      const stepInterval = Math.max(1, Math.floor(patrolCandidates.length / 4));
      for (let i = 0; i < 4 && i * stepInterval < patrolCandidates.length; i++) {
        waypoints.push(patrolCandidates[i * stepInterval]);
      }

      // CORRECCIÓN CRÍTICA DE CÁMARAS CENTINELA:
      // Se colocan EXCLUSIVAMENTE en celdas con 3 o 4 vecinos abiertos (intersecciones amplias o rotondas)
      // para que NUNCA obstruyan un pasillo único obligatorio.
      const wideJunctions = allFloors.filter(c => {
        if (c.d < 6 || (c.x === exitCell.x && c.y === exitCell.y)) return false;
        if (keys.some(k => k.x === c.x && k.y === c.y)) return false;
        return MazeGenerator.countOpenNeighbors(grid, W, H, c.x, c.y) >= 3;
      });

      const sentinelPositions = [];
      const sentinelCount = level >= 4 ? 2 : 1;
      for (let i = 0; i < sentinelCount && i < wideJunctions.length; i++) {
        sentinelPositions.push(wideJunctions[i * Math.floor(wideJunctions.length / sentinelCount)]);
      }
      if (sentinelPositions.length === 0) {
        sentinelPositions.push({ x: Math.floor(W / 2), y: Math.floor(H / 2) });
      }

      // Posición del Cazador: cuadrante alejado en una intersección amplia o pasillo abierto (>= 2 vecinos abiertos, nunca callejón ciego)
      // y sin bloquear llaves ni salida
      const hunterCandidates = allFloors.filter(c => {
        if (c.d < 10) return false;
        if (c.x === exitCell.x && c.y === exitCell.y) return false;
        if (keys.some(k => Math.hypot(k.x - c.x, k.y - c.y) < 2)) return false;
        return MazeGenerator.countOpenNeighbors(grid, W, H, c.x, c.y) >= 2;
      });
      // Preferir intersecciones amplias (>= 3 vecinos abiertos) si están disponibles
      const wideHunterCandidates = hunterCandidates.filter(c => MazeGenerator.countOpenNeighbors(grid, W, H, c.x, c.y) >= 3);
      const chosenPool = wideHunterCandidates.length > 0 ? wideHunterCandidates : hunterCandidates;

      // Tomamos una celda del tercio más profundo para garantizar distancia respecto al spawn
      const hunterCell = chosenPool.length > 0
        ? chosenPool[Math.floor(chosenPool.length * 0.4)]
        : (waypoints[waypoints.length - 1] || { x: exitCell.x, y: exitCell.y });

      // Waypoints dedicados para el Cazador (circuitos por distintos cuadrantes del laberinto)
      const hunterWaypoints = [];
      const wpPool = wideHunterCandidates.length >= 3 ? wideHunterCandidates : hunterCandidates;
      if (wpPool.length >= 3) {
        const step = Math.max(1, Math.floor(wpPool.length / 4));
        for (let i = 0; i < 4 && i * step < wpPool.length; i++) {
          hunterWaypoints.push(wpPool[i * step]);
        }
      } else {
        hunterWaypoints.push(...waypoints);
      }

      return {
        exit: exitCell,
        keys,
        shieldItem: shieldCell,
        patrolWaypoints: waypoints,
        hunterWaypoints,
        sentinelPositions,
        hunterPos: hunterCell
      };
    }
  }

  // ============================================================================
  // 3. CLASES DE GUARDIANES ("Monitos Chidos" de IA)
  // ============================================================================

  /**
   * 1. PATRULLERO: Dron de seguridad aerodeslizador con alerones y propulsor iónico.
   */
  class PatrollerGuardian {
    constructor(startX, startY, waypoints) {
      this.type = 'PATROLLER';
      this.x = startX;
      this.y = startY;
      this.radius = CONFIG.PATROLLER_RADIUS;
      this.angle = 0;
      this.targetAngle = 0;
      this.state = 'PATROL'; // 'PATROL', 'CHASING', 'INVESTIGATING'
      this.waypoints = waypoints || [];
      this.currentWaypointIndex = 0;
      this.path = [];
      this.pathIndex = 0;
      this.recalcTimer = 0;
      this.loseSightTimer = 0;
      this.investigateTimer = 0;
      this.investigateTurnAngle = 0;
      this.lastKnownPlayerPos = { x: startX, y: startY };
      this.hasAlerted = false;
      this.stunTimer = 0;
    }

    stun(duration = 2.0) {
      this.stunTimer = duration;
      this.state = 'PATROL';
    }

    onHeardNoise(noiseX, noiseY, maze, S) {
      if (this.state === 'CHASING' || this.stunTimer > 0) return;
      this.state = 'INVESTIGATING';
      this.investigateTimer = CONFIG.AI_INVESTIGATE_TIME;
      this.lastKnownPlayerPos = { x: noiseX, y: noiseY };
      const curCell = { x: Math.floor(this.x / S), y: Math.floor(this.y / S) };
      const targetCell = { x: Math.floor(noiseX / S), y: Math.floor(noiseY / S) };
      this.path = MazeGenerator.findPathBFS(maze.grid, maze.W, maze.H, curCell, targetCell) || [];
      this.pathIndex = 0;
    }

    update(dt, player, maze, game) {
      if (this.stunTimer > 0) {
        this.stunTimer -= dt;
        return;
      }

      const S = CONFIG.CELL_SIZE;
      const gx = this.x;
      const gy = this.y;
      const px = player.x;
      const py = player.y;

      const distToPlayer = Math.hypot(px - gx, py - gy);
      const angleToPlayer = Math.atan2(py - gy, px - gx);
      let angleDiff = Math.abs(angleToPlayer - this.angle);
      while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);

      const halfVisionAngle = (CONFIG.PATROLLER_VISION_ANGLE * Math.PI) / 360;
      const inCone = distToPlayer <= CONFIG.PATROLLER_VISION_RADIUS && angleDiff <= halfVisionAngle;
      const canSeePlayer = inCone && MazeGenerator.hasLineOfSight(maze.grid, maze.W, maze.H, S, gx, gy, px, py);

      if (canSeePlayer) {
        if (this.state !== 'CHASING') {
          this.state = 'CHASING';
          this.hasAlerted = false;
          game.showAlert('Patrullero en alerta', 'danger');
        }

        if (!this.hasAlerted) {
          this.hasAlerted = true;
          if (window.ArcadeAudio && window.ArcadeAudio.playTone) {
            window.ArcadeAudio.playTone(660, 'sawtooth', 0.1, 0.15);
          }
          if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(20);
        }

        this.loseSightTimer = 0;
        this.lastKnownPlayerPos.x = px;
        this.lastKnownPlayerPos.y = py;
      } else if (this.state === 'CHASING') {
        this.loseSightTimer += dt;
        if (this.loseSightTimer >= CONFIG.AI_LOSE_SIGHT_TIME) {
          this.state = 'INVESTIGATING';
          this.investigateTimer = CONFIG.AI_INVESTIGATE_TIME;
          this.hasAlerted = false;
          const curCell = { x: Math.floor(gx / S), y: Math.floor(gy / S) };
          const lastCell = { x: Math.floor(this.lastKnownPlayerPos.x / S), y: Math.floor(this.lastKnownPlayerPos.y / S) };
          this.path = MazeGenerator.findPathBFS(maze.grid, maze.W, maze.H, curCell, lastCell) || [];
          this.pathIndex = 0;
        }
      }

      if (this.state === 'CHASING') {
        this.updateChase(dt, px, py, maze, S, canSeePlayer, game);
      } else if (this.state === 'INVESTIGATING') {
        this.updateInvestigate(dt, maze, S, game);
      } else {
        this.updatePatrol(dt, maze, S, game);
      }

      if (distToPlayer < this.radius + player.radius && !player.isInvulnerable) {
        game.onPlayerCaught(this);
      }
    }

    updateChase(dt, px, py, maze, S, canSeePlayer, game) {
      if (!this.path || this.pathIndex >= this.path.length) {
        this.recalcTimer = 0;
      }

      this.recalcTimer -= dt;
      if (this.recalcTimer <= 0) {
        this.recalcTimer = CONFIG.AI_RECALC_INTERVAL;
        const curCell = { x: Math.floor(this.x / S), y: Math.floor(this.y / S) };
        const playerCell = { x: Math.floor(px / S), y: Math.floor(py / S) };
        this.path = MazeGenerator.findPathBFS(maze.grid, maze.W, maze.H, curCell, playerCell) || [];
        this.pathIndex = 0;
      }

      let targetX = this.x;
      let targetY = this.y;
      if (this.path && this.pathIndex < this.path.length) {
        const nextCell = this.path[this.pathIndex];
        const cellCenterX = (nextCell.x + 0.5) * S;
        const cellCenterY = (nextCell.y + 0.5) * S;
        if (Math.hypot(cellCenterX - this.x, cellCenterY - this.y) < 8) this.pathIndex++;
        targetX = cellCenterX;
        targetY = cellCenterY;
      } else if (canSeePlayer) {
        targetX = px;
        targetY = py;
      }
      this.moveTowards(targetX, targetY, CONFIG.PATROLLER_SPEED_CHASE, dt, game);
    }

    updateInvestigate(dt, maze, S, game) {
      const targetX = this.lastKnownPlayerPos.x;
      const targetY = this.lastKnownPlayerPos.y;
      const distToTarget = Math.hypot(targetX - this.x, targetY - this.y);

      if (distToTarget > 12 && this.path && this.pathIndex < this.path.length) {
        const nextCell = this.path[this.pathIndex];
        const cellCenterX = (nextCell.x + 0.5) * S;
        const cellCenterY = (nextCell.y + 0.5) * S;
        if (Math.hypot(cellCenterX - this.x, cellCenterY - this.y) < 8) this.pathIndex++;
        this.moveTowards(cellCenterX, cellCenterY, CONFIG.PATROLLER_SPEED_PATROL * 1.1, dt, game);
      } else {
        this.investigateTimer -= dt;
        this.investigateTurnAngle += dt * 3.5;
        this.angle += Math.sin(this.investigateTurnAngle) * 0.05;

        if (this.investigateTimer <= 0) {
          this.state = 'PATROL';
          this.initNextPatrolPath(maze, S);
        }
      }
    }

    updatePatrol(dt, maze, S, game) {
      if (this.waypoints.length === 0) return;
      const currentWp = this.waypoints[this.currentWaypointIndex];
      const wpCenterX = (currentWp.x + 0.5) * S;
      const wpCenterY = (currentWp.y + 0.5) * S;

      if (!this.path || this.path.length === 0 || this.pathIndex >= this.path.length) {
        const curCell = { x: Math.floor(this.x / S), y: Math.floor(this.y / S) };
        this.path = MazeGenerator.findPathBFS(maze.grid, maze.W, maze.H, curCell, currentWp) || [];
        this.pathIndex = 0;

        if (this.path.length === 0 || Math.hypot(wpCenterX - this.x, wpCenterY - this.y) < 8) {
          this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
          this.path = null;
          return;
        }
      }

      if (this.path && this.pathIndex < this.path.length) {
        const nextCell = this.path[this.pathIndex];
        const cellCenterX = (nextCell.x + 0.5) * S;
        const cellCenterY = (nextCell.y + 0.5) * S;
        if (Math.hypot(cellCenterX - this.x, cellCenterY - this.y) < 8) this.pathIndex++;
        this.moveTowards(cellCenterX, cellCenterY, CONFIG.PATROLLER_SPEED_PATROL, dt, game);
      }
    }

    initNextPatrolPath(maze, S) {
      const curCell = { x: Math.floor(this.x / S), y: Math.floor(this.y / S) };
      let bestIdx = 0;
      let minDist = Infinity;
      for (let i = 0; i < this.waypoints.length; i++) {
        const wp = this.waypoints[i];
        const d = Math.hypot(wp.x - curCell.x, wp.y - curCell.y);
        if (d < minDist) {
          minDist = d;
          bestIdx = i;
        }
      }
      this.currentWaypointIndex = bestIdx;
      this.path = MazeGenerator.findPathBFS(maze.grid, maze.W, maze.H, curCell, this.waypoints[bestIdx]) || [];
      this.pathIndex = 0;
    }

    moveTowards(targetX, targetY, speed, dt, game) {
      const dx = targetX - this.x;
      const dy = targetY - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 1.5) return;

      this.targetAngle = Math.atan2(dy, dx);
      let diff = this.targetAngle - this.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.angle += diff * Math.min(1.0, 11.0 * dt);

      const moveStep = Math.min(dist, speed * dt);
      const moveX = (dx / dist) * moveStep;
      const moveY = (dy / dist) * moveStep;

      if (game && game.checkWallCollision) {
        const nextX = this.x + moveX;
        if (!game.checkWallCollision(nextX, this.y, this.radius)) {
          this.x = nextX;
        }
        const nextY = this.y + moveY;
        if (!game.checkWallCollision(this.x, nextY, this.radius)) {
          this.y = nextY;
        }

        if (game.checkWallCollision(this.x, this.y, this.radius)) {
          const S = CONFIG.CELL_SIZE;
          const nearest = MazeGenerator.findNearestFloor(game.maze.grid, game.maze.W, game.maze.H, Math.floor(this.x / S), Math.floor(this.y / S));
          if (nearest) {
            this.x += ((nearest.x + 0.5) * S - this.x) * 0.25;
            this.y += ((nearest.y + 0.5) * S - this.y) * 0.25;
          }
        }
      } else {
        this.x += moveX;
        this.y += moveY;
      }
    }

    render(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);

      let stateColor = '#38bdf8';
      let glowColor = 'rgba(56, 189, 248, 0.45)';
      if (this.stunTimer > 0) {
        stateColor = '#64748b';
        glowColor = 'rgba(100, 116, 139, 0.3)';
      } else if (this.state === 'CHASING') {
        stateColor = '#ef4444';
        glowColor = 'rgba(239, 68, 68, 0.6)';
      } else if (this.state === 'INVESTIGATING') {
        stateColor = '#fbbf24';
        glowColor = 'rgba(251, 191, 36, 0.5)';
      }

      ctx.rotate(this.angle);

      // Aura dinámica
      const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, this.radius + 8);
      aura.addColorStop(0, glowColor);
      aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
      ctx.fill();

      // Chasis de dron de combate
      ctx.fillStyle = '#110f1e';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = stateColor;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Alerones laterales estabilizadores
      ctx.fillStyle = '#221b36';
      ctx.fillRect(-this.radius * 0.4, -this.radius - 3, 5, 3);
      ctx.fillRect(-this.radius * 0.4, this.radius, 5, 3);

      // Propulsor iónico trasero
      ctx.fillStyle = stateColor;
      ctx.fillRect(-this.radius - 2, -2.5, 3, 5);

      // Visor óptico frontal
      ctx.fillStyle = stateColor;
      ctx.beginPath();
      ctx.arc(this.radius * 0.4, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    renderVisionCone(maskCtx, camX, camY) {
      if (this.stunTimer > 0) return;
      const screenX = this.x - camX;
      const screenY = this.y - camY;
      const halfAngle = (CONFIG.PATROLLER_VISION_ANGLE * Math.PI) / 360;

      const coneGrad = maskCtx.createRadialGradient(
        screenX, screenY, this.radius,
        screenX, screenY, CONFIG.PATROLLER_VISION_RADIUS
      );
      coneGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
      coneGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.75)');
      coneGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

      maskCtx.fillStyle = coneGrad;
      maskCtx.beginPath();
      maskCtx.moveTo(screenX, screenY);
      maskCtx.arc(screenX, screenY, CONFIG.PATROLLER_VISION_RADIUS, this.angle - halfAngle, this.angle + halfAngle);
      maskCtx.closePath();
      maskCtx.fill();
    }

    renderAtmosphericCone(ctx, camX, camY) {
      if (this.stunTimer > 0) return;
      const screenX = this.x - camX;
      const screenY = this.y - camY;
      const halfAngle = (CONFIG.PATROLLER_VISION_ANGLE * Math.PI) / 360;

      let tintColor = 'rgba(56, 189, 248, 0.16)';
      let rimColor = 'rgba(56, 189, 248, 0.4)';
      if (this.state === 'CHASING') {
        tintColor = 'rgba(239, 68, 68, 0.28)';
        rimColor = 'rgba(239, 68, 68, 0.65)';
      } else if (this.state === 'INVESTIGATING') {
        tintColor = 'rgba(251, 191, 36, 0.22)';
        rimColor = 'rgba(251, 191, 36, 0.55)';
      }

      ctx.save();
      const beamGrad = ctx.createRadialGradient(
        screenX, screenY, this.radius,
        screenX, screenY, CONFIG.PATROLLER_VISION_RADIUS
      );
      beamGrad.addColorStop(0, tintColor);
      beamGrad.addColorStop(0.85, tintColor);
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
      ctx.arc(screenX, screenY, CONFIG.PATROLLER_VISION_RADIUS, this.angle - halfAngle, this.angle + halfAngle);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = rimColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
      ctx.lineTo(screenX + Math.cos(this.angle - halfAngle) * CONFIG.PATROLLER_VISION_RADIUS, screenY + Math.sin(this.angle - halfAngle) * CONFIG.PATROLLER_VISION_RADIUS);
      ctx.moveTo(screenX, screenY);
      ctx.lineTo(screenX + Math.cos(this.angle + halfAngle) * CONFIG.PATROLLER_VISION_RADIUS, screenY + Math.sin(this.angle + halfAngle) * CONFIG.PATROLLER_VISION_RADIUS);
      ctx.stroke();
      ctx.restore();
    }
  }

  /**
   * 2. CAZADOR: Meca-sabueso de asalto con blindaje afilado y doble sensor carmesí.
   * - Patrulla activamente por los pasillos (STALKING) eligiendo objetivos dinámicos distantes.
   * - No se queda atascado en un pasillo único dando vueltas.
   * - Al investigar tras perder al jugador, si expira el tiempo reanuda su patrulla y se aleja.
   * - Al capturar al jugador, se reinicia a su cuadrante de origen para no campear la salida del respawn.
   */
  class HunterGuardian {
    constructor(startX, startY, waypoints) {
      this.type = 'HUNTER';
      this.spawnX = startX;
      this.spawnY = startY;
      this.x = startX;
      this.y = startY;
      this.radius = CONFIG.HUNTER_RADIUS;
      this.angle = 0;
      this.targetAngle = 0;
      this.state = 'STALKING';
      this.waypoints = waypoints && waypoints.length > 0 ? waypoints : [];
      this.currentWpIndex = 0;
      this.path = [];
      this.pathIndex = 0;
      this.recalcTimer = 0;
      this.loseSightTimer = 0;
      this.investigateTimer = 0;
      this.investigateTurnAngle = 0;
      this.lastKnownPlayerPos = { x: startX, y: startY };
      this.roamTarget = null;
      this.stunTimer = 0;
    }

    stun(duration = 2.5) {
      this.stunTimer = duration;
      this.state = 'STALKING';
      this.path = [];
      this.pathIndex = 0;
    }

    resetToSpawn(maze, S) {
      this.x = this.spawnX;
      this.y = this.spawnY;
      this.state = 'STALKING';
      this.lastKnownPlayerPos = { x: this.spawnX, y: this.spawnY };
      this.loseSightTimer = 0;
      this.investigateTimer = 0;
      this.investigateTurnAngle = 0;
      this.path = [];
      this.pathIndex = 0;
      this.roamTarget = null;
      this.pickNewRoamTarget(maze, S);
    }

    pickNewRoamTarget(maze, S) {
      const curCell = { x: Math.floor(this.x / S), y: Math.floor(this.y / S) };
      let targetWp = null;

      if (this.waypoints && this.waypoints.length > 0) {
        this.currentWpIndex = (this.currentWpIndex + 1) % this.waypoints.length;
        targetWp = this.waypoints[this.currentWpIndex];
      }

      if (!targetWp) {
        targetWp = { x: Math.floor(this.spawnX / S), y: Math.floor(this.spawnY / S) };
      }

      this.roamTarget = { x: (targetWp.x + 0.5) * S, y: (targetWp.y + 0.5) * S };
      const bfsPath = MazeGenerator.findPathBFS(maze.grid, maze.W, maze.H, curCell, targetWp);
      this.path = bfsPath || [];
      this.pathIndex = 0;
    }

    onHeardNoise(noiseX, noiseY, maze, S) {
      if (this.state === 'CHASING' || this.stunTimer > 0) return;
      this.state = 'INVESTIGATING';
      this.investigateTimer = CONFIG.AI_INVESTIGATE_TIME;
      this.lastKnownPlayerPos = { x: noiseX, y: noiseY };
      const curCell = { x: Math.floor(this.x / S), y: Math.floor(this.y / S) };
      const targetCell = { x: Math.floor(noiseX / S), y: Math.floor(noiseY / S) };
      this.path = MazeGenerator.findPathBFS(maze.grid, maze.W, maze.H, curCell, targetCell) || [];
      this.pathIndex = 0;
    }

    update(dt, player, maze, game) {
      if (this.stunTimer > 0) {
        this.stunTimer -= dt;
        return;
      }

      const S = CONFIG.CELL_SIZE;
      const gx = this.x;
      const gy = this.y;
      const px = player.x;
      const py = player.y;

      const distToPlayer = Math.hypot(px - gx, py - gy);
      const angleToPlayer = Math.atan2(py - gy, px - gx);
      let angleDiff = Math.abs(angleToPlayer - this.angle);
      while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);

      const halfVisionAngle = (CONFIG.HUNTER_VISION_ANGLE * Math.PI) / 360;
      const inCone = distToPlayer <= CONFIG.HUNTER_VISION_RADIUS && angleDiff <= halfVisionAngle;
      const canSeePlayer = inCone && MazeGenerator.hasLineOfSight(maze.grid, maze.W, maze.H, S, gx, gy, px, py);

      if (canSeePlayer) {
        if (this.state !== 'CHASING') {
          this.state = 'CHASING';
          game.showAlert('Cazador en rastreo', 'danger');
          if (window.ArcadeAudio && window.ArcadeAudio.playTone) {
            window.ArcadeAudio.playTone(740, 'sawtooth', 0.12, 0.18);
          }
        }
        this.loseSightTimer = 0;
        this.lastKnownPlayerPos.x = px;
        this.lastKnownPlayerPos.y = py;
      } else if (this.state === 'CHASING') {
        this.loseSightTimer += dt;
        if (this.loseSightTimer >= CONFIG.AI_LOSE_SIGHT_TIME * 1.5) {
          this.state = 'INVESTIGATING';
          this.investigateTimer = CONFIG.AI_INVESTIGATE_TIME;
          this.investigateTurnAngle = 0;
          const curCell = { x: Math.floor(gx / S), y: Math.floor(gy / S) };
          const lastCell = { x: Math.floor(this.lastKnownPlayerPos.x / S), y: Math.floor(this.lastKnownPlayerPos.y / S) };
          this.path = MazeGenerator.findPathBFS(maze.grid, maze.W, maze.H, curCell, lastCell) || [];
          this.pathIndex = 0;
        }
      }

      if (this.state === 'CHASING') {
        if (!this.path || this.pathIndex >= this.path.length) {
          this.recalcTimer = 0;
        }

        this.recalcTimer -= dt;
        if (this.recalcTimer <= 0) {
          this.recalcTimer = CONFIG.AI_RECALC_INTERVAL;
          const curCell = { x: Math.floor(gx / S), y: Math.floor(gy / S) };
          const targetCell = { x: Math.floor(px / S), y: Math.floor(py / S) };
          this.path = MazeGenerator.findPathBFS(maze.grid, maze.W, maze.H, curCell, targetCell) || [];
          this.pathIndex = 0;
        }

        let targetX = this.x;
        let targetY = this.y;
        if (this.path && this.pathIndex < this.path.length) {
          const nextCell = this.path[this.pathIndex];
          const cellCenterX = (nextCell.x + 0.5) * S;
          const cellCenterY = (nextCell.y + 0.5) * S;
          if (Math.hypot(cellCenterX - this.x, cellCenterY - this.y) < 8) this.pathIndex++;
          targetX = cellCenterX;
          targetY = cellCenterY;
        } else if (canSeePlayer) {
          targetX = px;
          targetY = py;
        }
        this.moveTowards(targetX, targetY, CONFIG.HUNTER_SPEED, dt, game);

      } else if (this.state === 'INVESTIGATING') {
        const targetX = this.lastKnownPlayerPos.x;
        const targetY = this.lastKnownPlayerPos.y;
        const distToTarget = Math.hypot(targetX - this.x, targetY - this.y);

        if (distToTarget > 12 && this.path && this.pathIndex < this.path.length) {
          const nextCell = this.path[this.pathIndex];
          const cellCenterX = (nextCell.x + 0.5) * S;
          const cellCenterY = (nextCell.y + 0.5) * S;
          if (Math.hypot(cellCenterX - this.x, cellCenterY - this.y) < 8) this.pathIndex++;
          this.moveTowards(cellCenterX, cellCenterY, CONFIG.HUNTER_SPEED * 0.9, dt, game);
        } else {
          this.investigateTimer -= dt;
          this.investigateTurnAngle += dt * 3.5;
          this.angle += Math.sin(this.investigateTurnAngle) * 0.05;

          if (this.investigateTimer <= 0) {
            this.state = 'STALKING';
            game.showAlert('Cazador perdió el rastro', 'warning');
            this.pickNewRoamTarget(maze, S);
          }
        }

      } else {
        // STALKING: patrulla activa navegando el laberinto
        const reachedTarget = !this.roamTarget || !this.path || this.pathIndex >= this.path.length || Math.hypot(this.roamTarget.x - this.x, this.roamTarget.y - this.y) < 14;
        if (reachedTarget) {
          this.pickNewRoamTarget(maze, S);
        }

        if (this.path && this.pathIndex < this.path.length) {
          const nextCell = this.path[this.pathIndex];
          const cellCenterX = (nextCell.x + 0.5) * S;
          const cellCenterY = (nextCell.y + 0.5) * S;
          if (Math.hypot(cellCenterX - this.x, cellCenterY - this.y) < 8) this.pathIndex++;
          this.moveTowards(cellCenterX, cellCenterY, CONFIG.HUNTER_SPEED * 0.75, dt, game);
        }
      }

      if (distToPlayer < this.radius + player.radius && !player.isInvulnerable) {
        game.onPlayerCaught(this);
      }
    }

    moveTowards(targetX, targetY, speed, dt, game) {
      const dx = targetX - this.x;
      const dy = targetY - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 1.5) return;

      this.targetAngle = Math.atan2(dy, dx);
      let diff = this.targetAngle - this.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.angle += diff * Math.min(1.0, 11.0 * dt);

      const moveStep = Math.min(dist, speed * dt);
      const moveX = (dx / dist) * moveStep;
      const moveY = (dy / dist) * moveStep;

      if (game && game.checkWallCollision) {
        const nextX = this.x + moveX;
        if (!game.checkWallCollision(nextX, this.y, this.radius)) {
          this.x = nextX;
        }
        const nextY = this.y + moveY;
        if (!game.checkWallCollision(this.x, nextY, this.radius)) {
          this.y = nextY;
        }

        if (game.checkWallCollision(this.x, this.y, this.radius)) {
          const S = CONFIG.CELL_SIZE;
          const nearest = MazeGenerator.findNearestFloor(game.maze.grid, game.maze.W, game.maze.H, Math.floor(this.x / S), Math.floor(this.y / S));
          if (nearest) {
            this.x += ((nearest.x + 0.5) * S - this.x) * 0.25;
            this.y += ((nearest.y + 0.5) * S - this.y) * 0.25;
          }
        }
      } else {
        this.x += moveX;
        this.y += moveY;
      }
    }

    render(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);

      let col = '#e11d48';
      let glow = 'rgba(225, 29, 72, 0.45)';
      if (this.stunTimer > 0) {
        col = '#64748b';
        glow = 'rgba(100, 116, 139, 0.3)';
      }

      ctx.rotate(this.angle);

      const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, this.radius + 8);
      aura.addColorStop(0, glow);
      aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
      ctx.fill();

      // Chasis afilado en cuña agresiva
      ctx.fillStyle = '#180914';
      ctx.beginPath();
      ctx.moveTo(this.radius + 2, 0);
      ctx.lineTo(-this.radius, -this.radius * 0.85);
      ctx.lineTo(-this.radius * 0.6, 0);
      ctx.lineTo(-this.radius, this.radius * 0.85);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = col;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Doble sensor óptico carmesí
      ctx.fillStyle = col;
      ctx.fillRect(this.radius * 0.15, -4, 4.5, 2);
      ctx.fillRect(this.radius * 0.15, 2, 4.5, 2);

      ctx.restore();
    }

    renderVisionCone(maskCtx, camX, camY) {
      if (this.stunTimer > 0) return;
      const screenX = this.x - camX;
      const screenY = this.y - camY;
      const halfAngle = (CONFIG.HUNTER_VISION_ANGLE * Math.PI) / 360;

      const coneGrad = maskCtx.createRadialGradient(screenX, screenY, this.radius, screenX, screenY, CONFIG.HUNTER_VISION_RADIUS);
      coneGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
      coneGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.75)');
      coneGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

      maskCtx.fillStyle = coneGrad;
      maskCtx.beginPath();
      maskCtx.moveTo(screenX, screenY);
      maskCtx.arc(screenX, screenY, CONFIG.HUNTER_VISION_RADIUS, this.angle - halfAngle, this.angle + halfAngle);
      maskCtx.closePath();
      maskCtx.fill();
    }

    renderAtmosphericCone(ctx, camX, camY) {
      if (this.stunTimer > 0) return;
      const screenX = this.x - camX;
      const screenY = this.y - camY;
      const halfAngle = (CONFIG.HUNTER_VISION_ANGLE * Math.PI) / 360;

      ctx.save();
      const beamGrad = ctx.createRadialGradient(screenX, screenY, this.radius, screenX, screenY, CONFIG.HUNTER_VISION_RADIUS);
      beamGrad.addColorStop(0, 'rgba(225, 29, 72, 0.25)');
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
      ctx.arc(screenX, screenY, CONFIG.HUNTER_VISION_RADIUS, this.angle - halfAngle, this.angle + halfAngle);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  /**
   * 3. CÁMARA CENTINELA (CORREGIDA):
   * - No mata al rozar su base física cuando mira hacia otro lado.
   * - Su amenaza radica en ser detectado por su cono rotatorio, lo que activa la alarma general.
   * - El sigilo por sus puntos ciegos es 100% posible y seguro.
   */
  class SentinelGuardian {
    constructor(x, y) {
      this.type = 'SENTINEL';
      this.x = x;
      this.y = y;
      this.radius = 12;
      this.angle = Math.random() * Math.PI * 2;
      this.state = 'SWEEP'; // 'SWEEP', 'ALERTING'
      this.alertTimer = 0;
      this.stunTimer = 0;
    }

    stun(duration = 2.0) {
      this.stunTimer = duration;
      this.state = 'SWEEP';
    }

    onHeardNoise() {}

    update(dt, player, maze, game) {
      if (this.stunTimer > 0) {
        this.stunTimer -= dt;
        return;
      }

      this.angle += CONFIG.SENTINEL_ROT_SPEED * dt;

      const S = CONFIG.CELL_SIZE;
      const sx = this.x;
      const sy = this.y;
      const px = player.x;
      const py = player.y;

      const dist = Math.hypot(px - sx, py - sy);
      const angleToPlayer = Math.atan2(py - sy, px - sx);
      let angleDiff = Math.abs(angleToPlayer - this.angle);
      while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);

      const halfAngle = (CONFIG.SENTINEL_VISION_ANGLE * Math.PI) / 360;
      const inCone = dist <= CONFIG.SENTINEL_VISION_RADIUS && angleDiff <= halfAngle;
      const canSee = inCone && MazeGenerator.hasLineOfSight(maze.grid, maze.W, maze.H, S, sx, sy, px, py);

      if (canSee) {
        if (this.state !== 'ALERTING') {
          this.state = 'ALERTING';
          this.alertTimer = 1.8;
          game.showAlert('Cámara detectó intruso. Alarma general', 'danger');
          if (window.ArcadeAudio && window.ArcadeAudio.playTone) {
            window.ArcadeAudio.playTone(880, 'sawtooth', 0.2, 0.25);
          }
          if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(35);
          game.alertAllGuardians(px, py);
        }
      } else if (this.state === 'ALERTING') {
        this.alertTimer -= dt;
        if (this.alertTimer <= 0) {
          this.state = 'SWEEP';
        }
      }
      // CORRECCIÓN: NO se ejecuta game.onPlayerCaught al tocar la base cuando mira hacia otro lado
    }

    render(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);

      let col = '#a855f7';
      if (this.state === 'ALERTING') col = '#ef4444';
      if (this.stunTimer > 0) col = '#64748b';

      // Base octogonal con marcas de advertencia amarillas y negras
      ctx.fillStyle = '#141024';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const bx = Math.cos(a) * (this.radius + 3);
        const by = Math.sin(a) * (this.radius + 3);
        if (i === 0) ctx.moveTo(bx, by);
        else ctx.lineTo(bx, by);
      }
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#eab308'; // Amarillo de advertencia industrial
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Cúpula servomotorizada de la cámara
      ctx.fillStyle = '#22193d';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.75, 0, Math.PI * 2);
      ctx.fill();

      // Cabezal óptico rotatorio
      ctx.rotate(this.angle);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(this.radius * 0.45, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Destello estroboscópico en alerta
      if (this.state === 'ALERTING') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.beginPath();
        ctx.arc(this.radius * 0.45, 0, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    renderVisionCone(maskCtx, camX, camY) {
      if (this.stunTimer > 0) return;
      const screenX = this.x - camX;
      const screenY = this.y - camY;
      const halfAngle = (CONFIG.SENTINEL_VISION_ANGLE * Math.PI) / 360;

      const coneGrad = maskCtx.createRadialGradient(screenX, screenY, this.radius, screenX, screenY, CONFIG.SENTINEL_VISION_RADIUS);
      coneGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
      coneGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.75)');
      coneGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

      maskCtx.fillStyle = coneGrad;
      maskCtx.beginPath();
      maskCtx.moveTo(screenX, screenY);
      maskCtx.arc(screenX, screenY, CONFIG.SENTINEL_VISION_RADIUS, this.angle - halfAngle, this.angle + halfAngle);
      maskCtx.closePath();
      maskCtx.fill();
    }

    renderAtmosphericCone(ctx, camX, camY) {
      if (this.stunTimer > 0) return;
      const screenX = this.x - camX;
      const screenY = this.y - camY;
      const halfAngle = (CONFIG.SENTINEL_VISION_ANGLE * Math.PI) / 360;

      let tint = this.state === 'ALERTING' ? 'rgba(239, 68, 68, 0.32)' : 'rgba(168, 85, 247, 0.18)';
      ctx.save();
      const beamGrad = ctx.createRadialGradient(screenX, screenY, this.radius, screenX, screenY, CONFIG.SENTINEL_VISION_RADIUS);
      beamGrad.addColorStop(0, tint);
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
      ctx.arc(screenX, screenY, CONFIG.SENTINEL_VISION_RADIUS, this.angle - halfAngle, this.angle + halfAngle);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // ============================================================================
  // 4. CLASE PRINCIPAL DEL JUEGO CON PULIDO AUDIOVISUAL
  // ============================================================================
  class SombrasGame {
    constructor() {
      this.canvas = document.getElementById('sombras-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.boardWrapper = document.getElementById('board-wrapper');

      // HUD y Overlays
      this.startHint = document.getElementById('start-hint');
      this.alertBanner = document.getElementById('alert-banner');
      this.overlayPause = document.getElementById('overlay-pause');
      this.overlayGameover = document.getElementById('overlay-gameover');
      this.overlayLevelclear = document.getElementById('overlay-levelclear');

      this.levelDisplay = document.getElementById('level-display');
      this.skinDisplay = document.getElementById('skin-display');
      this.keysDisplay = document.getElementById('keys-display');
      this.stepsDisplay = document.getElementById('steps-display');
      this.livesDisplay = document.getElementById('lives-display');
      this.highscoreDisplay = document.getElementById('highscore-display');
      this.decoysDisplay = document.getElementById('decoys-display');
      this.shieldDisplay = document.getElementById('shield-display');
      this.staminaFill = document.getElementById('stamina-fill');
      this.distractCountBadge = document.getElementById('distract-count-badge');

      // Botones
      this.btnSkinToggle = document.getElementById('btn-skin-toggle');
      this.btnSound = document.getElementById('btn-sound-toggle');
      this.iconSoundOn = document.getElementById('icon-sound-on');
      this.iconSoundOff = document.getElementById('icon-sound-off');
      this.btnPause = document.getElementById('btn-pause-header');
      this.btnRestart = document.getElementById('btn-restart-header');
      this.btnResume = document.getElementById('btn-resume');
      this.btnPauseRestart = document.getElementById('btn-pause-restart');
      this.btnGameoverRestart = document.getElementById('btn-gameover-restart');
      this.btnNextLevel = document.getElementById('btn-next-level');

      // Controles táctiles
      this.joystickZone = document.getElementById('joystick-zone');
      this.joystickBase = document.getElementById('joystick-base');
      this.joystickKnob = document.getElementById('joystick-knob');
      this.btnSprint = document.getElementById('btn-action-sprint');
      this.btnDistract = document.getElementById('btn-action-distract');

      // Lienzos fuera de pantalla
      this.mazeCanvas = document.createElement('canvas');
      this.mazeCtx = this.mazeCanvas.getContext('2d');
      this.lightMaskCanvas = document.createElement('canvas');
      this.lightMaskCtx = this.lightMaskCanvas.getContext('2d');

      // Estado del juego
      this.gameState = 'READY';
      this.level = 1;
      this.score = 0;
      this.steps = 0;
      this.lives = 3;
      this.highScore = window.ArcadeStorage ? window.ArcadeStorage.getHighScore('sombras') : 0;
      this.stepDistanceAccumulator = 0;
      this.currentSkinIndex = 0;

      // Temblor de pantalla y banner
      this.shakeTimer = 0;
      this.shakeIntensity = 0;
      this.bannerTimer = null;

      // Latidos cardíacos de tensión
      this.heartbeatTimer = 0;

      // Laberinto y entidades
      this.maze = null;
      this.fogGrid = null;
      this.keys = [];
      this.keysCollected = 0;
      this.exit = null;
      this.shieldItem = null;
      this.guardians = [];
      this.activeDecoys = [];
      this.acousticRipples = [];

      // Jugador
      this.player = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        angle: 0,
        targetAngle: 0,
        radius: CONFIG.PLAYER_RADIUS,
        isMoving: false,
        isSprinting: false,
        stamina: CONFIG.STAMINA_MAX,
        decoys: 2,
        hasShield: false,
        isInvulnerable: false,
        invulnerableTimer: 0
      };

      this.particles = [];
      this.dustParticles = [];
      this.initDustParticles(30);

      this.camera = { x: 0, y: 0, viewportW: 480, viewportH: 640 };

      this.input = {
        x: 0,
        y: 0,
        keys: { up: false, down: false, left: false, right: false, sprint: false },
        touchId: null,
        touchStartX: 0,
        touchStartY: 0,
        touchActive: false
      };

      this.lastTimestamp = 0;
      this.accumulator = 0;
      this.fixedDelta = 1 / 60;
      this.globalTime = 0;

      this.initEvents();
      this.updateHUD();
      this.resizeCanvas();
      this.generateNewMaze();
      this.requestFrame();
    }

    // ==========================================================================
    // 5. EVENTOS Y CONTROLADORES
    // ==========================================================================
    initEvents() {
      window.addEventListener('resize', () => this.resizeCanvas());
      window.addEventListener('keydown', (e) => this.handleKeyDown(e));
      window.addEventListener('keyup', (e) => this.handleKeyUp(e));

      if (this.joystickZone) {
        this.joystickZone.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.joystickZone.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.joystickZone.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        this.joystickZone.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });
      }

      if (this.btnSprint) {
        const toggleSprintOn = (e) => {
          e.preventDefault();
          this.input.keys.sprint = true;
          this.btnSprint.classList.add('active');
        };
        const toggleSprintOff = (e) => {
          e.preventDefault();
          this.input.keys.sprint = false;
          this.btnSprint.classList.remove('active');
        };
        this.btnSprint.addEventListener('touchstart', toggleSprintOn, { passive: false });
        this.btnSprint.addEventListener('touchend', toggleSprintOff, { passive: false });
        this.btnSprint.addEventListener('mousedown', toggleSprintOn);
        this.btnSprint.addEventListener('mouseup', toggleSprintOff);
      }

      if (this.btnDistract) {
        this.btnDistract.addEventListener('click', (e) => {
          e.preventDefault();
          this.throwDecoy();
        });
      }

      if (this.btnSkinToggle) {
        this.btnSkinToggle.addEventListener('click', () => this.cycleSkin());
      }

      if (this.btnSound) this.btnSound.addEventListener('click', () => this.toggleSound());
      if (this.btnPause) this.btnPause.addEventListener('click', () => this.togglePause());
      if (this.btnRestart) this.btnRestart.addEventListener('click', () => this.restartGame());
      if (this.btnResume) this.btnResume.addEventListener('click', () => this.togglePause());
      if (this.btnPauseRestart) {
        this.btnPauseRestart.addEventListener('click', () => {
          this.togglePause();
          this.restartGame();
        });
      }
      if (this.btnGameoverRestart) this.btnGameoverRestart.addEventListener('click', () => this.restartGame());
      if (this.btnNextLevel) this.btnNextLevel.addEventListener('click', () => this.advanceToNextLevel());

      this.boardWrapper.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    cycleSkin() {
      this.currentSkinIndex = (this.currentSkinIndex + 1) % SKINS.length;
      const skin = SKINS[this.currentSkinIndex];
      this.showAlert(`Traje equipado: ${skin.name}`, 'normal');
      if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(15);
      if (window.ArcadeAudio && window.ArcadeAudio.playTone) {
        window.ArcadeAudio.playTone(580, 'sine', 0.08, 0.12);
      }
      this.updateHUD();
    }

    handleKeyDown(e) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (this.gameState === 'READY') {
        this.startGame();
      }

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.input.keys.up = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.input.keys.down = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.input.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.input.keys.right = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.input.keys.sprint = true;
          if (this.btnSprint) this.btnSprint.classList.add('active');
          break;
        case 'Space':
          this.throwDecoy();
          break;
        case 'KeyC':
          this.cycleSkin();
          break;
        case 'KeyP':
          this.togglePause();
          break;
        case 'KeyR':
          this.restartGame();
          break;
      }
      this.updateKeyboardInputVector();
    }

    handleKeyUp(e) {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.input.keys.up = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.input.keys.down = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.input.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.input.keys.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.input.keys.sprint = false;
          if (this.btnSprint) this.btnSprint.classList.remove('active');
          break;
      }
      this.updateKeyboardInputVector();
    }

    updateKeyboardInputVector() {
      if (!this.input.touchActive) {
        let kx = 0;
        let ky = 0;
        if (this.input.keys.left) kx -= 1;
        if (this.input.keys.right) kx += 1;
        if (this.input.keys.up) ky -= 1;
        if (this.input.keys.down) ky += 1;

        if (kx !== 0 && ky !== 0) {
          const invSqrt = 0.70710678;
          kx *= invSqrt;
          ky *= invSqrt;
        }

        this.input.x = kx;
        this.input.y = ky;
      }
    }

    handleTouchStart(e) {
      e.preventDefault();
      if (this.gameState === 'READY') {
        this.startGame();
      }

      if (this.input.touchId !== null) return;

      const touch = e.changedTouches[0];
      const rect = this.boardWrapper.getBoundingClientRect();

      this.input.touchId = touch.identifier;
      this.input.touchStartX = touch.clientX - rect.left;
      this.input.touchStartY = touch.clientY - rect.top;
      this.input.touchActive = true;

      if (this.joystickBase) {
        this.joystickBase.style.left = `${this.input.touchStartX}px`;
        this.joystickBase.style.top = `${this.input.touchStartY}px`;
        this.joystickBase.classList.remove('hidden');
      }
      if (this.joystickKnob) {
        this.joystickKnob.style.transform = 'translate(-50%, -50%)';
      }

      this.input.x = 0;
      this.input.y = 0;
    }

    handleTouchMove(e) {
      e.preventDefault();
      if (this.input.touchId === null) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.input.touchId) {
          const rect = this.boardWrapper.getBoundingClientRect();
          const curX = touch.clientX - rect.left;
          const curY = touch.clientY - rect.top;

          const dx = curX - this.input.touchStartX;
          const dy = curY - this.input.touchStartY;
          const dist = Math.hypot(dx, dy);

          const maxDist = CONFIG.JOYSTICK_MAX_DIST;
          const clampedDist = Math.min(dist, maxDist);
          const angle = Math.atan2(dy, dx);

          if (this.joystickKnob) {
            const knobX = Math.cos(angle) * clampedDist;
            const knobY = Math.sin(angle) * clampedDist;
            this.joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
          }

          if (dist > CONFIG.JOYSTICK_DEADZONE) {
            const ratio = clampedDist / maxDist;
            this.input.x = Math.cos(angle) * ratio;
            this.input.y = Math.sin(angle) * ratio;
          } else {
            this.input.x = 0;
            this.input.y = 0;
          }
          break;
        }
      }
    }

    handleTouchEnd(e) {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.input.touchId) {
          this.input.touchId = null;
          this.input.touchActive = false;
          this.input.x = 0;
          this.input.y = 0;

          if (this.joystickBase) this.joystickBase.classList.add('hidden');
          if (this.joystickKnob) this.joystickKnob.style.transform = 'translate(-50%, -50%)';

          this.updateKeyboardInputVector();
          break;
        }
      }
    }

    showAlert(message, type = 'normal') {
      if (!this.alertBanner) return;
      this.alertBanner.textContent = message;
      this.alertBanner.className = 'alert-banner';

      if (type === 'danger') this.alertBanner.classList.add('alert-danger');
      else if (type === 'success') this.alertBanner.classList.add('alert-success');
      else if (type === 'warning') this.alertBanner.classList.add('alert-warning');

      clearTimeout(this.bannerTimer);
      this.bannerTimer = setTimeout(() => {
        this.alertBanner.classList.add('hidden');
      }, 2400);
    }

    // ==========================================================================
    // 6. GENERACIÓN DEL SECTOR Y ESCALADO PROGRESIVO
    // ==========================================================================
    generateNewMaze() {
      const cols = CONFIG.BASE_COLS + Math.min(6, (this.level - 1) * 2);
      const rows = CONFIG.BASE_ROWS + Math.min(6, (this.level - 1) * 2);

      this.maze = MazeGenerator.generate(cols, rows, CONFIG.LOOP_RATIO);
      this.fogGrid = Array.from({ length: this.maze.H }, () => new Uint8Array(this.maze.W).fill(0));

      const entities = MazeGenerator.placeEntities(this.maze, this.level);
      const S = CONFIG.CELL_SIZE;

      // Salida
      this.exit = {
        col: entities.exit.x,
        row: entities.exit.y,
        x: (entities.exit.x + 0.5) * S,
        y: (entities.exit.y + 0.5) * S,
        isUnlocked: false
      };

      // 3 Llaves
      this.keysCollected = 0;
      this.keys = entities.keys.map((k, idx) => ({
        id: idx + 1,
        col: k.x,
        row: k.y,
        x: (k.x + 0.5) * S,
        y: (k.y + 0.5) * S,
        collected: false,
        floatOffset: idx * (Math.PI * 2 / 3)
      }));

      // Item Escudo
      if (entities.shieldItem) {
        this.shieldItem = {
          col: entities.shieldItem.x,
          row: entities.shieldItem.y,
          x: (entities.shieldItem.x + 0.5) * S,
          y: (entities.shieldItem.y + 0.5) * S,
          collected: false
        };
      } else {
        this.shieldItem = null;
      }

      this.activeDecoys = [];
      this.acousticRipples = [];

      // GUARDIANES ESCALADOS SEGÚN NIVEL
      this.guardians = [];

      // 1. Patrulleros (1 en nivel 1-2, 2 en nivel 3+)
      const guardWp = entities.patrolWaypoints;
      const initialGuardCell = guardWp[0] || entities.exit;
      this.guardians.push(
        new PatrollerGuardian((initialGuardCell.x + 0.5) * S, (initialGuardCell.y + 0.5) * S, guardWp)
      );
      if (this.level >= 3 && guardWp.length >= 2) {
        const wp2 = guardWp.slice(1).concat(guardWp[0]);
        this.guardians.push(
          new PatrollerGuardian((wp2[0].x + 0.5) * S, (wp2[0].y + 0.5) * S, wp2)
        );
      }

      // 2. Cámaras Centinela (en intersecciones amplias garantizadas)
      for (let i = 0; i < entities.sentinelPositions.length; i++) {
        const sPos = entities.sentinelPositions[i];
        this.guardians.push(
          new SentinelGuardian((sPos.x + 0.5) * S, (sPos.y + 0.5) * S)
        );
      }

      // 3. Cazador (añadido a partir del Sector 2)
      if (this.level >= 2 && entities.hunterPos) {
        this.guardians.push(
          new HunterGuardian(
            (entities.hunterPos.x + 0.5) * S,
            (entities.hunterPos.y + 0.5) * S,
            entities.hunterWaypoints || entities.patrolWaypoints
          )
        );
      }

      // Jugador
      this.player.x = (this.maze.startX + 0.5) * S;
      this.player.y = (this.maze.startY + 0.5) * S;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.angle = Math.PI / 2;
      this.player.targetAngle = Math.PI / 2;
      this.player.isMoving = false;
      this.player.isSprinting = false;
      this.player.stamina = CONFIG.STAMINA_MAX;
      this.player.isInvulnerable = false;
      this.player.invulnerableTimer = 0;

      // Cámara
      this.camera.x = this.player.x - this.camera.viewportW / 2;
      this.camera.y = this.player.y - this.camera.viewportH / 2;

      this.prerenderMaze();
      this.updateVision();
      this.updateHUD();
    }

    prerenderMaze() {
      const worldW = this.maze.W * CONFIG.CELL_SIZE;
      const worldH = this.maze.H * CONFIG.CELL_SIZE;

      this.mazeCanvas.width = worldW;
      this.mazeCanvas.height = worldH;

      const ctx = this.mazeCtx;
      const S = CONFIG.CELL_SIZE;

      ctx.fillStyle = '#0a0814';
      ctx.fillRect(0, 0, worldW, worldH);

      for (let r = 0; r < this.maze.H; r++) {
        for (let c = 0; c < this.maze.W; c++) {
          const x = c * S;
          const y = r * S;

          if (this.maze.grid[r][c] === 0) {
            ctx.fillStyle = '#0f0c1e';
            ctx.fillRect(x + 1, y + 1, S - 2, S - 2);

            ctx.strokeStyle = 'rgba(168, 85, 247, 0.05)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 1, y + 1, S - 2, S - 2);

            ctx.fillStyle = 'rgba(168, 85, 247, 0.08)';
            ctx.fillRect(x + S / 2 - 1, y + S / 2 - 1, 2, 2);
          } else {
            ctx.fillStyle = '#181329';
            ctx.fillRect(x, y, S, S);

            ctx.fillStyle = '#261f3e';
            ctx.fillRect(x + 2, y + 2, S - 4, 4);

            ctx.fillStyle = '#090712';
            ctx.fillRect(x + 2, y + S - 4, S - 4, 3);

            ctx.strokeStyle = 'rgba(168, 85, 247, 0.18)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 1, y + 1, S - 2, S - 2);
          }
        }
      }

      const startPixelX = this.maze.startX * S;
      const startPixelY = this.maze.startY * S;
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(startPixelX + 4, startPixelY + 4, S - 8, S - 8);
    }

    // ==========================================================================
    // 7. MECÁNICAS DE JUEGO: SEÑUELO, ESCUDO Y ALARMA
    // ==========================================================================
    throwDecoy() {
      if (this.player.decoys <= 0 || this.gameState !== 'PLAYING') return;

      this.player.decoys--;
      const p = this.player;
      const S = CONFIG.CELL_SIZE;

      let targetX = p.x + Math.cos(p.angle) * CONFIG.DECOY_MAX_DIST;
      let targetY = p.y + Math.sin(p.angle) * CONFIG.DECOY_MAX_DIST;

      const steps = 30;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const testX = p.x + Math.cos(p.angle) * CONFIG.DECOY_MAX_DIST * t;
        const testY = p.y + Math.sin(p.angle) * CONFIG.DECOY_MAX_DIST * t;
        const col = Math.floor(testX / S);
        const row = Math.floor(testY / S);
        if (col < 0 || col >= this.maze.W || row < 0 || row >= this.maze.H || this.maze.grid[row][col] === 1) {
          targetX = p.x + Math.cos(p.angle) * CONFIG.DECOY_MAX_DIST * ((i - 1) / steps);
          targetY = p.y + Math.sin(p.angle) * CONFIG.DECOY_MAX_DIST * ((i - 1) / steps);
          break;
        }
      }

      this.activeDecoys.push({
        x: p.x,
        y: p.y,
        targetX,
        targetY,
        angle: p.angle,
        speed: CONFIG.DECOY_THROW_SPEED
      });

      if (window.ArcadeAudio && window.ArcadeAudio.playTone) {
        window.ArcadeAudio.playTone(800, 'triangle', 0.05, 0.1);
      }
      if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(15);

      this.showAlert(`Señuelo lanzado (${this.player.decoys} restantes)`, 'warning');
      this.updateHUD();
    }

    onDecoyLand(decoyX, decoyY) {
      if (window.ArcadeAudio && window.ArcadeAudio.playTone) {
        window.ArcadeAudio.playTone(320, 'square', 0.12, 0.2);
        setTimeout(() => window.ArcadeAudio.playTone(200, 'square', 0.15, 0.15), 50);
      }
      if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(25);

      this.acousticRipples.push({
        x: decoyX,
        y: decoyY,
        radius: 10,
        maxRadius: CONFIG.DECOY_NOISE_RADIUS,
        alpha: 0.9,
        color: '#38bdf8'
      });

      const S = CONFIG.CELL_SIZE;
      for (let i = 0; i < this.guardians.length; i++) {
        const g = this.guardians[i];
        const dist = Math.hypot(g.x - decoyX, g.y - decoyY);
        if (dist <= CONFIG.DECOY_NOISE_RADIUS) {
          g.onHeardNoise(decoyX, decoyY, this.maze, S);
        }
      }
    }

    alertAllGuardians(alertX, alertY) {
      const S = CONFIG.CELL_SIZE;
      for (let i = 0; i < this.guardians.length; i++) {
        const g = this.guardians[i];
        if (g.type !== 'SENTINEL') {
          g.state = 'CHASING';
          g.lastKnownPlayerPos = { x: alertX, y: alertY };
          const curCell = { x: Math.floor(g.x / S), y: Math.floor(g.y / S) };
          const targetCell = { x: Math.floor(alertX / S), y: Math.floor(alertY / S) };
          g.path = MazeGenerator.findPathBFS(this.maze.grid, this.maze.W, this.maze.H, curCell, targetCell) || [];
          g.pathIndex = 0;
        }
      }
    }

    onPlayerCaught(guardian) {
      if (this.player.isInvulnerable) return;

      if (this.player.hasShield) {
        this.player.hasShield = false;
        guardian.stun(2.0);

        this.shakeTimer = 0.3;
        this.shakeIntensity = 6;
        this.player.isInvulnerable = true;
        this.player.invulnerableTimer = 1.5;

        if (window.ArcadeAudio && window.ArcadeAudio.playTone) {
          window.ArcadeAudio.playTone(920, 'sine', 0.2, 0.3);
        }
        if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(50);

        this.spawnParticles(this.player.x, this.player.y, '#38bdf8', 25);
        this.showAlert('Escudo absorbió el impacto. Guardián aturdido', 'success');
        this.updateHUD();
        return;
      }

      this.lives--;
      this.shakeTimer = 0.35;
      this.shakeIntensity = 8;

      if (window.ArcadeAudio && window.ArcadeAudio.playTone) {
        window.ArcadeAudio.playTone(120, 'sawtooth', 0.25, 0.3);
      }
      if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(45);

      this.updateHUD();

      if (this.lives > 0) {
        this.showAlert(`Detectado. -1 vida (${this.lives} restantes)`, 'danger');
        const S = CONFIG.CELL_SIZE;
        this.player.x = (this.maze.startX + 0.5) * S;
        this.player.y = (this.maze.startY + 0.5) * S;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.isInvulnerable = true;
        this.player.invulnerableTimer = CONFIG.INVULNERABLE_TIME;

        for (let i = 0; i < this.guardians.length; i++) {
          const g = this.guardians[i];
          if (g.type === 'PATROLLER') {
            g.state = 'PATROL';
            g.hasAlerted = false;
            g.initNextPatrolPath(this.maze, S);
          } else if (g.type === 'HUNTER') {
            g.resetToSpawn(this.maze, S);
          }
        }
      } else {
        this.gameOver();
      }
    }

    // ==========================================================================
    // 8. FÍSICA Y LATIDO CARDÍACO DE TENSIÓN
    // ==========================================================================
    updatePhysics(dt) {
      if (this.gameState !== 'PLAYING') return;

      this.globalTime += dt;
      const p = this.player;
      const S = CONFIG.CELL_SIZE;

      if (p.isInvulnerable) {
        p.invulnerableTimer -= dt;
        if (p.invulnerableTimer <= 0) p.isInvulnerable = false;
      }

      if (this.shakeTimer > 0) this.shakeTimer -= dt;

      // Sprint y Resistencia (Stamina)
      const isInputActive = Math.hypot(this.input.x, this.input.y) > 0.05;
      const wantsSprint = this.input.keys.sprint && isInputActive && p.stamina > 5;

      if (wantsSprint) {
        p.isSprinting = true;
        p.stamina = Math.max(0, p.stamina - CONFIG.STAMINA_DRAIN * dt);
      } else {
        p.isSprinting = false;
        p.stamina = Math.min(CONFIG.STAMINA_MAX, p.stamina + CONFIG.STAMINA_RECOVER * dt);
      }

      const speed = p.isSprinting ? CONFIG.PLAYER_SPEED_SPRINT : CONFIG.PLAYER_SPEED_WALK;
      const inputMag = Math.hypot(this.input.x, this.input.y);

      if (isInputActive) {
        p.isMoving = true;
        p.targetAngle = Math.atan2(this.input.y, this.input.x);
        let diff = p.targetAngle - p.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        p.angle += diff * Math.min(1.0, CONFIG.PLAYER_ROT_SPEED * dt);

        p.vx = Math.cos(p.targetAngle) * speed * inputMag;
        p.vy = Math.sin(p.targetAngle) * speed * inputMag;
      } else {
        p.isMoving = false;
        p.vx = 0;
        p.vy = 0;
      }

      const r = p.radius;
      const nextX = p.x + p.vx * dt;
      if (!this.checkWallCollision(nextX, p.y, r)) p.x = nextX;
      else p.vx = 0;

      const nextY = p.y + p.vy * dt;
      if (!this.checkWallCollision(p.x, nextY, r)) p.y = nextY;
      else p.vy = 0;

      // Ondas acústicas de sprint
      if (p.isMoving && p.isSprinting) {
        if (Math.floor(this.globalTime * 8) % 3 === 0) {
          const skin = SKINS[this.currentSkinIndex];
          this.acousticRipples.push({
            x: p.x,
            y: p.y,
            radius: 8,
            maxRadius: CONFIG.NOISE_RADIUS_SPRINT,
            alpha: 0.6,
            color: skin.accent
          });
        }

        for (let i = 0; i < this.guardians.length; i++) {
          const g = this.guardians[i];
          const dist = Math.hypot(g.x - p.x, g.y - p.y);
          const threshold = g.type === 'HUNTER'
            ? CONFIG.NOISE_RADIUS_SPRINT * CONFIG.HUNTER_HEARING_MULT
            : CONFIG.NOISE_RADIUS_SPRINT;

          if (dist <= threshold) {
            g.onHeardNoise(p.x, p.y, this.maze, S);
          }
        }
      }

      // Contador de pasos
      if (p.isMoving) {
        const movedDist = Math.hypot(p.vx * dt, p.vy * dt);
        this.stepDistanceAccumulator += movedDist;
        if (this.stepDistanceAccumulator >= S * 0.75) {
          this.stepDistanceAccumulator -= S * 0.75;
          this.steps++;
          this.stepsDisplay.textContent = this.steps;
          if (window.ArcadeAudio && window.ArcadeAudio.playTone) {
            const pitch = p.isSprinting ? 240 : 180;
            window.ArcadeAudio.playTone(pitch, 'sine', 0.02, 0.025);
          }
        }
      }

      // Latidos cardíacos si hay peligro inminente (guardián cercano o en persecución)
      this.updateHeartbeat(dt);

      this.updateDecoys(dt);
      this.updateAcousticRipples(dt);
      this.checkKeyCollection();
      this.checkShieldCollection();
      this.checkExitReached();

      for (let i = 0; i < this.guardians.length; i++) {
        this.guardians[i].update(dt, p, this.maze, this);
      }

      this.updateVision();

      const targetCamX = p.x - this.camera.viewportW / 2;
      const targetCamY = p.y - this.camera.viewportH / 2;
      this.camera.x += (targetCamX - this.camera.x) * CONFIG.CAMERA_LERP;
      this.camera.y += (targetCamY - this.camera.y) * CONFIG.CAMERA_LERP;

      this.updateParticles(dt);
      this.updateDustParticles(dt);
      this.updateHUD();
    }

    updateHeartbeat(dt) {
      let closestDangerDist = Infinity;
      let hasChasingGuard = false;

      for (let i = 0; i < this.guardians.length; i++) {
        const g = this.guardians[i];
        const dist = Math.hypot(g.x - this.player.x, g.y - this.player.y);
        if (dist < closestDangerDist) closestDangerDist = dist;
        if (g.state === 'CHASING') hasChasingGuard = true;
      }

      // Tensión si hay guardián a menos de 150px o en persecución
      if (closestDangerDist < 150 || hasChasingGuard) {
        const beatInterval = hasChasingGuard ? 0.45 : Math.max(0.6, (closestDangerDist / 150) * 1.1);
        this.heartbeatTimer += dt;
        if (this.heartbeatTimer >= beatInterval) {
          this.heartbeatTimer = 0;
          if (window.ArcadeAudio && window.ArcadeAudio.playTone) {
            window.ArcadeAudio.playTone(85, 'sine', 0.08, 0.08);
            setTimeout(() => {
              if (window.ArcadeAudio && window.ArcadeAudio.playTone) {
                window.ArcadeAudio.playTone(70, 'sine', 0.1, 0.06);
              }
            }, 120);
          }
        }
      } else {
        this.heartbeatTimer = 0;
      }
    }

    updateDecoys(dt) {
      for (let i = this.activeDecoys.length - 1; i >= 0; i--) {
        const d = this.activeDecoys[i];
        const dx = d.targetX - d.x;
        const dy = d.targetY - d.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= d.speed * dt) {
          d.x = d.targetX;
          d.y = d.targetY;
          this.onDecoyLand(d.x, d.y);
          this.activeDecoys.splice(i, 1);
        } else {
          d.x += Math.cos(d.angle) * d.speed * dt;
          d.y += Math.sin(d.angle) * d.speed * dt;
        }
      }
    }

    updateAcousticRipples(dt) {
      for (let i = this.acousticRipples.length - 1; i >= 0; i--) {
        const rip = this.acousticRipples[i];
        rip.radius += 180 * dt;
        rip.alpha = Math.max(0, 1.0 - (rip.radius / rip.maxRadius));
        if (rip.radius >= rip.maxRadius || rip.alpha <= 0) {
          this.acousticRipples.splice(i, 1);
        }
      }
    }

    checkWallCollision(x, y, radius) {
      const S = CONFIG.CELL_SIZE;
      const minCol = Math.floor((x - radius) / S);
      const maxCol = Math.floor((x + radius) / S);
      const minRow = Math.floor((y - radius) / S);
      const maxRow = Math.floor((y + radius) / S);

      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          if (row < 0 || row >= this.maze.H || col < 0 || col >= this.maze.W || this.maze.grid[row][col] === 1) {
            const wallLeft = col * S;
            const wallRight = (col + 1) * S;
            const wallTop = row * S;
            const wallBottom = (row + 1) * S;
            const closestX = Math.max(wallLeft, Math.min(x, wallRight));
            const closestY = Math.max(wallTop, Math.min(y, wallBottom));
            const distSq = (x - closestX) * (x - closestX) + (y - closestY) * (y - closestY);
            if (distSq < radius * radius) return true;
          }
        }
      }
      return false;
    }

    checkKeyCollection() {
      const p = this.player;
      for (let i = 0; i < this.keys.length; i++) {
        const k = this.keys[i];
        if (!k.collected) {
          const dist = Math.hypot(p.x - k.x, p.y - k.y);
          if (dist < p.radius + 14) {
            k.collected = true;
            this.keysCollected++;
            this.score += 250;

            if (window.ArcadeAudio && window.ArcadeAudio.playTone) {
              window.ArcadeAudio.playTone(600, 'triangle', 0.08, 0.15);
              setTimeout(() => window.ArcadeAudio.playTone(900, 'triangle', 0.1, 0.15), 60);
              setTimeout(() => window.ArcadeAudio.playTone(1200, 'sine', 0.14, 0.18), 120);
            }
            if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(20);

            this.spawnParticles(k.x, k.y, '#fbbf24', 20);
            this.updateHUD();

            if (this.keysCollected < 3) {
              this.showAlert(`Llave [${this.keysCollected}/3] obtenida`, 'warning');
            } else {
              this.exit.isUnlocked = true;
              this.showAlert('Salida desbloqueada. Llega al portal', 'success');
              if (window.ArcadeAudio && window.ArcadeAudio.playTone) {
                setTimeout(() => window.ArcadeAudio.playTone(523, 'sine', 0.2, 0.2), 200);
                setTimeout(() => window.ArcadeAudio.playTone(659, 'sine', 0.2, 0.2), 350);
                setTimeout(() => window.ArcadeAudio.playTone(784, 'sine', 0.3, 0.25), 500);
              }
            }
          }
        }
      }
    }

    checkShieldCollection() {
      if (!this.shieldItem || this.shieldItem.collected) return;
      const p = this.player;
      const dist = Math.hypot(p.x - this.shieldItem.x, p.y - this.shieldItem.y);

      if (dist < p.radius + 14) {
        this.shieldItem.collected = true;
        this.player.hasShield = true;
        this.score += 150;

        if (window.ArcadeAudio && window.ArcadeAudio.playTone) {
          window.ArcadeAudio.playTone(440, 'triangle', 0.1, 0.15);
          setTimeout(() => window.ArcadeAudio.playTone(880, 'sine', 0.15, 0.2), 80);
        }
        if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(25);

        this.spawnParticles(this.shieldItem.x, this.shieldItem.y, '#38bdf8', 25);
        this.showAlert('Escudo de energía equipado', 'success');
        this.updateHUD();
      }
    }

    checkExitReached() {
      if (!this.exit || !this.exit.isUnlocked) return;
      const p = this.player;
      if (Math.hypot(p.x - this.exit.x, p.y - this.exit.y) < p.radius + 16) {
        this.levelCompleted();
      }
    }

    levelCompleted() {
      this.gameState = 'LEVELCLEAR';
      const levelBonus = 1000 + (this.lives * 300) - Math.min(400, this.steps * 2);
      this.score += Math.max(500, levelBonus);

      if (window.ArcadeStorage && this.score > this.highScore) {
        this.highScore = this.score;
        window.ArcadeStorage.setHighScore('sombras', this.highScore);
      }

      if (window.ArcadeAudio && window.ArcadeAudio.playTone) {
        [523, 659, 784, 1046].forEach((freq, idx) => {
          setTimeout(() => window.ArcadeAudio.playTone(freq, 'triangle', 0.15, 0.2), idx * 100);
        });
      }

      const clearLevelEl = document.getElementById('clear-level');
      const clearStepsEl = document.getElementById('clear-steps');
      const clearScoreEl = document.getElementById('clear-score');
      if (clearLevelEl) clearLevelEl.textContent = this.level;
      if (clearStepsEl) clearStepsEl.textContent = this.steps;
      if (clearScoreEl) clearScoreEl.textContent = this.score;

      if (this.overlayLevelclear) this.overlayLevelclear.classList.remove('hidden');
    }

    advanceToNextLevel() {
      if (this.overlayLevelclear) this.overlayLevelclear.classList.add('hidden');
      this.level++;
      this.player.decoys = Math.min(3, this.player.decoys + 1);
      this.gameState = 'PLAYING';
      this.generateNewMaze();
      this.showAlert(`SECTOR ${this.level} - RECOGE LAS 3 LLAVES`, 'normal');
    }

    gameOver() {
      this.gameState = 'GAMEOVER';
      if (window.ArcadeStorage && this.score > this.highScore) {
        this.highScore = this.score;
        window.ArcadeStorage.setHighScore('sombras', this.highScore);
        const newRecordTag = document.getElementById('new-record-tag');
        if (newRecordTag) newRecordTag.classList.remove('hidden');
      }

      const finalScoreEl = document.getElementById('final-score');
      const finalLevelEl = document.getElementById('final-level');
      const finalHighscoreEl = document.getElementById('final-highscore');
      if (finalScoreEl) finalScoreEl.textContent = this.score;
      if (finalLevelEl) finalLevelEl.textContent = this.level;
      if (finalHighscoreEl) finalHighscoreEl.textContent = this.highScore;

      if (this.overlayGameover) this.overlayGameover.classList.remove('hidden');

      if (window.ArcadeAudio && window.ArcadeAudio.playTone) {
        [280, 220, 160, 100].forEach((freq, idx) => {
          setTimeout(() => window.ArcadeAudio.playTone(freq, 'sawtooth', 0.2, 0.25), idx * 120);
        });
      }
    }

    // ==========================================================================
    // 9. VISIÓN Y NIEBLA
    // ==========================================================================
    updateVision() {
      if (!this.maze || !this.fogGrid) return;
      const S = CONFIG.CELL_SIZE;
      const p = this.player;
      const flashRadius = CONFIG.FLASHLIGHT_RADIUS;
      const ambientRadius = CONFIG.AMBIENT_RADIUS;
      const halfAngle = (CONFIG.FLASHLIGHT_ANGLE * Math.PI) / 360;

      const minCol = Math.max(0, Math.floor((p.x - flashRadius) / S));
      const maxCol = Math.min(this.maze.W - 1, Math.floor((p.x + flashRadius) / S));
      const minRow = Math.max(0, Math.floor((p.y - flashRadius) / S));
      const maxRow = Math.min(this.maze.H - 1, Math.floor((p.y + flashRadius) / S));

      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          const cellCenterX = (c + 0.5) * S;
          const cellCenterY = (r + 0.5) * S;
          const dx = cellCenterX - p.x;
          const dy = cellCenterY - p.y;
          const dist = Math.hypot(dx, dy);

          if (dist <= ambientRadius + S * 0.4) {
            this.fogGrid[r][c] = 1;
            continue;
          }

          if (dist <= flashRadius + S * 0.3) {
            const angleToCell = Math.atan2(dy, dx);
            let angleDiff = Math.abs(angleToCell - p.angle);
            while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);
            if (angleDiff <= halfAngle + 0.25) {
              this.fogGrid[r][c] = 1;
            }
          }
        }
      }
    }

    // ==========================================================================
    // 10. RENDERIZADO VISUAL CON "MONITOS CHIDOS"
    // ==========================================================================
    render() {
      const ctx = this.ctx;
      const vw = this.camera.viewportW;
      const vh = this.camera.viewportH;
      let camX = this.camera.x;
      let camY = this.camera.y;

      if (this.shakeTimer > 0) {
        camX += (Math.random() - 0.5) * this.shakeIntensity;
        camY += (Math.random() - 0.5) * this.shakeIntensity;
      }

      ctx.fillStyle = '#06040a';
      ctx.fillRect(0, 0, vw, vh);

      ctx.save();
      ctx.translate(-camX, -camY);

      ctx.drawImage(this.mazeCanvas, 0, 0);

      this.renderAcousticRipples(ctx);
      this.renderExit(ctx);
      this.renderKeys(ctx);
      this.renderShieldItem(ctx);
      this.renderDecoys(ctx);

      // Renderizar al Agente con la Skin seleccionada
      this.renderPlayer(ctx);

      for (let i = 0; i < this.guardians.length; i++) {
        this.guardians[i].render(ctx);
      }

      for (let i = 0; i < this.particles.length; i++) {
        const pt = this.particles[i];
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      ctx.restore();

      this.renderDarknessMask(vw, vh, camX, camY);
      this.renderAtmosphere(ctx, vw, vh, camX, camY);
    }

    renderPlayer(ctx) {
      const p = this.player;
      if (p.isInvulnerable && Math.floor(this.globalTime * 12) % 2 === 0) return;

      const skin = SKINS[this.currentSkinIndex];
      const time = this.globalTime;

      ctx.save();
      ctx.translate(p.x, p.y);

      // Efecto de Escudo holográfico orbitando
      if (p.hasShield) {
        ctx.save();
        ctx.rotate(time * 2);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const sx = Math.cos(a) * (p.radius + 8);
          const sy = Math.sin(a) * (p.radius + 8);
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        for (let i = 0; i < 3; i++) {
          const a = (i * Math.PI * 2) / 3 + time * 3;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * (p.radius + 8), Math.sin(a) * (p.radius + 8), 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.rotate(p.angle);

      // Sombra táctica proyectada
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(-2, 3, p.radius, p.radius * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Aura de neón del traje
      const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, p.radius + 7);
      aura.addColorStop(0, skin.glow);
      aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 7, 0, Math.PI * 2);
      ctx.fill();

      // Mochila táctica / propulsor con micro-LEDs de resistencia (Stamina)
      ctx.fillStyle = '#0b0814';
      ctx.fillRect(-p.radius - 2, -4.5, 3.5, 9);

      // 3 Micro-LEDs de batería en la espalda
      const staminaPct = p.stamina / CONFIG.STAMINA_MAX;
      for (let i = 0; i < 3; i++) {
        const ledOn = staminaPct > (i * 0.33);
        ctx.fillStyle = ledOn ? skin.accent : '#334155';
        ctx.fillRect(-p.radius - 1.5, -3 + i * 2.5, 2, 1.8);
      }

      // Chaleco táctico / hombreras
      ctx.fillStyle = skin.armor;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.radius + 1, p.radius * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cuerpo del agente
      ctx.fillStyle = skin.body;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = skin.accent;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Linterna táctica montada en el hombro
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(p.radius * 0.2, -p.radius + 1, 4, 3);

      // Visor curvado de alta tecnología
      ctx.fillStyle = skin.visor;
      ctx.beginPath();
      ctx.arc(p.radius * 0.35, 0, 4.2, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.fill();

      ctx.restore();
    }

    renderAcousticRipples(ctx) {
      for (let i = 0; i < this.acousticRipples.length; i++) {
        const rip = this.acousticRipples[i];
        ctx.strokeStyle = rip.color;
        ctx.globalAlpha = rip.alpha;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    }

    renderDecoys(ctx) {
      for (let i = 0; i < this.activeDecoys.length; i++) {
        const d = this.activeDecoys[i];
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(d.x, d.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    renderShieldItem(ctx) {
      if (!this.shieldItem || this.shieldItem.collected) return;
      const sh = this.shieldItem;
      if (!this.fogGrid || this.fogGrid[sh.row][sh.col] !== 1) return;

      const time = this.globalTime;
      const floatY = sh.y + Math.sin(time * 3) * 3;

      ctx.save();
      ctx.translate(sh.x, floatY);

      const halo = ctx.createRadialGradient(0, 0, 2, 0, 0, 14);
      halo.addColorStop(0, 'rgba(56, 189, 248, 0.6)');
      halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    renderKeys(ctx) {
      const time = this.globalTime;
      for (let i = 0; i < this.keys.length; i++) {
        const k = this.keys[i];
        if (k.collected) continue;
        if (!this.fogGrid || this.fogGrid[k.row][k.col] !== 1) continue;

        const floatY = k.y + Math.sin(time * 3.5 + k.floatOffset) * 4;
        ctx.save();
        ctx.translate(k.x, floatY);

        const halo = ctx.createRadialGradient(0, 0, 2, 0, 0, 14);
        halo.addColorStop(0, 'rgba(251, 191, 36, 0.6)');
        halo.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -3, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.lineTo(0, 8);
        ctx.lineTo(3, 8);
        ctx.moveTo(0, 5);
        ctx.lineTo(2, 5);
        ctx.stroke();
        ctx.restore();
      }
    }

    renderExit(ctx) {
      if (!this.exit) return;
      const ex = this.exit;
      if (!this.fogGrid || this.fogGrid[ex.row][ex.col] !== 1) return;

      const S = CONFIG.CELL_SIZE;
      const time = this.globalTime;
      ctx.save();
      ctx.translate(ex.x, ex.y);

      if (ex.isUnlocked) {
        const portal = ctx.createRadialGradient(0, 0, 2, 0, 0, S * 0.45);
        portal.addColorStop(0, '#a7f3d0');
        portal.addColorStop(0.5, '#34d399');
        portal.addColorStop(0.85, '#059669');
        portal.addColorStop(1, 'rgba(5, 150, 105, 0)');

        ctx.fillStyle = portal;
        ctx.beginPath();
        ctx.arc(0, 0, S * 0.45, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 10 + Math.sin(time * 5) * 3, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('EXIT', 0, 0);
      } else {
        ctx.fillStyle = '#1c152e';
        ctx.fillRect(-S * 0.35, -S * 0.35, S * 0.7, S * 0.7);

        ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-S * 0.35, -S * 0.35, S * 0.7, S * 0.7);

        ctx.fillStyle = '#a855f7';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${this.keysCollected}/3`, 0, 0);
      }
      ctx.restore();
    }

    renderDarknessMask(vw, vh, camX, camY) {
      const maskCanvas = this.lightMaskCanvas;
      const maskCtx = this.lightMaskCtx;

      if (maskCanvas.width !== vw || maskCanvas.height !== vh) {
        maskCanvas.width = vw;
        maskCanvas.height = vh;
      }

      maskCtx.clearRect(0, 0, vw, vh);
      maskCtx.fillStyle = '#06040a';
      maskCtx.fillRect(0, 0, vw, vh);

      const S = CONFIG.CELL_SIZE;
      const p = this.player;

      maskCtx.globalCompositeOperation = 'destination-out';
      maskCtx.fillStyle = `rgba(0, 0, 0, ${1.0 - CONFIG.FOG_EXPLORED_ALPHA})`;

      const minCol = Math.max(0, Math.floor(camX / S));
      const maxCol = Math.min(this.maze.W - 1, Math.floor((camX + vw) / S));
      const minRow = Math.max(0, Math.floor(camY / S));
      const maxRow = Math.min(this.maze.H - 1, Math.floor((camY + vh) / S));

      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          if (this.fogGrid[r][c] === 1) {
            maskCtx.fillRect(c * S - camX, r * S - camY, S, S);
          }
        }
      }

      const screenPlayerX = p.x - camX;
      const screenPlayerY = p.y - camY;

      // Luz ambiental
      const ambGrad = maskCtx.createRadialGradient(
        screenPlayerX, screenPlayerY, p.radius,
        screenPlayerX, screenPlayerY, CONFIG.AMBIENT_RADIUS
      );
      ambGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
      ambGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.85)');
      ambGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

      maskCtx.fillStyle = ambGrad;
      maskCtx.beginPath();
      maskCtx.arc(screenPlayerX, screenPlayerY, CONFIG.AMBIENT_RADIUS, 0, Math.PI * 2);
      maskCtx.fill();

      // Haz linterna
      const halfAngle = (CONFIG.FLASHLIGHT_ANGLE * Math.PI) / 360;
      const flashGrad = maskCtx.createRadialGradient(
        screenPlayerX, screenPlayerY, p.radius,
        screenPlayerX, screenPlayerY, CONFIG.FLASHLIGHT_RADIUS
      );
      flashGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
      flashGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.85)');
      flashGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

      maskCtx.fillStyle = flashGrad;
      maskCtx.beginPath();
      maskCtx.moveTo(screenPlayerX, screenPlayerY);
      maskCtx.arc(screenPlayerX, screenPlayerY, CONFIG.FLASHLIGHT_RADIUS, p.angle - halfAngle, p.angle + halfAngle);
      maskCtx.closePath();
      maskCtx.fill();

      // Conos de guardianes
      for (let i = 0; i < this.guardians.length; i++) {
        this.guardians[i].renderVisionCone(maskCtx, camX, camY);
      }

      maskCtx.globalCompositeOperation = 'source-over';
      this.ctx.drawImage(maskCanvas, 0, 0);
    }

    renderAtmosphere(ctx, vw, vh, camX, camY) {
      const p = this.player;
      const screenPlayerX = p.x - camX;
      const screenPlayerY = p.y - camY;
      const halfAngle = (CONFIG.FLASHLIGHT_ANGLE * Math.PI) / 360;
      const skin = SKINS[this.currentSkinIndex];

      ctx.save();
      const beamGrad = ctx.createRadialGradient(
        screenPlayerX, screenPlayerY, 5,
        screenPlayerX, screenPlayerY, CONFIG.FLASHLIGHT_RADIUS
      );
      beamGrad.addColorStop(0, skin.lightTint);
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(screenPlayerX, screenPlayerY);
      ctx.arc(screenPlayerX, screenPlayerY, CONFIG.FLASHLIGHT_RADIUS, p.angle - halfAngle, p.angle + halfAngle);
      ctx.closePath();
      ctx.fill();

      for (let i = 0; i < this.guardians.length; i++) {
        this.guardians[i].renderAtmosphericCone(ctx, camX, camY);
      }

      ctx.fillStyle = 'rgba(216, 180, 254, 0.25)';
      for (let i = 0; i < this.dustParticles.length; i++) {
        const pt = this.dustParticles[i];
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    initDustParticles(count) {
      this.dustParticles = [];
      for (let i = 0; i < count; i++) {
        this.dustParticles.push({
          x: Math.random() * 300,
          y: Math.random() * 300,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          size: Math.random() * 1.6 + 0.6,
          alpha: Math.random() * 0.4 + 0.1
        });
      }
    }

    spawnParticles(x, y, color, count = 12) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 60 + 20;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          alpha: 1.0,
          life: Math.random() * 0.4 + 0.3,
          maxLife: 0.5,
          size: Math.random() * 3 + 2
        });
      }
    }

    updateParticles(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
        pt.alpha = Math.max(0, pt.life / pt.maxLife);
        if (pt.life <= 0) this.particles.splice(i, 1);
      }
    }

    updateDustParticles(dt) {
      for (let i = 0; i < this.dustParticles.length; i++) {
        const pt = this.dustParticles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        if (pt.x < 0) pt.x += this.camera.viewportW;
        if (pt.x > this.camera.viewportW) pt.x -= this.camera.viewportW;
        if (pt.y < 0) pt.y += this.camera.viewportH;
        if (pt.y > this.camera.viewportH) pt.y -= this.camera.viewportH;
      }
    }

    // ==========================================================================
    // 11. GESTIÓN DE ESTADO Y HUD
    // ==========================================================================
    startGame() {
      if (this.gameState === 'READY') {
        this.gameState = 'PLAYING';
        if (this.startHint) this.startHint.classList.add('hidden');
        if (window.ArcadeAudio && window.ArcadeAudio.initCtx) window.ArcadeAudio.initCtx();
      }
    }

    togglePause() {
      if (this.gameState === 'PLAYING') {
        this.gameState = 'PAUSED';
        if (this.overlayPause) this.overlayPause.classList.remove('hidden');
      } else if (this.gameState === 'PAUSED') {
        this.gameState = 'PLAYING';
        if (this.overlayPause) this.overlayPause.classList.add('hidden');
      }
    }

    restartGame() {
      this.steps = 0;
      this.stepDistanceAccumulator = 0;
      this.level = 1;
      this.score = 0;
      this.lives = 3;
      this.player.decoys = 2;
      this.player.hasShield = false;
      this.player.stamina = CONFIG.STAMINA_MAX;
      this.gameState = 'PLAYING';

      if (this.startHint) this.startHint.classList.add('hidden');
      if (this.overlayPause) this.overlayPause.classList.add('hidden');
      if (this.overlayGameover) this.overlayGameover.classList.add('hidden');
      if (this.overlayLevelclear) this.overlayLevelclear.classList.add('hidden');

      this.updateHUD();
      this.generateNewMaze();
      this.showAlert('SECTOR 1 - RECOGE LAS 3 LLAVES', 'normal');
    }

    toggleSound() {
      if (!window.ArcadeAudio) return;
      const isMuted = window.ArcadeAudio.toggleMute();
      if (this.iconSoundOn && this.iconSoundOff) {
        if (isMuted) {
          this.iconSoundOn.classList.add('hidden');
          this.iconSoundOff.classList.remove('hidden');
        } else {
          this.iconSoundOn.classList.remove('hidden');
          this.iconSoundOff.classList.add('hidden');
        }
      }
    }

    updateHUD() {
      if (this.levelDisplay) this.levelDisplay.textContent = this.level;
      if (this.skinDisplay) {
        const skin = SKINS[this.currentSkinIndex];
        this.skinDisplay.textContent = skin.name;
        this.skinDisplay.style.color = skin.accent;
      }
      if (this.keysDisplay) {
        this.keysDisplay.textContent = `${this.keysCollected} / 3`;
        if (this.keysCollected === 3) this.keysDisplay.textContent = '3/3 (EXIT)';
      }
      if (this.stepsDisplay) this.stepsDisplay.textContent = this.steps;
      if (this.livesDisplay) {
        if (window.ArcadeIcons) {
          let html = '';
          const maxLives = 3;
          for (let i = 0; i < maxLives; i++) {
            html += window.ArcadeIcons.get('heart', {
              size: 16,
              color: i < this.lives ? '#f43f5e' : 'rgba(255, 255, 255, 0.2)'
            });
          }
          this.livesDisplay.innerHTML = html;
        } else {
          this.livesDisplay.textContent = `${this.lives}/3`;
        }
      }
      if (this.highscoreDisplay) this.highscoreDisplay.textContent = this.highScore;

      if (this.staminaFill) {
        const staminaPct = Math.max(0, Math.min(100, (this.player.stamina / CONFIG.STAMINA_MAX) * 100));
        this.staminaFill.style.width = `${staminaPct}%`;
        if (staminaPct <= 10) this.staminaFill.classList.add('exhausted');
        else this.staminaFill.classList.remove('exhausted');
      }

      if (this.decoysDisplay) this.decoysDisplay.textContent = this.player.decoys;
      if (this.distractCountBadge) this.distractCountBadge.textContent = this.player.decoys;

      if (this.shieldDisplay) {
        if (this.player.hasShield) {
          this.shieldDisplay.textContent = 'ACTIVO';
          this.shieldDisplay.className = 'stat-value val-shield active';
        } else {
          this.shieldDisplay.textContent = 'INACTIVO';
          this.shieldDisplay.className = 'stat-value val-shield';
        }
      }

      if (window.ArcadeAudio && this.iconSoundOn && this.iconSoundOff) {
        if (window.ArcadeAudio.isMuted) {
          this.iconSoundOn.classList.add('hidden');
          this.iconSoundOff.classList.remove('hidden');
        } else {
          this.iconSoundOn.classList.remove('hidden');
          this.iconSoundOff.classList.add('hidden');
        }
      }
    }

    resizeCanvas() {
      if (!this.canvas || !this.boardWrapper) return;
      const fit = window.ArcadeCanvas ? window.ArcadeCanvas.fit(this.canvas, this.boardWrapper, 3, 4, 4) : {
        width: this.boardWrapper.clientWidth || 360,
        height: this.boardWrapper.clientHeight || 480
      };
      this.camera.viewportW = fit.width;
      this.camera.viewportH = fit.height;
      if (this.maze) this.render();
    }

    requestFrame() {
      const loop = (timestamp) => {
        if (!this.lastTimestamp) this.lastTimestamp = timestamp;
        let delta = (timestamp - this.lastTimestamp) / 1000;
        this.lastTimestamp = timestamp;

        if (delta > 0.1) delta = 0.1;
        this.accumulator += delta;
        while (this.accumulator >= this.fixedDelta) {
          this.updatePhysics(this.fixedDelta);
          this.accumulator -= this.fixedDelta;
        }

        this.render();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.sombrasGame = new SombrasGame();
  });
})();
