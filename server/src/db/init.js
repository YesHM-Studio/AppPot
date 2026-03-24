import db from './index.js';
import bcrypt from 'bcryptjs';

const ADMIN_LOGIN = process.env.ADMIN_LOGIN ?? 'nihno3911';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'dosa1004';

// npm run db:init 수동 실행 시 (서버 기동 시에는 index.js에서 동기화)
const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);
  db.prepare(`
    INSERT INTO users (id, email, password, name, role)
    VALUES (?, ?, ?, ?, ?)
  `).run('admin-001', ADMIN_LOGIN, hashedPassword, '관리자', 'admin');
  console.log(`✅ 기본 관리자 생성 (아이디: ${ADMIN_LOGIN})`);
}

console.log('✅ 데이터베이스 초기화 완료');
