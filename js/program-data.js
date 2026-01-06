/**
 * program-data.js
 * 프로그램 과거 반응 패턴 데이터 관리
 * - 258개 프로그램의 과거 반응 패턴 로드
 * - 프로그램 이름 자동완성
 * - 과거 패턴 기반 AI 프롬프트 강화
 */

// 전역 변수
// programPatterns는 program_patterns.js에서 로드됨
if (typeof programPatterns === 'undefined') {
    var programPatterns = null;
}
let programNames = [];

// 프로그램 패턴 데이터 로드
async function loadProgramPatterns() {
    try {
        // program_patterns.js가 로드되어 있으면 그대로 사용
        if (typeof programPatterns !== 'undefined' && programPatterns !== null) {
            programNames = Object.keys(programPatterns).sort();
            console.log(`✓ ${programNames.length}개 프로그램 패턴 로드 완료 (program_patterns.js)`);
            return true;
        }

        // 그렇지 않으면 fetch 시도 (웹 서버에서 실행 시)
        const paths = [
            './program_patterns.json',
            'program_patterns.json',
            '/program_patterns.json'
        ];

        let loaded = false;
        for (const path of paths) {
            try {
                const response = await fetch(path);
                if (response.ok) {
                    programPatterns = await response.json();
                    programNames = Object.keys(programPatterns).sort();
                    console.log(`✓ ${programNames.length}개 프로그램 패턴 로드 완료 (경로: ${path})`);
                    loaded = true;
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (!loaded) {
            console.warn('⚠️ program_patterns.json 파일을 찾을 수 없습니다. 자동완성 기능이 비활성화됩니다.');
            return false;
        }

        return true;
    } catch (error) {
        console.error('❌ 프로그램 패턴 로드 실패:', error);
        return false;
    }
}

// 프로그램 이름 자동완성 설정 (select 방식)
function setupProgramAutocomplete() {
    const select = document.getElementById('program-title');

    console.log('프로그램 select 설정 시작...', {
        select: !!select,
        programNamesCount: programNames.length
    });

    if (!select) {
        console.error('❌ program-title select 요소를 찾을 수 없습니다.');
        return;
    }

    if (!programNames.length) {
        console.warn('⚠️ 프로그램 목록이 비어있습니다.');
        return;
    }

    // 기존 옵션 유지하고 프로그램 목록 추가
    const firstOption = select.querySelector('option[value=""]');
    select.innerHTML = '';
    if (firstOption) {
        select.appendChild(firstOption);
    } else {
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = `프로그램을 선택하세요 (${programNames.length}개)`;
        select.appendChild(defaultOption);
    }

    // 프로그램 목록 추가
    programNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });

    console.log(`✓ ${programNames.length}개 프로그램 목록 로드 완료`);
    console.log('처음 10개 프로그램:', programNames.slice(0, 10));
}

// 선택된 프로그램의 과거 반응 패턴 가져오기
function getProgramPatterns(programName) {
    if (!programPatterns) return null;

    // 정확한 매칭
    if (programPatterns[programName]) {
        return programPatterns[programName];
    }

    // 유사한 프로그램 찾기 (공백, 대소문자 무시)
    const normalized = programName.toLowerCase().replace(/\s+/g, '');
    for (const [key, value] of Object.entries(programPatterns)) {
        if (key.toLowerCase().replace(/\s+/g, '') === normalized) {
            return value;
        }
    }

    return null;
}

// 과거 패턴을 활용한 프롬프트 강화
function enhancePromptWithPatterns(basePrompt, programName) {
    const patterns = getProgramPatterns(programName);

    if (!patterns || patterns.length === 0) {
        return basePrompt;
    }

    // 과거 반응 예시 추가
    const examplesText = patterns.slice(0, 8).map((p, i) => `${i + 1}. ${p}`).join('\n');

    const enhancedPrompt = `${basePrompt}

## 📊 과거 "${programName}" 프로그램 참여 반응 예시

과거 어르신들의 실제 반응 패턴:
${examplesText}

위 과거 반응 패턴을 참고하되, 각 어르신의 개별 특성과 상태를 반영하여 다양하고 구체적인 반응을 생성해주세요.
과거 패턴과 비슷한 스타일과 구체성을 유지하되, 동일한 표현을 반복하지 말고 자연스럽게 변형하세요.`;

    return enhancedPrompt;
}

// 프로그램 검색 기능
function searchPrograms(query) {
    if (!programNames.length || !query) return [];

    const normalized = query.toLowerCase();
    return programNames.filter(name =>
        name.toLowerCase().includes(normalized)
    ).slice(0, 10); // 최대 10개
}

// 프로그램 통계 정보
function getProgramStats(programName) {
    const patterns = getProgramPatterns(programName);
    if (!patterns) return null;

    return {
        name: programName,
        sampleCount: patterns.length,
        hasPatterns: true
    };
}

// UI 업데이트: 패턴 존재 여부 표시
function updatePatternIndicator(programName) {
    const indicator = document.getElementById('pattern-indicator');
    if (!indicator) return;

    const patterns = getProgramPatterns(programName);

    if (patterns && patterns.length > 0) {
        indicator.innerHTML = `
            <div class="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <span class="material-symbols-outlined text-lg">check_circle</span>
                <span>과거 반응 패턴 ${patterns.length}개 발견 - AI 생성 시 자동 반영됩니다</span>
            </div>
        `;
        indicator.classList.remove('hidden');
    } else {
        indicator.innerHTML = `
            <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span class="material-symbols-outlined text-lg">info</span>
                <span>신규 프로그램 - 과거 패턴 없음</span>
            </div>
        `;
        indicator.classList.remove('hidden');
    }
}
