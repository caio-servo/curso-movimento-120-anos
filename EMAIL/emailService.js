// fazer const do banco de dados novamente
const { generateRandomPassword } = require("../email/geraSenha");
const { sendEmail } = require("./sendEmail");
const prisma = new PrismaClient();

async function resetExpiredPassword(user) {
  const newPassword = generateRandomPassword();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: newPassword,
      passwordLastReset: new Date(),
    },
  });

  await sendEmail(
    user.email,
    "Sua nova senha do curso",
    `Sua senha expirou e foi gerada uma nova.\n\nNova senha: ${newPassword}`
  );

  return newPassword;
}

module.exports = { resetExpiredPassword };

