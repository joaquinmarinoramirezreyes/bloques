/**
 * middleware.js - Routing Middleware de Vercel
 * Protege las epocas (/80, /90, /00), todos los juegos (/games/*) y el catalogo (/games.json).
 * Solo se accede escaneando el QR de la taza (/acceso?t=..).
 */
import { next } from '@vercel/functions';
import acceso from './lib/acceso.js';
import games from './games.json';

export const config = {
  matcher: [
    '/80', '/80/:path*',
    '/90', '/90/:path*',
    '/00', '/00/:path*',
    '/games/:path*',
    '/games.json',
    '/acceso',
    '/q',
    '/q/:path*',
    '/Q/:path*'
  ]
};

export default async function middleware(request) {
  const result = await acceso.decide(request, process.env, games);
  if (result.kind === 'response') return result.response;
  return next();
}
