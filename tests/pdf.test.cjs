/* Report PDF tests: the file is a real, well-formed 2-page PDF with the right numbers. */
const test = require('node:test');
const assert = require('node:assert');
const { play, E } = require('./helpers.cjs');
const R = require('../assets/js/startup-sprint/report.js');
const PDF = require('../assets/js/startup-sprint/pdf.js');

function parse(bytes) {
  const s = Buffer.from(bytes).toString('latin1');
  const startxref = Number(/startxref\s+(\d+)/.exec(s)[1]);
  const count = Number(/xref\s+0 (\d+)/.exec(s)[1]);
  const rows = s.slice(startxref).split('\n').slice(3, 3 + count - 1);
  const objectsOk = rows.every((row, i) => s.slice(Number(row.slice(0, 10))).startsWith(`${i + 1} 0 obj`));
  const text = (s.match(/\(([^)]*)\) Tj/g) || []).map((t) => t.slice(1, -4)).join(' ');
  return { s, objectsOk, text, pages: Number(/\/Type \/Pages \/Kids \[[^\]]+\] \/Count (\d+)/.exec(s)[1]) };
}

const plan = { seed: 11, grade: '9-10', scenario: 'snackstop', positioning: 'healthy', interviews: [['aarav', 'past'], ['priya', 'past'], ['mrdsouza', 'money']], segment: 'juniors', estimate: 'supported', features: ['preorder', 'labels'], revision: 'simplify', price: 'mid', channel: 'monitors', response: (ev) => ev.responses[0].id };

test('PDF is well formed, two A4 pages, with name, money and disclaimer', () => {
  const { run, result } = play(plan);
  const bytes = PDF.build(R.model(run));
  assert(bytes.length > 5000);
  const p = parse(bytes);
  assert(p.s.startsWith('%PDF-1.4') && /%%EOF\s*$/.test(p.s));
  assert(p.objectsOk, 'xref offsets point at their objects');
  assert.strictEqual(p.pages, 2);
  assert(/\/MediaBox \[0 0 595.28 841.89\]/.test(p.s), 'A4 portrait');
  for (const needle of ['SnackStop', E.num(result.revenueINR), E.num(Math.abs(result.profitINR)), 'All figures are from a fictional simulation; no real sales occurred.', 'Your skills', 'Your next move', 'The journey through Startup City'])
    assert(p.text.includes(needle), 'missing: ' + needle);
  assert(!/\/Title \([^)]*(@|\d{10})/.test(p.s), 'no personal data in metadata');
});

test('PDF survives long names, other scripts, emoji and losses', () => {
  const { run } = play(Object.assign({}, plan, { name: 'मेरी दुकान 🎉 (Snacks) \\ “Best” — क्लास' }));
  const p = parse(PDF.build(R.model(run)));
  assert(p.objectsOk);
  assert(p.s.includes('\\(Snacks\\)'), 'brackets are escaped in the content stream');
  const only = play(Object.assign({}, plan, { name: 'मेरी दुकान 🎉' })).run;
  const q = parse(PDF.build(R.model(only)));
  assert(q.objectsOk && q.text.includes('SnackStop'), 'a name with no Latin letters falls back to the business name');
  const wide = play(Object.assign({}, plan, { name: 'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW' })).run;
  assert(parse(PDF.build(R.model(wide))).objectsOk);
});

test('the same run gives a byte-identical PDF (reproducible)', () => {
  const a = PDF.build(R.model(play(plan).run));
  const b = PDF.build(R.model(play(plan).run));
  assert.deepStrictEqual(Buffer.from(a), Buffer.from(b));
});

test('text wrapping respects the width', () => {
  const lines = PDF.wrap('Built for younger students. Today they: wait in the canteen queue.', 100, 9);
  for (const l of lines) assert(PDF.width(l, 9) <= 100.01, l);
});
