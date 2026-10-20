const fs = require('fs');
const path = require('path');

function inspectBastion() {
  console.log('=== BASTION ===');
  if (fs.existsSync('games/bastion/game.js')) {
    const code = fs.readFileSync('games/bastion/game.js', 'utf8');
    const towerMatches = code.match(/name:\s*['"][^'"]+['"]/g) || [];
    console.log('Bastion names in game.js:', towerMatches);
  }
  if (fs.existsSync('games/bastion/data/reliquias.js')) {
    const rel = fs.readFileSync('games/bastion/data/reliquias.js', 'utf8');
    const relNames = rel.match(/nombre:\s*['"][^'"]+['"]/g) || [];
    console.log('Bastion Reliquias:', relNames);
  }
}

function inspectAbismo() {
  console.log('=== ABISMO ===');
  if (fs.existsSync('games/abismo/game.js')) {
    const code = fs.readFileSync('games/abismo/game.js', 'utf8');
    const match = code.match(/CLASES\s*=\s*\{[\s\S]*?\n\s*\};/);
    if (match) console.log('Abismo Clases snippet:', match[0].slice(0, 300));
  }
  if (fs.existsSync('games/abismo/data/mejoras.js')) {
    const mej = fs.readFileSync('games/abismo/data/mejoras.js', 'utf8');
    const mejNames = mej.match(/nombre:\s*['"][^'"]+['"]/g) || [];
    console.log('Abismo Mejoras:', mejNames);
  }
  if (fs.existsSync('games/abismo/data/meta.js')) {
    const meta = fs.readFileSync('games/abismo/data/meta.js', 'utf8');
    const metaNames = meta.match(/nombre:\s*['"][^'"]+['"]/g) || [];
    console.log('Abismo Meta:', metaNames);
  }
}

function inspectOtherGames() {
  const games = ['corredor', 'cristales', 'gotas', 'lanzaburbujas', 'lumen', 'cargas', 'derrape', 'sombras', 'campominado', 'fronton', 'defensaorbital', 'rompemuros', 'snake', 'bloques'];
  for (const g of games) {
    const p = path.join('games', g, 'game.js');
    if (fs.existsSync(p)) {
      const code = fs.readFileSync(p, 'utf8');
      const ach = code.match(/id:\s*['"][^'"]+['"],\s*(?:name|titulo|title|nombre):\s*['"][^'"]+['"]/g) || [];
      if (ach.length > 0) {
        console.log(`=== ${g.toUpperCase()} Logros/Items ===`, ach.slice(0, 8));
      }
    }
  }
}

inspectBastion();
inspectAbismo();
inspectOtherGames();
