const { randomUUID } = require('crypto');
const AppError = require('../utils/appError');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signToken } = require('../utils/token');
const usuarioRepository = require('../repositories/usuario.repository');

const PERSON_NAME_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;

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

function optionalReason(value, fallback) {
  if (typeof value !== 'string' || !value.trim()) {
    return fallback;
  }

  return value.trim().slice(0, 300);
}

function normalizePersonName(value, fieldName) {
  const normalized = normalizeText(value, fieldName).replace(/\s+/g, ' ');
  if (!PERSON_NAME_REGEX.test(normalized)) {
    throw new AppError(`El campo ${fieldName} solo permite letras y espacios`, 400);
  }

  return normalized;
}

function normalizeEmail(value) {
  const email = normalizeText(value, 'email').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError('El campo email no tiene un formato valido', 400);
  }

  return email;
}

function normalizeUsername(value) {
  const username = normalizeText(value, 'username');
  if (!/^[a-zA-Z0-9._-]{3,30}$/.test(username)) {
    throw new AppError(
      'El campo username debe tener 3 a 30 caracteres y solo letras, numeros, punto, guion o guion bajo',
      400,
    );
  }

  return username;
}

function normalizePassword(value) {
  const password = normalizeText(value, 'password');
  if (password.length < 6) {
    throw new AppError('El campo password debe tener al menos 6 caracteres', 400);
  }

  return password;
}

function parsePhoneNumber(value) {
  if (value === undefined || value === null || value === '') {
    throw new AppError('El campo numero es obligatorio', 400);
  }

  const digits = String(value).replace(/\D/g, '');
  if (!digits) {
    throw new AppError('El campo numero debe ser numerico', 400);
  }

  return BigInt(digits);
}

function parseDocumentNumber(value) {
  if (value === undefined || value === null || value === '') {
    throw new AppError('El campo numeroDocumento es obligatorio', 400);
  }

  const digits = String(value).replace(/\D/g, '');
  if (!digits) {
    throw new AppError('El campo numeroDocumento debe ser numerico', 400);
  }

  return BigInt(digits);
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

function getAuthBusinessId(auth) {
  return auth?.idNegocio || auth?.negocioId || null;
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
  const fullName = payload.name ? normalizePersonName(payload.name, 'name') : null;
  const splitFullName = fullName ? splitName(fullName) : null;
  const nombres = splitFullName?.nombres || normalizePersonName(payload.nombres, 'nombres');
  const apellidos = splitFullName?.apellidos || normalizePersonName(payload.apellidos, 'apellidos');
  const email = normalizeEmail(payload.email);
  const username = payload.username ? normalizeUsername(payload.username) : normalizeUsername(email.split('@')[0]);
  const password = normalizePassword(payload.password);
  const fechaCreacion = parseCreationDate(payload.fechaCreacion);
  const numero = parsePhoneNumber(payload.numero ?? payload.telefono ?? '0');
  const normalizedRoleName = roleName ? normalizeText(roleName, 'rol') : null;
  const idNegocio = payload.idNegocio || null;

  if (!idNegocio) {
    throw new AppError('No se pudo identificar el negocio del usuario autenticado', 401);
  }

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
    idNegocio,
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
    idNegocio: createdUser.idNegocio,
    negocio: createdUser.negocio || null,
    numero: numero.toString(),
  };
}

async function registrarUsuario(payload) {
  const fullName = payload.name ? normalizePersonName(payload.name, 'name') : null;
  const splitFullName = fullName ? splitName(fullName) : null;
  const nombres = splitFullName?.nombres || normalizePersonName(payload.nombres, 'nombres');
  const apellidos = splitFullName?.apellidos || normalizePersonName(payload.apellidos, 'apellidos');
  const email = normalizeEmail(payload.email);
  const username = payload.username ? normalizeUsername(payload.username) : normalizeUsername(email.split('@')[0]);
  const password = normalizePassword(payload.password);
  const fechaCreacion = parseCreationDate(payload.fechaCreacion);
  const numero = parsePhoneNumber(payload.numero ?? payload.telefono ?? '0');
  const negocioNombre = payload.negocioNombre
    ? normalizeText(payload.negocioNombre, 'negocioNombre')
    : `${nombres} ${apellidos}`.trim() || username;

  const userExists = await usuarioRepository.findByUsernameOrEmail(username, email);
  if (userExists) {
    throw new AppError('Ya existe un usuario con ese username o email', 409);
  }

  const idRol = await getRoleId('admin');
  const idNegocio = randomUUID();
  const createdBusiness = await usuarioRepository.createBusinessWithOwner({
    negocio: {
      id: idNegocio,
      nombre: negocioNombre,
      fechaCreacion: new Date(),
    },
    usuario: {
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
    },
  });
  const createdUser = createdBusiness.usuarios[0];

  return {
    id: createdUser.id,
    nombres: createdUser.nombres,
    apellidos: createdUser.apellidos,
    username: createdUser.username,
    email: createdUser.email,
    fechaCreacion: createdUser.fechaCreacion,
    rol: createdUser.rol ? createdUser.rol.rol : null,
    idNegocio: createdBusiness.id,
    negocio: {
      id: createdBusiness.id,
      nombre: createdBusiness.nombre,
    },
    numero: numero.toString(),
  };
}

