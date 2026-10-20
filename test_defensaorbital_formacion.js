const fs = require('fs');
const path = require('path');
const OleadasModule = require('./games/defensaorbital/oleadas.js');

console.log('==========================================================');
console.log('   PRUEBAS AUTOMATIZADAS: DEFENSA ORBITAL - FORMACIÓN');
console.log('==========================================================\n');

let passed = 0;
let total = 0;

function test(title, fn) {
  total++;
  try {
    fn();
    console.log(`  OK [PASSED] ${title}`);
    passed++;
  } catch (err) {
    console.error(`  X [FAILED] ${title}`);
    console.error(`    ${err.message}`);
  }
}

// 1. Verificar catálogo de trayectorias Bézier
test('Existen al menos 5 trayectorias Bézier cúbicas con puntos de control válidos', () => {
  const trajKeys = Object.keys(OleadasModule.TRAYECTORIAS);
  if (trajKeys.length < 5) {
    throw new Error(`Se esperaban al menos 5 trayectorias, encontradas: ${trajKeys.length}`);
  }

  trajKeys.forEach(key => {
    const t = OleadasModule.TRAYECTORIAS[key];
    if (!t.p0 || typeof t.p0.x !== 'number' || typeof t.p0.y !== 'number') throw new Error(`P0 inválido en ${key}`);
    if (!t.p1 || typeof t.p1.x !== 'number' || typeof t.p1.y !== 'number') throw new Error(`P1 inválido en ${key}`);
    if (!t.p2 || typeof t.p2.x !== 'number' || typeof t.p2.y !== 'number') throw new Error(`P2 inválido en ${key}`);
    if (typeof t.duration !== 'number' || t.duration <= 0) throw new Error(`Duración inválida en ${key}`);

    // Evaluar curva en puntos muestreados t = 0, 0.25, 0.5, 0.75, 1
    const p3 = { x: 240, y: 150 };
    [0, 0.25, 0.5, 0.75, 1.0].forEach(progress => {
      const point = OleadasModule.evaluateCubicBezier(t.p0, t.p1, t.p2, p3, progress);
      if (isNaN(point.x) || isNaN(point.y) || isNaN(point.angle)) {
        throw new Error(`Error numérico evaluando ${key} en t=${progress}`);
      }
    });
  });
});

// 2. Verificar tipos de enemigos
test('Se definen tipos de enemigos originales con estadísticas y colores de renderizado', () => {
  const tipos = OleadasModule.TIPOS_ENEMIGOS;
  const keys = Object.keys(tipos);
  if (keys.length < 3) throw new Error('Se requieren al menos 3 tipos de enemigos originales');

  keys.forEach(k => {
    const e = tipos[k];
    if (!e.name || !e.primaryColor || !e.secondaryColor) throw new Error(`Datos visuales incompletos en ${k}`);
    if (e.hp <= 0 || e.scoreFormation <= 0 || e.scoreDiving <= e.scoreFormation) {
      throw new Error(`Puntuaciones o vida inconsistentes en ${k}`);
    }
  });
});

// 3. Verificar que todas las oleadas asignan casillas válidas y únicas sin enemigos huérfanos
test('Todas las oleadas asignan casillas dentro de la cuadrícula sin solapamiento de destino', () => {
  const config = OleadasModule.FORMACION_CONFIG;

  for (let w = 1; w <= 12; w++) {
    const wave = OleadasModule.getWaveConfig(w);
    if (wave.isBoss) {
      if (!wave.boss || wave.boss.hp <= 0) {
        throw new Error(`Oleada de Jefe ${w} no tiene configuración válida de boss`);
      }
      continue;
    }

    if (!wave || !Array.isArray(wave.groups) || wave.groups.length === 0) {
      throw new Error(`Oleada ${w} no tiene grupos definidos`);
    }

    const occupiedSlots = new Set();
    let totalEnemiesInWave = 0;

    wave.groups.forEach((group, gIdx) => {
      if (!OleadasModule.TRAYECTORIAS[group.trajectoryId]) {
        throw new Error(`Oleada ${w}, Grupo ${gIdx}: Trayectoria desconocida ${group.trajectoryId}`);
      }
      if (!OleadasModule.TIPOS_ENEMIGOS[group.enemyType]) {
        throw new Error(`Oleada ${w}, Grupo ${gIdx}: Tipo de enemigo desconocido ${group.enemyType}`);
      }
      if (!Array.isArray(group.slots) || group.slots.length === 0) {
        throw new Error(`Oleada ${w}, Grupo ${gIdx}: No tiene casillas de destino asignadas`);
      }

      group.slots.forEach(slot => {
        totalEnemiesInWave++;
        // Validar rango dentro de la rejilla
        if (slot.row < 0 || slot.row >= config.ROWS) {
          throw new Error(`Oleada ${w}: Fila ${slot.row} fuera de rango [0, ${config.ROWS - 1}]`);
        }
        if (slot.col < 0 || slot.col >= config.COLS) {
          throw new Error(`Oleada ${w}: Columna ${slot.col} fuera de rango [0, ${config.COLS - 1}]`);
        }

        const slotKey = `${slot.row},${slot.col}`;
        if (occupiedSlots.has(slotKey)) {
          throw new Error(`Oleada ${w}: Casilla duplicada ${slotKey} asignada a múltiples enemigos`);
        }
        occupiedSlots.add(slotKey);
      });
    });

    if (totalEnemiesInWave < 10) {
      throw new Error(`Oleada ${w} tiene muy pocos enemigos: ${totalEnemiesInWave}`);
    }
  }
});

// 4. Verificar etapas de bonificación cada 4 oleadas
test('Las oleadas 4, 8 y 12 están configuradas como Etapas Especiales de Bonificación', () => {
  [4, 8, 12].forEach(w => {
    const wave = OleadasModule.getWaveConfig(w);
    if (!wave.isBonus) {
      throw new Error(`Oleada ${w} debía ser etapa de bonificación`);
    }
  });

  [1, 2, 3, 5, 6, 7].forEach(w => {
    const wave = OleadasModule.getWaveConfig(w);
    if (wave.isBonus) {
      throw new Error(`Oleada ${w} NO debía ser etapa de bonificación`);
    }
  });
});

console.log(`\n==========================================================`);
console.log(`RESULTADO: ${passed} / ${total} PRUEBAS SUPERADAS (${Math.round((passed / total) * 100)}%)`);
console.log(`==========================================================`);

if (passed !== total) process.exit(1);
