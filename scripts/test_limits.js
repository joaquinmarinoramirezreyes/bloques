const fs = require('fs');

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

// Check distances between pure white, pure yellow, pure cyan, etc. at high luminance
const colors = [
  '#ffffff', // pure white (L=1.0)
  '#ffff00', // yellow (L=0.927, but saturated)
  '#00ffff', // cyan (L=0.787)
  '#ff00ff', // magenta (L=0.284)
];
console.log('White vs Yellow:', ciede2000(hexToLab('#ffffff'), hexToLab('#ffff00')).toFixed(2));
console.log('White vs Cyan:', ciede2000(hexToLab('#ffffff'), hexToLab('#00ffff')).toFixed(2));
