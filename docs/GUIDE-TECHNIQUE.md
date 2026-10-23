# Guide technique

## Fonctionnement

```
Bénévole ──(Sveltia CMS, /admin)──▶ commit sur main ──▶ GitHub Actions (build Astro) ──▶ GitHub Pages
```

- **Astro 7** génère un site 100 % statique dans `dist/`.
- Les contenus sont des fichiers Markdown dans `src/content/`, validés par les schémas de `src/content.config.ts`. Un champ invalide fait échouer le build, et la version précédente du site reste en ligne.
- **Sveltia CMS** (`public/admin/`) est une simple page qui lit et écrit ces fichiers via l'API GitHub.

## Arborescence

| Chemin | Rôle |
|---|---|
| `src/content.config.ts` | Schémas des collections (à garder synchronisés avec `public/admin/config.yml`) |
| `src/content/sorties/<id>/index.md` | Événements du calendrier (+ image d'illustration facultative dans le même dossier) ; types et couleurs dans `src/lib/categories.ts` et `--cat-*` de `global.css` |
| `src/content/parcours/<id>/index.md` | Parcours + `trace.gpx` + photo dans le même dossier ; GPX publié en `/gpx/<id>.gpx` |
| `src/content/actualites/<id>/index.md` | Articles (+ images dans le même dossier) |
| `src/content/albums/<id>/index.md` | Sélections de photos (≤ 12) + lien vers l'album complet |
| `src/content/documents/<id>/index.md` | Documents + PDF dans le même dossier ; publié en `/documents/<id>.pdf` (10 Mo max) |
| `src/content/pages/*.md` | Le club, mentions légales, confidentialité |
| `src/data/club.json` | Nom, email, bureau, lien HelloAsso, code GoatCounter |
| `src/lib/fichiers.ts` | Accès aux GPX/PDF rangés dans le dossier d'une fiche |
| `src/lib/gpx.ts` | Distance, D+, tracé et profil calculés au build |
| `src/pages/gpx/[id].gpx.ts`, `src/pages/documents/[id].pdf.ts` | Publication des GPX et PDF |
| `src/pages/sorties.ics.ts` | Flux calendrier |
| `src/components/Carte.astro` | Carte Leaflet (tuiles OpenStreetMap) |

**Règle : chaque fiche a son dossier, et ses fichiers (images, GPX, PDF) sont dedans.** Supprimer une fiche dans le CMS supprime donc aussi ses fichiers : rien ne reste orphelin.

## Développer en local

```bash
npm install
npm run dev      # http://localhost:4321/site-la-graverie-cyclo/
npm run check    # vérification des types et des contenus
npm run build    # génère dist/
```

Le CMS fonctionne aussi en local : ouvrez http://localhost:4321/site-la-graverie-cyclo/admin/index.html (en dev, le `index.html` est obligatoire) et choisissez **« Work with Local Repository »** (Chrome ou Edge). Les modifications sont écrites directement sur le disque.

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
