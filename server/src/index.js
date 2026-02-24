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
import { v4 as uuidv4 } from 'uuid';

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
