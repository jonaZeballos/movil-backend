const prisma = require('../utils/prismaClient');

function includeCotizacion() {
  return {
    orden: {
      include: {
        equipo: {
          include: {
            cliente: true,
            tipoEquipo: true,
            modelo: { include: { marca: true } },
          },
        },
      },
    },
  };
}

function list(search) {
  return prisma.cotizacion.findMany({
    where: search
      ? {
          OR: [
            { descripcion: { contains: search, mode: 'insensitive' } },
            { observaciones: { contains: search, mode: 'insensitive' } },
            { estado: { contains: search, mode: 'insensitive' } },
            { orden: { equipo: { cliente: { razonSocial: { contains: search, mode: 'insensitive' } } } } },
          ],
        }
      : undefined,
    include: includeCotizacion(),
    orderBy: { numero: 'desc' },
  });
}

function findById(id) {
  return prisma.cotizacion.findUnique({
    where: { id },
    include: includeCotizacion(),
  });
}

function getLastCotizacion() {
  return prisma.cotizacion.findFirst({
    orderBy: { numero: 'desc' },
    select: { numero: true },
  });
}

function create(data) {
  return prisma.cotizacion.create({
    data,
    include: includeCotizacion(),
  });
}

module.exports = {
  list,
  findById,
  getLastCotizacion,
  create,
};
