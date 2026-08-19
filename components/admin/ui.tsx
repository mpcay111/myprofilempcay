'use client';

import { useId, type ReactNode } from 'react';

/**
 * Form primitives for the admin.
 *
 * These are intentionally plain — hairline underlines, mono labels, the same
 * tokens as the public site. The admin is a tool the owner uses alone, so it
 * should be legible and fast rather than decorated, and reusing the site's own
 * palette means there is one set of colours to maintain rather than two.
 */

const inputBase =
  'w-full border-b border-border bg-transparent pb-2 text-[0.9375rem] leading-[1.5] text-foreground outline-none transition-colors focus:border-accent';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="py-4">
      <label htmlFor={id} className="label block">
        {label}
      </label>
      {hint && <p className="mt-2 text-[0.8125rem] leading-[1.45] text-subtle">{hint}</p>}
      <div className="mt-3">{children(id)}</div>
    </div>
  );
}

export function TextInput({
  id,
  value,
  onChange,
  placeholder,
  mono = false,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputBase} ${mono ? 'font-mono text-[0.875rem]' : ''}`}
    />
  );
}

export function TextArea({
  id,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      id={id}
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputBase} resize-y`}
    />
  );
}

export function Toggle({
  id,
  checked,
  onChange,
  label,
}: {
  id?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-accent"
      />
      <span className="text-[0.9375rem] text-foreground">{label}</span>
    </label>
  );
}

/**
 * An editable list of short strings — stack entries, tags, highlights.
 *
 * Rows are keyed by index rather than value, which is normally a mistake, but
 * here the value IS what the user is editing: keying by it would remount the
 * input on every keystroke and lose the caret.
 */
export function StringList({
  values,
  onChange,
  placeholder,
  multiline = false,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const set = (index: number, v: string) => {
    const next = [...values];
    next[index] = v;
    onChange(next);
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= values.length) return;
    const next = [...values];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div>
      <ul role="list" className="space-y-3">
        {values.map((value, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="label mt-3 w-6 shrink-0 tabular-nums" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>

            {multiline ? (
              <textarea
                value={value}
                rows={2}
                placeholder={placeholder}
                aria-label={`Item ${index + 1}`}
                onChange={(e) => set(index, e.target.value)}
                className={`${inputBase} resize-y`}
              />
            ) : (
              <input
                type="text"
                value={value}
                placeholder={placeholder}
                aria-label={`Item ${index + 1}`}
                onChange={(e) => set(index, e.target.value)}
                className={inputBase}
              />
            )}

            <div className="mt-1 flex shrink-0 gap-1">
              <IconButton label={`Move item ${index + 1} up`} onClick={() => move(index, -1)} disabled={index === 0}>
                ↑
              </IconButton>
              <IconButton
                label={`Move item ${index + 1} down`}
                onClick={() => move(index, 1)}
                disabled={index === values.length - 1}
              >
                ↓
              </IconButton>
              <IconButton
                label={`Remove item ${index + 1}`}
                onClick={() => onChange(values.filter((_, i) => i !== index))}
              >
                ×
              </IconButton>
            </div>
          </li>
        ))}
      </ul>

      <SecondaryButton onClick={() => onChange([...values, ''])}>Add item</SecondaryButton>
    </div>
  );
}

export function IconButton({
  children,
  label,
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="h-7 w-7 border border-border text-[0.875rem] leading-none text-subtle transition-colors hover:border-border-strong hover:text-foreground focus-visible:border-accent focus-visible:text-accent disabled:cursor-not-allowed disabled:opacity-30"
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="label mt-5 border border-border px-3 py-2 transition-colors hover:border-border-strong hover:text-foreground focus-visible:border-accent focus-visible:text-accent"
    >
      {children}
    </button>
  );
}

/** A titled block within a section editor. */
export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-border py-8 first:border-t-0 first:pt-0">
      <h3 className="text-[1.0625rem] font-semibold tracking-[-0.01em] text-foreground">
        {title}
      </h3>
      <div className="mt-4 divide-y divide-border">{children}</div>
    </section>
  );
}

/** A removable card for one item in a repeated collection. */
export function ItemCard({
  index,
  title,
  onRemove,
  onMoveUp,
  onMoveDown,
  children,
}: {
  index: number;
  title: string;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-border py-6 first:border-t-0">
      <div className="flex items-baseline justify-between gap-4">
        <h4 className="label text-accent">
          {String(index + 1).padStart(2, '0')} · {title || 'Untitled'}
        </h4>
        <div className="flex shrink-0 gap-1">
          <IconButton label={`Move ${title} up`} onClick={onMoveUp}>↑</IconButton>
          <IconButton label={`Move ${title} down`} onClick={onMoveDown}>↓</IconButton>
          <IconButton label={`Remove ${title}`} onClick={onRemove}>×</IconButton>
        </div>
      </div>
      <div className="mt-2 divide-y divide-border">{children}</div>
    </div>
  );
}

/** Reorders an array immutably. Shared by every collection editor so the
 *  move-up/move-down semantics cannot drift between sections. */
export function moveItem<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
