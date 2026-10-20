/**
 * shared/icons.js - Sistema Centralizado de Iconos Vectoriales para Sala Arcade
 * Proporciona trazados SVG vectoriales de 24x24 dibujados por código con estilo consistente:
 * - Trazo uniforme (stroke-width: 2px, stroke-linecap: round, stroke-linejoin: round)
 * - Compatibilidad con currentColor para heredar temas CSS dinámicos
 * - Helpers para DOM (HTML string o SVGElement) y Canvas 2D (Path2D / pre-renderizado offscreen)
 * - Funciona de forma 100% offline, tanto en navegador como en Node.js
 */
(() => {
  'use strict';

  // Colección de definiciones vectoriales de 24x24
  // stroke: true indica trazo de contorno con 2px; filled: true indica forma con fill
  const ICON_DEFINITIONS = {
    // --- ESTADÍSTICAS Y JUEGO ---
    heart: {
      viewBox: '0 0 24 24',
      paths: ['M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'],
      fill: 'currentColor',
      stroke: false
    },
    coin: {
      viewBox: '0 0 24 24',
      paths: [
        'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z',
        'M12 6a6 6 0 1 0 6 6 6 6 0 0 0-6-6zm0 9a3 3 0 1 1 3-3 3 3 0 0 1-3 3z'
      ],
      fill: 'currentColor',
      stroke: false
    },
    energy: {
      viewBox: '0 0 24 24',
      paths: ['M13 2L3 14h9l-1 8 10-12h-9l1-8z'],
      fill: 'currentColor',
      stroke: false
    },
    zap: {
      viewBox: '0 0 24 24',
      paths: ['M13 2L3 14h9l-1 8 10-12h-9l1-8z'],
      fill: 'currentColor',
      stroke: false
    },
    flag: {
      viewBox: '0 0 24 24',
      paths: ['M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zm0 7v-7'],
      stroke: true,
      fill: 'none'
    },
    speed: {
      viewBox: '0 0 24 24',
      paths: [
        'M12 4a10 10 0 0 0-9.2 14h18.4A10 10 0 0 0 12 4z',
        'M12 12l3-3'
      ],
      stroke: true,
      fill: 'none'
    },
    star: {
      viewBox: '0 0 24 24',
      paths: ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'],
      fill: 'currentColor',
      stroke: false
    },
    starOutline: {
      viewBox: '0 0 24 24',
      paths: ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'],
      stroke: true,
      fill: 'none'
    },
    trophy: {
      viewBox: '0 0 24 24',
      paths: [
        'M6 9V4h12v5a6 6 0 0 1-12 0z',
        'M6 6H3a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4h1',
        'M18 6h3a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4h-1',
        'M12 15v4',
        'M8 19h8v2H8z'
      ],
      stroke: true,
      fill: 'none'
    },
    crown: {
      viewBox: '0 0 24 24',
      paths: ['M2 4l3 12h14l3-12-5 4-5-6-5 6-5-4zm3 14h14v2H5v-2z'],
      fill: 'currentColor',
      stroke: false
    },
    gem: {
      viewBox: '0 0 24 24',
      paths: [
        'M6 3h12l4 6-10 12L2 9l4-6z',
        'M2 9h20',
        'M12 21L7 9 10 3',
        'M12 21l5-12-3-6'
      ],
      stroke: true,
      fill: 'none'
    },
    shard: {
      viewBox: '0 0 24 24',
      paths: ['M12 2L4 12l8 10 8-10L12 2z', 'M12 2v20'],
      stroke: true,
      fill: 'none'
    },
    skull: {
      viewBox: '0 0 24 24',
      paths: [
        'M12 2a8 8 0 0 0-8 8c0 3 2 5.5 4 6.5V19h8v-2.5c2-1 4-3.5 4-6.5a8 8 0 0 0-8-8z',
        'M9 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
        'M15 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
        'M10 19v3h4v-3'
      ],
      stroke: true,
      fill: 'none'
    },
    bomb: {
      viewBox: '0 0 24 24',
      paths: [
        'M11 13a7 7 0 1 0 7-7 7 7 0 0 0-7 7z',
        'M16 6l3-3',
        'M20 2l2 2',
        'M15 3h3v3'
      ],
      stroke: true,
      fill: 'none'
    },
    clock: {
      viewBox: '0 0 24 24',
      paths: [
        'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z',
        'M12 6v6l4 2'
      ],
      stroke: true,
      fill: 'none'
    },

    // --- CONTROLES Y NAVEGACIÓN ---
    soundOn: {
      viewBox: '0 0 24 24',
      paths: [
        'M11 5L6 9H2v6h4l5 4V5z',
        'M15.54 8.46a5 5 0 0 1 0 7.07',
        'M19.07 4.93a10 10 0 0 1 0 14.14'
      ],
      stroke: true,
      fill: 'none'
    },
    soundOff: {
      viewBox: '0 0 24 24',
      paths: [
        'M11 5L6 9H2v6h4l5 4V5z',
        'M23 9l-6 6',
        'M17 9l6 6'
      ],
      stroke: true,
      fill: 'none'
    },
    gear: {
      viewBox: '0 0 24 24',
      paths: [
        'M19.4 13a7.7 7.7 0 0 0 .1-1 7.7 7.7 0 0 0-.1-1l2.1-1.6a.5.5 0 0 0 .1-.6l-2-3.5a.5.5 0 0 0-.6-.2l-2.5 1a7.8 7.8 0 0 0-1.7-1l-.4-2.6a.5.5 0 0 0-.5-.4h-4a.5.5 0 0 0-.5.4l-.4 2.6a7.8 7.8 0 0 0-1.7 1l-2.5-1a.5.5 0 0 0-.6.2l-2 3.5a.5.5 0 0 0 .1.6l2.1 1.6a7.7 7.7 0 0 0-.1 1 7.7 7.7 0 0 0 .1 1l-2.1 1.6a.5.5 0 0 0-.1.6l2 3.5a.5.5 0 0 0 .6.2l2.5-1a7.8 7.8 0 0 0 1.7 1l.4 2.6a.5.5 0 0 0 .5.4h4a.5.5 0 0 0 .5-.4l.4-2.6a7.8 7.8 0 0 0 1.7-1l2.5 1a.5.5 0 0 0 .6-.2l2-3.5a.5.5 0 0 0-.1-.6z',
        'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'
      ],
      stroke: true,
      fill: 'none'
    },
    pause: {
      viewBox: '0 0 24 24',
      paths: ['M6 4h4v16H6z', 'M14 4h4v16h-4z'],
      fill: 'currentColor',
      stroke: false
    },
    play: {
      viewBox: '0 0 24 24',
      paths: ['M8 5v14l11-7z'],
      fill: 'currentColor',
      stroke: false
    },
    restart: {
      viewBox: '0 0 24 24',
      paths: [
        'M1 4v6h6',
        'M3.51 15a9 9 0 1 0 2.13-9.36L1 10'
      ],
      stroke: true,
      fill: 'none'
    },
    map: {
      viewBox: '0 0 24 24',
      paths: [
        'M1 6v15l7-4 8 4 7-4V2l-7 4-8-4-7 4z',
        'M8 2v15',
        'M16 6v15'
      ],
      stroke: true,
      fill: 'none'
    },
    lock: {
      viewBox: '0 0 24 24',
      paths: [
        'M5 11h14v10H5z',
        'M8 11V7a4 4 0 0 1 8 0v4',
        'M12 15v2'
      ],
      stroke: true,
      fill: 'none'
    },
    unlock: {
      viewBox: '0 0 24 24',
      paths: [
        'M5 11h14v10H5z',
        'M8 11V7a4 4 0 0 1 8 0',
        'M12 15v2'
      ],
      stroke: true,
      fill: 'none'
    },
    close: {
      viewBox: '0 0 24 24',
      paths: ['M18 6L6 18', 'M6 6l12 12'],
      stroke: true,
      fill: 'none'
    },
    check: {
      viewBox: '0 0 24 24',
      paths: ['M20 6L9 17l-5-5'],
      stroke: true,
      fill: 'none'
    },
    arrowLeft: {
      viewBox: '0 0 24 24',
      paths: ['M19 12H5', 'M12 19l-7-7 7-7'],
      stroke: true,
      fill: 'none'
    },
    arrowRight: {
      viewBox: '0 0 24 24',
      paths: ['M5 12h14', 'M12 5l7 7-7 7'],
      stroke: true,
      fill: 'none'
    },
    arrowUp: {
      viewBox: '0 0 24 24',
      paths: ['M12 19V5', 'M5 12l7-7 7 7'],
      stroke: true,
      fill: 'none'
    },
    arrowDown: {
      viewBox: '0 0 24 24',
      paths: ['M12 5v14', 'M19 12l-7 7-7-7'],
      stroke: true,
      fill: 'none'
    },

    // --- COMBATE, DEFENSA Y HABILIDADES ---
    tower: {
      viewBox: '0 0 24 24',
      paths: [
        'M5 21h14v-2H5v2z',
        'M7 19l1.5-11h7L17 19H7z',
        'M6 4h3v3H6z',
        'M11 4h2v3h-2z',
        'M15 4h3v3h-3z'
      ],
      stroke: true,
      fill: 'none'
    },
    target: {
      viewBox: '0 0 24 24',
      paths: [
        'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 16a6 6 0 1 1 6-6 6 6 0 0 1-6 6z',
        'M12 8a4 4 0 1 0 4 4 4 4 0 0 0-4-4z',
        'M12 2v2', 'M12 20v2', 'M2 12h2', 'M20 12h2'
      ],
      stroke: true,
      fill: 'none'
    },
    shield: {
      viewBox: '0 0 24 24',
      paths: ['M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z'],
      stroke: true,
      fill: 'none'
    },
    swords: {
      viewBox: '0 0 24 24',
      paths: [
        'M14.5 17.5L3 6V3h3l11.5 11.5',
        'M13 19l2 2 4-4-2-2',
        'M19 5l2 2-7.5 7.5-2-2L19 5z',
        'M5 19l2 2 2-2-2-2-2 2z'
      ],
      stroke: true,
      fill: 'none'
    },
    skill: {
      viewBox: '0 0 24 24',
      paths: [
        'M12 2l2.4 7.4L22 12l-7.6 2.6L12 22l-2.4-7.4L2 12l7.6-2.6L12 2z'
      ],
      fill: 'currentColor',
      stroke: false
    },
    fire: {
      viewBox: '0 0 24 24',
      paths: [
        'M12 2c-.5 2.5-3 4-3 7 0 2.2 1.8 4 4 4s4-1.8 4-4c0-3-2.5-4.5-3-7z',
        'M12 13a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
        'M6.3 10.7C4.9 12.3 4 14.5 4 17a8 8 0 0 0 16 0c0-2.5-.9-4.7-2.3-6.3'
      ],
      stroke: true,
      fill: 'none'
    },
    ice: {
      viewBox: '0 0 24 24',
      paths: [
        'M12 2v20', 'M2 12h20',
        'M4.93 4.93l14.14 14.14',
        'M19.07 4.93L4.93 19.07',
        'M9 4l3-2 3 2',
        'M9 20l3 2 3-2',
        'M4 9l-2 3 2 3',
        'M20 9l2 3-2 3'
      ],
      stroke: true,
      fill: 'none'
    },
    eye: {
      viewBox: '0 0 24 24',
      paths: [
        'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z',
        'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'
      ],
      stroke: true,
      fill: 'none'
    },
    radar: {
      viewBox: '0 0 24 24',
      paths: [
        'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z',
        'M12 6a6 6 0 1 0 6 6 6 6 0 0 0-6-6zm0 4a2 2 0 1 0 2 2 2 2 0 0 0-2-2z',
        'M12 2v10l7 7'
      ],
      stroke: true,
      fill: 'none'
    },
    magnet: {
      viewBox: '0 0 24 24',
      paths: [
        'M4 4v7a8 8 0 0 0 16 0V4h-5v7a3 3 0 0 1-6 0V4H4z',
        'M4 8h5', 'M15 8h5'
      ],
      stroke: true,
      fill: 'none'
    },
    shoe: {
      viewBox: '0 0 24 24',
      paths: [
        'M4 18h16v-3l-5-2-3-4H6v6l-2 3z'
      ],
      stroke: true,
      fill: 'none'
    },
    flask: {
      viewBox: '0 0 24 24',
      paths: [
        'M9 3h6v2h-1v4.5l5 8.5a2 2 0 0 1-1.7 3H6.7a2 2 0 0 1-1.7-3l5-8.5V5H9V3z',
        'M7 16h10'
      ],
      stroke: true,
      fill: 'none'
    },
    chart: {
      viewBox: '0 0 24 24',
      paths: [
        'M3 3v18h18',
        'M18 9l-5 5-4-4-4 4'
      ],
      stroke: true,
      fill: 'none'
    },
    drop: {
      viewBox: '0 0 24 24',
      paths: ['M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z'],
      stroke: true,
      fill: 'none'
    },
    car: {
      viewBox: '0 0 24 24',
      paths: [
        'M5 17h14v-4l-2-6H7L5 13v4z',
        'M7 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm14 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
        'M6 13h12'
      ],
      stroke: true,
      fill: 'none'
    },
    alien: {
      viewBox: '0 0 24 24',
      paths: [
        'M12 2C6.5 2 2 6.5 2 12c0 3.5 1.8 6.6 4.6 8.4l1.4-2.4C6.2 16.6 5 14.4 5 12c0-3.9 3.1-7 7-7s7 3.1 7 7c0 2.4-1.2 4.6-3 6l1.4 2.4C20.2 18.6 22 15.5 22 12c0-5.5-4.5-10-10-10z',
        'M8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'
      ],
      stroke: true,
      fill: 'none'
    },
    brick: {
      viewBox: '0 0 24 24',
      paths: [
        'M3 4h18v16H3V4z',
        'M3 9h18', 'M3 14h18',
        'M12 4v5', 'M8 9v5', 'M16 9v5', 'M12 14v6'
      ],
      stroke: true,
      fill: 'none'
    },
    plus: {
      viewBox: '0 0 24 24',
      paths: ['M12 5v14', 'M5 12h14'],
      stroke: true,
      fill: 'none'
    },
    minus: {
      viewBox: '0 0 24 24',
      paths: ['M5 12h14'],
      stroke: true,
      fill: 'none'
    },
    search: {
      viewBox: '0 0 24 24',
      paths: [
        'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
        'M21 21l-4.35-4.35'
      ],
      stroke: true,
      fill: 'none'
    },
    spark: {
      viewBox: '0 0 24 24',
      paths: ['M12 2l2.4 7.4L22 12l-7.6 2.6L12 22l-2.4-7.4L2 12l7.6-2.6L12 2z'],
      fill: 'currentColor',
      stroke: false
    },
    recycle: {
      viewBox: '0 0 24 24',
      paths: [
        'M7 11V7a5 5 0 0 1 9.9-1',
        'M20 7l-4-4-4 4',
        'M17 13v4a5 5 0 0 1-9.9 1',
        'M4 17l4 4 4-4'
      ],
      stroke: true,
      fill: 'none'
    },
    infinity: {
      viewBox: '0 0 24 24',
      paths: [
        'M18.18 8.18a4.5 4.5 0 0 0-6.36 0L8.5 11.5a4.5 4.5 0 1 0 0 6.36 4.5 4.5 0 0 0 3.32-1.46l3.36-3.36a4.5 4.5 0 1 1 3-4.86z'
      ],
      stroke: true,
      fill: 'none'
    },
    meteor: {
      viewBox: '0 0 24 24',
      paths: [
        'M4 4l9 9',
        'M13 13a4 4 0 1 0 5.66-5.66L13 13z',
        'M2 9l5-5',
        'M9 2l-5 5'
      ],
      stroke: true,
      fill: 'none'
    },
    trash: {
      viewBox: '0 0 24 24',
      paths: [
        'M3 6h18',
        'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
        'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
        'M10 11v6',
        'M14 11v6'
      ],
      stroke: true,
      fill: 'none'
    },
    bastion: {
      viewBox: '0 0 24 24',
      paths: [
        'M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z',
        'M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'
      ],
      stroke: true,
      fill: 'none'
    },
    abismo: {
      viewBox: '0 0 24 24',
      paths: ['M11 2v4H9v2h2v7.17l-3.59-3.58L6 13.17 12 19.17l6-6-1.41-1.42L13 15.17V8h2V6h-2V2h-2zM4 20h16v2H4v-2z'],
      fill: 'currentColor',
      stroke: false
    },
    cart: {
      viewBox: '0 0 24 24',
      paths: [
        'M9 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
        'M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6'
      ],
      stroke: true,
      fill: 'none'
    },
    rocket: {
      viewBox: '0 0 24 24',
      paths: [
        'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z',
        'M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z',
        'M9 12H4s.55-3.03 2-4.5c1.45-1.47 4.5-2 4.5-2',
        'M15 15v5s3.03-.55 4.5-2c1.47-1.45 2-4.5 2-4.5'
      ],
      stroke: true,
      fill: 'none'
    },
    runner: {
      viewBox: '0 0 24 24',
      paths: [
        'M13.5 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
        'M6 13l3-3 3 1.5 3-3',
        'M9 10l-2 5 4 4 1-5 4-2'
      ],
      stroke: true,
      fill: 'none'
    },
    clipboard: {
      viewBox: '0 0 24 24',
      paths: [
        'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2',
        'M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z',
        'M9 12h6',
        'M9 16h4'
      ],
      stroke: true,
      fill: 'none'
    },
    hourglass: {
      viewBox: '0 0 24 24',
      paths: [
        'M5 22h14',
        'M5 2h14',
        'M17 22v-4.17a2 2 0 0 0-.59-1.42L13 13l3.41-3.41A2 2 0 0 0 17 8.17V2H7v6.17a2 2 0 0 0 .59 1.42L11 13l-3.41 3.41A2 2 0 0 0 7 17.83V22'
      ],
      stroke: true,
      fill: 'none'
    },
    planet: {
      viewBox: '0 0 24 24',
      paths: [
        'M12 4a8 8 0 1 0 8 8 8 8 0 0 0-8-8z',
        'M2 12c2.5-4 13.5-4 20 0s-7.5 4-20 0z'
      ],
      stroke: true,
      fill: 'none'
    },
    corredor: {
      viewBox: '0 0 24 24',
      paths: [
        'M13.5 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
        'M6 13l3-3 3 1.5 3-3',
        'M9 10l-2 5 4 4 1-5 4-2'
      ],
      stroke: true,
      fill: 'none'
    },
    gotas: {
      viewBox: '0 0 24 24',
      paths: [
        'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z',
        'M12 7a4 4 0 0 1 4 4'
      ],
      stroke: true,
      fill: 'none'
    },
    book: {
      viewBox: '0 0 24 24',
      paths: [
        'M4 19.5A2.5 2.5 0 0 1 6.5 17H20',
        'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'
      ],
      stroke: true,
      fill: 'none'
    },
    alert: {
      viewBox: '0 0 24 24',
      paths: [
        'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
        'M12 9v4',
        'M12 17h.01'
      ],
      stroke: true,
      fill: 'none'
    },
    rotate: {
      viewBox: '0 0 24 24',
      paths: [
        'M21 12a9 9 0 1 1-9-9c2.52 0 4.8 1.03 6.45 2.7L21 8',
        'M21 3v5h-5'
      ],
      stroke: true,
      fill: 'none'
    },
    wave: {
      viewBox: '0 0 24 24',
      paths: [
        'M2 6c3-3 6-3 8 0s5 3 8 0 4-2 4-2',
        'M2 12c3-3 6-3 8 0s5 3 8 0 4-2 4-2',
        'M2 18c3-3 6-3 8 0s5 3 8 0 4-2 4-2'
      ],
      stroke: true,
      fill: 'none'
    },
    rainbow: {
      viewBox: '0 0 24 24',
      paths: [
        'M22 17a10 10 0 0 0-20 0',
        'M18 17a6 6 0 0 0-12 0',
        'M14 17a2 2 0 0 0-4 0'
      ],
      stroke: true,
      fill: 'none'
    },
    hammer: {
      viewBox: '0 0 24 24',
      paths: [
        'M15 4l5 5-2 2-5-5 2-2z',
        'M14 9l-9 9a1.5 1.5 0 0 0 2 2l9-9-2-2z'
      ],
      stroke: true,
      fill: 'none'
    },
    gift: {
      viewBox: '0 0 24 24',
      paths: [
        'M20 12v10H4V12',
        'M2 7h20v5H2z',
        'M12 22V7',
        'M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z',
        'M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z'
      ],
      stroke: true,
      fill: 'none'
    },
    shuffle: {
      viewBox: '0 0 24 24',
      paths: [
        'M16 3h5v5',
        'M4 20L21 3',
        'M21 16v5h-5',
        'M15 15l6 6',
        'M4 4l5 5'
      ],
      stroke: true,
      fill: 'none'
    },
    swap: {
      viewBox: '0 0 24 24',
      paths: [
        'M8 7h12m0 0l-4-4m4 4l-4 4',
        'M16 17H4m0 0l4-4m-4 4l4 4'
      ],
      stroke: true,
      fill: 'none'
    },
    heartBroken: {
      viewBox: '0 0 24 24',
      paths: [
        'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
        'M12 4l-2 5 4 3-2 5'
      ],
      stroke: true,
      fill: 'none'
    },
    bubble: {
      viewBox: '0 0 24 24',
      paths: [
        'M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm-3 5a3 3 0 0 1 3-3'
      ],
      stroke: true,
      fill: 'none'
    }
  };

  class ArcadeIcons {
    static getSvg(name, options = {}) {
      return this.get(name, options);
    }
    /**
     * Devuelve la definición básica de un icono
     */
    static getDefinition(name) {
      return ICON_DEFINITIONS[name] || null;
    }

    /**
     * Comprueba si un icono existe en el catálogo
     */
    static has(name) {
      return !!ICON_DEFINITIONS[name];
    }

    /**
     * Genera el marcado SVG en cadena de texto
     * @param {string} name - Nombre del icono
     * @param {object} options - Opciones de renderizado (size, className, color, strokeWidth)
     * @returns {string} - Cadena de marcado SVG
     */
    static get(name, options = {}) {
      const def = ICON_DEFINITIONS[name];
      if (!def) {
        console.warn(`[ArcadeIcons] Icono no encontrado: "${name}"`);
        return `<svg viewBox="0 0 24 24" width="${options.size || 24}" height="${options.size || 24}"></svg>`;
      }

      const size = options.size !== undefined ? options.size : 24;
      const cls = options.className ? ` class="${options.className}"` : '';
      const color = options.color || 'currentColor';
      const strokeW = options.strokeWidth || 2;
      const isStroke = def.stroke;
      const fillVal = def.fill === 'currentColor' ? color : (def.fill || 'none');

      let body = '';
      def.paths.forEach((p) => {
        if (isStroke) {
          body += `<path d="${p}" fill="${fillVal}" stroke="${color}" stroke-width="${strokeW}" stroke-linecap="round" stroke-linejoin="round"/>`;
        } else {
          body += `<path d="${p}" fill="${fillVal}"/>`;
        }
      });

      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${def.viewBox || '0 0 24 24'}" width="${size}" height="${size}"${cls} aria-hidden="true">${body}</svg>`;
    }

    /**
     * Crea un elemento DOM SVG listo para insertar con appendChild
     */
    static getElement(name, options = {}) {
      if (typeof document === 'undefined') return null;
      const div = document.createElement('div');
      div.innerHTML = ArcadeIcons.get(name, options).trim();
      return div.firstElementChild;
    }

    /**
     * Renderizado en Canvas 2D
     * Utiliza Path2D cuando está disponible o pre-renderiza en canvas offscreen
     * @param {CanvasRenderingContext2D} ctx - Contexto 2D del canvas
     * @param {string} name - Nombre del icono
     * @param {number} x - Posición X de la esquina superior izquierda (o centro si centered=true)
     * @param {number} y - Posición Y
     * @param {number} size - Tamaño en píxeles (ancho y alto)
     * @param {string} color - Color CSS ('#fff', etc.)
     * @param {boolean} centered - Si es true, x e y representan el centro del icono
     */
    static drawToCanvas(ctx, name, x, y, size = 24, color = '#ffffff', centered = false) {
      if (!ctx) return;
      const def = ICON_DEFINITIONS[name];
      if (!def) return;

      const posX = centered ? x - size / 2 : x;
      const posY = centered ? y - size / 2 : y;
      const scale = size / 24;

      ctx.save();
      ctx.translate(posX, posY);
      ctx.scale(scale, scale);

      if (typeof Path2D !== 'undefined') {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        def.paths.forEach((pStr) => {
          const path = new Path2D(pStr);
          if (def.stroke) {
            ctx.stroke(path);
          }
          if (def.fill && def.fill !== 'none') {
            ctx.fill(path);
          }
        });
      } else {
        // Fallback genérico si Path2D no existe en el entorno
        ctx.fillStyle = color;
        ctx.fillRect(4, 4, 16, 16);
      }

      ctx.restore();
    }
  }

  // Exportación UMD
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ArcadeIcons, ICON_DEFINITIONS };
  }
  if (typeof window !== 'undefined') {
    window.ArcadeIcons = ArcadeIcons;
  }
})();
