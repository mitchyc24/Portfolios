// Léonie Théberge — interactions (aucune dépendance, ~10 ko).
// Tout est amélioration progressive : sans JS, la maquette et les liens restent fonctionnels.

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const html = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ------------------------------------------------------------------ */
/* Musée                                                               */
/* ------------------------------------------------------------------ */
function initMuseum(m) {
  const stage = $('[data-stage]', m);
  const resetBtn = $('[data-reset]', m);
  const viewBtns = $$('[data-view-btn]', m);
  const cartels = $$('[data-cartel]', m);
  const statusLines = $$('[data-status-for]', m);
  const isHero = m.classList.contains('museum--hero');
  const sway = $('.museum__sway', m);
  // Éléments qui lisent --spin / --tilt : on ne modifie qu'eux pendant un glisser
  // (changer la variable sur .museum recalculerait le style des ~1 100 nœuds).
  const camEls = [$('.museum__cam', m), $('.compass svg', m), ...$$('.m-pin__sign', m)];
  const setCam = (prop, val) => camEls.forEach((el) => el.style.setProperty(prop, val));
  const clearCam = () => camEls.forEach((el) => { el.style.removeProperty('--spin'); el.style.removeProperty('--tilt'); });
  let active = null;
  let focused = null;

  const savedView = store.get('lt-view');
  if (savedView && !html.classList.contains('montage-pending')) setView(savedView, false);

  function showCartel(id) {
    const want = id || 'welcome';
    cartels.forEach((c) => (c.hidden = c.dataset.cartel !== want));
  }

  function setActive(id) {
    if (id === active) return;
    active = id;
    $$('.is-active', m).forEach((el) => el.classList.remove('is-active'));
    if (id) $$(`[data-room="${id}"], [data-room-link="${id}"]`, m).forEach((el) => el.classList.add('is-active'));
    // Le survol ne fait que surligner : le cartel ne change qu'au clic (focusRoom),
    // sinon il disparaît sous le curseur pendant qu'on se dirige vers lui.
    statusLines.forEach((s) => (s.hidden = s.dataset.statusFor !== (id || 'none')));
  }

  function roomCenter(id) {
    const r = $(`.m-room[data-room="${id}"]`, m);
    const v = (p) => parseFloat(r.style.getPropertyValue(p));
    return [v('--x') + v('--l') / 2, v('--y') + v('--d') / 2];
  }

  function focusRoom(id) {
    focused = id;
    const [x, y] = roomCenter(id);
    m.style.setProperty('--fx', x);
    m.style.setProperty('--fy', y);
    m.classList.add('is-focused');
    resetBtn.hidden = false;
    setActive(id);
    showCartel(id);
  }

  function unfocus() {
    focused = null;
    m.style.removeProperty('--fx');
    m.style.removeProperty('--fy');
    m.classList.remove('is-focused');
    resetBtn.hidden = true;
    setActive(null);
    showCartel(null);
  }

  function setView(view, save = true) {
    m.dataset.view = view;
    clearCam();
    viewBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.viewBtn === view)));
    if (save) store.set('lt-view', view);
  }

  viewBtns.forEach((b) => b.addEventListener('click', () => setView(b.dataset.viewBtn)));
  resetBtn.addEventListener('click', unfocus);
  (isHero ? document : m).addEventListener('keydown', (e) => { if (e.key === 'Escape' && focused) { e.stopPropagation(); unfocus(); } });

  // Survol / focus clavier
  stage.addEventListener('pointerover', (e) => {
    if (e.pointerType === 'touch' || dragging) return;
    const el = e.target.closest('[data-room]');
    setActive(el ? el.dataset.room : focused);
  });
  stage.addEventListener('pointerleave', () => setActive(focused));
  m.addEventListener('focusin', (e) => {
    const el = e.target.closest('[data-room], [data-room-link]');
    if (el) setActive(el.dataset.room || el.dataset.roomLink);
  });
  $$('[data-room-link]', m).forEach((a) => {
    a.addEventListener('pointerenter', () => setActive(a.dataset.roomLink));
    a.addEventListener('pointerleave', () => setActive(focused));
  });

  // Clic : 1er clic sur une salle = s'en approcher ; 2e = y entrer.
  stage.addEventListener('click', (e) => {
    if (suppressClick) { e.preventDefault(); e.stopPropagation(); suppressClick = false; return; }
    const a = e.target.closest('a');
    const roomEl = e.target.closest('[data-room]');
    if (!a) { if (focused && !roomEl) unfocus(); else if (roomEl) focusRoom(roomEl.dataset.room); return; }
    const room = a.dataset.room || roomEl?.dataset.room;
    const isRoomLink = a.classList.contains('m-room') || a.classList.contains('m-pin');
    if (room && focused !== room && (isRoomLink || e.pointerType === 'touch' || !finePointer)) {
      e.preventDefault();
      focusRoom(room);
    }
  });

  // Orbite au glisser (souris : rotation + inclinaison ; tactile : rotation seule)
  let dragging = false, suppressClick = false, start = null;
  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const cs = getComputedStyle(camEls[0]);
    start = { x: e.clientX, y: e.clientY, spin: parseFloat(cs.getPropertyValue('--spin')), tilt: parseFloat(cs.getPropertyValue('--tilt')), id: e.pointerId, type: e.pointerType };
  });
  stage.addEventListener('pointermove', (e) => {
    if (!start || e.pointerId !== start.id) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (!dragging) {
      if (Math.hypot(dx, dy) < 6) return;
      if (start.type === 'touch' && Math.abs(dy) > Math.abs(dx)) { start = null; return; } // laisse défiler la page
      dragging = true;
      m.classList.add('is-dragging');
      stage.setPointerCapture(e.pointerId);
    }
    setCam('--spin', clamp(start.spin + dx * 0.25, 6, 84) + 'deg');
    if (start.type !== 'touch') setCam('--tilt', clamp(start.tilt - dy * 0.2, 0, 72) + 'deg');
  });
  const end = () => {
    if (dragging) { suppressClick = true; setTimeout(() => (suppressClick = false), 50); }
    dragging = false; start = null;
    m.classList.remove('is-dragging');
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);

  // Léger balancement qui suit la souris (désactivé si mouvement réduit)
  if (finePointer && !reduceMotion) {
    let raf = 0;
    m.addEventListener('pointermove', (e) => {
      if (dragging) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = m.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
        sway.style.setProperty('--sx', (nx * 5).toFixed(2) + 'deg');
        sway.style.setProperty('--sy', (-ny * 3).toFixed(2) + 'deg');
      });
    });
    m.addEventListener('pointerleave', () => { sway.style.removeProperty('--sx'); sway.style.removeProperty('--sy'); });
  }

  if (m.dataset.here) $$(`.m-pin[data-room="${m.dataset.here}"]`, m).forEach((p) => p.classList.add('is-here'));
  if (isHero) montage(m);
  return { unfocus };
}

