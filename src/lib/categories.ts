// Types d'événements du calendrier. Les identifiants sont ceux enregistrés par le CMS (public/admin/config.yml).
// Les couleurs sont définies dans src/styles/global.css (--cat-<id>).
export const CATEGORIES = {
  entrainement: { label: 'Entraînement', pluriel: 'Entraînements' },
  rando: { label: 'Rando FSGT', pluriel: 'Randos FSGT' },
  course: { label: 'Course', pluriel: 'Courses' },
  autre: { label: 'Autre', pluriel: 'Autres' },
} as const;

export type Categorie = keyof typeof CATEGORIES;

export const IDS_CATEGORIES = Object.keys(CATEGORIES) as [Categorie, ...Categorie[]];

// Les trois disciplines du club : discipline d'un événement (facultative) et d'un parcours d'entraînement.
export const DISCIPLINES = {
  cyclo: 'Cyclo',
  vtt: 'VTT',
  gravel: 'Gravel',
} as const;

export type Discipline = keyof typeof DISCIPLINES;

export const IDS_DISCIPLINES = Object.keys(DISCIPLINES) as [Discipline, ...Discipline[]];
