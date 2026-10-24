// Rapport de la dernière mise en ligne : contenus écartés car invalides (voir src/lib/chargeur.ts).
// Lu par le bandeau d'alerte du CMS (public/admin/index.html).
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { lireRapport } from '../lib/chargeur';

// Les comptes rendus d'import FSGT restent affichés dans le CMS pendant 7 jours
const JOURS_IMPORTS = 7;

// Nom des menus du CMS, pour guider le rédacteur vers la fiche à corriger
const MENUS: Record<string, string> = {
  sorties: 'Calendrier',
  parcours: "Parcours d'entraînement",
  actualites: 'Actualités',
  albums: 'Photos',
  documents: 'Documents',
  importsFsgt: 'Import FSGT',
  pages: 'Le club',
};

export const GET: APIRoute = async () => {
  const problemes = lireRapport().map((p) => ({ ...p, menu: MENUS[p.collection] ?? p.collection }));
  const limite = Date.now() - JOURS_IMPORTS * 86400000;
  const imports = (await getCollection('importsFsgt'))
    // En cours ou en attente de validation : toujours affichés ; terminés : pendant 7 jours
    .filter((i) => !['termine', 'echec'].includes(i.data.statut) || (i.data.traiteLe && i.data.traiteLe.getTime() > limite))
    .map((i) => ({ id: i.id, titre: i.data.titre, statut: i.data.statut, resume: i.data.resume, traiteLe: i.data.traiteLe }));
  return new Response(
    JSON.stringify({ miseEnLigne: new Date().toISOString(), commit: process.env.GITHUB_SHA ?? null, problemes, imports }, null, 2),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
  );
};
