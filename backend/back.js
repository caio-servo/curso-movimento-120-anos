const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const cors = require('cors');
const { sendEmail } = require('./sendEmail');
const { generateRandomPassword } = require('./geraSenha');

const app = express();

// Configuração do CORS
app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: false
}));

// Middleware para logging
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

// Função auxiliar para verificar se a senha expirou (7 dias)
function passwordExpired(lastReset) {
    if (!lastReset) return true;
    const now = new Date();
    const resetDate = new Date(lastReset);
    const diff = now - resetDate;
    const days = diff / (1000 * 60 * 60 * 24);
    return days >= 7;
}

// Função para resetar senha expirada
async function resetExpiredPassword(user) {
    const newPassword = generateRandomPassword();
    
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE usuarios SET senha = ?, password_last_reset = datetime('now') WHERE id = ?`,
            [newPassword, user.id],
            async (err) => {
                if (err) {
                    console.error('Erro ao atualizar senha:', err);
                    reject(err);
                    return;
                }
                
                try {
                    await sendEmail(
                        user.email,
                        'Sua nova senha do curso',
                        `Sua senha expirou e foi gerada uma nova.\n\nNova senha: ${newPassword}`
                    );
                    console.log('Email de reset enviado para:', user.email);
                    resolve(newPassword);
                } catch (emailErr) {
                    console.error('Erro ao enviar email:', emailErr);
                    reject(emailErr);
                }
            }
        );
    });
}

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
        
        if (!name || !email || !password) {
            return res.json({ 
                success: false, 
                message: 'Todos os campos são obrigatórios!' 
            });
        }
        
        const query = `
            INSERT INTO usuarios (nome, email, senha, ultimo_login, password_last_reset)
            VALUES (?, ?, ?, datetime('now'), datetime('now'))
        `;
        
        db.run(query, [name, email, password], function (err) {
            if (err) {
                console.error('Erro ao registrar:', err);
                return res.json({ 
                    success: false, 
                    message: 'E-mail já cadastrado!' 
                });
            }
            console.log('Usuário registrado com sucesso:', email);
            return res.json({ success: true });
        });
    });

    // Login com verificação de senha expirada
    app.post('/login', async (req, res) => {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.json({ 
                success: false, 
                message: 'E-mail e senha são obrigatórios!' 
            });
        }
        
        db.get(
            `SELECT * FROM usuarios WHERE email = ?`,
            [email],
            async (err, user) => {
                if (err) {
                    console.error('Erro no banco de dados:', err);
                    return res.json({ 
                        success: false, 
                        message: 'Erro ao processar login!' 
                    });
                }
                
                if (!user) {
                    console.log('Usuário não encontrado:', email);
                    return res.json({ 
                        success: false, 
                        message: 'Usuário não encontrado!' 
                    });
                }
                
                // Verifica se a senha expirou
                if (passwordExpired(user.password_last_reset)) {
                    try {
                        await resetExpiredPassword(user);
                        console.log('Senha expirada resetada para:', email);
                        return res.json({
                            success: false,
                            message: 'Sua senha expirou. Uma nova senha foi enviada ao seu e-mail.'
                        });
                    } catch (resetErr) {
                        console.error('Erro ao resetar senha:', resetErr);
                        return res.json({
                            success: false,
                            message: 'Erro ao processar reset de senha. Tente novamente.'
                        });
                    }
                }
                
                // Verifica a senha
                if (user.senha !== password) {
                    console.log('Senha incorreta para:', email);
                    return res.json({ 
                        success: false, 
                        message: 'Senha incorreta!' 
                    });
                }
                
                // Atualiza último login
                db.run(
                    `UPDATE usuarios SET ultimo_login = datetime('now') WHERE id = ?`,
                    [user.id],
                    (updateErr) => {
                        if (updateErr) {
                            console.error('Erro ao atualizar último login:', updateErr);
                        }
                    }
                );
                
                console.log('Login bem-sucedido para:', email);
                return res.json({
                    success: true,
                    name: user.nome,
                    email: user.email
                });
            }
        );
    });

    // Rota de teste
    app.get('/', (req, res) => {
        res.json({ message: 'Backend rodando corretamente!' });
    });

    // Iniciar servidor
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Backend rodando em http://localhost:${PORT}`);
    });
}

// Exporta o db para ser usado em outros módulos se necessário
module.exports = { db };
