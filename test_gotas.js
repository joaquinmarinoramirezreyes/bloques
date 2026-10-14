/**
 * test_gotas.js - Pruebas unitarias en Node para Gotas (Arcade 90)
 */
const assert = require('assert');
const { CONFIG, GotasLogic } = require('./games/gotas/game.js');

console.log('--- INICIANDO TEST: GOTAS (PUZZLE 90s) ---');

// 1. Verificación del tablero y dimensiones
{
  const grid = GotasLogic.createGrid(6, 12);
  assert.strictEqual(grid.length, 12, 'El tablero debe tener 12 filas');
  assert.strictEqual(grid[0].length, 6, 'El tablero debe tener 6 columnas');
  for (let r = 0; r < 12; r++) {
    for (let c = 0; c < 6; c++) {
      assert.strictEqual(grid[r][c], 0, 'El tablero nuevo debe estar vacío');
    }
  }
  console.log('✓ Inicialización del tablero 6x12 correcta');
}

// 2. Detección de grupos conectados ortogonalmente (BFS)
{
  const grid = GotasLogic.createGrid(6, 12);
  // Colocar grupo de 3 gotas rojas (color 1) -> NO debe eliminarse
  grid[11][0] = 1;
  grid[11][1] = 1;
  grid[11][2] = 1;

  let groups = GotasLogic.findConnectedGroups(grid);
  assert.strictEqual(groups.length, 0, 'Un grupo de 3 gotas no debe formar grupo eliminable');

  // Agregar 4ta gota en L
  grid[10][1] = 1;
  groups = GotasLogic.findConnectedGroups(grid);
  assert.strictEqual(groups.length, 1, 'Grupo de 4 gotas conectadas debe ser detectado');
  assert.strictEqual(groups[0].color, 1);
  assert.strictEqual(groups[0].cells.length, 4);

  // Agregar 5ta y 6ta gota al mismo cluster
  grid[9][1] = 1;
  grid[9][2] = 1;
  groups = GotasLogic.findConnectedGroups(grid);
  assert.strictEqual(groups.length, 1);
  assert.strictEqual(groups[0].cells.length, 6, 'Grupo extendido debe registrar 6 gotas');

  // Agregar un segundo grupo independiente de 4 gotas verdes (color 2)
  grid[11][4] = 2;
  grid[11][5] = 2;
  grid[10][4] = 2;
  grid[10][5] = 2;
  groups = GotasLogic.findConnectedGroups(grid);
  assert.strictEqual(groups.length, 2, 'Deben detectarse 2 grupos simultáneos');

  console.log('✓ Detección de grupos ortogonales de 4+ gotas (BFS) verificada');
}

// 3. Aplicación de gravedad iterativa
{
  const grid = GotasLogic.createGrid(6, 12);
  // Gotas flotando con huecos
  grid[2][0] = 1;
  grid[5][0] = 2;
  grid[10][0] = 3;
  // En columna 0: fila 11 está vacía, fila 10 tiene 3, fila 5 tiene 2, fila 2 tiene 1

  const fallen = GotasLogic.applyGravity(grid);
  assert.strictEqual(fallen > 0, true, 'La gravedad debe desplazar gotas');
  assert.strictEqual(grid[11][0], 3, 'Gota 3 debe asentarse en el fondo (fila 11)');
  assert.strictEqual(grid[10][0], 2, 'Gota 2 debe asentarse sobre la gota 3 (fila 10)');
  assert.strictEqual(grid[9][0], 1, 'Gota 1 debe asentarse sobre la gota 2 (fila 9)');
  for (let r = 0; r < 9; r++) {
    assert.strictEqual(grid[r][0], 0, `Fila ${r} debe estar vacía tras la caída`);
  }

  // Aplicar gravedad en tablero ya asentado debe retornar 0 caídas
  const fallenAgain = GotasLogic.applyGravity(grid);
  assert.strictEqual(fallenAgain, 0, 'No debe haber movimientos en un tablero ya estabilizado');

  console.log('✓ Aplicación de gravedad y asentamiento hacia el fondo verificada');
}

