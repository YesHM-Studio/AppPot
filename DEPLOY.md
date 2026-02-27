# AppPot Render 배포 가이드

## 1. GitHub에 푸시

```bash
cd /Users/nhm_studio/AppPot
git add .
git commit -m "Add Render deployment config"
git push origin main
```

## 2. Render에서 배포

1. [render.com](https://render.com) 로그인
2. **New +** → **Web Service**
3. GitHub 저장소 연결 (AppPot 선택)
4. `render.yaml`이 자동으로 감지됩니다
5. **Create Web Service** 클릭

## 3. 배포 후

- 첫 배포에 3~5분 정도 소요됩니다
- 완료되면 `https://apppot-xxxx.onrender.com` 형태의 URL이 발급됩니다

## ⚠️ 참고 (무료 플랜)

- **SQLite DB**: 재시작 시 데이터가 초기화될 수 있습니다 (임시 파일시스템)
- 영구 데이터가 필요하면 Render PostgreSQL 등 별도 DB 연동을 고려해 보세요
