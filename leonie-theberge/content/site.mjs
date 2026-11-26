// Informations générales : identité, textes, CV et coordonnées.
// Textes repris des anciens sites Wix (design + artiste).

export const site = {
  name: 'Léonie Théberge',
  url: '', // domaine final, p. ex. 'https://leonietheberge.com' (sert aux balises canonical / Open Graph)
  lang: 'fr-CA',
  description:
    "Léonie Théberge — designer d'expositions, scénographe, designer de produits et artiste basée au Québec. Muséographie, scénographie et design de produits.",
  roles: ["Designer d'expositions", 'Scénographe', 'Designer de produits', 'Artiste'],
  location: { label: 'Québec, Canada', coords: '46.81° N — 71.21° O', timeZone: 'America/Toronto' },
  email: 'leonietheberge@gmail.com',
  links: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/l%C3%A9onie-th%C3%A9berge-518a3a155/' },
    { label: 'Facebook (art)', href: 'https://www.facebook.com/thebergeart/' },
  ],
  cvPdf: 'https://27e91818-34e7-4403-a535-0341ae0e8c45.filesusr.com/ugd/27ae81_75b9d4a4ba004d658974e0b7c4b31583.pdf',
  portrait: { src: 'wix:27ae81_d99ba63cf944452fa9e74512ca4a1c58~mv2.jpg', alt: 'Portrait de Léonie Théberge' },
};

// Citation d'accueil (site design)
export const manifesto =
  "Le design s'établit sur une culture de transformation et d'amélioration des problématiques de la société actuelle qui se situent à l'intersection des personnes et de l'environnement matériel.";

// Biographie (site artiste, légèrement condensée en paragraphes)
export const bio = [
  "Née en 1998, Léonie Théberge démontra très tôt une grande curiosité pour la créativité. Elle débuta plus sérieusement sa pratique artistique par la photographie comme premier moyen d'expression alors qu'elle était adolescente, puis compléta le DEC en arts visuels au Cégep de Sainte-Foy (cohorte 2015-2017).",
  "En parcourant les bases du dessin, de la peinture, de la sculpture et du numérique, elle développe et affine trois principes autour d'une démarche artistique réussie : la conceptualisation, la maîtrise technique et l'expression. C'est par ces principes qu'elle tente d'exprimer sa fragilité à travers des œuvres majoritairement abstraites.",
  "Sa démarche évolue alors qu'elle étudie le design de produits au baccalauréat à l'Université Laval : l'usage de matériaux bruts et de textures influence ses créations. Elle se tourne ensuite vers la muséographie et la scénographie — de la maîtrise en design (recherche sur l'expérience de visite) jusqu'aux salles du Musée canadien de l'histoire et du Musée canadien de la guerre.",
];

export const cv = {
  practice: [
    { years: '2023 —', title: 'Scénographe', org: "Musée canadien de l'histoire et Musée canadien de la guerre" },
    { years: '2022 — 2023', title: "Designer d'expositions et chargée de projets", org: 'Groupe GID Design inc.' },
    { years: '2021 — 2022', title: 'Stagiaire en scénographie', org: 'Musée national des beaux-arts du Québec' },
  ],
  education: [
    {
      years: '2020 — 2022',
      title: 'Maîtrise en design (suspendue)',
      org: 'École de design, Université Laval, Québec',
      note: "De la conception muséale à l'expérience de visite : recherche-projet des facteurs d'influence de l'espace muséal et des dispositifs expographiques sur l'expérience de visite.",
    },
    { years: '2017 — 2020', title: 'Baccalauréat en design de produits', org: 'École de design, Université Laval, Québec' },
    { years: '2015 — 2017', title: "Diplôme d'études collégiales en arts visuels", org: 'Cégep de Sainte-Foy, Québec' },
  ],
  awards: [
    {
      title: "Mention d'excellence",
      org: "Faculté d'aménagement, d'architecture, d'art et de design",
      note: "Excellente qualité des composantes de design du projet de fin d'études : Temple — outil non-pharmacologique d'aide à l'accouchement et à la détente.",
      href: 'objets/temple/',
    },
    { title: 'Mention spéciale', org: 'Garneau', note: 'Pratique du vélo comme moyen de se véhiculer (EXA).', href: 'objets/exa/' },
    {
      title: 'Coup de cœur — reconnaissance par les pairs',
      org: "Projets d'encan",
      note: "Diffuseur d'arômes thérapeutiques et horloge 2/3.",
      href: 'objets/aromatherapie/',
    },
    { title: '3e place', org: 'Concours de vulgarisation scientifique par affiche', note: 'Première Expo 2022.' },
  ],
  exhibitions: [
    { years: '2019', title: 'Le geste libéré', org: "L'Espace contemporain, Québec" },
    { years: '2018', title: 'Matières', org: "Galerie d'art Chez Alfred Pellan, Québec", href: 'https://www.chez-alfred-pellan.com/leonie-theberge' },
    { years: '2018', title: 'Collectif Les enfants vulnérables', org: 'La Ninkasi du Faubourg, Québec' },
    { years: '2018', title: "Salle l'Artdoise", org: 'Québec' },
    { years: '2017', title: "Art-D'œuvres, confiture et confidences", org: 'Cégep de Sainte-Foy, Québec' },
  ],
};

