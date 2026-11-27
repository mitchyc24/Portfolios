# Léonie Théberge — portfolio

Site statique (français) pour Léonie Théberge : designer d'expositions, scénographe,
designer de produits et artiste. Il réunit ses deux anciens sites Wix
(`leonietheberge.wixsite.com/design` et `/artiste`) en un seul portfolio.

**Concept — le musée.** La navigation principale est une maquette CSS 3D d'un petit
musée : chaque salle correspond à une section du portfolio (01 Expositions,
02 Objets, 03 Art, 04 À propos) autour du hall d’accueil (pictogramme « i », contact). On peut passer de la vue
**Plan** à l'**Axonométrie** puis à la **Perspective** (les trois dessins du
scénographe), tourner la maquette au glisser et cliquer une salle pour s'en
approcher. Au premier chargement, un court « montage de l'exposition » élève les
murs à partir du plan. L'esthétique s'inspire de sanrita.ca : typographie condensée,
étiquettes en chasse fixe, palette plâtre/calque/graphite avec un accent vermillon
tiré de ses toiles.

## Performance

- Aucun framework, aucune bibliothèque 3D : la maquette est du HTML/CSS généré au build.
  La caméra anime uniquement `transform` (composité par le GPU) ; ~4,5 ko de JS gzippé.
- Images WebP responsives (240/400/800/1440 px) avec `srcset`, chargement différé
  et couleur dominante en attendant l'image. Polices auto-hébergées et sous-ensemblées
  (~87 ko au total, deux préchargées).
- Tout est amélioration progressive : sans JS, la maquette et les liens fonctionnent ;
  `prefers-reduced-motion` coupe les animations.

## Typographie

Le build applique la typographie française (usage québécois) aux textes de `content/` :
apostrophes courbes, espaces insécables (avant « : », dans les guillemets, avant un tiret),
espace fine avant « ; ! ? », ordinaux et « no » en exposant (`50e` → 50ᵉ, `no1` → nᵒ 1),
dimensions des œuvres (`1.5x2pi` → 1,5 × 2 pi) et intervalles d'années (2021–2022).
On écrit donc le contenu simplement, sans caractères spéciaux.

Trois règles à respecter si l'on touche au CSS ou au gabarit :

- **Interlignage des titres en capitales** : au moins 1,06. Dans Big Shoulders Display,
  l'accent d'une capitale (É, À, Ô) monte à 0,98 em ; en dessous, il touche la ligne du dessus.
- **Uniquement des caractères présents dans les polices** (sous-ensemble latin). Les flèches et
  la croix sont des SVG (`icon()` dans `scripts/build.mjs`), pas des caractères Unicode, qui
  seraient rendus par une police système différente sur chaque appareil.
- **DM Mono n'existe qu'en 400 et 500**, Instrument Serif qu'en italique : pas de gras au-delà.

## Structure

```
content/      Textes et données (à modifier ici)
  site.mjs      bio, CV, contact, démarche artistique, manifeste Hêkó
  projects.mjs  projets d'exposition et de design de produits
  art.mjs       séries d'œuvres (2015 — 2019)
  images.json   généré par « npm run images » (ne pas éditer)
scripts/
  images.mjs    télécharge/optimise les images → public/img
  build.mjs     génère toutes les pages HTML → public/
  museum.mjs    la maquette 3D (murs, salles, socles, accrochage)
  serve.mjs     serveur local de prévisualisation
src/          CSS, JS, polices, monogramme (copiés dans public/)
public/       LE SITE À DÉPLOYER (généré, versionné pour un déploiement sans build)
```

## Utilisation

Prérequis : Node 20+.

```bash
npm install        # installe sharp (optimisation d'images)
npm run images     # seulement si des images ont été ajoutées/modifiées
npm run build      # régénère public/
npm run serve      # http://localhost:4321
```

### Ajouter ou modifier un projet

1. Éditer `content/projects.mjs` (ou `art.mjs` pour une œuvre).
2. Images : soit une image de l'ancien Wix (`"src": "wix:27ae81_…~mv2.jpg"`), soit un
   fichier local déposé dans `assets/` (`"src": "assets/mon-projet-01.jpg"`).
   La première image d'un projet sert de couverture.
3. `npm run images && npm run build`.

Pour changer ce qui est accroché dans la maquette (quelles images sur quels murs),
voir `scripts/museum.mjs` (`northArt`, `westArt`, `plinths`…).

## Déploiement

En ligne : **https://leonie-theberge.netlify.app** (projet Netlify `leonie-theberge`).
`netlify.toml` publie `public/` tel quel, sans étape de build. Le projet n'est pas relié
à Git : après un `npm run build`, redéployer avec la CLI Netlify depuis ce dossier.

```bash
npx netlify-cli deploy --prod --dir=public --site=leonie-theberge
```

Pour des déploiements automatiques à chaque push, relier le dépôt dans Netlify
(répertoire de base : `leonie-theberge`).

`public/` est un site statique autonome : Netlify, Cloudflare Pages, GitHub Pages,
ou n'importe quel hébergement. Les liens internes sont relatifs (le site fonctionne
aussi dans un sous-dossier), sauf la page `404.html` qui suppose un déploiement à la
racine du domaine. Renseigner `site.url` dans `content/site.mjs` une fois le domaine
connu (balises canonical et Open Graph, `sitemap.xml`, `robots.txt`).

## À compléter / vérifier avec Léonie

- **Outside the Lines** : seul le titre et une photo existaient sur l'ancien site ;
  ajouter client, année et description dans `content/projects.mjs`.
- Les projets *Le grand voyage des marchandises*, *Parc Cartier-Brébeuf*, *50e* et
  *Pandémies* n'avaient pas de texte descriptif.
- La dernière phrase de la biographie (passage vers la muséographie) a été rédigée à
  partir de son CV — à valider.
- Le lien « CV complet (PDF) » pointe encore vers le fichier hébergé par Wix ;
  le copier dans `src/` si le compte Wix est fermé.
- Coquilles corrigées au passage : « beaux-arts », « identité », « spatio-temporel »,
  « Parcs Canada », « Jean-Pierre Raynaud », « siliconée », « non pharmacologique »,
  « vivre-ensemble », « encre de Chine », « (version mobile) ».
- Légendes à relire : « Banc_no1 » à « Banc_no3 » (Charlie) ressemblent à des noms de fichier ;
  « Wall Planter » (légende) et « Wallplanter » (titre) ; « Passeport de marche (endo) ». L'exposition « Atelier Artkane 21
  (en préparation) » de 2019 a été retirée du CV faute de confirmation.

## Crédits

Polices sous licence SIL OFL : Big Shoulders Display, DM Mono, Instrument Serif.
Monogramme : vectorisation du monogramme à l'encre de Léonie.
