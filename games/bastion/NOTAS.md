# Documentación Técnica: Bastión (Fases 1 y 2)

## 1. Resumen Ejecutivo
**Bastión** es un juego de defensa de torres (*Tower Defense*) táctico de alta producción, desarrollado con Canvas 2D nativo sin librerías externas ni dependencias pesadas. Cuenta con una ambientación cuántica-arcana, mapas con relieve pseudo-3D, 6 torres completamente personalizables con 3 niveles y 2 ramas de especialización, y 6 tipos de enemigos más un jefe con auras de apoyo y control.

Además, en esta iteración se completó la refactorización y saneamiento de los controles de pausa e interfaces en **Lumen** y **Cargas**, eliminando elementos obsoletos y garantizando coherencia en la interacción táctil y de teclado en toda la sala arcade.

---

## 2. Novedades y Arquitectura de la Fase 2

### 2.1 6 Mapas Estratégicos con Identidad y Variación de Rutas (`data/mapas.js`)
Cada mapa está compuesto por una rejilla lógica de $16 \times 11$ celdas ($576 \times 396$ px) con temas visuales y mecánicas de ruta diferenciadas:
1. **Valle Prístino:** Sendero serpenteante básico, ideal para aprender la colocación de torres en curvas cerradas.
2. **Desfiladero de Obsidiana:** Cuenta con **2 entradas bifurcadas** que convergen hacia un único desfiladero central antes de alcanzar el núcleo.
3. **Ruinas del Nexo:** Terreno amplio con peñascos que canalizan a los invasores en un bucle perimetral.
4. **Cripta de Cristal:** Estructura de alas simétricas dobles que exige defensas balanceadas en ambos flancos.
5. **Bastión Hundido:** Terreno pantanoso y angosto con espacio construible reducido.
6. **Núcleo del Cataclismo:** Mapa final con **3 portales de entrada convergentes** hacia el santuario central, requiriendo defensas multizona.

### 2.2 Sistema Completo de 6 Torres (`data/torres.js`)
Cada torre posee 3 niveles base de mejora lineal y, al alcanzar el Nivel 3, desbloquea **2 ramas de especialización únicas (Nivel 4)**:

1. **Centinela Balístico (`balistico`):**
   - *Rol:* Disparo continuo y daño mono-objetivo fiable.
   - *Rama A:* **Ametralladora Gatling** — Cadencia masiva (4.2 disp/s) para aniquilar enemigos rápidos.
   - *Rama B:* **Cañón Doble Pesado** — Proyectiles dobles de alto calibre diseñados para romper objetivos resistentes.

2. **Cañón de Choque (`mortero`):**
   - *Rol:* Proyectiles parabólicos con daño de área de impacto.
   - *Rama A:* **Obús Sísmico** — Radio de explosión expansivo con aturdimiento temporal.
   - *Rama B:* **Batería de Fragmentación** — Al estallar libera micromunición secundaria en racimo.

3. **Arco Voltaico (`rayo`):**
   - *Rol:* Rayo perforante que atraviesa filas de enemigos y desestima el 50% de la armadura.
   - *Rama A:* **Cañón de Iones** — Rayo continuo que perfora ilimitadamente y derrite blindajes.
   - *Rama B:* **Bobina de Plasma** — Descarga electrostática en cadena entre hasta 5 objetivos contiguos.

4. **Crioemisor (`crio`):**
   - *Rol:* Hielo ralentizador que reduce la velocidad enemiga.
   - *Rama A:* **Ventisca Absoluta** — Congelación profunda del 65% de velocidad y aura helada en radio extendido.
   - *Rama B:* **Fragmentador Glacial** — El hielo quebradizo hace que los enemigos reciban un +25% de daño adicional de otras torres.

5. **Obelisco de Resonancia (`obelisco`):**
   - *Rol:* Estructura de apoyo que emite un pulso armónico potenciando a las torres vecinas (daño, rango, cadencia).
   - *Rama A:* **Monolito de Guerra** — Amplifica drásticamente el daño (+35%) y el alcance (+20%) de torres adyacentes.
   - *Rama B:* **Transmutador Cuántico** — Bonificación del +25% de oro generado por cada muerte dentro del radio de influencia.

6. **Aguja Cuántica (`francotirador`):**
   - *Rol:* Alcance global o semi-global con daño letal a objetivos prioritarios.
   - *Rama A:* **Rifle de Antimateria** — Daño crítico masivo que elimina objetivos de élite de un solo disparo.
   - *Rama B:* **Tirador de Supresión** — Disparo de alta precisión con aturdimiento e interrupción garantizada de habilidades enemigas.

