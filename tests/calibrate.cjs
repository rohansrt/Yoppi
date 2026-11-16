const { E, play } = require('./helpers.cjs');
const C = E.content;
const sc = process.argv[2] || 'playshare';
const S = C.SCENARIOS.find(s => s.id === sc);
const rows = [];
for (const seg of S.segments) for (const pr of S.prices) for (const ch of S.channels) {
  const good = S.personas.filter(p => p.segmentId === seg.id).slice(0, 2).map(p => [p.id, 'past']);
  while (good.length < 3) good.push([S.personas.find(p => !good.some(g => g[0] === p.id) && !p.nonCustomer).id, 'money']);
  // pick top-fit features for this segment within rules
  let feats = []; const sorted = [...S.features].sort((a, b) => (b.fit[seg.id] || 0) - (a.fit[seg.id] || 0));
  let run = null;
  try {
    const r = play({ scenario: sc, positioning: S.positionings[0].id, interviews: good, segment: seg.id, estimate: 'supported', features: [], revision: 'keep', price: pr.id, channel: ch.id, stopAt: 'build' }).run;
    run = r;
    for (const f of sorted) { const o = E.apply(run, { type: 'toggleFeature', id: f.id }); if (!o.error) run = o.run; }
    feats = run.featureIds;
  } catch (e) { console.log(e.message); }
  for (const resp of ['good', 'poor']) {
    const res = play({ scenario: sc, positioning: S.positionings[0].id, interviews: good, segment: seg.id, estimate: 'supported', features: feats, revision: (()=>{ const o=E.revisionOptions(E.apply(E.apply(E.apply(run,{type:'build'}).run,{type:'markTested'}).run,{type:'noop'}).run).find(x=>x.id==='fix'&&!x.disabled); return o?'fix':'simplify'; })(), price: pr.id, channel: ch.id, response: (ev) => ev.responses[resp === 'good' ? 0 : 2].id, allowErrors: true });
    if (!res.result) { rows.push([seg.id, pr.id, ch.id, resp, 'ERR', res.steps.filter(s=>s.error).map(s=>s.a.type+':'+s.error).join('|')]); continue; }
    const r = res.result;
    rows.push([seg.id, pr.amount, ch.id, resp, feats.join('+'), r.rounds.map(x => `${x.awarePeople}/${x.eligiblePeople}/c${x.conversion}/${x.newOrders}+${x.repeatOrders}`).join(' | '), 'rev', r.revenueINR, 'cost', r.totalCostINR, 'P', r.profitINR, 'score', r.score, r.tier]);
  }
}
for (const r of rows) console.log(r.join(' '));
