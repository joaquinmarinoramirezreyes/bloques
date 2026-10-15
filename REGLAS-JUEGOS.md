# Reglas de Desarrollo y Arquitectura - Sala Arcade

Este documento contiene las reglas comunes obligatorias para todos los juegos del proyecto Arcade. Debe consultarse y leerse **ANTES** de crear, rediseñar o modificar cualquier juego o módulo del catálogo.

---

## 1. Arquitectura Técnica y Entorno
- **Tecnología Estricta**: Vanilla JavaScript puro (ES6+), HTML5 y CSS3 moderno.
- **Cero Dependencias**: Prohibido el uso de frameworks (React, Vue, etc.), bibliotecas externas, empaquetadores (Webpack, Vite) o CDNs externos. Todo el código debe ejecutarse de forma 100% offline y autónoma.
- **Estructura de Carpetas**: Cada juego reside en su propio directorio aislado bajo `/games/<nombre>/`, compuesto obligatoriamente por:
  - `index.html`: Estructura semántica, metadatos móviles y canvas.
  - `style.css`: Estilos encapsulados del juego y sus modales.
  - `game.js`: Lógica, física, pooling, controles y bucle de juego.
- **Rutas Relativas**: Todas las referencias a scripts, estilos y enlaces deben ser relativas (`./` o `../../`), garantizando funcionamiento tanto en servidores web como en despliegues estáticos y carpetas locales.
- **Registro de Catálogo**: Todo juego nuevo debe registrarse inmediatamente en `games.json` (incluyendo su campo `"eras"`) y sincronizarse en el catálogo de respaldo `FALLBACK_GAMES` de `menu.js`.

---

## 2. Reutilización de Código Central (`/shared`)
- **Uso Obligatorio de Módulos Compartidos**: No dupliques utilidades genéricas dentro de las carpetas de los juegos. Utiliza siempre las herramientas centralizadas en `/shared`:
  - `theme.css`: Variables globales de color, tipografía, reset y safe-area.
  - `canvas.js`: Escalado responsivo y gestión de nitidez con `devicePixelRatio`.
  - `storage.js` (`ArcadeStorage`): Persistencia segura de puntuaciones récord.
  - `audio.js` (`ArcadeAudio`): Síntesis de sonido procedural vía Web Audio API.
  - `controls.js`: Capas de controles táctiles normalizadas.
- **Evolución Compartida**: Si un juego requiere una función de utilidad reutilizable (ej. nuevos osciladores o helpers matemáticos), agrégala a `/shared` en lugar de crear implementaciones paralelas.

---

## 3. Filosofía Móvil Primero (Mobile-First)
- **Orientación Vertical**: Diseño optimizado primordialmente para pantallas móviles en orientación vertical (portrait).
- **Prevención de Gestos Accidentales**:
  - `touch-action: none` en áreas interactivas y canvas para evitar scroll, rebote o arrastre indeseado.
  - `user-select: none` (`-webkit-user-select: none`) en controles para evitar selección accidental de texto.
  - Viewport estricto: `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover`.
- **Zonas Seguras (Safe Area)**: Uso mandatorio de `env(safe-area-inset-*)` para respetar notches, cámaras frontales y barras de gestos del sistema.
- **Ergonomía Táctil**:
  - Objetivos táctiles mínimos de **44 × 44 px** para todos los botones e interacciones.
  - Offset visual para controles de dedo (evitar que el pulgar tape la nave, jugador o elementos clave).
- **Navegación**: Todo juego debe contar con un botón claro y accesible para pausar y para volver al menú principal (`../../index.html`).

---

## 4. Rendimiento y Bucle de Simulación
- **Bucle de Juego**: Renderizado mediante `requestAnimationFrame` y actualización con delta time (`dt`) con límite máximo (`clamp` a ~0.08 s para evitar saltos temporales ante pausas del navegador).
- **Objetivo de Rendimiento**: 60 FPS estables y fluidos en dispositivos móviles de gama media.
- **Cero Creación de Objetos por Frame**:
  - **Object Pooling** mandatorio para partículas, proyectiles, enemigos y textos flotantes.
  - Prohibido instanciar arrays u objetos dentro del `update()` o `render()` continuos.
  - Limpieza de memoria y reutilización estricta de slots inactivos.

---

