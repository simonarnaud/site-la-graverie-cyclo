# Architecture et décisions

Ce document garde la trace des choix faits au lancement du projet (octobre 2026) et de leurs raisons.

## 1. Choix techniques

| Besoin | Choix | Pourquoi | Alternatives |
|---|---|---|---|
| Générateur | Astro | Collections typées (un champ oublié casse le build, pas le site en ligne), optimisation d'images intégrée, zéro JS par défaut | Hugo (templates Go peu transmissibles), Eleventy (moins structuré) |
| CMS | Sveltia CMS | Git-based, 2 fichiers dans `public/admin/`, redimensionne/convertit en WebP à l'upload | Pages CMS (invitation par email sans compte GitHub, service hébergé), Decap CMS (plus ancien, plus lent) |
| Images | `astro:assets` au build + transformations Sveltia à l'upload | Jamais d'original de 8 Mo dans Git, formats adaptés servis | — |
| Galeries | Liens externes (Google Photos, Flickr, Piwigo) | Limites de taille de Pages / du repo | — |
| Carte | Leaflet seul (tracé simplifié calculé au build) + Plan IGN | Léger, sans clé, chargé à la demande ; le Plan IGN est plus détaillé qu'OSM en France, routes et lieux-dits lisibles sur papier | Tuiles OSM (fond d'origine), CyclOSM (serveur associatif), MapLibre + OpenFreeMap |
| Point de départ | Widget `map` de Sveltia → liens Google Maps | Aucune carte à charger sur la fiche ; Google Maps s'ouvre dans l'application du téléphone | Carte Leaflet sur chaque fiche |
| Feuille de route imprimée | API Valhalla (FOSSGIS) appelée depuis le navigateur au clic sur « Imprimer » | Gratuit, sans clé, indications en français à partir d'OpenStreetMap ; aucun appel au build | Calcul au build (build dépendant du réseau, cache à gérer), détection des virages depuis le GPX seul (sans noms de routes) |
| Import FSGT | Lecture du PDF dans le navigateur (pdf.js via `unpdf`) + un commit via l'API GitHub | Pas de serveur ni d'Action : l'admin valide avant tout enregistrement | GitHub Action déclenchée par le dépôt du PDF (abandonnée : trop indirecte pour les bénévoles) |
| Contact | `mailto:` | Aucune donnée collectée | Web3Forms (250/mois), Formspree (50/mois) avec honeypot |
| Participation | Champ `lienStrava` (événement du club Strava) | Un site statique ne peut pas compter seul ; les membres sont déjà sur Strava | Framadate, billetterie gratuite HelloAsso ; v2 : Firebase/Supabase |
| Adhésions | HelloAsso | Gratuit pour les associations | — |
| Stats | GoatCounter (compte de test pour l'instant) | Sans cookie, pas de bandeau | — |

### Authentification Sveltia
- PAT : aucun serveur, mais peu pratique pour un non-dev.
- « Se connecter avec GitHub » : OAuth App (à créer **sous l'organisation** du club) + relais `sveltia-cms-auth` sur Cloudflare Workers (gratuit). Vérifier si le support PKCE de GitHub permet désormais de s'en passer.
- Chaque rédacteur doit avoir un compte GitHub et le droit Write (team « Rédaction »). Si c'est un frein → Pages CMS.

## 2. Structure

```
.github/workflows/{deploy.yml, archiver-albums.yml}
public/admin/{index.html,config.yml}
src/content.config.ts
src/content/{sorties,parcours,actualites,albums,documents,partenaires}/<id>/index.md   (+ fichiers de la fiche)
src/content/pages/*.md
src/data/club.json
src/components/  src/layouts/  src/lib/ (dont src/lib/fsgt/)
src/pages/{index.astro, calendrier/, sorties/, parcours/, actualites/, albums/, documents/, partenaires.astro, sorties.ics.ts, admin/import-fsgt.astro}
scripts/{archiver-albums.mjs, essai-fsgt.mjs, fsgt/}
docs/{ARCHITECTURE.md, GUIDE-REDACTEUR.md, GUIDE-TECHNIQUE.md, FICHE-INFOS-BUREAU.md}
```

### Schémas (référence : `src/content.config.ts`)
- **sorties** (`AAAA-MM-JJ-slug/index.md` + fichiers facultatifs) : `titre`, `categorie` (entrainement | rando | course | autre), `discipline` (cyclo | vtt | gravel, optionnel), `date` (date+heure ; 00:00 = horaire à préciser), `lieuRdv`, `pointDepart` (point placé sur la carte du CMS, GeoJSON en texte, optionnel → liens Google Maps et `GEO` dans le .ics), `organisateur`, `parcours` (référence, entraînements) ou `gpx` (fichier dans le dossier, randos/courses), `openrunner` (numéro, optionnel, exige `parcours` ou `gpx`), `lienStrava`, `lienInscription`, `annulee` (bool), `couverture`/`couvertureAlt`, corps = description.
- **parcours** (`slug/index.md` + `trace.gpx` + couverture) : `titre`, `discipline` (cyclo | vtt | gravel), `gpx` (publié en `/gpx/<id>.gpx`), `distanceKm`/`deniveleM` (optionnels, sinon calculés), `couverture`.
- **actualites** (`slug/index.md` + images colocalisées) : `titre`, `date`, `auteur`, `resume`, `couverture`, `couvertureAlt`, `brouillon`.
- **albums** : `titre`, `date`, `photos` (≤ 12 × {src, alt}, vidées par l'archivage après 12 mois), `lienAlbumComplet`.
- **documents** : `titre`, `date`, `section` (calendrier-fsgt | compte-rendu-ag | reglement | adhesion | autre), `fichier` (PDF dans le dossier).
- **partenaires** : nom, logo (dans le dossier), site, ordre.
- **club.json** : nom, devise, slogan, email, ville, lien HelloAsso, code GoatCounter, réseaux, bureau.
- Sveltia : `media_libraries.all.transformations` → WebP, qualité 85, 2048 px max.

## 3. Déploiement
Workflow `.github/workflows/deploy.yml` : déclenché par push sur `main`, `workflow_dispatch` et cron quotidien (`0 4 * * *`, pour basculer les sorties passées).
Étapes : checkout → setup-node (LTS, cache npm) → cache `node_modules/.astro` → `npm ci` → tests de l'import FSGT → `astro check` → `npm run build` → upload-pages-artifact (`./dist`) → deploy-pages.
Settings → Pages → Source : **GitHub Actions**.

Attention : sur un repo public, les workflows `schedule` sont désactivés après 60 jours sans commit.

## 4. Plan de mise en route
1. Repo (perso d'abord, organisation du club ensuite), squelette Astro, contenus factices.
2. Déploiement Pages vérifié sur l'URL `github.io`.
3. Carte + GPX (stats calculées au build).
4. CMS : OAuth App + relais, test par un vrai bénévole non-dev.
5. Extras : `sorties.ics`, HelloAsso, albums.
6. Domaine : achat au nom du club, renouvellement auto. DNS apex `A` 185.199.108.153 / .109 / .110 / .111 (+ `AAAA` 2606:50c0:8000::153 → 8003::153), `www` CNAME → `<compte>.github.io`. Vérifier le domaine au niveau du compte/organisation, Enforce HTTPS.
7. Guides et formation (30 min) des bénévoles, 1-2 référents.

## 5. Vigilance
- **Bus factor** : comptes au nom du club (GitHub, OAuth App, Cloudflare, registrar, HelloAsso, Strava), ≥ 2-3 owners, 2FA, liste des accès hors repo.
- **Domaine** : renouvellement auto, plusieurs contacts.
- **RGPD** : rien de personnel dans le repo ni l'historique ; GPX coupés ; droit à l'image ; mentions légales LCEN (association, siège, RNA, directeur de publication, hébergeur GitHub Inc., 88 Colin P Kelly Jr St, San Francisco, CA 94107, USA) ; politique de confidentialité mentionnant tuiles OSM, iframes HelloAsso/Strava, éventuel service de formulaire.
- **Technique** : peu de code maison, Dependabot groupé, repo < 1 Go, site éditable directement sur github.com en secours du CMS.

## 6. Expérience des bénévoles
`/admin` → connexion GitHub (une fois) → formulaire en français → « Publier » → en ligne en 1-2 min.
Points à documenter : le délai de publication, les albums complets hors site, l'usage sur téléphone (photos HEIC d'iPhone à tester).
