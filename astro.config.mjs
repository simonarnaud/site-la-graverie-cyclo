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
  // (sans la redirection /sorties/ ni la page d'import du CMS)
  integrations: [sitemap({ filter: (page) => !page.endsWith('/sorties/') && !page.includes('/admin/') })],
  // La lecture des PDF (pdf.js, ~1,6 Mo) n'est chargée que par la page d'import FSGT du CMS
  vite: { build: { chunkSizeWarningLimit: 2000 } },
});
