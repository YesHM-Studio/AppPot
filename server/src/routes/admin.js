import { Router } from 'express';
import db from '../db/index.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware, adminOnly);

router.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

router.get('/reports', (req, res) => {
  const reports = db.prepare(`
    SELECT r.*, u1.name as reporter_name, u2.name as target_name
    FROM reports r
    JOIN users u1 ON r.reporter_id = u1.id
    JOIN users u2 ON r.target_id = u2.id
    ORDER BY r.created_at DESC
  `).all();
  res.json(reports);
});

router.get('/payments', (req, res) => {
  const payments = db.prepare(`
    SELECT p.*, u1.name as buyer_name, u2.name as seller_name
    FROM payments p
    JOIN users u1 ON p.buyer_id = u1.id
    JOIN users u2 ON p.seller_id = u2.id
    ORDER BY p.created_at DESC
  `).all();
  res.json(payments);
});

router.patch('/payments/:id/approve', (req, res) => {
  db.prepare('UPDATE payments SET status = ? WHERE id = ? AND status = ?').run('completed', req.params.id, 'escrow');
  res.json({ message: '정산이 승인되었습니다.' });
});

export default router;
