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

// 프로덕션: React 빌드 제공 (루트에서 실행 시 process.cwd() = 프로젝트 루트)
const possiblePaths = [
  path.join(process.cwd(), 'client', 'dist'),
  path.join(__dirname, '../../client/dist'),
  path.join(process.cwd(), '..', 'client', 'dist'),
];
const clientDist = possiblePaths.find((p) => fs.existsSync(p));
if (clientDist) {
  console.log('✅ Static files from:', clientDist);
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
      if (err) res.status(500).send('Error loading app');
    });
  });
} else {
  app.get('/', (req, res) => {
    res.send(`
      <h1>AppPot</h1>
      <p>client/dist not found. Paths tried:</p>
      <pre>${possiblePaths.join('\n')}</pre>
      <p>cwd: ${process.cwd()}</p>
    `);
  });
  console.warn('⚠️ client/dist not found. Paths:', possiblePaths, 'cwd:', process.cwd());
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

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`✅ AppPot 서버 실행: http://localhost:${PORT}`);
});
