(function () {
  var $ = function (id) { return document.getElementById(id); };
  var reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* Unsplash helper: srcset up to 3840px wide, browser picks by screen */
  var W = [640, 1280, 1920, 2560, 3840];
  function srcset(id) { return W.map(function (w) { return 'https://images.unsplash.com/photo-' + id + '?auto=format&fit=crop&q=85&w=' + w + ' ' + w + 'w'; }).join(', '); }
  function photo(img, id, sizes) { img.srcset = srcset(id); img.sizes = sizes || '100vw'; img.src = 'https://images.unsplash.com/photo-' + id + '?auto=format&fit=crop&q=85&w=3840'; }
  [].forEach.call(document.querySelectorAll('img[data-photo]'), function (i) { photo(i, i.dataset.photo, i.dataset.sizes); });

  /* menu */
  var P = { c: '1559001724-fbad036dbc9e', s: '1639744210631-209fce3e256c', d: '1617305855058-336d24456869' };
  var MENU = [
    ['Coffee', 'c', [['Flat White', 'Double shot, silky milk', 550], ['Spanish Latte', 'Sweet condensed milk, espresso', 650], ['Iced Caramel Cold Brew', 'Slow steeped for 16 hours', 700], ['Hot Chocolate', 'Dark, thick, marshmallow', 600]]],
    ['Small plates', 's', [['Crispy Chicken Bites', 'House dip, lemon', 750], ['Loaded Fries', 'Cheese sauce, jalapeño', 650], ['Hummus and Pita', 'Olive oil, paprika', 600], ['Mini Sliders', 'Three, beef or chicken', 900]]],
    ['Dessert', 'd', [['Molten Lava Cake', 'Warm centre, vanilla ice cream', 800], ['Biscoff Cheesecake', 'Cold, creamy, crunchy', 850], ['Churros', 'Chocolate dip', 700], ['Brownie Sundae', 'Warm brownie, fudge', 750]]]
  ];
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  $('list').innerHTML = MENU.map(function (g) {
    return '<div class="grp"><h3>' + g[0] + '</h3>' + g[2].map(function (i) {
      return '<div class="row" tabindex="0" data-p="' + P[g[1]] + '"><img class="th" alt="" loading="lazy" data-photo="' + P[g[1]] + '" data-sizes="64px"><span class="nm">' + esc(i[0]) + '</span><span class="ds">' + esc(i[1]) + '</span><span class="pr">Rs ' + i[2] + '</span></div>';
    }).join('') + '</div>';
  }).join('');
  [].forEach.call(document.querySelectorAll('.th'), function (i) { photo(i, i.dataset.photo, '64px'); });

  /* cursor ring + floating dish preview */
  var ring = $('ring'), peek = $('peek'), pimg = peek.querySelector('img');
  var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, px = mx, py = my;
  if (fine && !reduce) {
    addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; ring.classList.add('on'); });
    document.addEventListener('pointerleave', function () { ring.classList.remove('on'); });
    (function loop() {
      rx += (mx - rx) * .18; ry += (my - ry) * .18; px += (mx - px) * .1; py += (my - py) * .1;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      peek.style.transform = 'translate(' + (px + 36) + 'px,' + (py - 150) + 'px)';
      requestAnimationFrame(loop);
    })();
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest('a,button,.row,.rail');
      ring.classList.toggle('big', !!t && !t.classList.contains('rail'));
      var r = e.target.closest('.row');
      if (r) { if (pimg.dataset.id !== r.dataset.p) { pimg.dataset.id = r.dataset.p; photo(pimg, r.dataset.p, '300px'); } peek.classList.add('on'); }
      else peek.classList.remove('on');
    });
  }

  /* top bar + full-screen menu */
  var bar = $('bar'), burger = $('burger'), sheet = $('sheet');
  function setMenu(o) {
    sheet.classList.toggle('open', o); burger.setAttribute('aria-expanded', o);
    if (o) sheet.removeAttribute('inert'); else sheet.setAttribute('inert', '');
    document.body.style.overflow = o ? 'hidden' : '';
  }
  burger.onclick = function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); };
  sheet.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* parallax + scroll state */
  var hero = $('heroImg'), pars = [].slice.call(document.querySelectorAll('[data-par]'));
  function onScroll() {
    var y = scrollY; bar.classList.toggle('solid', y > 60);
    if (reduce) return;
    if (y < innerHeight * 1.2) hero.style.transform = 'translateY(' + y * .22 + 'px)';
    pars.forEach(function (im) {
      var r = im.parentNode.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) im.style.transform = 'translateY(' + ((r.top + r.height / 2 - innerHeight / 2) * -parseFloat(im.dataset.par)) + 'px)';
    });
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* image mask reveals (used sparingly) */
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .15 });
  [].forEach.call(document.querySelectorAll('.mask'), function (m) { io.observe(m); });

  /* gallery rail: arrows + mouse drag */
  var rail = $('rail');
  function step() { return Math.min(rail.clientWidth * .8, 700); }
  $('next').onclick = function () { rail.scrollBy({ left: step(), behavior: 'smooth' }); };
  $('prev').onclick = function () { rail.scrollBy({ left: -step(), behavior: 'smooth' }); };
  var down = false, sx = 0, sl = 0;
  rail.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; sl = rail.scrollLeft; rail.classList.add('drag'); });
  addEventListener('pointermove', function (e) { if (down) rail.scrollLeft = sl - (e.clientX - sx); });
  addEventListener('pointerup', function () { down = false; rail.classList.remove('drag'); });

  /* hours + live status (11:30 am to 3 am) */
  var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], today = new Date().getDay();
  $('hours').innerHTML = days.map(function (d, i) { return '<li' + (i === today ? ' class="today"' : '') + '><span>' + d + '</span><span>11:30 am – 3:00 am</span></li>'; }).join('');
  var n = new Date(), m = n.getHours() * 60 + n.getMinutes(), open = m >= 690 || m < 180;
  $('stat').textContent = open ? 'Open now, until 3 am' : 'Closed now, opens at 11:30 am';
  if (!open) $('dot').classList.add('off');

  /* reservation */
  var g = 2, gv = $('gv');
  $('minus').onclick = function () { g = Math.max(1, g - 1); gv.textContent = g; };
  $('plus').onclick = function () { g = Math.min(12, g + 1); gv.textContent = g; };
  $('d').min = new Date().toISOString().slice(0, 10);
  $('rf').onsubmit = function (e) {
    e.preventDefault();
    var msg = 'Hi Monarca, I would like to reserve a table.\nName: ' + $('n').value + '\nDate: ' + $('d').value + '\nTime: ' + $('t').value + '\nGuests: ' + g;
    $('ok').textContent = 'Opening WhatsApp with your request…';
    window.open('https://wa.me/923007058898?text=' + encodeURIComponent(msg), '_blank');
  };
})();
