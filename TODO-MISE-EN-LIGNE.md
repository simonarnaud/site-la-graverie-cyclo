# Avant la mise en ligne officielle

Tout ce qu'il reste à faire avant d'annoncer le site aux membres et au public, dans l'ordre conseillé.
Le site fonctionne déjà sur https://simonarnaud.github.io/site-la-graverie-cyclo/ : cette liste concerne le **contenu réel**, les **comptes au nom du club** et le **domaine**.

Qui fait quoi : 🏛️ bureau · ✍️ rédacteur (dans le CMS) · 🛠️ responsable technique.
Les informations à demander au bureau sont regroupées dans [docs/FICHE-INFOS-BUREAU.md](docs/FICHE-INFOS-BUREAU.md).

---

## 1. Décisions et informations du bureau 🏛️

- [ ] Valider le **nom affiché** du club : « La Graverie Cyclos »
- [ ] Valider le **logo** (`src/assets/logo.png`) et l'**image d'aperçu** des partages WhatsApp/Facebook (`src/assets/apercu.jpg`), ou fournir les fichiers officiels
- [ ] Valider la **devise** (« Si tu t’arrêtes de pédaler, tu tombes ! ») et le **slogan** (« Route, gravel et VTT entre bocage et collines »)
- [ ] Fournir l'**adresse du siège** et le **numéro RNA** de l'association (mentions légales obligatoires)
- [ ] Nommer le ou la **directeur·rice de la publication** (en général le ou la président·e)
- [ ] Lister les **membres du bureau** à afficher, **avec leur accord écrit** (sinon, ne garder que les rôles)
- [ ] Désigner **qui gère le site** : 1 responsable technique + 1 ou 2 référents pour les rédacteurs
- [ ] Lister les **rédacteurs** (bénévoles qui publieront) et leur email
- [ ] Choisir le **nom de domaine** (ex. `lagraveriecyclos.fr`) et qui le paie (≈ 10-15 €/an, seule dépense du projet)
- [ ] Décider si l'on active les **adhésions en ligne HelloAsso**
- [ ] Rappeler la règle **droit à l'image** aux membres : accord des personnes reconnaissables, autorisation parentale pour les mineurs

## 2. Comptes au nom du club 🏛️ 🛠️

Tous créés avec l'adresse du club, **jamais une adresse personnelle**, avec 2 ou 3 personnes ayant accès et la double authentification (2FA).

- [x] Adresse email du club : **lagraveriecyclos@gmail.com**
- [ ] Partager l'accès à cette boîte avec 2 ou 3 membres du bureau (et ajouter un téléphone/email de récupération du club)
- [ ] **Organisation GitHub** du club (gratuite), 2-3 propriétaires avec 2FA, équipe « Rédaction » avec le droit *Write*
- [ ] **Compte Cloudflare** du club (pour le relais de connexion au CMS)
- [ ] **GoatCounter** du club (statistiques de visite), par exemple `lagraveriecyclos` (procédure dans [docs/GUIDE-TECHNIQUE.md](docs/GUIDE-TECHNIQUE.md), section « Statistiques de visite »)
- [ ] **Club Strava** (pour les boutons « Je participe sur Strava ») : vérifier qu'il existe et qu'il est administré par le bureau
- [ ] **Album photos partagé** du club (Google Photos avec le compte du club, ou autre) pour les albums complets
- [ ] **HelloAsso** (si les adhésions en ligne sont retenues)
- [ ] **Compte chez le registrar** du nom de domaine (OVH, Gandi…) au nom de l'association
- [ ] Rédiger la **liste des accès** (qui a accès à quoi), conservée **hors du repo** (document partagé du bureau)

## 3. Transfert technique vers le club 🛠️

