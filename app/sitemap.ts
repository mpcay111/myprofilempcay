import type { MetadataRoute } from 'next';
import { getContent } from '@/lib/content/source';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { identity } = await getContent();

  return [
    {
      url: identity.siteUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
