const fs = require('node:fs');
const path = require('node:path');
const {updatePreloads} = require('./preload.cjs');
const root = path.resolve(__dirname, '..');
const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version || '')) {
  console.error('Usage: npm run release -- 17.0.1 "Release notes"');
  process.exit(1);
}
const manifestPath = path.join(root, 'version.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const previous = manifest.version;
function visit(directory) {
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(file);
    else if (file.endsWith('.js')) {
      let source = fs.readFileSync(file, 'utf8').replace(/\?v=\d+\.\d+\.\d+/g, '?v=' + version);
      source = source.replace("VERSION='" + previous + "'", "VERSION='" + version + "'");
      fs.writeFileSync(file, source);
    }
  }
}
visit(path.join(root, 'src'));
if (fs.existsSync(path.join(root, 'config'))) visit(path.join(root, 'config'));
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/\?v=\d+\.\d+\.\d+/g, '?v=' + version).replace(/Trial v[\d.]+/g, 'Trial v' + version).replace(/SITE v[\d.]+/g, 'SITE v' + version);
fs.writeFileSync(path.join(root, 'index.html'), html);
manifest.version = version;
if (process.argv[3]) manifest.notes = process.argv.slice(3).join(' ');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
const packagePath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
pkg.version = version;
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
updatePreloads(root, version);
console.log('Prepared version ' + version + '. Run npm run check and npm test before publishing.');

