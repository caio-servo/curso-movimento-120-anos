const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Conexão com SQLite
const db = new sqlite3.Database('./database.db');

// Inicialização do banco a partir de schema.sql
if (process.argv.includes('--init-db')) {
    const schema = fs.readFileSync('./schema.sql', 'utf8');
    db.exec(schema, (err) => {
        if (err) throw err;
        console.log("Banco criado/atualizado com sucesso!");
    });
    return;
}

// Cadastro
app.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    const query = `
        INSERT INTO usuarios (nome, email, senha, ultimo_login)
        VALUES (?, ?, ?, datetime('now'))
    `;

    db.run(query, [name, email, password], function (err) {
        if (err) {
            return res.json({ success: false, message: 'E-mail já cadastrado!' });
        }
        return res.json({ success: true });
    });
});

// Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get(
        `SELECT * FROM usuarios WHERE email = ? AND senha = ?`,
        [email, password],
        (err, user) => {
            if (!user) {
                return res.json({ success: false, message: 'Credenciais inválidas!' });
            }

            return res.json({
                success: true,
                name: user.nome,
                email: user.email
            });
        }
    );
});

app.listen(3000, () => {
    console.log("Backend rodando em http://localhost:3000");
});

