/**
 * test_lumen.js - Pruebas unitarias en Node para Lumen (Pac-Man Style Edition)
 */
const assert = require('assert');
const { CONFIG, LumenLogic } = require('./games/lumen/game.js');

console.log('--- INICIANDO TEST: LUMEN (PAC-MAN STYLE ARCADE 80s) ---');

// 1. Verificación de configuración del juego
assert.strictEqual(CONFIG.COLS, 15, 'Debe tener 15 columnas en la cuadrícula');
assert.strictEqual(CONFIG.ROWS, 19, 'Debe tener 19 filas en la cuadrícula');
assert.strictEqual(CONFIG.TILE_SIZE, 22, 'Tamaño de celda debe ser 22px');
assert.strictEqual(CONFIG.WORLDS.length, 5, 'Deben existir 5 mundos temáticos');
assert.strictEqual(CONFIG.SHADOW_TYPES.length, 4, 'Deben existir 4 sombras icónicas (Carmesí, Rosa, Turquesa, Ámbar)');
assert.strictEqual(CONFIG.ACHIEVEMENTS.length, 10, 'Deben existir exactamente 10 logros');
assert.strictEqual(CONFIG.LEVEL_TEMPLATES.length, 6, 'Deben existir 6 plantillas maestras de laberinto');
assert.strictEqual(CONFIG.STARTING_LIVES, 3, 'El jugador debe iniciar con 3 vidas');
assert.strictEqual(CONFIG.STORAGE_KEY, 'lumen:v2', 'Clave de persistencia debe ser lumen:v2');

// Comprobar mundos y distribución de 30 niveles
for (let w = 1; w <= 5; w++) {
  const world = CONFIG.WORLDS.find(item => item.id === w);
  assert.ok(world, `Mundo ${w} debe estar definido`);
  assert.ok(world.name, `Mundo ${w} debe tener nombre`);
  assert.ok(world.color, `Mundo ${w} debe tener color representativo`);
}
console.log('OK Configuración básica validada: 5 mundos, 4 sombras, 10 logros y 6 plantillas maestras');

// 2. Conectividad y alcanzabilidad BFS en las 6 plantillas de laberinto
CONFIG.LEVEL_TEMPLATES.forEach((tmpl, idx) => {
  assert.strictEqual(tmpl.length, 19, `Plantilla ${idx} debe tener 19 filas`);
  tmpl.forEach((line, r) => {
    assert.strictEqual(line.length, 15, `Plantilla ${idx}, fila ${r} debe tener 15 columnas`);
  });

  const parsed = LumenLogic.parseLevel(tmpl);
  assert.ok(parsed.playerPos, `Plantilla ${idx} debe tener posición inicial de jugador 'P'`);
  assert.strictEqual(parsed.superDots.length, 4, `Plantilla ${idx} debe contener 4 Super Orbes 'L'`);
  assert.ok(parsed.houseGhosts.length >= 2, `Plantilla ${idx} debe contener spawns de la casa de sombras 'E'`);
  assert.ok(parsed.dotsCount >= 120, `Plantilla ${idx} debe contener al menos 120 orbes (encontrados: ${parsed.dotsCount})`);

  // BFS para verificar que el 100% de los orbes sean alcanzables desde el spawn del jugador
  const visited = Array.from({ length: CONFIG.ROWS }, () => Array(CONFIG.COLS).fill(false));
  const queue = [{ r: parsed.playerPos.r, c: parsed.playerPos.c }];
  visited[parsed.playerPos.r][parsed.playerPos.c] = true;

  while (queue.length > 0) {
    const curr = queue.shift();
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of dirs) {
      let nr = curr.r + dr;
      let nc = curr.c + dc;
      // Túnel lateral en fila 9 con wrap-around
      if (nr === 9 && (nc < 0 || nc >= CONFIG.COLS)) {
        nc = (nc + CONFIG.COLS) % CONFIG.COLS;
      }
      if (nr >= 0 && nr < CONFIG.ROWS && nc >= 0 && nc < CONFIG.COLS) {
        if (!visited[nr][nc] && tmpl[nr][nc] !== '#') {
          visited[nr][nc] = true;
          queue.push({ r: nr, c: nc });
        }
      }
    }
  }

  // Verificar que todas las celdas con orbes o super orbes fueron visitadas
  let unreachableDots = 0;
  for (let r = 0; r < CONFIG.ROWS; r++) {
    for (let c = 0; c < CONFIG.COLS; c++) {
      const ch = tmpl[r][c];
      if ((ch === '.' || ch === 'L') && !visited[r][c]) {
        unreachableDots++;
      }
    }
  }
  assert.strictEqual(unreachableDots, 0, `Plantilla ${idx} tiene ${unreachableDots} orbes inalcanzables`);

  // Comprobar que la salida de la casa central de sombras en col 7 no esté bloqueada por un muro
  for (let r = 7; r <= 9; r++) {
    assert.notStrictEqual(tmpl[r][7], '#', `Plantilla ${idx}: salida de casa central bloqueada en (${r}, 7)`);
  }
});
console.log('OK Las 6 plantillas de laberinto son 100% conexas y todos sus orbes son alcanzables por BFS');

