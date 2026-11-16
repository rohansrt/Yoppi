/* Startup Sprint engine tests: node --test tests/ */
const test = require('node:test');
const assert = require('node:assert');
const { E, play } = require('./helpers.cjs');
const C = E.content;

const GOOD = {
  playshare: { positioning: 'bookahead', interviews: [['riya', 'past'], ['mrsfernandes', 'past'], ['imran', 'past']], segment: 'families', features: ['verified', 'reserve', 'reviews'] },
  snackstop: { positioning: 'quick', interviews: [['aarav', 'past'], ['sneha', 'past'], ['priya', 'money']], segment: 'seniors', features: ['preorder', 'counter', 'combo'] },
  giftbox: { positioning: 'personal', interviews: [['ishaan', 'past'], ['farhan', 'past'], ['zoya', 'money']], segment: 'students', features: ['personalise', 'finder', 'wrap'] }
};

function base(scenario, extra) {
  return Object.assign({ seed: 42, grade: '9-10', scenario, estimate: 'supported', revision: 'keep', price: 'mid', channel: C.SCENARIOS.find((s) => s.id === scenario).channels[0].id, response: (ev) => ev.responses[0].id }, GOOD[scenario], extra);
}

/** Every valid feature set (0–3 extras) a student could build for a scenario. */
function featureSets(sc) {
  const ids = sc.features.map((f) => f.id);
  const out = [[]];
  const run = E.newRun({ seed: 1 });
  run.scenarioId = sc.id;
  for (let a = 0; a < ids.length; a++) for (let b = a; b < ids.length; b++) for (let c = b; c < ids.length; c++) {
    const set = [...new Set([ids[a], ids[b], ids[c]])];
    // Order matters for dependencies; try the natural order with requirements first.
    set.sort((x, y) => (sc.features.find((f) => f.id === y).requires || []).includes(x) ? -1 : 0);
    let ok = true, sel = [];
    for (const id of set) { const chk = E.featureCheck(Object.assign({}, run, { featureIds: sel }), id, sel); if (!chk.ok) { ok = false; break; } sel = sel.concat(id); }
    if (ok && !out.some((o) => o.length === sel.length && o.every((x) => sel.includes(x)))) out.push(sel);
  }
  return out;
}

test('content: every scenario ships the required fixtures', () => {
  assert.strictEqual(C.SCENARIOS.length, 3);
  for (const sc of C.SCENARIOS) {
    assert.strictEqual(sc.positionings.length, 2, sc.id + ' positionings');
    assert(sc.personas.length >= 5, sc.id + ' personas');
    assert(sc.personas.some((p) => p.nonCustomer), sc.id + ' has a tempting non-customer');
    assert(sc.features.length >= 4 && sc.features.length <= 6, sc.id + ' features');
    assert.strictEqual(sc.testers.length, 3);
    assert.strictEqual(sc.prices.length, 3);
    assert.strictEqual(sc.channels.length, 3);
    assert(sc.events.length >= 2);
    for (const ev of sc.events) {
      assert(ev.responses.length >= 2);
      assert(ev.responses.some((r) => r.cost === 0), ev.id + ' has a free response so nobody is locked out');
      assert.strictEqual(ev.responses[2].cost, 0, 'class 6–8 sees responses 1 and 3; the 3rd must be free');
    }
    for (const p of sc.personas) for (const q of ['past', 'money', 'leading']) assert(p.answers[q] && p.answers[q].text, `${sc.id}/${p.id}/${q}`);
  }
  assert(C.HINTS.length >= 6 && C.HINTS.length <= 8);
});

