import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="logo">AppPot</Link>
          <div className="search-bar">
            <input type="text" placeholder="어떤 재능이 필요하세요?" />
          </div>
          <nav className="nav">
            <Link to="/projects">의뢰 목록</Link>
            <Link to="/sellers">판매자 찾기</Link>
            {user ? (
              <>
                <Link to="/mypage">마이페이지</Link>
                <Link to="/chat">채팅</Link>
                {user.role === 'admin' && <Link to="/admin">관리자</Link>}
                <button onClick={logout} className="btn-text">로그아웃</button>
                <Link to="/projects/new" className="btn-primary">의뢰하기</Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-text">로그인</Link>
                <Link to="/register" className="btn-primary">회원가입</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <p>© AppPot - 재능거래 플랫폼</p>
      </footer>
    </div>
  );
}
