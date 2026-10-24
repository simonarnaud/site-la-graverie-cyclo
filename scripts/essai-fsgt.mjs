// Essai de lecture d'un programme FSGT, sans rien modifier : affiche ce que la page d'import du CMS
// proposerait (activités, doublons avec le calendrier local, lignes non comprises).
//   node scripts/essai-fsgt.mjs fichier.pdf [--annee 2026] [--toutes]   (--toutes : inclut les dates passées)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { lireProgramme } from '../src/lib/fsgt/lire-programme.mjs';
import { chercherDoublon, dateLisible, lireSortie, proposer } from '../src/lib/fsgt/preparer.mjs';

const args = process.argv.slice(2);
const pdf = args.find((a) => a.toLowerCase().endsWith('.pdf'));
if (!pdf) throw new Error('Usage : node scripts/essai-fsgt.mjs fichier.pdf [--annee 2026] [--toutes]');
const annee = args.includes('--annee') ? Number(args[args.indexOf('--annee') + 1]) : undefined;

const DOSSIER = 'src/content/sorties';
const existantes = readdirSync(DOSSIER)
  .filter((id) => existsSync(join(DOSSIER, id, 'index.md')))
  .map((id) => lireSortie(id, readFileSync(join(DOSSIER, id, 'index.md'), 'utf-8')))
  .filter(Boolean);

try {
  const lecture = await lireProgramme(readFileSync(pdf), { anneeImposee: annee, nomFichier: basename(pdf) });
  const { propositions, passees, donneesRetirees } = proposer(lecture.activites, { toutes: args.includes('--toutes') });
  console.log(`Mise en page : ${lecture.format}\nAnnée : ${lecture.annee}`);
  console.log(`${propositions.length} activité(s) proposée(s), ${passees} passée(s) ignorée(s), ${lecture.rejets.length} ligne(s) non comprise(s)\n`);
  for (const p of propositions) {
    const doublon = chercherDoublon(p, existantes);
    console.log(
      `${doublon ? '☐' : '☑'} ${dateLisible(p.jour)} ${p.heure || '--:--'} ${p.categorie} ${p.discipline || '-'} | ${p.titre} | ${p.lieuRdv || 'lieu à préciser'}` +
        (doublon ? `\n    ⚠ déjà au calendrier : « ${doublon.titre} » (${doublon.id})` : ''),
    );
  }
  for (const r of lecture.rejets) console.log(`✖ ${r.source} : ${r.raison}`);
  for (const a of lecture.avertissements) console.log(`⚠ ${a}`);
  if (donneesRetirees) console.log('ℹ Téléphones / emails retirés.');
} catch (e) {
  console.log(`Échec : ${e.message}`);
  process.exitCode = 1;
}
