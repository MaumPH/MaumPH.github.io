const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sourcePath = path.join(__dirname, '..', 'js', 'api.js');
const source = fs.readFileSync(sourcePath, 'utf8');

function createContext(fetchImpl) {
    const requests = [];
    const usageElement = { textContent: '' };
    const alerts = [];
    const shownPages = [];
    const context = {
        console,
        apiKey: 'test-key',
        selectedModel: 'gemini-3.1-flash-lite',
        usageCount: 0,
        alerts,
        shownPages,
        localStorage: {
            values: {},
            setItem(key, value) {
                this.values[key] = value;
            }
        },
        document: {
            getElementById(id) {
                return id === 'usage-count' ? usageElement : null;
            }
        },
        alert(message) {
            alerts.push(message);
        },
        showPage(page) {
            shownPages.push(page);
        },
        fetch: async (url, options) => {
            const body = JSON.parse(options.body);
            requests.push({ url, options, body });
            return fetchImpl ? fetchImpl(url, options, body) : {
                ok: true,
                json: async () => ({
                    candidates: [{ content: { parts: [{ text: 'generated text' }] } }]
                })
            };
        }
    };

    vm.createContext(context);
    vm.runInContext(source, context, { filename: sourcePath });

    return { context, requests, usageElement };
}

(async () => {
    {
        const { context, requests, usageElement } = createContext();
        const schema = {
            type: 'object',
            properties: {
                summary: { type: 'string' }
            },
            required: ['summary']
        };

        const result = await context.callGeminiAPI('구조화 출력 테스트', {
            generationConfig: {
                temperature: 0.2,
                topK: 20,
                topP: 0.9
            },
            responseFormat: {
                text: {
                    mimeType: 'application/json',
                    schema
                }
            }
        });

        assert.equal(result, 'generated text');
        assert.equal(requests.length, 1);
        assert.match(requests[0].url, /gemini-3\.1-flash-lite:generateContent\?key=test-key/);
        assert.deepEqual(requests[0].body.contents, [{ parts: [{ text: '구조화 출력 테스트' }] }]);
        assert.deepEqual(requests[0].body.generationConfig, {
            temperature: 0.2,
            topK: 20,
            topP: 0.9,
            responseFormat: {
                text: {
                    mimeType: 'application/json',
                    schema
                }
            }
        });
        assert.equal(context.usageCount, 1);
        assert.equal(context.localStorage.values.usage_count, '1');
        assert.equal(usageElement.textContent, 1);
    }

    {
        const { context, requests } = createContext();
        await context.callGeminiAPIWithImage('이미지 설명', 'data:image/png;base64,QUJD');

        assert.equal(requests.length, 1);
        assert.deepEqual(requests[0].body.contents[0].parts, [
            { text: '이미지 설명' },
            {
                inline_data: {
                    mime_type: 'image/png',
                    data: 'QUJD'
                }
            }
        ]);
    }

    {
        const { context, requests } = createContext();
        await context.callGeminiAPIWithImages('여러 이미지 설명', [
            'data:image/jpeg;base64,QUJD',
            null,
            'data:image/webp;base64,REVG'
        ]);

        assert.equal(requests.length, 1);
        assert.deepEqual(requests[0].body.contents[0].parts, [
            { text: '여러 이미지 설명' },
            {
                inline_data: {
                    mime_type: 'image/jpeg',
                    data: 'QUJD'
                }
            },
            {
                inline_data: {
                    mime_type: 'image/webp',
                    data: 'REVG'
                }
            }
        ]);
    }

    {
        const { context } = createContext(async () => ({
            ok: false,
            statusText: 'Too Many Requests',
            json: async () => ({ error: { message: 'quota exceeded' } })
        }));

        await assert.rejects(
            () => context.callGeminiAPI('실패 테스트'),
            /quota exceeded/
        );
        assert.equal(context.usageCount, 0);
    }

    {
        const { context, requests } = createContext();
        context.apiKey = '';

        const result = await context.callGeminiAPI('키 없음');

        assert.equal(result, null);
        assert.equal(requests.length, 0);
        assert.deepEqual(context.alerts, ['API 키를 먼저 설정해주세요.']);
        assert.deepEqual(context.shownPages, ['settings']);
    }

    console.log('api-client tests passed');
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
