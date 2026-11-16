/* YOPPI Startup Sprint: the Startup City game. Vanilla JS, no dependencies.
   State lives in one run object (engine.js); this file only renders it and sends actions. */
(function () {
  'use strict';

  var E = window.YOPPI_SS_ENGINE;
  var C = E.content;
  var CITY = window.YOPPI_SS_CITY;
  var STORE_KEY = 'yoppi.startupSprint.v1';
  var root = document.getElementById('ss-app');
  if (!root || !E || !CITY) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LOC = {};
  C.LOCATIONS.forEach(function (l, i) { LOC[l.id] = Object.assign({ step: i + 1 }, l); });

  /* ------------------------------------------------------------- utilities */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var inr = E.inr;
  function signedInr(n) { return (n > 0 ? '+' : '') + inr(n); }
  function icon(name, cls) {
    var paths = Object.assign({}, CITY.ICONS, {
      arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
      arrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
      map: '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>',
      list: '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
      help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
      download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
      printer: '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
      refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
      x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
      wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
      users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
      sparkle: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>'
    });
    return '<svg class="icon ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || '') + '</svg>';
  }
  function avatar(p, size) {
    return '<span class="ss-avatar ss-tone-' + esc(p.tone || 'slate') + (size ? ' ss-avatar-' + size : '') + '" aria-hidden="true">' + esc(p.initials) + '</span>';
  }
  function seedFromUrl() {
    var m = /[?&]seed=(\d{1,9})/.exec(location.search);
    return m ? Number(m[1]) : null;
  }
  function newSeed() {
    var fromUrl = seedFromUrl();
    if (fromUrl != null) return fromUrl;
    try {
      var a = new Uint32Array(1);
      window.crypto.getRandomValues(a);
      return a[0] % 1000000000;
    } catch (e) {
      return Date.now() % 1000000000;
    }
  }

  /* ------------------------------------------------------------ persistence */

  var storageOk = true;
  function emptyStore() { return { schemaVersion: E.SCHEMA_VERSION, current: null, last: null, prefs: { view: 'map' } }; }
  function load() {
    var raw = null;
    try { raw = window.localStorage.getItem(STORE_KEY); } catch (e) { storageOk = false; return emptyStore(); }
    if (!raw) return emptyStore();
    try {
      var s = JSON.parse(raw);
      var out = emptyStore();
      if (s && s.prefs && (s.prefs.view === 'map' || s.prefs.view === 'list')) out.prefs.view = s.prefs.view;
      if (s && s.current && E.validateRun(s.current)) out.current = s.current;
      else if (s && s.current) out.notice = 'We couldn’t read your saved game (it was from an older version), so you’re starting fresh.';
      if (s && s.last && s.last.run && E.validateRun(s.last.run) && s.last.run.completedAt) out.last = { run: s.last.run, savedAt: s.last.savedAt || null };
      return out;
    } catch (e) {
      var fresh = emptyStore();
      fresh.notice = 'We couldn’t read your saved game, so you’re starting fresh.';
      return fresh;
    }
  }
  function save() {
    if (!storageOk) return;
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify({ schemaVersion: E.SCHEMA_VERSION, current: store.current, last: store.last, prefs: store.prefs }));
    } catch (e) {
      storageOk = false;
      say('Saving is switched off in this browser, so your game won’t be kept after you close the page.');
    }
  }

  var store = load();
  var ui = {
    route: null, lastRoute: null, talkingTo: null, travel: null, confirm: null, notice: store.notice || null,
    preview: { screen: 'list', item: 0, msg: null }, anim: {}, helpOpen: false, welcomeOpen: false, hudOpen: false,
    error: null, pdfStatus: null, viewingLast: false
  };

  function run() { return store.current; }

  /* -------------------------------------------------------------- actions */

  var live = null;
  function say(msg) { if (live) { live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 30); } }

  function dispatch(action, opts) {
    opts = opts || {};
    var r = run();
    if (!r) return;
    var out = E.apply(r, action);
    if (out.error) { ui.error = out.error; say(out.error); render(); return out; }
    if ((out.cleared.length || out.recalc) && !opts.confirmed) {
      ui.confirm = { action: action, cleared: out.cleared };
      render();
      return out;
    }
    store.current = out.run;
    if (out.recalc || out.cleared.length) ui.notice = 'Your later choices may change. Results are worked out again from your new choice.';
    ui.error = null;
    if (out.run.completedAt && !r.completedAt) {
      store.last = { run: out.run, savedAt: new Date().toISOString() };
    }
    save();
    if (opts.anim) ui.anim[opts.anim] = true;
    if (opts.say) say(opts.say);
    render();
    return out;
  }

  function startRun(grade) {
    var r = E.newRun({ seed: newSeed(), grade: grade, now: new Date().toISOString() });
    store.current = r;
    ui.talkingTo = null;
    ui.preview = { screen: 'list', item: 0, msg: null };
    ui.notice = null;
    save();
  }

  /* --------------------------------------------------------------- routing */

  function parseRoute() {
    var h = (location.hash || '').replace(/^#\/?/, '');
    if (!h || h === 'city') return { name: 'city' };
    if (h === 'build-studio/test') return { name: 'loc', loc: 'build-studio', room: 'test' };
    if (h === 'last-report') return { name: 'last' };
    if (LOC[h]) return { name: 'loc', loc: h };
    return { name: 'city' };
  }
  function go(hash) {
    if (location.hash === hash) { onRoute(); return; }
    location.hash = hash;
  }

  function currentLocation(r) { return E.STAGE_TO_LOCATION[E.stageOf(r)] || 'idea-park'; }

  function onRoute() {
    var route = parseRoute();
    var r = run();
    if (route.name === 'loc') {
      if (!r || !r.grade) { go('#/city'); return; }
      if (!E.canEnter(r, route.loc)) {
        var here = LOC[currentLocation(r)];
        ui.notice = LOC[route.loc].name + ' is locked. Finish ' + here.name + ' first.';
        go('#/' + here.id);
        return;
      }
      if (route.room === 'test' && !r.built) { go('#/build-studio'); return; }
      if (route.loc === 'build-studio' && !route.room && r.built && E.stageOf(r) === 'test' && ui.lastRoute && ui.lastRoute.name === 'city') {
        go('#/build-studio/test');
        return;
      }
      if (route.room === 'test' && !r.tested) store.current = E.apply(r, { type: 'markTested' }).run, save();
    }
    if (route.name === 'last' && !store.last) { go('#/city'); return; }
    ui.lastRoute = ui.route;
    ui.route = route;
    ui.error = null;
    ui.talkingTo = null;
    if (route.name === 'loc' && route.loc === 'build-studio') ui.preview = { screen: 'list', item: 0, msg: null };
    render({ scrollTop: true });
    if (route.name === 'loc') {
      var l = LOC[route.loc];
      document.title = l.name + ' · Startup Sprint · YOPPI';
      say('Now at ' + l.name + ', step ' + l.step + ' of 6' + (route.room === 'test' ? ', Test Corner' : '') + '.');
    } else {
      document.title = 'Startup Sprint · YOPPI';
    }
  }

  /** Go to the next place, via a short walk across the city. */
  function travelTo(locId) {
    var r = run();
    var from = ui.route && ui.route.loc;
    if (from && from !== locId && !reduceMotion) {
      ui.travel = { from: from, to: locId };
      go('#/city');
      say('Walking to ' + LOC[locId].name + '.');
      var token = ui.travel;
      setTimeout(function () {
        if (ui.travel === token) { ui.travel = null; go('#/' + locId); }
      }, 1700);
    } else {
      ui.travel = null;
      go('#/' + locId);
    }
    return r;
  }

  /* ------------------------------------------------------------------- HUD */

  function hud(r) {
    var stage = E.stageOf(r);
    var sc = E.scenarioOf(r);
    var status = r ? E.cityStatus(r) : {};
    var here = ui.route && ui.route.name === 'loc' ? LOC[ui.route.loc] : null;
    var step = here ? here.step : (r ? E.stepNumber(r) : 1);
    var trail = C.LOCATIONS.map(function (l) {
      var st = status[l.id] || (l.id === 'idea-park' ? 'current' : 'locked');
      var label = l.name + ': ' + (st === 'done' ? 'done' : st === 'current' ? 'current' : 'locked');
      return '<li class="ss-trail-dot is-' + st + (here && here.id === l.id ? ' is-here' : '') + '" title="' + esc(label) + '"><span class="sr-only">' + esc(label) + '</span></li>';
    }).join('');
    var chips = '';
    if (sc && r.ideaDone) {
      chips += '<span class="ss-chip ss-chip-name"><span aria-hidden="true">' + sc.emoji + '</span> ' + esc(r.startupName) + '</span>';
      var cash = E.cashNow(r);
      chips += '<span class="ss-chip ss-chip-cash' + (cash < 0 ? ' is-neg' : '') + '" tabindex="0" aria-describedby="ss-cash-tip">' + icon('wallet') +
        '<span>Money left <strong data-testid="hud-cash">' + inr(cash) + '</strong></span>' +
        '<span role="tooltip" id="ss-cash-tip" class="ss-tip">Money available to build and run your shop. It’s pretend money.</span></span>';
    }
    if (r && r.opened) {
      var sim = E.simulate(r, { rounds: r.eventResponseId ? 2 : 1 });
      chips += '<span class="ss-chip">' + icon('users') + '<span>Customers <strong data-testid="hud-customers">' + sim.uniqueCustomers + '</strong></span></span>';
      chips += '<span class="ss-chip"><span>Virtual sales <strong data-testid="hud-sales">' + inr(sim.revenueINR) + '</strong></span></span>';
      chips += '<span class="ss-chip ' + (sim.profitINR < 0 ? 'is-neg' : 'is-pos') + '"><span>' + (sim.profitINR < 0 ? 'Loss' : 'Profit') + ' <strong data-testid="hud-profit">' + inr(sim.profitINR) + '</strong></span></span>';
    }
    return (
      '<div class="ss-hud" role="region" aria-label="Game status">' +
        '<div class="ss-hud-main">' +
          '<a class="ss-hud-title" href="#/city">' + icon('map') + '<span><strong>Startup City</strong><small>YOPPI Startup Sprint</small></span></a>' +
          '<div class="ss-hud-step"><span data-testid="hud-step">Step ' + step + ' of 6' + (here ? '<span class="ss-hud-loc"> · ' + esc(here.name) + '</span>' : '') + '</span><ol class="ss-trail" aria-label="Journey progress">' + trail + '</ol></div>' +
          (chips ? '<button type="button" class="ss-hud-more" data-act="toggle-hud" aria-expanded="' + ui.hudOpen + '" aria-controls="ss-hud-chips">' + (ui.hudOpen ? 'Hide' : 'Status') + '</button>' : '') +
          '<button type="button" class="ss-icon-btn" data-act="help" aria-label="Help">' + icon('help', 'icon-lg') + '</button>' +
        '</div>' +
        (chips ? '<div class="ss-hud-chips' + (ui.hudOpen ? ' is-open' : '') + '" id="ss-hud-chips">' + chips + '</div>' : '') +
      '</div>'
    );
  }

  /* ------------------------------------------------------------------ city */

  function cityView(r) {
    var status = r && r.grade ? E.cityStatus(r) : { 'idea-park': 'current', 'people-street': 'locked', 'market-centre': 'locked', 'build-studio': 'locked', 'launch-square': 'locked', 'founder-hq': 'locked' };
    var sc = E.scenarioOf(r);
    var sim = r && r.opened ? E.simulate(r, { rounds: r.eventResponseId ? 2 : 1 }) : null;
    var tests = r && r.tested ? E.testOutcomes(r).testers.map(function (t) { return t.ok; }) : null;
    var tones = {}, icons = {};
    C.LOCATIONS.forEach(function (l) { tones[l.id] = l.tone; icons[l.id] = l.icon; });
    var done = Object.keys(status).filter(function (k) { return status[k] === 'done'; });
    var view = {
      status: status, tones: tones, icons: icons, done: done,
      scenario: r && r.ideaDone ? sc : (r && r.scenarioId ? sc : null),
      interviews: r ? r.interviews.length : 0,
      segment: r ? E.segmentOf(r) : null,
      features: r ? (r.built ? E.effectiveFeatures(r).length : r.featureIds.length) : 0,
      testers: tests,
      shopName: r && r.priceId && r.channelId ? r.startupName : (r && r.opened ? r.startupName : null),
      opened: !!(r && r.opened),
      customers: sim ? Math.ceil(sim.uniqueCustomers / 6) : 0,
      travel: ui.travel, reduceMotion: reduceMotion
    };
    var spots = C.LOCATIONS.map(function (l) {
      var st = status[l.id];
      var pos = CITY.hotspot(l.id);
      var stateLabel = st === 'current' ? 'You are here next' : st === 'done' ? 'Done, visit again' : 'Locked';
      var aria = l.name + ', step ' + LOC[l.id].step + ': ' + l.chapter + '. ' + (st === 'current' ? 'Current place.' : st === 'done' ? 'Done. You can visit again.' : 'Locked. Coming next.');
      return '<button type="button" class="ss-spot is-' + st + '" data-act="enter" data-loc="' + l.id + '" style="left:' + pos.left.toFixed(2) + '%;top:' + pos.top.toFixed(2) + '%;width:' + pos.width.toFixed(2) + '%;height:' + pos.height.toFixed(2) + '%" aria-label="' + esc(aria) + '"' + (st === 'locked' ? ' aria-disabled="true"' : '') + ' data-testid="spot-' + l.id + '">' +
        '<span class="ss-spot-label"><strong>' + esc(l.name) + '</strong><small>' + esc(st === 'locked' ? 'Locked · Coming next' : stateLabel) + '</small></span></button>';
    }).join('');
    var nextLoc = r && r.grade ? currentLocation(r) : 'idea-park';
    var next = LOC[nextLoc];
    var travelNote = ui.travel ? '<p class="ss-travel-note" role="status">Walking to <strong>' + esc(LOC[ui.travel.to].name) + '</strong>…</p>' : '';
    var nextCard;
    if (r && r.completedAt) {
      nextCard = '<div class="ss-next-card is-hq"><div><p class="ss-eyebrow">Founder HQ is open</p><h2>Your startup report is ready.</h2><p>' + esc(r.startupName) + ' finished two weeks of trading.</p></div>' +
        '<div class="ss-btn-row"><a class="btn btn-primary btn-lg" href="#/founder-hq" data-testid="city-next">' + icon('trophy') + 'Open my report</a><button type="button" class="btn btn-secondary btn-lg" data-act="play-again">' + icon('refresh') + 'Play again</button></div></div>';
    } else if (r && r.grade) {
      nextCard = '<div class="ss-next-card"><div><p class="ss-eyebrow">Next stop · Step ' + next.step + ' of 6</p><h2>' + esc(next.name) + ': ' + esc(next.verb) + '</h2><p>' + esc(nextBlurb(nextLoc)) + '</p></div>' +
        '<div class="ss-btn-row"><a class="btn btn-primary btn-lg" href="#/' + next.id + '" data-testid="city-next">Go to ' + esc(next.name) + icon('arrowRight', 'icon-nudge') + '</a></div></div>';
    } else {
      nextCard = '<div class="ss-next-card"><div><p class="ss-eyebrow">Start here</p><h2>Idea Park: find a problem</h2><p>Every business starts with a problem people face.</p></div>' +
        '<div class="ss-btn-row"><button type="button" class="btn btn-primary btn-lg" data-act="welcome">Start playing' + icon('arrowRight', 'icon-nudge') + '</button></div></div>';
    }
    var list = C.LOCATIONS.map(function (l) {
      var st = status[l.id];
      var badge = st === 'current' ? '<span class="ss-state is-current">● Now</span>' : st === 'done' ? '<span class="ss-state is-done">✓ Done</span>' : '<span class="ss-state is-locked">🔒 Locked</span>';
      var inner = '<span class="ss-place-icon ss-tone-' + l.tone + '">' + icon(l.icon) + '</span><span class="ss-place-text"><strong>' + LOC[l.id].step + '. ' + esc(l.name) + '</strong><small>' + esc(l.chapter) + '</small></span>' + badge;
      return '<li>' + (st === 'locked'
        ? '<button type="button" class="ss-place is-locked" data-act="enter" data-loc="' + l.id + '" aria-disabled="true">' + inner + '</button>'
        : '<a class="ss-place is-' + st + '" href="#/' + l.id + '" data-testid="list-' + l.id + '">' + inner + '</a>') + '</li>';
    }).join('');
    var last = store.last && (!r || !r.completedAt || store.last.run.id !== r.id)
      ? '<p class="ss-last-link"><a href="#/last-report">' + icon('trophy') + 'View my last report (' + esc(store.last.run.startupName) + ')</a></p>' : '';
    return (
      '<section class="ss-city' + (isNewScene() ? ' ss-enter' : '') + '" aria-labelledby="ss-city-h">' +
        '<div class="ss-city-head"><div><h1 id="ss-city-h">Startup City</h1><p>Explore · Meet people · Build · Launch</p></div>' +
          '<div class="ss-view-toggle" role="group" aria-label="City view">' +
            '<button type="button" data-act="view" data-view="map" aria-pressed="' + (store.prefs.view === 'map') + '">' + icon('map') + 'Map</button>' +
            '<button type="button" data-act="view" data-view="list" aria-pressed="' + (store.prefs.view === 'list') + '">' + icon('list') + 'List</button></div></div>' +
        travelNote +
        '<div class="ss-map-wrap' + (store.prefs.view === 'list' ? ' is-list' : '') + '"><div class="ss-map" data-testid="city-map">' + CITY.map(view) + spots + '</div>' +
          '<p class="ss-map-legend"><span><i class="ss-key is-current"></i>Glowing: where you are</span><span><i class="ss-key is-done"></i>✓ Done: visit any time</span><span><i class="ss-key is-locked"></i>🔒 Locked: coming next</span><span class="ss-map-note">A pretend town for learning.</span></p></div>' +
        nextCard +
        '<nav aria-label="Places in Startup City"><ol class="ss-places' + (store.prefs.view === 'list' ? ' is-shown' : '') + '">' + list + '</ol></nav>' +
        last +
      '</section>'
    );
  }

  function nextBlurb(loc) {
    return {
      'idea-park': 'Notice everyday problems and pick one to solve.',
      'people-street': 'Talk to three people and find out what they really need.',
      'market-centre': 'Work out who might buy, and roughly how many.',
      'build-studio': 'Pick features, see your product, then let people test it.',
      'launch-square': 'Choose a price and a promotion, then open your shop.',
      'founder-hq': 'See what happened and download your report.'
    }[loc];
  }

  /* ------------------------------------------------------------ welcome */

  function welcomeDialog(r) {
    var resume = r && r.grade && !r.completedAt;
    var here = r && r.grade ? LOC[currentLocation(r)] : null;
    var grades = C.GRADES.map(function (g) {
      var on = r && r.grade === g.id;
      return '<button type="button" class="ss-grade" data-act="grade" data-grade="' + g.id + '" aria-pressed="' + !!on + '" data-testid="grade-' + g.id + '">' +
        '<span class="ss-grade-emoji" aria-hidden="true">' + g.emoji + '</span><strong>' + esc(g.label) + '</strong><span>' + esc(g.title) + '</span><small>' + esc(g.blurb) + '</small></button>';
    }).join('');
    return (
      '<div class="ss-overlay" role="dialog" aria-modal="true" aria-labelledby="ss-welcome-h" data-testid="welcome">' +
        '<div class="ss-overlay-card">' +
          (resume
            ? '<p class="ss-eyebrow">Welcome back</p><h2 id="ss-welcome-h">Carry on with ' + esc(r.startupName || 'your startup') + '?</h2>' +
              '<p class="ss-overlay-lead">You were at <strong>' + esc(here.name) + '</strong> (step ' + here.step + ' of 6). Everything you chose is saved.</p>' +
              '<div class="ss-btn-row"><a class="btn btn-primary btn-lg" href="#/' + here.id + '" data-act="close-welcome" data-testid="resume">Continue at ' + esc(here.name) + icon('arrowRight', 'icon-nudge') + '</a>' +
              '<button type="button" class="btn btn-secondary btn-lg" data-act="start-over">' + icon('refresh') + 'Start over</button></div>'
            : '<p class="ss-eyebrow">YOPPI Startup Sprint</p><h2 id="ss-welcome-h">Welcome to Startup City!</h2>' +
              '<p class="ss-overlay-lead">You’ll find a problem, talk to people, build something and open a pretend shop. It takes about 20 minutes. Which class are you in?</p>' +
              '<div class="ss-grades" role="group" aria-label="Your class">' + grades + '</div>' +
              (store.last ? '<p class="ss-last-link"><a href="#/last-report" data-act="close-welcome">' + icon('trophy') + 'View my last report instead</a></p>' : '')) +
          '<p class="ss-fine">Everything here is a made-up market for learning. No real money, no sign-up. Your choices are saved only on this device.</p>' +
        '</div>' +
      '</div>'
    );
  }

  /* ------------------------------------------------------- scene framework */

  function sceneShell(locId, room, parts) {
    var l = LOC[locId];
    var r = run();
    var tones = {}, icons = {};
    C.LOCATIONS.forEach(function (x) { tones[x.id] = x.tone; icons[x.id] = x.icon; });
    var status = E.cityStatus(r);
    var sc = E.scenarioOf(r);
    var art = CITY.single(locId, {
      status: status, tones: tones, icons: icons, scenario: r.ideaDone ? sc : null, interviews: r.interviews.length,
      segment: E.segmentOf(r), features: r.built ? E.effectiveFeatures(r).length : r.featureIds.length,
      testers: r.tested ? E.testOutcomes(r).testers.map(function (t) { return t.ok; }) : null,
      shopName: r.priceId && r.channelId ? r.startupName : null, opened: r.opened,
      customers: r.opened ? Math.ceil(E.simulate(r, { rounds: r.eventResponseId ? 2 : 1 }).uniqueCustomers / 6) : 0, done: []
    });
    var title = room === 'test' ? 'Test Corner: let people try it' : l.chapter;
    var enter = isNewScene();
    var subnav = locId === 'build-studio'
      ? '<div class="ss-rooms" role="group" aria-label="Rooms in Build Studio"><a href="#/build-studio" aria-current="' + (room !== 'test' ? 'page' : 'false') + '">1 · Workshop</a>' +
        (r.built ? '<a href="#/build-studio/test" aria-current="' + (room === 'test' ? 'page' : 'false') + '" data-testid="room-test">2 · Test Corner</a>' : '<span class="is-locked">2 · Test Corner 🔒</span>') + '</div>'
      : '';
    var notice = ui.notice ? '<div class="ss-notice" role="status">' + icon('sparkle') + '<span>' + esc(ui.notice) + '</span><button type="button" class="ss-icon-btn" data-act="dismiss" aria-label="Dismiss">' + icon('x') + '</button></div>' : '';
    var err = ui.error ? '<div class="ss-notice is-error" role="alert"><span>' + esc(ui.error) + '</span></div>' : '';
    return (
      '<section class="ss-scene ss-tone-' + l.tone + (enter ? ' ss-enter' : '') + '" data-scene="' + locId + (room ? '-' + room : '') + '" aria-labelledby="ss-scene-h">' +
        '<header class="ss-scene-head">' +
          '<div class="ss-scene-art">' + art + '</div>' +
          '<div class="ss-scene-title"><p class="ss-eyebrow">Step ' + l.step + ' of 6 · ' + esc(l.name) + '</p><h1 id="ss-scene-h">' + esc(title) + '</h1>' +
            (parts.guide ? '<p class="ss-guide">' + parts.guide + '</p>' : '') + subnav + '</div>' +
        '</header>' +
        notice + err +
        '<div class="ss-scene-body' + (parts.aside ? '' : ' is-single') + '"><div class="ss-scene-main">' + parts.main + '</div>' + (parts.aside ? '<aside class="ss-scene-aside" aria-label="Your startup">' + parts.aside + '</aside>' : '') + '</div>' +
        '<nav class="ss-scene-nav" aria-label="Scene">' +
          '<a class="btn btn-secondary" href="#/city" data-testid="back-to-city">' + icon('arrowLeft') + 'Back to City</a>' +
          (parts.next || '') +
        '</nav>' +
      '</section>'
    );
  }

  function nextBtn(label, act, enabled, extra) {
    return '<button type="button" class="btn btn-primary btn-lg ss-next" data-act="' + act + '"' + (enabled ? '' : ' disabled aria-disabled="true"') + ' data-testid="next"' + (extra || '') + '>' + esc(label) + icon('arrowRight', 'icon-nudge') + '</button>';
  }

  function card(title, body, opts) {
    opts = opts || {};
    return '<section class="ss-card' + (opts.cls ? ' ' + opts.cls : '') + (opts.anim ? ' ss-rise' : '') + '"' + (opts.id ? ' id="' + opts.id + '"' : '') + (opts.testid ? ' data-testid="' + opts.testid + '"' : '') + '>' +
      (opts.eyebrow ? '<p class="ss-eyebrow">' + opts.eyebrow + '</p>' : '') + (title ? '<h2 class="ss-card-h">' + title + '</h2>' : '') +
      (opts.task ? '<p class="ss-task">' + opts.task + '</p>' : '') + '<div class="ss-card-body">' + body + '</div></section>';
  }

  function choice(o) {
    // o: { act, data, selected, title, detail, emoji, disabled, reason, multi, badges, aside, testid }
    var attrs = Object.keys(o.data || {}).map(function (k) { return ' data-' + k + '="' + esc(o.data[k]) + '"'; }).join('');
    return '<button type="button" class="ss-choice' + (o.selected ? ' is-selected' : '') + (o.cls ? ' ' + o.cls : '') + '" role="' + (o.multi ? 'checkbox' : 'radio') + '" aria-checked="' + !!o.selected + '"' +
      (o.disabled ? ' aria-disabled="true"' : '') + ' data-act="' + o.act + '"' + attrs + (o.testid ? ' data-testid="' + o.testid + '"' : '') + '>' +
      (o.emoji ? '<span class="ss-choice-emoji" aria-hidden="true">' + o.emoji + '</span>' : '') +
      '<span class="ss-choice-text"><span class="ss-choice-title">' + o.title + '</span>' + (o.detail ? '<span class="ss-choice-detail">' + o.detail + '</span>' : '') +
      (o.badges ? '<span class="ss-choice-badges">' + o.badges + '</span>' : '') +
      (o.disabled && o.reason ? '<span class="ss-choice-reason">' + esc(o.reason) + '</span>' : '') + '</span>' +
      (o.aside ? '<span class="ss-choice-aside">' + o.aside + '</span>' : '') +
      '<span class="ss-check' + (o.multi ? ' is-box' : '') + '" aria-hidden="true"></span></button>';
  }

  function speech(p, text, cls) {
    return '<div class="ss-speech' + (cls ? ' ' + cls : '') + '">' + avatar(p) + '<div class="ss-bubble"><p class="ss-bubble-who"><strong>' + esc(p.name) + '</strong>' + (p.role ? ' · ' + esc(p.role) : '') + '</p><p>' + esc(text) + '</p></div></div>';
  }

  function hintBox(text, auto) {
    var r = run();
    if (r.grade === '6-8' || auto) return '<aside class="ss-hint"><span aria-hidden="true">💡</span><p><strong>Hint:</strong> ' + esc(text) + '</p></aside>';
    return '<details class="ss-hint"><summary><span aria-hidden="true">💡</span> Need a hint?</summary><p>' + esc(text) + '</p></details>';
  }

  function terms(r) { return C.TERMS[r.grade] || C.TERMS['9-10']; }

  /* ---------------------------------------------------- 1. Idea Park */

  function ideaPark(r) {
    var sc = E.scenarioOf(r);
    var stories = C.SCENARIOS.map(function (s) {
      var on = r.scenarioId === s.id;
      return '<button type="button" class="ss-story' + (on ? ' is-selected' : '') + '" role="radio" aria-checked="' + on + '" data-act="scenario" data-id="' + s.id + '" data-testid="story-' + s.id + '">' +
        '<span class="ss-story-top">' + avatar({ initials: s.story.initials, tone: s.story.tone }) + '<span class="ss-story-who"><strong>' + esc(s.story.who) + '</strong> · ' + esc(s.story.role) + '</span><span class="ss-story-emoji" aria-hidden="true">' + s.emoji + '</span></span>' +
        '<span class="ss-story-quote">“' + esc(s.story.line) + '”</span>' +
        '<span class="ss-story-problem">Problem: ' + esc(s.problem) + '</span>' +
        '<span class="ss-check" aria-hidden="true"></span></button>';
    }).join('');
    var main = card('Find a problem people face.', '<div class="ss-stories" role="radiogroup" aria-label="Problems in the park">' + stories + '</div>' + hintBox('Pick the problem you’d most like to fix. There’s no wrong answer.'), {
      task: 'Walk around the park. Three people have a problem. Tap the one you want to solve.', testid: 'card-problem'
    });
    if (sc) {
      main += card('How will you solve it?', '<div class="ss-choices" role="radiogroup" aria-label="Your solution">' + sc.positionings.map(function (p) {
        return choice({ act: 'positioning', data: { id: p.id }, selected: r.positioningId === p.id, title: esc(p.title), detail: esc(p.blurb), emoji: p.emoji, testid: 'pos-' + p.id });
      }).join('') + '</div>', { task: 'Two simple ways to start ' + esc(sc.title) + '. Pick one.', anim: ui.anim.scenario, testid: 'card-solution' });
    }
    if (sc && r.positioningId) {
      var name = r.startupName || '';
      main += card('Name your startup <span class="ss-optional">(optional)</span>',
        '<label class="ss-label" for="ss-name">Startup name</label>' +
        '<input id="ss-name" class="ss-input" type="text" maxlength="' + E.NAME_MAX + '" autocomplete="off" spellcheck="false" placeholder="' + esc(sc.defaultName) + '" value="' + esc(name) + '" data-testid="name-input">' +
        '<p class="ss-help">Up to ' + E.NAME_MAX + ' letters. Leave it empty to use “' + esc(sc.defaultName) + '”. Please don’t use your own full name.</p>' +
        '<div class="ss-name-ideas" role="group" aria-label="Name ideas">' + sc.nameIdeas.map(function (n) { return '<button type="button" class="ss-pill" data-act="name-idea" data-name="' + esc(n) + '">' + esc(n) + '</button>'; }).join('') + '</div>' +
        '<div class="ss-win" role="status"><span aria-hidden="true">🎉</span><div><strong>You found a problem worth exploring!</strong><p>' + esc(sc.title) + ' ' + esc(E.positioningOf(r).describe) + '.</p></div></div>',
        { anim: ui.anim.positioning, testid: 'card-name' });
    }
    var aside = '<div class="ss-side-card"><p class="ss-eyebrow">Your idea</p>' +
      (sc ? '<div class="ss-signboard"><span aria-hidden="true">' + sc.emoji + '</span><strong data-live-name>' + esc(r.startupName || sc.defaultName) + '</strong></div>' +
        '<dl class="ss-facts"><div><dt>Problem</dt><dd>' + esc(sc.problem) + '</dd></div><div><dt>Who it helps</dt><dd>' + esc(sc.helps) + '</dd></div>' +
        (r.positioningId ? '<div><dt>Your way</dt><dd>' + esc(E.positioningOf(r).title) + '</dd></div>' : '') + '</dl>'
        : '<p class="ss-muted">Pick a problem to see your idea here.</p>') + '</div>';
    return sceneShell('idea-park', null, {
      guide: 'Every business starts with a problem. Look around Idea Park.',
      main: main, aside: aside,
      next: nextBtn('Next: People Street', 'finish-idea', !!(sc && r.positioningId))
    });
  }

  /* ------------------------------------------------ 2. People Street */

  function qualityOf(iv) {
    if (iv.questionId === 'leading') return { label: 'Weak proof', cls: 'is-weak' };
    if (iv.questionId === 'money') return { label: 'Useful', cls: 'is-ok' };
    return { label: 'Strong proof', cls: 'is-strong' };
  }

  function peopleStreet(r) {
    var sc = E.scenarioOf(r);
    var done = r.interviews.length >= E.INTERVIEWS;
    var talked = {};
    r.interviews.forEach(function (iv) { talked[iv.personaId] = iv; });
    var talking = ui.talkingTo ? E.personaOf(sc, ui.talkingTo) : null;
    var grid = '<ul class="ss-people" aria-label="People on the street">' + sc.personas.map(function (p) {
      var iv = talked[p.id];
      var q = iv ? qualityOf(iv) : null;
      var disabled = !iv && done;
      return '<li><button type="button" class="ss-person' + (iv ? ' is-done' : '') + (talking && talking.id === p.id ? ' is-active' : '') + '" data-act="talk-to" data-id="' + p.id + '"' + (disabled ? ' aria-disabled="true"' : '') + ' data-testid="persona-' + p.id + '">' +
        avatar(p, 'lg') + '<span class="ss-person-text"><strong>' + esc(p.name) + '</strong><small>' + esc(p.role) + '</small></span>' +
        (iv ? '<span class="ss-quality ' + q.cls + '">✓ Talked · ' + q.label + '</span>' : disabled ? '<span class="ss-quality">3 talks done</span>' : '<span class="ss-quality is-new">Tap to talk</span>') +
        '</button></li>';
    }).join('') + '</ul>';
    var main = card('Talk to people.', grid + hintBox(C.HINTS[0]), {
      task: done ? (r.interviewsDone ? 'You talked to three people. Here’s what you heard.' : 'You talked to three people. You can swap one talk if you want, or move on.') : 'Pick ' + (E.INTERVIEWS - r.interviews.length) + ' more ' + (E.INTERVIEWS - r.interviews.length === 1 ? 'person' : 'people') + ' to talk to. Then choose one question.',
      testid: 'card-people'
    });
    if (talking) {
      var iv = talked[talking.id];
      var convo = speech(talking, talking.intro);
      if (!iv) {
        convo += '<p class="ss-ask-h" id="ss-ask-h">What will you ask ' + esc(talking.name) + '?</p><div class="ss-questions" role="group" aria-labelledby="ss-ask-h">' +
          ['past', 'money', 'leading'].map(function (q) {
            return '<button type="button" class="ss-question" data-act="ask" data-q="' + q + '" data-testid="ask-' + q + '"><span aria-hidden="true">💬</span>“' + esc(sc.questions[q]) + '”</button>';
          }).join('') + '</div>';
      } else {
        var a = talking.answers[iv.questionId];
        var q = qualityOf(iv);
        convo += '<div class="ss-speech is-me"><div class="ss-bubble"><p class="ss-bubble-who"><strong>You</strong></p><p>“' + esc(sc.questions[iv.questionId]) + '”</p></div></div>';
        convo += speech(talking, a.text, 'ss-pop-in');
        convo += '<div class="ss-evidence-row"><span class="ss-quality ' + q.cls + '">' + q.label + '</span>' + a.chips.map(function (c) { return '<span class="ss-evidence">' + esc(c) + '</span>'; }).join('') + '</div>';
        convo += '<div class="ss-pro"><span aria-hidden="true">🧭</span><p>' + esc(C.QUESTION_KINDS[iv.questionId].verdict) + (talking.nonCustomer ? ' ' + esc(talking.name) + ' doesn’t have this problem, so even a kind answer isn’t proof people will buy.' : '') + '</p></div>';
        convo += '<div class="ss-btn-row"><button type="button" class="btn btn-secondary" data-act="talk-close" data-testid="talk-close">' + (done ? 'See all my talks' : 'Talk to someone else') + '</button>' +
          (done && !r.swapUsed && !r.interviewsDone ? '<button type="button" class="btn btn-ghost" data-act="swap" data-id="' + talking.id + '">Swap this talk</button>' : '') + '</div>';
      }
      main = card('Talking to ' + esc(talking.name), convo, { cls: 'ss-convo', anim: true, id: 'ss-convo', testid: 'convo' }) + main;
    }
    var slots = '';
    for (var i = 0; i < E.INTERVIEWS; i++) {
      var iv2 = r.interviews[i];
      if (iv2) {
        var p = E.personaOf(sc, iv2.personaId), ans = p.answers[iv2.questionId], qq = qualityOf(iv2);
        slots += '<li class="ss-slot is-full' + (ui.anim['iv-' + p.id] ? ' ss-pop-in' : '') + '">' + avatar(p) + '<div><p><strong>' + esc(p.name) + '</strong> <span class="ss-quality ' + qq.cls + '">' + qq.label + '</span></p><p class="ss-slot-chips">' + ans.chips.map(esc).join(' · ') + '</p>' +
          (done && !r.swapUsed && !r.interviewsDone ? '<button type="button" class="ss-link" data-act="swap" data-id="' + p.id + '">Swap</button>' : '') + '</div></li>';
      } else {
        slots += '<li class="ss-slot"><span class="ss-slot-empty" aria-hidden="true">?</span><p class="ss-muted">Talk ' + (i + 1) + ' of 3</p></li>';
      }
    }
    var aside = '<div class="ss-side-card"><p class="ss-eyebrow">Evidence board</p><ol class="ss-slots" data-testid="evidence-board">' + slots + '</ol>' +
      (r.swapUsed ? '<p class="ss-help">You used your one swap.</p>' : '') + '</div>';
    return sceneShell('people-street', null, {
      guide: 'People Street is full of neighbours. Find out what they <em>really</em> do, not just what they say.',
      main: main, aside: aside,
      next: nextBtn('Next: Market Centre', 'finish-interviews', done)
    });
  }

  /* ------------------------------------------------ 3. Market Centre */

  function visibleSegments(r) {
    var sc = E.scenarioOf(r);
    return r.grade === '6-8' ? sc.segments.slice(0, 2) : sc.segments;
  }

  function needWords(rate) {
    if (rate >= 0.6) return 'about 2 in 3';
    if (rate >= 0.4) return 'almost half';
    if (rate >= 0.3) return 'about 1 in 3';
    if (rate >= 0.24) return 'about 1 in 4';
    return 'about 1 in 5';
  }

  function marketCentre(r) {
    var sc = E.scenarioOf(r);
    var segs = visibleSegments(r);
    var T = terms(r);
    var max = Math.max.apply(null, segs.map(function (g) { return g.population; }));
    var talkedSeg = {};
    r.interviews.forEach(function (iv) { var p = E.personaOf(sc, iv.personaId); if (p && p.segmentId) (talkedSeg[p.segmentId] = talkedSeg[p.segmentId] || []).push(p.name); });
    var rows = segs.map(function (g) {
      var w = Math.max(6, g.population / max * 100);
      return '<li><div class="ss-bar-label"><span aria-hidden="true">' + g.emoji + '</span><strong>' + esc(g.name) + '</strong><span>' + E.num(g.population) + ' people</span></div>' +
        '<div class="ss-bar" style="width:' + w.toFixed(1) + '%"><span class="ss-bar-need" style="width:' + (g.needRate * 100).toFixed(0) + '%"></span></div>' +
        '<p class="ss-bar-note">' + esc(needWords(g.needRate)) + ' said they face this problem often (' + Math.round(g.needRate * 100) + '%).</p></li>';
    }).join('');
    var facts = '<dl class="ss-facts ss-facts-row"><div><dt>Place</dt><dd>' + esc(sc.town.name) + ' (pretend)</dd></div><div><dt>People nearby</dt><dd>' + E.num(sc.town.population) + '</dd></div>' +
      (r.grade !== '6-8' ? '<div><dt>What people use now</dt><dd>' + esc(sc.competitor) + '</dd></div>' : '') + '</dl>';
    var main = card('Not everyone nearby is your customer.',
      facts + '<figure class="ss-market-chart"><figcaption>Each bar shows a group. The dark part is the people who face the problem often.</figcaption><ul>' + rows + '</ul></figure>',
      { task: 'Look at the groups near you. Who has this problem often?', testid: 'card-market' });
    main += card('Who will you serve first?', '<div class="ss-choices is-grid" role="radiogroup" aria-label="Customer group">' + segs.map(function (g) {
      var heard = talkedSeg[g.id];
      return choice({
        act: 'segment', data: { id: g.id }, selected: r.segmentId === g.id, emoji: g.emoji, title: esc(g.name), testid: 'seg-' + g.id,
        detail: esc(g.who) + '. They spend ' + esc(g.spend) + '. Today they: ' + esc(g.alternative.toLowerCase()) + '.' +
          (r.grade === '11-12' ? ' Likely to buy again: ' + Math.round(g.retention * 100) + '%.' : ''),
        badges: heard ? '<span class="ss-badge-heard">💬 You talked to ' + esc(heard.join(' and ')) + '</span>' : ''
      });
    }).join('') + '</div>', { task: 'Pick one group to start with. Small and focused is fine.', testid: 'card-segment' });
    if (r.segmentId) {
      var seg = E.segmentOf(r);
      var est = E.estimateOptions(r);
      var picked = est.filter(function (o) { return o.id === r.estimateId; })[0];
      var body = '<div class="ss-choices" role="radiogroup" aria-label="Your estimate">' + est.map(function (o) {
        return choice({ act: 'estimate', data: { id: o.id }, selected: r.estimateId === o.id, title: 'About ' + E.num(o.value) + ' ' + esc(seg.short), detail: esc(o.label), testid: 'est-' + o.id });
      }).join('') + '</div>';
      if (picked) {
        var good = picked.verdict === 'good';
        var supported = est.filter(function (o) { return o.verdict === 'good'; })[0];
        body += '<div class="ss-pro ' + (good ? 'is-good' : '') + '"><span aria-hidden="true">' + (good ? '🎯' : '🧭') + '</span><p>' +
          (good ? 'Well estimated! ' + E.num(seg.population) + ' ' + esc(seg.short) + ' × ' + Math.round(seg.needRate * 100) + '% who need it often ≈ ' + E.num(supported.value) + '.'
            : picked.verdict === 'too-big' ? 'That’s everyone in the group, but only ' + Math.round(seg.needRate * 100) + '% face this problem often. A better estimate is about ' + E.num(supported.value) + '.'
              : 'More people need it than just your friends. ' + Math.round(seg.needRate * 100) + '% of ' + E.num(seg.population) + ' is about ' + E.num(supported.value) + '.') + '</p></div>';
        body += '<div class="ss-first-market" data-testid="first-market"><p class="ss-eyebrow">Your first market</p><p class="ss-big">' + E.num(supported.value) + ' <span>' + esc(T.market.toLowerCase()) + '</span></p>' +
          '<p>About ' + E.num(supported.value) + ' ' + esc(seg.short) + ' in ' + esc(sc.town.name) + ' might need ' + esc(r.startupName) + '. This is an estimate, not people who have bought.</p></div>';
      }
      main += card('How many people might need this?', body + (r.grade === '6-8' ? hintBox('Look at the dark part of the bar. Those are the people who need it often.') : hintBox(C.HINTS[1])), {
        task: 'Use the bar chart. No maths homework: just pick the best guess.', anim: ui.anim.segment, testid: 'card-estimate'
      });
    }
    var aside = '<div class="ss-side-card"><p class="ss-eyebrow">' + esc(T.market) + '</p>' +
      (r.segmentId ? dotGrid(E.segmentOf(r)) : '<p class="ss-muted">Pick a group to see it here.</p>') + '</div>';
    return sceneShell('market-centre', null, {
      guide: 'The Market Centre has a board with facts about the people nearby.',
      main: main, aside: aside,
      next: nextBtn('Next: Build Studio', 'goto-build', !!(r.segmentId && r.estimateId))
    });
  }

  function dotGrid(seg) {
    var total = 50, perDot = Math.ceil(seg.population / total), need = Math.round(seg.population * seg.needRate / perDot);
    var dots = '';
    for (var i = 0; i < total; i++) dots += '<span class="ss-dot' + (i < need ? ' is-need' : '') + '"></span>';
    return '<div class="ss-dots" role="img" aria-label="' + E.num(seg.population) + ' ' + esc(seg.short) + '. About ' + E.num(Math.round(seg.population * seg.needRate)) + ' need it often.">' + dots + '</div>' +
      '<p class="ss-help"><span class="ss-key-dot is-need"></span> needs it often · <span class="ss-key-dot"></span> doesn’t (1 dot ≈ ' + perDot + ' people)</p>' +
      '<p class="ss-side-big">' + seg.emoji + ' ' + esc(seg.name) + '</p>';
  }

  /* ------------------------------------------------ 4. Build Studio */

  function previewPrice(r) {
    var sc = E.scenarioOf(r);
    var p = E.priceOf(r) || sc.prices[1];
    return p.amount;
  }

  /** The working mini product: list → detail → (pay) → done. Changes with the chosen features. */
  function productPreview(r, ids, opts) {
    opts = opts || {};
    var sc = E.scenarioOf(r);
    var feats = ids.map(function (id) { return E.featureOf(sc, id); }).filter(Boolean);
    var pv = {};
    feats.forEach(function (f) { Object.keys(f.preview || {}).forEach(function (k) { if (!pv[k]) pv[k] = f.preview[k]; }); });
    var discount = feats.some(function (f) { return f.newCustomerDiscount; });
    var price = previewPrice(r);
    var screen = opts.static ? 'list' : ui.preview.screen;
    var item = sc.preview.items[opts.static ? 0 : ui.preview.item] || sc.preview.items[0];
    var hasPay = pv.step === 'pay';
    var actionLabel = pv.action || (hasPay ? 'Order and pay' : null);
    var body = '';
    if (screen === 'list') {
      body += (pv.banner ? '<p class="ss-ph-banner">' + esc(pv.banner) + '</p>' : '');
      body += '<ul class="ss-ph-list">' + sc.preview.items.map(function (it, i) {
        return '<li>' + (opts.static ? '<div class="ss-ph-row">' : '<button type="button" class="ss-ph-row" data-act="pv-open" data-i="' + i + '">') +
          '<span class="ss-ph-thumb" aria-hidden="true">' + it.emoji + '</span><span class="ss-ph-text"><strong>' + esc(it.name) + '</strong><small>' + esc(it.sub) + '</small>' +
          (pv.meta ? '<small class="ss-ph-meta">' + esc(pv.meta) + '</small>' : '') +
          (pv.badge ? '<span class="ss-ph-badge">' + esc(pv.badge) + '</span>' : '') + '</span>' +
          '<span class="ss-ph-price">' + inr(price) + '</span>' + (opts.static ? '</div>' : '</button>') + '</li>';
      }).join('') + '</ul>';
    } else if (screen === 'detail') {
      body += '<button type="button" class="ss-ph-back" data-act="pv-back">‹ Back</button>';
      body += '<div class="ss-ph-hero" aria-hidden="true">' + item.emoji + '</div><p class="ss-ph-title">' + esc(item.name) + '</p><p class="ss-ph-sub">' + esc(item.sub) + '</p>';
      body += '<p class="ss-ph-bigprice">' + inr(price) + ' <small>' + esc(sc.priceUnit) + '</small></p>';
      if (discount) body += '<p class="ss-ph-tag">🏷️ 20% off your first time</p>';
      if (pv.badge) body += '<p class="ss-ph-tag">' + esc(pv.badge) + '</p>';
      if (pv.meta) body += '<p class="ss-ph-tag">' + esc(pv.meta) + '</p>';
      if (pv.detail) body += '<p class="ss-ph-tag">' + esc(pv.detail) + '</p>';
      if (pv.review) body += '<p class="ss-ph-review">' + esc(pv.review) + '</p>';
      body += '<button type="button" class="ss-ph-cta' + (actionLabel ? '' : ' is-weak') + '" data-act="pv-action" data-testid="pv-action">' + esc(actionLabel || sc.preview.coreAction) + '</button>';
      if (ui.preview.msg) body += '<p class="ss-ph-msg" role="status">' + esc(ui.preview.msg) + '</p>';
    } else if (screen === 'pay') {
      body += '<button type="button" class="ss-ph-back" data-act="pv-back">‹ Back</button>';
      body += '<p class="ss-ph-title">Pay ' + inr(discount ? Math.round(price * 0.8) : price) + '</p><p class="ss-ph-sub">UPI · pretend payment, no real money</p>';
      body += '<div class="ss-ph-upi" aria-hidden="true">₹</div><button type="button" class="ss-ph-cta" data-act="pv-pay" data-testid="pv-pay">Pay with UPI</button>';
    } else {
      body += '<div class="ss-ph-done"><span aria-hidden="true">✅</span><p class="ss-ph-title">Done!</p><p class="ss-ph-sub">' + esc(sc.preview.done) + '</p>' +
        '<button type="button" class="ss-ph-cta is-weak" data-act="pv-back">Back to start</button></div>';
    }
    return '<div class="ss-phone' + (opts.small ? ' is-small' : '') + '"' + (opts.static ? ' aria-hidden="true"' : ' role="group" aria-label="Your product: a working preview. Tap to try it."') + ' data-testid="' + (opts.static ? 'phone-static' : 'phone') + '">' +
      '<div class="ss-phone-top"><span>' + esc(r.startupName) + '</span><small>' + esc(sc.preview.app) + '</small></div>' +
      '<div class="ss-phone-screen">' + body + '</div>' +
      '<div class="ss-phone-features">' + (feats.length ? feats.map(function (f) { return '<span>' + f.icon + ' ' + esc(f.name) + '</span>'; }).join('') : '<span class="is-empty">Core only: ' + esc(sc.core.name) + '</span>') + '</div>' +
      '</div>';
  }

  function buildStudio(r) {
    var sc = E.scenarioOf(r);
    var seg = E.segmentOf(r);
    var hints = E.interviewHints(r);
    var spent = E.baseFeatureCost(r);
    var left = sc.startingCash - spent;
    var built = r.built;
    var feats = sc.features.map(function (f) {
      var chk = E.featureCheck(r, f.id);
      var sel = r.featureIds.indexOf(f.id) > -1;
      var asked = hints.features[f.id];
      var badges = (asked ? '<span class="ss-badge-heard">💬 ' + esc(asked.join(' and ')) + ' asked for this</span>' : '') +
        (f.requires ? '<span class="ss-badge-dep">Needs ' + esc(E.featureOf(sc, f.requires[0]).name) + '</span>' : '') +
        (r.grade === '11-12' && f.perOrder ? '<span class="ss-badge-dep">+' + inr(f.perOrder) + ' per order</span>' : '');
      return choice({
        act: 'feature', data: { id: f.id }, selected: sel, multi: true, emoji: f.icon, title: esc(f.name), detail: esc(f.benefit), badges: badges,
        aside: '<strong>' + inr(f.cost) + '</strong>', disabled: built || (!sel && !chk.ok), reason: built ? null : (!sel && !chk.ok ? chk.reason : null), testid: 'feat-' + f.id
      });
    }).join('');
    var pct = Math.max(0, Math.min(100, left / sc.startingCash * 100));
    var meter = '<div class="ss-budget" data-testid="budget"><div class="ss-budget-top"><span>' + icon('wallet') + ' Money left</span><strong>' + inr(left) + ' <small>of ' + inr(sc.startingCash) + '</small></strong></div>' +
      '<div class="ss-meter"><span style="width:' + pct.toFixed(1) + '%"></span><i style="left:' + (C.LAUNCH_RESERVE / sc.startingCash * 100).toFixed(1) + '%" title="Keep this for opening day"></i></div>' +
      '<p class="ss-help">Keep at least ' + inr(C.LAUNCH_RESERVE) + ' for promotion and supplies on opening day. Extras chosen: ' + r.featureIds.length + ' of ' + E.MAX_FEATURES + '.</p></div>';
    var main = card('Build your first version.',
      meter +
      '<div class="ss-core"><span aria-hidden="true">🧱</span><div><strong>' + esc(sc.core.name) + '</strong> <span class="ss-included">Included · ' + inr(sc.core.cost) + '</span><p>' + esc(sc.core.benefit) + '</p></div></div>' +
      '<div class="ss-choices" role="group" aria-label="Extra features">' + feats + '</div>' +
      (built ? '<div class="ss-btn-row"><button type="button" class="btn btn-secondary" data-act="edit-build" data-testid="edit-build">Change my product</button></div>' : '') +
      hintBox(C.HINTS[2]),
      { task: built ? 'Your product is built. You can change it, but you’ll need to test it again.' : 'Tap up to ' + E.MAX_FEATURES + ' extras for ' + esc(seg.short) + '. Watch your product change on the right.', testid: 'card-build' });
    var aside = '<div class="ss-side-card ss-sticky"><p class="ss-eyebrow">Your product · try it!</p>' + productPreview(r, r.featureIds) +
      '<p class="ss-help">A pretend preview, not a real app.</p></div>';
    return sceneShell('build-studio', null, {
      guide: 'Welcome to the Build Studio. Start small: build only what your customers need.',
      main: main, aside: aside,
      next: built ? '<a class="btn btn-primary btn-lg ss-next" href="#/build-studio/test" data-testid="next">Go to the Test Corner' + icon('arrowRight', 'icon-nudge') + '</a>'
        : nextBtn('Build it and test it', 'build', left >= C.LAUNCH_RESERVE)
    });
  }

  /* --------------------------------------------- 5. Test Corner */

  var STEP_NAMES = { browse: 'Browse', view: 'Look closer', action: 'Order', pay: 'Pay' };

  function testerLanes(r, outcome, key, animate) {
    var sc = E.scenarioOf(r);
    return '<ul class="ss-testers">' + outcome.testers.map(function (t, i) {
      var seg = sc.segments.filter(function (g) { return g.id === t.segmentId; })[0];
      var stopIdx = t.ok ? t.steps.length : t.steps.indexOf(t.stoppedAt);
      var trail = t.steps.map(function (s, j) {
        var st = j < stopIdx ? 'ok' : j === stopIdx ? 'stop' : 'skip';
        return '<li class="is-' + st + (animate ? ' ss-step-anim' : '') + '" style="animation-delay:' + (reduceMotion || !animate ? 0 : i * 0.5 + j * 0.25) + 's">' + (st === 'ok' ? '✓ ' : st === 'stop' ? '✗ ' : '') + STEP_NAMES[s] + '</li>';
      }).join('');
      return '<li class="ss-tester ' + (t.ok ? 'is-ok' : 'is-drop') + '" data-testid="tester-' + key + '-' + t.id + '">' +
        '<div class="ss-tester-head">' + avatar(t) + '<p><strong>' + esc(t.name) + '</strong><small>' + esc(seg ? seg.name : '') + '</small></p>' +
        '<span class="ss-quality ' + (t.ok ? 'is-strong' : 'is-weak') + '">' + (t.ok ? 'Ordered' : 'Stopped') + '</span></div>' +
        '<ol class="ss-steps" aria-label="What ' + esc(t.name) + ' did">' + trail + (t.ok ? '<li class="is-done' + (animate ? ' ss-step-anim' : '') + '" style="animation-delay:' + (reduceMotion || !animate ? 0 : i * 0.5 + t.steps.length * 0.25) + 's">🎉 Done</li>' : '') + '</ol>' +
        '<p class="ss-tester-quote">“' + esc(t.quote) + '”</p></li>';
    }).join('') + '</ul>';
  }

  function testCorner(r) {
    var sc = E.scenarioOf(r);
    var before = E.testOutcomes(r, { before: true });
    var w = before.weakness;
    var opts = E.revisionOptions(r);
    var main = card('Watch three testers try it.', testerLanes(r, before, 'before', isNewScene()) +
      '<div class="ss-pro"><span aria-hidden="true">🔍</span><p><strong>' + before.orders + ' of 3 testers ordered.</strong> ' +
      (w.kind === 'feature' ? 'Biggest problem: “' + esc(E.featureOf(sc, w.fix).name) + '” was missing.' : esc(w.text)) + '</p></div>',
      { task: 'They’re pretend customers. Watch where they stop: that’s where your product needs work.', testid: 'card-test' });
    main += card('Make one improvement.', '<div class="ss-choices" role="radiogroup" aria-label="Your improvement">' + opts.map(function (o) {
      return choice({ act: 'revision', data: { id: o.id }, selected: r.revisionId === o.id, emoji: o.icon, title: esc(o.label), detail: esc(o.detail),
        aside: o.cost ? '<strong>' + inr(o.cost) + '</strong>' : '<strong>Free</strong>', disabled: o.disabled, reason: o.reason, testid: 'rev-' + o.id });
    }).join('') + '</div>' + hintBox(C.HINTS[3]), { task: 'Pick one change, then we’ll test again straight away.', testid: 'card-revision' });
    if (r.revisionId) {
      var after = E.testOutcomes(r);
      var fixed = after.orders > before.orders || (w.kind === 'polish' && r.revisionId === 'simplify');
      main += card('Test again: before and after', '<p class="ss-compare"><span>Before: <strong>' + before.orders + ' of 3</strong> ordered</span><span aria-hidden="true">→</span><span>After: <strong>' + after.orders + ' of 3</strong> ordered</span></p>' +
        testerLanes(r, after, 'after', !!ui.anim.revision) +
        '<div class="ss-pro ' + (fixed ? 'is-good' : '') + '"><span aria-hidden="true">' + (fixed ? '🛠️' : '🤔') + '</span><p>' +
        (fixed ? 'Nice fix. Testers had an easier time.' : r.revisionId === 'keep' ? 'You kept it as it is. Real customers may hit the same problem.' : 'That helped a little, but the biggest problem is still there.') + '</p></div>',
        { anim: true, testid: 'card-after', id: 'ss-after' });
    }
    var aside = '<div class="ss-side-card ss-sticky"><p class="ss-eyebrow">Your product' + (r.revisionId ? ' · improved' : '') + '</p>' + productPreview(r, E.effectiveFeatures(r)) +
      '<p class="ss-help">Money left: <strong>' + inr(E.moneyLeftBeforeLaunch(r)) + '</strong></p></div>';
    return sceneShell('build-studio', 'test', {
      guide: 'The Test Corner is a small room inside the Build Studio. Three people will try your product.',
      main: main, aside: aside,
      next: nextBtn('Next: Launch Square', 'goto-launch', !!r.revisionId)
    });
  }

  /* ------------------------------------------- 6. Launch Square */

  function fitWord(m) { return m >= 0.75 ? 'Great fit' : m >= 0.5 ? 'Good fit' : m >= 0.35 ? 'Some fit' : 'Poor fit'; }

  function resultCards(r, sim, round) {
    var T = terms(r);
    var rounds = sim.rounds.slice(round - 1, round);
    var rev = rounds.reduce(function (a, x) { return a + x.revenueINR; }, 0);
    var cost = rounds.reduce(function (a, x) { return a + x.variableCostINR + x.fixedSpendINR; }, 0);
    return '<dl class="ss-metrics">' +
      '<div><dt>' + esc(T.revenue) + ' (this week)</dt><dd>' + inr(rev) + '</dd></div>' +
      '<div><dt>' + esc(T.costs) + ' (this week)</dt><dd>' + inr(cost) + '</dd></div>' +
      '<div><dt>' + (r.grade === '6-8' ? 'New people who bought' : 'New customers') + '</dt><dd>' + rounds.reduce(function (a, x) { return a + x.newOrders; }, 0) + '</dd></div>' +
      (round > 1 ? '<div><dt>Came back again</dt><dd>' + rounds[0].repeatOrders + '</dd></div>' : '') +
      '</dl>';
  }

  function weekCard(r, sim, round) {
    var sc = E.scenarioOf(r);
    var x = sim.rounds[round - 1];
    var said = {};
    E.insights(r, sim, E.score(r, sim)).all.forEach(function (l) { said[l.code] = l.text; });
    var lines = x.reasonCodes.filter(function (c) { return C.REASONS[c] && said[c]; }).slice(0, 3).map(function (c) {
      return '<li class="is-' + C.REASONS[c].kind + '">' + (C.REASONS[c].kind === 'good' ? '👍 ' : '💡 ') + esc(said[c]) + '</li>';
    }).join('');
    var extra = '';
    if (r.grade === '11-12') {
      extra = '<p class="ss-help">Conversion: ' + Math.round(x.conversion * 100) + '% of people who needed it bought · You keep ' + inr(x.price - x.unitCost) + ' per order (price ' + inr(x.price) + ' − cost ' + inr(x.unitCost) + ')' + (x.potentialOrders > x.capacity ? ' · Capacity limit: ' + x.capacity : '') + '</p>';
    }
    return '<div class="ss-week" data-testid="week-' + round + '">' +
      CITY.storefront({ name: r.startupName, emoji: sc.emoji, orders: x.orders, label: x.orders + ' orders in week ' + round + ' at ' + r.startupName }) +
      '<p class="ss-story-line">' + esc(E.roundStory(x, sc.unitLabel)) + '</p>' +
      '<div class="ss-sales-meter" aria-hidden="true"><span style="--w:' + Math.min(100, x.revenueINR / Math.max(1, sim.rounds.reduce(function (a, y) { return Math.max(a, y.revenueINR); }, 1)) * 100).toFixed(0) + '%"></span></div>' +
      resultCards(r, sim, round) + (lines ? '<ul class="ss-reasons">' + lines + '</ul>' : '') + extra + '</div>';
  }

  function launchSquare(r) {
    var sc = E.scenarioOf(r);
    var seg = E.segmentOf(r);
    var hints = E.interviewHints(r);
    var prod = E.product(r);
    var main = '';
    if (!r.opened) {
      var prices = sc.prices.map(function (p) {
        var fits = hints.budgets.filter(function (b) { return b.amount >= p.amount; }).map(function (b) { return b.name; });
        var tooMuch = hints.budgets.filter(function (b) { return b.amount < p.amount && b.segmentId === seg.id; }).map(function (b) { return b.name; });
        var margin = p.amount + prod.orderValueAdd - E.unitCostFor(prod, p);
        var detail = esc(p.label) + (p.note ? ' · ' + esc(p.note) : '') + (r.grade !== '6-8' || true ? '. You keep about ' + inr(margin) + ' per order after costs.' : '');
        var badges = (fits.length ? '<span class="ss-badge-heard">💬 Fits ' + esc(fits.slice(0, 2).join(' and ')) + '’s budget</span>' : '') +
          (tooMuch.length ? '<span class="ss-badge-dep">More than ' + esc(tooMuch[0]) + ' said they’d pay</span>' : '');
        return choice({ act: 'price', data: { id: p.id }, selected: r.priceId === p.id, title: inr(p.amount) + ' <small>' + esc(sc.priceUnit) + '</small>', detail: detail, badges: badges, testid: 'price-' + p.id });
      }).join('');
      var left = E.moneyLeftBeforeLaunch(r);
      var channels = sc.channels.map(function (c) {
        var m = c.match[seg.id] || 0;
        var dis = left - c.cost < 0;
        return choice({ act: 'channel', data: { id: c.id }, selected: r.channelId === c.id, emoji: c.icon, title: esc(c.name), testid: 'ch-' + c.id,
          detail: esc(c.blurb) + ' Reaches about ' + E.num(c.reach) + ' people.', aside: '<strong>' + inr(c.cost) + '</strong><small>for 2 weeks</small>',
          badges: '<span class="ss-fit is-' + (m >= 0.5 ? 'good' : m >= 0.35 ? 'ok' : 'poor') + '">' + fitWord(m) + ' for ' + esc(seg.short) + '</span>', disabled: dis, reason: dis ? 'Not enough money left.' : null });
      }).join('');
      main += card('Pick your price.', '<div class="ss-choices" role="radiogroup" aria-label="Price">' + prices + '</div>' + hintBox(C.HINTS[4]), { task: 'What will ' + esc(seg.short) + ' pay? Remember what people told you.', testid: 'card-price' });
      main += card('Tell people about your shop.', '<div class="ss-choices" role="radiogroup" aria-label="Promotion">' + channels + '</div>' + hintBox(C.HINTS[5]), { task: 'Pick one way to spread the word for two weeks.', testid: 'card-channel' });
      var ready = r.priceId && r.channelId;
      main += card('Ready?', '<p>' + (ready ? 'You’ll spend ' + inr(E.channelOf(r).cost) + ' on promotion and have ' + inr(left - E.channelOf(r).cost) + ' left for supplies. Sales then come in from customers.' : 'Pick a price and a promotion to open your shop.') + '</p>' +
        '<button type="button" class="btn btn-primary btn-lg ss-open-btn" data-act="open-shop"' + (ready ? '' : ' disabled') + ' data-testid="open-shop">🎉 Open my shop!</button>', { cls: 'ss-ready' });
    } else {
      var sim = E.simulate(r, { rounds: r.eventResponseId ? 2 : 1 });
      main += card('Week 1: opening week!', weekCard(r, sim, 1), { anim: ui.anim.opened, testid: 'card-week1' });
      var ev = E.eventOf(r);
      var responses = r.grade === '6-8' ? [ev.responses[0], ev.responses[2]] : ev.responses;
      var budget = E.eventBudget(r);
      main += card('<span aria-hidden="true">' + ev.icon + '</span> Surprise! ' + esc(ev.title), '<p>' + esc(ev.text) + ' What will you do?</p>' +
        '<div class="ss-choices" role="radiogroup" aria-label="Your response">' + responses.map(function (x) {
          var dis = !r.eventResponseId && x.cost > budget;
          return choice({ act: 'response', data: { id: x.id }, selected: r.eventResponseId === x.id, title: esc(x.label), aside: '<strong>' + (x.cost ? inr(x.cost) : 'Free') + '</strong>',
            detail: r.eventResponseId === x.id ? esc(x.note) : '', disabled: dis || (!!r.eventResponseId && r.eventResponseId !== x.id), reason: dis ? 'Not enough money left.' : null, testid: 'resp-' + x.id });
        }).join('') + '</div>' + (r.eventResponseId ? '' : hintBox(C.HINTS[6])), { cls: 'ss-event', testid: 'card-event', anim: ui.anim.opened });
      if (r.eventResponseId) {
        var full = E.simulate(r);
        main += card('Week 2: how did it go?', weekCard(r, full, 2) +
          '<div class="ss-totals" data-testid="totals"><p class="ss-eyebrow">After two weeks</p><dl class="ss-metrics is-big">' +
          '<div><dt>' + esc(terms(r).revenue) + '</dt><dd data-testid="total-revenue">' + inr(full.revenueINR) + '</dd></div>' +
          '<div><dt>All costs</dt><dd>' + inr(full.totalCostINR) + '</dd></div>' +
          '<div class="' + (full.profitINR < 0 ? 'is-neg' : 'is-pos') + '"><dt>' + esc(terms(r).profit) + '</dt><dd data-testid="total-profit">' + inr(full.profitINR) + '</dd></div>' +
          '<div><dt>Money left</dt><dd>' + inr(full.endingCashINR) + '</dd></div></dl>' +
          '<p class="ss-help">All costs = building ' + inr(full.buildCostINR) + ' + promotion ' + inr(full.promotionINR) + ' + supplies ' + inr(full.variableCostINR) + (full.eventINR ? ' + surprise ' + inr(full.eventINR) : '') + '. Pretend money only.</p></div>' +
          '<div class="ss-win is-hq"><span aria-hidden="true">🏆</span><div><strong>Founder HQ is open!</strong><p>Your startup report is waiting.</p></div></div>',
          { anim: ui.anim.week2, testid: 'card-week2', id: 'ss-week2' });
      }
    }
    var aside = '<div class="ss-side-card ss-sticky"><p class="ss-eyebrow">Your shop</p>' + productPreview(r, E.effectiveFeatures(r), { static: true, small: true }) +
      '<p class="ss-help">' + esc(sc.capacityNote) + '</p></div>';
    return sceneShell('launch-square', null, {
      guide: r.opened ? 'Customers are arriving at ' + esc(r.startupName) + '!' : 'Launch Square is where shops open. Set your price and spread the word.',
      main: main, aside: aside,
      next: r.eventResponseId ? nextBtn('See my report at Founder HQ', 'goto-hq', true) : ''
    });
  }

  /* -------------------------------------------------- 7. Founder HQ */

  function reportModel(r) { return window.YOPPI_SS_REPORT.model(r, { grade: r.grade }); }

  function chartBars(m) {
    var rounds = m.result.rounds;
    var maxRev = Math.max(1, rounds[0].revenueINR, rounds[1].revenueINR);
    var maxCust = Math.max(1, rounds[0].orders, rounds[1].orders);
    function bars(values, max, fmt, cls) {
      return '<div class="ss-cols">' + values.map(function (v, i) {
        var h = v / max * 100;
        return '<div class="ss-col"><span class="ss-col-val">' + fmt(v) + '</span><span class="ss-col-bar ' + cls + '" style="--h:' + Math.max(v ? 3 : 0, h).toFixed(1) + '%" title="Week ' + (i + 1) + ': ' + fmt(v) + '"></span><span class="ss-col-label">Week ' + (i + 1) + '</span></div>';
      }).join('') + '</div>';
    }
    var r = m.result;
    var costMax = Math.max(r.revenueINR, r.totalCostINR, 1);
    return '<div class="ss-charts">' +
      '<figure class="ss-chart"><figcaption>' + esc(m.terms.revenue) + ' each week</figcaption>' + bars(rounds.map(function (x) { return x.revenueINR; }), maxRev, inr, 'is-rev') + '</figure>' +
      '<figure class="ss-chart"><figcaption>Orders each week</figcaption>' + bars(rounds.map(function (x) { return x.orders; }), maxCust, String, 'is-cust') + '</figure>' +
      '<figure class="ss-chart ss-chart-wide"><figcaption>Money in vs money out (both weeks)</figcaption>' +
        '<div class="ss-hbar"><span>Money in</span><span class="ss-hbar-track"><span class="ss-hbar-fill is-rev" style="width:' + (r.revenueINR / costMax * 100).toFixed(1) + '%"></span></span><strong>' + inr(r.revenueINR) + '</strong></div>' +
        '<div class="ss-hbar"><span>Money out</span><span class="ss-hbar-track"><span class="ss-hbar-fill is-cost" style="width:' + (r.totalCostINR / costMax * 100).toFixed(1) + '%"></span></span><strong>' + inr(r.totalCostINR) + '</strong></div>' +
        '<p class="ss-help">' + (r.profitINR >= 0 ? 'Money in was bigger, so you made a profit of ' + inr(r.profitINR) + '.' : 'Money out was bigger, so this time it was a loss of ' + inr(-r.profitINR) + '.') + '</p></figure>' +
      '<div class="sr-only"><table><caption>Sales by week</caption><thead><tr><th>Week</th><th>Sales</th><th>Orders</th><th>New customers</th><th>Came back</th></tr></thead><tbody>' +
        rounds.map(function (x) { return '<tr><td>' + x.round + '</td><td>' + inr(x.revenueINR) + '</td><td>' + x.orders + '</td><td>' + x.newOrders + '</td><td>' + x.repeatOrders + '</td></tr>'; }).join('') +
      '</tbody></table></div></div>';
  }

  function journeyTrail(m) {
    return '<ol class="ss-journey">' + m.journey.map(function (j, i) {
      var l = C.LOCATIONS[i];
      return '<li><span class="ss-journey-icon ss-tone-' + l.tone + '">' + icon(l.icon) + '</span><p><strong>' + esc(j.did) + '</strong><small>' + esc(j.place) + '</small><span>' + esc(j.detail) + '</span></p></li>';
    }).join('') + '</ol>';
  }

  function reportView(r, opts) {
    opts = opts || {};
    var m = reportModel(r);
    var res = m.result;
    var T = m.terms;
    var skills = Object.keys(res.skillScores).map(function (k) {
      var v = res.skillScores[k];
      return '<li><span>' + esc(k) + '</span><span class="ss-skill-track" role="img" aria-label="' + esc(k) + ': ' + v + ' out of 100"><span style="width:' + v + '%"></span></span><strong>' + v + '</strong></li>';
    }).join('');
    var zero = res.revenueINR === 0;
    var html =
      '<article class="ss-report" id="ss-report" data-testid="report">' +
        '<header class="ss-report-hero">' +
          '<div class="ss-report-hero-text"><p class="ss-eyebrow is-light">YOPPI · Startup Sprint · My Startup Report</p>' +
            '<h2 class="ss-report-name"><span aria-hidden="true">' + m.emoji + '</span> <span data-testid="report-name">' + esc(m.startupName) + '</span></h2>' +
            '<p class="ss-report-desc">' + esc(m.description) + '</p>' +
            '<p class="ss-report-adventure">Your first business adventure</p>' +
            '<p class="ss-report-headline">' + (zero ? 'Your customers didn’t buy this time.' : 'You made <strong data-testid="report-revenue">' + inr(res.revenueINR) + '</strong> in virtual sales.') + '</p>' +
            '<span class="ss-fictional">Fictional simulation · pretend money</span></div>' +
          '<div class="ss-stamp" aria-label="Badge: ' + esc(res.tier) + '"><span>YOPPI</span><strong>' + esc(res.tier) + '</strong><span>Startup Sprint</span></div>' +
        '</header>' +
        '<dl class="ss-metrics ss-report-metrics">' +
          '<div><dt>' + esc(T.revenue) + '</dt><dd>' + inr(res.revenueINR) + '</dd></div>' +
          '<div><dt>Money left</dt><dd>' + inr(res.endingCashINR) + '</dd></div>' +
          '<div class="' + (res.profitINR < 0 ? 'is-neg' : 'is-pos') + '"><dt>' + esc(T.profit) + '</dt><dd data-testid="report-profit">' + inr(res.profitINR) + '</dd></div>' +
          '<div><dt>People who bought</dt><dd>' + res.uniqueCustomers + '</dd></div>' +
          '<div><dt>Repeat buyers</dt><dd>' + res.repeatOrders + '</dd></div>' +
        '</dl>' +
        (zero ? '<p class="ss-zero">Your customers didn’t buy this time. Here’s what you learned and what you’d try next.</p>' : '') +
        '<div class="ss-report-grid">' +
          '<section class="ss-report-card"><h3>Your idea</h3><p><strong>Problem:</strong> ' + esc(m.problem) + '</p><p><strong>Who it helps:</strong> ' + esc(m.helps) + '</p><p class="ss-muted">' + esc(m.why) + '</p></section>' +
          '<section class="ss-report-card ss-report-product"><h3>Your product</h3><div class="ss-report-product-row">' + productPreview(r, E.effectiveFeatures(r), { static: true, small: true }) +
            '<div><ul class="ss-feature-chips">' + m.featureNames.map(function (f, i) { return '<li><span aria-hidden="true">' + m.featureIcons[i] + '</span>' + esc(f) + '</li>'; }).join('') + '</ul><p>' + esc(m.valueProp) + '</p><p class="ss-help">A visual demo, not real software.</p></div></div></section>' +
        '</div>' +
        '<section class="ss-report-card"><h3>The journey</h3>' + journeyTrail(m) + '</section>' +
        '<section class="ss-report-card"><h3>What happened when you launched</h3>' + chartBars(m) +
          '<div class="ss-best-worst">' + (res.best ? '<p class="is-good"><strong>Best decision:</strong> ' + esc(res.best) + '</p>' : '') + (res.worst ? '<p class="is-grow"><strong>Cost you the most:</strong> ' + esc(res.worst) + '</p>' : '') +
          '<p class="ss-muted">The surprise: ' + esc(m.eventTitle) + '</p></div></section>' +
        '<div class="ss-report-grid">' +
          '<section class="ss-report-card"><h3>Your skills</h3><ul class="ss-skills">' + skills + '</ul><p class="ss-help">Learning score ' + res.score + ' of 100, from your choices (not from how much you sold).</p></section>' +
          '<section class="ss-report-card"><h3>Your next move</h3><ul class="ss-next-move"><li class="is-good">💪 ' + esc(res.strengths[0]) + '</li><li class="is-good">💪 ' + esc(res.strengths[1] || res.strengths[0]) + '</li><li class="is-grow">➡️ ' + esc(res.nextMove) + '</li></ul></section>' +
        '</div>' +
        '<footer class="ss-report-foot"><p>Made with YOPPI · Startup Sprint · ' + esc(m.date) + ' · ' + esc(m.gradeLabel) + '</p><p>All figures are from a fictional simulation; no real sales occurred.</p><p class="ss-versions">' + esc(m.versions) + '</p></footer>' +
      '</article>';
    var actions = '<div class="ss-report-actions" role="group" aria-label="Report actions">' +
      '<button type="button" class="btn btn-primary btn-lg" data-act="pdf" data-testid="download-pdf">' + icon('download') + 'Download my report (PDF)</button>' +
      '<button type="button" class="btn btn-secondary btn-lg" data-act="print">' + icon('printer') + 'Print</button>' +
      '<button type="button" class="btn btn-secondary btn-lg" data-act="play-again" data-testid="play-again">' + icon('refresh') + 'Play again</button>' +
      (ui.pdfStatus ? '<p class="ss-pdf-status" role="status">' + esc(ui.pdfStatus) + '</p>' : '') + '</div>';
    return { html: html, actions: actions, model: m };
  }

  function founderHQ(r) {
    var rep = reportView(r);
    return sceneShell('founder-hq', null, {
      guide: 'Founder HQ is open. Here’s everything ' + esc(r.startupName) + ' did, in one report.',
      main: '<div' + (isNewScene() ? ' class="ss-hq-reveal"' : '') + '>' + rep.actions + rep.html + '</div>', aside: null,
      next: '<button type="button" class="btn btn-primary btn-lg" data-act="pdf">' + icon('download') + 'Download PDF</button>'
    });
  }

  function lastReport() {
    var r = store.last.run;
    var rep = reportView(r);
    return '<section class="ss-scene ss-tone-navy ss-enter" aria-labelledby="ss-last-h"><header class="ss-scene-head is-plain"><div class="ss-scene-title"><p class="ss-eyebrow">Saved on this device</p><h1 id="ss-last-h">My last startup report</h1></div></header>' +
      '<div class="ss-scene-body is-single"><div class="ss-scene-main">' + rep.actions.replace('data-act="play-again"', 'data-act="play-again"') + rep.html + '</div></div>' +
      '<nav class="ss-scene-nav"><a class="btn btn-secondary" href="#/city">' + icon('arrowLeft') + 'Back to City</a></nav></section>';
  }

  /* -------------------------------------------------- dialogs */

  function helpDialog(r) {
    var g = r && r.grade || '9-10';
    var here = ui.route && ui.route.name === 'loc' ? LOC[ui.route.loc] : null;
    return '<div class="ss-overlay" role="dialog" aria-modal="true" aria-labelledby="ss-help-h" data-testid="help"><div class="ss-overlay-card is-help">' +
      '<button type="button" class="ss-icon-btn ss-close" data-act="close-help" aria-label="Close help">' + icon('x', 'icon-lg') + '</button>' +
      '<h2 id="ss-help-h">How to play</h2>' +
      '<ol class="ss-help-steps"><li>Visit the six places in Startup City, in order. The glowing one is next.</li><li>Tap big cards to choose. Little typing needed.</li><li>Use <strong>Back to City</strong> any time. Your choices are saved.</li><li>Finish to unlock <strong>Founder HQ</strong> and download your report.</li></ol>' +
      (here ? '<p class="ss-help"><strong>At ' + esc(here.name) + ':</strong> ' + esc(nextBlurb(here.id)) + '</p>' : '') +
      '<h3>Words to know</h3><dl class="ss-glossary">' + C.GLOSSARY.filter(function (t) { return !t.grades || t.grades.indexOf(g) > -1; }).map(function (t) { return '<div><dt>' + esc(t.term) + '</dt><dd>' + esc(t.meaning) + '</dd></div>'; }).join('') + '</dl>' +
      '<p class="ss-fine">Everything here is pretend: the town, the people, the money and the sales.</p>' +
      (r && r.grade ? '<div class="ss-btn-row"><button type="button" class="btn btn-secondary" data-act="start-over">' + icon('refresh') + 'Start over</button></div>' : '') +
      '</div></div>';
  }

  function confirmDialog() {
    var c = ui.confirm;
    var text = c.kind === 'reset'
      ? (store.current && store.current.completedAt ? 'Start a new startup? Your report stays saved. You can view it any time.' : 'Start over? Your current progress will be cleared.' + (store.last ? ' Your last finished report stays saved.' : ''))
      : c.cleared.length ? 'Your later choices may change. This will reset ' + c.cleared.join(', ') + '.'
        : 'Your later choices may change. Your results will be worked out again from this new choice.';
    return '<div class="ss-overlay" role="alertdialog" aria-modal="true" aria-labelledby="ss-confirm-h" aria-describedby="ss-confirm-p" data-testid="confirm"><div class="ss-overlay-card is-small">' +
      '<h2 id="ss-confirm-h">' + (c.kind === 'reset' ? 'Start again?' : 'Change this choice?') + '</h2><p id="ss-confirm-p">' + esc(text) + '</p>' +
      '<div class="ss-btn-row"><button type="button" class="btn btn-primary" data-act="confirm-yes" data-testid="confirm-yes">' + (c.kind === 'reset' ? 'Yes, start again' : 'Yes, change it') + '</button>' +
      '<button type="button" class="btn btn-secondary" data-act="confirm-no">Keep my choices</button></div></div></div>';
  }

  /* ---------------------------------------------------------------- render */

  // Entry animations play once per scene, not on every re-render inside it.
  function sceneKey() { var rt = ui.route || { name: 'city' }; return rt.name + ':' + (rt.loc || '') + ':' + (rt.room || ''); }
  function isNewScene() { return ui.renderedScene !== sceneKey(); }

  function render(opts) {
    opts = opts || {};
    var r = run();
    var route = ui.route || { name: 'city' };
    var focusKey = document.activeElement && document.activeElement.closest && root.contains(document.activeElement) ? keyOf(document.activeElement) : null;
    var scrollY = window.scrollY;
    var view;
    if (route.name === 'last' && store.last) view = lastReport();
    else if (route.name === 'loc' && r) {
      var fn = {
        'idea-park': ideaPark, 'people-street': peopleStreet, 'market-centre': marketCentre,
        'build-studio': route.room === 'test' ? testCorner : buildStudio, 'launch-square': launchSquare, 'founder-hq': founderHQ
      }[route.loc];
      view = fn(r);
    } else view = cityView(r);
    var overlay = '';
    if (ui.confirm) overlay = confirmDialog();
    else if (ui.helpOpen) overlay = helpDialog(r);
    else if (route.name === 'city' && (ui.welcomeOpen || !r || !r.grade)) overlay = welcomeDialog(r);
    root.innerHTML = hud(r) + '<div class="ss-stage">' + view + '</div>' + overlay + '<div id="ss-live" class="sr-only" aria-live="polite"></div>';
    live = document.getElementById('ss-live');
    tagKeys();
    root.classList.toggle('has-overlay', !!overlay);
    var mainEl = document.querySelector('.ss-stage');
    if (overlay) {
      if (mainEl) mainEl.setAttribute('inert', '');
      var first = root.querySelector('.ss-overlay [data-act="confirm-no"], .ss-overlay .ss-grade[aria-pressed="true"], .ss-overlay .ss-grade, .ss-overlay a.btn, .ss-overlay button');
      var keep = focusKey && root.querySelector('.ss-overlay [data-key="' + focusKey + '"]');
      (keep || first || root).focus({ preventScroll: true });
    } else if (focusKey) {
      var el = root.querySelector('[data-key="' + focusKey + '"]');
      if (el) el.focus({ preventScroll: true });
    }
    if (opts.scrollTop) {
      window.scrollTo(0, root.getBoundingClientRect().top + window.scrollY - 64);
      if (!overlay) { var h = root.querySelector('h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }
    } else {
      window.scrollTo(0, scrollY);
    }
    if (opts.reveal) {
      var target = document.getElementById(opts.reveal) || root.querySelector('[data-testid="' + opts.reveal + '"]');
      if (target) { try { target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' }); } catch (e) { /* older browsers */ } }
    }
    ui.anim = {};
    ui.renderedScene = sceneKey();
  }

  function keyOf(el) {
    var b = el.closest('[data-act]');
    if (!b) return null;
    var k = b.getAttribute('data-act') + ':' + (b.getAttribute('data-id') || b.getAttribute('data-loc') || b.getAttribute('data-q') || b.getAttribute('data-grade') || b.getAttribute('data-view') || b.getAttribute('data-i') || '');
    return k;
  }

  // Tag every actionable element with a stable key so focus survives a re-render.
  function tagKeys() {
    root.querySelectorAll('[data-act]').forEach(function (b) { b.setAttribute('data-key', keyOf(b)); });
  }

  /* ---------------------------------------------------------------- events */

  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b || !root.contains(b)) return;
    var act = b.getAttribute('data-act');
    var id = b.getAttribute('data-id');
    var r = run();
    if (b.getAttribute('aria-disabled') === 'true' && act !== 'enter') {
      var why = b.querySelector('.ss-choice-reason');
      if (why) say(why.textContent);
      return;
    }
    switch (act) {
      case 'grade':
        if (r && r.grade && !r.completedAt) dispatch({ type: 'setGrade', grade: b.getAttribute('data-grade') });
        else startRun(b.getAttribute('data-grade'));
        ui.welcomeOpen = false;
        ui.travel = null;
        say('Welcome to Startup City. Idea Park is your first stop.');
        render();
        var spot = root.querySelector('[data-testid="spot-idea-park"]');
        if (spot) spot.focus({ preventScroll: true });
        return;
      case 'welcome': ui.welcomeOpen = true; render(); return;
      case 'close-welcome': ui.welcomeOpen = false; return; // the link navigates
      case 'enter': {
        var loc = b.getAttribute('data-loc');
        if (!r || !r.grade) { ui.welcomeOpen = true; render(); return; }
        if (!E.canEnter(r, loc)) {
          var here = LOC[currentLocation(r)];
          ui.notice = null;
          say(LOC[loc].name + ' is locked. Finish ' + here.name + ' first.');
          var note = root.querySelector('.ss-travel-note') || document.createElement('p');
          note.className = 'ss-travel-note';
          note.setAttribute('role', 'status');
          note.innerHTML = '🔒 <strong>' + esc(LOC[loc].name) + '</strong> is locked. Finish <strong>' + esc(here.name) + '</strong> first.';
          var head = root.querySelector('.ss-city-head');
          if (head && !note.parentNode) head.insertAdjacentElement('afterend', note);
          return;
        }
        ui.travel = null;
        go('#/' + loc);
        return;
      }
      case 'view': store.prefs.view = b.getAttribute('data-view'); save(); render(); return;
      case 'help': ui.helpOpen = true; render(); return;
      case 'close-help': ui.helpOpen = false; render(); return;
      case 'toggle-hud': ui.hudOpen = !ui.hudOpen; render(); return;
      case 'dismiss': ui.notice = null; render(); return;
      case 'start-over': ui.helpOpen = false; ui.confirm = { kind: 'reset' }; render(); return;
      case 'play-again': ui.confirm = { kind: 'reset' }; render(); return;
      case 'confirm-no': ui.confirm = null; render(); return;
      case 'confirm-yes': {
        var c = ui.confirm;
        ui.confirm = null;
        if (c.kind === 'reset') {
          store.current = null;
          ui.welcomeOpen = true;
          save();
          go('#/city');
          render();
        } else {
          dispatch(c.action, { confirmed: true });
        }
        return;
      }
      // Idea Park
      case 'scenario': dispatch({ type: 'pickScenario', id: id }, { anim: 'scenario', say: 'Picked ' + E.content.SCENARIOS.filter(function (s) { return s.id === id; })[0].title + '.' }); revealSoon('card-solution'); return;
      case 'positioning': dispatch({ type: 'pickPositioning', id: id }, { anim: 'positioning' }); revealSoon('card-name'); return;
      case 'name-idea': {
        var n = b.getAttribute('data-name');
        dispatch({ type: 'setName', name: n }, { say: 'Name set to ' + n + '.' });
        return;
      }
      case 'finish-idea': {
        var input = document.getElementById('ss-name');
        if (input) store.current = E.apply(run(), { type: 'setName', name: input.value }).run;
        var out = dispatch({ type: 'finishIdea' });
        if (out && !out.error) travelTo('people-street');
        return;
      }
      // People Street
      case 'talk-to': ui.talkingTo = id; render({ reveal: 'ss-convo' }); return;
      case 'talk-close': ui.talkingTo = null; render(); return;
      case 'ask': {
        var pid = ui.talkingTo;
        dispatch({ type: 'talk', personaId: pid, questionId: b.getAttribute('data-q') }, { anim: 'iv-' + pid, say: 'Answer received. Added to your evidence board.' });
        return;
      }
      case 'swap': dispatch({ type: 'removeInterview', personaId: id }, { say: 'Talk removed. Pick someone new.' }); ui.talkingTo = null; render(); return;
      case 'finish-interviews': { var o2 = dispatch({ type: 'finishInterviews' }); if (o2 && !o2.error) travelTo('market-centre'); return; }
      // Market Centre
      case 'segment': dispatch({ type: 'pickSegment', id: id }, { anim: 'segment' }); revealSoon('card-estimate'); return;
      case 'estimate': dispatch({ type: 'pickEstimate', id: id }); revealSoon('first-market'); return;
      case 'goto-build': travelTo('build-studio'); return;
      // Build Studio
      case 'feature': {
        var had = r.featureIds.indexOf(id) > -1;
        var f = E.featureOf(E.scenarioOf(r), id);
        var o3 = dispatch({ type: 'toggleFeature', id: id });
        if (o3 && !o3.error) { ui.preview.msg = null; say((had ? 'Removed ' : 'Added ') + f.name + '. Money left ' + inr(E.scenarioOf(r).startingCash - E.baseFeatureCost(run())) + '.'); }
        return;
      }
      case 'build': { var o4 = dispatch({ type: 'build' }, { say: 'Built! Opening the Test Corner.' }); if (o4 && !o4.error) go('#/build-studio/test'); return; }
      case 'edit-build': dispatch({ type: 'editBuild' }); return;
      case 'pv-open': ui.preview = { screen: 'detail', item: Number(b.getAttribute('data-i')), msg: null }; render(); return;
      case 'pv-back': ui.preview = { screen: 'list', item: 0, msg: null }; render(); return;
      case 'pv-action': {
        var ids = ui.route.room === 'test' ? E.effectiveFeatures(r) : r.featureIds;
        var sc = E.scenarioOf(r);
        var feats = ids.map(function (x) { return E.featureOf(sc, x); });
        var hasAction = feats.some(function (x) { return x.preview && x.preview.action; });
        var hasPay = feats.some(function (x) { return x.preview && x.preview.step === 'pay'; });
        if (hasAction || hasPay) ui.preview = { screen: hasPay ? 'pay' : 'done', item: ui.preview.item, msg: null };
        else ui.preview.msg = sc.preview.coreActionFeedback;
        render();
        return;
      }
      case 'pv-pay': ui.preview = { screen: 'done', item: ui.preview.item, msg: null }; render(); return;
      // Test Corner
      case 'revision': dispatch({ type: 'pickRevision', id: id }, { anim: 'revision', say: 'Testing again with your change.' }); revealSoon('ss-after'); return;
      case 'goto-launch': travelTo('launch-square'); return;
      // Launch Square
      case 'price': dispatch({ type: 'pickPrice', id: id }); return;
      case 'channel': dispatch({ type: 'pickChannel', id: id }); return;
      case 'open-shop': {
        var o5 = dispatch({ type: 'openShop' }, { anim: 'opened' });
        if (o5 && !o5.error) {
          var w1 = E.simulate(run(), { rounds: 1 }).rounds[0];
          say('Your shop is open! Week 1: ' + w1.orders + ' orders, ' + inr(w1.revenueINR) + ' in sales.');
          revealSoon('card-week1', true);
        }
        return;
      }
      case 'response': {
        var o6 = dispatch({ type: 'pickEventResponse', id: id, now: new Date().toISOString() }, { anim: 'week2' });
        if (o6 && !o6.error) { say('Week 2 is done. Founder HQ is open.'); revealSoon('ss-week2'); }
        return;
      }
      case 'goto-hq': travelTo('founder-hq'); return;
      // Founder HQ
      case 'pdf': downloadPdf(); return;
      case 'print': window.print(); return;
    }
  });

  function revealSoon(id, top) {
    var el = document.getElementById(id) || root.querySelector('[data-testid="' + id + '"]');
    if (!el) return;
    try { el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: top ? 'start' : 'nearest' }); } catch (e) { /* ignore */ }
  }

  root.addEventListener('input', function (e) {
    if (e.target.id !== 'ss-name') return;
    var r = run();
    var out = E.apply(r, { type: 'setName', name: e.target.value });
    if (out.error) return;
    store.current = out.run;
    save();
    var sc = E.scenarioOf(r);
    var nm = root.querySelector('[data-live-name]');
    if (nm) nm.textContent = out.run.startupName || sc.defaultName;
  });

  root.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (ui.confirm) { ui.confirm = null; render(); }
      else if (ui.helpOpen) { ui.helpOpen = false; render(); }
      else if (ui.welcomeOpen && run() && run().grade) { ui.welcomeOpen = false; render(); }
    }
    if (e.key === 'Enter' && e.target.id === 'ss-name') {
      e.preventDefault();
      var btn = root.querySelector('[data-act="finish-idea"]');
      if (btn) btn.click();
    }
    // Keep focus inside an open overlay.
    if (e.key === 'Tab') {
      var ov = root.querySelector('.ss-overlay');
      if (!ov) return;
      var f = ov.querySelectorAll('a[href], button:not([disabled]), input');
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  /* ------------------------------------------------------------------ PDF */

  function safeName(s) {
    var n = String(s || 'startup').normalize('NFKD').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_').slice(0, 40);
    return n || 'startup';
  }

  function downloadPdf() {
    var route = ui.route || {};
    var r = route.name === 'last' ? store.last.run : run();
    if (!r || !r.completedAt || !window.YOPPI_SS_PDF) { ui.pdfStatus = 'The PDF maker didn’t load. Use Print and choose “Save as PDF”.'; render(); return; }
    try {
      var model = reportModel(r);
      var bytes = window.YOPPI_SS_PDF.build(model);
      var blob = new Blob([bytes], { type: 'application/pdf' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'YOPPI_Startup_Sprint_' + safeName(r.startupName) + '.pdf';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 4000);
      ui.pdfStatus = 'Your report PDF is downloading (' + Math.round(bytes.length / 1024) + ' KB).';
    } catch (err) {
      ui.pdfStatus = 'Sorry, the PDF couldn’t be made here. Use Print and choose “Save as PDF”.';
    }
    render();
  }

  // Exposed for QA and tests: read-only views of the state.
  window.YOPPI_SS_APP = {
    state: function () { return JSON.parse(JSON.stringify(store)); },
    reportModel: function () { var r = run(); return r && r.completedAt ? reportModel(r) : null; }
  };

  // Coming back to the city page with an unfinished game: offer to continue or start over.
  if ((!location.hash || location.hash === '#/city') && store.current && store.current.grade && !store.current.completedAt) ui.welcomeOpen = true;

  window.addEventListener('hashchange', onRoute);
  onRoute();
})();
