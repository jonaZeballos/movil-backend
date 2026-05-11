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
    email: cliente.usuario?.email || null,
    telefono: telefono ? telefono.toString() : null,
  };
}

async function listClientes(query = {}) {
  const search = optionalText(query.buscar ?? query.search);
  const rawDocument = optionalText(query.numeroDocumento);
  const documentNumber = rawDocument ? parseBigInt(rawDocument, 'numeroDocumento') : null;
  const searchDocumentNumber = parseSearchDocument(search);
  const clientes = await clienteRepository.list(search, documentNumber, searchDocumentNumber);

  return clientes.map(mapClient);
}

async function getCliente(id) {
  const cliente = await clienteRepository.findById(id);
  if (!cliente) {
    throw new AppError('Cliente no encontrado', 404);
  }

  return mapClient(cliente);
}

async function createCliente(payload) {
  const razonSocial = normalizeText(payload.razonSocial ?? payload.nombre, 'razonSocial');
  const numeroDocumento = parseBigInt(payload.numeroDocumento, 'numeroDocumento');
  const numero = parseBigInt(payload.numero ?? payload.telefono, 'numero');
  const email = optionalText(payload.email ?? payload.correo) || `cliente-${numeroDocumento.toString()}@servitech.local`;
  const username = optionalText(payload.username) || `cliente-${numeroDocumento.toString()}`;
  const password = optionalText(payload.password) || randomUUID();
  const { nombres, apellidos } = splitName(razonSocial);

  const existingClient = await clienteRepository.findByDocumentNumber(numeroDocumento);
  if (existingClient) {
    throw new AppError('Ya existe un cliente con ese numeroDocumento', 409);
  }

  const existingUser = await usuarioRepository.findByUsernameOrEmail(username, email);
  if (existingUser) {
    throw new AppError('Ya existe un usuario con ese username o email', 409);
  }

  const idRol = await getRoleId('cliente');
  const createdClient = await clienteRepository.createClientUser({
    id: randomUUID(),
    nombres,
    apellidos,
    username,
    email,
    password: hashPassword(password),
    fechaCreacion: new Date(),
    idRol,
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
      },
    },
  });

  return mapClient({
    ...createdClient.cliente,
    usuario: createdClient,
  });
}

module.exports = {
  listClientes,
  getCliente,
  createCliente,
};
