// Script du site, chargé sur toutes les pages. Chaque partie ne s'active que si ses éléments sont là.
var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var canAnimate = !!Element.prototype.animate && !reduce;
var expo = 'cubic-bezier(.16,1,.3,1)';
var root = document.documentElement;
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

var hero = $('#hero');
var resizers = [], scrollers = [];

/* =========================================================
   Titre de l'accueil : il remplit la largeur, puis HAUSSMANN devient HAUSTMANN
   ========================================================= */
var tWrap = $('#h-title-wrap');
if (tWrap) (function () {
  var tw = $('#h-title .tw'), slot = $('#slot');
  var sOld = $('.s-old', slot), tNew = $('.t-new', slot), flare = $('.flare', slot);
  function fitTitle() {
    tw.style.fontSize = '100px';
    // largeur finale, avec le T, même si l'animation tient encore la case à la largeur du S
    var w = tw.getBoundingClientRect().width - slot.getBoundingClientRect().width + tNew.offsetWidth;
    if (w > 0) tw.style.fontSize = (100 * tWrap.clientWidth / w).toFixed(2) + 'px';
  }
  var anims = [];
  function A(el, k, o) { var a = el.animate(k, o); anims.push(a); return a; }

  function playIntro(full) {
    anims.forEach(function (a) { a.cancel(); }); anims = [];
    fitTitle();
    if (!canAnimate) return release();
    var letters = $$('.tw > .l', tWrap);
    var before = letters.slice(0, 4), after = letters.slice(4);
    var ordered = before.concat([sOld]).concat(after);
    // largeurs en em : elles suivent la taille du titre si la fenêtre change
    var fs = parseFloat(tw.style.fontSize) || 100;
    var wS = (sOld.getBoundingClientRect().width / fs).toFixed(4) + 'em', wT = (tNew.getBoundingClientRect().width / fs).toFixed(4) + 'em';

    // 1. L'immeuble s'élève, de la rue jusqu'au toit
    if (full) {
      A($('#h-building img'), [
        { clipPath: 'inset(100% 0 0 0)', transform: 'translateY(9%) scale(1.06)', filter: 'blur(6px)' },
        { clipPath: 'inset(0% 0 0 0)', transform: 'translateY(0) scale(1)', filter: 'blur(0px)' }
      ], { duration: 1700, delay: 120, easing: expo, fill: 'backwards' });
      A($('#h-dim'), [{ opacity: .55 }, { opacity: 0 }], { duration: 2400, easing: 'ease-out', fill: 'backwards' });
      $$('[data-intro]', hero).forEach(function (el, i) {
        A(el, [{ opacity: 0, transform: 'translateY(22px)' }, { opacity: 1, transform: 'none' }], { duration: 1000, delay: 1000 + i * 100, easing: expo, fill: 'backwards' });
      });
    }

    // 2. HAUSSMANN fait la mise au point, lettre par lettre
    var t0 = full ? 350 : 0;
    A(sOld, [{ opacity: 1 }, { opacity: 1 }], { duration: 1, fill: 'both' });
    A(tNew, [{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: 'both' });
    A(slot, [{ width: wS }, { width: wS }], { duration: 1, fill: 'both' });
    ordered.forEach(function (l, i) {
      var c = l === sOld ? 'translateX(-50%) ' : '';
      A(l, [
        { opacity: 0, filter: 'blur(22px)', transform: c + 'translateY(.18em) scale(1.08)' },
        { opacity: 1, filter: 'blur(0px)', transform: c || 'none' }
      ], { duration: 900, delay: t0 + i * 50, easing: expo, fill: 'backwards' });
    });

    // 3. Le S se brouille et s'efface, le T fait la mise au point à sa place
    var t1 = t0 + 1250;
    A(sOld, [
      { opacity: 1, filter: 'blur(0px)', transform: 'translateX(-50%) translateY(0)' },
      { opacity: 0, filter: 'blur(18px)', transform: 'translateX(-50%) translateY(-.12em)' }
    ], { duration: 350, delay: t1, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
    A(slot, [{ width: wS }, { width: wT }], { duration: 450, delay: t1 + 60, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
    A(tNew, [
      { opacity: 0, filter: 'blur(20px)', transform: 'scale(1.3) translateY(.06em)' },
      { opacity: 1, filter: 'blur(0px)', transform: 'none' }
    ], { duration: 600, delay: t1 + 120, easing: expo, fill: 'forwards' });
    A(flare, [
      { opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'scale(1.1)', offset: .35 }, { opacity: 0, transform: 'scale(1.6)' }
    ], { duration: 700, delay: t1 + 100, easing: 'ease-out', fill: 'backwards' });
    release();
  }

  function serifReady() {
    if (!document.fonts || !document.fonts.forEach) return true;
    var st = {};
    document.fonts.forEach(function (f) { if (f.family.replace(/["']/g, '') === 'Instrument Serif' && f.status === 'loaded') st[f.style] = 1; });
    return !!(st.normal && st.italic);
  }
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', fitTitle);

  // État d'attente posé par /js/intro.js, levé dès que les animations tiennent le relais
  function release() { root.classList.remove('intro-wait'); }
  // au-delà de 2,5 s, la feuille de style a déjà tout affiché : pas d'intro par-dessus
  if (root.classList.contains('intro-wait') && canAnimate && performance.now() < 2500) {
    // on attend les deux styles d'Instrument Serif avant de mesurer le titre (2 s au plus)
    var waited = 0;
    (function waitFonts() {
      if (serifReady() || waited >= 2000) return playIntro(true);
      waited += 50; setTimeout(waitFonts, 50);
    })();
    setTimeout(release, 2600);
  } else {
    release();
    fitTitle();
  }
  resizers.push(fitTitle);
  tWrap.addEventListener('click', function () { playIntro(false); });

  /* Profondeur au défilement : le ciel et le titre glissent derrière l'immeuble */
  var sky = $('#h-sky');
  scrollers.push(function (y) {
    if (canAnimate && y < hero.offsetHeight * 1.2) {
      tWrap.style.transform = 'translateY(' + (y * 0.42).toFixed(1) + 'px)';
      sky.style.transform = 'translateY(' + (y * 0.6).toFixed(1) + 'px)';
    }
  });
})();

/* Parallaxe des sections de l'accueil */
var pword = $('#pword'), duskImg = $('#dusk-img'), fWord = $('#f-word'), fScale = 1;
// Le flou du mot de fin suit sa taille : sur téléphone, le mot est quatre fois plus petit, son flou aussi, et il s'efface plus tôt
function fMeasure() { if (fWord) fScale = Math.min(1, parseFloat(getComputedStyle(fWord).fontSize) / 200); }
fMeasure(); resizers.push(fMeasure);
if (canAnimate && pword && duskImg && fWord) scrollers.push(function () {
  var r = pword.getBoundingClientRect(), vh = window.innerHeight;
  if (r.bottom > 0 && r.top < vh) {
    var p = (vh - r.top) / (vh + r.height);
    pword.style.backgroundPosition = '50% ' + (20 + p * 60).toFixed(1) + '%';
  }
  var d = duskImg.parentNode.getBoundingClientRect();
  if (d.bottom > 0 && d.top < vh) {
    var q = (vh - d.top) / (vh + d.height);
    duskImg.style.transform = 'translateY(' + ((q - 0.5) * -14).toFixed(2) + '%)';
  }
  var f = fWord.getBoundingClientRect();
  if (f.bottom > 0 && f.top < vh) {
    var k = Math.max(0, Math.min(1, (vh - f.top) / (vh * (0.35 + 0.35 * fScale))));
    fWord.style.filter = 'blur(' + ((14 - k * 11) * fScale).toFixed(1) + 'px)';
    fWord.style.letterSpacing = (0.06 - k * 0.07).toFixed(3) + 'em';
  }
});

/* Menu flottant : il apparaît quand le héros sort de l'écran */
var floatNav = $('#float-nav');
scrollers.push(function () { floatNav.classList.toggle('show', hero.getBoundingClientRect().bottom < 90); });

/* Survol des boutons : le disque part du point d'entrée et repart par le point de sortie (capture, pour couvrir aussi les boutons du parcours) */
function fillFrom(e) {
  var b = e.target;
  if (!b.matches || !b.matches('.btn-terra, .btn-glass, .btn-cream')) return;
  var r = b.getBoundingClientRect();
  b.style.setProperty('--x', (e.clientX - r.left).toFixed(0) + 'px');
  b.style.setProperty('--y', (e.clientY - r.top).toFixed(0) + 'px');
  b.style.setProperty('--d', (2 * Math.hypot(r.width, r.height)).toFixed(0) + 'px');
}
document.addEventListener('pointerenter', fillFrom, true);
document.addEventListener('pointerleave', fillFrom, true);

/* Ronds magnétiques, à la souris seulement */
if (canAnimate) $$('.mz').forEach(function (z) {
  var orb = $('.orb', z), txt = $('.orb > span', z);
  z.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var r = orb.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    orb.classList.add('moving');
    orb.style.transform = 'translate(' + (dx * .3).toFixed(1) + 'px,' + (dy * .3).toFixed(1) + 'px)';
    txt.style.transform = 'translate(' + (dx * .14).toFixed(1) + 'px,' + (dy * .14).toFixed(1) + 'px)';
  });
  z.addEventListener('pointerleave', function () {
    orb.classList.remove('moving');
    orb.style.transform = ''; txt.style.transform = '';
  });
});

/* Menu */
var menuBtn = $('#menu-btn'), menuPanel = $('#menu-panel');
menuBtn.addEventListener('click', function () { var open = menuPanel.hidden; menuPanel.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open)); });
document.addEventListener('click', function (e) {
  if (menuPanel.hidden || e.target.closest('#menu-btn')) return;
  if (e.target.closest('#menu-panel') && !e.target.closest('a')) return;
  menuPanel.hidden = true; menuBtn.setAttribute('aria-expanded', 'false');
});

/* Menu du héros : la pastille glisse vers le lien survolé, puis revient sur la page en cours */
var hLinks = $('.h-links'), ind = $('.ind', hLinks), indOn = false;
function moveInd(a, instant) {
  if (!a) { ind.classList.remove('on'); indOn = false; return; }
  var jump = !indOn || instant;
  if (jump) ind.classList.add('jump');
  ind.style.width = a.offsetWidth + 'px';
  ind.style.transform = 'translateX(' + a.offsetLeft + 'px)';
  if (jump) { void ind.offsetWidth; ind.classList.remove('jump'); }
  ind.classList.add('on'); indOn = true;
}
function currentLink() { return $('a[aria-current]', hLinks); }
hLinks.addEventListener('pointerover', function (e) { var a = e.target.closest('a'); if (a) moveInd(a); });
hLinks.addEventListener('pointerleave', function () { moveInd(currentLink()); });
hLinks.addEventListener('focusin', function (e) { var a = e.target.closest('a'); if (a) moveInd(a); });
hLinks.addEventListener('focusout', function () { moveInd(currentLink()); });
moveInd(currentLink(), true);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveInd(currentLink(), true); });
resizers.push(function () { moveInd(currentLink(), true); });

/* =========================================================
   Accueil : exemple d'annonce, arrondissements, étapes, calculateur
   ========================================================= */
var lsTrack = $('#ls-track');
if (lsTrack) (function () {
  // photos qui défilent, texte en français ou en anglais
  var lsDots = $$('.ls-dots i'), lsCount = $('#ls-count'), lsHold = false;
  function lsIndex() { return Math.round(lsTrack.scrollLeft / Math.max(1, lsTrack.clientWidth)); }
  function lsUpdate() {
    var i = lsIndex();
    lsDots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
    lsCount.textContent = (i + 1) + ' / ' + lsDots.length;
  }
  function lsGo(d) {
    var n = lsDots.length, i = (lsIndex() + d + n) % n;
    lsTrack.scrollTo({ left: i * lsTrack.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
  }
  lsTrack.addEventListener('scroll', function () { requestAnimationFrame(lsUpdate); }, { passive: true });
  $('.ls-nav.prev').addEventListener('click', function () { lsHold = true; lsGo(-1); });
  $('.ls-nav.next').addEventListener('click', function () { lsHold = true; lsGo(1); });
  lsTrack.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); lsHold = true; lsGo(e.key === 'ArrowRight' ? 1 : -1); }
  });
  // défile seul tant que la carte est à l'écran, s'arrête au survol et dès qu'on s'en sert
  var lsMedia = $('.ls-media'), lsOver = false;
  lsMedia.addEventListener('mouseenter', function () { lsOver = true; });
  lsMedia.addEventListener('mouseleave', function () { lsOver = false; });
  lsTrack.addEventListener('touchstart', function () { lsHold = true; }, { passive: true });
  if (canAnimate) setInterval(function () {
    if (lsHold || lsOver || document.hidden) return;
    var r = lsTrack.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight) lsGo(1);
  }, 4000);
  var LS = {
    fr: { title: 'Deux-pièces lumineux, moulures et balcon', meta: 'Paris 11e · 45 m² · 2 voyageurs · 1 chambre', desc: 'Parquet en point de Hongrie, moulures et grandes fenêtres. Quatrième étage avec ascenseur.' },
    en: { title: 'Bright one-bedroom with mouldings and a balcony', meta: 'Paris 11th · 45 m² · 2 guests · 1 bedroom', desc: 'Chevron parquet, mouldings and tall windows. Fourth floor, with a lift.' }
  };
  $$('.lang button').forEach(function (b) {
    b.addEventListener('click', function () {
      var l = b.getAttribute('data-lang'), t = LS[l], body = $('#ls-body');
      if (b.getAttribute('aria-pressed') === 'true') return;
      $$('.lang button').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
      body.setAttribute('lang', l);
      $('#ls-title').textContent = t.title; $('#ls-meta').textContent = t.meta; $('#ls-desc').textContent = t.desc;
      if (canAnimate) body.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: expo });
    });
  });
})();

