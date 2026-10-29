const fs = require('node:fs');
const path = require('node:path');

function updatePreloads(root, version) {
  const files = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.name.endsWith('.js') && file !== path.join(root, 'src/main.js')) files.push(path.relative(root, file).split(path.sep).join('/'));
    }
  }
  visit(path.join(root, 'src'));
  if (fs.existsSync(path.join(root, 'config'))) visit(path.join(root, 'config'));
  const block = '<!-- module-preloads:start -->\n' + files.sort().map(file => `<link rel="modulepreload" href="./${file}?v=${version}">`).join('\n') + '\n<!-- module-preloads:end -->';
  const file = path.join(root, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  html = html.includes('<!-- module-preloads:start -->') ? html.replace(/<!-- module-preloads:start -->[\s\S]*?<!-- module-preloads:end -->/, block) : html.replace('</head>', block + '\n</head>');
  fs.writeFileSync(file, html);
}

module.exports = {updatePreloads};
if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  updatePreloads(root, JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).version);
}
