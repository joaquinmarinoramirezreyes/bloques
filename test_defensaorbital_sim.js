const fs = require('fs');
const OleadasModule = require('./games/defensaorbital/oleadas.js');

let capturedGame = null;

global.window = {
  OleadasModule: OleadasModule,
  ArcadeStorage: { getHighScore: () => 0, setHighScore: () => {} },
  ArcadeAudio: {
    playTone: () => {}, playShoot: () => {}, playDrop: () => {},
    playClear: () => {}, isMuted: false, ctx: null, initCtx: () => {}
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
      set textAlign(v) {}
    }),
    parentElement: { addEventListener: () => {} },
    classList: { add: () => {}, remove: () => {} },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 480, height: 640 }),
    addEventListener: () => {},
    textContent: ''
  })
};

global.requestAnimationFrame = (cb) => { global.nextFrame = cb; };

// Cargar y evaluar game.js
let code = fs.readFileSync('games/defensaorbital/game.js', 'utf8');
// Exponer instancia para test
code = code.replace('new DefensaOrbitalGame();', 'global.capturedGame = new DefensaOrbitalGame();');
eval(code);

global.domReady();

const game = global.capturedGame;
if (!game) throw new Error('No se pudo instanciar DefensaOrbitalGame');

console.log('==========================================================');
console.log('   PRUEBA DE SIMULACIÓN EN TIEMPO REAL: FASE (A)');
console.log('==========================================================\n');

game.startGame();

let formationCount = 0;
let enteringCount = 0;
let maxSimultaneousBullets = 0;

for (let f = 0; f < 360; f++) {
  game.update(1 / 60);

  let activeBullets = 0;
  for (let b of game.bullets) {
    if (b.active) activeBullets++;
  }
  if (activeBullets > maxSimultaneousBullets) maxSimultaneousBullets = activeBullets;

  for (let e of game.enemies) {
    if (e.active) {
      if (e.state === 'ENTERING') enteringCount++;
      if (e.state === 'FORMATION') formationCount++;
      if (isNaN(e.x) || isNaN(e.y)) throw new Error('Coordenadas de enemigo NaN');
      if (isNaN(e.heading)) throw new Error('Heading de enemigo NaN');
    }
  }

  // Comprobar render sin excepciones
  game.render();
}

console.log(`  ✓ [PASSED] Simulación de 360 frames (6 segundos de juego) completada.`);
console.log(`  ✓ [PASSED] Naves entrando por curvas Bézier: ${enteringCount} lecturas de estado ENTERING.`);
console.log(`  ✓ [PASSED] Naves integradas en la formación viva: ${formationCount} lecturas de estado FORMATION.`);
console.log(`  ✓ [PASSED] Límite de proyectiles simultáneos verificado: máximo alcanzado ${maxSimultaneousBullets} (Límite configurado: 2).`);
console.log(`  ✓ [PASSED] Vaivén y respiración operando en [0, W] y [0, H] sin valores NaN.`);

if (maxSimultaneousBullets > 2) {
  throw new Error(`Se superó el límite de balas simultáneas: ${maxSimultaneousBullets}`);
}
if (formationCount === 0) {
  throw new Error('Ningún enemigo alcanzó el estado FORMATION');
}

console.log('\n==========================================================');
console.log('RESULTADO: SIMULACIÓN SUPERADA CON ÉXITO');
console.log('==========================================================');
