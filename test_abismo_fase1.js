/**
 * PRUEBAS AUTOMATIZADAS - ABISMO (FASE 1)
 * Validación de: Spatial Hash Grid, Auto-Ataque, Jugador, Pooling, y Enemigo Perseguidor
 */

const assert = require('assert');

// Cargar módulos
const SpatialHash = require('./games/abismo/spatial_hash.js');
const CONFIG = require('./games/abismo/config.js');
const { ENEMIGOS } = require('./games/abismo/data/enemigos.js');
const {
  ProjectilePool,
  ParticlePool,
  FloatingTextPool,
  EnemyPool,
  Player,
  Room
} = require('./games/abismo/game.js');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ [PASSED] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ [FAILED] ${name}`);
    console.error(`    ${err.message}\n`);
    throw err;
  }
}

console.log('==========================================================');
console.log('   PRUEBAS AUTOMATIZADAS: ABISMO - FASE 1');
console.log('==========================================================\n');

// ----------------------------------------------------------------------------
// 1. Spatial Hash Grid: Inserción y Consultas de Radio
// ----------------------------------------------------------------------------
runTest('SpatialHash inserta entidades y resuelve queryRange con precisión', () => {
  const sh = new SpatialHash(75);
  const e1 = { x: 100, y: 100, radius: 12, active: true };
  const e2 = { x: 140, y: 100, radius: 12, active: true };
  const e3 = { x: 500, y: 500, radius: 12, active: true }; // Lejos

  sh.insert(e1);
  sh.insert(e2);
  sh.insert(e3);

  const results = [];
  sh.queryRange(100, 100, 50, results);

  assert.strictEqual(results.length, 2, 'Debe encontrar exactamente las entidades e1 y e2 dentro del radio');
  assert.ok(results.includes(e1), 'e1 debe estar en los resultados');
  assert.ok(results.includes(e2), 'e2 debe estar en los resultados');
  assert.ok(!results.includes(e3), 'e3 no debe estar en los resultados por estar fuera de rango');
});

// ----------------------------------------------------------------------------
// 2. Spatial Hash Grid: Auto-Ataque (getNearest)
// ----------------------------------------------------------------------------
runTest('SpatialHash.getNearest selecciona con exactitud el objetivo más cercano', () => {
  const sh = new SpatialHash(75);
  const playerPos = { x: 200, y: 200 };

  const closeEnemy = { x: 250, y: 200, radius: 12, hp: 30, active: true }; // Dist = 50
  const midEnemy = { x: 300, y: 200, radius: 12, hp: 30, active: true };   // Dist = 100
  const farEnemy = { x: 600, y: 200, radius: 12, hp: 30, active: true };   // Dist = 400 (fuera de rango)

  sh.insert(closeEnemy);
  sh.insert(midEnemy);
  sh.insert(farEnemy);

  // Consulta en rango de auto-ataque (260px)
  const nearest = sh.getNearest(playerPos.x, playerPos.y, 260, (e) => e.active && e.hp > 0);

  assert.ok(nearest, 'Debe encontrar un objetivo');
  assert.strictEqual(nearest.entity, closeEnemy, 'Debe priorizar closeEnemy por ser el más cercano');
  assert.strictEqual(Math.round(nearest.dist), 50, 'La distancia calculada debe ser 50');

  // Si closeEnemy muere, debe elegir a midEnemy
  closeEnemy.hp = 0;
  sh.clear();
  sh.insert(closeEnemy);
  sh.insert(midEnemy);
  sh.insert(farEnemy);

  const nextNearest = sh.getNearest(playerPos.x, playerPos.y, 260, (e) => e.active && e.hp > 0);
  assert.strictEqual(nextNearest.entity, midEnemy, 'Al morir el más cercano, debe enfocar automáticamente al siguiente');

  // Consulta fuera de rango (rango 30px)
  const none = sh.getNearest(playerPos.x, playerPos.y, 30, (e) => e.active && e.hp > 0);
  assert.strictEqual(none, null, 'No debe disparar si no hay enemigos dentro del rango');
});

// ----------------------------------------------------------------------------
// 3. Escalabilidad de Rendimiento (150+ enemigos y 300+ proyectiles)
// ----------------------------------------------------------------------------
runTest('SpatialHash soporta 200 enemigos y 350 proyectiles con alta tasa de consultas', () => {
  const sh = new SpatialHash(CONFIG.SPATIAL_CELL_SIZE);
  const enemies = [];

  for (let i = 0; i < 200; i++) {
    const e = {
      x: 50 + (i % 20) * 45,
      y: 50 + Math.floor(i / 20) * 55,
      radius: 12,
      active: true
    };
    enemies.push(e);
    sh.insert(e);
  }

  // Realizar 300 consultas de colisión simulando proyectiles en vuelo
  const start = performance.now();
  const queryOut = [];
  let totalFound = 0;

  for (let i = 0; i < 300; i++) {
    const qx = 100 + (i % 15) * 50;
    const qy = 100 + Math.floor(i / 15) * 25;
    sh.queryRange(qx, qy, 25, queryOut);
    totalFound += queryOut.length;
  }

  const elapsed = performance.now() - start;
  assert.ok(elapsed < 60, `300 consultas espaciales sobre 200 entidades deben tardar < 60ms (duró: ${elapsed.toFixed(2)}ms)`);
  assert.ok(totalFound > 0, 'Debe detectar intersecciones con los enemigos poblados');
});

// ----------------------------------------------------------------------------
// 4. Jugador: Movimiento y Confinamiento dentro de la Sala
// ----------------------------------------------------------------------------
runTest('El explorador se mueve con velocidad fija y se mantiene confinado dentro de la sala', () => {
  const room = new Room(960, 640, 32);
  const player = new Player(room.width / 2, room.height / 2);
  const sh = new SpatialHash(75);
  const pPool = new ProjectilePool(10);
  const parts = new ParticlePool(10);

  // Moverse hacia la derecha durante 1 segundo
  player.update(1.0, 1.0, 0.0, room, sh, pPool, parts, null, null);
  assert.ok(player.x > room.width / 2, 'El jugador debe desplazarse en el eje X');

  // Intentar forzarlo a atravesar la pared izquierda
  player.x = 40;
  player.update(1.0, -1.0, 0.0, room, sh, pPool, parts, null, null);
  const minAllowedX = room.wallThickness + player.radius;
  assert.strictEqual(player.x, minAllowedX, `El jugador no puede atravesar el muro (esperado: ${minAllowedX}, actual: ${player.x})`);

  // Intentar forzarlo a atravesar la pared superior
  player.y = 40;
  player.update(1.0, 0.0, -1.0, room, sh, pPool, parts, null, null);
  const minAllowedY = room.wallThickness + player.radius;
  assert.strictEqual(player.y, minAllowedY, `El jugador no puede atravesar el muro superior (esperado: ${minAllowedY}, actual: ${player.y})`);
});

// ----------------------------------------------------------------------------
// 5. Auto-Ataque: Disparo de Proyectiles hacia el Enemigo Enfocado
// ----------------------------------------------------------------------------
runTest('Auto-Ataque dispara automáticamente proyectiles hacia el enemigo enfocado', () => {
  const room = new Room(960, 640, 32);
  const player = new Player(400, 300);
  const sh = new SpatialHash(75);
  const pPool = new ProjectilePool(20);
  const parts = new ParticlePool(20);

  const targetEnemy = { x: 500, y: 300, radius: 12, hp: 40, active: true };
  sh.insert(targetEnemy);

  assert.strictEqual(pPool.activeCount, 0, 'No debe haber proyectiles activos antes del ataque');

  // Actualizar jugador para activar auto-ataque
  player.attackTimer = 0; // Forzar que esté listo
  player.update(1 / 60, 0, 0, room, sh, pPool, parts, null, null);

  pPool.update(1 / 60, room);
  assert.strictEqual(pPool.activeCount, 1, 'Debe haber disparado 1 proyectil automáticamente');

  const fired = pPool.pool[0];
  assert.strictEqual(fired.active, true, 'El proyectil debe estar activo');
  assert.ok(fired.vx > 0, 'El proyectil debe viajar hacia la derecha en dirección al enemigo');
  assert.ok(Math.abs(fired.vy) < 0.001, 'El proyectil debe alinearse en el eje Y');
});

// ----------------------------------------------------------------------------
// 6. Colisión Proyectil-Enemigo, Daño y Knockback
// ----------------------------------------------------------------------------
runTest('Los proyectiles impactan enemigos, infligen daño y aplican knockback', () => {
  const ePool = new EnemyPool(10);
  const enemy = ePool.spawn(500, 300, ENEMIGOS.perseguidor);
  const initialHp = enemy.hp;

  const isDead = enemy.takeDamage(22, 100, 0);
  assert.strictEqual(isDead, false, 'El enemigo no debe morir de un solo golpe básico');
  assert.strictEqual(enemy.hp, initialHp - 22, 'La vida del enemigo debe reducirse exactamente por el daño recibido');
  assert.ok(enemy.vx > 0, 'El impacto debe empujar al enemigo hacia adelante (knockback)');
  assert.ok(enemy.hitFlashTimer > 0, 'Debe activar el hit flash blanco de impacto');
});

// ----------------------------------------------------------------------------
// 7. Habilidad Especial: "Estallido Espectral"
// ----------------------------------------------------------------------------
runTest('Habilidad especial inflige daño en área, empuja a los enemigos e inicia cooldown', () => {
  const room = new Room(960, 640, 32);
  const player = new Player(300, 300);
  const sh = new SpatialHash(75);
  const ePool = new EnemyPool(10);
  const parts = new ParticlePool(50);
  const texts = new FloatingTextPool(10);

  const eInArea = ePool.spawn(350, 300, ENEMIGOS.perseguidor); // A 50px (dentro del radio de 160px)
  const eOutArea = ePool.spawn(600, 300, ENEMIGOS.perseguidor); // A 300px (fuera de radio)
  sh.insert(eInArea);
  sh.insert(eOutArea);

  const initialHpIn = eInArea.hp;
  const initialHpOut = eOutArea.hp;

  assert.strictEqual(player.specialTimer, 0, 'La habilidad debe estar lista inicialmente');

  const activated = player.useSpecialAbility(sh, ePool, parts, texts, null, null);
  assert.strictEqual(activated, true, 'La habilidad debe activarse exitosamente');
  assert.strictEqual(player.specialTimer, player.specialCooldown, 'Debe entrar en cooldown');

  // Verificar daño selectivo por área
  assert.ok(eInArea.hp < initialHpIn, 'El enemigo dentro del radio debe recibir daño masivo');
  assert.strictEqual(eOutArea.hp, initialHpOut, 'El enemigo fuera del radio no debe recibir daño');
  assert.ok(eInArea.vx > 0, 'El enemigo alcanzado debe recibir un gran impulso cinético');

  // No debe activarse de nuevo durante el cooldown
  const secondAttempt = player.useSpecialAbility(sh, ePool, parts, texts, null, null);
  assert.strictEqual(secondAttempt, false, 'No puede volver a usarse mientras esté en recarga');
});

// ----------------------------------------------------------------------------
// 8. Separación de Enemigos (Anti-Stacking con Spatial Hash)
// ----------------------------------------------------------------------------
runTest('Los enemigos perseguidores aplican separación para no sobreponerse en un solo punto', () => {
  const room = new Room(960, 640, 32);
  const player = new Player(500, 300);
  const sh = new SpatialHash(75);
  const ePool = new EnemyPool(10);

  // Dos enemigos generados muy cerca uno del otro
  const e1 = ePool.spawn(200, 200, ENEMIGOS.perseguidor);
  const e2 = ePool.spawn(202, 200, ENEMIGOS.perseguidor);

  sh.insert(e1);
  sh.insert(e2);

  const initialDist = Math.hypot(e1.x - e2.x, e1.y - e2.y);
  assert.ok(initialDist < e1.radius + e2.radius, 'Los enemigos inician superpuestos');

  // Actualizar simulación
  ePool.update(1 / 60, player, sh, room, () => {});

  const distAfter = Math.hypot(e1.x - e2.x, e1.y - e2.y);
  assert.ok(distAfter > initialDist, 'La fuerza de separación espacial debe repeler a los enemigos superpuestos');
});

console.log('\n==========================================================');
console.log(`RESULTADO: ${passedTests} / ${totalTests} PRUEBAS SUPERADAS (${Math.round(passedTests/totalTests*100)}%)`);
console.log('==========================================================\n');
