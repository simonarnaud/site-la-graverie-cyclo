// Rapport de la dernière mise en ligne : contenus écartés car invalides (voir src/lib/chargeur.ts).
// Lu par le bandeau d'alerte du CMS (public/admin/index.html).
import type { APIRoute } from 'astro';
import { lireRapport } from '../lib/chargeur';

// Nom des menus du CMS, pour guider le rédacteur vers la fiche à corriger
const MENUS: Record<string, string> = {
  sorties: 'Calendrier',
  parcours: "Parcours d'entraînement",
  actualites: 'Actualités',
  albums: 'Photos',
  documents: 'Documents',
  pages: 'Le club',
};

export const GET: APIRoute = () => {
  const problemes = lireRapport().map((p) => ({ ...p, menu: MENUS[p.collection] ?? p.collection }));
  return new Response(
    JSON.stringify({ miseEnLigne: new Date().toISOString(), commit: process.env.GITHUB_SHA ?? null, problemes }, null, 2),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
  );
};
