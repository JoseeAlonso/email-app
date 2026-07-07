# Email Scheduler App

Desktop application built with **Electron** that lets you write emails and **schedule them** to be sent at a future date and time. A background process (cron job) periodically checks the database and automatically sends any pending emails once their scheduled time arrives.

This project was built as part of my **DAW (Web Application Development)** portfolio, with the goal of practicing the integration of desktop technologies (Electron), backend (Node.js), databases (MySQL), and external services (sending email via SMTP).

---

## Features

- Desktop interface for composing emails (recipient, subject, body, and send date).
- Scheduled emails are stored in a MySQL database.
- A scheduled task (cron) checks every minute for pending emails and sends them automatically once they're due.
- Automatic status update for each email (`pendiente`/pending, `enviado`/sent, `error`).
- Secure communication between the main process and the renderer via `contextBridge` (preload script), avoiding direct exposure of Node.js to the frontend.

---

## Tech stack

| Technology | Purpose |
|---|---|
| [Electron](https://www.electronjs.org/) | Framework for building the desktop app |
| [Node.js](https://nodejs.org/) | Runtime for the main process |
| [MySQL](https://www.mysql.com/) / [mysql2](https://www.npmjs.com/package/mysql2) | Storage for scheduled emails |
| [Nodemailer](https://nodemailer.com/) | Sending emails via SMTP (Gmail) |
| [node-cron](https://www.npmjs.com/package/node-cron) | Periodic execution of the sending task |
| HTML / CSS / JavaScript | User interface |

---

## Project structure

```
email-app/
├── main.js         # Electron main process: window, IPC, cron, email sending
├── preload.js      # Secure bridge between main.js and the renderer (contextBridge)
├── db.js           # MySQL connection pool configuration
├── index.html      # User interface (form)
├── style.css       # Interface styles
├── package.json
└── README.md
```

---

## Prerequisites

Before installing the app you'll need:

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MySQL](https://dev.mysql.com/downloads/) installed and running (local or in a Docker container)
- A Gmail account with **two-step verification enabled** and an **app password** generated (you can't use your regular account password from external apps)

---

## Installation and setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/email-app.git
cd email-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the database

Connect to your MySQL server and run:

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

-- (Optional but recommended) create a dedicated user for the app instead of using root
CREATE USER 'email_app_usuario'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON email_app.* TO 'email_app_usuario'@'localhost';
FLUSH PRIVILEGES;
```

> ⚠️ The project uses MySQL's default port (`3306`) by default. If your instance uses a different port, adjust it in `db.js`.

### 4. Set up your credentials

The code includes **placeholders** where you need to enter your own data. Edit the following files **in your local copy** (do not commit them to git with your real data filled in):

**`db.js`**

```javascript
const pool = mysql.createPool({
    host: 'localhost',
    user: 'INSERT_YOUR_MYSQL_USER',
    password: 'INSERT_YOUR_MYSQL_PASSWORD',
    database: 'email_app',
    port: 3306 // adjust to your MySQL port if different
});
```

**`main.js`**

```javascript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'INSERT_YOUR_GMAIL_EMAIL',
    pass: 'INSERT_YOUR_GMAIL_APP_PASSWORD'
  }
});
```

You'll also find the same sender email (`from`) in two more places in `main.js` (the manual send and the automatic cron send), and a test recipient email (`to`) in the manual send handler. Replace those with your own as well.

To generate a **Gmail app password** (required because Gmail doesn't allow using your regular account password from external apps):
1. Enable two-step verification on your Google account.
2. Go to [App passwords](https://myaccount.google.com/apppasswords).
3. Generate a new password for "Mail" and paste it into the `pass` field.

> ⚠️ **Important:** once you fill in the placeholders with your real credentials, **do not push those changes to a public repository**. If you're publishing this project on GitHub as part of your portfolio, make sure the version you push keeps the placeholders, or add `db.js` and the credentials section of `main.js` to `.gitignore` / use a separate config file that isn't committed.

### 5. Run the app

```bash
npm start
```

The app window will open, where you can fill in the form and schedule an email to be sent.

---

## How it works internally

1. The user fills in the form in `index.html` and clicks **"Programar correo"** (Schedule email).
2. `preload.js` securely exposes the `saveEmail` function to the renderer via `contextBridge`.
3. `main.js` receives the request via IPC and stores the email in MySQL with status `pendiente` (pending).
4. A cron job (`node-cron`) runs **every minute** and queries emails with status `pendiente` whose `fecha_envio` (send date) has already arrived.
5. Each matching email is sent via `Nodemailer`, and its status is updated to `enviado` (sent) or `error` depending on the outcome.

---

## Security notes

- The code published in this repository contains **placeholders** (`INSERT_YOUR_...`) instead of real credentials. Each user must fill them in locally with their own data and **never** commit those changes to a public repository.
- It's recommended not to use the MySQL `root` user for the app, but rather a user with permissions limited to the `email_app` database.
- Using `contextBridge` in `preload.js` avoids exposing Node.js modules directly to the render process, following Electron security best practices.
- As a future improvement, it's recommended to migrate these credentials to environment variables (e.g. with `dotenv`) to completely avoid sensitive data living alongside the source code.

---

## Possible future improvements (up to the user)

- Form field validation (email format, no past dates, etc.).
- A list of scheduled/sent emails with the ability to edit or cancel them.
- Support for multiple sending accounts or SMTP providers.
- Packaging the app with `electron-builder` to distribute it as an executable.
- Unit tests for the sending logic and database access.

---

## Author

**Jose Alonso**
Project built as part of my DAW (Web Application Development) portfolio — sometimes I get bored and go exploring, haha.

---

## License

This project is distributed under the ISC license (see `package.json`).
