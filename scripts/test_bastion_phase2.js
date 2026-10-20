/**
 * scripts/test_bastion_phase2.js - Test suite en Node para Bastión Fase 2
 * Valida de forma automatizada:
 * 1. Los 6 mapas definidos como datos con coherencia de caminos y cuadrícula.
 * 2. Las 6 torres con sus 3 niveles y 2 ramas de especialización.
 * 3. Los 6 tipos de enemigos y el Jefe Colosal (con mecánicas de blindaje, vuelo, regeneración y división).
 * 4. Auras pasivas del Obelisco de Resonancia.
 * 5. Sistema de 20 oleadas con Jefe en oleada 10.
 */

const { BastionGame } = require('../games/bastion/game');
const { MAPAS } = require('../games/bastion/data/mapas');
const { ENEMIGOS } = require('../games/bastion/data/enemigos');
const { TORRES } = require('../games/bastion/data/torres');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`[FAIL] FALLÓ: ${message}`);
    process.exitCode = 1;
  } else {
    passedTests++;
    console.log(`[OK] PASÓ: ${message}`);
  }
}

console.log('='.repeat(70));
console.log('  TEST SUITE: BASTIÓN FASE 2 (CAMPUS, TORRES, ENEMIGOS Y RAMAS)');
console.log('='.repeat(70));

// [1] VERIFICACIÓN DE LOS 6 MAPAS
console.log('\n[1] Verificación de los 6 Mapas');
assert(MAPAS.length === 6, 'Existen exactamente 6 mapas definidos');
MAPAS.forEach((m, idx) => {
  assert(m.cols >= 16 && m.rows >= 11, `Mapa ${idx + 1} (${m.name}) tiene dimensiones válidas (expandido a 20x13)`);
  assert(m.waypoints && m.waypoints.length >= 2, `Mapa ${idx + 1} posee waypoints discretos`);
  assert(m.theme && m.theme.bg && m.theme.path, `Mapa ${idx + 1} posee identidad visual y paleta`);
});

// Comprobar mapas con rutas bifurcadas (Mapa 2, 4, 6)
assert(MAPAS[1].paths && MAPAS[1].paths.length === 2, 'Mapa 2 (Desfiladero de Obsidiana) posee 2 rutas de entrada');
assert(MAPAS[3].paths && MAPAS[3].paths.length === 2, 'Mapa 4 (Cripta de Cristal) posee 2 alas simétricas');
assert(MAPAS[5].paths && MAPAS[5].paths.length === 3, 'Mapa 6 (Núcleo del Cataclismo) posee 3 portales convergentes');

// [2] VERIFICACIÓN DE LAS 6 TORRES, MEJORAS Y RAMAS
console.log('\n[2] Verificación de las 6 Torres, Niveles y Ramas');
const requiredTowers = ['balistico', 'mortero', 'rayo', 'crio', 'obelisco', 'francotirador'];
requiredTowers.forEach(tKey => {
  const tDef = TORRES[tKey];
  assert(tDef !== undefined, `Torre '${tKey}' está definida`);
  assert(tDef.levels && tDef.levels.length === 3, `Torre '${tKey}' tiene 3 niveles base`);
  assert(tDef.branches && tDef.branches.a && tDef.branches.b, `Torre '${tKey}' tiene ramas 'a' y 'b' en nivel 4`);
});

// Prueba de colocación, mejora de niveles 1 a 3 y especialización a nivel 4
const game = new BastionGame(null, { initialGold: 2000, initialLives: 20 });
const buildRes = game.placeTower('balistico', 4, 1);
assert(buildRes.success, 'Torre Centinela colocada en (4, 1)');
const t = buildRes.tower;
assert(t.level === 1, 'Inicia en Nivel 1');

// Nivel 2
const up2 = game.upgradeTower(4, 1);
assert(up2.success && t.level === 2 && t.damage === 45, 'Mejorada a Nivel 2 (45 de daño)');

// Nivel 3
const up3 = game.upgradeTower(4, 1);
assert(up3.success && t.level === 3 && t.damage === 75, 'Mejorada a Nivel 3 (75 de daño)');

// Intento de mejora normal bloqueado (debe elegir rama)
const up4Fail = game.upgradeTower(4, 1);
assert(!up4Fail.success && up4Fail.reason === 'requiere_rama_especializacion', 'Bloquea mejora estándar en nivel 3 para forzar rama');

// Especialización Rama A (Gatling)
const specA = game.specializeTower(4, 1, 'a');
assert(specA.success && t.level === 4 && t.branch === 'a', 'Especializada en Rama A (Ametralladora Gatling)');
assert(t.fireRate === 4.2, 'Cadencia de fuego aumentada a 4.2 disparos/s');

// [3] VERIFICACIÓN DE LOS 6 ENEMIGOS Y JEFE COLOSAL
console.log('\n[3] Verificación de los 6 Enemigos y Habilidades');
const requiredEnemies = ['reptante', 'veloz', 'blindado', 'etero', 'regenerador', 'divisor', 'jefe_coloso'];
requiredEnemies.forEach(eKey => {
  const eDef = ENEMIGOS[eKey];
  assert(eDef !== undefined, `Enemigo '${eKey}' está definido con atributos`);
});

