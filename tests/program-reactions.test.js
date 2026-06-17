const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repoRoot = path.join(__dirname, '..');
const context = {
    console,
    window: {},
    Date,
    sessionStorage: {
        getItem() {
            return null;
        },
        setItem() {}
    },
    document: {
        getElementById(id) {
            const values = {
                'positive-ratio': '50',
                'neutral-ratio': '30',
                'negative-ratio': '20'
            };
            return { value: values[id] || '' };
        }
    },
    EMOTION_GUIDE: null,
    programPatterns: {
        '실버체조': [
            { 참여: 'O', '반응 및 특이사항(미참여사유)': '박수 치며 환하게 웃으심' },
            { 참여: 'X', '반응 및 특이사항(미참여사유)': '결석' },
            { 참여: 'O', '반응 및 특이사항(미참여사유)': '천천히 동작을 따라하심' }
        ]
    },
    PromptKit: null
};

vm.createContext(context);
for (const file of [
    'js/prompt-contracts.js',
    'js/prompt-parsers.js',
    'js/prompt-policies.js',
    'js/prompt-builders.js',
    'js/monitoring.js'
]) {
    vm.runInContext(fs.readFileSync(path.join(repoRoot, file), 'utf8'), context, { filename: file });
    context.PromptKit = context.window.PromptKit;
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

assert.deepEqual(plain(context.calculateEmotionDistributionFromRatios(1, { positive: 50, neutral: 30, negative: 20 })), {
    positive: 1,
    neutral: 0,
    negative: 0
});
assert.deepEqual(plain(context.calculateEmotionDistributionFromRatios(10, { positive: 50, neutral: 30, negative: 20 })), {
    positive: 5,
    neutral: 3,
    negative: 2
});
assert.deepEqual(plain(context.calculateEmotionDistributionFromRatios(30, { positive: 50, neutral: 30, negative: 20 })), {
    positive: 15,
    neutral: 9,
    negative: 6
});
assert.deepEqual(plain(context.calculateEmotionDistributionFromRatios(50, { positive: 50, neutral: 30, negative: 20 })), {
    positive: 25,
    neutral: 15,
    negative: 10
});

assert.deepEqual(plain(context.dedupeReactionLines([
    '1. 박수 치며 웃으심',
    '박수 치며 웃으심',
    '2. 천천히 따라하심'
])), [
    '박수 치며 웃으심',
    '천천히 따라하심'
]);

const mismatch = context.validateProgramReactionOutput({
    positive: ['박수 치며 웃으심'],
    neutral: ['설명 듣고 따라하심'],
    negative: ['중간에 쉬며 참여하심']
}, {
    positive: 2,
    neutral: 1,
    negative: 1
});
assert.equal(mismatch.ok, false);
assert.match(mismatch.errors.join('\n'), /긍정.*2.*1/);

const overlength = context.validateProgramReactionOutput({
    positive: ['가'.repeat(41)],
    neutral: ['설명 듣고 따라하심'],
    negative: ['중간에 쉬며 참여하심']
}, {
    positive: 1,
    neutral: 1,
    negative: 1
});
assert.equal(overlength.ok, false);
assert.match(overlength.errors.join('\n'), /40자 초과/);

const duplicate = context.validateProgramReactionOutput({
    positive: ['박수 치며 웃으심'],
    neutral: ['1. 박수 치며 웃으심'],
    negative: ['중간에 쉬며 참여하심']
}, {
    positive: 1,
    neutral: 1,
    negative: 1
});
assert.equal(duplicate.ok, false);
assert.match(duplicate.errors.join('\n'), /중복/);

const existingPrompt = context.buildAdvancedPrompt('실버체조', '', 3, true, null);
assert.match(existingPrompt, /박수 치며 환하게 웃으심/);
assert.match(existingPrompt, /"positive"/);
assert.match(existingPrompt, /긍정: 2개/);

const newPrompt = context.buildAdvancedPrompt('풍선 배구', '풍선을 주고받는 활동', 10, false, '이전 반응');
assert.match(newPrompt, /풍선을 주고받는 활동/);
assert.match(newPrompt, /이전 반응/);
assert.match(newPrompt, /긍정: 5개/);
assert.match(newPrompt, /negative/);

const parsed = context.parseEmotionSections(JSON.stringify({
    positive: ['박수 치며 웃으심', '활짝 웃으며 참여하심'],
    neutral: ['설명 듣고 따라하심'],
    negative: ['중간에 쉬며 참여하심']
}), { positive: 2, neutral: 1, negative: 1 });
assert.equal(parsed.ok, true);
assert.match(parsed.data.positive, /1\. 박수 치며 웃으심/);

const parsedMismatch = context.parseEmotionSections(JSON.stringify({
    positive: ['박수 치며 웃으심'],
    neutral: ['설명 듣고 따라하심'],
    negative: ['중간에 쉬며 참여하심']
}), { positive: 2, neutral: 1, negative: 1 });
assert.equal(parsedMismatch.ok, false);
assert.match(parsedMismatch.error, /긍정/);

console.log('program-reactions tests passed');
