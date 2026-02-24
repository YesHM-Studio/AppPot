import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Home.css';
import imgWeb from '../assets/images/review-web-result.png';
import imgPg from '../assets/images/review-pg-result.png';
import imgApp from '../assets/images/review-app-result.png';
import imgDesign from '../assets/images/review-design-result.png';
import imgMarketing from '../assets/images/review-marketing-result.png';
import imgChatbot from '../assets/images/review-chatbot-result.png';

const REVIEWS = [
  { name: '김*민', rating: 5, text: '30일 만에 웹 로그인·결제까지 모두 완료했어요. 생각보다 훨씬 빨라서 놀랐습니다!', project: '웹 개발', face: 'smile', image: imgWeb },
  { name: '이*현', rating: 5, text: 'PG 연동 처음인데 법인 맞춤으로 수수료도 잘 봐주시고, 설명이 친절했습니다.', project: 'PG 연동', face: 'wink', image: imgPg },
  { name: '박*수', rating: 5, text: '첫 견적 30% 할인 받고 의뢰했는데, 품질도 만족스럽고 가격 대비 최고예요.', project: '앱 개발', face: 'grin', image: imgApp },
  { name: '최*영', rating: 5, text: '브랜드 로고랑 네이밍까지 같이 받았는데 퀄리티가 정말 좋아요. 카페 오픈 준비 완료!', project: '디자인', face: 'smile', image: imgDesign },
  { name: '정*훈', rating: 5, text: '인스타그램 마케팅 의뢰했는데 팔로워 2배 늘었어요. 타겟 설정이 정말 신경 써주시더라구요.', project: '마케팅', face: 'grin', image: imgMarketing },
  { name: '한*지', rating: 5, text: '고객 상담 챗봇 구축했는데 응답 속도랑 답변 품질 다 만족스러워요. 영업 효율이 확 올랐어요.', project: '챗봇 개발', face: 'wink', image: imgChatbot },
];
const REPEAT_COUNT = 20;
const REVIEWS_TRACK = Array(REPEAT_COUNT).fill(null).flatMap(() => REVIEWS);

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [bannerPaused, setBannerPaused] = useState(false);
  const reviewScrollRef = useRef(null);
  const [reviewScrollPaused, setReviewScrollPaused] = useState(false);
  const dragRef = useRef({ isDragging: false, startX: 0, startScroll: 0 });

  useEffect(() => {
    axios.get('/api/projects?limit=8', { timeout: 10000 })
      .then(({ data }) => setProjects(data.projects || []))
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    if (bannerPaused) return;
    const t = setInterval(() => {
      setBannerIndex((i) => (i + 1) % 3);
    }, 4000);
    return () => clearInterval(t);
  }, [bannerPaused]);

  useEffect(() => {
    if (reviewScrollPaused) return;
    const el = reviewScrollRef.current;
    if (!el) return;
    let id = 0;
    const tick = () => {
      el.scrollLeft += 0.4;
      const segmentWidth = el.scrollWidth / REPEAT_COUNT;
      if (el.scrollLeft >= segmentWidth - 1) el.scrollLeft = 0;
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [reviewScrollPaused]);

  const handleReviewMouseDown = (e) => {
    dragRef.current = { isDragging: true, startX: e.clientX, startScroll: reviewScrollRef.current?.scrollLeft ?? 0 };
  };
  const handleReviewMouseMove = (e) => {
    if (!dragRef.current.isDragging) return;
    const dx = dragRef.current.startX - e.clientX;
    if (reviewScrollRef.current) reviewScrollRef.current.scrollLeft = dragRef.current.startScroll + dx;
  };
  const handleReviewMouseUp = () => {
    dragRef.current.isDragging = false;
  };
  useEffect(() => {
    const move = handleReviewMouseMove;
    const up = handleReviewMouseUp;
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, []);

  const categories = [
    { to: '/projects', label: '전체 의뢰', icon: '◆', color: 'primary' },
    { to: '/projects?category=디자인', label: '디자인', icon: '◇', color: 'design' },
    { to: '/projects?category=마케팅', label: '마케팅', icon: '◇', color: 'marketing' },
    { to: '/projects?category=기타', label: '기타', icon: '◇', color: 'etc' },
    { to: '/sellers', label: '판매자 찾기', icon: '◆', color: 'sellers' },
  ];

  const categoryIcons = [
    { to: '/projects?category=디자인', label: '디자인', gradient: 'linear-gradient(135deg, #00796b 0%, #26a69a 100%)', icon: 'design' },
    { to: '/projects?category=마케팅', label: '마케팅', gradient: 'linear-gradient(135deg, #26a69a 0%, #4db6ac 100%)', icon: 'marketing' },
    { to: '/projects?category=기타', label: '기타', gradient: 'linear-gradient(135deg, #4db6ac 0%, #80cbc4 100%)', icon: 'etc' },
    { to: '/sellers', label: '판매자 찾기', gradient: 'linear-gradient(135deg, #26a69a 0%, #80cbc4 100%)', icon: 'sellers' },
  ];

  const CatIcon = ({ type }) => {
    const icons = {
      design: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
      ),
      marketing: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-5"/></svg>
      ),
      etc: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
      ),
      sellers: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      ),
    };
    return <span className="cat-icon-svg">{icons[type] || icons.etc}</span>;
  };

  const banners = [
    { title: '지금 로그인하고 견적 받으면 30% 할인혜택도???', desc: '회원가입 후 첫 견적 요청 시 30% 할인', cta: '로그인하고 견적받기', to: '/login', visual: 'discount' },
    { title: '남들은 3개월 걸리는 거? 30일로 바꿔드리겠습니다.', desc: '이 30일 안에 웹 로그인·사용자 auth 모두 한번에!', cta: '의뢰하기', to: '/projects/new', visual: 'speed' },
    { title: 'PG사 연동까지 도와드릴게요.', desc: '법인·개인에 따라 맞춤 솔루션, 수수료 최대한 감면', cta: '상담 신청', to: '/projects/new', visual: 'payment' },
  ];

  const HeroVisual = ({ type }) => {
    if (type === 'discount') return (
      <div className="hero-visual hero-visual-discount">
        <div className="hero-discount-wrap">
          <svg className="hero-icon-tag" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          <span className="hero-badge">30%</span>
          <svg className="hero-icon-sparkle" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"/></svg>
        </div>
        <span className="hero-badge-sub">첫 견적 할인</span>
      </div>
    );
    if (type === 'speed') return (
      <div className="hero-visual hero-visual-speed">
        <div className="hero-speed-wrap">
          <svg className="hero-icon-cal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span className="hero-badge">30</span>
          <svg className="hero-icon-rocket" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
        </div>
        <span className="hero-badge-sub">일 완성</span>
      </div>
    );
    if (type === 'payment') return (
      <div className="hero-visual hero-visual-payment">
        <div className="hero-pg-diagram">
          <div className="hero-pg-node">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            <span>쇼핑몰</span>
          </div>
          <svg className="hero-pg-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          <div className="hero-pg-node main">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"/><line x1="2" y1="6" x2="22" y2="6"/><line x1="6" y1="2" x2="6" y2="6"/><line x1="18" y1="2" x2="18" y2="6"/><line x1="6" y1="18" x2="18" y2="18"/><line x1="6" y1="14" x2="18" y2="14"/></svg>
            <span>PG</span>
          </div>
          <svg className="hero-pg-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          <div className="hero-pg-node">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/><line x1="1" y1="14" x2="23" y2="14"/></svg>
            <span>은행</span>
          </div>
        </div>
        <span className="hero-badge-sub">법인·개인 맞춤 연동</span>
      </div>
    );
    return null;
  };

  return (
    <div className="home-gmarket">
      <section className="hero-with-category">
        <aside className="category-sidebar">
          <h3 className="category-title">전체카테고리</h3>
          <ul className="category-menu">
            {categories.map((c) => (
              <li key={c.label}><Link to={c.to} className={c.color}>{c.label}</Link></li>
            ))}
          </ul>
        </aside>
        <div className="banner-area">
          <div className="banner-carousel">
            {banners.map((b, i) => (
              <div key={i} className={`banner-slide ${i === bannerIndex ? 'active' : ''}`}>
                <div className="hero-diagram">
                  <HeroVisual type={b.visual} />
                </div>
                <div className="slide-content">
                  <h1>{b.title}</h1>
                  <p>{b.desc}</p>
                  <Link to={b.to} className="banner-cta">{b.cta}</Link>
                </div>
              </div>
            ))}
          </div>
          <div className="banner-controls">
            <button type="button" className="banner-pause" onClick={() => setBannerPaused(!bannerPaused)} aria-label={bannerPaused ? '재생' : '일시정지'}>
              {bannerPaused ? (
                <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              )}
            </button>
            <div className="banner-dots">
              {banners.map((_, i) => (
                <button key={i} type="button" className={`banner-dot ${i === bannerIndex ? 'active' : ''}`} onClick={() => setBannerIndex(i)} aria-label={`${i + 1}번 배너`} />
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="category-icons-row">
        <div className="category-icons-inner">
          {categoryIcons.map((c) => (
            <Link key={c.label} to={c.to} className="cat-icon-card" style={{ '--cat-grad': c.gradient }}>
              <span className="cat-icon-box">
                <CatIcon type={c.icon} />
              </span>
              <span className="cat-icon-label">{c.label}</span>
            </Link>
          ))}
        </div>
        <Link to="/projects/new" className="cat-row-banner">
          지금 의뢰 · 최대 20% 할인
        </Link>
      </section>
      <section className="reviews-section">
        <h2 className="section-title">실제 이용 후기</h2>
        <div
          ref={reviewScrollRef}
          className="reviews-carousel"
          onMouseEnter={() => setReviewScrollPaused(true)}
          onMouseLeave={() => setReviewScrollPaused(false)}
          onMouseDown={handleReviewMouseDown}
        >
          <div className="reviews-track">
            {REVIEWS_TRACK.map((r, i) => (
              <div key={i} className="review-card">
                <div className="review-card-image">
                  <img src={r.image} alt={`${r.project} 결과물`} />
                </div>
                <div className="review-header">
                  <span className="review-stars">{'★'.repeat(r.rating)}</span>
                  <span className="review-project">{r.project}</span>
                </div>
                <p className="review-text">{r.text}</p>
                <span className="review-author">
                  <span className="review-face" aria-hidden>
                    {r.face === 'smile' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><circle cx="8" cy="10" r="1.2"/><circle cx="16" cy="10" r="1.2"/><path d="M8 15c2 2 4 2 8 0" strokeLinecap="round"/></svg>}
                    {r.face === 'wink' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><circle cx="8" cy="10" r="1.2"/><path d="M16 10.5c-.5 0-1 .5-1 1s.5 1 1 1" strokeLinecap="round"/><path d="M8 15c2 2 4 2 8 0" strokeLinecap="round"/></svg>}
                    {r.face === 'grin' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><circle cx="8" cy="10" r="1.2"/><circle cx="16" cy="10" r="1.2"/><path d="M7 15c1.5 2 3.5 3 6 3s4.5-1 6-3" strokeLinecap="round"/></svg>}
                  </span>
                  {r.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="product-section">
        <div className="section-head">
          <h2>지금 제일 잘 나가는 의뢰</h2>
          <Link to="/projects" className="more-link">전체보기</Link>
        </div>
        <div className="product-grid">
          {projects.length > 0 ? (
            projects.map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="product-card">
                <div className="card-thumb" />
                <div className="card-info">
                  <h3>{p.title}</h3>
                  <p className="card-meta">{p.client_name} · {p.category}</p>
                  <p className="card-price">{p.budget?.toLocaleString()}원</p>
                </div>
              </Link>
            ))
          ) : (
            <div className="empty-msg">
              <p>등록된 의뢰가 없어요.</p>
              <Link to="/projects/new">첫 의뢰 등록하기</Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
