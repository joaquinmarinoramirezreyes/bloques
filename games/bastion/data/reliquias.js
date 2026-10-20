/**
 * games/bastion/data/reliquias.js - Sistema de Reliquias y Artefactos Arcanos para Bastión (Fase 3)
 * Modificadores pasivos que el jugador puede seleccionar al inicio o durante hitos de oleada.
 */
(() => {
  'use strict';

  const RELIQUIAS = {
    lente_cuantica: {
      id: 'lente_cuantica',
      name: 'Lente Cuántica',
      icon: 'eye',
      rarity: 'Raro',
      desc: '+15% de alcance de disparo para todas las torres construidas.',
      effects: { globalRangeMult: 1.15 }
    },
    fision_acelerada: {
      id: 'fision_acelerada',
      name: 'Fisión Acelerada',
      icon: 'zap',
      rarity: 'Raro',
      desc: '+20% de cadencia de ataque para torres balísticas y francotiradoras.',
      effects: { rapidFireRateMult: 1.20 }
    },
    polvora_inestable: {
      id: 'polvora_inestable',
      name: 'Pólvora Inestable',
      icon: 'bomb',
      rarity: 'Poco común',
      desc: '+30% de radio de explosión para impactos de cañón mortero.',
      effects: { mortarSplashMult: 1.30 }
    },
    cero_absoluto: {
      id: 'cero_absoluto',
      name: 'Cero Absoluto',
      icon: 'ice',
      rarity: 'Raro',
      desc: 'Los emisores criogénicos congelan un +20% más y retienen la escarcha por más tiempo.',
      effects: { cryoPowerBuff: 0.20 }
    },
    transmutador_aurico: {
      id: 'transmutador_aurico',
      name: 'Botín de Asedio',
      icon: 'coin',
      rarity: 'Común',
      desc: 'Otorga 2 monedas de oro adicionales por cada invasor abatido.',
      effects: { bonusGoldPerKill: 2 }
    },
    escudo_singularidad: {
      id: 'escudo_singularidad',
      name: 'Escudo de Singularidad',
      icon: 'shield',
      rarity: 'Épico',
      desc: 'El campo de fuerza del núcleo anula los primeros 3 impactos de invasores sin perder vidas.',
      effects: { coreShieldCharges: 3 }
    },
    bobina_tesla_nucleo: {
      id: 'bobina_tesla_nucleo',
      name: 'Bobina de Tesla Nexo',
      icon: 'zap',
      rarity: 'Épico',
      desc: 'Cada 9 segundos emite una descarga que pulveriza 180 HP del invasor más próximo al núcleo.',
      effects: { teslaInterval: 9.0, teslaDamage: 180 }
    },
    aleacion_antimateria: {
      id: 'aleacion_antimateria',
      name: 'Aleación Antimateria',
      icon: 'gem',
      rarity: 'Raro',
      desc: 'Las torres infligen +30% de daño amplificado contra objetivos blindados.',
      effects: { antiArmorBonus: 0.30 }
    },
    banco_interes: {
      id: 'banco_interes',
      name: 'Reserva de Interés',
      icon: 'chart',
      rarity: 'Poco común',
      desc: 'Al terminar cada oleada, genera un 10% de interés de tu oro en reserva (máximo 60 oro por oleada).',
      effects: { interestRate: 0.10, maxInterest: 60 }
    },
    sobrecarga_obelisco: {
      id: 'sobrecarga_obelisco',
      name: 'Resonancia Primordial',
      icon: 'tower',
      rarity: 'Raro',
      desc: 'Los Obeliscos aumentan su radio de influencia a 2 celdas adyacentes adicionales.',
      effects: { obeliskRangeBonus: 1.5 }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RELIQUIAS };
  } else {
    window.BASTION_RELIQUIAS = RELIQUIAS;
  }
})();
