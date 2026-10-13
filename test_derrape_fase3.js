// test_derrape_fase3.js
// Pruebas unitarias automatizadas para la Fase 3 del juego Derrape:
// - Parrilla de salida escalonada (2x2)
// - Perfiles de rivales IA (Vórtice, Fantasma, Centella)
// - Navegación IA: Lookahead, dirección y frenado ante curvatura
// - Evasión de autos cercanos por IA
// - Rubber-banding sutil competitivo
// - Colisiones elásticas entre autos (separación e intercambio de impulso)
// - Clasificación y posiciones en vivo (1° a 4°) con adelantamientos

const assert = require('assert');
const {
  CONFIG,
  Track,
  Car,
  AICar,
  AI_PROFILES,
  PLAYER_PROFILE,
  TRACK_DATA_PISTA_1,
  resolveCarCollisions,
  updateRaceRankings
} = require('./games/derrape/game.js');

let testsPassed = 0;
let testsTotal = 0;

function runTest(name, fn) {
  testsTotal++;
  try {
    fn();
    console.log(`  ✓ [PASSED] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ [FAILED] ${name}`);
    console.error(`    ${err.message}`);
  }
}

console.log('\n==========================================================');
console.log('   PRUEBAS AUTOMATIZADAS: FASE 3 (RIVALES IA Y COLISIONES)');
console.log('==========================================================\n');

const track = new Track(TRACK_DATA_PISTA_1);

// ----------------------------------------------------------------------------
// 1. Parrilla de Salida (Starting Grid)
// ----------------------------------------------------------------------------
runTest('Parrilla de salida genera 4 slots escalonados sin solapamiento', () => {
  const grid = track.getStartingGrid(4);
  assert.strictEqual(grid.length, 4, 'Deben generarse exactamente 4 posiciones de salida');

  // Verificar que todas las posiciones estén bien separadas entre sí
  for (let i = 0; i < grid.length; i++) {
    for (let j = i + 1; j < grid.length; j++) {
      const dist = Math.hypot(grid[i].x - grid[j].x, grid[i].y - grid[j].y);
      assert.ok(dist >= 35, `Los slots ${i} y ${j} están demasiado juntos (${dist.toFixed(1)}px)`);
    }
  }

  // Verificar que estén orientados en el sentido de la pista
  const sample0 = track.samples[0];
  const expectedAngle = Math.atan2(sample0.tangentY, sample0.tangentX);
  for (let i = 0; i < grid.length; i++) {
    assert.strictEqual(Math.abs(grid[i].angle - expectedAngle) < 0.001, true, `El slot ${i} debe mirar al frente de la pista`);
  }
});

// ----------------------------------------------------------------------------
// 2. Perfiles y Creación de Rivales IA
// ----------------------------------------------------------------------------
runTest('Los perfiles de IA tienen identidades, colores y habilidades diferenciadas', () => {
  assert.strictEqual(AI_PROFILES.length, 3, 'Deben existir 3 perfiles de IA rivales');
  const names = AI_PROFILES.map(p => p.name);
  assert.ok(names.includes('VÓRTICE'), 'Debe incluir a VÓRTICE');
  assert.ok(names.includes('FANTASMA'), 'Debe incluir a FANTASMA');
  assert.ok(names.includes('CENTELLA'), 'Debe incluir a CENTELLA');

  // Verificar creación de AICar
  const grid = track.getStartingGrid(4);
  const ai1 = new AICar(grid[0].x, grid[0].y, grid[0].angle, AI_PROFILES[0]);
  assert.strictEqual(ai1.isAI, true, 'isAI debe ser true');
  assert.strictEqual(ai1.name, 'VÓRTICE');
  assert.strictEqual(ai1.color, AI_PROFILES[0].color);
  assert.ok(ai1 instanceof Car, 'AICar debe heredar de Car');
});

// ----------------------------------------------------------------------------
// 3. Lookahead y Dirección de la IA
// ----------------------------------------------------------------------------
runTest('La IA calcula dirección hacia el punto anticipado (lookahead)', () => {
  const s0 = track.samples[0];
  const ai = new AICar(s0.x, s0.y, Math.atan2(s0.tangentY, s0.tangentX), AI_PROFILES[0]);
  ai.speed = 200;

  // Actualizar IA
  ai.updateAI(1 / 60, track, null, [ai]);

  // Debe acelerar y el input de dirección debe ser válido [-1, 1]
  assert.ok(ai.inputThrottle >= 0 && ai.inputThrottle <= 1, 'Throttle debe estar entre 0 y 1');
  assert.ok(ai.inputSteer >= -1 && ai.inputSteer <= 1, 'Steer debe estar acotado entre -1 y 1');
  assert.strictEqual(Number.isNaN(ai.inputSteer), false, 'Steer no puede ser NaN');
});

