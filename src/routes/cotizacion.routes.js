const { Router } = require('express');
const {
  listarCotizaciones,
  obtenerCotizacion,
  registrarCotizacion,
} = require('../controllers/cotizacion.controller');
const { requireAuth, requireRoles } = require('../middlewares');

const router = Router();

router.get('/', requireAuth, requireRoles(['admin', 'tecnico']), listarCotizaciones);
router.get('/:id', requireAuth, requireRoles(['admin', 'tecnico']), obtenerCotizacion);
router.post('/', requireAuth, requireRoles(['admin', 'tecnico']), registrarCotizacion);

module.exports = router;
