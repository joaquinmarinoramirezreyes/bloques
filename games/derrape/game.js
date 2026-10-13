/**
 * DERRAPE - Juego de Carreras Arcade Cenital (Fase 1)
 * Vanilla JS, Canvas 2D puro, sin dependencias.
 */
(() => {
  'use strict';

  // ============================================================================
  // 1. CONFIGURACIÓN GLOBAL Y PARÁMETROS DE BALANCEO
  // ============================================================================
  const CONFIG = {
    // Física del Auto
    ACCEL: 380,                 // Aceleración hacia adelante (px/s²)
    MAX_SPEED: 460,             // Velocidad máxima normal (px/s)
    REVERSE_SPEED: 140,         // Velocidad máxima en reversa (px/s)
    BRAKE_FORCE: 580,           // Fuerza de frenado ordinario (px/s²)
    ROLLING_FRICTION: 75,       // Resistencia natural al rodar (px/s²)
    OFFROAD_FRICTION_MULT: 3.4, // Multiplicador de fricción en césped
    OFFROAD_MAX_SPEED: 180,     // Límite de velocidad en césped

    // Dirección y Giro
    STEER_SPEED: 3.4,           // Velocidad de giro angular (rad/s)
    STEER_SENSITIVITY: 4.8,     // Suavizado lerp del volante
    MIN_STEER_SPEED_FACTOR: 0.15,// Mínima capacidad de giro a velocidad baja

    // Físicas de Derrape (Drift)
    GRIP_NORMAL: 9.5,           // Agarre lateral en asfalto (adherencia alta)
    GRIP_DRIFT: 2.1,            // Agarre lateral durante derrape (resbala de lado)
    DRIFT_SLIP_THRESHOLD: 80,   // Velocidad lateral mínima para soltar humo/marcas
    HANDBRAKE_DECEL: 240,       // Desaceleración suave con freno de mano

    // Nitro / Turbo
    NITRO_ACCEL: 650,           // Aceleración adicional con Nitro
    NITRO_MAX_SPEED: 620,       // Velocidad punta con Nitro (px/s)
    NITRO_DURATION: 3.0,        // Capacidad máxima de Nitro en segundos
    NITRO_RECHARGE_RATE: 0.35,  // Tasa de recarga pasiva de Nitro por segundo

    // Dimensiones y Geometría del Auto
    CAR_WIDTH: 22,              // Ancho del vehículo (px)
    CAR_LENGTH: 42,             // Longitud del vehículo (px)
    CAR_COLOR: '#f97316',       // Color neón principal de la carrocería
    CAR_ACCENT: '#fb923c',      // Color secundario / alerón

    // Pista y Cámara
    TRACK_WIDTH: 145,           // Ancho de la calzada de asfalto (px)
    CAMERA_LERP: 0.12,          // Suavizado de seguimiento de cámara
    CAMERA_LOOKAHEAD: 0.32,     // Anticipación de visión según velocidad
    CAMERA_BASE_ZOOM: 0.95,     // Zoom a baja velocidad
    CAMERA_HIGH_SPEED_ZOOM: 0.82,// Zoom ampliado a alta velocidad

    // Carreras, Vueltas y Barreras (Fase 2)
    LAPS: 3,                    // Número de vueltas por carrera
    BARRIER_MARGIN: 42,         // Distancia desde bordillo a la barrera de contención (px)
    BARRIER_BOUNCE: 0.38,       // Coeficiente de restitución (rebote suave al chocar)
    BARRIER_FRICTION: 0.65,     // Fricción tangencial al raspar la barrera

    // Rivales IA y Colisiones entre Autos (Fase 3)
    AI_COUNT: 3,                // Número de rivales en pista (total 4 corredores)
    CAR_COLLISION_RADIUS: 14,   // Radio de colisión para choques entre autos (px)
    AI_RUBBER_BANDING: true,    // Ritmo adaptativo sutil para carreras competitivas

    // Power-ups y Obstáculos en Pista (Fase 4)
    BOOST_SPEED_ADD: 140,       // Impulso extra al pisar turbo boost pad
    OIL_SLIP_FACTOR: 0.75,      // Pérdida de agarre al pisar mancha de aceite

    // Frecuencia fija del motor de físicas
    FIXED_STEP: 1 / 120,        // Simulación a 120 Hz para alta precisión
    MAX_SUB_STEPS: 4
  };

  // ============================================================================
  // 2. CATÁLOGO DE PISTAS (4 Circuitos de Dificultad Creciente) (Fase 4)
  // ============================================================================
  const TRACKS_CATALOG = [
    {
      id: 'pista_1',
      name: 'Pista Neón 01',
      subtitle: 'Circuito clásico y fluido',
      difficulty: 'FÁCIL',
      diffClass: 'diff-easy',
      width: 110,
      controlPoints: [
        { x: 300, y: 300 },
        { x: 800, y: 250 },
        { x: 1300, y: 320 },
        { x: 1700, y: 600 },
        { x: 1850, y: 1100 },
        { x: 1650, y: 1600 },
        { x: 1250, y: 1800 },
        { x: 950, y: 1550 },
        { x: 850, y: 1200 },
        { x: 650, y: 1050 },
        { x: 450, y: 1250 },
        { x: 300, y: 1650 },
        { x: -50, y: 1500 },
        { x: -200, y: 1050 },
        { x: -150, y: 600 }
      ],
      boostPads: [35, 230],
      oilSlicks: [115, 330]
    },
    {
      id: 'pista_2',
      name: 'Horquilla Marina',
      subtitle: 'Recta costera y horquilla cerrada',
      difficulty: 'MEDIA',
      diffClass: 'diff-medium',
      width: 102,
      controlPoints: [
        { x: 300, y: 300 },
        { x: 800, y: 300 },
        { x: 1400, y: 300 },
        { x: 1800, y: 550 },
        { x: 1900, y: 1000 },
        { x: 1600, y: 1300 },
        { x: 1200, y: 1150 },
        { x: 900, y: 1300 },
        { x: 750, y: 1700 },
        { x: 600, y: 1750 },
        { x: 450, y: 1550 },
        { x: 500, y: 1000 },
        { x: 250, y: 900 },
        { x: 50, y: 650 },
        { x: 100, y: 400 }
      ],
      boostPads: [40, 180, 310],
      oilSlicks: [100, 240]
    },
    {
      id: 'pista_3',
      name: 'Serpiente Nocturna',
      subtitle: 'Eses rápidas y derrapes continuos',
      difficulty: 'DIFÍCIL',
      diffClass: 'diff-hard',
      width: 96,
      controlPoints: [
        { x: 300, y: 400 },
        { x: 800, y: 350 },
        { x: 1300, y: 450 },
        { x: 1700, y: 350 },
        { x: 2000, y: 700 },
        { x: 1850, y: 1150 },
        { x: 1400, y: 1050 },
        { x: 1100, y: 1350 },
        { x: 1400, y: 1650 },
        { x: 1200, y: 1950 },
        { x: 700, y: 1900 },
        { x: 500, y: 1600 },
        { x: 750, y: 1300 },
        { x: 550, y: 1000 },
        { x: 150, y: 950 },
        { x: 100, y: 600 }
      ],
      boostPads: [45, 200, 350],
      oilSlicks: [110, 270]
    },
    {
      id: 'pista_4',
      name: 'Laberinto Apex',
      subtitle: 'Curvas ciegas y chicanas técnicas',
      difficulty: 'EXPERTA',
      diffClass: 'diff-expert',
      width: 90,
      controlPoints: [
        { x: 300, y: 300 },
        { x: 900, y: 250 },
        { x: 1400, y: 250 },
        { x: 1900, y: 500 },
        { x: 1950, y: 900 },
        { x: 1650, y: 1000 },
        { x: 1450, y: 750 },
        { x: 1200, y: 850 },
        { x: 1300, y: 1250 },
        { x: 1700, y: 1450 },
        { x: 1600, y: 1850 },
        { x: 1150, y: 1950 },
        { x: 950, y: 1650 },
        { x: 750, y: 1850 },
        { x: 400, y: 1800 },
        { x: 250, y: 1400 },
        { x: 450, y: 1100 },
        { x: 100, y: 800 },
        { x: 100, y: 450 }
      ],
      boostPads: [35, 150, 270, 420],
      oilSlicks: [90, 210, 330, 480]
    }
  ];

  const TRACK_DATA_PISTA_1 = TRACKS_CATALOG[0];

  // Perfiles de Rivales IA con Identidad y Personalidad Propia (Fase 3)
  const AI_PROFILES = [
    {
      id: 'vortice',
      name: 'VÓRTICE',
      color: '#06b6d4',          // Cian Neón
      accentColor: '#38bdf8',
      darkColor: '#0e7490',
      spoilerColor: '#164e63',
      laneOffset: -18,           // Trazada interior agresiva
      speedMult: 1.01,
      aggressiveness: 1.08,
      corneringSkill: 0.96
    },
    {
      id: 'fantasma',
      name: 'FANTASMA',
      color: '#a855f7',          // Amatista / Púrpura Neón
      accentColor: '#c084fc',
      darkColor: '#7e22ce',
      spoilerColor: '#581c87',
      laneOffset: 12,            // Trazada media-exterior suave
      speedMult: 0.98,
      aggressiveness: 0.92,
      corneringSkill: 1.02
    },
    {
      id: 'centella',
      name: 'CENTELLA',
      color: '#84cc16',          // Lima Neón
      accentColor: '#a3e635',
      darkColor: '#4d7c0f',
      spoilerColor: '#365314',
      laneOffset: 0,             // Trazada central equilibrada
      speedMult: 0.99,
      aggressiveness: 1.04,
      corneringSkill: 0.94
    }
  ];

  const PLAYER_PROFILE = {
    id: 'player',
    name: 'TÚ',
    color: '#f97316',            // Naranja Neón
    accentColor: '#fb923c',
    darkColor: '#c2410c',
    spoilerColor: '#7c2d12',
    isPlayer: true
  };

  class Track {
    constructor(data) {
      this.data = data;
      this.width = data.width || CONFIG.TRACK_WIDTH;
      this.controlPoints = data.controlPoints;
      this.samples = []; // Puntos equidistantes a lo largo del spline
      this.checkpoints = []; // Puntos de control ordenados (anti-trampas)
      this.powerUps = []; // Power-ups en pista (Fase 4: Turbo y Aceite)
      this.totalLength = 0;
      this.bounds = { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
      this.offscreenCanvas = null;
      this.startPos = { x: 0, y: 0, angle: 0 };

      this.buildSpline();
      this.buildCheckpoints(12);
      this.buildPowerUps();
      this.calculateBounds();
      this.createOffscreenRender();
    }

    /**
     * Evalúa un spline cerrado Catmull-Rom para 4 puntos P0, P1, P2, P3 con t en [0, 1]
     */
    static catmullRom(p0, p1, p2, p3, t) {
      const t2 = t * t;
      const t3 = t2 * t;
      return {
        x: 0.5 * ((2 * p1.x) +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * ((2 * p1.y) +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
      };
    }

    buildSpline() {
      const pts = this.controlPoints;
      const n = pts.length;
      const rawSamples = [];
      const stepsPerSegment = 30;

      for (let i = 0; i < n; i++) {
        const p0 = pts[(i - 1 + n) % n];
        const p1 = pts[i];
        const p2 = pts[(i + 1) % n];
        const p3 = pts[(i + 2) % n];

        for (let s = 0; s < stepsPerSegment; s++) {
          const t = s / stepsPerSegment;
          rawSamples.push(Track.catmullRom(p0, p1, p2, p3, t));
        }
      }

      // Calcular tangentes, normales y distancias acumuladas
      this.samples = [];
      let accumDist = 0;
      const totalRaw = rawSamples.length;

      for (let i = 0; i < totalRaw; i++) {
        const cur = rawSamples[i];
        const next = rawSamples[(i + 1) % totalRaw];
        const prev = rawSamples[(i - 1 + totalRaw) % totalRaw];

        const dx = next.x - prev.x;
        const dy = next.y - prev.y;
        const len = Math.hypot(dx, dy) || 1;
        const tangentX = dx / len;
        const tangentY = dy / len;

        // Normal perpendicular a la derecha (rotación 90° horario)
        const normalX = -tangentY;
        const normalY = tangentX;

        const segDist = Math.hypot(next.x - cur.x, next.y - cur.y);
        accumDist += segDist;

        // Curvatura estimada para calcular pianos/bordillos
        const headingPrev = Math.atan2(cur.y - prev.y, cur.x - prev.x);
        const headingNext = Math.atan2(next.y - cur.y, next.x - cur.x);
        let angleDiff = headingNext - headingPrev;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        const curvature = Math.abs(angleDiff) / Math.max(0.1, segDist);

        this.samples.push({
          x: cur.x,
          y: cur.y,
          tangentX,
          tangentY,
          normalX,
          normalY,
          distance: accumDist,
          curvature
        });
      }

      this.totalLength = accumDist;

      // Ubicación inicial de la parrilla de salida (primeros puntos)
      const pStart = this.samples[0];
      const pAhead = this.samples[10];
      this.startPos = {
        x: pStart.x,
        y: pStart.y,
        angle: Math.atan2(pAhead.y - pStart.y, pAhead.x - pStart.x)
      };
    }

    /**
     * Genera puntos de control equidistantes (Anti-trampas y progreso de carrera)
     */
    buildCheckpoints(numCheckpoints = 12) {
      this.checkpoints = [];
      const n = this.samples.length;
      const interval = Math.floor(n / numCheckpoints);
      const gateRadius = (this.width / 2) + 55;

      for (let i = 0; i < numCheckpoints; i++) {
        const sampleIdx = (i * interval) % n;
        const s = this.samples[sampleIdx];
        this.checkpoints.push({
          index: i,
          sampleIndex: sampleIdx,
          x: s.x,
          y: s.y,
          tangentX: s.tangentX,
          tangentY: s.tangentY,
          normalX: s.normalX,
          normalY: s.normalY,
          radius: gateRadius,
          distance: s.distance
        });
      }
    }

    /**
     * Retorna las posiciones escalonadas de la parrilla de salida (Fase 3)
     */
    getStartingGrid(count = 4) {
      const s0 = this.samples[0];
      const tanX = s0.tangentX;
      const tanY = s0.tangentY;
      const normX = s0.normalX;
      const normY = s0.normalY;
      const angle = Math.atan2(tanY, tanX);

      const slots = [];
      const rowDistances = [36, 92, 148, 204];
      const laneOffsets = [-24, 24]; // Lado izquierdo y derecho de la pista

      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const distBack = rowDistances[row];
        const latOffset = laneOffsets[col];

        slots.push({
          x: s0.x - tanX * distBack + normX * latOffset,
          y: s0.y - tanY * distBack + normY * latOffset,
          angle
        });
      }
      return slots;
    }

    /**
     * Construye los power-ups (Turbo Boost Pads) y obstáculos (Manchas de Aceite) (Fase 4)
     */
    buildPowerUps() {
      this.powerUps = [];
      const n = this.samples.length;
      if (!n) return;

      // 1. Turbo Boost Pads
      if (this.data.boostPads && Array.isArray(this.data.boostPads)) {
        this.data.boostPads.forEach((item, idx) => {
          const sampleIdx = typeof item === 'number' ? (item % n) : (item.sampleIndex % n);
          const latOffset = (typeof item === 'object' && item.offset) ? item.offset : 0;
          const s = this.samples[sampleIdx];
          this.powerUps.push({
            id: `boost_${idx}`,
            type: 'BOOST',
            x: s.x + s.normalX * latOffset,
            y: s.y + s.normalY * latOffset,
            tangentX: s.tangentX,
            tangentY: s.tangentY,
            normalX: s.normalX,
            normalY: s.normalY,
            angle: Math.atan2(s.tangentY, s.tangentX),
            radius: 25,
            cooldown: 0,
            maxCooldown: 4.0
          });
        });
      }

      // 2. Manchas de Aceite (Oil Slicks)
      if (this.data.oilSlicks && Array.isArray(this.data.oilSlicks)) {
        this.data.oilSlicks.forEach((item, idx) => {
          const sampleIdx = typeof item === 'number' ? (item % n) : (item.sampleIndex % n);
          const latOffset = (typeof item === 'object' && item.offset !== undefined) ? item.offset : ((idx % 2 === 0) ? 18 : -18);
          const s = this.samples[sampleIdx];
          this.powerUps.push({
            id: `oil_${idx}`,
            type: 'OIL',
            x: s.x + s.normalX * latOffset,
            y: s.y + s.normalY * latOffset,
            radius: 22,
            cooldown: 0,
            maxCooldown: 5.0
          });
        });
      }
    }

    updatePowerUps(dt) {
      for (const p of this.powerUps) {
        if (p.cooldown > 0) {
          p.cooldown -= dt;
        }
      }
    }

    checkPowerUpCollisions(car, particles, audio) {
      for (const p of this.powerUps) {
        if (p.cooldown > 0) continue;
        const dist = Math.hypot(car.x - p.x, car.y - p.y);
        if (dist < p.radius + CONFIG.CAR_COLLISION_RADIUS) {
          p.cooldown = p.maxCooldown;

          if (p.type === 'BOOST') {
            car.speed = Math.min(CONFIG.NITRO_MAX_SPEED, Math.max(car.speed + CONFIG.BOOST_SPEED_ADD, 360));
            car.vx = Math.cos(car.angle) * car.speed;
            car.vy = Math.sin(car.angle) * car.speed;
            car.nitroFuel = Math.min(CONFIG.NITRO_DURATION, car.nitroFuel + 1.6);
            car.boostPadTimer = 0.8;

            if (particles) {
              for (let i = 0; i < 8; i++) {
                particles.spawn(
                  p.x,
                  p.y,
                  -car.vx * 0.2 + (Math.random() - 0.5) * 60,
                  -car.vy * 0.2 + (Math.random() - 0.5) * 60,
                  0.35,
                  3.5,
                  '#38bdf8'
                );
              }
            }

            if (car.isPlayer && audio) {
              audio.playTurboSound();
              if (typeof window !== 'undefined' && window.ArcadeCanvas) {
                window.ArcadeCanvas.haptic(45);
              }
            }
          } else if (p.type === 'OIL') {
            car.oilSpinTimer = 0.8;
            car.oilSpinDir = Math.random() > 0.5 ? 1 : -1;
            car.angularVelocity = car.oilSpinDir * 6.5;
            car.speed *= CONFIG.OIL_SLIP_FACTOR;
            car.vx *= CONFIG.OIL_SLIP_FACTOR;
            car.vy *= CONFIG.OIL_SLIP_FACTOR;

            if (particles) {
              for (let i = 0; i < 6; i++) {
                particles.spawn(
                  p.x,
                  p.y,
                  (Math.random() - 0.5) * 50,
                  (Math.random() - 0.5) * 50,
                  0.4,
                  3,
                  '#1e1b4b'
                );
              }
            }

            if (car.isPlayer && audio) {
              audio.playOilSlickSound();
              if (typeof window !== 'undefined' && window.ArcadeCanvas) {
                window.ArcadeCanvas.haptic(50);
              }
            }
          }
        }
      }
    }

    renderPowerUps(ctx) {
      for (const p of this.powerUps) {
        if (p.type === 'BOOST') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);

          const isActive = p.cooldown <= 0;
          ctx.globalAlpha = isActive ? 1.0 : 0.35;

          // Placa base
          ctx.fillStyle = isActive ? 'rgba(6, 182, 212, 0.25)' : 'rgba(51, 65, 85, 0.2)';
          ctx.beginPath();
          ctx.roundRect(-16, -20, 32, 40, 4);
          ctx.fill();

          ctx.strokeStyle = isActive ? '#06b6d4' : '#475569';
          ctx.lineWidth = 1.8;
          ctx.stroke();

          // Flechas Neón (Chevrons)
          ctx.fillStyle = isActive ? '#38bdf8' : '#64748b';
          if (isActive) {
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 10;
          }

          for (let step = -8; step <= 8; step += 8) {
            ctx.beginPath();
            ctx.moveTo(step - 4, -12);
            ctx.lineTo(step + 4, 0);
            ctx.lineTo(step - 4, 12);
            ctx.lineTo(step - 1, 12);
            ctx.lineTo(step + 7, 0);
            ctx.lineTo(step - 1, -12);
            ctx.closePath();
            ctx.fill();
          }

          ctx.restore();
        } else if (p.type === 'OIL') {
          ctx.save();
          ctx.translate(p.x, p.y);

          const isActive = p.cooldown <= 0;
          ctx.globalAlpha = isActive ? 0.9 : 0.35;

          // Charco de aceite con forma orgánica
          ctx.fillStyle = '#09090b';
          ctx.beginPath();
          ctx.ellipse(0, 0, 22, 16, Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();

          // Reflejo iridiscente violeta/verde neón
          if (isActive) {
            const grad = ctx.createLinearGradient(-15, -10, 15, 10);
            grad.addColorStop(0, 'rgba(168, 85, 247, 0.6)');
            grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.45)');
            grad.addColorStop(1, 'rgba(132, 204, 22, 0.5)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(-3, -2, 14, 8, -Math.PI / 8, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }
      }
    }

    calculateBounds() {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      const margin = (this.width / 2) + 160; // Margen generoso para pista, barreras y valla exterior

      for (const s of this.samples) {
        minX = Math.min(minX, s.x - margin);
        minY = Math.min(minY, s.y - margin);
        maxX = Math.max(maxX, s.x + margin);
        maxY = Math.max(maxY, s.y + margin);
      }

      this.bounds = {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY
      };
    }

    /**
     * Encuentra la proyección más cercana en la pista y calcula la distancia transversal
     * Devuelve { distanceToCenter, isOffroad, closestSampleIndex, progress }
     */
    queryTrackPosition(x, y) {
      let minDistSq = Infinity;
      let closestIdx = 0;
      const n = this.samples.length;

      // Búsqueda espacial optimizada
      for (let i = 0; i < n; i += 2) {
        const s = this.samples[i];
        const dx = x - s.x;
        const dy = y - s.y;
        const dSq = dx * dx + dy * dy;
        if (dSq < minDistSq) {
          minDistSq = dSq;
          closestIdx = i;
        }
      }

      // Refinar con los vecinos inmediatos
      const testIndices = [
        (closestIdx - 1 + n) % n,
        closestIdx,
        (closestIdx + 1) % n
      ];
      for (const idx of testIndices) {
        const s = this.samples[idx];
        const dSq = (x - s.x) * (x - s.x) + (y - s.y) * (y - s.y);
        if (dSq < minDistSq) {
          minDistSq = dSq;
          closestIdx = idx;
        }
      }

      const closest = this.samples[closestIdx];
      const distToCenter = Math.sqrt(minDistSq);
      const isOffroad = distToCenter > (this.width / 2);

      return {
        distToCenter,
        isOffroad,
        closestIndex: closestIdx,
        closestSample: closest,
        progress: closest.distance / this.totalLength
      };
    }

    createOffscreenRender() {
      if (typeof document === 'undefined') return;

      const b = this.bounds;
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(b.width);
      canvas.height = Math.ceil(b.height);
      const ctx = canvas.getContext('2d');

      // Trasladar al origen relativo del bounding box
      ctx.translate(-b.minX, -b.minY);

      // 1. Césped de fondo con patrón sutil
      ctx.fillStyle = '#0f1711';
      ctx.fillRect(b.minX, b.minY, b.width, b.height);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.012)';
      ctx.lineWidth = 1;
      const stepGrid = 60;
      for (let gx = Math.floor(b.minX / stepGrid) * stepGrid; gx < b.maxX; gx += stepGrid) {
        ctx.beginPath();
        ctx.moveTo(gx, b.minY);
        ctx.lineTo(gx, b.maxY);
        ctx.stroke();
      }
      for (let gy = Math.floor(b.minY / stepGrid) * stepGrid; gy < b.maxY; gy += stepGrid) {
        ctx.beginPath();
        ctx.moveTo(b.minX, gy);
        ctx.lineTo(b.maxX, gy);
        ctx.stroke();
      }

      // 2. Muro perimetral exterior del recinto (delimita el mapa completo)
      const pad = 30;
      const wallMinX = b.minX + pad;
      const wallMinY = b.minY + pad;
      const wallMaxX = b.maxX - pad;
      const wallMaxY = b.maxY - pad;
      const wallW = wallMaxX - wallMinX;
      const wallH = wallMaxY - wallMinY;

      // Base del muro perimetral
      ctx.lineWidth = 12;
      ctx.strokeStyle = '#1e293b';
      ctx.strokeRect(wallMinX, wallMinY, wallW, wallH);

      // Franja reflectante de precaución
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#f59e0b';
      ctx.strokeRect(wallMinX, wallMinY, wallW, wallH);

      // Postes luminosos perimetrales
      const postStep = 180;
      for (let px = wallMinX; px <= wallMaxX; px += postStep) {
        this.drawFloodlight(ctx, px, wallMinY);
        this.drawFloodlight(ctx, px, wallMaxY);
      }
      for (let py = wallMinY; py <= wallMaxY; py += postStep) {
        this.drawFloodlight(ctx, wallMinX, py);
        this.drawFloodlight(ctx, wallMaxX, py);
      }

      const halfW = this.width / 2;
      const n = this.samples.length;
      const barrierDist = halfW + CONFIG.BARRIER_MARGIN;

      // 3. Base de grava exterior (arcén seguro ampliado hasta las barreras)
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const s = this.samples[i % n];
        const px = s.x + s.normalX * (barrierDist + 6);
        const py = s.y + s.normalY * (barrierDist + 6);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      for (let i = n; i >= 0; i--) {
        const s = this.samples[i % n];
        const px = s.x - s.normalX * (barrierDist + 6);
        const py = s.y - s.normalY * (barrierDist + 6);
        ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = '#1c1917';
      ctx.fill();

      // 4. Barreras de contención (Armco de acero y guardarraíles)
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const s = this.samples[i % n];
        const px = s.x + s.normalX * barrierDist;
        const py = s.y + s.normalY * barrierDist;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.lineWidth = 9;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#64748b';
      ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const s = this.samples[i % n];
        const px = s.x - s.normalX * barrierDist;
        const py = s.y - s.normalY * barrierDist;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.lineWidth = 9;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#64748b';
      ctx.stroke();

      // 5. Pilas de neumáticos de seguridad (Tire walls) a ambos lados
      for (let i = 0; i < n; i += 2) {
        const s = this.samples[i];
        const isRed = (Math.floor(i / 4) % 2 === 0);
        const tireColor = isRed ? '#dc2626' : '#f8fafc';

        // Lado derecho
        const rx = s.x + s.normalX * barrierDist;
        const ry = s.y + s.normalY * barrierDist;
        this.drawTireStack(ctx, rx, ry, tireColor);

        // Lado izquierdo
        const lx = s.x - s.normalX * barrierDist;
        const ly = s.y - s.normalY * barrierDist;
        this.drawTireStack(ctx, lx, ly, tireColor);
      }

      // 6. Pianos rayados (bordillos rojo/blanco)
      for (let i = 0; i < n; i++) {
        const s = this.samples[i];
        const sNext = this.samples[(i + 1) % n];
        const color = (Math.floor(i / 2) % 2 === 0) ? '#e11d48' : '#f8fafc';

        // Bordillo exterior derecho
        ctx.beginPath();
        ctx.moveTo(s.x + s.normalX * (halfW - 2), s.y + s.normalY * (halfW - 2));
        ctx.lineTo(s.x + s.normalX * (halfW + 10), s.y + s.normalY * (halfW + 10));
        ctx.lineTo(sNext.x + sNext.normalX * (halfW + 10), sNext.y + sNext.normalY * (halfW + 10));
        ctx.lineTo(sNext.x + sNext.normalX * (halfW - 2), sNext.y + sNext.normalY * (halfW - 2));
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        // Bordillo exterior izquierdo
        ctx.beginPath();
        ctx.moveTo(s.x - s.normalX * (halfW - 2), s.y - s.normalY * (halfW - 2));
        ctx.lineTo(s.x - s.normalX * (halfW + 10), s.y - s.normalY * (halfW + 10));
        ctx.lineTo(sNext.x - sNext.normalX * (halfW + 10), sNext.y - sNext.normalY * (halfW + 10));
        ctx.lineTo(sNext.x - sNext.normalX * (halfW - 2), sNext.y - sNext.normalY * (halfW - 2));
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      }

      // 7. Calzada principal de asfalto
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const s = this.samples[i % n];
        const px = s.x + s.normalX * halfW;
        const py = s.y + s.normalY * halfW;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      for (let i = n; i >= 0; i--) {
        const s = this.samples[i % n];
        const px = s.x - s.normalX * halfW;
        const py = s.y - s.normalY * halfW;
        ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = '#22252a';
      ctx.fill();

      // Líneas blancas continuas laterales
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const s = this.samples[i % n];
        const px = s.x + s.normalX * (halfW - 4);
        const py = s.y + s.normalY * (halfW - 4);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const s = this.samples[i % n];
        const px = s.x - s.normalX * (halfW - 4);
        const py = s.y - s.normalY * (halfW - 4);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Línea central discontinua
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.setLineDash([16, 20]);
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const s = this.samples[i % n];
        if (i === 0) ctx.moveTo(s.x, s.y);
        else ctx.lineTo(s.x, s.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 8. Línea de Meta / Salida con tablero de ajedrez y pórtico
      const startS = this.samples[0];
      const startGridWidth = halfW * 2 - 12;
      const squareSize = 10;
      const numCols = Math.floor(startGridWidth / squareSize);
      ctx.save();
      ctx.translate(startS.x, startS.y);
      const startAngle = Math.atan2(startS.tangentY, startS.tangentX);
      ctx.rotate(startAngle);

      for (let c = -numCols / 2; c < numCols / 2; c++) {
        for (let r = 0; r < 2; r++) {
          ctx.fillStyle = (Math.abs(c + r) % 2 === 0) ? '#ffffff' : '#111111';
          ctx.fillRect(r * squareSize - squareSize, c * squareSize, squareSize, squareSize);
        }
      }

      // Postes y arco elevado de Meta
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-12, -halfW - 14, 24, 12);
      ctx.fillRect(-12, halfW + 2, 24, 12);

      // Barra superior con color neón
      ctx.fillStyle = 'rgba(249, 115, 22, 0.85)';
      ctx.fillRect(-4, -halfW, 8, halfW * 2);

      ctx.restore();

      this.offscreenCanvas = canvas;
    }

    drawTireStack(ctx, x, y, color) {
      // Sombra
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.arc(x + 2, y + 2, 7.5, 0, Math.PI * 2);
      ctx.fill();

      // Caucho exterior
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.arc(x, y, 7.5, 0, Math.PI * 2);
      ctx.fill();

      // Tapa de color
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Centro
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    drawFloodlight(ctx, x, y) {
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    render(ctx) {
      if (!this.offscreenCanvas) return;
      ctx.drawImage(this.offscreenCanvas, this.bounds.minX, this.bounds.minY);
    }
  }

  // ============================================================================
  // 3. FÍSICAS ARCADE DEL VEHÍCULO (Drift & Handling)
  // ============================================================================
  class Car {
    constructor(x, y, angle, options = {}) {
      this.x = x;
      this.y = y;
      this.angle = angle;
      this.name = options.name || 'JUGADOR';
      this.color = options.color || CONFIG.CAR_COLOR;
      this.accentColor = options.accentColor || CONFIG.CAR_ACCENT;
      this.darkColor = options.darkColor || '#c2410c';
      this.spoilerColor = options.spoilerColor || '#7c2d12';
      this.isAI = !!options.isAI;
      this.isPlayer = !!options.isPlayer;

      this.vx = 0;
      this.vy = 0;
      this.angularVelocity = 0;
      this.speed = 0;
      this.steerAngle = 0;

      // Parámetros de estado
      this.isDrifting = false;
      this.isOffroad = false;
      this.isBraking = false;
      this.isNitroActive = false;
      this.nitroFuel = CONFIG.NITRO_DURATION;
      this.lateralSlip = 0;

      // Inputs de conducción
      this.inputSteer = 0;      // -1 (izq) a 1 (der)
      this.inputThrottle = 0;   // 0 a 1
      this.inputBrake = 0;      // 0 a 1
      this.inputHandbrake = false;
      this.inputNitro = false;

      // Ruedas para renderizar giro
      this.wheelTurnAngle = 0;

      // Estado de Vueltas y Puntos de Control (Fase 2)
      this.currentLap = 1;
      this.totalLaps = CONFIG.LAPS;
      this.nextCheckpoint = 1;
      this.checkpointsPassed = 0;
      this.lapStartTime = 0;
      this.currentLapTime = 0;
      this.lapTimes = [];
      this.bestLapTime = null;
      this.finished = false;
      this.finishTime = null;

      // Ranking y Progreso (Fase 3)
      this.rank = 1;
      this.trackProgress = 0;
      this.totalRaceScore = 0;

      // Efectos temporales de Power-ups (Fase 4)
      this.boostPadTimer = 0;
      this.oilSpinTimer = 0;
      this.oilSpinDir = 1;
    }

    update(dt, track) {
      // 1. Vectores unitarios longitudinal (adelante) y lateral (derecha)
      const forwardX = Math.cos(this.angle);
      const forwardY = Math.sin(this.angle);
      const lateralX = -Math.sin(this.angle);
      const lateralY = Math.cos(this.angle);

      // 2. Descomponer velocidad actual en ejes local y lateral
      const forwardVelocity = this.vx * forwardX + this.vy * forwardY;
      const lateralVelocity = this.vx * lateralX + this.vy * lateralY;
      this.speed = forwardVelocity;
      this.lateralSlip = Math.abs(lateralVelocity);

      // 3. Consulta de superficie en la pista
      const trackQuery = track.queryTrackPosition(this.x, this.y);
      this.isOffroad = trackQuery.isOffroad;

      // 4. Nitro Boost
      let currentAccel = CONFIG.ACCEL;
      let currentMaxSpeed = CONFIG.MAX_SPEED;

      if (this.inputNitro && this.nitroFuel > 0.1 && forwardVelocity > 40) {
        this.isNitroActive = true;
        this.nitroFuel = Math.max(0, this.nitroFuel - dt);
        currentAccel += CONFIG.NITRO_ACCEL;
        currentMaxSpeed = CONFIG.NITRO_MAX_SPEED;
      } else {
        this.isNitroActive = false;
        this.nitroFuel = Math.min(CONFIG.NITRO_DURATION, this.nitroFuel + CONFIG.NITRO_RECHARGE_RATE * dt);
      }

      // Efecto sostenido de Turbo Boost Pad (Fase 4)
      if (this.boostPadTimer > 0) {
        this.boostPadTimer -= dt;
        this.isNitroActive = true;
        currentAccel += CONFIG.NITRO_ACCEL * 1.3;
        currentMaxSpeed = CONFIG.NITRO_MAX_SPEED;
      }

      // Penalización si está sobre césped
      if (this.isOffroad) {
        currentMaxSpeed = Math.min(currentMaxSpeed, CONFIG.OFFROAD_MAX_SPEED);
      }

      // 5. Aceleración / Tracción
      let accelForce = 0;
      if (this.inputThrottle > 0) {
        if (forwardVelocity < currentMaxSpeed) {
          accelForce = this.inputThrottle * currentAccel;
        }
      }

      // Frenado / Reversa
      let brakeForce = 0;
      this.isBraking = false;
      if (this.inputBrake > 0) {
        this.isBraking = true;
        if (forwardVelocity > 15) {
          brakeForce = -this.inputBrake * CONFIG.BRAKE_FORCE;
        } else if (forwardVelocity > -CONFIG.REVERSE_SPEED) {
          brakeForce = -CONFIG.ACCEL * 0.55;
        }
      }

      // Freno de mano (inicia derrape intencional)
      if (this.inputHandbrake) {
        this.isBraking = true;
        brakeForce -= CONFIG.HANDBRAKE_DECEL;
      }

      // Fricción por superficie
      let frictionCoeff = CONFIG.ROLLING_FRICTION;
      if (this.isOffroad) {
        frictionCoeff *= CONFIG.OFFROAD_FRICTION_MULT;
      }
      const rollingDrag = Math.sign(forwardVelocity) * frictionCoeff;

      // Actualizar velocidad longitudinal
      let newForwardVel = forwardVelocity + (accelForce + brakeForce - rollingDrag) * dt;

      // Frenado hasta detenerse por completo si no hay acelerador
      if (this.inputThrottle === 0 && this.inputBrake === 0 && Math.abs(forwardVelocity) < 10) {
        newForwardVel = 0;
      }

      // 6. Agarre lateral y física de derrape
      // Efecto de patinazo por mancha de aceite (Fase 4)
      if (this.oilSpinTimer > 0) {
        this.oilSpinTimer -= dt;
      }

      const wantsDrift = this.inputHandbrake || (Math.abs(this.inputSteer) > 0.6 && Math.abs(forwardVelocity) > 280);
      let gripFactor = wantsDrift ? CONFIG.GRIP_DRIFT : CONFIG.GRIP_NORMAL;
      if (this.oilSpinTimer > 0) {
        gripFactor = 0.35; // Pérdida drástica de tracción lateral
      }

      this.isDrifting = this.oilSpinTimer > 0 || (wantsDrift && Math.abs(lateralVelocity) > CONFIG.DRIFT_SLIP_THRESHOLD);

      // El agarre disipa la velocidad lateral
      const newLateralVel = lateralVelocity * Math.max(0, 1 - gripFactor * dt);

      // 7. Dirección y Giro Angular dependiente de la velocidad
      this.steerAngle += (this.inputSteer - this.steerAngle) * Math.min(1.0, CONFIG.STEER_SENSITIVITY * dt);
      this.wheelTurnAngle = this.steerAngle * 0.45; // Ángulo visual de ruedas delanteras

      // Ratio de giro según velocidad (a velocidad 0 casi no gira)
      const speedRatio = Math.min(1.0, Math.abs(forwardVelocity) / 220);
      const steerFactor = Math.max(CONFIG.MIN_STEER_SPEED_FACTOR, speedRatio);
      const driftTurnBonus = this.isDrifting ? 1.35 : 1.0;

      let targetAngularVel = this.steerAngle * CONFIG.STEER_SPEED * steerFactor * driftTurnBonus * Math.sign(forwardVelocity || 1);
      if (this.oilSpinTimer > 0) {
        targetAngularVel += (this.oilSpinDir || 1) * (3.5 + Math.sin(this.oilSpinTimer * 12) * 2.0); // Giro incontrolado
      }

      this.angularVelocity = targetAngularVel;
      this.angle += this.angularVelocity * dt;

      // 8. Reconstruir vector de velocidad en coordenadas globales
      this.vx = forwardX * newForwardVel + lateralX * newLateralVel;
      this.vy = forwardY * newForwardVel + lateralY * newLateralVel;

      // 9. Actualizar posición
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // 10. Colisión con barreras de contención (Fase 2)
      let barrierCollision = null;
      if (track) {
        const queryAfter = track.queryTrackPosition(this.x, this.y);
        const barrierRadius = (track.width / 2) + CONFIG.BARRIER_MARGIN;
        const carCollisionRadius = 14;

        if (queryAfter.distToCenter + carCollisionRadius > barrierRadius) {
          const dx = queryAfter.closestSample.x - this.x;
          const dy = queryAfter.closestSample.y - this.y;
          const dist = Math.hypot(dx, dy) || 1;
          const nx = dx / dist; // Vector normal hacia el centro de la pista
          const ny = dy / dist;

          const overlap = (queryAfter.distToCenter + carCollisionRadius) - barrierRadius;
          this.x += nx * overlap;
          this.y += ny * overlap;

          // Descomponer velocidad en normal y tangencial
          const vn = this.vx * nx + this.vy * ny;
          const vt = -this.vx * ny + this.vy * nx;

          if (vn < 0) { // Impacto hacia afuera contra el muro
            const bounceVn = -vn * CONFIG.BARRIER_BOUNCE;
            const frictionVt = vt * CONFIG.BARRIER_FRICTION;
            this.vx = nx * bounceVn - ny * frictionVt;
            this.vy = ny * bounceVn + nx * frictionVt;

            barrierCollision = {
              intensity: Math.min(1.0, Math.abs(vn) / 220),
              nx,
              ny,
              x: this.x - nx * carCollisionRadius,
              y: this.y - ny * carCollisionRadius
            };
          }
        }

        // Límite perimetral absoluto del recinto exterior (delimita el mapa completamente)
        const pad = 42;
        const b = track.bounds;
        if (this.x < b.minX + pad) { this.x = b.minX + pad; this.vx = Math.abs(this.vx) * 0.4; }
        if (this.x > b.maxX - pad) { this.x = b.maxX - pad; this.vx = -Math.abs(this.vx) * 0.4; }
        if (this.y < b.minY + pad) { this.y = b.minY + pad; this.vy = Math.abs(this.vy) * 0.4; }
        if (this.y > b.maxY - pad) { this.y = b.maxY - pad; this.vy = -Math.abs(this.vy) * 0.4; }
      }

      return { barrierCollision };
    }

    render(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);

      const w = CONFIG.CAR_WIDTH;
      const l = CONFIG.CAR_LENGTH;

      // 1. Sombra difusa proyectada en el asfalto
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.roundRect(-l / 2 + 3, -w / 2 + 3, l, w, 5);
      ctx.fill();

      // 2. Ruedas (las delanteras giran con el volante)
      const wheelW = 10;
      const wheelH = 4.5;
      ctx.fillStyle = '#111827';

      // Ruedas traseras fijas
      ctx.fillRect(-l / 2 + 5, -w / 2 - 2, wheelW, wheelH);
      ctx.fillRect(-l / 2 + 5, w / 2 - 2.5, wheelW, wheelH);

      // Ruedas delanteras orientables
      ctx.save();
      ctx.translate(l / 2 - 8, -w / 2);
      ctx.rotate(this.wheelTurnAngle);
      ctx.fillRect(-wheelW / 2, -2, wheelW, wheelH);
      ctx.restore();

      ctx.save();
      ctx.translate(l / 2 - 8, w / 2);
      ctx.rotate(this.wheelTurnAngle);
      ctx.fillRect(-wheelW / 2, -2.5, wheelW, wheelH);
      ctx.restore();

      // 3. Chasis aerodinámico con degradado neón
      const chassisGrad = ctx.createLinearGradient(-l / 2, 0, l / 2, 0);
      chassisGrad.addColorStop(0, this.darkColor);
      chassisGrad.addColorStop(0.5, this.color);
      chassisGrad.addColorStop(1, this.accentColor);

      ctx.fillStyle = chassisGrad;
      ctx.beginPath();
      ctx.roundRect(-l / 2, -w / 2, l, w, [6, 10, 10, 6]);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Franja de competición blanca central
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(-l / 2 + 2, -2, l - 4, 4);

      // 4. Parabrisas y cabina
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-l / 2 + 12, -w / 2 + 3.5, 17, w - 7, 3);
      ctx.fill();

      // Reflejo de cristal en el parabrisas
      ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.beginPath();
      ctx.moveTo(l / 2 - 16, -w / 2 + 4.5);
      ctx.lineTo(l / 2 - 13, -w / 2 + 4.5);
      ctx.lineTo(l / 2 - 19, w / 2 - 4.5);
      ctx.lineTo(l / 2 - 22, w / 2 - 4.5);
      ctx.closePath();
      ctx.fill();

      // 5. Alerón trasero
      ctx.fillStyle = this.spoilerColor;
      ctx.fillRect(-l / 2 + 1, -w / 2 + 1, 4, w - 2);

      // 6. Luces delanteras (faros LED)
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(l / 2 - 3, -w / 2 + 2, 3, 4);
      ctx.fillRect(l / 2 - 3, w / 2 - 6, 3, 4);

      // 7. Luces de freno traseras (brillan con intensidad al frenar)
      ctx.fillStyle = this.isBraking ? '#ef4444' : '#7f1d1d';
      if (this.isBraking) {
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
      }
      ctx.fillRect(-l / 2 - 1, -w / 2 + 2.5, 2, 4);
      ctx.fillRect(-l / 2 - 1, w / 2 - 6.5, 2, 4);
      ctx.shadowBlur = 0;

      // 8. Fuego de Nitro en el escape
      if (this.isNitroActive) {
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(-l / 2 - 1, -3);
        ctx.lineTo(-l / 2 - 14 - Math.random() * 8, 0);
        ctx.lineTo(-l / 2 - 1, 3);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 9. Rótulo de rival IA (Fase 3)
      if (this.isAI) {
        ctx.save();
        ctx.rotate(-this.angle); // Mantener texto horizontal respecto al ojo
        ctx.font = '900 8.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 6;
        ctx.fillText(this.name, 0, -w / 2 - 4);
        ctx.restore();
      }

      ctx.restore();
    }
  }

  // ============================================================================
  // 3.1 VEHÍCULO RIVAL CONTROLADO POR INTELIGENCIA ARTIFICIAL (IA)
  // ============================================================================
  class AICar extends Car {
    constructor(x, y, angle, profile) {
      super(x, y, angle, {
        name: profile.name,
        color: profile.color,
        accentColor: profile.accentColor,
        darkColor: profile.darkColor,
        spoilerColor: profile.spoilerColor,
        isAI: true
      });

      this.profile = profile;
      this.laneOffset = profile.laneOffset || 0;
      this.speedMult = profile.speedMult || 1.0;
      this.aggressiveness = profile.aggressiveness || 1.0;
      this.corneringSkill = profile.corneringSkill || 1.0;
      this.errorWobble = 0;
      this.errorTimer = Math.random() * 2;
    }

    updateAI(dt, track, playerCar, allCars) {
      if (this.finished) {
        this.inputThrottle = 0.35;
        this.inputBrake = 0.4;
        this.inputNitro = false;
        return;
      }

      // 1. Proyección actual en la pista
      const trackPos = track.queryTrackPosition(this.x, this.y);
      const curIdx = trackPos.closestIndex;
      const n = track.samples.length;
      this.trackProgress = trackPos.closestSample.distance;

      // 2. Anticipación hacia adelante (Lookahead) según velocidad
      const lookaheadDistance = 75 + Math.abs(this.speed) * 0.28;
      const sampleSpacing = track.totalLength / n;
      const lookaheadSteps = Math.max(3, Math.round(lookaheadDistance / sampleSpacing));
      const targetSample = track.samples[(curIdx + lookaheadSteps) % n];

      // 3. Error aleatorio sutil para comportamiento orgánico y humano
      this.errorTimer -= dt;
      if (this.errorTimer <= 0) {
        this.errorWobble = (Math.random() - 0.5) * (18 * (1.1 - this.corneringSkill));
        this.errorTimer = 1.0 + Math.random() * 1.5;
      }

      // 4. Esquivar vehículos cercanos (Evitación lateral)
      let avoidanceOffset = 0;
      if (allCars) {
        for (const other of allCars) {
          if (other === this) continue;
          const dx = other.x - this.x;
          const dy = other.y - this.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 65) {
            const forwardX = Math.cos(this.angle);
            const forwardY = Math.sin(this.angle);
            const dotForward = dx * forwardX + dy * forwardY;
            if (dotForward > 0) { // Si el otro auto está adelante
              const lateralX = -Math.sin(this.angle);
              const lateralY = Math.cos(this.angle);
              const dotLateral = dx * lateralX + dy * lateralY;
              avoidanceOffset -= Math.sign(dotLateral || 1) * 26 * (1 - dist / 65);
            }
          }
        }
      }

      // Posición objetivo en la calzada
      const totalOffset = Math.max(-42, Math.min(42, this.laneOffset + this.errorWobble + avoidanceOffset));
      const targetX = targetSample.x + targetSample.normalX * totalOffset;
      const targetY = targetSample.y + targetSample.normalY * totalOffset;

      // 5. Giro y volante (Steering)
      const targetAngle = Math.atan2(targetY - this.y, targetX - this.x);
      let angleDiff = targetAngle - this.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      this.inputSteer = Math.max(-1, Math.min(1, angleDiff * 2.5));

      // 6. Análisis de curvatura adelante para calcular frenado y velocidad segura
      let maxCurvatureAhead = 0;
      const curveScanSteps = 16;
      for (let s = 1; s <= curveScanSteps; s++) {
        const scanIdx = (curIdx + s) % n;
        if (track.samples[scanIdx].curvature > maxCurvatureAhead) {
          maxCurvatureAhead = track.samples[scanIdx].curvature;
        }
      }

      // 7. Rubber Banding sutil frente al jugador (mantiene la carrera cerrada)
      let rubberBandFactor = 1.0;
      if (CONFIG.AI_RUBBER_BANDING && playerCar) {
        const playerScore = (playerCar.currentLap - 1) * track.totalLength + (playerCar.trackProgress || 0);
        const myScore = (this.currentLap - 1) * track.totalLength + this.trackProgress;
        const diff = myScore - playerScore;

        if (diff > 300) {
          rubberBandFactor = Math.max(0.88, 1.0 - (diff - 300) / 2500);
        } else if (diff < -300) {
          rubberBandFactor = Math.min(1.14, 1.0 + (-diff - 300) / 2500);
        }
      }

      // Velocidad máxima permitida en la curva
      const curveSpeedLimit = CONFIG.MAX_SPEED * (1.0 - Math.min(0.6, maxCurvatureAhead * 420 * (2.0 - this.corneringSkill)));
      const targetSpeed = curveSpeedLimit * this.speedMult * rubberBandFactor;

      if (this.speed > targetSpeed + 25) {
        this.inputThrottle = 0;
        this.inputBrake = Math.min(1.0, (this.speed - targetSpeed) / 70);
        this.inputHandbrake = (maxCurvatureAhead > 0.0025 && this.speed > 260 && Math.random() < 0.25);
      } else {
        this.inputThrottle = 1;
        this.inputBrake = 0;
        this.inputHandbrake = false;
      }

      // Uso táctico de Nitro en rectas
      if (maxCurvatureAhead < 0.0008 && this.speed > 280 && this.nitroFuel > 1.2 && Math.random() < 0.05) {
        this.inputNitro = true;
      } else {
        this.inputNitro = false;
      }
    }
  }

  // ============================================================================
  // 3.2 RESOLUCIÓN DE COLISIONES AUTO CONTRA AUTO (Empujón simple)
  // ============================================================================
  function resolveCarCollisions(allCars, playerCar, particles, audio) {
    const minDist = CONFIG.CAR_COLLISION_RADIUS * 2; // 28 px
    const minDistSq = minDist * minDist;
    const n = allCars.length;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const A = allCars[i];
        const B = allCars[j];

        const dx = B.x - A.x;
        const dy = B.y - A.y;
        const dSq = dx * dx + dy * dy;

        if (dSq < minDistSq && dSq > 0.001) {
          const d = Math.sqrt(dSq);
          const nx = dx / d;
          const ny = dy / d;
          const overlap = minDist - d;

          // 1. Separación física para evitar solapamiento
          A.x -= nx * overlap * 0.5;
          A.y -= ny * overlap * 0.5;
          B.x += nx * overlap * 0.5;
          B.y += ny * overlap * 0.5;

          // 2. Intercambio de velocidad / Momento elástico (Empujón simple)
          const rvx = B.vx - A.vx;
          const rvy = B.vy - A.vy;
          const velAlongNormal = rvx * nx + rvy * ny;

          if (velAlongNormal < 0) { // Se aproximan el uno al otro
            const restitution = 0.45;
            const impulse = -(1 + restitution) * velAlongNormal * 0.5;

            A.vx -= nx * impulse;
            A.vy -= ny * impulse;
            B.vx += nx * impulse;
            B.vy += ny * impulse;

            // Feedback sonoro y háptico si el jugador participa en el choque
            if (audio && (A === playerCar || B === playerCar)) {
              audio.playCrashSound(Math.min(1.0, Math.abs(velAlongNormal) / 220));
              if (typeof window !== 'undefined' && window.ArcadeCanvas) {
                window.ArcadeCanvas.haptic(35);
              }
            }

            // Chispas de fricción
            if (particles) {
              const midX = (A.x + B.x) / 2;
              const midY = (A.y + B.y) / 2;
              for (let s = 0; s < 3; s++) {
                particles.spawn(
                  midX,
                  midY,
                  (Math.random() - 0.5) * 80,
                  (Math.random() - 0.5) * 80,
                  0.22,
                  2.5,
                  '#f59e0b'
                );
              }
            }
          }
        }
      }
    }
  }

  // ============================================================================
  // 3.3 CÁLCULO DE POSICIONES EN VIVO (1° A 4°)
  // ============================================================================
  function updateRaceRankings(allCars, track) {
    for (const c of allCars) {
      if (c.finished) {
        c.totalRaceScore = 10000000 - (c.finishTime || 9999);
      } else {
        const query = track.queryTrackPosition(c.x, c.y);
        let prog = query.closestSample.distance;
        // Si está en la primera vuelta y no ha cruzado aún la meta o primer CP
        if (c.currentLap === 1 && c.checkpointsPassed === 0 && prog > track.totalLength * 0.7) {
          prog -= track.totalLength;
        }
        c.trackProgress = prog;
        c.totalRaceScore = (c.currentLap - 1) * track.totalLength + prog;
      }
    }

    // Ordenar de mayor a menor progreso
    allCars.sort((a, b) => b.totalRaceScore - a.totalRaceScore);

    // Asignar puestos 1 a 4
    for (let k = 0; k < allCars.length; k++) {
      allCars[k].rank = k + 1;
    }
  }

  // ============================================================================
  // 4. PARTÍCULAS Y MARCAS DE DERRAPE (Tire Skid Layer)
  // ============================================================================
  class ParticlePool {
    constructor(maxCount = 200) {
      this.pool = Array.from({ length: maxCount }, () => ({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        size: 2,
        color: '#ffffff',
        alpha: 1
      }));
    }

    spawn(x, y, vx, vy, maxLife, size, color) {
      const p = this.pool.find(item => !item.active);
      if (!p) return;
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = vx;
      p.vy = vy;
      p.life = maxLife;
      p.maxLife = maxLife;
      p.size = size;
      p.color = color;
      p.alpha = 1;
    }

    update(dt) {
      for (const p of this.pool) {
        if (!p.active) continue;
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha = p.life / p.maxLife;
      }
    }

    render(ctx) {
      for (const p of this.pool) {
        if (!p.active) continue;
        ctx.save();
        ctx.globalAlpha = p.alpha * 0.45;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  class SkidmarkManager {
    constructor(trackBounds) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = Math.ceil(trackBounds.width);
      this.canvas.height = Math.ceil(trackBounds.height);
      this.ctx = this.canvas.getContext('2d');
      this.bounds = trackBounds;
      this.lastPoints = []; // Para unir líneas continuas de neumáticos
    }

    addSegment(x1, y1, x2, y2, alpha = 0.3) {
      this.ctx.save();
      this.ctx.translate(-this.bounds.minX, -this.bounds.minY);
      this.ctx.strokeStyle = `rgba(18, 18, 22, ${alpha})`;
      this.ctx.lineWidth = 3.8;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
      this.ctx.restore();
    }

    render(ctx) {
      ctx.drawImage(this.canvas, this.bounds.minX, this.bounds.minY);
    }
  }

  // ============================================================================
  // 5. MOTOR DE SONIDO SINTETIZADO (Web Audio API)
  // ============================================================================
  class RacingAudio {
    constructor() {
      this.ctx = null;
      this.engineOsc = null;
      this.engineGain = null;
      this.isMuted = false;
      this.initialized = false;

      try {
        this.isMuted = localStorage.getItem('arcade_audio_muted') === 'true';
      } catch (e) {}
    }

    init() {
      if (this.initialized) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      // Oscilador continuo del motor del auto
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(65, this.ctx.currentTime);
      this.engineGain.gain.setValueAtTime(this.isMuted ? 0 : 0.05, this.ctx.currentTime);

      // Filtro pasa-bajos para sonido de motor realista
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
      this.initialized = true;
    }

    updateEngine(speed, isNitro) {
      if (!this.initialized || !this.ctx || this.isMuted) return;

      const normSpeed = Math.min(1.2, Math.abs(speed) / CONFIG.MAX_SPEED);
      const baseFreq = 55 + normSpeed * 170 + (isNitro ? 50 : 0);
      const targetGain = 0.04 + normSpeed * 0.06;

      this.engineOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.05);
      this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }

    playDriftScreech() {
      if (!this.initialized || !this.ctx || this.isMuted) return;
      if (Math.random() > 0.15) return; // Limitar frecuencia de tonos para no saturar

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800 + Math.random() * 200, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    }

    playCountdownBeep(isFinal = false) {
      if (!this.initialized || !this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isFinal ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(isFinal ? 880 : 440, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isFinal ? 0.35 : 0.18));

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + (isFinal ? 0.35 : 0.18));
    }

    playCrashSound(intensity = 0.5) {
      if (!this.initialized || !this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

      const vol = Math.min(0.12, 0.04 + intensity * 0.08);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    }

    playLapSound() {
      if (!this.initialized || !this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25]; // C5, E5
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.25);
      });
    }

    playFinishFanfare() {
      if (!this.initialized || !this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.09, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.5);
      });
    }

    playTurboSound() {
      if (!this.initialized || !this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.35);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 0.35);
      filter.Q.value = 3;

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    }

    playOilSlickSound() {
      if (!this.initialized || !this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.15);
      osc.frequency.linearRampToValueAtTime(280, now + 0.3);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      if (this.engineGain && this.ctx) {
        this.engineGain.gain.setValueAtTime(this.isMuted ? 0 : 0.06, this.ctx.currentTime);
      }
      return this.isMuted;
    }
  }

  // ============================================================================
  // 6. CONTROLADOR PRINCIPAL DEL JUEGO (Game Loop, Vueltas y Estado)
  // ============================================================================
  function formatTime(seconds) {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return '--:--.-';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const tenths = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${tenths}`;
  }

  function getStoredBestLap(trackId) {
    try {
      const val = localStorage.getItem('arcade_derrape_best_' + trackId);
      return val ? parseFloat(val) : null;
    } catch (e) {
      return null;
    }
  }

  function saveStoredBestLap(trackId, timeSeconds) {
    try {
      const cur = getStoredBestLap(trackId);
      if (!cur || timeSeconds < cur) {
        localStorage.setItem('arcade_derrape_best_' + trackId, timeSeconds.toFixed(2));
        return true;
      }
    } catch (e) {}
    return false;
  }

  class DerrapeGame {
    constructor() {
      this.canvas = document.getElementById('game-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.boardWrapper = document.getElementById('board-wrapper');

      // Elementos del HUD
      this.speedValEl = document.getElementById('speed-value');
      this.speedBarFillEl = document.getElementById('speed-bar-fill');
      this.nitroFillEl = document.getElementById('nitro-fill');
      this.driftAlertEl = document.getElementById('drift-alert');
      this.lapDisplayEl = document.getElementById('lap-display');
      this.timeDisplayEl = document.getElementById('time-display');
      this.bestDisplayEl = document.getElementById('best-display');
      this.posDisplayEl = document.getElementById('pos-display');

      // Elementos de cuenta atrás y banners
      this.countdownOverlayEl = document.getElementById('countdown-overlay');
      this.countdownNumberEl = document.getElementById('countdown-number');
      this.lapBannerEl = document.getElementById('lap-banner');
      this.lapBannerTitleEl = document.getElementById('lap-banner-title');
      this.lapBannerSubEl = document.getElementById('lap-banner-sub');

      // Modales y botones
      this.startModal = document.getElementById('start-modal');
      this.pauseModal = document.getElementById('pause-modal');
      this.resultsModalEl = document.getElementById('results-modal');
      this.resPosEl = document.getElementById('res-pos');
      this.resTotalTimeEl = document.getElementById('res-total-time');
      this.resBestLapEl = document.getElementById('res-best-lap');
      this.resLapsListEl = document.getElementById('res-laps-list');
      this.resStandingsListEl = document.getElementById('res-standings-list');
      this.btnResultsRestart = document.getElementById('btn-results-restart');
      this.btnStart = document.getElementById('btn-start');
      this.btnResume = document.getElementById('btn-resume');
      this.btnRestart = document.getElementById('btn-restart');
      this.btnPause = document.getElementById('btn-pause');
      this.btnSound = document.getElementById('btn-sound');
      this.btnToggleAutoaccel = document.getElementById('btn-toggle-autoaccel');
      this.btnToggleGyro = document.getElementById('btn-toggle-gyro');

      // Elementos del selector de pistas (Fase 4)
      this.circuitNameBadgeEl = document.getElementById('circuit-name-badge');
      this.trackCardsGridEl = document.getElementById('track-cards-grid');
      this.btnChangeTrack = document.getElementById('btn-change-track');
      this.btnResultsNext = document.getElementById('btn-results-next');
      this.btnResultsSelect = document.getElementById('btn-results-select');
      this.startTrackSubtitleEl = document.getElementById('start-track-subtitle');
      this.resultsTrackNameEl = document.getElementById('results-track-name');

      // Zonas y botones táctiles
      this.touchSteerLeft = document.getElementById('touch-steer-left');
      this.touchSteerRight = document.getElementById('touch-steer-right');
      this.btnTouchDrift = document.getElementById('btn-touch-drift');
      this.btnTouchNitro = document.getElementById('btn-touch-nitro');

      // Estado del juego
      this.state = 'READY'; // 'READY', 'COUNTDOWN', 'RACING', 'PAUSED', 'FINISHED'
      this.autoAcceleration = true;
      this.gyroscopeEnabled = false;
      this.gyroSupported = false;
      this.countdown = 3;
      this.countdownElapsed = 0;
      this.bannerTimeout = null;
      this.currentTrackIndex = 0;

      // Instancias de juego y rivales IA (Fase 3 & 4)
      this.track = new Track(TRACKS_CATALOG[0]);
      this.initCars();
      this.particles = new ParticlePool(250);
      this.skidmarks = new SkidmarkManager(this.track.bounds);
      this.audio = new RacingAudio();

      // Cámara
      this.camera = {
        x: this.car.x,
        y: this.car.y,
        zoom: CONFIG.CAMERA_BASE_ZOOM,
        viewportW: 800,
        viewportH: 600
      };

      // Tiempos e interpolación
      this.lastTimestamp = 0;
      this.accumulator = 0;
      this.raceTime = 0;

      // Marcas previas de neumáticos para estela continua
      this.prevTirePos = null;

      this.initEvents();
      this.checkGyroscopeSupport();
      this.resizeCanvas();
      this.renderTrackCards();
      this.updateHUD();
      this.requestFrame();
    }

    initCars() {
      const grid = this.track.getStartingGrid(1 + CONFIG.AI_COUNT);
      // Los 3 rivales ocupan las primeras posiciones en la parrilla
      this.aiCars = AI_PROFILES.map((profile, i) => {
        const slot = grid[i];
        return new AICar(slot.x, slot.y, slot.angle, profile);
      });

      // El jugador arranca en la 4° posición (desafío de remontada arcade)
      const pSlot = grid[3];
      this.car = new Car(pSlot.x, pSlot.y, pSlot.angle, {
        name: PLAYER_PROFILE.name,
        color: PLAYER_PROFILE.color,
        accentColor: PLAYER_PROFILE.accentColor,
        darkColor: PLAYER_PROFILE.darkColor,
        spoilerColor: PLAYER_PROFILE.spoilerColor,
        isPlayer: true
      });
      this.car.bestLapTime = getStoredBestLap(this.track.data.id);

      this.allCars = [...this.aiCars, this.car];
      updateRaceRankings(this.allCars, this.track);
    }

    renderTrackCards() {
      if (!this.trackCardsGridEl) return;
      this.trackCardsGridEl.innerHTML = TRACKS_CATALOG.map((t, idx) => {
        const bestTime = getStoredBestLap(t.id);
        const bestText = bestTime ? formatTime(bestTime) : '--:--.-';
        const isActive = idx === this.currentTrackIndex;

        return `
          <div class="track-card ${isActive ? 'active' : ''}" data-index="${idx}">
            <div class="track-card-header">
              <span class="track-card-name">${t.name}</span>
              <span class="track-diff-pill ${t.diffClass}">${t.difficulty}</span>
            </div>
            <div class="track-card-best">
              <span>★</span>
              <span>${bestText}</span>
            </div>
          </div>
        `;
      }).join('');

      const cards = this.trackCardsGridEl.querySelectorAll('.track-card');
      cards.forEach(card => {
        card.addEventListener('click', () => {
          const idx = parseInt(card.dataset.index, 10);
          this.selectTrack(idx, false);
        });
      });
    }

    selectTrack(index, autoStart = false) {
      if (index < 0 || index >= TRACKS_CATALOG.length) return;
      this.currentTrackIndex = index;
      const trackData = TRACKS_CATALOG[index];

      // Instanciar nueva pista y reiniciar autos y marcas
      this.track = new Track(trackData);
      this.initCars();
      this.particles = new ParticlePool(250);
      this.skidmarks = new SkidmarkManager(this.track.bounds);
      this.prevTirePos = null;

      // Actualizar cámara
      this.camera.x = this.car.x;
      this.camera.y = this.car.y;

      // Actualizar HUD y textos de modal
      if (this.circuitNameBadgeEl) {
        this.circuitNameBadgeEl.textContent = trackData.name;
      }
      if (this.startTrackSubtitleEl) {
        this.startTrackSubtitleEl.textContent = `${trackData.name} (${trackData.difficulty}) - ${trackData.subtitle || ''}`;
      }
      if (this.resultsTrackNameEl) {
        this.resultsTrackNameEl.textContent = `Circuito: ${trackData.name}`;
      }

      this.renderTrackCards();
      this.updateHUD();

      if (autoStart) {
        this.startRace();
      }
    }

    openTrackSelector() {
      this.pauseModal.classList.add('hidden');
      if (this.resultsModalEl) this.resultsModalEl.classList.add('hidden');
      this.startModal.classList.remove('hidden');
      this.state = 'READY';
      this.renderTrackCards();
    }

    initEvents() {
      window.addEventListener('resize', () => this.resizeCanvas());

      // Controles de teclado
      window.addEventListener('keydown', (e) => this.handleKeyDown(e));
      window.addEventListener('keyup', (e) => this.handleKeyUp(e));

      // Botón inicio
      this.btnStart.addEventListener('click', () => this.startRace());

      // Pausa y menú
      this.btnPause.addEventListener('click', () => this.togglePause());
      this.btnResume.addEventListener('click', () => this.togglePause());
      this.btnRestart.addEventListener('click', () => this.restartTrack());
      if (this.btnResultsRestart) {
        this.btnResultsRestart.addEventListener('click', () => this.restartTrack());
      }
      if (this.btnChangeTrack) {
        this.btnChangeTrack.addEventListener('click', () => this.openTrackSelector());
      }
      if (this.btnResultsSelect) {
        this.btnResultsSelect.addEventListener('click', () => this.openTrackSelector());
      }
      if (this.btnResultsNext) {
        this.btnResultsNext.addEventListener('click', () => {
          const nextIdx = (this.currentTrackIndex + 1) % TRACKS_CATALOG.length;
          this.selectTrack(nextIdx, true);
        });
      }
      this.btnSound.addEventListener('click', () => this.toggleSound());

      this.btnToggleAutoaccel.addEventListener('click', () => {
        this.autoAcceleration = !this.autoAcceleration;
        this.btnToggleAutoaccel.textContent = `ACELERACIÓN: ${this.autoAcceleration ? 'AUTO (ON)' : 'MANUAL'}`;
      });

      if (this.btnToggleGyro) {
        this.btnToggleGyro.addEventListener('click', () => this.toggleGyroscope());
      }

      // Controles táctiles
      this.initTouchControls();
    }

    checkGyroscopeSupport() {
      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        this.gyroSupported = true;
        this.btnToggleGyro.classList.remove('hidden');
      } else if ('ondeviceorientation' in window) {
        this.gyroSupported = true;
        this.btnToggleGyro.classList.remove('hidden');
      }
    }

    async toggleGyroscope() {
      if (!this.gyroSupported) return;

      if (!this.gyroscopeEnabled) {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          try {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission !== 'granted') return;
          } catch (e) {
            return;
          }
        }
        this.gyroscopeEnabled = true;
        this.btnToggleGyro.textContent = 'GIROSCOPIO: ACTIVADO';
        window.addEventListener('deviceorientation', (e) => this.handleOrientation(e));
      } else {
        this.gyroscopeEnabled = false;
        this.btnToggleGyro.textContent = 'GIROSCOPIO: APAGADO';
      }
    }

    handleOrientation(e) {
      if (!this.gyroscopeEnabled || this.state !== 'RACING') return;
      // Gama de inclinación (gamma: izquierda / derecha)
      const gamma = e.gamma || 0; // -90 a 90
      const steer = Math.max(-1, Math.min(1, gamma / 25));
      this.car.inputSteer = steer;
    }

    initTouchControls() {
      // Zona izquierda (Girar Izquierda)
      const onSteerLeftStart = (e) => {
        e.preventDefault();
        this.touchSteerLeft.classList.add('active');
        this.car.inputSteer = -1;
      };
      const onSteerLeftEnd = (e) => {
        e.preventDefault();
        this.touchSteerLeft.classList.remove('active');
        if (this.car.inputSteer === -1) this.car.inputSteer = 0;
      };
      this.touchSteerLeft.addEventListener('touchstart', onSteerLeftStart, { passive: false });
      this.touchSteerLeft.addEventListener('touchend', onSteerLeftEnd, { passive: false });
      this.touchSteerLeft.addEventListener('mousedown', onSteerLeftStart);
      this.touchSteerLeft.addEventListener('mouseup', onSteerLeftEnd);

      // Zona derecha (Girar Derecha)
      const onSteerRightStart = (e) => {
        e.preventDefault();
        this.touchSteerRight.classList.add('active');
        this.car.inputSteer = 1;
      };
      const onSteerRightEnd = (e) => {
        e.preventDefault();
        this.touchSteerRight.classList.remove('active');
        if (this.car.inputSteer === 1) this.car.inputSteer = 0;
      };
      this.touchSteerRight.addEventListener('touchstart', onSteerRightStart, { passive: false });
      this.touchSteerRight.addEventListener('touchend', onSteerRightEnd, { passive: false });
      this.touchSteerRight.addEventListener('mousedown', onSteerRightStart);
      this.touchSteerRight.addEventListener('mouseup', onSteerRightEnd);

      // Botón Freno / Derrape
      const onBrakeStart = (e) => {
        e.preventDefault();
        this.btnTouchDrift.classList.add('active');
        this.car.inputHandbrake = true;
        this.car.inputBrake = 1;
      };
      const onBrakeEnd = (e) => {
        e.preventDefault();
        this.btnTouchDrift.classList.remove('active');
        this.car.inputHandbrake = false;
        this.car.inputBrake = 0;
      };
      this.btnTouchDrift.addEventListener('touchstart', onBrakeStart, { passive: false });
      this.btnTouchDrift.addEventListener('touchend', onBrakeEnd, { passive: false });
      this.btnTouchDrift.addEventListener('mousedown', onBrakeStart);
      this.btnTouchDrift.addEventListener('mouseup', onBrakeEnd);

      // Botón Nitro
      const onNitroStart = (e) => {
        e.preventDefault();
        this.btnTouchNitro.classList.add('active');
        this.car.inputNitro = true;
      };
      const onNitroEnd = (e) => {
        e.preventDefault();
        this.btnTouchNitro.classList.remove('active');
        this.car.inputNitro = false;
      };
      this.btnTouchNitro.addEventListener('touchstart', onNitroStart, { passive: false });
      this.btnTouchNitro.addEventListener('touchend', onNitroEnd, { passive: false });
      this.btnTouchNitro.addEventListener('mousedown', onNitroStart);
      this.btnTouchNitro.addEventListener('mouseup', onNitroEnd);
    }

    handleKeyDown(e) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (this.state === 'READY' && (e.code === 'Space' || e.code === 'Enter')) {
        this.startRace();
        return;
      }

      switch (e.code) {
        case 'KeyA':
        case 'ArrowLeft':
          this.car.inputSteer = -1;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.car.inputSteer = 1;
          break;
        case 'KeyW':
        case 'ArrowUp':
          this.car.inputThrottle = 1;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.car.inputBrake = 1;
          break;
        case 'Space':
          this.car.inputHandbrake = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.car.inputNitro = true;
          break;
        case 'KeyP':
        case 'Escape':
          this.togglePause();
          break;
      }
    }

    handleKeyUp(e) {
      switch (e.code) {
        case 'KeyA':
        case 'ArrowLeft':
          if (this.car.inputSteer === -1) this.car.inputSteer = 0;
          break;
        case 'KeyD':
        case 'ArrowRight':
          if (this.car.inputSteer === 1) this.car.inputSteer = 0;
          break;
        case 'KeyW':
        case 'ArrowUp':
          this.car.inputThrottle = 0;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.car.inputBrake = 0;
          break;
        case 'Space':
          this.car.inputHandbrake = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.car.inputNitro = false;
          break;
      }
    }

    startRace() {
      this.audio.init();
      this.startModal.classList.add('hidden');
      this.pauseModal.classList.add('hidden');
      if (this.resultsModalEl) this.resultsModalEl.classList.add('hidden');
      this.startCountdown();
    }

    startCountdown() {
      this.state = 'COUNTDOWN';
      this.countdown = 3;
      this.countdownElapsed = 0;
      this.countdownOverlayEl.classList.remove('hidden');
      this.countdownNumberEl.textContent = '3';
      this.countdownNumberEl.style.color = '#ffffff';
      this.countdownNumberEl.style.textShadow = '0 0 30px var(--race-orange), 0 0 60px #ea580c';
      this.audio.playCountdownBeep(false);
      if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(25);
    }

    togglePause() {
      if (this.state === 'READY' || this.state === 'COUNTDOWN' || this.state === 'FINISHED') return;
      if (this.state === 'RACING') {
        this.state = 'PAUSED';
        this.pauseModal.classList.remove('hidden');
      } else if (this.state === 'PAUSED') {
        this.state = 'RACING';
        this.pauseModal.classList.add('hidden');
        this.lastTimestamp = performance.now();
      }
    }

    restartTrack() {
      this.initCars();
      this.camera.x = this.car.x;
      this.camera.y = this.car.y;
      this.raceTime = 0;
      this.skidmarks = new SkidmarkManager(this.track.bounds);
      this.prevTirePos = null;
      this.pauseModal.classList.add('hidden');
      if (this.resultsModalEl) this.resultsModalEl.classList.add('hidden');
      this.startCountdown();
      this.lastTimestamp = performance.now();
    }

    toggleSound() {
      const isMuted = this.audio.toggleMute();
      this.btnSound.querySelector('.icon').textContent = isMuted ? '🔇' : '🔊';
    }

    resizeCanvas() {
      const rect = this.boardWrapper.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      this.canvas.width = Math.round(rect.width * dpr);
      this.canvas.height = Math.round(rect.height * dpr);
      this.canvas.style.width = `${rect.width}px`;
      this.canvas.style.height = `${rect.height}px`;

      this.camera.viewportW = rect.width;
      this.camera.viewportH = rect.height;
    }

    requestFrame() {
      requestAnimationFrame((timestamp) => this.loop(timestamp));
    }

    // ==========================================================================
    // 7. BUCLE PRINCIPAL DE FÍSICAS Y RENDERIZADO (Multi-auto)
    // ==========================================================================
    loop(timestamp) {
      if (!this.lastTimestamp) this.lastTimestamp = timestamp;
      let delta = (timestamp - this.lastTimestamp) / 1000;
      this.lastTimestamp = timestamp;

      // Limitar delta para evitar saltos enormes tras suspensión de pestañas
      if (delta > 0.1) delta = 0.1;

      if (this.state === 'COUNTDOWN') {
        this.countdownElapsed += delta;
        if (this.countdownElapsed >= 1.0) {
          this.countdownElapsed -= 1.0;
          this.countdown--;
          if (this.countdown > 0) {
            this.countdownNumberEl.textContent = String(this.countdown);
            this.countdownNumberEl.style.animation = 'none';
            void this.countdownNumberEl.offsetHeight;
            this.countdownNumberEl.style.animation = '';
            this.audio.playCountdownBeep(false);
            if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(25);
          } else if (this.countdown === 0) {
            this.countdownNumberEl.textContent = '¡YA!';
            this.countdownNumberEl.style.color = '#38bdf8';
            this.countdownNumberEl.style.textShadow = '0 0 30px #06b6d4, 0 0 60px #0284c7';
            this.countdownNumberEl.style.animation = 'none';
            void this.countdownNumberEl.offsetHeight;
            this.countdownNumberEl.style.animation = '';
            this.audio.playCountdownBeep(true);
            if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(45);
            this.state = 'RACING';
            this.raceTime = 0;
            for (const c of this.allCars) {
              c.lapStartTime = 0;
            }
            setTimeout(() => {
              this.countdownOverlayEl.classList.add('hidden');
            }, 650);
          }
        }
      } else if (this.state === 'RACING') {
        this.accumulator += delta;
        let subSteps = 0;

        // Aceleración automática si está activa para el jugador
        if (this.autoAcceleration && this.car.inputBrake === 0) {
          this.car.inputThrottle = 1;
        }

        // Toma de decisiones de los rivales IA en cada cuadro
        for (const ai of this.aiCars) {
          ai.updateAI(delta, this.track, this.car, this.allCars);
        }

        while (this.accumulator >= CONFIG.FIXED_STEP && subSteps < CONFIG.MAX_SUB_STEPS) {
          this.updatePhysics(CONFIG.FIXED_STEP);
          this.accumulator -= CONFIG.FIXED_STEP;
          subSteps++;
        }

        this.raceTime += delta;
        this.updateHUD();
      }

      this.render();
      this.requestFrame();
    }

    updatePhysics(dt) {
      // 1. Actualización de físicas individuales para cada auto
      for (const car of this.allCars) {
        const updateResult = car.update(dt, this.track);

        // Partículas y sonido de impacto con barrera de contención
        if (updateResult && updateResult.barrierCollision) {
          const c = updateResult.barrierCollision;
          if (car === this.car) {
            this.audio.playCrashSound(c.intensity);
            if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(35);
          }
          for (let i = 0; i < 4; i++) {
            this.particles.spawn(
              c.x,
              c.y,
              c.nx * 75 + (Math.random() - 0.5) * 85,
              c.ny * 75 + (Math.random() - 0.5) * 85,
              0.28,
              3,
              Math.random() < 0.5 ? '#f59e0b' : '#f8fafc'
            );
          }
        }

        // Lógica de Vueltas y Puntos de Control Anti-trampas por auto
        const curNextIdx = car.nextCheckpoint;
        const targetCp = this.track.checkpoints[curNextIdx];
        const distToCp = Math.hypot(car.x - targetCp.x, car.y - targetCp.y);

        if (distToCp < targetCp.radius) {
          if (curNextIdx === 0) {
            // Ha completado una vuelta pasando por todos los CPs en orden
            const lapDuration = this.raceTime - car.lapStartTime;
            car.lapTimes.push(lapDuration);

            let isNewBest = false;
            if (!car.bestLapTime || lapDuration < car.bestLapTime) {
              car.bestLapTime = lapDuration;
              isNewBest = true;
              if (car === this.car) {
                saveStoredBestLap(this.track.data.id, lapDuration);
              }
            }

            car.currentLap++;
            car.lapStartTime = this.raceTime;
            car.checkpointsPassed = 0;
            car.nextCheckpoint = 1;

            if (car.currentLap > CONFIG.LAPS) {
              car.finished = true;
              car.finishTime = this.raceTime;
              if (car === this.car && this.state === 'RACING') {
                this.finishRace();
              }
            } else if (car === this.car) {
              this.showLapBanner(car.currentLap, lapDuration, isNewBest);
              this.audio.playLapSound();
              if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(50);
            }
          } else {
            car.checkpointsPassed++;
            car.nextCheckpoint = (car.nextCheckpoint + 1) % this.track.checkpoints.length;
          }
        }
      }

      // 2. Actualización de Power-ups y Obstáculos en pista (Fase 4)
      this.track.updatePowerUps(dt);
      for (const car of this.allCars) {
        this.track.checkPowerUpCollisions(car, this.particles, this.audio);
      }

      // 3. Colisiones elásticas entre vehículos (Empujón simple y rebote)
      resolveCarCollisions(this.allCars, this.car, this.particles, this.audio);

      // 4. Actualización de posiciones en vivo (1° a 4°)
      updateRaceRankings(this.allCars, this.track);

      // 5. Marcas de derrape y partículas para todos los autos
      for (const car of this.allCars) {
        const cosA = Math.cos(car.angle);
        const sinA = Math.sin(car.angle);

        // Posición de los neumáticos traseros
        const rearLeftX = car.x - cosA * (CONFIG.CAR_LENGTH / 2 - 5) - sinA * (CONFIG.CAR_WIDTH / 2 - 2);
        const rearLeftY = car.y - sinA * (CONFIG.CAR_LENGTH / 2 - 5) + cosA * (CONFIG.CAR_WIDTH / 2 - 2);
        const rearRightX = car.x - cosA * (CONFIG.CAR_LENGTH / 2 - 5) + sinA * (CONFIG.CAR_WIDTH / 2 - 2);
        const rearRightY = car.y - sinA * (CONFIG.CAR_LENGTH / 2 - 5) - cosA * (CONFIG.CAR_WIDTH / 2 - 2);

        if (car.isDrifting || (car.isBraking && car.speed > 80)) {
          if (car._prevTirePos) {
            this.skidmarks.addSegment(car._prevTirePos.rlX, car._prevTirePos.rlY, rearLeftX, rearLeftY, 0.4);
            this.skidmarks.addSegment(car._prevTirePos.rrX, car._prevTirePos.rrY, rearRightX, rearRightY, 0.4);
          }
          if (Math.random() < 0.45) {
            this.particles.spawn(rearLeftX, rearLeftY, -car.vx * 0.15 + (Math.random() - 0.5) * 20, -car.vy * 0.15 + (Math.random() - 0.5) * 20, 0.4, 4 + Math.random() * 3, '#cbd5e1');
            this.particles.spawn(rearRightX, rearRightY, -car.vx * 0.15 + (Math.random() - 0.5) * 20, -car.vy * 0.15 + (Math.random() - 0.5) * 20, 0.4, 4 + Math.random() * 3, '#cbd5e1');
            if (car === this.car) {
              this.audio.playDriftScreech();
            }
          }
        }
        car._prevTirePos = { rlX: rearLeftX, rlY: rearLeftY, rrX: rearRightX, rrY: rearRightY };

        // Césped / Offroad
        if (car.isOffroad && Math.abs(car.speed) > 50 && Math.random() < 0.35) {
          this.particles.spawn(car.x, car.y, -car.vx * 0.2 + (Math.random() - 0.5) * 25, -car.vy * 0.2 + (Math.random() - 0.5) * 25, 0.35, 3.5, '#4ade80');
        }
      }

      this.particles.update(dt);

      // Audio del motor del jugador
      this.audio.updateEngine(this.car.speed, this.car.isNitroActive);

      // Seguimiento de cámara suave con anticipación de velocidad
      const pCosA = Math.cos(this.car.angle);
      const pSinA = Math.sin(this.car.angle);
      const lookaheadDist = this.car.speed * CONFIG.CAMERA_LOOKAHEAD;
      const targetCamX = this.car.x + pCosA * lookaheadDist;
      const targetCamY = this.car.y + pSinA * lookaheadDist;

      this.camera.x += (targetCamX - this.camera.x) * CONFIG.CAMERA_LERP;
      this.camera.y += (targetCamY - this.camera.y) * CONFIG.CAMERA_LERP;

      // Zoom dinámico según velocidad
      const speedNorm = Math.min(1.0, Math.abs(this.car.speed) / CONFIG.MAX_SPEED);
      const targetZoom = CONFIG.CAMERA_BASE_ZOOM - speedNorm * (CONFIG.CAMERA_BASE_ZOOM - CONFIG.CAMERA_HIGH_SPEED_ZOOM);
      this.camera.zoom += (targetZoom - this.camera.zoom) * 0.05;
    }

    showLapBanner(lapNumber, lapTime, isNewBest) {
      if (!this.lapBannerEl) return;
      clearTimeout(this.bannerTimeout);
      this.lapBannerTitleEl.textContent = lapNumber === CONFIG.LAPS ? '¡VUELTA FINAL!' : `¡VUELTA ${lapNumber}!`;
      this.lapBannerSubEl.textContent = `${formatTime(lapTime)}${isNewBest ? ' ★ ¡NUEVO RÉCORD!' : ''}`;
      this.lapBannerEl.classList.remove('hidden');
      this.bannerTimeout = setTimeout(() => {
        this.lapBannerEl.classList.add('hidden');
      }, 2200);
    }

    finishRace() {
      this.state = 'FINISHED';
      this.car.inputThrottle = 0;
      this.car.inputNitro = false;
      this.audio.playFinishFanfare();
      if (window.ArcadeCanvas) window.ArcadeCanvas.haptic(80);

      updateRaceRankings(this.allCars, this.track);
      const playerRank = this.car.rank || 1;
      const rankLabels = ['1° LUGAR', '2° LUGAR', '3° LUGAR', '4° LUGAR'];

      if (this.resPosEl) {
        this.resPosEl.textContent = rankLabels[playerRank - 1] || `${playerRank}° LUGAR`;
        this.resPosEl.style.color = (playerRank === 1) ? '#38bdf8' : (playerRank === 2 ? '#a855f7' : (playerRank === 3 ? '#84cc16' : '#f97316'));
      }
      if (this.resTotalTimeEl) this.resTotalTimeEl.textContent = formatTime(this.car.finishTime || this.raceTime);
      if (this.resBestLapEl) this.resBestLapEl.textContent = this.car.bestLapTime ? formatTime(this.car.bestLapTime) : '--:--.-';
      if (this.resultsTrackNameEl) {
        this.resultsTrackNameEl.textContent = `Circuito: ${this.track.data.name}`;
      }

      // Tabla de clasificación general de pilotos
      if (this.resStandingsListEl) {
        this.resStandingsListEl.innerHTML = this.allCars.map((c) => {
          const isPlayer = c === this.car;
          let timeText = '--:--.-';
          if (c.finishTime) {
            timeText = formatTime(c.finishTime);
          } else if (c.finished) {
            timeText = formatTime(this.raceTime);
          } else {
            const lapsBehind = CONFIG.LAPS - c.currentLap + 1;
            timeText = `+${Math.max(1, lapsBehind)} v.`;
          }

          return `
            <div class="standing-row ${isPlayer ? 'is-player' : ''}">
              <span class="standing-rank">${c.rank}°</span>
              <span class="standing-driver">
                <span class="driver-color-pill" style="background:${c.color};"></span>
                <strong>${c.name}</strong>${isPlayer ? ' (Tú)' : ''}
              </span>
              <span class="standing-best">${c.bestLapTime ? formatTime(c.bestLapTime) : '--:--.-'}</span>
              <span class="standing-total">${timeText}</span>
            </div>
          `;
        }).join('');
      }

      if (this.resLapsListEl) {
        this.resLapsListEl.innerHTML = this.car.lapTimes.map((t, idx) => {
          const isBest = t === this.car.bestLapTime;
          return `
            <div class="lap-breakdown-row ${isBest ? 'is-best' : ''}">
              <span>Vuelta ${idx + 1}${isBest ? ' ★' : ''}</span>
              <span>${formatTime(t)}</span>
            </div>
          `;
        }).join('');
      }

      if (this.resultsModalEl) this.resultsModalEl.classList.remove('hidden');
    }

    updateHUD() {
      // Velocímetro
      const speedKmh = Math.round(Math.abs(this.car.speed) * 0.36);
      this.speedValEl.textContent = speedKmh;
      const speedRatio = Math.min(1.0, Math.abs(this.car.speed) / CONFIG.NITRO_MAX_SPEED);
      this.speedBarFillEl.style.width = `${speedRatio * 100}%`;

      // Nitro
      const nitroRatio = this.car.nitroFuel / CONFIG.NITRO_DURATION;
      this.nitroFillEl.style.width = `${nitroRatio * 100}%`;

      // Badge derrape
      if (this.car.isDrifting) {
        this.driftAlertEl.classList.remove('hidden');
      } else {
        this.driftAlertEl.classList.add('hidden');
      }

      // Posición en vivo (1° a 4°)
      if (this.posDisplayEl) {
        const r = this.car.rank || 1;
        this.posDisplayEl.textContent = `${r}°`;
        this.posDisplayEl.style.color = (r === 1) ? '#38bdf8' : (r === 2 ? '#a855f7' : (r === 3 ? '#84cc16' : '#f97316'));
      }

      // Vuelta actual y total (Fase 2)
      const displayLap = Math.min(CONFIG.LAPS, this.car.currentLap);
      this.lapDisplayEl.textContent = `${displayLap}/${CONFIG.LAPS}`;

      // Tiempo de carrera y récord (Fase 2)
      this.timeDisplayEl.textContent = formatTime(this.raceTime);
      if (this.bestDisplayEl) {
        this.bestDisplayEl.textContent = this.car.bestLapTime ? formatTime(this.car.bestLapTime) : '--:--.-';
      }
    }

    render() {
      const dpr = window.devicePixelRatio || 1;
      const ctx = this.ctx;

      ctx.save();
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Configurar matriz de cámara (centrada en viewport)
      ctx.scale(dpr, dpr);
      ctx.translate(this.camera.viewportW / 2, this.camera.viewportH / 2);
      ctx.scale(this.camera.zoom, this.camera.zoom);
      ctx.translate(-this.camera.x, -this.camera.y);

      // 1. Dibujar pista estática pre-renderizada
      this.track.render(ctx);

      // 2. Dibujar power-ups en pista (Fase 4: Turbo y Aceite)
      this.track.renderPowerUps(ctx);

      // 3. Dibujar marcas de derrape
      this.skidmarks.render(ctx);

      // 4. Dibujar partículas (humo, césped, nitro, chispas)
      this.particles.render(ctx);

      // 5. Dibujar rivales IA
      for (const ai of this.aiCars) {
        ai.render(ctx);
      }

      // 6. Dibujar auto del jugador (encima de la IA para visibilidad nítida)
      this.car.render(ctx);

      ctx.restore();
    }
  }

  // ============================================================================
  // 8. INICIALIZACIÓN Y EXPORTACIÓN
  // ============================================================================
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
      window.gameInstance = new DerrapeGame();
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      CONFIG,
      Track,
      Car,
      AICar,
      AI_PROFILES,
      PLAYER_PROFILE,
      TRACKS_CATALOG,
      TRACK_DATA_PISTA_1,
      resolveCarCollisions,
      updateRaceRankings,
      formatTime,
      getStoredBestLap,
      saveStoredBestLap
    };
  }
})();
