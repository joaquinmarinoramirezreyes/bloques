/**
 * PRUEBAS AUTOMATIZADAS - ABISMO (FASE 2)
 * Validación exhaustiva de:
 * 1. Generación Procedural de Mazmorra Conexa (Conectividad BFS y Reciprocidad de Puertas)
 * 2. Mecánica de Puertas (Bloqueo en combate y apertura al despejar)
 * 3. 6 Arquetipos de Enemigos con IA Única (perseguidor, corredor, tirador, invocador, explosivo, escudado)
 * 4. Modificadores de Élites
 * 5. Corrección de Bug de Habilidad Especial (Muerte inmediata sin "zombies")
 */

const assert = require('assert');

// Cargar módulos
const SpatialHash = require('./games/abismo/spatial_hash.js');
const CONFIG = require('./games/abismo/config.js');
const { ENEMIGOS, MODIFICADORES_ELITE } = require('./games/abismo/data/enemigos.js');
const { DungeonGenerator, TIPOS_SALA } = require('./games/abismo/data/salas.js');
const {
  ProjectilePool,
  EnemyProjectilePool,
  ParticlePool,
  FloatingTextPool,
  EnemyPool,
  Enemy,
  Player,
  Room
} = require('./games/abismo/game.js');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  OK [PASSED] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  X [FAILED] ${name}`);
    console.error(`    ${err.message}\n`);
    throw err;
  }
}

console.log('==========================================================');
console.log('   PRUEBAS AUTOMATIZADAS: ABISMO - FASE 2');
console.log('==========================================================\n');

// ----------------------------------------------------------------------------
// 1. Mazmorra Procedural: Conectividad BFS y Sin Salas Huérfanas (50 Semillas)
// ----------------------------------------------------------------------------
runTest('DungeonGenerator garantiza un grafo 100% conexo en 50 mazmorras aleatorias', () => {
  const directions = [
    { dx: 0, dy: -1, door: 'N' },
    { dx: 0, dy: 1, door: 'S' },
    { dx: 1, dy: 0, door: 'E' },
    { dx: -1, dy: 0, door: 'W' }
  ];

  for (let seed = 0; seed < 50; seed++) {
    const dungeon = DungeonGenerator.generate(CONFIG.DUNGEON_GRID_SIZE || 4, CONFIG.DUNGEON_ROOMS_COUNT || 7);
    const rooms = dungeon.rooms;
    const start = dungeon.startRoom;

    assert.ok(rooms.length >= 7, `Debe generar al menos 7 salas (generadas: ${rooms.length})`);
    assert.strictEqual(start.type, 'inicio', 'La sala inicial debe ser de tipo inicio');
    assert.strictEqual(start.cleared, false, 'La sala inicial debe tener oleadas iniciales de combate');
    assert.ok(start.waves.length > 0, 'La sala inicial debe tener oleadas asignadas');

    // Recorrido BFS para probar conectividad desde el inicio
    const visited = new Set();
    const queue = [start];
    visited.add(start.id);

    while (queue.length > 0) {
      const current = queue.shift();
      for (const d of directions) {
        if (current.doors[d.door]) {
          const nx = current.gx + d.dx;
          const ny = current.gy + d.dy;
          const neighbor = dungeon.grid[nx]?.[ny];
          if (neighbor && !visited.has(neighbor.id)) {
            visited.add(neighbor.id);
            queue.push(neighbor);
          }
        }
      }
    }

    assert.strictEqual(
      visited.size,
      rooms.length,
      `En la semilla #${seed}, todas las salas deben ser alcanzables por BFS (alcanzadas: ${visited.size}/${rooms.length})`
    );
  }
});

// ----------------------------------------------------------------------------
// 2. Mazmorra Procedural: Puertas estrictamente Recíprocas
// ----------------------------------------------------------------------------
runTest('Todas las puertas entre salas son bidireccionales y recíprocas', () => {
  const oppDoor = { N: 'S', S: 'N', E: 'W', W: 'E' };
  const deltas = {
    N: { dx: 0, dy: -1 },
    S: { dx: 0, dy: 1 },
    E: { dx: 1, dy: 0 },
    W: { dx: -1, dy: 0 }
  };

  const dungeon = DungeonGenerator.generate(4, 7);
  for (const r of dungeon.rooms) {
    for (const [doorDir, hasDoor] of Object.entries(r.doors)) {
      if (hasDoor) {
        const d = deltas[doorDir];
        const neighbor = dungeon.grid[r.gx + d.dx]?.[r.gy + d.dy];
        assert.ok(neighbor, `La sala en (${r.gx},${r.gy}) tiene puerta ${doorDir} pero no existe sala vecina`);
        assert.strictEqual(
          neighbor.doors[oppDoor[doorDir]],
          true,
          `La sala vecina debe tener puerta opuesta ${oppDoor[doorDir]}`
        );
      }
    }
  }
});

