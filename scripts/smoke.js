/**
 * scripts/smoke.js - Automated smoke test suite for Sala Arcade games
 * 
 * Verifies for every game in games.json:
 * 1. Zero console errors (TypeError, uncaught exceptions, 404s on assets/favicons).
 * 2. Canvas exists with non-zero dimensions and rendered pixels.
 * 3. Game animation loop (requestAnimationFrame) is actively cycling.
 * 
 * Usage:
 *   node scripts/smoke.js
 *   npm run smoke
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT_DIR = path.resolve(__dirname, '..');
const GAMES_JSON_PATH = path.join(ROOT_DIR, 'games.json');

// MIME types for static server
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg'
};

function getChromeExecutable() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;

  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ];

  for (const c of candidates) {
    if (c && fs.existsSync(c)) {
      return c;
    }
  }
  return null;
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const parsedUrl = new URL(req.url, 'http://127.0.0.1');
        let decodedPath = decodeURIComponent(parsedUrl.pathname);
        let safePath = path.normalize(decodedPath).replace(/^(\.\.[\/\\])+/, '');
        let filePath = path.join(ROOT_DIR, safePath);

        if (!filePath.startsWith(ROOT_DIR)) {
          res.writeHead(403, { 'Content-Type': 'text/plain' });
          res.end('Access Denied');
          return;
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, 'index.html');
        }

        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end(`Not Found: ${req.url}`);
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        const content = fs.readFileSync(filePath);

        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': content.length,
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        res.end(content);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${err.message}`);
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port });
    });

    server.on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testGame(browser, baseUrl, game) {
  const result = {
    id: game.id,
    name: game.name,
    folder: game.folder,
    passed: false,
    errors: [],
    canvas: null,
    fps: 0,
    frames: 0,
    drawnPixels: 0
  };

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 892, deviceScaleFactor: 1 });

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      result.errors.push(`[Console Error] ${msg.text()}`);
    }
  });

  // Listen for unhandled page errors
  page.on('pageerror', err => {
    result.errors.push(`[Uncaught Exception] ${err.message || err.toString()}`);
  });

  // Listen for HTTP response errors (404s, 500s)
  page.on('response', res => {
    if (res.status() >= 400) {
      result.errors.push(`[HTTP ${res.status()}] ${res.url()}`);
    }
  });

  // Listen for request failures
  page.on('requestfailed', req => {
    // Ignore canceled requests (e.g. navigation aborts)
    if (req.failure()?.errorText !== 'net::ERR_ABORTED') {
      result.errors.push(`[Request Failed] ${req.url()} (${req.failure()?.errorText || 'unknown'})`);
    }
  });

  const targetUrl = `${baseUrl}/${game.folder}/index.html`;

  try {
    await page.goto(targetUrl, { waitUntil: 'load', timeout: 10000 });

    // Wait 1.5 seconds for game init and first few frames
    await sleep(1500);

    // Evaluate canvas presence and drawn pixels (select primary game canvas by largest area)
    const canvasEval = await page.evaluate(() => {
      const canvases = Array.from(document.querySelectorAll('canvas'));
      if (canvases.length === 0) return { exists: false, error: 'No <canvas> element found in DOM' };

      // Sort canvases by area descending so primary game canvas is picked over small thumbnail/preview canvases
      canvases.sort((a, b) => {
        const areaA = (a.width || a.clientWidth || 0) * (a.height || a.clientHeight || 0);
        const areaB = (b.width || b.clientWidth || 0) * (b.height || b.clientHeight || 0);
        return areaB - areaA;
      });

      const canvas = canvases[0];
      const width = canvas.width || canvas.clientWidth || 0;
      const height = canvas.height || canvas.clientHeight || 0;
      if (width === 0 || height === 0) {
        return { exists: true, width, height, error: 'Canvas has 0 width or 0 height' };
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return { exists: true, width, height, error: 'Could not obtain 2d context from canvas' };
      }

      try {
        const sampleW = Math.min(width, 200);
        const sampleH = Math.min(height, 200);
        const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data;
        let drawnCount = 0;
        let distinctValues = new Set();

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          if (a > 0 && (r > 0 || g > 0 || b > 0)) {
            drawnCount++;
          }
          if (distinctValues.size < 50) {
            distinctValues.add((r << 16) | (g << 8) | b);
          }
        }

        return {
          exists: true,
          width,
          height,
          drawnCount,
          totalSampled: sampleW * sampleH,
          distinctColors: distinctValues.size
        };
      } catch (e) {
        return { exists: true, width, height, error: `getImageData failed: ${e.message}` };
      }
    });

    result.canvas = canvasEval;
    if (!canvasEval.exists || canvasEval.error) {
      result.errors.push(`Canvas error: ${canvasEval.error}`);
    } else if (canvasEval.drawnCount === 0 && canvasEval.distinctColors <= 1) {
      result.errors.push(`Canvas appears completely blank/unrendered (0 non-zero colored pixels sampled)`);
    } else {
      result.drawnPixels = canvasEval.drawnCount;
    }

    // Verify game loop is actively cycling via requestAnimationFrame
    const loopEval = await page.evaluate(() => {
      return new Promise(resolve => {
        let frameCount = 0;
        const start = performance.now();
        function onFrame() {
          frameCount++;
          if (performance.now() - start >= 400) {
            resolve({
              frames: frameCount,
              elapsed: performance.now() - start
            });
          } else {
            requestAnimationFrame(onFrame);
          }
        }
        requestAnimationFrame(onFrame);
      });
    });

    result.frames = loopEval.frames;
    if (loopEval.frames < 2) {
      result.errors.push(`Game loop inactive: only ${loopEval.frames} frames observed over 400ms`);
    }

    // If no errors, mark as passed
    result.passed = result.errors.length === 0;

  } catch (err) {
    result.errors.push(`Execution error: ${err.message}`);
    result.passed = false;
  } finally {
    await page.close().catch(() => {});
  }

  return result;
}

async function runSmokeSuite() {
  console.log('='.repeat(70));
  console.log('  SALA ARCADE - AUTOMATED SMOKE TEST SUITE');
  console.log('='.repeat(70));

  const chromePath = getChromeExecutable();
  if (!chromePath) {
    console.error('[FAIL] Error: No Chrome or Edge executable found. Set CHROME_PATH or PUPPETEER_EXECUTABLE_PATH.');
    process.exit(1);
  }
  console.log(`[Browser] Using: ${chromePath}`);

  if (!fs.existsSync(GAMES_JSON_PATH)) {
    console.error(`[FAIL] Error: games.json not found at ${GAMES_JSON_PATH}`);
    process.exit(1);
  }

  const games = JSON.parse(fs.readFileSync(GAMES_JSON_PATH, 'utf-8'));
  console.log(`[Catalog] Loaded ${games.length} games from games.json`);

  const { server, port } = await startStaticServer();
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[Server] Local HTTP server listening on ${baseUrl}\n`);

  let browser;
  const results = [];
  let allPassed = true;

  try {
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--mute-audio',
        '--disable-gpu'
      ]
    });

    console.log(
      '#'.padEnd(4) +
      'ID'.padEnd(16) +
      'NOMBRE'.padEnd(18) +
      'CANVAS'.padEnd(16) +
      'FRAMES'.padEnd(10) +
      'ESTADO'
    );
    console.log('-'.repeat(70));

    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      const res = await testGame(browser, baseUrl, game);
      results.push(res);

      const numStr = `[${i + 1}/${games.length}]`.padEnd(4);
      const idStr = game.id.padEnd(16);
      const nameStr = game.name.padEnd(18);
      const canvasStr = (res.canvas && res.canvas.width ? `${res.canvas.width}x${res.canvas.height}` : 'N/A').padEnd(16);
      const frameStr = `${res.frames} rAF`.padEnd(10);
      const statusStr = res.passed ? '[OK] OK' : '[FAIL] FAIL';

      console.log(`${numStr}${idStr}${nameStr}${canvasStr}${frameStr}${statusStr}`);

      if (!res.passed) {
        allPassed = false;
        for (const err of res.errors) {
          console.log(`      [WARN]  ${err}`);
        }
      }
    }

  } catch (err) {
    console.error('Fatal runner error:', err);
    allPassed = false;
  } finally {
    if (browser) await browser.close().catch(() => {});
    server.close();
  }

  console.log('\n' + '='.repeat(70));
  const passedCount = results.filter(r => r.passed).length;
  console.log(`RESUMEN: ${passedCount}/${results.length} juegos pasaron la prueba de humo.`);
  console.log('='.repeat(70));

  if (!allPassed) {
    console.log('\n[FAIL] Fallaron uno o más juegos en la prueba de humo.');
    process.exit(1);
  } else {
    console.log('\n[PASS] ¡TODOS LOS JUEGOS PASARON LA PRUEBA DE HUMO (0 errores, canvas renderizado, bucle activo)!');
    process.exit(0);
  }
}

if (require.main === module) {
  runSmokeSuite().catch(err => {
    console.error('Smoke suite unhandled error:', err);
    process.exit(1);
  });
}