- [ ] Transférer le repo `simonarnaud/site-la-graverie-cyclo` vers l'organisation du club (Settings → General → Transfer ownership)
- [ ] Mettre à jour `repo:` dans `public/admin/config.yml`
- [ ] Recréer l'**OAuth App GitHub** « CMS La Graverie Cyclos » sous l'organisation (Redirect URI = adresse du relais + `/callback`)
- [ ] Recréer le **relais `sveltia-cms-auth`** sur le Cloudflare du club, avec les variables `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ALLOWED_DOMAINS` ; mettre à jour `base_url` dans `public/admin/config.yml`
- [ ] Transférer aussi le repo privé `simonarnaud/sveltia-cms-auth` dans l'organisation
- [ ] Remplacer le code GoatCounter de test (`lagraveriecyclostest`) par celui du club dans le CMS (Le club › Coordonnées et bureau), puis supprimer le compte de test
- [ ] Vérifier Settings → Pages → Source : **GitHub Actions**, et que les workflows « Déploiement » et « Archivage des albums » sont actifs
- [ ] Tester « Se connecter avec GitHub » dans le CMS après le transfert

## 4. Nom de domaine 🛠️

Procédure détaillée : [docs/GUIDE-TECHNIQUE.md](docs/GUIDE-TECHNIQUE.md), section « Passer au domaine du club ».

- [ ] Acheter le domaine au nom de l'association, **renouvellement automatique** activé, plusieurs contacts
- [ ] DNS : 4 enregistrements `A`, 4 `AAAA` et `CNAME www` vers GitHub Pages
- [ ] GitHub : vérifier le domaine (organisation → Pages → Verified domains), le renseigner dans Settings → Pages, cocher **Enforce HTTPS**
- [ ] `astro.config.mjs` : `site` = nouvelle adresse, **supprimer `base`**
- [ ] `public/admin/config.yml` : `site_url` et `display_url`
- [ ] Relais Cloudflare : ajouter le domaine dans `ALLOWED_DOMAINS`
- [ ] GoatCounter : renseigner le nouveau domaine dans les réglages du site
- [ ] Régénérer le **QR code** (`npm run qrcode`) **avant toute impression**
- [ ] Remplacer les adresses `simonarnaud.github.io` dans `README.md`, `docs/GUIDE-REDACTEUR.md`, `CLAUDE.md` et la fiche du bureau
- [ ] Vérifier que l'ancienne adresse redirige bien (GitHub le fait automatiquement)

## 5. Textes du site ✍️

Tout se modifie dans le CMS.

