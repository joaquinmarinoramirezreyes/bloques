/**
 * scripts/run-all.js
 * Ejecuta en secuencia:
 * 1. scripts/sin-emojis.js
 * 2. scripts/smoke.js
 * 3. scripts/audit_touch_targets.js
 * 4. Todos los archivos test_*.js en la raíz
 * 5. Todos los archivos scripts/test_*.js
 *
 * Imprime una tabla consolidada con el resultado (PASA / FALLA) de cada suite.
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

// 1. Herramientas core solicitadas en orden
const coreTools = [
  'scripts/sin-emojis.js',
  'scripts/smoke.js',
  'scripts/audit_touch_targets.js'
];

// 2. Archivos test_*.js en la raíz
const rootTests = fs.readdirSync(ROOT_DIR)
  .filter(f => f.startsWith('test_') && f.endsWith('.js'))
  .sort();

// 3. Archivos scripts/test_*.js
const scriptTests = fs.readdirSync(path.join(ROOT_DIR, 'scripts'))
  .filter(f => f.startsWith('test_') && f.endsWith('.js'))
  .map(f => path.posix.join('scripts', f))
  .sort();

const allSuites = [
  ...coreTools.map(t => ({ path: t, group: 'Validación' })),
  ...rootTests.map(t => ({ path: t, group: 'Test Raíz' })),
  ...scriptTests.map(t => ({ path: t, group: 'Test Scripts' }))
];

console.log('='.repeat(80));
console.log('  EJECUTANDO SUITE COMPLETA DE PRUEBAS DEL ARCADE');
console.log('='.repeat(80));
console.log(`Total de suites a ejecutar: ${allSuites.length}\n`);

const results = [];

for (let i = 0; i < allSuites.length; i++) {
  const suite = allSuites[i];
  const fullPath = path.join(ROOT_DIR, suite.path);
  const numStr = `[${String(i + 1).padStart(2, '0')}/${allSuites.length}]`;

  process.stdout.write(`${numStr} ${suite.path.padEnd(46)} `);

  const startTime = Date.now();
  const proc = spawnSync(process.execPath, [fullPath], {
    cwd: ROOT_DIR,
    stdio: 'pipe',
    timeout: 120000,
    env: { ...process.env, NODE_ENV: 'test' }
  });
  const durationMs = Date.now() - startTime;
  const passed = proc.status === 0;

  results.push({
    num: i + 1,
    suite: suite.path,
    group: suite.group,
    durationMs,
    passed,
    exitCode: proc.status,
    stderr: proc.stderr ? proc.stderr.toString() : '',
    stdout: proc.stdout ? proc.stdout.toString() : ''
  });

  if (passed) {
    console.log(`PASA  (${durationMs} ms)`);
  } else {
    console.log(`FALLA (${durationMs} ms, code ${proc.status})`);
  }
}

// Imprimir tabla formateada
console.log('\n' + '='.repeat(80));
console.log('TABLA CONSOLIDADA DE RESULTADOS:');
console.log('='.repeat(80));
console.log('| N° | Suite / Archivo                               | Grupo        | Tiempo   | Estado |');
console.log('|---|------------------------------------------------|--------------|----------|--------|');

for (const r of results) {
  const num = String(r.num).padStart(2, ' ');
  const name = r.suite.padEnd(46, ' ');
  const grp = r.group.padEnd(12, ' ');
  const time = `${(r.durationMs / 1000).toFixed(2)}s`.padStart(8, ' ');
  const status = r.passed ? 'PASA  ' : 'FALLA ';
  console.log(`| ${num} | ${name} | ${grp} | ${time} | ${status} |`);
}

console.log('='.repeat(80));

const passedCount = results.filter(r => r.passed).length;
const failedCount = results.filter(r => !r.passed).length;

console.log(`\nRESUMEN: ${passedCount} PASARON / ${failedCount} FALLARON (Total: ${results.length})`);

if (failedCount > 0) {
  console.error('\nDETALLE DE FALLOS:');
  for (const r of results) {
    if (!r.passed) {
      console.error(`\n--- Falló: ${r.suite} (Código: ${r.exitCode}) ---`);
      if (r.stderr) console.error(`STDERR:\n${r.stderr.slice(0, 500)}`);
      if (r.stdout) console.error(`STDOUT:\n${r.stdout.slice(0, 500)}`);
    }
  }
  process.exit(1);
} else {
  console.log('\n¡TODAS LAS SUITES Y HERRAMIENTAS PASARON EXITOSAMENTE!');
  process.exit(0);
}
