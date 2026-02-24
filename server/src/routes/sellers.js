import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import db from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`)
});
const upload = multer({ storage });

const router = Router();

router.get('/', (req, res) => {
  const { category, page = 1, limit = 12 } = req.query;
  let sql = `
    SELECT sp.*, u.name, u.avatar, u.bio,
    (SELECT COUNT(*) FROM portfolios WHERE seller_id = u.id) as portfolio_count
    FROM seller_profiles sp
    JOIN users u ON sp.user_id = u.id
    WHERE u.role = 'seller'
  `;
  const params = [];
  if (category) { sql += ' AND sp.category = ?'; params.push(category); }
  sql += ' ORDER BY sp.rating DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
  const sellers = db.prepare(sql).all(...params);
  res.json(sellers);
});

router.get('/:id', (req, res) => {
  const profile = db.prepare(`
    SELECT sp.*, u.id as user_id, u.name, u.avatar, u.bio, u.email
    FROM seller_profiles sp JOIN users u ON sp.user_id = u.id
    WHERE u.id = ?
  `).get(req.params.id);
  if (!profile) return res.status(404).json({ error: '판매자를 찾을 수 없습니다.' });
  const portfolios = db.prepare('SELECT * FROM portfolios WHERE seller_id = ?').all(profile.user_id);
  res.json({ ...profile, portfolios });
});

router.get('/:id/portfolio', (req, res) => {
  const portfolios = db.prepare('SELECT * FROM portfolios WHERE seller_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(portfolios);
});

router.post('/portfolio', authMiddleware, upload.single('image'), (req, res) => {
  if (req.user.role !== 'seller') return res.status(403).json({ error: '판매자만 포트폴리오를 등록할 수 있습니다.' });
  const { title, description, category } = req.body;
  if (!title) return res.status(400).json({ error: '제목은 필수입니다.' });
  const id = uuidv4();
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  db.prepare(`
    INSERT INTO portfolios (id, seller_id, title, image_url, description, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, title, image_url, description || '', category || '');
  res.status(201).json(db.prepare('SELECT * FROM portfolios WHERE id = ?').get(id));
});

router.patch('/profile', authMiddleware, (req, res) => {
  if (req.user.role !== 'seller') return res.status(403).json({ error: '판매자만 프로필을 수정할 수 있습니다.' });
  const { title, category, bio } = req.body;
  db.prepare(`
    UPDATE seller_profiles SET title = COALESCE(?, title), category = COALESCE(?, category)
    WHERE user_id = ?
  `).run(title || null, category || null, req.user.id);
  if (bio !== undefined) db.prepare('UPDATE users SET bio = ? WHERE id = ?').run(bio, req.user.id);
  res.json({ message: '수정되었습니다.' });
});

export default router;
