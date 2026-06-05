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

function toNumber(value) {
  return Number(value || 0);
}

function toText(value) {
  return value === undefined || value === null ? null : String(value);
}

function mapCliente(cliente, fallbackName = null) {
  if (!cliente) {
    return fallbackName
      ? {
          id: null,
          nombre: fallbackName,
          razonSocial: fallbackName,
          numeroDocumento: null,
          telefono: null,
          email: null,
          correo: null,
        }
      : null;
  }

  const email = cliente.email || cliente.correo || cliente.usuario?.email || null;
  const telefono = cliente.usuario?.telefonos?.[0]?.numero;
  const nombre = cliente.razonSocial || [cliente.nombres, cliente.apellidos].filter(Boolean).join(' ').trim() || fallbackName;

  return {
    id: cliente.idUsuario || cliente.id || null,
    nombre,
    razonSocial: cliente.razonSocial || nombre,
    nombres: cliente.nombres || null,
    apellidos: cliente.apellidos || null,
    numeroDocumento: toText(cliente.numeroDocumento),
    telefono: telefono ? telefono.toString() : cliente.telefono || null,
    email,
    correo: email,
  };
}

function mapEquipo(equipo) {
  if (!equipo) return null;

  const marca = equipo.modelo?.marca?.nombre || null;
  const modelo = equipo.modelo?.nombreModelo || equipo.modelo?.nombreComercial || null;
  const tipo = equipo.tipoEquipo?.nombre || null;
  const nombre = [tipo, marca, modelo].filter(Boolean).join(' ').trim();

  return {
    id: equipo.id,
    nombre: nombre || 'Equipo',
    tipo,
    marca,
    modelo,
    nroSerie: equipo.nroSerie || null,
    serial: equipo.nroSerie || null,
    fechaRegistro: equipo.fechaRegistro || null,
  };
}

function mapCotizacion(cotizacion) {
  return {
    id: cotizacion.id,
    numero: cotizacion.numero,
    codigo: `COT-${String(cotizacion.numero).padStart(4, '0')}`,
    descripcion: cotizacion.descripcion || null,
    manoObra: toNumber(cotizacion.manoObra),
    repuestos: toNumber(cotizacion.repuestos),
    descuento: toNumber(cotizacion.descuento),
    total: toNumber(cotizacion.total),
    estado: cotizacion.estado || null,
    observaciones: cotizacion.observaciones || null,
    fechaCreacion: cotizacion.fechaCreacion,
  };
}