/* Plan de Paris (accueil et estimation) : un clic, Entrée ou Espace choisit l'arrondissement, sans passer à la suite.
   À la souris, le survol le montre sans le choisir ; au clavier, un trait entoure l'arrondissement qui a le focus. */
function parisPlan(box, onPick, preset) {
  var zones = $$('.z', box), ring = $('.ring', box), hint = $('.pm-hint', box), sel = $('.pm-sel', box), live = $('.pm-live', box);
  var num = $('.pm-n', sel), cp = $('.pm-cp', sel), q = $('.pm-q', sel), chosen = null;
  function show(z, preview) {
    hint.hidden = !!z; sel.hidden = !z;
    if (!z) return;
    num.textContent = z.getAttribute('data-n'); cp.textContent = z.getAttribute('data-cp'); q.textContent = z.getAttribute('data-q');
    sel.classList.toggle('is-preview', !!preview);
  }
  function pick(z, quiet) {
    chosen = z;
    zones.forEach(function (o) { o.setAttribute('aria-pressed', String(o === z)); });
    $$('.lb', box).forEach(function (l) { l.classList.toggle('on', l.getAttribute('data-arr') === z.getAttribute('data-arr')); });
    show(z, false);
    if (!quiet) live.textContent = z.getAttribute('data-n') + ' arrondissement choisi';
    onPick(Number(z.getAttribute('data-arr')));
  }
  zones.forEach(function (z) {
    z.addEventListener('click', function () { pick(z); });
    z.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(z); } });
    z.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && z !== chosen) show(z, true); });
    z.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') show(chosen, false); });
    z.addEventListener('focus', function () {
      if (!z.matches(':focus-visible')) return;
      ring.setAttribute('d', z.firstElementChild.getAttribute('d')); ring.style.display = '';
      if (z !== chosen) show(z, true);
    });
    z.addEventListener('blur', function () { ring.style.display = 'none'; show(chosen, false); });
  });
  if (preset) pick(zones[preset - 1], true);
}

