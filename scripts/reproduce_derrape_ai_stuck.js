/**
 * scripts/reproduce_derrape_ai_stuck.js
 * Reproduce el atasco de un rival IA contra el muro en el código actual de Derrape.
 */

const { Track, AICar, AI_PROFILES, TRACK_DATA_PISTA_1 } = require('../games/derrape/game.js');

console.log('--- REPRODUCIENDO ATASCO DE RIVAL IA (CÓDIGO ACTUAL) ---');

const track = new Track(TRACK_DATA_PISTA_1);
const sample = track.samples[10];
const barrierDist = (track.width / 2) + 42;

// Colocar rival IA junto a la barrera orientado hacia el muro
const aiCar = new AICar(
  sample.x + sample.normalX * (barrierDist - 4),
  sample.y + sample.normalY * (barrierDist - 4),
  Math.atan2(sample.normalY, sample.normalX),
  AI_PROFILES[0]
);

let stuckFrames = 0;
for (let f = 0; f < 180; f++) { // 3 segundos
  aiCar.updateAI(1 / 60, track, null, [aiCar]);
  aiCar.update(1 / 60, track);

  const query = track.queryTrackPosition(aiCar.x, aiCar.y);
  const isNearBarrier = (query.distToCenter + 14) >= barrierDist - 1;
  const hasLowSpeed = Math.abs(aiCar.speed) < 25;
  if (isNearBarrier && hasLowSpeed) {
    stuckFrames++;
  }
}

console.log(`Rival IA: ${stuckFrames} / 180 frames atascado (${(stuckFrames / 60).toFixed(2)}s)`);
console.log('Velocidad final IA:', aiCar.speed.toFixed(2), 'inputThrottle:', aiCar.inputThrottle, 'inputBrake:', aiCar.inputBrake);

if (stuckFrames > 120) {
  console.log('[FAIL] BUG CONFIRMADO: El rival IA no tiene rutina de marcha atrás ni escape y queda trabado.');
} else {
  console.log('Rival IA logró salir.');
}
