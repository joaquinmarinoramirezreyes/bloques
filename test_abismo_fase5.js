/**
 * PRUEBAS AUTOMATIZADAS - ABISMO - FASE 5
 * Meta-progresión permanente, guardado versionado (abismo:v1), migración,
 * partida en curso (autosave), logros y panel de depuración.
 */

const assert = require('assert');

// Mock simple de localStorage para entorno headless Node.js
const mockLocalStorage = {
  store: {},
  getItem(key) {
    return this.store[key] !== undefined ? this.store[key] : null;
  },
  setItem(key, val) {
    this.store[key] = String(val);
  },
  removeItem(key) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  }
};
global.localStorage = mockLocalStorage;

// Cargar módulos de Abismo
const {
  META_UPGRADES,
  LOGROS,
  getDefaultMetaState,
  validateMetaState,
  migrateMetaState,
  AbismoStorage
} = require('./games/abismo/data/meta.js');

const CFG = require('./games/abismo/config.js');
const PERSONAJES = require('./games/abismo/data/personajes.js');
const { Player, AbismoAudioHelper } = require('./games/abismo/game.js');

console.log('==========================================================');
console.log('   PRUEBAS AUTOMATIZADAS: ABISMO - FASE 5');
console.log('   Meta-Progresión, Guardado Versionado, Logros y Pulido');
console.log('==========================================================\n');

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  OK [PASSED] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  X [FAILED] ${name}`);
    console.error(`    ${err.message}\n`);
  }
}

// 1. Estado por defecto y validación de esquema
test('1. Estado por defecto tiene estructura versionada válida', () => {
  mockLocalStorage.clear();
  const def = getDefaultMetaState();
  assert.strictEqual(def.version, 1, 'La versión debe ser 1');
  assert.strictEqual(def.essence, 0, 'La esencia inicial debe ser 0');
  assert(Array.isArray(def.unlockedCharacters), 'unlockedCharacters debe ser un arreglo');
  assert(def.unlockedCharacters.includes('peregrino'), 'Peregrino debe estar desbloqueado por defecto');
  assert.strictEqual(typeof def.upgrades, 'object', 'upgrades debe ser un objeto');
  assert.strictEqual(typeof def.stats, 'object', 'stats debe ser un objeto');
  assert(validateMetaState(def), 'validateMetaState debe retornar true');
});

// 2. Resiliencia ante corrupción de datos
test('2. Resiliencia ante datos corruptos o JSON inválido en localStorage', () => {
  mockLocalStorage.clear();
  mockLocalStorage.setItem('abismo:v1', '{corrupt-json::!!');
  const loaded = AbismoStorage.loadMeta();
  assert.strictEqual(loaded.version, 1, 'Debe recuperarse con versión 1');
  assert.strictEqual(loaded.essence, 0, 'Debe devolver estado limpio ante JSON inválido');

  mockLocalStorage.setItem('abismo:v1', JSON.stringify({ essence: 'invalido', upgrades: null }));
  const recovered = AbismoStorage.loadMeta();
  assert(recovered && typeof recovered.essence === 'number', 'Debe recuperarse ante campos corruptos');
});

// 3. Migración automática de versión previa o no versionada
test('3. Migración automática desde guardado antiguo (v0 / legacy) a v1', () => {
  mockLocalStorage.clear();
  const legacyData = {
    essence: 75,
    unlockedCharacters: ['peregrino', 'hechicera'],
    stats: { maxFloorReached: 4, totalRuns: 3, totalKills: 42 }
  };
  mockLocalStorage.setItem('abismo_save', JSON.stringify(legacyData));

  const migrated = AbismoStorage.loadMeta();
  assert.strictEqual(migrated.version, 1, 'Debe migrar a versión 1');
  assert.strictEqual(migrated.essence, 75, 'Debe preservar la esencia previa');
  assert(migrated.unlockedCharacters.includes('hechicera'), 'Debe preservar personajes desbloqueados');
  assert.strictEqual(migrated.stats.maxFloorReached, 4, 'Debe preservar el piso máximo alcanzado');
  assert.strictEqual(migrated.stats.totalKills, 42, 'Debe preservar las bajas acumuladas');
  assert.strictEqual(mockLocalStorage.getItem('abismo_save'), null, 'Debe limpiar la clave antigua tras migrar');
});

// 4. Compra de mejoras permanentes y escalado de costo
test('4. Compra de mejoras permanentes en el Altar y validación de fondos', () => {
  const meta = getDefaultMetaState();
  meta.essence = 50;

  const vidaDef = META_UPGRADES.find((u) => u.id === 'vida_inicial');
  const cost0 = AbismoStorage.getUpgradeCost(vidaDef, 0);
  assert.strictEqual(cost0, 20, 'El costo base de vida inicial debe ser 20');

  const buyRes = AbismoStorage.buyUpgrade(meta, 'vida_inicial');
  assert.strictEqual(buyRes.success, true, 'La compra debe ser exitosa');
  assert.strictEqual(meta.upgrades.vida_inicial, 1, 'El rango debe subir a 1');
  assert.strictEqual(meta.essence, 30, 'La esencia restante debe ser 30');

  // Intentar comprar sin suficiente esencia
  meta.essence = 10;
  const failRes = AbismoStorage.buyUpgrade(meta, 'vida_inicial');
  assert.strictEqual(failRes.success, false, 'Debe fallar por esencia insuficiente');
});

// 5. Desbloqueo permanente de personajes con esencia
test('5. Desbloqueo permanente de personajes con esencia', () => {
  const meta = getDefaultMetaState();
  meta.essence = 150;

  const res = AbismoStorage.unlockCharacter(meta, 'hechicera', 120);
  assert.strictEqual(res.success, true, 'El desbloqueo debe ser exitoso');
  assert(meta.unlockedCharacters.includes('hechicera'), 'Hechicera debe figurar en personajes desbloqueados');
  assert.strictEqual(meta.essence, 30, 'La esencia debe reducirse correctamente');

  // No permitir desbloquear dos veces
  const dupRes = AbismoStorage.unlockCharacter(meta, 'hechicera', 120);
  assert.strictEqual(dupRes.success, false, 'No debe permitir desbloqueo repetido');
});

// 6. Aplicación de bonificaciones de meta-progresión al Explorador
test('6. Aplicación de mejoras permanentes al explorador al iniciar partida', () => {
  const player = new Player(480, 320);
  const char = PERSONAJES[0];
  player.applyCharacter(char);

  const meta = getDefaultMetaState();
  meta.upgrades.vida_inicial = 2; // +30 HP
  meta.upgrades.fuerza_ancestral = 2; // +16% dmg
  meta.upgrades.pies_del_viento = 1; // +10 vel
  meta.upgrades.fortuna_inicial = 3; // +60 oro

  AbismoStorage.applyMetaBonusesToPlayer(player, meta);

  assert.strictEqual(player.maxHp, 130, 'La vida máxima debe ser 130 (100 + 30)');
  assert.strictEqual(player.hp, 130, 'La vida actual debe coincidir con la máxima');
  assert.strictEqual(player.speed, 195, 'La velocidad debe ser 195 (185 + 10)');
  assert.strictEqual(player.gold, 60, 'El oro inicial debe ser 60');
  assert.strictEqual(Number(player.damageMult.toFixed(2)), 1.16, 'El multiplicador de daño debe ser 1.16');
});

// 7. Guardado y recuperación de partida en curso (Autosave)
test('7. Guardado y recuperación íntegra de partida en curso (Autosave)', () => {
  mockLocalStorage.clear();

  const fakeGame = {
    state: 'PLAYING',
    floor: 3,
    selectedCharacter: 'hechicera',
    killCount: 28,
    score: 180,
    gameTime: 125,
    player: {
      hp: 65,
      maxHp: 80,
      currentXp: 40,
      level: 4,
      xpToNextLevel: 140,
      gold: 55,
      damageMult: 1.25,
      attackRateMult: 1.2,
      bulletSpeedMult: 1.0,
      projectileCount: 0,
      pierce: 1,
      bounce: 0,
      areaMult: 1.1,
      speed: 195,
      pickupRadius: 90,
      specialCooldown: 8.5,
      critChance: 0.1,
      critMult: 1.5,
      vampirismChance: 0,
      vampirismAmount: 0,
      shieldCooldown: 0,
      appliedUpgrades: { dardo_penetrante: 1 },
      activeSynergies: new Set()
    },
    currentRoom: { gx: 2, gy: 3 }
  };

  const saved = AbismoStorage.saveActiveRun(fakeGame);
  assert.strictEqual(saved, true, 'El guardado en curso debe retornar true');

  const loaded = AbismoStorage.loadActiveRun();
  assert(loaded !== null, 'loadActiveRun debe retornar los datos guardados');
  assert.strictEqual(loaded.floor, 3, 'El piso debe ser 3');
  assert.strictEqual(loaded.selectedCharacter, 'hechicera', 'El personaje debe ser hechicera');
  assert.strictEqual(loaded.player.hp, 65, 'El HP guardado debe ser 65');
  assert.strictEqual(loaded.player.gold, 55, 'El oro guardado debe ser 55');
  assert.strictEqual(loaded.currentRoomCoords.gx, 2, 'Coordenada gx debe coincidir');

  AbismoStorage.clearActiveRun();
  assert.strictEqual(AbismoStorage.loadActiveRun(), null, 'clearActiveRun debe eliminar la partida guardada');
});

// 8. Cosecha de Esencia y Evaluación de Logros
test('8. Registro de fin de descenso, cálculo de esencia y desbloqueo de logros', () => {
  mockLocalStorage.clear();
  const meta = getDefaultMetaState();

  // Partida alcanzando piso 5 con 55 bajas y 1 jefe
  const runEnd = AbismoStorage.recordRunEnd(meta, 5, 55, 120, 1);
  assert(runEnd.essenceEarned >= 100, `La esencia ganada debe ser >= 100 (obtenida: ${runEnd.essenceEarned})`);
  assert.strictEqual(meta.stats.totalRuns, 1, 'Total de partidas debe ser 1');
  assert.strictEqual(meta.stats.totalKills, 55, 'Total de bajas debe ser 55');
  assert.strictEqual(meta.stats.bossesKilled, 1, 'Jefes derrotados debe ser 1');
  assert.strictEqual(meta.stats.maxFloorReached, 5, 'Piso máximo debe ser 5');

  // Evaluar logros desbloqueados
  assert(meta.achievements.includes('primer_descenso'), 'Debe desbloquear logro: primer_descenso');
  assert(meta.achievements.includes('cazador_sombras'), 'Debe desbloquear logro: cazador_sombras');
  assert(meta.achievements.includes('terror_cripta'), 'Debe desbloquear logro: terror_cripta');
  assert(meta.achievements.includes('acumulador_esencia'), 'Debe desbloquear logro: acumulador_esencia');
});

// 9. Modo Dios (God Mode) y acciones de depuración
test('9. Modo Dios (God Mode) anula daño hostil en el explorador', () => {
  const player = new Player(480, 320);
  player.applyCharacter(PERSONAJES[0]);
  assert.strictEqual(player.hp, 100);

  // Daño normal
  const hurt = player.takeDamage(25);
  assert.strictEqual(hurt, true);
  assert.strictEqual(player.hp, 75);

  // Activar Modo Dios
  player.iFrameTimer = 0;
  player.godMode = true;
  const blockedHurt = player.takeDamage(50);
  assert.strictEqual(blockedHurt, false, 'Modo dios debe retornar false e impedir daño');
  assert.strictEqual(player.hp, 75, 'El HP debe mantenerse intacto con Modo Dios');
});

// 10. Resiliencia de audio helper sin navegador
test('10. Audio Helper y síntesis no rompen en entorno sin Web Audio', () => {
  const helper = new AbismoAudioHelper(null);
  assert.doesNotThrow(() => {
    helper.startAmbientMusic();
    helper.stopAmbientMusic();
    helper.playChestChime();
    helper.playBossRoar();
  }, 'Audio helper debe ser completamente seguro y tolerante ante ausencia de contexto');
});

console.log('\n==========================================================');
console.log(`   RESUMEN FASE 5: ${passed} de ${total} pruebas superadas.`);
console.log('==========================================================\n');

if (passed !== total) {
  process.exit(1);
}
