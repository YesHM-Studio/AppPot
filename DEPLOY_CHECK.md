# Render 배포 확인 방법

## 1. Render 대시보드에서 확인

1. https://dashboard.render.com 접속
2. **apppot** 서비스 클릭
3. **Events** 탭 → 가장 최근 배포가 **"Deploy live"** 상태인지 확인
4. 실패했다면 빨간색 에러 메시지 확인

## 2. 강제 재배포 (캐시 삭제)

Render 대시보드 → apppot → **Manual Deploy** → **"Clear build cache & deploy"** 선택

→ 완전히 새로 빌드해서 배포됨

## 3. 새 배포 후 확인

- **시크릿 창**에서 Render URL 접속 (캐시 없음)
- 또는 휴대폰에서 접속 (다른 기기 = 다른 캐시)

## 4. 배포 URL

- Render 기본: `https://apppot-xxxx.onrender.com`
- 커스텀 도메인: `https://appot.kr` (DNS 전파까지 5~30분 걸릴 수 있음)
