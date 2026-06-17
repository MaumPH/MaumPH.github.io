(function attachPromptPolicies(root) {
    const promptKit = root.PromptKit || {};

    promptKit.policies = {
        factuality: [
            '입력값에 없는 사실, 성과, 의학적 판단, 법률 판단을 생성하지 않는다.',
            '불확실한 내용은 단정하지 않고 관찰 또는 계획 수준으로 표현한다.',
            '개인정보와 민감정보는 출력 목적 외 맥락으로 확장하지 않는다.'
        ].join('\n'),
        careTone: [
            '주야간보호센터 실무 기록에 맞는 중립적이고 따뜻한 행정 문체를 유지한다.',
            '어르신과 보호자를 존중하는 표현을 사용하고 비난, 낙인, 과장을 피한다.',
            '문장은 짧고 명확하게 작성한다.'
        ].join('\n'),
        plainCareLanguage: [
            '딱딱한 표현은 쉬운 현장 표현으로 바꾼다.',
            '금지 예: 과업, 과제, 수행, 지속, 완수, 보조, 지원, 언어적 안내',
            '권장 예: 활동, 진행, 계속, 마무리, 도와드림, 설명함, 알려드림'
        ].join('\n'),
        formatSelfCheck: [
            '최종 출력 전 필수 제목과 섹션 수를 확인한다.',
            '마크다운 코드블록과 불필요한 설명은 출력하지 않는다.',
            '요청된 출력 형식 외 문장을 덧붙이지 않는다.'
        ].join('\n')
    };

    root.PromptKit = promptKit;
})(typeof window !== 'undefined' ? window : globalThis);
