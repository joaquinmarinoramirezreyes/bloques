const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const baseImg = 'C:/Users/Joaquín Ramírez/.gemini/antigravity/brain/91027c6f-2ae9-4fcf-a157-4aa13165dc72/taza_arcade_retro_1792683735601.jpg';
const qrImg = 'C:/Users/Joaquín Ramírez/.gemini/antigravity/brain/91027c6f-2ae9-4fcf-a157-4aa13165dc72/qr-taza.png';

const b64Base = 'data:image/jpeg;base64,' + fs.readFileSync(baseImg).toString('base64');
const b64QR = 'data:image/png;base64,' + fs.readFileSync(qrImg).toString('base64');

// Medidas exactas del área de la pantalla del arcade dentro de la imagen generada (1024x1024):
// La pantalla blanca del arcade está aproximadamente entre X: 345 e Y: 350 con tamaño 330x330
const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1024px;
    height: 1024px;
    background: #091024;
    position: relative;
    overflow: hidden;
  }
  .bg-art {
    position: absolute;
    top: 0; left: 0;
    width: 1024px;
    height: 1024px;
    display: block;
  }
  .qr-real-container {
    position: absolute;
    top: 344px;
    left: 337px;
    width: 350px;
    height: 350px;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    box-shadow: inset 0 0 10px rgba(0,0,0,0.4);
    padding: 10px;
  }
  .qr-real {
    width: 100%;
    height: 100%;
    display: block;
    image-rendering: pixelated;
  }
</style>
</head>
<body>
  <img class="bg-art" src="${b64Base}" alt="Arcade Art" />
  <div class="qr-real-container">
    <img class="qr-real" src="${b64QR}" alt="Real QR" />
  </div>
</body>
</html>
`;

async function main() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 1024, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  const outPath = 'C:/Users/Joaquín Ramírez/.gemini/antigravity/brain/91027c6f-2ae9-4fcf-a157-4aa13165dc72/diseno_final_taza_arcade.png';
  const qrErasPath = 'C:/Users/Joaquín Ramírez/.gemini/antigravity/scratch/bloques/qr-eras/diseno_final_taza_arcade.png';

  await page.screenshot({ path: outPath, type: 'png' });
  fs.copyFileSync(outPath, qrErasPath);
  console.log('Final design rendered successfully to', outPath);
  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
