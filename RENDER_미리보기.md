# Render 미리보기 (사람들한테 안 보이는 테스트용)

로컬이 안 되니까 **Render PR 미리보기**로 확인하세요.

## 1. Render에서 설정

1. [Render 대시보드](https://dashboard.render.com) → **apppot** 서비스 클릭
2. **Previews** 탭 → **Pull Request Previews** 활성화
3. **Automatic** 선택 (PR 만들면 자동으로 미리보기 생성)

## 2. 작업 흐름

```bash
# 1. 새 브랜치 생성
git checkout -b preview

# 2. 코드 수정 후 푸시
git add .
git commit -m "수정 내용"
git push origin preview

# 3. GitHub에서 Pull Request 만들기
#   (preview → main으로)
```

## 3. 미리보기 URL 확인

- GitHub PR 페이지에 **Render 미리보기 링크**가 자동으로 붙음
- 예: `https://apppot-pr-45.onrender.com`
- **이 링크는 검색 노출 안 됨** (noindex)
- 아무도 모르는 URL이라 사실상 나만 볼 수 있음

## 4. 괜찮으면 반영

- PR **Merge** → main에 반영 → 배포
- 미리보기 인스턴스는 자동으로 삭제