// ----------------------------------------------------------------------------
// 3. Mecánica de Puertas: Bloqueo en Combate y Detección de Cruce
// ----------------------------------------------------------------------------
runTest('Las puertas impiden el paso cuando están bloqueadas y detectan cruce al abrirse', () => {
  const room = new Room(960, 640, 32);
  const roomData = {
    doors: { N: true, S: true, E: true, W: true },
    type: 'combate',
    cleared: false
  };
  room.cachedRoomData = roomData;

  const player = new Player(room.width / 2, 20); // En el umbral de la puerta Norte

  // Caso 1: Puertas bloqueadas durante combate
  const crossingBlocked = room.checkDoorCrossing(player, true);
  assert.strictEqual(crossingBlocked, null, 'No debe permitir cruzar si las puertas están bloqueadas');
  const lockedContact = room.checkLockedDoorContact(player, true);
  assert.strictEqual(lockedContact, 'N', 'Debe detectar contacto con puerta Norte bloqueada');

  // Caso 2: Puertas abiertas tras despejar (probando con confinamiento exacto de pared: y = 46)
  player.y = room.wallThickness + player.radius; // 32 + 14 = 46 px (límite físico donde se detiene el jugador)
  const crossingOpenConfined = room.checkDoorCrossing(player, false);
  assert.strictEqual(crossingOpenConfined, 'N', 'Debe detectar cruce con el jugador confinado en el muro a y=46');

  // Probar puerta Sur con confinamiento exacto
  player.y = room.height - room.wallThickness - player.radius; // 594 px
  assert.strictEqual(room.checkDoorCrossing(player, false), 'S', 'Debe detectar cruce por puerta Sur confinado a y=594');

  // Probar puerta Oeste con confinamiento exacto
  player.x = room.wallThickness + player.radius; // 46 px
  player.y = room.height / 2;
  assert.strictEqual(room.checkDoorCrossing(player, false), 'W', 'Debe detectar cruce por puerta Oeste confinado a x=46');

  // Probar puerta Este con confinamiento exacto
  player.x = room.width - room.wallThickness - player.radius; // 914 px
  player.y = room.height / 2;
  assert.strictEqual(room.checkDoorCrossing(player, false), 'E', 'Debe detectar cruce por puerta Este confinado a x=914');

  // Probar fuera del umbral de puerta
  player.x = 100; // Lejos del centro
  player.y = 46;
  assert.strictEqual(room.checkDoorCrossing(player, false), null, 'No debe cruzar fuera del umbral de la puerta');
});

// ----------------------------------------------------------------------------
// 4. Arquetipo 1: Corredor (Rusher / Charger) - Aviso y Carga Rápida
// ----------------------------------------------------------------------------
runTest('Arquetipo Corredor entra en preparación (windup) y realiza carga veloz en línea recta', () => {
  const room = new Room(960, 640, 32);
  const player = new Player(500, 300);
  const sh = new SpatialHash(75);
  const ePool = new EnemyPool(10);

  const rusher = ePool.spawn(400, 300, ENEMIGOS.corredor); // A 100px (dentro de rango de carga < 240px)
  sh.insert(rusher);

  assert.strictEqual(rusher.rusherState, 'chase', 'Estado inicial debe ser chase');

  // Paso 1: Actualizar para detectar al jugador y entrar en windup
  ePool.update(1 / 60, player, sh, room, () => {}, null, null, null);
  assert.strictEqual(rusher.rusherState, 'windup', 'Debe entrar en preparación de carga (windup)');
  assert.ok(rusher.rusherTimer > 0, 'Debe tener temporizador de preparación');

  // Paso 2: Avanzar el tiempo del windup para activar el dash
  rusher.rusherTimer = 0.01;
  ePool.update(0.02, player, sh, room, () => {}, null, null, null);
  assert.strictEqual(rusher.rusherState, 'dash', 'Tras el aviso debe entrar en estado de carrera (dash)');

  // En dash, la velocidad debe ser masiva (> 2x velocidad base)
  const speedMagnitude = Math.hypot(rusher.vx, rusher.vy);
  assert.ok(speedMagnitude > rusher.speed * 1.5, `La velocidad en carrera debe ser superior (actual: ${speedMagnitude.toFixed(1)})`);
});

