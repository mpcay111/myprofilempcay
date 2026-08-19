'use client';

import { useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import type { SiteContent } from '@/lib/content/schema';
import { saveContentAction, type SaveState } from '@/app/admin/actions';

import { IdentityEditor } from '@/components/admin/sections/identity-editor';
import { ProjectsEditor } from '@/components/admin/sections/projects-editor';
import { ExperienceEditor } from '@/components/admin/sections/experience-editor';
import { ScopeEditor } from '@/components/admin/sections/scope-editor';
import { ExpertiseEditor } from '@/components/admin/sections/expertise-editor';
import { AboutEditor } from '@/components/admin/sections/about-editor';
import { ContactEditor } from '@/components/admin/sections/contact-editor';

/**
 * The admin editor.
 *
 * The whole document is held in one piece of state and posted whole on save,
 * because the store is a single JSON row. That also means the Save button is
 * honest: it writes exactly what is on screen, and there is no partial-save
 * state where one section is newer than another.
 *
 * Every section editor takes the same two props, so adding a section is a tab
 * entry and a component, not a new plumbing path.
 */

export type SectionEditorProps = {
  content: SiteContent;
  onChange: (next: SiteContent) => void;
};

const TABS = [
  { id: 'identity', label: 'Identity', Component: IdentityEditor },
  { id: 'work', label: 'Work', Component: ProjectsEditor },
  { id: 'experience', label: 'Experience', Component: ExperienceEditor },
  { id: 'scope', label: 'Scope', Component: ScopeEditor },
  { id: 'expertise', label: 'Expertise', Component: ExpertiseEditor },
  { id: 'about', label: 'About', Component: AboutEditor },
  { id: 'contact', label: 'Contact', Component: ContactEditor },
] as const;

const initialSaveState: SaveState = { ok: false, message: null };

function SaveButton({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || !dirty}
      className="border border-border-strong px-5 py-2.5 text-[0.9375rem] font-medium text-foreground transition-colors hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent disabled:cursor-not-allowed disabled:opacity-40"
    >
      {pending ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
    </button>
  );
}

export function Editor({ initial }: { initial: SiteContent }) {
  const [content, setContent] = useState<SiteContent>(initial);
  const [active, setActive] = useState<(typeof TABS)[number]['id']>('identity');
  const [state, formAction] = useFormState(saveContentAction, initialSaveState);

  // Cheap deep comparison against what was loaded. The document is small and
  // this only runs on render, so serialising is fine and avoids threading a
  // dirty flag through every nested setter.
  const serialised = useMemo(() => JSON.stringify(content), [content]);
  const dirty = serialised !== JSON.stringify(initial);

  const ActiveEditor = TABS.find((t) => t.id === active)!.Component;

  return (
    <div className="pb-32">
      <nav aria-label="Content sections" className="border-b border-border">
        <ul role="list" className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((tab) => {
            const isActive = tab.id === active;
            return (
              <li key={tab.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setActive(tab.id)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`label border-b-2 px-4 py-3 transition-colors ${
                    isActive
                      ? 'border-accent text-foreground'
                      : 'border-transparent hover:text-foreground focus-visible:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-10">
        <ActiveEditor content={content} onChange={setContent} />
      </div>

      {/* Save bar. Fixed, because the section editors are long and a save
          button at the bottom of a 40-field form is a button nobody finds. */}
      <form
        action={formAction}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm"
      >
        <input type="hidden" name="document" value={serialised} />

        <div className="container-grid flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="min-w-0 flex-1">
            {state.message ? (
              <p
                role="status"
                aria-live="polite"
                className={`text-[0.875rem] leading-[1.45] ${
                  state.ok ? 'text-muted' : 'text-foreground'
                }`}
              >
                {state.ok ? '✓ ' : '✕ '}
                {state.message}
              </p>
            ) : (
              <p className="label">
                {dirty ? 'Unsaved changes' : 'No changes'}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              name="note"
              placeholder="Note for this revision (optional)"
              aria-label="Revision note"
              className="hidden w-56 border-b border-border bg-transparent pb-1.5 text-[0.875rem] text-foreground outline-none transition-colors focus:border-accent sm:block"
            />
            <SaveButton dirty={dirty} />
          </div>
        </div>
      </form>
    </div>
  );
}
