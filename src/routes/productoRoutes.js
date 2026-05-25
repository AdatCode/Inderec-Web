const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const db = require('../config/db');
const { soloAdmin } = require('../middlewares/authMiddleware');

// ===============================
// SUBIDA DE IMÁGENES
// ===============================
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nombreArchivo = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, nombreArchivo);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'), false);
    }
  }
});

// ===============================
// HELPERS
// ===============================
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

function textoSeguro(valor, fallback = '') {
  if (valor === undefined || valor === null) return fallback;
  return String(valor).trim();
}

function numeroSeguro(valor, fallback = 0) {
  if (valor === undefined || valor === null || valor === '') return fallback;

  const limpio = String(valor).trim().replace(',', '.');
  const numero = Number(limpio);

  return Number.isFinite(numero) ? numero : fallback;
}

async function obtenerColumnas(tabla) {
  const columnas = await query(`SHOW COLUMNS FROM ${tabla}`);
  return columnas.map(col => col.Field);
}

function obtenerColumnaId(columnas, opciones) {
  for (const opcion of opciones) {
    if (columnas.includes(opcion)) return opcion;
  }

  return opciones[0];
}

async function obtenerCategorias() {
  try {
    const columnas = await obtenerColumnas('categorias');
    const idCol = obtenerColumnaId(columnas, ['id', 'id_categoria']);
    const nombreCol = columnas.includes('nombre') ? 'nombre' : 'categoria';

    const categorias = await query(`
      SELECT 
        ${idCol} AS id,
        ${nombreCol} AS nombre
      FROM categorias
      ORDER BY ${nombreCol} ASC
    `);

    return categorias;
  } catch (error) {
    console.error('Error al cargar categorías:', error);
    return [];
  }
}

async function obtenerMarcas() {
  try {
    const columnas = await obtenerColumnas('marcas');
    const idCol = obtenerColumnaId(columnas, ['id', 'id_marca']);
    const nombreCol = columnas.includes('nombre') ? 'nombre' : 'marca';

    const marcas = await query(`
      SELECT 
        ${idCol} AS id,
        ${nombreCol} AS nombre
      FROM marcas
      ORDER BY ${nombreCol} ASC
    `);

    return marcas;
  } catch (error) {
    console.error('Error al cargar marcas:', error);
    return [];
  }
}

async function obtenerOMarcarId(nombreMarca) {
  const nombre = textoSeguro(nombreMarca);

  if (!nombre) return null;

  const columnas = await obtenerColumnas('marcas');
  const idCol = obtenerColumnaId(columnas, ['id', 'id_marca']);
  const nombreCol = columnas.includes('nombre') ? 'nombre' : 'marca';

  const existente = await query(
    `SELECT ${idCol} AS id FROM marcas WHERE ${nombreCol} = ? LIMIT 1`,
    [nombre]
  );

  if (existente.length > 0) {
    return existente[0].id;
  }

  const resultado = await query(
    `INSERT INTO marcas (${nombreCol}) VALUES (?)`,
    [nombre]
  );

  return resultado.insertId;
}

function normalizarProducto(producto, categorias = [], marcas = []) {
  const id = producto.id || producto.id_producto;
  const categoriaId = producto.categoria_id || producto.id_categoria || null;
  const marcaId = producto.marca_id || producto.id_marca || null;

  const categoriaEncontrada = categorias.find(categoria => {
    return String(categoria.id) === String(categoriaId);
  });

  const marcaEncontrada = marcas.find(marca => {
    return String(marca.id) === String(marcaId);
  });

  return {
    ...producto,

    id,
    id_producto: id,

    categoria_id: categoriaId,
    id_categoria: categoriaId,

    marca_id: marcaId,
    id_marca: marcaId,

    categoria:
      producto.categoria ||
      producto.categoria_nombre ||
      (categoriaEncontrada ? categoriaEncontrada.nombre : ''),

    categoria_nombre:
      producto.categoria_nombre ||
      producto.categoria ||
      (categoriaEncontrada ? categoriaEncontrada.nombre : ''),

    marca:
      producto.marca ||
      producto.marca_nombre ||
      (marcaEncontrada ? marcaEncontrada.nombre : ''),

    marca_nombre:
      producto.marca_nombre ||
      producto.marca ||
      (marcaEncontrada ? marcaEncontrada.nombre : ''),

    ubicacion_rack: producto.ubicacion_rack || producto.ubicacion || '',
    imagen: producto.imagen || '',
    precio: producto.precio || 0,
    stock: producto.stock || 0
  };
}

