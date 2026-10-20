/**
 * scripts/reproduce_derrape_stuck.js
 * Reproduce el atasco contra los muros en el código actual de Derrape.
 */

const assert = require('assert');
const { Track, Car, TRACK_DATA_PISTA_1 } = require('../games/derrape/game.js');

console.log('--- REPRODUCIENDO BUG DE ATASCO EN MURO (CÓDIGO ACTUAL) ---');

const track = new Track(TRACK_DATA_PISTA_1);
const sample = track.samples[10];
const barrierDist = (track.width / 2) + 42; // BARRIER_MARGIN = 42

// Posicionar el auto junto a la barrera, apuntando hacia afuera contra el muro
const car = new Car(
  sample.x + sample.normalX * (barrierDist - 2),
  sample.y + sample.normalY * (barrierDist - 2),
  Math.atan2(sample.normalY, sample.normalX) // apuntando directamente hacia el muro
);

console.log('Posición inicial del auto:', { x: car.x.toFixed(1), y: car.y.toFixed(1), angle: car.angle.toFixed(2) });

// El jugador mantiene presionado el acelerador a fondo hacia el muro durante 2 segundos (120 frames a 60 FPS)
let stuckFrames = 0;
let totalFrames = 120;

for (let frame = 0; frame < totalFrames; frame++) {
  car.inputThrottle = 1.0;
  car.inputSteer = 0;
  const res = car.update(1 / 60, track);

  const query = track.queryTrackPosition(car.x, car.y);
  const isNearBarrier = (query.distToCenter + 14) >= barrierDist - 1;
  const hasLowSpeed = Math.abs(car.speed) < 25;

  if (isNearBarrier && hasLowSpeed) {
    stuckFrames++;
  }
}

console.log(`Frames atascado rozando la barrera sin poder avanzar: ${stuckFrames} / ${totalFrames} (${(stuckFrames / 60).toFixed(2)}s)`);
console.log('Velocidad final del auto:', car.speed.toFixed(2), 'vx:', car.vx.toFixed(2), 'vy:', car.vy.toFixed(2));

if (stuckFrames > 60) {
  console.log('[FAIL] BUG CONFIRMADO: El auto queda atrapado/vibrando contra la barrera por más de 1 segundo sin poder salir ni recuperarse.');
} else {
  console.log('Auto logró escapar.');
}
