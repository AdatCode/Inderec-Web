const db = require('../config/db');

const mostrarCrearProducto = (req, res) => {
  const sqlCategorias = 'SELECT id, nombre FROM categorias ORDER BY nombre ASC';

  db.query(sqlCategorias, (error, categorias) => {
    if (error) {
      console.error(error);
      return res.send('Error al cargar categorías');
    }

    res.render('admin/crear-producto', {
      ok: req.query.ok || null,
      error: null,
      categorias
    });
  });
};

const guardarProducto = (req, res) => {
  const {
    nombre,
    marca,
    categoria_id,
    descripcion,
    stock,
    precio,
    enlace_referencia,
    ubicacion_rack
  } = req.body;

  const imagen = req.file ? `/uploads/${req.file.filename}` : null;

  if (!nombre || !marca || !categoria_id || !descripcion || !stock || !precio) {
    const sqlCategorias = 'SELECT id, nombre FROM categorias ORDER BY nombre ASC';

    return db.query(sqlCategorias, (errorCategorias, categorias) => {
      if (errorCategorias) {
        console.error(errorCategorias);
        return res.send('Error al cargar categorías');
      }

      return res.render('admin/crear-producto', {
        ok: null,
        error: 'Completa los campos obligatorios',
        categorias
      });
    });
  }

  const sqlBuscarMarca = 'SELECT id FROM marcas WHERE nombre = ? LIMIT 1';

  db.query(sqlBuscarMarca, [marca], (error, results) => {
    if (error) {
      console.error(error);
      return res.send('Error al buscar la marca');
    }

    const insertarProducto = (marcaId) => {
      const sqlProducto = `
        INSERT INTO productos
        (nombre, marca_id, categoria_id, descripcion, stock, precio, enlace_referencia, ubicacion_rack, imagen)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        sqlProducto,
        [
          nombre,
          marcaId,
          categoria_id,
          descripcion,
          stock,
          precio,
          enlace_referencia || null,
          ubicacion_rack || null,
          imagen
        ],
        (error2) => {
          if (error2) {
            console.error(error2);
            return res.send('Error al guardar el producto');
          }

          return res.redirect('/admin/productos/crear?ok=1');
        }
      );
    };

    if (results.length > 0) {
      insertarProducto(results[0].id);
    } else {
      const sqlInsertMarca = 'INSERT INTO marcas (nombre) VALUES (?)';

      db.query(sqlInsertMarca, [marca], (error3, resultMarca) => {
        if (error3) {
          console.error(error3);
          return res.send('Error al crear la marca');
        }

        insertarProducto(resultMarca.insertId);
      });
    }
  });
};

const listarProductos = (req, res) => {
  const sql = `
    SELECT 
      productos.id,
      productos.nombre,
      marcas.nombre AS marca,
      categorias.nombre AS categoria,
      productos.stock,
      productos.precio,
      productos.ubicacion_rack,
      productos.imagen,
      productos.estado
    FROM productos
    LEFT JOIN marcas ON productos.marca_id = marcas.id
    LEFT JOIN categorias ON productos.categoria_id = categorias.id
    ORDER BY productos.id DESC
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error(error);
      return res.send('Error al listar productos');
    }

    res.render('admin/listar-productos', {
      productos: results
    });
  });
};

const eliminarProducto = (req, res) => {
  const { id } = req.params;

  const sql = 'DELETE FROM productos WHERE id = ?';

  db.query(sql, [id], (error) => {
    if (error) {
      console.error(error);
      return res.send('Error al eliminar el producto');
    }

    res.redirect('/admin/productos');
  });
};

const mostrarEditarProducto = (req, res) => {
  const { id } = req.params;

  const sqlProducto = `
    SELECT 
      productos.*,
      marcas.nombre AS marca
    FROM productos
    LEFT JOIN marcas ON productos.marca_id = marcas.id
    WHERE productos.id = ?
    LIMIT 1
  `;

  const sqlCategorias = 'SELECT id, nombre FROM categorias ORDER BY nombre ASC';

  db.query(sqlProducto, [id], (error, results) => {
    if (error) {
      console.error(error);
      return res.send('Error al cargar el producto');
    }

    if (results.length === 0) {
      return res.send('Producto no encontrado');
    }

    db.query(sqlCategorias, (error2, categorias) => {
      if (error2) {
        console.error(error2);
        return res.send('Error al cargar categorías');
      }

      res.render('admin/editar-producto', {
        producto: results[0],
        categorias,
        error: null
      });
    });
  });
};

