/**
 * CONFIGURACIÓN Y BALANCE GENERAL - ABISMO
 * Parámetros globales de balance, rendimiento y jugabilidad
 */
(() => {
  'use strict';

  const CONFIG = {
    // Rendimiento y simulación
    FIXED_DELTA: 1 / 60,
    MAX_DELTA: 0.1,
    SPATIAL_CELL_SIZE: 75,
    MAX_ENEMIES_CAP: 200,
    MAX_PROJECTILES_CAP: 350,
    MAX_PARTICLES_CAP: 400,
    MAX_TEXTS_CAP: 100,

    // Dimensiones de sala inicial (Fase 1)
    ROOM_WIDTH: 960,
    ROOM_HEIGHT: 640,
    WALL_THICKNESS: 32,

    // Jugador (Base)
    PLAYER_RADIUS: 14,
    PLAYER_SPEED: 185,
    PLAYER_MAX_HP: 100,
    PLAYER_IFRAME_DURATION: 0.65, // Segundos de invulnerabilidad tras ser golpeado

    // Auto-Ataque (Arma inicial: Proyectil Místico)
    AUTO_ATTACK_RANGE: 260,
    AUTO_ATTACK_COOLDOWN: 0.38,   // Disparo cada ~0.38s
    BULLET_SPEED: 420,
    BULLET_DAMAGE: 22,
    BULLET_LIFETIME: 0.85,
    BULLET_RADIUS: 5,
    BULLET_KNOCKBACK: 140,

    // Habilidad Especial: "Estallido Espectral"
    SPECIAL_COOLDOWN: 7.0,        // 7 segundos de recarga
    SPECIAL_RADIUS: 185,          // Onda de choque circular de 185px
    SPECIAL_DAMAGE: 80,           // Daño masivo letal para hordas iniciales
    SPECIAL_KNOCKBACK: 380,       // Gran empujón

    // Mazmorra, Niveles y Puertas (Fase 2 y 4)
    DOOR_WIDTH: 72,
    DOOR_THICKNESS: 16,
    DUNGEON_GRID_SIZE: 5,        // Mapa más grande (5x5 por defecto, 6x6 en pisos avanzados)
    DUNGEON_ROOMS_COUNT: 10,     // 10 a 16 salas conectadas por piso
    PORTAL_INTERACT_RADIUS: 46,  // Radio para descender al siguiente piso
    BIOME_FLOORS_CYCLE: 5,       // Cada 5 pisos cambia el bioma y aparece un jefe

    // Jefes de Mazmorra (Fase 4)
    BOSS_HP_BASE: 450,
    BOSS_RADIUS: 26,
    BOSS_SLAM_DAMAGE: 32,
    BOSS_SLAM_RADIUS: 120,
    BOSS_TELEGRAPH_TIME: 0.8,

    // Estilos de Armas Adicionales (Fase 4)
    WEAPON_ORBIT_RADIUS: 72,
    WEAPON_ORBIT_DAMAGE: 16,
    WEAPON_ORBIT_SPEED: 2.8,
    WEAPON_PULSE_RADIUS: 140,
    WEAPON_PULSE_COOLDOWN: 1.4,
    WEAPON_PULSE_DAMAGE: 38,

    // Proyectiles enemigos (Tirador)
    ENEMY_BULLET_SPEED: 190,
    ENEMY_BULLET_RADIUS: 6,
    ENEMY_BULLET_LIFETIME: 2.2,

    // Cámara
    CAMERA_LERP: 0.12,
    CAMERA_BASE_ZOOM: 1.0,

    // Experiencia, Botín y Tienda (Fase 3)
    XP_BASE: 28,
    XP_EXPONENT: 1.35,
    BASE_PICKUP_RADIUS: 90,
    LOOT_POOL_CAP: 250,
    LOOT_MAGNET_SPEED: 340,
    CHEST_INTERACT_RADIUS: 46,
    SHOP_INTERACT_RADIUS: 48,
    SHOP_POTION_COST: 30,
    SHOP_UPGRADE_COST: 45,
    SHOP_ELITE_UPGRADE_COST: 65,

    // Meta-progresión, Guardado y Pulido (Fase 5)
    STORAGE_KEY: 'abismo:v1',
    ACTIVE_RUN_KEY: 'abismo:active_run',
    HIT_STOP_DURATION: 0.05,        // Congelación breve (50ms) en impactos críticos y estallidos
    LIGHTING_ENABLED: true,         // Iluminación suave y viñeta radial sobre el jugador
    AMBIENT_MUSIC_ENABLED: true,    // Música ambiental arcanizada generada por código
    ESSENCE_PER_KILL_BASE: 1.5,     // Esencia base otorgada por baja
    ESSENCE_PER_FLOOR_BASE: 20,     // Esencia adicional por piso alcanzado


    // Temática visual
    PALETTE: {
      BG: '#07070a',
      FLOOR_LIGHT: '#161622',
      FLOOR_DARK: '#0f0f18',
      WALL: '#1e1c2e',
      WALL_BORDER: '#383452',
      DOOR_LOCKED: '#f43f5e',
      DOOR_OPEN: '#38bdf8',
      PLAYER: '#38bdf8',
      PLAYER_ACCENT: '#0284c7',
      ENEMY_CHASER: '#f43f5e',
      ENEMY_CHASER_GLOW: 'rgba(244, 63, 94, 0.45)',
      BULLET: '#a855f7',
      BULLET_GLOW: 'rgba(168, 85, 247, 0.65)',
      ENEMY_BULLET: '#ef4444',
      ENEMY_BULLET_GLOW: 'rgba(239, 68, 68, 0.65)',
      SPECIAL: '#e11d48',
      XP_ORB: '#38bdf8',
      XP_ORB_GLOW: 'rgba(56, 189, 248, 0.55)',
      GOLD_COIN: '#fbbf24',
      GOLD_COIN_GLOW: 'rgba(251, 191, 36, 0.55)',
      CHEST: '#f59e0b',
      CHEST_GLOW: 'rgba(245, 158, 11, 0.6)',
      SHOP_PEDESTAL: '#38bdf8'
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
  }
  if (typeof window !== 'undefined') {
    window.ABISMO_CONFIG = CONFIG;
  }
})();
