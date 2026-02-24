import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import db from '../db/index.js';
import { createToken, authMiddleware } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => cb(null, `avatar-${uuidv4()}-${file.originalname}`)
});
const upload = multer({ storage });

const router = Router();

const ID_REGEX = /^[a-zA-Z0-9_]+$/;

// 아이디 중복 확인
router.get('/check-id/:userId', (req, res) => {
  const { userId } = req.params;
  const trimmed = userId?.trim();
  if (!trimmed || trimmed.length < 2) {
    return res.status(400).json({ available: false, error: '아이디는 2글자 이상이어야 합니다.' });
  }
  if (!ID_REGEX.test(trimmed)) {
    return res.status(400).json({ available: false, error: '아이디는 영문 대소문자, 숫자, _ 만 사용할 수 있습니다.' });
  }
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmed);
  res.json({ available: !exists });
});

router.post('/register', (req, res) => {
  try {
    const { email, password, name, recovery_email } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: '아이디, 비밀번호, 이름은 필수입니다.' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: '비밀번호는 최소 8자 이상이어야 합니다.' });
    }
    const trimmedId = String(email).trim();
    if (!ID_REGEX.test(trimmedId)) {
      return res.status(400).json({ error: '아이디는 영문 대소문자, 숫자, _ 만 사용할 수 있습니다.' });
    }
    const id = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.prepare(`
      INSERT INTO users (id, email, password, name, role, recovery_email)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, trimmedId, hashedPassword, name, 'client', recovery_email?.trim() || null);

    const user = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(id);
    const token = createToken({ id: user.id, role: user.role });
    res.json({ user, token });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || String(err.message || '').includes('UNIQUE')) {
      return res.status(400).json({ error: '이미 사용 중인 아이디입니다.' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 입력해주세요.' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
  }
  if (user.is_active === 0 || user.is_active === '0') {
    db.prepare('UPDATE users SET is_active = 1 WHERE id = ?').run(user.id);
    user.is_active = 1;
  }
  const { password: _, ...userWithoutPassword } = user;
  const token = createToken({ id: user.id, role: user.role });
  res.json({ user: userWithoutPassword, token });
});

// 비밀번호 찾기 1단계: 인증번호 요청
router.post('/forgot-password', (req, res) => {
  const { userId } = req.body;
  if (!userId || !userId.trim()) {
    return res.status(400).json({ error: '아이디를 입력해주세요.' });
  }
  const user = db.prepare('SELECT id, recovery_email FROM users WHERE email = ?').get(userId.trim());
  if (!user) {
    return res.status(400).json({ error: '존재하지 않는 아이디입니다.' });
  }
  if (!user.recovery_email || !user.recovery_email.trim()) {
    return res.status(400).json({ error: '등록된 이메일이 없습니다. 비밀번호 찾기는 가입 시 이메일을 등록한 경우에만 이용 가능합니다.' });
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10분
  const id = uuidv4();
  db.prepare('DELETE FROM password_reset_codes WHERE user_id = ?').run(user.id);
  db.prepare('INSERT INTO password_reset_codes (id, user_id, code, expires_at) VALUES (?, ?, ?, ?)').run(id, user.id, code, expiresAt);
  // TODO: 실제 이메일 발송 (nodemailer 등). 개발용으로 콘솔 출력
  console.log(`[비밀번호 찾기] ${user.recovery_email} → 인증번호: ${code} (10분 유효)`);
  const response = { sent: true, message: '등록된 이메일로 인증번호를 발송했습니다.' };
  if (process.env.APPOT_DEV_CODE === '1') response.devCode = code; // 로컬 테스트용
  res.json(response);
});

// 비밀번호 찾기 2단계: 인증번호 확인 및 비밀번호 변경
router.post('/reset-password', (req, res) => {
  const { userId, code, newPassword } = req.body;
  if (!userId || !code || !newPassword) {
    return res.status(400).json({ error: '아이디, 인증번호, 새 비밀번호를 모두 입력해주세요.' });
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ error: '비밀번호는 최소 8자 이상이어야 합니다.' });
  }
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(userId.trim());
  if (!user) {
    return res.status(400).json({ error: '존재하지 않는 아이디입니다.' });
  }
  const row = db.prepare('SELECT * FROM password_reset_codes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(user.id);
  if (!row || row.code !== String(code).trim()) {
    return res.status(400).json({ error: '인증번호가 올바르지 않거나 만료되었습니다.' });
  }
  if (new Date(row.expires_at) < new Date()) {
    db.prepare('DELETE FROM password_reset_codes WHERE user_id = ?').run(user.id);
    return res.status(400).json({ error: '인증번호가 만료되었습니다. 다시 요청해주세요.' });
  }
  const hashed = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, user.id);
  db.prepare('DELETE FROM password_reset_codes WHERE user_id = ?').run(user.id);
  res.json({ success: true, message: '비밀번호가 변경되었습니다.' });
});

router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, email, name, role, phone, avatar, bio, created_at, name_change_count, name_last_changed, email_last_changed FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
  res.json(user);
});

const DAY_MS = 864e5;

router.patch('/name', authMiddleware, (req, res) => {
  const { name } = req.body;
  const trimmed = String(name || '').trim();
  if (!trimmed || trimmed.length < 2) {
    return res.status(400).json({ error: '이름은 2글자 이상이어야 합니다.' });
  }
  const u = db.prepare('SELECT name_change_count, name_last_changed FROM users WHERE id = ?').get(req.user.id);
  if (!u) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
  let count = u.name_change_count ?? 0;
  const lastChanged = u.name_last_changed ? new Date(u.name_last_changed) : null;
  if (lastChanged && Date.now() - lastChanged.getTime() >= 14 * DAY_MS) count = 0;
  if (count >= 2) return res.status(400).json({ error: '이름은 14일 내 최대 2회만 변경할 수 있습니다.' });
  db.prepare('UPDATE users SET name = ?, name_change_count = ?, name_last_changed = ? WHERE id = ?')
    .run(trimmed, count + 1, new Date().toISOString(), req.user.id);
  const user = db.prepare('SELECT id, email, name, role, phone, avatar, bio, created_at, name_change_count, name_last_changed, email_last_changed FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

router.patch('/email', authMiddleware, (req, res) => {
  const { email } = req.body;
  const trimmed = String(email || '').trim();
  if (!trimmed || trimmed.length < 2) {
    return res.status(400).json({ error: '아이디는 2글자 이상이어야 합니다.' });
  }
  if (!ID_REGEX.test(trimmed)) {
    return res.status(400).json({ error: '아이디는 영문 대소문자, 숫자, _ 만 사용할 수 있습니다.' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmed);
  if (existing && existing.id !== req.user.id) {
    return res.status(400).json({ error: '이미 사용 중인 아이디입니다.' });
  }
  const u = db.prepare('SELECT email_last_changed FROM users WHERE id = ?').get(req.user.id);
  if (!u) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
  const lastChanged = u.email_last_changed ? new Date(u.email_last_changed) : null;
  if (lastChanged && Date.now() - lastChanged.getTime() < 30 * DAY_MS) {
    return res.status(400).json({ error: '아이디는 30일 내 1회만 변경할 수 있습니다.' });
  }
  db.prepare('UPDATE users SET email = ?, email_last_changed = ? WHERE id = ?')
    .run(trimmed, new Date().toISOString(), req.user.id);
  const user = db.prepare('SELECT id, email, name, role, phone, avatar, bio, created_at, name_change_count, name_last_changed, email_last_changed FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

// 프로필 수정 (아바타, 소개)
router.patch('/profile', authMiddleware, upload.single('avatar'), (req, res) => {
  try {
    const { bio } = req.body || {};
    const updates = [];
    const params = [];
    if (req.file) {
      updates.push('avatar = ?');
      params.push(`/uploads/${req.file.filename}`);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      params.push(String(bio).trim());
    }
    if (updates.length === 0) return res.status(400).json({ error: '수정할 내용이 없습니다.' });
    params.push(req.user.id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    const user = db.prepare('SELECT id, email, name, role, phone, avatar, bio, created_at FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 비밀번호 변경 (로그인 상태)
router.patch('/change-password', authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: '현재 비밀번호와 새 비밀번호를 입력해주세요.' });
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ error: '새 비밀번호는 최소 8자 이상이어야 합니다.' });
  }
  const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
  if (!user || !bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(401).json({ error: '현재 비밀번호가 일치하지 않습니다.' });
  }
  const hashed = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.user.id);
  res.json({ success: true, message: '비밀번호가 변경되었습니다.' });
});

// 회원 비활성화
router.post('/deactivate', authMiddleware, (req, res) => {
  try {
    db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 회원 탈퇴
router.post('/withdraw', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
