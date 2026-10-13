# Bloques

Un juego web de puzzle clásico de bloques que caen, desarrollado como sitio estático puro con **HTML5, CSS3 y JavaScript vanilla (ES6+)**. No requiere frameworks, compiladores, empaquetadores ni dependencias externas. Funciona 100% offline una vez cargado.

---

## Características Principales

- **Nombre y temática propia:** Estética retro-arcade con paleta de colores personalizada de alto contraste (cyan neón, púrpura eléctrico, ámbar solar, verde esmeralda, coral carmesí, azul zafiro, naranja fuego).
- **Mecánica fiel y fluida:**
  - Tablero clásico de 10 columnas × 20 filas.
  - Generador de bolsa aleatoria de 7 piezas (**7-bag randomizer**), evitando rachas repetitivas o sequías.
  - Rotaciones con sistema de compensación de pared (**Wall Kicks**) para rotar sin trabarse contra bordes o bloques adyacentes.
  - Proyección de caída (**Ghost Piece**) para máxima precisión al apuntar.
  - Retardo de fijación (**Lock Delay**) con reinicio al maniobrar.
  - Puntuación arcade con multiplicador por nivel y aumento progresivo de velocidad de caída.
  - Vista previa de la siguiente pieza en lienzo independiente.
  - Persistencia del récord en `localStorage` con captura de excepciones.
- **Prioridad Móvil (Diseñado para escanear y jugar desde un QR):**
  - Botones táctiles grandes y ergonómicos en pantalla para el pulgar izquierdo (movimiento lateral y caída suave) y pulgar derecho (rotación horaria/antihoraria y caída instantánea).
  - Sistema **DAS / ARR** (Delayed Auto Shift / Auto Repeat Rate) para desplazamiento continuo al mantener presionados los botones.
  - Prevención de zoom accidental, doble toque y scroll (`touch-action: none`, `user-select: none`, meta viewport seguro).
  - Vibración háptica táctil en dispositivos móviles compatibles (`navigator.vibrate`).
- **Renderizado de Alta Definición:**
  - Escalado adaptativo según `window.devicePixelRatio` para evitar pixelado en pantallas Retina y pantallas móviles modernas.
  - Bucle de animación optimizado con `requestAnimationFrame` y tiempo delta.
  - Peso total inferior a **35 KB**.

---

## Estructura del Proyecto

```text
bloques/
├── index.html   # Estructura semántica, metadatos móviles y canvas
├── style.css    # Diseño responsive, estética arcade y bloqueo de gestos
├── game.js      # Lógica de juego, matrices, colisiones, render y entrada
└── README.md    # Documentación de uso y despliegue
```

---

## Cómo Probar en Local

Al ser un sitio web 100% estático sin build step, tienes varias opciones:

### Opción 1: Abrir directamente en el navegador
Haz doble clic sobre el archivo `index.html` o arrástralo a cualquier navegador web (Chrome, Edge, Safari, Firefox).

### Opción 2: Servidor local ligero (Ideal para probar desde el celular en la misma red Wi-Fi)
Puedes iniciar un servidor web en la carpeta del proyecto:

**Con Python:**
```bash
python -m http.server 8080
```

**Con Node.js (npx):**
```bash
npx serve .
```

Luego abre en tu navegador `http://localhost:8080` (o usa la IP local de tu computadora en el celular para escanear el código QR).

---

## Controles

| Acción | Teclado (Escritorio) | Control Táctil (Móvil) |
| :--- | :--- | :--- |
| Mover a la izquierda | Flecha Izquierda / `A` | Botón `◀` (Mantener para deslizar) |
| Mover a la derecha | Flecha Derecha / `D` | Botón `▶` (Mantener para deslizar) |
| Rotar horario | Flecha Arriba / `W` | Botón `↻ ROTAR` |
| Rotar antihorario | `Z` / `Q` | Botón `↺` |
| Caída suave | Flecha Abajo / `S` | Botón `▼` (Mantener) |
| Caída instantánea | Barra Espaciadora (`Espacio`) | Botón `⚡ CAÍDA` |
| Pausar / Continuar | Tecla `P` / `Escape` | Botón de pausa en barra superior |
| Reiniciar | Tecla `R` | Botón de reinicio en barra superior |

---

## Despliegue en Producción

El proyecto está listo para desplegarse de inmediato sin comandos de compilación.

### Despliegue en Cloudflare Pages
1. Ve al panel de Cloudflare Pages > **Create a project**.
2. Conecta tu repositorio de GitHub o arrastra la carpeta `bloques`.
3. Deja los campos **Build command** y **Output directory** vacíos (o raíz `.`).
4. Haz clic en **Deploy**.

### Despliegue en Vercel
1. Con la CLI de Vercel instalada, ejecuta:
   ```bash
   vercel
   ```
2. O conecta tu repositorio en vercel.com seleccionando *Other / Static HTML*.

### Despliegue en GitHub Pages
1. Sube los archivos a la rama principal (`main`) de tu repositorio en GitHub.
2. Ve a **Settings** > **Pages**.
3. En **Source**, selecciona `Deploy from a branch`, rama `main`, carpeta `/ (root)`.
4. Guarda y en segundos tendrás tu URL pública lista para generar el código QR.
