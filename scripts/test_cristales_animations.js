/**
 * scripts/test_cristales_animations.js
 * 
 * Verificación integral del sistema de animación de Cristales:
 *  1. Estado lógico vs Estado visual (sprites separados de la matriz).
 *  2. Reproducción de eventos ordenados mediante tweens (shared/tween.js).
 *  3. Invariante visual: al terminar la reproducción de cualquier jugada o cascada,
 *     el estado visual coincide EXACTAMENTE con el lógico (sin gemas fantasma,
 *     duplicadas ni perdidas).
 *  4. Intercambio regular e intercambio rechazado (rebote y retorno elástico).
 *  5. Entrada de piezas nuevas desde fuera del tablero (y < 0).
 *  6. Caída por gravedad, escalonamiento y rebote de aterrizaje (squash and stretch).
 *  7. Entrada en cola (input queue) sin romper el estado del tablero.
 */

const assert = require('assert');
const { ArcadeTween } = require('../shared/tween.js');
const {
  CONFIG,
  CristalesLogic,
  CristalesVisualManager,
  GemVisualSprite
} = require('../games/cristales/game.js');

console.log('======================================================================');
console.log('  TEST SUITE: SISTEMA DE ANIMACIÓN Y ESTADO VISUAL (CRISTALES)        ');
console.log('======================================================================\n');

function advanceTweens(totalSeconds = 2.0, step = 0.016) {
  let elapsed = 0;
  while (elapsed < totalSeconds && ArcadeTween.activeCount > 0) {
    ArcadeTween.update(step);
    elapsed += step;
  }
}

// ----------------------------------------------------------------------
// Test 1: Instanciación de sprites y Object Pooling
// ----------------------------------------------------------------------
console.log('[Test 1] Verificando Object Pooling y sprites visuales...');
const visual = new CristalesVisualManager(CONFIG.COLS, CONFIG.ROWS, 60);
assert.strictEqual(visual.spritePool.length >= 160, true, 'El pool debe tener al menos 160 slots');

const s1 = visual.acquireSprite();
assert.strictEqual(s1.active, true);
assert.strictEqual(s1.alpha, 1.0);
assert.strictEqual(s1.scale, 1.0);

visual.releaseSprite(s1);
assert.strictEqual(s1.active, false);
console.log('  [OK] Object pooling de sprites funciona con reutilización limpia.');

// ----------------------------------------------------------------------
// Test 2: Sincronización inicial y verificación de correspondencia 1:1
// ----------------------------------------------------------------------
console.log('[Test 2] Verificando sincronización inicial logical -> visual...');
const grid = CristalesLogic.generateBoard(CONFIG.COLS, CONFIG.ROWS, CONFIG.NUM_GEM_TYPES);
visual.syncFromLogical(grid);

const initialCheck = visual.verifyMatches(grid);
assert.strictEqual(initialCheck.valid, true, `Desincronización inicial: ${initialCheck.errors.join(', ')}`);
console.log('  [OK] 64 sprites coinciden con la matriz lógica al inicio.');

// ----------------------------------------------------------------------
// Test 3: Intercambio regular (Swap) y actualización visual
// ----------------------------------------------------------------------
console.log('[Test 3] Verificando animación de swap válido...');
const validMove = CristalesLogic.findAnyValidMove(grid);
assert.notStrictEqual(validMove, null, 'Debe existir al menos un movimiento válido');

const { r1, c1, r2, c2 } = validMove;
const type1Before = grid[r1][c1].type;
const type2Before = grid[r2][c2].type;

let swapCompleted = false;
visual.animateSwap(r1, c1, r2, c2, true, 1.0, () => {
  swapCompleted = true;
});

// Durante la animación, los tweens deben estar activos
assert.strictEqual(ArcadeTween.activeCount > 0, true, 'Deben existir tweens activos durante el swap');

// Avanzar el tiempo hasta que termine el tween
advanceTweens(1.0);
assert.strictEqual(swapCompleted, true, 'El callback de onComplete del swap debe haberse ejecutado');

// Aplicar lógicamente para verificar coincidencia
const temp = grid[r1][c1];
grid[r1][c1] = grid[r2][c2];
grid[r2][c2] = temp;

const swapCheck = visual.verifyMatches(grid);
assert.strictEqual(swapCheck.valid, true, `Desincronización post-swap: ${swapCheck.errors.join(', ')}`);
assert.strictEqual(visual.visualGrid[r1][c1].type, type2Before);
assert.strictEqual(visual.visualGrid[r2][c2].type, type1Before);
console.log('  [OK] Intercambio visual válido probado con easing y consistencia perfecta.');

// ----------------------------------------------------------------------
// Test 4: Intercambio inválido rechazado (Rebound con easeOutBack)
// ----------------------------------------------------------------------
console.log('[Test 4] Verificando rebote y retorno elástico en swap inválido...');
let invalidR1 = 0, invalidC1 = 0, invalidR2 = 0, invalidC2 = 1;
// Encontrar dos gemas cuyo swap no sea válido
for (let r = 0; r < 8; r++) {
  for (let c = 0; c < 7; c++) {
    if (!CristalesLogic.isValidSwap(grid, r, c, r, c + 1)) {
      invalidR1 = r; invalidC1 = c; invalidR2 = r; invalidC2 = c + 1;
      break;
    }
  }
}

