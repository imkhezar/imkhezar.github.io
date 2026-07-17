// GET    /api/services            -> published services (public)
// GET    /api/services?all=true   -> all services incl. unpublished (admin only)
// POST   /api/services            -> create a service (admin only)
// PUT    /api/services            -> update a service, body must include id (admin only)
// DELETE /api/services?id=123     -> delete a service (admin only)

const { sql } = require('./_db');
const { isAuthorized } = require('./_auth');

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const authed = isAuthorized(req);
      const wantsAll = req.query.all === 'true';

      const rows =
        authed && wantsAll
          ? await sql`SELECT * FROM services ORDER BY sort_order ASC, id ASC`
          : await sql`SELECT * FROM services WHERE is_published = true ORDER BY sort_order ASC, id ASC`;

      res.status(200).json(rows);
      return;
    }

    // Everything below requires a valid admin token.
    if (!isAuthorized(req)) {
      res.status(401).json({ error: 'Not authorized' });
      return;
    }

    if (req.method === 'POST') {
      const {
        category,
        title,
        description,
        delivery_time,
        price_type,
        price_label,
        details,
        sort_order,
        is_published,
      } = req.body || {};

      if (!category || !title || !description) {
        res.status(400).json({ error: 'category, title and description are required' });
        return;
      }

      const [row] = await sql`
        INSERT INTO services
          (category, title, description, delivery_time, price_type, price_label, details, sort_order, is_published)
        VALUES
          (${category}, ${title}, ${description}, ${delivery_time || null},
           ${price_type || 'quote'}, ${price_label || null}, ${details || []},
           ${sort_order ?? 0}, ${is_published ?? true})
        RETURNING *`;

      res.status(201).json(row);
      return;
    }

    if (req.method === 'PUT') {
      const {
        id,
        category,
        title,
        description,
        delivery_time,
        price_type,
        price_label,
        details,
        sort_order,
        is_published,
      } = req.body || {};

      if (!id) {
        res.status(400).json({ error: 'id is required' });
        return;
      }

      const [row] = await sql`
        UPDATE services SET
          category      = COALESCE(${category}, category),
          title         = COALESCE(${title}, title),
          description   = COALESCE(${description}, description),
          delivery_time = COALESCE(${delivery_time}, delivery_time),
          price_type    = COALESCE(${price_type}, price_type),
          price_label   = ${price_label ?? null},
          details       = COALESCE(${details}, details),
          sort_order    = COALESCE(${sort_order}, sort_order),
          is_published  = COALESCE(${is_published}, is_published)
        WHERE id = ${id}
        RETURNING *`;

      if (!row) {
        res.status(404).json({ error: 'Service not found' });
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

      await sql`DELETE FROM services WHERE id = ${id}`;
      res.status(204).end();
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};
