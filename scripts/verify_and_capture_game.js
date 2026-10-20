/**
 * scripts/verify_and_capture_game.js
 * Uso: node scripts/verify_and_capture_game.js <game-id> <relative-url>
 * Ejemplo: node scripts/verify_and_capture_game.js abismo /games/abismo/
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const puppeteer = require('puppeteer-core');

const gameId = process.argv[2] || 'abismo';
const gameUrl = process.argv[3] || `/games/${gameId}/`;

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

async function verifyAndCapture() {
  const { server, port } = await startServer();
  const chromePath = getChromeExecutable();
  if (!chromePath) {
    console.error('No se encontró ejecutable de Chrome');
    server.close();
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const viewports = [
    { width: 360, height: 640, name: '360x640 (móvil estrecho)' },
    { width: 390, height: 844, name: '390x844 (iPhone estándar)' },
    { width: 412, height: 915, name: '412x915 (Android moderno)' },
    { width: 768, height: 1024, name: '768x1024 (tablet vertical)' },
    { width: 844, height: 390, name: '844x390 (móvil horizontal)' }
  ];

  console.log(`\n======================================================`);
  console.log(` VERIFICACIÓN Y CAPTURA: ${gameId.toUpperCase()} (${gameUrl})`);
  console.log(`======================================================`);

  let anyLayoutErrors = false;

  for (const vp of viewports) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height });

    const fullUrl = `http://127.0.0.1:${port}${gameUrl}`;
    await page.goto(fullUrl, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Layout checks
    const layout = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      const hasHScroll = docW > winW + 1;

      // Check interactive elements sizes
      const buttons = Array.from(document.querySelectorAll('button:not(.hidden), a:not(.hidden), [role="button"]'));
      const smallButtons = [];
      buttons.forEach(b => {
        const r = b.getBoundingClientRect();
        // Solo considerar elementos visibles en viewport
        if (r.width > 0 && r.height > 0 && r.top < window.innerHeight && r.bottom > 0) {
          // Si mide menos de 40px en touch target (permitir pequeños micro chips con padding si tienen min touch target)
          if (r.width < 36 || r.height < 36) {
            smallButtons.push({
              tag: b.tagName,
              id: b.id,
              cls: b.className,
              w: Math.round(r.width),
              h: Math.round(r.height),
              text: (b.textContent || '').trim().slice(0, 20)
            });
          }
        }
      });

      return {
        docW,
        winW,
        hasHScroll,
        smallButtonsCount: smallButtons.length,
        smallButtons: smallButtons.slice(0, 5)
      };
    });

    console.log(`\nViewport ${vp.name}:`);
    if (layout.hasHScroll) {
      console.error(`  [FAIL] Scroll horizontal detectado: docWidth=${layout.docW} > winWidth=${layout.winW}`);
      anyLayoutErrors = true;
    } else {
      console.log(`  [OK] Sin scroll horizontal (docWidth: ${layout.docW}px <= winWidth: ${layout.winW}px)`);
    }

    if (layout.smallButtonsCount > 0) {
      console.log(`  [WARN] Botones con zona < 36px: ${layout.smallButtonsCount} (p. ej.: ${layout.smallButtons.map(s => `${s.id || s.cls || s.tag} [${s.w}x${s.h}]`).join(', ')})`);
    } else {
      console.log(`  [OK] Todos los controles interactivos cumplen dimensiones táctiles adecuadas.`);
    }

    // Capture "after" screenshot at 390x844
    if (vp.width === 390 && vp.height === 844) {
      const outPath = path.join(OUTPUT_DIR, `${gameId}_after.png`);
      await page.screenshot({ path: outPath });
      console.log(`  [SHOT] Captura "after" guardada en: ${outPath}`);
    }

    await page.close();
  }

  await browser.close();
  server.close();

  if (anyLayoutErrors) {
    console.error(`\n[FAIL] Se encontraron problemas críticos de layout en ${gameId}.`);
    process.exit(1);
  } else {
    console.log(`\n[OK] Verificación de layout y captura de ${gameId} completada exitosamente.\n`);
  }
}

verifyAndCapture().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