/* Accueil : le plan choisit l'arrondissement, le bouton ouvre l'estimation à l'étape suivante */
var parisHome = $('#paris-plan');
if (parisHome) (function () {
  var btn = $('#pm-go'), label = $('span', btn), chosen = 0;
  parisPlan(parisHome, function (n) { chosen = n; label.textContent = 'Estimer dans le ' + arrLabel(n); });
  btn.addEventListener('click', function () { openFlow(btn, chosen); });
})();

/* Le déroulé : la ligne qui passe à hauteur de lecture s'allume, et le plan montre où le service a lieu.
   Sur ordinateur, la hauteur de lecture est le milieu de l'écran ; sur téléphone, le milieu de ce qui reste sous le plan. */
var dr = $('#dr');
if (dr) (function () {
  var lines = $$('.dr-ln', dr), stage = $('.dr-stage', dr), cue = $('.dr-cue', dr);
  var wide = window.matchMedia('(min-width: 900px)'), cur = null;
  dr.classList.add('js');
  scrollers.push(function () {
    var r = dr.getBoundingClientRect(), vh = window.innerHeight;
    if (r.bottom < 0 || r.top > vh) return;
    var s = stage.getBoundingClientRect();
    if (!wide.matches) stage.classList.toggle('stuck', s.top <= parseFloat(getComputedStyle(stage).top) + 1);
    var top = wide.matches ? 0 : s.bottom, y = top + (vh - top) * (wide.matches ? 0.5 : 0.45);
    var best = lines[0], dist = Infinity;
    lines.forEach(function (l) {
      var b = l.getBoundingClientRect(), d = Math.abs((b.top + b.bottom) / 2 - y);
      if (d < dist) { dist = d; best = l; }
    });
    if (best === cur) return;
    if (cur) cur.classList.remove('on');
    cur = best; cur.classList.add('on');
    dr.setAttribute('data-on', cur.getAttribute('data-s'));
    dr.setAttribute('data-m', cur.getAttribute('data-m'));
    cue.textContent = cur.getAttribute('data-cue');
  });
})();