// Démarche artistique (site artiste)
export const artStatement = [
  "Ma démarche artistique réside essentiellement dans l'utilisation de l'abstraction comme exutoire. Ainsi, je crée des œuvres dans lesquelles j'étale mes craintes, mes pensées, mon intimité et où je tente de comprendre mon identité. Ce sont l'idiosyncrasie humaine de même que la faiblesse de soi-même que je m'efforce d'explorer afin de mieux me les approprier par la suite. Cet intérêt pour ma propre fragilité et pour ce qui me tracasse est selon moi une façon authentique de cerner la vulnérabilité de notre société et d'offrir à celle-ci une fenêtre franche sur les maux qui l'habitent.",
  "Nous ne sommes inévitablement pas toujours le meilleur de nous-mêmes, d'autant plus que la performance et la comparaison font dorénavant partie intégrante du quotidien. C'est pourquoi j'estime que de faire l'éloge de la délicatesse de l'humain est davantage révélateur et pertinent que de faire l'étalement de ses forces.",
  "Je me recherche par le biais de mes impulsions. Je dessine récurremment des lignes et des traits qui se ressemblent et que je crée d'une manière spontanée, impulsivement. J'explore cet élan par le biais du dessin. Je m'identifie à ces croisements de lignes et ce jeu de courbes dessinées puisqu'ils révèlent à mes yeux quelque chose qui m'échappe et qui fait intrinsèquement partie de moi. Je passe par l'abstraction pour explorer mes failles personnelles, qui se matérialisent par la fragilité de mes œuvres.",
  "J'utilise diverses matières qui, à mes yeux, sont en lien avec la fragilité comme le plâtre, le papier de soie, calque et de riz ainsi que de l'acétate. Ces matériaux friables, légers et facilement altérés expriment de manière physique une certaine sensibilité intérieure.",
  "Un mélange de beaucoup de genres artistiques comme l'expressionnisme abstrait, le romantisme et le matiérisme m'influence et je suis ouverte aux autres genres pour créer une œuvre encore plus personnelle et évocatrice. L'art c'est l'ouverture d'esprit : tant que le travail artistique de l'artiste crée un lien avec le regardeur, à mes yeux l'œuvre finale est réussie.",
];

export const artQuote = "Je passe par l'abstraction pour explorer mes failles personnelles, qui se matérialisent par la fragilité de mes œuvres.";

// Manifeste du collectif Hêkó (2016)
export const hekoManifesto = {
  title: 'Hêkó — Manifeste',
  year: '2016',
  paragraphs: [
    "Voir l'homme dans tous ses états d'âme, ses questionnements et ses plus profonds désirs, avec une vision propre à chacun, voilà pour nous ce que l'art a de plus beau à offrir.",
    "Notre groupe cherche à semer l'écho au plus profond des pensées de l'homme à l'aide d'une alliance entre beauté et intensité. Nous voulons que lorsqu'il pose ses yeux sur nos réalisations, le regardeur se sente interpellé directement ou indirectement, voire désiré et enivré dans un autre univers que la réalité.",
    "Mélange entre classicisme et romantisme, entre un style moderne contenant les éléments essentiels à son évocation et la passion de l'intangible, notre art est puissant dans son interprétation et délicat dans son application.",
    "Il porte une importance particulière à l'évocation d'une œuvre au-delà du pouvoir représentatif. La technique doit servir le propos de création, mais la maîtrise technique ne figure pas dans nos préoccupations premières. Le message a une signification particulière à nos yeux, tout comme la démarche de création, la réflexion, l'approche personnelle et la singularité de chaque création artistique. La technique permet d'enrichir le propos et sans cette dernière, l'œuvre s'avère incomplète.",
    "Notre groupe utilise l'art comme échappatoire, comme moyen d'expression afin de manifester nos opinions sous une forme visuelle. L'art est un canevas où évacuer le non-dit, sans laisser le spectateur dans l'incompréhension ni en lui donnant toute la signification d'une œuvre.",
    "Le propos de notre groupe est d'utiliser l'art comme un moyen d'atteindre chaque individu personnellement et de l'utiliser comme point de ralliement universel entre les humains.",
  ],
  members: ['Annie Lafrance', 'Marie-Anne Perreault', 'Amy-Ruth Paquette', 'Léonie Théberge'],
};
