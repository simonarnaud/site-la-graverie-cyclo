// Le build tourne en UTC sur GitHub : on force toujours le fuseau du club à l'affichage.
const TZ = 'Europe/Paris';

export function dateLongue(d: Date): string {
  return d.toLocaleDateString('fr-FR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function dateCourte(d: Date): string {
  return d.toLocaleDateString('fr-FR', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' });
}

export function heure(d: Date): string {
  return d.toLocaleTimeString('fr-FR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
}

// Jour au format AAAA-MM-JJ, dans le fuseau du club
export function jourParis(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: TZ });
}

// « 2026-11 » → « Novembre 2026 »
export function nomMois(mois: string): string {
  const [annee, m] = mois.split('-').map(Number);
  const nom = new Date(Date.UTC(annee, m - 1, 15)).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return nom.charAt(0).toUpperCase() + nom.slice(1);
}

// Préfixe un chemin interne avec `base` (le site vit dans un sous-dossier tant que le domaine n'est pas branché).
export function lien(chemin: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base + '/' + chemin.replace(/^\//, '');
}