### 2.3 Enemigos con Habilidades Únicas y Jefe Colosal (`data/enemigos.js`)
1. **Reptante de Ceniza (`reptante`):** Enemigo estándar equilibrado.
2. **Ácrata Veloz (`veloz`):** Gran velocidad de desplazamiento, pone a prueba los reflejos y el control de masa.
3. **Coloso Blindado (`blindado`):** Posee un 50% de resistencia a daño físico directo; susceptible al daño de rayo y crio.
4. **Espectro Etéreo (`etero`):** Unidad voladora (`flying: true`) que prescinde del camino trazado y avanza en línea recta hacia el núcleo.
5. **Parasitoide Regenerador (`regenerador`):** Autoregeneración activa de +8 HP por segundo si no es rematado con rapidez.
6. **Hidra Divisora (`divisor`):** Al perecer, se divide biológicamente en 2 **Crías Mitóticas** más veloces.
7. **Jefe: Coloso del Abismo (`jefe_coloso`):**
   - Salud masiva (1800 HP).
   - **Aura Curativa:** Emite una onda cada 4 segundos que regenera salud a los invasores cercanos.
   - **Onda Sísmica:** Cada 6.5 segundos golpea el suelo y aturde a las torres circundantes por 2.5 segundos, desactivando temporalmente sus disparos.

### 2.4 Motor Gráfico Pseudo-3D
Se rediseñó el renderizado visual con técnicas de iluminación pseudo-3D isométrica y sombras dinámicas:
- **Pedestales de Torres:** Bases circulares y octogonales con bisel superior iluminado, gradientes metálicos cilíndricos en el fuste y sombras de contacto proyectadas en el suelo.
- **Relieve de Peñascos y Terreno:** Obstáculos con caras iluminadas cenitalmente y caras laterales sombreadas en gradiente, simulando volumen tridimensional.
- **Camino Hundido:** Adoquines con bisel de sombra interna superior/izquierda que dan la sensación de estar por debajo del nivel de las plataformas construibles.
- **Núcleo Cuántico:** Estructura flotante que oscila suavemente en el eje vertical mediante funciones seno, proyectando una sombra elíptica cuyo tamaño pulsa en concordancia con la altura.
- **Enemigos:** Cuerpos esféricos con sombreado volumétrico radial, puntos focales de brillo especular (*specular highlights*) y sombras elípticas de contacto continuo.

---

## 3. Mejoras en la Experiencia de Usuario: Lumen y Cargas

### 3.1 Lumen (`games/lumen/`)
- **Control de Pausa Completo:**
  - Botón táctil dedicado `#btn-pause-header` en la cabecera del juego.
  - Atajos de teclado universales: tecla `P` y tecla `Escape`.
  - El bucle principal congela la física, temporizadores y movimientos de entidades mientras mantiene el refresco de canvas.
  - Menú de opciones y pausa con botones funcionales: Reanudar, Reiniciar nivel, Selector de nivel y Logros.
- **Limpieza de UI:**
  - Se eliminaron botones y ranuras muertas pertenecientes a la versión anterior (chispa y destello) que generaban confusión tras la adaptación inspirada en Pac-Man.

### 3.2 Cargas (`games/cargas/`)
- **Control de Pausa Completo:**
  - Botón de pausa `#btn-pause-header` conectado al estado `PLAYING` $\leftrightarrow$ `PAUSED`.
  - Atajo de teclado en `keydown` para `P` y `Escape`.
- **Limpieza y Botón Condicional de Detonación:**
  - El botón táctil `#btn-action-detonate` permanece oculto por defecto y solo se muestra dinámicamente si el jugador recoge el potenciador de control remoto (`hasRemote`), evitando clics inútiles.

---

## 4. Batería de Pruebas y Verificación

### 4.1 Pruebas de Unidad del Motor (`scripts/test_bastion_phase1.js`)
- **40/40 pruebas superadas:** Validación de rejilla 16x11, economía, colocación, venta con reembolso del 70%, movimiento por waypoints, detección balística y condiciones de victoria/derrota.

### 4.2 Pruebas de Expansión Fase 2 (`scripts/test_bastion_phase2.js`)
- **71/71 pruebas superadas:**
  - Validación estructural y métricas de los 6 mapas (rutas dobles y triples).
  - 6 torres con 3 niveles y 2 ramas de especialización cada una.
  - Resistencia de armadura física, vuelo en línea recta de etéreos y autoregeneración.
  - Mitosis de la hidra divisora en 2 crías.
  - Auras de curación y onda sísmica de aturdimiento del Jefe Coloso.
  - Efectos multiplicativos del Obelisco de Resonancia sobre torres contiguas.
  - Progresión de 20 oleadas con aparición garantizada del jefe en oleada 10.

