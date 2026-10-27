/**
 * scripts/generar-pdfs-qr.js
 * Genera PDFs vectoriales puros listos para Illustrator / CorelDRAW / Imprenta:
 * 1. QR_VECTOR_ESCALA_REAL.pdf -> Hoja con los QRs en vectores a tamaño físico exacto (1.8 cm, 2.0 cm, 2.5 cm, 3.0 cm)
 * 2. QR_VECTOR_SOLO_2CM.pdf -> Arte individual exacto de 2.0 x 2.0 cm (mesa de trabajo exacta para colocar en diseño)
 * 3. GUIA_IMPRESION_QR.pdf -> Guía técnica actualizada con las medidas mínimas (1.8 cm / 2.0 cm) y los vectores incrustados.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const puppeteer = require('puppeteer-core');
const acceso = require('../lib/acceso.js');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function buildSolidFillSvgInline(qrData, margin, fgHex, bgHex, cssSize) {
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
    ? `<rect width="${total}" height="${total}" fill="${bgHex}"/>`
    : '';

  const styleAttr = cssSize ? `style="width:${cssSize};height:${cssSize};display:block;"` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" ${styleAttr} shape-rendering="crispEdges">${bgRect}<path fill="${fgHex}" d="${d}"/></svg>`;
}

async function main() {
  const secret = process.env.ARCADE_SECRET || 'mi-taza-secreta-2026';
  const base = 'https://repositoriodejuegos.vercel.app';
  const token = await acceso.tazaToken(secret, process.env);
  const url = `${base}/Q/${token}`.toUpperCase();

  const outDir = path.resolve(__dirname, '..', 'qr-eras', 'imprenta');
  fs.mkdirSync(outDir, { recursive: true });

  const qrData = QRCode.create(url, { errorCorrectionLevel: 'M' });
  const margin = 4; // 4 módulos de margen blanco (37x37 total)

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // 1) PDF DE PLANILLA VECTORIAL A ESCALA 1:1 REAL (1.8 cm, 2.0 cm, 2.5 cm, 3.0 cm)
  const page1 = await browser.newPage();
  const htmlPlanilla = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<style>
  @page { size: Letter; margin: 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #111827;
    background: #ffffff;
  }
  h1 {
    font-size: 16pt;
    color: #0a1226;
    margin-bottom: 4pt;
    text-transform: uppercase;
  }
  .sub {
    font-size: 9.5pt;
    color: #4b5563;
    margin-bottom: 14pt;
    padding-bottom: 8pt;
    border-bottom: 2px solid #0a1226;
  }
  .notice {
    background: #f3f4f6;
    border-left: 4px solid #0a1226;
    padding: 8pt 12pt;
    font-size: 9.5pt;
    margin-bottom: 16pt;
  }
  .section-title {
    font-size: 11pt;
    font-weight: 700;
    color: #0a1226;
    margin: 12pt 0 8pt 0;
    text-transform: uppercase;
  }
  .row {
    display: flex;
    align-items: flex-end;
    gap: 18mm;
    padding: 10mm;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #fafafa;
    margin-bottom: 10mm;
  }
  .row.dark-bg {
    background: #0a1226;
    color: #ffffff;
  }
  .item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3mm;
  }
  .qr-frame {
    outline: 0.25pt dashed #9ca3af;
  }
  .label {
    font-size: 8.5pt;
    font-weight: 700;
    text-align: center;
  }
  .sublabel {
    font-size: 7.5pt;
    color: #6b7280;
    text-align: center;
  }
  .dark-bg .sublabel {
    color: #cbd5e1;
  }
  .ruler {
    margin-top: 6mm;
    font-size: 8pt;
    color: #374151;
  }
</style>
</head>
<body>
  <h1>Vectores QR en Color Sólido — Escala Real 1:1</h1>
  <div class="sub">Listos para abrir en Adobe Illustrator / CorelDRAW o imprimir a tamaño real (100% sin escalar)</div>

  <div class="notice">
    <strong>Nota para diseño e imprenta:</strong> Todos los códigos QR de este PDF son <strong>vectores puros de curvas cerradas (100% relleno sólido #000000)</strong>, sin mapas de bits ni trazos abiertos. Si imprimes esta hoja al <strong>100% (Tamaño real)</strong>, puedes probar con la cámara del celular directamente qué medida prefieres antes de pasarla a la taza.
  </div>

  <div class="section-title">1. Versión con recuadro blanco integrado (Medida total incluyendo margen blanco)</div>
  <div class="row">
    <div class="item">
      <div class="qr-frame">${buildSolidFillSvgInline(qrData, margin, '#000000', '#FFFFFF', '18mm')}</div>
      <div class="label">1.8 × 1.8 cm</div>
      <div class="sublabel">Mínimo absoluto<br>(DTF UV / Serigrafía)</div>
    </div>
    <div class="item">
      <div class="qr-frame">${buildSolidFillSvgInline(qrData, margin, '#000000', '#FFFFFF', '20mm')}</div>
      <div class="label">2.0 × 2.0 cm</div>
      <div class="sublabel">RECOMENDADO<br>(Sublimación / Taza)</div>
    </div>
    <div class="item">
      <div class="qr-frame">${buildSolidFillSvgInline(qrData, margin, '#000000', '#FFFFFF', '25mm')}</div>
      <div class="label">2.5 × 2.5 cm</div>
      <div class="sublabel">Estándar cómodo<br>(Lectura rápida)</div>
    </div>
    <div class="item">
      <div class="qr-frame">${buildSolidFillSvgInline(qrData, margin, '#000000', '#FFFFFF', '30mm')}</div>
      <div class="label">3.0 × 3.0 cm</div>
      <div class="sublabel">Tamaño grande<br>(Máxima holgura)</div>
    </div>
  </div>

  <div class="section-title">2. Simulación sobre fondo oscuro de la taza (#0A1226) a escala real</div>
  <div class="row dark-bg">
    <div class="item">
      <div>${buildSolidFillSvgInline(qrData, margin, '#000000', '#FFFFFF', '18mm')}</div>
      <div class="label">1.8 × 1.8 cm</div>
      <div class="sublabel">Interior negro: 1.4 cm</div>
    </div>
    <div class="item">
      <div>${buildSolidFillSvgInline(qrData, margin, '#000000', '#FFFFFF', '20mm')}</div>
      <div class="label">2.0 × 2.0 cm</div>
      <div class="sublabel">Interior negro: 1.57 cm</div>
    </div>
    <div class="item">
      <div>${buildSolidFillSvgInline(qrData, margin, '#000000', '#FFFFFF', '25mm')}</div>
      <div class="label">2.5 × 2.5 cm</div>
      <div class="sublabel">Interior negro: 1.96 cm</div>
    </div>
    <div class="item">
      <div>${buildSolidFillSvgInline(qrData, margin, '#000000', '#FFFFFF', '30mm')}</div>
      <div class="label">3.0 × 3.0 cm</div>
      <div class="sublabel">Interior negro: 2.35 cm</div>
    </div>
  </div>

  <div class="section-title">3. Vector sin fondo (Solo módulos negros 100% sólidos para colocar sobre parche blanco propio)</div>
  <div class="row">
    <div class="item">
      <div class="qr-frame">${buildSolidFillSvgInline(qrData, 0, '#000000', null, '14mm')}</div>
      <div class="label">1.4 × 1.4 cm</div>
      <div class="sublabel">(Para caja blanca de 1.8 cm)</div>
    </div>
    <div class="item">
      <div class="qr-frame">${buildSolidFillSvgInline(qrData, 0, '#000000', null, '16mm')}</div>
      <div class="label">1.6 × 1.6 cm</div>
      <div class="sublabel">(Para caja blanca de 2.0 cm)</div>
    </div>
    <div class="item">
      <div class="qr-frame">${buildSolidFillSvgInline(qrData, 0, '#000000', null, '20mm')}</div>
      <div class="label">2.0 × 2.0 cm</div>
      <div class="sublabel">(Para caja blanca de 2.5 cm)</div>
    </div>
    <div class="item">
      <div class="qr-frame">${buildSolidFillSvgInline(qrData, 0, '#000000', null, '50mm')}</div>
      <div class="label">5.0 × 5.0 cm</div>
      <div class="sublabel">(Muestra grande editable)</div>
    </div>
  </div>
</body>
</html>`;

  await page1.setContent(htmlPlanilla, { waitUntil: 'domcontentloaded' });
  const pdfEscalaPath = path.join(outDir, 'QR_VECTOR_ESCALA_REAL.pdf');
  await page1.pdf({
    path: pdfEscalaPath,
    format: 'Letter',
    printBackground: true
  });

  // 2) PDF DE MESA DE TRABAJO EXACTA 2.0 x 2.0 cm (SOLO EL VECTOR PURO)
  const page2 = await browser.newPage();
  const htmlSolo2cm = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: 20mm 20mm; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 20mm; height: 20mm; overflow: hidden; background: #ffffff; }
</style>
</head>
<body>
  ${buildSolidFillSvgInline(qrData, margin, '#000000', '#FFFFFF', '20mm')}
</body>
</html>`;
  await page2.setContent(htmlSolo2cm, { waitUntil: 'domcontentloaded' });
  const pdfSolo2cmPath = path.join(outDir, 'QR_VECTOR_SOLO_2CM.pdf');
  await page2.pdf({
    path: pdfSolo2cmPath,
    width: '20mm',
    height: '20mm',
    printBackground: true
  });

  // 3) ACTUALIZAR GUIA_IMPRESION_QR.pdf CON LAS MEDIDAS MÍNIMAS (2.0 cm / 1.8 cm)
  const page3 = await browser.newPage();
  const disenoPath = path.resolve(__dirname, '..', 'qr-eras', 'diseno_final_taza_arcade.png');
  const disenoB64 = fs.existsSync(disenoPath)
    ? 'data:image/png;base64,' + fs.readFileSync(disenoPath).toString('base64')
    : '';

  const htmlGuia = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<style>
  @page { size: Letter; margin: 14mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #111827;
    background: #ffffff;
    font-size: 10pt;
    line-height: 1.45;
  }
  .header {
    border-bottom: 3px solid #0a1226;
    padding-bottom: 8pt;
    margin-bottom: 14pt;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .header h1 {
    font-size: 15pt;
    color: #0a1226;
    text-transform: uppercase;
  }
  .badge {
    background: #0a1226;
    color: #ffd866;
    padding: 4pt 8pt;
    border-radius: 4px;
    font-weight: 700;
    font-size: 8.5pt;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14pt;
    margin-bottom: 14pt;
  }
  .card {
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 12pt;
    background: #f9fafb;
  }
  .card h2 {
    font-size: 10.5pt;
    color: #0a1226;
    margin-bottom: 8pt;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 4pt;
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
    padding: 10pt;
  }
  .qr-preview img {
    width: 145px;
    height: 145px;
    object-fit: contain;
    border-radius: 6px;
  }
  .caption {
    font-size: 8.5pt;
    color: #4b5563;
    margin-top: 6pt;
    text-align: center;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 14pt;
    font-size: 9.5pt;
  }
  th, td {
    border: 1px solid #d1d5db;
    padding: 6pt 8pt;
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
    padding: 12pt 14pt;
    background: #ffffff;
  }
  .rules h2 {
    font-size: 11pt;
    color: #0a1226;
    margin-bottom: 6pt;
    text-transform: uppercase;
  }
  .rules ul { padding-left: 16pt; }
  .rules li { margin-bottom: 4pt; }
  code {
    background: #e5e7eb;
    padding: 1pt 4pt;
    border-radius: 3px;
    font-family: Consolas, monospace;
    font-size: 9pt;
  }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Guía Técnica de Impresión y Vectores — Taza Sala Arcade</h1>
      <div style="color:#4b5563;font-size:9.5pt;">Especificaciones de tamaño mínimo seguro y vectores en color sólido</div>
    </div>
    <div class="badge">VECTOR 100% SÓLIDO (29×29)</div>
  </div>

  <div class="grid">
    <div class="card">
      <h2>1. Vector en Curvas Cerradas (Color Sólido)</h2>
      <div class="qr-preview">
        ${buildSolidFillSvgInline(qrData, margin, '#000000', '#FFFFFF', '145px')}
        <div class="caption">Vector integrable en Illustrator/CorelDRAW<br>(<code>#000000</code> sólido sobre <code>#FFFFFF</code>)</div>
      </div>
    </div>
    <div class="card">
      <h2>2. Aplicación en Diseño Arcade</h2>
      <div class="qr-preview">
        ${disenoB64 ? `<img src="${disenoB64}" alt="Diseño Taza"/>` : ''}
        <div class="caption">El recuadro blanco de la pantalla funciona como margen de silencio</div>
      </div>
    </div>
  </div>

  <table>
    <tr>
      <th>Medida Mínima Recomendada</th>
      <td>
        <strong>2.0 cm × 2.0 cm</strong> (20 × 20 mm incluyendo el recuadro blanco) para sublimación.<br>
        <em>Mínimo extremo:</em> <strong>1.8 cm × 1.8 cm</strong> si es DTF UV, vinil o serigrafía de alta definición.<br>
        (Los cuadritos negros internos miden <strong>1.6 × 1.6 cm</strong> dentro de la caja blanca de 2.0 cm).
      </td>
    </tr>
    <tr>
      <th>Geometría del Vector</th>
      <td>Matriz simplificada de <strong>29 × 29 módulos</strong> (+ 4 módulos de margen blanco = 37 × 37 unidades). Cada cuadrito mide <strong>0.55 mm</strong> a escala de 2.0 cm.</td>
    </tr>
    <tr>
      <th>Construcción Vectorial</th>
      <td><strong>Polígonos cerrados 100% relleno sólido (compound path)</strong>. Sin líneas/trazos abiertos (strokes), sin degradados ni tramas.</td>
    </tr>
    <tr>
      <th>URL Codificada</th>
      <td><code>${url}</code></td>
    </tr>
  </table>

  <div class="rules">
    <h2>Reglas Clave para que Escanee al Instante en la Taza</h2>
    <ul>
      <li><strong>No bajar de 1.8 cm:</strong> Por debajo de 1.8 cm las cámaras de teléfono batallan para enfocar sobre el brillo curvo de la cerámica. <strong>2.0 × 2.0 cm es la medida ideal más pequeña y segura.</strong></li>
      <li><strong>Color 100% sólido:</strong> Imprimir en negro puro (<code>#000000</code>) sin tramas de semitono ni efectos encima.</li>
      <li><strong>Respetar el margen blanco (Quiet Zone):</strong> Dejar siempre el bordecito blanco de ~2 mm alrededor de los cuadros negros (no recortar al ras).</li>
      <li><strong>No invertir colores:</strong> Mantener siempre los cuadros oscuros sobre fondo blanco.</li>
      <li><strong>Ubicación:</strong> A más de 2 cm del asa sobre la pared cilíndrica lisa.</li>
    </ul>
  </div>
</body>
</html>`;

  await page3.setContent(htmlGuia, { waitUntil: 'domcontentloaded' });
  const pdfGuiaPath = path.join(outDir, 'GUIA_IMPRESION_QR.pdf');
  await page3.pdf({
    path: pdfGuiaPath,
    format: 'Letter',
    printBackground: true
  });

  await browser.close();
  console.log('PDFs generados con éxito:');
  console.log('1.', pdfGuiaPath);
  console.log('2.', pdfEscalaPath);
  console.log('3.', pdfSolo2cmPath);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
