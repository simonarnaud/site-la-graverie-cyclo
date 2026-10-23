// Publie le PDF de chaque document à l'adresse /documents/<document>.pdf
import type { APIRoute, GetStaticPaths } from 'astro';
import { readFileSync } from 'node:fs';
import { getCollection, type CollectionEntry } from 'astro:content';
import { cheminFichier } from '../../lib/fichiers';

export const getStaticPaths = (async () => {
  const documents = await getCollection('documents');
  return documents.map((d) => ({ params: { id: d.id }, props: { document: d } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const { document } = props as { document: CollectionEntry<'documents'> };
  return new Response(readFileSync(cheminFichier(document, document.data.fichier)), {
    headers: { 'Content-Type': 'application/pdf' },
  });
};
