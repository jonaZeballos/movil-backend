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

function normalizeQrPagoUrl(value) {
  const qrPagoUrl = optionalText(value);
  if (!qrPagoUrl) return null;

  const isImageDataUri = /^data:image\/(png|jpe?g|webp);base64,/i.test(qrPagoUrl);
  const isRemoteImage = /^https?:\/\/.+/i.test(qrPagoUrl);

  if (!isImageDataUri && !isRemoteImage) {
    throw new AppError('El QR de pago debe ser una URL de imagen o una imagen en base64', 400);
  }

  if (qrPagoUrl.length > 750000) {
    throw new AppError('La imagen QR es demasiado grande', 400);
  }

  return qrPagoUrl;
}

function mapNegocio(negocio) {
  return {
    id: negocio.id,
    nombre: negocio.nombre,
    emailContacto: negocio.emailContacto || null,
    telefono: negocio.telefono || null,
    direccion: negocio.direccion || null,
    qrPagoUrl: negocio.qrPagoUrl || null,
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
  if (payload.qrPagoUrl !== undefined) {
    data.qrPagoUrl = normalizeQrPagoUrl(payload.qrPagoUrl);
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
