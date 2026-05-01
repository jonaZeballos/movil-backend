const { Router } = require('express');
const {
  listarClientes,
  obtenerCliente,
  registrarCliente,
} = require('../controllers/cliente.controller');
const { requireAuth } = require('../middlewares');

const router = Router();

router.get('/', requireAuth, listarClientes);
router.get('/:id', requireAuth, obtenerCliente);
router.post('/', requireAuth, registrarCliente);

module.exports = router;