// ----------------------------------------------------------------------------
// 4. Adaptación de Velocidad de la IA ante Curvatura de Pista
// ----------------------------------------------------------------------------
runTest('La IA frena o reduce gas al aproximarse a curvas cerradas', () => {
  // Buscar la muestra con mayor curvatura en la pista
  let maxCurveIdx = 0;
  let maxCurveVal = 0;
  track.samples.forEach((s, idx) => {
    if (s.curvature > maxCurveVal) {
      maxCurveVal = s.curvature;
      maxCurveIdx = idx;
    }
  });

  // Colocar a la IA justo antes de la curva cerrada y con velocidad alta
  const n = track.samples.length;
  const beforeCurveIdx = (maxCurveIdx - 6 + n) % n;
  const sCurve = track.samples[beforeCurveIdx];

  const ai = new AICar(sCurve.x, sCurve.y, Math.atan2(sCurve.tangentY, sCurve.tangentX), AI_PROFILES[0]);
  ai.speed = 360; // Velocidad excesiva para entrar a curva cerrada

  ai.updateAI(1 / 60, track, null, [ai]);

  // Ante curva cerrada a alta velocidad, la IA debe frenar para evitar salirse
  assert.ok(ai.inputBrake > 0, `La IA debería accionar el freno ante curva peligrosa (inputBrake=${ai.inputBrake.toFixed(2)})`);
  assert.strictEqual(ai.inputThrottle, 0, 'La IA debería soltar el acelerador');
});

// ----------------------------------------------------------------------------
// 5. Esquive de Vehículos Vecinos por la IA
// ----------------------------------------------------------------------------
runTest('La IA aplica desviación lateral para esquivar autos adelante', () => {
  const s = track.samples[20];
  const fwdAngle = Math.atan2(s.tangentY, s.tangentX);

  const ai = new AICar(s.x, s.y, fwdAngle, AI_PROFILES[2]); // CENTELLA (carril central 0)
  ai.speed = 180;

  // Colocar otro auto directamente 35px adelante y ligeramente a la derecha
  const obstacleCar = new Car(
    s.x + Math.cos(fwdAngle) * 35 - Math.sin(fwdAngle) * 5,
    s.y + Math.sin(fwdAngle) * 35 + Math.cos(fwdAngle) * 5,
    fwdAngle
  );

  ai.updateAI(1 / 60, track, null, [ai, obstacleCar]);

  // Al tener un obstáculo al frente derecho, debe desviar su trayectoria (inputSteer distinto de 0)
  assert.ok(Math.abs(ai.inputSteer) > 0.05, 'La IA debe maniobrar para esquivar el vehículo adelante');
});

// ----------------------------------------------------------------------------
// 6. Rubber Banding Sutil
// ----------------------------------------------------------------------------
runTest('El rubber banding modula la velocidad de la IA para carreras cerradas', () => {
  const s = track.samples[10];
  const angle = Math.atan2(s.tangentY, s.tangentX);

  const aiLeader = new AICar(s.x, s.y, angle, AI_PROFILES[0]);
  aiLeader.currentLap = 2;
  aiLeader.speed = 250;

  const playerChasing = new Car(s.x, s.y, angle);
  playerChasing.currentLap = 1; // Jugador va una vuelta o mucha distancia atrás

  // Probar líder muy adelantado
  aiLeader.updateAI(1 / 60, track, playerChasing, [aiLeader, playerChasing]);
  // Debe regular velocidad sin detenerse (entre 0.88 y 1.0)
  assert.ok(aiLeader.speedMult * 0.88 <= 1.0, 'Factor de rubber band no debe romper la física');

  // Probar rival rezagado
  const aiBehind = new AICar(s.x, s.y, angle, AI_PROFILES[1]);
  aiBehind.currentLap = 1;
  const playerAhead = new Car(s.x, s.y, angle);
  playerAhead.currentLap = 2;

  aiBehind.updateAI(1 / 60, track, playerAhead, [aiBehind, playerAhead]);
  // Rival rezagado mantiene acelerador al 100%
  assert.strictEqual(aiBehind.inputThrottle, 1, 'Rival rezagado debe acelerar a fondo');
});

// ----------------------------------------------------------------------------
// 7. Colisiones Elásticas Auto contra Auto
// ----------------------------------------------------------------------------
runTest('Colisión entre autos genera separación espacial y transferencia de velocidad', () => {
  const carA = new Car(100, 100, 0);
  const carB = new Car(116, 100, 0); // Separación de 16px (menor al diámetro mínimo de 28px)

  carA.vx = 150; // Auto A avanza hacia B
  carA.vy = 0;
  carB.vx = 20;  // Auto B más lento adelante
  carB.vy = 0;

  const initialDist = Math.hypot(carB.x - carA.x, carB.y - carA.y);
  assert.ok(initialDist < 28, 'Autos deben estar solapados antes de resolver');

  // Resolver colisión
  resolveCarCollisions([carA, carB], carA, null, null);

  const finalDist = Math.hypot(carB.x - carA.x, carB.y - carA.y);
  assert.ok(finalDist >= 27.9, `Los autos deben separarse espacialmente (distancia final: ${finalDist.toFixed(2)}px)`);

  // Auto A debe haber frenado por el impacto y Auto B debe haber sido empujado hacia adelante
  assert.ok(carA.vx < 150, `Auto A debe perder velocidad por impacto (vx: ${carA.vx.toFixed(1)})`);
  assert.ok(carB.vx > 20, `Auto B debe ganar velocidad por empujón (vx: ${carB.vx.toFixed(1)})`);
});

