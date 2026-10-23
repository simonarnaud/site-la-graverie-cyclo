// robots.txt : indique le plan du site et exclut l'administration.
// Les moteurs ne le lisent qu'à la racine du domaine : il sera pleinement utile une fois le domaine du club branché.
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const plan = new URL(`${base}sitemap-index.xml`, site);
  return new Response(`User-agent: *\nDisallow: ${base}admin/\n\nSitemap: ${plan}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
