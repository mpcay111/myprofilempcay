import { getContent } from '@/lib/content/source';
import { SiteHeader } from '@/components/site-header';
import { Hero } from '@/components/hero';
import { Work } from '@/components/work';
import { Experience } from '@/components/experience';
import { Scope } from '@/components/scope';
import { Expertise } from '@/components/expertise';
import { About } from '@/components/about';
import { Contact } from '@/components/contact';
import { StructuredData } from '@/components/structured-data';

/**
 * The whole site is one page. Section order is deliberate: the systems he built
 * come before the roles he held, because the systems are the differentiator and
 * the roles are the corroboration.
 *
 * Content is read once here and passed down, rather than each section importing
 * it — that is what lets the admin change the page without a rebuild. The read
 * is cached and invalidated on save, so this is not a database round trip per
 * visitor.
 *
 * Each section owns its own spine index (00–06) internally, so reordering the
 * components below will not renumber them. If you move one, fix its `index`
 * prop in the component itself and the matching entry in `navigation`.
 */
export default async function Page() {
  const content = await getContent();

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
        navigation={content.navigation}
      />
      <main id="main">
        <Hero content={content} />
        <Work content={content} />
        <Experience entries={content.experience} />
        <Scope content={content} />
        <Expertise content={content} />
        <About content={content} />
        <Contact content={content} />
      </main>
      <StructuredData content={content} />
    </>
  );
}
