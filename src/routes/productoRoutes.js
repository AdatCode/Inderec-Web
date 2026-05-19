const express = require('express');
const router = express.Router();

const upload = require('../middlewares/uploadMiddleware');
const { soloAdmin } = require('../middlewares/authMiddleware');
const productoController = require('../controllers/productoController');

router.get('/catalogo', productoController.verCatalogo);
router.get('/catalogo/producto/:id', productoController.verDetalleProducto);

router.get('/admin/productos', soloAdmin, productoController.listarProductos);
router.get('/admin/productos/editar/:id', soloAdmin, productoController.mostrarEditarProducto);
router.get('/admin/productos/crear', soloAdmin, productoController.mostrarCrearProducto);
router.post('/admin/productos/guardar', soloAdmin, upload.single('imagen'), productoController.guardarProducto);
router.post('/admin/productos/actualizar/:id', soloAdmin, upload.single('imagen'), productoController.actualizarProducto);
router.post('/admin/productos/eliminar/:id', soloAdmin, productoController.eliminarProducto);

module.exports = router;