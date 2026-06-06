const { randomUUID } = require('crypto');
const AppError = require('../utils/appError');
const cotizacionRepository = require('../repositories/cotizacion.repository');
const ordenRepository = require('../repositories/orden.repository');
const productoRepository = require('../repositories/producto.repository');
const notificacionService = require('./notificacion.service');

const COTIZACION_VALIDEZ_DIAS = 1;
const DATE_FORMATTER_BO = new Intl.DateTimeFormat('es-BO', {
  timeZone: 'America/La_Paz',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function normalizeText(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(`El campo ${fieldName} es obligatorio`, 400);
  }

  return value.trim();
}

function optionalText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isInternalServitechEmail(email) {
  return /@servitech\.local$/i.test(String(email || '').trim());
}

function getRealClientEmail(cliente) {
  const email = optionalText(cliente?.email ?? cliente?.correo ?? cliente?.emailReal);
  if (email && !isInternalServitechEmail(email)) {
    return email;
  }

  return null;
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


const PAYMENT_METHOD_LABELS = {
  efectivo: 'Efectivo',
  qr: 'QR',
};

function normalizePaymentMethod(value, fieldName = 'metodoPago') {
  const rawValue = typeof value === 'object' && value !== null
    ? value.id || value.label || value.name || value.nombre
    : value;
  const text = optionalText(rawValue);

  if (!text) return null;

  const key = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (!PAYMENT_METHOD_LABELS[key]) {
    throw new AppError(`El campo ${fieldName} debe ser efectivo o QR`, 400);
  }

  return PAYMENT_METHOD_LABELS[key];
}

function getPaymentState(total, anticipo, pagoFinal = 0) {
  const paid = Number(anticipo || 0) + Number(pagoFinal || 0);
  if (paid <= 0) return 'Sin pago';
  if (paid >= Number(total || 0)) return 'Pagado';
  return 'Anticipo parcial';
}

function parsePositiveInteger(value, fieldName) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new AppError(`El campo ${fieldName} debe ser un entero mayor a 0`, 400);
  }

  return number;
}

function normalizeQuotationPartOrigin(value) {
  const origin = optionalText(value) || 'externo';
  const normalized = origin
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  return normalized === 'inventario' ? 'inventario' : 'externo';
}

function mapRepuestoCotizacion(item) {
  return {
    id: item.id,
    origen: item.origen || 'externo',
    productoId: item.idProducto || null,
    idProducto: item.idProducto || null,
    nombre: item.nombre,
    cantidad: Number(item.cantidad || 0),
    precioUnitario: Number(item.precioUnitario || 0),
    subtotal: Number(item.subtotal || 0),
    producto: item.producto
      ? {
          id: item.producto.id,
          nombre: item.producto.nombre,
          marca: item.producto.marca || null,
          modelo: item.producto.modelo || null,
          stock: item.producto.stock,
          tipoInventario: item.producto.tipoInventario,
        }
      : null,
  };
}

async function normalizeQuotationParts(parts = [], idNegocio, auth) {
  if (!Array.isArray(parts) || parts.length === 0) return [];

  const normalizedParts = [];
  for (const [index, item] of parts.entries()) {
    const origen = normalizeQuotationPartOrigin(item.origen || item.tipo || item.source);
    const cantidad = parsePositiveInteger(item.cantidad ?? item.quantity, `repuestos[${index}].cantidad`);
    let nombre = optionalText(item.nombre || item.name);
    let precioUnitario = parseMoney(item.precioUnitario ?? item.unitPrice ?? item.precio, `repuestos[${index}].precioUnitario`);
    let idProducto = optionalText(item.productoId || item.idProducto);

    if (origen === 'inventario') {
      if (!idProducto) {
        throw new AppError('Seleccione un producto del inventario tecnico', 400);
      }

      const producto = await productoRepository.findById(idProducto, idNegocio);
      if (!producto || producto.tipoInventario !== 'tecnico') {
        throw new AppError('El repuesto seleccionado no pertenece al inventario tecnico', 400);
      }

      if (producto.idTecnico && auth?.rol === 'tecnico' && producto.idTecnico !== auth.id) {
        throw new AppError('No tienes acceso a este repuesto tecnico', 403);
      }

      nombre = producto.nombre;
      precioUnitario = Number(producto.precio || 0);
    } else {
      idProducto = null;
      nombre = normalizeText(nombre, `repuestos[${index}].nombre`);
    }

    const subtotal = cantidad * precioUnitario;
    normalizedParts.push({
      id: randomUUID(),
      origen,
      nombre,
      cantidad,
      precioUnitario,
      subtotal,
      idProducto,
    });
  }

  return normalizedParts;
}
function normalizeWhatsappPhone(phone) {
  const digits = phone ? String(phone).replace(/\D/g, '') : '';

  if (!digits) {
    return '';
  }

  if (digits.length === 8) {
    return `591${digits}`;
  }

  if (digits.length === 9 && digits.startsWith('0')) {
    return `591${digits.slice(1)}`;
  }

  return digits;
}