## 5. Récords y Persistencia
- **Claves Versionadas**: Guardado y lectura de mejores puntuaciones a través de `ArcadeStorage.getHighScore(clave)` y `ArcadeStorage.setHighScore(clave, score)` utilizando claves con versión (ejemplo: `"<juego>:v1"`).
- **Validación de Datos**: Validación preventiva ante valores `NaN`, `null`, `undefined` o datos corruptos en el `localStorage`.

---

## 6. Audio Procedural Sintetizado
- **Web Audio API**: Efectos de sonido sintetizados mediante osciladores puros (`sine`, `square`, `sawtooth`, `triangle`) y nodos de ganancia / filtros.
- **Cero Assets Externos**: Prohibido el uso de archivos de audio comprimidos (`.mp3`, `.wav`, `.ogg`).
- **Control de Silencio**: Botón accesible para activar/desactivar audio (`Mute`).
- **Cumplimiento de Políticas de Autoplay**: El contexto de audio debe inicializarse o desbloquearse únicamente tras la primera interacción física del usuario (toque, clic o tecla).

---

## 7. Configuración Centralizada y Balance
- **Objeto CONFIG**: Al inicio de `game.js`, todas las constantes numéricas, dimensiones del mundo virtual, velocidades, intervalos de disparo, vida y tablas de puntuación deben estar consolidadas en una constante `CONFIG` inmutable y legible.

---

## 8. Identidad Visual y Arte Vectorial
- **Arte Dibujado por Código**: Todos los gráficos (naves, enemigos, circuitos, pistas, personajes, efectos) deben renderizarse proceduralmente en Canvas 2D mediante trazados vectoriales, gradientes y sombras neón.
- **Originalidad Absoluta**: Prohibido copiar marcas registradas, nombres de franquicias comerciales, logotipos o sprites de juegos existentes.
- **Aesthetic**: Diseños geométricos, paletas temáticas coherentes y efectos visuales arcade (estelas, ondas de choque, partículas de impacto, parallax estelar o de criptas).

---

## 9. Pruebas Automatizadas
- **Validación en Node.js**: Toda lógica verificable (algoritmos procedurales, curvas Bézier, trayectorias de enemigos, detección de combinaciones, gestión de cuadrícula o asignación de épocas) debe contar con pruebas unitarias simples en Node.js ejecutadas con éxito antes de dar por terminada la fase.

---

## 10. Protocolo de Control de Versiones y Entrega
- **NUNCA hacer commit ni push por iniciativa propia**: El usuario es el único que autoriza y aprueba cuándo realizar commit y push.
- **Transparencia en el Reporte de Pruebas**:
  - Reportar claramente qué pruebas fueron comprobadas **EJECUTANDO** código o scripts de simulación.
  - Reportar honestamente qué aspectos solo fueron comprobados por **INSPECCIÓN** de código o diseño.

---

## 11. Estándar de Calidad

Este estándar establece el nivel de acabado audiovisual, respuesta física y retención que debe exhibir cada juego del catálogo. Se aplica en cada juego indicado, preservando siempre intactas sus reglas y mecánicas de juego originales (salvo indicación expresa).

### 11.1 Sensación de Impacto ("Juice")
- **Feedback audiovisual inmediato**: Toda acción importante (golpe, destrucción, rebote, salto, captura) debe tener respuesta visual y sonora contundente: animación de entrada y salida, deformación elástica (*squash and stretch*), destellos breves (*hit flash*), explosión de partículas vectoriales, vibración de pantalla (*screen shake*) proporcional a la magnitud del evento, micro-pausa en golpes grandes (*hitstop* de 40 a 90 ms) y números o textos flotantes animados para puntos y combos.
- **Escalado de combos y rachas**: A mayor racha o combo, más partículas, tono sonoro creciente en frecuencia (*pitch shift* ascendente) y avisos flotantes destacados ("¡Combo x4!", "¡Imparable!").
- **Transiciones fluidas**: Cambios entre pantallas (menú, juego, pausa, resultados) mediante transiciones suaves (fundidos o deslizamientos de 150 a 250 ms), evitando cortes secos.

### 11.2 Estética Visual y Fidelidad Vectorial
- **Arte vectorial enriquecido**: Ilustración procedural con paletas temáticas coherentes, degradados radiales/lineales, brillos de neón, luces dinámicas y sombras proyectadas por código. Cero gráficos planos monocromáticos o formas sin volumen ni detalle.
- **Fondos animados sutiles**: Capas de parallax multicapa, estelas de polvo cósmico, orbes flotantes o gradientes que "respiran" suavemente sin interferir ni distraer de la zona jugable.
- **Tipografía y HUD de alto contraste**: Jerarquía visual limpia, legibilidad inmediata en pantallas móviles pequeñas y animación de conteo o escala en cambios de puntuación.
- **Identidad visual diferenciada**: Cada juego debe poseer su propio lenguaje visual único, distinguiéndose de los demás títulos del arcade y de cualquier marca existente.

