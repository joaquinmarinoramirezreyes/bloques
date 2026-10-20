function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return [ (v >> 16) & 255, (v >> 8) & 255, v & 255 ];
}
function rgbToXyz(r, g, b) {
  function pivot(c) {
    c = c / 255;
    return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
  }
  const lr = pivot(r) * 100;
  const lg = pivot(g) * 100;
  const lb = pivot(b) * 100;
  // D65 standard illuminant
  const x = lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375;
  const y = lr * 0.2126729 + lg * 0.7151522 + lb * 0.0721750;
  const z = lr * 0.0193339 + lg * 0.1191920 + lb * 0.9503041;
  return [x, y, z];
}
function xyzToLab(x, y, z) {
  // D65 reference white
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
function hexToLab(hex) {
  const [r, g, b] = hexToRgb(hex);
  const [x, y, z] = rgbToXyz(r, g, b);
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

const keys = Object.keys(palettes);
let minBgDist = 999, minAccDist = 999;
let minBgPair = '', minAccPair = '';
let bgViolations = [], accViolations = [];

for (let i = 0; i < keys.length; i++) {
  for (let j = i + 1; j < keys.length; j++) {
    const k1 = keys[i], k2 = keys[j];
    const bgD = ciede2000(hexToLab(palettes[k1].bg), hexToLab(palettes[k2].bg));
    const accD = ciede2000(hexToLab(palettes[k1].acc), hexToLab(palettes[k2].acc));
    if (bgD < minBgDist) { minBgDist = bgD; minBgPair = `${k1} vs ${k2} (${bgD.toFixed(2)})`; }
    if (accD < minAccDist) { minAccDist = accD; minAccPair = `${k1} vs ${k2} (${accD.toFixed(2)})`; }
    if (bgD < 15) bgViolations.push(`${k1} vs ${k2}: ${bgD.toFixed(2)}`);
    if (accD < 15) accViolations.push(`${k1} vs ${k2}: ${accD.toFixed(2)}`);
  }
}
console.log('Min BG Dist:', minBgPair);
console.log('Min ACC Dist:', minAccPair);
console.log('BG Violations (<15):', bgViolations);
console.log('ACC Violations (<15):', accViolations);

for (let i = 0; i < keys.length; i++) {
  for (let j = i + 1; j < keys.length; j++) {
    const k1 = keys[i], k2 = keys[j];
    const bgD = ciede2000(hexToLab(palettes[k1].bg), hexToLab(palettes[k2].bg));
    const accD = ciede2000(hexToLab(palettes[k1].acc), hexToLab(palettes[k2].acc));
    if (bgD < 15 && accD < 15) {
      console.log('BOTH < 15:', k1, 'vs', k2, 'bg:', bgD.toFixed(2), 'acc:', accD.toFixed(2));
    }
  }
}

