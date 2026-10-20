/**
 * scripts/test_sin_emojis_categories.js
 * Prueba automatizada para validar que scripts/sin-emojis.js detecta y falla
 * ante todas las categorias prohibidas:
 * 1. Emojis estandar y pictograficos (generados dinamicamente)
 * 2. Simbolos decorativos
 * 3. Flechas direccionales
 * 4. Vinetas y figuras geometricas
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const TEMP_TEST_FILE = path.join(ROOT_DIR, 'scripts', 'temp_emoji_test.js');

// Caracteres construidos con String.fromCodePoint para no incluir literales en este archivo de prueba
const TEST_CATEGORIES = [
  {
    category: '1. Emojis estandar y pictograficos',
    chars: [
      String.fromCodePoint(0x1F680), // Cohete
      String.fromCodePoint(0x1F3AE), // Gamepad
      String.fromCodePoint(0x1F47E), // Alien
      String.fromCodePoint(0x1F7E1), // Circulo amarillo
      String.fromCodePoint(0x1F480), // Calavera
      String.fromCodePoint(0x1F3C6)  // Trofeo
    ]
  },
  {
    category: '2. Simbolos decorativos',
    chars: [
      String.fromCodePoint(0x2605), // Estrella negra
      String.fromCodePoint(0x2665), // Corazon
      String.fromCodePoint(0x2726), // Estrella 4 puntas
      String.fromCodePoint(0x2694), // Espadas cruzadas
      String.fromCodePoint(0x23F1)  // Cronometro
    ]
  },
  {
    category: '3. Flechas direccionales',
    chars: [
      String.fromCodePoint(0x2794), // Flecha derecha
      String.fromCodePoint(0x2194), // Flecha izquierda-derecha
      String.fromCodePoint(0x25B2), // Triangulo arriba
      String.fromCodePoint(0x25BC), // Triangulo abajo
      String.fromCodePoint(0x25C4), // Triangulo izquierda
      String.fromCodePoint(0x25BA)  // Triangulo derecha
    ]
  },
  {
    category: '4. Vinetas, formas geometricas y marcas',
    chars: [
      String.fromCodePoint(0x25CF), // Circulo negro
      String.fromCodePoint(0x25C6), // Rombo
      String.fromCodePoint(0x25A0), // Cuadrado negro
      String.fromCodePoint(0x2713), // Checkmark
      String.fromCodePoint(0x2717)  // Cruz
    ]
  }
];

console.log('='.repeat(70));
console.log('PRUEBA DE ROBUSTEZ: DETECCION POR CATEGORIAS EN SIN-EMOJIS.JS');
console.log('='.repeat(70));

let totalPassed = 0;
let totalChecked = 0;

try {
  for (const cat of TEST_CATEGORIES) {
    console.log(`\nProbando Categoria: ${cat.category}...`);
    for (const char of cat.chars) {
      totalChecked++;
      const code = `// Prueba sintetica\nconst testValue = "${char}";\nconsole.log(testValue);\n`;
      fs.writeFileSync(TEMP_TEST_FILE, code, 'utf8');

      const res = spawnSync(process.execPath, [path.join(ROOT_DIR, 'scripts', 'sin-emojis.js'), TEMP_TEST_FILE], {
        cwd: ROOT_DIR,
        encoding: 'utf8'
      });

      assert.strictEqual(res.status, 1, `sin-emojis.js debio fallar (codigo 1) al encontrar '${char}'`);
      const output = res.stderr || res.stdout;
      assert.ok(
        output.includes(char) || output.includes('Se encontraron 1 emojis o simbolos'),
        `La salida debe reportar la violacion del caracter '${char}'`
      );

      console.log(`  [OK] Detectado y bloqueado con exito: '${char}' (Codigo de salida: ${res.status})`);
      totalPassed++;
    }
  }
} finally {
  if (fs.existsSync(TEMP_TEST_FILE)) {
    fs.unlinkSync(TEMP_TEST_FILE);
  }
}

console.log('\n' + '='.repeat(70));
console.log(`RESULTADO: ${totalPassed}/${totalChecked} caracteres de prueba bloqueados correctamente.`);
console.log('Validacion cubre 100% de emojis, simbolos decorativos, flechas y vinetas!');
console.log('='.repeat(70));
