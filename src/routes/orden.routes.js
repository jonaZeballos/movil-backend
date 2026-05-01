const { Router } = require('express');
const {
  listarOrdenes,
  obtenerOrden,
  crearOrden,
  actualizarOrden,
} = require('../controllers/orden.controller');
const { requireAuth } = require('../middlewares');

const router = Router();

router.get('/', requireAuth, listarOrdenes);
router.get('/:id', requireAuth, obtenerOrden);
router.post('/', requireAuth, crearOrden);
router.patch('/:id', requireAuth, actualizarOrden);

module.exports = router;
