// Import des programmes FSGT : chaque PDF déposé dans le CMS (menu « Import FSGT », dossier
// src/content/imports-fsgt/<import>/) est lu et ses activités sont créées dans le calendrier.
// Le compte rendu (activités créées, lignes non comprises et pourquoi) est écrit dans la fiche
// de l'import, visible dans le CMS, et résumé dans le bandeau du CMS.
// Lancé par .github/workflows/importer-fsgt.yml après chaque dépôt, ou à la main :
//   node scripts/importer-fsgt.mjs                                 → traite les imports « À traiter »
//   node scripts/importer-fsgt.mjs --essai fichier.pdf [--annee 2026] [--toutes]
//        → affiche ce qui serait créé, sans rien modifier (--toutes : inclut les dates passées)
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parse, stringify } from 'yaml';
import { CATEGORIES } from '../src/lib/categories.ts';
import { ErreurImport, lireProgramme } from './fsgt/lire-programme.mjs';

const DOSSIER_IMPORTS = 'src/content/imports-fsgt';
const DOSSIER_SORTIES = 'src/content/sorties';
const TZ = 'Europe/Paris';

const args = process.argv.slice(2);
const option = (nom) => (args.includes(nom) ? args[args.indexOf(nom) + 1] : undefined);

// ─── Utilitaires ──────────────────────────────────────────────────────────────────────

const jourParis = (d) => d.toLocaleDateString('en-CA', { timeZone: TZ });
const normaliser = (t = '') => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const slug = (t) => normaliser(t).replace(/ /g, '-').slice(0, 60).replace(/-+$/, '');
const dateLisible = (jour) =>
  new Date(`${jour}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

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

// Activités déjà au calendrier, pour ne pas créer de doublon quand un programme mis à jour est réimporté
function sortiesExistantes() {
  return readdirSync(DOSSIER_SORTIES)
    .filter((id) => existsSync(join(DOSSIER_SORTIES, id, 'index.md')))
    .map((id) => {
      try {
        const { donnees } = lireFiche(join(DOSSIER_SORTIES, id, 'index.md'));
        const date = donnees.date instanceof Date ? jourParis(donnees.date) : String(donnees.date ?? '').slice(0, 10);
        return { id, jour: date, organisateur: normaliser(donnees.organisateur), titre: normaliser(donnees.titre) };
      } catch {
        return { id, jour: id.slice(0, 10) };
      }
    });
}

// ─── Préparation des activités ────────────────────────────────────────────────────────

function preparer(activite, titreImport) {
  const organisateur = activite.organisateur ? confidentiel(activite.organisateur) : undefined;
  const lieuComplet = activite.lieu ? confidentiel(activite.lieu) : '';
  // Lieu de rendez-vous : la première partie (« RV au Gymnase de Fleury - Départ 13H40 - … » → « RV au Gymnase de Fleury »)
  const lieuRdv = lieuComplet.split(/\s[-–]\s/)[0].trim() || 'À préciser';
  // Titre = club organisateur (le type, « Rando FSGT » ou « Course », est déjà affiché à côté)
  const titre = activite.titre ?? organisateur ?? `${CATEGORIES[activite.categorie].label} (organisateur à préciser)`;
  const details = [...(lieuComplet && lieuComplet !== lieuRdv ? [['Informations', lieuComplet]] : []), ...activite.details]
    .map(([libelle, valeur]) => [libelle.charAt(0).toUpperCase() + libelle.slice(1), confidentiel(valeur)])
    .filter(([, valeur]) => valeur);
  const donnees = {
    titre,
    categorie: activite.categorie,
    ...(activite.discipline && { discipline: activite.discipline }),
    // 00:00 = horaire pas encore connu (affiché « horaire à préciser » sur le site)
    date: `${activite.date}T${activite.heure ?? '00:00'}:00${decalageParis(activite.date, activite.heure ?? '00:00')}`,
    lieuRdv,
    ...(organisateur && { organisateur }),
    gpx: '',
    lienStrava: '',
    lienInscription: '',
    annulee: false,
  };
  const corps =
    `Activité reprise du programme FSGT « ${titreImport} ».\n` +
    (details.length ? `\n${details.map(([l, v]) => `- **${l}** : ${v}`).join('\n')}\n` : '');
  return { donnees, corps, jour: activite.date, organisateur: normaliser(organisateur), titre: normaliser(titre) };
}

// ─── Import d'un PDF ──────────────────────────────────────────────────────────────────

async function importer(cheminPdf, { titreImport, annee, toutes, essai }) {
  donneesRetirees = false;
  const lecture = await lireProgramme(readFileSync(cheminPdf), { anneeImposee: annee, nomFichier: basename(cheminPdf) });
  const aujourdhui = jourParis(new Date());
  const existantes = sortiesExistantes();
  const creees = [];
  const doublons = [];
  let passees = 0;

  for (const activite of lecture.activites) {
    if (!toutes && activite.date < aujourdhui) {
      passees++;
      continue;
    }
    const fiche = preparer(activite, titreImport);
    const doublon = [...existantes, ...creees].find(
      (s) => s.jour === fiche.jour && ((fiche.organisateur && s.organisateur === fiche.organisateur) || s.titre === fiche.titre),
    );
    if (doublon) {
      doublons.push(`${dateLisible(fiche.jour)} – ${fiche.donnees.titre}`);
      continue;
    }
    let id = `${fiche.jour}-${slug(fiche.donnees.titre)}`;
    for (let n = 2; existsSync(join(DOSSIER_SORTIES, id)) || creees.some((c) => c.id === id); n++) id = `${fiche.jour}-${slug(fiche.donnees.titre)}-${n}`;
    creees.push({ ...fiche, id });
  }

  if (!essai) {
    for (const c of creees) {
      mkdirSync(join(DOSSIER_SORTIES, c.id), { recursive: true });
      ecrireFiche(join(DOSSIER_SORTIES, c.id, 'index.md'), c.donnees, c.corps);
    }
  }

  // Compte rendu pour l'admin
  const resume = [
    `${creees.length} activité${creees.length > 1 ? 's' : ''} créée${creees.length > 1 ? 's' : ''}`,
    doublons.length && `${doublons.length} déjà au calendrier`,
    passees && `${passees} passée${passees > 1 ? 's' : ''} ignorée${passees > 1 ? 's' : ''}`,
    lecture.rejets.length && `${lecture.rejets.length} ligne${lecture.rejets.length > 1 ? 's' : ''} non comprise${lecture.rejets.length > 1 ? 's' : ''}`,
  ].filter(Boolean);
  const avertissements = [
    ...lecture.avertissements,
    ...(donneesRetirees ? ['Les numéros de téléphone et adresses email du PDF ne sont pas recopiés sur le site (données personnelles).'] : []),
  ];
  const sansHoraire = creees.filter((c) => c.donnees.date.includes('T00:00')).length;
  const sansLieu = creees.filter((c) => c.donnees.lieuRdv === 'À préciser').length;
  const sections = [
    `${resume.join(', ')}.`,
    `Mise en page : ${lecture.format}. Année : ${lecture.annee}.`,
    lecture.rejets.length &&
      `Lignes non comprises, à saisir à la main dans le Calendrier :\n${lecture.rejets.map((r) => `- ${r.source} : ${r.raison}.`).join('\n')}`,
    creees.length &&
      `Activités créées (à compléter dans le Calendrier${sansHoraire || sansLieu ? ` : ${[sansHoraire && `${sansHoraire} sans horaire`, sansLieu && `${sansLieu} sans lieu de rendez-vous`].filter(Boolean).join(', ')}` : ''}) :\n` +
        creees.map((c) => `- ${dateLisible(c.jour)} – ${c.donnees.titre}`).join('\n'),
    doublons.length && `Déjà au calendrier, non modifiées :\n${doublons.map((d) => `- ${d}`).join('\n')}`,
    passees && `${passees} activité${passees > 1 ? 's' : ''} antérieure${passees > 1 ? 's' : ''} au ${dateLisible(aujourdhui)} ignorée${passees > 1 ? 's' : ''}.`,
    avertissements.length && `À savoir :\n${avertissements.map((a) => `- ${a}`).join('\n')}`,
  ].filter(Boolean);
  return {
    statut: lecture.rejets.length || lecture.avertissements.length ? 'partiel' : 'termine',
    resume: resume.join(', '),
    rapport: sections.join('\n\n'),
  };
}

// ─── Mode essai : un PDF donné en argument ────────────────────────────────────────────

if (args.includes('--essai')) {
  const pdf = args[args.indexOf('--essai') + 1];
  try {
    const r = await importer(pdf, { titreImport: basename(pdf), annee: Number(option('--annee')) || undefined, toutes: args.includes('--toutes'), essai: true });
    console.log(`[essai, rien n'est modifié] Statut : ${r.statut}\n\n${r.rapport}`);
  } catch (e) {
    console.log(`[essai] Échec : ${e.message}`);
    process.exitCode = 1;
  }
  process.exit();
}

