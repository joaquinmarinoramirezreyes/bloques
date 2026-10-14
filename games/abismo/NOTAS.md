# ABISMO - Arquitectura y Registro de Desarrollo

## 1. Visión y Concepto
- **Título**: Abismo
- **Género**: Roguelike de acción cenital (Top-down action roguelike) para sesiones de 8 a 15 minutos.
- **Identidad**: Original, temática de descenso a criptas arcanas subterráneas. Sin referencias a franquicias existentes.
- **Plataforma y Controles**: Móvil-primero (un pulgar para joystick virtual flotante, botón táctil de habilidad con recarga radial), compatible con teclado en escritorio (WASD / Flechas + Espacio).

---

## 2. Decisiones de Arquitectura y Rendimiento
1. **Bucle de Simulación de Alta Tasa con Delta Time**:
   - Pasos de física desacoplados con delta time controlado para estabilidad y prevención de túneles colisionales.
2. **Spatial Hash Grid (Cuadrícula Espacial)**:
   - Partición espacial 2D en cuadrícula con tamaño de celda optimizado (70-80 px) para resolver vecindades en $O(1)$.
   - Soporte para 150+ enemigos activos y 300+ proyectiles a 60 FPS sin ralentizaciones ni creación de colecciones dinámicas por frame.
3. **Object Pooling Estricto**:
   - Pools dedicados con pre-reserva para:
     - Proyectiles (`ProjectilePool`)
     - Enemigos (`EnemyPool`)
     - Partículas de impacto, humo y chispas (`ParticlePool`)
     - Textos y números de daño flotantes (`FloatingTextPool`)
   - Evita la recolección de basura (GC) en navegadores móviles durante combates intensos.
4. **Capa Estática en Canvas Offscreen Cacheado**:
   - Muros, losas de cripta, antorchas y runas pre-renderizadas en canvas fuera de pantalla por sala.
5. **Auto-Ataque Inteligente**:
   - El spatial hash consulta rápidamente los enemigos en radio de ataque.
   - El explorador apunta y dispara automáticamente al objetivo vivo más cercano sin requerir intervención manual del jugador.
6. **Guardado Versionado y Resiliente**:
   - Progresión permanente y guardado en curso con clave versionada (`abismo:v1`) en `localStorage`.

---

## 3. Estado de Fases de Entrega
- [x] **Fase 1: Personaje, movimiento con joystick, una sala, auto-ataque y spatial hash con enemigo Perseguidor.** (Completada y verificada)
  - Personaje "Peregrino Abisal" con movimiento omnidireccional normalizado y confinamiento contra muros de sala.
  - Auto-ataque automático al objetivo más cercano dentro de radio (`AUTO_ATTACK_RANGE = 260px`) usando `SpatialHash.getNearest()`.
  - Habilidad especial "Estallido Espectral" con recarga de 7.0s, radio de 160px, 65 de daño, knockback y screen shake.
  - Spatial Hash grid de alto rendimiento (`SPATIAL_CELL_SIZE = 75px`), capaz de procesar 200+ enemigos y 350+ proyectiles en < 60ms.
  - Enemigo "Necro-Sombra" (Perseguidor) con fuerza de separación anti-apelotonamiento y daño por contacto.
  - Sala inicial de cripta con render offscreen cacheado de baldosas de piedra, juntas, muros con relieve y antorchas.
  - Object pooling completo para proyectiles, enemigos, partículas y números de daño flotantes (cero garbage collection por frame).
  - 8/8 pruebas unitarias automatizadas superadas al 100% en Node.js (`test_abismo_fase1.js`).
