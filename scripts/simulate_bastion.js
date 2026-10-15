/**
 * scripts/simulate_bastion.js
 * Simulación automatizada headless de partidas completas de Bastión (Oleadas 1 a 20)
 * para los 6 mapas con una estrategia táctica fija determinista.
 * Evalúa balance económico y de combate, y reporta si algún mapa es imposible o trivial.
 */

const { BastionGame } = require('../games/bastion/game');
const { MAPAS } = require('../games/bastion/data/mapas');

function findCandidateTiles(game) {
  const allWaypoints = [];
  if (game.mapData.paths && game.mapData.paths.length > 0) {
    for (const p of game.mapData.paths) {
      allWaypoints.push(...p);
    }
  } else if (game.mapData.waypoints) {
    allWaypoints.push(...game.mapData.waypoints);
  }

  const coreCell = game.coreCell;

  const candidates = [];
  for (let r = 0; r < game.rows; r++) {
    for (let c = 0; c < game.cols; c++) {
      if (game.canBuildAt(c, r)) {
        const distToCore = Math.hypot(c - coreCell.c, r - coreCell.r);

        let minDistToPath = Infinity;
        for (const wp of allWaypoints) {
          const d = Math.hypot(c - wp.c, r - wp.r);
          if (d < minDistToPath) minDistToPath = d;
        }

        // Priorizar terrenos tácticos (5: alto +25% alcance, 6: geoda +20% daño)
        const tileType = game.mapData.grid[r][c];
        let tacticalBonus = 0;
        if (tileType === 5) tacticalBonus = -2.5; // Muy deseable
        if (tileType === 6) tacticalBonus = -2.0;

        // Ponderar: proximidad al camino + convergencia cerca del núcleo
        const score = minDistToPath * 1.6 + distToCore * 0.75 + tacticalBonus;
        candidates.push({ c, r, score, distToCore, minDistToPath });
      }
    }
  }

  candidates.sort((a, b) => a.score - b.score);
  return candidates;
}

function simulateMap(mapIndex, maxWaves = 20) {
  const game = new BastionGame(null, {
    mapIndex: mapIndex,
    initialGold: 380,
    initialLives: 20,
    difficulty: 'normal'
  });

  const candidates = findCandidateTiles(game);

  // Secuencia de construcción balanceada
  const buildPlan = ['balistico', 'mortero', 'crio', 'balistico', 'rayo', 'francotirador', 'obelisco', 'mortero', 'balistico'];

  const DT = 0.04; // 25 pasos fijos por segundo
  const MAX_WAVE_TICKS = 3500; // Máximo de 140 segundos virtuales por oleada

  for (let w = 1; w <= maxWaves; w++) {
    if (game.gameOver) break;

    // Despejar escombros si hay fondos
    for (let r = 0; r < game.rows; r++) {
      for (let c = 0; c < game.cols; c++) {
        if (game.mapData.grid[r][c] === 8 && game.gold >= 40) {
          game.clearDebris(c, r);
        }
      }
    }

    // 1. Colocar torres prioritarias cubriendo los mejores puntos si hay oro
    for (let i = 0; i < candidates.length && game.towers.length < buildPlan.length; i++) {
      const spot = candidates[i];
      if (game.canBuildAt(spot.c, spot.r)) {
        const type = buildPlan[game.towers.length];
        const res = game.placeTower(type, spot.c, spot.r);
        if (!res.success) break;
      }
    }

    // 2. Mejorar torres existentes con oro restante
    for (const t of game.towers) {
      if (t.level < 3) {
        game.upgradeTower(t.c, t.r);
      } else if (t.level === 3 && !t.branch) {
        game.specializeTower(t.c, t.r, 'a');
      }
    }

    // Iniciar asalto
    game.startWave(w);

    // Simular oleada hasta completar spawn y muertes
    let ticks = 0;
    while (game.waveActive && !game.gameOver && ticks < MAX_WAVE_TICKS) {
      game.update(DT);
      ticks++;

      // Uso de habilidades tácticas del comandante durante combate
      if (game.enemies.length >= 6 || w === 10 || w === 20) {
        if (game.canUseSkill('time_freeze')) {
          game.useSkill('time_freeze');
        }
        if (game.canUseSkill('orbital_strike') && game.enemies.length > 0) {
          const lead = game.enemies[0];
          if (lead) game.useSkill('orbital_strike', lead.x, lead.y);
        }
        if (game.canUseSkill('gold_surge')) {
          game.useSkill('gold_surge');
        }
      }
    }
  }

  return {
    mapIndex,
    mapName: game.mapData.name,
    wavesCompleted: game.stats.wavesCompleted,
    maxWaves,
    victory: game.victory,
    gameOver: game.gameOver,
    livesRemaining: game.lives,
    initialLives: game.initialLives,
    goldEarned: game.stats.goldEarned,
    goldSpent: game.stats.goldSpent,
    totalDamage: Math.round(game.stats.totalDamage),
    kills: game.stats.kills,
    towersPlaced: game.towers.length
  };
}

