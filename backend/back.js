const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('./sendEmail');

const app = express();

const session = require('express-session');

const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'https://movimento120anos.ibr.com.br'
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS não permitido'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
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
        sameSite: 'lax',
        secure: false,
        maxAge: 1000 * 60 * 60 * 24
    }
}));

const db = new sqlite3.Database('./database.db');

function needs2FA(last2fa) {
    if (!last2fa) return true;
    const diff = new Date() - new Date(last2fa);
    return diff >= 7 * 24 * 60 * 60 * 1000;
}

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

app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Dados incompletos' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);

        db.run(
            `INSERT INTO usuarios (nome, email, senha, ultimo_login)
             VALUES (?, ?, ?, datetime('now'))`,
            [name, email, hash],
            function(err) {
                if (err) {
                    console.error('Erro ao registrar:', err);
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Email já cadastrado ou erro ao registrar' 
                    });
                }
                res.json({ success: true, message: 'Cadastro realizado com sucesso' });
            }
        );
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`[LOGIN] Tentativa de login com email: ${email}`);

    if (!email || !password) {
        console.log('[LOGIN] Email ou senha faltando');
        return res.status(400).json({ success: false, message: 'Email e senha obrigatórios' });
    }

    db.get(`SELECT * FROM usuarios WHERE email = ?`, [email], async (err, user) => {
        if (err) {
            console.error('[LOGIN] Erro DB:', err);
            return res.status(500).json({ success: false, message: 'Erro no servidor' });
        }

        if (!user) {
            console.log(`[LOGIN] Usuário não encontrado: ${email}`);
            return res.json({ success: false, message: 'Credenciais inválidas' });
        }

        console.log(`[LOGIN] Usuário encontrado: ${user.email}`);

        try {
            const ok = await bcrypt.compare(password, user.senha);
            
            if (!ok) {
                console.log('[LOGIN] Senha incorreta');
                return res.json({ success: false, message: 'Credenciais inválidas' });
            }

            console.log('[LOGIN] Senha correta');
            
            // ========== COMENTAR ESTA LINHA PARA DESABILITAR 2FA ==========
            // const need2FA = needs2FA(user.last_2fa_at);
            
            // ========== DESCOMENTAR ESTA LINHA PARA DESABILITAR 2FA ==========
            const need2FA = false; // Forçar login direto sem 2FA
            
            console.log(`[LOGIN] Precisa 2FA? ${need2FA}, last_2fa_at: ${user.last_2fa_at}`);

            if (need2FA) {
                const code = Math.floor(100000 + Math.random() * 900000).toString();
                console.log(`[LOGIN] Gerando novo código 2FA: ${code}`);

                db.run(
                    `UPDATE usuarios
                     SET twofa_code = ?,
                         twofa_expires_at = datetime('now', '+5 minutes')
                     WHERE id = ?`,
                    [code, user.id],
                    async (err) => {
                        if (err) {
                            console.error('[LOGIN] Erro ao atualizar 2FA:', err);
                            return res.status(500).json({ success: false, message: 'Erro ao gerar código' });
                        }

                        console.log(`[LOGIN] Código 2FA salvo no DB`);

                        try {
                            await sendEmail(
                                user.email,
                                'Código de verificação',
                                `Seu código de acesso é: ${code}`
                            );
                            console.log(`[LOGIN] Email 2FA enviado para ${user.email}`);
                            
                            console.log(`[LOGIN] Respondendo com require2FA=true`);
                            return res.status(200).json({ 
                                success: false,
                                require2FA: true, 
                                email: user.email,
                                name: user.nome
                            });
                            
                        } catch (emailErr) {
                            console.error('[LOGIN] Erro ao enviar email:', emailErr);
                            return res.status(500).json({ 
                                success: false, 
                                message: 'Erro ao enviar código por email' 
                            });
                        }
                    }
                );
            } else {
                console.log('[LOGIN] 2FA não necessário, fazendo login direto');
                db.run(
                    `UPDATE usuarios SET ultimo_login = datetime('now') WHERE id = ?`,
                    [user.id],
                    (err) => {
                        if (err) {
                            console.error('[LOGIN] Erro ao atualizar login:', err);
                        }

                        req.session.userId = user.id;
                        req.session.email = user.email;

                        console.log(`[LOGIN] Login direto bem-sucedido`);
                        
                        // ✅ Retornar nome e email para o frontend
                        res.json({ 
                            success: true, 
                            message: 'Login realizado',
                            name: user.nome,
                            email: user.email
                        });
                    }
                );
            }
        } catch (error) {
            console.error('[LOGIN] Erro ao comparar senha:', error);
            res.status(500).json({ success: false, message: 'Erro no servidor' });
        }
    });
});

