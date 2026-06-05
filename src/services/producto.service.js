const { randomUUID } = require('crypto');
const AppError = require('../utils/appError');
const productoRepository = require('../repositories/producto.repository');

const INVENTORY_TYPES = {
  TIENDA: 'tienda',
  TECNICO: 'tecnico',
};

const DEFAULT_PRODUCT_CATEGORIES = {
  tienda: [
    'LAPTOPS',
    'PERIFERICOS',
    'CARGADORES',
    'MONITORES',
    'COMPONENTES',
    'CABLES Y ADAPTADORES',
    'OTROS',
  ],
  tecnico: [
    'PANTALLAS',
    'PLACAS',
    'PUERTOS',
    'BATERIAS',
    'TECLADOS',
    'BISAGRAS Y CARCASAS',
    'INSUMOS TECNICOS',
    'OTROS',
  ],
};
const DEPRECATED_DEFAULT_CATEGORIES = {
  tienda: [
    'EQUIPOS',
    'MOUSE',
    'TECLADOS',
    'ACCESORIOS',
    'REDES Y CONECTIVIDAD',
    'MEMORIAS Y ALMACENAMIENTO',
    'REPUESTOS',
    'LIMPIEZA Y MANTENIMIENTO',
  ],
  tecnico: [
    'HERRAMIENTAS',
    'CONSUMIBLES TECNICOS',
    'REPUESTOS INTERNOS',
    'LIMPIEZA TECNICA',
    'SOLDADURA Y REPARACION',
    'DIAGNOSTICO',
    'REPUESTOS',
    'CONSUMIBLES',
    'COMPONENTES ELECTRONICOS',
    'TORNILLERIA Y FIJACIONES',
    'CABLES INTERNOS',
  ],
};
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

function normalizeCategoryName(value) {
  return normalizeText(value, 'nombre').replace(/\s+/g, ' ').toUpperCase().slice(0, 100);
}

function getAuthBusinessId(auth) {
  return auth?.idNegocio || auth?.negocioId || null;
}

function getAuthUserId(auth) {
  return auth?.sub || auth?.idUsuario || auth?.id || null;
}

function getAuthRole(auth) {
  return String(auth?.rol || auth?.tipoUsuario || '').toLowerCase();
}

function normalizeInventoryType(value) {
  const normalized = String(value || INVENTORY_TYPES.TIENDA).toLowerCase();
  if (!Object.values(INVENTORY_TYPES).includes(normalized)) {
    throw new AppError('Tipo de inventario invalido', 400);
  }

  return normalized;
}

function assertInventoryAccess(tipoInventario, auth, write = false) {
  const role = getAuthRole(auth);

  if (tipoInventario === INVENTORY_TYPES.TIENDA && !['admin', 'ventas'].includes(role)) {
    throw new AppError('No tienes permisos para acceder al inventario de tienda', 403);
  }

  if (tipoInventario === INVENTORY_TYPES.TECNICO && !['admin', 'tecnico'].includes(role)) {
    throw new AppError('No tienes permisos para acceder al inventario tecnico', 403);
  }

  if (write && role === 'ventas' && tipoInventario !== INVENTORY_TYPES.TIENDA) {
    throw new AppError('Ventas solo puede registrar productos en inventario de tienda', 403);
  }
}

function assertProductAccess(producto, auth, write = false) {
  const tipoInventario = producto.tipoInventario || INVENTORY_TYPES.TIENDA;
  assertInventoryAccess(tipoInventario, auth, write);

  if (tipoInventario === INVENTORY_TYPES.TECNICO && getAuthRole(auth) === 'tecnico') {
    if (producto.idTecnico && producto.idTecnico !== getAuthUserId(auth)) {
      throw new AppError('No tienes permisos para modificar este producto tecnico', 403);
    }
  }
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
    tipoInventario: producto.tipoInventario || INVENTORY_TYPES.TIENDA,
    activo: producto.activo !== false,
    motivoDesactivacion: producto.motivoDesactivacion || null,
    fechaDesactivacion: producto.fechaDesactivacion || null,
    fechaCreacion: producto.fechaCreacion,
    idNegocio: producto.idNegocio || null,
    idCategoria: producto.idCategoria || null,
    idTecnico: producto.idTecnico || null,
    categoria: producto.categoria ? mapCategoria(producto.categoria) : null,
    tecnico: producto.tecnico
      ? {
          id: producto.tecnico.id,
          nombres: producto.tecnico.nombres,
          apellidos: producto.tecnico.apellidos,
          username: producto.tecnico.username,
          email: producto.tecnico.email,
          nombre: [producto.tecnico.nombres, producto.tecnico.apellidos].filter(Boolean).join(' ').trim() || producto.tecnico.username,
        }
      : null,
  };
}

