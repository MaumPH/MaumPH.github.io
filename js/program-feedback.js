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
    const collectedOpinion = document.getElementById('pf-collected-opinion').value.trim();
    const reflectedOpinion = document.getElementById('pf-reflected-opinion').value.trim();

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
    if (!collectedOpinion) {
        alert('수급자(보호자) 의견수렴 내용을 입력해주세요.');
        return;
    }
    if (!reflectedOpinion) {
        alert('수급자(보호자) 의견반영 내용을 입력해주세요.');
        return;
    }

    // 프롬프트 생성
    const prompt = buildProgramFeedbackPrompt(
        beneficiary,
        programName,
        programDate,
        collectedOpinion,
        reflectedOpinion
    );

    // 로딩 시작
    showLoadingOverlay('AI가 의견수렴 및 의견반영 결과를 생성하고 있습니다...');

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
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
        alert('의견수렴 및 의견반영 생성 중 오류가 발생했습니다: ' + error.message);
    }
}

// 프롬프트 생성
function buildProgramFeedbackPrompt(beneficiary, programName, programDate, collectedOpinion, reflectedOpinion) {
    // 날짜 포맷팅 (YYYY.MM.DD)
    const dateObj = new Date(programDate);
    const formattedDate = `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;

    // 다양성을 위한 랜덤 시드 생성 (타임스탬프 기반)
    const randomSeed = Date.now() % 1000;

    // 다양한 문장 시작 패턴들
    const sentenceStarters = [
        '수급자(보호자)가 제시한 의견은',
        '프로그램 운영 중 수렴된 의견은',
        '수급자(보호자)의 의견을 확인한 결과',
        '해당 프로그램과 관련하여 접수된 의견은',
        '수급자(보호자) 의견수렴 내용은'
    ];

    const reflectionConnectors = [
        '이에 따라',
        '해당 의견을 반영하여',
        '수렴된 의견을 바탕으로',
        '프로그램 운영 시',
        '차후 운영 방향에 반영하여'
    ];

    // 다양한 차후 계획 표현들
    const futurePlanStarters = [
        '차후에도',
        '향후',
        '앞으로',
        '다음 프로그램 운영 시에도',
        '차기 진행 시'
    ];

    return `# 프로그램 의견수렴 및 의견반영 자동 기록 지침 ver.9-SPLIT
(수급자/보호자 의견수렴 · 의견반영 분리 작성 · 행정기록체 · 실무 검수 기준 포함)

---

## # 역할(Role)
너는 주야간보호센터의 **프로그램 의견수렴 기록 담당자**다.
수급자 또는 보호자에게 받은 의견과 그 의견을 프로그램 운영에 어떻게 반영했는지를
각각 분리하여 사실 중심의 행정기록체로 작성한다.

---

## # 목표
- 「수급자(보호자) 의견수렴」과 「수급자(보호자) 의견반영」을 각각 별도 항목으로 작성한다.
- 입력된 의견수렴 내용과 의견반영 내용의 의미를 보존한다.
- 의견과 반영 조치의 인과관계가 명확하게 드러나도록 한다.
- 실무 점검·외부 평가에서도 문제없는 기록을 생성한다.

**산출물 타입**
- 프로그램 의견수렴 및 의견반영 기록

**성공 기준**
- 의견수렴 항목에는 받은 의견만 정리됨
- 의견반영 항목에는 실제 반영 내용과 필요 시 차후 운영 방향만 정리됨
- 두 항목이 서로 섞이지 않음
- 의학적·심리적 판단 문장 없음
- 단문·문어체·중립 톤 유지

---

## # 입력 정보

### ① 기본 정보
- 수급자명(보호자명): ${beneficiary}
- 프로그램명: ${programName}
- 프로그램 날짜: ${formattedDate}
- 수급자(보호자) 의견수렴 내용: ${collectedOpinion}
- 수급자(보호자) 의견반영 내용: ${reflectedOpinion}
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

### 반영 연결 표현
- ${reflectionConnectors.join('\n- ')}

### 차후 계획 표현
- ${futurePlanStarters.join('\n- ')}

**중요:** 위 표현들을 매번 다르게 조합하여 사용하되, 기계적 반복을 피하고 자연스럽게 작성할 것

---

## # 항목별 작성 규칙

### 1) 수급자(보호자) 의견수렴
- 입력된 의견수렴 내용을 바탕으로 작성한다.
- 누가 어떤 의견을 제시했는지 드러나도록 하되, 과장하거나 새 사실을 만들지 않는다.
- 1~2문장으로 간결하게 작성한다.

**예시 패턴**
- 수급자(보호자)가 프로그램 중 ~에 대한 의견을 제시하였음.
- 보호자가 ~와 관련하여 프로그램 운영 시 고려가 필요하다는 의견을 전달하였음.
- 수급자가 ~에 대해 불편함 또는 희망사항을 표현하였음.

### 2) 수급자(보호자) 의견반영
- 입력된 의견반영 내용을 바탕으로 작성한다.
- 실제 반영한 조치가 의견수렴 내용과 직접 연결되도록 작성한다.
- 차후 계획을 넣을 경우 '예정', '계획', '검토' 수준으로만 작성한다.
- 1~2문장으로 간결하게 작성한다.

**예시 패턴**
- 해당 의견을 반영하여 ~로 조정하여 프로그램을 진행하였음.
- 수렴된 의견을 바탕으로 ~을 변경하였으며, 차후에도 ~을 고려하여 운영할 계획임.
- 프로그램 운영 시 ~을 적용하였고, 다음 진행 시에도 동일 사항을 검토할 예정임.

---

## # 자체 점검 체크리스트(최종 검수용)

- [항목 분리] 의견수렴과 의견반영이 각각 다른 항목에 작성되었는가?
- [인과관계] 수렴된 의견과 반영 조치가 직접 연결되는가?
- [객관성] 의학적 판단·효과 단정 표현이 없는가?
- [다양성] 이전에 생성된 것과 다른 문장 구조와 표현을 사용했는가?
- [사실성] 입력되지 않은 반응·성과·평가를 생성하지 않았는가?

---

## # 최종 출력 형식

아래 형식만 출력한다. 마크다운 코드블록, 불릿, 추가 설명은 출력하지 않는다.

① 수급자(보호자) 의견수렴
${formattedDate}  ${programName}
[의견수렴 내용을 행정기록체로 작성]

② 수급자(보호자) 의견반영
${formattedDate}  ${programName}
[의견반영 내용을 행정기록체로 작성]

---

## # 주의 사항
- '적극', '효과적', '개선됨' 등 평가처럼 보이는 형용사 사용 금지
- 차후 반영은 반드시 '예정', '계획', '검토' 수준으로 작성
- 입력되지 않은 반응·성과는 생성하지 않는다
- 입력된 의견수렴 내용과 의견반영 내용의 의미를 임의로 바꾸지 않는다
- 최종 출력 전 형식·톤·중립성 자체 점검 수행
- **매번 다른 문장 구조와 표현을 사용하여 다양성 확보**

---

## # 작성 지시

위 지침과 다양한 표현 패턴을 활용하여 "${programName}" 프로그램의
「수급자(보호자) 의견수렴」과 「수급자(보호자) 의견반영」을 각각 작성해주세요.

**중요:**
- 제공된 여러 문장 패턴과 표현들을 참고하되, 매번 다른 조합과 구조로 작성할 것
- 같은 프로그램이라도 문장 시작, 연결어, 표현 방식을 다양하게 변경할 것
- 자연스러우면서도 이전 생성 결과와 구별되는 새로운 기록을 만들 것
- 출력에는 반드시 "① 수급자(보호자) 의견수렴"과 "② 수급자(보호자) 의견반영" 두 제목을 포함할 것
- 각 항목은 입력된 내용을 바탕으로 사실 중심의 완성된 기록을 생성할 것`;
}

// 결과 표시
function displayProgramFeedbackResult(result) {
    const resultSection = document.getElementById('pf-result-section');
    const resultContent = document.getElementById('pf-result-content');

    resultContent.textContent = result;
    resultSection.classList.remove('hidden');

    // 결과 섹션으로 스크롤
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetProgramFeedbackForm() {
    const fieldIds = [
        'pf-beneficiary',
        'pf-program-name',
        'pf-program-date',
        'pf-collected-opinion',
        'pf-reflected-opinion'
    ];

    fieldIds.forEach((fieldId) => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = '';
        }
    });

    const resultSection = document.getElementById('pf-result-section');
    const resultContent = document.getElementById('pf-result-content');

    if (resultContent) {
        resultContent.textContent = '';
    }
    if (resultSection) {
        resultSection.classList.add('hidden');
    }

    const firstField = document.getElementById('pf-beneficiary');
    if (firstField) {
        firstField.focus();
    }
}

// 결과 복사
function copyProgramFeedbackResult() {
    const resultContent = document.getElementById('pf-result-content');
    const textToCopy = resultContent.innerText;

    navigator.clipboard.writeText(textToCopy).then(() => {
        alert('의견수렴 및 의견반영이 클립보드에 복사되었습니다.');
    }).catch(err => {
        console.error('복사 실패:', err);
        alert('복사에 실패했습니다. 다시 시도해주세요.');
    });
}
