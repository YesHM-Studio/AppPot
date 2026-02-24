import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './WithdrawModal.css';

export default function WithdrawModal({ open, onClose }) {
  const { api, logout } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!agreed) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/api/auth/withdraw');
      logout();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || '탈퇴 처리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="withdraw-modal-overlay" onClick={handleBackdropClick}>
      <div className="withdraw-modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>회원 탈퇴</h2>
        <p className="withdraw-modal-warn">
          정말 탈퇴하시겠습니까?<br />
          모든 데이터가 삭제되며 <strong>복구할 수 없습니다.</strong>
        </p>
        <form onSubmit={handleWithdraw}>
          <label className="withdraw-modal-check">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>탈퇴에 동의합니다</span>
          </label>
          {error && <p className="withdraw-modal-error">{error}</p>}
          <div className="withdraw-modal-actions">
            <button
              type="submit"
              className="btn-withdraw-modal"
              disabled={!agreed || loading}
            >
              {loading ? '처리 중...' : '회원 탈퇴하기'}
            </button>
            <button type="button" className="btn-withdraw-cancel" onClick={onClose}>
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
