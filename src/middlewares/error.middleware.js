function errorMiddleware(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.code === 'ECONNREFUSED' || error.code === 'EPERM') {
    return res.status(503).json({
      error: 'No se pudo conectar a la base de datos. Verifica que PostgreSQL este levantado y que DATABASE_URL sea correcta.',
    });
  }

  if (error.code === 'P2002') {
    return res.status(409).json({
      error: 'Ya existe un registro con esos datos en este negocio.',
    });
  }

  if (error.code === 'P2022') {
    return res.status(500).json({
      error: 'La base de datos no esta sincronizada con el modelo actual. Ejecuta npx prisma db push.',
    });
  }

  return res.status(error.statusCode || 500).json({
    error: error.statusCode ? error.message : 'Error interno del servidor',
  });
}

module.exports = errorMiddleware;
