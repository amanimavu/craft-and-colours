import type { APIRoute } from 'astro';

const disallow = [
  '/cart/',
  '/checkout/',
  '/order-confirmation/',
  '/wishlist/',
  '/styleguide/',
];

export const GET: APIRoute = ({ site }) => {
  const lines = [
    'User-agent: *',
    'Allow: /',
    ...disallow.map((path) => `Disallow: ${path}`),
  ];

  if (site) {
    lines.push('', `Sitemap: ${new URL('sitemap-index.xml', site).href}`);
  }

  return new Response(`${lines.join('\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
