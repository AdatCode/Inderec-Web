const db = require('../config/db');
const bcrypt = require('bcryptjs');

const mostrarDashboard = (req, res) => {
  const sqlProductos = `SELECT COUNT(*) AS total FROM productos`;
  const sqlSinCategoria = `SELECT COUNT(*) AS total FROM productos WHERE categoria_id IS NULL`;
  const sqlCategorias = `SELECT COUNT(*) AS total FROM categorias`;
  const sqlAdminsActivos = `
    SELECT COUNT(*) AS total
    FROM usuarios
    INNER JOIN roles ON usuarios.rol_id = roles.id
    WHERE roles.nombre = 'admin' AND usuarios.estado = 'activo'
  `;

  db.query(sqlProductos, (error1, productosResult) => {
    if (error1) {
      console.error(error1);
      return res.send('Error al cargar dashboard');
    }

    db.query(sqlSinCategoria, (error2, sinCategoriaResult) => {
      if (error2) {
        console.error(error2);
        return res.send('Error al cargar dashboard');
      }

      db.query(sqlCategorias, (error3, categoriasResult) => {
        if (error3) {
          console.error(error3);
          return res.send('Error al cargar dashboard');
        }

        db.query(sqlAdminsActivos, (error4, adminsActivosResult) => {
          if (error4) {
            console.error(error4);
            return res.send('Error al cargar dashboard');
          }

          res.render('admin/dashboard', {
            usuario: req.session.usuario,
            resumen: {
              productosTotales: productosResult[0].total,
              productosSinCategoria: sinCategoriaResult[0].total,
              categoriasTotales: categoriasResult[0].total,
              adminsActivos: adminsActivosResult[0].total
            }
          });
        });
      });
    });
  });
};

const listarAdmins = (req, res) => {
  const sql = `
    SELECT 
      usuarios.id,
      usuarios.nombre,
      usuarios.email,
      usuarios.estado,
      usuarios.created_at
    FROM usuarios
    INNER JOIN roles ON usuarios.rol_id = roles.id
    WHERE roles.nombre = 'admin'
    ORDER BY usuarios.id DESC
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error(error);
      return res.send('Error al listar administradores');
    }

    res.render('admin/admins', {
      admins: results,
      usuario: req.session.usuario
    });
  });
};

const mostrarCrearAdmin = (req, res) => {
  res.render('admin/crear-admin', {
    error: null
  });
};

const guardarAdmin = async (req, res) => {
  const { nombre, email, password, confirmar_password } = req.body;

  if (!nombre || !email || !password || !confirmar_password) {
    return res.render('admin/crear-admin', {
      error: 'Completa todos los campos'
    });
  }

  if (password !== confirmar_password) {
    return res.render('admin/crear-admin', {
      error: 'Las contraseñas no coinciden'
    });
  }

  const sqlBuscar = `SELECT id FROM usuarios WHERE email = ? LIMIT 1`;

  db.query(sqlBuscar, [email], async (error, results) => {
    if (error) {
      console.error(error);
      return res.render('admin/crear-admin', {
        error: 'Error al verificar el correo'
      });
    }

    if (results.length > 0) {
      return res.render('admin/crear-admin', {
        error: 'Ese correo ya está registrado'
      });
    }

    try {
      const hash = await bcrypt.hash(password, 10);
      const sqlRol = `SELECT id FROM roles WHERE nombre = 'admin' LIMIT 1`;

      db.query(sqlRol, (error2, rolResults) => {
        if (error2) {
          console.error(error2);
          return res.render('admin/crear-admin', {
            error: 'Error al buscar el rol admin'
          });
        }

        if (rolResults.length === 0) {
          return res.render('admin/crear-admin', {
            error: 'No existe el rol admin'
          });
        }

        const rolId = rolResults[0].id;

        const sqlInsert = `
          INSERT INTO usuarios (nombre, email, password, rol_id, estado)
          VALUES (?, ?, ?, ?, 'activo')
        `;

        db.query(sqlInsert, [nombre, email, hash, rolId], (error3) => {
          if (error3) {
            console.error(error3);
            return res.render('admin/crear-admin', {
              error: 'Error al crear el administrador'
            });
          }

          return res.redirect('/admin/administradores');
        });
      });
    } catch (e) {
      console.error(e);
      return res.render('admin/crear-admin', {
        error: 'Error al encriptar la contraseña'
      });
    }
  });
};

const cambiarEstadoAdmin = (req, res) => {
  const { id } = req.params;

  if (Number(id) === Number(req.session.usuario.id)) {
    return res.send('No puedes desactivar o activar tu propia cuenta desde aquí');
  }

  const sqlBuscar = `
    SELECT estado
    FROM usuarios
    WHERE id = ?
    LIMIT 1
  `;

  db.query(sqlBuscar, [id], (error, results) => {
    if (error) {
      console.error(error);
      return res.send('Error al buscar administrador');
    }

    if (results.length === 0) {
      return res.send('Administrador no encontrado');
    }

    const estadoActual = results[0].estado;
    const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';

    const sqlUpdate = `
      UPDATE usuarios
      SET estado = ?
      WHERE id = ?
    `;

    db.query(sqlUpdate, [nuevoEstado, id], (error2) => {
      if (error2) {
        console.error(error2);
        return res.send('Error al cambiar estado');
      }

      res.redirect('/admin/administradores');
    });
  });
};

const eliminarAdmin = (req, res) => {
  const { id } = req.params;

  if (Number(id) === Number(req.session.usuario.id)) {
    return res.send('No puedes eliminar tu propia cuenta');
  }

  const sql = `DELETE FROM usuarios WHERE id = ?`;

  db.query(sql, [id], (error) => {
    if (error) {
      console.error(error);
      return res.send('Error al eliminar administrador');
    }

    res.redirect('/admin/administradores');
  });
};

module.exports = {
  mostrarDashboard,
  listarAdmins,
  mostrarCrearAdmin,
  guardarAdmin,
  cambiarEstadoAdmin,
  eliminarAdmin
};