async function registrarUsuarioTecnico(payload, auth) {
  return registrarUsuarioConRol({ ...payload, idNegocio: getAuthBusinessId(auth) }, 'tecnico');
}

async function registrarUsuarioVentas(payload, auth) {
  return registrarUsuarioConRol({ ...payload, idNegocio: getAuthBusinessId(auth) }, 'ventas');
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
    bloqueado: Boolean(user.bloqueado),
    motivoBloqueo: user.motivoBloqueo || null,
    fechaBloqueo: user.fechaBloqueo || null,
    rol: user.rol ? user.rol.rol : null,
    role: user.rol ? user.rol.rol : null,
    idNegocio: user.idNegocio,
  };
}

async function listarUsuarios(auth) {
  const idNegocio = getAuthBusinessId(auth);
  if (!idNegocio) {
    throw new AppError('No se pudo identificar el negocio del usuario autenticado', 401);
  }

  const usuarios = await usuarioRepository.listUsers(idNegocio);
  return usuarios.map(mapUsuario);
}

async function bloquearUsuario(id, payload, auth) {
  const idNegocio = getAuthBusinessId(auth);
  if (!idNegocio) {
    throw new AppError('No se pudo identificar el negocio del usuario autenticado', 401);
  }

  if (auth?.sub === id) {
    throw new AppError('No puedes bloquear tu propio usuario', 400);
  }

  const usuario = await usuarioRepository.findUserById(id, idNegocio);
  if (!usuario || usuario.cliente) {
    throw new AppError('Usuario no encontrado', 404);
  }

  const updatedUser = await usuarioRepository.updateUser(id, {
    bloqueado: true,
    motivoBloqueo: optionalReason(payload?.motivo, 'Bloqueado por administrador'),
    fechaBloqueo: new Date(),
  });

  return mapUsuario(updatedUser);
}

async function desbloquearUsuario(id, auth) {
  const idNegocio = getAuthBusinessId(auth);
  if (!idNegocio) {
    throw new AppError('No se pudo identificar el negocio del usuario autenticado', 401);
  }

  const usuario = await usuarioRepository.findUserById(id, idNegocio);
  if (!usuario || usuario.cliente) {
    throw new AppError('Usuario no encontrado', 404);
  }

  const updatedUser = await usuarioRepository.updateUser(id, {
    bloqueado: false,
    motivoBloqueo: null,
    fechaBloqueo: null,
  });

  return mapUsuario(updatedUser);
}

async function registrarUsuarioCliente(payload, auth) {
  const nombres = normalizePersonName(payload.nombres, 'nombres');
  const apellidos = normalizePersonName(payload.apellidos, 'apellidos');
  const username = normalizeUsername(payload.username);
  const email = normalizeEmail(payload.email);
  const password = normalizePassword(payload.password);
  const fechaCreacion = parseCreationDate(payload.fechaCreacion);
  const numero = parsePhoneNumber(payload.numero);
  const razonSocial = normalizeText(payload.razonSocial, 'razonSocial');
  const numeroDocumento = parseDocumentNumber(payload.numeroDocumento);
  const idNegocio = getAuthBusinessId(auth);

  if (!idNegocio) {
    throw new AppError('No se pudo identificar el negocio del usuario autenticado', 401);
  }

  const [existingUser, existingClient] = await Promise.all([
    usuarioRepository.findByUsernameOrEmail(username, email),
    usuarioRepository.findClientByDocumentNumber(numeroDocumento, idNegocio),
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
        idNegocio,
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
    idNegocio: createdUser.idNegocio,
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

  if (user.bloqueado) {
    throw new AppError('Tu usuario esta bloqueado. Contacta al administrador.', 403);
  }

  const tipoUsuario = user.rol ? user.rol.rol : null;
  const usuario = {
    id: user.id,
    nombres: user.nombres,
    apellidos: user.apellidos,
    username: user.username,
    email: user.email,
    fechaCreacion: user.fechaCreacion,
    idNegocio: user.idNegocio,
    negocio: user.negocio || null,
    tipoUsuario,
    rol: tipoUsuario,
  };

  const token = signToken({
    sub: user.id,
    username: user.username,
    email: user.email,
    tipoUsuario,
    rol: tipoUsuario,
    idNegocio: user.idNegocio,
    negocioId: user.idNegocio,
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
  bloquearUsuario,
  desbloquearUsuario,
  registrarUsuarioCliente,
  loginUsuario,
};