function mapCategoria(categoria) {
  return {
    id: categoria.id,
    nombre: categoria.nombre,
    descripcion: categoria.descripcion || null,
    tipoInventario: categoria.tipoInventario || INVENTORY_TYPES.TIENDA,
    activa: categoria.activa !== false,
    fechaCreacion: categoria.fechaCreacion,
    idNegocio: categoria.idNegocio || null,
    productosCount: Number(categoria._count?.productos || 0),
  };
}

async function ensureDefaultCategories(idNegocio, tipoInventario = INVENTORY_TYPES.TIENDA) {
  if (!idNegocio) return;

  await productoRepository.removeUnusedCategoriasByNames(
    idNegocio,
    tipoInventario,
    DEPRECATED_DEFAULT_CATEGORIES[tipoInventario] || []
  );

  await productoRepository.deactivateCategoriasByNames(
    idNegocio,
    tipoInventario,
    DEPRECATED_DEFAULT_CATEGORIES[tipoInventario] || []
  );

  await productoRepository.createManyCategorias(
    DEFAULT_PRODUCT_CATEGORIES[tipoInventario].map((nombre) => ({
      id: randomUUID(),
      nombre,
      descripcion: nombre === 'OTROS' ? 'Productos sin categoria especifica' : null,
      tipoInventario,
      idNegocio,
      fechaCreacion: new Date(),
    }))
  );
}

async function resolveCategoriaId(idCategoria, idNegocio, tipoInventario, allowDefault = true) {
  if (!idNegocio) return null;

  await ensureDefaultCategories(idNegocio, tipoInventario);

  if (idCategoria) {
    const categoria = await productoRepository.findCategoriaById(String(idCategoria), idNegocio, tipoInventario);
    if (!categoria || categoria.activa === false) {
      throw new AppError('Categoria no encontrada', 404);
    }

    return categoria.id;
  }

  if (!allowDefault) return null;

  const otros = await productoRepository.findCategoriaByName('OTROS', idNegocio, tipoInventario);
  return otros?.id || null;
}

async function listProductos(query = {}, auth) {
  const search = optionalText(query.buscar ?? query.search);
  const idNegocio = getAuthBusinessId(auth);
  const tipoInventario = normalizeInventoryType(query.tipoInventario);
  assertInventoryAccess(tipoInventario, auth);
  await ensureDefaultCategories(idNegocio, tipoInventario);

  const categoriaId = optionalText(query.categoriaId ?? query.idCategoria);
  const idTecnico =
    tipoInventario === INVENTORY_TYPES.TECNICO && getAuthRole(auth) === 'tecnico'
      ? getAuthUserId(auth)
      : optionalText(query.idTecnico);
  const productos = await productoRepository.list(search, idNegocio, {
    categoriaId,
    tipoInventario,
    idTecnico,
  });

  return productos.map(mapProducto);
}

async function getProducto(id, auth) {
  const producto = await productoRepository.findById(id, getAuthBusinessId(auth));
  if (!producto) {
    throw new AppError('Producto no encontrado', 404);
  }
  assertProductAccess(producto, auth);

  return mapProducto(producto);
}

async function createProducto(payload, auth) {
  const tipoInventario = normalizeInventoryType(payload.tipoInventario);
  assertInventoryAccess(tipoInventario, auth, true);
  const nombre = normalizeText(payload.nombre, 'nombre');
  const precio = tipoInventario === INVENTORY_TYPES.TECNICO && (payload.precio === undefined || payload.precio === null || payload.precio === '')
    ? 0
    : parseMoney(payload.precio, 'precio');
  const stock = parseStock(payload.stock, 'stock');
  const stockMinimo = parseStock(payload.stockMinimo, 'stockMinimo', 1);
  const idNegocio = getAuthBusinessId(auth);
  const idCategoria = await resolveCategoriaId(payload.idCategoria ?? payload.categoriaId, idNegocio, tipoInventario);
  const idTecnico =
    tipoInventario === INVENTORY_TYPES.TECNICO
      ? getAuthRole(auth) === 'tecnico'
        ? getAuthUserId(auth)
        : optionalText(payload.idTecnico) || null
      : null;

  const producto = await productoRepository.create({
    id: randomUUID(),
    nombre,
    marca: optionalText(payload.marca),
    modelo: optionalText(payload.modelo),
    descripcion: optionalText(payload.descripcion),
    precio,
    stock,
    stockMinimo,
    tipoInventario,
    fechaCreacion: new Date(),
    idCategoria,
    idTecnico,
    idNegocio,
  });

  return mapProducto(producto);
}

