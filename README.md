# Site de La Graverie Cyclos

Site statique du club, publié par les bénévoles depuis un CMS, sans serveur ni abonnement.

- **Calendrier** des entraînements, randos FSGT et courses (Cyclo, VTT, Gravel), avec point de départ sur Google Maps, trace GPX, participation via Strava et abonnement depuis l'agenda du téléphone (`/sorties.ics`) ;
- **import des programmes FSGT** (PDF) dans le calendrier, depuis le CMS ;
- **parcours d'entraînement** avec carte, profil d'altitude et GPX à télécharger ;
- actualités, photos (12 par album, album complet sur Google Photos), documents PDF par section, partenaires.

Contact du club : lagraveriecyclos@gmail.com

- **Site en ligne** : https://simonarnaud.github.io/site-la-graverie-cyclo/ (adresse provisoire, en attendant le domaine du club)
- **Espace rédaction (CMS)** : https://simonarnaud.github.io/site-la-graverie-cyclo/admin/ (aussi accessible par le lien « Espace rédaction » en bas de chaque page)

- **Publier du contenu** (bénévoles) : [docs/GUIDE-REDACTEUR.md](docs/GUIDE-REDACTEUR.md)
- **Faire évoluer le site** (développeurs) : [docs/GUIDE-TECHNIQUE.md](docs/GUIDE-TECHNIQUE.md)
- **Pourquoi ces choix** : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Démarrage rapide

Prérequis : [Node.js](https://nodejs.org) LTS (24 ou plus) et Git.

```bash
npm install
npm run dev
```

Le site est alors visible sur http://localhost:4321/site-la-graverie-cyclo/.

Chaque push sur `main` met le site en ligne automatiquement (GitHub Actions → GitHub Pages).
