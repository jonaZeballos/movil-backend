const prisma = require('../utils/prismaClient');

function includeVenta() {
  return {
    detalles: {
      include: {
        producto: true,
      },
    },
  };
}

function list() {
  return prisma.venta.findMany({
    include: includeVenta(),
    orderBy: { numero: 'desc' },
  });
}

function findById(id) {
  return prisma.venta.findUnique({
    where: { id },
    include: includeVenta(),
  });
}

function getLastVenta() {
  return prisma.venta.findFirst({
    orderBy: { numero: 'desc' },
    select: { numero: true },
  });
}

function createVentaConStock({ venta, detalles }) {
  return prisma.$transaction(async (tx) => {
    for (const detalle of detalles) {
      const producto = await tx.producto.findUnique({
        where: { id: detalle.idProducto },
      });

      if (!producto) {
        const error = new Error('Producto no encontrado');
        error.statusCode = 404;
        throw error;
      }

      if (producto.stock < detalle.cantidad) {
        const error = new Error(`Stock insuficiente para ${producto.nombre}`);
        error.statusCode = 400;
        throw error;
      }

      await tx.producto.update({
        where: { id: producto.id },
        data: { stock: producto.stock - detalle.cantidad },
      });
    }

    return tx.venta.create({
      data: {
        ...venta,
        detalles: {
          create: detalles,
        },
      },
      include: includeVenta(),
    });
  });
}

module.exports = {
  list,
  findById,
  getLastVenta,
  createVentaConStock,
};
