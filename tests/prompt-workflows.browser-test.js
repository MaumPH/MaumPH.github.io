const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const appUrl = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;

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
                                                return { approved: true, role: 'user', displayName: 'QA User' };
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
                                return Promise.resolve({ forEach() {} });
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
    page.on('dialog', async (dialog) => {
        await dialog.accept();
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
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: { message: 'mocked failure' } })
            });
            return;
        }

        if (url.endsWith('program_patterns.json')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    '실버체조': [{ 참여: 'O', '반응 및 특이사항(미참여사유)': '박수 치며 웃으심' }]
                })
            });
            return;
        }

        if (url.includes('cdn.tailwindcss.com')) {
            await route.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.tailwind = window.tailwind || { config: {} };' });
            return;
        }

        if (url.includes('pdf.min.js')) {
            await route.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.pdfjsLib = { GlobalWorkerOptions: {} };' });
            return;
        }

        if (url.includes('xlsx.full.min.js')) {
            await route.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.XLSX = {};' });
            return;
        }

        if (url.includes('firebasejs')) {
            await route.fulfill({ status: 200, contentType: 'application/javascript', body: firebaseStub() });
            return;
        }

        if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
            await route.fulfill({ status: 200, contentType: 'text/css', body: '' });
            return;
        }

        await route.continue();
    });

    await page.goto(appUrl, { waitUntil: 'domcontentloaded' });

    const workflows = [
        ['#nav-step2', '#page-step2', 'generateProgramContent'],
        ['#nav-program-log', '#page-program-log', 'generateProgramReactions'],
        ['#nav-program-editor', '#page-program-editor', 'generateProgramPlan'],
        ['#nav-program-feedback', '#page-program-feedback', 'generateProgramFeedback'],
        ['#nav-case-management', '#page-case-management', 'generateCaseManagement'],
        ['#nav-counseling-log', '#page-counseling-log', 'generateCounselingLog'],
        ['#nav-grievance', '#page-grievance', 'generateGrievanceReport']
    ];

    for (const [navSelector, pageSelector, fnName] of workflows) {
        await page.click(navSelector);
        await page.waitForFunction((selector) => {
            const element = document.querySelector(selector);
            return element && element.classList.contains('page-active');
        }, pageSelector);
        assert.equal(await page.evaluate((name) => typeof window[name], fnName), 'function');
    }

    await page.click('#nav-program-log');
    await page.waitForFunction(() => document.querySelector('#page-program-log')?.classList.contains('page-active'));
    await page.waitForFunction(() => document.querySelectorAll('#existing-program-select option').length > 0);
    const countText = await page.textContent('#program-list-count');
    assert.match(countText, /개 프로그램/);

    assert.deepEqual(pageErrors, []);
    await browser.close();
    console.log('prompt-workflows browser test passed');
})().catch(async (error) => {
    console.error(error);
    process.exit(1);
});
