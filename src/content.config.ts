// Schémas des contenus. Toute modification doit être répercutée dans public/admin/config.yml.
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { IDS_CATEGORIES } from './lib/categories';

const parcours = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/parcours' }),
  schema: ({ image }) =>
    z.object({
      titre: z.string(),
      type: z.enum(['route', 'gravel', 'vtt']),
      difficulte: z.enum(['facile', 'moyen', 'difficile']),
      // Chemin du fichier dans public/, ex. /gpx/tour-du-lac.gpx
      gpx: z.string().startsWith('/gpx/'),
      // Facultatifs : sinon calculés depuis le GPX
      distanceKm: z.number().optional(),
      deniveleM: z.number().optional(),
      couverture: image().optional(),
      couvertureAlt: z.string().optional(),
    }),
});

// Événements du calendrier : sorties club, entraînements, brevets, courses…
const sorties = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/sorties' }),
  schema: z.object({
    titre: z.string(),
    categorie: z.enum(IDS_CATEGORIES).default('sortie'),
    date: z.coerce.date(),
    dureeHeures: z.number().positive().default(3),
    lieuRdv: z.string(),
    // Club ou fédération organisatrice, si ce n'est pas le club
    organisateur: z.string().optional(),
    niveau: z.enum(['découverte', 'intermédiaire', 'sportif']).optional(),
    parcours: reference('parcours').optional(),
    lienInscription: z.url().optional(),
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
      resume: z.string().optional(),
      couverture: image().optional(),
      couvertureAlt: z.string().optional(),
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
    description: z.string().optional(),
  }),
});

// Documents PDF à télécharger (calendrier FFC, règlements, comptes rendus…)
const documents = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/documents' }),
  schema: z.object({
    titre: z.string(),
    date: z.coerce.date(),
    type: z.enum(['calendrier', 'règlement', 'compte rendu', 'autre']).default('autre'),
    // Chemin du fichier dans public/, ex. /documents/calendrier-ffc-2027.pdf
    fichier: z.string().startsWith('/documents/'),
    description: z.string().optional(),
  }),
});

export const collections = { parcours, sorties, actualites, albums, pages, documents };
