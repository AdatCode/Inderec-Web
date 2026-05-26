const express = require('express');
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const cors = require('cors');
require('dotenv').config();

const app = express();
require('./config/db');

const authRoutes = require('./routes/authRoutes');
const productoRoutes = require('./routes/productoRoutes');
const adminRoutes = require('./routes/adminRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');

// Configuración
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Sesiones en MySQL
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(session({
  key: 'session_cookie_catalogo',
  secret: process.env.SESSION_SECRET || 'secreto_alternativo_por_si_acaso',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24
  }
}));

// Temas aleatorios para el cuadro de bienvenida
// Cada vez que el admin inicie sesión, se elige uno.
// Mientras siga logueado, se mantiene el mismo.
const temasHeroDashboard = [
  {
    variant: 'curve',
    accent: '#f4b400',
    glow: 'rgba(244,180,0,.75)',
    radial: 'rgba(244,180,0,.22)'
  },
  {
    variant: 'rings',
    accent: '#8b5cf6',
    glow: 'rgba(139,92,246,.75)',
    radial: 'rgba(139,92,246,.24)'
  },
  {
    variant: 'diagonal',
    accent: '#06b6d4',
    glow: 'rgba(6,182,212,.70)',
    radial: 'rgba(6,182,212,.22)'
  },
  {
    variant: 'waves',
    accent: '#22c55e',
    glow: 'rgba(34,197,94,.70)',
    radial: 'rgba(34,197,94,.22)'
  },
  {
    variant: 'spotlight',
    accent: '#ef4444',
    glow: 'rgba(239,68,68,.70)',
    radial: 'rgba(239,68,68,.22)'
  },
  {
    variant: 'aurora',
    accent: '#f97316',
    glow: 'rgba(249,115,22,.70)',
    radial: 'rgba(249,115,22,.22)'
  },
  {
    variant: 'glass',
    accent: '#ec4899',
    glow: 'rgba(236,72,153,.70)',
    radial: 'rgba(236,72,153,.22)'
  },
  {
    variant: 'rings',
    accent: '#14b8a6',
    glow: 'rgba(20,184,166,.70)',
    radial: 'rgba(20,184,166,.22)'
  }
];

// Variables globales para todas las vistas
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;

  if (req.session.usuario) {
    if (!req.session.heroTheme) {
      const randomIndex = Math.floor(Math.random() * temasHeroDashboard.length);
      req.session.heroTheme = temasHeroDashboard[randomIndex];
    }

    res.locals.heroTheme = req.session.heroTheme;
  } else {
    delete req.session.heroTheme;
    res.locals.heroTheme = null;
  }

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