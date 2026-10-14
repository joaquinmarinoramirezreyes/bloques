/**
 * MENU JS - Renderizado dinámico de tarjetas y filtrado por épocas (80s, 90s, 00s)
 * Soporta modo offline, SPA pushState y compatibilidad con protocolo file://
 */
(() => {
  'use strict';

  // Catálogo base de respaldo en caso de apertura local mediante file://
  const FALLBACK_GAMES = [
    {
      id: "bloques",
      name: "Bloques",
      folder: "games/bloques",
      description: "El puzzle arcade de piezas que caen. Encaja líneas completas, gestiona la rotación y bate el récord.",
      color: "#00f0ff",
      badge: "PUZZLE",
      icon: "bloques",
      eras: ["80"]
    },
    {
      id: "snake",
      name: "Serpiente",
      folder: "games/snake",
      description: "Dirige la víbora neón en la cuadrícula, devora orbes de energía y esquiva las paredes y tu propia cola.",
      color: "#00e676",
      badge: "CLÁSICO",
      icon: "snake",
      eras: ["80"]
    },
    {
      id: "rompemuros",
      name: "Rompe Muros",
      folder: "games/rompemuros",
      description: "El clásico demoledor de ladrillos. Rebota la pelota, recoge power-ups y destruye los muros neón.",
      color: "#ff3366",
      badge: "ARCADE",
      icon: "rompemuros",
      eras: ["80"]
    },
    {
      id: "defensaorbital",
      name: "Defensa Orbital",
      folder: "games/defensaorbital",
      description: "Shooter vertical arcade. Defiende la órbita de invasiones alienígenas con fuego automático y reflejos rápidos.",
      color: "#38bdf8",
      badge: "SHOOTER",
      icon: "defensaorbital",
      eras: ["80"]
    },
    {
      id: "sombras",
      name: "Sombras",
      folder: "games/sombras",
      description: "Sigilo y escape en laberintos procedurales. Explora en la oscuridad con tu linterna y evita a los guardianes.",
      color: "#a855f7",
      badge: "SIGILO",
      icon: "sombras",
      eras: ["90"]
    },
    {
      id: "derrape",
      name: "Derrape",
      folder: "games/derrape",
      description: "Carreras cenitales arcade con físicas de derrape, rivales inteligentes y circuitos de alta velocidad.",
      color: "#f97316",
      badge: "CARRERAS",
      icon: "derrape",
      eras: ["90"]
    },
    {
      id: "abismo",
      name: "Abismo",
      folder: "games/abismo",
      description: "Roguelike cenital de acción en criptas infinitas con auto-ataque, sinergias y progresión permanente.",
      color: "#e11d48",
      badge: "ROGUELIKE",
      icon: "abismo",
      eras: ["00"]
    },
    {
      id: "fronton",
      name: "Frontón",
      folder: "games/fronton",
      description: "Duelo de paletas y pelota cuántica con perspectiva 3D, física de aceleración, 3 dificultades de IA y modo 2P en un solo móvil.",
      color: "#00f0ff",
      badge: "RETRO 80",
      icon: "fronton",
      eras: ["80"]
    },
    {
      id: "campominado",
      name: "Campo Minado",
      folder: "games/campominado",
      description: "Despeje táctico de casillas con relieve 3D, primer toque 100% seguro y algoritmo de flood-fill iterativo sin recursión.",
      color: "#ffcc00",
      badge: "LÓGICA",
      icon: "campominado",
      eras: ["90"]
    },
    {
      id: "corredor",
      name: "Corredor",
      folder: "games/corredor",
      description: "Runner infinito de un botón con física de salto variable, obstáculos procedurales matemáticamente garantizados y power-ups.",
      color: "#b388ff",
      badge: "RUNNER",
      icon: "corredor",
      eras: ["00"]
    }
  ];

  // Configuración de Épocas del Arcade
  const ERA_CONFIGS = {
    '80': {
      title: 'Arcade 80',
      tag: 'ÉPOCA 1980s',
      subtitle: 'Neón puro, estéticas fosfóricas y el nacimiento del videojuego arcade.',
      bodyData: '80'
    },
    '90': {
      title: 'Arcade 90',
      tag: 'ÉPOCA 1990s',
      subtitle: 'La era de los 16 bits: Colores saturados, tarjetas con relieve y alta velocidad.',
      bodyData: '90'
    },
    '00': {
      title: 'Arcade 00',
      tag: 'ÉPOCA 2000s',
      subtitle: 'El nuevo milenio: Acabados de vidrio, reflejos y roguelikes de acción.',
      bodyData: '00'
    }
  };

  let allGamesData = [];

  // Detección de Época desde la URL
  function detectEra() {
    if (typeof window === 'undefined') return null;

    // 1. Pathname de Vercel (/80, /90, /00, /80/, etc.)
    const path = (window.location.pathname || '').toLowerCase();
    const match = path.match(/\/(80|90|00)(?:\/|$)/);
    if (match) return match[1];

    // 2. Parámetro de búsqueda (?era=80, ?era=90, ?era=00)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const qEra = urlParams.get('era');
      if (qEra && ['80', '90', '00'].includes(qEra)) return qEra;
    } catch (_) {}

    // 3. Hash fallback (#80, #90, #00)
    const hash = (window.location.hash || '').replace('#', '').trim();
    if (['80', '90', '00'].includes(hash)) return hash;

    // Rutas no reconocidas o raíz llevan al menú completo
    return null;
  }

  // Iconos SVG arcade según el juego
  function getGameIcon(iconType) {
    if (iconType === 'snake') {
      return `
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
          <path d="M7 2a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a3 3 0 0 0-3 3v2a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3v-2a1 1 0 0 1 1-1h4a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-4a3 3 0 0 0-3 3v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h4a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2h2V4a2 2 0 0 0-2-2H7z"/>
        </svg>
      `;
    }
    if (iconType === 'rompemuros') {
      return `
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
          <path d="M3 4h8v3H3V4zm10 0h8v3h-8V4zM3 9h5v3H3V9zm7 0h8v3h-8V9zm10 0h1v3h-1V9zm-15 5h8v3H5v-3zm10 0h8v3h-8v-3zM7 20h10v2H7v-2zm5-4.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
        </svg>
      `;
    }
    if (iconType === 'defensaorbital') {
      return `
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
          <path d="M12 2L9 8h6l-3-6zm-1 8H4l3 7h3l1-7zm2 0l1 7h3l3-7h-7zm-2 9l-1 3h4l-1-3h-2z"/>
        </svg>
      `;
    }
    if (iconType === 'sombras') {
      return `
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
          <path d="M12 4a9 9 0 0 0-9 9c0 4.97 4.03 9 9 9s9-4.03 9-9a9 9 0 0 0-9-9zm0 2c3.87 0 7 3.13 7 7 0 1.93-.78 3.68-2.05 4.95L12 13V6zm-1 8.41l3.54 3.54A6.96 6.96 0 0 1 12 19c-3.87 0-7-3.13-7-7 0-2.4 1.2-4.52 3.03-5.78L11 14.41z"/>
        </svg>
      `;
    }
    if (iconType === 'derrape') {
      return `
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
          <path d="M6 3c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v2h1a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1v4h1a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1v1c0 1.1-.9 2-2 2h-1v-2H9v2H8c-1.1 0-2-.9-2-2v-1H5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h1v-4H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1V3zm3 4h6V5H9v2zm0 8h6V9H9v6z"/>
        </svg>
      `;
    }
    if (iconType === 'abismo') {
      return `
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
          <path d="M11 2v4H9v2h2v7.17l-3.59-3.58L6 13.17 12 19.17l6-6-1.41-1.42L13 15.17V8h2V6h-2V2h-2zM4 20h16v2H4v-2z"/>
        </svg>
      `;
    }
    if (iconType === 'fronton') {
      return `
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
          <path d="M4 3h16v2H4V3zm2 4h12v2H6V7zm4 12h4v2h-4v-2zm-6-2h16v2H4v-2zm8-5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
        </svg>
      `;
    }
    if (iconType === 'campominado') {
      return `
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
          <path d="M11 2h2v3h-2V2zm0 17h2v3h-2v-3zm9-8v2h-3v-2h3zM5 11v2H2v-2h3zm12.36-5.95l1.42 1.42-2.12 2.12-1.42-1.42 2.12-2.12zM6.34 16.24l1.42 1.42-2.12 2.12-1.42-1.42 2.12-2.12zm11.32 2.12l-1.42 1.42-2.12-2.12 1.42-1.42 2.12 2.12zM8.46 6.34l-1.42 1.42-2.12-2.12 1.42-1.42 2.12 2.12zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/>
        </svg>
      `;
    }
    if (iconType === 'corredor') {
      return `
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
          <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z"/>
        </svg>
      `;
    }
    // Bloques / Puzzle por defecto
    return `
      <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
        <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 5h8v3h-8z"/>
      </svg>
    `;
  }

  // Renderizado dinámico de tarjetas filtradas por época
  function renderGames(eraKey) {
    const grid = document.getElementById('games-grid');
    if (!grid) return;

    let filtered = allGamesData;
    if (eraKey) {
      filtered = allGamesData.filter(g => Array.isArray(g.eras) && g.eras.includes(eraKey));
    }

    grid.innerHTML = '';

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="empty-state">No hay juegos disponibles en esta época aún.</div>';
      return;
    }

    filtered.forEach((game) => {
      // Obtener el récord actual del juego
      const highScore = window.ArcadeStorage ? window.ArcadeStorage.getHighScore(game.id) : 0;
      const card = document.createElement('article');
      card.className = 'game-card';
      card.style.setProperty('--card-accent', game.color || '#00f0ff');
      card.style.setProperty('--card-glow', `${game.color || '#00f0ff'}33`);

      card.innerHTML = `
        <div class="card-top">
          <div class="card-icon" aria-hidden="true">
            ${getGameIcon(game.icon || game.id)}
          </div>
          <div class="card-info">
            <div class="card-meta">
              <h2 class="card-title">${game.name}</h2>
              <span class="card-badge">${game.badge || 'ARCADE'}</span>
            </div>
            <p class="card-desc">${game.description}</p>
          </div>
        </div>

        <div class="card-footer">
          <div class="record-badge">
            <span class="record-label">RÉCORD</span>
            <span class="record-value">${highScore.toLocaleString()}</span>
          </div>
          <a href="./${game.folder}/" class="play-btn">
            JUGAR
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </a>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (!e.target.closest('a')) {
          window.location.href = `./${game.folder}/`;
        }
      });

      grid.appendChild(card);
    });
  }

  // Aplicar época: actualiza título, metadatos, temas CSS y catálogo
  function applyEra(eraKey) {
    const titleEl = document.getElementById('hub-title');
    const tagEl = document.getElementById('hub-tag');
    const subEl = document.getElementById('hub-subtitle');
    const eraTabs = document.querySelectorAll('.era-tab');

    if (eraKey && ERA_CONFIGS[eraKey]) {
      const cfg = ERA_CONFIGS[eraKey];
      document.body.setAttribute('data-era', cfg.bodyData);
      document.title = `${cfg.title} - Juegos Clásicos`;
      if (titleEl) titleEl.textContent = cfg.title;
      if (tagEl) tagEl.textContent = cfg.tag;
      if (subEl) subEl.textContent = cfg.subtitle;
    } else {
      document.body.removeAttribute('data-era');
      document.title = 'Sala Arcade - Juegos Clásicos';
      if (titleEl) titleEl.textContent = 'SALA ARCADE';
      if (tagEl) tagEl.textContent = 'RETRO HUB';
      if (subEl) subEl.textContent = 'Selecciona un juego para comenzar o escanea el QR desde tu móvil';
    }

    // Actualizar estado activo en la barra de navegación de épocas
    eraTabs.forEach(tab => {
      const tabEra = tab.getAttribute('data-era');
      if ((!eraKey && tabEra === 'all') || (eraKey === tabEra)) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    renderGames(eraKey);
  }

  // Inicializar navegación por épocas con soporte SPA y enlaces directos
  function initEraTabs() {
    const eraTabs = document.querySelectorAll('.era-tab');
    eraTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const targetEra = tab.getAttribute('data-era');
        const targetUrl = targetEra === 'all' ? '/' : `/${targetEra}`;

        // Fallback en protocolo file:// o tests locales sin servidor web
        if (window.location.protocol === 'file:') {
          e.preventDefault();
          window.location.hash = targetEra === 'all' ? '' : `#${targetEra}`;
          applyEra(targetEra === 'all' ? null : targetEra);
          return;
        }

        // Navegación fluida con History API
        e.preventDefault();
        try {
          window.history.pushState({ era: targetEra }, '', targetUrl);
          applyEra(targetEra === 'all' ? null : targetEra);
        } catch (_) {
          window.location.href = targetUrl;
        }
      });
    });

    window.addEventListener('popstate', () => {
      applyEra(detectEra());
    });
  }

  // Carga inicial de datos
  async function loadGames() {
    initEraTabs();

    try {
      const response = await fetch('./games.json');
      if (!response.ok) throw new Error('Respuesta de red no válida');
      allGamesData = await response.json();
    } catch (_) {
      // Fallback automático si se carga desde file:// o hay restricción CORS local
      allGamesData = FALLBACK_GAMES;
    }

    applyEra(detectEra());
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', loadGames);
  }

  // Exponer utilidades para pruebas unitarias en Node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      FALLBACK_GAMES,
      ERA_CONFIGS,
      detectEra
    };
  }
})();
