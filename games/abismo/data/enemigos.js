/**
 * DATOS DE ENEMIGOS - ABISMO
 * Definición estructurada de arquetipos de enemigos, comportamientos y atributos
 */
(() => {
  'use strict';

  const ENEMIGOS = {
    perseguidor: {
      id: 'perseguidor',
      name: 'Necro-Sombra',
      description: 'Acechador incansable que rastrea la posición del jugador en línea directa.',
      behavior: 'chaser',
      hp: 38,
      speed: 105,
      radius: 12,
      damage: 12,
      touchDamageRate: 0.5, // Frecuencia de daño por contacto si sigue tocando
      expValue: 10,
      color: '#f43f5e',
      accentColor: '#881337',
      glowColor: 'rgba(244, 63, 94, 0.45)',
      knockbackResistance: 1.0,
      points: 10
    },
    corredor: {
      id: 'corredor',
      name: 'Bestia Ágil',
      description: 'Carga a gran velocidad en ráfagas cortas con aviso previo.',
      behavior: 'rusher',
      hp: 28,
      speed: 190,
      radius: 10,
      damage: 16,
      touchDamageRate: 0.6,
      expValue: 14,
      color: '#fb923c',
      accentColor: '#9a3412',
      glowColor: 'rgba(251, 146, 60, 0.45)',
      knockbackResistance: 1.2,
      points: 15
    },
    tirador: {
      id: 'tirador',
      name: 'Vástago del Ojo',
      description: 'Mantiene distancia y dispara proyectiles arcanos periódicos.',
      behavior: 'shooter',
      hp: 32,
      speed: 75,
      radius: 13,
      damage: 10,
      bulletDamage: 15,
      shootRange: 280,
      shootCooldown: 2.2,
      expValue: 16,
      color: '#a855f7',
      accentColor: '#581c87',
      glowColor: 'rgba(168, 85, 247, 0.45)',
      knockbackResistance: 0.9,
      points: 20
    },
    invocador: {
      id: 'invocador',
      name: 'Clérigo del Vacío',
      description: 'Se aleja del explorador e invoca larvas o sombras menores.',
      behavior: 'summoner',
      hp: 60,
      speed: 60,
      radius: 16,
      damage: 8,
      summonCooldown: 4.5,
      expValue: 25,
      color: '#38bdf8',
      accentColor: '#0369a1',
      glowColor: 'rgba(56, 189, 248, 0.45)',
      knockbackResistance: 0.8,
      points: 30
    },
    explosivo: {
      id: 'explosivo',
      name: 'Gargolita Inestable',
      description: 'Al acercarse o morir detona en una onda ígnea expansiva.',
      behavior: 'explosive',
      hp: 24,
      speed: 135,
      radius: 11,
      damage: 35,
      fuseTime: 0.8,
      explosionRadius: 65,
      expValue: 18,
      color: '#facc15',
      accentColor: '#854d0e',
      glowColor: 'rgba(250, 204, 21, 0.55)',
      knockbackResistance: 1.5,
      points: 20
    },
    escudado: {
      id: 'escudado',
      name: 'Guardián Criptal',
      description: 'Porta una barrera frontal que bloquea proyectiles y absorbe impactos.',
      behavior: 'shielded',
      hp: 75,
      speed: 80,
      radius: 16,
      damage: 18,
      shieldHp: 40,
      expValue: 30,
      color: '#10b981',
      accentColor: '#064e3b',
      glowColor: 'rgba(16, 185, 129, 0.45)',
      knockbackResistance: 0.5,
      points: 35
    },
    jefe_cripta: {
      id: 'jefe_cripta',
      name: 'Señor del Abismo',
      description: 'Gobernante espectral de la cripta profunda. Telegrafía impactos devastadores y lanza salvas circulares.',
      behavior: 'boss',
      hp: 450,
      maxHp: 450,
      speed: 85,
      radius: 26,
      damage: 24,
      isBoss: true,
      expValue: 120,
      color: '#a855f7',
      accentColor: '#581c87',
      glowColor: 'rgba(168, 85, 247, 0.7)',
      knockbackResistance: 0.2,
      points: 250
    },
    jefe_magma: {
      id: 'jefe_magma',
      name: 'Gólem del Núcleo',
      description: 'Titán ígneo de basalto viviente. Arroja rocas incandescentes y desata temblores de magma.',
      behavior: 'boss',
      hp: 750,
      maxHp: 750,
      speed: 70,
      radius: 28,
      damage: 32,
      isBoss: true,
      expValue: 200,
      color: '#f97316',
      accentColor: '#7c2d12',
      glowColor: 'rgba(249, 115, 22, 0.75)',
      knockbackResistance: 0.1,
      points: 400
    }
  };

  // Modificadores de Élites (Fase 2)
  const MODIFICADORES_ELITE = [
    { id: 'rapido', name: 'Veloz', speedMult: 1.35, hpMult: 1.4, color: '#f59e0b' },
    { id: 'titan', name: 'Titán', speedMult: 0.85, hpMult: 2.2, sizeMult: 1.3, color: '#ef4444' },
    { id: 'vampiro', name: 'Vampírico', speedMult: 1.1, hpMult: 1.6, lifesteal: true, color: '#ec4899' }
  ];

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ENEMIGOS, MODIFICADORES_ELITE };
  }
  if (typeof window !== 'undefined') {
    window.ABISMO_ENEMIGOS = ENEMIGOS;
    window.ABISMO_MODIFICADORES_ELITE = MODIFICADORES_ELITE;
  }
})();
