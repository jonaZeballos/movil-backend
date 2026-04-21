const { Router } = require('express');
const { loginUsuario, registrarUsuario } = require('../controllers/usuario.controller');

const router = Router();

router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);

module.exports = router;
