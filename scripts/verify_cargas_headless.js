const puppeteer = require('puppeteer-core');
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const PORT = 8093;

function getChromeExecutable() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;

  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];

  for (const c of candidates) {
    if (c && fs.existsSync(c)) {
      return c;
    }
  }
  return null;
}

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') {
    reqPath = '/index.html';
  }

  const filePath = path.join(__dirname, '..', reqPath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found: ' + reqPath);
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

async function main() {
  console.log('======================================================================');
  console.log('  VERIFICACIÓN HEADLESS DE CARGAS (Storage & Persistencia)');
  console.log('======================================================================\n');

  await new Promise(r => server.listen(PORT, r));
  console.log(`[1/5] Servidor local escuchando en http://localhost:${PORT}`);

  const chromePath = getChromeExecutable();
  assert(chromePath, 'No se encontró ejecutable de Chrome');
  console.log(`[2/5] Chrome encontrado en: ${chromePath}`);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  const pageErrors = [];
  const consoleErrors = [];

  page.on('pageerror', (err) => {
    pageErrors.push(err.toString());
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  console.log('[3/5] Abriendo http://localhost:' + PORT + '/games/cargas/index.html ...');
  await page.goto(`http://localhost:${PORT}/games/cargas/index.html`, { waitUntil: 'networkidle0' });

  // 1. Verificar errores de consola
  const getItemErrors = [...pageErrors, ...consoleErrors].filter(e => e.includes('ArcadeStorage.getItem is not a function') || e.includes('getItem is not a function'));
  assert.strictEqual(getItemErrors.length, 0, `Se encontraron errores de getItem: ${getItemErrors.join('; ')}`);
  console.log('  OK No hay errores de "ArcadeStorage.getItem is not a function".');

  // 2. Verificar existencia de métodos en window.ArcadeStorage
  const storageMethods = await page.evaluate(() => {
    return {
      hasArcadeStorage: typeof window.ArcadeStorage !== 'undefined',
      hasGetItem: typeof window.ArcadeStorage?.getItem === 'function',
      hasSetItem: typeof window.ArcadeStorage?.setItem === 'function',
      hasGet: typeof window.ArcadeStorage?.get === 'function',
      hasSet: typeof window.ArcadeStorage?.set === 'function',
      hasGetJSON: typeof window.ArcadeStorage?.getJSON === 'function'
    };
  });

  assert(storageMethods.hasArcadeStorage, 'window.ArcadeStorage debe existir en Cargas');
  assert(storageMethods.hasGetItem, 'window.ArcadeStorage.getItem debe ser una función');
  assert(storageMethods.hasSetItem, 'window.ArcadeStorage.setItem debe ser una función');
  console.log('  OK window.ArcadeStorage.getItem y setItem están disponibles y activos.');

  // 3. Modificar datos de progreso y guardar
  console.log('\n[4/5] Guardando nuevo progreso (Sector 5, 850 créditos, mejoras)...');
  const savedState = await page.evaluate(() => {
    const testData = {
      version: 2,
      highScore: 9200,
      unlockedWorld: 2,
      unlockedLevel: 5,
      levelStars: { 1: 3, 2: 3, 3: 2, 4: 3, 5: 1 },
      credits: 850,
      upgrades: {
        radius: 2,
        charges: 1,
        speed: 2,
        slide: 1,
        shield: 0
      },
      achievements: { FIRST_STEP: true, COMBO_MASTER: true }
    };

    localStorage.setItem('cargas:v2', JSON.stringify(testData));
    if (window.ArcadeStorage && window.ArcadeStorage.setHighScore) {
      window.ArcadeStorage.setHighScore('cargas:v2', testData.highScore);
    }
    return testData;
  });

  console.log('  OK Datos escritos en almacenamiento local.');

  // 4. Recargar la página y verificar persistencia
  console.log('\n[5/5] Recargando página para verificar persistencia del progreso...');
  await page.reload({ waitUntil: 'networkidle0' });

  const reloadedData = await page.evaluate(() => {
    const raw = localStorage.getItem('cargas:v2');
    const parsed = raw ? JSON.parse(raw) : null;
    const hs = window.ArcadeStorage ? window.ArcadeStorage.getHighScore('cargas:v2') : null;
    return {
      storage: parsed,
      highScore: hs
    };
  });

  assert(reloadedData.storage, 'Los datos deben persistir tras recargar la página');
  assert.strictEqual(reloadedData.storage.unlockedLevel, 5, 'El nivel desbloqueado debe ser 5');
  assert.strictEqual(reloadedData.storage.credits, 850, 'Los créditos deben ser 850');
  assert.strictEqual(reloadedData.storage.upgrades.radius, 2, 'La mejora de radio debe ser 2');
  assert.strictEqual(reloadedData.highScore, 9200, 'El récord en ArcadeStorage debe ser 9200');

  console.log('  [OK] COMPROBACIÓN EXITOSA TRAS RECARGA:');
  console.log(`     - Sector desbloqueado persistido: ${reloadedData.storage.unlockedLevel}`);
  console.log(`     - Créditos de taller persistidos: ${reloadedData.storage.credits}`);
  console.log(`     - Nivel de mejora de radio: ${reloadedData.storage.upgrades.radius}`);
  console.log(`     - Récord en ArcadeStorage: ${reloadedData.highScore} pts`);

  await browser.close();
  server.close();

  console.log('\n======================================================================');
  console.log('  CARGAS VERIFICADO AL 100% EN NAVEGADOR HEADLESS');
  console.log('======================================================================');
}

main().catch(err => {
  console.error('\n[FAIL] ERROR EN LA VERIFICACIÓN:', err);
  if (server) server.close();
  process.exit(1);
});
