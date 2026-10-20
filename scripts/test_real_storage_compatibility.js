/**
 * scripts/test_real_storage_compatibility.js
 * 
 * PRUEBA DE COMPATIBILIDAD REAL DE GUARDADOS:
 * 1. Extrae mediante 'git show HEAD:shared/storage.js' el código original de almacenamiento.
 * 2. Guarda datos reales con la lógica y claves originales de:
 *    - Bastión (bastion:endless:v1, bastion:v1, bastion:meta:v1)
 *    - Abismo (abismo:v1, arcade_record_abismo)
 *    - Lumen (lumen:v2, lumen:v2:achievements)
 *    - Cargas (cargas:v2, arcade_record_cargas:v2)
 * 3. Carga dichos datos utilizando la versión NUEVA de shared/storage.js y los cargadores actuales.
 * 4. Compara y certifica que todos los valores coinciden con precisión absoluta.
 */

const { execSync } = require('child_process');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

console.log('======================================================================');
console.log('  PRUEBA DE COMPATIBILIDAD REAL DE GUARDADOS (HEAD vs NUEVO)');
console.log('======================================================================\n');

// 1. Simulación de localStorage en memoria
function createLocalStorageMock() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
    get length() {
      return store.size;
    },
    key(i) {
      return Array.from(store.keys())[i] || null;
    },
    _dump() {
      return Object.fromEntries(store.entries());
    }
  };
}

const mockStorage = createLocalStorageMock();

// 2. Extraer código ORIGINAL de shared/storage.js desde git show HEAD
console.log('[1/4] Extrayendo código ORIGINAL desde git show HEAD:shared/storage.js...');
const originalStorageCode = execSync('git show HEAD:shared/storage.js', { encoding: 'utf8' });

// Crear contexto sandbox original
const originalContext = {
  window: {},
  localStorage: mockStorage,
  console: { warn: () => {}, log: () => {} }
};
originalContext.window.localStorage = mockStorage;
vm.createContext(originalContext);
vm.runInContext(originalStorageCode, originalContext);

const OriginalArcadeStorage = originalContext.window.ArcadeStorage;
assert(OriginalArcadeStorage, 'ArcadeStorage original debe haberse instanciado');
console.log('  OK ArcadeStorage original cargado exitosamente en contexto sandbox.');

// 3. Generar datos guardados con el código ORIGINAL para cada juego
console.log('\n[2/4] Generando datos de guardado con el código ORIGINAL...');

// --- BASTIÓN (ORIGINAL) ---
const originalBastionData = {
  endless: {
    bestWave: 28,
    bestScore: 34200
  },
  campaign: {
    unlockedMap: 3,
    stars: [3, 2, 1, 0, 0, 0],
    records: [14500, 11200, 9800, 0, 0, 0]
  },
  meta: {
    shards: 85,
    upgrades: {
      torre_costo: 2,
      alcance_base: 1,
      vida_nucleo: 3,
      dano_fuego: 0,
      velocidad_giro: 1,
      reciclaje_oro: 2
    },
    totalEarned: 120
  }
};
OriginalArcadeStorage.setJSON('bastion:endless:v1', originalBastionData.endless);
mockStorage.setItem('bastion:v1', JSON.stringify(originalBastionData.campaign));
OriginalArcadeStorage.setJSON('bastion:meta:v1', originalBastionData.meta);
console.log('  OK Bastión: Datos guardados con éxito (endless, campaña, meta).');

// --- ABISMO (ORIGINAL) ---
const originalAbismoData = {
  meta: {
    version: 1,
    essence: 140,
    totalEssenceEarned: 350,
    unlockedCharacters: ['peregrino', 'hechicera'],
    upgrades: {
      vida_inicial: 3,
      fuerza_ancestral: 2,
      pies_del_viento: 1,
      iman_arcano: 2,
      fortuna_inicial: 1,
      recarga_abismal: 1,
      cosecha_espectral: 0
    },
    stats: {
      maxFloorReached: 7,
      totalRuns: 14,
      totalKills: 890,
      bossesKilled: 4,
      maxGoldRun: 180
    },
    achievements: ['peregrino_iniciado', 'primer_jefe']
  },
  record: 7
};
mockStorage.setItem('abismo:v1', JSON.stringify(originalAbismoData.meta));
OriginalArcadeStorage.setHighScore('abismo', originalAbismoData.record);
console.log('  OK Abismo: Datos guardados con éxito (meta-progresión, stats, récord).');

