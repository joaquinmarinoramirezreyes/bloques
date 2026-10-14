/**
 * MENU JS - Renderizado dinámico de tarjetas a partir de games.json
 * Soporta modo offline y compatibilidad con protocolo file://
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
      icon: "bloques"
    },
    {
      id: "snake",
      name: "Serpiente",
      folder: "games/snake",
      description: "Dirige la víbora neón en la cuadrícula, devora orbes de energía y esquiva las paredes y tu propia cola.",
      color: "#00e676",
      badge: "CLÁSICO",
      icon: "snake"
    },
    {
      id: "rompemuros",
      name: "Rompe Muros",
      folder: "games/rompemuros",
      description: "El clásico demoledor de ladrillos. Rebota la pelota, recoge power-ups y destruye los muros neón.",
      color: "#ff3366",
      badge: "ARCADE",
      icon: "rompemuros"
    },
    {
      id: "defensaorbital",
      name: "Defensa Orbital",
      folder: "games/defensaorbital",
      description: "Shooter vertical arcade. Defiende la órbita de invasiones alienígenas con fuego automático y reflejos rápidos.",
      color: "#38bdf8",
      badge: "SHOOTER",
      icon: "defensaorbital"
    },
    {
      id: "sombras",
      name: "Sombras",
      folder: "games/sombras",
      description: "Sigilo y escape en laberintos procedurales. Explora en la oscuridad con tu linterna y evita a los guardianes.",
      color: "#a855f7",
      badge: "SIGILO",
      icon: "sombras"
    },
    {
      id: "derrape",
      name: "Derrape",
      folder: "games/derrape",
      description: "Carreras cenitales arcade con físicas de derrape, rivales inteligentes y circuitos de alta velocidad.",
      color: "#f97316",
      badge: "CARRERAS",
      icon: "derrape"
    },
    {
      id: "abismo",
      name: "Abismo",
      folder: "games/abismo",
      description: "Roguelike cenital de acción en criptas infinitas con auto-ataque, sinergias y progresión permanente.",
      color: "#e11d48",
      badge: "ROGUELIKE",
      icon: "abismo"
    }
  ];

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
    // Bloques / Puzzle por defecto
    return `
      <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
        <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 5h8v3h-8z"/>
      </svg>
    `;
  }

  async function loadGames() {
    const grid = document.getElementById('games-grid');
    if (!grid) return;

    let games = [];
    try {
      const response = await fetch('./games.json');
      if (!response.ok) throw new Error('Respuesta de red no válida');
      games = await response.json();
    } catch (err) {
      // Fallback automático si se carga desde file:// o hay restricción CORS local
      games = FALLBACK_GAMES;
    }

    grid.innerHTML = '';

    games.forEach((game) => {
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

  window.addEventListener('DOMContentLoaded', loadGames);
})();
