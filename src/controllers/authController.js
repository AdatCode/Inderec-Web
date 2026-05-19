const bcrypt = require('bcryptjs');
const usuarioModel = require('../models/usuarioModel');

const mostrarLogin = (req, res) => {
  res.render('auth/login', { error: null });
};

const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('auth/login', { error: 'Completa todos los campos' });
  }

  usuarioModel.buscarPorEmail(email, async (error, results) => {
    if (error) {
      console.error(error);
      return res.render('auth/login', { error: 'Error del servidor' });
    }

    if (results.length === 0) {
      return res.render('auth/login', { error: 'Correo no encontrado' });
    }

    const usuario = results[0];

    if (usuario.estado !== 'activo') {
      return res.render('auth/login', { error: 'Administrador inactivo' });
    }

    const coincide = await bcrypt.compare(password, usuario.password);

    if (!coincide) {
      return res.render('auth/login', { error: 'Contraseña incorrecta' });
    }

    if (usuario.rol !== 'admin') {
      return res.render('auth/login', { error: 'Acceso solo para administradores' });
    }

    req.session.usuario = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol
    };

    return res.redirect('/admin/dashboard');
  });
};

const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};

module.exports = {
  mostrarLogin,
  login,
  logout
};