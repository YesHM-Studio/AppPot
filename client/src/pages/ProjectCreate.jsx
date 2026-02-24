import { useState, useRef } from 'react';
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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const categories = ['디자인', '개발', '마케팅', '글쓰기', '번역', '기타'];

  const todayKST = (() => {
    const formatter = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
    return formatter.format(new Date());
  })();

  const addFiles = (newFiles) => {
    if (!newFiles?.length) return;
    setForm((prev) => ({ ...prev, files: [...prev.files, ...Array.from(newFiles)] }));
  };

  const handleFileChange = (e) => {
    addFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const budgetNum = parseInt(form.budget, 10);
    if (isNaN(budgetNum) || budgetNum < 100000) {
      setError('예산은 최소 10만원 이상 입력해주세요.');
      return;
    }
    if (form.deadline && form.deadline < todayKST) {
      setError('마감일은 오늘 이후로 선택해주세요.');
      return;
    }
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
          min={100000}
          value={form.budget}
          onChange={(e) => setForm({ ...form, budget: e.target.value })}
          placeholder="최소 10만원"
          required
        />
        <label>마감일</label>
        <input
          type="date"
          min={todayKST}
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
        <div
          className={`file-drop-zone ${isDragging ? 'dragging' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="file-input-hidden"
            onChange={handleFileChange}
          />
          <span className="file-drop-text">
            {isDragging ? '여기에 놓으세요' : '클릭하거나 파일을 드래그하여 놓으세요'}
          </span>
          {form.files.length > 0 && (
            <span className="file-drop-count">{form.files.length}개 파일 선택됨</span>
          )}
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-submit">등록하기</button>
      </form>
    </div>
  );
}
