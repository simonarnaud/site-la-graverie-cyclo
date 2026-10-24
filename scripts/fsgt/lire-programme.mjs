// Lecture d'un programme FSGT en PDF → liste d'activités.
// Le texte du PDF est lu avec sa position (x, y) sur la page, puis le tableau est reconstitué :
//   1. on cherche la ligne d'en-tête (celle qui contient la cellule « DATE ») et ses colonnes ;
//   2. deux mises en page sont reconnues :
//      - « tableau » : une ligne par activité (date, club, lieu, distances, heure…) ;
//      - « grille »  : une ligne par jour et une colonne par discipline (CYCLO, VTT, CYCLO CROSS…),
//                      les mois étant écrits dans une colonne « MOIS » ;
//   3. l'année, souvent absente, est déduite des jours de la semaine (« Sam 19 Sept » → 2026).
// Toute ligne incomprise est signalée (jamais ignorée en silence) pour que l'admin sache quoi saisir à la main.
// Tests : scripts/fsgt/lire-programme.test.mjs ; essai sur un PDF : node scripts/importer-fsgt.mjs --essai fichier.pdf
import { getDocumentProxy } from 'unpdf';

export class ErreurImport extends Error {}

const JOURS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
const NOMS_MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

const sansAccents = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '');
const normaliser = (t) => sansAccents(t).toLowerCase().replace(/\s+/g, ' ').trim();
const nettoyer = (t) => t.replace(/\s+/g, ' ').replace(/\s+([,.)])/g, '$1').replace(/\(\s+/g, '(').trim();

// « Sept », « septembre », « Févr. » → 8, 1… (index 0-11), sinon -1
function numeroMois(mot) {
  const m = normaliser(mot).replace(/\.$/, '');
  if (m.length < 3 || m === 'jui') return -1;
  return NOMS_MOIS.findIndex((nom) => sansAccents(nom).startsWith(m));
}

function numeroJour(mot) {
  return JOURS.indexOf(normaliser(mot).slice(0, 3));
}

// ─── 1. Lecture du PDF ────────────────────────────────────────────────────────────────

export async function lireElements(octets) {
  let pdf;
  try {
    pdf = await getDocumentProxy(new Uint8Array(octets));
  } catch (e) {
    if (/password/i.test(e?.name + e?.message)) throw new ErreurImport('Le PDF est protégé par un mot de passe : impossible de le lire.');
    throw new ErreurImport(`Le fichier n'est pas un PDF lisible (${e?.message ?? e}). Vérifiez qu'il s'ouvre normalement sur un ordinateur.`);
  }
  const pages = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const contenu = await (await pdf.getPage(n)).getTextContent();
    pages.push(
      contenu.items
        .filter((it) => it.str?.trim())
        .map((it) => ({ texte: it.str.trim(), x: it.transform[4], y: it.transform[5], l: it.width, page: n })),
    );
  }
  if (!pages.some((p) => p.length)) {
    throw new ErreurImport(
      "Le PDF ne contient pas de texte : c'est probablement un scan ou une image. Il faut le PDF d'origine (exporté depuis Word/Excel) ou saisir les activités à la main.",
    );
  }
  return pages;
}

// ─── 2. En-tête et colonnes ───────────────────────────────────────────────────────────

const centre = (el) => el.x + el.l / 2;

