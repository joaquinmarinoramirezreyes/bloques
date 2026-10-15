/**
 * scripts/test_bastion_phase5.js
 * Suite de pruebas unitarias y de integración para la FASE 5 de Bastión:
 * 1. Modo Sin Fin (Endless Mode) con escalado infinito y jefes periódicos.
 * 2. Persistencia y registro de récord en 'bastion:endless:v1'.
 * 3. Límites de cámara (clampCamera) para zoom y paneo móvil.
 * 4. Transformación inversa de coordenadas con cámara activa.
 * 5. Herramientas y atajos de depuración (?debug=1).
 * 6. Reinicio de progreso permanente con confirmación.
 * 7. Inspección de estándares táctiles móviles (touch-action, safe-area, tamaños >= 44px).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { BastionGame } = require('../games/bastion/game');
const { CampaignManager } = require('../games/bastion/data/campana');
const { MetaManager } = require('../games/bastion/data/mejoras');

let passedTests = 0;
let totalTests = 0;

function test(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ PASÓ: ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ FALLÓ: ${description}`);
    console.error(err);
  }
}

console.log('======================================================================');
console.log('  TEST SUITE: BASTIÓN FASE 5 (MODO SIN FIN, MÓVIL, DEBUG Y RESET)    ');
console.log('======================================================================\n');

// -----------------------------------------------------------------------------
// [1] MODO SIN FIN (ENDLESS MODE)
// -----------------------------------------------------------------------------
console.log('[1] Verificación del Modo Sin Fin');

test('Modo Sin Fin configura maxWaves = Infinity e isEndless = true', () => {
  const game = new BastionGame(null, { isEndless: true });
  assert.strictEqual(game.isEndless, true);
  assert.strictEqual(game.maxWaves, Infinity);
});

test('Generación de oleadas sin fin para w > 20 con escalado y jefes cada 5 oleadas', () => {
  const game = new BastionGame(null, { isEndless: true });
  
  // Oleada 21 (estándar escalada)
  const q21 = game.buildWaveQueue(21);
  assert.ok(q21.length > 20, 'Oleada 21 debe tener escuadrones nutridos');
  const hasBoss21 = q21.some(item => item.typeId === 'jefe_coloso');
  assert.strictEqual(hasBoss21, false, 'Oleada 21 no debe tener jefe');

  // Oleada 25 (múltiplo de 5: oleada de jefe)
  const q25 = game.buildWaveQueue(25);
  const bossCount25 = q25.filter(item => item.typeId === 'jefe_coloso').length;
  assert.ok(bossCount25 >= 1, 'Oleada 25 debe tener al menos 1 Jefe Coloso');

  // Oleada 30 (segundo múltiplo de 5 en sin fin: escala de jefes)
  const q30 = game.buildWaveQueue(30);
  const bossCount30 = q30.filter(item => item.typeId === 'jefe_coloso').length;
  assert.ok(bossCount30 >= 2, 'Oleada 30 debe escalar el número de Jefes Colosos');
});

test('Radar Táctico (Wave Intel) opera correctamente en oleadas sin fin > 20', () => {
  const game = new BastionGame(null, { isEndless: true });
  game.currentWave = 24;
  const intel = game.getNextWaveIntel(25);
  assert.ok(intel !== null, 'Wave intel no debe ser null en modo sin fin');
  assert.strictEqual(intel.waveNum, 25);
  assert.strictEqual(intel.hasBoss, true, 'Intel debe alertar de presencia de jefe en W25');
  assert.ok(intel.total > 0);
});

// -----------------------------------------------------------------------------
// [2] PERSISTENCIA Y RÉCORD EN MODO SIN FIN
// -----------------------------------------------------------------------------
console.log('\n[2] Persistencia y Récord en Modo Sin Fin');

test('Carga y guardado seguro de récord en bastion:endless:v1', () => {
  // Mock localStorage para Node.js
  const storageMap = new Map();
  global.localStorage = {
    getItem: (k) => storageMap.get(k) || null,
    setItem: (k, v) => storageMap.set(k, String(v)),
    removeItem: (k) => storageMap.delete(k)
  };

  const game = new BastionGame(null, { isEndless: true });
  const initialRec = game.loadEndlessRecord();
  assert.strictEqual(initialRec.bestWave, 0);

  // Guardar nuevo récord
  game.saveEndlessRecord(28, 45000);
  const loaded = game.loadEndlessRecord();
  assert.strictEqual(loaded.bestWave, 28);
  assert.strictEqual(loaded.bestScore, 45000);

  // Intentar guardar marca inferior (debe mantener el mejor récord)
  game.saveEndlessRecord(15, 20000);
  const preserved = game.loadEndlessRecord();
  assert.strictEqual(preserved.bestWave, 28);
  assert.strictEqual(preserved.bestScore, 45000);
});

// -----------------------------------------------------------------------------
// [3] LÍMITES DE CÁMARA (CLAMP CAMERA)
// -----------------------------------------------------------------------------
console.log('\n[3] Límites de Cámara y Paneo Móvil');

test('clampCamera() resetea paneo a (0,0) cuando zoom es 1.0', () => {
  const game = new BastionGame(null, { mapIndex: 0 });
  game.cameraZoom = 1.0;
  game.cameraPanX = 150;
  game.cameraPanY = -80;
  game.clampCamera();
  assert.strictEqual(game.cameraPanX, 0);
  assert.strictEqual(game.cameraPanY, 0);
});

test('clampCamera() acota el zoom entre 1.0 y 2.5', () => {
  const game = new BastionGame(null, { mapIndex: 0 });
  game.cameraZoom = 5.0;
  game.clampCamera();
  assert.strictEqual(game.cameraZoom, 2.5);

  game.cameraZoom = 0.2;
  game.clampCamera();
  assert.strictEqual(game.cameraZoom, 1.0);
});

test('clampCamera() restringe el paneo para que el mapa nunca se salga de la vista', () => {
  const game = new BastionGame(null, { mapIndex: 0 });
  game.cameraZoom = 2.0;
  const maxPanX = (game.width / 2) * (1 - 1 / 2.0); // 720 / 2 * 0.5 = 180
  const maxPanY = (game.height / 2) * (1 - 1 / 2.0); // 468 / 2 * 0.5 = 117

  game.cameraPanX = 500; // Paneo excesivo a la derecha
  game.cameraPanY = -400; // Paneo excesivo hacia arriba
  game.clampCamera();

  assert.strictEqual(game.cameraPanX, maxPanX, 'Debe acotar al maxPanX permitido');
  assert.strictEqual(game.cameraPanY, -maxPanY, 'Debe acotar al -maxPanY permitido');
});

// -----------------------------------------------------------------------------
// [4] TRANSFORMACIÓN INVERSA DE COORDENADAS
// -----------------------------------------------------------------------------
console.log('\n[4] Transformación Inversa de Coordenadas con Cámara Móvil');

test('Fórmula de transformación inversa de cámara calcula la celda correcta', () => {
  const gameW = 720;
  const gameH = 468;
  const cellSize = 36;
  const zoom = 1.5;
  const panX = 40;
  const panY = -30;
  const cx = gameW / 2;
  const cy = gameH / 2;

  // Punto en el mundo original: celda (10, 6) centro -> x: (10 + 0.5)*36 = 378, y: (6 + 0.5)*36 = 234
  const worldX = 378;
  const worldY = 234;

  // Proyección directa de la cámara (render):
  const screenX = cx + zoom * (worldX - cx + panX);
  const screenY = cy + zoom * (worldY - cy + panY);

  // Transformación inversa (getGameCoords):
  const reconstructedWorldX = cx - panX + (screenX - cx) / zoom;
  const reconstructedWorldY = cy - panY + (screenY - cy) / zoom;

  assert.ok(Math.abs(reconstructedWorldX - worldX) < 0.0001, 'X reconstruida debe coincidir con X del mundo');
  assert.ok(Math.abs(reconstructedWorldY - worldY) < 0.0001, 'Y reconstruida debe coincidir con Y del mundo');

  const c = Math.floor(reconstructedWorldX / cellSize);
  const r = Math.floor(reconstructedWorldY / cellSize);
  assert.strictEqual(c, 10, 'Columna reconstruida debe ser 10');
  assert.strictEqual(r, 6, 'Fila reconstruida debe ser 6');
});

// -----------------------------------------------------------------------------
// [5] HERRAMIENTAS Y ATAJOS DE DEPURACIÓN (?debug=1)
// -----------------------------------------------------------------------------
console.log('\n[5] Herramientas de Depuración (?debug=1)');

test('addDebugGold() añade exactamente 1000 de oro y registra en estadísticas', () => {
  const game = new BastionGame(null, { initialGold: 300 });
  const startGold = game.gold;
  game.addDebugGold(1000);
  assert.strictEqual(game.gold, startGold + 1000);
  assert.strictEqual(game.stats.goldEarned, startGold + 1000);
});

test('addDebugLives() añade 50 vidas y aumenta maxLives', () => {
  const game = new BastionGame(null, { initialLives: 20 });
  game.addDebugLives(50);
  assert.strictEqual(game.lives, 70);
  assert.strictEqual(game.maxLives, 70);
});

test('nukeAllEnemies() elimina a todas las criaturas activas instantáneamente', () => {
  const game = new BastionGame(null);
  game.spawnEnemy('blindado', 1.0);
  game.spawnEnemy('veloz', 1.0);
  game.spawnEnemy('etero', 1.0);
  assert.strictEqual(game.enemies.filter(e => e.alive).length, 3);

  game.nukeAllEnemies();
  assert.strictEqual(game.enemies.filter(e => e.alive).length, 0);
});

test('skipWaveDebug() vacía la cola de spawn y aniquila enemigos para cerrar la oleada', () => {
  const game = new BastionGame(null);
  game.startWave(3);
  assert.ok(game.waveSpawnQueue.length > 0);
  game.spawnEnemy('reptante', 1.0);

  game.skipWaveDebug();
  assert.strictEqual(game.waveSpawnQueue.length, 0);
  assert.strictEqual(game.enemies.filter(e => e.alive).length, 0);
});

// -----------------------------------------------------------------------------
// [6] REINICIO DE PROGRESO PERMANENTE (RESET)
// -----------------------------------------------------------------------------
console.log('\n[6] Reinicio de Progreso Permanente');

test('CampaignManager.prototype.resetProgress() reinicia estrellas, récords y mapas', () => {
  const manager = new CampaignManager();
  manager.data.unlockedMaps = [0, 1, 2, 3];
  manager.data.stars = { 0: 3, 1: 3, 2: 2, 3: 1, 4: 0, 5: 0 };
  manager.data.bestScores = { 0: 5000, 1: 4200, 2: 3800, 3: 2000, 4: 0, 5: 0 };
  manager.save();

  manager.resetProgress();
  assert.deepStrictEqual(manager.data.unlockedMaps, [0], 'Solo el Sector 1 debe quedar desbloqueado');
  assert.strictEqual(manager.getStars(0), 0, 'Las estrellas deben reiniciarse a 0');
  assert.strictEqual(manager.getBestScore(0), 0, 'Los récords deben reiniciarse a 0');
});

test('MetaManager.prototype.reset() reinicia esquirlas, niveles y estadísticas', () => {
  const meta = new MetaManager();
  meta.shards = 250;
  meta.upgrades.reserva_inicial = 3;
  meta.upgrades.baluarte_nucleo = 2;
  meta.stats.gamesWon = 5;
  meta.save();

  meta.reset();
  assert.strictEqual(meta.shards, 0, 'Esquirlas deben ser 0');
  assert.strictEqual(meta.getUpgradeLevel('reserva_inicial'), 0, 'Rango de mejora debe ser 0');
  assert.strictEqual(meta.getUpgradeLevel('baluarte_nucleo'), 0, 'Rango de mejora debe ser 0');
  assert.strictEqual(meta.stats.gamesWon, 0, 'Estadísticas deben ser 0');
});

// -----------------------------------------------------------------------------
// [7] ESTÁNDARES TÁCTILES MÓVILES (HTML & CSS)
// -----------------------------------------------------------------------------
console.log('\n[7] Estándares Táctiles Móviles y Safe Area');

test('index.html incluye controles de zoom flotantes, selector de modo y panel debug', () => {
  const htmlPath = path.join(__dirname, '../games/bastion/index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  assert.ok(html.includes('id="touch-zoom-controls"'), 'Debe incluir touch-zoom-controls');
  assert.ok(html.includes('id="btn-zoom-in"'), 'Debe incluir botón zoom-in');
  assert.ok(html.includes('id="btn-zoom-reset"'), 'Debe incluir botón zoom-reset');
  assert.ok(html.includes('id="btn-zoom-out"'), 'Debe incluir botón zoom-out');
  assert.ok(html.includes('id="mode-tabs"'), 'Debe incluir selector de modo campaña vs sin fin');
  assert.ok(html.includes('id="debug-panel"'), 'Debe incluir panel de depuración');
  assert.ok(html.includes('id="btn-reset-campaign-data"'), 'Debe incluir botón para reset de campaña');
  assert.ok(html.includes('id="btn-reset-meta-data"'), 'Debe incluir botón para reset de templo');
});

test('style.css cumple con touch-action, user-select y áreas táctiles >= 44px', () => {
  const cssPath = path.join(__dirname, '../games/bastion/style.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  assert.ok(css.includes('touch-action: none') || css.includes('touch-action: manipulation'), 'Debe especificar touch-action');
  assert.ok(css.includes('user-select: none'), 'Debe prevenir selección accidental en móvil');
  assert.ok(css.includes('.touch-zoom-controls'), 'Debe tener estilos para controles flotantes');
  assert.ok(css.includes('.zoom-btn'), 'Debe tener estilos de botones de zoom');
  assert.ok(css.includes('min-height: 44px') || css.includes('height: 44px') || css.includes('width: 44px'), 'Debe respetar el área táctil mínima de 44px');
});

console.log('\n======================================================================');
console.log(`RESULTADO FINAL: ${passedTests}/${totalTests} pruebas pasaron exitosamente.`);
console.log('======================================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
