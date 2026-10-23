// Archive les albums de plus de 12 mois : supprime leurs photos du site pour gagner de la place,
// mais garde l'album (titre, date) et son lien vers l'album complet (Google Photos…).
// Le 1er de chaque mois, les albums du 13e mois en arrière (et plus anciens) sont archivés :
// le site montre donc toujours au moins une année complète de photos.
// Lancé par .github/workflows/archiver-albums.yml, ou à la main :
//   node scripts/archiver-albums.mjs                   → archivage normal (mois courant)
//   node scripts/archiver-albums.mjs --mois 2027-11    → comme si on était en novembre 2027
//   node scripts/archiver-albums.mjs --essai           → affiche ce qui serait fait, sans rien modifier
import { readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';

const MOIS_CONSERVES = 12; // mois précédents gardés avec leurs photos, en plus du mois courant
const DOSSIER = 'src/content/albums';

const args = process.argv.slice(2);
const essai = args.includes('--essai');
const moisCourant = args.includes('--mois') ? args[args.indexOf('--mois') + 1] : moisDe(new Date());
if (!/^\d{4}-\d{2}$/.test(moisCourant)) throw new Error(`Mois invalide : ${moisCourant} (format attendu AAAA-MM)`);

// Les albums antérieurs à ce mois sont archivés (ex. en novembre 2027 : octobre 2026 et avant)
const premierMoisConserve = decaler(moisCourant, -MOIS_CONSERVES);

// Mois « AAAA-MM » dans le fuseau du club (un album du 31 au soir reste dans son mois)
function moisDe(date) {
  return new Date(date).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }).slice(0, 7);
}

function decaler(mois, n) {
  const [a, m] = mois.split('-').map(Number);
  const d = new Date(Date.UTC(a, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

let archives = 0;
let octetsLiberes = 0;

for (const nom of readdirSync(DOSSIER)) {
  const dossierAlbum = join(DOSSIER, nom);
  const fichierIndex = join(dossierAlbum, 'index.md');
  if (!statSync(dossierAlbum).isDirectory()) continue;

  const contenu = readFileSync(fichierIndex, 'utf-8');
  const [, frontmatter, corps] = contenu.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/) ?? [];
  if (frontmatter === undefined) {
    console.warn(`⚠ ${fichierIndex} : en-tête illisible, album ignoré`);
    continue;
  }
  const donnees = parse(frontmatter);
  if (donnees.archive === true || moisDe(donnees.date) >= premierMoisConserve) continue;

  // Toutes les photos de l'album sont rangées dans son dossier, à côté de index.md
  const photos = readdirSync(dossierAlbum).filter((f) => f !== 'index.md');
  const taille = photos.reduce((total, f) => total + statSync(join(dossierAlbum, f)).size, 0);
  console.log(`${essai ? '[essai] ' : ''}Archivage de « ${donnees.titre} » (${moisDe(donnees.date)}) : ${photos.length} photo(s), ${Math.round(taille / 1024)} Ko`);

  if (!essai) {
    for (const f of photos) rmSync(join(dossierAlbum, f), { recursive: true });
    donnees.photos = [];
    donnees.archive = true;
    writeFileSync(fichierIndex, `---\n${stringify(donnees, { lineWidth: 0 })}---\n${corps}`);
  }
  archives++;
  octetsLiberes += taille;
}

console.log(
  archives === 0
    ? `Aucun album à archiver (albums antérieurs à ${premierMoisConserve}).`
    : `${archives} album(s) ${essai ? 'à archiver' : 'archivé(s)'}, ${Math.round(octetsLiberes / 1024)} Ko ${essai ? 'à libérer' : 'libérés'} sur le site.`,
);