// ─── Mode normal : imports « À traiter » ──────────────────────────────────────────────

if (!existsSync(DOSSIER_IMPORTS)) process.exit();
let traites = 0;
for (const id of readdirSync(DOSSIER_IMPORTS)) {
  const chemin = join(DOSSIER_IMPORTS, id, 'index.md');
  if (!existsSync(chemin)) continue;
  const { donnees, corps } = lireFiche(chemin);
  if (donnees.statut && donnees.statut !== 'a-traiter') continue;

  let resultat;
  try {
    const fichier = String(donnees.fichier ?? '').replace(/^\.\//, '');
    if (!fichier) throw new ErreurImport("Aucun PDF n'est joint à cet import : ajoutez-le dans le champ « Programme FSGT (PDF) ».");
    if (!/\.pdf$/i.test(fichier)) throw new ErreurImport(`Le fichier « ${fichier} » n'est pas un PDF.`);
    if (!existsSync(join(DOSSIER_IMPORTS, id, fichier))) throw new ErreurImport(`Le PDF « ${fichier} » est introuvable : déposez-le à nouveau.`);
    resultat = await importer(join(DOSSIER_IMPORTS, id, fichier), {
      titreImport: donnees.titre ?? id,
      annee: Number(donnees.annee) || undefined,
    });
  } catch (e) {
    console.error(e);
    const message =
      e instanceof ErreurImport ? e.message : `Erreur inattendue pendant la lecture du PDF (${e?.message ?? e}). Prévenez le responsable du site.`;
    resultat = { statut: 'echec', resume: `échec : ${message}`, rapport: `Aucune activité créée.\n\n${message}` };
  }
  Object.assign(donnees, { statut: resultat.statut, resume: resultat.resume, rapport: resultat.rapport, traiteLe: new Date().toISOString() });
  ecrireFiche(chemin, donnees, corps);
  console.log(`Import « ${donnees.titre ?? id} » : ${resultat.statut}\n${resultat.rapport}\n`);
  traites++;
}
if (!traites) console.log('Aucun import à traiter.');
