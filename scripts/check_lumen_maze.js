const fs = require('fs');
const path = require('path');

const gameJs = fs.readFileSync(path.join(__dirname, '../games/lumen/game.js'), 'utf8');

const startIdx = gameJs.indexOf('LEVEL_TEMPLATES: [');
const endIdx = gameJs.indexOf('// ==========================================\r\n  // 2. ESTADO GLOBAL');
const altEnd = gameJs.indexOf('// ==========================================\n  // 2. ESTADO GLOBAL');
const cutEnd = endIdx !== -1 ? endIdx : altEnd;

const code = gameJs.slice(startIdx, cutEnd).trim();
const match = code.match(/LEVEL_TEMPLATES:\s*(\[[\s\S]*\])/);
if (!match) {
  console.error("Match failed");
  process.exit(1);
}

const templates = eval(match[1]);
console.log(`Analyzing ${templates.length} templates:`);

templates.forEach((tmpl, idx) => {
  const rows = tmpl.length;
  const cols = tmpl[0].length;
  let p = null;
  const dots = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = tmpl[r][c];
      if (ch === 'P') p = { r, c };
      if (ch === '.' || ch === 'L') dots.push({ r, c });
    }
  }

  if (!p) {
    console.error(`Template ${idx} has NO player spawn 'P'!`);
    return;
  }

  // BFS from P
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const queue = [p];
  visited[p.r][p.c] = true;

  while (queue.length > 0) {
    const curr = queue.shift();
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of dirs) {
      let nr = curr.r + dr;
      let nc = curr.c + dc;
      // Tunnel wrap on row 9
      if (nr === 9 && (nc < 0 || nc >= cols)) {
        nc = (nc + cols) % cols;
      }
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        if (!visited[nr][nc] && tmpl[nr][nc] !== '#') {
          visited[nr][nc] = true;
          queue.push({ r: nr, c: nc });
        }
      }
    }
  }

  const unreachable = dots.filter(d => !visited[d.r][d.c]);
  console.log(`Template ${idx}: Total dots=${dots.length}, Reachable=${dots.length - unreachable.length}, UNREACHABLE=${unreachable.length}`);
  if (unreachable.length > 0) {
    console.log(`  Unreachable in Template ${idx}:`, unreachable);
  }

  // Check ghost house exit: from (9,7) to (7,7)
  let ghostPathBlocked = false;
  for (let r = 7; r <= 9; r++) {
    if (tmpl[r][7] === '#') ghostPathBlocked = true;
  }
  console.log(`Template ${idx}: Ghost house exit column 7 blocked by wall? ${ghostPathBlocked ? 'YES (BUG!)' : 'No (Clear)'}`);
});

