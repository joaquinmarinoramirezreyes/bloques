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
