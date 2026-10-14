/**
 * test_lanzaburbujas.js - Pruebas unitarias en Node para Lanzaburbujas (Arcade 00s)
 */
const assert = require('assert');
const { CONFIG, LanzaburbujasLogic } = require('./games/lanzaburbujas/game.js');

console.log('--- INICIANDO TEST: LANZABURBUJAS (HEX SHOOTER 00s) ---');

// 1. Verificación de configuración y 15 niveles
assert.strictEqual(CONFIG.COLS_EVEN, 8);
assert.strictEqual(CONFIG.COLS_ODD, 7);
assert.strictEqual(CONFIG.MAX_ROWS, 13);
assert.strictEqual(CONFIG.LEVELS.length >= 15, true, 'Deben definirse al menos 15 niveles como datos');
console.log(`✓ Configuración verificada: ${CONFIG.LEVELS.length} niveles definidos como datos`);

// 2. Vecinos en rejilla hexagonal (filas pares vs impares desplazadas)
{
  // Fila par (r=2, c=3)
  const evenNeighbors = LanzaburbujasLogic.getHexNeighbors(2, 3, 13, 8, 7);
  // Vecinos esperados: izquierda (2,2), derecha (2,4), arriba-izq (1,2), arriba-der (1,3), abajo-izq (3,2), abajo-der (3,3)
  assert.strictEqual(evenNeighbors.length, 6, 'Una celda interior en fila par debe tener exactamente 6 vecinos');
  const evenKeys = new Set(evenNeighbors.map(n => `${n.r},${n.c}`));
  assert.strictEqual(evenKeys.has('2,2'), true);
  assert.strictEqual(evenKeys.has('2,4'), true);
  assert.strictEqual(evenKeys.has('1,2'), true);
  assert.strictEqual(evenKeys.has('1,3'), true);
  assert.strictEqual(evenKeys.has('3,2'), true);
  assert.strictEqual(evenKeys.has('3,3'), true);

  // Fila impar (r=3, c=3)
  const oddNeighbors = LanzaburbujasLogic.getHexNeighbors(3, 3, 13, 8, 7);
  // Vecinos esperados: izquierda (3,2), derecha (3,4), arriba-izq (2,3), arriba-der (2,4), abajo-izq (4,3), abajo-der (4,4)
  assert.strictEqual(oddNeighbors.length, 6, 'Una celda interior en fila impar debe tener exactamente 6 vecinos');
  const oddKeys = new Set(oddNeighbors.map(n => `${n.r},${n.c}`));
  assert.strictEqual(oddKeys.has('3,2'), true);
  assert.strictEqual(oddKeys.has('3,4'), true);
  assert.strictEqual(oddKeys.has('2,3'), true);
  assert.strictEqual(oddKeys.has('2,4'), true);
  assert.strictEqual(oddKeys.has('4,3'), true);
  assert.strictEqual(oddKeys.has('4,4'), true);

  // Borde superior fila 0 (no tiene vecinos arriba)
  const topNeighbors = LanzaburbujasLogic.getHexNeighbors(0, 0, 13, 8, 7);
  // Vecinos: derecha (0,1), abajo-der (1,0)
  assert.strictEqual(topNeighbors.length, 2, 'La esquina superior izquierda solo tiene 2 vecinos');

  console.log('✓ Geometría y vecinos en rejilla hexagonal (pares e impares) verificados con éxito');
}

// 3. Detección de grupos conectados (3+ del mismo color)
{
  const grid = [];
  for (let r = 0; r < 13; r++) {
    const cols = (r % 2 === 0) ? 8 : 7;
    grid[r] = [];
    for (let c = 0; c < cols; c++) grid[r][c] = { color: 0, special: 0 };
  }

  // Colocar 2 burbujas rojas (color 1)
  grid[0][0] = { color: 1, special: 0 };
  grid[0][1] = { color: 1, special: 0 };

  let cluster = LanzaburbujasLogic.findConnectedCluster(grid, 0, 0);
  assert.strictEqual(cluster.length, 2, 'Grupo de 2 burbujas debe tener tamaño 2');

  // Agregar 3ra burbuja adyacente en (1, 0)
  grid[1][0] = { color: 1, special: 0 };
  cluster = LanzaburbujasLogic.findConnectedCluster(grid, 0, 0);
  assert.strictEqual(cluster.length, 3, 'Grupo de 3 burbujas adyacentes debe ser detectado');

  // Agregar 4ta burbuja de color diferente (azul 2) en (1, 1) -> No debe incluirse
  grid[1][1] = { color: 2, special: 0 };
  cluster = LanzaburbujasLogic.findConnectedCluster(grid, 0, 0);
  assert.strictEqual(cluster.length, 3, 'Burbuja de color distinto no debe sumarse al cluster');

  console.log('✓ Detección BFS de grupos conectados por color verificada');
}

