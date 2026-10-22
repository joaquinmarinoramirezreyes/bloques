// Verifica la ruta corta /Q/TOKEN del QR de la taza y la densidad del QR.
const acceso = require('../lib/acceso.js');
const QRCode = require('qrcode');
const ENV = { ARCADE_SECRET: 'mi-taza-secreta-2026' };
const BASE = 'https://repositoriodejuegos.vercel.app';
const req = p => new Request(BASE + p);

(async () => {
  const tok = await acceso.tazaToken(ENV.ARCADE_SECRET, ENV);
  const url = `${BASE}/Q/${tok}`.toUpperCase();
  const checks = [];
  const ok = async (p, status) => {
    const r = await acceso.decide(req(p), ENV, []);
    const s = r.kind === 'response' ? r.response.status : 'next';
    checks.push([p, s, s === status]);
  };
  await ok(`/Q/${tok}`, 302);
  await ok(`/q/${tok.toLowerCase()}`, 302);
  await ok(`/Q/AAAAAAAA`, 404);
  await ok(`/Q/${tok.slice(0, 7)}`, 404);
  checks.forEach(c => console.log(c[2] ? 'OK ' : 'FAIL', c[0], c[1]));
  const qr = QRCode.create(url, { errorCorrectionLevel: 'M' });
  console.log('URL:', url, '| largo:', url.length, '| modulos:', qr.modules.size, '| modo:', qr.segments.map(s => s.mode.id).join(','));
  if (checks.some(c => !c[2])) process.exit(1);
})();
