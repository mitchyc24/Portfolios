// Prépare les images du site : téléchargement (Wix) ou lecture locale, puis
// génération de versions WebP responsives + couleur dominante (placeholder).
//
//   npm run images
//
// Les sources « wix:<id> » sont téléchargées une seule fois dans .cache/ ;
// les chemins locaux (p. ex. « assets/photo.jpg ») sont lus tels quels.
// Résultat : public/img/*.webp et content/images.json (lu par build.mjs).

import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { exhibitions, products } from '../content/projects.mjs';
import { series } from '../content/art.mjs';
import { site } from '../content/site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, '.cache', 'sources');
const OUT = path.join(ROOT, 'public', 'img');
const MANIFEST = path.join(ROOT, 'content', 'images.json');

export const WIDTHS = [240, 400, 800, 1440];
const QUALITY = 70;
const CONCURRENCY = 4;
const FORCE = process.argv.includes('--force');

const exists = (p) => access(p).then(() => true, () => false);

function collectSources() {
  const set = new Set();
  for (const p of [...exhibitions, ...products]) p.images.forEach((i) => set.add(i.src));
  for (const s of series) s.works.forEach((w) => set.add(w.src));
  set.add(site.portrait.src);
  return [...set];
}

// Couvertures : on ajoute un aperçu de partage JPEG 1200×630 (Open Graph ; WebP n'est pas lu partout).
const OG = new Set([...exhibitions, ...products].map((p) => p.images[0].src).concat(series.at(-1).works[0].src));

async function ensureOg(src, id) {
  const file = `img/og-${id}.jpg`;
  if (FORCE || !(await exists(path.join(ROOT, 'public', file)))) {
    await sharp(await sourceFile(src), { failOn: 'none' }).rotate()
      .resize(1200, 630, { fit: 'cover', position: sharp.strategy.attention })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 78, mozjpeg: true })
      .toFile(path.join(ROOT, 'public', file));
  }
  return file;
}

function idFor(src) {
  if (src.startsWith('wix:')) return src.slice(4).split('~')[0].replace(/^27ae81_/, '').slice(0, 12);
  const base = path.basename(src).replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${base}-${createHash('sha1').update(src).digest('hex').slice(0, 6)}`;
}

async function sourceFile(src) {
  if (!src.startsWith('wix:')) return path.join(ROOT, src);
  const media = src.slice(4);
  const ext = path.extname(media) || '.jpg';
  const file = path.join(CACHE, media.split('~')[0] + ext);
  if (await exists(file)) return file;
  // « fit » limite la taille téléchargée (certains originaux font 15 000 px).
  const url = `https://static.wixstatic.com/media/${media}/v1/fit/w_2400,h_2400,q_90/file${ext}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  await mkdir(CACHE, { recursive: true });
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  return file;
}

async function processOne(src, previous) {
  const id = idFor(src);
  const input = await sourceFile(src);
  const prev = previous[src];
  const files = Object.fromEntries(WIDTHS.map((w) => [w, `img/${id}-${w}.webp`]));
  // Déjà traitée ? (relancer avec --force après avoir remplacé un fichier local)
  if (!FORCE && prev && (await Promise.all(Object.values(prev.files).map((f) => exists(path.join(ROOT, 'public', f))))).every(Boolean)) {
    const { og, ...rest } = prev;
    return [src, OG.has(src) ? { ...rest, og: await ensureOg(src, id) } : rest];
  }
  const img = sharp(input, { failOn: 'none' }).rotate();
  const meta = await img.metadata();
  const w0 = meta.autoOrient?.width ?? meta.width;
  const h0 = meta.autoOrient?.height ?? meta.height;
  const { dominant } = await sharp(input).rotate().resize(32).stats();
  const color = '#' + [dominant.r, dominant.g, dominant.b].map((c) => c.toString(16).padStart(2, '0')).join('');
  const out = {};
  for (const w of WIDTHS) {
    const width = Math.min(w, w0);
    await img
      .clone()
      .resize({ width, withoutEnlargement: true })
      .flatten(meta.hasAlpha ? { background: '#ffffff' } : false)
      .webp({ quality: QUALITY, effort: 5, smartSubsample: true })
      .toFile(path.join(ROOT, 'public', files[w]));
    out[w] = files[w];
  }
  const entry = { w: w0, h: h0, color, files: out };
  if (OG.has(src)) entry.og = await ensureOg(src, id);
  return [src, entry];
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const previous = (await exists(MANIFEST)) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : {};
  const sources = collectSources();
  const results = {};
  let done = 0;
  const queue = [...sources];
  const worker = async () => {
    while (queue.length) {
      const src = queue.shift();
      try {
        const [k, v] = await processOne(src, previous);
        results[k] = v;
      } catch (e) {
        console.warn(`⚠︎ ${src} : ${e.message}`);
      }
      done++;
      if (done % 20 === 0 || done === sources.length) console.log(`${done}/${sources.length}`);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const sorted = Object.fromEntries(Object.keys(results).sort().map((k) => [k, results[k]]));
  await writeFile(MANIFEST, JSON.stringify(sorted, null, 1) + '\n');
  console.log(`✓ ${Object.keys(results).length} images → public/img, content/images.json`);
}

main();