### 4.3 Verificación de Humo Global (`npm run smoke`)
- Verificación automatizada con Puppeteer / Chromium headless sobre los **16 juegos del catálogo**:
  - 0 errores fatales ni excepciones no controladas.
  - Renderizado activo en Canvas 2D con fotogramas continuos vía `requestAnimationFrame`.

---

## 5. Novedades y Arquitectura de la Fase 3: Metaprogreso, Reliquias y Pseudo-3D Avanzado

### 5.1 Sistema de Metaprogreso Permanente (`data/mejoras.js`)
- **Moneda Persistente:** Esquirlas Arcanas (*Shards*), obtenidas al completar oleadas y ganar partidas con multiplicador según dificultad elegida.
- **Árbol de Talentos:** Gestor `MetaManager` integrado con `ArcadeStorage` (`bastion:meta:v1`) que ofrece 6 talentos permanentes con 5 rangos cada uno:
  1. *Núcleo Blindado:* +1 a +5 vidas base del bastión.
  2. *Bóveda de Reserva:* +25 a +125 oro inicial en cada partida.
  3. *Lentes Focalizadas:* +3% a +15% de alcance para todas las torres.
  4. *Cargas Sobrealimentadas:* +4% a +20% de daño base general.
  5. *Ingeniería Modular:* 3% a 15% de descuento en el costo de colocación de torres.
  6. *Resonancia de Esquirlas:* +10% a +50% de esquirlas ganadas en partidas.
- **Interfaz Interactiva:** Modal `#modal-meta` accesible desde la barra superior con medidores de progreso, coste en esquirlas y guardado automático con migración segura.

### 5.2 Reliquias y Artefactos Arcanos (`data/reliquias.js`)
- En las oleadas 5 y 15 se despliega un selector estilo Roguelike (`#modal-relics`) con 3 cartas aleatorias de un repertorio de 10 reliquias:
  - *Lente Cuántica:* +15% alcance a todas las torres.
  - *Fisión Acelerada:* +20% cadencia de disparo.
  - *Pólvora Inestable:* +30% radio de explosión a daño de área.
  - *Cero Absoluto:* Duplica duración de efectos de congelación y ralentización.
  - *Transmutador Áurico:* +2 oro extra por cada baja enemiga.
  - *Escudo de Singularidad:* Otorga 3 cargas de escudo que absorben impactos al núcleo sin restar vidas.
  - *Bobina de Tesla Nexo:* Descarga eléctrica cada 9s desde el núcleo hacia el enemigo más cercano.
  - *Aleación Antimateria:* Todas las torres ignoran un 25% adicional de armadura física.
  - *Banco de Interés:* Otorga un 10% de interés del oro ahorrado al finalizar cada oleada (hasta 60 de oro).
  - *Sobrecarga del Obelisco:* Duplica el radio de aura de los Obeliscos de Resonancia.

### 5.3 Selector de Dificultades y Mutadores (`#maps-modal`)
- **Dificultades:** Normal (x1.0), Heroico (x1.5 esquirlas, +30% HP enemigo), Pesadilla (x2.0 esquirlas, +65% HP enemigo).
- **Mutadores Opcionales:**
  - *Invasión Acorazada:* +20% armadura base a todos los enemigos (+25% esquirlas).
  - *Marcha Feroz:* +25% velocidad de movimiento a todas las criaturas (+25% esquirlas).
  - *Presupuesto Austero:* -25% de oro inicial para los defensores (+20% esquirlas).

### 5.4 Máximo Pulido Gráfico Pseudo-3D y Efectos Visuales
- **Balística Parabólica 3D para Morteros:**
  - Los proyectiles de artillería describen una parábola física real con elevación $Z$, tamaño escalado y estela de combustión.
  - Proyección de sombra en el suelo (`groundX`, `groundY`) que se encoge conforme el proyectil alcanza el cenit y se expande en el punto de impacto.
- **Núcleo Bastión Pseudo-3D:**
  - Cristal octaédrico central levitante con iluminación especular facetada superior.
  - Doble anillo cuántico orbital giroscópico con inclinaciones opuestas (+32° y -32°) y nodos de luz rotando a velocidades diferenciales.
  - Sombra suave en suelo que reacciona a la oscilación vertical en tiempo real.
