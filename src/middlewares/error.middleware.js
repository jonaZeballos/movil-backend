function errorMiddleware(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.code === 'ECONNREFUSED' || error.code === 'EPERM') {
    return res.status(503).json({
      error: 'No se pudo conectar a la base de datos. Verifica que PostgreSQL este levantado y que DATABASE_URL sea correcta.',
    });
  }

  return res.status(error.statusCode || 500).json({
    error: error.message || 'Error interno del servidor',
  });
}

module.exports = errorMiddleware;
