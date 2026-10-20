const fs = require('fs');
const path = require('path');
const http = require('http');
const puppeteer = require('puppeteer-core');

const ROOT_DIR = path.resolve(__dirname, '..');

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
  return new Promise((resolve) => {
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
      resolve({ server, port: server.address().port });
    });
  });
}

async function auditTouchTargets() {
  const { server, port } = await startServer();
  const chromePath = getChromeExecutable();
  if (!chromePath) {
    console.error('No se encontró Chrome');
    server.close();
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const gamesData = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'games.json'), 'utf-8'));
  const pages = [
    { name: 'Menú Principal', path: '/' },
    { name: 'Menú Era 80', path: '/#80' },
    { name: 'Menú Era 90', path: '/#90' },
    { name: 'Menú Era 00', path: '/#00' },
    ...gamesData.map(g => ({ name: g.name, path: `/${g.folder}/` }))
  ];

  const results = {};

  for (const p of pages) {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 });
    const url = `http://127.0.0.1:${port}${p.path}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });
      await new Promise(r => setTimeout(r, 400));

      const smallControls = await page.evaluate(() => {
        const selector = 'button, a, input, select, textarea, [role="button"], [tabindex="0"]';
        const els = Array.from(document.querySelectorAll(selector));
        const under44 = [];

        els.forEach(el => {
          // ignore hidden or disconnected elements
          if (el.classList.contains('hidden') || el.style.display === 'none' || el.style.visibility === 'hidden') return;
          const rect = el.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) return;
          // check if visible in viewport or reasonable initial scroll
          const isVisible = rect.bottom > 0 && rect.top < window.innerHeight * 2;
          if (!isVisible) return;

          // Check if parent or container or computed style enforces 44px
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;

          const w = Math.round(rect.width * 10) / 10;
          const h = Math.round(rect.height * 10) / 10;

          if (w < 44 || h < 44) {
            under44.push({
              tag: el.tagName.toLowerCase(),
              id: el.id || null,
              className: el.className || null,
              text: (el.textContent || el.value || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 30),
              width: w,
              height: h
            });
          }
        });
        return under44;
      });

      results[p.name] = {
        path: p.path,
        under44Count: smallControls.length,
        controls: smallControls
      };
    } catch (err) {
      results[p.name] = { path: p.path, error: err.message };
    } finally {
      await page.close();
    }
  }

  await browser.close();
  server.close();

  fs.writeFileSync(path.join(ROOT_DIR, 'scripts', 'touch_targets_report.json'), JSON.stringify(results, null, 2), 'utf-8');
  console.log('Auditoría completada. Resumen:');
  for (const [name, data] of Object.entries(results)) {
    if (data.error) {
      console.log(`- ${name}: ERROR (${data.error})`);
    } else if (data.under44Count === 0) {
      console.log(`- ${name}: 0 controles < 44px (100% OK)`);
    } else {
      console.log(`- ${name}: ${data.under44Count} controles < 44px:`);
      data.controls.forEach(c => {
        console.log(`    [${c.width}x${c.height}] <${c.tag}${c.id ? '#' + c.id : ''}${c.className ? '.' + c.className.split(' ').join('.') : ''}> "${c.text}"`);
      });
    }
  }
}

auditTouchTargets().catch(err => {
  console.error(err);
  process.exit(1);
});
