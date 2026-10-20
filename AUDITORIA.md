# Auditoría Visual y de Identidad - Sala Arcade

Este documento contiene el informe exhaustivo de la auditoría realizada sobre todo el proyecto Sala Arcade (menú principal, rutas de época `/80`, `/90`, `/00` y los 16 juegos del catálogo registrados en `games.json`).

El objetivo es eliminar el aspecto genérico y repetitivo (el combo omnipresente de fondo oscuro, cian, morado y brillo neón), reemplazar todos los emojis y símbolos Unicode por iconos vectoriales por código, otorgar a cada juego una identidad visual y tipográfica diferenciada (máximo 5 colores), y reemplazar textos y nombres grandilocuentes por nombres concretos, neutros y coherentes con la temática de cada título.

---

## 1. Resumen Ejecutivo y Estadísticas

- **Archivos auditados**: 128 archivos (.html, .css, .js, .json, .md).
- **Total de emojis y símbolos Unicode detectados**: **941** ocurrencias repartidas en código, plantillas y textos.
- **Caracteres únicos detectados**: 143 tipos distintos (ej. ✓, 🪙, ⚡, ★, ✅, 🏆, ✨, 🛡, ⚙, ⚔, 👑, 💥, ❌, 💎, 💀, ⚠, 🔒, 🎯, ▶, 🟣, ♥, 🔮, 💣, ❄, etc.).
- **Archivos CSS con paletas extraídas**: 18.
- **Archivos CSS con resplandores neón o degradados repetidos**: 18.
- **Textos con exclamaciones o tono hiperbólico**: 65 instancias.

### Distribución de Emojis por Módulo / Juego

| Módulo / Juego | Ocurrencias de Emojis/Símbolos | Estado Principal |
|---|:---:|---|
| `games/bastion` | **209** | Pendiente de reemplazo por SVG |
| `games/abismo` | **152** | Pendiente de reemplazo por SVG |
| `games/corredor` | **73** | Pendiente de reemplazo por SVG |
| `scripts` | **72** | Pendiente de reemplazo por SVG |
| `games/gotas` | **50** | Pendiente de reemplazo por SVG |
| `games/fronton` | **45** | Pendiente de reemplazo por SVG |
| `games/lumen` | **41** | Pendiente de reemplazo por SVG |
| `games/cristales` | **36** | Pendiente de reemplazo por SVG |
| `games/cargas` | **35** | Pendiente de reemplazo por SVG |
| `games/lanzaburbujas` | **34** | Pendiente de reemplazo por SVG |
| `games/campominado` | **31** | Pendiente de reemplazo por SVG |
| `README.md` | **24** | Pendiente de reemplazo por SVG |
| `games/derrape` | **17** | Pendiente de reemplazo por SVG |
| `games/rompemuros` | **14** | Pendiente de reemplazo por SVG |
| `test_cargas.js` | **9** | Pendiente de reemplazo por SVG |
| `games/defensaorbital` | **7** | Pendiente de reemplazo por SVG |
| `test_derrape_fase2.js` | **7** | Pendiente de reemplazo por SVG |
| `test_lanzaburbujas.js` | **7** | Pendiente de reemplazo por SVG |
| `test_lumen.js` | **7** | Pendiente de reemplazo por SVG |
| `games/sombras` | **6** | Pendiente de reemplazo por SVG |
| `test_cristales.js` | **6** | Pendiente de reemplazo por SVG |
| `test_gotas.js` | **6** | Pendiente de reemplazo por SVG |
| `test_campominado.js` | **5** | Pendiente de reemplazo por SVG |
| `test_defensaorbital_sim.js` | **5** | Pendiente de reemplazo por SVG |
| `games/bloques` | **4** | Pendiente de reemplazo por SVG |
| `games/snake` | **4** | Pendiente de reemplazo por SVG |
| `test_derrape_fase1.js` | **4** | Pendiente de reemplazo por SVG |
| `test_corredor.js` | **3** | Pendiente de reemplazo por SVG |
| `shared` | **2** | Pendiente de reemplazo por SVG |
| `test_abismo_fase1.js` | **2** | Pendiente de reemplazo por SVG |
| `test_abismo_fase2.js` | **2** | Pendiente de reemplazo por SVG |
| `test_abismo_fase3.js` | **2** | Pendiente de reemplazo por SVG |
| `test_abismo_fase4.js` | **2** | Pendiente de reemplazo por SVG |
| `test_abismo_fase5.js` | **2** | Pendiente de reemplazo por SVG |
| `test_abismo_mobile_map.js` | **2** | Pendiente de reemplazo por SVG |
| `test_defensaorbital_deluxe.js` | **2** | Pendiente de reemplazo por SVG |
| `test_defensaorbital_formacion.js` | **2** | Pendiente de reemplazo por SVG |
| `test_defensaorbital_picadas.js` | **2** | Pendiente de reemplazo por SVG |
| `test_derrape_fase3.js` | **2** | Pendiente de reemplazo por SVG |
| `test_derrape_fase4.js` | **2** | Pendiente de reemplazo por SVG |
| `test_eras_menu.js` | **2** | Pendiente de reemplazo por SVG |
| `index.html` | **1** | Pendiente de reemplazo por SVG |
| `test_fronton.js` | **1** | Pendiente de reemplazo por SVG |

---

## 2. Inventario Completo de Emojis y Símbolos Unicode

A continuación se detalla cada ocurrencia encontrada en el código base, especificando archivo, número de línea, carácter y su uso actual.

