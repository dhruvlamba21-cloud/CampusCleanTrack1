(function () {
  'use strict';

  var BINS = [
    { id: 'wet', name: 'Wet Waste Bin', type: 'wet' },
    { id: 'dry', name: 'Dry Waste Bin', type: 'dry' }
  ];

  var levels = { wet: 0, dry: 0 };
  var wrap = document.getElementById('bins');
  var soundEnabled = false;
  var audioCtx = null;
  var lastBuzzerState = { wet: false, dry: false };

  // Calculate simulated ultrasonic distance:
  // At 0% full, distance to waste is ~40 cm.
  // At 100% full, distance to waste is ~4 cm (ultrasonic minimum threshold).
  function calculateDistance(pct) {
    var maxDist = 40;
    var minDist = 4;
    return Math.max(minDist, Math.round(maxDist - (pct / 100) * (maxDist - minDist)));
  }

  // Initialize Audio Context on demand
  function getAudioContext() {
    if (!audioCtx) {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Play subtle slider tick
  function playTickSound() {
    if (!soundEnabled) return;
    try {
      var ctx = getAudioContext();
      if (!ctx) return;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch (e) {}
  }

  // Play authentic Arduino 2.8kHz piezo buzzer beep
  function playBuzzerAlert() {
    if (!soundEnabled) return;
    try {
      var ctx = getAudioContext();
      if (!ctx) return;
      var now = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(2800, now);
      osc.frequency.setValueAtTime(2400, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.setValueAtTime(0.08, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  // Generate Bin Cards
  if (wrap) {
    BINS.forEach(function (b) {
      var c = document.createElement('article');
      c.className = 'card bin-card reveal spotlight-card';
      c.innerHTML =
        '<div class="bin-top">' +
          '<div>' +
            '<h3>' + b.name + '</h3>' +
          '</div>' +
          '<span class="badge" id="b-' + b.id + '"></span>' +
        '</div>' +
        
        '<div class="sensor-module">' +
          '<div class="sensor-info">' +
            '<div class="sensor-eyes" title="HC-SR04 Ultrasonic Transducer pair">' +
              '<span class="eye pulse"></span>' +
              '<span class="eye"></span>' +
            '</div>' +
            '<span>HC-SR04 Sensor</span>' +
          '</div>' +
          '<div class="distance-metric" id="dist-' + b.id + '">Echo Dist: ~40 cm</div>' +
        '</div>' +

        '<div class="tank">' +
          '<div class="ultrasonic-beam" aria-hidden="true"></div>' +
          '<div class="threshold-line" aria-hidden="true"></div>' +
          '<div class="tank-ruler" aria-hidden="true">' +
            '<span class="ruler-mark">100%</span>' +
            '<span class="ruler-mark" style="color:var(--bad)">80%</span>' +
            '<span class="ruler-mark">50%</span>' +
            '<span class="ruler-mark">25%</span>' +
            '<span class="ruler-mark">0%</span>' +
          '</div>' +
          '<div class="fill ' + (b.id === 'wet' ? 'fill-wet' : 'fill-dry') + '" id="f-' + b.id + '"></div>' +
          '<div class="pct" id="p-' + b.id + '">0%</div>' +
        '</div>' +

        '<div class="slider-container">' +
          '<div class="slider-label-row">' +
            '<label for="r-' + b.id + '">Simulated fill level</label>' +
            '<span class="slider-val-tag" id="tag-' + b.id + '">0%</span>' +
          '</div>' +
          '<input type="range" min="0" max="100" value="0" id="r-' + b.id + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
        '</div>' +

        '<div class="leds">' +
          '<div class="led-group">' +
            '<div class="led-unit"><span class="led g" id="g-' + b.id + '"></span><span class="led-label">NORM</span></div>' +
            '<div class="led-unit"><span class="led y" id="y-' + b.id + '"></span><span class="led-label">FILL</span></div>' +
            '<div class="led-unit"><span class="led r" id="rd-' + b.id + '"></span><span class="led-label">ALERT</span></div>' +
          '</div>' +
          '<div class="buzzer-box" id="bz-box-' + b.id + '">' +
            '<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor"><path d="M7 3L3.5 6H1v4h2.5L7 13V3z"/><path d="M9.5 5.5a3.5 3.5 0 0 1 0 5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>' +
            '<span id="bz-' + b.id + '">Buzzer: off</span>' +
          '</div>' +
        '</div>';

      wrap.appendChild(c);

      var slider = document.getElementById('r-' + b.id);
      slider.addEventListener('input', function (e) {
        levels[b.id] = Number(e.target.value);
        playTickSound();
        render();
        clearActiveScenarioButtons();
      });
    });
  }

  function status(v) {
    if (v >= 80) return { t: 'Full – Alert', c: 's-bad' };
    if (v >= 50) return { t: 'Filling', c: 's-warn' };
    return { t: 'Normal', c: 's-ok' };
  }

  function clearActiveScenarioButtons() {
    document.querySelectorAll('[data-s]').forEach(function (btn) {
      btn.classList.remove('active');
    });
  }

  function render() {
    var msgs = [];
    var shouldAlertSound = false;

    BINS.forEach(function (b) {
      var v = levels[b.id];
      var s = status(v);
      var id = b.id;
      var dist = calculateDistance(v);

      var fillEl = document.getElementById('f-' + id);
      if (fillEl) {
        fillEl.style.height = v + '%';
        fillEl.classList.toggle('alert-fill', v >= 80);
      }

      var pctEl = document.getElementById('p-' + id);
      if (pctEl) {
        pctEl.textContent = v + '%';
      }

      var sliderEl = document.getElementById('r-' + id);
      if (sliderEl) {
        sliderEl.value = v;
        sliderEl.setAttribute('aria-valuenow', v);
      }

      var tagEl = document.getElementById('tag-' + id);
      if (tagEl) {
        tagEl.textContent = v + '%';
      }

      var distEl = document.getElementById('dist-' + id);
      if (distEl) {
        distEl.textContent = 'Echo Dist: ~' + dist + ' cm';
      }

      var badge = document.getElementById('b-' + id);
      if (badge) {
        badge.textContent = s.t;
        badge.className = 'badge ' + s.c;
      }

      var gLed = document.getElementById('g-' + id);
      if (gLed) gLed.classList.toggle('on', v < 50);

      var yLed = document.getElementById('y-' + id);
      if (yLed) yLed.classList.toggle('on', v >= 50 && v < 80);

      var rLed = document.getElementById('rd-' + id);
      if (rLed) rLed.classList.toggle('on', v >= 80);

      var bzText = document.getElementById('bz-' + id);
      if (bzText) {
        bzText.textContent = 'Buzzer: ' + (v >= 80 ? 'ON' : 'off');
      }

      var bzBox = document.getElementById('bz-box-' + id);
      if (bzBox) {
        bzBox.classList.toggle('active', v >= 80);
      }

      // Check buzzer state transition for sound alert
      var isAlert = (v >= 80);
      if (isAlert && !lastBuzzerState[id]) {
        shouldAlertSound = true;
      }
      lastBuzzerState[id] = isAlert;

      if (v >= 80) {
        msgs.push(b.name + ' is ' + v + '% full. Please empty it soon.');
      }
    });

    if (shouldAlertSound) {
      playBuzzerAlert();
    }

    var box = document.getElementById('alerts');
    if (box) {
      box.innerHTML = msgs.length
        ? msgs.map(function (m) {
            return (
              '<div class="alert">' +
                '<svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor" style="flex-shrink:0"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>' +
                '<span>' + m + '</span>' +
              '</div>'
            );
          }).join('')
        : '<div class="alert none"><svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" style="flex-shrink:0;opacity:0.7"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg><span>No alerts. All bins are below 80%.</span></div>';
    }
  }

  // Preset Scenario Buttons
  document.querySelectorAll('[data-s]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      clearActiveScenarioButtons();
      btn.classList.add('active');
      var p = btn.getAttribute('data-s').split(',');
      levels.wet = Number(p[0]);
      levels.dry = Number(p[1]);
      playTickSound();
      render();
    });
  });

  // Reset Button
  var resetBtn = document.getElementById('reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      clearActiveScenarioButtons();
      levels.wet = 0;
      levels.dry = 0;
      playTickSound();
      render();
    });
  }

  // Audio Buzzer Toggle
  var soundBtn = document.getElementById('sound-btn');
  if (soundBtn) {
    soundBtn.addEventListener('click', function () {
      soundEnabled = !soundEnabled;
      getAudioContext();
      var icon = soundBtn.querySelector('.sound-icon');
      var text = soundBtn.querySelector('.sound-text');
      if (soundEnabled) {
        soundBtn.classList.add('active');
        if (icon) icon.textContent = '🔊';
        if (text) text.textContent = 'Sound: ON';
        playBuzzerAlert();
      } else {
        soundBtn.classList.remove('active');
        if (icon) icon.textContent = '🔇';
        if (text) text.textContent = 'Sound: Off';
      }
    });
  }

  // Mobile Navigation Menu
  var menu = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  if (menu && nav) {
    menu.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menu.setAttribute('aria-expanded', open ? 'true' : 'false');
      var icon = menu.querySelector('.menu-icon');
      if (icon) icon.textContent = open ? '✕' : '☰';
    });

    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        menu.setAttribute('aria-expanded', 'false');
        var icon = menu.querySelector('.menu-icon');
        if (icon) icon.textContent = '☰';
      }
    });
  }

  // Theme Switcher (Dark & Light)
  var root = document.documentElement;
  var tbtn = document.getElementById('theme');

  function setTheme(t) {
    root.setAttribute('data-theme', t);
    if (tbtn) {
      var icon = tbtn.querySelector('.theme-icon');
      if (icon) {
        icon.textContent = t === 'dark' ? '☀' : '☾';
      }
      tbtn.setAttribute('aria-label', 'Switch to ' + (t === 'dark' ? 'light' : 'dark') + ' mode');
    }
    var metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', t === 'dark' ? '#09090b' : '#f8f8f6');
    }
    try {
      localStorage.setItem('theme', t);
    } catch (e) {}
  }

  if (tbtn) {
    tbtn.addEventListener('click', function () {
      var current = root.getAttribute('data-theme') || 'dark';
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
    setTheme(root.getAttribute('data-theme') || 'dark');
  }

  // Scroll Spy for Navigation Links
  var sections = document.querySelectorAll('section[id]');
  var navLinks = document.querySelectorAll('nav a');

  function updateActiveNavLink() {
    var scrollPos = window.scrollY + 120;
    sections.forEach(function (sec) {
      var top = sec.offsetTop;
      var height = sec.offsetHeight;
      var id = sec.getAttribute('id');
      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(function (link) {
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveNavLink, { passive: true });

  // IntersectionObserver for Scroll-Triggered Reveals
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.1
    });

    document.querySelectorAll('.reveal').forEach(function (el) {
      revealObserver.observe(el);
    });

    // Animate Glance Stat Counters
    var glanceObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var b = entry.target.querySelector('b[data-target]');
          if (b && !b.classList.contains('counted')) {
            b.classList.add('counted');
            var target = parseInt(b.getAttribute('data-target'), 10);
            var suffix = b.getAttribute('data-suffix') || '';
            var count = 0;
            var duration = 900;
            var startTime = null;

            function step(timestamp) {
              if (!startTime) startTime = timestamp;
              var progress = Math.min((timestamp - startTime) / duration, 1);
              var eased = 1 - Math.pow(1 - progress, 3);
              b.textContent = Math.floor(eased * target) + suffix;
              if (progress < 1) {
                window.requestAnimationFrame(step);
              } else {
                b.textContent = target + suffix;
              }
            }
            window.requestAnimationFrame(step);
          }
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    document.querySelectorAll('.glance-card').forEach(function (el) {
      glanceObserver.observe(el);
    });
  } else {
    // Fallback if IntersectionObserver not supported
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('revealed');
    });
  }

  // Spotlight Mouse-Tracking Effect on Cards
  document.addEventListener('mousemove', function (e) {
    var cards = document.querySelectorAll('.spotlight-card');
    cards.forEach(function (card) {
      var rect = card.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', x + 'px');
      card.style.setProperty('--mouse-y', y + 'px');
    });
  });

  // Hero Star Parallax on Mouse Move
  var hero = document.getElementById('home');
  var star1 = document.querySelector('.s1');
  var star2 = document.querySelector('.s2');
  if (hero && (star1 || star2)) {
    hero.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      if (star1) {
        star1.style.transform = 'translate(' + (x * 24) + 'px, ' + (y * 24) + 'px)';
      }
      if (star2) {
        star2.style.transform = 'translate(' + (-x * 16) + 'px, ' + (-y * 16) + 'px)';
      }
    });
    hero.addEventListener('mouseleave', function () {
      if (star1) star1.style.transform = '';
      if (star2) star2.style.transform = '';
    });
  }

  // Initial Render
  render();
})();
