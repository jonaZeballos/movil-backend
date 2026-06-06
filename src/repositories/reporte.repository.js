const prisma = require('../utils/prismaClient');

function buildDateFilter(field, desde, hasta) {
  if (!desde && !hasta) {
    return {};
  }

  return {
    [field]: {
      ...(desde ? { gte: desde } : {}),
      ...(hasta ? { lte: hasta } : {}),
    },
  };
}

function includeClienteCompleto() {
  return {
    usuario: {
      include: {
        telefonos: true,
      },
    },
  };
}

function countClientes(idNegocio) {
  return prisma.cliente.count({ where: { ...(idNegocio ? { idNegocio } : {}) } });
}

function countEquipos(idNegocio) {
  return prisma.equipo.count({ where: { ...(idNegocio ? { idNegocio } : {}) } });
}

function listOrdenes(desde, hasta, idNegocio) {
  return prisma.ordenServicio.findMany({
    where: {
      ...buildDateFilter('fechaRecepcion', desde, hasta),
      ...(idNegocio ? { idNegocio } : {}),
    },
    include: {
      estado: true,
      prioridad: true,
      tecnico: true,
      equipo: {
        include: {
          cliente: {
            include: includeClienteCompleto(),
          },
          tipoEquipo: true,
          modelo: {
            include: {
              marca: true,
            },
          },
        },
      },
      cotizaciones: {
        include: {
          repuestosDetalle: {
            include: { producto: true },
          },
        },
      },
    },
    orderBy: {
      codigo: 'desc',
    },
  });
}

function listVentas(desde, hasta, idNegocio) {
  return prisma.venta.findMany({
    where: {
      ...buildDateFilter('fechaCreacion', desde, hasta),
      ...(idNegocio ? { idNegocio } : {}),
    },
    include: {
      cliente: {
        include: includeClienteCompleto(),
      },
      detalles: {
        include: {
          producto: true,
        },
      },
    },
    orderBy: {
      numero: 'desc',
    },
  });
}

function listProductos(idNegocio) {
  return prisma.producto.findMany({
    where: {
      ...(idNegocio ? { idNegocio } : {}),
    },
    orderBy: {
      nombre: 'asc',
    },
  });
}

function listCotizaciones(desde, hasta, idNegocio) {
  return prisma.cotizacion.findMany({
    where: {
      ...buildDateFilter('fechaCreacion', desde, hasta),
      ...(idNegocio ? { idNegocio } : {}),
    },
    orderBy: {
      numero: 'desc',
    },
  });
}

module.exports = {
  countClientes,
  countEquipos,
  listOrdenes,
  listVentas,
  listProductos,
  listCotizaciones,
};
