const { Router } = require('express');
const usuarioRoutes = require('./usuario.routes');
const clienteRoutes = require('./cliente.routes');
const equipoRoutes = require('./equipo.routes');
const ordenRoutes = require('./orden.routes');
const productoRoutes = require('./producto.routes');
const cotizacionRoutes = require('./cotizacion.routes');
const ventaRoutes = require('./venta.routes');

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
router.use('/api/productos', productoRoutes);
router.use('/api/cotizaciones', cotizacionRoutes);
router.use('/api/ventas', ventaRoutes);

module.exports = router;
