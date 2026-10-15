const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

function getChromeExecutable() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      try {
        const parsedUrl = new URL(req.url, 'http://127.0.0.1');
        let decodedPath = decodeURIComponent(parsedUrl.pathname);
        let safePath = path.normalize(decodedPath).replace(/^(\.\.[\/\\])+/, '');
        let filePath = path.join(ROOT_DIR, safePath);

        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, 'index.html');
        }

        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      } catch (e) {
        res.writeHead(500);
        res.end(e.message);
      }
    });

    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port });
    });
  });
}

async function main() {
  const { server, port } = await startStaticServer();
  const chromePath = getChromeExecutable();

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 480, height: 800 });

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

  await page.goto(`http://127.0.0.1:${port}/games/cristales/?debug=1`, { waitUntil: 'networkidle0' });

  // Start Level 1
  console.log('Selecting Level 1...');
  await page.evaluate(() => {
    // Click on level 1 badge
    const badge = document.querySelector('.level-badge.unlocked');
    if (badge) badge.click();
  });

  await new Promise(r => setTimeout(r, 600));

  // Let's monitor the board over 20 random valid moves
  for (let turn = 1; turn <= 20; turn++) {
    console.log(`\n--- Turn ${turn} ---`);

    // Get valid move from browser
    const move = await page.evaluate(() => {
      const State = window.CristalesState;
      const CristalesLogic = window.CristalesLogic;
      return CristalesLogic.findAnyValidMove(State.grid);
    });

    if (!move) {
      console.log('No valid move found, skipping turn...');
      continue;
    }

    console.log(`Making move: (${move.r1},${move.c1}) <-> (${move.r2},${move.c2})`);

    // Perform swap by clicking canvas coordinates
    await page.evaluate((m) => {
      const State = window.CristalesState;
      const canvas = document.getElementById('game-canvas');
      const rect = canvas.getBoundingClientRect();
      const cellSize = rect.width / 8;
      
      const clickCell = (r, c) => {
        const x = rect.left + c * cellSize + cellSize / 2;
        const y = rect.top + r * cellSize + cellSize / 2;
        const evt = new PointerEvent('pointerdown', { clientX: x, clientY: y, bubbles: true });
        canvas.dispatchEvent(evt);
      };

      clickCell(m.r1, m.c1);
      clickCell(m.r2, m.c2);
    }, move);

    // Wait for cascading to finish
    let waitCount = 0;
    while (waitCount < 30) {
      await new Promise(r => setTimeout(r, 100));
      const isBusy = await page.evaluate(() => window.CristalesState.isSwapping || window.CristalesState.isCascading);
      if (!isBusy) break;
      waitCount++;
    }

    // Now check grid state after move and verify sync
    const syncOk = await page.evaluate(() => {
      return window.verifyBoardSync();
    });

    if (!syncOk) {
      console.error(`FAILED: Board sync failed after turn ${turn}!`);
      break;
    } else {
      console.log(`Move ${turn} resolved cleanly. Board perfectly synchronized.`);
    }
  }

  await browser.close();
  server.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
