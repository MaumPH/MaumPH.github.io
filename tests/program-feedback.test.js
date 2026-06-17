const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sourcePath = path.join(__dirname, '..', 'js', 'program-feedback.js');
const context = { console, Date, window: {}, SYSTEM_PROMPT: '공통 시스템 프롬프트' };

vm.createContext(context);
for (const file of [
    'prompt-contracts.js',
    'prompt-parsers.js',
    'prompt-policies.js',
    'prompt-builders.js',
    'program-feedback.js'
]) {
    const filePath = path.join(__dirname, '..', 'js', file);
    vm.runInContext(fs.readFileSync(filePath, 'utf8'), context, { filename: filePath });
}
context.PromptKit = context.window.PromptKit;

const prompt = context.buildProgramFeedbackPrompt(
    '홍길동(김영희)',
    '실버체조',
    '2026-06-17',
    '글씨가 작아 보기 어렵다는 의견을 받음',
    '큰 글씨 활동지와 천천히 설명하는 방식으로 반영함'
);

assert.equal(typeof context.resetProgramFeedbackForm, 'function');
assert.match(prompt, /① 수급자\(보호자\) 의견수렴/);
assert.match(prompt, /② 수급자\(보호자\) 의견반영/);
assert.match(prompt, /글씨가 작아 보기 어렵다는 의견을 받음/);
assert.match(prompt, /큰 글씨 활동지와 천천히 설명하는 방식으로 반영함/);
assert.doesNotMatch(prompt, /② 평가 및 차후 반영사항/);

function createElement(value = '') {
    const classes = new Set();

    return {
        value,
        textContent: value,
        focused: false,
        classList: {
            add(className) {
                classes.add(className);
            },
            remove(className) {
                classes.delete(className);
            },
            contains(className) {
                return classes.has(className);
            }
        },
        focus() {
            this.focused = true;
        },
        scrollIntoView() {}
    };
}

const elements = {
    'pf-beneficiary': createElement('홍길동(김영희)'),
    'pf-program-name': createElement('실버체조'),
    'pf-program-date': createElement('2026-06-17'),
    'pf-collected-opinion': createElement('글씨가 작아 보기 어렵다는 의견을 받음'),
    'pf-reflected-opinion': createElement('큰 글씨 활동지로 반영함'),
    'pf-result-section': createElement(),
    'pf-result-content': createElement('생성 결과')
};

context.document = {
    getElementById(id) {
        return elements[id] || null;
    }
};

context.resetProgramFeedbackForm();

assert.equal(elements['pf-beneficiary'].value, '');
assert.equal(elements['pf-program-name'].value, '');
assert.equal(elements['pf-program-date'].value, '');
assert.equal(elements['pf-collected-opinion'].value, '');
assert.equal(elements['pf-reflected-opinion'].value, '');
assert.equal(elements['pf-result-content'].textContent, '');
assert.equal(elements['pf-result-section'].classList.contains('hidden'), true);
assert.equal(elements['pf-beneficiary'].focused, true);

console.log('program-feedback tests passed');
