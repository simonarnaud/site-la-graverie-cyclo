// Requêtes partagées entre les pages.
import { getCollection } from 'astro:content';

export async function sortiesTriees() {
  const toutes = await getCollection('sorties');
  // Une sortie reste « à venir » jusqu'à la fin de la journée (le site est reconstruit chaque nuit).
  const debutDuJour = new Date();
  debutDuJour.setUTCHours(0, 0, 0, 0);
  const aVenir = toutes
    .filter((s) => s.data.date >= debutDuJour)
    .sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
  const passees = toutes
    .filter((s) => s.data.date < debutDuJour)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  return { toutes, aVenir, passees };
}

export async function actualitesPubliees() {
  const actus = await getCollection('actualites', (a) => !a.data.brouillon);
  return actus.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