function mapOrdenResumen(orden) {
  const equipo = orden.equipo;
  const cliente = mapCliente(equipo?.cliente);
  const cotizaciones = orden.cotizaciones.map(mapCotizacion);

  return {
    id: orden.id,
    codigo: orden.codigo,
    code: `#${String(orden.codigo).padStart(4, '0')}`,
    cliente,
    clienteNombre: cliente?.razonSocial || cliente?.nombre || 'Cliente no registrado',
    equipo: mapEquipo(equipo),
    equipoNombre: mapEquipo(equipo)?.nombre || null,
    diagnostico: orden.diagnostico,
    descripcion: orden.observaciones || orden.diagnostico,
    observaciones: orden.observaciones || null,
    estado: orden.estado?.nombre || null,
    status: orden.estado?.nombre || null,
    prioridad: orden.prioridad?.prioridad || null,
    fechaRecepcion: orden.fechaRecepcion,
    fechaEntrega: orden.fechaEntrega,
    createdAt: orden.fechaRecepcion,
    updatedAt: orden.fechaEntrega || orden.fechaRecepcion,
    garantiaDias: orden.garantiaDias,
    tecnico: orden.tecnico
      ? {
          id: orden.tecnico.id,
          nombre: orden.tecnico.nombre || orden.tecnico.email || 'Tecnico',
          email: orden.tecnico.email || null,
        }
      : null,
    cotizaciones,
    totalCotizado: cotizaciones.reduce((sum, cotizacion) => sum + cotizacion.total, 0),
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
    totalCotizado += orden.cotizaciones.reduce((sum, cotizacion) => sum + toNumber(cotizacion.total), 0);

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

function mapDetalleVenta(detalle) {
  const cantidad = Number(detalle.cantidad || 0);
  const precioUnitario = toNumber(detalle.precioUnitario);
  const subtotal = toNumber(detalle.subtotal || cantidad * precioUnitario);

  return {
    id: detalle.id,
    productoId: detalle.idProducto,
    nombre: detalle.producto?.nombre || 'Producto',
    producto: detalle.producto
      ? {
          id: detalle.producto.id,
          nombre: detalle.producto.nombre,
          marca: detalle.producto.marca || null,
          modelo: detalle.producto.modelo || null,
          categoria: detalle.producto.categoria || null,
          tipoInventario: detalle.producto.tipoInventario || null,
        }
      : null,
    cantidad,
    quantity: cantidad,
    precioUnitario,
    unitPrice: precioUnitario,
    subtotal,
    total: subtotal,
  };
}

function mapVentaResumen(venta) {
  const productos = venta.detalles.map(mapDetalleVenta);
  const subtotal = productos.reduce((sum, detalle) => sum + detalle.subtotal, 0);
  const total = toNumber(venta.total);
  const descuento = Math.max(subtotal - total, 0);
  const cliente = mapCliente(venta.cliente, venta.clienteNombre || 'Cliente mostrador');

  return {
    id: venta.id,
    numero: venta.numero,
    number: venta.reciboCodigo || venta.numero,
    codigo: venta.reciboCodigo,
    reciboCodigo: venta.reciboCodigo,
    recibo: {
      codigo: venta.reciboCodigo,
      numero: venta.numero,
      fecha: venta.fechaCreacion,
      estado: 'Emitido',
    },
    clienteId: venta.idCliente,
    cliente,
    clienteNombre: cliente?.razonSocial || cliente?.nombre || venta.clienteNombre || 'Cliente mostrador',
    metodoPago: venta.metodoPago || null,
    subtotal,
    descuento,
    total,
    fechaCreacion: venta.fechaCreacion,
    issuedAt: venta.fechaCreacion,
    createdAt: venta.fechaCreacion,
    productos,
    detalles: productos,
    totalProductos: productos.reduce((sum, detalle) => sum + detalle.cantidad, 0),
  };
}

function buildVentasReport(ventas) {
  const productos = new Map();
  const metodosPago = {};
  let ingresos = 0;
  let unidadesVendidas = 0;

  for (const venta of ventas) {
    ingresos += toNumber(venta.total);
    incrementCounter(metodosPago, venta.metodoPago || 'No registrado');

    for (const detalle of venta.detalles) {
      const cantidad = Number(detalle.cantidad || 0);
      const subtotal = toNumber(detalle.subtotal);
      unidadesVendidas += cantidad;
      const current = productos.get(detalle.idProducto) || {
        productoId: detalle.idProducto,
        nombre: detalle.producto?.nombre || 'Producto',
        cantidad: 0,
        ingresos: 0,
      };

      current.cantidad += cantidad;
      current.ingresos += subtotal;
      productos.set(detalle.idProducto, current);
    }
  }

  return {
    totalVentas: ventas.length,
    ingresos,
    unidadesVendidas,
    ticketPromedio: ventas.length ? ingresos / ventas.length : 0,
    metodosPago,
    productosMasVendidos: Array.from(productos.values())
      .sort((a, b) => b.cantidad - a.cantidad || b.ingresos - a.ingresos)
      .slice(0, 10),
    ventas: ventas.map(mapVentaResumen),
  };
}

function buildInventarioReport(productos) {
  const stockBajo = productos.filter((producto) => producto.stock <= producto.stockMinimo);
  const valorInventario = productos.reduce((sum, producto) => sum + toNumber(producto.precio) * producto.stock, 0);

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
