/**
 * test_lanzaburbujas.js - Pruebas unitarias en Node para Lanzaburbujas (Arcade 00s)
 */
const assert = require('assert');
const { CONFIG, LanzaburbujasLogic } = require('./games/lanzaburbujas/game.js');

console.log('--- INICIANDO TEST: LANZABURBUJAS (HEX SHOOTER 00s) ---');

// 1. Verificación de configuración y 60 niveles en 4 mundos
assert.strictEqual(CONFIG.COLS_EVEN, 8);
assert.strictEqual(CONFIG.COLS_ODD, 7);
assert.strictEqual(CONFIG.MAX_ROWS, 13);
assert.strictEqual(CONFIG.LEVELS.length, 60, 'Deben existir exactamente 60 niveles en campaña');
assert.strictEqual(CONFIG.WORLDS.length, 4, 'Deben existir 4 mundos temáticos');

// Verificar que cada mundo tenga 15 niveles y su jefe respectivo
for (let w = 1; w <= 4; w++) {
  const worldLvls = CONFIG.LEVELS.filter(l => l.world === w);
  assert.strictEqual(worldLvls.length, 15, `El Mundo ${w} debe contener exactamente 15 niveles`);
  const bossLvl = worldLvls[worldLvls.length - 1];
  assert.strictEqual(bossLvl.isBoss, true, `El nivel final del Mundo ${w} (${bossLvl.name}) debe ser un Jefe`);
}
console.log(`OK Configuración verificada: 60 niveles agrupados en 4 mundos temáticos con 4 jefes`);

// 2. Vecinos en rejilla hexagonal (filas pares vs impares desplazadas)
{
  // Fila par (r=2, c=3)
  const evenNeighbors = LanzaburbujasLogic.getHexNeighbors(2, 3, 13, 8, 7);
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
  assert.strictEqual(oddNeighbors.length, 6, 'Una celda interior en fila impar debe tener exactamente 6 vecinos');
  const oddKeys = new Set(oddNeighbors.map(n => `${n.r},${n.c}`));
  assert.strictEqual(oddKeys.has('3,2'), true);
  assert.strictEqual(oddKeys.has('3,4'), true);
  assert.strictEqual(oddKeys.has('2,3'), true);
  assert.strictEqual(oddKeys.has('2,4'), true);
  assert.strictEqual(oddKeys.has('4,3'), true);
  assert.strictEqual(oddKeys.has('4,4'), true);

  // Borde superior fila 0
  const topNeighbors = LanzaburbujasLogic.getHexNeighbors(0, 0, 13, 8, 7);
  assert.strictEqual(topNeighbors.length, 2, 'La esquina superior izquierda solo tiene 2 vecinos');

  console.log('OK Geometría y vecinos en rejilla hexagonal (pares e impares) verificados con éxito');
}

// 3. Detección de grupos conectados (3+ del mismo color y comodín arcoíris)
{
  const grid = [];
  for (let r = 0; r < 13; r++) {
    const cols = (r % 2 === 0) ? 8 : 7;
    grid[r] = [];
    for (let c = 0; c < cols; c++) grid[r][c] = { color: 0, special: 0 };
  }

  // 2 burbujas rojas (color 1)
  grid[0][0] = { color: 1, special: 0 };
  grid[0][1] = { color: 1, special: 0 };

  let cluster = LanzaburbujasLogic.findConnectedCluster(grid, 0, 0);
  assert.strictEqual(cluster.length, 2, 'Grupo de 2 burbujas debe tener tamaño 2');

  // Agregar 3ra burbuja adyacente en (1, 0)
  grid[1][0] = { color: 1, special: 0 };
  cluster = LanzaburbujasLogic.findConnectedCluster(grid, 0, 0);
  assert.strictEqual(cluster.length, 3, 'Grupo de 3 burbujas adyacentes debe ser detectado');

  // Agregar comodín arcoíris en (1, 1) -> debe conectarse al grupo rojo
  grid[1][1] = { color: 91, special: CONFIG.SPECIALS.RAINBOW };
  cluster = LanzaburbujasLogic.findConnectedCluster(grid, 0, 0);
  assert.strictEqual(cluster.length, 4, 'Burbuja arcoíris debe sumarse como comodín al cluster');

  console.log('OK Detección BFS de grupos conectados por color y arcoíris verificada');
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

  // Burbujas huérfanas en fila 4 y 5 aisladas sin conexión a fila 0
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

  console.log('OK Algoritmo de detección de burbujas flotantes (huérfanas) verificado al 100%');
}

