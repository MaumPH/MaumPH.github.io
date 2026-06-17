const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const TARGET_DIRS = ['js', 'tests', 'scripts'];

function walkJavaScriptFiles(dirPath, files) {
    if (!fs.existsSync(dirPath)) {
        return;
    }

    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
        const entryPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            walkJavaScriptFiles(entryPath, files);
            continue;
        }

        if (entry.isFile() && entry.name.endsWith('.js')) {
            files.push(entryPath);
        }
    }
}

function collectJavaScriptFiles(repoRoot) {
    const files = [];

    for (const dirName of TARGET_DIRS) {
        walkJavaScriptFiles(path.join(repoRoot, dirName), files);
    }

    return files.sort();
}

function checkJavaScriptSyntax(files) {
    const checkedFiles = [];
    const failedFiles = [];

    for (const file of files) {
        const result = spawnSync(process.execPath, ['--check', file], {
            encoding: 'utf8'
        });

        checkedFiles.push(file);

        if (result.status !== 0) {
            failedFiles.push({
                file,
                stderr: result.stderr || '',
                stdout: result.stdout || ''
            });
        }
    }

    return {
        ok: failedFiles.length === 0,
        checkedFiles,
        failedFiles
    };
}

function runCli() {
    const repoRoot = path.join(__dirname, '..');
    const files = collectJavaScriptFiles(repoRoot);
    const result = checkJavaScriptSyntax(files);

    for (const file of result.checkedFiles) {
        console.log(`checked ${path.relative(repoRoot, file).replace(/\\/g, '/')}`);
    }

    for (const failure of result.failedFiles) {
        console.error(`syntax failed ${path.relative(repoRoot, failure.file).replace(/\\/g, '/')}`);
        if (failure.stderr) {
            console.error(failure.stderr.trim());
        }
        if (failure.stdout) {
            console.error(failure.stdout.trim());
        }
    }

    console.log(`checked ${result.checkedFiles.length} JavaScript files`);

    if (!result.ok) {
        process.exitCode = 1;
    }
}

if (require.main === module) {
    runCli();
}

module.exports = {
    collectJavaScriptFiles,
    checkJavaScriptSyntax
};
