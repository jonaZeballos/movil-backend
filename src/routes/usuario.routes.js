const { Router } = require('express');
const {
	loginUsuario,
	registrarUsuario,
	registrarUsuarioTecnico,
	registrarUsuarioVentas,
	registrarUsuarioCliente,
} = require('../controllers/usuario.controller');
const { requireAuth, requireAdmin } = require('../middlewares');

const router = Router();

router.post('/registro', registrarUsuario);
router.post('/registro-tecnico', requireAuth, requireAdmin, registrarUsuarioTecnico);
router.post('/registro-ventas', requireAuth, requireAdmin, registrarUsuarioVentas);
router.post('/registro-cliente', registrarUsuarioCliente);
router.post('/login', loginUsuario);

module.exports = router;
