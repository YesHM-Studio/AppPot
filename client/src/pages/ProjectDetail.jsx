import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './ProjectDetail.css';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [estimateForm, setEstimateForm] = useState({ amount: '', message: '', delivery_days: '' });

  useEffect(() => {
    axios.get(`/api/projects/${id}`).then(({ data }) => setProject(data));
  }, [id]);

  const handleSubmitEstimate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/estimates', {
        project_id: id,
        ...estimateForm,
        amount: parseInt(estimateForm.amount)
      });
      const { data } = await axios.get(`/api/projects/${id}`);
      setProject(data);
      setEstimateForm({ amount: '', message: '', delivery_days: '' });
    } catch (err) {
      alert(err.response?.data?.error || '제출 실패');
    }
  };

  const acceptEstimate = async (estimateId) => {
    try {
      await api.patch(`/api/estimates/${estimateId}/accept`);
      const { data } = await axios.get(`/api/projects/${id}`);
      setProject(data);
    } catch (err) {
      alert(err.response?.data?.error || '수락 실패');
    }
  };

  const startChat = async (sellerId) => {
    try {
      const { data } = await api.post('/api/chat/rooms', { project_id: id, seller_id: sellerId });
      navigate(`/chat?room=${data.id}`);
    } catch (err) {
      alert(err.response?.data?.error || '채팅방 생성 실패');
    }
  };

  if (!project) return <div className="loading">로딩 중...</div>;

  const isClient = user?.id === project.client_id;
  const isSeller = user?.role === 'seller';

  return (
    <div className="project-detail">
      <div className="detail-header">
        <span className="status">{project.status}</span>
        <h1>{project.title}</h1>
        <p className="meta">{project.client_name} · {project.category} · {project.budget?.toLocaleString()}원</p>
      </div>
      {project.deadline && <p>마감일: {project.deadline}</p>}
      {project.description && <div className="description">{project.description}</div>}
      {project.files?.length > 0 && (
        <div className="files">
          <strong>첨부파일:</strong>
          {project.files.map((f) => (
            <a key={f.id} href={`http://localhost:3001${f.url}`} target="_blank" rel="noreferrer">{f.filename}</a>
          ))}
        </div>
      )}

      <div className="estimates-section">
        <h2>견적 제안</h2>
        {isSeller && project.status === 'open' && (
          <form onSubmit={handleSubmitEstimate} className="estimate-form">
            <input
              type="number"
              placeholder="견적 금액"
              value={estimateForm.amount}
              onChange={(e) => setEstimateForm({ ...estimateForm, amount: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="작업일"
              value={estimateForm.delivery_days}
              onChange={(e) => setEstimateForm({ ...estimateForm, delivery_days: e.target.value })}
            />
            <textarea
              placeholder="메시지"
              value={estimateForm.message}
              onChange={(e) => setEstimateForm({ ...estimateForm, message: e.target.value })}
            />
            <button type="submit">견적 제안</button>
          </form>
        )}
        {project.estimates?.map((e) => (
          <div key={e.id} className="estimate-card">
            <div className="estimate-info">
              <strong>{e.seller_name}</strong>
              <span>{e.amount?.toLocaleString()}원 · {e.delivery_days}일</span>
              {e.message && <p>{e.message}</p>}
            </div>
            <div className="estimate-actions">
              {isClient && e.status === 'pending' && (
                <>
                  <button onClick={() => startChat(e.seller_id)}>채팅</button>
                  <button onClick={() => acceptEstimate(e.id)} className="btn-accept">수락</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
