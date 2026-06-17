const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repoRoot = path.join(__dirname, '..');

function createElement() {
    return {
        textContent: '',
        innerHTML: '',
        className: '',
        children: [],
        classList: {
            remove() {},
            add() {}
        },
        appendChild(child) {
            this.children.push(child);
        },
        scrollIntoView() {}
    };
}

const resultContent = createElement();
const resultSection = createElement();
const context = {
    console,
    window: {},
    document: {
        createElement,
        getElementById(id) {
            if (id === 'pe-result-content') return resultContent;
            if (id === 'pe-result-section') return resultSection;
            return createElement();
        }
    }
};

vm.createContext(context);
for (const file of [
    'js/prompt-contracts.js',
    'js/prompt-parsers.js',
    'js/prompt-policies.js',
    'js/prompt-builders.js',
    'js/program-editor.js'
]) {
    vm.runInContext(fs.readFileSync(path.join(repoRoot, file), 'utf8'), context, { filename: file });
    context.PromptKit = context.window.PromptKit;
}

const maliciousPlan = [
    '## ① 준비물',
    '<img src=x onerror=alert(1)>',
    '',
    '## ② 프로그램 목표',
    '<script>alert(1)</script>',
    '',
    '## ③ 진행과정',
    '<b>굵게</b>',
    '',
    '## ④ 기대효과',
    '<iframe src=bad></iframe>'
].join('\n');

context.displayProgramPlanResult(maliciousPlan);

assert.match(resultContent.textContent, /<img src=x onerror=alert\(1\)>/);
assert.match(resultContent.textContent, /<script>alert\(1\)<\/script>/);
assert.equal(resultContent.innerHTML, '');
assert.equal(resultContent.children.length, 0);

console.log('render-safety tests passed');