// ===============================
// CATÁLOGO PÚBLICO
// ===============================
router.get('/catalogo', async (req, res) => {
  try {
    const columnasProductos = await obtenerColumnas('productos');
    const idCol = obtenerColumnaId(columnasProductos, ['id', 'id_producto']);

    const productosRaw = await query(`
      SELECT *
      FROM productos
      ORDER BY ${idCol} DESC
    `);

    const categorias = await obtenerCategorias();
    const marcas = await obtenerMarcas();

    const productos = productosRaw.map(producto =>
      normalizarProducto(producto, categorias, marcas)
    );

    res.render('catalogo/index', {
      productos,
      categorias
    });
  } catch (error) {
    console.error('Error al cargar catálogo:', error);
    res.send('Error al cargar catálogo');
  }
});

router.get('/catalogo/producto/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const columnasProductos = await obtenerColumnas('productos');
    const idCol = obtenerColumnaId(columnasProductos, ['id', 'id_producto']);

    const resultado = await query(
      `SELECT * FROM productos WHERE ${idCol} = ? LIMIT 1`,
      [id]
    );

    if (resultado.length === 0) {
      return res.status(404).send('Producto no encontrado');
    }

    const categorias = await obtenerCategorias();
    const marcas = await obtenerMarcas();

    const producto = normalizarProducto(resultado[0], categorias, marcas);

    res.render('catalogo/detalle', {
      producto
    });
  } catch (error) {
    console.error('Error al cargar detalle:', error);
    res.send('Error al cargar detalle del producto');
  }
});

// ===============================
// ADMIN - LISTAR PRODUCTOS
// ===============================
router.get('/admin/productos', soloAdmin, async (req, res) => {
  try {
    const columnasProductos = await obtenerColumnas('productos');
    const idCol = obtenerColumnaId(columnasProductos, ['id', 'id_producto']);

    const productosRaw = await query(`
      SELECT *
      FROM productos
      ORDER BY ${idCol} DESC
    `);

    const categorias = await obtenerCategorias();
    const marcas = await obtenerMarcas();

    const productos = productosRaw.map(producto =>
      normalizarProducto(producto, categorias, marcas)
    );

    res.render('admin/listar-productos', {
      productos
    });
  } catch (error) {
    console.error('Error al cargar productos:', error);
    res.send('Error al cargar productos');
  }
});

// ===============================
// ADMIN - FORMULARIO CREAR PRODUCTO
// ===============================
router.get('/admin/productos/crear', soloAdmin, async (req, res) => {
  try {
    const categorias = await obtenerCategorias();

    res.render('admin/crear-producto', {
      categorias,
      error: null
    });
  } catch (error) {
    console.error('Error al abrir crear producto:', error);
    res.redirect('/admin/productos');
  }
});

// ===============================
// ADMIN - GUARDAR PRODUCTO
// ===============================
router.post('/admin/productos/guardar', soloAdmin, upload.single('imagen'), async (req, res) => {
  try {
    const nombre = textoSeguro(req.body.nombre);
    const marcaTexto = textoSeguro(req.body.marca);
    const descripcion = textoSeguro(req.body.descripcion);
    const stock = numeroSeguro(req.body.stock, 0);
    const precio = numeroSeguro(req.body.precio, 0);
    const ubicacion_rack = textoSeguro(req.body.ubicacion_rack || req.body.ubicacion);
    const categoria_id = req.body.categoria_id || req.body.id_categoria || null;
    const marca_id = await obtenerOMarcarId(marcaTexto);
    const imagen = req.file ? `/uploads/${req.file.filename}` : null;

    if (!nombre) {
      const categorias = await obtenerCategorias();

      return res.render('admin/crear-producto', {
        categorias,
        error: 'El nombre del producto es obligatorio.'
      });
    }

    const sql = `
      INSERT INTO productos
      (nombre, marca_id, categoria_id, descripcion, stock, precio, ubicacion_rack, imagen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const valores = [
      nombre,
      marca_id,
      categoria_id,
      descripcion,
      stock,
      precio,
      ubicacion_rack,
      imagen
    ];

    await query(sql, valores);

    res.redirect('/admin/productos');
  } catch (error) {
    console.error('Error al guardar producto:', error);
    res.redirect('/admin/productos/crear');
  }
});

// Por si tu formulario manda a /crear
router.post('/admin/productos/crear', soloAdmin, upload.single('imagen'), async (req, res) => {
  try {
    const nombre = textoSeguro(req.body.nombre);
    const marcaTexto = textoSeguro(req.body.marca);
    const descripcion = textoSeguro(req.body.descripcion);
    const stock = numeroSeguro(req.body.stock, 0);
    const precio = numeroSeguro(req.body.precio, 0);
    const ubicacion_rack = textoSeguro(req.body.ubicacion_rack || req.body.ubicacion);
    const categoria_id = req.body.categoria_id || req.body.id_categoria || null;
    const marca_id = await obtenerOMarcarId(marcaTexto);
    const imagen = req.file ? `/uploads/${req.file.filename}` : null;

    if (!nombre) {
      return res.redirect('/admin/productos/crear');
    }

    const sql = `
      INSERT INTO productos
      (nombre, marca_id, categoria_id, descripcion, stock, precio, ubicacion_rack, imagen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const valores = [
      nombre,
      marca_id,
      categoria_id,
      descripcion,
      stock,
      precio,
      ubicacion_rack,
      imagen
    ];

    await query(sql, valores);

    res.redirect('/admin/productos');
  } catch (error) {
    console.error('Error al guardar producto:', error);
    res.redirect('/admin/productos/crear');
  }
});

// ===============================
// ADMIN - FORMULARIO EDITAR PRODUCTO
// ===============================
router.get('/admin/productos/editar/:id', soloAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const columnasProductos = await obtenerColumnas('productos');
    const idCol = obtenerColumnaId(columnasProductos, ['id', 'id_producto']);

    const resultado = await query(
      `SELECT * FROM productos WHERE ${idCol} = ? LIMIT 1`,
      [id]
    );

    if (resultado.length === 0) {
      return res.redirect('/admin/productos');
    }

    const categorias = await obtenerCategorias();
    const marcas = await obtenerMarcas();

    const producto = normalizarProducto(resultado[0], categorias, marcas);

    res.render('admin/editar-producto', {
      producto,
      categorias,
      error: null
    });
  } catch (error) {
    console.error('Error al abrir editar producto:', error);
    res.redirect('/admin/productos');
  }
});

