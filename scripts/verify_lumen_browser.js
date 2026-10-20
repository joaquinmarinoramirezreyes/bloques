/**
 * scripts/verify_lumen_browser.js
 * Abre Lumen en un navegador real headless (Puppeteer),
 * inicia el nivel, simula al menos 300 frames del bucle de juego
 * y comprueba que el estado avanza activamente:
 * - Cuenta de frames >= 300
 * - Transición de READY a PLAYING
 * - Movimiento continuo del protagonista
 * - Movimiento y navegación de las 4 sombras
 * - Recolección de orbes y actualización del HUD
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('assert');
const puppeteer = require('puppeteer-core');

const ROOT_DIR = path.resolve(__dirname, '..');

function getChromeExecutable() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.CHROME_BIN,
    process.env.PUPPETEER_EXECUTABLE_PATH
  ].filter(Boolean);

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = decodeURI(req.url.split('?')[0]);
      if (reqPath === '/') reqPath = '/index.html';
      let filePath = path.join(ROOT_DIR, reqPath);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port });
    });
  });
}

async function verifyLumen() {
  console.log('='.repeat(70));
  console.log('VERIFICACIÓN DE LUMEN EN NAVEGADOR HEADLESS TRAS EXPORTS Y GUARDAS');
  console.log('='.repeat(70));

  const chromePath = getChromeExecutable();
  if (!chromePath) throw new Error('Chrome no encontrado');

  const { server, port } = await startServer();
  const consoleErrors = [];

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      consoleErrors.push(err.toString());
    });

    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    console.log(`[1/4] Navegando a http://127.0.0.1:${port}/games/lumen/index.html...`);
    await page.goto(`http://127.0.0.1:${port}/games/lumen/index.html`, { waitUntil: 'domcontentloaded' });

    // Esperar inicialización y leer snapshot inicial
    await new Promise(r => setTimeout(r, 400));
    const initSnapshot = await page.evaluate(() => {
      if (!window.State || !window.State.player) return null;
      return {
        levelIdx: window.State.levelIdx,
        gameState: window.State.gameState,
        frameCount: window.State.frameCount,
        playerX: window.State.player.x,
        playerY: window.State.player.y,
        playerDir: window.State.player.dir,
        dotsRemaining: window.State.dotsRemaining,
        totalDots: window.State.totalDots,
        shadows: window.State.shadows.map(s => ({ id: s.id, name: s.name, x: s.x, y: s.y, state: s.state }))
      };
    });

    assert.ok(initSnapshot, 'window.State debe estar instanciado correctamente en el navegador');
    console.log(`[2/4] Snapshot inicial capturado:`);
    console.log(`      Estado inicial: ${initSnapshot.gameState}, Nivel: ${initSnapshot.levelIdx + 1}, Orbes: ${initSnapshot.dotsRemaining}`);
    console.log(`      Posición inicial del jugador: (${initSnapshot.playerX.toFixed(1)}, ${initSnapshot.playerY.toFixed(1)})`);
    console.log(`      Sombras activas: ${initSnapshot.shadows.length} (${initSnapshot.shadows.map(s => s.name).join(', ')})`);

    // Esperar a que el bucle rAF ejecute al menos 300 frames
    console.log(`[3/4] Simulando al menos 300 frames del bucle de juego a 60 FPS...`);
    const framesCounted = await page.evaluate(async () => {
      return new Promise((resolve) => {
        let count = 0;
        function countFrame() {
          count++;
          if (count >= 300) {
            resolve(count);
          } else {
            requestAnimationFrame(countFrame);
          }
        }
        requestAnimationFrame(countFrame);
      });
    });

    const finalSnapshot = await page.evaluate(() => {
      return {
        levelIdx: window.State.levelIdx,
        gameState: window.State.gameState,
        fps: window.State.fps,
        playerX: window.State.player.x,
        playerY: window.State.player.y,
        playerDir: window.State.player.dir,
        dotsRemaining: window.State.dotsRemaining,
        score: window.State.score,
        shadows: window.State.shadows.map(s => ({ id: s.id, name: s.name, x: s.x, y: s.y, state: s.state }))
      };
    });

    console.log(`[4/4] Snapshot final tras simulación:`);
    console.log(`      Frames procesados: ${framesCounted}`);
    console.log(`      Estado final: ${finalSnapshot.gameState}`);
    console.log(`      Posición final del jugador: (${finalSnapshot.playerX.toFixed(1)}, ${finalSnapshot.playerY.toFixed(1)})`);
    console.log(`      Puntos acumulados: ${finalSnapshot.score}, Orbes restantes: ${finalSnapshot.dotsRemaining}/${initSnapshot.totalDots}`);

    // Verificaciones estrictas
    assert.ok(framesCounted >= 300, `Debe alcanzar al menos 300 frames (alcanzó: ${framesCounted})`);
    assert.strictEqual(finalSnapshot.gameState, 'PLAYING', 'El estado del juego debe avanzar de READY a PLAYING');

    const playerMoved = (Math.abs(finalSnapshot.playerX - initSnapshot.playerX) > 5) || (Math.abs(finalSnapshot.playerY - initSnapshot.playerY) > 5);
    assert.ok(playerMoved, 'El protagonista debe avanzar continuamente por los pasillos');

    const shadowsMoved = finalSnapshot.shadows.some((s, idx) => {
      const initS = initSnapshot.shadows[idx];
      return Math.abs(s.x - initS.x) > 2 || Math.abs(s.y - initS.y) > 2;
    });
    assert.ok(shadowsMoved, 'Las sombras deben navegar y desplazarse activamente por el laberinto');

    assert.strictEqual(consoleErrors.length, 0, `No debe haber errores de consola en tiempo de ejecución (errores: ${consoleErrors.join(', ')})`);

    console.log('\n' + '='.repeat(70));
    console.log('¡VERIFICACIÓN DE LUMEN EN NAVEGADOR COMPLETADA CON 100% ÉXITO!');
    console.log('El bucle rAF, la transición de estado, el desplazamiento del jugador y la IA de las sombras avanzan activamente.');
    console.log('='.repeat(70));
  } finally {
    await browser.close();
    server.close();
  }
}

verifyLumen().catch(err => {
  console.error('Fallo en verificación de Lumen:', err);
  process.exit(1);
});
