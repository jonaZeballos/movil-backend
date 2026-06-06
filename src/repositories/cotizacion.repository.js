const prisma = require('../utils/prismaClient');

function includeCotizacion() {
  return {
    orden: {
      include: {
        negocio: true,
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
    repuestosDetalle: {
      include: {
        producto: true,
      },
    },
    ordenLinks: {
      include: {
        orden: {
          include: {
            negocio: true,
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

function findByOrderId(idOrden, idNegocio) {
  return prisma.cotizacion.findFirst({
    where: {
      OR: [
        { idOrden },
        { ordenLinks: { some: { idOrden } } },
      ],
      ...(idNegocio ? { idNegocio } : {}),
    },
    include: includeCotizacion(),
    orderBy: { numero: 'desc' },
  });
}

function getLastCotizacion() {
  return prisma.cotizacion.findFirst({
    orderBy: { numero: 'desc' },
    select: { numero: true },
  });
}

function update(id, data) {
  return prisma.cotizacion.update({
    where: { id },
    data,
    include: includeCotizacion(),
  });
}

function create(data, ordenIds = [], repuestosDetalle = []) {
  const linkedOrderIds = Array.from(new Set([data.idOrden, ...ordenIds].filter(Boolean)));

  return prisma.$transaction(async (tx) => {
    const cotizacion = await tx.cotizacion.create({
      data,
    });

    if (repuestosDetalle.length) {
      await tx.cotizacionRepuesto.createMany({
        data: repuestosDetalle.map((item) => ({
          ...item,
          idCotizacion: cotizacion.id,
        })),
      });
    }

    if (linkedOrderIds.length) {
      await tx.cotizacionOrden.createMany({
        data: linkedOrderIds.map((idOrden) => ({
          id: `${cotizacion.id}-${idOrden}`,
          idCotizacion: cotizacion.id,
          idOrden,
        })),
        skipDuplicates: true,
      });
    }

    return tx.cotizacion.findUnique({
      where: { id: cotizacion.id },
      include: includeCotizacion(),
    });
  });
}

module.exports = {
  list,
  findById,
  findByOrderId,
  getLastCotizacion,
  create,
};

