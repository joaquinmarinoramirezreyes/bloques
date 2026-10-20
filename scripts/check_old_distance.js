const fs = require('fs');
const { hexToLab, ciede2000, palettes } = require('./test_ciede_module.js');

const oldBg = '#070913';
const oldAcc = '#f59e0b';

console.log('--- Distance of each game to old shared #070913 bg ---');
for (const [k, p] of Object.entries(palettes)) {
  const d = ciede2000(hexToLab(p.bg), hexToLab(oldBg));
  console.log(k.padEnd(16), p.bg, d.toFixed(2));
}

console.log('\n--- Distance of each game to old repeated #f59e0b accent ---');
for (const [k, p] of Object.entries(palettes)) {
  const d = ciede2000(hexToLab(p.acc), hexToLab(oldAcc));
  console.log(k.padEnd(16), p.acc, d.toFixed(2));
}
