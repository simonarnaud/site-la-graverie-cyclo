// Tests de lecture des programmes FSGT : npm run test:fsgt
// Pour ajouter un nouveau modèle de PDF : le copier dans exemples/ et ajouter un test ci-dessous.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { ErreurImport, lireProgramme } from './lire-programme.mjs';

const exemple = (nom) => readFileSync(new URL(`exemples/${nom}`, import.meta.url));
const trouver = (r, date, organisateur) => r.activites.find((a) => a.date === date && a.organisateur === organisateur);

test('tableau « période » sans année (sept.-oct. 2026)', async () => {
  const r = await lireProgramme(exemple('periode-sept-octobre-2026.pdf'), { reference: new Date('2026-10-24') });
  assert.match(r.format, /tableau/);
  assert.match(r.annee, /^2026 .*jours de la semaine/);
  assert.equal(r.activites.length, 8);
  assert.deepEqual(r.rejets, []);
  const audrieu = trouver(r, '2026-09-19', 'JC Audrieu');
  assert.equal(audrieu.heure, '13:30');
  assert.equal(audrieu.discipline, 'cyclo');
  assert.equal(audrieu.categorie, 'rando');
  assert.equal(audrieu.lieu, "Mairie d'Audrieu 5 rue des moutiers");
  assert.deepEqual(audrieu.details[0], ['DISTANCES (Km)', '65 et 85 kms']);
  const acpb = trouver(r, '2026-09-27', 'ACPB');
  assert.equal(acpb.discipline, 'vtt');
  assert.equal(acpb.heure, '08:00');
  // Activité sans lieu ni horaire : créée quand même
  const graverie = trouver(r, '2026-10-03', 'La Graverie Cyclo');
  assert.equal(graverie.heure, undefined);
  assert.equal(graverie.lieu, undefined);
});

test("l'année imposée est prioritaire, et un jour de semaine faux est signalé", async () => {
  const r = await lireProgramme(exemple('periode-sept-octobre-2026.pdf'), { reference: new Date('2026-10-24'), anneeImposee: 2025 });
  assert.equal(r.activites.length, 0);
  assert.equal(r.rejets.length, 8);
  assert.match(r.rejets[0].raison, /le PDF indique un samedi, mais le 19 septembre 2025 est un vendredi/);
});

test('grille annuelle à une colonne par discipline (saison 2022)', async () => {
  const r = await lireProgramme(exemple('programme-saison-2022.pdf'), { reference: new Date('2026-10-24') });
  assert.match(r.format, /grille/);
  assert.match(r.annee, /^2022 \(écrite/);
  assert.deepEqual(r.rejets, []);
  assert.equal(r.activites.length, 82);
  // Assemblée générale répétée dans les 4 colonnes : une seule activité
  assert.equal(r.activites.filter((a) => a.categorie === 'autre').length, 1);
  assert.equal(trouver(r, '2022-02-19', 'COLOMBELLES').categorie, 'rando');
  assert.equal(trouver(r, '2022-03-13', 'CAHAGNES (Bérigny)').categorie, 'course'); // colonne CYCLOSPORT
  assert.equal(trouver(r, '2022-03-13', 'AUDRIEU').discipline, 'vtt');
  assert.equal(trouver(r, '2022-01-09', 'MORTÉE (61) championnat dep 14/61').categorie, 'course'); // CYCLO CROSS
  // Mois qui continue d'une page à l'autre (juillet)
  assert.ok(trouver(r, '2022-07-02', 'LOUVIGNY'));
  assert.ok(trouver(r, '2022-07-03', 'Caen Chemin Vert (Le Mesnil Patry)'));
  assert.equal(trouver(r, '2022-07-26', 'Lisieux- VC (14h- critérium avant les pros)').heure, '14:00');
  assert.ok(trouver(r, '2022-11-27', 'St VIGOR (la St Vigorienne)'));
});

test('un fichier qui n’est pas un PDF donne une erreur compréhensible', async () => {
  await assert.rejects(lireProgramme(Buffer.from('pas un pdf')), (e) => e instanceof ErreurImport && /pas un PDF lisible/.test(e.message));
});
