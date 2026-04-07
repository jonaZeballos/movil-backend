function errorMiddleware(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  return res.status(error.statusCode || 500).json({
    error: error.message || 'Error interno del servidor',
  });
}

module.exports = errorMiddleware;
