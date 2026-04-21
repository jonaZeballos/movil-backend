const { Router } = require('express');
const { registrarUsuario } = require('../controllers/usuario.controller');

const router = Router();

router.post('/registro', registrarUsuario);

module.exports = router;
