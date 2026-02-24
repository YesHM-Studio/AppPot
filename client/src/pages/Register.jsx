import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const EyeIcon = ({ show }) => (
  show ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
);

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', passwordConfirm: '', name: '', recovery_email: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [idChecked, setIdChecked] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const ID_REGEX = /^[a-zA-Z0-9_]*$/;
  const isValidIdFormat = (v) => ID_REGEX.test(v);

  const handleCheckId = async () => {
    const userId = form.email.trim();
    if (userId.length < 2) {
      setError('아이디는 2글자 이상이어야 합니다.');
      setIdChecked(false);
      return;
    }
    if (!isValidIdFormat(userId)) {
      setError('아이디는 영문 대소문자, 숫자, _ 만 사용할 수 있습니다.');
      setIdChecked(false);
      return;
    }
    setError('');
    try {
      const { data } = await axios.get(`/api/auth/check-id/${encodeURIComponent(userId)}`);
      if (data.available) {
        setIdChecked(true);
        setError('');
      } else {
        setIdChecked(false);
        setError('이미 사용 중인 아이디입니다.');
      }
    } catch (err) {
      setError(err.response?.data?.error || '중복 확인에 실패했습니다.');
      setIdChecked(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isValidIdFormat(form.email.trim())) {
      setError('아이디는 영문 대소문자, 숫자, _ 만 사용할 수 있습니다.');
      return;
    }
    if (form.password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!idChecked) {
      setError('아이디 중복 확인을 해주세요.');
      return;
    }
    try {
      const { passwordConfirm, ...rest } = form;
      await register({ ...rest, role: 'client' }); // recovery_email 포함
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '회원가입에 실패했습니다.');
    }
  };

  const handleIdChange = (v) => {
    const filtered = v.replace(/[^a-zA-Z0-9_]/g, '');
    setForm({ ...form, email: filtered });
    setIdChecked(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>회원가입</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="이름"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div className="auth-id-field">
            <div className="auth-id-wrap">
              <input
                type="text"
                placeholder="아이디"
                value={form.email}
                onChange={(e) => handleIdChange(e.target.value)}
                required
              />
              <button type="button" className="btn-check-id" onClick={handleCheckId}>중복확인</button>
            </div>
            {!idChecked && !error && <span className="auth-id-hint">영문, 숫자, _ 만 가능</span>}
          </div>
          {idChecked && <p className="auth-success">사용 가능한 아이디입니다.</p>}
          <input
            type="email"
            placeholder="이메일"
            value={form.recovery_email}
            onChange={(e) => setForm({ ...form, recovery_email: e.target.value })}
          />
          <div className="auth-password-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호 (최소 8자)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              tabIndex={-1}
            >
              <EyeIcon show={showPassword} />
            </button>
          </div>
          <div className="auth-password-wrap">
            <input
              type={showPasswordConfirm ? 'text' : 'password'}
              placeholder="비밀번호 확인"
              value={form.passwordConfirm}
              onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
              required
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
              aria-label={showPasswordConfirm ? '비밀번호 확인 숨기기' : '비밀번호 확인 보기'}
              tabIndex={-1}
            >
              <EyeIcon show={showPasswordConfirm} />
            </button>
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
