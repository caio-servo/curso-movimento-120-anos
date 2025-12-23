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

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);


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

CREATE INDEX IF NOT EXISTS idx_usuarios_email
ON usuarios(email);

CREATE INDEX IF NOT EXISTS idx_usuarios_wfa
ON usuarios(email, wfa_code);

