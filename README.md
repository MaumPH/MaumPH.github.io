# 주간보호센터 업무수행도우미

주간보호센터의 프로그램 관리자를 위한 AI 기반 업무 문서 작성 시스템입니다.

## 프로젝트 구조 (모듈화 완료)

```
프로그램관리자 업무수행일지/
├── index.html                          # 메인 HTML (모듈화됨, 93KB)
├── index.backup.html                   # 원본 백업 (19MB)
├── index_with_inline_script.html       # 인라인 스크립트 버전 백업
│
├── css/
│   └── styles.css                      # 스타일시트
│
└── js/                                 # JavaScript 모듈 (기능별 분리)
    ├── config.js                       # 전역 설정 및 상태 관리 (3.8KB)
    ├── api.js                          # Gemini API 호출 로직 (2.8KB)
    ├── ui.js                           # UI 공통 함수 및 네비게이션 (11KB)
    ├── counseling.js                   # 상담일지 생성 (7.6KB)
    ├── case-management.js              # 사례관리 회의록 생성 (9.2KB)
    ├── monitoring.js                   # 프로그램 일지 및 모니터링 (11KB)
    └── main.js                         # 앱 초기화 및 이벤트 (5.2KB)
```

## 모듈 설명

### 1. config.js
- 전역 상태 변수 관리
- API 키 및 localStorage 설정
- SYSTEM_PROMPT 템플릿
- API 키 저장/표시 함수

### 2. api.js
- callGeminiAPI(): 텍스트 기반 API 호출
- callGeminiAPIWithImage(): 이미지 포함 API 호출
- 사용 횟수 추적

### 3. ui.js
- showPage(): 페이지 전환 및 네비게이션
- updateProgress(): 프로그레스 바 관리
- showLoadingOverlay() / hideLoadingOverlay(): 로딩 표시
- handlePDFUpload(): PDF 파일 업로드 처리
- setupDragAndDrop(): 드래그 앤 드롭 기능

### 4. counseling.js
- generateCounselingLog(): 상담일지 생성
- buildCounselingLogPrompt(): 프롬프트 생성
- displayCounselingLogResult(): 결과 표시
- copyCounselingLogResult(): 클립보드 복사

### 5. case-management.js
- setupServiceCheckboxes(): 서비스 유형 체크박스 설정
- generateCaseManagement(): 사례관리 회의록 생성
- buildCaseManagementPrompt(): 프롬프트 생성
- displayCaseManagementResult(): 결과 표시
- copyCaseManagementResult(): 클립보드 복사

### 6. monitoring.js
- analyzePDF(): PDF 분석 및 필드 자동 작성
- generateProgramContent(): 프로그램 내용 생성
- generateFuturePlan(): 향후 계획 생성
- generateProgramReactions(): 프로그램 반응 생성
- toggleProgramMode(): 프로그램 모드 전환

### 7. main.js
- 앱 초기화 (window.onload)
- Newsletter 이미지 처리
- generateNewsletter(): 소식지 생성
- copyNewsletterResult(): 결과 복사

## 주요 기능

1. **업무수행일지 작성** (3단계)
   - STEP 1: PDF 업로드 및 10개 항목 자동 분석
   - STEP 2: 프로그램 제공계획 및 내용 생성
   - STEP 3: 향후 계획 작성 및 완료

2. **프로그램 일지**
   - 기존/신규 프로그램 선택
   - 어르신 반응 자동 생성 (최대 30개)

3. **사례관리 회의록**
   - 평가 기준(지표 28) 완전 준수
   - 대화체 회의 내용 생성
   - 급여 반영 내용 포함

4. **상담일지**
   - 대화체/보고체/혼합 스타일 선택
   - 보호자 상담 내용 자동 작성

5. **소식지 생성**
   - 3개 이미지 업로드 및 분석
   - AI 기반 소식지 내용 자동 생성

## 기술 스택

- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript (모듈화)
- **AI**: Google Gemini API (gemini-3-flash-preview)
- **PDF 처리**: PDF.js
- **스토리지**: LocalStorage (API 키, 사용 횟수)

## 개선 사항

### 모듈화 전 (index.backup.html)
- 파일 크기: 19MB
- 모든 JavaScript 코드가 하나의 script 태그에 포함
- 유지보수 어려움
- 코드 재사용 불가

### 모듈화 후 (현재)
- HTML 파일: 93KB (99.5% 감소)
- JavaScript 7개 모듈로 분리
- 기능별 명확한 역할 분리
- 코드 가독성 및 유지보수성 향상
- 필요한 모듈만 수정 가능

## 사용 방법

1. **API 키 설정**
   - 설정 페이지에서 Gemini API 키 입력 및 저장

2. **업무수행일지 작성**
   - PDF 업로드 → 자동 분석 → 내용 수정 → 프로그램 내용 생성

3. **기타 문서 작성**
   - 각 메뉴에서 필요한 정보 입력
   - AI 생성 버튼 클릭
   - 결과 확인 및 복사

## 백업 파일

- index.backup.html: 최초 원본 백업
- index_with_inline_script.html: 모듈화 직전 버전

## 라이선스

주간보호센터 내부 사용 목적