| Archivo | Línea | Carácter | Propósito / Uso | Fragmento de Código |
|---|:---:|:---:|---|---|
| `games/abismo/data/mejoras.js` | 23 | `⚔` | Decoración o icono | `icon: '⚔️',` |
| `games/abismo/data/mejoras.js` | 34 | `⚡` | Decoración o icono | `icon: '⚡',` |
| `games/abismo/data/mejoras.js` | 45 | `🏹` | Decoración o icono | `icon: '🏹',` |
| `games/abismo/data/mejoras.js` | 56 | `🔄` | Decoración o icono | `icon: '🔄',` |
| `games/abismo/data/mejoras.js` | 67 | `✨` | Decoración o icono | `icon: '✨',` |
| `games/abismo/data/mejoras.js` | 78 | `🩸` | Decoración o icono | `icon: '🩸',` |
| `games/abismo/data/mejoras.js` | 89 | `👟` | Decoración o icono | `icon: '👟',` |
| `games/abismo/data/mejoras.js` | 100 | `🧲` | Decoración o icono | `icon: '🧲',` |
| `games/abismo/data/mejoras.js` | 111 | `🛡` | Decoración o icono | `icon: '🛡️',` |
| `games/abismo/data/mejoras.js` | 122 | `🔮` | Decoración o icono | `icon: '🔮',` |
| `games/abismo/data/mejoras.js` | 133 | `💥` | Decoración o icono | `icon: '💥',` |
| `games/abismo/data/mejoras.js` | 144 | `⏳` | Decoración o icono | `icon: '⏳',` |
| `games/abismo/data/mejoras.js` | 155 | `🪙` | Decoración o icono | `icon: '🪙',` |
| `games/abismo/data/mejoras.js` | 166 | `💠` | Decoración o icono | `icon: '💠',` |
| `games/abismo/data/mejoras.js` | 182 | `🌀` | Decoración o icono | `icon: '🌀',` |
| `games/abismo/data/mejoras.js` | 195 | `☄` | Decoración o icono | `icon: '☄️',` |
| `games/abismo/data/mejoras.js` | 208 | `🌩` | Decoración o icono | `icon: '🌩️',` |
| `games/abismo/data/mejoras.js` | 221 | `☠` | Decoración o icono | `icon: '☠️',` |
| `games/abismo/data/meta.js` | 22 | `❤` | Decoración o icono | `icon: '❤️',` |
| `games/abismo/data/meta.js` | 33 | `⚔` | Decoración o icono | `icon: '⚔️',` |
| `games/abismo/data/meta.js` | 44 | `👟` | Decoración o icono | `icon: '👟',` |
| `games/abismo/data/meta.js` | 55 | `🧲` | Decoración o icono | `icon: '🧲',` |
| `games/abismo/data/meta.js` | 66 | `🪙` | Decoración o icono | `icon: '🪙',` |
| `games/abismo/data/meta.js` | 77 | `⚡` | Decoración o icono | `icon: '⚡',` |
| `games/abismo/data/meta.js` | 88 | `✨` | Decoración o icono | `icon: '✨',` |
| `games/abismo/data/meta.js` | 103 | `🚩` | Decoración o icono | `icon: '🚩',` |
| `games/abismo/data/meta.js` | 110 | `💀` | Decoración o icono | `icon: '💀',` |
| `games/abismo/data/meta.js` | 117 | `👑` | Decoración o icono | `icon: '👑',` |
| `games/abismo/data/meta.js` | 124 | `✨` | Decoración o icono | `icon: '✨',` |
| `games/abismo/data/meta.js` | 131 | `🔮` | Decoración o icono | `icon: '🔮',` |
| `games/abismo/data/meta.js` | 138 | `🌌` | Decoración o icono | `icon: '🌌',` |
| `games/abismo/data/meta.js` | 145 | `💰` | Decoración o icono | `icon: '💰',` |
| `games/abismo/data/salas.js` | 12 | `⚔` | Decoración o icono | `icon: '⚔️',` |
| `games/abismo/data/salas.js` | 21 | `💎` | Decoración o icono | `icon: '💎',` |
| `games/abismo/data/salas.js` | 30 | `🪙` | Decoración o icono | `icon: '🪙',` |
| `games/abismo/data/salas.js` | 39 | `💚` | Decoración o icono | `icon: '💚',` |
| `games/abismo/data/salas.js` | 48 | `💀` | Decoración o icono | `icon: '💀',` |
| `games/abismo/data/salas.js` | 57 | `👑` | Decoración o icono | `icon: '👑',` |
| `games/abismo/data/salas.js` | 145 | `🏛` | Decoración o icono | `typeData: { id: 'inicio', name: 'Entrada a la Cripta', icon: '🏛️', color: ` |
| `games/abismo/game.js` | 1092 | `⚠` | Renderizado en Canvas | `ctx.fillText('⚠️', e.slamTargetX, e.slamTargetY);` |
| `games/abismo/game.js` | 1130 | `👑` | Renderizado en Canvas | `ctx.fillText('👑', 0, -z - e.radius - 12);` |
| `games/abismo/game.js` | 2476 | `🔒` | Renderizado en Canvas | `ctx.fillText('🔒', x + w / 2, y + h / 2);` |
| `games/abismo/game.js` | 2492 | `▲` | Decoración o icono | `let arrow = '▲';` |
| `games/abismo/game.js` | 2493 | `▼` | Decoración o icono | `if (dir === 'S') arrow = '▼';` |
| `games/abismo/game.js` | 2494 | `►` | Decoración o icono | `else if (dir === 'E') arrow = '►';` |
| `games/abismo/game.js` | 2495 | `◄` | Decoración o icono | `else if (dir === 'W') arrow = '◄';` |
| `games/abismo/game.js` | 2550 | `💚` | Decoración o icono | `{ id: 'potion', name: 'Poción de Vida', cost: 30, icon: '💚', bought: false` |
| `games/abismo/game.js` | 2551 | `⚔` | Decoración o icono | `{ id: 'upgrade_1', name: 'Bendición Ofensiva', cost: 45, icon: '⚔️', bought` |
| `games/abismo/game.js` | 2552 | `💎` | Decoración o icono | `{ id: 'upgrade_2', name: 'Reliquia Arcana', cost: 65, icon: '💎', bought: f` |
| `games/abismo/game.js` | 2582 | `✓` | Renderizado en Canvas | `ctx.fillText(item.bought ? '✓' : item.icon, 0, -18 + bob);` |
| `games/abismo/game.js` | 2591 | `🪙` | Renderizado en Canvas | `ctx.fillText('🪙 ${item.cost}', 0, 28);` |
| `games/abismo/game.js` | 2790 | `🏛` | Decoración o icono | `icon = '🏛️';` |
| `games/abismo/game.js` | 2794 | `👑` | Decoración o icono | `icon = '👑';` |
| `games/abismo/game.js` | 2798 | `💎` | Decoración o icono | `icon = '💎';` |
| `games/abismo/game.js` | 2802 | `🪙` | Decoración o icono | `icon = '🪙';` |
| `games/abismo/game.js` | 2806 | `💚` | Decoración o icono | `icon = '💚';` |
| `games/abismo/game.js` | 2810 | `💀` | Decoración o icono | `icon = '💀';` |
| `games/abismo/game.js` | 2813 | `⚔` | Decoración o icono | `icon = r.cleared ? '' : '⚔️';` |
| `games/abismo/game.js` | 3244 | `🌋` | Decoración o icono | `if (this.bossIconEl) this.bossIconEl.textContent = this.floor % 10 === 0 ? ` |
| `games/abismo/game.js` | 3244 | `👑` | Decoración o icono | `if (this.bossIconEl) this.bossIconEl.textContent = this.floor % 10 === 0 ? ` |
| `games/abismo/game.js` | 3261 | `⚔` | Decoración o icono | `this.roomBadgeIconEl.textContent = roomData.typeData.icon \|\| '⚔️';` |
| `games/abismo/game.js` | 3270 | `⚔` | Decoración o icono | `this.showWaveBanner('¡OLEADA 1/${roomData.waves.length}!', '⚔️', false);` |
| `games/abismo/game.js` | 3275 | `💎` | Decoración o icono | `this.showWaveBanner('BÓVEDA DE RELIQUIAS', '💎', true);` |
| `games/abismo/game.js` | 3277 | `🪙` | Decoración o icono | `this.showWaveBanner('MERCADER UMBRÍO', '🪙', true);` |
| `games/abismo/game.js` | 3280 | `💚` | Decoración o icono | `{ id: 'potion', name: 'Poción de Vida', cost: CFG.SHOP_POTION_COST \|\| 30,` |
| `games/abismo/game.js` | 3281 | `⚔` | Decoración o icono | `{ id: 'upgrade_1', name: 'Bendición Ofensiva', cost: CFG.SHOP_UPGRADE_COST ` |
| `games/abismo/game.js` | 3282 | `💎` | Decoración o icono | `{ id: 'upgrade_2', name: 'Reliquia Arcana', cost: CFG.SHOP_ELITE_UPGRADE_CO` |
| `games/abismo/game.js` | 3286 | `💚` | Decoración o icono | `this.showWaveBanner('SANTUARIO DE ALMAS', '💚', true);` |
| `games/abismo/game.js` | 3325 | `⚔` | Decoración o icono | `showWaveBanner(text, icon = '⚔️', isClear = false) {` |
| `games/abismo/game.js` | 3434 | `🔇` | Decoración o icono | `btnSound.querySelector('.icon').textContent = isMuted ? '🔇' : '🔊';` |
| `games/abismo/game.js` | 3434 | `🔊` | Decoración o icono | `btnSound.querySelector('.icon').textContent = isMuted ? '🔇' : '🔊';` |
| `games/abismo/game.js` | 3456 | `🔒` | Decoración o icono | `previewDesc.innerHTML = '<span style="color:#f43f5e">🔒 <strong>${char.name` |
| `games/abismo/game.js` | 3456 | `✨` | Decoración o icono | `previewDesc.innerHTML = '<span style="color:#f43f5e">🔒 <strong>${char.name` |
| `games/abismo/game.js` | 3561 | `⚔` | Decoración o icono | `this.showWaveBanner('¡OLEADA 1/${this.currentRoom.waves.length}!', '⚔️', fa` |
| `games/abismo/game.js` | 3571 | `⚔` | Decoración o icono | `this.showWaveBanner('¡OLEADA 1/2: PURGA LA CRIPTA!', '⚔️', false);` |
| `games/abismo/game.js` | 3633 | `⚔` | Decoración o icono | `this.showWaveBanner('¡OLEADA 1/${this.currentRoom.waves.length}!', '⚔️', fa` |
| `games/abismo/game.js` | 3973 | `⚔` | Decoración o icono | `this.showWaveBanner('¡OLEADA ${this.currentWaveIndex + 1}/${waves.length}!'` |
| `games/abismo/game.js` | 3978 | `✨` | Decoración o icono | `this.showWaveBanner('¡SALA DESPEJADA! PUERTAS ABIERTAS', '✨', true);` |
| `games/abismo/game.js` | 4119 | `⚡` | Decoración o icono | `this.floatingTexts.spawn(chainTarget.entity.x, chainTarget.entity.y, '⚡${ch` |
| `games/abismo/game.js` | 4244 | `👑` | Decoración o icono | `this.showWaveBanner('¡JEFE DERROTADO! PORTAL ABIERTO', '👑', true);` |
| `games/abismo/game.js` | 4281 | `🌀` | Decoración o icono | `this.showWaveBanner('¡PISO ${this.floor}: ${bName}!', '🌀', true);` |
| `games/abismo/game.js` | 4386 | `🪙` | Decoración o icono | `this.floatingTexts.spawn(this.player.x, this.player.y - 20, '¡Oro insuficie` |
| `games/abismo/game.js` | 4417 | `👑` | Decoración o icono | `<div class="card-icon">👑</div>` |
| `games/abismo/game.js` | 4432 | `➔` | Decoración o icono | `const lvlText = opt.isSynergy ? 'ÚNICA' : 'Nivel ${opt.currentLevel \|\| 0}` |
| `games/abismo/game.js` | 4439 | `✨` | Decoración o icono | `<div class="card-icon">${opt.icon \|\| '✨'}</div>` |
| `games/abismo/game.js` | 4519 | `✨` | Decoración o icono | `if (resEssenceEarned) resEssenceEarned.textContent = '+${essenceEarned} ✨';` |
| `games/abismo/game.js` | 4522 | `✨` | Decoración o icono | `if (resEssenceTotal) resEssenceTotal.textContent = '${this.metaState.essenc` |
| `games/abismo/game.js` | 4715 | `🔒` | Insignia o HUD de estadísticas | `badge.textContent = '🔒 Bloqueado';` |
| `games/abismo/game.js` | 4791 | `⚡` | Decoración o icono | `this.showWaveBanner('DESCENSO REANUDADO - PISO ${this.floor}', '⚡', true);` |
| `games/abismo/game.js` | 4927 | `✨` | Decoración o icono | `${isMax ? 'NIVEL MÁXIMO' : 'MEJORAR (${cost} ✨)'}` |
| `games/abismo/game.js` | 4958 | `🎭` | Decoración o icono | `<span class="meta-card-icon">🎭</span>` |
| `games/abismo/game.js` | 4965 | `✨` | Decoración o icono | `${isUnlocked ? 'YA DESBLOQUEADO' : 'DESBLOQUEAR (${cost} ✨)'}` |
| `games/abismo/game.js` | 5023 | `✨` | Decoración o icono | `if (elEssence) elEssence.textContent = '${this.metaState.totalEssenceEarned` |
| `games/abismo/game.js` | 5038 | `🏆` | Decoración o icono | `<span class="ach-card-status">${isUnlocked ? 'DESBLOQUEADO 🏆' : 'BLOQUEADO` |
| `games/abismo/game.js` | 5038 | `🔒` | Decoración o icono | `<span class="ach-card-status">${isUnlocked ? 'DESBLOQUEADO 🏆' : 'BLOQUEADO` |
| `games/abismo/index.html` | 29 | `🔊` | Decoración o icono | `<span class="icon">🔊</span>` |
| `games/abismo/index.html` | 32 | `⏸` | Decoración o icono | `<span class="icon">⏸</span>` |
| `games/abismo/index.html` | 71 | `🏛` | Insignia o HUD de estadísticas | `<span class="room-badge-icon" id="hud-room-icon">🏛️</span>` |
| `games/abismo/index.html` | 80 | `🚩` | Insignia o HUD de estadísticas | `<span class="stat-icon">🚩</span>` |
| `games/abismo/index.html` | 84 | `🪙` | Insignia o HUD de estadísticas | `<span class="stat-icon">🪙</span>` |
| `games/abismo/index.html` | 88 | `💀` | Insignia o HUD de estadísticas | `<span class="stat-icon">💀</span>` |
| `games/abismo/index.html` | 92 | `👁` | Insignia o HUD de estadísticas | `<span class="stat-icon">👁️</span>` |
| `games/abismo/index.html` | 100 | `🔍` | Encabezado o título | `<span class="minimap-zoom-hint" title="Ampliar mapa">🔍</span>` |
| `games/abismo/index.html` | 108 | `👑` | Decoración o icono | `<span class="boss-icon" id="boss-icon">👑</span>` |
| `games/abismo/index.html` | 120 | `⚔` | Decoración o icono | `<span class="wave-banner-icon" id="wave-banner-icon">⚔️</span>` |
| `games/abismo/index.html` | 136 | `💥` | Decoración o icono | `<span class="special-icon">💥</span>` |
| `games/abismo/index.html` | 146 | `🗡` | Decoración o icono | `<div class="abismo-crest-icon">🗡️</div>` |
| `games/abismo/index.html` | 155 | `🗡` | Decoración o icono | `<span class="char-card-icon">🗡️</span>` |
| `games/abismo/index.html` | 160 | `🩸` | Decoración o icono | `<span class="char-card-icon">🩸</span>` |
| `games/abismo/index.html` | 165 | `🛡` | Decoración o icono | `<span class="char-card-icon">🛡️</span>` |
| `games/abismo/index.html` | 170 | `👤` | Decoración o icono | `<span class="char-card-icon">👤</span>` |
| `games/abismo/index.html` | 175 | `🔥` | Decoración o icono | `<span class="char-card-icon">🔥</span>` |
| `games/abismo/index.html` | 187 | `🎯` | Decoración o icono | `<span class="inst-icon">🎯</span>` |
| `games/abismo/index.html` | 191 | `📱` | Decoración o icono | `<span class="inst-icon">📱</span>` |
| `games/abismo/index.html` | 195 | `💻` | Decoración o icono | `<span class="inst-icon">💻</span>` |
| `games/abismo/index.html` | 202 | `⚡` | Decoración o icono | `⚡ CONTINUAR DESCENSO (<span id="continue-run-info">Piso 1</span>)` |
| `games/abismo/index.html` | 209 | `✨` | Decoración o icono | `✨ ALTAR DEL ABISMO (<span id="start-essence-val">0</span>)` |
| `games/abismo/index.html` | 212 | `🏆` | Decoración o icono | `🏆 LOGROS Y RÉCORD` |
| `games/abismo/index.html` | 236 | `✨` | Decoración o icono | `<span class="levelup-icon-anim">✨</span>` |
| `games/abismo/index.html` | 251 | `✨` | Decoración o icono | `<div class="abismo-crest-icon">✨</div>` |
| `games/abismo/index.html` | 255 | `✨` | Decoración o icono | `<span class="essence-sparkle">✨</span>` |
| `games/abismo/index.html` | 276 | `🏆` | Decoración o icono | `<div class="abismo-crest-icon">🏆</div>` |
| `games/abismo/index.html` | 283 | `🚩` | Insignia o HUD de estadísticas | `<span class="ach-stat-icon">🚩</span>` |
| `games/abismo/index.html` | 288 | `🎮` | Insignia o HUD de estadísticas | `<span class="ach-stat-icon">🎮</span>` |
| `games/abismo/index.html` | 293 | `💀` | Insignia o HUD de estadísticas | `<span class="ach-stat-icon">💀</span>` |
| `games/abismo/index.html` | 298 | `👑` | Insignia o HUD de estadísticas | `<span class="ach-stat-icon">👑</span>` |
| `games/abismo/index.html` | 303 | `✨` | Insignia o HUD de estadísticas | `<span class="ach-stat-icon">✨</span>` |
| `games/abismo/index.html` | 324 | `🗺` | Decoración o icono | `<span class="map-modal-icon">🗺️</span>` |
| `games/abismo/index.html` | 330 | `✕` | Icono de botón | `<button class="map-modal-close-btn" id="btn-close-map" type="button" aria-l` |
| `games/abismo/index.html` | 339 | `👑` | Decoración o icono | `<div class="map-legend-item"><span class="legend-chip legend-boss">👑</span` |
| `games/abismo/index.html` | 340 | `💎` | Decoración o icono | `<div class="map-legend-item"><span class="legend-chip legend-treasure">💎</` |
| `games/abismo/index.html` | 341 | `🪙` | Decoración o icono | `<div class="map-legend-item"><span class="legend-chip legend-shop">🪙</span` |
| `games/abismo/index.html` | 342 | `💚` | Decoración o icono | `<div class="map-legend-item"><span class="legend-chip legend-rest">💚</span` |
| `games/abismo/index.html` | 343 | `⚔` | Decoración o icono | `<div class="map-legend-item"><span class="legend-chip legend-combat">⚔️</sp` |
| `games/abismo/index.html` | 357 | `💀` | Decoración o icono | `<div class="abismo-crest-icon">💀</div>` |
| `games/abismo/index.html` | 372 | `✨` | Decoración o icono | `<span class="result-val essence-earned" id="res-essence-earned">+0 ✨</span>` |
| `games/abismo/index.html` | 376 | `✨` | Decoración o icono | `<span class="result-val" id="res-essence-total">0 ✨</span>` |
| `games/abismo/index.html` | 382 | `✨` | Decoración o icono | `✨ ALTAR DE MEJORAS` |
| `games/abismo/index.html` | 397 | `⚙` | Encabezado o título | `<span class="debug-title">⚙️ DEBUG CONSOLE</span>` |
| `games/abismo/NOTAS.md` | 50 | `🔒` | Decoración o icono | `- **Mecánica de apertura**: Durante el combate en una sala, las puertas est` |
| `games/abismo/NOTAS.md` | 50 | `▲` | Decoración o icono | `- **Mecánica de apertura**: Durante el combate en una sala, las puertas est` |
| `games/abismo/NOTAS.md` | 50 | `▼` | Decoración o icono | `- **Mecánica de apertura**: Durante el combate en una sala, las puertas est` |
| `games/abismo/NOTAS.md` | 50 | `◄` | Decoración o icono | `- **Mecánica de apertura**: Durante el combate en una sala, las puertas est` |
| `games/abismo/NOTAS.md` | 50 | `►` | Decoración o icono | `- **Mecánica de apertura**: Durante el combate en una sala, las puertas est` |
| `games/abismo/NOTAS.md` | 179 | `🔍` | Decoración o icono | `- El contenedor del minimapa en el HUD funciona ahora como botón táctil int` |
| `games/abismo/NOTAS.md` | 181 | `🏛` | Decoración o icono | `- Muestra el bioma actual, piso, iconos distintivos de cada sala (Inicio 🏛` |
| `games/abismo/NOTAS.md` | 181 | `⚔` | Decoración o icono | `- Muestra el bioma actual, piso, iconos distintivos de cada sala (Inicio 🏛` |
| `games/abismo/NOTAS.md` | 181 | `💎` | Decoración o icono | `- Muestra el bioma actual, piso, iconos distintivos de cada sala (Inicio 🏛` |
| `games/abismo/NOTAS.md` | 181 | `🪙` | Decoración o icono | `- Muestra el bioma actual, piso, iconos distintivos de cada sala (Inicio 🏛` |
| `games/abismo/NOTAS.md` | 181 | `💚` | Decoración o icono | `- Muestra el bioma actual, piso, iconos distintivos de cada sala (Inicio 🏛` |
| `games/abismo/NOTAS.md` | 181 | `💀` | Decoración o icono | `- Muestra el bioma actual, piso, iconos distintivos de cada sala (Inicio 🏛` |
| `games/abismo/NOTAS.md` | 181 | `👑` | Decoración o icono | `- Muestra el bioma actual, piso, iconos distintivos de cada sala (Inicio 🏛` |
| `games/bastion/data/mejoras.js` | 3 | `🟣` | Decoración o icono | `* Mejoras pasivas compradas con Esquirlas del Vacío (🟣 shards) que persist` |
| `games/bastion/data/mejoras.js` | 14 | `🪙` | Decoración o icono | `icon: '🪙',` |
| `games/bastion/data/mejoras.js` | 24 | `💖` | Decoración o icono | `icon: '💖',` |
| `games/bastion/data/mejoras.js` | 34 | `⚙` | Decoración o icono | `icon: '⚙️',` |
| `games/bastion/data/mejoras.js` | 44 | `💥` | Decoración o icono | `icon: '💥',` |
| `games/bastion/data/mejoras.js` | 54 | `⚡` | Decoración o icono | `icon: '⚡',` |
| `games/bastion/data/mejoras.js` | 64 | `♻` | Decoración o icono | `icon: '♻️',` |
| `games/bastion/data/reliquias.js` | 12 | `🔮` | Decoración o icono | `icon: '🔮',` |
| `games/bastion/data/reliquias.js` | 20 | `⚡` | Decoración o icono | `icon: '⚡',` |
| `games/bastion/data/reliquias.js` | 28 | `💣` | Decoración o icono | `icon: '💣',` |
| `games/bastion/data/reliquias.js` | 36 | `❄` | Decoración o icono | `icon: '❄️',` |
| `games/bastion/data/reliquias.js` | 44 | `🪙` | Decoración o icono | `icon: '🪙',` |
| `games/bastion/data/reliquias.js` | 52 | `🛡` | Decoración o icono | `icon: '🛡️',` |
| `games/bastion/data/reliquias.js` | 60 | `🌩` | Decoración o icono | `icon: '🌩️',` |
| `games/bastion/data/reliquias.js` | 68 | `💎` | Decoración o icono | `icon: '💎',` |
| `games/bastion/data/reliquias.js` | 76 | `📈` | Decoración o icono | `icon: '📈',` |
| `games/bastion/data/reliquias.js` | 84 | `🗿` | Decoración o icono | `icon: '🗿',` |
| `games/bastion/game.js` | 6 | `🟣` | Decoración o icono | `* árbol de metaprogreso permanente entre partidas (Templo del Nexo con Esqu` |
| `games/bastion/game.js` | 221 | `🪙` | Decoración o icono | `this.addDamageNumber(cp.x, cp.y - 30, '+${amount} 🪙 [DEBUG]', '#38bdf8', t` |
| `games/bastion/game.js` | 228 | `❤` | Decoración o icono | `this.addDamageNumber(cp.x, cp.y - 20, '+${amount} ❤️ [DEBUG]', '#10b981', t` |
| `games/bastion/game.js` | 242 | `💥` | Decoración o icono | `this.addDamageNumber(cp.x, cp.y - 35, '💥 NUKE (${count}) [DEBUG]', '#ef444` |
| `games/bastion/game.js` | 771 | `▲` | Decoración o icono | `// Glifo de viento/altura (▲) en el centro` |
| `games/bastion/game.js` | 861 | `🪙` | Decoración o icono | `// Sello discreto "40🪙"` |
| `games/bastion/game.js` | 865 | `🪙` | Renderizado en Canvas | `ctx.fillText('40🪙', px + cs / 2, py + cs - 5);` |
| `games/bastion/game.js` | 916 | `🪙` | Decoración o icono | `this.addDamageNumber(pos.x, pos.y - 12, '-40 🪙 ¡DESPEJADO!', '#f59e0b', tr` |
| `games/bastion/game.js` | 1293 | `⚠` | Decoración o icono | `this.addDamageNumber(cp.x, cp.y - 45, '⚠️ ¡NUEVO PUNTO DE REAPARICIÓN! (${c` |
| `games/bastion/game.js` | 1306 | `🪙` | Decoración o icono | `this.addDamageNumber(corePos.x, corePos.y - 35, '+${bonus} 🪙 ¡ASALTO ADELA` |
| `games/bastion/game.js` | 1394 | `☄` | Decoración o icono | `this.addDamageNumber(targetX, targetY - 20, '☄️ ¡BOMBARDEO!', '#f97316', tr` |
| `games/bastion/game.js` | 1409 | `❄` | Decoración o icono | `this.addDamageNumber(corePos.x, corePos.y - 25, '❄️ ¡ESTASIS TEMPORAL!', '#` |
| `games/bastion/game.js` | 1420 | `🪙` | Decoración o icono | `this.addDamageNumber(corePos.x, corePos.y - 25, '+120 🪙 ¡SOBRECARGA!', '#f` |
| `games/bastion/game.js` | 1921 | `🟣` | Decoración o icono | `this.addDamageNumber(enemy.x, enemy.y - 24, '+${bossShards} 🟣', '#d8b4fe',` |
| `games/bastion/game.js` | 2270 | `🪙` | Decoración o icono | `this.addDamageNumber(corePos.x, corePos.y - 45, '+${goldmineIncome} 🪙 Veta` |
| `games/bastion/game.js` | 2279 | `🪙` | Decoración o icono | `this.addDamageNumber(corePos.x, corePos.y - 30, '+${interest} 🪙 Interés', ` |
| `games/bastion/game.js` | 2488 | `💥` | Renderizado en Canvas | `ctx.fillText('💥 IMPACTO ORBITAL', targetX, targetY - radius - 6);` |
| `games/bastion/game.js` | 2670 | `⚡` | Renderizado en Canvas | `ctx.fillText('⚡', t.x, t.y - cs * 0.45);` |
| `games/bastion/game.js` | 2944 | `⭐` | Decoración o icono | `btnUpgradeTower.textContent = '⭐ Mejorar Lvl ${st.level + 1} (${cost} 🪙)';` |
| `games/bastion/game.js` | 2944 | `🪙` | Decoración o icono | `btnUpgradeTower.textContent = '⭐ Mejorar Lvl ${st.level + 1} (${cost} 🪙)';` |
| `games/bastion/game.js` | 2956 | `🔱` | Decoración o icono | `btnBranchA.textContent = '🔱 ${branchA.name} (${costA} 🪙)';` |
| `games/bastion/game.js` | 2956 | `🪙` | Decoración o icono | `btnBranchA.textContent = '🔱 ${branchA.name} (${costA} 🪙)';` |
| `games/bastion/game.js` | 2962 | `💥` | Decoración o icono | `btnBranchB.textContent = '💥 ${branchB.name} (${costB} 🪙)';` |
| `games/bastion/game.js` | 2962 | `🪙` | Decoración o icono | `btnBranchB.textContent = '💥 ${branchB.name} (${costB} 🪙)';` |
| `games/bastion/game.js` | 2968 | `🏆` | Decoración o icono | `btnUpgradeTower.textContent = '🏆 MAESTRÍA MÁXIMA';` |
| `games/bastion/game.js` | 2978 | `🪙` | Decoración o icono | `btnSellTower.textContent = 'Vender (${refund} 🪙)';` |
| `games/bastion/game.js` | 2993 | `⚔` | Decoración o icono | `btnStartWave.textContent = '⚔️ INICIAR ASALTO';` |
| `games/bastion/game.js` | 3000 | `⏩` | Decoración o icono | `btnStartWave.textContent = '⏩ ADELANTAR (+${bonus} 🪙)';` |
| `games/bastion/game.js` | 3000 | `🪙` | Decoración o icono | `btnStartWave.textContent = '⏩ ADELANTAR (+${bonus} 🪙)';` |
| `games/bastion/game.js` | 3003 | `⚔` | Decoración o icono | `btnStartWave.textContent = '⚔️ ASALTO FINAL';` |
| `games/bastion/game.js` | 3017 | `👾` | Decoración o icono | `reptante: '👾',` |
| `games/bastion/game.js` | 3018 | `⚡` | Decoración o icono | `veloz: '⚡',` |
| `games/bastion/game.js` | 3019 | `🛡` | Decoración o icono | `blindado: '🛡️',` |
| `games/bastion/game.js` | 3020 | `🦅` | Decoración o icono | `etero: '🦅',` |
| `games/bastion/game.js` | 3021 | `💚` | Decoración o icono | `regenerador: '💚',` |
| `games/bastion/game.js` | 3022 | `🦠` | Decoración o icono | `divisor: '🦠',` |
| `games/bastion/game.js` | 3023 | `💀` | Decoración o icono | `jefe_coloso: '💀'` |
| `games/bastion/game.js` | 3026 | `👾` | Decoración o icono | `.map(([t, cnt]) => '${typeIcons[t] \|\| '👾'}${cnt}')` |
| `games/bastion/game.js` | 3028 | `⚠` | Decoración o icono | `const label = intel.hasBoss ? '⚠️ W${intel.waveNum}' : 'W${intel.waveNum}';` |
| `games/bastion/game.js` | 3032 | `📡` | Insignia o HUD de estadísticas | `hudWaveIntel.innerHTML = '<span class="stat-icon">📡</span><span class="sta` |
| `games/bastion/game.js` | 3039 | `📡` | Insignia o HUD de estadísticas | `hudWaveIntel.innerHTML = '<span class="stat-icon">📡</span><span class="sta` |
| `games/bastion/game.js` | 3134 | `🟣` | Decoración o icono | `${isMax ? 'RANGO MÁXIMO' : 'Mejorar (${nextCost} 🟣)'}` |
| `games/bastion/game.js` | 3198 | `★` | Decoración o icono | `const stars = l >= activeGame.initialLives ? '★★★' : (l >= Math.ceil(active` |
| `games/bastion/game.js` | 3198 | `★` | Decoración o icono | `const stars = l >= activeGame.initialLives ? '★★★' : (l >= Math.ceil(active` |
| `games/bastion/game.js` | 3198 | `★` | Decoración o icono | `const stars = l >= activeGame.initialLives ? '★★★' : (l >= Math.ceil(active` |
| `games/bastion/game.js` | 3198 | `★` | Decoración o icono | `const stars = l >= activeGame.initialLives ? '★★★' : (l >= Math.ceil(active` |
| `games/bastion/game.js` | 3198 | `★` | Decoración o icono | `const stars = l >= activeGame.initialLives ? '★★★' : (l >= Math.ceil(active` |
| `games/bastion/game.js` | 3198 | `☆` | Decoración o icono | `const stars = l >= activeGame.initialLives ? '★★★' : (l >= Math.ceil(active` |
| `games/bastion/game.js` | 3198 | `★` | Decoración o icono | `const stars = l >= activeGame.initialLives ? '★★★' : (l >= Math.ceil(active` |
| `games/bastion/game.js` | 3198 | `☆` | Decoración o icono | `const stars = l >= activeGame.initialLives ? '★★★' : (l >= Math.ceil(active` |
| `games/bastion/game.js` | 3198 | `☆` | Decoración o icono | `const stars = l >= activeGame.initialLives ? '★★★' : (l >= Math.ceil(active` |
| `games/bastion/game.js` | 3213 | `🟣` | Decoración o icono | `if (shardsEl) shardsEl.textContent = '+${activeGame.stats.shardsEarned} 🟣'` |
| `games/bastion/game.js` | 3242 | `🟣` | Decoración o icono | `if (shardsEl) shardsEl.textContent = '+${activeGame.stats.shardsEarned} 🟣'` |
| `games/bastion/game.js` | 3286 | `🔒` | Insignia o HUD de estadísticas | `starsEl.innerHTML = '<span class="map-lock-badge">🔒 BLOQUEADO</span>';` |
| `games/bastion/game.js` | 3289 | `♾` | Decoración o icono | `starsEl.innerHTML = '<span style="color:#a855f7; font-weight:bold;">♾️ ASAL` |
| `games/bastion/game.js` | 3292 | `★` | Decoración o icono | `const starStr = stars === 3 ? '★★★' : (stars === 2 ? '★★☆' : (stars === 1 ?` |
| `games/bastion/game.js` | 3292 | `★` | Decoración o icono | `const starStr = stars === 3 ? '★★★' : (stars === 2 ? '★★☆' : (stars === 1 ?` |
| `games/bastion/game.js` | 3292 | `★` | Decoración o icono | `const starStr = stars === 3 ? '★★★' : (stars === 2 ? '★★☆' : (stars === 1 ?` |
| `games/bastion/game.js` | 3292 | `★` | Decoración o icono | `const starStr = stars === 3 ? '★★★' : (stars === 2 ? '★★☆' : (stars === 1 ?` |
| `games/bastion/game.js` | 3292 | `★` | Decoración o icono | `const starStr = stars === 3 ? '★★★' : (stars === 2 ? '★★☆' : (stars === 1 ?` |
| `games/bastion/game.js` | 3292 | `☆` | Decoración o icono | `const starStr = stars === 3 ? '★★★' : (stars === 2 ? '★★☆' : (stars === 1 ?` |
| `games/bastion/game.js` | 3292 | `★` | Decoración o icono | `const starStr = stars === 3 ? '★★★' : (stars === 2 ? '★★☆' : (stars === 1 ?` |
| `games/bastion/game.js` | 3292 | `☆` | Decoración o icono | `const starStr = stars === 3 ? '★★★' : (stars === 2 ? '★★☆' : (stars === 1 ?` |
| `games/bastion/game.js` | 3292 | `☆` | Decoración o icono | `const starStr = stars === 3 ? '★★★' : (stars === 2 ? '★★☆' : (stars === 1 ?` |
| `games/bastion/game.js` | 3292 | `☆` | Decoración o icono | `const starStr = stars === 3 ? '★★★' : (stars === 2 ? '★★☆' : (stars === 1 ?` |
| `games/bastion/game.js` | 3292 | `☆` | Decoración o icono | `const starStr = stars === 3 ? '★★★' : (stars === 2 ? '★★☆' : (stars === 1 ?` |
| `games/bastion/game.js` | 3292 | `☆` | Decoración o icono | `const starStr = stars === 3 ? '★★★' : (stars === 2 ? '★★☆' : (stars === 1 ?` |
| `games/bastion/game.js` | 3335 | `🪙` | Decoración o icono | `if (nameEl) nameEl.textContent = '${def.name} (${def.cost} 🪙)';` |
| `games/bastion/game.js` | 3378 | `⚠` | Decoración o icono | `? '⚠️ ALERTA DE AMENAZA COLOSAL: Se aproxima un Jefe de sector'` |
| `games/bastion/game.js` | 3384 | `👾` | Decoración o icono | `reptante: '👾',` |
| `games/bastion/game.js` | 3385 | `⚡` | Decoración o icono | `veloz: '⚡',` |
| `games/bastion/game.js` | 3386 | `🛡` | Decoración o icono | `blindado: '🛡️',` |
| `games/bastion/game.js` | 3387 | `🦅` | Decoración o icono | `etero: '🦅',` |
| `games/bastion/game.js` | 3388 | `💚` | Decoración o icono | `regenerador: '💚',` |
| `games/bastion/game.js` | 3389 | `🦠` | Decoración o icono | `divisor: '🦠',` |
| `games/bastion/game.js` | 3390 | `💀` | Decoración o icono | `jefe_coloso: '💀'` |
| `games/bastion/game.js` | 3395 | `👾` | Decoración o icono | `const icon = typeIcons[typeId] \|\| '👾';` |
| `games/bastion/game.js` | 3555 | `⚡` | Decoración o icono | `if (speedLabel) speedLabel.textContent = '⚡ ${activeGame.gameSpeed}x';` |
| `games/bastion/game.js` | 3799 | `🪙` | Decoración o icono | `activeGame.addDamageNumber(x, y - 10, '¡FALTAN 40 🪙!', '#ef4444');` |
| `games/bastion/game.js` | 4091 | `🔇` | Decoración o icono | `if (icon) icon.textContent = activeGame.isMuted ? '🔇' : '🔊';` |
| `games/bastion/game.js` | 4091 | `🔊` | Decoración o icono | `if (icon) icon.textContent = activeGame.isMuted ? '🔇' : '🔊';` |
| `games/bastion/game.js` | 4168 | `⚡` | Decoración o icono | `if (speedLabel) speedLabel.textContent = '⚡ ${activeGame.gameSpeed}x';` |
| `games/bastion/game.js` | 4235 | `⚡` | Decoración o icono | `if (speedLabel) speedLabel.textContent = '⚡ ${activeGame.gameSpeed}x';` |
| `games/bastion/index.html` | 30 | `🔮` | Decoración o icono | `<span class="icon">🔮</span>` |
| `games/bastion/index.html` | 33 | `🗺` | Decoración o icono | `<span class="icon">🗺️</span>` |
| `games/bastion/index.html` | 36 | `🔊` | Decoración o icono | `<span class="icon">🔊</span>` |
| `games/bastion/index.html` | 39 | `⚙` | Decoración o icono | `<span class="icon">⚙️</span>` |
| `games/bastion/index.html` | 47 | `💖` | Insignia o HUD de estadísticas | `<span class="stat-icon">💖</span>` |
| `games/bastion/index.html` | 51 | `🪙` | Insignia o HUD de estadísticas | `<span class="stat-icon">🪙</span>` |
| `games/bastion/index.html` | 55 | `🟣` | Insignia o HUD de estadísticas | `<span class="stat-icon">🟣</span>` |
| `games/bastion/index.html` | 59 | `🚩` | Insignia o HUD de estadísticas | `<span class="stat-icon">🚩</span>` |
| `games/bastion/index.html` | 63 | `📡` | Insignia o HUD de estadísticas | `<span class="stat-icon">📡</span>` |
| `games/bastion/index.html` | 67 | `⚡` | Decoración o icono | `<span id="speed-label">⚡ 1x</span>` |
| `games/bastion/index.html` | 82 | `🔍` | Icono de botón | `<button type="button" class="zoom-btn" id="btn-zoom-reset" title="Restablec` |
| `games/bastion/index.html` | 89 | `✓` | Icono de botón | `<button type="button" class="confirm-cell-btn" id="btn-confirm-cell-build">` |
| `games/bastion/index.html` | 90 | `✕` | Icono de botón | `<button type="button" class="cancel-cell-btn" id="btn-cancel-cell-build" ar` |
| `games/bastion/index.html` | 99 | `☄` | Icono de botón | `<span class="skill-btn-icon">☄️</span>` |
| `games/bastion/index.html` | 104 | `❄` | Icono de botón | `<span class="skill-btn-icon">❄️</span>` |
| `games/bastion/index.html` | 109 | `⚡` | Icono de botón | `<span class="skill-btn-icon">⚡</span>` |
| `games/bastion/index.html` | 117 | `☄` | Decoración o icono | `<span class="targeting-banner-text">☄️ Toca el mapa para detonar</span>` |
| `games/bastion/index.html` | 118 | `✕` | Icono de botón | `<button type="button" class="cancel-target-btn" id="btn-cancel-target">✕ Ca` |
| `games/bastion/index.html` | 128 | `🎯` | Icono de botón | `<span class="tower-btn-icon">🎯</span>` |
| `games/bastion/index.html` | 131 | `🪙` | Icono de botón | `<span class="tower-btn-cost">100 🪙</span>` |
| `games/bastion/index.html` | 136 | `💣` | Icono de botón | `<span class="tower-btn-icon">💣</span>` |
| `games/bastion/index.html` | 139 | `🪙` | Icono de botón | `<span class="tower-btn-cost">140 🪙</span>` |
| `games/bastion/index.html` | 144 | `⚡` | Icono de botón | `<span class="tower-btn-icon">⚡</span>` |
| `games/bastion/index.html` | 147 | `🪙` | Icono de botón | `<span class="tower-btn-cost">160 🪙</span>` |
| `games/bastion/index.html` | 152 | `❄` | Icono de botón | `<span class="tower-btn-icon">❄️</span>` |
| `games/bastion/index.html` | 155 | `🪙` | Icono de botón | `<span class="tower-btn-cost">120 🪙</span>` |
| `games/bastion/index.html` | 160 | `🏛` | Icono de botón | `<span class="tower-btn-icon">🏛️</span>` |
| `games/bastion/index.html` | 163 | `🪙` | Icono de botón | `<span class="tower-btn-cost">150 🪙</span>` |
| `games/bastion/index.html` | 168 | `🔭` | Icono de botón | `<span class="tower-btn-icon">🔭</span>` |
| `games/bastion/index.html` | 171 | `🪙` | Icono de botón | `<span class="tower-btn-cost">180 🪙</span>` |
| `games/bastion/index.html` | 176 | `✕` | Decoración o icono | `✕ Cancelar` |
| `games/bastion/index.html` | 186 | `⚔` | Decoración o icono | `⚔️ INICIAR ASALTO` |
| `games/bastion/index.html` | 198 | `✕` | Icono de botón | `<button type="button" class="close-inspector-btn" id="btn-close-inspector" ` |
| `games/bastion/index.html` | 201 | `⭐` | Icono de botón | `<button type="button" class="upgrade-btn hidden" id="btn-upgrade-tower">⭐ M` |
| `games/bastion/index.html` | 202 | `🔱` | Icono de botón | `<button type="button" class="branch-btn hidden" id="btn-branch-a">🔱 Rama A` |
| `games/bastion/index.html` | 203 | `💥` | Icono de botón | `<button type="button" class="branch-btn hidden" id="btn-branch-b">💥 Rama B` |
| `games/bastion/index.html` | 205 | `🎯` | Decoración o icono | `🎯 <span id="priority-label">Primero</span>` |
| `games/bastion/index.html` | 207 | `🪙` | Icono de botón | `<button type="button" class="sell-btn" id="btn-sell-tower">🪙 Vender</butto` |
| `games/bastion/index.html` | 215 | `🛡` | Decoración o icono | `<div class="bastion-crest-icon">🛡️</div>` |
| `games/bastion/index.html` | 221 | `🎯` | Decoración o icono | `<span class="inst-icon">🎯</span>` |
| `games/bastion/index.html` | 225 | `⭐` | Decoración o icono | `<span class="inst-icon">⭐</span>` |
| `games/bastion/index.html` | 229 | `👾` | Decoración o icono | `<span class="inst-icon">👾</span>` |
| `games/bastion/index.html` | 250 | `🛡` | Icono de botón | `<button type="button" class="mode-tab active" id="btn-mode-campaign" data-m` |
| `games/bastion/index.html` | 251 | `♾` | Icono de botón | `<button type="button" class="mode-tab" id="btn-mode-endless" data-mode="end` |
| `games/bastion/index.html` | 256 | `♾` | Decoración o icono | `<span>♾️ RÉCORD MODO SIN FIN: <strong>OLEADA <span id="endless-record-val">` |
| `games/bastion/index.html` | 261 | `🛡` | Icono de botón | `<button type="button" class="diff-tab active" data-diff="normal">🛡️ NORMAL` |
| `games/bastion/index.html` | 262 | `⚔` | Icono de botón | `<button type="button" class="diff-tab" data-diff="heroico">⚔️ HEROICO (+50%` |
| `games/bastion/index.html` | 262 | `🟣` | Icono de botón | `<button type="button" class="diff-tab" data-diff="heroico">⚔️ HEROICO (+50%` |
| `games/bastion/index.html` | 263 | `💀` | Icono de botón | `<button type="button" class="diff-tab" data-diff="pesadilla">💀 PESADILLA (` |
| `games/bastion/index.html` | 263 | `🟣` | Icono de botón | `<button type="button" class="diff-tab" data-diff="pesadilla">💀 PESADILLA (` |
| `games/bastion/index.html` | 323 | `🗑` | Decoración o icono | `🗑️ Reiniciar Progreso` |
| `games/bastion/index.html` | 335 | `🔮` | Decoración o icono | `<div class="bastion-crest-icon">🔮</div>` |
| `games/bastion/index.html` | 340 | `🟣` | Decoración o icono | `<span style="font-size: 24px;">🟣</span>` |
| `games/bastion/index.html` | 351 | `🗑` | Decoración o icono | `🗑️ Reiniciar Todo` |
| `games/bastion/index.html` | 363 | `✨` | Decoración o icono | `<div class="bastion-crest-icon">✨</div>` |
| `games/bastion/index.html` | 402 | `📡` | Decoración o icono | `<div class="bastion-crest-icon">📡</div>` |
| `games/bastion/index.html` | 417 | `🏆` | Decoración o icono | `<div class="bastion-crest-icon" style="color: #10b981;">🏆</div>` |
| `games/bastion/index.html` | 421 | `★` | Decoración o icono | `<div class="stars-banner" id="vic-stars">★★★</div>` |
| `games/bastion/index.html` | 421 | `★` | Decoración o icono | `<div class="stars-banner" id="vic-stars">★★★</div>` |
| `games/bastion/index.html` | 421 | `★` | Decoración o icono | `<div class="stars-banner" id="vic-stars">★★★</div>` |
| `games/bastion/index.html` | 438 | `🟣` | Decoración o icono | `<span class="stat-box-val shards" id="vic-stat-shards">+0 🟣</span>` |
| `games/bastion/index.html` | 448 | `♾` | Decoración o icono | `♾️ CONTINUAR EN MODO SIN FIN` |
| `games/bastion/index.html` | 451 | `🗺` | Decoración o icono | `🗺️ SIGUIENTE MAPA` |
| `games/bastion/index.html` | 454 | `📋` | Decoración o icono | `📋 MENÚ DE MAPAS` |
| `games/bastion/index.html` | 457 | `🔮` | Decoración o icono | `🔮 TEMPLO DEL NEXO` |
| `games/bastion/index.html` | 469 | `💥` | Decoración o icono | `<div class="bastion-crest-icon">💥</div>` |
| `games/bastion/index.html` | 488 | `🟣` | Decoración o icono | `<span class="stat-box-val shards" id="res-shards">+0 🟣</span>` |
| `games/bastion/index.html` | 509 | `🛠` | Encabezado o título | `<span class="debug-title">🛠️ BASTIÓN DEBUG</span>` |
| `games/bastion/index.html` | 516 | `🪙` | Icono de botón | `<button type="button" class="dbg-btn" id="dbg-btn-gold">+1000 🪙</button>` |
| `games/bastion/index.html` | 517 | `❤` | Icono de botón | `<button type="button" class="dbg-btn" id="dbg-btn-lives">+50 ❤️</button>` |
| `games/bastion/index.html` | 518 | `⚡` | Icono de botón | `<button type="button" class="dbg-btn" id="dbg-btn-skip">⚡ Saltar W</button>` |
| `games/bastion/index.html` | 519 | `☠` | Icono de botón | `<button type="button" class="dbg-btn" id="dbg-btn-kill">☠️ Nuke</button>` |
| `games/bastion/index.html` | 520 | `⏩` | Icono de botón | `<button type="button" class="dbg-btn" id="dbg-btn-speed">⏩ 5x</button>` |
| `games/bastion/NOTAS.md` | 217 | `⏩` | Icono de botón | `- El botón '#btn-start-wave' se transforma dinámicamente durante el combate` |
| `games/bastion/NOTAS.md` | 217 | `🪙` | Icono de botón | `- El botón '#btn-start-wave' se transforma dinámicamente durante el combate` |
| `games/bastion/NOTAS.md` | 221 | `👾` | Decoración o icono | `- Elemento '#hud-wave-intel' en la cabecera del HUD que decodifica la compo` |
| `games/bastion/NOTAS.md` | 221 | `⚡` | Decoración o icono | `- Elemento '#hud-wave-intel' en la cabecera del HUD que decodifica la compo` |
| `games/bastion/NOTAS.md` | 221 | `🛡` | Decoración o icono | `- Elemento '#hud-wave-intel' en la cabecera del HUD que decodifica la compo` |
| `games/bastion/NOTAS.md` | 222 | `⚠` | Decoración o icono | `- Detecta y emite alerta visual roja destacada si la siguiente oleada conti` |
| `games/bastion/NOTAS.md` | 222 | `💀` | Decoración o icono | `- Detecta y emite alerta visual roja destacada si la siguiente oleada conti` |
| `games/bastion/NOTAS.md` | 228 | `★` | Decoración o icono | `- **★★★ (3 Estrellas):** Victoria impecable (el núcleo no recibió ningún da` |
| `games/bastion/NOTAS.md` | 228 | `★` | Decoración o icono | `- **★★★ (3 Estrellas):** Victoria impecable (el núcleo no recibió ningún da` |
| `games/bastion/NOTAS.md` | 228 | `★` | Decoración o icono | `- **★★★ (3 Estrellas):** Victoria impecable (el núcleo no recibió ningún da` |
| `games/bastion/NOTAS.md` | 229 | `★` | Decoración o icono | `- **★★☆ (2 Estrellas):** Victoria sólida ($\ge 50\%$ de vidas restantes).` |
| `games/bastion/NOTAS.md` | 229 | `★` | Decoración o icono | `- **★★☆ (2 Estrellas):** Victoria sólida ($\ge 50\%$ de vidas restantes).` |
| `games/bastion/NOTAS.md` | 229 | `☆` | Decoración o icono | `- **★★☆ (2 Estrellas):** Victoria sólida ($\ge 50\%$ de vidas restantes).` |
| `games/bastion/NOTAS.md` | 230 | `★` | Decoración o icono | `- **★☆☆ (1 Estrella):** Victoria ajustada ($< 50\%$ de vidas restantes).` |
| `games/bastion/NOTAS.md` | 230 | `☆` | Decoración o icono | `- **★☆☆ (1 Estrella):** Victoria ajustada ($< 50\%$ de vidas restantes).` |
| `games/bastion/NOTAS.md` | 230 | `☆` | Decoración o icono | `- **★☆☆ (1 Estrella):** Victoria ajustada ($< 50\%$ de vidas restantes).` |
| `games/bastion/NOTAS.md` | 277 | `🪙` | Decoración o icono | `- '[+1000 🪙]' / Tecla '[G]': Inyección inmediata de 1000 de oro.` |
| `games/bastion/NOTAS.md` | 278 | `❤` | Decoración o icono | `- '[+50 ❤️]' / Tecla '[L]': Suma 50 vidas al núcleo y a la vida máxima.` |
| `games/bastion/NOTAS.md` | 279 | `⚡` | Decoración o icono | `- '[⚡ Saltar W]' / Tecla '[N]': Finaliza la oleada activa de inmediato.` |
| `games/bastion/NOTAS.md` | 280 | `💥` | Decoración o icono | `- '[💥 Nuke]' / Tecla '[K]': Aniquila instantáneamente a todas las criatura` |
| `games/bastion/NOTAS.md` | 281 | `⏩` | Decoración o icono | `- '[⏩ 5x]' / Tecla '[5]': Conmuta la velocidad de simulación a 5x ultrarráp` |
| `games/bastion/NOTAS.md` | 290 | `🏆` | Decoración o icono | `- **Sector 1 (Valle Prístino):** 🏆 Victoria \| 20/20 vidas (100%) \| 873 b` |
| `games/bastion/NOTAS.md` | 291 | `🏆` | Decoración o icono | `- **Sector 2 (Desfiladero de Obsidiana):** 🏆 Victoria \| 20/20 vidas (100%` |
| `games/bastion/NOTAS.md` | 292 | `🏆` | Decoración o icono | `- **Sector 3 (Ruinas del Nexo):** 🏆 Victoria \| 20/20 vidas (100%) \| 873 ` |
| `games/bastion/NOTAS.md` | 293 | `🏆` | Decoración o icono | `- **Sector 4 (Cripta de Cristal):** 🏆 Victoria \| 9/20 vidas (45%) \| 862 ` |
| `games/bastion/NOTAS.md` | 294 | `🏆` | Decoración o icono | `- **Sector 5 (Bastión Hundido):** 🏆 Victoria \| 20/20 vidas (100%) \| 873 ` |
| `games/bastion/NOTAS.md` | 295 | `🏆` | Decoración o icono | `- **Sector 6 (Núcleo del Cataclismo):** 🏆 Victoria \| 14/20 vidas (70%) \|` |
| `games/bastion/NOTAS.md` | 376 | `♾` | Icono de botón | `1. 'btn-victory-endless': **♾️ CONTINUAR EN MODO SIN FIN** (inicia la olead` |
| `games/bastion/NOTAS.md` | 377 | `🗺` | Icono de botón | `2. 'btn-victory-next': **🗺️ SIGUIENTE MAPA** (avanza al siguiente sector d` |
| `games/bastion/NOTAS.md` | 378 | `📋` | Icono de botón | `3. 'btn-victory-maps': **📋 MENÚ DE MAPAS** (abre la selección de escenario` |
| `games/bastion/NOTAS.md` | 403 | `✅` | Decoración o icono | `- ✅ Bug 5: Oleada 21 arranca correctamente con generación de enemigos, cons` |
| `games/bastion/NOTAS.md` | 404 | `✅` | Decoración o icono | `- ✅ Bug 6: Clamping de sacudida verificado, decaimiento a 0 exacto comproba` |
| `games/bastion/NOTAS.md` | 406 | `✅` | Decoración o icono | `- ✅ Solapamientos detectados: **0** en las 5 resoluciones probadas (360x640` |
| `games/bastion/NOTAS.md` | 407 | `✅` | Decoración o icono | `- ✅ Scroll horizontal en el body: **0** (sin desbordamientos involuntarios)` |
| `games/bastion/NOTAS.md` | 408 | `✅` | Decoración o icono | `- ✅ Botones con tamaño táctil inferior a $44 \times 44$ px: **0 de 20**.` |
| `games/bastion/NOTAS.md` | 410 | `✅` | Decoración o icono | `- ✅ **16/16 juegos pasaron exitosamente** sin errores en consola, con canva` |
| `games/bloques/index.html` | 138 | `←` | Decoración o icono | `<li><kbd>←</kbd><kbd>→</kbd> Mover</li>` |
| `games/bloques/index.html` | 138 | `→` | Decoración o icono | `<li><kbd>←</kbd><kbd>→</kbd> Mover</li>` |
| `games/bloques/index.html` | 139 | `↑` | Decoración o icono | `<li><kbd>↑</kbd> Rotar</li>` |
| `games/bloques/index.html` | 140 | `↓` | Decoración o icono | `<li><kbd>↓</kbd> Caída suave</li>` |
| `games/campominado/game.js` | 52 | `🎖` | Encabezado o título | `{ id: 'first_clear', title: 'Primer Sector', desc: 'Despeja tu primer campo` |
| `games/campominado/game.js` | 53 | `⚡` | Encabezado o título | `{ id: 'speed_demon', title: 'Artificiero Veloz', desc: 'Despeja el sector 9` |
| `games/campominado/game.js` | 54 | `🧠` | Encabezado o título | `{ id: 'guess_free', title: 'Lógica Pura', desc: 'Supera un sector sin utili` |
| `games/campominado/game.js` | 55 | `🔬` | Encabezado o título | `{ id: 'campaign_5', title: 'Cadete de Laboratorio', desc: 'Supera los prime` |
| `games/campominado/game.js` | 56 | `👑` | Encabezado o título | `{ id: 'campaign_20', title: 'Maestro del Sonar', desc: 'Completa los 20 sec` |
| `games/campominado/game.js` | 57 | `❄` | Encabezado o título | `{ id: 'no_flag_win', title: 'A Mente Fría', desc: 'Gana una partida sin col` |
| `games/campominado/game.js` | 58 | `🛡` | Encabezado o título | `{ id: 'hard_veteran', title: 'Misión Titán', desc: 'Supera el sector avanza` |
| `games/campominado/game.js` | 59 | `🔥` | Encabezado o título | `{ id: 'streak_3', title: 'En Racha', desc: 'Consigue 3 victorias consecutiv` |
| `games/campominado/game.js` | 501 | `😎` | Decoración o icono | `dom.faceIcon.textContent = '😎';` |
| `games/campominado/game.js` | 599 | `🚩` | Decoración o icono | `window.ArcadeJuice.spawnFloat(cell.flagged ? '🚩' : '❌', (c + 0.5) * cellW,` |
| `games/campominado/game.js` | 599 | `❌` | Decoración o icono | `window.ArcadeJuice.spawnFloat(cell.flagged ? '🚩' : '❌', (c + 0.5) * cellW,` |
| `games/campominado/game.js` | 651 | `😵` | Decoración o icono | `dom.faceIcon.textContent = '😵';` |
| `games/campominado/game.js` | 680 | `😎` | Decoración o icono | `dom.faceIcon.textContent = '😎';` |
| `games/campominado/game.js` | 696 | `🎖` | Decoración o icono | `window.ArcadeJuice.unlockAchievement('campominado', 'first_clear', 'Primer ` |
| `games/campominado/game.js` | 698 | `⚡` | Decoración o icono | `window.ArcadeJuice.unlockAchievement('campominado', 'speed_demon', 'Artific` |
| `games/campominado/game.js` | 701 | `🧠` | Decoración o icono | `window.ArcadeJuice.unlockAchievement('campominado', 'guess_free', 'Lógica P` |
| `games/campominado/game.js` | 704 | `❄` | Decoración o icono | `window.ArcadeJuice.unlockAchievement('campominado', 'no_flag_win', 'A Mente` |
| `games/campominado/game.js` | 707 | `🛡` | Decoración o icono | `window.ArcadeJuice.unlockAchievement('campominado', 'hard_veteran', 'Misión` |
| `games/campominado/game.js` | 719 | `🔬` | Decoración o icono | `window.ArcadeJuice.unlockAchievement('campominado', 'campaign_5', 'Cadete d` |
| `games/campominado/game.js` | 722 | `👑` | Decoración o icono | `window.ArcadeJuice.unlockAchievement('campominado', 'campaign_20', 'Maestro` |
| `games/campominado/game.js` | 984 | `🚩` | Decoración o icono | `dom.modeText.textContent = State.flagMode ? 'MODO: BANDERA 🚩' : 'MODO: REV` |
| `games/campominado/game.js` | 984 | `⛏` | Decoración o icono | `dom.modeText.textContent = State.flagMode ? 'MODO: BANDERA 🚩' : 'MODO: REV` |
| `games/campominado/game.js` | 1135 | `✓` | Encabezado o título | `<div class="ach-title">${ach.title} ${unlocked ? '✓' : '🔒'}</div>` |
| `games/campominado/game.js` | 1135 | `🔒` | Encabezado o título | `<div class="ach-title">${ach.title} ${unlocked ? '✓' : '🔒'}</div>` |
| `games/campominado/index.html` | 31 | `❓` | Decoración o icono | `❓` |
| `games/campominado/index.html` | 34 | `🏆` | Decoración o icono | `🏆` |
| `games/campominado/index.html` | 37 | `⚙` | Decoración o icono | `⚙️` |
| `games/campominado/index.html` | 80 | `😎` | Decoración o icono | `<span id="face-icon" class="face-emoji">😎</span>` |
| `games/campominado/index.html` | 84 | `📡` | Decoración o icono | `<span class="hint-icon">📡</span>` |
| `games/campominado/index.html` | 104 | `⛏` | Decoración o icono | `<span class="toggle-icon">⛏️</span>` |
| `games/campominado/index.html` | 127 | `🔍` | Decoración o icono | `<div class="tut-icon">🔍</div>` |
| `games/cargas/game.js` | 2638 | `▲` | Decoración o icono | `const arrow = conv.dir.r === -1 ? '▲' : conv.dir.r === 1 ? '▼' : conv.dir.c` |
| `games/cargas/game.js` | 2638 | `▼` | Decoración o icono | `const arrow = conv.dir.r === -1 ? '▲' : conv.dir.r === 1 ? '▼' : conv.dir.c` |
| `games/cargas/game.js` | 2638 | `◀` | Decoración o icono | `const arrow = conv.dir.r === -1 ? '▲' : conv.dir.r === 1 ? '▼' : conv.dir.c` |
| `games/cargas/game.js` | 2638 | `▶` | Decoración o icono | `const arrow = conv.dir.r === -1 ? '▲' : conv.dir.r === 1 ? '▼' : conv.dir.c` |
| `games/cargas/game.js` | 3584 | `🏆` | Encabezado o título | `showToast('🏆 ¡LOGRO DESBLOQUEADO: ${ach.title.toUpperCase()}!', 3.5);` |
| `games/cargas/game.js` | 3651 | `⭐` | Decoración o icono | `document.getElementById('result-desc').textContent = 'Estrellas: ${'⭐'.repe` |
| `games/cargas/game.js` | 3687 | `⚙` | Decoración o icono | `for (let i = 0; i < State.p1.lives; i++) icons += '⚙️';` |
| `games/cargas/game.js` | 3688 | `💀` | Decoración o icono | `document.getElementById('lives-val').textContent = icons \|\| '💀';` |
| `games/cargas/game.js` | 3892 | `⭐` | Decoración o icono | `<div class="chip-stars">${stars > 0 ? '⭐'.repeat(stars) : ''}</div>` |
| `games/cargas/game.js` | 4029 | `💎` | Decoración o icono | `{ key: 'radius', name: 'Radio de Resonancia', max: 3, baseCost: 150, icon: ` |
| `games/cargas/game.js` | 4030 | `💣` | Decoración o icono | `{ key: 'charges', name: 'Capacitador de Cargas', max: 3, baseCost: 200, ico` |
| `games/cargas/game.js` | 4031 | `⚡` | Decoración o icono | `{ key: 'speed', name: 'Servomotores de Botas', max: 3, baseCost: 150, icon:` |
| `games/cargas/game.js` | 4032 | `🧤` | Decoración o icono | `{ key: 'slide', name: 'Guantelete Magnético', max: 2, baseCost: 250, icon: ` |
| `games/cargas/game.js` | 4033 | `🛡` | Decoración o icono | `{ key: 'shield', name: 'Blindaje de Ingeniero', max: 2, baseCost: 350, icon` |
| `games/cargas/game.js` | 4053 | `⚙` | Decoración o icono | `${isMax ? 'MÁXIMO' : '${cost} ⚙️'}` |
| `games/cargas/game.js` | 4111 | `⚠` | Decoración o icono | `<div style="font-size:2.2rem;margin-bottom:8px;">⚠️</div>` |
| `games/cargas/index.html` | 33 | `⚙` | Decoración o icono | `<span class="hud-val lives-icons" id="lives-val">⚙️⚙️⚙️</span>` |
| `games/cargas/index.html` | 33 | `⚙` | Decoración o icono | `<span class="hud-val lives-icons" id="lives-val">⚙️⚙️⚙️</span>` |
| `games/cargas/index.html` | 33 | `⚙` | Decoración o icono | `<span class="hud-val lives-icons" id="lives-val">⚙️⚙️⚙️</span>` |
| `games/cargas/index.html` | 62 | `💎` | Decoración o icono | `<span class="equip-icon">💎</span>` |
| `games/cargas/index.html` | 66 | `💣` | Decoración o icono | `<span class="equip-icon">💣</span>` |
| `games/cargas/index.html` | 70 | `⚡` | Decoración o icono | `<span class="equip-icon">⚡</span>` |
| `games/cargas/index.html` | 74 | `📡` | Decoración o icono | `<span class="equip-icon" id="hud-remote-icon">📡</span>` |
| `games/cargas/index.html` | 89 | `▲` | Icono de botón | `<button class="dpad-btn dpad-up" id="btn-dpad-up" aria-label="Arriba">▲</bu` |
| `games/cargas/index.html` | 90 | `◀` | Icono de botón | `<button class="dpad-btn dpad-left" id="btn-dpad-left" aria-label="Izquierda` |
| `games/cargas/index.html` | 92 | `▶` | Icono de botón | `<button class="dpad-btn dpad-right" id="btn-dpad-right" aria-label="Derecha` |
| `games/cargas/index.html` | 93 | `▼` | Icono de botón | `<button class="dpad-btn dpad-down" id="btn-dpad-down" aria-label="Abajo">▼<` |
| `games/cargas/index.html` | 99 | `💣` | Icono de botón | `<span class="btn-glyph">💣</span>` |
| `games/cargas/index.html` | 103 | `📡` | Icono de botón | `<span class="btn-glyph">📡</span>` |
| `games/cargas/index.html` | 123 | `💎` | Decoración o icono | `<div class="rule-line"><span class="rule-sym">💎</span> <strong>Onda en Rom` |
| `games/cargas/index.html` | 124 | `💥` | Decoración o icono | `<div class="rule-line"><span class="rule-sym">💥</span> <strong>Empuje de N` |
| `games/cargas/index.html` | 125 | `⚡` | Decoración o icono | `<div class="rule-line"><span class="rule-sym">⚡</span> <strong>Resonancia e` |
| `games/cargas/index.html` | 126 | `🌐` | Decoración o icono | `<div class="rule-line"><span class="rule-sym">🌐</span> <strong>3 Mundos y ` |
| `games/cargas/index.html` | 141 | `⚙` | Icono de botón | `<button id="btn-open-shop" class="ind-btn btn-secondary">⚙️ TIENDA MEJORAS<` |
| `games/cargas/index.html` | 155 | `⚙` | Decoración o icono | `<span id="shop-credits-val" class="highlight">0</span> ⚙️` |
| `games/corredor/game.js` | 90 | `🏃` | Decoración o icono | `neo: { id: 'neo', name: 'Neo (Cian)', price: 0, avatar: '🏃', color: '#00f0` |
| `games/corredor/game.js` | 91 | `⚡` | Decoración o icono | `volt: { id: 'volt', name: 'Volt (Amarillo)', price: 150, avatar: '⚡', color` |
| `games/corredor/game.js` | 92 | `🔥` | Decoración o icono | `specter: { id: 'specter', name: 'Specter (Carmesí)', price: 300, avatar: '�` |
| `games/corredor/game.js` | 93 | `🛡` | Decoración o icono | `valkyrie: { id: 'valkyrie', name: 'Valkyrie (Esmeralda)', price: 500, avata` |
| `games/corredor/game.js` | 104 | `🧲` | Decoración o icono | `magnet: { id: 'magnet', name: 'Imán Potenciado', icon: '🧲', basePrice: 80,` |
| `games/corredor/game.js` | 105 | `🛡` | Decoración o icono | `shield: { id: 'shield', name: 'Escudo Robusto', icon: '🛡️', basePrice: 120` |
| `games/corredor/game.js` | 106 | `🪙` | Decoración o icono | `coinMultiplier: { id: 'coinMultiplier', name: 'Multiplicador Monedas', icon` |
| `games/corredor/game.js` | 646 | `🪙` | Decoración o icono | `window.ArcadeJuice?.spawnFloat('¡MISIÓN CUMPLIDA! +${bonusCoins}🪙', State.` |
| `games/corredor/game.js` | 674 | `🪐` | Decoración o icono | `dom.eventIcon.textContent = '🪐';` |
| `games/corredor/game.js` | 678 | `⚡` | Decoración o icono | `dom.eventIcon.textContent = '⚡';` |
| `games/corredor/game.js` | 691 | `🚀` | Decoración o icono | `dom.eventIcon.textContent = '🚀';` |
| `games/corredor/game.js` | 900 | `🪙` | Decoración o icono | `dom.finalCoinsVal.textContent = '🪙 ${State.coins}';` |
| `games/corredor/game.js` | 903 | `🪙` | Decoración o icono | `dom.finalBankVal.textContent = '🪙 ${State.saveData.wallet}';` |
| `games/corredor/game.js` | 939 | `🪙` | Decoración o icono | `dom.hudCoins.textContent = '🪙 ${State.coins}';` |
| `games/corredor/game.js` | 1366 | `🪙` | Decoración o icono | `window.ArcadeJuice?.spawnFloat('+2🪙', spk.x, spk.y, '#ffd700', 11);` |
| `games/corredor/game.js` | 1774 | `🚀` | Decoración o icono | `const icons = { TURBO: '🚀', SLOWMO: '⏳', SHIELD: '🛡️', MAGNET: '🧲' };` |
| `games/corredor/game.js` | 1774 | `⏳` | Decoración o icono | `const icons = { TURBO: '🚀', SLOWMO: '⏳', SHIELD: '🛡️', MAGNET: '🧲' };` |
| `games/corredor/game.js` | 1774 | `🛡` | Decoración o icono | `const icons = { TURBO: '🚀', SLOWMO: '⏳', SHIELD: '🛡️', MAGNET: '🧲' };` |
| `games/corredor/game.js` | 1774 | `🧲` | Decoración o icono | `const icons = { TURBO: '🚀', SLOWMO: '⏳', SHIELD: '🛡️', MAGNET: '🧲' };` |
| `games/corredor/game.js` | 1775 | `⚡` | Renderizado en Canvas | `ctx.fillText(icons[pw.type] \|\| '⚡', 0, 0);` |
| `games/corredor/game.js` | 2168 | `🪙` | Decoración o icono | `dom.startCoinsVal.textContent = '🪙 ${State.saveData.wallet}';` |
| `games/corredor/game.js` | 2198 | `🪙` | Decoración o icono | `${isEquipped ? 'EQUIPADO' : isUnlocked ? 'EQUIPAR' : '🪙 ${skin.price}'}` |
| `games/corredor/game.js` | 2233 | `✨` | Decoración o icono | `<span class="shop-card-icon">✨</span>` |
| `games/corredor/game.js` | 2240 | `🪙` | Decoración o icono | `${isEquipped ? 'EQUIPADO' : isUnlocked ? 'EQUIPAR' : '🪙 ${aura.price}'}` |
| `games/corredor/game.js` | 2283 | `🪙` | Decoración o icono | `${isMax ? 'MÁXIMO' : '🪙 ${cost}'}` |
| `games/corredor/game.js` | 2306 | `🏃` | Encabezado o título | `{ id: 'ach_takeoff', title: 'Primer Despegue', desc: 'Corre tus primeros 25` |
| `games/corredor/game.js` | 2307 | `🌀` | Encabezado o título | `{ id: 'ach_acrobat', title: 'Acróbata Urbano', desc: 'Ejecuta 10 dobles sal` |
| `games/corredor/game.js` | 2308 | `🛩` | Encabezado o título | `{ id: 'ach_drone', title: 'Bajo el Radar', desc: 'Esquiva un dron deslizánd` |
| `games/corredor/game.js` | 2309 | `🪙` | Encabezado o título | `{ id: 'ach_rich', title: 'Coleccionista de Créditos', desc: 'Acumula 100 mo` |
| `games/corredor/game.js` | 2310 | `🔥` | Encabezado o título | `{ id: 'ach_combo5', title: 'Racha Épica', desc: 'Alcanza el Combo x5 esquiv` |
| `games/corredor/game.js` | 2311 | `🏜` | Encabezado o título | `{ id: 'ach_canyon', title: 'Explorador del Cañón', desc: 'Llega al Cañón de` |
| `games/corredor/game.js` | 2312 | `⚡` | Encabezado o título | `{ id: 'ach_terminal', title: 'Velocidad Terminal', desc: 'Alcanza 650 px/s ` |
| `games/corredor/game.js` | 2313 | `🛒` | Encabezado o título | `{ id: 'ach_vip', title: 'Cliente VIP', desc: 'Desbloquea tu primera mejora ` |
| `games/corredor/game.js` | 2322 | `🔒` | Decoración o icono | `<span class="ach-icon">${unlocked ? ach.icon : '🔒'}</span>` |
| `games/corredor/game.js` | 2336 | `🎯` | Decoración o icono | `<span class="ach-icon">🎯</span>` |
| `games/corredor/game.js` | 2341 | `🪙` | Decoración o icono | `<span class="ach-status">${State.saveData.stats.totalDistance >= 1500 ? '¡L` |
| `games/corredor/game.js` | 2344 | `🌀` | Decoración o icono | `<span class="ach-icon">🌀</span>` |
| `games/corredor/game.js` | 2349 | `🪙` | Decoración o icono | `<span class="ach-status">${State.saveData.stats.totalFlips >= 15 ? '¡LISTO!` |
| `games/corredor/game.js` | 2352 | `⚡` | Decoración o icono | `<span class="ach-icon">⚡</span>` |
| `games/corredor/game.js` | 2357 | `🪙` | Decoración o icono | `<span class="ach-status">${State.saveData.stats.totalNearMisses >= 20 ? '¡L` |
| `games/corredor/index.html` | 31 | `🛒` | Decoración o icono | `🛒` |
| `games/corredor/index.html` | 34 | `🏆` | Decoración o icono | `🏆` |
| `games/corredor/index.html` | 37 | `⚙` | Decoración o icono | `⚙️` |
| `games/corredor/index.html` | 69 | `🛡` | Insignia o HUD de estadísticas | `<span class="badge-icon">🛡️</span>` |
| `games/corredor/index.html` | 73 | `🚀` | Insignia o HUD de estadísticas | `<span class="badge-icon">🚀</span>` |
| `games/corredor/index.html` | 77 | `⏳` | Insignia o HUD de estadísticas | `<span class="badge-icon">⏳</span>` |
| `games/corredor/index.html` | 81 | `🧲` | Insignia o HUD de estadísticas | `<span class="badge-icon">🧲</span>` |
| `games/corredor/index.html` | 89 | `🪙` | Decoración o icono | `<span class="hud-val" id="hud-coins">🪙 0</span>` |
| `games/corredor/index.html` | 95 | `🎯` | Decoración o icono | `<span class="mission-icon">🎯</span>` |
| `games/corredor/index.html` | 112 | `⚡` | Decoración o icono | `<span id="event-icon" class="event-icon">⚡</span>` |
| `games/corredor/index.html` | 119 | `🏃` | Decoración o icono | `<div class="glass-orb">🏃</div>` |
| `games/corredor/index.html` | 124 | `⚡` | Decoración o icono | `<span class="skin-avatar" id="start-skin-avatar">⚡</span>` |
| `games/corredor/index.html` | 134 | `👆` | Decoración o icono | `<span class="inst-key">👆 Toque</span>` |
| `games/corredor/index.html` | 138 | `👆` | Decoración o icono | `<span class="inst-key">👆 En el Aire</span>` |
| `games/corredor/index.html` | 142 | `👇` | Decoración o icono | `<span class="inst-key">👇 Desliza Abajo</span>` |
| `games/corredor/index.html` | 146 | `⚡` | Decoración o icono | `<span class="inst-key">⚡ Biomas</span>` |
| `games/corredor/index.html` | 151 | `▶` | Icono de botón | `<button type="button" id="btn-start-run" class="btn-launch">▶ INICIAR CARRE` |
| `games/corredor/index.html` | 154 | `🛒` | Icono de botón | `<button id="btn-open-shop" class="btn-secondary btn-half">🛒 TIENDA</button` |
| `games/corredor/index.html` | 155 | `📋` | Icono de botón | `<button id="btn-open-missions" class="btn-secondary btn-half">📋 MISIONES</` |
| `games/corredor/index.html` | 158 | `🪙` | Decoración o icono | `<div class="record-indicator">RÉCORD: <strong id="start-record-val">0</stro` |
| `games/corredor/index.html` | 188 | `🪙` | Decoración o icono | `<span id="final-coins-val" class="stat-big">🪙 0</span>` |
| `games/corredor/index.html` | 198 | `🪙` | Decoración o icono | `<span style="margin-left: 10px;">Saldo Total: <strong id="final-bank-val">�` |
| `games/corredor/index.html` | 203 | `🛒` | Icono de botón | `<button id="btn-go-shop" class="btn-secondary">🛒 Ir a la Tienda</button>` |
| `games/corredor/index.html` | 213 | `🛒` | Encabezado o título | `<h3>🛒 TIENDA CIBERNÉTICA</h3>` |
| `games/corredor/index.html` | 214 | `🪙` | Decoración o icono | `<div class="shop-wallet">🪙 <span id="shop-wallet-val">0</span></div>` |
| `games/corredor/index.html` | 251 | `🏆` | Encabezado o título | `<h3>🏆 LOGROS DEL CORREDOR</h3>` |
| `games/corredor/index.html` | 267 | `📋` | Encabezado o título | `<h3>📋 MISIONES DIARIAS</h3>` |
| `games/corredor/index.html` | 283 | `⚙` | Encabezado o título | `<h3>⚙️ AJUSTES Y ACCESIBILIDAD</h3>` |
| `games/corredor/NOTAS.md` | 9 | `🪙` | Decoración o icono | `- **Textos Flotantes**: Object pooling reutilizable para anuncios de combo ` |
| `games/corredor/NOTAS.md` | 9 | `🪙` | Decoración o icono | `- **Textos Flotantes**: Object pooling reutilizable para anuncios de combo ` |
| `games/corredor/NOTAS.md` | 38 | `🪐` | Decoración o icono | `1. *Zona de Baja Gravedad* (🪐): Reduce la gravedad un 45%, permitiendo sal` |
| `games/corredor/NOTAS.md` | 39 | `⚡` | Decoración o icono | `2. *Tormenta de Chispas* (⚡): Lluvia estelar con orbes dorados que suman mo` |
| `games/corredor/NOTAS.md` | 40 | `🚀` | Decoración o icono | `3. *Tramo Hipervelocidad* (🚀): Aceleración extrema instantánea con líneas ` |
| `games/cristales/game.js` | 1864 | `⚠` | Decoración o icono | `window.ArcadeJuice?.spawnFloat('⚠️ DESINCRONIZACIÓN DETECTADA', CONFIG.VIRT` |
| `games/cristales/game.js` | 2016 | `🌟` | Decoración o icono | `dom.resultIcon.textContent = '🌟';` |
| `games/cristales/game.js` | 2023 | `★` | Decoración o icono | `<span class="star-slot ${stars >= 1 ? 'filled' : 'empty'}">★</span>` |
| `games/cristales/game.js` | 2024 | `★` | Decoración o icono | `<span class="star-slot ${stars >= 2 ? 'filled' : 'empty'}">★</span>` |
| `games/cristales/game.js` | 2025 | `★` | Decoración o icono | `<span class="star-slot ${stars >= 3 ? 'filled' : 'empty'}">★</span>` |
| `games/cristales/game.js` | 2038 | `💔` | Decoración o icono | `dom.resultIcon.textContent = '💔';` |
| `games/cristales/game.js` | 2662 | `★` | Decoración o icono | `<span class="level-stars">${isUnlocked && stars > 0 ? '★'.repeat(stars) : '` |
| `games/cristales/game.js` | 2675 | `💎` | Encabezado o título | `{ id: 'ach_first_level', title: 'Primer Prisma', desc: 'Supera el nivel 1 d` |
| `games/cristales/game.js` | 2676 | `🌍` | Encabezado o título | `{ id: 'ach_world_clear', title: 'Maestro del Mundo', desc: 'Completa los 10` |
| `games/cristales/game.js` | 2677 | `⚡` | Encabezado o título | `{ id: 'ach_combo5', title: 'Reverberación', desc: 'Desata una reacción de C` |
| `games/cristales/game.js` | 2678 | `🌈` | Encabezado o título | `{ id: 'ach_color_bomb', title: 'Prisma Hipercromático', desc: 'Activa un Pr` |
| `games/cristales/game.js` | 2679 | `💥` | Encabezado o título | `{ id: 'ach_fusion', title: 'Fusión Especial', desc: 'Combina dos cristales ` |
| `games/cristales/game.js` | 2680 | `⏱` | Encabezado o título | `{ id: 'ach_endless_10k', title: 'Brillo Perpetuo', desc: 'Alcanza 10,000 pt` |
| `games/cristales/game.js` | 2681 | `⭐` | Encabezado o título | `{ id: 'ach_stars_30', title: 'Coleccionista de Estrellas', desc: 'Acumula 3` |
| `games/cristales/game.js` | 2682 | `🔨` | Encabezado o título | `{ id: 'ach_hammer', title: 'Artífice de Cuarzo', desc: 'Usa un Martillo de ` |
| `games/cristales/game.js` | 2691 | `🔒` | Decoración o icono | `<span class="ach-icon">${unlocked ? ach.icon : '🔒'}</span>` |
| `games/cristales/index.html` | 24 | `❤` | Decoración o icono | `<span class="heart-icon">❤️</span>` |
| `games/cristales/index.html` | 42 | `🏆` | Decoración o icono | `🏆` |
| `games/cristales/index.html` | 45 | `⚙` | Decoración o icono | `⚙️` |
| `games/cristales/index.html` | 67 | `🎯` | Decoración o icono | `<span class="goal-icon">🎯</span>` |
| `games/cristales/index.html` | 73 | `🔨` | Decoración o icono | `🔨 <span class="powerup-count" id="count-hammer">3</span>` |
| `games/cristales/index.html` | 76 | `🌀` | Decoración o icono | `🌀 <span class="powerup-count" id="count-shuffle">2</span>` |
| `games/cristales/index.html` | 79 | `🔄` | Decoración o icono | `🔄 <span class="powerup-count" id="count-swap">2</span>` |
| `games/cristales/index.html` | 88 | `✨` | Decoración o icono | `<span class="hint-sparkle">✨</span> Pista` |
| `games/cristales/index.html` | 101 | `💎` | Decoración o icono | `<div class="crystal-prism-icon">💎</div>` |
| `games/cristales/index.html` | 127 | `🎁` | Icono de botón | `<button id="btn-open-daily" class="glass-btn btn-secondary">🎁 Recompensa D` |
| `games/cristales/index.html` | 136 | `🎁` | Decoración o icono | `<div class="crystal-prism-icon">🎁</div>` |
| `games/cristales/index.html` | 140 | `🔨` | Decoración o icono | `<span style="font-size: 26px;">🔨 + 🔄</span>` |
| `games/cristales/index.html` | 140 | `🔄` | Decoración o icono | `<span style="font-size: 26px;">🔨 + 🔄</span>` |
| `games/cristales/index.html` | 150 | `💔` | Decoración o icono | `<div style="font-size: 40px; margin-bottom: 8px;">💔</div>` |
| `games/cristales/index.html` | 176 | `🌟` | Insignia o HUD de estadísticas | `<div id="result-icon" class="result-badge">🌟</div>` |
| `games/cristales/index.html` | 190 | `★` | Decoración o icono | `<span class="star-slot filled">★</span>` |
| `games/cristales/index.html` | 191 | `★` | Decoración o icono | `<span class="star-slot filled">★</span>` |
| `games/cristales/index.html` | 192 | `★` | Decoración o icono | `<span class="star-slot filled">★</span>` |
| `games/cristales/index.html` | 207 | `🏆` | Encabezado o título | `<h2 class="glass-title">🏆 LOGROS PRISMÁTICOS</h2>` |
| `games/cristales/index.html` | 221 | `⚙` | Encabezado o título | `<h2 class="glass-title">⚙️ AJUSTES Y ACCESIBILIDAD</h2>` |
| `games/defensaorbital/game.js` | 989 | `♥` | Decoración o icono | `hearts += i < this.lives ? '♥' : '♡';` |
| `games/defensaorbital/game.js` | 989 | `♡` | Decoración o icono | `hearts += i < this.lives ? '♥' : '♡';` |
| `games/defensaorbital/index.html` | 68 | `▶` | Icono de botón | `<button type="button" id="btn-start-game" class="btn-launch">▶ DESPEGAR MIS` |
| `games/defensaorbital/index.html` | 74 | `⚡` | Decoración o icono | `<span id="powerup-icon" class="powerup-icon">⚡</span>` |
| `games/defensaorbital/index.html` | 135 | `♥` | Decoración o icono | `<span id="lives-display" class="stat-value val-lives">♥♥♥</span>` |
| `games/defensaorbital/index.html` | 135 | `♥` | Decoración o icono | `<span id="lives-display" class="stat-value val-lives">♥♥♥</span>` |
| `games/defensaorbital/index.html` | 135 | `♥` | Decoración o icono | `<span id="lives-display" class="stat-value val-lives">♥♥♥</span>` |
| `games/derrape/game.js` | 2023 | `★` | Decoración o icono | `<span>★</span>` |
| `games/derrape/game.js` | 2349 | `🔇` | Decoración o icono | `this.btnSound.querySelector('.icon').textContent = isMuted ? '🔇' : '🔊';` |
| `games/derrape/game.js` | 2349 | `🔊` | Decoración o icono | `this.btnSound.querySelector('.icon').textContent = isMuted ? '🔇' : '🔊';` |
| `games/derrape/game.js` | 2576 | `★` | Decoración o icono | `this.lapBannerSubEl.textContent = '${formatTime(lapTime)}${isNewBest ? ' ★ ` |
| `games/derrape/game.js` | 2637 | `★` | Decoración o icono | `<span>Vuelta ${idx + 1}${isBest ? ' ★' : ''}</span>` |
| `games/derrape/index.html` | 29 | `🔊` | Decoración o icono | `<span class="icon">🔊</span>` |
| `games/derrape/index.html` | 32 | `⏸` | Decoración o icono | `<span class="icon">⏸</span>` |
| `games/derrape/index.html` | 107 | `◀` | Decoración o icono | `<span class="touch-hint">◀ GIRAR</span>` |
| `games/derrape/index.html` | 110 | `▶` | Decoración o icono | `<span class="touch-hint">GIRAR ▶</span>` |
| `games/derrape/index.html` | 115 | `🛑` | Icono de botón | `<span class="btn-icon">🛑</span>` |
| `games/derrape/index.html` | 119 | `⚡` | Icono de botón | `<span class="btn-icon">⚡</span>` |
| `games/derrape/index.html` | 128 | `🏎` | Insignia o HUD de estadísticas | `<div class="car-badge-icon">🏎️</div>` |
| `games/derrape/index.html` | 141 | `📱` | Decoración o icono | `<span class="inst-icon">📱</span>` |
| `games/derrape/index.html` | 145 | `💻` | Decoración o icono | `<span class="inst-icon">💻</span>` |
| `games/derrape/index.html` | 149 | `⚡` | Decoración o icono | `<span class="inst-icon">⚡</span>` |
| `games/derrape/index.html` | 178 | `🏁` | Insignia o HUD de estadísticas | `<div class="car-badge-icon">🏁</div>` |
| `games/derrape/index.html` | 213 | `▶` | Decoración o icono | `SIGUIENTE PISTA ▶` |
| `games/fronton/game.js` | 34 | `🤖` | Decoración o icono | `{ id: 'vector1', name: 'Vector-1', avatar: '🤖', desc: 'IA de prototipo con` |
| `games/fronton/game.js` | 35 | `⚡` | Decoración o icono | `{ id: 'aerobot', name: 'Aero-Bot', avatar: '⚡', desc: 'Ágil y rápido, busca` |
| `games/fronton/game.js` | 36 | `🌀` | Decoración o icono | `{ id: 'vortex',  name: 'Vortex',   avatar: '🌀', desc: 'Efectos giroscópico` |
| `games/fronton/game.js` | 37 | `🛡` | Decoración o icono | `{ id: 'ironguard', name: 'Iron-Guard', avatar: '🛡️', desc: 'Muralla defens` |
| `games/fronton/game.js` | 38 | `🔮` | Decoración o icono | `{ id: 'quantumx', name: 'Quantum-X', avatar: '🔮', desc: 'Maestro supremo: ` |
| `games/fronton/game.js` | 41 | `🎯` | Encabezado o título | `{ id: 'first_point', title: 'Primer Saque', desc: 'Anota tu primer punto en` |
| `games/fronton/game.js` | 42 | `⚡` | Encabezado o título | `{ id: 'rally_15', title: 'Maestro del Rally', desc: 'Alcanza un rally de 15` |
| `games/fronton/game.js` | 43 | `🚀` | Encabezado o título | `{ id: 'speed_650', title: 'Velocidad Supersónica', desc: 'Golpea la pelota ` |
| `games/fronton/game.js` | 44 | `👑` | Encabezado o título | `{ id: 'tournament_champ', title: 'Campeón del Torneo', desc: 'Vence a los 5` |
| `games/fronton/game.js` | 45 | `💠` | Encabezado o título | `{ id: 'survival_25', title: 'Superviviente Cuántico', desc: 'Resiste 25 reb` |
| `games/fronton/game.js` | 46 | `⭐` | Encabezado o título | `{ id: 'powerup_5', title: 'Sobrecarga Cuántica', desc: 'Recoge 5 power-ups ` |
| `games/fronton/game.js` | 47 | `🛡` | Encabezado o título | `{ id: 'goal_net_save', title: 'Salvada Épica', desc: 'Salva un punto con la` |
| `games/fronton/game.js` | 48 | `🏆` | Encabezado o título | `{ id: 'clean_sheet', title: 'Blanqueada Perfecta', desc: 'Gana un partido 7` |
| `games/fronton/game.js` | 450 | `↔` | Decoración o icono | `{ type: 'BIG_PADDLE', name: 'PALETA GRANDE', icon: '↔️', color: '#10b981' }` |
| `games/fronton/game.js` | 451 | `❄` | Decoración o icono | `{ type: 'SLOW_BALL',  name: 'PELOTA LENTA',  icon: '❄️', color: '#00f0ff' }` |
| `games/fronton/game.js` | 452 | `⚽` | Decoración o icono | `{ type: 'MULTI_BALL', name: 'MULTIPELOTA',   icon: '⚽', color: '#f59e0b' },` |
| `games/fronton/game.js` | 453 | `🛡` | Decoración o icono | `{ type: 'GOAL_NET',   name: 'RED DEFENSIVA', icon: '🛡️', color: '#ec4899' ` |
| `games/fronton/game.js` | 481 | `⭐` | Decoración o icono | `window.ArcadeJuice.unlockAchievement('fronton', 'powerup_5', 'Sobrecarga Cu` |
| `games/fronton/game.js` | 781 | `🚀` | Decoración o icono | `window.ArcadeJuice.unlockAchievement('fronton', 'speed_650', 'Velocidad Sup` |
| `games/fronton/game.js` | 787 | `⚡` | Decoración o icono | `window.ArcadeJuice.unlockAchievement('fronton', 'rally_15', 'Maestro del Ra` |
| `games/fronton/game.js` | 801 | `🛡` | Decoración o icono | `window.ArcadeJuice.unlockAchievement('fronton', 'goal_net_save', 'Salvada É` |
| `games/fronton/game.js` | 871 | `🎯` | Decoración o icono | `window.ArcadeJuice.unlockAchievement('fronton', 'first_point', 'Primer Saqu` |
| `games/fronton/game.js` | 951 | `👑` | Decoración o icono | `window.ArcadeJuice.unlockAchievement('fronton', 'tournament_champ', 'Campeó` |
| `games/fronton/game.js` | 963 | `🏆` | Decoración o icono | `window.ArcadeJuice.unlockAchievement('fronton', 'clean_sheet', 'Blanqueada ` |
| `games/fronton/game.js` | 1431 | `✓` | Decoración o icono | `<div class="rival-status">${isBeaten ? '✓ VENCIDO' : isCurrent ? 'ACTUAL' :` |
| `games/fronton/game.js` | 1446 | `✓` | Encabezado o título | `<div class="ach-title">${ach.title} ${unlocked ? '✓' : '🔒'}</div>` |
| `games/fronton/game.js` | 1446 | `🔒` | Encabezado o título | `<div class="ach-title">${ach.title} ${unlocked ? '✓' : '🔒'}</div>` |
| `games/fronton/index.html` | 31 | `🏆` | Decoración o icono | `🏆` |
| `games/fronton/index.html` | 34 | `⚙` | Decoración o icono | `⚙️` |
| `games/fronton/index.html` | 75 | `●` | Decoración o icono | `<span class="replay-dot">●</span> REPETICIÓN CÁMARA LENTA` |
| `games/fronton/index.html` | 80 | `⚡` | Decoración o icono | `<span id="powerup-icon">⚡</span>` |
| `games/fronton/index.html` | 132 | `▶` | Icono de botón | `<button type="button" id="btn-start-match" class="btn-serve">▶ INICIAR PART` |
| `games/fronton/index.html` | 134 | `📅` | Icono de botón | `<button type="button" id="btn-daily-missions" class="btn-subaction">📅 MISI` |
| `games/fronton/index.html` | 135 | `🏆` | Icono de botón | `<button type="button" id="btn-achievements-view" class="btn-subaction">🏆 L` |
| `games/fronton/index.html` | 217 | `★` | Decoración o icono | `<div id="new-record-tag" class="new-record-tag hidden">★ ¡NUEVO RÉCORD! ★</` |
| `games/fronton/index.html` | 217 | `★` | Decoración o icono | `<div id="new-record-tag" class="new-record-tag hidden">★ ¡NUEVO RÉCORD! ★</` |
| `games/fronton/NOTAS.md` | 23 | `↔` | Decoración o icono | `1. 'PALETA GRANDE' (↔️): Expande la paleta un 40% durante 10 segundos.` |
| `games/fronton/NOTAS.md` | 24 | `❄` | Decoración o icono | `2. 'PELOTA LENTA' (❄️): Frena la pelota devolviéndola a velocidad base.` |
| `games/fronton/NOTAS.md` | 25 | `⚽` | Decoración o icono | `3. 'MULTIPELOTA' (⚽): Duplica la pelota en juego con trayectorias cruzadas.` |
| `games/fronton/NOTAS.md` | 26 | `🛡` | Decoración o icono | `4. 'RED DEFENSIVA' (🛡️): Despliega una barrera de energía tras la paleta d` |
| `games/fronton/NOTAS.md` | 31 | `🤖` | Decoración o icono | `1. *Vector-1* (🤖): Prototipo con golpes suaves y predecibles.` |
| `games/fronton/NOTAS.md` | 32 | `⚡` | Decoración o icono | `2. *Aero-Bot* (⚡): Ágil y veloz con tiros cruzados.` |
| `games/fronton/NOTAS.md` | 33 | `🌀` | Decoración o icono | `3. *Vortex* (🌀): Efectos giroscópicos y rebotes en pared.` |
| `games/fronton/NOTAS.md` | 34 | `🛡` | Decoración o icono | `4. *Iron-Guard* (🛡️): Gran precisión y postura ultra-defensiva.` |
| `games/fronton/NOTAS.md` | 35 | `🔮` | Decoración o icono | `5. *Quantum-X* (🔮): Maestro supremo con aceleración cuántica y spin letal.` |
| `games/gotas/game.js` | 54 | `🟢` | Decoración o icono | `{ id: 1, name: 'JEFE 1: SORBETE', icon: '🟢', maxHp: 1200, trashInterval: 1` |
| `games/gotas/game.js` | 55 | `🧪` | Decoración o icono | `{ id: 2, name: 'JEFE 2: VISCOSA', icon: '🧪', maxHp: 2600, trashInterval: 1` |
| `games/gotas/game.js` | 56 | `🌊` | Decoración o icono | `{ id: 3, name: 'JEFE 3: MAELSTROM', icon: '🌊', maxHp: 4800, trashInterval:` |
| `games/gotas/game.js` | 57 | `⚡` | Decoración o icono | `{ id: 4, name: 'JEFE 4: PLASMA-CORE', icon: '⚡', maxHp: 7500, trashInterval` |
| `games/gotas/game.js` | 58 | `👑` | Decoración o icono | `{ id: 5, name: 'JEFE 5: TITANIUM BLOB', icon: '👑', maxHp: 11000, trashInte` |
| `games/gotas/game.js` | 63 | `🐣` | Decoración o icono | `{ id: 1, name: 'Novato Gel', icon: '🐣', reactionSpeed: 1.2, comboSkill: 0.` |
| `games/gotas/game.js` | 64 | `💧` | Decoración o icono | `{ id: 2, name: 'Aprendiz Aqua', icon: '💧', reactionSpeed: 0.9, comboSkill:` |
| `games/gotas/game.js` | 65 | `🧙` | Decoración o icono | `{ id: 3, name: 'Mago de Reacción', icon: '🧙‍♂️', reactionSpeed: 0.7, combo` |
| `games/gotas/game.js` | 65 | `♂` | Decoración o icono | `{ id: 3, name: 'Mago de Reacción', icon: '🧙‍♂️', reactionSpeed: 0.7, combo` |
| `games/gotas/game.js` | 66 | `⚗` | Decoración o icono | `{ id: 4, name: 'Maestra Alquimia', icon: '⚗️', reactionSpeed: 0.55, comboSk` |
| `games/gotas/game.js` | 67 | `🔮` | Decoración o icono | `{ id: 5, name: 'Oráculo Cuántico', icon: '🔮', reactionSpeed: 0.4, comboSki` |
| `games/gotas/game.js` | 2463 | `💧` | Encabezado o título | `{ id: 'ach_first_clear', title: 'Primera Mezcla', desc: 'Disuelve tu primer` |
| `games/gotas/game.js` | 2464 | `⚡` | Encabezado o título | `{ id: 'ach_chain3', title: 'Reacción en Cadena', desc: 'Consigue una Cascad` |
| `games/gotas/game.js` | 2465 | `🌊` | Encabezado o título | `{ id: 'ach_chain5', title: 'Maestro de Cascadas', desc: 'Consigue una Casca` |
| `games/gotas/game.js` | 2466 | `🌈` | Encabezado o título | `{ id: 'ach_rainbow', title: 'Prisma Gelatinoso', desc: 'Activa y disuelve c` |
| `games/gotas/game.js` | 2467 | `👾` | Encabezado o título | `{ id: 'ach_boss1', title: 'Cazador de Jefes', desc: 'Derrota al primer jefe` |
| `games/gotas/game.js` | 2468 | `👑` | Encabezado o título | `{ id: 'ach_boss_titan', title: 'Emperador Líquido', desc: 'Derrota al temid` |
| `games/gotas/game.js` | 2469 | `⏱` | Encabezado o título | `{ id: 'ach_time10k', title: 'Velocidad Líquida', desc: 'Consigue 10,000 pts` |
| `games/gotas/game.js` | 2470 | `⚔` | Encabezado o título | `{ id: 'ach_duel_master', title: 'Duelo Supremo', desc: 'Gana un duelo contr` |
| `games/gotas/game.js` | 2479 | `🔒` | Decoración o icono | `<span class="ach-icon">${unlocked ? ach.icon : '🔒'}</span>` |
| `games/gotas/index.html` | 31 | `📖` | Decoración o icono | `📖` |
| `games/gotas/index.html` | 34 | `🏆` | Decoración o icono | `🏆` |
| `games/gotas/index.html` | 37 | `⚙` | Decoración o icono | `⚙️` |
| `games/gotas/index.html` | 76 | `👾` | Decoración o icono | `<span class="boss-icon" id="boss-icon">👾</span>` |
| `games/gotas/index.html` | 92 | `⚠` | Decoración o icono | `⚠️ ¡BASURA LÍQUIDA ENTRANTE!` |
| `games/gotas/index.html` | 102 | `💧` | Decoración o icono | `<div class="gel-icon">💧</div>` |
| `games/gotas/index.html` | 121 | `↔` | Decoración o icono | `<span class="inst-key">↔ Deslizar</span>` |
| `games/gotas/index.html` | 125 | `👆` | Decoración o icono | `<span class="inst-key">👆 Toque</span>` |
| `games/gotas/index.html` | 129 | `👇` | Decoración o icono | `<span class="inst-key">👇 Deslizar Abajo</span>` |
| `games/gotas/index.html` | 133 | `🌈` | Decoración o icono | `<span class="inst-key">🌈 Gota Arcoíris</span>` |
| `games/gotas/index.html` | 138 | `▶` | Icono de botón | `<button type="button" id="btn-start" class="btn-play">▶ JUGAR AHORA</button` |
| `games/gotas/index.html` | 189 | `📖` | Encabezado o título | `<h3>📖 TUTORIAL: EL ARTE DE LAS CASCADAS</h3>` |
| `games/gotas/index.html` | 192 | `💧` | Decoración o icono | `<div class="tut-illustration">💧 💧 💧 💧</div>` |
| `games/gotas/index.html` | 192 | `💧` | Decoración o icono | `<div class="tut-illustration">💧 💧 💧 💧</div>` |
| `games/gotas/index.html` | 192 | `💧` | Decoración o icono | `<div class="tut-illustration">💧 💧 💧 💧</div>` |
| `games/gotas/index.html` | 192 | `💧` | Decoración o icono | `<div class="tut-illustration">💧 💧 💧 💧</div>` |
| `games/gotas/index.html` | 197 | `⚡` | Decoración o icono | `<div class="tut-illustration">⚡ 🌊 💥</div>` |
| `games/gotas/index.html` | 197 | `🌊` | Decoración o icono | `<div class="tut-illustration">⚡ 🌊 💥</div>` |
| `games/gotas/index.html` | 197 | `💥` | Decoración o icono | `<div class="tut-illustration">⚡ 🌊 💥</div>` |
| `games/gotas/index.html` | 202 | `🌈` | Decoración o icono | `<div class="tut-illustration">🌈 🧪 ✨</div>` |
| `games/gotas/index.html` | 202 | `🧪` | Decoración o icono | `<div class="tut-illustration">🌈 🧪 ✨</div>` |
| `games/gotas/index.html` | 202 | `✨` | Decoración o icono | `<div class="tut-illustration">🌈 🧪 ✨</div>` |
| `games/gotas/index.html` | 207 | `◀` | Icono de botón | `<button id="btn-tut-prev" class="btn-secondary" style="width: 80px;">◀ Ant<` |
| `games/gotas/index.html` | 209 | `▶` | Icono de botón | `<button id="btn-tut-next" class="btn-primary" style="width: 80px;">Sig ▶</b` |
| `games/gotas/index.html` | 221 | `🏆` | Encabezado o título | `<h3>🏆 LOGROS DE GOTAS</h3>` |
| `games/gotas/index.html` | 237 | `⚙` | Encabezado o título | `<h3>⚙️ AJUSTES Y ACCESIBILIDAD</h3>` |
| `games/gotas/index.html` | 272 | `◀` | Icono de botón | `<button id="btn-left" class="ctrl-btn" aria-label="Mover a la izquierda">◀<` |
| `games/gotas/index.html` | 273 | `🔄` | Icono de botón | `<button id="btn-rotate" class="ctrl-btn btn-act" aria-label="Rotar pareja">` |
| `games/gotas/index.html` | 274 | `▶` | Icono de botón | `<button id="btn-right" class="ctrl-btn" aria-label="Mover a la derecha">▶</` |
| `games/gotas/index.html` | 275 | `▼` | Icono de botón | `<button id="btn-drop" class="ctrl-btn btn-down" aria-label="Bajar rápido">▼` |
| `games/lanzaburbujas/game.js` | 67 | `🫧` | Encabezado o título | `{ id: 'FIRST_POP', icon: '🫧', title: 'Primer Estallido', desc: 'Revienta t` |
| `games/lanzaburbujas/game.js` | 68 | `📐` | Encabezado o título | `{ id: 'BANK_SHOT', icon: '📐', title: 'Tiro con Rebote', desc: 'Revienta un` |
| `games/lanzaburbujas/game.js` | 69 | `🌧` | Encabezado o título | `{ id: 'BUBBLE_RAIN', icon: '🌧️', title: 'Lluvia Marina', desc: 'Desprende ` |
| `games/lanzaburbujas/game.js` | 70 | `⭐` | Encabezado o título | `{ id: 'SNIPER', icon: '⭐', title: 'Francotirador Acuático', desc: 'Consigue` |
| `games/lanzaburbujas/game.js` | 71 | `🦑` | Encabezado o título | `{ id: 'KRAKEN_SLAYER', icon: '🦑', title: 'Maestro de la Laguna', desc: 'De` |
| `games/lanzaburbujas/game.js` | 72 | `🔱` | Encabezado o título | `{ id: 'ABYSS_CONQUEROR', icon: '🔱', title: 'Conquistador Abisal', desc: 'S` |
| `games/lanzaburbujas/game.js` | 73 | `💣` | Encabezado o título | `{ id: 'BOOSTER_MASTER', icon: '💣', title: 'Artillero Experto', desc: 'Util` |
| `games/lanzaburbujas/game.js` | 74 | `🔥` | Encabezado o título | `{ id: 'COMBO_STREAK', icon: '🔥', title: 'Racha Imparable', desc: 'Consigue` |
| `games/lanzaburbujas/game.js` | 1687 | `🫧` | Decoración o icono | `dom.resultIcon.textContent = isVictory ? '🫧' : '💥';` |
| `games/lanzaburbujas/game.js` | 1687 | `💥` | Decoración o icono | `dom.resultIcon.textContent = isVictory ? '🫧' : '💥';` |
| `games/lanzaburbujas/game.js` | 1699 | `★` | Decoración o icono | `starSpan.textContent = '★';` |
| `games/lanzaburbujas/game.js` | 1748 | `🏆` | Encabezado o título | `spawnFloatingText(State.boardW / 2, 80, '🏆 ¡LOGRO: ${ach.title}!', '#ffcc0` |
| `games/lanzaburbujas/game.js` | 2604 | `★` | Decoración o icono | `starsSpan.textContent = rec.stars > 0 ? '★'.repeat(rec.stars) : (isUnlocked` |
| `games/lanzaburbujas/game.js` | 2604 | `🔒` | Decoración o icono | `starsSpan.textContent = rec.stars > 0 ? '★'.repeat(rec.stars) : (isUnlocked` |
| `games/lanzaburbujas/index.html` | 33 | `🏆` | Decoración o icono | `🏆` |
| `games/lanzaburbujas/index.html` | 36 | `⚙` | Decoración o icono | `⚙️` |
| `games/lanzaburbujas/index.html` | 69 | `🦑` | Decoración o icono | `<span class="boss-icon">🦑</span>` |
| `games/lanzaburbujas/index.html` | 77 | `⚠` | Decoración o icono | `⚠️ ¡ATAQUE INMINENTE EN EL PRÓXIMO TIRO!` |
| `games/lanzaburbujas/index.html` | 90 | `⇄` | Decoración o icono | `<span class="flank-icon">⇄</span>` |
| `games/lanzaburbujas/index.html` | 94 | `🎯` | Decoración o icono | `<span class="booster-icon">🎯</span>` |
| `games/lanzaburbujas/index.html` | 106 | `💣` | Decoración o icono | `<span class="booster-icon">💣</span>` |
| `games/lanzaburbujas/index.html` | 111 | `🌈` | Decoración o icono | `<span class="booster-icon">🌈</span>` |
| `games/lanzaburbujas/index.html` | 123 | `🫧` | Decoración o icono | `<div class="bubble-sphere-icon">🫧</div>` |
| `games/lanzaburbujas/index.html` | 149 | `🎁` | Icono de botón | `<button id="btn-open-daily" class="glass-btn btn-secondary">🎁 Desafío Diar` |
| `games/lanzaburbujas/index.html` | 158 | `🎁` | Decoración o icono | `<div class="bubble-sphere-icon">🎁</div>` |
| `games/lanzaburbujas/index.html` | 162 | `💣` | Decoración o icono | `<span style="font-size: 26px;">💣 + 🌈 + 🎯</span>` |
| `games/lanzaburbujas/index.html` | 162 | `🌈` | Decoración o icono | `<span style="font-size: 26px;">💣 + 🌈 + 🎯</span>` |
| `games/lanzaburbujas/index.html` | 162 | `🎯` | Decoración o icono | `<span style="font-size: 26px;">💣 + 🌈 + 🎯</span>` |
| `games/lanzaburbujas/index.html` | 187 | `🎉` | Insignia o HUD de estadísticas | `<div id="result-icon" class="result-badge">🎉</div>` |
| `games/lanzaburbujas/index.html` | 201 | `★` | Decoración o icono | `<span class="star-slot filled">★</span>` |
| `games/lanzaburbujas/index.html` | 202 | `★` | Decoración o icono | `<span class="star-slot filled">★</span>` |
| `games/lanzaburbujas/index.html` | 203 | `★` | Decoración o icono | `<span class="star-slot filled">★</span>` |
| `games/lanzaburbujas/index.html` | 218 | `🏆` | Encabezado o título | `<h2 class="glass-title">🏆 LOGROS SUBMARINOS</h2>` |
| `games/lanzaburbujas/index.html` | 232 | `⚙` | Encabezado o título | `<h2 class="glass-title">⚙️ AJUSTES Y ACCESIBILIDAD</h2>` |
| `games/lumen/game.js` | 64 | `🟡` | Encabezado o título | `{ id: 'FIRST_DOT', icon: '🟡', title: 'Primer Bocado', desc: 'Devora tu pri` |
| `games/lumen/game.js` | 65 | `🏮` | Encabezado o título | `{ id: 'POWER_UP', icon: '🏮', title: 'Super Luz', desc: 'Consume un Super O` |
| `games/lumen/game.js` | 66 | `👻` | Encabezado o título | `{ id: 'EAT_SHADOW', icon: '👻', title: 'Cazador de Sombras', desc: 'Devora ` |
| `games/lumen/game.js` | 67 | `⚡` | Encabezado o título | `{ id: 'COMBO_4', icon: '⚡', title: 'Banquete Cuádruple', desc: 'Devora las ` |
| `games/lumen/game.js` | 68 | `💎` | Encabezado o título | `{ id: 'FRUIT_COLLECT', icon: '💎', title: 'Tesoro Arcano', desc: 'Recoge un` |
| `games/lumen/game.js` | 69 | `🌀` | Encabezado o título | `{ id: 'TUNNEL_ESCAPE', icon: '🌀', title: 'Escape Cuántico', desc: 'Cruza u` |
| `games/lumen/game.js` | 70 | `🌟` | Encabezado o título | `{ id: 'PERFECT_CLEAR', icon: '🌟', title: 'Comedor Impecable', desc: 'Limpi` |
| `games/lumen/game.js` | 71 | `🌿` | Encabezado o título | `{ id: 'WORLD_1', icon: '🌿', title: 'Amo del Bosque', desc: 'Supera el Mund` |
| `games/lumen/game.js` | 72 | `🏆` | Encabezado o título | `{ id: 'SCORE_10K', icon: '🏆', title: 'Maestro del Laberinto', desc: 'Super` |
| `games/lumen/game.js` | 73 | `👑` | Encabezado o título | `{ id: 'PAC_LEGEND', icon: '👑', title: 'Leyenda de Luz', desc: 'Supera 10 n` |
| `games/lumen/game.js` | 894 | `💎` | Decoración o icono | `showFloatingText(7 * CONFIG.TILE_SIZE + 11, 11 * CONFIG.TILE_SIZE + 11, '💎` |
| `games/lumen/game.js` | 1437 | `🟡` | Decoración o icono | `for (let i = 0; i < State.lives; i++) icons += '🟡';` |
| `games/lumen/game.js` | 1438 | `💀` | Decoración o icono | `livesEl.textContent = icons \|\| '💀';` |
| `games/lumen/game.js` | 1457 | `🏆` | Encabezado o título | `showFloatingText(CONFIG.VIRTUAL_W / 2, 40, '🏆 ¡${ach.title}!', '#ffea00');` |
| `games/lumen/game.js` | 1645 | `▶` | Decoración o icono | `<span class="level-stars">${isCurrent ? '▶' : '★'}</span>` |
| `games/lumen/game.js` | 1645 | `★` | Decoración o icono | `<span class="level-stars">${isCurrent ? '▶' : '★'}</span>` |
| `games/lumen/game.js` | 1670 | `🏆` | Decoración o icono | `<span style="font-size:20px;">${unlocked ? '🏆' : '🔒'}</span>` |
| `games/lumen/game.js` | 1670 | `🔒` | Decoración o icono | `<span style="font-size:20px;">${unlocked ? '🏆' : '🔒'}</span>` |
| `games/lumen/index.html` | 33 | `🕯` | Decoración o icono | `<span class="hud-val lives-icons" id="lives-val">🕯️🕯️🕯️</span>` |
| `games/lumen/index.html` | 33 | `🕯` | Decoración o icono | `<span class="hud-val lives-icons" id="lives-val">🕯️🕯️🕯️</span>` |
| `games/lumen/index.html` | 33 | `🕯` | Decoración o icono | `<span class="hud-val lives-icons" id="lives-val">🕯️🕯️🕯️</span>` |
| `games/lumen/index.html` | 38 | `🏆` | Decoración o icono | `🏆` |
| `games/lumen/index.html` | 41 | `⚙` | Decoración o icono | `⚙️` |
| `games/lumen/index.html` | 78 | `▲` | Icono de botón | `<button class="dpad-btn dpad-up" id="btn-dpad-up" aria-label="Arriba">▲</bu` |
| `games/lumen/index.html` | 79 | `◀` | Icono de botón | `<button class="dpad-btn dpad-left" id="btn-dpad-left" aria-label="Izquierda` |
| `games/lumen/index.html` | 81 | `▶` | Icono de botón | `<button class="dpad-btn dpad-right" id="btn-dpad-right" aria-label="Derecha` |
| `games/lumen/index.html` | 82 | `▼` | Icono de botón | `<button class="dpad-btn dpad-down" id="btn-dpad-down" aria-label="Abajo">▼<` |
| `games/lumen/index.html` | 89 | `✕` | Icono de botón | `<button id="btn-close-start-card" style="position:absolute;top:10px;right:1` |
| `games/lumen/index.html` | 91 | `🏮` | Decoración o icono | `<div class="lantern-glow-icon">🏮</div>` |
| `games/lumen/index.html` | 119 | `🎁` | Icono de botón | `<button id="btn-open-daily" class="neon-btn btn-secondary">🎁 Desafío Diari` |
| `games/lumen/index.html` | 127 | `✨` | Decoración o icono | `<div class="lantern-glow-icon">✨</div>` |
| `games/lumen/index.html` | 139 | `📅` | Decoración o icono | `<div class="lantern-glow-icon">📅</div>` |
| `games/lumen/index.html` | 143 | `🏮` | Decoración o icono | `<span style="font-size: 26px;">🏮 + ⚡ + ✨</span>` |
| `games/lumen/index.html` | 143 | `⚡` | Decoración o icono | `<span style="font-size: 26px;">🏮 + ⚡ + ✨</span>` |
| `games/lumen/index.html` | 143 | `✨` | Decoración o icono | `<span style="font-size: 26px;">🏮 + ⚡ + ✨</span>` |
| `games/lumen/index.html` | 168 | `🏮` | Insignia o HUD de estadísticas | `<div id="result-icon" class="result-badge">🏮</div>` |
| `games/lumen/index.html` | 186 | `★` | Decoración o icono | `<span class="star-slot filled">★</span>` |
| `games/lumen/index.html` | 187 | `★` | Decoración o icono | `<span class="star-slot filled">★</span>` |
| `games/lumen/index.html` | 188 | `★` | Decoración o icono | `<span class="star-slot filled">★</span>` |
| `games/lumen/index.html` | 203 | `🏆` | Encabezado o título | `<h2 class="neon-title">🏆 LOGROS DE LA LUZ</h2>` |
| `games/lumen/index.html` | 217 | `⚙` | Encabezado o título | `<h2 class="neon-title">⚙️ AJUSTES Y ACCESIBILIDAD</h2>` |
| `games/rompemuros/game.js` | 349 | `↔` | Decoración o icono | `document.getElementById('powerup-icon').textContent = '↔';` |
| `games/rompemuros/game.js` | 353 | `⏱` | Decoración o icono | `document.getElementById('powerup-icon').textContent = '⏱';` |
| `games/rompemuros/game.js` | 485 | `♥` | Decoración o icono | `hearts += i < this.lives ? '♥' : '♡';` |
| `games/rompemuros/game.js` | 485 | `♡` | Decoración o icono | `hearts += i < this.lives ? '♥' : '♡';` |
| `games/rompemuros/game.js` | 826 | `↔` | Decoración o icono | `let pSymbol = '↔';` |
| `games/rompemuros/game.js` | 827 | `⏱` | Decoración o icono | `if (p.type === 'SLOW') { pColor = '#00f0ff'; pSymbol = '⏱'; }` |
| `games/rompemuros/game.js` | 828 | `●` | Decoración o icono | `if (p.type === 'MULTIBALL') { pColor = '#00e676'; pSymbol = '●●'; }` |
| `games/rompemuros/game.js` | 828 | `●` | Decoración o icono | `if (p.type === 'MULTIBALL') { pColor = '#00e676'; pSymbol = '●●'; }` |
| `games/rompemuros/index.html` | 62 | `⚡` | Decoración o icono | `<span id="powerup-icon" class="powerup-icon">⚡</span>` |
| `games/rompemuros/index.html` | 128 | `♥` | Decoración o icono | `<span id="lives-display" class="stat-value val-lives">♥♥♥</span>` |
| `games/rompemuros/index.html` | 128 | `♥` | Decoración o icono | `<span id="lives-display" class="stat-value val-lives">♥♥♥</span>` |
| `games/rompemuros/index.html` | 128 | `♥` | Decoración o icono | `<span id="lives-display" class="stat-value val-lives">♥♥♥</span>` |
| `games/rompemuros/index.html` | 140 | `◄` | Decoración o icono | `<li><kbd>◄</kbd><kbd>►</kbd> o Ratón Mover</li>` |
| `games/rompemuros/index.html` | 140 | `►` | Decoración o icono | `<li><kbd>◄</kbd><kbd>►</kbd> o Ratón Mover</li>` |
| `games/snake/index.html` | 124 | `▲` | Decoración o icono | `<li><kbd>▲</kbd><kbd>▼</kbd><kbd>◄</kbd><kbd>►</kbd> Dirección</li>` |
| `games/snake/index.html` | 124 | `▼` | Decoración o icono | `<li><kbd>▲</kbd><kbd>▼</kbd><kbd>◄</kbd><kbd>►</kbd> Dirección</li>` |
| `games/snake/index.html` | 124 | `◄` | Decoración o icono | `<li><kbd>▲</kbd><kbd>▼</kbd><kbd>◄</kbd><kbd>►</kbd> Dirección</li>` |
| `games/snake/index.html` | 124 | `►` | Decoración o icono | `<li><kbd>▲</kbd><kbd>▼</kbd><kbd>◄</kbd><kbd>►</kbd> Dirección</li>` |
| `games/sombras/game.js` | 2869 | `♥` | Decoración o icono | `if (this.livesDisplay) this.livesDisplay.textContent = '♥'.repeat(Math.max(` |
| `games/sombras/index.html` | 77 | `⚡` | Icono de botón | `<span class="btn-icon">⚡</span>` |
| `games/sombras/index.html` | 82 | `🎯` | Icono de botón | `<span class="btn-icon">🎯</span>` |
| `games/sombras/index.html` | 172 | `♥` | Decoración o icono | `<span id="lives-display" class="stat-value val-lives">♥♥♥</span>` |
| `games/sombras/index.html` | 172 | `♥` | Decoración o icono | `<span id="lives-display" class="stat-value val-lives">♥♥♥</span>` |
| `games/sombras/index.html` | 172 | `♥` | Decoración o icono | `<span id="lives-display" class="stat-value val-lives">♥♥♥</span>` |
| `index.html` | 26 | `●` | Decoración o icono | `<span class="offline-pill">● OFFLINE</span>` |
| `README.md` | 123 | `◀` | Decoración o icono | `- En cada juego, el botón **◀ (Volver)** en la barra superior te regresa al` |
| `README.md` | 128 | `←` | Decoración o icono | `\| Mover lateralmente \| Flechas '←' '→' / 'A' 'D' \| Botones '◀' '▶' (mant` |
| `README.md` | 128 | `→` | Decoración o icono | `\| Mover lateralmente \| Flechas '←' '→' / 'A' 'D' \| Botones '◀' '▶' (mant` |
| `README.md` | 128 | `◀` | Decoración o icono | `\| Mover lateralmente \| Flechas '←' '→' / 'A' 'D' \| Botones '◀' '▶' (mant` |
| `README.md` | 128 | `▶` | Decoración o icono | `\| Mover lateralmente \| Flechas '←' '→' / 'A' 'D' \| Botones '◀' '▶' (mant` |
| `README.md` | 129 | `↑` | Decoración o icono | `\| Rotar horario \| Flecha '↑' / 'W' \| Botón grande '↻ ROTAR' \|` |
| `README.md` | 129 | `↻` | Decoración o icono | `\| Rotar horario \| Flecha '↑' / 'W' \| Botón grande '↻ ROTAR' \|` |
| `README.md` | 130 | `↺` | Decoración o icono | `\| Rotar antihorario \| Tecla 'Z' / 'Q' \| Botón pequeño '↺' \|` |
| `README.md` | 131 | `↓` | Decoración o icono | `\| Caída suave \| Flecha '↓' / 'S' \| Botón '▼' (mantener) \|` |
| `README.md` | 131 | `▼` | Decoración o icono | `\| Caída suave \| Flecha '↓' / 'S' \| Botón '▼' (mantener) \|` |
| `README.md` | 132 | `⚡` | Decoración o icono | `\| Caída instantánea \| Barra 'Espacio' \| Botón '⚡ CAÍDA' \|` |
| `README.md` | 138 | `↑` | Decoración o icono | `\| Cambiar dirección \| Flechas '↑' '↓' '←' '→' / 'W' 'A' 'S' 'D' \| Desliz` |
| `README.md` | 138 | `↓` | Decoración o icono | `\| Cambiar dirección \| Flechas '↑' '↓' '←' '→' / 'W' 'A' 'S' 'D' \| Desliz` |
| `README.md` | 138 | `←` | Decoración o icono | `\| Cambiar dirección \| Flechas '↑' '↓' '←' '→' / 'W' 'A' 'S' 'D' \| Desliz` |
| `README.md` | 138 | `→` | Decoración o icono | `\| Cambiar dirección \| Flechas '↑' '↓' '←' '→' / 'W' 'A' 'S' 'D' \| Desliz` |
| `README.md` | 145 | `←` | Decoración o icono | `\| Mover paleta \| Flechas '←' '→' / 'A' 'D' / Ratón \| Deslizar o arrastra` |
| `README.md` | 145 | `→` | Decoración o icono | `\| Mover paleta \| Flechas '←' '→' / 'A' 'D' / Ratón \| Deslizar o arrastra` |
| `README.md` | 153 | `↑` | Decoración o icono | `\| Moverse \| Flechas '↑' '↓' '←' '→' / 'W' 'A' 'S' 'D' \| Joystick virtual` |
| `README.md` | 153 | `↓` | Decoración o icono | `\| Moverse \| Flechas '↑' '↓' '←' '→' / 'W' 'A' 'S' 'D' \| Joystick virtual` |
| `README.md` | 153 | `←` | Decoración o icono | `\| Moverse \| Flechas '↑' '↓' '←' '→' / 'W' 'A' 'S' 'D' \| Joystick virtual` |
| `README.md` | 153 | `→` | Decoración o icono | `\| Moverse \| Flechas '↑' '↓' '←' '→' / 'W' 'A' 'S' 'D' \| Joystick virtual` |
| `README.md` | 154 | `⚡` | Decoración o icono | `\| Sprint \| Mantener 'Shift' \| Botón táctil '⚡ SPRINT' \|` |
| `README.md` | 155 | `🎯` | Decoración o icono | `\| Lanzar distractor \| Barra 'Espacio' \| Botón táctil '🎯 DISTRAER' \|` |
| `README.md` | 156 | `🎨` | Decoración o icono | `\| Cambiar traje (Skin) \| Tecla 'C' \| Botón '🎨' en barra superior \|` |
| `scripts/simulate_bastion.js` | 153 | `🏆` | Decoración o icono | `const status = res.victory ? '🏆 VICTORIA' : (res.gameOver ? '💀 DERROTA' :` |
| `scripts/simulate_bastion.js` | 153 | `💀` | Decoración o icono | `const status = res.victory ? '🏆 VICTORIA' : (res.gameOver ? '💀 DERROTA' :` |
| `scripts/simulate_bastion.js` | 153 | `⏱` | Decoración o icono | `const status = res.victory ? '🏆 VICTORIA' : (res.gameOver ? '💀 DERROTA' :` |
| `scripts/simulate_bastion.js` | 176 | `⚠` | Decoración o icono | `console.log('   ⚠️ MAPA POSIBLEMENTE IMPOSIBLE: No logró superar las oleada` |
| `scripts/simulate_bastion.js` | 178 | `✨` | Decoración o icono | `console.log('   ✨ MAPA DOMINADO (3 Estrellas Flawless con estrategia óptima` |
| `scripts/simulate_bastion.js` | 184 | `✅` | Decoración o icono | `console.log('✅ BALANCE VERIFICADO: Ningún mapa es imposible. Todos los sect` |
| `scripts/simulate_bastion.js` | 186 | `❌` | Decoración o icono | `console.error('❌ ADVERTENCIA DE BALANCE: Se detectaron mapas con dificultad` |
| `scripts/simulate_bastion.js` | 191 | `✅` | Decoración o icono | `console.log('✅ SIMULACIÓN EXITOSA: La campaña de 6 mapas está equilibrada y` |
| `scripts/simulate_bastion.js` | 193 | `⚠` | Decoración o icono | `console.log('⚠️ Algunos mapas requirieron micro-gestión manual o murieron a` |
| `scripts/smoke.js` | 283 | `❌` | Decoración o icono | `console.error('❌ Error: No Chrome or Edge executable found. Set CHROME_PATH` |
| `scripts/smoke.js` | 289 | `❌` | Decoración o icono | `console.error('❌ Error: games.json not found at ${GAMES_JSON_PATH}');` |
| `scripts/smoke.js` | 337 | `✅` | Decoración o icono | `const statusStr = res.passed ? '✅ OK' : '❌ FAIL';` |
| `scripts/smoke.js` | 337 | `❌` | Decoración o icono | `const statusStr = res.passed ? '✅ OK' : '❌ FAIL';` |
| `scripts/smoke.js` | 344 | `⚠` | Decoración o icono | `console.log('      ⚠️  ${err}');` |
| `scripts/smoke.js` | 363 | `❌` | Decoración o icono | `console.log('\n❌ Fallaron uno o más juegos en la prueba de humo.');` |
| `scripts/smoke.js` | 366 | `🎉` | Decoración o icono | `console.log('\n🎉 ¡TODOS LOS JUEGOS PASARON LA PRUEBA DE HUMO (0 errores, c` |
| `scripts/test_all_features.js` | 25 | `🚨` | Decoración o icono | `console.error('🚨 INVARIANT A BROKEN [Empty cell after resolution] in ${con` |
| `scripts/test_all_features.js` | 85 | `💥` | Decoración o icono | `console.log('💥 REPRODUCED INVARIANT A BREAK in DoubleSpecial (${s1} + ${s2` |
| `scripts/test_all_features.js` | 109 | `💥` | Decoración o icono | `console.log('💥 REPRODUCED INVARIANT A BREAK in ColorPrism! Empty cells lef` |
| `scripts/test_all_features.js` | 123 | `💥` | Decoración o icono | `console.log('💥 REPRODUCED INVARIANT A BREAK in Hammer! Empty cell left on ` |
| `scripts/test_bastion_bugs.js` | 9 | `🧪` | Decoración o icono | `console.log('🧪 Iniciando verificación y pruebas de Bugs 5 y 6 en Bastión..` |
| `scripts/test_bastion_bugs.js` | 69 | `✅` | Decoración o icono | `console.log('✅ BUG 5 SOLUCIONADO: Oleada 21 en marcha con ${game.enemies.le` |
| `scripts/test_bastion_bugs.js` | 125 | `✅` | Decoración o icono | `console.log('✅ BUG 6 SOLUCIONADO: Temblor acotado, decayendo a 0 exacto y r` |
| `scripts/test_bastion_bugs.js` | 138 | `🎉` | Decoración o icono | `console.log('🎉 Todas las pruebas de bugs en Bastión pasaron exitosamente.'` |
| `scripts/test_bastion_layout.js` | 105 | `📱` | Decoración o icono | `console.log('📱 Iniciando diagnóstico de layout para Bastión (Prefijo: ${pr` |
| `scripts/test_bastion_layout.js` | 109 | `❌` | Decoración o icono | `console.error('❌ No se encontró ejecutable de Chrome');` |
| `scripts/test_bastion_layout.js` | 159 | `📸` | Decoración o icono | `console.log('📸 Captura guardada en: ${screenshotPath}');` |
| `scripts/test_bastion_layout.js` | 307 | `⚠` | Decoración o icono | `console.log('Scroll horizontal: ${metrics.hasHorizontalScroll ? '⚠️ SÍ (' +` |
| `scripts/test_bastion_layout.js` | 307 | `✅` | Decoración o icono | `console.log('Scroll horizontal: ${metrics.hasHorizontalScroll ? '⚠️ SÍ (' +` |
| `scripts/test_bastion_layout.js` | 310 | `❌` | Decoración o icono | `console.log('  - ❌ SOLAPAMIENTO: ${o.pair}');` |
| `scripts/test_bastion_layout.js` | 315 | `❌` | Decoración o icono | `console.log('  - ❌ DESBORDE: <${oe.tag} id="${oe.id}" class="${oe.className` |
| `scripts/test_bastion_layout.js` | 321 | `⚠` | Decoración o icono | `console.log('  - ⚠️ Táctil reducido: ${ft.id} mide ${ft.width}x${ft.height}` |
| `scripts/test_bastion_phase1.js` | 23 | `❌` | Decoración o icono | `console.error('❌ FALLÓ: ${message}');` |
| `scripts/test_bastion_phase1.js` | 27 | `✅` | Decoración o icono | `console.log('✅ PASÓ: ${message}');` |
| `scripts/test_bastion_phase2.js` | 22 | `❌` | Decoración o icono | `console.error('❌ FALLÓ: ${message}');` |
| `scripts/test_bastion_phase2.js` | 26 | `✅` | Decoración o icono | `console.log('✅ PASÓ: ${message}');` |
| `scripts/test_bastion_phase3.js` | 44 | `✅` | Decoración o icono | `console.log('✅ PASÓ: MetaManager y Árbol de 6 Mejoras funcionan correctamen` |
| `scripts/test_bastion_phase3.js` | 59 | `✅` | Decoración o icono | `console.log('✅ PASÓ: Bonos pasivos de metaprogreso aplicados a la partida')` |
| `scripts/test_bastion_phase3.js` | 101 | `✅` | Decoración o icono | `console.log('✅ PASÓ: Efectos de Reliquias Arcanas verificados');` |
| `scripts/test_bastion_phase3.js` | 117 | `✅` | Decoración o icono | `console.log('✅ PASÓ: Dificultades y Mutadores escalan el combate');` |
| `scripts/test_bastion_phase3.js` | 142 | `✅` | Decoración o icono | `console.log('✅ PASÓ: Parábola balística 3D y sacudida de pantalla verificad` |
| `scripts/test_bastion_phase3.js` | 161 | `✅` | Decoración o icono | `console.log('✅ PASÓ: Estadísticas y números de daño flotantes operativos');` |
| `scripts/test_bastion_phase4.js` | 24 | `✅` | Decoración o icono | `console.log('✅ PASÓ: ${desc}');` |
| `scripts/test_bastion_phase4.js` | 27 | `❌` | Decoración o icono | `console.error('❌ FALLÓ: ${desc}');` |
| `scripts/test_bastion_phase5.js` | 28 | `✅` | Decoración o icono | `console.log('✅ PASÓ: ${description}');` |
| `scripts/test_bastion_phase5.js` | 31 | `❌` | Decoración o icono | `console.error('❌ FALLÓ: ${description}');` |
| `scripts/test_cristales_animations.js` | 51 | `✅` | Decoración o icono | `console.log('  ✅ Object pooling de sprites funciona con reutilización limpi` |
| `scripts/test_cristales_animations.js` | 62 | `✅` | Decoración o icono | `console.log('  ✅ 64 sprites coinciden con la matriz lógica al inicio.');` |
| `scripts/test_cristales_animations.js` | 96 | `✅` | Decoración o icono | `console.log('  ✅ Intercambio visual válido probado con easing y consistenci` |
| `scripts/test_cristales_animations.js` | 125 | `✅` | Decoración o icono | `console.log('  ✅ Swap inválido rechazado probado: las piezas van y regresan` |
| `scripts/test_cristales_animations.js` | 183 | `✅` | Decoración o icono | `console.log('  ✅ ${totalCascadesResolved} cascadas resueltas (${totalStepsA` |
| `scripts/test_cristales_animations.js` | 184 | `✅` | Decoración o icono | `console.log('  ✅ Cero discrepancias: matriz lógica y visualGrid coinciden a` |
| `scripts/test_cristales_animations.js` | 202 | `✅` | Decoración o icono | `console.log('  ✅ Las piezas nuevas comienzan fuera de la vista y caen con g` |
| `scripts/test_cristales_animations.js` | 220 | `✅` | Decoración o icono | `console.log('  ✅ Tablero en ola probado con aterrizaje elástico y consisten` |
| `scripts/test_cristales_animations.js` | 223 | `🎉` | Decoración o icono | `console.log('🎉 TODAS LAS PRUEBAS DE ANIMACIÓN DE CRISTALES PASARON CON ÉXI` |
| `scripts/test_cristales_invariants.js` | 338 | `✅` | Decoración o icono | `console.log('✅ INVARIANTE A CUMPLIDA: Ninguna celda queda vacía tras resolv` |
| `scripts/test_cristales_invariants.js` | 339 | `✅` | Decoración o icono | `console.log('✅ INVARIANTE B CUMPLIDA: Las piezas supervivientes conservan s` |
| `scripts/test_cristales_invariants.js` | 340 | `✅` | Decoración o icono | `console.log('✅ INVARIANTE C CUMPLIDA: El relleno escribe exclusivamente en ` |
| `scripts/test_cristales_invariants.js` | 341 | `✅` | Decoración o icono | `console.log('✅ INVARIANTE D CUMPLIDA: El orden relativo de las piezas en ca` |
| `scripts/test_cristales_invariants.js` | 347 | `🎉` | Decoración o icono | `console.log('\n🎉 TODAS LAS PRUEBAS PASARON EXITOSAMENTE SIN NINGUNA VIOLAC` |
| `scripts/test_gotas_animations.js` | 44 | `✅` | Decoración o icono | `console.log('✅ PASÓ');` |
| `scripts/test_gotas_animations.js` | 46 | `❌` | Decoración o icono | `console.log('❌ FALLÓ');` |
| `scripts/test_lanzaburbujas_layout.js` | 98 | `📱` | Decoración o icono | `console.log('📱 Iniciando verificación de layout y solapamiento para Lanzab` |
| `scripts/test_lanzaburbujas_layout.js` | 130 | `🔍` | Decoración o icono | `console.log('🔍 Probando viewport: ${vp.name} (${vp.width}x${vp.height})...` |
| `scripts/test_lanzaburbujas_layout.js` | 182 | `📸` | Decoración o icono | `console.log('   📸 Captura guardada: ${path.basename(shotPath)}');` |
| `scripts/test_lanzaburbujas_layout.js` | 231 | `✓` | Decoración o icono | `console.log('   ✓ Verificación geométrica completada para ${vp.name}\n');` |
| `scripts/test_lanzaburbujas_layout.js` | 243 | `❌` | Decoración o icono | `console.error('\n❌ ERRORES DETECTADOS (${failureReports.length}):');` |
| `scripts/test_lanzaburbujas_layout.js` | 247 | `🎉` | Decoración o icono | `console.log('🎉 100% de verificaciones superadas. CERO solapamientos entre ` |
| `scripts/test_lanzaburbujas_visual_logic.js` | 19 | `🫧` | Decoración o icono | `console.log('🫧 Iniciando suite de pruebas de lógica y consistencia visual ` |
| `scripts/test_lanzaburbujas_visual_logic.js` | 28 | `✓` | Decoración o icono | `console.log('  ✓ ${name}');` |
| `scripts/test_lanzaburbujas_visual_logic.js` | 31 | `✗` | Decoración o icono | `console.error('  ✗ ${name}');` |
| `scripts/test_lanzaburbujas_visual_logic.js` | 322 | `🎉` | Decoración o icono | `console.log('\n🎉 Todas las ${passed}/${total} pruebas de lógica y sincroni` |
| `shared/juice.js` | 230 | `🏆` | Encabezado o título | `unlockAchievement(gameId, achId, title, desc, icon = '🏆') {` |
| `shared/juice.js` | 258 | `🏆` | Encabezado o título | `showAchievementBanner(title, desc, icon = '🏆') {` |
| `test_abismo_fase1.js` | 28 | `✓` | Decoración o icono | `console.log('  ✓ [PASSED] ${name}');` |
| `test_abismo_fase1.js` | 31 | `✗` | Decoración o icono | `console.error('  ✗ [FAILED] ${name}');` |
| `test_abismo_fase2.js` | 36 | `✓` | Decoración o icono | `console.log('  ✓ [PASSED] ${name}');` |
| `test_abismo_fase2.js` | 39 | `✗` | Decoración o icono | `console.error('  ✗ [FAILED] ${name}');` |
| `test_abismo_fase3.js` | 32 | `✓` | Decoración o icono | `console.log('  ✓ [PASSED] ${name}');` |
| `test_abismo_fase3.js` | 35 | `✗` | Decoración o icono | `console.error('  ✗ [FAILED] ${name}');` |
| `test_abismo_fase4.js` | 36 | `✓` | Decoración o icono | `console.log('  ✓ [PASSED] ${name}');` |
| `test_abismo_fase4.js` | 39 | `✗` | Decoración o icono | `console.error('  ✗ [FAILED] ${name}');` |
| `test_abismo_fase5.js` | 53 | `✓` | Decoración o icono | `console.log('  ✓ [PASSED] ${name}');` |
| `test_abismo_fase5.js` | 56 | `✗` | Decoración o icono | `console.error('  ✗ [FAILED] ${name}');` |
| `test_abismo_mobile_map.js` | 15 | `✓` | Encabezado o título | `console.log('  ✓ [PASSED] ${title}');` |
| `test_abismo_mobile_map.js` | 18 | `✗` | Encabezado o título | `console.error('  ✗ [FAILED] ${title}');` |
| `test_campominado.js` | 53 | `✓` | Decoración o icono | `console.log('✓ Primer toque 100% seguro y conteo exacto de minas verificado` |
| `test_campominado.js` | 72 | `✓` | Decoración o icono | `console.log('✓ Cálculo de vecinos adyacentes validado con precisión');` |
| `test_campominado.js` | 93 | `✓` | Decoración o icono | `console.log('✓ Flood fill iterativo verificado: expansión en cadena limpia ` |
| `test_campominado.js` | 115 | `✓` | Decoración o icono | `console.log('✓ Condición de victoria verificada correctamente');` |
| `test_campominado.js` | 130 | `✓` | Decoración o icono | `console.log('✓ Solucionador lógico determinista (Guess-Free) y pistas segur` |
| `test_cargas.js` | 17 | `✓` | Decoración o icono | `console.log('✓ Configuración validada: 30 niveles repartidos en 3 mundos te` |
| `test_cargas.js` | 46 | `✓` | Decoración o icono | `console.log('✓ Los 30 niveles cumplen las dimensiones exactas 11x13 y los j` |
| `test_cargas.js` | 55 | `✓` | Decoración o icono | `console.log('✓ Solver BFS ejecutado: Los 30 niveles fueron probados y tiene` |
| `test_cargas.js` | 72 | `✓` | Decoración o icono | `console.log('✓ Regresión #1 superada: Las cargas empujadas ya no se atravie` |
| `test_cargas.js` | 91 | `✓` | Decoración o icono | `console.log('✓ Regresión #2 superada: Cadenas de detonación dinámicas sin a` |
| `test_cargas.js` | 108 | `✓` | Decoración o icono | `console.log('✓ Regresión #3 superada: Evasión con evaluación BFS de celdas ` |
| `test_cargas.js` | 124 | `✓` | Decoración o icono | `console.log('✓ Pathfinding BFS del cazador verificado con éxito.');` |
| `test_cargas.js` | 145 | `✓` | Decoración o icono | `console.log('✓ Mecánica de teletransportadores cuánticos pareados verificad` |
| `test_cargas.js` | 158 | `✓` | Decoración o icono | `console.log('✓ Mecánica de cintas transportadoras verificada.');` |
| `test_corredor.js` | 25 | `✓` | Decoración o icono | `console.log('✓ Física de salto y márgenes de recuperación verificados');` |
| `test_corredor.js` | 70 | `✓` | Decoración o icono | `console.log('✓ 5,000 obstáculos generados y verificados: 100% matemáticamen` |
| `test_corredor.js` | 80 | `✓` | Decoración o icono | `console.log('✓ Detección de colisiones AABB verificada');` |
| `test_cristales.js` | 14 | `✓` | Decoración o icono | `console.log('✓ Configuración base validada: ${CONFIG.LEVELS.length} niveles` |
| `test_cristales.js` | 36 | `✓` | Decoración o icono | `console.log('✓ 100 tableros iniciales verificados: Cero combinaciones prehe` |
| `test_cristales.js` | 51 | `✓` | Decoración o icono | `console.log('✓ 100 mezclas automáticas verificadas: Tableros resultantes vá` |
| `test_cristales.js` | 71 | `✓` | Decoración o icono | `console.log('✓ Detección de intercambios válidos e inválidos verificada');` |
| `test_cristales.js` | 92 | `✓` | Decoración o icono | `console.log('✓ 50 simulaciones de cascadas masivas verificadas: Todas se es` |
| `test_cristales.js` | 103 | `✓` | Decoración o icono | `console.log('✓ Los 40 niveles de campaña verificados: 100% resolubles matem` |
| `test_defensaorbital_deluxe.js` | 11 | `✓` | Decoración o icono | `console.log('  ✓ [PASSED] ${name}');` |
| `test_defensaorbital_deluxe.js` | 13 | `✗` | Decoración o icono | `console.error('  ✗ [FAILED] ${name}');` |
| `test_defensaorbital_formacion.js` | 16 | `✓` | Encabezado o título | `console.log('  ✓ [PASSED] ${title}');` |
| `test_defensaorbital_formacion.js` | 19 | `✗` | Encabezado o título | `console.error('  ✗ [FAILED] ${title}');` |
| `test_defensaorbital_picadas.js` | 15 | `✓` | Encabezado o título | `console.log('  ✓ [PASSED] ${title}');` |
| `test_defensaorbital_picadas.js` | 18 | `✗` | Encabezado o título | `console.error('  ✗ [FAILED] ${title}');` |
| `test_defensaorbital_sim.js` | 83 | `✓` | Decoración o icono | `console.log('  ✓ [PASSED] Simulación de 360 frames (6 segundos de juego) co` |
| `test_defensaorbital_sim.js` | 84 | `✓` | Decoración o icono | `console.log('  ✓ [PASSED] Naves entrando por curvas Bézier: ${enteringCount` |
| `test_defensaorbital_sim.js` | 85 | `✓` | Decoración o icono | `console.log('  ✓ [PASSED] Naves integradas en la formación viva: ${formatio` |
| `test_defensaorbital_sim.js` | 86 | `✓` | Decoración o icono | `console.log('  ✓ [PASSED] Límite de proyectiles simultáneos verificado: máx` |
| `test_defensaorbital_sim.js` | 87 | `✓` | Decoración o icono | `console.log('  ✓ [PASSED] Vaivén y respiración operando en [0, W] y [0, H] ` |
| `test_derrape_fase1.js` | 177 | `✓` | Decoración o icono | `console.log("✓ Interpolación de spline Catmull-Rom validada con precisión e` |
| `test_derrape_fase1.js` | 179 | `✓` | Decoración o icono | `console.log('✓ Continuidad de pista en bucle cerrado: ${trackInfo.totalSamp` |
| `test_derrape_fase1.js` | 181 | `✓` | Decoración o icono | `console.log("✓ Físicas del auto: aceleración, tracción longitudinal y disip` |
| `test_derrape_fase1.js` | 182 | `✓` | Decoración o icono | `console.log("✓ TODAS LAS PRUEBAS DE FASE 1 COMPLETADAS CON ÉXITO.");` |
| `test_derrape_fase2.js` | 33 | `🏁` | Decoración o icono | `console.log('🏁 INICIANDO PRUEBAS UNITARIAS FASE 2: DERRAPE\n');` |
| `test_derrape_fase2.js` | 42 | `✅` | Decoración o icono | `console.log('  ✅ [PASS] ${name}');` |
| `test_derrape_fase2.js` | 45 | `❌` | Decoración o icono | `console.error('  ❌ [FAIL] ${name}');` |
| `test_derrape_fase2.js` | 54 | `📌` | Decoración o icono | `console.log('📌 BLOQUE 1: Geometría de Pistas y Puntos de Control');` |
| `test_derrape_fase2.js` | 85 | `📌` | Decoración o icono | `console.log('\n📌 BLOQUE 2: Sistema de Vueltas y Protección Anti-Trampas');` |
| `test_derrape_fase2.js` | 207 | `📌` | Decoración o icono | `console.log('\n📌 BLOQUE 3: Colisiones con Bordes y Delimitación');` |
| `test_derrape_fase2.js` | 260 | `📌` | Decoración o icono | `console.log('\n📌 BLOQUE 4: Tiempos y Récords');` |
| `test_derrape_fase3.js` | 31 | `✓` | Decoración o icono | `console.log('  ✓ [PASSED] ${name}');` |
| `test_derrape_fase3.js` | 34 | `✗` | Decoración o icono | `console.error('  ✗ [FAILED] ${name}');` |
| `test_derrape_fase4.js` | 35 | `✓` | Decoración o icono | `console.log('  ✓ [PASSED] ${name}');` |
| `test_derrape_fase4.js` | 38 | `✗` | Decoración o icono | `console.error('  ✗ [FAILED] ${name}');` |
| `test_eras_menu.js` | 10 | `✓` | Decoración o icono | `console.log('  ✓ [PASSED] ${name}');` |
| `test_eras_menu.js` | 12 | `✗` | Decoración o icono | `console.error('  ✗ [FAILED] ${name}');` |
| `test_fronton.js` | 48 | `✓` | Decoración o icono | `console.log('✓ Todos los tests de Frontón pasaron exitosamente (7/7)');` |
| `test_gotas.js` | 19 | `✓` | Decoración o icono | `console.log('✓ Inicialización del tablero 6x12 correcta');` |
| `test_gotas.js` | 55 | `✓` | Decoración o icono | `console.log('✓ Detección de grupos ortogonales de 4+ gotas (BFS) verificada` |
| `test_gotas.js` | 80 | `✓` | Decoración o icono | `console.log('✓ Aplicación de gravedad y asentamiento hacia el fondo verific` |
| `test_gotas.js` | 112 | `✓` | Decoración o icono | `console.log('✓ Simulación de cascadas múltiples y combos en cadena completa` |
| `test_gotas.js` | 143 | `✓` | Decoración o icono | `console.log('✓ Mecánica propia: Gota arcoíris elimina todo el color impacta` |
| `test_gotas.js` | 180 | `✓` | Decoración o icono | `console.log('✓ Mecánica de Maratón/Duelo: Gotas de basura y disolución adya` |
| `test_lanzaburbujas.js` | 23 | `✓` | Decoración o icono | `console.log('✓ Configuración verificada: 60 niveles agrupados en 4 mundos t` |
| `test_lanzaburbujas.js` | 53 | `✓` | Decoración o icono | `console.log('✓ Geometría y vecinos en rejilla hexagonal (pares e impares) v` |
| `test_lanzaburbujas.js` | 82 | `✓` | Decoración o icono | `console.log('✓ Detección BFS de grupos conectados por color y arcoíris veri` |
| `test_lanzaburbujas.js` | 111 | `✓` | Decoración o icono | `console.log('✓ Algoritmo de detección de burbujas flotantes (huérfanas) ver` |
| `test_lanzaburbujas.js` | 161 | `✓` | Decoración o icono | `console.log('✓ Precisión matemática validada: La guía de rebote coincide al` |
| `test_lanzaburbujas.js` | 182 | `✓` | Decoración o icono | `console.log('✓ Filtro dinámico de colores de munición validado');` |
| `test_lanzaburbujas.js` | 192 | `✓` | Decoración o icono | `console.log('✓ Los 60 niveles de campaña verificados: 100% resolubles matem` |
| `test_lumen.js` | 22 | `✓` | Decoración o icono | `console.log('✓ Configuración validada: 30 niveles agrupados en 5 mundos tem` |
| `test_lumen.js` | 59 | `✓` | Decoración o icono | `console.log('✓ Los 30 niveles son 100% conexos y todos sus faroles (entre 6` |
| `test_lumen.js` | 75 | `✓` | Decoración o icono | `console.log('✓ Conectividad de túneles laterales de envoltura (wrap-around)` |
| `test_lumen.js` | 98 | `✓` | Decoración o icono | `console.log('✓ Generador procedural del modo sin fin verificado: 20/20 labe` |
| `test_lumen.js` | 115 | `✓` | Decoración o icono | `console.log('✓ Algoritmo de evasión de luz y huida hacia zonas de sombra ve` |
| `test_lumen.js` | 127 | `✓` | Decoración o icono | `console.log('✓ Persecución por BFS en estado Caza validada');` |
| `test_lumen.js` | 148 | `✓` | Decoración o icono | `console.log('✓ Migración de almacenamiento de lumen:v1 a lumen:v2 verificad` |

