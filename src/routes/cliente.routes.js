const { Router } = require('express');
const {
  listarClientes,
  obtenerCliente,
  registrarCliente,
} = require('../controllers/cliente.controller');
const { requireAuth, requireRoles } = require('../middlewares');

const router = Router();

router.get('/', requireAuth, requireRoles(['admin', 'tecnico', 'ventas']), listarClientes);
router.get('/:id', requireAuth, requireRoles(['admin', 'tecnico', 'ventas']), obtenerCliente);
router.post('/', requireAuth, requireRoles(['admin', 'tecnico', 'ventas']), registrarCliente);

module.exports = router;
