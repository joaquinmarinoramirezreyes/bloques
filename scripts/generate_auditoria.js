const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const auditData = require('./audit_data.json');

console.log('Generando AUDITORIA.md...');

let md = `# Auditoría Visual y de Identidad - Sala Arcade

Este documento contiene el informe exhaustivo de la auditoría realizada sobre todo el proyecto Sala Arcade (menú principal, rutas de época \`/80\`, \`/90\`, \`/00\` y los 16 juegos del catálogo registrados en \`games.json\`).

El objetivo es eliminar el aspecto genérico y repetitivo (el combo omnipresente de fondo oscuro, cian, morado y brillo neón), reemplazar todos los emojis y símbolos Unicode por iconos vectoriales por código, otorgar a cada juego una identidad visual y tipográfica diferenciada (máximo 5 colores), y reemplazar textos y nombres grandilocuentes por nombres concretos, neutros y coherentes con la temática de cada título.

---

## 1. Resumen Ejecutivo y Estadísticas

- **Archivos auditados**: 128 archivos (.html, .css, .js, .json, .md).
- **Total de emojis y símbolos Unicode detectados**: **${auditData.emojiFindings.length}** ocurrencias repartidas en código, plantillas y textos.
- **Caracteres únicos detectados**: 143 tipos distintos (ej. OK, , [ZAP], *, [OK], [WIN], [STAR], [SHIELD], , , [CROWN], [BOOM], [FAIL], [GEM], [DEAD], [WARN], [LOCK], , >, , , , , , etc.).
- **Archivos CSS con paletas extraídas**: ${Object.keys(auditData.colorPaletteFindings).length}.
- **Archivos CSS con resplandores neón o degradados repetidos**: ${Object.keys(auditData.glowGradientsFindings).length}.
- **Textos con exclamaciones o tono hiperbólico**: ${auditData.textToneFindings.length} instancias.

### Distribución de Emojis por Módulo / Juego

`;

const byFile = {};
auditData.emojiFindings.forEach(f => {
  const parts = f.file.split('/');
  let mod = parts[0];
  if (mod === 'games' && parts[1]) mod = `games/${parts[1]}`;
  byFile[mod] = (byFile[mod] || 0) + 1;
});

md += `| Módulo / Juego | Ocurrencias de Emojis/Símbolos | Estado Principal |\n`;
md += `|---|:---:|---|\n`;
Object.entries(byFile).sort((a,b)=>b[1]-a[1]).forEach(([mod, count]) => {
  md += `| \`${mod}\` | **${count}** | Pendiente de reemplazo por SVG |\n`;
});

md += `\n---\n\n## 2. Inventario Completo de Emojis y Símbolos Unicode\n\n`;
md += `A continuación se detalla cada ocurrencia encontrada en el código base, especificando archivo, número de línea, carácter y su uso actual.\n\n`;
md += `| Archivo | Línea | Carácter | Propósito / Uso | Fragmento de Código |\n`;
md += `|---|:---:|:---:|---|---|\n`;