// ----------------------------------------------------------------------------
// 5. Arquetipo 2: Tirador (Shooter) - Kiteo y Disparo de Proyectiles Arcanos
// ----------------------------------------------------------------------------
runTest('Arquetipo Tirador mantiene distancia y dispara proyectiles enemigos al jugador', () => {
  const room = new Room(960, 640, 32);
  const player = new Player(400, 300);
  const sh = new SpatialHash(75);
  const ePool = new EnemyPool(10);
  const enemyBullets = new EnemyProjectilePool(10);

  // Colocar tirador muy cerca (100px) para probar comportamiento de huida / kiteo
  const shooter = ePool.spawn(300, 300, ENEMIGOS.tirador);
  sh.insert(shooter);

  ePool.update(1 / 60, player, sh, room, () => {}, enemyBullets, null, null);
  assert.ok(shooter.vx < 0, 'El tirador debe retroceder (vx < 0) cuando el jugador está demasiado cerca');

  // Forzar cooldown de disparo a 0 para validar generación de proyectil enemigo
  shooter.shootTimer = 0;
  ePool.update(1 / 60, player, sh, room, () => {}, enemyBullets, null, null);

  assert.strictEqual(enemyBullets.activeCount, 1, 'Debe haber disparado 1 proyectil enemigo hacia el jugador');
  const bullet = enemyBullets.pool[0];
  assert.ok(bullet.active, 'El proyectil enemigo debe estar activo');
  assert.ok(bullet.vx > 0, 'El proyectil debe viajar hacia la derecha en dirección al jugador');
});

// ----------------------------------------------------------------------------
// 6. Arquetipo 3: Invocador (Summoner) - Canalización y Generación de Espectros
// ----------------------------------------------------------------------------
runTest('Arquetipo Invocador huye del jugador y canaliza invocación de esbirros', () => {
  const room = new Room(960, 640, 32);
  const player = new Player(400, 300);
  const sh = new SpatialHash(75);
  const ePool = new EnemyPool(10);

  const summoner = ePool.spawn(300, 300, ENEMIGOS.invocador);
  sh.insert(summoner);

  // Huida cuando el jugador está cerca
  ePool.update(1 / 60, player, sh, room, () => {}, null, null, null);
  assert.ok(summoner.vx < 0, 'El invocador debe huir del jugador (vx < 0)');

  // Forzar canalización de invocación
  summoner.summonTimer = 0;
  let minionSpawned = false;
  ePool.update(1 / 60, player, sh, room, () => {}, null, null, (mx, my) => {
    minionSpawned = true;
  });
  assert.strictEqual(summoner.isSummoning, true, 'Debe entrar en estado de canalización');

  // Culminar canalización y verificar callback
  summoner.summonChannelTimer = 0.01;
  ePool.update(0.02, player, sh, room, () => {}, null, null, (mx, my) => {
    minionSpawned = true;
  });
  assert.strictEqual(minionSpawned, true, 'Debe invocar esbirros al completar la canalización');
});

// ----------------------------------------------------------------------------
// 7. Arquetipo 4: Explosivo (Explosive / Kamikaze) - Mecha y Detonación
// ----------------------------------------------------------------------------
runTest('Arquetipo Explosivo enciende mecha al acercarse al jugador y detona en área', () => {
  const room = new Room(960, 640, 32);
  const player = new Player(400, 300);
  const sh = new SpatialHash(75);
  const ePool = new EnemyPool(10);

  // Colocar a 40px (< 48px radio de activación de mecha)
  const explosive = ePool.spawn(365, 300, ENEMIGOS.explosivo);
  sh.insert(explosive);

  ePool.update(1 / 60, player, sh, room, () => {}, null, null, null);
  assert.strictEqual(explosive.isTicking, true, 'Debe encender la mecha de detonación');
  assert.ok(explosive.fuseTimer > 0, 'El temporizador de la mecha debe estar activo');

  // Concluir la mecha y verificar que detona y se desactiva
  explosive.fuseTimer = 0.01;
  let exploded = false;
  ePool.update(0.02, player, sh, room, () => {}, null, (expEnemy) => {
    exploded = true;
  }, null);

  assert.strictEqual(exploded, true, 'Debe detonar y disparar el callback de explosión');
  assert.strictEqual(explosive.active, false, 'El enemigo explosivo debe desactivarse tras estallar');
});

