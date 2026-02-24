# AppPot Render 배포 가이드

## 1. GitHub에 코드 올리기

```bash
cd /Users/nhm_studio/AppPot
git add .
git commit -m "Render 배포 준비"
git push origin main
```

※ GitHub 저장소가 없다면 먼저 생성 후 연결하세요.

---

## 2. Render에서 배포하기

1. **[Render](https://render.com)** 접속 후 **회원가입/로그인**
2. **Dashboard** → **New +** → **Web Service**
3. **Connect a repository** → GitHub 연결 (처음이면 권한 허용)
4. **AppPot** 저장소 선택
5. 아래처럼 설정:

| 항목 | 값 |
|------|-----|
| **Name** | apppot |
| **Region** | Singapore (가까운 지역) |
| **Branch** | main |
| **Runtime** | Node |
| **Build Command** | `npm run install:all && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Free (무료) |

6. **Create Web Service** 클릭
7. 배포 완료까지 3~5분 대기
8. 완료 후 `https://apppot-xxxx.onrender.com` 같은 URL 확인

---

## 3. appot.kr 도메인 연결

1. Render 대시보드 → **apppot** 서비스 클릭
2. **Settings** → **Custom Domains**
3. **Add Custom Domain** 클릭
4. `appot.kr` 입력 후 추가
5. Render가 표시하는 **CNAME 값** 확인 (예: `apppot-xxxx.onrender.com`)

### 호스팅케이알 DNS에 등록

1. [호스팅케이알](https://app.hosting.kr) → appot.kr → **DNS 레코드 관리**
2. **추가** 클릭 후:

| 유형 | 호스트 이름 | 값 |
|------|-------------|-----|
| CNAME | www | `(Render CNAME 주소)` |
| CNAME | @ | `(Render CNAME 주소)` ← 지원 안 할 수 있음 |

※ 루트(@) CNAME이 안 되면 Render에서 **A 레코드용 IP**를 확인해 A 레코드로 추가

---

## 4. 로컬 실행 (변경됨)

```bash
npm run start:local
# 또는
PORT=5000 npm start
```

→ http://localhost:5000

---

## ⚠️ 참고

- **Render 무료 플랜**: 15분 미사용 시 슬립 → 첫 접속 시 느릴 수 있음
- **SQLite**: Render 파일시스템은 재배포 시 초기화됨. 장기적으로 PostgreSQL 권장
- **HTTPS**: Render는 자동으로 SSL 인증서 적용
