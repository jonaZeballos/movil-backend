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

module.exports = {
  findByUsernameOrEmail,
  findRoleByName,
  createRole,
  createUserWithPhone,
};