---

## 3. Diagnóstico de Problemas Estéticos Comunes

### 3.1. Paletas Cromáticas Repetidas (El "Síndrome Cian + Morado")
Al analizar las variables CSS y colores en los 16 juegos, se detectó una uniformidad monótona:
- **14 de los 16 juegos** utilizan como fondo una variante casi idéntica de azul espacial oscuro (`#070913`, `#0b0d17`, `#0f172a` o `#021220`).
- **11 de los 16 juegos** usan el cian (`#00f0ff` o `#38bdf8`) como acento principal.
- **10 de los 16 juegos** usan el morado/púrpura (`#a855f7`, `#6366f1` o `#b026ff`) como acento secundario.
- **Consecuencia**: El jugador siente que está jugando al mismo juego con diferentes mecánicas en lugar de 16 obras independientes con personalidad propia.

### 3.2. Abuso de Resplandores Neón y Degradados Indiscriminados
- Se encontraron **más de 180 reglas CSS** con `box-shadow: 0 0 16px rgba(...)` y `drop-shadow` en tarjetas, botones y contenedores donde no aportan jerarquía visual.
- Casi todas las tarjetas del menú y de los juegos aplican gradientes de fondo lineales de 135° con transparencias idénticas (`rgba(255, 255, 255, 0.06)`), restando legibilidad y haciendo que todo parezca una plantilla de dashboard.

