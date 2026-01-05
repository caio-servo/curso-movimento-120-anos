CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,

    ultimo_login DATETIME,

    last_2fa_at DATETIME,
    twofa_code TEXT,
    twofa_expires_at DATETIME,

    wfa_code TEXT,

    isAdmin INTEGER DEFAULT 0,
    status TEXT DEFAULT 'ativo' CHECK(status IN ('ativo', 'inativo')),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_isAdmin ON usuarios(isAdmin);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);


CREATE TABLE IF NOT EXISTS smtp_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    host TEXT NOT NULL,
    port INTEGER NOT NULL,
    email TEXT NOT NULL,
    senha TEXT NOT NULL,
    secure INTEGER DEFAULT 1
);

INSERT OR IGNORE INTO smtp_config (
    id, host, port, email, senha, secure
) VALUES (
    1,
    'smtp.gmail.com',
    587,
    'seu-email@gmail.com',
    'sua-senha-de-app',
    1
);

CREATE INDEX IF NOT EXISTS idx_usuarios_wfa
ON usuarios(email, wfa_code);


CREATE TABLE IF NOT EXISTS cursos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descricao TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('oficial', 'breve')),
    disponivel INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cursos_disponivel ON cursos(disponivel);
CREATE INDEX IF NOT EXISTS idx_cursos_tipo ON cursos(tipo);


CREATE TABLE IF NOT EXISTS modulos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descricao TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_modulos_created ON modulos(created_at);


CREATE TABLE IF NOT EXISTS aulas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    modulo_id INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    youtube_id TEXT NOT NULL,
    duracao TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (modulo_id) REFERENCES modulos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_aulas_modulo ON aulas(modulo_id);
CREATE INDEX IF NOT EXISTS idx_aulas_created ON aulas(created_at);


CREATE TABLE IF NOT EXISTS anexos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aula_id INTEGER NOT NULL,
    nome_arquivo TEXT NOT NULL,
    caminho_arquivo TEXT NOT NULL,
    tamanho INTEGER,
    tipo_arquivo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aula_id) REFERENCES aulas(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_anexos_aula ON anexos(aula_id);