// Montage d'intro : le plan s'élève en axonométrie, puis on accroche les œuvres.
function montage(m) {
  if (!html.classList.contains('montage-pending')) return;
  try { sessionStorage.setItem('lt-montage', '1'); } catch {}
  const lis = $$('.montage li', m);
  const pct = $('[data-pct]', m);
  m.classList.add('is-montage');
  m.dataset.step = '1';
  const t0 = performance.now(), total = 3200;
  const tick = (now) => {
    const p = clamp((now - t0) / total, 0, 1);
    pct.textContent = Math.round(100 * (1 - Math.pow(1 - p, 2)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  const mark = (i) => lis.forEach((li, k) => { li.classList.toggle('is-done', k < i); li.classList.toggle('is-current', k === i); });
  mark(0);
  const at = (ms, fn) => setTimeout(fn, ms);
  at(650, () => { html.classList.remove('montage-pending'); m.dataset.step = '2'; mark(1); });
  at(1700, () => { m.dataset.step = '3'; mark(2); });
  at(2350, () => { m.dataset.step = '4'; mark(3); });
  at(2850, () => { delete m.dataset.step; mark(4); });
  at(3300, () => mark(5));
  at(3900, () => m.classList.remove('is-montage'));
}

const museums = $$('[data-museum]').map(initMuseum);

/* Ouverture du plan (pages intérieures) / retour au héros (accueil) */
const dialog = $('[data-museum-dialog]');
$$('[data-open-museum]').forEach((b) =>
  b.addEventListener('click', () => {
    if (!dialog) return window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    dialog.showModal();
  }),
);
$$('[data-close-dialog]').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));

/* ------------------------------------------------------------------ */
/* En-tête, apparitions, horloge                                       */
/* ------------------------------------------------------------------ */
const header = $('.site-header');
const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 40);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
$$('[data-reveal]').forEach((el) => io.observe(el));