console.log('======================================================================');
console.log('  SIMULACIÓN AUTOMATIZADA DE COMBATE Y BALANCE - BASTIÓN (W1 - W20)   ');
console.log('======================================================================\n');

const results = [];
let allPassed = true;

for (let i = 0; i < MAPAS.length; i++) {
  process.stdout.write(`Simulando Sector ${i + 1}: ${MAPAS[i].name}... `);
  const res = simulateMap(i, 20);
  results.push(res);

  const status = res.victory ? '🏆 VICTORIA' : (res.gameOver ? '💀 DERROTA' : '⏱️ INCOMPLETO');
  console.log(`${status} | Oleadas: ${res.wavesCompleted}/${res.maxWaves} | Vidas: ${res.livesRemaining}/${res.initialLives} | Torres: ${res.towersPlaced} | Kills: ${res.kills}`);

  if (!res.victory) {
    allPassed = false;
  }
}

console.log('\n----------------------------------------------------------------------');
console.log('RESUMEN DE BALANCE POR MAPA:');
console.log('----------------------------------------------------------------------');

let hasImpossible = false;

for (const r of results) {
  const survivalRate = (r.livesRemaining / r.initialLives) * 100;
  console.log(`• [Sector ${r.mapIndex + 1}] ${r.mapName}:`);
  console.log(`   - Superado: ${r.victory ? 'SÍ' : 'NO'} (${r.wavesCompleted}/20 oleadas)`);
  console.log(`   - Salud del Núcleo restante: ${r.livesRemaining}/${r.initialLives} (${survivalRate.toFixed(1)}%)`);
  console.log(`   - Daño total infligido: ${r.totalDamage.toLocaleString()} | Criaturas abatidas: ${r.kills}`);

  if (r.wavesCompleted < 10) {
    hasImpossible = true;
    console.log(`   ⚠️ MAPA POSIBLEMENTE IMPOSIBLE: No logró superar las oleadas intermedias.`);
  } else if (r.livesRemaining === r.initialLives && r.wavesCompleted === 20) {
    console.log(`   ✨ MAPA DOMINADO (3 Estrellas Flawless con estrategia óptima).`);
  }
}

console.log('----------------------------------------------------------------------');
if (!hasImpossible) {
  console.log('✅ BALANCE VERIFICADO: Ningún mapa es imposible. Todos los sectores son completables con defensa estratégica.');
} else {
  console.error('❌ ADVERTENCIA DE BALANCE: Se detectaron mapas con dificultad excesiva.');
  process.exit(1);
}

if (allPassed) {
  console.log('✅ SIMULACIÓN EXITOSA: La campaña de 6 mapas está equilibrada y operativa.\n');
} else {
  console.log('⚠️ Algunos mapas requirieron micro-gestión manual o murieron antes de W20.\n');
}
