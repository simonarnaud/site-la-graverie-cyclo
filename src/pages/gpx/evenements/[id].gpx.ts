// Publie le GPX propre à un événement (rando, course…) à l'adresse /gpx/evenements/<événement>.gpx
import type { APIRoute, GetStaticPaths } from 'astro';
import { readFileSync } from 'node:fs';
import { getCollection, type CollectionEntry } from 'astro:content';
import { cheminFichier } from '../../../lib/fichiers';

export const getStaticPaths = (async () => {
  const sorties = await getCollection('sorties', (s) => !!s.data.gpx);
  return sorties.map((s) => ({ params: { id: s.id }, props: { sortie: s } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const { sortie } = props as { sortie: CollectionEntry<'sorties'> };
  return new Response(readFileSync(cheminFichier(sortie, sortie.data.gpx!)), {
    headers: { 'Content-Type': 'application/gpx+xml' },
  });
};
