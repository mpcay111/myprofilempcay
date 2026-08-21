'use client';

import type { SectionEditorProps } from '@/components/admin/editor';
import type { ServiceItem, ServicesContent } from '@/lib/content/schema';
import {
  Field,
  ItemCard,
  Panel,
  SecondaryButton,
  StringList,
  TextArea,
  TextInput,
  Toggle,
  moveItem,
} from '@/components/admin/ui';

/**
 * Services — the /services page.
 *
 * The only editor here that controls a whole page rather than a section, which
 * is why it carries the meta description and the visibility switch. Switching
 * it off removes the menu link, 404s the route and drops it from the sitemap
 * together, so there is no state where the page is "hidden" but still readable
 * to anyone holding the URL.
 */

const orEmpty = (v: string | null) => v ?? '';
const orNull = (v: string) => (v.trim() === '' ? null : v);

const emptyService = (): ServiceItem => ({
  title: 'New service',
  promise: null,
  deliverables: [],
  audience: null,
  format: null,
});

export function ServicesEditor({ content, onChange }: SectionEditorProps) {
  const services = content.services;

  const setServices = (changes: Partial<ServicesContent>) =>
    onChange({ ...content, services: { ...services, ...changes } });

  const setItems = (next: ServiceItem[]) => setServices({ items: next });

  const patch = (index: number, changes: Partial<ServiceItem>) =>
    setItems(services.items.map((s, i) => (i === index ? { ...s, ...changes } : s)));

  /* What search will actually show. metaDescription falls back to intro, so
     the count has to follow the same fallback or it would measure a field the
     page is not using. */
  const effectiveDescription = services.metaDescription ?? services.intro ?? '';
  const descriptionLength = effectiveDescription.length;

  return (
    <div className="space-y-10">
      <Panel title="The page">
        <p className="py-4 text-[0.8125rem] leading-[1.45] text-subtle">
          This one is a real page at{' '}
          <span className="font-mono text-foreground">/services</span>, not a
          section — so it has its own web address you can put in a proposal, an
          email signature or a LinkedIn profile.
        </p>

        <div className="py-4">
          <Toggle
            checked={services.visible}
            onChange={(v) => setServices({ visible: v })}
            label="Show the Services page"
          />
          <p className="mt-2 text-[0.8125rem] leading-[1.45] text-subtle">
            Off removes it from the menu, turns the address into a &ldquo;not
            found&rdquo; page, and takes it out of the sitemap. Nothing you have
            written here is deleted.
          </p>
        </div>

        <Field
          label="Menu label"
          hint="What the top menu says. Keep it short — the menu is one line on a phone."
        >
          {(id) => (
            <TextInput
              id={id}
              value={services.label}
              onChange={(v) => setServices({ label: v })}
              placeholder="Services"
            />
          )}
        </Field>

        <Field label="Page heading" hint="The large heading at the top of the page.">
          {(id) => (
            <TextInput
              id={id}
              value={services.title}
              onChange={(v) => setServices({ title: v })}
              placeholder="Services"
            />
          )}
        </Field>

        <Field
          label="Introduction"
          hint="One short paragraph under the heading. **bold** and ==highlight== work here."
        >
          {(id) => (
            <TextArea
              id={id}
              rows={3}
              value={orEmpty(services.intro)}
              onChange={(v) => setServices({ intro: orNull(v) })}
            />
          )}
        </Field>

        <Field
          label="Search description"
          hint="The sentence Google shows under the link. Leave blank to use the introduction above."
        >
          {(id) => (
            <>
              <TextArea
                id={id}
                rows={2}
                value={orEmpty(services.metaDescription)}
                onChange={(v) => setServices({ metaDescription: orNull(v) })}
              />
              <p className="mt-2 text-[0.8125rem] leading-[1.45] text-subtle">
                {descriptionLength === 0 ? (
                  'Nothing to show yet — write an introduction above, or a description here.'
                ) : (
                  <>
                    {descriptionLength} characters
                    {descriptionLength > 160 &&
                      ' — Google usually cuts off around 160, so the end may not be shown.'}
                    {descriptionLength > 0 &&
                      descriptionLength < 70 &&
                      ' — short; there is room for more if it helps.'}
                    {!services.metaDescription && services.intro && ' (using the introduction)'}
                  </>
                )}
              </p>
            </>
          )}
        </Field>
      </Panel>

      <Panel title="Services">
        <p className="py-4 text-[0.8125rem] leading-[1.45] text-subtle">
          Each one becomes a numbered block on the page, in this order. Put the
          strongest offer first — it is the one most people read.
        </p>

        {services.items.length === 0 && (
          <p className="py-4 text-[0.9375rem] leading-[1.5] text-muted">
            No services yet. The page will show just the heading until you add one.
          </p>
        )}

        {services.items.map((service, index) => (
          <ItemCard
            key={index}
            index={index}
            title={service.title.trim() || `Service ${index + 1}`}
            onRemove={() => setItems(services.items.filter((_, i) => i !== index))}
            onMoveUp={() => setItems(moveItem(services.items, index, -1))}
            onMoveDown={() => setItems(moveItem(services.items, index, 1))}
          >
            <Field label="Name" hint="Short. Two to five words.">
              {(id) => (
                <TextInput
                  id={id}
                  value={service.title}
                  onChange={(v) => patch(index, { title: v })}
                  placeholder="Fractional COO"
                />
              )}
            </Field>

            <Field
              label="What they get"
              hint="One sentence, in plain terms, describing what the client actually ends up with."
            >
              {(id) => (
                <TextArea
                  id={id}
                  rows={3}
                  value={orEmpty(service.promise)}
                  onChange={(v) => patch(index, { promise: orNull(v) })}
                />
              )}
            </Field>

            <Field
              label="Included"
              hint="The concrete things you deliver. Shown as a bulleted list — three or four is usually right."
            >
              {() => (
                <StringList
                  multiline
                  values={service.deliverables}
                  onChange={(v) => patch(index, { deliverables: v })}
                  placeholder="A weekly operating rhythm: targets set, numbers reviewed."
                />
              )}
            </Field>

            <Field
              label="Who it is for"
              hint="One short clause. Shown on the small label rail as “For”. Leave blank to omit."
            >
              {(id) => (
                <TextInput
                  id={id}
                  value={orEmpty(service.audience)}
                  onChange={(v) => patch(index, { audience: orNull(v) })}
                  placeholder="Founders working inside the business rather than on it."
                />
              )}
            </Field>

            <Field
              label="How it works"
              hint="The shape of the engagement — “Retainer”, “Fixed-scope build”, “Day rate”. Leave blank to omit."
            >
              {(id) => (
                <TextInput
                  id={id}
                  value={orEmpty(service.format)}
                  onChange={(v) => patch(index, { format: orNull(v) })}
                  placeholder="Fixed-scope build"
                />
              )}
            </Field>
          </ItemCard>
        ))}

        <SecondaryButton onClick={() => setItems([...services.items, emptyService()])}>
          Add service
        </SecondaryButton>
      </Panel>

      <Panel title="Closing block">
        <p className="py-4 text-[0.8125rem] leading-[1.45] text-subtle">
          The last thing on the page, above the footer, followed by your email
          address as a link. Clear both fields to remove the block entirely.
        </p>

        <Field label="Heading" hint="One line.">
          {(id) => (
            <TextInput
              id={id}
              value={orEmpty(services.ctaHeading)}
              onChange={(v) => setServices({ ctaHeading: orNull(v) })}
              placeholder="Start with the problem, not the package."
            />
          )}
        </Field>

        <Field label="Text" hint="A sentence or two under the heading.">
          {(id) => (
            <TextArea
              id={id}
              rows={3}
              value={orEmpty(services.ctaBody)}
              onChange={(v) => setServices({ ctaBody: orNull(v) })}
            />
          )}
        </Field>
      </Panel>
    </div>
  );
}
