/**
 * scripts/capture_genuine_before_eras.js
 * Captura las pantallas "before" de era80, era90 y era00 usando
 * exactamente el código ORIGINAL de HEAD vía git show,
 * sin tocar el working tree ni hacer commit/push.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer-core');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'scripts', 'capturas', 'limpieza');

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

// Cargar archivos originales desde HEAD usando git show
function getOriginalFileContent(gitRelPath) {
  try {
    return execSync(`git show HEAD:${gitRelPath}`, { cwd: ROOT_DIR, encoding: 'utf8' });
  } catch (err) {
    return null;
  }
}

const originalFiles = {
  'index.html': getOriginalFileContent('index.html'),
  'menu.css': getOriginalFileContent('menu.css'),
  'menu.js': getOriginalFileContent('menu.js'),
  'games.json': getOriginalFileContent('games.json'),
  'shared/theme.css': getOriginalFileContent('shared/theme.css'),
  'shared/storage.js': getOriginalFileContent('shared/storage.js')
};

function startServerOriginal() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      try {
        let reqPath = decodeURI(req.url.split('?')[0]);
        if (reqPath === '/' || /^\/(80|90|00)\/?$/.test(reqPath)) {
          reqPath = '/index.html';
        } else if (/^\/(80|90|00)\//.test(reqPath)) {
          reqPath = reqPath.replace(/^\/(80|90|00)/, '');
        }

        const normalizedKey = reqPath.replace(/^\//, '');

        // Si tenemos la versión original de HEAD en memoria, servirla directamente
        if (originalFiles[normalizedKey]) {
          const ext = path.extname(reqPath).toLowerCase();
          const mime = MIME_TYPES[ext] || 'text/plain';
          res.writeHead(200, { 'Content-Type': mime });
          res.end(originalFiles[normalizedKey]);
          return;
        }

        // Si es otro archivo (ej. iconos, imágenes), leer de disco
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
  { name: 'era80', url: '/80/' },
  { name: 'era90', url: '/90/' },
  { name: 'era00', url: '/00/' }
];

async function run() {
  console.log('[SHOT] Capturando pantallas "before" genuinas de era80, era90, era00 desde HEAD...');
  const chromePath = getChromeExecutable();
  if (!chromePath) throw new Error('Chrome no encontrado');

  const { server, port } = await startServerOriginal();
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

      const outPath = path.join(OUTPUT_DIR, `${target.name}_before.png`);
      await page.screenshot({ path: outPath });
      console.log(`[OK] [before original] Captura guardada: ${target.name} -> ${outPath}`);
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  // Verificar diferencias entre before y after
  console.log('\n[METRICS] Comparando capturas "before" originales vs "after":');
  for (const target of TARGETS) {
    const beforeP = path.join(OUTPUT_DIR, `${target.name}_before.png`);
    const afterP = path.join(OUTPUT_DIR, `${target.name}_after.png`);
    const beforeBuf = fs.readFileSync(beforeP);
    const afterBuf = fs.readFileSync(afterP);
    const areIdentical = beforeBuf.equals(afterBuf);
    console.log(`  - ${target.name}: Before (${beforeBuf.length} B) vs After (${afterBuf.length} B) -> ¿Son idénticas?: ${areIdentical ? 'SÍ (ERROR)' : 'NO (DIFIEREN CORRECTAMENTE)'}`);
  }
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
