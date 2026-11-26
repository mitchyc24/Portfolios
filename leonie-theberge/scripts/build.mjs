// Génère le site statique dans public/ à partir de content/ et src/.
//
//   npm run build        (après « npm run images » si des images ont changé)

import { mkdir, readFile, writeFile, cp, rm, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exhibitions, products } from '../content/projects.mjs';
import { series } from '../content/art.mjs';
import { site, manifesto, bio, cv, artStatement, artQuote, hekoManifesto } from '../content/site.mjs';
import { renderMuseum, rooms, roomLabel } from './museum.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public');
const images = JSON.parse(await readFile(path.join(ROOT, 'content', 'images.json'), 'utf8'));
const YEAR = new Date().getFullYear();
const VERSION = Date.now().toString(36);

/* ------------------------------------------------------------------ */
/* Utilitaires                                                         */
/* ------------------------------------------------------------------ */

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Typographie française : apostrophes courbes, espaces insécables avant : ; ! ?
const fr = (s = '') =>
  String(s)
    .replace(/'/g, '’')
    .replace(/ :/g, ' :')
    .replace(/ ([;!?])/g, ' $1')
    .replace(/« /g, '« ')
    .replace(/ »/g, ' »')
    .replace(/(\d) (\d{3})/g, '$1 $2');
const t = (s) => esc(fr(s));
const years = (y = '') => y.replace(/(\d{4})-(\d{4})/, '$1 — $2');
const pad = (i) => String(i).padStart(2, '0');

function imgMeta(src) {
  const m = images[src];
  if (!m) throw new Error(`Image manquante dans images.json : ${src} (lancer « npm run images »)`);
  return m;
}

/** <img> responsive. sizes : attribut sizes ; base : préfixe relatif. */
function img(src, { base, alt = '', sizes = '100vw', cls = '', eager = false, max = 1440, min = 240, attrs = '' }) {
  const m = imgMeta(src);
  const entries = Object.entries(m.files).filter(([w]) => +w <= max && +w >= min);
  const srcset = entries.map(([w, f]) => `${base}${f} ${Math.min(+w, m.w)}w`).join(', ');
  const fallback = entries[Math.min(1, entries.length - 1)][1];
  return `<img class="${cls}" src="${base}${fallback}" srcset="${srcset}" sizes="${sizes}" width="${m.w}" height="${m.h}" alt="${t(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" style="--ph:${m.color}" ${attrs}>`;
}

const allProjects = [
  ...exhibitions.map((p, i) => ({ ...p, room: 'expositions', idx: i })),
  ...products.map((p, i) => ({ ...p, room: 'objets', idx: i })),
];
const projectBySlug = Object.fromEntries(allProjects.map((p) => [p.slug, p]));
const projectPath = (p) => `${p.room}/${p.slug}/`;
const roomOf = (id) => rooms.find((r) => r.id === id);
const roomCounts = {
  expositions: `${exhibitions.length} projets`,
  objets: `${products.length} projets`,
  art: `${series.reduce((a, s) => a + s.works.length, 0)} œuvres`,
  'a-propos': 'CV',
  contact: 'Écrire',
};
const workSlug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function altFor(p, image, i) {
  return image.caption ? `${p.title} — ${image.caption}` : i === 0 ? `${p.title}${p.client ? ` — ${p.client}` : ''}` : `${p.title} — vue ${i + 1}`;
}

/* ------------------------------------------------------------------ */
/* Musée (composant partagé)                                           */
/* ------------------------------------------------------------------ */

function museumWorld({ base, here }) {
  const roomHref = (r) => `${base}#${r.id}`;
  const ctx = {
    here,
    monogram: `${base}img/monogram.svg`,
    roomHref,
    href(ref) {
      if (ref.project) return base + projectPath(projectBySlug[ref.project]);
      if (ref.work) return `${base}art/#${ref.work[0]}`;
      if (ref.portrait) return `${base}#a-propos`;
      return '#';
    },
    thumb(ref, wUnits) {
      let src;
      if (ref.project) src = projectBySlug[ref.project].images[ref.index].src;
      else if (ref.work) src = series.find((s) => s.slug === ref.work[0]).works.find((w) => w.title === ref.work[1]).src;
      else if (ref.portrait) src = site.portrait.src;
      // ~10 px par unité sur grand écran ; la caméra peut zoomer ×1,8
      return img(src, { base, sizes: `${Math.round(wUnits * 16)}px`, max: 400 });
    },
  };
  return renderMuseum(ctx);
}

function cartels(base) {
  const list = (items) => `<ul class="cartel__list">${items.join('')}</ul>`;
  const li = (href, label, meta = '') => `<li><a href="${href}"><span>${t(label)}</span>${meta ? `<small>${t(meta)}</small>` : ''}</a></li>`;
  const body = {
    expositions: list(exhibitions.map((p) => li(base + projectPath({ ...p, room: 'expositions' }), p.title, p.year ? years(p.year) : ''))),
    objets: list(products.map((p) => li(base + projectPath({ ...p, room: 'objets' }), p.title, years(p.year)))),
    art: list(series.map((s) => li(`${base}art/#${s.slug}`, s.title, `${s.works.length} œuvre${s.works.length > 1 ? 's' : ''}`))),
    'a-propos': list(cv.practice.map((c) => li(`${base}#a-propos`, c.title, c.years.replace(' —', '—')))),
    contact: `<p class="cartel__mail"><a href="mailto:${site.email}">${site.email}</a></p>`,
  };
  const count = roomCounts;
  return rooms.map((r) => `<section class="cartel" data-cartel="${r.id}" hidden>
      <p class="cartel__n"><span>${roomLabel(r)}</span><span>${count[r.id]}</span></p>
      <p class="cartel__title">${t(r.name)}</p>
      <p class="cartel__sub">${t(r.title)}</p>
      <p class="cartel__blurb">${t(r.blurb)}</p>
      ${body[r.id]}
      <a class="cartel__go" href="${base}#${r.id}">${r.id === 'contact' ? 'Aller au contact' : 'Entrer dans la salle'} <span aria-hidden="true">→</span></a>
    </section>`).join('');
}

function museum({ base, here, mode }) {
  const welcome = `<section class="cartel cartel--welcome" data-cartel="welcome">
      <p class="cartel__n"><span>Plan du musée</span><span>${rooms.length - 1} salles + accueil</span></p>
      <ol class="cartel__rooms">${rooms.map((r) => `<li><a href="${base}#${r.id}" data-room-link="${r.id}"><b>${r.n}</b><span>${t(r.name)}</span><small>${t(roomCounts[r.id])}</small></a></li>`).join('')}</ol>
      <p class="cartel__status">
        <span data-status-for="none"><span class="hint-fine">Cliquer une salle pour s’en approcher — glisser pour tourner.</span><span class="hint-touch">Toucher une salle pour s’en approcher — glisser pour tourner la maquette.</span></span>
        ${rooms.map((r) => `<span data-status-for="${r.id}" hidden><b>${r.n} ${t(r.name)}</b> — ${t(r.title)}. <span class="hint-fine">Cliquer pour s’approcher.</span></span>`).join('')}
      </p>
    </section>`;
  return `<div class="museum museum--${mode}" data-museum data-view="axo" ${here ? `data-here="${here}"` : ''}>
    <div class="museum__stage" data-stage role="group" aria-label="Maquette interactive du musée : chaque salle mène à une section du portfolio">
      <div class="museum__sway"><div class="museum__cam">${museumWorld({ base, here })}</div></div>
    </div>
    <div class="museum__ui">
      ${mode === 'hero' ? `<div class="montage" aria-hidden="true"><p class="montage__title"><b>Montage</b> de l’exposition</p><ol>
        <li>Traçage du plan</li><li>Élévation des cimaises</li><li>Accrochage des œuvres</li><li>Réglage de l’éclairage</li><li>Ouverture des salles</li></ol><p class="montage__pct">_<span data-pct>0</span>%</p></div>` : ''}
      <ul class="legend" aria-label="Légende">
        <li><i class="lg lg--wall"></i>Cimaise</li><li><i class="lg lg--plinth"></i>Socle</li><li><i class="lg lg--path"></i>Circulation</li><li><i class="lg lg--here"></i>Vous êtes ici</li>
      </ul>
      <div class="cartels" data-cartels>${welcome}${cartels(base)}</div>
      <div class="museum__controls">
        <div class="viewswitch" role="group" aria-label="Type de vue">
          <button type="button" data-view-btn="plan" aria-pressed="false">Plan</button>
          <button type="button" data-view-btn="axo" aria-pressed="true">Axo</button>
          <button type="button" data-view-btn="persp" aria-pressed="false">Persp.</button>
        </div>
        <button type="button" class="museum__reset" data-reset hidden>Vue d’ensemble</button>
        <span class="compass" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2l4 10-4-2-4 2z"/><path d="M12 22l-4-10 4 2 4-2z" opacity=".35"/></svg><b>N</b></span>
      </div>
    </div>
  </div>`;
}

/* ------------------------------------------------------------------ */
/* Gabarit                                                             */
/* ------------------------------------------------------------------ */

const navItems = [
  ['expositions', 'Expositions'],
  ['objets', 'Objets'],
  ['art', 'Art'],
  ['a-propos', 'À propos'],
  ['contact', 'Contact'],
];

function layout({ title, description = site.description, base, body, page = 'page', here = '', image, pathName = '' }) {
  const fullTitle = title ? `${title} — ${site.name}` : `${site.name} — ${site.roles.join(', ')}`;
  const canonical = site.url ? `${site.url.replace(/\/$/, '')}/${pathName}` : '';
  // Aperçu de partage : la couverture du projet, sinon une vue de la maquette (src/img/og.jpg).
  const ogImage = site.url ? `${site.url.replace(/\/$/, '')}/${(image && imgMeta(image).og) || 'img/og.jpg'}` : '';
  const nav = navItems.map(([id, label]) => {
    const href = id === 'art' ? `${base}art/` : `${base}#${id}`;
    return `<a href="${href}" ${here === id ? 'aria-current="page"' : ''}>${label}</a>`;
  }).join('');
  const overlay = page === 'home' ? '' : `<dialog class="museum-dialog" data-museum-dialog aria-label="Plan du musée">
      <div class="museum-dialog__bar"><p><b>Plan du musée</b> <span>— choisissez une salle</span></p><button type="button" class="btn-close" data-close-dialog>Fermer <span aria-hidden="true">✕</span></button></div>
      ${museum({ base, here, mode: 'overlay' })}
    </dialog>`;
  return `<!doctype html>
<html lang="${site.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t(fullTitle)}</title>
<meta name="description" content="${t(description)}">
<meta name="theme-color" content="#e4e5e0">
${canonical ? `<link rel="canonical" href="${canonical}">` : ''}
<meta property="og:type" content="website">
<meta property="og:title" content="${t(fullTitle)}">
<meta property="og:description" content="${t(description)}">
${ogImage ? `<meta property="og:image" content="${ogImage}">\n<meta name="twitter:card" content="summary_large_image">` : ''}
<link rel="icon" href="${base}img/favicon.svg" type="image/svg+xml">
<link rel="preload" href="${base}fonts/big-shoulders-display.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${base}fonts/dm-mono-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${base}css/main.css?v=${VERSION}">
<script>
  // Avant le premier rendu : JS actif + montage d'intro (une fois par session).
  (function (d) {
    var c = d.documentElement.classList; c.add('js');
    try {
      if (${page === 'home'} && !location.hash && !matchMedia('(prefers-reduced-motion: reduce)').matches && !sessionStorage.getItem('lt-montage')) {
        c.add('montage-pending');
        setTimeout(function () { c.remove('montage-pending'); }, 6000);
      }
    } catch (e) {}
  })(document);
</script>
<script type="module" src="${base}js/main.js?v=${VERSION}"></script>
</head>
<body class="page-${page}">
<a class="skip" href="#contenu">Aller au contenu</a>
<header class="site-header">
  <a class="brand" href="${base}" aria-label="${site.name} — accueil"><span class="brand__mono" aria-hidden="true"></span><span class="brand__name">Léonie<br>Théberge</span></a>
  <nav class="site-nav" aria-label="Navigation principale">${nav}</nav>
  <button type="button" class="btn-plan" data-open-museum aria-haspopup="dialog"><span>Plan du musée</span>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l8.5 4.9v9.2L12 21.5l-8.5-4.9V7.4z"/><path d="M3.5 7.4L12 12.3l8.5-4.9M12 12.3v9.2"/></svg>
  </button>
</header>
${overlay}
<main id="contenu">
${body}
</main>
${footer(base)}
</body>
</html>
`;
}

function footer(base) {
  return `<footer class="site-footer">
  <div class="site-footer__inner">
    <div class="site-footer__brand"><span class="brand__mono brand__mono--xl" aria-hidden="true"></span><p>${t(site.roles.join(' · '))}</p></div>
    <nav aria-label="Pied de page">
      <p class="label">Salles</p>
      ${navItems.map(([id, label], i) => `<a href="${id === 'art' ? `${base}art/` : `${base}#${id}`}"><span>${id === 'contact' ? 'i' : pad(i + 1)}</span>${label}</a>`).join('')}
    </nav>
    <div>
      <p class="label">Liens</p>
      <a href="mailto:${site.email}">${site.email}</a>
      ${site.links.map((l) => `<a href="${l.href}" rel="noopener" target="_blank">${l.label} ↗</a>`).join('')}
    </div>
    <div class="site-footer__clock">
      <p class="label">Atelier</p>
      <p>${t(site.location.label)}<br>${t(site.location.coords)}</p>
      <p class="clock" data-clock data-tz="${site.location.timeZone}">--:--:--</p>
    </div>
  </div>
  <div class="site-footer__base">
    <p>© ${YEAR} ${site.name}</p>
    <div class="scalebar" aria-hidden="true"><span>0</span><i></i><span>1</span><i></i><span>5 m</span></div>
    <a href="#contenu" class="to-top">Retour en haut ↑</a>
  </div>
</footer>`;
}

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */

function sectionHead({ n, id, title, sub, count, label = 'Salle' }) {
  return `<header class="room-head" data-reveal>
    <p class="room-head__n${n === 'i' ? ' room-head__n--info' : ''}"><span>${label}</span><b${n === 'i' ? ' aria-label="information"' : ''}>${n}</b></p>
    <div class="room-head__text">
      <h2 class="room-head__title" id="${id}-titre">${t(title)}</h2>
      ${sub ? `<p class="room-head__sub">${t(sub)}</p>` : ''}
    </div>
    ${count ? `<p class="room-head__dim"><i></i><span>${t(count)}</span><i></i></p>` : ''}
  </header>`;
}

function homePage() {
  const base = '';
  const totalWorks = series.reduce((a, s) => a + s.works.length, 0);

  const hero = `<section class="hero" aria-label="Plan du musée — navigation">
    ${museum({ base, mode: 'hero' })}
    <div class="hero__title">
      <h1><span>Léonie</span> <span>Théberge</span></h1>
      <p class="hero__roles">${site.roles.map((r) => `<span>${t(r)}</span>`).join('')}</p>
    </div>
  </section>`;

  const intro = `<section class="statement" aria-label="Énoncé">
    <p class="label" data-reveal>Énoncé — Design</p>
    <blockquote class="statement__quote" data-reveal><p>${t(manifesto).replace('transformation', '<em>transformation</em>').replace('des personnes', 'des <em>personnes</em>').replace('l’environnement matériel', 'l’<em>environnement matériel</em>')}</p></blockquote>
    <dl class="facts" data-reveal>
      <div><dt>Expositions</dt><dd>${pad(exhibitions.length)}</dd></div>
      <div><dt>Objets</dt><dd>${pad(products.length)}</dd></div>
      <div><dt>Œuvres</dt><dd>${totalWorks}</dd></div>
      <div><dt>Depuis</dt><dd>2015</dd></div>
    </dl>
  </section>`;

  const expo = `<section class="room room--expo" id="expositions" aria-labelledby="expositions-titre">
    ${sectionHead({ n: '01', id: 'expositions', title: "Design d'expositions", sub: 'Scénographie, muséographie, signalétique — des musées nationaux aux parcs.', count: `${exhibitions.length} projets` })}
    <ol class="exlist" data-exlist>
      ${exhibitions.map((p, i) => `<li><a class="exlist__row" href="${projectPath({ ...p, room: 'expositions' })}" data-reveal>
        <span class="exlist__n">${pad(i + 1)}</span>
        <span class="exlist__title">${t(p.title)}</span>
        <span class="exlist__client">${t(p.client || '—')}</span>
        <span class="exlist__year">${years(p.year) || '—'}</span>
        <span class="exlist__arrow" aria-hidden="true">→</span>
        ${img(p.images[0].src, { base, alt: '', sizes: '(hover: hover) 360px, 96px', cls: 'exlist__img', max: 800 })}
      </a></li>`).join('')}
    </ol>
  </section>`;

  const prod = `<section class="room room--objets" id="objets" aria-labelledby="objets-titre">
    ${sectionHead({ n: '02', id: 'objets', title: 'Design de produits', sub: 'Objets, mobilier, outils et dispositifs — du concept au prototype.', count: `${products.length} projets` })}
    <ul class="cards">
      ${products.map((p, i) => `<li data-reveal style="--i:${i % 3}"><a class="card" href="${projectPath({ ...p, room: 'objets' })}" data-tilt>
        <span class="card__media">${img(p.images[0].src, { base, alt: altFor(p, p.images[0], 0), sizes: '(min-width: 1100px) 30vw, (min-width: 700px) 45vw, 92vw', max: 800 })}</span>
        <span class="card__plinth" aria-hidden="true"></span>
        <span class="card__cartel">
          <span class="card__n">02.${pad(i + 1)}</span>
          <span class="card__title">${t(p.title)}</span>
          <span class="card__meta">${years(p.year)}${p.client ? ` — ${t(p.client)}` : ''}</span>
        </span>
      </a></li>`).join('')}
    </ul>
  </section>`;

  const hang = [
    ['hiver-2016', 'Le Blues'], ['hiver-2019', 'Exploration no1'], ['hiver-2017', 'Introspection 1'], ['automne-2016', 'Matrice 1'],
    ['hiver-2018', 'Ode à la vulnérabilité 2'], ['hiver-2019', 'Exploration no6'], ['hiver-2016', 'Angoisse'],
  ].map(([s, w]) => ({ s, w: series.find((x) => x.slug === s).works.find((x) => x.title === w) }));
  const art = `<section class="room room--art" id="art" aria-labelledby="art-titre">
    ${sectionHead({ n: '03', id: 'art', title: 'Art', sub: 'Dessin, peinture, sculpture et photographie — 2015 à 2019.', count: `${totalWorks} œuvres` })}
    <div class="art-intro">
      <div class="art-intro__text" data-reveal>
        <blockquote class="art-quote"><p>${t(artQuote)}</p></blockquote>
        <p>${t(artStatement[3])}</p>
        <a class="btn" href="art/">Visiter la salle d’art <span aria-hidden="true">→</span></a>
      </div>
      <div class="salon" data-reveal>
        ${hang.map(({ s, w }, i) => `<a class="salon__item salon__item--${i + 1}" href="art/#${s}">${img(w.src, { base, alt: `${w.title}${w.details ? ` — ${w.details}` : ''}`, sizes: '(min-width: 900px) 22vw, 45vw', max: 800 })}<span class="salon__cartel">${t(w.title)}</span></a>`).join('')}
      </div>
    </div>
    <ol class="series-index">
      ${series.slice().reverse().map((s) => `<li data-reveal><a href="art/#${s.slug}"><span class="series-index__title">${t(s.title)}</span><span class="series-index__works">${t(s.works.slice(0, 3).map((w) => w.title).join(', '))}${s.works.length > 3 ? '…' : ''}</span><span class="series-index__count">${pad(s.works.length)}</span></a></li>`).join('')}
    </ol>
  </section>`;

  const cvRows = (rows) => rows.map((r) => `<li data-reveal><span class="cv__years">${t(r.years || '')}</span><span class="cv__what"><b>${t(r.title)}</b>${r.org ? `<span>${t(r.org)}</span>` : ''}${r.note ? `<small>${t(r.note)}</small>` : ''}</span>${r.href ? `<a class="cv__link" href="${r.href}" ${r.href.startsWith('http') ? 'target="_blank" rel="noopener"' : ''} aria-label="Voir : ${t(r.title)}">↗</a>` : ''}</li>`).join('');
  const about = `<section class="room room--about" id="a-propos" aria-labelledby="a-propos-titre">
    ${sectionHead({ n: '04', id: 'a-propos', title: 'À propos', sub: 'Parcours, formation et distinctions.' })}
    <div class="about">
      <figure class="about__portrait" data-reveal>
        ${img(site.portrait.src, { base, alt: site.portrait.alt, sizes: '(min-width: 900px) 28vw, 70vw', max: 800 })}
        <figcaption><b>${site.name}</b><span>Née en 1998 — ${t(site.location.label)}</span></figcaption>
      </figure>
      <div class="about__bio" data-reveal>
        <p class="about__lead">Scénographe au Musée canadien de l’histoire et au Musée canadien de la guerre — designer d’expositions, designer de produits et artiste.</p>
        ${bio.map((p) => `<p>${t(p)}</p>`).join('')}
        <p class="about__links"><a class="btn" href="${site.cvPdf}" target="_blank" rel="noopener">CV complet (PDF) <span aria-hidden="true">↗</span></a> <a class="btn btn--ghost" href="${site.links[0].href}" target="_blank" rel="noopener">LinkedIn <span aria-hidden="true">↗</span></a></p>
      </div>
    </div>
    <div class="cv">
      <div class="cv__col"><h3 class="label">Pratique professionnelle</h3><ol class="cv__list">${cvRows(cv.practice)}</ol>
        <h3 class="label">Formation</h3><ol class="cv__list">${cvRows(cv.education)}</ol></div>
      <div class="cv__col"><h3 class="label">Distinctions</h3><ol class="cv__list">${cvRows(cv.awards)}</ol>
        <h3 class="label">Expositions — art</h3><ol class="cv__list">${cvRows(cv.exhibitions)}</ol></div>
    </div>
  </section>`;

  const contact = `<section class="room room--contact" id="contact" aria-labelledby="contact-titre">
    ${sectionHead({ n: 'i', label: 'Accueil', id: 'contact', title: 'Contact', sub: 'Une exposition, un objet, une collaboration ?' })}
    <div class="contact" data-reveal>
      <a class="contact__mail" href="mailto:${site.email}">${site.email.replace('@', '<wbr>@')}</a>
      <div class="contact__actions">
        <button type="button" class="btn" data-copy="${site.email}"><span data-copy-label>Copier l’adresse</span></button>
        ${site.links.map((l) => `<a class="btn btn--ghost" href="${l.href}" target="_blank" rel="noopener">${l.label} <span aria-hidden="true">↗</span></a>`).join('')}
      </div>
    </div>
  </section>`;

  return layout({ base, page: 'home', body: hero + intro + expo + prod + art + about + contact, pathName: '' });
}

function projectPage(p, list, roomId) {
  const base = '../../';
  const room = roomOf(roomId);
  const i = list.indexOf(p);
  const prev = list[(i - 1 + list.length) % list.length];
  const next = list[(i + 1) % list.length];
  const cover = p.images[0];
  const meta = [
    ['Année', years(p.year)],
    [roomId === 'expositions' ? 'Client / lieu' : 'Partenaire', p.client],
    ['Cadre', p.context && p.context !== p.client ? p.context : ''],
    ['Mandat', p.mandate],
    ['Collaboration', p.collaborators],
    ['Distinction', p.award],
  ].filter(([, v]) => v);
  const gallery = p.images.slice(1);
  const body = `<article class="project">
    <header class="project__head">
      <nav class="crumbs" aria-label="Fil d’Ariane"><a href="${base}#${roomId}">Salle ${room.n} — ${room.name}</a><span aria-hidden="true">/</span><span>${pad(i + 1)} de ${pad(list.length)}</span></nav>
      <h1 class="project__title">${t(p.title)}</h1>
      ${p.client ? `<p class="project__client">${t(p.client)}</p>` : ''}
    </header>
    <figure class="project__cover" data-lightbox-group>
      <button type="button" class="zoomable" data-lightbox="0" aria-label="Agrandir l’image">${img(cover.src, { base, alt: altFor(p, cover, 0), sizes: '100vw', eager: true })}</button>
      ${cover.caption ? `<figcaption>${t(cover.caption)}</figcaption>` : ''}
    </figure>
    <div class="project__body">
      <dl class="project__meta">${meta.map(([k, v]) => `<div><dt>${k}</dt><dd>${t(v)}</dd></div>`).join('')}</dl>
      <div class="project__text">
        ${p.summary ? `<p class="project__lead">${t(p.summary)}</p>` : ''}
        ${(p.body || []).map((b) => `<p>${t(b)}</p>`).join('')}
        ${p.objectives ? `<h2 class="label">Objectifs</h2><p>${t(p.objectives)}</p>` : ''}
      </div>
    </div>
    ${gallery.length ? `<section class="gallery" aria-label="Images du projet" data-lightbox-group>
      ${gallery.map((g, k) => {
        const m = imgMeta(g.src);
        const shape = m.w / m.h > 1.25 ? 'wide' : m.w / m.h < 0.85 ? 'tall' : 'square';
        return `<figure class="gallery__item gallery__item--${shape}" data-reveal><button type="button" class="zoomable" data-lightbox="${k + 1}" aria-label="Agrandir l’image">${img(g.src, { base, alt: altFor(p, g, k + 1), sizes: shape === 'wide' ? '(min-width: 900px) 66vw, 100vw' : '(min-width: 900px) 33vw, 100vw' })}</button>${g.caption ? `<figcaption>${t(g.caption)}</figcaption>` : ''}</figure>`;
      }).join('')}
    </section>` : ''}
    <nav class="pager" aria-label="Projets voisins">
      <a class="pager__link pager__link--prev" href="${base}${projectPath({ ...prev, room: roomId })}"><span class="label">← Précédent</span><b>${t(prev.title)}</b></a>
      <a class="pager__room" href="${base}#${roomId}"><span class="label">Salle ${room.n}</span><b>${room.name}</b></a>
      <a class="pager__link pager__link--next" href="${base}${projectPath({ ...next, room: roomId })}"><span class="label">Suivant →</span><b>${t(next.title)}</b>${img(next.images[0].src, { base, alt: '', sizes: '240px', max: 400 })}</a>
    </nav>
  </article>
  ${lightbox()}`;
  const desc = p.summary || `${p.title}${p.client ? ` — ${p.client}` : ''}. ${room.title} par ${site.name}.`;
  return layout({ title: p.title, description: desc, base, body, page: 'project', here: roomId, image: cover.src, pathName: projectPath({ ...p, room: roomId }) });
}

function artPage() {
  const base = '../';
  const total = series.reduce((a, s) => a + s.works.length, 0);
  const body = `<article class="artpage">
    <header class="project__head artpage__head">
      <nav class="crumbs" aria-label="Fil d’Ariane"><a href="${base}#art">Salle 03 — Art</a><span aria-hidden="true">/</span><span>${total} œuvres</span></nav>
      <h1 class="project__title">Art</h1>
      <p class="project__client">Œuvres 2015 — 2019</p>
    </header>
    <section class="statement-art" aria-labelledby="demarche">
      <h2 class="label" id="demarche">Démarche artistique</h2>
      <blockquote class="art-quote art-quote--xl" data-reveal><p>${t(artQuote)}</p></blockquote>
      <div class="statement-art__cols">${artStatement.map((p) => `<p data-reveal>${t(p)}</p>`).join('')}</div>
    </section>
    <nav class="series-nav" aria-label="Séries">${series.map((s) => `<a href="#${s.slug}">${t(s.title)} <sup>${s.works.length}</sup></a>`).join('')}</nav>
    <div data-lightbox-group>
    ${(() => {
      let k = 0;
      return series.map((s) => `<section class="series" id="${s.slug}" aria-labelledby="${s.slug}-t">
        <header class="series__head" data-reveal><h2 id="${s.slug}-t">${t(s.title)}</h2><p class="room-head__dim"><i></i><span>${s.works.length} œuvre${s.works.length > 1 ? 's' : ''}</span><i></i></p></header>
        <div class="series__grid">
          ${s.works.map((w, wi) => `<figure class="work" id="${s.slug}-${workSlug(w.title)}${s.works.findIndex((x) => x.title === w.title) === wi ? '' : `-${wi + 1}`}" data-reveal><button type="button" class="zoomable" data-lightbox="${k++}" aria-label="Agrandir : ${t(w.title)}">${img(w.src, { base, alt: `${w.title}${w.details ? ` — ${w.details}` : ''}`, sizes: '(min-width: 1100px) 30vw, (min-width: 700px) 45vw, 92vw', max: 800 })}</button>
            <figcaption class="work__cartel"><b>${t(w.title)}</b>${w.details ? `<span>${t(w.details)}</span>` : ''}</figcaption></figure>`).join('')}
        </div>
      </section>`).join('');
    })()}
    </div>
    <section class="heko">
      <details>
        <summary><span class="label">Collectif — ${hekoManifesto.year}</span><b>${t(hekoManifesto.title)}</b><span class="heko__toggle" aria-hidden="true">+</span></summary>
        <div class="heko__body">${hekoManifesto.paragraphs.map((p) => `<p>${t(p)}</p>`).join('')}<p class="heko__members">${hekoManifesto.members.map(t).join(' · ')}</p></div>
      </details>
    </section>
    <nav class="pager" aria-label="Autres salles">
      <a class="pager__link pager__link--prev" href="${base}#objets"><span class="label">← Salle 02</span><b>Objets</b></a>
      <a class="pager__room" href="${base}"><span class="label">Plan</span><b>Musée</b></a>
      <a class="pager__link pager__link--next" href="${base}#a-propos"><span class="label">Salle 04 →</span><b>À propos</b></a>
    </nav>
  </article>
  ${lightbox()}`;
  return layout({ title: 'Art', description: `Œuvres de ${site.name} (2015-2019) : dessin, peinture, sculpture, photographie. ${artQuote}`, base, body, page: 'art', here: 'art', image: series[7].works[0].src, pathName: 'art/' });
}

function lightbox() {
  return `<dialog class="lightbox" data-lightbox-dialog aria-label="Visionneuse">
    <figure class="lightbox__figure"><img alt="" data-lb-img><figcaption data-lb-cap></figcaption></figure>
    <button type="button" class="lightbox__btn lightbox__btn--prev" data-lb-prev aria-label="Image précédente">←</button>
    <button type="button" class="lightbox__btn lightbox__btn--next" data-lb-next aria-label="Image suivante">→</button>
    <button type="button" class="btn-close lightbox__close" data-close-dialog>Fermer <span aria-hidden="true">✕</span></button>
    <p class="lightbox__count" data-lb-count></p>
  </dialog>`;
}

function notFound() {
  // Chemins absolus : la page 404 peut être servie à n'importe quelle profondeur.
  const base = '/';
  const body = `<section class="notfound">
    <p class="label">Erreur 404 — salle introuvable</p>
    <h1 class="project__title">Cette salle est fermée</h1>
    <p>La page demandée n’existe pas ou a été déplacée. Le plan du musée vous ramènera en terrain connu.</p>
    <p><a class="btn" href="${base}">Retour au plan du musée <span aria-hidden="true">→</span></a></p>
  </section>`;
  return layout({ title: 'Page introuvable', base, body, page: 'notfound' });
}

/* ------------------------------------------------------------------ */
/* Écriture                                                            */
/* ------------------------------------------------------------------ */

async function write(rel, html) {
  const file = path.join(OUT, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html);
}

async function copyStatic() {
  for (const dir of ['css', 'js', 'fonts']) {
    await rm(path.join(OUT, dir), { recursive: true, force: true });
    await cp(path.join(ROOT, 'src', dir), path.join(OUT, dir), { recursive: true });
  }
  for (const f of await readdir(path.join(ROOT, 'src', 'img'))) await cp(path.join(ROOT, 'src', 'img', f), path.join(OUT, 'img', f));
  for (const f of ['robots.txt', '_headers']) await cp(path.join(ROOT, 'src', f), path.join(OUT, f)).catch(() => {});
}

async function main() {
  // Nettoie les anciennes pages (garde public/img)
  for (const dir of ['expositions', 'objets', 'art']) await rm(path.join(OUT, dir), { recursive: true, force: true });
  await copyStatic();
  await write('index.html', homePage());
  await write('art/index.html', artPage());
  for (const p of exhibitions) await write(`expositions/${p.slug}/index.html`, projectPage(p, exhibitions, 'expositions'));
  for (const p of products) await write(`objets/${p.slug}/index.html`, projectPage(p, products, 'objets'));
  await write('404.html', notFound());
  const pages = 3 + exhibitions.length + products.length;
  console.log(`✓ ${pages} pages → public/`);
}

main();
