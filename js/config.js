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
let apiKeys = JSON.parse(localStorage.getItem('gemini_api_keys') || '[]');
let activeApiKeyIndex = parseInt(localStorage.getItem('active_api_key_index') || '0');
let apiKey = apiKeys[activeApiKeyIndex] || '';
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
* 자연스러운 일상어 사용 필수:
  - ❌ "과업", "과제", "수행", "지속", "완수", "보조", "지원", "제공", "언어적 안내"
  - ✅ "프로그램", "활동", "진행", "계속", "마무리", "도움드림", "도와드림", "드림", "설명함", "알려드림"
* 딱딱한 공문서 표현 절대 금지:
  - ❌ "언어적 안내를 제공하며" → ✅ "말로 설명해드리며", "알려드리며"
  - ❌ "활동을 지원함" → ✅ "활동을 도와드림", "도움드림"
  - ❌ "안내를 제공" → ✅ "안내함", "설명함", "알려드림"
* "수급자" 대신 "어르신" 사용 필수
* 공문서 어투 지양 - 자연스럽고 부드러운 표현 사용

## 3. 📄 작성 방식 및 예시

### ▶ 어르신 반응 및 특이사항 예시:
외부강사프로그램 참여 시 여러 가지 대칭 막대기를 활용하여 그림과 숫자를 만들며 활동에 참여함. 제시된 도구를 이용해 모양을 만들고 배열을 조정하는 모습이 관찰되었으며, 활동 중 자리에 앉아 계속해서 작업을 이어감.

### ▶ 요양보호사 모니터링 예시:
(사회복지사/프로그램관리자 관점에서 요양보호사의 업무 수행 방식, 대상자 대응, 제공 과정의 적절성 등을 평가)
- 요양보호사는 어르신의 건강상태와 인지 수준을 고려하여 프로그램을 적절히 조정하여 제공하였으며, 어르신의 참여도가 높아 우수 사례로 판단됨. 별도의 개선사항은 없으며 지속적인 유지 관리 요청함
- 프로그램 목적을 정확히 이해하고 어르신에게 단계별로 친절하게 설명하며 안정적으로 진행함
- 어르신의 반응을 수시로 확인하며 속도를 조절하는 등 맞춤형으로 프로그램을 제공함
- 어르신의 참여를 유도하기 위해 긍정적 언어와 격려를 지속적으로 제공함
- 일부 활동 단계에서 어르신의 반응 확인 없이 다음 단계로 진행하여 중간 점검이 요구됨

### ▶ 필요내용 예시:
감각기능 자극, 소근육 발달, 집중력 향상 등
또는
지남력, 기억력, 주의집중력 향상 등 인지기능 유지와 향상을 위한 현실인식 훈련을 반복함

### ▶ 제공방법 예시:
색칠 도안과 크레용을 드리고, 직원이 개별로 도와드리며 단계별로 진행함

## 4. 핵심 작성 원칙
* 관찰된 행동과 사실만 기록
* "~하는 모습이 관찰됨", "~하는 과정이 확인됨" 등 객관적 표현 사용
* 시간 순서대로 기록 (활동 시작 → 진행 → 종료)
* 구체적 행동 묘사 (추상적 표현 지양)
* 중립적 어조 유지`;

// API 키 리스트 렌더링
function renderAPIKeysList() {
    const container = document.getElementById('api-keys-list');
    if (!container) return;

    if (apiKeys.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                저장된 API 키가 없습니다.<br>새 API 키를 추가해주세요.
            </div>
        `;
        return;
    }

    container.innerHTML = apiKeys.map((key, index) => {
        const maskedKey = key.substring(0, 8) + '...' + key.substring(key.length - 4);
        const isActive = index === activeApiKeyIndex;

        return `
            <div class="flex items-center gap-3 p-3 bg-white dark:bg-surface-dark border ${isActive ? 'border-primary' : 'border-gray-300 dark:border-gray-600'} rounded-lg">
                <input type="radio" name="active-api-key" ${isActive ? 'checked' : ''}
                    onchange="selectAPIKey(${index})"
                    class="w-4 h-4 text-primary focus:ring-primary cursor-pointer"/>
                <div class="flex-1 flex items-center gap-2">
                    <span class="material-symbols-outlined text-gray-500 text-lg">key</span>
                    <span class="font-mono text-sm text-gray-900 dark:text-white">${maskedKey}</span>
                    ${isActive ? '<span class="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">사용 중</span>' : ''}
                </div>
                <button onclick="deleteAPIKey(${index})"
                    class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="삭제">
                    <span class="material-symbols-outlined text-lg">delete</span>
                </button>
            </div>
        `;
    }).join('');
}

// API 키 추가
function addAPIKey() {
    const input = document.getElementById('new-api-key-input');
    const newKey = input.value.trim();

    if (!newKey) {
        alert('API 키를 입력해주세요.');
        return;
    }

    if (apiKeys.length >= 5) {
        alert('최대 5개까지만 저장할 수 있습니다.');
        return;
    }

    if (apiKeys.includes(newKey)) {
        alert('이미 저장된 API 키입니다.');
        return;
    }

    apiKeys.push(newKey);
    localStorage.setItem('gemini_api_keys', JSON.stringify(apiKeys));

    // 첫 번째 키인 경우 자동으로 활성화
    if (apiKeys.length === 1) {
        activeApiKeyIndex = 0;
        apiKey = apiKeys[0];
        localStorage.setItem('active_api_key_index', '0');
    }

    input.value = '';
    renderAPIKeysList();
    alert('API 키가 추가되었습니다.');
}

// API 키 선택
function selectAPIKey(index) {
    activeApiKeyIndex = index;
    apiKey = apiKeys[index];
    localStorage.setItem('active_api_key_index', index.toString());
    renderAPIKeysList();
}

// API 키 삭제
function deleteAPIKey(index) {
    if (!confirm('이 API 키를 삭제하시겠습니까?')) {
        return;
    }

    apiKeys.splice(index, 1);
    localStorage.setItem('gemini_api_keys', JSON.stringify(apiKeys));

    // 활성화된 키가 삭제된 경우
    if (index === activeApiKeyIndex) {
        activeApiKeyIndex = 0;
        apiKey = apiKeys[0] || '';
        localStorage.setItem('active_api_key_index', '0');
    } else if (index < activeApiKeyIndex) {
        // 활성화된 키보다 앞의 키가 삭제된 경우 인덱스 조정
        activeApiKeyIndex--;
        localStorage.setItem('active_api_key_index', activeApiKeyIndex.toString());
    }

    renderAPIKeysList();
    alert('API 키가 삭제되었습니다.');
}

// 새 API 키 입력창 표시/숨김 토글
function toggleNewAPIKeyVisibility() {
    const input = document.getElementById('new-api-key-input');
    const icon = document.getElementById('new-visibility-icon');

    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = 'visibility';
    } else {
        input.type = 'password';
        icon.textContent = 'visibility_off';
    }
}
