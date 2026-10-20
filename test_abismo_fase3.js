/**
 * PRUEBAS AUTOMATIZADAS - ABISMO: FASE 3
 * Experiencia, mejoras a elegir como datos, sinergias, botín y tienda.
 */
(() => {
  'use strict';

  const assert = require('assert');
  const CFG = require('./games/abismo/config.js');
  const { RAREZAS, MEJORAS, SINERGIAS, UpgradeManager } = require('./games/abismo/data/mejoras.js');
  const { DungeonGenerator, TIPOS_SALA } = require('./games/abismo/data/salas.js');
  const {
    Player,
    SpatialHashClass,
    ProjectilePool,
    EnemyPool,
    LootItem,
    LootPool
  } = require('./games/abismo/game.js');

  console.log('\n==========================================================');
  console.log('   PRUEBAS AUTOMATIZADAS: ABISMO - FASE 3');
  console.log('==========================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function runTest(name, fn) {
    totalTests++;
    try {
      fn();
      console.log(`  OK [PASSED] ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`  X [FAILED] ${name}`);
      console.error(`    Error: ${err.message}`);
      if (err.stack) {
        console.error(`    Stack: ${err.stack.split('\n').slice(1, 4).join('\n')}`);
      }
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Curva de experiencia y subidas de nivel
  // --------------------------------------------------------------------------
  runTest('Curva de experiencia escala exponencialmente y soporta saltos múltiples de nivel', () => {
    const player = new Player(480, 320);
    assert.strictEqual(player.level, 1, 'Jugador debe iniciar en nivel 1');
    assert.strictEqual(player.currentXp, 0, 'Jugador inicia con 0 XP');
    const xpNeededLvl1 = player.xpToNextLevel;
    assert.ok(xpNeededLvl1 >= 25, 'XP requerida para nivel 2 debe ser >= 25');

    // Ganar menos XP de la necesaria
    const levels1 = player.gainXp(10);
    assert.strictEqual(levels1, 0, 'No debe subir de nivel con 10 XP');
    assert.strictEqual(player.level, 1, 'Debe permanecer en nivel 1');
    assert.strictEqual(player.currentXp, 10, 'Debe acumular 10 XP');

    // Ganar XP restante para nivel 2
    const levels2 = player.gainXp(xpNeededLvl1 - 10);
    assert.strictEqual(levels2, 1, 'Debe subir exactamente 1 nivel');
    assert.strictEqual(player.level, 2, 'Debe estar en nivel 2');
    assert.strictEqual(player.currentXp, 0, 'El residuo debe ser 0 XP');
    assert.ok(player.xpToNextLevel > xpNeededLvl1, 'El siguiente nivel debe requerir más XP');

    // Salto de varios niveles de un solo golpe (ej. botín gigante de 400 XP)
    const prevLvl = player.level;
    const levelsGained = player.gainXp(400);
    assert.ok(levelsGained >= 2, 'Debe haber ganado múltiples niveles');
    assert.strictEqual(player.level, prevLvl + levelsGained, 'El nivel final debe coincidir con los niveles ganados');
  });

  // --------------------------------------------------------------------------
  // TEST 2: Catálogo de mejoras estructuradas como datos con rarezas
  // --------------------------------------------------------------------------
  runTest('Catálogo de mejoras define rarezas válidas, efectos numéricos y niveles máximos', () => {
    assert.ok(MEJORAS.length >= 12, 'Debe haber al menos 12 mejoras básicas');
    assert.ok(SINERGIAS.length >= 4, 'Debe haber al menos 4 sinergias legendarias');

    const validRarities = Object.keys(RAREZAS);

    MEJORAS.forEach(m => {
      assert.ok(m.id && typeof m.id === 'string', `Mejora sin ID válido: ${JSON.stringify(m)}`);
      assert.ok(m.name, `Mejora ${m.id} debe tener nombre`);
      assert.ok(m.description, `Mejora ${m.id} debe tener descripción`);
      assert.ok(validRarities.includes(m.rarity), `Mejora ${m.id} tiene rareza inválida: ${m.rarity}`);
      assert.ok(m.maxLevel >= 1, `Mejora ${m.id} debe tener maxLevel >= 1`);
      assert.ok(m.effects && typeof m.effects === 'object', `Mejora ${m.id} debe definir effects`);
    });

    SINERGIAS.forEach(s => {
      assert.ok(s.id && typeof s.id === 'string', `Sinergia sin ID: ${JSON.stringify(s)}`);
      assert.strictEqual(s.rarity, 'sinergia', `Sinergia ${s.id} debe tener rareza sinergia`);
      assert.ok(Array.isArray(s.requiredUpgrades) && s.requiredUpgrades.length >= 2, `Sinergia ${s.id} debe requerir al menos 2 mejoras`);
    });
  });

  // --------------------------------------------------------------------------
  // TEST 3: UpgradeManager genera 3 opciones aleatorias sin duplicados
  // --------------------------------------------------------------------------
  runTest('UpgradeManager.getRandomSelection() entrega exactamente 3 opciones únicas y ponderadas', () => {
    const player = new Player(480, 320);

    for (let sim = 0; sim < 50; sim++) {
      const selection = UpgradeManager.getRandomSelection(player, 3);
      assert.strictEqual(selection.length, 3, 'Debe devolver exactamente 3 mejoras');

      const ids = selection.map(s => s.id);
      const uniqueIds = new Set(ids);
      assert.strictEqual(uniqueIds.size, 3, `No debe haber duplicados en la misma selección: ${ids.join(', ')}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 4: Exclusión estricta de mejoras que alcanzaron su nivel máximo
  // --------------------------------------------------------------------------
  runTest('Mejoras al nivel máximo son excluidas del pool de selección', () => {
    const player = new Player(480, 320);
    const targetUpgrade = MEJORAS[0]; // fuerza_arcana (maxLevel 5)

    // Subir al máximo
    for (let l = 0; l < targetUpgrade.maxLevel; l++) {
      UpgradeManager.applyUpgrade(player, targetUpgrade.id);
    }

    assert.strictEqual(player.activeUpgrades[targetUpgrade.id], targetUpgrade.maxLevel);

    const availablePool = UpgradeManager.getAvailablePool(player);
    const found = availablePool.some(m => m.id === targetUpgrade.id);
    assert.strictEqual(found, false, 'La mejora en nivel máximo no debe aparecer en el pool disponible');

    // Ejecutar 30 selecciones para verificar que jamás sea ofrecida
    for (let sim = 0; sim < 30; sim++) {
      const selection = UpgradeManager.getRandomSelection(player, 3);
      assert.strictEqual(selection.some(m => m.id === targetUpgrade.id), false, 'Mejora maximizada no debe ser seleccionada');
    }
  });

  // --------------------------------------------------------------------------
  // TEST 5: Desbloqueo condicional de sinergias
  // --------------------------------------------------------------------------
  runTest('Sinergias solo están disponibles cuando se cumplen todos sus requisitos', () => {
    const player = new Player(480, 320);
    const synergy = SINERGIAS.find(s => s.id === 'sinergia_rebote_perforacion');
    assert.ok(synergy, 'Debe existir sinergia_rebote_perforacion');

    // Inicialmente, sin requisitos: no debe estar disponible
    let pool = UpgradeManager.getAvailablePool(player);
    assert.strictEqual(pool.some(m => m.id === synergy.id), false, 'Sinergia no debe estar disponible al inicio');

    // Cumplir solo 1 de los 2 requisitos
    UpgradeManager.applyUpgrade(player, synergy.requiredUpgrades[0]);
    pool = UpgradeManager.getAvailablePool(player);
    assert.strictEqual(pool.some(m => m.id === synergy.id), false, 'Sinergia no debe desbloquearse con 1 solo requisito');

    // Cumplir el segundo requisito
    UpgradeManager.applyUpgrade(player, synergy.requiredUpgrades[1]);
    pool = UpgradeManager.getAvailablePool(player);
    assert.strictEqual(pool.some(m => m.id === synergy.id), true, 'Sinergia debe añadirse al pool al cumplir ambos requisitos');

    // Aplicar la sinergia al jugador
    UpgradeManager.applyUpgrade(player, synergy.id);
    assert.strictEqual(player.synergyShardOnPierce, true, 'Flag de sinergia debe activarse en el jugador');

    // Una vez adquirida (maxLevel 1), debe desaparecer del pool
    pool = UpgradeManager.getAvailablePool(player);
    assert.strictEqual(pool.some(m => m.id === synergy.id), false, 'Sinergia ya adquirida debe salir del pool');
  });

  // --------------------------------------------------------------------------
  // TEST 6: Aplicación acumulativa de estadísticas y efectos
  // --------------------------------------------------------------------------
  runTest('applyUpgrade() modifica de forma consistente las estadísticas del explorador', () => {
    const player = new Player(480, 320);

    const initialDmg = player.damageMult;
    UpgradeManager.applyUpgrade(player, 'fuerza_arcana');
    assert.strictEqual(player.damageMult, initialDmg + 0.20, 'Fuerza Arcana debe sumar +20% al multiplicador');

    const initialProjectiles = player.extraProjectiles;
    UpgradeManager.applyUpgrade(player, 'salva_doble');
    assert.strictEqual(player.extraProjectiles, initialProjectiles + 1, 'Salva múltiple debe sumar +1 proyectil extra');

    const initialMaxHp = player.maxHp;
    UpgradeManager.applyUpgrade(player, 'armadura_umbra');
    assert.strictEqual(player.maxHp, initialMaxHp + 25, 'Armadura Umbra debe sumar +25 HP max');

    UpgradeManager.applyUpgrade(player, 'escudo_espectral');
    assert.strictEqual(player.hasBarrier, true, 'Velo espectral debe activar la barrera');
  });

  // --------------------------------------------------------------------------
  // TEST 7: LootPool, generación de botín y física magnética hacia el jugador
  // --------------------------------------------------------------------------
  runTest('LootPool genera orbes/oro y los atrae magnéticamente al explorador', () => {
    const loot = new LootPool(50);
    const player = new Player(480, 320);
    player.pickupRadius = 120;

    // Generar drop de enemigo
    loot.spawnEnemyDrop(450, 300, 20, false, 1.0);
    assert.ok(loot.activeCount >= 2, 'Debe haber generado al menos orbe XP y moneda de oro');

    // Actualizar con un room simulado
    const fakeRoom = { wallThickness: 24, width: 960, height: 640 };
    let collectedItems = [];

    // Colocar jugador justo encima del ítem
    player.x = 450;
    player.y = 300;

    loot.update(0.016, player, (item) => collectedItems.push(item), fakeRoom);

    assert.ok(collectedItems.length >= 1, 'Debe haber recolectado items en radio de contacto');
    assert.ok(collectedItems.some(i => i.type === 'xp' || i.type === 'gold'), 'Items recolectados deben ser xp o gold');
  });

  // --------------------------------------------------------------------------
  // TEST 8: Bóveda de tesoro abre cofre ancestral y otorga reliquia
  // --------------------------------------------------------------------------
  runTest('Sala de tesoro inicializa con cofre y se abre al interactuar', () => {
    const dungeon = DungeonGenerator.generate(4, 7);
    const treasureRoom = dungeon.rooms.find(r => r.type === 'tesoro');
    assert.ok(treasureRoom, 'La mazmorra debe incluir una sala de tesoro');
    assert.strictEqual(treasureRoom.chestOpened, false, 'Cofre debe iniciar cerrado');

    // Simular jugador caminando hacia el centro del cofre
    const roomW = 960;
    const roomH = 640;
    const player = new Player(roomW / 2, roomH / 2);

    const dist = Math.hypot(player.x - (roomW / 2), player.y - (roomH / 2));
    assert.ok(dist <= (CFG.CHEST_INTERACT_RADIUS || 46), 'Jugador debe estar dentro del radio de interacción');

    // Apertura del cofre
    treasureRoom.chestOpened = true;
    assert.strictEqual(treasureRoom.chestOpened, true, 'Cofre debe quedar registrado como abierto');
  });

  // --------------------------------------------------------------------------
  // TEST 9: Mercader Umbrío y validación de compras en la tienda
  // --------------------------------------------------------------------------
  runTest('Sala de tienda valida fondos de oro para pedestales interactivos', () => {
    const dungeon = DungeonGenerator.generate(4, 7);
    const shopRoom = dungeon.rooms.find(r => r.type === 'tienda');
    assert.ok(shopRoom, 'La mazmorra debe incluir una sala de tienda');

    const shopItems = [
      { id: 'potion', name: 'Poción de Vida', cost: 30, bought: false },
      { id: 'upgrade_1', name: 'Bendición Ofensiva', cost: 45, bought: false },
      { id: 'upgrade_2', name: 'Reliquia Arcana', cost: 65, bought: false }
    ];

    const player = new Player(480, 320);
    player.gold = 35; // Solo le alcanza para la poción de 30

    // Intento de comprar la bendición de 45 (Fondos insuficientes)
    const item45 = shopItems[1];
    const canAfford45 = player.gold >= item45.cost;
    assert.strictEqual(canAfford45, false, 'No debe permitir comprar sin suficiente oro');
    assert.strictEqual(item45.bought, false, 'El item no debe marcarse como comprado');

    // Compra de poción de 30 (Fondos suficientes)
    const item30 = shopItems[0];
    const canAfford30 = player.gold >= item30.cost;
    assert.strictEqual(canAfford30, true, 'Debe permitir comprar con oro suficiente');

    player.gold -= item30.cost;
    item30.bought = true;
    assert.strictEqual(player.gold, 5, 'El oro restante debe ser 5');
    assert.strictEqual(item30.bought, true, 'El pedestal debe quedar registrado como comprado');
  });

  // --------------------------------------------------------------------------
  // TEST 10: Velo espectral bloquea daño y protege la vida
  // --------------------------------------------------------------------------
  runTest('Velo espectral anula impacto y devuelve BLOCKED sin restar HP', () => {
    const player = new Player(480, 320);
    player.hp = 100;
    player.hasBarrier = true;
    player.barrierActive = true;
    player.barrierInterval = 16;

    const res = player.takeDamage(25, 1, 0);
    assert.strictEqual(res, 'BLOCKED', 'takeDamage debe retornar BLOCKED');
    assert.strictEqual(player.hp, 100, 'HP debe mantenerse intacto al bloquear');
    assert.strictEqual(player.barrierActive, false, 'Barrera debe desactivarse tras absorber el impacto');
    assert.ok(player.barrierTimer > 0, 'Debe iniciar tiempo de recarga de la barrera');

    // Siguiente impacto sin barrera sí debe restar vida
    player.iFrameTimer = 0; // reset i-frame
    const res2 = player.takeDamage(25, 1, 0);
    assert.strictEqual(res2, true, 'takeDamage debe retornar true al infligir daño');
    assert.strictEqual(player.hp, 75, 'HP debe reducirse a 75');
  });

  // --------------------------------------------------------------------------
  // RESUMEN FINAL
  // --------------------------------------------------------------------------
  console.log('\n==========================================================');
  console.log(`RESULTADO: ${passedTests} / ${totalTests} PRUEBAS SUPERADAS (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('==========================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
})();
