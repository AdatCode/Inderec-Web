const express = require('express');
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session); // <-- Añadido
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

// Configurar el almacenamiento seguro de sesiones en la base de datos de Hostinger
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

app.set('trust proxy', 1); // <-- Es Obligatorio en Hostinger para evitar bloqueos por HTTPS

app.use(session({
  key: 'session_cookie_catalogo',
  secret: process.env.SESSION_SECRET || 'secreto_alternativo_por_si_acaso',
  store: sessionStore, // <-- Guarda la sesión en la BD, haciéndola inmune a los reinicios
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // <-- Configuración segura para el entorno HTTPS de internet
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 // Tu sesión administrativa durará activa 24 horas
  }
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
