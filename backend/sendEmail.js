const nodemailer = require('nodemailer');

// ✅ CONFIGURAÇÃO DIRETA (igual ao seu teste que funciona)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // OBRIGATÓRIO para porta 587
    auth: {
        user: 'Movimento120anos@gmail.com',
        pass: 'nmsm aykm xitr lksp' // App Password do Gmail
    }
});

/**
 * Envia um e-mail de verificação 2FA
 *
 * @param {string} to - Email do destinatário
 * @param {string} subject - Assunto do e-mail
 * @param {string} text - Corpo do e-mail
 * @returns {Promise<boolean>} - True se enviado com sucesso
 */
async function sendEmail(to, subject, text) {
    return new Promise((resolve, reject) => {
        console.log(`[SENDMAIL] 📧 Enviando email para: ${to}`);
        console.log(`[SENDMAIL] Assunto: ${subject}`);

        transporter.sendMail({
            from: 'Movimento120anos@gmail.com',
            to: to,
            subject: subject,
            text: text,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #333;">Movimento 120 Anos</h2>
                    <p style="font-size: 16px;">${text}</p>
                    <p style="color: #999; font-size: 12px;">Este é um email automático. Não responda.</p>
                </div>
            `
        }, (error, info) => {
            if (error) {
                console.error('[SENDMAIL] ❌ ERRO ao enviar:', error.message);
                console.error('[SENDMAIL] Código do erro:', error.code);
                reject(error);
            } else {
                console.log('[SENDMAIL] ✅ Email enviado com sucesso!');
                console.log('[SENDMAIL] ID da mensagem:', info.messageId);
                resolve(true);
            }
        });
    });
}

module.exports = { sendEmail };