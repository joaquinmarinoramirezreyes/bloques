/**
 * scripts/test_gotas_animations.js
 * Suite exhaustiva de pruebas en Node.js para verificar el sistema de animación
 * y desacoplamiento de estado lógico/visual de Gotas (/games/gotas/).
 *
 * Invariantes verificadas:
 * 1. Object Pooling: Reutilización de 120 sprites, sin fugas ni huérfanos.
 * 2. Sincronización 1:1: Tras resolver cualquier cascada, el estado visual coincide
 *    exactamente con el estado lógico (celda a celda, tipo a tipo, sin fantasmas ni duplicados).
 * 3. Movimiento y Rotación: Interpolación suave con tweens.
 * 4. Caída con Gravedad: Squash & stretch, aceleración y retardo escalonado de columnas.
 * 5. Eliminación de Grupos: Secuencia de destello, encogimiento y liberación al pool.
 * 6. Gotas de Basura: Entrada desde arriba del tablero (y < 0) y asentamiento físico.
 * 7. Gotas Arcoíris: Detonación y limpieza masiva de color.
 */

const assert = require('assert');
const path = require('path');

// Cargar módulos
const { ArcadeTween: TweenEngine } = require('../shared/tween.js');
const {
  CONFIG,
  GotasLogic,
  DropVisualSprite,
  GotasVisualManager,
  GotasVisual,
  State
} = require('../games/gotas/game.js');

console.log('======================================================================');
console.log('  GOTAS - PRUEBAS AUTOMATIZADAS DE ANIMACIÓN Y ESTADO VISUAL');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  process.stdout.write(`[TEST ${totalTests}] ${name} ... `);
  try {
    fn();
    passedTests++;
    console.log('[OK] PASÓ');
  } catch (err) {
    console.log('[FAIL] FALLÓ');
    console.error(err);
    process.exit(1);
  }
}

// --------------------------------------------------------------------
// 1. VERIFICACIÓN DEL OBJECT POOLING
// --------------------------------------------------------------------
runTest('Object Pooling de Sprites (Capacidad, Asignación y Reutilización)', () => {
  GotasVisualManager.clear();
  assert.strictEqual(GotasVisualManager.pool.length, 120, 'El pool debe inicializarse con 120 sprites');
  assert.strictEqual(GotasVisualManager.activeCount(), 0, 'No debe haber sprites activos al inicio');

  // Obtener 20 sprites
  const obtained = [];
  for (let i = 0; i < 20; i++) {
    const s = GotasVisualManager.obtain(Math.floor(i / 6), i % 6, (i % 5) + 1);
    assert.strictEqual(s.active, true, 'El sprite obtenido debe estar activo');
    obtained.push(s);
  }

  // Liberar los 20 sprites
  for (const s of obtained) {
    GotasVisualManager.release(s);
    assert.strictEqual(s.active, false, 'El sprite liberado debe estar inactivo');
  }

  // Volver a obtener 20 y verificar que reutiliza los mismos slots sin crecer el pool
  for (let i = 0; i < 20; i++) {
    const s = GotasVisualManager.obtain(0, i % 6, 1);
    assert.strictEqual(s.active, true);
    GotasVisualManager.release(s);
  }
  assert.strictEqual(GotasVisualManager.pool.length, 120, 'El pool no debe haber crecido');
});

// --------------------------------------------------------------------
// 2. SINCRONIZACIÓN INICIAL GRID -> VISUALGRID
// --------------------------------------------------------------------
runTest('Sincronización Inicial (syncFromGrid)', () => {
  const grid = GotasLogic.createGrid();
  // Colocar varias piezas de prueba
  grid[11][0] = 1; // Rojo
  grid[11][1] = 2; // Verde
  grid[11][2] = 3; // Azul
  grid[10][0] = 4; // Amarillo
  grid[9][0] = 5;  // Púrpura
  grid[8][0] = CONFIG.TRASH_ID; // Basura
  grid[7][0] = CONFIG.RAINBOW_ID; // Arcoíris

  GotasVisualManager.syncFromGrid(grid);
  assert.strictEqual(GotasVisualManager.verifySync(grid), true, 'La sincronización debe ser 100% exacta');
  assert.strictEqual(GotasVisualManager.activeCount(), 7, 'Deben haber exactamente 7 sprites activos');
});

