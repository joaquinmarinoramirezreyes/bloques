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
