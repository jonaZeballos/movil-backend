const prisma = require('../utils/prismaClient');

function findEstadoByName(nombre) {
  return prisma.estadoOrdenServicio.findFirst({ where: { nombre } });
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

function getLastOrder() {
  return prisma.ordenServicio.findFirst({
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

function list(search) {
  return prisma.ordenServicio.findMany({
    where: search
      ? {
          OR: [
            { diagnostico: { contains: search, mode: 'insensitive' } },
            { observaciones: { contains: search, mode: 'insensitive' } },
            { equipo: { nroSerie: { contains: search, mode: 'insensitive' } } },
            { equipo: { cliente: { razonSocial: { contains: search, mode: 'insensitive' } } } },
          ],
        }
      : undefined,
    include: includeOrden(),
    orderBy: {
      codigo: 'desc',
    },
  });
}

function findById(id) {
  return prisma.ordenServicio.findUnique({
    where: { id },
    include: includeOrden(),
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
    equipo: {
      include: {
        cliente: true,
        tipoEquipo: true,
        modelo: { include: { marca: true } },
      },
    },
    tecnico: true,
    estado: true,
    prioridad: true,
  };
}

module.exports = {
  findEstadoByName,
  createEstado,
  findPrioridadByName,
  createPrioridad,
  getLastOrder,
  createOrden,
  list,
  findById,
  updateOrden,
};
