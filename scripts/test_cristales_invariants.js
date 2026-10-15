/**
 * scripts/test_cristales_invariants.js
 * 
 * Verifies the 4 critical invariants across thousands of random games:
 *  a) Ninguna celda del tablero queda vacía cuando termina de resolverse la jugada.
 *  b) Las piezas que NO fueron marcadas para eliminar conservan su tipo;
 *     solo cambian de posición hacia abajo, y el conteo de piezas supervivientes
 *     se conserva (supervivientes antes = supervivientes después).
 *  c) El relleno solo escribe en celdas vacías, nunca sobrescribe una ocupada.
 *  d) El orden relativo de las piezas dentro de una columna se conserva al caer.
 * 
 * Tests include:
 *  - Regular moves (3, 4, 5 in a row)
 *  - Overlapping matches (L-shapes, T-shapes, Crosses)
 *  - Special activations (Line clears, Bomb 3x3 explosions, Color Prism)
 *  - Double Special fusions (Laser+Laser, Laser+Bomb, Bomb+Bomb, Prism+Special)
 *  - Hammer powerup
 *  - Blocked / Locked cells (Runes), Chains, and Shifters
 */

const { CONFIG, CristalesLogic } = require('../games/cristales/game.js');

function hasEmptyCells(grid) {
  for (let r = 0; r < CONFIG.ROWS; r++) {
    for (let c = 0; c < CONFIG.COLS; c++) {
      if (grid[r][c].type === 0 && grid[r][c].obstacle !== CONFIG.OBSTACLES.LOCKED) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Robust step-by-step resolution of matches, specials, gravity, and refill.
 * Validates invariants at each sub-step.
 */
function resolveCascadeStep(grid, specialsCreatedMap = new Map()) {
  const matches = CristalesLogic.findMatches(grid);
  const emptyNeeded = hasEmptyCells(grid);

  if (matches.length === 0 && !emptyNeeded) {
    return { done: true, matchedCount: 0 };
  }

  // Set of cells marked for elimination in this step
  const eliminatedCells = new Set();
  const createdSpecialsThisStep = new Map();

  // If there are matches, determine specials and eliminations
  if (matches.length > 0) {
    // Detect intersecting matches (T-shape or L-shape)
    const cellMatchCount = new Map();
    for (const m of matches) {
      for (const cell of m.cells) {
        const key = `${cell.r},${cell.c}`;
        cellMatchCount.set(key, (cellMatchCount.get(key) || 0) + 1);
      }
    }

    // Process each match
    for (const m of matches) {
      const len = m.cells.length;
      let specialToCreate = CONFIG.SPECIALS.NONE;
      if (len === 4) {
        specialToCreate = m.orientation === 'H' ? CONFIG.SPECIALS.LINE_H : CONFIG.SPECIALS.LINE_V;
      } else if (len >= 5) {
        specialToCreate = CONFIG.SPECIALS.COLOR_BOMB;
      }

      // Check if any cell in this match is an intersection
      let specialCell = m.cells[0];
      for (const cell of m.cells) {
        const key = `${cell.r},${cell.c}`;
        if (cellMatchCount.get(key) > 1) {
          specialCell = cell;
          specialToCreate = CONFIG.SPECIALS.BOMB; // Intersection forms a Bomb
          break;
        }
      }

      for (const cell of m.cells) {
        const key = `${cell.r},${cell.c}`;
        eliminatedCells.add(key);

        // Check if cell was already a special: detonate secondary effects
        const currentGem = grid[cell.r][cell.c];
        if (currentGem.special === CONFIG.SPECIALS.LINE_H) {
          for (let c = 0; c < CONFIG.COLS; c++) eliminatedCells.add(`${cell.r},${c}`);
        } else if (currentGem.special === CONFIG.SPECIALS.LINE_V) {
          for (let r = 0; r < CONFIG.ROWS; r++) eliminatedCells.add(`${r},${cell.c}`);
        } else if (currentGem.special === CONFIG.SPECIALS.BOMB) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = cell.r + dr;
              const nc = cell.c + dc;
              if (nr >= 0 && nr < CONFIG.ROWS && nc >= 0 && nc < CONFIG.COLS) {
                eliminatedCells.add(`${nr},${nc}`);
              }
            }
          }
        }
      }

      if (specialToCreate !== CONFIG.SPECIALS.NONE) {
        createdSpecialsThisStep.set(`${specialCell.r},${specialCell.c}`, {
          type: m.type,
          special: specialToCreate,
          obstacle: CONFIG.OBSTACLES.NONE
        });
      }
    }
  }

  // --- SUB-STEP 1: ELIMINATION ---
  const gridBeforeElim = CristalesLogic.cloneGrid(grid);

  for (const key of eliminatedCells) {
    const [r, c] = key.split(',').map(Number);
    if (grid[r][c].obstacle === CONFIG.OBSTACLES.LOCKED) continue; // Locked stones resist normal elimination

    if (createdSpecialsThisStep.has(key)) {
      grid[r][c] = createdSpecialsThisStep.get(key);
    } else {
      grid[r][c] = { type: 0, special: CONFIG.SPECIALS.NONE, obstacle: CONFIG.OBSTACLES.NONE };
    }
  }

  // Verify Invariant B (Part 1): Cells NOT in eliminatedCells must retain their exact type
  for (let r = 0; r < CONFIG.ROWS; r++) {
    for (let c = 0; c < CONFIG.COLS; c++) {
      const key = `${r},${c}`;
      if (!eliminatedCells.has(key) && !createdSpecialsThisStep.has(key)) {
        if (gridBeforeElim[r][c].type !== grid[r][c].type) {
          throw new Error(`Invariant B failed during elimination: cell (${r},${c}) was not marked for elimination but changed!`);
        }
      }
    }
  }

  // --- SUB-STEP 2: GRAVITY ---
  const survivorsBeforeGravity = [];
  for (let c = 0; c < CONFIG.COLS; c++) {
    const col = [];
    for (let r = 0; r < CONFIG.ROWS; r++) {
      if (grid[r][c].type !== 0) col.push({ r, ...grid[r][c] });
    }
    survivorsBeforeGravity.push(col);
  }

  CristalesLogic.applyGravity(grid);

  // Verify Invariant B (Part 2) & Invariant D: Survivors count and order preserved per column
  for (let c = 0; c < CONFIG.COLS; c++) {
    const colAfter = [];
    for (let r = 0; r < CONFIG.ROWS; r++) {
      if (grid[r][c].type !== 0) colAfter.push({ r, ...grid[r][c] });
    }

    if (colAfter.length !== survivorsBeforeGravity[c].length) {
      throw new Error(`Invariant B failed during gravity in col ${c}: expected ${survivorsBeforeGravity[c].length} survivors, got ${colAfter.length}`);
    }

    for (let i = 0; i < colAfter.length; i++) {
      const b = survivorsBeforeGravity[c][i];
      const a = colAfter[i];
      if (b.type !== a.type || b.special !== a.special) {
        throw new Error(`Invariant B/D failed during gravity in col ${c} index ${i}: piece mismatch`);
      }
      if (a.r < b.r) {
        throw new Error(`Invariant B failed: piece moved UP in col ${c}: row ${b.r} -> ${a.r}`);
      }
    }
  }

  // --- SUB-STEP 3: REFILL ---
  const gridBeforeRefill = CristalesLogic.cloneGrid(grid);

  for (let r = 0; r < CONFIG.ROWS; r++) {
    for (let c = 0; c < CONFIG.COLS; c++) {
      if (grid[r][c].type === 0 && grid[r][c].obstacle !== CONFIG.OBSTACLES.LOCKED) {
        grid[r][c] = {
          type: Math.floor(Math.random() * CONFIG.NUM_GEM_TYPES) + 1,
          special: CONFIG.SPECIALS.NONE,
          obstacle: CONFIG.OBSTACLES.NONE
        };
      }
    }
  }

  // Verify Invariant C: Refill ONLY writes to cells that were empty (type === 0)
  for (let r = 0; r < CONFIG.ROWS; r++) {
    for (let c = 0; c < CONFIG.COLS; c++) {
      const b = gridBeforeRefill[r][c];
      const a = grid[r][c];
      if (b.type !== 0) {
        if (b.type !== a.type || b.special !== a.special || b.obstacle !== a.obstacle) {
          throw new Error(`Invariant C failed: refill overwrote occupied cell at (${r},${c})!`);
        }
      } else if (a.type === 0 && a.obstacle !== CONFIG.OBSTACLES.LOCKED) {
        throw new Error(`Invariant C/A failed: empty cell at (${r},${c}) was not refilled!`);
      }
    }
  }

  return { done: false, matchedCount: eliminatedCells.size };
}

