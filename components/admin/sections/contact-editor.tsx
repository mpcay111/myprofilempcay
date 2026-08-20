'use client';

import type { SectionEditorProps } from '@/components/admin/editor';
import type { SocialLink } from '@/lib/content/schema';
import {
  Field,
  ItemCard,
  Panel,
  SecondaryButton,
  TextInput,
  Toggle,
  moveItem,
} from '@/components/admin/ui';

/**
 * Contact details and social links. Section order and the menu labels moved
 * to their own tab once sections became reorderable.
 *
 * These three belong together because they are the parts of the page a reader
 * uses to go somewhere — an address, a link, a jump. All of them fail quietly
 * rather than loudly (an unfinished URL renders as plain text, a nav id that
 * matches nothing simply never highlights), so this editor's job is to make
 * those quiet failures visible while they are still being edited.
 */

/** The section ids the public page actually renders. A nav item pointing
 *  anywhere else is not an error, it just never highlights — so we warn. */

// New items are seeded with valid values rather than blanks. An empty string
// fails the schema's min(1) and the nav id regex, so a blank default turns
// "Add" followed by "Save" into a raw validation error naming an array index —
// which the owner cannot map back to a card on screen.
const emptySocial = (): SocialLink => ({
  label: 'LinkedIn',
  href: 'https://',
  handle: 'Your name',
});

/** A placeholder like https://linkedin.com/in/[username] is still a template,
 *  and the public page renders those as plain text instead of a link. */
const isPlaceholder = (href: string) => href.includes('[');

function Note({ children }: { children: string }) {
  return (
    <p className="mt-2 text-[0.8125rem] leading-[1.45] text-accent">{children}</p>
  );
}

export function ContactEditor({ content, onChange }: SectionEditorProps) {
  const setSocials = (socials: SocialLink[]) => onChange({ ...content, socials });

  const updateSocial = (index: number, patch: Partial<SocialLink>) =>
    setSocials(content.socials.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  return (
    <div>
      <Panel title="Contact">
        <Field
          label="Email address"
          hint="The main call to action on the page — every “get in touch” link goes here."
        >
          {(id) => (
            <TextInput
              id={id}
              value={content.email}
              onChange={(v) => onChange({ ...content, email: v })}
              placeholder="you@example.com"
            />
          )}
        </Field>

        <Field
          label="Publish phone number"
          hint="Your phone number is published on a public page that anyone, including scrapers, can read. A resume goes to people you chose; a website does not."
        >
          {(id) => (
            <Toggle
              id={id}
              checked={content.showPhone}
              onChange={(v) => onChange({ ...content, showPhone: v })}
              label={content.showPhone ? 'Shown on the public page' : 'Hidden from the public page'}
            />
          )}
        </Field>

        <Field
          label="Phone number"
          hint={
            content.showPhone
              ? 'Shown on the public page, exactly as typed here.'
              : 'Saved but not published. Turn “Publish phone number” on to show it.'
          }
        >
          {(id) => (
            <div className={content.showPhone ? undefined : 'opacity-60'}>
              <TextInput
                id={id}
                value={content.phone}
                onChange={(v) => onChange({ ...content, phone: v })}
                placeholder="+63 900 000 0000"
              />
              {!content.showPhone && <Note>Currently hidden — nobody sees this.</Note>}
            </div>
          )}
        </Field>
      </Panel>

      <Panel title="Links">
        {content.socials.map((social, index) => (
          <ItemCard
            key={index}
            index={index}
            title={social.label || 'Link'}
            onRemove={() => setSocials(content.socials.filter((_, i) => i !== index))}
            onMoveUp={() => setSocials(moveItem(content.socials, index, -1))}
            onMoveDown={() => setSocials(moveItem(content.socials, index, 1))}
          >
            <Field label="Name" hint="The site this points to, e.g. LinkedIn or GitHub.">
              {(id) => (
                <TextInput
                  id={id}
                  value={social.label}
                  onChange={(v) => updateSocial(index, { label: v })}
                  placeholder="LinkedIn"
                />
              )}
            </Field>

            <Field
              label="Address"
              hint="The full URL, starting with https://. While it still contains [square brackets] the page shows the name as plain text instead of a working link."
            >
              {(id) => (
                <>
                  <TextInput
                    id={id}
                    value={social.href}
                    onChange={(v) => updateSocial(index, { href: v })}
                    placeholder="https://linkedin.com/in/your-name"
                    mono
                  />
                  {isPlaceholder(social.href) && (
                    <Note>
                      Still a placeholder — replace the [square brackets] with your real address
                      or this stays unclickable.
                    </Note>
                  )}
                </>
              )}
            </Field>

            <Field label="Display text" hint="What the reader sees — usually your name or handle.">
              {(id) => (
                <TextInput
                  id={id}
                  value={social.handle}
                  onChange={(v) => updateSocial(index, { handle: v })}
                  placeholder="Mark Anthony Cayanan"
                />
              )}
            </Field>
          </ItemCard>
        ))}

        <SecondaryButton onClick={() => setSocials([...content.socials, emptySocial()])}>
          Add link
        </SecondaryButton>
      </Panel>

    </div>
  );
}