### 3.3. Tipografías Genéricas sin Identidad de Época
- Salvo la regla global de `theme.css` (`-apple-system, BlinkMacSystemFont, "Segoe UI"`), los juegos individuales apenas definen tipografías temáticas coherentes con su época.
- Juegos de los 80 carecen de una estética monoespaciada o pixelada sobria, mientras que juegos de los 90 carecen del dinamismo geométrico y tipografías redondeadas de la época de 16 bits.

### 3.4. Botones y Docks Idénticos
- En casi todos los juegos se reutiliza exactamente el mismo contenedor flotante inferior (`dock-controls`, `arcade-icon-btn`), con bordes redondeados idénticos y sombras transparentes, sin adaptarse a la identidad particular de cada juego (por ejemplo, remaches y metal para Bastión, bordes planos y ángulos rectos para Frontón o Bloques, o estética LCD para Campo Minado).

### 3.5. Tono de Interfaz Exagerado y Exclamaciones Hiperbólicas
- Se identificaron múltiples instancias de títulos y textos con exclamaciones grandilocuentes ("¡CATACLISMO ÍGNEO!", "¡MAESTRÍA MÁXIMA!", "¡ÉPICO!", "¡IMPARABLE!", "¡BRUTAL!").
- En lugar de transmitir satisfacción orgánica a través de la jugabilidad y la física, el texto cae en clichés de juegos móviles genéricos.