test('economics: identities hold for thousands of choice combinations, with no NaN or negative counts', () => {
  let checked = 0, losses = 0, profits = 0;
  for (const sc of C.SCENARIOS) {
    const sets = featureSets(sc);
    assert(sets.length > 10, sc.id + ' has many valid builds');
    for (const pos of sc.positionings) for (const seg of sc.segments) for (const price of sc.prices) for (const ch of sc.channels) for (const feats of sets) for (const respIdx of [0, 1, 2]) {
      if ((checked + respIdx) % 3 !== 0 && feats.length > 1) continue; // sample, still thousands
      const res = play(base(sc.id, { positioning: pos.id, segment: seg.id, price: price.id, channel: ch.id, features: feats, seed: checked, response: (ev) => ev.responses[respIdx].id, allowErrors: true }));
      if (!res.result) continue;
      const r = res.result, s = res.sim;
      checked++;
      for (const k of ['revenueINR', 'totalCostINR', 'profitINR', 'endingCashINR', 'buildCostINR', 'variableCostINR', 'promotionINR', 'eventINR']) {
        assert(Number.isInteger(r[k]), `${k} is an integer`);
      }
      assert.strictEqual(r.profitINR, r.revenueINR - r.totalCostINR, 'profit = revenue − all costs');
      assert.strictEqual(r.totalCostINR, r.buildCostINR + r.variableCostINR + r.promotionINR + r.eventINR, 'every spend counted once');
      assert.strictEqual(r.endingCashINR, r.startingCashINR + r.profitINR, 'ending cash = starting cash + profit');
      assert.strictEqual(r.revenueINR, r.rounds.reduce((a, x) => a + x.revenueINR, 0));
      assert.strictEqual(r.promotionINR, ch.cost, 'promotion charged exactly once in total');
      assert.strictEqual(r.buildCostINR, E.buildCost(res.run), 'build cost subtracted once');
      assert.strictEqual(r.totalOrders, r.uniqueCustomers + r.repeatOrders, 'orders = new customers + repeat orders');
      for (const x of r.rounds) {
        for (const k of ['awarePeople', 'eligiblePeople', 'newOrders', 'repeatOrders', 'orders']) assert(Number.isInteger(x[k]) && x[k] >= 0, k + ' ≥ 0');
        assert(x.eligiblePeople <= x.awarePeople);
        assert(x.newOrders <= x.eligiblePeople, 'new orders limited by eligible demand');
        assert(x.orders <= x.capacity, 'orders limited by capacity');
        assert(x.conversion >= 0.01 && x.conversion <= 0.65);
      }
      assert.strictEqual(r.rounds[0].repeatOrders, 0, 'no repeat buyers in week 1');
      assert(r.rounds[1].repeatOrders <= r.rounds[0].newOrders, 'repeat orders limited by previous customers');
      assert(r.uniqueCustomers <= s.addressable, 'never more customers than the addressable market');
      if (r.profitINR < 0) losses++; else profits++;
    }
  }
  assert(checked > 3000, 'checked ' + checked);
  assert(losses > 100 && profits > 100, `some runs lose money (${losses}) and some profit (${profits})`);
});

test('price sensitivity: a higher price never raises conversion for the same customers', () => {
  for (const sc of C.SCENARIOS) for (const seg of sc.segments) {
    const convs = sc.prices.map((p) => play(base(sc.id, { segment: seg.id, price: p.id })).result.rounds[0].conversion);
    assert(convs[0] >= convs[1] && convs[1] >= convs[2], `${sc.id}/${seg.id}: ${convs}`);
  }
});

test('price: neither the cheapest nor the dearest price is always best', () => {
  const bestIdx = new Set();
  for (const sc of C.SCENARIOS) for (const seg of sc.segments) {
    const prof = sc.prices.map((p) => play(base(sc.id, { segment: seg.id, price: p.id, channel: sc.channels.slice().sort((a, b) => (b.match[seg.id] || 0) - (a.match[seg.id] || 0))[0].id })).result.profitINR);
    bestIdx.add(prof.indexOf(Math.max(...prof)));
  }
  assert(bestIdx.size >= 2, 'best price depends on the customer group: ' + [...bestIdx]);
});