// 4. Detección de burbujas flotantes (huérfanas) desconectadas del techo
{
  const grid = [];
  for (let r = 0; r < 13; r++) {
    const cols = (r % 2 === 0) ? 8 : 7;
    grid[r] = [];
    for (let c = 0; c < cols; c++) grid[r][c] = { color: 0, special: 0 };
  }

  // Burbujas conectadas al techo (fila 0)
  grid[0][3] = { color: 2, special: 0 };
  grid[1][3] = { color: 2, special: 0 };

  // Burbujas huérfanas en fila 4 y 5 completamente aisladas sin camino a fila 0
  grid[4][2] = { color: 1, special: 0 };
  grid[4][3] = { color: 1, special: 0 };
  grid[5][2] = { color: 1, special: 0 };

  const floating = LanzaburbujasLogic.findFloatingBubbles(grid, 13);
  assert.strictEqual(floating.length, 3, 'Deben detectarse exactamente las 3 burbujas desconectadas');
  const floatingKeys = new Set(floating.map(f => `${f.r},${f.c}`));
  assert.strictEqual(floatingKeys.has('4,2'), true);
  assert.strictEqual(floatingKeys.has('4,3'), true);
  assert.strictEqual(floatingKeys.has('5,2'), true);
  assert.strictEqual(floatingKeys.has('0,3'), false, 'Las burbujas del techo nunca son flotantes');
  assert.strictEqual(floatingKeys.has('1,3'), false, 'Las burbujas enraizadas al techo no son flotantes');

  console.log('✓ Algoritmo de detección de burbujas flotantes (huérfanas) verificado al 100%');
}

// 5. Trayectoria con rebotes en pared y colisión en rejilla
{
  const boardWidth = 400;
  const bubbleRadius = 25;
  const grid = [];
  for (let r = 0; r < 13; r++) {
    const cols = (r % 2 === 0) ? 8 : 7;
    grid[r] = [];
    for (let c = 0; c < cols; c++) grid[r][c] = { color: 0, special: 0 };
  }

  // Poner una barrera de burbujas en fila 1
  for (let c = 0; c < 7; c++) {
    grid[1][c] = { color: 1, special: 0 };
  }

  // Disparo vertical hacia arriba desde el cañón (200, 500)
  const trajectoryStraight = LanzaburbujasLogic.raycastTrajectory(
    200, 500, -Math.PI / 2, bubbleRadius, boardWidth, grid, 13
  );
  assert.notStrictEqual(trajectoryStraight.targetCell, null, 'El rayo vertical debe encontrar celda de impacto');
  // Debe impactar abajo de la fila 1 (es decir, en fila 2)
  assert.strictEqual(trajectoryStraight.targetCell.r, 2);

  // Disparo en diagonal con rebote en la pared derecha (ángulo -Math.PI / 4 = -45°)
  const trajectoryBounce = LanzaburbujasLogic.raycastTrajectory(
    200, 500, -Math.PI / 4, bubbleRadius, boardWidth, grid, 13
  );
  assert.strictEqual(trajectoryBounce.path.length >= 2, true, 'La trayectoria con rebote debe contener al menos 2 segmentos');
  assert.notStrictEqual(trajectoryBounce.targetCell, null, 'El tiro rebotado debe encontrar una celda de encaje');

  console.log('✓ Simulación de trayectoria balística con rebotes en paredes y anclaje a celdas verificada');
}

// 6. Munición dinámica limitada a colores activos
{
  const grid = [];
  for (let r = 0; r < 13; r++) {
    const cols = (r % 2 === 0) ? 8 : 7;
    grid[r] = [];
    for (let c = 0; c < cols; c++) grid[r][c] = { color: 0, special: 0 };
  }

  // Solo colocar color 1 (Rojo) y color 3 (Verde) en el tablero
  grid[0][0] = { color: 1, special: 0 };
  grid[0][1] = { color: 3, special: 0 };

  const activeColors = LanzaburbujasLogic.getActiveColors(grid, 13);
  assert.strictEqual(activeColors.length, 2);
  assert.strictEqual(activeColors.includes(1), true);
  assert.strictEqual(activeColors.includes(3), true);
  assert.strictEqual(activeColors.includes(2), false, 'Colores no existentes en el tablero no deben generarse');
  assert.strictEqual(activeColors.includes(4), false);

  console.log('✓ Filtro dinámico de colores de munición validado');
}

console.log('--- TODOS LOS TESTS DE LANZABURBUJAS PASARON EXITOSAMENTE ---');
