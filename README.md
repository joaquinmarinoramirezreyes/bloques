# Sala Arcade - Colección de Juegos Web Retro

Una plataforma arcade web de juegos clásicos desarrollada como sitio estático puro con **HTML5, CSS3 y Vanilla JavaScript (ES6+)**.
Sin frameworks, sin librerías externas, sin CDN, sin paso de build y con capacidad de funcionamiento **100% offline**.

---

## Estructura del Proyecto

```text
/
├── index.html          # Menú principal arcade con tarjetas interactivas
├── menu.css            # Estilos del hub, responsive vertical mobile-first
├── menu.js             # Carga dinámica y renderizado desde games.json
├── games.json          # Catálogo extensible de juegos registrados
├── vercel.json         # Configuración estática y cleanUrls
├── shared/             # Módulos comunes reutilizables
│   ├── theme.css       # Variables de color neón, reset y safe-area insets
│   ├── storage.js      # Gestión de récords con localStorage por juego y try/catch
│   ├── canvas.js       # Escalado de canvas para alta densidad (devicePixelRatio)
│   └── audio.js        # Efectos de sonido retro sintetizados (Web Audio API, 0 KB)
└── games/
    ├── bloques/        # El juego original de puzzle de bloques que caen
    │   ├── index.html  # Interfaz, HUD, modal de pausa/game over
    │   ├── style.css   # Estilos del tablero y controles táctiles
    │   └── game.js     # Lógica: 7-bag, wall kicks, ghost piece, lock delay
    ├── snake/          # Juego de Serpiente neón
    │   ├── index.html  # Lienzo, controles táctiles D-pad y swipe
    │   ├── style.css   # Estética arcade verde neón
    │   └── game.js     # Lógica: cuadrícula adaptativa, velocidad creciente, swipe
    ├── rompemuros/     # Juego Rompe Muros
    │   ├── index.html  # Tablero 3:4, indicador de saque, HUD de vidas y power-ups
    │   ├── style.css   # Estilos neón coral y área táctil completa con una mano
    │   └── game.js     # Lógica: física por subpasos, ángulos dinámicos, power-ups y niveles
    ├── defensaorbital/ # Juego Defensa Orbital
    │   ├── index.html  # Interfaz, HUD espacial y canvas 3:4
    │   ├── style.css   # Estilos espaciales neón cyan y controles táctiles con offset
    │   └── game.js     # Lógica: nave con disparo continuo, parallax y colisiones
    └── sombras/        # Juego Sombras (Sigilo y laberintos procedimentales)
        ├── index.html  # Interfaz cenital, joystick flotante, visor HUD y selector de trajes
        ├── style.css   # Estilos oscuros neón púrpura y linterna dinámica
        └── game.js     # Lógica: laberintos con ciclos, niebla de guerra, IA de guardianes y skins
```

---

## Juegos Incluidos

### 1. Bloques (`/games/bloques/`)
- Tablero clásico de 10×20 con las 7 piezas clásicas.
- Generador de bolsa aleatoria de 7 piezas (**7-bag randomizer**) para evitar rachas y sequías.
- Rotación completa horaria y antihoraria con compensación de pared (**Wall Kicks**).
- Proyección de caída (**Ghost Piece**) y retardo de fijación (**Lock Delay**).
- Puntuación creciente con multiplicador por nivel y aumento gradual de velocidad.
- Controles táctiles ergonómicos con auto-repetición continua (DAS/ARR).

### 2. Serpiente (`/games/snake/`)
- Cuadrícula adaptable con diseño neón.
- Movimiento continuo e interpolado a 60/120 FPS con curvas redondeadas.
- Cola de giros de entrada (buffer) para no perder pulsaciones rápidas consecutivas.
- Control dual: gestos táctiles de deslizamiento (**swipe**) en pantalla y cruz direccional (**D-pad**).
- Soporte para teclado de PC (Flechas y `WASD`).
- Aumento gradual de velocidad por orbe de energía consumido, partículas y vibración de pantalla.

### 3. Rompe Muros (`/games/rompemuros/`)
- Fiel al estilo clásico de demoledores de ladrillos con física por subpasos anti-tunneling.
- Ángulo de rebote dependiente del punto de impacto en la paleta.
- Ladrillos de 1, 2 y 3 impactos con daño visual progresivo y degradados neón.
- Power-ups que caen aleatoriamente: **Paleta Ancha**, **Pelota Lenta** y **Multibola**.
- Niveles declarativos definidos en matriz de datos.
- Control con una sola mano en móvil (la paleta sigue el dedo en cualquier zona de la pantalla con suavizado lerp) y ratón/teclado en PC.

### 4. Defensa Orbital (`/games/defensaorbital/`)
- Shooter vertical arcade de defensa planetaria por oleadas.
- Nave con disparo automático constante y control táctil con offset vertical ergonómico para no tapar la nave.
- Fondo de estrellas con parallax de 3 capas.
- Object pooling total en proyectiles, enemigos y partículas.
- 4 tipos de enemigos con IA distintiva (Zigzag, Kamikaze, Tirador, Blindado) y jefe de sector.
- Power-ups espaciales: Disparo doble/triple, Escudo de fuerza y Bomba limpiadora.

