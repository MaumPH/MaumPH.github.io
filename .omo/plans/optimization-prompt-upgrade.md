# 전체 최적화 및 프롬프트 고도화 실행 계획

## TL;DR
> **Summary**: 현재 앱은 정적 GitHub Pages + Vanilla JS 구조이며, 핵심 리스크는 큰 `index.html`, 전역 스크립트 의존성, 중복 Gemini 호출, 흩어진 프롬프트, 중복 데이터 번들, 제한적인 테스트 커버리지다. 먼저 검증 기반을 만든 뒤 Gemini 클라이언트/프롬프트/데이터/렌더링을 단계적으로 정리한다.
> **Deliverables**:
> - 공통 Gemini 클라이언트와 모델 설정 경로
> - 기능별 프롬프트 카탈로그와 출력 계약
> - 프롬프트 품질 테스트와 mocked browser QA
> - 프로그램 패턴 데이터 단일 소스화 및 로딩 최적화
> - AI/사용자 출력 렌더링 안전화
> - README/운영 문서 업데이트
> **Effort**: Large
> **Parallel**: YES - 4 waves
> **Critical Path**: Task 1 -> Task 2 -> Task 3 -> Tasks 4-9 -> Task 10 -> Final Verification

## Context

### Original Request
사용자 요청: "전체내용 확인해서 최적화 및 프롬프트고도화 할 계획이야. 검토 및 리뷰해서 계획을 md로 작성"

### Repository Review Summary
- `index.html` is 2,017 lines and loads all feature scripts and large data at startup. Key script order is fixed at `index.html:1871-1886`.
- Largest payloads are `index.html` 164K, `js/program_patterns.js` 124K, and `program_patterns.json` 124K.
- `js/api.js` already wraps text/image Gemini calls at `js/api.js:10-57`, `js/api.js:61-105`, and `js/api.js:109-155`, but several modules bypass it.
- Direct Gemini fetch duplication remains in `js/counseling.js:53`, `js/grievance.js:67`, and `js/program-feedback.js:51`.
- Shared system prompt is embedded in `js/config.js:26-79`; other long prompts are embedded in feature files.
- Major prompt builders:
  - PDF analysis and program journal: `js/monitoring.js:30-53`, `js/monitoring.js:112-155`, `js/monitoring.js:203-230`
  - Program reactions: `js/monitoring.js:333-629`
  - Counseling: `js/counseling.js:91-184`
  - Grievance: `js/grievance.js:105-220`
  - Program feedback: `js/program-feedback.js:85-220`
  - Program plan: `js/program-editor.js:45-137`
  - Case management: `js/case-management.js:93-154`
  - Newsletter prompts: `js/main.js:154-309`
- Existing tests cover only program feedback prompt/reset behavior in `tests/program-feedback.test.js:1-80`; browser test exists but depends on unmanaged Playwright at `tests/program-feedback.browser-test.js:5`.
- Deploy workflow only uploads Pages artifacts and does not run tests: `.github/workflows/deploy.yml:31-38`.
- Multiple `innerHTML` sinks render AI/user-controlled content, including `js/counseling.js:213-223`, `js/program-editor.js:145`, `js/case-management.js:166`, `js/grievance.js:330`, and admin list rendering in `admin.html:191`.

### External API Notes
- Google AI docs support structured outputs with JSON schema for predictable, type-safe model responses, useful for replacing fragile regex parsing in current prompt outputs.
- Current app uses raw REST `generateContent`; keep REST for minimal migration, but extend `generationConfig` to support response schema and safer model options where available.
- Official Google AI docs reviewed on 2026-06-17 list Gemini 3.1 Flash-Lite as stable with model code `gemini-3.1-flash-lite`; keep this because the user specifically requested the latest Flash-Lite path, not the broader current Flash family.
- REST structured output must use `generationConfig.responseFormat.text.mimeType = "application/json"` and `generationConfig.responseFormat.text.schema = {...}`. Do not put SDK-only fields such as `response_mime_type` or `response_json_schema` directly into the REST request body.

