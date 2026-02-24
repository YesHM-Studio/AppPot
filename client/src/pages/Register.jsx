import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'client' });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '회원가입에 실패했습니다.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>회원가입</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="이메일"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="이름"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div className="role-select">
            <label><input type="radio" name="role" checked={form.role === 'client'} onChange={() => setForm({ ...form, role: 'client' })} /> 의뢰자</label>
            <label><input type="radio" name="role" checked={form.role === 'seller'} onChange={() => setForm({ ...form, role: 'seller' })} /> 판매자</label>
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="btn-submit">가입하기</button>
        </form>
        <p className="auth-link">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  );
}
