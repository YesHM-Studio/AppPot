import { Link } from 'react-router-dom';
import { FEATURED_SERVICES } from '../data/featuredServices';
import './ProjectsBest.css';

export default function ProjectsBest() {
  return (
    <div className="projects-best">
      <section className="best-hero">
        <div className="best-hero-inner">
          <span className="best-badge">★★★★★ 5.0 만족도</span>
          <h1>지금 제일 잘 나가는<br />의뢰를 만나보세요</h1>
          <p className="best-hero-desc">
            앱·웹 화려한 디자인부터 프로덕션급 개발까지.<br />
            실사용자 만족도 5점을 기록한 검증된 서비스.
          </p>
          <Link to="/projects/new" className="best-cta">의뢰하기</Link>
          <div className="best-hero-stats">
            <div className="stat">
              <strong>4.9</strong>
              <span>평균 평점</span>
            </div>
            <div className="stat">
              <strong>1,200+</strong>
              <span>완료 프로젝트</span>
            </div>
            <div className="stat">
              <strong>98%</strong>
              <span>재의뢰율</span>
            </div>
          </div>
        </div>
      </section>

      <section className="best-featured">
        <h2>인기 서비스</h2>
        <div className="featured-grid">
          {FEATURED_SERVICES.map((s) => (
            <Link key={s.id} to={s.to} className="featured-card">
              <div className="featured-visual" style={{ background: s.gradient }}>
                <img src={s.image} alt={s.title} />
              </div>
              <div className="featured-stars">{'★'.repeat(s.stars)}</div>
              <h3>{s.title}</h3>
              <p className="featured-sub">{s.subtitle}</p>
              <p className="featured-desc">{s.desc}</p>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
