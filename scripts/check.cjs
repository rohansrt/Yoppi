/* Site checks (no dependencies): every script parses, and every local file an HTML page
   points at (src, href, srcset) exists. Run: npm run check */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
let failures = 0;

function walk(dir, ext, out = []) {
  for (const f of fs.readdirSync(dir)) {
    if (f === 'node_modules' || f === '.git' || f === 'qa-artifacts') continue;
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, ext, out);
    else if (p.endsWith(ext)) out.push(p);
  }
  return out;
}

for (const js of walk(path.join(ROOT, 'assets'), '.js').concat(walk(path.join(ROOT, 'scripts'), '.cjs'))) {
  try { execFileSync(process.execPath, ['--check', js], { stdio: 'pipe' }); }
  catch (e) { failures++; console.log('✗ syntax', path.relative(ROOT, js), String(e.stderr).split('\n')[0]); }
}

for (const html of fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
  const src = fs.readFileSync(path.join(ROOT, html), 'utf8');
  const refs = [...src.matchAll(/(?:src|href)="([^"#?]+)[^"]*"/g)].map((m) => m[1])
    .concat([...src.matchAll(/srcset="([^"]+)"/g)].flatMap((m) => m[1].split(',').map((s) => s.trim().split(' ')[0])));
  for (const ref of refs) {
    if (/^(https?:|mailto:|tel:|data:|\/\/)/.test(ref) || !ref) continue;
    if (!fs.existsSync(path.join(ROOT, ref))) { failures++; console.log('✗ missing', html, '→', ref); }
  }
}

// Offering links (and mode links and downloads) on this site must point at files that exist.
global.window = {};
require(path.join(ROOT, 'assets/js/offerings-data.js'));
for (const o of window.YOPPI_OFFERINGS) {
  for (const m of o.modes || []) {
    for (const ref of [m.href, m.download && m.download.href].filter(Boolean)) {
      if (!/^https?:/.test(ref) && !fs.existsSync(path.join(ROOT, ref))) { failures++; console.log('✗ offering mode points nowhere:', o.slug, ref); }
    }
  }
  if (o.status === 'live' && o.href && !/^https?:/.test(o.href) && !fs.existsSync(path.join(ROOT, o.href))) { failures++; console.log('✗ live offering points nowhere:', o.slug, o.href); }
}

console.log(failures ? `${failures} problem(s)` : 'All checks passed: scripts parse, local links resolve.');
process.exitCode = failures ? 1 : 0;
