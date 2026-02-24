import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './Projects.css';

export default function Projects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const [data, setData] = useState({ projects: [], total: 0 });
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    params.set('page', page);
    axios.get(`/api/projects?${params}`).then(({ data }) => setData(data));
  }, [category, page]);

  const onCategoryChange = (val) => {
    setPage(1);
    setSearchParams(val ? { category: val } : {});
  };

  return (
    <div className="projects-page">
      <div className="page-header">
        <h1>의뢰 목록</h1>
        <Link to="/projects/new" className="btn-primary">의뢰 등록</Link>
      </div>
      <div className="filter-bar">
        <select value={category} onChange={(e) => onCategoryChange(e.target.value)}>
          <option value="">전체 카테고리</option>
          {['디자인', '개발', '마케팅', '글쓰기', '번역', '기타'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="project-grid">
        {data.projects.map((p) => (
          <Link key={p.id} to={`/projects/${p.id}`} className="project-card">
            <span className="status-badge">{p.status}</span>
            <h3>{p.title}</h3>
            <p className="meta">{p.client_name} · {p.category}</p>
            <p className="budget">{p.budget?.toLocaleString()}원</p>
          </Link>
        ))}
      </div>
      {data.projects.length === 0 && <p className="empty">등록된 의뢰가 없습니다.</p>}
    </div>
  );
}
