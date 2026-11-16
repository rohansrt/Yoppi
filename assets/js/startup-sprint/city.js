/* YOPPI Startup Sprint: Startup City drawings (inline SVG, no libraries).
   Everything drawn here is derived from the run passed in; nothing is random. */
(function (root) {
  'use strict';

  var VIEW_W = 1000, VIEW_H = 600;

  // Ground centre of each landmark in the 1000×600 map.
  var SPOTS = {
    'idea-park': { x: 175, y: 222 },
    'people-street': { x: 500, y: 214 },
    'market-centre': { x: 825, y: 222 },
    'build-studio': { x: 175, y: 478 },
    'launch-square': { x: 500, y: 470 },
    'founder-hq': { x: 825, y: 478 }
  };

  // Where each landmark meets the road, and the road between them (for travel).
  var ROAD = 'M30 268 L905 268 C960 268 960 322 905 322 L95 322 C40 322 40 540 95 540 L970 540';
  var LEGS = {
    'idea-park>people-street': 'M175 268 L500 268',
    'people-street>market-centre': 'M500 268 L825 268',
    'market-centre>build-studio': 'M825 268 L905 268 C960 268 960 322 905 322 L95 322 C40 322 40 540 95 540 L175 540',
    'build-studio>launch-square': 'M175 540 L500 540',
    'launch-square>founder-hq': 'M500 540 L825 540'
  };
  var ORDER = ['idea-park', 'people-street', 'market-centre', 'build-studio', 'launch-square', 'founder-hq'];

  var TONES = {
    teal: { light: '#dcf5f1', mid: '#aee7df', roof: '#6fd3c6', badge: '#0f8f82' },
    blue: { light: '#e3ecfe', mid: '#bdd2fb', roof: '#8fb1f6', badge: '#2563eb' },
    amber: { light: '#fdefd2', mid: '#f8dca2', roof: '#efc066', badge: '#a35c00' },
    violet: { light: '#e8e5fc', mid: '#cdc6f6', roof: '#a99ef0', badge: '#6250d6' },
    rose: { light: '#fde3ec', mid: '#f7c3d5', roof: '#ef97b6', badge: '#c22e63' },
    navy: { light: '#e2e8f2', mid: '#bfcbdf', roof: '#8ea3c2', badge: '#1a3350' }
  };

  // Lucide icon paths (ISC), 24×24.
  var ICONS = {
    bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/>',
    store: '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/>',
    blocks: '<rect width="7" height="7" x="14" y="3" rx="1"/><path d="M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>'
  };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function pts(list) { return list.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); }
  function up(p, k) { return [p[0], p[1] - k]; }
  function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }

  /** An isometric box: walls, a flat roof and a few windows. Returns svg + key points. */
  function box(x, y, w, d, h, tone, opts) {
    opts = opts || {};
    var T = TONES[tone];
    var L = [x - w, y], F = [x, y + d], R = [x + w, y], B = [x, y - d];
    var s = '';
    s += '<polygon points="' + pts([L, F, up(F, h), up(L, h)]) + '" fill="' + T.light + '" stroke="#ffffff" stroke-width="1"/>';
    s += '<polygon points="' + pts([F, R, up(R, h), up(F, h)]) + '" fill="' + T.mid + '" stroke="#ffffff" stroke-width="1"/>';
    s += '<polygon points="' + pts([up(L, h), up(F, h), up(R, h), up(B, h)]) + '" fill="' + T.roof + '"/>';
    function win(a, b, t0, t1, s0, s1, fill) {
      var p0 = up(lerp(a, b, t0), h * s0), p1 = up(lerp(a, b, t1), h * s0), p2 = up(lerp(a, b, t1), h * s1), p3 = up(lerp(a, b, t0), h * s1);
      return '<polygon points="' + pts([p0, p1, p2, p3]) + '" fill="' + (fill || '#ffffff') + '" opacity="0.9"/>';
    }
    if (!opts.noWindows) {
      s += win(L, F, 0.18, 0.42, 0.45, 0.78);
      s += win(L, F, 0.58, 0.82, 0.45, 0.78);
      s += win(F, R, 0.2, 0.4, 0, 0.62, T.badge); // door
      s += win(F, R, 0.58, 0.82, 0.42, 0.78);
    }
    return { svg: s, top: up(B, h), roofCentre: [x, y - h], front: F, L: L, R: R, B: B, h: h, win: win };
  }

  function badge(x, y, tone, icon, r) {
    r = r || 19;
    var T = TONES[tone];
    return '<g class="ss-badge"><circle cx="' + x + '" cy="' + y + '" r="' + (r + 4) + '" fill="#ffffff"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + T.badge + '"/>' +
      '<g transform="translate(' + (x - 10) + ' ' + (y - 10) + ') scale(0.8333)" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICONS[icon] + '</g></g>';
  }

  function tree(x, y, r) {
    return '<ellipse cx="' + x + '" cy="' + (y + r * 0.8) + '" rx="' + r * 0.9 + '" ry="' + r * 0.35 + '" fill="#000" opacity="0.06"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#8fcf9d"/><circle cx="' + (x - r * 0.3) + '" cy="' + (y - r * 0.3) + '" r="' + r * 0.45 + '" fill="#b5e2bd"/>';
  }

  function person(x, y, color) {
    return '<g><circle cx="' + x + '" cy="' + (y - 11) + '" r="4" fill="' + color + '"/><rect x="' + (x - 4) + '" y="' + (y - 7) + '" width="8" height="10" rx="4" fill="' + color + '"/></g>';
  }

  /* ------------------------------------------------------------ landmarks */

  function drawLandmark(id, view) {
    var sp = SPOTS[id];
    var x = sp.x, y = sp.y;
    var s = '';
    var b;
    var status = view.status[id];
    var tone = view.tones[id];
    s += '<ellipse cx="' + x + '" cy="' + (y + 18) + '" rx="78" ry="26" fill="#0b2340" opacity="0.06"/>';

    if (id === 'idea-park') {
      // Lawn, trees, a small pavilion.
      s += '<polygon points="' + pts([[x - 92, y + 2], [x - 4, y + 40], [x + 86, y + 2], [x - 4, y - 36]]) + '" fill="#cdebd2"/>';
      s += tree(x - 62, y - 6, 13) + tree(x + 58, y - 4, 11) + tree(x - 30, y + 20, 9);
      b = box(x + 4, y - 2, 40, 22, 40, tone);
      s += b.svg;
      if (!view.scenario) {
        // Three idea bubbles waiting to be picked.
        [[x - 70, y - 70], [x - 40, y - 96], [x + 62, y - 74]].forEach(function (p, i) {
          s += '<g class="ss-float" style="animation-delay:' + i * 0.6 + 's"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="12" fill="#ffffff" stroke="#aee7df" stroke-width="2"/><text x="' + p[0] + '" y="' + (p[1] + 5) + '" text-anchor="middle" font-size="14" font-weight="700" fill="#0f8f82">?</text></g>';
        });
      } else {
        // A signpost with the chosen business.
        s += '<line x1="' + (x - 62) + '" y1="' + (y + 6) + '" x2="' + (x - 62) + '" y2="' + (y - 52) + '" stroke="#8a6a44" stroke-width="3"/>';
        s += '<rect x="' + (x - 104) + '" y="' + (y - 82) + '" width="84" height="30" rx="7" fill="#ffffff" stroke="#6fd3c6" stroke-width="2"/>';
        s += '<text x="' + (x - 62) + '" y="' + (y - 62) + '" text-anchor="middle" font-size="15">' + view.scenario.emoji + '</text>';
      }
    } else if (id === 'people-street') {
      b = box(x - 30, y + 4, 34, 20, 38, tone);
      s += b.svg;
      var b2 = box(x + 38, y - 8, 34, 20, 48, tone);
      s += b2.svg;
      b = { top: [x, y - 66], roofCentre: [x, y - 56] };
      // Insight pins: one per talk done.
      for (var i = 0; i < view.interviews; i++) {
        var px = x - 52 + i * 34, py = y - 70 - (i % 2) * 10;
        s += '<g class="ss-pop"><path d="M' + px + ' ' + (py + 14) + ' l-6 -8 a8 8 0 1 1 12 0 z" fill="#2563eb"/><circle cx="' + px + '" cy="' + (py + 1) + '" r="3" fill="#ffffff"/></g>';
      }
      s += person(x - 76, y + 30, '#e0457b') + person(x + 74, y + 30, '#12b8a6');
    } else if (id === 'market-centre') {
      b = box(x, y, 46, 26, 44, tone);
      s += b.svg;
      // Striped awning on the front wall.
      var a0 = up(lerp(b.front, b.R, 0.05), 44 * 0.92), a1 = up(lerp(b.front, b.R, 0.95), 44 * 0.92);
      s += '<polygon points="' + pts([a0, a1, [a1[0] + 6, a1[1] + 14], [a0[0] + 6, a0[1] + 14]]) + '" fill="#f0bf5c" stroke="#ffffff" stroke-width="2" stroke-dasharray="6 4"/>';
      s += '<rect x="' + (x - 98) + '" y="' + (y - 6) + '" width="26" height="18" rx="3" fill="#fdefd2" stroke="#efc066"/>';
      if (view.segment) {
        s += '<g class="ss-pop"><rect x="' + (x - 44) + '" y="' + (y - 112) + '" width="88" height="26" rx="13" fill="#ffffff" stroke="#efc066" stroke-width="2"/>' +
          '<text x="' + x + '" y="' + (y - 94) + '" text-anchor="middle" font-size="14">' + view.segment.emoji + '</text></g>';
      }
    } else if (id === 'build-studio') {
      b = box(x - 12, y, 44, 26, 44, tone);
      s += b.svg;
      // Test Corner annex.
      var t = box(x + 60, y + 16, 22, 13, 26, tone, { noWindows: true });
      s += t.svg;
      s += '<text x="' + (x + 66) + '" y="' + (y + 22) + '" text-anchor="middle" font-size="8.5" font-weight="700" fill="#4c3cc0">TEST</text>';
      // One module on the roof per chosen feature.
      for (var k = 0; k < view.features; k++) {
        var mx = x - 34 + k * 22, my = y - 44 - 6 + (k === 1 ? -6 : 0);
        s += '<g class="ss-pop"><rect x="' + mx + '" y="' + (my - 12) + '" width="16" height="16" rx="3" fill="' + ['#6250d6', '#12b8a6', '#eda100'][k] + '" stroke="#ffffff" stroke-width="2"/></g>';
      }
      if (view.testers) {
        view.testers.forEach(function (ok, j) {
          s += '<g class="ss-pop"><circle cx="' + (x + 42 + j * 18) + '" cy="' + (y - 30) + '" r="8" fill="#ffffff" stroke="' + (ok ? '#12b8a6' : '#e0457b') + '" stroke-width="2"/>' +
            '<text x="' + (x + 42 + j * 18) + '" y="' + (y - 26.5) + '" text-anchor="middle" font-size="10" font-weight="700" fill="' + (ok ? '#0b7a6f' : '#b4235a') + '">' + (ok ? '✓' : '!') + '</text></g>';
        });
      }
    } else if (id === 'launch-square') {
      // Plaza + storefront.
      s += '<polygon points="' + pts([[x - 96, y + 4], [x, y + 46], [x + 96, y + 4], [x, y - 38]]) + '" fill="#fbe7ee"/>';
      b = box(x, y - 4, 46, 26, 46, tone);
      s += b.svg;
      var s0 = up(lerp(b.front, b.R, 0.08), 46 * 0.18), s1 = up(lerp(b.front, b.R, 0.92), 46 * 0.18);
      if (view.shopName) {
        // Name board on the roof edge.
        s += '<g class="ss-pop"><rect x="' + (x - 58) + '" y="' + (y - 98) + '" width="116" height="24" rx="6" fill="#ffffff" stroke="#ef97b6" stroke-width="2"/>' +
          '<text x="' + x + '" y="' + (y - 81) + '" text-anchor="middle" font-size="12" font-weight="700" fill="#10243a">' + esc(view.shopName.length > 16 ? view.shopName.slice(0, 15) + '…' : view.shopName) + '</text></g>';
      }
      if (!view.opened) {
        // Shutters down.
        for (var q = 0; q < 4; q++) {
          var r0 = up(lerp(b.front, b.R, 0.08), 46 * (0.2 + q * 0.14)), r1 = up(lerp(b.front, b.R, 0.92), 46 * (0.2 + q * 0.14));
          s += '<line x1="' + r0[0] + '" y1="' + r0[1] + '" x2="' + r1[0] + '" y2="' + r1[1] + '" stroke="#c22e63" stroke-width="2" opacity="0.35"/>';
        }
      } else {
        s += '<polygon points="' + pts([up(s0, 34), up(s1, 34), [s1[0] + 6, s1[1] - 22], [s0[0] + 6, s0[1] - 22]]) + '" fill="#ef97b6" stroke="#ffffff" stroke-width="2" stroke-dasharray="6 4"/>';
        // Customers: a dot for every few orders, from the engine result.
        var n = Math.min(8, view.customers);
        for (var c = 0; c < n; c++) {
          var cx = x - 84 + c * 13, cy = y + 34 - (c % 2) * 6;
          s += '<g class="ss-walk" style="animation-delay:' + (c * 0.25) + 's">' + person(cx, cy, ['#2563eb', '#12b8a6', '#e0457b', '#eda100'][c % 4]) + '</g>';
        }
      }
    } else if (id === 'founder-hq') {
      b = box(x, y, 42, 24, 70, tone);
      s += b.svg;
      s += b.win(b.L, b.front, 0.18, 0.42, 0.12, 0.32) + b.win(b.L, b.front, 0.58, 0.82, 0.12, 0.32);
      s += '<line x1="' + x + '" y1="' + (y - 94) + '" x2="' + x + '" y2="' + (y - 124) + '" stroke="#1a3350" stroke-width="2"/>';
      s += '<polygon points="' + x + ',' + (y - 124) + ' ' + (x + 24) + ',' + (y - 117) + ' ' + x + ',' + (y - 110) + '" fill="' + (status === 'locked' ? '#94a3b8' : '#eda100') + '"/>';
    }

    var iconY = (b.top ? b.top[1] : y - 70) - 28;
    if (id === 'founder-hq') iconY = y - 70 - 24 - 34;
    if (id === 'idea-park') iconY = y - 92;
    s += badge(x + (id === 'founder-hq' ? -34 : 0), iconY, tone, view.icons[id], 18);
    if (status === 'done') {
      s += '<g><circle cx="' + (x + 22) + '" cy="' + (iconY - 14) + '" r="10" fill="#0b7a6f" stroke="#ffffff" stroke-width="2.5"/>' +
        '<g transform="translate(' + (x + 15.5) + ' ' + (iconY - 20.5) + ') scale(0.54)" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">' + ICONS.check + '</g></g>';
    }
    if (status === 'locked') {
      s += '<g><circle cx="' + (x + 22) + '" cy="' + (iconY - 14) + '" r="10" fill="#64748b" stroke="#ffffff" stroke-width="2.5"/>' +
        '<g transform="translate(' + (x + 16) + ' ' + (iconY - 20) + ') scale(0.5)" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' + ICONS.lock + '</g></g>';
    }
    var glow = status === 'current' ? '<ellipse class="ss-glow" cx="' + x + '" cy="' + (y + 6) + '" rx="92" ry="40" fill="none" stroke="#6250d6" stroke-width="3"/>' : '';
    return '<g class="ss-landmark is-' + status + '" data-landmark="' + id + '">' + glow + s + '</g>';
  }

  /**
   * The whole town. view = { status, tones, icons, scenario, interviews, segment, features,
   * testers, shopName, opened, customers, done: [ids done], travel: {from,to} }
   */
  function map(view) {
    var s = '<svg class="ss-map-svg" viewBox="0 0 ' + VIEW_W + ' ' + VIEW_H + '" role="img" aria-labelledby="ss-map-title">' +
      '<title id="ss-map-title">Startup City map with six places joined by one road: Idea Park, People Street, Market Centre, Build Studio, Launch Square and Founder HQ.</title>';
    // Ground, parks and water.
    s += '<rect width="1000" height="600" fill="#f1f6f0"/>';
    s += '<ellipse cx="80" cy="90" rx="120" ry="70" fill="#e1efdf"/><ellipse cx="940" cy="420" rx="110" ry="80" fill="#e1efdf"/><ellipse cx="520" cy="600" rx="260" ry="40" fill="#e1efdf"/>';
    s += '<path d="M640 0 C 660 40, 700 50, 740 40 S 820 10, 860 0 Z" fill="#d6e8fb"/>';
    // Road.
    s += '<path d="' + ROAD + '" fill="none" stroke="#d7dee8" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>';
    s += '<path d="' + ROAD + '" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="10 12"/>';
    // Finished stretches of road light up.
    for (var i = 0; i < ORDER.length - 1; i++) {
      if (view.done.indexOf(ORDER[i]) > -1 && (view.done.indexOf(ORDER[i + 1]) > -1 || view.status[ORDER[i + 1]] === 'current')) {
        s += '<path d="' + LEGS[ORDER[i] + '>' + ORDER[i + 1]] + '" fill="none" stroke="#12b8a6" stroke-width="6" stroke-linecap="round" opacity="0.55"/>';
      }
    }
    // Trees.
    [[60, 140, 14], [320, 120, 12], [360, 150, 9], [650, 120, 12], [960, 150, 13], [300, 420, 12], [700, 410, 13], [80, 600, 0], [930, 600, 0], [40, 420, 11], [970, 330, 0], [620, 590, 11], [380, 590, 10], [260, 210, 9], [740, 210, 10]].forEach(function (t) {
      if (t[2]) s += tree(t[0], t[1], t[2]);
    });
    ORDER.forEach(function (id) { s += drawLandmark(id, view); });
    // Travel: a marker moves along the road to the next place.
    if (view.travel && LEGS[view.travel.from + '>' + view.travel.to]) {
      s += '<g class="ss-traveller"><circle r="11" fill="#6250d6" stroke="#ffffff" stroke-width="4"/>' +
        (view.reduceMotion ? '' : '<animateMotion dur="1.4s" fill="freeze" path="' + LEGS[view.travel.from + '>' + view.travel.to] + '" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.2 1"/>') + '</g>';
      if (view.reduceMotion) {
        var to = SPOTS[view.travel.to];
        s = s.replace('<g class="ss-traveller">', '<g class="ss-traveller" transform="translate(' + to.x + ' ' + (to.y + 62) + ')">');
      }
    }
    s += '</svg>';
    return s;
  }

  /** Hotspot position (percent of the map box) for the HTML buttons laid over each landmark. */
  function hotspot(id) {
    var sp = SPOTS[id];
    return { left: (sp.x - 90) / VIEW_W * 100, top: (sp.y - 140) / VIEW_H * 100, width: 180 / VIEW_W * 100, height: 196 / VIEW_H * 100 };
  }

  /** One landmark on its own, for scene headers. */
  function single(id, view) {
    var sp = SPOTS[id];
    return '<svg viewBox="' + (sp.x - 120) + ' ' + (sp.y - 150) + ' 240 210" class="ss-scene-svg" aria-hidden="true" focusable="false">' + drawLandmark(id, view) + '</svg>';
  }

  /** A storefront for Launch Square: customers walk in, one figure per order (max 12). */
  function storefront(o) {
    var T = TONES.rose;
    var s = '<svg viewBox="0 0 520 220" class="ss-store-svg" role="img" aria-label="' + esc(o.label) + '">';
    s += '<rect width="520" height="220" fill="#fff7fa"/><rect y="176" width="520" height="44" fill="#f3e3ea"/>';
    s += '<rect x="150" y="40" width="220" height="136" rx="6" fill="' + T.light + '"/>';
    s += '<rect x="150" y="40" width="220" height="30" rx="6" fill="#ffffff" stroke="' + T.roof + '" stroke-width="2"/>';
    s += '<text x="260" y="61" text-anchor="middle" font-size="16" font-weight="700" fill="#10243a">' + esc(o.name.length > 24 ? o.name.slice(0, 23) + '…' : o.name) + '</text>';
    for (var i = 0; i < 8; i++) s += '<rect x="' + (150 + i * 27.5) + '" y="72" width="27.5" height="20" fill="' + (i % 2 ? '#ffffff' : T.roof) + '"/>';
    s += '<rect x="235" y="112" width="50" height="64" rx="3" fill="' + T.badge + '" opacity="0.85"/>';
    s += '<rect x="168" y="108" width="52" height="40" rx="3" fill="#ffffff" opacity="0.9"/><rect x="300" y="108" width="52" height="40" rx="3" fill="#ffffff" opacity="0.9"/>';
    s += '<text x="194" y="134" text-anchor="middle" font-size="18">' + o.emoji + '</text>';
    s += '<text x="326" y="134" text-anchor="middle" font-size="12" font-weight="700" fill="#0b7a6f">OPEN</text>';
    var n = Math.min(14, Math.ceil(o.orders / 3)); // one figure for about every three orders
    for (var k = 0; k < n; k++) {
      var startX = k % 2 ? 520 + (k * 18) % 60 : -20 - (k * 18) % 60;
      var standX = 196 + (k % 7) * 22 - (k > 6 ? 11 : 0);
      s += '<g class="ss-customer" style="--from:' + (startX - standX) + 'px;animation-delay:' + (k * 0.18).toFixed(2) + 's">' +
        person(standX, 200 - (k > 6 ? 10 : 0), ['#2563eb', '#12b8a6', '#e0457b', '#eda100', '#6250d6'][k % 5]) + '</g>';
    }
    if (!n) s += '<text x="260" y="205" text-anchor="middle" font-size="12" fill="#64748b">The street is quiet this week.</text>';
    s += '</svg>';
    return s;
  }

  root.YOPPI_SS_CITY = {
    ORDER: ORDER, TONES: TONES, ICONS: ICONS,
    map: map, hotspot: hotspot, single: single, storefront: storefront
  };
})(typeof self !== 'undefined' ? self : this);
