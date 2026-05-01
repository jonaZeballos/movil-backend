const { Router } = require('express');
const usuarioRoutes = require('./usuario.routes');
const clienteRoutes = require('./cliente.routes');
const equipoRoutes = require('./equipo.routes');
const ordenRoutes = require('./orden.routes');

const router = Router();

router.get('/', (req, res) => {
  res.json({
    mensaje: 'API funcionando',
  });
});

router.use('/api/usuarios', usuarioRoutes);
router.use('/api/clientes', clienteRoutes);
router.use('/api/equipos', equipoRoutes);
router.use('/api/ordenes', ordenRoutes);

module.exports = router;