/* Apparitions au défilement (le contenu est visible sans elles) */
var fan = $('#fan');
if (fan && canAnimate && 'IntersectionObserver' in window) {
  fan.classList.add('closed');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target; io.unobserve(el);
      if (el.id === 'fan') { setTimeout(function () { fan.classList.remove('closed'); }, 250); return; }
      if (el.id === 'bar-fill') { el.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 1400, easing: expo }); return; }
      if (el.hasAttribute('data-reveal-img')) {
        el.animate([{ clipPath: 'inset(100% 0 0 0 round 22px)' }, { clipPath: 'inset(0% 0 0 0 round 22px)' }], { duration: 1400, easing: expo });
        $('img', el).animate([{ transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 1800, easing: expo });
        return;
      }
      el.animate([{ opacity: 0.001, transform: 'translateY(36px)' }, { opacity: 1, transform: 'none' }], { duration: 1100, easing: expo });
    });
  }, { threshold: 0 });
  $$('[data-reveal], [data-reveal-img]').forEach(function (el) { io.observe(el); });
  [fan, $('#bar-fill')].forEach(function (el) { io.observe(el); });
}

/* Calculateur */
var range = $('#calc-loyers');
if (range) (function () {
  var eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  function calc() {
    var v = Number(range.value);
    $('#calc-val').textContent = eur.format(v);
    $('#calc-fee').textContent = eur.format(v * 0.12);
    $('#calc-net').textContent = eur.format(v * 0.88);
  }
  range.addEventListener('input', calc); calc();
})();

