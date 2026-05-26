const { Router } = require('express');
const {
  obtenerNegocioActual,
  actualizarNegocioActual,
} = require('../controllers/negocio.controller');
const { requireAuth, requireRoles } = require('../middlewares');

const router = Router();

router.get('/me', requireAuth, requireRoles(['admin', 'tecnico', 'ventas']), obtenerNegocioActual);
router.patch('/me', requireAuth, requireRoles(['admin']), actualizarNegocioActual);

module.exports = router;