### Gap Review
Metis subagent tooling was not available in this session, so the gap review was performed manually.

Key gaps addressed in this plan:
- Do not rewrite prompts before adding tests; otherwise regressions will be invisible.
- Do not migrate to a framework; this is a GitHub Pages app and a framework migration would expand scope.
- Do not make real Gemini calls in CI; use mocked responses and contract tests.
- Treat rendering safety as a blocker before expanding prompt output richness.
- Keep user API-key storage behavior unchanged unless a separate security architecture project is approved.

### High Accuracy Review
Momus subagent tooling was not available in this session, so the high accuracy review was performed manually against the same criteria: decision completeness, command executability, dependency consistency, testability, and scope fidelity.

Review findings fixed in this revision:
- Replaced ambiguous `package.json or equivalent` wording with a concrete npm-based test harness.
- Replaced `node --check js/*.js`, which can miss files after shell expansion, with a required `scripts/check-js-syntax.js` script that checks every target file one by one.
- Removed optional browser-test skipping from acceptance criteria; Playwright must be declared and a smoke test must run in CI.
- Replaced broad file globs and vague prompt-catalog filenames with explicit planned files.
- Resolved the Task 6 and Task 7 dependency inconsistency by making data loading precede reaction prompt work.

## Work Objectives

### Core Objective
Create a safer, faster, more maintainable prompt-driven app by centralizing Gemini calls, making prompt outputs contract-driven, reducing duplicate data loading, and adding automated prompt/UX regression checks.

### Deliverables
- `package.json` with npm scripts for syntax, unit, browser, and aggregate tests.
- `scripts/check-js-syntax.js` that checks every application/test JavaScript file individually.
- `js/prompt-policies.js`, `js/prompt-builders.js`, `js/prompt-parsers.js`, and `js/prompt-contracts.js`.
- Common Gemini client request builder for text and image requests.
- Output contracts/parsers for every AI feature.
- Prompt test fixtures and mocked browser workflows.
- Data loading cleanup for program patterns and names.
- Rendering hardening for AI/user-generated content.
- Updated README and developer docs.

### Definition of Done
All of these must pass after implementation:
- `npm run check:syntax`
- `node tests/program-feedback.test.js`
- `npm run test:unit`
- `npm run test:browser`
- `npm test`
- `rg -n "gemini-3-flash-preview|gemini-2\\.0-flash-exp" .` returns no matches
- `rg -n "generateContent\\?key" js` shows only the approved common Gemini client location
- GitHub Actions runs tests before Pages artifact upload

### Must Have
- Preserve current GitHub Pages deployment path.
- Preserve current user-facing Korean document formats unless a task explicitly updates a format with tests.
- Preserve current Gemini model default: `gemini-3.1-flash-lite`.
- Mock all Gemini calls in automated tests.
- Every prompt rewrite must have at least one positive fixture and one failure/edge fixture.

### Must NOT Have
- No framework migration.
- No backend/API server introduction.
- No real Gemini API call in CI.
- No broad visual redesign.
- No deletion of program pattern data without equivalent behavior.
- No unsafe rendering of AI/user text through raw `innerHTML`.

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: tests-after for existing code, then TDD for each refactor/prompt change.
- Unit layer: prompt builders, parsers, request builders, data loaders.
- Browser layer: mocked Gemini and Firebase, key user flows.
- Evidence: save outputs/screenshots/logs under `.omo/evidence/task-{N}-{slug}.*`.

## Execution Strategy

### Parallel Execution Waves
Wave 1: Tasks 1-3. Build safety rails: tests, inventory, Gemini client.
Wave 2: Tasks 4 and 7 can run independently after Wave 1; Task 5 follows Task 4; Task 6 follows Tasks 4, 5, and 7.
Wave 3: Task 8 follows Task 4; Task 9 follows Tasks 7 and 8; Task 10 follows Tasks 4-9.
Wave 4: Final verification wave.

