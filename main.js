const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const db = require('./db');

//  TRANSPORTER ÚNICO
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'INSERTA_TU_EMAIL_GMAIL',           //  Inserta tu email de Gmail aquí
    pass: 'INSERTA_TU_APP_PASSWORD_GMAIL'    //  Inserta tu contraseña de aplicación de Gmail aquí
  }
});

//  CREAR VENTANA
function createWindow() {
  const win = new BrowserWindow({
    width: 700,
    height: 550,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('index.html');
}

//  ENVÍO MANUAL (BOTÓN)
ipcMain.handle('send-email', async () => {
  await transporter.sendMail({
    from: 'INSERTA_TU_EMAIL_GMAIL',              //  Inserta tu email remitente aquí
    to: 'INSERTA_EMAIL_DESTINATARIO_DE_PRUEBA',  //  Inserta el email destinatario de prueba aquí
    subject: 'Correo desde Electron',
    text: '¡Funciona! Este correo salió desde mi app.'
  });
});

//  GUARDAR CORREO PROGRAMADO
ipcMain.handle('save-email', async (_, data) => {
  await db.query(
    `INSERT INTO emails (destinatario, asunto, cuerpo, fecha_envio, estado)
     VALUES (?, ?, ?, ?, 'pendiente')`,
    [data.to, data.subject, data.body, data.date]
  );
});


//  CRON AUTOMÁTICO (CADA MINUTO)
cron.schedule('* * * * *', async () => {
  console.log('⏰ Revisando correos pendientes...');

  const [emails] = await db.query(
    "SELECT * FROM emails WHERE estado='pendiente' AND fecha_envio <= NOW()"
  );

  for (const email of emails) {
    try {
      await transporter.sendMail({
        from: 'INSERTA_TU_EMAIL_GMAIL',     //  Inserta tu email remitente aquí
        to: email.destinatario,
        subject: email.asunto,
        text: email.cuerpo
      });

      await db.query(
        "UPDATE emails SET estado='enviado' WHERE id=?",
        [email.id]
      );
    } catch (err) {
      console.error('Error enviando correo:', err);

      await db.query(
        "UPDATE emails SET estado='error' WHERE id=?",
        [email.id]
      );
    }
  }
});

//  ARRANQUE DE LA APP
app.whenReady().then(createWindow);