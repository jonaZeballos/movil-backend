const { randomUUID } = require('crypto');
const AppError = require('../utils/appError');
const productoRepository = require('../repositories/producto.repository');
const ventaRepository = require('../repositories/venta.repository');

function optionalText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function parseQuantity(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new AppError('La cantidad debe ser un entero mayor a 0', 400);
  }

  return number;
}

function mapVenta(venta) {
  const reciboCodigo = venta.reciboCodigo;

  return {
    id: venta.id,
    numero: venta.numero,
    codigo: reciboCodigo,
    reciboCodigo,
    clienteNombre: venta.clienteNombre,
    total: Number(venta.total),
    fechaCreacion: venta.fechaCreacion,
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

async function listVentas() {
  const ventas = await ventaRepository.list();
  return ventas.map(mapVenta);
}

async function getVenta(id) {
  const venta = await ventaRepository.findById(id);
  if (!venta) {
    throw new AppError('Venta no encontrada', 404);
  }

  return mapVenta(venta);
}

async function createVenta(payload) {
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!items.length) {
    throw new AppError('Debe enviar al menos un producto para registrar la venta', 400);
  }

  const detalles = [];
  let total = 0;

  for (const item of items) {
    const productoId = optionalText(item.productoId ?? item.idProducto);
    if (!productoId) {
      throw new AppError('El campo productoId es obligatorio', 400);
    }

    const cantidad = parseQuantity(item.cantidad);
    const producto = await productoRepository.findById(productoId);
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
    total += subtotal;

    detalles.push({
      id: randomUUID(),
      idProducto: producto.id,
      cantidad,
      precioUnitario,
      subtotal,
    });
  }

  const lastVenta = await ventaRepository.getLastVenta();
  const numero = (lastVenta?.numero || 0) + 1;
  const reciboCodigo = `REC-${String(numero).padStart(4, '0')}`;

  try {
    const venta = await ventaRepository.createVentaConStock({
      venta: {
        id: randomUUID(),
        numero,
        clienteNombre: optionalText(payload.clienteNombre),
        total,
        reciboCodigo,
        fechaCreacion: new Date(),
      },
      detalles,
    });

    return mapVenta(venta);
  } catch (error) {
    throw new AppError(error.message || 'No se pudo registrar la venta', error.statusCode || 500);
  }
}

module.exports = {
  listVentas,
  getVenta,
  createVenta,
};
