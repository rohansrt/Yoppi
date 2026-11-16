/* Shared test helper: play a whole Startup Sprint run through the engine's actions. */
const E = require('../assets/js/startup-sprint/engine.js');

function play(p) {
  let run = E.newRun({ seed: p.seed ?? 42, grade: p.grade ?? '9-10', now: '2026-11-16T10:00:00.000Z' });
  const steps = [];
  const act = (a) => {
    const out = E.apply(run, a);
    if (out.error && !p.allowErrors) throw new Error(a.type + ': ' + out.error);
    steps.push({ a, error: out.error });
    run = out.run;
    return out;
  };
  act({ type: 'pickScenario', id: p.scenario });
  act({ type: 'pickPositioning', id: p.positioning });
  if (p.name != null) act({ type: 'setName', name: p.name });
  act({ type: 'finishIdea' });
  if (p.stopAt === 'interview') return { run, steps };
  for (const [personaId, questionId] of p.interviews) act({ type: 'talk', personaId, questionId });
  act({ type: 'finishInterviews' });
  act({ type: 'pickSegment', id: p.segment });
  act({ type: 'pickEstimate', id: p.estimate });
  if (p.stopAt === 'build') return { run, steps };
  for (const f of p.features) act({ type: 'toggleFeature', id: f });
  act({ type: 'build' });
  act({ type: 'markTested' });
  act({ type: 'pickRevision', id: p.revision });
  act({ type: 'pickPrice', id: p.price });
  act({ type: 'pickChannel', id: p.channel });
  act({ type: 'openShop' });
  if (p.stopAt === 'event') return { run, steps };
  const ev = E.eventOf(run);
  const resp = typeof p.response === 'function' ? p.response(ev) : p.response;
  act({ type: 'pickEventResponse', id: resp, now: '2026-11-16T10:25:00.000Z' });
  return { run, steps, result: E.result(run), sim: E.simulate(run) };
}

module.exports = { E, play };
