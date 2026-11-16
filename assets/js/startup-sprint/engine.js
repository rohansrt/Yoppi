/* YOPPI Startup Sprint: the rules engine. Pure functions only: no DOM, no clock, no
   network, no Math.random. Same run (choices + seed + rules version) => same numbers.
   Browser: window.YOPPI_SS_ENGINE (needs content.js first). Node: require('./engine.js'). */
(function (root, factory) {
  var content = root && root.YOPPI_SS_CONTENT;
  if (!content && typeof require === 'function') content = require('./content.js');
  var api = factory(content);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.YOPPI_SS_ENGINE = api;
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';

  var RULES_VERSION = 'rules-1.0';
  var SCHEMA_VERSION = 1;
  var MAX_FEATURES = 3;
  var INTERVIEWS = 3;
  var NAME_MAX = 30;

  var STAGES = ['discover', 'interview', 'market', 'build', 'test', 'launch', 'report'];
  var STAGE_TO_LOCATION = {
    discover: 'idea-park', interview: 'people-street', market: 'market-centre',
    build: 'build-studio', test: 'build-studio', launch: 'launch-square', report: 'founder-hq'
  };
  var STAGE_LABEL = {
    discover: 'Spot It', interview: 'Ask People', market: 'Check the Market',
    build: 'Build It', test: 'Try It Out', launch: 'Open for Business', report: 'My Startup Report'
  };

  /* ------------------------------------------------------------------ helpers */

  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
  function round(x) { return Math.round(x); }
  function sum(arr, fn) { var t = 0; for (var i = 0; i < arr.length; i++) t += fn ? fn(arr[i]) : arr[i]; return t; }
  function find(arr, id) { if (!arr) return null; for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return null; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function has(list, id) { return list.indexOf(id) > -1; }
  function fill(tpl, ctx) { return String(tpl).replace(/\{(\w+)\}/g, function (_, k) { return ctx[k] != null ? ctx[k] : ''; }); }
  function inr(n) {
    var neg = n < 0; var s = String(Math.abs(Math.round(n)));
    // Indian grouping: 1,23,456
    var last3 = s.slice(-3), rest = s.slice(0, -3);
    if (rest) last3 = ',' + last3;
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return (neg ? '−' : '') + '₹' + rest + last3;
  }
  function num(n) { return inr(n).replace('₹', ''); }

  // Seeded generator (mulberry32), one independent stream per name.
  function hashString(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed, stream) {
    var a = ((seed >>> 0) ^ hashString(stream)) >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ------------------------------------------------------------- lookups */

  function scenarioOf(run) { return run && find(C.SCENARIOS, run.scenarioId); }
  function positioningOf(run) { var sc = scenarioOf(run); return sc && find(sc.positionings, run.positioningId); }
  function segmentOf(run) { var sc = scenarioOf(run); return sc && find(sc.segments, run.segmentId); }
  function featureOf(sc, id) { return sc && find(sc.features, id); }
  function personaOf(sc, id) { return sc && find(sc.personas, id); }
  function priceOf(run) { var sc = scenarioOf(run); return sc && find(sc.prices, run.priceId); }
  function channelOf(run) { var sc = scenarioOf(run); return sc && find(sc.channels, run.channelId); }

  /* --------------------------------------------------------------- the run */

  function newRun(opts) {
    opts = opts || {};
    return {
      id: opts.id || 'run-' + (opts.seed >>> 0).toString(36),
      schemaVersion: SCHEMA_VERSION,
      rulesVersion: RULES_VERSION,
      contentVersion: C.CONTENT_VERSION,
      seed: opts.seed >>> 0,
      grade: opts.grade || null,
      startedAt: opts.now || null,
      scenarioId: null,
      positioningId: null,
      startupName: '',
      ideaDone: false,
      interviews: [],
      swapUsed: false,
      interviewsDone: false,
      segmentId: null,
      estimateId: null,
      featureIds: [],
      built: false,
      tested: false,
      revisionId: null,
      priceId: null,
      channelId: null,
      opened: false,
      eventResponseId: null,
      completedAt: null
    };
  }

  function stageDone(run, stage) {
    switch (stage) {
      case 'discover': return !!(run.ideaDone && run.scenarioId && run.positioningId);
      case 'interview': return !!(run.interviewsDone && run.interviews.length === INTERVIEWS);
      case 'market': return !!(run.segmentId && run.estimateId);
      case 'build': return !!run.built;
      case 'test': return !!(run.tested && run.revisionId);
      case 'launch': return !!(run.opened && run.eventResponseId);
      case 'report': return !!run.completedAt;
    }
    return false;
  }

  /** The first stage that is not finished ('welcome' until a class band is picked). */
  function stageOf(run) {
    if (!run || !run.grade) return 'welcome';
    for (var i = 0; i < STAGES.length; i++) if (!stageDone(run, STAGES[i])) return STAGES[i];
    return 'report';
  }

  function stepNumber(run) {
    var loc = STAGE_TO_LOCATION[stageOf(run)] || 'idea-park';
    for (var i = 0; i < C.LOCATIONS.length; i++) if (C.LOCATIONS[i].id === loc) return i + 1;
    return 1;
  }

  /** current / done / locked for each landmark, derived only from canonical choices. */
  function cityStatus(run) {
    var stage = stageOf(run);
    var out = {};
    C.LOCATIONS.forEach(function (loc) {
      var done = loc.stages.every(function (s) { return stageDone(run, s); });
      var current = loc.stages.indexOf(stage) > -1 || (stage === 'welcome' && loc.id === 'idea-park');
      if (loc.id === 'founder-hq') { done = false; current = !!(run && run.completedAt); }
      out[loc.id] = current ? 'current' : done ? 'done' : 'locked';
    });
    return out;
  }

  function canEnter(run, locationId) {
    var st = cityStatus(run)[locationId];
    return st === 'current' || st === 'done';
  }

  /* --------------------------------------------------------------- budget */

  function minChannelCost(sc) { return Math.min.apply(null, sc.channels.map(function (c) { return c.cost; })); }

  function baseFeatureCost(run) {
    var sc = scenarioOf(run);
    return sc ? sc.core.cost + sum(run.featureIds, function (id) { var f = featureOf(sc, id); return f ? f.cost : 0; }) : 0;
  }

  function revisionPlan(run) {
    if (!run.revisionId) return null;
    var opts = revisionOptions(run);
    return find(opts, run.revisionId);
  }

  function revisionCost(run) { var p = revisionPlan(run); return p ? p.cost : 0; }

  /** Build spend so far: core + features (+ the test-corner fix). */
  function buildCost(run) { return baseFeatureCost(run) + revisionCost(run); }

  function moneyLeftBeforeLaunch(run) { var sc = scenarioOf(run); return sc ? sc.startingCash - buildCost(run) : 0; }

  /* -------------------------------------------------------------- features */

  /** Features after the Test Corner change (add or swap). */
  function effectiveFeatures(run) {
    var ids = run.featureIds.slice();
    var plan = revisionPlan(run);
    if (plan && plan.remove) ids = ids.filter(function (id) { return !has(plan.remove, id); });
    if (plan && plan.add) plan.add.forEach(function (id) { if (!has(ids, id)) ids.push(id); });
    return ids;
  }

  function featureCheck(run, id, selected) {
    var sc = scenarioOf(run);
    var f = featureOf(sc, id);
    selected = selected || run.featureIds;
    if (!f) return { ok: false, reason: 'Unknown feature.' };
    if (has(selected, id)) return { ok: true, selected: true };
    for (var i = 0; i < selected.length; i++) {
      var g = featureOf(sc, selected[i]);
      if ((f.conflicts && has(f.conflicts, g.id)) || (g.conflicts && has(g.conflicts, f.id))) {
        return { ok: false, reason: f.conflictReason || ('Can’t go with “' + g.name + '”.') };
      }
    }
    if (f.requires) {
      var missing = f.requires.filter(function (r) { return !has(selected, r); });
      if (missing.length) return { ok: false, reason: 'Needs “' + featureOf(sc, missing[0]).name + '” first.' };
    }
    if (selected.length >= MAX_FEATURES) return { ok: false, reason: 'You can pick up to ' + MAX_FEATURES + ' extras. Remove one first.' };
    var left = sc.startingCash - sc.core.cost - sum(selected, function (x) { return featureOf(sc, x).cost; });
    if (left - f.cost < C.LAUNCH_RESERVE) {
      return { ok: false, reason: 'Too expensive: keep at least ' + inr(C.LAUNCH_RESERVE) + ' for opening your shop.', budget: true };
    }
    return { ok: true, selected: false };
  }

  /* --------------------------------------------------------- product state */

  function product(run, opts) {
    var sc = scenarioOf(run), pos = positioningOf(run);
    var ids = opts && opts.ids ? opts.ids : effectiveFeatures(run);
    var feats = ids.map(function (id) { return featureOf(sc, id); }).filter(Boolean);
    var rev = opts && opts.noRevision ? null : (run.revisionId ? C.REVISIONS[run.revisionId] : null);
    var perOrder = sum(feats, function (f) { return f.perOrder || 0; });
    return {
      ids: ids,
      features: feats,
      trust: clamp(0.3 + (pos ? pos.trust : 0) + sum(feats, function (f) { return f.trust || 0; }) + (rev && rev.trust || 0), 0, 1),
      usability: clamp(0.5 + sum(feats, function (f) { return f.usability || 0; }) + (rev && rev.usability || 0), 0, 1),
      unitCost: Math.max(1, sc.baseUnitCost + (pos ? pos.unitCost : 0) + perOrder),
      capacity: Math.max(5, sc.capacity + sum(feats, function (f) { return f.capacity || 0; })),
      discount: Math.max.apply(null, [0].concat(feats.map(function (f) { return f.newCustomerDiscount || 0; }))),
      orderValueAdd: sum(feats, function (f) { return f.orderValueAdd || 0; })
    };
  }

  /** Cost of one order: base + positioning + per-order feature costs + the price tier's materials. */
  function unitCostFor(prod, price) { return prod.unitCost + (price && price.unitCostAdd || 0); }

  function featureFit(run, segId, ids) {
    var sc = scenarioOf(run), pos = positioningOf(run);
    var raw = sum(ids, function (id) { var f = featureOf(sc, id); return f && f.fit[segId] || 0; });
    return clamp(raw + (pos && pos.segmentFit[segId] || 0), -0.05, 0.16);
  }

  /* ---------------------------------------------------------- Test Corner */

  function testerSteps(t) { return t.stopAt === 'pay' ? ['browse', 'view', 'action', 'pay'] : ['browse', 'view', 'action']; }

  function testOutcomes(run, opts) {
    var sc = scenarioOf(run);
    var ids = opts && opts.before ? run.featureIds : effectiveFeatures(run);
    var simplified = !(opts && opts.before) && run.revisionId === 'simplify';
    var testers = sc.testers.map(function (t) {
      var ok = t.needs.some(function (n) { return has(ids, n); });
      var steps = testerSteps(t);
      return {
        id: t.id, name: t.name, initials: t.initials, tone: t.tone, segmentId: t.segmentId,
        ok: ok, steps: steps, stoppedAt: ok ? null : t.stopAt, quote: ok ? t.happy : t.drop, fix: ok ? null : t.fix
      };
    });
    var dropped = testers.filter(function (t) { return !t.ok; });
    var main = dropped.filter(function (t) { return t.segmentId === run.segmentId; })[0] || dropped[0] || null;
    var weakness = main
      ? { kind: 'feature', testerId: main.id, fix: main.fix, text: main.quote, inSegment: main.segmentId === run.segmentId }
      : { kind: 'polish', fix: 'simplify', text: sc.fallbackWeakness.text, inSegment: true, solved: simplified };
    return { testers: testers, weakness: weakness, orders: testers.length - dropped.length };
  }

  /** The improvement choices offered after the first test (always includes free options). */
  function revisionOptions(run) {
    var sc = scenarioOf(run);
    if (!sc) return [];
    var before = testOutcomes(run, { before: true });
    var w = before.weakness;
    var opts = [];
    if (w.kind === 'feature') {
      var target = featureOf(sc, w.fix);
      var add = (target.requires || []).filter(function (r) { return !has(run.featureIds, r); }).concat([target.id]);
      var remove = [];
      run.featureIds.forEach(function (id) {
        var g = featureOf(sc, id);
        if ((target.conflicts && has(target.conflicts, id)) || (g.conflicts && has(g.conflicts, target.id))) remove.push(id);
      });
      var kept = run.featureIds.filter(function (id) { return !has(remove, id); });
      // Too many extras: swap out the one that helps the chosen customers least (and nothing depends on it).
      while (kept.length + add.length > MAX_FEATURES) {
        var candidates = kept.filter(function (id) {
          return !kept.some(function (o) { var g = featureOf(sc, o); return o !== id && g.requires && has(g.requires, id); });
        });
        candidates.sort(function (a, b) { return (featureOf(sc, a).fit[run.segmentId] || 0) - (featureOf(sc, b).fit[run.segmentId] || 0); });
        var out = candidates[0] || kept[0];
        remove.push(out);
        kept = kept.filter(function (id) { return id !== out; });
      }
      var cost = sum(add, function (id) { return featureOf(sc, id).cost; });
      var available = sc.startingCash - baseFeatureCost(run) - minChannelCost(sc);
      var names = add.map(function (id) { return featureOf(sc, id).name; });
      var label = remove.length
        ? 'Swap “' + remove.map(function (id) { return featureOf(sc, id).name; }).join('” and “') + '” for “' + names.join('” + “') + '”'
        : 'Add “' + names.join('” + “') + '”';
      opts.push({
        id: 'fix', kind: 'fix', icon: target.icon, label: label,
        detail: 'Fixes what ' + find(sc.testers, w.testerId).name + ' struggled with.' + (remove.length ? ' Money already spent is not returned.' : ''),
        cost: cost, add: add, remove: remove, fixes: target.id,
        disabled: cost > available, reason: cost > available ? 'Needs ' + inr(cost) + '. You can spend ' + inr(Math.max(0, available)) + ' now.' : null
      });
    }
    ['simplify', 'message', 'keep'].forEach(function (id) {
      var r = C.REVISIONS[id];
      opts.push({ id: id, kind: id, icon: r.icon, label: r.label, detail: r.detail, cost: 0, add: [], remove: [], disabled: false, reason: null });
    });
    return opts;
  }

  /* -------------------------------------------------------- Market Centre */

  function estimateOptions(run) {
    var sc = scenarioOf(run), seg = segmentOf(run);
    if (!seg) return [];
    var supported = Math.max(10, Math.round(seg.population * seg.needRate / 10) * 10);
    var opts = [
      { id: 'small', value: Math.max(5, Math.round(supported / 8 / 5) * 5), label: 'Only my friends and a few others', verdict: 'too-small' },
      { id: 'supported', value: supported, label: 'The people who need it often', verdict: 'good' },
      { id: 'big', value: seg.population, label: 'Everyone in this group', verdict: 'too-big' }
    ];
    // Deterministic shuffle so the right answer isn't always in the middle.
    var r = rng(run.seed, 'estimate:' + sc.id + ':' + seg.id);
    for (var i = opts.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = opts[i]; opts[i] = opts[j]; opts[j] = t; }
    return opts;
  }

  /** Was the chosen group backed by what people said? */
  function segmentBacked(run, segId) {
    var sc = scenarioOf(run);
    return run.interviews.some(function (iv) {
      var p = personaOf(sc, iv.personaId);
      return p && p.segmentId === segId && iv.questionId !== 'leading';
    });
  }

  function interviewHints(run) {
    var sc = scenarioOf(run);
    var hints = { features: {}, budgets: [] };
    run.interviews.forEach(function (iv) {
      var p = personaOf(sc, iv.personaId);
      var a = p && p.answers[iv.questionId];
      if (!a || iv.questionId === 'leading') return;
      if (a.hint) (hints.features[a.hint] = hints.features[a.hint] || []).push(p.name);
      if (a.budget) hints.budgets.push({ name: p.name, amount: a.budget, segmentId: p.segmentId });
    });
    return hints;
  }

  /* ------------------------------------------------------- the simulation */

  function eventOf(run) {
    var sc = scenarioOf(run);
    if (!sc) return null;
    var r = rng(run.seed, 'event:' + sc.id);
    return sc.events[Math.floor(r() * sc.events.length) % sc.events.length];
  }

  function pricePenalty(seg, price) {
    var rel = (price - seg.priceTolerance) / seg.priceTolerance;
    var p = seg.priceSensitivity * rel * 0.45;
    if (price > seg.priceTolerance * 1.3) p += 0.12; // most simply can't afford it
    return clamp(p, -0.05, 0.4);
  }

  function conversion(run, seg, prod, price, round, resp) {
    var plan = revisionPlan(run);
    var revisionMod = 0;
    if (plan && plan.kind === 'fix') {
      var w = testOutcomes(run, { before: true }).weakness;
      revisionMod = w.inSegment ? 0.03 : 0.01;
    }
    var parts = {
      base: seg.baseConversion,
      fit: featureFit(run, seg.id, prod.ids),
      trust: clamp((prod.trust - seg.trustNeed) * 0.15, -0.08, 0.06),
      usability: (prod.usability - 0.5) * 0.08,
      revision: revisionMod,
      event: round === 2 && resp ? resp.conversion || 0 : 0,
      price: pricePenalty(seg, price),
      missing: seg.mustHave && !has(prod.ids, seg.mustHave) ? 0.05 : 0
    };
    var c = parts.base + parts.fit + parts.trust + parts.usability + parts.revision + parts.event - parts.price - parts.missing;
    return { value: clamp(c, 0.01, 0.65), parts: parts };
  }

  /**
   * Two fixed weekly sales rounds. opts.rounds = 1 runs only week 1 (before the surprise).
   * Every rupee is an integer, every spend is counted once, and
   * profit = revenue - all costs, endingCash = startingCash + profit.
   */
  function simulate(run, opts) {
    var sc = scenarioOf(run), seg = segmentOf(run), price = priceOf(run), ch = channelOf(run);
    if (!sc || !seg || !price || !ch) return null;
    var maxRounds = opts && opts.rounds ? opts.rounds : 2;
    var prod = product(run);
    var ev = eventOf(run);
    var resp = run.eventResponseId ? find(ev.responses, run.eventResponseId) : null;
    var spend1 = Math.ceil(ch.cost / 2), spend2 = ch.cost - spend1;
    var addressable = Math.round(seg.population * seg.needRate);
    var build = buildCost(run);
    var rounds = [];
    var customers = 0;

    for (var r = 1; r <= maxRounds; r++) {
      if (r === 2 && !resp) break;
      var p = price.amount;
      if (r === 2 && resp && resp.priceTo != null) p = Math.min(p, resp.priceTo);
      if (r === 2 && resp && resp.priceDelta) p = Math.max(1, p + resp.priceDelta);
      var newPrice = Math.max(1, Math.round(p * (1 - prod.discount)));
      var conv = conversion(run, seg, prod, newPrice, r, resp);
      var aware = Math.min(seg.population, round(ch.reach * (ch.match[seg.id] || 0) * (r === 2 ? ch.round2 : 1)));
      var eligible = round(aware * seg.needRate);
      var wiggle = 0.95 + 0.1 * rng(run.seed, 'round' + r + ':' + sc.id)();
      var potential = Math.floor(eligible * conv.value * wiggle);
      var capacity = Math.max(0, prod.capacity + (r === 2 && resp && resp.capacity ? resp.capacity : 0));
      var remaining = Math.max(0, addressable - customers);
      var newOrders = Math.max(0, Math.min(potential, capacity, remaining));
      var repeatOrders = 0;
      var experience = clamp(0.5 + prod.usability * 0.4 + prod.trust * 0.4 + (r === 2 && resp ? resp.experience || 0 : 0), 0.2, 1.4);
      if (r === 2) repeatOrders = Math.max(0, Math.min(customers, capacity - newOrders, Math.floor(customers * seg.retention * experience)));
      var orders = newOrders + repeatOrders;
      var revenue = newOrders * (newPrice + prod.orderValueAdd) + repeatOrders * (p + prod.orderValueAdd);
      var unitCost = unitCostFor(prod, price);
      var variableCost = orders * unitCost;
      var channelSpend = r === 1 ? spend1 : spend2;
      var eventSpend = r === 2 && resp ? resp.cost : 0;
      var codes = [];
      if (pricePenalty(seg, newPrice) > 0.05) codes.push('HIGH_PRICE_FOR_SEGMENT');
      if ((ch.match[seg.id] || 0) < 0.35) codes.push('CHANNEL_MISMATCH'); else if ((ch.match[seg.id] || 0) >= 0.6) codes.push('PROMOTION_REACHED_MORE_USERS');
      if (potential > capacity && newOrders === capacity) codes.push('CAPACITY_LIMITED_SALES');
      if (prod.trust < seg.trustNeed) codes.push('TRUST_GAP');
      if (seg.mustHave && !has(prod.ids, seg.mustHave)) codes.push('MUST_HAVE_MISSING');
      if (conv.parts.fit >= 0.08) codes.push('FEATURE_FIT_STRONG');
      if (r === 2 && repeatOrders > 0) codes.push('REPEAT_BUYERS_CAME_BACK');
      if (r === 2 && resp) codes.push(resp.quality === 'good' ? 'EVENT_RESPONSE_HELPED' : resp.quality === 'poor' ? 'EVENT_HURT' : 'EVENT_OK');
      rounds.push({
        round: r, price: p, newCustomerPrice: newPrice, unitCost: unitCost, awarePeople: aware, eligiblePeople: eligible,
        conversion: Math.round(conv.value * 1000) / 1000, conversionParts: conv.parts,
        potentialOrders: potential, capacity: capacity,
        newOrders: newOrders, repeatOrders: repeatOrders, orders: orders,
        revenueINR: revenue, variableCostINR: variableCost, fixedSpendINR: channelSpend + eventSpend,
        channelSpendINR: channelSpend, eventSpendINR: eventSpend,
        contributionINR: revenue - variableCost - channelSpend - eventSpend,
        reasonCodes: codes
      });
      customers += newOrders;
    }

    var revenueT = sum(rounds, function (x) { return x.revenueINR; });
    var variableT = sum(rounds, function (x) { return x.variableCostINR; });
    var promoT = sum(rounds, function (x) { return x.channelSpendINR; });
    var eventT = sum(rounds, function (x) { return x.eventSpendINR; });
    var totalCost = build + variableT + promoT + eventT;
    var profit = revenueT - totalCost;
    return {
      rounds: rounds,
      complete: rounds.length === 2,
      event: ev, response: resp,
      product: prod,
      addressable: addressable,
      totalOrders: sum(rounds, function (x) { return x.orders; }),
      uniqueCustomers: customers,
      repeatOrders: sum(rounds, function (x) { return x.repeatOrders; }),
      revenueINR: revenueT,
      buildCostINR: build,
      variableCostINR: variableT,
      promotionINR: promoT,
      eventINR: eventT,
      totalCostINR: totalCost,
      profitINR: profit,
      startingCashINR: sc.startingCash,
      endingCashINR: sc.startingCash + profit
    };
  }

  /** Money in the HUD right now, from engine events only. */
  function cashNow(run) {
    var sc = scenarioOf(run);
    if (!sc) return null;
    var sim = run.opened ? simulate(run, { rounds: run.eventResponseId ? 2 : 1 }) : null;
    if (sim) return sim.endingCashINR;
    return sc.startingCash - (run.built ? buildCost(run) : baseFeatureCost(run));
  }

  /* --------------------------------------------------------------- pricing */

  /** Expected profit per aware person for each price (other choices held fixed). */
  function priceValue(run, priceObj) {
    var seg = segmentOf(run), prod = product(run);
    var newPrice = Math.max(1, Math.round(priceObj.amount * (1 - prod.discount)));
    var conv = conversion(run, seg, prod, newPrice, 1, null).value;
    return conv * (newPrice + prod.orderValueAdd - unitCostFor(prod, priceObj));
  }

  function priceRanks(run) {
    var sc = scenarioOf(run);
    var vals = sc.prices.map(function (p) { return { id: p.id, value: priceValue(run, p) }; });
    vals.sort(function (a, b) { return b.value - a.value; });
    var rank = {};
    vals.forEach(function (v, i) { rank[v.id] = i; });
    return rank;
  }

  /* --------------------------------------------------------------- scoring */

  function bestFeatureFit(run) {
    var sc = scenarioOf(run), seg = run.segmentId;
    var ids = sc.features.map(function (f) { return f.id; });
    var best = 0;
    var budget = sc.startingCash - sc.core.cost - C.LAUNCH_RESERVE;
    function ok(set) {
      if (sum(set, function (id) { return featureOf(sc, id).cost; }) > budget) return false;
      for (var i = 0; i < set.length; i++) {
        var f = featureOf(sc, set[i]);
        if (f.requires && f.requires.some(function (r) { return !has(set, r); })) return false;
        if (f.conflicts && f.conflicts.some(function (c) { return has(set, c); })) return false;
      }
      return true;
    }
    for (var a = 0; a < ids.length; a++) for (var b = a; b < ids.length; b++) for (var c = b; c < ids.length; c++) {
      var set = [ids[a], ids[b], ids[c]].filter(function (x, i, arr) { return arr.indexOf(x) === i; });
      if (!ok(set)) continue;
      var v = sum(set, function (id) { return featureOf(sc, id).fit[seg] || 0; });
      if (v > best) best = v;
    }
    return best || 0.01;
  }

  function score(run, sim) {
    var sc = scenarioOf(run), seg = segmentOf(run);
    var prod = product(run);
    // 1. Listening (20)
    var listen = sum(run.interviews, function (iv) {
      var p = personaOf(sc, iv.personaId), q = C.QUESTION_KINDS[iv.questionId];
      return (20 / INTERVIEWS) * (0.45 * (p ? p.researchValue : 0) + 0.55 * (q ? q.quality : 0));
    });
    // 2. Evidence: customer group + estimate (15)
    var backed = segmentBacked(run, run.segmentId);
    var pos = positioningOf(run);
    var segPts = backed ? 7 : (pos && pos.segmentFit[run.segmentId] ? 5 : 3);
    var est = find(estimateOptions(run), run.estimateId);
    var estPts = est && est.verdict === 'good' ? 8 : 3;
    // 3. Building (25)
    var fitNow = sum(prod.ids, function (id) { return featureOf(sc, id).fit[run.segmentId] || 0; });
    var ratio = clamp(fitNow / bestFeatureFit(run), 0, 1);
    var must = !seg.mustHave || has(prod.ids, seg.mustHave) ? 1 : 0;
    var trustOk = prod.trust >= seg.trustNeed ? 1 : 0;
    var buildPts = 25 * (0.6 * ratio + 0.25 * must + 0.15 * trustOk);
    // 4. Testing (15)
    var w = testOutcomes(run, { before: true }).weakness;
    var plan = revisionPlan(run);
    var testPts = 4;
    if (plan) {
      if (plan.kind === 'fix') testPts = w.inSegment ? 15 : 10;
      else if (plan.kind === 'simplify') testPts = w.kind === 'polish' ? 15 : 8;
      else if (plan.kind === 'message') testPts = w.kind === 'polish' ? 11 : 7;
      else testPts = w.kind === 'polish' ? 10 : 4;
    }
    // 5. Pricing and promotion (15)
    var rank = priceRanks(run)[run.priceId];
    var pricePts = rank === 0 ? 8 : rank === 1 ? 5 : 2;
    var ch = channelOf(run);
    var bestMatch = Math.max.apply(null, sc.channels.map(function (c) { return c.match[run.segmentId] || 0; }));
    var chPts = 7 * ((ch.match[run.segmentId] || 0) / bestMatch);
    // 6. Adaptability: the surprise + staying afloat (10)
    var resp = sim && sim.response;
    var adaptPts = resp ? (resp.quality === 'good' ? 7 : resp.quality === 'ok' ? 4 : 1) : 0;
    if (sim) adaptPts += sim.profitINR >= 0 ? 3 : sim.profitINR >= -0.3 * sc.startingCash ? 1 : 0;

    var parts = {
      listening: round(listen), evidence: segPts + estPts, building: round(buildPts),
      testing: testPts, pricing: round(pricePts + chPts), adaptability: adaptPts
    };
    var max = { listening: 20, evidence: 15, building: 25, testing: 15, pricing: 15, adaptability: 10 };
    var total = parts.listening + parts.evidence + parts.building + parts.testing + parts.pricing + parts.adaptability;
    var skills = {
      'Listening': round(100 * parts.listening / max.listening),
      'Customer Thinking': round(100 * parts.evidence / max.evidence),
      'Building': round(100 * parts.building / max.building),
      'Testing': round(100 * parts.testing / max.testing),
      'Pricing': round(100 * parts.pricing / max.pricing),
      'Adaptability': round(100 * parts.adaptability / max.adaptability)
    };
    return {
      total: total, parts: parts, max: max, skills: skills,
      tier: total >= 75 ? 'Bright Starter' : total >= 50 ? 'Builder' : 'Explorer',
      featureRatio: ratio
    };
  }

  /* ---------------------------------------------------------- explanations */

  function reasonContext(run, sim) {
    var sc = scenarioOf(run), seg = segmentOf(run), price = priceOf(run), ch = channelOf(run);
    var prod = sim ? sim.product : product(run);
    var trustFeat = prod.features.filter(function (f) { return (f.trust || 0) >= 0.2; })[0];
    var nonCust = run.interviews.map(function (iv) { return personaOf(sc, iv.personaId); }).filter(function (p) { return p && p.nonCustomer; })[0];
    var est = find(estimateOptions(run), 'supported');
    return {
      segment: seg ? seg.short : 'your customers',
      price: price ? num(price.amount) : '',
      tolerance: seg ? num(seg.priceTolerance) : '',
      margin: price ? num(price.amount + prod.orderValueAdd - unitCostFor(prod, price)) : '',
      channel: ch ? ch.name : '',
      feature: seg && seg.mustHave && !has(prod.ids, seg.mustHave) ? featureOf(sc, seg.mustHave).name : (trustFeat ? trustFeat.name : ''),
      estimate: est ? num(est.value) : '',
      name: nonCust ? nonCust.name : '',
      event: sim && sim.event ? sim.event.title.replace(/[!.]$/, '') : '',
      cost: sim ? num(sim.eventINR) : '',
      repeat: sim ? sim.repeatOrders : 0,
      profit: sim ? num(Math.max(0, sim.profitINR)) : '',
      loss: sim ? num(Math.max(0, -sim.profitINR)) : ''
    };
  }

  function reasonCodes(run, sim, sc0) {
    var sc = scenarioOf(run), seg = segmentOf(run), price = priceOf(run), ch = channelOf(run);
    var prod = sim.product;
    var codes = [];
    var qs = run.interviews.map(function (iv) { return iv.questionId; });
    var leading = qs.filter(function (q) { return q === 'leading'; }).length;
    if (leading === 0 && qs.filter(function (q) { return q === 'past'; }).length >= 2) codes.push('GOOD_RESEARCH');
    if (leading >= 2) codes.push('WEAK_RESEARCH');
    if (run.interviews.some(function (iv) { var p = personaOf(sc, iv.personaId); return p && p.nonCustomer; })) codes.push('TALKED_TO_NON_CUSTOMER');
    codes.push('LISTENED_TO_THREE');
    var est = find(estimateOptions(run), run.estimateId);
    if (est) codes.push(est.verdict === 'good' ? 'ESTIMATE_GOOD' : est.verdict === 'too-big' ? 'ESTIMATE_TOO_BIG' : 'ESTIMATE_TOO_SMALL');
    if (segmentBacked(run, run.segmentId)) codes.push('SEGMENT_BACKED');
    if (sc0.featureRatio >= 0.75) codes.push('FEATURE_FIT_STRONG');
    else if (sc0.featureRatio < 0.5) codes.push('FEATURE_FIT_WEAK');
    if (seg.mustHave && !has(prod.ids, seg.mustHave)) codes.push('MUST_HAVE_MISSING');
    if (prod.trust < seg.trustNeed) codes.push('TRUST_GAP');
    else if (prod.features.some(function (f) { return (f.trust || 0) >= 0.2; })) codes.push('TRUST_FEATURE_HELPED');
    var plan = revisionPlan(run);
    var w = testOutcomes(run, { before: true }).weakness;
    if (plan && (plan.kind === 'fix' || (plan.kind === 'simplify' && w.kind === 'polish'))) codes.push('TEST_FIX_HELPED');
    else if (w.kind === 'feature' && plan && (plan.kind === 'keep' || plan.kind === 'message')) codes.push('TEST_IGNORED');
    var rank = priceRanks(run)[run.priceId];
    if (pricePenalty(seg, price.amount) > 0.05) codes.push('HIGH_PRICE_FOR_SEGMENT');
    else if (rank === 0) codes.push('GOOD_PRICE_FIT');
    if (price.amount + prod.orderValueAdd - unitCostFor(prod, price) < 0.35 * price.amount) codes.push('LOW_PRICE_THIN_MARGIN');
    var m = ch.match[seg.id] || 0;
    if (m >= 0.6) codes.push('PROMOTION_REACHED_MORE_USERS'); else if (m < 0.35) codes.push('CHANNEL_MISMATCH');
    if (sim.rounds.some(function (r) { return r.reasonCodes.indexOf('CAPACITY_LIMITED_SALES') > -1; })) codes.push('CAPACITY_LIMITED_SALES');
    if (sim.repeatOrders > 0) codes.push('REPEAT_BUYERS_CAME_BACK');
    if (sim.response) {
      if (sim.response.quality === 'good') codes.push('EVENT_RESPONSE_HELPED');
      if (sim.response.quality === 'poor') codes.push('EVENT_HURT');
      if (sim.response.cost >= 250) codes.push('EVENT_RESPONSE_COST_MORE');
    }
    if (sim.revenueINR === 0) codes.push('ZERO_SALES');
    else if (sim.profitINR >= 0) codes.push('MADE_PROFIT');
    else codes.push('MADE_LOSS');
    codes.push('FINISHED');
    return codes;
  }

  function insights(run, sim, sc0) {
    var codes = reasonCodes(run, sim, sc0);
    var ctx = reasonContext(run, sim);
    function line(code) { var r = C.REASONS[code]; var t = fill(r.text, ctx); return { code: code, kind: r.kind, decision: r.decision, weight: r.weight, text: t.charAt(0).toUpperCase() + t.slice(1) }; }
    var lines = codes.filter(function (c) { return C.REASONS[c]; }).map(line);
    var good = lines.filter(function (l) { return l.kind === 'good'; }).sort(function (a, b) { return b.weight - a.weight; });
    var grow = lines.filter(function (l) { return l.kind === 'grow'; }).sort(function (a, b) { return b.weight - a.weight; });
    var strengths = good.slice(0, 2);
    // The biggest problem is shown as 'cost you the most'; the next move is the next thing to try, when there is one.
    var next = grow[1] || grow[0] || { code: 'TRY_AGAIN', kind: 'grow', decision: 'journey', weight: 0, text: 'Play again and try a different price or promotion to see what changes.' };
    return {
      codes: codes,
      strengths: strengths,
      nextMove: next,
      best: good.filter(function (l) { return l.code !== 'FINISHED' && l.code !== 'LISTENED_TO_THREE'; })[0] || strengths[0],
      worst: grow[0] || null,
      all: lines
    };
  }

  /** Narration for one sales week: plain English built only from the numbers. */
  function roundStory(round, unitLabel) {
    var plural = function (n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); };
    var s = num(round.awarePeople) + ' people heard about your shop. ' + num(round.eligiblePeople) + ' of them needed it. ';
    if (round.orders === 0) return s + 'Nobody bought this week.';
    s += round.newOrders + (round.newOrders === 1 ? ' person' : ' people') + ' bought for the first time';
    if (round.repeatOrders) s += ', and ' + round.repeatOrders + ' came back for more';
    return s + '. That’s ' + plural(round.orders, unitLabel) + ' in total.';
  }

  /** Everything the report needs, from canonical choices only. */
  function result(run) {
    var sim = simulate(run);
    if (!sim || !sim.complete) return null;
    var sc0 = score(run, sim);
    var ins = insights(run, sim, sc0);
    return {
      runId: run.id,
      scenarioId: run.scenarioId,
      rulesVersion: RULES_VERSION,
      contentVersion: C.CONTENT_VERSION,
      totalOrders: sim.totalOrders,
      uniqueCustomers: sim.uniqueCustomers,
      repeatOrders: sim.repeatOrders,
      revenueINR: sim.revenueINR,
      totalCostINR: sim.totalCostINR,
      buildCostINR: sim.buildCostINR,
      variableCostINR: sim.variableCostINR,
      promotionINR: sim.promotionINR,
      eventINR: sim.eventINR,
      profitINR: sim.profitINR,
      startingCashINR: sim.startingCashINR,
      endingCashINR: sim.endingCashINR,
      score: sc0.total,
      scoreParts: sc0.parts,
      skillScores: sc0.skills,
      tier: sc0.tier,
      rounds: sim.rounds,
      eventId: sim.event.id,
      insights: ins.all.map(function (l) { return l.text; }),
      strengths: ins.strengths.map(function (l) { return l.text; }),
      nextMove: ins.nextMove.text,
      best: ins.best ? ins.best.text : null,
      worst: ins.worst ? ins.worst.text : null,
      reasonCodes: ins.codes
    };
  }

  /* ---------------------------------------------------------------- actions */

  var CLEAR_LABELS = {
    interview: 'your talks on People Street', market: 'your market choices', build: 'your product',
    test: 'your test and improvement', launch: 'your launch plan'
  };

  function laterProgress(run, stage) {
    var i = STAGES.indexOf(stage);
    return STAGES.slice(i + 1).some(function (s) { return stageDone(run, s) || (s === 'build' && run.featureIds.length) || (s === 'interview' && run.interviews.length) || (s === 'launch' && (run.priceId || run.channelId)); });
  }

  function resetFrom(run, stage) {
    var cleared = [];
    var i = STAGES.indexOf(stage);
    STAGES.slice(i).forEach(function (s) {
      var touched = false;
      if (s === 'interview' && (run.interviews.length || run.interviewsDone)) { run.interviews = []; run.swapUsed = false; run.interviewsDone = false; touched = true; }
      if (s === 'market' && (run.segmentId || run.estimateId)) { run.segmentId = null; run.estimateId = null; touched = true; }
      if (s === 'build' && (run.featureIds.length || run.built)) { run.featureIds = []; run.built = false; touched = true; }
      if (s === 'test' && (run.tested || run.revisionId)) { run.tested = false; run.revisionId = null; touched = true; }
      if (s === 'launch' && (run.priceId || run.channelId || run.opened)) { run.priceId = null; run.channelId = null; run.opened = false; run.eventResponseId = null; touched = true; }
      if (touched && CLEAR_LABELS[s]) cleared.push(CLEAR_LABELS[s]);
    });
    return cleared;
  }

  /**
   * The only way to change a run. Returns { run, cleared, recalc, error }.
   * `cleared` lists later steps that had to be reset (ask before applying);
   * `recalc` means later results will be recalculated from the new choice.
   */
  function apply(prev, action) {
    var run = clone(prev);
    var sc = scenarioOf(run);
    var out = { run: run, cleared: [], recalc: false, error: null };
    function fail(msg) { return { run: prev, cleared: [], recalc: false, error: msg }; }
    if (run.completedAt && action.type !== 'setGrade') return fail('This shop is finished. Play again to try different choices.');
    if (run.opened && ['pickPrice', 'pickChannel', 'pickRevision', 'toggleFeature', 'editBuild', 'pickSegment', 'pickEstimate', 'pickScenario', 'pickPositioning', 'talk', 'removeInterview'].indexOf(action.type) > -1) {
      return fail('Your shop is already open, so earlier choices are locked.');
    }

    switch (action.type) {
      case 'setGrade':
        if (!find(C.GRADES, action.grade)) return fail('Unknown class band.');
        run.grade = action.grade;
        return out;

      case 'pickScenario':
        if (!find(C.SCENARIOS, action.id)) return fail('Unknown business.');
        if (run.scenarioId === action.id) return out;
        if (run.scenarioId) out.cleared = resetFrom(run, 'interview');
        run.scenarioId = action.id;
        run.positioningId = null;
        run.ideaDone = false;
        run.startupName = '';
        return out;

      case 'pickPositioning':
        if (!sc || !find(sc.positionings, action.id)) return fail('Pick a business first.');
        out.recalc = run.positioningId && run.positioningId !== action.id && laterProgress(run, 'discover');
        run.positioningId = action.id;
        return out;

      case 'setName':
        run.startupName = cleanName(action.name);
        return out;

      case 'finishIdea':
        if (!sc || !run.positioningId) return fail('Pick a problem and a way to solve it first.');
        if (!run.startupName) run.startupName = sc.defaultName;
        run.ideaDone = true;
        return out;

      case 'talk': {
        if (!stageDone(run, 'discover')) return fail('Find your idea in Idea Park first.');
        var persona = personaOf(sc, action.personaId);
        if (!persona || !C.QUESTION_KINDS[action.questionId]) return fail('Pick a person and a question.');
        var existing = run.interviews.filter(function (iv) { return iv.personaId === action.personaId; })[0];
        if (existing) return fail('You already talked to ' + persona.name + '.');
        if (run.interviews.length >= INTERVIEWS) return fail('You have talked to ' + INTERVIEWS + ' people already.');
        run.interviews.push({ personaId: action.personaId, questionId: action.questionId });
        out.recalc = laterProgress(run, 'interview');
        return out;
      }

      case 'removeInterview':
        if (run.swapUsed) return fail('You can swap only one talk.');
        if (run.interviewsDone) return fail('You’ve already used these talks. Play again to talk to different people.');
        if (run.interviews.length < INTERVIEWS) return fail('Finish your three talks first.');
        run.interviews = run.interviews.filter(function (iv) { return iv.personaId !== action.personaId; });
        run.swapUsed = true;
        run.interviewsDone = false;
        out.recalc = laterProgress(run, 'interview');
        return out;

      case 'finishInterviews':
        if (run.interviews.length !== INTERVIEWS) return fail('Talk to ' + INTERVIEWS + ' people first.');
        run.interviewsDone = true;
        return out;

      case 'pickSegment':
        if (!stageDone(run, 'interview')) return fail('Talk to people first.');
        if (!find(sc.segments, action.id)) return fail('Unknown group.');
        if (run.segmentId === action.id) return out;
        // The estimate id (small / supported / everyone) keeps its meaning for the new group.
        out.recalc = !!run.estimateId || laterProgress(run, 'market');
        run.segmentId = action.id;
        return out;

      case 'pickEstimate':
        if (!run.segmentId) return fail('Pick who to serve first.');
        if (!find(estimateOptions(run), action.id)) return fail('Unknown estimate.');
        run.estimateId = action.id;
        return out;

      case 'toggleFeature': {
        if (!stageDone(run, 'market')) return fail('Check the market first.');
        if (run.built) return fail('Your product is built. Choose “Change my product” to edit it.');
        if (has(run.featureIds, action.id)) {
          // Remove it, and anything that needs it.
          var drop = [action.id];
          run.featureIds.forEach(function (id) { var f = featureOf(sc, id); if (f.requires && has(f.requires, action.id)) drop.push(id); });
          run.featureIds = run.featureIds.filter(function (id) { return !has(drop, id); });
          return out;
        }
        var chk = featureCheck(run, action.id);
        if (!chk.ok) return fail(chk.reason);
        run.featureIds.push(action.id);
        return out;
      }

      case 'build':
        if (!stageDone(run, 'market')) return fail('Check the market first.');
        if (moneyLeftBeforeLaunch(run) < C.LAUNCH_RESERVE) return fail('Too expensive. Remove a feature.');
        run.built = true;
        return out;

      case 'editBuild':
        out.cleared = resetFrom(run, 'test');
        run.built = false;
        return out;

      case 'markTested':
        if (!run.built) return fail('Build your product first.');
        run.tested = true;
        return out;

      case 'pickRevision': {
        if (!run.tested) return fail('Watch the testers first.');
        var opt = find(revisionOptions(run), action.id);
        if (!opt) return fail('Unknown change.');
        if (opt.disabled) return fail(opt.reason);
        if (run.revisionId && run.revisionId !== action.id && (run.priceId || run.channelId)) out.recalc = true;
        run.revisionId = action.id;
        return out;
      }

      case 'pickPrice':
        if (!stageDone(run, 'test')) return fail('Test your product first.');
        if (!find(sc.prices, action.id)) return fail('Unknown price.');
        run.priceId = action.id;
        return out;

      case 'pickChannel': {
        if (!stageDone(run, 'test')) return fail('Test your product first.');
        var ch = find(sc.channels, action.id);
        if (!ch) return fail('Unknown promotion.');
        if (moneyLeftBeforeLaunch(run) - ch.cost < 0) return fail('Not enough money left for this promotion.');
        run.channelId = action.id;
        return out;
      }

      case 'openShop':
        if (!run.priceId || !run.channelId) return fail('Pick a price and a promotion first.');
        if (moneyLeftBeforeLaunch(run) - channelOf(run).cost < 0) return fail('Not enough money left for this promotion.');
        run.opened = true;
        return out;

      case 'pickEventResponse': {
        if (!run.opened) return fail('Open your shop first.');
        var ev = eventOf(run);
        var resp = find(ev.responses, action.id);
        if (!resp) return fail('Unknown response.');
        if (resp.cost > eventBudget(run)) return fail('Not enough money for this.');
        run.eventResponseId = action.id;
        run.completedAt = action.now || run.completedAt || 'done';
        return out;
      }
    }
    return fail('Unknown action.');
  }

  /** What's left to spend on the surprise, after week 1 and keeping week 2's promotion. */
  function eventBudget(run) {
    var sim = simulate(run, { rounds: 1 });
    var ch = channelOf(run);
    if (!sim || !ch) return 0;
    return sim.endingCashINR - (ch.cost - Math.ceil(ch.cost / 2));
  }

  /* ----------------------------------------------------------- validation */

  function cleanName(s) {
    return String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
  }

  /** Accept a stored run only if it is shaped right and every id exists in this content. */
  function validateRun(r) {
    try {
      if (!r || typeof r !== 'object') return false;
      if (r.schemaVersion !== SCHEMA_VERSION) return false;
      if (typeof r.seed !== 'number' || !isFinite(r.seed)) return false;
      if (r.grade && !find(C.GRADES, r.grade)) return false;
      if (!Array.isArray(r.interviews) || !Array.isArray(r.featureIds)) return false;
      var sc = r.scenarioId ? find(C.SCENARIOS, r.scenarioId) : null;
      if (r.scenarioId && !sc) return false;
      if (!sc) return !(r.positioningId || r.interviews.length || r.segmentId || r.featureIds.length);
      if (r.positioningId && !find(sc.positionings, r.positioningId)) return false;
      if (r.interviews.length > INTERVIEWS) return false;
      if (!r.interviews.every(function (iv) { return iv && personaOf(sc, iv.personaId) && C.QUESTION_KINDS[iv.questionId]; })) return false;
      if (r.segmentId && !find(sc.segments, r.segmentId)) return false;
      if (r.estimateId && ['small', 'supported', 'big'].indexOf(r.estimateId) < 0) return false;
      if (r.featureIds.length > MAX_FEATURES || !r.featureIds.every(function (id) { return featureOf(sc, id); })) return false;
      if (r.revisionId && !find(revisionOptions(r), r.revisionId)) return false;
      if (r.priceId && !find(sc.prices, r.priceId)) return false;
      if (r.channelId && !find(sc.channels, r.channelId)) return false;
      if (r.eventResponseId && !find(eventOf(r).responses, r.eventResponseId)) return false;
      if (typeof r.startupName !== 'string' || r.startupName.length > NAME_MAX) return false;
      // Order matters: a later step can't be done if an earlier one isn't.
      var seenUndone = false;
      for (var i = 0; i < STAGES.length - 1; i++) {
        var d = stageDone(r, STAGES[i]);
        if (d && seenUndone) return false;
        if (!d) seenUndone = true;
      }
      if (r.completedAt && !stageDone(r, 'launch')) return false;
      return true;
    } catch (e) {
      return false;
    }
  }

  return {
    RULES_VERSION: RULES_VERSION,
    SCHEMA_VERSION: SCHEMA_VERSION,
    MAX_FEATURES: MAX_FEATURES,
    INTERVIEWS: INTERVIEWS,
    NAME_MAX: NAME_MAX,
    STAGES: STAGES,
    STAGE_TO_LOCATION: STAGE_TO_LOCATION,
    STAGE_LABEL: STAGE_LABEL,
    content: C,
    rng: rng,
    inr: inr,
    num: num,
    newRun: newRun,
    stageDone: stageDone,
    stageOf: stageOf,
    stepNumber: stepNumber,
    cityStatus: cityStatus,
    canEnter: canEnter,
    scenarioOf: scenarioOf,
    positioningOf: positioningOf,
    segmentOf: segmentOf,
    featureOf: featureOf,
    personaOf: personaOf,
    priceOf: priceOf,
    channelOf: channelOf,
    eventOf: eventOf,
    buildCost: buildCost,
    baseFeatureCost: baseFeatureCost,
    moneyLeftBeforeLaunch: moneyLeftBeforeLaunch,
    cashNow: cashNow,
    eventBudget: eventBudget,
    featureCheck: featureCheck,
    effectiveFeatures: effectiveFeatures,
    product: product,
    unitCostFor: unitCostFor,
    testOutcomes: testOutcomes,
    revisionOptions: revisionOptions,
    revisionPlan: revisionPlan,
    estimateOptions: estimateOptions,
    segmentBacked: segmentBacked,
    interviewHints: interviewHints,
    pricePenalty: pricePenalty,
    priceRanks: priceRanks,
    simulate: simulate,
    score: score,
    insights: insights,
    roundStory: roundStory,
    result: result,
    apply: apply,
    cleanName: cleanName,
    validateRun: validateRun
  };
});
