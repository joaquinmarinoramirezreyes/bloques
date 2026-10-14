const fs = require('fs');
const path = require('path');

console.log('==========================================================');
console.log('   PRUEBAS AUTOMATIZADAS: MAPA MÓVIL Y RESPONSIVE');
console.log('==========================================================\n');

let passed = 0;
let total = 0;

function test(title, fn) {
  total++;
  try {
    fn();
    console.log(`  ✓ [PASSED] ${title}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ [FAILED] ${title}`);
    console.error(`    ${err.message}`);
  }
}

// 1. Verificar existencia de elementos en index.html
test('index.html contiene el contenedor de minimapa accesible y el modal de mapa expandido', () => {
  const html = fs.readFileSync(path.join(__dirname, 'games/abismo/index.html'), 'utf8');
  if (!html.includes('id="minimap-container"')) throw new Error('Falta #minimap-container');
  if (!html.includes('id="map-modal"')) throw new Error('Falta #map-modal');
  if (!html.includes('id="map-modal-canvas"')) throw new Error('Falta #map-modal-canvas');
  if (!html.includes('id="btn-close-map"')) throw new Error('Falta #btn-close-map');
  if (!html.includes('id="btn-map-resume"')) throw new Error('Falta #btn-map-resume');
  if (!html.includes('minimap-zoom-hint')) throw new Error('Falta zoom hint');
});

// 2. Verificar reglas CSS responsivas para pantallas móviles
test('style.css contiene consultas de medios móviles y soporte de safe-area-inset', () => {
  const css = fs.readFileSync(path.join(__dirname, 'games/abismo/style.css'), 'utf8');
  if (!css.includes('@media (max-width: 640px)')) throw new Error('Falta @media (max-width: 640px)');
  if (!css.includes('env(safe-area-inset-top')) throw new Error('Falta env(safe-area-inset-top)');
  if (!css.includes('env(safe-area-inset-right')) throw new Error('Falta env(safe-area-inset-right)');
  if (!css.includes('#map-modal')) throw new Error('Falta estilos #map-modal');
  if (!css.includes('.map-legend-grid')) throw new Error('Falta estilos .map-legend-grid');
});

// 3. Simular renderizado del MiniMap en canvas expandido y canvas estándar
test('MiniMap renderiza correctamente en canvas estándar (72x72) y expandido (280x280)', () => {
  // Mock canvas y contexto 2D
  const calls = [];
  const createMockCanvas = (w, h) => ({
    width: w,
    height: h,
    getContext: () => ({
      clearRect: () => calls.push('clearRect'),
      fillRect: () => calls.push('fillRect'),
      strokeRect: () => calls.push('strokeRect'),
      beginPath: () => calls.push('beginPath'),
      moveTo: () => calls.push('moveTo'),
      lineTo: () => calls.push('lineTo'),
      stroke: () => calls.push('stroke'),
      arc: () => calls.push('arc'),
      fill: () => calls.push('fill'),
      fillText: (text) => calls.push(`fillText:${text}`),
      set fillStyle(val) {},
      set strokeStyle(val) {},
      set lineWidth(val) {},
      set font(val) {},
      set textAlign(val) {},
      set textBaseline(val) {}
    })
  });

  const { DungeonGenerator } = require('./games/abismo/data/salas.js');
  const dungeon = DungeonGenerator.generate(4, 8, 1);
  const currentRoom = dungeon.startRoom;

  // Mock MiniMap class logic
  const gameCode = fs.readFileSync(path.join(__dirname, 'games/abismo/game.js'), 'utf8');
  const miniMapClassMatch = gameCode.match(/class MiniMap \{[\s\S]*?\n  \}/);
  if (!miniMapClassMatch) throw new Error('No se encontró la definición de class MiniMap en game.js');

  const MiniMapFactory = new Function(miniMapClassMatch[0] + '; return MiniMap;')();

  // Test mini HUD canvas
  const hudCanvas = createMockCanvas(72, 72);
  const miniMap = new MiniMapFactory(hudCanvas);
  miniMap.render(dungeon, currentRoom);
  if (!calls.includes('clearRect')) throw new Error('No limpió el canvas');

  // Test expanded modal canvas
  calls.length = 0;
  const modalCanvas = createMockCanvas(280, 280);
  miniMap.render(dungeon, currentRoom, modalCanvas);
  const hasIcons = calls.some(c => c.startsWith('fillText:'));
  if (!hasIcons) throw new Error('No renderizó iconos en el canvas modal expandido');
});

// 4. Verificar presencia de openMapModal y closeMapModal en game.js
test('game.js define openMapModal y closeMapModal con pausa de juego', () => {
  const code = fs.readFileSync(path.join(__dirname, 'games/abismo/game.js'), 'utf8');
  if (!code.includes('openMapModal()')) throw new Error('Falta openMapModal() en game.js');
  if (!code.includes('closeMapModal()')) throw new Error('Falta closeMapModal() en game.js');
  if (!code.includes("this.state = 'MAP_VIEW'")) throw new Error("Falta this.state = 'MAP_VIEW'");
});

console.log(`\n==========================================================`);
console.log(`RESULTADO: ${passed} / ${total} PRUEBAS SUPERADAS (${Math.round((passed / total) * 100)}%)`);
console.log(`==========================================================`);

if (passed !== total) process.exit(1);
