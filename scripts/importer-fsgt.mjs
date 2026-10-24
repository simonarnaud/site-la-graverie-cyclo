// Import des programmes FSGT, en deux temps, depuis le CMS (menu « Import FSGT », dossier
// src/content/imports-fsgt/<import>/ avec le PDF) :
//   1. statut « a-traiter » : le PDF est lu ; les activités à venir sont PROPOSÉES dans la fiche de
//      l'import (liste « activites », doublons possibles repérés et décochés), statut → « a-valider ».
//      Rien n'est encore ajouté au calendrier.
//   2. l'admin vérifie, corrige, coche/décoche, puis met le statut sur « valide » : les activités
//      cochées sont créées dans le calendrier (doublons revérifiés), statut → « termine ».
// À chaque étape, un compte rendu (lignes non comprises et pourquoi, activités créées…) est écrit dans
// la fiche et résumé dans le bandeau du CMS.
// Lancé par .github/workflows/importer-fsgt.yml après chaque enregistrement d'un import, ou à la main :
//   node scripts/importer-fsgt.mjs                                 → traite les imports en attente
//   node scripts/importer-fsgt.mjs --essai fichier.pdf [--annee 2026] [--toutes]
//        → affiche ce qui serait proposé, sans rien modifier (--toutes : inclut les dates passées)
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parse, stringify } from 'yaml';
import { CATEGORIES, DISCIPLINES } from '../src/lib/categories.ts';
import { ErreurImport, lireProgramme } from './fsgt/lire-programme.mjs';

const DOSSIER_IMPORTS = 'src/content/imports-fsgt';
const DOSSIER_SORTIES = 'src/content/sorties';
const TZ = 'Europe/Paris';

const args = process.argv.slice(2);
const option = (nom) => (args.includes(nom) ? args[args.indexOf(nom) + 1] : undefined);

// ─── Utilitaires ──────────────────────────────────────────────────────────────────────

