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
1. 필요내용 (50자 이상) - 프로그램을 통해 어르신에게 제공하고자 하는 활동 내용
2. 제공방법 (50자 이상) - 프로그램을 어떤 방식으로 진행했는지 구체적 방법
3. 어르신 반응 및 특이사항 (100자 이내) - 프로그램 참여 시 어르신의 행동과 반응
4. 요양쌤 모니터링 (100자 이내) - 프로그램 진행 중 요양쌤이 관찰하고 지원한 내용

## 중요 지침:
- 자연스러운 일상어 사용 필수:
  ❌ "과업", "과제", "수행", "지속", "완수", "보조", "지원"
  ✅ "프로그램", "활동", "진행", "계속", "마무리", "도움드림", "도와드림"
- "수급자" 대신 "어르신" 사용 필수
- 공문서 어투 지양 - 자연스럽고 부드러운 표현 사용
- 제목은 절대 포함하지 말고 내용만 작성

## 출력 형식 (제목 없이 내용만):
[1]
감각 기능 자극, 소근육 발달, 집중력 향상 등

[2]
색칠 도안과 크레용을 제공하고, 직원이 개별로 도와드리며 단계별로 진행함

[3]
외부강사프로그램 참여 시 여러 가지 대칭 막대기를 활용하여 그림과 숫자를 만들며 활동에 참여함. 제시된 도구를 이용해 모양을 만들고 배열을 조정하는 모습이 관찰됨

[4]
프로그램 진행 중 활동 방법을 안내하니 대칭 막대기를 선택하여 배치하는 모습을 확인함. 활동 시간 동안 큰 어려움 없이 참여하였으며, 필요할 때 간단히 말로 안내하며 프로그램을 잘 마무리할 수 있도록 도움드림

위 예시처럼 [1], [2], [3], [4] 뒤에 바로 내용만 작성하세요.`;

        const result = await callGeminiAPI(prompt);

        // Parse results
        const sections = result.split(/\[(\d+)\]/);

        if (sections[2]) document.getElementById('program-need').value = sections[2].trim();
        if (sections[4]) document.getElementById('program-method').value = sections[4].trim();
        if (sections[6]) document.getElementById('program-reaction').value = sections[6].trim();
        if (sections[8]) document.getElementById('program-monitoring').value = sections[8].trim();

        // 다음 단계 버튼 활성화
        document.getElementById('step2-next').disabled = false;

        hideLoadingOverlay();
        alert('✓ 프로그램 내용이 생성되었습니다!');

    } catch (error) {
        hideLoadingOverlay();
        alert('생성 중 오류가 발생했습니다: ' + error.message);
    }
}

// 향후 계획 생성
async function generateFuturePlan() {
    const needsContent = document.getElementById('program-need').value.trim();
    const methodContent = document.getElementById('program-method').value.trim();
    const reactionContent = document.getElementById('program-reaction').value.trim();
    const monitoringContent = document.getElementById('program-monitoring').value.trim();

    // Step 1의 심신상태 필드들 가져오기
    let mentalStateContent = '';
    for (let i = 1; i <= 10; i++) {
        const field = document.getElementById(`field-${i}`);
        if (field && field.value.trim()) {
            mentalStateContent += field.value.trim() + ' ';
        }
    }

    if (!needsContent || !methodContent) {
        alert('먼저 필요내용과 제공방법을 작성해주세요.');
        return;
    }

    showLoadingOverlay('향후 계획 및 기타사항을 생성하고 있습니다...');

    try {
        const prompt = `${SYSTEM_PROMPT}

# 작성 요청: 향후 계획 및 기타사항

## 심신상태 정보:
${mentalStateContent}

## 프로그램 제공 정보:
필요내용: ${needsContent}
제공방법: ${methodContent}
어르신 반응 및 특이사항: ${reactionContent}
요양쌤 모니터링: ${monitoringContent}

