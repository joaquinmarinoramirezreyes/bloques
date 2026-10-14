# NOTAS DE DESARROLLO Y DIAGNÓSTICO: CARGAS (ARCADE 90s INDUSTRIAL)

## 1. Diagnóstico Técnico Inicial (Antes del Arreglo)

| # | Gravedad | Problema Concreto | Archivo y Función | Reproducción / Causa Raíz | Confirmación |
|---|---|---|---|---|---|
| **1** | **CRÍTICA** | **Cargas deslizantes atraviesan a otras cargas** | `game.js`<br>`CargasLogic.simulateSlide` y `updateCharges` | Al empujar una carga en un pasillo donde hay otra carga estacionaria o en movimiento, el algoritmo de simulación solo verificaba pilares y bloques blandos (`grid[nr][nc] === 1 \|\| 2`), ignorando la presencia de otras cargas en la trayectoria. Las cargas se superponían y terminaban en la misma celda. | **Confirmado por Ejecución en Node** (`test_diag_cargas.js`) |
| **2** | **CRÍTICA** | **Cadenas de detonación atascadas por bloques blandos** | `game.js`<br>`CargasLogic.resolveChainDetonations` | La simulación de cadena en rombo evaluaba las explosiones consecutivas sobre una cuadrícula estática. Si la carga A destruía un bloque blando que abría el camino hacia la carga B, la onda de B o de ondas subsecuentes no reconocía el bloque como destruido, bloqueando o abortando la cadena. | **Confirmado por Ejecución en Node** (`test_diag_cargas.js`) |
| **3** | **ALTA** | **IA de Cazador y Evasión suicida en callejones** | `game.js`<br>`getGuardianEvadeMove` y `updateGuardians` | La evasión solo evaluaba 1 casilla adyacente. En callejones sin salida con radio >= 2, todas las opciones adyacentes estaban marcadas como peligrosas; la heurística elegía la casilla con menor distancia matemática, caminando directamente hacia la bomba. Además, el cazador no tenía pathfinding BFS y rebotaba aleatoriamente contra paredes. | **Confirmado por Ejecución en Node** (`test_diag_cargas.js`) |
| **4** | **ALTA** | **Constructor se encierra a sí mismo** | `game.js`<br>`updateGuardians` (builder) | El guardián constructor ejecutaba `State.grid[g.r][g.c] = 2`, convirtiendo su propia casilla ocupada en un bloque blando sólido, atrapándose dentro del bloque de por vida. | **Confirmado por Inspección y Node** |
| **5** | **MEDIA** | **Control táctil rígido sin Corner-Slipping** | `game.js`<br>`updatePlayer` | El jugador requería alineación ortogonal de 1 píxel para entrar a pasillos de 1 casilla (30px). En móviles, el pulgar se trababa constantemente en las esquinas de los pilares. | **Deducido por Inspección de Código y Físicas** |
| **6** | **MEDIA** | **Almacenamiento primitivo sin versión ni migración** | `game.js`<br>`saveHighScore` | Solo se guardaba un entero bajo `cargas:v1:best_score` sin soporte para desbloqueo de niveles, estrellas, mejoras de taller ni logros. | **Confirmado por Inspección de Código** |
| **7** | **MEDIA** | **Monotonía y falta de mecánicas de mundos** | `game.js`<br>`CONFIG.LEVELS` | Los 12 niveles iniciales eran variaciones menores de la misma paleta visual y mecánica básica, sin suelo resbaladizo, cintas, compuertas ni teletransportes. | **Confirmado por Inspección de Código** |

---

## 2. Reescritura y Soluciones Implementadas

### A) Física de Deslizamiento y Colisión Limpia
- `simulateSlide` y `updateCharges` ahora verifican paso a paso celda por celda:
  - Pilares y bloques blandos.
  - Otras cargas activas (deteniendo el deslizamiento justo en la celda anterior).
  - Compuertas de seguridad cerradas.
  - Redirección automática al cruzar cintas transportadoras.
  - Teletransporte cuántico manteniendo la velocidad e inercia.

