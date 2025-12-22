/**
 * case-management.js
 * 사례관리 회의록 생성 관련 함수
 * - setupServiceCheckboxes: 서비스 체크박스 설정
 * - updateSelectedServices: 선택된 서비스 업데이트
 * - generateCaseManagement: 사례관리 회의록 생성
 * - buildCaseManagementPrompt: 프롬프트 생성
 * - displayCaseManagementResult: 결과 표시
 * - copyCaseManagementResult: 클립보드 복사
 */

// 서비스 유형 체크박스 설정
function setupServiceCheckboxes() {
    const checkboxes = document.querySelectorAll('.cm-service-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedServices);
    });
}

// 선택된 서비스 업데이트
function updateSelectedServices() {
    const checkboxes = document.querySelectorAll('.cm-service-checkbox:checked');
    const selectedValues = Array.from(checkboxes).map(cb => cb.value);

    const displayBox = document.getElementById('cm-selected-services');
    const displayText = document.getElementById('cm-selected-services-text');

    if (selectedValues.length > 0) {
        displayText.textContent = selectedValues.join(', ');
        displayBox.classList.remove('hidden');
    } else {
        displayBox.classList.add('hidden');
    }
}

// 사례관리 회의록 생성
async function generateCaseManagement() {
    // Validate API key
    if (!apiKey) {
        alert('API 키를 먼저 설정해주세요.');
        showPage('settings');
        return;
    }

    // Get input values
    const recipientName = document.getElementById('cm-recipient-name').value.trim();
    const age = document.getElementById('cm-age').value.trim();
    const diagnosis = document.getElementById('cm-diagnosis').value.trim();
    const recentChanges = document.getElementById('cm-recent-changes').value.trim();
    const year = document.getElementById('cm-year').value.trim() || new Date().getFullYear();
    const quarter = document.getElementById('cm-quarter').value;
    const attendees = document.getElementById('cm-attendees').value.trim();
    const guardianInfo = document.getElementById('cm-guardian-info').value.trim();
    const programParticipation = document.getElementById('cm-program-participation').value.trim();

    // Get selected service types
    const selectedCheckboxes = document.querySelectorAll('.cm-service-checkbox:checked');
    const serviceTypes = Array.from(selectedCheckboxes).map(cb => cb.value);
    const serviceType = serviceTypes.join(', ');

    const serviceContent = document.getElementById('cm-service-content').value.trim();
    const reflectionReason = document.getElementById('cm-reflection-reason').value.trim();

    // Validate required fields
    if (!recipientName || !age || !diagnosis || !recentChanges || !attendees || !serviceType || !serviceContent || !reflectionReason) {
        alert('필수 항목을 모두 입력해주세요.\\n(수급자명, 나이, 진단명, 최근 변화, 회의 참석자, 급여구분, 급여내용, 반영사유)');
        return;
    }

    // Show loading overlay
    showLoadingOverlay('사례관리 회의록을 생성하고 있습니다...');

    try {
        const prompt = buildCaseManagementPrompt(
            recipientName, age, diagnosis, recentChanges,
            year, quarter, attendees, guardianInfo,
            programParticipation, serviceType, serviceContent, reflectionReason
        );

        const result = await callGeminiAPI(prompt);

        // Display result
        displayCaseManagementResult(result);

    } catch (error) {
        alert('생성 중 오류가 발생했습니다: ' + error.message);
    } finally {
        hideLoadingOverlay();
    }
}

