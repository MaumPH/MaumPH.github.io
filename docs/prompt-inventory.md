# Prompt Inventory

Reviewed on 2026-06-17 for the static GitHub Pages app. This inventory maps every Gemini-backed workflow to its current prompt source, output contract, parser, renderer, copy path, and fixture coverage. The default model remains `gemini-3.1-flash-lite`.

## Inventory Rules

- Keep REST requests on `v1beta/models/{model}:generateContent`.
- Use `gemini-3.1-flash-lite` as the default Flash-Lite model unless an official Google AI model review changes that requirement.
- Treat direct `fetch(...generateContent...)` calls as temporary duplication to be removed by the Gemini client task.
- Treat `regenerateFields()` as an alias/retry path for `analyzePDF()` because it calls the same PDF analysis workflow.
- All fixture outputs are structural examples only. They must not call Gemini.

## Feature Inventory

| feature-id | User feature | Inputs | Prompt builder | Model options | Expected sections | Contract | Parser | Renderer | Copy path | Fixtures |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| pdf-mental-state-analysis | 업무수행일지 STEP 1 PDF 분석 | Uploaded PDF text in `pdfText` | Inline prompt in `analyzePDF()` at `js/monitoring.js:11`; `regenerateFields()` at `js/monitoring.js:95` reuses it | Text request through `callGeminiAPI(prompt)` using selected model | `[1]` 식사 및 영양상태, `[2]` 보행, `[3]` 신체기능, `[4]` 배뇨·배변기능, `[5]` 위생관리, `[6]` 일상생활수행, `[7]` 인지기능, `[8]` 행동증상, `[9]` 가족 및 생활환경, `[10]` 기타 및 종합의견 | `pdfMentalStateAnalysis` | Current inline `[n]` regex loop; target `PromptKit.parsers.pdfMentalStateAnalysis` | Writes `field-1` through `field-10`, verification icons, analysis status | Manual journal completion after field review | `pdf-mental-state-analysis.basic.json` |
| program-journal-content | 업무수행일지 STEP 2 프로그램 제공계획 및 내용 생성 | Free-text program activity description from `#user-input` | Inline prompt in `generateProgramContent()` at `js/monitoring.js:102` | Text request through `callGeminiAPI(prompt)` using selected model | `[1]` 필요내용, `[2]` 제공방법, `[3]` 어르신 반응 및 특이사항, `[4]` 요양보호사 모니터링 | `programJournalContent` | Current `split(/\[(\d+)\]/)` mapping; target contract parser | Writes `program-need`, `program-method`, `program-reaction`, `program-monitoring` | Included in completed journal fields | `program-journal-content.basic.json` |
| program-journal-future-plan | 업무수행일지 STEP 3 향후 계획 및 기타사항 생성 | Generated program fields plus 10 mental-state fields | Inline prompt in `generateFuturePlan()` at `js/monitoring.js:180` | Text request through `callGeminiAPI(prompt)` using selected model | `[1]` 종합, `[2]` 급여제공 관련 유의사항, `[3]` 급여제공 관련 세부계획 | `programJournalFuturePlan` | Current `split(/\[(\d+)\]/)` mapping; target contract parser | Writes `future-summary`, `future-caution`, `future-plan` | Included in completed journal fields | `program-journal-future-plan.basic.json` |
| program-reactions | 프로그램 제공일지 어르신 반응 생성 | Program mode, title, description, count, emotion ratios, previous session reactions, pattern data | `buildAdvancedPrompt()` at `js/monitoring.js:333`; generation in `generateProgramReactions()` at `js/monitoring.js:681` | Text request through `callGeminiAPI(prompt, { temperature: 1.5 })` | `[긍정]`, `[중립]`, `[소극/피로]` with requested line counts | `programReactions` | `parseEmotionSections()` at `js/monitoring.js:631`; target count and length validator | Writes `positive-reactions`, `neutral-reactions`, `negative-reactions` textareas | `copyAllReactions()` | `program-reactions.basic.json` |
| case-management-minutes | 사례관리 작성 회의록 생성 | Recipient profile, quarter, attendees, guardian/program info, service types, service content, reflection reason | `buildCaseManagementPrompt()` at `js/case-management.js:93` | Text request through `callGeminiAPI(prompt)` using selected model | `[1]` 선정사유, `[2]` 회의내용, `[3]` 회의결과, `[4]` 급여제공반영 | `caseManagementMinutes` | Current `split(/\[(\d+)\]/)` mapping; target section parser | `displayCaseManagementResult()` builds four result blocks | `copyCaseManagementResult()` | `case-management-minutes.basic.json` |
| counseling-log | 상담일지 작성 | Date, method, elder name, guardian relation, guardian request, center request, writing style | `buildCounselingLogPrompt()` at `js/counseling.js:91` | Direct REST text request pinned to `gemini-3.1-flash-lite`; target common client | `[상담일자]`, `[상담방식]`, `[상담내용]`, `[조치내용]` | `counselingLog` | Current bracket split in `displayCounselingLogResult()`; target section parser | `displayCounselingLogResult()` renders section blocks | `copyCounselingLogResult()` | `counseling-log.basic.json` |
| grievance-report | 고충처리 대장 기록서 생성 | Employee, position, background, situation, content, related party, confirmed facts, action history, action scope, notification method | `buildGrievancePrompt()` at `js/grievance.js:105` | Direct REST text request pinned to `gemini-3.1-flash-lite`; target common client | `# 직원 고충처리 기록서`, `## ① 고충내용`, `### ▷ 접수`, `### ▷ 분석`, `## ② 처리결과`, `### ▷ 조치`, `### ▷ 통보`, `### ▷ 사후관리`, `## 비고` | `grievanceReport` | Current markdown-to-HTML replacement; target safe markdown section parser | `displayGrievanceResult()` renders converted result | `copyGrievanceResult()` | `grievance-report.basic.json` |
| program-feedback | 의견수렴 및 의견반영 작성 | Beneficiary, program name, program date, collected opinion, reflected opinion | `buildProgramFeedbackPrompt()` at `js/program-feedback.js:85` | Direct REST text request pinned to `gemini-3.1-flash-lite`; target common client | `① 수급자(보호자) 의견수렴`, `② 수급자(보호자) 의견반영` | `programFeedback` | No parser; result is plain text with required headings | `displayProgramFeedbackResult()` uses `textContent` | `copyProgramFeedbackResult()` | `program-feedback.basic.json` |
| program-plan | 프로그램 추가/수정 계획안 생성 | Program name, type, content or existing plan | `buildProgramPlanPrompt()` at `js/program-editor.js:45` | Text request through `callGeminiAPI(prompt)` using selected model | `## ① 준비물`, `## ② 프로그램 목표`, `## ③ 진행과정`, `## ④ 기대효과` | `programPlan` | No parser; target section validator | `displayProgramPlanResult()` currently writes result as HTML | `copyProgramPlanResult()` | `program-plan.basic.json` |
| newsletter-image-titles | 소식지 이미지별 활동 제목 생성 | Three uploaded images and optional image descriptions | Title prompt built inside `generateNewsletter()` at `js/main.js:154` for each image | Image request through `callGeminiAPIWithImage(prompt, image)` using selected model | Three short activity titles, one per image | `newsletterImageTitles` | Trim each returned title; target title length validator | Titles are inserted into the newsletter content prompt, not directly rendered | Included indirectly in `copyNewsletterResult()` output | `newsletter-image-titles.basic.json` |
| newsletter-content | 소식지 본문 생성 | Three images, generated activity titles, optional descriptions | Content prompt built inside `generateNewsletter()` at `js/main.js:230` | Multi-image request through `callGeminiAPIWithImages(contentPrompt, newsletterImages)` using selected model | Three titled sections separated by `---` | `newsletterContent` | No parser; target section validator | Writes `nl-result-content` with `textContent` | `copyNewsletterResult()` | `newsletter-content.basic.json` |

## Output Contracts

- `pdfMentalStateAnalysis`: exactly 10 named mental-state fields.
- `programJournalContent`: exactly 4 journal content fields.
- `programJournalFuturePlan`: exactly 3 future-plan fields.
- `programReactions`: three emotion buckets with requested counts and line-length limits.
- `caseManagementMinutes`: four numbered case-management sections.
- `counselingLog`: four bracketed counseling sections.
- `grievanceReport`: two major sections, five detailed handling subsections, and a notes section.
- `programFeedback`: two numbered opinion sections.
- `programPlan`: four fixed program-plan sections.
- `newsletterImageTitles`: exactly three short activity titles.
- `newsletterContent`: exactly three newsletter activity sections separated by `---`.

## Source Coverage Checklist

- `rg -n "generate[A-Z].*\\(" js` maps to the rows above.
- `rg -n "callGemini|generateContent" js` maps to the rows above, including direct REST callers and newsletter image/title calls.
- README-visible AI features are represented: 업무수행일지, 프로그램 제공일지, 프로그램 계획안, 사례관리, 상담일지, 고충처리 대장, 소식지, 의견수렴.
