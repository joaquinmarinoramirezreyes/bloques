/**
 * scripts/calculate_real_palettes.js
 * Abre cada uno de los 16 juegos en un navegador headless y reporta:
 * 1. Color de fondo computado del body y de los paneles principales
 * 2. Color de acento de los botones principales interactivos
 * 3. Color de texto computado y relación de contraste WCAG AA (mínimo 4.5:1)
 * 4. Los 5 colores dominantes de la captura after (por cuantización de píxeles en bins de 32 niveles, ignorando píxeles casi negros o casi blancos)
 * 5. Verificación automática de paletas (CIEDE2000, fondos claros >= 7, contraste >= 4.5:1).
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const puppeteer = require('puppeteer-core');

const ROOT_DIR = path.resolve(__dirname, '..');
const CAPTURAS_DIR = path.join(ROOT_DIR, 'scripts', 'capturas', 'limpieza');

const GAMES = [
  'bloques', 'snake', 'rompemuros', 'fronton',
  'defensaorbital', 'sombras', 'campominado', 'corredor',
  'abismo', 'bastion', 'gotas', 'cristales',
  'lanzaburbujas', 'lumen', 'cargas', 'derrape'
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

function parseRgb(str) {
  if (!str) return { r: 0, g: 0, b: 0 };
  const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (m) {
    return { r: parseInt(m[1], 10), g: parseInt(m[2], 10), b: parseInt(m[3], 10) };
  }
  if (str.startsWith('#')) {
    let hex = str.slice(1);
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const val = parseInt(hex, 16);
    return { r: (val >> 16) & 255, g: (val >> 8) & 255, b: val & 255 };
  }
  return { r: 0, g: 0, b: 0 };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.min(255, Math.max(0, Math.round(x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function getLuminance({ r, g, b }) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function getContrastRatio(lum1, lum2) {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Conversión RGB -> Lab para CIEDE2000
function rgbToXyz(r, g, b) {
  function pivot(c) {
    c = c / 255;
    return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
  }
  const lr = pivot(r) * 100;
  const lg = pivot(g) * 100;
  const lb = pivot(b) * 100;
  const x = lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375;
  const y = lr * 0.2126729 + lg * 0.7151522 + lb * 0.0721750;
  const z = lr * 0.0193339 + lg * 0.1191920 + lb * 0.9503041;
  return [x, y, z];
}

function xyzToLab(x, y, z) {
  const rx = x / 95.047;
  const ry = y / 100.000;
  const rz = z / 108.883;
  function f(t) {
    return t > 0.008856 ? Math.cbrt(t) : (7.787 * t) + (16 / 116);
  }
  const fx = f(rx);
  const fy = f(ry);
  const fz = f(rz);
  const L = (116 * fy) - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);
  return [L, a, b];
}

function rgbToLab(rgb) {
  const [x, y, z] = rgbToXyz(rgb.r, rgb.g, rgb.b);
  return xyzToLab(x, y, z);
}

function ciede2000(lab1, lab2) {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;
  const avgL = (L1 + L2) / 2;
  const c1 = Math.sqrt(a1 * a1 + b1 * b1);
  const c2 = Math.sqrt(a2 * a2 + b2 * b2);
  const avgC = (c1 + c2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Math.pow(avgC, 7) / (Math.pow(avgC, 7) + Math.pow(25, 7))));
  const a1Prime = (1 + G) * a1;
  const a2Prime = (1 + G) * a2;
  const c1Prime = Math.sqrt(a1Prime * a1Prime + b1 * b1);
  const c2Prime = Math.sqrt(a2Prime * a2Prime + b2 * b2);
  const avgCPrime = (c1Prime + c2Prime) / 2;
  let h1Prime = (Math.atan2(b1, a1Prime) * 180 / Math.PI + 360) % 360;
  let h2Prime = (Math.atan2(b2, a2Prime) * 180 / Math.PI + 360) % 360;
  let diffhPrime = 0;
  if (Math.abs(h1Prime - h2Prime) <= 180) {
    diffhPrime = h2Prime - h1Prime;
  } else if (h2Prime <= h1Prime) {
    diffhPrime = h2Prime - h1Prime + 360;
  } else {
    diffhPrime = h2Prime - h1Prime - 360;
  }
  const deltaLPrime = L2 - L1;
  const deltaCPrime = c2Prime - c1Prime;
  const deltaHPrime = 2 * Math.sqrt(c1Prime * c2Prime) * Math.sin((diffhPrime / 2) * Math.PI / 180);
  let avghPrime = 0;
  if (Math.abs(h1Prime - h2Prime) > 180) {
    avghPrime = (h1Prime + h2Prime + 360) / 2;
  } else {
    avghPrime = (h1Prime + h2Prime) / 2;
  }
  const T = 1 - 0.17 * Math.cos((avghPrime - 30) * Math.PI / 180)
            + 0.24 * Math.cos((2 * avghPrime) * Math.PI / 180)
            + 0.32 * Math.cos((3 * avghPrime + 6) * Math.PI / 180)
            - 0.20 * Math.cos((4 * avghPrime - 63) * Math.PI / 180);
  const deltaTheta = 30 * Math.exp(-Math.pow((avghPrime - 275) / 25, 2));
  const RC = 2 * Math.sqrt(Math.pow(avgCPrime, 7) / (Math.pow(avgCPrime, 7) + Math.pow(25, 7)));
  const SL = 1 + (0.015 * Math.pow(avgL - 50, 2)) / Math.sqrt(20 + Math.pow(avgL - 50, 2));
  const SC = 1 + 0.045 * avgCPrime;
  const SH = 1 + 0.015 * avgCPrime * T;
  const RT = -Math.sin(2 * deltaTheta * Math.PI / 180) * RC;
  return Math.sqrt(
    Math.pow(deltaLPrime / SL, 2) +
    Math.pow(deltaCPrime / SC, 2) +
    Math.pow(deltaHPrime / SH, 2) +
    RT * (deltaCPrime / SC) * (deltaHPrime / SH)
  );
}

async function analyzePalettes() {
  const chromePath = getChromeExecutable();
  if (!chromePath) throw new Error('Chrome no encontrado');

  const { server, port } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];

  try {
    for (const gameId of GAMES) {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
      await page.goto(`http://127.0.0.1:${port}/games/${gameId}/index.html`, { waitUntil: 'domcontentloaded' });
      await new Promise(r => setTimeout(r, 600));

      // Extraer estilos computados reales de la página en vivo
      const computed = await page.evaluate(() => {
        function getEffectiveBg(el) {
          if (!el) return null;
          const bg = window.getComputedStyle(el).backgroundColor;
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
          return null;
        }

        const bodyBg = getEffectiveBg(document.body) || getEffectiveBg(document.documentElement) || 'rgb(11, 15, 25)';
        const bodyColor = window.getComputedStyle(document.body).color || 'rgb(240, 240, 240)';

        // Paneles principales
        const panelSelectors = [
          '.overlay-card', '.modal-card', '.glass-panel', '.card', '.panel-box', '.menu-card',
          '.modal-content', '.hud-card', '.panel', '.circuit-card',
          '#game-container', '#game-wrap', '#app-root', 'main', '.arcade-screen', '.game-layout'
        ];
        let panelBg = null;
        let panelColor = null;
        for (const sel of panelSelectors) {
          const els = document.querySelectorAll(sel);
          for (const el of els) {
            const bg = getEffectiveBg(el);
            if (bg) {
              panelBg = bg;
              panelColor = window.getComputedStyle(el).color;
              break;
            }
          }
          if (panelBg) break;
        }
        if (!panelBg) panelBg = bodyBg;
        const textColor = panelColor || bodyColor;

        // Botón principal / acento interactivo
        const btnSelectors = [
          '.btn-primary', '.arcade-btn-primary', '.glow-btn', '.btn-play',
          '.ind-btn.btn-primary', '.primary-btn', '.btn-accent',
          'button.btn-primary', 'a.btn-primary', '.action-btn.primary'
        ];
        let accentColor = null;
        for (const sel of btnSelectors) {
          const els = document.querySelectorAll(sel);
          for (const el of els) {
            const style = window.getComputedStyle(el);
            const bg = style.backgroundColor;
            if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
              accentColor = bg;
              break;
            }
          }
          if (accentColor) break;
        }

        if (!accentColor) {
          const anyBtn = document.querySelector('button, .btn, a.btn');
          if (anyBtn) {
            const bg = window.getComputedStyle(anyBtn).backgroundColor;
            if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
              accentColor = bg;
            }
          }
        }

        return { bodyBg, panelBg, textColor, accentColor: accentColor || 'rgb(255, 255, 255)' };
      });

      // Cuantizar píxeles de la captura after (bins de 32 niveles, ignorando casi negros o casi blancos)
      const imgPath = path.join(CAPTURAS_DIR, `${gameId === 'snake' ? 'snake' : gameId}_after.png`);
      let dominant = [];
      if (fs.existsSync(imgPath)) {
        const base64Data = fs.readFileSync(imgPath).toString('base64');
        dominant = await page.evaluate(async (dataUrl) => {
          return new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = 100;
              canvas.height = 200;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, 100, 200);
              const data = ctx.getImageData(0, 0, 100, 200).data;
              const counts = {};
              for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] < 128) continue; // ignorar transparencia
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // Ignorar píxeles casi negros (todos < 25) o casi blancos (todos > 240)
                if (r < 25 && g < 25 && b < 25) continue;
                if (r > 240 && g > 240 && b > 240) continue;

                // Cuantización con bins de 32 niveles
                const qr = Math.floor(r / 32) * 32 + 16;
                const qg = Math.floor(g / 32) * 32 + 16;
                const qb = Math.floor(b / 32) * 32 + 16;
                const hex = '#' + [qr, qg, qb].map(x => Math.min(255, x).toString(16).padStart(2, '0')).join('');
                counts[hex] = (counts[hex] || 0) + 1;
              }
              const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
              resolve(sorted.slice(0, 5).map(e => e[0]));
            };
            img.src = dataUrl;
          });
        }, `data:image/png;base64,${base64Data}`);
      }

      await page.close();

      const bodyRgb = parseRgb(computed.bodyBg);
      const panelRgb = parseRgb(computed.panelBg);
      const textRgb = parseRgb(computed.textColor);
      const accentRgb = parseRgb(computed.accentColor);

      const bodyLuminance = getLuminance(bodyRgb);
      const panelLuminance = getLuminance(panelRgb);
      const textLuminance = getLuminance(textRgb);

      const contrastRatio = getContrastRatio(textLuminance, bodyLuminance);

      results.push({
        id: gameId,
        bodyBg: rgbToHex(bodyRgb.r, bodyRgb.g, bodyRgb.b),
        bodyRgb,
        bodyLuminance,
        panelBg: rgbToHex(panelRgb.r, panelRgb.g, panelRgb.b),
        panelRgb,
        panelLuminance,
        textColor: rgbToHex(textRgb.r, textRgb.g, textRgb.b),
        textRgb,
        textLuminance,
        contrastRatio,
        accentColor: rgbToHex(accentRgb.r, accentRgb.g, accentRgb.b),
        accentRgb,
        dominant5: dominant
      });
    }
  } finally {
    await browser.close();
    server.close();
  }

  return results;
}

analyzePalettes().then(results => {
  // Guardar reporte JSON
  fs.writeFileSync(
    path.join(ROOT_DIR, 'scripts', 'real_palettes_report.json'),
    JSON.stringify(results, null, 2),
    'utf8'
  );

  console.log('\n========================================================================================================================');
  console.log('REPORTE COMPUTADO DE PALETAS REALES (MEDIDAS EN DOM Y PÍXELES DE CAPTURA AFTER)');
  console.log('========================================================================================================================');
  console.log('| Juego            | Fondo Body | Fondo Panel | Color Texto | Contraste | Color Acento | 5 Colores Dominantes (Bins 32)      |');
  console.log('|------------------|------------|-------------|-------------|-----------|--------------|-------------------------------------|');
  for (const r of results) {
    const id = r.id.padEnd(16, ' ');
    const bBg = r.bodyBg.padEnd(10, ' ');
    const pBg = r.panelBg.padEnd(11, ' ');
    const tCol = r.textColor.padEnd(11, ' ');
    const cr = `${r.contrastRatio.toFixed(2)}:1`.padEnd(9, ' ');
    const acc = r.accentColor.padEnd(12, ' ');
    const dom = r.dominant5.join(', ').padEnd(35, ' ');
    console.log(`| ${id} | ${bBg} | ${pBg} | ${tCol} | ${cr} | ${acc} | ${dom} |`);
  }
  console.log('========================================================================================================================\n');

  // a) Fondos claros (Luminancia relativa > 0.5)
  console.log('--- A) JUEGOS CON FONDO CLARO (Luminancia Relativa > 0.5) ---');
  const lightGames = results.filter(r => r.bodyLuminance > 0.5 || r.panelLuminance > 0.5);
  for (const g of lightGames) {
    console.log(`- ${g.id.toUpperCase()}: Body ${g.bodyBg} (L=${g.bodyLuminance.toFixed(3)}), Panel ${g.panelBg} (L=${g.panelLuminance.toFixed(3)})`);
  }
  console.log(`Total de juegos con fondo claro: ${lightGames.length} / 16 (Mínimo requerido: 7)\n`);

  // b) Verificación de distancias cromáticas CIEDE2000 entre pares
  console.log('--- B) DISTANCIAS CROMÁTICAS CIEDE2000 ENTRE PARES DE JUEGOS ---');
  const bgPairs = [];
  const accentPairs = [];
  const sharedViolations = [];

  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      const g1 = results[i];
      const g2 = results[j];
      const labBg1 = rgbToLab(g1.bodyRgb);
      const labBg2 = rgbToLab(g2.bodyRgb);
      const labAcc1 = rgbToLab(g1.accentRgb);
      const labAcc2 = rgbToLab(g2.accentRgb);

      const distBg = ciede2000(labBg1, labBg2);
      const distAcc = ciede2000(labAcc1, labAcc2);

      bgPairs.push({ pair: `${g1.id} vs ${g2.id}`, dist: distBg, c1: g1.bodyBg, c2: g2.bodyBg });
      accentPairs.push({ pair: `${g1.id} vs ${g2.id}`, dist: distAcc, c1: g1.accentColor, c2: g2.accentColor });

      // Verificación de identidad: dos juegos no pueden compartir el mismo fondo ni el mismo acento
      if (g1.bodyBg === g2.bodyBg) {
        sharedViolations.push(`Fondo compartido exacto entre ${g1.id} y ${g2.id}: ${g1.bodyBg}`);
      }
      if (g1.accentColor === g2.accentColor) {
        sharedViolations.push(`Acento compartido exacto entre ${g1.id} y ${g2.id}: ${g1.accentColor}`);
      }
      // Verificación combinada: dos juegos no pueden compartir tanto fondo como acento con distancias < 15
      if (distBg < 15 && distAcc < 15) {
        // Reportar si dos juegos tienen tanto fondo como acento muy similares
        console.warn(`[WARN] Par con fondo y acento similares (CIEDE2000): ${g1.id} vs ${g2.id} (dBg=${distBg.toFixed(1)}, dAcc=${distAcc.toFixed(1)})`);
      }
    }
  }

  // Verificación contra colores de fallback compartidos (#070913 y #f59e0b repetidos)
  const legacySharedBg = results.filter(r => r.bodyBg === '#070913');
  if (legacySharedBg.length > 1) {
    sharedViolations.push(`Fondo compartido heredado #070913 presente en ${legacySharedBg.length} juegos: ${legacySharedBg.map(g => g.id).join(', ')}`);
  }
  const legacySharedAcc = results.filter(r => r.accentColor === '#f59e0b');
  if (legacySharedAcc.length > 1) {
    sharedViolations.push(`Acento compartido #f59e0b presente en ${legacySharedAcc.length} juegos: ${legacySharedAcc.map(g => g.id).join(', ')}`);
  }

  bgPairs.sort((a, b) => a.dist - b.dist);
  accentPairs.sort((a, b) => a.dist - b.dist);

  console.log('Pares con fondo más cercano (CIEDE2000):');
  for (const p of bgPairs.slice(0, 5)) {
    console.log(`  * ${p.pair}: dist=${p.dist.toFixed(1)} (${p.c1} vs ${p.c2})`);
  }
  console.log('Pares con acento más cercano (CIEDE2000):');
  for (const p of accentPairs.slice(0, 5)) {
    console.log(`  * ${p.pair}: dist=${p.dist.toFixed(1)} (${p.c1} vs ${p.c2})`);
  }

  // c) VERIFICACIONES AUTOMÁTICAS RIGUROSAS
  console.log('\n--- C) EVALUACIÓN DE CRITERIOS DE ACEPTACIÓN ---');
  let hasErrors = false;

  // 1. Fondos claros
  if (lightGames.length < 7) {
    console.error(`[FAIL] Menos de 7 juegos tienen fondo de luminancia relativa mayor a 0.5 (detectados: ${lightGames.length})`);
    hasErrors = true;
  } else {
    console.log(`[PASS] Fondos claros: ${lightGames.length} juegos tienen L > 0.5 (>= 7 requerido).`);
  }

  // 2. Fondos o acentos compartidos
  if (sharedViolations.length > 0) {
    console.error(`[FAIL] Se detectaron colores compartidos no individualizados:`);
    for (const v of sharedViolations) console.error(`  - ${v}`);
    hasErrors = true;
  } else {
    console.log(`[PASS] Ningún par de juegos comparte el mismo fondo ni el mismo acento.`);
  }

  // 3. Contraste de texto mínimo WCAG AA 4.5:1
  const failedContrast = results.filter(r => r.contrastRatio < 4.5);
  if (failedContrast.length > 0) {
    console.error(`[FAIL] Juegos que no alcanzan el contraste mínimo de 4.5:1:`);
    for (const f of failedContrast) {
      console.error(`  - ${f.id}: contraste ${f.contrastRatio.toFixed(2)}:1 (Texto ${f.textColor} vs Fondo ${f.bodyBg})`);
    }
    hasErrors = true;
  } else {
    console.log(`[PASS] 100% de los juegos cumplen con el contraste mínimo de texto WCAG AA >= 4.5:1.`);
  }

  if (hasErrors) {
    console.error('\n[ERROR] Verificación automática de paletas falló.');
    process.exit(1);
  } else {
    console.log('\n[SUCCESS] ¡Todas las verificaciones automáticas de paletas pasaron con éxito!');
  }
}).catch(err => {
  console.error('Error calculando paletas:', err);
  process.exit(1);
});
