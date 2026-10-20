# Bitácora de Mejoras y Calidad - Cristales

## Fecha: 14 de Octubre de 2026
## Versión: v2.0 (Estándar de Calidad Aplicado)

### 1. Sensación de Impacto ("Juice") y Arte Vectorial
- **Cristales Facetados con Especularidad Dinámica**:
  - 6 tipos de cristales vectoriales diseñados matemáticamente con facetas luminosas, gradientes multicapa y barrido especular animado en diagonal.
  - Efectos visuales de brillo continuo que recorren la superficie de los cristales y reflejos al seleccionar e intercambiar.
  - Sacudida de pantalla amortiguada en detonaciones especiales y combinaciones múltiples.
  - Textos flotantes de puntuación y avisos de combos ("¡Brillante!", "¡Magnífico!", "¡Prismático!").
- **Fondos Dinámicos por Mundo**:
  - *Mina Subterránea* (Niveles 1-10): Caverna oscura con destellos de vetas minerales y partículas de polvo dorado.
  - *Glaciar Criogénico* (Niveles 11-20): Gradiente gélido con ventisca de cristales de hielo y prismas flotantes.
  - *Templo Solar* (Niveles 21-30): Arquitectura de luz con rayos cenitales y polvo solar en suspensión.
  - *Volcán de Obsidiana* (Niveles 31-40): Ambiente de magma y cenizas incandescentes con resplandor pulsante.

### 2. Contenido y Campaña (40 Niveles en 4 Mundos)
- **Mapa de Campaña con 40 Niveles**:
  - Cada nivel balanceado con metas de puntuación y obstáculos progresivos, 100% resoluble matemáticamente verificado con suite de pruebas en Node.js.
- **4 Tipos de Obstáculos**:
  1. *Hielo*: Capas de congelación que requieren combinaciones adyacentes para romperse.
  2. *Cadenas*: Encierran el cristal impidiendo su movimiento hasta detonar un match con su color.
  3. *Runas de Piedra*: Bloques macizos inertes que se desgastan y destruyen tras dos impactos de combinaciones contiguas.
  4. *Piezas Transformantes*: Cristales inestables que mutan de color cada turno si no son eliminados.
- **Fusión de Especiales Cruzados**:
  - *Láser + Láser*: Detona una cruz completa (fila y columna entera).
  - *Láser + Bomba*: Detona 3 filas y 3 columnas simultáneamente.
  - *Bomba + Bomba*: Explosión expansiva de $5 \times 5$ casillas.
  - *Prisma + Láser*: Transforma todos los cristales del color absorbido en cristales láser activos.
  - *Prisma + Bomba*: Transforma todos los cristales del color absorbido en bombas de área activas.
  - *Prisma + Prisma*: Limpieza total del tablero con lluvia masiva de puntos.

### 3. Sistemas de Progresión y Economía
- **Sistema de Vidas / Energía**:
  - 5 vidas máximas almacenadas localmente.
  - Temporizador de regeneración automática (1 vida cada 20 minutos) calculado por timestamp para funcionar en background.
- **Potenciadores (Power-ups) Desbloqueables y Usables**:
  - *Martillo de Cuarzo*: Rompe cualquier casilla, cristal u obstáculo seleccionado sin consumir turno.
  - *Mezcla Mágica*: Reordena aleatoriamente el tablero garantizando movimientos válidos.
  - *Intercambio Libre*: Permite intercambiar dos cristales contiguos sin necesidad de formar un trío inicial.
- **Recompensa Diaria**:
  - Sistema de bono diario persistente por calendario con recompensas acumulativas de potenciadores.
- **8 Logros Integrados**:
  1. *Primer Destello*
  2. *Reflejo Múltiple*
  3. *Maestro de Gemas*
  4. *Fusión Estelar*
  5. *Explorador de Minas*
  6. *Conquistador de Volcanes*
  7. *Estratega Impecable*
  8. *Coleccionista Resplandeciente*
- **Persistencia Versionada**: Clave `cristales:v2` con migración de progreso previo, estrellas por nivel y récord histórico.
- **Opciones y Accesibilidad**: Ajuste de SFX, BGM, vibración háptica, modo de alto contraste y soporte de depuración con `?debug=1`.

## Fecha: 15 de Octubre de 2026
## Corrección de Raíz: Desaparición de Cristales y Verificación de Invariantes

