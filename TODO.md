# À faire

Liste des prochains travaux, par ordre de priorité. Cocher au fur et à mesure.

**Liste complète de ce qu'il faut faire avant la mise en ligne officielle : [TODO-MISE-EN-LIGNE.md](TODO-MISE-EN-LIGNE.md).**

## 1. Tester la publication depuis le CMS
Tous les tests réussis le 23/10/2026 (sortie + parcours, actualité avec photo de téléphone, album, PDF) :
- [x] Créer une sortie : nom du fichier (date de la sortie), heure enregistrée avec le fuseau de Paris, liste des parcours
- [x] Créer une actualité avec une photo prise au téléphone : conversion WebP, photo rangée à côté de l'article
- [x] Créer un album photo (avec lien Google Photos)
- [x] Ajouter une rando ou une course (champ « Type » et « Organisateur »)
- [x] Déposer un PDF dans « Documents »
- [x] Vérifier que le site se met à jour environ 2 minutes après l'enregistrement

## 2. Remplacer le contenu d'exemple
- [ ] Présentation du club (devise et slogan validés)
- [x] Adresse email du club : lagraveriecyclos@gmail.com (27/10/2026)
- [ ] Bureau : noms publiés uniquement avec l'accord des personnes
- [ ] Mentions légales : adresse du siège, numéro RNA, directeur·rice de la publication
- [ ] Vraies traces GPX, coupées au départ et à l'arrivée
- [ ] Supprimer les contenus d'exemple et de test : sorties, actualités (4), albums (« Sortie d'automne », « Rando de rentrée », « test-album-photos », « Titre »), document « Test PDF », partenaires (3) et texte de la page Partenaires
- [ ] Lien d'adhésion HelloAsso (facultatif)

## 3. Connexion des bénévoles au CMS
À faire avant d'inviter des bénévoles (le jeton d'accès est trop technique pour eux) :
- [x] Option A : OAuth App GitHub + relais `sveltia-cms-auth` sur Cloudflare Workers, `base_url` dans le CMS (23/10/2026)
- [x] Tester « Se connecter avec GitHub » sur le site en ligne (OK le 23/10/2026)
- [x] Supprimer le Worker Cloudflare `site-la-graverie-cyclo` créé par erreur (garder le jeton d'API « site-la-graverie-cyclo build token », utilisé par le relais)
- [x] Restreindre l'app GitHub « Cloudflare Workers and Pages » au seul repo `sveltia-cms-auth`
- [ ] Si un bénévole bloque sur GitHub : tester Pages CMS (invitation par email, sans compte GitHub)

## 4. Mettre le projet au nom du club
- [x] Adresse email du club : lagraveriecyclos@gmail.com
- [ ] Partager l'accès à cette adresse avec 2-3 membres du bureau
- [ ] Organisation GitHub du club (2-3 propriétaires, 2FA), puis transfert du repo
- [ ] Comptes Cloudflare, HelloAsso, Strava au nom du club
- [ ] Liste des accès (qui a accès à quoi), conservée hors du repo

## 5. Nom de domaine
- [ ] Achat au nom de l'association, renouvellement automatique activé
- [ ] DNS + HTTPS (procédure dans `docs/GUIDE-TECHNIQUE.md`)
- [ ] Mettre à jour `astro.config.mjs` (`site`, supprimer `base`) et `public/admin/config.yml`
- [ ] Régénérer le QR code (`npm run qrcode`) avec la nouvelle adresse, avant toute impression
- [ ] Mettre à jour les adresses du `README.md` et du guide du rédacteur

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
- [x] Profil d'altitude des parcours
- [x] Statistiques sans cookie (GoatCounter) : intégration prête, désactivée
- [x] Compte GoatCounter **de test** `lagraveriecyclostest` activé (créé avec une adresse perso)
- [ ] Créer le compte GoatCounter **du club** (adresse du club) et remplacer le code dans le CMS (Le club → Coordonnées et bureau), voir `docs/GUIDE-TECHNIQUE.md`
- [x] Import des programmes FSGT (PDF) depuis le CMS : lecture immédiate, doublons signalés, création des activités cochées
- [x] Sections dans la page Documents (Calendriers FSGT, Comptes rendus d'AG…)
- [x] Indicateur « Trace GPX » / « Sans trace GPX » sur chaque activité (site et liste du CMS)
- [x] Boutons « Voir le site » et « Importer un programme FSGT » du CMS ouverts dans le même onglet
- [x] Point de départ placé sur une carte dans le CMS → « Voir sur Google Maps » et « Itinéraire » sur la fiche
- [x] Devise du club sur la page d'accueil (modifiable dans le CMS)
- [ ] Valider l'import FSGT avec d'autres PDF (`node scripts/essai-fsgt.mjs`, puis les ajouter à `scripts/fsgt/exemples/` + tests)

## Rappel : mises à jour Dependabot
Une fois par mois, Dependabot propose des mises à jour sous forme de PR. **Ne fusionner que si la vérification de la PR est verte** : le build tourne désormais sur chaque PR.