test('features: a relevant feature helps its customers, an unrelated one does not boost everyone', () => {
  // Verified owners matter to PlayShare parents (trust) much more than to students.
  const fam0 = play(base('playshare', { segment: 'families', features: ['reserve'] })).result.rounds[0];
  const fam1 = play(base('playshare', { segment: 'families', features: ['reserve', 'verified'] })).result.rounds[0];
  const stu0 = play(base('playshare', { segment: 'students', features: ['reserve'] })).result.rounds[0];
  const stu1 = play(base('playshare', { segment: 'students', features: ['reserve', 'verified'] })).result.rounds[0];
  assert(fam1.conversion - fam0.conversion > stu1.conversion - stu0.conversion, 'verified helps parents more than students');
  assert(fam1.conversion > fam0.conversion);
  // Classroom delivery helps teachers far more than older students.
  const t0 = play(base('snackstop', { segment: 'teachers', features: ['preorder'] })).result.rounds[0].conversion;
  const t1 = play(base('snackstop', { segment: 'teachers', features: ['preorder', 'classroom'] })).result.rounds[0].conversion;
  const s0 = play(base('snackstop', { segment: 'seniors', features: ['preorder'] })).result.rounds[0].conversion;
  const s1 = play(base('snackstop', { segment: 'seniors', features: ['preorder', 'classroom'] })).result.rounds[0].conversion;
  assert(t1 - t0 > s1 - s0);
  // Two different valid mixes give meaningfully different outcomes.
  const a = play(base('giftbox', { features: ['personalise', 'finder'] })).result;
  const b = play(base('giftbox', { features: ['express', 'photos'] })).result;
  assert.notStrictEqual(a.revenueINR, b.revenueINR);
});

test('features: dependencies, conflicts, the 3-extra limit and the budget are enforced', () => {
  let run = play(base('playshare', { stopAt: 'build' })).run;
  assert.match(E.apply(run, { type: 'toggleFeature', id: 'payment' }).error, /Needs “Book a slot”/);
  run = E.apply(run, { type: 'toggleFeature', id: 'reserve' }).run;
  run = E.apply(run, { type: 'toggleFeature', id: 'payment' }).run;
  assert.deepStrictEqual(run.featureIds, ['reserve', 'payment']);
  run = E.apply(run, { type: 'toggleFeature', id: 'reserve' }).run; // removing a requirement removes what needs it
  assert.deepStrictEqual(run.featureIds, []);
  // Budget: the three priciest extras are blocked.
  run = E.apply(run, { type: 'toggleFeature', id: 'delivery' }).run;
  run = E.apply(run, { type: 'toggleFeature', id: 'verified' }).run;
  const over = E.apply(run, { type: 'toggleFeature', id: 'reserve' });
  assert.match(over.error, /Too expensive/);
  assert(E.moneyLeftBeforeLaunch(run) >= C.LAUNCH_RESERVE);
  // Limit of three.
  run = E.apply(run, { type: 'toggleFeature', id: 'reviews' }).run;
  assert.match(E.apply(run, { type: 'toggleFeature', id: 'discount' }).error, /up to 3/);
  // Conflicts.
  let snack = play(base('snackstop', { stopAt: 'build' })).run;
  snack = E.apply(snack, { type: 'toggleFeature', id: 'counter' }).run;
  assert.match(E.apply(snack, { type: 'toggleFeature', id: 'classroom' }).error, /not both/);
});

