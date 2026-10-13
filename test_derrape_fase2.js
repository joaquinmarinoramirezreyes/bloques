/**
 * Test Suite Fase 2 - DERRAPE
 * 
 * Verificaciones:
 * 1. Geometría de puntos de control (Checkpoints)
 * 2. Detección de vueltas legítimas y protección anti-trampas
 * 3. Colisiones con barreras de contención y delimitación de mapa
 * 4. Tiempos de vuelta y formateo de récord
 */

const assert = require('assert');

// Mock localStorage para Node.js
const mockStorage = {};
global.localStorage = {
  getItem: (k) => (k in mockStorage ? mockStorage[k] : null),
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

// Cargar módulos del juego
const {
  CONFIG,
  Track,
  Car,
  TRACK_DATA_PISTA_1,
  formatTime,
  getStoredBestLap,
  saveStoredBestLap
} = require('./games/derrape/game.js');

console.log('🏁 INICIANDO PRUEBAS UNITARIAS FASE 2: DERRAPE\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    console.error(err.stack);
  }
}

// ============================================================================
// 1. GEOMETRÍA DE PISTAS Y PUNTOS DE CONTROL
// ============================================================================
console.log('📌 BLOQUE 1: Geometría de Pistas y Puntos de Control');

const track = new Track(TRACK_DATA_PISTA_1);

runTest('1.1 Generación de 12 puntos de control distribuidos', () => {
  assert.strictEqual(track.checkpoints.length, 12, 'Deben existir 12 checkpoints');
  assert.strictEqual(track.checkpoints[0].index, 0, 'Checkpoint 0 debe ser la Meta');
  assert.strictEqual(track.checkpoints[0].sampleIndex, 0, 'Checkpoint 0 debe coincidir con muestra 0');

  for (let i = 0; i < track.checkpoints.length; i++) {
    const cp = track.checkpoints[i];
    assert(Number.isFinite(cp.x) && Number.isFinite(cp.y), `CP ${i} debe tener coordenadas finitas`);
    const tLen = Math.hypot(cp.tangentX, cp.tangentY);
    const nLen = Math.hypot(cp.normalX, cp.normalY);
    assert(Math.abs(tLen - 1) < 0.01, `CP ${i} tangente debe ser unitaria`);
    assert(Math.abs(nLen - 1) < 0.01, `CP ${i} normal debe ser unitaria`);
    assert(cp.radius > track.width / 2, `Radio de detección de CP ${i} debe cubrir el ancho de pista`);
  }
});

runTest('1.2 Delimitación de dimensiones y bounds de la pista', () => {
  const b = track.bounds;
  assert(b.width > 1000, 'El ancho del recinto debe ser mayor a 1000px');
  assert(b.height > 1000, 'La altura del recinto debe ser mayor a 1000px');
  assert(b.maxX > b.minX, 'maxX debe ser mayor a minX');
  assert(b.maxY > b.minY, 'maxY debe ser mayor a minY');
});

// ============================================================================
// 2. DETECCIÓN DE VUELTAS Y PROTECCIÓN ANTI-TRAMPAS
// ============================================================================
console.log('\n📌 BLOQUE 2: Sistema de Vueltas y Protección Anti-Trampas');

/**
 * Función que simula el avance de un auto a través de checkpoints
 */
function simulateCheckpointTrigger(car, track, raceTime) {
  const curNextIdx = car.nextCheckpoint;
  const targetCp = track.checkpoints[curNextIdx];
  const distToCp = Math.hypot(car.x - targetCp.x, car.y - targetCp.y);

  if (distToCp < targetCp.radius) {
    if (curNextIdx === 0) {
      const lapDuration = raceTime - car.lapStartTime;
      car.lapTimes.push(lapDuration);

      if (!car.bestLapTime || lapDuration < car.bestLapTime) {
        car.bestLapTime = lapDuration;
        saveStoredBestLap(track.data.id, lapDuration);
      }

      car.currentLap++;
      car.lapStartTime = raceTime;
      car.checkpointsPassed = 0;
      car.nextCheckpoint = 1;

      if (car.currentLap > CONFIG.LAPS) {
        car.finished = true;
      }
      return { lapCompleted: true, lapDuration };
    } else {
      car.checkpointsPassed++;
      car.nextCheckpoint = (car.nextCheckpoint + 1) % track.checkpoints.length;
      return { checkpointHit: curNextIdx };
    }
  }
  return null;
}