// 3.1 Blindado: mitigación del 50% de daño físico
const blindGame = new BastionGame(null, { initialGold: 500 });
const eArmored = blindGame.spawnEnemy('blindado');
const initialArmoredHp = eArmored.hp;
blindGame.applyDamageToEnemy(eArmored, 50, false, 'physical');
const expectedHp = initialArmoredHp - (50 * (1 - eArmored.armor)); // 50 * 0.5 = 25
assert(eArmored.hp === expectedHp, `Enemigo blindado mitiga 50% de daño físico (HP: ${initialArmoredHp} -> ${eArmored.hp})`);

// 3.2 Volador: ignora camino y vuela en línea recta al núcleo
const flyGame = new BastionGame(null, { initialGold: 500 });
const eFly = flyGame.spawnEnemy('etero');
const flyStartX = eFly.x;
const flyStartY = eFly.y;
flyGame.update(1.5);
assert(eFly.flying === true, 'El espectro etéreo tiene atributo flying: true');
assert(eFly.distanceTraveled > 0 && (eFly.x !== flyStartX || eFly.y !== flyStartY), 'El volador avanza directamente hacia el núcleo');

// 3.3 Regenerador: recupera vida con el tiempo
const regenGame = new BastionGame(null, { initialGold: 500 });
const eRegen = regenGame.spawnEnemy('regenerador');
eRegen.hp = 100; // Dañado
regenGame.update(1.0);
assert(eRegen.hp > 100, `Criatura regeneradora recupera salud con el tiempo (HP: 100 -> ${eRegen.hp})`);

// 3.4 Divisor: genera 2 crías al morir
const splitGame = new BastionGame(null, { initialGold: 500 });
const eSplit = splitGame.spawnEnemy('divisor');
assert(splitGame.enemies.length === 1, 'Inicia con 1 divisor activo');
splitGame.applyDamageToEnemy(eSplit, 999, true, 'energy');
// El divisor original muere y genera 2 crías
splitGame.update(0.01);
assert(splitGame.enemies.length === 2, 'Al morir, el divisor genera exactamente 2 crías mitóticas');
assert(splitGame.enemies[0].typeId === 'divisor_cria', 'Las criaturas generadas son crías mitóticas');

// 3.5 Jefe Colosal: auras de curación y aturdimiento
const bossGame = new BastionGame(null, { initialGold: 1000 });
const boss = bossGame.spawnEnemy('jefe_coloso');
assert(boss.isBoss === true && boss.hp >= 1500, 'Jefe Colosal correctamente inicializado');

// Ubicar torre cerca del jefe
const tCloseRes = bossGame.placeTower('balistico', 4, 1);
const tClose = tCloseRes.tower;
boss.x = tClose.x + 20;
boss.y = tClose.y + 20;

// Disparar onda de aturdimiento del jefe
bossGame.triggerBossStunAura(boss);
assert(tClose.stunnedTimer > 0, 'La onda sísmica del Jefe aturde a las torres circundantes');

// [4] VERIFICACIÓN DEL OBELISCO DE APOYO
console.log('\n[4] Verificación de Auras del Obelisco de Resonancia');
const obGame = new BastionGame(null, { initialGold: 1000 });
const tTargetRes = obGame.placeTower('balistico', 4, 1);
const targetTower = tTargetRes.tower;
const baseDmg = targetTower.damage;

// Colocar obelisco en casilla contigua (5, 1)
const obRes = obGame.placeTower('obelisco', 5, 1);
assert(obRes.success, 'Obelisco colocado en (5, 1)');
assert(targetTower.effDmgMult > 1.0, `La torre vecina recibe bono de daño del obelisco (multiplicador: ${targetTower.effDmgMult})`);

// [5] OLEADAS Y PROGRESIÓN (HASTA 20 OLEADAS)
console.log('\n[5] Progresión de 20 Oleadas');
const waveGame = new BastionGame(null, { initialGold: 500 });
assert(waveGame.currentWave === 0, 'Inicia en oleada 0');
waveGame.startNextWave();
assert(waveGame.currentWave === 1, 'Avanza a oleada 1');
assert(waveGame.waveActive === true, 'Oleada 1 activa');
assert(waveGame.waveSpawnQueue.length > 0, 'Cola de generación poblada con criaturas');

// Simular avance hasta oleada 10 (Jefe)
waveGame.currentWave = 9;
waveGame.waveActive = false;
waveGame.startNextWave(); // Inicia oleada 10
assert(waveGame.currentWave === 10, 'Avanza a oleada 10 (Jefe)');
const hasBossInWave = waveGame.waveSpawnQueue.some(item => item.typeId === 'jefe_coloso');
assert(hasBossInWave === true, 'La oleada 10 incluye al Jefe Coloso');

console.log('\n' + '='.repeat(70));
console.log(`RESULTADO FINAL: ${passedTests}/${totalTests} pruebas pasaron exitosamente.`);
console.log('='.repeat(70));
if (process.exitCode) {
  process.exit(1);
} else {
  process.exit(0);
}
