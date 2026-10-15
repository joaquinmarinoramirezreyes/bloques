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

---

## 4. Actualización de Control Bomberman y Gráficos Pseudo-3D (15 de Octubre de 2026)

### A) Movimiento y Deslizamiento en Esquinas (Corner-Assist)
- **Eliminación Total de la Ambigüedad en Giros**:
  - Implementación de asistencia en esquinas en `updatePlayer`: cuando el jugador presiona una dirección perpendicular y colisiona con un bloque o pilar pero está a menos de 12px de la embocadura del pasillo adyacente, el motor desliza automáticamente al personaje alrededor de la esquina.
  - Centrado dinámico en el carril: la marcha horizontal atrae suavemente la coordenada Y hacia el centro de la fila (`cellCenterY`), y la marcha vertical atrae la coordenada X hacia el centro de la columna (`cellCenterX`).
  - Inversión instantánea de 180° sin retraso ni enganches.

### B) Gráficos Volumétricos Pseudo-3D (Estilo Bomberman Clásico)
- **Personaje Principal con Perspectiva Isométrica 3/4**:
  - Casco blanco abovedado 3D con brillo radial especular y sombra inferior.
  - Pompón / antena esférica rosa elástica sobre la coronilla que rebota y oscila al compás de los pasos.
  - Visor ovalado azul profundo con reflejo vítreo y ojos animados estilo caricatura que parpadean periódicamente y miran hacia la dirección de avance.
  - Traje blanco y cian con cinturón utilitario y hebilla dorada.
  - Botas redondeadas rosas con balanceo rítmico en animación de zancadas (`walkTimer`).
  - 4 poses dedicadas por punto cardinal: Frontal (hacia abajo), Dorsal (hacia arriba), Perfil Izquierdo y Perfil Derecho.
- **Cuadrícula y Bloques Tridimensionales**:
  - Pilares de concreto con cara frontal extruida de 6px, bisel superior y remaches metálicos.
  - Cajas y bloques destruibles con textura de madera tecnológica, ensambles en esquinas y cara frontal 3D.
  - Suelo en damero de alta resolución con contraste nítido y sensación de profundidad de arena arcade.
- **Bombas / Cargas con Mecha y Respiración Dinámica**:
  - Esfera metálica negra brillante con relieve especular.
  - Mecha de cordel curvada ardiendo con chispas incandescentes continuas y partículas de humo.
  - Animación de respiración / pulso elástico que se acelera progresivamente a medida que la mecha se extingue (< 0.8s).
- **Llamaradas Volumétricas en Cruz**:
  - Explosión de tres capas concéntricas: núcleo de plasma blanco incandescente, cuerpo de fuego naranja brillante y crestas exteriores amarillas con dispersión de chispas.
- **Enemigos Pseudo-3D Reestilizados**:
  - Patrulla: criatura esférica naranja gelatinosa con squash and stretch y ojos de caricatura.
  - Cazador: robot cilíndrico cian con visor óptico y patas mecánicas en movimiento.
  - Blindado: mecha cúbico de titanio 3D con cara frontal biselada y ranura óptica roja.

---

## 5. Mecánica Clásica de Bombas y Power-up de Patada (15 de Octubre de 2026)

### A) Eliminación de Empuje por Defecto
- **Comportamiento Bomberman Clásico**:
  - Las bombas plantadas actúan por defecto como obstáculos sólidos que bloquean al jugador, impidiendo empujar o lanzar cargas accidentalmente.
  - Al chocar con una bomba sin el power-up de patada, el jugador se detiene en seco o se desliza limpiamente por el pasillo lateral contiguo si existe (corner-assist).

### B) Power-up "K" (Patada de Bombas / Guantelete)
- **Generación y Recolección**:
  - Se incorporó el ítem `K` a la rotación de power-ups destruibles (`maybeSpawnPowerup`).
  - Al recogerlo, el jugador desbloquea `p.canKick = true` con notificación en pantalla (*"¡PATADA DE BOMBAS OBTENIDA!"*).
  - Con el power-up activo, caminar hacia una carga la impulsa deslizándose a toda velocidad hasta topar con un muro, otra bomba o detonar en cadena.

