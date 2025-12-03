// fazer um cons do banco de dados que está sendo usado
const { resetExpiredPassword } = require("../email/emailService");
const prisma = new PrismaClient();

function passwordExpired(lastReset) {
  const now = new Date();
  const diff = now - lastReset;
  const days = diff / (1000 * 60 * 60 * 24);
  return days >= 7;
}

async function login(req, res) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ error: "Usuário não encontrado" });

  //se a senha expirou
  if (passwordExpired(user.passwordLastReset)) {
    await resetExpiredPassword(user);
    return res.status(400).json({
      error: "Sua senha expirou. Uma nova foi enviada ao seu e-mail."
    });
  }

  //verifica senha se expirou
  if (user.password !== password) {
    return res.status(400).json({ error: "Senha incorreta" });
  }

  return res.json({ success: true, message: "Login OK" });
}

module.exports = { login };

