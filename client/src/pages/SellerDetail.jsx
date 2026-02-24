import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './SellerDetail.css';

export default function SellerDetail() {
  const { id } = useParams();
  const [seller, setSeller] = useState(null);

  useEffect(() => {
    axios.get(`/api/sellers/${id}`).then(({ data }) => setSeller(data));
  }, [id]);

  if (!seller) return <div className="loading">로딩 중...</div>;

  return (
    <div className="seller-detail">
      <div className="seller-header">
        <div className="avatar">{seller.name?.[0]}</div>
        <div>
          <h1>{seller.name}</h1>
          <p>{seller.title || '판매자'}</p>
          <p className="rating">★ {seller.rating || 0} ({seller.review_count || 0} 리뷰)</p>
        </div>
      </div>
      {seller.bio && <div className="bio">{seller.bio}</div>}
      <h2>포트폴리오</h2>
      <div className="portfolio-grid">
        {seller.portfolios?.map((p) => (
          <div key={p.id} className="portfolio-item">
            {p.image_url && <img src={`http://localhost:3001${p.image_url}`} alt={p.title} />}
            <h4>{p.title}</h4>
            {p.description && <p>{p.description}</p>}
          </div>
        ))}
      </div>
      {(!seller.portfolios || seller.portfolios.length === 0) && <p className="empty">등록된 포트폴리오가 없습니다.</p>}
    </div>
  );
}
