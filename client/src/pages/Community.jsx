import { Link } from 'react-router-dom';
import './Community.css';

const POSTS = [
  { id: 1, title: 'AppPot 이용 후기 모아보기', excerpt: '실제 의뢰를 진행한 분들의 생생한 후기를 모았습니다.', date: '2026.02.25', category: '후기', thumb: null },
  { id: 2, title: '프로젝트 성공 노하우', excerpt: '의뢰 시 꼭 확인해야 할 체크리스트와 협업 팁을 공유합니다.', date: '2026.02.24', category: '팁', thumb: null },
  { id: 3, title: '견적 받는 법 A to Z', excerpt: '첫 견적 요청이 어려우신가요? 단계별 안내해 드립니다.', date: '2026.02.23', category: '가이드', thumb: null },
];

const CATEGORIES = ['전체', '후기', '팁', '가이드', '자유'];

export default function Community() {
  return (
    <div className="community-blog">
      <div className="community-header">
        <h1 className="community-title">AppPot 커뮤니티</h1>
        <p className="community-desc">의뢰 후기, 팁, 정보를 나누는 공간입니다.</p>
      </div>
      <div className="community-layout">
        <main className="community-main">
          <ul className="community-post-list">
            {POSTS.map((post) => (
              <li key={post.id} className="community-post-item">
                <Link to={`/community/${post.id}`} className="community-post-link">
                  <div className="community-post-thumb">
                    {post.thumb ? <img src={post.thumb} alt="" /> : <span className="community-post-thumb-placeholder">📝</span>}
                  </div>
                  <div className="community-post-body">
                    <span className="community-post-category">{post.category}</span>
                    <h3 className="community-post-title">{post.title}</h3>
                    <p className="community-post-excerpt">{post.excerpt}</p>
                    <span className="community-post-date">{post.date}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </main>
        <aside className="community-sidebar">
          <div className="community-sidebar-block">
            <h4>카테고리</h4>
            <ul className="community-category-list">
              {CATEGORIES.map((c) => (
                <li key={c}><Link to="/community">{c}</Link></li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
