// test_derrape_fase4.js
// Pruebas unitarias automatizadas para la Fase 4 del juego Derrape:
// - Catálogo de 4 pistas de dificultad creciente (FÁCIL, MEDIA, DIFÍCIL, EXPERTA)
// - Geometría, continuidad, bounds y parrillas de salida para las 4 pistas
// - Generación de power-ups en pista (Turbo Boost Pads y Manchas de Aceite)
// - Mecánica de recogida y aceleración de Turbo Boost Pad
// - Mecánica de deslizamiento y pérdida de tracción en Mancha de Aceite
// - Cooldown y temporizador de regeneración de power-ups
// - Persistencia independiente de récords por cada una de las 4 pistas

const assert = require('assert');
const {
  CONFIG,
  Track,
  Car,
  AICar,
  AI_PROFILES,
  PLAYER_PROFILE,
  TRACKS_CATALOG,
  TRACK_DATA_PISTA_1,
  resolveCarCollisions,
  updateRaceRankings,
  formatTime,
  getStoredBestLap,
  saveStoredBestLap
} = require('./games/derrape/game.js');

let testsPassed = 0;
let testsTotal = 0;

function runTest(name, fn) {
  testsTotal++;
  try {
    fn();
    console.log(`  OK [PASSED] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  X [FAILED] ${name}`);
    console.error(`    ${err.message}`);
  }
}

console.log('\n==========================================================');
console.log('   PRUEBAS AUTOMATIZADAS: FASE 4 (PISTAS, POWER-UPS Y PULIDO)');
console.log('==========================================================\n');

// ----------------------------------------------------------------------------
// 1. Catálogo de 4 Pistas
// ----------------------------------------------------------------------------
runTest('El catálogo contiene al menos 4 pistas con dificultad creciente', () => {
  assert.ok(Array.isArray(TRACKS_CATALOG), 'TRACKS_CATALOG debe ser un array');
  assert.ok(TRACKS_CATALOG.length >= 4, `Deben existir al menos 4 pistas (actuales: ${TRACKS_CATALOG.length})`);

  const diffs = TRACKS_CATALOG.map(t => t.difficulty);
  assert.ok(diffs.includes('FÁCIL'), 'Debe incluir dificultad FÁCIL');
  assert.ok(diffs.includes('MEDIA'), 'Debe incluir dificultad MEDIA');
  assert.ok(diffs.includes('DIFÍCIL'), 'Debe incluir dificultad DIFÍCIL');
  assert.ok(diffs.includes('EXPERTA'), 'Debe incluir dificultad EXPERTA');

  // IDs únicos
  const ids = TRACKS_CATALOG.map(t => t.id);
  const uniqueIds = new Set(ids);
  assert.strictEqual(uniqueIds.size, ids.length, 'Cada pista debe tener un id único');
});

// ----------------------------------------------------------------------------
// 2. Geometría y Parámetros de las 4 Pistas
// ----------------------------------------------------------------------------
runTest('Cada una de las 4 pistas genera una spline cerrada, checkpoints y bounds válidos', () => {
  TRACKS_CATALOG.forEach((data, idx) => {
    const track = new Track(data);
    assert.ok(track.samples.length >= 400, `Pista ${data.name} debe tener al menos 400 muestras (tiene ${track.samples.length})`);
    assert.ok(track.totalLength > 4500, `Pista ${data.name} debe tener longitud mayor a 4500px (${track.totalLength.toFixed(1)}px)`);
    assert.strictEqual(track.checkpoints.length, 12, `Pista ${data.name} debe generar 12 checkpoints anti-trampas`);

    // Bounds delimitados
    const b = track.bounds;
    assert.ok(b.width > 500 && b.height > 500, `Bounds de ${data.name} deben tener dimensiones positivas válidas`);
    assert.ok(Number.isFinite(b.minX) && Number.isFinite(b.maxX), `Bounds de ${data.name} no deben tener NaN`);

    // Parrilla de salida
    const grid = track.getStartingGrid(4);
    assert.strictEqual(grid.length, 4, `Pista ${data.name} debe generar parrilla de salida de 4 autos`);
  });
});

