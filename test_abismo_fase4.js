/**
 * PRUEBAS AUTOMATIZADAS - ABISMO: FASE 4
 * Jefes, biomas, personajes y armas adicionales, mapas grandes y niveles progresivos.
 */
(() => {
  'use strict';

  const assert = require('assert');
  const CFG = require('./games/abismo/config.js');
  const { DungeonGenerator, TIPOS_SALA, BIOMAS } = require('./games/abismo/data/salas.js');
  const PERSONAJES = require('./games/abismo/data/personajes.js');
  const { ENEMIGOS } = require('./games/abismo/data/enemigos.js');
  const {
    Player,
    SpatialHashClass,
    ProjectilePool,
    EnemyProjectilePool,
    Enemy,
    EnemyPool,
    Room,
    AbismoGame
  } = require('./games/abismo/game.js');

  console.log('\n==========================================================');
  console.log('   PRUEBAS AUTOMATIZADAS: ABISMO - FASE 4');
  console.log('   Jefes, Biomas, Personajes, Armas y Niveles Progresivos');
  console.log('==========================================================\n');

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
      console.error(`    Error: ${err.message}`);
      if (err.stack) {
        console.error(`    Stack: ${err.stack.split('\n').slice(1, 4).join('\n')}`);
      }
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Mapas más grandes y conectividad 100% garantizada
  // --------------------------------------------------------------------------
  runTest('Generación de mapas grandes (5x5 y 6x6) con conectividad garantizada', () => {
    for (let run = 1; run <= 10; run++) {
      const dungeon = DungeonGenerator.generate(5, 12, 1);
      assert.strictEqual(dungeon.gridSize, 5, 'El tamaño de la rejilla debe ser 5x5');
      assert.strictEqual(dungeon.rooms.length, 12, 'Debe generar exactamente 12 salas');
      assert.ok(dungeon.startRoom, 'Debe existir sala de inicio');
      assert.ok(dungeon.bossRoom, 'Debe existir sala final/jefe');

      // Comprobar alcanzabilidad BFS desde startRoom
      const visited = new Set();
      const queue = [dungeon.startRoom];
      visited.add(dungeon.startRoom.id);

      while (queue.length > 0) {
        const curr = queue.shift();
        const dirs = [
          { d: 'N', dx: 0, dy: -1 },
          { d: 'S', dx: 0, dy: 1 },
          { d: 'E', dx: 1, dy: 0 },
          { d: 'W', dx: -1, dy: 0 }
        ];

        for (const dir of dirs) {
          if (curr.doors[dir.d]) {
            const nx = curr.gx + dir.dx;
            const ny = curr.gy + dir.dy;
            const neighbor = dungeon.grid[nx]?.[ny];
            if (neighbor && !visited.has(neighbor.id)) {
              visited.add(neighbor.id);
              queue.push(neighbor);
            }
          }
        }
      }

      assert.strictEqual(visited.size, dungeon.rooms.length, 'Todas las salas deben estar conectadas');
    }
  });

  // --------------------------------------------------------------------------
  // TEST 2: Niveles progresivos y ciclo de 3 biomas
  // --------------------------------------------------------------------------
  runTest('Ciclo de biomas dinámicos según piso alcanzado', () => {
    assert.strictEqual(BIOMAS.length, 3, 'Deben existir 3 biomas distintos');

    // Piso 1-5: Cripta Inferior
    const b1 = DungeonGenerator.getBiomeForFloor(1);
    const b5 = DungeonGenerator.getBiomeForFloor(5);
    assert.strictEqual(b1.id, 'cripta_inferior');
    assert.strictEqual(b5.id, 'cripta_inferior');

    // Piso 6-10: Catacumbas de Fuego
    const b6 = DungeonGenerator.getBiomeForFloor(6);
    const b10 = DungeonGenerator.getBiomeForFloor(10);
    assert.strictEqual(b6.id, 'catacumbas_fuego');
    assert.strictEqual(b10.id, 'catacumbas_fuego');

    // Piso 11+: Abismo Astral
    const b11 = DungeonGenerator.getBiomeForFloor(11);
    assert.strictEqual(b11.id, 'abismo_astral');

    // Verificar que cada bioma tiene paleta visual completa
    BIOMAS.forEach(biome => {
      assert.ok(biome.palette, `Bioma ${biome.id} debe tener paleta`);
      assert.ok(biome.palette.BG, `Bioma ${biome.id} debe tener BG`);
      assert.ok(biome.palette.FLOOR_DARK, `Bioma ${biome.id} debe tener FLOOR_DARK`);
      assert.ok(biome.palette.FLOOR_LIGHT, `Bioma ${biome.id} debe tener FLOOR_LIGHT`);
      assert.ok(biome.palette.WALL, `Bioma ${biome.id} debe tener WALL`);
    });
  });

  // --------------------------------------------------------------------------
  // TEST 3: Asignación de Jefes cada 5 pisos
  // --------------------------------------------------------------------------
  runTest('Jefes asignados cada 5 pisos (Piso 5: Señor del Abismo, Piso 10: Gólem)', () => {
    // Piso normal (piso 3): no tiene sala jefe, tiene portal
    const d3 = DungeonGenerator.generate(5, 10, 3);
    assert.notStrictEqual(d3.bossRoom.type, 'jefe', 'Piso 3 no debe tener sala jefe');
    assert.strictEqual(d3.bossRoom.hasPortal, true, 'Piso 3 debe tener portal de descenso en sala final');

    // Piso 5: tiene sala jefe y oleada con jefe_cripta
    const d5 = DungeonGenerator.generate(5, 10, 5);
    assert.strictEqual(d5.bossRoom.type, 'jefe', 'Piso 5 debe tener sala jefe');
    assert.strictEqual(d5.bossRoom.hasPortal, true, 'Piso 5 debe tener portal tras derrotar al jefe');
    assert.ok(d5.bossRoom.waves[0].enemies.includes('jefe_cripta'), 'Piso 5 debe incluir jefe_cripta');

    // Piso 10: tiene sala jefe y oleada con jefe_magma
    const d10 = DungeonGenerator.generate(5, 10, 10);
    assert.strictEqual(d10.bossRoom.type, 'jefe', 'Piso 10 debe tener sala jefe');
    assert.ok(d10.bossRoom.waves[0].enemies.includes('jefe_magma'), 'Piso 10 debe incluir jefe_magma');
  });

  // --------------------------------------------------------------------------
  // TEST 4: IA del Jefe con Slam telegrafiado y transición a Fase 2 (Furia)
  // --------------------------------------------------------------------------
  runTest('IA de Jefe: Telegrafiado visual de Slam y Fase 2 (< 50% HP)', () => {
    const enemyPool = new EnemyPool(10);
    const boss = enemyPool.spawn(400, 300, ENEMIGOS.jefe_cripta, false);

    assert.ok(boss, 'Jefe debe spawnear exitosamente');
    assert.strictEqual(boss.isBoss, true, 'Propiedad isBoss debe ser true');
    assert.strictEqual(boss.bossPhase, 1, 'Inicia en Fase 1');
    assert.strictEqual(boss.maxHp, 450, 'HP de jefe_cripta debe ser 450');

    const player = new Player(450, 300);
    const spatialHash = new SpatialHashClass(75);
    spatialHash.insert(boss);
    const enemyProjectiles = new EnemyProjectilePool(30);
    const room = new Room(960, 640);

    // Simular tiempo hasta activar telegraph
    boss.slamTimer = 0;
    enemyPool.update(
      0.1,
      player,
      spatialHash,
      room,
      () => {},
      enemyProjectiles,
      () => {},
      () => {}
    );

    // Debe haber iniciado el telegrafiado hacia la posición del jugador
    assert.ok(boss.slamTelegraphTimer > 0, 'Slam debe iniciar telegrafiado visual antes del impacto');
    assert.strictEqual(boss.slamTargetX, player.x, 'El objetivo del slam debe ser la posición del jugador');

    // Simular daño de más del 50% para activar Fase 2
    const initialSpeed = boss.speed;
    let minionSpawned = false;
    boss.hp = 200; // < 225 (50% de 450)

    enemyPool.update(
      0.1,
      player,
      spatialHash,
      room,
      () => {},
      enemyProjectiles,
      () => {},
      () => { minionSpawned = true; }
    );

    assert.strictEqual(boss.bossPhase, 2, 'Jefe debe transicionar a Fase 2 cuando HP <= 50%');
    assert.ok(boss.speed > initialSpeed, 'Velocidad de jefe debe aumentar en Fase 2');
    assert.strictEqual(minionSpawned, true, 'Fase 2 debe invocar esbirros de apoyo');
  });

  // --------------------------------------------------------------------------
  // TEST 5: Ataque circular del Jefe (Starburst de 360 grados)
  // --------------------------------------------------------------------------
  runTest('Ataque en estrella (Starburst 360°) del Jefe genera anillo de proyectiles', () => {
    const enemyPool = new EnemyPool(10);
    const boss = enemyPool.spawn(400, 300, ENEMIGOS.jefe_cripta, false);
    const player = new Player(500, 300);
    const spatialHash = new SpatialHashClass(75);
    spatialHash.insert(boss);
    const enemyProjectiles = new EnemyProjectilePool(30);
    const room = new Room(960, 640);

    boss.starburstTimer = 0; // Forzar disparo circular
    enemyPool.update(0.1, player, spatialHash, room, () => {}, enemyProjectiles, () => {}, () => {});

    assert.ok(enemyProjectiles.activeCount >= 8, 'Debe generar al menos 8 proyectiles en 360°');
  });

  // --------------------------------------------------------------------------
  // TEST 6: Estilos de armas del Jugador (3 estilos distintos)
  // --------------------------------------------------------------------------
  runTest('Estilos de armas (Proyectil, Orbe Giratorio, Onda de Área)', () => {
    const spatialHash = new SpatialHashClass(75);
    const projectiles = new ProjectilePool(20);
    const enemyProjectiles = new EnemyProjectilePool(20);
    const room = new Room(960, 640);

    // 1. Arma: Proyectil
    const p1 = new Player(400, 300);
    p1.weaponStyle = 'proyectil';
    const enemy1 = new Enemy();
    enemy1.spawn(460, 300, ENEMIGOS.perseguidor);
    spatialHash.insert(enemy1);

    p1.update(0.4, 0, 0, room, spatialHash, projectiles, null, null, enemyProjectiles);
    assert.ok(projectiles.activeCount >= 1, 'Estilo proyectil debe disparar proyectiles');

    // 2. Arma: Orbe Giratorio
    spatialHash.clear();
    const p2 = new Player(400, 300);
    p2.weaponStyle = 'orbe';
    const enemy2 = new Enemy();
    enemy2.spawn(460, 300, ENEMIGOS.perseguidor); // A 60px del jugador (dentro del radio de órbita 72px)
    const initialEnemy2Hp = enemy2.hp;
    spatialHash.insert(enemy2);

    // Avanzar órbita hasta colisionar
    p2.orbitAngle = 0; // Ángulo 0 apunta directamente a (400 + 72, 300) = (472, 300), muy cerca de (460, 300)
    p2.orbitCooldownTimer = 0;
    p2.update(0.05, 0, 0, room, spatialHash, projectiles, null, null, enemyProjectiles);

    assert.ok(enemy2.hp < initialEnemy2Hp, 'Orbe giratorio debe dañar enemigos que cruzan su trayectoria');

    // 3. Arma: Onda de Área
    spatialHash.clear();
    const p3 = new Player(400, 300);
    p3.weaponStyle = 'onda';
    const enemy3 = new Enemy();
    enemy3.spawn(470, 300, ENEMIGOS.perseguidor);
    const initialEnemy3Hp = enemy3.hp;
    spatialHash.insert(enemy3);

    // Spawn proyectil enemigo dentro del radio de onda
    enemyProjectiles.spawn(430, 300, 0, 100);
    assert.strictEqual(enemyProjectiles.activeCount, 1, 'Proyectil enemigo debe estar activo');

    p3.pulseTimer = 0; // Forzar activación de onda
    p3.update(0.05, 0, 0, room, spatialHash, projectiles, null, null, enemyProjectiles);

    assert.ok(enemy3.hp < initialEnemy3Hp, 'Onda de área debe infligir daño radial');
    assert.strictEqual(enemyProjectiles.activeCount, 0, 'Onda de área debe destruir proyectiles enemigos');
  });

  // --------------------------------------------------------------------------
  // TEST 7: Los 3 personajes con estadísticas y armas iniciales diferenciadas
  // --------------------------------------------------------------------------
  runTest('Personajes seleccionables (Peregrino, Hechicera, Centinela) con atributos únicos', () => {
    assert.ok(PERSONAJES.length >= 3, 'Deben existir al menos 3 personajes seleccionables');

    const charPeregrino = PERSONAJES.find(c => c.id === 'peregrino');
    const charHechicera = PERSONAJES.find(c => c.id === 'hechicera');
    const charCentinela = PERSONAJES.find(c => c.id === 'centinela');

    assert.ok(charPeregrino, 'Debe existir Peregrino');
    assert.ok(charHechicera, 'Debe existir Hechicera');
    assert.ok(charCentinela, 'Debe existir Centinela');

    assert.strictEqual(charPeregrino.weaponStyle, 'proyectil');
    assert.strictEqual(charHechicera.weaponStyle, 'orbe');
    assert.strictEqual(charCentinela.weaponStyle, 'onda');

    // Verificar aplicación de personaje en la entidad Player
    const player = new Player(400, 300);
    player.applyCharacter(charHechicera);

    assert.strictEqual(player.characterId, 'hechicera');
    assert.strictEqual(player.weaponStyle, 'orbe');
    assert.strictEqual(player.maxHp, charHechicera.hp);
    assert.strictEqual(player.color, charHechicera.color);
  });

  // --------------------------------------------------------------------------
  // TEST 8: Detección y activación del Portal de Descenso
  // --------------------------------------------------------------------------
  runTest('Portal de descenso: activación exclusiva en salas despejadas', () => {
    const room = new Room(960, 640);
    const roomData = { hasPortal: true, cleared: false };
    room.buildOffscreen(roomData);

    const player = new Player(480, 320); // Justo en el centro del portal

    // Sala no despejada: portal inactivo
    assert.strictEqual(room.checkPortalCrossing(player), false, 'No debe activar portal si la sala no está despejada');

    // Sala despejada: portal activo en el centro
    roomData.cleared = true;
    assert.strictEqual(room.checkPortalCrossing(player), true, 'Debe activar portal en sala despejada al posicionarse en el centro');

    // Jugador fuera de rango
    player.x = 200;
    player.y = 200;
    assert.strictEqual(room.checkPortalCrossing(player), false, 'No debe activar portal fuera de su radio');
  });

  console.log('\n==========================================================');
  console.log(`   RESUMEN FASE 4: ${passedTests} de ${totalTests} pruebas superadas.`);
  console.log('==========================================================\n');

  if (passedTests < totalTests) {
    process.exit(1);
  }
})();
