// Shared database connection.
// Filename starts with "_" so Vercel does NOT expose this as its own
// API endpoint — it's a helper imported by the real routes.

const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Add it in Vercel → Project → Settings → Environment Variables.'
  );
}

const sql = neon(process.env.DATABASE_URL);

module.exports = { sql };
