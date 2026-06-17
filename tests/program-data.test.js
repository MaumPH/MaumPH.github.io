const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repoRoot = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
const mainSource = fs.readFileSync(path.join(repoRoot, 'js', 'main.js'), 'utf8');

assert.doesNotMatch(indexHtml, /<script src="js\/program_patterns\.js"><\/script>/);
assert.doesNotMatch(mainSource, /await loadProgramPatterns\(\)/);

function createOption() {
    return {
        value: '',
        textContent: ''
    };
}

function createSelect() {
    return {
        innerHTML: '',
        children: [],
        appendChild(child) {
            this.children.push(child);
        }
    };
}

const select = createSelect();
const countElement = { textContent: '' };
const context = {
    console,
    setTimeout,
    PROGRAM_NAMES_LIST: ['가을 소풍', '실버체조', '추억의 노래'],
    document: {
        createElement(tagName) {
            assert.equal(tagName, 'option');
            return createOption();
        },
        getElementById(id) {
            if (id === 'existing-program-select') return select;
            if (id === 'program-list-count') return countElement;
            return null;
        }
    },
    fetchCalls: [],
    fetch: async (url) => {
        context.fetchCalls.push(url);
        return {
            ok: true,
            json: async () => ({
                '가을 소풍': [{ 참여: 'O', '반응 및 특이사항(미참여사유)': '즐겁게 참여하심' }],
                '실버체조': [{ 참여: 'O', '반응 및 특이사항(미참여사유)': '박수 치며 웃으심' }]
            })
        };
    }
};

vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(repoRoot, 'js', 'program-data.js'), 'utf8'), context, {
    filename: 'js/program-data.js'
});
vm.runInContext(fs.readFileSync(path.join(repoRoot, 'js', 'monitoring.js'), 'utf8'), context, {
    filename: 'js/monitoring.js'
});

context.populateProgramList();

assert.equal(select.children.length, 3);
assert.equal(countElement.textContent, '3개 프로그램');
assert.deepEqual(context.fetchCalls, []);

(async () => {
    const loaded = await context.loadProgramPatterns();
    assert.equal(loaded, true);
    assert.deepEqual(context.fetchCalls, ['./program_patterns.json']);
    assert.equal(context.getProgramPatterns('실버체조')[0]['반응 및 특이사항(미참여사유)'], '박수 치며 웃으심');

    console.log('program-data tests passed');
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
