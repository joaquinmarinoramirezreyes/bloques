# Bitácora de Mejoras y Calidad - Lanzaburbujas

## Fecha: 14 de Octubre de 2026
## Versión: v2.0 (Estándar de Calidad Aplicado)

### 1. Sensación de Impacto ("Juice") y Arte Vectorial Submarino
- **Burbujas de Jabón Iridiscentes**:
  - Renderizado vectorial multicapa de película de jabón con interferencia cromática, gradientes translúcidos y relieve esférico.
  - Reflejos especulares curvos en la parte superior e inferior.
  - Oscilación y elasticidad orgánica de radio continuo (`Math.sin(time * 4 + r * 1.5 + c * 0.8) * 0.8`) simulando la tensión superficial del agua.
  - Estallido con salpicaduras de partículas de agua (14 gotas con dispersión radial y aceleración por gravedad) y sonido "pop" satisfactorio sintetizado con modulación de frecuencia y tono ascendente por combo.
- **Mecanismo Lanzador "Hydro-Nautilo"**:
  - Diseño original de cañón náutico con base de latón, anillos pulidos y cámara cilíndrica de vidrio con agua.
  - Rotación suave siguiendo el ángulo del apuntador.
  - Animación de retroceso elástico en el disparo con sistema de muelle y amortiguación (`spring: 160, damping: 12`), con desplazamiento hacia atrás y retorno elástico.
  - Animación de recarga fluida de la burbuja siguiente trasladándose al cañón.
- **Fondos Atmosféricos Evolutivos por Mundo**:
  - *Mundo 1: Laguna Esmeralda* (Niveles 1-15): Rayos cáusticos de luz solar submarina oscilantes y burbujas de oxígeno ascendentes continuas.
  - *Mundo 2: Arrecife de Neón* (Niveles 16-30): Gradientes púrpuras y violetas profundos con esporas bioluminiscentes.
  - *Mundo 3: Fosa Abisal* (Niveles 31-45): Azul de medianoche con partículas de plancton brillante y atmósfera oscura.
  - *Mundo 4: Caldera Submarina* (Niveles 46-60): Tonos de obsidiana y cenizas incandescentes con resplandor geotérmico.

### 2. Campaña de 60 Niveles, Obstáculos y Jefes
- **60 Niveles en 4 Mundos Temáticos**:
  - Cada mundo consta de 15 niveles diseñados y balanceados como datos puros, 100% resolubles matemáticamente verificado mediante suite de pruebas en Node.js.
- **Obstáculos Variados y Burbujas Especiales**:
  - *Rocas Indestructibles (92)*: Bloques pétreos que no se eliminan por combinación directa, solo se desprenden al cortar el racimo raíz.
  - *Bombas Expansivas (90)*: Detonan un radio de 2 hexágonos reventando todas las burbujas circundantes.
  - *Burbujas Arcoíris (91)*: Comodín que enlaza con cualquier color que impacte.
  - *Rayos Horizontales (93)*: Electrocutan y limpian la fila entera horizontalmente.
  - *Burbujas Cambiantes (94)*: Mutan de color cada turno si no se revuelven a tiempo.
- **Jefes Submarinos con Ataques Telegrafiados**:
  - *Nivel 15*: "Kraken Esmeralda" (6 PV, desciende el techo y añade hileras con telegrafiado visual).
  - *Nivel 30*: "Leviatán de Coral" (8 PV, muta hileras de burbujas en arrecife).
  - *Nivel 45*: "Gorgona Abisal" (10 PV, petrifica burbujas en rocas).
  - *Nivel 60*: "Titán del Núcleo" (12 PV, desciende el techo rápidamente con aviso de magma).
  - Barra de vida del jefe en el HUD y daño directo por cada racimo eliminado.

### 3. Precisión Balística y Potenciadores (Boosters)
- **Guía de Puntería con Rebotes Idéntica a la Física**:
  - La función `raycastTrajectory` replica de forma exacta la simulación paso a paso del proyectil (`simulatePhysicalShot`), garantizando que la burbuja encaje en el hexágono exacto donde apunta la guía.
- **Dock de Potenciadores Usables**:
  - *Bomba Acuática*: Carga un proyectil explosivo de racimo masivo.
  - *Burbuja Arcoíris*: Carga un comodín multicolor.
  - *Súper Mira Láser*: Activa trayectoria extendida con previsión del hexágono final.
- **Física Suave de Caída para Burbujas Flotantes**:
  - Al cortar un racimo, las burbujas huérfanas descienden con dispersión lateral, aceleración gravitacional y chapoteo con bonificación de puntos (`+100`, `+200`).
- **Sistema de Calificación y Progresión**:
  - 1, 2 o 3 estrellas según el objetivo de disparos por nivel (`parShots`).
  - Desafío Diario con rotación por calendario, +50% en puntos y recarga de potenciadores gratis.
  - 8 Logros integrados con persistencia.
  - Persistencia versionada en clave `lanzaburbujas:v2`.
