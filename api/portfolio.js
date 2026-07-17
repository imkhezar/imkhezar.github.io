// GET    /api/portfolio            -> published portfolio items (public)
// GET    /api/portfolio?all=true   -> all items incl. unpublished (admin only)
// POST   /api/portfolio            -> create an item (admin only)
// PUT    /api/portfolio            -> update an item, body must include id (admin only)
// DELETE /api/portfolio?id=123     -> delete an item (admin only)

const { sql } = require('./_db');
const { isAuthorized } = require('./_auth');

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const authed = isAuthorized(req);
      const wantsAll = req.query.all === 'true';

      const rows =
        authed && wantsAll
          ? await sql`SELECT * FROM portfolio_items ORDER BY sort_order ASC, id ASC`
          : await sql`SELECT * FROM portfolio_items WHERE is_published = true ORDER BY sort_order ASC, id ASC`;

      res.status(200).json(rows);
      return;
    }

    if (!isAuthorized(req)) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    if (req.method === 'POST') {
      const { title, caption, image_url, sort_order, is_published } = req.body || {};

      if (!title || !caption || !image_url) {
        res.status(400).json({ error: 'title, caption and image_url are required' });
        return;
      }

      const [row] = await sql`
        INSERT INTO portfolio_items (title, caption, image_url, sort_order, is_published)
        VALUES (${title}, ${caption}, ${image_url}, ${sort_order ?? 0}, ${is_published ?? true})
        RETURNING *`;

      res.status(201).json(row);
      return;
    }

    if (req.method === 'PUT') {
      const { id, title, caption, image_url, sort_order, is_published } = req.body || {};

      if (!id) {
        res.status(400).json({ error: 'id is required' });
        return;
      }

      const [row] = await sql`
        UPDATE portfolio_items SET
          title        = COALESCE(${title}, title),
          caption      = COALESCE(${caption}, caption),
          image_url    = COALESCE(${image_url}, image_url),
          sort_order   = COALESCE(${sort_order}, sort_order),
          is_published = COALESCE(${is_published}, is_published)
        WHERE id = ${id}
        RETURNING *`;

      if (!row) {
        res.status(404).json({ error: 'Portfolio item not found' });
        return;
      }

      res.status(200).json(row);
      return;
    }

    if (req.method === 'DELETE') {
      const id = req.query.id || (req.body && req.body.id);
      if (!id) {
        res.status(400).json({ error: 'id is required' });
        return;
      }

      await sql`DELETE FROM portfolio_items WHERE id = ${id}`;
      res.status(204).end();
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};