### 11.3 Síntesis de Audio y Paisaje Sonoro
- **Efectos procedurales variados**: Múltiples variantes de tono y modulación por tipo de evento (pitch aleatorio leve de ±5-10%) para evitar fatiga auditiva o repetición monótona.
- **Música generativa ambiental**: Pista musical procedural en bucle sintetizada en tiempo real mediante Web Audio API, con control de volumen independiente para efectos de sonido (SFX) y música de fondo (BGM).

### 11.4 Progresión, Retención y Accesibilidad
- **Pantalla de inicio enriquecida**: Presentación con logotipo vectorial animado, selector de opciones y tutorial interactivo breve la primera vez que se juega (persistiendo en `ArcadeStorage` que ya fue completado).
- **Misiones u objetivos diarios**: 2 o 3 misiones simples diarias guardadas localmente (ej. "Consigue 1,000 pts", "Realiza un combo x3").
- **Estadísticas completas del jugador**: Registro persistente de partidas jugadas, tiempo total de juego, mejor racha y puntuación récord.
- **Sistema de Logros (mínimo 8 por juego)**: Logros variados con banner emergente animado (*toast*) al desbloquearse en tiempo real.
- **Pantalla de resultados detallada**: Desglose pormenorizado de puntos, comparación con el récord histórico y animación especial al batir una nueva mejor marca.
- **Panel de Opciones y Accesibilidad**: Ajustes independientes de volumen SFX y música, toggle de vibración háptica (`navigator.vibrate`) y modo de accesibilidad (modo alto contraste o paleta adaptada a daltonismo).

### 11.5 Rendimiento y Optimización Extrema (No Negociable)
- **Overlay de Diagnóstico (`?debug=1`)**: Modo de depuración que muestra en pantalla FPS en tiempo real, tiempo de frame (ms) y recuento de partículas activas.
- **Ajuste automático de calidad**: El juego debe mantener 60 FPS estables. Si los FPS descienden de 55 sostenidos en dispositivos de gama media, se activa automáticamente un perfil de bajo consumo que reduce la cantidad de partículas y desactiva sombras pesadas.
- **Cero basura para el recolector (Garbage Collector)**: Object pooling estricto para partículas, proyectiles, textos flotantes y arrays temporales. Prohibido instanciar objetos o cadenas dentro del ciclo de actualización/renderizado por frame.

### 11.6 Reglas del Proceso y Documentación
- **NUNCA hacer commit ni push** sin autorización expresa del usuario.
- **Transparencia en el reporte**: Informar con precisión qué aspectos fueron probados **EJECUTANDO** código y qué aspectos fueron revisados por **INSPECCIÓN**.
- **Bitácora de cambios**: Mantener y actualizar un archivo `NOTAS.md` en la carpeta de cada juego donde se apliquen mejoras, detallando cada cambio introducido.

---

## 12. Prueba de Humo Automatizada (Smoke Test)

Todo juego nuevo, modificado o refactorizado debe pasar obligatoriamente la suite automatizada de prueba de humo ejecutada en navegador real headless antes de darse por completado o listo para entrega:

```bash
npm run smoke
# o directamente:
node scripts/smoke.js
```

### Criterios Obligatorios de Aprobación:
1. **Cero errores en consola**: Sin `TypeError`, excepciones no capturadas (`uncaught exceptions`), advertencias de script o errores HTTP 404 en favicons, módulos, fuentes o assets.
2. **Canvas activo y renderizado**: El elemento `<canvas>` debe existir, tener dimensiones mayores a 0 (`width > 0 && height > 0`) y contener píxeles de color dibujados tras la carga inicial (no vacío ni transparente).
3. **Bucle de simulación activo**: El ciclo de animación (`requestAnimationFrame`) debe ciclar activamente sin bloqueos ni fugas de frames.
4. **Reporte limpio**: Si un solo juego falla en la suite de 15 juegos, el proceso termina con código de salida `1` y la entrega queda bloqueada hasta corregir el fallo de raíz.

