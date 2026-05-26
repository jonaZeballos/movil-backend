const prisma = require('../utils/prismaClient');

function list({ leida, tipo, idNegocio } = {}) {
  return prisma.notificacion.findMany({
    where: {
      ...(idNegocio ? { idNegocio } : {}),
      ...(typeof leida === 'boolean' ? { leida } : {}),
      ...(tipo ? { tipo } : {}),
    },
    orderBy: {
      fechaCreacion: 'desc',
    },
  });
}

function findById(id, idNegocio) {
  return prisma.notificacion.findUnique({
    where: { id },
  }).then((notificacion) => {
    if (notificacion && idNegocio && notificacion.idNegocio !== idNegocio) return null;
    return notificacion;
  });
}

function create(data) {
  return prisma.notificacion.create({
    data,
  });
}

function markAsRead(id) {
  return prisma.notificacion.update({
    where: { id },
    data: { leida: true },
  });
}

module.exports = {
  list,
  findById,
  create,
  markAsRead,
};
