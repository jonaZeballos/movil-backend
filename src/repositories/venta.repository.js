const prisma = require('../utils/prismaClient');

function includeVenta() {
  return {
    negocio: true,
    cliente: {
      include: {
        usuario: {
          include: {
            telefonos: true,
          },
        },
      },
    },
    detalles: {
      include: {
        producto: true,
      },
    },
  };
}

function list(idNegocio) {
  return prisma.venta.findMany({
    where: {
      ...(idNegocio ? { idNegocio } : {}),
    },
    include: includeVenta(),
    orderBy: { numero: 'desc' },
  });
}

function findById(id, idNegocio) {
  return prisma.venta.findUnique({
    where: { id },
    include: includeVenta(),
  }).then((venta) => {
    if (venta && idNegocio && venta.idNegocio !== idNegocio) return null;
    return venta;
  });
}

function getLastVenta() {
  return prisma.venta.findFirst({
    orderBy: { numero: 'desc' },
    select: { numero: true },
  });
}

function createVentaConStock({ venta, detalles, idNegocio }) {
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

      if (idNegocio && producto.idNegocio !== idNegocio) {
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
  }, {
    maxWait: 10000,
    timeout: 20000,
  });
}

module.exports = {
  list,
  findById,
  getLastVenta,
  createVentaConStock,
  includeVenta,
};
