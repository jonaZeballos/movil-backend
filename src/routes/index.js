const { Router } = require('express');
const usuarioRoutes = require('./usuario.routes');
const clienteRoutes = require('./cliente.routes');
const equipoRoutes = require('./equipo.routes');
const ordenRoutes = require('./orden.routes');
const productoRoutes = require('./producto.routes');
const cotizacionRoutes = require('./cotizacion.routes');
const ventaRoutes = require('./venta.routes');
const reporteRoutes = require('./reporte.routes');
const notificacionRoutes = require('./notificacion.routes');
const negocioRoutes = require('./negocio.routes');
const prisma = require('../utils/prismaClient');

const router = Router();

router.get('/', (req, res) => {
  res.json({
    mensaje: 'API funcionando',
  });
});

router.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({
      status: 'ok',
      api: true,
      database: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      api: true,
      database: false,
      mensaje: 'No se pudo conectar con la base de datos',
    });
  }
});

router.use('/api/usuarios', usuarioRoutes);
router.use('/api/clientes', clienteRoutes);
router.use('/api/equipos', equipoRoutes);
router.use('/api/ordenes', ordenRoutes);
router.use('/api/productos', productoRoutes);
router.use('/api/cotizaciones', cotizacionRoutes);
router.use('/api/ventas', ventaRoutes);
router.use('/api/reportes', reporteRoutes);
router.use('/api/notificaciones', notificacionRoutes);
router.use('/api/negocio', negocioRoutes);
router.use('/api/negocios', negocioRoutes);

module.exports = router;
