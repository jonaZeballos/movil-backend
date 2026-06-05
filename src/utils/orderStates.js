const ORDER_STATES = [
  {
    value: 'recibido',
    label: 'Recibido',
    aliases: ['recibido', 'Recibido'],
  },
  {
    value: 'en_diagnostico',
    label: 'En diagnostico',
    aliases: ['en_diagnostico', 'En diagnostico', 'En diagnostico', 'En diagnóstico'],
  },
  {
    value: 'cotizado',
    label: 'Cotizado',
    aliases: ['cotizado', 'Cotizado'],
  },
  {
    value: 'en_reparacion',
    label: 'En reparacion',
    aliases: ['en_reparacion', 'En reparacion', 'En reparación'],
  },
  {
    value: 'listo',
    label: 'Listo',
    aliases: ['listo', 'Listo'],
  },
  {
    value: 'entregado',
    label: 'Entregado',
    aliases: ['entregado', 'Entregado'],
  },
  {
    value: 'sin_solucion',
    label: 'Sin solucion',
    aliases: ['sin_solucion', 'Sin solucion', 'Sin solución'],
  },
  {
    value: 'cancelado',
    label: 'Cancelado',
    aliases: ['cancelado', 'Cancelado', 'anulado', 'Anulado'],
  },
];

const ORDER_STATE_VALUES = new Set(ORDER_STATES.map((state) => state.value));

function stripAccents(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizeStateKey(value) {
  return stripAccents(value)
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '_');
}

function normalizeOrderState(value) {
  const key = normalizeStateKey(value);
  const state = ORDER_STATES.find((item) => (
    item.value === key
    || item.aliases.some((alias) => normalizeStateKey(alias) === key)
  ));

  return state || null;
}

module.exports = {
  ORDER_STATES,
  ORDER_STATE_VALUES,
  normalizeOrderState,
};
