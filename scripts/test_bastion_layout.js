/**
 * scripts/test_bastion_layout.js
 * Diagnóstico automatizado de layout en navegador headless para Bastión:
 * - Resoluciones: 360x640, 390x844, 412x915, 768x1024, y horizontal (844x390).
 * - Mide solapamientos entre controles con getBoundingClientRect.
 * - Detecta desbordamientos horizontales y elementos que se salen del viewport.
 * - Verifica dimensiones de objetivos táctiles (mínimo 44x44px).
 * - Toma capturas de pantalla y las guarda en scripts/capturas/.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT_DIR = path.resolve(__dirname, '..');
const CAPTURAS_DIR = path.join(__dirname, 'capturas');

if (!fs.existsSync(CAPTURAS_DIR)) {
  fs.mkdirSync(CAPTURAS_DIR, { recursive: true });
}

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

const VIEWPORTS = [
  { name: '360x640', width: 360, height: 640 },
  { name: '390x844', width: 390, height: 844 },
  { name: '412x915', width: 412, height: 915 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '844x390_landscape', width: 844, height: 390 }
];

async function runLayoutDiagnostic(prefix = 'bastion_before') {
  console.log(`[VIEWPORT] Iniciando diagnóstico de layout para Bastión (Prefijo: ${prefix})...\n`);

  const chromePath = getChromeExecutable();
  if (!chromePath) {
    console.error('[FAIL] No se encontró ejecutable de Chrome');
    process.exit(1);
  }

  const { server, port } = await startServer();
  const url = `http://127.0.0.1:${port}/games/bastion/`;

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const allReports = [];

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n=======================================================`);
      console.log(`Evaluando resolución: ${vp.name} (${vp.width}x${vp.height})`);
      console.log(`=======================================================`);

      const page = await browser.newPage();
      await page.setViewport({
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true
      });

      await page.goto(url, { waitUntil: 'networkidle0' });
      // Esperar a que el juego monte
      await page.waitForSelector('#game-canvas');
      await new Promise(r => setTimeout(r, 600));

      // Cerrar el modal de inicio si está presente
      const startModalHidden = await page.evaluate(() => {
        const sm = document.getElementById('start-modal');
        const btn = document.getElementById('btn-start-game');
        if (btn && sm && !sm.classList.contains('hidden')) {
          btn.click();
          return false;
        }
        return true;
      });
      await new Promise(r => setTimeout(r, 300));

      // Tomar captura
      const screenshotPath = path.join(CAPTURAS_DIR, `${prefix}_${vp.name}.png`);
      await page.screenshot({ path: screenshotPath });
      console.log(`[SHOT] Captura guardada en: ${screenshotPath}`);

      // Diagnóstico detallado con getBoundingClientRect
      const metrics = await page.evaluate((vpWidth, vpHeight) => {
        const bodyScrollWidth = document.body.scrollWidth;
        const docScrollWidth = document.documentElement.scrollWidth;
        const hasHorizontalScroll = docScrollWidth > vpWidth || bodyScrollWidth > vpWidth;

        // Elementos clave
        const zoomControls = document.getElementById('touch-zoom-controls');
        const zoomInBtn = document.getElementById('btn-zoom-in');
        const zoomResetBtn = document.getElementById('btn-zoom-reset');
        const zoomOutBtn = document.getElementById('btn-zoom-out');

        const skillSurge = document.getElementById('btn-skill-surge');
        const skillOrbital = document.getElementById('btn-skill-orbital');
        const skillFreeze = document.getElementById('btn-skill-freeze');

        const btnBuildSniper = document.getElementById('btn-build-sniper');
        const startWaveBtn = document.getElementById('btn-start-wave');
        const soundBtn = document.getElementById('btn-sound');
        const pauseBtn = document.getElementById('btn-pause');
        const header = document.querySelector('.game-header');
        const canvas = document.getElementById('game-canvas');
        const hudTop = document.querySelector('.hud-top');

        function getRect(el) {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return {
            x: r.x, y: r.y,
            left: r.left, top: r.top,
            right: r.right, bottom: r.bottom,
            width: r.width, height: r.height,
            visible: r.width > 0 && r.height > 0 && window.getComputedStyle(el).display !== 'none'
          };
        }

        const rects = {
          zoomControls: getRect(zoomControls),
          zoomIn: getRect(zoomInBtn),
          zoomReset: getRect(zoomResetBtn),
          zoomOut: getRect(zoomOutBtn),
          skillSurge: getRect(skillSurge),
          skillOrbital: getRect(skillOrbital),
          skillFreeze: getRect(skillFreeze),
          btnBuildSniper: getRect(btnBuildSniper),
          startWaveBtn: getRect(startWaveBtn),
          soundBtn: getRect(soundBtn),
          pauseBtn: getRect(pauseBtn),
          header: getRect(header),
          canvas: getRect(canvas),
          hudTop: getRect(hudTop)
        };

        // Medir solapamientos
        function checkOverlap(r1, r2) {
          if (!r1 || !r2 || !r1.visible || !r2.visible) return false;
          return !(
            r1.right <= r2.left ||
            r1.left >= r2.right ||
            r1.bottom <= r2.top ||
            r1.top >= r2.bottom
          );
        }

        const overlaps = [];
        // 1. Zoom controls vs Start Wave
        if (checkOverlap(rects.zoomControls, rects.startWaveBtn)) {
          overlaps.push({
            pair: 'zoomControls vs startWaveBtn',
            rect1: rects.zoomControls,
            rect2: rects.startWaveBtn
          });
        }
        // 2. Zoom controls vs skillSurge
        if (checkOverlap(rects.zoomControls, rects.skillSurge)) {
          overlaps.push({
            pair: 'zoomControls vs skillSurge',
            rect1: rects.zoomControls,
            rect2: rects.skillSurge
          });
        }
        // 3. Zoom controls vs btnBuildSniper
        if (checkOverlap(rects.zoomControls, rects.btnBuildSniper)) {
          overlaps.push({
            pair: 'zoomControls vs btnBuildSniper',
            rect1: rects.zoomControls,
            rect2: rects.btnBuildSniper
          });
        }
        // 4. Zoom buttons individuales vs startWaveBtn
        if (checkOverlap(rects.zoomOut, rects.startWaveBtn)) {
          overlaps.push({ pair: 'zoomOutBtn vs startWaveBtn' });
        }

        // Elementos que desbordan el viewport horizontalmente
        const overflowElements = [];
        const allInteractive = Array.from(document.querySelectorAll('button, a, input, .stat-badge, .header-actions'));
        for (const el of allInteractive) {
          // Elementos dentro de carruseles scrollables horizontales con indicador de desbordamiento (como el catálogo de torres)
          if (el.closest('.towers-selector-scroll')) continue;

          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            if (r.right > vpWidth + 1) {
              overflowElements.push({
                tag: el.tagName,
                id: el.id,
                className: el.className,
                right: r.right,
                viewportWidth: vpWidth,
                overflowBy: r.right - vpWidth
              });
            }
          }
        }

        // Comprobación de tamaño táctil mínimo (44x44px)
        const touchTargets = [];
        const buttons = Array.from(document.querySelectorAll('button, .nav-btn'));
        for (const btn of buttons) {
          if (btn.offsetParent !== null) { // visible
            const r = btn.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) {
              const complies = r.width >= 43.5 && r.height >= 43.5;
              touchTargets.push({
                id: btn.id || btn.className,
                width: Math.round(r.width),
                height: Math.round(r.height),
                complies
              });
            }
          }
        }

        return {
          vpWidth,
          vpHeight,
          hasHorizontalScroll,
          docScrollWidth,
          rects,
          overlaps,
          overflowElements,
          touchTargets
        };
      }, vp.width, vp.height);

      console.log(`Scroll horizontal: ${metrics.hasHorizontalScroll ? '[WARN] SÍ (' + metrics.docScrollWidth + 'px > ' + vp.width + 'px)' : '[OK] NO'}`);
      console.log(`Solapamientos detectados: ${metrics.overlaps.length}`);
      metrics.overlaps.forEach(o => {
        console.log(`  - [FAIL] SOLAPAMIENTO: ${o.pair}`);
      });

      console.log(`Elementos desbordados del viewport: ${metrics.overflowElements.length}`);
      metrics.overflowElements.forEach(oe => {
        console.log(`  - [FAIL] DESBORDE: <${oe.tag} id="${oe.id}" class="${oe.className}"> se sale por ${Math.round(oe.overflowBy)}px`);
      });

      const failedTouch = metrics.touchTargets.filter(t => !t.complies);
      console.log(`Botones táctiles con tamaño inferior a 44x44px: ${failedTouch.length} de ${metrics.touchTargets.length}`);
      failedTouch.slice(0, 5).forEach(ft => {
        console.log(`  - [WARN] Táctil reducido: ${ft.id} mide ${ft.width}x${ft.height}px`);
      });

      allReports.push({ vp: vp.name, metrics });
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n=======================================================');
  console.log('Diagnóstico de Layout completado.');
  console.log('=======================================================\n');
  return allReports;
}

if (require.main === module) {
  const prefix = process.argv[2] || 'bastion_before';
  runLayoutDiagnostic(prefix).catch(e => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { runLayoutDiagnostic };
