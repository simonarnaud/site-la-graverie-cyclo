// Schémas des contenus. Toute modification doit être répercutée dans public/admin/config.yml.
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { IDS_CATEGORIES, IDS_DISCIPLINES } from './lib/categories';

// Le CMS enregistre un champ facultatif laissé vide sous la forme '' ou null :
// on le traite comme « non renseigné ».
const vide = (v: unknown) => (v === '' || v === null ? undefined : v);
const facultatif = <T extends z.ZodType>(schema: T) => z.preprocess(vide, schema.optional());

const parcours = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/parcours' }),
  schema: ({ image }) =>
    z.object({
      titre: z.string(),
      type: z.enum(['route', 'gravel', 'vtt']),
      difficulte: facultatif(z.enum(['facile', 'moyen', 'difficile'])),
      // Chemin du fichier dans public/, ex. /gpx/tour-du-lac.gpx
      gpx: z.string().startsWith('/gpx/'),
      // Facultatifs : sinon calculés depuis le GPX
      distanceKm: facultatif(z.number()),
      deniveleM: facultatif(z.number()),
      couverture: facultatif(image()),
      couvertureAlt: facultatif(z.string()),
    }),
});

// Événements du calendrier : entraînements, randos, courses…
const sorties = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/sorties' }),
  schema: z.object({
    titre: z.string(),
    categorie: z.enum(IDS_CATEGORIES).default('entrainement'),
    discipline: facultatif(z.enum(IDS_DISCIPLINES)),
    date: z.coerce.date(),
    dureeHeures: z.preprocess(vide, z.number().positive().default(3)),
    lieuRdv: z.string(),
    // Club ou fédération organisatrice, si ce n'est pas le club
    organisateur: facultatif(z.string()),
    niveau: facultatif(z.enum(['découverte', 'intermédiaire', 'sportif'])),
    parcours: facultatif(reference('parcours')),
    // Participation : événement créé au préalable dans le club Strava
    lienStrava: facultatif(
      z.url().refine((u) => URL.canParse(u) && /(^|\.)strava\.(com|app\.link)$/.test(new URL(u).hostname), {
        message: 'Le lien de participation doit être un lien Strava (strava.com ou strava.app.link)',
      }),
    ),
    // Inscription auprès d'un organisateur extérieur (rando, course), si elle est nécessaire
    lienInscription: facultatif(z.url()),
    annulee: z.boolean().default(false),
  }),
});

const actualites = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/actualites' }),
  schema: ({ image }) =>
    z.object({
      titre: z.string(),
      date: z.coerce.date(),
      auteur: z.string(),
      resume: facultatif(z.string()),
      couverture: facultatif(image()),
      couvertureAlt: facultatif(z.string()),
      brouillon: z.boolean().default(false),
    }),
});

const albums = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/albums' }),
  schema: ({ image }) =>
    z.object({
      titre: z.string(),
      date: z.coerce.date(),
      photos: z.array(z.object({ src: image(), alt: z.string() })).min(1).max(12),
      lienAlbumComplet: z.url(),
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.object({
    titre: z.string(),
    description: facultatif(z.string()),
  }),
});

// Documents PDF à télécharger (programme FSGT, règlements, comptes rendus…)
const documents = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/documents' }),
  schema: z.object({
    titre: z.string(),
    date: z.coerce.date(),
    type: z.enum(['calendrier', 'règlement', 'compte rendu', 'autre']).default('autre'),
    // Chemin du fichier dans public/, ex. /documents/programme-fsgt-14-2022.pdf
    fichier: z.string().startsWith('/documents/'),
    description: facultatif(z.string()),
  }),
});

export const collections = { parcours, sorties, actualites, albums, pages, documents };
