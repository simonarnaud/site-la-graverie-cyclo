// Fichiers rangés dans le dossier d'une fiche (GPX d'un parcours, PDF d'un document).
// Ils sont supprimés avec la fiche dans le CMS, et publiés par les routes src/pages/gpx/ et src/pages/documents/.
import { statSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function cheminFichier(entree: { id: string; filePath?: string }, nom: string): string {
  if (!entree.filePath) throw new Error(`Dossier introuvable pour « ${entree.id} »`);
  const chemin = join(process.cwd(), dirname(entree.filePath), nom);
  try {
    statSync(chemin);
  } catch {
    throw new Error(`« ${entree.id} » : fichier introuvable (${join(dirname(entree.filePath), nom)})`);
  }
  return chemin;
}

export function tailleLisible(chemin: string): string {
  const octets = statSync(chemin).size;
  const enMo = octets / 1024 / 1024;
  return enMo >= 1
    ? `${enMo.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`
    : `${Math.max(1, Math.round(octets / 1024))} Ko`;
}
