const { randomUUID } = require('crypto');
const AppError = require('../utils/appError');
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

async function registrarUsuario(payload) {
  const nombres = normalizeText(payload.nombres, 'nombres');
  const apellidos = normalizeText(payload.apellidos, 'apellidos');
  const username = normalizeText(payload.username, 'username');
  const email = normalizeText(payload.email, 'email');
  const password = normalizeText(payload.password, 'password');
  const fechaCreacion = parseCreationDate(payload.fechaCreacion);
  const numero = parsePhoneNumber(payload.numero);
  const roleName = payload.rol ? normalizeText(payload.rol, 'rol') : null;

  const userExists = await usuarioRepository.findByUsernameOrEmail(username, email);
  if (userExists) {
    throw new AppError('Ya existe un usuario con ese username o email', 409);
  }

  const idRol = await getRoleId(roleName);

  const createdUser = await usuarioRepository.createUserWithPhone({
    id: randomUUID(),
    nombres,
    apellidos,
    username,
    email,
    password,
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

module.exports = {
  registrarUsuario,
};
