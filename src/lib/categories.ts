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

// Sections de la page Documents, dans l'ordre d'affichage (valeurs du champ `section`, cf. public/admin/config.yml)
export const SECTIONS_DOCUMENTS = {
  'calendrier-fsgt': 'Calendriers FSGT',
  'compte-rendu-ag': "Comptes rendus d'AG",
  reglement: 'Règlements et statuts',
  adhesion: 'Adhésion et licences',
  autre: 'Autres documents',
} as const;

export type SectionDocument = keyof typeof SECTIONS_DOCUMENTS;

export const IDS_SECTIONS_DOCUMENTS = Object.keys(SECTIONS_DOCUMENTS) as [SectionDocument, ...SectionDocument[]];
