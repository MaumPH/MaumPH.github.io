// 프로그램 의견수렴 생성
async function generateProgramFeedback() {
    const beneficiary = document.getElementById('pf-beneficiary').value.trim();
    const programName = document.getElementById('pf-program-name').value.trim();
    const programDate = document.getElementById('pf-program-date').value;
    const feedback = document.getElementById('pf-feedback').value.trim();

    // 필수 입력 검증
    if (!beneficiary) {
        alert('수급자명(보호자명)을 입력해주세요.');
        return;
    }
    if (!programName) {
        alert('프로그램명을 입력해주세요.');
        return;
    }
    if (!programDate) {
        alert('프로그램 날짜를 선택해주세요.');
        return;
    }
    if (!feedback) {
        alert('어르신 의견을 입력해주세요.');
        return;
    }

    // API 키 확인
    const apiKey = await getApiKey();
    if (!apiKey) {
        alert('API 키가 설정되지 않았습니다. 설정 페이지에서 API 키를 입력해주세요.');
        return;
    }

    // 로딩 시작
    showLoadingOverlay('AI가 평가 및 차후 반영사항을 생성하고 있습니다...');

    try {
        const prompt = buildProgramFeedbackPrompt(beneficiary, programName, programDate, feedback);
        const result = await callGeminiAPI(apiKey, prompt);

        displayProgramFeedbackResult(result);
        hideLoadingOverlay();
    } catch (error) {
        console.error('Error generating program feedback:', error);
        hideLoadingOverlay();
        alert('평가 및 차후 반영사항 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// 프롬프트 생성
function buildProgramFeedbackPrompt(beneficiary, programName, programDate, feedback) {
    // 날짜 포맷팅 (YYYY.MM.DD)
    const dateObj = new Date(programDate);
    const formattedDate = `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;

    return `# 프로그램 의견수렴 자동 기록 지침 ver.7-FINAL
(의견 유형별 반영 논리 명시 · 평가 의미 강화 · 실무 검수 기준 포함)

---

## # 역할(Role)
너는 주야간보호센터의 **프로그램 의견수렴 기록 담당자**다.
어르신의 의견을 기반으로 프로그램을 어떻게 **조정·진행했는지**,
그에 대한 **어르신의 평가(반응)**와
**차후 운영 방향**을 사실 중심으로 기록한다.

---

## # 목표
- 「평가 및 차후 반영사항」이 이름에 맞게
  **반영 결과 + 어르신 평가 + 향후 계획**을 모두 담도록 한다.
- 의견 유형에 맞는 조치가 자동으로 연결되도록 한다.
- 실무 점검·외부 평가에서도 문제없는 기록을 생성한다.

**산출물 타입**
- 프로그램 평가 결과 반영 기록

**성공 기준**
- 의견 → 반영 → 평가 → 차후 계획의 인과관계가 명확함
- 평가의 주체가 항상 '어르신'으로 표현됨
- 의학적·심리적 판단 문장 없음
- 단문·문어체·중립 톤 유지

---

## # 입력 정보

### ① 프로그램 평가
- 수급자명(보호자명): ${beneficiary}
- 프로그램명: ${programName}
- 프로그램 날짜: ${formattedDate}
- 의견(진술): ${feedback}

---

## # 의견 유형별 반영 문장 생성 규칙

### 1) 난이도·수준 조절 의견
- 반영 방식: 크기 확대, 속도 조절, 단계 완화 등
- 평가 표현: "보기 편하다", "수월하다", "하기 좋다"

**문장 패턴**
어르신의 의견을 수렴하여 ~을 조정하여 프로그램을 진행하였음.
진행 후 어르신께서 ~하다고 말씀하심.
차후에도 난이도를 고려하여 프로그램을 운영할 예정임.

---

### 2) 흥미·기호 관련 의견
- 반영 방식: 음악, 주제, 활동 방식 변경
- 평가 표현: "흥이 난다", "재미있다", "좋다"

**문장 패턴**
어르신의 의견을 수렴하여 ~로 변경하여 프로그램을 진행하였음.
진행 후 어르신께서 ~다고 말씀하심.
차후 유사 프로그램 운영 시에도 어르신의 기호를 반영할 계획임.

---

## # 「평가 및 차후 반영사항」 필수 구성 요소
1. 의견을 수렴했음을 명시
2. 실제 반영한 조치 내용
3. 어르신의 평가(반응)
4. 차후 운영 방향(계획 수준)

※ 반응이 입력되지 않은 경우
→ "특이사항 없이 프로그램을 마무리하였음" 사용

---

## # 자체 점검 체크리스트(최종 검수용)

- [인과관계] 의견 내용과 반영 조치가 직접 연결되는가?
- [주어 일치] 평가의 주체가 '어르신'으로 표현되었는가?
- [객관성] 의학적 판단·효과 단정 표현이 없는가?

---

## # 최종 출력 형식

다음 형식으로 출력해주세요:

② 평가 및 차후 반영사항
${formattedDate}  ${programName}
[의견 수렴 및 반영 내용을 여기에 작성]

---

## # 주의 사항
- '적극', '효과적', '개선됨' 등 평가처럼 보이는 형용사 사용 금지
- 차후 반영은 반드시 '예정', '계획', '검토' 수준으로 작성
- 입력되지 않은 반응·성과는 생성하지 않는다
- 최종 출력 전 형식·톤·중립성 자체 점검 수행

---

위 지침에 따라 "${programName}" 프로그램의 평가 및 차후 반영사항을 작성해주세요.
어르신의 의견을 분석하여 적절한 반영 방안과 평가, 차후 계획을 포함한 완성된 기록을 생성해주세요.`;
}

// 결과 표시
function displayProgramFeedbackResult(result) {
    const resultSection = document.getElementById('pf-result-section');
    const resultContent = document.getElementById('pf-result-content');

    resultContent.innerHTML = result;
    resultSection.classList.remove('hidden');

    // 결과 섹션으로 스크롤
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 결과 복사
function copyProgramFeedbackResult() {
    const resultContent = document.getElementById('pf-result-content');
    const textToCopy = resultContent.innerText;

    navigator.clipboard.writeText(textToCopy).then(() => {
        alert('평가 및 차후 반영사항이 클립보드에 복사되었습니다.');
    }).catch(err => {
        console.error('복사 실패:', err);
        alert('복사에 실패했습니다. 다시 시도해주세요.');
    });
}