// ----------------------------------------------------------------------------
// 3. Generación de Power-ups en Pista
// ----------------------------------------------------------------------------
runTest('Las pistas generan Turbo Boost Pads y Manchas de Aceite sobre el asfalto', () => {
  TRACKS_CATALOG.forEach(data => {
    const track = new Track(data);
    assert.ok(Array.isArray(track.powerUps), `Pista ${data.name} debe tener array de powerUps`);
    assert.ok(track.powerUps.length >= 2, `Pista ${data.name} debe tener al menos 2 power-ups`);

    const hasBoost = track.powerUps.some(p => p.type === 'BOOST');
    const hasOil = track.powerUps.some(p => p.type === 'OIL');
    assert.ok(hasBoost, `Pista ${data.name} debe incluir Turbo Boost Pads`);
    assert.ok(hasOil, `Pista ${data.name} debe incluir Manchas de Aceite`);

    // Verificar que los power-ups estén ubicados dentro del asfalto de la pista
    track.powerUps.forEach(p => {
      const q = track.queryTrackPosition(p.x, p.y);
      assert.strictEqual(q.isOffroad, false, `El powerup ${p.id} en ${data.name} debe estar sobre el asfalto (distancia al centro: ${q.distToCenter.toFixed(1)}px, ancho mitad: ${track.width/2}px)`);
    });
  });
});

// ----------------------------------------------------------------------------
// 4. Mecánica de Turbo Boost Pad
// ----------------------------------------------------------------------------
runTest('Turbo Boost Pad incrementa velocidad, recarga nitro y entra en cooldown', () => {
  const track = new Track(TRACKS_CATALOG[0]);
  const boostPad = track.powerUps.find(p => p.type === 'BOOST');
  assert.ok(boostPad, 'Debe haber al menos un boost pad en la pista 1');

  const car = new Car(boostPad.x, boostPad.y, boostPad.angle, { isPlayer: true });
  car.speed = 150;
  car.vx = Math.cos(car.angle) * 150;
  car.vy = Math.sin(car.angle) * 150;
  car.nitroFuel = 0.5;

  // Comprobar colisión antes
  assert.strictEqual(boostPad.cooldown, 0, 'Boost pad debe estar activo inicialmente');

  track.checkPowerUpCollisions(car, null, null);

  // Verificaciones posteriores
  assert.ok(car.speed >= 290, `La velocidad debe haber aumentado notablemente (actual: ${car.speed.toFixed(1)})`);
  assert.ok(car.nitroFuel > 0.5, 'El combustible de nitro debe haberse recargado');
  assert.ok(car.boostPadTimer > 0, 'boostPadTimer debe haberse activado');
  assert.strictEqual(boostPad.cooldown, boostPad.maxCooldown, 'El boost pad debe haber entrado en cooldown');

  // En cooldown no se vuelve a activar inmediatamente
  const speedAfter = car.speed;
  track.checkPowerUpCollisions(car, null, null);
  assert.strictEqual(car.speed, speedAfter, 'No debe aplicar doble boost mientras esté en cooldown');
});

// ----------------------------------------------------------------------------
// 5. Mecánica de Mancha de Aceite (Oil Slick)
// ----------------------------------------------------------------------------
runTest('Mancha de Aceite frena el vehículo, induce giro incontrolado y reduce agarre', () => {
  const track = new Track(TRACKS_CATALOG[0]);
  const oilSlick = track.powerUps.find(p => p.type === 'OIL');
  assert.ok(oilSlick, 'Debe haber al menos una mancha de aceite en la pista 1');

  const car = new Car(oilSlick.x, oilSlick.y, 0, { isPlayer: true });
  car.speed = 260;
  car.vx = 260;
  car.vy = 0;

  assert.strictEqual(oilSlick.cooldown, 0, 'Mancha de aceite debe estar activa');

  track.checkPowerUpCollisions(car, null, null);

  // Verificaciones
  assert.ok(car.speed < 260, `El auto debe perder velocidad al patinar en aceite (actual: ${car.speed.toFixed(1)})`);
  assert.ok(car.oilSpinTimer > 0, 'oilSpinTimer debe haberse activado');
  assert.ok(Math.abs(car.angularVelocity) > 0, 'Debe inducir velocidad angular de giro involuntario');
  assert.strictEqual(oilSlick.cooldown, oilSlick.maxCooldown, 'La mancha de aceite debe entrar en cooldown');

  // Actualizar físicas mientras patina en aceite
  car.update(1 / 60, track);
  assert.strictEqual(car.isDrifting, true, 'El auto debe perder agarre y marcar derrape forzado');
});

