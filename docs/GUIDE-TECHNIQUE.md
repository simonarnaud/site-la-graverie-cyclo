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
| `src/content/sorties/*.md` | Sorties du calendrier |
| `src/content/parcours/<id>/index.md` | Parcours (+ photo colocalisée) ; trace dans `public/gpx/` |
| `src/content/actualites/<id>/index.md` | Articles (+ images colocalisées) |
| `src/content/albums/<id>/index.md` | Sélections de photos (≤ 12) + lien vers l'album complet |
| `src/content/pages/*.md` | Le club, mentions légales, confidentialité |
| `src/data/club.json` | Nom, email, bureau, lien HelloAsso |
| `src/lib/gpx.ts` | Distance, D+ et tracé simplifié calculés au build |
| `src/pages/sorties.ics.ts` | Flux calendrier |
| `src/components/Carte.astro` | Carte Leaflet (tuiles OpenStreetMap) |

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
- **Nom des fichiers de sorties** : le modèle de `slug` du CMS utilise la date de la sortie. À vérifier à la première création depuis le CMS ; à défaut, le nom n'a pas d'importance fonctionnelle.

## Connexion au CMS

Aujourd'hui, Sveltia CMS ne sait pas se connecter à GitHub sans serveur intermédiaire (PKCE non disponible côté GitHub). Deux options :

1. **Jeton personnel (PAT)**, possible tout de suite : sur GitHub, Settings → Developer settings → Fine-grained token, avec l'accès au repo et la permission *Contents: read and write*. Dans le CMS, choisissez « Sign In with Token ».
2. **Bouton « Se connecter avec GitHub »** : créez une OAuth App (sous l'organisation du club, le moment venu), déployez [sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) sur Cloudflare Workers (gratuit), puis renseignez `base_url` dans `public/admin/config.yml`.

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
