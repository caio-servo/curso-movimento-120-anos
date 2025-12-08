const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const cors = require('cors');
const app = express();

// Configuração do CORS - deve vir antes de outros middlewares
app.use(cors({
    origin: true, // Permite qualquer origem
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: false
}));

// Middleware para logging - adiciona logs de todas as requisições
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});

// Middleware para parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conexão com SQLite
const db = new sqlite3.Database('./database.db');

// Inicialização do banco a partir de schema.sql
if (process.argv.includes('--init-db')) {
    const schema = fs.readFileSync('./schema.sql', 'utf8');
    db.exec(schema, (err) => {
        if (err) throw err;
        console.log("Banco criado/atualizado com sucesso!");
        process.exit(0);
    });
} else {
    // Cadastro
    app.post('/register', (req, res) => {
        const { name, email, password } = req.body;
        const query = `
            INSERT INTO usuarios (nome, email, senha, ultimo_login)
            VALUES (?, ?, ?, datetime('now'))
        `;
        db.run(query, [name, email, password], function (err) {
            if (err) {
                console.error('Erro ao registrar:', err);
                return res.json({ success: false, message: 'E-mail já cadastrado!' });
            }
            console.log('Usuário registrado com sucesso:', email);
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
                if (err) {
                    console.error('Erro no banco de dados:', err);
                    return res.json({ success: false, message: 'Erro ao processar login!' });
                }
                if (!user) {
                    console.log('Login falhou para:', email);
                    return res.json({ success: false, message: 'Credenciais inválidas!' });
                }
                console.log('Login bem-sucedido para:', email);
                return res.json({
                    success: true,
                    name: user.nome,
                    email: user.email
                });
            }
        );
    });

    // Rota GET para a raiz (resolve o erro "cannot get/")
    app.get('/', (req, res) => {
        res.json({ message: 'Backend rodando corretamente!' });
    });

    app.listen(3000, () => {
        console.log("========================================");
        console.log("Backend rodando em http://localhost:3000");
        console.log("========================================");
    });
}
