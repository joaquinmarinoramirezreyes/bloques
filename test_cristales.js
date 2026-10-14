/**
 * test_cristales.js - Pruebas unitarias en Node para Cristales (Arcade 00s)
 */
const assert = require('assert');
const { CONFIG, CristalesLogic } = require('./games/cristales/game.js');

console.log('--- INICIANDO TEST: CRISTALES (MATCH-3 00s) ---');

// 1. Verificación de configuración y 15 niveles definidos como datos
assert.strictEqual(CONFIG.COLS, 8);
assert.strictEqual(CONFIG.ROWS, 8);
assert.strictEqual(CONFIG.NUM_GEM_TYPES, 6);
assert.strictEqual(CONFIG.LEVELS.length >= 15, true, 'Deben existir al menos 15 niveles configurados');
console.log(`✓ Configuración base validada: ${CONFIG.LEVELS.length} niveles definidos como datos`);

// 2. Tablero inicial: NUNCA tiene combinaciones ya hechas y SIEMPRE tiene al menos un movimiento válido (100 tableros)
for (let i = 0; i < 100; i++) {
  const board = CristalesLogic.generateBoard(CONFIG.COLS, CONFIG.ROWS, CONFIG.NUM_GEM_TYPES);

  // No debe tener combinaciones ya hechas
  const matches = CristalesLogic.findMatches(board);
  assert.strictEqual(
    matches.length,
    0,
    `El tablero inicial #${i} no debe tener combinaciones de 3 ya formadas (encontradas: ${matches.length})`
  );

  // Debe tener al menos un movimiento válido
  const validMove = CristalesLogic.findAnyValidMove(board);
  assert.notStrictEqual(
    validMove,
    null,
    `El tablero inicial #${i} debe tener al menos un movimiento válido garantizado`
  );
}
console.log('✓ 100 tableros iniciales verificados: Cero combinaciones prehechas y siempre con movimiento válido');

// 3. Mezcla (Shuffle): Siempre garantiza un tablero sin combinaciones y con al menos un movimiento válido (100 intentos)
{
  const board = CristalesLogic.generateBoard(CONFIG.COLS, CONFIG.ROWS, CONFIG.NUM_GEM_TYPES);
  for (let s = 0; s < 100; s++) {
    const success = CristalesLogic.shuffleUntilValid(board, CONFIG.NUM_GEM_TYPES);
    assert.strictEqual(success, true, 'La mezcla debe retornar éxito');

    const matches = CristalesLogic.findMatches(board);
    assert.strictEqual(matches.length, 0, `Tablero mezclado #${s} no debe tener combinaciones previas`);

    const validMove = CristalesLogic.findAnyValidMove(board);
    assert.notStrictEqual(validMove, null, `Tablero mezclado #${s} debe tener al menos un movimiento válido`);
  }
  console.log('✓ 100 mezclas automáticas verificadas: Tableros resultantes válidos y jugables sin trabarse');
}

// 4. Intercambio de gemas (isValidSwap): horizontal, vertical y reversión
{
  const grid = CristalesLogic.createEmptyGrid(8, 8);
  // Colocar dos gemas rojas (1) en [0,0] y [0,1]
  grid[0][0] = { type: 1, special: 0 };
  grid[0][1] = { type: 1, special: 0 };
  grid[0][2] = { type: 2, special: 0 }; // azul
  grid[1][2] = { type: 1, special: 0 }; // roja abajo

  // Si intercambiamos [0,2] (azul) con [1,2] (roja), la roja sube a [0,2] formando 3 en línea roja
  const isValid = CristalesLogic.isValidSwap(grid, 0, 2, 1, 2);
  assert.strictEqual(isValid, true, 'Intercambiar [0,2] con [1,2] debe ser un movimiento válido (forma 3 rojas)');

  // Un intercambio entre [0,0] y [1,0] no forma nada
  const isInvalid = CristalesLogic.isValidSwap(grid, 0, 0, 1, 0);
  assert.strictEqual(isInvalid, false, 'Intercambio sin combinación no debe ser válido');

  console.log('✓ Detección de intercambios válidos e inválidos verificada');
}

// 5. Las cascadas terminan (Estabilización finita garantizada)
{
  for (let testRun = 0; testRun < 50; testRun++) {
    // Crear un tablero deliberadamente desordenado y con múltiples combinaciones
    const grid = CristalesLogic.createEmptyGrid(8, 8);
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        // Asignar aleatoriamente 1..6 permitiendo matches iniciales
        grid[r][c] = { type: Math.floor(Math.random() * 6) + 1, special: 0 };
      }
    }

    const sim = CristalesLogic.simulateCascades(grid, 6, 60);
    assert.strictEqual(sim.terminated, true, `La cascada de la simulación #${testRun} debe terminar en menos de 60 ciclos`);
    // Al finalizar la simulación, no debe quedar NINGUNA combinación en el tablero
    const remainingMatches = CristalesLogic.findMatches(grid);
    assert.strictEqual(remainingMatches.length, 0, 'El tablero final tras cascadas debe estar completamente estabilizado');
  }
  console.log('✓ 50 simulaciones de cascadas masivas verificadas: Todas se estabilizan y terminan');
}

// 6. Verificación de solvencia de los 40 niveles de campaña
{
  assert.strictEqual(CONFIG.LEVELS.length, 40, 'Deben existir exactamente 40 niveles en los 4 mundos');
  for (let i = 0; i < CONFIG.LEVELS.length; i++) {
    const lvl = CONFIG.LEVELS[i];
    const solvable = CristalesLogic.isLevelSolvable(lvl);
    assert.strictEqual(solvable, true, `El nivel ${lvl.id} (${lvl.name}) debe ser resoluble matemáticamente`);
  }
  console.log('✓ Los 40 niveles de campaña verificados: 100% resolubles matemáticamente con ratios de movimientos balanceados');
}

console.log('--- TODOS LOS TESTS DE CRISTALES PASARON EXITOSAMENTE (6/6) ---');
