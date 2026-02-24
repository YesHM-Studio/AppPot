import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/index.js';
import { createToken, authMiddleware } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/register', (req, res) => {
  try {
    const { email, password, name, role = 'client' } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: '이메일, 비밀번호, 이름은 필수입니다.' });
    }
    const id = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.prepare(`
      INSERT INTO users (id, email, password, name, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, email, hashedPassword, name, role === 'seller' ? 'seller' : 'client');

    const user = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(id);
    if (role === 'seller') {
      db.prepare('INSERT INTO seller_profiles (id, user_id, title) VALUES (?, ?, ?)')
        .run(uuidv4(), id, '판매자 프로필');
    }
    const token = createToken({ id: user.id, role: user.role });
    res.json({ user, token });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: '이미 사용 중인 이메일입니다.' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }
  const { password: _, ...userWithoutPassword } = user;
  const token = createToken({ id: user.id, role: user.role });
  res.json({ user: userWithoutPassword, token });
});

router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, email, name, role, phone, avatar, bio, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
  res.json(user);
});

export default router;
