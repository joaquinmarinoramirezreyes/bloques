/**
 * scripts/test_bastion_phase3.js
 * Suite de pruebas automatizadas para la Fase 3 de Bastión:
 * Metaprogreso (Templo del Nexo con Esquirlas), Reliquias arcanas,
 * Dificultades, Mutadores, Parábola 3D de mortero, Estadísticas y Audio/FX.
 */
const assert = require('assert');
const { BastionGame } = require('../games/bastion/game');
const { RELIQUIAS } = require('../games/bastion/data/reliquias');
const { MEJORAS_METAPROGRESO, MetaManager } = require('../games/bastion/data/mejoras');

console.log('======================================================================');
console.log('  TEST SUITE: BASTIÓN FASE 3 (METAPROGRESO, RELIQUIAS, 3D & FX)      ');
console.log('======================================================================\n');

// -----------------------------------------------------------------------------
// [1] VERIFICACIÓN DEL ÁRBOL DE METAPROGRESO (MetaManager)
// -----------------------------------------------------------------------------
console.log('[1] Verificación del Árbol de Metaprogreso');
const meta = new MetaManager();
assert(typeof meta.shards === 'number', 'MetaManager contiene balance de esquirlas');
assert(Object.keys(MEJORAS_METAPROGRESO).length === 6, 'Existen 6 mejoras permanentes');

// Añadir esquirlas de prueba
meta.shards = 100;
assert(meta.canUpgrade('reserva_inicial') === true, 'Puede comprar mejora con saldo suficiente');
const bought = meta.buyUpgrade('reserva_inicial');
assert(bought === true, 'Compra de mejora permanente exitosa');
assert(meta.getUpgradeLevel('reserva_inicial') === 1, 'Nivel de reserva_inicial subió a 1');
assert(meta.shards === 95, 'Saldo de esquirlas se dedujo correctamente (100 -> 95)');

// Verificar bonos calculados por MetaManager
assert(meta.getInitialBonusGold() === 25, 'Rango 1 de reserva otorga +25 oro inicial');
meta.upgrades.baluarte_nucleo = 2;
assert(meta.getInitialBonusLives() === 4, 'Rango 2 de baluarte otorga +4 vidas al núcleo');
meta.upgrades.ingenieria_arcana = 2;
assert(Math.abs(meta.getTowerCostDiscount() - 0.08) < 0.001, 'Rango 2 otorga 8% de descuento');
meta.upgrades.amplificador_plasma = 3;
assert(Math.abs(meta.getGlobalDamageMultiplier() - 1.15) < 0.001, 'Rango 3 otorga +15% de daño');
meta.upgrades.sobremarcha_cinetica = 2;
assert(Math.abs(meta.getGlobalFireRateMultiplier() - 1.08) < 0.001, 'Rango 2 otorga +8% de cadencia');
meta.upgrades.recuperacion_tactica = 2;
assert(Math.abs(meta.getSellRefundRate() - 0.78) < 0.001, 'Rango 2 otorga 78% de reembolso');
console.log('✅ PASÓ: MetaManager y Árbol de 6 Mejoras funcionan correctamente');

// -----------------------------------------------------------------------------
// [2] INTEGRACIÓN DE METAPROGRESO EN LA PARTIDA
// -----------------------------------------------------------------------------
console.log('\n[2] Integración de Metaprogreso en BastionGame');
const gameMeta = new BastionGame(null, { meta });
assert(gameMeta.gold === 300 + 25, 'El oro inicial incluye la bonificación del Templo (+25)');
assert(gameMeta.lives === 20 + 4, 'Las vidas iniciales incluyen la bonificación del Templo (+4)');

// Descuento en construcción
const tRes = gameMeta.placeTower('balistico', 4, 1);
assert(tRes.success === true, 'Torre colocada con descuento de metaprogreso');
// Coste base 100, descuento 8% = 92
assert(tRes.tower.cost === 92, 'El coste efectivo de la torre refleja el 8% de descuento (100 -> 92)');
console.log('✅ PASÓ: Bonos pasivos de metaprogreso aplicados a la partida');

// -----------------------------------------------------------------------------
// [3] SISTEMA DE RELIQUIAS Y ARTEFACTOS ARCANOS
// -----------------------------------------------------------------------------
console.log('\n[3] Sistema de Reliquias y Artefactos');
assert(Object.keys(RELIQUIAS).length >= 10, 'Existen al menos 10 reliquias arcanas definidas');

const relicGame = new BastionGame(null, { initialGold: 1000 });
assert(relicGame.activeRelics.length === 0, 'Inicia sin reliquias activas');

// 3.1 Lente Cuántica (+15% alcance global)
relicGame.placeTower('balistico', 4, 1);
const towerBase = relicGame.towers[0];
const baseRange = towerBase.range * towerBase.effRangeMult;
relicGame.equipRelic('lente_cuantica');
assert(relicGame.hasRelic('lente_cuantica') === true, 'Reliquia Lente Cuántica equipada');
assert(towerBase.effRangeMult >= 1.15, 'Efecto de Lente Cuántica amplifica el alcance de las torres');

// 3.2 Escudo de Singularidad (3 cargas de protección de núcleo)
relicGame.equipRelic('escudo_singularidad');
assert(relicGame.coreShield === 3, 'Escudo de Singularidad otorga 3 cargas de defensa');
const enemyTest = relicGame.spawnEnemy('reptante');
const livesBefore = relicGame.lives;
relicGame.damageCore(enemyTest);
assert(relicGame.lives === livesBefore, 'El Escudo absorbe el impacto sin reducir vidas del núcleo');
assert(relicGame.coreShield === 2, 'Las cargas del Escudo se redujeron a 2');

