const { randomBytes, scryptSync, timingSafeEqual } = require('crypto');

const HASH_PREFIX = 'scrypt';
const KEY_LENGTH = 64;

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex');

  return `${HASH_PREFIX}$${salt}$${hash}`;
}

function verifyPassword(password, storedPassword) {
  if (!storedPassword) {
    return false;
  }

  const [prefix, salt, storedHash] = storedPassword.split('$');

  if (prefix !== HASH_PREFIX || !salt || !storedHash) {
    return password === storedPassword;
  }

  const hash = scryptSync(password, salt, KEY_LENGTH);
  const storedBuffer = Buffer.from(storedHash, 'hex');

  if (hash.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(hash, storedBuffer);
}

module.exports = {
  hashPassword,
  verifyPassword,
};