function getValidoHasta(cotizacion) {
  const fechaBase = cotizacion?.fechaCreacion ? new Date(cotizacion.fechaCreacion) : new Date();
  fechaBase.setDate(fechaBase.getDate() + COTIZACION_VALIDEZ_DIAS);
  return fechaBase;
}

function formatDateBO(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }

  return DATE_FORMATTER_BO.format(date);
}

function getUserDisplayName(user = {}) {
  const fullName = [user.nombres, user.apellidos].filter(Boolean).join(' ').trim();

  return fullName
    || user.nombre
    || user.name
    || user.username
    || user.email
    || 'Usuario no disponible';
}

function getAuthUser(auth = {}) {
  return {
    nombres: auth.nombres,
    apellidos: auth.apellidos,
    nombre: auth.nombre,
    username: auth.username,
    email: auth.email,
  };
}

function isCotizacionActiva(cotizacion) {
  if (!cotizacion?.fechaCreacion) {
    return false;
  }

  return getValidoHasta(cotizacion).getTime() >= Date.now();
}

function mapOrdenResumen(orden) {
  const equipo = orden?.equipo;
  const cliente = equipo?.cliente;
  const telefono = cliente?.usuario?.telefonos?.[0]?.numero;
  const email = getRealClientEmail(cliente);

  return orden
    ? {
        id: orden.id,
        codigo: orden.codigo,
        code: `#${String(orden.codigo).padStart(4, '0')}`,
        clientName: equipo?.cliente?.razonSocial || null,
        cliente: cliente
          ? {
              id: cliente.idUsuario,
              razonSocial: cliente.razonSocial,
              nombre: cliente.razonSocial,
              telefono: telefono ? telefono.toString() : null,
              email: email || null,
            }
          : null,
        equipo: equipo
          ? {
              id: equipo.id,
              nombre: `${equipo.tipoEquipo?.nombre || ''} ${equipo.modelo?.marca?.nombre || ''} ${equipo.modelo?.nombreModelo || ''}`.trim(),
              nroSerie: equipo.nroSerie,
            }
          : null,
        negocio: orden.negocio
          ? {
              id: orden.negocio.id,
              nombre: orden.negocio.nombre,
            }
          : null,
        equipmentName: equipo
          ? `${equipo.tipoEquipo?.nombre || ''} ${equipo.modelo?.marca?.nombre || ''} ${equipo.modelo?.nombreModelo || ''}`.trim()
          : null,
        diagnostico: orden.diagnostico,
      }
    : null;
}

function getCotizacionOrdenes(cotizacion) {
  const linkedOrders = Array.isArray(cotizacion.ordenLinks)
    ? cotizacion.ordenLinks.map((link) => link.orden).filter(Boolean)
    : [];
  const orders = linkedOrders.length ? linkedOrders : [cotizacion.orden].filter(Boolean);
  const seen = new Set();

  return orders.filter((orden) => {
    if (!orden?.id || seen.has(orden.id)) return false;
    seen.add(orden.id);
    return true;
  });
}