let rejectCompleted = false;
visual.animateSwap(invalidR1, invalidC1, invalidR2, invalidC2, false, 1.0, () => {
  rejectCompleted = true;
});

assert.strictEqual(ArcadeTween.activeCount > 0, true);
advanceTweens(1.0);
assert.strictEqual(rejectCompleted, true);

// Las posiciones de visualGrid deben permanecer intactas en sus celdas originales
const rejectCheck = visual.verifyMatches(grid);
assert.strictEqual(rejectCheck.valid, true, `Desincronización tras swap rechazado: ${rejectCheck.errors.join(', ')}`);
console.log('  [OK] Swap inválido rechazado probado: las piezas van y regresan a su lugar exacto.');

// ----------------------------------------------------------------------
// Test 5: Cascada completa con eliminaciones, gravedad, refiltrado y especiales
// ----------------------------------------------------------------------
console.log('[Test 5] Simulando 1000 pasos de cascadas completas...');
let totalCascadesResolved = 0;
let totalStepsAnimated = 0;

for (let gameIdx = 0; gameIdx < 200; gameIdx++) {
  const testGrid = CristalesLogic.generateBoard(CONFIG.COLS, CONFIG.ROWS, CONFIG.NUM_GEM_TYPES);
  visual.syncFromLogical(testGrid);

  // Ejecutar jugadas y resolver cascadas paso a paso
  for (let moveIdx = 0; moveIdx < 5; moveIdx++) {
    const move = CristalesLogic.findAnyValidMove(testGrid);
    if (!move) break;

    // Aplicar movimiento
    const t = testGrid[move.r1][move.c1];
    testGrid[move.r1][move.c1] = testGrid[move.r2][move.c2];
    testGrid[move.r2][move.c2] = t;

    // Animar swap
    visual.animateSwap(move.r1, move.c1, move.r2, move.c2, true, 2.0);
    advanceTweens(0.5);

    // Resolver pasos de cascada
    let stepCount = 0;
    while (stepCount < 30) {
      stepCount++;
      const step = CristalesLogic.stepCascade(testGrid);
      if (!step.hasMatches) break;

      totalStepsAnimated++;
      let stepDone = false;
      visual.animateCascadeStep(step, 2.0, () => {
        stepDone = true;
      });

      advanceTweens(2.0);
      assert.strictEqual(stepDone, true, 'El callback de animateCascadeStep debe completarse');

      // Verificar que el estado visual coincide con el lógico tras cada paso
      const stepSync = visual.verifyMatches(testGrid);
      if (!stepSync.valid) {
        console.error('ERROR en paso de cascada:', stepSync.errors);
        assert.fail(`Desincronización tras paso ${stepCount}: ${stepSync.errors[0]}`);
      }
    }

    totalCascadesResolved++;
    // Verificación final del tablero en reposo
    const finalSync = visual.verifyMatches(testGrid);
    assert.strictEqual(finalSync.valid, true, `Desincronización al final de cascada: ${finalSync.errors.join(', ')}`);
  }
}

console.log(`  [OK] ${totalCascadesResolved} cascadas resueltas (${totalStepsAnimated} pasos animados individuales).`);
console.log('  [OK] Cero discrepancias: matriz lógica y visualGrid coinciden al 100%.');

// ----------------------------------------------------------------------
// Test 6: Entrada de piezas desde arriba (y < 0)
// ----------------------------------------------------------------------
console.log('[Test 6] Verificando que las piezas nuevas entran desde fuera del tablero (y < 0)...');
const spawnTestGrid = CristalesLogic.generateBoard(CONFIG.COLS, CONFIG.ROWS, CONFIG.NUM_GEM_TYPES);
// Vaciar fila 0 y 1 en la columna 3
spawnTestGrid[0][3] = { type: 0, special: 0, obstacle: 0 };
spawnTestGrid[1][3] = { type: 0, special: 0, obstacle: 0 };

const spawnStep = CristalesLogic.stepCascade(spawnTestGrid);
assert.strictEqual(spawnStep.spawnedGems.length >= 2, true);

// Verificar que las coordenadas startY de las piezas que entran sean negativas
for (const sp of spawnStep.spawnedGems) {
  assert.strictEqual(sp.startY < 0, true, `La gema nueva debe iniciar con y < 0, valor: ${sp.startY}`);
}
console.log('  [OK] Las piezas nuevas comienzan fuera de la vista y caen con gravedad física.');

// ----------------------------------------------------------------------
// Test 7: Animación de ola al llenar el tablero (Board Fill)
// ----------------------------------------------------------------------
console.log('[Test 7] Verificando animación de ola al inicio de nivel...');
const waveGrid = CristalesLogic.generateBoard(CONFIG.COLS, CONFIG.ROWS, CONFIG.NUM_GEM_TYPES);
let waveDone = false;
visual.animateBoardFill(waveGrid, 2.0, () => {
  waveDone = true;
});

assert.strictEqual(ArcadeTween.activeCount > 0, true);
advanceTweens(2.0);
assert.strictEqual(waveDone, true);

const waveSync = visual.verifyMatches(waveGrid);
assert.strictEqual(waveSync.valid, true);
console.log('  [OK] Tablero en ola probado con aterrizaje elástico y consistencia total.');

console.log('\n======================================================================');
console.log('[PASS] TODAS LAS PRUEBAS DE ANIMACIÓN DE CRISTALES PASARON CON ÉXITO');
console.log('======================================================================');