const clock = $('[data-clock]');
if (clock) {
  const fmt = new Intl.DateTimeFormat('fr-CA', { timeZone: clock.dataset.tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZoneName: 'short' });
  let timer = 0;
  const render = () => {
    const parts = fmt.formatToParts(new Date());
    const g = (t) => parts.find((p) => p.type === t)?.value ?? '';
    clock.textContent = `${g('hour')}:${g('minute')}:${g('second')} ${g('timeZoneName')}`;
  };
  new IntersectionObserver(([e]) => {
    clearInterval(timer);
    if (e.isIntersecting) { render(); timer = setInterval(render, 1000); }
  }).observe(clock);
}

/* ------------------------------------------------------------------ */
/* Salle 01 : aperçu qui suit le curseur ; Salle 02 : inclinaison       */
/* ------------------------------------------------------------------ */
const exlist = $('[data-exlist]');
if (exlist && finePointer) {
  let raf = 0, lastX = 0;
  exlist.addEventListener('pointermove', (e) => {
    const r = exlist.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top, vx = x - lastX;
    lastX = x;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      exlist.style.setProperty('--mx', `${x}px`);
      exlist.style.setProperty('--my', `${y}px`);
      exlist.style.setProperty('--rot', `${clamp(vx * 0.35, -7, 7)}deg`);
      exlist.style.setProperty('--ry', `${clamp(vx * 1.1, -18, 18)}deg`);
    });
  });
}

if (finePointer && !reduceMotion) {
  $$('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      card.classList.add('is-tilting');
      card.style.setProperty('--ry', `${(px * 10).toFixed(2)}deg`);
      card.style.setProperty('--rx', `${(-py * 8).toFixed(2)}deg`);
    });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-tilting');
      card.style.removeProperty('--rx');
      card.style.removeProperty('--ry');
    });
  });
}

/* ------------------------------------------------------------------ */
/* Visionneuse                                                         */
/* ------------------------------------------------------------------ */
const lb = $('[data-lightbox-dialog]');
if (lb) {
  const items = $$('[data-lightbox]');
  const lbImg = $('[data-lb-img]', lb), lbCap = $('[data-lb-cap]', lb), lbCount = $('[data-lb-count]', lb);
  let idx = 0;
  const show = (i) => {
    idx = (i + items.length) % items.length;
    const img = $('img', items[idx]);
    const largest = img.srcset.split(',').pop().trim().split(' ')[0];
    lbImg.src = largest;
    lbImg.alt = img.alt;
    const cap = items[idx].closest('figure')?.querySelector('figcaption');
    lbCap.textContent = cap ? cap.textContent.replace(/\s+/g, ' ').trim() : img.alt;
    lbCount.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
    // précharge la suivante
    const next = $('img', items[(idx + 1) % items.length]);
    if (next) new Image().src = next.srcset.split(',').pop().trim().split(' ')[0];
  };
  items.forEach((b, i) => b.addEventListener('click', () => { show(i); lb.showModal(); }));
  $('[data-lb-prev]', lb).addEventListener('click', () => show(idx - 1));
  $('[data-lb-next]', lb).addEventListener('click', () => show(idx + 1));
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lightbox__figure')) lb.close(); });
  let sx = null;
  lb.addEventListener('pointerdown', (e) => (sx = e.clientX));
  lb.addEventListener('pointerup', (e) => {
    if (sx !== null && Math.abs(e.clientX - sx) > 60) show(idx + (e.clientX < sx ? 1 : -1));
    sx = null;
  });
}

/* ------------------------------------------------------------------ */
/* Divers                                                              */
/* ------------------------------------------------------------------ */
$$('[data-copy]').forEach((b) =>
  b.addEventListener('click', async () => {
    const label = $('[data-copy-label]', b);
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
      label.textContent = 'Adresse copiée ✓';
    } catch {
      location.href = `mailto:${b.dataset.copy}`;
    }
    setTimeout(() => (label.textContent = 'Copier l’adresse'), 2400);
  }),
);

// Page Art : série courante dans la barre de navigation
const seriesLinks = $$('.series-nav a');
if (seriesLinks.length) {
  const byId = Object.fromEntries(seriesLinks.map((a) => [a.hash.slice(1), a]));
  const sio = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) {
      seriesLinks.forEach((a) => a.classList.remove('is-current'));
      const a = byId[e.target.id];
      if (a) { a.classList.add('is-current'); a.parentElement.scrollTo({ left: a.offsetLeft - 16, behavior: 'smooth' }); }
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('.series').forEach((s) => sio.observe(s));
}
