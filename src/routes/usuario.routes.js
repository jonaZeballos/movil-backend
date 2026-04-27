const { Router } = require('express');
const { loginUsuario, registrarUsuario, registrarUsuarioTecnico } = require('../controllers/usuario.controller');
const { requireAuth, requireAdmin } = require('../middlewares');

const router = Router();

router.post('/registro', registrarUsuario);
router.post('/registro-tecnico', requireAuth, requireAdmin, registrarUsuarioTecnico);
router.post('/login', loginUsuario);

module.exports = router;
