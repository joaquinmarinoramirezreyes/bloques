/**
 * games/gotas/game.js - Gotas Arcade 90 (Edición Maestra de Calidad y Animación)
 * Puzzle de gotas líquidas con expresiones faciales reactivas, deformación elástica,
 * fusión de fluidos (puentes entre vecinas), ondulación en reposo, desacoplamiento estado lógico/visual,
 * emisor de eventos discretos, motor de tweens con object pooling, atlas offscreen y 60 FPS estables.
 */
(() => {
  'use strict';

  // Motor de Tweens (browser o Node)
  const TweenEngine = (typeof window !== 'undefined' && window.ArcadeTween) ||
    (typeof require !== 'undefined' ? (require('../../shared/tween.js').ArcadeTween || require('../../shared/tween.js')) : null);

  // ==========================================
  // CONFIGURACIÓN Y CONSTANTES DE BALANCE
  // ==========================================
  const CONFIG = {
    COLS: 6,
    ROWS: 12,
    VIRTUAL_W: 360,
    VIRTUAL_H: 640,
    BASE_DROP_INTERVAL: 0.85,
    FAST_DROP_INTERVAL: 0.05,
    COLORS: [
      { id: 1, name: 'RED',    core: '#ff2255', dark: '#99002a', light: '#ff88aa', bubble: '#ffa0bb' },
      { id: 2, name: 'GREEN',  core: '#00e676', dark: '#008844', light: '#88ffcc', bubble: '#b0ffdd' },
      { id: 3, name: 'BLUE',   core: '#0088ff', dark: '#0044aa', light: '#88ccff', bubble: '#b8e2ff' },
      { id: 4, name: 'YELLOW', core: '#ffcc00', dark: '#aa8800', light: '#ffea88', bubble: '#fff5b8' },
      { id: 5, name: 'PURPLE', core: '#b388ff', dark: '#6633aa', light: '#e2ccff', bubble: '#eeddff' }
    ],
    RAINBOW_ID: 99,
    TRASH_ID: 88, // Gota inerte de basura de jefe / rival
    STORAGE_KEY_V1: 'gotas:v1:best_score',
    STORAGE_KEY_V2: 'gotas:v2',

    // CONSTANTES DE ANIMACIÓN
    ANIM: {
      SWAP_DURATION: 0.08,          // Desplazamiento horizontal de pareja (80ms)
      ROTATE_DURATION: 0.10,        // Rotación elástica de pareja (100ms)
      LOCK_LAND_DURATION: 0.16,     // Aterrizaje y squash al fijar (160ms)
      POP_DURATION: 0.20,           // Duración de eliminación (200ms)
      POP_STAGGER: 0.03,            // Retardo entre piezas de un mismo grupo (30ms)
      FALL_ACCELERATION: 1800,      // Aceleración de gravedad (px/s^2)
      FALL_MAX_DURATION: 0.28,      // Tope máximo de caída por paso
      FALL_COL_STAGGER: 0.02,       // Retardo escalonado entre columnas (20ms)
      RAINBOW_BEAM_DURATION: 0.25,  // Rayo de activación arcoíris
      BOARD_FILL_DURATION: 0.35,    // Llenado de tablero al inicio
      COMBO_STEP_ACCEL: 0.02,       // Aceleración de animación por cada nivel de combo
      FAST_MULTIPLIER: 0.45         // Factor de tiempo cuando "Animaciones rápidas" está activo
    },

    // 5 JEFES DE MARATÓN
    BOSSES: [
      { id: 1, name: 'JEFE 1: SORBETE', icon: 'drop', maxHp: 1200, trashInterval: 18.0, trashAmount: 2 },
      { id: 2, name: 'JEFE 2: VISCOSA', icon: 'flask', maxHp: 2600, trashInterval: 15.0, trashAmount: 3 },
      { id: 3, name: 'JEFE 3: MAELSTROM', icon: 'wave', maxHp: 4800, trashInterval: 13.0, trashAmount: 4 },
      { id: 4, name: 'JEFE 4: PLASMA-CORE', icon: 'zap', maxHp: 7500, trashInterval: 11.0, trashAmount: 5 },
      { id: 5, name: 'JEFE 5: TITANIUM BLOB', icon: 'crown', maxHp: 11000, trashInterval: 9.0, trashAmount: 6 }
    ],

    // 5 RIVALES DE DUELO IA
    AI_RIVALS: [
      { id: 1, name: 'Novato Gel', icon: 'spark', reactionSpeed: 1.2, comboSkill: 0.2 },
      { id: 2, name: 'Aprendiz Aqua', icon: 'drop', reactionSpeed: 0.9, comboSkill: 0.4 },
      { id: 3, name: 'Mago de Reacción', icon: 'zap', reactionSpeed: 0.7, comboSkill: 0.65 },
      { id: 4, name: 'Maestra Alquimia', icon: 'flask', reactionSpeed: 0.55, comboSkill: 0.8 },
      { id: 5, name: 'Oráculo Cuántico', icon: 'gem', reactionSpeed: 0.4, comboSkill: 0.95 }
    ]
  };

  // ==========================================
  // LÓGICA PURA Y SIMULACIÓN (Testeable en Node)
  // ==========================================
  const GotasLogic = {
    createGrid(cols = CONFIG.COLS, rows = CONFIG.ROWS) {
      const grid = new Array(rows);
      for (let r = 0; r < rows; r++) {
        grid[r] = new Array(cols).fill(0);
      }
      return grid;
    },

    /**
     * Aplica gravedad a todas las columnas de forma iterativa
     */
    applyGravity(grid) {
      const rows = grid.length;
      const cols = grid[0].length;
      let totalFallen = 0;

      for (let c = 0; c < cols; c++) {
        let writeRow = rows - 1;
        for (let r = rows - 1; r >= 0; r--) {
          if (grid[r][c] !== 0) {
            if (writeRow !== r) {
              grid[writeRow][c] = grid[r][c];
              grid[r][c] = 0;
              totalFallen++;
            }
            writeRow--;
          }
        }
      }

      return totalFallen;
    },

    /**
     * Detecta grupos conectados ortogonalmente de 4 o más gotas del mismo color
     */
    findConnectedGroups(grid) {
      const rows = grid.length;
      const cols = grid[0].length;
      const visited = new Array(rows);
      for (let r = 0; r < rows; r++) visited[r] = new Uint8Array(cols);

      const groups = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const color = grid[r][c];
          if (color === 0 || color === CONFIG.RAINBOW_ID || color === CONFIG.TRASH_ID || visited[r][c]) continue;

          const cluster = [];
          const queue = [{ r, c }];
          visited[r][c] = 1;

          while (queue.length > 0) {
            const curr = queue.shift();
            cluster.push(curr);

            const dr = [-1, 1, 0, 0];
            const dc = [0, 0, -1, 1];
            for (let i = 0; i < 4; i++) {
              const nr = curr.r + dr[i];
              const nc = curr.c + dc[i];
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                if (!visited[nr][nc] && grid[nr][nc] === color) {
                  visited[nr][nc] = 1;
                  queue.push({ r: nr, c: nc });
                }
              }
            }
          }

          if (cluster.length >= 4) {
            groups.push({ color, cells: cluster });
          }
        }
      }

      return groups;
    },

    /**
     * Resuelve la acción de la gota arcoíris
     */
    resolveRainbowDrop(grid, r, c) {
      const rows = grid.length;
      const cols = grid[0].length;
      let targetColor = 0;

      if (r + 1 < rows && grid[r + 1][c] !== 0 && grid[r + 1][c] !== CONFIG.RAINBOW_ID) {
        targetColor = grid[r + 1][c];
      } else {
        const dr = [0, 0, -1];
        const dc = [-1, 1, 0];
        for (let i = 0; i < 3; i++) {
          const nr = r + dr[i];
          const nc = c + dc[i];
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            if (grid[nr][nc] !== 0 && grid[nr][nc] !== CONFIG.RAINBOW_ID) {
              targetColor = grid[nr][nc];
              break;
            }
          }
        }
      }

      grid[r][c] = 0;

      if (targetColor !== 0) {
        for (let rr = 0; rr < rows; rr++) {
          for (let cc = 0; cc < cols; cc++) {
            if (grid[rr][cc] === targetColor) {
              grid[rr][cc] = 0;
            }
          }
        }
      }

      return targetColor;
    },

    /**
     * Limpia la basura adyacente a un grupo de gotas que estalló
     */
    clearAdjacentTrash(grid, groupCells) {
      const rows = grid.length;
      const cols = grid[0].length;
      let trashCleared = 0;

      for (const cell of groupCells) {
        const dr = [-1, 1, 0, 0];
        const dc = [0, 0, -1, 1];
        for (let i = 0; i < 4; i++) {
          const nr = cell.r + dr[i];
          const nc = cell.c + dc[i];
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            if (grid[nr][nc] === CONFIG.TRASH_ID) {
              grid[nr][nc] = 0;
              trashCleared++;
            }
          }
        }
      }

      return trashCleared;
    },

    /**
     * Añade gotas de basura en las columnas especificadas en la parte superior
     */
    dropTrash(grid, count) {
      const cols = grid[0].length;
      const availableCols = [];
      for (let c = 0; c < cols; c++) availableCols.push(c);
      availableCols.sort(() => Math.random() - 0.5);

      const placed = Math.min(count, cols);
      for (let i = 0; i < placed; i++) {
        const c = availableCols[i];
        if (grid[0][c] === 0) {
          grid[0][c] = CONFIG.TRASH_ID;
        }
      }
      this.applyGravity(grid);
    },

    /**
     * Paso atómico de cascada que emite eventos estructurados para animación
     */
    stepCascade(grid, cascadeStep = 0) {
      const rows = grid.length;
      const cols = grid[0].length;

      // 1. Gravedad primero
      const falls = [];
      for (let c = 0; c < cols; c++) {
        let writeRow = rows - 1;
        for (let r = rows - 1; r >= 0; r--) {
          if (grid[r][c] !== 0) {
            if (writeRow !== r) {
              falls.push({ fromR: r, toR: writeRow, c, color: grid[r][c] });
              grid[writeRow][c] = grid[r][c];
              grid[r][c] = 0;
            }
            writeRow--;
          }
        }
      }

      if (falls.length > 0) {
        return { type: 'gravity', falls };
      }

      // 2. Comprobar gotas arcoíris
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] === CONFIG.RAINBOW_ID) {
            let targetColor = 0;
            if (r + 1 < rows && grid[r + 1][c] !== 0 && grid[r + 1][c] !== CONFIG.RAINBOW_ID) {
              targetColor = grid[r + 1][c];
            } else {
              const dr = [0, 0, -1];
              const dc = [-1, 1, 0];
              for (let i = 0; i < 3; i++) {
                const nr = r + dr[i];
                const nc = c + dc[i];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                  if (grid[nr][nc] !== 0 && grid[nr][nc] !== CONFIG.RAINBOW_ID) {
                    targetColor = grid[nr][nc];
                    break;
                  }
                }
              }
            }

            grid[r][c] = 0;
            const cleared = [];
            if (targetColor !== 0) {
              for (let rr = 0; rr < rows; rr++) {
                for (let cc = 0; cc < cols; cc++) {
                  if (grid[rr][cc] === targetColor) {
                    cleared.push({ r: rr, c: cc, color: targetColor });
                    grid[rr][cc] = 0;
                  }
                }
              }
            }

            return {
              type: 'rainbow',
              rainbowR: r,
              rainbowC: c,
              targetColor,
              cleared
            };
          }
        }
      }

      // 3. Detectar grupos conectados >= 4
      const rawGroups = this.findConnectedGroups(grid);
      if (rawGroups.length > 0) {
        const nextStep = cascadeStep + 1;
        const groups = [];
        let totalCleared = 0;

        for (const g of rawGroups) {
          const adjacentTrash = [];
          for (const cell of g.cells) {
            const dr = [-1, 1, 0, 0];
            const dc = [0, 0, -1, 1];
            for (let i = 0; i < 4; i++) {
              const nr = cell.r + dr[i];
              const nc = cell.c + dc[i];
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                if (grid[nr][nc] === CONFIG.TRASH_ID) {
                  grid[nr][nc] = 0;
                  adjacentTrash.push({ r: nr, c: nc });
                  totalCleared++;
                }
              }
            }
          }

          for (const cell of g.cells) {
            grid[cell.r][cell.c] = 0;
            totalCleared++;
          }

          groups.push({
            color: g.color,
            cells: g.cells,
            trash: adjacentTrash
          });
        }

        return {
          type: 'matches',
          groups,
          totalCleared,
          stepNumber: nextStep
        };
      }

      // 4. Estable / sin más cambios
      return { type: 'settled' };
    },

    /**
     * Paso de basura estructurado para animación
     */
    stepTrash(grid, count) {
      const cols = grid[0].length;
      const availableCols = [];
      for (let c = 0; c < cols; c++) availableCols.push(c);
      availableCols.sort(() => Math.random() - 0.5);

      const placed = Math.min(count, cols);
      const spawns = [];
      for (let i = 0; i < placed; i++) {
        const c = availableCols[i];
        if (grid[0][c] === 0) {
          grid[0][c] = CONFIG.TRASH_ID;
          spawns.push({ c, color: CONFIG.TRASH_ID });
        }
      }

      // Aplicar gravedad para saber dónde aterrizan
      const falls = [];
      const rows = grid.length;
      for (let c = 0; c < cols; c++) {
        let writeRow = rows - 1;
        for (let r = rows - 1; r >= 0; r--) {
          if (grid[r][c] !== 0) {
            if (writeRow !== r) {
              falls.push({ fromR: r, toR: writeRow, c, color: grid[r][c] });
              grid[writeRow][c] = grid[r][c];
              grid[r][c] = 0;
            }
            writeRow--;
          }
        }
      }

      return { spawns, falls };
    },

    /**
     * Simula cascadas sucesivas completas hasta estabilización
     */
    simulateCascades(grid) {
      let chains = 0;
      let totalCleared = 0;

      while (true) {
        const step = this.stepCascade(grid, chains);
        if (step.type === 'settled') break;
        if (step.type === 'matches') {
          chains = step.stepNumber;
          totalCleared += step.totalCleared;
        } else if (step.type === 'rainbow') {
          totalCleared += step.cleared.length + 1;
        }
      }

      return { chains, totalCleared };
    }
  };

  // ==========================================
  // SPRITE VISUAL Y GESTOR DE ESTADO VISUAL
  // ==========================================
  class DropVisualSprite {
    constructor(id) {
      this.id = id;
      this.active = false;
      this.r = 0;
      this.c = 0;
      this.x = 0;
      this.y = 0;
      this.color = 0;
      this.scale = 1;
      this.scaleX = 1;
      this.scaleY = 1;
      this.rotation = 0;
      this.alpha = 1;
      this.brightness = 1;
      this.wobblePhase = Math.random() * Math.PI * 2;
      this.isDanger = false;
      this.isPopping = false;
      this.isFalling = false;
    }

    reset() {
      this.active = false;
      this.r = 0;
      this.c = 0;
      this.x = 0;
      this.y = 0;
      this.color = 0;
      this.scale = 1;
      this.scaleX = 1;
      this.scaleY = 1;
      this.rotation = 0;
      this.alpha = 1;
      this.brightness = 1;
      this.wobblePhase = Math.random() * Math.PI * 2;
      this.isDanger = false;
      this.isPopping = false;
      this.isFalling = false;
    }
  }

  function getCellX(c) {
    return State.originX + c * State.cellSize + State.cellSize / 2;
  }

  function getCellY(r) {
    return State.originY + r * State.cellSize + State.cellSize / 2;
  }

  const MAX_SPRITES = 120;
  const spritePool = [];
  for (let i = 0; i < MAX_SPRITES; i++) {
    spritePool.push(new DropVisualSprite(i));
  }

  const GotasVisualManager = {
    pool: spritePool,
    visualGrid: Array.from({ length: CONFIG.ROWS }, () => new Array(CONFIG.COLS).fill(null)),
    transientSprites: [],
    rainbowBeams: [],

    activeCount() {
      let count = 0;
      for (let r = 0; r < CONFIG.ROWS; r++) {
        for (let c = 0; c < CONFIG.COLS; c++) {
          if (this.visualGrid[r][c] !== null && this.visualGrid[r][c].active) count++;
        }
      }
      return count;
    },

    obtain(r, c, color, startX = null, startY = null) {
      for (let i = 0; i < MAX_SPRITES; i++) {
        const s = this.pool[i];
        if (!s.active) {
          s.reset();
          s.active = true;
          s.r = r;
          s.c = c;
          s.color = color;
          s.x = startX !== null ? startX : getCellX(c);
          s.y = startY !== null ? startY : getCellY(r);
          s.isDanger = r <= 2;
          return s;
        }
      }
      const fallback = new DropVisualSprite(this.pool.length);
      fallback.active = true;
      fallback.r = r;
      fallback.c = c;
      fallback.color = color;
      fallback.x = startX !== null ? startX : getCellX(c);
      fallback.y = startY !== null ? startY : getCellY(r);
      fallback.isDanger = r <= 2;
      this.pool.push(fallback);
      return fallback;
    },

    release(sprite) {
      if (!sprite) return;
      sprite.reset();
      sprite.active = false;
    },

    clear() {
      for (let r = 0; r < CONFIG.ROWS; r++) {
        for (let c = 0; c < CONFIG.COLS; c++) {
          if (this.visualGrid[r][c]) {
            this.release(this.visualGrid[r][c]);
            this.visualGrid[r][c] = null;
          }
        }
      }
      for (const s of this.transientSprites) {
        this.release(s);
      }
      this.transientSprites.length = 0;
      this.rainbowBeams.length = 0;
    },

    syncFromGrid(grid) {
      this.clear();
      for (let r = 0; r < CONFIG.ROWS; r++) {
        for (let c = 0; c < CONFIG.COLS; c++) {
          const color = grid[r][c];
          if (color !== 0) {
            const s = this.obtain(r, c, color);
            this.visualGrid[r][c] = s;
          }
        }
      }
    },

    checkSync(grid) {
      for (let r = 0; r < CONFIG.ROWS; r++) {
        for (let c = 0; c < CONFIG.COLS; c++) {
          const color = grid[r][c];
          const sprite = this.visualGrid[r][c];
          if (color === 0) {
            if (sprite !== null) return false;
          } else {
            if (!sprite || !sprite.active || sprite.color !== color || sprite.r !== r || sprite.c !== c) {
              return false;
            }
          }
        }
      }
      return true;
    },

    verifySync(grid) {
      const ok = this.checkSync(grid);
      if (!ok) {
        console.error('[GotasVisualManager] ¡DESINCRONIZACIÓN DETECTADA!');
        for (let r = 0; r < CONFIG.ROWS; r++) {
          for (let c = 0; c < CONFIG.COLS; c++) {
            const col = grid[r][c];
            const sp = this.visualGrid[r][c];
            const spColor = sp ? sp.color : 0;
            if (col !== spColor) {
              console.error(`Celda (${r}, ${c}): Lógico=${col}, Visual=${spColor}`);
            }
          }
        }
      }
      return ok;
    }
  };

  // ==========================================
  // ANIMADOR VISUAL CON TWEENS
  // ==========================================
  const GotasVisual = {
    getDuration(base) {
      const isFast = (typeof window !== 'undefined' && window.ArcadeJuice?.getOption('fastAnim', false)) || State.fastAnim;
      return isFast ? base * CONFIG.ANIM.FAST_MULTIPLIER : base;
    },

    animateLock(p, onDone) {
      const p1Sprite = GotasVisualManager.obtain(p.r1, p.c1, p.color1, p.vx1, p.vy1);
      const p2Sprite = GotasVisualManager.obtain(p.r2, p.c2, p.color2, p.vx2, p.vy2);
      GotasVisualManager.visualGrid[p.r1][p.c1] = p1Sprite;
      GotasVisualManager.visualGrid[p.r2][p.c2] = p2Sprite;

      const dur = this.getDuration(CONFIG.ANIM.LOCK_LAND_DURATION);
      let finished = 0;
      const checkDone = () => {
        finished++;
        if (finished === 2 && onDone) onDone();
      };

      p1Sprite.scaleY = 0.72;
      p1Sprite.scaleX = 1.28;
      TweenEngine?.to(p1Sprite, dur, { scaleX: 1, scaleY: 1 }, {
        easing: TweenEngine.Easing.easeOutBounce,
        onComplete: checkDone
      });

      p2Sprite.scaleY = 0.72;
      p2Sprite.scaleX = 1.28;
      TweenEngine?.to(p2Sprite, dur, { scaleX: 1, scaleY: 1 }, {
        easing: TweenEngine.Easing.easeOutBounce,
        onComplete: checkDone
      });
    },

    animateGravity(falls, onDone) {
      if (!falls || falls.length === 0) {
        if (onDone) onDone();
        return;
      }

      let remaining = falls.length;
      for (const fall of falls) {
        let sprite = GotasVisualManager.visualGrid[fall.fromR][fall.c];
        if (!sprite) {
          sprite = GotasVisualManager.obtain(fall.fromR, fall.c, fall.color);
        }
        GotasVisualManager.visualGrid[fall.fromR][fall.c] = null;
        GotasVisualManager.visualGrid[fall.toR][fall.c] = sprite;
        sprite.r = fall.toR;
        sprite.c = fall.c;
        sprite.isFalling = true;

        const targetY = getCellY(fall.toR);
        const dist = Math.abs(targetY - sprite.y);
        const baseDur = Math.min(CONFIG.ANIM.FALL_MAX_DURATION, Math.max(0.12, Math.sqrt((2 * dist) / CONFIG.ANIM.FALL_ACCELERATION)));
        const dur = this.getDuration(baseDur);
        const colDelay = fall.c * CONFIG.ANIM.FALL_COL_STAGGER;

        sprite.scaleY = 1.15;
        sprite.scaleX = 0.88;

        TweenEngine?.to(sprite, dur, { y: targetY }, {
          delay: colDelay,
          easing: TweenEngine.Easing.easeInQuad,
          onComplete: () => {
            sprite.isFalling = false;
            sprite.scaleY = 0.76;
            sprite.scaleX = 1.24;
            TweenEngine?.to(sprite, 0.12, { scaleX: 1, scaleY: 1 }, {
              easing: TweenEngine.Easing.easeOutBounce
            });
            remaining--;
            if (remaining === 0 && onDone) onDone();
          }
        });
      }
    },

    animateMatches(matchesStep, onDone) {
      const allCells = [];
      for (const g of matchesStep.groups) {
        for (const c of g.cells) {
          allCells.push({ r: c.r, c: c.c, color: g.color, isTrash: false });
        }
        for (const t of g.trash) {
          allCells.push({ r: t.r, c: t.c, color: CONFIG.TRASH_ID, isTrash: true });
        }
      }

      if (allCells.length === 0) {
        if (onDone) onDone();
        return;
      }

      let remaining = allCells.length;
      for (let i = 0; i < allCells.length; i++) {
        const item = allCells[i];
        const sprite = GotasVisualManager.visualGrid[item.r][item.c];
        if (!sprite) {
          remaining--;
          if (remaining === 0 && onDone) onDone();
          continue;
        }

        GotasVisualManager.visualGrid[item.r][item.c] = null;
        sprite.isPopping = true;
        GotasVisualManager.transientSprites.push(sprite);

        const delay = i * CONFIG.ANIM.POP_STAGGER;
        const popDur = this.getDuration(CONFIG.ANIM.POP_DURATION);

        // Destello y ligera expansión antes del encogimiento
        TweenEngine?.to(sprite, 0.06, {
          scale: 1.15,
          brightness: 1.6
        }, {
          delay,
          easing: TweenEngine.Easing.easeOutQuad,
          onComplete: () => {
            // Encogimiento con giro y desvanecimiento
            TweenEngine?.to(sprite, popDur, {
              scale: 0,
              rotation: (Math.random() - 0.5) * 1.5,
              alpha: 0
            }, {
              easing: TweenEngine.Easing.easeInQuad,
              onComplete: () => {
                spawnSplash(item.c, item.r, item.color);
                spawnShockwave(item.c, item.r);

                const idx = GotasVisualManager.transientSprites.indexOf(sprite);
                if (idx !== -1) GotasVisualManager.transientSprites.splice(idx, 1);
                GotasVisualManager.release(sprite);

                remaining--;
                if (remaining === 0 && onDone) onDone();
              }
            });
          }
        });
      }
    },

    animateRainbow(rainbowStep, onDone) {
      const rs = GotasVisualManager.visualGrid[rainbowStep.rainbowR][rainbowStep.rainbowC];
      if (rs) {
        GotasVisualManager.visualGrid[rainbowStep.rainbowR][rainbowStep.rainbowC] = null;
        rs.isPopping = true;
        GotasVisualManager.transientSprites.push(rs);

        TweenEngine?.to(rs, 0.22, { scale: 1.4, alpha: 0 }, {
          easing: TweenEngine.Easing.easeOutQuad,
          onComplete: () => {
            spawnSplash(rainbowStep.rainbowC, rainbowStep.rainbowR, CONFIG.RAINBOW_ID);
            spawnShockwave(rainbowStep.rainbowC, rainbowStep.rainbowR);
            const idx = GotasVisualManager.transientSprites.indexOf(rs);
            if (idx !== -1) GotasVisualManager.transientSprites.splice(idx, 1);
            GotasVisualManager.release(rs);
          }
        });
      }

      if (!rainbowStep.cleared || rainbowStep.cleared.length === 0) {
        setTimeout(() => { if (onDone) onDone(); }, 200);
        return;
      }

      let remaining = rainbowStep.cleared.length;
      for (let i = 0; i < rainbowStep.cleared.length; i++) {
        const item = rainbowStep.cleared[i];
        const sprite = GotasVisualManager.visualGrid[item.r][item.c];
        if (!sprite) {
          remaining--;
          if (remaining === 0 && onDone) onDone();
          continue;
        }

        GotasVisualManager.visualGrid[item.r][item.c] = null;
        sprite.isPopping = true;
        GotasVisualManager.transientSprites.push(sprite);

        // Rayo láser de arcoíris conectando con la gota
        const beam = {
          x1: getCellX(rainbowStep.rainbowC),
          y1: getCellY(rainbowStep.rainbowR),
          x2: getCellX(item.c),
          y2: getCellY(item.r),
          progress: 0,
          alpha: 1
        };
        GotasVisualManager.rainbowBeams.push(beam);

        TweenEngine?.to(beam, 0.18, { progress: 1, alpha: 0 }, {
          onComplete: () => {
            const bIdx = GotasVisualManager.rainbowBeams.indexOf(beam);
            if (bIdx !== -1) GotasVisualManager.rainbowBeams.splice(bIdx, 1);
          }
        });

        // Disolver la gota objetivo
        TweenEngine?.to(sprite, 0.20, {
          scale: 0,
          brightness: 2.0,
          rotation: (Math.random() - 0.5) * 2
        }, {
          delay: i * 0.02,
          easing: TweenEngine.Easing.easeInQuad,
          onComplete: () => {
            spawnSplash(item.c, item.r, item.color);
            spawnShockwave(item.c, item.r);
            const idx = GotasVisualManager.transientSprites.indexOf(sprite);
            if (idx !== -1) GotasVisualManager.transientSprites.splice(idx, 1);
            GotasVisualManager.release(sprite);

            remaining--;
            if (remaining === 0 && onDone) onDone();
          }
        });
      }
    },

    animateTrashDrop(trashStep, onDone) {
      if (!trashStep.spawns || trashStep.spawns.length === 0) {
        if (onDone) onDone();
        return;
      }

      const fallMap = new Map();
      if (trashStep.falls) {
        for (const f of trashStep.falls) {
          if (f.fromR === 0) fallMap.set(f.c, f.toR);
        }
      }

      let remaining = trashStep.spawns.length;
      for (const sp of trashStep.spawns) {
        const targetR = fallMap.has(sp.c) ? fallMap.get(sp.c) : 0;
        const targetX = getCellX(sp.c);
        const targetY = getCellY(targetR);
        const startY = State.originY - State.cellSize * 1.5;

        const sprite = GotasVisualManager.obtain(targetR, sp.c, CONFIG.TRASH_ID, targetX, startY);
        GotasVisualManager.visualGrid[targetR][sp.c] = sprite;
        sprite.isFalling = true;

        const dist = Math.abs(targetY - startY);
        const dur = this.getDuration(Math.min(CONFIG.ANIM.FALL_MAX_DURATION, Math.sqrt((2 * dist) / CONFIG.ANIM.FALL_ACCELERATION)));

        TweenEngine?.to(sprite, dur, { y: targetY }, {
          easing: TweenEngine.Easing.easeInQuad,
          onComplete: () => {
            sprite.isFalling = false;
            sprite.scaleY = 0.72;
            sprite.scaleX = 1.28;
            TweenEngine?.to(sprite, 0.12, { scaleX: 1, scaleY: 1 }, {
              easing: TweenEngine.Easing.easeOutBounce
            });
            remaining--;
            if (remaining === 0 && onDone) onDone();
          }
        });
      }
    },

    animateBoardFill(onDone) {
      if (onDone) onDone();
    }
  };

  // ==========================================
  // POOL DE PARTÍCULAS Y ONDAS
  // ==========================================
  const MAX_PARTICLES = 150;
  const particlePool = [];
  for (let i = 0; i < MAX_PARTICLES; i++) {
    particlePool.push({
      active: false,
      x: 0, y: 0,
      vx: 0, vy: 0,
      color: '#fff',
      life: 0, maxLife: 0.35,
      size: 2
    });
  }

  const MAX_SHOCKWAVES = 25;
  const shockwavePool = [];
  for (let i = 0; i < MAX_SHOCKWAVES; i++) {
    shockwavePool.push({
      active: false,
      x: 0, y: 0,
      r: 0, maxR: 0,
      alpha: 0
    });
  }

  // ==========================================
  // ESTADO GLOBAL DEL JUEGO
  // ==========================================
  const State = {
    grid: GotasLogic.createGrid(),
    started: false,
    paused: false,
    gameOver: false,
    gameMode: 'normal', // 'normal', 'marathon', 'time', 'duel'
    score: 0,
    displayedScore: 0,
    level: 1,
    timeRemaining: 120, // Modo contrarreloj
    maxCombo: 1,
    fastAnim: false,
    lowQuality: false,

    // Jefe / Duelo
    currentBossIdx: 0,
    bossHp: 1200,
    bossMaxHp: 1200,
    bossTrashTimer: 18.0,
    aiHp: 100,
    aiTimer: 0,

    // Pareja activa
    activePair: null,
    nextPair: null,
    dropTimer: 0,
    isFastDrop: false,
    isCascading: false,
    cascadeStep: 0,
    queuedInputs: [],

    // Fondo animado: Caverna de burbujas bioluminiscentes
    cavernBubbles: [],

    // Cámara con zoom dinámico en combos
    cameraZoom: 1.0,

    // Dimensiones
    cellSize: 44,
    originX: 48,
    originY: 56,
    scale: 1,

    // Canvas cacheado de fondo
    bgCanvas: null,

    // Persistencia versionada (gotas:v2)
    saveData: {
      bestScore: 0,
      bestChain: 1,
      bossesDefeated: 0,
      duelWins: 0,
      timeAttackBest: 0
    }
  };

  // Pre-generar burbujas de fondo de la caverna
  for (let i = 0; i < 24; i++) {
    State.cavernBubbles.push({
      x: Math.random() * CONFIG.VIRTUAL_W,
      y: Math.random() * CONFIG.VIRTUAL_H,
      vy: 18 + Math.random() * 32,
      r: 2 + Math.random() * 5,
      alpha: 0.15 + Math.random() * 0.25,
      wobble: Math.random() * Math.PI * 2
    });
  }

  // ==========================================
  // REFERENCIAS DOM (con resguardo para Node)
  // ==========================================
  const dom = typeof document !== 'undefined' ? {
    canvas: document.getElementById('gotas-canvas'),
    ctx: null,
    previewCanvas: document.getElementById('preview-canvas'),
    pCtx: null,
    hudScore: document.getElementById('hud-score'),
    hudLevel: document.getElementById('hud-level'),
    labelStatLeft: document.getElementById('label-stat-left'),
    labelStatRight: document.getElementById('label-stat-right'),
    hudBossBar: document.getElementById('hud-boss-bar'),
    bossIcon: document.getElementById('boss-icon'),
    bossName: document.getElementById('boss-name'),
    bossHpFill: document.getElementById('boss-hp-fill'),
    bossHpText: document.getElementById('boss-hp-text'),
    trashWarningBanner: document.getElementById('trash-warning-banner'),
    comboBanner: document.getElementById('combo-banner'),
    comboText: document.getElementById('combo-text'),
    startCard: document.getElementById('start-card'),
    btnStart: document.getElementById('btn-start'),
    bestScoreVal: document.getElementById('best-score-val'),
    bestChainVal: document.getElementById('best-chain-val'),
    modeDescTitle: document.getElementById('mode-desc-title'),
    modeDescP: document.getElementById('mode-desc-p'),
    overlayPause: document.getElementById('overlay-pause'),
    btnPauseHeader: document.getElementById('btn-pause-header'),
    btnResume: document.getElementById('btn-resume'),
    btnRestartPause: document.getElementById('btn-restart-pause'),
    btnPauseOptions: document.getElementById('btn-pause-options'),
    overlayGameOver: document.getElementById('overlay-gameover'),
    goTitle: document.getElementById('go-title'),
    goSub: document.getElementById('go-sub'),
    finalScore: document.getElementById('final-score'),
    finalMaxCombo: document.getElementById('final-max-combo'),
    bestFinalScore: document.getElementById('best-final-score'),
    btnRetry: document.getElementById('btn-retry'),
    btnSoundToggle: document.getElementById('btn-sound-toggle'),
    iconSoundOn: document.getElementById('icon-sound-on'),
    iconSoundOff: document.getElementById('icon-sound-off'),
    btnTutorialHeader: document.getElementById('btn-tutorial-header'),
    btnAchievementsHeader: document.getElementById('btn-achievements-header'),
    btnOptionsHeader: document.getElementById('btn-options-header'),

    modalTutorial: document.getElementById('modal-tutorial'),
    tutStep1: document.getElementById('tut-step-1'),
    tutStep2: document.getElementById('tut-step-2'),
    tutStep3: document.getElementById('tut-step-3'),
    btnTutPrev: document.getElementById('btn-tut-prev'),
    btnTutNext: document.getElementById('btn-tut-next'),
    tutPageIndicator: document.getElementById('tut-page-indicator'),
    btnCloseTut: document.getElementById('btn-close-tut'),

    modalAchievements: document.getElementById('modal-achievements'),
    achList: document.getElementById('ach-list'),
    btnCloseAch: document.getElementById('btn-close-ach'),

    modalOptions: document.getElementById('modal-options'),
    optSfx: document.getElementById('opt-sfx'),
    optBgm: document.getElementById('opt-bgm'),
    optVibration: document.getElementById('opt-vibration'),
    optContrast: document.getElementById('opt-contrast'),
    optFastAnim: document.getElementById('opt-fast-anim'),
    btnCloseOptions: document.getElementById('btn-close-options'),

    btnLeft: document.getElementById('btn-left'),
    btnRight: document.getElementById('btn-right'),
    btnRotate: document.getElementById('btn-rotate'),
    btnDrop: document.getElementById('btn-drop')
  } : {};

  if (dom.canvas) dom.ctx = dom.canvas.getContext('2d');
  if (dom.previewCanvas) dom.pCtx = dom.previewCanvas.getContext('2d');

  // ==========================================
  // PERSISTENCIA Y MIGRACIÓN
  // ==========================================
  function loadGameData() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEY_V2);
      if (raw) {
        State.saveData = Object.assign(State.saveData, JSON.parse(raw));
      } else {
        const oldScore = window.ArcadeStorage?.getHighScore(CONFIG.STORAGE_KEY_V1) || 0;
        if (oldScore > 0) {
          State.saveData.bestScore = oldScore;
          saveGameData();
        }
      }
    } catch (_) {}

    if (dom.bestScoreVal) dom.bestScoreVal.textContent = State.saveData.bestScore.toLocaleString();
    if (dom.bestChainVal) dom.bestChainVal.textContent = `x${State.saveData.bestChain}`;
  }

  function saveGameData() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY_V2, JSON.stringify(State.saveData));
      window.ArcadeStorage?.setHighScore(CONFIG.STORAGE_KEY_V1, State.saveData.bestScore);
    } catch (_) {}
  }

  // ==========================================
  // AUDIO SINTETIZADO Y BGM
  // ==========================================
  let bgmInterval = null;
  let bgmStep = 0;
  const bgmNotes = [330, 392, 440, 523.25, 440, 392, 330, 293.66];

  function startBGM() {
    if (bgmInterval || !window.ArcadeJuice?.getOption('bgm', true)) return;
    scheduleNextBgm();
  }

  function stopBGM() {
    if (bgmInterval) {
      clearTimeout(bgmInterval);
      bgmInterval = null;
    }
  }

  function scheduleNextBgm() {
    if (!State.started || State.paused || State.gameOver || !window.ArcadeJuice?.getOption('bgm', true)) {
      bgmInterval = null;
      return;
    }
    const freq = bgmNotes[bgmStep % bgmNotes.length];
    bgmStep++;
    if (window.ArcadeAudio) {
      window.ArcadeAudio.playTone(freq, 'sine', 0.1, 0.04);
    }
    const delay = Math.max(160, 260 - (State.level - 1) * 12);
    bgmInterval = setTimeout(scheduleNextBgm, delay);
  }

  function playAudio(type) {
    if (!window.ArcadeAudio || !window.ArcadeJuice?.getOption('sfx', true)) return;
    switch (type) {
      case 'move':
        window.ArcadeAudio.playTone(480, 'sine', 0.04, 0.08);
        break;
      case 'rotate':
        window.ArcadeAudio.playTone(620, 'triangle', 0.05, 0.1);
        break;
      case 'land':
        window.ArcadeAudio.playTone(220, 'square', 0.05, 0.08);
        break;
      case 'pop':
        window.ArcadeAudio.playTone(880, 'sine', 0.08, 0.14);
        break;
      case 'cascade':
        [523, 659, 784, 1046].forEach((f, i) => {
          setTimeout(() => window.ArcadeAudio?.playTone(f, 'sine', 0.1, 0.15), i * 70);
        });
        break;
      case 'rainbow':
        [440, 554, 659, 880, 1108].forEach((f, i) => {
          setTimeout(() => window.ArcadeAudio?.playTone(f, 'triangle', 0.1, 0.18), i * 60);
        });
        break;
      case 'trash':
        window.ArcadeAudio.playTone(140, 'sawtooth', 0.15, 0.18);
        break;
      case 'boss-hit':
        window.ArcadeAudio.playTone(280, 'square', 0.1, 0.2);
        break;
      case 'gameover':
        window.ArcadeAudio.playExplosion ? window.ArcadeAudio.playExplosion() : window.ArcadeAudio.playTone(120, 'sawtooth', 0.3, 0.2);
        break;
    }
  }

  // ==========================================
  // RESIZE Y RESPONSIVIDAD
  // ==========================================
  function handleResize() {
    if (!dom.canvas) return;
    const parent = dom.canvas.parentElement;
    if (!parent) return;

    const fit = window.ArcadeCanvas.fit(
      dom.canvas,
      parent,
      CONFIG.VIRTUAL_W,
      CONFIG.VIRTUAL_H,
      4
    );

    State.scale = fit.width / CONFIG.VIRTUAL_W;
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => setTimeout(handleResize, 100));
  }

  // ==========================================
  // GENERACIÓN DE PAREJAS DE GOTAS
  // ==========================================
  function getRandomDropColor() {
    if (Math.random() < 0.045) {
      return CONFIG.RAINBOW_ID;
    }
    const available = State.level >= 4 ? 5 : 4;
    const colorObj = CONFIG.COLORS[Math.floor(Math.random() * available)];
    return colorObj.id;
  }

  function createPair() {
    return {
      c1: 2, r1: 1, color1: getRandomDropColor(),
      c2: 2, r2: 0, color2: getRandomDropColor(),
      rot: 0, // 0: arriba, 1: derecha, 2: abajo, 3: izquierda
      vx1: getCellX(2), vy1: getCellY(1),
      vx2: getCellX(2), vy2: getCellY(0),
      vrot: 0,
      scaleX: 1, scaleY: 1
    };
  }

  function spawnNextPair() {
    if (!State.nextPair) {
      State.nextPair = createPair();
    }

    State.activePair = State.nextPair;
    State.activePair.c1 = 2;
    State.activePair.r1 = 1;
    State.activePair.c2 = 2;
    State.activePair.r2 = 0;
    State.activePair.rot = 0;
    State.activePair.vx1 = getCellX(2);
    State.activePair.vy1 = getCellY(1);
    State.activePair.vx2 = getCellX(2);
    State.activePair.vy2 = getCellY(0);
    State.activePair.vrot = 0;
    State.activePair.scaleX = 1;
    State.activePair.scaleY = 1;

    State.nextPair = createPair();
    renderPreview();

    // Comprobar game over si la entrada está colapsada
    if (State.grid[1][2] !== 0 || State.grid[0][2] !== 0) {
      triggerGameOver();
    }
  }

  // ==========================================
  // MOVIMIENTO Y ROTACIÓN DE PAREJA
  // ==========================================
  function canMove(pair, dc, dr) {
    const c1 = pair.c1 + dc;
    const r1 = pair.r1 + dr;
    const c2 = pair.c2 + dc;
    const r2 = pair.r2 + dr;

    if (c1 < 0 || c1 >= CONFIG.COLS || r1 >= CONFIG.ROWS) return false;
    if (c2 < 0 || c2 >= CONFIG.COLS || r2 >= CONFIG.ROWS) return false;

    if (r1 >= 0 && State.grid[r1][c1] !== 0) return false;
    if (r2 >= 0 && State.grid[r2][c2] !== 0) return false;

    return true;
  }

  function movePair(dc) {
    if (!State.started || State.paused || State.gameOver || State.isCascading || !State.activePair) {
      if (State.isCascading && State.queuedInputs.length < 3) {
        State.queuedInputs.push({ type: 'move', dc });
      }
      return;
    }
    if (canMove(State.activePair, dc, 0)) {
      State.activePair.c1 += dc;
      State.activePair.c2 += dc;

      const dur = GotasVisual.getDuration(CONFIG.ANIM.SWAP_DURATION);
      const targetX1 = getCellX(State.activePair.c1);
      const targetX2 = getCellX(State.activePair.c2);

      TweenEngine?.to(State.activePair, dur, {
        vx1: targetX1,
        vx2: targetX2
      }, { easing: TweenEngine.Easing.easeOutQuad });

      playAudio('move');
      window.ArcadeJuice?.vibrate(6);
    }
  }

  function rotatePair() {
    if (!State.started || State.paused || State.gameOver || State.isCascading || !State.activePair) {
      if (State.isCascading && State.queuedInputs.length < 3) {
        State.queuedInputs.push({ type: 'rotate' });
      }
      return;
    }
    const p = State.activePair;
    const nextRot = (p.rot + 1) % 4;

    const offsets = [
      { dc: 0, dr: -1 },
      { dc: 1, dr: 0 },
      { dc: 0, dr: 1 },
      { dc: -1, dr: 0 }
    ];

    let targetC2 = p.c1 + offsets[nextRot].dc;
    let targetR2 = p.r1 + offsets[nextRot].dr;

    if (targetC2 < 0) {
      if (canMove(p, 1, 0)) {
        p.c1 += 1;
        targetC2 += 1;
      } else return;
    } else if (targetC2 >= CONFIG.COLS) {
      if (canMove(p, -1, 0)) {
        p.c1 -= 1;
        targetC2 -= 1;
      } else return;
    }

    if (targetR2 >= CONFIG.ROWS || (targetR2 >= 0 && State.grid[targetR2][targetC2] !== 0)) {
      return;
    }

    p.rot = nextRot;
    p.c2 = targetC2;
    p.r2 = targetR2;

    const dur = GotasVisual.getDuration(CONFIG.ANIM.ROTATE_DURATION);
    const targetX1 = getCellX(p.c1);
    const targetX2 = getCellX(p.c2);
    const targetY2 = getCellY(p.r2);

    TweenEngine?.to(p, dur, {
      vx1: targetX1,
      vx2: targetX2,
      vy2: targetY2
    }, { easing: TweenEngine.Easing.easeOutBack });

    playAudio('rotate');
    window.ArcadeJuice?.vibrate(8);
  }

  function processQueuedInput() {
    if (State.queuedInputs.length === 0 || !State.activePair || State.isCascading) return;
    const input = State.queuedInputs.shift();
    if (input.type === 'move') {
      movePair(input.dc);
    } else if (input.type === 'rotate') {
      rotatePair();
    }
  }

  // ==========================================
  // FIJACIÓN Y CASCADAS DE GOTAS
  // ==========================================
  function lockActivePair() {
    const p = State.activePair;
    if (p.r1 >= 0) State.grid[p.r1][p.c1] = p.color1;
    if (p.r2 >= 0) State.grid[p.r2][p.c2] = p.color2;

    playAudio('land');
    window.ArcadeJuice?.vibrate(10);
    State.activePair = null;

    State.isCascading = true;
    State.cascadeStep = 0;

    GotasVisual.animateLock(p, () => {
      startCascades();
    });
  }

  function startCascades() {
    State.isCascading = true;
    runCascadeStep();
  }

  function runCascadeStep() {
    const step = GotasLogic.stepCascade(State.grid, State.cascadeStep);

    if (step.type === 'gravity') {
      GotasVisual.animateGravity(step.falls, () => {
        runCascadeStep();
      });
      return;
    }

    if (step.type === 'rainbow') {
      playAudio('rainbow');
      if (typeof window !== 'undefined') {
        window.ArcadeJuice?.vibrate(25);
        window.ArcadeJuice?.shake(5, 0.25);
        window.ArcadeJuice?.unlockAchievement('gotas', 'ach_rainbow', 'Prisma Gelatinoso', 'Activa una Gota Arcoíris');
      }
      showComboBanner('¡GOTA ARCOÍRIS!');
      State.score += 450 * State.level;
      updateHUD();

      GotasVisual.animateRainbow(step, () => {
        runCascadeStep();
      });
      return;
    }

    if (step.type === 'matches') {
      State.cascadeStep = step.stepNumber;
      if (State.cascadeStep > State.maxCombo) {
        State.maxCombo = State.cascadeStep;
        if (State.maxCombo > State.saveData.bestChain) {
          State.saveData.bestChain = State.maxCombo;
          saveGameData();
        }
      }

      if (typeof window !== 'undefined') {
        window.ArcadeJuice?.unlockAchievement('gotas', 'ach_first_clear', 'Primera Mezcla', 'Elimina tu primer grupo de gotas');
        if (State.cascadeStep >= 3) {
          window.ArcadeJuice?.unlockAchievement('gotas', 'ach_chain3', 'Reacción en Cadena', 'Consigue una Cascada x3');
        }
        if (State.cascadeStep >= 5) {
          window.ArcadeJuice?.unlockAchievement('gotas', 'ach_chain5', 'Maestro de Cascadas', 'Consigue una Cascada x5');
        }
      }

      State.cameraZoom = 1.0 + Math.min(0.12, State.cascadeStep * 0.03);

      const multiplier = Math.pow(2, State.cascadeStep - 1);
      const pointsEarned = step.totalCleared * 20 * multiplier * State.level;
      State.score += pointsEarned;

      if (State.gameMode === 'marathon') {
        const damage = Math.floor(step.totalCleared * 40 * multiplier * (1 + (State.level - 1) * 0.2));
        State.bossHp = Math.max(0, State.bossHp - damage);
        playAudio('boss-hit');
        if (typeof window !== 'undefined') {
          window.ArcadeJuice?.spawnFloat(`-${damage} PV`, CONFIG.VIRTUAL_W / 2, 70, '#ff2255', 13);
        }
        updateBossBarDisplay();
        if (State.bossHp <= 0) {
          defeatBoss();
        }
      } else if (State.gameMode === 'duel') {
        const aiDamage = step.totalCleared * 5 * multiplier;
        State.aiHp = Math.max(0, State.aiHp - aiDamage);
        updateBossBarDisplay();
        if (State.aiHp <= 0) {
          defeatAIDuel();
        }
      }

      playAudio(State.cascadeStep > 1 ? 'cascade' : 'pop');
      if (typeof window !== 'undefined') {
        window.ArcadeJuice?.vibrate(State.cascadeStep > 1 ? [20, 40] : 12);
        window.ArcadeJuice?.shake(Math.min(10, State.cascadeStep * 2), 0.2);
      }

      if (State.cascadeStep > 1) {
        showComboBanner(`¡CASCADA x${State.cascadeStep}! +${pointsEarned}`);
        if (typeof window !== 'undefined') {
          window.ArcadeJuice?.spawnFloat(`x${State.cascadeStep}!`, CONFIG.VIRTUAL_W / 2, 280, '#ffcc00', 16);
        }
      }

      updateHUD();

      GotasVisual.animateMatches(step, () => {
        runCascadeStep();
      });
      return;
    }

    if (step.type === 'settled') {
      State.isCascading = false;
      State.cascadeStep = 0;

      State.level = Math.min(10, 1 + Math.floor(State.score / 1500));
      updateHUD();

      GotasVisualManager.verifySync(State.grid);
      spawnNextPair();
      processQueuedInput();
    }
  }

  function defeatBoss() {
    State.saveData.bossesDefeated++;
    saveGameData();
    window.ArcadeJuice?.unlockAchievement('gotas', 'ach_boss1', 'Cazador de Jefes', 'Vence al primer jefe en Modo Maratón');

    if (State.currentBossIdx >= 4) {
      window.ArcadeJuice?.unlockAchievement('gotas', 'ach_boss_titan', 'Emperador Líquido', 'Vence al Jefe 5: Titanium Blob');
      showComboBanner('¡MARATÓN SUPERADO!');
      setTimeout(() => {
        triggerGameOver('¡Has derrotado a todos los jefes!');
      }, 1500);
      return;
    }

    State.currentBossIdx++;
    const nextB = CONFIG.BOSSES[State.currentBossIdx];
    State.bossHp = nextB.maxHp;
    State.bossMaxHp = nextB.maxHp;
    State.bossTrashTimer = nextB.trashInterval;
    showComboBanner(`¡${nextB.name}!`);
    updateBossBarDisplay();
  }

  function defeatAIDuel() {
    State.saveData.duelWins++;
    saveGameData();
    window.ArcadeJuice?.unlockAchievement('gotas', 'ach_duel_master', 'Duelo Supremo', 'Vence a la IA en Duelo');
    showComboBanner('¡VICTORIA EN DUELO!');
    setTimeout(() => {
      triggerGameOver('¡Victoria sobre tu rival!');
    }, 1500);
  }

  function showComboBanner(text) {
    if (!dom.comboText || !dom.comboBanner) return;
    dom.comboText.textContent = text;
    dom.comboBanner.classList.remove('hidden');
    setTimeout(() => {
      dom.comboBanner.classList.add('hidden');
    }, 1200);
  }

  function triggerGameOver(customReason = null) {
    State.gameOver = true;
    State.started = false;
    stopBGM();

    playAudio('gameover');
    window.ArcadeJuice?.shake(12, 0.4);
    window.ArcadeJuice?.vibrate([60, 80, 120]);

    if (State.score > State.saveData.bestScore) {
      State.saveData.bestScore = State.score;
      saveGameData();
    }

    if (State.gameMode === 'time' && State.score >= 10000) {
      window.ArcadeJuice?.unlockAchievement('gotas', 'ach_time10k', 'Velocidad Líquida', 'Consigue 10,000 pts en Contrarreloj');
    }

    if (dom.finalScore) dom.finalScore.textContent = State.score.toLocaleString();
    if (dom.finalMaxCombo) dom.finalMaxCombo.textContent = `x${State.maxCombo}`;
    if (dom.bestFinalScore) dom.bestFinalScore.textContent = State.saveData.bestScore.toLocaleString();

    if (dom.goTitle && dom.goSub) {
      if (customReason) {
        dom.goTitle.textContent = '¡FIN DE JUEGO!';
        dom.goTitle.style.color = '#ffcc00';
        dom.goSub.textContent = customReason;
      } else {
        dom.goTitle.textContent = '¡FIN DE PARTIDA!';
        dom.goTitle.style.color = '#ff2255';
        dom.goSub.textContent = 'Columna de entrada colapsada';
      }
    }

    setTimeout(() => {
      dom.overlayGameOver?.classList.remove('hidden');
    }, 500);
  }

  function updateHUD() {
    if (!dom.hudScore) return;
    if (State.gameMode === 'time') {
      if (dom.labelStatRight) dom.labelStatRight.textContent = 'TIEMPO';
      if (dom.hudLevel) dom.hudLevel.textContent = `${Math.ceil(State.timeRemaining)}s`;
    } else {
      if (dom.labelStatRight) dom.labelStatRight.textContent = 'NIVEL';
      if (dom.hudLevel) dom.hudLevel.textContent = State.level;
    }
  }

  function updateBossBarDisplay() {
    if (!dom.hudBossBar) return;
    if (State.gameMode === 'marathon') {
      const b = CONFIG.BOSSES[State.currentBossIdx];
      dom.hudBossBar.classList.remove('hidden');
      if (dom.bossIcon) {
        dom.bossIcon.innerHTML = window.ArcadeIcons ? window.ArcadeIcons.get(b.icon, { size: 18 }) : b.icon;
      }
      dom.bossName.textContent = b.name;
      const pct = Math.max(0, Math.min(100, (State.bossHp / State.bossMaxHp) * 100));
      dom.bossHpFill.style.width = `${pct}%`;
      dom.bossHpText.textContent = `${State.bossHp} / ${State.bossMaxHp} PV`;
    } else if (State.gameMode === 'duel') {
      const rival = CONFIG.AI_RIVALS[0];
      dom.hudBossBar.classList.remove('hidden');
      if (dom.bossIcon) {
        dom.bossIcon.innerHTML = window.ArcadeIcons ? window.ArcadeIcons.get(rival.icon, { size: 18 }) : rival.icon;
      }
      dom.bossName.textContent = `RIVAL: ${rival.name}`;
      dom.bossHpFill.style.width = `${State.aiHp}%`;
      dom.bossHpText.textContent = `${Math.ceil(State.aiHp)}% PV`;
    } else {
      dom.hudBossBar.classList.add('hidden');
    }
  }

  // ==========================================
  // ONDAS Y PARTÍCULAS LÍQUIDAS CON POOLING
  // ==========================================
  function spawnSplash(c, r, colorId) {
    const x = getCellX(c);
    const y = getCellY(r);
    const cObj = CONFIG.COLORS.find(col => col.id === colorId) || CONFIG.COLORS[0];
    const count = State.lowQuality ? 6 : 12;

    let spawned = 0;
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = particlePool[i];
      if (!p.active) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 40 + Math.random() * 130;
        p.active = true;
        p.x = x;
        p.y = y;
        p.vx = Math.cos(ang) * spd;
        p.vy = Math.sin(ang) * spd;
        p.color = cObj.core;
        p.life = 0.35;
        p.maxLife = 0.35;
        p.size = 2.5 + Math.random() * 2;
        spawned++;
        if (spawned >= count) break;
      }
    }
  }

  function spawnShockwave(c, r) {
    const x = getCellX(c);
    const y = getCellY(r);

    for (let i = 0; i < MAX_SHOCKWAVES; i++) {
      const sw = shockwavePool[i];
      if (!sw.active) {
        sw.active = true;
        sw.x = x;
        sw.y = y;
        sw.r = 6;
        sw.maxR = State.cellSize * 1.5;
        sw.alpha = 0.8;
        break;
      }
    }
  }

  function countActiveParticles() {
    let count = 0;
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (particlePool[i].active) count++;
    }
    return count;
  }

  function updateParticles(dt) {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = particlePool[i];
      if (!p.active) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt + 120 * dt; // caída con gravedad
      p.life -= dt;
      if (p.life <= 0) p.active = false;
    }

    for (let i = 0; i < MAX_SHOCKWAVES; i++) {
      const sw = shockwavePool[i];
      if (!sw.active) continue;
      sw.r += (sw.maxR - sw.r) * dt * 8;
      sw.alpha -= dt * 2.8;
      if (sw.alpha <= 0) sw.active = false;
    }

    // Burbujas ascendentes de la caverna
    for (let i = 0; i < State.cavernBubbles.length; i++) {
      const b = State.cavernBubbles[i];
      b.y -= b.vy * dt;
      b.wobble += dt * 3;
      b.x += Math.sin(b.wobble) * 0.4;
      if (b.y < -10) {
        b.y = CONFIG.VIRTUAL_H + 10;
        b.x = Math.random() * CONFIG.VIRTUAL_W;
      }
    }

    // Zoom suave de regreso a 1.0
    State.cameraZoom += (1.0 - State.cameraZoom) * dt * 3;
  }

  // ==========================================
  // ACTUALIZACIÓN DE FÍSICA Y BUCLE
  // ==========================================
  function update(dt) {
    if (!State.started || State.paused || State.gameOver) return;

    // Actualizar motor de interpolación
    TweenEngine?.update(dt);

    // Conteo suave de puntos (animación de marcador)
    State.displayedScore += (State.score - State.displayedScore) * Math.min(1, dt * 10);
    if (Math.abs(State.score - State.displayedScore) < 1) State.displayedScore = State.score;
    if (dom.hudScore) dom.hudScore.textContent = Math.floor(State.displayedScore).toLocaleString();

    // Ondulación líquida en reposo para todas las gotas asentadas
    const vg = GotasVisualManager.visualGrid;
    for (let r = 0; r < CONFIG.ROWS; r++) {
      for (let c = 0; c < CONFIG.COLS; c++) {
        const s = vg[r][c];
        if (s && s.active && !s.isFalling && !s.isPopping) {
          s.wobblePhase += dt * 2.8;
          s.scaleX = 1 + Math.sin(s.wobblePhase) * 0.035;
          s.scaleY = 1 - Math.sin(s.wobblePhase) * 0.035;
        }
      }
    }

    // Hitstop de Juice
    const frozen = window.ArcadeJuice?.update(dt);
    if (frozen) return;

    // Modo Contrarreloj
    if (State.gameMode === 'time') {
      State.timeRemaining -= dt;
      if (State.timeRemaining <= 0) {
        State.timeRemaining = 0;
        updateHUD();
        triggerGameOver(`¡Tiempo agotado! Puntos: ${State.score}`);
        return;
      }
      updateHUD();
    }

    // Modo Maratón (Basura del Jefe)
    if (State.gameMode === 'marathon' && !State.isCascading) {
      State.bossTrashTimer -= dt;
      if (State.bossTrashTimer <= 2.0 && State.bossTrashTimer + dt > 2.0) {
        dom.trashWarningBanner?.classList.remove('hidden');
        playAudio('trash');
      }
      if (State.bossTrashTimer <= 0) {
        dom.trashWarningBanner?.classList.add('hidden');
        const b = CONFIG.BOSSES[State.currentBossIdx];
        const trashStep = GotasLogic.stepTrash(State.grid, b.trashAmount);
        State.bossTrashTimer = b.trashInterval;
        playAudio('trash');
        window.ArcadeJuice?.shake(6, 0.25);
        window.ArcadeJuice?.vibrate(15);

        GotasVisual.animateTrashDrop(trashStep, () => {
          startCascades();
        });
      }
    }

    // Modo Duelo IA
    if (State.gameMode === 'duel' && !State.isCascading) {
      State.aiTimer += dt;
      const rival = CONFIG.AI_RIVALS[0];
      if (State.aiTimer >= rival.reactionSpeed * 10) {
        State.aiTimer = 0;
        if (Math.random() < rival.comboSkill) {
          const trashStep = GotasLogic.stepTrash(State.grid, 2);
          playAudio('trash');
          window.ArcadeJuice?.spawnFloat('¡ATAQUE RIVAL!', CONFIG.VIRTUAL_W / 2, 100, '#ff2255', 12);
          GotasVisual.animateTrashDrop(trashStep, () => {
            startCascades();
          });
        }
      }
    }

    // Si está en proceso de cascadas
    if (State.isCascading) {
      updateParticles(dt);
      return;
    }

    // Descenso de la pareja activa
    if (State.activePair) {
      const currentInterval = State.isFastDrop ? CONFIG.FAST_DROP_INTERVAL :
                              Math.max(0.18, CONFIG.BASE_DROP_INTERVAL - (State.level - 1) * 0.07);

      // Suavizar posición visual vertical hacia las celdas lógicas
      const targetY1 = getCellY(State.activePair.r1);
      const targetY2 = getCellY(State.activePair.r2);
      State.activePair.vy1 += (targetY1 - State.activePair.vy1) * Math.min(1, dt * 20);
      State.activePair.vy2 += (targetY2 - State.activePair.vy2) * Math.min(1, dt * 20);

      State.dropTimer += dt;
      if (State.dropTimer >= currentInterval) {
        State.dropTimer = 0;

        if (canMove(State.activePair, 0, 1)) {
          State.activePair.r1 += 1;
          State.activePair.r2 += 1;
        } else {
          lockActivePair();
        }
      }
    }

    updateParticles(dt);
  }

  // ==========================================
  // RENDERIZADO Y FUSIÓN DE FLUIDOS
  // ==========================================
  let dropAtlasCanvas = null;
  const ATLAS_SIZE = 48;

  function initDropAtlas() {
    if (typeof document === 'undefined') return;
    dropAtlasCanvas = document.createElement('canvas');
    dropAtlasCanvas.width = ATLAS_SIZE * 7;
    dropAtlasCanvas.height = ATLAS_SIZE * 3;
    const actx = dropAtlasCanvas.getContext('2d');

    // Pre-renderizar gotas de colores
    for (let i = 0; i < CONFIG.COLORS.length; i++) {
      const col = CONFIG.COLORS[i];
      renderVectorDropToAtlas(actx, i * ATLAS_SIZE, 0, ATLAS_SIZE, col.id, 'normal');
      renderVectorDropToAtlas(actx, i * ATLAS_SIZE, ATLAS_SIZE, ATLAS_SIZE, col.id, 'combo');
      renderVectorDropToAtlas(actx, i * ATLAS_SIZE, ATLAS_SIZE * 2, ATLAS_SIZE, col.id, 'danger');
    }

    // Pre-renderizar Basura (índice 5)
    renderVectorDropToAtlas(actx, 5 * ATLAS_SIZE, 0, ATLAS_SIZE, CONFIG.TRASH_ID, 'normal');
    renderVectorDropToAtlas(actx, 5 * ATLAS_SIZE, ATLAS_SIZE, ATLAS_SIZE, CONFIG.TRASH_ID, 'normal');
    renderVectorDropToAtlas(actx, 5 * ATLAS_SIZE, ATLAS_SIZE * 2, ATLAS_SIZE, CONFIG.TRASH_ID, 'normal');

    // Pre-renderizar Arcoíris (índice 6)
    renderVectorDropToAtlas(actx, 6 * ATLAS_SIZE, 0, ATLAS_SIZE, CONFIG.RAINBOW_ID, 'normal');
    renderVectorDropToAtlas(actx, 6 * ATLAS_SIZE, ATLAS_SIZE, ATLAS_SIZE, CONFIG.RAINBOW_ID, 'normal');
    renderVectorDropToAtlas(actx, 6 * ATLAS_SIZE, ATLAS_SIZE * 2, ATLAS_SIZE, CONFIG.RAINBOW_ID, 'normal');
  }

  function renderVectorDropToAtlas(ctx, x, y, size, colorId, expressionType) {
    const cx = x + size / 2;
    const cy = y + size / 2;
    const r = size * 0.40;
    render3DGelDrop(ctx, cx, cy, r, colorId, 1, 1, expressionType === 'danger', 1, 0, 1, 1, 0, expressionType === 'combo');
  }

  function cacheStaticBackground() {
    if (typeof document === 'undefined') return;
    State.bgCanvas = document.createElement('canvas');
    State.bgCanvas.width = CONFIG.VIRTUAL_W;
    State.bgCanvas.height = CONFIG.VIRTUAL_H;
    const bgCtx = State.bgCanvas.getContext('2d');

    // Gradiente de caverna
    const grad = bgCtx.createLinearGradient(0, 0, 0, CONFIG.VIRTUAL_H);
    grad.addColorStop(0, '#0a0d18');
    grad.addColorStop(0.5, '#101528');
    grad.addColorStop(1, '#080a12');
    bgCtx.fillStyle = grad;
    bgCtx.fillRect(0, 0, CONFIG.VIRTUAL_W, CONFIG.VIRTUAL_H);

    // Pozo del tablero y marco
    const ox = State.originX;
    const oy = State.originY;
    const bw = CONFIG.COLS * State.cellSize;
    const bh = CONFIG.ROWS * State.cellSize;

    bgCtx.fillStyle = '#060810';
    bgCtx.fillRect(ox, oy, bw, bh);

    bgCtx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    bgCtx.lineWidth = 1;
    for (let c = 1; c < CONFIG.COLS; c++) {
      bgCtx.beginPath();
      bgCtx.moveTo(ox + c * State.cellSize, oy);
      bgCtx.lineTo(ox + c * State.cellSize, oy + bh);
      bgCtx.stroke();
    }
    for (let r = 1; r < CONFIG.ROWS; r++) {
      bgCtx.beginPath();
      bgCtx.moveTo(ox, oy + r * State.cellSize);
      bgCtx.lineTo(ox + bw, oy + r * State.cellSize);
      bgCtx.stroke();
    }

    bgCtx.strokeStyle = '#283454';
    bgCtx.lineWidth = 4;
    bgCtx.strokeRect(ox - 2, oy - 2, bw + 4, bh + 4);

    // Zona de advertencia de entrada
    bgCtx.fillStyle = 'rgba(255, 34, 85, 0.16)';
    bgCtx.fillRect(ox + 2 * State.cellSize, oy, State.cellSize, State.cellSize);
  }

  /**
   * Dibuja los puentes de fluido (metaballs / conexiones líquidas) entre gotas contiguas del mismo color
   */
  function renderFusionBridges(ctx) {
    const rows = CONFIG.ROWS;
    const cols = CONFIG.COLS;
    const cs = State.cellSize;
    const vg = GotasVisualManager.visualGrid;

    ctx.save();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const s1 = vg[r][c];
        if (!s1 || !s1.active || s1.isPopping || s1.isFalling) continue;
        const col1 = s1.color;
        if (col1 === 0 || col1 === CONFIG.TRASH_ID || col1 === CONFIG.RAINBOW_ID) continue;

        const cObj = CONFIG.COLORS.find(col => col.id === col1) || CONFIG.COLORS[0];

        // Vecina derecha (r, c+1)
        if (c + 1 < cols) {
          const s2 = vg[r][c + 1];
          if (s2 && s2.active && !s2.isPopping && !s2.isFalling && s2.color === col1) {
            drawLiquidBridge(ctx, s1.x, s1.y, s2.x, s2.y, cs * 0.44, cObj, s1.wobblePhase);
          }
        }

        // Vecina inferior (r+1, c)
        if (r + 1 < rows) {
          const s2 = vg[r + 1][c];
          if (s2 && s2.active && !s2.isPopping && !s2.isFalling && s2.color === col1) {
            drawLiquidBridge(ctx, s1.x, s1.y, s2.x, s2.y, cs * 0.44, cObj, s1.wobblePhase);
          }
        }
      }
    }
    ctx.restore();
  }

  function drawLiquidBridge(ctx, x1, y1, x2, y2, width, cObj, wobblePhase) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    if (dist <= 0) return;

    const angle = Math.atan2(dy, dx);
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const breathing = Math.sin(wobblePhase) * 1.5;
    const bridgeW = width + breathing;

    ctx.save();
    ctx.translate(midX, midY);
    ctx.rotate(angle);

    ctx.fillStyle = cObj.core;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(-dist / 2, -bridgeW / 2, dist, bridgeW, bridgeW / 2);
    } else {
      ctx.rect(-dist / 2, -bridgeW / 2, dist, bridgeW);
    }
    ctx.fill();

    // Brillo superior
    ctx.strokeStyle = cObj.bubble;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-dist * 0.35, -bridgeW * 0.28);
    ctx.lineTo(dist * 0.35, -bridgeW * 0.28);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Dibuja una gota líquida con expresiones reactivas, transformaciones y brillo interior
   */
  function render3DGelDrop(ctx, cx, cy, r, colorId, sx = 1, sy = 1, isDanger = false, scale = 1, rotation = 0, alpha = 1, brightness = 1, wobblePhase = 0, isCombo = false) {
    ctx.save();
    ctx.translate(cx, cy);
    if (rotation !== 0) ctx.rotate(rotation);
    if (scale !== 1 || sx !== 1 || sy !== 1) ctx.scale(scale * sx, scale * sy);
    if (alpha < 1) ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    if (colorId === CONFIG.TRASH_ID) {
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(-r * 0.35, -r * 0.35, r * 0.25, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-6, -2, 4, 2);
      ctx.fillRect(2, -2, 4, 2);

      ctx.restore();
      return;
    }

    if (colorId === CONFIG.RAINBOW_ID) {
      const rainGrad = ctx.createLinearGradient(-r, -r, r, r);
      rainGrad.addColorStop(0, '#ff0055');
      rainGrad.addColorStop(0.25, '#ffaa00');
      rainGrad.addColorStop(0.5, '#00e676');
      rainGrad.addColorStop(0.75, '#0088ff');
      rainGrad.addColorStop(1, '#b388ff');

      ctx.fillStyle = rainGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-r * 0.35, -r * 0.35, r * 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-4, -1, 3, 0, Math.PI * 2);
      ctx.arc(4, -1, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(-4, -1, 1.5, 0, Math.PI * 2);
      ctx.arc(4, -1, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      return;
    }

    const cObj = CONFIG.COLORS.find(col => col.id === colorId) || CONFIG.COLORS[0];

    // Sombra suave proyectada
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.75, r * 0.8, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cuerpo esférico 3D líquido
    const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
    grad.addColorStop(0, cObj.light);
    grad.addColorStop(0.4, cObj.core);
    grad.addColorStop(1, cObj.dark);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Brillo interior traslúcido
    ctx.fillStyle = cObj.bubble;
    ctx.globalAlpha = 0.4 * alpha;
    ctx.beginPath();
    ctx.arc(r * 0.2, r * 0.2, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha;

    // Destello blanco especular principal
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.35, r * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // Destello por brillo de eliminación (hit flash blanco)
    if (brightness > 1) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.85, (brightness - 1) * 1.2)})`;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.05, 0, Math.PI * 2);
      ctx.fill();
    }

    // Expresión facial reactiva
    const happyCombo = isCombo || (State.isCascading && State.cascadeStep > 0);

    if (isDanger) {
      // Expresión asustada
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-5, -2, 4, 0, Math.PI * 2);
      ctx.arc(5, -2, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0a0e1c';
      ctx.beginPath();
      ctx.arc(-5, -2, 2, 0, Math.PI * 2);
      ctx.arc(5, -2, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#0a0e1c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 5, 2.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(8, -6, 2, 0, Math.PI * 2);
      ctx.fill();

    } else if (happyCombo) {
      // Expresión alegre
      ctx.strokeStyle = '#0a0e1c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-4, -1, 3, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(4, -1, 3, Math.PI, 0);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 3, 3, 0, Math.PI);
      ctx.stroke();

    } else {
      // Expresión normal
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-4, 0, 3, 0, Math.PI * 2);
      ctx.arc(4, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0a0e1c';
      ctx.beginPath();
      ctx.arc(-3.5, 0, 1.5, 0, Math.PI * 2);
      ctx.arc(4.5, 0, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#0a0e1c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 4, 2, 0, Math.PI);
      ctx.stroke();
    }

    ctx.restore();
  }

  function renderRainbowBeams(ctx) {
    if (GotasVisualManager.rainbowBeams.length === 0) return;
    ctx.save();
    for (const b of GotasVisualManager.rainbowBeams) {
      ctx.globalAlpha = b.alpha;
      const curX = b.x1 + (b.x2 - b.x1) * b.progress;
      const curY = b.y1 + (b.y2 - b.y1) * b.progress;

      const beamGrad = ctx.createLinearGradient(b.x1, b.y1, curX, curY);
      beamGrad.addColorStop(0, '#ff0055');
      beamGrad.addColorStop(0.3, '#ffaa00');
      beamGrad.addColorStop(0.6, '#00e676');
      beamGrad.addColorStop(1, '#00e5ff');

      ctx.strokeStyle = beamGrad;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(curX, curY);
      ctx.stroke();
    }
    ctx.restore();
  }

  function renderShockwaves(ctx) {
    ctx.save();
    for (let i = 0; i < MAX_SHOCKWAVES; i++) {
      const sw = shockwavePool[i];
      if (!sw.active) continue;
      ctx.strokeStyle = `rgba(0, 240, 255, ${sw.alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function renderParticles(ctx) {
    ctx.save();
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = particlePool[i];
      if (!p.active) continue;
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function renderPreview() {
    if (!dom.pCtx) return;
    const ctx = dom.pCtx;
    ctx.clearRect(0, 0, 60, 60);
    if (!State.nextPair) return;
    render3DGelDrop(ctx, 30, 42, 13, State.nextPair.color1);
    render3DGelDrop(ctx, 30, 18, 13, State.nextPair.color2);
  }

  // ==========================================
  // DIAGNÓSTICO Y OVERLAY (?debug=1)
  // ==========================================
  const isDebug = typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('debug') === '1');
  let frameCount = 0;
  let lastFpsCheck = 0;
  let fps = 60;
  let frameTime = 16.6;
  let lowFpsStreak = 0;

  function renderDebugOverlay(ctx) {
    if (!isDebug) return;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
    ctx.fillRect(8, 8, 175, 96);
    ctx.strokeStyle = '#00e676';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, 175, 96);

    ctx.fillStyle = '#00e676';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`FPS: ${Math.round(fps)} (${frameTime.toFixed(1)}ms)`, 14, 22);
    ctx.fillText(`Sprites: ${GotasVisualManager.activeCount()} / 120`, 14, 36);
    ctx.fillText(`Tweens: ${TweenEngine ? TweenEngine.activeCount : 0}`, 14, 50);
    ctx.fillText(`Partículas: ${countActiveParticles()} / 150`, 14, 64);

    const syncOk = GotasVisualManager.checkSync(State.grid);
    ctx.fillStyle = syncOk ? '#00e676' : '#ff2255';
    ctx.fillText(`Sync: ${syncOk ? '100% OK' : '¡DESINCRONIZADO!'}`, 14, 78);

    ctx.fillStyle = State.lowQuality ? '#ffcc00' : '#38bdf8';
    ctx.fillText(`Calidad: ${State.lowQuality ? 'Baja (Auto)' : 'Alta 60FPS'}`, 14, 92);
    ctx.restore();
  }

  function render() {
    if (!dom.ctx) return;
    const ctx = dom.ctx;
    const W = CONFIG.VIRTUAL_W;
    const H = CONFIG.VIRTUAL_H;

    ctx.save();
    ctx.resetTransform();
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

    const shakeX = window.ArcadeJuice?.shakeX || 0;
    const shakeY = window.ArcadeJuice?.shakeY || 0;
    const finalScale = State.scale * State.cameraZoom;

    ctx.scale(dpr * finalScale, dpr * finalScale);
    ctx.translate(shakeX, shakeY);

    // 1. Fondo estático cacheado
    if (State.bgCanvas) {
      ctx.drawImage(State.bgCanvas, 0, 0);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0a0d18');
      grad.addColorStop(0.5, '#101528');
      grad.addColorStop(1, '#080a12');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // Burbujas bioluminiscentes
    ctx.save();
    for (const b of State.cavernBubbles) {
      ctx.fillStyle = `rgba(0, 230, 118, ${b.alpha})`;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 2. Puentes de fluido entre gotas vecinas
    renderFusionBridges(ctx);

    // 3. Gotas asentadas en el tablero (dibujadas desde visualGrid)
    const vg = GotasVisualManager.visualGrid;
    for (let r = 0; r < CONFIG.ROWS; r++) {
      for (let c = 0; c < CONFIG.COLS; c++) {
        const s = vg[r][c];
        if (s && s.active) {
          render3DGelDrop(ctx, s.x, s.y, State.cellSize * 0.42, s.color, s.scaleX, s.scaleY, s.isDanger, s.scale, s.rotation, s.alpha, s.brightness, s.wobblePhase);
        }
      }
    }

    // 4. Sprites transitorios (en eliminación, destello o explosión)
    for (const ts of GotasVisualManager.transientSprites) {
      if (ts.active) {
        render3DGelDrop(ctx, ts.x, ts.y, State.cellSize * 0.42, ts.color, ts.scaleX, ts.scaleY, ts.isDanger, ts.scale, ts.rotation, ts.alpha, ts.brightness, ts.wobblePhase);
      }
    }

    // 5. Pareja activa que desciende
    if (State.activePair) {
      const p = State.activePair;
      const cs = State.cellSize;

      // Cordón elástico de gel que conecta la pareja
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(p.vx1, p.vy1);
      ctx.lineTo(p.vx2, p.vy2);
      ctx.stroke();

      const fallingSy = State.isFastDrop ? 1.25 : 1.1;
      const fallingSx = State.isFastDrop ? 0.8 : 0.9;
      render3DGelDrop(ctx, p.vx1, p.vy1, cs * 0.42, p.color1, fallingSx, fallingSy, false);
      render3DGelDrop(ctx, p.vx2, p.vy2, cs * 0.42, p.color2, fallingSx, fallingSy, false);
    }

    // 6. Rayos láser de activación arcoíris
    renderRainbowBeams(ctx);

    // 7. Ondas líquidas expansivas
    renderShockwaves(ctx);

    // 8. Partículas
    renderParticles(ctx);

    // 9. Textos flotantes
    window.ArcadeJuice?.drawFloats(ctx);

    // 10. Overlay de diagnóstico
    renderDebugOverlay(ctx);

    ctx.restore();
  }

  // ==========================================
  // BUCLE DE JUEGO (RAF) Y AUTO-TUNER
  // ==========================================
  let lastTime = 0;
  function gameLoop(timestamp) {
    if (!lastTime) {
      lastTime = timestamp;
      lastFpsCheck = timestamp;
    }
    const deltaMs = timestamp - lastTime;
    const dt = Math.min(deltaMs / 1000, 0.05);
    lastTime = timestamp;

    frameCount++;
    frameTime = deltaMs;

    if (timestamp - lastFpsCheck >= 500) {
      fps = (frameCount * 1000) / (timestamp - lastFpsCheck);
      frameCount = 0;
      lastFpsCheck = timestamp;

      // Auto-tuner: si FPS cae por debajo de 55, activar modo bajo detalle
      if (fps < 55) {
        lowFpsStreak++;
        if (lowFpsStreak >= 2) State.lowQuality = true;
      } else {
        lowFpsStreak = 0;
      }
    }

    update(dt);
    render();

    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(gameLoop);
    }
  }

  // ==========================================
  // ENTRADAS Y CONTROLES
  // ==========================================
  function setupInputs() {
    if (!dom.canvas) return;
    const canvas = dom.canvas;
    let startX = 0;
    let startY = 0;

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (!State.started) return;
      window.ArcadeAudio?.initCtx();
      if (e.touches.length > 0) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!State.started || e.touches.length === 0) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;

      if (Math.abs(dx) > 32) {
        movePair(dx > 0 ? 1 : -1);
        startX = e.touches[0].clientX;
      }
      if (dy > 38) {
        State.isFastDrop = true;
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      State.isFastDrop = false;
      if (e.changedTouches.length > 0) {
        const dx = Math.abs(e.changedTouches[0].clientX - startX);
        const dy = Math.abs(e.changedTouches[0].clientY - startY);
        if (dx < 12 && dy < 12) {
          rotatePair();
        }
      }
    }, { passive: false });

    // Botones táctiles
    dom.btnLeft?.addEventListener('click', () => movePair(-1));
    dom.btnRight?.addEventListener('click', () => movePair(1));
    dom.btnRotate?.addEventListener('click', rotatePair);
    dom.btnDrop?.addEventListener('pointerdown', () => { State.isFastDrop = true; });
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerup', () => { State.isFastDrop = false; });
    }

    // Teclado
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        if (e.key === 'p' || e.key === 'P') {
          togglePause();
          return;
        }
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') movePair(-1);
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') movePair(1);
        if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w' || e.key === 'W') rotatePair();
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') State.isFastDrop = true;
      });

      window.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') State.isFastDrop = false;
      });
    }
  }

  function togglePause() {
    if (!State.started || State.gameOver) return;
    State.paused = !State.paused;
    dom.overlayPause?.classList.toggle('hidden', !State.paused);
    if (State.paused) stopBGM();
    else startBGM();
  }

  function startGame() {
    window.ArcadeAudio?.initCtx();
    State.grid = GotasLogic.createGrid();
    GotasVisualManager.clear();

    State.started = true;
    State.paused = false;
    State.gameOver = false;
    State.score = 0;
    State.displayedScore = 0;
    State.level = 1;
    State.maxCombo = 1;
    State.isCascading = false;
    State.activePair = null;
    State.nextPair = null;
    State.timeRemaining = 120;
    State.currentBossIdx = 0;
    State.bossHp = CONFIG.BOSSES[0].maxHp;
    State.bossMaxHp = CONFIG.BOSSES[0].maxHp;
    State.bossTrashTimer = CONFIG.BOSSES[0].trashInterval;
    State.aiHp = 100;
    State.queuedInputs.length = 0;

    dom.startCard?.classList.add('hidden');
    dom.overlayPause?.classList.add('hidden');
    dom.overlayGameOver?.classList.add('hidden');
    dom.trashWarningBanner?.classList.add('hidden');

    updateBossBarDisplay();
    updateHUD();
    spawnNextPair();
    startBGM();

    window.ArcadeJuice?.trackPlay('gotas', 0);
  }

  // ==========================================
  // MODALES Y SETUP DE UI
  // ==========================================
  function renderAchievementsModal() {
    if (!dom.achList) return;
    const list = [
      { id: 'ach_first_clear', title: 'Primera Mezcla', desc: 'Disuelve tu primer grupo de gotas de gel', icon: 'drop' },
      { id: 'ach_chain3', title: 'Reacción en Cadena', desc: 'Consigue una Cascada x3 automática', icon: 'zap' },
      { id: 'ach_chain5', title: 'Maestro de Cascadas', desc: 'Consigue una Cascada x5 consecutiva', icon: 'wave' },
      { id: 'ach_rainbow', title: 'Prisma Gelatinoso', desc: 'Activa y disuelve con una Gota Arcoíris', icon: 'rainbow' },
      { id: 'ach_boss1', title: 'Cazador de Jefes', desc: 'Derrota al primer jefe en Modo Maratón', icon: 'alien' },
      { id: 'ach_boss_titan', title: 'Emperador Líquido', desc: 'Derrota al Jefe 5: Titanium Blob', icon: 'crown' },
      { id: 'ach_time10k', title: 'Velocidad Líquida', desc: 'Consigue 10,000 pts en Contrarreloj', icon: 'clock' },
      { id: 'ach_duel_master', title: 'Duelo Supremo', desc: 'Gana un duelo contra la IA de Gotas', icon: 'swords' }
    ];

    dom.achList.innerHTML = '';
    list.forEach(ach => {
      const unlocked = window.ArcadeJuice?.hasAchievement('gotas', ach.id);
      const row = document.createElement('div');
      row.className = `ach-item ${unlocked ? 'unlocked' : ''}`;
      const iconMarkup = unlocked
        ? (window.ArcadeIcons ? window.ArcadeIcons.get(ach.icon, { size: 20 }) : ach.icon)
        : (window.ArcadeIcons ? window.ArcadeIcons.get('lock', { size: 20 }) : '');
      row.innerHTML = `
        <span class="ach-icon">${iconMarkup}</span>
        <div>
          <div class="ach-title">${ach.title}</div>
          <div class="ach-desc">${ach.desc}</div>
        </div>
        <span class="ach-status">${unlocked ? 'COMPLETADO' : 'BLOQUEADO'}</span>
      `;
      dom.achList.appendChild(row);
    });
  }

  function setupUI() {
    dom.btnStart?.addEventListener('click', startGame);
    dom.btnRetry?.addEventListener('click', startGame);
    dom.btnRestartPause?.addEventListener('click', startGame);
    dom.btnPauseHeader?.addEventListener('click', togglePause);
    dom.btnResume?.addEventListener('click', togglePause);

    // Selector de Modos
    if (typeof document !== 'undefined') {
      document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          State.gameMode = btn.dataset.mode;

          if (State.gameMode === 'normal') {
            if (dom.modeDescTitle) dom.modeDescTitle.textContent = 'MODO NORMAL';
            if (dom.modeDescP) dom.modeDescP.textContent = 'Combina 4 o más gotas del mismo color. La velocidad y los colores aumentan progresivamente.';
          } else if (State.gameMode === 'marathon') {
            if (dom.modeDescTitle) dom.modeDescTitle.textContent = 'MARATÓN DE JEFES (5 JEFES)';
            if (dom.modeDescP) dom.modeDescP.textContent = 'Enfréntate a 5 jefes con barra de vida que lanzan gotas de basura inerte a tu tablero. ¡Daña con combos!';
          } else if (State.gameMode === 'time') {
            if (dom.modeDescTitle) dom.modeDescTitle.textContent = 'MODO CONTRARRELOJ (120s)';
            if (dom.modeDescP) dom.modeDescP.textContent = 'Tienes 2 minutos para desatar tantas cascadas y puntos como puedas antes de que se agote el cronómetro.';
          } else if (State.gameMode === 'duel') {
            if (dom.modeDescTitle) dom.modeDescTitle.textContent = 'DUELO CONTRA IA';
            if (dom.modeDescP) dom.modeDescP.textContent = 'Combate frente a un rival digital. Cada cascada que logres le inflige daño directo hasta vencerlo.';
          }
        });
      });
    }

    // Tutorial Interactivo
    let tutPage = 1;
    function updateTutView() {
      dom.tutStep1?.classList.toggle('hidden', tutPage !== 1);
      dom.tutStep2?.classList.toggle('hidden', tutPage !== 2);
      dom.tutStep3?.classList.toggle('hidden', tutPage !== 3);
      if (dom.tutPageIndicator) dom.tutPageIndicator.textContent = `${tutPage} / 3`;
    }
    dom.btnTutorialHeader?.addEventListener('click', () => {
      tutPage = 1;
      updateTutView();
      dom.modalTutorial?.classList.remove('hidden');
    });
    dom.btnTutNext?.addEventListener('click', () => {
      tutPage = Math.min(3, tutPage + 1);
      updateTutView();
    });
    dom.btnTutPrev?.addEventListener('click', () => {
      tutPage = Math.max(1, tutPage - 1);
      updateTutView();
    });
    dom.btnCloseTut?.addEventListener('click', () => {
      dom.modalTutorial?.classList.add('hidden');
    });

    // Logros
    dom.btnAchievementsHeader?.addEventListener('click', () => {
      renderAchievementsModal();
      dom.modalAchievements?.classList.remove('hidden');
    });
    dom.btnCloseAch?.addEventListener('click', () => {
      dom.modalAchievements?.classList.add('hidden');
    });

    // Opciones y Accesibilidad
    function openOptions() {
      if (dom.optSfx) dom.optSfx.checked = window.ArcadeJuice?.getOption('sfx', true);
      if (dom.optBgm) dom.optBgm.checked = window.ArcadeJuice?.getOption('bgm', true);
      if (dom.optVibration) dom.optVibration.checked = window.ArcadeJuice?.getOption('vibration', true);
      if (dom.optContrast) dom.optContrast.checked = window.ArcadeJuice?.getOption('contrast', false);
      if (dom.optFastAnim) dom.optFastAnim.checked = window.ArcadeJuice?.getOption('fastAnim', false);
      dom.modalOptions?.classList.remove('hidden');
    }
    dom.btnOptionsHeader?.addEventListener('click', openOptions);
    dom.btnPauseOptions?.addEventListener('click', openOptions);
    dom.btnCloseOptions?.addEventListener('click', () => {
      window.ArcadeJuice?.setOption('sfx', dom.optSfx?.checked);
      window.ArcadeJuice?.setOption('bgm', dom.optBgm?.checked);
      window.ArcadeJuice?.setOption('vibration', dom.optVibration?.checked);
      window.ArcadeJuice?.setOption('contrast', dom.optContrast?.checked);
      const isFast = dom.optFastAnim ? dom.optFastAnim.checked : false;
      window.ArcadeJuice?.setOption('fastAnim', isFast);
      State.fastAnim = isFast;

      document.body?.classList.toggle('high-contrast', dom.optContrast?.checked);

      if (!dom.optBgm?.checked) stopBGM();
      else if (State.started && !State.paused && !State.gameOver) startBGM();

      dom.modalOptions?.classList.add('hidden');
    });

    // Toggle sonido
    dom.btnSoundToggle?.addEventListener('click', () => {
      if (window.ArcadeAudio) {
        const muted = window.ArcadeAudio.toggleMute();
        dom.iconSoundOn?.classList.toggle('hidden', muted);
        dom.iconSoundOff?.classList.toggle('hidden', !muted);
        if (muted) stopBGM();
        else if (State.started && !State.paused) startBGM();
      }
    });

    if (window.ArcadeJuice?.getOption('contrast', false)) {
      document.body?.classList.add('high-contrast');
    }
  }

  function init() {
    handleResize();
    loadGameData();
    initDropAtlas();
    cacheStaticBackground();
    setupInputs();
    setupUI();

    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(gameLoop);
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', init);
  }

  // ==========================================
  // EXPORTACIÓN PARA PRUEBAS NODE
  // ==========================================
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      CONFIG,
      GotasLogic,
      DropVisualSprite,
      GotasVisualManager,
      GotasVisual,
      State
    };
  }
})();
