# Bitácora de Mejoras y Calidad - Campo Minado

## Fecha: 14 de Octubre de 2026
## Versión: v2.0 (Estándar de Calidad Aplicado)

### 1. Sensación de Impacto ("Juice")
- **Animación de Revelado en Ola (*Wave Reveal*)**: El despeje en cadena se expande progresivamente con un retraso escalonado proporcional a la distancia de cada casilla al punto tocado (`dist * 0.035s`).
- **Explosión y Shockwave**: Animación de colapso con onda expansiva radial, partículas de metralla, vibración háptica (`ArcadeJuice.vibrate(90)`) y sacudida de pantalla (`ArcadeJuice.shake(12, 0.4)`).
- **Textos Flotantes**: Indicadores flotantes para colocación de banderas y confirmación de pistas seguras del sonar.

### 2. Estética Visual y Relieve Sonar
- **Casillas 3D Biseladas**: Volumen realista con bisel claro superior/izquierdo y oscuro inferior/derecho en casillas cubiertas, y fondo hundido oscuro al ser reveladas.
- **Números de Alto Contraste**: 8 colores de alta visibilidad con brillo neón diferenciado según el conteo de minas adyacentes.
- **Banderas Holográficas**: Mástil y banderín animado con relieve.

### 3. Modos de Juego
- **Modo Clásico**: 3 tamaños optimizados para móvil vertical:
  - 9x9 con 10 minas.
  - 12x16 con 30 minas.
  - 16x24 con 70 minas.
- **Modo Contrarreloj**: Temporizador regresivo (90s, 180s, 300s) donde cada casilla numérica revelada bonifica +1.5s de tiempo extra.
- **Campaña de Laboratorio (20 Sectores)**: 20 niveles de dificultad progresiva con mecánicas tácticas únicas:
  - Sectores 1 a 4: Calibración básica.
  - Sectores 5 a 8: *Números Par/Impar* (algunas celdas muestran 'P' o 'I' en lugar del número exacto).
  - Sectores 9 a 12: *Niebla de Sonar* (visibilidad reducida a través de pulsos periódicos).
  - Sectores 13 a 16: *Minas Dinámicas* (reubicación controlada de minas).
  - Sectores 17 a 20: *Núcleo Crítico* (máxima densidad y margen cero).

### 4. Ayudas Limitadas y Deducción Determinista
- **Escaneo de Sonar (Pista)**: Botón con recarga que revela de forma 100% segura una casilla transitable garantizada.
- **Generador Guess-Free**: Integración de `MineSweeperLogic.solveLogically(...)`, un solucionador lógico determinista en Node.js que valida que el tablero pueda resolverse al 100% por pura deducción lógica desde el primer toque sin tener que adivinar al 50/50.

### 5. Progresión, Retención y Accesibilidad
- **8 Logros Integrados**:
  1. *Primer Sector*
  2. *Artificiero Veloz*
  3. *Lógica Pura*
  4. *Cadete de Laboratorio*
  5. *Maestro del Sonar*
  6. *A Mente Fría*
  7. *Misión Titán*
  8. *En Racha*
- **Tutorial Interactivo de 3 Pasos**: Explica la lógica de números, banderas y sonar.
- **Ajustes y Accesibilidad**: Control independiente de volumen SFX/BGM, toggle háptico de vibración y modo de alto contraste para personas con daltonismo.
- **Diagnóstico**: Modo de rendimiento con `?debug=1`.
