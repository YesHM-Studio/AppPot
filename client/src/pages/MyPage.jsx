import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './MyPage.css';

export default function MyPage() {
  const { user, api } = useAuth();
  const [myProjects, setMyProjects] = useState([]);
  const [portfolioForm, setPortfolioForm] = useState({ title: '', description: '', category: '', image: null });

  useEffect(() => {
    if (user?.role === 'client') {
      axios.get('/api/projects?status=').then(({ data }) => {
        setMyProjects(data.projects?.filter((p) => p.client_id === user.id) || []);
      });
    }
  }, [user]);

  const handleAddPortfolio = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('title', portfolioForm.title);
    fd.append('description', portfolioForm.description);
    fd.append('category', portfolioForm.category);
    if (portfolioForm.image) fd.append('image', portfolioForm.image);
    try {
      await api.post('/api/sellers/portfolio', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPortfolioForm({ title: '', description: '', category: '', image: null });
    } catch (err) {
      alert(err.response?.data?.error || '등록 실패');
    }
  };

  return (
    <div className="mypage">
      <h1>마이페이지</h1>
      <div className="profile-card">
        <h2>{user?.name}</h2>
        <p>{user?.email}</p>
        <span className="role">{user?.role === 'client' ? '의뢰자' : user?.role === 'seller' ? '판매자' : '관리자'}</span>
      </div>
      {user?.role === 'client' && (
        <section>
          <h2>내 의뢰</h2>
          <Link to="/projects/new" className="btn-add">새 의뢰</Link>
          <div className="my-projects">
            {myProjects.map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`}>{p.title} - {p.status}</Link>
            ))}
          </div>
        </section>
      )}
      {user?.role === 'seller' && (
        <section>
          <h2>포트폴리오 등록</h2>
          <form onSubmit={handleAddPortfolio} className="portfolio-form">
            <input
              placeholder="제목"
              value={portfolioForm.title}
              onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
              required
            />
            <textarea
              placeholder="설명"
              value={portfolioForm.description}
              onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
            />
            <select
              value={portfolioForm.category}
              onChange={(e) => setPortfolioForm({ ...portfolioForm, category: e.target.value })}
            >
              <option value="">카테고리</option>
              {['디자인', '개발', '마케팅', '글쓰기', '번역', '기타'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input type="file" accept="image/*" onChange={(e) => setPortfolioForm({ ...portfolioForm, image: e.target.files[0] })} />
            <button type="submit">등록</button>
          </form>
        </section>
      )}
    </div>
  );
}