- [x] **Fase 2: Generación procedural de salas (conexas), puertas que se cierran en combate y se abren al limpiar, mini-mapa, y 6 arquetipos de enemigos con IA.** (Completada y verificada)
  - **Generador de Mazmorra Conexa (`DungeonGenerator`)**:
    - Expansión por frontera con BFS que garantiza 100% de conectividad sin salas aisladas en 50+ semillas evaluadas.
    - Conexiones de puertas bidireccionales y recíprocas (Norte, Sur, Este, Oeste).
    - Asignación inteligente de salas especiales por distancia (Inicio, Combate, Tesoro, Descanso, Élite).
  - **Puertas Dinámicas, Físicas y Transiciones**:
    - **Mecánica de apertura**: Durante el combate en una sala, las puertas están selladas por una barrera mágica carmesí (`doorsLocked = true`) con candado `🔒`. Al derrotar todas las oleadas de enemigos de la sala, las puertas se abren automáticamente con un resplandor cyan etéreo, flechas direccionales animadas (`▲`, `▼`, `◄`, `►`) y el aviso en pantalla `¡SALA DESPEJADA! PUERTAS ABIERTAS`.
    - **Feedback en puertas selladas**: Si el jugador toca una puerta mientras aún hay monstruos vivos, el juego le da feedback inmediato con texto flotante carmesí (`¡PUERTA SELLADA! Elimina a los enemigos`), chispas mágicas y sonido de rebote.
    - **Corrección de colisión de umbral**: Se calibró el radio de detección (`reach = player.radius + 8`) para que coincida exactamente con la detención del jugador en la pared (`y = 46px` vs umbral `54px`), permitiendo activar la transición al instante con solo rozar la puerta abierta.
    - **Distancia de aparición segura**: Al entrar a una nueva sala, el explorador aparece a 84px de distancia segura con un breve tiempo de enfriamiento (`0.45s`), impidiendo bucles de rebote accidental entre salas.
  - **Mini-Mapa Integrado en HUD**:
    - Cuadrícula con niebla de guerra parcial (salas visitadas con código de color según tipo, adyacentes mapeadas, enlaces de puertas visibles y marcador cian pulsante del jugador).
  - **6 Arquetipos de Enemigos con IA Diferenciada**:
    - `perseguidor` (Necro-Sombra): persecución directa y separación espacial.
    - `corredor` (Bestia Ágil): detección, telegrafiado láser durante preparación (windup), carrera supersónica en línea recta (2.3x velocidad) y recuperación.
    - `tirador` (Vástago del Ojo): kiteo si el jugador se aproxima y disparo de proyectiles arcanos periódicos.
    - `invocador` (Clérigo del Vacío): huida y canalización de círculos mágicos para invocar espectros menores.
    - `explosivo` (Gargolita Inestable): carrera rápida, activación de mecha palpitante a < 48px y detonación en área con screen shake.
    - `escudado` (Guardián Criptal): escudo direccional frontal (+/- 68°) que absorbe 80% del daño; recibe 100% de daño al ser flanqueado o atacado por la espalda.
    - **Variantes Élite**: Escala 1.35x, corona dorada, aura ardiente y modificadores de atributos (Veloz, Titán, Vampírico).
  - **Corrección de Bug de Habilidad Especial**:
    - Los enemigos con HP <= 0 son desactivados inmediatamente en el pool, invocando `handleEnemyKilled`, eliminando por completo cualquier comportamiento de "zombie".
  - **Modelo Volumétrico Pseudo-3D / 2.5D del Explorador**:
    - Sombra dinámica en suelo que reacciona a la elevación Z.
    - Balanceo y elevación Z senoidal al caminar (`walkBobTimer`).
    - Torso cilíndrico con gradiente metálico y hombreras (pauldrons) flotantes articuladas.
    - Casco esférico con punto especular cenital y visor de hendidura con perspectiva curvilínea.
    - Cristal rúnico orbital 3D con ordenamiento de profundidad (pasa por detrás y por delante del cuerpo).
  - **Spawn Inmediato de Enemigos al Iniciar**:
    - Se configuraron oleadas de combate inmediatas en la sala de entrada (`startRoom`) para que al pulsar "Descender al abismo" aparezca de inmediato la Oleada 1 (con Perseguidores, Corredor y Tirador), bloqueando las puertas hasta purgarlas.
