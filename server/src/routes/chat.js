import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import db from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const chatStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => cb(null, `chat-${uuidv4()}-${(file.originalname || 'file').replace(/[^a-zA-Z0-9._-]/g, '_')}`)
});
const chatUpload = multer({
  storage: chatStorage,
  limits: { fileSize: 1024 * 1024 * 1024 }
});

const router = Router();

router.get('/rooms', authMiddleware, (req, res) => {
  if (req.user.role === 'admin') {
    const rooms = db.prepare(`
      SELECT cr.*, p.title as project_title, p.id as project_id,
      u1.name as client_name, u2.name as seller_name
      FROM chat_rooms cr
      JOIN projects p ON cr.project_id = p.id
      JOIN users u1 ON cr.client_id = u1.id
      JOIN users u2 ON cr.seller_id = u2.id
      ORDER BY cr.created_at DESC
    `).all();
    return res.json(rooms);
  }
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
  const isParticipant = room.client_id === req.user.id || room.seller_id === req.user.id;
  if (!isParticipant && req.user.role !== 'admin') {
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

/** 커미션 상품 구매 문의: 구매자(client_id) ↔ 관리자(seller_id). 관리자는 채팅 목록에서 동일하게 수신 */
router.post('/rooms/commission-inquiry', authMiddleware, (req, res) => {
  const { project_id, purchase_summary } = req.body;
  if (!project_id) return res.status(400).json({ error: 'project_id가 필요합니다.' });

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id);
  if (!project) return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
  if (project.is_commission !== 1) {
    return res.status(400).json({ error: '커미션 상품만 구매 문의 채팅을 열 수 있습니다.' });
  }

  const admin = db.prepare(`SELECT id FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1`).get();
  if (!admin) return res.status(500).json({ error: '관리자 계정이 없습니다.' });

  const buyerId = req.user.id;
  if (buyerId === admin.id) {
    return res.status(400).json({ error: '관리자 계정으로는 구매 문의 채팅을 열 수 없습니다. 일반 회원으로 로그인해 주세요.' });
  }

  let room = db.prepare(
    'SELECT * FROM chat_rooms WHERE project_id = ? AND client_id = ? AND seller_id = ?'
  ).get(project_id, buyerId, admin.id);

  const isNew = !room;
  if (isNew) {
    const id = uuidv4();
    db.prepare('INSERT INTO chat_rooms (id, project_id, client_id, seller_id) VALUES (?, ?, ?, ?)')
      .run(id, project_id, buyerId, admin.id);
    room = db.prepare('SELECT * FROM chat_rooms WHERE id = ?').get(id);
  }

  const summary = (purchase_summary && String(purchase_summary).trim()) || `[구매 문의] ${project.title}`;
  if (isNew) {
    const msgId = uuidv4();
    db.prepare('INSERT INTO chat_messages (id, room_id, sender_id, content) VALUES (?, ?, ?, ?)')
      .run(msgId, room.id, buyerId, summary);
  }

  res.json(room);
});

const MARKETPLACE_INQUIRY_PROJECT_ID = 'marketplace-listings-inquiry';

/** 매물장 예시 매물 문의: 매 클릭마다 메시지 추가, 관리자와 동일 채팅 스레드 */
router.post('/rooms/marketplace-inquiry', authMiddleware, (req, res) => {
  const { inquiry } = req.body;
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(MARKETPLACE_INQUIRY_PROJECT_ID);
  if (!project) {
    return res.status(500).json({ error: '매물장 문의가 아직 설정되지 않았습니다. 서버를 한 번 재시작해 주세요.' });
  }

  const admin = db.prepare(`SELECT id FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1`).get();
  if (!admin) return res.status(500).json({ error: '관리자 계정이 없습니다.' });

  const buyerId = req.user.id;
  if (buyerId === admin.id) {
    return res.status(400).json({ error: '관리자 계정으로는 문의 채팅을 열 수 없습니다.' });
  }

  let room = db.prepare(
    'SELECT * FROM chat_rooms WHERE project_id = ? AND client_id = ? AND seller_id = ?'
  ).get(MARKETPLACE_INQUIRY_PROJECT_ID, buyerId, admin.id);

  if (!room) {
    const id = uuidv4();
    db.prepare('INSERT INTO chat_rooms (id, project_id, client_id, seller_id) VALUES (?, ?, ?, ?)')
      .run(id, MARKETPLACE_INQUIRY_PROJECT_ID, buyerId, admin.id);
    room = db.prepare('SELECT * FROM chat_rooms WHERE id = ?').get(id);
  }

  const text = (inquiry && String(inquiry).trim()) || '[매물 문의]';
  const msgId = uuidv4();
  db.prepare('INSERT INTO chat_messages (id, room_id, sender_id, content) VALUES (?, ?, ?, ?)')
    .run(msgId, room.id, buyerId, text);

  res.json(room);
});

router.post('/upload', authMiddleware, chatUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '파일이 없습니다.' });
  res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.originalname || req.file.filename });
});

export default router;