// ----------------------------------------------------------------------------
// 6. Regeneración y Cooldown de Power-ups
// ----------------------------------------------------------------------------
runTest('updatePowerUps reduce cooldowns y reactiva los power-ups al completarse', () => {
  const track = new Track(TRACKS_CATALOG[0]);
  const pad = track.powerUps[0];
  pad.cooldown = 2.0;

  track.updatePowerUps(0.5);
  assert.strictEqual(Math.abs(pad.cooldown - 1.5) < 0.001, true, 'Cooldown debe decrementar con dt');

  track.updatePowerUps(1.6);
  assert.strictEqual(pad.cooldown <= 0, true, 'Cooldown debe quedar en 0 tras expirar');
});

// ----------------------------------------------------------------------------
// 7. Persistencia Independiente de Récords entre las 4 Pistas
// ----------------------------------------------------------------------------
runTest('getStoredBestLap y saveStoredBestLap manejan récords independientes por pista', () => {
  // Mock localStorage en entorno Node para pruebas
  const memoryStore = {};
  global.localStorage = {
    getItem: (key) => memoryStore[key] || null,
    setItem: (key, val) => { memoryStore[key] = String(val); }
  };

  saveStoredBestLap('pista_1', 25.40);
  saveStoredBestLap('pista_2', 31.85);
  saveStoredBestLap('pista_3', 28.12);
  saveStoredBestLap('pista_4', 36.90);

  assert.strictEqual(getStoredBestLap('pista_1'), 25.40, 'Récord de pista_1 debe ser 25.40');
  assert.strictEqual(getStoredBestLap('pista_2'), 31.85, 'Récord de pista_2 debe ser 31.85');
  assert.strictEqual(getStoredBestLap('pista_3'), 28.12, 'Récord de pista_3 debe ser 28.12');
  assert.strictEqual(getStoredBestLap('pista_4'), 36.90, 'Récord de pista_4 debe ser 36.90');

  // Mejorar récord solo en pista 1
  saveStoredBestLap('pista_1', 24.10);
  assert.strictEqual(getStoredBestLap('pista_1'), 24.10, 'Récord de pista_1 debe actualizarse si es menor');
  assert.strictEqual(getStoredBestLap('pista_2'), 31.85, 'Récord de pista_2 no debe alterarse');
});

// ----------------------------------------------------------------------------
// 8. Rivales IA interactúan con Power-ups
// ----------------------------------------------------------------------------
runTest('Los rivales IA también pueden beneficiarse de boost pads o sufrir aceite', () => {
  const track = new Track(TRACKS_CATALOG[1]); // Horquilla Marina
  const boostPad = track.powerUps.find(p => p.type === 'BOOST');
  const aiCar = new AICar(boostPad.x, boostPad.y, boostPad.angle, AI_PROFILES[0]);
  aiCar.speed = 180;

  track.checkPowerUpCollisions(aiCar, null, null);
  assert.ok(aiCar.speed >= 300, `La IA debe recibir impulso al pisar el turbo (velocidad: ${aiCar.speed.toFixed(1)})`);
  assert.ok(boostPad.cooldown > 0, 'El turbo pad debe quedar en cooldown tras ser pisado por la IA');
});

console.log(`\n==========================================================`);
console.log(`RESULTADO: ${testsPassed} / ${testsTotal} PRUEBAS SUPERADAS (${(testsPassed/testsTotal*100).toFixed(0)}%)`);
console.log(`==========================================================\n`);

if (testsPassed !== testsTotal) {
  process.exit(1);
}
