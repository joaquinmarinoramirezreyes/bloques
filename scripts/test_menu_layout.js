const puppeteer = require('puppeteer-core');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8092;

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
  if (reqPath === '/' || reqPath === '/80' || reqPath === '/90' || reqPath === '/00') {
    reqPath = '/index.html';
  } else if (reqPath.startsWith('/80/') || reqPath.startsWith('/90/') || reqPath.startsWith('/00/')) {
    reqPath = reqPath.replace(/^\/(80|90|00)/, '');
  }

  const filePath = path.join(__dirname, '..', reqPath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

async function run() {
  await new Promise(r => server.listen(PORT, r));
  console.log(`Server listening on port ${PORT}`);

  const executablePath = getChromeExecutable();
  if (!executablePath) {
    throw new Error('Chrome/Edge executable not found');
  }

  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const viewports = [
    { width: 360, height: 640, name: '360x640' },
    { width: 390, height: 844, name: '390x844' },
    { width: 412, height: 915, name: '412x915' },
    { width: 768, height: 1024, name: '768x1024' }
  ];

  const eras = [
    { name: 'Menu General', path: '/' },
    { name: 'Arcade 80', path: '/80' },
    { name: 'Arcade 90', path: '/90' },
    { name: 'Arcade 00', path: '/00' }
  ];

  let totalErrors = 0;

  for (const vp of viewports) {
    console.log(`\n========================================`);
    console.log(`--- Evaluando Viewport ${vp.name} ---`);
    console.log(`========================================`);
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height });

    for (const era of eras) {
      await page.goto(`http://localhost:${PORT}${era.path}`, { waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 200));

      const evaluation = await page.evaluate(() => {
        const issues = [];
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;

        if (scrollWidth > docWidth + 1) {
          issues.push(`Scroll horizontal detectado: scrollWidth=${scrollWidth} > clientWidth=${docWidth}`);
        }

        // Medir elementos interactivos (botones, pestañas de navegación y enlaces de juego)
        const interactives = Array.from(document.querySelectorAll('button, a.play-btn, .era-tab'));
        const smallTargets = [];

        interactives.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) return; // oculto
          // Touch target target: min 44px
          if (rect.height < 44 || rect.width < 44) {
            smallTargets.push({
              tag: el.tagName,
              cls: el.className,
              text: el.textContent.trim().substring(0, 20),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            });
          }
        });

        // Verificar solapamientos entre tarjetas adyacentes
        const cards = Array.from(document.querySelectorAll('.game-card'));
        let overlaps = 0;
        for (let i = 0; i < cards.length; i++) {
          const r1 = cards[i].getBoundingClientRect();
          for (let j = i + 1; j < cards.length; j++) {
            const r2 = cards[j].getBoundingClientRect();
            const overlap = !(
              r1.right <= r2.left ||
              r1.left >= r2.right ||
              r1.bottom <= r2.top ||
              r1.top >= r2.bottom
            );
            if (overlap) {
              overlaps++;
              issues.push(`Solapamiento entre tarjeta ${i} y tarjeta ${j}`);
            }
          }
        }

        // Verificar solapamiento nav/header y primera tarjeta
        const header = document.querySelector('.hub-header');
        const eraNav = document.querySelector('.era-nav');
        if (header && eraNav) {
          const hr = header.getBoundingClientRect();
          const nr = eraNav.getBoundingClientRect();
          if (!(hr.bottom <= nr.top || hr.top >= nr.bottom)) {
            issues.push('Solapamiento entre header y era-nav');
          }
        }

        return {
          issues,
          smallTargets,
          cardCount: cards.length,
          scrollWidth,
          docWidth
        };
      });

      console.log(`\n  [${era.name}] Tarjetas: ${evaluation.cardCount}, Ancho: ${evaluation.docWidth}px, Scroll: ${evaluation.scrollWidth}px`);
      if (evaluation.issues.length > 0) {
        evaluation.issues.forEach(iss => console.log(`    [WARN] ${iss}`));
        totalErrors += evaluation.issues.length;
      } else {
        console.log(`    OK Sin scroll horizontal, sin solapamientos.`);
      }

      if (evaluation.smallTargets.length > 0) {
        evaluation.smallTargets.forEach(st => console.log(`    [WARN] Target pequeño: <${st.tag} class="${st.cls}"> "${st.text}" ${st.width}x${st.height}px`));
      } else {
        console.log(`    OK Todos los controles interactivos cumplen dimensiones táctiles (>=44px).`);
      }
    }
    await page.close();
  }

  await browser.close();
  server.close();

  if (totalErrors > 0) {
    console.error(`\n[FAIL] Se encontraron ${totalErrors} problemas de layout.`);
    process.exit(1);
  } else {
    console.log(`\n[OK] ¡Verificación de layout superada al 100% en todas las resoluciones y épocas!`);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
