// Activités lues dans un programme FSGT (lire-programme.mjs) → propositions d'activités pour le calendrier,
// repérage des doublons et contenu des fiches à créer (src/content/sorties/<id>/index.md).
// Sans accès disque : utilisé dans le navigateur (page d'import du CMS) et par scripts/essai-fsgt.mjs.
import { parse, stringify } from 'yaml';
import { CATEGORIES } from '../categories.ts';

const TZ = 'Europe/Paris';

export const jourParis = (d) => d.toLocaleDateString('en-CA', { timeZone: TZ });
const heureParis = (d) => d.toLocaleTimeString('fr-FR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
const normaliser = (t = '') => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const slug = (t) => normaliser(t).replace(/ /g, '-').slice(0, 60).replace(/-+$/, '');
export const dateLisible = (jour) =>
  new Date(`${jour}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

// « 2026-10-25 » + « 13:30 » (heure de Paris) → « 2026-10-25T13:30:00+01:00 » (décalage de l'hiver ou de l'été)
export function dateIso(jour, heure = '00:00') {
  const decalage = ['+01:00', '+02:00'].find((d) => {
    const instant = new Date(`${jour}T${heure}:00${d}`);
    return jourParis(instant) === jour && heureParis(instant) === heure;
  });
  return `${jour}T${heure}:00${decalage ?? '+01:00'}`;
}

// Le site est public : on ne recopie ni numéro de téléphone ni adresse email (données personnelles)
function confidentiel(texte, signaler) {
  const propre = texte
    .replace(/(?:\+33\s?|\b0)[1-9](?:[\s.-]?\d{2}){4}\b/g, '')
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '')
    .replace(/\b(contact|tel|tél|téléphone|mail)\s*:?\s*$/i, '')
    .replace(/\s+/g, ' ')
    .replace(/[\s,;:-]+$/, '')
    .trim();
  if (propre !== texte.replace(/\s+/g, ' ').trim()) signaler();
  return propre;
}

/**
 * Activités lues → propositions (seulement celles d'aujourd'hui et après, sauf `toutes`).
 * @returns {{ propositions: object[], passees: number, donneesRetirees: boolean }}
 */
export function proposer(activites, { toutes = false, aujourdhui = jourParis(new Date()) } = {}) {
  let donneesRetirees = false;
  const signaler = () => (donneesRetirees = true);
  const propositions = [];
  let passees = 0;
  for (const a of activites) {
    if (!toutes && a.date < aujourdhui) {
      passees++;
      continue;
    }
    const organisateur = a.organisateur ? confidentiel(a.organisateur, signaler) : '';
    const lieuComplet = a.lieu ? confidentiel(a.lieu, signaler) : '';
    // Lieu de rendez-vous : la première partie (« RV au Gymnase de Fleury - Départ 13H40 - … » → « RV au Gymnase de Fleury »)
    const lieuRdv = lieuComplet.split(/\s[-–]\s/)[0].trim();
    const details = [...(lieuComplet && lieuComplet !== lieuRdv ? [['Informations', lieuComplet]] : []), ...a.details]
      .map(([libelle, valeur]) => [libelle.charAt(0).toUpperCase() + libelle.slice(1), confidentiel(valeur, signaler)])
      .filter(([, valeur]) => valeur);
    propositions.push({
      // Titre = club organisateur (le type, « Rando FSGT » ou « Course », est déjà affiché à côté)
      titre: a.titre ?? (organisateur || `${CATEGORIES[a.categorie].label} (organisateur à préciser)`),
      categorie: a.categorie,
      discipline: a.discipline ?? '',
      jour: a.date,
      heure: a.heure ?? '', // vide = horaire à préciser
      lieuRdv,
      organisateur,
      informations: details.map(([l, v]) => `- **${l}** : ${v}`).join('\n'),
      source: a.source,
    });
  }
  return { propositions, passees, donneesRetirees };
}

// ─── Doublons ─────────────────────────────────────────────────────────────────────────

// Mots trop courants pour identifier une activité (types, lieux génériques…)
const MOTS_COURANTS = new Set(
  'rando randonnee fsgt club cyclo cyclos cyclosport course sortie entrainement route gravel velo vtt preciser salle mairie place eglise gymnase stade parking depart rendez vous ecole chemin avenue boulevard saint sainte championnat national'.split(' '),
);
const motsCles = (...textes) => new Set(normaliser(textes.join(' ')).split(' ').filter((m) => m.length >= 4 && !MOTS_COURANTS.has(m)));

// Contenu d'une fiche du calendrier (index.md) → { id, titre, jour, mots }, ou undefined si illisible
export function lireSortie(id, contenu) {
  try {
    const entete = contenu.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
    const d = parse(entete ?? '') ?? {};
    const date = new Date(d.date);
    if (Number.isNaN(date.getTime())) return undefined;
    return { id, titre: String(d.titre ?? id), jour: jourParis(date), mots: motsCles(d.titre, d.organisateur, d.lieuRdv) };
  } catch {
    return undefined;
  }
}

// Même jour et au moins un mot-clé en commun (« JC Audrieu » / « Rando d'Audrieu ») = doublon probable
export function chercherDoublon(proposition, existantes) {
  const mots = motsCles(proposition.titre, proposition.organisateur, proposition.lieuRdv);
  return existantes.find((s) => s.jour === proposition.jour && [...mots].some((m) => s.mots.has(m)));
}

// ─── Fiche à créer ────────────────────────────────────────────────────────────────────

// Proposition (éventuellement corrigée par l'admin) → dossier et contenu de la fiche du calendrier.
// `prises` : identifiants déjà utilisés (dossiers existants), complété au fur et à mesure.
export function ficheSortie(p, { titreProgramme, prises }) {
  const base = `${p.jour}-${slug(p.titre) || 'activite-fsgt'}`;
  let id = base;
  for (let n = 2; prises.has(id); n++) id = `${base}-${n}`;
  prises.add(id);
  const donnees = {
    titre: p.titre.trim(),
    categorie: p.categorie,
    ...(p.discipline && { discipline: p.discipline }),
    // 00:00 = horaire pas encore connu (affiché « horaire à préciser » sur le site)
    date: dateIso(p.jour, p.heure || '00:00'),
    lieuRdv: p.lieuRdv.trim() || 'À préciser',
    ...(p.organisateur.trim() && { organisateur: p.organisateur.trim() }),
    gpx: '',
    lienStrava: '',
    lienInscription: '',
    annulee: false,
  };
  const corps = `Activité reprise du programme FSGT « ${titreProgramme} ».\n${p.informations ? `\n${p.informations}\n` : ''}`;
  return { id, chemin: `src/content/sorties/${id}/index.md`, contenu: `---\n${stringify(donnees, { lineWidth: 0 })}---\n${corps}` };
}
