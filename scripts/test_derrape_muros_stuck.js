/**
 * scripts/test_derrape_muros_stuck.js
 * 
 * Batería exhaustiva de pruebas unitarias y de estrés para la física de barreras,
 * prevención de atascos y recuperación de vehículos en Derrape (Fase 5).
 * 
 * Cobertura:
 * 1. Miles de colisiones aleatorias contra barreras en todas las pistas (ángulos y velocidades variadas).
 * 2. Prevención de atravesamiento (tunneling) en choques frontales a máxima velocidad (420-500 px/s).
 * 3. Alineación tangencial con el muro ("raspe y salga") en curvas cerradas.
 * 4. Detección y recuperación automática tras aceleración sostenida perpendicular (>1.5 s).
 * 5. Maniobra de desatasco inteligente para rivales IA (marcha atrás y giro contra el muro).
 * 6. Acción manual "Volver a la pista" (botón de HUD / tecla R).
 * 7. Demostración del diagnóstico original (el atasco previo sin subpasos ni recuperación).
 */

const assert = require('assert');
const {
  CONFIG,
  Track,
  Car,
  AICar,
  AI_PROFILES,
  TRACKS_CATALOG
} = require('../games/derrape/game.js');

console.log('================================================================');
console.log('  SUITE DE PRUEBAS DE ESTRÉS: BARRERAS Y DESATASCO EN DERRAPE   ');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [OK] [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    console.error(err.stack);
  }
}

// Inicializar las 4 pistas del catálogo
const tracks = TRACKS_CATALOG.map(data => new Track(data));

// ============================================================================
// BLOQUE 1: REPRODUCCIÓN DEL DIAGNÓSTICO PREVIO Y RECUPERACIÓN SOSTENIDA
// ============================================================================
console.log('[BLOCK] BLOQUE 1: Diagnóstico de Atasco y Confirmación de Causa Raíz');

runTest('1.1 Confirmar que el vehículo pinned contra el muro activa la recuperación tras 1.5s', () => {
  const track = tracks[0];
  const sample = track.samples[15];
  const barrierDist = (track.width / 2) + CONFIG.BARRIER_MARGIN;

  // Auto perpendicular a la barrera, empujando a fondo con throttle = 1.0
  const wallNormAngle = Math.atan2(sample.normalY, sample.normalX);
  const car = new Car(
    sample.x + sample.normalX * (barrierDist - 2),
    sample.y + sample.normalY * (barrierDist - 2),
    wallNormAngle
  );

  let respawnTriggered = false;
  let respawnFrame = -1;

  for (let frame = 0; frame < 120; frame++) { // 2.0 segundos a 60 FPS
    car.inputThrottle = 1.0;
    car.inputSteer = 0;
    const res = car.update(1 / 60, track);
    if (res.respawned) {
      respawnTriggered = true;
      respawnFrame = frame;
      break;
    }
  }

  assert(respawnTriggered, 'La recuperación automática debió activarse dentro de 1.5 segundos');
  assert(respawnFrame >= 85 && respawnFrame <= 95, `El respawn debió ocurrir a ~90 frames (ocurrió en frame ${respawnFrame})`);
  assert.strictEqual(car.justRespawned, true, 'El auto debe marcar justRespawned');
  assert(car.invulnerableTimer > 1.0, 'Debe contar con invulnerabilidad temporal parpadeante');
  assert(car.speed >= 90, `Debe relanzarse con velocidad hacia adelante (speed=${car.speed})`);
});

// ============================================================================
// BLOQUE 2: MILES DE COLISIONES ALEATORIAS (ESTRÉS FÍSICO)
// ============================================================================
console.log('\n[BLOCK] BLOQUE 2: Miles de Colisiones Aleatorias y Sostenidas');

