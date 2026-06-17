const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repoRoot = path.join(__dirname, '..');
const context = {
    console,
    window: {}
};

vm.createContext(context);
for (const file of [
    'js/prompt-contracts.js',
    'js/prompt-parsers.js',
    'js/program-feedback.js'
]) {
    vm.runInContext(fs.readFileSync(path.join(repoRoot, file), 'utf8'), context, { filename: file });
}

const classes = new Set(['hidden']);
const resultSection = {
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
    scrolled: false,
    scrollIntoView() {
        this.scrolled = true;
    }
};
const resultContent = { textContent: '' };

context.PromptKit = context.window.PromptKit;
context.document = {
    getElementById(id) {
        if (id === 'pf-result-section') return resultSection;
        if (id === 'pf-result-content') return resultContent;
        return null;
    }
};

context.displayProgramFeedbackResult('관련 없는 출력입니다.');

assert.match(resultContent.textContent, /결과 형식이 올바르지 않습니다/);
assert.match(resultContent.textContent, /필수 섹션 누락/);
assert.equal(resultSection.classList.contains('hidden'), false);
assert.equal(resultSection.scrolled, true);

console.log('prompt-ui-fallback tests passed');
