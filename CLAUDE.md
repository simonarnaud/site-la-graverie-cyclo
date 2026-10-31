# Site web du club de vélo

Site statique du club, pensé pour être **maintenu par des bénévoles non-développeurs** et transmissible.
Détails, justifications et alternatives : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Contraintes non négociables
- **Tout gratuit** (seule dépense prévue : le nom de domaine, ~10-15 €/an, au nom de l'association).
- **Pas de backend.** Tout ce qui est dynamique passe par des services externes.
- **Repo public** (GitHub Pages gratuit) → **aucune donnée personnelle de membre commitée**, ni dans l'historique.
- Les non-devs publient via le **CMS**, jamais en touchant au code.
- Images optimisées au build ; galeries complètes hébergées ailleurs (liens externes).
- RGPD : mentions légales + politique de confidentialité ; pas de traceur → pas de bandeau cookies.

## Stack
- **Astro** (content collections typées Zod, `astro:assets` + sharp pour les images, îles JS seulement si nécessaire).
- **Sveltia CMS** dans `public/admin/` (auth GitHub via relais `sveltia-cms-auth` sur Cloudflare Workers, ou PAT).
  Plan B : **Pages CMS** (invitation par email, sans compte GitHub). Le contenu reste du Markdown standard → CMS interchangeable.
- **GitHub Pages** déployé par **GitHub Actions** à chaque push sur `main` + rebuild quotidien (cron) + manuel.
- Cartes : **Leaflet**, fond **Plan IGN** (gratuit, sans clé, `src/lib/fond-carte.ts`), uniquement sur les pages parcours et traces, plus une petite carte de situation sur la page du club (`src/components/CarteLocalisation.astro`). Tracé simplifié, distance et D+ calculés au build depuis le GPX.
- Impression d'un parcours : feuille de route (indications de navigation) demandée à l'API publique **Valhalla** depuis le navigateur, au clic sur « Imprimer » (`src/lib/feuille-route.ts`) ; sans réponse, impression sans feuille de route. Pages de carte zoomées le long de la trace (`src/components/AtlasTrace.astro`), 6 pages au plus.
- Contact : `mailto:` vers une adresse du club (formulaire Web3Forms/Formspree seulement si besoin, à déclarer RGPD).
- Participation aux événements : champ `lienStrava` (événement créé au préalable dans le club Strava, validé strava.com / strava.app.link) → bouton « Je participe sur Strava ». `lienInscription` facultatif = inscription chez un organisateur extérieur (rando, course). Vote maison (Firebase/Supabase) = v2 éventuelle, pas avant.
- Flux calendrier `/sorties.ics` généré au build.
- Adhésions : lien/widget HelloAsso (optionnel au début).
- Stats : GoatCounter (sans cookie), activé seulement si `goatcounter` est renseigné dans `src/data/club.json` ; la page confidentialité s'adapte automatiquement.

## Organisation
- Démarrage sur le **GitHub perso** du mainteneur, transfert prévu vers une **organisation GitHub du club** (Settings → Transfer ; les redirections sont conservées).
- **Chaque fiche a son dossier `<id>/index.md` avec ses fichiers** (images, `trace.gpx`, PDF) : supprimer une fiche dans le CMS supprime ses fichiers. GPX publiés via `src/pages/gpx/[id].gpx.ts`, PDF via `src/pages/documents/[id].pdf.ts` (`src/lib/fichiers.ts`).
- Collections : `sorties` (dossiers datés, champ `categorie` : entrainement (vert) | rando (« Rando FSGT », ocre) | course (rouge) | reunion (non sportive, violet : réunions du club, AG ; `sportive: false`) | autre (gris), champ facultatif `discipline` : cyclo | vtt | gravel (mêmes 3 disciplines, obligatoires, pour les parcours), pictogrammes monochromes dans `src/components/IconeDiscipline.astro`, cf. `src/lib/categories.ts` ; page `/calendrier/`), `parcours` (= parcours d'**entraînement** uniquement, dossier + `trace.gpx` ; randos/courses : champ `gpx` directement dans l'événement, publié en `/gpx/evenements/<id>.gpx`, affichage via `src/components/FicheTrace.astro`), `actualites` (dossier par article, images colocalisées), `albums` (≤ 12 photos + lien album complet ; archivage auto le 1er de chaque mois des albums de plus de 12 mois : photos supprimées, lien conservé, `scripts/archiver-albums.mjs`), `documents` (dossier + PDF, champ `section` : calendrier-fsgt | compte-rendu-ag | reglement | adhesion | inscription | autre, `SECTIONS_DOCUMENTS`), `partenaires` (dossier + logo, site, ordre ; intro = `pages/partenaires.md`, page dédiée `/partenaires/`), `pages`. **Import FSGT** : page `/admin/import-fsgt/` (bouton dans le CMS) qui lit le PDF dans le navigateur (`src/lib/fsgt/`), affiche les activités proposées avec les doublons, et crée les cochées en un commit GitHub (jeton du CMS) ; tests `npm run test:fsgt` sur `scripts/fsgt/exemples/`, essai `node scripts/essai-fsgt.mjs fichier.pdf`. Données globales : `src/data/club.json`.
- Champs de frontmatter **en français** (titre, date, lieuRdv, pointDepart (widget `map` du CMS → texte GeoJSON, lu par `pointGps` dans `content.config.ts`), gpx, openrunner (numéro de circuit, facultatif), lienStrava, lienInscription, annulee, brouillon…). Pas de durée ni de niveau sur les événements (créneau de 3 h dans le flux .ics ; heure 00:00 = « horaire à préciser », journée entière dans le .ics), pas de difficulté sur les parcours, libellés CMS en français.

## Conventions de travail
- Langue du projet, des commits, de l'UI et de la doc : **français**.
- Minimum de code maison : chaque fonctionnalité doit être compréhensible par le prochain dev en 10 minutes. Préférer une config ou un service externe à du code.
- Toute modif de schéma de collection doit être répercutée dans `public/admin/config.yml` (et inversement).
- Ne pas protéger `main` contre les commits directs de la team Rédaction (le CMS commite sur `main`).
- GPX : couper départ/arrivée pour ne jamais révéler un domicile.
- Photos : consentement des personnes reconnaissables, autorisation parentale pour les mineurs.
- Dépendances : mises à jour groupées (Dependabot mensuel), pas en continu.
- Docs à maintenir : `docs/GUIDE-REDACTEUR.md` (bénévoles, avec captures) et `docs/GUIDE-TECHNIQUE.md` (prochain dev).

## État actuel (octobre 2026)
- Repo : `simonarnaud/site-la-graverie-cyclo` (GitHub perso), servi sur `https://simonarnaud.github.io/site-la-graverie-cyclo/` → `base` défini dans `astro.config.mjs`. **Tout lien interne passe par `lien()`** (`src/lib/format.ts`).
- Astro 7 / Node 24 / Zod 4 : importer `z` depuis `astro/zod` (pas `astro:content`). Loader `glob` : `dossier/index.md` → id `dossier`.
- Données globales dans `src/data/club.json` (JSON, éditable par le CMS) : dont `devise` (titre de l'accueil), `email` de contact `lagraveriecyclos@gmail.com` et `reseaux` (club Strava https://www.strava.com/clubs/990748, affichés au pied de page et sur la page du club).
- GPX lus au build avec `@tmcw/togeojson` + `@xmldom/xmldom` ; carte = Leaflet seul (polyline), pas de `leaflet-gpx`.
- Dates : build en UTC → affichage toujours en `Europe/Paris` ; CMS `input_timezone: Europe/Paris`.
- **Contenus tolérants** : collections chargées par `globTolerant` (`src/lib/chargeur.ts`) : une fiche invalide (schéma, image/GPX/PDF manquant) est écartée, jamais bloquante, et listée dans `/etat-publication.json`, affiché en bandeau dans le CMS (`public/admin/index.html`, + état du workflow via l'API GitHub).
- Sveltia écrit les champs facultatifs vides en `''` ou `null` : dans `content.config.ts`, les envelopper avec `facultatif(...)`.
- Connexion CMS : bouton GitHub via le relais `sveltia-cms-auth` (Cloudflare Worker `https://sveltia-cms-auth.sim-arnaud.workers.dev`, repo privé `simonarnaud/sveltia-cms-auth`, `ALLOWED_DOMAINS=simonarnaud.github.io`). PAT en secours. Transformations d'images sous `media_libraries.all.transformations`.
- Contenus d'exemple (marqués « exemple ») à remplacer ; traces GPX générées autour de La Graverie (Calvados).

## Commandes
- `npm install` · `npm run dev` (http://localhost:4321/site-la-graverie-cyclo/) · `npm run build` · `npm run check`
- Node n'est peut-être pas dans le PATH du shell de l'agent : `export PATH="/d/NodeJS:$PATH"`.