runTest('2.1 Carrera limpia de 3 vueltas en orden secuencial', () => {
  const car = new Car(track.startPos.x, track.startPos.y, track.startPos.angle);
  assert.strictEqual(car.currentLap, 1, 'Inicia en vuelta 1');
  assert.strictEqual(car.nextCheckpoint, 1, 'El primer punto requerido debe ser CP 1 (no meta)');
  assert.strictEqual(car.finished, false, 'No debe estar terminada');

  let simTime = 0;

  // Realizar 3 vueltas completas
  for (let lap = 1; lap <= 3; lap++) {
    // Pasar por CP 1 .. CP 11
    for (let cpIdx = 1; cpIdx <= 11; cpIdx++) {
      const cp = track.checkpoints[cpIdx];
      car.x = cp.x;
      car.y = cp.y;
      simTime += 2.0;
      const res = simulateCheckpointTrigger(car, track, simTime);
      assert(res && res.checkpointHit === cpIdx, `Debe validar CP ${cpIdx}`);
    }

    assert.strictEqual(car.nextCheckpoint, 0, 'Tras pasar CP 11, el siguiente debe ser la Meta (CP 0)');

    // Cruzar la Meta (CP 0)
    const meta = track.checkpoints[0];
    car.x = meta.x;
    car.y = meta.y;
    simTime += 2.0;
    const metaRes = simulateCheckpointTrigger(car, track, simTime);
    assert(metaRes && metaRes.lapCompleted, `Debe completar la vuelta ${lap}`);
    assert.strictEqual(car.lapTimes.length, lap, `Debe haber ${lap} vueltas registradas`);
    assert.strictEqual(car.nextCheckpoint, 1, 'Tras la meta, el siguiente checkpoint requerido debe volver a ser CP 1');
  }

  assert.strictEqual(car.currentLap, 4, 'Al completar 3 vueltas, currentLap debe ser 4 (> 3)');
  assert.strictEqual(car.finished, true, 'La carrera debe marcarse como terminada');
});

runTest('2.2 Anti-trampas: Conducir en reversa sobre la meta no cuenta vuelta', () => {
  const car = new Car(track.startPos.x, track.startPos.y, track.startPos.angle);
  const meta = track.checkpoints[0];

  // El auto está en la meta y se mueve en reversa o atraviesa la meta
  car.x = meta.x;
  car.y = meta.y;

  // Como nextCheckpoint es 1, tocar la meta (CP 0) NO debe registrar vuelta
  const res = simulateCheckpointTrigger(car, track, 10.0);
  assert.strictEqual(res, null, 'No debe registrar nada al pasar por la meta sin los puntos intermedios');
  assert.strictEqual(car.currentLap, 1, 'Debe seguir en vuelta 1');
  assert.strictEqual(car.lapTimes.length, 0, 'No debe registrar tiempo de vuelta');
  assert.strictEqual(car.nextCheckpoint, 1, 'Sigue requiriendo CP 1');
});

runTest('2.3 Anti-trampas: Saltarse puntos de control cortando por el césped no cuenta vuelta', () => {
  const car = new Car(track.startPos.x, track.startPos.y, track.startPos.angle);

  // Visita CP 1 legítimamente
  const cp1 = track.checkpoints[1];
  car.x = cp1.x;
  car.y = cp1.y;
  simulateCheckpointTrigger(car, track, 2.0);
  assert.strictEqual(car.nextCheckpoint, 2, 'Requiere CP 2');

  // Ahora corta camino atravesando el césped directamente hacia CP 10 y luego la Meta
  const cp10 = track.checkpoints[10];
  car.x = cp10.x;
  car.y = cp10.y;
  const skipRes = simulateCheckpointTrigger(car, track, 5.0);
  assert.strictEqual(skipRes, null, 'CP 10 no debe registrarse porque el auto debía pasar por CP 2');
  assert.strictEqual(car.nextCheckpoint, 2, 'Sigue requiriendo CP 2');

  // Llega a la meta
  const meta = track.checkpoints[0];
  car.x = meta.x;
  car.y = meta.y;
  const metaRes = simulateCheckpointTrigger(car, track, 7.0);
  assert.strictEqual(metaRes, null, 'La meta no debe contar como vuelta');
  assert.strictEqual(car.currentLap, 1, 'Sigue en vuelta 1');
  assert.strictEqual(car.lapTimes.length, 0, 'No se registró vuelta');
});

