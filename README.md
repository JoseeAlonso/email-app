# Email Scheduler App

Aplicación de escritorio desarrollada con **Electron** que permite redactar correos electrónicos y **programar su envío** para una fecha y hora futuras. Un proceso en segundo plano (cron job) revisa periódicamente la base de datos y envía automáticamente los correos pendientes cuando llega su hora.

Proyecto realizado como parte de mi portfolio de **DAW (Desarrollo de Aplicaciones Web)**, con el objetivo de practicar integración de tecnologías de escritorio (Electron), backend (Node.js), bases de datos (MySQL) y servicios externos (envío de correo vía SMTP).

---

## Funcionalidades

- Interfaz de escritorio para redactar correos (destinatario, asunto, cuerpo y fecha de envío).
- Guardado de correos programados en una base de datos MySQL.
- Tarea programada (cron) que revisa cada minuto los correos pendientes y los envía automáticamente cuando corresponde.
- Actualización automática del estado del correo (`pendiente`, `enviado`, `error`).
- Comunicación segura entre el proceso principal y el renderer mediante `contextBridge` (preload script), evitando exponer Node.js directamente al frontend.

---

## Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| [Electron](https://www.electronjs.org/) | Framework para crear la app de escritorio |
| [Node.js](https://nodejs.org/) | Entorno de ejecución del proceso principal |
| [MySQL](https://www.mysql.com/) / [mysql2](https://www.npmjs.com/package/mysql2) | Almacenamiento de los correos programados |
| [Nodemailer](https://nodemailer.com/) | Envío de correos vía SMTP (Gmail) |
| [node-cron](https://www.npmjs.com/package/node-cron) | Ejecución periódica de la tarea de envío |
| HTML / CSS / JavaScript | Interfaz de usuario |

---

## Estructura del proyecto

```
email-app/
├── main.js         # Proceso principal de Electron: ventana, IPC, cron, envío de correos
├── preload.js      # Puente seguro entre main.js y el renderer (contextBridge)
├── db.js           # Configuración y pool de conexión a MySQL
├── index.html      # Interfaz de usuario (formulario)
├── style.css       # Estilos de la interfaz
├── package.json
└── README.md
```

---

## Requisitos previos

Antes de instalar la aplicación necesitas tener:

- [Node.js](https://nodejs.org/) (v18 o superior recomendado)
- [MySQL](https://dev.mysql.com/downloads/) instalado y en ejecución (local o en un contenedor Docker)
- Una cuenta de Gmail con **verificación en dos pasos activada** y una **contraseña de aplicación** generada (no se puede usar la contraseña normal de la cuenta)

---

## Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/email-app.git
cd email-app
```

### 2. Instalar las dependencias

```bash
npm install
```

### 3. Crear la base de datos

Conéctate a tu servidor MySQL y ejecuta:

```sql
CREATE DATABASE email_app;

USE email_app;

CREATE TABLE emails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    destinatario VARCHAR(255) NOT NULL,
    asunto VARCHAR(255) NOT NULL,
    cuerpo TEXT NOT NULL,
    fecha_envio DATETIME NOT NULL,
    estado ENUM('pendiente', 'enviado', 'error') DEFAULT 'pendiente'
);

-- (Opcional pero recomendado) crea un usuario específico para la app en vez de usar root
CREATE USER 'email_app_usuario'@'localhost' IDENTIFIED BY 'tu_contraseña_segura';
GRANT ALL PRIVILEGES ON email_app.* TO 'email_app_usuario'@'localhost';
FLUSH PRIVILEGES;
```

> ⚠️ El proyecto usa por defecto el puerto estándar de MySQL (`3306`). Si tu instancia usa otro puerto, ajústalo en `db.js`.

### 4. Configurar tus credenciales

El código incluye **placeholders** en los sitios donde debes escribir tus propios datos. Edita los siguientes archivos **en tu copia local** (no los subas a git con tus datos reales puestos):

**`db.js`**

```javascript
const pool = mysql.createPool({
    host: 'localhost',
    user: 'INSERTA_TU_USUARIO_MYSQL',
    password: 'INSERTA_TU_CONTRASEÑA_MYSQL',
    database: 'email_app',
    port: 3306 // ajusta al puerto de tu MySQL si es distinto
});
```

**`main.js`**

```javascript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'INSERTA_TU_EMAIL_GMAIL',
    pass: 'INSERTA_TU_APP_PASSWORD_GMAIL'
  }
});
```

También encontrarás el mismo email de remitente (`from`) en dos sitios más de `main.js` (el envío manual y el envío automático por cron), y un email de destinatario de prueba (`to`) en el envío manual. Sustitúyelos igualmente por los tuyos.

Para generar la **contraseña de aplicación de Gmail** (necesaria porque Gmail no permite usar la contraseña normal de la cuenta desde apps externas):
1. Activa la verificación en dos pasos en tu cuenta de Google.
2. Ve a [Contraseñas de aplicaciones](https://myaccount.google.com/apppasswords).
3. Genera una nueva contraseña para "Correo" y cópiala en el campo `pass`.

> ⚠️ **Importante:** una vez rellenados los placeholders con tus credenciales reales, **no subas esos cambios a un repositorio público**. Si vas a publicar este proyecto en GitHub como parte de tu portfolio, asegúrate de dejar los placeholders en la versión que subas, o añade `db.js` y la sección de credenciales de `main.js` a `.gitignore` / usa un archivo de configuración separado que no se suba.

### 5. Ejecutar la aplicación

```bash
npm start
```

Se abrirá la ventana de la aplicación, desde donde podrás rellenar el formulario y programar el envío de un correo.

---

## Cómo funciona internamente

1. El usuario rellena el formulario en `index.html` y pulsa **"Programar correo"**.
2. `preload.js` expone de forma segura la función `saveEmail` al renderer mediante `contextBridge`.
3. `main.js` recibe la petición vía IPC y guarda el correo en MySQL con estado `pendiente`.
4. Un cron job (`node-cron`) se ejecuta **cada minuto** y consulta los correos con estado `pendiente` cuya `fecha_envio` ya haya llegado.
5. Por cada correo encontrado, se envía mediante `Nodemailer` y se actualiza su estado a `enviado` o `error` según el resultado.

---

## Notas de seguridad

- El código publicado en este repositorio contiene **placeholders** (`INSERTA_TU_...`) en lugar de credenciales reales. Cada usuario debe rellenarlos localmente con sus propios datos y **nunca** subir esos cambios a un repositorio público.
- Se recomienda no usar el usuario `root` de MySQL para la aplicación, sino un usuario con permisos limitados a la base de datos `email_app`.
- El uso de `contextBridge` en `preload.js` evita exponer directamente los módulos de Node.js al proceso de renderizado, siguiendo las buenas prácticas de seguridad de Electron.
- Como mejora futura, se recomienda migrar estas credenciales a variables de entorno (por ejemplo con `dotenv`) para evitar por completo que datos sensibles convivan con el código fuente.

---

## Posibles mejoras futuras (A considerar por el usuario)

- Validación de campos del formulario (formato de email, fecha no pasada, etc.).
- Listado de correos programados/enviados con posibilidad de editar o cancelar.
- Soporte para múltiples cuentas de envío o proveedores SMTP.
- Empaquetado de la app con `electron-builder` para distribuirla como ejecutable.
- Tests unitarios para la lógica de envío y acceso a base de datos.

---

## Autor

**Jose Alonso**
Proyecto desarrollado como parte de mi portfolio de DAW (Desarrollo de Aplicaciones Web, a veces me aburro e investigo jeje).

---

## Licencia

Este proyecto se distribuye bajo la licencia ISC (ver `package.json`).
