// Publie la trace GPX de chaque parcours à l'adresse /gpx/<parcours>.gpx
import type { APIRoute, GetStaticPaths } from 'astro';
import { readFileSync } from 'node:fs';
import { getCollection, type CollectionEntry } from 'astro:content';
import { cheminFichier } from '../../lib/fichiers';

export const getStaticPaths = (async () => {
  const parcours = await getCollection('parcours');
  return parcours.map((p) => ({ params: { id: p.id }, props: { parcours: p } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const { parcours } = props as { parcours: CollectionEntry<'parcours'> };
  return new Response(readFileSync(cheminFichier(parcours, parcours.data.gpx)), {
    headers: { 'Content-Type': 'application/gpx+xml' },
  });
};
