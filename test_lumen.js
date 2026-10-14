/**
 * test_lumen.js - Pruebas unitarias en Node para Lumen (Arcade 80s)
 */
const assert = require('assert');
const { CONFIG, LumenLogic } = require('./games/lumen/game.js');

console.log('--- INICIANDO TEST: LUMEN (LABERINTO DE LUZ 80s) ---');

// 1. Verificación de configuración y 12 niveles definidos como datos
assert.strictEqual(CONFIG.LEVELS.length >= 12, true, 'Deben definirse al menos 12 niveles como datos');
console.log(`✓ Configuración validada: ${CONFIG.LEVELS.length} niveles definidos`);

// 2. Conectividad de laberintos y alcanzabilidad de faroles en los 12 niveles
CONFIG.LEVELS.forEach((lvl, idx) => {
  const parsed = LumenLogic.parseMap(lvl.map);

  // Verificar cantidad de faroles por nivel (entre 6 y 10 según requerimiento)
  assert.strictEqual(
    parsed.lanterns.length >= 6 && parsed.lanterns.length <= 10,
    true,
    `Nivel ${idx + 1} (${lvl.name}) debe tener entre 6 y 10 faroles (encontrados: ${parsed.lanterns.length})`
  );

  // Verificar que el laberinto sea conexo (todas las celdas transitables alcanzables desde el spawn)
  const isConnected = LumenLogic.isMazeConnected(parsed.grid, parsed.playerStart.r, parsed.playerStart.c);
  assert.strictEqual(
    isConnected,
    true,
    `El laberinto del Nivel ${idx + 1} (${lvl.name}) no es conexo: hay celdas aisladas`
  );

  // Verificar que cada uno de los faroles sea alcanzable por BFS desde el jugador
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
console.log('✓ Los 12 niveles son 100% conexos y todos sus faroles (entre 6 y 10 por nivel) son alcanzables');

// 3. Verificación de túneles laterales wrap-around (fila 9)
{
  const parsed = LumenLogic.parseMap(CONFIG.LEVELS[0].map);
  const leftTunnel = { r: 9, c: 0 };
  const rightTunnel = { r: 9, c: parsed.cols - 1 };

  // Vecinos de túnel izquierdo deben incluir la celda del extremo derecho
  const leftNeighbors = LumenLogic.getNeighbors(parsed.grid, leftTunnel.r, leftTunnel.c);
  const hasWrapRight = leftNeighbors.some(n => n.r === 9 && n.c === parsed.cols - 1);
  assert.strictEqual(hasWrapRight, true, 'El túnel izquierdo debe conectar con el extremo derecho del laberinto');

  // Vecinos de túnel derecho deben incluir la celda del extremo izquierdo
  const rightNeighbors = LumenLogic.getNeighbors(parsed.grid, rightTunnel.r, rightTunnel.c);
  const hasWrapLeft = rightNeighbors.some(n => n.r === 9 && n.c === 0);
  assert.strictEqual(hasWrapLeft, true, 'El túnel derecho debe conectar con el extremo izquierdo del laberinto');

  console.log('✓ Conectividad de túneles laterales de envoltura (wrap-around) verificada');
}

// 4. Estado Huida (Flee) de las criaturas: escape hacia la oscuridad
{
  const parsed = LumenLogic.parseMap(CONFIG.LEVELS[0].map);
  // Colocar una fuente de luz en [11, 7] (spawn del jugador) con radio 3.0
  const lightSources = [{ r: 11, c: 7, radius: 3.0 }];

  // Criatura situada en [11, 6] (dentro de la luz)
  const escapeTarget = LumenLogic.findEscapeTarget(parsed.grid, 11, 6, lightSources);
  assert.notStrictEqual(escapeTarget, null, 'Debe encontrarse un objetivo de huida');

  // El objetivo de huida debe estar a más de 3.0 celdas de distancia de la luz
  const distToLight = Math.hypot(escapeTarget.r - 11, escapeTarget.c - 7);
  assert.strictEqual(distToLight > 3.0, true, 'El objetivo de huida debe situarse en zona de sombra fuera del radio de luz');

  // Debe existir ruta válida hasta ese objetivo de huida
  const path = LumenLogic.findPath(parsed.grid, 11, 6, escapeTarget.r, escapeTarget.c);
  assert.notStrictEqual(path, null, 'Debe existir una ruta accesible hacia la zona de huida');

  console.log('✓ Algoritmo de evasión de luz y huida hacia zonas de sombra verificado');
}

// 5. Estado Caza (Hunt): persecución con BFS
{
  const parsed = LumenLogic.parseMap(CONFIG.LEVELS[0].map);
  // Criatura en [9, 7], jugador en [1, 1]
  const path = LumenLogic.findPath(parsed.grid, 9, 7, 1, 1);
  assert.notStrictEqual(path, null, 'El BFS de caza debe encontrar camino hacia el jugador');
  assert.strictEqual(path.length > 0, true);
  // El último nodo del camino debe ser la posición del jugador
  assert.strictEqual(path[path.length - 1].r, 1);
  assert.strictEqual(path[path.length - 1].c, 1);

  console.log('✓ Persecución por BFS en estado Caza validada');
}

console.log('--- TODOS LOS TESTS DE LUMEN PASARON EXITOSAMENTE ---');
