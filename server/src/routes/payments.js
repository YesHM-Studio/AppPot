import { Router } from 'express';
import db from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/escrow', authMiddleware, (req, res) => {
  const { estimate_id } = req.body;
  if (!estimate_id) return res.status(400).json({ error: '견적 ID가 필요합니다.' });
  const estimate = db.prepare('SELECT * FROM estimates WHERE id = ?').get(estimate_id);
  if (!estimate || estimate.status !== 'accepted') return res.status(400).json({ error: '유효한 견적이 아닙니다.' });
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(estimate.project_id);
  if (project.client_id !== req.user.id) return res.status(403).json({ error: '의뢰자만 결제할 수 있습니다.' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO payments (id, project_id, estimate_id, buyer_id, seller_id, amount, status)
    VALUES (?, ?, ?, ?, ?, ?, 'escrow')
  `).run(id, project.id, estimate_id, req.user.id, estimate.seller_id, estimate.amount);

  // 실제 PG 연동 시 여기서 토스/아임포트 API 호출
  res.status(201).json({
    payment_id: id,
    amount: estimate.amount,
    status: 'escrow',
    message: '에스크로 결제가 생성되었습니다. (PG 연동 필요)'
  });
});

router.post('/:id/complete', authMiddleware, (req, res) => {
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
  if (!payment) return res.status(404).json({ error: '결제를 찾을 수 없습니다.' });
  if (payment.buyer_id !== req.user.id) return res.status(403).json({ error: '의뢰자만 완료 처리할 수 있습니다.' });
  if (payment.status !== 'escrow') return res.status(400).json({ error: '에스크로 상태만 완료 가능합니다.' });

  db.prepare('UPDATE payments SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?').run('completed', req.params.id);
  db.prepare('UPDATE projects SET status = ? WHERE id = ?').run('completed', payment.project_id);
  res.json({ message: '작업이 완료되었습니다. 정산 예정입니다.' });
});

export default router;
