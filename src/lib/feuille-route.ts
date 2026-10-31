// Feuille de route d'un parcours imprimé : le GPX ne contient qu'une suite de points. Au clic sur « Imprimer »,
// le service libre Valhalla (FOSSGIS, données OpenStreetMap) les recale sur les routes et rédige les indications.
const SERVICE = 'https://valhalla1.openstreetmap.de/trace_route';
const DELAI_MS = 10000;
// En dessous de cette part de la trace reconnue sur les routes, les indications seraient trompeuses
const COUVERTURE_MIN = 0.85;

export interface Indication {
  km: number; // distance depuis le départ
  sens: string; // flèche
  texte: string;
}

interface Manoeuvre {
  type: number;
  instruction: string;
  length: number; // km
}

// Types de manœuvres de Valhalla
const SORTIE_ROND_POINT = 27; // redit la sortie déjà annoncée à l'entrée du rond-point
const FLECHES: Record<number, string> = {
  1: '↑', 2: '→', 3: '←', 4: '⚑', 5: '⚑', 6: '⚑',
  9: '↗', 10: '→', 11: '→', 12: '↶', 13: '↶', 14: '←', 15: '←', 16: '↖',
  18: '↗', 19: '↖', 20: '↗', 21: '↖', 23: '↗', 24: '↖', 26: '↻', 37: '↗', 38: '↖',
};

// Phrases raccourcies : la feuille se lit en roulant et doit tenir sur le moins de lignes possible
function abreger(instruction: string): string {
  return instruction
    .replace(/\.\s*$/, '')
    .replace(/\. Continuez sur .*$/, '')
    .replace(/^Entrez dans .+? et prenez la (\d+)\S* sortie(?: dans| vers)?\s*(.*)$/, (_, n, suite) =>
      `Rond-point : ${n === '1' ? '1re' : `${n}e`} sortie${suite ? `, ${suite}` : ''}`,
    )
    .replace(/^Tournez à (droite|gauche)/, 'À $1')
    .replace(/^Serrez à (droite|gauche)/, 'Légèrement à $1')
    .replace(/^(À|Légèrement à) (droite|gauche) dans /, '$1 $2, ')
    .replace(/^Pédalez vers/, 'Départ vers')
    .replace(/^Vous êtes arrivé.*$/, 'Arrivée')
    .replace(/\//g, ' / ');
}

export function mettreEnForme(manoeuvres: Manoeuvre[]): Indication[] {
  let km = 0;
  const indications: Indication[] = [];
  for (const m of manoeuvres) {
    if (m.type !== SORTIE_ROND_POINT) {
      indications.push({
        km: Math.round(km * 10) / 10,
        sens: FLECHES[m.type] ?? '↑',
        texte: abreger(m.instruction),
      });
    }
    km += m.length;
  }
  return indications;
}

// Renvoie les indications, ou null si le service est injoignable ou ne reconnaît pas la trace
export async function chercherIndications(points: [number, number][], distanceKm: number): Promise<Indication[] | null> {
  try {
    const reponse = await fetch(SERVICE, {
      method: 'POST',
      signal: AbortSignal.timeout(DELAI_MS),
      body: JSON.stringify({
        shape: points.map(([lat, lon]) => ({ lat, lon })),
        costing: 'bicycle',
        shape_match: 'map_snap',
        // Tolérance large : avec les réglages par défaut, certaines traces s'arrêtent à mi-parcours
        trace_options: { gps_accuracy: 25, search_radius: 60 },
        directions_options: { language: 'fr-FR', units: 'kilometers' },
      }),
    });
    if (!reponse.ok) return null;
    const { trip } = await reponse.json();
    if (trip.summary.length < distanceKm * COUVERTURE_MIN) return null;
    return mettreEnForme(trip.legs.flatMap((l: { maneuvers: Manoeuvre[] }) => l.maneuvers));
  } catch {
    return null;
  }
}
