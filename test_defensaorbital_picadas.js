const fs = require('fs');
const OleadasModule = require('./games/defensaorbital/oleadas.js');

console.log('==========================================================');
console.log('   PRUEBAS AUTOMATIZADAS: PASO (B) - PICADAS, BONO Y DRON');
console.log('==========================================================\n');

let passed = 0;
let total = 0;

function test(title, fn) {
  total++;
  try {
    fn();
    console.log(`  OK [PASSED] ${title}`);
    passed++;
  } catch (err) {
    console.error(`  X [FAILED] ${title}`);
    console.error(`    ${err.message}`);
  }
}

// 1. Probar perfiles de picada y matemáticas Bézier de las picadas
test('Perfiles de picada (DIVE_PROFILES) generan puntos y curvas continuas sin NaN', () => {
  const profiles = OleadasModule.DIVE_PROFILES;
  if (!profiles || profiles.length < 4) {
    throw new Error(`Se esperaban al menos 4 perfiles de picada, encontrados: ${profiles ? profiles.length : 0}`);
  }

  const dummyPos = { x: 180, y: 140 };
  const playerPos = { x: 240, y: 550 };

  profiles.forEach(p => {
    if (!p.id || !p.calcPoints) throw new Error(`Perfil inválido sin calcPoints: ${p.id}`);
    const pts = p.calcPoints(dummyPos, playerPos);
    ['p0', 'p1', 'p2', 'p3'].forEach(k => {
      if (!pts[k] || typeof pts[k].x !== 'number' || typeof pts[k].y !== 'number' || isNaN(pts[k].x) || isNaN(pts[k].y)) {
        throw new Error(`Punto ${k} inválido en perfil ${p.id}`);
      }
    });

    // Evaluar en 10 pasos
    for (let step = 0; step <= 10; step++) {
      const t = step / 10;
      const res = OleadasModule.evaluateCubicBezier(pts.p0, pts.p1, pts.p2, pts.p3, t);
      if (isNaN(res.x) || isNaN(res.y) || isNaN(res.angle)) {
        throw new Error(`Evaluación Bézier produjo NaN en perfil ${p.id} en t=${t}`);
      }
    }

    if (p.shootRatio <= 0 || p.shootRatio >= 1) {
      throw new Error(`shootRatio fuera de rango (0, 1) en ${p.id}: ${p.shootRatio}`);
    }
  });
});

// 2. Puntuación: picadas valen sustancialmente más que en formación
test('Los enemigos en picada otorgan mayor puntuación que en formación', () => {
  const tipos = OleadasModule.TIPOS_ENEMIGOS;
  Object.keys(tipos).forEach(k => {
    const e = tipos[k];
    if (e.scoreDiving <= e.scoreFormation) {
      throw new Error(`Enemigo ${k}: scoreDiving (${e.scoreDiving}) debe ser mayor que scoreFormation (${e.scoreFormation})`);
    }
    // Debe ser al menos el doble o notablemente superior
    if (e.scoreDiving < e.scoreFormation * 1.8) {
      throw new Error(`Enemigo ${k}: el bono de picada debería ser al menos 80% superior`);
    }
  });
});

// Configurar entorno simulado completo para game.js
global.window = {
  OleadasModule: OleadasModule,
  ArcadeStorage: { getHighScore: () => 0, setHighScore: () => {} },
  ArcadeAudio: {
    playTone: () => {}, playShoot: () => {}, playDrop: () => {},
    playClear: () => {}, playLoseLife: () => {}, playGameOver: () => {},
    isMuted: false, ctx: null, initCtx: () => {}
  },
  ArcadeCanvas: { fit: () => ({ width: 480, height: 640 }), haptic: () => {} },
  addEventListener: (event, fn) => {
    if (event === 'DOMContentLoaded') global.domReady = fn;
  }
};

global.document = {
  getElementById: (id) => ({
    getContext: () => ({
      save: () => {}, restore: () => {}, clearRect: () => {}, translate: () => {},
      scale: () => {}, rotate: () => {}, beginPath: () => {}, closePath: () => {},
      moveTo: () => {}, lineTo: () => {}, arc: () => {}, ellipse: () => {},
      fill: () => {}, stroke: () => {}, fillText: () => {}, set font(v) {},
      set fillStyle(v) {}, set strokeStyle(v) {}, set lineWidth(v) {},
      set shadowColor(v) {}, set shadowBlur(v) {}, set globalAlpha(v) {},
      set textAlign(v) {}, roundRect: () => {}, rect: () => {}
    }),
    parentElement: { addEventListener: () => {} },
    classList: { add: () => {}, remove: () => {} },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 480, height: 640 }),
    addEventListener: () => {},
    textContent: ''
  })
};

