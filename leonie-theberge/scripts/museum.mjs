// Le musée isométrique : maquette CSS 3D servant de navigation.
//
// Tout est rendu en HTML statique au moment du build (aucune construction
// côté client). Repère : X vers l'est, Y vers le sud, Z vers le haut ; une
// unité (« u ») vaut var(--u) pixels. Chaque volume (.b) n'a que les faces
// visibles depuis la caméra (dessus, sud, est), ce qui garde le DOM léger.

export const WORLD = { w: 88, d: 80 };
const H = 14; // murs extérieurs (cimaises)
const LOW = 2.4; // cloisons intérieures « coupées » (axonométrie en coupe)

export const rooms = [
  {
    id: 'expositions', n: '01', name: 'Expositions', title: "Design d'expositions & scénographie",
    rect: [1, 1, 39, 29], node: [14, 12], door: [35.5, 30.5],
    blurb: 'Musées, parcs et institutions : idéation muséographique, plans, élévations, modélisation, suivi de fabrication et installation.',
  },
  {
    id: 'objets', n: '02', name: 'Objets', title: 'Design de produits',
    rect: [41, 1, 46, 29], node: [54, 16.5], door: [60, 30.5],
    blurb: "Objets, mobilier et outils — du concept au prototype, pour des partenaires et à l'École de design de l'Université Laval.",
  },
  {
    id: 'art', n: '03', name: 'Art', title: 'Œuvres 2015 — 2019',
    rect: [1, 31, 29, 27], node: [16, 40], door: [30.5, 44],
    blurb: "Dessin, peinture, sculpture et photographie : l'abstraction comme exutoire, la fragilité comme matière.",
  },
  {
    id: 'a-propos', n: '04', name: 'À propos', title: 'Parcours & CV',
    rect: [1, 59, 29, 20], node: [16, 63], door: [30.5, 69],
    blurb: "Scénographe au Musée canadien de l'histoire et au Musée canadien de la guerre. Formée en design de produits et en arts visuels.",
  },
  {
    // L'accueil n'est pas une salle numérotée : signalé par le pictogramme « i » (information).
    id: 'contact', n: 'i', name: 'Accueil', title: 'Contact',
    rect: [31, 31, 56, 48], node: [74.5, 69.5], door: null,
    blurb: 'Une exposition, un objet, une collaboration ? Écrivez-moi.',
  },
];

const HUB = [50, 52];

/** « Salle 01 » … ou « Accueil » pour le hall. */
export const roomLabel = (r) => (r.id === 'contact' ? 'Accueil' : `Salle ${r.n}`);

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

const n = (v) => +v.toFixed(2);
const attrs = (o) => Object.entries(o).filter(([, v]) => v !== undefined && v !== false && v !== null).map(([k, v]) => (v === true ? k : `${k}="${v}"`)).join(' ');

function box({ x, y, l, d, h, z = 0, cls = '', room, top = '', s = '', e = '', delay }) {
  const style = `--x:${n(x)};--y:${n(y)};--l:${n(l)};--d:${n(d)};--h:${n(h)}${z ? `;--z:${n(z)}` : ''};--dl:${delay ?? n(((x + y) / (WORLD.w + WORLD.d)) * 0.5)}s`;
  return `<div class="b ${cls}" ${attrs({ 'data-room': room, style })}><i class="f t">${top}</i><i class="f s">${s}</i><i class="f e">${e}</i></div>`;
}

// Œuvre/image accrochée sur une face : coordonnées locales à la face (unités).
function piece({ left, top, w, h, img, href, room, frame = '', label = '' }) {
  const style = `--al:${n(left)};--at:${n(top)};--aw:${n(w)};--ah:${n(h)}`;
  const inner = img ? img(w) : '';
  const tag = href ? 'a' : 'span';
  return `<${tag} class="m-piece ${frame}" ${attrs({ href, 'data-room': room, tabindex: href ? '-1' : undefined, 'aria-hidden': 'true', style, 'data-label': label || undefined })}>${inner}</${tag}>`;
}

/* ------------------------------------------------------------------ */
/* Scène                                                               */
/* ------------------------------------------------------------------ */

/**
 * @param {object} ctx
 *  - thumb(ref, widthUnits) -> <img> html (ref = { project, index } | { work })
 *  - href(ref) -> url
 *  - roomHref(room) -> url
 *  - here: id de la salle « Vous êtes ici » (facultatif)
 *  - monogram: url du monogramme
 *  - a(texte) -> texte typographié et échappé pour un attribut
 */
