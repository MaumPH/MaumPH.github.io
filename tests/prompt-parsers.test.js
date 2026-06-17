const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repoRoot = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, 'tests', 'fixtures', 'prompts', 'manifest.json'), 'utf8'));
const context = { window: {} };

vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(repoRoot, 'js', 'prompt-contracts.js'), 'utf8'), context, {
    filename: 'js/prompt-contracts.js'
});
vm.runInContext(fs.readFileSync(path.join(repoRoot, 'js', 'prompt-parsers.js'), 'utf8'), context, {
    filename: 'js/prompt-parsers.js'
});

const promptKit = context.window.PromptKit;
assert.ok(promptKit);
assert.ok(promptKit.contracts);
assert.ok(promptKit.parsers);

function fixtureFor(feature) {
    return JSON.parse(fs.readFileSync(path.join(repoRoot, 'tests', 'fixtures', 'prompts', feature.fixtures[0]), 'utf8'));
}

function assertFailure(result, label) {
    assert.equal(result.ok, false, `${label} must fail`);
    assert.match(result.error, /누락|형식|JSON|비어|찾을 수|개수/);
}

function withExtraMarkdown(value) {
    if (Array.isArray(value)) {
        return value.map((item, index) => `**${index + 1}. ${item}**`).join('\n');
    }

    return ['```', value, '```'].join('\n');
}

for (const feature of manifest.features) {
    const parser = promptKit.parsers[feature.contract];
    const contract = promptKit.contracts[feature.contract];
    const fixture = fixtureFor(feature);

    assert.equal(typeof parser, 'function', `${feature.contract} parser must exist`);
    assert.equal(typeof contract, 'object', `${feature.contract} contract must exist`);

    const valid = parser(fixture.mockOutput);
    assert.equal(valid.ok, true, `${feature.contract} valid fixture must parse`);
    assert.equal(typeof valid.data, 'object', `${feature.contract} valid parser must return data object`);

    const extraMarkdown = parser(withExtraMarkdown(fixture.mockOutput));
    assert.equal(extraMarkdown.ok, true, `${feature.contract} extra markdown fixture must parse`);

    assertFailure(parser('관련 없는 출력입니다.'), `${feature.contract} missing sections`);
    assertFailure(parser(''), `${feature.contract} empty output`);
    assertFailure(parser('{bad json'), `${feature.contract} malformed output`);
}

const pdfJson = promptKit.parsers.pdfMentalStateAnalysis(JSON.stringify({
    mealNutrition: '식사 양호',
    walking: '보행 안정',
    physicalFunction: '기본 움직임 가능',
    toileting: '배뇨 배변 특이사항 없음',
    hygiene: '위생관리 일부 도움',
    dailyLiving: '일상생활 수행 가능',
    cognition: '간단한 지시 이해',
    behaviorSymptoms: '특이 행동 없음',
    familyEnvironment: '가족 지원 확인',
    overallOpinion: '전반적으로 안정적'
}));
assert.equal(pdfJson.ok, true);
assert.equal(pdfJson.data.cognition, '간단한 지시 이해');

const pdfExtraMarkdown = promptKit.parsers.pdfMentalStateAnalysis([
    '```json',
    JSON.stringify({
        mealNutrition: '식사 양호',
        walking: '보행 안정',
        physicalFunction: '기본 움직임 가능',
        toileting: '배뇨 배변 특이사항 없음',
        hygiene: '위생관리 일부 도움',
        dailyLiving: '일상생활 수행 가능',
        cognition: '간단한 지시 이해',
        behaviorSymptoms: '특이 행동 없음',
        familyEnvironment: '가족 지원 확인',
        overallOpinion: '전반적으로 안정적'
    }),
    '```'
].join('\n'));
assert.equal(pdfExtraMarkdown.ok, true);

const missingPdfJson = promptKit.parsers.pdfMentalStateAnalysis(JSON.stringify({
    mealNutrition: '식사 양호'
}));
assertFailure(missingPdfJson, 'pdf missing JSON fields');

const malformedPdfJson = promptKit.parsers.pdfMentalStateAnalysis('{bad json');
assertFailure(malformedPdfJson, 'pdf malformed JSON');

const reactionsJson = promptKit.parsers.programReactions(JSON.stringify({
    positive: ['박수 치며 웃으심'],
    neutral: ['설명 듣고 따라하심'],
    negative: ['중간에 쉬며 참여하심']
}));
assert.equal(reactionsJson.ok, true);
assert.deepEqual(Array.from(reactionsJson.data.positive), ['박수 치며 웃으심']);

console.log('prompt-parsers tests passed');
