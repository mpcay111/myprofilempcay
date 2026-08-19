import { allTechnologies, type SiteContent } from '@/lib/content/schema';
import { isPlaceholder, orNull, realOnly } from '@/lib/placeholder';

/**
 * JSON-LD structured data.
 *
 * Every value passes through the placeholder filter first, so an unfinished
 * site never emits "[Year]" or "[username]" into search results. The phone
 * number is only included when `showPhone` is on — same rule as the visible
 * page, and it matters more here because structured data is machine-harvested.
 */
export function StructuredData({ content }: { content: SiteContent }) {
  const { identity, email, phone, showPhone, socials, experience, education } = content;

  const name = orNull(identity.name);
  const realSocials = socials.map((s) => s.href).filter((href) => !isPlaceholder(href));
  const technologies = allTechnologies(content);

  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    ...(name ? { name } : {}),
    ...(identity.credentials ? { honorificSuffix: identity.credentials } : {}),
    ...(orNull(identity.role) ? { jobTitle: identity.role } : {}),
    url: identity.siteUrl,
    email: `mailto:${email}`,
    ...(showPhone && !isPlaceholder(phone) ? { telephone: phone } : {}),
    ...(orNull(identity.statement) ? { description: identity.statement } : {}),
    ...(orNull(identity.location)
      ? {
          address: {
            '@type': 'PostalAddress',
            addressLocality: identity.location,
          },
        }
      : {}),
    ...(technologies.length > 0 ? { knowsAbout: technologies } : {}),
    ...(content.languages.length > 0 ? { knowsLanguage: realOnly(content.languages) } : {}),
    ...(realSocials.length > 0 ? { sameAs: realSocials } : {}),
    ...(experience.length > 0 && !isPlaceholder(experience[0].company)
      ? {
          worksFor: {
            '@type': 'Organization',
            name: experience[0].company,
          },
        }
      : {}),
    ...(education.length > 0
      ? {
          alumniOf: education
            .filter((e) => !isPlaceholder(e.institution))
            .map((e) => ({
              '@type': 'EducationalOrganization',
              name: e.institution,
            })),
        }
      : {}),
    ...(realOnly(content.certifications).length > 0
      ? {
          hasCredential: realOnly(content.certifications).map((c) => ({
            '@type': 'EducationalOccupationalCredential',
            name: c,
          })),
        }
      : {}),
  };

  const realProjects = content.projects.filter(
    (p) => !isPlaceholder(p.name) && !isPlaceholder(p.tagline),
  );

  const portfolio =
    realProjects.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: name ? `${name} — Selected Systems` : 'Selected Systems',
          url: `${identity.siteUrl}/#work`,
          hasPart: realProjects.map((p) => ({
            '@type': 'SoftwareApplication',
            name: p.name,
            description: p.tagline,
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            ...(p.liveUrl ? { url: p.liveUrl } : {}),
            ...(realOnly(p.builtWith).length > 0
              ? { softwareRequirements: realOnly(p.builtWith).join(', ') }
              : {}),
            ...(name ? { author: { '@type': 'Person', name } } : {}),
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }}
      />
      {portfolio && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(portfolio) }}
        />
      )}
    </>
  );
}
