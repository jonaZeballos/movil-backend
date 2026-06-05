const prisma = require('../utils/prismaClient');

function list(search, idNegocio, filters = {}) {
  return prisma.producto.findMany({
    where: {
      activo: true,
      ...(idNegocio ? { idNegocio } : {}),
      ...(filters.categoriaId ? { idCategoria: filters.categoriaId } : {}),
      ...(filters.tipoInventario ? { tipoInventario: filters.tipoInventario } : {}),
      ...(filters.idTecnico ? { idTecnico: filters.idTecnico } : {}),
      ...(search
        ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { marca: { contains: search, mode: 'insensitive' } },
              { modelo: { contains: search, mode: 'insensitive' } },
              { descripcion: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: {
      categoria: true,
      tecnico: {
        select: {
          id: true,
          nombres: true,
          apellidos: true,
          username: true,
          email: true,
        },
      },
    },
    orderBy: { fechaCreacion: 'desc' },
  });
}

function findById(id, idNegocio) {
  return prisma.producto.findUnique({
    where: { id },
    include: {
      categoria: true,
      tecnico: {
        select: {
          id: true,
          nombres: true,
          apellidos: true,
          username: true,
          email: true,
        },
      },
    },
  }).then((producto) => {
    if (producto && idNegocio && producto.idNegocio !== idNegocio) return null;
    return producto;
  });
}

function create(data) {
  return prisma.producto.create({
    data,
    include: {
      categoria: true,
      tecnico: {
        select: {
          id: true,
          nombres: true,
          apellidos: true,
          username: true,
          email: true,
        },
      },
    },
  });
}

function update(id, data) {
  return prisma.producto.update({
    where: { id },
    data,
    include: {
      categoria: true,
      tecnico: {
        select: {
          id: true,
          nombres: true,
          apellidos: true,
          username: true,
          email: true,
        },
      },
    },
  });
}

function countVentaDetalles(id) {
  return prisma.ventaDetalle.count({ where: { idProducto: id } });
}

function remove(id) {
  return prisma.producto.delete({ where: { id } });
}

function listCategorias(idNegocio, includeInactive = false, tipoInventario) {
  return prisma.categoriaProducto.findMany({
    where: {
      idNegocio,
      ...(includeInactive ? {} : { activa: true }),
      ...(tipoInventario ? { tipoInventario } : {}),
    },
    orderBy: { nombre: 'asc' },
    include: {
      _count: {
        select: { productos: true },
      },
    },
  });
}

function findCategoriaById(id, idNegocio, tipoInventario) {
  return prisma.categoriaProducto.findUnique({ where: { id } }).then((categoria) => {
    if (categoria && idNegocio && categoria.idNegocio !== idNegocio) return null;
    if (categoria && tipoInventario && categoria.tipoInventario !== tipoInventario) return null;
    return categoria;
  });
}

function findCategoriaByName(nombre, idNegocio, tipoInventario) {
  return prisma.categoriaProducto.findFirst({
    where: { nombre, idNegocio, tipoInventario },
  });
}

function createCategoria(data) {
  return prisma.categoriaProducto.create({
    data,
    include: {
      _count: {
        select: { productos: true },
      },
    },
  });
}

function createManyCategorias(data) {
  return prisma.categoriaProducto.createMany({
    data,
    skipDuplicates: true,
  });
}

function updateCategoria(id, data) {
  return prisma.categoriaProducto.update({
    where: { id },
    data,
    include: {
      _count: {
        select: { productos: true },
      },
    },
  });
}

function removeUnusedCategoriasByNames(idNegocio, tipoInventario, nombres) {
  return prisma.categoriaProducto.deleteMany({
    where: {
      idNegocio,
      tipoInventario,
      nombre: { in: nombres },
      productos: { none: {} },
    },
  });
}

function deactivateCategoriasByNames(idNegocio, tipoInventario, nombres) {
  if (!Array.isArray(nombres) || nombres.length === 0) {
    return Promise.resolve({ count: 0 });
  }

  return prisma.categoriaProducto.updateMany({
    where: {
      idNegocio,
      tipoInventario,
      nombre: { in: nombres },
      activa: true,
    },
    data: {
      activa: false,
    },
  });
}

module.exports = {
  list,
  findById,
  create,
  update,
  countVentaDetalles,
  remove,
  listCategorias,
  findCategoriaById,
  findCategoriaByName,
  createCategoria,
  createManyCategorias,
  updateCategoria,
  removeUnusedCategoriasByNames,
  deactivateCategoriasByNames,
};
