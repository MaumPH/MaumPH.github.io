// 프로그램 계획안 생성
async function generateProgramPlan() {
    const programName = document.getElementById('pe-program-name').value.trim();
    const programType = document.getElementById('pe-program-type').value;
    const programContent = document.getElementById('pe-program-content').value.trim();

    // 필수 입력 검증
    if (!programName) {
        alert('프로그램 이름을 입력해주세요.');
        return;
    }
    if (!programType) {
        alert('프로그램 유형을 선택해주세요.');
        return;
    }
    if (!programContent) {
        alert('프로그램 설명 또는 기존 계획안을 입력해주세요.');
        return;
    }

    // API 키 확인
    const apiKey = await getApiKey();
    if (!apiKey) {
        alert('API 키가 설정되지 않았습니다. 설정 페이지에서 API 키를 입력해주세요.');
        return;
    }

    // 로딩 시작
    showLoadingOverlay('AI가 프로그램 계획안을 생성하고 있습니다...');

    try {
        const prompt = buildProgramPlanPrompt(programName, programType, programContent);
        const result = await callGeminiAPI(prompt);

        displayProgramPlanResult(result);
        hideLoadingOverlay();
    } catch (error) {
        console.error('Error generating program plan:', error);
        hideLoadingOverlay();
        alert('프로그램 계획안 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// 프롬프트 생성
function buildProgramPlanPrompt(programName, programType, programContent) {
    return `# 역할
너는 주야간보호센터 프로그램 계획안을 작성·보완하는 실무 전용 작성기다.
입력된 정보만을 바탕으로 내부 시스템에 바로 등록 가능한 프로그램 계획안을 생성한다.

# 입력 정보 (사용자 제공)
- 프로그램 이름: ${programName}
- 프로그램 유형: ${programType}
- 프로그램 내용:
${programContent}

# 목표
- 목표: 입력된 프로그램 이름·유형·내용을 기반으로, 주야간보호센터에서 실제 활용 가능한 프로그램 계획안을 작성하거나 기존 내용을 보완한다.
- 산출물: 아래 4파트 고정 구조로 구성된 프로그램 계획안.
  1) 준비물
  2) 프로그램 목표
  3) 진행과정(도입·전개·마무리·유의점)
  4) 기대효과
- 성공 기준:
  - 출력은 반드시 4파트 구조를 유지한다.
  - 행정 문서 수준의 구조성과 실무 기록에 적합한 문체를 유지한다.
  - 목표–진행과정–기대효과가 논리적으로 연결된다.
  - 치료·과장·추측 표현 없이 중립적으로 서술한다.
  - 실무자가 추가 수정 없이 그대로 입력·저장 가능하다.

# 작성 원칙
- 프로그램 유형별 방향성:
  - 신체기능: 기능 유지, 균형, 안전, 낙상 예방 중심
  - 인지기능: 주의, 기억, 이해, 자극 중심
  - 가족지지: 소통, 이해, 정서적 지지 중심
  - 사회적응: 참여, 상호작용, 관계 형성 중심
- '돕는다 / 유지한다 / 예방한다 / 기여한다 / 실시한다' 등 중립적 서술어 사용
- 효과를 단정하지 않고 '도움이 된다 / 기여한다' 수준으로 표현

# 절차
1) 입력된 프로그램 내용이 신규 설명인지, 기존 계획안인지 판단한다.
2) 신규 설명일 경우:
   - 프로그램 유형에 맞춰 내용을 구조화하여 계획안을 작성한다.
3) 기존 계획안일 경우:
   - 원래 의도와 구조는 유지하되 문장 표현을 정리하고,
   - 누락된 요소(목표·유의점·기대효과 등)를 보완한다.
4) 출력 구조를 4파트로 고정한다.
5) 준비물은 기관에서 구비 가능한 최소 항목만 작성한다.
6) 진행과정은 도입–전개–마무리–유의점 순서로 작성한다.
7) 전체 문체와 형식을 최종 점검 후 출력한다.

# 결과물 형식 (출력 고정)
아래 순서와 제목을 반드시 그대로 사용한다.
중요: 마크다운 문법(#, ##, ###, **, - 등)을 절대 사용하지 말고 일반 텍스트로만 작성한다.

① 준비물
예: 침대, 의자, 탁자 등
간단한 명사 나열로 작성한다.

② 프로그램 목표
○ 본 프로그램은 ~을 통해 어르신의 ~을 돕고, ~을 예방하거나 유지하는 데 목적이 있다.
○ 프로그램 활동은 어르신의 기능 수준에 맞추어 무리 없이 참여할 수 있도록 구성한다.
○ 어르신이 가능한 범위 내에서 스스로 움직이고 참여할 수 있도록 지원한다.
※ 2~3문장, 행정 문체 유지

③ 진행과정

● 도입
프로그램 활동 전 주의사항을 안내하고 참여 분위기를 형성한다.
어르신이 부담 없이 시작할 수 있도록 간단한 안내나 질문을 활용한다.

● 전개
프로그램의 핵심 활동을 단계적으로 진행한다.
어르신의 속도와 기능 수준에 맞추어 활동을 조정하고 필요 시 보조한다.
자발적인 참여를 유도하는 간단한 상호작용을 포함한다.

● 마무리
활동을 천천히 정리하며 어르신의 상태를 확인한다.
무리 없이 참여했는지 살피며 긍정적인 경험으로 마무리한다.

● 유의점
○ 낙상 및 신체 부담을 고려하여 모든 활동은 천천히 진행한다.
○ 어르신의 상태에 따라 활동 강도와 횟수를 조절한다.
○ 필요 시 보호자 또는 종사자의 보조를 제공한다.

④ 기대효과
1. 프로그램 활동을 통해 관련 기능 유지 및 참여에 도움이 된다.
2. 활동 참여 과정이 일상생활의 안전과 적응에 기여한다.
※ 효과 단정 표현 금지

# 주의 사항
- 입력된 정보가 일부 부족하더라도, 일반적인 주야간보호센터 환경과 해당 프로그램 유형 기준에 따라 무리 없는 범위 내에서 자동 보완하여 작성한다.
- 의료·치료 목적, 고위험 활동, 비현실적 환경은 포함하지 않는다.
- 최종 출력 전 4파트 구조 준수 여부와 금지 표현 포함 여부를 점검한다.

---

위 지침에 따라 "${programName}" 프로그램의 계획안을 작성해주세요.
출력은 반드시 4파트 구조(준비물, 프로그램 목표, 진행과정, 기대효과)를 따라야 하며,
실무자가 바로 사용할 수 있도록 완성된 형태로 제공해주세요.`;
}

// 결과 표시
function displayProgramPlanResult(result) {
    const resultSection = document.getElementById('pe-result-section');
    const resultContent = document.getElementById('pe-result-content');

    // 일반 텍스트로 표시 (줄바꿈 유지)
    resultContent.textContent = result;
    resultSection.classList.remove('hidden');

    // 결과 섹션으로 스크롤
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 결과 복사
function copyProgramPlanResult() {
    const resultContent = document.getElementById('pe-result-content');
    const textToCopy = resultContent.innerText;

    navigator.clipboard.writeText(textToCopy).then(() => {
        alert('프로그램 계획안이 클립보드에 복사되었습니다.');
    }).catch(err => {
        console.error('복사 실패:', err);
        alert('복사에 실패했습니다. 다시 시도해주세요.');
    });
}
