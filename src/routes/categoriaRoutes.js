const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { soloAdmin } = require('../middlewares/authMiddleware');

// LISTAR CATEGORÍAS
router.get('/admin/categorias', soloAdmin, (req, res) => {
  db.query('SELECT * FROM categorias ORDER BY id ASC', (err, categorias) => {
    if (err) {
      console.error('Error al listar categorías:', err);
      return res.send('Error al cargar categorías');
    }

    res.render('admin/categorias', {
      categorias
    });
  });
});

// FORMULARIO CREAR CATEGORÍA
router.get('/admin/categorias/crear', soloAdmin, (req, res) => {
  res.render('admin/crear-categoria', {
    error: null,
    ok: null
  });
});

// GUARDAR CATEGORÍA
router.post('/admin/categorias/guardar', soloAdmin, (req, res) => {
  const { nombre } = req.body;

  if (!nombre || nombre.trim() === '') {
    return res.render('admin/crear-categoria', {
      error: 'El nombre de la categoría es obligatorio.',
      ok: null
    });
  }

  db.query(
    'INSERT INTO categorias (nombre) VALUES (?)',
    [nombre.trim()],
    (err) => {
      if (err) {
        console.error('Error al crear categoría:', err);

        return res.render('admin/crear-categoria', {
          error: 'No se pudo guardar la categoría.',
          ok: null
        });
      }

      res.redirect('/admin/categorias');
    }
  );
});

// FORMULARIO EDITAR CATEGORÍA
router.get('/admin/categorias/editar/:id', soloAdmin, (req, res) => {
  const { id } = req.params;

  db.query(
    'SELECT * FROM categorias WHERE id = ?',
    [id],
    (err, resultado) => {
      if (err) {
        console.error('Error al obtener categoría:', err);
        return res.redirect('/admin/categorias');
      }

      if (resultado.length === 0) {
        return res.redirect('/admin/categorias');
      }

      res.render('admin/editar-categoria', {
        categoria: resultado[0],
        error: null,
        ok: null
      });
    }
  );
});

// ACTUALIZAR CATEGORÍA
router.post('/admin/categorias/editar/:id', soloAdmin, (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;

  if (!nombre || nombre.trim() === '') {
    db.query(
      'SELECT * FROM categorias WHERE id = ?',
      [id],
      (err, resultado) => {
        if (err || resultado.length === 0) {
          return res.redirect('/admin/categorias');
        }

        return res.render('admin/editar-categoria', {
          categoria: resultado[0],
          error: 'El nombre de la categoría es obligatorio.',
          ok: null
        });
      }
    );

    return;
  }

  db.query(
    'UPDATE categorias SET nombre = ? WHERE id = ?',
    [nombre.trim(), id],
    (err) => {
      if (err) {
        console.error('Error al actualizar categoría:', err);

        db.query(
          'SELECT * FROM categorias WHERE id = ?',
          [id],
          (errorSelect, resultado) => {
            if (errorSelect || resultado.length === 0) {
              return res.redirect('/admin/categorias');
            }

            return res.render('admin/editar-categoria', {
              categoria: resultado[0],
              error: 'No se pudo actualizar la categoría.',
              ok: null
            });
          }
        );

        return;
      }

      res.redirect('/admin/categorias');
    }
  );
});

// ELIMINAR CATEGORÍA
router.post('/admin/categorias/eliminar/:id', soloAdmin, (req, res) => {
  const { id } = req.params;

  db.query(
    'DELETE FROM categorias WHERE id = ?',
    [id],
    (err) => {
      if (err) {
        console.error('Error al eliminar categoría:', err);
        return res.redirect('/admin/categorias');
      }

      res.redirect('/admin/categorias');
    }
  );
});

module.exports = router;