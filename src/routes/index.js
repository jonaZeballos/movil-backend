const { Router } = require('express');
const usuarioRoutes = require('./usuario.routes');

const router = Router();

router.get('/', (req, res) => {
  res.json({
    mensaje: 'API funcionando',
  });
});

router.use('/api/usuarios', usuarioRoutes);

module.exports = router;
