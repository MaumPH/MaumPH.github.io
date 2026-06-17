/**
 * counseling.js
 * 상담일지 작성 관련 함수
 * - generateCounselingLog: 상담일지 생성
 * - buildCounselingLogPrompt: 프롬프트 생성
 * - displayCounselingLogResult: 결과 표시
 * - copyCounselingLogResult: 클립보드 복사
 */

// 상담일지 생성
async function generateCounselingLog() {
    // Validate API key
    if (!apiKey) {
        alert('API 키를 먼저 설정해주세요.');
        showPage('settings');
        return;
    }

    // Get form values
    const date = document.getElementById('cl-date').value;
    const method = document.getElementById('cl-method').value;
    const elderName = document.getElementById('cl-elder-name').value.trim();
    const guardianRelation = document.getElementById('cl-guardian-relation').value.trim();
    const guardianRequest = document.getElementById('cl-guardian-request').value.trim();
    const centerRequest = document.getElementById('cl-center-request').value.trim();
    const writingStyle = document.getElementById('cl-writing-style').value;

    // Validate required fields
    if (!date) {
        alert('상담 날짜를 입력해주세요.');
        return;
    }
    if (!elderName) {
        alert('어르신 성함을 입력해주세요.');
        return;
    }
    if (!guardianRelation) {
        alert('보호자 관계를 입력해주세요.');
        return;
    }
    if (!guardianRequest && !centerRequest) {
        alert('보호자 요청 또는 센터 요청 중 최소 하나를 입력해주세요.');
        return;
    }

    // Build prompt
    const prompt = buildCounselingLogPrompt(date, method, elderName, guardianRelation, guardianRequest, centerRequest, writingStyle);

    // Show loading
    showLoadingOverlay('AI가 상담일지를 생성하고 있습니다...');

    try {
        const result = (await callGeminiAPI(prompt)).trim();

        // Display result
        displayCounselingLogResult(result);

        hideLoadingOverlay();
        alert('✓ 상담일지가 생성되었습니다!');

    } catch (error) {
        hideLoadingOverlay();
        alert('상담일지 생성 중 오류가 발생했습니다:\n\n' + error.message);
    }
}

// 상담일지 프롬프트 생성
function buildCounselingLogPrompt(date, method, elderName, guardianRelation, guardianRequest, centerRequest, writingStyle) {
    return PromptKit.builders.counselingLog({
        date,
        method,
        elderName,
        guardianRelation,
        guardianRequest,
        centerRequest,
        writingStyle
    });

    let styleInstruction = '';
    let outputFormat = '';

    if (writingStyle === 'mixed') {
        styleInstruction = '상담내용은 대화체로, 조치내용은 보고체로 작성';
        outputFormat = `[상담일자]
${date}

[상담방식]
${method}

[상담내용]
(대화체로 자연스럽게 작성)

[조치내용]
(보고체로 간결하게 작성)`;
    } else if (writingStyle === 'conversational') {
        styleInstruction = '전체를 대화체로 작성';
        outputFormat = `[상담일자]
${date}

[상담방식]
${method}

[상담내용]
(대화체로 자연스럽게 작성)

[조치내용]
(대화체로 자연스럽게 작성)`;
    } else {
        styleInstruction = '전체를 보고체로 작성';
        outputFormat = `[상담일자]
${date}

[상담방식]
${method}

[상담내용]
(보고체로 간결하게 작성)

[조치내용]
(보고체로 간결하게 작성)`;
    }

    let conversationPattern = '';
    if (guardianRequest && centerRequest) {
        conversationPattern = 'C (양방향 대화)';
    } else if (guardianRequest) {
        conversationPattern = 'A (보호자 → 센터)';
    } else {
        conversationPattern = 'B (센터 → 보호자)';
    }

    return `# 상담일지 작성

## 기본 정보
- 어르신: ${elderName}
- 보호자: ${guardianRelation}
- 상담 방식: ${method}
- 날짜: ${date}
- 작성 스타일: ${styleInstruction}
- 대화 패턴: ${conversationPattern}

## 상담 내용
${guardianRequest ? `### 보호자 요청/문의
${guardianRequest}` : ''}

${centerRequest ? `### 센터 요청/문의
${centerRequest}` : ''}

## 작성 지침

1. **상담내용 작성 ${writingStyle === 'conversational' || writingStyle === 'mixed' ? '(대화체)' : '(보고체)'}:**
   - 최소 4회 이상의 대화 포함
   - 구체적인 상황과 맥락 제시
   - 사회복지사의 관찰 내용 포함
   - 자연스러운 대화 흐름

2. **조치내용 작성 ${writingStyle === 'report' || writingStyle === 'mixed' ? '(보고체)' : '(대화체)'}:**
   - 구체적인 조치사항
   - 향후 계획
   - 필요시 추가 모니터링 계획

3. **금지사항:**
   - 마크다운 형식 사용 금지
   - "직원" 대신 "사회복지사" 사용
   - 불필요한 장식 문자 금지

## 출력 형식

${outputFormat}

위 형식으로 상담일지를 작성해주세요.`;
}

// 상담일지 결과 표시
function displayCounselingLogResult(result) {
    const resultDiv = document.getElementById('cl-result-content');
    const parsed = PromptKit.parsers.counselingLog(result);

    if (!parsed.ok) {
        resultDiv.textContent = PromptKit.formatParseError(parsed, result);
        document.getElementById('cl-result-section').classList.remove('hidden');
        document.getElementById('cl-result-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }

    // Clean markdown if present
    const cleanText = (text) => {
        return text
            .replace(/^#+\s+/gm, '')
            .replace(/\*\*(.+?)\*\*/g, '$1')
            .replace(/\*(.+?)\*/g, '$1')
            .replace(/\[(.+?)\]\((.+?)\)/g, '$1')
            .replace(/`(.+?)`/g, '$1')
            .trim();
    };

    resultDiv.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'space-y-4';
    [
        ['상담일자', parsed.data.date],
        ['상담방식', parsed.data.method],
        ['상담내용', parsed.data.content],
        ['조치내용', parsed.data.action]
    ].forEach(([title, content]) => {
        const section = document.createElement('div');
        const heading = document.createElement('h4');
        const body = document.createElement('div');

        heading.className = 'font-bold text-primary mb-2';
        heading.textContent = `[${title}]`;
        body.className = 'whitespace-pre-wrap pl-4';
        body.textContent = cleanText(content);
        section.appendChild(heading);
        section.appendChild(body);
        wrapper.appendChild(section);
    });
    resultDiv.appendChild(wrapper);

    // Show result section
    document.getElementById('cl-result-section').classList.remove('hidden');

    // Scroll to result
    document.getElementById('cl-result-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 상담일지 결과 복사
function copyCounselingLogResult() {
    const resultDiv = document.getElementById('cl-result-content');
    const text = resultDiv.innerText;

    if (!text || text.trim() === '') {
        alert('먼저 상담일지를 생성해주세요.');
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        alert('✓ 상담일지가 클립보드에 복사되었습니다.');
    }).catch(err => {
        alert('복사 중 오류가 발생했습니다: ' + err);
    });
}
