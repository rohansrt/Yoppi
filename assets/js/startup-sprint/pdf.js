/* YOPPI Startup Sprint: a tiny PDF writer for "My Startup Report" (A4, two pages).
   No libraries: vector shapes + the built-in Helvetica fonts, with real character widths
   for wrapping. The ₹ sign isn't in the standard PDF fonts, so it is drawn as a small path.
   build(model) returns a Uint8Array holding a complete PDF file. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.YOPPI_SS_PDF = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PAGE_W = 595.28, PAGE_H = 841.89, M = 36;

  // Helvetica / Helvetica-Bold advance widths (1/1000 em) for ASCII 32–126.
  var HELV = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
  var HELVB = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584];
  // Extra WinAnsi characters we use: code -> [regular, bold] width.
  var EXTRA = { 0x85: [1000, 1000], 0x91: [222, 278], 0x92: [222, 278], 0x93: [333, 500], 0x94: [333, 500], 0x95: [350, 350], 0x96: [556, 556], 0x97: [1000, 1000], 0xB7: [278, 278], 0xD7: [584, 584] };
  var MAP = { '—': 0x97, '–': 0x96, '’': 0x92, '‘': 0x91, '“': 0x93, '”': 0x94, '•': 0x95, '…': 0x85, '×': 0xD7, '·': 0xB7, '−': 0x2D };
  var RUPEE_W = 0.56;

  /** Unicode → WinAnsi characters (one byte each). Unsupported characters (emoji, other scripts) are dropped. */
  function encode(str) {
    var out = '';
    str = String(str == null ? '' : str).normalize ? String(str).normalize('NFC') : String(str);
    for (var i = 0; i < str.length; i++) {
      var ch = str[i], c = str.charCodeAt(i);
      if (ch === '₹') { out += '\u0001'; continue; } // placeholder: drawn as a path
      if (MAP[ch] != null) { out += String.fromCharCode(MAP[ch]); continue; }
      if (c >= 32 && c <= 126) { out += ch; continue; }
      if (c >= 0xA0 && c <= 0xFF) { out += ch; continue; }
      if (c >= 0xD800 && c <= 0xDBFF) i++; // skip the rest of a surrogate pair
    }
    return out.replace(/\s+/g, ' ');
  }

  function charW(code, bold) {
    if (code === 1) return RUPEE_W * 1000;
    if (code >= 32 && code <= 126) return (bold ? HELVB : HELV)[code - 32];
    if (EXTRA[code]) return EXTRA[code][bold ? 1 : 0];
    return 556;
  }
  function width(enc, size, bold) {
    var w = 0;
    for (var i = 0; i < enc.length; i++) w += charW(enc.charCodeAt(i), bold);
    return w * size / 1000;
  }

  function hex(c) {
    var n = parseInt(c.replace('#', ''), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map(function (v) { return v.toFixed(3); }).join(' ');
  }
  function f(n) { return (Math.round(n * 100) / 100).toString(); }

  /* --------------------------------------------------------- page drawing */

  function Page() { this.ops = []; }
  var P = Page.prototype;
  P.y = function (y) { return PAGE_H - y; };
  P.fill = function (c) { this.ops.push(hex(c) + ' rg'); return this; };
  P.stroke = function (c) { this.ops.push(hex(c) + ' RG'); return this; };
  P.lw = function (w) { this.ops.push(f(w) + ' w'); return this; };
  P.roundPath = function (x, y, w, h, r) {
    r = Math.min(r || 0, w / 2, h / 2);
    var k = 0.5523 * r, X = x, Y = this.y(y + h);
    if (!r) { this.ops.push(f(X) + ' ' + f(Y) + ' ' + f(w) + ' ' + f(h) + ' re'); return this; }
    this.ops.push(
      f(X + r) + ' ' + f(Y) + ' m',
      f(X + w - r) + ' ' + f(Y) + ' l',
      f(X + w - r + k) + ' ' + f(Y) + ' ' + f(X + w) + ' ' + f(Y + r - k) + ' ' + f(X + w) + ' ' + f(Y + r) + ' c',
      f(X + w) + ' ' + f(Y + h - r) + ' l',
      f(X + w) + ' ' + f(Y + h - r + k) + ' ' + f(X + w - r + k) + ' ' + f(Y + h) + ' ' + f(X + w - r) + ' ' + f(Y + h) + ' c',
      f(X + r) + ' ' + f(Y + h) + ' l',
      f(X + r - k) + ' ' + f(Y + h) + ' ' + f(X) + ' ' + f(Y + h - r + k) + ' ' + f(X) + ' ' + f(Y + h - r) + ' c',
      f(X) + ' ' + f(Y + r) + ' l',
      f(X) + ' ' + f(Y + r - k) + ' ' + f(X + r - k) + ' ' + f(Y) + ' ' + f(X + r) + ' ' + f(Y) + ' c', 'h');
    return this;
  };
  P.rect = function (x, y, w, h, o) {
    o = o || {};
    if (o.fill) this.fill(o.fill);
    if (o.stroke) { this.stroke(o.stroke); this.lw(o.lw || 0.75); }
    this.roundPath(x, y, w, h, o.r || 0);
    this.ops.push(o.fill && o.stroke ? 'B' : o.fill ? 'f' : 'S');
    return this;
  };
  P.circlePath = function (cx, cy, r) {
    var k = 0.5523 * r, X = cx, Y = this.y(cy);
    this.ops.push(f(X + r) + ' ' + f(Y) + ' m',
      f(X + r) + ' ' + f(Y + k) + ' ' + f(X + k) + ' ' + f(Y + r) + ' ' + f(X) + ' ' + f(Y + r) + ' c',
      f(X - k) + ' ' + f(Y + r) + ' ' + f(X - r) + ' ' + f(Y + k) + ' ' + f(X - r) + ' ' + f(Y) + ' c',
      f(X - r) + ' ' + f(Y - k) + ' ' + f(X - k) + ' ' + f(Y - r) + ' ' + f(X) + ' ' + f(Y - r) + ' c',
      f(X + k) + ' ' + f(Y - r) + ' ' + f(X + r) + ' ' + f(Y - k) + ' ' + f(X + r) + ' ' + f(Y) + ' c', 'h');
    return this;
  };
  P.circle = function (cx, cy, r, o) {
    o = o || {};
    if (o.fill) this.fill(o.fill);
    if (o.stroke) { this.stroke(o.stroke); this.lw(o.lw || 1); }
    if (o.dash) this.ops.push('[' + o.dash.join(' ') + '] 0 d');
    this.circlePath(cx, cy, r);
    this.ops.push(o.fill && o.stroke ? 'B' : o.fill ? 'f' : 'S');
    if (o.dash) this.ops.push('[] 0 d');
    return this;
  };
  P.line = function (x1, y1, x2, y2, c, w, dash) {
    this.stroke(c).lw(w || 1);
    if (dash) this.ops.push('[' + dash.join(' ') + '] 0 d');
    this.ops.push(f(x1) + ' ' + f(this.y(y1)) + ' m ' + f(x2) + ' ' + f(this.y(y2)) + ' l S');
    if (dash) this.ops.push('[] 0 d');
    return this;
  };
  P.save = function () { this.ops.push('q'); return this; };
  P.restore = function () { this.ops.push('Q'); return this; };
  P.clipRound = function (x, y, w, h, r) { this.roundPath(x, y, w, h, r); this.ops.push('W n'); return this; };

  /** A ₹ sign as strokes, sitting on the baseline at (x, y) for a given font size. */
  P.rupee = function (x, y, size, color, bold) {
    var s = size, t = (bold ? 0.085 : 0.065) * s;
    var X = function (u) { return f(x + u * s); }, Y = function (v) { return f(this.y(y) + v * s); }.bind(this);
    // Invisible "Rs" underneath, so copied or read-aloud text still says the currency.
    this.ops.push('BT 3 Tr /F1 ' + f(s) + ' Tf 45.8 Tz ' + f(x) + ' ' + f(this.y(y)) + ' Td (Rs) Tj 100 Tz 0 Tr ET');
    this.stroke(color).lw(t);
    this.ops.push('1 J 1 j');
    this.ops.push(X(0.06) + ' ' + Y(0.70) + ' m ' + X(0.50) + ' ' + Y(0.70) + ' l S');
    this.ops.push(X(0.06) + ' ' + Y(0.56) + ' m ' + X(0.50) + ' ' + Y(0.56) + ' l S');
    this.ops.push(X(0.10) + ' ' + Y(0.70) + ' m ' + X(0.40) + ' ' + Y(0.70) + ' ' + X(0.46) + ' ' + Y(0.40) + ' ' + X(0.12) + ' ' + Y(0.40) + ' c S');
    this.ops.push(X(0.12) + ' ' + Y(0.40) + ' m ' + X(0.46) + ' ' + Y(0.0) + ' l S');
    this.ops.push('0 J 0 j');
  };

  /** Draw one line of text. y is the baseline (from the top of the page). */
  P.text = function (str, x, y, o) {
    o = o || {};
    var size = o.size || 10, bold = !!o.bold, color = o.color || '#10243a';
    var enc = o.encoded ? str : encode(str);
    var w = width(enc, size, bold);
    if (o.align === 'center') x -= w / 2;
    else if (o.align === 'right') x -= w;
    var parts = enc.split('\u0001');
    var cx = x;
    for (var i = 0; i < parts.length; i++) {
      if (parts[i]) {
        var esc = parts[i].replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
        this.fill(color);
        this.ops.push('BT /' + (bold ? 'F2' : 'F1') + ' ' + f(size) + ' Tf ' + f(cx) + ' ' + f(this.y(y)) + ' Td (' + esc + ') Tj ET');
        cx += width(parts[i], size, bold);
      }
      if (i < parts.length - 1) { this.rupee(cx, y, size, color, bold); cx += RUPEE_W * size; }
    }
    return w;
  };

  /** Wrap text to a width. Returns encoded lines. */
  function wrap(str, maxW, size, bold) {
    var words = encode(str).split(' ');
    var lines = [], line = '';
    words.forEach(function (w) {
      var test = line ? line + ' ' + w : w;
      if (width(test, size, bold) <= maxW || !line) line = test;
      else { lines.push(line); line = w; }
    });
    if (line) lines.push(line);
    // Break any single word that is still too long.
    var out = [];
    lines.forEach(function (l) {
      while (width(l, size, bold) > maxW && l.length > 1) {
        var cut = l.length - 1;
        while (cut > 1 && width(l.slice(0, cut), size, bold) > maxW) cut--;
        out.push(l.slice(0, cut));
        l = l.slice(cut);
      }
      out.push(l);
    });
    return out;
  }

  /** A wrapped paragraph; returns the y after the last line. */
  P.para = function (str, x, y, maxW, o) {
    o = o || {};
    var size = o.size || 9.5, lh = o.lh || size * 1.4;
    var lines = wrap(str, maxW, size, o.bold);
    if (o.maxLines && lines.length > o.maxLines) {
      lines = lines.slice(0, o.maxLines);
      var last = lines[lines.length - 1];
      while (last.length > 1 && width(last + '\x85', size, o.bold) > maxW) last = last.slice(0, -1);
      lines[lines.length - 1] = last.replace(/\s+$/, '') + '\x85';
    }
    var self = this;
    var ax = o.align === 'center' ? x + maxW / 2 : o.align === 'right' ? x + maxW : x;
    lines.forEach(function (l, i) { self.text(l, ax, y + i * lh, { size: size, bold: o.bold, color: o.color, encoded: true, align: o.align }); });
    return y + lines.length * lh;
  };

  function money(n) {
    var neg = n < 0, s = String(Math.abs(Math.round(n)));
    var last3 = s.slice(-3), rest = s.slice(0, -3);
    if (rest) last3 = ',' + last3;
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return (neg ? '-' : '') + '₹' + rest + last3;
  }

  /* ------------------------------------------------------------- colours */

  var COL = {
    navy: '#10243a', ink: '#475569', muted: '#64748b', line: '#e4e9f0', surface: '#f7f9fc',
    blue: '#2563eb', teal: '#0b7a6f', tealBg: '#e8f8f6', amber: '#a35c00', amberBg: '#fdf6e6',
    violet: '#6250d6', violetBg: '#f2f0fe', rose: '#b4235a', roseBg: '#fdeff4',
    night: '#24307a', night2: '#3b3aa8', night3: '#5a49c9', revenue: '#2563eb', cost: '#eda100', orders: '#12b8a6'
  };
  var TONES = ['#12b8a6', '#2563eb', '#eda100', '#6250d6', '#e0457b', '#1a3350'];

  /* --------------------------------------------------------------- layout */

  function sectionTitle(pg, t, x, y) { pg.text(t, x, y, { size: 12, bold: true, color: COL.navy }); return y + 14; }

  function footer(pg, m, n) {
    pg.line(M, PAGE_H - 46, PAGE_W - M, PAGE_H - 46, COL.line, 0.75);
    pg.text('Made with YOPPI · Startup Sprint' + (m.date ? ' · ' + m.date : '') + ' · ' + m.gradeLabel, M, PAGE_H - 32, { size: 8, color: COL.muted });
    pg.text('All figures are from a fictional simulation; no real sales occurred.', M, PAGE_H - 21, { size: 8, bold: true, color: COL.ink });
    pg.text('Page ' + n + ' of 2 · ' + m.versions, PAGE_W - M, PAGE_H - 21, { size: 7, color: COL.muted, align: 'right' });
  }

  function phone(pg, m, x, y, w, h) {
    pg.rect(x, y, w, h, { fill: '#ffffff', stroke: '#cbd5e1', lw: 1.2, r: 12 });
    pg.rect(x + 6, y + 6, w - 12, 26, { fill: COL.violetBg, r: 7 });
    pg.para(m.startupName, x + 12, y + 17, w - 24, { size: 7.5, bold: true, color: COL.navy, maxLines: 1 });
    pg.text(m.appTitle, x + 12, y + 27, { size: 6.5, color: COL.muted });
    var rowY = y + 40;
    m.previewItems.slice(0, 3).forEach(function (it) {
      pg.rect(x + 8, rowY, w - 16, 24, { fill: COL.surface, r: 5 });
      pg.rect(x + 12, rowY + 4, 16, 16, { fill: '#e2e8f0', r: 4 });
      pg.para(it, x + 32, rowY + 15, w - 64, { size: 6.5, bold: true, color: COL.navy, maxLines: 1 });
      pg.text(money(m.price), x + w - 12, rowY + 15, { size: 6.5, bold: true, color: COL.blue, align: 'right' });
      rowY += 28;
    });
    pg.rect(x + 8, y + h - 26, w - 16, 18, { fill: COL.blue, r: 6 });
    pg.text('Order', x + w / 2, y + h - 14, { size: 7, bold: true, color: '#ffffff', align: 'center' });
  }

  function page1(m) {
    var pg = new Page();
    var r = m.result;
    // Hero band.
    var hx = M, hy = M, hw = PAGE_W - 2 * M, hh = 176;
    pg.save().clipRound(hx, hy, hw, hh, 18);
    pg.rect(hx, hy, hw, hh, { fill: COL.night });
    pg.circle(hx + hw - 40, hy + 10, 150, { fill: COL.night3 });
    pg.circle(hx + hw - 120, hy + hh + 40, 110, { fill: COL.night2 });
    pg.restore();
    pg.text('YOPPI · STARTUP SPRINT · MY STARTUP REPORT', hx + 22, hy + 28, { size: 8, bold: true, color: '#c9cdf3' });
    var nameSize = 26;
    var nameLines = wrap(m.startupName, 300, nameSize, true);
    if (nameLines.length > 1) { nameSize = 20; nameLines = wrap(m.startupName, 300, nameSize, true); }
    var ny = hy + 58;
    nameLines.slice(0, 2).forEach(function (l, i) { pg.text(l, hx + 22, ny + i * (nameSize + 2), { size: nameSize, bold: true, color: '#ffffff', encoded: true }); });
    ny += Math.min(2, nameLines.length) * (nameSize + 2) - 4;
    ny = pg.para(m.description, hx + 22, ny + 8, 300, { size: 9.5, color: '#e3e5fb', maxLines: 3 });
    pg.text('Your first business adventure', hx + 22, ny + 8, { size: 9, bold: true, color: '#fcd34d' });
    pg.rect(hx + 22, hy + hh - 30, 128, 17, { fill: '#ffffff', r: 8.5 });
    pg.text('FICTIONAL SIMULATION', hx + 86, hy + hh - 18.5, { size: 7, bold: true, color: COL.night, align: 'center' });
    // Headline number.
    var rx = hx + hw - 170;
    pg.text(r.revenueINR === 0 ? 'No sales this time' : 'You made', rx, hy + 54, { size: 10, color: '#e3e5fb' });
    if (r.revenueINR > 0) pg.text(money(r.revenueINR), rx, hy + 88, { size: 30, bold: true, color: '#ffffff' });
    pg.text(r.revenueINR > 0 ? 'in virtual sales' : 'Lessons below', rx, hy + (r.revenueINR > 0 ? 104 : 72), { size: 10, color: '#e3e5fb' });
    // Badge stamp.
    var sx = rx + 118, sy = hy + 138;
    pg.circle(sx, sy, 30, { stroke: '#fcd34d', lw: 1.6, dash: [3, 2.5] });
    pg.text('YOPPI', sx, sy - 13, { size: 6, bold: true, color: '#fcd34d', align: 'center' });
    var tierLines = r.tier.toUpperCase().split(' ');
    tierLines.forEach(function (t, i) { pg.text(t, sx, sy - 2 + i * 8.5 - (tierLines.length - 1) * 2, { size: 7, bold: true, color: '#ffffff', align: 'center' }); });
    pg.text('SCORE ' + r.score, sx, sy + 19, { size: 5.5, bold: true, color: '#fcd34d', align: 'center' });

    // Result cards.
    var cy = hy + hh + 14, cw = (hw - 4 * 8) / 5, ch = 52;
    var cards = [
      [m.terms.revenue, money(r.revenueINR), COL.navy],
      ['Money left', money(r.endingCashINR), COL.navy],
      [r.profitINR < 0 ? 'Loss' : 'Profit', money(r.profitINR), r.profitINR < 0 ? COL.rose : COL.teal],
      ['People who bought', String(r.uniqueCustomers), COL.navy],
      ['Repeat buyers', String(r.repeatOrders), COL.navy]
    ];
    cards.forEach(function (c, i) {
      var x = hx + i * (cw + 8);
      pg.rect(x, cy, cw, ch, { fill: '#ffffff', stroke: COL.line, r: 10 });
      pg.para(c[0], x + 10, cy + 16, cw - 20, { size: 7.5, color: COL.muted, maxLines: 1 });
      pg.text(c[1], x + 10, cy + 38, { size: 15, bold: true, color: c[2] });
    });

    // Your idea + your product.
    var y2 = cy + ch + 16, colW = (hw - 12) / 2, boxH = 196;
    pg.rect(hx, y2, colW, boxH, { fill: COL.surface, r: 12 });
    var iy = sectionTitle(pg, 'Your idea', hx + 14, y2 + 22);
    pg.text('PROBLEM', hx + 14, iy + 6, { size: 7, bold: true, color: COL.violet });
    iy = pg.para(m.problem, hx + 14, iy + 18, colW - 28, { size: 10, bold: true, color: COL.navy, maxLines: 2 });
    pg.text('WHO IT HELPS', hx + 14, iy + 8, { size: 7, bold: true, color: COL.violet });
    iy = pg.para(m.helps, hx + 14, iy + 20, colW - 28, { size: 10, color: COL.navy, maxLines: 2 });
    pg.text('WHY THIS IDEA', hx + 14, iy + 8, { size: 7, bold: true, color: COL.violet });
    pg.para(m.why, hx + 14, iy + 20, colW - 28, { size: 8.5, color: COL.ink, maxLines: 5 });

    var px = hx + colW + 12;
    pg.rect(px, y2, colW, boxH, { fill: COL.surface, r: 12 });
    sectionTitle(pg, 'Your product', px + 14, y2 + 22);
    phone(pg, m, px + 12, y2 + 32, 118, 156);
    var fx = px + 140, fy = y2 + 42, fw = colW - 152;
    pg.text('FEATURES', fx, fy, { size: 7, bold: true, color: COL.violet });
    fy += 8;
    m.featureNames.forEach(function (name, i) {
      var label = name + (i === 0 ? ' (core)' : '');
      var n = Math.min(2, wrap(label, fw - 22, 7.2).length), ch = n > 1 ? 24 : 16;
      pg.rect(fx, fy, fw, ch, { fill: '#ffffff', stroke: COL.line, r: 8 });
      pg.circle(fx + 9, fy + 8, 3, { fill: i === 0 ? COL.muted : TONES[i % TONES.length] });
      pg.para(label, fx + 16, fy + 10.8, fw - 22, { size: 7.2, color: COL.navy, maxLines: 2, lh: 8.6 });
      fy += ch + 4;
    });
    var room = Math.max(2, Math.floor((y2 + boxH - 22 - (fy + 8)) / 9.8));
    fy = pg.para(m.valueProp, fx, fy + 8, fw, { size: 7.5, color: COL.ink, maxLines: room, lh: 9.8 });
    pg.text('A visual demo, not real software.', fx, Math.min(y2 + boxH - 10, fy + 4), { size: 6.5, color: COL.muted });

    // The journey.
    var jy = y2 + boxH + 18;
    var n = m.journey.length, tw = (hw - 28) / n, ly = jy + 56;
    var maxLines = Math.max.apply(null, m.journey.map(function (j) { return Math.min(6, wrap(j.detail, tw - 10, 7).length); }));
    pg.rect(hx, jy, hw, 112 + maxLines * 9.3, { fill: '#ffffff', stroke: COL.line, r: 12 });
    sectionTitle(pg, 'The journey through Startup City', hx + 14, jy + 22);
    pg.line(hx + 14 + tw / 2, ly, hx + 14 + tw * (n - 0.5), ly, '#cbd5e1', 2, [4, 3]);
    m.journey.forEach(function (j, i) {
      var cx = hx + 14 + tw * (i + 0.5);
      pg.circle(cx, ly, 15, { fill: TONES[i] });
      pg.text(String(i + 1), cx, ly + 4.5, { size: 12, bold: true, color: '#ffffff', align: 'center' });
      var cw = tw - 10;
      pg.para(j.did, cx - cw / 2, ly + 30, cw, { size: 8.5, bold: true, color: COL.navy, align: 'center', maxLines: 1 });
      pg.para(j.place, cx - cw / 2, ly + 42, cw, { size: 7.5, color: COL.violet, align: 'center', maxLines: 1 });
      pg.para(j.detail, cx - cw / 2, ly + 56, cw, { size: 7, color: COL.ink, align: 'center', maxLines: 6, lh: 9.3 });
    });
    footer(pg, m, 1);
    return pg;
  }

  function columnChart(pg, x, y, w, h, title, values, fmt, color) {
    pg.text(title, x, y, { size: 9, bold: true, color: COL.navy });
    var base = y + h, top = y + 26, max = Math.max.apply(null, values.concat([1]));
    pg.line(x, base, x + w, base, '#cbd5e1', 1);
    var slot = w / values.length, bw = 34;
    values.forEach(function (v, i) {
      var bh = v ? Math.max(3, (base - top) * v / max) : 0;
      var bx = x + slot * i + slot / 2 - bw / 2;
      if (bh) pg.rect(bx, base - bh, bw, bh, { fill: color, r: 3 });
      pg.text(fmt(v), bx + bw / 2, base - bh - 5, { size: 8.5, bold: true, color: COL.navy, align: 'center' });
      pg.text('Week ' + (i + 1), bx + bw / 2, base + 12, { size: 8, color: COL.muted, align: 'center' });
    });
  }

  function page2(m) {
    var pg = new Page();
    var r = m.result, hx = M, hw = PAGE_W - 2 * M;
    var y = M + 8;
    pg.text(m.startupName, hx, y + 4, { size: 9, bold: true, color: COL.violet });
    y = sectionTitle(pg, 'What happened when you launched', hx, y + 24);
    // Charts.
    var cw = (hw - 24) / 2;
    pg.rect(hx, y, hw, 176, { fill: COL.surface, r: 12 });
    columnChart(pg, hx + 16, y + 20, cw - 24, 128, m.terms.revenue + ' each week', r.rounds.map(function (x) { return x.revenueINR; }), money, COL.revenue);
    columnChart(pg, hx + cw + 32, y + 20, cw - 24, 128, 'Orders each week', r.rounds.map(function (x) { return x.orders; }), String, COL.orders);
    y += 190;
    // Week stories.
    m.weekStories.forEach(function (s, i) {
      pg.text('Week ' + (i + 1), hx, y + 8, { size: 8.5, bold: true, color: COL.navy });
      y = pg.para(s, hx + 48, y + 8, hw - 48, { size: 8.5, color: COL.ink, maxLines: 2 }) + 4;
    });
    // Money in vs out.
    y += 8;
    var mx = Math.max(r.revenueINR, r.totalCostINR, 1), track = hw - 170;
    pg.text('Money in vs money out (both weeks)', hx, y + 8, { size: 9, bold: true, color: COL.navy });
    y += 18;
    [['Money in (sales)', r.revenueINR, COL.revenue], ['Money out (all costs)', r.totalCostINR, COL.cost]].forEach(function (row) {
      pg.text(row[0], hx, y + 10, { size: 8.5, color: COL.ink });
      pg.rect(hx + 100, y, track, 14, { fill: COL.surface, r: 4 });
      if (row[1]) pg.rect(hx + 100, y, Math.max(3, track * row[1] / mx), 14, { fill: row[2], r: 4 });
      pg.text(money(row[1]), hx + hw, y + 10.5, { size: 9, bold: true, color: COL.navy, align: 'right' });
      y += 20;
    });
    y = pg.para('Costs: building ' + money(r.buildCostINR) + ' + promotion ' + money(r.promotionINR) + ' + supplies ' + money(r.variableCostINR) + (r.eventINR ? ' + surprise ' + money(r.eventINR) : '') + '. ' +
      (r.profitINR >= 0 ? 'Money in was bigger: a profit of ' + money(r.profitINR) + '.' : 'Money out was bigger: a loss of ' + money(-r.profitINR) + '.'), hx, y + 6, hw, { size: 8.5, color: COL.ink, maxLines: 2 });
    // Best / worst.
    y += 10;
    var bw = (hw - 12) / 2;
    var bestH = 64;
    pg.rect(hx, y, bw, bestH, { fill: COL.tealBg, r: 10 });
    pg.text('BEST DECISION', hx + 12, y + 16, { size: 7, bold: true, color: COL.teal });
    pg.para(r.best || 'You finished the whole journey.', hx + 12, y + 29, bw - 24, { size: 8.5, color: COL.navy, maxLines: 3 });
    pg.rect(hx + bw + 12, y, bw, bestH, { fill: COL.amberBg, r: 10 });
    pg.text('COST YOU THE MOST', hx + bw + 24, y + 16, { size: 7, bold: true, color: COL.amber });
    pg.para(r.worst || 'Nothing big. Try a new idea next time.', hx + bw + 24, y + 29, bw - 24, { size: 8.5, color: COL.navy, maxLines: 3 });
    y += bestH + 8;
    pg.para('The surprise: ' + m.eventTitle, hx, y + 8, hw, { size: 8, color: COL.muted, maxLines: 1 });
    y += 26;

    // Skills + next move.
    var sw = (hw - 16) / 2, boxH = 196;
    pg.rect(hx, y, sw, boxH, { fill: '#ffffff', stroke: COL.line, r: 12 });
    sectionTitle(pg, 'Your skills', hx + 14, y + 22);
    var sy = y + 44;
    Object.keys(r.skillScores).forEach(function (k) {
      var v = r.skillScores[k];
      pg.text(k, hx + 14, sy + 8, { size: 8.5, color: COL.navy });
      pg.rect(hx + 104, sy, sw - 150, 9, { fill: COL.surface, r: 4.5 });
      if (v) pg.rect(hx + 104, sy, Math.max(5, (sw - 150) * v / 100), 9, { fill: COL.violet, r: 4.5 });
      pg.text(String(v), hx + sw - 14, sy + 8, { size: 8.5, bold: true, color: COL.navy, align: 'right' });
      sy += 22;
    });
    pg.para('Learning score ' + r.score + ' of 100, from your choices (not from how much you sold).', hx + 14, y + boxH - 18, sw - 28, { size: 7.5, color: COL.muted, maxLines: 2 });

    var nx = hx + sw + 16;
    pg.rect(nx, y, sw, boxH, { fill: COL.violetBg, r: 12 });
    sectionTitle(pg, 'Your next move', nx + 14, y + 22);
    var ty = y + 42;
    var items = [['Strength', r.strengths[0], COL.teal], ['Strength', r.strengths[1] || r.strengths[0], COL.teal], ['Try next', r.nextMove, COL.amber]];
    items.forEach(function (it) {
      pg.rect(nx + 14, ty, 52, 13, { fill: '#ffffff', r: 6.5 });
      pg.text(it[0].toUpperCase(), nx + 40, ty + 9.3, { size: 6.3, bold: true, color: it[2], align: 'center' });
      ty = pg.para(it[1], nx + 14, ty + 25, sw - 28, { size: 8.5, color: COL.navy, maxLines: 3 }) + 6;
    });
    y += boxH + 14;
    pg.para('Remember: this was a pretend town with pretend customers and pretend money. The thinking you did is real.', hx, y + 6, hw, { size: 8.5, bold: true, color: COL.violet, maxLines: 2 });
    footer(pg, m, 2);
    return pg;
  }

  /* --------------------------------------------------------------- file */

  function build(m) {
    // The built-in PDF fonts only cover Latin text. If the chosen name has none (e.g. written in
    // Devanagari or only emoji), print the business name instead; the screen report shows the original.
    if (!encode(m.startupName).replace(/[^A-Za-z0-9]/g, '')) m = Object.assign({}, m, { startupName: m.scenarioTitle, description: m.description.replace(m.startupName, m.scenarioTitle) });
    var pages = [page1(m), page2(m)];
    var objs = [];
    function add(s) { objs.push(s); return objs.length; }
    var catalog = add(null), pagesId = add(null);
    var f1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    var f2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    var kids = [];
    pages.forEach(function (pg) {
      var content = pg.ops.join('\n');
      var cid = add('<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream');
      kids.push(add('<< /Type /Page /Parent ' + pagesId + ' 0 R /MediaBox [0 0 ' + PAGE_W + ' ' + PAGE_H + '] /Resources << /Font << /F1 ' + f1 + ' 0 R /F2 ' + f2 + ' 0 R >> >> /Contents ' + cid + ' 0 R >>'));
    });
    objs[catalog - 1] = '<< /Type /Catalog /Pages ' + pagesId + ' 0 R /Lang (en-IN) >>';
    objs[pagesId - 1] = '<< /Type /Pages /Kids [' + kids.map(function (k) { return k + ' 0 R'; }).join(' ') + '] /Count ' + kids.length + ' >>';
    // Metadata: no personal data, only the product name.
    var info = add('<< /Title (YOPPI Startup Sprint - My Startup Report) /Producer (YOPPI Startup Sprint) /Creator (YOPPI Startup Sprint) >>');
    var out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    var offsets = [];
    objs.forEach(function (o, i) {
      offsets.push(out.length);
      out += (i + 1) + ' 0 obj\n' + o + '\nendobj\n';
    });
    var xref = out.length;
    out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n';
    offsets.forEach(function (o) { out += ('0000000000' + o).slice(-10) + ' 00000 n \n'; });
    out += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root ' + catalog + ' 0 R /Info ' + info + ' 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';
    var bytes = new Uint8Array(out.length);
    for (var i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
    return bytes;
  }

  return { build: build, encode: encode, wrap: wrap, width: width, money: money };
});
