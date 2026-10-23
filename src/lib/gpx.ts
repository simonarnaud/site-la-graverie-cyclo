// Lecture des traces GPX au build : distance, dénivelé positif, tracé simplifié pour la carte
// et profil d'altitude.
import { readFileSync } from 'node:fs';
import { DOMParser } from '@xmldom/xmldom';
import { gpx } from '@tmcw/togeojson';

export interface TraceGpx {
  distanceKm: number;
  deniveleM: number;
  // [lat, lon] simplifiés, prêts pour Leaflet
  points: [number, number][];
  // [km, altitude en m] simplifiés pour le profil ; vide si le GPX n'a pas d'altitudes
  profil: [number, number][];
}

const POINTS_MAX = 1500;
const POINTS_PROFIL_MAX = 300;
// Seuil d'hystérésis : ignore le bruit d'altitude des GPS
const SEUIL_DENIVELE_M = 3;

// `chemin` : chemin du fichier sur le disque (voir cheminFichier() dans src/lib/fichiers.ts)
export function lireGpx(chemin: string): TraceGpx {
  const xml = readFileSync(chemin, 'utf-8');
  const geojson = gpx(new DOMParser().parseFromString(xml, 'text/xml') as unknown as Document);

  const coords: number[][] = [];
  for (const f of geojson.features) {
    const g = f.geometry;
    if (g?.type === 'LineString') coords.push(...g.coordinates);
    else if (g?.type === 'MultiLineString') g.coordinates.forEach((l) => coords.push(...l));
  }

  let distance = 0;
  let denivele = 0;
  let altRef = coords[0]?.[2];
  const profilComplet: [number, number][] = altRef !== undefined ? [[0, altRef]] : [];
  for (let i = 1; i < coords.length; i++) {
    distance += haversine(coords[i - 1], coords[i]);
    const alt = coords[i][2];
    if (alt !== undefined) profilComplet.push([distance / 1000, alt]);
    if (alt !== undefined && altRef !== undefined) {
      if (alt - altRef >= SEUIL_DENIVELE_M) {
        denivele += alt - altRef;
        altRef = alt;
      } else if (altRef - alt >= SEUIL_DENIVELE_M) {
        altRef = alt;
      }
    }
  }

  const pas = Math.max(1, Math.ceil(coords.length / POINTS_MAX));
  const points = coords
    .filter((_, i) => i % pas === 0 || i === coords.length - 1)
    .map(([lon, lat]) => [round(lat), round(lon)] as [number, number]);

  const pasProfil = Math.max(1, Math.ceil(profilComplet.length / POINTS_PROFIL_MAX));
  const profil = profilComplet
    .filter((_, i) => i % pasProfil === 0 || i === profilComplet.length - 1)
    .map(([km, alt]) => [Math.round(km * 100) / 100, Math.round(alt)] as [number, number]);

  return { distanceKm: Math.round(distance / 100) / 10, deniveleM: Math.round(denivele), points, profil };
}

function haversine([lon1, lat1]: number[], [lon2, lat2]: number[]): number {
  const R = 6371000;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function round(n: number): number {
  return Math.round(n * 1e5) / 1e5;
}