// ============================================================================
// 3. COLISIONES CON BORDES Y DELIMITACIÓN DEL MAPA
// ============================================================================
console.log('\n📌 BLOQUE 3: Colisiones con Bordes y Delimitación');

runTest('3.1 Auto dentro de pista no genera colisión con barrera', () => {
  const car = new Car(track.startPos.x, track.startPos.y, track.startPos.angle);
  const res = car.update(1 / 60, track);
  assert.strictEqual(res.barrierCollision, null, 'No debe haber colisión en el centro de la pista');
});

runTest('3.2 Auto contra barrera de contención rebota y pierde velocidad', () => {
  const car = new Car(track.startPos.x, track.startPos.y, track.startPos.angle);
  const sample = track.samples[0];
  const barrierDist = (track.width / 2) + CONFIG.BARRIER_MARGIN;

  // Posicionar el auto justo más allá de la barrera con velocidad hacia afuera
  car.x = sample.x + sample.normalX * (barrierDist + 15);
  car.y = sample.y + sample.normalY * (barrierDist + 15);
  car.vx = sample.normalX * 200; // Velocidad moviéndose hacia afuera
  car.vy = sample.normalY * 200;

  const res = car.update(1 / 60, track);

  assert(res.barrierCollision !== null, 'Debe detectar colisión con la barrera');
  assert(res.barrierCollision.intensity > 0, 'La intensidad del choque debe ser positiva');

  // Verificar que el auto fue empujado hacia adentro
  const newQuery = track.queryTrackPosition(car.x, car.y);
  assert(newQuery.distToCenter <= barrierDist + 2, 'El auto debe ser corregido dentro del límite de la barrera');

  // Verificar que la velocidad normal fue invertida (rebote)
  const dotVelNormal = car.vx * sample.normalX + car.vy * sample.normalY;
  assert(dotVelNormal <= 0, 'La velocidad hacia afuera debe haberse invertido hacia adentro');
});

runTest('3.3 Delimitación perimetral del mapa exterior', () => {
  const car = new Car(0, 0, 0);
  const b = track.bounds;

  // Intentar colocar el auto fuera del mundo (hacia el oeste)
  car.x = b.minX - 500;
  car.y = b.minY;
  car.vx = -300;
  car.vy = 0;

  car.update(1 / 60, track);

  // Debe haber sido confinado al borde del recinto
  assert(car.x >= b.minX + 35, `El auto debe estar confinado al recinto (x=${car.x}, minX=${b.minX})`);
  assert(car.vx >= 0, 'La velocidad horizontal debe haber sido reorientada hacia el interior');
});

// ============================================================================
// 4. TIEMPOS Y RÉCORD
// ============================================================================
console.log('\n📌 BLOQUE 4: Tiempos y Récords');

runTest('4.1 Formateo de tiempos de vuelta', () => {
  assert.strictEqual(formatTime(0), '00:00.0');
  assert.strictEqual(formatTime(24.5), '00:24.5');
  assert.strictEqual(formatTime(65.2), '01:05.2');
  assert.strictEqual(formatTime(132.8), '02:12.8');
  assert.strictEqual(formatTime(null), '--:--.-');
});

runTest('4.2 Persistencia de mejor récord de vuelta', () => {
  localStorage.clear();
  const trackId = 'pista_1';

  assert.strictEqual(getStoredBestLap(trackId), null, 'Inicialmente no hay récord');

  // Guardar primera vuelta (25.5s)
  saveStoredBestLap(trackId, 25.5);
  assert.strictEqual(getStoredBestLap(trackId), 25.5, 'Debe guardar 25.5s');

  // Guardar vuelta más lenta (27.1s) -> no debe sobrescribir
  saveStoredBestLap(trackId, 27.1);
  assert.strictEqual(getStoredBestLap(trackId), 25.5, 'Vuelta más lenta no debe sobrescribir');

  // Guardar vuelta más rápida (23.8s) -> debe sobrescribir
  saveStoredBestLap(trackId, 23.8);
  assert.strictEqual(getStoredBestLap(trackId), 23.8, 'Vuelta más rápida debe actualizar el récord');
});

// ============================================================================
// RESUMEN FINAL
// ============================================================================
console.log(`\n========================================`);
console.log(`RESULTADO DE PRUEBAS FASE 2: ${passedTests}/${totalTests} PASADAS`);
console.log(`========================================\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
