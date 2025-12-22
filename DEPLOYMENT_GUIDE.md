# 📚 GitHub Pages 배포 완벽 가이드

## 🎯 목표
이 가이드는 프로젝트를 GitHub Pages에 배포하고 자동 업데이트를 설정하는 방법을 안내합니다.

---

## 📋 사전 준비

### 1. GitHub 계정 생성
- https://github.com 에서 계정 생성
- 무료 계정으로 충분합니다

### 2. Git 설치 확인
```bash
git --version
```
설치 안 되어 있다면: https://git-scm.com/download/win

---

## 🚀 1단계: GitHub 저장소 생성

### GitHub 웹사이트에서:
1. 로그인 후 우측 상단 `+` 버튼 클릭
2. `New repository` 선택
3. 저장소 정보 입력:
   - **Repository name**: `counseling-log-system` (원하는 이름)
   - **Description**: 프로그램관리자 업무수행일지 자동화 시스템
   - **Public** 선택 (GitHub Pages는 무료로 Public만 지원)
   - ✅ **Add a README file** 체크 해제 (이미 만들었으므로)
   - ✅ **Add .gitignore** 체크 해제
   - ✅ **Choose a license** 선택 안 함
4. `Create repository` 클릭

---

## 🔗 2단계: 로컬 프로젝트와 GitHub 연결

### 현재 프로젝트 폴더에서:

```bash
# 1. Git 사용자 정보 설정 (최초 1회만)
git config --global user.name "당신의 이름"
git config --global user.email "your-email@example.com"

# 2. 현재 상태 확인
git status

# 3. 모든 파일 추가 (백업 폴더와 대용량 파일은 .gitignore로 제외됨)
git add .

# 4. 첫 커밋 생성
git commit -m "Initial commit: 프로젝트 초기 설정"

# 5. GitHub 저장소와 연결
git remote add origin https://github.com/[사용자명]/[저장소명].git

# 6. main 브랜치로 이름 변경 (필요시)
git branch -M main

# 7. GitHub에 푸시
git push -u origin main
```

**예시:**
```bash
git remote add origin https://github.com/johndoe/counseling-log-system.git
git push -u origin main
```

---

## ⚙️ 3단계: GitHub Pages 활성화

### GitHub 저장소 웹페이지에서:

1. 저장소 페이지 상단의 **Settings** 탭 클릭
2. 왼쪽 메뉴에서 **Pages** 클릭
3. **Source** 섹션에서:
   - **Source**: `GitHub Actions` 선택
4. 저장하면 자동으로 배포 시작

---

## 🎉 4단계: 배포 확인

### 배포 상태 확인:
1. 저장소 페이지 상단의 **Actions** 탭 클릭
2. 진행 중인 워크플로우 확인
3. ✅ 초록색 체크마크 = 배포 성공
4. ❌ 빨간색 X = 배포 실패 (로그 확인 필요)

### 배포된 사이트 접속:
- URL: `https://[사용자명].github.io/[저장소명]/`
- 예시: `https://johndoe.github.io/counseling-log-system/`

**접속 시 주의:**
- 첫 배포는 5-10분 정도 소요될 수 있습니다
- 캐시 때문에 업데이트가 바로 안 보일 수 있습니다 (Ctrl+F5로 새로고침)

---

## 🔄 5단계: 코드 수정 및 자동 배포

### 일상적인 업데이트 프로세스:

```bash
# 1. 파일 수정 (index.html 등)

# 2. 수정된 파일 확인
git status

# 3. 변경사항 추가
git add .

# 4. 커밋 메시지와 함께 저장
git commit -m "기능 추가: 새로운 필터 기능"

# 5. GitHub에 푸시 (자동 배포 시작!)
git push origin main
```

### 자동으로 일어나는 일:
1. 코드가 GitHub에 푸시됨
2. GitHub Actions가 자동 실행
3. 새 버전이 GitHub Pages에 배포
4. 5분 이내에 사이트 업데이트 완료

---

## 📊 6단계: 버전 관리 모범 사례

### 커밋 메시지 규칙:
```bash
# 기능 추가
git commit -m "feat: 새로운 보고서 양식 추가"

# 버그 수정
git commit -m "fix: 날짜 선택 오류 수정"

# 스타일 변경
git commit -m "style: 버튼 색상 변경"

# 문서 업데이트
git commit -m "docs: README 업데이트"
```

### 브랜치 전략 (선택사항):
```bash
# 새 기능 개발용 브랜치 생성
git checkout -b feature/new-report

# 개발 완료 후 main에 병합
git checkout main
git merge feature/new-report
git push origin main
```

---

## 🛠️ 문제 해결

### 1. 푸시가 안 될 때:
```bash
# 원격 저장소 변경사항 먼저 가져오기
git pull origin main --rebase
git push origin main
```

### 2. 배포는 성공했는데 사이트가 안 보일 때:
- 5-10분 대기
- 브라우저 캐시 삭제 (Ctrl+Shift+Del)
- 시크릿 모드로 접속

### 3. 파일 크기 제한 오류:
- GitHub는 100MB 이상 파일 업로드 불가
- `.gitignore`에 대용량 파일 추가
- program_data.json은 이미 제외됨

### 4. API 키 노출 방지:
- 절대로 API 키를 코드에 하드코딩하지 마세요
- localStorage 사용 (현재 방식) 유지
- 또는 GitHub Secrets 사용 (고급)

---

## 🔒 보안 팁

### API 키 관리:
- ✅ localStorage에 저장 (현재 방식)
- ✅ 사용자가 직접 입력
- ❌ 코드에 직접 작성 금지

### 비공개 배포 필요 시:
- GitHub Pro 계정 필요 (유료)
- 또는 다른 호스팅 서비스 사용 (Netlify, Vercel 등)

---

## 📈 고급 기능

### 1. 커스텀 도메인 연결
```
Settings → Pages → Custom domain
예: counseling.yourdomain.com
```

### 2. HTTPS 강제
```
Settings → Pages → Enforce HTTPS 체크
```

### 3. 배포 알림 받기
- GitHub 알림 설정에서 Actions 알림 활성화

---

## 🆘 지원

### 문제 발생 시:
1. GitHub Actions 로그 확인
2. 이 저장소의 Issues 탭에서 질문
3. Git/GitHub 공식 문서 참고

---

## ✅ 체크리스트

배포 전 확인사항:
- [ ] GitHub 계정 생성
- [ ] Git 설치 확인
- [ ] 저장소 생성
- [ ] 로컬 프로젝트와 연결
- [ ] GitHub Pages 활성화
- [ ] 배포 성공 확인
- [ ] 사이트 접속 확인

---

## 🎊 완료!

이제 코드를 수정하고 `git push`만 하면 자동으로 배포됩니다!

**배포 URL을 즐겨찾기에 추가하세요:**
`https://[사용자명].github.io/[저장소명]/`