// Cherche la ligne d'en-tête d'une page : la cellule « DATE » et les intitulés courts à la même hauteur
// (un intitulé sur deux lignes, comme « DISTANCES (Km) », forme une seule colonne).
export function trouverEntete(elements) {
  const date = elements.find((el) => /^dates?$/i.test(el.texte));
  if (!date) return undefined;
  // Intitulés : un peu au-dessus ou juste en dessous de « DATE », courts, et qui ne sont pas déjà des données (« dim 2 »)
  const bande = elements.filter(
    (el) => el.y - date.y <= 12 && date.y - el.y <= 6 && el.texte.length <= 45 && !/^\d{1,2}$/.test(el.texte) && numeroJour(el.texte) < 0,
  );
  const colonnes = [];
  for (const el of [...bande].sort((a, b) => b.y - a.y)) {
    const col = colonnes.find((c) => el.x < c.x1 && el.x + el.l > c.x0);
    if (col) {
      col.x0 = Math.min(col.x0, el.x);
      col.x1 = Math.max(col.x1, el.x + el.l);
      col.morceaux.push(el.texte);
    } else colonnes.push({ x0: el.x, x1: el.x + el.l, morceaux: [el.texte] });
  }
  colonnes.sort((a, b) => a.x0 - b.x0);
  for (const c of colonnes) c.intitule = nettoyer(c.morceaux.join(' '));
  const haut = Math.max(...bande.map((el) => el.y));
  const bas = Math.min(...bande.map((el) => el.y));
  return { colonnes, haut, bas, bande };
}

// Colonne qui contient le centre de l'élément, sinon la plus proche
function colonneDe(el, colonnes) {
  const cx = centre(el);
  let meilleure;
  let distance = Infinity;
  for (const c of colonnes) {
    const d = cx < c.x0 ? c.x0 - cx : cx > c.x1 ? cx - c.x1 : 0;
    if (d < distance) [meilleure, distance] = [c, d];
  }
  return meilleure;
}

// Discipline et type d'activité d'après un intitulé de colonne ou un texte
export function disciplineDe(texte) {
  const t = normaliser(texte);
  if (/cyclo\s*-?\s*cross/.test(t)) return { discipline: 'vtt', categorie: 'course' };
  if (/cyclosport/.test(t)) return { discipline: 'cyclo', categorie: 'course' };
  if (/\bvtt\b/.test(t)) return { discipline: 'vtt' };
  if (/gravel/.test(t)) return { discipline: 'gravel' };
  if (/\b(cyclo|route)\b/.test(t)) return { discipline: 'cyclo' };
  return undefined;
}

const MOTS_COURSE = /championnat|national|criterium|\bclm\b|contre.la.montre|vetathlon|cyclosport|\bcourse\b/;
const estAssemblee = (t) => /assemblee generale/.test(normaliser(t));

// Texte d'une cellule : éléments lus de haut en bas, puis de gauche à droite
function texteCellule(elements) {
  return nettoyer(
    [...elements]
      .sort((a, b) => (Math.abs(a.y - b.y) > 3 ? b.y - a.y : a.x - b.x))
      .map((el) => el.texte)
      .join(' '),
  );
}

// Rattache chaque élément à la ligne (date) la plus proche verticalement
function repartirParLigne(elements, lignes) {
  for (const el of elements) {
    let proche;
    let distance = Infinity;
    for (const l of lignes) {
      const d = Math.abs(l.y - el.y);
      if (d < distance) [proche, distance] = [l, d];
    }
    proche?.elements.push(el);
  }
}

// ─── 3. Mise en page « tableau » : une ligne par activité ─────────────────────────────

