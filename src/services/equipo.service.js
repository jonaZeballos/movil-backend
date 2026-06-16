const { randomUUID } = require('crypto');
const AppError = require('../utils/appError');
const clienteRepository = require('../repositories/cliente.repository');
const equipoRepository = require('../repositories/equipo.repository');
const notificacionService = require('./notificacion.service');

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

function normalizeReason(value, fallback) {
  return (optionalText(value) || fallback).slice(0, 300);
}

function getAuthBusinessId(auth) {
  return auth?.idNegocio || auth?.negocioId || null;
}

async function getOrCreateTipo(nombre) {
  const existingTipo = await equipoRepository.findTipoByName(nombre);
  if (existingTipo) {
    return existingTipo;
  }

  return equipoRepository.createTipo(randomUUID(), nombre);
}

async function getOrCreateMarca(nombre) {
  const existingMarca = await equipoRepository.findMarcaByName(nombre);
  if (existingMarca) {
    return existingMarca;
  }

  return equipoRepository.createMarca(randomUUID(), nombre);
}

async function getOrCreateModelo(nombreModelo, marca) {
  const existingModelo = await equipoRepository.findModeloByNameAndMarca(nombreModelo, marca.id);
  if (existingModelo) {
    return existingModelo;
  }

  return equipoRepository.createModelo({
    id: randomUUID(),
    nombreModelo,
    nombreComercial: nombreModelo,
    lanzamiento: new Date(),
    idMarca: marca.id,
  });
}

function mapEquipo(equipo) {
  return {
    id: equipo.id,
    clienteId: equipo.idCliente,
    clientName: equipo.cliente?.razonSocial || null,
    tipo: equipo.tipoEquipo?.nombre || null,
    type: equipo.tipoEquipo?.nombre || null,
    marca: equipo.modelo?.marca?.nombre || null,
    brand: equipo.modelo?.marca?.nombre || null,
    modelo: equipo.modelo?.nombreModelo || null,
    model: equipo.modelo?.nombreModelo || null,
    nroSerie: equipo.nroSerie,
    serial: equipo.nroSerie,
    fechaRegistro: equipo.fechaRegistro,
    activo: equipo.activo !== false,
    motivoBaja: equipo.motivoBaja || null,
    fechaBaja: equipo.fechaBaja || null,
    idNegocio: equipo.idNegocio || null,
  };
}

async function listEquipos(query = {}, auth) {
  const search = optionalText(query.buscar ?? query.search);
  const equipos = await equipoRepository.list(search, getAuthBusinessId(auth));

  return equipos.map(mapEquipo);
}

async function getEquipo(id, auth) {
  const equipo = await equipoRepository.findById(id, getAuthBusinessId(auth));
  if (!equipo) {
    throw new AppError('Equipo no encontrado', 404);
  }

  return mapEquipo(equipo);
}

async function createEquipo(payload, auth) {
  const clienteId = normalizeText(payload.clienteId ?? payload.idCliente, 'clienteId');
  const tipoNombre = normalizeText(payload.tipo ?? payload.type, 'tipo');
  const marcaNombre = normalizeText(payload.marca ?? payload.brand, 'marca');
  const modeloNombre = normalizeText(payload.modelo ?? payload.model, 'modelo');
  const serieIngresada = optionalText(payload.nroSerie ?? payload.serial);
  if (serieIngresada && serieIngresada.length < 3) {
    throw new AppError('El numero de serie debe tener al menos 3 caracteres', 400);
  }
  const nroSerie = serieIngresada || `SIN-SERIE-${randomUUID().slice(0, 8)}`;

  const idNegocio = getAuthBusinessId(auth);
  const cliente = await clienteRepository.findById(clienteId, idNegocio);
  if (!cliente) {
    throw new AppError('Cliente no encontrado', 404);
  }
  if (cliente.enListaNegra) {
    throw new AppError('El cliente esta en lista negra. Requiere revision del administrador.', 403);
  }

  const tipo = await getOrCreateTipo(tipoNombre);
  const marca = await getOrCreateMarca(marcaNombre);
  const modelo = await getOrCreateModelo(modeloNombre, marca);
  const equipo = await equipoRepository.createEquipo({
    id: randomUUID(),
    nroSerie,
    fechaRegistro: new Date(),
    idCliente: cliente.idUsuario,
    idTipoEquipo: tipo.id,
    idModelo: modelo.id,
    idNegocio,
  });

  await notificacionService.notifySystem({
    tipo: 'sistema',
    titulo: 'Equipo registrado',
    mensaje: `Se registro un equipo ${tipo.nombre} ${marca.nombre} ${modelo.nombreModelo}.`,
    referenciaId: equipo.id,
    referenciaTipo: 'equipo',
    idNegocio,
  });

  return mapEquipo(equipo);
}

async function darBajaEquipo(id, payload, auth) {
  const equipo = await equipoRepository.findById(id, getAuthBusinessId(auth));
  if (!equipo) {
    throw new AppError('Equipo no encontrado', 404);
  }

  const updatedEquipo = await equipoRepository.updateEquipo(id, {
    activo: false,
    motivoBaja: normalizeReason(payload?.motivo, 'Dado de baja por administrador'),
    fechaBaja: new Date(),
  });

  return mapEquipo(updatedEquipo);
}

async function restaurarEquipo(id, auth) {
  const equipo = await equipoRepository.findById(id, getAuthBusinessId(auth));
  if (!equipo) {
    throw new AppError('Equipo no encontrado', 404);
  }

  const updatedEquipo = await equipoRepository.updateEquipo(id, {
    activo: true,
    motivoBaja: null,
    fechaBaja: null,
  });

  return mapEquipo(updatedEquipo);
}

module.exports = {
  listEquipos,
  getEquipo,
  createEquipo,
  darBajaEquipo,
  restaurarEquipo,
};
