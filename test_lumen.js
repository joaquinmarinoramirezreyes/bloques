/**
 * test_lumen.js - Pruebas unitarias en Node para Lumen (Arcade 80s)
 */
const assert = require('assert');
const { CONFIG, LumenLogic } = require('./games/lumen/game.js');

console.log('--- INICIANDO TEST: LUMEN (LABERINTO DE LUZ 80s) ---');

// 1. Verificación de configuración: 30 niveles en 5 mundos con 5 jefes
assert.strictEqual(CONFIG.LEVELS.length, 30, 'Deben existir exactamente 30 niveles definidos como datos');
assert.strictEqual(CONFIG.WORLDS.length, 5, 'Deben existir 5 mundos temáticos');
assert.strictEqual(CONFIG.CREATURE_TYPES.length >= 7, true, 'Deben existir al menos 7 tipos de criaturas con comportamientos únicos');
assert.strictEqual(CONFIG.ACHIEVEMENTS.length >= 10, true, 'Deben existir al menos 10 logros');
assert.strictEqual(CONFIG.UPGRADES.length >= 6, true, 'Deben existir al menos 6 mejoras de talentos');

for (let w = 1; w <= 5; w++) {
  const worldLvls = CONFIG.LEVELS.filter(l => l.world === w);
  assert.strictEqual(worldLvls.length, 6, `El Mundo ${w} debe contener exactamente 6 niveles`);
  const bossLvl = worldLvls[worldLvls.length - 1];
  assert.strictEqual(bossLvl.isBoss, true, `El último nivel del Mundo ${w} (${bossLvl.name}) debe ser un Jefe`);
}
console.log(`✓ Configuración validada: 30 niveles agrupados en 5 mundos temáticos con 5 jefes y 7 tipos de criaturas`);

// 2. Conectividad de laberintos y alcanzabilidad de faroles en los 30 niveles
CONFIG.LEVELS.forEach((lvl, idx) => {
  const parsed = LumenLogic.parseMap(lvl.map);

  // Cantidad de faroles por nivel (entre 6 y 10)
  assert.strictEqual(
    parsed.lanterns.length >= 6 && parsed.lanterns.length <= 10,
    true,
    `Nivel ${idx + 1} (${lvl.name}) debe tener entre 6 y 10 faroles (encontrados: ${parsed.lanterns.length})`
  );

  // Laberinto conexo
  const isConnected = LumenLogic.isMazeConnected(parsed.grid, parsed.playerStart.r, parsed.playerStart.c);
  assert.strictEqual(
    isConnected,
    true,
    `El laberinto del Nivel ${idx + 1} (${lvl.name}) no es conexo: hay celdas aisladas`
  );

  // Faroles alcanzables por BFS
  parsed.lanterns.forEach((lan, lIdx) => {
    const path = LumenLogic.findPath(
      parsed.grid,
      parsed.playerStart.r,
      parsed.playerStart.c,
      lan.r,
      lan.c
    );
    assert.notStrictEqual(
      path,
      null,
      `Farol #${lIdx + 1} en [${lan.r}, ${lan.c}] es inalcanzable en el Nivel ${idx + 1}`
    );
  });
});
console.log('✓ Los 30 niveles son 100% conexos y todos sus faroles (entre 6 y 10 por nivel) son alcanzables por BFS');

// 3. Conectividad de túneles laterales wrap-around (fila 9)
{
  const parsed = LumenLogic.parseMap(CONFIG.LEVELS[0].map);
  const leftTunnel = { r: 9, c: 0 };
  const rightTunnel = { r: 9, c: parsed.cols - 1 };

  const leftNeighbors = LumenLogic.getNeighbors(parsed.grid, leftTunnel.r, leftTunnel.c);
  const hasWrapRight = leftNeighbors.some(n => n.r === 9 && n.c === parsed.cols - 1);
  assert.strictEqual(hasWrapRight, true, 'El túnel izquierdo debe conectar con el extremo derecho del laberinto');

  const rightNeighbors = LumenLogic.getNeighbors(parsed.grid, rightTunnel.r, rightTunnel.c);
  const hasWrapLeft = rightNeighbors.some(n => n.r === 9 && n.c === 0);
  assert.strictEqual(hasWrapLeft, true, 'El túnel derecho debe conectar con el extremo izquierdo del laberinto');

  console.log('✓ Conectividad de túneles laterales de envoltura (wrap-around) verificada');
}

