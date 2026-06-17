const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite';

function getGeminiApiKey() {
    return typeof apiKey === 'string' ? apiKey : '';
}

function getGeminiModel(options = {}) {
    if (options.model) {
        return options.model;
    }

    if (typeof selectedModel === 'string' && selectedModel) {
        return selectedModel;
    }

    return DEFAULT_GEMINI_MODEL;
}

function ensureGeminiApiKey() {
    const key = getGeminiApiKey();
    if (key) {
        return key;
    }

    alert('API 키를 먼저 설정해주세요.');
    showPage('settings');
    return null;
}

function buildGenerationConfig(options = {}) {
    const config = options.generationConfig ? { ...options.generationConfig } : {};

    if (options.temperature !== undefined && config.temperature === undefined) {
        config.temperature = options.temperature;
        if (config.topK === undefined) {
            config.topK = 40;
        }
        if (config.topP === undefined) {
            config.topP = 0.95;
        }
    }

    if (options.responseFormat !== undefined) {
        config.responseFormat = options.responseFormat;
    }

    if (options.responseSchema !== undefined) {
        config.responseFormat = {
            text: {
                mimeType: 'application/json',
                schema: options.responseSchema
            }
        };
    }

    return Object.keys(config).length > 0 ? config : null;
}

function buildGeminiRequestBody(parts, options = {}) {
    const requestBody = {
        contents: [{ parts }]
    };
    const generationConfig = buildGenerationConfig(options);

    if (generationConfig) {
        requestBody.generationConfig = generationConfig;
    }

    return requestBody;
}

function parseImageData(imageData) {
    const match = typeof imageData === 'string'
        ? imageData.match(/^data:([^;]+);base64,(.+)$/)
        : null;

    return {
        inline_data: {
            mime_type: match ? match[1] : 'image/jpeg',
            data: match ? match[2] : imageData
        }
    };
}

async function extractGeminiErrorMessage(response) {
    try {
        const errorData = await response.json();
        return errorData.error?.message || response.statusText || `HTTP ${response.status}`;
    } catch (error) {
        return response.statusText || `HTTP ${response.status}`;
    }
}

function extractGeminiText(data) {
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts
        .map(part => part.text || '')
        .filter(Boolean)
        .join('');

    if (!text) {
        throw new Error('API 응답에서 텍스트를 찾을 수 없습니다.');
    }

    return text;
}

function incrementGeminiUsage() {
    if (typeof usageCount === 'number') {
        usageCount += 1;
    } else {
        usageCount = 1;
    }

    localStorage.setItem('usage_count', usageCount.toString());

    const usageCountElement = document.getElementById('usage-count');
    if (usageCountElement) {
        usageCountElement.textContent = usageCount;
    }
}

async function requestGeminiContent(parts, options = {}) {
    const key = ensureGeminiApiKey();
    if (!key) {
        return null;
    }

    const model = getGeminiModel(options);
    const requestBody = buildGeminiRequestBody(parts, options);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const message = await extractGeminiErrorMessage(response);
        throw new Error(`API 호출 실패: ${message}`);
    }

    const data = await response.json();
    const text = extractGeminiText(data);

    incrementGeminiUsage();

    return text;
}

async function callGeminiAPI(prompt, options = {}) {
    return requestGeminiContent([{ text: prompt }], options);
}

async function callGeminiAPIWithImage(prompt, imageData, options = {}) {
    return requestGeminiContent([
        { text: prompt },
        parseImageData(imageData)
    ], options);
}

async function callGeminiAPIWithImages(prompt, imageDataArray, options = {}) {
    const parts = [{ text: prompt }];

    for (const imageData of imageDataArray) {
        if (imageData) {
            parts.push(parseImageData(imageData));
        }
    }

    return requestGeminiContent(parts, options);
}
