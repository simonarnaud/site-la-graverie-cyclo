// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Adresse publique du site.
  // Quand le domaine du club sera branché : site: 'https://www.domaine-du-club.fr' et supprimer `base`.
  site: 'https://simonarnaud.github.io',
  base: '/site-la-graverie-cyclo',
  // Plan du site pour les moteurs de recherche (sitemap-index.xml)
  integrations: [sitemap()],
});