export function renderMuseum(ctx) {
  const parts = [];
  const img = (ref) => (w) => ctx.thumb(ref, w);

  // Murs extérieurs (hauts) -------------------------------------------
  // Mur nord : face sud visible, porte les œuvres des salles 01 et 02.
  const north = { x: 0, y: 0, l: WORLD.w, d: 1, h: H };
  const northArt = [
    // Salle 01 — expositions
    { x: 3, w: 11, z: 3, h: 7.4, ref: { project: 'retro', index: 0 }, room: 'expositions' },
    { x: 15.5, w: 11, z: 3, h: 7.4, ref: { project: 'outside-the-lines', index: 0 }, room: 'expositions' },
    { x: 28, w: 10.5, z: 3, h: 7.4, ref: { project: 'sorties-des-rangs', index: 3 }, room: 'expositions' },
    // Salle 02 — objets
    { x: 44, w: 11, z: 3.5, h: 7.4, ref: { project: 'temple', index: 0 }, room: 'objets' },
    { x: 57.5, w: 9, z: 3.5, h: 7.4, ref: { project: 'brume', index: 0 }, room: 'objets' },
    { x: 69, w: 11, z: 3.5, h: 7.4, ref: { project: 'fiskars', index: 0 }, room: 'objets' },
  ];
  parts.push(box({
    ...north, cls: 'wall wall--outer', delay: 0,
    s: northArt.map((a) => piece({ left: a.x - north.x, top: north.h - a.z - a.h, w: a.w, h: a.h, img: img(a.ref), href: ctx.href(a.ref), room: a.room })).join(''),
  }));

  // Mur ouest : face est visible (gauche = extrémité sud).
  const west = { x: 0, y: 1, l: 1, d: WORLD.d - 1, h: H };
  const onWest = (y0, w) => west.y + west.d - y0 - w; // y0 = début (nord) de l'œuvre
  const westArt = [
    { y: 3.5, w: 10.5, z: 3, h: 7.2, ref: { project: 'pandemies', index: 0 }, room: 'expositions' },
    { y: 16.5, w: 10.5, z: 3, h: 7.2, ref: { project: 'alcove-ecole', index: 0 }, room: 'expositions' },
    { y: 33, w: 7, z: 3.4, h: 7, ref: { work: ['hiver-2016', 'Le Blues'] }, room: 'art', frame: 'm-piece--frame' },
    { y: 42.2, w: 4.6, z: 3.4, h: 7, ref: { work: ['hiver-2017', 'Introspection 3'] }, room: 'art', frame: 'm-piece--frame' },
    { y: 49.6, w: 4.6, z: 3.4, h: 7, ref: { work: ['hiver-2018', 'Ode à la vulnérabilité 1'] }, room: 'art', frame: 'm-piece--frame' },
    { y: 61.5, w: 6, z: 4, h: 6.2, ref: { portrait: true }, room: 'a-propos', frame: 'm-piece--frame' },
  ];
  parts.push(box({
    ...west, cls: 'wall wall--outer', delay: 0,
    e: westArt.map((a) => piece({ left: onWest(a.y, a.w), top: west.h - a.z - a.h, w: a.w, h: a.h, img: img(a.ref), href: ctx.href(a.ref), room: a.room, frame: a.frame })).join('') +
      // Feuille de CV (salle 04)
      `<span class="m-piece m-cv" data-room="a-propos" aria-hidden="true" style="--al:${onWest(70, 5.5)};--at:${H - 9.6};--aw:5.5;--ah:6.6"><b>CV</b><i></i><i></i><i></i><i></i><i></i></span>`,
  }));

  // Murs avant bas (coupés) + entrée au sud-est -------------------------
  parts.push(box({ x: 1, y: WORLD.d - 1, l: 69, d: 1, h: 2.2, cls: 'wall wall--low' }));
  parts.push(box({ x: WORLD.w - 1, y: 1, l: 1, d: 62, h: 2.2, cls: 'wall wall--low' }));

  // Cloisons intérieures ---------------------------------------------
  const walls = [
    // 01 | 02 (porte y 11–19)
    [40, 1, 1, 10], [40, 19, 1, 11],
    // 01 & 03 : cloison sud de la salle 01 / nord de la salle 03 (01 ouverte sur le hall entre x 31–40)
    [1, 30, 30, 1],
    // 02 : cloison sud (porte x 56–64)
    [40, 30, 16, 1], [64, 30, 23, 1],
    // 03 : cloison est (porte y 40–48)
    [30, 31, 1, 9], [30, 48, 1, 10],
    // 03 | 04 (porte x 12–18)
    [1, 58, 11, 1], [18, 58, 13, 1],
    // 04 : cloison est (porte y 66–72)
    [30, 59, 1, 7], [30, 72, 1, 7],
  ];
  for (const [x, y, l, d] of walls) parts.push(box({ x, y, l, d, h: LOW, cls: 'wall wall--part' }));

  // Salle 01 : panneaux autoportants + table-maquette -----------------
  const panel = (x, y, ref, delay) => box({
    x, y, l: 10, d: 0.7, h: 8, cls: 'panel', room: 'expositions', delay,
    s: piece({ left: 0.6, top: 0.6, w: 8.8, h: 5.9, img: img(ref), href: ctx.href(ref), room: 'expositions' }) + '<span class="m-caption" aria-hidden="true"></span>',
  });
  parts.push(panel(6, 18.6, { project: 'port-de-quebec', index: 0 }, 0.25));
  parts.push(panel(21, 22.6, { project: 'conseil-du-statut-de-la-femme', index: 0 }, 0.3));
  const aq = { project: 'aquatica', index: 0 };
  parts.push(box({
    x: 31, y: 8, l: 7, d: 6, h: 3.4, cls: 'plinth', room: 'expositions', delay: 0.3,
    top: piece({ left: 0.4, top: 0.4, w: 6.2, h: 5.2, img: img(aq), href: ctx.href(aq), room: 'expositions' }),
  }));

  // Salle 02 : socles (images vues du dessus, comme une vitrine) -------
  const plinths = [
    [45, 9, 'charlie', 0], [57, 9, 'exa', 0], [69, 9, 'onx', 0],
    [45, 19, 'suar', 0], [57, 19, 'pomodoro', 0], [69, 19, 'deux-tiers', 0],
  ];
  for (const [x, y, project, index] of plinths) {
    const ref = { project, index };
    parts.push(box({
      x, y, l: 6, d: 6, h: 3.4, cls: 'plinth', room: 'objets', delay: n(0.25 + (x - 45) / 120 + (y - 9) / 80),
      top: piece({ left: 0.5, top: 0.5, w: 5, h: 5, img: img(ref), href: ctx.href(ref), room: 'objets' }),
      s: '<span class="m-label" aria-hidden="true"></span>',
    }));
  }

  // Salle 03 : cimaise centrale + banc --------------------------------
  const cim = { x: 7, y: 44.5, l: 15, d: 0.8, h: 6.4 };
  const cimArt = [['hiver-2019', 'Exploration no1'], ['hiver-2019', 'Exploration no5'], ['hiver-2019', 'Exploration no2']];
  parts.push(box({
    ...cim, cls: 'panel panel--cimaise', room: 'art', delay: 0.35,
    s: cimArt.map((w, i) => piece({ left: 1.2 + i * 4.6, top: 1.4, w: 3.6, h: 3.6, img: img({ work: w }), href: ctx.href({ work: w }), room: 'art', frame: 'm-piece--frame' })).join(''),
  }));
  parts.push(box({ x: 10, y: 50.5, l: 9, d: 2.2, h: 1.4, cls: 'bench', room: 'art' }));

  // Salle 04 : table + maquette d'étude --------------------------------
  parts.push(box({ x: 8, y: 66, l: 14, d: 6, h: 3, cls: 'table', room: 'a-propos', top: '<span class="m-paper" style="--al:1;--at:1.2;--aw:3.4;--ah:4.4;--rot:-8deg"></span><span class="m-paper" style="--al:9.4;--at:1;--aw:3.4;--ah:4.4;--rot:6deg"></span>' }));
  parts.push(box({ x: 13, y: 67.2, l: 2.4, d: 2, h: 1.6, z: 3, cls: 'model', room: 'a-propos', delay: 0.6 }));
  parts.push(box({ x: 15.6, y: 67.2, l: 1.6, d: 3.6, h: 1, z: 3, cls: 'model', room: 'a-propos', delay: 0.65 }));
  parts.push(box({ x: 13, y: 69.4, l: 2.4, d: 1.4, h: 0.6, z: 3, cls: 'model', room: 'a-propos', delay: 0.7 }));

  // Hall : accueil, totem signalétique, banc --------------------------
  const contactHref = ctx.roomHref(rooms.find((r) => r.id === 'contact'));
  parts.push(box({
    x: 68, y: 64, l: 13, d: 3, h: 3.2, cls: 'desk', room: 'contact', delay: 0.4,
    s: `<a class="m-desk" href="${contactHref}" tabindex="-1" aria-hidden="true" data-room="contact">Accueil<small>Contact</small></a>`,
  }));
  parts.push(box({
    x: 43, y: 36, l: 5.6, d: 0.7, h: 9.5, cls: 'totem', room: 'contact', delay: 0.45,
    s: `<span class="m-totem" aria-hidden="true">${rooms.slice(0, 4).map((r) => `<b>${r.n}</b><span>${r.name}</span>`).join('')}</span>`,
  }));
  parts.push(box({ x: 52, y: 71, l: 9, d: 2.2, h: 1.4, cls: 'bench', room: 'contact' }));

  /* -- Sol : plan, salles, circulation ------------------------------- */
  const floorRooms = rooms.map((r) => {
    const [x, y, l, d] = r.rect;
    const href = ctx.roomHref(r);
    return `<a class="m-room" href="${href}" data-room="${r.id}" style="--x:${x};--y:${y};--l:${l};--d:${d}" aria-label="${ctx.a(r.id === 'contact' ? 'Accueil — Contact' : `${roomLabel(r)} — ${r.name} : ${r.title}`)}"><span class="m-room__label"><b>${r.n}</b>${r.name}</span></a>`;
  }).join('');

  // Diagramme de circulation : du hall vers chaque salle (passe par la porte).
  const spokes = rooms.map((r) => {
    const pts = r.door ? [HUB, r.door, r.node] : [HUB, r.node];
    return `<path data-room="${r.id}" d="${roundedPath(pts, 3)}"/>`;
  }).join('');
  const nodes = rooms.map((r) => `<g data-room="${r.id}" transform="translate(${r.node[0]} ${r.node[1]})"><circle r="1.5"/><circle class="m-node-in" r=".55"/></g>`).join('');

  const svg = `<svg class="m-paths" viewBox="0 0 ${WORLD.w} ${WORLD.d}" preserveAspectRatio="none" aria-hidden="true">
    <g class="m-spokes">${spokes}</g>
    <g class="m-nodes">${nodes}<g class="m-hub" transform="translate(${HUB[0]} ${HUB[1]})"><circle r="1.1"/></g></g>
    <g class="m-entry" transform="translate(80 76.5)"><path d="M-3 0h6M1 -2l2 2-2 2"/></g>
  </svg>`;

  const here = ctx.here ? rooms.find((r) => r.id === ctx.here) : null;
  const herePos = here ? here.node : [83, 73];
  const hereMarker = `<span class="m-here" style="--x:${herePos[0]};--y:${herePos[1]}" aria-hidden="true"><i></i><span>Vous êtes ici</span></span>`;

  const pins = rooms.map((r) => `<a class="m-pin" href="${ctx.roomHref(r)}" data-room="${r.id}" tabindex="-1" aria-hidden="true" style="--x:${r.node[0]};--y:${r.node[1]}"><span class="m-pin__pole"><i></i><i></i></span><span class="m-pin__sign"><b>${r.n}</b><span>${r.name}</span></span></a>`).join('');

  const world = `<div class="m-world">
    <div class="m-floor" aria-hidden="true"><span class="m-mono"></span><span class="m-entry-label">Entrée</span></div>
    ${floorRooms}
    ${svg}
    ${hereMarker}
    ${parts.join('\n')}
    ${pins}
  </div>`;
  return world;
}

// Polyligne aux angles arrondis (unités du plan)
function roundedPath(pts, r) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    const l1 = Math.hypot(x1 - x0, y1 - y0), l2 = Math.hypot(x2 - x1, y2 - y1);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const ax = x1 - ((x1 - x0) / l1) * rr, ay = y1 - ((y1 - y0) / l1) * rr;
    const bx = x1 + ((x2 - x1) / l2) * rr, by = y1 + ((y2 - y1) / l2) * rr;
    d += ` L${n(ax)} ${n(ay)} Q${x1} ${y1} ${n(bx)} ${n(by)}`;
  }
  const last = pts[pts.length - 1];
  return d + ` L${last[0]} ${last[1]}`;
}