runTest('2.1 Simulación de 2,000 colisiones aleatorias contra barrera en todas las pistas', () => {
  let totalCollisionsTested = 2000;
  let tunnelingErrors = 0;
  let nanErrors = 0;
  let stuckWithoutRecovery = 0;

  for (let i = 0; i < totalCollisionsTested; i++) {
    const track = tracks[i % tracks.length];
    const n = track.samples.length;
    const sampleIdx = Math.floor(Math.random() * n);
    const sample = track.samples[sampleIdx];
    const barrierDist = (track.width / 2) + CONFIG.BARRIER_MARGIN;

    // Generar ángulos aleatorios respecto a la normal del muro (-80° a +80°)
    const wallNormAngle = Math.atan2(sample.normalY, sample.normalX);
    const approachAngle = wallNormAngle + (Math.random() - 0.5) * (Math.PI * 0.9);

    // Velocidades desde 60 px/s hasta velocidad nitro máxima de 500 px/s
    const speed = 60 + Math.random() * 440;

    const car = new Car(
      sample.x + sample.normalX * (barrierDist - 4),
      sample.y + sample.normalY * (barrierDist - 4),
      approachAngle
    );
    car.vx = Math.cos(approachAngle) * speed;
    car.vy = Math.sin(approachAngle) * speed;
    car.speed = speed;

    let escapedOrRecovered = false;
    for (let f = 0; f < 150; f++) {
      car.inputThrottle = 1.0;
      const res = car.update(1 / 60, track);

      if (isNaN(car.x) || isNaN(car.y) || isNaN(car.vx) || isNaN(car.vy)) {
        nanErrors++;
        break;
      }

      // Comprobar que no atraviesa la barrera hacia el exterior infinito
      const q = track.queryTrackPosition(car.x, car.y);
      if (q.distToCenter > barrierDist + 25) {
        tunnelingErrors++;
        break;
      }

      // El auto se despega de la barrera, o avanza con tracción a lo largo de la pista, o se recupera
      const isClear = (q.distToCenter + 14) < barrierDist - 2;
      const trackTanSpeed = car.vx * q.closestSample.tangentX + car.vy * q.closestSample.tangentY;
      const isDriving = car.speed > 35 && trackTanSpeed > 25;

      if (isClear || isDriving || res.respawned) {
        escapedOrRecovered = true;
        break;
      }
    }

    if (!escapedOrRecovered) {
      stuckWithoutRecovery++;
    }
  }

  assert.strictEqual(nanErrors, 0, `No debe haber valores NaN en la física (hubo ${nanErrors})`);
  assert.strictEqual(tunnelingErrors, 0, `Ningún vehículo debe atravesar las barreras (hubo ${tunnelingErrors})`);
  assert.strictEqual(stuckWithoutRecovery, 0, `Ningún vehículo debe quedar atascado sin escapar ni recuperarse (hubo ${stuckWithoutRecovery})`);
});

// ============================================================================
// BLOQUE 3: CHOQUES FRONTALES Y SUBPASOS FÍSICOS
// ============================================================================
console.log('\n[BLOCK] BLOQUE 3: Choques Frontales a Máxima Velocidad (Anti-Tunneling)');

runTest('3.1 Choque frontal a 420 px/s y 500 px/s contra la barrera', () => {
  const track = tracks[1]; // Pista 2 (Montaña)
  const sample = track.samples[40];
  const barrierDist = (track.width / 2) + CONFIG.BARRIER_MARGIN;

  const testSpeeds = [420, 500];

  for (const maxSpeed of testSpeeds) {
    const wallNormAngle = Math.atan2(sample.normalY, sample.normalX);
    const car = new Car(
      sample.x + sample.normalX * (barrierDist - 4),
      sample.y + sample.normalY * (barrierDist - 4),
      wallNormAngle
    );
    car.vx = Math.cos(wallNormAngle) * maxSpeed;
    car.vy = Math.sin(wallNormAngle) * maxSpeed;

    const res = car.update(1 / 60, track);

    // Debe registrar impacto de barrera con alta intensidad
    assert(res.barrierCollision, `Debe detectar colisión a ${maxSpeed} px/s`);
    assert(res.barrierCollision.intensity >= 0.8, 'La intensidad del choque frontal debe ser alta');

    // La posición debe mantenerse contenida dentro del radio de barrera
    const q = track.queryTrackPosition(car.x, car.y);
    assert(q.distToCenter <= barrierDist + 2, 'El auto no debe atravesar la barrera a alta velocidad');

    // La velocidad normal debe rebotar hacia afuera
    const vn = car.vx * res.barrierCollision.nx + car.vy * res.barrierCollision.ny;
    assert(vn >= CONFIG.MIN_BARRIER_BOUNCE_IMPULSE, `La velocidad de rebote normal debe ser positiva y >= impulso mínimo (vn=${vn})`);
  }
});

// ============================================================================
// BLOQUE 4: ALINEACIÓN EN CURVAS CERRADAS ("RASPE Y SALGA")
// ============================================================================
console.log('\n[BLOCK] BLOQUE 4: Alineación en Curvas Cerradas ("Raspe y Salga")');

