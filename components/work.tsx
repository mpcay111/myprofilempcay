import Image from 'next/image';
import { ArrowUpRight, Code2 } from 'lucide-react';

import { Section } from '@/components/section';
import { Rule } from '@/components/rule';
import { Reveal } from '@/components/reveal';
import { SpecList, SpecRow, Token } from '@/components/spec';
import { Copy, SpecValue } from '@/components/placeholder-text';
import { sizeOf } from '@/lib/image-sizes';
import { realOnly, spellOut } from '@/lib/placeholder';
import { orderProjects, type Project, type SiteContent } from '@/lib/content/schema';

/* ── The spec rail ──────────────────────────────────────────────────────── */

/**
 * The signature device, and the reason featured and compact entries still read
 * as one series: it is byte-identical in both treatments and occupies the same
 * right-hand column all the way down the section, so the five labels line up
 * across seven projects and can be compared vertically. The row metrics come
 * from the shared SpecList/SpecRow so the rail here matches the one in the
 * hero and the contact block exactly.
 *
 * Unfilled fields render as an em dash rather than disappearing. A visible gap
 * in a column of hard specifics is information; a silently shorter list is not.
 */
function SpecRail({ project }: { project: Project }) {
  const builtWith = realOnly(project.builtWith);

  return (
    <SpecList framed>
      <SpecRow term="Role">
        <SpecValue value={project.role} />
      </SpecRow>

      <SpecRow term="Built with">
        {builtWith.length === 0 ? (
          <SpecValue value={null} />
        ) : (
          <ul role="list" className="flex flex-wrap gap-1.5">
            {builtWith.map((tool) => (
              // The li is made a flex container so the inline token box takes
              // its own padding rather than overflowing the line.
              <li key={tool} className="flex">
                <Token>{tool}</Token>
              </li>
            ))}
          </ul>
        )}
      </SpecRow>

      <SpecRow term="Used by">
        <SpecValue value={project.usedBy} />
      </SpecRow>

      <SpecRow term="Period">
        <span className="font-mono">
          <SpecValue value={project.period} />
        </span>
      </SpecRow>

      <SpecRow term="Impact">
        <SpecValue value={project.impact} />
      </SpecRow>
    </SpecList>
  );
}

/* ── Shared parts ───────────────────────────────────────────────────────── */

/**
 * The hairline that closes a project's header.
 *
 * It only draws itself across in accent when the project actually has links to
 * reach: an accent sweep is a promise that something under the cursor is
 * clickable, and the hover target is the whole row including the spec rail. On
 * a linkless project the same hairline stays a plain static separator.
 * `group-focus-within` mirrors the sweep for keyboard users reaching the links.
 */
function HoverRule({ interactive }: { interactive: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="relative mt-6 block h-px w-full bg-border"
    >
      {interactive && (
        <span className="absolute inset-0 origin-left scale-x-0 bg-accent transition-transform duration-500 ease-out group-hover:scale-x-100 group-focus-within:scale-x-100" />
      )}
    </span>
  );
}

function ProjectHeader({
  project,
  id,
  featured,
  hasLinks,
}: {
  project: Project;
  id: string;
  featured: boolean;
  hasLinks: boolean;
}) {
  return (
    <>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="label text-accent" aria-hidden="true">
          {id}
        </span>
        <span
          className={
            hasLinks
              ? 'label break-all transition-colors group-hover:text-accent group-focus-within:text-accent'
              : 'label break-all'
          }
        >
          {project.slug}
        </span>
      </p>

      <h3
        className={
          featured
            ? 'mt-5 max-w-[22ch] text-[clamp(1.5rem,2.6vw,2.125rem)] font-semibold leading-[1.05] tracking-[-0.02em]'
            : 'mt-4 max-w-[26ch] text-[1.1875rem] font-semibold leading-[1.15] tracking-[-0.02em] md:text-[1.3125rem]'
        }
      >
        {project.name}
      </h3>

      <p
        className={
          featured
            ? 'mt-3 max-w-prose text-[1.0625rem] leading-[1.55] text-muted'
            : 'mt-2.5 max-w-narrative text-[0.9375rem] leading-[1.55] text-muted'
        }
      >
        <Copy>{project.tagline}</Copy>
      </p>
    </>
  );
}