- [x] **Fase 3: Experiencia de combate, sistema de 3 mejoras aleatorias como datos, sinergias, botín y tienda del mercader.** (Completada y verificada)
  - **Experiencia y Curva de Nivel**:
    - Fórmula de escalado exponencial `XP_BASE * (nivel ^ XP_EXPONENT)` (`28 * level^1.35`).
    - Soporte para saltos de niveles múltiples con cola de recompensas `pendingLevelUps` para no perder ninguna subida de nivel.
    - Barra de XP animada en el HUD superior (`#hud-level-badge`, `#hud-xp-text`, `#hud-xp-fill`).
  - **Catálogo de Mejoras como Datos Puros (`data/mejoras.js`)**:
    - 14 mejoras base con rarezas ponderadas (`comun`: 60%, `rara`: 25%, `epica`: 12%, `legendaria`: 3%, `sinergia`: 8%), categorías y topes de nivel (`maxLevel`).
    - Gestor `UpgradeManager.getRandomSelection(player, 3)`: algoritmo de muestreo aleatorio ponderado sin reemplazo, garantizando exactamente 3 opciones únicas en cada subida de nivel y exclusión estricta de mejoras maximizadas.
    - Pausa automática del juego en el estado `LEVELUP` y renderizado de cartas interactivas (`#upgrade-cards-grid`) con bordes de rareza, icono, nivel actual y descripción.
  - **Sinergias Legendarias**:
    - `sinergia_rebote_perforacion` (Fragmentación Resonante): libera 2 esquirlas adicionales al perforar un enemigo (requiere Dardo Penetrante + Rebote Espectral).
    - `sinergia_salva_expansion` (Bombardeo Abisal): genera micro-explosiones en área al impactar los proyectiles (requiere Salva Múltiple + Expansión Espectral).
    - `sinergia_cadencia_critico` (Tempestad Fulgurante): proyecta rayos encadenados hacia objetivos cercanos al asestar golpes críticos (requiere Pulso Frenético + Crítico Ancestral).
    - `sinergia_vampirismo_fuerza` (Cosecha de Almas): otorga +25% de daño temporal y regenera 1 HP garantizado al eliminar enemigos (requiere Sed del Vacío + Fuerza Arcana).
  - **Sistema de Botín (Zero-Allocation LootPool)**:
    - Pre-asignación en `LootPool` de 250 elementos (`LootItem`) para orbes de experiencia arcana y monedas de oro.
    - Física con impulso inicial, disipación y atracción magnética acelerada (`LOOT_MAGNET_SPEED = 340`) al entrar en el radio `pickupRadius` del jugador.
  - **Bóveda de Tesoros y Mercader Umbrío (Tienda)**:
    - Bóvedas de tesoro con cofre ancestral interactivo por proximidad (`CHEST_INTERACT_RADIUS = 46px`): libera botín masivo y abre modal de reliquia bendita garantizada sin necesidad de botones extra.
    - Salas de tienda con 3 pedestales interactivos: poción curativa (30 oro), bendición ofensiva (45 oro) y reliquia arcana (65 oro). Verificación en tiempo real de fondos de oro, deducción, partículas y feedback sonoro/visual.
  - **10/10 pruebas unitarias y de integración superadas al 100% en Node.js** (`test_abismo_fase3.js`), sumando 28/28 pruebas totales superadas sin regresiones.