function mapCotizacion(cotizacion) {
  const numero = `COT-${String(cotizacion.numero).padStart(4, '0')}`;
  const cliente = cotizacion.orden?.equipo?.cliente;
  const telefono = cliente?.usuario?.telefonos?.[0]?.numero;
  const email = getRealClientEmail(cliente);
  const validoHasta = getValidoHasta(cotizacion);
  const activa = isCotizacionActiva(cotizacion);
  const ordenes = getCotizacionOrdenes(cotizacion).map(mapOrdenResumen).filter(Boolean);

  return {
    id: cotizacion.id,
    numero,
    numeroInterno: cotizacion.numero,
    ordenId: cotizacion.idOrden,
    order: mapOrdenResumen(cotizacion.orden),
    ordenes,
    orders: ordenes,
    equipos: ordenes.map((orden) => orden.equipo).filter(Boolean),
    esAgrupada: ordenes.length > 1,
    cantidadOrdenes: ordenes.length || 1,
    cliente: cliente
      ? {
          id: cliente.idUsuario,
          razonSocial: cliente.razonSocial,
          nombre: cliente.razonSocial,
          telefono: telefono ? telefono.toString() : null,
          email: email || null,
        }
      : null,
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
    realizadoPor: null,
    idNegocio: cotizacion.idNegocio || null,
    repuestosDetalle: Array.isArray(cotizacion.repuestosDetalle) ? cotizacion.repuestosDetalle.map(mapRepuestoCotizacion) : [],
    negocio: cotizacion.orden?.negocio
      ? {
          id: cotizacion.orden.negocio.id,
          nombre: cotizacion.orden.negocio.nombre,
        }
      : null,
    whatsappUrl: buildWhatsappUrl(cotizacion),
  };
}

function buildWhatsappUrl(cotizacion) {
  const telefono = cotizacion.orden?.equipo?.cliente?.usuario?.telefonos?.[0]?.numero;
  return buildWhatsappUrlWithText(telefono, buildWhatsappMessage(cotizacion));
}

function buildWhatsappMessage(cotizacion, creator) {
  const numero = `COT-${String(cotizacion.numero).padStart(4, '0')}`;
  const clienteData = cotizacion.orden?.equipo?.cliente;
  const cliente = clienteData?.razonSocial || 'cliente';
  const telefono = clienteData?.usuario?.telefonos?.[0]?.numero;
  const negocio = cotizacion.orden?.negocio?.nombre || 'ServiTech';
  const total = Number(cotizacion.total).toFixed(2);
  const subtotal = Number(cotizacion.manoObra) + Number(cotizacion.repuestos);
  const emitida = cotizacion.fechaCreacion ? new Date(cotizacion.fechaCreacion) : new Date();
  const validaHasta = getValidoHasta(cotizacion);
  const creatorName = getUserDisplayName(creator);
  const equipo = cotizacion.orden?.equipo;
  const ordenes = getCotizacionOrdenes(cotizacion);
  const equipoTexto = equipo
    ? `${equipo.tipoEquipo?.nombre || 'Equipo'} ${equipo.modelo?.marca?.nombre || ''} ${equipo.modelo?.nombreModelo || ''}`.trim()
    : 'Equipo no especificado';
  const repuestosTexto = Array.isArray(cotizacion.repuestosDetalle)
    ? cotizacion.repuestosDetalle.map((item) => '- ' + item.cantidad + ' x ' + item.nombre + ' (' + (item.origen || 'externo') + ') - Bs ' + Number(item.subtotal).toFixed(2))
    : [];
  const ordenesTexto = ordenes.map((orden) => {
    const resumen = mapOrdenResumen(orden);
    return `- ${resumen.code} - ${resumen.equipo?.nombre || 'Equipo no especificado'} - ${resumen.diagnostico || 'Sin diagnostico'}`;
  });

  return [
    `*${negocio} - Cotizacion ${numero}*`,
    `Fecha de emision: ${formatDateBO(emitida)}`,
    `Fecha de validez: ${formatDateBO(validaHasta)}`,
    '',
    `Cliente: ${cliente}`,
    `Telefono: ${normalizeWhatsappPhone(telefono) || 'No registrado'}`,
    `Cotizacion realizada por: ${creatorName}`,
    ordenes.length > 1 ? 'Ordenes incluidas:' : `Orden: #${String(cotizacion.orden?.codigo || '').padStart(4, '0')}`,
    ...(ordenes.length > 1 ? ordenesTexto : [
      `Equipo: ${equipoTexto}`,
      `Diagnostico: ${cotizacion.orden?.diagnostico || 'No registrado'}`,
    ]),
    '',
    `Descripcion: ${cotizacion.descripcion}`,
    `Mano de obra: Bs ${Number(cotizacion.manoObra).toFixed(2)}`,
    `Repuestos/productos: Bs ${Number(cotizacion.repuestos).toFixed(2)}`,
    `Subtotal: Bs ${subtotal.toFixed(2)}`,
    `Descuento: Bs ${Number(cotizacion.descuento).toFixed(2)}`,
    `Total: Bs ${total}`,
    cotizacion.observaciones ? `Observaciones: ${cotizacion.observaciones}` : null,
    '',
    `Cotizacion valida hasta ${formatDateBO(validaHasta)}.`,
  ].filter(Boolean).join('\n');
}

