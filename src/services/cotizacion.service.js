const { randomUUID } = require('crypto');
const AppError = require('../utils/appError');
const cotizacionRepository = require('../repositories/cotizacion.repository');
const ordenRepository = require('../repositories/orden.repository');
const notificacionService = require('./notificacion.service');

function normalizeText(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(`El campo ${fieldName} es obligatorio`, 400);
  }

  return value.trim();
}

function optionalText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getAuthBusinessId(auth) {
  return auth?.idNegocio || auth?.negocioId || null;
}

function parseMoney(value, fieldName, defaultValue = 0) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const number = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(number) || number < 0) {
    throw new AppError(`El campo ${fieldName} debe ser un monto mayor o igual a 0`, 400);
  }

  return number;
}

function mapOrdenResumen(orden) {
  const equipo = orden?.equipo;

  return orden
    ? {
        id: orden.id,
        codigo: orden.codigo,
        code: `#${String(orden.codigo).padStart(4, '0')}`,
        clientName: equipo?.cliente?.razonSocial || null,
        equipmentName: equipo
          ? `${equipo.tipoEquipo?.nombre || ''} ${equipo.modelo?.marca?.nombre || ''} ${equipo.modelo?.nombreModelo || ''}`.trim()
          : null,
        diagnostico: orden.diagnostico,
      }
    : null;
}

function mapCotizacion(cotizacion) {
  const numero = `COT-${String(cotizacion.numero).padStart(4, '0')}`;

  return {
    id: cotizacion.id,
    numero,
    numeroInterno: cotizacion.numero,
    ordenId: cotizacion.idOrden,
    order: mapOrdenResumen(cotizacion.orden),
    descripcion: cotizacion.descripcion,
    manoObra: Number(cotizacion.manoObra),
    repuestos: Number(cotizacion.repuestos),
    descuento: Number(cotizacion.descuento),
    total: Number(cotizacion.total),
    observaciones: cotizacion.observaciones,
    estado: cotizacion.estado,
    fechaCreacion: cotizacion.fechaCreacion,
    idNegocio: cotizacion.idNegocio || null,
    whatsappUrl: buildWhatsappUrl(cotizacion),
  };
}

function buildWhatsappUrl(cotizacion) {
  return buildWhatsappUrlWithText(null, buildWhatsappMessage(cotizacion));
}

function buildWhatsappMessage(cotizacion) {
  const numero = `COT-${String(cotizacion.numero).padStart(4, '0')}`;
  const cliente = cotizacion.orden?.equipo?.cliente?.razonSocial || 'cliente';
  const total = Number(cotizacion.total).toFixed(2);

  return `Hola ${cliente}, tu cotizacion ${numero} de ServiTech tiene un total de Bs ${total}.`;
}

function buildWhatsappUrlWithText(phone, text) {
  const normalizedPhone = phone ? String(phone).replace(/\D/g, '') : '';
  const target = normalizedPhone ? `/${normalizedPhone}` : '';

  return `https://wa.me${target}?text=${encodeURIComponent(text)}`;
}

async function listCotizaciones(query = {}, auth) {
  const search = optionalText(query.buscar ?? query.search);
  const cotizaciones = await cotizacionRepository.list(search, getAuthBusinessId(auth));

  return cotizaciones.map(mapCotizacion);
}

async function getCotizacion(id, auth) {
  const cotizacion = await cotizacionRepository.findById(id, getAuthBusinessId(auth));
  if (!cotizacion) {
    throw new AppError('Cotizacion no encontrada', 404);
  }

  return mapCotizacion(cotizacion);
}

async function getWhatsappCotizacion(id, auth) {
  const cotizacion = await cotizacionRepository.findById(id, getAuthBusinessId(auth));
  if (!cotizacion) {
    throw new AppError('Cotizacion no encontrada', 404);
  }

  const telefono = cotizacion.orden?.equipo?.cliente?.usuario?.telefonos?.[0]?.numero;
  const mensaje = buildWhatsappMessage(cotizacion);

  return {
    tipo: 'cotizacion',
    mensaje,
    whatsappUrl: buildWhatsappUrlWithText(telefono, mensaje),
    cotizacion: mapCotizacion(cotizacion),
  };
}

async function createCotizacion(payload, auth) {
  const ordenId = normalizeText(payload.ordenId ?? payload.idOrden, 'ordenId');
  const descripcion = normalizeText(payload.descripcion, 'descripcion');
  const manoObra = parseMoney(payload.manoObra, 'manoObra');
  const repuestos = parseMoney(payload.repuestos, 'repuestos');
  const descuento = parseMoney(payload.descuento, 'descuento', 0);
  const subtotal = manoObra + repuestos;

  if (descuento > subtotal) {
    throw new AppError('El descuento no puede ser mayor al subtotal', 400);
  }

  const idNegocio = getAuthBusinessId(auth);
  const orden = await ordenRepository.findById(ordenId, idNegocio);
  if (!orden) {
    throw new AppError('Orden de servicio no encontrada', 404);
  }

  const lastCotizacion = await cotizacionRepository.getLastCotizacion();
  const cotizacion = await cotizacionRepository.create({
    id: randomUUID(),
    numero: (lastCotizacion?.numero || 0) + 1,
    descripcion,
    manoObra,
    repuestos,
    descuento,
    total: subtotal - descuento,
    observaciones: optionalText(payload.observaciones),
    estado: optionalText(payload.estado) || 'Pendiente',
    fechaCreacion: new Date(),
    idOrden: orden.id,
    idNegocio,
  });

  await notificacionService.notifySystem({
    tipo: 'cotizacion',
    titulo: 'Cotizacion generada',
    mensaje: `Se genero la cotizacion COT-${String(cotizacion.numero).padStart(4, '0')} por Bs ${Number(cotizacion.total).toFixed(2)}.`,
    referenciaId: cotizacion.id,
    referenciaTipo: 'cotizacion',
    idNegocio,
  });

  const estadoCotizado = await ordenRepository.findEstadoByName('Cotizado')
    || await ordenRepository.createEstado(randomUUID(), 'Cotizado');
  await ordenRepository.updateOrden(orden.id, { idEstado: estadoCotizado.id });

  return mapCotizacion(cotizacion);
}

module.exports = {
  listCotizaciones,
  getCotizacion,
  getWhatsappCotizacion,
  createCotizacion,
};