app.post('/verify-2fa', (req, res) => {
    const { email, code } = req.body;
    console.log(`[2FA] Tentativa de verificação - Email: ${email}, Código: ${code}`);

    if (!email || !code) {
        return res.status(400).json({ success: false, message: 'Email e código obrigatórios' });
    }

    db.get(
        `SELECT * FROM usuarios
         WHERE email = ?
           AND twofa_code = ?
           AND twofa_expires_at > datetime('now')`,
        [email, code],
        (err, user) => {
            if (err) {
                console.error('[2FA] Erro DB:', err);
                return res.status(500).json({ success: false, message: 'Erro no servidor' });
            }

            if (!user) {
                console.log('[2FA] Código inválido ou expirado');
                return res.json({ success: false, message: 'Código inválido ou expirado' });
            }

            console.log('[2FA] Código válido, criando sessão');
            req.session.userId = user.id;
            req.session.email = user.email;

            db.run(
                `UPDATE usuarios
                 SET twofa_code = NULL,
                     twofa_expires_at = NULL,
                     last_2fa_at = datetime('now'),
                     ultimo_login = datetime('now')
                 WHERE id = ?`,
                [user.id],
                (err) => {
                    if (err) {
                        console.error('[2FA] Erro ao atualizar 2FA:', err);
                    }
                    console.log('[2FA] Verificação concluída com sucesso');
                    
                    // ✅ Retornar nome e email para o frontend
                    res.json({ 
                        success: true, 
                        message: '2FA verificado com sucesso',
                        name: user.nome,
                        email: user.email
                    });
                }
            );
        }
    );
});

// Rota para verificar se o usuário está autenticado
app.get('/check-auth', (req, res) => {
    if (req.session.userId) {
        res.json({ authenticated: true, email: req.session.email });
    } else {
        res.json({ authenticated: false });
    }
});

// Rota para obter informações do usuário
app.get('/user-info', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: 'Não autenticado' });
    }

    db.get(
        `SELECT id, nome, email FROM usuarios WHERE id = ?`,
        [req.session.userId],
        (err, user) => {
            if (err) {
                console.error('[USER-INFO] Erro DB:', err);
                return res.status(500).json({ success: false, message: 'Erro no servidor' });
            }

            if (!user) {
                return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
            }

            res.json({
                success: true,
                name: user.nome,
                email: user.email
            });
        }
    );
});

// Rota para trocar senha
app.post('/change-password', async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;
    console.log(`[CHANGE-PASSWORD] Tentativa para email: ${email}`);

    if (!email || !currentPassword || !newPassword) {
        return res.status(400).json({ 
            success: false, 
            message: 'Dados incompletos' 
        });
    }

    db.get(`SELECT * FROM usuarios WHERE email = ?`, [email], async (err, user) => {
        if (err) {
            console.error('[CHANGE-PASSWORD] Erro DB:', err);
            return res.status(500).json({ success: false, message: 'Erro no servidor' });
        }

        if (!user) {
            console.log('[CHANGE-PASSWORD] Usuário não encontrado');
            return res.json({ success: false, message: 'Usuário não encontrado' });
        }

        try {
            // Verificar senha atual
            const ok = await bcrypt.compare(currentPassword, user.senha);
            
            if (!ok) {
                console.log('[CHANGE-PASSWORD] Senha atual incorreta');
                return res.json({ success: false, message: 'Senha atual incorreta' });
            }

            // Hash da nova senha
            const newHash = await bcrypt.hash(newPassword, 10);

            // Atualizar no banco
            db.run(
                `UPDATE usuarios SET senha = ? WHERE id = ?`,
                [newHash, user.id],
                (err) => {
                    if (err) {
                        console.error('[CHANGE-PASSWORD] Erro ao atualizar:', err);
                        return res.status(500).json({ 
                            success: false, 
                            message: 'Erro ao atualizar senha' 
                        });
                    }

                    console.log('[CHANGE-PASSWORD] Senha alterada com sucesso');
                    res.json({ 
                        success: true, 
                        message: 'Senha alterada com sucesso' 
                    });
                }
            );

        } catch (error) {
            console.error('[CHANGE-PASSWORD] Erro:', error);
            res.status(500).json({ success: false, message: 'Erro no servidor' });
        }
    });
});

// Rota para logout
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('[LOGOUT] Erro:', err);
            return res.status(500).json({ success: false, message: 'Erro ao fazer logout' });
        }
        res.clearCookie('movimento.sid');
        res.json({ success: true, message: 'Logout realizado' });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Backend rodando em http://localhost:${PORT}`);
});