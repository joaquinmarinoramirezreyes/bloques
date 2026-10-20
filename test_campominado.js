/**
 * test_campominado.js - Pruebas unitarias en Node para Campo Minado (Arcade 90)
 */
const assert = require('assert');
const { CONFIG, MineSweeperLogic } = require('./games/campominado/game.js');

console.log('--- INICIANDO TEST: CAMPO MINADO ---');

// 1. Verificación de tamaños del CONFIG
assert.strictEqual(CONFIG.SIZES.EASY.cols, 9);
assert.strictEqual(CONFIG.SIZES.EASY.rows, 9);
assert.strictEqual(CONFIG.SIZES.EASY.mines, 10);

assert.strictEqual(CONFIG.SIZES.MEDIUM.cols, 12);
assert.strictEqual(CONFIG.SIZES.MEDIUM.rows, 16);
assert.strictEqual(CONFIG.SIZES.MEDIUM.mines, 30);

assert.strictEqual(CONFIG.SIZES.HARD.cols, 16);
assert.strictEqual(CONFIG.SIZES.HARD.rows, 24);
assert.strictEqual(CONFIG.SIZES.HARD.mines, 70);

// 2. Primer toque seguro garantizado (100 simulaciones aleatorias)
for (let i = 0; i < 100; i++) {
  const sizeKey = i % 3 === 0 ? 'EASY' : (i % 3 === 1 ? 'MEDIUM' : 'HARD');
  const cfg = CONFIG.SIZES[sizeKey];
  const grid = MineSweeperLogic.createEmptyGrid(cfg.cols, cfg.rows);

  const safeC = Math.floor(Math.random() * cfg.cols);
  const safeR = Math.floor(Math.random() * cfg.rows);

  MineSweeperLogic.populateMines(grid, cfg.cols, cfg.rows, cfg.mines, safeC, safeR);

  // La celda de primer toque NUNCA debe ser mina
  assert.strictEqual(
    grid[safeR][safeC].isMine,
    false,
    `Fallo de seguridad en primer toque: celda [${safeR},${safeC}] en tamaño ${sizeKey} es mina`
  );

  // Contar minas totales colocadas
  let totalPlaced = 0;
  for (let r = 0; r < cfg.rows; r++) {
    for (let c = 0; c < cfg.cols; c++) {
      if (grid[r][c].isMine) totalPlaced++;
    }
  }
  assert.strictEqual(
    totalPlaced,
    cfg.mines,
    `Cantidad incorrecta de minas: esperadas ${cfg.mines}, obtenidas ${totalPlaced}`
  );
}
console.log('OK Primer toque 100% seguro y conteo exacto de minas verificado en 100 tableros');

// 3. Conteo de vecinos exacto (Tablero sintético controlado)
{
  const grid = MineSweeperLogic.createEmptyGrid(5, 5);
  // Colocar minas en forma de triángulo alrededor del centro (2, 2)
  grid[1][1].isMine = true;
  grid[1][2].isMine = true;
  grid[1][3].isMine = true;

  MineSweeperLogic.calculateNeighborCounts(grid, 5, 5);

  // La celda (2, 2) tiene 3 minas al norte (1,1), (1,2), (1,3)
  assert.strictEqual(grid[2][2].neighborMines, 3, 'El centro debe detectar exactamente 3 minas al norte');
  // La celda (0, 2) tiene 3 minas al sur
  assert.strictEqual(grid[0][2].neighborMines, 3, 'La celda (0,2) debe tener 3 minas vecinas');
  // La celda (4, 4) está lejos y debe tener 0
  assert.strictEqual(grid[4][4].neighborMines, 0, 'La celda (4,4) debe tener 0 minas vecinas');
}
console.log('OK Cálculo de vecinos adyacentes validado con precisión');

// 4. Flood Fill Iterativo sin recursión (Despeje en cadena)
{
  const grid = MineSweeperLogic.createEmptyGrid(6, 6);
  // Mina en una esquina alejada (0, 0)
  grid[0][0].isMine = true;
  MineSweeperLogic.calculateNeighborCounts(grid, 6, 6);

  // Iniciar flood fill desde la esquina opuesta (5, 5) donde todo está libre
  const revealed = MineSweeperLogic.iterativeFloodFill(grid, 6, 6, 5, 5);

  assert.ok(revealed.length > 10, 'El flood fill debe expandir múltiples casillas');
  assert.strictEqual(grid[5][5].revealed, true, 'La celda inicial debe estar revelada');
  assert.strictEqual(grid[0][0].revealed, false, 'La mina NO debe ser revelada por el flood fill');

  // Casillas adyacentes a la mina deben quedar como borde numérico revelado
  assert.strictEqual(grid[0][1].revealed, true, 'El borde adyacente a la mina debe quedar revelado');
  assert.strictEqual(grid[1][0].revealed, true, 'El borde adyacente a la mina debe quedar revelado');
  assert.strictEqual(grid[1][1].revealed, true, 'La diagonal adyacente debe quedar revelada');
}
console.log('OK Flood fill iterativo verificado: expansión en cadena limpia sin desbordamiento de pila');

// 5. Verificación de Condición de Victoria
{
  const grid = MineSweeperLogic.createEmptyGrid(3, 3);
  grid[0][0].isMine = true; // 1 sola mina en (0,0), 8 celdas seguras
  MineSweeperLogic.calculateNeighborCounts(grid, 3, 3);

  // Revelar solo 7 de las 8 celdas seguras
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (!(r === 0 && c === 0) && !(r === 2 && c === 2)) {
        grid[r][c].revealed = true;
      }
    }
  }
  assert.strictEqual(MineSweeperLogic.checkWinCondition(grid, 3, 3, 1), false, 'No debe haber ganado aún');

  // Revelar la última celda segura (2, 2)
  grid[2][2].revealed = true;
  assert.strictEqual(MineSweeperLogic.checkWinCondition(grid, 3, 3, 1), true, 'Debe ganar al revelar todas las celdas seguras');
}
console.log('OK Condición de victoria verificada correctamente');

// 6. Solucionador Lógico Determinista y Detección Guess-Free
{
  const grid = MineSweeperLogic.createEmptyGrid(4, 4);
  grid[0][0].isMine = true; // 1 sola mina en esquina
  MineSweeperLogic.calculateNeighborCounts(grid, 4, 4);

  const res = MineSweeperLogic.solveLogically(grid, 4, 4, 3, 3);
  assert.strictEqual(res.isGuessFree, true, 'El tablero debe ser deterministamente deducible sin adivinanza');

  const hint = MineSweeperLogic.findSafeHint(grid, 4, 4);
  assert.notStrictEqual(hint, null, 'Debe encontrar una pista segura');
  assert.strictEqual(grid[hint.r][hint.c].isMine, false, 'La casilla de pista nunca debe ser una mina');
}
console.log('OK Solucionador lógico determinista (Guess-Free) y pistas seguras verificadas');

console.log('--- TODOS LOS TESTS DE CAMPO MINADO PASARON EXITOSAMENTE (6/6) ---');