위 내용을 바탕으로 아래 3개 항목을 작성해주세요.

## 작성 항목:
1. 종합 (150자 내외) - 심신상태 변화와 프로그램 참여도를 바탕으로 금일 어르신의 전반적인 상태를 종합적으로 요약
2. 급여제공 관련 유의사항 (150자 내외) - 낙상 위험, 식사 시 연하 곤란 등 어르신의 안전과 건강을 위해 급여 제공 시 특별히 유의해야 할 사항
3. 급여제공 관련 세부계획 (100자 내외) - 확인된 욕구 및 유의사항을 반영하여 차주 또는 향후 제공할 구체적인 서비스 계획

## 중요 지침:
- 자연스러운 일상어 사용 필수:
  ❌ "과업", "과제", "수행", "지속", "완수", "보조", "지원"
  ✅ "프로그램", "활동", "진행", "계속", "마무리", "도움드림", "도와드림"
- "수급자" 대신 "어르신" 사용 필수
- 공문서 어투 지양 - 자연스럽고 부드러운 표현 사용
- 제목은 절대 포함하지 말고 내용만 작성

## 출력 형식 (제목 없이 내용만):
[1]
금일 식사량 및 영양 섭취는 양호한 편이며, 보행 시 도움 없이 안정적으로 이동함. 프로그램 참여도는 높은 편이나 오후 시간대 다소 피로감을 보임. 전반적으로 안정적인 상태 유지 중임

[2]
보행 시 낙상 위험이 있어 이동 구간 정리 및 미끄럼 방지 조치 필요함. 식사 시 천천히 드시도록 안내하고, 오후 시간대 충분한 휴식을 드릴 필요가 있음

[3]
신체활동 프로그램을 계속 진행하며, 어르신의 흥미와 능력에 맞춰 활동 난이도를 조정할 예정임. 오후 피로도를 고려하여 휴식 시간을 더 드릴 계획임