### 1. Diagnóstico y Causa Raíz
Se detectaron y corrigieron 3 causas raíz concretas en `games/cristales/game.js`:
1. **Retorno prematuro en `resolveMatches` dejando celdas vacías (`type: 0`)**:
   - Cuando se detonaban especiales cruzados (`executeDoubleSpecial`), prismas de color (`executeColorPrism`) o martillos (`applyHammer`), las casillas afectadas se marcaban como vacías (`type: 0`) y luego se llamaba a `resolveMatches()`. Si el estado resultante no formaba inmediatamente un trío ordinario adicional (`matches.length === 0`), `resolveMatches()` salía inmediatamente sin invocar la compactación por gravedad (`applyGravity`) ni el relleno de celdas (`refillEmptyCells`). Como resultado, el render omitía dibujar gemas en casillas con `type: 0` y, en la siguiente jugada del usuario, la gravedad diferida hacía caer las piezas superiores de forma imprevista, simulando que cristales previos habían desaparecido.
2. **Sobrescritura destructiva en cruces e intersecciones (L-shape / T-shape)**:
   - En combinaciones solapadas en forma de L o T, el primer trío creaba un cristal especial en `cell[0]`, pero el segundo match que compartía esa coordenada ejecutaba la rama `else` y reseteaba la casilla a `type: 0`, evaporando el cristal especial recién creado.
3. **Pérdida de color en combinaciones de Prisma de Color**:
   - En `executeDoubleSpecial`, la celda del prisma se vaciaba a `type: 0` antes de consultar el tipo de gema de la celda vecina, lo que provocaba que la lectura del color cayera a un valor por defecto (1) independientemente del cristal seleccionado.

### 2. Solución Aplicada
- En `resolveMatches()` se introdujo `hasEmptyCells(grid)` y `refillEmptyCells(grid)`. Si `matches.length === 0` pero existen celdas vacías (`type === 0`), el juego compacta y rellena obligatoriamente antes de desbloquear el turno del jugador.
- Se implementó recolección y asignación atómica con `eliminatedCells` (Set) y `createdSpecialsThisStep` (Map), garantizando que las gemas especiales en intersecciones nunca se sobrescriban destructivamente con `type: 0`.
- Se añadieron detonaciones en cadena para especiales preexistentes en casillas emparejadas (Líneas H/V y Bombas).
- Se implementó `verifyBoardSync()`, el cual valida que no existan celdas nulas o vacías tras cada resolución. En modo `?debug=1`, genera alertas visuales flotantes y logs detallados en la consola si ocurre cualquier desincronización.
- Se blindaron los potenciadores (Martillo, Intercambio libre y Mezcla cósmica) contra activaciones durante secuencias de intercambio o cascadas (`State.isSwapping || State.isCascading`).

### 3. Suite de Verificación de Invariantes
- Guardada en `scripts/test_cristales_invariants.js`.
- Simula 5,000 partidas completas (35,000+ movimientos con obstáculos y especiales) verificando paso a paso:
  - **Invariante A**: Ninguna celda queda vacía tras finalizar la resolución.
  - **Invariante B**: Las piezas supervivientes conservan su tipo y conteo estricto.
  - **Invariante C**: El relleno escribe exclusivamente en celdas vacías.
  - **Invariante D**: El orden relativo de las piezas por columna se preserva al caer.
- Verificación end-to-end adicional en navegador real mediante `scripts/test_browser_cristales.js` (20 turnos con eventos pointerdown e inspección con Chrome Headless).

## Fecha: 15 de Octubre de 2026 (Segunda Parte)
## Sistema Completo de Animaciones y Desacoplamiento Lógico/Visual

### 1. Arquitectura: Estado Lógico vs Estado Visual
- **Separación Estricta**: Cada pieza visible es un `GemVisualSprite` independiente con coordenadas flotantes `x, y`, `scale`, `scaleX, scaleY`, `rotation`, `alpha`, `brightness` y `shinePhase`. El motor de renderizado dibuja sprites desde la estructura `CristalesVisual.visualGrid` y la lista de sprites transitorios `transientSprites`, nunca la matriz lógica `State.grid` directamente.
- **Motor de Tweens Reutilizable (`shared/tween.js`)**:
  - Interpolación con funciones de easing (`easeOutCubic`, `easeOutBack`, `easeOutElastic`, `easeOutBounce`, `easeInQuad`, `easeInOutQuad`).
  - Object pooling pre-asignado de 300 slots de tweens con cero recolección de basura (GC) por frame.
  - Corrección de re-cálculo de `activeCount` para tweens encadenados en callbacks `onComplete`.