/* =========================================================
   Parcours d'estimation (toutes les pages)
   ========================================================= */
var flow = $('#flow'), host = $('#step-host'), countEl = $('#flow-count'), bar = $('#flow-progress'), pmTpl = $('#pm-tpl');
var STEPS = ['arr', 'type', 'pieces', 'nights', 'contact', 'done'];
var TYPES = {
  principale: { label: 'Résidence principale', hint: 'Vous y vivez au moins 8 mois par an.' },
  secondaire: { label: 'Résidence secondaire', hint: 'Un pied-à-terre que vous occupez une partie de l’année.' },
  investissement: { label: 'Investissement locatif', hint: 'Un appartement que vous n’habitez pas.' }
};
var PIECES = ['Studio', '2 pièces', '3 pièces', '4 pièces', '5 pièces et plus'];
var state, idx, lastOpener;
function reset() { state = { arr: null, type: null, pieces: null, nights: 45, prenom: '', email: '', tel: '' }; idx = 0; }
reset();
function arrLabel(n) { return n === 1 ? '1er' : n + 'e'; }
function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function go(d) { idx = Math.max(0, Math.min(STEPS.length - 1, idx + d)); render(); }
var ARROW = '<svg aria-hidden="true"><use href="#arrow"/></svg>';
function actions(ok, label) {
  return '<div class="flow-actions">' + (idx > 0 ? '<button class="btn btn-line" type="button" data-back>← Retour</button>' : '<span></span>') +
    '<button class="btn btn-terra" type="' + (STEPS[idx] === 'contact' ? 'submit' : 'button') + '" data-next' + (ok ? '' : ' disabled') + '>' + (label || 'Continuer') + ' ' + ARROW + '</button></div>';
}
function render() {
  var step = STEPS[idx], total = STEPS.length - 1, html = '';
  countEl.textContent = step === 'done' ? 'Terminé' : 'Étape ' + (idx + 1) + ' sur ' + total;
  bar.style.width = (step === 'done' ? 100 : idx / total * 100) + '%';
  $$('#flow-steps li').forEach(function (li, i) { li.className = i === idx ? 'on' : (i < idx ? 'done' : ''); });

  if (step === 'arr') {
    html = '<p class="eyebrow">Votre appartement</p><h2 id="flow-title">Dans quel arrondissement&nbsp;?</h2><div class="pm-slot"></div>' + actions(state.arr !== null);
  } else if (step === 'type') {
    html = '<p class="eyebrow">Votre appartement' + (state.arr ? ' · <span class="nc">' + arrLabel(state.arr) + '</span>' : '') + '</p><h2 id="flow-title">Ce logement est votre…</h2><div class="options">';
    Object.keys(TYPES).forEach(function (k) { html += '<button class="option" type="button" data-pick="type" data-value="' + k + '" aria-pressed="' + (state.type === k) + '"><b>' + TYPES[k].label + '</b><span>' + TYPES[k].hint + '</span></button>'; });
    html += '</div>' + actions(state.type !== null);
  } else if (step === 'pieces') {
    html = '<p class="eyebrow">Votre appartement</p><h2 id="flow-title">Combien de pièces&nbsp;?</h2><div class="tiles wide">';
    PIECES.forEach(function (p, i) { html += '<button class="tile" type="button" data-pick="pieces" data-value="' + i + '" aria-pressed="' + (state.pieces === i) + '"><b>' + (i === 0 ? 'Studio' : (i + 1) + (i === 4 ? '+' : '')) + '</b><span>' + (i === 0 ? 'une pièce' : 'pièces') + '</span></button>'; });
    html += '</div>' + actions(state.pieces !== null);
  } else if (step === 'nights') {
    var principale = state.type === 'principale', max = principale ? 90 : 365;
    state.nights = Math.min(state.nights, max);
    var ticks = principale ? [7, 30, 60, 90] : [7, 90, 180, 365];
    html = '<p class="eyebrow">Vos absences</p><h2 id="flow-title">' + (principale ? 'Combien de nuits par an êtes-vous absent&nbsp;?' : 'Combien de nuits par an souhaitez-vous louer&nbsp;?') + '</h2>' +
      '<p class="nights-val" aria-live="polite"><span id="nights-out">' + state.nights + '</span><small>nuits par an</small></p>' +
      '<label class="sr" for="nights-range">Nombre de nuits</label><input type="range" id="nights-range" min="7" max="' + max + '" step="1" value="' + state.nights + '">' +
      '<div class="ticks">' + ticks.map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</div>' +
      '<div class="hint"><b>À savoir</b>' + (principale
        ? 'À Paris, une résidence principale se loue 90 nuits par an au maximum. Nous tenons le compte pour vous, toutes plateformes confondues.'
        : 'À Paris, louer en courte durée une résidence secondaire ou un investissement demande une autorisation de changement d’usage. Nous vérifions votre situation avec vous avant toute mise en ligne.') + '</div>' + actions(true);
  } else if (step === 'contact') {
    html = '<form id="contact-form" novalidate><p class="eyebrow">Dernière étape</p><h2 id="flow-title">À qui envoyons-nous l’estimation&nbsp;?</h2><div class="form">' +
      '<div class="field"><label for="f-prenom">Prénom</label><input id="f-prenom" autocomplete="given-name" value="' + esc(state.prenom) + '"><span class="err" id="e-prenom"></span></div>' +
      '<div class="field"><label for="f-email">E-mail</label><input id="f-email" type="email" autocomplete="email" value="' + esc(state.email) + '"><span class="err" id="e-email"></span></div>' +
      '<div class="field"><label for="f-tel">Téléphone <small>(facultatif)</small></label><input id="f-tel" type="tel" autocomplete="tel" value="' + esc(state.tel) + '"></div>' +
      '<p class="privacy">Prototype&nbsp;: rien n’est envoyé, vos réponses restent dans cette page.</p></div>' + actions(true, 'Recevoir mon estimation') + '</form>';
  } else {
    html = '<p class="eyebrow">Demande reçue</p><h2 id="flow-title">C’est noté, ' + esc(state.prenom) + '.</h2><dl class="summary">' +
      '<div><dt>Arrondissement</dt><dd>' + arrLabel(state.arr) + '</dd></div>' +
      '<div><dt>Logement</dt><dd>' + TYPES[state.type].label.replace('Résidence ', 'Rés. ') + '</dd></div>' +
      '<div><dt>Taille</dt><dd>' + PIECES[state.pieces] + '</dd></div>' +
      '<div><dt>Nuits par an</dt><dd>' + state.nights + '</dd></div></dl>' +
      '<p class="done-text">Un conseiller Haustmann vous rappelle sous 24&nbsp;h avec une estimation chiffrée pour votre appartement.</p>' +
      '<p class="done-text">Avec 12&nbsp;%, sur 1&nbsp;000&nbsp;€ de loyers, vous recevez 880&nbsp;€.</p>' +
      '<div class="flow-actions"><button class="btn btn-line" type="button" data-restart>Modifier mes réponses</button><button class="btn btn-terra" type="button" data-finish>Retour au site ' + ARROW + '</button></div>';
  }
  host.innerHTML = '<div class="step enter">' + html + '</div>';
  if (step === 'arr') {
    $('.pm-slot', host).replaceWith(pmTpl.content.cloneNode(true));
    parisPlan($('.pm', host), function (n) { state.arr = n; $('[data-next]', host).disabled = false; }, state.arr);
  }
  if (step === 'nights') {
    var rg = $('#nights-range');
    rg.addEventListener('input', function () { state.nights = Number(rg.value); $('#nights-out').textContent = state.nights; });
  }
  $('.flow-main').scrollTop = 0;
  var first = host.querySelector('[aria-pressed="true"]') || host.querySelector('.z, .tile, .option, input, [data-finish]');
  if (first) first.focus({ preventScroll: true });
}
host.addEventListener('click', function (e) {
  var pick = e.target.closest('[data-pick]');
  if (pick) {
    var key = pick.getAttribute('data-pick'), raw = pick.getAttribute('data-value');
    state[key] = key === 'type' ? raw : Number(raw);
    $$('[data-pick="' + key + '"]', host).forEach(function (b) { b.setAttribute('aria-pressed', String(b === pick)); });
    var nx = host.querySelector('[data-next]'); if (nx) nx.disabled = false;
    setTimeout(function () { if (STEPS[idx] === key) go(1); }, 260);
    return;
  }
  if (e.target.closest('[data-back]')) return go(-1);
  if (e.target.closest('[data-next]') && STEPS[idx] !== 'contact') return go(1);
  if (e.target.closest('[data-restart]')) { idx = 0; return render(); }
  if (e.target.closest('[data-finish]')) { closeFlow(); reset(); }
});
host.addEventListener('submit', function (e) {
  e.preventDefault();
  var p = $('#f-prenom'), m = $('#f-email'), ok = true;
  $('#e-prenom').textContent = ''; $('#e-email').textContent = '';
  if (!p.value.trim()) { $('#e-prenom').textContent = 'Indiquez votre prénom.'; ok = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.value.trim())) { $('#e-email').textContent = 'Indiquez une adresse e-mail valide, par exemple claire@exemple.fr.'; ok = false; }
  if (!ok) { (p.value.trim() ? m : p).focus(); return; }
  state.prenom = p.value.trim(); state.email = m.value.trim(); state.tel = $('#f-tel').value.trim();
  go(1);
});
function openFlow(opener, presetArr) {
  lastOpener = opener;
  if (STEPS[idx] === 'done') reset();
  if (presetArr) { state.arr = presetArr; idx = 1; }
  flow.hidden = false;
  root.style.overflow = 'hidden';
  if (canAnimate) flow.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350, easing: 'ease-out' });
  render();
}
function closeFlow() {
  flow.hidden = true;
  root.style.overflow = '';
  if (lastOpener && lastOpener.focus) lastOpener.focus();
}
$$('[data-open-flow]').forEach(function (b) { b.addEventListener('click', function () { openFlow(b); }); });
$('#flow-close').addEventListener('click', closeFlow);
if (location.hash === '#estimer') openFlow(null);
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !flow.hidden) closeFlow(); });

