const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const { soloAdmin } = require('../middlewares/authMiddleware');

router.get('/admin/dashboard', soloAdmin, adminController.mostrarDashboard);
router.get('/admin/administradores', soloAdmin, adminController.listarAdmins);
router.get('/admin/administradores/crear', soloAdmin, adminController.mostrarCrearAdmin);
router.post('/admin/administradores/guardar', soloAdmin, adminController.guardarAdmin);
router.post('/admin/administradores/estado/:id', soloAdmin, adminController.cambiarEstadoAdmin);
router.post('/admin/administradores/eliminar/:id', soloAdmin, adminController.eliminarAdmin);

module.exports = router;