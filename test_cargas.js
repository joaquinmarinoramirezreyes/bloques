/**
 * test_cargas.js - Pruebas unitarias en Node para Cargas (Arcade 90s)
 */
const assert = require('assert');
const { CONFIG, CargasLogic } = require('./games/cargas/game.js');

console.log('--- INICIANDO TEST: CARGAS (ARCADE 90s INDUSTRIAL) ---');

// 1. Verificación de configuración y 12 niveles definidos como datos
assert.strictEqual(CONFIG.LEVELS.length >= 12, true, 'Deben definirse al menos 12 niveles como datos');
console.log(`✓ Configuración validada: ${CONFIG.LEVELS.length} niveles definidos`);

// 2. Validación de cuadrícula de 11x13, bordes sólidos y jefes en niveles 5 y 10
CONFIG.LEVELS.forEach((lvl, idx) => {
  const parsed = CargasLogic.parseMap(lvl.map);
  assert.strictEqual(parsed.rows, 13, `Nivel ${idx + 1} debe tener 13 filas`);
  assert.strictEqual(parsed.cols, 11, `Nivel ${idx + 1} debe tener 11 columnas`);

  // Verificar que el spawn de P1 esté libre y no atrapado entre paredes
  assert.strictEqual(parsed.grid[parsed.p1Start.r][parsed.p1Start.c], 0, `P1 spawn debe estar en celda transitable`);
  assert.strictEqual(parsed.p1Start.r, 1);
  assert.strictEqual(parsed.p1Start.c, 1);

  // Verificar que el spawn de P2 esté libre
  assert.strictEqual(parsed.grid[parsed.p2Start.r][parsed.p2Start.c], 0, `P2 spawn debe estar en celda transitable`);

  // Verificar jefes en nivel 5 y 10
  if (idx === 4) {
    assert.strictEqual(lvl.isBoss, true, 'Nivel 5 debe ser de Jefe');
    assert.strictEqual(parsed.boss.type, 'titan', 'Jefe del nivel 5 debe ser Titán Giróscopo');
  } else if (idx === 9) {
    assert.strictEqual(lvl.isBoss, true, 'Nivel 10 debe ser de Jefe');
    assert.strictEqual(parsed.boss.type, 'archon', 'Jefe del nivel 10 debe ser Núcleo Arconte');
  }
});
console.log('✓ Los 12 niveles cumplen las dimensiones exactas 11x13 y los jefes 5 y 10 están configurados');

// 3. Cálculo de la onda en rombo (Manhattan) con bloqueo por obstáculos
{
  const openGrid = [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0]
  ];

  // En espacio abierto con radio 2, la onda debe formar exactamente un rombo de 13 celdas
  const blastOpen = CargasLogic.calculateDiamondBlast(openGrid, 2, 2, 2);
  assert.strictEqual(blastOpen.blastCells.length, 13, 'Un rombo Manhattan de radio 2 debe contener 13 celdas');

  // Cada celda en la onda debe satisfacer |dr| + |dc| <= 2
  blastOpen.blastCells.forEach(cell => {
    const manhattan = Math.abs(cell.r - 2) + Math.abs(cell.c - 2);
    assert.strictEqual(manhattan <= 2, true, 'La distancia Manhattan debe ser menor o igual al radio');
  });

  // Bloqueo por pilar indestructible (1)
  const wallGrid = [
    [0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0], // Pilar sólido en (1, 2)
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0]
  ];
  const blastWall = CargasLogic.calculateDiamondBlast(wallGrid, 2, 2, 2);
  assert.strictEqual(blastWall.blastCells.some(c => c.r === 1 && c.c === 2), false, 'Los pilares indestructibles no pueden ser alcanzados');
  assert.strictEqual(blastWall.blastCells.some(c => c.r === 0 && c.c === 2), false, 'La celda detrás del pilar queda bloqueada');

  // Destrucción y absorción por bloque blando (2)
  const blockGrid = [
    [0, 0, 0, 0, 0],
    [0, 0, 2, 0, 0], // Bloque blando en (1, 2)
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0]
  ];
  const blastBlock = CargasLogic.calculateDiamondBlast(blockGrid, 2, 2, 2);
  assert.strictEqual(blastBlock.destroyedBlocks.some(b => b.r === 1 && b.c === 2), true, 'El bloque blando es alcanzado y destruido');
  assert.strictEqual(blastBlock.blastCells.some(c => c.r === 0 && c.c === 2), false, 'La onda no atraviesa más allá del bloque blando');

  console.log('✓ Cálculo de onda en rombo (Manhattan) y absorción/bloqueo por obstáculos verificado');
}

