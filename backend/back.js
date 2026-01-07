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
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, res, next)=>{
    console.log("req", req.method);
    next();
})

// app.use(cors());

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

//  MIDDLEWARE DE ADMIN 
const requireAdmin = (req, res, next) => {
    if (!req.session.userId) {
        console.log('[ADMIN] Usuário não autenticado');
        return res.status(401).json({ success: false, message: 'Não autenticado' });
    }

    db.get(
        `SELECT isAdmin FROM usuarios WHERE id = ?`,
        [req.session.userId],
        (err, user) => {
            if (err || !user || !user.isAdmin) {
                console.log('[ADMIN] Usuário não é admin ou erro:', err);
                return res.status(403).json({ success: false, message: 'Acesso negado' });
            }
            next();
        }
    );
};

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
            `INSERT INTO usuarios (nome, email, senha, status, isAdmin, ultimo_login)
             VALUES (?, ?, ?, 'ativo', 0, datetime('now'))`,
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

        // 🔒 Verificar se usuário está inativo
        if (user.status === 'inativo') {
            console.log(`[LOGIN] Usuário inativo: ${email}`);
            return res.json({ success: false, message: 'Usuário inativo. Contate o administrador.' });
        }

        console.log(`[LOGIN] Usuário encontrado: ${user.email}`);

        try {
            const ok = await bcrypt.compare(password, user.senha);
            
            if (!ok) {
                console.log('[LOGIN] Senha incorreta');
                return res.json({ success: false, message: 'Credenciais inválidas' });
            }

            console.log('[LOGIN] Senha correta');
            
            //Habilita 2FA 
            const need2FA = needs2FA(user.last_2fa_at);
            
            // DESABILITAR 2FA 
            //const need2FA = false; 
            
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
                        
                        // ✅ Retornar nome, email E isAdmin para o frontend
                        res.json({ 
                            success: true, 
                            message: 'Login realizado',
                            name: user.nome,
                            email: user.email,
                            isAdmin: user.isAdmin === 1  // 🆕 ADICIONADO
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
                    
                    // ✅ Retornar nome, email E isAdmin para o frontend
                    res.json({ 
                        success: true, 
                        message: '2FA verificado com sucesso',
                        name: user.nome,
                        email: user.email,
                        isAdmin: user.isAdmin === 1  // 🆕 ADICIONADO
                    });
                }
            );
        }
    );
});

