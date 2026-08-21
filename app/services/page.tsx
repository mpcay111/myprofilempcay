import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getContent } from '@/lib/content/source';
import { visibleSections } from '@/lib/content/schema';
import { orFallback } from '@/lib/placeholder';
import { SiteHeader } from '@/components/site-header';
import { LogoMarquee } from '@/components/logo-marquee';
import { Services, serviceElementId } from '@/components/services';
import { ActiveSectionProvider } from '@/components/active-section';
import { SiteFooter } from '@/components/contact';
import { ServicesStructuredData } from '@/components/structured-data';

/**
 * /services — the one page that is not the one-pager.
 *
 * `visible: false` in the admin 404s this route as well as removing the menu
 * link. Hiding only the link would leave the page fully readable to anyone who
 * typed the URL or followed a stale search result, which is not what "hidden"
 * means to the person who switched it off.
 */

export async function generateMetadata(): Promise<Metadata> {
  const { services, identity } = await getContent();

  if (!services.visible) return { robots: { index: false, follow: false } };

  /* Falls back through the fields most likely to be filled, so an empty
     description tag is impossible. */
  const description =
    services.metaDescription ??
    services.intro ??
    orFallback(identity.statement, 'Operations leadership and the systems behind it.');

  const canonical = new URL('/services', identity.siteUrl).toString();

  return {
    // The root layout's template turns this into "Services — <name>".
    title: services.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      title: `${services.title} — ${orFallback(identity.name, 'Portfolio')}`,
      description,
    },
    twitter: { card: 'summary_large_image', title: services.title, description },
  };
}

export default async function ServicesPage() {
  const content = await getContent();

  if (!content.services.visible) notFound();

  const sections = visibleSections(content);

  /* The spine's gauge and current-service mark read this, the same way the home
     page's sections do. */
  const serviceIds = content.services.items.map((_, i) => serviceElementId(i));

  return (
    <ActiveSectionProvider ids={serviceIds}>
      {/* Narrow props for the same reason as the home page: this is a client
          component, so anything handed to it is serialised into the RSC
          payload embedded in the HTML and is readable by view-source. */}
      <SiteHeader
        name={content.identity.name}
        credentials={content.identity.credentials}
        sections={sections}
        themeDefault={content.theme}
        servicesLabel={content.services.label}
      />
      <LogoMarquee logos={content.logos} />

      <main id="main">
        <Services services={content.services} email={content.email} />
      </main>
      <SiteFooter name={content.identity.name} />
      <ServicesStructuredData content={content} />
    </ActiveSectionProvider>
  );
}
