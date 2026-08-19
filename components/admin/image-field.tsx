'use client';

import { useEffect, useRef, useState } from 'react';
import { IconButton } from '@/components/admin/ui';

/**
 * Upload-or-clear control for a single image reference.
 *
 * The preview uses a plain <img> rather than next/image on purpose: this is an
 * admin tool showing an image the user just picked, often before it has been
 * uploaded at all, and next/image's optimiser cannot handle a blob: URL.
 */
export function ImageField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * The upload resolves after an await, by which time the `onChange` captured
   * when it started may be stale — it closes over the document as it was
   * before the upload. Calling that stale callback writes an old snapshot back
   * over the top, silently discarding anything typed while the file was in
   * flight. Not one field: the whole document.
   *
   * Holding the current callback in a ref means the write always lands on the
   * latest document, whatever else changed meanwhile.
   */
  const latestOnChange = useRef(onChange);
  useEffect(() => {
    latestOnChange.current = onChange;
  });

  async function upload(file: File) {
    setBusy(true);
    setError(null);

    try {
      const body = new FormData();
      body.append('file', file);

      const response = await fetch('/api/admin/upload', { method: 'POST', body });
      const result = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !result.url) {
        setError(result.error ?? 'Upload failed.');
        return;
      }

      latestOnChange.current(result.url);
    } catch {
      setError('Upload failed — check your connection.');
    } finally {
      setBusy(false);
      // Clear the input so picking the same file twice still fires onChange.
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div className="py-4">
      <p className="label">{label}</p>
      {hint && <p className="mt-2 text-[0.8125rem] leading-[1.45] text-subtle">{hint}</p>}

      {value ? (
        <div className="mt-3 flex items-start gap-4">
          <div className="min-w-0 flex-1 border border-border bg-surface p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt=""
              className="h-auto max-h-40 w-full object-contain"
            />
            <p className="mt-2 truncate font-mono text-[0.6875rem] text-subtle" title={value}>
              {value}
            </p>
          </div>
          <IconButton label={`Remove ${label}`} onClick={() => onChange(null)}>
            ×
          </IconButton>
        </div>
      ) : (
        <p className="mt-3 text-[0.875rem] text-subtle">
          No image. The section renders its typographic fallback.
        </p>
      )}

      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        className="label mt-4 border border-border px-3 py-2 transition-colors hover:border-border-strong hover:text-foreground focus-visible:border-accent focus-visible:text-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
      </button>

      {error && (
        <p role="alert" className="mt-3 border-l-2 border-accent pl-3 text-[0.875rem] text-muted">
          {error}
        </p>
      )}
    </div>
  );
}
