/**
 * scripts/test_bastion_phase4.js
 * Suite de Pruebas Automatizadas para Bastión Fase 4:
 * 1. Expansión de Mapas a 20x13 (720x468 px)
 * 2. Terrenos Tácticos Especiales (Elevada, Geoda, Veta Aúrica, Escombros)
 * 3. Habilidades Activas del Comandante (Bombardeo Orbital, Estasis Temporal, Sobrecarga Aurífera)
 * 4. Adelanto Táctico de Oleada con Bono de Oro
 * 5. Radar Táctico de Próxima Oleada
 * 6. Gestor de Campaña Persistente y Sistema de 3 Estrellas
 */

const assert = require('assert');
const { BastionGame } = require('../games/bastion/game.js');
const { MAPAS } = require('../games/bastion/data/mapas.js');
const { CampaignManager, STORAGE_KEY } = require('../games/bastion/data/campana.js');

let passedTests = 0;
let totalTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ PASÓ: ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ FALLÓ: ${desc}`);
    console.error(err);
    process.exit(1);
  }
}

console.log('='.repeat(70));
console.log('  TEST SUITE: BASTIÓN FASE 4 (MAPAS 20x13, HABILIDADES Y CAMPAÑA)');
console.log('='.repeat(70));

// Mock canvas para inicializar BastionGame en Node
const mockCanvas = {
  width: 720,
  height: 468,
  getContext: () => ({
    save: () => {},
    restore: () => {},
    clearRect: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    ellipse: () => {},
    fill: () => {},
    stroke: () => {},
    fillText: () => {},
    strokeText: () => {},
    measureText: () => ({ width: 10 }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    setLineDash: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
    resetTransform: () => {},
    drawImage: () => {}
  }),
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 720, height: 468 })
};

// ============================================================================
// 1. VERIFICACIÓN DE MAPAS EXPANDIDOS A 20x13
// ============================================================================
console.log('\n[1] Verificación de Mapas Expandidos a 20x13');

it('Existen exactamente 6 mapas definidos en MAPAS', () => {
  assert.strictEqual(MAPAS.length, 6);
});

MAPAS.forEach((map, idx) => {
  it(`Mapa ${idx + 1} (${map.name}) tiene dimensiones 20 cols x 13 rows`, () => {
    assert.strictEqual(map.cols, 20);
    assert.strictEqual(map.rows, 13);
    assert.strictEqual(map.grid.length, 13);
    for (let r = 0; r < 13; r++) {
      assert.strictEqual(map.grid[r].length, 20);
    }
  });

  it(`Mapa ${idx + 1} (${map.name}) tiene waypoints válidos dentro del grid 20x13`, () => {
    assert(map.waypoints && map.waypoints.length >= 4);
    for (const wp of map.waypoints) {
      assert(wp.c >= 0 && wp.c < 20, `Waypoint c=${wp.c} fuera de rango en mapa ${idx + 1}`);
      assert(wp.r >= 0 && wp.r < 13, `Waypoint r=${wp.r} fuera de rango en mapa ${idx + 1}`);
    }
  });

  it(`Mapa ${idx + 1} (${map.name}) contiene terrenos tácticos especiales (5, 6, 7 o 8)`, () => {
    let hasSpecial = false;
    for (let r = 0; r < 13; r++) {
      for (let c = 0; c < 20; c++) {
        if ([5, 6, 7, 8].includes(map.grid[r][c])) {
          hasSpecial = true;
          break;
        }
      }
      if (hasSpecial) break;
    }
    assert(hasSpecial, `Mapa ${idx + 1} no posee casillas tácticas especiales`);
  });
});

// ============================================================================
// 2. VERIFICACIÓN DE TERRENOS TÁCTICOS ESPECIALES
// ============================================================================
console.log('\n[2] Verificación de Terrenos Tácticos Especiales');

it('Plataforma Elevada (5) otorga +25% de alcance efectivo a la torre', () => {
  const game = new BastionGame(mockCanvas);
  game.gold = 500;
  // Encontrar una casilla con tipo 5 en mapa 0
  let highPos = null;
  for (let r = 0; r < game.rows; r++) {
    for (let c = 0; c < game.cols; c++) {
      if (game.mapData.grid[r][c] === 5) {
        highPos = { c, r };
        break;
      }
    }
    if (highPos) break;
  }
  assert(highPos, 'No se encontró casilla elevada (5) en mapa 0');
  const res = game.placeTower('balistico', highPos.c, highPos.r);
  assert(res.success, 'Fallo al colocar torre en casilla elevada');
  assert.strictEqual(res.tower.isHighground, true);
  assert(res.tower.effRangeMult >= 1.25, `effRangeMult esperado >= 1.25, obtenido: ${res.tower.effRangeMult}`);
});

it('Geoda Elemental (6) otorga +20% de daño efectivo a la torre', () => {
  const game = new BastionGame(mockCanvas);
  game.gold = 500;
  let geodePos = null;
  for (let r = 0; r < game.rows; r++) {
    for (let c = 0; c < game.cols; c++) {
      if (game.mapData.grid[r][c] === 6) {
        geodePos = { c, r };
        break;
      }
    }
    if (geodePos) break;
  }
  assert(geodePos, 'No se encontró geoda elemental (6) en mapa 0');
  const res = game.placeTower('balistico', geodePos.c, geodePos.r);
  assert(res.success, 'Fallo al colocar torre en geoda elemental');
  assert.strictEqual(res.tower.isGeode, true);
  assert(res.tower.effDmgMult >= 1.20, `effDmgMult esperado >= 1.20, obtenido: ${res.tower.effDmgMult}`);
});

it('Veta de Cristal Aúrico (7) otorga bonificación de oro al finalizar la oleada', () => {
  const game = new BastionGame(mockCanvas);
  game.gold = 500;
  let goldPos = null;
  for (let r = 0; r < game.rows; r++) {
    for (let c = 0; c < game.cols; c++) {
      if (game.mapData.grid[r][c] === 7) {
        goldPos = { c, r };
        break;
      }
    }
    if (goldPos) break;
  }
  assert(goldPos, 'No se encontró veta aúrica (7) en mapa 0');
  const res = game.placeTower('balistico', goldPos.c, goldPos.r);
  assert(res.success);
  assert.strictEqual(res.tower.isGoldmine, true);

  // Simular final de oleada
  game.startWave(1);
  game.enemies = [];
  game.waveSpawnQueue = [];
  const goldBefore = game.gold;
  game.update(0.1); // Procesa fin de oleada
  // Debería incluir oro base de oleada (50 + 10 = 60) + 15 por la mina aúrica
  const diff = game.gold - goldBefore;
  assert.strictEqual(diff, 60 + 15, `Esperado 75 de oro por oleada con mina, obtenido: ${diff}`);
});

it('Escombros Cuánticos (8) bloquean construcción hasta ser despejados con 40 de oro', () => {
  const game = new BastionGame(mockCanvas);
  game.gold = 30; // Fondos insuficientes para despejar
  let debPos = null;
  for (let r = 0; r < game.rows; r++) {
    for (let c = 0; c < game.cols; c++) {
      if (game.mapData.grid[r][c] === 8) {
        debPos = { c, r };
        break;
      }
    }
    if (debPos) break;
  }
  assert(debPos, 'No se encontró escombros (8) en mapa 0');

  // No se puede construir directamente
  assert.strictEqual(game.canBuildAt(debPos.c, debPos.r), false);

  // Intento de despejar sin fondos suficientes
  const failClear = game.clearDebris(debPos.c, debPos.r);
  assert.strictEqual(failClear.success, false);
  assert.strictEqual(failClear.reason, 'oro_insuficiente');

  // Añadir oro y despejar con éxito
  game.gold = 100;
  const okClear = game.clearDebris(debPos.c, debPos.r);
  assert.strictEqual(okClear.success, true);
  assert.strictEqual(game.gold, 60);
  assert.strictEqual(game.mapData.grid[debPos.r][debPos.c], 0);
  assert.strictEqual(game.canBuildAt(debPos.c, debPos.r), true);
});

// ============================================================================
// 3. HABILIDADES ACTIVAS DEL COMANDANTE
// ============================================================================
console.log('\n[3] Habilidades Activas del Comandante');

it('Bombardeo Orbital [Q] inflige 450 de daño en área y genera napalm residual', () => {
  const game = new BastionGame(mockCanvas);
  const targetX = 200;
  const targetY = 200;

  // Spawnea 2 enemigos en la zona y 1 lejos
  const e1 = game.spawnEnemy('reptante', 1.0, { x: 200, y: 200 });
  const e2 = game.spawnEnemy('blindado', 1.0, { x: 220, y: 210 });
  const e3 = game.spawnEnemy('veloz', 1.0, { x: 500, y: 350 });

  const initialHp1 = e1.hp;
  const initialHp2 = e2.hp;
  const initialHp3 = e3.hp;

  assert(game.canUseSkill('orbital_strike'), 'Bombardeo orbital debería estar listo');

  // Modo apuntado si no se pasan coordenadas
  const targetMode = game.useSkill('orbital_strike');
  assert.strictEqual(targetMode.targeting, true);
  assert.strictEqual(game.activeTargetSkill, 'orbital_strike');

  // Disparo con coordenadas
  const res = game.useSkill('orbital_strike', targetX, targetY);
  assert.strictEqual(res.success, true);
  assert.strictEqual(game.activeTargetSkill, null);
  assert(game.skillsCooldowns.orbital_strike > 0, 'Debería entrar en cooldown');
  assert(game.hazards.length > 0, 'Debería haberse creado un hazard de napalm');

  // e1 y e2 deben haber recibido daño severo
  assert(e1.hp < initialHp1, 'e1 no recibió daño');
  assert(e2.hp < initialHp2, 'e2 no recibió daño');
  assert.strictEqual(e3.hp, initialHp3, 'e3 fuera de rango no debería recibir daño');
});

it('Estasis Temporal [W] congela a todas las criaturas activas por 4.5 segundos', () => {
  const game = new BastionGame(mockCanvas);
  const e1 = game.spawnEnemy('reptante', 1.0);
  const e2 = game.spawnEnemy('etero', 1.0);

  assert.strictEqual(e1.freezeTimer, 0);
  assert.strictEqual(e2.freezeTimer, 0);

  const res = game.useSkill('time_freeze');
  assert.strictEqual(res.success, true);
  assert.strictEqual(e1.freezeTimer, 4.5);
  assert.strictEqual(e2.freezeTimer, 4.5);
  assert(game.skillsCooldowns.time_freeze > 0);
});

it('Sobrecarga Aurífera [E] otorga +120 de oro y activa buff de sobrecarga', () => {
  const game = new BastionGame(mockCanvas);
  const goldStart = game.gold;

  const res = game.useSkill('gold_surge');
  assert.strictEqual(res.success, true);
  assert.strictEqual(game.gold, goldStart + 120);
  assert.strictEqual(game.overchargeTimer, 8.0);
  assert(game.skillsCooldowns.gold_surge > 0);
});

it('Los enfriamientos de habilidades y sobrecarga decaen con el tiempo en update(dt)', () => {
  const game = new BastionGame(mockCanvas);
  game.useSkill('gold_surge');
  assert.strictEqual(game.overchargeTimer, 8.0);
  const cdSurgeInitial = game.skillsCooldowns.gold_surge;

  game.update(2.0); // Avanzar 2 segundos
  assert(Math.abs(game.overchargeTimer - 6.0) < 0.05, `overchargeTimer esperado ~6.0, obtenido: ${game.overchargeTimer}`);
  assert(Math.abs(game.skillsCooldowns.gold_surge - (cdSurgeInitial - 2.0)) < 0.05);
});

// ============================================================================
// 4. ADELANTO TÁCTICO DE OLEADA (EARLY CALL)
// ============================================================================
console.log('\n[4] Adelanto Táctico de Oleada (Early Call)');

it('No permite adelantar si la oleada no está activa', () => {
  const game = new BastionGame(mockCanvas);
  assert.strictEqual(game.waveActive, false);
  const res = game.callNextWaveEarly();
  assert.strictEqual(res, false);
});

it('Permite adelantar oleada en curso, otorgando bono de oro y encolando siguiente tanda', () => {
  const game = new BastionGame(mockCanvas);
  game.startWave(1);
  assert.strictEqual(game.waveActive, true);
  assert.strictEqual(game.currentWave, 1);

  const queueLengthBefore = game.waveSpawnQueue.length;
  const goldBefore = game.gold;

  const earlyRes = game.callNextWaveEarly();
  assert(earlyRes.success);
  assert(earlyRes.bonus > 0);
  assert.strictEqual(game.gold, goldBefore + earlyRes.bonus);
  assert.strictEqual(game.currentWave, 2);
  assert(game.waveSpawnQueue.length > queueLengthBefore, 'Debe haber encolado la siguiente tanda');
});

// ============================================================================
// 5. RADAR TÁCTICO DE PRÓXIMA OLEADA (WAVE INTEL)
// ============================================================================
console.log('\n[5] Radar Táctico de Próxima Oleada (Wave Intel)');

it('getNextWaveIntel() reporta conteos correctos y avisa presencia de jefe', () => {
  const game = new BastionGame(mockCanvas);
  const intelWave1 = game.getNextWaveIntel(1);
  assert(intelWave1 !== null);
  assert.strictEqual(intelWave1.waveNum, 1);
  assert(intelWave1.total > 0);
  assert(intelWave1.counts.reptante > 0);
  assert.strictEqual(intelWave1.hasBoss, false);

  const intelWave10 = game.getNextWaveIntel(10);
  assert(intelWave10 !== null);
  assert.strictEqual(intelWave10.hasBoss, true);
  assert(intelWave10.counts.jefe_coloso >= 1);
});

// ============================================================================
// 6. GESTOR DE CAMPAÑA Y SISTEMA DE 3 ESTRELLAS
// ============================================================================
console.log('\n[6] Gestor de Campaña Persistente y Sistema de 3 Estrellas');

it('CampaignManager desbloquea Sector 1 por defecto y bloquea Sectores 2 a 6 inicialmente', () => {
  const campaign = new CampaignManager();
  campaign.resetProgress();

  assert.strictEqual(campaign.isMapUnlocked(0), true);
  assert.strictEqual(campaign.isMapUnlocked(1), false);
  assert.strictEqual(campaign.isMapUnlocked(2), false);
  assert.strictEqual(campaign.isMapUnlocked(5), false);
});

it('Victoria impecable (sin pérdida de vidas) otorga 3 estrellas y desbloquea el siguiente mapa', () => {
  const campaign = new CampaignManager();
  campaign.resetProgress();

  const vicRes = campaign.recordVictory(0, 20, 20, 1500, 'normal');
  assert.strictEqual(vicRes.stars, 3);
  assert.strictEqual(vicRes.unlockedNext, true);
  assert.strictEqual(vicRes.nextMapIndex, 1);

  assert.strictEqual(campaign.getStars(0), 3);
  assert.strictEqual(campaign.isMapUnlocked(1), true);
  assert.strictEqual(campaign.isMapUnlocked(2), false);
});

it('Victoria con vidas parciales calcula 2 estrellas (>=50% vidas) o 1 estrella', () => {
  const campaign = new CampaignManager();
  campaign.resetProgress();

  const vic2Stars = campaign.recordVictory(0, 10, 20, 1000);
  assert.strictEqual(vic2Stars.stars, 2);

  campaign.resetProgress();
  const vic1Star = campaign.recordVictory(0, 4, 20, 500);
  assert.strictEqual(vic1Star.stars, 1);
});

console.log('\n' + '='.repeat(70));
console.log(`RESULTADO FINAL: ${passedTests}/${totalTests} pruebas pasaron exitosamente.`);
console.log('='.repeat(70));
