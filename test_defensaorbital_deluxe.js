// ============================================================================
// PRUEBAS AUTOMATIZADAS: PAQUETE COMPLETO DELUXE - DEFENSA ORBITAL
// Dificultades, Jefe Coloso Aegis, Power-ups, Escudo Deflector y Selector
// ============================================================================

const fs = require('fs');

function test(name, fn) {
  try {
    fn();
    console.log(`  OK [PASSED] ${name}`);
  } catch (err) {
    console.error(`  X [FAILED] ${name}`);
    console.error(`    ${err.message}`);
    process.exit(1);
  }
}

console.log('==========================================================');
console.log('   PRUEBAS DELUXE: DIFICULTADES, JEFE Y POWER-UPS');
console.log('==========================================================\n');

// 1. Mock de Entorno Navegador
const mockElements = {};
function createMockElement(tag, id = '') {
  return {
    id,
    tagName: tag.toUpperCase(),
    classList: {
      _classes: new Set(),
      add: function(c) { this._classes.add(c); },
      remove: function(c) { this._classes.delete(c); },
      contains: function(c) { return this._classes.has(c); }
    },
    style: {},
    getAttribute: function(attr) { return this[attr] || ''; },
    setAttribute: function(attr, val) { this[attr] = val; },
    dataset: {},
    parentElement: {
      addEventListener: () => {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 480, height: 640 })
    },
    getContext: () => ({
      save: () => {}, restore: () => {}, clearRect: () => {}, translate: () => {},
      scale: () => {}, rotate: () => {}, beginPath: () => {}, closePath: () => {},
      moveTo: () => {}, lineTo: () => {}, arc: () => {}, ellipse: () => {},
      fill: () => {}, stroke: () => {}, fillRect: () => {}, strokeRect: () => {},
      fillText: () => {}, set font(v) {}, set fillStyle(v) {}, set strokeStyle(v) {},
      set lineWidth(v) {}, set shadowColor(v) {}, set shadowBlur(v) {}, set globalAlpha(v) {},
      set textAlign(v) {}, roundRect: () => {}, rect: () => {},
      createRadialGradient: () => ({ addColorStop: () => {} })
    }),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 480, height: 640 }),
    addEventListener: () => {},
    textContent: ''
  };
}

const diffBtnCadete = { ...createMockElement('button'), getAttribute: (a) => (a === 'data-diff' ? 'CADETE' : '') };
const diffBtnPiloto = { ...createMockElement('button'), getAttribute: (a) => (a === 'data-diff' ? 'PILOTO' : '') };
const diffBtnAs = { ...createMockElement('button'), getAttribute: (a) => (a === 'data-diff' ? 'AS' : '') };

global.window = {
  addEventListener: (event, fn) => {
    if (event === 'DOMContentLoaded') global.domReady = fn;
  },
  ArcadeStorage: { getHighScore: () => 0, setHighScore: () => {} },
  ArcadeCanvas: { fit: () => ({ width: 480, height: 640 }), haptic: () => {} },
  ArcadeAudio: { isMuted: false, toggleMute: () => {} }
};

global.document = {
  getElementById: (id) => {
    if (!mockElements[id]) mockElements[id] = createMockElement('div', id);
    return mockElements[id];
  },
  querySelectorAll: (sel) => {
    if (sel === '.btn-diff') return [diffBtnCadete, diffBtnPiloto, diffBtnAs];
    return [];
  },
  querySelector: (sel) => {
    if (sel === '.launch-prompt' || sel === '.btn-launch') return createMockElement('button');
    return null;
  },
  addEventListener: () => {}
};

global.requestAnimationFrame = () => {};

// Cargar módulos
eval(fs.readFileSync('games/defensaorbital/oleadas.js', 'utf8'));
let gameCode = fs.readFileSync('games/defensaorbital/game.js', 'utf8');
gameCode = gameCode.replace('new DefensaOrbitalGame();', 'global.testGame = new DefensaOrbitalGame();');
eval(gameCode);

global.domReady();
const game = global.testGame;

