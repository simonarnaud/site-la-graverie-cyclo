// Chargeur de contenus « tolérant » : une fiche invalide (champ refusé, image ou GPX introuvable…)
// est écartée du site au lieu de bloquer toute la publication. Chaque problème est noté dans
// .astro/etat-contenus.json, publié ensuite en /etat-publication.json et affiché dans le CMS.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { glob, type Loader } from 'astro/loaders';
import { lireGpx } from './gpx';

export interface ProblemeContenu {
  collection: string;
  id: string;
  titre?: string;
  fichier?: string;
  message: string;
}

const RAPPORT = join(process.cwd(), '.astro', 'etat-contenus.json');

// Libellés du CMS, pour des messages compréhensibles par les rédacteurs
const LIBELLES: Record<string, string> = {
  titre: 'Titre', date: 'Date', lieuRdv: 'Lieu / rendez-vous', categorie: 'Type', discipline: 'Discipline',
  parcours: "Parcours d'entraînement", gpx: 'Trace GPX', lienStrava: "Lien de l'événement Strava",
  lienInscription: "Lien d'inscription", couverture: 'Image', photos: 'Photos', lienAlbumComplet: "Lien vers l'album complet",
  fichier: 'Fichier PDF', auteur: 'Auteur', type: 'Type', section: 'Section',
};

export function lireRapport(): ProblemeContenu[] {
  if (!existsSync(RAPPORT)) return [];
  const parCollection = JSON.parse(readFileSync(RAPPORT, 'utf-8')) as Record<string, ProblemeContenu[]>;
  return Object.values(parCollection).flat();
}

function ecrireRapport(collection: string, problemes: ProblemeContenu[]) {
  const actuel = existsSync(RAPPORT) ? JSON.parse(readFileSync(RAPPORT, 'utf-8')) : {};
  actuel[collection] = problemes;
  mkdirSync(dirname(RAPPORT), { recursive: true });
  writeFileSync(RAPPORT, JSON.stringify(actuel, null, 2));
}

// Message d'erreur Astro/Zod → « Champ : explication », sans couleurs ni mise en forme
function messageLisible(erreur: unknown): string {
  const brut = erreur instanceof Error ? erreur.message : String(erreur);
  const lignes = brut
    .replace(/\x1b\[[0-9;]*m/g, '')
    .replace(/\*\*/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^[\w.]+\s*:/.test(l))
    .map((l) => {
      const [champ, ...reste] = l.split(':');
      const racine = champ.trim().split('.')[0];
      return `${LIBELLES[racine] ?? racine} : ${reste.join(':').trim()}`;
    });
  return lignes.length ? lignes.join(' ; ') : brut.split('\n')[0];
}

// Vérifie que les fichiers déclarés dans la fiche (images, GPX, PDF) existent bien dans son dossier,
// et que les GPX sont lisibles. `brut` : les valeurs telles qu'écrites par le CMS.
function verifierFichiers(brut: Record<string, unknown>, dossier: string): string | undefined {
  const vide = (v: unknown) => typeof v !== 'string' || v === '';
  const images: [string, unknown][] = [['couverture', brut.couverture]];
  if (Array.isArray(brut.photos)) brut.photos.forEach((p) => images.push(['photos', (p as { src?: unknown })?.src]));
  for (const [champ, nom] of images) {
    if (vide(nom) || /^https?:/.test(nom as string)) continue;
    if (!existsSync(join(dossier, nom as string))) return `${LIBELLES[champ]} : image « ${nom} » introuvable`;
  }
  for (const champ of ['gpx', 'fichier']) {
    const nom = brut[champ];
    if (vide(nom)) continue;
    const chemin = join(dossier, nom as string);
    if (!existsSync(chemin)) return `${LIBELLES[champ]} : fichier « ${nom} » introuvable`;
    if (champ === 'gpx') {
      try {
        if (lireGpx(chemin).points.length < 2) return `${LIBELLES.gpx} : la trace ne contient aucun point`;
      } catch {
        return `${LIBELLES.gpx} : fichier illisible (est-ce bien un GPX ?)`;
      }
    }
  }
}

export function globTolerant(options: { pattern: string; base: string }): Loader {
  const loader = glob(options);
  return {
    name: 'glob-tolerant',
    load: async (contexte) => {
      const problemes: ProblemeContenu[] = [];
      const ecartes = new Set<string>();

      const parseData: typeof contexte.parseData = async (props) => {
        const brut = props.data as Record<string, unknown>;
        const signaler = (message: string) => {
          ecartes.add(props.id);
          problemes.push({
            collection: contexte.collection,
            id: props.id,
            titre: typeof brut.titre === 'string' ? brut.titre : undefined,
            fichier: props.filePath && relative(process.cwd(), props.filePath).split(sep).join('/'),
            message,
          });
          contexte.logger.warn(`Contenu écarté : ${contexte.collection} → ${props.id} (${message})`);
        };
        // Fichiers d'abord : une image manquante ferait échouer la mise en ligne plus loin
        const probleme = props.filePath ? verifierFichiers(brut, dirname(props.filePath)) : undefined;
        if (probleme) {
          signaler(probleme);
          return props.data;
        }
        try {
          return await contexte.parseData(props);
        } catch (erreur) {
          signaler(messageLisible(erreur));
          return props.data; // la fiche ne sera pas enregistrée (voir store.set ci-dessous)
        }
      };

      // Les fiches écartées ne sont pas enregistrées : elles n'apparaissent nulle part sur le site
      const store = new Proxy(contexte.store, {
        get(cible, cle) {
          if (cle === 'set') {
            return (entree: Parameters<typeof cible.set>[0]) => {
              if (ecartes.has(entree.id)) {
                cible.delete(entree.id);
                return false;
              }
              return cible.set(entree);
            };
          }
          const valeur = Reflect.get(cible, cle);
          return typeof valeur === 'function' ? valeur.bind(cible) : valeur;
        },
      });

      // Toutes les fiches sont revérifiées à chaque mise en ligne (pas de cache) : une fiche mémorisée
      // lors d'une mise en ligne précédente ne doit pas échapper aux contrôles
      contexte.store.clear();
      await loader.load({ ...contexte, parseData, store });
      ecrireRapport(contexte.collection, problemes);
    },
  };
}
