const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {checkProject} = require('../scripts/check.cjs');

test('release command updates cache versions and remains consistent for the next release', async () => {
  const parent = path.resolve(os.tmpdir());
  const temporary = fs.mkdtempSync(path.join(parent, 'calamitas-release-'));
  try {
    const root = path.resolve(__dirname, '..');
    for (const name of ['index.html', 'version.json', 'package.json', 'src', 'styles', 'scripts']) fs.cpSync(path.join(root, name), path.join(temporary, name), {recursive: true});
    const result = spawnSync(process.execPath, ['scripts/release.cjs', '99.0.1', 'Release test'], {cwd: temporary, encoding: 'utf8'});
    assert.equal(result.status, 0, result.stderr);
    const checked = await checkProject(temporary);
    assert.equal(checked.version, '99.0.1');
    assert.ok(checked.assets > 3);
    assert.equal(JSON.parse(fs.readFileSync(path.join(temporary, 'version.json'), 'utf8')).notes, 'Release test');
  } finally {
    const target = path.resolve(temporary);
    if (path.dirname(target) !== parent || !path.basename(target).startsWith('calamitas-release-')) throw new Error('Unexpected temporary path');
    fs.rmSync(target, {recursive: true, force: true});
  }
});
