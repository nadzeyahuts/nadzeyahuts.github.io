/* Motion system, Nadzeya Huts portfolio. Loads on every page, needs no markup changes.
   It finds elements by role (headings, figures, results, previews) and gives each the movement
   that explains it. Elements a page already animates are left alone. */
(function () {
  'use strict';
  try {
    var d = document, root = d.documentElement;
    var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
    var hasIO = 'IntersectionObserver' in window;
    root.classList.add('m-on');
    var $ = function (s, c) { return [].slice.call((c || d).querySelectorAll(s)); };
    var caseJs0 = !!d.querySelector('script[src*="case.js"]');
    var legacy = /(4ire|neobank|tons|together-fun)\.html$/.test(location.pathname);
    var OWN = caseJs0 ? '.reveal,.rv,.reveal-s,.i-up,.m-skip,[class*="reveal"]' : '.rv,.reveal-s,.i-up,.m-skip,[class*="reveal-"]';
    var owned = function (el) { return el.matches(OWN) || el.closest(OWN); };
    var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

    /* ---------- 1. scroll progress ---------- */
    var bar = d.createElement('div');
    bar.className = 'm-prog'; bar.innerHTML = '<i></i>';
    d.body.appendChild(bar);
    var barI = bar.firstChild, ticking = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var h = root.scrollHeight - innerHeight;
        barI.style.transform = 'scaleX(' + (h > 0 ? clamp(scrollY / h, 0, 1) : 0) + ')';
        ticking = false;
      });
    }
    addEventListener('scroll', onScroll, { passive: true }); onScroll();

    /* ---------- 2. smooth anchor scrolling ---------- */
    function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function scrollToY(y) {
      if (reduced) { scrollTo(0, y); return; }
      var y0 = scrollY, dist = y - y0, dur = clamp(Math.abs(dist) * .55, 500, 1300), t0 = null;
      function step(t) {
        if (t0 === null) t0 = t;
        var p = clamp((t - t0) / dur, 0, 1);
        scrollTo(0, y0 + dist * ease(p));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    d.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented) return;
      var id = a.getAttribute('href').slice(1), t = id && d.getElementById(id);
      if (!t) return;
      e.preventDefault();
      scrollToY(t.getBoundingClientRect().top + scrollY - 24);
      history.replaceState(null, '', '#' + id);
    });

    /* ---------- 3. page transitions (fallback when cross-document View Transitions are missing) ---------- */
    var hasVT = 'CSSViewTransitionRule' in window;
    if (!hasVT && !reduced) {
      d.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href]');
        if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
        if (a.target === '_blank' || a.hasAttribute('download')) return;
        var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
        if (u.origin !== location.origin || (u.pathname === location.pathname && u.hash) || !/\.html?$|\/$/.test(u.pathname)) return;
        e.preventDefault();
        root.classList.add('m-leave');
        setTimeout(function () { location.href = u.href; }, 260);
      });
      addEventListener('pageshow', function (ev) { if (ev.persisted) root.classList.remove('m-leave'); });
    }

    /* ---------- 4. reveal on scroll ---------- */
    var REVEAL = 'main h1,main h2,main h3,main .lead,main .prose p,main .prose h3,main figure,main .fig,main .statcard,main .shots,main .two .col,main .tbl,main .pc,main .acc,main .tl li,main .meta,main .btns,main .note,main .plabel,main .kp,main .end h2,' +
      '.sec h2,.sec .sec-h,.wrap > h2,.wrap > p,.part-head,.feat,.cf-card,.nb-statcard,.nb-band';
    var batch = [], batchT = 0;
    var revIO = hasIO && new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { batch.push(en.target); revIO.unobserve(en.target); } });
      if (batch.length && !batchT) batchT = setTimeout(function () {
        batch.forEach(function (el, i) { el.style.setProperty('--md', Math.min(i * .07, .35) + 's'); el.classList.add('m-in'); });
        batch = []; batchT = 0;
      }, 30);
    }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
    if (revIO && !reduced) {
      var RV = REVEAL + (caseJs0 ? '' : ',.reveal') + (legacy ? ',main section .wrap > *,.phase-cell,.st > div,.kpis > *,.pc,.pr' : '');
      $(RV).forEach(function (el) {
        if (legacy && (el.closest('.hero,.ire-hero,header,nav,.hd') || el.matches('script,style'))) return;
        if (owned(el) || el.classList.contains('m-r') || el.closest('.acc-b,.rb,.m-next,.stage,.hero .stage')) return;
        el.classList.add('m-r'); revIO.observe(el);
      });
      setTimeout(function () { $('.m-r:not(.m-in)').forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight) el.classList.add('m-in'); }); }, 2500);
    }

    /* ---------- 5. images: focus-pull and parallax ---------- */
    var parImgs = [];
    var imgIO = hasIO && new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        var img = en.target;
        if (en.isIntersecting) { img.classList.add('m-in'); imgIO.unobserve(img); }
      });
    }, { threshold: .1 });
    var parVis = new Set();
    var parIO = hasIO && new IntersectionObserver(function (es) {
      es.forEach(function (en) { en.isIntersecting ? parVis.add(en.target) : parVis.delete(en.target); });
    }, { rootMargin: '10% 0px' });
    if (!reduced && imgIO) {
      $('main img, .wrap img').slice(0, 80).forEach(function (img) {
        if (img.closest('.stage,.stack,.pane,.nav,.topbar,header,.m-next,svg,.ph,.face') || img.width && img.width < 120) return;
        var p = img.parentElement, ov = p && getComputedStyle(p).overflow;
        if (!owned(img) && !img.complete) { img.classList.add('m-ri'); imgIO.observe(img); }
        else if (!owned(img)) { img.classList.add('m-ri'); imgIO.observe(img); }
        if (fine && ov === 'hidden' && p.getBoundingClientRect().height > 120) { img.classList.add('m-par'); parImgs.push(img); parIO.observe(img); }
      });
      setTimeout(function () { $('img.m-ri:not(.m-in)').forEach(function (i) { var r = i.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) i.classList.add('m-in'); }); }, 2500);
      var pt = false;
      function par() {
        pt = false;
        parVis.forEach(function (img) {
          var r = img.parentElement.getBoundingClientRect();
          var off = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
          img.style.translate = '0 ' + (clamp(-off, -1, 1) * Math.min(26, r.height * .06)).toFixed(1) + 'px';
        });
      }
      addEventListener('scroll', function () { if (!pt && parVis.size) { pt = true; requestAnimationFrame(par); } }, { passive: true });
    }

    /* ---------- 6. results: counters, bars, lines ---------- */
    var NUM = /\d[\d,]*(?:\.\d+)?/g;
    function isYear(s) { var n = +s.replace(/,/g, ''); return n >= 1900 && n <= 2100; }
    function counter(el) {
      var txt = el.textContent, nums = txt.match(NUM);
      if (!nums || txt.length > 22 || el.children.length || el.hasAttribute('data-count') || nums.some(isYear)) return;
      var parts = txt.split(NUM), vals = nums.map(function (n) { return { v: +n.replace(/,/g, ''), dec: (n.split('.')[1] || '').length, comma: n.indexOf(',') > -1 }; });
      el.dataset.mTxt = txt;
      function fmt(v) { var s = v.dec ? (v.v * (el._p)).toFixed(v.dec) : Math.round(v.v * el._p).toString(); return v.comma ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : s; }
      function render(p) { el._p = p; var o = parts[0]; vals.forEach(function (v, i) { o += fmt(v) + parts[i + 1]; }); el.textContent = o; }
      el._run = function () {
        var t0 = null, dur = 1500;
        (function step(t) { if (t0 === null) t0 = t; var p = clamp((t - t0) / dur, 0, 1); render(1 - Math.pow(1 - p, 4)); if (p < 1) requestAnimationFrame(step); else el.textContent = txt; })(performance.now());
      };
      render(0);
    }
    var cIO = hasIO && new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { cIO.unobserve(en.target); en.target._run && en.target._run(); } });
    }, { threshold: .6 });
    var bIO = hasIO && new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { bIO.unobserve(en.target); (en.target._bars || []).forEach(function (b) { b.classList.add('m-in'); }); } });
    }, { threshold: .35 });
    function watchBar(el) { var host = el.closest('.fig,.statcard,.kp,.acc-b,.tl') || el.parentElement; (host._bars = host._bars || []).push(el); if (host._bars.length === 1) bIO.observe(host); }
    if (!reduced && cIO) {
      var caseJs = !!d.querySelector('script[src*="case.js"]');
      $('.statcard .n,.st .n,.kp b,.row .res b,.pr .vv,.hb .n' + (caseJs ? '' : ',.kpi .n,.nb-statcard .n')).forEach(function (el) {
        if (el.closest('.hero .stage') || el.closest('[data-count]')) return;
        counter(el); if (el._run) cIO.observe(el);
      });
      var cnt = function () {
        var w = d.createTreeWalker(d.body, NodeFilter.SHOW_ELEMENT), n, list = [];
        while ((n = w.nextNode())) {
          if (n.children.length || n._run || /^(H[1-6]|SCRIPT|STYLE|A|BUTTON|TITLE)$/.test(n.tagName)) continue;
          var t = (n.textContent || '').trim();
          if (!t || t.length > 24 || !/\d/.test(t) || n.closest('.hero .stage,.hd,nav,footer,[data-count]')) continue;
          if (parseFloat(getComputedStyle(n).fontSize) >= 26) list.push(n);
        }
        list.forEach(function (el) { counter(el); if (el._run) cIO.observe(el); });
      };
      if (window.requestIdleCallback) requestIdleCallback(cnt, { timeout: 200 }); else setTimeout(cnt, 200);
      $('i[style*="--w"],.hb .t i,.seg i').forEach(function (el) {
        if (el.closest('.br,.tr')) return;
        var sib = [].indexOf.call(el.parentElement.children, el);
        el.style.setProperty('--md', Math.min(sib * .09, .5) + 's');
        el.classList.add('m-bar'); watchBar(el);
      });
      $('svg.lc polyline').forEach(function (pl, i) { pl.setAttribute('pathLength', '1'); pl.style.setProperty('--md', i * .2 + 's'); pl.classList.add('m-line'); watchBar(pl); });
    }

    /* ---------- 7. preview hover: tilt and light ---------- */
    if (fine && !reduced) {
      $('.pc .pv,.row .th,.rbimg,.m-next .mi,.shots img,.shots figure img').forEach(function (el) {
        if (el.closest('.stage')) return;
        el.classList.add('m-tilt');
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
          el.classList.add('m-hot');
          el.style.setProperty('--ry', ((x - .5) * 7).toFixed(2) + 'deg');
          el.style.setProperty('--rx', ((.5 - y) * 5).toFixed(2) + 'deg');
          el.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        });
        el.addEventListener('pointerleave', function () {
          el.classList.remove('m-hot'); el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
        });
      });
      $('.acc,.statcard,.kp,.two .col,.fig,.feat,.cf-card').forEach(function (el) {
        el.classList.add('m-glow');
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });
      });
      /* magnetic primary buttons */
      $('.bt.solid,.btn-g,.opn').forEach(function (b) {
        b.addEventListener('pointermove', function (e) {
          var r = b.getBoundingClientRect();
          b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .12).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .2).toFixed(1) + 'px)';
        });
        b.addEventListener('pointerleave', function () { b.style.transform = ''; });
      });
    }

    /* ---------- 8. navigation: highlight the section you are in ---------- */
    var navLinks = $('.nav a[href^="#"],header a[href^="#"]');
    if (hasIO && navLinks.length) {
      var secs = navLinks.map(function (a) { return d.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
      var sIO = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (!en.isIntersecting) return;
          navLinks.forEach(function (a) { a.classList.toggle('m-act', a.getAttribute('href') === '#' + en.target.id); });
        });
      }, { rootMargin: '-40% 0px -55% 0px' });
      secs.forEach(function (s) { sIO.observe(s); });
    }

    /* ---------- 9. next project strip on case pages ---------- */
    var ORDER = [
      ['together-fun.html', 'Together.fun', 'Play-to-Earn ✳ Game UX ✳ Web3', 'assets/stack-tf.webp'],
      ['4ire.html', '4IRE RWA Platform', 'DAO Governance ✳ RWA Tokenization', 'assets/stack-ire.webp'],
      ['tons.html', 'TONS MONEY Capital', 'RWA Tokenization ✳ Design System', 'assets/stack-tons.webp'],
      ['neobank.html', 'NeoBank', 'Crypto-Fiat ✳ Material Design 3', 'assets/stack-nb.webp'],
      ['sentinel.html', 'Sentinel', 'AI-built in 20 hours', 'assets/stack-sn.webp'],
      ['earthbyt.html', 'EarthByt', 'AI-built in 20 hours', 'assets/stack-eb.webp'],
      ['nova.html', 'NOVA', 'AI-built in 8 hours', 'assets/stack-nova.webp'],
      ['4ire-web.html', '4IRE Labs website', 'Glass UI ✳ Responsive', 'assets/stack-4w.webp'],
      ['rnd-able.html', 'RNDpoint and ABLE Platform', 'Audit ✳ Tracking ✳ Speed ✳ Page system', 'assets/stack-rnd.webp']
    ];
    var here = location.pathname.split('/').pop() || 'index.html';
    var idx = ORDER.map(function (o) { return o[0]; }).indexOf(here);
    if (idx > -1 && !d.querySelector('.m-next')) {
      var n = ORDER[(idx + 1) % ORDER.length];
      var s = d.createElement('div'); s.className = 'm-next m-r';
      s.innerHTML = '<a href="' + n[0] + '"><div><small>Next case</small><b>' + n[1] + '</b><em>' + n[2] + '</em></div><div class="mi"><img src="' + n[3] + '" alt="' + n[1] + ' preview" loading="lazy"></div></a>';
      (d.querySelector('main') || d.body).appendChild(s);
      if (revIO && !reduced) revIO.observe(s); else s.classList.remove('m-r');
      if (fine && !reduced) {
        var mi = s.querySelector('.mi'); mi.classList.add('m-tilt');
        mi.addEventListener('pointermove', function (e) { var r = mi.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; mi.classList.add('m-hot'); mi.style.setProperty('--ry', ((x - .5) * 7) + 'deg'); mi.style.setProperty('--rx', ((.5 - y) * 5) + 'deg'); mi.style.setProperty('--mx', x * 100 + '%'); mi.style.setProperty('--my', y * 100 + '%'); });
        mi.addEventListener('pointerleave', function () { mi.classList.remove('m-hot'); mi.style.setProperty('--rx', '0deg'); mi.style.setProperty('--ry', '0deg'); });
      }
    }

    /* ---------- 10. parity with the case pages: sticky nav state, section rail, image lightbox ---------- */
    var navEl = d.querySelector('.nav');
    if (navEl) addEventListener('scroll', function () { navEl.classList.toggle('scrolled', scrollY > 8); }, { passive: true });

    var labelled = $('main section[data-screen-label]');
    if (!d.getElementById('rail') && labelled.length >= 3) {
      var rail = d.createElement('nav'); rail.id = 'rail'; rail.setAttribute('aria-label', 'Section navigation');
      var rlinks = labelled.map(function (sec) {
        var a = d.createElement('a'); a.href = '#';
        var lbl = d.createElement('span'); lbl.className = 'rl'; lbl.textContent = sec.getAttribute('data-screen-label').replace(/^\d+\s*/, '');
        var dot = d.createElement('span'); dot.className = 'rd'; a.appendChild(lbl); a.appendChild(dot); a.title = lbl.textContent;
        a.addEventListener('click', function (e) { e.preventDefault(); scrollToY(sec.getBoundingClientRect().top + scrollY - 72); });
        rail.appendChild(a); return { sec: sec, a: a };
      });
      d.body.appendChild(rail);
      var rt = false;
      var setAct = function () {
        if (rt) return; rt = true;
        requestAnimationFrame(function () { rt = false; var cur = rlinks[0]; rlinks.forEach(function (l) { if (l.sec.getBoundingClientRect().top <= 140) cur = l; }); rlinks.forEach(function (l) { l.a.classList.toggle('active', l === cur); }); });
      };
      addEventListener('scroll', setAct, { passive: true }); addEventListener('resize', setAct, { passive: true }); setAct();
    }

    var lb = null;
    function openLB(src) {
      if (!lb) {
        lb = d.getElementById('lightbox');
        if (!lb) { lb = d.createElement('div'); lb.id = 'lightbox'; lb.appendChild(d.createElement('img')); lb.firstChild.alt = ''; d.body.appendChild(lb); }
        lb.addEventListener('click', function () { lb.classList.remove('open'); });
        addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.classList.remove('open'); });
      }
      lb.querySelector('img').src = src; lb.classList.add('open');
    }
    $('.shots img,.fig img,.m-lb').forEach(function (img) {
      if (img.closest('a')) return;
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', function () { openLB(img.currentSrc || img.src); });
    });

    /* ---------- 11. star field with scroll parallax (pages that ask for it with data-stars) ---------- */
    if (d.body.hasAttribute('data-stars') && !d.getElementById('stars') && !d.querySelector('.m-stars')) {
      var sky = d.createElement('div'); sky.className = 'm-stars'; sky.setAttribute('aria-hidden', 'true');
      var layers = [{ n: 46, s: [1, 1.6], k: 0.035 }, { n: 26, s: [1.6, 2.2], k: 0.075 }, { n: 12, s: [2.2, 3], k: 0.13 }];
      var small = innerWidth < 700, seed = 7, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      var items = [];
      layers.forEach(function (L) {
        var n = small ? Math.round(L.n * 0.6) : L.n;
        for (var i = 0; i < n; i++) {
          var e = d.createElement('i'), sz = L.s[0] + rnd() * (L.s[1] - L.s[0]), o1 = (0.18 + rnd() * 0.3).toFixed(2), o2 = (0.45 + rnd() * 0.4).toFixed(2);
          e.style.cssText = 'left:' + (rnd() * 100).toFixed(2) + '%;top:' + (rnd() * 112 - 6).toFixed(2) + '%;width:' + sz.toFixed(1) + 'px;height:' + sz.toFixed(1) + 'px;opacity:' + o1 + ';--o1:' + o1 + ';--o2:' + o2;
          if (rnd() < 0.35) { e.className = 'twk'; e.style.animationDelay = (rnd() * 5).toFixed(1) + 's'; }
          sky.appendChild(e); items.push({ e: e, k: L.k });
        }
      });
      d.body.insertBefore(sky, d.body.firstChild);
      if (!reduced) {
        var st = false;
        var shift = function () { if (st) return; st = true; requestAnimationFrame(function () { st = false; var y = scrollY; items.forEach(function (it) { it.e.style.transform = 'translate3d(0,' + (-y * it.k).toFixed(1) + 'px,0)'; }); }); };
        addEventListener('scroll', shift, { passive: true }); shift();
      }
    }

    /* ---------- 12. back to top after the first screen, on every page ---------- */
    if (!d.getElementById('toTop')) {
      var up = d.createElement('button'); up.id = 'toTop'; up.type = 'button'; up.setAttribute('aria-label', 'Back to top'); up.title = 'Back to top';
      up.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>';
      up.style.cssText = 'position:fixed;right:clamp(18px,3vw,34px);bottom:clamp(18px,3vw,34px);z-index:60;width:52px;height:52px;border-radius:50%;border:1px solid rgba(255,255,255,.14);background:#1b1b20;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transform:translateY(12px);transition:opacity .25s,transform .25s,visibility .25s';
      d.body.appendChild(up);
      var tt = function () { var on = scrollY > innerHeight * 0.45; up.style.opacity = on ? 1 : 0; up.style.visibility = on ? 'visible' : 'hidden'; up.style.transform = on ? 'none' : 'translateY(12px)'; };
      addEventListener('scroll', tt, { passive: true }); tt();
      up.addEventListener('click', function () { scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); });
    }

    /* ---------- 13. home button above back-to-top, only on long pages (more than 3 screens), never on the home page ---------- */
    (function () {
      var path = location.pathname;
      if (path === '/' || path.slice(-1) === '/' || /\/index\.html$/.test(path)) return;
      var topB = d.getElementById('toTop'); if (!topB) return;
      var home = d.getElementById('toHome');
      if (!home) {
        home = d.createElement('a'); home.id = 'toHome'; home.href = 'index.html';
        home.setAttribute('aria-label', 'Go to portfolio home'); home.title = 'Portfolio home';
        home.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"></path><path d="M5 9.5V21h14V9.5"></path><path d="M10 21v-6h4v6"></path></svg>';
        d.body.appendChild(home);
      }
      var css = d.createElement('style');
      css.textContent = '#toHome svg{width:22px;height:22px}#toTop:hover,#toHome:hover{background:#24242b!important;border-color:#14f195!important}@media print{#toHome{display:none!important}}';
      d.head.appendChild(css);
      home.style.cssText = 'position:fixed;right:clamp(18px,3vw,34px);bottom:calc(clamp(18px,3vw,34px) + 52px + 12px);z-index:60;width:52px;height:52px;border-radius:50%;border:1px solid rgba(255,255,255,.14);background:#1b1b20;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 14px 34px -12px rgba(0,0,0,.8);opacity:0;visibility:hidden;transform:translateY(12px);transition:opacity .25s,transform .25s,visibility .25s,background .2s,border-color .2s';
      var sync = function () {
        var longPage = d.documentElement.scrollHeight > innerHeight * 3;
        var on = longPage && (topB.classList.contains('show') || topB.style.opacity === '1');
        home.style.opacity = on ? 1 : 0; home.style.visibility = on ? 'visible' : 'hidden'; home.style.transform = on ? 'none' : 'translateY(12px)';
        home.tabIndex = on ? 0 : -1;
      };
      addEventListener('scroll', sync, { passive: true }); addEventListener('resize', sync); addEventListener('load', sync); sync();
    })();
  } catch (err) { if (window.console) console.warn('motion.js', err); }
})();