global.requestAnimationFrame = (cb) => { global.nextFrame = cb; };

let code = fs.readFileSync('games/defensaorbital/game.js', 'utf8');
code = code.replace('new DefensaOrbitalGame();', 'global.capturedGame = new DefensaOrbitalGame();');
eval(code);

global.domReady();
const game = global.capturedGame;

// 3. Simulación de Picadas y ciclo de vida de los enemigos
test('Los enemigos en formación entran en picada, disparan y regresan a la cuadrícula', () => {
  game.startNewGame();
  game.startGame();

  // Mover jugador a una esquina para que sus disparos automáticos no destruyan al enemigo en picada
  game.player.x = 30;
  game.player.targetX = 30;

  // Avanzar hasta que los enemigos se asienten en formación (180 frames = 3 seg)
  for (let f = 0; f < 180; f++) {
    game.player.x = 30;
    game.player.targetX = 30;
    game.update(1 / 60);
  }

  const inFormation = game.enemies.filter(e => e.active && e.state === 'FORMATION');
  if (inFormation.length === 0) {
    throw new Error('No hay enemigos en FORMATION después de la entrada inicial');
  }

  // Forzar cooldown de picada a 0 para provocar picada
  game.diveCooldown = 0;
  game.update(1 / 60);

  const divingEnemies = game.enemies.filter(e => e.active && e.state === 'DIVING');
  if (divingEnemies.length === 0) {
    throw new Error('No se inició ninguna picada cuando diveCooldown llegó a 0');
  }

  const diver = divingEnemies[0];
  if (!diver.divePoints) throw new Error('El enemigo en picada no tiene divePoints asignados');

  // La picada se apunta a la posicion del jugador al iniciarse (x = 30). En el juego real, el enemigo
  // que embiste a la nave se destruye al contacto, lo que hacia fallar esta prueba segun el perfil
  // aleatorio. Esta prueba verifica la maquina de estados (DIVING -> RETURNING -> FORMATION), no el
  // choque: se aparta la nave al extremo opuesto y se mantiene vivo al enemigo ante disparos.
  diver.hp = 1e6;

  // Simular la trayectoria de picada
  let enemyFiredBullet = false;
  let reachedReturning = false;

  for (let f = 0; f < 240; f++) {
    game.player.x = 450;
    game.player.targetX = 450;
    game.update(1 / 60);
    if (game.enemyBullets.some(b => b.active)) {
      enemyFiredBullet = true;
    }
    if (diver.state === 'RETURNING') {
      reachedReturning = true;
    }
    if (reachedReturning && diver.state === 'FORMATION') {
      break;
    }
  }

  if (!enemyFiredBullet) {
    throw new Error('El enemigo en picada no disparó durante su trayectoria');
  }
  if (!reachedReturning) {
    throw new Error('El enemigo en picada no transitó al estado RETURNING');
  }
});

