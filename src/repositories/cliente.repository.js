const prisma = require('../utils/prismaClient');

function findByDocumentNumber(numeroDocumento) {
  return prisma.cliente.findUnique({
    where: { numeroDocumento },
    include: {
      usuario: {
        include: {
          telefonos: true,
        },
      },
    },
  });
}

function findById(idUsuario) {
  return prisma.cliente.findUnique({
    where: { idUsuario },
    include: {
      usuario: {
        include: {
          telefonos: true,
        },
      },
    },
  });
}

function list(search, documentNumber) {
  return prisma.cliente.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { razonSocial: { contains: search, mode: 'insensitive' } },
                { usuario: { nombres: { contains: search, mode: 'insensitive' } } },
                { usuario: { apellidos: { contains: search, mode: 'insensitive' } } },
                { usuario: { email: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {},
        documentNumber ? { numeroDocumento: documentNumber } : {},
      ],
    },
    include: {
      usuario: {
        include: {
          telefonos: true,
        },
      },
    },
    orderBy: {
      razonSocial: 'asc',
    },
  });
}

function createClientUser(data) {
  return prisma.usuario.create({
    data,
    include: {
      cliente: true,
      telefonos: true,
      rol: true,
    },
  });
}

module.exports = {
  findByDocumentNumber,
  findById,
  list,
  createClientUser,
};
