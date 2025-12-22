/**
 * monitoring.js
 * 프로그램 일지 작성 및 모니터링 관련 함수
 * - analyzePDF: PDF 분석
 * - generateProgramContent: 프로그램 내용 생성
 * - generateFuturePlan: 향후 계획 생성
 * - generateProgramReactions: 프로그램 반응 생성
 * - completeJournal: 일지 완료
 */

// PDF 분석
async function analyzePDF() {
    if (!pdfText) {
        alert('PDF를 먼저 업로드해주세요.');
        return;
    }

    const btn = document.getElementById('analyze-btn');
    btn.disabled = true;
    btn.innerHTML = '<div class="loading-spinner"></div> 분석 중...';

    document.getElementById('analysis-status').innerHTML = `
        <p class="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
            <div class="loading-spinner"></div>
            AI가 PDF를 분석하여 항목을 작성하고 있습니다...
        </p>
    `;

    try {
        const prompt = `${SYSTEM_PROMPT}

PDF 내용:
${pdfText}

위 PDF 내용을 분석하여 아래 10개 항목을 각각 100자 내외로 작성해주세요:
1. 식사 및 영양상태
2. 보행
3. 신체기능
4. 배뇨·배변기능
5. 위생관리
6. 일상생활수행
7. 인지기능
8. 행동증상
9. 가족 및 생활환경
10. 기타 및 종합의견

각 항목은 다음 형식으로 작성:
[항목번호]
내용

예시:
[1]
일반식 섭취는 양호함. 거부 없이 식사하며 저작과 연하 기능에 뚜렷한 어려움은 관찰되지 않음.`;

        const result = await callGeminiAPI(prompt);

        // Parse and fill fields
        for (let i = 1; i <= 10; i++) {
            const regex = new RegExp(`\\[${i}\\]\\s*([\\s\\S]*?)(?=\\[${i+1}\\]|$)`, 'm');
            const match = result.match(regex);
            if (match && match[1]) {
                document.getElementById(`field-${i}`).value = match[1].trim();
            }
        }

        // Show verification icons
        document.querySelectorAll('.verified-icon').forEach(icon => {
            icon.classList.remove('hidden');
        });

        document.getElementById('analysis-status').innerHTML = `
            <p class="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                <span class="material-symbols-outlined text-lg icon-fill">check_circle</span>
                분석이 완료되었습니다. 내용을 확인하고 수정하세요.
            </p>
        `;

        document.getElementById('step1-next').disabled = false;

    } catch (error) {
        alert('분석 중 오류가 발생했습니다: ' + error.message);
        document.getElementById('analysis-status').innerHTML = `
            <p class="text-sm text-red-800 dark:text-red-200 flex items-center gap-2">
                <span class="material-symbols-outlined text-lg">error</span>
                분석 중 오류가 발생했습니다. API 키를 확인하거나 다시 시도해주세요.
            </p>
        `;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined">auto_awesome</span> PDF 분석 시작';
    }
}

// 필드 재생성
async function regenerateFields() {
    if (confirm('현재 내용을 삭제하고 다시 생성하시겠습니까?')) {
        await analyzePDF();
    }
}

// 프로그램 내용 생성
async function generateProgramContent() {
    const userInput = document.getElementById('user-input').value.trim();
    if (!userInput) {
        alert('프로그램 수행 내용을 먼저 입력해주세요.');
        return;
    }

    showLoadingOverlay('입력하신 내용을 바탕으로 상세 항목을 생성하고 있습니다...');

    try {
        const prompt = `${SYSTEM_PROMPT}

# 작성 요청: 프로그램 제공계획 및 제공내용

사용자 입력:
${userInput}

위 입력을 바탕으로 아래 4개 항목을 작성해주세요.

## 작성 항목:
1. 필요내용 (50자 이상)
2. 제공방법 (50자 이상)
3. 수급자 반응 및 특이사항 (200자 이상)
4. 요양쌤 모니터링 (200자 이상)

## 출력 형식:
[1]
필요내용

[2]
제공방법

[3]
수급자 반응 및 특이사항

[4]
요양쌤 모니터링

위 형식으로 작성해주세요.`;

        const result = await callGeminiAPI(prompt);

        // Parse results
        const sections = result.split(/\[(\d+)\]/);

        if (sections[2]) document.getElementById('needs-content').value = sections[2].trim();
        if (sections[4]) document.getElementById('method-content').value = sections[4].trim();
        if (sections[6]) document.getElementById('reaction-content').value = sections[6].trim();
        if (sections[8]) document.getElementById('monitoring-content').value = sections[8].trim();

        hideLoadingOverlay();
        alert('✓ 프로그램 내용이 생성되었습니다!');

    } catch (error) {
        hideLoadingOverlay();
        alert('생성 중 오류가 발생했습니다: ' + error.message);
    }
}