- **Portales de Invasión con Vórtice 3D:**
  - Discos de acreción animados con elipses contrarrotatorias e interior abisal en cada punto de entrada de la cuadrícula.
- **Juice y Feedback de Combate:**
  - Sacudida de pantalla (`screenShake`) con amortiguación suave al recibir impactos en el núcleo o detonaciones críticas.
  - Destello de pantalla (`screenFlash`) en avisos de peligro o activación de escudos.
  - Números de daño flotantes con colores codificados por tipo de elemento: amarillo (físico), cian (eléctrico/energía), azul cielo (hielo), naranja (fuego) y dorado (crítico).

### 5.5 Motor de Audio Procedural Nativo (Web Audio API)
- Síntesis de sonido sin dependencias externas:
  - Disparos de cañón balístico, mortero y láser continuo.
  - Explosiones con ruido blanco filtrado paso bajo y envolvente percusiva.
  - Descargas de bobina tesla y pulsos sónicos del jefe coloso.
  - Efectos de interfaz: compra, venta, mejora, alarma de núcleo y fanfarrias de victoria/derrota.

### 5.6 Estadísticas Detalladas de Partida (`#victory-modal`)
- Resumen completo al finalizar o perder:
  - Oleadas resistidas con rango de 1 a 3 estrellas.
  - Daño total infligido y enemigos aniquilados.
  - Oro total acumulado y esquirlas cosechadas.
  - Torre MVP con mayor cantidad de daño acumulado durante la partida.


---

## 6. Novedades y Arquitectura de la Fase 4: Mapas Gigantes 20x13, Terrenos Tácticos, Habilidades Activas y Campaña

### 6.1 Expansión de Mapas a 20x13 ($720 \times 468$ px)
- **Escala de Campo Extendida:**
  - Se incrementaron las dimensiones de los 6 mapas de $16 \times 11$ a **$20 \times 13$** casillas lógicas.
  - Con un tamaño de celda de 36 px, la resolución nativa pasa a **$720 \times 468$ px**, ofreciendo un campo de batalla 48% más extenso.
  - Se adaptó `ArcadeCanvas.fit(canvas, boardWrapper, 20, 13, 8)` y `getGameCoords(e)` para ajustar dinámicamente la escala DPR y la matriz de proyección táctil.

### 6.2 Terrenos Tácticos Especiales
Se incorporaron 4 nuevas tipologías de casilla con beneficios estratégicos directos:
1. **Plataforma Elevada (Tipo 5 / *Highground*):**
   - Dais sobreelevado pseudo-3D con biseles cian.
   - Otorga un **+25% de alcance efectivo** a cualquier torre apostada en su superficie.
2. **Geoda Elemental (Tipo 6):**
   - Pedestal rocoso con racimo de cristales violetas facetados.
   - Amplifica en un **+20% el daño base** de la torre construida sobre ella.
3. **Veta de Cristal Aúrico (Tipo 7):**
   - Afloramiento rocoso con vetas de oro en zigzag.
   - Si está ocupada por una torre al finalizar la oleada, produce **+15 de oro extra** de dividendos económicos.
4. **Escombros Cuánticos (Tipo 8):**
   - Bloques derruidos con pilares caídos que obstruyen la construcción.
   - El jugador puede despejarlos por **40 de oro** tocando la casilla (`clearDebris(c, r)`), liberando el espacio como terreno construible estándar.

### 6.3 Habilidades Activas del Comandante (Commander Spells)
Barra inferior de habilidades `#skills-dock` con atajos rápidos de teclado y enfriamientos gráficos:
1. **Bombardeo Orbital (`orbital_strike`, Atajo [Q]):**
   - Inflige **450 de daño de fuego en área** en un radio de 2.2 casillas y deja un charco de napalm residual por 4s (55 dps). Enfriamiento: 40s.
   - Modo de apuntado dinámico con retícula holográfica animada y banner de cancelación `#targeting-banner` ([Esc]).
2. **Estasis Temporal (`time_freeze`, Atajo [W]):**
   - Congela instantáneamente a todas las criaturas enemigas en pantalla durante **4.5 segundos**. Enfriamiento: 55s.
3. **Sobrecarga Aurífera (`gold_surge`, Atajo [E]):**
   - Otorga **+120 de oro inmediato** e induce una sobrecarga cuántica temporal que acelera en un **+35% la cadencia de fuego** de todas las torres durante 8s. Enfriamiento: 45s.

### 6.4 Adelanto Táctico de Oleada (Early Call)
- El botón `#btn-start-wave` se transforma dinámicamente durante el combate activo en `"⏩ ADELANTAR (+XX 🪙)"`.
- Adelantar una oleada premia la audacia defensiva otorgando una bonificación de oro proporcional al número de oleada ($20 + 4 \times \text{oleada}$) y encolando de inmediato la siguiente horda de asedio.

