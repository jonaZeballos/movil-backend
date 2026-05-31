const prisma = require('../utils/prismaClient');

function findByDocumentNumber(numeroDocumento, idNegocio) {
  return prisma.cliente.findFirst({
    where: {
      numeroDocumento,
      ...(idNegocio ? { idNegocio } : {}),
    },
    include: {
      usuario: {
        include: {
          telefonos: true,
        },
      },
    },
  });
}

function findByEmail(email, idNegocio) {
  return prisma.cliente.findFirst({
    where: {
      OR: [
        { email },
        { usuario: { email } },
      ],
      ...(idNegocio ? { idNegocio } : {}),
    },
    include: {
      usuario: {
        include: {
          telefonos: true,
        },
      },
    },
  });
}

function buildBusinessFilter(idNegocio) {
  return idNegocio ? { idNegocio } : {};
}

function findById(idUsuario, idNegocio) {
  return prisma.cliente.findUnique({
    where: { idUsuario },
    include: {
      usuario: {
        include: {
          telefonos: true,
        },
      },
    },
  }).then((cliente) => {
    if (cliente && idNegocio && cliente.idNegocio !== idNegocio) return null;
    return cliente;
  });
}

function findHistorialById(idUsuario, idNegocio) {
  return prisma.cliente.findUnique({
    where: { idUsuario },
    include: {
      usuario: {
        include: {
          telefonos: true,
        },
      },
      equipos: {
        include: {
          tipoEquipo: true,
          modelo: {
            include: {
              marca: true,
            },
          },
          ordenes: {
            include: {
              estado: true,
              prioridad: true,
              tecnico: {
                select: {
                  id: true,
                  nombres: true,
                  apellidos: true,
                  username: true,
                  email: true,
                },
              },
              cotizaciones: {
                orderBy: {
                  numero: 'desc',
                },
              },
            },
            orderBy: {
              codigo: 'desc',
            },
          },
        },
        orderBy: {
          fechaRegistro: 'desc',
        },
      },
      ventas: {
        include: {
          detalles: {
            include: {
              producto: true,
            },
          },
        },
        orderBy: {
          numero: 'desc',
        },
      },
    },
  }).then((cliente) => {
    if (cliente && idNegocio && cliente.idNegocio !== idNegocio) return null;
    return cliente;
  });
}

function list(search, documentNumber, searchDocumentNumber, idNegocio) {
  const searchFilters = search
    ? [
        { razonSocial: { contains: search, mode: 'insensitive' } },
        { usuario: { nombres: { contains: search, mode: 'insensitive' } } },
        { usuario: { apellidos: { contains: search, mode: 'insensitive' } } },
        { usuario: { username: { contains: search, mode: 'insensitive' } } },
        { usuario: { email: { contains: search, mode: 'insensitive' } } },
        { email: { contains: search, mode: 'insensitive' } },
        { direccion: { contains: search, mode: 'insensitive' } },
        ...(searchDocumentNumber ? [{ numeroDocumento: searchDocumentNumber }] : []),
      ]
    : [];

  return prisma.cliente.findMany({
    where: {
      AND: [
        search
          ? { OR: searchFilters }
          : {},
        documentNumber ? { numeroDocumento: documentNumber } : {},
        buildBusinessFilter(idNegocio),
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

function updateCliente(idUsuario, data) {
  return prisma.cliente.update({
    where: { idUsuario },
    data,
    include: {
      usuario: {
        include: {
          telefonos: true,
        },
      },
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
  findByEmail,
  findById,
  findHistorialById,
  list,
  updateCliente,
  createClientUser,
};
