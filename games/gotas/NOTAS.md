# Bitácora de Mejoras y Calidad - Gotas

## Fecha: 14 de Octubre de 2026
## Versión: v2.0 (Estándar de Calidad Aplicado)

### 1. Sensación de Impacto ("Juice")
- **Gotas Líquidas y Expresiones Reactivas**:
  - Forma elástica que se estira durante la caída libre (`scaleX: 0.9, scaleY: 1.15` y `0.8/1.25` en caída rápida) y se aplasta con amortiguación elástica al asentarse (`scaleX: 1.25, scaleY: 0.75`).
  - Rostro con ojos y boca reactiva:
    - *Expresión de pánico*: Ojos abiertos y temblorosos con gota de sudor cuando las gotas se ubican en las 3 filas superiores ($r \le 2$).
    - *Expresión eufórica*: Ojos arqueados y sonrisa en cascadas y combos.
    - *Expresión somnolienta*: En gotas de basura inerte.
- **Ondas Líquidas y Zoom en Cascadas**:
  - En combos $\ge 2$, la cámara realiza un zoom sutil proporcional al multiplicador de reacción.
  - Al disolverse gotas, se emiten ondas de choque radiales translúcidas (*shockwaves*) en el matraz.
  - Textos flotantes y avisos de daño/combo usando el pool de `ArcadeJuice`.
- **Fondo Animado**: Caverna alquímica bioluminiscente con 24 burbujas de gas ascendentes continuas.

### 2. Modos de Juego
- **Modo Normal**: Partida clásica sin fin con aceleración progresiva y desbloqueo del 5to color a partir del nivel 4.
- **Modo Maratón de Jefes (5 Jefes)**:
  1. *Sorbete* (1200 PV, 2 gotas de basura cada 18s).
  2. *Viscosa* (2600 PV, 3 gotas de basura cada 15s).
  3. *Maelstrom* (4800 PV, 4 gotas de basura cada 13s).
  4. *Plasma-Core* (7500 PV, 5 gotas de basura cada 11s).
  5. *Titanium Blob* (11000 PV, 6 gotas de basura cada 9s).
  - Cada gota disuelta en combo inflige daño al jefe; la basura inerte se disuelve al detonar grupos adyacentes o con la gota arcoíris.
- **Modo Contrarreloj (120s)**: Dos minutos de cronómetro regresivo para maximizar puntuación y combos.
- **Modo Duelo contra IA (5 Rivales)**: Combate bidireccional donde cada reacción en cadena envía basura al rival hasta drenar su energía o colapsar la entrada.

### 3. Progresión, Tutorial y Accesibilidad
- **Tutorial Interactivo en 3 Pasos**: Explica conexiones básicas ortogonales, cascadas por gravedad y el funcionamiento de la gota arcoíris.
- **8 Logros Integrados**:
  1. *Primera Mezcla*
  2. *Reacción en Cadena*
  3. *Maestro de Cascadas*
  4. *Prisma Gelatinoso*
  5. *Cazador de Jefes*
  6. *Emperador Líquido*
  7. *Velocidad Líquida*
  8. *Duelo Supremo*
- **Persistencia Versionada**: Clave `gotas:v2` con migración de récord y métricas de mayor cadena histórica.
- **Ajustes y Accesibilidad**: Control independiente de SFX, BGM generativo, vibración háptica y modo de alto contraste.
- **Diagnóstico**: Compatible con `?debug=1`, monitor de FPS y frame time ms.
