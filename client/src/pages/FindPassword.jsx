import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

export default function FindPassword() {
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!userId.trim()) {
      setError('아이디를 입력해주세요.');
      return;
    }
    try {
      const { data } = await axios.post('/api/auth/forgot-password', { userId: userId.trim() });
      setSuccess(data.message);
      setDevCode(data.devCode || '');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || '인증번호 요청에 실패했습니다.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      await axios.post('/api/auth/reset-password', {
        userId: userId.trim(),
        code: code.trim(),
        newPassword,
      });
      setSuccess('비밀번호가 변경되었습니다.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || '비밀번호 변경에 실패했습니다.');
    }
  };

  const EyeIcon = ({ show }) => (
    show ? (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    ) : (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    )
  );

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>비밀번호 찾기</h1>
        {step === 1 ? (
          <form onSubmit={handleRequestCode}>
            <input
              type="text"
              placeholder="아이디"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
            <p className="auth-id-hint">가입 시 등록한 이메일로 인증번호가 발송됩니다.</p>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="btn-submit">인증번호 요청</button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <p className="auth-success">{success}</p>
            {devCode && <p className="auth-id-hint" style={{ color: '#e67e22' }}>개발모드 인증번호: <strong>{devCode}</strong></p>}
            <input
              type="text"
              placeholder="인증번호 6자리"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              required
            />
            <div className="auth-password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="새 비밀번호 (최소 8자)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button type="button" className="auth-password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                <EyeIcon show={showPassword} />
              </button>
            </div>
            <div className="auth-password-wrap">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="새 비밀번호 확인"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button type="button" className="auth-password-toggle" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                <EyeIcon show={showConfirm} />
              </button>
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="btn-submit">비밀번호 변경</button>
            <button type="button" className="auth-link-btn" onClick={() => { setStep(1); setError(''); setCode(''); setNewPassword(''); setConfirmPassword(''); }}>
              이전 단계
            </button>
          </form>
        )}
        <p className="auth-link">
          <Link to="/login">로그인</Link> | <Link to="/register">회원가입</Link>
        </p>
      </div>
    </div>
  );
}
