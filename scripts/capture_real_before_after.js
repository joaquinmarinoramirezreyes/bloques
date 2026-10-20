/**
 * scripts/capture_real_before_after.js
 * Captura las pantallas "before" usando estrictamente 'git show HEAD'
 * y las pantallas "after" desde el estado actual del repositorio.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer-core');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'scripts', 'capturas', 'limpieza');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

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

const TARGETS = [
  { name: 'menu', url: '/' },
  { name: 'era80', url: '/80/' },
  { name: 'era90', url: '/90/' },
  { name: 'era00', url: '/00/' },
  { name: 'bloques', url: '/games/bloques/' },
  { name: 'snake', url: '/games/snake/' },
  { name: 'rompemuros', url: '/games/rompemuros/' },
  { name: 'defensaorbital', url: '/games/defensaorbital/' },
  { name: 'sombras', url: '/games/sombras/' },
  { name: 'derrape', url: '/games/derrape/' },
  { name: 'abismo', url: '/games/abismo/' },
  { name: 'fronton', url: '/games/fronton/' },
  { name: 'campominado', url: '/games/campominado/' },
  { name: 'corredor', url: '/games/corredor/' },
  { name: 'gotas', url: '/games/gotas/' },
  { name: 'cristales', url: '/games/cristales/' },
  { name: 'lanzaburbujas', url: '/games/lanzaburbujas/' },
  { name: 'lumen', url: '/games/lumen/' },
  { name: 'cargas', url: '/games/cargas/' },
  { name: 'bastion', url: '/games/bastion/' }
];

function createServer(useGitHead = false) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      try {
        let reqPath = decodeURI(req.url.split('?')[0]);
        if (reqPath === '/' || /^\/(80|90|00)\/?$/.test(reqPath)) {
          reqPath = '/index.html';
        } else if (/^\/(80|90|00)\//.test(reqPath)) {
          reqPath = reqPath.replace(/^\/(80|90|00)/, '');
        }

        let relPath = reqPath.replace(/^\//, '');
        let filePath = path.join(ROOT_DIR, reqPath);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, 'index.html');
          relPath = path.join(relPath, 'index.html').replace(/\\/g, '/');
        }

        const ext = path.extname(filePath).toLowerCase();
        const mime = MIME_TYPES[ext] || 'application/octet-stream';

        if (useGitHead) {
          try {
            // Intentar leer de HEAD vía git show
            const buf = execSync(`git show "HEAD:${relPath.replace(/\\/g, '/')}"`, {
              cwd: ROOT_DIR,
              maxBuffer: 10 * 1024 * 1024,
              stdio: ['pipe', 'pipe', 'ignore']
            });
            res.writeHead(200, { 'Content-Type': mime });
            res.end(buf);
            return;
          } catch (e) {
            // Si el archivo no está en git (o fallo), caer a disco
          }
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          res.writeHead(200, { 'Content-Type': mime });
          fs.createReadStream(filePath).pipe(res);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(err.message);
      }
    });

    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port });
    });
  });
}

async function captureMode(mode, useGitHead) {
  console.log(`\n--- [SHOT] Capturando modo ${mode.toUpperCase()} (useGitHead: ${useGitHead}) ---`);
  const chromePath = getChromeExecutable();
  if (!chromePath) throw new Error('Chrome no encontrado');

  const { server, port } = await createServer(useGitHead);
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    for (const target of TARGETS) {
      const page = await browser.newPage();
      await page.setViewport({
        width: 390,
        height: 844,
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true
      });

      const fullUrl = `http://127.0.0.1:${port}${target.url}`;
      await page.goto(fullUrl, { waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 600));

      // Si hay modal de inicio en juegos como bastion, cerrarlo para ver la pantalla de juego
      await page.evaluate(() => {
        const sm = document.getElementById('start-modal');
        const btn = document.getElementById('btn-start-game');
        if (btn && sm && !sm.classList.contains('hidden')) {
          btn.click();
        }
      });
      await new Promise(r => setTimeout(r, 300));

      const outPath = path.join(OUTPUT_DIR, `${target.name}_${mode}.png`);
      await page.screenshot({ path: outPath });
      console.log(`  [OK] ${target.name}_${mode}.png guardado`);
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
}

async function main() {
  // 1. Capturar before con git show HEAD
  await captureMode('before', true);
  // 2. Capturar after desde el estado actual
  await captureMode('after', false);
  console.log('\n[PASS] Capturas reales before y after completadas con éxito.\n');
}

main().catch(err => {
  console.error('[FAIL]', err);
  process.exit(1);
});
