/**
 * scripts/test_lanzaburbujas_layout.js
 * Verificación automatizada con Puppeteer (navegador headless):
 * 1. Prueba el layout en múltiples resoluciones móviles y tablet (360x640, 390x844, 412x915, 768x1024, 844x390).
 * 2. Comprueba por código que el rectángulo del cañón y de las dos burbujas (actual y siguiente)
 *    NO se solapa con el rectángulo de ningún botón (getBoundingClientRect).
 * 3. Comprueba que todos los botones cumplan la norma ergonómica táctil de al menos 44x44px.
 * 4. Captura pantallas y las almacena en scripts/screenshots/.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT_DIR = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// MIME types para el servidor local
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
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
    '/usr/bin/chromium'
  ];

  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      try {
        const parsedUrl = new URL(req.url, 'http://127.0.0.1');
        let filePath = path.join(ROOT_DIR, decodeURIComponent(parsedUrl.pathname));

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

function rectsOverlap(r1, r2) {
  return !(
    r1.right <= r2.left ||
    r1.left >= r2.right ||
    r1.bottom <= r2.top ||
    r1.top >= r2.bottom
  );
}

async function runLayoutTests() {
  console.log('📱 Iniciando verificación de layout y solapamiento para Lanzaburbujas...\n');

  const chromePath = getChromeExecutable();
  if (!chromePath) {
    throw new Error('No se encontró ejecutable de Google Chrome ni Microsoft Edge.');
  }

  const { server, port } = await startServer();
  const url = `http://127.0.0.1:${port}/games/lanzaburbujas/`;

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const viewports = [
    { name: '360x640 (Móvil Pequeño)', width: 360, height: 640 },
    { name: '390x844 (iPhone 12/13/14)', width: 390, height: 844 },
    { name: '412x915 (Android Moderno)', width: 412, height: 915 },
    { name: '768x1024 (Tablet iPad)', width: 768, height: 1024 },
    { name: '844x390 (Móvil Horizontal)', width: 844, height: 390 }
  ];

  let totalTests = 0;
  let passedTests = 0;
  const failureReports = [];

  try {
    const page = await browser.newPage();

    for (const vp of viewports) {
      console.log(`🔍 Probando viewport: ${vp.name} (${vp.width}x${vp.height})...`);
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });
      await page.goto(url, { waitUntil: 'networkidle0' });

      // Iniciar nivel 1 para tener el cañón y munición activos
      await page.evaluate(() => {
        const lvlBtn = document.querySelector('.level-badge.unlocked');
        if (lvlBtn) lvlBtn.click();
      });

      await new Promise(r => setTimeout(r, 400));

      // Comprobar rectángulos mediante getBoundingClientRect
      const layoutData = await page.evaluate(() => {
        const rects = window.getCannonAndBubbleRects();
        const dockButtons = Array.from(document.querySelectorAll('#launcher-dock button, #launcher-dock .glass-btn'));

        const buttonsData = dockButtons.map(btn => {
          const bRect = btn.getBoundingClientRect();
          return {
            id: btn.id || btn.className,
            title: btn.title || btn.textContent.trim(),
            rect: {
              left: bRect.left,
              right: bRect.right,
              top: bRect.top,
              bottom: bRect.bottom,
              width: bRect.width,
              height: bRect.height
            }
          };
        });

        const canvasRect = document.getElementById('game-canvas').getBoundingClientRect();

        return {
          cannonRect: rects.cannon,
          currentBubbleRect: rects.currentBubble,
          nextBubbleRect: rects.nextBubble,
          buttons: buttonsData,
          canvasRect: {
            left: canvasRect.left,
            right: canvasRect.right,
            top: canvasRect.top,
            bottom: canvasRect.bottom
          }
        };
      });

      // Tomar captura
      const shotPath = path.join(SCREENSHOTS_DIR, `layout_${vp.width}x${vp.height}.png`);
      await page.screenshot({ path: shotPath });
      console.log(`   📸 Captura guardada: ${path.basename(shotPath)}`);

      // Verificar 1: Cañón dentro de los límites visibles del canvas
      totalTests++;
      const c = layoutData.cannonRect;
      const cv = layoutData.canvasRect;
      if (c.left >= cv.left && c.right <= cv.right && c.top >= cv.top && c.bottom <= cv.bottom + 10) {
        passedTests++;
      } else {
        failureReports.push(`[${vp.name}] El cañón queda fuera del canvas visible: cannon=${JSON.stringify(c)}, canvas=${JSON.stringify(cv)}`);
      }

      // Verificar 2: Cero solapamiento entre el cañón y cada botón
      for (const btn of layoutData.buttons) {
        totalTests++;
        const overlapsCannon = rectsOverlap(c, btn.rect);
        if (!overlapsCannon) {
          passedTests++;
        } else {
          failureReports.push(`[${vp.name}] SOLAPAMIENTO: Cañón solapado con botón ${btn.id} (${btn.title})`);
        }

        // Verificar 3: Cero solapamiento con la burbuja actual
        totalTests++;
        const overlapsCurrent = rectsOverlap(layoutData.currentBubbleRect, btn.rect);
        if (!overlapsCurrent) {
          passedTests++;
        } else {
          failureReports.push(`[${vp.name}] SOLAPAMIENTO: Burbuja actual solapada con botón ${btn.id}`);
        }

        // Verificar 4: Cero solapamiento con la siguiente burbuja
        totalTests++;
        const overlapsNext = rectsOverlap(layoutData.nextBubbleRect, btn.rect);
        if (!overlapsNext) {
          passedTests++;
        } else {
          failureReports.push(`[${vp.name}] SOLAPAMIENTO: Siguiente burbuja solapada con botón ${btn.id}`);
        }

        // Verificar 5: Objetivo táctil mínimo de 44x44px
        totalTests++;
        if (btn.rect.width >= 43.5 && btn.rect.height >= 43.5) {
          passedTests++;
        } else {
          failureReports.push(`[${vp.name}] Botón ${btn.id} mide ${btn.rect.width}x${btn.rect.height}px (requerido >= 44x44px)`);
        }
      }

      console.log(`   ✓ Verificación geométrica completada para ${vp.name}\n`);
    }

    await browser.close();
  } finally {
    server.close();
  }

  console.log(`\n======================================================`);
  console.log(`RESULTADO DE COMPROBACIÓN DE LAYOUT Y SOLAPAMIENTOS:`);
  console.log(`Pruebas superadas: ${passedTests} / ${totalTests}`);
  if (failureReports.length > 0) {
    console.error(`\n❌ ERRORES DETECTADOS (${failureReports.length}):`);
    failureReports.forEach(f => console.error(`  - ${f}`));
    process.exit(1);
  } else {
    console.log(`🎉 100% de verificaciones superadas. CERO solapamientos entre cañón/burbujas y botones.`);
    console.log(`======================================================\n`);
  }
}

runLayoutTests().catch(err => {
  console.error('Error fatal ejecutando pruebas de layout:', err);
  process.exit(1);
});
