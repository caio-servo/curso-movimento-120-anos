const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('./sendEmail');

const app = express();

const session = require('express-session');


const allowedOrigins = [
    'http://127.0.0.1:8080',
    'http://localhost:5500'
];

// CORS 
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('CORS bloqueado: ' + origin));
    },
    credentials: true
}));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// session
app.use(session({
    name: 'movimento.sid',
    secret: 'movimento-120-anos-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'none',
        secure: false
    }
}));

// DB
const db = new sqlite3.Database('./database.db');

// Verifica se precisa de 2FA (7 dias)
function needs2FA(last2fa) {
    if (!last2fa) return true;
    const diff = new Date() - new Date(last2fa);
    return diff >= 7 * 24 * 60 * 60 * 1000;
}

// Init DB
if (process.argv.includes('--init-db')) {
    const schema = fs.readFileSync('./schema.sql', 'utf8');
    db.exec(schema, err => {
        if (err) throw err;
        console.log('Banco inicializado');
        process.exit(0);
    });
    return;
}

app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Backend rodando corretamente'
    });
});

// Cadastro
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.json({ success: false });
    }

    const hash = await bcrypt.hash(password, 10);

    db.run(
        `INSERT INTO usuarios (nome, email, senha, ultimo_login)
         VALUES (?, ?, ?, datetime('now'))`,
        [name, email, hash],
        err => {
            if (err) return res.json({ success: false });
            res.json({ success: true });
        }
    );
});

// Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get(`SELECT * FROM usuarios WHERE email = ?`, [email], async (err, user) => {
        if (err || !user) {
            return res.json({ success: false, message: 'Credenciais inválidas' });
        }

        const ok = await bcrypt.compare(password, user.senha);
        if (!ok) {
            return res.json({ success: false, message: 'Credenciais inválidas' });
        }

        if (needs2FA(user.last_2fa_at)) {

            if (
                user.twofa_code &&
                user.twofa_expires_at &&
                new Date(user.twofa_expires_at) > new Date()
            ) {
                return res.json({ require2FA: true, email: user.email });
            }

            const code = Math.floor(100000 + Math.random() * 900000).toString();

            db.run(
                `UPDATE usuarios
                 SET twofa_code = ?,
                     twofa_expires_at = datetime('now', '+5 minutes')
                 WHERE id = ?`,
                [code, user.id]
            );

            await sendEmail(
                user.email,
                'Código de verificação',
                `Seu código de acesso é: ${code}`
            );

            return res.json({ require2FA: true, email: user.email });
        }

        db.run(
            `UPDATE usuarios SET ultimo_login = datetime('now') WHERE id = ?`,
            [user.id]
        );

        req.session.userId = user.id;
        req.session.email = user.email;

        res.json({ success: true });
    });
});

// Verificação 2FA
app.post('/verify-2fa', (req, res) => {
    const { email, code } = req.body;

    db.get(
        `SELECT * FROM usuarios
         WHERE email = ?
           AND twofa_code = ?
           AND twofa_expires_at > datetime('now')`,
        [email, code],
        (err, user) => {
            if (err || !user) {
                return res.json({ success: false, message: 'Código inválido ou expirado' });
            }

            // FINALIZA LOGIN (sessão)
            req.session.userId = user.id;
            req.session.email = user.email;

            db.run(
                `UPDATE usuarios
                 SET twofa_code = NULL,
                     twofa_expires_at = NULL,
                     last_2fa_at = datetime('now'),
                     ultimo_login = datetime('now')
                 WHERE id = ?`,
                [user.id]
            );

            res.json({ success: true });
        }
    );
});

app.listen(3000, () => {
    console.log('Backend rodando em http://localhost:3000');
});

