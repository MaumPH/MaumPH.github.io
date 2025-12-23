/**
 * api.js
 * Gemini API 호출 관련 함수
 * - callGeminiAPI: API 호출 및 응답 처리
 * - callGeminiAPIWithImage: 이미지 포함 API 호출
 * - callGeminiAPIWithImages: 여러 이미지 포함 API 호출
 */

// Gemini API 호출 함수
async function callGeminiAPI(prompt) {
    if (!apiKey) {
        alert('API 키를 먼저 설정해주세요.');
        showPage('settings');
        return null;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API 호출 실패: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // Increment usage count
    usageCount++;
    localStorage.setItem('usage_count', usageCount.toString());
    document.getElementById('usage-count').textContent = usageCount;

    return data.candidates[0].content.parts[0].text;
}

// 이미지 포함 Gemini API 호출 함수
async function callGeminiAPIWithImage(prompt, imageData) {
    if (!apiKey) {
        alert('API 키를 먼저 설정해주세요.');
        showPage('settings');
        return null;
    }

    // Remove data URL prefix to get base64 string
    const base64Image = imageData.split(',')[1];

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [
                    {
                        text: prompt
                    },
                    {
                        inline_data: {
                            mime_type: 'image/jpeg',
                            data: base64Image
                        }
                    }
                ]
            }]
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API 호출 실패: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // Increment usage count
    usageCount++;
    localStorage.setItem('usage_count', usageCount.toString());
    document.getElementById('usage-count').textContent = usageCount;

    return data.candidates[0].content.parts[0].text;
}

// 여러 이미지 포함 Gemini API 호출 함수
async function callGeminiAPIWithImages(prompt, imageDataArray) {
    if (!apiKey) {
        alert('API 키를 먼저 설정해주세요.');
        showPage('settings');
        return null;
    }

    // Build parts array with prompt and images
    const parts = [{ text: prompt }];

    for (const imageData of imageDataArray) {
        if (imageData) {
            const base64Image = imageData.split(',')[1];
            parts.push({
                inline_data: {
                    mime_type: 'image/jpeg',
                    data: base64Image
                }
            });
        }
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: parts
            }]
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API 호출 실패: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // Increment usage count
    usageCount++;
    localStorage.setItem('usage_count', usageCount.toString());
    document.getElementById('usage-count').textContent = usageCount;

    return data.candidates[0].content.parts[0].text;
}
