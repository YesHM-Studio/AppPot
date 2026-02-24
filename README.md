# AppPot - 재능거래 플랫폼

크몽 스타일의 의뢰자-판매자 연결 플랫폼입니다.

## 실행 방법

```bash
# 1. 의존성 설치
npm run install:all

# 2. DB 초기화 (최초 1회)
cd server && npm run db:init

# 3. 개발 서버 실행 (백엔드 + 프론트엔드 동시)
npm run dev
```

- 프론트엔드: http://localhost:5173
- 백엔드 API: http://localhost:3001

## 기본 계정

| 구분 | 이메일 | 비밀번호 |
|------|--------|----------|
| 관리자 | admin@apppot.com | admin123 |

## 주요 기능

- 회원가입 (의뢰자/판매자)
- 의뢰 등록 (제목, 카테고리, 예산, 마감일, 파일첨부)
- 판매자 프로필/포트폴리오
- 견적 제안 및 수락
- 1:1 채팅
- 에스크로 결제 구조 (PG 연동 대비)
- 관리자 페이지

## 기술 스택

- Frontend: React, Vite, React Router
- Backend: Node.js, Express
- DB: SQLite
- 실시간: Socket.io
