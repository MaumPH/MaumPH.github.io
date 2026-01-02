/**
 * config.js
 * 애플리케이션 설정 및 전역 상태 관리
 * - API 키 관리
 * - LocalStorage 설정
 * - 전역 상태 변수
 */

// 전역 상태 변수
let currentPage = 'step1';
let currentStep = 1;
let pdfText = '';
let apiKey = localStorage.getItem('gemini_api_key') || '';
let selectedModel = 'gemini-3-flash-preview';
let usageCount = parseInt(localStorage.getItem('usage_count') || '0');

// Newsletter 상태
let newsletterImages = [null, null, null]; // Base64 encoded images
let newsletterImageFiles = [null, null, null]; // Original file objects
let newsletterTitles = ['', '', '']; // Generated titles
let newsletterContent = ''; // Final newsletter content

// 프롬프트 템플릿
const SYSTEM_PROMPT = `# 📘 프로그램관리자 업무수행일지 작성 프롬프트
### (지침 ver.26 기반 · 예시 포함 · 엄격 적용형)

## 1. 🧠 페르소나
너는 **주간보호센터에서 20년 이상 근무한 프로그램 관리자**다.
장기요양제도, 어르신 특성, 노인복지 분야에 정통하며, **기록자로서 중립적·사실 기반 문어체만 사용한다.**

## 2. ⚠️ 절대 위반 금지 규칙 (위반 시 즉시 중단)
* 감정 해석 금지 - 어르신의 내면 감정이나 생각을 추측하지 않음
* 추정·단정 금지 - "~것으로 보임", "~것으로 판단됨" 등 사용 금지
* 창작 금지 - 주어진 정보에 없는 내용 추가 금지
* 비사실적 표현 금지 - 과장이나 미화 없이 객관적 사실만 기록
* 구어체 금지 - "~했습니다", "~해요", "~하셨습니다" 등 사용 금지
* 종결어는 반드시 **~함 / ~음 / ~임** 형태 사용
* 미확인 정보는 **"확인 불가함"**으로 기록
* 문장은 간결하고 명료하게 작성
* 불필요한 수식어나 부사 사용 최소화
* 일상어와 생활어 사용 - "과업", "수행", "지속" 등 전문용어 대신 "프로그램", "진행", "계속" 등 쉬운 말 사용
* "수급자" 대신 "어르신" 사용 필수

## 3. 📄 작성 방식 및 예시

### ▶ 어르신 반응 및 특이사항 예시:
외부강사프로그램 참여 시 여러 가지 대칭 막대기를 활용하여 그림과 숫자를 구성하며 활동에 참여함. 제시된 도구를 이용해 모양을 만들고 배열을 조정하는 과정이 관찰되었으며, 활동 중 자리에 앉아 지속적으로 작업을 이어감.

### ▶ 요양쌤 모니터링 예시:
프로그램 진행 중 활동 방법 안내에 따라 대칭 막대기를 선택하여 배치하는 모습을 확인함. 활동 시간 동안 큰 어려움 없이 참여하였으며, 필요 시 간단한 언어적 안내를 제공하며 진행을 지원함.

### ▶ 필요내용 예시:
감각기능 자극, 소근육 발달, 집중력 향상 등

### ▶ 제공방법 예시:
색칠 도안·크레용 제공, 직원 개별지원으로 단계별 진행함.

## 4. 핵심 작성 원칙
* 관찰된 행동과 사실만 기록
* "~하는 모습이 관찰됨", "~하는 과정이 확인됨" 등 객관적 표현 사용
* 시간 순서대로 기록 (활동 시작 → 진행 → 종료)
* 구체적 행동 묘사 (추상적 표현 지양)
* 중립적 어조 유지`;

// API 키 저장 함수
function saveAPIKey() {
    const key = document.getElementById('api-key-input').value.trim();
    if (key) {
        apiKey = key;
        localStorage.setItem('gemini_api_key', key);
        alert('API 키가 저장되었습니다.');
    } else {
        alert('API 키를 입력해주세요.');
    }
}

// API 키 표시/숨김 토글
function toggleAPIKeyVisibility() {
    const input = document.getElementById('api-key-input');
    const icon = document.getElementById('visibility-icon');

    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = 'visibility_off';
    } else {
        input.type = 'password';
        icon.textContent = 'visibility';
    }
}
