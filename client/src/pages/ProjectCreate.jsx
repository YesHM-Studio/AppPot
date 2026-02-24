import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ProjectCreate.css';

export default function ProjectCreate() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', category: '', budget: '', deadline: '', description: '', files: []
  });
  const [error, setError] = useState('');

  const categories = ['디자인', '개발', '마케팅', '글쓰기', '번역', '기타'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('category', form.category);
    fd.append('budget', form.budget);
    fd.append('deadline', form.deadline);
    fd.append('description', form.description);
    form.files.forEach((f) => fd.append('files', f));
    try {
      const { data } = await api.post('/api/projects', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate(`/projects/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || '등록에 실패했습니다.');
    }
  };

  return (
    <div className="project-create">
      <h1>의뢰 등록</h1>
      <form onSubmit={handleSubmit}>
        <label>제목 *</label>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="의뢰 제목"
          required
        />
        <label>카테고리 *</label>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          required
        >
          <option value="">선택</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label>예산 (원) *</label>
        <input
          type="number"
          value={form.budget}
          onChange={(e) => setForm({ ...form, budget: e.target.value })}
          placeholder="예산"
          required
        />
        <label>마감일</label>
        <input
          type="date"
          value={form.deadline}
          onChange={(e) => setForm({ ...form, deadline: e.target.value })}
        />
        <label>설명</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={5}
          placeholder="의뢰 내용을 자세히 작성해주세요"
        />
        <label>파일 첨부</label>
        <input
          type="file"
          multiple
          onChange={(e) => setForm({ ...form, files: Array.from(e.target.files) })}
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-submit">등록하기</button>
      </form>
    </div>
  );
}
