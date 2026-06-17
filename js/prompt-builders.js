(function attachPromptBuilders(root) {
    const promptKit = root.PromptKit || {};
    const policies = promptKit.policies || {};

    function systemPrompt() {
        return typeof SYSTEM_PROMPT === 'string' ? SYSTEM_PROMPT : '';
    }

    function formatDateWithDots(value) {
        const date = new Date(value);
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    }

    function commonPolicyBlock() {
        return [
            policies.factuality,
            policies.careTone,
            policies.formatSelfCheck
        ].filter(Boolean).join('\n\n');
    }

    function careLanguagePolicyBlock() {
        return [
            commonPolicyBlock(),
            policies.plainCareLanguage
        ].filter(Boolean).join('\n\n');
    }

    const builders = {
        pdfMentalStateAnalysis({ pdfText }) {
            return `${systemPrompt()}

PDF 내용:
${pdfText}

아래 10개 항목을 각각 100자 내외로 작성한다.
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

${commonPolicyBlock()}

출력은 구조화 JSON으로만 작성한다. 필드명은 mealNutrition, walking, physicalFunction, toileting, hygiene, dailyLiving, cognition, behaviorSymptoms, familyEnvironment, overallOpinion을 사용한다.`;
        },
        programJournalContent({ userInput }) {
            return `${systemPrompt()}

# 작성 요청: 프로그램 제공계획 및 제공내용

사용자 입력:
${userInput}

아래 4개 항목을 작성한다.
1. 필요내용
2. 제공방법
3. 어르신 반응 및 특이사항
4. 요양보호사 모니터링

${careLanguagePolicyBlock()}

출력은 구조화 JSON으로만 작성한다. 필드명은 need, method, reaction, caregiverMonitoring을 사용한다.`;
        },
        programJournalFuturePlan({ mentalStateContent, needsContent, methodContent, reactionContent, monitoringContent }) {
            return `${systemPrompt()}

# 작성 요청: 향후 계획 및 기타사항

심신상태 정보:
${mentalStateContent}

프로그램 제공 정보:
필요내용: ${needsContent}
제공방법: ${methodContent}
어르신 반응 및 특이사항: ${reactionContent}
요양보호사 모니터링: ${monitoringContent}

아래 3개 항목을 작성한다.
1. 종합
2. 급여제공 관련 유의사항
3. 급여제공 관련 세부계획

${careLanguagePolicyBlock()}

출력은 구조화 JSON으로만 작성한다. 필드명은 summary, caution, plan을 사용한다.`;
        },
        counselingLog({ date, method, elderName, guardianRelation, guardianRequest, centerRequest, writingStyle }) {
            const styleMap = {
                mixed: ['상담내용은 대화체로, 조치내용은 보고체로 작성', '(대화체로 자연스럽게 작성)', '(보고체로 간결하게 작성)'],
                conversational: ['전체를 대화체로 작성', '(대화체로 자연스럽게 작성)', '(대화체로 자연스럽게 작성)'],
                report: ['전체를 보고체로 작성', '(보고체로 간결하게 작성)', '(보고체로 간결하게 작성)']
            };
            const style = styleMap[writingStyle] || styleMap.report;
            const pattern = guardianRequest && centerRequest ? 'C (양방향 대화)' : guardianRequest ? 'A (보호자 → 센터)' : 'B (센터 → 보호자)';

            return `# 상담일지 작성

## 기본 정보
- 어르신: ${elderName}
- 보호자: ${guardianRelation}
- 상담 방식: ${method}
- 날짜: ${date}
- 작성 스타일: ${style[0]}
- 대화 패턴: ${pattern}

## 상담 내용
${guardianRequest ? `### 보호자 요청/문의\n${guardianRequest}` : ''}
${centerRequest ? `### 센터 요청/문의\n${centerRequest}` : ''}

${commonPolicyBlock()}

## 출력 형식

[상담일자]
${date}

[상담방식]
${method}

[상담내용]
${style[1]}

[조치내용]
${style[2]}`;
        },
        grievanceReport(data) {
            const today = new Date().toISOString().split('T')[0].replace(/-/g, '.');

            return `# 직원 고충처리 기록서 작성

입력값:
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

${commonPolicyBlock()}

직원 개인 평가, 비난, 법률 판단을 피하고 접수→분석→조치→통보→사후관리 흐름으로 작성한다.
모든 종결어는 ~임, ~음, ~됨, ~함, ~하였음으로 통일한다.

# 직원 고충처리 기록서

## ① 고충내용

### ▷ 접수 (${today})
(200자 내외)

### ▷ 분석 (${today})
(300자 내외)

## ② 처리결과

### ▷ 조치 (${today})
(150자 내외)

### ▷ 통보 (${today})
(150자 내외)

### ▷ 사후관리 (${today})
(200자 내외)

## 비고
사실 기반 중립적 기록 원칙`;
        },
        programFeedback({ beneficiary, programName, programDate, collectedOpinion, reflectedOpinion, seed }) {
            const formattedDate = formatDateWithDots(programDate);
            const diversitySeed = seed === undefined ? Date.now() % 1000 : seed;

            return `# 프로그램 의견수렴 및 의견반영 자동 기록

입력 정보:
- 수급자명(보호자명): ${beneficiary}
- 프로그램명: ${programName}
- 프로그램 날짜: ${formattedDate}
- 수급자(보호자) 의견수렴 내용: ${collectedOpinion}
- 수급자(보호자) 의견반영 내용: ${reflectedOpinion}
- 다양성 시드: ${diversitySeed}

${commonPolicyBlock()}

두 항목은 서로 섞지 않는다. 의견수렴에는 받은 의견만, 의견반영에는 실제 반영 내용과 필요한 차후 계획만 작성한다.

① 수급자(보호자) 의견수렴
${formattedDate}  ${programName}
[의견수렴 내용을 행정기록체로 작성]

② 수급자(보호자) 의견반영
${formattedDate}  ${programName}
[의견반영 내용을 행정기록체로 작성]`;
        },
        programPlan({ programName, programType, programContent }) {
            return `# 프로그램 계획안 작성

입력 정보:
- 프로그램 이름: ${programName}
- 프로그램 유형: ${programType}
- 프로그램 내용:
${programContent}

${commonPolicyBlock()}

출력은 반드시 4파트 구조를 유지하고 치료 효과를 단정하지 않는다.

## ① 준비물
- 간단한 명사 나열

## ② 프로그램 목표
- 2~3문장

## ③ 진행과정
### ● 도입
### ● 전개
### ● 마무리
### ● 유의점

## ④ 기대효과
- 효과 단정 표현 금지`;
        },
        caseManagement({ recipientName, age, diagnosis, recentChanges, year, quarter, attendees, guardianInfo, programParticipation, serviceType, serviceContent, reflectionReason }) {
            const quarterText = quarter === '1' || quarter === '2' ? '1/2' : '3/4';

            return `# 사례관리 지침

기본 정보:
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

${commonPolicyBlock()}

[1]
선정사유 내용

[2]
회의내용

[3]
회의결과

[4]
급여제공반영 내용`;
        },
        programReactions({ programTitle, programDesc, count, distribution, isExisting, randomSeed, previousReactions, examplesSection, positiveEmotionsText, neutralEmotionsText, negativeEmotionsText, cognitiveText, physicalText, socialText, programBehaviorsText, timeFlowText }) {
            return `# ${isExisting ? '기존' : '신규'} 프로그램 반응 생성

프로그램명: "${programTitle}"
다양성 시드: ${randomSeed}
${isExisting ? '' : `프로그램 설명:\n${programDesc}\n`}
${previousReactions ? `이전 생성 결과와 유사한 표현 금지:\n${previousReactions}\n` : ''}
${examplesSection || ''}

${commonPolicyBlock()}

총 ${count}개를 생성하고 아래 개수를 정확히 지킨다.
- 긍정: ${distribution.positive}개
- 중립: ${distribution.neutral}개
- 소극/피로: ${distribution.negative}개

긍정 표현:
${positiveEmotionsText}

중립 표현:
${neutralEmotionsText}

소극/피로 표현:
${negativeEmotionsText}

인지 수준:
${cognitiveText}

신체 능력:
${physicalText}

사회성:
${socialText}

프로그램 행동:
${programBehaviorsText}

시간 흐름:
${timeFlowText}

출력은 구조화 JSON으로만 작성한다. 필드명은 "positive", "neutral", "negative"이며 각 값은 문자열 배열이다.`;
        },
        newsletterImageTitle({ description }) {
            return `당신은 주간보호센터 소식지의 활동 제목을 만드는 전문가입니다.
제공된 사진을 보고 구체적이고 직관적인 활동 제목을 만든다.
${description ? `사용자가 제공한 설명: ${description}` : ''}

${commonPolicyBlock()}

3~8글자의 활동 제목만 출력하세요. 설명이나 추가 문구는 필요 없습니다. 제목만 출력하세요.`;
        },
        newsletterContent({ titles, descriptions }) {
            const descSection = descriptions.some(Boolean)
                ? descriptions.map((desc, index) => desc ? `- ${titles[index]}: ${desc}` : '').filter(Boolean).join('\n')
                : '추가 설명 없음';

            return `당신은 주간보호센터 소식지를 작성하는 따뜻한 작가입니다.

활동 제목:
1. ${titles[0]}
2. ${titles[1]}
3. ${titles[2]}

각 활동 설명:
${descSection}

${commonPolicyBlock()}

문체 DNA:
- 해요체 사용 필수
- 물결표와 ^^를 자연스럽게 사용
- 각 활동당 3~5문장
- 제목을 본문에서 반복하지 말 것
- 밝고 긍정적인 톤

'${titles[0]}'

[본문]

---

'${titles[1]}'

[본문]

---

'${titles[2]}'

[본문]`;
        }
    };

    promptKit.builders = builders;
    root.PromptKit = promptKit;
})(typeof window !== 'undefined' ? window : globalThis);
