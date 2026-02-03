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
1. 필요내용 - 프로그램이 어르신에게 어떤 도움이 되는지 핵심만 간결하게 작성. 나열 후 "등"으로 마무리하거나, 간단한 목적 문구 추가 가능
2. 제공방법 (50자 이상) - 프로그램을 어떤 방식으로 진행했는지 구체적 방법
3. 어르신 반응 및 특이사항 (100자 이내) - 프로그램 참여 시 어르신의 행동과 반응
4. 요양보호사 모니터링 (100자 이내) - 사회복지사/프로그램관리자 관점에서 요양보호사가 프로그램 제공 시 보인 업무 수행 방식, 어르신 대응, 제공 과정의 적절성에 대한 평가

## 중요 지침:
- 자연스러운 일상어 사용 필수:
  ❌ "과업", "과제", "수행", "지속", "완수", "보조", "지원", "제공", "언어적 안내"
  ✅ "프로그램", "활동", "진행", "계속", "마무리", "도움드림", "도와드림", "설명함", "알려드림"
- 딱딱한 공문서 표현 절대 금지:
  ❌ "언어적 안내를 제공하며" → ✅ "말로 설명해드리며", "알려드리며"
  ❌ "활동을 지원함" → ✅ "활동을 도와드림", "도움드림"
- "수급자" 대신 "어르신" 사용 필수
- 공문서 어투 지양 - 자연스럽고 부드러운 표현 사용
- 제목은 절대 포함하지 말고 내용만 작성

## 출력 형식 (제목 없이 내용만):
[1]
감각기능 자극, 소근육 발달, 집중력 향상 등

또는

지남력, 기억력, 주의집중력 향상 등 인지기능 유지와 향상을 위한 현실인식 훈련을 반복함

[2]
색칠 도안과 크레용을 드리고, 직원이 개별로 도와드리며 단계별로 진행함

[3]
외부강사프로그램 참여 시 여러 가지 대칭 막대기를 활용하여 그림과 숫자를 만들며 활동에 참여함. 제시된 도구를 이용해 모양을 만들고 배열을 조정하는 모습이 관찰됨

[4]
요양보호사는 어르신의 인지 수준을 고려하여 프로그램을 적절히 조정하였으며, 단계별로 친절하게 설명하며 안정적으로 진행함. 어르신의 반응을 수시로 확인하며 맞춤형으로 제공하여 참여도가 높았음

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
요양보호사 모니터링: ${monitoringContent}

위 내용을 바탕으로 아래 3개 항목을 작성해주세요.

## 작성 항목:
1. 종합 (150자 내외) - 심신상태 변화와 프로그램 참여도를 바탕으로 금일 어르신의 전반적인 상태를 종합적으로 요약
2. 급여제공 관련 유의사항 (150자 내외) - 프로그램 진행 시 어르신의 신체기능, 취향, 흥미, 참여 의지 등을 고려하여 적정 서비스 제공을 위해 유의해야 할 사항
3. 급여제공 관련 세부계획 (100자 내외) - 어르신의 신체기능과 흥미, 참여도를 반영하여 향후 프로그램 제공 시 고려할 계획

## 중요 지침:
- 자연스러운 일상어 사용 필수:
  ❌ "과업", "과제", "수행", "지속", "완수", "보조", "지원", "제공", "언어적 안내"
  ✅ "프로그램", "활동", "진행", "계속", "마무리", "도움드림", "도와드림", "설명함", "알려드림"
- 딱딱한 공문서 표현 절대 금지:
  ❌ "언어적 안내를 제공하며" → ✅ "말로 설명해드리며", "알려드리며"
  ❌ "활동을 지원함" → ✅ "활동을 도와드림", "도움드림"
- "수급자" 대신 "어르신" 사용 필수
- 공문서 어투 지양 - 자연스럽고 부드러운 표현 사용
- 제목은 절대 포함하지 말고 내용만 작성

## 출력 형식 (제목 없이 내용만):
[1]
금일 프로그램 참여도는 높은 편이며, 활동 시 집중력이 양호함. 신체 움직임도 무리 없이 진행하였고, 전반적으로 안정적인 상태에서 프로그램에 참여함

