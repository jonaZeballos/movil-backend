const errorMiddleware = require('./error.middleware');
const notFoundMiddleware = require('./not-found.middleware');
const { requireAuth, requireAdmin, requireRoles } = require('./auth.middleware');

module.exports = {
  errorMiddleware,
  notFoundMiddleware,
  requireAuth,
  requireAdmin,
  requireRoles,
};