// ----------------------------------------------------------------------------
// 8. Arquetipo 5: Escudado (Shielded) - Reducción Frontal del 80% y Daño Total por Flanco
// ----------------------------------------------------------------------------
runTest('Arquetipo Escudado absorbe 80% del daño frontal pero recibe daño completo por la espalda', () => {
  const shielded = new Enemy();
  shielded.spawn(400, 300, ENEMIGOS.escudado, false);
  shielded.facingAngle = 0; // Mirando hacia la derecha (0 rad)

  // Caso A: Ataque frontal desde la derecha (el proyectil viene desde x=500, y=300 hacia x=400)
  // El atacante está al frente del enemigo
  const initialHp = shielded.hp;
  shielded.takeDamage(100, -10, 0, 500, 300); // Daño 100 de frente
  const damageTakenFront = initialHp - shielded.hp;

  assert.strictEqual(damageTakenFront, 20, 'El escudo frontal debe absorber el 80% del daño (recibe solo 20 de 100)');

  // Caso B: Ataque por la espalda desde la izquierda (x=300, y=300)
  shielded.hp = 100;
  shielded.takeDamage(50, 10, 0, 300, 300); // Daño 50 por la retaguardia
  const damageTakenRear = 100 - shielded.hp;

  assert.strictEqual(damageTakenRear, 50, 'El ataque por la espalda debe infligir el 100% del daño (50 de 50)');
});

// ----------------------------------------------------------------------------
// 9. Modificadores de Élites
// ----------------------------------------------------------------------------
runTest('Modificadores de élite multiplican atributos y asignan modificador válido', () => {
  const eliteEnemy = new Enemy();
  eliteEnemy.spawn(300, 300, ENEMIGOS.perseguidor, true);

  assert.strictEqual(eliteEnemy.isElite, true, 'Debe marcarse como élite');
  assert.ok(eliteEnemy.eliteMod, 'Debe tener un modificador de élite asignado');
  assert.ok(eliteEnemy.maxHp > ENEMIGOS.perseguidor.hp, 'La vida máxima del élite debe ser significativamente mayor');
  assert.ok(eliteEnemy.radius > ENEMIGOS.perseguidor.radius, 'El tamaño del élite debe ser mayor');
});

// ----------------------------------------------------------------------------
// 10. Corrección del Bug de Estallido: Cero Zombies
// ----------------------------------------------------------------------------
runTest('Habilidad Especial desactiva inmediatamente enemigos con HP <= 0 y llama a onEnemyKilled', () => {
  const room = new Room(960, 640, 32);
  const player = new Player(300, 300);
  const sh = new SpatialHash(75);
  const ePool = new EnemyPool(10);
  const parts = new ParticlePool(50);
  const texts = new FloatingTextPool(10);

  // Crear 3 enemigos débiles dentro del radio del estallido
  const e1 = ePool.spawn(320, 300, ENEMIGOS.perseguidor);
  const e2 = ePool.spawn(300, 330, ENEMIGOS.corredor);
  const e3 = ePool.spawn(280, 300, ENEMIGOS.explosivo);

  sh.insert(e1);
  sh.insert(e2);
  sh.insert(e3);

  let killedList = [];
  const killedCallback = (e) => {
    killedList.push(e);
  };

  const used = player.useSpecialAbility(sh, ePool, parts, texts, null, null, killedCallback);
  assert.strictEqual(used, true, 'La habilidad debe activarse');

  // Como el daño del estallido es 80 y la vida de estos enemigos es < 40, todos deben morir de inmediato
  assert.strictEqual(e1.active, false, 'Enemigo 1 debe quedar inactivo (no zombie)');
  assert.strictEqual(e2.active, false, 'Enemigo 2 debe quedar inactivo (no zombie)');
  assert.strictEqual(e3.active, false, 'Enemigo 3 debe quedar inactivo (no zombie)');
  assert.strictEqual(killedList.length, 3, 'Debe invocar onEnemyKilled para las 3 víctimas');

  // En la siguiente actualización, el pool no debe tener entidades activas con hp <= 0
  ePool.update(1 / 60, player, sh, room, () => {}, null, null, null);
  assert.strictEqual(ePool.activeCount, 0, 'No deben quedar entidades fantasma en el pool');
});

console.log('\n==========================================================');
console.log(`RESULTADO: ${passedTests} / ${totalTests} PRUEBAS SUPERADAS (${Math.round(passedTests/totalTests*100)}%)`);
console.log('==========================================================\n');