- [ ] **Le club › Coordonnées et bureau** : devise, slogan, ville, réseaux (remplacer le lien générique `https://www.strava.com/` par celui du club Strava ; ajouter Facebook/Instagram s'il y en a), bureau, lien HelloAsso
- [ ] **Le club › Page de présentation** : texte de présentation (histoire, esprit, pratiques, niveaux, accueil des nouveaux, jours d'entraînement) ; supprimer « (Texte de présentation à rédiger.) »
- [ ] **Le club › Mentions légales** : siège, RNA, directeur·rice de la publication
- [ ] **Le club › Politique de confidentialité** : relire ; ajouter les liens **Google Maps** (point de départ des activités) aux services tiers
- [ ] **Le club › Page Partenaires** : texte de remerciement ; supprimer la mention « Texte d'exemple »
- [ ] Remplir « Responsable du site » en bas de [docs/GUIDE-REDACTEUR.md](docs/GUIDE-REDACTEUR.md)

## 6. Supprimer le contenu d'exemple et de test ✍️

Supprimer une fiche dans le CMS supprime aussi ses photos et fichiers.

- [ ] **Calendrier** (10) : La mont-blanc, Boucle du bocage, Cyclo Test, Sortie d'automne, Test GMAPS, Entraînement du mercredi, Gravel des collines, Rando des collines normandes, Course VTT de la Souleuvre, Rando VTT des bois
- [ ] **Parcours d'entraînement** (3) : Boucle du bocage, Gravel des collines, Parcours test (supprimer d'abord les activités qui les utilisent)
- [ ] **Actualités** (5) : Assemblée générale le samedi 5 décembre, Test actualité, Mon actualité test, Les nouveaux maillots du club sont arrivés, Retour sur la sortie d'automne
- [ ] **Photos** (4) : Rando de rentrée (exemple), Sortie d'automne, Test album photos, Titre
- [ ] **Documents** (2) : Test PDF ; Programme de la saison 2022 – FSGT 14 (garder seulement s'il est utile, sinon le remplacer par le programme en cours)
- [ ] **Partenaires** (3) : Boulangerie du Bourg, Cycles Normandie, Mairie de La Graverie (tous « exemple »)

## 7. Vrai contenu ✍️

- [ ] **Parcours d'entraînement** habituels du club, avec leur GPX **coupé au départ et à l'arrivée** (aucun domicile visible)
- [ ] **Calendrier** des prochains mois : entraînements avec point de départ sur la carte, lien Strava
- [ ] **Programme FSGT** de la saison : l'importer (« 📄 Importer un programme FSGT ») et le publier dans Documents › Calendriers FSGT
- [ ] **Documents** : statuts, règlement intérieur, bulletin d'adhésion, dernier compte rendu d'AG
- [ ] **Partenaires** réels avec leur logo (avec leur accord pour l'affichage)
- [ ] Une **actualité d'ouverture** (« Le site du club est en ligne ! »)
- [ ] Un ou deux **albums** récents (12 photos max, avec l'accord des personnes reconnaissables)

## 8. Vérifications avant l'annonce 🛠️

- [ ] Tester le **champ « Point de départ sur la carte »** dans le CMS (recherche d'adresse, clic) : pas encore testé dans l'éditeur
- [ ] Valider l'**import FSGT** avec le vrai programme de la saison (`node scripts/essai-fsgt.mjs programme.pdf`, puis l'ajouter à `scripts/fsgt/exemples/` avec un test)
- [ ] Parcourir tout le site **sur téléphone** (menu, calendrier, fiche d'une activité, carte, téléchargement GPX, abonnement au calendrier)
- [ ] Tester l'**abonnement au calendrier** (`/sorties.ics`) sur iPhone et Android
- [ ] Tester l'envoi d'une **photo d'iPhone** (HEIC) depuis le CMS
- [ ] Vérifier qu'aucune **donnée personnelle** n'est dans le repo (noms sans accord, téléphones, adresses, GPX non coupés)
- [ ] Vérifier le **bandeau d'état** du CMS : aucun contenu signalé en rouge
- [ ] Tester un **partage du lien** sur WhatsApp/Facebook (image d'aperçu, titre)
- [ ] Inscrire le site dans **Google Search Console** (facultatif, pour le référencement)

## 9. Accompagner les bénévoles 🛠️ 🏛️

- [ ] Chaque rédacteur crée son **compte GitHub** et l'envoie ; l'ajouter à l'équipe « Rédaction »
- [ ] Ajouter les **captures d'écran** dans [docs/GUIDE-REDACTEUR.md](docs/GUIDE-REDACTEUR.md)
- [ ] **Séance de prise en main** de 30 minutes (créer une activité, une actualité, un album, importer un PDF FSGT)
- [ ] Transmettre aux référents le guide du rédacteur et la liste des accès

## 10. Annonce 🏛️

- [ ] Imprimer le **QR code** (version affiche dans `docs/qrcode/`) pour le local, les randos, les flyers
- [ ] Annoncer le site aux membres (email, groupe WhatsApp, club Strava) avec le lien d'**abonnement au calendrier**
- [ ] Mettre le lien du site sur les réseaux du club et chez les partenaires / la mairie
- [ ] Prévenir la FSGT et les clubs voisins

---

**Après la mise en ligne** : une fois par mois, fusionner les mises à jour Dependabot si la vérification est verte ; deux fois par an, mettre à jour Sveltia CMS. Si le site n'a reçu aucun commit pendant 60 jours, réactiver le rebuild quotidien dans l'onglet Actions de GitHub.
