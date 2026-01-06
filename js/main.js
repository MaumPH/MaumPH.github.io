/**
 * main.js
 * 애플리케이션 초기화 및 전역 이벤트 리스너
 */

// 앱 초기화
window.addEventListener('load', async () => {
    // PDF.js worker 설정
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    // API 키 복원
    if (apiKey) {
        document.getElementById('api-key-input').value = apiKey;
    }

    // 사용 횟수 표시
    document.getElementById('usage-count').textContent = usageCount;

    // Drag and drop 설정
    setupDragAndDrop();

    // 서비스 체크박스 설정
    setupServiceCheckboxes();

    // 프로그램 패턴 데이터 로드 (비동기)
    if (typeof loadProgramPatterns === 'function') {
        const loaded = await loadProgramPatterns();
        if (loaded) {
            console.log('✓ 프로그램 패턴 데이터 로드 완료');
            if (typeof setupProgramAutocomplete === 'function') {
                setupProgramAutocomplete();
                console.log('✓ 프로그램 자동완성 설정 완료');
            }
        } else {
            console.warn('⚠️ 프로그램 패턴 데이터 로드 실패');
        }
    }

    // 프로그램 모드 초기화는 페이지 전환 시에만 실행 (showPage에서 처리)
    // 초기 로딩 시에는 불필요

    // 소식지 드래그 앤 드롭 설정
    setupNewsletterDragDrop();

    // API 키 미설정 시 안내
    if (!apiKey) {
        setTimeout(() => {
            if (confirm('API 키가 설정되지 않았습니다. 설정 페이지로 이동하시겠습니까?')) {
                showPage('settings');
            }
        }, 1000);
    }
});

// Newsletter 관련 함수들
async function handleNewsletterImages(input) {
    const files = Array.from(input.files);

    if (files.length !== 3) {
        alert(`정확히 3개의 이미지를 선택해주세요.\\n현재 선택: ${files.length}개`);
        input.value = '';
        return;
    }

    // Convert to base64
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();

        reader.onload = (e) => {
            newsletterImages[i] = e.target.result;
            newsletterImageFiles[i] = file;

            // Show preview
            const preview = document.getElementById(`nl-preview-${i + 1}`);
            const placeholder = document.getElementById(`nl-placeholder-${i + 1}`);
            if (preview && placeholder) {
                preview.src = e.target.result;
                preview.classList.remove('hidden');
                placeholder.classList.add('hidden');
            }
        };

        reader.readAsDataURL(file);
    }

    // Show status
    document.getElementById('newsletter-image-status').innerHTML = `
        <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p class="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                <span class="material-symbols-outlined text-lg">check_circle</span>
                3개의 이미지가 업로드되었습니다.
            </p>
        </div>
    `;
}

// 소식지 드래그 앤 드롭 설정
function setupNewsletterDragDrop() {
    const dropZone = document.getElementById('nl-drop-zone');
    const fileInput = document.getElementById('nl-image-input');

    if (!dropZone || !fileInput) return;

    // 클릭 시 파일 선택
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // 드래그 오버
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('border-primary', 'bg-primary-light');
    });

    // 드래그 나갈 때
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('border-primary', 'bg-primary-light');
    });

    // 드롭
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('border-primary', 'bg-primary-light');

        const files = Array.from(e.dataTransfer.files);

        // 이미지 파일만 필터링
        const imageFiles = files.filter(file => file.type.startsWith('image/'));

        if (imageFiles.length !== 3) {
            alert(`정확히 3개의 이미지를 선택해주세요.\\n현재 선택: ${imageFiles.length}개`);
            return;
        }

        // FileList를 시뮬레이션
        const dataTransfer = new DataTransfer();
        imageFiles.forEach(file => dataTransfer.items.add(file));
        fileInput.files = dataTransfer.files;

        // 핸들러 호출
        handleNewsletterImages(fileInput);
    });
}

