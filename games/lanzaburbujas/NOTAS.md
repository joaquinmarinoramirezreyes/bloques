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