[2]
어르신이 세밀한 손동작에 다소 어려움을 보여 활동 난이도 조절이 필요함. 흥미를 보이는 활동 위주로 진행하고, 피로감이 느껴질 때 적절한 휴식을 드리도록 함

[3]
어르신의 흥미와 신체 능력에 맞춰 활동 난이도를 조정하며 진행할 예정임. 참여 의지가 높은 프로그램 위주로 구성하여 지속적인 참여를 유도할 계획임

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
function buildAdvancedPrompt(programTitle, programDesc, count, isExisting = false, previousReactions = null) {
    const distribution = calculateEmotionDistribution(count);

    // 다양성을 위한 랜덤 시드 생성 (타임스탬프 기반)
    const randomSeed = Date.now() % 10000;

    // 이전 생성 결과 분석 및 금지 표현 추출
    let avoidSection = '';
    if (previousReactions) {
        avoidSection = `\n## 🚫 중복 방지 - 이전 생성 결과 (절대 사용 금지)
이전에 생성된 표현들입니다. **아래 표현과 유사한 문장 구조, 단어, 패턴은 절대 사용하지 마세요:**

${previousReactions}

**중요:**
- 위 예시에 나온 단어, 표현, 문장 구조를 절대 반복하지 말 것
- 완전히 다른 어휘, 다른 상황, 다른 시간대, 다른 행동으로 작성할 것
- 예를 들어 이전에 "웃으시며"를 사용했다면 이번엔 "미소 지으시며", "함박웃음 지으시며", "밝은 표정으로" 등 다른 표현 사용
- 이전에 "열심히 참여하심"을 사용했다면 이번엔 "몰입하여 활동하심", "집중하여 진행하심" 등 전혀 다른 구조 사용
\n`;
    }

    // Get example reactions if this is an existing program
    let examplesSection = '';
    if (isExisting) {
        const examples = getExampleReactions(programTitle);
        if (examples.length > 0) {
            const examplesText = examples.map((ex, i) => `${i+1}. ${ex}`).join('\n');
            examplesSection = `\n# 실제 참여자 반응 예시\n${examplesText}\n\n위 예시들의 스타일과 구체성을 참고하되, **절대 중복하지 말고 매번 새로운 표현과 상황으로 작성하세요.**\n`;
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
다양성 시드: ${randomSeed}

${isExisting ? '' : `프로그램 설명:\n${programDesc}\n`}${avoidSection}${examplesSection}
# 생성 목표
위 프로그램의 특성을 깊이 이해하고, **30~40자 이내의 간결한 반응**을 생성하세요.${isExisting && examplesSection ? '\n실제 참여자 반응 예시들의 스타일, 톤, 구체성을 참고하되, 중복되지 않게 새로운 표현으로 작성하세요.' : ''}${previousReactions ? '\n\n**⚠️ 경고: 이전 생성 결과와 유사한 표현을 사용하면 실패입니다. 완전히 새로운 방식으로 작성하세요.**' : ''}

## 🚨 핵심 제약사항 (절대 엄수)
1. **각 반응은 반드시 30~40자 이내** (40자 초과 시 실패로 간주)
2. **단순하고 간결한 문장 구조** (복잡한 표현 금지)
3. **"~하며 ~하시며 ~하심" 같은 긴 구조 절대 금지**
4. **문학적 표현 금지** - 평이하고 직관적인 관찰 기록만

## ⭐ 표현 다양성 원칙 (매우 중요) - 30~40자 엄수
**같은 프로그램이라도 매번 완전히 다른 반응을 생성해야 합니다:**

1. **글자수 엄수**: 각 반응은 반드시 30~40자 이내 (40자 초과 절대 금지)

2. **문장 구조 극단적 다양화**:
   - "~하심" (단순형)
   - "~하며 ~하심" (연결형)
   - "~하고 ~하심" (나열형)
   - "~할 때 ~하심" (시간형)
   - "~보며 ~하심" (관찰형)
   - **"~하며 ~하시며 ~하심" 같은 복잡한 구조 절대 금지**

3. **어휘 다양화**: 같은 의미라도 다른 단어
   - "좋아하심" → "흡족해하심", "만족하심", "뿌듯해하심"

4. **감정 표현 세분화**: "기쁨/만족/흥미/자랑스러움" 등

5. **참여 방식 다각화**: 적극적/소극적/관망/부분참여

6. **관찰 가능한 디테일**: 표정, 손동작, 자세, 시선

**절대 금지 사항:**
- ❌ 40자 초과 장문 (엄격히 단속)
- ❌ "~하며 ~하시며 ~하심" 같은 복잡한 구조
- ❌ "~하시곤", "~하시는 듯", "~하려는 듯" 같은 문학적 표현
- ❌ 같은 패턴 반복
- ❌ 추상적 표현

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

# 실제 관찰 느낌의 표현 (30~40자 엄수)
간결하고 다양한 문장 구조 예시:

**다양한 문장 패턴 활용:**
- "박수 치며 웃으심"
- "집중하여 끝까지 완성하심"
- "밝은 표정으로 고개 끄덕이심"
- "손을 멈추고 고개 갸우뚱하심"
- "완성작 보며 미소 지으심"
- "중간에 쉬시며 어깨 두드림"
- "적극적으로 참여하심"
- "조용히 지켜보심"
- "천천히 따라하심"
- "재료 만지며 호기심 보이심"

**금지 패턴:**
- ❌ "~하시곤 ~하심" (너무 문학적)
- ❌ "~하며 ~하시며 ~하심" (너무 길고 복잡)
- ❌ 60자 이상 장문

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

# 작성 규칙 ⚠️ 반드시 준수
1. 존댓말 "~하심" 형태로 작성
2. **각 반응은 반드시 30~40자 이내로 작성 (40자 초과 절대 금지)**
3. **단순하고 간결한 문장 구조 사용 (복잡한 표현 금지)**
   - ✅ "박수 치며 웃으심"
   - ❌ "박수를 치시곤 환하게 웃음을 터뜨리시며 만족스러워하심"
4. 자연스럽고 실제 관찰한 듯한 표현 - 생동감과 현장감 최대화
5. 다양한 인지수준, 신체능력, 사회성이 골고루 분포
6. 프로그램 특성이 반영된 구체적 행동 (도구 사용, 재료 다루기, 신체 움직임 등)
7. **⭐ 중복 표현 완전 금지 - 각 반응이 독특하고 차별화되게**
   - "~하며 ~하심" 같은 패턴 반복 금지
   - 매번 다른 문장 구조 사용
8. **관찰 가능한 디테일**: 표정 변화, 손동작, 자세, 시선, 참여 태도
9. **감정 표현 다양화**: "기쁨/흥미/만족/자랑스러움/뿌듯함/안도감" 등
10. **⭐ 매번 새로운 조합**: 어휘·문장구조·상황·시간대·참여 방식 모두 다르게
11. 섹션 제목([긍정], [중립], [소극/피로])은 반드시 포함
12. 섹션별 개수 불일치 시, 스스로 수정해서 맞춘 뒤 최종 출력
13. 다른 설명/서문 금지
14. **문학적 표현 금지 - 평이하고 직관적인 관찰 기록으로 작성**`;

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

            // Add content to current section (글자수 표시 제거)
            // "(숫자자)" 형태의 글자수 표시를 제거
            const cleanedLine = trimmedLine.replace(/\s*\(\d+자\)\s*$/g, '').trim();
            if (currentSection === 'positive') {
                positive += cleanedLine + '\n';
            } else if (currentSection === 'neutral') {
                neutral += cleanedLine + '\n';
            } else if (currentSection === 'negative') {
                negative += cleanedLine + '\n';
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

    // 이전 생성 결과 확인 (연속 생성 시 다양성 확보)
    const storageKey = `prev_reactions_${programTitle}`;
    const previousReactions = sessionStorage.getItem(storageKey);

    // Build prompt
    const prompt = buildAdvancedPrompt(programTitle, programDesc, count, isExisting, previousReactions);

    // Show loading
    showLoadingOverlay('AI가 프로그램 반응을 생성하고 있습니다...');

    try {
        // Temperature를 1.5로 높여서 더 창의적이고 다양한 결과 생성
        const result = await callGeminiAPI(prompt, { temperature: 1.5 });

        // Parse sections
        const sections = parseEmotionSections(result);

        // Display results
        document.getElementById('positive-reactions').value = sections.positive;
        document.getElementById('neutral-reactions').value = sections.neutral;
        document.getElementById('negative-reactions').value = sections.negative;

        // 생성 결과를 sessionStorage에 저장 (다음 생성 시 참조)
        const currentReactions = [
            sections.positive.split('\n').slice(0, 3).join('\n'),  // 처음 3개만 저장
            sections.neutral.split('\n').slice(0, 2).join('\n'),
            sections.negative.split('\n').slice(0, 2).join('\n')
        ].join('\n');
        sessionStorage.setItem(storageKey, currentReactions);

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

        // 항상 프로그램 리스트를 채웁니다 (데이터가 로드된 경우)
        populateProgramList();
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
    if (!selectElement) {
        console.error('existing-program-select 요소를 찾을 수 없습니다.');
        return;
    }

    // PROGRAM_LIST가 아직 초기화되지 않았으면 초기화
    if (PROGRAM_LIST.length === 0) {
        // 1순위: PROGRAM_NAMES_LIST (program_names.js에서 로드)
        if (typeof PROGRAM_NAMES_LIST !== 'undefined' && PROGRAM_NAMES_LIST && PROGRAM_NAMES_LIST.length > 0) {
            PROGRAM_LIST = [...PROGRAM_NAMES_LIST];
            console.log(`✓ PROGRAM_NAMES_LIST에서 ${PROGRAM_LIST.length}개 프로그램 로드`);
        }
        // 2순위: programPatterns (program_patterns.js에서 로드)
        else if (typeof programPatterns !== 'undefined' && programPatterns) {
            PROGRAM_LIST = Object.keys(programPatterns).sort();
            console.log(`✓ programPatterns에서 ${PROGRAM_LIST.length}개 프로그램 로드`);
        }
        // 3순위: programNames (program-data.js에서 추출)
        else if (typeof programNames !== 'undefined' && programNames.length > 0) {
            PROGRAM_LIST = [...programNames];
            console.log(`✓ programNames에서 ${PROGRAM_LIST.length}개 프로그램 로드`);
        } else {
            console.warn('⚠️ 프로그램 목록이 로드되지 않았습니다.');
            console.warn('다음 중 하나의 파일이 필요합니다:');
            console.warn('  - js/program_names.js (PROGRAM_NAMES_LIST)');
            console.warn('  - js/program_patterns.js (programPatterns)');
            console.warn('  - program_patterns.json 로드 후 programNames');
            PROGRAM_LIST = [];
        }

        filteredPrograms = [...PROGRAM_LIST];
    }

    // select 요소 초기화
    selectElement.innerHTML = '';

    if (filteredPrograms.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = '프로그램 목록을 불러오는 중...';
        selectElement.appendChild(option);
        console.warn('⚠️ filteredPrograms가 비어있습니다.');
        return;
    }

    // 프로그램 목록 추가
    filteredPrograms.forEach(program => {
        const option = document.createElement('option');
        option.value = program;
        option.textContent = program;
        selectElement.appendChild(option);
    });

    console.log(`✓ ${filteredPrograms.length}개 프로그램을 select에 추가했습니다.`);
    updateProgramCount();
}

// 프로그램 필터링
function filterPrograms() {
    const searchInput = document.getElementById('program-search');
    if (!searchInput) {
        console.error('program-search 요소를 찾을 수 없습니다.');
        return;
    }

    const searchText = searchInput.value.toLowerCase();

    if (!searchText) {
        filteredPrograms = [...PROGRAM_LIST];
    } else {
        filteredPrograms = PROGRAM_LIST.filter(program =>
            program.toLowerCase().includes(searchText)
        );
    }

    console.log(`검색어: "${searchText}", 필터링된 프로그램: ${filteredPrograms.length}개`);

    // select 요소만 업데이트 (PROGRAM_LIST 재초기화 방지)
    const selectElement = document.getElementById('existing-program-select');
    if (!selectElement) return;

    selectElement.innerHTML = '';

    if (filteredPrograms.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = '검색 결과가 없습니다';
        selectElement.appendChild(option);
    } else {
        filteredPrograms.forEach(program => {
            const option = document.createElement('option');
            option.value = program;
            option.textContent = program;
            selectElement.appendChild(option);
        });
    }

    updateProgramCount();
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
