import { Link } from 'react-router-dom';
import './SellersComingSoon.css';

export default function SellersComingSoon() {
  return (
    <div className="coming-soon-page">
      <div className="coming-soon-card">
        <div className="coming-soon-badge">Coming Soon</div>
        <h1>판매자 기능 대기중</h1>
        <p className="coming-soon-desc">
          더 나은 서비스로 찾아뵙겠습니다.<br />
          조금만 기다려 주세요!
        </p>
        <Link to="/" className="coming-soon-btn">홈으로</Link>
      </div>
    </div>
  );
}
