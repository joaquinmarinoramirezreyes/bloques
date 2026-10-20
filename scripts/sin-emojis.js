/**
 * scripts/sin-emojis.js
 * Validador estricto anti-emojis y símbolos Unicode decorativos.
 * Falla con código de salida 1 si encuentra emojis o símbolos decorativos
 * en HTML, CSS, JS, JSON o textos de producción.
 *
 * Uso:
 *   node scripts/sin-emojis.js           (escanea todo el repositorio de producción)
 *   node scripts/sin-emojis.js games/xyz (escanea un juego específico)
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

// Regex exhaustivo de emojis y símbolos Unicode decorativos (representado mediante secuencias de escape Unicode)
const EMOJI_AND_SYMBOLS_REGEX = /[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{25A0}-\u{25FF}\u{2190}-\u{21FF}\u{2900}-\u{297F}\u{231A}-\u{231B}\u{23E9}-\u{23EC}\u{23F0}\u{23F3}\u{25AA}-\u{25AB}\u{25FB}-\u{25FE}\u2694\u23F1\u2194\u25CF\u2605\u2665\u2726\u25B2\u25BC\u25C4\u25BA\u25C6\u2713\u2717]/u;

const IGNORE_DIRS = new Set(['node_modules', '.git', 'capturas', '.gemini']);

// Archivos excluidos (únicamente la documentación histórica de auditoría que recopiló los emojis originales)
const EXCLUDE_FILES = new Set([
  'AUDITORIA.md'
]);

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, fileList);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.html', '.css', '.js', '.json'].includes(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

const targetArg = process.argv[2];
let targetPath = ROOT_DIR;
if (targetArg) {
  targetPath = path.resolve(ROOT_DIR, targetArg);
}

const files = fs.statSync(targetPath).isDirectory() ? walk(targetPath) : [targetPath];

let violations = [];

for (const f of files) {
  const rel = path.relative(ROOT_DIR, f).replace(/\\/g, '/');
  if (EXCLUDE_FILES.has(rel)) continue;

  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const matches = line.match(new RegExp(EMOJI_AND_SYMBOLS_REGEX.source, 'gu'));
    if (matches) {
      matches.forEach(ch => {
        violations.push({
          file: rel,
          line: idx + 1,
          char: ch,
          snippet: line.trim().slice(0, 80)
        });
      });
    }
  });
}

if (violations.length > 0) {
  console.error(`[ERROR] Se encontraron ${violations.length} emojis o simbolos Unicode no permitidos:\n`);
  violations.slice(0, 30).forEach(v => {
    console.error(`  - ${v.file}:${v.line} [${v.char}] -> ${v.snippet}`);
  });
  if (violations.length > 30) {
    console.error(`  ... y ${violations.length - 30} mas.`);
  }
  console.error('\nConsulta REGLAS-JUEGOS.md (Seccion 8). Reemplazalos por iconos vectoriales de shared/icons.js.');
  process.exit(1);
} else {
  console.log(`[OK] Validacion limpia! Cero emojis o simbolos no permitidos en ${files.length} archivos analizados.`);
  process.exit(0);
}
