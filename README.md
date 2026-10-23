# Site de La Graverie Cyclo

Site statique du club : sorties, parcours avec carte et GPX, actualités, photos.

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
