/**
 * scripts/capture_baseline_limpieza.js
 * Captura las pantallas "before" en resolución 390x844 de:
 * - Menú principal y épocas /80, /90, /00
 * - Los 16 juegos del arcade
 * Guardándolas en scripts/capturas/limpieza/
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
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

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        let reqPath = decodeURI(req.url.split('?')[0]);
        if (reqPath === '/' || /^\/(80|90|00)\/?$/.test(reqPath)) {
          reqPath = '/index.html';
        } else if (/^\/(80|90|00)\//.test(reqPath)) {
          reqPath = reqPath.replace(/^\/(80|90|00)/, '');
        }

        let filePath = path.join(ROOT_DIR, reqPath);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, 'index.html');
        }

        if (!fs.existsSync(filePath)) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const mime = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        fs.createReadStream(filePath).pipe(res);
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(e.message);
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port });
    });
  });
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

async function captureAll(suffix = 'before') {
  console.log(`[SHOT] Iniciando capturas ${suffix} en 390x844...`);
  const chromePath = getChromeExecutable();
  if (!chromePath) {
    console.error('[FAIL] Chrome no encontrado');
    process.exit(1);
  }

  const { server, port } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const filterArg = process.argv[3];
  const selectedTargets = filterArg
    ? TARGETS.filter(t => filterArg.split(',').includes(t.name))
    : TARGETS;

  try {
    for (const target of selectedTargets) {
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

      const outPath = path.join(OUTPUT_DIR, `${target.name}_${suffix}.png`);
      await page.screenshot({ path: outPath });
      console.log(`[OK] [${suffix}] Captura guardada: ${target.name} -> ${outPath}`);
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
  console.log(`\n[PASS] Capturas ${suffix} completadas en ${OUTPUT_DIR}\n`);
}

const arg = process.argv[2] || 'before';
captureAll(arg).catch(err => {
  console.error('Error en capturas:', err);
  process.exit(1);
});
