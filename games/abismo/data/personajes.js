/**
 * DATOS DE PERSONAJES - ABISMO
 * Definición estructurada de exploradores jugables, estilos y habilidades
 */
(() => {
  'use strict';

  const PERSONAJES = [
    {
      id: 'peregrino',
      name: 'Peregrino Abisal',
      title: 'Explorador equilibrado de las sombras',
      unlockedByDefault: true,
      costEssence: 0,
      description: 'Armado con dardos espectrales y un estallido cinético de emergencia.',
      color: '#38bdf8',
      accentColor: '#0284c7',
      hp: 100,
      speed: 185,
      weaponStyle: 'proyectil',
      startingWeapon: 'proyectil',
      initialWeaponName: 'Dardo Espectral',
      stats: {
        maxHp: 100,
        speed: 185,
        damageMult: 1.0,
        attackRateMult: 1.0,
        pickupRadius: 70,
        specialCooldown: 7.0
      },
      specialAbility: {
        name: 'Estallido Espectral',
        description: 'Libera una onda circular expansiva que daña y repele a todos los enemigos cercanos.',
        cooldown: 7.0,
        radius: 160,
        damage: 65,
        knockback: 360
      }
    },
    {
      id: 'hechicera',
      name: 'Hechicera de Sangre',
      title: 'Maestra de orbes orbitales arcanos',
      unlockedByDefault: false,
      costEssence: 120,
      description: 'Menor vitalidad pero mayor cadencia y orbes giratorios que protegen su perímetro.',
      color: '#f43f5e',
      accentColor: '#be123c',
      hp: 80,
      speed: 195,
      weaponStyle: 'orbe',
      startingWeapon: 'orbe',
      initialWeaponName: 'Orbes Giratorios',
      stats: {
        maxHp: 80,
        speed: 195,
        damageMult: 1.15,
        attackRateMult: 1.25,
        pickupRadius: 90,
        specialCooldown: 8.5
      },
      specialAbility: {
        name: 'Pacto Carmesí',
        description: 'Vampirismo temporal: cura parte del daño infligido durante 3 segundos.',
        cooldown: 8.5,
        radius: 120,
        damage: 40,
        knockback: 200
      }
    },
    {
      id: 'centinela',
      name: 'Centinela de Hierro',
      title: 'Coloso de resistencia y ondas de impacto',
      unlockedByDefault: false,
      costEssence: 200,
      description: 'Gran cantidad de vida y ataques en área capaces de arrasar hordas apretadas.',
      color: '#fbbf24',
      accentColor: '#d97706',
      hp: 150,
      speed: 160,
      weaponStyle: 'onda',
      startingWeapon: 'onda',
      initialWeaponName: 'Onda de Vacío',
      stats: {
        maxHp: 150,
        speed: 160,
        damageMult: 1.1,
        attackRateMult: 0.85,
        pickupRadius: 60,
        specialCooldown: 9.0
      },
      startingWeapon: 'onda',
      specialAbility: {
        name: 'Falla Sísmica',
        description: 'Golpea el suelo de la cripta paralizando y dañando a los enemigos.',
        cooldown: 9.0,
        radius: 200,
        damage: 80,
        knockback: 420
      }
    },
    {
      id: 'sombra',
      name: 'Acechador Umbrío',
      title: 'Asesino ágil del vacío con alto daño crítico',
      unlockedByDefault: false,
      costEssence: 160,
      description: 'Velocidad vertiginosa, +25% de probabilidad de crítico y navajas espectrales dobles.',
      color: '#c084fc',
      accentColor: '#7e22ce',
      hp: 85,
      speed: 205,
      weaponStyle: 'proyectil',
      startingWeapon: 'proyectil',
      initialWeaponName: 'Navajas del Vacío',
      critChance: 0.25,
      damageMult: 1.15,
      attackRateMult: 1.2,
      stats: {
        maxHp: 85,
        speed: 205,
        damageMult: 1.15,
        attackRateMult: 1.2,
        critChance: 0.25,
        pickupRadius: 75,
        specialCooldown: 6.5
      },
      specialAbility: {
        name: 'Paso Fantasma',
        description: 'Carrera etérea instantánea que desata una ráfaga radial de navajas y 1.2s de invulnerabilidad.',
        cooldown: 6.5,
        radius: 140,
        damage: 75,
        knockback: 280
      }
    },
    {
      id: 'piromante',
      name: 'Inquisidor Ígneo',
      title: 'Maestro de ondas ardientes y cataclismos de fuego',
      unlockedByDefault: false,
      costEssence: 240,
      description: 'Gran poder destructivo en área (+25% radio) con ondas de magma abrasadoras.',
      color: '#f97316',
      accentColor: '#9a3412',
      hp: 115,
      speed: 175,
      weaponStyle: 'onda',
      startingWeapon: 'onda',
      initialWeaponName: 'Anillo de Magma',
      areaMult: 1.25,
      damageMult: 1.2,
      attackRateMult: 0.95,
      stats: {
        maxHp: 115,
        speed: 175,
        damageMult: 1.2,
        attackRateMult: 0.95,
        areaMult: 1.25,
        pickupRadius: 70,
        specialCooldown: 8.0
      },
      specialAbility: {
        name: 'Cataclismo Ígneo',
        description: 'Erupción masiva concéntrica que abrasa a todos los enemigos en un radio colosal de 220px.',
        cooldown: 8.0,
        radius: 220,
        damage: 95,
        knockback: 400
      }
    }
  ];

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PERSONAJES;
  }
  if (typeof window !== 'undefined') {
    window.ABISMO_PERSONAJES = PERSONAJES;
  }
})();
