import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './UsedWebApp.css';

const FILTERS = ['전체', '웹', '앱', '콘텐츠·미디어'];

const LISTINGS = [
  {
    id: 1,
    name: '지역 뷰티 예약 SaaS',
    type: '웹',
    desc: '살롱·네일샵 예약·정산까지 한 화면. 실제 가맹점 100곳 이상 운영 중.',
    stat: '운영 2년 · MAU 약 8천',
    tag: 'B2B',
  },
  {
    id: 2,
    name: '독서 기록 커뮤니티 앱',
    type: '앱',
    desc: 'iOS·Android 동시 서비스. 리뷰·큐레이션 중심 커뮤니티.',
    stat: '운영 14개월 · DAU 약 1.2만',
    tag: '커뮤니티',
  },
  {
    id: 3,
    name: '소상공인 재고·발주 웹',
    type: '웹',
    desc: '도매·소매 매장용 재고·주문 관리. PG 연동 완료.',
    stat: '운영 3년 · 월 거래 건수 안정',
    tag: '업무용',
  },
  {
    id: 4,
    name: '니치 뉴스레터·멤버십',
    type: '콘텐츠·미디어',
    desc: '유료 구독·뉴스레터 발송·아카이브까지 통합.',
    stat: '운영 8개월 · 유료 구독자 보유',
    tag: '콘텐츠',
  },
  {
    id: 5,
    name: '반려동물 산책 매칭',
    type: '앱',
    desc: '지역 기반 매칭·채팅. 스토어 심사 통과 버전.',
    stat: '운영 1년 · 지역 3개 시 운영',
    tag: '로컬',
  },
  {
    id: 6,
    name: '온라인 클래스 마켓플레이스',
    type: '웹',
    desc: '강사·수강생 결제·정산·VOD 연동 구조.',
    stat: '운영 20개월 · 강의 200+ 편',
    tag: '에듀',
  },
];

function buildInquiryMessage(item) {
  const lines = [
    `[매물 문의] ${item.name}`,
    `유형: ${item.type}${item.tag ? ` · ${item.tag}` : ''}`,
    item.desc,
    item.stat,
  ];
  return lines.filter(Boolean).join('\n');
}

export default function UsedWebApp() {
  const [filter, setFilter] = useState('전체');
  const [loadingId, setLoadingId] = useState(null);
  const { user, api } = useAuth();
  const navigate = useNavigate();

  const filtered =
    filter === '전체'
      ? LISTINGS
      : LISTINGS.filter((l) => l.type === filter);

  const handleInquiry = async (item) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setLoadingId(item.id);
    try {
      const { data } = await api.post('/api/chat/rooms/marketplace-inquiry', {
        inquiry: buildInquiryMessage(item),
      });
      navigate(`/chat?room=${data.id}`);
    } catch (err) {
      alert(err.response?.data?.error || '채팅을 열 수 없습니다.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="op-market-page">
      <section className="op-market-hero">
        <div className="op-market-hero-inner">
          <span className="op-market-badge">실제 운영 중인 서비스만</span>
          <h1>
            운영 중인 사이트·앱
            <br />
            <span className="op-market-hero-accent">매물장</span>
          </h1>
          <p className="op-market-desc">
            이미 트래픽·매출·회원이 쌓인 웹·앱이 올라오는 공간입니다.
            <br />
            양도·인수·협업까지, 매물별로 조건이 다를 수 있어요.
          </p>
        </div>
      </section>

      <section className="op-market-toolbar">
        <div className="op-market-filters">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`op-market-filter ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <p className="op-market-count">표시 중 {filtered.length}건 · 예시 매물</p>
      </section>

      <section className="op-market-list-wrap">
        <ul className="op-market-grid">
          {filtered.map((item) => (
            <li key={item.id} className="op-market-card">
              <div className="op-market-card-head">
                <span className={`op-market-type op-market-type-${item.type === '앱' ? 'app' : item.type === '웹' ? 'web' : 'etc'}`}>
                  {item.type}
                </span>
                {item.tag && <span className="op-market-tag">{item.tag}</span>}
              </div>
              <h2 className="op-market-card-title">{item.name}</h2>
              <p className="op-market-card-desc">{item.desc}</p>
              <p className="op-market-card-stat">{item.stat}</p>
              <button
                type="button"
                className="op-market-card-cta"
                disabled={loadingId === item.id}
                onClick={() => handleInquiry(item)}
              >
                {loadingId === item.id ? '연결 중…' : '구매·문의하기'}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="op-market-footer-cta">
        <h2>매물로 올리고 싶으신가요?</h2>
        <p>운영 중인 서비스를 내놓거나, 인수·협업을 제안받으려면 의뢰로 알려 주세요.</p>
        <Link to="/projects/new" className="op-market-footer-link">
          매물 등록·상담 의뢰하기
        </Link>
      </section>
    </div>
  );
}
