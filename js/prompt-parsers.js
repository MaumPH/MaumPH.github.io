(function attachPromptParsers(root) {
    const promptKit = root.PromptKit || {};

    function ok(data) {
        return { ok: true, data };
    }

    function fail(error, missingSections = []) {
        return { ok: false, error, missingSections };
    }

    function normalizeText(value) {
        return String(value || '')
            .replace(/\r/g, '')
            .replace(/```(?:json)?\s*([\s\S]*?)```/gi, '$1')
            .replace(/\*\*/g, '')
            .trim();
    }

    function stripListPrefix(value) {
        return String(value || '')
            .replace(/^\s*\d+[\.)]\s*/, '')
            .trim();
    }

    function parseJsonValue(value) {
        if (value && typeof value === 'object') {
            return { parsed: value, triedJson: true };
        }

        const text = normalizeText(value);
        if (!text) {
            return { error: '출력 형식이 비어 있습니다.', triedJson: true };
        }

        const shouldBeJson = text.startsWith('{');
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        const jsonText = firstBrace >= 0 && lastBrace > firstBrace
            ? text.slice(firstBrace, lastBrace + 1)
            : text;

        try {
            return { parsed: JSON.parse(jsonText), triedJson: true };
        } catch (error) {
            return { error: shouldBeJson ? 'JSON 형식이 올바르지 않습니다.' : '', triedJson: shouldBeJson };
        }
    }

    function validateStringFields(data, fields) {
        const missing = fields.filter(field => typeof data[field] !== 'string' || !data[field].trim());
        if (missing.length > 0) {
            return fail(`필수 섹션 누락: ${missing.join(', ')}`, missing);
        }

        return ok(fields.reduce((result, field) => {
            result[field] = data[field].trim();
            return result;
        }, {}));
    }

    function validateArrayFields(data, fields) {
        const missing = fields.filter(field => !Array.isArray(data[field]) || data[field].filter(Boolean).length === 0);
        if (missing.length > 0) {
            return fail(`필수 섹션 누락: ${missing.join(', ')}`, missing);
        }

        return ok(fields.reduce((result, field) => {
            result[field] = data[field].map(item => String(item).trim()).filter(Boolean);
            return result;
        }, {}));
    }

    function parseNumberedSections(value, fields) {
        const text = normalizeText(value);
        if (!text) {
            return fail('출력 형식이 비어 있습니다.', fields.map(field => field.key));
        }

        const data = {};
        const missing = [];

        fields.forEach((field, index) => {
            const current = index + 1;
            const next = current + 1;
            const pattern = new RegExp(`\\[${current}\\]\\s*([\\s\\S]*?)(?=\\[${next}\\]|$)`, 'm');
            const match = text.match(pattern);
            const content = match ? match[1].trim() : '';
            if (!content) {
                missing.push(field.key);
            } else {
                data[field.key] = content;
            }
        });

        return missing.length > 0
            ? fail(`필수 섹션 누락: ${missing.join(', ')}`, missing)
            : ok(data);
    }

    function parseBracketSections(value, fields) {
        const text = normalizeText(value);
        if (!text) {
            return fail('출력 형식이 비어 있습니다.', fields.map(field => field.key));
        }

        const data = {};
        const missing = [];

        fields.forEach((field, index) => {
            const marker = `\\[${field.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`;
            const nextMarkers = fields.slice(index + 1).map(next => `\\[${next.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`);
            const lookahead = nextMarkers.length > 0 ? `(?=${nextMarkers.join('|')}|$)` : '$';
            const match = text.match(new RegExp(`${marker}\\s*([\\s\\S]*?)${lookahead}`, 'm'));
            const content = match ? match[1].trim() : '';
            if (!content) {
                missing.push(field.key);
            } else {
                data[field.key] = content;
            }
        });

        return missing.length > 0
            ? fail(`필수 섹션 누락: ${missing.join(', ')}`, missing)
            : ok(data);
    }

    function parseOrderedMarkers(value, fields) {
        const text = normalizeText(value);
        if (!text) {
            return fail('출력 형식이 비어 있습니다.', fields.map(field => field.key));
        }

        const positions = fields.map(field => ({
            ...field,
            index: text.indexOf(field.marker)
        }));
        const missing = positions.filter(field => field.index < 0).map(field => field.key);

        if (missing.length > 0) {
            return fail(`필수 섹션 누락: ${missing.join(', ')}`, missing);
        }

        const data = {};
        positions.forEach((field, index) => {
            const start = field.index + field.marker.length;
            const end = index + 1 < positions.length ? positions[index + 1].index : text.length;
            const content = text.slice(start, end).trim();
            if (content) {
                data[field.key] = content;
            }
        });

        return ok(data);
    }

    function parseStructuredStrings(value, fields, fallback) {
        const json = parseJsonValue(value);
        if (json.parsed && !Array.isArray(json.parsed)) {
            return validateStringFields(json.parsed, fields);
        }
        if (json.error && json.triedJson) {
            return fail(json.error);
        }
        return fallback(value);
    }

    function parseStructuredArrays(value, fields, fallback) {
        const json = parseJsonValue(value);
        if (json.parsed && !Array.isArray(json.parsed)) {
            return validateArrayFields(json.parsed, fields);
        }
        if (json.error && json.triedJson) {
            return fail(json.error);
        }
        return fallback(value);
    }

    function parseProgramReactionsText(value) {
        const sections = parseOrderedMarkers(value, [
            { key: 'positive', marker: '[긍정]' },
            { key: 'neutral', marker: '[중립]' },
            { key: 'negative', marker: '[소극/피로]' }
        ]);
        if (!sections.ok) {
            return sections;
        }

        const data = {};
        for (const [key, content] of Object.entries(sections.data)) {
            data[key] = content.split('\n').map(stripListPrefix).filter(Boolean);
        }

        return validateArrayFields(data, ['positive', 'neutral', 'negative']);
    }

    function parseNewsletterTitles(value) {
        const titles = Array.isArray(value)
            ? value.map(item => String(item).trim()).filter(Boolean)
            : normalizeText(value).split('\n').map(stripListPrefix).filter(Boolean);

        if (titles.length !== 3) {
            return fail('필수 섹션 개수가 맞지 않습니다: newsletter titles', ['imageTitle1', 'imageTitle2', 'imageTitle3']);
        }

        return ok({
            imageTitle1: titles[0],
            imageTitle2: titles[1],
            imageTitle3: titles[2]
        });
    }

    function parseNewsletterContent(value) {
        const sections = normalizeText(value).split(/\n\s*---\s*\n/).map(section => section.trim()).filter(Boolean);
        if (sections.length !== 3) {
            return fail('필수 섹션 개수가 맞지 않습니다: newsletter content', ['activity1', 'activity2', 'activity3']);
        }

        return ok({
            activity1: sections[0],
            activity2: sections[1],
            activity3: sections[2]
        });
    }

    const parsers = {
        pdfMentalStateAnalysis(value) {
            return parseStructuredStrings(value, [
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
            ], text => parseNumberedSections(text, [
                { key: 'mealNutrition' },
                { key: 'walking' },
                { key: 'physicalFunction' },
                { key: 'toileting' },
                { key: 'hygiene' },
                { key: 'dailyLiving' },
                { key: 'cognition' },
                { key: 'behaviorSymptoms' },
                { key: 'familyEnvironment' },
                { key: 'overallOpinion' }
            ]));
        },
        programJournalContent(value) {
            return parseStructuredStrings(value, [
                'need',
                'method',
                'reaction',
                'caregiverMonitoring'
            ], text => parseNumberedSections(text, [
                { key: 'need' },
                { key: 'method' },
                { key: 'reaction' },
                { key: 'caregiverMonitoring' }
            ]));
        },
        programJournalFuturePlan(value) {
            return parseStructuredStrings(value, [
                'summary',
                'caution',
                'plan'
            ], text => parseNumberedSections(text, [
                { key: 'summary' },
                { key: 'caution' },
                { key: 'plan' }
            ]));
        },
        programReactions(value) {
            return parseStructuredArrays(value, [
                'positive',
                'neutral',
                'negative'
            ], parseProgramReactionsText);
        },
        caseManagementMinutes(value) {
            return parseNumberedSections(value, [
                { key: 'selectionReason' },
                { key: 'meetingContent' },
                { key: 'meetingResult' },
                { key: 'serviceReflection' }
            ]);
        },
        counselingLog(value) {
            return parseBracketSections(value, [
                { key: 'date', label: '상담일자' },
                { key: 'method', label: '상담방식' },
                { key: 'content', label: '상담내용' },
                { key: 'action', label: '조치내용' }
            ]);
        },
        grievanceReport(value) {
            return parseOrderedMarkers(value, [
                { key: 'receipt', marker: '▷ 접수' },
                { key: 'analysis', marker: '▷ 분석' },
                { key: 'action', marker: '▷ 조치' },
                { key: 'notification', marker: '▷ 통보' },
                { key: 'followUp', marker: '▷ 사후관리' },
                { key: 'note', marker: '## 비고' }
            ]);
        },
        programFeedback(value) {
            return parseOrderedMarkers(value, [
                { key: 'collectedOpinion', marker: '① 수급자(보호자) 의견수렴' },
                { key: 'reflectedOpinion', marker: '② 수급자(보호자) 의견반영' }
            ]);
        },
        programPlan(value) {
            return parseOrderedMarkers(value, [
                { key: 'materials', marker: '① 준비물' },
                { key: 'goal', marker: '② 프로그램 목표' },
                { key: 'process', marker: '③ 진행과정' },
                { key: 'effect', marker: '④ 기대효과' }
            ]);
        },
        newsletterImageTitles: parseNewsletterTitles,
        newsletterContent: parseNewsletterContent
    };

    promptKit.formatParseError = function formatParseError(parsed, sourceText) {
        return `결과 형식이 올바르지 않습니다: ${parsed.error}\n\n원문:\n${sourceText || ''}`;
    };
    promptKit.parsers = parsers;
    root.PromptKit = promptKit;
})(typeof window !== 'undefined' ? window : globalThis);
