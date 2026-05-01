const prisma = require('../utils/prismaClient');

function findTipoByName(nombre) {
  return prisma.tipoEquipo.findFirst({ where: { nombre } });
}

function createTipo(id, nombre) {
  return prisma.tipoEquipo.create({ data: { id, nombre } });
}

function findMarcaByName(nombre) {
  return prisma.marca.findFirst({ where: { nombre } });
}

function createMarca(id, nombre) {
  return prisma.marca.create({ data: { id, nombre } });
}

function findModeloByNameAndMarca(nombreModelo, idMarca) {
  return prisma.modelo.findFirst({
    where: {
      nombreModelo,
      idMarca,
    },
  });
}

function createModelo(data) {
  return prisma.modelo.create({ data });
}

function createEquipo(data) {
  return prisma.equipo.create({
    data,
    include: {
      cliente: { include: { usuario: true } },
      tipoEquipo: true,
      modelo: { include: { marca: true } },
    },
  });
}

function list(search) {
  return prisma.equipo.findMany({
    where: search
      ? {
          OR: [
            { nroSerie: { contains: search, mode: 'insensitive' } },
            { cliente: { razonSocial: { contains: search, mode: 'insensitive' } } },
            { tipoEquipo: { nombre: { contains: search, mode: 'insensitive' } } },
            { modelo: { nombreModelo: { contains: search, mode: 'insensitive' } } },
            { modelo: { marca: { nombre: { contains: search, mode: 'insensitive' } } } },
          ],
        }
      : undefined,
    include: {
      cliente: { include: { usuario: true } },
      tipoEquipo: true,
      modelo: { include: { marca: true } },
    },
    orderBy: {
      fechaRegistro: 'desc',
    },
  });
}

function findById(id) {
  return prisma.equipo.findUnique({
    where: { id },
    include: {
      cliente: { include: { usuario: true } },
      tipoEquipo: true,
      modelo: { include: { marca: true } },
    },
  });
}

module.exports = {
  findTipoByName,
  createTipo,
  findMarcaByName,
  createMarca,
  findModeloByNameAndMarca,
  createModelo,
  createEquipo,
  list,
  findById,
};
