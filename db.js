const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'INSERTA_TU_USUARIO_MYSQL',         //  Inserta tu usuario de MySQL aquí
    password: 'INSERTA_TU_CONTRASEÑA_MYSQL',     //  Inserta tu contraseña de MySQL aquí
    database: 'email_app',
    port: 3306                //  Ajusta al puerto de tu MySQL si es distinto
});

module.exports = pool;