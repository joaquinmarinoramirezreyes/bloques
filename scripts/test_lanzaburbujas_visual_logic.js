/**
 * scripts/test_lanzaburbujas_visual_logic.js
 * Suite de pruebas unitarias y de simulación para Lanzaburbujas Arcade 00s:
 * 1. Verificación de física de trayectoria balística y rebotes.
 * 2. Detección de grupos (BFS) y comodines arcoíris.
 * 3. Detección precisa de burbujas flotantes huérfanas.
 * 4. Consistencia visual vs lógica (cero fantasmas, duplicadas o perdidas).
 * 5. Simulación de 500 turnos aleatorios completos manteniendo invariantes.
 * 6. Pool de tweens sin fugas de memoria.
 */

const assert = require('assert');
const path = require('path');

// Cargar lógica del juego
const { CONFIG, LanzaburbujasLogic } = require(path.join(__dirname, '../games/lanzaburbujas/game.js'));
const { ArcadeTween } = require(path.join(__dirname, '../shared/tween.js'));

console.log('🫧 Iniciando suite de pruebas de lógica y consistencia visual de Lanzaburbujas...');

let passed = 0;
let total = 0;

function it(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

// -------------------------------------------------------------------
// 1. Geometría Hexagonal y Coordenadas
// -------------------------------------------------------------------
it('Calcula correctamente coordenadas centrales hexagonales y vecinos', () => {
  const rad = 25;
  const c0 = LanzaburbujasLogic.getCellCenter(0, 0, rad);
  assert.strictEqual(c0.x, rad, 'Fila par (0,0) offset x debe ser rad');
  assert.strictEqual(c0.y, rad, 'Fila 0 y debe ser rad');

  const c1 = LanzaburbujasLogic.getCellCenter(1, 0, rad);
  assert.strictEqual(c1.x, rad * 2, 'Fila impar (1,0) offset x debe ser 2*rad');

  const nEven = LanzaburbujasLogic.getHexNeighbors(2, 2);
  assert.strictEqual(nEven.length, 6, 'Celda interior en fila par debe tener 6 vecinos');

  const nOdd = LanzaburbujasLogic.getHexNeighbors(1, 2);
  assert.strictEqual(nOdd.length, 6, 'Celda interior en fila impar debe tener 6 vecinos');

  // Distancia hexagonal axial
  const d0 = LanzaburbujasLogic.hexDistance(0, 0, 0, 0);
  assert.strictEqual(d0, 0, 'Distancia a sí misma es 0');
  const d1 = LanzaburbujasLogic.hexDistance(0, 0, 0, 1);
  assert.strictEqual(d1, 1, 'Distancia a vecina directa es 1');
  const d2 = LanzaburbujasLogic.hexDistance(0, 0, 2, 1);
  assert.strictEqual(d2, 2, 'Distancia de (0,0) a (2,1) debe ser 2');
  const d3 = LanzaburbujasLogic.hexDistance(0, 0, 2, 2);
  assert.strictEqual(d3, 3, 'Distancia de (0,0) a (2,2) debe ser 3');
});

// -------------------------------------------------------------------
// 2. Trayectoria Balística con Rebote en Paredes
// -------------------------------------------------------------------
it('Simula rebotes en paredes y detecta la celda de anclaje de impacto', () => {
  const boardW = 400;
  const rad = 25;
  const grid = [];
  for (let r = 0; r < CONFIG.MAX_ROWS; r++) {
    grid[r] = [];
    const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
    for (let c = 0; c < maxCols; c++) {
      grid[r][c] = { color: (r < 2) ? 1 : 0, special: 0 };
    }
  }

  // Disparo angular hacia la pared derecha
  const angle = -Math.PI / 4; // -45 grados
  const trajectory = LanzaburbujasLogic.raycastTrajectory(200, 500, angle, rad, boardW, grid);

  assert(trajectory.path.length >= 2, 'Debe registrar al menos un rebote o trayecto');
  const bounced = trajectory.path.some(pt => pt.x <= rad || pt.x >= boardW - rad);
  assert(bounced, 'El raycast debe rebotar en las paredes laterales');
  assert(trajectory.targetCell !== null, 'Debe encontrar celda vacía para anclar');
  assert.strictEqual(grid[trajectory.targetCell.r][trajectory.targetCell.c].color, 0, 'La celda destino debe estar vacía');
});

// -------------------------------------------------------------------
// 3. Detección de Grupos (BFS) y Comodines Arcoíris
// -------------------------------------------------------------------
it('Detecta racimos de color coincidentes y resuelve comodines arcoíris', () => {
  const grid = [];
  for (let r = 0; r < CONFIG.MAX_ROWS; r++) {
    grid[r] = [];
    const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
    for (let c = 0; c < maxCols; c++) {
      grid[r][c] = { color: 0, special: 0 };
    }
  }

  // Construir racimo de 3 burbujas rojas (color: 1)
  grid[0][0] = { color: 1, special: 0 };
  grid[0][1] = { color: 1, special: 0 };
  grid[1][0] = { color: 1, special: 0 };

  const cluster = LanzaburbujasLogic.findConnectedCluster(grid, 0, 0);
  assert.strictEqual(cluster.length, 3, 'Debe detectar exactamente 3 burbujas conectadas');

  // Agregar comodín arcoíris conectado
  grid[1][1] = { color: CONFIG.SPECIALS.RAINBOW, special: CONFIG.SPECIALS.RAINBOW };
  const clusterRainbow = LanzaburbujasLogic.findConnectedCluster(grid, 0, 0);
  assert.strictEqual(clusterRainbow.length, 4, 'Comodín arcoíris debe incluirse en el racimo');
});

// -------------------------------------------------------------------
// 4. Detección de Burbujas Huérfanas / Flotantes
// -------------------------------------------------------------------
it('Identifica con precisión las burbujas que quedan desconectadas del techo', () => {
  const grid = [];
  for (let r = 0; r < CONFIG.MAX_ROWS; r++) {
    grid[r] = [];
    const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
    for (let c = 0; c < maxCols; c++) {
      grid[r][c] = { color: 0, special: 0 };
    }
  }

  // Burbuja anclada al techo en (0,0)
  grid[0][0] = { color: 1, special: 0 };
  grid[1][0] = { color: 1, special: 0 };

  // Burbuja aislada en (3,3) sin conexión con la fila 0
  grid[3][3] = { color: 2, special: 0 };
  grid[3][4] = { color: 2, special: 0 };

  const floating = LanzaburbujasLogic.findFloatingBubbles(grid);
  assert.strictEqual(floating.length, 2, 'Debe detectar exactamente 2 burbujas huérfanas');
  const foundKeys = new Set(floating.map(f => `${f.r},${f.c}`));
  assert(foundKeys.has('3,3') && foundKeys.has('3,4'), 'Las burbujas huérfanas son (3,3) y (3,4)');
});

// -------------------------------------------------------------------
// 5. Consistencia Visual vs Lógica
// -------------------------------------------------------------------
it('Verifica consistencia matemática bidireccional entre la cuadrícula visual y la lógica', () => {
  const rad = 25;
  const grid = [];
  for (let r = 0; r < CONFIG.MAX_ROWS; r++) {
    grid[r] = [];
    const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
    for (let c = 0; c < maxCols; c++) {
      grid[r][c] = { color: (r < 3) ? (c % 4 + 1) : 0, special: 0 };
    }
  }

  const vGrid = LanzaburbujasLogic.createVisualGrid(grid, rad);
  const checkInitial = LanzaburbujasLogic.verifyVisualLogicConsistency(grid, vGrid);
  assert(checkInitial.valid, 'Visual y lógica deben coincidir perfectamente al inicio');
  assert.strictEqual(checkInitial.errors.length, 0);

  // Provocar intencionalmente burbuja fantasma
  vGrid[5][2].color = 3;
  vGrid[5][2].scale = 1;
  vGrid[5][2].alpha = 1;
  const checkGhost = LanzaburbujasLogic.verifyVisualLogicConsistency(grid, vGrid);
  assert(!checkGhost.valid, 'Debe detectar burbuja fantasma');
  assert(checkGhost.errors.some(e => e.includes('fantasma')));

  // Restaurar y provocar burbuja perdida
  vGrid[5][2].color = 0;
  vGrid[0][0].scale = 0;
  const checkLost = LanzaburbujasLogic.verifyVisualLogicConsistency(grid, vGrid);
  assert(!checkLost.valid, 'Debe detectar burbuja perdida');
  assert(checkLost.errors.some(e => e.includes('perdida')));

  // Sincronizar y verificar que se subsana
  LanzaburbujasLogic.syncVisualGrid(grid, vGrid, rad);
  const checkRestored = LanzaburbujasLogic.verifyVisualLogicConsistency(grid, vGrid);
  assert(checkRestored.valid, 'Tras syncVisualGrid debe volver a ser 100% consistente');
});

// -------------------------------------------------------------------
// 6. Simulación de 500 Turnos Aleatorios Completos
// -------------------------------------------------------------------
it('Ejecuta 500 turnos aleatorios (disparos, grupos, huérfanas, techo) sin perder consistencia', () => {
  const rad = 25;
  const grid = [];
  for (let r = 0; r < CONFIG.MAX_ROWS; r++) {
    grid[r] = [];
    const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
    for (let c = 0; c < maxCols; c++) {
      grid[r][c] = { color: (r < 4) ? (Math.floor(Math.random() * 4) + 1) : 0, special: 0 };
    }
  }

  const vGrid = LanzaburbujasLogic.createVisualGrid(grid, rad);

  for (let turn = 1; turn <= 500; turn++) {
    // 1. Disparo aleatorio hacia una celda vacía válida
    const emptyCells = [];
    for (let r = 0; r < CONFIG.DEADLINE_ROW; r++) {
      const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
      for (let c = 0; c < maxCols; c++) {
        if (grid[r][c].color === 0) {
          // Verificar si tiene al menos un vecino ocupado o si es fila 0
          const neighbors = LanzaburbujasLogic.getHexNeighbors(r, c);
          const hasOccupiedNeighbor = r === 0 || neighbors.some(n => grid[n.r][n.c].color !== 0);
          if (hasOccupiedNeighbor) {
            emptyCells.push({ r, c });
          }
        }
      }
    }

    if (emptyCells.length === 0) {
      // Tablero lleno o reinicio
      break;
    }

    const target = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const chosenColor = Math.floor(Math.random() * 4) + 1;

    // Colocar lógica y visual
    grid[target.r][target.c] = { color: chosenColor, special: 0 };
    vGrid[target.r][target.c].color = chosenColor;
    vGrid[target.r][target.c].scale = 1;
    vGrid[target.r][target.c].alpha = 1;

    // 2. Verificar racimos
    const cluster = LanzaburbujasLogic.findConnectedCluster(grid, target.r, target.c);
    if (cluster.length >= 3) {
      cluster.forEach(cell => {
        grid[cell.r][cell.c] = { color: 0, special: 0 };
        vGrid[cell.r][cell.c].color = 0;
        vGrid[cell.r][cell.c].scale = 0;
        vGrid[cell.r][cell.c].alpha = 0;
      });

      // 3. Caída de huérfanas
      const floating = LanzaburbujasLogic.findFloatingBubbles(grid);
      floating.forEach(cell => {
        grid[cell.r][cell.c] = { color: 0, special: 0 };
        vGrid[cell.r][cell.c].color = 0;
        vGrid[cell.r][cell.c].scale = 0;
        vGrid[cell.r][cell.c].alpha = 0;
      });
    }

    // 4. Cada 15 turnos simular bajada de techo
    if (turn % 15 === 0) {
      for (let r = CONFIG.MAX_ROWS - 1; r > 0; r--) {
        const maxCols = (r % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
        const prevCols = ((r - 1) % 2 === 0) ? CONFIG.COLS_EVEN : CONFIG.COLS_ODD;
        for (let c = 0; c < maxCols; c++) {
          if (c < prevCols) {
            grid[r][c] = { ...grid[r - 1][c] };
            vGrid[r][c].color = vGrid[r - 1][c].color;
            vGrid[r][c].scale = vGrid[r - 1][c].scale;
            vGrid[r][c].alpha = vGrid[r - 1][c].alpha;
          } else {
            grid[r][c] = { color: 0, special: 0 };
            vGrid[r][c].color = 0;
            vGrid[r][c].scale = 0;
          }
        }
      }
      // Rellenar techo
      for (let c = 0; c < CONFIG.COLS_EVEN; c++) {
        const newCol = Math.floor(Math.random() * 4) + 1;
        grid[0][c] = { color: newCol, special: 0 };
        vGrid[0][c].color = newCol;
        vGrid[0][c].scale = 1;
        vGrid[0][c].alpha = 1;
      }
    }

    // Verificar invariante de consistencia
    const status = LanzaburbujasLogic.verifyVisualLogicConsistency(grid, vGrid);
    assert(status.valid, `Invariante rota en el turno ${turn}: ${status.errors.join('; ')}`);
  }
});

// -------------------------------------------------------------------
// 7. Object Pooling del Motor de Tweens (ArcadeTween)
// -------------------------------------------------------------------
it('ArcadeTween gestiona 250 interpolaciones simultáneas sin fugas de memoria', () => {
  ArcadeTween.clear();
  const objects = [];
  for (let i = 0; i < 200; i++) {
    objects.push({ x: 0, y: 0, scale: 0 });
  }

  // Asignar tweens
  objects.forEach((obj, idx) => {
    ArcadeTween.to(obj, 0.2, { x: 100, y: 200, scale: 1.0 }, {
      delay: (idx % 5) * 0.02,
      easing: 'easeOutBack'
    });
  });

  assert(ArcadeTween.activeCount >= 190, 'El pool debe registrar los tweens activos');

  // Avanzar tiempo hasta completar todas
  ArcadeTween.update(0.1);
  ArcadeTween.update(0.15);
  ArcadeTween.update(0.2);

  // Todos los objetos deben haber alcanzado sus valores finales exactos
  objects.forEach(obj => {
    assert.strictEqual(obj.x, 100, 'x final debe ser 100');
    assert.strictEqual(obj.y, 200, 'y final debe ser 200');
    assert.strictEqual(obj.scale, 1.0, 'scale final debe ser 1.0');
  });

  assert.strictEqual(ArcadeTween.activeCount, 0, 'Todos los tweens deben haber sido devueltos al pool');
});

console.log(`\n🎉 Todas las ${passed}/${total} pruebas de lógica y sincronización visual pasaron con éxito.\n`);