const RE_DATE_TEXTE = /^(?:(lun|mar|mer|jeu|ven|sam|dim)[a-z]*\.?\s+)?(\d{1,2})(?:er)?\s+([a-zéèûô]+\.?)(?:\s+(\d{4}))?/i;
const RE_DATE_CHIFFRES = /^(?:(lun|mar|mer|jeu|ven|sam|dim)[a-z]*\.?\s+)?(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?/i;

function lireDate(texte) {
  const t = sansAccents(texte).trim();
  let m = t.match(RE_DATE_CHIFFRES);
  if (m) {
    const annee = m[4] ? (m[4].length === 2 ? 2000 + Number(m[4]) : Number(m[4])) : undefined;
    return { joursem: m[1] ? numeroJour(m[1]) : -1, jour: Number(m[2]), mois: Number(m[3]) - 1, annee };
  }
  m = t.match(RE_DATE_TEXTE);
  if (m && numeroMois(m[3]) >= 0) {
    return { joursem: m[1] ? numeroJour(m[1]) : -1, jour: Number(m[2]), mois: numeroMois(m[3]), annee: m[4] ? Number(m[4]) : undefined };
  }
  return undefined;
}

function roleColonne(intitule) {
  const t = normaliser(intitule);
  if (/^dates?$/.test(t)) return 'date';
  if (/club|organisat/.test(t)) return 'organisateur';
  if (/lieu|rendez|\brdv\b|\brv\b/.test(t)) return 'lieu';
  if (/heure|horaire/.test(t)) return 'heure';
  if (/discipline|activite|type/.test(t)) return 'discipline';
  return 'detail';
}

function lireTableau(page, entete, avertir) {
  const colonnes = entete.colonnes.map((c) => ({ ...c, role: roleColonne(c.intitule) }));
  const colDate = colonnes.find((c) => c.role === 'date');
  const donnees = page.filter((el) => el.y < entete.bas - 2);
  const lignes = [];
  const restants = [];
  for (const el of donnees) {
    const date = colonneDe(el, colonnes) === colDate ? lireDate(el.texte) : undefined;
    if (date) lignes.push({ y: el.y, date, brut: el.texte, elements: [] });
    else restants.push(el);
  }
  if (!lignes.length) return [];
  // Les éléments situés sous la dernière ligne, trop loin, n'appartiennent pas au tableau (bas de page)
  const ecart = lignes.length > 1 ? Math.max(...lignes.slice(1).map((l, i) => lignes[i].y - l.y)) : 60;
  const basTableau = Math.min(...lignes.map((l) => l.y)) - ecart;
  repartirParLigne(restants.filter((el) => el.y > basTableau), lignes);

  return lignes.map((ligne) => {
    const activite = { date: ligne.date, source: `page ${page[0].page}, ligne « ${ligne.brut} »`, details: [] };
    // Une cellule ne contenant qu'un nom de discipline (« Route », « VTT ») donne la discipline
    const cellules = new Map();
    for (const el of ligne.elements) {
      const d = /^(route|cyclo|vtt|gravel|gravelle|cyclo-?cross|cyclosport)$/i.test(el.texte) ? disciplineDe(el.texte) : undefined;
      if (d) Object.assign(activite, d);
      else {
        const col = colonneDe(el, colonnes);
        cellules.set(col, [...(cellules.get(col) ?? []), el]);
      }
    }
    for (const col of colonnes) {
      const texte = cellules.has(col) ? texteCellule(cellules.get(col)) : '';
      if (!texte || col.role === 'date') continue;
      if (col.role === 'organisateur') activite.organisateur = texte;
      else if (col.role === 'lieu') activite.lieu = texte;
      else if (col.role === 'heure') {
        activite.heure = lireHeure(texte);
        if (!activite.heure || texte.replace(/\d{1,2}\s*[hH:]\s*\d{0,2}/, '').trim()) activite.details.push([col.intitule, texte]);
      } else if (col.role === 'discipline') Object.assign(activite, disciplineDe(texte) ?? {});
      else activite.details.push([col.intitule, texte]);
    }
    if (!activite.heure && activite.lieu) activite.heure = lireHeure(activite.lieu);
    // Pas de colonne « discipline » : « VTT » ou « Gravel » écrit ailleurs dans la ligne suffit
    // (pas « route » ni « cyclo », trop fréquents dans les adresses et les noms de clubs)
    if (!activite.discipline) {
      const texte = normaliser([activite.organisateur, activite.lieu, ...activite.details.map((d) => d[1])].join(' '));
      if (/\bvtt\b/.test(texte)) activite.discipline = 'vtt';
      else if (/\bgravel/.test(texte)) activite.discipline = 'gravel';
    }
    return activite;
  });
}

function lireHeure(texte) {
  const m = texte.match(/\b([01]?\d|2[0-3])\s*[hH:]\s*([0-5]\d)?\b/);
  return m ? `${m[1].padStart(2, '0')}:${m[2] ?? '00'}` : undefined;
}

// ─── 4. Mise en page « grille » : un jour par ligne, une colonne par discipline ───────

function lireGrille(page, entete, avertir) {
  const colonnes = entete.colonnes.map((c) => {
    const t = normaliser(c.intitule);
    if (/^dates?$/.test(t)) return { ...c, role: 'date' };
    if (/^mois$/.test(t)) return { ...c, role: 'mois' };
    const d = disciplineDe(c.intitule);
    return d ? { ...c, role: 'discipline', ...d } : { ...c, role: 'autre' };
  });
  const donnees = page.filter((el) => el.y < entete.bas - 2);
  const parRole = (role) => donnees.filter((el) => colonneDe(el, colonnes).role === role);

  // Lignes : numéro du jour, associé au nom du jour (« sam ») le plus proche à la même hauteur
  const numeros = parRole('date').filter((el) => /^\d{1,2}$/.test(el.texte));
  const nomsJours = parRole('date').filter((el) => numeroJour(el.texte) >= 0 && /^[a-z]{3,8}\.?$/i.test(el.texte));
  const libres = new Set(nomsJours);
  const lignes = numeros
    .sort((a, b) => b.y - a.y)
    .map((num) => {
      const nom = [...libres].filter((n) => Math.abs(n.y - num.y) <= 6).sort((a, b) => Math.abs(a.y - num.y) - Math.abs(b.y - num.y))[0];
      libres.delete(nom);
      return { y: nom?.y ?? num.y, jour: Number(num.texte), joursem: nom ? numeroJour(nom.texte) : -1, page: num.page, elements: [] };
    });
  const mois = parRole('mois')
    .map((el) => ({ y: el.y, mois: numeroMois(el.texte.replace(/\.$/, '')) }))
    .filter((m) => m.mois >= 0);
  repartirParLigne(donnees.filter((el) => colonneDe(el, colonnes).role === 'discipline'), lignes);
  for (const l of lignes) {
    l.cellules = colonnes
      .filter((c) => c.role === 'discipline')
      .map((c) => ({ colonne: c, texte: texteCellule(l.elements.filter((el) => colonneDe(el, colonnes) === c)) }))
      .filter((c) => c.texte);
  }
  return { lignes, mois };
}

// Les mois de la grille : un nouveau mois commence quand le numéro du jour redescend (30 → 5).
// Le nom du mois, écrit au milieu de son bloc, donne le mois de chaque bloc.
function datesGrille(lignes, etiquettes, avertir) {
  const blocs = [];
  let precedent = Infinity;
  for (const l of lignes) {
    if (l.jour < precedent) blocs.push({ lignes: [] });
    blocs.at(-1).lignes.push(l);
    precedent = l.jour;
  }
  for (const e of etiquettes) {
    let proche;
    let distance = Infinity;
    for (const b of blocs) for (const l of b.lignes) {
      const d = l.page === e.page ? Math.abs(l.y - e.y) : Infinity;
      if (d < distance) [proche, distance] = [b, d];
    }
    if (proche) proche.mois ??= e.mois;
  }
  const premier = blocs.findIndex((b) => b.mois !== undefined);
  if (premier < 0) throw new ErreurImport('Grille reconnue, mais aucun nom de mois (JANVIER, FÉVRIER…) n\'a été trouvé dans la colonne MOIS.');
  blocs.forEach((b, i) => {
    const attendu = (((blocs[premier].mois + i - premier) % 12) + 12) % 12;
    if (b.mois !== undefined && b.mois !== attendu) {
      avertir(`Mois incohérents dans la grille autour de « ${NOMS_MOIS[b.mois]} » : vérifiez les activités de ${NOMS_MOIS[attendu]} et ${NOMS_MOIS[b.mois]}.`);
    }
    b.mois = attendu;
    for (const l of b.lignes) l.date = { jour: l.jour, mois: b.mois, joursem: l.joursem };
  });
}

// ─── 5. Année ─────────────────────────────────────────────────────────────────────────

// Attribue une année à chaque date (dans l'ordre du document : quand le mois redescend, on passe
// à l'année suivante). Année de départ : imposée, sinon écrite dans le PDF, sinon celle qui fait
// correspondre le plus de jours de la semaine (« Sam 19 Sept »), au plus près de la date de l'import.
function attribuerAnnees(dates, { anneeImposee, anneeTexte, reference }) {
  const essayer = (depart) => {
    let annee = depart;
    let moisPrecedent = -1;
    let accords = 0;
    const resultat = dates.map((d) => {
      if (d.annee) annee = d.annee;
      else if (d.mois < moisPrecedent) annee++;
      moisPrecedent = d.mois;
      const vraie = new Date(Date.UTC(annee, d.mois, d.jour));
      if (d.joursem >= 0 && vraie.getUTCDay() === d.joursem && vraie.getUTCDate() === d.jour) accords++;
      return annee;
    });
    return { depart, resultat, accords };
  };
  const avecJour = dates.filter((d) => d.joursem >= 0).length;
  if (anneeImposee) return { ...essayer(anneeImposee), origine: 'imposee' };
  if (anneeTexte) {
    const essai = essayer(anneeTexte);
    if (!avecJour || essai.accords >= avecJour / 2) return { ...essai, origine: 'texte' };
  }
  const annee = reference.getUTCFullYear();
  if (!avecJour) {
    // Pas de jour de la semaine pour vérifier : année de l'import (ou la suivante si les dates sont déjà passées)
    const premiere = dates[0];
    const passe = premiere && Date.UTC(annee, premiere.mois, premiere.jour) < reference.getTime() - 60 * 86400000;
    return { ...essayer(passe ? annee + 1 : annee), origine: 'supposee' };
  }
  const essais = [annee, annee + 1, annee - 1, annee + 2].map(essayer).sort((a, b) => b.accords - a.accords);
  if (!essais[0].accords) {
    throw new ErreurImport(
      "Impossible de deviner l'année : aucun jour de la semaine du PDF ne correspond à une année proche. Indiquez l'année dans le champ « Année » de l'import, puis relancez.",
    );
  }
  return { ...essais[0], origine: 'deduite' };
}

const anneeDuTexte = (elements) => {
  const annees = elements.flatMap((el) => el.texte.match(/\b20\d{2}\b/g) ?? []).map(Number);
  if (!annees.length) return undefined;
  const nombre = new Map();
  for (const a of annees) nombre.set(a, (nombre.get(a) ?? 0) + 1);
  return [...nombre].sort((a, b) => b[1] - a[1])[0][0];
};

// ─── 6. Point d'entrée ────────────────────────────────────────────────────────────────

/**
 * @param {Uint8Array|Buffer} octets contenu du PDF
 * @param {{ anneeImposee?: number, reference?: Date, nomFichier?: string }} options
 * @returns {{ format: string, annee: string, activites: object[], rejets: {source: string, raison: string}[], avertissements: string[] }}
 */
export async function lireProgramme(octets, { anneeImposee, reference = new Date(), nomFichier = '' } = {}) {
  const pages = await lireElements(octets);
  const avertissements = [];
  const avertir = (m) => avertissements.includes(m) || avertissements.push(m);
  const rejets = [];

  const entetes = pages.map((p) => (p.length ? trouverEntete(p) : undefined));
  if (!entetes.some(Boolean)) {
    throw new ErreurImport(
      "Mise en page non reconnue : aucun tableau avec une colonne « DATE » n'a été trouvé. Transmettez ce PDF au responsable du site pour qu'il ajoute ce format.",
    );
  }
  // Texte au-dessus des en-têtes (titre, « SAISON 2022 »…) : on y cherche l'année
  const titres = pages.flatMap((p, i) => (entetes[i] ? p.filter((el) => el.y > entetes[i].haut) : []));
  const anneeTexte = anneeDuTexte(titres);
  const contexte = normaliser([...titres.map((el) => el.texte), nomFichier].join(' '));
  const grille = entetes.some((e) => e && e.colonnes.filter((c) => disciplineDe(c.intitule)).length >= 2);

  let brutes = [];
  if (grille) {
    const lignes = [];
    const etiquettes = [];
    pages.forEach((p, i) => {
      if (!entetes[i]) return;
      const { lignes: l, mois } = lireGrille(p, entetes[i], avertir);
      lignes.push(...l);
      etiquettes.push(...mois.map((m) => ({ ...m, page: i + 1 })));
    });
    if (!lignes.length) throw new ErreurImport("Grille reconnue, mais aucune date (« sam 8 »…) n'a été trouvée dans la colonne DATE.");
    datesGrille(lignes, etiquettes, avertir);
    for (const l of lignes) {
      const vues = new Set();
      for (const { colonne, texte } of l.cellules) {
        if (estAssemblee(texte)) {
          // Même assemblée générale répétée dans chaque colonne : une seule activité
          if (vues.has('ag')) continue;
          vues.add('ag');
          brutes.push({ date: l.date, titre: texte, categorie: 'autre', organisateur: 'FSGT', details: [], source: `page ${l.page}, ${texte}` });
          continue;
        }
        brutes.push({
          date: l.date,
          organisateur: texte,
          discipline: colonne.discipline,
          categorie: colonne.categorie ?? (MOTS_COURSE.test(normaliser(texte)) ? 'course' : 'rando'),
          heure: lireHeure(texte),
          details: [],
          source: `page ${l.page}, ${JOURS[l.joursem] ?? ''} ${l.jour} ${NOMS_MOIS[l.date.mois]}, colonne « ${colonne.intitule} » : ${texte}`,
        });
      }
    }
  } else {
    pages.forEach((p, i) => {
      if (entetes[i]) brutes.push(...lireTableau(p, entetes[i], avertir));
    });
    if (!brutes.length) {
      throw new ErreurImport("Tableau reconnu, mais aucune date n'a été comprise dans la colonne DATE (formats attendus : « Sam 19 Sept », « 19/09/2026 »).");
    }
    const parDefaut = /course|cyclosport|championnat/.test(contexte) && !/rando|brevet/.test(contexte) ? 'course' : 'rando';
    for (const a of brutes) {
      const texte = normaliser([a.organisateur, a.lieu, ...a.details.map((d) => d[1])].join(' '));
      a.categorie = estAssemblee(texte) ? 'autre' : (a.categorie ?? (MOTS_COURSE.test(texte) ? 'course' : parDefaut));
    }
  }

  // Années, puis contrôle de chaque date
  const { resultat, origine, depart } = attribuerAnnees(
    brutes.map((a) => a.date),
    { anneeImposee, anneeTexte, reference },
  );
  const activites = [];
  brutes.forEach((a, i) => {
    const { jour, mois, joursem } = a.date;
    const annee = resultat[i];
    const vraie = new Date(Date.UTC(annee, mois, jour));
    const libelle = `${jour} ${NOMS_MOIS[mois]} ${annee}`;
    if (vraie.getUTCDate() !== jour || vraie.getUTCMonth() !== mois) {
      return rejets.push({ source: a.source, raison: `le ${jour} ${NOMS_MOIS[mois]} n'existe pas` });
    }
    if (joursem >= 0 && vraie.getUTCDay() !== joursem) {
      const jourNom = vraie.toLocaleDateString('fr-FR', { weekday: 'long', timeZone: 'UTC' });
      return rejets.push({ source: a.source, raison: `le PDF indique un ${NOMS_JOURS[joursem]}, mais le ${libelle} est un ${jourNom}` });
    }
    activites.push({ ...a, date: `${annee}-${String(mois + 1).padStart(2, '0')}-${String(jour).padStart(2, '0')}` });
  });
  const anneeLue = {
    imposee: `${depart} (champ « Année » de l'import)`,
    texte: `${anneeTexte} (écrite dans le PDF)`,
    deduite: `${depart} (déduite des jours de la semaine)`,
    supposee: `${depart} (supposée : le PDF n'indique ni l'année ni les jours, vérifiez les dates)`,
  }[origine];
  if (origine === 'supposee') avertir("L'année n'est pas écrite dans le PDF et n'a pas pu être vérifiée : contrôlez les dates des activités créées.");
  return { format: grille ? 'grille (une colonne par discipline)' : 'tableau (une ligne par activité)', annee: anneeLue, activites, rejets, avertissements };
}

const NOMS_JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
