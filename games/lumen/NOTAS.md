# Bitácora de Mejoras y Calidad - Lumen

## Fecha: 14 de Octubre de 2026
## Versión: v2.0 (Estándar de Calidad Aplicado)

### 1. Ritmo y Tensión (La Oscuridad Avanza)
- **Consumo Gradual de Faroles**:
  - Los faroles encendidos se van extinguiendo progresivamente si el jugador no los refresca periódicamente pisándolos (`CONFIG.LANTERN_DECAY_RATE: 0.05` rad/s).
  - Las criaturas ganan un +25% de velocidad en zonas oscuras y se calman/ralentizan en áreas iluminadas.
  - El jugador alterna entre encender nuevos faroles, mantener los ya prendidos y huir de las sombras.
- **Clímax de "Apagón"**:
  - Al quedar 2 o menos faroles por encender en el nivel, se desencadena un evento de alarma: viñeta de oscuridad pulsante (`#blackout-vignette`), tempo musical duplicado y aceleración de criaturas para un cierre de nivel épico.
- **Eventos Aleatorios Dinámicos**:
  - Parpadeo repentino de luces (reduce el radio de luz del jugador momentáneamente).
  - Aparición de criaturas sorpresa emergiendo de los túneles laterales de envoltura (`T`).

### 2. Variedad y Mundos (30 Niveles en 5 Mundos)
- **30 Niveles de Laberinto con Identidad Temática Propia**:
  1. *Mundo 1: Bosque Sombrío* (Niveles 1-6): Estética esmeralda fosfórica (`#00ff88`). Regla: Niebla que reduce la visión base. Jefe Nv 6: "Espíritu de las Ramas" (ataques en cruz telegrafiados).
  2. *Mundo 2: Cripta Olvidada* (Niveles 7-12): Estética cian ancestral (`#00f0ff`). Regla: Puertas rúnicas (`D`) que requieren recoger llaves doradas (`K`). Jefe Nv 12: "Gólem de Tumba" (pisadas con ondas expansivas).
  3. *Mundo 3: Mina de Obsidiana* (Niveles 13-18): Estética dorada y ámbar (`#ffaa00`). Regla: Trampas solares (`X`) y reliquias arcanas (`R`). Jefe Nv 18: "Monolito de Carbón".
  4. *Mundo 4: Ciudad Espectral* (Niveles 19-24): Estética cobalto espectral (`#88aaff`). Regla: Interruptores (`S`) y losetas móviles. Jefe Nv 24: "Arconte Sombrío" (teletransporte entre esquinas).
  5. *Mundo 5: Abismo Primordial* (Niveles 25-30): Estética carmesí abisal (`#ff007f`). Regla: Oscuridad voraz. Jefe Nv 30: "Devorador de Luz" (jefe final con 3 fases de invocación y apagón perpetuo).
- **7 Tipos de Criatura con Diseños Geométricos y Comportamiento Único**:
  1. *Acechador*: Diamante rojo. Caza directa en penumbra y huida inmediata a la sombra al entrar en el haz de luz.
  2. *Divisor*: Doble triángulo naranja. Al impactar con Destello o trampas, se fragmenta en dos mini-sombras veloces.
  3. *Emisor de Sombras*: Pentágono púrpura. Emite una estela que apaga la luz temporalmente a su paso.
  4. *Tímido (Gazer)*: Octógono cian con ojo. Solo se mueve cuando el jugador NO lo mira de frente; si el farolero lo encara, se congela.
  5. *Tragaluz*: Cuadrado amarillo con fauces. Patrulla buscando faroles encendidos para devorar su lumbre.
  6. *Fantasma Fase*: Espiral translúcida. Atraviesa muros delgados cada 8 segundos.
  7. *Coloso*: Rombo gigante acorazado. Inmune a la luz de los faroles; solo retrocede con Destello de Emergencia o Trampas de Luz.

### 3. Progresión, Talentos y Modalidades
- **Sistema de Mejoras Elegibles (Upgrade Cards)**:
  - Al completar cada nivel, el jugador elige 1 de 3 bendiciones aleatorias:
    * *Linterna Ampliada*: +25% radio de luz del jugador.
    * *Chispa Adicional*: +1 slot de chispa máxima.
    * *Zancada Veloz*: +15% velocidad de movimiento.
    * *Batería Solar*: -30% tiempo de recarga del Destello.
    * *Reserva de Aceite*: Los faroles tardan un 50% más en apagarse.
    * *Aura de Rechazo*: Las criaturas en el haz de luz se frenan un 35%.
- **Modo Sin Fin (Noche Perpetua)**:
  - Generador procedural (`generateEndlessMaze`) basado en Recursive Backtracker que garantiza laberintos 100% conexos y resolubles con 7 faroles accesibles.
- **Modo Desafío Diario**:
  - Semilla determinista basada en fecha (`YYYYMMDD`) con bonificación de +50% en puntos y destello listo desde el inicio.
- **10 Logros Integrados y Persistencia**:
  - Clave versionada `lumen:v2` con migración automática y transparente desde `lumen:v1:best_score`.
  - Calificación de 1 a 3 estrellas por nivel.

### 4. Jugabilidad, Controles y Rendimiento
- **Control Fluido con Búfer de Giro (Corner Slip)**:
  - El jugador encola giros hasta 150 ms antes de llegar a intersecciones, encajándose automáticamente en el centro de la celda sin trabarse en esquinas.
- **Rendimiento Extremo (60 FPS Sostenidos)**:
  - Capa estática del laberinto renderizada en canvas offscreen (`offscreenMazeCanvas`).
  - Capa de iluminación y sombras procesada en canvas offscreen (`offscreenLightCanvas`) con corte radial en modo `destination-out`.
  - Cálculo de rutas BFS escalonado en intervalos temporales para no sobrecargar el frame.
  - Object pooling estricto de partículas y textos flotantes.
  - Modo diagnóstico (`?debug=1`) con monitor de FPS, frame time y recuento de entidades; si baja de 55 FPS sostenidos se activa el perfil de bajo consumo automático.
