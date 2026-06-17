const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repoRoot = path.join(__dirname, '..');
const context = {
    window: {},
    Date,
    SYSTEM_PROMPT: '공통 시스템 프롬프트'
};

vm.createContext(context);
for (const file of [
    'js/prompt-contracts.js',
    'js/prompt-parsers.js',
    'js/prompt-policies.js',
    'js/prompt-builders.js'
]) {
    vm.runInContext(fs.readFileSync(path.join(repoRoot, file), 'utf8'), context, { filename: file });
}

const promptKit = context.window.PromptKit;
assert.ok(promptKit.policies);
assert.ok(promptKit.builders);
assert.ok(promptKit.contracts);
assert.ok(promptKit.parsers);

for (const policyName of ['factuality', 'careTone', 'plainCareLanguage', 'formatSelfCheck']) {
    assert.equal(typeof promptKit.policies[policyName], 'string');
    assert.notEqual(promptKit.policies[policyName].trim(), '');
}

const counseling = promptKit.builders.counselingLog({
    date: '2026-06-17',
    method: '전화',
    elderName: '김영희',
    guardianRelation: '딸',
    guardianRequest: '식사량 확인 요청',
    centerRequest: '가정 간식 섭취량 확인 안내',
    writingStyle: 'mixed'
});
assert.match(counseling, /김영희/);
assert.match(counseling, /식사량 확인 요청/);
assert.match(counseling, /\[상담일자\]/);
assert.match(counseling, /\[조치내용\]/);

const feedback = promptKit.builders.programFeedback({
    beneficiary: '홍길동(김영희)',
    programName: '실버체조',
    programDate: '2026-06-17',
    collectedOpinion: '글씨가 작아 보기 어렵다는 의견을 받음',
    reflectedOpinion: '큰 글씨 활동지와 천천히 설명하는 방식으로 반영함',
    seed: 123
});
assert.match(feedback, /홍길동\(김영희\)/);
assert.match(feedback, /글씨가 작아 보기 어렵다는 의견을 받음/);
assert.match(feedback, /① 수급자\(보호자\) 의견수렴/);
assert.match(feedback, /② 수급자\(보호자\) 의견반영/);
assert.doesNotMatch(feedback, /② 평가 및 차후 반영사항/);

const caseManagement = promptKit.builders.caseManagement({
    recipientName: '김영희',
    age: '83',
    diagnosis: '치매',
    recentChanges: '최근 식사량 감소',
    year: '2026',
    quarter: '2',
    attendees: '사회복지사, 간호조무사',
    guardianInfo: '딸이 주보호자',
    programParticipation: '미술 활동 참여',
    serviceType: '신체활동지원',
    serviceContent: '식사 관찰',
    reflectionReason: '상태 변화 반영'
});
assert.match(caseManagement, /김영희/);
assert.match(caseManagement, /\[1\]/);
assert.match(caseManagement, /급여제공반영/);

const programPlan = promptKit.builders.programPlan({
    programName: '실버체조',
    programType: '신체기능',
    programContent: '의자에 앉아 상지 스트레칭 진행'
});
assert.match(programPlan, /실버체조/);
assert.match(programPlan, /## ① 준비물/);
assert.match(programPlan, /## ④ 기대효과/);

const journalContent = promptKit.builders.programJournalContent({
    userInput: '색칠 도안으로 계절 그림을 완성함'
});
assert.match(journalContent, /색칠 도안으로 계절 그림을 완성함/);
assert.match(journalContent, /caregiverMonitoring/);

const futurePlan = promptKit.builders.programJournalFuturePlan({
    mentalStateContent: '보행 안정',
    needsContent: '소근육 발달',
    methodContent: '색연필 사용',
    reactionContent: '차분히 참여',
    monitoringContent: '개별 도움 제공'
});
assert.match(futurePlan, /보행 안정/);
assert.match(futurePlan, /급여제공 관련 세부계획/);

const newsletterTitle = promptKit.builders.newsletterImageTitle({
    description: '대추를 손질하는 사진'
});
assert.match(newsletterTitle, /대추를 손질하는 사진/);
assert.match(newsletterTitle, /제목만 출력/);

const newsletterContent = promptKit.builders.newsletterContent({
    titles: ['대추 다듬기', '공원 산책', '생신 잔치'],
    descriptions: ['손질 활동', '산책 활동', '축하 활동']
});
assert.match(newsletterContent, /대추 다듬기/);
assert.match(newsletterContent, /---/);
assert.match(newsletterContent, /해요체 사용 필수/);

console.log('prompt-builders tests passed');
