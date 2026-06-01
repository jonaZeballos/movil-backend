const prisma = require('../utils/prismaClient');

function findByUsernameOrEmail(username, email) {
  return prisma.usuario.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
    select: {
      id: true,
      username: true,
      email: true,
    },
  });
}

function findByUsernameOrEmailForLogin(identifier) {
  return prisma.usuario.findFirst({
    where: {
      OR: [{ username: identifier }, { email: identifier.toLowerCase() }],
    },
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      username: true,
      email: true,
      password: true,
      fechaCreacion: true,
      bloqueado: true,
      motivoBloqueo: true,
      fechaBloqueo: true,
      idNegocio: true,
      negocio: {
        select: {
          id: true,
          nombre: true,
        },
      },
      rol: {
        select: {
          rol: true,
        },
      },
    },
  });
}

function findRoleByName(roleName) {
  return prisma.rol.findFirst({
    where: { rol: roleName },
    select: {
      id: true,
      rol: true,
    },
  });
}

function createRole(id, roleName) {
  return prisma.rol.create({
    data: {
      id,
      rol: roleName,
    },
    select: {
      id: true,
      rol: true,
    },
  });
}

function createUserWithPhone(data) {
  return prisma.usuario.create({
    data,
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      username: true,
      email: true,
      fechaCreacion: true,
      bloqueado: true,
      motivoBloqueo: true,
      fechaBloqueo: true,
      idNegocio: true,
      negocio: {
        select: {
          id: true,
          nombre: true,
        },
      },
      rol: {
        select: {
          rol: true,
        },
      },
    },
  });
}

function listUsers(idNegocio) {
  return prisma.usuario.findMany({
    where: {
      cliente: null,
      ...(idNegocio ? { idNegocio } : {}),
    },
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      username: true,
      email: true,
      fechaCreacion: true,
      bloqueado: true,
      motivoBloqueo: true,
      fechaBloqueo: true,
      idNegocio: true,
      rol: {
        select: {
          rol: true,
        },
      },
    },
    orderBy: {
      fechaCreacion: 'desc',
    },
  });
}

function findClientByDocumentNumber(numeroDocumento, idNegocio) {
  return prisma.cliente.findFirst({
    where: {
      numeroDocumento,
      ...(idNegocio ? { idNegocio } : {}),
    },
    select: {
      idUsuario: true,
      numeroDocumento: true,
    },
  });
}

function createClientUser(data) {
  return prisma.usuario.create({
    data,
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      username: true,
      email: true,
      fechaCreacion: true,
      bloqueado: true,
      motivoBloqueo: true,
      fechaBloqueo: true,
      idNegocio: true,
      rol: {
        select: {
          rol: true,
        },
      },
      cliente: {
        select: {
          razonSocial: true,
          numeroDocumento: true,
        },
      },
    },
  });
}

function findUserById(id, idNegocio) {
  return prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      username: true,
      email: true,
      fechaCreacion: true,
      bloqueado: true,
      motivoBloqueo: true,
      fechaBloqueo: true,
      idNegocio: true,
      cliente: { select: { idUsuario: true } },
      rol: { select: { rol: true } },
    },
  }).then((usuario) => {
    if (usuario && idNegocio && usuario.idNegocio !== idNegocio) return null;
    return usuario;
  });
}

function updateUser(id, data) {
  return prisma.usuario.update({
    where: { id },
    data,
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      username: true,
      email: true,
      fechaCreacion: true,
      bloqueado: true,
      motivoBloqueo: true,
      fechaBloqueo: true,
      idNegocio: true,
      rol: { select: { rol: true } },
    },
  });
}

function createBusinessWithOwner({ negocio, usuario }) {
  return prisma.negocio.create({
    data: {
      ...negocio,
      usuarios: {
        create: usuario,
      },
    },
    include: {
      usuarios: {
        include: {
          rol: true,
        },
      },
    },
  });
}

module.exports = {
  findByUsernameOrEmail,
  findByUsernameOrEmailForLogin,
  findRoleByName,
  createRole,
  createUserWithPhone,
  listUsers,
  findUserById,
  updateUser,
  findClientByDocumentNumber,
  createClientUser,
  createBusinessWithOwner,
};