// 4. Resolución de cascadas y combos en cadena
{
  const grid = GotasLogic.createGrid(6, 12);
  // Preparar cascada de 2 pasos:
  // Fondo: 3 gotas rojas (color 1)
  grid[11][0] = 1;
  grid[11][1] = 1;
  grid[11][2] = 1;

  // Sobre ellas: 4 gotas azules (color 3) en bloque 2x2 estable
  grid[10][0] = 3;
  grid[10][1] = 3;
  grid[9][0] = 3;
  grid[9][1] = 3;

  // Y sobre las azules: 1 gota roja (color 1) que al caer completará el grupo rojo de 4
  grid[8][1] = 1;

  // Ejecutar simulación completa de cascada
  const result = GotasLogic.simulateCascades(grid);
  assert.strictEqual(result.chains, 2, 'La configuración debe detonar exactamente 2 combos en cadena');
  assert.strictEqual(result.totalCleared, 8, 'Debieron eliminarse 8 gotas en total (4 azules + 4 rojas)');
  // Verificar que el tablero quedó completamente limpio en esas columnas
  for (let r = 0; r < 12; r++) {
    for (let c = 0; c < 4; c++) {
      assert.strictEqual(grid[r][c], 0, `Celda [${r}, ${c}] debe quedar vacía tras cascada`);
    }
  }

  console.log('✓ Simulación de cascadas múltiples y combos en cadena completada con éxito');
}

// 5. Gota especial Arcoíris (Rainbow Drop)
{
  const grid = GotasLogic.createGrid(6, 12);
  // Llenar varias posiciones con gotas rojas (1) y verdes (2)
  grid[11][0] = 1;
  grid[11][1] = 2;
  grid[11][2] = 1;
  grid[10][0] = 1;
  grid[10][1] = 2;
  grid[9][0] = 1;

  // Poner gota arcoíris en [10, 2] que caerá sobre [11, 2] (rojo)
  grid[10][2] = CONFIG.RAINBOW_ID;
  const clearedColor = GotasLogic.resolveRainbowDrop(grid, 10, 2);
  assert.strictEqual(clearedColor, 1, 'La gota arcoíris debe identificar y eliminar el color rojo (1)');

  // Verificar que no queda NINGUNA gota roja ni arcoíris en el tablero
  for (let r = 0; r < 12; r++) {
    for (let c = 0; c < 6; c++) {
      assert.notStrictEqual(grid[r][c], 1, `No debe quedar ninguna gota roja en [${r}, ${c}]`);
      assert.notStrictEqual(grid[r][c], CONFIG.RAINBOW_ID, `La gota arcoíris debe desaparecer`);
    }
  }

  // Las gotas verdes (2) deben permanecer
  assert.strictEqual(grid[11][1], 2);
  assert.strictEqual(grid[10][1], 2);

  console.log('✓ Mecánica propia: Gota arcoíris elimina todo el color impactado correctamente');
}

// 6. Mecánica de Gotas de Basura (Maratón de Jefes / Duelo IA)
{
  const grid = GotasLogic.createGrid(6, 12);
  // Colocar grupo de 4 gotas rojas (1)
  grid[11][0] = 1;
  grid[11][1] = 1;
  grid[10][0] = 1;
  grid[10][1] = 1;

  // Colocar basura adyacente (TRASH_ID = 88) en [11, 2] y [9, 0]
  grid[11][2] = CONFIG.TRASH_ID;
  grid[9][0] = CONFIG.TRASH_ID;

  // Basura lejana en columna 5 que NO debe eliminarse
  grid[11][5] = CONFIG.TRASH_ID;

  const groups = GotasLogic.findConnectedGroups(grid);
  assert.strictEqual(groups.length, 1);

  const clearedTrash = GotasLogic.clearAdjacentTrash(grid, groups[0].cells);
  assert.strictEqual(clearedTrash, 2, 'Debieron disolverse 2 gotas de basura adyacentes');
  assert.strictEqual(grid[11][2], 0, 'Basura en [11, 2] debe quedar disuelta');
  assert.strictEqual(grid[9][0], 0, 'Basura en [9, 0] debe quedar disuelta');
  assert.strictEqual(grid[11][5], CONFIG.TRASH_ID, 'Basura lejana en columna 5 debe permanecer');

  // Test de caída de basura
  GotasLogic.dropTrash(grid, 3);
  let totalTrash = 0;
  for (let r = 0; r < 12; r++) {
    for (let c = 0; c < 6; c++) {
      if (grid[r][c] === CONFIG.TRASH_ID) totalTrash++;
    }
  }
  assert.strictEqual(totalTrash, 4, 'Deben existir 4 gotas de basura en total (1 anterior + 3 nuevas)');
  console.log('✓ Mecánica de Maratón/Duelo: Gotas de basura y disolución adyacente verificada');
}

console.log('--- TODOS LOS TESTS DE GOTAS PASARON EXITOSAMENTE (6/6) ---');
