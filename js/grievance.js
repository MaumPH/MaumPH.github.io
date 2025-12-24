/**
 * grievance.js
 * 고충처리 대장 관련 함수
 * - generateGrievanceReport: 고충처리 기록서 생성
 * - buildGrievancePrompt: 프롬프트 생성
 * - displayGrievanceResult: 결과 표시
 * - copyGrievanceResult: 클립보드 복사
 */

// 고충처리 기록서 생성
async function generateGrievanceReport() {
    // Validate API key
    if (!apiKey) {
        alert('API 키를 먼저 설정해주세요.');
        showPage('settings');
        return;
    }

    // Get form values
    const employee = document.getElementById('gr-employee').value.trim();
    const position = document.getElementById('gr-position').value.trim();
    const background = document.getElementById('gr-background').value.trim();
    const situation = document.getElementById('gr-situation').value.trim();
    const content = document.getElementById('gr-content').value.trim();
    const relatedParty = document.getElementById('gr-related-party').value.trim();
    const confirmedFacts = document.getElementById('gr-confirmed-facts').value.trim();
    const actionHistory = document.getElementById('gr-action-history').value.trim();
    const actionScope = document.getElementById('gr-action-scope').value.trim();
    const notificationMethod = document.getElementById('gr-notification-method').value;

    // Validate required fields
    if (!employee) {
        alert('고충 제기 직원을 입력해주세요.');
        return;
    }
    if (!content) {
        alert('제기된 고충 내용을 입력해주세요.');
        return;
    }
    if (!confirmedFacts) {
        alert('기관에서 확인한 사실을 입력해주세요.');
        return;
    }
    if (!actionScope) {
        alert('기관의 조치 가능 범위를 입력해주세요.');
        return;
    }

    // Build prompt
    const prompt = buildGrievancePrompt({
        employee,
        position,
        background,
        situation,
        content,
        relatedParty,
        confirmedFacts,
        actionHistory,
        actionScope,
        notificationMethod
    });

    // Show loading
    showLoadingOverlay('AI가 고충처리 기록서를 생성하고 있습니다...');

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API 호출 실패: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const result = data.candidates[0].content.parts[0].text.trim();

        // Display result
        displayGrievanceResult(result);

        // Increment usage count
        usageCount++;
        localStorage.setItem('usage_count', usageCount.toString());
        document.getElementById('usage-count').textContent = usageCount;

        hideLoadingOverlay();
        alert('✓ 고충처리 기록서가 생성되었습니다!');

    } catch (error) {
        hideLoadingOverlay();
        alert('고충처리 기록서 생성 중 오류가 발생했습니다:\n\n' + error.message);
    }
}

