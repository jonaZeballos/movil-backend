const { randomUUID } = require('crypto');
const AppError = require('../utils/appError');
const equipoRepository = require('../repositories/equipo.repository');
const ordenRepository = require('../repositories/orden.repository');

function normalizeText(value, fieldName) {
  if (typeof value !== 'string') {
    throw new AppError(`El campo ${fieldName} es obligatorio`, 400);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new AppError(`El campo ${fieldName} es obligatorio`, 400);
  }

  return normalized;
}

function optionalText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function parseOptionalNumber(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new AppError('El campo garantiaDias debe ser un entero positivo', 400);
  }

  return parsed;
}

async function getOrCreateEstado(nombre) {
  const existingEstado = await ordenRepository.findEstadoByName(nombre);
  if (existingEstado) {
    return existingEstado;
  }

  return ordenRepository.createEstado(randomUUID(), nombre);
}

async function getOrCreatePrioridad(prioridad) {
  const existingPrioridad = await ordenRepository.findPrioridadByName(prioridad);
  if (existingPrioridad) {
    return existingPrioridad;
  }

  return ordenRepository.createPrioridad(randomUUID(), prioridad);
}

function mapOrden(orden) {
  const equipo = orden.equipo;

  return {
    id: orden.id,
    codigo: orden.codigo,
    code: `#${String(orden.codigo).padStart(4, '0')}`,
    equipoId: orden.idEquipo,
    tecnicoId: orden.idTecnico,
    clientName: equipo?.cliente?.razonSocial || null,
    equipmentName: equipo
      ? `${equipo.tipoEquipo?.nombre || ''} ${equipo.modelo?.marca?.nombre || ''} ${equipo.modelo?.nombreModelo || ''}`.trim()
      : null,
    equipmentSerial: equipo?.nroSerie || null,
    diagnostico: orden.diagnostico,
    failure: orden.diagnostico,
    estado: orden.estado?.nombre || null,
    status: orden.estado?.nombre || null,
    prioridad: orden.prioridad?.prioridad || null,
    garantiaDias: orden.garantiaDias,
    fechaRecepcion: orden.fechaRecepcion,
    fechaEntrega: orden.fechaEntrega,
    observaciones: orden.observaciones ? orden.observaciones.split('\n').filter(Boolean) : [],
  };
}

async function listOrdenes(query = {}) {
  const search = optionalText(query.buscar ?? query.search);
  const ordenes = await ordenRepository.list(search);

  return ordenes.map(mapOrden);
}

async function getOrden(id) {
  const orden = await ordenRepository.findById(id);
  if (!orden) {
    throw new AppError('Orden de servicio no encontrada', 404);
  }

  return mapOrden(orden);
}

async function createOrden(payload) {
  const equipoId = normalizeText(payload.equipoId ?? payload.idEquipo, 'equipoId');
  const diagnostico = normalizeText(payload.diagnostico ?? payload.failure, 'diagnostico');
  const estadoNombre = optionalText(payload.estado ?? payload.status) || 'Recibido';
  const prioridadNombre = optionalText(payload.prioridad) || 'Normal';
  const garantiaDias = parseOptionalNumber(payload.garantiaDias, 0);
  const observaciones = optionalText(payload.observaciones);

  const equipo = await equipoRepository.findById(equipoId);
  if (!equipo) {
    throw new AppError('Equipo no encontrado', 404);
  }

  const estado = await getOrCreateEstado(estadoNombre);
  const prioridad = await getOrCreatePrioridad(prioridadNombre);
  const lastOrder = await ordenRepository.getLastOrder();

  const orden = await ordenRepository.createOrden({
    id: randomUUID(),
    codigo: (lastOrder?.codigo || 0) + 1,
    fechaRecepcion: new Date(),
    diagnostico,
    garantiaDias,
    observaciones,
    idEquipo: equipo.id,
    idTecnico: optionalText(payload.tecnicoId ?? payload.idTecnico),
    idEstado: estado.id,
    idPrioridad: prioridad.id,
  });

  return mapOrden(orden);
}

async function updateOrden(id, payload) {
  const existingOrden = await ordenRepository.findById(id);
  if (!existingOrden) {
    throw new AppError('Orden de servicio no encontrada', 404);
  }

  const data = {};
  const estadoNombre = optionalText(payload.estado ?? payload.status);
  const diagnostico = optionalText(payload.diagnostico ?? payload.failure);
  const observacion = optionalText(payload.observacion);
  const observaciones = optionalText(payload.observaciones);

  if (estadoNombre) {
    const estado = await getOrCreateEstado(estadoNombre);
    data.idEstado = estado.id;
  }

  if (diagnostico) {
    data.diagnostico = diagnostico;
  }

  if (observaciones) {
    data.observaciones = observaciones;
  }

  if (observacion) {
    data.observaciones = [existingOrden.observaciones, observacion].filter(Boolean).join('\n');
  }

  if (payload.fechaEntrega) {
    const fechaEntrega = new Date(payload.fechaEntrega);
    if (Number.isNaN(fechaEntrega.getTime())) {
      throw new AppError('El campo fechaEntrega no tiene un formato valido', 400);
    }
    data.fechaEntrega = fechaEntrega;
  }

  const updatedOrden = await ordenRepository.updateOrden(id, data);
  return mapOrden(updatedOrden);
}

module.exports = {
  listOrdenes,
  getOrden,
  createOrden,
  updateOrden,
};
