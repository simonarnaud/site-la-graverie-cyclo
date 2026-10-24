// Flux iCalendar des sorties : les membres s'y abonnent depuis l'agenda de leur téléphone.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import club from '../data/club.json';
import { CATEGORIES, DISCIPLINES } from '../lib/categories';

// La durée n'est pas saisie : dans l'agenda, chaque événement occupe ce créneau par défaut
const DUREE_AGENDA_H = 3;

export const GET: APIRoute = async ({ site }) => {
  const sorties = await getCollection('sorties');
  const base = new URL(import.meta.env.BASE_URL.replace(/\/?$/, '/'), site);
  const maintenant = horodatage(new Date());

  const evenements = sorties.flatMap((s) => {
    const debut = s.data.date;
    const fin = new Date(debut.getTime() + DUREE_AGENDA_H * 3600_000);
    return [
      'BEGIN:VEVENT',
      `UID:${s.id}@${base.host}`,
      `DTSTAMP:${maintenant}`,
      `DTSTART:${horodatage(debut)}`,
      `DTEND:${horodatage(fin)}`,
      `SUMMARY:${echapper((s.data.annulee ? 'ANNULÉ – ' : '') + `${CATEGORIES[s.data.categorie].label} : ${s.data.titre}`)}`,
      `CATEGORIES:${[CATEGORIES[s.data.categorie].label, s.data.discipline && DISCIPLINES[s.data.discipline]].filter(Boolean).map((c) => echapper(c!)).join(',')}`,
      `LOCATION:${echapper(s.data.lieuRdv)}`,
      `URL:${new URL(`sorties/${s.id}/`, base)}`,
      `STATUS:${s.data.annulee ? 'CANCELLED' : 'CONFIRMED'}`,
      'END:VEVENT',
    ];
  });

  const lignes = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${club.nom}//Sorties//FR`,
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${echapper(`Sorties ${club.nom}`)}`,
    ...evenements,
    'END:VCALENDAR',
  ];

  return new Response(lignes.map(plier).join('\r\n') + '\r\n', {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
};

function horodatage(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function echapper(texte: string): string {
  return texte.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

// RFC 5545 : lignes de 75 octets maximum, continuation par un espace.
function plier(ligne: string): string {
  const octets = new TextEncoder().encode(ligne);
  if (octets.length <= 75) return ligne;
  const morceaux: string[] = [];
  let courant = '';
  for (const car of ligne) {
    const limite = morceaux.length === 0 ? 75 : 74;
    if (new TextEncoder().encode(courant + car).length > limite) {
      morceaux.push(courant);
      courant = car;
    } else {
      courant += car;
    }
  }
  morceaux.push(courant);
  return morceaux.join('\r\n ');
}
