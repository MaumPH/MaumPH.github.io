# 프로그램관리자 업무수행일지 자동화 시스템

AI 기반 상담일지, 사례관리, 모니터링 자동 생성 시스템입니다.

## 🚀 주요 기능

- **상담일지 생성**: 보호자 상담 내용을 자동으로 정리
- **사례관리 회의록**: AI 기반 회의록 자동 생성
- **모니터링 일지**: 프로그램 모니터링 보고서 작성

## 📝 작성 방식

- **대화체**: 상담내용(대화체) + 조치내용(보고체)
- **보고체**: 전체 보고체로 간결하게 작성

## 🛠️ 기술 스택

- HTML/CSS/JavaScript
- Google Gemini API (gemini-3-flash-preview)
- GitHub Pages
- GitHub Actions (자동 배포)

## 🌐 배포

이 프로젝트는 GitHub Pages를 통해 자동으로 배포됩니다.

### 배포 URL
`https://[username].github.io/[repository-name]/`

### 자동 배포 프로세스
1. `main` 브랜치에 코드 푸시
2. GitHub Actions가 자동으로 실행
3. GitHub Pages에 배포 완료

## 📦 설치 및 실행

### 로컬 실행
1. 저장소 클론
```bash
git clone [repository-url]
```

2. index.html 파일을 브라우저에서 열기

### API 키 설정
1. Google AI Studio에서 API 키 발급
2. 앱 실행 후 설정에서 API 키 입력

## 🔄 업데이트 방법

### 코드 수정 후 배포
```bash
git add .
git commit -m "업데이트 내용"
git push origin main
```

자동으로 GitHub Actions가 실행되어 배포됩니다.

## 📋 버전 이력

- **v1.0.0** (2025-12-22)
  - gemini-3-flash-preview 모델 적용
  - 작성방식 2가지로 변경 (대화체/보고체)
  - GitHub Pages 배포 설정

## 📄 라이선스

MIT License

## 👥 기여

이슈 및 풀 리퀘스트를 환영합니다.
