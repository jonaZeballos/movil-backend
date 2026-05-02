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
      OR: [{ username: identifier }, { email: identifier }],
    },
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      username: true,
      email: true,
      password: true,
      fechaCreacion: true,
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
      rol: {
        select: {
          rol: true,
        },
      },
    },
  });
}

function listUsers() {
  return prisma.usuario.findMany({
    where: {
      cliente: null,
    },
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      username: true,
      email: true,
      fechaCreacion: true,
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

function findClientByDocumentNumber(numeroDocumento) {
  return prisma.cliente.findUnique({
    where: {
      numeroDocumento,
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

module.exports = {
  findByUsernameOrEmail,
  findByUsernameOrEmailForLogin,
  findRoleByName,
  createRole,
  createUserWithPhone,
  listUsers,
  findClientByDocumentNumber,
  createClientUser,
};
