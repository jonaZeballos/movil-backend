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
    fechaCreacion: producto.fechaCreacion,
  };
}

async function listProductos(query = {}) {
  const search = optionalText(query.buscar ?? query.search);
  const productos = await productoRepository.list(search);

  return productos.map(mapProducto);
}

async function getProducto(id) {
  const producto = await productoRepository.findById(id);
  if (!producto) {
    throw new AppError('Producto no encontrado', 404);
  }

  return mapProducto(producto);
}

async function createProducto(payload) {
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
  });

  return mapProducto(producto);
}

async function updateProducto(id, payload) {
  const existing = await productoRepository.findById(id);
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

module.exports = {
  listProductos,
  getProducto,
  createProducto,
  updateProducto,
  mapProducto,
};
