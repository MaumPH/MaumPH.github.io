/**
 * main.js
 * 애플리케이션 초기화 및 전역 이벤트 리스너
 */

// 앱 초기화
window.addEventListener('load', () => {
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

    // 프로그램 모드 초기화
    toggleProgramMode();

    // 서비스 체크박스 설정
    setupServiceCheckboxes();

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
            const preview = document.getElementById(`newsletter-preview-${i + 1}`);
            if (preview) {
                preview.src = e.target.result;
                preview.classList.remove('hidden');
            }
        };

        reader.readAsDataURL(file);
    }

    // Show status
    document.getElementById('newsletter-image-status').innerHTML = `
        <p class="text-sm text-green-800 dark:text-green-200">
            ✓ 3개의 이미지가 업로드되었습니다.
        </p>
    `;
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
            document.getElementById('newsletter-desc-1').value.trim(),
            document.getElementById('newsletter-desc-2').value.trim(),
            document.getElementById('newsletter-desc-3').value.trim()
        ];

        // Generate titles for each image
        let newsletterTitles = [];
        for (let i = 0; i < 3; i++) {
            const prompt = `이 이미지는 주간보호센터의 프로그램 활동 사진입니다.
${descriptions[i] ? `참고 정보: ${descriptions[i]}` : ''}

이 활동의 제목을 10자 이내로 지어주세요.
제목만 출력하세요. 설명이나 추가 문구는 필요 없습니다.`;

            const title = await callGeminiAPIWithImage(prompt, newsletterImages[i]);
            newsletterTitles.push(title.trim());
        }

        // Generate newsletter content
        const contentPrompt = `다음은 주간보호센터의 3가지 프로그램 활동 제목입니다:
1. ${newsletterTitles[0]}${descriptions[0] ? ` - 참고: ${descriptions[0]}` : ''}
2. ${newsletterTitles[1]}${descriptions[1] ? ` - 참고: ${descriptions[1]}` : ''}
3. ${newsletterTitles[2]}${descriptions[2] ? ` - 참고: ${descriptions[2]}` : ''}

위 3가지 프로그램을 소개하는 소식지 내용을 600-800자로 작성해주세요.

작성 요구사항:
- 따뜻하고 친근한 톤
- 각 프로그램의 활동 내용과 참여자 반응 포함
- 자연스럽고 읽기 쉬운 문장
- 마크다운 형식 사용 금지

출력은 본문 내용만 작성해주세요.`;

        newsletterContent = await callGeminiAPI(contentPrompt);

        // Display result
        document.getElementById('newsletter-result-content').textContent = newsletterContent;
        document.getElementById('newsletter-result-section').classList.remove('hidden');

        hideLoadingOverlay();
        alert('✓ 소식지가 생성되었습니다!');

    } catch (error) {
        hideLoadingOverlay();
        alert('소식지 생성 중 오류가 발생했습니다:\\n\\n' + error.message);
    }
}

function copyNewsletterResult() {
    const content = document.getElementById('newsletter-result-content').textContent;

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
