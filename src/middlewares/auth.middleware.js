const AppError = require('../utils/appError');
const { verifyToken } = require('../utils/token');

function extractBearerToken(authorizationHeader) {
  if (!authorizationHeader || typeof authorizationHeader !== 'string') {
    throw new AppError('Token Bearer requerido', 401);
  }

  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Formato de token invalido. Use Bearer <token>', 401);
  }

  return token;
}

function requireAuth(req, res, next) {
  try {
    const token = extractBearerToken(req.headers.authorization);
    const payload = verifyToken(token);

    req.auth = payload;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireAdmin(req, res, next) {
  const role = (req.auth && (req.auth.rol || req.auth.tipoUsuario)) || null;

  if (!role || role.toLowerCase() !== 'admin') {
    return next(new AppError('No tienes permisos para realizar esta accion', 403));
  }

  return next();
}

module.exports = {
  requireAuth,
  requireAdmin,
};
