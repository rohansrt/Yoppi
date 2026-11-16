/* YOPPI Startup Sprint: the report model. One plain object, built only from the run,
   that both the on-screen report and the PDF draw from. */
(function (root, factory) {
  var E = root && root.YOPPI_SS_ENGINE;
  if (!E && typeof require === 'function') E = require('./engine.js');
  var api = factory(E);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.YOPPI_SS_REPORT = api;
})(typeof self !== 'undefined' ? self : this, function (E) {
  'use strict';
  var C = E.content;
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function model(r) {
    var res = E.result(r);
    var sc = E.scenarioOf(r);
    var seg = E.segmentOf(r);
    var pos = E.positioningOf(r);
    var ids = E.effectiveFeatures(r);
    var T = C.TERMS[r.grade] || C.TERMS['9-10'];
    var feats = ids.map(function (id) { return E.featureOf(sc, id); });
    var est = E.estimateOptions(r).filter(function (o) { return o.verdict === 'good'; })[0];
    var price = E.priceOf(r), ch = E.channelOf(r), ev = E.eventOf(r);
    var resp = ev.responses.filter(function (x) { return x.id === r.eventResponseId; })[0];
    var people = r.interviews.map(function (iv) { return E.personaOf(sc, iv.personaId).name; });
    var plan = E.revisionPlan(r);
    var tests = E.testOutcomes(r);
    var d = r.completedAt && r.completedAt !== 'done' ? new Date(r.completedAt) : null;
    var date = d && !isNaN(d) ? d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear() : '';
    return {
      startupName: r.startupName,
      emoji: sc.emoji,
      scenarioTitle: sc.title,
      kind: sc.kind,
      description: r.startupName + ' ' + pos.describe + '.',
      problem: sc.problem,
      helps: seg.name,
      why: 'Chosen at Idea Park: ' + sc.story.who + '’s problem (“' + sc.story.line + '”), solved with ' + pos.title.toLowerCase() + '.',
      featureNames: [sc.core.name].concat(feats.map(function (f) { return f.name; })),
      featureIcons: ['🧱'].concat(feats.map(function (f) { return f.icon; })),
      valueProp: 'Built for ' + seg.short + '. Today they: ' + seg.alternative.charAt(0).toLowerCase() + seg.alternative.slice(1) + '. ' + r.startupName + ' ' + pos.describe + '.',
      previewItems: sc.preview.items.map(function (it) { return it.name; }),
      appTitle: sc.preview.app,
      price: price.amount, priceUnit: sc.priceUnit,
      terms: T,
      grade: r.grade,
      gradeLabel: C.GRADES.filter(function (g) { return g.id === r.grade; })[0].label,
      result: res,
      journey: [
        { place: 'Idea Park', did: 'Found a problem', detail: sc.problem },
        { place: 'People Street', did: 'Asked people', detail: 'Talked to ' + people.join(', ') },
        { place: 'Market Centre', did: 'Checked market', detail: 'Chose ' + seg.short + '; about ' + E.num(est.value) + ' might need it' },
        { place: 'Build Studio', did: 'Built and tested', detail: feats.length + ' extra feature' + (feats.length === 1 ? '' : 's') + '; ' + tests.orders + ' of 3 testers ordered after the change: ' + (plan ? plan.label.replace(/“|”/g, '') : 'none') },
        { place: 'Launch Square', did: 'Sold', detail: E.inr(price.amount) + ' price · ' + ch.name + ' · ' + (resp ? resp.label : '') },
        { place: 'Founder HQ', did: 'Reviewed', detail: res.tier }
      ],
      eventTitle: ev.title,
      date: date,
      versions: E.RULES_VERSION + ' · ' + C.CONTENT_VERSION + ' · seed ' + r.seed,
      weekStories: res.rounds.map(function (x) { return E.roundStory(x, sc.unitLabel); }),
      unitLabel: sc.unitLabel
    };
  }

  return { model: model };
});
