import type { MetadataRoute } from 'next';
import { getContent } from '@/lib/content/source';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { identity } = await getContent();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The admin has no business in an index. Middleware already blocks it,
      // but a crawler that never asks is better than one that gets a redirect.
      disallow: ['/admin', '/api/'],
    },
    sitemap: `${identity.siteUrl}/sitemap.xml`,
  };
}
