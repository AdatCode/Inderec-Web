const db = require('../config/db');

const buscarPorEmail = (email, callback) => {
  const sql = `
    SELECT usuarios.*, roles.nombre AS rol
    FROM usuarios
    INNER JOIN roles ON usuarios.rol_id = roles.id
    WHERE usuarios.email = ?
    LIMIT 1
  `;

  db.query(sql, [email], callback);
};

module.exports = {
  buscarPorEmail
};