// 4. Generador del modo sin fin (Noche Perpetua): 20 semillas probadas
{
  for (let s = 1; s <= 20; s++) {
    const endlessMap = LumenLogic.generateEndlessMaze(s * 104729);
    const parsed = LumenLogic.parseMap(endlessMap);

    assert.strictEqual(
      parsed.lanterns.length >= 6 && parsed.lanterns.length <= 10,
      true,
      `Modo sin fin (semilla ${s}): debe contener entre 6 y 10 faroles`
    );

    const isConn = LumenLogic.isMazeConnected(parsed.grid, parsed.playerStart.r, parsed.playerStart.c);
    assert.strictEqual(isConn, true, `Modo sin fin (semilla ${s}): el laberinto debe ser 100% conexo`);

    for (const lan of parsed.lanterns) {
      const path = LumenLogic.findPath(parsed.grid, parsed.playerStart.r, parsed.playerStart.c, lan.r, lan.c);
      assert.notStrictEqual(path, null, `Modo sin fin (semilla ${s}): farol inalcanzable`);
    }
  }
  console.log('✓ Generador procedural del modo sin fin verificado: 20/20 laberintos conexos y 100% resolubles');
}

// 5. Estado Huida (Flee) de las criaturas: escape hacia la oscuridad
{
  const parsed = LumenLogic.parseMap(CONFIG.LEVELS[0].map);
  const lightSources = [{ r: 11, c: 7, radius: 3.0 }];

  const escapeTarget = LumenLogic.findEscapeTarget(parsed.grid, 11, 6, lightSources);
  assert.notStrictEqual(escapeTarget, null, 'Debe encontrarse un objetivo de huida');

  const distToLight = Math.hypot(escapeTarget.r - 11, escapeTarget.c - 7);
  assert.strictEqual(distToLight > 3.0, true, 'El objetivo de huida debe situarse en zona de sombra fuera de la luz');

  const path = LumenLogic.findPath(parsed.grid, 11, 6, escapeTarget.r, escapeTarget.c);
  assert.notStrictEqual(path, null, 'Debe existir una ruta accesible hacia la zona de huida');

  console.log('✓ Algoritmo de evasión de luz y huida hacia zonas de sombra verificado');
}

// 6. Estado Caza (Hunt): persecución con BFS
{
  const parsed = LumenLogic.parseMap(CONFIG.LEVELS[0].map);
  const path = LumenLogic.findPath(parsed.grid, 9, 7, 1, 1);
  assert.notStrictEqual(path, null, 'El BFS de caza debe encontrar camino hacia el jugador');
  assert.strictEqual(path.length > 0, true);
  assert.strictEqual(path[path.length - 1].r, 1);
  assert.strictEqual(path[path.length - 1].c, 1);

  console.log('✓ Persecución por BFS en estado Caza validada');
}

// 7. Migración de almacenamiento desde lumen:v1 a lumen:v2
{
  const mockStorage = new Map();
  const storageInterface = {
    getItem: (k) => mockStorage.get(k) || null,
    setItem: (k, v) => mockStorage.set(k, v)
  };

  mockStorage.set('lumen:v1:best_score', '8500');
  mockStorage.set('lumen:v1:unlocked', '4');
  mockStorage.set('lumen:v1:level_0', JSON.stringify({ score: 1200, stars: 3 }));

  const migrated = LumenLogic.migrateV1toV2(storageInterface);
  assert.strictEqual(migrated, true, 'La migración debe ejecutarse exitosamente');
  assert.strictEqual(mockStorage.get('lumen:v2:best_score'), '8500', 'El récord debe migrarse');
  assert.strictEqual(mockStorage.get('lumen:v2:unlocked'), '4', 'Los niveles desbloqueados deben migrarse');
  assert.strictEqual(mockStorage.has('lumen:v2:lvl_0'), true, 'El nivel 0 debe migrarse');

  console.log('✓ Migración de almacenamiento de lumen:v1 a lumen:v2 verificada con éxito');
}

console.log('--- TODOS LOS TESTS DE LUMEN PASARON EXITOSAMENTE (7/7) ---');
