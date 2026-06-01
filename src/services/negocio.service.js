const AppError = require('../utils/appError');
const negocioRepository = require('../repositories/negocio.repository');

function getAuthBusinessId(auth) {
  return auth?.idNegocio || auth?.negocioId || null;
}

function normalizeText(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(`El campo ${fieldName} es obligatorio`, 400);
  }

  return value.trim();
}

function optionalText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeEmail(value) {
  const email = optionalText(value);
  if (!email) return null;

  const normalized = email.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new AppError('El email de contacto no es valido', 400);
  }

  return normalized;
}

function mapNegocio(negocio) {
  return {
    id: negocio.id,
    nombre: negocio.nombre,
    emailContacto: negocio.emailContacto || null,
    telefono: negocio.telefono || null,
    direccion: negocio.direccion || null,
    fechaCreacion: negocio.fechaCreacion,
    usuarios: negocio.usuarios.map((usuario) => ({
      id: usuario.id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      name: [usuario.nombres, usuario.apellidos].filter(Boolean).join(' ').trim(),
      email: usuario.email,
      telefono: usuario.telefonos?.[0]?.numero?.toString() || null,
      rol: usuario.rol?.rol || null,
      role: usuario.rol?.rol || null,
    })),
  };
}

async function getNegocioActual(auth) {
  const idNegocio = getAuthBusinessId(auth);
  if (!idNegocio) {
    throw new AppError('El usuario no esta asociado a un negocio', 400);
  }

  const negocio = await negocioRepository.findById(idNegocio);
  if (!negocio) {
    throw new AppError('Negocio no encontrado', 404);
  }

  return mapNegocio(negocio);
}

async function updateNegocioActual(payload, auth) {
  const idNegocio = getAuthBusinessId(auth);
  if (!idNegocio) {
    throw new AppError('El usuario no esta asociado a un negocio', 400);
  }

  const existing = await negocioRepository.findById(idNegocio);
  if (!existing) {
    throw new AppError('Negocio no encontrado', 404);
  }

  const data = {};
  if (payload.nombre !== undefined) {
    data.nombre = normalizeText(payload.nombre, 'nombre');
  }
  if (payload.emailContacto !== undefined) {
    data.emailContacto = normalizeEmail(payload.emailContacto);
  }
  if (payload.telefono !== undefined) {
    data.telefono = optionalText(payload.telefono);
  }
  if (payload.direccion !== undefined) {
    data.direccion = optionalText(payload.direccion);
  }

  if (!Object.keys(data).length) {
    throw new AppError('Debe enviar al menos un campo valido para actualizar', 400);
  }

  const negocio = await negocioRepository.update(idNegocio, data);
  return mapNegocio(negocio);
}

module.exports = {
  getNegocioActual,
  updateNegocioActual,
};