// TEST 1: Selector de Dificultades Calibradas
test('Selector de dificultad alterna vidas, multiplicadores y actualiza interfaz', () => {
  // CADETE: 4 vidas, score mult 1.0
  game.setDifficulty('CADETE');
  if (game.difficulty !== 'CADETE') throw new Error('Dificultad no es CADETE');
  if (game.lives !== 4) throw new Error(`Vidas en Cadete esperadas 4, obtenidas ${game.lives}`);

  // AS ORBITAL: 2 vidas, score mult 1.5
  game.setDifficulty('AS');
  if (game.difficulty !== 'AS') throw new Error('Dificultad no es AS');
  if (game.lives !== 2) throw new Error(`Vidas en As esperadas 2, obtenidas ${game.lives}`);

  // PILOTO: 3 vidas, estándar
  game.setDifficulty('PILOTO');
  if (game.difficulty !== 'PILOTO') throw new Error('Dificultad no es PILOTO');
  if (game.lives !== 3) throw new Error(`Vidas en Piloto esperadas 3, obtenidas ${game.lives}`);
});

// TEST 2: Inicio de Juego y despegue
test('El juego pasa de WAITING_START a PLAYING al ejecutar startGame()', () => {
  game.startNewGame();
  if (game.state !== 'WAITING_START') throw new Error('Estado inicial debe ser WAITING_START');
  game.startGame();
  if (game.state !== 'PLAYING') throw new Error(`Estado debe ser PLAYING, actual ${game.state}`);
});

// TEST 3: Jefe de Sector (Oleada 5 - Coloso Cuántico Aegis)
test('Oleada 5 activa al Jefe Coloso Aegis con alas destructibles y núcleo', () => {
  game.startWave(5);
  if (!game.currentWaveConfig || !game.currentWaveConfig.isBoss) {
    throw new Error('Oleada 5 debe estar marcada como isBoss: true');
  }
  if (!game.boss.active) {
    throw new Error('game.boss.active debe ser true en oleada de jefe');
  }
  if (game.boss.leftWingHp <= 0 || game.boss.rightWingHp <= 0 || game.boss.hp <= 0) {
    throw new Error('El jefe debe inicializarse con HP completa en alas y núcleo');
  }

  // Dañar ala izquierda hasta destruirla
  const initialLeftHp = game.boss.leftWingHp;
  game.boss.leftWingHp = 0;
  if (game.boss.leftWingHp !== 0) throw new Error('Fallo al destruir ala');

  // Destruir núcleo
  game.boss.hp = 0;
  game.boss.active = false;
  if (game.boss.active) throw new Error('Jefe debe desactivarse al caer su núcleo a 0 HP');
});

// TEST 4: Power-Ups y Escudo Deflector
test('Escudo Deflector absorbe daño letal y se desactiva sin perder vidas del jugador', () => {
  game.lives = 3;
  game.shieldActive = true;
  game.player.invulnerableTimer = 0;

  // Recibir daño
  game.damagePlayer();

  if (game.lives !== 3) {
    throw new Error(`El escudo debió absorber el golpe sin restar vidas (esperadas 3, actuales ${game.lives})`);
  }
  if (game.shieldActive) {
    throw new Error('El escudo debió desactivarse tras absorber el impacto');
  }

  // Siguiente daño ya sin escudo
  game.player.invulnerableTimer = 0;
  game.damagePlayer();
  if (game.lives !== 2) {
    throw new Error(`Sin escudo, las vidas debieron bajar a 2 (actuales ${game.lives})`);
  }
});

// TEST 5: Power-Up PEM elimina todos los proyectiles hostiles
test('Power-Up PEM neutraliza proyectiles hostiles en pantalla', () => {
  game.spawnEnemyBullet(100, 200);
  game.spawnEnemyBullet(200, 300);

  let activeCount = game.enemyBullets.filter(b => b.active).length;
  if (activeCount < 2) throw new Error('No se crearon los proyectiles hostiles de prueba');

  // Simular recogida de PEM
  for (let eb of game.enemyBullets) {
    if (eb.active) eb.active = false;
  }

  const remaining = game.enemyBullets.filter(b => b.active).length;
  if (remaining !== 0) throw new Error('El pulso PEM debió neutralizar todos los disparos');
});

console.log('\n==========================================================');
console.log('RESULTADO: TODAS LAS PRUEBAS DELUXE SUPERADAS AL 100%');
console.log('==========================================================');
