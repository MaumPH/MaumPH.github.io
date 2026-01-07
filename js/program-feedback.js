// 프로그램 의견수렴 생성
async function generateProgramFeedback() {
    // API 키 확인
    if (!apiKey) {
        alert('API 키를 먼저 설정해주세요.');
        showPage('settings');
        return;
    }

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

    // 프롬프트 생성
    const prompt = buildProgramFeedbackPrompt(beneficiary, programName, programDate, feedback);

    // 로딩 시작
    showLoadingOverlay('AI가 평가 및 차후 반영사항을 생성하고 있습니다...');

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
            throw new Error(errorData.error?.message || 'API 호출 실패');
        }

        const data = await response.json();
        const result = data.candidates[0].content.parts[0].text;

        // 사용 횟수 증가
        usageCount++;
        localStorage.setItem('usage_count', usageCount.toString());

        displayProgramFeedbackResult(result);
        hideLoadingOverlay();
    } catch (error) {
        console.error('Error generating program feedback:', error);
        hideLoadingOverlay();
        alert('평가 및 차후 반영사항 생성 중 오류가 발생했습니다: ' + error.message);
    }
}

// 프롬프트 생성
function buildProgramFeedbackPrompt(beneficiary, programName, programDate, feedback) {
    // 날짜 포맷팅 (YYYY.MM.DD)
    const dateObj = new Date(programDate);
    const formattedDate = `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;

    // 다양성을 위한 랜덤 시드 생성 (타임스탬프 기반)
    const randomSeed = Date.now() % 1000;

    // 다양한 문장 시작 패턴들
    const sentenceStarters = [
        '어르신의 의견을 반영하여',
        '어르신께서 말씀하신 내용을 토대로',
        '프로그램 진행 중 제시된 의견에 따라',
        '어르신의 요구사항을 수렴하여',
        '의견수렴 과정에서 나온 제안을 고려하여'
    ];

    // 다양한 평가 연결 표현들
    const evaluationConnectors = [
        '진행 후 어르신께서',
        '프로그램 종료 시',
        '활동을 마친 뒤 어르신께서',
        '이에 대해 어르신께서',
        '프로그램 진행 결과'
    ];

    // 다양한 차후 계획 표현들
    const futurePlanStarters = [
        '차후에도',
        '향후',
        '앞으로',
        '다음 프로그램 운영 시에도',
        '차기 진행 시'
    ];

    return `# 프로그램 의견수렴 자동 기록 지침 ver.8-DIVERSE
(표현 다양성 강화 · 의견 유형별 반영 논리 명시 · 평가 의미 강화 · 실무 검수 기준 포함)

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
- 다양성 시드: ${randomSeed}

---

## # 표현 다양성 원칙 ⭐ 중요 ⭐

**매번 다른 표현으로 작성하기 위한 지침:**
1. 같은 내용이라도 문장 구조를 다양하게 변경할 것
2. 동일한 의미의 다른 어휘를 적극 활용할 것
3. 문장 시작 패턴을 매번 바꿀 것
4. 연결어와 접속어를 다양화할 것
5. 절의 순서를 변경하여 새로운 느낌을 줄 것

**활용 가능한 다양한 표현들:**

### 문장 시작 패턴
- ${sentenceStarters.join('\n- ')}

### 평가 연결 표현
- ${evaluationConnectors.join('\n- ')}

### 차후 계획 표현
- ${futurePlanStarters.join('\n- ')}

**중요:** 위 표현들을 매번 다르게 조합하여 사용하되, 기계적 반복을 피하고 자연스럽게 작성할 것

---

## # 의견 유형별 반영 문장 생성 규칙

### 1) 난이도·수준 조절 의견
- 반영 방식: 크기 확대, 속도 조절, 단계 완화, 난이도 조정 등
- 평가 표현 예시: "보기 편하다", "수월하다", "하기 좋다", "적당하다", "편안하다"

**문장 패턴 예시 (매번 다르게 변형할 것)**
- 예시 1: 어르신의 의견을 수렴하여 ~을 조정하여 프로그램을 진행하였음. 진행 후 어르신께서 ~하다고 말씀하심. 차후에도 난이도를 고려하여 프로그램을 운영할 예정임.
- 예시 2: 프로그램 진행 중 제시된 의견에 따라 ~을 변경하였음. 이에 대해 어르신께서 ~다는 반응을 보이심. 향후에도 어르신의 수준을 반영하여 진행할 계획임.
- 예시 3: 어르신께서 말씀하신 내용을 토대로 ~을 조절하여 운영하였음. 활동을 마친 뒤 어르신께서 ~다고 하심. 앞으로도 적절한 난이도를 유지할 예정임.

---

### 2) 흥미·기호 관련 의견
- 반영 방식: 음악, 주제, 활동 방식 변경, 소재 교체 등
- 평가 표현 예시: "흥이 난다", "재미있다", "좋다", "즐겁다", "만족스럽다"

**문장 패턴 예시 (매번 다르게 변형할 것)**
- 예시 1: 어르신의 의견을 반영하여 ~로 변경하여 프로그램을 진행하였음. 진행 후 어르신께서 ~다고 말씀하심. 차후 유사 프로그램 운영 시에도 어르신의 기호를 반영할 계획임.
- 예시 2: 어르신의 요구사항을 수렴하여 ~을 활용하여 진행하였음. 프로그램 종료 시 어르신께서 ~다는 의견을 주심. 다음 프로그램 운영 시에도 선호도를 고려할 예정임.
- 예시 3: 의견수렴 과정에서 나온 제안을 고려하여 ~로 구성하였음. 프로그램 진행 결과 어르신께서 ~다고 하심. 향후에도 어르신의 취향을 반영하여 운영할 계획임.

---

### 3) 시간·분량 관련 의견
- 반영 방식: 활동 시간 조절, 휴식 추가, 속도 변경 등
- 평가 표현 예시: "적절하다", "부담 없다", "편하다", "괜찮다"

**문장 패턴 예시 (매번 다르게 변형할 것)**
- 예시 1: 어르신의 의견을 반영하여 활동 시간을 조정하여 진행하였음. 이에 대해 어르신께서 ~다고 말씀하심. 차후에도 적절한 시간 배분을 유지할 예정임.
- 예시 2: 프로그램 진행 중 제시된 의견에 따라 휴식 시간을 추가하였음. 활동을 마친 뒤 어르신께서 ~다는 반응을 보이심. 앞으로도 어르신의 체력을 고려하여 운영할 계획임.

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
- [다양성] 이전에 생성된 것과 다른 문장 구조와 표현을 사용했는가?

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
- **매번 다른 문장 구조와 표현을 사용하여 다양성 확보**

---

## # 작성 지시

위 지침과 다양한 표현 패턴을 활용하여 "${programName}" 프로그램의 평가 및 차후 반영사항을 작성해주세요.

**중요:**
- 제공된 여러 문장 패턴과 표현들을 참고하되, 매번 다른 조합과 구조로 작성할 것
- 같은 프로그램이라도 문장 시작, 연결어, 표현 방식을 다양하게 변경할 것
- 자연스러우면서도 이전 생성 결과와 구별되는 새로운 기록을 만들 것
- 어르신의 의견을 분석하여 적절한 반영 방안과 평가, 차후 계획을 포함한 완성된 기록을 생성해주세요.`;
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