const jourParis = (d) => d.toLocaleDateString('en-CA', { timeZone: TZ });
const normaliser = (t = '') => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const slug = (t) => normaliser(t).replace(/ /g, '-').slice(0, 60).replace(/-+$/, '');
const dateLisible = (jour) =>
  new Date(`${jour}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const pluriel = (n, mot, motPluriel = `${mot}s`) => `${n} ${n > 1 ? motPluriel : mot}`;

// Décalage horaire de Paris à ce jour et cette heure (« +01:00 » l'hiver, « +02:00 » l'été)
function decalageParis(jour, heure) {
  return ['+01:00', '+02:00'].find((d) => {
    const instant = new Date(`${jour}T${heure}:00${d}`);
    return jourParis(instant) === jour && instant.toLocaleTimeString('fr-FR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }) === heure;
  }) ?? '+01:00';
}

// Le site est public : on ne recopie ni numéro de téléphone ni adresse email (données personnelles)
let donneesRetirees = false;
function confidentiel(texte) {
  const propre = texte
    .replace(/(?:\+33\s?|\b0)[1-9](?:[\s.-]?\d{2}){4}\b/g, '')
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '')
    .replace(/\b(contact|tel|tél|téléphone|mail)\s*:?\s*$/i, '')
    .replace(/\s+/g, ' ')
    .replace(/[\s,;:-]+$/, '')
    .trim();
  if (propre !== texte.replace(/\s+/g, ' ').trim()) donneesRetirees = true;
  return propre;
}

function lireFiche(chemin) {
  const contenu = readFileSync(chemin, 'utf-8');
  const [, entete, corps] = contenu.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/) ?? [];
  if (entete === undefined) throw new Error(`${chemin} : en-tête illisible`);
  return { donnees: parse(entete) ?? {}, corps };
}

const ecrireFiche = (chemin, donnees, corps = '') => writeFileSync(chemin, `---\n${stringify(donnees, { lineWidth: 0 })}---\n${corps}`);

// ─── Doublons ─────────────────────────────────────────────────────────────────────────

// Mots trop courants pour identifier une activité (types, lieux génériques…)
const MOTS_COURANTS = new Set(
  'rando randonnee fsgt club cyclo cyclos cyclosport course sortie entrainement route gravel velo vtt preciser salle mairie place eglise gymnase stade parking depart rendez vous ecole chemin avenue boulevard saint sainte championnat national'.split(' '),
);
const motsCles = (...textes) => new Set(normaliser(textes.join(' ')).split(' ').filter((m) => m.length >= 4 && !MOTS_COURANTS.has(m)));

// Activités du calendrier (jour à Paris + mots-clés du titre, de l'organisateur et du lieu)
function sortiesExistantes() {
  return readdirSync(DOSSIER_SORTIES)
    .filter((id) => existsSync(join(DOSSIER_SORTIES, id, 'index.md')))
    .flatMap((id) => {
      try {
        const { donnees } = lireFiche(join(DOSSIER_SORTIES, id, 'index.md'));
        const date = new Date(donnees.date);
        if (Number.isNaN(date.getTime())) return [];
        return [{ id, titre: String(donnees.titre ?? id), jour: jourParis(date), mots: motsCles(donnees.titre, donnees.organisateur, donnees.lieuRdv) }];
      } catch {
        return [];
      }
    });
}

// Même jour et au moins un mot-clé en commun (« JC Audrieu » / « Rando d'Audrieu ») = doublon possible
function chercherDoublon(activite, existantes) {
  const jour = jourParis(new Date(activite.date));
  const mots = motsCles(activite.titre, activite.organisateur, activite.lieuRdv);
  return existantes.find((s) => s.jour === jour && [...mots].some((m) => s.mots.has(m)));
}

const libelleDoublon = (s) => `« ${s.titre} » du ${dateLisible(s.jour)} est déjà au calendrier`;

// ─── Étape 1 : lecture du PDF → activités proposées ───────────────────────────────────

function proposer(activite) {
  const organisateur = activite.organisateur ? confidentiel(activite.organisateur) : '';
  const lieuComplet = activite.lieu ? confidentiel(activite.lieu) : '';
  // Lieu de rendez-vous : la première partie (« RV au Gymnase de Fleury - Départ 13H40 - … » → « RV au Gymnase de Fleury »)
  const lieuRdv = lieuComplet.split(/\s[-–]\s/)[0].trim() || 'À préciser';
  const details = [...(lieuComplet && lieuComplet !== lieuRdv ? [['Informations', lieuComplet]] : []), ...activite.details]
    .map(([libelle, valeur]) => [libelle.charAt(0).toUpperCase() + libelle.slice(1), confidentiel(valeur)])
    .filter(([, valeur]) => valeur);
  return {
    ajouter: true,
    // Titre = club organisateur (le type, « Rando FSGT » ou « Course », est déjà affiché à côté)
    titre: activite.titre ?? (organisateur || `${CATEGORIES[activite.categorie].label} (organisateur à préciser)`),
    categorie: activite.categorie,
    discipline: activite.discipline ?? '',
    // 00:00 = horaire pas encore connu (affiché « horaire à préciser » sur le site)
    date: `${activite.date}T${activite.heure ?? '00:00'}:00${decalageParis(activite.date, activite.heure ?? '00:00')}`,
    lieuRdv,
    organisateur,
    informations: details.map(([l, v]) => `- **${l}** : ${v}`).join('\n'),
    doublon: '',
    source: activite.source,
    resultat: '',
  };
}

async function lire(cheminPdf, { titreImport, annee, toutes }) {
  donneesRetirees = false;
  const lecture = await lireProgramme(readFileSync(cheminPdf), { anneeImposee: annee, nomFichier: basename(cheminPdf) });
  const aujourdhui = jourParis(new Date());
  const existantes = sortiesExistantes();
  const activites = [];
  let passees = 0;
  for (const a of lecture.activites) {
    if (!toutes && a.date < aujourdhui) {
      passees++;
      continue;
    }
    const proposition = proposer(a);
    const doublon = chercherDoublon(proposition, existantes);
    if (doublon) Object.assign(proposition, { ajouter: false, doublon: libelleDoublon(doublon) });
    activites.push(proposition);
  }

  const doublons = activites.filter((a) => a.doublon).length;
  const sansHoraire = activites.filter((a) => a.date.includes('T00:00')).length;
  const sansLieu = activites.filter((a) => a.lieuRdv === 'À préciser').length;
  const resume = [
    `${pluriel(activites.length, 'activité proposée', 'activités proposées')}`,
    doublons && `dont ${doublons} déjà au calendrier (décochée${doublons > 1 ? 's' : ''})`,
    passees && pluriel(passees, 'passée ignorée', 'passées ignorées'),
    lecture.rejets.length && pluriel(lecture.rejets.length, 'ligne non comprise', 'lignes non comprises'),
  ].filter(Boolean);
  const avertissements = [
    ...lecture.avertissements,
    ...(donneesRetirees ? ['Les numéros de téléphone et adresses email du PDF ne sont pas recopiés (données personnelles).'] : []),
  ];
  const rapport = [
    `Lecture du PDF : ${resume.join(', ')}.`,
    activites.length
      ? "Rien n'est encore ajouté au calendrier. Vérifiez la liste « Activités proposées » ci-dessous (dépliez une activité pour la corriger), " +
        'cochez ou décochez « Ajouter au calendrier », puis mettez l\'État sur « 3. Validé » et enregistrez.'
      : "Aucune activité à venir à proposer : rien ne sera ajouté au calendrier.",
    `Mise en page : ${lecture.format}. Année : ${lecture.annee}.`,
    sansHoraire || sansLieu
      ? `À compléter plus tard dans le Calendrier : ${[sansHoraire && `${sansHoraire} sans horaire`, sansLieu && `${sansLieu} sans lieu de rendez-vous`].filter(Boolean).join(', ')}.`
      : '',
    lecture.rejets.length &&
      `Lignes non comprises, à saisir à la main dans le Calendrier :\n${lecture.rejets.map((r) => `- ${r.source} : ${r.raison}.`).join('\n')}`,
    passees && `${pluriel(passees, 'activité antérieure', 'activités antérieures')} au ${dateLisible(aujourdhui)} ignorée${passees > 1 ? 's' : ''}.`,
    avertissements.length && `À savoir :\n${avertissements.map((a) => `- ${a}`).join('\n')}`,
  ].filter(Boolean);
  return { statut: activites.length ? 'a-valider' : 'termine', resume: resume.join(', '), rapport: rapport.join('\n\n'), activites };
}

// ─── Étape 2 : création des activités cochées ─────────────────────────────────────────

function creer(donnees) {
  const existantes = sortiesExistantes();
  const creees = [];
  const nonCreees = [];
  for (const a of donnees.activites ?? []) {
    if (!a.ajouter) {
      // Déjà créée lors d'une validation précédente : on garde son résultat
      if (!String(a.resultat ?? '').startsWith('Créée')) a.resultat = 'Non ajoutée (décochée)';
      continue;
    }
    const date = new Date(a.date);
    const probleme =
      !String(a.titre ?? '').trim() ? 'titre vide'
      : Number.isNaN(date.getTime()) ? 'date illisible'
      : !CATEGORIES[a.categorie] ? `type « ${a.categorie} » inconnu`
      : a.discipline && !DISCIPLINES[a.discipline] ? `discipline « ${a.discipline} » inconnue`
      : undefined;
    // Doublon apparu depuis la lecture (activité ajoutée entre-temps) ; un doublon déjà signalé et
    // recoché par l'admin est créé : c'est son choix
    const doublon = !probleme && !a.doublon ? chercherDoublon(a, existantes) : undefined;
    if (probleme || doublon) {
      a.resultat = `Non créée : ${probleme ?? libelleDoublon(doublon)}`;
      // Doublon apparu entre-temps : signalé et décoché ; recocher puis revalider = le créer quand même
      if (doublon) Object.assign(a, { doublon: libelleDoublon(doublon), ajouter: false });
      nonCreees.push(`${a.titre || '(sans titre)'} : ${probleme ?? 'déjà au calendrier'}`);
      continue;
    }
    const jour = jourParis(date);
    let id = `${jour}-${slug(a.titre)}`;
    for (let n = 2; existsSync(join(DOSSIER_SORTIES, id)); n++) id = `${jour}-${slug(a.titre)}-${n}`;
    const sortie = {
      titre: String(a.titre).trim(),
      categorie: a.categorie,
      ...(a.discipline && { discipline: a.discipline }),
      date: a.date instanceof Date ? a.date.toISOString() : String(a.date),
      lieuRdv: String(a.lieuRdv ?? '').trim() || 'À préciser',
      ...(String(a.organisateur ?? '').trim() && { organisateur: String(a.organisateur).trim() }),
      gpx: '',
      lienStrava: '',
      lienInscription: '',
      annulee: false,
    };
    const corps = `Activité reprise du programme FSGT « ${donnees.titre} ».\n${a.informations ? `\n${a.informations}\n` : ''}`;
    mkdirSync(join(DOSSIER_SORTIES, id), { recursive: true });
    ecrireFiche(join(DOSSIER_SORTIES, id, 'index.md'), sortie, corps);
    existantes.push({ id, titre: sortie.titre, jour, mots: motsCles(sortie.titre, sortie.organisateur, sortie.lieuRdv) });
    a.resultat = `Créée dans le Calendrier (${id})`;
    a.ajouter = false; // une relance ne la recréera pas
    creees.push(`${dateLisible(jour)} – ${sortie.titre}`);
  }
  const resume = [pluriel(creees.length, 'activité créée', 'activités créées'), nonCreees.length && pluriel(nonCreees.length, 'non créée', 'non créées')].filter(Boolean);
  const rapport = [
    `Validation : ${resume.join(', ')}.`,
    creees.length && `Ajoutées au Calendrier (à compléter si besoin : horaire, lieu, trace GPX, lien Strava…) :\n${creees.map((c) => `- ${c}`).join('\n')}`,
    nonCreees.length && `Non créées :\n${nonCreees.map((c) => `- ${c}`).join('\n')}`,
    donnees.rapport && `— Lecture du PDF —\n${String(donnees.rapport).replace(/^Validation :[\s\S]*?— Lecture du PDF —\n/, '')}`,
  ].filter(Boolean);
  return { statut: nonCreees.length ? 'echec-partiel' : 'termine', resume: resume.join(', '), rapport: rapport.join('\n\n') };
}

// ─── Mode essai : un PDF donné en argument ────────────────────────────────────────────

if (args.includes('--essai')) {
  const pdf = args[args.indexOf('--essai') + 1];
  try {
    const r = await lire(pdf, { titreImport: basename(pdf), annee: Number(option('--annee')) || undefined, toutes: args.includes('--toutes') });
    console.log(`[essai, rien n'est modifié] Statut : ${r.statut}\n\n${r.rapport}\n\nActivités proposées :`);
    for (const a of r.activites) {
      console.log(`${a.ajouter ? '☑' : '☐'} ${a.date} ${CATEGORIES[a.categorie].label} ${a.discipline || '-'} | ${a.titre} | ${a.lieuRdv}${a.doublon ? ` | ⚠ ${a.doublon}` : ''}`);
    }
  } catch (e) {
    console.log(`[essai] Échec : ${e.message}`);
    process.exitCode = 1;
  }
  process.exit();
}

