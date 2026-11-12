/* YOPPI Future Skills Lab: class tabs, skill-area chips, course cards and the course dialog.
   State lives in the URL: ?class=9-10&area=money&course=M01 */
(function () {
  'use strict';

  var FSL = window.YOPPI_FSL;
  var bandsEl = document.querySelector('[data-fsl-bands]');
  var grid = document.querySelector('[data-fsl-grid]');
  if (!FSL || !bandsEl || !grid) return;

  var areasEl = document.querySelector('[data-fsl-areas]');
  var countEl = document.querySelector('[data-fsl-count]');
  var panel = document.getElementById('fsl-panel');

  // Lucide icons (ISC), inlined.
  var PATHS = {
    arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    arrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    play: '<path d="M6 3 20 12 6 21Z"/>',
    book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    gamepad: '<line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="18" x2="18.01" y1="10" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/>',
    award: '<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/>',
    message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>'
  };
  function icon(name, cls) {
    return '<svg class="icon ' + (cls || '') + '" viewBox="0 0 24 24" fill="' + (name === 'play' ? 'currentColor' : 'none') +
      '" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + PATHS[name] + '</svg>';
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function areaOf(id) { return FSL.areas.filter(function (a) { return a.id === id; })[0]; }
  function bandOf(id) { return FSL.bands.filter(function (b) { return b.id === id; })[0]; }
  function courseOf(id) { return FSL.courses.filter(function (c) { return c.id === id; })[0]; }
  function img(key, sizes, eager) {
    var base = 'assets/images/future-skills/' + key;
    return '<img src="' + base + '-800.webp" srcset="' + base + '-800.webp 800w, ' + base + '.webp 1600w" sizes="' + sizes +
      '" width="1600" height="900" alt="' + esc(FSL.images[key] || '') + '"' + (eager ? '' : ' loading="lazy"') + ' decoding="async" />';
  }
  var totalHours = (FSL.learning.minutes + FSL.missionMinutes) / 60 + ' hours';

  /* ----------------------------------------------------------------- State */

  var params = new URLSearchParams(location.search);
  var state = {
    band: bandOf(params.get('class')) ? params.get('class') : FSL.bands[0].id,
    area: areaOf(params.get('area')) ? params.get('area') : null
  };

  function writeUrl(courseId, courseBand) {
    var p = new URLSearchParams();
    if (state.band !== FSL.bands[0].id || courseId) p.set('class', courseBand || state.band);
    if (state.area) p.set('area', state.area);
    if (courseId) p.set('course', courseId);
    var q = p.toString();
    history.replaceState(null, '', location.pathname + (q ? '?' + q : ''));
  }

  /* ------------------------------------------------------- Tabs and chips */

  bandsEl.innerHTML = FSL.bands.map(function (b) {
    return '<button type="button" class="tab" role="tab" id="fsl-tab-' + b.id + '" data-band="' + b.id + '" aria-controls="fsl-panel">' + esc(b.label) + '</button>';
  }).join('');
  var tabs = Array.prototype.slice.call(bandsEl.querySelectorAll('[role="tab"]'));

  areasEl.innerHTML =
    '<button type="button" class="fchip" data-area="">All</button>' +
    FSL.areas.map(function (a) {
      return '<button type="button" class="fchip" data-area="' + a.id + '"><span class="fchip-dot" aria-hidden="true"></span>' + esc(a.name) + '</button>';
    }).join('');
  var chips = Array.prototype.slice.call(areasEl.querySelectorAll('.fchip'));

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { setBand(tab.getAttribute('data-band')); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); setBand(next.getAttribute('data-band')); next.focus(); }
    });
  });
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var a = chip.getAttribute('data-area') || null;
      state.area = state.area === a ? null : a;
      render();
      writeUrl();
    });
  });

  function setBand(id) {
    if (state.band === id) return;
    state.band = id;
    render();
    writeUrl();
  }

  /* ----------------------------------------------------------------- Cards */

  function cardHtml(c) {
    var lvl = c.levels[state.band];
    var area = areaOf(c.area);
    var sid = 'fsl-sum-' + c.id;
    return (
      '<li><article class="fsl-card" data-area="' + c.area + '">' +
        '<div class="fsl-media">' + img(lvl.image, '(min-width: 1024px) 280px, (min-width: 768px) 33vw, 50vw') + '</div>' +
        '<div class="fsl-body">' +
          '<p class="fsl-area">' + esc(area.name) + '</p>' +
          '<h3 class="fsl-title"><button type="button" data-course="' + c.id + '" aria-haspopup="dialog" aria-describedby="' + sid + '">' + esc(c.title) + '</button></h3>' +
          '<p class="fsl-mission" id="' + sid + '">' + icon('gamepad') + '<span><span class="sr-only">InScene mission: </span>' + esc(lvl.mission) + '</span></p>' +
          '<div class="fsl-foot"><span>' + icon('clock') + '<span class="sr-only">Length: </span>' + totalHours + '</span>' + icon('arrowRight', 'fsl-go') + '</div>' +
        '</div>' +
      '</article></li>'
    );
  }

  function render() {
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-band') === state.band;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', 'fsl-tab-' + state.band);
    chips.forEach(function (c) {
      var a = c.getAttribute('data-area') || null;
      c.setAttribute('aria-pressed', String(a === state.area));
    });
    var list = FSL.courses.filter(function (c) { return !state.area || c.area === state.area; });
    grid.innerHTML = list.map(cardHtml).join('');
    var band = bandOf(state.band);
    countEl.innerHTML = '<strong>' + list.length + '</strong> course' + (list.length === 1 ? '' : 's') + ' · ' + esc(band.label) +
      (state.area ? ' · ' + esc(areaOf(state.area).name) : '');
  }

  render();

  /* ---------------------------------------------------------------- Dialog */

  var dialog = document.createElement('dialog');
  dialog.className = 'offer-dialog fsl-dialog';
  document.body.appendChild(dialog);
  var current = null; // { course, band, view }
  var returnFocus = null;

  dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', function () {
    document.body.classList.remove('scroll-locked');
    current = null;
    writeUrl();
    if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  });

  function section(index, title, body) {
    return '<section class="fsl-section"><h3><span class="fsl-index">' + index + '</span>' + esc(title) + '</h3>' + body + '</section>';
  }

  function detailsHtml(c, bandId) {
    var lvl = c.levels[bandId];
    var area = areaOf(c.area);
    var band = bandOf(bandId);
    var classTabs = '<div class="tabs fsl-dialog-tabs" role="tablist" aria-label="Class">' +
      FSL.bands.map(function (b) {
        var on = b.id === bandId;
        return '<button type="button" class="tab" role="tab" data-dialog-band="' + b.id + '" aria-selected="' + on + '"' +
          (on ? '' : ' tabindex="-1"') + ' aria-controls="fsl-level">' + esc(b.label) + '</button>';
      }).join('') + '</div>';

    var topics = '<ol class="fsl-topics">' + lvl.topics.map(function (t, i) {
      return '<li><span class="fsl-num" aria-hidden="true">' + (i + 1) + '</span><span>' + esc(t) + '</span></li>';
    }).join('') + '</ol>';

    var mission =
      '<div class="fsl-mission-box">' +
        '<p class="fsl-box-label">' + icon('gamepad') + 'InScene mission</p>' +
        '<p class="fsl-mission-title">' + esc(lvl.mission) + '</p>' +
        '<p>' + esc(lvl.brief) + '</p>' +
      '</div>' +
      '<h4 class="fsl-sub">Decision points</h4>' +
      '<ol class="fsl-decisions">' + lvl.decisions.map(function (d, i) {
        return '<li><span aria-hidden="true">' + (i + 1) + '</span>' + esc(d) + '</li>';
      }).join('') + '</ol>' +
      '<p class="fsl-note">Choices change what happens next. Students see the consequences, adjust their approach and get feedback at the end.</p>';

    var assess =
      '<h4 class="fsl-sub" style="margin-top:0">Skills checked in this mission</h4>' +
      '<ul class="outcomes">' + lvl.skills.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' +
      '<h4 class="fsl-sub">Every mission is scored on four parts</h4>' +
      '<dl class="fsl-rubric">' + FSL.rubric.map(function (r) {
        return '<div><dt>' + esc(r.name) + '</dt><dd>' + esc(r.q) + '</dd></div>';
      }).join('') + '</dl>' +
      '<p class="fsl-note">Pass marks and weights will be set through pilots with partner schools, not fixed in advance.</p>';

    var runs =
      '<ol class="fsl-steps">' +
        '<li><span class="fsl-step-icon">' + icon('book') + '</span><div><p class="fsl-step-title">Learn on YOPPI <span>' + FSL.learning.minutes / 60 + ' hours</span></p>' +
          '<p>' + FSL.learning.steps.join(' · ') + ': short interactive lessons on the five topics, in the student’s own time.</p></div></li>' +
        '<li><span class="fsl-step-icon">' + icon('gamepad') + '</span><div><p class="fsl-step-title">The InScene mission <span>' + FSL.missionMinutes / 60 + ' hour</span></p>' +
          '<p>One interactive real-life situation, completed entirely inside InScene. No presentations, uploads or spreadsheets.</p></div></li>' +
        '<li><span class="fsl-step-icon">' + icon('award') + '</span><div><p class="fsl-step-title">Certificate</p>' +
          '<p>A YOPPI course certificate on passing, with a skills profile showing strengths and what to work on next.</p></div></li>' +
      '</ol>';

    return (
      '<div class="dialog-scroll" data-dialog-scroll>' +
        '<div class="dialog-media">' + img(lvl.image, '(min-width: 900px) 880px, 100vw', true) +
          '<button type="button" class="dialog-close" aria-label="Close course details">' + icon('x', 'icon-lg') + '</button></div>' +
        '<div class="dialog-body">' +
          '<div class="dialog-meta"><span class="area-pill" data-area="' + c.area + '">' + esc(area.name) + '</span>' +
            '<span class="status status-soon">In development</span></div>' +
          '<h2 class="dialog-title" id="fsl-title">' + esc(c.title) + '</h2>' +
          '<p class="dialog-tagline">' + esc(c.tagline) + '</p>' +
          classTabs +
          '<div id="fsl-level" role="tabpanel" aria-label="' + esc(band.label) + '">' +
            '<dl class="facts" style="--cols:4">' +
              
              '<div><dt>Learning</dt><dd>' + FSL.learning.minutes / 60 + ' hours on YOPPI</dd></div>' +
              '<div><dt>Mission</dt><dd>' + FSL.missionMinutes / 60 + ' hour in InScene</dd></div>' +
              '<div><dt>Topics</dt><dd>' + lvl.topics.length + '</dd></div>' +
              '<div><dt>Certificate</dt><dd>On passing</dd></div>' +
            '</dl>' +
            section('01', 'What students learn', topics) +
            section('02', 'How it’s assessed', mission) +
            section('03', 'How it\u2019s scored', assess) +
            section('04', 'How the course runs', runs) +
          '</div>' +
          '<div class="dialog-box"><span class="dot-soon" aria-hidden="true"></span><div><h3>In development</h3>' +
            '<p>We’re building the lessons and the InScene mission for this course with our first partner schools. Tell us which courses matter most to your students.</p></div></div>' +
        '</div>' +
      '</div>' +
      '<div class="dialog-foot"><p class="where"><strong>' + esc(c.title) + '</strong> · ' + esc(band.label) + ' · ' + totalHours + '</p>' +
        '<button type="button" class="btn btn-primary btn-lg" data-start>' + icon('play') + 'Start course</button></div>'
    );
  }

  function soonHtml(c, bandId) {
    return (
      '<div class="dialog-scroll" data-dialog-scroll>' +
        '<button type="button" class="dialog-close" aria-label="Close course details">' + icon('x', 'icon-lg') + '</button>' +
        '<div class="fsl-soon-panel">' +
          '<div class="fsl-soon-mark"><img src="assets/images/yoppi-icon-512.png?v=4" alt="" width="44" height="44" /><span class="ping" aria-hidden="true"></span></div>' +
          '<h2 id="fsl-soon-title" tabindex="-1">This course is on its way.</h2>' +
          '<p>Future Skills Lab courses open with partner schools first. Tell us about your students and we’ll share the pilot plan.</p>' +
          '<span class="chip">' + esc(c.title) + ' · ' + esc(bandOf(bandId).label) + '</span>' +
          '<div class="fsl-soon-actions">' +
            '<button type="button" class="btn btn-secondary btn-lg" data-back>' + icon('arrowLeft') + 'Back to course</button>' +
            '<a class="btn btn-primary btn-lg" href="contact.html">' + icon('message') + 'Talk to us</a>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  var savedScroll = 0;

  function paint(focus) {
    var c = current.course;
    var soon = current.view === 'soon';
    dialog.innerHTML = soon ? soonHtml(c, current.band) : detailsHtml(c, current.band);
    dialog.setAttribute('aria-labelledby', soon ? 'fsl-soon-title' : 'fsl-title');
    dialog.querySelector('.dialog-close').addEventListener('click', function () { dialog.close(); });

    if (soon) {
      dialog.querySelector('[data-back]').addEventListener('click', function () {
        current.view = 'details';
        paint('start');
        dialog.querySelector('[data-dialog-scroll]').scrollTop = savedScroll;
      });
    } else {
      dialog.querySelector('[data-start]').addEventListener('click', function () {
        savedScroll = dialog.querySelector('[data-dialog-scroll]').scrollTop;
        current.view = 'soon';
        paint('soon');
      });
      var dtabs = Array.prototype.slice.call(dialog.querySelectorAll('[data-dialog-band]'));
      dtabs.forEach(function (t, i) {
        var go = function (b) {
          var scroller = dialog.querySelector('[data-dialog-scroll]');
          var top = scroller.scrollTop;
          current.band = b;
          paint('band:' + b);
          dialog.querySelector('[data-dialog-scroll]').scrollTop = top;
          writeUrl(c.id, b);
        };
        t.addEventListener('click', function () { go(t.getAttribute('data-dialog-band')); });
        t.addEventListener('keydown', function (e) {
          var n = null;
          if (e.key === 'ArrowRight') n = dtabs[(i + 1) % dtabs.length];
          else if (e.key === 'ArrowLeft') n = dtabs[(i - 1 + dtabs.length) % dtabs.length];
          if (n) { e.preventDefault(); go(n.getAttribute('data-dialog-band')); }
        });
      });
    }

    if (focus === 'soon') dialog.querySelector('#fsl-soon-title').focus({ preventScroll: true });
    else if (focus === 'start') dialog.querySelector('[data-start]').focus({ preventScroll: true });
    else if (focus && focus.indexOf('band:') === 0) dialog.querySelector('[data-dialog-band="' + focus.slice(5) + '"]').focus({ preventScroll: true });
    else dialog.querySelector('.dialog-close').focus({ preventScroll: true });
  }

  function openCourse(id, bandId, trigger) {
    var c = courseOf(id);
    if (!c) return;
    returnFocus = trigger || null;
    current = { course: c, band: bandOf(bandId) ? bandId : state.band, view: 'details' };
    paint();
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('scroll-locked');
    dialog.querySelector('[data-dialog-scroll]').scrollTop = 0;
    writeUrl(c.id, current.band);
  }

  grid.addEventListener('click', function (e) {
    var card = e.target.closest('.fsl-card');
    if (!card) return;
    var btn = card.querySelector('[data-course]');
    openCourse(btn.getAttribute('data-course'), state.band, btn);
  });

  var initial = params.get('course');
  if (initial && courseOf(initial)) {
    openCourse(initial, state.band, grid.querySelector('[data-course="' + initial + '"]'));
  }
})();
