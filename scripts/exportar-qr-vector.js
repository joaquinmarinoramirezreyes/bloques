/**
 * scripts/exportar-qr-vector.js
 * Exporta el QR de la taza en vectores puros (SVG y EPS con rellenos sólidos cerrados, sin trazos abiertos)
 * y genera la Guía de Impresión en PDF para el taller o imprenta.
 *
 * Uso:
 *   set ARCADE_SECRET=mi-taza-secreta-2026 && node scripts/exportar-qr-vector.js https://repositoriodejuegos.vercel.app
 */
'use strict';

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const puppeteer = require('puppeteer-core');
const acceso = require('../lib/acceso.js');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function hexToRgb01(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return `${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)}`;
}

// Construye un SVG con un único <path fill="..."> de polígonos cerrados (sin strokes)
// Ideal para Illustrator, CorelDRAW, plotters y serigrafía/sublimación.
function buildSolidFillSvg(qrData, margin, fgHex, bgHex) {
  const size = qrData.modules.size;
  const data = qrData.modules.data;
  const total = size + margin * 2;

  let d = '';
  for (let r = 0; r < size; r++) {
    let c = 0;
    while (c < size) {
      if (data[r * size + c]) {
        let run = 1;
        while (c + run < size && data[r * size + (c + run)]) {
          run++;
        }
        const x = c + margin;
        const y = r + margin;
        d += `M${x} ${y}h${run}v1h-${run}z`;
        c += run;
      } else {
        c++;
      }
    }
  }

  const bgRect = bgHex
    ? `  <rect width="${total}" height="${total}" fill="${bgHex}"/>\n`
    : '';

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="1000" height="1000" shape-rendering="crispEdges">`,
    bgRect + `  <path fill="${fgHex}" d="${d}"/>`,
    `</svg>`,
    ''
  ].join('\n');
}

// Construye un archivo EPS vectorial nativo para Illustrator / CorelDRAW
function buildEps(qrData, margin, fgHex, bgHex) {
  const size = qrData.modules.size;
  const data = qrData.modules.data;
  const scale = 20; // 20 pt por módulo
  const total = (size + margin * 2) * scale;

  const lines = [
    '%!PS-Adobe-3.0 EPSF-3.0',
    `%%BoundingBox: 0 0 ${total} ${total}`,
    '%%Title: QR Taza Sala Arcade (Vector Solido)',
    '%%Creator: Sala Arcade Vector Exporter',
    '%%EndComments',
    'gsave'
  ];

  if (bgHex) {
    lines.push(`${hexToRgb01(bgHex)} setrgbcolor`);
    lines.push(`0 0 ${total} ${total} rectfill`);
  }

  lines.push(`${hexToRgb01(fgHex)} setrgbcolor`);

  for (let r = 0; r < size; r++) {
    let c = 0;
    while (c < size) {
      if (data[r * size + c]) {
        let run = 1;
        while (c + run < size && data[r * size + (c + run)]) {
          run++;
        }
        const x = (c + margin) * scale;
        // En EPS el eje Y va de abajo hacia arriba
        const y = (size + margin * 2 - 1 - (r + margin)) * scale;
        lines.push(`${x} ${y} ${run * scale} ${scale} rectfill`);
        c += run;
      } else {
        c++;
      }
    }
  }

  lines.push('grestore');
  lines.push('showpage');
  lines.push('%%EOF');
  return lines.join('\n') + '\n';
}

async function main() {
  const base = (process.argv[2] || '').replace(/\/+$/, '');
  const secret = acceso.getSecret(process.env);
  if (!/^https?:\/\//i.test(base) || !secret) {
    console.error('Uso: ARCADE_SECRET=... node scripts/exportar-qr-vector.js https://dominio');
    process.exit(1);
  }

  const token = await acceso.tazaToken(secret, process.env);
  const url = `${base}/Q/${token}`.toUpperCase();
  const outDir = path.resolve(__dirname, '..', 'qr-eras', 'imprenta');
  fs.mkdirSync(outDir, { recursive: true });

  const qrData = QRCode.create(url, { errorCorrectionLevel: 'M' });
  const margin = 4; // Zona de silencio estándar de 4 módulos

  const variantes = [
    {
      baseName: 'qr-taza-negro-solido',
      fg: '#000000',
      bg: '#FFFFFF',
      desc: 'Negro 100% sólido (#000000) sobre fondo blanco (#FFFFFF) — Recomendado'
    },
    {
      baseName: 'qr-taza-negro-sin-fondo',
      fg: '#000000',
      bg: null,
      desc: 'Negro 100% sólido (#000000) con fondo transparente (solo vectores del código)'
    },
    {
      baseName: 'qr-taza-blanco-sin-fondo',
      fg: '#FFFFFF',
      bg: null,
      desc: 'Blanco 100% sólido (#FFFFFF) con fondo transparente (para serigrafía sobre base clara/parche)'
    },
    {
      baseName: 'qr-taza-azul-marino-solido',
      fg: '#0A1226',
      bg: '#FFFFFF',
      desc: 'Azul marino arcade (#0A1226) sobre fondo blanco (#FFFFFF)'
    }
  ];

  for (const v of variantes) {
    const svgContent = buildSolidFillSvg(qrData, margin, v.fg, v.bg);
    fs.writeFileSync(path.join(outDir, `${v.baseName}.svg`), svgContent, 'utf8');

    const epsContent = buildEps(qrData, margin, v.fg, v.bg);
    fs.writeFileSync(path.join(outDir, `${v.baseName}.eps`), epsContent, 'utf8');
  }

  // Limpiar nombres anteriores si existían para no confundir
  for (const old of ['qr-taza-negro.svg', 'qr-taza-azul-marino.svg']) {
    const p = path.join(outDir, old);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  const guiaMd = `# GUÍA TÉCNICA DE IMPRESIÓN Y VECTORES — QR TAZA SALA ARCADE

## 1. Archivos Vectoriales Incluidos (100% Relleno Sólido / Curvas Cerradas)
Todos los archivos están construidos con **polígonos cerrados de relleno sólido (\`<path fill>\` / \`rectfill\`)**, **sin trazos (\`stroke\`)**, **sin degradados** y **sin transparencias parciales**, listos para abrir en Adobe Illustrator, CorelDRAW o cualquier RIP de impresión:

- **\`qr-taza-negro-solido.svg\` / \`.eps\`**: Color negro puro (\`#000000\` / CMYK 0,0,0,100) sobre recuadro blanco puro (\`#FFFFFF\`). **Opción principal recomendada**.
- **\`qr-taza-negro-sin-fondo.svg\` / \`.eps\`**: Módulos en negro puro (\`#000000\`) con fondo transparente (para colocar sobre parche blanco del diseño).
- **\`qr-taza-azul-marino-solido.svg\` / \`.eps\`**: Módulos en azul marino oscuro del diseño (\`#0A1226\`) sobre fondo blanco (\`#FFFFFF\`).
- **\`qr-taza-blanco-sin-fondo.svg\` / \`.eps\`**: Módulos en blanco puro (\`#FFFFFF\`) sin fondo.

---

## 2. Especificaciones Técnicas del Código QR
- **Contenido codificado**: \`${url}\`
- **Modo de codificación**: Alfanumérico (alta eficiencia, bloques grandes)
- **Tamaño de matriz**: **29 × 29 módulos** (37 × 37 incluyendo la zona de silencio de 4 módulos)
- **Nivel de corrección de error**: **M (15%)** — Equilibrio óptimo entre tamaño de cuadro y tolerancia a curvatura.

---

## 3. Reglas de Impresión en Taza (Sublimación / Serigrafía / DTF UV)
1. **Tamaño físico recomendado en la taza**:
   - **Mínimo absoluto**: \`2.5 cm × 2.5 cm\` (25 mm × 25 mm), incluyendo el borde blanco.
   - **Tamaño ideal**: **\`3.0 cm × 3.0 cm\` a \`3.5 cm × 3.5 cm\`**. A 3.0 cm, cada cuadrito mide casi **1 mm**, por lo que la expansión de tinta por calor en sublimación no junta los cuadros.
2. **Zona de silencio (margen blanco)**:
   - Respetar el margen blanco alrededor de los cuadros de al menos **4 módulos** (ya viene integrado en los vectores con fondo y en el diseño de la maquinita). **No recortar al ras de los cuadros negros**.
3. **Color sólido sin tramado (Halftone)**:
   - Imprimir el QR al **100% de tinta sólida** (sin tramas de semitono, sin sombras internas y sin efectos sobre los cuadros).
4. **Contraste (Positivo obligatorio)**:
   - Mantener siempre **módulos oscuros sobre fondo blanco/claro**. No invertir el QR (cuadros blancos sobre taza negra a veces fallan en lectores de cámara estándar).
5. **Ubicación en la taza (11 oz / 15 oz)**:
   - Colocar en la cara frontal o lateral a **mínimo 2 cm del asa**, donde la pared cilíndrica es uniforme y no tiene deformación de borde.
`;

  const guiaMdPath = path.join(outDir, 'GUIA_IMPRESION_QR.md');
  fs.writeFileSync(guiaMdPath, guiaMd, 'utf8');

  // También generar un PDF visual limpio con el QR vectorial incrustado y la ficha técnica
  if (fs.existsSync(chromePath)) {
    const svgNegro = buildSolidFillSvg(qrData, margin, '#000000', '#FFFFFF');
    const disenoPath = path.resolve(__dirname, '..', 'qr-eras', 'diseno_final_taza_arcade.png');
    const disenoB64 = fs.existsSync(disenoPath)
      ? 'data:image/png;base64,' + fs.readFileSync(disenoPath).toString('base64')
      : '';

    const htmlPdf = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #111827;
    background: #ffffff;
    padding: 32px 40px;
    font-size: 13px;
    line-height: 1.45;
  }
  .header {
    border-bottom: 3px solid #0a1226;
    padding-bottom: 12px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .header h1 {
    font-size: 20px;
    color: #0a1226;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .header .badge {
    background: #0a1226;
    color: #ffd866;
    padding: 4px 10px;
    border-radius: 4px;
    font-weight: 700;
    font-size: 11px;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 20px;
  }
  .card {
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 16px;
    background: #f9fafb;
  }
  .card h2 {
    font-size: 14px;
    color: #0a1226;
    margin-bottom: 10px;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 6px;
    text-transform: uppercase;
  }
  .qr-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    border: 1px dashed #9ca3af;
    border-radius: 6px;
    padding: 12px;
  }
  .qr-preview svg {
    width: 190px;
    height: 190px;
    display: block;
  }
  .qr-preview img {
    width: 190px;
    height: 190px;
    object-fit: contain;
    display: block;
    border-radius: 6px;
  }
  .caption {
    font-size: 11px;
    color: #4b5563;
    margin-top: 8px;
    text-align: center;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 18px;
    font-size: 12.5px;
  }
  th, td {
    border: 1px solid #d1d5db;
    padding: 7px 10px;
    text-align: left;
  }
  th {
    background: #f3f4f6;
    font-weight: 700;
    width: 34%;
  }
  .rules {
    border: 2px solid #0a1226;
    border-radius: 8px;
    padding: 14px 18px;
    background: #ffffff;
  }
  .rules h2 {
    font-size: 14px;
    color: #0a1226;
    margin-bottom: 8px;
    text-transform: uppercase;
  }
  .rules ul {
    padding-left: 18px;
  }
  .rules li {
    margin-bottom: 5px;
  }
  code {
    background: #e5e7eb;
    padding: 1px 5px;
    border-radius: 3px;
    font-family: Consolas, monospace;
    font-size: 12px;
  }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Guía de Impresión y Vectores — Taza Sala Arcade</h1>
      <div style="color:#4b5563;font-size:12px;">Especificaciones para taller de sublimación / serigrafía / imprenta</div>
    </div>
    <div class="badge">VECTOR 100% SÓLIDO (29×29)</div>
  </div>

  <div class="grid">
    <div class="card">
      <h2>1. Código QR Vectorial Puro (Color Sólido)</h2>
      <div class="qr-preview">
        ${svgNegro}
        <div class="caption">Vector en curvas cerradas (<code>#000000</code> sobre <code>#FFFFFF</code>)<br>Escalable a cualquier tamaño sin perder nitidez</div>
      </div>
    </div>
    <div class="card">
      <h2>2. Aplicación en Diseño Arcade</h2>
      <div class="qr-preview">
        ${disenoB64 ? `<img src="${disenoB64}" alt="Diseño Taza"/>` : svgNegro}
        <div class="caption">Vista integrada con marco de silencio blanco respetado</div>
      </div>
    </div>
  </div>

  <table>
    <tr>
      <th>URL Codificada</th>
      <td><code>${url}</code></td>
    </tr>
    <tr>
      <th>Geometría del Vector</th>
      <td>Matriz baja densidad de <strong>29 × 29 módulos</strong> (+ 4 módulos de margen blanco = 37 × 37 unidades)</td>
    </tr>
    <tr>
      <th>Construcción para Imprenta</th>
      <td><strong>Relleno sólido 100% (curvas cerradas / compound path)</strong>. Cero trazos abiertos (strokes), cero degradados.</td>
    </tr>
    <tr>
      <th>Archivos Entregados</th>
      <td>
        <code>qr-taza-negro-solido.svg / .eps</code> (con fondo blanco)<br>
        <code>qr-taza-negro-sin-fondo.svg / .eps</code> (fondo transparente)<br>
        <code>qr-taza-azul-marino-solido.svg / .eps</code> (en tono <code>#0A1226</code>)<br>
        <code>qr-taza-blanco-sin-fondo.svg / .eps</code> (blanco puro)
      </td>
    </tr>
  </table>

  <div class="rules">
    <h2>Checklist de Calidad para la Taza</h2>
    <ul>
      <li><strong>Medida física recomendada:</strong> Imprimir el recuadro del QR de <strong>3.0 × 3.0 cm</strong> (mínimo 2.5 × 2.5 cm). Así cada cuadrito mide casi 1 mm y no se empasta con el calor de la prensa.</li>
      <li><strong>Color sólido puro:</strong> Imprimir en negro 100% sólido (<code>#000000</code>), sin tramas de semitono ni sombras encima.</li>
      <li><strong>Respetar el margen blanco (Quiet Zone):</strong> No recortar el recuadro blanco al ras de los cuadros negros; ese borde blanco es indispensable para que la cámara del celular lo detecte al instante.</li>
      <li><strong>No invertir colores:</strong> Mantener siempre los cuadros oscuros sobre fondo blanco.</li>
      <li><strong>Posición en la taza:</strong> Ubicar a más de 2 cm del asa sobre la zona cilíndrica lisa.</li>
    </ul>
  </div>
</body>
</html>`;

    const browser = await puppeteer.launch({
      executablePath: chromePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(htmlPdf, { waitUntil: 'domcontentloaded' });
    await page.pdf({
      path: path.join(outDir, 'GUIA_IMPRESION_QR.pdf'),
      format: 'Letter',
      printBackground: true
    });
    await browser.close();
  }

  console.log('==========================================================');
  console.log('   PAQUETE DE IMPRENTA Y VECTORES GENERADO CON ÉXITO');
  console.log('==========================================================');
  console.log('Carpeta:', outDir);
  console.log('Archivos:', fs.readdirSync(outDir).join(', '));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
