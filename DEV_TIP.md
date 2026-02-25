# 로컬 개발

## 명령어

```bash
cd /Users/nhm_studio/AppPot
npm run dev
```

→ **http://localhost:3001** 접속

(브라우저 자동 열기: `npm run serve:open`)

## 적용된 캐시 방지 설정

- 프록시 응답에 `no-cache` 헤더 강제
- Vite 서버 캐시 비활성화
- 새로고침 시 항상 최신 반영

## 명령어 요약

| 명령어 | 용도 |
|--------|------|
| `npm run dev` | 로컬 개발 (권장) |
| `npm run serve:open` | dev + 브라우저 자동 열기 |
| `serve:watch` | 빌드 결과 확인 |
| `serve:new` | 새 포트로 빌드 후 실행 |
