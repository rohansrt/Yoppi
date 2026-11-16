/* Startup Sprint end-to-end checks in a real browser (Playwright + installed Chrome).
   Plays the scripted dry runs A–E through the UI, checks city navigation, guards,
   resume, accessibility basics and the downloaded PDFs, and saves screenshots.
     npm run test:e2e              (SHOTS=0 to skip screenshots, HEADED=1 to watch) */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { start } = require('./serve.cjs');
const { play, E } = require('../helpers.cjs');

const PORT = Number(process.env.PORT || 8790);
const BASE = `http://127.0.0.1:${PORT}/`;
const OUT = path.resolve(__dirname, '../../qa-artifacts/startup-sprint');
const SHOTS = process.env.SHOTS !== '0';
fs.mkdirSync(OUT, { recursive: true });

const results = [];
function log(name, ok, detail) { results.push({ name, ok, detail }); console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`); }

async function shot(page, name, full = true) {
  if (!SHOTS) return;
  // Full-page captures draw sticky bars at the scroll position, so capture from the top once animations settle.
  if (full) { await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(500); }
  await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: full });
}

async function newPage(browser, mobile) {
  const ctx = await browser.newContext(mobile ? { viewport: { width: 360, height: 760 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); });
  return page;
}

async function scene(page, id) { await page.waitForSelector(`[data-scene="${id}"]`, { timeout: 8000 }); }
async function next(page) { await page.click('[data-testid="next"]'); }
// Compare with the device width itself: mobile browsers widen the layout viewport to fit overflowing content.
async function noOverflow(page) {
  const width = page.viewportSize().width;
  return page.evaluate((w) => document.documentElement.scrollWidth <= w + 1, width);
}

/** Play one run through the UI. plan matches tests/helpers.cjs play() so numbers can be compared. */
async function playUI(page, plan, label) {
  await page.goto(BASE + 'startup-sprint.html?seed=' + plan.seed);
  await page.click(`[data-testid="grade-${plan.grade}"]`);
  // Map interaction 1 of 2: open Idea Park from the city.
  await page.click('[data-testid="spot-idea-park"]');
  await scene(page, 'idea-park');
  if (plan.shots) await shot(page, label + '-03-idea-park-empty');
  await page.click(`[data-testid="story-${plan.scenario}"]`);
  await page.click(`[data-testid="pos-${plan.positioning}"]`);
  if (plan.name != null) await page.fill('[data-testid="name-input"]', plan.name);
  if (plan.shots) await shot(page, label + '-04-idea-park');
  await next(page);
  await scene(page, 'people-street');
  for (const [i, [pid, q]] of plan.interviews.entries()) {
    await page.click(`[data-testid="persona-${pid}"]`);
    await page.click(`[data-testid="ask-${q}"]`);
    if (plan.shots && i === 0) await shot(page, label + '-05-people-street-talk');
    if (i < plan.interviews.length - 1) await page.click('[data-testid="talk-close"]');
  }
  if (plan.shots) await shot(page, label + '-06-people-street-board');
  await next(page);
  await scene(page, 'market-centre');
  await page.click(`[data-testid="seg-${plan.segment}"]`);
  await page.click(`[data-testid="est-${plan.estimate}"]`);
  if (plan.shots) await shot(page, label + '-07-market-centre');
  await next(page);
  await scene(page, 'build-studio');
  for (const f of plan.features) await page.click(`[data-testid="feat-${f}"]`);
  // Try the working preview: open an item and press its main button.
  await page.click('[data-testid="phone"] .ss-ph-row');
  await page.click('[data-testid="pv-action"]');
  if (plan.shots) await shot(page, label + '-08-build-studio');
  await next(page);
  await scene(page, 'build-studio-test');
  if (plan.shots) { await page.waitForTimeout(900); await shot(page, label + '-09-test-corner'); }
  await page.click(`[data-testid="rev-${plan.revision}"]`);
  if (plan.shots) await shot(page, label + '-10-test-corner-after');
  await next(page);
  await scene(page, 'launch-square');
  await page.click(`[data-testid="price-${plan.price}"]`);
  await page.click(`[data-testid="ch-${plan.channel}"]`);
  if (plan.shots) await shot(page, label + '-11-launch-setup');
  await page.click('[data-testid="open-shop"]');
  await page.waitForSelector('[data-testid="card-week1"]');
  if (plan.shots) { await page.waitForTimeout(1700); await shot(page, label + '-12-launch-week1'); }
  const resp = typeof plan.response === 'function' ? plan.response(page) : plan.response;
  await page.click(`[data-testid="resp-${resp}"]`);
  await page.waitForSelector('[data-testid="card-week2"]');
  if (plan.shots) await shot(page, label + '-13-launch-week2');
  await next(page);
  await scene(page, 'founder-hq');
  await page.waitForSelector('[data-testid="report"]');
  if (plan.shots) { await page.waitForTimeout(800); await shot(page, label + '-14-founder-hq-report'); }
}

/** Check a downloaded PDF without any PDF library: header, trailer, xref offsets, pages, text. */
function checkPdf(buf, expect) {
  const s = buf.toString('latin1');
  assert(buf.length > 2000, 'PDF too small: ' + buf.length);
  assert(s.startsWith('%PDF-1.4'), 'missing PDF header');
  assert(/%%EOF\s*$/.test(s), 'missing %%EOF');
  const startxref = Number(/startxref\s+(\d+)/.exec(s)[1]);
  assert(s.slice(startxref, startxref + 4) === 'xref', 'startxref does not point at xref');
  const count = Number(/xref\s+0 (\d+)/.exec(s)[1]);
  const rows = s.slice(startxref).split('\n').slice(3, 3 + count - 1);
  rows.forEach((row, i) => {
    const off = Number(row.slice(0, 10));
    assert(s.slice(off).startsWith(`${i + 1} 0 obj`), `xref entry ${i + 1} is wrong`);
  });
  assert(/\/Type \/Pages \/Kids \[[^\]]+\] \/Count 2/.test(s), 'expected 2 pages');
  // Stream lengths must match.
  for (const m of s.matchAll(/<< \/Length (\d+) >>\nstream\n/g)) {
    const startAt = m.index + m[0].length;
    assert(s.slice(startAt + Number(m[1]), startAt + Number(m[1]) + 10) === '\nendstream', 'stream length mismatch');
  }
  const text = s.match(/\(([^)]*)\) Tj/g).map((t) => t.slice(1, -4)).join(' ');
  for (const needle of expect) assert(text.includes(needle), 'PDF is missing text: ' + needle);
  return { bytes: buf.length };
}

async function downloadPdf(page, file) {
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-testid="download-pdf"]')]);
  const target = path.join(OUT, file);
  await dl.saveAs(target);
  assert(/^YOPPI_Startup_Sprint_[\w-]+\.pdf$/.test(dl.suggestedFilename()), 'bad file name ' + dl.suggestedFilename());
  return { buf: fs.readFileSync(target), name: dl.suggestedFilename(), target };
}

function money(n) { return E.inr(n); }
// In the PDF the ₹ is drawn, so the digits are their own text run; the sign is shown by the label (Profit / Loss).
function pdfMoney(n) { return E.inr(Math.abs(n)).replace('₹', ''); }

/* ------------------------------------------------------------- dry runs */

const RUNS = {
  A: { label: 'run-a-playshare-class7', seed: 1101, grade: '6-8', scenario: 'playshare', positioning: 'bookahead', name: 'GearUp Gang',
    interviews: [['riya', 'past'], ['mrsfernandes', 'past'], ['imran', 'past']], segment: 'families', estimate: 'supported',
    features: ['verified', 'reserve', 'reviews'], revision: 'fix', price: 'high', channel: 'rwa', response: 'fix' },
  B: { label: 'run-b-snackstop-class9', seed: 2202, grade: '9-10', scenario: 'snackstop', positioning: 'quick', name: 'Snack Attack',
    interviews: [['kiran', 'leading'], ['aarav', 'leading'], ['sneha', 'leading']], segment: 'juniors', estimate: 'big',
    features: ['combo', 'classroom'], revision: 'keep', price: 'high', channel: 'posters', response: 'poor' },
  C: { label: 'run-c-giftbox-class12', seed: 3303, grade: '11-12', scenario: 'giftbox', positioning: 'personal', name: 'Little Joys',
    interviews: [['ishaan', 'past'], ['farhan', 'money'], ['zoya', 'past']], segment: 'students', estimate: 'supported',
    features: ['personalise', 'finder', 'wrap'], revision: 'fix', price: 'mid', channel: 'friends', response: 'redo' }
};

(async () => {
  const server = await start(PORT);
  const browser = await chromium.launch({ channel: 'chrome', headless: !process.env.HEADED });
  const dry = {};
  try {
    /* -- Runs A, B, C through the UI, numbers compared with the engine -- */
    for (const key of ['A', 'B', 'C']) {
      const plan = { ...RUNS[key], shots: key === 'A' };
      const page = await newPage(browser);
      // The engine decides which surprise happens; respond with the plan's choice if offered, else the first one.
      const engineRun = play({ ...plan, response: (ev) => (plan.response === 'poor' ? ev.responses[2].id : ev.responses.some((r) => r.id === plan.response) ? plan.response : ev.responses[0].id) });
      plan.response = engineRun.run.eventResponseId;
      await playUI(page, plan, plan.label);
      const r = engineRun.result;
      const shownRevenue = await page.textContent('[data-testid="total-revenue"]').catch(() => null);
      const hud = await page.textContent('[data-testid="hud-sales"]');
      const name = await page.textContent('[data-testid="report-name"]');
      assert.strictEqual(hud.trim(), money(r.revenueINR), 'HUD sales differ from the engine');
      assert.strictEqual((await page.textContent('[data-testid="report-profit"]')).trim(), money(r.profitINR).replace('−', '−'));
      assert.strictEqual(name.trim(), plan.name);
      const pdf = await downloadPdf(page, plan.label + '.pdf');
      checkPdf(pdf.buf, [plan.name, 'All figures are from a fictional simulation; no real sales occurred.', pdfMoney(r.revenueINR), pdfMoney(r.profitINR), r.profitINR < 0 ? 'Loss' : 'Profit']);
      assert.deepStrictEqual(page.errors, [], 'console errors: ' + page.errors.join(' | '));
      dry[key] = { plan: RUNS[key], result: r, event: engineRun.sim.event.id, pdf: pdf.name, shownRevenue };
      log(`Run ${key}: ${plan.scenario}, class ${plan.grade}, UI matches engine, PDF valid`, true,
        `sales ${money(r.revenueINR)}, profit ${money(r.profitINR)}, customers ${r.uniqueCustomers}, repeat ${r.repeatOrders}, score ${r.score} (${r.tier})`);
      if (key === 'A') {
        /* City checks on the finished run A. */
        await page.click('[data-testid="back-to-city"]');
        await page.waitForSelector('[data-testid="city-map"]');
        await shot(page, 'run-a-15-city-finished');
        const states = await page.$$eval('.ss-spot', (els) => els.map((e) => e.className.match(/is-(\w+)/)[1]));
        assert.deepStrictEqual(states, ['done', 'done', 'done', 'done', 'done', 'current']);
        // Revisit a finished place: read-only, but it opens.
        await page.click('[data-testid="spot-people-street"]');
        await scene(page, 'people-street');
        assert.strictEqual(await page.locator('[data-testid="evidence-board"] .ss-slot.is-full').count(), 3);
        log('Finished places can be revisited; Founder HQ is current', true);
      }
      await page.context().close();
    }

    /* -- City navigation, locks, Test Corner, refresh/resume, reset -- */
    {
      const page = await newPage(browser);
      await page.goto(BASE + 'startup-sprint.html?seed=4404');
      await shot(page, 'city-00-welcome', false);
      await page.click('[data-testid="grade-9-10"]');
      await shot(page, 'city-01-overview-desktop');
      const spots = await page.$$eval('.ss-spot', (els) => els.map((e) => [e.dataset.loc, e.getAttribute('aria-label'), e.getAttribute('aria-disabled')]));
      assert.strictEqual(spots.length, 6, 'six landmarks');
      assert(spots[0][1].includes('Current place') && spots.slice(1).every((s) => s[1].includes('Locked') && s[2] === 'true'));
      assert.strictEqual(spots[0][1], 'Idea Park, step 1: Spot It. Current place.');
      assert(spots.every((s, i) => s[1].includes('step ' + (i + 1) + ':')), 'every hotspot names its step');
      const listText = await page.$$eval('.ss-place-text strong', (els) => els.map((e) => e.textContent));
      assert.deepStrictEqual(listText, ['1. Idea Park', '2. People Street', '3. Market Centre', '4. Build Studio', '5. Launch Square', '6. Founder HQ']);
      // Locked hotspot doesn't open, direct URL to a locked place is redirected.
      await page.focus('[data-testid="spot-launch-square"]');
      await page.keyboard.press('Enter');
      assert(await page.isVisible('[data-testid="city-map"]'));
      assert((await page.textContent('.ss-travel-note')).includes('locked'));
      await page.goto(BASE + 'startup-sprint.html?seed=4404#/founder-hq');
      await scene(page, 'idea-park');
      assert((await page.textContent('.ss-notice')).includes('Founder HQ is locked'));
      log('Six hotspots with labels; locked places and direct URLs cannot skip ahead', true);
      // Keyboard: Tab to a hotspot and press Enter.
      await page.goto(BASE + 'startup-sprint.html#/city');
      await page.focus('[data-testid="spot-idea-park"]');
      await page.keyboard.press('Enter');
      await scene(page, 'idea-park');
      log('Hotspots work from the keyboard', true);
      // Play to the Test Corner, then refresh and resume.
      await page.click('[data-testid="story-playshare"]');
      await page.click('[data-testid="pos-local"]');
      await next(page);
      await scene(page, 'people-street');
      for (const [p, q] of [['riya', 'past'], ['tanvi', 'leading'], ['mrgupta', 'money']]) {
        await page.click(`[data-testid="persona-${p}"]`); await page.click(`[data-testid="ask-${q}"]`); await page.click('[data-testid="talk-close"]');
      }
      await next(page);
      await scene(page, 'market-centre');
      await page.click('[data-testid="seg-students"]');
      await page.click('[data-testid="est-small"]');
      await next(page);
      await scene(page, 'build-studio');
      await page.click('[data-testid="feat-reserve"]');
      await next(page);
      await scene(page, 'build-studio-test');
      assert.strictEqual(await page.$$eval('.ss-spot', (e) => e.length), 0);
      const hash = await page.evaluate(() => location.hash);
      assert.strictEqual(hash, '#/build-studio/test', 'Test Corner is a room inside Build Studio');
      await page.reload();
      await scene(page, 'build-studio-test');
      log('Refresh restores the same place and room (Build Studio › Test Corner)', true);
      await page.goto(BASE + 'startup-sprint.html#/city');
      await page.waitForSelector('[data-testid="city-map"]');
      await shot(page, 'city-02-midgame-desktop');
      const st = await page.$$eval('.ss-spot', (els) => els.map((e) => e.className.match(/is-(\w+)/)[1]));
      assert.deepStrictEqual(st, ['done', 'done', 'done', 'current', 'locked', 'locked']);
      // Going back to an earlier place and changing a choice warns before clearing later steps.
      await page.click('[data-testid="spot-market-centre"]');
      await scene(page, 'market-centre');
      await page.click('[data-testid="seg-families"]');
      await page.waitForSelector('[data-testid="confirm"]');
      await shot(page, 'city-03-change-warning', false);
      await page.click('[data-testid="confirm-yes"]');
      assert((await page.textContent('.ss-notice')).includes('later choices may change'));
      log('Changing an earlier choice warns and recalculates', true);
      // Welcome back on a fresh visit; then Start over needs a confirmation.
      await page.goto(BASE + 'startup-sprint.html');
      await page.waitForSelector('[data-testid="resume"]');
      assert((await page.textContent('[data-testid="welcome"]')).includes('Build Studio'));
      await page.click('text=Start over');
      await page.waitForSelector('[data-testid="confirm"]');
      await page.click('[data-testid="confirm-yes"]');
      await page.waitForSelector('[data-testid="grade-6-8"]');
      log('Resume prompt on return; Start over asks first', true);
      // Old or broken saves are ignored with a notice, not a crash.
      await page.evaluate(() => localStorage.setItem('yoppi.startupSprint.v1', JSON.stringify({ schemaVersion: 0, current: { schemaVersion: 0, seed: 1 } })));
      await page.reload();
      await page.waitForSelector('[data-testid="grade-6-8"]');
      await page.evaluate(() => localStorage.setItem('yoppi.startupSprint.v1', '{not json'));
      await page.reload();
      await page.waitForSelector('[data-testid="grade-6-8"]');
      assert.deepStrictEqual(page.errors, []);
      log('Old-schema and corrupt saves fall back safely', true);
      await page.context().close();
    }

    /* -- Run D: budget guard -- */
    {
      const page = await newPage(browser);
      await page.goto(BASE + 'startup-sprint.html?seed=5505');
      await page.click('[data-testid="grade-9-10"]');
      await page.click('[data-testid="spot-idea-park"]');
      await page.click('[data-testid="story-playshare"]');
      await page.click('[data-testid="pos-bookahead"]');
      await next(page);
      await scene(page, 'people-street');
      for (const [p, q] of [['riya', 'past'], ['imran', 'past'], ['mrsfernandes', 'money']]) {
        await page.click(`[data-testid="persona-${p}"]`); await page.click(`[data-testid="ask-${q}"]`); await page.click('[data-testid="talk-close"]');
      }
      await next(page);
      await page.click('[data-testid="seg-groups"]');
      await page.click('[data-testid="est-supported"]');
      await next(page);
      await scene(page, 'build-studio');
      // Try to buy everything, most expensive first.
      const blocked = [];
      for (const f of ['delivery', 'verified', 'reserve', 'payment', 'reviews', 'discount']) {
        const sel = `[data-testid="feat-${f}"]`;
        const reason = await page.locator(sel + ' .ss-choice-reason').textContent().catch(() => null);
        if (reason) blocked.push(f + ': ' + reason);
        if (reason && reason.includes('Too expensive')) await shot(page, 'run-d-budget-guard');
        await page.click(sel, { force: true });
        if (reason) assert.strictEqual(await page.getAttribute(sel, 'aria-checked'), 'false', f + ' was blocked but got selected');
      }
      const chosen = await page.$$eval('.ss-choice[data-act="feature"][aria-checked="true"]', (els) => els.map((e) => e.dataset.id));
      assert(blocked.some((t) => t.includes('Too expensive')), 'budget guard shown: ' + blocked.join('|'));
      assert(chosen.length <= 3);
      const left = await page.textContent('[data-testid="budget"] strong');
      await next(page);
      await scene(page, 'build-studio-test');
      await page.click('[data-testid="rev-simplify"]');
      await next(page);
      await page.click('[data-testid="price-mid"]');
      await page.click('[data-testid="ch-friends"]');
      await page.click('[data-testid="open-shop"]');
      await page.click('.ss-event [data-act="response"]:not([aria-disabled="true"])');
      await next(page);
      await scene(page, 'founder-hq');
      const st = await page.evaluate(() => window.YOPPI_SS_APP.state().current);
      const res = E.result(st);
      dry.D = { chosen, blocked: blocked.filter((t) => t.includes('Too expensive')).length, left, result: res };
      log('Run D: budget guard blocks overspending and the run still finishes', true, `kept ${chosen.join(' + ')}, ${left.split(' of')[0]} left; sales ${money(res.revenueINR)}, profit ${money(res.profitINR)}`);
      await page.context().close();
    }

    /* -- Run E: long name, zero sales, loss, PDF on a 360px phone -- */
    {
      const page = await newPage(browser, true);
      const plan = { seed: 6606, grade: '11-12', scenario: 'giftbox', positioning: 'eco', name: 'The Super Amazing Eco Gift Factory Of Lakeview',
        interviews: [['nani', 'leading'], ['ishaan', 'leading'], ['farhan', 'leading']], segment: 'parents', estimate: 'big',
        features: ['wrap'], revision: 'keep', price: 'high', channel: 'friends', response: null };
      const engineRun = play({ ...plan, response: (ev) => ev.responses[2].id });
      plan.response = engineRun.run.eventResponseId;
      await page.goto(BASE + 'startup-sprint.html?seed=' + plan.seed);
      await shot(page, 'mobile-00-welcome', false);
      await page.click(`[data-testid="grade-${plan.grade}"]`);
      await shot(page, 'mobile-01-city-overview');
      assert(await noOverflow(page), 'city overflows at 360px');
      const listShown = await page.isVisible('[data-testid="list-idea-park"]');
      assert(listShown, 'location list is visible on mobile');
      const spotBox = await page.locator('[data-testid="spot-market-centre"]').boundingBox();
      assert(spotBox.width >= 44 && spotBox.height >= 44, 'hotspots are at least 44px');
      // Map interaction via the accessible list on a phone.
      await page.click('[data-testid="list-idea-park"]');
      await scene(page, 'idea-park');
      await page.click(`[data-testid="story-${plan.scenario}"]`);
      await page.click(`[data-testid="pos-${plan.positioning}"]`);
      await page.fill('[data-testid="name-input"]', plan.name);
      assert(await noOverflow(page), 'idea park overflows');
      await next(page);
      await scene(page, 'people-street');
      for (const [p, q] of plan.interviews) {
        await page.click(`[data-testid="persona-${p}"]`); await page.click(`[data-testid="ask-${q}"]`);
        if (p === 'nani') await shot(page, 'mobile-02-people-street');
        await page.click('[data-testid="talk-close"]');
      }
      assert(await noOverflow(page), 'people street overflows');
      await next(page);
      await scene(page, 'market-centre');
      await page.click(`[data-testid="seg-${plan.segment}"]`);
      await page.click(`[data-testid="est-${plan.estimate}"]`);
      assert(await noOverflow(page), 'market overflows');
      await next(page);
      await scene(page, 'build-studio');
      for (const f of plan.features) await page.click(`[data-testid="feat-${f}"]`);
      await shot(page, 'mobile-03-build-studio');
      assert(await noOverflow(page), 'build studio overflows');
      await next(page);
      await scene(page, 'build-studio-test');
      await page.click(`[data-testid="rev-${plan.revision}"]`);
      await page.waitForTimeout(1200);
      await shot(page, 'mobile-04-test-corner');
      assert(await noOverflow(page), 'test corner overflows');
      await next(page);
      await scene(page, 'launch-square');
      await page.click(`[data-testid="price-${plan.price}"]`);
      await page.click(`[data-testid="ch-${plan.channel}"]`);
      await page.click('[data-testid="open-shop"]');
      await page.click(`[data-testid="resp-${plan.response}"]`);
      await page.waitForTimeout(1500);
      await shot(page, 'mobile-05-launch-square');
      assert(await noOverflow(page), 'launch overflows');
      await next(page);
      await scene(page, 'founder-hq');
      await page.waitForTimeout(800);
      await shot(page, 'mobile-06-founder-hq-report');
      assert(await noOverflow(page), 'report overflows');
      const r = engineRun.result;
      assert.strictEqual(r.revenueINR, 0, 'run E should have zero sales');
      assert(r.profitINR < 0, 'run E should make a loss');
      const zeroText = await page.textContent('[data-testid="report"]');
      assert(zeroText.includes('Your customers didn’t buy this time'));
      const pdf = await downloadPdf(page, 'run-e-zero-sales-mobile.pdf');
      checkPdf(pdf.buf, ['The Super Amazing Eco Gift Fac', 'No sales this time', pdfMoney(r.profitINR), 'Loss', 'All figures are from a fictional simulation; no real sales occurred.']);
      assert.deepStrictEqual(page.errors, []);
      dry.E = { name: plan.name, saved: E.cleanName(plan.name), result: r, pdf: pdf.name, bytes: pdf.buf.length };
      log('Run E: long name, zero sales and a loss still give a full report and a valid PDF at 360px', true, `name kept as “${E.cleanName(plan.name)}”, sales ${money(r.revenueINR)}, loss ${money(r.profitINR)}, ${pdf.name} (${pdf.buf.length} bytes)`);
      // View my last report after starting a new game.
      await page.click('[data-testid="play-again"]');
      await page.click('[data-testid="confirm-yes"]');
      await page.click('[data-testid="welcome"] a[href="#/last-report"]');
      await page.waitForSelector('[data-testid="report"]');
      assert.strictEqual((await page.textContent('[data-testid="report-name"]')).trim(), E.cleanName(plan.name));
      log('Play again keeps the saved report; “View my last report” reopens it', true);
      await page.context().close();
    }

    /* -- 6–8 vs 11–12 content density -- */
    {
      const page = await newPage(browser);
      for (const [grade, segs, analytic] of [['6-8', 2, false], ['11-12', 3, true]]) {
        await page.goto(BASE + 'startup-sprint.html?seed=7707');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await page.click(`[data-testid="grade-${grade}"]`);
        await page.click('[data-testid="spot-idea-park"]');
        await page.click('[data-testid="story-snackstop"]');
        await page.click('[data-testid="pos-healthy"]');
        await next(page);
        for (const [p, q] of [['aarav', 'past'], ['priya', 'past'], ['mrdsouza', 'past']]) {
          await page.click(`[data-testid="persona-${p}"]`); await page.click(`[data-testid="ask-${q}"]`); await page.click('[data-testid="talk-close"]');
        }
        await next(page);
        await scene(page, 'market-centre');
        const n = await page.locator('[data-act="segment"]').count();
        assert.strictEqual(n, segs, `class ${grade} sees ${segs} groups`);
        await page.click('[data-testid="seg-juniors"]');
        const autoHint = await page.locator('aside.ss-hint').count();
        const tapHint = await page.locator('details.ss-hint').count();
        assert(grade === '6-8' ? autoHint > 0 && tapHint === 0 : tapHint > 0, 'hints: 6–8 shown automatically, others on tap');
        const txt = await page.textContent('[data-testid="card-segment"]');
        assert.strictEqual(txt.includes('Likely to buy again'), analytic);
      }
      log('Class bands: 6–8 gets 2 groups and hints shown; 11–12 gets 3 groups plus repeat-buyer data', true);
      await page.context().close();
    }

    /* -- Reduced motion: no travel animation, everything still works -- */
    {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      await page.goto(BASE + 'startup-sprint.html?seed=8808');
      await page.click('[data-testid="grade-6-8"]');
      await page.click('[data-testid="spot-idea-park"]');
      await page.click('[data-testid="story-giftbox"]');
      await page.click('[data-testid="pos-eco"]');
      const t0 = Date.now();
      await next(page);
      await scene(page, 'people-street');
      assert(Date.now() - t0 < 1500, 'goes straight to the next place without the walk');
      const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect.getComputedTiming().iterations === Infinity).length);
      assert.strictEqual(running, 0, 'no looping animations with reduced motion');
      log('Reduced motion: no travel animation or looping effects; the game still advances', true);
      await ctx.close();
    }

    /* -- Regression: other YOPPI pages and the entry CTA -- */
    {
      const page = await newPage(browser);
      for (const p of ['index.html', 'offerings.html#schools', 'future-skills-lab.html', 'contact.html']) {
        await page.goto(BASE + p);
        await page.waitForSelector('.site-header');
        await page.waitForSelector('.site-footer');
      }
      await page.goto(BASE + 'offerings.html#schools');
      const cards = await page.$$eval('[data-offering]', (els) => els.map((e) => e.dataset.offering));
      for (const c of ['career-simulator', 'scenario-learning', 'future-skills-lab', 'startup-sprint', 'growwell']) assert(cards.includes(c), 'missing card ' + c);
      await page.click('[data-offering="startup-sprint"]');
      await page.waitForSelector('.offer-dialog[open]');
      await shot(page, 'entry-01-offering-dialog', false);
      const href = await page.getAttribute('.offer-dialog .dialog-foot a.btn', 'href');
      assert.strictEqual(href, 'startup-sprint.html');
      const career = await page.$eval('[data-offering="career-simulator"]', (e) => e.getAttribute('aria-label'));
      assert(career.includes('live'));
      await page.click('.offer-dialog .dialog-foot a.btn');
      await page.waitForSelector('[data-testid="welcome"]');
      assert.deepStrictEqual(page.errors, []);
      log('Existing pages load; the Startup Sprint card opens the simulator; Career Simulator card unchanged', true);
      await page.context().close();
    }
  } catch (err) {
    log('E2E failure', false, err.stack || String(err));
    process.exitCode = 1;
  } finally {
    fs.writeFileSync(path.join(OUT, 'dry-runs.json'), JSON.stringify(dry, null, 2));
    await browser.close();
    server.close();
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed} passed, ${failed} failed. Artifacts in ${path.relative(process.cwd(), OUT)}`);
})();
