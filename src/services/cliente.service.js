const { randomUUID } = require('crypto');
const AppError = require('../utils/appError');
const { hashPassword } = require('../utils/password');
const clienteRepository = require('../repositories/cliente.repository');
const usuarioRepository = require('../repositories/usuario.repository');

function normalizeText(value, fieldName) {
  if (typeof value !== 'string') {
    throw new AppError(`El campo ${fieldName} es obligatorio`, 400);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new AppError(`El campo ${fieldName} es obligatorio`, 400);
  }

  return normalized;
}

function optionalText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeReason(value) {
  const reason = optionalText(value);
  if (!reason) {
    throw new AppError('Debe indicar el motivo', 400);
  }

  return reason.slice(0, 300);
}

function getAuthBusinessId(auth) {
  return auth?.idNegocio || auth?.negocioId || null;
}

function requireAuthBusinessId(auth) {
  const idNegocio = getAuthBusinessId(auth);
  if (!idNegocio) {
    throw new AppError('No se pudo identificar el negocio del usuario autenticado', 401);
  }

  return idNegocio;
}

function parseBigInt(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    throw new AppError(`El campo ${fieldName} es obligatorio`, 400);
  }

  const digits = String(value).replace(/\D/g, '');
  if (!digits) {
    throw new AppError(`El campo ${fieldName} debe ser numerico`, 400);
  }

  try {
    return BigInt(digits);
  } catch (error) {
    throw new AppError(`El campo ${fieldName} debe ser numerico`, 400);
  }
}

function parseSearchDocument(value) {
  if (!value) {
    return null;
  }

  const digits = String(value).replace(/\D/g, '');
  return digits ? BigInt(digits) : null;
}

async function getRoleId(roleName) {
  const existingRole = await usuarioRepository.findRoleByName(roleName);
  if (existingRole) {
    return existingRole.id;
  }

  const createdRole = await usuarioRepository.createRole(randomUUID(), roleName);
  return createdRole.id;
}

function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  const nombres = parts.slice(0, -1).join(' ') || parts[0];
  const apellidos = parts.length > 1 ? parts.slice(-1).join(' ') : '-';

  return { nombres, apellidos };
}

function mapClient(cliente) {
  const telefono = cliente.usuario?.telefonos?.[0]?.numero;

  return {
    id: cliente.idUsuario,
    razonSocial: cliente.razonSocial,
    nombre: cliente.razonSocial,
    nombres: cliente.usuario?.nombres || null,
    apellidos: cliente.usuario?.apellidos || null,
    username: cliente.usuario?.username || null,
    numeroDocumento: cliente.numeroDocumento.toString(),
    email: cliente.email || cliente.usuario?.email || null,
    telefono: telefono ? telefono.toString() : null,
    direccion: cliente.direccion || null,
    enListaNegra: Boolean(cliente.enListaNegra),
    motivoListaNegra: cliente.motivoListaNegra || null,
    fechaListaNegra: cliente.fechaListaNegra || null,
    idNegocio: cliente.idNegocio || cliente.usuario?.idNegocio || null,
  };
}

function validateDigits(value, fieldName, minLength, maxLength) {
  const raw = String(value ?? '').trim();
  if (!raw) {
    throw new AppError(`El campo ${fieldName} es obligatorio`, 400);
  }

  if (!/^\d+$/.test(raw)) {
    throw new AppError(`El campo ${fieldName} debe contener solo numeros`, 400);
  }

  if (raw.length < minLength || raw.length > maxLength) {
    throw new AppError(`El campo ${fieldName} tiene una longitud invalida`, 400);
  }

  return raw;
}

function mapCotizacion(cotizacion) {
  return {
    id: cotizacion.id,
    numero: `COT-${String(cotizacion.numero).padStart(4, '0')}`,
    numeroInterno: cotizacion.numero,
    descripcion: cotizacion.descripcion,
    manoObra: Number(cotizacion.manoObra),
    repuestos: Number(cotizacion.repuestos),
    descuento: Number(cotizacion.descuento),
    total: Number(cotizacion.total),
    observaciones: cotizacion.observaciones,
    estado: cotizacion.estado,
    fechaCreacion: cotizacion.fechaCreacion,
  };
}

