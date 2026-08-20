import { getContent } from '@/lib/content/source';
import { resolveSections, type SectionId } from '@/lib/content/schema';
import { SiteHeader } from '@/components/site-header';
import { Hero } from '@/components/hero';
import { Work } from '@/components/work';
import { Experience } from '@/components/experience';
import { Scope } from '@/components/scope';
import { Expertise } from '@/components/expertise';
import { About } from '@/components/about';
import { Contact, SiteFooter } from '@/components/contact';
import { StructuredData } from '@/components/structured-data';

/**
 * The whole site is one page, assembled in the order stored in the content
 * document rather than hardcoded here — that order is editable in the admin.
 *
 * The spine index (01, 02, …) is derived from position, so reordering
 * renumbers the page automatically. It used to be hardcoded inside each
 * section, which was fine only while the order could not change.
 *
 * Hero is always first and the footer always last; neither is orderable,
 * because a hero that is not at the top and a footer that is not at the
 * bottom are not those things.
 */
export default async function Page() {
  const content = await getContent();
  const sections = resolveSections(content.sections).filter((s) => s.visible);

  const render: Record<SectionId, (index: string) => React.ReactNode> = {
    work: (index) => <Work content={content} index={index} />,
    experience: (index) => <Experience entries={content.experience} index={index} />,
    scope: (index) => <Scope content={content} index={index} />,
    expertise: (index) => <Expertise content={content} index={index} />,
    about: (index) => <About content={content} index={index} />,
    contact: (index) => <Contact content={content} index={index} />,
  };

  return (
    <>
      {/* SiteHeader and Experience are client components, so every prop they
          take is serialised into the RSC payload embedded in the page HTML and
          is readable by anyone who views source. They therefore get only the
          fields they render — handing them the whole document would publish
          the phone number that `showPhone: false` exists to keep off the page.
          The server components below can safely take it whole. */}
      <SiteHeader
        name={content.identity.name}
        credentials={content.identity.credentials}
        sections={sections}
        themeDefault={content.theme}
      />
      <main id="main">
        <Hero content={content} />
        {sections.map((section, i) => (
          <div key={section.id}>
            {render[section.id](String(i + 1).padStart(2, '0'))}
          </div>
        ))}
      </main>
      <SiteFooter name={content.identity.name} />
      <StructuredData content={content} />
    </>
  );
}