runTest('4.1 Auto rozando en curva cerrada se alinea con la tangente del muro y no se clava', () => {
  const track = tracks[2]; // Pista 3 (Metrópolis / curvas cerradas)
  const sample = track.samples[75];
  const barrierDist = (track.width / 2) + CONFIG.BARRIER_MARGIN;

  const wallTanAngle = Math.atan2(sample.tangentY, sample.tangentX);
  // Aproximación con raspado oblicuo (a 30 grados de la pared)
  const approachAngle = wallTanAngle + (Math.PI / 6);

  const car = new Car(
    sample.x + sample.normalX * (barrierDist - 2),
    sample.y + sample.normalY * (barrierDist - 2),
    approachAngle
  );
  car.inputThrottle = 1.0;
  car.speed = 220;
  car.vx = Math.cos(approachAngle) * 220;
  car.vy = Math.sin(approachAngle) * 220;

  // Ejecutar 15 frames de fricción
  for (let f = 0; f < 15; f++) {
    car.update(1 / 60, track);
  }

  // El ángulo del auto debe haberse alineado más cerca de la tangente del muro
  let diffWithWall = Math.abs(car.angle - wallTanAngle);
  while (diffWithWall > Math.PI) diffWithWall -= Math.PI * 2;
  diffWithWall = Math.abs(diffWithWall);

  assert(diffWithWall < Math.PI / 6, 'El auto debe alinearse más cerca de la tangente de la pared');
  assert(car.speed > 50, `El auto debe conservar velocidad tangencial de salida (speed=${car.speed})`);
});

// ============================================================================
// BLOQUE 5: DESATASCO DE RIVALES DE IA
// ============================================================================
console.log('\n[BLOCK] BLOQUE 5: Rutina de Desatasco de Rivales IA');

runTest('5.1 100 rivales de IA contra la barrera aplican marcha atrás / giro o respawn', () => {
  let aiEscapedCount = 0;

  for (let i = 0; i < 100; i++) {
    const track = tracks[i % tracks.length];
    const profile = AI_PROFILES[i % AI_PROFILES.length];
    const n = track.samples.length;
    const sample = track.samples[(i * 17) % n];
    const barrierDist = (track.width / 2) + CONFIG.BARRIER_MARGIN;

    // Colocar rival IA mirando hacia la barrera
    const wallNormAngle = Math.atan2(sample.normalY, sample.normalX);
    const ai = new AICar(
      sample.x + sample.normalX * (barrierDist - 2),
      sample.y + sample.normalY * (barrierDist - 2),
      wallNormAngle,
      profile
    );

    // Simular 150 frames (2.5 segundos)
    let escaped = false;
    for (let f = 0; f < 150; f++) {
      ai.updateAI(1 / 60, track, null, [ai]);
      ai.update(1 / 60, track);

      const q = track.queryTrackPosition(ai.x, ai.y);
      const isAwayFromWall = (q.distToCenter + 14) < barrierDist - 10;
      const isMovingForward = ai.speed > 30;

      if (isAwayFromWall && isMovingForward) {
        escaped = true;
        break;
      }
    }

    if (escaped) {
      aiEscapedCount++;
    }
  }

  assert.strictEqual(aiEscapedCount, 100, `Todos los rivales IA deben poder desatascarse o recolocarse (salieron ${aiEscapedCount}/100)`);
});

// ============================================================================
// BLOQUE 6: BOTÓN MANUAL "VOLVER A LA PISTA" (HUD / TECLA R)
// ============================================================================
console.log('\n[BLOCK] BLOQUE 6: Botón Manual "Volver a la pista" y Atajo de Teclado');

runTest('6.1 Invocación manual de respawnOnTrack(track, true) recoloca en el último checkpoint', () => {
  const track = tracks[0];
  const car = new Car(9999, 9999, 0); // Posición fuera de pista
  car.nextCheckpoint = 3;

  const result = car.respawnOnTrack(track, true);

  assert.strictEqual(result.respawned, true, 'Debe confirmar respawn');
  assert.strictEqual(result.manual, true, 'Debe indicar que fue manual');
  assert.strictEqual(result.penalty, CONFIG.RESPAWN_TIME_PENALTY, 'Debe reportar penalización');

  const cp = track.checkpoints[2]; // Último checkpoint válido (3 - 1 = 2)
  assert.strictEqual(car.x, cp.x, 'Debe situarse en la X del checkpoint 2');
  assert.strictEqual(car.y, cp.y, 'Debe situarse en la Y del checkpoint 2');
  assert(car.speed >= 90, 'Debe tener velocidad de relanzamiento positiva');
  assert.strictEqual(car.invulnerableTimer, 1.5, 'Debe tener 1.5s de invulnerabilidad');
  assert.strictEqual(car.stuckTimer, 0, 'Debe reiniciar stuckTimer');
});

// ============================================================================
// RESUMEN FINAL
// ============================================================================
console.log('\n================================================================');
console.log(`RESULTADO FINAL DE PRUEBAS DE ESTRÉS DERRAPE: ${passedTests} / ${totalTests} SUPERADAS`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
