const nodemailer = require("nodemailer");
  // fazer const do banco de dados tbm

async function sendEmail(to, subject, message) {
  const config = await //coloca a função do banco aq ;

  if (!config) throw new Error("Configuração de e-mail não encontrada");

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.secure,
    auth: {
      user: config.emailUser,
      pass: config.emailPass
    }
  });

  await transporter.sendMail({
    from: config.emailUser,
    to,
    subject,
    text: message,
  });

  console.log("Email enviado para", to);
}

module.exports = { sendEmail };