async function updateProducto(id, payload, auth) {
  const existing = await productoRepository.findById(id, getAuthBusinessId(auth));
  if (!existing) {
    throw new AppError('Producto no encontrado', 404);
  }
  assertProductAccess(existing, auth, true);

  const data = {};

  if (payload.nombre !== undefined) data.nombre = normalizeText(payload.nombre, 'nombre');
  if (payload.marca !== undefined) data.marca = optionalText(payload.marca);
  if (payload.modelo !== undefined) data.modelo = optionalText(payload.modelo);
  if (payload.descripcion !== undefined) data.descripcion = optionalText(payload.descripcion);
  if (payload.precio !== undefined) data.precio = parseMoney(payload.precio, 'precio');
  if (payload.stock !== undefined) data.stock = parseStock(payload.stock, 'stock');
  if (payload.stockMinimo !== undefined) data.stockMinimo = parseStock(payload.stockMinimo, 'stockMinimo');
  if (payload.idCategoria !== undefined || payload.categoriaId !== undefined) {
    const tipoInventario = existing.tipoInventario || INVENTORY_TYPES.TIENDA;
    data.idCategoria = await resolveCategoriaId(
      payload.idCategoria ?? payload.categoriaId,
      getAuthBusinessId(auth),
      tipoInventario,
      false
    );
  }

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
  assertProductAccess(existing, auth, true);

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
  assertProductAccess(existing, auth, true);

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
  assertProductAccess(existing, auth, true);

  const usos = await productoRepository.countVentaDetalles(id);
  if (usos > 0) {
    throw new AppError('No se puede eliminar un producto con ventas. Desactivalo para ocultarlo.', 409);
  }

  await productoRepository.remove(id);
  return { id };
}

async function listCategoriasProducto(query = {}, auth) {
  const idNegocio = getAuthBusinessId(auth);
  const tipoInventario = normalizeInventoryType(query.tipoInventario);
  assertInventoryAccess(tipoInventario, auth);
  await ensureDefaultCategories(idNegocio, tipoInventario);

  const includeInactive = query.incluirInactivas === 'true' || query.includeInactive === 'true';
  const categorias = await productoRepository.listCategorias(idNegocio, includeInactive, tipoInventario);
  return categorias.map(mapCategoria);
}

async function createCategoriaProducto(payload, auth) {
  const idNegocio = getAuthBusinessId(auth);
  const tipoInventario = normalizeInventoryType(payload.tipoInventario);
  await ensureDefaultCategories(idNegocio, tipoInventario);

  const nombre = normalizeCategoryName(payload.nombre);
  const existing = await productoRepository.findCategoriaByName(nombre, idNegocio, tipoInventario);

  if (existing) {
    throw new AppError('Ya existe una categoria con ese nombre', 409);
  }

  const categoria = await productoRepository.createCategoria({
    id: randomUUID(),
    nombre,
    descripcion: optionalText(payload.descripcion),
    tipoInventario,
    fechaCreacion: new Date(),
    idNegocio,
  });

  return mapCategoria(categoria);
}

async function updateCategoriaProducto(id, payload, auth) {
  const idNegocio = getAuthBusinessId(auth);
  const existing = await productoRepository.findCategoriaById(id, idNegocio);
  if (!existing) {
    throw new AppError('Categoria no encontrada', 404);
  }

  const data = {};
  if (payload.nombre !== undefined) data.nombre = normalizeCategoryName(payload.nombre);
  if (payload.descripcion !== undefined) data.descripcion = optionalText(payload.descripcion);

  if (!Object.keys(data).length) {
    throw new AppError('Debe enviar al menos un campo valido para actualizar', 400);
  }

  if (data.nombre && data.nombre !== existing.nombre) {
    const duplicate = await productoRepository.findCategoriaByName(data.nombre, idNegocio, existing.tipoInventario);
    if (duplicate) {
      throw new AppError('Ya existe una categoria con ese nombre', 409);
    }
  }

  const categoria = await productoRepository.updateCategoria(id, data);
  return mapCategoria(categoria);
}

async function desactivarCategoriaProducto(id, auth) {
  const idNegocio = getAuthBusinessId(auth);
  const existing = await productoRepository.findCategoriaById(id, idNegocio);
  if (!existing) {
    throw new AppError('Categoria no encontrada', 404);
  }

  const categoria = await productoRepository.updateCategoria(id, { activa: false });
  return mapCategoria(categoria);
}

module.exports = {
  listProductos,
  getProducto,
  createProducto,
  updateProducto,
  desactivarProducto,
  restaurarProducto,
  eliminarProducto,
  listCategoriasProducto,
  createCategoriaProducto,
  updateCategoriaProducto,
  desactivarCategoriaProducto,
  mapProducto,
  mapCategoria,
};