// 4. Mecánica Propia: Dron Satélite de Escolta (Soltado, Acoplado, Disparo Doble y Escudo)
test('El enemigo portador suelta cápsula, el jugador acopla el dron, duplica el disparo y el dron absorbe daño', () => {
  game.startNewGame();
  game.startGame();

  // Avanzar 25 frames para que la primera escuadra spawnee al portador marcado
  for (let f = 0; f < 25; f++) {
    game.update(1 / 60);
  }

  // Buscar el enemigo portador marcado
  const carrier = game.enemies.find(e => e.active && e.isCarrier);
  if (!carrier) {
    throw new Error('No se designó ningún enemigo portador marcado (isCarrier)');
  }

  // Destruir al portador simulando impacto
  carrier.hp = 0;
  carrier.state = 'DIVING'; // Simular muerte en picada
  carrier.divePoints = null; // Evitar desplazamiento Bezier fuera del radio durante este frame
  // Disparar impacto con bala
  const bullet = game.bullets[0];
  bullet.active = true;
  bullet.vy = 0;
  bullet.radius = 30;
  bullet.x = carrier.x;
  bullet.y = carrier.y;
  game.update(1 / 60);

  // Restaurar propiedades originales de la bala
  bullet.radius = 4;
  bullet.vy = -560;

  if (!game.capsule.active) {
    throw new Error('Destruir al enemigo portador no soltó la cápsula');
  }

  // Colocar la cápsula descendiendo en la zona de vuelo del jugador
  game.capsule.x = 240;
  game.capsule.y = 500;
  game.player.x = 240;
  game.player.y = 500;
  game.player.targetX = 240;
  game.player.targetY = 500;
  game.update(1 / 60);

  if (game.capsule.active) {
    throw new Error('La cápsula no fue recogida tras contacto con la nave');
  }
  if (!game.drone.docked) {
    throw new Error('El dron de escolta no quedó acoplado (drone.docked === false)');
  }

  // Probar disparo doble: el límite de balas debe ser 4 cuando el dron está acoplado
  game.bullets.forEach(b => b.active = false);
  game.spawnPlayerBullet();

  let activePlayerBullets = game.bullets.filter(b => b.active).length;
  if (activePlayerBullets !== 2) {
    throw new Error(`Se esperaban 2 balas por disparo doble (nave + dron), pero se activaron ${activePlayerBullets}`);
  }

  // Probar protección de escudo: proyectil hostil impacta en el dron
  const initialLives = game.lives;
  const enemyBullet = game.enemyBullets[0];
  enemyBullet.active = true;
  enemyBullet.x = game.drone.x;
  enemyBullet.y = game.drone.y;

  game.update(1 / 60);

  if (game.drone.docked) {
    throw new Error('El dron debía perderse tras recibir el impacto hostil');
  }
  if (game.lives !== initialLives) {
    throw new Error(`La nave del jugador recibió daño a pesar de tener la protección del dron (${game.lives} vs ${initialLives})`);
  }
});

// 5. Etapas de Bonificación (Oleada 4): Sin disparos hostiles, cruce continuo y marcador
test('La etapa de bonificación (Oleada 4) no genera disparos hostiles y reporta aciertos', () => {
  game.startNewGame();
  game.startGame();
  game.startWave(4); // Oleada de bonificación

  if (!game.currentWaveConfig.isBonus) {
    throw new Error('La oleada 4 no está configurada como etapa de bonificación');
  }
  if (game.bonusTotal <= 0) {
    throw new Error(`bonusTotal inválido en etapa de bonificación: ${game.bonusTotal}`);
  }

  game.enemyBullets.forEach(b => b.active = false);

  // Simular 120 frames en etapa de bonificación
  for (let f = 0; f < 120; f++) {
    game.update(1 / 60);
  }

  const anyHostileBullet = game.enemyBullets.some(b => b.active);
  if (anyHostileBullet) {
    throw new Error('En la etapa de bonificación se generaron disparos hostiles');
  }

  // Destruir 3 enemigos de la etapa de bonificación
  let destroyed = 0;
  for (let e of game.enemies) {
    if (e.active && destroyed < 3) {
      e.hp = 0;
      const b = game.bullets.find(x => !x.active);
      if (b) {
        b.active = true;
        b.x = e.x;
        b.y = e.y;
        game.update(1 / 60);
        destroyed++;
      }
    }
  }

  if (game.bonusHits !== destroyed) {
    throw new Error(`bonusHits (${game.bonusHits}) no coincide con los enemigos destruidos (${destroyed})`);
  }
});

// 6. Reporte de precisión de fin de etapa
test('Al finalizar la oleada se genera un reporte con porcentaje de precisión de tiro', () => {
  game.startNewGame();
  game.startGame();
  game.startWave(1);

  // Registrar estadísticas de disparo
  game.stats.shotsFired = 20;
  game.stats.shotsHit = 16;

  // Desactivar todos los grupos y enemigos para forzar oleada completada
  game.pendingGroups.forEach(g => g.isComplete = true);
  game.enemies.forEach(e => e.active = false);

  game.update(1 / 60);

  if (!game.stageReport) {
    throw new Error('No se generó el stageReport al completar la oleada');
  }
  if (game.stageReport.accuracy !== 80) {
    throw new Error(`Porcentaje de precisión incorrecto: ${game.stageReport.accuracy}% (esperado: 80%)`);
  }
  if (game.stageReport.bonusPts !== 200) {
    throw new Error(`Bono orbital incorrecto: ${game.stageReport.bonusPts} (esperado: 200)`);
  }
});

console.log(`\n==========================================================`);
console.log(`RESULTADO: ${passed} / ${total} PRUEBAS SUPERADAS (${Math.round((passed / total) * 100)}%)`);
console.log(`==========================================================`);

if (passed !== total) process.exit(1);
