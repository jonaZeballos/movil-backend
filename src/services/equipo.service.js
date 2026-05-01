const { randomUUID } = require('crypto');
const AppError = require('../utils/appError');
const clienteRepository = require('../repositories/cliente.repository');
const equipoRepository = require('../repositories/equipo.repository');

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
  };
}

async function listEquipos(query = {}) {
  const search = optionalText(query.buscar ?? query.search);
  const equipos = await equipoRepository.list(search);

  return equipos.map(mapEquipo);
}

async function getEquipo(id) {
  const equipo = await equipoRepository.findById(id);
  if (!equipo) {
    throw new AppError('Equipo no encontrado', 404);
  }

  return mapEquipo(equipo);
}

async function createEquipo(payload) {
  const clienteId = normalizeText(payload.clienteId ?? payload.idCliente, 'clienteId');
  const tipoNombre = normalizeText(payload.tipo ?? payload.type, 'tipo');
  const marcaNombre = normalizeText(payload.marca ?? payload.brand, 'marca');
  const modeloNombre = normalizeText(payload.modelo ?? payload.model, 'modelo');
  const nroSerie = normalizeText(payload.nroSerie ?? payload.serial, 'nroSerie');

  const cliente = await clienteRepository.findById(clienteId);
  if (!cliente) {
    throw new AppError('Cliente no encontrado', 404);
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
  });

  return mapEquipo(equipo);
}

module.exports = {
  listEquipos,
  getEquipo,
  createEquipo,
};
