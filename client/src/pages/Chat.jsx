import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import './Chat.css';

export default function Chat() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room');
  const { user, api } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [socket, setSocket] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get('/api/chat/rooms').then(({ data }) => setRooms(data));
  }, []);

  useEffect(() => {
    if (roomId) {
      api.get(`/api/chat/rooms/${roomId}/messages`).then(({ data }) => setMessages(data));
    }
  }, [roomId]);

  useEffect(() => {
    const url = import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin;
    const s = io(url);
    setSocket(s);
    return () => s?.disconnect();
  }, []);

  useEffect(() => {
    if (socket && roomId) {
      socket.emit('join-room', roomId);
      socket.on('new-message', (msg) => {
        setMessages((prev) => [...prev, msg]);
      });
      return () => socket.off('new-message');
    }
  }, [socket, roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMsg.trim() || !socket || !roomId) return;
    socket.emit('send-message', { roomId, senderId: user.id, content: newMsg.trim() });
    setNewMsg('');
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !socket || !roomId) return;
    if (file.size > 1024 * 1024 * 1024) {
      alert('파일 크기는 1GB 이하여야 합니다.');
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/api/chat/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      });
      const content = `[FILE]${data.filename}|${data.url}`;
      socket.emit('send-message', { roomId, senderId: user.id, content });
    } catch (err) {
      alert(err.response?.data?.error || '파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const renderMessageContent = (m) => {
    if (m.content?.startsWith('[FILE]')) {
      const [, rest] = m.content.split('[FILE]');
      const [filename, url] = (rest || '').split('|');
      if (url) {
        return (
          <a href={url} target="_blank" rel="noopener noreferrer" className="msg-file">
            📎 {filename || '파일'}
          </a>
        );
      }
    }
    return <p>{m.content}</p>;
  };

  return (
    <div className="chat-page">
      <div className="chat-sidebar">
        <h3>채팅 목록</h3>
        {rooms.map((r) => (
          <Link
            key={r.id}
            to={`/chat?room=${r.id}`}
            className={`room-item ${r.id === roomId ? 'active' : ''}`}
          >
            <strong>{r.project_title}</strong>
            <span>{r.client_id === user?.id ? r.seller_name : r.client_name}</span>
          </Link>
        ))}
      </div>
      <div className="chat-main">
        {roomId ? (
          <>
            <div className="messages">
              {messages.map((m) => (
                <div key={m.id} className={`msg ${m.sender_id === user?.id ? 'me' : ''}`}>
                  <span className="sender">{m.sender_name}</span>
                  {renderMessageContent(m)}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="input-area">
              <button
                type="button"
                className="chat-attach-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="파일 첨부 (최대 1GB)"
              >
                +
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="*"
                className="chat-file-input"
                onChange={handleFileSelect}
              />
              <input
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="메시지를 입력하세요"
              />
              <button onClick={sendMessage}>전송</button>
            </div>
          </>
        ) : (
          <div className="no-room">채팅방을 선택해주세요</div>
        )}
      </div>
    </div>
  );
}
