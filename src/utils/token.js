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

function parseBase64UrlJson(value) {
  try {
    const decoded = Buffer.from(value, 'base64url').toString('utf8');
    return JSON.parse(decoded);
  } catch (error) {
    throw new AppError('Token invalido', 401);
  }
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') {
    throw new AppError('Token invalido', 401);
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new AppError('Token invalido', 401);
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = createHmac('sha256', getJwtSecret()).update(unsignedToken).digest('base64url');

  if (encodedSignature !== expectedSignature) {
    throw new AppError('Token invalido', 401);
  }

  const header = parseBase64UrlJson(encodedHeader);
  if (header.alg !== 'HS256' || header.typ !== 'JWT') {
    throw new AppError('Token invalido', 401);
  }

  const payload = parseBase64UrlJson(encodedPayload);
  if (!payload.exp || typeof payload.exp !== 'number') {
    throw new AppError('Token invalido', 401);
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    throw new AppError('Token expirado', 401);
  }

  return payload;
}

module.exports = {
  signToken,
  verifyToken,
};