test('research: better questions raise the learning score but never the market size', () => {
  const good = play(base('playshare', { interviews: [['riya', 'past'], ['mrsfernandes', 'past'], ['imran', 'past']] })).result;
  const weak = play(base('playshare', { interviews: [['tanvi', 'leading'], ['riya', 'leading'], ['mrgupta', 'leading']] })).result;
  assert(good.scoreParts.listening > weak.scoreParts.listening + 8);
  assert(weak.reasonCodes.includes('WEAK_RESEARCH') && weak.reasonCodes.includes('TALKED_TO_NON_CUSTOMER'));
  assert(good.reasonCodes.includes('GOOD_RESEARCH'));
  assert.deepStrictEqual(good.rounds.map((r) => r.awarePeople), weak.rounds.map((r) => r.awarePeople), 'no population multiplier for good answers');
  assert.strictEqual(good.revenueINR, weak.revenueINR, 'sales come from the market, not from quiz answers');
  // A worse estimate changes the score, not the market.
  const big = play(base('playshare', { estimate: 'big' })).result;
  assert(big.scoreParts.evidence < good.scoreParts.evidence);
  assert.strictEqual(big.revenueINR, play(base('playshare', {})).result.revenueINR);
});

test('capacity: sales stop at what you can serve', () => {
  // SnackStop older students with the strongest promotion hit the kitchen limit.
  const r = play(base('snackstop', { channel: 'assembly', price: 'mid' })).result;
  const capped = r.rounds.find((x) => x.potentialOrders > x.capacity);
  assert(capped, 'a capacity-limited week exists');
  assert.strictEqual(capped.orders, capped.capacity);
  assert(r.reasonCodes.includes('CAPACITY_LIMITED_SALES'));
});

test('seed reproducibility: same choices + seed + rules ⇒ identical numbers and insights', () => {
  for (const sc of C.SCENARIOS) {
    const a = play(base(sc.id, { seed: 987654 })).result;
    const b = play(base(sc.id, { seed: 987654 })).result;
    assert.deepStrictEqual(a, b);
  }
  // A different seed may change the micro-variation (±5%) or the surprise, never the rules.
  const x = play(base('playshare', { seed: 1 })).result, y = play(base('playshare', { seed: 2 })).result;
  assert.strictEqual(x.rulesVersion, y.rulesVersion);
});

test('failure path: zero sales still produce a complete, kind report', () => {
  const r = play({ seed: 6606, grade: '11-12', scenario: 'giftbox', positioning: 'eco', interviews: [['nani', 'leading'], ['ishaan', 'leading'], ['farhan', 'leading']], segment: 'parents', estimate: 'big', features: ['wrap'], revision: 'keep', price: 'high', channel: 'friends', response: (ev) => ev.responses[2].id }).result;
  assert.strictEqual(r.revenueINR, 0);
  assert(r.profitINR < 0);
  assert.strictEqual(r.strengths.length, 2);
  assert(r.nextMove && r.nextMove.length > 10);
  assert(r.reasonCodes.includes('ZERO_SALES'));
  assert(r.skillScores && Object.keys(r.skillScores).length === 6);
});

test('flow: stages unlock in order, locked places cannot be entered, Founder HQ opens only at the end', () => {
  let run = E.newRun({ seed: 5, grade: '6-8' });
  assert.deepStrictEqual(E.cityStatus(run), { 'idea-park': 'current', 'people-street': 'locked', 'market-centre': 'locked', 'build-studio': 'locked', 'launch-square': 'locked', 'founder-hq': 'locked' });
  assert(!E.canEnter(run, 'launch-square'));
  assert.match(E.apply(run, { type: 'talk', personaId: 'riya', questionId: 'past' }).error, /Idea Park/);
  const done = play(base('playshare', {})).run;
  assert.strictEqual(E.cityStatus(done)['founder-hq'], 'current');
  assert(['idea-park', 'people-street', 'market-centre', 'build-studio', 'launch-square'].every((l) => E.cityStatus(done)[l] === 'done'));
  const beforeEvent = play(base('playshare', { stopAt: 'event' })).run;
  assert.strictEqual(E.cityStatus(beforeEvent)['founder-hq'], 'locked');
  // Build and Test both live in Build Studio.
  assert.strictEqual(E.STAGE_TO_LOCATION.build, 'build-studio');
  assert.strictEqual(E.STAGE_TO_LOCATION.test, 'build-studio');
  // After opening, earlier choices are locked.
  assert.match(E.apply(beforeEvent, { type: 'pickPrice', id: 'low' }).error, /already open/);
  // Changing the business resets later steps and says so.
  const mid = play(base('playshare', { stopAt: 'build' })).run;
  const change = E.apply(mid, { type: 'pickScenario', id: 'giftbox' });
  assert(change.cleared.length >= 2);
  assert.strictEqual(change.run.interviews.length, 0);
  // Changing the customer group keeps a consistent, valid run.
  const seg = E.apply(mid, { type: 'pickSegment', id: 'students' });
  assert(seg.recalc && E.validateRun(seg.run));
});

