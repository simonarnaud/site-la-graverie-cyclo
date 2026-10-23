# À faire

Liste des prochains travaux, par ordre de priorité. Cocher au fur et à mesure.

## 1. Tester la publication depuis le CMS
Aucun contenu n'a encore été créé depuis l'interface `/admin/`. À vérifier :
- [ ] Créer une sortie : nom du fichier (date de la sortie), heure enregistrée avec le fuseau de Paris, liste des parcours
- [ ] Créer une actualité avec une photo prise au téléphone : conversion WebP, photo rangée à côté de l'article
- [ ] Créer un album photo
- [ ] Ajouter une rando ou une course (champ « Type » et « Organisateur »)
- [ ] Déposer un PDF dans « Documents »
- [ ] Vérifier que le site se met à jour environ 2 minutes après l'enregistrement

## 2. Remplacer le contenu d'exemple
- [ ] Présentation du club et slogan
- [ ] Adresse email du club (`src/data/club.json`)
- [ ] Bureau : noms publiés uniquement avec l'accord des personnes
- [ ] Mentions légales : adresse du siège, numéro RNA, directeur·rice de la publication
- [ ] Vraies traces GPX, coupées au départ et à l'arrivée
- [ ] Supprimer les sorties, l'article et l'album d'exemple
- [ ] Lien d'adhésion HelloAsso (facultatif)

## 3. Connexion des bénévoles au CMS
À faire avant d'inviter des bénévoles (le jeton d'accès est trop technique pour eux) :
- [ ] Option A : OAuth App GitHub + relais `sveltia-cms-auth` sur Cloudflare Workers, puis `base_url` dans `public/admin/config.yml`
- [ ] Option B : tester Pages CMS (invitation par email, sans compte GitHub) avec un bénévole

## 4. Mettre le projet au nom du club
- [ ] Adresse email du club partagée entre plusieurs membres du bureau
- [ ] Organisation GitHub du club (2-3 propriétaires, 2FA), puis transfert du repo
- [ ] Comptes Cloudflare, HelloAsso, Strava au nom du club
- [ ] Liste des accès (qui a accès à quoi), conservée hors du repo

## 5. Nom de domaine
- [ ] Achat au nom de l'association, renouvellement automatique activé
- [ ] DNS + HTTPS (procédure dans `docs/GUIDE-TECHNIQUE.md`)
- [ ] Mettre à jour `astro.config.mjs` (`site`, supprimer `base`) et `public/admin/config.yml`

## 6. Accompagner les bénévoles
- [ ] Captures d'écran dans `docs/GUIDE-REDACTEUR.md`
- [ ] Séance de prise en main de 30 minutes
- [ ] Désigner 1-2 référents

## Technique
- [x] Figer la version de Sveltia CMS (0.250.2) : mise à jour manuelle, voir `docs/GUIDE-TECHNIQUE.md`
- [x] Corriger `CLAUDE.md` : `club.yml` → `club.json`
- [x] Page 404 aux couleurs du club
- [x] Plan du site (sitemap), robots.txt et image d'aperçu pour les partages (WhatsApp, Facebook)
- [x] Menu repliable sur mobile
- [ ] Plus tard : profil d'altitude des parcours, statistiques sans cookie (GoatCounter)

## Rappel : mises à jour Dependabot
Une fois par mois, Dependabot propose des mises à jour sous forme de PR. **Ne fusionner que si la vérification de la PR est verte** : le build tourne désormais sur chaque PR.
