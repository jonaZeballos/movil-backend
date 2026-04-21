const { createHmac } = require('crypto');
const AppError = require('./appError');

function base64Url(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new AppError('Falta configurar JWT_SECRET', 500);
  }

  return process.env.JWT_SECRET;
}

function signToken(payload, options = {}) {
  const expiresInSeconds = options.expiresInSeconds ?? 60 * 60 * 8;
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  const body = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const unsignedToken = `${base64Url(header)}.${base64Url(body)}`;
  const signature = createHmac('sha256', getJwtSecret()).update(unsignedToken).digest('base64url');

  return `${unsignedToken}.${signature}`;
}

module.exports = {
  signToken,
};
