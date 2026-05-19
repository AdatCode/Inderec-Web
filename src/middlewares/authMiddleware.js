const soloAdmin = (req, res, next) => {
  if (!req.session.usuario) {
    return res.redirect('/login');
  }

  if (req.session.usuario.rol !== 'admin') {
    return res.status(403).send('Acceso denegado');
  }

  next();
};

const usuarioAutenticado = (req, res, next) => {
  if (!req.session.usuario) {
    return res.redirect('/login');
  }

  next();
};

module.exports = {
  soloAdmin,
  usuarioAutenticado
};