// ----------------------------------------------------------------------------
// 8. Cálculo de Clasificación y Posiciones en Vivo (1° a 4°)
// ----------------------------------------------------------------------------
runTest('updateRaceRankings ordena correctamente a los 4 corredores', () => {
  const s0 = track.samples[0];
  const s50 = track.samples[50];
  const s100 = track.samples[100];
  const s150 = track.samples[150];

  const car1 = new Car(s150.x, s150.y, 0, { name: 'LÍDER' });
  car1.currentLap = 2;

  const car2 = new Car(s100.x, s100.y, 0, { name: 'SEGUNDO' });
  car2.currentLap = 2;

  const car3 = new Car(s50.x, s50.y, 0, { name: 'TERCERO' });
  car3.currentLap = 2;

  const car4 = new Car(s0.x, s0.y, 0, { name: 'CUARTO' });
  car4.currentLap = 1;

  const allCars = [car4, car2, car1, car3]; // Mezclados
  updateRaceRankings(allCars, track);

  assert.strictEqual(car1.rank, 1, 'car1 debe ser 1°');
  assert.strictEqual(car2.rank, 2, 'car2 debe ser 2°');
  assert.strictEqual(car3.rank, 3, 'car3 debe ser 3°');
  assert.strictEqual(car4.rank, 4, 'car4 debe ser 4°');

  // Simular adelantamiento: car4 avanza a la vuelta 3
  car4.currentLap = 3;
  updateRaceRankings(allCars, track);
  assert.strictEqual(car4.rank, 1, 'car4 debe subir al 1° lugar tras adelantar');
  assert.strictEqual(car1.rank, 2, 'car1 debe bajar al 2° lugar');
});

// ----------------------------------------------------------------------------
// 9. Autos Finalizados Aseguran su Puesto en Podio
// ----------------------------------------------------------------------------
runTest('Autos que cruzan la meta primero retienen su posición final sobre los rezagados', () => {
  const carWinner = new Car(0, 0, 0, { name: 'GANADOR' });
  carWinner.finished = true;
  carWinner.finishTime = 65.4; // 1 min 5 seg

  const carSecond = new Car(0, 0, 0, { name: 'SUB-CAMPEÓN' });
  carSecond.finished = true;
  carSecond.finishTime = 68.2;

  const carStillRacing = new Car(track.samples[100].x, track.samples[100].y, 0, { name: 'REZAGADO' });
  carStillRacing.finished = false;
  carStillRacing.currentLap = 3;

  const cars = [carStillRacing, carSecond, carWinner];
  updateRaceRankings(cars, track);

  assert.strictEqual(carWinner.rank, 1, 'El primer finalizado debe ser 1°');
  assert.strictEqual(carSecond.rank, 2, 'El segundo finalizado debe ser 2°');
  assert.strictEqual(carStillRacing.rank, 3, 'El auto que aún corre debe quedar detrás de los finalizados');
});

// ----------------------------------------------------------------------------
// 10. Posiciones Iniciales en Parrilla (Parrilla de salida Fase 3)
// ----------------------------------------------------------------------------
runTest('Parrilla de salida inicializa a los rivales 1°, 2°, 3° y al jugador 4°', () => {
  const grid = track.getStartingGrid(4);
  const aiCars = AI_PROFILES.map((p, i) => new AICar(grid[i].x, grid[i].y, grid[i].angle, p));
  const player = new Car(grid[3].x, grid[3].y, grid[3].angle, { name: 'TÚ', isPlayer: true });

  const allCars = [...aiCars, player];
  updateRaceRankings(allCars, track);

  assert.strictEqual(player.rank, 4, 'El jugador debe iniciar en 4° posición en la parrilla');
  assert.ok(aiCars.every(ai => ai.rank >= 1 && ai.rank <= 3), 'Los rivales deben ocupar los puestos 1 a 3');
});

console.log(`\n==========================================================`);
console.log(`RESULTADO: ${testsPassed} / ${testsTotal} PRUEBAS SUPERADAS (${(testsPassed/testsTotal*100).toFixed(0)}%)`);
console.log(`==========================================================\n`);

if (testsPassed !== testsTotal) {
  process.exit(1);
}
