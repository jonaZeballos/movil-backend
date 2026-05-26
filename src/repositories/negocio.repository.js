const prisma = require('../utils/prismaClient');

function findById(id) {
  return prisma.negocio.findUnique({
    where: { id },
    include: {
      usuarios: {
        select: {
          id: true,
          nombres: true,
          apellidos: true,
          username: true,
          email: true,
          rol: {
            select: {
              rol: true,
            },
          },
        },
      },
    },
  });
}

function update(id, data) {
  return prisma.negocio.update({
    where: { id },
    data,
    include: {
      usuarios: {
        select: {
          id: true,
          nombres: true,
          apellidos: true,
          username: true,
          email: true,
          rol: {
            select: {
              rol: true,
            },
          },
        },
      },
    },
  });
}

module.exports = {
  findById,
  update,
};