test('interviews: three talks, no duplicates, one swap before moving on', () => {
  let run = play(base('playshare', { stopAt: 'interview' })).run;
  run = E.apply(run, { type: 'talk', personaId: 'riya', questionId: 'past' }).run;
  assert.match(E.apply(run, { type: 'talk', personaId: 'riya', questionId: 'money' }).error, /already talked/);
  run = E.apply(run, { type: 'talk', personaId: 'imran', questionId: 'past' }).run;
  run = E.apply(run, { type: 'talk', personaId: 'tanvi', questionId: 'leading' }).run;
  assert.match(E.apply(run, { type: 'talk', personaId: 'mrgupta', questionId: 'past' }).error, /3 people/);
  run = E.apply(run, { type: 'removeInterview', personaId: 'tanvi' }).run;
  assert.match(E.apply(run, { type: 'removeInterview', personaId: 'riya' }).error, /only one/);
  run = E.apply(run, { type: 'talk', personaId: 'mrgupta', questionId: 'past' }).run;
  run = E.apply(run, { type: 'finishInterviews' }).run;
  assert(E.stageDone(run, 'interview'));
});

test('test corner: a fix is offered for the main weakness and can be unaffordable without locking anyone out', () => {
  const run = play(base('playshare', { segment: 'students', features: ['reviews'], stopAt: 'build' })).run;
  let r = E.apply(run, { type: 'toggleFeature', id: 'reviews' }).run;
  r = E.apply(r, { type: 'build' }).run;
  r = E.apply(r, { type: 'markTested' }).run;
  const opts = E.revisionOptions(r);
  const fix = opts.find((o) => o.id === 'fix');
  assert(fix && fix.add.includes('reserve'), 'students’ tester needs booking');
  assert(['simplify', 'message', 'keep'].every((id) => opts.find((o) => o.id === id && !o.disabled)), 'free options always available');
  const after = E.testOutcomes(E.apply(r, { type: 'pickRevision', id: 'fix' }).run);
  assert(after.orders > E.testOutcomes(r, { before: true }).orders);
});

test('state: stored runs are validated; bad or old data is rejected', () => {
  const good = play(base('snackstop', {})).run;
  assert(E.validateRun(good));
  assert(!E.validateRun(null));
  assert(!E.validateRun(Object.assign({}, good, { schemaVersion: 0 })));
  assert(!E.validateRun(Object.assign({}, good, { scenarioId: 'lemonade' })));
  assert(!E.validateRun(Object.assign({}, good, { featureIds: ['preorder', 'counter', 'combo', 'labels'] })));
  assert(!E.validateRun(Object.assign({}, good, { interviewsDone: false })), 'a later step done before an earlier one');
  assert(!E.validateRun(Object.assign({}, good, { startupName: 'x'.repeat(40) })));
  assert.strictEqual(E.cleanName('  <b>Hi</b>   there  '), 'bHi/b there');
  assert.strictEqual(E.cleanName('x'.repeat(50)).length, 30);
});

test('grade bands share one engine and stay playable without long inputs', () => {
  for (const grade of ['6-8', '9-10', '11-12']) {
    const r = play(base('giftbox', { grade })).result;
    assert(r && r.rounds.length === 2, grade);
  }
});