### 6.5 Radar Táctico / Scanner de Próxima Oleada (Wave Intel)
- Elemento `#hud-wave-intel` en la cabecera del HUD que decodifica la composición de la siguiente oleada antes de que inicie (`👾x8 ⚡x4 🛡️x2`).
- Detecta y emite alerta visual roja destacada si la siguiente oleada contiene un Jefe Colosal (`⚠️ W10: 💀x1`).

### 6.6 Campaña Persistente y Sistema de 3 Estrellas (`data/campana.js`)
- Gestor `CampaignManager` con almacenamiento versionado bajo la clave `bastion:campaign:v1`:
  - Desbloqueo progresivo: El Sector 1 está desbloqueado; los Sectores 2 al 6 requieren ganar el sector anterior.
  - Sistema de Estrellas por rendimiento:
    - **★★★ (3 Estrellas):** Victoria impecable (el núcleo no recibió ningún daño).
    - **★★☆ (2 Estrellas):** Victoria sólida ($\ge 50\%$ de vidas restantes).
    - **★☆☆ (1 Estrella):** Victoria ajustada ($< 50\%$ de vidas restantes).
  - Selector de mapas `#maps-modal` actualizado con visualización de estrellas, mejores puntuaciones históricas y estados bloqueados con candado visual.

### 6.7 Batería de Pruebas de la Fase 4 (`scripts/test_bastion_phase4.js`)
- **33/33 pruebas superadas:**
  - Validación geométrica de los 6 mapas $20 \times 13$.
  - Validación de bonificaciones de los 4 terrenos tácticos especiales.
  - Validación de las 3 habilidades activas del comandante y decaimiento de enfriamientos.
  - Validación del adelanto táctico y bonificaciones de oro.
  - Radar táctico con advertencia de jefe.
  - Gestor de campaña, desbloqueo secuencial y cálculo de estrellas.

---

## 7. Novedades y Arquitectura de la Fase 5: Modo Sin Fin, Experiencia Móvil de Primer Nivel, Depuración y Balance

### 7.1 Modo Sin Fin (*Endless Mode*)
- **Activación y Selector de Modo:**
  - Pestañas `#mode-tabs` en el selector de mapas (`#btn-mode-campaign` vs `#btn-mode-endless`).
  - En Modo Sin Fin, `maxWaves = Infinity` y el jugador puede elegir cualquier mapa para medir su resistencia extrema.
- **Escalado Infinito Dinámico:**
  - Para oleadas $w > 20$, la salud enemiga escala de forma exponencial ($+12\%$ HP por oleada adicional) y la velocidad aumenta progresivamente.
  - Cada 5 oleadas ($w = 25, 30, 35, \dots$) se genera un asedio de jefes con múltiples Colosos del Abismo escoltados por hordas de apoyo.
  - Hitos de reliquias roguelike cada 10 oleadas para adaptar la estrategia a las amenazas crecientes.
- **Persistencia de Récord:**
  - Registro de la oleada más alta y máxima puntuación alcanzada almacenado de forma segura bajo la clave versionada `bastion:endless:v1`.
  - Banner en tiempo real `#endless-record-banner` visible en la selección de mapas reportando el récord histórico personal.

### 7.2 Experiencia Móvil de Primer Nivel (*Mobile-First*)
- **Navegación y Zoom Táctil de Cámara:**
  - Controles de zoom flotantes `#touch-zoom-controls` con botones de $\ge 44$ px (`btn-zoom-in`, `btn-zoom-reset`, `btn-zoom-out`).
  - Gesto táctil nativo de **pellizco para zoom** (*pinch-to-zoom*) con dos dedos sobre el canvas.
  - Gesto de **arrastre con un dedo** para desplazar la cámara suavemente por el campo de batalla cuando el zoom es superior a 1.0x.
  - Función de acotado de cámara `clampCamera()` que garantiza que el jugador nunca pueda perder de vista el mapa ni desbordar los límites del terreno.
  - Umbral de desplazamiento de 8 px para discriminar toques precisos de arrastres de cámara, evitando colocaciones involuntarias de torres.
- **Transformación Inversa de Coordenadas:**
  - `getGameCoords(e)` invierte matemáticamente la traslación y escala de la cámara, garantizando que el toque táctil o clic de ratón apunte con absoluta precisión a la celda subyacente.
