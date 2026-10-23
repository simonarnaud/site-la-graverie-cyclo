// Archive les albums des années précédentes : supprime leurs photos du site pour gagner de la place,
// mais garde l'album (titre, date) et son lien vers l'album complet (Google Photos…).
// Lancé chaque 1er janvier par .github/workflows/archiver-albums.yml, ou à la main :
//   node scripts/archiver-albums.mjs              → archive les albums antérieurs à l'année en cours
//   node scripts/archiver-albums.mjs --annee 2027 → comme si on était en 2027
//   node scripts/archiver-albums.mjs --essai      → affiche ce qui serait fait, sans rien modifier
import { readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';

const args = process.argv.slice(2);
const essai = args.includes('--essai');
const anneeArg = args[args.indexOf('--annee') + 1];
const anneeCourante = args.includes('--annee') ? Number(anneeArg) : Number(anneeDe(new Date()));
const DOSSIER = 'src/content/albums';

// Année dans le fuseau du club (un album du 31 décembre au soir reste dans son année)
function anneeDe(date) {
  return new Date(date).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', year: 'numeric' });
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
  if (donnees.archive === true || Number(anneeDe(donnees.date)) >= anneeCourante) continue;

  // Toutes les photos de l'album sont rangées dans son dossier, à côté de index.md
  const photos = readdirSync(dossierAlbum).filter((f) => f !== 'index.md');
  const taille = photos.reduce((total, f) => total + statSync(join(dossierAlbum, f)).size, 0);
  console.log(`${essai ? '[essai] ' : ''}Archivage de « ${donnees.titre} » (${anneeDe(donnees.date)}) : ${photos.length} photo(s), ${Math.round(taille / 1024)} Ko`);

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
    ? `Aucun album à archiver (albums antérieurs à ${anneeCourante}).`
    : `${archives} album(s) ${essai ? 'à archiver' : 'archivé(s)'}, ${Math.round(octetsLiberes / 1024)} Ko ${essai ? 'à libérer' : 'libérés'} sur le site.`,
);
