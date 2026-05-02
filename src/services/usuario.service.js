const { randomUUID } = require('crypto');
const AppError = require('../utils/appError');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signToken } = require('../utils/token');
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

function parsePhoneNumber(value) {
  if (value === undefined || value === null || value === '') {
    throw new AppError('El campo numero es obligatorio', 400);
  }

  try {
    return BigInt(value);
  } catch (error) {
    throw new AppError('El campo numero debe ser numerico', 400);
  }
}

function parseDocumentNumber(value) {
  if (value === undefined || value === null || value === '') {
    throw new AppError('El campo numeroDocumento es obligatorio', 400);
  }

  try {
    return BigInt(value);
  } catch (error) {
    throw new AppError('El campo numeroDocumento debe ser numerico', 400);
  }
}

function parseCreationDate(value) {
  if (!value) {
    return new Date();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError('El campo fechaCreacion no tiene un formato valido', 400);
  }

  return date;
}

function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  const nombres = parts.slice(0, -1).join(' ') || parts[0];
  const apellidos = parts.length > 1 ? parts.slice(-1).join(' ') : '-';

  return { nombres, apellidos };
}

async function getRoleId(roleName) {
  if (!roleName) {
    return null;
  }

  const existingRole = await usuarioRepository.findRoleByName(roleName);
  if (existingRole) {
    return existingRole.id;
  }

  const createdRole = await usuarioRepository.createRole(randomUUID(), roleName);
  return createdRole.id;
}

async function registrarUsuarioConRol(payload, roleName) {
  const fullName = payload.name ? normalizeText(payload.name, 'name') : null;
  const splitFullName = fullName ? splitName(fullName) : null;
  const nombres = splitFullName?.nombres || normalizeText(payload.nombres, 'nombres');
  const apellidos = splitFullName?.apellidos || normalizeText(payload.apellidos, 'apellidos');
  const email = normalizeText(payload.email, 'email');
  const username = payload.username ? normalizeText(payload.username, 'username') : email.split('@')[0];
  const password = normalizeText(payload.password, 'password');
  const fechaCreacion = parseCreationDate(payload.fechaCreacion);
  const numero = parsePhoneNumber(payload.numero ?? payload.telefono ?? '0');
  const normalizedRoleName = roleName ? normalizeText(roleName, 'rol') : null;

  const userExists = await usuarioRepository.findByUsernameOrEmail(username, email);
  if (userExists) {
    throw new AppError('Ya existe un usuario con ese username o email', 409);
  }

  const idRol = await getRoleId(normalizedRoleName);

  const createdUser = await usuarioRepository.createUserWithPhone({
    id: randomUUID(),
    nombres,
    apellidos,
    username,
    email,
    password: hashPassword(password),
    fechaCreacion,
    idRol,
    telefonos: {
      create: {
        id: randomUUID(),
        numero,
      },
    },
  });

  return {
    ...createdUser,
    rol: createdUser.rol ? createdUser.rol.rol : null,
    numero: numero.toString(),
  };
}

async function registrarUsuario(payload) {
  const roleName = payload.rol ? normalizeText(payload.rol, 'rol') : null;
  return registrarUsuarioConRol(payload, roleName);
}

async function registrarUsuarioTecnico(payload) {
  return registrarUsuarioConRol(payload, 'tecnico');
}

async function registrarUsuarioVentas(payload) {
  return registrarUsuarioConRol(payload, 'ventas');
}

function mapUsuario(user) {
  return {
    id: user.id,
    nombres: user.nombres,
    apellidos: user.apellidos,
    name: [user.nombres, user.apellidos].filter(Boolean).join(' ').trim(),
    username: user.username,
    email: user.email,
    fechaCreacion: user.fechaCreacion,
    rol: user.rol ? user.rol.rol : null,
    role: user.rol ? user.rol.rol : null,
  };
}

async function listarUsuarios() {
  const usuarios = await usuarioRepository.listUsers();
  return usuarios.map(mapUsuario);
}

async function registrarUsuarioCliente(payload) {
  const nombres = normalizeText(payload.nombres, 'nombres');
  const apellidos = normalizeText(payload.apellidos, 'apellidos');
  const username = normalizeText(payload.username, 'username');
  const email = normalizeText(payload.email, 'email');
  const password = normalizeText(payload.password, 'password');
  const fechaCreacion = parseCreationDate(payload.fechaCreacion);
  const numero = parsePhoneNumber(payload.numero);
  const razonSocial = normalizeText(payload.razonSocial, 'razonSocial');
  const numeroDocumento = parseDocumentNumber(payload.numeroDocumento);

  const [existingUser, existingClient] = await Promise.all([
    usuarioRepository.findByUsernameOrEmail(username, email),
    usuarioRepository.findClientByDocumentNumber(numeroDocumento),
  ]);

  if (existingUser) {
    throw new AppError('Ya existe un usuario con ese username o email', 409);
  }

  if (existingClient) {
    throw new AppError('Ya existe un cliente con ese numeroDocumento', 409);
  }

  const idRol = await getRoleId('cliente');

  const createdUser = await usuarioRepository.createClientUser({
    id: randomUUID(),
    nombres,
    apellidos,
    username,
    email,
    password: hashPassword(password),
    fechaCreacion,
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

  return {
    id: createdUser.id,
    nombres: createdUser.nombres,
    apellidos: createdUser.apellidos,
    username: createdUser.username,
    email: createdUser.email,
    fechaCreacion: createdUser.fechaCreacion,
    rol: createdUser.rol ? createdUser.rol.rol : null,
    numero: numero.toString(),
    razonSocial: createdUser.cliente ? createdUser.cliente.razonSocial : null,
    numeroDocumento: createdUser.cliente ? createdUser.cliente.numeroDocumento.toString() : null,
  };
}

async function loginUsuario(payload) {
  const identifier = normalizeText(payload.usuario ?? payload.username ?? payload.email, 'usuario');
  const password = normalizeText(payload.password, 'password');

  const user = await usuarioRepository.findByUsernameOrEmailForLogin(identifier);
  if (!user || !verifyPassword(password, user.password)) {
    throw new AppError('Usuario o password incorrectos', 401);
  }

  const tipoUsuario = user.rol ? user.rol.rol : null;
  const usuario = {
    id: user.id,
    nombres: user.nombres,
    apellidos: user.apellidos,
    username: user.username,
    email: user.email,
    fechaCreacion: user.fechaCreacion,
    tipoUsuario,
    rol: tipoUsuario,
  };

  const token = signToken({
    sub: user.id,
    username: user.username,
    email: user.email,
    tipoUsuario,
    rol: tipoUsuario,
  });

  return {
    token,
    usuario,
  };
}

module.exports = {
  registrarUsuario,
  registrarUsuarioTecnico,
  registrarUsuarioVentas,
  listarUsuarios,
  registrarUsuarioCliente,
  loginUsuario,
};
