const prisma = require('../utils/prismaClient');

function includeCotizacion() {
  return {
    orden: {
      include: {
        equipo: {
          include: {
            cliente: {
              include: {
                usuario: {
                  include: {
                    telefonos: true,
                  },
                },
              },
            },
            tipoEquipo: true,
            modelo: { include: { marca: true } },
          },
        },
      },
    },
  };
}

function list(search, idNegocio) {
  return prisma.cotizacion.findMany({
    where: {
      ...(idNegocio ? { idNegocio } : {}),
      ...(search
        ? {
            OR: [
              { descripcion: { contains: search, mode: 'insensitive' } },
              { observaciones: { contains: search, mode: 'insensitive' } },
              { estado: { contains: search, mode: 'insensitive' } },
              { orden: { equipo: { cliente: { razonSocial: { contains: search, mode: 'insensitive' } } } } },
            ],
          }
        : {}),
    },
    include: includeCotizacion(),
    orderBy: { numero: 'desc' },
  });
}

function findById(id, idNegocio) {
  return prisma.cotizacion.findUnique({
    where: { id },
    include: includeCotizacion(),
  }).then((cotizacion) => {
    if (cotizacion && idNegocio && cotizacion.idNegocio !== idNegocio) return null;
    return cotizacion;
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
