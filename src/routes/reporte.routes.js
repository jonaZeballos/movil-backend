const { Router } = require('express');
const {
  obtenerResumen,
  obtenerReporteServicios,
  obtenerReporteVentas,
  obtenerReporteInventario,
} = require('../controllers/reporte.controller');
const { requireAuth, requireRoles } = require('../middlewares');

const router = Router();

router.get('/resumen', requireAuth, requireRoles(['admin']), obtenerResumen);
router.get('/servicios', requireAuth, requireRoles(['admin']), obtenerReporteServicios);
router.get('/ventas', requireAuth, requireRoles(['admin']), obtenerReporteVentas);
router.get('/inventario', requireAuth, requireRoles(['admin']), obtenerReporteInventario);

module.exports = router;
