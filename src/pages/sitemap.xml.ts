import type { APIRoute } from 'astro';
import { getPosts } from '../lib/journal';

export const GET: APIRoute = async ({ site }) => {
  const posts = await getPosts();
  const day = (d: Date) => d.toISOString().slice(0, 10);
  const urls = [
    { path: '/' },
    { path: '/journal', lastmod: day(new Date(Math.max(...posts.map((p) => p.data.date.getTime())))) },
    ...posts.map((p) => ({ path: `/journal/${p.id}`, lastmod: day(p.data.date) })),
    { path: '/mentions-legales' },
    { path: '/confidentialite' },
  ];
  const body = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${new URL(u.path, site)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n') +
    '\n</urlset>\n';
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
