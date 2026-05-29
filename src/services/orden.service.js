const { randomUUID } = require('crypto');
const AppError = require('../utils/appError');
const equipoRepository = require('../repositories/equipo.repository');
const ordenRepository = require('../repositories/orden.repository');
const notificacionService = require('./notificacion.service');

const COTIZACION_VALIDEZ_DIAS = 1;

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

function getAuthBusinessId(auth) {
  return auth?.idNegocio || auth?.negocioId || null;
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

async function getExistingEstado(nombre) {
  const existingEstado = await ordenRepository.findEstadoByName(nombre);
  if (!existingEstado) {
    throw new AppError('El estado indicado no es valido', 400);
  }

  return existingEstado;
}

async function getOrCreatePrioridad(prioridad) {
  const existingPrioridad = await ordenRepository.findPrioridadByName(prioridad);
  if (existingPrioridad) {
    return existingPrioridad;
  }

  return ordenRepository.createPrioridad(randomUUID(), prioridad);
}

function getCotizacionValidoHasta(cotizacion) {
  const fechaBase = cotizacion?.fechaCreacion ? new Date(cotizacion.fechaCreacion) : new Date();
  fechaBase.setDate(fechaBase.getDate() + COTIZACION_VALIDEZ_DIAS);
  return fechaBase;
}

function isCotizacionActiva(cotizacion) {
  if (!cotizacion?.fechaCreacion) {
    return false;
  }

  return getCotizacionValidoHasta(cotizacion).getTime() >= Date.now();
}

function mapOrden(orden) {
  const equipo = orden.equipo;
  const cotizaciones = Array.isArray(orden.cotizaciones)
    ? orden.cotizaciones.map((cotizacion) => {
        const validoHasta = getCotizacionValidoHasta(cotizacion);
        const activa = isCotizacionActiva(cotizacion);

        return {
          id: cotizacion.id,
          numero: `COT-${String(cotizacion.numero).padStart(4, '0')}`,
          numeroInterno: cotizacion.numero,
          descripcion: cotizacion.descripcion,
          manoObra: Number(cotizacion.manoObra),
          repuestos: Number(cotizacion.repuestos),
          descuento: Number(cotizacion.descuento),
          total: Number(cotizacion.total),
          observaciones: cotizacion.observaciones,
          estado: cotizacion.estado,
          fechaCreacion: cotizacion.fechaCreacion,
          fechaEmision: cotizacion.fechaCreacion,
          validoHasta,
          fechaValidez: validoHasta,
          activa,
          vencida: !activa,
        };
      })
    : [];

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
    observacionesTexto: orden.observaciones || null,
    observaciones: orden.observaciones ? orden.observaciones.split('\n').filter(Boolean) : [],
    cotizaciones,
    cotizacion: cotizaciones[0] || null,
    idNegocio: orden.idNegocio || null,
  };
}

async function listOrdenes(query = {}, auth) {
  const search = optionalText(query.buscar ?? query.search);
  const ordenes = await ordenRepository.list(search, getAuthBusinessId(auth));

  return ordenes.map(mapOrden);
}

async function getOrden(id, auth) {
  const orden = await ordenRepository.findById(id, getAuthBusinessId(auth));
  if (!orden) {
    throw new AppError('Orden de servicio no encontrada', 404);
  }

  return mapOrden(orden);
}

async function createOrden(payload, auth) {
  const equipoId = normalizeText(payload.equipoId ?? payload.idEquipo, 'equipoId');
  const diagnostico = normalizeText(payload.diagnostico ?? payload.failure, 'diagnostico');
  const estadoNombre = optionalText(payload.estado ?? payload.status) || 'Recibido';
  const prioridadNombre = optionalText(payload.prioridad) || 'Normal';
  const garantiaDias = parseOptionalNumber(payload.garantiaDias, 0);
  const observaciones = optionalText(payload.observaciones);

  const idNegocio = getAuthBusinessId(auth);
  const equipo = await equipoRepository.findById(equipoId, idNegocio);
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
    idNegocio,
  });

  return mapOrden(orden);
}

async function updateOrden(id, payload, auth) {
  const existingOrden = await ordenRepository.findById(id, getAuthBusinessId(auth));
  if (!existingOrden) {
    throw new AppError('Orden de servicio no encontrada', 404);
  }

  const data = {};
  const estadoNombre = optionalText(payload.estado ?? payload.status);
  const diagnostico = optionalText(payload.diagnostico ?? payload.failure);
  const observacion = optionalText(payload.observacion);
  const observaciones = optionalText(payload.observaciones);

  if (estadoNombre) {
    const estado = await getExistingEstado(estadoNombre);
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

  if (!Object.keys(data).length) {
    throw new AppError('Debe enviar al menos un campo valido para actualizar', 400);
  }

  const updatedOrden = await ordenRepository.updateOrden(id, data);
  return mapOrden(updatedOrden);
}

async function updateEstadoOrden(id, payload, auth) {
  const estadoNombre = normalizeText(payload.estado ?? payload.status, 'estado');
  const existingOrden = await ordenRepository.findById(id, getAuthBusinessId(auth));
  if (!existingOrden) {
    throw new AppError('Orden de servicio no encontrada', 404);
  }

  const estado = await getExistingEstado(estadoNombre);
  const updatedOrden = await ordenRepository.updateOrden(id, { idEstado: estado.id });

  await notificacionService.notifySystem({
    tipo: 'orden_estado',
    titulo: 'Estado de orden actualizado',
    mensaje: `La orden #${String(updatedOrden.codigo).padStart(4, '0')} cambio a ${estado.nombre}.`,
    referenciaId: updatedOrden.id,
    referenciaTipo: 'orden',
    idNegocio: updatedOrden.idNegocio,
  });

  return mapOrden(updatedOrden);
}

async function updateObservacionesOrden(id, payload, auth) {
  const existingOrden = await ordenRepository.findById(id, getAuthBusinessId(auth));
  if (!existingOrden) {
    throw new AppError('Orden de servicio no encontrada', 404);
  }

  const data = {};

  if (typeof payload.observaciones === 'string') {
    data.observaciones = payload.observaciones.trim() || null;
  }

  if (typeof payload.observacion === 'string' && payload.observacion.trim()) {
    data.observaciones = [existingOrden.observaciones, payload.observacion.trim()].filter(Boolean).join('\n');
  }

  if (!Object.keys(data).length) {
    throw new AppError('Debe enviar observaciones u observacion', 400);
  }

  const updatedOrden = await ordenRepository.updateOrden(id, data);
  return mapOrden(updatedOrden);
}

module.exports = {
  listOrdenes,
  getOrden,
  createOrden,
  updateOrden,
  updateEstadoOrden,
  updateObservacionesOrden,
};
