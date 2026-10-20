/**
 * scripts/generar-qr.js - Genera el código QR global para imprimir en la taza
 *
 * Uso (PowerShell):
 *   $env:ARCADE_SECRET = "<clave_secreta_igual_a_la_de_vercel>"
 *   node scripts/generar-qr.js https://tu-dominio.vercel.app
 *
 * Salida: qr-taza.png en la raíz (ignorado por git) y en qr-eras/qr-taza.png
 */
'use strict';

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const acceso = require('../lib/acceso.js');

async function main() {
  const base = (process.argv[2] || '').replace(/\/+$/, '');
  const secret = acceso.getSecret(process.env);

  if (!/^https?:\/\//.test(base)) {
    console.error('Uso: node scripts/generar-qr.js https://tu-dominio.vercel.app');
    process.exit(1);
  }
  if (!secret || secret.length < 16) {
    console.error('Falta ARCADE_SECRET (o ERA_SECRET, mínimo 16 caracteres). Debe coincidir con el valor en Vercel.');
    process.exit(1);
  }

  const token = await acceso.qrToken(secret, process.env);
  const url = `${base}/acceso?t=${token}`;

  const outDir = path.resolve(__dirname, '..', 'qr-eras');
  fs.mkdirSync(outDir, { recursive: true });

  const targetPath = path.join(outDir, 'qr-taza.png');
  await QRCode.toFile(targetPath, url, {
    errorCorrectionLevel: 'H', // Alta corrección de error para impresión física en tazas cerámicas
    margin: 2,
    width: 800,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });

  console.log('==========================================================');
  console.log('   CÓDIGO QR GLOBAL PARA LA TAZA GENERADO CON ÉXITO');
  console.log('==========================================================');
  console.log(`URL de destino: ${url}`);
  console.log(`Archivo generado: ${targetPath}`);
  console.log('Este es el QR definitivo para imprimir en la taza.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
