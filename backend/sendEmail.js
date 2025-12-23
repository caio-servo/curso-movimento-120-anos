// Biblioteca responsável pelo envio de e-mails via SMTP
const nodemailer = require('nodemailer');

// SQLite para buscar as configurações SMTP salvas no banco
const sqlite3 = require('sqlite3').verbose();

// Conexão com o banco de dados local
const db = new sqlite3.Database('./database.db');

/**
 * Envia um e-mail utilizando as configurações SMTP salvas no banco
 *
 * @param {string} to - Destinatário do e-mail
 * @param {string} subject - Assunto do e-mail
 * @param {string} text - Corpo do e-mail (texto simples)
 * @returns {Promise<boolean>} - Resolve true se enviar com sucesso
 */
function sendEmail(to, subject, text) {
    return new Promise((resolve, reject) => {

        // Busca a configuração SMTP cadastrada no banco
        db.get(`SELECT * FROM smtp_config LIMIT 1`, async (err, cfg) => {

            // Caso não exista configuração ou ocorra erro na consulta
            if (err || !cfg) {
                return reject('Configuração SMTP não encontrada');
            }

            // Cria o transportador SMTP com base nas configurações do banco
            const transporter = nodemailer.createTransport({
                host: cfg.host,                 // Servidor SMTP (ex: smtp.gmail.com)
                port: cfg.port,                 // Porta SMTP (587 ou 465)
                secure: cfg.secure === 1,       // true = SSL (465) | false = STARTTLS (587)
                auth: {
                    user: cfg.email,            // E-mail remetente
                    pass: cfg.senha             // Senha de app / senha SMTP
                },
                // Obriga uso de TLS quando a porta for 587 (STARTTLS)
                requireTLS: cfg.port === 587
            });

            try {
                // Envia o e-mail
                await transporter.sendMail({
                    from: cfg.email,            // Remetente
                    to,                          // Destinatário
                    subject,                     // Assunto
                    text                         // Corpo do e-mail
                });

                // Sucesso no envio
                resolve(true);

            } catch (e) {
                // Erro no envio do e-mail
                reject(e);
            }
        });
    });
}

// Exporta a função para ser utilizada no login, 2FA, reset de senha, etc.
module.exports = { sendEmail };