위 예시처럼 [1], [2], [3] 뒤에 바로 내용만 작성하세요.`;

        const result = await callGeminiAPI(prompt);

        // Parse results
        const sections = result.split(/\[(\d+)\]/);

        if (sections[2]) document.getElementById('future-summary').value = sections[2].trim();
        if (sections[4]) document.getElementById('future-caution').value = sections[4].trim();
        if (sections[6]) document.getElementById('future-plan').value = sections[6].trim();

        hideLoadingOverlay();
        alert('✓ 향후 계획 및 기타사항이 생성되었습니다!');

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

// 감정 표현 형식 생성
function formatEmotionExpressions(emotionDict, maxItemsPerCategory = 10) {
    if (!emotionDict) return "";

    const result = [];
    for (const [category, expressions] of Object.entries(emotionDict)) {
        if (Array.isArray(expressions) && expressions.length > 0) {
            const items = expressions.slice(0, maxItemsPerCategory);
            const itemsStr = items.map(item => `"${item}"`).join(', ');
            result.push(`- ${category}: ${itemsStr}`);
        }
    }

    return result.join('\n');
}

// 감정 분포 계산
function calculateEmotionDistribution(count) {
    const positive = parseInt(document.getElementById('positive-ratio').value);
    const neutral = parseInt(document.getElementById('neutral-ratio').value);
    const negative = parseInt(document.getElementById('negative-ratio').value);

    const totalRatio = positive + neutral + negative;

    if (totalRatio !== 100) {
        // Use default ratios if sum is not 100
        return {
            positive: Math.round(count * 0.5),
            neutral: Math.round(count * 0.3),
            negative: Math.round(count * 0.2)
        };
    }

    const positiveCount = Math.round(count * positive / 100);
    const neutralCount = Math.round(count * neutral / 100);
    const negativeCount = count - positiveCount - neutralCount;

    return { positive: positiveCount, neutral: neutralCount, negative: negativeCount };
}

// 프로그램 예시 반응 가져오기
function getExampleReactions(programTitle, maxCount = 30) {
    // Get example reactions from program data
    // programPatterns는 program-data.js에서 로드됨
    if (typeof programPatterns === 'undefined' || !programPatterns || !programPatterns[programTitle]) {
        return [];
    }

    const reactions = [];
    for (const row of programPatterns[programTitle]) {
        if (row['참여'] === 'O') {
            const reaction = row['반응 및 특이사항(미참여사유)'];
            if (reaction && reaction.trim()) {
                reactions.push(reaction.trim());
                if (reactions.length >= maxCount) break;
            }
        }
    }

    return reactions;
}

// 고급 프롬프트 생성
function buildAdvancedPrompt(programTitle, programDesc, count, isExisting = false) {
    const distribution = calculateEmotionDistribution(count);

    // Get example reactions if this is an existing program
    let examplesSection = '';
    if (isExisting) {
        const examples = getExampleReactions(programTitle);
        if (examples.length > 0) {
            const examplesText = examples.map((ex, i) => `${i+1}. ${ex}`).join('\n');
            examplesSection = `\n# 실제 참여자 반응 예시\n${examplesText}\n\n위 예시들의 스타일을 참고하여 비슷한 톤과 구체성으로 작성하세요.\n`;
        }
    }

    let positiveEmotionsText = "";
    let neutralEmotionsText = "";
    let negativeEmotionsText = "";
    let cognitiveText = "";
    let physicalText = "";
    let socialText = "";
    let programBehaviorsText = "";
    let timeFlowText = "";

    // Extract expressions from emotion guide
    if (typeof EMOTION_GUIDE !== 'undefined' && EMOTION_GUIDE) {
        if (EMOTION_GUIDE.긍정적_감정) {
            positiveEmotionsText = formatEmotionExpressions(EMOTION_GUIDE.긍정적_감정, 4);
        }

        if (EMOTION_GUIDE.중립적_감정) {
            neutralEmotionsText = formatEmotionExpressions(EMOTION_GUIDE.중립적_감정, 4);
        }

        if (EMOTION_GUIDE.소극적_피로_감정) {
            negativeEmotionsText = formatEmotionExpressions(EMOTION_GUIDE.소극적_피로_감정, 4);
        }

        if (EMOTION_GUIDE.인지_수준별_표현) {
            const cognitiveData = EMOTION_GUIDE.인지_수준별_표현;
            const cognitiveParts = [];
            for (const [level, data] of Object.entries(cognitiveData)) {
                if (data && data.표현) {
                    const ratio = data.비율 ? ` (${Math.round(data.비율 * 100)}%)` : "";
                    const items = data.표현.slice(0, 3).map(item => `"${item}"`).join(', ');
                    cognitiveParts.push(`- ${level}${ratio}: ${items}`);
                }
            }
            cognitiveText = cognitiveParts.join('\n');
        }

        if (EMOTION_GUIDE.신체_능력별_표현) {
            const physicalData = EMOTION_GUIDE.신체_능력별_표현;
            const physicalParts = [];
            for (const [level, data] of Object.entries(physicalData)) {
                if (data && data.표현) {
                    const ratio = data.비율 ? ` (${Math.round(data.비율 * 100)}%)` : "";
                    const items = data.표현.slice(0, 3).map(item => `"${item}"`).join(', ');
                    physicalParts.push(`- ${level}${ratio}: ${items}`);
                }
            }
            physicalText = physicalParts.join('\n');
        }

        if (EMOTION_GUIDE.사회성_표현) {
            const socialData = EMOTION_GUIDE.사회성_표현;
            const socialParts = [];
            for (const [level, data] of Object.entries(socialData)) {
                if (data && data.표현) {
                    const ratio = data.비율 ? ` (${Math.round(data.비율 * 100)}%)` : "";
                    const items = data.표현.slice(0, 3).map(item => `"${item}"`).join(', ');
                    socialParts.push(`- ${level}${ratio}: ${items}`);
                }
            }
            socialText = socialParts.join('\n');
        }

        if (EMOTION_GUIDE.프로그램_특성별_행동) {
            programBehaviorsText = formatEmotionExpressions(EMOTION_GUIDE.프로그램_특성별_행동, 3);
        }

        if (EMOTION_GUIDE.시간_흐름_표현) {
            timeFlowText = EMOTION_GUIDE.시간_흐름_표현.slice(0, 4).map(expr => `- "${expr}"`).join('\n');
        }
    }

    // Fallbacks if emotion guide is not available
    if (!positiveEmotionsText) {
        positiveEmotionsText = `- 즐거움: "즐거워하심", "웃으시며", "기쁜 표정으로", "밝은 미소 지으심", "환하게 웃으심"
- 만족감: "만족스러워하심", "뿌듯해하심", "흡족한 표정으로", "성취감을 느끼심"
- 흥미/호기심: "흥미롭게 보심", "호기심 가지심", "신기해하심", "관심 보이심"
- 열정: "적극적으로", "열심히", "집중하여", "몰입하심"`;
    }

    if (!neutralEmotionsText) {
        neutralEmotionsText = `- 집중: "조용히 집중하심", "묵묵히 임하심", "차분하게 참여하심", "꾸준히 하심"
- 관찰: "지켜보시며", "주의 깊게 살피심", "관심 있게 보심"
- 적응: "점차 익숙해지심", "천천히 따라하심", "자신의 속도로 하심"`;
    }

    if (!negativeEmotionsText) {
        negativeEmotionsText = `- 조심스러움: "망설이시다가", "처음엔 주저하셨으나", "소극적이시다가"
- 피로: "다소 피곤해하심", "중간에 휴식 취하심", "짧게 참여하심"
- 제한적 참여: "일부만 참여하심", "관람만 하심", "보조 받아 참여하심"`;
    }

    if (!cognitiveText) {
        cognitiveText = `- 높음 (30%): "정확히 이해하시고 능숙하게 하심", "스스로 방법을 찾아 진행하심", "이전 활동을 기억하시며 참여하심"
- 보통 (50%): "설명 듣고 잘 따라하심", "도움받아 완성하심", "요양쌤과 함께 진행하심"
- 낮음 (20%): "간단한 활동만 참여하심", "지켜보시며 즐거워하심", "부분적으로 참여하심"`;
    }

    if (!physicalText) {
        physicalText = `- 활동적 (40%): "적극적으로 움직이심", "빠르게 완성하심", "활발히 참여하심"
- 보통 (40%): "천천히 조심스럽게 하심", "자신의 페이스로 진행하심", "안정적으로 참여하심"
- 제한적 (20%): "손동작만 참여하심", "앉아서 할 수 있는 부분만 하심", "보조 도구 사용하여 참여하심"`;
    }

    if (!socialText) {
        socialText = `- 사교적 (40%): "다른 어르신들과 즐겁게 대화하시며 참여하심", "옆 어르신을 도우시며 함께하심"
- 보통 (40%): "가끔 옆 어르신과 이야기 나누심", "조용히 개별적으로 참여하심"
- 내향적 (20%): "혼자 조용히 집중하심", "묵묵히 자신의 활동에만 몰두하심"`;
    }

    if (!programBehaviorsText) {
        programBehaviorsText = `- 신체_활동: "스트레칭하시며", "박수 치심", "율동 따라하심", "걸으시며"
- 인지_활동: "문제 풀어보시며", "기억하시며", "답 맞히시고 기뻐하심", "생각하는 표정"
- 미술_만들기: "색칠하시며", "오리시며", "붙이시며", "완성작 보시고 만족하심"
- 음악: "노래 부르심", "박자 맞추심", "따라 부르심", "손뼉 치시며"
- 게임: "승부욕 보이심", "이기시고 즐거워하심", "열심히 도전하심"`;
    }

    if (!timeFlowText) {
        timeFlowText = `- "초반엔 망설이시다가 점차 자신감 있게 참여하심"
- "처음엔 어려워하셨으나 익숙해지시며 즐거워하심"
- "중반부터 피곤해하시며 속도 늦추심"
- "끝까지 집중력 유지하며 완성하심"
- "마지막에 다소 지치셨으나 만족스러워하심"`;
    }

    return `당신은 요양원 프로그램 운영 기록 작성 전문가입니다.

# ${isExisting ? '기존' : '신규'} 프로그램 정보
프로그램명: "${programTitle}"

${isExisting ? '' : `프로그램 설명:\n${programDesc}\n`}${examplesSection}
# 생성 목표
위 프로그램의 특성을 깊이 이해하고, 어르신들의 현실적이고 다양한 반응을 생성하세요.${isExisting && examplesSection ? '\n실제 참여자 반응 예시들의 스타일, 톤, 구체성을 참고하되, 중복되지 않게 새로운 표현으로 작성하세요.' : ''}

# 감정 분포 (고정)
반응은 총 ${count}개 생성하되, 아래 개수를 반드시 정확히 지키세요.
- 긍정: ${distribution.positive}개
- 중립: ${distribution.neutral}개
- 소극/피로: ${distribution.negative}개

# 감정 표현 가이드

**긍정적 감정:**
${positiveEmotionsText}

**중립적 감정:**
${neutralEmotionsText}

**소극적/피로 표현:**
${negativeEmotionsText}

# 개인별 특성 반영 패턴
어르신의 다양한 특성을 자연스럽게 반영하세요:

**인지 수준별:**
${cognitiveText}

**신체 능력별:**
${physicalText}

**사회성별:**
${socialText}

# 프로그램 특성별 구체적 행동 표현
${programBehaviorsText}

# 시간 흐름 및 변화 표현
프로그램 진행에 따른 자연스러운 변화:
${timeFlowText}

# 실제 관찰 느낌의 표현
추상적 표현보다 구체적 관찰:
- ❌ "좋아하심" → ✅ "박수 치시며 '좋다'고 말씀하심"
- ❌ "열심히 함" → ✅ "땀 흘리시며 끝까지 집중하심"
- ❌ "즐거워함" → ✅ "환하게 웃으시며 다른 어르신과 이야기 나누심"
- ❌ "어려워함" → ✅ "고개 갸우뚱하시며 요양쌤에게 도움 요청하심"

# 출력 형식 (필수)
아래 3개 섹션으로 나누어 출력하세요. 각 섹션에는 해당 개수만큼만 숫자 리스트로 작성하세요.

[긍정]
1. ...
2. ...
(총 ${distribution.positive}개)

[중립]
1. ...
2. ...
(총 ${distribution.neutral}개)

[소극/피로]
1. ...
2. ...
(총 ${distribution.negative}개)

# 작성 규칙
1. 존댓말 "~하심" 형태로 작성
2. **각 반응은 30자 이상 작성 (구체적 상황, 세부 동작, 표정 변화, 말씀 등 포함)**
3. 자연스럽고 실제 관찰한 듯한 표현 - 생동감과 현장감 최대화
4. 다양한 인지수준, 신체능력, 사회성이 골고루 분포
5. 프로그램 특성이 반영된 구체적 행동 (도구 사용, 재료 다루기, 신체 움직임 등)
6. 중복 표현 최소화 - 각 반응이 독특하고 차별화되게
7. **풍부한 디테일**: 어르신의 구체적 말씀, 표정 변화, 손동작, 다른 어르신과의 대화/상호작용
8. **감정 표현 다양화**: 같은 긍정이라도 "기쁨/흥미/만족/자랑스러움" 등 세분화
9. 섹션 제목([긍정], [중립], [소극/피로])은 반드시 포함
10. 섹션별 개수 불일치 시, 스스로 수정해서 맞춘 뒤 최종 출력
11. 다른 설명/서문 금지`;
}