### 5. Sombras (`/games/sombras/`)
- Juego de sigilo y escape en laberintos procedurales generados por backtracking con ciclos (rutas alternativas).
- Linterna dinámica cenital con sombras suaves y niebla de guerra pre-renderizada en canvas.
- 3 llaves distribuidas estratégicamente para desbloquear la salida del sector.
- 3 tipos de enemigos con IA avanzada:
  1. **Patrullero:** Dron de ruta que investiga ruidos acústicos y persigue en línea de visión directa.
  2. **Cazador:** Meca-sabueso con IA de rastreo que patrulla por cuadrantes sin bloquear pasillos y se repliega al capturar.
  3. **Cámara Centinela:** Cono de visión rotatorio en intersecciones amplias con punto ciego 100% transitable.
- Habilidades tácticas: **Sprint** con recarga de resistencia, **Distractor sónico** lanzable con rebote en muros y **Escudo de plasma** de un solo uso.
- 4 trajes cyber-agente seleccionables en vivo con LED táctico (`INFILTRADOR`, `CIBER-FANTASMA`, `SOMBRA CARMESÍ`, `ESPECTRO ORO`).
- Control móvil con joystick virtual flotante o teclado de escritorio.

---

## Cómo Añadir un Juego Nuevo

La arquitectura está diseñada para ser 100% extensible sin modificar el código del menú principal:

1. Crea la carpeta de tu juego en `/games/<nuevo_juego>/` con su propio `index.html`, `style.css` y `game.js`.
2. Enlaza los módulos compartidos si lo deseas (`../../shared/theme.css`, `../../shared/storage.js`, `../../shared/canvas.js`, `../../shared/audio.js`).
3. Agrega una entrada en `games.json`:

```json
{
  "id": "mi_juego",
  "name": "Mi Juego",
  "folder": "games/mi_juego",
  "description": "Descripción breve y atractiva del juego.",
  "color": "#ff007f",
  "badge": "ACCIÓN",
  "icon": "default"
}
```

El menú principal renderizará automáticamente la tarjeta con su color de acento, icono y récord histórico correspondiente.

---

## Controles

### Menú Principal
- Toca o haz clic en cualquier tarjeta para iniciar el juego.
- En cada juego, el botón **◀ (Volver)** en la barra superior te regresa al menú.

### Bloques
| Acción | Teclado (Escritorio) | Móvil (Táctil) |
| :--- | :--- | :--- |
| Mover lateralmente | Flechas `←` `→` / `A` `D` | Botones `◀` `▶` (mantener para deslizar) |
| Rotar horario | Flecha `↑` / `W` | Botón grande `↻ ROTAR` |
| Rotar antihorario | Tecla `Z` / `Q` | Botón pequeño `↺` |
| Caída suave | Flecha `↓` / `S` | Botón `▼` (mantener) |
| Caída instantánea | Barra `Espacio` | Botón `⚡ CAÍDA` |
| Pausa | Tecla `P` / `Escape` | Botón de pausa en barra superior |

### Serpiente
| Acción | Teclado (Escritorio) | Móvil (Táctil) |
| :--- | :--- | :--- |
| Cambiar dirección | Flechas `↑` `↓` `←` `→` / `W` `A` `S` `D` | Deslizar dedo (Swipe) o botones D-pad |
| Pausa | Tecla `P` / `Escape` | Botón de pausa en barra superior |
| Reiniciar | Tecla `R` / `Espacio` | Botón de reinicio o pantalla Game Over |

### Rompe Muros
| Acción | Teclado (Escritorio) | Móvil (Táctil) |
| :--- | :--- | :--- |
| Mover paleta | Flechas `←` `→` / `A` `D` / Ratón | Deslizar o arrastrar en cualquier parte |
| Lanzar pelota | Barra `Espacio` / Clic | Tocar cualquier parte de la pantalla |
| Pausa | Tecla `P` / `Escape` | Botón de pausa en barra superior |
| Reiniciar | Tecla `R` | Botón de reinicio o pantalla Game Over |

### Sombras
| Acción | Teclado (Escritorio) | Móvil (Táctil) |
| :--- | :--- | :--- |
| Moverse | Flechas `↑` `↓` `←` `→` / `W` `A` `S` `D` | Joystick virtual flotante en pantalla |
| Sprint | Mantener `Shift` | Botón táctil `⚡ SPRINT` |
| Lanzar distractor | Barra `Espacio` | Botón táctil `🎯 DISTRAER` |
| Cambiar traje (Skin) | Tecla `C` | Botón `🎨` en barra superior |
| Pausa | Tecla `P` / `Escape` | Botón de pausa en barra superior |
| Reiniciar | Tecla `R` | Botón de reinicio o pantalla Game Over |

---

## Despliegue en Producción

El proyecto está preparado para desplegarse como sitio estático sin configuración de build:

- **Vercel:** Despliegue automático con cada push a la rama `main`.
- **GitHub Pages:** Habilitar desde Settings > Pages > Source: rama `main`, directorio `/ (root)`.
- **Cloudflare Pages:** Conectar repositorio con build command vacío y output directory en raíz `.`.
