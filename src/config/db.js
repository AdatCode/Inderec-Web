const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

connection.connect((error) => {
  if (error) {
    console.error('Error de conexión a MariaDB:', error);
    return;
  }
  console.log('Conectado a MariaDB correctamente');
});

module.exports = connection;