- [x] **Fase 4: Jefes de cripta cada 5 pisos con patrones visuales legibles, biomas diferenciados, personajes adicionales, estilos de armas, mapas expandidos y progresión de niveles.** (Completada y verificada)
  - **Mapas más grandes y Niveles Progresivos**:
    - Rejilla expandida a 5x5 (`DUNGEON_GRID_SIZE = 5`) con 10 salas por piso (`DUNGEON_ROOMS_COUNT = 10`), garantizando mayor exploración y variedad de rutas.
    - Portal de descenso abisal (`checkPortalCrossing`) que se materializa en el centro de la sala de salida o sala del jefe una vez despejada.
    - Transición de piso fluida con curación del 35% del HP máximo, regeneración procedural de una nueva cripta, contador en HUD (`PISO X`) y escalado de dificultad.
  - **3 Biomas Únicos con Paletas Dinámicas**:
    - `cripta_inferior` (Pisos 1 al 4): tonalidades frías de piedra antigua, cian y azul abisal.
    - `catacumbas_fuego` (Pisos 5 al 9): magma ardiente, muros carmesí volcánicos y runas ígneas.
    - `abismo_astral` (Piso 10+): vacío cósmico, tonos púrpuras profundos, muros obsidiana y runas fluorescentes.
  - **Jefes de Cripta cada 5 Pisos**:
    - Piso 5: *Señor del Abismo* (`jefe_cripta`, 450 HP base, 120 XP).
    - Piso 10: *Gólem del Núcleo* (`jefe_magma`, 750 HP base, 200 XP).
    - Barra de vida de jefe dedicada en el HUD superior (`#boss-hud-container`) con porcentaje y nombre.
    - Patrones de ataque legibles:
      - *Slam Terrestre Telegrafiado*: círculo rojo parpadeante con retícula de advertencia antes del impacto demoledor (daño de área 32, radio 120px).
      - *Ataque en Estrella (Starburst 360°)*: ráfaga radial de 10 proyectiles en todas direcciones.
      - *Fase 2 de Furia* (< 50% HP): resplandor carmesí, aumento de velocidad (1.35x), cadencia acelerada e invocación de esbirros de apoyo.
  - **3 Estilos de Armas Evolutivas**:
    - `proyectil` (Dardo Espectral): ráfagas direccionales automáticas de alta precisión y alcance.
    - `orbe` (Orbes Giratorios): esferas arcanas que orbitan constantemente al jugador (radio 72px) e infligen daño por contacto continuo a cualquier enemigo que intente acercarse.
    - `onda` (Onda de Vacío): pulso de expansión radial de 360° (radio 140px) cada 1.4s que inflige 38 de daño en área, repele enemigos y desintegra proyectiles hostiles en vuelo.
  - **3 Personajes Seleccionables con Estilos Propios**:
    - `peregrino` (Peregrino Abisal): equilibrado (100 HP, 185 vel, proyectiles arcanos y estallido espectral).
    - `hechicera` (Hechicera de Sangre): daño continuo y alta movilidad (80 HP, 195 vel, orbes celestiales giratorios y vórtice de sangre).
    - `centinela` (Centinela de Hierro): tanque resistente (150 HP, 160 vel, onda sísmica de choque y baluarte indestructible).
    - Selector táctil interactivo en el modal inicial (`#character-selector-grid`) con vista previa de estadísticas, descripción y colores característicos.
  - **8/8 pruebas automatizadas de Fase 4 superadas al 100% en Node.js** (`test_abismo_fase4.js`), acumulando 36/36 pruebas exitosas sin regresión en todo el proyecto.