// 4. Empuje y colisión de cargas (deslizamiento continuo y aplastamiento de enemigos)
{
  const corridorGrid = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1]
  ];

  const patrolGuardian = { r: 1, c: 4, type: 'patrol', destroyed: false };
  const slideRes = CargasLogic.simulateSlide(corridorGrid, 1, 1, 0, 1, [patrolGuardian]);

  // Debe deslizarse hasta chocar con la pared derecha en (1, 5)
  assert.strictEqual(slideRes.finalR, 1);
  assert.strictEqual(slideRes.finalC, 5, 'La carga debe deslizarse hasta la celda antes de la pared');

  // El guardián situado en (1, 4) debió ser aplastado en el camino
  assert.strictEqual(patrolGuardian.destroyed, true, 'El guardián en la trayectoria de la carga debe ser aplastado');
  assert.strictEqual(slideRes.crushedGuardians.length, 1);

  console.log('✓ Empuje, deslizamiento continuo y aplastamiento de guardianes verificado');
}

// 5. Detonaciones en cadena de resonancia sin bucles infinitos
{
  const grid = [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0]
  ];

  // Tres cargas encadenadas en fila dentro de radio 2
  const chainCharges = [
    { id: 'c1', r: 1, c: 1, radius: 2, timer: 0, detonated: false },
    { id: 'c2', r: 1, c: 2, radius: 2, timer: 3.0, detonated: false },
    { id: 'c3', r: 1, c: 3, radius: 2, timer: 3.0, detonated: false }
  ];

  const chainRes = CargasLogic.resolveChainDetonations(chainCharges, grid);
  assert.strictEqual(chainRes.comboCount, 3, 'Las 3 cargas deben detonarse en cadena con combo x3');
  assert.strictEqual(chainRes.chainList.length, 3);
  assert.strictEqual(chainCharges.every(c => c.detonated), true, 'Todas las cargas deben quedar marcadas como detonadas');

  console.log('✓ Detonaciones en cadena de resonancia y prevención de bucles infinitos verificado');
}

// 6. Evasión de los guardianes ante cargas a punto de detonar
{
  const roomGrid = [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1]
  ];

  // Carga a punto de explotar en (2, 2) con timer = 0.5s y radio 1
  const tickingCharges = [
    { id: 'ch_danger', r: 2, c: 2, radius: 1, timer: 0.5, detonated: false }
  ];

  // Cazador situado en (2, 1) dentro de la zona de peligro
  const evadeDecision = CargasLogic.getGuardianEvadeMove(roomGrid, 2, 1, tickingCharges);
  assert.strictEqual(evadeDecision.shouldEvade, true, 'El cazador debe decidir evadir cuando está en peligro');

  // La dirección elegida debe alejarlo de la carga (por ejemplo moverse hacia la izquierda o vertical fuera del radio)
  const nextR = 2 + evadeDecision.dir.r;
  const nextC = 1 + evadeDecision.dir.c;
  const manhattanToCharge = Math.abs(nextR - 2) + Math.abs(nextC - 2);
  assert.strictEqual(manhattanToCharge > 1, true, 'El cazador debe moverse a una casilla fuera del radio de peligro');

  console.log('✓ Evasión reactiva de guardianes ante peligro de detonación verificada');
}

console.log('--- TODOS LOS TESTS DE CARGAS PASARON EXITOSAMENTE ---');
