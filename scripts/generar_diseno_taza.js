const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const imgSprite = 'C:/Users/Joaquín Ramírez/.gemini/antigravity/brain/91027c6f-2ae9-4fcf-a157-4aa13165dc72/.user_uploaded/media_1792683342802_050bc957.png';
const imgLevelUp = 'C:/Users/Joaquín Ramírez/.gemini/antigravity/brain/91027c6f-2ae9-4fcf-a157-4aa13165dc72/.user_uploaded/media_1792683351545_fb802585.png';
const imgQR = 'C:/Users/Joaquín Ramírez/.gemini/antigravity/brain/91027c6f-2ae9-4fcf-a157-4aa13165dc72/qr-taza.png';

const b64Sprite = 'data:image/png;base64,' + fs.readFileSync(imgSprite).toString('base64');
const b64LevelUp = 'data:image/png;base64,' + fs.readFileSync(imgLevelUp).toString('base64');
const b64QR = 'data:image/png;base64,' + fs.readFileSync(imgQR).toString('base64');

async function renderDesign(htmlContent, outputPath, width, height) {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: outputPath, type: 'png' });
  await browser.close();
  console.log('Saved to', outputPath);
}

// Creamos un diseño tipo pegatina/etiqueta para la taza (sticker de taza rectangular vertical)
const htmlSticker = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Outfit:wght@600;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 600px;
    height: 900px;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Press Start 2P', monospace;
  }
  .card {
    width: 560px;
    height: 860px;
    background: #0b1329;
    border: 6px solid #f2c94c;
    border-radius: 28px;
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 16px 40px rgba(0,0,0,0.6);
    position: relative;
    overflow: hidden;
  }
  .card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(circle at 50% 30%, rgba(242, 201, 76, 0.12), transparent 70%);
    pointer-events: none;
  }
  .level-up-container {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding-top: 4px;
  }
  .level-up-img {
    max-width: 90%;
    height: auto;
    filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5));
    border-radius: 12px;
  }
  .qr-box {
    background: #ffffff;
    padding: 16px;
    border-radius: 20px;
    border: 4px solid #f2c94c;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  }
  .qr-img {
    width: 280px;
    height: 280px;
    display: block;
  }
  .scan-text {
    font-size: 13px;
    color: #ffd866;
    letter-spacing: 1px;
    text-transform: uppercase;
    text-align: center;
    margin-top: 10px;
    margin-bottom: 2px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.8);
  }
  .sub-text {
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    color: #e8eefc;
    text-align: center;
    letter-spacing: 0.5px;
  }
  .strip-container {
    width: 100%;
    border-radius: 14px;
    overflow: hidden;
    border: 3px solid #f2c94c;
    background: #fbf5e5;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
  }
  .strip-img {
    width: 100%;
    height: auto;
    display: block;
    image-rendering: pixelated;
  }
  .pixel-corners {
    font-size: 10px;
    color: #a0aec0;
    text-align: center;
    font-family: 'Outfit', sans-serif;
    letter-spacing: 1px;
    font-weight: 600;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="level-up-container">
      <img class="level-up-img" src="${b64LevelUp}" alt="LEVEL UP" />
    </div>

    <div class="scan-text">&#9654; ESCANEA PARA JUGAR &#9664;</div>
    
    <div class="qr-box">
      <img class="qr-img" src="${b64QR}" alt="QR Taza" />
    </div>

    <div class="sub-text">SALA ARCADE &bull; 16 JUEGOS CLÁSICOS</div>

    <div class="strip-container">
      <img class="strip-img" src="${b64Sprite}" alt="Pixel Art Strip" />
    </div>

    <div class="pixel-corners">EDICIÓN EXCLUSIVA RETRO</div>
  </div>
</body>
</html>
`;

// Opción 2: Banner panorámico para envolver la taza (Wrap around mug)
const htmlMugWrap = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Outfit:wght@600;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1400px;
    height: 600px;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Press Start 2P', monospace;
  }
  .wrap {
    width: 1360px;
    height: 560px;
    background: #091024;
    border: 6px solid #f2c94c;
    border-radius: 30px;
    padding: 24px 36px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 20px 50px rgba(0,0,0,0.7);
    position: relative;
    overflow: hidden;
  }
  .wrap::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(circle at 20% 50%, rgba(224, 122, 31, 0.15), transparent 60%),
                radial-gradient(circle at 80% 50%, rgba(242, 201, 76, 0.15), transparent 60%);
    pointer-events: none;
  }
  .side-left {
    flex: 1.2;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 24px;
    padding-right: 24px;
  }
  .level-up-img {
    max-width: 90%;
    height: auto;
    filter: drop-shadow(0 6px 12px rgba(0,0,0,0.6));
    border-radius: 12px;
  }
  .strip-container {
    width: 95%;
    border-radius: 14px;
    overflow: hidden;
    border: 3px solid #f2c94c;
    background: #fbf5e5;
    padding: 6px;
  }
  .strip-img {
    width: 100%;
    height: auto;
    display: block;
    image-rendering: pixelated;
  }
  .side-right {
    flex: 0.9;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-left: 3px dashed #3a4b75;
    padding-left: 24px;
    gap: 14px;
  }
  .qr-box {
    background: #ffffff;
    padding: 16px;
    border-radius: 20px;
    border: 5px solid #f2c94c;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  }
  .qr-img {
    width: 270px;
    height: 270px;
    display: block;
  }
  .qr-title {
    font-size: 13px;
    color: #ffd866;
    text-align: center;
    letter-spacing: 1.5px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.8);
  }
  .qr-desc {
    font-family: 'Outfit', sans-serif;
    font-size: 15px;
    color: #e8eefc;
    text-align: center;
    font-weight: 600;
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="side-left">
      <img class="level-up-img" src="${b64LevelUp}" alt="LEVEL UP" />
      <div class="strip-container">
        <img class="strip-img" src="${b64Sprite}" alt="Pixel Art Strip" />
      </div>
    </div>

    <div class="side-right">
      <div class="qr-title">&#9654; SALA ARCADE &#9664;</div>
      <div class="qr-box">
        <img class="qr-img" src="${b64QR}" alt="QR Taza" />
      </div>
      <div class="qr-desc">Escanea con tu móvil para jugar</div>
    </div>
  </div>
</body>
</html>
`;

async function main() {
  const stickerOut = path.resolve('C:/Users/Joaquín Ramírez/.gemini/antigravity/brain/91027c6f-2ae9-4fcf-a157-4aa13165dc72/diseno_taza_vertical.png');
  const wrapOut = path.resolve('C:/Users/Joaquín Ramírez/.gemini/antigravity/brain/91027c6f-2ae9-4fcf-a157-4aa13165dc72/diseno_taza_panoramico.png');

  console.log('Generando diseño vertical (sticker)...');
  await renderDesign(htmlSticker, stickerOut, 600, 900);

  console.log('Generando diseño panorámico (wrap taza)...');
  await renderDesign(htmlMugWrap, wrapOut, 1400, 600);

  console.log('¡Diseños generados con éxito!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