// 향후 계획 생성
async function generateFuturePlan() {
    const needsContent = document.getElementById('needs-content').value.trim();
    const methodContent = document.getElementById('method-content').value.trim();

    if (!needsContent || !methodContent) {
        alert('먼저 필요내용과 제공방법을 작성해주세요.');
        return;
    }

    showLoadingOverlay('향후 계획을 생성하고 있습니다...');

    try {
        const prompt = `${SYSTEM_PROMPT}

# 작성 요청: 향후 계획

필요내용:
${needsContent}

제공방법:
${methodContent}

위 내용을 바탕으로 향후 계획을 100자 내외로 작성해주세요.
구체적이고 실행 가능한 계획을 포함하세요.`;

        const result = await callGeminiAPI(prompt);
        document.getElementById('future-plan-content').value = result.trim();

        hideLoadingOverlay();
        alert('✓ 향후 계획이 생성되었습니다!');

    } catch (error) {
        hideLoadingOverlay();
        alert('생성 중 오류가 발생했습니다: ' + error.message);
    }
}

// 일지 완료
function completeJournal() {
    alert('업무수행일지 작성이 완료되었습니다!\\n\\n각 항목의 내용을 확인하고 필요시 수정한 후 저장하세요.');
    window.scrollTo(0, 0);
}

// 프로그램 반응 생성 (과거 패턴 활용)
async function generateProgramReactions() {
    const programTitle = document.getElementById('program-title').value.trim();
    const programDesc = document.getElementById('program-description').value.trim();
    const count = parseInt(document.getElementById('reaction-count').value) || 30;

    if (!programTitle) {
        alert('프로그램 제목을 입력해주세요.');
        return;
    }

    showLoadingOverlay(`${count}개의 어르신 반응을 생성하고 있습니다...`);

    try {
        let prompt = `다음 프로그램에 참여한 어르신들의 반응을 ${count}개 생성해주세요.

프로그램: ${programTitle}
${programDesc ? `설명: ${programDesc}` : ''}

각 반응은 50-150자 분량으로, 긍정적 반응, 중립적 반응, 소극적 반응이 적절히 섞이도록 작성하세요.
구체적이고 다양한 표현을 사용하세요.

출력 형식:
1. 첫 번째 반응
2. 두 번째 반응
...`;

        // 과거 패턴 데이터가 있으면 프롬프트 강화
        if (typeof enhancePromptWithPatterns === 'function') {
            prompt = enhancePromptWithPatterns(prompt, programTitle);
        }

        const result = await callGeminiAPI(prompt);

        document.getElementById('reactions-output').value = result.trim();
        document.getElementById('reactions-result').classList.remove('hidden');

        hideLoadingOverlay();
        alert(`✓ ${count}개의 반응이 생성되었습니다!`);

    } catch (error) {
        hideLoadingOverlay();
        alert('생성 중 오류가 발생했습니다: ' + error.message);
    }
}

// 모든 반응 복사
function copyAllReactions() {
    const output = document.getElementById('reactions-output').value;

    if (!output || output.trim() === '') {
        alert('먼저 반응을 생성해주세요.');
        return;
    }

    navigator.clipboard.writeText(output).then(() => {
        alert('✓ 모든 반응이 클립보드에 복사되었습니다.');
    }).catch(err => {
        alert('복사 중 오류가 발생했습니다: ' + err);
    });
}

// 프로그램 모드 토글 (기존 프로그램 / 신규 프로그램)
function toggleProgramMode() {
    const mode = document.querySelector('input[name="program-mode"]:checked').value;
    const existingSection = document.getElementById('existing-program-section');
    const newSection = document.getElementById('new-program-section');

    if (mode === 'existing') {
        existingSection.classList.remove('hidden');
        newSection.classList.add('hidden');
    } else {
        existingSection.classList.add('hidden');
        newSection.classList.remove('hidden');
    }
}

// 프로그램 목록 채우기 (필요시 구현)
function populateProgramList() {
    // 실제 구현은 프로그램 목록 데이터에 따라 달라짐
}

// 프로그램 필터링
function filterPrograms() {
    const searchTerm = document.getElementById('program-search').value.toLowerCase();
    const programItems = document.querySelectorAll('.program-item');

    programItems.forEach(item => {
        const title = item.textContent.toLowerCase();
        if (title.includes(searchTerm)) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });

    updateProgramCount();
}

// 프로그램 개수 업데이트
function updateProgramCount() {
    const visibleCount = document.querySelectorAll('.program-item:not(.hidden)').length;
    const totalCount = document.querySelectorAll('.program-item').length;
    const countElement = document.getElementById('program-count');
    if (countElement) {
        countElement.textContent = `${visibleCount}/${totalCount}개 프로그램`;
    }
}

// 선택된 프로그램 표시 업데이트
function updateSelectedProgramDisplay() {
    const selectedRadio = document.querySelector('input[name="selected-program"]:checked');
    if (selectedRadio) {
        const programTitle = selectedRadio.value;
        document.getElementById('program-title').value = programTitle;
    }
}
