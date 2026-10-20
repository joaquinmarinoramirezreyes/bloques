// ============================================================================
// PRUEBAS AUTOMATIZADAS: ÉPOCAS (80, 90, 00) Y REGLAS DE DESARROLLO
// ============================================================================

const fs = require('fs');

function test(name, fn) {
  try {
    fn();
    console.log(`  OK [PASSED] ${name}`);
  } catch (err) {
    console.error(`  X [FAILED] ${name}`);
    console.error(`    ${err.message}`);
    process.exit(1);
  }
}

console.log('==========================================================');
console.log('   PRUEBAS DE ÉPOCAS ARCADE (80, 90, 00) Y REGLAS');
console.log('==========================================================\n');

// 1. Verificar archivo REGLAS-JUEGOS.md
test('REGLAS-JUEGOS.md existe en la raíz y contiene las directivas canónicas', () => {
  if (!fs.existsSync('REGLAS-JUEGOS.md')) {
    throw new Error('No se encontró REGLAS-JUEGOS.md en la raíz');
  }
  const content = fs.readFileSync('REGLAS-JUEGOS.md', 'utf8');
  const requiredKeywords = [
    'Vanilla JavaScript',
    '/shared',
    'Móvil Primero',
    '60 FPS',
    'ArcadeStorage',
    'Web Audio',
    'CONFIG',
    'Arte Vectorial',
    'commit ni push'
  ];
  for (const kw of requiredKeywords) {
    if (!content.toLowerCase().includes(kw.toLowerCase())) {
      throw new Error(`REGLAS-JUEGOS.md no incluye la regla obligatoria: "${kw}"`);
    }
  }
});

// 2. Verificar games.json y asignación de épocas
test('games.json define campo "eras" para cada juego con valores válidos', () => {
  const games = JSON.parse(fs.readFileSync('games.json', 'utf8'));
  const validEras = ['80', '90', '00'];

  games.forEach(g => {
    if (!Array.isArray(g.eras) || g.eras.length === 0) {
      throw new Error(`El juego "${g.id}" no tiene un arreglo "eras" válido`);
    }
    g.eras.forEach(e => {
      if (!validEras.includes(e)) {
        throw new Error(`El juego "${g.id}" tiene una época no válida: ${e}`);
      }
    });
  });

  // Verificar asignación exacta según especificación:
  // 80 = bloques, snake, rompemuros, defensaorbital, fronton, lumen
  const era80 = games.filter(g => g.eras.includes('80')).map(g => g.id);
  ['bloques', 'snake', 'rompemuros', 'defensaorbital', 'fronton', 'lumen'].forEach(id => {
    if (!era80.includes(id)) throw new Error(`El juego "${id}" debe pertenecer a la época 80`);
  });

  // 90 = derrape, sombras, campominado, gotas, cargas
  const era90 = games.filter(g => g.eras.includes('90')).map(g => g.id);
  ['derrape', 'sombras', 'campominado', 'gotas', 'cargas'].forEach(id => {
    if (!era90.includes(id)) throw new Error(`El juego "${id}" debe pertenecer a la época 90`);
  });

  // 00 = abismo, corredor, cristales, lanzaburbujas, bastion
  const era00 = games.filter(g => g.eras.includes('00')).map(g => g.id);
  ['abismo', 'corredor', 'cristales', 'lanzaburbujas', 'bastion'].forEach(id => {
    if (!era00.includes(id)) throw new Error(`El juego "${id}" debe pertenecer a la época 00`);
  });

  // Juegos que aún no existen deben estar fuera del catálogo
  const unreleased = [];
  unreleased.forEach(u => {
    if (games.some(g => g.id === u)) {
      throw new Error(`El juego aún no creado "${u}" debe quedar fuera del catálogo`);
    }
  });
});

// 3. Verificar vercel.json rewrites
test('vercel.json contiene rewrites para las rutas /80, /90 y /00 hacia /index.html', () => {
  const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  if (!Array.isArray(vercel.rewrites)) {
    throw new Error('vercel.json no define la sección "rewrites"');
  }

  const rewrites = vercel.rewrites;
  const sources = rewrites.map(r => r.source);

  if (!sources.includes('/80') || !sources.includes('/90') || !sources.includes('/00')) {
    throw new Error('Faltan rewrites para /80, /90 o /00 en vercel.json');
  }

  rewrites.forEach(r => {
    if (['/80', '/90', '/00'].includes(r.source) && r.destination !== '/index.html') {
      throw new Error(`Rewrite para ${r.source} debe apuntar a /index.html`);
    }
  });
});

// 4. Verificar detección de rutas y títulos en menu.js
test('menu.js detecta rutas de épocas, asigna títulos canónicos y maneja rutas inválidas', () => {
  const menu = require('./menu.js');

  // Títulos exactos requeridos
  if (menu.ERA_CONFIGS['80'].title !== 'Arcade 80') {
    throw new Error(`Título de 80 esperado "Arcade 80", actual: "${menu.ERA_CONFIGS['80'].title}"`);
  }
  if (menu.ERA_CONFIGS['90'].title !== 'Arcade 90') {
    throw new Error(`Título de 90 esperado "Arcade 90", actual: "${menu.ERA_CONFIGS['90'].title}"`);
  }
  if (menu.ERA_CONFIGS['00'].title !== 'Arcade 00') {
    throw new Error(`Título de 00 esperado "Arcade 00", actual: "${menu.ERA_CONFIGS['00'].title}"`);
  }

  // Simular detección de rutas
  const testCases = [
    { path: '/80', expected: '80' },
    { path: '/80/', expected: '80' },
    { path: '/90', expected: '90' },
    { path: '/00', expected: '00' },
    { path: '/70', expected: null },
    { path: '/juegos', expected: null },
    { path: '/', expected: null },
    { path: '', expected: null }
  ];

  testCases.forEach(tc => {
    global.window = {
      location: {
        pathname: tc.path,
        search: '',
        hash: ''
      }
    };
    const detected = menu.detectEra();
    if (detected !== tc.expected) {
      throw new Error(`Para ruta "${tc.path}": esperado "${tc.expected}", detectado "${detected}"`);
    }
  });
});

// 5. Filtrado de catálogo fallback en menu.js
test('FALLBACK_GAMES en menu.js está sincronizado con las épocas asignadas', () => {
  const menu = require('./menu.js');
  const fallback = menu.FALLBACK_GAMES;

  const count80 = fallback.filter(g => g.eras && g.eras.includes('80')).length;
  const count90 = fallback.filter(g => g.eras && g.eras.includes('90')).length;
  const count00 = fallback.filter(g => g.eras && g.eras.includes('00')).length;

  if (count80 !== 6) throw new Error(`Época 80 debe tener 6 juegos, encontrados: ${count80}`);
  if (count90 !== 5) throw new Error(`Época 90 debe tener 5 juegos, encontrados: ${count90}`);
  if (count00 !== 5) throw new Error(`Época 00 debe tener 5 juegos, encontrados: ${count00}`);
});

console.log('\n==========================================================');
console.log('RESULTADO: TODAS LAS PRUEBAS DE ÉPOCAS SUPERADAS AL 100%');
console.log('==========================================================');
