const { Router } = require('express');
const {
  listarProductos,
  obtenerProducto,
  registrarProducto,
  actualizarProducto,
  desactivarProducto,
  restaurarProducto,
  eliminarProducto,
  listarCategoriasProducto,
  registrarCategoriaProducto,
  actualizarCategoriaProducto,
  desactivarCategoriaProducto,
} = require('../controllers/producto.controller');
const { requireAuth, requireRoles } = require('../middlewares');

const router = Router();

router.get('/', requireAuth, requireRoles(['admin', 'ventas', 'tecnico']), listarProductos);
router.get('/categorias', requireAuth, requireRoles(['admin', 'ventas', 'tecnico']), listarCategoriasProducto);
router.post('/categorias', requireAuth, requireRoles(['admin']), registrarCategoriaProducto);
router.patch('/categorias/:id/desactivar', requireAuth, requireRoles(['admin']), desactivarCategoriaProducto);
router.patch('/categorias/:id', requireAuth, requireRoles(['admin']), actualizarCategoriaProducto);
router.patch('/:id/desactivar', requireAuth, requireRoles(['admin']), desactivarProducto);
router.patch('/:id/restaurar', requireAuth, requireRoles(['admin']), restaurarProducto);
router.delete('/:id', requireAuth, requireRoles(['admin']), eliminarProducto);
router.get('/:id', requireAuth, requireRoles(['admin', 'ventas', 'tecnico']), obtenerProducto);
router.post('/', requireAuth, requireRoles(['admin', 'ventas', 'tecnico']), registrarProducto);
router.patch('/:id', requireAuth, requireRoles(['admin', 'ventas', 'tecnico']), actualizarProducto);

module.exports = router;
