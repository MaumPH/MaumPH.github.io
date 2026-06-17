const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const {
    collectJavaScriptFiles,
    checkJavaScriptSyntax
} = require('../scripts/check-js-syntax');

const repoRoot = path.join(__dirname, '..');

function createFile(filePath, content) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
}

{
    const files = collectJavaScriptFiles(repoRoot).map((filePath) => path.relative(repoRoot, filePath).replace(/\\/g, '/'));

    assert.ok(files.includes('js/api.js'));
    assert.ok(files.includes('js/program-feedback.js'));
    assert.ok(files.includes('tests/program-feedback.test.js'));
    assert.ok(files.includes('tests/program-feedback.browser-test.js'));
}

{
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syntax-ok-'));
    const validFile = path.join(tempDir, 'valid.js');
    createFile(validFile, 'const value = 1;\nconsole.log(value);\n');

    const result = checkJavaScriptSyntax([validFile]);

    assert.equal(result.ok, true);
    assert.equal(result.checkedFiles.length, 1);
    assert.deepEqual(result.failedFiles, []);
}

{
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syntax-bad-'));
    const invalidFile = path.join(tempDir, 'invalid.js');
    createFile(invalidFile, 'function broken( {\n');

    const result = checkJavaScriptSyntax([invalidFile]);

    assert.equal(result.ok, false);
    assert.equal(result.checkedFiles.length, 1);
    assert.equal(result.failedFiles.length, 1);
    assert.equal(result.failedFiles[0].file, invalidFile);
}

console.log('check-js-syntax tests passed');
