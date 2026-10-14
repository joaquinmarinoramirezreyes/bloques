# Bitácora de Mejoras y Calidad - Frontón

## Fecha: 14 de Octubre de 2026
## Versión: v2.0 (Estándar de Calidad Aplicado)

### 1. Sensación de Impacto ("Juice")
- **Screen Shake Proporcional**: Integrado con `ArcadeJuice.shake(intensity, duration)` en impactos a alta velocidad (> 550 px/s).
- **Hitstop Dinámico**: Micro-pausa de 50 ms en impactos supersónicos (>= 650 px/s) para realzar el dramatismo físico.
- **Repetición en Cámara Lenta (Slow-Mo Replay)**: Búfer circular de 90 frames que reproduce automáticamente el punto ganador a 0.35x de velocidad con viñeta retro y banner animado antes de pasar a la pantalla de victoria.
- **Inclinación de Paletas (*Tilt*)**: Rotación elástica angular calculada a partir de la velocidad horizontal de la paleta y del punto de impacto de la bola.
- **Textos Flotantes**: Aviso animado flotante para anotaciones de punto y recolección de power-ups con object pooling.

### 2. Estética Visual y Fidelidad Vectorial
- **Arena Futurista con Líneas de Luz**: Líneas de delimitación perimetral con pulso neón, red central holográfica y halo cuántico central.
- **Estela y Resplandor de Pelota Adaptativo por Velocidad**:
  - < 400 px/s: Cian eléctrico (`#00f0ff`).
  - 400 - 550 px/s: Ámbar brillante (`#facc15`).
  - 550 - 680 px/s: Rosa Magenta neón (`#ff007f`).
  - >= 680 px/s: Blanco cuántico incandescente (`#ffffff`) con chispas de partículas continuas.

### 3. Power-ups en Cancha
- **Generación Procedural**: Spawnea un power-up cada 14-16 segundos en la zona central con alerta sonora y visual:
  1. `PALETA GRANDE` (↔️): Expande la paleta un 40% durante 10 segundos.
  2. `PELOTA LENTA` (❄️): Frena la pelota devolviéndola a velocidad base.
  3. `MULTIPELOTA` (⚽): Duplica la pelota en juego con trayectorias cruzadas.
  4. `RED DEFENSIVA` (🛡️): Despliega una barrera de energía tras la paleta del jugador que salva automáticamente 1 gol.

### 4. Nuevos Modos de Juego
- **Partida Rápida**: 1P vs IA (Novato, Pro, Cyber) o 2P local en el mismo teléfono.
- **Torneo Cuántico (5 Rivales)**:
  1. *Vector-1* (🤖): Prototipo con golpes suaves y predecibles.
  2. *Aero-Bot* (⚡): Ágil y veloz con tiros cruzados.
  3. *Vortex* (🌀): Efectos giroscópicos y rebotes en pared.
  4. *Iron-Guard* (🛡️): Gran precisión y postura ultra-defensiva.
  5. *Quantum-X* (🔮): Maestro supremo con aceleración cuántica y spin letal.
- **Modo Supervivencia**: Pared superior indestructible o frontón eterno; la pelota acelera de forma continua (+12 px/s por rebote) sin límite. El récord mide el número de rebotes consecutivos alcanzados.

### 5. Progresión, Retención y Accesibilidad
- **8 Logros Integrados**:
  1. *Primer Saque*
  2. *Maestro del Rally*
  3. *Velocidad Supersónica*
  4. *Campeón del Torneo*
  5. *Superviviente Cuántico*
  6. *Sobrecarga Cuántica*
  7. *Salvada Épica*
  8. *Blanqueada Perfecta*
- **Desafíos Diarios**: 3 misiones diarias con seguimiento de progreso persistente en `localStorage`.
- **Ajustes y Accesibilidad**: Control independiente de volumen SFX y BGM generativo, toggle háptico de vibración y modo de alto contraste para visibilidad extrema.
- **Diagnóstico**: Activable con `?debug=1`, monitor de FPS y frame time en ms con ajuste dinámico de calidad si desciende de 55 FPS.
