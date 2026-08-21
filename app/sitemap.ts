import type { MetadataRoute } from 'next';
import { getContent } from '@/lib/content/source';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { identity, services } = await getContent();

  const entries: MetadataRoute.Sitemap = [
    {
      url: identity.siteUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];

  /* Only when it is switched on: the route 404s while `visible` is false, and
     submitting a URL that 404s is how a site loses crawl budget and picks up
     coverage errors in Search Console. */
  if (services.visible) {
    entries.push({
      url: new URL('/services', identity.siteUrl).toString(),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    });
  }

  return entries;
}