// 감정 섹션 파싱
function parseEmotionSections(generatedText) {
    let positive = "";
    let neutral = "";
    let negative = "";

    try {
        const lines = generatedText.trim().split('\n');
        let currentSection = null;

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            // Detect section headers
            if (trimmedLine.includes('[긍정]') || (trimmedLine.includes('긍정') && trimmedLine.startsWith('['))) {
                currentSection = 'positive';
                continue;
            } else if (trimmedLine.includes('[중립]') || (trimmedLine.includes('중립') && trimmedLine.startsWith('['))) {
                currentSection = 'neutral';
                continue;
            } else if (trimmedLine.includes('[소극/피로]') || trimmedLine.includes('[소극') || (trimmedLine.includes('소극') && trimmedLine.startsWith('['))) {
                currentSection = 'negative';
                continue;
            }

            // Add content to current section
            if (currentSection === 'positive') {
                positive += trimmedLine + '\n';
            } else if (currentSection === 'neutral') {
                neutral += trimmedLine + '\n';
            } else if (currentSection === 'negative') {
                negative += trimmedLine + '\n';
            }
        }
    } catch (error) {
        // If parsing fails, put all text in positive
        positive = generatedText;
    }

    return {
        positive: positive.trim(),
        neutral: neutral.trim(),
        negative: negative.trim()
    };
}

