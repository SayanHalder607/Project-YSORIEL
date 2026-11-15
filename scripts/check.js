'use strict';
// Static checks: JS syntax for every script, and every local href/src in HTML resolves.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const PUB = path.join(ROOT, 'public');
let errors = 0, files = 0;
function walk(d) { return fs.readdirSync(d, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]); }
for (const f of [path.join(ROOT, 'server.js'), ...walk(PUB), ...walk(path.join(ROOT, 'scripts'))]) {
  const ext = path.extname(f);
  if (ext === '.js') {
    files++;
    try { new vm.Script(fs.readFileSync(f, 'utf8'), {filename:f}); } catch (e) { errors++; console.error('SYNTAX', path.relative(ROOT, f), e.message); }
  } else if (ext === '.html') {
    files++;
    const html = fs.readFileSync(f, 'utf8');
    for (const m of html.matchAll(/(?:href|src)="([^"#?:]+)"/g)) {
      if (!fs.existsSync(path.join(path.dirname(f), m[1]))) { errors++; console.error('MISSING', path.relative(ROOT, f), '->', m[1]); }
    }
  }
}
console.log(errors ? `Check failed: ${errors} problem(s)` : `Check passed: ${files} files OK`);
process.exit(errors ? 1 : 0);
