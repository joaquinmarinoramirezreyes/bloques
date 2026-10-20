const palettes = {
  'bloques': { bg: '#efe6d2', text: '#1f2a44', acc: '#c0392b' },
  'snake': { bg: '#1a1200', text: '#ffb000', acc: '#ffd866' },
  'rompemuros': { bg: '#f3d9b1', text: '#4a2412', acc: '#e07a1f' },
  'fronton': { bg: '#0f3d2e', text: '#f4f1e8', acc: '#f2c94c' },
  'defensaorbital': { bg: '#0a1a3a', text: '#e8eefc', acc: '#ff6b4a' },
  'lumen': { bg: '#2a1a10', text: '#f6e7c8', acc: '#ffd27a' },
  'derrape': { bg: '#2b2d31', text: '#f2f2f2', acc: '#ffd400' },
  'sombras': { bg: '#e8e6e1', text: '#111111', acc: '#d33a2c' },
  'campominado': { bg: '#1b4b8a', text: '#f2f6ff', acc: '#9fd3ff' },
  'gotas': { bg: '#f4f7f9', text: '#12303a', acc: '#0fa3a3' },
  'cargas': { bg: '#cfcac2', text: '#2b2b2b', acc: '#ff5a1f' },
  'cristales': { bg: '#eef3f8', text: '#1d2433', acc: '#d6249f' },
  'lanzaburbujas': { bg: '#d9f3f0', text: '#0b3954', acc: '#ff6f59' },
  'corredor': { bg: '#f4c27a', text: '#3a1f0f', acc: '#e4572e' },
  'bastion': { bg: '#2f3a33', text: '#e6dcc3', acc: '#b8860b' },
  'abismo': { bg: '#12070a', text: '#e8dcd0', acc: '#b3122a' }
};

function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return { r: (v>>16)&255, g: (v>>8)&255, b: v&255 };
}

function getLuminance({ r, g, b }) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function contrastRatio(hex1, hex2) {
  const l1 = getLuminance(hexToRgb(hex1));
  const l2 = getLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

console.log('| Juego | Fondo | Texto | Luminancia Fondo | Contraste | >= 4.5:1? |');
console.log('|---|---|---|---|---|---|');
let allPass = true;
for (const [id, p] of Object.entries(palettes)) {
  const lBg = getLuminance(hexToRgb(p.bg));
  const cr = contrastRatio(p.bg, p.text);
  const pass = cr >= 4.5;
  if (!pass) allPass = false;
  console.log('| ' + id.padEnd(15) + ' | ' + p.bg + ' | ' + p.text + ' | ' + lBg.toFixed(3).padStart(6) + ' | ' + cr.toFixed(2).padStart(5) + ':1 | ' + (pass ? 'PASS' : 'FAIL') + ' |');
}
console.log('\nAll pass >= 4.5:1?', allPass);
