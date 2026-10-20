# Bitácora de Mejoras y Calidad - Gotas

## Fecha: 15 de Octubre de 2026
## Versión: v3.0 (Sistema de Animación Completo y Desacoplamiento de Estado)

### 1. Arquitectura: Estado Lógico vs Estado Visual
- **Desacoplamiento Estricto**:
  - Matriz lógica `State.grid[12][6]` resuelve de forma atómica y pura jugadas, gravedad y reacciones.
  - Matriz visual `GotasVisualManager.visualGrid[12][6]` almacena instancias de `DropVisualSprite` (`x, y`, `scale`, `scaleX`, `scaleY`, `rotation`, `alpha`, `brightness`, `wobblePhase`).
  - El renderizado dibuja exclusivamente sprites visuales, nunca la matriz lógica de forma directa.
  - Emisor de eventos atómicos: `GotasLogic.stepCascade(grid, cascadeStep)` emite eventos tipados (`gravity`, `rainbow`, `matches`, `settled`) que `GotasVisual` reproduce mediante el motor `shared/tween.js`.
  - Verificación de consistencia: Tras estabilizarse cada cascada, `GotasVisualManager.verifySync(grid)` comprueba celda a celda que el estado visual coincide al 100% con el lógico.

### 2. Animaciones de Fluidos y Jugabilidad Líquida
- **Deformación al Mover y Aterrizar**:
  - Desplazamiento horizontal con interpolación suave (`easeOutQuad` en 80 ms).
  - Rotación fluida con rebote elástico (`easeOutBack` en 100 ms) alrededor del pivote de la pareja.
  - Estiramiento vertical en caída (`scaleY: 1.15, scaleX: 0.88`, y hasta `1.25` en caída rápida).
  - Aterrizaje con *squash & stretch* reactivo (`scaleY: 0.72, scaleX: 1.28` con recuperación `easeOutBounce` a `1.0, 1.0`).
- **Fusión Visual de Fluidos (Puentes entre Vecinas)**:
  - Las gotas adyacentes ortogonalmente del mismo color generan automáticamente un cuello/puente líquido con cápsula redondeada y brillo especular, fusionándose como gel vivo.
  - Al reposar, las gotas y sus cuellos ondulan con una fase senoidal continua (*idle liquid ripple*).
- **Eliminación y Cascadas en Ola**:
  - Destello blanco (*hit flash* con `brightness: 1.6`) y leve dilatación anticipatoria.
  - Encogimiento con giro angular y desvanecimiento (`scale: 0`, `alpha: 0`, `easeInQuad` en 200 ms).
  - Cascada visual escalonada en grupos grandes con retardos de 30 ms por pieza propagados desde el centro del grupo.
  - Estallido de partículas líquidas y ondas de choque vectoriales (*shockwaves*).
- **Gota Especial Arcoíris**:
  - Detonación con onda expansiva prismática y rayos láser/fluidos disparados hacia todas las gotas del color seleccionado, disolviéndolas en cascada.
- **Entrada de Basura desde Fuera de Pantalla**:
  - Las gotas de basura arrojadas por jefes o rivales caen desde $y < 0$ (arriba del pozo) con aceleración de gravedad ($1800 \text{ px/s}^2$), aterrizando con sacudida e impacto físico.

### 3. Transiciones de Interfaz y Ritmo
- **Marcador Interpolado**: Puntuación con conteo numérico progresivo en lugar de saltos bruscos.
- **Banners de Combo**: Entrada elástica con rebote (`easeOutBack`), sacudida de pantalla proporcional y zoom temporal de cámara en combos altos.
- **Modales Suaves**: Transiciones de opacidad y visibilidad de 200 ms en menús, pausa y fin de partida.
- **Entrada en Cola (Input Queuing)**: Los movimientos o rotaciones efectuados durante una cascada se encolan y ejecutan inmediatamente al reanudarse el control.
- **Ajuste "Animaciones Rápidas"**: Casilla en el modal de ajustes que reduce las duraciones a un 45% para speedrunners.

### 4. Rendimiento (60 FPS Estables)
- **Atlas de Sprites Offscreen**: Pre-renderizado procedural en canvas offscreen para los 5 colores, basura, arcoíris y expresiones faciales (normal, combo feliz, peligro/alerta).
- **Fondo Estático Cacheado**: El marco, gradiente de caverna y rejilla se dibujan en una sola llamada `ctx.drawImage` cacheada.
- **Object Pooling Completo**:
  - Pool de 120 sprites `DropVisualSprite`.
  - Pool de 150 partículas líquidas.
  - Pool de 25 ondas de choque.
  - Cero creación de objetos o arrays por frame en `update()` y `render()`.
- **Modo Diagnóstico `?debug=1` y Auto-Tuner**: Monitor en vivo con FPS, tiempo de frame, sprites activos, tweens, partículas y estado de sincronización. Si los FPS bajan de 55, activa automáticamente el modo de bajo detalle.

### 5. Verificación Automatizada (Node.js)
- `scripts/test_gotas_animations.js`:
  - 1,000 partidas y 3,075 pasos de cascada simulados con 0 desincronizaciones entre el estado lógico y el visual.
  - Validación de pooling de 120 sprites, gravedad, squash & stretch y entrada de basura desde $y < 0$.