---

## 4. Propuesta de Identidad Visual Única por Juego

Se establece para cada título y sección del arcade una **paleta estricta de máximo 5 colores**, una personalidad temática propia, tipografía de sistema recomendada y estilo de interfaz:

### Menú Principal (Hub General) [Época: Todas]
- **Concepto / Personalidad**: Arcade Multipropósito Sobrio
- **Paleta (5 colores)**:
  - `#090d16 (Fondo Carbón)`
  - `#151d2e (Superficie)`
  - `#38bdf8 (Azul Guía)`
  - `#f59e0b (Ámbar Récord)`
  - `#f1f5f9 (Texto Claro)`
- **Tipografía**: `system-ui, -apple-system, "Segoe UI", sans-serif`
- **Estilo de UI / Controles**: Líneas limpias, bordes de 10px, sombras sólidas de elevación sin neón excesivo.

### Ruta /80 (Arcade 80) [Época: 1980s]
- **Concepto / Personalidad**: Fósforo CRT y Vector Arcade Clásico
- **Paleta (5 colores)**:
  - `#000000 (Negro Absoluto)`
  - `#051805 (Verde Fósforo Oscuro)`
  - `#00ff66 (Verde Terminal P1)`
  - `#ff0055 (Rojo Alerta)`
  - `#f0fff4 (Blanco Fósforo)`