// 사례관리 프롬프트 생성 (상세 지침 포함)
function buildCaseManagementPrompt(recipientName, age, diagnosis, recentChanges, year, quarter, attendees, guardianInfo, programParticipation, serviceType, serviceContent, reflectionReason) {
    const quarterText = quarter === '1' ? '1/2' : quarter === '2' ? '1/2' : quarter === '3' ? '3/4' : '3/4';

    return `# 사례관리 지침 - 평가 기준 완전 준수

# 1. 역할
너는 주야간보호센터 사례관리 담당자로서 수급자의 상태 변화와 가족 의견을 바탕으로 평가 기준을 완벽히 충족하는 사례관리 회의록을 작성한다.

# 2. 기본 정보
- 수급자명: ${recipientName}
- 나이: ${age}세
- 진단명: ${diagnosis}
- 최근 변화: ${recentChanges}
${guardianInfo ? `- 보호자 정보: ${guardianInfo}` : ''}
${programParticipation ? `- 프로그램 참여도: ${programParticipation}` : ''}
- 회의 참석자: ${attendees}
- 회의 연도/분기: ${year}년 ${quarterText}분기
- 급여구분: ${serviceType}
- 급여내용: ${serviceContent}
- 반영사유: ${reflectionReason}

# 3. 작성 요구사항

## 선정사유
- 3~6문장으로 작성
- 문제, 위험, 욕구, 행동, 정서, 환경 변화를 기반으로 작성
- 단순 행정 처리(등급변경, 병원 입원, 요양시설 전원 등)는 선정사유로 사용 금지

## 회의내용 (2,000자 내외)
- 첫 문장은 반드시: "${attendees.split(',')[0].trim()}: 지금부터 ${year}년 ${quarterText}분기 사례관리를 시작하겠습니다. 오늘 사례관리 대상자로 ${recipientName} 어르신을 선정했으며, 최근 변화와 케어 과정에서 느끼신 부분을 자유롭게 말씀해주시면 감사하겠습니다."
- 참석자별로 2~3라운드 이상 발언
- 구어체로 자연스러운 대화 형식
- 문제 제기 → 원인 분석 → 해결책 논의 → 정리 순서
- 발언자는 입력된 이름 그대로 사용

## 회의결과
- 4~7개의 구체적 조치사항
- 보고체로 작성
- 보호자 상담 계획 포함

## 급여제공반영
- 급여구분(${serviceType})과 급여내용(${serviceContent}) 반영
- 반영사유(${reflectionReason}) 포함
- 회의 다음날부터 30일 이내 반영 형태로 서술

# 4. 출력 형식
반드시 다음 형식으로만 작성:

[1]
선정사유 내용

[2]
회의내용

[3]
회의결과

[4]
급여제공반영 내용

위 지침에 따라 사례관리 회의록을 작성하라.`;
}

// 사례관리 결과 표시
function displayCaseManagementResult(result) {
    const sections = result.split(/\[(\d+)\]/);

    const selectionReason = sections[2] ? sections[2].trim() : '';
    const meetingContent = sections[4] ? sections[4].trim() : '';
    const meetingResult = sections[6] ? sections[6].trim() : '';
    const serviceReflection = sections[8] ? sections[8].trim() : '';

    const resultContainer = document.getElementById('cm-result-content');
    resultContainer.innerHTML = `
        <div class="space-y-4">
            <div class="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">선정사유</h4>
                <p class="text-sm text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">${selectionReason}</p>
            </div>

            <div class="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">회의내용</h4>
                <p class="text-sm text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">${meetingContent}</p>
            </div>

            <div class="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">회의결과</h4>
                <p class="text-sm text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">${meetingResult}</p>
            </div>

            <div>
                <h4 class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">급여제공반영</h4>
                <p class="text-sm text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">${serviceReflection}</p>
            </div>
        </div>
    `;

    // Show result section
    document.getElementById('cm-result-section').classList.remove('hidden');

    // Scroll to result
    document.getElementById('cm-result-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 사례관리 결과 복사
function copyCaseManagementResult() {
    const selectionReason = document.querySelector('#cm-result-content .space-y-4 > div:nth-child(1) p').textContent;
    const meetingContent = document.querySelector('#cm-result-content .space-y-4 > div:nth-child(2) p').textContent;
    const meetingResult = document.querySelector('#cm-result-content .space-y-4 > div:nth-child(3) p').textContent;
    const serviceReflection = document.querySelector('#cm-result-content .space-y-4 > div:nth-child(4) p').textContent;

    const fullText = `■ 선정사유\n${selectionReason}\n\n■ 회의내용\n${meetingContent}\n\n■ 회의결과\n${meetingResult}\n\n■ 급여제공반영\n${serviceReflection}`;

    navigator.clipboard.writeText(fullText).then(() => {
        alert('전체 내용이 클립보드에 복사되었습니다.');
    }).catch(err => {
        alert('복사 중 오류가 발생했습니다: ' + err);
    });
}
