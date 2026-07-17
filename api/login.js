// POST /api/login
// Body: { "password": "..." }
// Returns: { "token": "..." } on success, 401 on wrong password.

const { createToken } = require('./_auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!process.env.ADMIN_PASSWORD) {
    res.status(500).json({
      error: 'ADMIN_PASSWORD is not set. Add it in Vercel → Project → Settings → Environment Variables.',
    });
    return;
  }

  const { password } = req.body || {};

  if (typeof password !== 'string' || password !== process.env.ADMIN_PASSWORD) {
    // Same message either way — don't reveal whether the field was missing
    // or just wrong.
    res.status(401).json({ error: 'Incorrect password' });
    return;
  }

  const token = createToken();
  res.status(200).json({ token });
};
