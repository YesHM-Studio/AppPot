import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import WithdrawModal from '../components/WithdrawModal';
import './MyPage.css';

export default function MyPage() {
  const { user, api, logout, refreshUser } = useAuth();
  const [myProjects, setMyProjects] = useState([]);
  const [portfolioForm, setPortfolioForm] = useState({ title: '', description: '', category: '', image: null });
  const [profileForm, setProfileForm] = useState({ bio: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarInputRef = useRef(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [editName, setEditName] = useState(false);
  const [editEmail, setEditEmail] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [emailValue, setEmailValue] = useState('');

  useEffect(() => {
    if (user) {
      setProfileForm({ bio: user.bio || '' });
      setAvatarPreview(user.avatar ? user.avatar : null);
      setNameValue(user.name || '');
      setEmailValue(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'client') {
      axios.get('/api/projects?status=').then(({ data }) => {
        setMyProjects(data.projects?.filter((p) => p.client_id === user.id) || []);
      });
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    if (avatarFile) fd.append('avatar', avatarFile);
    fd.append('bio', profileForm.bio);
    try {
      await api.patch('/api/auth/profile', fd);
      await refreshUser();
      setAvatarFile(null);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    } catch (err) {
      alert(err.response?.data?.error || '저장에 실패했습니다.');
    }
  };

  const handleAddPortfolio = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('title', portfolioForm.title);
    fd.append('description', portfolioForm.description);
    fd.append('category', portfolioForm.category);
    if (portfolioForm.image) fd.append('image', portfolioForm.image);
    try {
      await api.post('/api/sellers/portfolio', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPortfolioForm({ title: '', description: '', category: '', image: null });
    } catch (err) {
      alert(err.response?.data?.error || '등록 실패');
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('계정을 비활성화하면 로그인이 불가능합니다. 계속하시겠습니까?')) return;
    try {
      await api.post('/api/auth/deactivate');
      logout();
    } catch (err) {
      alert(err.response?.data?.error || '실패했습니다.');
    }
  };

  const handleWithdraw = () => setShowWithdrawModal(true);

  const handleNameSave = async () => {
    if (!nameValue.trim() || nameValue === user?.name) {
      setEditName(false);
      return;
    }
    try {
      await api.patch('/api/auth/name', { name: nameValue.trim() });
      await refreshUser();
      setEditName(false);
    } catch (err) {
      alert(err.response?.data?.error || '저장에 실패했습니다.');
    }
  };

  const handleEmailSave = async () => {
    const trimmed = emailValue.trim();
    if (!trimmed || trimmed === user?.email) {
      setEditEmail(false);
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      alert('아이디는 영문 대소문자, 숫자, _ 만 사용할 수 있습니다.');
      return;
    }
    if (trimmed.length < 2) {
      alert('아이디는 2글자 이상이어야 합니다.');
      return;
    }
    try {
      const { data } = await api.get(`/api/auth/check-id/${encodeURIComponent(trimmed)}`);
      if (!data.available) {
        alert(data.error || '이미 사용 중인 아이디입니다.');
        return;
      }
      await api.patch('/api/auth/email', { email: trimmed });
      await refreshUser();
      setEditEmail(false);
    } catch (err) {
      alert(err.response?.data?.error || '저장에 실패했습니다.');
    }
  };

  const nameRemaining = () => {
    if (!user) return 0;
    const count = user.name_change_count ?? 0;
    const last = user.name_last_changed ? new Date(user.name_last_changed) : null;
    if (last && Date.now() - last.getTime() >= 14 * 864e5) return 2;
    return Math.max(0, 2 - count);
  };

  const emailCanChange = () => {
    if (!user) return false;
    const last = user.email_last_changed ? new Date(user.email_last_changed) : null;
    if (!last) return true;
    return Date.now() - last.getTime() >= 30 * 864e5;
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('새 비밀번호와 확인이 일치하지 않습니다.');
      return;
    }
    try {
      await api.patch('/api/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('비밀번호가 변경되었습니다.');
    } catch (err) {
      setPasswordError(err.response?.data?.error || '변경에 실패했습니다.');
    }
  };

  return (
    <div className="mypage">
      <h1>마이페이지</h1>
      <div className="profile-card">
        <form onSubmit={handleProfileSave} className="profile-form">
          <div className="profile-top-row">
          <div className="profile-avatar-wrap">
            <label className="avatar-label">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="avatar-input"
              />
              <div className="avatar-circle">
                {(avatarPreview || user?.avatar) ? (
                  <img src={avatarPreview || user?.avatar} alt="프로필" />
                ) : (
                  <span className="avatar-placeholder">+</span>
                )}
              </div>
              <span className="avatar-hint">사진 변경</span>
            </label>
          </div>
          <div className="profile-info">
            <div className="profile-name-row">
              {editName ? (
                <>
                  <input
                    className="profile-edit-input"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    autoFocus
                  />
                  <button type="button" className="profile-edit-btn" onClick={handleNameSave}>저장</button>
                  <button type="button" className="profile-edit-btn cancel" onClick={() => { setEditName(false); setNameValue(user?.name || ''); }}>취소</button>
                </>
              ) : (
                <>
                  <h2>{user?.name}</h2>
                  <button
                    type="button"
                    className="profile-edit-icon"
                    onClick={() => setEditName(true)}
                    disabled={nameRemaining() === 0}
                    title={nameRemaining() === 0 ? '14일 내 변경 가능 횟수 소진' : `이름 변경 (14일 내 ${nameRemaining()}회 남음)`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </>
              )}
            </div>
            <div className="profile-email-row">
              {editEmail ? (
                <>
                  <input
                    className="profile-edit-input"
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    placeholder="영문, 숫자, _"
                    autoFocus
                  />
                  <button type="button" className="profile-edit-btn" onClick={handleEmailSave}>저장</button>
                  <button type="button" className="profile-edit-btn cancel" onClick={() => { setEditEmail(false); setEmailValue(user?.email || ''); }}>취소</button>
                </>
              ) : (
                <>
                  <p className="profile-email">{user?.email}</p>
                  <button
                    type="button"
                    className="profile-edit-icon"
                    onClick={() => setEditEmail(true)}
                    disabled={!emailCanChange()}
                    title={emailCanChange() ? '아이디 변경 (30일 내 1회)' : '30일 내 변경 가능 횟수 소진'}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </>
              )}
            </div>
            <span className="role">{user?.role === 'client' ? '의뢰자' : user?.role === 'seller' ? '판매자' : '관리자'}</span>
          </div>
          </div>
          <div className="profile-bio-wrap">
            <label>내 프로필 소개</label>
            <textarea
              placeholder="자기소개를 입력하세요"
              value={profileForm.bio}
              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              rows={4}
            />
          </div>
          <div className="profile-actions">
            <button type="submit" className="btn-save">저장</button>
            <button type="button" onClick={logout} className="btn-logout">로그아웃</button>
          </div>
        </form>
      </div>

      <div className="mypage-section card-section">
        <h2>개인정보 수정</h2>
        <form onSubmit={handlePasswordChange} className="password-change-form">
          <label>기존 비밀번호</label>
          <div className="mypage-pw-wrap">
            <input
              type={showCurrentPw ? 'text' : 'password'}
              placeholder="기존 비밀번호"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            />
            <button
              type="button"
              className="mypage-pw-toggle"
              onClick={() => setShowCurrentPw(!showCurrentPw)}
              aria-label={showCurrentPw ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showCurrentPw ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
          <label>새 비밀번호</label>
          <div className="mypage-pw-wrap">
            <input
              type={showNewPw ? 'text' : 'password'}
              placeholder="새 비밀번호 (8자 이상)"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            />
            <button
              type="button"
              className="mypage-pw-toggle"
              onClick={() => setShowNewPw(!showNewPw)}
              aria-label={showNewPw ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showNewPw ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
          <label>비밀번호 확인</label>
          <div className="mypage-pw-wrap">
            <input
              type={showConfirmPw ? 'text' : 'password'}
              placeholder="비밀번호 확인"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            />
            <button
              type="button"
              className="mypage-pw-toggle"
              onClick={() => setShowConfirmPw(!showConfirmPw)}
              aria-label={showConfirmPw ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showConfirmPw ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
          {passwordError && <p className="password-change-error">{passwordError}</p>}
          <button type="submit" className="btn-password-change">비밀번호 변경</button>
        </form>
      </div>

      <div className="mypage-section card-section">
        <h2>내가 쓴 리뷰</h2>
        <div className="empty-state">
          <p>아직 작성한 리뷰가 없습니다.</p>
        </div>
      </div>

      {user?.role === 'client' && (
        <div className="mypage-section card-section">
          <h2>내 의뢰</h2>
          <Link to="/projects/new" className="btn-add">새 의뢰</Link>
          <div className="my-projects">
            {myProjects.length > 0 ? (
              myProjects.map((p) => (
                <Link key={p.id} to={`/projects/${p.id}`}>{p.title} - {p.status}</Link>
              ))
            ) : (
              <div className="empty-state"><p>등록한 의뢰가 없습니다.</p></div>
            )}
          </div>
        </div>
      )}

      {user?.role === 'seller' && (
        <div className="mypage-section card-section">
          <h2>포트폴리오 등록</h2>
          <form onSubmit={handleAddPortfolio} className="portfolio-form">
            <input placeholder="제목" value={portfolioForm.title} onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })} required />
            <textarea placeholder="설명" value={portfolioForm.description} onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })} />
            <select value={portfolioForm.category} onChange={(e) => setPortfolioForm({ ...portfolioForm, category: e.target.value })}>
              <option value="">카테고리</option>
              {['디자인', '개발', '마케팅', '글쓰기', '번역', '기타'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input type="file" accept="image/*" onChange={(e) => setPortfolioForm({ ...portfolioForm, image: e.target.files[0] })} />
            <button type="submit">등록</button>
          </form>
        </div>
      )}

      <div className="mypage-advanced">
        <button type="button" className="advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
          고급설정
        </button>
        {showAdvanced && (
          <div className="advanced-content">
            <button type="button" className="advanced-item" onClick={handleDeactivate}>
              회원 비활성화
            </button>
            <button type="button" className="advanced-item danger" onClick={handleWithdraw}>
              회원탈퇴
            </button>
          </div>
        )}
      </div>

      <WithdrawModal open={showWithdrawModal} onClose={() => setShowWithdrawModal(false)} />
    </div>
  );
}
