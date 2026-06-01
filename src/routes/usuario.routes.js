const { Router } = require('express');
const {
	loginUsuario,
	registrarUsuario,
	registrarUsuarioTecnico,
	registrarUsuarioVentas,
	listarUsuarios,
	obtenerPerfilActual,
	actualizarPerfilActual,
	actualizarPasswordActual,
	bloquearUsuario,
	desbloquearUsuario,
	registrarUsuarioCliente,
} = require('../controllers/usuario.controller');
const { requireAuth, requireAdmin } = require('../middlewares');

const router = Router();

router.get('/', requireAuth, requireAdmin, listarUsuarios);
router.get('/me', requireAuth, requireAdmin, obtenerPerfilActual);
router.patch('/me', requireAuth, requireAdmin, actualizarPerfilActual);
router.patch('/me/password', requireAuth, requireAdmin, actualizarPasswordActual);
router.patch('/:id/bloquear', requireAuth, requireAdmin, bloquearUsuario);
router.patch('/:id/desbloquear', requireAuth, requireAdmin, desbloquearUsuario);
router.post('/registro', registrarUsuario);
router.post('/registro-tecnico', requireAuth, requireAdmin, registrarUsuarioTecnico);
router.post('/registro-ventas', requireAuth, requireAdmin, registrarUsuarioVentas);
router.post('/registro-cliente', requireAuth, requireAdmin, registrarUsuarioCliente);
router.post('/login', loginUsuario);

module.exports = router;
