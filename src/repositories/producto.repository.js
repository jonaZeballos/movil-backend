const prisma = require('../utils/prismaClient');

function list(search) {
  return prisma.producto.findMany({
    where: search
      ? {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' } },
            { marca: { contains: search, mode: 'insensitive' } },
            { modelo: { contains: search, mode: 'insensitive' } },
            { descripcion: { contains: search, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: { fechaCreacion: 'desc' },
  });
}

function findById(id) {
  return prisma.producto.findUnique({ where: { id } });
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