function buildWhatsappUrlWithText(phone, text) {
  const normalizedPhone = normalizeWhatsappPhone(phone);
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
  const mensaje = buildWhatsappMessage(cotizacion, getAuthUser(auth));

  return {
    tipo: 'cotizacion',
    mensaje,
    whatsappUrl: buildWhatsappUrlWithText(telefono, mensaje),
    cotizacion: mapCotizacion(cotizacion),
  };
}

async function createCotizacion(payload, auth) {
  const ordenIds = normalizeOrderIds(payload);
  const ordenId = ordenIds[0];
  const descripcion = normalizeText(payload.descripcion, 'descripcion');
  const manoObra = parseMoney(payload.manoObra, 'manoObra');
  const idNegocio = getAuthBusinessId(auth);
  const repuestosDetalle = await normalizeQuotationParts(payload.repuestosDetalle || payload.repuestosItems || payload.materiales || [], idNegocio, auth);
  const repuestosCalculados = repuestosDetalle.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
  const repuestos = repuestosDetalle.length ? repuestosCalculados : parseMoney(payload.repuestos, 'repuestos');
  const descuento = parseMoney(payload.descuento, 'descuento', 0);
  const subtotal = manoObra + repuestos;
  const total = subtotal - descuento;
  const anticipo = parseMoney(payload.anticipo, 'anticipo', 0);
  const metodoPagoAnticipo = normalizePaymentMethod(payload.metodoPagoAnticipo, 'metodoPagoAnticipo');

  if (anticipo > total) {
    throw new AppError('El anticipo no puede ser mayor al total', 400);
  }

  if (anticipo > 0 && !metodoPagoAnticipo) {
    throw new AppError('Seleccione el metodo de pago del anticipo', 400);
  }

  if (descuento > subtotal) {
    throw new AppError('El descuento no puede ser mayor al subtotal', 400);
  }

  const ordenes = [];
  for (const currentOrdenId of ordenIds) {
    const orden = await ordenRepository.findById(currentOrdenId, idNegocio);
    if (!orden) {
      throw new AppError('Orden de servicio no encontrada', 404);
    }
    ordenes.push(orden);
  }

  validateSameClient(ordenes);

  const activeCotizaciones = [];
  for (const orden of ordenes) {
    const existingCotizacion = await cotizacionRepository.findByOrderId(orden.id, idNegocio);
    if (existingCotizacion && isCotizacionActiva(existingCotizacion)) {
      activeCotizaciones.push(existingCotizacion);
    }
  }

  if (activeCotizaciones.length && ordenes.length === 1) {
    const existingCotizacion = activeCotizaciones[0];
    return {
      ...mapCotizacion(existingCotizacion),
      yaExistia: true,
      cotizacionActiva: true,
      mensaje: 'Esta orden ya tiene una cotizacion activa',
    };
  }

  if (activeCotizaciones.length) {
    throw new AppError('Una o mas ordenes seleccionadas ya tienen una cotizacion activa', 400);
  }

  const lastCotizacion = await cotizacionRepository.getLastCotizacion();
  const cotizacion = await cotizacionRepository.create({
    id: randomUUID(),
    numero: (lastCotizacion?.numero || 0) + 1,
    descripcion,
    manoObra,
    repuestos,
    descuento,
    total,
    anticipo,
    pagoFinal: 0,
    saldoPendiente: Math.max(total - anticipo, 0),
    metodoPagoAnticipo,
    metodoPagoSaldo: null,
    estadoPago: getPaymentState(total, anticipo, 0),
    fechaAnticipo: anticipo > 0 ? new Date() : null,
    fechaPagoFinal: anticipo >= total && total > 0 ? new Date() : null,
    observaciones: optionalText(payload.observaciones),
    estado: optionalText(payload.estado) || 'Pendiente',
    fechaCreacion: new Date(),
    idOrden: ordenId,
    idNegocio,
  }, ordenIds, repuestosDetalle);

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
  for (const orden of ordenes) {
    await ordenRepository.updateOrden(orden.id, { idEstado: estadoCotizado.id });
  }

  return mapCotizacion(cotizacion);
}

