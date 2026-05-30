const prisma = require('../utils/prismaClient');

function findEstadoByName(nombre) {
  return prisma.estadoOrdenServicio.findFirst({
    where: { nombre: { equals: nombre, mode: 'insensitive' } },
  });
}

function createEstado(id, nombre) {
  return prisma.estadoOrdenServicio.create({ data: { id, nombre } });
}

function findPrioridadByName(prioridad) {
  return prisma.prioridad.findFirst({ where: { prioridad } });
}

function createPrioridad(id, prioridad) {
  return prisma.prioridad.create({ data: { id, prioridad } });
}

function getLastOrder(idNegocio) {
  return prisma.ordenServicio.findFirst({
    where: {
      ...(idNegocio ? { idNegocio } : {}),
    },
    orderBy: { codigo: 'desc' },
    select: { codigo: true },
  });
}

function createOrden(data) {
  return prisma.ordenServicio.create({
    data,
    include: includeOrden(),
  });
}

function createOrdenes(dataList) {
  return prisma.$transaction(async (tx) => {
    await tx.ordenServicio.createMany({ data: dataList });

    return tx.ordenServicio.findMany({
      where: {
        id: { in: dataList.map((data) => data.id) },
      },
      include: includeOrden(),
      orderBy: { codigo: 'asc' },
    });
  });
}

function list(search, idNegocio) {
  return prisma.ordenServicio.findMany({
    where: {
      ...(idNegocio ? { idNegocio } : {}),
      ...(search
        ? {
            OR: [
              { diagnostico: { contains: search, mode: 'insensitive' } },
              { observaciones: { contains: search, mode: 'insensitive' } },
              { equipo: { nroSerie: { contains: search, mode: 'insensitive' } } },
              { equipo: { cliente: { razonSocial: { contains: search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    },
    include: includeOrden(),
    orderBy: {
      codigo: 'desc',
    },
  });
}

function findById(id, idNegocio) {
  return prisma.ordenServicio.findUnique({
    where: { id },
    include: includeOrden(),
  }).then((orden) => {
    if (orden && idNegocio && orden.idNegocio !== idNegocio) return null;
    return orden;
  });
}

function updateOrden(id, data) {
  return prisma.ordenServicio.update({
    where: { id },
    data,
    include: includeOrden(),
  });
}

function includeOrden() {
  return {
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
    tecnico: true,
    estado: true,
    prioridad: true,
    cotizaciones: {
      orderBy: { numero: 'desc' },
      include: includeCotizacionLinks(),
    },
    cotizacionLinks: {
      include: {
        cotizacion: {
          include: includeCotizacionLinks(),
        },
      },
    },
  };
}

function includeCotizacionLinks() {
  return {
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

module.exports = {
  findEstadoByName,
  createEstado,
  findPrioridadByName,
  createPrioridad,
  getLastOrder,
  createOrden,
  createOrdenes,
  list,
  findById,
  updateOrden,
};