// 프로그램 반응 생성
async function generateProgramReactions() {
    // Validate inputs
    if (!apiKey) {
        alert('API 키가 설정되지 않았습니다. 설정 페이지에서 API 키를 먼저 입력해주세요.');
        showPage('settings');
        return;
    }

    const count = parseInt(document.getElementById('reaction-count').value);
    if (count < 1 || count > 50) {
        alert('생성 개수는 1~50 사이로 입력해주세요.');
        return;
    }

    // Check ratio sum
    const positive = parseInt(document.getElementById('positive-ratio').value);
    const neutral = parseInt(document.getElementById('neutral-ratio').value);
    const negative = parseInt(document.getElementById('negative-ratio').value);
    const sum = positive + neutral + negative;

    if (sum !== 100) {
        alert('감정 비율의 합계가 100%가 되어야 합니다. 현재 합계: ' + sum + '%');
        return;
    }

    // Check program mode
    const mode = document.querySelector('input[name="program-mode"]:checked').value;
    const isExisting = mode === 'existing';
    let programTitle = '';
    let programDesc = '';

    if (isExisting) {
        const selectElement = document.getElementById('existing-program-select');
        if (!selectElement.value) {
            alert('프로그램을 선택해주세요.');
            return;
        }
        programTitle = selectElement.value;
        programDesc = ''; // Not needed for existing programs
    } else {
        programTitle = document.getElementById('new-program-title').value.trim();
        programDesc = document.getElementById('new-program-desc').value.trim();

        if (!programTitle) {
            alert('프로그램 제목을 입력해주세요.');
            return;
        }

        if (!programDesc) {
            alert('프로그램 설명을 입력해주세요.');
            return;
        }
    }

    // Build prompt
    const prompt = buildAdvancedPrompt(programTitle, programDesc, count, isExisting);

    // Show loading
    showLoadingOverlay('AI가 프로그램 반응을 생성하고 있습니다...');

    try {
        const result = await callGeminiAPI(prompt);

        // Parse sections
        const sections = parseEmotionSections(result);

        // Display results
        document.getElementById('positive-reactions').value = sections.positive;
        document.getElementById('neutral-reactions').value = sections.neutral;
        document.getElementById('negative-reactions').value = sections.negative;

    } catch (error) {
        alert('생성 중 오류가 발생했습니다: ' + error.message);
    } finally {
        hideLoadingOverlay();
    }
}

