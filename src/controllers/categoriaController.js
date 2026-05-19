const db = require('../config/db');

const listarCategorias = (req, res) => {
  const sql = `
    SELECT id, nombre, orden
    FROM categorias
    ORDER BY orden ASC, id ASC
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error(error);
      return res.send('Error al listar categorías');
    }

    res.render('admin/categorias', {
      categorias: results
    });
  });
};

const mostrarCrearCategoria = (req, res) => {
  res.render('admin/crear-categoria', {
    error: null
  });
};

const guardarCategoria = (req, res) => {
  const { nombre, orden } = req.body;

  if (!nombre) {
    return res.render('admin/crear-categoria', {
      error: 'El nombre es obligatorio'
    });
  }

  const sqlVerificar = `
    SELECT id FROM categorias WHERE nombre = ? LIMIT 1
  `;

  db.query(sqlVerificar, [nombre], (error, results) => {
    if (error) {
      console.error(error);
      return res.render('admin/crear-categoria', {
        error: 'Error al verificar la categoría'
      });
    }

    if (results.length > 0) {
      return res.render('admin/crear-categoria', {
        error: 'Esa categoría ya existe'
      });
    }

    const sqlInsert = `
      INSERT INTO categorias (nombre, orden)
      VALUES (?, ?)
    `;

    db.query(sqlInsert, [nombre, orden || null], (error2) => {
      if (error2) {
        console.error(error2);
        return res.render('admin/crear-categoria', {
          error: 'Error al guardar la categoría'
        });
      }

      return res.redirect('/admin/categorias');
    });
  });
};

const mostrarEditarCategoria = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT id, nombre, orden
    FROM categorias
    WHERE id = ?
    LIMIT 1
  `;

  db.query(sql, [id], (error, results) => {
    if (error) {
      console.error(error);
      return res.send('Error al cargar la categoría');
    }

    if (results.length === 0) {
      return res.send('Categoría no encontrada');
    }

    res.render('admin/editar-categoria', {
      categoria: results[0],
      error: null
    });
  });
};

const actualizarCategoria = (req, res) => {
  const { id } = req.params;
  const { nombre, orden } = req.body;

  if (!nombre) {
    return res.send('El nombre es obligatorio');
  }

  const sqlVerificar = `
    SELECT id
    FROM categorias
    WHERE nombre = ? AND id != ?
    LIMIT 1
  `;

  db.query(sqlVerificar, [nombre, id], (error, results) => {
    if (error) {
      console.error(error);
      return res.send('Error al verificar la categoría');
    }

    if (results.length > 0) {
      return res.send('Ya existe otra categoría con ese nombre');
    }

    const sqlUpdate = `
      UPDATE categorias
      SET nombre = ?, orden = ?
      WHERE id = ?
    `;

    db.query(sqlUpdate, [nombre, orden || null, id], (error2) => {
      if (error2) {
        console.error(error2);
        return res.send('Error al actualizar la categoría');
      }

      res.redirect('/admin/categorias');
    });
  });
};

const eliminarCategoria = (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM categorias WHERE id = ?`;

  db.query(sql, [id], (error) => {
    if (error) {
      console.error(error);
      return res.send('No se pudo eliminar la categoría. Puede estar en uso por productos.');
    }

    res.redirect('/admin/categorias');
  });
};

module.exports = {
  listarCategorias,
  mostrarCrearCategoria,
  guardarCategoria,
  mostrarEditarCategoria,
  actualizarCategoria,
  eliminarCategoria
};