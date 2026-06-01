const { Router } = require('express');
const {
  listarClientes,
  obtenerCliente,
  obtenerHistorialCliente,
  registrarCliente,
  agregarClienteListaNegra,
  quitarClienteListaNegra,
} = require('../controllers/cliente.controller');
const { requireAuth, requireRoles } = require('../middlewares');

const router = Router();

router.get('/', requireAuth, requireRoles(['admin', 'tecnico', 'ventas']), listarClientes);
router.patch('/:id/lista-negra', requireAuth, requireRoles(['admin']), agregarClienteListaNegra);
router.patch('/:id/quitar-lista-negra', requireAuth, requireRoles(['admin']), quitarClienteListaNegra);
router.get('/:id/historial', requireAuth, requireRoles(['admin', 'tecnico', 'ventas']), obtenerHistorialCliente);
router.get('/:id', requireAuth, requireRoles(['admin', 'tecnico', 'ventas']), obtenerCliente);
router.post('/', requireAuth, requireRoles(['admin', 'tecnico', 'ventas']), registrarCliente);

module.exports = router;