- **Ergonomía Táctil:**
  - Botones táctiles, ranuras de construcción y paneles con dimensiones mínimas de 44 px respetando las pautas de accesibilidad táctil.
  - `touch-action: none` y `user-select: none` para evitar zooms no deseados del navegador, desplazamientos de página o selecciones accidentales.

### 7.3 Panel y Herramientas de Depuración (`?debug=1`)
- Activado automáticamente pasando el parámetro de consulta `?debug=1` en la URL.
- **Telemetría en Tiempo Real:**
  - Contador de FPS calculado por delta time.
  - Monitor de entidades activas: número de enemigos vivos, torres emplazadas, proyectiles en vuelo y partículas/efectos.
- **Controles Interactivos y Atajos de Teclado:**
  - `[+1000 🪙]` / Tecla `[G]`: Inyección inmediata de 1000 de oro.
  - `[+50 ❤️]` / Tecla `[L]`: Suma 50 vidas al núcleo y a la vida máxima.
  - `[⚡ Saltar W]` / Tecla `[N]`: Finaliza la oleada activa de inmediato.
  - `[💥 Nuke]` / Tecla `[K]`: Aniquila instantáneamente a todas las criaturas en pantalla con efecto visual y sacudida.
  - `[⏩ 5x]` / Tecla `[5]`: Conmuta la velocidad de simulación a 5x ultrarrápida.

### 7.4 Opciones de Reinicio de Progreso Permanente con Confirmación
- Botón `#btn-reset-campaign-data` en el modal de mapas para reiniciar todo el progreso de campaña, estrellas y récord sin fin tras confirmación explícita (`confirm(...)`).
- Botón `#btn-reset-meta-data` en el Templo del Nexo para reiniciar todas las mejoras de talentos, esquirlas y estadísticas.

### 7.5 Simulación Automatizada Headless y Verificación de Balance (`scripts/simulate_bastion.js`)
- Simulación completa de las 20 oleadas en los 6 sectores de la campaña con estrategia fija y 25 pasos por segundo ($dt = 0.04$ s).
- **Resultados de la Simulación:**
  - **Sector 1 (Valle Prístino):** 🏆 Victoria | 20/20 vidas (100%) | 873 bajas | 3 Estrellas Flawless.
  - **Sector 2 (Desfiladero de Obsidiana):** 🏆 Victoria | 20/20 vidas (100%) | 873 bajas | 3 Estrellas Flawless.
  - **Sector 3 (Ruinas del Nexo):** 🏆 Victoria | 20/20 vidas (100%) | 873 bajas | 3 Estrellas Flawless.
  - **Sector 4 (Cripta de Cristal):** 🏆 Victoria | 9/20 vidas (45%) | 862 bajas | 1 Estrella. Desafío bifurcado con presión real al núcleo.
  - **Sector 5 (Bastión Hundido):** 🏆 Victoria | 20/20 vidas (100%) | 873 bajas | 3 Estrellas Flawless.
  - **Sector 6 (Núcleo del Cataclismo):** 🏆 Victoria | 14/20 vidas (70%) | 867 bajas | 2 Estrellas. Tensión y peligro de triple portal convergente.
- **Diagnóstico de Balance:**
  - Ningún mapa es imposible (los 6 sectores son superables con buena estrategia).
  - Ningún mapa es trivial (los sectores avanzados ponen a prueba las defensas y reducen la salud del núcleo si no se coordinan las habilidades).

### 7.6 Batería de Pruebas de la Fase 5 (`scripts/test_bastion_phase5.js`)
- **16/16 pruebas superadas:**
  - Modo sin fin: escalado $w > 20$, jefes periódicos y radar táctico.
  - Persistencia segura del récord en `bastion:endless:v1`.
  - Acotado de cámara `clampCamera()` y límites de zoom $1.0\times$ a $2.5\times$.
  - Transformación inversa de coordenadas espaciales.
  - Métodos de depuración (`addDebugGold`, `addDebugLives`, `nukeAllEnemies`, `skipWaveDebug`).
  - Reinicio de progreso permanente (`resetProgress` y `reset`).
  - Estándares móviles táctiles y de safe-area.

---

## 8. Rediseño UX Móvil y Corrección de Bugs 5 y 6

### 8.1 Diagnóstico de Problemas Móviles
Mediante pruebas automatizadas con Puppeteer headless (`scripts/test_bastion_layout.js`) en resoluciones 360x640, 390x844, 412x915, 768x1024 y horizontal (844x390), se diagnosticaron y confirmaron los siguientes fallos:
1. **Solapamiento Crítico de Controles:**
   - Los botones de zoom flotantes (`#touch-zoom-controls`) tenían posición absoluta anclada a la esquina inferior derecha (`bottom: 16px; right: 16px`), colisionando directamente con `#btn-skill-surge`, `#btn-build-sniper` y `#btn-start-wave`.
