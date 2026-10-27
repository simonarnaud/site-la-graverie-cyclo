# Guide technique

## Fonctionnement

```
Bénévole ──(Sveltia CMS, /admin)──▶ commit sur main ──▶ GitHub Actions (build Astro) ──▶ GitHub Pages
```

- **Astro 7** génère un site 100 % statique dans `dist/`.
- Les contenus sont des fichiers Markdown dans `src/content/`, validés par les schémas de `src/content.config.ts`. Une fiche invalide est écartée du site et signalée dans le CMS, sans bloquer le reste (voir ci-dessous).
- **Sveltia CMS** (`public/admin/`) est une simple page qui lit et écrit ces fichiers via l'API GitHub.

## Une erreur de contenu ne bloque jamais le site

Les collections sont chargées par `globTolerant` (`src/lib/chargeur.ts`) au lieu du `glob` d'Astro :

- une fiche **invalide** (champ refusé par le schéma, image, GPX ou PDF introuvable, GPX illisible) est **écartée** du site, avec un avertissement dans le log du build ; le reste du site est publié normalement ;
- chaque mise en ligne publie un rapport : **`/etat-publication.json`** (liste des fiches écartées, avec le menu du CMS, le titre et l'explication) ;
- la page d'administration (`public/admin/index.html`) affiche un **bandeau** en bas à droite du CMS : « Mise en ligne en cours… », « Mise en ligne terminée », la liste des contenus non publiés, ou « La dernière mise en ligne a échoué » (erreur technique, avec lien vers le détail sur GitHub). L'état de la mise en ligne vient de l'API publique de GitHub (dernier passage du workflow « Déploiement ») ; le dépôt est lu dans `public/admin/config.yml`.

Une erreur **technique** (bug dans le code, dépendance cassée) fait toujours échouer le build : la version précédente reste en ligne et le bandeau le signale. GitHub envoie aussi un email à l'auteur du commit.

## Arborescence

| Chemin | Rôle |
|---|---|
| `src/content.config.ts` | Schémas des collections (à garder synchronisés avec `public/admin/config.yml`) |
| `src/content/sorties/<id>/index.md` | Événements du calendrier (+ image d'illustration et GPX facultatifs dans le même dossier ; GPX publié en `/gpx/evenements/<id>.gpx`) ; types et couleurs dans `src/lib/categories.ts` et `--cat-*` de `global.css` |
| `src/content/parcours/<id>/index.md` | **Parcours d'entraînement** (réutilisés par les entraînements) + `trace.gpx` + photo ; GPX publié en `/gpx/<id>.gpx`. Les randos et courses ont leur GPX dans l'événement. |
| `src/content/actualites/<id>/index.md` | Articles (+ images dans le même dossier) |
| `src/content/albums/<id>/index.md` | Sélections de photos (≤ 12) + lien vers l'album complet |
| `src/content/documents/<id>/index.md` | Documents + PDF dans le même dossier ; publié en `/documents/<id>.pdf` (10 Mo max) ; champ `section` (Calendriers FSGT, Comptes rendus d'AG…, liste dans `SECTIONS_DOCUMENTS` de `src/lib/categories.ts`, à reporter dans `config.yml`) |
| `src/content/partenaires/<id>/index.md` | Partenaires (nom, logo dans le dossier, site, ordre) ; page `src/pages/partenaires.astro`, texte d'introduction dans `src/content/pages/partenaires.md` |
| `src/content/pages/*.md` | Le club, mentions légales, confidentialité |
| `src/data/club.json` | Nom, devise (titre de l'accueil), slogan, email de contact, bureau, lien HelloAsso, code GoatCounter |
| `src/lib/chargeur.ts` | Chargement tolérant des collections et rapport des fiches écartées (`/etat-publication.json`) |
| `src/lib/fichiers.ts` | Accès aux GPX/PDF rangés dans le dossier d'une fiche |
| `src/lib/gpx.ts` | Distance, D+, tracé et profil calculés au build |
| `src/pages/gpx/[id].gpx.ts`, `src/pages/gpx/evenements/[id].gpx.ts`, `src/pages/documents/[id].pdf.ts` | Publication des GPX et PDF |
| `src/components/FicheTrace.astro` | Carte + profil + téléchargement + impression d'un GPX (parcours et événements) |
| `src/pages/sorties.ics.ts` | Flux calendrier |
| `src/pages/admin/import-fsgt.astro`, `src/lib/fsgt/` | Import d'un programme FSGT (PDF) dans le calendrier, depuis le CMS |
| `src/components/Carte.astro` | Carte Leaflet (tuiles OpenStreetMap) |

**Règle : chaque fiche a son dossier, et ses fichiers (images, GPX, PDF) sont dedans.** Supprimer une fiche dans le CMS supprime donc aussi ses fichiers : rien ne reste orphelin.

## Développer en local

```bash
npm install
npm run dev      # http://localhost:4321/site-la-graverie-cyclo/
npm run check    # vérification des types et des contenus
npm run build    # génère dist/
```

Le CMS fonctionne aussi en local : ouvrez http://localhost:4321/site-la-graverie-cyclo/admin/index.html (en dev, le `index.html` est obligatoire) et choisissez **« Travailler avec un dépôt local »** (Chrome ou Edge). Les modifications sont écrites directement sur le disque.

## Points d'attention

- **Chemin de base** : tant que le site est servi depuis `simonarnaud.github.io/site-la-graverie-cyclo`, tous les liens internes passent par `lien()` (`src/lib/format.ts`). Le jour où le domaine est branché, modifiez `site`, supprimez `base` dans `astro.config.mjs`, et mettez à jour `site_url` et `display_url` dans `public/admin/config.yml`.
- **Fuseau horaire** : le build tourne en UTC. Les dates sont toujours affichées avec le fuseau `Europe/Paris` (`src/lib/format.ts`), et le CMS enregistre l'heure avec son décalage (`input_timezone: Europe/Paris`).
- **Rebuild quotidien** : le cron du workflow fait basculer les sorties passées. GitHub le désactive après 60 jours sans commit sur un repo public : il suffit alors de le réactiver dans l'onglet Actions.
- **Nom des fichiers de sorties** : le modèle de `slug` du CMS utilise la date de la sortie (vérifié en octobre 2026).
- **Champs vides** : le CMS enregistre un champ facultatif vide en `''` ou `null` ; dans `src/content.config.ts`, déclarez les champs facultatifs avec `facultatif(...)`.

## Connexion au CMS

Sveltia CMS ne sait pas se connecter à GitHub sans serveur intermédiaire (PKCE non disponible côté GitHub). Le bouton **« Se connecter avec GitHub »** passe donc par un petit relais :

```
CMS (/admin) ──▶ relais sveltia-cms-auth (Cloudflare Workers) ──▶ OAuth App GitHub ──▶ jeton renvoyé au CMS
```

| Élément | Où | Réglages |
|---|---|---|
| Relais | Cloudflare → Workers & Pages → `sveltia-cms-auth`, adresse `https://sveltia-cms-auth.sim-arnaud.workers.dev` | Code : repo privé `simonarnaud/sveltia-cms-auth` (copie de [sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth)) |
| Variables du relais | Settings → **Runtime variables and secrets** (pas celles de la section Build) | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (type Secret), `ALLOWED_DOMAINS` = domaine du site |
| OAuth App | github.com → Settings → Developer settings → OAuth Apps → « CMS La Graverie Cyclos » | Redirect URI = adresse du relais + `/callback` |
| CMS | `public/admin/config.yml` | `base_url` = adresse du relais |

Ne pas activer « Protect with Cloudflare Access » sur le relais : les bénévoles ne pourraient plus se connecter.

**En secours**, la connexion par jeton reste possible : sur GitHub, Settings → Developer settings → Fine-grained token, avec l'accès au repo et la permission *Contents: read and write*, puis « Se connecter avec un jeton d'accès » dans le CMS.

**Donner l'accès à un bénévole** : il crée un compte GitHub, puis vous l'ajoutez au repo (Settings → Collaborators ; plus tard, l'équipe « Rédaction » de l'organisation).

**Lors du passage à l'organisation ou au domaine du club** :
- Domaine : ajoutez-le dans `ALLOWED_DOMAINS` (plusieurs domaines séparés par des virgules).
- Organisation : recréez l'OAuth App sous l'organisation et le relais sur le compte Cloudflare du club, puis mettez à jour `base_url`.

## Statistiques de visite (GoatCounter)

Les statistiques sont désactivées tant que le champ `goatcounter` de `src/data/club.json` est vide. Pour les activer :

1. Créez un compte gratuit sur [goatcounter.com](https://www.goatcounter.com) avec l'adresse email du club. Le service est gratuit pour un usage non commercial.
2. Choisissez un code, par exemple `lagraveriecyclos`, ce qui donne le tableau de bord `lagraveriecyclos.goatcounter.com`.
3. Dans le CMS : **Le club → Coordonnées et bureau → Code GoatCounter**, saisissez ce code, puis enregistrez.

Le script est alors ajouté à toutes les pages, et la politique de confidentialité affiche automatiquement le paragraphe « Mesure d'audience ». GoatCounter ne pose pas de cookie et ne conserve pas d'adresse IP : aucun bandeau de consentement n'est nécessaire. Dans les réglages GoatCounter, le tableau de bord peut être rendu public pour que tout le bureau le consulte sans compte.

## Fiche d'une activité

`src/pages/sorties/[id].astro` :

- **Départ** : `horaire()` (`src/lib/format.ts`) affiche « horaire à préciser » quand l'heure est 00:00 (journée entière dans le .ics).
- **Point de départ** : champ `pointDepart`, widget `map` de Sveltia (recherche d'adresse OpenStreetMap, clic sur la carte, position actuelle ; carte centrée sur La Graverie). Le CMS l'enregistre en **texte GeoJSON** (`'{"type":"Point","coordinates":[longitude,latitude]}'`), converti en `{ latitude, longitude }` par `pointGps` dans `src/content.config.ts`. La fiche affiche alors « Voir sur Google Maps » et « Itinéraire » (liens `google.com/maps/search` et `/dir`, sans clé d'API) ; le .ics reçoit une ligne `GEO`. Aucune carte n'est chargée sur la fiche.
- **Trace GPX** : `CarteSortie.astro` affiche « Trace GPX » si `gpx` ou `parcours` est renseigné, sinon « Sans trace GPX » ; même indication dans la liste du CMS (`summary` de la collection).

## Boutons ajoutés au CMS

`public/admin/index.html` ajoute « ← Voir le site » et « 📄 Importer un programme FSGT » par-dessus Sveltia. Sveltia ouvre tout lien sortant dans un nouvel onglet : un petit script les ouvre dans le même onglet, pour revenir au CMS avec « Précédent ».

## Profil d'altitude

Calculé au build depuis le GPX (`profil` dans `src/lib/gpx.ts`, 300 points au maximum) et dessiné en SVG par `src/components/ProfilAltitude.astro`, sans JavaScript. Il n'apparaît pas si le GPX ne contient pas d'altitudes.

## Mettre à jour Sveltia CMS

La version est figée dans `public/admin/index.html` (Dependabot ne peut pas la suivre, car le script vient d'un CDN). Deux fois par an environ :

1. Consultez la dernière version avec `npm view @sveltia/cms version` et lisez les [notes de version](https://github.com/sveltia/sveltia-cms/releases).
2. Changez le numéro dans l'URL du script.
3. Testez en local (`/admin/index.html`, « Travailler avec un dépôt local ») : ouvrez une sortie, une actualité et un album.

## Passer au domaine du club

1. Achetez le domaine au nom de l'association, avec le renouvellement automatique activé.
2. DNS : enregistrements `A` vers 185.199.108.153, 185.199.109.153, 185.199.110.153 et 185.199.111.153 ; `AAAA` vers 2606:50c0:8000::153 à 2606:50c0:8003::153 ; `CNAME www` vers `simonarnaud.github.io` (ou le compte de l'organisation).
3. GitHub : vérifiez le domaine (Settings → Pages → Verified domains), puis renseignez-le dans les réglages Pages du repo et cochez **Enforce HTTPS**.
4. Mettez à jour `astro.config.mjs` et `public/admin/config.yml` (voir « Chemin de base »).

## Transférer le repo à l'organisation du club

Dans le repo : Settings → General → Transfer ownership. Ensuite, mettez à jour `repo:` dans `public/admin/config.yml` et les URL `simonarnaud.github.io` partout où elles apparaissent.

## QR code du site

`npm run qrcode` génère dans `docs/qrcode/` le QR code du site (SVG pour l'impression, PNG, et une version « affiche » avec le nom du club). L'adresse est lue dans `astro.config.mjs` : **après le passage au domaine du club, relancez la commande** et remplacez les supports déjà imprimés.

## Poids du site et limites

| Limite (GitHub, gratuit) | Valeur | Ce qui compte |
|---|---|---|
| Site publié (GitHub Pages) | **1 Go** | les fichiers actuels du site (`dist/`) |
| Taille du repo | **1 Go recommandé**, 5 Go maximum conseillé | tous les fichiers **et tout l'historique** |
| Taille d'un fichier | 100 Mo (bloqué) | PDF limités à 10 Mo par le CMS |

- Les photos sont réduites à 2048 px en WebP avant l'envoi (~200 à 600 Ko chacune).
- **Supprimer une fiche libère de la place sur le site publié, mais pas dans l'historique Git** : un fichier envoyé puis supprimé reste dans l'historique du repo. D'où les règles : 12 photos maximum par album, albums complets sur Google Photos.
- Pour mesurer : `gh api repos/<compte>/site-la-graverie-cyclo -q .size` (taille du repo en Ko) et `du -sh dist` après un build.
- Si le repo approchait 1 Go (dans plusieurs années) : réduire la taille des photos dans `public/admin/config.yml` (`width`/`height` à 1600), ou archiver les vieux albums dans un repo séparé.

## Archivage automatique des albums

Le **1er de chaque mois à 3 h (UTC)**, le workflow `.github/workflows/archiver-albums.yml` lance `scripts/archiver-albums.mjs` :

- les albums **de plus de 12 mois** (le 13e mois en arrière et avant) perdent leurs photos (fichiers supprimés, `photos: []`, `archive: true`). Exemple : le 1er novembre 2027, les albums d'octobre 2026 et plus anciens sont archivés ; ceux de novembre 2026 à novembre 2027 restent visibles. **Le site montre donc toujours au moins une année complète de photos** ;
- ils restent listés sur la page Photos, dans « Albums plus anciens », avec leur **lien vers l'album complet** ;
- le robot enregistre le changement puis relance la mise en ligne.

Commandes utiles :

```bash
node scripts/archiver-albums.mjs --essai                  # ce qui serait archivé aujourd'hui, sans rien modifier
node scripts/archiver-albums.mjs --essai --mois 2027-11   # simulation pour un autre mois
```

Le workflow peut aussi être lancé à la main : onglet **Actions → Archivage des albums → Run workflow**. La durée de conservation se règle avec `MOIS_CONSERVES` en tête du script.

⚠️ L'archivage allège le **site publié** et les fichiers du repo, mais les photos restent dans **l'historique Git** (voir « Poids du site et limites »). C'est sans conséquence avant de nombreuses années.

## Import des programmes FSGT

Page `src/pages/admin/import-fsgt.astro` (`/admin/import-fsgt/`), ouverte par le bouton « 📄 Importer un programme FSGT » ajouté au CMS (`public/admin/index.html`). **Tout se passe dans le navigateur de l'admin**, sans serveur ni GitHub Action :

1. **Lecture** — `src/lib/fsgt/lire-programme.mjs` lit le texte du PDF **avec ses positions** (`unpdf`, basé sur pdf.js, chargé seulement sur cette page), trouve la ligne d'en-tête (cellule « DATE ») et reconstitue le tableau. Deux mises en page sont reconnues :
   - **tableau** : une ligne par activité ; rôle des colonnes deviné d'après l'intitulé (club/organisateur, lieu/rendez-vous, heure, discipline, le reste en « détails ») ; une cellule « Route »/« VTT »/« Gravel » donne la discipline, sinon « VTT » ou « Gravel » écrit ailleurs dans la ligne ;
   - **grille** : une ligne par jour, une colonne par discipline (CYCLO → rando cyclo, CYCLOSPORT → course cyclo, VTT → rando VTT, GRAVEL → rando gravel, CYCLO CROSS → course VTT ; « championnat », « national », « CLM »… → course) ; les mois sont déduits des remises à zéro des numéros de jour et des noms de mois de la colonne MOIS.
   **Année** : écrite au-dessus du tableau (« SAISON 2022 »), sinon déduite des jours de la semaine (« Sam 19 Sept » → 2026). Chaque date est contrôlée : une ligne douteuse est **rejetée et affichée** avec la raison, jamais ignorée en silence.
2. **Propositions** — `src/lib/fsgt/preparer.mjs` : activités à venir uniquement ; titre = club ; téléphones et emails retirés ; heure vide = 00:00 = « horaire à préciser ».
3. **Doublons** — le calendrier est relu **directement dans le dépôt** (API GraphQL de GitHub : un seul appel, à jour même avant la mise en ligne). Même jour (Paris) + au moins un mot-clé commun (≥ 4 lettres, hors mots courants : rando, club, mairie…) entre titre/organisateur/lieu = doublon probable, proposé décoché. Revérifié juste avant l'enregistrement.
4. **Création** — les fiches cochées sont écrites dans `src/content/sorties/<date>-<club>/index.md` en **un seul commit** (mutation `createCommitOnBranch`, `expectedHeadOid` : si quelqu'un a publié entre-temps, on relit et on réessaie une fois). Ce commit déclenche la mise en ligne habituelle.
5. **Connexion** — le jeton GitHub de Sveltia (`localStorage['sveltia-cms.user'].token`, même origine) est réutilisé ; à défaut, le bouton « Se connecter avec GitHub » passe par le même relais `sveltia-cms-auth` (`base_url` de `config.yml`, popup + `postMessage`). Droits d'écriture vérifiés (`viewerPermission`). Le jeton reste dans le navigateur.

**Nouveau modèle de PDF** : l'essayer sans rien modifier, puis l'ajouter aux tests.

```bash
node scripts/essai-fsgt.mjs chemin/programme.pdf            # activités à venir qui seraient proposées (+ doublons avec le calendrier local)
node scripts/essai-fsgt.mjs chemin/programme.pdf --toutes   # y compris les dates passées
npm run test:fsgt                                           # tests sur scripts/fsgt/exemples/*.pdf
```

Si le format n'est pas reconnu, adapter `src/lib/fsgt/lire-programme.mjs` (détection d'en-tête, rôle des colonnes), copier le PDF dans `scripts/fsgt/exemples/` et ajouter un test dans `lire-programme.test.mjs`. Les tests tournent aussi à chaque mise en ligne.

## Page Photos

`src/pages/albums/index.astro` : albums regroupés par mois, filtre « Mois » (adresse partageable `?mois=AAAA-MM`), visionneuse plein écran (clic sur une vignette, flèches du clavier, Échap). Sans JavaScript, tout s'affiche à la suite et les vignettes restent visibles.
