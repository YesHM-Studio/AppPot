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
  const messagesEndRef = useRef(null);

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
                  <p>{m.content}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="input-area">
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