async function generateNewsletter() {
    // Validate images
    const validImages = newsletterImages.filter(img => img !== null);
    if (validImages.length !== 3) {
        alert('정확히 3개의 이미지를 업로드해주세요.');
        return;
    }

    if (!apiKey) {
        alert('API 키를 먼저 설정해주세요.');
        showPage('settings');
        return;
    }

    showLoadingOverlay('AI가 이미지를 분석하여 소식지를 생성하고 있습니다...');

    try {
        // Get descriptions
        const descriptions = [
            document.getElementById('nl-desc-1').value.trim(),
            document.getElementById('nl-desc-2').value.trim(),
            document.getElementById('nl-desc-3').value.trim()
        ];

        // Generate titles for each image (병렬 처리로 속도 개선)
        const titlePromises = newsletterImages.map((image, i) => {
            const descInfo = descriptions[i] ? `\n• 사진 ${i+1}: ${descriptions[i]}` : '';
            const prompt = `당신은 주간보호센터 소식지의 활동 제목을 만드는 전문가입니다.
제공된 사진을 보고, **구체적이고 직관적인** 활동 제목을 만들어주세요.${descInfo ? `\n\n**사용자가 제공한 설명:**${descInfo}\n\n이 설명을 참고하되, 이미지를 직접 보고 제목을 만들어주세요.` : ''}

# 제목 작성 핵심 원칙

## 1. 구체성 최우선!
- 사진 속 활동을 **정확히** 표현
- 추상적 표현 금지
- 누가 봐도 무슨 활동인지 바로 알 수 있게

## 2. 제목 유형 (우선순위)

### 최우선: 구체적 활동명
- "대추 다듬기", "카페 나들이", "공원 산책"
- "떡 만들기", "노래 교실", "텃밭 가꾸기"
- "생신 잔치", "영화 감상", "체조 시간"
- "손 마사지", "색칠 공부", "풍선 배구"

### 부가: 장소 + 활동
- "정원에서 식사", "야외 산책", "실내 공예"
- "카페에서 담소", "공원 나들이"

## 3. 길이
- **3-8글자** (적당히 구체적으로)

## 4. 절대 금지
❌ 추상적 감정 표현 ("웃음 꽃", "행복한 시간")
❌ 비유적 표현 ("마당의 꽃", "사랑의 꽃")
❌ 애매모호한 제목 ("즐거운 활동", "좋은 시간")
❌ 9글자 이상의 긴 제목
❌ 2글자 이하의 짧은 제목

**제목만 출력하세요. 설명이나 추가 문구는 필요 없습니다.**`;

            return callGeminiAPIWithImage(prompt, image);
        });

        const newsletterTitles = (await Promise.all(titlePromises)).map(title => title.trim());

        // Generate newsletter content with images
        const descSection = descriptions.some(d => d) ?
            `\n\n**각 활동에 대한 추가 정보:**\n${descriptions.map((desc, i) => desc ? `• ${newsletterTitles[i]}: ${desc}` : '').filter(x => x).join('\n')}` : '';

        const contentPrompt = `당신은 주간보호센터의 소식지를 작성하는 따뜻한 마음을 가진 작가입니다.
제공된 3장의 사진을 보고, 각 활동에 대한 내용을 아래의 **문체 DNA**를 정확히 따라 작성해주세요.${descSection}

# 문체 DNA (반드시 지켜야 할 규칙)

## 1. 어투 및 종결어미
- **해요체 사용 필수**: "~했어요", "~이에요", "~네요", "~예요", "~랍니다"
- 존대 표현: "어르신들이 좋아하셨어요", "함께 즐거운 시간을 보냈습니다"

## 2. 시각적 감정 표현 (매우 중요!)
- **물결표 사용**: 문장 끝에 ~, ~~ 자주 사용
- **이모티콘 사용**: ^^, ♡ 등을 자연스럽게 추가
- **느낌표 사용**: 긍정적 감정 강조 시 !
- 예시: "너무 좋아하셨어요~^^", "즐거운 시간이었습니다~!", "행복했어요~~♡"

## 3. 문장 구조
- 각 활동당 **3-5문장**
- 구조: (1)상황 제시 → (2)활동 내용 → (3)어르신 반응 → (4)긍정적 마무리
- 평균 문장 길이: 30-50자
- 짧고 읽기 쉬운 문장

## 4. 제목 처리 (중요!)
- **제목을 본문에서 반복하지 말 것**
- 제목은 이미 위에 표시되므로, 본문에서 "오늘은 '${newsletterTitles[0]}' 활동을 했어요" 같은 표현 금지
- 바로 활동 내용 묘사 시작

## 5. 어휘 및 표현
- 일상적이고 친근한 어휘만 사용
- 강조 부사: "너무", "정말", "완전" 등
- 어르신들의 말 직접 인용하기: "'재밌어요' 하시면서 웃으셨어요"
- 부정적 표현 절대 사용 금지

## 6. 톤 및 분위기
- 밝고 긍정적인 톤
- 따뜻하고 공동체적인 느낌
- 작은 일상의 행복을 강조
- 어르신들의 미소와 즐거움 중심으로 묘사

## 7. 관찰자 시점
- "우리 어르신들", "함께", "모두" 등 공동체 표현
- 센터 직원의 따뜻한 관찰자 시점
- 어르신들을 존중하며 애정 어린 시선

---

**활동 제목:**
1. ${newsletterTitles[0]}
2. ${newsletterTitles[1]}
3. ${newsletterTitles[2]}

**출력 형식:**

'${newsletterTitles[0]}'

[제목을 반복하지 말고 바로 활동 묘사 시작. 3-5문장. 물결표(~)와 이모티콘(^^) 필수. 해요체 사용. 어르신들의 반응과 표정 중심]

---

'${newsletterTitles[1]}'

[제목을 반복하지 말고 바로 활동 묘사 시작. 3-5문장. 물결표(~)와 이모티콘(^^) 필수. 해요체 사용. 어르신들의 반응과 표정 중심]

---

'${newsletterTitles[2]}'

[제목을 반복하지 말고 바로 활동 묘사 시작. 3-5문장. 물결표(~)와 이모티콘(^^) 필수. 해요체 사용. 어르신들의 반응과 표정 중심]

---

**좋은 예시:**
제목: 대추 다듬기

어르신들이 정성스럽게 대추를 하나하나 손질하셨어요~ '옛날 생각이 나네요' 하시면서 환하게 웃으셨답니다^^ 고사리 같은 손으로 열심히 다듬으시는 모습이 너무 예쁘셨어요~~♡ 모두 함께 이야기꽃을 피우며 행복한 시간 보냈습니다!

**나쁜 예시 (절대 이렇게 쓰지 말 것):**
제목: 대추 다듬기

오늘은 '대추 다듬기' 활동을 했어요~ (← 제목 반복 금지!)

---

이제 제공된 3장의 사진을 보고 위의 **문체 DNA를 정확히 지키며** 소식지를 작성해주세요!`;

        // Generate newsletter content with images
        newsletterContent = await callGeminiAPIWithImages(contentPrompt, newsletterImages);

        // Display result
        document.getElementById('nl-result-content').textContent = newsletterContent;
        document.getElementById('nl-result-section').classList.remove('hidden');

        hideLoadingOverlay();
        alert('✓ 소식지가 생성되었습니다!');

    } catch (error) {
        hideLoadingOverlay();
        alert('소식지 생성 중 오류가 발생했습니다:\\n\\n' + error.message);
    }
}

function copyNewsletterResult() {
    const content = document.getElementById('nl-result-content').textContent;

    if (!content || content.trim() === '') {
        alert('먼저 소식지를 생성해주세요.');
        return;
    }

    navigator.clipboard.writeText(content).then(() => {
        alert('✓ 소식지 내용이 클립보드에 복사되었습니다.');
    }).catch(err => {
        alert('복사 중 오류가 발생했습니다: ' + err);
    });
}
