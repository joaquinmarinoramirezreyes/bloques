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