- [x] **Fase 5: Meta-progresión permanente (Esencia arcana), guardado versionado con migración (`abismo:v1`), logros, pantalla de depuración (`?debug=1`), guardado de partida en curso (Autosave) y pulido audiovisual.** (Completada y verificada)
  - **Meta-Progresión y Altar del Abismo (`data/meta.js`)**:
    - Sistema de recompensa post-mortem: al perecer o completar un descenso se calcula la cosecha de esencia arcana según el piso alcanzado y las bajas logradas (`calculateRunEssence`).
    - Altar de mejoras permanentes accesible desde la pantalla inicial y tras morir (`#meta-modal`):
      - *Vitalidad Primordial*: +15 HP base por rango (hasta 5 rangos).
      - *Poder del Vacío*: +8% de daño general por rango (hasta 5 rangos).
      - *Paso Espectral*: +10 px/s de velocidad por rango (hasta 4 rangos).
      - *Atracción Magnética*: +25 px de radio de imán para orbes y oro (hasta 3 rangos).
      - *Tributo de Oro*: inicia cada descenso con +20 de oro por rango (hasta 4 rangos).
      - *Foco de Voluntad*: -8% de tiempo de recarga en habilidad especial (hasta 3 rangos).
      - *Resonancia de Esencia*: +15% de esencia ganada al morir (hasta 4 rangos).
    - Desbloqueo permanente de personajes con esencia acumulada (Hechicera por 120 esencia, Centinela por 200 esencia).
  - **Almacenamiento Versionado y Resiliencia (`AbismoStorage`)**:
    - Clave de guardado con versionado estricto `abismo:v1`.
    - Función de migración automática desde guardados antiguos / no versionados (`abismo_save` / v0).
    - Tolerancia total a corrupción: ante JSON malformado, valores truncados o tipos incorrectos, el motor rescata valores válidos e inicializa valores por defecto sin lanzar excepciones ni romper la ejecución del juego.
    - Opción de reseteo completo de datos con confirmación del usuario (`resetProgress`).
  - **Autosave de Partida en Curso**:
    - Persistencia automática de la partida en `abismo:active_run` ante cambios de pestaña (`visibilitychange`) o cierre del navegador (`beforeunload`).
    - Botón "Continuar Partida" (`#btn-continue-run`) en el modal de inicio cuando existe una partida guardada activa, restaurando piso, salud, oro, nivel, estadísticas, mejoras adquiridas y sala actual.
    - Limpieza automática de la partida guardada al morir o reiniciar voluntariamente.
  - **Sistema de Logros y Récords**:
    - Modal de Logros (`#achievements-modal`) con estadísticas acumuladas (piso récord, partidas jugadas, bajas totales, jefes eliminados y oro máximo).
    - 7 logros con condiciones verificables: *Primer Descenso*, *Cazador de Sombras*, *Terror de la Cripta*, *Acumulador de Esencia*, *Trinidad Abisal*, *Peregrino Legendario* y *Cofres Llenos*.
  - **Pantalla de Depuración Oculta (`?debug=1`)**:
    - Activación mediante el parámetro de URL `?debug=1`.
    - Muestra overlay flotante con FPS en tiempo real, contador de entidades activas (enemigos, proyectiles, partículas, textos, botín) y sala actual.
    - Botones de acción rápida: `+100 Oro`, `+100 Esencia`, `+1 Nivel`, `Modo Dios (Invulnerabilidad)`, `Limpiar Sala` y `Saltar Piso`.
  - **Pulido Audiovisual y de Impacto**:
    - *Modelos Volumétricos Pseudo-3D para Villanos y Jefes*:
      - Sombra elíptica en suelo con escala Z reactiva a la elevación de paso o flotación.
      - Elevación Z senoidal individualizada con `bobTimer`.
      - Gradientes de iluminación 3D en cuerpos, quitinas y corazas (luz direccional cenital izquierda con puntos especulares, sombras de oclusión y biseles).
      - Ojos y visores proyectados con perspectiva cilíndrica y esférica según ángulo de encarado `facingAngle`.
      - Anillos rúnicos cardánicos orbitales 3D en el Tirador, báculos y círculos concéntricos en el Invocador, espinas volcánicas y grietas de magma en el Explosivo, y monolitos de basalto orbitando a los Jefes con ordenamiento de profundidad.
    - *Ampliación del Elenco a 5 Exploradores*:
      - `peregrino` (Peregrino Abisal): equilibrado con dardos espectrales.
      - `hechicera` (Hechicera de Sangre): orbes celestiales giratorios y robo de vida.
      - `centinela` (Centinela de Hierro): coloso acorazado con onda sísmica.
      - `sombra` (Acechador Umbrío): asesino ágil con +25% crítico base y navajas del vacío.
      - `piromante` (Inquisidor Ígneo): maestro de ondas de fuego en área (+25% radio) y cataclismo.
    - *Escalado de Dificultad Progresivo por Piso*:
      - Incremento de vida (+28% por piso con curva exponencial suave), daño (+14% por piso), velocidad (+3% por piso) y resistencia a retroceso conforme se avanza en la mazmorra.
    - *Hit-Stop (Micro-Pausa de Impacto)*: congelación de 50ms en la física durante impactos críticos, explosiones de habilidad y ataques terrestres del jefe para transmitir contundencia física.
    - *Iluminación Dinámica Suave (Vignette & Torches)*: gradiente radial cenital que ilumina al explorador y halo cálido parpadeante en antorchas de cripta.
    - *Audio Sintetizado Web Audio (`AbismoAudioHelper`)*: música ambiental procedural etérea generada por osciladores sinusoidales en acordes menores, campanadas armónicas para cofres y rugido sónico para jefes. Activación segura solo tras interacción del usuario para cumplir con las políticas de autoplay del navegador.
  - **Pruebas Automatizadas**:
    - 10/10 pruebas unitarias y de integración superadas en `test_abismo_fase5.js`.
    - 46/46 pruebas superadas al 100% en toda la suite de pruebas del juego (Fases 1 a 5).