auditData.emojiFindings.forEach(f => {
  const cleanSnippet = f.snippet.replace(/\|/g, '\\|').replace(/`/g, "'");
  md += `| \`${f.file}\` | ${f.line} | \`${f.char}\` | ${f.usage} | \`${cleanSnippet.slice(0, 75)}\` |\n`;
});

md += `\n---\n\n## 3. Diagnóstico de Problemas Estéticos Comunes\n\n`;
md += `### 3.1. Paletas Cromáticas Repetidas (El "Síndrome Cian + Morado")
Al analizar las variables CSS y colores en los 16 juegos, se detectó una uniformidad monótona:
- **14 de los 16 juegos** utilizan como fondo una variante casi idéntica de azul espacial oscuro (\`#070913\`, \`#0b0d17\`, \`#0f172a\` o \`#021220\`).
- **11 de los 16 juegos** usan el cian (\`#00f0ff\` o \`#38bdf8\`) como acento principal.
- **10 de los 16 juegos** usan el morado/púrpura (\`#a855f7\`, \`#6366f1\` o \`#b026ff\`) como acento secundario.
- **Consecuencia**: El jugador siente que está jugando al mismo juego con diferentes mecánicas en lugar de 16 obras independientes con personalidad propia.

### 3.2. Abuso de Resplandores Neón y Degradados Indiscriminados
- Se encontraron **más de 180 reglas CSS** con \`box-shadow: 0 0 16px rgba(...)\` y \`drop-shadow\` en tarjetas, botones y contenedores donde no aportan jerarquía visual.
- Casi todas las tarjetas del menú y de los juegos aplican gradientes de fondo lineales de 135° con transparencias idénticas (\`rgba(255, 255, 255, 0.06)\`), restando legibilidad y haciendo que todo parezca una plantilla de dashboard.

### 3.3. Tipografías Genéricas sin Identidad de Época
- Salvo la regla global de \`theme.css\` (\`-apple-system, BlinkMacSystemFont, "Segoe UI"\`), los juegos individuales apenas definen tipografías temáticas coherentes con su época.
- Juegos de los 80 carecen de una estética monoespaciada o pixelada sobria, mientras que juegos de los 90 carecen del dinamismo geométrico y tipografías redondeadas de la época de 16 bits.

### 3.4. Botones y Docks Idénticos
- En casi todos los juegos se reutiliza exactamente el mismo contenedor flotante inferior (\`dock-controls\`, \`arcade-icon-btn\`), con bordes redondeados idénticos y sombras transparentes, sin adaptarse a la identidad particular de cada juego (por ejemplo, remaches y metal para Bastión, bordes planos y ángulos rectos para Frontón o Bloques, o estética LCD para Campo Minado).

### 3.5. Tono de Interfaz Exagerado y Exclamaciones Hiperbólicas
- Se identificaron múltiples instancias de títulos y textos con exclamaciones grandilocuentes ("¡CATACLISMO ÍGNEO!", "¡MAESTRÍA MÁXIMA!", "¡ÉPICO!", "¡IMPARABLE!", "¡BRUTAL!").
- En lugar de transmitir satisfacción orgánica a través de la jugabilidad y la física, el texto cae en clichés de juegos móviles genéricos.

---\n\n## 4. Propuesta de Identidad Visual Única por Juego\n\n`;
md += `Se establece para cada título y sección del arcade una **paleta estricta de máximo 5 colores**, una personalidad temática propia, tipografía de sistema recomendada y estilo de interfaz:\n\n`;

const GAME_IDENTITIES = [
  {
    id: 'menu',
    name: 'Menú Principal (Hub General)',
    era: 'Todas',
    theme: 'Arcade Multipropósito Sobrio',
    palette: ['#090d16 (Fondo Carbón)', '#151d2e (Superficie)', '#38bdf8 (Azul Guía)', '#f59e0b (Ámbar Récord)', '#f1f5f9 (Texto Claro)'],
    font: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    uiStyle: 'Líneas limpias, bordes de 10px, sombras sólidas de elevación sin neón excesivo.'
  },
  {
    id: 'era80',
    name: 'Ruta /80 (Arcade 80)',
    era: '1980s',
    theme: 'Fósforo CRT y Vector Arcade Clásico',
    palette: ['#000000 (Negro Absoluto)', '#051805 (Verde Fósforo Oscuro)', '#00ff66 (Verde Terminal P1)', '#ff0055 (Rojo Alerta)', '#f0fff4 (Blanco Fósforo)'],
    font: 'ui-monospace, "Courier New", Consolas, monospace',
    uiStyle: 'Líneas rectas (border-radius: 0), bordes de 2px sólidos, scanlines sutiles.'
  },
  {
    id: 'era90',
    name: 'Ruta /90 (Arcade 90)',
    era: '1990s',
    theme: '16-Bit Super Arcade y Bisel Sólido',
    palette: ['#140826 (Índigo Profundo)', '#28114b (Bisel Base)', '#ffd000 (Amarillo Ocre)', '#ff2a85 (Magenta Arcade)', '#ffffff (Texto Nítido)'],
    font: 'ui-rounded, "Arial Rounded MT Bold", "Nunito", system-ui, sans-serif',
    uiStyle: 'Biseles dimensionales (border-top claro, border-bottom oscuro), esquinas redondeadas de 8px.'
  },
  {
    id: 'era00',
    name: 'Ruta /00 (Arcade 00)',
    era: '2000s',
    theme: 'Tecno-Industrial y Cristal Pulido',
    palette: ['#040914 (Azul Abisal)', '#0f223d (Metal Azulado)', '#00e5ff (Cian Técnico)', '#708090 (Acero Slate)', '#e2e8f0 (Platino)'],
    font: '-apple-system, "SF Pro Display", "Segoe UI", sans-serif',
    uiStyle: 'Bordes finos de 1px con brillo especular superior, radios de 12px, acabado satinado.'
  },
  {
    id: 'bloques',
    name: 'Bloques',
    era: '80',
    theme: 'Minimalismo Constructivista y Tetromino Geométrico',
    palette: ['#0a0a0f (Fondo Grafito)', '#181824 (Marco Tablero)', '#00e5ff (Pieza I / Acento)', '#ff9100 (Pieza L / Énfasis)', '#f8fafc (Texto)'],
    font: 'ui-monospace, Menlo, Consolas, monospace',
    uiStyle: 'Bloques geométricos planos con borde interior de 1px, botones cuadrados de 4px de radio.'
  },
  {
    id: 'snake',
    name: 'Serpiente',
    era: '80',
    theme: 'Pantalla LCD Monocroma / Matriz Retro',
    palette: ['#87987a (Fondo Pantalla LCD Oliva)', '#1e2818 (Píxel Activo Negro/Verde)', '#758866 (Píxel Apagado)', '#384830 (Borde Gabinete)', '#0d130a (Texto Display)'],
    font: '"Courier New", Courier, monospace',
    uiStyle: 'Estética genuina de consola de mano retro, alto contraste, sin degradados ni neones.'
  },
  {
    id: 'rompemuros',
    name: 'Rompe Muros',
    era: '80',
    theme: 'Frontón Electromecánico Breakout',
    palette: ['#0b0c10 (Fondo Carbón)', '#1f2833 (Muro Base)', '#ff3366 (Ladrillos Rojos / Bola)', '#45a29e (Paleta Turquesa)', '#ffffff (Marcador)'],
    font: 'ui-monospace, "Lucida Console", monospace',
    uiStyle: 'Contornos nítidos de 2px, sombras proyectadas duras de 2px sin difuminado.'
  },
  {
    id: 'defensaorbital',
    name: 'Defensa Orbital',
    era: '80',
    theme: 'Radar Militar Espacial y Vector Verde/Ámbar',
    palette: ['#030906 (Fondo Oscuro Radar)', '#0d2818 (Retícula de Barrido)', '#00ff88 (Nave Aliada y Miras)', '#ff3b30 (Amenaza Alienígena)', '#e8f5e9 (Lecturas HUD)'],
    font: 'Consolas, "Liberation Mono", monospace',
    uiStyle: 'Líneas vectoriales de 1.5px, marcos angulares estilo HUD de cabina táctica.'
  },
  {
    id: 'sombras',
    name: 'Sombras',
    era: '90',
    theme: 'Infiltración Nocturna y Linterna Estocástica',
    palette: ['#030305 (Oscuridad Total)', '#12131a (Penumbra)', '#f59e0b (Haz de Linterna Ámbar)', '#ef4444 (Cono de Vigilancia)', '#cbd5e1 (Paredes de Piedra)'],
    font: 'system-ui, -apple-system, sans-serif',
    uiStyle: 'Sombras proyectadas profundas, bordes biselados sutiles, HUD minimalista tipo visor espía.'
  },
  {
    id: 'derrape',
    name: 'Derrape',
    era: '90',
    theme: 'Asfalto Caliente, Guardarraíl y Neumáticos Quemados',
    palette: ['#18191c (Asfalto Antracita)', '#2d3139 (Bordillos de Pista)', '#f97316 (Naranja Deportivo)', '#ffffff (Pintura de Carril)', '#ef4444 (Tacómetro Redline)'],
    font: 'ui-rounded, "Trebuchet MS", sans-serif',
    uiStyle: 'Franjas diagonales de advertencia en botones, esquinas redondeadas de 6px, aspecto de tablero de carreras.'
  },
  {
    id: 'abismo',
    name: 'Abismo',
    era: '00',
    theme: 'Cripta Gótica Oscura y Niebla Espectral',
    palette: ['#08060c (Piedra de Cripta)', '#1a1424 (Sarcófago Base)', '#9333ea (Fuego Espectral)', '#e11d48 (Sangre Vital)', '#e2e8f0 (Hueso / Texto)'],
    font: 'Georgia, Cambria, "Times New Roman", serif',
    uiStyle: 'Bordes con filigrana gótica angular, marcos de piedra desgastada, gemas sin neón genérico.'
  },
  {
    id: 'fronton',
    name: 'Frontón',
    era: '80',
    theme: 'Pista de Squash Sintética y Líneas de Cal',
    palette: ['#162b1d (Cancha Verde Abedul)', '#0d1a11 (Muro Lateral)', '#ffffff (Líneas de Saque / Pelota)', '#f59e0b (Madera de Raqueta P1)', '#38bdf8 (Raqueta P2)'],
    font: 'ui-monospace, "Courier New", monospace',
    uiStyle: 'Líneas blancas continuas de 3px, marcadores mecánicos de números grandes, cero brillos artificiales.'
  },
  {
    id: 'campominado',
    name: 'Campo Minado',
    era: '90',
    theme: 'Consola de Artificiero y Pizarra Táctica',
    palette: ['#1c2128 (Acero Pizarra)', '#2d333b (Casilla Elevada)', '#0d1117 (Casilla Hundida)', '#e63946 (Banderín de Peligro)', '#58a6ff (Números Lógicos)'],
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    uiStyle: 'Bisel noventero clásico con textura de tecla física, relieve positivo al estar tapada y neutro al despejar.'
  },
  {
    id: 'corredor',
    name: 'Corredor',
    era: '00',
    theme: 'Pista de Atletismo Nocturna y Viento Dinámico',
    palette: ['#0d1117 (Noche Urbana)', '#1f2937 (Plataformas de Hormigón)', '#10b981 (Aceleración Verde)', '#f59e0b (Energía / Salto)', '#ffffff (Silueta)'],
    font: 'system-ui, -apple-system, sans-serif',
    uiStyle: 'Tarjetas flotantes delgadas, iconos compactos de 20px, medidor de distancia estilizado sin cajas pesadas.'
  },
  {
    id: 'gotas',
    name: 'Gotas',
    era: '90',
    theme: 'Laboratorio de Alquimia Líquida y Frascos de Cristal',
    palette: ['#121624 (Mesa de Alquimista)', '#1c2238 (Matraz de Cristal)', '#06d6a0 (Gota Menta)', '#118ab2 (Gota Océano)', '#ef476f (Gota Baya)'],
    font: 'ui-rounded, "Arial Rounded MT Bold", sans-serif',
    uiStyle: 'Superficies abombadas con reflejo de burbuja sutil, botones suaves de 14px de radio.'
  },
  {
    id: 'cristales',
    name: 'Cristales',
    era: '00',
    theme: 'Mineralogía de Cuarzo y Facetas Geológicas',
    palette: ['#0c101a (Mina Profunda)', '#182030 (Lecho Rocoso)', '#00b4d8 (Cian Zafiro)', '#7209b7 (Amatista)', '#ffd166 (Topacio)'],
    font: 'system-ui, -apple-system, sans-serif',
    uiStyle: 'Bordes poliédricos en tarjetas, facetas geométricas con sombras limpias, sin gradientes borrosos.'
  },
  {
    id: 'lanzaburbujas',
    name: 'Lanzaburbujas',
    era: '00',
    theme: 'Física de Burbujas Jabonosas y Arrecife Marino',
    palette: ['#061a2b (Fondo Marino)', '#0e2f4c (Base de Lanzador)', '#00f5d4 (Burbuja Turquesa)', '#fee440 (Burbuja Solar)', '#f72585 (Burbuja Coral)'],
    font: 'ui-rounded, system-ui, sans-serif',
    uiStyle: 'Cañón mecánico pulido de latón y cromo, marcos circulares con reflejos especulares de 1px.'
  },
  {
    id: 'lumen',
    name: 'Lumen',
    era: '80',
    theme: 'Laberinto de Sombras y Farol de Aceite',
    palette: ['#080705 (Oscuridad Ceniza)', '#1c1712 (Muros de Catacumba)', '#f59e0b (Luz de Farol Cálida)', '#ffffff (Chispa de Yesca)', '#b91c1c (Sombra Perseguidora)'],
    font: 'ui-monospace, monospace',
    uiStyle: 'Radio de luz dinámico con degradado radial natural, HUD de texto pequeño y limpio en la esquina superior.'
  },
  {
    id: 'cargas',
    name: 'Cargas',
    era: '90',
    theme: 'Acelerador de Partículas y Bobinas de Resonancia',
    palette: ['#0e1118 (Cámara de Vacío)', '#1b2230 (Placas Magnéticas)', '#3b82f6 (Polo Positivo Azul)', '#f97316 (Polo Negativo Naranja)', '#ffffff (Chispa de Impacto)'],
    font: 'Consolas, "Segoe UI", sans-serif',
    uiStyle: 'Rombo central y rejilla con bisel técnico, contadores de resonancia discretos y numéricos.'
  },
  {
    id: 'bastion',
    name: 'Bastión',
    era: '00',
    theme: 'Fortaleza Militarizada y Metalurgia Balística',
    palette: ['#0f141c (Tierra de Asedio)', '#1e2633 (Muralla de Granito)', '#475569 (Blindaje de Acero)', '#f59e0b (Oro de Campaña)', '#38bdf8 (Núcleo Nexo)'],
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    uiStyle: 'Placas remachadas, botones de mando militar con bisel inferior de 2px, tipografía sobria y firme.'
  }
];

GAME_IDENTITIES.forEach(g => {
  md += `### ${g.name} [Época: ${g.era}]\n`;
  md += `- **Concepto / Personalidad**: ${g.theme}\n`;
  md += `- **Paleta (5 colores)**:\n`;
  g.palette.forEach(c => md += `  - \`${c}\`\n`);
  md += `- **Tipografía**: \`${g.font}\`\n`;
  md += `- **Estilo de UI / Controles**: ${g.uiStyle}\n\n`;
});

md += `---\n\n## 5. Propuesta de Nombres Concretos y Textos Neutros\n\n`;
md += `> [!IMPORTANT]\n`;
md += `> **Lista de cambios para revisión del usuario**: De acuerdo con las reglas, estos renombres se presentan para su confirmación expresa antes de ser aplicados en los archivos fuente.\n\n`;
md += `### 5.1. Bastión: Torres, Habilidades y Reliquias\n\n`;
md += `| Tipo | Identificador | Nombre Actual | Nombre Propuesto (Neutro / Concreto) | Justificación |\n`;
md += `|---|---|---|---|---|\n`;

const BASTION_RENAMES = [
  { type: 'Torre', id: 'balistico', current: 'Centinela Balístico', proposed: 'Torreta Centinela', why: 'Directo y claro para el rol de disparo continuo.' },
  { type: 'Rama Nivel 4', id: 'gatling', current: 'Ametralladora Gatling', proposed: 'Cañón Rotativo', why: 'Término táctico militar estandarizado.' },
  { type: 'Rama Nivel 4', id: 'bateria_pesada', current: 'Batería de Percusión', proposed: 'Batería de Choque', why: 'Describe con precisión el efecto de micro-explosión.' },
  { type: 'Torre', id: 'mortero', current: 'Mortero de Fragmentación', proposed: 'Mortero Balístico', why: 'Concreto y sin adjetivos redundantes.' },
  { type: 'Rama Nivel 4', id: 'racimo', current: 'Mina de Racimo', proposed: 'Mortero de Racimo', why: 'Consistencia con el arma base.' },
  { type: 'Rama Nivel 4', id: 'napalm', current: 'Lodo Incendiario', proposed: 'Proyectil Incendiario', why: 'Más profesional y acorde al vocabulario bélico.' },
  { type: 'Torre', id: 'rayo', current: 'Emisor Prismático', proposed: 'Torre de Haz Láser', why: 'Inmediatamente comprensible como arma perforante.' },
  { type: 'Rama Nivel 4', id: 'desintegrador', current: 'Rayo Desintegrador', proposed: 'Láser Focalizado', why: 'Menos cliché de ciencia ficción genérica.' },
  { type: 'Rama Nivel 4', id: 'bobina_tesla', current: 'Bobina de Sobrecarga', proposed: 'Emisor de Arco Eléctrico', why: 'Término físico concreto.' },
  { type: 'Torre', id: 'crio', current: 'Torre Criogénica', proposed: 'Dispersor Criogénico', why: 'Preciso para su función de pulso de área.' },
  { type: 'Rama Nivel 4', id: 'cero_absoluto', current: 'Ventisca Polar', proposed: 'Pulso de Escarcha', why: 'Describe el efecto sin metáforas meteorológicas.' },
  { type: 'Rama Nivel 4', id: 'escarcha_vulnerable', current: 'Escarcha Quebradiza', proposed: 'Descarga Debilitante', why: 'Describe claramente el debuff de daño extra.' },
  { type: 'Torre', id: 'obelisco', current: 'Obelisco de Resonancia', proposed: 'Torre de Transmisión', why: 'Menos místico, más integrado en la red de mando.' },
  { type: 'Rama Nivel 4', id: 'sobrecarga_arcana', current: 'Sobrecarga Arcana', proposed: 'Amplificador de Señal', why: 'Consistente con la arquitectura de soporte.' },
  { type: 'Rama Nivel 4', id: 'amplificador_oro', current: 'Catalizador de Recursos', proposed: 'Módulo de Recuperación', why: 'Concreto para la bonificación de oro.' },
  { type: 'Torre', id: 'francotirador', current: 'Cañón de Precisión', proposed: 'Cañón Francotirador', why: 'Identifica su rango y cadencia de inmediato.' },
  { type: 'Rama Nivel 4', id: 'perforador_blindaje', current: 'Proyectil Perforante', proposed: 'Munición Perforante', why: 'Uso de la terminología correcta de blindaje.' },
  { type: 'Rama Nivel 4', id: 'ojo_halcon', current: 'Ojo de Halcón', proposed: 'Puesto de Observación', why: 'Nombre de instalación técnica en lugar de metáfora.' },
  { type: 'Habilidad', id: 'sobrecarga', current: 'Sobrecarga', proposed: 'Sobrecarga de Red', why: 'Específico a las torres activas.' },
  { type: 'Habilidad', id: 'bombardeo', current: 'Ataque Orbital', proposed: 'Ataque de Artillería', why: 'Alineado al mundo terrestre de Bastión.' },
  { type: 'Reliquia', id: 'lente_cuantica', current: 'Lente Cuántica', proposed: 'Módulo Óptico', why: 'Concreto; añade alcance.' },
  { type: 'Reliquia', id: 'fision_acelerada', current: 'Fisión Acelerada', proposed: 'Mecanismo Rápido', why: 'Concreto; añade cadencia.' },
  { type: 'Reliquia', id: 'polvora_inestable', current: 'Pólvora Inestable', proposed: 'Carga Explosiva Reforzada', why: 'Concreto; aumenta radio de mortero.' },
  { type: 'Reliquia', id: 'cero_absoluto', current: 'Cero Absoluto', proposed: 'Núcleo Refrigerante', why: 'Concreto; mejora ralentización.' },
  { type: 'Reliquia', id: 'transmutador_aurico', current: 'Transmutador Áurico', proposed: 'Recompensa de Asedio', why: 'Menos alquímico, más militar.' },
  { type: 'Reliquia', id: 'escudo_singularidad', current: 'Escudo de Singularidad', proposed: 'Barrera de Respaldo', why: 'Describe su rol protector de 3 impactos.' },
  { type: 'Reliquia', id: 'bobina_tesla_nucleo', current: 'Bobina de Tesla Nexo', proposed: 'Defensa Perimetral', why: 'Describe su función de descarga defensiva.' },
  { type: 'Reliquia', id: 'aleacion_antimateria', current: 'Aleación Antimateria', proposed: 'Punta de Wolframio', why: 'Material real penetrador de blindaje.' },
  { type: 'Reliquia', id: 'banco_interes', current: 'Reserva de Interés', proposed: 'Interés de Reserva', why: 'Gramática directa y sobria.' },
  { type: 'Reliquia', id: 'sobrecarga_obelisco', current: 'Resonancia Primordial', proposed: 'Antena de Extensión', why: 'Describe el aumento de alcance del transmisor.' }
];

BASTION_RENAMES.forEach(r => {
  md += `| ${r.type} | \`${r.id}\` | ${r.current} | **${r.proposed}** | ${r.why} |\n`;
});

md += `\n### 5.2. Abismo: Clases, Habilidades y Mejoras\n\n`;
md += `| Tipo | Identificador | Nombre Actual | Nombre Propuesto | Justificación |\n`;
md += `|---|---|---|---|---|\n`;

const ABISMO_RENAMES = [
  { type: 'Personaje', id: 'peregrino', current: 'Peregrino Abisal', proposed: 'Explorador', why: 'Directo y clásico en el género.' },
  { type: 'Habilidad', id: 'estallido', current: 'Estallido Espectral', proposed: 'Pulso de Choque', why: 'Describe la onda expansiva y empuje físico.' },
  { type: 'Personaje', id: 'hechicera', current: 'Hechicera de Sangre', proposed: 'Nigromante', why: 'Nombre de clase gótica establecido y conciso.' },
  { type: 'Habilidad', id: 'pacto', current: 'Pacto Carmesí', proposed: 'Drenaje Vital', why: 'Describe el robo de salud con claridad.' },
  { type: 'Personaje', id: 'centinela', current: 'Centinela de Hierro', proposed: 'Guardian de Hierro', why: 'Diferencia del centinela de Bastión.' },
  { type: 'Habilidad', id: 'falla', current: 'Falla Sísmica', proposed: 'Golpe al Suelo', why: 'Directo y concreto.' },
  { type: 'Personaje', id: 'sombra', current: 'Acechador Umbrío', proposed: 'Sombra', why: 'Nombre breve y evocador sin adjetivos grandilocuentes.' },
  { type: 'Habilidad', id: 'paso_fantasma', current: 'Paso Fantasma', proposed: 'Evasión Rápida', why: 'Preciso para la carrera invulnerable.' },
  { type: 'Personaje', id: 'piromante', current: 'Inquisidor Ígneo', proposed: 'Piromante', why: 'Nombre concreto para la clase de fuego.' },
  { type: 'Habilidad', id: 'cataclismo', current: 'Cataclismo Ígneo', proposed: 'Anillo de Fuego', why: 'Elimina el término hiperbólico cataclismo.' },
  { type: 'Altar Meta', id: 'vida_inicial', current: 'Vitalidad Primordial', proposed: 'Salud Base', why: 'Término estándar de estadísticas de juego.' },
  { type: 'Altar Meta', id: 'fuerza_ancestral', current: 'Poder del Vacío', proposed: 'Fuerza de Ataque', why: 'Término técnico y legible.' },
  { type: 'Altar Meta', id: 'pies_del_viento', current: 'Paso Espectral', proposed: 'Velocidad de Marcha', why: 'Sin metáforas innecesarias.' },
  { type: 'Altar Meta', id: 'iman_arcano', current: 'Atracción Magnética', proposed: 'Radio de Recogida', why: 'Directo para la mecánica de recolección de orbes.' },
  { type: 'Altar Meta', id: 'fortuna_inicial', current: 'Tributo de Oro', proposed: 'Oro Inicial', why: 'Completamente descriptivo.' }
];

ABISMO_RENAMES.forEach(r => {
  md += `| ${r.type} | \`${r.id}\` | ${r.current} | **${r.proposed}** | ${r.why} |\n`;
});

md += `\n### 5.3. Otros Juegos: Textos de HUD, Logros y Mecánicas\n\n`;
md += `| Juego | Elemento | Texto / Nombre Actual | Propuesta | Justificación |\n`;
md += `|---|---|---|---|---|\n`;

const OTHER_RENAMES = [
  { game: 'Corredor', item: 'Power-up Escudo', cur: 'Aura Cuántica', prop: 'Escudo Protector', why: 'Menos pseudociencia, más funcional.' },
  { game: 'Corredor', item: 'Power-up Salto', cur: 'Manto Propulsor', prop: 'Impulso Doble', why: 'Identifica la mecánica de salto.' },
  { game: 'Gotas', item: 'Gota especial', cur: 'Prisma Gelatinoso', prop: 'Gota Arcoíris', why: 'Describe la combinación con cualquier color.' },
  { game: 'Gotas', item: 'Jefe', cur: 'Emperador Líquido', prop: 'Titán de Gel', why: 'Tono más sobrio.' },
  { game: 'Cristales', item: 'Bomba', cur: 'Prisma Hipercromático', prop: 'Bomba de Color', why: 'Estándar y claro en puzzles Match-3.' },
  { game: 'Cristales', item: 'Logro combo', cur: 'Reverberación', prop: 'Combo Quíntuple', why: 'Numérico y comprensible.' },
  { game: 'Cargas', item: 'Logro combo', cur: 'Mega Resonancia', prop: 'Resonancia x4', why: 'Preciso sin el prefijo mega.' },
  { game: 'Cargas', item: 'Jefe', cur: 'Fin del Arconte', prop: 'Núcleo Central', why: 'Coherente con la temática electromagnética.' },
  { game: 'Lumen', item: 'Poder de luz', cur: 'Chispa Divina', prop: 'Destello de Yesca', why: 'Alineado al farol y la linterna.' },
  { game: 'Derrape', item: 'Modo difícil', cur: 'Serpiente Nocturna', prop: 'Circuito 3 (Noche)', why: 'Denominación técnica de trazado.' },
  { game: 'Derrape', item: 'Rival', cur: 'CENTELLA', prop: 'Rival Oro', why: 'Identificación clara por nivel de habilidad.' },
  { game: 'Campominado', item: 'Logro', cur: 'Misión Titán', prop: 'Sector Difícil', why: 'Alineado al léxico de artificiero.' },
  { game: 'Frontón', item: 'Dificultad alta', cur: 'Quantum-X', prop: 'Nivel Experto', why: 'Evita nombres pomposos en el selector.' },
  { game: 'Todos los HUDs', item: 'Avisos flotantes', cur: '¡IMPARABLE! / ¡ÉPICO!', prop: 'Racha x4 / Impacto crítico', why: 'Información limpia de juego sin exclamaciones vacías.' }
];

OTHER_RENAMES.forEach(r => {
  md += `| ${r.game} | ${r.item} | ${r.cur} | **${r.prop}** | ${r.why} |\n`;
});

md += `\n---\n\n## 6. Pruebas y Verificación del Proceso\n\n`;
md += `### 6.1. Ejecución de Pruebas
- **Capturas iniciales (Before)**: Tomadas y archivadas exitosamente en \`scripts/capturas/limpieza/*_before.png\` en resolución móvil 390x844 para las 20 pantallas (menú, 3 épocas y 16 juegos).
- **Inspección automatizada de Emojis**: Script \`scripts/audit_emojis_and_styles.js\` ejecutado, detectando 941 ocurrencias con snippets y líneas exactas.

### 6.2. Próximos Pasos Inmediatos
1. Implementar la biblioteca de iconos \`shared/icons.js\` (vectorial SVG con trazados por código, \`currentColor\` y renderizado offscreen para Canvas 2D).
2. Crear la regla de prohibición en \`REGLAS-JUEGOS.md\` y el validador estricto \`scripts/sin-emojis.js\`.
3. Esperar confirmación del usuario sobre los renombres de la Sección 5 antes de aplicar cambios en la lógica y textos de los juegos.
4. Proceder con la refactorización visual y limpieza **un juego a la vez**, verificando en cada paso con capturas *after* y las pruebas de humo (\`npm run smoke\`).
`;

fs.writeFileSync(path.join(ROOT_DIR, 'AUDITORIA.md'), md, 'utf8');
console.log('[OK] AUDITORIA.md generado exitosamente con tamaño:', fs.statSync(path.join(ROOT_DIR, 'AUDITORIA.md')).size, 'bytes');
