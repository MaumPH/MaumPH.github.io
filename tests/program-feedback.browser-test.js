const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const appUrl = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
const generatedText = [
    '① 수급자(보호자) 의견수렴',
    '2026.06.17  실버체조',
    '수급자(보호자)가 글씨가 작아 보기 어렵다는 의견을 제시하였음.',
    '',
    '② 수급자(보호자) 의견반영',
    '2026.06.17  실버체조',
    '해당 의견을 반영하여 큰 글씨 활동지와 천천히 설명하는 방식으로 프로그램을 진행하였음.'
].join('\n');

function firebaseStub() {
    return `
        window.firebase = window.firebase || {
            apps: [],
            initializeApp(config) {
                this.apps.push({ config });
                return this.apps[0];
            },
            app() {
                return this.apps[0] || this.initializeApp({});
            },
            auth() {
                return {
                    currentUser: { uid: 'qa-user', email: 'qa@example.com', displayName: 'QA User' },
                    onAuthStateChanged(callback) {
                        callback({ uid: 'qa-user', email: 'qa@example.com', displayName: 'QA User' });
                        return function unsubscribe() {};
                    },
                    signOut() {
                        return Promise.resolve();
                    },
                    setPersistence() {
                        return Promise.resolve();
                    }
                };
            },
            firestore() {
                return {
                    collection() {
                        return {
                            doc() {
                                return {
                                    get() {
                                        return Promise.resolve({
                                            exists: true,
                                            data() {
                                                return {
                                                    approved: true,
                                                    role: 'user',
                                                    displayName: 'QA User'
                                                };
                                            }
                                        });
                                    },
                                    set() {
                                        return Promise.resolve();
                                    },
                                    update() {
                                        return Promise.resolve();
                                    }
                                };
                            },
                            where() {
                                return this;
                            },
                            orderBy() {
                                return this;
                            },
                            get() {
                                return Promise.resolve({
                                    forEach() {}
                                });
                            }
                        };
                    },
                    FieldValue: {
                        serverTimestamp() {
                            return new Date();
                        }
                    }
                };
            }
        };
        window.firebase.auth.Auth = { Persistence: { SESSION: 'session' } };
        window.firebase.firestore.FieldValue = {
            serverTimestamp() {
                return new Date();
            }
        };
    `;
}

function browserLaunchOptions() {
    const candidates = [
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    ].filter(Boolean);
    const executablePath = candidates.find((candidate) => fs.existsSync(candidate));

    return executablePath ? { headless: true, executablePath } : { headless: true };
}

(async () => {
    const browser = await chromium.launch(browserLaunchOptions());
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    const pageErrors = [];

    page.on('pageerror', (error) => {
        pageErrors.push(error.message);
    });

    await page.addInitScript(() => {
        localStorage.setItem('gemini_api_keys', JSON.stringify(['test-key']));
        localStorage.setItem('active_api_key_index', '0');
        localStorage.setItem('usage_count', '0');
    });

    await page.route('**/*', async (route) => {
        const url = route.request().url();

        if (url.includes('generativelanguage.googleapis.com')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    candidates: [
                        {
                            content: {
                                parts: [{ text: generatedText }]
                            }
                        }
                    ]
                })
            });
            return;
        }

        if (url.includes('cdn.tailwindcss.com')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: 'window.tailwind = window.tailwind || { config: {} };'
            });
            return;
        }

        if (url.includes('pdf.min.js')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: 'window.pdfjsLib = { GlobalWorkerOptions: {} };'
            });
            return;
        }

        if (url.includes('xlsx.full.min.js')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: 'window.XLSX = {};'
            });
            return;
        }

        if (url.includes('firebasejs')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: firebaseStub()
            });
            return;
        }

        if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
            await route.fulfill({
                status: 200,
                contentType: 'text/css',
                body: ''
            });
            return;
        }

        await route.continue();
    });

    await page.goto(appUrl, { waitUntil: 'domcontentloaded' });
    await page.click('#nav-program-feedback');

    await page.fill('#pf-beneficiary', '홍길동(김영희)');
    await page.fill('#pf-program-name', '실버체조');
    await page.fill('#pf-program-date', '2026-06-17');
    await page.fill('#pf-collected-opinion', '글씨가 작아 보기 어렵다는 의견을 받음');
    await page.fill('#pf-reflected-opinion', '큰 글씨 활동지와 천천히 설명하는 방식으로 반영함');
    await page.click('button:has-text("초기화")');

    assert.equal(await page.inputValue('#pf-beneficiary'), '');
    assert.equal(await page.inputValue('#pf-program-name'), '');
    assert.equal(await page.inputValue('#pf-program-date'), '');
    assert.equal(await page.inputValue('#pf-collected-opinion'), '');
    assert.equal(await page.inputValue('#pf-reflected-opinion'), '');
    assert.equal(await page.locator('#pf-result-section').evaluate((el) => el.classList.contains('hidden')), true);

    await page.fill('#pf-beneficiary', '홍길동(김영희)');
    await page.fill('#pf-program-name', '실버체조');
    await page.fill('#pf-program-date', '2026-06-17');
    await page.fill('#pf-collected-opinion', '글씨가 작아 보기 어렵다는 의견을 받음');
    await page.fill('#pf-reflected-opinion', '큰 글씨 활동지와 천천히 설명하는 방식으로 반영함');
    await page.click('button:has-text("AI로 의견수렴 및 의견반영 작성하기")');

    await page.waitForFunction(() => {
        const section = document.getElementById('pf-result-section');
        const content = document.getElementById('pf-result-content');
        return section && content &&
            !section.classList.contains('hidden') &&
            content.textContent.includes('② 수급자(보호자) 의견반영');
    });

    const resultText = await page.textContent('#pf-result-content');

    assert.match(resultText, /① 수급자\(보호자\) 의견수렴/);
    assert.match(resultText, /② 수급자\(보호자\) 의견반영/);
    assert.match(resultText, /큰 글씨 활동지/);
    assert.deepEqual(pageErrors, []);

    await browser.close();
    console.log('program-feedback browser test passed');
})().catch(async (error) => {
    console.error(error);
    process.exit(1);
});