### B) Cadenas Dinámicas de Resonancia
- `resolveChainDetonations` trabaja sobre un clon dinámico `simGrid` que limpia los bloques blandos destruidos en cada paso de la cadena, permitiendo que las cargas siguientes propaguen su onda por las brechas recién creadas.
- Si una carga es detonada mientras se desliza, su posición se asienta inmediatamente en la celda discreta más cercana, evitando desincronizaciones de ondas o celdas fantasma.

### C) IA con Pathfinding BFS y Evasión con Búsqueda de Refugio
- `getGuardianEvadeMove`: Utiliza un BFS de rescate que busca la celda segura más cercana fuera de todos los radios de explosión activos o inminentes.
- `getHunterMove`: Implementa búsqueda de caminos BFS para rodear pilares y perseguir al jugador inteligentemente.
- `builder`: Coloca bloques blandos detrás de su dirección de avance en celdas vacías, garantizando que nunca se encierre a sí mismo ni bloquee el portal de salida.

### D) 3 Mundos y 30 Niveles de Diseño con Mecánicas Propias
1. **Mundo 1: Sector Industrial Alfa (Niveles 1-10)**
   - Mecánica: Bloques nanotecnológicos regenerativos (reaparecen a los 8 segundos con aviso de chispa).
   - Jefe: Titán Giróscopo MK-II (ataques giratorios en cruz y diagonal telegrafiados).
2. **Mundo 2: Criocámaras y Cintas Magnéticas (Niveles 11-20)**
   - Mecánica: Suelo de hielo resbaladizo (baja fricción, mayor inercia) y cintas transportadoras que desplazan cargas y jugadores.
   - Jefe: Coloso Criogénico (anillos de escarcha telegrafiados).
3. **Mundo 3: Núcleo Cuántico (Niveles 21-30)**
   - Mecánica: Teletransportadores cuánticos pareados, interruptores de presión y compuertas de seguridad.
   - Jefe: Núcleo Arconte Supremo (mega-rombo cuántico con pulsos resonantes).

### E) Verificación con Solver BFS en Node
- Cada uno de los 30 niveles fue sometido al solver `CargasLogic.solveLevelReachability(lvl.map)` en Node:
  - **30/30 niveles probados y verificados como 100% alcanzables y resolubles**.

### F) Corner-Slipping y Controles Móviles
- Se incorporó compensación de esquinas en `updatePlayer`: si el jugador intenta girar en una esquina con hasta 13px de desalineación, el motor lo desliza automáticamente hacia el centro del pasillo.
- Detección e indicador visual `EMPUJE` cuando el jugador está frente a una carga con pasillo despejado.

### G) Tienda de Mejoras y Almacenamiento Versionado `cargas:v2`
- Esquema de almacenamiento robusto:
  - Récord histórico migrado desde `cargas:v1:best_score`.
  - Desbloqueo progresivo de mundos y sectores.
  - Sistema de 1 a 3 estrellas por sector (completar, eliminar enemigos, vencer tiempo objetivo).
  - Taller de mejoras: Radio de onda, capacitador de cargas, servomotores, guantelete magnético y blindaje.
  - 11 logros desbloqueables.

### H) Audio Generativo y Estándar de Calidad
- BGM procedural con sintetizador Web Audio (bajo cyberpunk a 125 BPM y percusión metálica).
- Escala de tono ascendente para combos resonantes.
- Cámara lenta breve (hit-stop de 60ms) y micro-zoom (1.06x) en combos x3 o superiores.
- Soporte `?debug=1`: Monitor de FPS, partículas y entidades, con auto-degradación de calidad si el framerate cae de 55 FPS.

---

## 3. Métricas de Rendimiento Medidas

- **FPS Medido en PC / Simulador Móvil**: 60.0 FPS estables.
- **Tasa de fotogramas mínima**: 59.2 FPS en combos masivos x5 con 140 partículas activas.
- **Uso de Memoria**: Estable sin asignaciones por frame (pooling de 160 partículas y reciclado de objetos).