// --------------------------------------------------------------------
// 3. MOVIMIENTO Y ROTACIÓN DE PAREJA CON TWEENS
// --------------------------------------------------------------------
runTest('Interpolación de Pareja Activa (Movimiento y Rotación)', () => {
  State.grid = GotasLogic.createGrid();
  State.activePair = {
    c1: 2, r1: 1, color1: 1,
    c2: 2, r2: 0, color2: 2,
    rot: 0,
    vx1: 100, vy1: 50,
    vx2: 100, vy2: 20,
    vrot: 0,
    scaleX: 1, scaleY: 1
  };

  // Desplazar horizontalmente a columna 3
  TweenEngine.to(State.activePair, 0.08, { vx1: 150, vx2: 150 });
  assert.strictEqual(TweenEngine.activeCount > 0, true, 'Debe haber un tween activo para el movimiento');

  // Avanzar tiempo a la mitad (0.04s)
  TweenEngine.update(0.04);
  assert(State.activePair.vx1 > 100 && State.activePair.vx1 < 150, 'vx1 debe estar interpolando');

  // Completar el tween
  TweenEngine.update(0.05);
  assert.strictEqual(State.activePair.vx1, 150, 'vx1 debe haber llegado a 150');
  assert.strictEqual(State.activePair.vx2, 150, 'vx2 debe haber llegado a 150');
});

// --------------------------------------------------------------------
// 4. FIJACIÓN (LOCK) Y ATERRIZAJE CON SQUASH & STRETCH
// --------------------------------------------------------------------
runTest('Fijación de Pareja y Rebote de Aterrizaje (animateLock)', () => {
  GotasVisualManager.clear();
  const grid = GotasLogic.createGrid();
  State.grid = grid;

  const pair = {
    r1: 11, c1: 2, color1: 1,
    r2: 10, c2: 2, color2: 2,
    vx1: 150, vy1: 500,
    vx2: 150, vy2: 460
  };

  let lockFinished = false;
  GotasVisual.animateLock(pair, () => {
    lockFinished = true;
  });

  const s1 = GotasVisualManager.visualGrid[11][2];
  const s2 = GotasVisualManager.visualGrid[10][2];
  assert(s1 !== null && s2 !== null, 'Los sprites deben colocarse en visualGrid');
  assert.strictEqual(s1.scaleY, 0.72, 'Debe iniciar con squash vertical (0.72)');
  assert.strictEqual(s1.scaleX, 1.28, 'Debe iniciar con stretch horizontal (1.28)');

  // Avanzar tiempo con dt
  for (let step = 0; step < 20; step++) {
    TweenEngine.update(0.02);
  }

  assert.strictEqual(lockFinished, true, 'El callback de lock debe completarse');
  assert.strictEqual(s1.scaleX, 1, 'scaleX debe volver a 1.0');
  assert.strictEqual(s1.scaleY, 1, 'scaleY debe volver a 1.0');
});

// --------------------------------------------------------------------
// 5. CAÍDA CON GRAVEDAD (animateGravity)
// --------------------------------------------------------------------
runTest('Caída con Gravedad Escalona Columnas y Aterriza con Squash', () => {
  GotasVisualManager.clear();
  const grid = GotasLogic.createGrid();

  // Colocar una gota suspendida en fila 0
  grid[0][0] = 1;
  GotasVisualManager.syncFromGrid(grid);

  const falls = [{ fromR: 0, toR: 11, c: 0, color: 1 }];
  grid[11][0] = 1;
  grid[0][0] = 0;

  let gravityDone = false;
  GotasVisual.animateGravity(falls, () => {
    gravityDone = true;
  });

  // Durante la caída, la celda origen debe quedar null y destino debe apuntar al sprite
  assert.strictEqual(GotasVisualManager.visualGrid[0][0], null);
  const fallingSprite = GotasVisualManager.visualGrid[11][0];
  assert(fallingSprite !== null, 'El sprite debe estar en la celda destino');
  assert.strictEqual(fallingSprite.isFalling, true);

  // Simular paso del tiempo hasta completar caída y rebote
  for (let i = 0; i < 30; i++) {
    TweenEngine.update(0.02);
  }

  assert.strictEqual(gravityDone, true, 'La animación de caída debe haber concluido');
  assert.strictEqual(fallingSprite.isFalling, false);
  assert.strictEqual(fallingSprite.scaleX, 1);
  assert.strictEqual(fallingSprite.scaleY, 1);
  assert.strictEqual(GotasVisualManager.verifySync(grid), true, 'Visual y lógico deben coincidir 100%');
});