/* =========================================================
   Journal
   ========================================================= */
/* Apparition des cartes au défilement (elles restent visibles sans) */
var jio = canAnimate && 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
  entries.forEach(function (en) {
    if (!en.isIntersecting) return;
    jio.unobserve(en.target);
    en.target.animate([{ opacity: 0.001, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], { duration: 1000, easing: expo });
    var im = $('.j-media img', en.target);
    if (im) im.animate([{ transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 1600, easing: expo });
  });
}, { threshold: 0 }) : null;
function jReveal(els) {
  if (!jio) return;
  var vh = window.innerHeight;
  els.forEach(function (el) { if (!el.hidden && el.getBoundingClientRect().top > vh * 0.92) jio.observe(el); });
}
jReveal($$('[data-jr]'));

/* Le mot JOURNAL remplit la largeur, comme HAUSTMANN */
var jWordWrap = $('#j-word-wrap'), jWord = $('#j-word');
if (jWord) {
  var fitWord = function () {
    jWord.parentNode.style.fontSize = '100px';
    var w = jWord.getBoundingClientRect().width;
    if (w > 0) jWord.parentNode.style.fontSize = (100 * jWordWrap.clientWidth * .92 / w).toFixed(2) + 'px';
  };
  fitWord();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWord);
  resizers.push(fitWord);
}