function normalizeOrderIds(payload) {
  const rawIds = Array.isArray(payload.ordenIds)
    ? payload.ordenIds
    : [payload.ordenId ?? payload.idOrden].filter(Boolean);

  const ordenIds = Array.from(new Set(rawIds.map((id) => String(id || '').trim()).filter(Boolean)));
  if (!ordenIds.length) {
    throw new AppError('Debe seleccionar al menos una orden', 400);
  }

  return ordenIds;
}

function validateSameClient(ordenes) {
  const clienteIds = new Set(ordenes.map((orden) => orden.equipo?.cliente?.idUsuario).filter(Boolean));
  if (clienteIds.size !== 1) {
    throw new AppError('Solo se pueden agrupar ordenes del mismo cliente', 400);
  }
}


async function completarPagoCotizacion(id, payload = {}, auth) {
  const cotizacion = await cotizacionRepository.findById(id, getAuthBusinessId(auth));
  if (!cotizacion) {
    throw new AppError('Cotizacion no encontrada', 404);
  }

  const saldoActual = Number(cotizacion.saldoPendiente ?? Math.max(Number(cotizacion.total) - Number(cotizacion.anticipo || 0) - Number(cotizacion.pagoFinal || 0), 0));
  if (saldoActual <= 0) {
    return mapCotizacion(cotizacion);
  }

  const monto = parseMoney(payload.monto ?? payload.pagoFinal ?? saldoActual, 'monto', saldoActual);
  if (monto <= 0) {
    throw new AppError('El monto de pago debe ser mayor a 0', 400);
  }

  if (monto > saldoActual) {
    throw new AppError('El pago no puede ser mayor al saldo pendiente', 400);
  }

  const metodoPagoSaldo = normalizePaymentMethod(payload.metodoPago || payload.metodoPagoSaldo, 'metodoPagoSaldo');
  if (!metodoPagoSaldo) {
    throw new AppError('Seleccione el metodo de pago del saldo', 400);
  }

  const pagoFinal = Number(cotizacion.pagoFinal || 0) + monto;
  const saldoPendiente = Math.max(saldoActual - monto, 0);
  const updatedCotizacion = await cotizacionRepository.update(id, {
    pagoFinal,
    saldoPendiente,
    metodoPagoSaldo,
    estadoPago: getPaymentState(cotizacion.total, cotizacion.anticipo, pagoFinal),
    fechaPagoFinal: saldoPendiente <= 0 ? new Date() : cotizacion.fechaPagoFinal,
  });

  await notificacionService.notifySystem({
    tipo: 'cotizacion',
    titulo: 'Pago de cotizacion registrado',
    mensaje: `Se registro un pago de Bs ${monto.toFixed(2)} para la cotizacion COT-${String(updatedCotizacion.numero).padStart(4, '0')}.`,
    referenciaId: updatedCotizacion.id,
    referenciaTipo: 'cotizacion',
    idNegocio: updatedCotizacion.idNegocio,
  });

  return mapCotizacion(updatedCotizacion);
}
module.exports = {
  listCotizaciones,
  getCotizacion,
  getWhatsappCotizacion,
  createCotizacion,
};