function mapOrdenHistorial(orden) {
  const tecnicoNombre = orden.tecnico
    ? [orden.tecnico.nombres, orden.tecnico.apellidos].filter(Boolean).join(' ').trim()
    : null;

  return {
    id: orden.id,
    codigo: orden.codigo,
    code: `#${String(orden.codigo).padStart(4, '0')}`,
    diagnostico: orden.diagnostico,
    failure: orden.diagnostico,
    estado: orden.estado?.nombre || null,
    status: orden.estado?.nombre || null,
    prioridad: orden.prioridad?.prioridad || null,
    garantiaDias: orden.garantiaDias,
    fechaRecepcion: orden.fechaRecepcion,
    fechaEntrega: orden.fechaEntrega,
    observacionesTexto: orden.observaciones || null,
    observaciones: orden.observaciones ? orden.observaciones.split('\n').filter(Boolean) : [],
    tecnico: orden.tecnico
      ? {
          id: orden.tecnico.id,
          nombre: tecnicoNombre,
          username: orden.tecnico.username,
          email: orden.tecnico.email,
        }
      : null,
    cotizaciones: orden.cotizaciones.map(mapCotizacion),
  };
}

function mapEquipoHistorial(equipo) {
  return {
    id: equipo.id,
    tipo: equipo.tipoEquipo?.nombre || null,
    marca: equipo.modelo?.marca?.nombre || null,
    modelo: equipo.modelo?.nombreModelo || null,
    nombre: `${equipo.tipoEquipo?.nombre || ''} ${equipo.modelo?.marca?.nombre || ''} ${equipo.modelo?.nombreModelo || ''}`.trim(),
    nroSerie: equipo.nroSerie,
    serial: equipo.nroSerie,
    fechaRegistro: equipo.fechaRegistro,
    ordenes: equipo.ordenes.map(mapOrdenHistorial),
  };
}

function mapVentaHistorial(venta) {
  return {
    id: venta.id,
    numero: venta.numero,
    codigo: venta.reciboCodigo,
    reciboCodigo: venta.reciboCodigo,
    clienteNombre: venta.clienteNombre,
    total: Number(venta.total),
    fechaCreacion: venta.fechaCreacion,
    detalles: venta.detalles.map((detalle) => ({
      id: detalle.id,
      productoId: detalle.idProducto,
      nombre: detalle.producto?.nombre || null,
      cantidad: detalle.cantidad,
      precioUnitario: Number(detalle.precioUnitario),
      subtotal: Number(detalle.subtotal),
    })),
  };
}

function mapHistorialCliente(cliente) {
  const equipos = cliente.equipos.map(mapEquipoHistorial);
  const ordenes = equipos.flatMap((equipo) =>
    equipo.ordenes.map((orden) => ({
      ...orden,
      equipo: {
        id: equipo.id,
        nombre: equipo.nombre,
        tipo: equipo.tipo,
        marca: equipo.marca,
        modelo: equipo.modelo,
        nroSerie: equipo.nroSerie,
      },
    })),
  );
  const cotizaciones = ordenes.flatMap((orden) =>
    orden.cotizaciones.map((cotizacion) => ({
      ...cotizacion,
      ordenId: orden.id,
      ordenCodigo: orden.code,
      equipo: orden.equipo,
    })),
  );
  const ventas = cliente.ventas.map(mapVentaHistorial);

  return {
    cliente: mapClient(cliente),
    resumen: {
      totalEquipos: equipos.length,
      totalOrdenes: ordenes.length,
      totalCotizaciones: cotizaciones.length,
      totalVentas: ventas.length,
      totalGastado: ventas.reduce((sum, venta) => sum + venta.total, 0),
    },
    equipos,
    ordenes,
    cotizaciones,
    ventas,
  };
}

async function listClientes(query = {}, auth) {
  const idNegocio = requireAuthBusinessId(auth);
  const search = optionalText(query.buscar ?? query.search);
  const rawDocument = optionalText(query.numeroDocumento);
  const documentNumber = rawDocument ? parseBigInt(rawDocument, 'numeroDocumento') : null;
  const searchDocumentNumber = parseSearchDocument(search);
  const clientes = await clienteRepository.list(search, documentNumber, searchDocumentNumber, idNegocio);

  return clientes.map(mapClient);
}

async function getCliente(id, auth) {
  const cliente = await clienteRepository.findById(id, requireAuthBusinessId(auth));
  if (!cliente) {
    throw new AppError('Cliente no encontrado', 404);
  }

  return mapClient(cliente);
}

