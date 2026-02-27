import { Link } from 'react-router-dom';
import './UsedWebApp.css';

const FEATURES = [
  {
    icon: '🔐',
    title: '인증 시스템',
    desc: '회원가입, 로그인, 소셜 로그인(카카오·네이버·구글), 비밀번호 찾기까지 완벽한 인증 플로우',
  },
  {
    icon: '🛒',
    title: '중고거래 기능',
    desc: '물품 등록, 검색·필터, 찜하기, 채팅 문의, 거래 내역 관리까지 한 번에',
  },
  {
    icon: '📱',
    title: '반응형 웹앱',
    desc: 'PC·태블릿·모바일 어디서나 쾌적한 UX, PWA 지원으로 앱처럼 사용 가능',
  },
];

export default function UsedWebApp() {
  return (
    <div className="used-webapp-page">
      <section className="used-webapp-hero">
        <div className="used-webapp-hero-inner">
          <span className="used-webapp-badge">인증 + 중고거래 + 웹앱</span>
          <h1>인증 중고거래 웹앱<br />30일 안에 완성</h1>
          <p className="used-webapp-desc">
            회원 인증부터 중고거래 기능까지.<br />
            검증된 스택으로 빠르고 안정적인 웹앱을 구축합니다.
          </p>
          <Link to="/projects/new" className="used-webapp-cta">의뢰하기</Link>
        </div>
      </section>

      <section className="used-webapp-features">
        <h2>포함 기능</h2>
        <div className="used-webapp-feature-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="used-webapp-feature-card">
              <span className="used-webapp-feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="used-webapp-cta-section">
        <p>지금 바로 견적을 요청해 보세요.</p>
        <Link to="/projects/new" className="used-webapp-cta-secondary">의뢰하기</Link>
      </section>
    </div>
  );
}
