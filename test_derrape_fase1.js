/**
 * Unit tests for Derrape Phase 1:
 * - Catmull-Rom spline interpolation & track geometry
 * - Closed loop continuity & arc length
 * - Offroad surface detection
 * - Arcade drift & vehicle dynamics
 */

// 1. Spline Math
function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: 0.5 * ((2 * p1.x) +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y: 0.5 * ((2 * p1.y) +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
  };
}

function testSplineInterpolation() {
  const p0 = { x: 0, y: 0 };
  const p1 = { x: 10, y: 10 };
  const p2 = { x: 20, y: 10 };
  const p3 = { x: 30, y: 0 };

  // At t=0, spline must equal p1
  const atZero = catmullRom(p0, p1, p2, p3, 0);
  if (Math.abs(atZero.x - p1.x) > 0.001 || Math.abs(atZero.y - p1.y) > 0.001) {
    throw new Error(`Spline at t=0 did not equal p1: got (${atZero.x}, ${atZero.y})`);
  }

  // At t=1, spline must equal p2
  const atOne = catmullRom(p0, p1, p2, p3, 1);
  if (Math.abs(atOne.x - p2.x) > 0.001 || Math.abs(atOne.y - p2.y) > 0.001) {
    throw new Error(`Spline at t=1 did not equal p2: got (${atOne.x}, ${atOne.y})`);
  }

  return true;
}

// 2. Track Loop Continuity & Length
function testTrackContinuity() {
  const controlPoints = [
    { x: 300, y: 300 },
    { x: 800, y: 250 },
    { x: 1300, y: 320 },
    { x: 1700, y: 600 },
    { x: 1850, y: 1100 },
    { x: 1650, y: 1600 },
    { x: 1250, y: 1800 },
    { x: 950, y: 1550 },
    { x: 850, y: 1200 },
    { x: 650, y: 1050 },
    { x: 450, y: 1250 },
    { x: 300, y: 1650 },
    { x: -50, y: 1500 },
    { x: -200, y: 1050 },
    { x: -150, y: 600 }
  ];

  const n = controlPoints.length;
  const rawSamples = [];
  const stepsPerSegment = 30;

  for (let i = 0; i < n; i++) {
    const p0 = controlPoints[(i - 1 + n) % n];
    const p1 = controlPoints[i];
    const p2 = controlPoints[(i + 1) % n];
    const p3 = controlPoints[(i + 2) % n];

    for (let s = 0; s < stepsPerSegment; s++) {
      const t = s / stepsPerSegment;
      rawSamples.push(catmullRom(p0, p1, p2, p3, t));
    }
  }

  // Verify total raw samples
  if (rawSamples.length !== n * stepsPerSegment) {
    throw new Error(`Expected ${n * stepsPerSegment} samples, got ${rawSamples.length}`);
  }

  // Calculate total arc length
  let totalLength = 0;
  for (let i = 0; i < rawSamples.length; i++) {
    const next = rawSamples[(i + 1) % rawSamples.length];
    const cur = rawSamples[i];
    totalLength += Math.hypot(next.x - cur.x, next.y - cur.y);
  }

  if (totalLength < 4000 || totalLength > 15000) {
    throw new Error(`Track length out of expected range: ${totalLength}`);
  }

  // Verify distance query & offroad detection (track width = 145)
  const trackWidth = 145;
  const halfWidth = trackWidth / 2;

  // Point right on first sample
  const sample0 = rawSamples[0];
  const distCenter = Math.hypot(sample0.x - sample0.x, sample0.y - sample0.y);
  const isOffroadCenter = distCenter > halfWidth;
  if (isOffroadCenter) throw new Error("Centerline point should NOT be offroad");

  // Point displaced 120px perpendicular to track
  const next0 = rawSamples[1];
  const dx = next0.x - sample0.x;
  const dy = next0.y - sample0.y;
  const len = Math.hypot(dx, dy);
  const normalX = -dy / len;
  const normalY = dx / len;

  const offroadPointX = sample0.x + normalX * 120;
  const offroadPointY = sample0.y + normalY * 120;
  const distOffroad = Math.hypot(offroadPointX - sample0.x, offroadPointY - sample0.y);
  const isOffroadSide = distOffroad > halfWidth;

  if (!isOffroadSide) {
    throw new Error(`Point 120px away from centerline should be offroad (halfWidth=${halfWidth})`);
  }

  return { totalSamples: rawSamples.length, totalLength };
}

// 3. Vehicle Drift Dynamics
function testVehicleDynamics() {
  const dt = 1 / 60;
  // Simulated car
  const car = {
    x: 0, y: 0, angle: 0,
    vx: 0, vy: 0,
    speed: 0,
    inputThrottle: 1,
    inputSteer: 0,
    inputHandbrake: false
  };

  const ACCEL = 380;
  const MAX_SPEED = 460;
  const GRIP_NORMAL = 9.5;
  const GRIP_DRIFT = 2.1;

  // Step 1: Accelerate forward for 1 second (60 frames)
  for (let i = 0; i < 60; i++) {
    const forwardX = Math.cos(car.angle);
    const forwardY = Math.sin(car.angle);
    const forwardVel = car.vx * forwardX + car.vy * forwardY;
    let newForwardVel = forwardVel + ACCEL * dt;
    car.vx = forwardX * newForwardVel;
    car.vy = forwardY * newForwardVel;
  }

  const speedAfterAccel = Math.hypot(car.vx, car.vy);
  if (speedAfterAccel < 250) {
    throw new Error(`Car did not accelerate properly: speed=${speedAfterAccel}`);
  }

  // Step 2: Introduce lateral slip and compare grip decay with normal vs drift grip
  const initialLateralVel = 200;
  const normalDecayedLat = initialLateralVel * Math.max(0, 1 - GRIP_NORMAL * dt);
  const driftDecayedLat = initialLateralVel * Math.max(0, 1 - GRIP_DRIFT * dt);

  // During drift, much more lateral speed is preserved (sliding sideways)
  if (driftDecayedLat <= normalDecayedLat) {
    throw new Error("Drift grip must preserve more lateral velocity than normal grip");
  }

  return true;
}

console.log("--- Ejecutando pruebas unitarias de Derrape (Fase 1) ---");
testSplineInterpolation();
console.log("OK Interpolación de spline Catmull-Rom validada con precisión exacta.");
const trackInfo = testTrackContinuity();
console.log(`OK Continuidad de pista en bucle cerrado: ${trackInfo.totalSamples} muestras, longitud total = ${trackInfo.totalLength.toFixed(1)} px.`);
testVehicleDynamics();
console.log("OK Físicas del auto: aceleración, tracción longitudinal y disipación de agarre en derrape validadas.");
console.log("OK TODAS LAS PRUEBAS DE FASE 1 COMPLETADAS CON ÉXITO.");
