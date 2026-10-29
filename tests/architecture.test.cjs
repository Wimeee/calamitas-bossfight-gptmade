const {test} = require('node:test');
const assert = require('node:assert/strict');
const {checkProject} = require('../scripts/check.cjs');

test('all production modules link, asset paths exist and release versions agree', async () => {
  const result = await checkProject();
  assert.equal(result.version, require('../package.json').version);
  assert.ok(result.modules >= 30);
  assert.ok(result.assets >= 3);
});

