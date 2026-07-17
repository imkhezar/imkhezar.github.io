// Shared auth helpers — signs and verifies a simple token for the
// single admin user. No user table, no third-party auth service:
// just a password check (in login.js) plus a signed, expiring token.
//
// Filename starts with "_" so Vercel does NOT expose this as its own
// API endpoint.

const crypto = require('crypto');

function base64url(buf) {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64url(str) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 hours

function createToken() {
  const secret = requireSecret();
  const payload = JSON.stringify({ exp: Date.now() + TOKEN_LIFETIME_MS });
  const payloadB64 = base64url(Buffer.from(payload));
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest();
  return `${payloadB64}.${base64url(signature)}`;
}

function verifyToken(token) {
  try {
    const secret = requireSecret();
    const [payloadB64, sigB64] = String(token).split('.');
    if (!payloadB64 || !sigB64) return false;

    const expectedSig = base64url(
      crypto.createHmac('sha256', secret).update(payloadB64).digest()
    );

    const a = Buffer.from(sigB64);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length) return false;
    if (!crypto.timingSafeEqual(a, b)) return false;

    const payload = JSON.parse(fromBase64url(payloadB64).toString());
    return Date.now() < payload.exp;
  } catch (err) {
    return false;
  }
}

function requireSecret() {
  if (!process.env.AUTH_SECRET) {
    throw new Error(
      'AUTH_SECRET is not set. Add it in Vercel → Project → Settings → Environment Variables.'
    );
  }
  return process.env.AUTH_SECRET;
}

// Call at the top of any admin-only route. Returns true if the
// request carries a valid token, false otherwise.
function isAuthorized(req) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return false;
  return verifyToken(token);
}

module.exports = { createToken, verifyToken, isAuthorized };
