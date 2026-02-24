import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>검증된 재능 전문가를 찾으신다면?</h1>
          <p>AppPot이 연결해드립니다. 의뢰부터 결제까지 한 곳에서.</p>
          <Link to="/projects/new" className="btn-hero">의뢰하기</Link>
        </div>
        <div className="hero-visual" />
      </section>
      <section className="categories">
        <h2>카테고리</h2>
        <div className="category-grid">
          {['디자인', '개발', '마케팅', '글쓰기', '번역', '기타'].map((cat) => (
            <Link key={cat} to={`/projects?category=${cat}`} className="category-card">
              {cat}
            </Link>
          ))}
        </div>
      </section>
      <section className="cta">
        <div className="cta-box">
          <h3>재능을 거래하는 가장 쉬운 방법</h3>
          <p>안전한 에스크로 결제로 믿고 거래하세요.</p>
          <Link to="/register" className="btn-cta">시작하기</Link>
        </div>
      </section>
    </div>
  );
}