- **Ajustes y Accesibilidad**: Control de volumen SFX, música ambiental marina BGM, vibración háptica y modo de alto contraste.

---

## Fecha: 15 de Octubre de 2026
## Versión: v2.1 (Arreglo de Layout y Motor de Animación con Desacoplamiento Visual)

### 1. Diagnóstico y Arreglo del Problema de Layout (Parte A)
- **Causas Raíz Detectadas**:
  1. *Posición absoluta centrada del dock*: Los botones estaban centrados con `left: 50%; transform: translateX(-50%)`, colocándose directamente encima del cañón hidromecánico y de la recámara de disparo.
  2. *Cálculo de altura erróneo en `handleResize`*: Se calculaba `availableH` restando el header y sub-bar del `#game-container` en lugar de medir directamente el contenedor del canvas (`#canvas-container`).
  3. *Ausencia de regla global `.hidden` en CSS*: El banner de jefe (`#boss-banner`) tenía la clase `.hidden` pero en CSS solo existía `.glass-modal.hidden`. El banner ocupaba ~70px en la parte superior, empujando el canvas hacia abajo y provocando que el cañón quedara dibujado fuera del área visible inferior.
  4. *Distorsión por DPI en puntería*: Se multiplicaba por `scaleX = canvas.width / rect.width` (`dpr`), desplazando el apuntado al doble en pantallas Retina/HiDPI.
- **Solución Estructural**:
  - Layout en tres zonas limpias: HUD superior, zona central flexible para el canvas, y zona inferior con dock flanqueado (`.dock-flank.dock-left` y `.dock-flank.dock-right`) que deja un corredor central despejado de 120-170px para el cañón y las dos burbujas.
  - El cañón y la burbuja actual se ubican en el centro horizontal, y la siguiente burbuja sobre un pedestal a la izquierda (`cannonX - rad * 1.7`).
  - Respeto de `env(safe-area-inset-bottom)` y tamaño táctil mínimo garantizado de **44x44px** en todos los botones.
  - Verificación por código mediante `getBoundingClientRect()` con Puppeteer en 5 resoluciones (360x640, 390x844, 412x915, 768x1024, 844x390): **85 de 85 comprobaciones superadas con 0 solapamientos**.

### 2. Motor de Animaciones y Desacoplamiento Visual (Parte B)
- **Nuevo Motor Centralizado `shared/tween.js`**:
  - Soporte de funciones de easing matemáticas puras (`easeOutBack`, `easeInBack`, `easeOutElastic`, `easeInOutQuad`, etc.).
  - Object pooling pre-asignado con 300 slots y cero recolección de basura (GC).
  - Compatible con navegador (`window.ArcadeTween`) y Node.js.
- **Desacoplamiento de Estado Lógico y Visual**:
  - Rejilla visual de sprites `visualGrid` independiente de `grid`, con `x, y, scale, alpha, rotation, offsetX, offsetY`.
  - Disparo con estela de partículas iridiscentes, anclaje elástico con `easeOutBack` y onda expansiva hacia burbujas vecinas.
  - Retroceso físico del cañón con sistema amortiguador y recuperación elástica.
  - Animación de recarga de la siguiente burbuja que asciende desde el pedestal a la recámara (`reloadingAmmo`).
  - Intercambio animado de munición en arco parabólico (`swapAnim`).
  - Eliminación de racimos propagada en ola radial desde el impacto (30 ms por distancia hexagonal), encogimiento con giro, destello y salpicaduras.
  - Burbujas huérfanas flotantes que caen con aceleración gravitatoria y rebotan en el fondo marino antes de desvanecerse con texto `+100`.
  - Descenso fluido del techo (`ceilingAnimOffset`) con vibración de pantalla.
  - Entrada en ola al iniciar nivel (`easeOutBack` escalonada).
  - Marcador con conteo progresivo animado (`displayedScore`).
- **Optimización y Rendimiento Extremo**:
  - Pre-renderizado de los 6 colores regulares y 5 burbujas especiales en un canvas offscreen (`buildBubbleSprites`), sustituyendo decenas de gradientes radiales por frame por `drawImage`.
  - Fondo atmosférico cacheado en canvas offscreen (`updateBackgroundCache`).
  - Pool estricto de 150 partículas (`MAX_PARTICLES = 150`) reutilizadas sin asignación de memoria dinámica.
  - Monitor de diagnóstico `?debug=1` con visualización de FPS en tiempo real, tiempo de frame, conteo de partículas y tweens.
  - Sintonizador automático de calidad (*auto-tuner*): si la media cae de 55 FPS activa `lowQualityMode` para mantener 60 FPS estables.