2. **Desbordamientos del Viewport:**
   - En pantallas estrechas (360px), el encabezado y el HUD superior sobrepasaban el ancho visible, cortando los botones de sonido y pausa.
3. **Hueco Vertical y Casillas Pequeñas:**
   - La disposición anterior dejaba un vacío innecesario entre el HUD y el mapa, reduciendo la superficie táctil del mapa.
4. **Objetivos Táctiles por debajo de la norma:**
   - Varios botones interactivos medían menos de $44 \times 44$ px (por ejemplo `nav-btn` con 31 px, `icon-btn` con 38 px y `cancel-target-btn` con 26 px).
5. **Bug 5 (Juego congelado tras oleada 20):**
   - Al terminar la oleada 20, se activaba `this.victory = true;`, congelando `update(dt)` en la guarda `if (this.gameOver || this.victory || this.isPaused) return;`. No existía transición ni opción clara para reanudar el juego a partir de la oleada 21 en modo sin fin.
6. **Bug 6 (Temblor de pantalla atascado):**
   - El temporizador `shakeTimer` solo se reducía dentro de `update(dt)` cuando el juego no estaba en Game Over, pausa o victoria. Cualquier temblor disparado cerca del final o durante pausas quedaba con `shakeTimer > 0` indefinidamente. Adicionalmente, `buildWaveQueue()` ejecutaba `screenShake()` durante consultas de radar táctico, disparando sacudidas fantasma.

---

### 8.2 Arquitectura del Rediseño Móvil: Layout de Espacio Reservado
Se reestructuró la interfaz en una columna semántica con 3 zonas independientes mediante flexbox, `100dvh` y soporte de `env(safe-area-inset-*)`:

1. **Zona Superior (`.game-top-zone`):**
   - Elemento `<header>` con `flex-shrink: 0`, respetando `env(safe-area-inset-top)`.
   - Contiene la barra de navegación compacta y el HUD en el flujo natural del documento, eliminando el hueco vertical sobre el mapa.
   - En pantallas $\le 480$ px, el botón de regreso oculta el texto "ARCADE" para mostrar solo la flecha táctil $\ge 44 \times 44$ px, y el título ajusta su tamaño para evitar cualquier desbordamiento.
   - HUD superior ultra-compacto con los 6 indicadores (Vidas, Oro, Esquirlas, Oleada, Radar Táctico y Velocidad) adaptados para caber al 100% en pantallas desde 360 px sin desbordar.
   - El botón de radar táctil `#hud-wave-intel` abre el modal dedicado `#intel-modal` con desglose detallado de invasores.

2. **Zona Central del Mapa (`.board-wrapper`):**
   - Ocupa todo el alto sobrante (`flex: 1; min-height: 0;`).
   - El canvas se escala dinámicamente mediante `ArcadeCanvas.fit` maximizando la superficie visual táctil.
   - Controles de zoom flotantes `#touch-zoom-controls` reubicados en la esquina superior derecha del mapa (`top: 10px; right: 10px`), con desvanecimiento automático tras 3.5 segundos de inactividad (`.touch-zoom-controls.faded`).
   - Soporte táctil completo: pellizco para zoom de 2 dedos, arrastre de cámara con límites (`clampCamera()`), y doble toque rápido para restablecer la vista inicial 1.0x.
   - **Colocación Ergonómica en 2 Pasos:** Al seleccionar una torre y tocar una celda, se muestra una previsualización holográfica pulsante con radio de alcance sin gastar oro, junto a la píldora flotante `#placement-confirm-pill` para confirmar o cancelar la construcción. Si el usuario prefiere colocar de inmediato, puede activar la opción "Toque único" en el modal de pausa.
   - Desplazamiento automático de cámara hacia arriba si el usuario selecciona una torre situada en el tercio inferior del mapa al abrir el panel de inspección.

3. **Zona Inferior de Acción (`.action-dock`):**
   - Elemento `<footer>` con `flex-shrink: 0`, fondo opaco con desenfoque (`backdrop-filter`) y padding inferior que respeta `env(safe-area-inset-bottom)`.
   - Jerarquía clara:
     1. Habilidades del comandante (`.skills-dock`): 3 botones circulares de $48 \times 48$ px con iconos nítidos y máscaras de cooldown.
     2. Selector de torres (`.towers-selector-wrapper`): carrusel horizontal suave con indicadores de gradiente (`.scroll-indicator-fade`) a los lados para señalar la existencia de más torres fuera de vista.
     3. Botón principal `#btn-start-wave`: prominente, ancho completo y altura de 48 px.
     4. Panel de inspección (`.tower-inspector-sheet`): hoja deslizable inferior (*bottom sheet*) con tirador táctil y botones de acción con dimensiones $\ge 44 \times 44$ px.

