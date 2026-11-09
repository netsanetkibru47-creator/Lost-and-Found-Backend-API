import express from 'express';
import pool from '../db.js';
import { validateItem, CATEGORIES } from '../validation.js';

const router = express.Router();

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const formatItem = (row) => ({ ...row, is_claimed: Boolean(row.is_claimed) });

async function findItem(id) {
  const [rows] = await pool.execute('SELECT * FROM items WHERE id = ?', [id]);
  return rows[0] ? formatItem(rows[0]) : null;
}

// Validates :id for every route that has it
router.param('id', (req, res, next, id) => {
  if (!/^[1-9]\d{0,9}$/.test(id)) {
    return res.status(400).json({ error: 'Invalid id: must be a positive integer' });
  }
  req.itemId = Number(id);
  next();
});

// 1. Get all items (optional: ?category=keys&claimed=true)
router.get('/', wrap(async (req, res) => {
  const where = [];
  const params = [];

  if (req.query.category !== undefined) {
    if (!CATEGORIES.includes(req.query.category)) {
      return res.status(400).json({ error: `category must be one of: ${CATEGORIES.join(', ')}` });
    }
    where.push('category = ?');
    params.push(req.query.category);
  }
  if (req.query.claimed !== undefined) {
    if (!['true', 'false'].includes(req.query.claimed)) {
      return res.status(400).json({ error: 'claimed must be true or false' });
    }
    where.push('is_claimed = ?');
    params.push(req.query.claimed === 'true' ? 1 : 0);
  }

  const sql = `SELECT * FROM items ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY found_at DESC, id DESC`;
  const [rows] = await pool.execute(sql, params);
  res.status(200).json(rows.map(formatItem));
}));

// 2. Get one item
router.get('/:id', wrap(async (req, res) => {
  const item = await findItem(req.itemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.status(200).json(item);
}));

// 3. Add an item
router.post('/', wrap(async (req, res) => {
  const { errors, data } = validateItem(req.body);
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

  const [result] = await pool.execute(
    `INSERT INTO items (name, description, category, found_location, found_at, is_claimed)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [data.name, data.description ?? null, data.category ?? 'other', data.found_location, data.found_at, data.is_claimed ?? false]
  );
  const item = await findItem(result.insertId);
  res.status(201).location(`/api/items/${result.insertId}`).json(item);
}));

// 4a. Update an item (full)
router.put('/:id', wrap(async (req, res) => {
  const { errors, data } = validateItem(req.body);
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
  if (!(await findItem(req.itemId))) return res.status(404).json({ error: 'Item not found' });

  await pool.execute(
    `UPDATE items
        SET name = ?, description = ?, category = ?, found_location = ?, found_at = ?, is_claimed = ?
      WHERE id = ?`,
    [data.name, data.description ?? null, data.category ?? 'other', data.found_location, data.found_at, data.is_claimed ?? false, req.itemId]
  );
  res.status(200).json(await findItem(req.itemId));
}));

// 4b. Update an item (partial, e.g. mark as claimed)
router.patch('/:id', wrap(async (req, res) => {
  const { errors, data } = validateItem(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
  if (!(await findItem(req.itemId))) return res.status(404).json({ error: 'Item not found' });

  // Column names come from the validator's whitelist, never from user input
  const columns = Object.keys(data);
  const setClause = columns.map((c) => `${c} = ?`).join(', ');
  await pool.execute(`UPDATE items SET ${setClause} WHERE id = ?`, [...columns.map((c) => data[c]), req.itemId]);
  res.status(200).json(await findItem(req.itemId));
}));

// 5. Delete an item
router.delete('/:id', wrap(async (req, res) => {
  const [result] = await pool.execute('DELETE FROM items WHERE id = ?', [req.itemId]);
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Item not found' });
  res.status(204).send();
}));

export default router;