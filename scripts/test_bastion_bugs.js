/**
 * scripts/test_bastion_bugs.js
 * Verificación automatizada en Node.js de los Bugs 5 y 6 de Bastión.
 */

const assert = require('assert');
const { BastionGame } = require('../games/bastion/game');

console.log('[TEST] Iniciando verificación y pruebas de Bugs 5 y 6 en Bastión...\n');

let bug5Passed = false;
let bug6Passed = false;

// =========================================================================
// VERIFICACIÓN BUG 5: Al terminar la oleada 20 el juego debe poder continuar
// =========================================================================
console.log('--- VERIFICACIÓN BUG 5: Continuación tras Oleada 20 en Modo Sin Fin ---');
{
  const game = new BastionGame(null, { mapIndex: 0, initialGold: 1000 });
  
  // Colocamos una torre para comprobar persistencia
  game.placeTower('balistico', 2, 2);
  const towerCountBefore = game.towers.length;
  const goldBefore = game.gold;

  // 1. Simular fin de la oleada 20
  game.currentWave = 20;
  game.waveActive = true;
  game.waveSpawnQueue = [];
  game.enemies = []; // Sin enemigos vivos
  
  // Ejecutar un tick de update para que la oleada 20 termine y salte victoria
  game.update(0.05);

  console.log(`Estado al ganar oleada 20: waveActive=${game.waveActive}, victory=${game.victory}, currentWave=${game.currentWave}`);
  assert.strictEqual(game.victory, true, 'La victoria debe activarse al terminar la oleada 20');
  assert.strictEqual(game.waveActive, false, 'La oleada 20 debe finalizar');
  const goldAfterWave20 = game.gold;

  // 2. Comprobar que el juego queda en victoria y congelado si no se transiciona
  assert.strictEqual(game.victory, true, 'Victoria está activa al vencer oleada 20');
  const spawnTimerBefore = game.waveSpawnTimer;
  game.update(0.1);
  assert.strictEqual(game.waveSpawnTimer, spawnTimerBefore, 'update(dt) no avanza durante la pantalla de victoria');

  // 3. Ejecutar la solución oficial: continueToEndless() y luego startWave()
  console.log('Ejecutando game.continueToEndless()...');
  game.continueToEndless();
  game.startWave();

  console.log(`Estado tras continueToEndless: waveActive=${game.waveActive}, victory=${game.victory}, currentWave=${game.currentWave}, isEndless=${game.isEndless}`);
  assert.strictEqual(game.victory, false, 'Victoria debe desactivarse para desbloquear el bucle update()');
  assert.strictEqual(game.isEndless, true, 'El modo de juego debe pasar a isEndless=true');
  assert.strictEqual(game.currentWave, 21, 'Debe iniciar la oleada 21');
  assert.strictEqual(game.waveActive, true, 'La oleada 21 debe estar activa');
  assert.strictEqual(game.towers.length, towerCountBefore, 'Las torres previas deben conservarse intactas');
  assert.strictEqual(game.gold, goldAfterWave20, 'El oro acumulado debe conservarse intacto');

  // 4. Ejecutar 30 ticks de simulación y comprobar que el bucle corre y genera enemigos
  const initialSpawnCount = game.waveSpawnQueue.length;
  console.log(`Cola de enemigos para oleada 21: ${initialSpawnCount} enemigos`);
  assert(initialSpawnCount > 0, 'La oleada 21 debe tener enemigos generados');

  for (let i = 0; i < 30; i++) {
    game.update(0.05);
  }

  assert(game.waveSpawnTimer > 0 || game.enemies.length > 0, 'La simulación avanza y spawnea enemigos en oleada 21');
  console.log(`[OK] BUG 5 SOLUCIONADO: Oleada 21 en marcha con ${game.enemies.length} enemigos generados y ${game.towers.length} torres activas.`);
  bug5Passed = true;
}