const actualizarProducto = (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    marca,
    categoria_id,
    descripcion,
    stock,
    precio,
    enlace_referencia,
    ubicacion_rack
  } = req.body;

  const nuevaImagen = req.file ? `/uploads/${req.file.filename}` : null;

  const sqlBuscarMarca = 'SELECT id FROM marcas WHERE nombre = ? LIMIT 1';

  db.query(sqlBuscarMarca, [marca], (error, results) => {
    if (error) {
      console.error(error);
      return res.send('Error al buscar la marca');
    }

    const actualizarConMarca = (marcaId) => {
      let sql = `
        UPDATE productos
        SET nombre = ?, marca_id = ?, categoria_id = ?, descripcion = ?, stock = ?, precio = ?, enlace_referencia = ?, ubicacion_rack = ?
      `;

      let params = [
        nombre,
        marcaId,
        categoria_id,
        descripcion,
        stock,
        precio,
        enlace_referencia || null,
        ubicacion_rack || null
      ];

      if (nuevaImagen) {
        sql += ', imagen = ?';
        params.push(nuevaImagen);
      }

      sql += ' WHERE id = ?';
      params.push(id);

      db.query(sql, params, (error2) => {
        if (error2) {
          console.error(error2);
          return res.send('Error al actualizar el producto');
        }

        res.redirect('/admin/productos');
      });
    };

    if (results.length > 0) {
      actualizarConMarca(results[0].id);
    } else {
      const sqlInsertMarca = 'INSERT INTO marcas (nombre) VALUES (?)';

      db.query(sqlInsertMarca, [marca], (error3, resultMarca) => {
        if (error3) {
          console.error(error3);
          return res.send('Error al crear la marca');
        }

        actualizarConMarca(resultMarca.insertId);
      });
    }
  });
};

const verCatalogo = (req, res) => {
  const sqlProductos = `
    SELECT 
      productos.id,
      productos.nombre,
      productos.descripcion,
      productos.stock,
      productos.precio,
      productos.imagen,
      productos.enlace_referencia,
      marcas.nombre AS marca,
      categorias.nombre AS categoria
    FROM productos
    LEFT JOIN marcas ON productos.marca_id = marcas.id
    LEFT JOIN categorias ON productos.categoria_id = categorias.id
    WHERE productos.estado = 'activo'
    ORDER BY productos.id DESC
  `;

  const sqlCategorias = `
    SELECT id, nombre
    FROM categorias
    ORDER BY nombre ASC
  `;

  db.query(sqlProductos, (error, productos) => {
    if (error) {
      console.error(error);
      return res.send('Error al cargar el catálogo');
    }

    db.query(sqlCategorias, (error2, categorias) => {
      if (error2) {
        console.error(error2);
        return res.send('Error al cargar categorías');
      }

      res.render('catalogo/index', {
        productos,
        categorias
      });
    });
  });
};

const verDetalleProducto = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      productos.id,
      productos.nombre,
      productos.descripcion,
      productos.stock,
      productos.precio,
      productos.imagen,
      productos.enlace_referencia,
      productos.ubicacion_rack,
      marcas.nombre AS marca,
      categorias.nombre AS categoria
    FROM productos
    LEFT JOIN marcas ON productos.marca_id = marcas.id
    LEFT JOIN categorias ON productos.categoria_id = categorias.id
    WHERE productos.id = ? AND productos.estado = 'activo'
    LIMIT 1
  `;

  db.query(sql, [id], (error, results) => {
    if (error) {
      console.error(error);
      return res.send('Error al cargar el producto');
    }

    if (results.length === 0) {
      return res.send('Producto no encontrado');
    }

    res.render('catalogo/detalle', {
      producto: results[0]
    });
  });
};


module.exports = {
  mostrarCrearProducto,
  guardarProducto,
  listarProductos,
  eliminarProducto,
  mostrarEditarProducto,
  actualizarProducto,
  verCatalogo,
  verDetalleProducto
};