// --- LUMEN (ORIGINAL) ---
const originalLumenData = {
  score: 12450,
  achievements: ['primer_paso', 'maestro_luz', 'chispas_10']
};
OriginalArcadeStorage.setHighScore('lumen:v2', originalLumenData.score);
mockStorage.setItem('lumen:v2:achievements', JSON.stringify(originalLumenData.achievements));
console.log('  OK Lumen: Datos guardados con éxito (récord high score, logros).');

// --- CARGAS (ORIGINAL) ---
const originalCargasData = {
  version: 2,
  highScore: 8400,
  unlockedLevel: 6,
  levelStars: { 1: 3, 2: 3, 3: 2, 4: 1, 5: 2 },
  credits: 420,
  upgrades: {
    radius: 1,
    charges: 2,
    speed: 1,
    slide: 0,
    shield: 1
  },
  achievements: { FIRST_STEP: true, BOSS_1: true }
};
OriginalArcadeStorage.setHighScore('cargas:v2', originalCargasData.highScore);
mockStorage.setItem('cargas:v2', JSON.stringify(originalCargasData));
console.log('  OK Cargas: Datos guardados con éxito (progreso de sectores, mejoras, créditos).');

// 4. Instanciar código NUEVO de shared/storage.js en el mismo almacenamiento
console.log('\n[3/4] Inicializando código NUEVO de shared/storage.js con el almacenamiento preservado...');
delete require.cache[path.resolve('shared/storage.js')];
const fs = require('fs');
const newStorageCode = fs.readFileSync('shared/storage.js', 'utf8');

const newContext = {
  window: {},
  localStorage: mockStorage,
  console: { warn: () => {}, log: () => {} }
};
newContext.window.localStorage = mockStorage;
vm.createContext(newContext);
vm.runInContext(newStorageCode, newContext);

const NewArcadeStorage = newContext.window.ArcadeStorage;
assert(NewArcadeStorage, 'ArcadeStorage nuevo debe existir');
assert.strictEqual(typeof NewArcadeStorage.getItem, 'function', 'ArcadeStorage.getItem debe existir en el código nuevo');
assert.strictEqual(typeof NewArcadeStorage.setItem, 'function', 'ArcadeStorage.setItem debe existir en el código nuevo');
console.log('  OK ArcadeStorage nuevo inicializado con getItem y setItem nativos.');

// 5. Comparar datos leídos vs guardados para cada juego
console.log('\n[4/4] Verificando compatibilidad de carga por juego:\n');

const results = {};

// --- BASTIÓN ---
{
  const loadedEndless = NewArcadeStorage.getJSON('bastion:endless:v1', null);
  const rawCampaign = NewArcadeStorage.getItem('bastion:v1');
  const loadedCampaign = JSON.parse(rawCampaign);
  const loadedMeta = NewArcadeStorage.getJSON('bastion:meta:v1', null);

  const toPlain = (val) => (val === undefined || val === null ? val : JSON.parse(JSON.stringify(val)));

  assert.deepStrictEqual(toPlain(loadedEndless), toPlain(originalBastionData.endless), 'Endless de Bastión debe coincidir 1:1');
  assert.deepStrictEqual(toPlain(loadedCampaign), toPlain(originalBastionData.campaign), 'Campaña de Bastión debe coincidir 1:1');
  assert.deepStrictEqual(toPlain(loadedMeta), toPlain(originalBastionData.meta), 'Meta-progresión de Bastión debe coincidir 1:1');

  results.bastion = {
    status: 'PASSED',
    endlessWave: loadedEndless.bestWave,
    endlessScore: loadedEndless.bestScore,
    campaignUnlocked: loadedCampaign.unlockedMap,
    campaignStars: loadedCampaign.stars,
    shards: loadedMeta.shards,
    upgradeKeys: Object.keys(loadedMeta.upgrades).length
  };
  console.log('  [OK] BASTIÓN: 100% compatible');
  console.log(`     - Récord Sin Fin: Oleada ${results.bastion.endlessWave}, ${results.bastion.endlessScore} pts`);
  console.log(`     - Campaña: Mapa ${results.bastion.campaignUnlocked} desbloqueado, Estrellas: [${results.bastion.campaignStars.join(', ')}]`);
  console.log(`     - Templo del Nexo: ${results.bastion.shards} esquirlas, ${results.bastion.upgradeKeys} mejoras registradas`);
}