// 모든 반응 복사
function copyAllReactions() {
    const positive = document.getElementById('positive-reactions').value.trim();
    const neutral = document.getElementById('neutral-reactions').value.trim();
    const negative = document.getElementById('negative-reactions').value.trim();

    let fullText = "";
    if (positive) {
        fullText += "[긍정]\n" + positive + "\n\n";
    }
    if (neutral) {
        fullText += "[중립]\n" + neutral + "\n\n";
    }
    if (negative) {
        fullText += "[소극/피로]\n" + negative;
    }

    if (fullText.trim()) {
        navigator.clipboard.writeText(fullText.trim()).then(() => {
            alert('전체 내용이 클립보드에 복사되었습니다!');
        }).catch(() => {
            alert('복사 중 오류가 발생했습니다.');
        });
    } else {
        alert('복사할 내용이 없습니다.');
    }
}

// 프로그램 모드 토글 (기존 프로그램 / 신규 프로그램)
function toggleProgramMode() {
    const mode = document.querySelector('input[name="program-mode"]:checked').value;
    const existingSection = document.getElementById('existing-program-section');
    const newSection = document.getElementById('new-program-section');

    if (mode === 'existing') {
        existingSection.classList.remove('hidden');
        newSection.classList.add('hidden');

        // Populate program list if not already done
        const selectElement = document.getElementById('existing-program-select');
        if (selectElement.options.length === 0) {
            populateProgramList();
        }
    } else {
        existingSection.classList.add('hidden');
        newSection.classList.remove('hidden');
        // Hide selected program display when switching to new program mode
        document.getElementById('selected-program-display').classList.add('hidden');
    }
}