// ===============================
// ADMIN - ACTUALIZAR PRODUCTO
// ===============================
router.post('/admin/productos/editar/:id', soloAdmin, upload.single('imagen'), async (req, res) => {
  try {
    const { id } = req.params;

    const columnasProductos = await obtenerColumnas('productos');
    const idCol = obtenerColumnaId(columnasProductos, ['id', 'id_producto']);

    const resultado = await query(
      `SELECT * FROM productos WHERE ${idCol} = ? LIMIT 1`,
      [id]
    );

    if (resultado.length === 0) {
      return res.redirect('/admin/productos');
    }

    const nombre = textoSeguro(req.body.nombre);
    const marcaTexto = textoSeguro(req.body.marca);
    const descripcion = textoSeguro(req.body.descripcion);
    const stock = numeroSeguro(req.body.stock, 0);
    const precio = numeroSeguro(req.body.precio, 0);
    const ubicacion_rack = textoSeguro(req.body.ubicacion_rack || req.body.ubicacion);
    const categoria_id = req.body.categoria_id || req.body.id_categoria || null;
    const marca_id = await obtenerOMarcarId(marcaTexto);

    if (!nombre) {
      return res.redirect(`/admin/productos/editar/${id}`);
    }

    let sql = `
      UPDATE productos
      SET
        nombre = ?,
        marca_id = ?,
        categoria_id = ?,
        descripcion = ?,
        stock = ?,
        precio = ?,
        ubicacion_rack = ?
    `;

    const valores = [
      nombre,
      marca_id,
      categoria_id,
      descripcion,
      stock,
      precio,
      ubicacion_rack
    ];

    if (req.file) {
      sql += `,
        imagen = ?
      `;

      valores.push(`/uploads/${req.file.filename}`);
    }

    sql += `
      WHERE ${idCol} = ?
    `;

    valores.push(id);

    await query(sql, valores);

    res.redirect('/admin/productos');
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.redirect(`/admin/productos/editar/${req.params.id}`);
  }
});

// ===============================
// ADMIN - ELIMINAR PRODUCTO
// ===============================
router.post('/admin/productos/eliminar/:id', soloAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const columnasProductos = await obtenerColumnas('productos');
    const idCol = obtenerColumnaId(columnasProductos, ['id', 'id_producto']);

    await query(
      `DELETE FROM productos WHERE ${idCol} = ?`,
      [id]
    );

    res.redirect('/admin/productos');
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.redirect('/admin/productos');
  }
});

// Por si tienes enlaces antiguos con GET
router.get('/admin/productos/eliminar/:id', soloAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const columnasProductos = await obtenerColumnas('productos');
    const idCol = obtenerColumnaId(columnasProductos, ['id', 'id_producto']);

    await query(
      `DELETE FROM productos WHERE ${idCol} = ?`,
      [id]
    );

    res.redirect('/admin/productos');
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.redirect('/admin/productos');
  }
});

module.exports = router;