console.log('\n--- VERIFICACIÓN BUG 6: Temblor de Pantalla Centralizado y Sin Atascos ---');
// =========================================================================
// VERIFICACIÓN BUG 6: Temblor de pantalla controlado y con decaimiento a 0
// =========================================================================
{
  const game = new BastionGame(null, { mapIndex: 0 });

  // 1. Comprobar clamping de amplitud y duración máximas
  game.screenShake(10.0, 1.0);
  console.log(`Clamp check: shakeIntensity=${game.shakeIntensity} (max 4.5), shakeTimer=${game.shakeTimer} (max 0.25)`);
  assert(game.shakeIntensity <= 4.5, 'La intensidad debe estar acotada a <= 4.5');
  assert(game.shakeTimer <= 0.25, 'La duración debe estar acotada a <= 0.25s');

  // 2. Comprobar decaimiento a cero exacto durante juego normal
  for (let i = 0; i < 20; i++) {
    game.update(0.02);
  }
  console.log(`Estado tras 0.4s de juego normal: shakeTimer=${game.shakeTimer}, shakeIntensity=${game.shakeIntensity}`);
  assert.strictEqual(game.shakeTimer, 0, 'shakeTimer debe decaer a 0 exacto');
  assert.strictEqual(game.shakeIntensity, 0, 'shakeIntensity debe resetearse a 0');

  // 3. Comprobar reset inmediato en GameOver
  game.screenShake(4.0, 0.2);
  game.lives = 0;
  game.gameOver = true;
  game.update(0.016);
  console.log(`Reset en GameOver: shakeTimer=${game.shakeTimer}, shakeIntensity=${game.shakeIntensity}`);
  assert.strictEqual(game.shakeTimer, 0, 'shakeTimer debe ser 0 al perder');
  assert.strictEqual(game.shakeIntensity, 0, 'shakeIntensity debe ser 0 al perder');

  // 4. Comprobar reset inmediato en Pausa
  const gamePause = new BastionGame(null, { mapIndex: 0 });
  gamePause.screenShake(4.0, 0.2);
  gamePause.isPaused = true;
  gamePause.update(0.016);
  console.log(`Reset en Pausa: shakeTimer=${gamePause.shakeTimer}`);
  assert.strictEqual(gamePause.shakeTimer, 0, 'shakeTimer debe ser 0 en pausa');

  // 5. Comprobar reset inmediato en Victoria
  const gameVic = new BastionGame(null, { mapIndex: 0 });
  gameVic.screenShake(4.0, 0.2);
  gameVic.victory = true;
  gameVic.update(0.016);
  console.log(`Reset en Victoria: shakeTimer=${gameVic.shakeTimer}`);
  assert.strictEqual(gameVic.shakeTimer, 0, 'shakeTimer debe ser 0 en victoria');

  // 6. Comprobar que CONFIG.SHAKE_EVENTS solo permite eventos autorizados
  assert(BastionGame.CONFIG.SHAKE_EVENTS.core_damage, 'core_damage debe estar en SHAKE_EVENTS');
  assert(BastionGame.CONFIG.SHAKE_EVENTS.boss_death, 'boss_death debe estar en SHAKE_EVENTS');
  assert(BastionGame.CONFIG.SHAKE_EVENTS.orbital_strike, 'orbital_strike debe estar en SHAKE_EVENTS');
  assert.strictEqual(BastionGame.CONFIG.SHAKE_EVENTS.wave_early, undefined, 'wave_early NO debe generar temblor');

  console.log('[OK] BUG 6 SOLUCIONADO: Temblor acotado, decayendo a 0 exacto y reseteándose en todos los estados.');
  bug6Passed = true;
}

console.log('\n=======================================================');
console.log('Resultados de Verificación:');
console.log(`- Bug 5 (Continuación tras Oleada 20): ${bug5Passed ? 'PASÓ (CORREGIDO)' : 'FALLÓ'}`);
console.log(`- Bug 6 (Temblor de pantalla atascado): ${bug6Passed ? 'PASÓ (CORREGIDO)' : 'FALLÓ'}`);
console.log('=======================================================\n');

if (!bug5Passed || !bug6Passed) {
  process.exit(1);
} else {
  console.log('[PASS] Todas las pruebas de bugs en Bastión pasaron exitosamente.');
}