### Dependency Matrix
| Task | Depends On | Blocks |
| --- | --- | --- |
| 1. Test Harness and CI | none | 2, 3, 4, 10 |
| 2. Prompt Inventory and Contract Map | 1 | 4, 5, 6 |
| 3. Common Gemini Client | 1 | 4, 5 |
| 4. Output Contracts and Parsers | 2, 3 | 5, 6, 10 |
| 5. Prompt Catalog Refactor | 2, 3, 4 | 6, 10 |
| 6. Program Reaction Prompt Upgrade | 4, 5, 7 | 10 |
| 7. Program Data Loading Optimization | 1 | 6, 9, 10 |
| 8. Rendering Safety Pass | 1, 4 | 10 |
| 9. Startup and Payload Optimization | 7, 8 | 10 |
| 10. Browser QA and Documentation | 4, 5, 6, 7, 8, 9 | Final Verification |

## TODOs

- [x] 1. Establish npm Test Harness and CI Gate

  **What to do**: Add a minimal npm-managed test setup for this static app. Create `package.json` with exact scripts: `check:syntax`, `test:unit`, `test:browser`, and `test`. Create `scripts/check-js-syntax.js` to enumerate `js/**/*.js` and `tests/**/*.js`, then run `node --check` on each file individually. Declare Playwright as a dev dependency and update CI to run `npm ci` and `npm test` before Pages upload.

  **Must NOT do**: Do not introduce a frontend framework or bundler as part of this task.

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 2, 3, 4, 10 | Blocked By: none

  **References**:
  - Pattern: `tests/program-feedback.test.js:1` - current plain Node test style.
  - Pattern: `tests/program-feedback.browser-test.js:5` - current Playwright dependency point.
  - CI: `.github/workflows/deploy.yml:31` - insert test gate before artifact upload.

  **Acceptance Criteria**:
  - [x] `node tests/program-feedback.test.js` passes.
  - [x] `npm run check:syntax` checks every file under `js/` and `tests/`, not just the first shell-expanded path.
  - [x] `npm run test:browser` executes at least `tests/program-feedback.browser-test.js` with mocked external services.
  - [x] CI workflow runs `npm ci` and `npm test` before `actions/upload-pages-artifact`.

  **QA Scenarios**:
  ```text
  Scenario: Existing unit test remains executable
    Tool: bash
    Steps: Run `node tests/program-feedback.test.js`
    Expected: Prints `program-feedback tests passed`
    Evidence: .omo/evidence/task-1-unit.log

  Scenario: CI fails before deploy on broken JavaScript
    Tool: bash
    Steps: Temporarily check workflow ordering with `rg -n "test|upload-pages-artifact" .github/workflows/deploy.yml`
    Expected: Test command appears before upload artifact step
    Evidence: .omo/evidence/task-1-ci-order.log

  Scenario: Syntax script checks all files
    Tool: bash
    Steps: Run `npm run check:syntax`
    Expected: Output lists or counts every checked `js/*.js` and `tests/*.js` file, then exits 0
    Evidence: .omo/evidence/task-1-syntax.log
  ```

  **Commit**: YES | Message: `test: add prompt app test harness` | Files: `package.json`, `package-lock.json`, `scripts/check-js-syntax.js`, `.github/workflows/deploy.yml`, `tests/*`

- [x] 2. Build Prompt Inventory and Contract Map

  **What to do**: Create `docs/prompt-inventory.md`, `tests/prompt-inventory.test.js`, and `tests/fixtures/prompts/manifest.json`. The inventory must list every AI feature with inputs, prompt builder, model options, expected sections, parser, renderer, copy path, and fixture file names. The manifest must be machine-readable and contain the same feature IDs used by tests. Treat `analyzePDF()` and `regenerateFields()` as one PDF analysis workflow with `regenerateFields()` documented as an alias/retry path.

  **Must NOT do**: Do not rewrite prompts in this task.

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 4, 5, 6 | Blocked By: 1

  **References**:
  - System prompt: `js/config.js:26`
  - Program journal prompts: `js/monitoring.js:11`, `js/monitoring.js:95`, `js/monitoring.js:102`, `js/monitoring.js:180`
  - Program reactions: `js/monitoring.js:333`
  - Counseling: `js/counseling.js:91`
  - Grievance: `js/grievance.js:105`
  - Program feedback: `js/program-feedback.js:85`
  - Program plan: `js/program-editor.js:45`
  - Case management: `js/case-management.js:93`
  - Newsletter: `js/main.js:154`

  **Acceptance Criteria**:
  - [x] Inventory lists every AI feature visible in `README.md` and every Gemini workflow found by `rg -n "callGemini|generateContent" js`.
  - [x] Each feature has a named output contract.
  - [x] Each feature has at least one fixture input and expected structural output.
  - [x] No feature is marked "unknown" after review.
  - [x] `tests/fixtures/prompts/manifest.json` validates as JSON and includes feature IDs for all inventory rows.
  - [x] `tests/prompt-inventory.test.js` fails before the inventory exists and passes after inventory/fixture creation.

  **QA Scenarios**:
  ```text
  Scenario: Inventory completeness
    Tool: bash
    Steps: Compare `rg -n "generate[A-Z].*\\(" js` and `rg -n "callGemini|generateContent" js` against the inventory table
    Expected: Every AI generation function and Gemini workflow appears in inventory
    Evidence: .omo/evidence/task-2-inventory.log

  Scenario: Fixture coverage
    Tool: bash
    Steps: List `tests/fixtures/prompts`
    Expected: At least one fixture file per AI feature
    Evidence: .omo/evidence/task-2-fixtures.log
  ```

  **Commit**: YES | Message: `docs: inventory prompt workflows` | Files: `docs/prompt-inventory.md`, `tests/prompt-inventory.test.js`, `tests/fixtures/prompts/manifest.json`, `tests/fixtures/prompts/*`, `package.json`

- [x] 3. Centralize Gemini REST Client

  **What to do**: Replace duplicated fetch logic with one REST client in `js/api.js`. The client must support text, one image, multiple images, generation config, REST `responseFormat` schema config, consistent error extraction, and usage count updates. Convert direct callers in counseling, grievance, and program feedback to the shared wrapper.

  **Must NOT do**: Do not change prompts or response formats yet. Do not add a backend or migrate this static app to the Google GenAI SDK in this task.

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 4, 5 | Blocked By: 1

  **References**:
  - Existing wrapper: `js/api.js:10`
  - Direct duplicate fetch: `js/counseling.js:53`, `js/grievance.js:67`, `js/program-feedback.js:51`
  - Model default: `js/config.js:16`
  - Google structured output REST shape: `https://ai.google.dev/gemini-api/docs/structured-output`

  **Acceptance Criteria**:
  - [x] `rg -n "generateContent\\?key" js` returns only `js/api.js`.
  - [x] Usage count increments exactly once per successful Gemini call.
  - [x] API error messages preserve `error.message` where present.
  - [x] Request-builder tests prove `generationConfig.responseFormat.text.mimeType` and `generationConfig.responseFormat.text.schema` are passed through for structured output requests.
  - [x] Text/image/multi-image paths remain covered by tests or mocked browser QA.

  **QA Scenarios**:
  ```text
  Scenario: Program feedback uses common client
    Tool: bash
    Steps: Run `rg -n "generateContent\\?key" js`
    Expected: Only `js/api.js` matches
    Evidence: .omo/evidence/task-3-rg.log

  Scenario: API failure surfaces message
    Tool: node
    Steps: Run a unit test with mocked fetch returning `{error:{message:"quota exceeded"}}`
    Expected: Rejected error includes `quota exceeded`
    Evidence: .omo/evidence/task-3-error.log
  ```

  **Commit**: YES | Message: `refactor(api): centralize Gemini requests` | Files: `js/api.js`, `js/counseling.js`, `js/grievance.js`, `js/program-feedback.js`, `tests/*`

- [x] 4. Define Output Contracts and Robust Parsers

  **What to do**: Create `js/prompt-contracts.js` and `js/prompt-parsers.js`. For field-extraction workflows, use REST structured JSON via `generationConfig.responseFormat.text` and parse JSON: PDF analysis, program content, future plan, and program reactions. For final document workflows, keep text output but parse with hardened section extraction and validation: counseling, grievance, program feedback, program plan, case management, and newsletter.

  **Must NOT do**: Do not rely on brittle `split(/[...]/)` without validation for newly touched features. Do not use SDK-only structured-output field names in raw REST requests.

  **Parallelization**: Can Parallel: YES with Task 7 only | Wave 2 | Blocks: 5, 6, 10 | Blocked By: 2, 3

  **References**:
  - Fragile PDF parser: `js/monitoring.js:57-64`
  - Program content parser: `js/monitoring.js:159-165`
  - Program reaction parser: `js/monitoring.js:631-678`
  - Counseling renderer/parser: `js/counseling.js:202-223`
  - Case result split: `js/case-management.js:154`
  - Google structured output docs: `https://ai.google.dev/gemini-api/docs/structured-output`

  **Acceptance Criteria**:
  - [x] Each parser has unit tests for valid, missing-section, extra-markdown, and malformed output.
  - [x] Parsers return typed-ish plain objects with named fields, not positional array indexes.
  - [x] UI shows a clear fallback message when required sections are missing.
  - [x] Structured JSON is used for PDF analysis, program content, future plan, and program reactions through REST `generationConfig.responseFormat.text`.

  **QA Scenarios**:
  ```text
  Scenario: Malformed model output is handled
    Tool: node
    Steps: Run parser test with output missing `[2]`
    Expected: Parser returns validation failure and UI test shows recoverable error
    Evidence: .omo/evidence/task-4-malformed.log

  Scenario: Valid output maps to all fields
    Tool: node
    Steps: Run parser fixture for PDF 10-section output
    Expected: All 10 named fields populated
    Evidence: .omo/evidence/task-4-valid.log
  ```

  **Commit**: YES | Message: `test(prompt): add output contracts and parsers` | Files: `js/prompt-contracts.js`, `js/prompt-parsers.js`, `js/monitoring.js`, `js/counseling.js`, `js/grievance.js`, `js/program-feedback.js`, `js/program-editor.js`, `js/case-management.js`, `js/main.js`, `tests/*`, `tests/fixtures/prompts/*`

- [x] 5. Extract and Upgrade Prompt Catalog

  **What to do**: Move prompt builders into `js/prompt-policies.js` and `js/prompt-builders.js` while preserving global script compatibility by attaching a single `window.PromptKit` object. Use shared policy blocks for factuality, tone, prohibited words, output format, and self-check. Remove contradictory instructions and repeated boilerplate. Keep feature modules as thin callers of `PromptKit`.

  **Must NOT do**: Do not alter UI copy or workflow behavior beyond prompt construction.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: 6, 10 | Blocked By: 2, 3, 4

  **References**:
  - Shared prompt: `js/config.js:26-79`
  - Repeated prohibited-word blocks: `js/monitoring.js:127-135`, `js/monitoring.js:223-230`
  - Feature prompts listed in Task 2.

  **Acceptance Criteria**:
  - [x] `window.PromptKit.policies`, `window.PromptKit.builders`, `window.PromptKit.parsers`, and `window.PromptKit.contracts` exist after scripts load.
  - [x] Unit tests assert required sections, prohibited instructions, and user input inclusion.
  - [x] Shared policy appears in one source of truth.
  - [x] `npm run check:syntax` passes.

  **QA Scenarios**:
  ```text
  Scenario: Prompt builder preserves user input
    Tool: node
    Steps: Build counseling prompt with guardian and center requests
    Expected: Prompt contains both inputs exactly once and required output labels
    Evidence: .omo/evidence/task-5-counseling.log

  Scenario: Shared policy prevents forbidden wording
    Tool: node
    Steps: Run prompt contract tests for monitoring prompts
    Expected: Prompts include banned-word guidance and output constraints
    Evidence: .omo/evidence/task-5-policy.log
  ```

  **Commit**: YES | Message: `refactor(prompt): centralize prompt catalog` | Files: `js/prompt-policies.js`, `js/prompt-builders.js`, `js/prompt-contracts.js`, `js/prompt-parsers.js`, `js/config.js`, `js/monitoring.js`, `js/counseling.js`, `js/grievance.js`, `js/program-feedback.js`, `js/program-editor.js`, `js/case-management.js`, `js/main.js`, `index.html`, `tests/*`

- [x] 6. Upgrade Program Reaction Prompt Quality

  **What to do**: Improve `buildAdvancedPrompt` by separating data sampling, emotion distribution, prompt assembly, and post-generation validation. Add deterministic sample selection for tests, enforce requested section counts, de-duplicate lines, and flag lines outside the length target.

  **Must NOT do**: Do not remove existing positive/neutral/negative ratio UX.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: 10 | Blocked By: 4, 5, 7

  **References**:
  - Prompt assembly: `js/monitoring.js:333-629`
  - Emotion guide usage: `js/monitoring.js:374-433`
  - Parser: `js/monitoring.js:631-678`
  - Session duplicate prevention: `js/monitoring.js:735-760`
  - Program patterns: `program_patterns.json`, `emotion_guide.json`

  **Acceptance Criteria**:
  - [x] Tests cover ratio calculation for 1, 10, 30, and 50 outputs.
  - [x] Tests cover duplicate response filtering.
  - [x] Prompt fixture includes existing-program and new-program paths.
  - [x] Output validator reports count mismatches and overlength lines.

  **QA Scenarios**:
  ```text
  Scenario: Existing program reaction generation uses examples
    Tool: node
    Steps: Build prompt for `6.25전쟁`
    Expected: Prompt includes sampled historical examples and exact ratio counts
    Evidence: .omo/evidence/task-6-existing.log

  Scenario: Invalid generated counts are caught
    Tool: node
    Steps: Parse output with one missing neutral line
    Expected: Validator reports section count mismatch
    Evidence: .omo/evidence/task-6-count-error.log
  ```

  **Commit**: YES | Message: `feat(prompt): harden program reaction generation` | Files: `js/monitoring.js`, `tests/*`, `tests/fixtures/prompts/*`

- [x] 7. Optimize Program Pattern Data Loading

  **What to do**: Make `program_patterns.json` the single authoritative pattern data source for normal app operation. Keep `js/program_names.js` as the lightweight initial list. Remove eager loading of `js/program_patterns.js` from `index.html`; retain the file only as a documented `file://` fallback if direct local file testing is still required. Load `program_patterns.json` lazily when the program reaction feature opens or an existing program is selected.

  **Must NOT do**: Do not break GitHub Pages direct hosting. Do not require a build step.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 6, 9, 10 | Blocked By: 1

  **References**:
  - Data loader: `js/program-data.js:16-59`
  - Program names fallback: `js/monitoring.js:850-879`
  - Script eager loading: `index.html:1874-1876`
  - Data files: `program_patterns.json`, `js/program_patterns.js`, `js/program_names.js`

  **Acceptance Criteria**:
  - [x] Only one authoritative pattern data file is used in normal GitHub Pages mode.
  - [x] Program list appears without loading duplicate 124K data twice.
  - [x] Existing-program prompt still receives examples.
  - [x] `index.html` no longer loads `js/program_patterns.js` eagerly in normal mode.
  - [x] If `js/program_patterns.js` remains in the repo, README documents that it is a local-file fallback only.

  **QA Scenarios**:
  ```text
  Scenario: Program list loads on GitHub Pages style URL
    Tool: playwright
    Steps: Open app with mocked JSON fetch and navigate to 프로그램 제공일지
    Expected: Program list count matches `Object.keys(program_patterns.json).length` (258 at review time) and search works
    Evidence: .omo/evidence/task-7-program-list.png

  Scenario: Pattern fetch failure is graceful
    Tool: playwright
    Steps: Mock `program_patterns.json` as 404
    Expected: UI shows pattern unavailable message, app does not crash
    Evidence: .omo/evidence/task-7-fetch-failure.png
  ```

  **Commit**: YES | Message: `perf(data): lazy load program patterns` | Files: `index.html`, `js/program-data.js`, `js/monitoring.js`, data files, `README.md`

- [x] 8. Harden Rendering of AI and User Content

  **What to do**: Replace unsafe AI/user-content `innerHTML` rendering with `textContent`, DOM node creation, or a minimal sanitizer for trusted Markdown-like sections. Separate trusted static templates from untrusted generated strings.

  **Must NOT do**: Do not remove existing layout or copy buttons.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 10 | Blocked By: 1, 4

  **References**:
  - Counseling AI output sink: `js/counseling.js:213-223`
  - Program plan AI output sink: `js/program-editor.js:145`
  - Case management AI output sink: `js/case-management.js:166`
  - Grievance AI output sink: `js/grievance.js:330`
  - Admin user list sinks: `admin.html:191`, `admin.html:225`
  - Safe examples: `js/program-feedback.js:262`, `js/main.js:312`, `js/schedule-verification.js:490`

  **Acceptance Criteria**:
  - [x] AI-generated text cannot inject HTML tags into rendered DOM.
  - [x] User display names/emails in admin lists are escaped or rendered via text nodes.
  - [x] Copy-to-clipboard still copies readable plain text.
  - [x] Browser test includes a malicious mocked Gemini response.

  **QA Scenarios**:
  ```text
  Scenario: Malicious Gemini output is escaped
    Tool: playwright
    Steps: Mock Gemini response as `<img src=x onerror=alert(1)>`
    Expected: Text is visible literally; no image node or alert occurs
    Evidence: .omo/evidence/task-8-xss.png

  Scenario: Copy output remains usable
    Tool: playwright
    Steps: Generate mocked counseling result and click copy
    Expected: Clipboard text contains section labels and no HTML tags
    Evidence: .omo/evidence/task-8-copy.log
  ```

  **Commit**: YES | Message: `fix(ui): render generated text safely` | Files: `js/*`, `admin.html`, `tests/*`

- [x] 9. Improve Startup and Payload Performance

  **What to do**: Reduce initial page load cost without a framework migration. Defer non-critical data/scripts, remove duplicate data payloads, and load heavy feature resources only when their menu is used. Keep script order deterministic.

  **Must NOT do**: Do not introduce dynamic imports that break older static hosting without testing.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 10 | Blocked By: 7, 8

  **References**:
  - CDN dependencies: `index.html:12-16`
  - Script block: `index.html:1871-1886`
  - Payload sizes: `index.html`, `js/program_patterns.js`, `program_patterns.json`
  - Data loader: `js/program-data.js:16`

  **Acceptance Criteria**:
  - [x] Duplicate 124K pattern payload is not loaded by default.
  - [x] App boot still initializes auth, sidebar, and default page.
  - [x] Navigation to every menu still loads required functions.
  - [x] Browser console has no new missing-function errors.

  **QA Scenarios**:
  ```text
  Scenario: Default app boot
    Tool: playwright
    Steps: Open `index.html` with Firebase/CDN stubs
    Expected: Default page visible; no `ReferenceError` in page errors
    Evidence: .omo/evidence/task-9-boot.png

  Scenario: Lazy heavy feature activation
    Tool: playwright
    Steps: Navigate to 프로그램 제공일지 and select existing program
    Expected: Program list loads only when feature is opened
    Evidence: .omo/evidence/task-9-lazy-load.log
  ```

  **Commit**: YES | Message: `perf: reduce initial static payload` | Files: `index.html`, `js/program-data.js`, `js/monitoring.js`, data files

- [x] 10. Expand Browser QA and Documentation

  **What to do**: Add mocked browser scenarios for the main prompt workflows and document how to run checks locally. Cover API-key missing, Gemini success, Gemini failure, parser failure, and malicious-output safety.

  **Must NOT do**: Do not require a real Firebase project or real Gemini key for automated QA.

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: Final Verification | Blocked By: 4, 5, 6, 7, 8, 9

  **References**:
  - Existing browser test stubs: `tests/program-feedback.browser-test.js:18-180`
  - README tech and usage docs: `README.md:62`
  - Deployment workflow: `.github/workflows/deploy.yml:31`

  **Acceptance Criteria**:
  - [x] Browser QA covers at least 업무수행일지, 프로그램 제공일지, 상담일지, 고충처리, 프로그램 계획안, 의견수렴.
  - [x] README includes local test commands and no-real-key testing note.
  - [x] CI runs unit tests and one browser smoke test.
  - [x] Evidence files are generated for browser QA.

  **QA Scenarios**:
  ```text
  Scenario: Mocked end-to-end program feedback
    Tool: playwright
    Steps: Fill program feedback form, mock Gemini success, click generate
    Expected: Result section contains two required sections
    Evidence: .omo/evidence/task-10-program-feedback.png

  Scenario: Missing API key routes to settings
    Tool: playwright
    Steps: Clear localStorage keys and click a generation button
    Expected: Alert appears and settings page is shown
    Evidence: .omo/evidence/task-10-missing-key.png
  ```

  **Commit**: YES | Message: `test(e2e): cover prompt workflows` | Files: `tests/*`, `README.md`, `.github/workflows/deploy.yml`

## Final Verification Wave
> ALL checks must pass with recorded evidence before considering implementation complete. No human intervention is required for verification.

- [x] F1. Plan Compliance Audit
  - Confirm every task above has been completed or explicitly deferred with reason.
  - Run `git diff --stat` and map changed files to the task list.
  - Evidence: `.omo/evidence/f1-plan-compliance.md`

- [x] F2. Code Quality Review
  - Check that no edited JS file grows into an oversized mixed-responsibility module.
  - Run `npm run check:syntax`.
  - Run all unit tests.
  - Evidence: `.omo/evidence/f2-code-quality.log`

- [x] F3. Real Manual QA via Browser Automation
  - Use Playwright with mocked Firebase/Gemini to navigate every menu.
  - Verify no console `ReferenceError`, broken navigation, or hidden overlay deadlock.
  - Evidence: `.omo/evidence/f3-browser-qa.png`

- [x] F4. Scope Fidelity Check
  - Confirm no framework migration, no backend introduction, no real API keys committed, no deployment behavior regression.
  - Confirm old Gemini models are absent.
  - Evidence: `.omo/evidence/f4-scope.md`

## Commit Strategy
- Use one commit per task where practical.
- Keep tests and source changes in the same task commit.
- Suggested branch: continue current working branch or create `codex/optimization-prompt-upgrade`.
- Do not squash until all evidence is collected.

## Success Criteria
- Prompt behavior is easier to reason about because prompts are named, tested, and contract-bound.
- Gemini API behavior is consistent through one client.
- Startup payload no longer loads duplicate heavy data by default.
- AI/user-generated output is rendered safely.
- CI prevents broken JavaScript and prompt-contract regressions before deployment.
- Documentation explains how to run and extend prompt tests.
