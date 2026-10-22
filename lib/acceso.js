/**
 * lib/acceso.js - Logica pura de control de acceso global para la taza (QR)
 *
 * Modelo:
 *   - Un token criptografico global permanente: HMAC-SHA256(ARCADE_SECRET, "qr|arcade|v<version>").
 *   - El QR de la taza apunta a: /acceso?t=<TOKEN_GLOBAL>
 *   - Al escanearlo, el middleware valida el token y entrega una cookie HttpOnly:
 *     HMAC-SHA256(ARCADE_SECRET, "ck|arcade|v<version>").
 *   - Con esa cookie, el usuario tiene acceso TOTAL a la plataforma (todas las epocas y juegos).
 *   - Sin cookie, cualquier intento de entrar directo a /80, /90, /00, /games/* o /games.json
 *     devuelve 404 (o redireccion a /).
 */
'use strict';

const COOKIE_NAME = 'sala_arcade_access';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 año

const enc = new TextEncoder();

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacHex(secret, message) {
  const key = await globalThis.crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await globalThis.crypto.subtle.sign('HMAC', key, enc.encode(message));
  return toHex(sig);
}

function getVersion(env) {
  return String((env && (env.ARCADE_VERSION || env.ERA_VERSION)) || '1');
}

function getSecret(env) {
  return (env && (env.ARCADE_SECRET || env.ERA_SECRET)) || '';
}

async function hmacBytes(secret, message) {
  const key = await globalThis.crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return new Uint8Array(await globalThis.crypto.subtle.sign('HMAC', key, enc.encode(message)));
}

function toBase64Url(bytes) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
    out += alphabet[(n >> 18) & 63] + alphabet[(n >> 12) & 63] + alphabet[(n >> 6) & 63] + alphabet[n & 63];
  }
  return out;
}

// Token corto del QR: 12 bytes (96 bits) del HMAC en base64url = 16 caracteres.
// Mantiene el QR con pocos modulos para que imprima bien en ceramica.
async function qrToken(secret, env) {
  const bytes = await hmacBytes(secret, `qr|arcade|v${getVersion(env)}`);
  return toBase64Url(bytes.slice(0, 12));
}

// Token largo (hex, 64 caracteres) de la version anterior; se sigue aceptando.
function legacyQrToken(secret, env) {
  return hmacHex(secret, `qr|arcade|v${getVersion(env)}`);
}

function cookieValue(secret, env) {
  return hmacHex(secret, `ck|arcade|v${getVersion(env)}`);
}

// Comparacion en tiempo constante (64 caracteres hex)
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(';').forEach(part => {
    const idx = part.indexOf('=');
    if (idx < 0) return;
    out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  });
  return out;
}

async function hasAccess(cookieHeader, secret, env) {
  const cookies = parseCookies(cookieHeader);
  const sent = cookies[COOKIE_NAME];
  if (!sent) return false;
  const expected = await cookieValue(secret, env);
  return safeEqual(sent, expected);
}

function classify(pathname) {
  let p = (pathname || '/').toLowerCase();
  if (p.length > 1) p = p.replace(/\/+$/, '');
  const eraMatch = p.match(/^\/(80|90|00)(?:\/.*)?$/);
  if (eraMatch) return { type: 'era', era: eraMatch[1] };
  const gameMatch = p.match(/^\/games\/([^/]+)(?:\/.*)?$/);
  if (gameMatch) return { type: 'game', id: gameMatch[1] };
  if (p === '/games.json') return { type: 'catalog' };
  if (p === '/acceso' || p === '/q') return { type: 'acceso' };
  return { type: 'other' };
}

function setCookieHeader(value) {
  return `${COOKIE_NAME}=${value}; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`;
}

function notFound() {
  return new Response('Not Found', {
    status: 404,
    headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

/**
 * Decide que hacer con una peticion.
 * Devuelve { kind: 'next' } o { kind: 'response', response }.
 */
async function decide(request, env, games) {
  const secret = getSecret(env);
  const url = new URL(request.url);
  const route = classify(url.pathname);

  if (route.type === 'other') return { kind: 'next' };

  // Falla cerrado: sin secreto configurado nada protegido se sirve
  if (!secret || secret.length < 16) {
    return {
      kind: 'response',
      response: new Response('Servicio no configurado', {
        status: 503,
        headers: { 'Cache-Control': 'no-store' }
      })
    };
  }

  // Ruta de canje del QR de la taza
  if (route.type === 'acceso') {
    const token = url.searchParams.get('t');
    if (!token) return { kind: 'response', response: notFound() };
    const expected = await qrToken(secret, env);
    const legacy = await legacyQrToken(secret, env);
    if (!safeEqual(token, expected) && !safeEqual(token, legacy)) return { kind: 'response', response: notFound() };
    const value = await cookieValue(secret, env);
    return {
      kind: 'response',
      response: new Response(null, {
        status: 302,
        headers: {
          Location: '/',
          'Set-Cookie': setCookieHeader(value),
          'Cache-Control': 'no-store',
          'Referrer-Policy': 'no-referrer'
        }
      })
    };
  }

  // Verificar si tiene la cookie de acceso de la taza
  const authorized = await hasAccess(request.headers.get('cookie'), secret, env);

  if (route.type === 'era') {
    return authorized ? { kind: 'next' } : { kind: 'response', response: notFound() };
  }

  if (route.type === 'game') {
    const game = (games || []).find(g => g.id === route.id);
    if (!game) return { kind: 'response', response: notFound() };
    return authorized ? { kind: 'next' } : { kind: 'response', response: notFound() };
  }

  if (route.type === 'catalog') {
    return {
      kind: 'response',
      response: new Response(JSON.stringify(authorized ? games : []), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'private, no-store'
        }
      })
    };
  }

  return { kind: 'next' };
}

module.exports = {
  COOKIE_NAME,
  getSecret,
  getVersion,
  qrToken,
  cookieValue,
  safeEqual,
  parseCookies,
  hasAccess,
  classify,
  decide
};
