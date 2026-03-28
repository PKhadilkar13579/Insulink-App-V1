const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;

const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

const comparePassword = async (plain, hash) => {
  return await bcrypt.compare(plain, hash);
};

module.exports = {
  hashPassword,
  comparePassword,
};