// 고충처리 프롬프트 생성
function buildGrievancePrompt(data) {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '.');

    return `# 직원 고충처리 지침 ver.3
(강한 자동화 · 직원 고충 전 범주 대응 · 공식 출력양식 통합)

---

# 1. 역할(Role)
너는 기관의 **직원 고충처리 기록 담당자**로서,
직원의 업무·관계·근무환경·제도·조직문화 등 모든 범주의 고충을
공정하고 중립적으로 기록하고, 사실 기반으로 분석하며,
조치와 사후관리까지 정확하게 문서화해야 한다.

---

# 2. 준수해야 할 규범

- 의료적 판단·법률 자문 금지
- 입력값 외 임의 사실·추측 생성 금지
- 개인정보·민감정보 저장·보관·재사용 금지
- 직원 개인/성향/능력 평가 금지
- 갈등 조장·비난·단정 표현 금지
- 기관은 **중립적 조정자**로 표현
- 당사자 감정은 "직원이 진술한 범위 안에서만" 기록
- 전문성과 배려가 모두 느껴지는 안정된 톤 유지

---

# 3. 목표

- 접수→분석→조치→통보→사후관리의 5단계 문서를
  **정해진 글자수**와 **정해진 문체·톤**으로 생성
- 직원 고충의 모든 범주(업무, 관계, 배치, 환경, 운영 방식 등)를 처리 가능
- 책임 소재를 비난하는 방식이 아니라 **개선 중심 접근**으로 작성
- 직원이 안전하게 의견을 낼 수 있었던 감정적 맥락을 존중하며 서술

---

# 4. 입력값

- 고충 제기 직원: ${data.employee}
- 직무: ${data.position || '미입력'}
- 고충 제기 배경: ${data.background || '미입력'}
- 고충 발생 상황: ${data.situation || '미입력'}
- 제기된 고충 내용: ${data.content}
- 관련 직원 또는 관련 부서: ${data.relatedParty || '미입력'}
- 기관에서 확인한 사실: ${data.confirmedFacts}
- 기존 조치 이력: ${data.actionHistory || '없음'}
- 기관의 조치 가능 범위: ${data.actionScope}
- 통보 방식: ${data.notificationMethod}

---

# 5. 자동화 규칙

### 5-1. 글자수 자동 충족
각 항목은 아래 분량(공백 포함)을 반드시 충족해야 한다:

- 접수: **200자**
- 분석: **300자**
- 조치: **150자**
- 통보: **150자**
- 사후관리: **200자**

부족할 경우 억지 없이 **자연스럽게 확장**한다.

### 5-2. 날짜 자동 적용
- 모든 날짜는 **${today}**로 자동 적용

### 5-3. 톤 자동 고정
- 중립적·따뜻한 전문 톤
- 감정은 직원 진술 기반만
- 문제를 확대하거나 상대 직원 평가 금지
- 해결방향 제시와 실무적 흐름 유지

---

# 6. 문체 및 톤 프로필

### 6-1. 문체
- 실무형 행정기록체
- 10~20어절 단문·복문 혼합
- 추상명사·전문용어 최소화
- '사실→근거→결론' 흐름 유지
- **종결어: ~임 / ~음 / ~됨 / ~함 / ~하였음 으로 통일**

### 6-2. 톤
- 직원 감정을 존중하는 배려형 문장
- 기관은 조정자·지원자 역할
- 단정·과장 금지
- 감정적 언어 금지
- 문제 해결 중심 접근

---

# 7. 출력 구조(필수)

위의 입력값을 바탕으로 아래 형식으로 정확히 작성하시오:

# 직원 고충처리 기록서

## ① 고충내용

### ▷ 접수 (${today})

(여기에 200자 내용 생성)

### ▷ 분석 (${today})

(여기에 300자 내용 생성)

---

## ② 처리결과

### ▷ 조치 (${today})

(여기에 150자 내용 생성)

### ▷ 통보 (${today})

(여기에 150자 내용 생성)

### ▷ 사후관리 (${today})

(여기에 200자 내용 생성)

---

## 비고

* 모든 내용은 직원 고충처리 지침 ver.3 준수
* 사실 기반 중립적 기록 원칙

---

# 8. 항목별 작성 지침(분량 포함)

### ① 고충내용

#### ▷ 접수(200자)
- 고충 제기자·상황·발생 맥락
- 사실 기반 묘사
- 감정은 "직원이 표현한 범위"만 서술

#### ▷ 분석(300자)
- 관련 직원 면담 내용(사실 기반)
- 기관 관찰 및 문서 확인
- 원인 분석: 추측 금지, 진술과 사실 중심
- 기관 내 조정 필요 요소 정리

---

### ② 처리결과

#### ▷ 조치(150자)
- 기관이 즉시 수행한 구체적 조치
- 조치 이유 및 범위
- 해결을 위한 실질적 행동 명시

#### ▷ 통보(150자)
- 통보 방식: ${data.notificationMethod}
- 전달 내용
- 직원 반응(진술 기반)
- 추후 안내

#### ▷ 사후관리(200자)
- 후속 점검 계획
- 재발 방지 및 근무환경 개선안
- 직원 심리·업무 부담 모니터링 계획
- 일정 및 방식

---

# 9. 예시 (톤·구조·분량 참고용) - 행정기록체 종결어 적용

### [접수 예시 – 약 200자]
A직원은 최근 특정 시간대 업무량이 지속적으로 집중되면서 과도한 부담을 느끼고 있다고 고충을 제기하였음. 특히 점심 이후 위생·정리 업무가 반복적으로 단독 배정되어 업무 균형이 무너진 상황이라고 진술하였음. 또한 동료 직원과의 역할 조정이 충분히 이루어지지 않아 협업이 원활하지 않은 점도 어려움으로 표현하였음.

### [분석 예시 – 약 300자]
근무표와 해당조 직원 면담을 통해 확인한 결과, 최근 신입 직원의 적응 기간으로 인해 특정 업무가 A직원에게 과도하게 배정되는 날이 있었음. 동료 직원 또한 이러한 업무 불균형을 인지하고 있었으나, 바쁜 시간대에는 역할 조율이 충분히 이루어지지 못한 상황이었다고 설명하였음. 기관은 접수된 고충과 사실 확인을 바탕으로 배치 조정과 역할 명확화가 필요하다고 판단하였음. 특히 위생·정리 업무가 특정 직원에게 집중되는 패턴이 반복되는지 추가 확인이 필요함을 파악하였음.

### [조치 예시 – 약 150자]
기관은 동일 시간대 역할 분담을 명확히 조정하였으며 위생·정리 업무가 단일 직원에게 집중되지 않도록 근무표를 재배치하였음. 또한 신입 직원에게 관련 업무 절차를 추가 교육하여 전체 부담이 고르게 분배되도록 조치하였음.

### [통보 예시 – 약 150자]
A직원에게 근무표 조정 내용과 역할 분담 개선사항을 대면으로 자세히 안내하였음. 직원은 변경된 근무 흐름이 도움이 될 것 같다고 답하였으며, 향후 상황을 함께 점검하자는 기관의 제안에도 동의하였음.

### [사후관리 예시 – 약 200자]
기관은 향후 2주간 해당 시간대의 업무 배분과 직원 간 협력 흐름을 집중적으로 확인하기로 함. A직원과는 주 1회 간단한 체크인을 진행해 업무 피로도와 부담감을 점검하며, 문제 발생 시 즉시 조정할 예정임. 또한 조정된 근무표가 전체 직원에게 균형 있게 적용되는지 모니터링해 추가 개선 필요 여부를 검토하기로 함.

---

이제 위의 지침에 따라 직원 고충처리 기록서를 작성하시오.
**마크다운 형식을 정확히 사용하고, 각 항목의 글자수를 준수하며, 중립적이고 전문적인 톤을 유지하시오.**
**반드시 행정기록체 종결어(~임 / ~음 / ~됨 / ~함 / ~하였음)로 작성하시오.**`;
}

