const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

async function checkProject(root = path.resolve(__dirname, '..')) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.version, manifest.version, 'package.json and version.json must agree');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(!/<style[\s>]/i.test(html), 'Styles belong in styles/');
  assert.ok(!/<script\b(?![^>]*\bsrc=)[^>]*>/i.test(html), 'Game logic belongs in src/');
  let assets = 0;
  const stylesDirectory=path.join(root,'styles');
  for(const name of fs.readdirSync(stylesDirectory).filter(name=>name.endsWith('.css'))){
    const css=fs.readFileSync(path.join(stylesDirectory,name),'utf8');
    for(const match of css.matchAll(/url\(['"]?(\.\.?\/[^'"\s)]+)['"]?\)/g))assert.ok(fs.existsSync(path.resolve(stylesDirectory,match[1].split('?')[0])),'Missing CSS asset: '+match[1]);
  }
  for (const match of html.matchAll(/(?:src|href)="(\.\/[^"?#]+)(?:\?v=([^"]+))?"/g)) {
    assert.ok(fs.existsSync(path.join(root, match[1])), 'Missing HTML asset: ' + match[1]);
    assert.equal(match[2], manifest.version, 'Stale HTML asset version: ' + match[1]);
    assets++;
  }
  const context = vm.createContext({});
  const modules = new Map();
  const elementIds=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]));
  function load(file) {
    if (modules.has(file)) return modules.get(file);
    const source = fs.readFileSync(file, 'utf8');
    for(const match of source.matchAll(/\bbyId\('([^']+)'\)/g))assert.ok(elementIds.has(match[1]),'Missing menu element: '+match[1]);
    for (const match of source.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)) {
      assert.ok(match[1].startsWith('.'), 'Browser modules must use relative imports');
      assert.equal(match[1].split('?v=')[1], manifest.version, 'Stale module version: ' + match[1]);
    }
    const mod = new vm.SourceTextModule(source, {context, identifier: file});
    modules.set(file, mod);
    return mod;
  }
  const main = load(path.join(root, 'src/main.js'));
  await main.link((specifier, parent) => {
    const file = path.resolve(path.dirname(parent.identifier), specifier.split('?')[0]);
    assert.ok(file.startsWith(root + path.sep), 'Import escapes the project');
    return load(file);
  });
  const config = fs.readFileSync(path.join(root, 'src/core/config.js'), 'utf8');
  assert.ok(config.includes("VERSION='" + manifest.version + "'"), 'Runtime VERSION must agree with manifest');
  return {version: manifest.version, modules: modules.size, assets};
}

module.exports = {checkProject};
if (require.main === module) checkProject().then(result => console.log(JSON.stringify(result))).catch(error => { console.error(error.message); process.exitCode = 1; });