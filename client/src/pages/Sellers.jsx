import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Sellers.css';

export default function Sellers() {
  const [sellers, setSellers] = useState([]);
  const [category, setCategory] = useState('');

  useEffect(() => {
    const params = category ? `?category=${category}` : '';
    axios.get(`/api/sellers${params}`).then(({ data }) => setSellers(data));
  }, [category]);

  return (
    <div className="sellers-page">
      <h1>판매자 찾기</h1>
      <div className="sellers-layout">
        <aside className="sellers-sidebar">
          <h4>카테고리</h4>
          <ul>
            <li><button className={!category ? 'active' : ''} onClick={() => setCategory('')}>전체</button></li>
            {['디자인', '개발', '마케팅', '글쓰기', '번역', '기타'].map((c) => (
              <li key={c}><button className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>{c}</button></li>
            ))}
          </ul>
        </aside>
        <div className="sellers-main">
          <div className="filter-strip">
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">업종 전체</option>
              {['디자인', '개발', '마케팅', '글쓰기', '번역', '기타'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <span className="sort-label">추천순</span>
          </div>
          <div className="seller-grid">
            {sellers.map((s) => (
              <Link key={s.user_id} to={`/sellers/${s.user_id}`} className="seller-card">
                <div className="avatar">{s.name?.[0]}</div>
                <h3>{s.name}</h3>
                <p className="title">{s.title || '판매자'}</p>
                <p className="rating">★ {s.rating || 0} ({s.review_count || 0})</p>
              </Link>
            ))}
          </div>
          {sellers.length === 0 && <p className="empty">등록된 판매자가 없습니다.</p>}
        </div>
      </div>
    </div>
  );
}
