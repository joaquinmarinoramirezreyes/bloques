# Bitácora de Mejoras y Calidad - Corredor

## Fecha: 14 de Octubre de 2026
## Versión: v2.0 (Estándar de Calidad Aplicado)

### 1. Sensación de Impacto ("Juice")
- **Física de Animación Squash & Stretch**: Deformación proporcional en anticipación de salto (`scaleX: 0.8, scaleY: 1.25`), aterrizaje suave (`scaleX: 1.25, scaleY: 0.75`), y deslizamiento aerodinámico (`scaleX: 1.35, scaleY: 0.65`).
- **Screen Shake y Hitstop**: Integración con `ArcadeJuice.shake(12, 0.4)` y `ArcadeJuice.hitstop(60)` en impactos, y vibración háptica proporcional (`ArcadeJuice.vibrate`).
- **Textos Flotantes**: Object pooling reutilizable para anuncios de combo ("¡COMBO x3!"), recolección de monedas ("+2🪙"), y cumplimiento de misiones ("¡MISIÓN CUMPLIDA! +50🪙").
- **Estela en Pies y Partículas**: Emisión continua de chispas en el suelo vinculadas al aura equipada y partículas de fricción durante el deslizamiento.

### 2. Estética Visual y 4 Biomas Evolutivos
- **Distrito Neón (0 - 750m)**: Paleta cian e índigo (`#00f0ff`), rascacielos cibernéticos, tren Maglev de fondo y barreras de plasma.
- **Cañón de Silicio (750 - 1500m)**: Paleta ámbar y cobre oxidado (`#ffaa00`), formaciones monolíticas de silicio y tonalidades cálidas.
- **Cripta Cuántica (1500 - 2250m)**: Paleta magenta y violeta abisal (`#b388ff`), conductos profundos y energía resonante.
- **Órbita Estelar (> 2250m)**: Paleta verde esmeralda y oro estelar (`#00e676`), astros lejanos y atmósfera cósmica.
- **Parallax de 4 Capas Continuo**: Espacio-mundo continuo sin cortes bruscos ni reseteos visibles.

### 3. Tienda de Mejoras y Personalización
- **4 Personajes / Skins**:
  1. *Neo* (Cian clásico) - Desbloqueado por defecto.
  2. *Volt* (Amarillo de alta tensión) - 150 monedas.
  3. *Specter* (Carmesí sigiloso) - 300 monedas.
  4. *Valkyrie* (Esmeralda cuántica de élite) - 500 monedas.
- **4 Auras / Estelas**:
  1. *Estela Clásica* (Cian).
  2. *Estela de Plasma* (Fuego magenta).
  3. *Aura Cuántica* (Anillo orbital resonante).
  4. *Manto Propulsor* (Partículas doradas).
- **3 Mejoras Funcionales Permanentes (Hasta Nivel 3)**:
  1. *Imán Potenciado*: +30% de radio y duración por nivel.
  2. *Escudo Robusto*: Permite recargar el escudo tras 45s sin recibir daño.
  3. *Multiplicador de Monedas*: Añade +1 moneda base por cada recogida.

### 4. Misiones Dinámicas y Eventos Aleatorios
- **Misiones en Carrera**: Sistema reactivo con avisos en el HUD ("Esquiva 4 obstáculos por los pelos", "Recoge 25 monedas", "Ejecuta 5 volteretas 360°") que otorgan +50 monedas y multiplicador de combo al completarse.
- **3 Eventos Aleatorios en Carrera**:
  1. *Zona de Baja Gravedad* (🪐): Reduce la gravedad un 45%, permitiendo saltos parabólicos elevados y flotantes.
  2. *Tormenta de Chispas* (⚡): Lluvia estelar con orbes dorados que suman monedas extra al contacto.
  3. *Tramo Hipervelocidad* (🚀): Aceleración extrema instantánea con líneas de velocidad doradas y puntos dobles.

### 5. Sensación de Velocidad y Progresión
- **Zoom de Cámara Adaptativo**: La cámara se aleja suavemente (escala de 1.0 a 0.92) al superar velocidades elevadas para expandir el campo de visión.
- **Líneas de Velocidad Dinámicas**: Densidad y opacidad escalables con la velocidad actual.
- **Música Generativa Adaptativa**: El tempo y la cadencia de notas sintetizadas se aceleran proporcionalmente con la velocidad del corredor.
- **8 Logros Integrados**:
  1. *Primer Despegue*
  2. *Acróbata Urbano*
  3. *Bajo el Radar*
  4. *Coleccionista de Créditos*
  5. *Racha Épica*
  6. *Explorador del Cañón*
  7. *Velocidad Terminal*
  8. *Cliente VIP*
- **Persistencia Versionada**: Clave `"corredor:v2"` con migración automática de `"corredor:v1:best_distance"`.
- **Diagnóstico**: Compatible con `?debug=1`, monitor de FPS y frame time ms.