- **Generación y Reproducción de Eventos**:
  - `CristalesLogic.stepCascade` resuelve atómicamente cada paso y emite descriptores de eventos estructurados (`eliminatedCells`, `createdSpecials`, `activatedSpecials`, `gravityMoves`, `spawnedGems`, `scoreEarned`).
  - `CristalesVisual.animateCascadeStep` traduce esos eventos en tweens escalonados.
  - Al completar la reproducción, `CristalesVisual.verifyMatches` comprueba que la matriz visual coincida exactamente al 100% con la lógica.

### 2. Animaciones Implementadas
- **Intercambio (Swap)**: Las dos piezas se deslizan suavemente con `easeInOutQuad` en 120 ms.
- **Intercambio Rechazado**: Si el swap no forma una combinación válida, ambas gemas avanzan hasta el punto medio y retornan elásticamente a su celda de origen con `easeOutBack` y una leve sacudida de pantalla (`shake(2, 0.12)`).
- **Selección**: La gema seleccionada pulsa y crece suavemente (`scale: 1.15` con onda sinusoidal), y las 4 celdas adyacentes se iluminan con un marco tenue.
- **Eliminación con Onda Escalonada**: Destello lumínico (`brightness: 2.2`, `scale: 1.22`), giro angular y encogimiento con desvanecimiento (`scale: 0`, `rotation: +-0.45 rad`, `alpha: 0`), propagándose con retardos de 20 a 40 ms según distancia al centro del match.
- **Caída por Gravedad**: Aceleración cuadrática (`FALL_ACCELERATION: 1800 px/s²`) escalonada por columna (`c * 0.02s`), aterrizaje elástico y deformación física ("squash and stretch": compresión a `scaleY: 0.84, scaleX: 1.16` y rebote a 1.0 con `easeOutBounce`).
- **Entrada de Gemas Nuevas**: Entran cayendo desde arriba del tablero ($y < 0$) con la misma física de gravedad y rebote en lugar de aparecer colocadas.
- **Piezas Especiales**: Creación condensada con implosión luminosa (`scale: 0 -> 1.0`, destello `brightness: 2.8`) y activación con rayos luminosos horizontales/verticales (pool de rayos) y ondas de choque expansivas de bombas.
- **Puntuación y Combos**: Interpolación suave del contador de puntos (`State.displayedScore`), textos flotantes de combo con rebote elástico, sacudida de pantalla y zoom sutil de cámara en combos de 3 o más.
- **Llenado en Ola al Inicio**: Al iniciar o reiniciar un nivel, los 64 cristales descienden en una ola diagonal (`delay: (r + c) * 0.035s`) con aterrizaje elástico.
- **Entrada en Cola (Input Queue)**: El jugador puede marcar el siguiente movimiento válido mientras se reproduce una cascada; al terminar la animación en reposo, el movimiento en cola se ejecuta sin romper el estado.
- **Opción "Animaciones Rápidas"**: Añadida a los ajustes del juego (`opt-fast-anim`), acelerando todas las animaciones al 180% de velocidad.

### 3. Rendimiento y Optimización Gráfica
- **Atlas de Sprites Offscreen**: Pre-renderizado de los 6 tipos de cristales facetados, prisma de color y runa bloqueada en lienzos offscreen con escalado de alta densidad DPI, dibujados mediante `drawImage` para un costo mínimo de CPU.
- **Fondo Estático Cacheado**: El gradiente del mundo y las celdas alternas se dibujan una sola vez en un canvas offscreen (`cachedBgCanvas`) y se estampan en un solo comando por frame.
- **Object Pooling Total**: Pool de 160 sprites `GemVisualSprite`, pool de 150 partículas, pool de 8 rayos y pool de 8 ondas de choque.
- **Auto-Tuner de Rendimiento y Modo `?debug=1`**:
  - Medición continua de FPS. Si cae por debajo de 55 FPS, activa automáticamente `lowQualityMode` (reducción de partículas y omisión de partículas ambientales).
  - Overlay de depuración en pantalla (`?debug=1`) que exhibe FPS, tweens activos, sprites activos y verificación de sincronización.

### 4. Pruebas de Verificación
- Suite `scripts/test_cristales_animations.js`:
  - 1000 cascadas completas (1298 pasos animados individuales) comprobando 0 discrepancias visuales.
  - Verificación de pooling, swaps válidos, swaps rechazados, entrada desde $y < 0$ y tablero en ola.
- Suite `scripts/test_cristales_invariants.js`: 5,000 partidas completas sin violaciones de invariantes.

