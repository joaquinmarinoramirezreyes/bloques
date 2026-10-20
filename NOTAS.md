# Notas de Implementación - Paso (d) Limpieza Visual y Zonas Táctiles

## Decisiones de Diseño y Arquitectura

1. **Biblioteca Compartida de Iconos (`shared/icons.js`)**:
   - Se crearon trazados vectoriales SVG limpios utilizando `currentColor` para heredar estilos y temas.
   - Soporte para renderizado en DOM (`ArcadeIcons.get()`) y en Canvas 2D offscreen (`ArcadeIcons.renderToCanvas()`).

2. **Identidad Visual Propia por Parejas (Máximo 5 colores por juego, sin resplandores genéricos ni `backdrop-filter`)**:
   - **Pareja 1**:
     - *Cristales*: Geoda Mineral (`#141218`, `#201c27`, `#a855f7`, `#eab308`, `#f5f3ff`).
     - *Lanzaburbujas*: Arrecife Marino (`#071524`, `#0e2438`, `#06b6d4`, `#f43f5e`, `#f0fdfa`).
   - **Pareja 2**:
     - *Bloques*: Pizarra Arcade Retro (`#0f141c`, `#18202c`, `#f59e0b`, `#06b6d4`, `#f8fafc`).
     - *Serpiente*: Bosque Esmeralda (`#0a140d`, `#132418`, `#10b981`, `#f59e0b`, `#f0fdf4`).
   - **Pareja 3**:
     - *Rompe Muros*: Terracota & Ámbar Cálido (`#1c1311`, `#291a16`, `#ea580c`, `#f59e0b`, `#fef3c7`).
     - *Frontón*: Pista Cibernética Azul (`#08101d`, `#0e1b2e`, `#1e3a5f`, `#0284c7`, `#f59e0b`).
   - **Pareja 4**:
     - *Defensa Orbital*: Espacio Cobalto (`#050814`, `#0c1228`, `#38bdf8`, `#f97316`, `#f8fafc`).
     - *Sombras*: Sigilo Noir Ultravioleta (`#09070f`, `#140e22`, `#a855f7`, `#f59e0b`, `#f8fafc`).
   - **Pareja 5**:
     - *Campo Minado*: Pizarra Táctica de Artificiero (`#0f172a`, `#1e293b`, `#334155`, `#dc2626`, `#f59e0b`).
     - *Lumen*: Obsidiana Profunda & Ámbar Farol (`#070b12`, `#0f1826`, `#f59e0b`, `#06b6d4`, `#f8fafc`).
   - **Pareja 6**:
     - *Cargas*: Acero y Alta Tensión Industrial (`#111622`, `#1a2232`, `#eab308`, `#0284c7`, `#f1f5f9`).
     - *Derrape*: Asfalto Nocturno y Neón Naranja (`#0c0a09`, `#1c1917`, `#f97316`, `#06b6d4`, `#f8fafc`).

3. **Corrección Integral de Zonas Táctiles (Dimensiones $\ge 44 \times 44$ px)**:
   - Se ajustaron los botones de cabecera en Bloques, Serpiente, Rompe Muros, Defensa Orbital, Sombras, Derrape, Frontón, Campo Minado, Cristales, Lanzaburbujas, Lumen y Cargas (`.icon-btn`, `.btn-icon`, `.neon-btn`, `.ind-btn`, `.nav-btn`, `.back-button`).
   - Se aplicó `flex-shrink: 0` para evitar compresión en pantallas estrechas (360x640 px).
   - Se aseguraron pestañas de mundos (`.world-tab`) con `min-height: 44px`.
   - La auditoría automatizada `scripts/audit_touch_targets.js` reporta **0 controles < 44px** en los 16 juegos del arcade + Menú Principal + 3 Menús de Época.

4. **Preservación Estricta de Físicas y Lógicas**:
   - En Derrape: se mantuvieron 100% intactas las correcciones de colisión con barreras, subpasos continuos, detección de atasco de 1.5s, recolocación con invulnerabilidad y la rutina de desatasco para rivales IA. Se verificó con `scripts/test_derrape_muros_stuck.js` (6/6) y las 4 fases de tests de Derrape.
   - En Cristales, Gotas y Lanzaburbujas: animaciones y estado visual separado del lógico intactos.

5. **Eliminación Total de `backdrop-filter`**:
   - Se eliminaron todos los filtros de desenfoque de fondo en modales y paneles flotantes de todo el catálogo, sustituyéndolos por fondos semitransparentes u opacos de alto contraste y excelente rendimiento.

6. **Automatización Integral de Tests (`scripts/run-all.js`)**:
   - Se creó `scripts/run-all.js` para ejecutar secuencialmente todas las herramientas de validación (`sin-emojis.js`, `smoke.js`, `audit_touch_targets.js`) y las 41 suites de test del repositorio (24 en raíz y 17 en `scripts/`).
   - Se corrigió `games/lumen/game.js` para exportar en Node (`typeof module !== 'undefined'`) y proteger listeners de `window`, y se actualizó `test_lumen.js` a la arquitectura de 6 plantillas maestras y 5 mundos.
   - Las 44 suites ejecutan con 0 fallos (100% éxito).

7. **Paletas Reales Computadas, Eliminación de Neón y Contraste WCAG AA**:
   - **Paletas Individualizadas**: Se aplicaron las 16 paletas exigidas (Fondo / Texto / Acento) en el `:root` de cada juego, sobrescribiendo `shared/theme.css`.
   - **Desacoplamiento de `theme.css`**: Se refactorizó `.arcade-lock` y `body` en `shared/theme.css` para que utilicen `var(--bg-space)` y `var(--text-main)` en lugar de fijar valores oscuros hardcodeados con `!important`. Con esto se garantiza que los 8 juegos con fondo claro adopten inmediatamente su estética clara y texto oscuro de alto contraste.
   - **Erradicación del Neón**: Se suprimieron todas las referencias a `#00f0ff`, magenta o violetas estridentes en estilos, canvas y scripts (0 apariciones en producción).
   - **Fondos Claros ($L > 0.5$)**: 8 de 16 juegos presentan fondos de alta luminosidad (Bloques: 0.796, Rompe Muros: 0.719, Sombras: 0.792, Corredor: 0.592, Gotas: 0.926, Cristales: 0.891, Lanzaburbujas: 0.851, Cargas: 0.594).
   - **Contraste de Texto**: El 100% de los juegos supera la relación mínima WCAG AA $\ge 4.5:1$ (desde 8.02:1 en Campo Minado hasta 15.14:1 en Sombras).
   - **Análisis CIEDE2000**: Ningún par de juegos comparte el mismo fondo ni el mismo acento.
   - **Capturas Reales y Comparativa**: Se capturaron 20 pantallas *before* reales extrayendo los archivos limpios mediante `git show HEAD` a través de un servidor HTTP virtual en memoria, 20 pantallas *after* desde el filesystem actual, y se generó la cuadrícula `comparativa.png`.
   - **Verificación Total**: Se validaron 48/48 suites en `scripts/run-all.js` (incluyendo `sin-emojis.js`, `smoke.js`, `audit_touch_targets.js` y todas las pruebas unitarias y de layout).
