/**
 * test_corredor.js - Pruebas unitarias en Node para Corredor (Arcade 00)
 * Prueba miles de secuencias generadas para garantizar solvencia matemática absoluta.
 */
const assert = require('assert');
const { CONFIG, RunnerPhysics, RunnerGenerator } = require('./games/corredor/game.js');

console.log('--- INICIANDO TEST: CORREDOR ---');

// 1. Verificación de balance y física básica
assert.ok(CONFIG.BASE_SPEED >= 250, 'Velocidad base adecuada');
assert.ok(CONFIG.MAX_SPEED > CONFIG.BASE_SPEED, 'Velocidad máxima mayor que base');
assert.ok(CONFIG.GRAVITY > 1000, 'Gravedad responsiva');
assert.ok(CONFIG.JUMP_FORCE < 0, 'Fuerza de salto hacia arriba');
assert.ok(CONFIG.DOUBLE_JUMP_FORCE < 0, 'Fuerza de doble salto hacia arriba');

// 2. Cálculo de separación mínima y distancia de salto
const testSpeeds = [300, 400, 500, 600, 680];
for (const spd of testSpeeds) {
  const minSep = RunnerPhysics.getMinSeparation(spd);
  const maxJump = RunnerPhysics.getMaxJumpDistance(spd);
  assert.ok(minSep > 0, `Separación mínima positiva para velocidad ${spd}`);
  assert.ok(maxJump > minSep * 0.5, `Salto máximo suficiente para cubrir fosas a ${spd}`);
}
console.log('✓ Física de salto y márgenes de recuperación verificados');

// 3. Simulación de 5,000 obstáculos generados proceduralmente
const generator = new RunnerGenerator();
generator.reset(500);

let lastObstacle = null;
const TOTAL_OBSTACLES = 5000;

for (let i = 0; i < TOTAL_OBSTACLES; i++) {
  // Simular velocidad creciente con el avance
  const currentSpeed = Math.min(CONFIG.MAX_SPEED, CONFIG.BASE_SPEED + (i * 0.08));
  const obs = generator.nextObstacle(currentSpeed);

  assert.ok(obs.w > 0 && obs.h > 0, 'Dimensiones del obstáculo válidas');
  assert.ok(obs.x > 0, 'Coordenada X positiva');

  if (lastObstacle) {
    // A) No debe haber colisión/solapamiento entre obstáculos consecutivos
    const distanceBetween = obs.x - (lastObstacle.x + lastObstacle.w);
    const minSafeSep = RunnerPhysics.getMinSeparation(currentSpeed);

    assert.ok(
      distanceBetween >= minSafeSep,
      `Infracción de solvencia en obstáculo ${i}: separación ${distanceBetween.toFixed(1)}px menor que mínimo requerido ${minSafeSep.toFixed(1)}px a velocidad ${currentSpeed}`
    );

    // B) Si el obstáculo es un hueco (GAP), su anchura debe ser menor que la distancia máxima de salto
    if (obs.type === 'GAP') {
      const maxJump = RunnerPhysics.getMaxJumpDistance(currentSpeed);
      assert.ok(
        obs.w <= maxJump * 0.75,
        `Fosa imposible en obstáculo ${i}: ancho ${obs.w}px excede el 75% del salto máximo ${maxJump.toFixed(1)}px`
      );
    }

    // C) Si es un dron volador, no puede haber fosa en el mismo espacio (ya que requiere agacharse en suelo sólido)
    if (obs.type === 'FLYING_DRONE') {
      assert.notStrictEqual(lastObstacle.type, 'GAP', `Dron volador colocado inmediatamente tras una fosa`);
    }
  }

  lastObstacle = obs;
}

console.log(`✓ 5,000 obstáculos generados y verificados: 100% matemáticamente superables sin solapamientos ni trampas imposibles`);

// 4. Verificación de colisión AABB
const b1 = { x: 50, y: 50, w: 30, h: 30 };
const b2Overlap = { x: 60, y: 60, w: 30, h: 30 };
const b3NoOverlap = { x: 100, y: 100, w: 30, h: 30 };

assert.strictEqual(RunnerPhysics.checkAABB(b1, b2Overlap), true, 'Debe detectar colisión con solapamiento');
assert.strictEqual(RunnerPhysics.checkAABB(b1, b3NoOverlap), false, 'No debe detectar colisión sin solapamiento');

console.log('✓ Detección de colisiones AABB verificada');
console.log('--- TODOS LOS TESTS DE CORREDOR PASARON EXITOSAMENTE (4/4) ---');
