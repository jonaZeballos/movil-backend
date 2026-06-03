const { randomUUID } = require('crypto');
const AppError = require('../utils/appError');
const clienteRepository = require('../repositories/cliente.repository');
const productoRepository = require('../repositories/producto.repository');
const ventaRepository = require('../repositories/venta.repository');
const notificacionService = require('./notificacion.service');

function optionalText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getAuthBusinessId(auth) {
  return auth?.idNegocio || auth?.negocioId || null;
}

function parseQuantity(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new AppError('La cantidad debe ser un entero mayor a 0', 400);
  }

  return number;
}

function parseDiscount(value, subtotal) {
  if (value === undefined || value === null || value === '') {
    return 0;
  }

  const number = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(number) || number < 0) {
    throw new AppError('El descuento debe ser un monto mayor o igual a 0', 400);
  }

  if (number > subtotal) {
    throw new AppError('El descuento no puede ser mayor al subtotal', 400);
  }

  return number;
}

const PAYMENT_METHOD_LABELS = {
  efectivo: 'Efectivo',
  qr: 'QR',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
};

function normalizePaymentMethod(value) {
  const rawValue = typeof value === 'object' && value !== null
    ? value.id || value.label || value.name || value.nombre
    : value;
  const text = optionalText(rawValue);

  if (!text) {
    throw new AppError('Seleccione un método de pago.', 400);
  }

  const key = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  return PAYMENT_METHOD_LABELS[key] || text;
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

function mapVenta(venta) {
  const reciboCodigo = venta.reciboCodigo;
  const clienteTelefono = venta.cliente?.usuario?.telefonos?.[0]?.numero;
  const clienteEmail = getRealClientEmail(venta.cliente);
  const subtotal = venta.detalles.reduce((sum, detalle) => sum + Number(detalle.subtotal), 0);
  const total = Number(venta.total);
  const descuento = Math.max(subtotal - total, 0);

  return {
    id: venta.id,
    numero: venta.numero,
    codigo: reciboCodigo,
    reciboCodigo,
    clienteId: venta.idCliente,
    clienteNombre: venta.cliente?.razonSocial || venta.clienteNombre,
    cliente: venta.cliente
      ? {
          id: venta.cliente.idUsuario,
          razonSocial: venta.cliente.razonSocial,
          numeroDocumento: venta.cliente.numeroDocumento.toString(),
          email: clienteEmail,
          correo: clienteEmail,
          telefono: clienteTelefono ? clienteTelefono.toString() : null,
        }
      : null,
    subtotal,
    descuento,
    total,
    metodoPago: venta.metodoPago || null,
    fechaCreacion: venta.fechaCreacion,
    negocio: venta.negocio
      ? {
          id: venta.negocio.id,
          nombre: venta.negocio.nombre,
        }
      : null,
    realizadoPor: null,
    detalles: venta.detalles.map((detalle) => ({
      id: detalle.id,
      productoId: detalle.idProducto,
      nombre: detalle.producto?.nombre || null,
      cantidad: detalle.cantidad,
      precioUnitario: Number(detalle.precioUnitario),
      subtotal: Number(detalle.subtotal),
    })),
  };
}

function mapReciboVenta(venta) {
  const ventaMap = mapVenta(venta);
  const lineas = ventaMap.detalles.map((detalle) => ({
    producto: detalle.nombre,
    cantidad: detalle.cantidad,
    precioUnitario: detalle.precioUnitario,
    subtotal: detalle.subtotal,
  }));
  const texto = [
    `Recibo ${ventaMap.reciboCodigo} - ServiTech`,
    `Cliente: ${ventaMap.clienteNombre || 'Consumidor final'}`,
    ...lineas.map((linea) => `${linea.cantidad} x ${linea.producto} - Bs ${linea.subtotal.toFixed(2)}`),
    `Total: Bs ${ventaMap.total.toFixed(2)}`,
    `Metodo de pago: ${ventaMap.metodoPago || 'No registrado'}`,
  ].join('\n');

  return {
    codigo: ventaMap.reciboCodigo,
    fecha: ventaMap.fechaCreacion,
    negocio: {
      nombre: venta.negocio?.nombre || 'ServiTech',
      descripcion: 'Servicio tecnico de computadoras y venta de equipos, repuestos y accesorios',
    },
    cliente: ventaMap.cliente || {
      id: null,
      razonSocial: ventaMap.clienteNombre || 'Consumidor final',
      numeroDocumento: null,
      email: null,
      telefono: null,
    },
    items: lineas,
    subtotal: ventaMap.subtotal,
    descuento: ventaMap.descuento,
    total: ventaMap.total,
    metodoPago: ventaMap.metodoPago,
    texto,
    venta: ventaMap,
    realizadoPor: null,
  };
}

function buildWhatsappUrl(phone, text) {
  const normalizedPhone = phone ? String(phone).replace(/\D/g, '') : '';
  const target = normalizedPhone ? `/${normalizedPhone}` : '';

  return `https://wa.me${target}?text=${encodeURIComponent(text)}`;
}

async function listVentas(auth) {
  const ventas = await ventaRepository.list(getAuthBusinessId(auth));
  return ventas.map(mapVenta);
}

async function getVenta(id, auth) {
  const venta = await ventaRepository.findById(id, getAuthBusinessId(auth));
  if (!venta) {
    throw new AppError('Venta no encontrada', 404);
  }

  return mapVenta(venta);
}

async function getReciboVenta(id, auth) {
  const venta = await ventaRepository.findById(id, getAuthBusinessId(auth));
  if (!venta) {
    throw new AppError('Venta no encontrada', 404);
  }

  return mapReciboVenta(venta);
}

async function getWhatsappReciboVenta(id, auth) {
  const venta = await ventaRepository.findById(id, getAuthBusinessId(auth));
  if (!venta) {
    throw new AppError('Venta no encontrada', 404);
  }

  const recibo = mapReciboVenta(venta);

  return {
    tipo: 'recibo',
    mensaje: recibo.texto,
    whatsappUrl: buildWhatsappUrl(recibo.cliente.telefono, recibo.texto),
    recibo,
  };
}

async function createVenta(payload, auth) {
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!items.length) {
    throw new AppError('Debe enviar al menos un producto para registrar la venta', 400);
  }

  const clienteId = optionalText(payload.clienteId ?? payload.idCliente);
  const idNegocio = getAuthBusinessId(auth);
  let cliente = null;

  if (clienteId) {
    cliente = await clienteRepository.findById(clienteId, idNegocio);
    if (!cliente) {
      throw new AppError('Cliente no encontrado', 404);
    }
  }

  const detalles = [];
  let subtotalVenta = 0;

  for (const item of items) {
    const productoId = optionalText(item.productoId ?? item.idProducto);
    if (!productoId) {
      throw new AppError('El campo productoId es obligatorio', 400);
    }

    const cantidad = parseQuantity(item.cantidad);
    const producto = await productoRepository.findById(productoId, idNegocio);
    if (!producto) {
      throw new AppError('Producto no encontrado', 404);
    }

    const precioUnitario = item.precioUnitario === undefined
      ? Number(producto.precio)
      : Number(String(item.precioUnitario).replace(',', '.'));

    if (!Number.isFinite(precioUnitario) || precioUnitario < 0) {
      throw new AppError('El precioUnitario debe ser un monto mayor o igual a 0', 400);
    }

    const subtotal = precioUnitario * cantidad;
    subtotalVenta += subtotal;

    detalles.push({
      id: randomUUID(),
      idProducto: producto.id,
      cantidad,
      precioUnitario,
      subtotal,
    });
  }

  const descuento = parseDiscount(payload.descuento, subtotalVenta);
  const total = subtotalVenta - descuento;
  const metodoPago = normalizePaymentMethod(payload.metodoPago ?? payload.paymentMethod);

  const lastVenta = await ventaRepository.getLastVenta();
  const numero = (lastVenta?.numero || 0) + 1;
  const reciboCodigo = `REC-${String(numero).padStart(4, '0')}`;

  try {
    const venta = await ventaRepository.createVentaConStock({
      venta: {
        id: randomUUID(),
        numero,
        idCliente: cliente ? cliente.idUsuario : null,
        idNegocio,
        clienteNombre: cliente?.razonSocial || optionalText(payload.clienteNombre),
        total,
        reciboCodigo,
        fechaCreacion: new Date(),
        metodoPago,
      },
      detalles,
      idNegocio,
    });

    await notificacionService.notifySystem({
      tipo: 'venta',
      titulo: 'Venta registrada',
      mensaje: `Se registro el recibo ${venta.reciboCodigo} por Bs ${Number(venta.total).toFixed(2)}.`,
      referenciaId: venta.id,
      referenciaTipo: 'venta',
      idNegocio,
    });

    for (const detalle of venta.detalles) {
      if (detalle.producto && detalle.producto.stock <= detalle.producto.stockMinimo) {
        await notificacionService.notifySystem({
          tipo: 'stock_bajo',
          titulo: 'Stock bajo',
          mensaje: `El producto ${detalle.producto.nombre} tiene stock ${detalle.producto.stock}.`,
          referenciaId: detalle.producto.id,
          referenciaTipo: 'producto',
          idNegocio,
        });
      }
    }

    return mapVenta(venta);
  } catch (error) {
    throw new AppError(error.message || 'No se pudo registrar la venta', error.statusCode || 500);
  }
}

module.exports = {
  listVentas,
  getVenta,
  getReciboVenta,
  getWhatsappReciboVenta,
  createVenta,
  mapReciboVenta,
};