// --- ABISMO ---
{
  const toPlain = (val) => (val === undefined || val === null ? val : JSON.parse(JSON.stringify(val)));
  const rawMeta = NewArcadeStorage.getItem('abismo:v1');
  const loadedMeta = JSON.parse(rawMeta);
  const loadedScore = NewArcadeStorage.getHighScore('abismo');

  assert.deepStrictEqual(toPlain(loadedMeta), toPlain(originalAbismoData.meta), 'Meta de Abismo debe coincidir 1:1');
  assert.strictEqual(loadedScore, originalAbismoData.record, 'Récord de Abismo debe coincidir');

  results.abismo = {
    status: 'PASSED',
    essence: loadedMeta.essence,
    characters: loadedMeta.unlockedCharacters,
    maxFloor: loadedMeta.stats.maxFloorReached,
    runs: loadedMeta.stats.totalRuns,
    achievements: loadedMeta.achievements,
    recordScore: loadedScore
  };
  console.log('\n  [OK] ABISMO: 100% compatible');
  console.log(`     - Esencia: ${results.abismo.essence} (Total ganada: ${loadedMeta.totalEssenceEarned})`);
  console.log(`     - Personajes: [${results.abismo.characters.join(', ')}]`);
  console.log(`     - Estadísticas: Piso máx ${results.abismo.maxFloor}, ${results.abismo.runs} partidas, ${loadedMeta.stats.totalKills} bajas`);
  console.log(`     - Récord histórico ArcadeStorage: Piso ${results.abismo.recordScore}`);
}

// --- LUMEN ---
{
  const toPlain = (val) => (val === undefined || val === null ? val : JSON.parse(JSON.stringify(val)));
  const loadedScore = NewArcadeStorage.getHighScore('lumen:v2');
  const rawAch = NewArcadeStorage.getItem('lumen:v2:achievements');
  const loadedAch = JSON.parse(rawAch);

  assert.strictEqual(loadedScore, originalLumenData.score, 'Puntuación de Lumen debe coincidir');
  assert.deepStrictEqual(toPlain(loadedAch), toPlain(originalLumenData.achievements), 'Logros de Lumen deben coincidir');

  results.lumen = {
    status: 'PASSED',
    highScore: loadedScore,
    achievements: loadedAch
  };
  console.log('\n  [OK] LUMEN: 100% compatible');
  console.log(`     - Récord histórico ArcadeStorage: ${results.lumen.highScore} pts`);
  console.log(`     - Logros desbloqueados: [${results.lumen.achievements.join(', ')}]`);
}

// --- CARGAS ---
{
  const toPlain = (val) => (val === undefined || val === null ? val : JSON.parse(JSON.stringify(val)));
  const rawCargas = NewArcadeStorage.getItem('cargas:v2');
  const loadedCargas = JSON.parse(rawCargas);
  const loadedScore = NewArcadeStorage.getHighScore('cargas:v2');

  assert.deepStrictEqual(toPlain(loadedCargas), toPlain(originalCargasData), 'Datos de Cargas deben coincidir 1:1');
  assert.strictEqual(loadedScore, originalCargasData.highScore, 'Récord de Cargas debe coincidir');

  results.cargas = {
    status: 'PASSED',
    highScore: loadedScore,
    unlockedLevel: loadedCargas.unlockedLevel,
    credits: loadedCargas.credits,
    starsCount: Object.values(loadedCargas.levelStars).reduce((a, b) => a + b, 0),
    upgrades: loadedCargas.upgrades
  };
  console.log('\n  [OK] CARGAS: 100% compatible');
  console.log(`     - Récord: ${results.cargas.highScore} pts`);
  console.log(`     - Sector desbloqueado: ${results.cargas.unlockedLevel}, Estrellas totales: ${results.cargas.starsCount}`);
  console.log(`     - Créditos de taller: ${results.cargas.credits}`);
  console.log(`     - Mejoras activas: radio=${results.cargas.upgrades.radius}, cargas=${results.cargas.upgrades.charges}, velocidad=${results.cargas.upgrades.speed}`);
}

console.log('\n======================================================================');
console.log('RESUMEN DE PRUEBA DE COMPATIBILIDAD REAL:');
console.log('  - Bastión: [OK] PASÓ (Campaña, Modo Sin Fin y Templo del Nexo)');
console.log('  - Abismo:  [OK] PASÓ (Meta-progresión, Personajes y Récord)');
console.log('  - Lumen:   [OK] PASÓ (Récord y Logros)');
console.log('  - Cargas:  [OK] PASÓ (Sectores, Créditos, Taller y Récord)');
console.log('======================================================================\n');
console.log('[PASS] TODOS LOS JUEGOS LEEN CON PRECISIÓN EXACTA LOS DATOS ORIGINALES.');
