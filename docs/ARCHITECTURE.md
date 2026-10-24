# Architecture et décisions

Ce document garde la trace des choix faits au lancement du projet (octobre 2026) et de leurs raisons.

## 1. Choix techniques

| Besoin | Choix | Pourquoi | Alternatives |
|---|---|---|---|
| Générateur | Astro | Collections typées (un champ oublié casse le build, pas le site en ligne), optimisation d'images intégrée, zéro JS par défaut | Hugo (templates Go peu transmissibles), Eleventy (moins structuré) |
| CMS | Sveltia CMS | Git-based, 2 fichiers dans `public/admin/`, redimensionne/convertit en WebP à l'upload | Pages CMS (invitation par email sans compte GitHub, service hébergé), Decap CMS (plus ancien, plus lent) |
| Images | `astro:assets` au build + transformations Sveltia à l'upload | Jamais d'original de 8 Mo dans Git, formats adaptés servis | — |
| Galeries | Liens externes (Google Photos, Flickr, Piwigo) | Limites de taille de Pages / du repo | — |
| Carte | Leaflet + leaflet-gpx + tuiles OSM | Léger, sans clé, chargé à la demande | MapLibre + OpenFreeMap, iframes Komoot / RideWithGPS |
| Contact | `mailto:` | Aucune donnée collectée | Web3Forms (250/mois), Formspree (50/mois) avec honeypot |
| Participation | Champ `lienStrava` (événement du club Strava) | Un site statique ne peut pas compter seul ; les membres sont déjà sur Strava | Framadate, billetterie gratuite HelloAsso ; v2 : Firebase/Supabase |
| Adhésions | HelloAsso | Gratuit pour les associations | — |
| Stats | GoatCounter ou rien | Sans cookie | — |

### Authentification Sveltia
- PAT : aucun serveur, mais peu pratique pour un non-dev.
- « Se connecter avec GitHub » : OAuth App (à créer **sous l'organisation** du club) + relais `sveltia-cms-auth` sur Cloudflare Workers (gratuit). Vérifier si le support PKCE de GitHub permet désormais de s'en passer.
- Chaque rédacteur doit avoir un compte GitHub et le droit Write (team « Rédaction »). Si c'est un frein → Pages CMS.

## 2. Structure

```
.github/workflows/deploy.yml
public/admin/{index.html,config.yml}
src/content.config.ts
src/content/{sorties,parcours,actualites,albums,documents}/<id>/index.md   (+ fichiers de la fiche)
src/content/pages/*.md
src/data/club.json
src/components/  src/layouts/
src/pages/{index.astro, sorties/, parcours/[id].astro, actualites/, sorties.ics.ts}
docs/{ARCHITECTURE.md, GUIDE-REDACTEUR.md, GUIDE-TECHNIQUE.md}
```

### Schémas prévus
- **sorties** (`AAAA-MM-JJ-slug/index.md` + image facultative) : `titre`, `date` (date+heure), `lieuRdv`, `parcours` (référence, optionnel), `lienStrava` (URL Strava, optionnel), `lienInscription` (URL organisateur, optionnel), `annulee` (bool), corps = description.
- **parcours** (`slug/index.md` + couverture) : `titre`, `type` (route | gravel | vtt), `gpx` (`trace.gpx` dans le dossier, publié en `/gpx/<id>.gpx`), `distanceKm`/`deniveleM` (optionnels, sinon calculés), `couverture`.
- **actualites** (`slug/index.md` + images colocalisées, `media_folder: ''`) : `titre`, `date`, `auteur`, `couverture`, `couvertureAlt`, `brouillon`.
- **albums** : `titre`, `date`, `photos` (≤ 12 × {src, alt}), `lienAlbumComplet`.
- Sveltia : `media_libraries.default.config.transformations.raster_image` → webp, qualité 85, 2048 px max (syntaxe à vérifier dans la doc).

## 3. Déploiement
Workflow `.github/workflows/deploy.yml` : déclenché par push sur `main`, `workflow_dispatch` et cron quotidien (`0 4 * * *`, pour basculer les sorties passées).
Étapes : checkout → setup-node (LTS, cache npm) → cache `node_modules/.astro` → `npm ci` → `astro check` → `npm run build` → upload-pages-artifact (`./dist`) → deploy-pages.
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
