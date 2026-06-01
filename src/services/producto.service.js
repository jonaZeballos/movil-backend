const { randomUUID } = require('crypto');
const AppError = require('../utils/appError');
const productoRepository = require('../repositories/producto.repository');

function normalizeText(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(`El campo ${fieldName} es obligatorio`, 400);
  }

  return value.trim();
}

function optionalText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeReason(value, fallback) {
  return (optionalText(value) || fallback).slice(0, 300);
}

function getAuthBusinessId(auth) {
  return auth?.idNegocio || auth?.negocioId || null;
}

function parseMoney(value, fieldName) {
  const number = Number(String(value ?? '').replace(',', '.'));
  if (!Number.isFinite(number) || number < 0) {
    throw new AppError(`El campo ${fieldName} debe ser un monto mayor o igual a 0`, 400);
  }

  return number;
}

function parseStock(value, fieldName, defaultValue = 0) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new AppError(`El campo ${fieldName} debe ser un entero mayor o igual a 0`, 400);
  }

  return number;
}

function mapProducto(producto) {
  return {
    id: producto.id,
    nombre: producto.nombre,
    marca: producto.marca,
    modelo: producto.modelo,
    descripcion: producto.descripcion,
    precio: Number(producto.precio),
    stock: producto.stock,
    stockMinimo: producto.stockMinimo,
    stockBajo: producto.stock <= producto.stockMinimo,
    activo: producto.activo !== false,
    motivoDesactivacion: producto.motivoDesactivacion || null,
    fechaDesactivacion: producto.fechaDesactivacion || null,
    fechaCreacion: producto.fechaCreacion,
    idNegocio: producto.idNegocio || null,
  };
}

async function listProductos(query = {}, auth) {
  const search = optionalText(query.buscar ?? query.search);
  const productos = await productoRepository.list(search, getAuthBusinessId(auth));

  return productos.map(mapProducto);
}

async function getProducto(id, auth) {
  const producto = await productoRepository.findById(id, getAuthBusinessId(auth));
  if (!producto) {
    throw new AppError('Producto no encontrado', 404);
  }

  return mapProducto(producto);
}

async function createProducto(payload, auth) {
  const nombre = normalizeText(payload.nombre, 'nombre');
  const precio = parseMoney(payload.precio, 'precio');
  const stock = parseStock(payload.stock, 'stock');
  const stockMinimo = parseStock(payload.stockMinimo, 'stockMinimo', 1);

  const producto = await productoRepository.create({
    id: randomUUID(),
    nombre,
    marca: optionalText(payload.marca),
    modelo: optionalText(payload.modelo),
    descripcion: optionalText(payload.descripcion),
    precio,
    stock,
    stockMinimo,
    fechaCreacion: new Date(),
    idNegocio: getAuthBusinessId(auth),
  });

  return mapProducto(producto);
}

async function updateProducto(id, payload, auth) {
  const existing = await productoRepository.findById(id, getAuthBusinessId(auth));
  if (!existing) {
    throw new AppError('Producto no encontrado', 404);
  }

  const data = {};

  if (payload.nombre !== undefined) data.nombre = normalizeText(payload.nombre, 'nombre');
  if (payload.marca !== undefined) data.marca = optionalText(payload.marca);
  if (payload.modelo !== undefined) data.modelo = optionalText(payload.modelo);
  if (payload.descripcion !== undefined) data.descripcion = optionalText(payload.descripcion);
  if (payload.precio !== undefined) data.precio = parseMoney(payload.precio, 'precio');
  if (payload.stock !== undefined) data.stock = parseStock(payload.stock, 'stock');
  if (payload.stockMinimo !== undefined) data.stockMinimo = parseStock(payload.stockMinimo, 'stockMinimo');

  if (!Object.keys(data).length) {
    throw new AppError('Debe enviar al menos un campo valido para actualizar', 400);
  }

  const producto = await productoRepository.update(id, data);
  return mapProducto(producto);
}

async function desactivarProducto(id, payload, auth) {
  const existing = await productoRepository.findById(id, getAuthBusinessId(auth));
  if (!existing) {
    throw new AppError('Producto no encontrado', 404);
  }

  const producto = await productoRepository.update(id, {
    activo: false,
    motivoDesactivacion: normalizeReason(payload?.motivo, 'Desactivado por administrador'),
    fechaDesactivacion: new Date(),
  });

  return mapProducto(producto);
}

async function restaurarProducto(id, auth) {
  const existing = await productoRepository.findById(id, getAuthBusinessId(auth));
  if (!existing) {
    throw new AppError('Producto no encontrado', 404);
  }

  const producto = await productoRepository.update(id, {
    activo: true,
    motivoDesactivacion: null,
    fechaDesactivacion: null,
  });

  return mapProducto(producto);
}

async function eliminarProducto(id, auth) {
  const existing = await productoRepository.findById(id, getAuthBusinessId(auth));
  if (!existing) {
    throw new AppError('Producto no encontrado', 404);
  }

  const usos = await productoRepository.countVentaDetalles(id);
  if (usos > 0) {
    throw new AppError('No se puede eliminar un producto con ventas. Desactivalo para ocultarlo.', 409);
  }

  await productoRepository.remove(id);
  return { id };
}

module.exports = {
  listProductos,
  getProducto,
  createProducto,
  updateProducto,
  desactivarProducto,
  restaurarProducto,
  eliminarProducto,
  mapProducto,
};
