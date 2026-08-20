import { Section } from '@/components/section';
import { Reveal } from '@/components/reveal';
import { SpecList, SpecRow } from '@/components/spec';
import { Copy } from '@/components/placeholder-text';
import type { SiteContent } from '@/lib/content/schema';

/**
 * Scope is set on the shared spec rail, not as a grid of icon cells.
 *
 * A four-up grid of icon + numeral + title + blurb gives all eight areas
 * identical weight and size, which is the defining property of a generic
 * features block: swap the eight labels for any other eight and the
 * composition is unchanged. The rail is the device the hero, work and contact
 * sections already carry, so setting scope on it makes this read as another
 * page of the same document. The area name is the term; what the area covers
 * is the value.
 *
 * The rail spans the whole content well so its hairlines land on the same
 * grid as every other rule on the page; the description carries its own
 * measure so the line length stays readable at that width.
 *
 * One reveal for the block rather than a per-row stagger — the rows are a
 * single object now, and staggering them would re-assert the cell reading the
 * rail exists to remove.
 *
 * ScopeArea deliberately has no `icon` field. Eight accent-coloured icons made
 * this one section spend most of the page's accent budget on decoration, and
 * turned it into the generic feature grid the design exists to avoid — the
 * accent belongs to data and state.
 */
export function Scope({
  content,
  index,
}: {
  content: SiteContent;
  index: string;
}) {
  return (
    <Section
      id="scope"
      index={index}
      title="Operating Scope"
      standfirst="Eight functional areas owned directly — the operating surface of the business, from the SOP that defines a task through to the cash flow that follows it."
    >
      <Reveal>
        <SpecList framed>
          {content.scope.map((area) => (
            <SpecRow key={area.label} term={area.label}>
              <span className="block max-w-prose">
                <Copy>{area.description}</Copy>
              </span>
            </SpecRow>
          ))}
        </SpecList>
      </Reveal>
    </Section>
  );
}
