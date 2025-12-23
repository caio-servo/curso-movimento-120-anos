const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // OBRIGATÓRIO para 587
    auth: {
        user: 'Movimento120anos@gmail.com',
        pass: 'nmsm aykm xitr lksp'
    }
});

async function test() {
    try {
        await transporter.sendMail({
            from: 'Movimento120anos@gmail.com',
            to: 'caiogvieira22@gmail.com',
            subject: 'Teste SMTP',
            text: 'Se você recebeu este e-mail, o SMTP está funcionando.'
        });

        console.log('EMAIL ENVIADO COM SUCESSO');
    } catch (err) {
        console.error('ERRO SMTP:', err);
    }
}

test();

