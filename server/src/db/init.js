import db from './index.js';
import bcrypt from 'bcryptjs';

// Create default admin
const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO users (id, email, password, name, role)
    VALUES (?, ?, ?, ?, ?)
  `).run('admin-001', 'admin@apppot.com', hashedPassword, '관리자', 'admin');
  console.log('✅ 기본 관리자 생성 완료 (admin@apppot.com / admin123)');
}

console.log('✅ 데이터베이스 초기화 완료');