// 프로그램 목록 변수
let PROGRAM_LIST = [];
let filteredPrograms = [];

function populateProgramList() {
    const selectElement = document.getElementById('existing-program-select');
    selectElement.innerHTML = '';

    // PROGRAM_LIST가 아직 초기화되지 않았으면 초기화
    if (PROGRAM_LIST.length === 0) {
        // programPatterns가 있으면 거기서 키 추출
        if (typeof programPatterns !== 'undefined' && programPatterns) {
            PROGRAM_LIST = Object.keys(programPatterns).sort();
        }
        // 없으면 programNames 사용
        else if (typeof programNames !== 'undefined' && programNames.length > 0) {
            PROGRAM_LIST = [...programNames];
        } else {
            console.warn('프로그램 목록이 로드되지 않았습니다.');
            PROGRAM_LIST = [];
        }

        filteredPrograms = [...PROGRAM_LIST];
    }

    filteredPrograms.forEach(program => {
        const option = document.createElement('option');
        option.value = program;
        option.textContent = program;
        selectElement.appendChild(option);
    });

    updateProgramCount();
}

// 프로그램 필터링
function filterPrograms() {
    const searchText = document.getElementById('program-search').value.toLowerCase();

    if (!searchText) {
        filteredPrograms = [...PROGRAM_LIST];
    } else {
        filteredPrograms = PROGRAM_LIST.filter(program =>
            program.toLowerCase().includes(searchText)
        );
    }

    populateProgramList();
}

// 프로그램 개수 업데이트
function updateProgramCount() {
    const countElement = document.getElementById('program-list-count');
    if (countElement) {
        countElement.textContent = `${filteredPrograms.length}개 프로그램`;
    }
}

// 선택된 프로그램 표시 업데이트
function updateSelectedProgramDisplay() {
    const selectElement = document.getElementById('existing-program-select');
    const displayBox = document.getElementById('selected-program-display');
    const nameSpan = document.getElementById('selected-program-name');

    if (selectElement.selectedIndex >= 0 && selectElement.value) {
        const selectedProgram = selectElement.value;
        nameSpan.textContent = selectedProgram;
        displayBox.classList.remove('hidden');
    } else {
        displayBox.classList.add('hidden');
    }
}
