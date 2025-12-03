function generateRandomPassword() {
  return Math.random().toString(36).slice(-8); // Ex: j82klsa1
}

module.exports = { generateRandomPassword };

