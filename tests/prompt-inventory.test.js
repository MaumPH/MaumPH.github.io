const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const inventoryPath = path.join(repoRoot, 'docs', 'prompt-inventory.md');
const manifestPath = path.join(repoRoot, 'tests', 'fixtures', 'prompts', 'manifest.json');
const fixturesDir = path.dirname(manifestPath);

const requiredFeatureIds = [
    'pdf-mental-state-analysis',
    'program-journal-content',
    'program-journal-future-plan',
    'program-reactions',
    'case-management-minutes',
    'counseling-log',
    'grievance-report',
    'program-feedback',
    'program-plan',
    'newsletter-image-titles',
    'newsletter-content'
];

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function extractInventoryIds(markdown) {
    return markdown
        .split(/\r?\n/)
        .map((line) => line.match(/^\|\s*([a-z0-9-]+)\s*\|/))
        .filter(Boolean)
        .map((match) => match[1])
        .filter((id) => id !== 'feature-id' && id !== '---');
}

function assertNonEmptyString(value, label) {
    assert.equal(typeof value, 'string', `${label} must be a string`);
    assert.notEqual(value.trim(), '', `${label} must not be empty`);
    assert.doesNotMatch(value, /unknown/i, `${label} must not be unknown`);
}

function assertNonEmptyArray(value, label) {
    assert.ok(Array.isArray(value), `${label} must be an array`);
    assert.ok(value.length > 0, `${label} must not be empty`);
}

assert.ok(fs.existsSync(inventoryPath), 'docs/prompt-inventory.md must exist');
assert.ok(fs.existsSync(manifestPath), 'tests/fixtures/prompts/manifest.json must exist');

const inventory = fs.readFileSync(inventoryPath, 'utf8');
const manifest = readJson(manifestPath);

assert.match(inventory, /# Prompt Inventory/);
assert.match(inventory, /## Feature Inventory/);
assert.match(inventory, /## Output Contracts/);
assert.doesNotMatch(inventory, /unknown/i);

assert.equal(manifest.schemaVersion, 1);
assert.equal(manifest.modelDefault, 'gemini-3.1-flash-lite');
assertNonEmptyArray(manifest.features, 'manifest.features');

const inventoryIds = extractInventoryIds(inventory);
const manifestIds = manifest.features.map((feature) => feature.id);

assert.deepEqual(new Set(manifestIds).size, manifestIds.length, 'feature ids must be unique');

for (const featureId of requiredFeatureIds) {
    assert.ok(inventoryIds.includes(featureId), `inventory missing ${featureId}`);
    assert.ok(manifestIds.includes(featureId), `manifest missing ${featureId}`);
}

assert.deepEqual(
    [...manifestIds].sort(),
    [...inventoryIds].sort(),
    'manifest feature IDs must match inventory table IDs'
);

for (const feature of manifest.features) {
    assertNonEmptyString(feature.id, `${feature.id}.id`);
    assertNonEmptyString(feature.name, `${feature.id}.name`);
    assertNonEmptyString(feature.promptBuilder, `${feature.id}.promptBuilder`);
    assertNonEmptyString(feature.contract, `${feature.id}.contract`);
    assertNonEmptyString(feature.parser, `${feature.id}.parser`);
    assertNonEmptyString(feature.renderer, `${feature.id}.renderer`);
    assertNonEmptyString(feature.copyPath, `${feature.id}.copyPath`);
    assertNonEmptyArray(feature.inputs, `${feature.id}.inputs`);
    assertNonEmptyArray(feature.expectedSections, `${feature.id}.expectedSections`);
    assertNonEmptyArray(feature.fixtures, `${feature.id}.fixtures`);
    assertNonEmptyArray(feature.sourceReferences, `${feature.id}.sourceReferences`);
    assert.equal(typeof feature.modelOptions, 'object', `${feature.id}.modelOptions must be an object`);

    for (const fixtureName of feature.fixtures) {
        const fixturePath = path.join(fixturesDir, fixtureName);
        assert.ok(fs.existsSync(fixturePath), `${feature.id} fixture missing: ${fixtureName}`);
        const fixture = readJson(fixturePath);
        assert.equal(fixture.featureId, feature.id, `${fixtureName} featureId must match`);
        assert.equal(typeof fixture.input, 'object', `${fixtureName} input must be an object`);
        assert.equal(typeof fixture.expected, 'object', `${fixtureName} expected must be an object`);
        assertNonEmptyArray(fixture.expected.sections, `${fixtureName} expected.sections`);
    }
}

const pdfFeature = manifest.features.find((feature) => feature.id === 'pdf-mental-state-analysis');
assert.ok(pdfFeature.aliases.includes('regenerateFields'), 'PDF workflow must document regenerateFields alias');

console.log('prompt-inventory tests passed');