// 5. Precisión matemática: Trayectoria de la guía coincide exactamente con la física del proyectil
{
  const boardWidth = 400;
  const bubbleRadius = 25;
  const grid = [];
  for (let r = 0; r < 13; r++) {
    const cols = (r % 2 === 0) ? 8 : 7;
    grid[r] = [];
    for (let c = 0; c < cols; c++) grid[r][c] = { color: 0, special: 0 };
  }

  // Barrera en fila 1
  for (let c = 0; c < 7; c++) {
    grid[1][c] = { color: 1, special: 0 };
  }

  // Probar varios ángulos de disparo (recto, rebote izquierdo, rebote derecho)
  const testAngles = [
    -Math.PI / 2,        // Recto hacia arriba
    -Math.PI / 4,        // Rebote en pared derecha
    -3 * Math.PI / 4,    // Rebote en pared izquierda
    -Math.PI / 3         // Rebote angular
  ];

  for (const angle of testAngles) {
    const guideTraj = LanzaburbujasLogic.raycastTrajectory(
      200, 500, angle, bubbleRadius, boardWidth, grid, 13
    );
    const physicalSim = LanzaburbujasLogic.simulatePhysicalShot(
      200, 500, angle, CONFIG.PROJECTILE_SPEED, 0.016, bubbleRadius, boardWidth, grid, 13
    );

    assert.notStrictEqual(guideTraj.targetCell, null, `La guía debe encontrar celda de impacto para ángulo ${angle}`);
    assert.notStrictEqual(physicalSim.targetCell, null, `La física real debe encontrar celda de impacto para ángulo ${angle}`);

    assert.strictEqual(
      guideTraj.targetCell.r,
      physicalSim.targetCell.r,
      `Fila de destino prevista por la guía debe coincidir con la física real en ángulo ${angle}`
    );
    assert.strictEqual(
      guideTraj.targetCell.c,
      physicalSim.targetCell.c,
      `Columna de destino prevista por la guía debe coincidir con la física real en ángulo ${angle}`
    );
  }

  console.log('OK Precisión matemática validada: La guía de rebote coincide al 100% con la física del proyectil');
}

// 6. Munición dinámica limitada a colores activos
{
  const grid = [];
  for (let r = 0; r < 13; r++) {
    const cols = (r % 2 === 0) ? 8 : 7;
    grid[r] = [];
    for (let c = 0; c < cols; c++) grid[r][c] = { color: 0, special: 0 };
  }

  grid[0][0] = { color: 1, special: 0 };
  grid[0][1] = { color: 3, special: 0 };

  const activeColors = LanzaburbujasLogic.getActiveColors(grid, 13);
  assert.strictEqual(activeColors.length, 2);
  assert.strictEqual(activeColors.includes(1), true);
  assert.strictEqual(activeColors.includes(3), true);
  assert.strictEqual(activeColors.includes(2), false);

  console.log('OK Filtro dinámico de colores de munición validado');
}

// 7. Verificación de solvencia y balance de los 60 niveles
{
  for (let i = 0; i < CONFIG.LEVELS.length; i++) {
    const lvl = CONFIG.LEVELS[i];
    const solvable = LanzaburbujasLogic.isLevelSolvable(lvl);
    assert.strictEqual(solvable, true, `El nivel ${lvl.id} (${lvl.name}) debe ser resoluble matemáticamente`);
  }
  console.log('OK Los 60 niveles de campaña verificados: 100% resolubles matemáticamente y estructurados');
}

console.log('--- TODOS LOS TESTS DE LANZABURBUJAS PASARON EXITOSAMENTE (7/7) ---');
