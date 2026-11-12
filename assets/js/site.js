/* YOPPI — header, reveal, offering cards, tabs, detail dialog, copy email. No dependencies. */
(function () {
  'use strict';

  var OFFERINGS = window.YOPPI_OFFERINGS || [];
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Lucide icons (ISC), inlined.
  var ICON_PATHS = {
    arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    arrowUpRight: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>'
  };
  function icon(name, cls) {
    return '<svg class="icon ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON_PATHS[name] + '</svg>';
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function img(o, sizes) {
    var base = 'assets/images/offerings/' + o.image;
    return '<img src="' + base + '-800.webp" srcset="' + base + '-800.webp 800w, ' + base + '.webp 1600w" sizes="' + sizes +
      '" width="1600" height="900" alt="' + esc(o.alt) + '" loading="lazy" decoding="async" />';
  }

  function pillarBadge(name) {
    return '<span class="pillar" data-pillar="' + esc(name) + '">' + esc(name) + '</span>';
  }

  function statusPill(o) {
    return o.status === 'live'
      ? '<span class="status status-live">Live</span>'
      : '<span class="status status-soon">In development</span>';
  }

  /* ---------------------------------------------------------------- Header */

  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 4); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var menuBtn = header.querySelector('.menu-btn');
    var menu = document.getElementById('mobile-menu');
    var covered = document.querySelectorAll('main, footer');
    var setMenu = function (open) {
      if (!menu) return;
      menu.hidden = !open;
      header.classList.toggle('menu-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('scroll-locked', open);
      covered.forEach(function (el) { open ? el.setAttribute('inert', '') : el.removeAttribute('inert'); });
    };
    if (menuBtn) menuBtn.addEventListener('click', function () { setMenu(menu.hidden); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu && !menu.hidden) { setMenu(false); menuBtn.focus(); }
    });
    window.matchMedia('(min-width: 768px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  /* ------------------------------------------------- Offerings dropdown */

  document.querySelectorAll('.nav-dd').forEach(function (dd) {
    var btn = dd.querySelector('.nav-dd-btn');
    var items = dd.querySelectorAll('.dd-item');
    var closeTimer = null;
    var set = function (open) {
      clearTimeout(closeTimer);
      dd.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    };
    var hoverOpenedAt = 0;
    btn.addEventListener('click', function () {
      // The pointer's hover already opened it just now: a click should keep it open, not toggle it shut.
      if (Date.now() - hoverOpenedAt < 600) { set(true); return; }
      set(!dd.classList.contains('is-open'));
    });
    btn.addEventListener('keydown', function (e) {
      // stopPropagation: the menu's own handler would otherwise move focus on to the second item.
      if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); set(true); items[0].focus(); }
    });
    dd.addEventListener('keydown', function (e) {
      var i = Array.prototype.indexOf.call(items, document.activeElement);
      if (e.key === 'Escape') { set(false); btn.focus(); }
      else if (e.key === 'ArrowDown' && i > -1) { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === 'ArrowUp' && i > -1) { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    });
    // Hover opens it too, for mouse users; a short delay stops it flickering shut.
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    dd.addEventListener('mouseenter', function () {
      if (!fine.matches) return;
      if (!dd.classList.contains('is-open')) hoverOpenedAt = Date.now();
      set(true);
    });
    dd.addEventListener('mouseleave', function () { if (fine.matches) closeTimer = setTimeout(function () { set(false); }, 150); });
    dd.addEventListener('focusout', function (e) { if (!dd.contains(e.relatedTarget)) set(false); });
    document.addEventListener('click', function (e) { if (!dd.contains(e.target)) set(false); });
    items.forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
  });

  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ----------------------------------------------------------------- Cards */

  function cardHtml(o) {
    var action = o.status === 'live' ? 'View details' : 'Learn more';
    return (
      '<li class="reveal"><button type="button" class="card" data-offering="' + o.slug + '" aria-haspopup="dialog" aria-label="' +
      esc(o.title + ', ' + (o.status === 'live' ? 'live' : 'in development') + '. ' + o.tagline) + '">' +
        '<div class="media">' + img(o, '(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw') + statusPill(o) + '</div>' +
        '<div class="card-body">' +
          '<p class="card-meta">' + pillarBadge(o.pillar) + '<span>' + esc(o.who) + '</span></p>' +
          '<h3 class="card-title">' + esc(o.title) + '</h3>' +
          '<p class="card-text">' + esc(o.summary) + '</p>' +
          '<div class="card-foot"><span>' + (o.status === 'live' ? esc(o.where) : 'Talk to us') + '</span>' +
          '<span class="go">' + action + icon('arrowRight') + '</span></div>' +
        '</div>' +
      '</button></li>'
    );
  }

  function pick(filter) {
    if (filter === 'live') {
      // Home: one of each live product (the college Career Simulator duplicates the school one).
      return OFFERINGS.filter(function (o) { return o.status === 'live' && o.slug !== 'career-simulator-colleges'; });
    }
    return OFFERINGS.filter(function (o) { return o.audience === filter; });
  }

  document.querySelectorAll('[data-offerings]').forEach(function (list) {
    list.innerHTML = pick(list.getAttribute('data-offerings')).map(cardHtml).join('');
  });
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var f = el.getAttribute('data-count');
    var parts = f.split(':');
    var items = pick(parts[0]);
    if (parts[1]) items = items.filter(function (o) { return o.status === parts[1]; });
    el.textContent = items.length;
  });

  /* ---------------------------------------------------------------- Reveal */

  document.documentElement.classList.add('js');
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -5% 0px', threshold: 0 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ------------------------------------------------------------------ Tabs */

  var tablist = document.querySelector('[role="tablist"]');
  var tabs = tablist ? Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]')) : [];

  function selectTab(id, opts) {
    var found = false;
    tabs.forEach(function (tab) {
      var on = tab.getAttribute('data-tab') === id;
      if (on) found = true;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (panel) {
        panel.hidden = !on;
        if (on) panel.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
      }
      if (on && opts && opts.focus) tab.focus();
    });
    if (found) {
      document.querySelectorAll('[data-panel-count]').forEach(function (el) {
        el.hidden = el.getAttribute('data-panel-count') !== id;
      });
    }
    if (found && opts && opts.updateHash && location.hash !== '#' + id) {
      history.replaceState(null, '', location.pathname + location.search.replace(/[?&]offering=[^&]*/, '') + '#' + id);
    }
    return found;
  }

  if (tabs.length) {
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { selectTab(tab.getAttribute('data-tab'), { updateHash: true }); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); selectTab(next.getAttribute('data-tab'), { focus: true, updateHash: true }); }
      });
    });
    var fromHash = function () { if (!selectTab(location.hash.slice(1))) selectTab(tabs[0].getAttribute('data-tab')); };
    fromHash();
    window.addEventListener('hashchange', fromHash);
  }

  /* ---------------------------------------------------------------- Dialog */

  var dialog = null;
  var returnFocus = null;

  function buildDialog() {
    dialog = document.createElement('dialog');
    dialog.className = 'offer-dialog';
    dialog.setAttribute('aria-labelledby', 'offer-title');
    document.body.appendChild(dialog);
    dialog.addEventListener('click', function (e) {
      // A click on the backdrop lands on the <dialog> element itself.
      if (e.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', function () {
      document.body.classList.remove('scroll-locked');
      if (/[?&]offering=/.test(location.search)) {
        history.replaceState(null, '', location.pathname + location.hash);
      }
      if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
      returnFocus = null;
    });
  }

  function dialogHtml(o) {
    var live = o.status === 'live';
    var audience = o.audience === 'schools' ? 'For schools' : 'For colleges';
    var action = live
      ? '<a class="btn btn-primary btn-lg" href="' + o.href + '" target="_blank" rel="noopener">' + esc(o.cta) + icon('arrowUpRight', 'icon-out') + '</a>'
      : '<a class="btn btn-primary btn-lg" href="contact.html">' + icon('message') + 'Talk to us about this</a>';
    var facts = [['Primary pillar', pillarBadge(o.pillar)]];
    if (o.alsoBuilds && o.alsoBuilds.length) facts.push(['Also builds', o.alsoBuilds.map(pillarBadge).join('')]);
    facts.push(["Who it's for", esc(o.who)], ['Format', esc(o.format)]);
    return (
      '<div class="dialog-scroll">' +
        '<div class="dialog-media">' + img(o, '(min-width: 900px) 880px, 100vw').replace(' loading="lazy"', '') +
          '<button type="button" class="dialog-close" aria-label="Close">' + icon('x', 'icon-lg') + '</button></div>' +
        '<div class="dialog-body">' +
          '<div class="dialog-meta">' + statusPill(o) + '<span>' + audience + '</span></div>' +
          '<h2 class="dialog-title" id="offer-title">' + esc(o.title) + '</h2>' +
          '<p class="dialog-tagline">' + esc(o.tagline) + '</p>' +
          '<dl class="facts" style="--cols:' + facts.length + '">' +
            facts.map(function (f) { return '<div><dt>' + f[0] + '</dt><dd>' + f[1] + '</dd></div>'; }).join('') +
          '</dl>' +
          '<div class="dialog-section"><h3>What it is</h3><p class="dialog-text">' + esc(o.description) + '</p></div>' +
          '<div class="dialog-section"><h3>Key outcomes</h3><ul class="outcomes">' +
            o.outcomes.map(function (t) { return '<li>' + icon('check') + '<span>' + esc(t) + '</span></li>'; }).join('') +
          '</ul></div>' +
          '<div class="dialog-box' + (live ? ' is-live' : '') + '">' + (live ? '<span class="dot" aria-hidden="true"></span>' : '<span class="dot-soon" aria-hidden="true"></span>') +
            '<div><h3>' + (live ? 'Ready to try' : 'In development') + '</h3>' +
            '<p>' + esc(live ? o.statusNote : window.YOPPI_SOON_NOTE) + '</p></div></div>' +
        '</div>' +
      '</div>' +
      '<div class="dialog-foot"><p class="where"><strong>' + esc(o.title) + '</strong> · ' +
        (live ? esc(o.where) : 'Pilots with partner institutions') + '</p>' + action + '</div>'
    );
  }

  function openOffering(slug, trigger) {
    var o = OFFERINGS.filter(function (x) { return x.slug === slug; })[0];
    if (!o) return;
    if (!dialog) buildDialog();
    returnFocus = trigger || null;
    dialog.innerHTML = dialogHtml(o);
    dialog.querySelector('.dialog-close').addEventListener('click', function () { dialog.close(); });
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('scroll-locked');
    dialog.querySelector('.dialog-scroll').scrollTop = 0;
    dialog.querySelector('.dialog-close').focus({ preventScroll: true });
    // Mirror the open offering to the URL so it can be shared.
    var hash = location.hash || (tabs.length ? '#' + o.audience : '');
    history.replaceState(null, '', location.pathname + '?offering=' + encodeURIComponent(slug) + hash);
  }

  document.addEventListener('click', function (e) {
    var card = e.target.closest && e.target.closest('[data-offering]');
    if (card) openOffering(card.getAttribute('data-offering'), card);
  });

  var initial = new URLSearchParams(location.search).get('offering');
  if (initial) {
    var match = OFFERINGS.filter(function (x) { return x.slug === initial; })[0];
    if (match) {
      if (tabs.length) selectTab(match.audience, { updateHash: false });
      var trigger = document.querySelector('[data-offering="' + initial + '"]');
      openOffering(initial, trigger);
    }
  }

  /* ------------------------------------------------------------ Copy email */

  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var status = document.getElementById(btn.getAttribute('data-status') || '');
      var done = function (ok) {
        if (status) status.textContent = ok ? 'Email address copied.' : 'Copy failed. The address is ' + text + '.';
        setTimeout(function () { if (status) status.textContent = ''; }, 3000);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      else done(false);
    });
  });
})();