// 3.3 Transmutador Áurico (+2 oro por kill)
relicGame.equipRelic('transmutador_aurico');
const enemyKill = relicGame.spawnEnemy('veloz');
const goldBefore = relicGame.gold;
relicGame.applyDamageToEnemy(enemyKill, 9999, true, 'energy', 1.0);
// Veloz reward = 16, con reliquia +2 = 18
assert(relicGame.gold - goldBefore === 18, 'Transmutador Áurico añade +2 oro por baja (16 -> 18)');

// 3.4 Bobina de Tesla Nexo
relicGame.equipRelic('bobina_tesla_nucleo');
const enemyTesla = relicGame.spawnEnemy('reptante');
const hpBeforeTesla = enemyTesla.hp;
relicGame.triggerTeslaStrike();
assert(enemyTesla.hp < hpBeforeTesla, 'La Bobina de Tesla descarga sobre el enemigo más próximo');
console.log('✅ PASÓ: Efectos de Reliquias Arcanas verificados');

// -----------------------------------------------------------------------------
// [4] DIFICULTADES Y MUTADORES
// -----------------------------------------------------------------------------
console.log('\n[4] Dificultades y Mutadores');
const hardGame = new BastionGame(null, {
  difficulty: 'pesadilla',
  mutators: ['armored', 'speedy']
});
assert(hardGame.diffHpMult === 1.65, 'Dificultad Pesadilla aplica escala de vida x1.65');
assert(hardGame.diffShardMult === 2.0, 'Dificultad Pesadilla otorga x2.0 en esquirlas');

const hardEnemy = hardGame.spawnEnemy('reptante');
assert(hardEnemy.hp > 90 * 1.5, 'La salud del enemigo escala con la dificultad');
assert(hardEnemy.armor >= 0.20, 'El mutador Invasión Acorazada añade +20% de armadura base');
console.log('✅ PASÓ: Dificultades y Mutadores escalan el combate');

// -----------------------------------------------------------------------------
// [5] JUICE, SCREEN SHAKE Y BALÍSTICA 3D DE MORTERO
// -----------------------------------------------------------------------------
console.log('\n[5] Juice, Screen Shake y Balística 3D de Mortero');
const fxGame = new BastionGame(null, { initialGold: 1000 });
fxGame.screenShake(6.0, 0.3);
assert(fxGame.shakeIntensity === 6.0 && fxGame.shakeTimer === 0.3, 'Sacudida de pantalla configurada');
fxGame.update(0.1);
assert(fxGame.shakeTimer < 0.3, 'Temporizador de sacudida decrece con el tiempo');

// Proyectil de mortero con parábola 3D
const mortTower = fxGame.placeTower('mortero', 4, 1).tower;
const targetEnemy = fxGame.spawnEnemy('reptante');
fxGame.fireTowerWeapon(mortTower, targetEnemy);
assert(fxGame.projectiles.length === 1, 'Proyectil de mortero emitido');
const mortProj = fxGame.projectiles[0];
assert(mortProj.isMortar === true, 'El proyectil está marcado como mortero parabólico 3D');
assert(mortProj.maxHeight === 38, 'El proyectil posee parámetro de elevación Z máxima');

// Actualizar parábola en el aire
fxGame.updateProjectiles(0.35);
assert(mortProj.heightZ > 0, 'El proyectil se eleva en el eje Z durante el vuelo');
assert(mortProj.y < mortProj.groundY, 'La posición Y visual está por encima de la sombra en el suelo');
console.log('✅ PASÓ: Parábola balística 3D y sacudida de pantalla verificadas');

// -----------------------------------------------------------------------------
// [6] ESTADÍSTICAS COMPLETAS DE PARTIDA Y DESPLIEGUE DE DAÑO
// -----------------------------------------------------------------------------
console.log('\n[6] Estadísticas Completas de Partida');
assert(typeof fxGame.stats.totalDamage === 'number', 'Registra daño total acumulado');
assert(typeof fxGame.stats.kills === 'number', 'Registra bajas totales');
assert(typeof fxGame.stats.goldEarned === 'number', 'Registra oro generado');
assert(typeof fxGame.stats.shardsEarned === 'number', 'Registra esquirlas ganadas');

// Dañar enemigo y verificar registro en estadísticas y números flotantes
const damageTarget = fxGame.spawnEnemy('reptante');
const dmgNumbersBefore = fxGame.damageNumbers.length;
fxGame.applyDamageToEnemy(damageTarget, 50, false, 'physical', 1.0, mortTower.id);

assert(fxGame.stats.totalDamage >= 50, 'El daño se acumula en las estadísticas');
assert(fxGame.stats.towerDamage[mortTower.id] >= 50, 'El daño se asocia al MVP (torre atacante)');
assert(fxGame.damageNumbers.length > dmgNumbersBefore, 'Se genera indicador de daño flotante');
console.log('✅ PASÓ: Estadísticas y números de daño flotantes operativos');

console.log('\n======================================================================');
console.log('RESULTADO FINAL: TODAS LAS PRUEBAS DE LA FASE 3 PASARON EXITOSAMENTE.');
console.log('======================================================================');