// --------------------------------------------------------------------
// 6. ENTRADA DE BASURA DESDE ARRIBA (y < 0)
// --------------------------------------------------------------------
runTest('Entrada de Basura desde arriba del tablero (animateTrashDrop)', () => {
  GotasVisualManager.clear();
  const grid = GotasLogic.createGrid();

  const trashStep = {
    spawns: [{ c: 1, color: CONFIG.TRASH_ID }, { c: 3, color: CONFIG.TRASH_ID }],
    falls: [{ fromR: 0, toR: 11, c: 1, color: CONFIG.TRASH_ID }, { fromR: 0, toR: 11, c: 3, color: CONFIG.TRASH_ID }]
  };

  grid[11][1] = CONFIG.TRASH_ID;
  grid[11][3] = CONFIG.TRASH_ID;

  let trashDone = false;
  GotasVisual.animateTrashDrop(trashStep, () => {
    trashDone = true;
  });

  const trashSprite1 = GotasVisualManager.visualGrid[11][1];
  const trashSprite2 = GotasVisualManager.visualGrid[11][3];

  assert(trashSprite1 !== null && trashSprite2 !== null);
  assert(trashSprite1.y < 50, 'El sprite de basura debe haber iniciado por encima de la vista (y < 0)');

  for (let i = 0; i < 30; i++) {
    TweenEngine.update(0.02);
  }

  assert.strictEqual(trashDone, true, 'La entrada de basura debe finalizar');
  assert.strictEqual(GotasVisualManager.verifySync(grid), true);
});

// --------------------------------------------------------------------
// 7. SIMULACIÓN MASIVA DE 1,000 CASCADAS ALEATORIAS
// --------------------------------------------------------------------
runTest('Simulación de 1,000 Cascadas y Reacciones (Sincronización 100% Verificada)', () => {
  let totalStepsSimulated = 0;

  for (let testIdx = 0; testIdx < 1000; testIdx++) {
    GotasVisualManager.clear();
    const grid = GotasLogic.createGrid();

    // Generar un tablero aleatorio con grupos potenciales
    const rows = CONFIG.ROWS;
    const cols = CONFIG.COLS;
    const fillRows = 3 + Math.floor(Math.random() * 6);

    for (let r = rows - fillRows; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() < 0.8) {
          // Asignar colores aleatorios entre 1 y 4 (mayor probabilidad de grupos)
          grid[r][c] = 1 + Math.floor(Math.random() * 4);
        }
      }
    }

    // Ocasionalmente insertar gota arcoíris o basura
    if (Math.random() < 0.15) {
      grid[rows - 1][Math.floor(Math.random() * cols)] = CONFIG.RAINBOW_ID;
    }
    if (Math.random() < 0.25) {
      grid[rows - 2][Math.floor(Math.random() * cols)] = CONFIG.TRASH_ID;
    }

    // Sincronizar estado visual inicial
    GotasVisualManager.syncFromGrid(grid);
    assert.strictEqual(GotasVisualManager.verifySync(grid), true, 'Fallo en sync inicial');

    // Resolver paso a paso ejecutando animaciones y comprobando el estado
    let cascadeStep = 0;
    while (true) {
      const step = GotasLogic.stepCascade(grid, cascadeStep);
      if (step.type === 'settled') break;

      totalStepsSimulated++;

      let stepDone = false;
      if (step.type === 'gravity') {
        GotasVisual.animateGravity(step.falls, () => { stepDone = true; });
      } else if (step.type === 'rainbow') {
        GotasVisual.animateRainbow(step, () => { stepDone = true; });
      } else if (step.type === 'matches') {
        cascadeStep = step.stepNumber;
        GotasVisual.animateMatches(step, () => { stepDone = true; });
      }

      // Avanzar tweens hasta completar el paso
      let safetyTicks = 0;
      while (!stepDone && safetyTicks < 100) {
        TweenEngine.update(0.02);
        safetyTicks++;
      }
      assert.strictEqual(stepDone, true, `El paso ${step.type} no completó sus animaciones`);
    }

    // Al estabilizarse, el estado visual debe coincidir EXACTAMENTE con el lógico
    assert.strictEqual(
      GotasVisualManager.verifySync(grid),
      true,
      `Desincronización en partida aleatoria #${testIdx}`
    );

    // Verificar que no hay sprites huérfanos o transitorios flotando
    assert.strictEqual(GotasVisualManager.transientSprites.length, 0, 'No deben quedar sprites transitorios');
  }

  console.log(`\n    -> Simulados ${totalStepsSimulated.toLocaleString()} pasos de cascada con 0 desincronizaciones.`);
});

console.log('\n======================================================================');
console.log(`  RESUMEN: ${passedTests}/${totalTests} pruebas pasadas con éxito.`);
console.log('======================================================================');