function Capabilities({
  items,
  featured,
}: {
  items: readonly string[];
  featured: boolean;
}) {
  return (
    <ul
      role="list"
      className={featured ? 'mt-8 border-t border-border' : 'mt-5 border-t border-border'}
    >
      {items.map((capability, i) => (
        <li
          key={capability}
          /* items-baseline, not a nudge. The ordinal used to carry `pt-1` — a
             hardcoded 4px standing in for baseline alignment, and the same 4px
             was applied beside 15px text in featured rows and 14px text in
             compact ones, so it could not be right in both. `.label` sets
             `leading-none`, which makes the mono baseline resolve exactly, and
             alignment now follows whatever size sits next to it. */
          className={`grid grid-cols-[2rem_1fr] items-baseline gap-x-2 border-b border-border ${
            featured ? 'py-3' : 'py-2.5'
          }`}
        >
          <span className="label" aria-hidden="true">
            {String(i + 1).padStart(2, '0')}
          </span>
          <span
            className={
              featured
                ? 'text-[0.9375rem] leading-[1.5] text-foreground'
                : 'text-[0.875rem] leading-[1.5] text-foreground'
            }
          >
            <Copy>{capability}</Copy>
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Two of the seven systems have no publishable screenshot. Rather than reserve
 * an empty box, the frame carries the system's own identifier — an absence
 * that looks specified rather than failed. That branch is the one place a fixed
 * ratio belongs, because reserving the space is the entire point of it.
 *
 * A real screenshot instead keeps its own measured ratio: these captures run
 * from 1.34:1 to 2.79:1, and a shared frame plus object-cover would cut away
 * the exact columns and steps the alt text promises the reader.
 */
function Shot({ project, featured }: { project: Project; featured: boolean }) {
  if (!project.image || !project.imageAlt) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center border border-border bg-surface px-4">
        <span
          aria-hidden="true"
          className={`label break-all text-center ${
            featured ? 'text-base' : 'text-[0.8125rem]'
          }`}
        >
          {project.slug}
        </span>
      </div>
    );
  }

  // Local screenshots under /public/projects have their measured dimensions in
  // the sizeOf table. An uploaded one is an absolute Storage URL that is not in
  // that table, and sizeOf would quietly hand back its 16:9 default — the exact
  // wrong ratio for a 2.79:1 capture. Those get generous declared dimensions
  // instead, used only to reserve layout space; `h-auto w-full` below is what
  // actually sizes the image, so both branches render at the file's own ratio
  // and neither one crops.
  const { width, height } = project.image.startsWith('https://')
    ? { width: 2000, height: 1500 }
    : sizeOf(project.image);

  return (
    <div className="overflow-hidden border border-border bg-surface">
      <Image
        src={project.image}
        alt={project.imageAlt}
        width={width}
        height={height}
        sizes={
          featured
            ? '(min-width: 1024px) 660px, (min-width: 640px) 90vw, 100vw'
            : '(min-width: 1024px) 250px, (min-width: 768px) 30vw, 100vw'
        }
        className="h-auto w-full"
      />
    </div>
  );
}

function Links({ project }: { project: Project }) {
  if (!project.liveUrl && !project.repoUrl) return null;

  return (
    <ul role="list" className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
      {project.liveUrl && (
        <li>
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="label inline-flex items-center gap-1.5 transition-colors hover:text-foreground focus-visible:text-foreground"
          >
            View live
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </li>
      )}
      {project.repoUrl && (
        <li>
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="label inline-flex items-center gap-1.5 transition-colors hover:text-foreground focus-visible:text-foreground"
          >
            Source
            <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </li>
      )}
    </ul>
  );
}

/* ── Treatments ─────────────────────────────────────────────────────────── */

function FeaturedEntry({ project, id }: { project: Project; id: string }) {
  const capabilities = project.capabilities;
  const hasLinks = Boolean(project.liveUrl || project.repoUrl);

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-x-10">
      <div className="lg:col-span-8">
        <ProjectHeader project={project} id={id} featured hasLinks={hasLinks} />
        <HoverRule interactive={hasLinks} />

        <div className="mt-8">
          <Shot project={project} featured />
        </div>

        <p className="mt-8 max-w-prose text-[1rem] leading-[1.65] text-muted md:text-[1.0625rem]">
          <Copy>{project.description}</Copy>
        </p>

        {capabilities.length > 0 && <Capabilities items={capabilities} featured />}

        <Links project={project} />
      </div>

      <div className="mt-10 lg:col-span-4 lg:mt-0 lg:border-l lg:border-border lg:pl-8">
        <SpecRail project={project} />
      </div>
    </div>
  );
}

function CompactEntry({ project, id }: { project: Project; id: string }) {
  const capabilities = project.capabilities;
  const hasLinks = Boolean(project.liveUrl || project.repoUrl);

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-x-10">
      <div className="lg:col-span-8">
        <ProjectHeader
          project={project}
          id={id}
          featured={false}
          hasLinks={hasLinks}
        />
        <HoverRule interactive={hasLinks} />

        <div className="mt-6 md:grid md:grid-cols-8 md:gap-x-6">
          <div className="md:col-span-3">
            <Shot project={project} featured={false} />
          </div>

          <div className="mt-5 md:col-span-5 md:mt-0">
            <p className="max-w-narrative text-[0.9375rem] leading-[1.6] text-muted">
              <Copy>{project.description}</Copy>
            </p>

            {capabilities.length > 0 && (
              <Capabilities items={capabilities} featured={false} />
            )}

            <Links project={project} />
          </div>
        </div>
      </div>

      <div className="mt-8 lg:col-span-4 lg:mt-0 lg:border-l lg:border-border lg:pl-8">
        <SpecRail project={project} />
      </div>
    </div>
  );
}

/* ── Section ────────────────────────────────────────────────────────────── */

/**
 * One gap governs the whole series, so every separator carries the same space
 * above and below it regardless of which treatment sits on either side. The
 * difference between featured and compact is carried entirely by the internal
 * type ramp, which is where it can be read as emphasis rather than as drift.
 */
const GAP = 'pb-14 md:pb-16';

export function Work({
  content,
  index,
}: {
  content: SiteContent;
  index: string;
}) {
  const projects = orderProjects(content.projects);

  return (
    <Section
      id="work"
      index={index}
      title="Selected Systems"
      standfirst={`${spellOut(projects.length)} operational systems, each designed and built to solve a problem inside a business I was running at the time.`}
    >
      <ol role="list">
        {projects.map((project, i) => {
          const id = String(i + 1).padStart(2, '0');
          const isLast = i === projects.length - 1;

          return (
            <Reveal
              as="li"
              key={project.slug}
              className={`group ${isLast ? '' : GAP}`}
            >
              {i > 0 && (
                <div className={GAP}>
                  <Rule />
                </div>
              )}

              {project.featured ? (
                <FeaturedEntry project={project} id={id} />
              ) : (
                <CompactEntry project={project} id={id} />
              )}
            </Reveal>
          );
        })}
      </ol>
    </Section>
  );
}