---

### 8.3 Corrección del Bug 5: Continuación de Partida a Modo Sin Fin
- **Causa Raíz:** `this.victory = true;` detenía el bucle `update(dt)`. El botón `#btn-start-wave` quedaba bloqueado y el modal de victoria no ofrecía una vía para reanudar el asedio en la oleada 21.
- **Solución Implementada:**
  - Se incorporó el método `continueToEndless()` en `BastionGame`:
    ```javascript
    continueToEndless() {
      this.victory = false;
      this.isEndless = true;
      this.maxWaves = Infinity;
      this.waveActive = false;
      this.resetShake();
      const score = (this.stats.kills || 0) * 10 + (this.gold || 0) * 2 + (this.lives || 0) * 50;
      this.saveEndlessRecord(this.currentWave, score);
      return true;
    }
    ```
  - En el modal de victoria (`#victory-modal`), se reorganizaron las acciones en 3 opciones claras:
    1. `btn-victory-endless`: **♾️ CONTINUAR EN MODO SIN FIN** (inicia la oleada 21+ conservando intactas todas las torres emplazadas, mejoras y oro acumulado).
    2. `btn-victory-next`: **🗺️ SIGUIENTE MAPA** (avanza al siguiente sector desbloqueado).
    3. `btn-victory-maps`: **📋 MENÚ DE MAPAS** (abre la selección de escenarios).

---

### 8.4 Corrección del Bug 6: Temblor de Pantalla Centralizado y Sin Atascos
- **Causa Raíz:** Sacudidas invocadas con duraciones arbitrarias sin acotado, temporizador no decrementado durante pausas/victoria/derrota, y llamadas colaterales dentro de `buildWaveQueue()`.
- **Solución Implementada:**
  - Centralización de eventos permitidos mediante `CONFIG.SHAKE_EVENTS` (`core_damage`, `boss_death`, `orbital_strike`).
  - Acotado estricto de amplitud ($\le 4.5$ px) y duración ($\le 0.25$ s) mediante `CONFIG.MAX_SHAKE_AMPLITUDE` y `CONFIG.MAX_SHAKE_DURATION`.
  - Eliminación de todas las llamadas espurias de sacudida en `buildWaveQueue()` y eventos menores.
  - En `update(dt)`, forzado de reset inmediato a 0 cuando el juego esté pausado, en victoria o en derrota:
    ```javascript
    if (this.gameOver || this.victory || this.isPaused) {
      if (this.shakeTimer > 0) this.resetShake();
      return;
    }
    ```
  - Decaimiento cuadrático suave en `render()`: `this.shakeIntensity * (prog * prog)`, con corte brusco a 0 cuando el tiempo restante es inferior a 0.03 s o la intensidad cae por debajo de 0.05 px.
  - Listeners de `blur` y `visibilitychange` para resetear el temblor si el usuario cambia de pestaña.
  - Opción de alternancia en los ajustes del modal de pausa (`#setting-screen-shake`), con respeto automático a la preferencia del sistema `prefers-reduced-motion`.

---

### 8.5 Verificación y Resultados de Pruebas
1. **Pruebas Automatizadas de Lógica (`scripts/test_bastion_bugs.js`):**
   - ✅ Bug 5: Oleada 21 arranca correctamente con generación de enemigos, conservando torres y economía.
   - ✅ Bug 6: Clamping de sacudida verificado, decaimiento a 0 exacto comprobado y reseteo inmediato en GameOver, Pausa y Victoria.
2. **Pruebas Automatizadas de Layout (`scripts/test_bastion_layout.js`):**
   - ✅ Solapamientos detectados: **0** en las 5 resoluciones probadas (360x640, 390x844, 412x915, 768x1024, 844x390 landscape).
   - ✅ Scroll horizontal en el body: **0** (sin desbordamientos involuntarios).
   - ✅ Botones con tamaño táctil inferior a $44 \times 44$ px: **0 de 20**.
3. **Suite General de Humo (`scripts/smoke.js`):**
   - ✅ **16/16 juegos pasaron exitosamente** sin errores en consola, con canvas renderizado y bucle rAF activo.
