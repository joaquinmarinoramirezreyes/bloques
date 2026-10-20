/**
 * scripts/test_bastion_phase1.js - Test suite en Node para Bastión Fase 1
 * Valida de forma automatizada y sin interfaz gráfica:
 * 1. Carga de mapa y coherencia geométrica de waypoints.
 * 2. Reglas de colocación de torres y deducción de oro.
 * 3. Seguimiento exacto de camino por los enemigos.
 * 4. Detección en radio, apuntado, disparo balístico y daño a enemigos.
 * 5. Muerte de enemigos y otorgamiento de recompensa en oro.
 * 6. Daño al núcleo y condición de derrota (Game Over).
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
console.log('  TEST SUITE: BASTIÓN FASE 1 (MOTOR BASE)');
console.log('='.repeat(70));

// 1. Validar datos base
console.log('\n[1] Verificación de Datos Base');
assert(MAPAS.length >= 1, 'Existe al menos 1 mapa definido');
const map1 = MAPAS[0];
assert(map1.cols >= 16 && map1.rows >= 11, 'Dimensiones del mapa 1 son válidas (expandido 20x13)');
assert(map1.waypoints.length >= 2, 'El mapa 1 posee una ruta de waypoints precalculada');
assert(ENEMIGOS.reptante && ENEMIGOS.reptante.hp === 90, 'Enemigo Reptante de Ceniza correctamente definido');
assert(TORRES.balistico && TORRES.balistico.cost === 100, 'Torre Centinela Balístico correctamente definida');

// 2. Instanciación y estado inicial
console.log('\n[2] Instanciación y Estado Inicial');
const game = new BastionGame(null, { initialGold: 250, initialLives: 20 });
assert(game.gold === 250, 'Oro inicial es 250');
assert(game.lives === 20, 'Vidas iniciales son 20');
assert(game.towers.length === 0, 'No hay torres al iniciar');
assert(game.enemies.length === 0, 'No hay enemigos al iniciar');

// 3. Reglas de colocación y economía
console.log('\n[3] Reglas de Colocación y Economía');
// Celda fuera de rango
assert(!game.canBuildAt(-1, 0), 'No se puede construir fuera de cuadrícula (-1, 0)');
assert(!game.canBuildAt(game.cols, game.rows), 'No se puede construir fuera de cuadrícula');
// Celda camino (1)
assert(!game.canBuildAt(1, 1), 'No se puede construir sobre un camino de enemigos (1, 1)');
// Celda obstáculo (2)
assert(!game.canBuildAt(0, 0), 'No se puede construir sobre un peñasco/obstáculo (0, 0)');
// Celda construible válida (4, 1 es tipo 0)
assert(game.canBuildAt(4, 1), 'La celda (4, 1) es terreno construible válido');

// Colocar torre
const placeRes = game.placeTower('balistico', 4, 1);
assert(placeRes.success === true, 'Torre Centinela Balístico colocada con éxito en (4, 1)');
assert(game.gold === 150, 'Oro se dedujo correctamente de 250 a 150');
assert(game.towers.length === 1, 'La lista de torres activas contiene 1 torre');
assert(!game.canBuildAt(4, 1), 'La celda (4, 1) ahora está ocupada y no permite construir otra');

// Colocar segunda torre
const placeRes2 = game.placeTower('balistico', 5, 1);
assert(placeRes2.success === true, 'Segunda torre colocada con éxito en (5, 1)');
assert(game.gold === 50, 'Oro se dedujo correctamente de 150 a 50');

// Intentar colocar tercera torre sin fondos (cuesta 100, tenemos 50)
const placeRes3 = game.placeTower('balistico', 6, 1);
assert(placeRes3.success === false && placeRes3.reason === 'oro_insuficiente', 'Rechaza colocación por falta de oro');

// Venta de torre
const sellRes = game.sellTower(5, 1);
assert(sellRes.success === true, 'Torre vendida con éxito');
assert(sellRes.refund === 70, 'Reembolso del 70% (70 de 100 oro invertido)');
assert(game.gold === 120, 'Oro actualizado tras venta a 120');
assert(game.canBuildAt(5, 1), 'La casilla vendida vuelve a ser construible');

// 4. Seguimiento de ruta y waypoints por enemigos
console.log('\n[4] Seguimiento de Ruta por Enemigos');
const e1 = game.spawnEnemy('reptante');
assert(e1 !== null, 'Enemigo spawneado con éxito');
const initialX = e1.x;
const initialY = e1.y;
assert(e1.waypointIndex === 1, 'Enemigo se dirige al waypoint 1');

// Avanzar simulación 1.0 segundo
game.update(1.0);
assert(e1.x > initialX || e1.y > initialY || e1.distanceTraveled > 0, 'Enemigo se ha desplazado a lo largo del sendero');
assert(e1.distanceTraveled > 0, 'distanceTraveled se incrementa monótonamente');

// 5. Apuntado, disparo, proyectiles y daño
console.log('\n[5] Apuntado, Disparo y Daño');
// Ubicamos una torre adyacente al camino donde está el enemigo
const towerGame = new BastionGame(null, { initialGold: 500, initialLives: 20 });
const testTowerRes = towerGame.placeTower('balistico', 4, 1);
const t1 = testTowerRes.tower;

// Spawneamos enemigo a 2 celdas de distancia (en rango de 3.2 celdas)
const eTarget = towerGame.spawnEnemy('reptante');
eTarget.x = (2 + 0.5) * towerGame.cellSize;
eTarget.y = (1 + 0.5) * towerGame.cellSize;

// Comprobar adquisición de objetivo
const acquired = towerGame.acquireTarget(t1);
assert(acquired !== null && acquired.id === eTarget.id, 'Torre adquiere enemigo en rango como objetivo');

// Disparo: updateTowers genera proyectil en vuelo
towerGame.updateTowers(0.05);
assert(towerGame.projectiles.length > 0, 'Torre dispara proyectil hacia el objetivo');
const proj = towerGame.projectiles[0];
assert(proj.damage === 25, 'Proyectil transporta 25 de daño');

// Simular vuelo del proyectil hasta impactar
let hits = 0;
const initialHp = eTarget.hp;
for (let step = 0; step < 20; step++) {
  towerGame.updateProjectiles(0.05);
  if (eTarget.hp < initialHp) {
    hits++;
    break;
  }
}
assert(hits > 0, 'El proyectil colisiona e inflige daño al enemigo');
assert(eTarget.hp === initialHp - 25, `Salud del enemigo reducida de ${initialHp} a ${eTarget.hp}`);

// 6. Muerte de enemigo y recompensa de oro
console.log('\n[6] Muerte de Enemigo y Recompensa');
const currentGold = towerGame.gold;
// Dañar al enemigo hasta su muerte
while (eTarget.hp > 0) {
  eTarget.hp -= 25;
}
towerGame.onProjectileHit({ damage: 25, x: eTarget.x, y: eTarget.y, color: '#38bdf8' }, eTarget);
assert(!eTarget.alive, 'Enemigo marcado como muerto tras recibir daño letal');
assert(towerGame.gold === currentGold + eTarget.reward, `Recompensa de ${eTarget.reward} oro sumada al balance del jugador`);

// 7. Llegada al núcleo y Game Over
console.log('\n[7] Llegada al Núcleo y Game Over');
const coreGame = new BastionGame(null, { initialGold: 100, initialLives: 2 });
const eThreat = coreGame.spawnEnemy('reptante');
// Forzar enemigo a la última posición
const lastWp = coreGame.mapData.waypoints[coreGame.mapData.waypoints.length - 1];
eThreat.x = (lastWp.c + 0.5) * coreGame.cellSize;
eThreat.y = (lastWp.r + 0.5) * coreGame.cellSize;
eThreat.waypointIndex = coreGame.mapData.waypoints.length - 1;

coreGame.onEnemyReachedCore(eThreat);
assert(coreGame.lives === 1, 'Vidas del núcleo decrecieron en 1');
assert(!coreGame.gameOver, 'La partida no ha terminado todavía con 1 vida restante');

// Segundo enemigo llega y agota las vidas
coreGame.onEnemyReachedCore(eThreat);
assert(coreGame.lives === 0, 'Vidas del núcleo llegaron a 0');
assert(coreGame.gameOver === true, 'Se activa estado de GameOver cuando las vidas llegan a 0');

console.log('\n' + '='.repeat(70));
console.log(`RESULTADO FINAL: ${passedTests}/${totalTests} pruebas pasaron exitosamente.`);
console.log('='.repeat(70));
if (process.exitCode) {
  process.exit(1);
} else {
  process.exit(0);
}