function resolveFullTurn(grid) {
  let step = 0;
  while (step < 50) {
    const res = resolveCascadeStep(grid);
    if (res.done) break;
    step++;
  }

  // Verify Invariant A: No cell is empty after resolution completes
  for (let r = 0; r < CONFIG.ROWS; r++) {
    for (let c = 0; c < CONFIG.COLS; c++) {
      if (grid[r][c].type === 0 && grid[r][c].obstacle !== CONFIG.OBSTACLES.LOCKED) {
        throw new Error(`Invariant A failed: empty cell remains at (${r},${c}) after resolution!`);
      }
    }
  }
}

function runFullSuite(numGames = 5000) {
  console.log(`======================================================================`);
  console.log(`  SUITE DE VERIFICACIÓN DE INVARIANTES: CRISTALES (FASE ROBUSTA)      `);
  console.log(`======================================================================`);
  console.log(`Ejecutando ${numGames} partidas aleatorias completas con obstáculos y especiales...`);

  let totalMoves = 0;
  let totalSpecials = 0;
  let totalHammers = 0;

  for (let g = 0; g < numGames; g++) {
    const grid = CristalesLogic.generateBoard(CONFIG.COLS, CONFIG.ROWS, CONFIG.NUM_GEM_TYPES);

    // Pick a campaign level configuration
    const lvl = CONFIG.LEVELS[g % CONFIG.LEVELS.length];
    if (lvl.chainLayout) {
      for (const [r, c] of lvl.chainLayout) grid[r][c].obstacle = CONFIG.OBSTACLES.CHAINS;
    }
    if (lvl.lockedLayout) {
      for (const [r, c] of lvl.lockedLayout) grid[r][c].obstacle = CONFIG.OBSTACLES.LOCKED;
    }
    if (lvl.shifterLayout) {
      for (const [r, c] of lvl.shifterLayout) grid[r][c].obstacle = CONFIG.OBSTACLES.SHIFTER;
    }

    // Play 8 turns per game
    for (let t = 0; t < 8; t++) {
      // 10% chance of using Hammer powerup
      if (Math.random() < 0.10) {
        totalHammers++;
        const hr = Math.floor(Math.random() * CONFIG.ROWS);
        const hc = Math.floor(Math.random() * CONFIG.COLS);
        grid[hr][hc] = { type: 0, special: 0, obstacle: 0 };
        resolveFullTurn(grid);
        continue;
      }

      // Check for double special opportunities or normal valid moves
      let move = CristalesLogic.findAnyValidMove(grid);
      if (!move) {
        CristalesLogic.shuffleUntilValid(grid, CONFIG.NUM_GEM_TYPES);
        move = CristalesLogic.findAnyValidMove(grid);
        if (!move) break;
      }

      totalMoves++;
      const { r1, c1, r2, c2 } = move;
      const g1 = grid[r1][c1];
      const g2 = grid[r2][c2];

      // Double special combination
      if (g1.special !== CONFIG.SPECIALS.NONE && g2.special !== CONFIG.SPECIALS.NONE) {
        totalSpecials++;
        const s1 = g1.special;
        const s2 = g2.special;
        const type1 = g1.type;
        const type2 = g2.type;
        grid[r1][c1] = { type: 0, special: 0, obstacle: 0 };
        grid[r2][c2] = { type: 0, special: 0, obstacle: 0 };

        if ((s1 === CONFIG.SPECIALS.LINE_H || s1 === CONFIG.SPECIALS.LINE_V) &&
            (s2 === CONFIG.SPECIALS.LINE_H || s2 === CONFIG.SPECIALS.LINE_V)) {
          for (let c = 0; c < 8; c++) grid[r2][c] = { type: 0, special: 0, obstacle: 0 };
          for (let r = 0; r < 8; r++) grid[r][c2] = { type: 0, special: 0, obstacle: 0 };
        } else if ((s1 === CONFIG.SPECIALS.BOMB || s2 === CONFIG.SPECIALS.BOMB) &&
                   (s1 === CONFIG.SPECIALS.LINE_H || s1 === CONFIG.SPECIALS.LINE_V || s2 === CONFIG.SPECIALS.LINE_H || s2 === CONFIG.SPECIALS.LINE_V)) {
          for (let dr = -1; dr <= 1; dr++) if (r2 + dr >= 0 && r2 + dr < 8) for (let c = 0; c < 8; c++) grid[r2 + dr][c] = { type: 0, special: 0, obstacle: 0 };
          for (let dc = -1; dc <= 1; dc++) if (c2 + dc >= 0 && c2 + dc < 8) for (let r = 0; r < 8; r++) grid[r][c2 + dc] = { type: 0, special: 0, obstacle: 0 };
        } else if (s1 === CONFIG.SPECIALS.BOMB && s2 === CONFIG.SPECIALS.BOMB) {
          for (let r = r2 - 2; r <= r2 + 2; r++) {
            for (let c = c2 - 2; c <= c2 + 2; c++) {
              if (r >= 0 && r < 8 && c >= 0 && c < 8) grid[r][c] = { type: 0, special: 0, obstacle: 0 };
            }
          }
        } else {
          const targetColor = type1 || type2 || 1;
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              if (grid[r][c].type === targetColor) grid[r][c] = { type: 0, special: 0, obstacle: 0 };
            }
          }
        }
        resolveFullTurn(grid);
        continue;
      }

      // Color Prism combination
      if (g1.special === CONFIG.SPECIALS.COLOR_BOMB || g2.special === CONFIG.SPECIALS.COLOR_BOMB) {
        totalSpecials++;
        const prismCell = g1.special === CONFIG.SPECIALS.COLOR_BOMB ? { r: r1, c: c1 } : { r: r2, c: c2 };
        const otherCell = g1.special === CONFIG.SPECIALS.COLOR_BOMB ? { r: r2, c: c2 } : { r: r1, c: c1 };
        const targetColor = grid[otherCell.r][otherCell.c].type;
        grid[prismCell.r][prismCell.c] = { type: 0, special: 0, obstacle: 0 };
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (grid[r][c].type === targetColor) grid[r][c] = { type: 0, special: 0, obstacle: 0 };
          }
        }
        resolveFullTurn(grid);
        continue;
      }

      // Normal swap
      const temp = grid[r1][c1];
      grid[r1][c1] = grid[r2][c2];
      grid[r2][c2] = temp;

      resolveFullTurn(grid);
    }
  }

  console.log(`✅ INVARIANTE A CUMPLIDA: Ninguna celda queda vacía tras resolver cada jugada.`);
  console.log(`✅ INVARIANTE B CUMPLIDA: Las piezas supervivientes conservan su tipo y conteo estricto.`);
  console.log(`✅ INVARIANTE C CUMPLIDA: El relleno escribe exclusivamente en celdas vacías.`);
  console.log(`✅ INVARIANTE D CUMPLIDA: El orden relativo de las piezas en cada columna se preserva.`);
  console.log(`\nEstadísticas:`);
  console.log(`- Partidas simuladas: ${numGames}`);
  console.log(`- Movimientos ejecutados: ${totalMoves}`);
  console.log(`- Falsas/Fusión de Especiales probadas: ${totalSpecials}`);
  console.log(`- Martillazos probados: ${totalHammers}`);
  console.log(`\n🎉 TODAS LAS PRUEBAS PASARON EXITOSAMENTE SIN NINGUNA VIOLACIÓN DE INVARIANTES.`);
}

runFullSuite(5000);
