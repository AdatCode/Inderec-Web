const express = require('express');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

const app = express();
require('./config/db');

const authRoutes = require('./routes/authRoutes');
const productoRoutes = require('./routes/productoRoutes');
const adminRoutes = require('./routes/adminRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const { soloAdmin } = require('./middlewares/authMiddleware');

// Configuración
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  next();
});

// Rutas
app.use('/', authRoutes);
app.use('/', productoRoutes);
app.use('/', adminRoutes);
app.use('/', categoriaRoutes);

app.get('/', (_, res) => {
  res.redirect('/catalogo');
});


module.exports = app;