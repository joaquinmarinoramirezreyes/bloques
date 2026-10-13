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
    └── snake/          # Nuevo juego de Serpiente neón
        ├── index.html  # Lienzo, controles táctiles D-pad y swipe
        ├── style.css   # Estética arcade verde neón
        └── game.js     # Lógica: cuadrícula adaptativa, velocidad creciente, swipe
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
- Control dual: gestos táctiles de deslizamiento (**swipe**) en pantalla y cruz direccional (**D-pad**).
- Soporte para teclado de PC (Flechas y `WASD`).
- Aumento gradual de velocidad por orbe de energía consumido.
- Animación de rastro brillante y detección precisa de colisiones contra bordes y cuerpo.

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

---

## Despliegue en Producción

El proyecto está preparado para desplegarse como sitio estático sin configuración de build:

- **Vercel:** Despliegue automático con cada push a la rama `main`.
- **GitHub Pages:** Habilitar desde Settings > Pages > Source: rama `main`, directorio `/ (root)`.
- **Cloudflare Pages:** Conectar repositorio con build command vacío y output directory en raíz `.`.