- **Tipografía**: `ui-monospace, "Courier New", Consolas, monospace`
- **Estilo de UI / Controles**: Líneas rectas (border-radius: 0), bordes de 2px sólidos, scanlines sutiles.

### Ruta /90 (Arcade 90) [Época: 1990s]
- **Concepto / Personalidad**: 16-Bit Super Arcade y Bisel Sólido
- **Paleta (5 colores)**:
  - `#140826 (Índigo Profundo)`
  - `#28114b (Bisel Base)`
  - `#ffd000 (Amarillo Ocre)`
  - `#ff2a85 (Magenta Arcade)`
  - `#ffffff (Texto Nítido)`
- **Tipografía**: `ui-rounded, "Arial Rounded MT Bold", "Nunito", system-ui, sans-serif`
- **Estilo de UI / Controles**: Biseles dimensionales (border-top claro, border-bottom oscuro), esquinas redondeadas de 8px.

### Ruta /00 (Arcade 00) [Época: 2000s]
- **Concepto / Personalidad**: Tecno-Industrial y Cristal Pulido
- **Paleta (5 colores)**:
  - `#040914 (Azul Abisal)`
  - `#0f223d (Metal Azulado)`
  - `#00e5ff (Cian Técnico)`
  - `#708090 (Acero Slate)`
  - `#e2e8f0 (Platino)`