async function getHistorialCliente(id, auth) {
  const cliente = await clienteRepository.findHistorialById(id, requireAuthBusinessId(auth));
  if (!cliente) {
    throw new AppError('Cliente no encontrado', 404);
  }

  return mapHistorialCliente(cliente);
}

async function createCliente(payload, auth) {
  const nombresInput = optionalText(payload.nombres);
  const apellidosInput = optionalText(payload.apellidos);
  const razonSocial = normalizeText(
    payload.razonSocial ?? payload.nombre ?? [nombresInput, apellidosInput].filter(Boolean).join(' '),
    'razonSocial',
  );
  if (razonSocial.length < 3) {
    throw new AppError('Ingrese el nombre completo del cliente', 400);
  }

  const rawDocumento = validateDigits(payload.numeroDocumento, 'numeroDocumento', 5, 15);
  const rawNumero = validateDigits(payload.numero ?? payload.telefono, 'numero', 8, 8);
  const numeroDocumento = parseBigInt(rawDocumento, 'numeroDocumento');
  const numero = parseBigInt(rawNumero, 'numero');
  const email = optionalText(payload.email ?? payload.correo) || `cliente-${numeroDocumento.toString()}@servitech.local`;
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new AppError('Ingrese un correo valido', 400);
  }
  const direccion = optionalText(payload.direccion ?? payload.address ?? payload.domicilio);
  if (direccion && direccion.length < 5) {
    throw new AppError('La direccion debe tener al menos 5 caracteres', 400);
  }
  const idNegocio = requireAuthBusinessId(auth);
  const clienteUserKey = `${idNegocio.slice(0, 8)}-${numeroDocumento.toString()}`;
  const username = `cliente-${clienteUserKey}`;
  const internalEmail = `cliente-${clienteUserKey}@servitech.local`;
  const password = optionalText(payload.password) || randomUUID();
  const split = splitName(razonSocial);
  const nombres = nombresInput || split.nombres;
  const apellidos = apellidosInput || split.apellidos;

  const existingClient = await clienteRepository.findByDocumentNumber(numeroDocumento, idNegocio);
  if (existingClient) {
    throw new AppError('Ya existe un cliente con ese documento en este negocio.', 409);
  }

  const existingClientEmail = await clienteRepository.findByEmail(email, idNegocio);
  if (existingClientEmail) {
    throw new AppError('Ya existe un cliente con ese correo en este negocio.', 409);
  }

  const existingUser = await usuarioRepository.findByUsernameOrEmail(username, internalEmail);
  if (existingUser) {
    throw new AppError('Ya existe un cliente con ese documento en este negocio.', 409);
  }

  const idRol = await getRoleId('cliente');
  const createdClient = await clienteRepository.createClientUser({
    id: randomUUID(),
    nombres,
    apellidos,
    username,
    email: internalEmail,
    password: hashPassword(password),
    fechaCreacion: new Date(),
    idRol,
    idNegocio,
    telefonos: {
      create: {
        id: randomUUID(),
        numero,
      },
    },
    cliente: {
      create: {
        razonSocial,
        numeroDocumento,
        email,
        direccion,
        idNegocio,
      },
    },
  });

  return mapClient({
    ...createdClient.cliente,
    usuario: createdClient,
  });
}

async function agregarClienteListaNegra(id, payload, auth) {
  const idNegocio = requireAuthBusinessId(auth);
  const cliente = await clienteRepository.findById(id, idNegocio);
  if (!cliente) {
    throw new AppError('Cliente no encontrado', 404);
  }

  const updatedCliente = await clienteRepository.updateCliente(id, {
    enListaNegra: true,
    motivoListaNegra: normalizeReason(payload?.motivo),
    fechaListaNegra: new Date(),
  });

  return mapClient(updatedCliente);
}

async function quitarClienteListaNegra(id, auth) {
  const idNegocio = requireAuthBusinessId(auth);
  const cliente = await clienteRepository.findById(id, idNegocio);
  if (!cliente) {
    throw new AppError('Cliente no encontrado', 404);
  }

  const updatedCliente = await clienteRepository.updateCliente(id, {
    enListaNegra: false,
    motivoListaNegra: null,
    fechaListaNegra: null,
  });

  return mapClient(updatedCliente);
}

module.exports = {
  listClientes,
  getCliente,
  getHistorialCliente,
  createCliente,
  agregarClienteListaNegra,
  quitarClienteListaNegra,
};