// Rota para verificar se o usuário está autenticado
app.get('/check-auth', (req, res) => {
    if (req.session.userId) {
        db.get(
            `SELECT isAdmin, status FROM usuarios WHERE id = ?`,
            [req.session.userId],
            (err, user) => {
                if (err || !user) {
                    return res.json({ authenticated: false });
                }
                res.json({ 
                    authenticated: true, 
                    email: req.session.email,
                    isAdmin: user.isAdmin === 1,
                    status: user.status
                });
            }
        );
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
        `SELECT id, nome, email, isAdmin, status FROM usuarios WHERE id = ?`,
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
                email: user.email,
                isAdmin: user.isAdmin === 1,
                status: user.status
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


// Adicione ANTES da linha 599 (antes do POST /modulos/:cursoId)

// POST - Criar módulo recebendo curso_id no body
app.post('/modulos', requireAdmin, (req, res) => {
    const { curso_id, nome, descricao } = req.body;
    console.log(`[MODULOS] Criando módulo "${nome}" para curso ${curso_id}`);

    if (!curso_id || !nome) {
        return res.status(400).json({ 
            success: false, 
            message: 'curso_id e nome são obrigatórios' 
        });
    }

    db.run(
        `INSERT INTO modulos (nome, descricao, curso_id, created_at)
         VALUES (?, ?, ?, datetime('now'))`,
        [nome.trim(), descricao?.trim() || '', curso_id],
        function(err) {
            if (err) {
                console.error('[MODULOS] Erro ao criar:', err);
                return res.status(500).json({ success: false, message: 'Erro ao criar módulo' });
            }

            console.log(`[MODULOS] Módulo criado com ID: ${this.lastID}`);
            res.json({ 
                success: true, 
                message: 'Módulo criado com sucesso',
                id: this.lastID,
                modulo: {
                    id: this.lastID,
                    nome,
                    descricao: descricao || '',
                    curso_id
                }
            });
        }
    );
});

// ============================================
// ROTAS ADMIN - GERENCIAMENTO DE CLIENTES
// ============================================

// Lista todos os clientes
app.get('/admin/clientes', requireAdmin, (req, res) => {
    console.log('[ADMIN] Listando clientes');
    
    db.all(
        `SELECT id, nome as name, email, status, isAdmin, created_at 
         FROM usuarios 
         ORDER BY created_at DESC`,
        (err, clientes) => {
            if (err) {
                console.error('[ADMIN] Erro ao listar:', err);
                return res.status(500).json({ success: false, message: 'Erro no servidor' });
            }

            res.json({ 
                success: true, 
                clientes: clientes.map(c => ({
                    ...c,
                    isAdmin: c.isAdmin === 1
                }))
            });
        }
    );
});

// Cria novo cliente
app.post('/admin/clientes/create', requireAdmin, async (req, res) => {
    const { name, email, password, status } = req.body;
    console.log(`[ADMIN] Criando cliente: ${email}`);

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Dados incompletos' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);

        db.run(
            `INSERT INTO usuarios (nome, email, senha, status, isAdmin, ultimo_login)
             VALUES (?, ?, ?, ?, 0, datetime('now'))`,
            [name.trim(), email.trim(), hash, status || 'ativo'],
            function(err) {
                if (err) {
                    console.error('[ADMIN] Erro ao criar:', err);
                    return res.status(400).json({ success: false, message: 'Email já cadastrado' });
                }
                res.json({ 
                    success: true, 
                    message: 'Cliente cadastrado com sucesso', 
                    id: this.lastID 
                });
            }
        );
    } catch (error) {
        console.error('[ADMIN] Erro:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// Atualiza cliente
app.put('/admin/clientes/update/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, email, password, status } = req.body;
    console.log(`[ADMIN] Atualizando cliente: ${id}`);

    if (!name || !email) {
        return res.status(400).json({ success: false, message: 'Dados incompletos' });
    }

    try {
        let query = `UPDATE usuarios SET nome = ?, email = ?, status = ?`;
        let params = [name.trim(), email.trim(), status || 'ativo'];

        if (password) {
            const hash = await bcrypt.hash(password, 10);
            query += `, senha = ?`;
            params.push(hash);
        }

        query += ` WHERE id = ?`;
        params.push(id);

        db.run(query, params, function(err) {
            if (err) {
                console.error('[ADMIN] Erro ao atualizar:', err);
                return res.status(400).json({ success: false, message: 'Email já existe' });
            }
            res.json({ success: true, message: 'Cliente atualizado com sucesso' });
        });
    } catch (error) {
        console.error('[ADMIN] Erro:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// Alterna status do cliente
app.patch('/admin/clientes/toggle-status/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    console.log(`[ADMIN] Alternando status: ${id} para ${status}`);

    if (!['ativo', 'inativo'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Status inválido' });
    }

    db.run(
        `UPDATE usuarios SET status = ? WHERE id = ?`,
        [status, id],
        function(err) {
            if (err) {
                console.error('[ADMIN] Erro ao alternar:', err);
                return res.status(500).json({ success: false, message: 'Erro no servidor' });
            }
            res.json({ success: true, message: 'Status alterado com sucesso' });
        }
    );
});
// DELETE - Excluir cliente (apenas admin)
app.delete('/admin/clientes/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    console.log(`[ADMIN] Deletando cliente: ${id}`);

    if (!id) {
        return res.status(400).json({ success: false, message: 'ID do cliente é obrigatório' });
    }

    db.run(
        `DELETE FROM usuarios WHERE id = ?`,
        [id],
        function(err) {
            if (err) {
                console.error('[ADMIN] Erro ao deletar:', err);
                return res.status(500).json({ success: false, message: 'Erro ao deletar cliente' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
            }

            console.log(`[ADMIN] Cliente ${id} deletado com sucesso`);
            res.json({ 
                success: true, 
                message: 'Cliente deletado com sucesso' 
            });
        }
    );
});

// ============================================
// ROTAS PARA GERENCIAMENTO DE CURSOS (ADMIN)
// ============================================

// GET - Listar todos os cursos
app.get('/cursos/', (req, res) => {
    console.log('[CURSOS] Listando cursos');
    
    db.all(
        `SELECT id, nome, descricao, tipo, disponivel, created_at 
         FROM cursos 
         ORDER BY created_at DESC`,
        (err, cursos) => {
            if (err) {
                console.error('[CURSOS] Erro ao listar:', err);
                return res.status(500).json({ success: false, message: 'Erro no servidor' });
            }

            res.json({ 
                success: true, 
                cursos: cursos.map(c => ({
                    ...c,
                    disponivel: c.disponivel === 1
                }))
            });
        }
    );
});

// POST - Criar novo curso (apenas admin)
app.post('/cursos/', requireAdmin, (req, res) => {
    const { nome, descricao, tipo, disponivel } = req.body;
    console.log(`[CURSOS] Criando novo curso: ${nome}`);

    if (!nome || !descricao || !tipo) {
        return res.status(400).json({ success: false, message: 'Dados incompletos' });
    }

    const disponibilidade = disponivel === true || disponivel === 'true' ? 1 : 0;

    db.run(
        `INSERT INTO cursos (nome, descricao, tipo, disponivel, created_at, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [nome.trim(), descricao.trim(), tipo, disponibilidade],
        function(err) {
            if (err) {
                console.error('[CURSOS] Erro ao criar:', err);
                return res.status(500).json({ success: false, message: 'Erro ao criar curso' });
            }

            console.log(`[CURSOS] Curso criado com ID: ${this.lastID}`);
            res.json({ 
                success: true, 
                message: 'Curso criado com sucesso',
                id: this.lastID,
                curso: {
                    id: this.lastID,
                    nome,
                    descricao,
                    tipo,
                    disponivel: disponibilidade === 1
                }
            });
        }
    );
});

// PUT - Atualizar curso (apenas admin)
app.put('/cursos/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { nome, descricao, tipo, disponivel } = req.body;
    console.log(`[CURSOS] Atualizando curso: ${id}`);

    if (!nome || !descricao || !tipo) {
        return res.status(400).json({ success: false, message: 'Dados incompletos' });
    }

    const disponibilidade = disponivel === true || disponivel === 'true' ? 1 : 0;

    db.run(
        `UPDATE cursos 
         SET nome = ?, descricao = ?, tipo = ?, disponivel = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [nome.trim(), descricao.trim(), tipo, disponibilidade, id],
        function(err) {
            if (err) {
                console.error('[CURSOS] Erro ao atualizar:', err);
                return res.status(500).json({ success: false, message: 'Erro ao atualizar curso' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Curso não encontrado' });
            }

            console.log(`[CURSOS] Curso ${id} atualizado com sucesso`);
            res.json({ 
                success: true, 
                message: 'Curso atualizado com sucesso',
                curso: {
                    id,
                    nome,
                    descricao,
                    tipo,
                    disponivel: disponibilidade === 1
                }
            });
        }
    );
});

// DELETE - Excluir curso (apenas admin)
app.delete('/cursos/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    console.log(`[CURSOS] Excluindo curso: ${id}`);

    db.run(
        `DELETE FROM cursos WHERE id = ?`,
        [id],
        function(err) {
            if (err) {
                console.error('[CURSOS] Erro ao excluir:', err);
                return res.status(500).json({ success: false, message: 'Erro ao excluir curso' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Curso não encontrado' });
            }

            console.log(`[CURSOS] Curso ${id} excluído com sucesso`);
            res.json({ 
                success: true, 
                message: 'Curso excluído com sucesso' 
            });
        }
    );
});

// ============================================
// ROTAS PARA GERENCIAMENTO DE MÓDULOS (ADMIN)
// ============================================

// GET - Listar todos os módulos e aulas
app.get('/modulos/:cursoId', (req, res) => {
    const { cursoId } = req.params;
    console.log('[MODULOS] Listando módulos e aulas');
    
    db.all(
        `SELECT id, nome, descricao, created_at 
         FROM modulos where curso_id = ${cursoId}
         ORDER BY created_at DESC`,
        (err, modulos) => {
            if (err) {
                console.error('[MODULOS] Erro ao listar módulos:', err);
                return res.status(500).json({ success: false, message: 'Erro no servidor' });
            }

            db.all(
                `SELECT a.id, a.modulo_id, a.titulo, a.descricao, a.youtube_id, a.duracao, a.created_at 
                 FROM aulas a
                 inner join modulos m on m.id = a.modulo_id
                 where m.curso_id = ${cursoId}
                 ORDER BY a.modulo_id, a.created_at ASC`,
                (err, aulas) => {
                    if (err) {
                        console.error('[MODULOS] Erro ao listar aulas:', err);
                        return res.status(500).json({ success: false, message: 'Erro no servidor' });
                    }

                    res.json({ 
                        success: true, 
                        modulos: modulos || [],
                        aulas: aulas || []
                    });
                }
            );
        }
    );
});




// POST - Criar novo módulo (apenas admin)
app.post('/modulos/:cursoId', requireAdmin, (req, res) => {
    const { cursoId } = req.params;
    const { nome, descricao } = req.body;
    console.log(`[MODULOS] Criando novo módulo: ${nome}`);

    if (!nome) {
        return res.status(400).json({ success: false, message: 'Nome do módulo é obrigatório' });
    }

    db.run(
        `INSERT INTO modulos (nome, descricao, curso_id, created_at)
         VALUES (?, ?, ?, datetime('now'))`,
        [nome.trim(), descricao?.trim() || '', cursoId],
        function(err) {
            if (err) {
                console.error('[MODULOS] Erro ao criar:', err);
                return res.status(500).json({ success: false, message: 'Erro ao criar módulo' });
            }

            console.log(`[MODULOS] Módulo criado com ID: ${this.lastID}`);
            res.json({ 
                success: true, 
                message: 'Módulo criado com sucesso',
                id: this.lastID,
                modulo: {
                    id: this.lastID,
                    nome,
                    descricao: descricao || ''
                }
            });
        }
    );
});

// PUT - Atualizar módulo (apenas admin)
app.put('/modulos/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { nome, descricao } = req.body;
    console.log(`[MODULOS] Atualizando módulo: ${id}`);

    if (!nome) {
        return res.status(400).json({ success: false, message: 'Nome do módulo é obrigatório' });
    }

    db.run(
         `UPDATE modulos 
         SET nome = ?, descricao = ?
         WHERE id = ?`,
        [nome.trim(), descricao?.trim() || '', id],
        function(err) {
            if (err) {
                console.error('[MODULOS] Erro ao atualizar:', err);
                return res.status(500).json({ success: false, message: 'Erro ao atualizar módulo' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Módulo não encontrado' });
            }

            console.log(`[MODULOS] Módulo ${id} atualizado com sucesso`);
            res.json({ 
                success: true, 
                message: 'Módulo atualizado com sucesso',
                modulo: {
                    id,
                    nome,
                    descricao: descricao || ''
                }
            });
        }
    );
});

// DELETE - Excluir módulo (apenas admin)
app.delete('/modulos/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    console.log(`[MODULOS] Excluindo módulo: ${id}`);

    db.run(
        `DELETE FROM aulas WHERE modulo_id = ?`,
        [id],
        (err) => {
            if (err) {
                console.error('[MODULOS] Erro ao deletar aulas:', err);
                return res.status(500).json({ success: false, message: 'Erro ao deletar' });
            }

            db.run(
                `DELETE FROM modulos WHERE id = ?`,
                [id],
                function(err) {
                    if (err) {
                        console.error('[MODULOS] Erro ao deletar:', err);
                        return res.status(500).json({ success: false, message: 'Erro ao deletar módulo' });
                    }

                    if (this.changes === 0) {
                        return res.status(404).json({ success: false, message: 'Módulo não encontrado' });
                    }

                    console.log(`[MODULOS] Módulo ${id} e suas aulas foram excluídos`);
                    res.json({ 
                        success: true, 
                        message: 'Módulo excluído com sucesso' 
                    });
                }
            );
        }
    );
});

// ============================================
// ROTAS PARA GERENCIAMENTO DE AULAS (ADMIN)
// ============================================

// POST - Criar nova aula (apenas admin)
app.post('/aulas', requireAdmin, (req, res) => {
    const { modulo_id, titulo, descricao, youtube_id, duracao } = req.body;
    console.log(`[AULAS] Criando nova aula: ${titulo}`);

    if (!modulo_id || !titulo || !youtube_id) {
        return res.status(400).json({ success: false, message: 'Dados obrigatórios faltando' });
    }

    db.run(
        `INSERT INTO aulas (modulo_id, titulo, descricao, youtube_id, duracao, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [modulo_id, titulo.trim(), descricao?.trim() || '', youtube_id, duracao || ''],
        function(err) {
            if (err) {
                console.error('[AULAS] Erro ao criar:', err);
                return res.status(500).json({ success: false, message: 'Erro ao criar aula' });
            }

            console.log(`[AULAS] Aula criada com ID: ${this.lastID}`);
            res.json({ 
                success: true, 
                message: 'Aula criada com sucesso',
                id: this.lastID,
                aula: {
                    id: this.lastID,
                    modulo_id,
                    titulo,
                    descricao: descricao || '',
                    youtube_id,
                    duracao: duracao || ''
                }
            });
        }
    );
});

// PUT - Atualizar aula (apenas admin)
app.put('/aulas/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { modulo_id, titulo, descricao, youtube_id, duracao } = req.body;
    console.log(`[AULAS] Atualizando aula: ${id}`);

    if (!modulo_id || !titulo || !youtube_id) {
        return res.status(400).json({ success: false, message: 'Dados obrigatórios faltando' });
    }

    db.run(
        `UPDATE aulas 
         SET modulo_id = ?, titulo = ?, descricao = ?, youtube_id = ?, duracao = ?
         WHERE id = ?`,
        [modulo_id, titulo.trim(), descricao?.trim() || '', youtube_id, duracao || '', id],
        function(err) {
            if (err) {
                console.error('[AULAS] Erro ao atualizar:', err);
                return res.status(500).json({ success: false, message: 'Erro ao atualizar aula' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Aula não encontrada' });
            }

            console.log(`[AULAS] Aula ${id} atualizada com sucesso`);
            res.json({ 
                success: true, 
                message: 'Aula atualizada com sucesso',
                aula: {
                    id,
                    modulo_id,
                    titulo,
                    descricao: descricao || '',
                    youtube_id,
                    duracao: duracao || ''
                }
            });
        }
    );
});

// DELETE - Excluir aula (apenas admin)
app.delete('/aulas/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    console.log(`[AULAS] Excluindo aula: ${id}`);

    db.run(
        `DELETE FROM aulas WHERE id = ?`,
        [id],
        function(err) {
            if (err) {
                console.error('[AULAS] Erro ao deletar:', err);
                return res.status(500).json({ success: false, message: 'Erro ao deletar aula' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Aula não encontrada' });
            }

            console.log(`[AULAS] Aula ${id} excluída com sucesso`);
            res.json({ 
                success: true, 
                message: 'Aula excluída com sucesso' 
            });
        }
    );
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Backend rodando em http://localhost:${PORT}`);
});
