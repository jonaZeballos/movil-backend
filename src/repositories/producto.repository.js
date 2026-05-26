const prisma = require('../utils/prismaClient');

function list(search, idNegocio) {
  return prisma.producto.findMany({
    where: {
      ...(idNegocio ? { idNegocio } : {}),
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
    orderBy: { fechaCreacion: 'desc' },
  });
}

function findById(id, idNegocio) {
  return prisma.producto.findUnique({ where: { id } }).then((producto) => {
    if (producto && idNegocio && producto.idNegocio !== idNegocio) return null;
    return producto;
  });
}

function create(data) {
  return prisma.producto.create({ data });
}

function update(id, data) {
  return prisma.producto.update({ where: { id }, data });
}

module.exports = {
  list,
  findById,
  create,
  update,
};
