const AppError = require('../utils/appError');
const reporteRepository = require('../repositories/reporte.repository');

function parseDate(value, fieldName, endOfDay = false) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`El campo ${fieldName} no tiene un formato valido`, 400);
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

function getAuthBusinessId(auth) {
  return auth?.idNegocio || auth?.negocioId || null;
}

function parseRange(query = {}) {
  const desde = parseDate(query.desde ?? query.fechaInicio ?? query.from, 'desde');
  const hasta = parseDate(query.hasta ?? query.fechaFin ?? query.to, 'hasta', true);

  if (desde && hasta && desde > hasta) {
    throw new AppError('La fecha desde no puede ser mayor a la fecha hasta', 400);
  }

  return { desde, hasta };
}

function incrementCounter(counter, key) {
  const normalizedKey = key || 'Sin definir';
  counter[normalizedKey] = (counter[normalizedKey] || 0) + 1;
}

function toArrayCounter(counter) {
  return Object.entries(counter)
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre));
}

function mapOrdenResumen(orden) {
  const equipo = orden.equipo;

  return {
    id: orden.id,
    codigo: orden.codigo,
    code: `#${String(orden.codigo).padStart(4, '0')}`,
    cliente: equipo?.cliente?.razonSocial || null,
    equipo: equipo
      ? `${equipo.tipoEquipo?.nombre || ''} ${equipo.modelo?.marca?.nombre || ''} ${equipo.modelo?.nombreModelo || ''}`.trim()
      : null,
    diagnostico: orden.diagnostico,
    estado: orden.estado?.nombre || null,
    prioridad: orden.prioridad?.prioridad || null,
    fechaRecepcion: orden.fechaRecepcion,
    fechaEntrega: orden.fechaEntrega,
    totalCotizado: orden.cotizaciones.reduce((sum, cotizacion) => sum + Number(cotizacion.total), 0),
  };
}

function buildServiciosReport(ordenes) {
  const porEstado = {};
  const porPrioridad = {};
  let cerradas = 0;
  let totalCotizado = 0;

  for (const orden of ordenes) {
    const estado = orden.estado?.nombre || null;
    incrementCounter(porEstado, estado);
    incrementCounter(porPrioridad, orden.prioridad?.prioridad || null);
    totalCotizado += orden.cotizaciones.reduce((sum, cotizacion) => sum + Number(cotizacion.total), 0);

    if (['entregado', 'listo', 'sin solucion'].includes(String(estado || '').toLowerCase())) {
      cerradas += 1;
    }
  }

  return {
    totalOrdenes: ordenes.length,
    ordenesAbiertas: ordenes.length - cerradas,
    ordenesCerradas: cerradas,
    totalCotizado,
    porEstado: toArrayCounter(porEstado),
    porPrioridad: toArrayCounter(porPrioridad),
    ordenes: ordenes.map(mapOrdenResumen),
  };
}

function mapVentaResumen(venta) {
  return {
    id: venta.id,
    numero: venta.numero,
    codigo: venta.reciboCodigo,
    reciboCodigo: venta.reciboCodigo,
    clienteId: venta.idCliente,
    clienteNombre: venta.cliente?.razonSocial || venta.clienteNombre,
    total: Number(venta.total),
    fechaCreacion: venta.fechaCreacion,
    totalProductos: venta.detalles.reduce((sum, detalle) => sum + detalle.cantidad, 0),
  };
}

function buildVentasReport(ventas) {
  const productos = new Map();
  let ingresos = 0;
  let unidadesVendidas = 0;

  for (const venta of ventas) {
    ingresos += Number(venta.total);

    for (const detalle of venta.detalles) {
      unidadesVendidas += detalle.cantidad;
      const current = productos.get(detalle.idProducto) || {
        productoId: detalle.idProducto,
        nombre: detalle.producto?.nombre || 'Producto',
        cantidad: 0,
        ingresos: 0,
      };

      current.cantidad += detalle.cantidad;
      current.ingresos += Number(detalle.subtotal);
      productos.set(detalle.idProducto, current);
    }
  }

  return {
    totalVentas: ventas.length,
    ingresos,
    unidadesVendidas,
    ticketPromedio: ventas.length ? ingresos / ventas.length : 0,
    productosMasVendidos: Array.from(productos.values())
      .sort((a, b) => b.cantidad - a.cantidad || b.ingresos - a.ingresos)
      .slice(0, 10),
    ventas: ventas.map(mapVentaResumen),
  };
}

function buildInventarioReport(productos) {
  const stockBajo = productos.filter((producto) => producto.stock <= producto.stockMinimo);
  const valorInventario = productos.reduce((sum, producto) => sum + Number(producto.precio) * producto.stock, 0);

  return {
    totalProductos: productos.length,
    productosConStock: productos.filter((producto) => producto.stock > 0).length,
    productosSinStock: productos.filter((producto) => producto.stock === 0).length,
    productosStockBajo: stockBajo.length,
    valorInventario,
    stockBajo: stockBajo.map((producto) => ({
      id: producto.id,
      nombre: producto.nombre,
      marca: producto.marca,
      modelo: producto.modelo,
      stock: producto.stock,
      stockMinimo: producto.stockMinimo,
    })),
  };
}

async function getReporteServicios(query = {}, auth) {
  const { desde, hasta } = parseRange(query);
  const ordenes = await reporteRepository.listOrdenes(desde, hasta, getAuthBusinessId(auth));

  return buildServiciosReport(ordenes);
}

async function getReporteVentas(query = {}, auth) {
  const { desde, hasta } = parseRange(query);
  const ventas = await reporteRepository.listVentas(desde, hasta, getAuthBusinessId(auth));

  return buildVentasReport(ventas);
}

async function getReporteInventario(query = {}, auth) {
  const productos = await reporteRepository.listProductos(getAuthBusinessId(auth));

  return buildInventarioReport(productos);
}

async function getReporteResumen(query = {}, auth) {
  const { desde, hasta } = parseRange(query);
  const idNegocio = getAuthBusinessId(auth);
  const [totalClientes, totalEquipos, ordenes, ventas, productos, cotizaciones] = await Promise.all([
    reporteRepository.countClientes(idNegocio),
    reporteRepository.countEquipos(idNegocio),
    reporteRepository.listOrdenes(desde, hasta, idNegocio),
    reporteRepository.listVentas(desde, hasta, idNegocio),
    reporteRepository.listProductos(idNegocio),
    reporteRepository.listCotizaciones(desde, hasta, idNegocio),
  ]);

  const servicios = buildServiciosReport(ordenes);
  const ventasReport = buildVentasReport(ventas);
  const inventario = buildInventarioReport(productos);

  return {
    totalClientes,
    totalEquipos,
    totalOrdenes: servicios.totalOrdenes,
    totalCotizaciones: cotizaciones.length,
    totalVentas: ventasReport.totalVentas,
    ingresosVentas: ventasReport.ingresos,
    ordenesPorEstado: servicios.porEstado,
    productosStockBajo: inventario.productosStockBajo,
    valorInventario: inventario.valorInventario,
  };
}

module.exports = {
  getReporteResumen,
  getReporteServicios,
  getReporteVentas,
  getReporteInventario,
};
