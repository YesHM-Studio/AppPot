import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';

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

// 프로덕션: server/public (빌드 시 client/dist 복사됨) - __dirname 기준으로 항상 찾음
const staticDir = path.join(__dirname, '../public');
if (fs.existsSync(staticDir)) {
  console.log('✅ Static files from:', staticDir);
  app.use(express.static(staticDir, {
    index: false,
    maxAge: '1y',
    etag: true,
    lastModified: true,
  }));
  app.get('*', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
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
    const msg = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(id);
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