- **Tipografía**: `-apple-system, "SF Pro Display", "Segoe UI", sans-serif`
- **Estilo de UI / Controles**: Bordes finos de 1px con brillo especular superior, radios de 12px, acabado satinado.

### Bloques [Época: 80]
- **Concepto / Personalidad**: Minimalismo Constructivista y Tetromino Geométrico
- **Paleta (5 colores)**:
  - `#0a0a0f (Fondo Grafito)`
  - `#181824 (Marco Tablero)`
  - `#00e5ff (Pieza I / Acento)`
  - `#ff9100 (Pieza L / Énfasis)`
  - `#f8fafc (Texto)`
- **Tipografía**: `ui-monospace, Menlo, Consolas, monospace`
- **Estilo de UI / Controles**: Bloques geométricos planos con borde interior de 1px, botones cuadrados de 4px de radio.

### Serpiente [Época: 80]
- **Concepto / Personalidad**: Pantalla LCD Monocroma / Matriz Retro
- **Paleta (5 colores)**:
  - `#87987a (Fondo Pantalla LCD Oliva)`
  - `#1e2818 (Píxel Activo Negro/Verde)`
  - `#758866 (Píxel Apagado)`
  - `#384830 (Borde Gabinete)`
  - `#0d130a (Texto Display)`
- **Tipografía**: `"Courier New", Courier, monospace`
- **Estilo de UI / Controles**: Estética genuina de consola de mano retro, alto contraste, sin degradados ni neones.

### Rompe Muros [Época: 80]
- **Concepto / Personalidad**: Frontón Electromecánico Breakout
- **Paleta (5 colores)**:
  - `#0b0c10 (Fondo Carbón)`
  - `#1f2833 (Muro Base)`
  - `#ff3366 (Ladrillos Rojos / Bola)`
  - `#45a29e (Paleta Turquesa)`
  - `#ffffff (Marcador)`
- **Tipografía**: `ui-monospace, "Lucida Console", monospace`
- **Estilo de UI / Controles**: Contornos nítidos de 2px, sombras proyectadas duras de 2px sin difuminado.

### Defensa Orbital [Época: 80]
- **Concepto / Personalidad**: Radar Militar Espacial y Vector Verde/Ámbar
- **Paleta (5 colores)**:
  - `#030906 (Fondo Oscuro Radar)`
  - `#0d2818 (Retícula de Barrido)`
  - `#00ff88 (Nave Aliada y Miras)`
  - `#ff3b30 (Amenaza Alienígena)`
  - `#e8f5e9 (Lecturas HUD)`
- **Tipografía**: `Consolas, "Liberation Mono", monospace`
- **Estilo de UI / Controles**: Líneas vectoriales de 1.5px, marcos angulares estilo HUD de cabina táctica.

### Sombras [Época: 90]
- **Concepto / Personalidad**: Infiltración Nocturna y Linterna Estocástica
- **Paleta (5 colores)**:
  - `#030305 (Oscuridad Total)`
  - `#12131a (Penumbra)`
  - `#f59e0b (Haz de Linterna Ámbar)`
  - `#ef4444 (Cono de Vigilancia)`
  - `#cbd5e1 (Paredes de Piedra)`
- **Tipografía**: `system-ui, -apple-system, sans-serif`
- **Estilo de UI / Controles**: Sombras proyectadas profundas, bordes biselados sutiles, HUD minimalista tipo visor espía.

### Derrape [Época: 90]
- **Concepto / Personalidad**: Asfalto Caliente, Guardarraíl y Neumáticos Quemados
- **Paleta (5 colores)**:
  - `#18191c (Asfalto Antracita)`
  - `#2d3139 (Bordillos de Pista)`
  - `#f97316 (Naranja Deportivo)`
  - `#ffffff (Pintura de Carril)`
  - `#ef4444 (Tacómetro Redline)`
- **Tipografía**: `ui-rounded, "Trebuchet MS", sans-serif`
- **Estilo de UI / Controles**: Franjas diagonales de advertencia en botones, esquinas redondeadas de 6px, aspecto de tablero de carreras.

### Abismo [Época: 00]
- **Concepto / Personalidad**: Cripta Gótica Oscura y Niebla Espectral
- **Paleta (5 colores)**:
  - `#08060c (Piedra de Cripta)`
  - `#1a1424 (Sarcófago Base)`
  - `#9333ea (Fuego Espectral)`
  - `#e11d48 (Sangre Vital)`
  - `#e2e8f0 (Hueso / Texto)`
- **Tipografía**: `Georgia, Cambria, "Times New Roman", serif`
- **Estilo de UI / Controles**: Bordes con filigrana gótica angular, marcos de piedra desgastada, gemas sin neón genérico.

### Frontón [Época: 80]
- **Concepto / Personalidad**: Pista de Squash Sintética y Líneas de Cal
- **Paleta (5 colores)**:
  - `#162b1d (Cancha Verde Abedul)`
  - `#0d1a11 (Muro Lateral)`
  - `#ffffff (Líneas de Saque / Pelota)`
  - `#f59e0b (Madera de Raqueta P1)`
  - `#38bdf8 (Raqueta P2)`
- **Tipografía**: `ui-monospace, "Courier New", monospace`
- **Estilo de UI / Controles**: Líneas blancas continuas de 3px, marcadores mecánicos de números grandes, cero brillos artificiales.

### Campo Minado [Época: 90]
- **Concepto / Personalidad**: Consola de Artificiero y Pizarra Táctica
- **Paleta (5 colores)**:
  - `#1c2128 (Acero Pizarra)`
  - `#2d333b (Casilla Elevada)`
  - `#0d1117 (Casilla Hundida)`
  - `#e63946 (Banderín de Peligro)`
  - `#58a6ff (Números Lógicos)`
- **Tipografía**: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- **Estilo de UI / Controles**: Bisel noventero clásico con textura de tecla física, relieve positivo al estar tapada y neutro al despejar.

### Corredor [Época: 00]
- **Concepto / Personalidad**: Pista de Atletismo Nocturna y Viento Dinámico
- **Paleta (5 colores)**:
  - `#0d1117 (Noche Urbana)`
  - `#1f2937 (Plataformas de Hormigón)`
  - `#10b981 (Aceleración Verde)`
  - `#f59e0b (Energía / Salto)`
  - `#ffffff (Silueta)`
- **Tipografía**: `system-ui, -apple-system, sans-serif`
- **Estilo de UI / Controles**: Tarjetas flotantes delgadas, iconos compactos de 20px, medidor de distancia estilizado sin cajas pesadas.

### Gotas [Época: 90]
- **Concepto / Personalidad**: Laboratorio de Alquimia Líquida y Frascos de Cristal
- **Paleta (5 colores)**:
  - `#121624 (Mesa de Alquimista)`
  - `#1c2238 (Matraz de Cristal)`
  - `#06d6a0 (Gota Menta)`
  - `#118ab2 (Gota Océano)`
  - `#ef476f (Gota Baya)`
- **Tipografía**: `ui-rounded, "Arial Rounded MT Bold", sans-serif`
- **Estilo de UI / Controles**: Superficies abombadas con reflejo de burbuja sutil, botones suaves de 14px de radio.

### Cristales [Época: 00]
- **Concepto / Personalidad**: Mineralogía de Cuarzo y Facetas Geológicas
- **Paleta (5 colores)**:
  - `#0c101a (Mina Profunda)`
  - `#182030 (Lecho Rocoso)`
  - `#00b4d8 (Cian Zafiro)`
  - `#7209b7 (Amatista)`
  - `#ffd166 (Topacio)`
- **Tipografía**: `system-ui, -apple-system, sans-serif`
- **Estilo de UI / Controles**: Bordes poliédricos en tarjetas, facetas geométricas con sombras limpias, sin gradientes borrosos.

### Lanzaburbujas [Época: 00]
- **Concepto / Personalidad**: Física de Burbujas Jabonosas y Arrecife Marino
- **Paleta (5 colores)**:
  - `#061a2b (Fondo Marino)`
  - `#0e2f4c (Base de Lanzador)`
  - `#00f5d4 (Burbuja Turquesa)`
  - `#fee440 (Burbuja Solar)`
  - `#f72585 (Burbuja Coral)`
- **Tipografía**: `ui-rounded, system-ui, sans-serif`
- **Estilo de UI / Controles**: Cañón mecánico pulido de latón y cromo, marcos circulares con reflejos especulares de 1px.

### Lumen [Época: 80]
- **Concepto / Personalidad**: Laberinto de Sombras y Farol de Aceite
- **Paleta (5 colores)**:
  - `#080705 (Oscuridad Ceniza)`
  - `#1c1712 (Muros de Catacumba)`
  - `#f59e0b (Luz de Farol Cálida)`
  - `#ffffff (Chispa de Yesca)`
  - `#b91c1c (Sombra Perseguidora)`
- **Tipografía**: `ui-monospace, monospace`
- **Estilo de UI / Controles**: Radio de luz dinámico con degradado radial natural, HUD de texto pequeño y limpio en la esquina superior.

### Cargas [Época: 90]
- **Concepto / Personalidad**: Acelerador de Partículas y Bobinas de Resonancia
- **Paleta (5 colores)**:
  - `#0e1118 (Cámara de Vacío)`
  - `#1b2230 (Placas Magnéticas)`
  - `#3b82f6 (Polo Positivo Azul)`
  - `#f97316 (Polo Negativo Naranja)`
  - `#ffffff (Chispa de Impacto)`
- **Tipografía**: `Consolas, "Segoe UI", sans-serif`
- **Estilo de UI / Controles**: Rombo central y rejilla con bisel técnico, contadores de resonancia discretos y numéricos.

### Bastión [Época: 00]
- **Concepto / Personalidad**: Fortaleza Militarizada y Metalurgia Balística
- **Paleta (5 colores)**:
  - `#0f141c (Tierra de Asedio)`
  - `#1e2633 (Muralla de Granito)`
  - `#475569 (Blindaje de Acero)`
  - `#f59e0b (Oro de Campaña)`
  - `#38bdf8 (Núcleo Nexo)`
- **Tipografía**: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- **Estilo de UI / Controles**: Placas remachadas, botones de mando militar con bisel inferior de 2px, tipografía sobria y firme.

---

## 5. Propuesta de Nombres Concretos y Textos Neutros

> [!IMPORTANT]
> **Lista de cambios para revisión del usuario**: De acuerdo con las reglas, estos renombres se presentan para su confirmación expresa antes de ser aplicados en los archivos fuente.

### 5.1. Bastión: Torres, Habilidades y Reliquias

| Tipo | Identificador | Nombre Actual | Nombre Propuesto (Neutro / Concreto) | Justificación |
|---|---|---|---|---|
| Torre | `balistico` | Centinela Balístico | **Torreta Centinela** | Directo y claro para el rol de disparo continuo. |
| Rama Nivel 4 | `gatling` | Ametralladora Gatling | **Cañón Rotativo** | Término táctico militar estandarizado. |
| Rama Nivel 4 | `bateria_pesada` | Batería de Percusión | **Batería de Choque** | Describe con precisión el efecto de micro-explosión. |
| Torre | `mortero` | Mortero de Fragmentación | **Mortero Balístico** | Concreto y sin adjetivos redundantes. |
| Rama Nivel 4 | `racimo` | Mina de Racimo | **Mortero de Racimo** | Consistencia con el arma base. |
| Rama Nivel 4 | `napalm` | Lodo Incendiario | **Proyectil Incendiario** | Más profesional y acorde al vocabulario bélico. |
| Torre | `rayo` | Emisor Prismático | **Torre de Haz Láser** | Inmediatamente comprensible como arma perforante. |
| Rama Nivel 4 | `desintegrador` | Rayo Desintegrador | **Láser Focalizado** | Menos cliché de ciencia ficción genérica. |
| Rama Nivel 4 | `bobina_tesla` | Bobina de Sobrecarga | **Emisor de Arco Eléctrico** | Término físico concreto. |
| Torre | `crio` | Torre Criogénica | **Dispersor Criogénico** | Preciso para su función de pulso de área. |
| Rama Nivel 4 | `cero_absoluto` | Ventisca Polar | **Pulso de Escarcha** | Describe el efecto sin metáforas meteorológicas. |
| Rama Nivel 4 | `escarcha_vulnerable` | Escarcha Quebradiza | **Descarga Debilitante** | Describe claramente el debuff de daño extra. |
| Torre | `obelisco` | Obelisco de Resonancia | **Torre de Transmisión** | Menos místico, más integrado en la red de mando. |
| Rama Nivel 4 | `sobrecarga_arcana` | Sobrecarga Arcana | **Amplificador de Señal** | Consistente con la arquitectura de soporte. |
| Rama Nivel 4 | `amplificador_oro` | Catalizador de Recursos | **Módulo de Recuperación** | Concreto para la bonificación de oro. |
| Torre | `francotirador` | Cañón de Precisión | **Cañón Francotirador** | Identifica su rango y cadencia de inmediato. |
| Rama Nivel 4 | `perforador_blindaje` | Proyectil Perforante | **Munición Perforante** | Uso de la terminología correcta de blindaje. |
| Rama Nivel 4 | `ojo_halcon` | Ojo de Halcón | **Puesto de Observación** | Nombre de instalación técnica en lugar de metáfora. |
| Habilidad | `sobrecarga` | Sobrecarga | **Sobrecarga de Red** | Específico a las torres activas. |
| Habilidad | `bombardeo` | Ataque Orbital | **Ataque de Artillería** | Alineado al mundo terrestre de Bastión. |
| Reliquia | `lente_cuantica` | Lente Cuántica | **Módulo Óptico** | Concreto; añade alcance. |
| Reliquia | `fision_acelerada` | Fisión Acelerada | **Mecanismo Rápido** | Concreto; añade cadencia. |
| Reliquia | `polvora_inestable` | Pólvora Inestable | **Carga Explosiva Reforzada** | Concreto; aumenta radio de mortero. |
| Reliquia | `cero_absoluto` | Cero Absoluto | **Núcleo Refrigerante** | Concreto; mejora ralentización. |
| Reliquia | `transmutador_aurico` | Transmutador Áurico | **Recompensa de Asedio** | Menos alquímico, más militar. |
| Reliquia | `escudo_singularidad` | Escudo de Singularidad | **Barrera de Respaldo** | Describe su rol protector de 3 impactos. |
| Reliquia | `bobina_tesla_nucleo` | Bobina de Tesla Nexo | **Defensa Perimetral** | Describe su función de descarga defensiva. |
| Reliquia | `aleacion_antimateria` | Aleación Antimateria | **Punta de Wolframio** | Material real penetrador de blindaje. |
| Reliquia | `banco_interes` | Reserva de Interés | **Interés de Reserva** | Gramática directa y sobria. |
| Reliquia | `sobrecarga_obelisco` | Resonancia Primordial | **Antena de Extensión** | Describe el aumento de alcance del transmisor. |

