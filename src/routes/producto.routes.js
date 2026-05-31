const { Router } = require('express');
const {
  listarProductos,
  obtenerProducto,
  registrarProducto,
  actualizarProducto,
  desactivarProducto,
  restaurarProducto,
  eliminarProducto,
} = require('../controllers/producto.controller');
const { requireAuth, requireRoles } = require('../middlewares');

const router = Router();

router.get('/', requireAuth, requireRoles(['admin', 'ventas']), listarProductos);
router.patch('/:id/desactivar', requireAuth, requireRoles(['admin']), desactivarProducto);
router.patch('/:id/restaurar', requireAuth, requireRoles(['admin']), restaurarProducto);
router.delete('/:id', requireAuth, requireRoles(['admin']), eliminarProducto);
router.get('/:id', requireAuth, requireRoles(['admin', 'ventas']), obtenerProducto);
router.post('/', requireAuth, requireRoles(['admin', 'ventas']), registrarProducto);
router.patch('/:id', requireAuth, requireRoles(['admin', 'ventas']), actualizarProducto);

module.exports = router;
