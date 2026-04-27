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

function parseCreationDate(value) {
  if (!value) {
    throw new AppError('El campo fechaCreacion es obligatorio', 400);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError('El campo fechaCreacion no tiene un formato valido', 400);
  }

  return date;
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
  const nombres = normalizeText(payload.nombres, 'nombres');
  const apellidos = normalizeText(payload.apellidos, 'apellidos');
  const username = normalizeText(payload.username, 'username');
  const email = normalizeText(payload.email, 'email');
  const password = normalizeText(payload.password, 'password');
  const fechaCreacion = parseCreationDate(payload.fechaCreacion);
  const numero = parsePhoneNumber(payload.numero);
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
  loginUsuario,
};
