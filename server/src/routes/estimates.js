import { Router } from 'express';
import db from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/', authMiddleware, (req, res) => {
  const { project_id, amount, message, delivery_days } = req.body;
  if (!project_id || !amount) return res.status(400).json({ error: '프로젝트와 견적 금액은 필수입니다.' });
  if (req.user.role !== 'seller') return res.status(403).json({ error: '판매자만 견적을 제안할 수 있습니다.' });

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id);
  if (!project) return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
  if (project.status !== 'open') return res.status(400).json({ error: '이미 진행 중이거나 완료된 프로젝트입니다.' });

  const exists = db.prepare('SELECT id FROM estimates WHERE project_id = ? AND seller_id = ?').get(project_id, req.user.id);
  if (exists) return res.status(400).json({ error: '이미 견적을 제출했습니다.' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO estimates (id, project_id, seller_id, amount, message, delivery_days)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, project_id, req.user.id, parseInt(amount), message || '', delivery_days ? parseInt(delivery_days) : null);

  const estimate = db.prepare(`
    SELECT e.*, u.name as seller_name
    FROM estimates e JOIN users u ON e.seller_id = u.id
    WHERE e.id = ?
  `).get(id);
  res.status(201).json(estimate);
});

router.patch('/:id/accept', authMiddleware, (req, res) => {
  const estimate = db.prepare('SELECT * FROM estimates WHERE id = ?').get(req.params.id);
  if (!estimate) return res.status(404).json({ error: '견적을 찾을 수 없습니다.' });
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(estimate.project_id);
  if (project.client_id !== req.user.id) return res.status(403).json({ error: '의뢰자만 견적을 수락할 수 있습니다.' });
  if (estimate.status !== 'pending') return res.status(400).json({ error: '이미 처리된 견적입니다.' });

  db.prepare('UPDATE estimates SET status = ? WHERE project_id = ?').run('rejected', estimate.project_id);
  db.prepare('UPDATE estimates SET status = ? WHERE id = ?').run('accepted', req.params.id);
  db.prepare('UPDATE projects SET status = ? WHERE id = ?').run('in_progress', estimate.project_id);
  res.json({ message: '견적이 수락되었습니다.' });
});

export default router;
