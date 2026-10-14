/**
 * test_fronton.js - Pruebas unitarias en Node para Frontón (Arcade 80)
 */
const assert = require('assert');
const { CONFIG, FrontonPhysics } = require('./games/fronton/game.js');

console.log('--- INICIANDO TEST: FRONTON ---');

// 1. Verificación de balance y constantes básicas
assert.strictEqual(CONFIG.WINNING_SCORE, 7, 'Debe ganar el primero a 7 puntos');
assert.ok(CONFIG.BASE_SPEED > 0, 'La velocidad base debe ser positiva');
assert.ok(CONFIG.MAX_SPEED > CONFIG.BASE_SPEED, 'Velocidad máxima debe superar la base');
assert.ok(CONFIG.DIFFICULTIES.EASY.speed < CONFIG.DIFFICULTIES.HARD.speed, 'Velocidad de IA Novato debe ser menor que Cyber');

// 2. Física de Rebote en Paleta (Impacto centrado => rebote recto)
const centerRebound = FrontonPhysics.calculatePaddleRebound(240, 240, CONFIG.PADDLE_W, 300, false);
assert.ok(Math.abs(centerRebound.vx) < 1e-4, 'Impacto centrado debe producir vx cercano a 0');
assert.ok(centerRebound.vy < 0, 'Para P1 (inferior), vy debe ser hacia arriba (negativo)');
assert.strictEqual(centerRebound.newSpeed, 300 + CONFIG.ACCEL_PER_HIT, 'La velocidad debe acelerar en cada toque');

// 3. Impacto en el borde derecho de la paleta P1 => rebote hacia la derecha
const rightRebound = FrontonPhysics.calculatePaddleRebound(240 + CONFIG.PADDLE_W / 2, 240, CONFIG.PADDLE_W, 300, false);
assert.ok(rightRebound.vx > 0, 'Impacto en borde derecho debe disparar pelota a la derecha');
assert.ok(rightRebound.vy < 0, 'Paleta inferior debe despedir la bola hacia arriba');

// 4. Impacto en el borde izquierdo de la paleta P2 (superior) => rebote hacia abajo e izquierda
const leftReboundP2 = FrontonPhysics.calculatePaddleRebound(240 - CONFIG.PADDLE_W / 2, 240, CONFIG.PADDLE_W, 300, true);
assert.ok(leftReboundP2.vx < 0, 'Impacto en borde izquierdo debe despedir pelota a la izquierda');
assert.ok(leftReboundP2.vy > 0, 'Paleta superior debe despedir la bola hacia abajo');

// 5. Límite máximo de velocidad (Cap)
const maxSpeedRebound = FrontonPhysics.calculatePaddleRebound(240, 240, CONFIG.PADDLE_W, CONFIG.MAX_SPEED - 5, false);
assert.strictEqual(maxSpeedRebound.newSpeed, CONFIG.MAX_SPEED, 'La velocidad no debe exceder MAX_SPEED');

// 6. Clasificación de zonas de toque para 2 Jugadores en un móvil
const courtHeight = 640;
assert.strictEqual(FrontonPhysics.classifyTouchZone(100, courtHeight), 'P2', 'Zona superior pertenece a P2');
assert.strictEqual(FrontonPhysics.classifyTouchZone(319, courtHeight), 'P2', 'Justo antes de la mitad pertenece a P2');
assert.strictEqual(FrontonPhysics.classifyTouchZone(320, courtHeight), 'P1', 'De la mitad hacia abajo pertenece a P1');
assert.strictEqual(FrontonPhysics.classifyTouchZone(600, courtHeight), 'P1', 'Zona inferior pertenece a P1');

// 7. Clamp de paleta para que no salga de la pista
const leftClamped = FrontonPhysics.clampPaddleX(-50, CONFIG.PADDLE_W, CONFIG.VIRTUAL_W);
assert.ok(leftClamped >= CONFIG.PADDLE_W / 2 + 12, 'No debe salir del borde izquierdo');
const rightClamped = FrontonPhysics.clampPaddleX(CONFIG.VIRTUAL_W + 100, CONFIG.PADDLE_W, CONFIG.VIRTUAL_W);
assert.ok(rightClamped <= CONFIG.VIRTUAL_W - CONFIG.PADDLE_W / 2 - 12, 'No debe salir del borde derecho');

console.log('✓ Todos los tests de Frontón pasaron exitosamente (7/7)');
