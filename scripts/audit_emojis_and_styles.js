/**
 * scripts/audit_emojis_and_styles.js
 * Auditoría profunda de emojis, símbolos Unicode, paletas, tipografías y estilos
 * en todo el repositorio del Arcade.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

// Regex de emojis y símbolos Unicode decorativos
const EMOJI_AND_SYMBOLS_REGEX = /[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{25A0}-\u{25FF}\u{2190}-\u{21FF}\u{2900}-\u{297F}\u{231A}-\u{231B}\u{23E9}-\u{23EC}\u{23F0}\u{23F3}\u{25AA}-\u{25AB}\u{25FB}-\u{25FE}\u2694\u23F1\u2194\u25CF\u2605\u2665\u2726\u25B2\u25BC\u25C4\u25BA\u25C6]/u;

// Ignorar ciertas carpetas
const IGNORE_DIRS = new Set(['node_modules', '.git', 'capturas', '.gemini']);

function walkDir(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, fileList);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.html', '.css', '.js', '.json', '.md'].includes(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

console.log('[CHECK] Iniciando escaneo de archivos en el Arcade...');
const files = walkDir(ROOT_DIR);
console.log(`Encontrados ${files.length} archivos para auditar.\n`);

const emojiFindings = [];
const colorPaletteFindings = {};
const typographyFindings = {};
const glowGradientsFindings = {};
const textToneFindings = [];

// Lista de archivos a excluir de la auditoría de emojis (por ejemplo este script o AUDITORIA.md previa)
const EXCLUDE_EMOJI_FILES = [
  path.join(ROOT_DIR, 'scripts', 'audit_emojis_and_styles.js'),
  path.join(ROOT_DIR, 'AUDITORIA.md'),
  path.join(ROOT_DIR, 'package-lock.json')
];

for (const filePath of files) {
  if (EXCLUDE_EMOJI_FILES.includes(filePath)) continue;
  const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    // 1. Detección de emojis y símbolos
    const matches = line.match(new RegExp(EMOJI_AND_SYMBOLS_REGEX.source, 'gu'));
    if (matches) {
      matches.forEach(ch => {
        // Ignorar flechas ASCII simples o markdown links estándar si no son símbolos
        let usage = 'Decoración o icono';
        if (line.includes('<button') || line.includes('class="btn') || line.includes('icon-btn') || line.includes('btn-')) {
          usage = 'Icono de botón';
        } else if (line.includes('badge') || line.includes('stat-icon') || line.includes('stat-badge')) {
          usage = 'Insignia o HUD de estadísticas';
        } else if (line.includes('fillText') || line.includes('ctx.')) {
          usage = 'Renderizado en Canvas';
        } else if (line.includes('title') || line.includes('<h1>') || line.includes('<h2>') || line.includes('<h3>')) {
          usage = 'Encabezado o título';
        } else if (relPath.endsWith('json')) {
          usage = 'Metadatos de juego o catálogo';
        } else if (relPath.endsWith('css')) {
          usage = 'Icono o contenido en CSS (content / font)';
        } else if (line.includes('toast') || line.includes('logro') || line.includes('achievement')) {
          usage = 'Notificación de logro / toast';
        }

        emojiFindings.push({
          file: relPath,
          line: lineNum,
          char: ch,
          usage: usage,
          snippet: line.trim().slice(0, 100)
        });
      });
    }

    // 2. Detección de paletas y colores repetidos en CSS
    if (filePath.endsWith('.css')) {
      const colorMatches = line.match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/g);
      if (colorMatches) {
        if (!colorPaletteFindings[relPath]) colorPaletteFindings[relPath] = new Set();
        colorMatches.forEach(c => colorPaletteFindings[relPath].add(c.toLowerCase()));
      }

      // Brillo neón repetido y degradados
      if (line.includes('box-shadow') && (line.includes('0 0') || line.includes('rgba('))) {
        if (!glowGradientsFindings[relPath]) glowGradientsFindings[relPath] = [];
        glowGradientsFindings[relPath].push({ line: lineNum, snippet: line.trim() });
      }
      if (line.includes('linear-gradient') || line.includes('radial-gradient')) {
        if (!glowGradientsFindings[relPath]) glowGradientsFindings[relPath] = [];
        glowGradientsFindings[relPath].push({ line: lineNum, snippet: line.trim() });
      }

      // Tipografías
      if (line.includes('font-family')) {
        if (!typographyFindings[relPath]) typographyFindings[relPath] = [];
        typographyFindings[relPath].push({ line: lineNum, snippet: line.trim() });
      }
    }

    // 3. Textos con tono exagerado o exclamaciones repetidas
    if (line.includes('¡') || line.includes('ÉPICO') || line.includes('INCREÍBLE') || line.includes('LEGENDARIO') || line.includes('MAGNÍFICO') || line.includes('CATACLISMO') || line.includes('IMPARABLE') || line.includes('MAESTRÍA')) {
      // Filtrar sólo si parece texto de interfaz
      if (line.includes('textContent') || line.includes('innerHTML') || line.includes('>') || line.includes('name:') || line.includes('desc:')) {
        textToneFindings.push({
          file: relPath,
          line: lineNum,
          snippet: line.trim().slice(0, 120)
        });
      }
    }
  });
}

console.log(`[OK] Hallazgos de emojis y símbolos: ${emojiFindings.length}`);
console.log(`[OK] Archivos CSS con paletas extraídas: ${Object.keys(colorPaletteFindings).length}`);
console.log(`[OK] Archivos CSS con brillos/degradados: ${Object.keys(glowGradientsFindings).length}`);
console.log(`[OK] Textos con tono exagerado: ${textToneFindings.length}`);

// Guardar resultados en un JSON intermedio para construir AUDITORIA.md
const auditData = {
  emojiFindings,
  colorPaletteFindings: Object.fromEntries(
    Object.entries(colorPaletteFindings).map(([k, set]) => [k, Array.from(set)])
  ),
  typographyFindings,
  glowGradientsFindings,
  textToneFindings
};

fs.writeFileSync(path.join(ROOT_DIR, 'scripts', 'audit_data.json'), JSON.stringify(auditData, null, 2), 'utf8');
console.log('[SAVE] Datos de auditoría guardados en scripts/audit_data.json');
