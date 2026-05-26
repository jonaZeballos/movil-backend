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

function mapNegocio(negocio) {
  return {
    id: negocio.id,
    nombre: negocio.nombre,
    fechaCreacion: negocio.fechaCreacion,
    usuarios: negocio.usuarios.map((usuario) => ({
      id: usuario.id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      name: [usuario.nombres, usuario.apellidos].filter(Boolean).join(' ').trim(),
      username: usuario.username,
      email: usuario.email,
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