### 5.1.1. Lista de Nombres Finales Aplicados en Bastión

Para cumplir con la directriz de evitar patrones genéricos ("Torre de X" o "Módulo de X") y preservar variedad, carácter e identidad militarizada en Bastión, los nombres finales aplicados en el código son los siguientes:

| Categoría | Identificador | Nombre Final Aplicado | Validación de Patrón Genérico |
|---|---|---|---|
| **Torre 1** | `balistico` | **Torreta Centinela** (I, II, III) | Evita "Torre Balística" |
| ↳ Especialización 4A | `gatling` | **Ametralladora Gatling** | Preserva nombre histórico icónico |
| ↳ Especialización 4B | `bateria_pesada` | **Batería de Percusión** | Arma de percusión pesada |
| **Torre 2** | `mortero` | **Mortero Pesado** (I, II, III) | Evita "Torre Mortero" |
| ↳ Especialización 4A | `racimo` | **Mina de Racimo** | Despliegue de submuniciones |
| ↳ Especialización 4B | `napalm` | **Lodo Incendiario** | Efecto de combustión de terreno |
| **Torre 3** | `rayo` | **Proyector Láser** (I, II, III) | Evita "Torre Láser" o "Torre de Haz" |
| ↳ Especialización 4A | `desintegrador` | **Rayo Desintegrador** | Carácter focalizado |
| ↳ Especialización 4B | `bobina_tesla` | **Bobina de Sobrecarga** | Descarga eléctrica en arco |
| **Torre 4** | `crio` | **Dispersor Criogénico** (I, II, III) | Evita "Torre Criogénica" |
| ↳ Especialización 4A | `cero_absoluto` | **Ventisca Polar** | Congelación de área |
| ↳ Especialización 4B | `escarcha_vulnerable` | **Escarcha Quebradiza** | Debuff de vulnerabilidad táctica |
| **Torre 5** | `obelisco` | **Obelisco de Señal** (I, II, III) | Evita "Torre de Transmisión" / "Módulo de Transmisión" |
| ↳ Especialización 4A | `sobrecarga_arcana` | **Sobrecarga Arcana** | Buff resonante de daño y alcance |
| ↳ Especialización 4B | `amplificador_oro` | **Catalizador de Recursos** | Evita "Módulo de Recuperación" |
| **Torre 6** | `francotirador` | **Cañón Francotirador** (I, II, III) | Evita "Torre Francotiradora" |
| ↳ Especialización 4A | `perforador_blindaje` | **Proyectil Perforante** | Munición penetrante de blindaje |
| ↳ Especialización 4B | `ojo_halcon` | **Ojo de Halcón** | Alcance global y prioridad de blanco |
| **Habilidad 1** | `sobrecarga` | **Sobrecarga** | Activación temporal de sobretensión |
| **Habilidad 2** | `bombardeo` | **Ataque Orbital** | Fuego de apoyo balístico masivo |
| **Reliquia Clave** | `transmutador_aurico` | **Botín de Asedio** | Descriptivo y directo (otorga +2 oro/baja) |

### 5.2. Abismo: Clases, Habilidades y Limpieza de Textos

> [!IMPORTANT]
> **Decisión del Usuario**: Se conservan íntegros los nombres canónicos de las clases y sus habilidades (`Peregrino Abisal`, `Hechicera de Sangre`, `Centinela de Hierro`, `Acechador Umbrío`, `Inquisidor Ígneo` y sus habilidades `Estallido Espectral`, `Pacto Carmesí`, `Falla Sísmica`, `Paso Fantasma`, `Cataclismo Ígneo`) dado que poseen identidad propia y no eran exageradas.

| Tipo | Identificador | Nombre Mostrado Final | Estado / Nota |
|---|---|---|---|
| Personaje 1 | `peregrino` | **Peregrino Abisal** | Conservado por directiva de usuario |
| Habilidad 1 | `estallido` | **Estallido Espectral** | Conservado por directiva de usuario |
| Personaje 2 | `hechicera` | **Hechicera de Sangre** | Conservado por directiva de usuario |
| Habilidad 2 | `pacto` | **Pacto Carmesí** | Conservado por directiva de usuario |
| Personaje 3 | `centinela` | **Centinela de Hierro** | Conservado por directiva de usuario |
| Habilidad 3 | `falla` | **Falla Sísmica** | Conservado por directiva de usuario |
| Personaje 4 | `sombra` | **Acechador Umbrío** | Conservado por directiva de usuario |
| Habilidad 4 | `paso_fantasma` | **Paso Fantasma** | Conservado por directiva de usuario |
| Personaje 5 | `piromante` | **Inquisidor Ígneo** | Conservado por directiva de usuario |
| Habilidad 5 | `cataclismo` | **Cataclismo Ígneo** | Conservado por directiva de usuario |
| Altar Meta | `vida_inicial` | **Salud Base** | Descriptivo y legible |
| Altar Meta | `fuerza_ancestral` | **Fuerza de Ataque** | Descriptivo y legible |
| Altar Meta | `pies_del_viento` | **Velocidad de Marcha** | Descriptivo y legible |
| Altar Meta | `iman_arcano` | **Radio de Recogida** | Descriptivo y legible |
| Altar Meta | `fortuna_inicial` | **Oro Inicial** | Descriptivo y legible |

#### Textos de Interfaz Limpiados en Abismo:
- `¡OLEADA X/Y!` &rarr; `Oleada X/Y`
- `¡SALA DESPEJADA! PUERTAS ABIERTAS` &rarr; `Sala despejada: puertas abiertas`
- `¡JEFE DERROTADO! PORTAL ABIERTO` &rarr; `Jefe derrotado: portal abierto`
- `¡VICTORIA COLOSAL!` &rarr; `VICTORIA`
- `¡NIVEL ALCANZADO!` &rarr; `Nivel alcanzado`
- `¡BÓVEDA ANCESTRAL ABIERTA!` &rarr; `Bóveda ancestral abierta`
- `¡BLOQUEO!` &rarr; `BLOQUEO`
- `¡Oro insuficiente! (X 🪙)` &rarr; `Oro insuficiente (X)`
### 5.2.1. Corredor: Identidad Visual y Limpieza de Textos
- **Concepto / Personalidad**: Desert Speedway & Solar Runner (carrera solar en cañón desértico).
- **Paleta (5 colores cálidos)**:
  - `#18120e` (Fondo asfalto y cañón crepuscular)
  - `#f59e0b` (Ámbar solar y acentos principales)
  - `#fbbf24` (Oro solar para métricas y récords)
  - `#ea580c` (Naranja flama para turbos y advertencias)
  - `#dc2626` (Carmesí para alertas e impactos)
- **Eliminación de Genéricos**:
  - Eliminados 3 bloques de `backdrop-filter: blur(...)` en encabezado, modales y panel de resultados; reemplazados por paneles opacos cálidos `rgba(28, 20, 15, 0.96)`.
  - Reemplazados los resplandores de neón cian/magenta por sombras sutiles de contacto (`box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4)`).
  - Eliminados todos los emojis en HTML, HUD, modales y canvas.
  - En canvas 2D, los power-ups flotantes ya no usan `ctx.fillText` con emojis (`🚀, ⏳, 🛡️, 🧲`), sino trazados vectoriales pre-renderizados con `ArcadeIcons.drawToCanvas`.
- **Textos**:
  - `¡INICIAR CARRERA!` &rarr; `INICIAR CARRERA`
  - `¡MISIÓN CUMPLIDA!` &rarr; `Misión cumplida`
  - Eliminados los prefijos de moneda en emojis (`🪙`) sustituyéndolos por valores numéricos claros con etiquetas discretas.
- **Verificación**:
  - `test_corredor.js`: 4/4 pruebas unitarias pasadas.
  - `sin-emojis.js games/corredor`: 0 hallazgos en 3 archivos.
  - Layout responsive en 5 viewports: sin scroll horizontal, todos los controles $\ge 44$ px.
  - Capturas registradas: `corredor_before.png` y `corredor_after.png`.

### 5.2.2. Gotas: Identidad Visual y Limpieza de Textos
- **Concepto / Personalidad**: Light Fluid Laboratory (laboratorio limpio de alquimia de gel y acuarela 90s). Cumple con el requisito de juegos de paleta clara y luminosa.
- **Paleta (5 colores claros / acuarela)**:
  - `#f1f5f9` (Fondo pizarra suave de laboratorio)
  - `#ffffff` (Tarjetas y paneles de matraz blanco puro)
  - `#0f172a` (Tinta negra de laboratorio para textos nítidos)
  - `#0284c7` (Azul celeste agua / acento primario y récords)
  - `#e11d48` (Coral reactivo para jefes y alertas)
- **Eliminación de Genéricos**:
  - Eliminado `backdrop-filter: blur(6px)` en overlays; reemplazado por telón semitransparente sobrio `rgba(15, 23, 42, 0.72)`.
  - Eliminados los bordes con resplandor neón exagerado (`box-shadow: 0 0 20px rgba(255, 34, 85, 0.8)`).
  - Reemplazados todos los emojis en HTML, modales, iconos de jefes, rivales de IA, tutorial y controles táctiles inferiores (`◀, 🔄, ▶, ▼`) por iconos vectoriales SVG de `shared/icons.js`.
- **Textos**:
  - `¡FIN DE PARTIDA!` &rarr; `Fin de partida`
  - `¡CASCADA x2!` &rarr; `Cascada x2`
  - `⚠️ ¡BASURA LÍQUIDA ENTRANTE!` &rarr; `Desechos entrantes` (con icono vectorial alert)
  - `▶ JUGAR AHORA` &rarr; `Iniciar partida`
  - Modos de juego e instrucciones explicados de forma sobria y directa.
- **Verificación**:
  - `test_gotas.js`: 6/6 pruebas unitarias pasadas.
  - `sin-emojis.js games/gotas`: 0 hallazgos en 3 archivos.
  - Layout responsive en 5 viewports: sin scroll horizontal, todos los controles táctiles $\ge 44$ px.
  - Capturas registradas: `gotas_before.png` y `gotas_after.png`.

### 5.3. Otros Juegos: Textos de HUD, Logros y Mecánicas

| Juego | Elemento | Texto / Nombre Actual | Propuesta | Justificación |
|---|---|---|---|---|
| Corredor | Power-up Escudo | Aura Cuántica | **Escudo Protector** | Menos pseudociencia, más funcional. |
| Corredor | Power-up Salto | Manto Propulsor | **Impulso Doble** | Identifica la mecánica de salto. |
| Gotas | Gota especial | Prisma Gelatinoso | **Gota Arcoíris** | Describe la combinación con cualquier color. |
| Gotas | Jefe | Emperador Líquido | **Titán de Gel** | Tono más sobrio. |
| Cristales | Bomba | Prisma Hipercromático | **Bomba de Color** | Estándar y claro en puzzles Match-3. |
| Cristales | Logro combo | Reverberación | **Combo Quíntuple** | Numérico y comprensible. |
| Cargas | Logro combo | Mega Resonancia | **Resonancia x4** | Preciso sin el prefijo mega. |
| Cargas | Jefe | Fin del Arconte | **Núcleo Central** | Coherente con la temática electromagnética. |
| Lumen | Poder de luz | Chispa Divina | **Destello de Yesca** | Alineado al farol y la linterna. |
| Derrape | Modo difícil | Serpiente Nocturna | **Circuito 3 (Noche)** | Denominación técnica de trazado. |
| Derrape | Rival | CENTELLA | **Rival Oro** | Identificación clara por nivel de habilidad. |
| Campominado | Logro | Misión Titán | **Sector Difícil** | Alineado al léxico de artificiero. |
| Frontón | Dificultad alta | Quantum-X | **Nivel Experto** | Evita nombres pomposos en el selector. |
| Todos los HUDs | Avisos flotantes | ¡IMPARABLE! / ¡ÉPICO! | **Racha x4 / Impacto crítico** | Información limpia de juego sin exclamaciones vacías. |

---

## 6. Pruebas y Verificación del Proceso

### 6.1. Ejecución de Pruebas
- **Capturas iniciales (Before)**: Tomadas y archivadas exitosamente en `scripts/capturas/limpieza/*_before.png` en resolución móvil 390x844 para las 20 pantallas (menú, 3 épocas y 16 juegos).
- **Inspección automatizada de Emojis**: Script `scripts/audit_emojis_and_styles.js` ejecutado, detectando 941 ocurrencias con snippets y líneas exactas.

### 6.2. Próximos Pasos Inmediatos
1. Implementar la biblioteca de iconos `shared/icons.js` (vectorial SVG con trazados por código, `currentColor` y renderizado offscreen para Canvas 2D).
2. Crear la regla de prohibición en `REGLAS-JUEGOS.md` y el validador estricto `scripts/sin-emojis.js`.
3. Esperar confirmación del usuario sobre los renombres de la Sección 5 antes de aplicar cambios en la lógica y textos de los juegos.
4. Proceder con la refactorización visual y limpieza **un juego a la vez**, verificando en cada paso con capturas *after* y las pruebas de humo (`npm run smoke`).


---

## 7. Seguimiento de Limpieza Visual - Paso (d)

### 7.1. Estado de Avance por Parejas

| Pareja | Juegos | Estado | Emojis | Paleta Identitaria | Controles < 44px | Captura After | Tests |
|---|---|:---:|:---:|---|:---:|:---:|:---:|
| Pareja 1 | Cristales con Lanzaburbujas | **COMPLETO** | 0 | Cristales: Geoda Mineral (`#141218`, `#201c27`, `#a855f7`, `#eab308`, `#f5f3ff`)<br>Lanzaburbujas: Arrecife Marino (`#071524`, `#0e2438`, `#06b6d4`, `#f43f5e`, `#f0fdfa`) | **0** | `cristales_after.png`<br>`lanzaburbujas_after.png` | `test_cristales.js` (6/6)<br>`test_cristales_animations.js` (7/7)<br>`test_lanzaburbujas.js` (7/7)<br>`test_lanzaburbujas_visual_logic.js` (7/7)<br>`test_lanzaburbujas_layout.js` (85/85) |
| Pareja 2 | Bloques con Serpiente | **COMPLETO** | 0 | Bloques: Pizarra Arcade Retro (`#0f141c`, `#18202c`, `#f59e0b`, `#06b6d4`, `#f8fafc`)<br>Serpiente: Bosque Esmeralda (`#0a140d`, `#132418`, `#10b981`, `#f59e0b`, `#f0fdf4`) | **0** | `bloques_after.png`<br>`snake_after.png` | `smoke.js` (16/16)<br>`verify_and_capture_game.js` (5/5 viewports) |
| Pareja 3 | Rompe Muros con Frontón | **COMPLETO** | 0 | Rompe Muros: Terracota & Ámbar Cálido (`#1c1311`, `#291a16`, `#ea580c`, `#f59e0b`, `#fef3c7`)<br>Frontón: Pista Cibernética Azul (`#08101d`, `#0e1b2e`, `#1e3a5f`, `#0284c7`, `#f59e0b`) | **0** | `rompemuros_after.png`<br>`fronton_after.png` | `sin-emojis.js` (0 emojis)<br>`verify_and_capture_game.js` (5/5 viewports) |
| Pareja 4 | Defensa Orbital con Sombras | **COMPLETO** | 0 | Defensa Orbital: Espacio Cobalto (`#050814`, `#0c1228`, `#38bdf8`, `#f97316`, `#f8fafc`)<br>Sombras: Sigilo Noir Ultravioleta (`#09070f`, `#140e22`, `#a855f7`, `#f59e0b`, `#f8fafc`) | **0** | `defensaorbital_after.png`<br>`sombras_after.png` | `sin-emojis.js` (0 emojis)<br>`verify_and_capture_game.js` (5/5 viewports) |
| Pareja 5 | Campo Minado con Lumen | **COMPLETO** | 0 | Campo Minado: Pizarra Táctica de Artificiero (`#0f172a`, `#1e293b`, `#334155`, `#dc2626`, `#f59e0b`)<br>Lumen: Obsidiana Profunda & Ámbar Farol (`#070b12`, `#0f1826`, `#f59e0b`, `#06b6d4`, `#f8fafc`) | **0** | `campominado_after.png`<br>`lumen_after.png` | `sin-emojis.js` (0 emojis)<br>`verify_and_capture_game.js` (5/5 viewports) |
| Pareja 6 | Cargas con Derrape | **COMPLETO** | 0 | Cargas: Acero y Alta Tensión Industrial (`#111622`, `#1a2232`, `#eab308`, `#0284c7`, `#f1f5f9`)<br>Derrape: Asfalto Nocturno y Neón Naranja (`#0c0a09`, `#1c1917`, `#f97316`, `#06b6d4`, `#f8fafc`) | **0** | `cargas_after.png`<br>`derrape_after.png` | `test_cargas.js` (9/9)<br>`test_derrape_muros_stuck.js` (6/6)<br>`test_derrape_fase1..4.js` (4/4 suites)<br>`verify_and_capture_game.js` (5/5 viewports) |

### 7.2. Auditoría Táctil Global (Controles < 44x44 px)

Última ejecución de `scripts/audit_touch_targets.js` (post-Pareja 6 - Final):
- **Menú Principal**: 0 controles < 44px (100% OK)
- **Menú Era 80**: 0 controles < 44px (100% OK)
- **Menú Era 90**: 0 controles < 44px (100% OK)
- **Menú Era 00**: 0 controles < 44px (100% OK)
- **Bloques**: 0 controles < 44px (100% OK)
- **Serpiente**: 0 controles < 44px (100% OK)
- **Rompe Muros**: 0 controles < 44px (100% OK)
- **Defensa Orbital**: 0 controles < 44px (100% OK)
- **Sombras**: 0 controles < 44px (100% OK)
- **Derrape**: 0 controles < 44px (100% OK)
- **Abismo**: 0 controles < 44px (100% OK)
- **Frontón**: 0 controles < 44px (100% OK)
- **Campo Minado**: 0 controles < 44px (100% OK)
- **Corredor**: 0 controles < 44px (100% OK)
- **Gotas**: 0 controles < 44px (100% OK)
- **Cristales**: 0 controles < 44px (100% OK)
- **Lanzaburbujas**: 0 controles < 44px (100% OK)
- **Lumen**: 0 controles < 44px (100% OK)
- **Cargas**: 0 controles < 44px (100% OK)
- **Bastión**: 0 controles < 44px (100% OK)

**Total global: 0 controles por debajo de 44x44 px en los 16 juegos del arcade.**

### 7.3. Validación Consolidada Global (scripts/run-all.js)

Se creó e implementó `scripts/run-all.js`, suite automatizada que ejecuta en estricto orden secuencial:
1. `scripts/sin-emojis.js` (validación estricta de 0 emojis en todo el repositorio de producción: 76 archivos analizados).
2. `scripts/smoke.js` (prueba de humo en navegador headless: 16/16 juegos con canvas montado y bucle rAF activo).
3. `scripts/audit_touch_targets.js` (auditoría geométrica de área táctil mínima: 16 juegos + 4 menús con 0 controles < 44 px).
4. **Todos los tests raíz (`test_*.js`)**: 24 suites unitarias.
5. **Todos los tests de scripts (`scripts/test_*.js`)**: 17 suites de integración, invariantes y layout.

**Resultado consolidado**: **44/44 suites superadas (0 fallos)**.
Adicionalmente, se generó el panel de mosaico visual `scripts/capturas/limpieza/comparativa.png` en resolución 1720x2350 px reuniendo las capturas reales *after* de los 16 juegos para verificar la diferenciación de paletas e identidades visuales.

### 7.4. Paletas Reales Computadas (DOM y Cuantización de Píxeles)

Medición empírica realizada mediante `scripts/calculate_real_palettes.js` en navegador headless (DOM computado y cuantización de capturas en bins de 32 niveles):

| Juego | Fondo Body | Fondo Panel | Color Texto | Contraste | Color Acento | 5 Colores Dominantes (Bins 32) |
|---|:---:|:---:|:---:|:---:|:---:|---|
| **Bloques** | `#efe6d2` | `#e2d7be` | `#1f2a44` | 11.49:1 | `#c0392b` | `#f0f0d0, #f0d0b0, #f0d0d0, #303050, #d0d0b0` |
| **Serpiente** | `#1a1200` | `#281c00` | `#ffb000` | 10.14:1 | `#ffd866` | `#101010, #303010, #301010, #f0d070, #101030` |
| **Rompe Muros** | `#f3d9b1` | `#e8c697` | `#4a2412` | 9.90:1 | `#e07a1f` | `#101010, #f0d0b0, #f0f0d0, #d0b090, #503010` |
| **Frontón** | `#0f3d2e` | `#0f172a` | `#f4f1e8` | 10.77:1 | `#f2c94c` | `#105030, #305050, #101010, #f0d050, #307050` |
| **Defensa Orbital** | `#0a1a3a` | `#12162a` | `#e8eefc` | 14.79:1 | `#ff6b4a` | `#101030, #101050, #101010, #103050, #103070` |
| **Sombras** | `#e8e6e1` | `#ffffff` | `#111111` | 15.14:1 | `#d33a2c` | `#f0f0f0, #f0d0f0, #303050, #d0d0f0, #d0d0d0` |
| **Campo Minado** | `#1b4b8a` | `#123360` | `#f2f6ff` | 8.02:1 | `#9fd3ff` | `#303050, #101030, #103030, #305050, #303030` |
| **Corredor** | `#f4c27a` | `#fdf5ea` | `#3a1f0f` | 9.29:1 | `#e4572e` | `#f0f0f0, #301010, #f0b090, #907070, #f0d070` |
| **Abismo** | `#12070a` | `#1a0c11` | `#e8dcd0` | 14.69:1 | `#b3122a` | `#101010, #101030, #301010, #103030, #301030` |
| **Bastión** | `#2f3a33` | `#38463e` | `#e6dcc3` | 8.68:1 | `#b8860b` | `#303030, #103030, #703010, #101030, #305030` |
| **Gotas** | `#f4f7f9` | `#ffffff` | `#12303a` | 12.93:1 | `#0fa3a3` | `#f0f0f0, #10b0b0, #101010, #d0f0f0, #d0d0d0` |
| **Cristales** | `#eef3f8` | `#ffffff` | `#1d2433` | 13.91:1 | `#d6249f` | `#303030, #101030, #b0b0b0, #f0f0f0, #101010` |
| **Lanzaburbujas** | `#d9f3f0` | `#ffffff` | `#0b3954` | 10.44:1 | `#ff6f59` | `#101030, #103030, #f0f0f0, #b0b0b0, #d0f0f0` |
| **Lumen** | `#2a1a10` | `#3d2719` | `#f6e7c8` | 13.71:1 | `#ffd27a` | `#103010, #301010, #103030, #303010, #101010` |
| **Cargas** | `#cfcac2` | `#e4dfd7` | `#2b2b2b` | 8.68:1 | `#ff5a1f` | `#101030, #f0d0d0, #909090, #103030, #505050` |
| **Derrape** | `#2b2d31` | `#2b2d31` | `#f2f2f2` | 12.32:1 | `#ffd400` | `#303030, #101030, #f0d010, #503030, #101010` |

#### Resultados de Validación Automática:
1. **Fondos claros**: 8 de 16 juegos presentan luminancia relativa $L > 0.5$ (Bloques, Rompe Muros, Sombras, Corredor, Gotas, Cristales, Lanzaburbujas, Cargas), superando el umbral mínimo de 7.
2. **Contraste de texto**: El 100% de los juegos cumple la relación mínima WCAG AA $\ge 4.5:1$ (mínimo registrado: 8.02:1 en Campo Minado; máximo: 15.14:1 en Sombras).
3. **Diferenciación e Independencia**: Ningún par de juegos comparte el mismo fondo ni el mismo acento; se eliminó toda herencia involuntaria de `#070913` o `#f59e0b` y se suprimió el neón cian `#00f0ff` globalmente.
