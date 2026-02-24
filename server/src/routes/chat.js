import { Router } from 'express';
import db from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/rooms', authMiddleware, (req, res) => {
  const rooms = db.prepare(`
    SELECT cr.*, p.title as project_title, p.id as project_id,
    u1.name as client_name, u2.name as seller_name
    FROM chat_rooms cr
    JOIN projects p ON cr.project_id = p.id
    JOIN users u1 ON cr.client_id = u1.id
    JOIN users u2 ON cr.seller_id = u2.id
    WHERE cr.client_id = ? OR cr.seller_id = ?
  `).all(req.user.id, req.user.id);
  res.json(rooms);
});

router.get('/rooms/:roomId/messages', authMiddleware, (req, res) => {
  const room = db.prepare('SELECT * FROM chat_rooms WHERE id = ?').get(req.params.roomId);
  if (!room) return res.status(404).json({ error: '채팅방을 찾을 수 없습니다.' });
  if (room.client_id !== req.user.id && room.seller_id !== req.user.id) {
    return res.status(403).json({ error: '접근 권한이 없습니다.' });
  }
  const messages = db.prepare(`
    SELECT m.*, u.name as sender_name
    FROM chat_messages m JOIN users u ON m.sender_id = u.id
    WHERE m.room_id = ? ORDER BY m.created_at ASC
  `).all(req.params.roomId);
  res.json(messages);
});

router.post('/rooms', authMiddleware, (req, res) => {
  const { project_id, seller_id } = req.body;
  if (!project_id || !seller_id) return res.status(400).json({ error: 'project_id, seller_id 필요' });
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id);
  if (!project || project.client_id !== req.user.id) return res.status(403).json({ error: '권한 없음' });

  let room = db.prepare('SELECT * FROM chat_rooms WHERE project_id = ? AND client_id = ? AND seller_id = ?')
    .get(project_id, req.user.id, seller_id);
  if (!room) {
    const id = uuidv4();
    db.prepare('INSERT INTO chat_rooms (id, project_id, client_id, seller_id) VALUES (?, ?, ?, ?)')
      .run(id, project_id, req.user.id, seller_id);
    room = db.prepare('SELECT * FROM chat_rooms WHERE id = ?').get(id);
  }
  res.json(room);
});

export default router;
