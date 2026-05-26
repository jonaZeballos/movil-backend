const { randomUUID } = require('crypto');
const AppError = require('../utils/appError');
const cotizacionRepository = require('../repositories/cotizacion.repository');
const ordenRepository = require('../repositories/orden.repository');

function normalizeText(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(`El campo ${fieldName} es obligatorio`, 400);
  }

  return value.trim();
}

function optionalText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
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
    whatsappUrl: buildWhatsappUrl(cotizacion),
  };
}

function buildWhatsappUrl(cotizacion) {
  const numero = `COT-${String(cotizacion.numero).padStart(4, '0')}`;
  const cliente = cotizacion.orden?.equipo?.cliente?.razonSocial || 'cliente';
  const total = Number(cotizacion.total).toFixed(2);
  const text = `Hola ${cliente}, tu cotizacion ${numero} de ServiTech tiene un total de Bs ${total}.`;

  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

async function listCotizaciones(query = {}) {
  const search = optionalText(query.buscar ?? query.search);
  const cotizaciones = await cotizacionRepository.list(search);

  return cotizaciones.map(mapCotizacion);
}

async function getCotizacion(id) {
  const cotizacion = await cotizacionRepository.findById(id);
  if (!cotizacion) {
    throw new AppError('Cotizacion no encontrada', 404);
  }

  return mapCotizacion(cotizacion);
}

async function createCotizacion(payload) {
  const ordenId = normalizeText(payload.ordenId ?? payload.idOrden, 'ordenId');
  const descripcion = normalizeText(payload.descripcion, 'descripcion');
  const manoObra = parseMoney(payload.manoObra, 'manoObra');
  const repuestos = parseMoney(payload.repuestos, 'repuestos');
  const descuento = parseMoney(payload.descuento, 'descuento', 0);
  const subtotal = manoObra + repuestos;

  if (descuento > subtotal) {
    throw new AppError('El descuento no puede ser mayor al subtotal', 400);
  }

  const orden = await ordenRepository.findById(ordenId);
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
  });

  return mapCotizacion(cotizacion);
}

module.exports = {
  listCotizaciones,
  getCotizacion,
  createCotizacion,
};
