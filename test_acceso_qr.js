// ============================================================================
// PRUEBAS: CONTROL DE ACCESO GLOBAL POR QR DE LA TAZA (lib/acceso.js)
// ============================================================================
'use strict';

const fs = require('fs');
const acceso = require('./lib/acceso.js');
const games = JSON.parse(fs.readFileSync('games.json', 'utf8'));

const SECRET = 'clave-secreta-de-prueba-arcade-123456';
const ENV = { ARCADE_SECRET: SECRET };
const BASE = 'https://sala-arcade.example.com';

let failed = 0;
async function test(name, fn) {
  try {
    await fn();
    console.log(`  OK [PASSED] ${name}`);
  } catch (err) {
    failed++;
    console.error(`  X [FAILED] ${name}`);
    console.error(`    ${err.message}`);
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

function req(path, cookie) {
  return new Request(BASE + path, { headers: cookie ? { cookie } : {} });
}

async function getValidCookie() {
  const val = await acceso.cookieValue(SECRET, ENV);
  return `${acceso.COOKIE_NAME}=${val}`;
}

(async () => {
  console.log('==========================================================');
  console.log('   PRUEBAS DE ACCESO GLOBAL CON QR DE LA TAZA');
  console.log('==========================================================\n');

  await test('Sin cookie: /80, /90, /00 y cualquier juego devuelven 404', async () => {
    for (const p of ['/80', '/80/', '/90', '/00', '/games/bloques/', '/games/bloques/game.js', '/games/lumen/index.html']) {
      const r = await acceso.decide(req(p), ENV, games);
      assert(r.kind === 'response' && r.response.status === 404, `${p} debió dar 404 sin cookie`);
    }
  });

  await test('Ruta pública (/, /shared/*) pasa libremente sin cookie', async () => {
    for (const p of ['/', '/index.html', '/shared/theme.css', '/menu.js', '/menu.css']) {
      const r = await acceso.decide(req(p), ENV, games);
      assert(r.kind === 'next', `${p} debió pasar sin restricciones`);
    }
  });

  await test('QR de la taza válido: 302 a / con cookie de sesión HttpOnly y Secure', async () => {
    const token = await acceso.qrToken(SECRET, ENV);
    const r = await acceso.decide(req(`/acceso?t=${token}`), ENV, games);
    assert(r.kind === 'response' && r.response.status === 302, 'debió redirigir');
    assert(r.response.headers.get('location') === '/', 'debió redirigir a /');
    const sc = r.response.headers.get('set-cookie');
    assert(/HttpOnly/.test(sc) && /Secure/.test(sc) && /SameSite=Lax/.test(sc), 'cookie sin flags de seguridad');
    assert(!sc.includes(token), 'la cookie no debe contener el token del QR plano');
  });

  await test('QR inválido o alterado: 404 sin emitir cookie', async () => {
    const token = await acceso.qrToken(SECRET, ENV);
    const casos = [
      '/acceso',
      '/acceso?t=',
      '/acceso?t=' + 'a'.repeat(64),
      '/acceso?t=' + token.slice(0, -1) + (token.endsWith('0') ? '1' : '0')
    ];
    for (const p of casos) {
      const r = await acceso.decide(req(p), ENV, games);
      assert(r.kind === 'response' && r.response.status === 404, `${p} debió responder 404`);
      assert(!r.response.headers.get('set-cookie'), `${p} no debe emitir cookie`);
    }
  });

  await test('Con la cookie de la taza: acceso total a TODAS las épocas y a TODOS los juegos', async () => {
    const cookie = await getValidCookie();
    assert((await acceso.decide(req('/80', cookie), ENV, games)).kind === 'next', '/80 debió pasar');
    assert((await acceso.decide(req('/90', cookie), ENV, games)).kind === 'next', '/90 debió pasar');
    assert((await acceso.decide(req('/00', cookie), ENV, games)).kind === 'next', '/00 debió pasar');

    for (const g of games) {
      const r = await acceso.decide(req(`/games/${g.id}/`, cookie), ENV, games);
      assert(r.kind === 'next', `juego ${g.id} debió estar disponible con la cookie de la taza`);
    }
  });

  await test('Cookie falsificada o de otro secreto: 404', async () => {
    const falsa = `${acceso.COOKIE_NAME}=${'0'.repeat(64)}`;
    assert((await acceso.decide(req('/80', falsa), ENV, games)).response.status === 404, 'cookie falsa fue aceptada');

    const otroSecreto = await acceso.cookieValue('otro-secreto-diferente-12345678', ENV);
    const cOtro = `${acceso.COOKIE_NAME}=${otroSecreto}`;
    assert((await acceso.decide(req('/80', cOtro), ENV, games)).response.status === 404, 'cookie de otro secreto fue aceptada');
  });

  await test('/games.json entrega catálogo completo sólo con acceso, y vacío sin acceso', async () => {
    let r = await acceso.decide(req('/games.json'), ENV, games);
    assert(r.response.status === 200 && (await r.response.json()).length === 0, 'sin acceso debe responder []');

    const cookie = await getValidCookie();
    r = await acceso.decide(req('/games.json', cookie), ENV, games);
    const lista = await r.response.json();
    assert(lista.length === games.length, 'con acceso debe responder todos los juegos');
  });

  await test('Falla cerrado: sin ARCADE_SECRET configurado las rutas protegidas dan 503', async () => {
    for (const env of [{}, { ARCADE_SECRET: 'corto' }]) {
      for (const p of ['/80', '/games/bloques/', '/games.json', '/acceso?t=xyz']) {
        const r = await acceso.decide(req(p), env, games);
        assert(r.kind === 'response' && r.response.status === 503, `${p} debió dar 503 sin secreto`);
      }
    }
  });

  await test('Normalización: mayúsculas o barras duplicadas no evaden la protección', async () => {
    for (const p of ['/GAMES/Bloques/', '/games/bloques', '/80/', '/80//']) {
      const r = await acceso.decide(req(p), ENV, games);
      assert(r.kind === 'response' && r.response.status === 404, `${p} debió dar 404 sin cookie`);
    }
  });

  await test('El token del QR y el valor de la cookie tienen firmas distintas', async () => {
    const token = await acceso.qrToken(SECRET, ENV);
    const cookie = await acceso.cookieValue(SECRET, ENV);
    assert(token !== cookie, 'el token del QR no debe ser idéntico al valor de cookie');
  });

  console.log('\n==========================================================');
  console.log(failed === 0 ? '   RESULTADO: TODAS LAS PRUEBAS SUPERADAS' : `   RESULTADO: ${failed} PRUEBA(S) FALLARON`);
  console.log('==========================================================\n');
  process.exit(failed === 0 ? 0 : 1);
})();
