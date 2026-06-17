(function attachPromptContracts(root) {
    const promptKit = root.PromptKit || {};

    function stringProperty(description) {
        return { type: 'string', description };
    }

    function arrayProperty(description) {
        return {
            type: 'array',
            description,
            items: { type: 'string' }
        };
    }

    function objectSchema(properties, required) {
        return {
            type: 'object',
            properties,
            required
        };
    }

    function responseFormat(schema) {
        return {
            text: {
                mimeType: 'application/json',
                schema
            }
        };
    }

    const pdfFields = [
        'mealNutrition',
        'walking',
        'physicalFunction',
        'toileting',
        'hygiene',
        'dailyLiving',
        'cognition',
        'behaviorSymptoms',
        'familyEnvironment',
        'overallOpinion'
    ];

    const programContentFields = [
        'need',
        'method',
        'reaction',
        'caregiverMonitoring'
    ];

    const futurePlanFields = [
        'summary',
        'caution',
        'plan'
    ];

    const reactionFields = [
        'positive',
        'neutral',
        'negative'
    ];

    const contracts = {
        pdfMentalStateAnalysis: {
            id: 'pdfMentalStateAnalysis',
            fields: pdfFields,
            responseFormat: responseFormat(objectSchema({
                mealNutrition: stringProperty('식사 및 영양상태'),
                walking: stringProperty('보행'),
                physicalFunction: stringProperty('신체기능'),
                toileting: stringProperty('배뇨·배변기능'),
                hygiene: stringProperty('위생관리'),
                dailyLiving: stringProperty('일상생활수행'),
                cognition: stringProperty('인지기능'),
                behaviorSymptoms: stringProperty('행동증상'),
                familyEnvironment: stringProperty('가족 및 생활환경'),
                overallOpinion: stringProperty('기타 및 종합의견')
            }, pdfFields))
        },
        programJournalContent: {
            id: 'programJournalContent',
            fields: programContentFields,
            responseFormat: responseFormat(objectSchema({
                need: stringProperty('필요내용'),
                method: stringProperty('제공방법'),
                reaction: stringProperty('어르신 반응 및 특이사항'),
                caregiverMonitoring: stringProperty('요양보호사 모니터링')
            }, programContentFields))
        },
        programJournalFuturePlan: {
            id: 'programJournalFuturePlan',
            fields: futurePlanFields,
            responseFormat: responseFormat(objectSchema({
                summary: stringProperty('종합'),
                caution: stringProperty('급여제공 관련 유의사항'),
                plan: stringProperty('급여제공 관련 세부계획')
            }, futurePlanFields))
        },
        programReactions: {
            id: 'programReactions',
            fields: reactionFields,
            responseFormat: responseFormat(objectSchema({
                positive: arrayProperty('긍정 반응 목록'),
                neutral: arrayProperty('중립 반응 목록'),
                negative: arrayProperty('소극/피로 반응 목록')
            }, reactionFields))
        },
        caseManagementMinutes: { id: 'caseManagementMinutes' },
        counselingLog: { id: 'counselingLog' },
        grievanceReport: { id: 'grievanceReport' },
        programFeedback: { id: 'programFeedback' },
        programPlan: { id: 'programPlan' },
        newsletterImageTitles: { id: 'newsletterImageTitles' },
        newsletterContent: { id: 'newsletterContent' }
    };

    promptKit.contracts = contracts;
    root.PromptKit = promptKit;
})(typeof window !== 'undefined' ? window : globalThis);