// 3. Conectividad de túneles laterales de envoltura (wrap-around en fila 9)
{
  const tmpl = CONFIG.LEVEL_TEMPLATES[0];
  const parsed = LumenLogic.parseLevel(tmpl);
  assert.strictEqual(LumenLogic.isTilePassable(parsed.grid, 9, -1), true, 'Túnel lateral izquierdo debe ser transitable');
  assert.strictEqual(LumenLogic.isTilePassable(parsed.grid, 9, CONFIG.COLS), true, 'Túnel lateral derecho debe ser transitable');
  assert.strictEqual(LumenLogic.isTilePassable(parsed.grid, -1, 5), false, 'Fuera de límites vertical no debe ser transitable');
  assert.strictEqual(LumenLogic.isTilePassable(parsed.grid, CONFIG.ROWS, 5), false, 'Fuera de límites vertical no debe ser transitable');
  console.log('OK Túneles laterales de transporte cuántico y límites de cuadrícula verificados');
}

// 4. Métodos auxiliares de lógica (LumenLogic)
{
  // Direcciones opuestas
  const up = { r: -1, c: 0 };
  const down = { r: 1, c: 0 };
  const left = { r: 0, c: -1 };
  const right = { r: 0, c: 1 };
  assert.strictEqual(LumenLogic.isOpposite(up, down), true, 'Arriba y abajo son opuestos');
  assert.strictEqual(LumenLogic.isOpposite(left, right), true, 'Izquierda y derecha son opuestos');
  assert.strictEqual(LumenLogic.isOpposite(up, left), false, 'Arriba e izquierda no son opuestos');

  // Distancias Manhattan y Euclidiana al cuadrado
  assert.strictEqual(LumenLogic.distManhattan(0, 0, 3, 4), 7, 'Distancia Manhattan de (0,0) a (3,4) debe ser 7');
  assert.strictEqual(LumenLogic.distSq(0, 0, 3, 4), 25, 'Distancia Euclidiana al cuadrado de (0,0) a (3,4) debe ser 25');

  // Comportamiento de puertas (allowDoor)
  const tmpl = CONFIG.LEVEL_TEMPLATES[0];
  const parsed = LumenLogic.parseLevel(tmpl);
  // En fila 8, col 7 se encuentra la puerta de la casa de sombras ('-')
  assert.strictEqual(parsed.grid[8][7], 5, 'Celda (8, 7) debe ser tipo puerta (valor 5)');
  assert.strictEqual(LumenLogic.isTilePassable(parsed.grid, 8, 7, false), false, 'Puerta cerrada para sombras normales');
  assert.strictEqual(LumenLogic.isTilePassable(parsed.grid, 8, 7, true), true, 'Puerta transitable para sombras en salida o comida');
  console.log('OK Métodos auxiliares de geometría, distancias y transitabilidad de puertas validados');
}

// 5. Verificación de roles y esquinas de sombras
{
  const expectedCorners = [
    { r: 1, c: 13 },
    { r: 1, c: 1 },
    { r: 17, c: 13 },
    { r: 17, c: 1 }
  ];
  CONFIG.SHADOW_TYPES.forEach((shadow, idx) => {
    assert.strictEqual(shadow.corner.r, expectedCorners[idx].r);
    assert.strictEqual(shadow.corner.c, expectedCorners[idx].c);
  });
  console.log('OK Las 4 sombras tienen sus 4 esquinas de dispersión correctamente distribuidas');
}

console.log('--- TODOS LOS TESTS DE LUMEN PASARON EXITOSAMENTE ---');
