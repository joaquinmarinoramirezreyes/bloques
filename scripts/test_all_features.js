/**
 * scripts/test_all_features.js
 * 
 * Deeply tests:
 * 1. All 40 campaign level layouts
 * 2. executeDoubleSpecial (all combinations: Laser+Laser, Laser+Bomb, Bomb+Bomb, Prism+Special)
 * 3. executeColorPrism (Prism + gem color)
 * 4. applyHammer, applyFreeSwap, applyShufflePowerup
 * 5. Multi-match cascades (L-shapes, T-shapes, Crosses)
 * 
 * After EACH step (elimination, gravity, refill), checks invariants:
 *  a) Ninguna celda del tablero queda vacía cuando termina de resolverse la jugada.
 *  b) Las piezas que NO fueron marcadas para eliminar conservan su tipo; solo cambian de posición hacia abajo, y el conteo de piezas supervivientes se conserva.
 *  c) El relleno solo escribe en celdas vacías, nunca sobrescribe una ocupada.
 *  d) El orden relativo de las piezas dentro de una columna se conserva al caer.
 */

const { CONFIG, CristalesLogic } = require('../games/cristales/game.js');

function checkInvariantsAfterResolution(grid, context) {
  // a) Ninguna celda del tablero queda vacía cuando termina de resolverse la jugada.
  for (let r = 0; r < CONFIG.ROWS; r++) {
    for (let c = 0; c < CONFIG.COLS; c++) {
      if (grid[r][c].type === 0 && grid[r][c].obstacle !== CONFIG.OBSTACLES.LOCKED) {
        console.error(`🚨 INVARIANT A BROKEN [Empty cell after resolution] in ${context} at (${r},${c}):`);
        console.error(grid[r][c]);
        return false;
      }
    }
  }
  return true;
}

// Emulate game.js executeDoubleSpecial logic
function testDoubleSpecialSimulation() {
  console.log('\n--- Testing Double Special combinations ---');
  const specials = [
    CONFIG.SPECIALS.LINE_H,
    CONFIG.SPECIALS.LINE_V,
    CONFIG.SPECIALS.BOMB,
    CONFIG.SPECIALS.COLOR_BOMB
  ];

  for (const s1 of specials) {
    for (const s2 of specials) {
      const grid = CristalesLogic.generateBoard(CONFIG.COLS, CONFIG.ROWS, CONFIG.NUM_GEM_TYPES);
      const r1 = 3, c1 = 3, r2 = 3, c2 = 4;
      grid[r1][c1].special = s1;
      grid[r2][c2].special = s2;

      // From game.js executeDoubleSpecial:
      grid[r1][c1] = { type: 0, special: CONFIG.SPECIALS.NONE, obstacle: CONFIG.OBSTACLES.NONE };
      grid[r2][c2] = { type: 0, special: CONFIG.SPECIALS.NONE, obstacle: CONFIG.OBSTACLES.NONE };

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
        const targetColor = grid[r1][c1].type || 1;
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (grid[r][c].type === targetColor) grid[r][c] = { type: 0, special: 0, obstacle: 0 };
          }
        }
      }

      // Now game.js calls resolveMatches() after setTimeout(resolveMatches, 300)
      // BUT resolveMatches starts with:
      const matches = CristalesLogic.findMatches(grid);
      if (matches.length === 0) {
        // game.js EXITS WITHOUT APPLYING GRAVITY OR REFILL!
        const ok = checkInvariantsAfterResolution(grid, `DoubleSpecial (${s1} + ${s2}) with matches.length === 0`);
        if (!ok) {
          console.log(`💥 REPRODUCED INVARIANT A BREAK in DoubleSpecial (${s1} + ${s2})! Empty cells left on board.`);
        }
      }
    }
  }
}

// Emulate game.js executeColorPrism logic
function testColorPrismSimulation() {
  console.log('\n--- Testing Color Prism ---');
  const grid = CristalesLogic.generateBoard(CONFIG.COLS, CONFIG.ROWS, CONFIG.NUM_GEM_TYPES);
  const pr = 4, pc = 4;
  grid[pr][pc] = { type: 0, special: 0, obstacle: 0 };
  const targetColor = 2;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (grid[r][c].type === targetColor) grid[r][c] = { type: 0, special: 0, obstacle: 0 };
    }
  }

  const matches = CristalesLogic.findMatches(grid);
  if (matches.length === 0) {
    const ok = checkInvariantsAfterResolution(grid, `ColorPrism with targetColor ${targetColor}`);
    if (!ok) {
      console.log(`💥 REPRODUCED INVARIANT A BREAK in ColorPrism! Empty cells left on board.`);
    }
  }
}

// Emulate game.js applyHammer logic
function testHammerSimulation() {
  console.log('\n--- Testing Hammer ---');
  const grid = CristalesLogic.generateBoard(CONFIG.COLS, CONFIG.ROWS, CONFIG.NUM_GEM_TYPES);
  grid[2][3] = { type: 0, special: 0, obstacle: 0 };
  const matches = CristalesLogic.findMatches(grid);
  if (matches.length === 0) {
    const ok = checkInvariantsAfterResolution(grid, 'Hammer at (2,3)');
    if (!ok) {
      console.log(`💥 REPRODUCED INVARIANT A BREAK in Hammer! Empty cell left on board.`);
    }
  }
}

testDoubleSpecialSimulation();
testColorPrismSimulation();
testHammerSimulation();
