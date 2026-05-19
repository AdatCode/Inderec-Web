const express = require('express');
const router = express.Router();

const categoriaController = require('../controllers/categoriaController');
const { soloAdmin } = require('../middlewares/authMiddleware');

router.get('/admin/categorias', soloAdmin, categoriaController.listarCategorias);
router.get('/admin/categorias/crear', soloAdmin, categoriaController.mostrarCrearCategoria);
router.post('/admin/categorias/guardar', soloAdmin, categoriaController.guardarCategoria);
router.get('/admin/categorias/editar/:id', soloAdmin, categoriaController.mostrarEditarCategoria);
router.post('/admin/categorias/actualizar/:id', soloAdmin, categoriaController.actualizarCategoria);
router.post('/admin/categorias/eliminar/:id', soloAdmin, categoriaController.eliminarCategoria);

module.exports = router;