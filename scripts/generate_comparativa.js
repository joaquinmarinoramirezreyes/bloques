/**
 * scripts/generate_comparativa.js
 * Genera una sola imagen scripts/capturas/limpieza/comparativa.png
 * con las capturas "after" de los 16 juegos en una cuadrícula 4x4
 * para comparar de un vistazo sus identidades visuales y paletas de color.
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT_DIR = path.resolve(__dirname, '..');
const CAPTURAS_DIR = path.join(ROOT_DIR, 'scripts', 'capturas', 'limpieza');
const OUTPUT_PATH = path.join(CAPTURAS_DIR, 'comparativa.png');

const GAMES = [
  { id: 'bloques', name: 'Bloques', era: 'Era 80', palette: '#efe6d2 / #c0392b' },
  { id: 'snake', name: 'Serpiente', era: 'Era 80', palette: '#1a1200 / #ffd866' },
  { id: 'rompemuros', name: 'Rompe Muros', era: 'Era 80', palette: '#f3d9b1 / #e07a1f' },
  { id: 'fronton', name: 'Frontón', era: 'Era 80', palette: '#0f3d2e / #f2c94c' },

  { id: 'defensaorbital', name: 'Defensa Orbital', era: 'Era 80', palette: '#0a1a3a / #ff6b4a' },
  { id: 'sombras', name: 'Sombras', era: 'Era 80', palette: '#e8e6e1 / #d33a2c' },
  { id: 'campominado', name: 'Campo Minado', era: 'Era 90', palette: '#1b4b8a / #9fd3ff' },
  { id: 'corredor', name: 'Corredor', era: 'Era 90', palette: '#f4c27a / #e4572e' },

  { id: 'abismo', name: 'Abismo', era: 'Era 90', palette: '#12070a / #b3122a' },
  { id: 'bastion', name: 'Bastión', era: 'Era 90', palette: '#2f3a33 / #b8860b' },
  { id: 'gotas', name: 'Gotas', era: 'Era 00', palette: '#f4f7f9 / #0fa3a3' },
  { id: 'cristales', name: 'Cristales', era: 'Era 00', palette: '#eef3f8 / #d6249f' },

  { id: 'lanzaburbujas', name: 'Lanzaburbujas', era: 'Era 00', palette: '#d9f3f0 / #ff6f59' },
  { id: 'lumen', name: 'Lumen', era: 'Era 80', palette: '#2a1a10 / #ffd27a' },
  { id: 'cargas', name: 'Cargas', era: 'Era 90', palette: '#cfcac2 / #ff5a1f' },
  { id: 'derrape', name: 'Derrape', era: 'Era 80', palette: '#2b2d31 / #ffd400' }
];

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

async function generateGrid() {
  const chromePath = getChromeExecutable();
  if (!chromePath) {
    console.error('Chrome executable not found');
    process.exit(1);
  }

  const items = GAMES.map(g => {
    const imgPath = path.join(CAPTURAS_DIR, `${g.id}_after.png`);
    if (!fs.existsSync(imgPath)) {
      throw new Error(`Falta imagen: ${imgPath}`);
    }
    const base64 = fs.readFileSync(imgPath).toString('base64');
    return {
      ...g,
      src: `data:image/png;base64,${base64}`
    };
  });

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Comparativa Visual - 16 Juegos Arcade</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #080b11;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 32px;
      width: 1720px;
    }
    header {
      margin-bottom: 28px;
      border-bottom: 1px solid #1e293b;
      padding-bottom: 16px;
    }
    h1 {
      font-size: 26px;
      font-weight: 700;
      color: #f8fafc;
      letter-spacing: -0.02em;
      margin-bottom: 6px;
    }
    p.subtitle {
      font-size: 14px;
      color: #94a3b8;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 390px);
      gap: 24px;
      justify-content: center;
    }
    .card {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }
    .card-header {
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #131d33;
      border-bottom: 1px solid #1e293b;
    }
    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: #f1f5f9;
    }
    .card-badge {
      font-size: 11px;
      color: #94a3b8;
      background: #1e293b;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 500;
    }
    .card-img-wrap {
      width: 390px;
      height: 480px;
      overflow: hidden;
      background: #000;
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }
    .card-img-wrap img {
      width: 390px;
      height: auto;
      display: block;
    }
    .card-footer {
      padding: 8px 14px;
      background: #0f172a;
      border-top: 1px solid #1e293b;
      font-size: 12px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
    .palette-tag {
      color: #38bdf8;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <header>
    <h1>SALA ARCADE - COMPARATIVA VISUAL DE LOS 16 JUEGOS (AFTER)</h1>
    <p class="subtitle">Validación de identidad propia: paletas sobrias de máximo 5 colores, sin degradados genéricos, sin resplandores ni backdrop-filter.</p>
  </header>
  <div class="grid">
    ${items.map((item, idx) => `
      <div class="card">
        <div class="card-header">
          <span class="card-title">${idx + 1}. ${item.name}</span>
          <span class="card-badge">${item.era}</span>
        </div>
        <div class="card-img-wrap">
          <img src="${item.src}" alt="${item.name}">
        </div>
        <div class="card-footer">
          <span>Paleta:</span>
          <span class="palette-tag">${item.palette}</span>
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>`;

  console.log('Iniciando Puppeteer para renderizar comparativa.png...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1720, height: 2350, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });

  await page.screenshot({
    path: OUTPUT_PATH,
    clip: { x: 0, y: 0, width: 1720, height: 2350 }
  });

  await browser.close();
  console.log(`Comparativa generada con éxito en:\n${OUTPUT_PATH}`);
}

generateGrid().catch(err => {
  console.error('Error generando comparativa:', err);
  process.exit(1);
});