// 고충처리 결과 표시
function displayGrievanceResult(result) {
    const resultDiv = document.getElementById('gr-result-content');

    // Convert markdown to HTML
    const convertMarkdown = (text) => {
        return text
            // Headers
            .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-gray-900 dark:text-white mb-3">$1</h1>')
            .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-gray-900 dark:text-white mb-2 mt-4">$1</h2>')
            .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-primary mb-2 mt-3">$1</h3>')
            // Horizontal rules
            .replace(/^---$/gm, '<hr class="my-4 border-gray-300 dark:border-gray-600">')
            // Bold
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            // Lists
            .replace(/^\* (.+)$/gm, '<li class="ml-4">$1</li>')
            // Paragraphs
            .replace(/\n\n/g, '</p><p class="mb-2">')
            .trim();
    };

    let html = '<div class="space-y-2">';
    html += '<p class="mb-2">' + convertMarkdown(result) + '</p>';
    html += '</div>';

    resultDiv.innerHTML = html;

    // Show result section
    document.getElementById('gr-result-section').classList.remove('hidden');

    // Scroll to result
    document.getElementById('gr-result-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 고충처리 결과 복사
function copyGrievanceResult() {
    const resultDiv = document.getElementById('gr-result-content');
    const text = resultDiv.innerText;

    if (!text || text.trim() === '') {
        alert('먼저 고충처리 기록서를 생성해주세요.');
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        alert('✓ 고충처리 기록서가 클립보드에 복사되었습니다.');
    }).catch(err => {
        alert('복사 중 오류가 발생했습니다: ' + err);
    });
}
