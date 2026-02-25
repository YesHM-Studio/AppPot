import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './ProjectDetail.css';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, api } = useAuth();
  const [project, setProject] = useState(null);
  const [selectedTier, setSelectedTier] = useState('general');
  const [selectedOptionsByTier, setSelectedOptionsByTier] = useState({ general: [], plus: [] });
  const [estimateForm, setEstimateForm] = useState({ amount: '', message: '', delivery_days: '' });
  const optionSelectRef = useRef(null);
  const purchaseBtnRef = useRef(null);

  useEffect(() => {
    axios.get(`/api/projects/${id}`).then(({ data }) => setProject(data)).catch(() => setProject(null));
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

  const isCommission = project.is_commission === 1;
  const options = (() => {
    if (!isCommission) return null;
    try {
      const raw = project.options_json ? JSON.parse(project.options_json) : {};
      const norm = (t) => {
        if (!t) return { price: null, items: [] };
        if (Array.isArray(t)) return { price: null, items: t };
        return { price: t.price ?? null, items: t.items ?? [] };
      };
      return {
        general: norm(raw.general),
        plus: norm(raw.plus),
        optional: Array.isArray(raw.optional) ? raw.optional : [],
        optionalPlus: Array.isArray(raw.optionalPlus) ? raw.optionalPlus : []
      };
    } catch {
      return { general: { price: null, items: [] }, plus: { price: null, items: [] }, optional: [], optionalPlus: [] };
    }
  })();

  if (isCommission && options) {
    const currentTier = selectedTier === 'general' ? options.general : options.plus;
    const basePrice = currentTier?.price ?? project.start_price ?? project.budget ?? 0;
    const currentOptional = selectedTier === 'general' ? (options.optional ?? []) : (options.optionalPlus ?? []);
    const selectedOptions = selectedOptionsByTier[selectedTier] ?? [];
    const selectedOptionalItems = currentOptional.filter((item, i) => selectedOptions.includes(item?.id ?? i));
    const optionalTotal = selectedOptionalItems.reduce((sum, o) => sum + (o.price ?? 0), 0);
    const totalPrice = basePrice + optionalTotal;
    const hasBrandGuide = selectedOptionalItems.some(o => (o.label || o).includes('브랜드 컬러'));
    const hasSocialLogin = selectedOptionalItems.some(o => (o.label || o).includes('소셜 로그인'));
    const hasSplash = selectedOptionalItems.some(o => (o.label || o).includes('스플래시'));
    const hasDarkMode = selectedOptionalItems.some(o => (o.label || o).includes('다크 모드'));
    const canSelectSocialLogin = selectedTier === 'general' && hasBrandGuide;
    const canSelectDarkMode = selectedTier === 'plus' && hasSplash;

    const priceDisplay = currentTier?.price != null
      ? (optionalTotal > 0 ? `${totalPrice.toLocaleString()}원` : `${currentTier.price?.toLocaleString()}원 부터`)
      : project.start_price != null ? `${project.start_price?.toLocaleString()}원 ~` : `${project.budget?.toLocaleString()}원`;

    const tierDescriptions = {
      general: '메인 1종 + 부가 화면 10종, 기본 컬러 가이드 포함. 수정 3회, 빠르고 확실한 MVP용 디자인.',
      plus: '메인 1종 + 부가 화면 50종, 팝업창 무제한. 브랜드 가이드·소셜 로그인 UI 포함, 수정 무제한.'
    };
    const hasTierOptions = options.general?.items?.length > 0 || options.plus?.items?.length > 0;
    let displayDescription = hasTierOptions ? (currentTier?.desc ?? tierDescriptions[selectedTier]) : project.description;
    if (hasDarkMode) displayDescription = '라이트/다크 모드 테마를 모두 지원하는 UI입니다. 시스템 설정에 따라 자동 전환됩니다.';
    else if (hasSplash) displayDescription = '앱 실행 시 로고와 함께 노출되는 스플래시·로딩 화면입니다. 앱 아이덴티티를 강화합니다.';
    else if (hasSocialLogin) displayDescription = '애플, 구글, X 등 소셜 로그인 버튼 UI가 포함된 디자인으로 한 번의 탭으로 간편 가입이 가능합니다.';
    else if (hasBrandGuide) displayDescription = '자신만의 브랜드 색상을 직접 선택해 앱 전반에 적용할 수 있습니다.';
    else if (selectedOptionalItems.length > 0) displayDescription += `\n\n[추가 선택] ${selectedOptionalItems.map(o => o.label || o).join(', ')}`;

    const hasOptions = true;

    return (
      <div className={`project-detail project-detail-apple`}>
        <div className="project-detail-main">
          <div className={`detail-main-image ${hasBrandGuide || hasSocialLogin || hasSplash || hasDarkMode ? 'brand-guide-active' : ''}`}>
            <img
              src={
                hasDarkMode ? '/images/commission-design-dark-mode.png'
                : hasSplash ? '/images/commission-design-splash-loading.png'
                : hasSocialLogin ? '/images/commission-design-social-login.png'
                : hasBrandGuide ? '/images/commission-design-brand-colors.png'
                : project.thumbnail_url || project.files?.[0]?.url || '/images/commission-design-app-ui.png'
              }
              alt={project.title}
            />
          </div>
        </div>
        <aside className="detail-sidebar">
          <div className="detail-sidebar-scroll">
            <div className="detail-header">
              <span className="status">{project.status}</span>
              <h1>{project.title}</h1>
              <p className="meta">{project.client_name} · {project.category} · <span className="price-start">{priceDisplay}</span></p>
            </div>
            {project.deadline && <p>마감일: {project.deadline}</p>}
            <div className="description">{displayDescription}</div>
            <div className="detail-options-inline">
              <div className="option-tier-row">
                <span className="option-tier-label">구성</span>
                <div className="option-tier-chips">
                  <button
                    type="button"
                    className={`option-tier-chip ${selectedTier === 'general' ? 'active' : ''}`}
                    onClick={() => { setSelectedTier('general'); setTimeout(() => optionSelectRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50); }}
                  >
                    일반 {options.general?.price != null && `${options.general.price?.toLocaleString()}원 부터`}
                  </button>
                  <button
                    type="button"
                    className={`option-tier-chip ${selectedTier === 'plus' ? 'active' : ''}`}
                    onClick={() => { setSelectedTier('plus'); setTimeout(() => optionSelectRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50); }}
                  >
                    플러스 {options.plus?.price != null && `${options.plus.price?.toLocaleString()}원 부터`}
                  </button>
                </div>
              </div>
              <div className="option-includes">
                <span className="option-includes-label">기본 포함</span>
                <ul className="option-includes-list">
                  {currentTier?.items?.map((item, i) => {
                    const label = typeof item === 'string' ? item : item.label;
                    const tooltip = typeof item === 'object' && item?.tooltip;
                    return (
                      <li key={i}>{label}{tooltip && <span className="option-tooltip" data-tooltip={tooltip} aria-label={tooltip}>?</span>}</li>
                    );
                  }) ?? []}
                </ul>
              </div>
              {currentOptional?.length > 0 && (
                <div className="option-select-row" ref={optionSelectRef}>
                  <span className="option-select-label">선택 추가</span>
                  <div className="option-select-grid">
                    {currentOptional.map((item, i) => {
                      const optId = item.id ?? i;
                      const checked = selectedOptions.includes(optId);
                      const isSocialLoginOption = selectedTier === 'general' && i === 1;
                      const isDarkModeOption = selectedTier === 'plus' && i === 1;
                      const isDisabled = (isSocialLoginOption && !canSelectSocialLogin) || (isDarkModeOption && !canSelectDarkMode);
                      return typeof item === 'string' ? null : (
                        <button
                          key={i}
                          type="button"
                          className={`option-select-chip ${checked ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                          disabled={isDisabled}
                          title={isDisabled ? (selectedTier === 'general' ? '1번을 먼저 선택해 주세요' : '스플래시·로딩 화면을 먼저 선택해 주세요') : undefined}
                          onClick={() => {
                            if (checked) {
                              const next = selectedOptions.filter((x) => x !== optId);
                              const toRemove = (optId === 0 && (selectedTier === 'general' || selectedTier === 'plus')) ? [0, 1] : [optId];
                              setSelectedOptionsByTier(prev => ({ ...prev, [selectedTier]: next.filter((x) => !toRemove.includes(x)) }));
                            } else if (!isDisabled) {
                              setSelectedOptionsByTier(prev => ({ ...prev, [selectedTier]: [...(prev[selectedTier] ?? []), optId] }));
                            }
                            setTimeout(() => purchaseBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                          }}
                        >
                          {item.label} {item.price != null && `+${item.price?.toLocaleString()}원`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              className="detail-purchase-btn"
              ref={purchaseBtnRef}
              onClick={() => {
                if (!user) { navigate('/login'); return; }
                alert('PG 연동 준비 중입니다. 채팅으로 문의해 주세요.');
                navigate('/chat');
              }}
            >
              총 {totalPrice.toLocaleString()}원 구매하기
            </button>
          </div>
        </aside>
      </div>
    );
  }

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
            <a key={f.id} href={f.url} target="_blank" rel="noreferrer">{f.filename}</a>
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
