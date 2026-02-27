import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
[path.join(__dirname, '../uploads'), path.join(__dirname, '../data')].forEach((p) => {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import estimateRoutes from './routes/estimates.js';
import sellerRoutes from './routes/sellers.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import chatRoutes from './routes/chat.js';
import db from './db/index.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// 기본 관리자 생성 (없을 경우)
const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
if (!adminExists) {
  const hashed = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)')
    .run('admin-001', 'admin@apppot.com', hashed, '관리자', 'admin');
  console.log('✅ 기본 관리자 생성 (admin@apppot.com / admin123)');
}

// 디자인 커미션 생성/업데이트
const COMMISSION_OPTIONS = JSON.stringify({
  general: {
    price: 150000,
    items: [
      '메인 1종 + 부가 화면 10종',
      '기본 컬러 가이드 포함',
      { label: '수정 3회', tooltip: '버그 수정 제외. 단순 변심만 횟수에 포함됩니다.' },
      '빠르고 확실한 MVP용 디자인'
    ],
    desc: '메인 1종 + 부가 화면 10종, 기본 컬러 가이드 포함. 수정 3회, 빠르고 확실한 MVP용 디자인.'
  },
  plus: {
    price: 170000,
    items: ['메인 1종 + 부가 화면 50종', '팝업창 무제한', '브랜드 가이드·소셜 로그인 UI 포함', '수정 무제한'],
    desc: '메인 1종 + 부가 화면 50종, 팝업창 무제한. 브랜드 가이드·소셜 로그인 UI 포함, 수정 무제한.'
  },
  optional: [
    { id: 0, label: '브랜드 컬러·타이포 가이드', price: 25000 },
    { id: 1, label: '소셜 로그인 UI', price: 25000 }
  ],
  optionalPlus: [
    { id: 0, label: '스플래시·로딩 화면', price: 45000 },
    { id: 1, label: '다크 모드 UI', price: 5000 }
  ]
});
const adminId = db.prepare('SELECT id FROM users WHERE role = ?').get('admin')?.id;
if (adminId) {
  const existing = db.prepare('SELECT id FROM projects WHERE is_commission = 1 AND category = ?').get('디자인');
  const title = '앱 UI 전체 디자인 (화면 작업)';
  const desc = '앱 전체 화면을 클린하고 모던하게 디자인해 드립니다. 로그인·회원가입, 메인·서브 화면, 브랜드 컬러 맞춤 등 원하시는 스타일로 작업합니다.';
  const COMMISSION_ID = 'commission-design-app-ui';
  if (existing) {
    db.prepare('UPDATE projects SET title = ?, description = ?, budget = ?, start_price = ?, options_json = ?, thumbnail_url = ? WHERE id = ?')
      .run(title, desc, 220000, 150000, COMMISSION_OPTIONS, '/images/commission-design-app-ui.png', existing.id);
  } else {
    db.prepare(`
      INSERT INTO projects (id, client_id, title, category, budget, description, is_draft, status, is_commission, thumbnail_url, start_price, options_json)
      VALUES (?, ?, ?, ?, ?, ?, 0, 'open', 1, ?, ?, ?)
    `).run(COMMISSION_ID, adminId, title, '디자인', 220000, desc, '/images/commission-design-app-ui.png', 150000, COMMISSION_OPTIONS);
    console.log('✅ 디자인 커미션 생성');
  }
}

const app = express();
const httpServer = createServer(app);
httpServer.keepAliveTimeout = 65000;
httpServer.headersTimeout = 66000;
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/estimates', estimateRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

// Express 라우트 에러 핸들러
app.use((err, req, res, next) => {
  console.error('Route error:', err.message);
  res.status(500).json({ error: '서버 오류가 발생했습니다.' });
});

// 개발: Vite로 프록시 (새로고침 시 바로 반영)
// 프로덕션: server/public 정적 파일 서빙
const isDev = process.env.NODE_ENV === 'development';
const staticDir = path.join(__dirname, '../public');

if (isDev) {
  app.use(createProxyMiddleware({
    target: 'http://localhost:5173',
    ws: true,
    changeOrigin: true,
    onProxyRes: (proxyRes) => {
      proxyRes.headers['cache-control'] = 'no-store, no-cache, must-revalidate, max-age=0';
      proxyRes.headers['pragma'] = 'no-cache';
      proxyRes.headers['expires'] = '0';
    },
  }));
  console.log('✅ 개발 모드: http://localhost:3001 → Vite 프록시 (새로고침 시 바로 반영)');
} else if (fs.existsSync(staticDir)) {
  console.log('✅ Static files from:', staticDir);
  // serve:new(APPOT_DEV_CODE=1) 시 캐시 비활성화 → 새로고침 시 항상 최신 빌드 반영
  const isDevBuild = process.env.APPOT_DEV_CODE === '1';
  const staticOpts = isDevBuild
    ? { index: false, maxAge: 0, etag: false, lastModified: false, setHeaders: (res) => {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
      }}
    : { index: false, maxAge: '1y', etag: true, lastModified: true };
  app.use(express.static(staticDir, staticOpts));
  app.get('*', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    if (isDevBuild) res.set('Pragma', 'no-cache');
    res.sendFile(path.join(staticDir, 'index.html'), (err) => {
      if (err) res.status(500).send('Error loading app');
    });
  });
} else {
  app.get('/', (req, res) => res.send(`<h1>AppPot</h1><p>Build needed. staticDir: ${staticDir}</p>`));
  console.warn('⚠️ server/public not found at:', staticDir);
}

// Socket.io Chat
io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => socket.join(roomId));
  socket.on('send-message', ({ roomId, senderId, content }) => {
    const id = uuidv4();
    db.prepare('INSERT INTO chat_messages (id, room_id, sender_id, content) VALUES (?, ?, ?, ?)')
      .run(id, roomId, senderId, content);
    const msg = db.prepare(`
      SELECT m.*, u.name as sender_name FROM chat_messages m
      JOIN users u ON m.sender_id = u.id WHERE m.id = ?
    `).get(id);
    io.to(roomId).emit('new-message', msg);
  });
});

// 글로벌 에러 핸들러 - 크래시 방지
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

const PORT = parseInt(process.env.PORT || '3001', 10);

function tryListen(port) {
  httpServer.listen(port)
    .on('listening', () => console.log(`✅ AppPot 서버 실행: http://localhost:${port}`))
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`⚠️ 포트 ${port} 사용 중. ${port + 1}번으로 재시도...`);
        tryListen(port + 1);
      } else {
        throw err;
      }
    });
}

tryListen(PORT);