/* Liste, avec filtres par thème : « Tout » garde l'article à la une, un thème montre tous ses articles en grille */
var jFilters = $('#j-filters');
if (jFilters) jFilters.addEventListener('click', function (e) {
  var b = e.target.closest('[data-f]'); if (!b) return;
  var f = b.getAttribute('data-f'), featHref = $('#j-feat > a').getAttribute('href'), n = 0;
  $$('[data-f]', jFilters).forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
  $('#j-feat').hidden = f !== 'all';
  $$('#j-grid > .j-card').forEach(function (c) {
    var match = f === 'all' || c.getAttribute('data-cat') === f;
    if (match) n++;
    c.hidden = !match || (f === 'all' && c.getAttribute('href') === featHref);
  });
  $('#j-count').textContent = n + (n > 1 ? ' articles' : ' article');
  jReveal($$('#j-grid > .j-card'));
});

/* Article : barre de lecture et sommaire */
var jProgress = $('#j-progress'), prose = $('#j-prose');
if (jProgress && prose) (function () {
  var heads = $$(':scope > h2, :scope > .j-sources > h2', prose), links = $$('#j-toc a');
  scrollers.push(function () {
    var r = prose.getBoundingClientRect(), vh = window.innerHeight;
    var k = Math.max(0, Math.min(1, (vh * 0.3 - r.top) / Math.max(1, r.height - vh * 0.6)));
    jProgress.style.transform = 'scaleX(' + k.toFixed(4) + ')';
    var cur = heads[0];
    heads.forEach(function (h) { if (h.getBoundingClientRect().top < vh * 0.32) cur = h; });
    links.forEach(function (a) { a.classList.toggle('on', !!cur && a.getAttribute('href') === '#' + cur.id); });
  });
})();

/* Défilement et redimensionnement */
var ticking = false;
function onScroll() {
  ticking = false;
  var y = window.scrollY || window.pageYOffset;
  scrollers.forEach(function (f) { f(y); });
}
window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
var rT;
window.addEventListener('resize', function () {
  onScroll();
  clearTimeout(rT); rT = setTimeout(function () { resizers.forEach(function (f) { f(); }); }, 120);
});
onScroll();