// ─── Mode normal : imports à lire ou à valider ────────────────────────────────────────

if (!existsSync(DOSSIER_IMPORTS)) process.exit();
let traites = 0;
for (const id of readdirSync(DOSSIER_IMPORTS)) {
  const chemin = join(DOSSIER_IMPORTS, id, 'index.md');
  if (!existsSync(chemin)) continue;
  const { donnees, corps } = lireFiche(chemin);
  const statut = donnees.statut || 'a-traiter';
  if (statut !== 'a-traiter' && statut !== 'valide') continue;

  let resultat;
  try {
    if (statut === 'valide') resultat = creer(donnees);
    else {
      const fichier = String(donnees.fichier ?? '').replace(/^\.\//, '');
      if (!fichier) throw new ErreurImport("Aucun PDF n'est joint à cet import : ajoutez-le dans le champ « Programme FSGT (PDF) ».");
      if (!/\.pdf$/i.test(fichier)) throw new ErreurImport(`Le fichier « ${fichier} » n'est pas un PDF.`);
      if (!existsSync(join(DOSSIER_IMPORTS, id, fichier))) throw new ErreurImport(`Le PDF « ${fichier} » est introuvable : déposez-le à nouveau.`);
      resultat = await lire(join(DOSSIER_IMPORTS, id, fichier), { titreImport: donnees.titre ?? id, annee: Number(donnees.annee) || undefined });
    }
  } catch (e) {
    console.error(e);
    const message =
      e instanceof ErreurImport ? e.message : `Erreur inattendue (${e?.message ?? e}). Prévenez le responsable du site.`;
    resultat = { statut: 'echec', resume: `échec : ${message}`, rapport: `Rien n'a été ajouté au calendrier.\n\n${message}` };
  }
  // « echec-partiel » : certaines activités cochées n'ont pas pu être créées → l'admin corrige et revalide
  const { statut: nouveau, ...reste } = resultat;
  Object.assign(donnees, reste, { statut: nouveau === 'echec-partiel' ? 'a-valider' : nouveau, traiteLe: new Date().toISOString() });
  ecrireFiche(chemin, donnees, corps);
  console.log(`Import « ${donnees.titre ?? id} » : ${donnees.statut}\n${donnees.rapport}\n`);
  traites++;
}
if (!traites) console.log('Aucun import à traiter.');
