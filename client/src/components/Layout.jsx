import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const TIMEDEAL_END = new Date('2026-02-25T15:00:00+09:00'); // 한국표준시(서울) 25일 15:00 정각

function useCountdown(target) {
  const [left, setLeft] = useState(() => {
    const d = target - new Date();
    if (d <= 0) return { days: 0, hours: 0, mins: 0, secs: 0 };
    return {
      days: Math.floor(d / 864e5),
      hours: Math.floor((d % 864e5) / 36e5),
      mins: Math.floor((d % 36e5) / 6e4),
      secs: Math.floor((d % 6e4) / 1e3),
    };
  });

  useEffect(() => {
    const t = setInterval(() => {
      const d = target - new Date();
      if (d <= 0) {
        setLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
        clearInterval(t);
        return;
      }
      setLeft({
        days: Math.floor(d / 864e5),
        hours: Math.floor((d % 864e5) / 36e5),
        mins: Math.floor((d % 36e5) / 6e4),
        secs: Math.floor((d % 6e4) / 1e3),
      });
    }, 1000);
    return () => clearInterval(t);
  }, [target]);

  return left;
}

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const countdown = useCountdown(TIMEDEAL_END);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="layout-gmarket">
      <header className="gmarket-header">
        <div className="header-inner">
          <Link to="/" className="logo">AppPot</Link>
          <div className="search-wrap">
            <input type="text" placeholder="어떤 서비스를 찾고 계시나요?" className="search-input" />
            <button type="button" className="search-btn">검색</button>
          </div>
          <div className="header-utils">
            {user ? (
              <>
                <Link to="/mypage">마이페이지</Link>
                <span className="util-divider" aria-hidden />
                <Link to="/chat">채팅</Link>
              </>
            ) : (
              <>
                <Link to="/login" className="util-btn">로그인</Link>
                <Link to="/register" className="util-btn join">회원가입</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <nav className="gmarket-nav">
        <div className="nav-inner">
          <Link to="/projects?tab=best" className={`nav-item nav-item-best ${location.pathname === '/projects' && (!location.search.includes('tab=') || location.search.includes('tab=best')) ? 'on' : ''}`}>
            <span className="nav-stars" aria-hidden>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </span>
            베스트
          </Link>
          <span className="nav-divider" aria-hidden />
          <Link to="/projects?tab=timedeal" className={`nav-item nav-item-timedeal ${location.pathname === '/projects' && location.search.includes('tab=timedeal') ? 'on' : ''}`}>
            <span className="nav-timedeal">
              {countdown.days > 0 || countdown.hours > 0 || countdown.mins > 0 || countdown.secs > 0 ? (
                <>{String(countdown.days * 24 + countdown.hours).padStart(2,'0')}:{String(countdown.mins).padStart(2,'0')}:{String(countdown.secs).padStart(2,'0')}</>
              ) : (
                '종료'
              )}
            </span>
            타임딜
          </Link>
          {user?.role === 'admin' && <Link to="/admin" className="nav-item">관리자</Link>}
        </div>
      </nav>
      <main className="gmarket-main">
        <Outlet />
      </main>
      <footer className="gmarket-footer">
        <div className="footer-inner">
          <div className="footer-info">
            <p className="footer-line">상호 : PixelStudio | 대표자명 : 강숙희</p>
            <p className="footer-line">사업자등록번호 : 424-11-02587 | 통신판매업신고번호 : 제 2023-대전유성-1254호</p>
            <hr className="footer-divider" />
            <p className="footer-copyright">© AppPot - 노현민 스튜디오 유통회사</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
