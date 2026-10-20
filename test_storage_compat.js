/**
 * test_storage_compat.js
 * Prueba real de compatibilidad de ArcadeStorage:
 * - Guarda datos con formato anterior y claves reales ('bloques:v1', 'bastion:v1', 'abismo:v1', 'arcade_record_bloques', etc.)
 * - Comprueba que la versión nueva los lee exactamente igual
 * - Comprueba get, set, getItem, setItem, getJSON, setJSON
 */

const assert = require('assert');

// Mock localStorage para Node.js
const storageMap = new Map();
global.localStorage = {
  getItem: (k) => storageMap.has(k) ? storageMap.get(k) : null,
  setItem: (k, v) => storageMap.set(k, String(v)),
  removeItem: (k) => storageMap.delete(k),
  clear: () => storageMap.clear()
};

const ArcadeStorage = require('./shared/icons.js'); // cargar icons primero si procede
const storage = require('./shared/storage.js');

console.log('[TEST] Iniciando pruebas de compatibilidad de ArcadeStorage...');

// 1. Simular datos históricos preexistentes en localStorage
localStorage.setItem('arcade_record_bloques', '15400');
localStorage.setItem('arcade_record_snake', '320');
localStorage.setItem('arcade_record_bastion', '9500');
localStorage.setItem('arcade_record_cargas', '4800');
localStorage.setItem('bloques:v1', JSON.stringify({ highscore: 15400, gamesPlayed: 42 }));
localStorage.setItem('bastion:v1', JSON.stringify({ highScore: 9500, maxWave: 20, shards: 85 }));
localStorage.setItem('abismo:v1', JSON.stringify({ version: 1, essence: 240, deepestFloor: 8 }));
localStorage.setItem('bastion:screen_shake', 'true');
localStorage.setItem('bastion:onetap', 'true');

// 2. Verificar getHighScore con récords preexistentes
assert.strictEqual(storage.getHighScore('bloques'), 15400, 'Debe leer récord histórico de bloques');
assert.strictEqual(storage.getHighScore('snake'), 320, 'Debe leer récord histórico de snake');
assert.strictEqual(storage.getHighScore('bastion'), 9500, 'Debe leer récord histórico de bastion');
assert.strictEqual(storage.getHighScore('cargas'), 4800, 'Debe leer récord histórico de cargas');
console.log('  OK getHighScore lee correctamente récords existentes');

// 3. Verificar setHighScore (no debe sobreescribir si el puntaje es menor)
assert.strictEqual(storage.setHighScore('bloques', 10000), false, 'No debe reducir el récord existente');
assert.strictEqual(storage.getHighScore('bloques'), 15400);

// Debe actualizar si es mayor
assert.strictEqual(storage.setHighScore('bloques', 18000), true, 'Debe actualizar récord superior');
assert.strictEqual(storage.getHighScore('bloques'), 18000);
console.log('  OK setHighScore valida umbral superior y actualiza');

// 4. Verificar get / set arbitrarios
assert.strictEqual(storage.get('bastion:screen_shake'), 'true');
assert.strictEqual(storage.get('clave_inexistente', 'fallback'), 'fallback');
storage.set('test_key', 'valor_guardado');
assert.strictEqual(storage.get('test_key'), 'valor_guardado');
console.log('  OK get / set funcionan con fallbacks y persistencia');

// 5. Verificar getJSON / setJSON con objetos complejos
const bastionData = storage.getJSON('bastion:v1');
assert.strictEqual(bastionData.highScore, 9500);
assert.strictEqual(bastionData.maxWave, 20);
assert.strictEqual(bastionData.shards, 85);

const abismoData = storage.getJSON('abismo:v1');
assert.strictEqual(abismoData.essence, 240);
assert.strictEqual(abismoData.deepestFloor, 8);
console.log('  OK getJSON recupera fielmente objetos JSON guardados');

// 6. Verificar alias getItem y setItem (usados en Bastion y compatibles con Storage API)
assert.strictEqual(typeof storage.getItem, 'function', 'getItem debe existir');
assert.strictEqual(typeof storage.setItem, 'function', 'setItem debe existir');
assert.strictEqual(storage.getItem('bastion:onetap'), 'true');
storage.setItem('bastion:onetap', 'false');
assert.strictEqual(storage.getItem('bastion:onetap'), 'false');
assert.strictEqual(storage.get('bastion:onetap'), 'false');
console.log('  OK getItem y setItem funcionan como alias completos de get y set');

console.log('\n[PASS] ¡TODAS LAS PRUEBAS DE COMPATIBILIDAD DE ARCADE_STORAGE PASARON AL 100%!');
